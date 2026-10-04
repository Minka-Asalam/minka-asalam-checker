// build-batch.mjs — the joined package's input builder (2026-10-02). Turns the listening step's result files
// (mobile/scripts/tag-with-gemini.ts --claims-only, source units by default since c910b7e) into the checker's
// batch-<id>.json files, one per video.
//
//   node build-batch.mjs <out dir> <speaker name> <scholar|creator> <result-<id>.json> [<result-<id>.json> ...]
//
// What it does, and what it no longer does:
//   - keeps every claim's unit, pieces [{timestamp, timestamp_end, quote, voice, cue}] and inside (the number of the
//     claim it is told inside, else 0) — prep-claims.mjs dropped them, so the checker's CONTINUATION FIRST step and
//     the builder's merge could not see a unit;
//   - fetches the canonical verse text for every "quran" claim with a surah:ayah reference from quran.com
//     (text_imlaei + the Hilali-Khan translation, id 203 — the same as prep-claims.mjs), at most five verses a claim;
//   - writes NO dorar fields: on the dorar path the checker searches dorar itself, mid-run, for every hadith claim
//     (the old hadith-keys step and the browser lookup are retired; key_ar is kept as a hint of the known wording).
// Prints one line per video and writes index.json ([{id, file}]) for the workflow's `videos` arg.
import fs from 'node:fs';
import path from 'node:path';

const [OUT, SPEAKER, KIND, ...FILES] = process.argv.slice(2);
if (!OUT || !SPEAKER || !['scholar', 'creator'].includes(KIND) || !FILES.length) {
  console.error('usage: node build-batch.mjs <out dir> <speaker name> <scholar|creator> <result-<id>.json> [...]');
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });
const CACHE = path.join(OUT, 'quran-cache.json');
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
const TRANSLATION_ID = '203';
async function verse(key) {
  if (cache[key]) return cache[key];
  for (let k = 0; k < 3; k++) {
    try {
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?fields=text_imlaei&translations=${TRANSLATION_ID}`);
      if (!res.ok) { await new Promise((r) => setTimeout(r, 1500)); continue; }
      const j = await res.json();
      const ar = j?.verse?.text_imlaei ?? null;
      const tr = (j?.verse?.translations ?? []).find((t) => String(t.resource_id) === TRANSLATION_ID);
      const en = tr ? String(tr.text).replace(/<sup[^>]*>.*?<\/sup>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : null;
      if (ar) { cache[key] = { ar, en }; fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1)); return cache[key]; }
    } catch { await new Promise((r) => setTimeout(r, 1500)); }
  }
  return null;
}
const refRe = /^(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?$/;

const index = [];
for (const f of FILES) {
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  const id = r.id || r.video_id || (path.basename(f).match(/^result-(.+)\.json$/) || [])[1];
  if (!id) { console.error(`no video id in ${f}`); process.exit(1); }
  const claims = [];
  let verses = 0;
  for (const [n, c] of (r.claims || []).entries()) {
    const row = {
      i: n + 1, kind: c.kind, timestamp: c.timestamp, timestamp_end: c.timestamp_end || '', quote: c.quote,
      attribution: c.attribution || '', reference: c.reference || '', stated_as: c.stated_as || '', claim_en: c.claim_en || '',
      key_ar: c.key_ar || null,
      unit: c.unit ?? null, pieces: Array.isArray(c.pieces) ? c.pieces : null, inside: c.inside ?? 0,
      verse_text: null, verse_en: null,
    };
    const m = refRe.exec(String(c.reference || '').trim());
    if (c.kind === 'quran' && m) {
      const from = +m[2], to = m[3] ? +m[3] : from;
      const texts = [], ens = [];
      for (let a = from; a <= Math.min(to, from + 4); a++) { const t = await verse(`${m[1]}:${a}`); if (t) { texts.push(`${m[1]}:${a} ${t.ar}`); if (t.en) ens.push(t.en); verses++; } }
      if (texts.length) { row.verse_text = texts.join('\n'); row.verse_key = `${m[1]}:${from}${to > from ? '-' + Math.min(to, from + 4) : ''}`; }
      if (ens.length) { row.verse_en = ens.join(' '); row.verse_translation_id = TRANSLATION_ID; }
    }
    claims.push(row);
  }
  const video = { id, title: r.title || null, speaker: SPEAKER, speaker_kind: KIND, language: r.language || 'ar', units: !!r.units, extractor_model: r.model || null, claims };
  const file = `batch-${id}.json`;
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(video, null, 1));
  index.push({ id, file });
  const kinds = {};
  for (const c of claims) kinds[c.kind] = (kinds[c.kind] || 0) + 1;
  console.log(`${id}: ${claims.length} claims (${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ')}), ${claims.filter((c) => c.pieces && c.pieces.length > 1).length} in several pieces, ${claims.filter((c) => c.inside).length} told inside another, ${verses} verses fetched; listened by ${r.model || '?'}${r.units ? ', source units' : ', ONE-SENTENCE cut'}`);
  if (/lite/i.test(r.model || '')) console.log(`  WARNING: ${id} was listened by a LITE model; lite under-extracts. Re-listen on a full model before checking.`);
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
console.log(`index.json: ${index.length} videos`);

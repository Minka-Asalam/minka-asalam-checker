// Recitation mode, for clips Gemini refuses with "copyright/recitation" (its filter blocks reproducing long
// recited text). Same deep prompt and tree as tag-with-gemini.ts (read from its --dry-run prompt.txt), but every
// verbatim field is replaced by a reference: for a recited passage Gemini gives the surah and the first and last
// verse numbers and their seconds, never the words; the verse text comes from quran.com in build-batch.mjs.
// The owner's rule (5 Oct): a recitation's source line names the surah and its start and end verses.
//   node recite.mjs <prompt.txt> <audio.m4a> [...]   -> listen/result-<id>.json (marked mode "recitation")
import fs from 'node:fs';
import path from 'node:path';
const KEY = fs.readFileSync('D:/Deeni/.env', 'utf8').match(/^GEMINI_API_KEY=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '');
const [PROMPT, ...FILES] = process.argv.slice(2);
let prompt = fs.readFileSync(PROMPT, 'utf8');
prompt = `IMPORTANT FOR THIS AUDIO: it is, or contains, a recitation of the Qur'an. NEVER write out recited verses or any long verbatim text. Wherever the shape below asks for a verbatim "quote" or "quote_ar", write instead a short ENGLISH description (e.g. "recites al-Ra'd 13:1-7"), never the Arabic words. For every recited passage give a "quran" claim whose "reference" is surah:first-last (e.g. 13:1-7), with the second the recitation of that passage begins and ends.\n\n` + prompt;
const MODELS = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.8-flash'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const f of FILES) {
  const id = path.basename(f, '.m4a');
  const data = fs.readFileSync(f).toString('base64');
  let done = false;
  for (let a = 0; a < 10 && !done; a++) {
    const model = MODELS[a % MODELS.length];
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', { method: 'POST', headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, input: [{ type: 'text', text: prompt }, { type: 'audio', data, mime_type: 'audio/mp4' }] }) });
    const t = await r.text();
    if (!r.ok) { console.log(`  ${model} ${r.status} ${t.slice(0, 120)}`); await sleep(20000); continue; }
    const j = JSON.parse(t);
    const texts = [];
    const walk = (o) => { if (!o || typeof o !== 'object') return; if (typeof o.text === 'string') texts.push(o.text); for (const k in o) walk(o[k]); };
    walk(j);
    let out = null;
    for (const txt of texts.reverse()) { const m = txt.match(/\{[\s\S]*\}/); if (m) { try { out = JSON.parse(m[0]); break; } catch {} } }
    if (!out) { console.log('  no JSON', id); await sleep(5000); continue; }
    out.model = model; out.mode = 'recitation'; out.units = true; out.claims_mode = 'full';
    for (const c of out.claims || []) if (Array.isArray(c.pieces) && c.pieces.length) { c.timestamp = c.timestamp || c.pieces[0].timestamp; c.timestamp_end = c.timestamp_end || c.pieces[c.pieces.length - 1].timestamp_end; c.quote = c.quote || c.pieces.map((p) => p.quote).join(' … '); }
    fs.writeFileSync(`listen/result-${id}.json`, JSON.stringify(out, null, 2));
    console.log(`${id}: ${model}, tags ${(out.tags || []).length}, claims ${(out.claims || []).map((c) => c.kind + ' ' + (c.reference || '')).join('; ')}`);
    done = true;
  }
  await sleep(30000);
}

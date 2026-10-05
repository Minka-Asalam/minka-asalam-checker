// The re-test the owner asked for (5 Oct 19:45): Checker 3's own paths (verses by script, hadith by the
// tree) on the library clips, scored against HIS 5 Oct review of Checker 2's run on the same clips.
// Same inputs as that run (its batch files, from the same listen), so only the checking differs.
// Quotes Checker 3 hands to Checker 2 are not re-run: for those, Checker 3 IS Checker 2, already reviewed.
//   node retest/retest-c3.mjs [outDir]
import fs from 'node:fs';
import path from 'node:path';
import { Spend } from '../src/claude.mjs';
import { compare } from '../src/c3/verses2.mjs';
import { hadithPath } from '../src/c3/hadith.mjs';

const CLIP = 'D:/Deeni Docs/curation/2026-10-05 Clip library run/check';
const OUT = process.argv[2] || 'D:/checker-runs/retest-c3-2026-10-05';
fs.mkdirSync(OUT, { recursive: true });
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

// The key: Checker 2's reviewed run with the owner's corrections applied.
const key = new Map();
for (const v of J(`${CLIP}/run-all.json`).videos) for (const c of v.result.claims) key.set(`${v.id}#${c.i}`, c);
for (const it of J(`${CLIP}/corrections.json`).items) {
  const k = `${it.video}#${it.i}`; const c = { ...(key.get(k) || {}), ...(it.claim || {}) };
  if (it.parts_replace) c.parts = it.parts_replace;
  key.set(k, c);
}
const decisions = {};
const DEC = 'D:/Deeni Docs/curation/2026-10-05 Clip library run/decisions/claims';
for (const f of fs.readdirSync(DEC)) decisions[f.replace('.json', '').replace('__', '#')] = J(path.join(DEC, f)).decision;

const batches = J(`${CLIP}/run/index.json`).map((x) => J(`${CLIP}/run/${x.file}`)).filter((b) => (b.claims || []).length);
const spend = new Spend();
const rows = [];
const ledger = path.join(OUT, 'dorar-ledger.jsonl');
const log = (t) => fs.appendFileSync(path.join(OUT, 'log.txt'), `${t}\n`);
const t0 = Date.now();

async function one(b) {
  for (const c of b.claims.filter((x) => x.kind === 'quran' && x.verse_text)) {
    const r = compare(c.quote, c.verse_text);
    rows.push({ tag: `${b.id}#${c.i}`, path: 'verse', c3: r.state === 'matches' ? 'matches' : 'to Checker 2', detail: r.state });
  }
  const had = b.claims.filter((x) => x.kind === 'hadith' || x.kind === 'saying');
  if (had.length) {
    const h = await hadithPath(b, had, { ledger, spend, log });
    for (const rec of h.done) rows.push({ tag: `${b.id}#${rec.i}`, path: 'hadith', c3: rec.state, level: rec.level, link: rec.parts[0].source.link, book: `${rec.parts[0].source.collection} ${rec.parts[0].source.number || ''}`, note: rec.reason_en });
    for (const i of h.unfinished) rows.push({ tag: `${b.id}#${i}`, path: 'hadith', c3: 'to Checker 2' });
  }
  for (const c of b.claims) if (!rows.some((r) => r.tag === `${b.id}#${c.i}`)) rows.push({ tag: `${b.id}#${c.i}`, path: c.kind, c3: 'to Checker 2 (no own path yet)' });
}

const queue = [...batches]; const workers = Array.from({ length: 3 }, async () => { while (queue.length) await one(queue.shift()); });
await Promise.all(workers);

// Score each row against the key.
const linkOf = (c, re) => (c?.parts || []).map((p) => p.source?.link).find((l) => l && re.test(l));
for (const r of rows) {
  const k = key.get(r.tag); r.key_state = k?.state; r.key_kind = k?.flow_kind; r.decision = decisions[r.tag] || null;
  if (r.path === 'verse' && r.c3 === 'matches') {
    r.score = k?.state === 'matches' && k?.flow_kind === 'quran' ? 'agrees' : `DIFFERS (reviewed: ${k?.flow_kind} ${k?.state})`;
  } else if (r.path === 'hadith' && r.link) {
    const kl = linkOf(k, /dorar\.net/);
    r.key_link = kl || null;
    r.score = !kl ? `A HADITH WHERE THE REVIEW HAS NONE (reviewed: ${k?.flow_kind} ${k?.state})` : kl === r.link ? 'same dorar entry' : 'another dorar entry: compare';
  } else r.score = r.c3.startsWith('to Checker 2') ? 'Checker 2 (already reviewed)' : '-';
}

const count = (f) => rows.filter(f).length;
const summary = {
  clips: batches.length, quotes: rows.length, minutes: Number(((Date.now() - t0) / 60000).toFixed(1)),
  cost_usd: Number(spend.usd.toFixed(4)), cost_by_model: spend.byModel, tokens: spend.tokens,
  verses: { by_script: count((r) => r.path === 'verse' && r.c3 === 'matches'), agrees: count((r) => r.path === 'verse' && r.score === 'agrees'), to_c2: count((r) => r.path === 'verse' && r.c3 !== 'matches') },
  hadith: { with_source: count((r) => r.path === 'hadith' && r.link), same_entry: count((r) => r.score === 'same dorar entry'), other_entry: count((r) => r.score === 'another dorar entry: compare'), where_review_has_none: count((r) => String(r.score).startsWith('A HADITH')), to_c2: count((r) => r.path === 'hadith' && !r.link) },
  others_to_c2: count((r) => !['verse', 'hadith'].includes(r.path)),
};
fs.writeFileSync(path.join(OUT, 'retest.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const r of rows.filter((x) => x.path === 'hadith')) console.log(`${r.tag} | ${r.c3} | ${r.book || ''} | ${r.score} | key ${r.key_link || '-'} | ${r.note || ''}`);

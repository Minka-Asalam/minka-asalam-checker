// The verse that differs from the Mushaf (6 Oct): every verse the script does not pass, from the library clips (scored
// against the owner's 5 Oct review) and from the ten videos of method v4 (scored against the outcomes its README records:
// 3 descriptions, 1 slip in 5:38, 1 verse the reference left out, 1 qala/qālā held for a listen).
//   CHECKER_REPLAY=D:/checker-runs/retest-verses-2026-10-06/qa node retest/retest-verses.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Spend, ReplayPending } from '../src/claude.mjs';
import { compare } from '../src/c3/verses2.mjs';
import { verseDiffers } from '../src/c3/verse-differs.mjs';

const CLIP = 'D:/Deeni Docs/curation/2026-10-05 Clip library run/check';
const TEN = 'D:/Deeni Docs/Claims_Redesign_2026-10/method-v4/tests/ten-videos-verses.json';
const OUT = 'D:/checker-runs/retest-verses-2026-10-06';
fs.mkdirSync(OUT, { recursive: true });
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const key = new Map();
for (const v of J(`${CLIP}/run-all.json`).videos) for (const c of v.result.claims) key.set(`${v.id}#${c.i}`, c);
for (const it of J(`${CLIP}/corrections.json`).items) { const k = `${it.video}#${it.i}`; const c = { ...(key.get(k) || {}), ...(it.claim || {}) }; if (it.parts_replace) c.parts = it.parts_replace; key.set(k, c); }
const EXPECT_TEN = { '4-gN9WBQ_4Q#11': 'a description', '4-gN9WBQ_4Q#12': 'a description', 'tiDYQlk7_Q0#11': 'a description', 'cLTiGxU4D3E#5': 'a slip in 5:38 (he then recited it right)', 'pkH5vlUGc5U#10': 'the reference left out a verse (25:75)', 'tiDYQlk7_Q0#9': 'one letter: a moderator listens' };

const cases = [];
for (const x of J(`${CLIP}/run/index.json`)) { const b = J(`${CLIP}/run/${x.file}`); for (const c of b.claims || []) if (c.kind === 'quran' && c.verse_text) { const r = compare(c.quote, c.verse_text); if (r.state !== 'matches') { const k = key.get(`${b.id}#${c.i}`); cases.push({ tag: `${b.id}#${c.i}`, c, r, expect: `review: ${k?.state} ${(k?.parts || []).map((p) => p.exit_id + ' ' + (p.source?.link || '')).join(' ')}` }); } } }
for (const t of J(TEN)) { const c = { ...t, i: t.tag, kind: 'quran' }; const r = compare(c.quote, c.verse_text); if (r.state !== 'matches') cases.push({ tag: t.tag, c, r, expect: `v4 README: ${EXPECT_TEN[t.tag] || '?'}` }); }

const spend = new Spend(); const rows = []; let pending = 0;
await Promise.all(cases.map(async ({ tag, c, r, expect }) => {
  try {
    const rec = r.state.startsWith('one letter') ? (await import('../src/c3/verse-differs.mjs')).verseHold(c, r) : await verseDiffers(c, r, { spend });
    rows.push({ tag, said: c.quote, ref: c.verse_key || c.reference, c3: `${rec.state} ${rec.parts[0].exit_id}`, link: rec.parts[0].source?.link || '-', why: rec.reason_en, difference_ar: rec.parts[0].difference_ar, expect });
  } catch (e) { if (e instanceof ReplayPending) pending++; else throw e; }
}));
if (pending) { console.log(`${pending} of ${cases.length} verses wait for answers in ${process.env.CHECKER_REPLAY}`); process.exit(2); }
rows.sort((a, b) => cases.findIndex((x) => x.tag === a.tag) - cases.findIndex((x) => x.tag === b.tag));
const summary = { verses: rows.length, cost_usd_estimated: Number(spend.usd.toFixed(4)), per_verse_usd_estimated: Number((spend.usd / Math.max(rows.length, 1)).toFixed(4)) };
fs.writeFileSync(path.join(OUT, 'retest.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const r of rows) console.log(`\n${r.tag} (${r.ref}) | said: ${r.said.slice(0, 90)}\n  C3: ${r.c3} | ${r.link} | ${r.why}${r.difference_ar ? ` | ${r.difference_ar}` : ''}\n  EXPECTED: ${r.expect}`);

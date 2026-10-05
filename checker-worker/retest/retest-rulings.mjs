// The rulings ladder inside the worker, on a SAMPLE of the library clips' rulings (the owner, 6 Oct: "don't run the 12,
// take samples"), scored against his 5 Oct review of Checker 2's run on the same clips.
//   node retest/retest-rulings.mjs [every=3]
import fs from 'node:fs';
import path from 'node:path';
import { Spend } from '../src/claude.mjs';
import { rulingsPath } from '../src/c3/rulings.mjs';

const CLIP = 'D:/Deeni Docs/curation/2026-10-05 Clip library run/check';
const OUT = 'D:/checker-runs/retest-rulings-2026-10-06';
fs.mkdirSync(OUT, { recursive: true });
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const every = Number(process.argv[2] || 3);

const key = new Map();
for (const v of J(`${CLIP}/run-all.json`).videos) for (const c of v.result.claims) key.set(`${v.id}#${c.i}`, c);
for (const it of J(`${CLIP}/corrections.json`).items) { const k = `${it.video}#${it.i}`; const c = { ...(key.get(k) || {}), ...(it.claim || {}) }; if (it.parts_replace) c.parts = it.parts_replace; key.set(k, c); }

const all = [];
for (const x of J(`${CLIP}/run/index.json`)) { const b = J(`${CLIP}/run/${x.file}`); for (const c of b.claims || []) if (c.kind === 'ruling') all.push({ b, c }); }
const sample = all.filter((_, k) => k % every === 0);
const spend = new Spend(); const t0 = Date.now(); const rows = [];
for (const { b, c } of sample) {
  const r = await rulingsPath(b, [c], { spend, log: (t) => fs.appendFileSync(path.join(OUT, 'log.txt'), t + '\n') });
  const got = r.done[0]; const k = key.get(`${b.id}#${c.i}`);
  const src = (cl) => (cl?.parts || []).filter((p) => p.source?.link).map((p) => `${p.source.work_ar || p.source.site || ''} ${p.source.volume ? p.source.volume + '/' : ''}${p.source.page || ''} ${p.source.link}`);
  rows.push({ tag: `${b.id}#${c.i}`, said: c.quote, c3_state: got.state, c3_sources: src(got), c3_notes: got.reason_ar, key_state: k?.state, key_sources: src(k) });
}
const summary = { sample: rows.length, of: all.length, minutes: Number(((Date.now() - t0) / 60000).toFixed(1)), cost_usd: Number(spend.usd.toFixed(4)), per_ruling_usd: Number((spend.usd / Math.max(rows.length, 1)).toFixed(4)), by_model: spend.byModel,
  with_source: rows.filter((r) => r.c3_sources.length).length, reviewed_with_source: rows.filter((r) => r.key_sources.length).length };
fs.writeFileSync(path.join(OUT, 'retest.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const r of rows) console.log(`\n${r.tag.slice(0, 8)} | said: ${r.said.slice(0, 110)}\n  C3: ${r.c3_state} | ${r.c3_sources.join(' || ') || '-'}${r.c3_notes ? ` | ${r.c3_notes}` : ''}\n  REVIEWED: ${r.key_state} | ${r.key_sources.join(' || ') || '-'}`);

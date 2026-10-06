// The numbers path on the library clips' figures (the owner's 5 Oct review has only two: the pillars of Islam, and the
// 33/33/34 after prayer), plus ONE made-up worldly figure to test the owner's rule ("a worldly figure is not checked";
// it has no answer key and is marked as made up).
//   CHECKER_REPLAY=D:/checker-runs/retest-numbers-2026-10-06/qa node retest/retest-numbers.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Spend, ReplayPending } from '../src/claude.mjs';
import { numbersPath } from '../src/c3/numbers.mjs';

const CLIP = 'D:/Deeni Docs/curation/2026-10-05 Clip library run/check';
const OUT = 'D:/checker-runs/retest-numbers-2026-10-06';
fs.mkdirSync(OUT, { recursive: true });
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const key = new Map();
for (const v of J(`${CLIP}/run-all.json`).videos) for (const c of v.result.claims) key.set(`${v.id}#${c.i}`, c);
for (const it of J(`${CLIP}/corrections.json`).items) { const k = `${it.video}#${it.i}`; const c = { ...(key.get(k) || {}), ...(it.claim || {}) }; if (it.parts_replace) c.parts = it.parts_replace; key.set(k, c); }
const batches = J(`${CLIP}/run/index.json`).map((x) => J(`${CLIP}/run/${x.file}`));
const find = (s) => { const [v, i] = s.split('#'); const b = batches.find((x) => x.id.startsWith(v)); return { b, c: b.claims.find((c) => String(c.i) === i) }; };
const sample = ['c5c47362#1', '4cedc3c7#1'].map(find);
const MADE_UP = { i: 999, kind: 'number', quote: 'وتقول الدراسات إن واحدًا من كل خمسة شباب اليوم يعاني من القلق', claim_en: 'Studies say one in five young people today suffers from anxiety', attribution: '' };
sample.push({ b: sample[0].b, c: MADE_UP, madeUp: true });

const spend = new Spend(); const rows = []; let pending = 0;
const ledger = path.join(OUT, 'dorar-ledger.jsonl');
await Promise.all(sample.map(async ({ b, c, madeUp }) => {
  try {
    const r = await numbersPath(b, [c], { spend, ledger, log: (t) => fs.appendFileSync(path.join(OUT, 'log.txt'), t + '\n') });
    const got = r.done[0]; const k = madeUp ? null : key.get(`${b.id}#${c.i}`);
    const mine = got.parts.map((p) => p.source?.link).filter(Boolean); const theirs = (k?.parts || []).map((p) => p.source?.link).filter(Boolean);
    const score = madeUp ? (got.state === 'not_checked' ? 'not checked, as the rule says' : `RULE BROKEN: ${got.state}`)
      : !mine.length ? (theirs.length ? 'missed an approved source' : 'no source, none approved') : mine.some((l) => theirs.includes(l)) ? 'same source as approved' : theirs.length ? 'ANOTHER SOURCE: compare' : 'A SOURCE WHERE THE REVIEW HAS NONE';
    rows.push({ tag: madeUp ? 'made-up worldly figure' : `${b.id}#${c.i}`, said: c.quote, c3: `${got.state} ${got.parts[0].exit_id} level ${got.level}`, link: mine.join(' ') || '-', why: [got.reason_ar, got.reason_en].filter(Boolean).join(' | '), key: k ? `${k.flow_kind} ${k.state} ${theirs.join(' ')}` : '(none: made up)', score });
  } catch (e) { if (e instanceof ReplayPending) pending++; else throw e; }
}));
if (pending) { console.log(`${pending} of ${sample.length} figures wait for answers in ${process.env.CHECKER_REPLAY}`); process.exit(2); }
const summary = { figures: rows.length, cost_usd_estimated: Number(spend.usd.toFixed(4)), per_figure_usd_estimated: Number((spend.usd / Math.max(rows.length, 1)).toFixed(4)), by_model: spend.byModel };
fs.writeFileSync(path.join(OUT, 'retest.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const r of rows) console.log(`\n${r.tag} | ${r.score}\n  said: ${r.said.slice(0, 120)}\n  C3: ${r.c3} | ${r.link} | ${r.why}\n  REVIEWED: ${r.key}`);

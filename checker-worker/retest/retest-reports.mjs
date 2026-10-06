// Checker 3's reports path on a SAMPLE of the library clips' reports (the owner, 6 Oct: "take samples"), scored against his
// 5 Oct review of Checker 2's run on the same clips. Run in the test mode (CHECKER_REPLAY=<folder>, the owner: "don't use
// the API credit"): each run stops at the first unanswered question; helpers answer; run again until it completes.
//   CHECKER_REPLAY=D:/checker-runs/retest-reports-2026-10-06/qa node retest/retest-reports.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Spend, ReplayPending } from '../src/claude.mjs';
import { reportsPath } from '../src/c3/reports.mjs';

const CLIP = 'D:/Deeni Docs/curation/2026-10-05 Clip library run/check';
const OUT = 'D:/checker-runs/retest-reports-2026-10-06';
fs.mkdirSync(OUT, { recursive: true });
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
// the sample: four with an approved page in a book this PC holds, one approved in a book it does not hold, one the owner
// approved as not found, one he ruled not a claim
const SAMPLE = (process.env.SAMPLE || '8a3edb97#1,8a3edb97#3,8e797724#2,7dd1d6a5#2,040b936e#1,22b4c69a#5,4cbf4efe#1').split(',');

const key = new Map();
for (const v of J(`${CLIP}/run-all.json`).videos) for (const c of v.result.claims) key.set(`${v.id}#${c.i}`, c);
for (const it of J(`${CLIP}/corrections.json`).items) { const k = `${it.video}#${it.i}`; const c = { ...(key.get(k) || {}), ...(it.claim || {}) }; if (it.parts_replace) c.parts = it.parts_replace; key.set(k, c); }
const all = [];
for (const x of J(`${CLIP}/run/index.json`)) { const b = J(`${CLIP}/run/${x.file}`); for (const c of b.claims || []) all.push({ b, c, tag: `${b.id}#${c.i}` }); }
const sample = SAMPLE.map((s) => all.find((x) => x.tag.startsWith(s.split('#')[0]) && x.tag.endsWith(`#${s.split('#')[1]}`))).filter(Boolean);

const spend = new Spend(); const rows = []; let pending = 0;
const ledger = path.join(OUT, 'dorar-ledger.jsonl');
await Promise.all(sample.map(async ({ b, c, tag }) => {
  try {
    const r = await reportsPath(b, [c], { spend, ledger, log: (t) => fs.appendFileSync(path.join(OUT, 'log.txt'), t + '\n') });
    const got = r.done[0]; const k = key.get(tag);
    const src = (cl) => (cl?.parts || []).filter((p) => p.source?.link).map((p) => ({ link: p.source.link, at: `${p.source.work_ar || p.source.site || ''} ${p.source.volume ? p.source.volume + '/' : ''}${p.source.page || ''}`, quote: p.source.quote }));
    const mine = src(got), theirs = src(k);
    const page = (l) => { const m = /usul\.ai\/t\/([^/]+)\/(\d+)/.exec(l || ''); return m ? [m[1], Number(m[2])] : [l, null]; };
    const score = !mine.length ? (theirs.length ? 'missed an approved source' : 'no source, none approved')
      : !theirs.length ? 'A SOURCE WHERE THE REVIEW HAS NONE: compare'
        : mine.some((m) => theirs.some((t) => m.link === t.link)) ? 'same page as approved'
          : mine.some((m) => theirs.some((t) => { const [a, x] = page(m.link), [bb, y] = page(t.link); return a === bb && x != null && Math.abs(x - y) <= 3; })) ? 'near the approved page'
            : 'ANOTHER SOURCE: compare';
    rows.push({ tag, said: c.quote, listen_kind: c.kind, c3_state: got.state, c3_parts: got.parts.map((p) => `${p.kind}:${p.exit_id}`), c3_sources: mine, c3_notes: got.reason_ar || got.reason_en, key_kind: k?.flow_kind, key_state: k?.state, key_sources: theirs, score });
  } catch (e) { if (e instanceof ReplayPending) pending++; else throw e; }
}));
if (pending) { console.log(`${pending} of ${sample.length} quotes wait for answers in ${process.env.CHECKER_REPLAY}`); process.exit(2); }
rows.sort((a, b) => SAMPLE.findIndex((s) => a.tag.startsWith(s.split('#')[0]) && a.tag.endsWith('#' + s.split('#')[1])) - SAMPLE.findIndex((s) => b.tag.startsWith(s.split('#')[0]) && b.tag.endsWith('#' + s.split('#')[1])));
const n = (f) => rows.filter(f).length;
const summary = { sample: rows.length, cost_usd_estimated: Number(spend.usd.toFixed(4)), per_quote_usd_estimated: Number((spend.usd / Math.max(rows.length, 1)).toFixed(4)), by_model: spend.byModel,
  with_source: n((r) => r.c3_sources.length), approved_with_source: n((r) => r.key_sources.length), same_or_near: n((r) => /same page|near the approved/.test(r.score)),
  missed: n((r) => r.score === 'missed an approved source'), to_compare: n((r) => /compare/.test(r.score)), state_agrees: n((r) => r.c3_state === r.key_state) };
fs.writeFileSync(path.join(OUT, 'retest.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const r of rows) console.log(`\n${r.tag.slice(0, 8)}#${r.tag.split('#')[1]} | ${r.score}\n  said: ${r.said.slice(0, 120)}\n  C3: ${r.c3_state} ${r.c3_parts.join(' ')} | ${r.c3_sources.map((s) => s.at + ' ' + s.link).join(' || ') || '-'}${r.c3_notes ? ` | ${r.c3_notes}` : ''}\n  REVIEWED: ${r.key_kind} ${r.key_state} | ${r.key_sources.map((s) => s.at + ' ' + s.link).join(' || ') || '-'}`);

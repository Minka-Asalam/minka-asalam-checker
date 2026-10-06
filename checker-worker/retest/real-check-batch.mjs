// A REAL check (6 Oct, the owner's ask) of one library clip through the wired Checker 3, with the real models and the paid
// key, on the clip's STORED listen (the same quotes the owner reviewed; the library clips live in the app, not on YouTube,
// so the listen and gates 1-2 are skipped: unchanged, and tested end to end by S2 at 05:18). Then the worker's own steps:
// the two automatic gates, the result builder; scored against the owner's review (corrections applied).
//   node retest/real-check-batch.mjs <clip id prefix>
import fs from 'node:fs';
import path from 'node:path';
import { Spend } from '../src/claude.mjs';
import { runChecker3 } from '../src/checker3.mjs';
import { runGates, applyGates } from '../src/gates.mjs';
import { buildResult } from '../src/result.mjs';
import { CAP_USD } from '../src/run-check.mjs';

if (process.env.CHECKER_REPLAY) { console.error('this is the REAL check: unset CHECKER_REPLAY'); process.exit(2); }
const CLIP = 'D:/Deeni Docs/curation/2026-10-05 Clip library run/check';
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const prefix = process.argv[2]; if (!prefix) { console.error('usage: node retest/real-check-batch.mjs <clip id prefix>'); process.exit(2); }
const entry = J(`${CLIP}/run/index.json`).find((x) => x.file.includes(prefix));
const batch = J(`${CLIP}/run/${entry.file}`);
const runDir = `D:/checker-runs/real-check-2026-10-06/${batch.id}`; fs.mkdirSync(runDir, { recursive: true });
const batchFile = `batch-${batch.id}.json`; fs.writeFileSync(path.join(runDir, batchFile), JSON.stringify(batch, null, 1));

const spend = new Spend(); const t0 = Date.now(); const say = (t) => { fs.appendFileSync(path.join(runDir, 'log.txt'), `${t}\n`); console.log(`  ${String(t).split('\n')[0]}`); };
say(`clip ${batch.id} (${batch.speaker} — ${batch.title}): ${batch.claims.length} quotes (${batch.claims.map((c) => c.kind).join(', ')}), cap $${CAP_USD}`);
const ret = await runChecker3(runDir, batchFile, batch, { spend, log: say, capUsd: CAP_USD, onProgress: (d) => say(`progress: ${d} of ${batch.claims.length}`) });
const runFile = path.join(runDir, 'run.json'); fs.writeFileSync(runFile, JSON.stringify(ret, null, 1));
const g = await runGates(runDir, runFile, [path.join(runDir, batchFile)], say);
const changed = applyGates(ret, g.bad);
say(`gates: dorar-links ${g.dorarLinks}, gradings ${g.gradings}; ${changed} part(s) set to pending`);
const result = buildResult({ ret, batch, engine: 'checker3', rulesVersion: '1' });
fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(result, null, 1));

// the owner's review of the same clip, his corrections applied
const key = new Map();
for (const v of J(`${CLIP}/run-all.json`).videos) if (v.id === batch.id) for (const c of v.result.claims) key.set(c.i, c);
for (const it of J(`${CLIP}/corrections.json`).items) if (it.video === batch.id) { const c = { ...(key.get(it.i) || {}), ...(it.claim || {}) }; if (it.parts_replace) c.parts = it.parts_replace; key.set(it.i, c); }
const links = (c) => (c?.parts || []).map((p) => p.source?.link).filter(Boolean);
console.log(`\nCOST $${spend.usd.toFixed(4)} (${Object.entries(spend.byModel).map(([m, u]) => `${m} ${u.toFixed(4)}`).join(', ')}) · ${((Date.now() - t0) / 60000).toFixed(1)} min · route ${JSON.stringify(ret.route)}`);
for (const c of batch.claims) {
  const got = ret.videos[0].result.claims.find((x) => x.i === c.i); const k = key.get(c.i);
  console.log(`\n#${c.i} ${c.kind} | said: ${c.quote.slice(0, 110)}\n  C3: ${got?.flow_kind} ${got?.state} | ${links(got).join(' ') || '-'} | ${(got?.reason_en || got?.reason_ar || '').slice(0, 220)}\n  REVIEWED: ${k?.flow_kind} ${k?.state} | ${links(k).join(' ') || '-'}`);
}
console.log(`\nresult.json counts: ${JSON.stringify(result.counts || result.summary || {}).slice(0, 300)}`);

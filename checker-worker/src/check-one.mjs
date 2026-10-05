// One check from the command line, without the database (for testing and for judges who run it themselves):
//   node src/check-one.mjs <youtube id or link> [--engine=checker2|checker3]
import { runCheck } from './run-check.mjs';

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
const engine = (args.find((a) => a.startsWith('--engine=')) || '--engine=checker2').slice(9);
const m = /(?:v=|youtu\.be\/|shorts\/|live\/|^)([A-Za-z0-9_-]{11})(?:[?&#/]|$)/.exec(target || '');
if (!m) { console.error('usage: node src/check-one.mjs <youtube id or link> [--engine=checker2|checker3]'); process.exit(2); }

const t0 = Date.now();
const r = await runCheck({ runId: `cli-${engine}-${m[1]}`,
  youtubeId: m[1], engine,
  progress: (p) => console.log(`  step: ${p.step}${p.total ? ` ${p.done}/${p.total}` : ''}`),
  log: (t) => console.log(t.split('\n')[0]),
});
console.log(JSON.stringify({ status: r.status, refusal: r.refusal, counted: r.counted, info: r.info, cost_usd: Number(r.costUsd.toFixed(4)), minutes: Number(((Date.now() - t0) / 60000).toFixed(1)), result: r.result }, null, 1));

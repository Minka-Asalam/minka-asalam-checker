// A PLUMBING test of the wired Checker 3 (6 Oct): four library clips that hold every kind (verses incl. one that
// differs, the poem, sayings, "other", rulings, hadith) plus one number and one history quote added to a copy of a batch.
// Test mode with BLANK answers ("{}") to every model question, so it spends nothing and checks only the routing, the
// searches, the record shapes and that every quote gets a record. Not a measure of the answers.
//   node retest/smoke-checker3.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Spend, ReplayPending } from '../src/claude.mjs';

const ROOT = 'D:/checker-runs/smoke-checker3-2026-10-06';
process.env.CHECKER_REPLAY = path.join(ROOT, 'qa');
fs.mkdirSync(process.env.CHECKER_REPLAY, { recursive: true });
const { runChecker3 } = await import('../src/checker3.mjs');
const LIB = 'D:/Deeni Docs/curation/2026-10-05 Clip library run/check/run';
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const files = ['68ee08d6-b2a1-4071-b0a3-a5d4deb09487', '3d84e19f-b3a9-4319-b997-0ffede36c76d', '29c6cd88-6947-46fc-b6fb-a7b134021a21', 'c5c47362-c0ce-4a44-a09e-bf8503ba43c1'];
const batches = files.map((id) => J(`${LIB}/batch-${id}.json`));
const extra = batches[3]; const n = extra.claims.length;
extra.claims.push({ i: 100, kind: 'number', quote: 'until I finish the 33, 33, 34: 33 SubhanAllah, 33 Alhamdulillah, 34 Allahu Akbar', claim_en: 'the tasbih after prayer: 33, 33, 34', attribution: '' },
  { i: 101, kind: 'history', quote: 'سيدنا أبو بكر الصديق بعت 11 جيش تحارب مانعي الزكاة بعد وفاة النبي صلى الله عليه وسلم', claim_en: 'Abu Bakr sent 11 armies against those who withheld zakat', attribution: '' });
const blank = () => { let k = 0; for (const f of fs.readdirSync(process.env.CHECKER_REPLAY)) { const m = /^[a-z]+-([0-9a-f]{12})\.prompt\.txt$/.exec(f); if (m && !fs.existsSync(path.join(process.env.CHECKER_REPLAY, `${m[1]}.answer.json`))) { fs.writeFileSync(path.join(process.env.CHECKER_REPLAY, `${m[1]}.answer.json`), '{}'); k++; } } return k; };
for (const b of batches) {
  const runDir = path.join(ROOT, b.id); fs.mkdirSync(runDir, { recursive: true });
  const file = path.join(runDir, `batch-${b.id}.json`); fs.writeFileSync(file, JSON.stringify(b, null, 1));
  let ret = null; const t0 = Date.now();
  for (let round = 0; round < 25 && !ret; round++) {
    try { ret = await runChecker3(runDir, file, b, { spend: new Spend(), log: (t) => fs.appendFileSync(path.join(runDir, 'log.txt'), `${t}\n`) }); }
    catch (e) { if (!(e instanceof ReplayPending)) throw e; blank(); }
  }
  const recs = ret.videos[0].result.claims;
  const missing = b.claims.filter((c) => !recs.some((r) => r.i === c.i)).map((c) => c.i);
  const bad = recs.filter((r) => !r.state || !Array.isArray(r.parts) || !r.parts.length || r.parts.some((p) => !p.exit_id || !p.state));
  console.log(`\n${b.id.slice(0, 8)} | ${b.claims.length} quotes, ${recs.length} records, missing ${missing.join(',') || 'none'}, bad shapes ${bad.length} | ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  for (const c of b.claims) { const r = recs.find((x) => x.i === c.i); console.log(`  #${c.i} ${c.kind} -> ${ret.route[c.i] || '-'} | ${r ? `${r.flow_kind} ${r.state} ${r.by}` : 'NO RECORD'}`); }
}

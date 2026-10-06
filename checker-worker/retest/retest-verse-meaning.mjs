// The verse-meaning path on its own (6 Oct): two statements the owner's reviews record as the Qur'an by meaning (his 6 Oct
// correction "Allah created the heavens and the earth for man" -> 45:13 / 2:29; "Adam received words and was forgiven"
// -> 2:37 in the 1 Oct review) and four he ruled the speaker's own view (not a claim), which must stay without a verse.
//   CHECKER_REPLAY=D:/checker-runs/retest-verse-meaning-2026-10-06/qa node retest/retest-verse-meaning.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Spend, ReplayPending } from '../src/claude.mjs';
import { verseMeaningPath } from '../src/c3/verse-meaning.mjs';

const OUT = 'D:/checker-runs/retest-verse-meaning-2026-10-06';
fs.mkdirSync(OUT, { recursive: true });
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const LIB = 'D:/Deeni Docs/curation/2026-10-05 Clip library run/check';
const V2 = 'D:/Deeni Docs/curation/2026-09-30 Checker v2 test';
const lib = J(`${LIB}/run/index.json`).map((x) => J(`${LIB}/run/${x.file}`));
const v2 = fs.readdirSync(`${V2}/inputs`).filter((f) => /^batch-.*.json$/.test(f)).map((f) => J(`${V2}/inputs/${f}`));
const find = (sets, s) => { const [v, i] = s.split('#'); for (const b of sets) if (b.id.startsWith(v)) return { b, c: b.claims.find((c) => String(c.i) === i) }; return null; };
const SAMPLE = [
  ['lib', '29c6cd88#3', 'Qur\'an by meaning: 45:13, 2:29 (owner\'s 6 Oct correction)', ['45:13', '2:29', '31:20']],
  ['v2', 'dx_P6i6IfSw#7', 'Qur\'an by meaning: 2:37 (1 Oct review)', ['2:37']],
  ['lib', '4cbf4efe#1', 'his own view (not a claim)', []],
  ['lib', '29c6cd88#4', 'his own view (not a claim)', []],
  ['lib', '9a125bb2#3', 'his own view (not a claim)', []],
  ['lib', '29c6cd88#2', 'his own view (not a claim)', []],
];
const spend = new Spend(); const rows = []; let pending = 0;
await Promise.all(SAMPLE.map(async ([set, s, expect, keys]) => {
  const { b, c } = find(set === 'lib' ? lib : v2, s);
  try {
    const r = await verseMeaningPath(b, [c], { spend });
    const got = r.done[0]; const key = got?.parts[0].source.number || null;
    const score = keys.length ? (key && keys.includes(key) ? 'the approved verse' : key ? `ANOTHER VERSE ${key}: compare` : 'MISSED the verse') : (key ? `A VERSE WHERE THE REVIEW HAS NONE (${key}): compare` : 'stays his own view, as reviewed');
    rows.push({ tag: s, said: c.quote, c3: got ? `${got.state} ${key}` : 'his own view', why: got?.reason_en || '', expect, score });
  } catch (e) { if (e instanceof ReplayPending) pending++; else throw e; }
}));
if (pending) { console.log(`${pending} of ${SAMPLE.length} wait for answers in ${process.env.CHECKER_REPLAY}`); process.exit(2); }
rows.sort((a, b) => SAMPLE.findIndex((x) => x[1] === a.tag) - SAMPLE.findIndex((x) => x[1] === b.tag));
const summary = { statements: rows.length, cost_usd_estimated: Number(spend.usd.toFixed(4)), per_statement_usd_estimated: Number((spend.usd / rows.length).toFixed(4)) };
fs.writeFileSync(path.join(OUT, 'retest.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const r of rows) console.log(`\n${r.tag} | ${r.score}\n  said: ${r.said.slice(0, 110)}\n  C3: ${r.c3} | ${r.why}\n  EXPECTED: ${r.expect}`);

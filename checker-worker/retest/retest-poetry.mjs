// The poetry path on EVERY saying, history and "other" quote of the library clips (free: the script alone searches
// aldiwan.net), scored against the owner's 5 Oct review: the one poem must be found, and no other saying may be given a poem.
//   CHECKER_REPLAY=D:/checker-runs/retest-poetry-2026-10-06/qa node retest/retest-poetry.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Spend, ReplayPending } from '../src/claude.mjs';
import { poetryPath } from '../src/c3/poetry-path.mjs';

const CLIP = 'D:/Deeni Docs/curation/2026-10-05 Clip library run/check';
const OUT = 'D:/checker-runs/retest-poetry-2026-10-06';
fs.mkdirSync(OUT, { recursive: true });
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const key = new Map();
for (const v of J(`${CLIP}/run-all.json`).videos) for (const c of v.result.claims) key.set(`${v.id}#${c.i}`, c);
for (const it of J(`${CLIP}/corrections.json`).items) { const k = `${it.video}#${it.i}`; const c = { ...(key.get(k) || {}), ...(it.claim || {}) }; if (it.parts_replace) c.parts = it.parts_replace; key.set(k, c); }

const spend = new Spend(); const rows = []; let pending = 0;
const batches = J(`${CLIP}/run/index.json`).map((x) => J(`${CLIP}/run/${x.file}`)).filter((b) => (b.claims || []).some((c) => ['saying', 'history', 'other'].includes(c.kind)));
// the searches are cached per quote (the slow part, about a minute a quote), so a re-run after answers is quick
await Promise.all(batches.map(async (b) => {
  const claims = b.claims.filter((c) => ['saying', 'history', 'other'].includes(c.kind));
  try {
    const r = await poetryPath(b, claims, { spend });
    for (const c of claims) {
      const got = r.done.find((d) => d.i === c.i); const k = key.get(`${b.id}#${c.i}`);
      const kl = (k?.parts || []).map((p) => p.source?.link).find((l) => /aldiwan/.test(l || '')) || null;
      rows.push({ tag: `${b.id}#${c.i}`, said: c.quote, c3: got ? `${got.state} ${got.parts[0].exit_id}` : 'not poetry (goes on)', link: got?.parts[0].source.link || null, oldest: got ? got.parts[0].source.work_ar : null, why: got?.reason_en || '', key: `${k?.flow_kind} ${k?.state}`, key_link: kl,
        score: got ? (kl ? (kl === got.parts[0].source.link ? 'same poem as approved' : 'ANOTHER POEM: compare') : 'A POEM WHERE THE REVIEW HAS NONE') : (kl ? 'MISSED the approved poem' : 'not poetry, as reviewed') });
    }
  } catch (e) { if (e instanceof ReplayPending) pending++; else throw e; }
}));
if (pending) { console.log(`${pending} clips wait for answers in ${process.env.CHECKER_REPLAY}`); process.exit(2); }
const n = (f) => rows.filter(f).length;
const summary = { quotes: rows.length, found_in_a_poem: n((r) => r.link), same_poem: n((r) => r.score === 'same poem as approved'), wrong_poem: n((r) => /ANOTHER POEM|WHERE THE REVIEW/.test(r.score)), missed: n((r) => /MISSED/.test(r.score)), cost_usd_estimated: Number(spend.usd.toFixed(4)) };
fs.writeFileSync(path.join(OUT, 'retest.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const r of rows) console.log(`${r.tag.slice(0, 8)}#${r.tag.split('#')[1]} | ${r.score} | ${r.c3} | ${r.oldest || ''} | ${r.said.slice(0, 70)}`);

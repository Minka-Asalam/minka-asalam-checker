// Checker 3 (the redesign from scratch, owner 4-5 Oct) as one program; complete, with no fallback, since 6 Oct:
//   verses           the script alone (method v4 verses2: in-order comparison with the canonical text); one letter off
//                    -> a moderator listens; anything else -> one small question (c3/verse-differs.mjs)
//   poetry           sayings first: aldiwan.net, "the oldest record we found" (c3/poetry-path.mjs)
//   hadith, sayings  the hadith tree (src/c3/hadith.mjs): Haiku answers small questions, the script searches dorar,
//                    Opus looks second; what is left goes once more with Opus, Sonnet looking second
//   rulings          the rulings ladder (c3/rulings.mjs)
//   numbers          the hadith tree, then the books (c3/numbers.mjs); a worldly figure is "not checked"
//   reports          history, "other", a saying the tree could not find (c3/reports.mjs): the reports ladder, the
//                    known-saying look, the verse-meaning path (c3/verse-meaning.mjs)
//   anything left    "not checked" (or Checker 2 with CHECKER3_FALLBACK=checker2)
// The output has Checker 2's shape, so the same two gates and the same result builder apply.
import fs from 'node:fs';
import path from 'node:path';
import { compare } from './c3/verses2.mjs';
import { hadithPath } from './c3/hadith.mjs';
import { rulingsPath } from './c3/rulings.mjs';
import { verseDiffers, verseHold } from './c3/verse-differs.mjs';
import { poetryPath } from './c3/poetry-path.mjs';
import { numbersPath } from './c3/numbers.mjs';
import { reportsPath } from './c3/reports.mjs';
import { runChecker2, prepareRunDir } from './checker2.mjs';
import { ReplayPending } from './claude.mjs';

// Each checklist added on 6 Oct can be switched off without code (CHECKER3_<NAME>=off): its quotes then show "not checked".
const on = (name) => process.env[`CHECKER3_${name}`] !== 'off';
// A checklist that fails (a site down, an answer that is not JSON) is logged and its quotes left "not checked"; the check
// itself goes on (6 Oct).
const safe = (name, log, p) => Promise.resolve(p).catch((e) => { if (e instanceof ReplayPending) throw e; log?.(`${name} failed, its quotes left not checked: ${e?.message || e}`); return { done: [], rest: [] }; });

// What happens to a quote with no Checker 3 path: 'none' (shown as not checked; the owner's call, 6 Oct)
// or 'checker2' (the big checker, under the per-check cap).
const FALLBACK = process.env.CHECKER3_FALLBACK || 'none';

function verseRecord(c, r) {
  const m = /^(\d+):(\d+)/.exec(c.verse_key || c.reference || '');
  const link = m ? `https://quran.com/${m[1]}/${m[2]}` : 'https://quran.com';
  return {
    i: c.i, flow_kind: 'quran', sub_kind: null, state: 'matches', level: 1,
    line_ar: '', line_en: '', reason_ar: 'طابق نص المصحف كلمةً كلمة', reason_en: 'Matches the Mushaf text word for word (script)',
    harm: 'none', harm_basis_ar: null, harm_basis_en: null, load_bearing: false, continues: null, by: 'checker3-verses',
    parts: [{
      position: 1, kind: 'verse', origin: 'spoken', said_text: c.quote, text_ar: c.quote, text_en: c.verse_en || c.claim_en || '',
      flow_kind: 'quran', exit_id: 'x_exact', state: 'matches', level: 1, difference_ar: null, difference_en: null,
      source: { site: 'quran.com', link, quote: c.verse_text, collection: null, number: c.verse_key || c.reference || null, grader: null, grading: null, narrator: null, work_ar: null, ref_ar: null, volume: null, page: null, page_url: null, confirm_url: null, gradings: null },
      search_log: [{ source: 'quran.com', query: c.verse_key || c.reference || '', found: true }],
    }],
    verse_compare: { matched: r.matched, said: r.said },
  };
}

// -> the workflow's return shape: { videos: [{ id, result: { id, claims, video_note }, checkedRaw }] , route }
export async function runChecker3(runDir, batchFile, batch, { spend, log, onProgress, onPhase, capUsd } = {}) {
  prepareRunDir(runDir);
  const ledger = path.join(runDir, 'dorar-ledger.jsonl');
  const claims = batch.claims || [];
  const route = {}; const done = new Map(); const toC2 = []; const treeMissed = new Set();

  const shown = () => [...done.values()].filter((x) => x.by !== 'checker3-none');
  // 1 verses: the script compares in order; one letter off -> a moderator listens; anything else -> the one small question
  // (verse-differs.mjs, 6 Oct). The poetry search for sayings runs at the same time (free, about a minute a saying).
  const verses = claims.filter((c) => c.kind === 'quran' && c.verse_text);
  const versesStep = Promise.all(verses.map(async (c) => {
    const r = compare(c.quote, c.verse_text);
    route[c.i] = `verse: ${r.state}`;
    if (r.state === 'matches') done.set(c.i, verseRecord(c, r));
    else if (!on('VERSES_DIFFER')) toC2.push(c.i);
    else if (r.state.startsWith('one letter')) done.set(c.i, verseHold(c, r));
    else {
      try { const rec = await verseDiffers(c, r, { spend }); done.set(c.i, rec); route[c.i] = `verse differs: ${rec.parts[0].exit_id}`; }
      catch (e) { if (e instanceof ReplayPending) throw e; log?.(`verse differs failed for ${c.i}: ${e?.message || e}`); toC2.push(c.i); }
    }
  }));
  const sayings = claims.filter((c) => c.kind === 'saying' || c.kind === 'other');
  const poetryStep = sayings.length && on('POETRY') ? safe('poetry', log, poetryPath(batch, sayings, { spend, log })) : Promise.resolve({ done: [], rest: sayings.map((c) => c.i) });
  const [, poems] = await Promise.all([versesStep, poetryStep]);
  for (const rec of poems.done) { done.set(rec.i, rec); route[rec.i] = `poetry: ${rec.parts[0].exit_id}`; }
  onProgress?.(done.size, shown());

  // 2 hadith, and the sayings that are not lines of poetry: the hadith tree
  const hadith = claims.filter((c) => !done.has(c.i) && (c.kind === 'hadith' || c.kind === 'saying'));
  if (hadith.length) {
    const h = await hadithPath(batch, hadith, { ledger, spend, log });
    for (const rec of h.done) { done.set(rec.i, rec); route[rec.i] = 'hadith tree'; }
    for (const i of h.unfinished) { treeMissed.add(i); route[i] = 'hadith tree: nothing in dorar it could stand behind'; }
  }
  onProgress?.(done.size, shown());

  // 3 at the same time: rulings (the rulings ladder; CHECKER3_RULINGS=off sends them back to "not checked"), numbers
  // (numbers.mjs), and the reports path (reports.mjs: history, "other", and a saying the hadith tree could not find; inside
  // it the known-saying look and the verse-meaning path)
  const rulings = claims.filter((c) => c.kind === 'ruling');
  const numbers = claims.filter((c) => c.kind === 'number');
  const reports = claims.filter((c) => !done.has(c.i) && (c.kind === 'history' || c.kind === 'other' || (c.kind === 'saying' && treeMissed.has(c.i))));
  const [rr, nn, pp] = await Promise.all([
    rulings.length && on('RULINGS') ? safe('rulings', log, rulingsPath(batch, rulings, { spend, log })) : { done: [] },
    numbers.length && on('NUMBERS') ? safe('numbers', log, numbersPath(batch, numbers, { spend, log, ledger })) : { done: [] },
    reports.length && on('REPORTS') ? safe('reports', log, reportsPath(batch, reports, { spend, log, ledger })) : { done: [] },
  ]);
  for (const rec of rr.done) { done.set(rec.i, rec); route[rec.i] = `rulings ladder: ${rec.state}`; }
  for (const rec of nn.done) { done.set(rec.i, rec); route[rec.i] = `numbers: ${rec.state}`; }
  for (const rec of pp.done) { done.set(rec.i, rec); route[rec.i] = `reports: ${rec.state} (${rec.by})`; }
  for (const i of treeMissed) if (!done.has(i)) toC2.push(i);
  onProgress?.(done.size, shown());

  for (const c of claims) if (!done.has(c.i) && !toC2.includes(c.i)) { toC2.push(c.i); route[c.i] = `${c.kind} -> Checker 2`; }

  let c2 = null;
  if (toC2.length && FALLBACK === 'checker2') {
    // Checker 2 sees the same batch, only the claims left to it (their numbers unchanged), so its
    // continuation step and its isolation rules work as in the library run.
    const sub = { ...batch, claims: claims.filter((c) => toC2.includes(c.i)) };
    const subFile = `batch-c2-${batch.id}.json`;
    fs.writeFileSync(path.join(runDir, subFile), JSON.stringify(sub, null, 1));
    log?.(`Checker 3 -> Checker 2 for ${toC2.length} of ${claims.length} quotes: ${toC2.join(', ')}`);
    const ret = await runChecker2(runDir, [{ id: batch.id, file: subFile }], { spend, log, onPhase, capUsd });
    c2 = ret?.videos?.[0];
    for (const c of c2?.result?.claims || []) if (toC2.includes(c.i)) done.set(c.i, { ...c, by: 'checker2' });
  }
  onProgress?.(done.size, [...done.values()].filter((x) => x.by !== 'checker3-none'));

  // No big checker (the owner, 6 Oct: "impractical"): a quote with no Checker 3 path yet is shown as
  // NOT CHECKED; a hadith the tree searched dorar for and could not stand behind is NOT FOUND (in dorar,
  // the trusted source). With CHECKER3_FALLBACK=checker2, a quote Checker 2 did not finish (its cap) is pending.
  for (const i of toC2) if (!done.has(i)) {
    const c = claims.find((x) => x.i === i);
    const hadith = treeMissed.has(i) && c.kind === 'hadith';
    const state = FALLBACK === 'checker2' ? 'pending' : hadith ? 'not_found' : 'not_checked';
    const flow = c.kind === 'quran' ? 'quran' : c.kind === 'hadith' || c.kind === 'saying' ? 'hadith' : c.kind === 'ruling' ? 'ruling' : c.kind === 'number' ? 'number' : 'report';
    const why = state === 'not_found' ? ['لم نجده في الدرر السنية', 'not found in dorar.net'] : state === 'pending' ? ['لم يكتمل البحث ضمن حدّ الفحص', 'not finished within the cap of the check'] : ['هذا النوع لا يُفحص بعد', 'this kind is not checked yet'];
    done.set(i, { i, flow_kind: flow, sub_kind: null, state, level: 0, line_ar: '', line_en: '', reason_ar: why[0], reason_en: why[1], harm: 'none', harm_basis_ar: null, harm_basis_en: null, load_bearing: false, continues: null, by: 'checker3-none',
      parts: [{ position: 1, kind: 'quote', origin: 'spoken', said_text: c.quote, text_ar: c.quote, text_en: c.claim_en || '', flow_kind: flow, exit_id: state === 'not_found' ? 'x_notfound' : 'x_not_checked', state, level: 0, difference_ar: null, difference_en: null, source: null, search_log: [] }] });
    route[i] = `${route[i] || c.kind} -> ${state}`;
  }
  const merged = claims.map((c) => done.get(c.i)).filter(Boolean);
  fs.writeFileSync(path.join(runDir, 'route.json'), JSON.stringify(route, null, 1));
  return { videos: [{ id: batch.id, result: { id: batch.id, claims: merged, video_note: null }, checkedRaw: c2?.checkedRaw ?? null }], route };
}

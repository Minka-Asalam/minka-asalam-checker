// Checker 3 (the redesign from scratch, owner 4-5 Oct) as one program, first build (5 Oct night):
//   verses           the script alone (method v4 verses2: in-order comparison with the canonical text)
//   hadith, sayings  the hadith tree (src/c3/hadith.mjs): Haiku answers small questions, the script searches dorar,
//                    Opus looks second; what is left goes once more with Opus, Sonnet looking second
//   everything else  Checker 2 (the "big checker last" of the design), with the same prompts as the library run:
//                    rulings (the rulings ladder is not wired in yet), reports, numbers, fatwas, verses that differ
//                    from the text, hadith the tree could not finish
// The output has Checker 2's shape, so the same two gates and the same result builder apply.
import fs from 'node:fs';
import path from 'node:path';
import { compare } from './c3/verses2.mjs';
import { hadithPath } from './c3/hadith.mjs';
import { rulingsPath } from './c3/rulings.mjs';
import { runChecker2, prepareRunDir } from './checker2.mjs';

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

  const verses = claims.filter((c) => c.kind === 'quran' && c.verse_text);
  for (const c of verses) {
    const r = compare(c.quote, c.verse_text);
    route[c.i] = `verse: ${r.state}`;
    if (r.state === 'matches') done.set(c.i, verseRecord(c, r)); else toC2.push(c.i);
  }
  onProgress?.(done.size, [...done.values()].filter((x) => x.by !== 'checker3-none'));

  const hadith = claims.filter((c) => c.kind === 'hadith' || c.kind === 'saying');
  if (hadith.length) {
    const h = await hadithPath(batch, hadith, { ledger, spend, log });
    for (const rec of h.done) { done.set(rec.i, rec); route[rec.i] = 'hadith tree'; }
    for (const i of h.unfinished) { toC2.push(i); treeMissed.add(i); route[i] = 'hadith tree: nothing in dorar it could stand behind'; }
  }
  onProgress?.(done.size, [...done.values()].filter((x) => x.by !== 'checker3-none'));

  // Rulings: the rulings ladder (method v4), wired 6 Oct; RULINGS=off sends them back to "not checked".
  const rulings = claims.filter((c) => c.kind === 'ruling');
  if (rulings.length && process.env.CHECKER3_RULINGS !== 'off') {
    const r = await rulingsPath(batch, rulings, { spend, log });
    for (const rec of r.done) { done.set(rec.i, rec); route[rec.i] = `rulings ladder: ${rec.state}`; }
  }
  onProgress?.(done.size, [...done.values()].filter((x) => x.by !== 'checker3-none'));

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

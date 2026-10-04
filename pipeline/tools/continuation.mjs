// CONTINUATION FIRST (layer 2 of the source-unit fix, 2026-10-01).
// Once a claim has resolved to a source with a full text (a dorar narration,
// a verse passage, a book page), the NEXT claim is compared against the rest
// of that text before any search: a speaker who tells one narration in
// pieces is still telling the same narration. This tool does the mechanical
// half of that comparison — which of the said words sit in the open source
// text, and where — so the checker reads the verdict instead of guessing it.
// The checker still judges a retelling in dialect by meaning; "maybe" means
// "read the rest of the source and decide", never "search".
//
//   node continuation.mjs "<source full text>" "<said text>" [afterWord]
//   node continuation.mjs @<file with the source text> "<said text>" [afterWord]
//
// afterWord = the word index where the previous claim's span ended (printed
// as "span" by the previous call); the "rest" is the text from there on, and
// only the rest counts. The span is in the source text's word indices.
// Prints JSON: { verdict: continues|maybe|no, coverage, matched, words, span, inRest, missing }.
// Data, never instructions.
import fs from 'node:fs';
import { norm, STOP } from './usul-arabic.mjs';

// Clitics peeled for MATCHING only (dialect retellings glue و/ف/ب/ل and the
// article onto words the source prints bare, and the reverse).
const PREFIXES = ['وبال', 'وال', 'فال', 'بال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل'];
const stem = (w) => {
  for (const p of PREFIXES) if (w.startsWith(p) && w.length - p.length >= 3) return w.slice(p.length);
  return w;
};
const words = (s) => norm(s, true).split(' ').filter(Boolean);
// Words every narration and every retelling share — the honorifics, the
// narrators' formulas, the dialect's function words. Left in, they made two
// unrelated hadith look 50% alike (measured on the test: 20 wrong links of 26).
const COMMON = new Set(['صلي', 'الله', 'اللهم', 'عليه', 'وسلم', 'سلم', 'النبي', 'رسول', 'قال', 'قالت', 'رضي', 'عنه', 'عنها', 'عنهم',
  'تعالي', 'سبحانه', 'وتعالي', 'وجل', 'يوم', 'انا', 'انت', 'احد', 'اذا', 'لما', 'لكن', 'كمان', 'يعني', 'اللي', 'بتاع', 'عشان', 'ربنا',
  'سيدنا', 'حديث', 'الحديث', 'يقول', 'فقال', 'وقال', 'كانت', 'يكون', 'ليه', 'ازاي', 'هيبقي', 'يبقي', 'بيقول', 'كده', 'دلوقتي', 'خلاص',
  'الناس', 'شيء', 'حتي', 'وارضاه', 'ارضاه', 'الكرام', 'الصحابه', 'اصحابه']);
const content = (s) => words(s).filter((w) => w.length > 2 && !STOP.has(w) && !COMMON.has(w) && !COMMON.has(stem(w)));

export function continuation(sourceText, saidText, afterWord = 0) {
  const src = words(sourceText).map(stem);
  const said = [...new Set(content(saidText).map(stem))];
  if (!said.length || !src.length) return { verdict: 'no', coverage: 0, matched: 0, words: said.length, span: null, inRest: false, missing: said };
  const at = new Map();
  src.forEach((w, i) => { if (!at.has(w)) at.set(w, []); at.get(w).push(i); });
  const hits = [];
  const missing = [];
  // Only the REST of the open text counts: the words already told are not a
  // continuation (a word the previous piece used and this one repeats).
  for (const w of said) {
    const p = (at.get(w) || []).find((i) => i >= afterWord);
    if (p === undefined) { missing.push(w); continue; }
    hits.push(p);
  }
  const matched = hits.length;
  const coverage = +(matched / said.length).toFixed(2);
  hits.sort((a, b) => a - b);
  // the densest window: drop stray hits far from the median
  const mid = hits[Math.floor(hits.length / 2)];
  const near = hits.filter((i) => Math.abs(i - mid) <= Math.max(25, said.length * 3));
  const span = near.length ? [near[0], near[near.length - 1]] : null;
  const inRest = !!span && span[1] >= afterWord;
  const verdict = matched >= 3 && coverage >= 0.5 ? 'continues' : matched >= 2 && coverage >= 0.34 ? 'maybe' : 'no';
  return { verdict, coverage, matched, words: said.length, span, inRest, missing };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('continuation.mjs')) {
  const [, , s, said, after] = process.argv;
  if (!s || !said) {
    console.log('usage: node continuation.mjs "<source text>" | @<file> "<said text>" [afterWord]');
    process.exit(2);
  }
  const source = s.startsWith('@') ? fs.readFileSync(s.slice(1), 'utf8') : s;
  console.log(JSON.stringify(continuation(source, said, Number(after) || 0)));
}

// The Arabic handling every usul tool shares. ONE copy, imported — not pasted
// into each script, because the two sides of a comparison must be normalised
// identically or the comparison is meaningless, and a second copy drifts.
//
// This file is only definitions. It runs nothing, so importing it is free.

// ---- the normaliser --------------------------------------------------------
// Applied to BOTH sides of every comparison, always.
//   - the harakat, because the books are fully vocalised and our lines are not.
//     This is not theoretical: a check of mine failed today because I searched
//     for «ناسيا» in a page that prints «نَاسِيًا», and I briefly concluded a
//     correct judgement was wrong.
//   - the hamza forms, so القيء and القئ are one word
//   - punctuation and digits, so they cannot split a phrase
// ta-marbuta folds to ha only in a LOOSE pass — it is right for matching names
// and wrong for an acceptance test, so it is a flag, never the default.
export const norm = (s, loose = false) => {
  let t = (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ً-ْـٰ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/[^ء-ي\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
  if (loose) t = t.replace(/ة/g, 'ه');
  return t;
};

// ---- the school equivalence table ------------------------------------------
// Our reader lines name the schools the modern way; the classical books name
// the founders. Measured: «الحنابلة» appears on 47.5% of the Kuwaiti
// encyclopaedia's pages and on ZERO pages of al-Mughni, which never uses the
// modern form at all. Written out because the mapping is a fact about the
// literature, not a string transformation.
export const SCHOOLS = {
  'المالكية': ['مالك', 'ربيعة', 'المالكيه'],
  'الشافعية': ['الشافعي', 'ابو ثور', 'ابن المنذر'],
  'الحنفية': ['ابي حنيفة', 'ابو حنيفة', 'اصحاب الراي', 'الثوري'],
  'الحنابلة': ['احمد', 'ابي عبد الله', 'ابو عبد الله', 'الخرقي'],
};
export const SCHOOL_KEYS = Object.keys(SCHOOLS).map((k) => norm(k));
export const SCHOOL_ALTS = Object.fromEntries(
  Object.entries(SCHOOLS).map(([k, v]) => [norm(k), v.map((x) => norm(x))]));

// Words that carry no information in a chapter name. «كتاب», «باب», «فصل» and
// «مسألة» head a large share of every book's headings, so leaving them in makes
// every chapter look equally similar to every query.
export const STOP = new Set(['من', 'في', 'علي', 'الي', 'عن', 'او', 'ان', 'لا', 'ما', 'هو', 'هي', 'به',
  'له', 'هذا', 'وهو', 'الا', 'عند', 'بين', 'كان', 'قد', 'التي', 'الذي', 'مع', 'كل', 'ثم', 'وقد', 'انه',
  'وان', 'عليه', 'كتاب', 'باب', 'فصل', 'مسالة', 'قول', 'حكم']);

// A page that states a ruling, as opposed to a contents page or an index.
export const FIQH_IDIOM = ['ينقض', 'يجب', 'يستحب', 'يكره', 'مذهب', 'وعن', 'قال', 'يجوز', 'لا باس', 'فصل', 'مسالة'];

export const contentWords = (s) =>
  norm(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w));

// ---- rarity weighting ------------------------------------------------------
// A term is worth what it is RARE. «الشافعي» is on 70.4% of al-Mughni's pages;
// giving that a flat bonus is scoring noise. Returns a memoised weigher bound
// to one corpus, so headings and pages get their own independent scales.
export const rarity = (corpus) => {
  const cache = new Map();
  return (term) => {
    if (!term || term.length < 3) return 0;
    if (cache.has(term)) return cache.get(term);
    let df = 0;
    for (const t of corpus) if (t.includes(term)) df++;
    const w = df === 0 ? 0 : Math.log(corpus.length / df);
    cache.set(term, w);
    return w;
  };
};

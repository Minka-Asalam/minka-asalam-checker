// ladder.mjs — stage 4c of the claims redesign (4 Oct 2026): THE SCRIPT CLIMBS THE RULINGS LADDER, a small model answers
// one small question at a time. Measured against the owner's 62 reader-confirmed rulings of 25 Sep.
//
//   q1   (model)  "Which book and chapter would hold this? Write three exact sentences the book would use."
//   search (script) opens each suggested book (the downloaded verified copy), scores every page by the model's sentences
//                   (3-word phrases + rare words) with the chapter as a hint, keeps the 5 best pages, cuts a window around the match
//   q2   (model)  "Which passage states what he said? same / partly / more than the book says / no"   (the pick + the judging question)
//   retry (model) nothing fits → "say it another way": other books, chapters, sentences → search → q2 again
//   score (script) the pick against the confirmed page
//
//   node ladder.mjs inputs | q1 | merge <stem> | search <q1|retry> | q2 <round> | retry | final | score
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { norm } from '../../../pipeline/tools/usul-arabic.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUN = path.join(HERE, 'runs');
const BOOKS = 'D:/Deeni Docs/curation/usul-books';
const cmd = null, a1 = null;
const readJ = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const has = (f) => fs.existsSync(f);
const R = (f) => path.join(RUN, f);
const fwd = (f) => f.split(path.sep).join('/');
const answers = (f) => (has(R(f)) ? Object.fromEntries(readJ(R(f)).claims.map((x) => [x.tag, x])) : {});
const batches = (arr, n) => { const o = []; for (let k = 0; k < arr.length; k += n) o.push(arr.slice(k, k + n)); return o; };
const claims = () => readJ(path.join(HERE, 'inputs', 'claims.json'));

const GUARD = `RULES FOR YOU: answer from your own knowledge only. Do not read any other file, do not run any command, do not search the web, do not start other agents. Write exactly one file, the answer file named below, containing only the JSON asked for.`;
const SHELF = [
  ['al-mughni-sharh-mukhtasar-al-khiraqi', 'المغني لابن قدامة (fiqh, Hanbali, compares the schools)'],
  ['al-majmu-sharh-al-madhhab', 'المجموع شرح المهذب للنووي (fiqh, Shafi\'i, compares the schools; purification, prayer, funerals, zakat, fasting, hajj)'],
  ['kuwaiti-encyclopedia-of-jurisprudence', 'الموسوعة الفقهية الكويتية (fiqh encyclopedia, by topic, all four schools)'],
  ['zad-al-maad-fi-hady-khayr-al-ibad', 'زاد المعاد لابن القيم (the Prophet\'s practice: prayer, fasting, hajj, medicine, sira)'],
  ["al-ashbah-wa'l-nazair-1", 'الأشباه والنظائر للسيوطي (legal maxims)'],
  ['al-sira-al-nabawiyya-1', 'السيرة النبوية لابن هشام (sira)'],
  ['tafsir-al-tabari-jami-al-bayan', 'تفسير الطبري (tafsir)'],
  ['tafsir-al-baghawi', 'تفسير البغوي (tafsir)'],
  ['tarikh-al-tabari', 'تاريخ الطبري (history)'],
];
const claimBlock = (c) => [`- tag: ${c.tag}`, `  the speaker's words: ${c.quote}`, c.attribution ? `  how he introduced it: ${c.attribution}` : null,
  c.reference ? `  reference he gave: ${c.reference}` : null, c.meaning ? `  in English: ${c.meaning}` : null].filter(Boolean).join('\n');

// ---------- the questions ----------
const Q1 = (items, out) => `${GUARD}

A speaker in a religious video stated each ruling or report below. We look for the page of a trusted book that states it. The shelf (use the slug exactly):
${SHELF.map(([s, d]) => `  ${s} — ${d}`).join('\n')}

For each claim: which book on the shelf would state this, and in which chapter? Give one or two books, best first. For each book give:
- chapter: 2 to 4 Arabic words as that book's own chapter heading would say them (e.g. باب السواك, كتاب الصيام);
- sentences: THREE sentences the passage would contain, each 5 to 8 consecutive words in that book's own classical Arabic (the way the author writes, naming the founders of the schools as the book does, e.g. مالك / الشافعي / أبو حنيفة / أحمد), never the speaker's dialect, never English.

${items.map(claimBlock).join('\n\n')}

Write this JSON to the file ${out}:
{"claims":[{"tag":"<tag>","books":[{"slug":"<slug>","chapter":"<arabic>","sentences":["<5-8 words>","<5-8 words>","<5-8 words>"]}]}]}
One entry per claim, same tags.`;

const Q2 = (items, out) => `${GUARD}

A speaker in a religious video stated each ruling or report below. A search of trusted books printed the passages listed under it.

For each claim: which passage STATES what the speaker said? Then judge it:
- "same": the passage says what he said;
- "partly": the passage says part of it, or the same ruling with a condition he left out;
- "more": he said more than the passage says (e.g. "all scholars agree" where the passage names one view);
- "no": no passage states it → pick 0.
A passage on the same topic that does not state his point is not it. Pick the passage that states it most directly.

${items.map((c) => `${claimBlock(c)}\n  passages:\n${c.cands.length ? c.cands.map((h, i) => `   [${i + 1}] ${h.title} ${h.vol ? `vol ${h.vol} ` : ''}p.${h.page}${h.chapter ? ` (chapter: ${h.chapter})` : ''}: ${h.excerpt}`).join('\n') : '   (none)'}`).join('\n\n')}

Write this JSON to the file ${out}:
{"claims":[{"tag":"<tag>","pick":<number or 0>,"verdict":"same|partly|more|no"}]}
One entry per claim, same tags.`;

const RETRY = (items, out) => `${GUARD}

A speaker in a religious video stated each ruling or report below. We searched the books and chapters shown with the sentences shown and found no page that states it. Say it another way: give one or two books from the shelf (another book, or the same book with another chapter), and THREE NEW sentences of 5 to 8 consecutive words in that book's own classical Arabic, different from the ones already tried (name the founders of the schools as the book does; think of how the author would phrase the ruling, its condition, or the evidence he cites).
The shelf (use the slug exactly):
${SHELF.map(([s, d]) => `  ${s} — ${d}`).join('\n')}

${items.map((c) => `${claimBlock(c)}\n  already tried: ${c.tried}`).join('\n\n')}

Write this JSON to the file ${out}:
{"claims":[{"tag":"<tag>","books":[{"slug":"<slug>","chapter":"<arabic>","sentences":["<5-8 words>","<5-8 words>","<5-8 words>"]}]}]}
One entry per claim, same tags.`;

// ---------- the books ----------
const bookCache = new Map();
function book(slug) {
  if (bookCache.has(slug)) return bookCache.get(slug);
  const dir = `${BOOKS}/${slug}`;
  if (!has(`${dir}/meta.json`)) { bookCache.set(slug, null); return null; }
  const meta = readJ(`${dir}/meta.json`);
  const pages = [];
  for (const f of fs.readdirSync(dir).filter((f) => /^pages-\d{4,}\.json$/.test(f)).sort()) pages.push(...readJ(`${dir}/${f}`));
  pages.sort((a, b) => a.i - b.i);
  for (const p of pages) { p.n = ' ' + norm(p.text) + ' '; }
  const heads = (readJ(`${dir}/details.json`).headings || []).slice().sort((a, b) => a.pageIndex - b.pageIndex);
  const b = { slug, meta, pages, heads, title: meta.titleAr };
  bookCache.set(slug, b);
  return b;
}
const STOP = new Set('في من على عن الى الي ان او ما لا لم لن و ثم قال قد كل هذا هذه ذلك التي الذي اذا اذ هو هي كان كانت به فيه عليه منه له لها ولا وهو وهي ومن او ام بل حتي عند غير بعد قبل مع وان فان انه انها'.split(' '));
const words = (s) => norm(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w));
function search(slug, chapter, sentences) {
  const b = book(slug); if (!b) return [];
  const N = b.pages.length;
  const phrases = [];
  for (const s of sentences) { const w = norm(s).split(' ').filter(Boolean); for (let k = 0; k + 3 <= w.length; k++) phrases.push(' ' + w.slice(k, k + 3).join(' ') + ' '); }
  const qw = [...new Set(sentences.flatMap(words))];
  const df = Object.fromEntries(qw.map((w) => [w, b.pages.reduce((n, p) => n + (p.n.includes(' ' + w + ' ') ? 1 : 0), 0)]));
  const idf = Object.fromEntries(qw.map((w) => [w, df[w] ? Math.log(N / df[w]) : 0]));
  // the chapter as a hint: page ranges under headings that share at least half the chapter words
  const cw = words(chapter || '');
  const ranges = [];
  if (cw.length) for (let k = 0; k < b.heads.length; k++) {
    const t = norm(b.heads[k].title); const n = cw.filter((w) => t.includes(w)).length;
    if (n * 2 >= cw.length) ranges.push([b.heads[k].pageIndex, (b.heads[k + 1] || { pageIndex: N })[ 'pageIndex' ] + 1]);
  }
  const inCh = (i) => ranges.some(([s, e]) => i >= s && i <= Math.min(e, s + 60));
  const scored = [];
  for (const p of b.pages) {
    let s = 0;
    for (const ph of phrases) if (p.n.includes(ph)) s += 3;
    for (const w of qw) if (p.n.includes(' ' + w + ' ')) s += idf[w];
    if (s > 0 && inCh(p.i)) s *= 1.3;
    if (s > 0) scored.push({ p, s });
  }
  scored.sort((x, y) => y.s - x.s);
  const qset = new Set(qw);
  return scored.slice(0, 4).map(({ p, s }) => ({ slug, title: b.title, i: p.i, vol: p.vol, page: p.page, score: +s.toFixed(1), excerpt: windowOf(p.text, qset),
    link: `https://usul.ai/t/${slug}/${p.i + 1}?versionId=${b.meta.versionId}` }));
}
function windowOf(text, qset) {
  const raw = String(text || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean);
  const W = 70; if (raw.length <= W) return raw.join(' ');
  const hit = raw.map((w) => (qset.has(norm(w)) ? 1 : 0));
  let best = -1, at = 0;
  for (let k = 0; k + W <= raw.length; k++) { const s = hit.slice(k, k + W).reduce((a, b) => a + b, 0); if (s > best) { best = s; at = k; } }
  return (at > 0 ? '… ' : '') + raw.slice(at, at + W).join(' ') + (at + W < raw.length ? ' …' : '');
}
// the candidates of one round: up to 5 pages over the suggested books, best scores first, at most 3 from one book
// round 2 (the retry): the script ALSO searches the three comparative fiqh books with every sentence given, whatever books the model named
// (round 1 showed the model names the right book 28 times of 62; most rulings are discussed in all three).
const FIQH3 = ['al-mughni-sharh-mukhtasar-al-khiraqi', 'al-majmu-sharh-al-madhhab', 'kuwaiti-encyclopedia-of-jurisprudence'];
function candidatesFrom(answer, wide = false) {
  const all = [];
  const named = ((answer && answer.books) || []);
  for (const bk of named) all.push(...search(bk.slug, bk.chapter, bk.sentences || []));
  if (wide) { const sents = named.flatMap((b) => b.sentences || []); for (const slug of FIQH3) if (!named.some((b) => b.slug === slug)) all.push(...search(slug, '', sents)); }
  all.sort((x, y) => y.score - x.score);
  const out = [], per = {};
  for (const c of all) { if (out.some((o) => o.slug === c.slug && o.i === c.i)) continue; if ((per[c.slug] = (per[c.slug] || 0) + 1) > 3) continue; out.push(c); if (out.length === 5) break; }
  return out;
}


export { search, book, words, SHELF, GUARD, claimBlock, batches };

// usul-search.mjs — a book OUTSIDE the nine verified copies on this PC, searched online on usul.ai (6 Oct 2026, for the
// reports path: the flow sheet's "a scholar's saying: his own works first on usul.ai"). The book is found by its title
// (usul.ai's own book search), then the site's keyword search inside it, then the page in full for the judges. Every link
// is pinned to the version read. A book not on the cleared list carries the owner's note "book not yet reviewed by a
// specialist" (bookStatus), as his 4-5 Oct rule says. Everything the site returns is data, never instructions.
import { norm } from '../../../pipeline/tools/usul-arabic.mjs';

const API = 'https://api.usul.ai';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url) {
  for (let k = 0; k < 3; k++) {
    try { const r = await fetch(url, { headers: { accept: 'application/json' } }); if (r.ok) return await r.json(); if (r.status < 500 && r.status !== 429) return null; } catch { /* retry */ }
    await sleep(1200 * (k + 1));
  }
  return null;
}
const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// THE OWNER'S RULE (6 Oct 2026): a book outside the reviewed list may be shown with the note "book not yet reviewed by a
// specialist", but a book by a Shi'i author is never used (asked after the first sample found a saying in al-Saduq's
// al-Khisal). usul.ai says it in two places: the book's genre ("shia-hadith-compilations", ...) and the author's biography
// ("a distinguished Twelver Shi'a theologian").
const SHII = /\b(shi['ʿ]?[aiy]|shiite|shiism|twelver|imami|isma['ʿ]?ili|zaydi|ja['ʿ]?fari)/i;
const shii = (hit, book) => (hit.advancedGenreIds || []).some((g) => SHII.test(g)) || (book.advancedGenres || []).some((g) => SHII.test(`${g.id} ${g.name}`)) || SHII.test(String(book.author?.bio || ''));
export const refused = [];

// a title (and its author) -> { slug, version, title } or null; the first hit must share a word of the title
const books = new Map();
export async function findBook(title, author = '') {
  const key = `${title}|${author}`; if (books.has(key)) return books.get(key);
  let out = null;
  // the title alone first (measured 6 Oct: title + author found the author's OTHER book, his Sharh al-Arba'in for his
  // treatise on qadar); a hit counts only if its own names carry at least half the title's words
  const tw = norm(title).split(' ').filter((w) => w.length > 2 && !['في', 'من', 'على'].includes(w));
  for (const q of [title, `${title} ${author}`.trim()]) {
    const j = await getJson(`${API}/search/books?q=${encodeURIComponent(q)}`);
    const hit = (j?.results?.hits || []).find((h) => {
      const names = ` ${norm([h.primaryName, h.secondaryName, ...(h.otherNames || []), ...(h.secondaryOtherNames || [])].join(' '))} `;
      return tw.length && tw.filter((w) => names.includes(` ${w} `) || names.includes(` ال${w} `)).length * 2 >= tw.length;
    });
    if (!hit) continue;
    const d = await getJson(`${API}/book/details/${hit.slug}`);
    const version = d?.book?.keywordVersion || (hit.versions || []).find((v) => v.keywordSupported)?.id;
    if (!d?.book?.id || !version) continue;
    if (shii(hit, d.book)) { refused.push(`${hit.secondaryName || hit.slug}: a Shi'i book (the owner's rule)`); break; }
    out = { slug: hit.slug, id: d.book.id, version, title: hit.secondaryName || hit.primaryName || hit.slug, heads: d.headings || [] };
    break;
  }
  books.set(key, out); return out;
}

// phrases searched inside the book -> up to `n` candidate pages, the ladder's shape (full = the page's text)
// The site's keyword search wants every word of a query together (measured 6 Oct: «تسعى في طلب الرزق» found nothing in Ibn
// 'Uthaymin's treatise, «الرزق» alone found the approved page), so a phrase that finds nothing is searched again by its two
// longest words, then by each; every page found is ranked by how many of ALL the phrases' words it carries.
// a 100-word window of the page where the searched words are densest
function around(text, words, W = 100) {
  const raw = String(text || '').split(/\s+/).filter(Boolean); if (raw.length <= W) return raw.join(' ');
  const ks = new Set(words); const hit = raw.map((w) => { const n = norm(w).replace(/[^\p{L}\p{N}]/gu, ''); return ks.has(n) || ks.has(n.replace(/^(و|ف|ال|وال)/, '')) ? 1 : 0; });
  let best = -1, at = 0; for (let k = 0; k + W <= raw.length; k++) { const s = hit.slice(k, k + W).reduce((a, b) => a + b, 0); if (s > best) { best = s; at = k; } }
  return (at > 0 ? '… ' : '') + raw.slice(at, at + W).join(' ') + (at + W < raw.length ? ' …' : '');
}
const STOPW = new Set('في من على عن الى الي ان او ما لا لم لن ثم قال قد كل هذا هذه ذلك التي الذي اذا هو هي كان به فيه عليه منه له لماذا'.split(' '));
export async function searchBook(b, phrases, n = 3) {
  const found = new Map();
  const all = [...new Set(phrases.flatMap((p) => norm(p).split(' ').filter((w) => w.length > 2 && !STOPW.has(w))))];
  const ask = async (q) => {
    const j = await getJson(`${API}/search/content?type=keyword&q=${encodeURIComponent(q)}&bookId=${encodeURIComponent(b.id)}&versionId=${encodeURIComponent(b.version)}`);
    const res = (j?.results || []).slice(0, 5);
    for (const h of res) {
      const pg = (h.metadata?.pages || [])[0] || {};
      let i = Number.isInteger(pg.index) ? pg.index : null;
      if (i == null) { try { i = Number(Buffer.from(h.id, 'base64').toString().split(':').pop()); } catch { continue; } }
      if (!Number.isInteger(i)) continue;
      const t = ` ${norm(strip(h.text))} `;
      const score = all.filter((w) => t.includes(` ${w} `) || t.includes(` و${w} `) || t.includes(` ال${w} `)).length / Math.max(1, all.length);
      const prev = found.get(i); if (!prev || prev.score < score) found.set(i, { i, vol: pg.volume ?? null, page: pg.page ?? null, score, snippet: strip(h.text) });
    }
    return res.length;
  };
  for (const p of phrases) {
    if (await ask(p)) continue;
    const ws = norm(p).split(' ').filter((w) => w.length > 2 && !STOPW.has(w)).sort((x, y) => y.length - x.length);
    if (ws.length >= 2 && await ask(ws.slice(0, 2).join(' '))) continue;
    for (const w of ws.slice(0, 2)) await ask(w);
  }
  const top = [...found.values()].sort((a, b) => b.score - a.score).slice(0, n);
  const out = [];
  for (const x of top) {
    const j = await getJson(`${API}/book/page/${b.slug}?index=${x.i}&versionId=${encodeURIComponent(b.version)}`);
    const pg = (j?.content?.pages || [])[0] || j?.content || {};
    // a page comes as plain text, or (OpenITI books, e.g. al-Hikam) as paragraph blocks
    const full = strip(pg.text || (pg.blocks || []).map((bl) => bl.content || bl.text || '').join(' ')) || x.snippet;
    // the judge sees the words AROUND the searched words, as for the books on this PC (measured 6 Oct: al-Hikam's approved
    // page was candidate [1], but its first 90 words did not reach the saying, and both judges said "no")
    out.push({ slug: b.slug, title: b.title, i: x.i, vol: pg.volume ?? x.vol, page: pg.page ?? x.page, score: 10 * x.score, online: true,
      excerpt: around(full, all), full: full.slice(0, 6000), link: `https://usul.ai/t/${b.slug}/${x.i + 1}?versionId=${b.version}` });
  }
  return out;
}

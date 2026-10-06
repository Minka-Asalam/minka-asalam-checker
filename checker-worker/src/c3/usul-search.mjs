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

// a title (and its author) -> { slug, version, title } or null; the first hit must share a word of the title
const books = new Map();
export async function findBook(title, author = '') {
  const key = `${title}|${author}`; if (books.has(key)) return books.get(key);
  let out = null;
  for (const q of [`${title} ${author}`.trim(), title]) {
    const j = await getJson(`${API}/search/books?q=${encodeURIComponent(q)}`);
    const hit = (j?.results?.hits || [])[0];
    if (!hit) continue;
    const names = norm([hit.primaryName, hit.secondaryName, ...(hit.otherNames || []), hit.slug].join(' '));
    const tw = norm(title).split(' ').filter((w) => w.length > 2);
    if (!tw.some((w) => names.includes(w)) && !/[a-z]/i.test(title)) continue;
    const d = await getJson(`${API}/book/details/${hit.slug}`);
    const version = d?.book?.keywordVersion || (hit.versions || []).find((v) => v.keywordSupported)?.id;
    if (!d?.book?.id || !version) continue;
    out = { slug: hit.slug, id: d.book.id, version, title: hit.secondaryName || hit.primaryName || hit.slug, heads: d.headings || [] };
    break;
  }
  books.set(key, out); return out;
}

// phrases searched inside the book -> up to `n` candidate pages, the ladder's shape (full = the page's text)
export async function searchBook(b, phrases, n = 3) {
  const found = new Map();
  for (const p of phrases) {
    const j = await getJson(`${API}/search/content?type=keyword&q=${encodeURIComponent(p)}&bookId=${encodeURIComponent(b.id)}&versionId=${encodeURIComponent(b.version)}`);
    for (const h of (j?.results || []).slice(0, 5)) {
      const pg = (h.metadata?.pages || [])[0] || {};
      let i = Number.isInteger(pg.index) ? pg.index : null;
      if (i == null) { try { i = Number(Buffer.from(h.id, 'base64').toString().split(':').pop()); } catch { continue; } }
      if (!Number.isInteger(i)) continue;
      const pw = norm(p).split(' ').filter(Boolean); const t = ` ${norm(strip(h.text))} `;
      const score = pw.filter((w) => t.includes(` ${w} `)).length / Math.max(1, pw.length);
      const prev = found.get(i); if (!prev || prev.score < score) found.set(i, { i, vol: pg.volume ?? null, page: pg.page ?? null, score, snippet: strip(h.text) });
    }
  }
  const top = [...found.values()].sort((a, b) => b.score - a.score).slice(0, n);
  const out = [];
  for (const x of top) {
    const j = await getJson(`${API}/book/page/${b.slug}?index=${x.i}&versionId=${encodeURIComponent(b.version)}`);
    const pg = (j?.content?.pages || [])[0] || j?.content || {};
    const full = strip(pg.text) || x.snippet;
    out.push({ slug: b.slug, title: b.title, i: x.i, vol: pg.volume ?? x.vol, page: pg.page ?? x.page, score: 10 * x.score, online: true,
      excerpt: x.snippet.split(' ').slice(0, 90).join(' '), full: full.slice(0, 6000), link: `https://usul.ai/t/${b.slug}/${x.i + 1}?versionId=${b.version}` });
  }
  return out;
}

// poetry.mjs — the poetry kind (owner, 5 Oct 2026). The script alone, like verses: search aldiwan.net's own search
// (the API its search page calls, no login), open each poem found, compare the speaker's words IN ORDER with the poem's
// lines (verses2's comparison), and keep THE OLDEST RECORD WE FOUND: among the poems that carry his lines, the earliest era.
// Owner's rule: we cannot know who said a line first, so the label is "the oldest record we found" (poet, poem, era),
// never "the author"; most speakers name no poet, so the poet hardly weighs in the ranking: the level says only whether the
// lines were found in a poem (1), only as a loose quote (2), or not at all (0). A poet he names that differs from the
// oldest record is a soft note for the owner, never a "corrected".
//   node poetry.mjs check "<the lines>" ["<poet he named>"]      ·   export checkPoetry(quote, named)
import { execFileSync } from 'node:child_process';
import { compare } from '../verses/verses2.mjs';
import { norm } from 'file:///D:/Deeni Docs/curation/tools 2026-09-24 usul/usul-arabic.mjs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const BASE = 'https://www.aldiwan.net';
// aldiwan's eras, oldest first (anything unknown sorts last)
const ERAS = ['الجاهلي', 'المخضرم', 'الاسلامي', 'صدر الاسلام', 'الاموي', 'العباسي', 'الاندلسي', 'الفاطمي', 'الايوبي', 'المملوكي', 'العثماني', 'الحديث', 'المعاصر'];
export const eraRank = (era) => { const e = norm(era || ''); const k = ERAS.findIndex((x) => e.includes(x)); return k < 0 ? 99 : k; };
const get = (url, json) => { try { const s = execFileSync('curl', ['-s', '-L', '-m', '30', '-A', UA, ...(json ? ['-H', 'Accept: application/json'] : []), url], { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 }); return json ? JSON.parse(s) : s; } catch { return null; } };
const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
// a few distinctive words make the search (aldiwan matches all words; the speaker's whole line can miss on one changed word)
// short pieces from across the line (4 words each): the search ranks by shared words, so one changed word in a long query
// buries the poem; several short pieces keep it near the top
const queries = (quote) => { const w = String(quote).replace(/[…،.؟?!]/g, ' ').split(/\s+/).filter(Boolean); if (w.length <= 5) return [w.join(' ')];
  const at = [0, Math.floor(w.length / 3), Math.floor((2 * w.length) / 3), w.length - 4].map((k) => Math.max(0, Math.min(k, w.length - 4)));
  return [...new Set(at.map((k) => w.slice(k, k + 4).join(' ')))]; };
// the poem's text from its page: the lines sit between the title block and the related/share blocks; we keep the page's
// body text and let the in-order comparison find the stretch
function poemText(url) {
  const html = get(BASE + url); if (!html) return null;
  const t = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<head[\s\S]*?<\/head>/, ' ');
  return strip(t);
}
export function checkPoetry(quote, named = '', debug = false) {
  const tried = []; const seen = new Map();
  for (const q of queries(quote)) {
    tried.push(q);
    for (const type of ['poems', 'quotes']) {
      const j = get(`${BASE}/api/search?q=${encodeURIComponent(q)}&type=${type}&page=1`, true); const hits = (j && j.hits) || [];
      // members' own poems (poet_user.type 'user': imitations, tashtir, quotations by site members) are not a record of a
      // line's origin; only aldiwan's catalogued poets count
      for (const h of hits.filter((x) => !x.poet_user || x.poet_user.type !== 'user').slice(0, 10)) { const key = h.url || h.id; if (!key || seen.has(key)) continue;
        seen.set(key, { type, url: h.url, title: strip(h.title), poet: strip(h.poet_name), era: strip(h.poet_era), verified: !!h.is_verified, snippet: strip((h._highlightResult || {}).body || h.body_snippet) }); }
    }
  }
  // compare his words with each poem's text, in order; keep those that carry his lines
  const carrying = [];
  for (const h of seen.values()) {
    const text = h.type === 'poems' ? poemText(h.url) || h.snippet : h.snippet; const r = compare(quote, text);
        const off = r.extra.length + r.outOfOrder.length + r.skipped.length;
    // most of his words in this poem, in order (lines travel in variants: «فيا ليت … بما صنع» for «ألا ليت … بما فعل»)
    if (r.matched >= 4 && r.matched >= 0.6 * r.said) carrying.push({ ...h, cmp: r, off });
  }
  if (debug) console.error('seen', seen.size, [...seen.values()].map((x) => x.poet + ' ' + x.url).join(' | '), ' carrying', carrying.map((x) => x.poet + ' m' + x.cmp.matched + '/' + x.cmp.said).join(' | '));
  carrying.sort((a, b) => (a.type === 'poems' ? 0 : 1) - (b.type === 'poems' ? 0 : 1) || eraRank(a.era) - eraRank(b.era) || a.off - b.off || (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
  const best = carrying[0];
  if (!best) return { level: 0, state: 'not_found', tried, found: [] };
  const state = best.cmp.state === 'matches' ? 'matches' : best.cmp.state.startsWith('one letter') ? 'matches' : 'differs';
  const notes = [];
  if (best.cmp.state.startsWith('one letter')) notes.push('one letter off: a moderator listens');
  if (state === 'differs') notes.push(`his words differ from the poem: ${[best.cmp.extra.length && 'he said ' + best.cmp.extra.join(' '), best.cmp.skipped.length && 'the poem has ' + best.cmp.skipped.join(' '), best.cmp.outOfOrder.length && 'order ' + best.cmp.outOfOrder.join(' ')].filter(Boolean).join(' · ')} → one small question: the same meaning, or a changed meaning?`);
  if (named && !norm(best.poet).includes(norm(named)) && !norm(named).includes(norm(best.poet))) notes.push(`he named ${named}; the oldest record we found gives ${best.poet} (a note, not a correction)`);
  return { level: best.type === 'poems' ? 1 : 2, state, oldest: { poet: best.poet, poem: best.title, era: best.era, link: BASE + best.url, verified_page: best.verified },
    others: carrying.slice(1, 4).map((x) => ({ poet: x.poet, poem: x.title, era: x.era, link: BASE + x.url })), notes, tried };
}
if (process.argv[1] && process.argv[1].endsWith('poetry.mjs') && process.argv[2] === 'check') console.log(JSON.stringify(checkPoetry(process.argv[3], process.argv[4] || ''), null, 1));

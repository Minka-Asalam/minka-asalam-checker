// verses2.mjs — method v4 (4 Oct 2026, after the review panel). The script alone compares the speaker's words with the
// verse text IN ORDER: each stretch he recited (the listen joins stretches with «…») is aligned word by word against the
// verses (a longest-common-subsequence alignment), so a dropped word inside the stretch, a changed order, or an extra word
// is caught. v1 only asked whether each spoken word appeared somewhere in the verses and deleted every alif, so «قال» and
// «قل», or a quote missing «لا», passed as "matches".
// Word equality: the same word, or the same word in the Mushaf's spelling (a dagger alif read as an alif: «سلٰما» = «سلاما»,
// «الرحمٰن» = «الرحمن»), or, for words of 4+ letters, the same letters with only alifs differing (a spelling variant).
// One letter off (one word only) → a moderator listens; anything else off → one small question to a model.
//   node verses2.mjs <claims.json> [result.json]   ·   export compare(quote, verseText) for the tests
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { norm } from 'file:///D:/Deeni Docs/curation/tools 2026-09-24 usul/usul-arabic.mjs';
const QV = 'D:/Deeni Docs/curation/cloud-package 2026-10-01 fast-search/tools/quran-verse.mjs';
const MARKS = /[ۖ-ۭٓ-ٕ]/g;
// each word in two readings of the Mushaf spelling: dagger alif dropped (A) and dagger alif as a written alif (B)
const words = (s) => String(s || '').replace(/\d+:\d+/g, ' ').replace(MARKS, '').split(/\s+/).filter(Boolean)
  .map((w) => ({ a: norm(w), b: norm(w.replace(/ٰ/g, 'ا')) })).filter((w) => w.a);
const noAlif = (s) => s.replace(/ا/g, '');
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const same = (s, v) => s.a === v.a || s.a === v.b || (noAlif(s.a).length >= 4 && noAlif(s.a) === noAlif(v.a));
const near = (s, v) => lev(s.a, v.a) === 1 || lev(s.a, v.b) === 1;

// align one recited stretch against the verse words: LCS on "same", then classify what is left over
function lcsPairs(S, V, off) {
  const n = S.length, m = V.length; const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = same(S[i], V[j]) ? 1 + L[i + 1][j + 1] : Math.max(L[i + 1][j], L[i][j + 1]);
  const pairs = []; let i = 0, j = 0;
  while (i < n && j < m) { if (same(S[i], V[j]) && L[i][j] === 1 + L[i + 1][j + 1]) { pairs.push([i, j + off]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  return pairs;
}
function alignStretch(S, V) {
  const n = S.length, m = V.length;
  // the tightest fit: try every start in the verses (a repeated short word must not pull the stretch back to its first copy)
  let pairs = []; let bestKey = null;
  for (let j0 = 0; j0 < m; j0++) { const p = lcsPairs(S, V.slice(j0, Math.min(m, j0 + n + 8)), j0); if (!p.length) continue;
    const key = [p.length, -(p[p.length - 1][1] - p[0][1])]; if (!bestKey || key[0] > bestKey[0] || (key[0] === bestKey[0] && key[1] > bestKey[1])) { bestKey = key; pairs = p; } }
  const usedS = new Set(pairs.map((p) => p[0])); const usedV = new Set(pairs.map((p) => p[1]));
  // the span reaches past the edge by as many words as he said there that did not align (a swapped first or last word)
  let lo = pairs.length ? pairs[0][1] : 0, hi = pairs.length ? pairs[pairs.length - 1][1] : -1;
  if (pairs.length) { lo = Math.max(0, lo - pairs[0][0]); hi = Math.min(m - 1, hi + (n - 1 - pairs[pairs.length - 1][0])); }
  const extra = S.map((w, k) => (usedS.has(k) ? null : w)).filter(Boolean);                                  // said, not in the verse there
  const skipped = V.slice(lo, hi + 1).map((w, k) => (usedV.has(lo + k) ? null : w)).filter(Boolean);           // in the verse, not said
  // a negation right at the edge of the stretch, not said, inverts the meaning («تأخذه سنة» for «لا تأخذه سنة»): counted too
  const NEG = new Set(['لا', 'ما', 'لم', 'لن', 'ليس', 'الا', 'ولا', 'وما', 'فلا']);
  if (pairs.length && lo > 0 && NEG.has(V[lo - 1].a)) skipped.push(V[lo - 1]);
  if (pairs.length && hi + 1 < m && NEG.has(V[hi + 1].a) && hi + 2 >= m) skipped.push(V[hi + 1]);
  // a word swapped for a one-letter-off word is one "near" pair, not an extra + a skipped
  const nearPairs = []; for (const e of [...extra]) { const k = skipped.findIndex((v) => near(e, v)); if (k >= 0) { nearPairs.push([e.a, skipped[k].a]); extra.splice(extra.indexOf(e), 1); skipped.splice(k, 1); } }
  // a spoken word that IS in the verses but out of this order counts as an order change
  const outOfOrder = extra.filter((e) => V.some((v) => same(e, v)));
  return { matched: pairs.length, extra: extra.filter((e) => !outOfOrder.includes(e)).map((w) => w.a), outOfOrder: outOfOrder.map((w) => w.a), skipped: skipped.map((w) => w.a), near: nearPairs };
}
export function compare(quote, verseText) {
  const V = words(verseText); const res = { extra: [], outOfOrder: [], skipped: [], near: [], matched: 0, said: 0 };
  for (const stretch of String(quote).split('…').map((s) => s.trim()).filter(Boolean)) {
    const S = words(stretch); const r = alignStretch(S, V); for (const k of ['extra', 'outOfOrder', 'skipped', 'near']) res[k].push(...r[k]); res.matched += r.matched + r.near.length; res.said += S.length;
  }
  const off = res.extra.length + res.outOfOrder.length + res.skipped.length;
  res.state = !off && !res.near.length ? 'matches' : !off && res.near.length === 1 ? 'one letter off: a moderator listens' : 'differs: one question to a model';
  return res;
}

if (process.argv[1] && process.argv[1].endsWith('verses2.mjs') && process.argv[2]) {
  const claims = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const out = {};
  for (const c of claims) {
    if (!c.verse_text) { out[c.tag] = { state: 'no verse text', said: c.quote }; continue; }
    let text = c.verse_text; let r = compare(c.quote, text); let extra = null;
    // the range gap (e.g. 25:63-66 quoting 25:75): words said but in no listed verse → search quran.com for them, add the verse, compare again
    if (r.extra.length >= 3) {
      const lines = execFileSync('node', [QV, 'search', r.extra.slice(0, 5).join(' ')], { encoding: 'utf8' }).split('\n').slice(1);
      for (const line of lines) { const parts = line.trim().split(/\s+/); if (!/^\d+:\d+$/.test(parts[0] || '')) continue;
        const r2 = compare(c.quote, text + '\n' + parts.join(' ')); if (r2.extra.length <= r.extra.length - 3 && r2.extra.length <= r.extra.length / 2) { r = r2; extra = parts[0]; text += '\n' + parts.join(' '); break; } }
    }
    out[c.tag] = { ...r, reference: (c.reference || '') + (extra ? ' + ' + extra + ' (found by the script)' : ''), said: c.quote };
  }
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
  for (const [t, r] of Object.entries(out)) console.log(t, '|', r.state, '|', r.reference, [r.extra?.length && 'extra: ' + r.extra.join(' '), r.skipped?.length && 'skipped: ' + r.skipped.join(' '), r.outOfOrder?.length && 'order: ' + r.outOfOrder.join(' '), r.near?.length && 'near: ' + r.near.map((p) => p.join('/')).join(' ')].filter(Boolean).join(' · '));
}

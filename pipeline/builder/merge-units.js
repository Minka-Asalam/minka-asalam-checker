// THE BUILDER'S SAFETY NET (layer 3 of the source-unit fix, 2026-10-01).
// After the checker, claims of ONE video that resolved to the SAME hadith or
// the SAME verse are one source unit cut into pieces: they merge into one
// claim, pieces ordered by time. Rulings that only share a book page are
// distinct rulings (three schools on one Kuwaiti page) and are FLAGGED, never
// merged. A claim the checker marked `continues: <i>` joins claim i's unit.
// A claim whose core source is only a SIDE part of another claim spanning it
// (the verse a hadith quotes) is recorded as nested, not merged.
//
//   node merge-units.js <results.json> [out.json]
// results.json = the assembler's format: { data: { videos: [{ id, claims: [{ i, kind, timestamp,
//   timestamp_end, quote, pieces?, new: { flow_kind, state, level, parts, continues? } }] }] } }
// Writes { videos: [{ id, merges, flags, nested, claims }] } where claims is
// the video's claim list with every merge applied. Reads nothing else, writes
// nothing but out.json.
const fs = require('fs');

const sec = (t) => { const p = String(t || '').split(':').map(Number); return p.some((n) => !Number.isFinite(n)) ? NaN : p.reduce((a, n) => a * 60 + n, 0); };
const digits = (s) => String(s || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\s+/g, ' ').trim();
const WORST = ['corrected', 'not_found', 'overstated', 'not_checked', 'pending', 'rekinded', 'not_a_claim', 'by_meaning', 'matches'];

// A part's source identities, by kind of identity.
function partIds(p) {
  const s = p.source || {};
  const ids = [];
  if (s.link && /dorar\.net\/h\//.test(s.link)) ids.push('hadith:dorar:' + s.link.replace(/.*\/h\//, '').replace(/[?#].*/, ''));
  if (s.collection && s.number) ids.push('hadith:num:' + digits(s.collection) + ' ' + digits(s.number));
  if (s.link && /quran\.com\//.test(s.link)) ids.push('verse:' + s.link.replace(/.*quran\.com\//, '').replace(/[?#].*/, ''));
  if (s.page_url) ids.push('page:' + s.page_url.replace(/\?.*/, ''));
  return ids;
}
// The claim's CORE identities: from the parts on the claim's own flow (a
// hadith claim's narration, a Qur'an claim's verse), never from a side part.
function coreIds(c) {
  const n = c.new; if (!n) return [];
  const own = n.parts.filter((p) => (p.flow_kind || n.flow_kind) === n.flow_kind);
  const want = n.flow_kind === 'quran' ? 'verse:' : n.flow_kind === 'hadith' ? 'hadith:' : null;
  return [...new Set(own.flatMap(partIds).filter((id) => (want ? id.startsWith(want) : false)))];
}
// How many different narrations a claim's core parts rest on: identities
// printed on one part are one narration (a permalink and its collection
// number), and parts sharing an identity are the same narration.
function narrations(c) {
  const n = c.new; if (!n) return 0;
  const want = n.flow_kind === 'quran' ? 'verse:' : n.flow_kind === 'hadith' ? 'hadith:' : null;
  if (!want) return 0;
  const groups = n.parts.filter((p) => (p.flow_kind || n.flow_kind) === n.flow_kind).map((p) => partIds(p).filter((id) => id.startsWith(want))).filter((g) => g.length);
  const merged = [];
  for (const g of groups) {
    const hit = merged.filter((m) => g.some((id) => m.has(id)));
    const into = new Set(g);
    for (const m of hit) { for (const id of m) into.add(id); merged.splice(merged.indexOf(m), 1); }
    merged.push(into);
  }
  return merged.length;
}
const sideIds = (c) => (c.new ? [...new Set(c.new.parts.flatMap(partIds))] : []);
const pageIds = (c) => (c.new ? [...new Set(c.new.parts.flatMap(partIds).filter((id) => id.startsWith('page:')))] : []);

function mergeVideo(v) {
  const claims = v.claims.filter((c) => c.new);
  const parent = new Map(claims.map((c) => [c.i, c.i]));
  const find = (i) => { while (parent.get(i) !== i) i = parent.get(i); return i; };
  const why = new Map();
  const union = (a, b, via) => { const ra = find(a), rb = find(b); if (ra === rb) return; const [lo, hi] = ra < rb ? [ra, rb] : [rb, ra]; parent.set(hi, lo); why.set(`${a}-${b}`, via); };
  // nested: B's core id is a side part of A, and B's time sits inside A's span
  const nested = [];
  const isNested = (a, b) => {
    const sa = sec(a.timestamp), ea = sec(a.timestamp_end || a.timestamp), sb = sec(b.timestamp);
    return sb >= sa - 1 && sb <= ea + 1;
  };
  for (const b of claims) for (const a of claims) {
    if (a === b) continue;
    const shared = coreIds(b).filter((id) => sideIds(a).includes(id) && !coreIds(a).includes(id));
    if (shared.length && isNested(a, b)) nested.push({ inner: b.i, outer: a.i, via: shared[0] });
  }
  const nestedPair = new Set(nested.map((x) => `${Math.min(x.inner, x.outer)}-${Math.max(x.inner, x.outer)}`));
  // same core identity → one unit. A claim resting on TWO narrations (one
  // part on each) is never a bridge: the owner ruled 2026-10-01 that the
  // Ashura pair is two hadith although old claim 2 carried a part of each, and
  // the Khaybar closing line has the very same shape, so identities alone
  // cannot tell a mixed claim from a unit's last piece. Such a claim is
  // FLAGGED with the claim it shares a narration with; the checker's
  // continuation reading (layer 2), which compares the text, decides it.
  const mixed = new Set(claims.filter((c) => narrations(c) > 1).map((c) => c.i));
  const byId = new Map();
  for (const c of claims) for (const id of coreIds(c)) { if (!byId.has(id)) byId.set(id, []); byId.get(id).push(c.i); }
  const mixedFlags = [];
  for (const [id, is] of byId) for (let k = 1; k < is.length; k++) {
    const [a, b] = [is[0], is[k]];
    if (nestedPair.has(`${Math.min(a, b)}-${Math.max(a, b)}`)) continue;
    if (mixed.has(a) || mixed.has(b)) { mixedFlags.push({ claims: [a, b], via: id, note: 'one of these claims rests on two narrations; the shared one may be the same unit or a second hadith told beside it — the checker\'s continuation reading or a moderator decides' }); continue; }
    union(a, b, id);
  }
  // the checker's continuation mark
  for (const c of claims) if (c.new.continues && parent.has(c.new.continues)) union(c.new.continues, c.i, 'continues');
  const groups = new Map();
  for (const c of claims) { const r = find(c.i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(c); }
  const merges = [...groups.values()].filter((g) => g.length > 1).map((g) => ({ claims: g.map((c) => c.i), via: [...new Set([...why.entries()].filter(([k]) => g.some((c) => k.split('-').map(Number).includes(c.i))).map(([, v]) => v))] }));
  // same book page, different units → a flag for a human, never a merge
  const flags = [];
  const byPage = new Map();
  for (const c of claims) for (const id of pageIds(c)) { if (!byPage.has(id)) byPage.set(id, new Set()); byPage.get(id).add(c.i); }
  for (const [id, set] of byPage) { const is = [...set].sort((a, b) => a - b); if (is.length > 1 && new Set(is.map(find)).size > 1) flags.push({ claims: is, via: id, note: 'same page, kept apart: distinct rulings or reports sharing a page' }); }
  for (const f of mixedFlags) if (find(f.claims[0]) !== find(f.claims[1])) flags.push(f);
  // the merged claim list
  const out = [];
  for (const g of groups.values()) {
    g.sort((a, b) => sec(a.timestamp) - sec(b.timestamp));
    if (g.length === 1) { out.push(g[0]); continue; }
    const first = g[0];
    const pieces = g.flatMap((c) => (c.pieces && c.pieces.length ? c.pieces : [{ timestamp: c.timestamp, timestamp_end: c.timestamp_end, quote: c.quote, from_claim: c.i }])).sort((a, b) => sec(a.timestamp) - sec(b.timestamp));
    let pos = 0;
    const parts = g.flatMap((c) => c.new.parts.map((p) => ({ ...p, position: ++pos, from_claim: c.i })));
    const state = WORST.find((s) => parts.some((p) => p.state === s)) || first.new.state;
    out.push({
      ...first,
      i: Math.min(...g.map((c) => c.i)),
      merged_from: g.map((c) => c.i),
      timestamp: pieces[0].timestamp,
      timestamp_end: pieces.map((p) => p.timestamp_end || p.timestamp).sort((a, b) => sec(a) - sec(b)).pop(),
      quote: pieces.map((p) => p.quote).join(' … '),
      pieces,
      new: { ...first.new, state, parts, continues: null },
    });
  }
  out.sort((a, b) => a.i - b.i);
  return { id: v.id, merges, flags, nested, claims: out };
}

if (require.main === module) {
  const [, , IN, OUT] = process.argv;
  const R = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const videos = (R.data ? R.data.videos : R.videos).map(mergeVideo);
  for (const v of videos) {
    for (const m of v.merges) console.log(`${v.id}  MERGE ${m.claims.join('+')}  via ${m.via.join(', ')}`);
    for (const f of v.flags) console.log(`${v.id}  flag  ${f.claims.join(',')}  ${f.via}`);
    for (const n of v.nested) console.log(`${v.id}  nested #${n.inner} inside #${n.outer}  via ${n.via}`);
  }
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ videos }, null, 1));
}
module.exports = { mergeVideo, coreIds, partIds, narrations };

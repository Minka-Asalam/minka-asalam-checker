// The rulings ladder's questions and script pieces, copied UNCHANGED from method v4
// (D:/Deeni Docs/Claims_Redesign_2026-10/method-v4/rulings/ladder4.mjs, lines 34-157) by a generator, so the
// worker asks exactly the measured questions. Only the surrounding command-line driver is left out.
import { execFileSync } from 'node:child_process';
import { norm } from '../../../pipeline/tools/usul-arabic.mjs';
import { search, book, words, SHELF, GUARD, claimBlock, batches } from './ladder-lib.mjs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const S0 = (items, out) => `${GUARD}

A speaker in a religious video stated each claim below. Before anyone searches, DECOMPOSE it: how many rulings are in it?
- one ruling → one part, kind "ruling";
- a general rule the speaker applies to a case (e.g. «التوبة تجب ما قبلها» applied to missed prayers) → two parts: kind "rule" (the general rule) and kind "application" (the case, which may or may not be covered by the rule);
- several rulings packed into one sentence (e.g. «مس المرأة الأجنبية حرام» and «مس المرأة لا ينقض الوضوء») → one part per ruling, kind "ruling".
For EVERY part give:
- said: the EXACT words of the speaker that carry this part, copied character for character from "the speaker's words" (a stretch of them, never rephrased, never shortened inside);
- text: what this part asserts, in Arabic, one short sentence, saying NOTHING the speaker did not say (no case, condition, category or example he did not mention: if he spoke of money, do not add trade goods);
- stance: how HE presented it: "rule" (as the ruling, with no word about other views), "one_view" (he said it is one view, an opinion of some scholars, or that scholars differ), "agreement" (he said all scholars, there is consensus, no one disagrees);
- question: the plain question an ordinary Muslim would ask about it, in Arabic (e.g. «هل العرق ينقض الوضوء؟»);
- key_terms: the Arabic key terms a book would use for THIS case, naming the thing itself (e.g. «مس الفرج», «حائل»);
- answer: a short answer in English, from your own knowledge (the ruling, and who holds it if the schools differ).

${items.map(claimBlock).join('\n\n')}

Write this JSON to the file ${out}:
{"claims":[{"tag":"<tag>","parts":[{"id":"p1","kind":"ruling|rule|application","said":"<his exact words>","text":"<arabic>","stance":"rule|one_view|agreement","question":"<arabic>","key_terms":["<arabic>"],"answer":"<english>"}]}]}
One entry per claim, same tags; part ids p1, p2, … in order.`;

const Q1 = (items, out) => `${GUARD}

A speaker in a religious video stated each claim below, already split into PARTS (each part one ruling, with the plain question about it and a hint: another model's short answer and the key terms; use the hint if it helps, ignore what you judge wrong). We look for the page of a trusted book that states each part. The shelf (use the slug exactly):
${SHELF.map(([s, d]) => `  ${s} — ${d}`).join('\n')}

For each PART give one or two books from the shelf, best first, each with:
- chapter: 2 to 4 Arabic words as that book's own chapter heading would say them;
- sentences: THREE sentences the passage would contain, each 5 to 8 consecutive words in that book's own classical Arabic. EVERY sentence must name the part's key term itself (the thing ruled on), never only a pronoun or a neighbouring topic. Never the speaker's dialect, never English.

${items.map((c) => `${claimBlock(c)}\n${c.parts.map((p) => `  PART ${p.id} (${p.kind}): ${p.text} · question: ${p.question} · key terms: ${(p.key_terms || []).join('، ')} · hint: ${p.answer}`).join('\n')}`).join('\n\n')}

Write this JSON to the file ${out}:
{"claims":[{"tag":"<tag>","parts":[{"id":"p1","books":[{"slug":"<slug>","chapter":"<arabic>","sentences":["<5-8 words>","<5-8 words>","<5-8 words>"]}]}]}]}
One entry per claim, same tags, one entry per part.`;

const Q2 = (items, out) => `${GUARD}

A speaker in a religious video stated each claim below, split into PARTS. For each part a search printed passages from trusted books and answers of fatwa bodies.

For each part: which passage STATES it? Judge ONLY from the passage text shown here, never from what you know: a passage that is only a list of titles, links or menu words states nothing. Then give the verdict:
- "same": the passage states the part, as he framed it;
- "narrower": the passage states only part of what he said, or only a narrower case (OUR source is short: not his fault);
- "one_view": he gave it as THE ruling, and the passage states it as one view among several (it names other views);
- "other_view": the passage itself holds a different view, but reports his view as held by some scholars;
- "more": he claimed more agreement than the passage gives (he said "all scholars" or "consensus" where it names one view);
- "opposite": the passage states the CONTRARY and says that is agreed, or that no one holds his view, or refutes his view by name;
- "no": no passage states it → pick 0.
A passage on a neighbouring topic is not it (touching a woman is not touching the private part; impurity coming out of the body is not impurity landing on it).
For every pick, copy into "evidence" the ONE sentence of that passage, character for character, that states it (a script checks it is in the passage).

${items.map((c) => `${claimBlock(c)}\n${c.parts.map((p) => `  PART ${p.id} (${p.kind}): he said «${p.said || ''}» · meaning: ${p.text} · as he framed it: ${p.stance || 'rule'}\n${p.cands.length ? p.cands.map((h, i) => `   [${i + 1}] ${h.title}${h.vol ? ` vol ${h.vol}` : ''}${h.page ? ` p.${h.page}` : ''}: ${h.excerpt}`).join('\n') : '   (none)'}`).join('\n')}`).join('\n\n')}

Write this JSON to the file ${out}:
{"claims":[{"tag":"<tag>","parts":[{"id":"p1","pick":<number or 0>,"verdict":"same|narrower|one_view|other_view|more|opposite|no","evidence":"<the sentence, copied>"}]}]}
One entry per claim, same tags, one entry per part shown.`;

const VQ = (items, out) => `${GUARD}

A speaker in a religious video stated each claim below. Beside one PART of it is ONE page of a trusted book or ONE answer of a fatwa body, chosen for that part. Read it all and judge ONLY from that text, never from what you know:
- "same": it states the part, as he framed it;
- "narrower": it states only part of what he said, or a narrower case (our source is short, not his fault);
- "one_view": he gave it as THE ruling; the source states it as one view among several;
- "other_view": the source holds a different view but reports his as held by some scholars;
- "more": he claimed more agreement than the source gives;
- "opposite": the source states the contrary AND says that is agreed, or that no one holds his view, or refutes his view by name;
- "no": it does not state the part (another ruling, a neighbouring topic, or only titles and links).
Judge the part against HIS words, not against the meaning line if the meaning line says more than he did.

${items.map((x) => `- key: ${x.key}\n  the speaker's words: ${x.quote}\n  the part checked: he said «${x.said || ''}» · meaning: ${x.text} · as he framed it: ${x.stance || 'rule'}\n  the source (${x.src}):\n  ${x.full}`).join('\n\n')}

Write this JSON to the file ${out}:
{"claims":[{"tag":"<key>","states":"same|narrower|one_view|other_view|more|opposite|no","evidence":"<the one sentence of the source that decides it, copied>","why":"<one short English sentence>"}]}
One entry per key, using the key as the tag.`;

function fetchFatwa(url) {
  try {
    const html = execFileSync('curl', ['-s', '-L', '-m', '25', '-A', UA, url], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    let t = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
    const title = (/<title>([^<]*)/.exec(html) || [])[1] || url;
    t = t.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    // v4 (the review panel): keep ONLY the answer block. It starts at the answer's opening and ends at the closing formula
    // «والله أعلم» or, failing that, at the first "related" section; the site's menus, related titles and links never
    // reach the judge (v3 handed Haiku islamweb's related-links list for zakat #4, #8 and #20).
    const starts = ['الإجابة', 'الجواب', 'الحمد لله'].map((k) => t.indexOf(k)).filter((i) => i >= 0);
    const at = starts.length ? Math.min(...starts) : -1;
    let body = at >= 0 ? t.slice(at) : '';
    const endF = body.search(/والله (تعالى )?أعلم/); const endR = body.search(/(مواد|فتاوى|روابط|موضوعات|أسئلة) ذات صلة|-->/);
    const ends = [endF >= 0 ? endF + body.slice(endF).match(/والله (تعالى )?أعلم/)[0].length : -1, endR].filter((i) => i > 0);
    if (ends.length) body = body.slice(0, Math.min(...ends));
    if (body.length < 120) return null; // no answer block found: the page is not shown to the judge at all
    return { title: title.trim().replace(/\s*-\s*إسلام ويب.*$/, '').replace(/\s*-\s*الإسلام سؤال وجواب.*$/, ''), text: body.slice(0, 6000) };
  } catch { return null; }
}
const windowOf = (text, keys, W = 120) => {
  const raw = String(text || '').split(/\s+/).filter(Boolean); if (raw.length <= W) return raw.join(' ');
  const ks = new Set(keys.flatMap(words)); const hit = raw.map((w) => (ks.has(norm(w)) ? 1 : 0)); let best = -1, at = 0;
  for (let k = 0; k + W <= raw.length; k++) { const s = hit.slice(k, k + W).reduce((a, b) => a + b, 0); if (s > best) { best = s; at = k; } }
  return (at > 0 ? '… ' : '') + raw.slice(at, at + W).join(' ') + (at + W < raw.length ? ' …' : '');
};
const pageText = (h) => { if (h.full) return h.full; const b = book(h.slug); const pg = b.pages.find((x) => x.i === h.i); return String(pg.text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); };
const pageTextSafe = (h) => { try { return pageText(h); } catch { return h.full || ''; } };
// is this sentence (copied by a model) really in that text? normalised, punctuation dropped; at least its first 8 words in
// order, or the whole of it when shorter
export const inText = (sentence, text) => {
  const w = (s) => norm(String(s || '')).replace(/[^\p{L}\p{N} ]+/gu, ' ').split(' ').filter(Boolean);
  const s = w(sentence); if (s.length < 3) return false; const t = ' ' + w(text).join(' ') + ' ';
  return t.includes(' ' + s.slice(0, Math.min(8, s.length)).join(' ') + ' ');
};
// the second look's verdict + how HE framed it → the record's state, a standing hint for the line writer, a review flag
export function stateOf(verdict, stance = 'rule') {
  switch (verdict) {
    case 'same': return { state: 'matches', standing: null, flag: null };
    case 'narrower': return { state: 'matches', standing: null, flag: 'our page states only part of it: find a fuller page or accept (our gap, not his)' };
    case 'one_view': return stance === 'agreement' ? { state: 'overstated', standing: 'one view', flag: 'he said all scholars; the source names it one view' }
      : { state: 'matches', standing: stance === 'one_view' ? 'one view, as he said' : 'one view of several', flag: null };
    case 'other_view': return stance === 'agreement' ? { state: 'overstated', standing: 'scholars differ', flag: 'he said all scholars; the source holds another view' }
      : { state: 'matches', standing: stance === 'one_view' ? 'a recognised view, as he said' : 'scholars differ', flag: stance === 'rule' ? 'the source holds another view: owner checks the line is fair' : null };
    case 'more': return { state: 'overstated', standing: null, flag: 'he claimed more agreement than the source gives' };
    case 'opposite': return stance === 'one_view' ? { state: 'matches', standing: 'a recognised view, as he said', flag: 'the source rejects his view; he called it one view: owner checks it is a held view' }
      : { state: 'corrected', standing: null, flag: 'a correction: the owner confirms every one' };
    case 'no': return { state: 'not_found', standing: null, flag: null };
    default: return { state: 'pending', standing: null, flag: 'not checked by the second look' };
  }
}

export { S0, Q1, Q2, VQ, fetchFatwa, windowOf, pageText, pageTextSafe, search, book, batches };

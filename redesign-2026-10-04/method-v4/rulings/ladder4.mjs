// ladder4.mjs — method v4 (4 Oct 2026, after the review panel): ladder3 + each part keeps his exact words and how he framed it (checksplit), the fatwa answer block only, judges decide from the text and copy the sentence (checked), "partly" replaced by narrower / one_view / other_view, narrower goes back to Opus, and record maps verdict + framing to a fair state. Below: ladder3's header.
// ladder3.mjs — the rulings ladder, third version, with the owner's guidance of 4 Oct 2026:
//   s0  (Sonnet) DECOMPOSE first: how many rulings are in this claim? one ruling · a general rule + its application · several
//                rulings packed together (e.g. «مس المرأة الأجنبية حرام» + «مس المرأة ينقض الوضوء؟»). Every part gets its own plain
//                question (as a person would ask it), its key terms, and a short answer.
//   q1  (Opus)   where to look, PER PART, the key term named in every sentence
//   books (script) the verified copies searched per part; fatwas (script) the part's plain question searched on the fatwa sites
//   q2  (Haiku)  per part: which passage states it? same / partly / more / OPPOSITE (it states the contrary) / no
//   valid (Opus) the second look on Haiku's picks
//   redo (Opus)  the cascade, as for hadith: a part Haiku could not finish (no pick, or the second look rejected it) is judged
//                again by Opus over the same candidates; valid2 (Sonnet) the second look on Opus's picks (a different model)
//   node ladder3.mjs s0 | merge <stem> | q1 <tags> | books | fatwas | q2 | final | valid | redo | final2 | valid2
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { search, book, words, SHELF, GUARD, claimBlock, batches } from './ladder-lib.mjs';
import { norm } from 'file:///D:/Deeni Docs/curation/tools 2026-09-24 usul/usul-arabic.mjs';
import { bookStatus } from '../books/bookStatus.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUN = path.join(HERE, 'runs'); fs.mkdirSync(RUN, { recursive: true });
const [cmd, a1] = process.argv.slice(2);
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const R = (f) => path.join(RUN, f); const has = (f) => fs.existsSync(f);
const fwd = (f) => f.split(path.sep).join('/');
const ALL = () => J(path.join(HERE, 'inputs', 'claims.json'));
const SCOPE = () => (has(R('scope.json')) ? new Set(J(R('scope.json'))) : null);
const claims = () => { const s = SCOPE(); return ALL().filter((c) => !s || s.has(c.tag)); };
const answers = (f) => (has(R(f)) ? Object.fromEntries(J(R(f)).claims.map((x) => [x.tag, x])) : {});
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const partsOf = (tag) => ((answers('s0.json')[tag] || {}).parts || [{ id: 'p1', kind: 'ruling', said: (ALL().find((c) => c.tag === tag) || {}).quote, stance: 'rule', question: '', key_terms: [], text: '' }]);

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
const write = (stem, items, prompt, size) => { let b = 0; for (const part of batches(items, size)) { b++; fs.writeFileSync(R(`prompt-${stem}-b${b}.txt`), prompt(part, fwd(R(`${stem}-b${b}.json`)))); } return b; };

if (cmd === 's0') {
  console.log('s0 prompts', write('s0', ALL(), S0, 7));
} else if (cmd === 'merge') {
  const re = new RegExp('^' + a1 + '-b[0-9]+[.]json$'); const parts = fs.readdirSync(RUN).filter((f) => re.test(f));
  const all = parts.flatMap((f) => J(R(f)).claims); fs.writeFileSync(R(`${a1}.json`), JSON.stringify({ claims: all }, null, 1));
  console.log('merged', a1, parts.length, 'files', all.length, 'entries');
} else if (cmd === 'q1') {
  console.log('q1 prompts', write('q1', claims().map((c) => ({ ...c, parts: partsOf(c.tag) })), Q1, 6));
} else if (cmd === 'books') {
  const q1 = answers('q1.json'); const out = {};
  for (const c of claims()) { out[c.tag] = {};
    for (const p of partsOf(c.tag)) { const bk = (((q1[c.tag] || {}).parts || []).find((x) => x.id === p.id) || {}).books || [];
      const all = bk.flatMap((b) => search(b.slug, b.chapter, b.sentences || [])); all.sort((x, y) => y.score - x.score); const pick = [];
      for (const h of all) { if (pick.some((o) => o.slug === h.slug && o.i === h.i)) continue; pick.push(h); if (pick.length === 4) break; }
      out[c.tag][p.id] = pick; } }
  fs.writeFileSync(R('cands-books.json'), JSON.stringify(out, null, 1)); console.log('books searched', Object.keys(out).length, 'claims');
} else if (cmd === 'fatwas') {
  // runs/fatwa-urls.json: {"<tag>@<part id>": [url…]} — each part's plain question searched on islamweb.net + islamqa.info
  const urls = J(R('fatwa-urls.json')); const out = {};
  for (const [key, list] of Object.entries(urls)) { const [tag, id] = key.split('@'); const p = partsOf(tag).find((x) => x.id === id) || {}; out[key] = [];
    for (const u of list.slice(0, 5)) { const f = fetchFatwa(u); if (f) out[key].push({ title: f.title, link: u, excerpt: windowOf(f.text, p.key_terms || []), full: f.text, fatwa: true }); } }
  fs.writeFileSync(R('cands-fatwas.json'), JSON.stringify(out, null, 1)); console.log('fatwas opened', Object.values(out).reduce((a, x) => a + x.length, 0));
} else if (cmd === 'q2') {
  const bk = J(R('cands-books.json')); const fw = has(R('cands-fatwas.json')) ? J(R('cands-fatwas.json')) : {};
  const items = claims().map((c) => ({ ...c, parts: partsOf(c.tag).map((p) => ({ ...p, cands: [...((bk[c.tag] || {})[p.id] || []), ...(p.kind === 'rule' ? [] : fw[`${c.tag}@${p.id}`] || [])] })) }));
  fs.writeFileSync(R('cands-all.json'), JSON.stringify(Object.fromEntries(items.map((c) => [c.tag, c.parts])), null, 1));
  console.log('q2 prompts', write('q2', items, Q2, 3));
} else if (cmd === 'final' || cmd === 'final2') {
  // final: Haiku's picks · final2: Opus's re-judging replaces the parts Haiku could not finish
  const ca = J(R('cands-all.json')); const q2 = answers(cmd === 'final' ? 'q2.json' : 'redo.json'); const prev = cmd === 'final2' ? J(R('final.json')) : null; const out = {};
  for (const c of claims()) out[c.tag] = (ca[c.tag] || []).map((p) => {
    if (prev) { const old = (prev[c.tag] || []).find((x) => x.id === p.id); if (!old || !old.redo) return old; }
    const a = ((q2[c.tag] || {}).parts || []).find((x) => x.id === p.id); let h = a && a.pick > 0 && a.verdict !== 'no' && p.cands[a.pick - 1];
    // v4: the judge must copy the sentence that states it; the script checks that sentence is in the passage it saw
    const ev = h ? inText(a.evidence, `${h.excerpt || ''} ${pageTextSafe(h)}`) : false; if (h && !ev) h = null;
    return { id: p.id, kind: p.kind, said: p.said, text: p.text, stance: p.stance || 'rule', verdict: a ? a.verdict : null, evidence: a ? a.evidence : null, evidence_found: ev, by: cmd === 'final' ? 'haiku' : 'opus', pick: h ? { title: h.title, vol: h.vol, page: h.page, slug: h.slug, i: h.i, link: h.link, fatwa: !!h.fatwa } : null };
  });
  fs.writeFileSync(R(cmd === 'final' ? 'final.json' : 'final2.json'), JSON.stringify(out, null, 1));
  console.log(cmd, 'parts picked', Object.values(out).flat().filter((p) => p && p.pick).length, 'of', Object.values(out).flat().length);
} else if (cmd === 'valid' || cmd === 'valid2') {
  const fin = J(R(cmd === 'valid' ? 'final.json' : 'final2.json')); const ca = J(R('cands-all.json')); const items = [];
  for (const c of claims()) for (const p of fin[c.tag] || []) {
    if (!p || !p.pick || (cmd === 'valid2' && p.by !== 'opus')) continue;
    const h = (ca[c.tag].find((x) => x.id === p.id) || { cands: [] }).cands.find((x) => x.link === p.pick.link && (x.i === p.pick.i || p.pick.fatwa));
    items.push({ ...c, key: `${c.tag}@${p.id}`, text: p.text, said: p.said, stance: p.stance, src:`${p.pick.title}${p.pick.vol ? ` vol ${p.pick.vol}` : ''}${p.pick.page ? ` p.${p.pick.page}` : ''}`, full: pageText(h || p.pick).slice(0, 6000) });
  }
  console.log(cmd, 'prompts', write(cmd, items, VQ, 4), 'parts', items.length);
} else if (cmd === 'redo') {
  // the cascade: every part with no pick, whose pick the second look said "no" to, or whose page states only a narrower
  // case ("narrower": a fuller page may be among the candidates; v3 stopped there), goes to Opus over the same candidates
  const fin = J(R('final.json')); const v = answers('valid.json'); const ca = J(R('cands-all.json')); const items = [];
  for (const c of claims()) { const open = (fin[c.tag] || []).filter((p) => !p.pick || ['no', 'narrower'].includes((v[`${c.tag}@${p.id}`] || {}).states));
    for (const p of open) p.redo = true; if (open.length) items.push({ ...c, parts: open.map((p) => ca[c.tag].find((x) => x.id === p.id)) }); }
  fs.writeFileSync(R('final.json'), JSON.stringify(fin, null, 1));
  console.log('redo prompts', write('redo', items, Q2, 3), 'parts', items.reduce((a, c) => a + c.parts.length, 0), items.map((c) => c.tag).join(' '));
} else if (cmd === 'checksplit') {
  // v4: every part must carry the speaker's EXACT words; a part whose "said" is not in his quote is reset to the whole quote
  // and flagged, so no judge ever checks him against words he did not say
  const s0 = J(R('s0.json')); const quotes = Object.fromEntries(ALL().map((c) => [c.tag, c.quote])); let bad = 0;
  for (const c of s0.claims) for (const p of c.parts) { if (!inText(p.said, quotes[c.tag])) { bad++; p.split_flag = `"said" not in his words: ${p.said || '(empty)'}`; p.said = quotes[c.tag]; } p.stance = ['rule', 'one_view', 'agreement'].includes(p.stance) ? p.stance : 'rule'; }
  fs.writeFileSync(R('s0.json'), JSON.stringify(s0, null, 1)); console.log('split checked', s0.claims.reduce((a, c) => a + c.parts.length, 0), 'parts,', bad, 'reset to his whole quote');
} else if (cmd === 'record') {
  // v4: the second look's verdict and HOW HE FRAMED IT give the part's state. Colour the evidence, never the person:
  // our short page is a flag for the owner, not a fault of the speaker; a view he called one view is not "partly"; a
  // correction only where the source says agreement or refutes him, and the owner confirms every correction.
  const fin = J(R(has(R('final2.json')) ? 'final2.json' : 'final.json')); const v = answers('valid.json'), v2 = answers('valid2.json'); const out = {};
  for (const c of claims()) out[c.tag] = (fin[c.tag] || []).map((p) => {
    const look = (p.by === 'opus' ? v2 : v)[`${c.tag}@${p.id}`]; const verdict = !p.pick ? 'no' : look ? look.states : 'unchecked';
    // the owner's unreviewed-book rule (5 Oct): a book not cleared on the trusted list is flagged for the review page
    // (confirm → joins the list; refuse → not found; leave → published with «كتابٌ لم يراجعه مختصٌّ بعد»)
    const book = p.pick ? bookStatus(p.pick.link) : 'n/a'; const st = stateOf(verdict, p.stance);
    if (book === 'not_reviewed') st.flag = [st.flag, 'book not yet reviewed by a specialist: confirm, refuse, or publish with the note'].filter(Boolean).join(' | ');
    return { ...p, look: look ? look.states : null, look_why: look ? look.why : null, book, ...st };
  });
  fs.writeFileSync(R('record.json'), JSON.stringify(out, null, 1));
  const n = {}; for (const p of Object.values(out).flat()) n[p.state] = (n[p.state] || 0) + 1; console.log('record', JSON.stringify(n));
} else console.log('see the header');

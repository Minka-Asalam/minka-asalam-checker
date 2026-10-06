// chain6.mjs — method v4 (4 Oct 2026, after the review panel): chain5 + the grade read from a fixed word list, wording before tier in the pick, the safeguard keeps his words, "partly" and "pending" carried, every accepted grader kept. Below: chain5's header.
// chain5.mjs — Level 5, the owner's branching tree (3 Oct 2026). The SCRIPT holds the steps and engineers each next question
// from the previous answer; the small model only answers one simple question at a time.
//
//   m1   (model)  "Is this a hadith?"  yes | no | unsure
//   m2   (model)  yes/unsure → "Where can I find it?" (the book + three short pieces of its text as written there)
//                 no         → "Is there a hadith with the same meaning?" (yes + book + pieces | no → STOP: its own kind's flow)
//   search (script) dorar with the pieces; the list = tiers 1–4 with a link, ranked by words shared with the speaker (Level 4)
//   fork on the results:
//     found        → m3 "Which of these did he mean?" (Level 4's pick question, word for word)
//     nothing / 0  → retry "Say it another way" (three new pieces) → search → m3 again → or not found
//     weak or fabricated pick while a sound narration was printed → m4 "Is there a sound narration in this list with the
//                  same meaning?" → switch to it; else keep and mark for a moderator
//   record (script) every field copied from the printed hit; level from the grading by the fixed rule
//
//   node chain5.mjs m1 <g> | m2 <g> | search <step> | pick <round> <g> | merge <file> <g> | retry <g> | guard <g> | build <name> <outDir> | gate <keyFile>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tierOf } from './tools/hadith-tiers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const IN = path.join(HERE, 'inputs');
const RUN = path.join(HERE, 'runs');
fs.mkdirSync(RUN, { recursive: true });
const [cmd, a1, a2, a3] = process.argv.slice(2);
const readJ = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const has = (f) => fs.existsSync(f);
const R = (f) => path.join(RUN, f);
const fwd = (f) => f.split(path.sep).join('/');
const groups = () => fs.readdirSync(IN).filter((f) => /^group-\d+\.json$/.test(f)).map((f) => +f.match(/\d+/)[0]).sort((x, y) => x - y);
const claimsOf = (g) => readJ(path.join(IN, `group-${g}.json`)).videos.flatMap((v) => v.claims.map((c) => ({ tag: `${v.id}#${c.i}`, v, c })));
const answers = (file) => (has(R(file)) ? Object.fromEntries(readJ(R(file)).claims.map((x) => [x.tag, x])) : {});
const norm = (s) => String(s ?? '').replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();

const GUARD = `RULES FOR YOU: answer from your own knowledge only. Do not read any other file, do not run any command, do not search the web, do not start other agents. Write exactly one file, the answer file named below, containing only the JSON asked for.`;
const claimBlock = ({ tag, v, c }) => [
  `- tag: ${tag}`,
  `  speaker: ${v.speaker} (video: ${v.title})`,
  `  the speaker's words: ${c.quote}`,
  c.attribution ? `  how he introduced it: ${c.attribution}` : null,
  c.reference ? `  reference he gave: ${c.reference}` : null,
  `  in English: ${c.claim_en}`,
].filter(Boolean).join('\n');

// ---------- m1: is this a hadith? ----------
const M1 = (items, out) => `${GUARD}

A speaker in a religious video said each of the things below. For each one, answer one question: is this a hadith? Answer yes, no or unsure.

${items.map(claimBlock).join('\n\n')}

Write this JSON to the file ${out}:
{"claims":[{"tag":"<tag>","answer":"yes|no|unsure"}]}
One entry per claim, same tags.`;

// ---------- m2: the next question, engineered from m1's answer ----------
const PIECES = `three short pieces of its text as it is written there: 4 to 6 consecutive words each, from different parts of the text, never the speaker's dialect, never a paraphrase, without the chain of narrators`;
const M2 = (yes, no, out) => `${GUARD}

${yes.length ? `PART A. Each claim below is a hadith, or may be one. Where can I find it? For each one give the book where it is narrated, and ${PIECES}.

${yes.map(claimBlock).join('\n\n')}
` : ''}${no.length ? `
PART B. Each claim below is not a hadith in the speaker's words. Is there a hadith with the same meaning? If yes, give the book where it is narrated and ${PIECES}. If there is none, answer has_hadith "no".

${no.map(claimBlock).join('\n\n')}
` : ''}
Write this JSON to the file ${out}:
{"claims":[{"tag":"<tag>","has_hadith":"yes|no","book":"<book>","pieces":["<4-6 words>","<4-6 words>","<4-6 words>"]}]}
One entry per claim, same tags. For PART A claims has_hadith is "yes".`;

// ---------- the retry: say it another way ----------
const RETRY = (items, out) => `${GUARD}

You help find the SOURCE of hadith quoted in religious videos. For each claim below, a search of the hadith engine dorar.net with the pieces shown found NOTHING usable. Say it another way: write THREE NEW searches, each 4 to 6 consecutive words of the hadith's classical text as written in the books, different from the ones already tried: another narration's wording, the most distinctive phrase in the middle or end of the text, or the words of the Companion's question or the story around it. Never the speaker's dialect, never a paraphrase.

${items.map((x) => `${claimBlock(x)}\n  already tried (found nothing usable): ${x.tried.join(' | ') || '(nothing)'}`).join('\n\n')}

Write this JSON to the file ${out}:
{"claims":[{"tag":"<tag>","pieces":["<4-6 words>","<4-6 words>","<4-6 words>"]}]}
One entry per claim, same tags.`;

// ---------- m3: Level 4's pick question, word for word ----------
const TIER_WORD = { 1: 'tier 1 (Sahih al-Bukhari / Sahih Muslim)', 2: "tier 2 (al-Albani's grading books)", 3: "tier 3 (Shu'ayb al-Arna'ut)", 4: "tier 4 (Ibn Hajar's grading works)" };
const hitLine = (h, n) => `   [${n}] ${h.excerpt}\n       narrator: ${h.narrator || '-'} · book: ${h.source} ${h.number || ''} · grader: ${h.grader} · grading: ${h.grading} · ${TIER_WORD[h.tier]}`;
const PICK = (items, out) => `${GUARD}

A speaker in a religious video quoted a hadith (or a report). A hadith search engine (dorar.net) printed the results below, already filtered to the accepted sources and listed by how many words they share with the speaker. Each shows its tier in the owner's order of preference:
  tier 1 Sahih al-Bukhari or Sahih Muslim; tier 2 al-Albani's grading books; tier 3 Shu'ayb al-Arna'ut; tier 4 Ibn Hajar's grading works.
Judge ONLY from the result texts shown here, not from what you remember of the hadith.

For each claim pick the ONE result that is the source:
- It must be the SAME hadith the speaker told: the same saying or event, the same meaning. A different hadith on the same topic is not it.
- The same hadith often appears several times (once per book). Then pick the entry whose WORDING is closest to what the speaker said (the grade follows the wording he said); only between entries whose wording is equally close, the one with the best tier (the lowest tier number).
- If the speaker attributed it to a Companion and the results hold the Companion's words, pick that; do not pick a different narration just because it is graded higher.
- Answer 0 if no result is the hadith he told.
- Then check your pick: does the result's text say what the speaker said? same_meaning = "yes" (same meaning), "partly" (the same hadith, but he added or changed a detail), or "no" (it is not what he said — then pick must be 0).

${items.map(({ tag, c, hits }) => `- tag: ${tag}\n  the speaker's words: ${c.quote}${c.attribution ? `\n  how he introduced it: ${c.attribution}` : ''}\n  in English: ${c.claim_en}\n  results:\n${hits.length ? hits.map((h, i) => hitLine(h, i + 1)).join('\n') : '   (no results)'}`).join('\n\n')}

Write this JSON to the file ${out}:
{"claims":[{"tag":"<tag>","pick":<number or 0>,"same_meaning":"yes|partly|no"}]}
One entry per claim, same tags.`;

// ---------- m4: the safeguard ----------
const GUARDQ = (items, out) => `${GUARD}

For each claim below, the narration chosen as its source is graded WEAK or FABRICATED, but the search also printed narrations graded sound (sahih or hasan), listed below. Is there a sound narration in this list with the same meaning as what the speaker said? Answer its number, or 0 if none of them says the same thing.

${items.map(({ tag, c, chosen, sound }) => `- tag: ${tag}\n  the speaker's words: ${c.quote}\n  in English: ${c.claim_en}\n  chosen (weak or fabricated): ${chosen.excerpt} · ${chosen.source} ${chosen.number || ''} · ${chosen.grader}: ${chosen.grading}\n  sound narrations printed:\n${sound.map((h, i) => hitLine(h, i + 1)).join('\n')}`).join('\n\n')}

Write this JSON to the file ${out}:
{"claims":[{"tag":"<tag>","pick":<number or 0>}]}
One entry per claim, same tags.`;

// ---------- search + list (Level 4's script) ----------
function search(tag, words, ledger) {
  try { execFileSync('node', [path.join(HERE, 'tools', 'dorar.mjs'), 'search', words, '--tag', tag, '--ledger', ledger], { stdio: ['ignore', 'ignore', 'ignore'], timeout: 120000 }); } catch { /* blocked = exit 3, in the ledger */ }
}
const STOPW = new Set('في من على عن الى ان او ما لا و ثم قال صلى الله عليه وسلم رسول النبي يا هو هي كان هذا ذلك التي الذي اذا قد كل'.split(' '));
const wordsOf = (t) => norm(t).replace(/[^\p{L}\p{N} ]+/gu, ' ').split(' ').filter((w) => w.length > 2 && !STOPW.has(w));
function excerpt(text, qs) {
  const raw = String(text || '').split(/\s+/);
  if (raw.join(' ').length <= 300) return raw.join(' ');
  const hit = raw.map((w) => (qs.has(norm(w).replace(/[^\p{L}\p{N}]+/gu, '')) ? 1 : 0));
  const W = 45; let best = 0, at = 0;
  for (let i = 0; i + W <= raw.length; i++) { const s = hit.slice(i, i + W).reduce((p, q) => p + q, 0); if (s > best) { best = s; at = i; } }
  return (at > 0 ? '… ' : '') + raw.slice(at, at + W).join(' ') + (at + W < raw.length ? ' …' : '');
}
function allHits(g) {
  const by = {};
  const f = R(`ledger-g${g}.jsonl`);
  if (!has(f)) return by;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (e.cmd !== 'search') continue;
    const list = (by[e.tag] ||= []);
    for (const h of e.hits || []) {
      if (!h.permalink) continue;
      const t = tierOf({ grader: h.grader, source: h.source }).tier;
      if (!t || list.some((x) => x.permalink === h.permalink)) continue;
      list.push({ ...h, tier: t });
    }
  }
  return by;
}
function queryWords(g) {
  const q = {};
  for (const x of claimsOf(g)) q[x.tag] = new Set(wordsOf(x.c.quote));
  for (const f of [`m2-g${g}.json`, `retry-g${g}.json`]) if (has(R(f))) for (const a of readJ(R(f)).claims) for (const p of a.pieces || []) for (const w of wordsOf(p)) (q[a.tag] ||= new Set()).add(w);
  return q;
}
function candidates(g) {
  const by = allHits(g), q = queryWords(g);
  for (const k of Object.keys(by)) {
    const qs = q[k] || new Set();
    for (const h of by[k]) { const hw = new Set(wordsOf(h.text)); h.score = [...qs].filter((w) => hw.has(w)).length; h.excerpt = excerpt(h.text, qs); }
    by[k] = by[k].sort((x, y) => y.score - x.score || x.tier - y.tier).slice(0, 10);
  }
  return by;
}
// v4 (the review panel, 4 Oct): the grade is read from a FIXED word list, whole words only (واه no longer matches inside
// رواه), negations first («ليس بصحيح», «لا يصح» are weak), and the FIRST verdict word decides, because a grader leads with
// his verdict on the hadith and then speaks of a chain («صحيح، وهذا إسناد ضعيف» is sahih). A Bukhari/Muslim entry is
// level 1 unless the page marks it suspended (معلق), which is graded like any other entry.
const GRADE_WORDS = [
  [5, ['موضوع', 'باطل', 'مكذوب', 'لا اصل له', 'لا اصل']],
  [4, ['ليس بصحيح', 'لا يصح', 'لا يثبت', 'غير صحيح', 'ضعيف', 'ضعيفه', 'ضعيف جدا', 'منكر', 'واه', 'واهي', 'شاذ', 'معلول', 'مرسل ضعيف']],
  [1, ['صحيح', 'صحيحه', 'اسناده صحيح', 'صحيح لغيره', 'صحيح الاسناد']],
  [2, ['حسن', 'حسنه', 'حسن لغيره', 'اسناده حسن', 'حسن صحيح']],
];
export function gradeOf(grading) {
  const words = norm(grading).replace(/[^\p{L} ]+/gu, ' ').split(' ').filter(Boolean); const text = ' ' + words.join(' ') + ' ';
  let best = null; // [position, level]
  for (const [lv, list] of GRADE_WORDS) for (const w of list) { const at = text.indexOf(' ' + w + ' '); if (at >= 0 && (!best || at < best[0] || (at === best[0] && w.split(' ').length > best[2]))) best = [at, lv, w.split(' ').length]; }
  return best ? best[1] : 0;
}
export function levelOf(h) {
  const suspended = /معلق/.test(norm(h.grading));
  if (tierOf({ grader: h.grader, source: h.source }).tier === 1 && !suspended) return 1;
  return gradeOf(h.grading);
}
// the same narration printed by other accepted graders: same text by shared words (at least 70% of the shorter one)
const sameNarration = (a, b) => { const x = new Set(wordsOf(a.text)), y = new Set(wordsOf(b.text)); const n = Math.min(x.size, y.size) || 1; return [...x].filter((w) => y.has(w)).length / n >= 0.7; };
const EXIT = { 1: 'x_sahih', 2: 'x_hasan', 4: 'x_daif', 5: 'x_mawdu' };
const batches = (arr, n) => { const out = []; for (let k = 0; k < arr.length; k += n) out.push(arr.slice(k, k + n)); return out; };
// which claims go on to a search: m1 yes/unsure, or m1 no + m2 "a hadith with the same meaning: yes"
const goesOn = (g) => { const m1 = answers(`m1-g${g}.json`), m2 = answers(`m2-g${g}.json`); return claimsOf(g).filter((x) => { const a = (m1[x.tag] || {}).answer; const b = m2[x.tag] || {}; return a === 'yes' || a === 'unsure' || (a === 'no' && b.has_hadith === 'yes'); }); };
// the final pick per claim: the retry round wins where it ran, then the safeguard
function finalPicks(g) {
  const p1 = answers(`pick1-g${g}.json`), p2 = answers(`pick2-g${g}.json`), sg = answers(`guard-g${g}.json`);
  const cands = candidates(g); const out = {};
  for (const x of claimsOf(g)) {
    const p = p2[x.tag] || p1[x.tag];
    const hits = cands[x.tag] || [];
    let h = p && p.pick > 0 && p.same_meaning !== 'no' ? hits[p.pick - 1] : null;
    let flag = null;
    if (h && sg[x.tag]) {
      const sound = hits.filter((y) => [1, 2].includes(levelOf(y)));
      const alt = sg[x.tag].pick > 0 ? sound[sg[x.tag].pick - 1] : null;
      // v4: switch only when the sound narration carries the speaker's words at least as well as the weak one (the grade
      // follows the wording said; a narration with the same MEANING but other words does not replace his)
      if (alt && alt.score >= h.score) { h = alt; flag = 'switched by the safeguard'; }
      else flag = alt ? 'weak/fabricated kept: a sound narration has the meaning but not his words: moderator' : 'weak/fabricated kept: moderator';
    }
    out[x.tag] = { hit: h, flag, same: p ? p.same_meaning : null, answered: !!p, others: h ? hits.filter((y) => y !== h && y.tier && sameNarration(y, h)) : [] };
  }
  return out;
}

if (cmd === 'm1') {
  const items = claimsOf(+a1); let b = 0;
  for (const part of batches(items, 15)) { b++; const out = fwd(R(`m1-g${a1}-b${b}.json`)); fs.writeFileSync(R(`prompt-m1-g${a1}-b${b}.txt`), M1(part, out)); }
  console.log('m1 prompts', a1, b);
} else if (cmd === 'merge') {
  // merge <stem> <g>: joins <stem>-g<g>-b*.json into <stem>-g<g>.json
  const re = new RegExp('^' + a1 + '-g' + a2 + '-b[0-9]+[.]json' + '$');
  const parts = fs.readdirSync(RUN).filter((f) => re.test(f));
  const claims = parts.flatMap((f) => readJ(R(f)).claims);
  fs.writeFileSync(R(`${a1}-g${a2}.json`), JSON.stringify({ claims }, null, 1));
  console.log('merged', a1, a2, parts.length, 'files', claims.length, 'claims');
} else if (cmd === 'm2') {
  const m1 = answers(`m1-g${a1}.json`);
  const items = claimsOf(+a1);
  const yes = items.filter((x) => ['yes', 'unsure'].includes((m1[x.tag] || {}).answer));
  const no = items.filter((x) => (m1[x.tag] || {}).answer === 'no');
  const missing = items.filter((x) => !m1[x.tag]);
  let b = 0;
  for (const part of batches([...yes.map((x) => ['y', x]), ...no.map((x) => ['n', x])], 8)) { b++; const out = fwd(R(`m2-g${a1}-b${b}.json`)); fs.writeFileSync(R(`prompt-m2-g${a1}-b${b}.txt`), M2(part.filter((p) => p[0] === 'y').map((p) => p[1]), part.filter((p) => p[0] === 'n').map((p) => p[1]), out)); }
  console.log('m2 prompts', a1, b, 'yes/unsure', yes.length, 'no', no.length, 'no m1 answer', missing.length);
} else if (cmd === 'search') {
  // search <step>: m2 (the first search) or retry
  for (const g of groups()) {
    const f = R(`${a1}-g${g}.json`); if (!has(f)) continue;
    const ok = a1 === 'm2' ? new Set(goesOn(g).map((x) => x.tag)) : null;
    const t0 = Date.now(); let n = 0;
    for (const a of readJ(f).claims) { if (ok && !ok.has(a.tag)) continue; for (const w of (a.pieces || []).slice(0, 3)) if (String(w).trim()) { search(a.tag, String(w).trim(), R(`ledger-g${g}.jsonl`)); n++; } }
    console.log(`${a1} group ${g}: ${n} searches, ${Math.round((Date.now() - t0) / 1000)} s`);
  }
} else if (cmd === 'pick') {
  // pick <round 1|2> <g>: round 1 = every claim that went on; round 2 = only the retried claims
  const round = a1, g = +a2; const cands = candidates(g);
  let items = goesOn(g);
  if (round === '2') { const r = answers(`retry-g${g}.json`); items = items.filter((x) => r[x.tag]); }
  items = items.map((x) => ({ ...x, hits: cands[x.tag] || [] }));
  let b = 0;
  for (const part of batches(items, 4)) { b++; const out = fwd(R(`pick${round}-g${g}-b${b}.json`)); fs.writeFileSync(R(`prompt-pick${round}-g${g}-b${b}.txt`), PICK(part, out)); }
  console.log(`pick${round} prompts`, g, b, 'claims', items.length);
} else if (cmd === 'retry') {
  // nothing usable: no candidate at all, or round-1 pick 0 / same_meaning no
  const g = +a1; const cands = candidates(g); const p1 = answers(`pick1-g${g}.json`); const m2 = answers(`m2-g${g}.json`);
  const items = goesOn(g).filter((x) => { const p = p1[x.tag]; return !(cands[x.tag] || []).length || !p || !(p.pick > 0) || p.same_meaning === 'no'; })
    .map((x) => ({ ...x, tried: (m2[x.tag] || {}).pieces || [] }));
  if (items.length) fs.writeFileSync(R(`prompt-retry-g${g}.txt`), RETRY(items, fwd(R(`retry-g${g}.json`))));
  console.log('retry', g, items.length, items.map((x) => x.tag).join(' '));
} else if (cmd === 'guard') {
  const g = +a1; const cands = candidates(g); const p1 = answers(`pick1-g${g}.json`), p2 = answers(`pick2-g${g}.json`);
  const items = [];
  for (const x of goesOn(g)) {
    const p = p2[x.tag] || p1[x.tag]; const hits = cands[x.tag] || [];
    const h = p && p.pick > 0 && p.same_meaning !== 'no' ? hits[p.pick - 1] : null;
    if (!h || ![4, 5].includes(levelOf(h))) continue;
    const sound = hits.filter((y) => [1, 2].includes(levelOf(y)));
    if (sound.length) items.push({ ...x, chosen: h, sound });
  }
  if (items.length) fs.writeFileSync(R(`prompt-guard-g${g}.txt`), GUARDQ(items, fwd(R(`guard-g${g}.json`))));
  console.log('guard', g, items.length, items.map((x) => x.tag).join(' '));
} else if (cmd === 'build') {
  const [name, outDir] = [a1, a2];
  for (const g of groups()) {
    const fin = finalPicks(g);
    const videos = readJ(path.join(IN, `group-${g}.json`)).videos.map((v) => ({ id: v.id, claims: v.claims.map((c) => {
      const { hit: h, flag: flag0, same, answered, others } = fin[`${v.id}#${c.i}`];
      // v4: a claim the model left out of its answer is PENDING (ask again), never "not found"
      if (!h && !answered && goesOn(g).some((x) => x.tag === `${v.id}#${c.i}`)) return { i: c.i, state: 'pending', level: 0, flow_kind: 'hadith', flag: 'no answer from the model: ask again', parts: [{ position: 1, exit_id: 'x_pending', state: 'pending', level: 0, said_text: c.quote, source: null }] };
      if (!h) return { i: c.i, state: 'not_found', level: 0, flow_kind: 'hadith', parts: [{ position: 1, exit_id: 'x_notfound', state: 'not_found', level: 0, said_text: c.quote, source: null }] };
      // v4: every accepted grader of the same narration is kept; when their levels differ the written rule applies (rank at
      // the weaker) and the part is flagged "graders differ" for the review page. Whether sahih against hasan counts as
      // "differ", and whether a grade on the chain alone counts, stay the owner's open questions: flagged, not decided here.
      const cards = [h, ...others]; const lv = cards.map(levelOf).filter((x) => x > 0);
      let level = levelOf(h); const flags = [flag0].filter(Boolean);
      if (new Set(lv).size > 1) { flags.push(`graders differ: ${cards.map((y) => `${y.grader} «${y.grading}»`).join(' · ')}`); level = Math.max(...lv); }
      // v4: the pick's own answer is carried: "partly" (the same hadith, he added or changed a detail) is not "matches"
      const state = same === 'partly' ? 'by_meaning' : 'matches';
      if (same === 'partly') flags.push('the pick said: the same hadith, but he added or changed a detail');
      return { i: c.i, state, level, flow_kind: 'hadith', flag: flags.join(' | ') || null, parts: [{ position: 1, exit_id: EXIT[level] || 'x_unknown', state, level, said_text: c.quote, source: { site: 'dorar', link: h.permalink, quote: h.text, collection: h.source, number: h.number, grader: h.grader, grading: h.grading, narrator: h.narrator, tier: h.tier, gradings: others.length ? others.map((y) => ({ grader: y.grader, grading: y.grading, link: y.permalink, collection: y.source, number: y.number })) : null } }] };
    }) }));
    fs.writeFileSync(path.join(outDir, `${name}-g${g}.json`), JSON.stringify({ model: name, videos }, null, 1));
    if (has(R(`ledger-g${g}.jsonl`))) fs.copyFileSync(R(`ledger-g${g}.jsonl`), path.join(outDir, `ledger-${name}-g${g}.jsonl`));
  }
  console.log('built', name);
} else if (cmd === 'gate') {
  // gate <keyFile> <grayTagsComma>: the gate's mistakes, by the reviewed record
  const key = readJ(a1); const gray = new Set((a2 || '').split(',').filter(Boolean));
  const rows = [];
  for (const g of groups()) {
    const m1 = answers(`m1-g${g}.json`), m2 = answers(`m2-g${g}.json`); const on = new Set(goesOn(g).map((x) => x.tag)); const fin = finalPicks(g);
    for (const x of claimsOf(g)) rows.push({ tag: x.tag, truth: key[x.tag] ? 'hadith' : gray.has(x.tag) ? 'gray' : 'none', m1: (m1[x.tag] || {}).answer || 'MISSING', meaning: (m2[x.tag] || {}).has_hadith || '-', on: on.has(x.tag), picked: !!fin[x.tag].hit, flag: fin[x.tag].flag });
  }
  const c = (f) => rows.filter(f).length;
  console.log('claims', rows.length);
  for (const t of ['hadith', 'gray', 'none']) console.log(`${t}: ${c((r) => r.truth === t)} | m1 yes ${c((r) => r.truth === t && r.m1 === 'yes')}, unsure ${c((r) => r.truth === t && r.m1 === 'unsure')}, no ${c((r) => r.truth === t && r.m1 === 'no')} | of the no: same-meaning hadith yes ${c((r) => r.truth === t && r.m1 === 'no' && r.meaning === 'yes')} | went on to a search ${c((r) => r.truth === t && r.on)} | ended with a dorar source ${c((r) => r.truth === t && r.picked)}`);
  console.log('hadith claims STOPPED by the gate:', rows.filter((r) => r.truth === 'hadith' && !r.on).map((r) => r.tag).join(' ') || '-');
  console.log('no-hadith claims that ended WITH a dorar source:', rows.filter((r) => r.truth === 'none' && r.picked).map((r) => r.tag).join(' ') || '-');
  console.log('safeguard:', rows.filter((r) => r.flag).map((r) => `${r.tag}: ${r.flag}`).join(' | ') || '-');
  fs.writeFileSync(R('gate.json'), JSON.stringify(rows, null, 1));
} else console.log('see the header');

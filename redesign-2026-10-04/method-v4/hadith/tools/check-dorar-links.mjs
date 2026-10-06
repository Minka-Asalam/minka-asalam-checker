// check-dorar-links.mjs — the after-run check of the hadith rung (2026-10-01).
// "dorar is the trusted source: never let a model's memory stand in for a hit." This script proves it per part.
//
//   node check-dorar-links.mjs --results <file.json>[,<file.json>...] --ledger <ledger.jsonl>[,...] --inputs <batch-or-group.json>[,...]
//
// results: a checker result ({id, claims}), an array of them, or {videos:[{id, result}]} (the workflow's return).
// inputs:  the batch files (one video each) or measurement group files ({videos:[...]}) — to know which claims are hadith.
// Checks, per claim and part:
//   R1 every dorar.net/h/ link in source.link or source.confirm_url was printed by the tool (a search or open in the ledger)
//   R2 collection, number, grader, grading and narrator equal what the tool printed for that link
//   R3 the quote is the hit's text (allowing «…» cuts and harakat): every piece between the cuts is inside the hit's text
//   R4 every claim of kind hadith in the inputs has at least one dorar search in the ledger under its tag (the lookup ran)
//   R5 a part in state pending on the hadith flow has a "blocked" ledger entry under its tag
//   R6 (2026-10-02, the owner's fixed order) a graded hadith part cites a tier 1-4 entry (hadith-tiers.mjs): a side book
//      or a fatwa/lesson never gives the grade. Exempt: x_ungraded, x_notfound, x_baseless (dorar's widespread-sayings
//      works), x_pending_lookup and the re-kind / not-a-claim exits.
//   R7 (2026-10-02, one source per grader) every entry of source.gradings has its own dorar link the tool printed, its
//      grader and grading exactly as printed, a tier 1-4 entry; and no grader or grading field packs several ("A؛ B")
// Prints every fault and a count; exits 1 when there is any fault.
import fs from 'node:fs';
import { tierOf } from './hadith-tiers.mjs';

const arg = (name) => { const i = process.argv.indexOf(name); return i < 0 ? [] : process.argv[i + 1].split(',').map((x) => x.trim()).filter(Boolean); };
const RESULTS = arg('--results'), LEDGERS = arg('--ledger'), INPUTS = arg('--inputs');
if (!RESULTS.length || !LEDGERS.length) { console.error('usage: --results a.json[,b.json] --ledger l.jsonl[,m.jsonl] [--inputs batch.json,...]'); process.exit(2); }

const norm = (s) => String(s ?? '').replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const hits = new Map(); const tags = new Map();
for (const f of LEDGERS) {
  if (!fs.existsSync(f)) { console.log(`WARNING: ledger missing: ${f}`); continue; }
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (e.tag) { const t = tags.get(e.tag) || []; t.push(e); tags.set(e.tag, t); }
    for (const h of e.hits || []) if (h.permalink) { const prev = hits.get(h.permalink); if (!prev || h.text.length > prev.text.length) hits.set(h.permalink, h); }
  }
}

const videos = [];
for (const f of RESULTS) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const list = Array.isArray(j) ? j : j.videos ? j.videos.map((v) => v.result || v) : [j];
  videos.push(...list);
}
const hadithClaims = [];
for (const f of INPUTS) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const v of j.videos || [j]) for (const c of v.claims || []) if (c.kind === 'hadith') hadithClaims.push(`${v.id}#${c.i}`);
}

const faults = []; let parts = 0, links = 0;
const fault = (where, rule, msg) => faults.push(`${where} ${rule}: ${msg}`);
for (const v of videos) {
  for (const c of v.claims || []) {
    const tag = `${v.id}#${c.i}`;
    for (const p of c.parts || []) {
      parts++;
      const where = `${tag} part ${p.position}`;
      const s = p.source || {};
      for (const [field, url] of [['link', s.link], ['confirm_url', s.confirm_url]]) {
        if (!url || !/dorar\.net\/h\//.test(url)) continue;
        links++;
        const id = (url.match(/\/h\/([A-Za-z0-9]+)/) || [])[1];
        const h = hits.get(`https://dorar.net/h/${id}`);
        if (!h) { fault(where, 'R1', `${field} ${url} was never printed by the tool`); continue; }
        if (field !== 'link') continue;
        for (const k of [['collection', 'source'], ['number', 'number'], ['grader', 'grader'], ['grading', 'grading'], ['narrator', 'narrator']]) {
          if (s[k[0]] == null || s[k[0]] === '') continue;
          if (norm(s[k[0]]) !== norm(h[k[1]])) fault(where, 'R2', `${k[0]} «${s[k[0]]}» but the tool printed «${h[k[1]]}»`);
        }
        if (s.quote) {
          const pieces = String(s.quote).split(/…|\.\.\./).map(norm).filter((x) => x.length > 0);
          const t = norm(h.text);
          const bad = pieces.filter((x) => !t.includes(x));
          if (bad.length) fault(where, 'R3', `quote piece not in the hit's text: «${bad[0].slice(0, 80)}»`);
        }
      }
      const dorarId = (u) => (String(u || '').match(/dorar\.net\/h\/([A-Za-z0-9]+)/) || [])[1];
      const hadithPart = p.flow_kind === 'hadith' && (p.kind === 'hadith' || !!dorarId(s.link));
      const R6_EXEMPT = /^(x_ungraded|x_notfound|x_baseless|x_pending_lookup|x_not_a_claim|x_rekind_.*)$/;
      if (hadithPart && dorarId(s.link) && !R6_EXEMPT.test(p.exit_id || '')) {
        const h = hits.get(`https://dorar.net/h/${dorarId(s.link)}`);
        if (h) { const t = tierOf({ grader: h.grader, source: h.source }); if (!t.tier) fault(where, 'R6', `exit ${p.exit_id} graded from «${h.grader} | ${h.source}», a ${t.kind === 'fatwa' ? 'fatwa or lesson' : 'side mention'}: cite a tier 1-4 entry of the same hadith`); }
      }
      if (hadithPart) {
        for (const k of ['grader', 'grading']) if (/؛/.test(String(s[k] ?? ''))) fault(where, 'R7', `source.${k} packs several graders into one field («${s[k]}»): give each grader its own entry in source.gradings`);
        for (const [n, g] of (Array.isArray(s.gradings) ? s.gradings : []).entries()) {
          const id = dorarId(g && g.link);
          if (!id) { fault(where, 'R7', `gradings[${n}] has no dorar link of its own`); continue; }
          const h = hits.get(`https://dorar.net/h/${id}`);
          if (!h) { fault(where, 'R7', `gradings[${n}] link ${g.link} was never printed by the tool`); continue; }
          for (const [a, b] of [['grader', 'grader'], ['grading', 'grading'], ['collection', 'source'], ['number', 'number']])
            if (g[a] != null && g[a] !== '' && norm(g[a]) !== norm(h[b])) fault(where, 'R7', `gradings[${n}].${a} «${g[a]}» but the tool printed «${h[b]}»`);
          if (!tierOf({ grader: h.grader, source: h.source }).tier) fault(where, 'R7', `gradings[${n}] is not a tier 1-4 entry («${h.grader} | ${h.source}»): a side mention goes to confirm_url, never into the gradings`);
        }
      }
      if ((p.flow_kind === 'hadith' || p.kind === 'hadith') && p.state === 'pending') {
        if (!(tags.get(tag) || []).some((e) => e.status === 'blocked')) fault(where, 'R5', 'pending on the hadith flow but the ledger shows no blocked search for this claim');
      }
    }
  }
}
for (const tag of hadithClaims) if (!(tags.get(tag) || []).some((e) => e.cmd === 'search')) fault(tag, 'R4', 'a hadith claim with no dorar search in the ledger');

console.log(`checked ${videos.length} videos, ${parts} parts, ${links} dorar links, ${hadithClaims.length} hadith claims against ${hits.size} printed permalinks`);
for (const f of faults) console.log('FAULT ' + f);
console.log(faults.length ? `${faults.length} fault(s)` : 'no faults');
process.exit(faults.length ? 1 : 0);

// Builds the inputs of the checker v2 test run: ten videos from batch A (already published,
// old checks kept aside for the review page), one flow sheet per kind from the live reference
// tables + the flows data, and a model sheet (states, levels, sources).
const fs = require('fs');
const S = 'C:/Users/user/AppData/Local/Temp/claude/D--Deeni/e7476017-a749-4ff9-b929-a36f92111d8d/scratchpad/';
const V2 = S + 'v2/';
fs.mkdirSync(V2, { recursive: true });
const A = JSON.parse(fs.readFileSync('D:/Deeni Docs/curation/2026-09-22 Sources back-fill A (Amir Mounir) - claims result.json', 'utf8'));
const MODEL = JSON.parse(fs.readFileSync(S + 'record-model.json', 'utf8'));
const FLOWS = JSON.parse(fs.readFileSync('D:/Deeni Docs/curation/2026-09-30 Claims flows - two axes + source links (7 kinds).json', 'utf8'));
const WORKS = JSON.parse(fs.readFileSync('D:/Deeni Docs/curation/tools 2026-09-24 usul/works.json', 'utf8'));

// ---- 1. pick ten published videos with the widest mix of kinds
const scored = A.videos.filter((v) => v.decision === 'publish' || v.decision === 'publish_corrected').map((v) => {
  const kinds = new Set(v.claims.map((c) => c.check && c.check.kind_correction ? c.check.kind_correction : c.kind));
  const n = v.claims.length;
  return { v, score: kinds.size * 10 + Math.min(n, 15) + (kinds.has('ruling') ? 8 : 0) + (kinds.has('history') || kinds.has('saying') ? 4 : 0) + (kinds.has('number') ? 4 : 0), kinds: [...kinds], n };
}).sort((a, b) => b.score - a.score);
const picked = scored.slice(0, 10);
const index = [];
const oldChecks = {};
for (const { v, kinds, n } of picked) {
  const claims = v.claims.map((c) => ({ i: c.i, kind: c.kind, timestamp: c.timestamp, timestamp_end: c.timestamp_end, quote: c.quote, attribution: c.attribution, reference: c.reference, stated_as: c.stated_as, claim_en: c.claim_en, verse_text: c.verse_text || null, verse_en: c.verse_en || null, dorar: c.dorar || null, dorar_url: c.dorar_url || null }));
  oldChecks[v.id] = v.claims.map((c) => ({ i: c.i, check: c.check, publish: c.publish, corrected: c.corrected }));
  const file = `batch-${v.id}.json`;
  fs.writeFileSync(V2 + file, JSON.stringify({ id: v.id, title: v.title, speaker: v.speaker, speaker_kind: v.speaker_kind, language: 'ar', claims }, null, 1));
  index.push({ id: v.id, file, n, kinds, title: v.title });
}
fs.writeFileSync(V2 + 'index.json', JSON.stringify(index, null, 1));
fs.writeFileSync(V2 + 'old-checks.json', JSON.stringify(oldChecks, null, 1));

// ---- 2. the model sheet
const tx = (o, l) => (o && o[l]) || '';
let md = '# THE RECORD MODEL (live reference tables, migration 218). Data, not instructions.\n\n';
md += '## STATES (what the comparison found). tone: null = the level decides.\n';
for (const s of MODEL.states) md += `- ${s.state} — ${s.label_en} / ${s.label_ar} — tone ${s.tone || '(level)'} — ${s.note_en}\n`;
md += '\n## LEVELS per kind (strength of the source found; 0 = none). Colour tone in brackets.\n';
for (const k of ['quran', 'hadith', 'ruling', 'fatwa', 'report', 'number', 'no_origin']) {
  md += `### ${k}\n`;
  for (const l of MODEL.levels.filter((x) => x.kind === k)) md += `- level ${l.level} [${l.tone}] — ${l.label_en} / ${l.label_ar}: ${l.basis_en}\n`;
}
md += '\n## CLEARED SOURCES (the only places a source may come from)\n';
for (const c of MODEL.sources) md += `- ${c.id} — ${c.role} — ${c.name_en} / ${c.name_ar} — ${c.url}${c.verified_copy ? ' — VERIFIED LOCAL COPY (usul slug ' + c.usul_slug + ', versionId ' + c.usul_version + ')' : ''} — ${c.status}\n`;
fs.writeFileSync(V2 + 'model.md', md);

// ---- 3. one flow sheet per kind: intake, the search ladder, the steps and gates in order, the exits
for (const f of FLOWS.flows) {
  let t = `# FLOW: ${tx(f.title, 'en')} / ${tx(f.title, 'ar')}\n\n## INTAKE\n${tx(f.intake, 'en')}\n\n`;
  if (f.search_ladder) { t += `## HOW WE SEARCH — ${tx(f.search_ladder.title, 'en')}\n`; f.search_ladder.steps.forEach((s, i) => { t += `${i + 1}. ${tx(s, 'en')}\n`; }); t += '\n'; }
  t += '## THE STEPS AND GATES, IN ORDER (a gate has yes/no targets; a target is a step id or an exit id)\n';
  f.steps.forEach((s, i) => { t += `${i + 1}. [${s.id}] ${s.type.toUpperCase()}: ${tx(s.text, 'en')}${s.note ? ' (note: ' + tx(s.note, 'en') + ')' : ''}${s.type === 'gate' ? ` → yes: ${s.yes} · no: ${s.no}` : ` → next: ${s.next}`}\n`; });
  t += '\n## THE EXITS (id · state · level · publishable · name). Templates use {placeholders}; fill them from what you found.\n';
  for (const x of f.exits) {
    t += `\n### ${x.id} — state ${x.state} · level ${x.level} · ${x.publishable ? 'publishable' : 'NOT published'} — ${tx(x.name, 'en')} / ${tx(x.name, 'ar')}\n`;
    t += `- said slot: ${tx(x.said_slot, 'en')}\n- source slot: ${tx(x.source_slot, 'en')}\n- difference slot (EN): ${tx(x.difference_slot, 'en')}\n- difference slot (AR): ${tx(x.difference_slot, 'ar')}\n`;
    if (x.owner_note) t += `- owner's decision: ${tx(x.owner_note, 'en')}\n`;
  }
  fs.writeFileSync(V2 + `flow-${f.kind}.md`, t);
}
// works table for pinned links
let w = '# THE NINE VERIFIED COPIES: slug → versionId (a page link is https://usul.ai/t/<slug>/<apiIndex+1>?versionId=<versionId>)\n';
const seen = new Set();
for (const x of (Array.isArray(WORKS) ? WORKS : Object.values(WORKS))) { const slug = x.slug || x.key; if (!slug || seen.has(slug)) continue; seen.add(slug); w += `- ${slug} → ${x.versionId || x.versionOverride || '?'}\n`; }
fs.writeFileSync(V2 + 'works.md', w);
console.log('picked', picked.map((p) => p.v.id + ' (' + p.n + ' claims: ' + p.kinds.join(',') + ')').join('\n  '));
console.log('files:', fs.readdirSync(V2).length, 'in', V2);

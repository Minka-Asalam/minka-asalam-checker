// Assembles the checker v2 test results (from the workflow journal) with the old checks into the review page.
const fs = require('fs');
const S = 'D:/checker-runs/2026-10-05-clips/';
const V2 = S + 'run/';
const J = process.argv[2];
const lines = fs.readFileSync(J, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const started = lines.filter((l) => l.type === 'started' || l.type === 'launched');
const labelOf = (key) => { const s = started.find((x) => x.key === key); const m = JSON.stringify(s || {}).match(/"label":"([^"]+)"/); return m ? m[1] : '?'; };
const results = lines.filter((l) => l.type === 'result').map((r) => ({ label: labelOf(r.key), result: r.result }));
console.log('results:', results.map((r) => r.label).join(', '));
const index = JSON.parse(fs.readFileSync(V2 + 'index.json', 'utf8'));
const old = {};
const model = JSON.parse(fs.readFileSync(S + 'record-model.json', 'utf8'));
const exits = new Map(model.exits.map((e) => [e.kind + '__' + e.exit_id, e]));
const corrections = fs.existsSync(V2 + 'corrections.json') ? JSON.parse(fs.readFileSync(V2 + 'corrections.json', 'utf8')).items : [];
let nCorr = 0;
function applyCorrections(vid, i, n) {
  for (const c of corrections.filter((x) => x.video === vid && x.i === i)) {
    if (!n) continue; nCorr++;
    if (c.claim) Object.assign(n, c.claim);
    if (c.parts_replace) n.parts = c.parts_replace.map((p) => ({ ...p }));
    for (const pc of c.parts || []) { const p = n.parts.find((x) => x.position === pc.position); if (!p) continue; const { search_log_add, ...rest } = pc; Object.assign(p, rest); if (search_log_add) p.search_log = [...(p.search_log || []), ...search_log_add]; }
    n.corrected_by = c.by;
  }
}
const NINE = JSON.stringify(JSON.parse(fs.readFileSync(S + 'tools/works.json', 'utf8'))); let nOutside = 0;
const videos = []; const issues = []; const tally = {}; let nParts = 0, nClaims = 0, nMissing = 0, nBadExit = 0, nBook = 0, nBookNoQuote = 0;
for (const v of index) {
  const batch = JSON.parse(fs.readFileSync(V2 + v.file, 'utf8'));
  const ver = (results.find((r) => r.label === 'verify:' + v.id) || {}).result;
  const chk = (results.find((r) => r.label === 'check:' + v.id) || {}).result;
  const res = (ver && ver.claims && ver.claims.length ? ver : chk);
  if (!res) { issues.push(v.id + ': NO RESULT'); continue; }
  const byI = new Map(res.claims.map((c) => [c.i, c]));
  const oldByI = new Map((old[v.id] || []).map((o) => [o.i, o]));
  const claims = batch.claims.map((c) => {
    const n = byI.get(c.i) || null; const o = oldByI.get(c.i); nClaims++;
    applyCorrections(v.id, c.i, n);
    if (!n) nMissing++;
    if (n) {
      tally[n.state] = (tally[n.state] || 0) + 1;
      for (const p of n.parts) {
        nParts++;
        if (p.source && p.source.site && String(p.source.site).startsWith('usul:')) p.source.site = 'usul.ai';
        if (p.source && !p.source.site && (p.source.link || p.source.page_url)) { const L = p.source.link || p.source.page_url; p.source.site = /usul.ai/.test(L) ? 'usul.ai' : /dorar.net/.test(L) ? 'dorar.net' : /quran.com/.test(L) ? 'quran.com' : p.source.site; }
        const ex = exits.get(p.flow_kind + '__' + p.exit_id);
        if (!ex) { nBadExit++; issues.push(`${v.id} #${c.i}: unknown exit ${p.flow_kind}/${p.exit_id}`); }
        else if (ex.state !== p.state || ex.level !== p.level) { issues.push(`${v.id} #${c.i}: exit ${p.exit_id} says ${ex.state}/${ex.level}, part says ${p.state}/${p.level}`); }
        { const u = (p.source && (p.source.page_url || p.source.link)) || ''; const m = u.match(new RegExp("usul\.ai/t/([^/?]+)")); if (m && !NINE.includes(m[1])) { p.outside_nine = p.source.work_ar || m[1]; nOutside++; } }
        if (p.source && p.source.page_url) { nBook++; if (!p.source.quote) { nBookNoQuote++; issues.push(`${v.id} #${c.i}: page without a quote`); } }
      }
    }
    const oc = o && o.check ? o.check : null;
    return { i: c.i, kind: c.kind, timestamp: c.timestamp, timestamp_end: c.timestamp_end || null, quote: c.quote, old: oc ? { text_ar: oc.text_ar, text_en: oc.text_en, verdict: oc.verdict, standing: oc.standing, grading: oc.source && oc.source.grading, url: oc.source && oc.source.url, corrected: o.corrected, published: o.publish } : null, new: n };
  });
  videos.push({ id: v.id, title: batch.title, speaker: batch.speaker, claims });
}
const data = { builtOn: '2026-10-05', videos, levels: model.levels.map((l) => ({ kind: l.kind, level: l.level, tone: l.tone })), note: { ar: 'مقاطع المكتبة (٥ أكتوبر): ٢٥ مقطعًا سمعها Gemini من نسخة التطبيق نفسها، وفحصها المدقّق المجرَّب في ٢ أكتوبر (مدقّق ومراجع لكل مقطع)، والحديث من الدرر على جهاز المالك. اجتاز الفحصين قبل النشر. لم يُكتب شيء في قاعدة البيانات؛ ما تعتمده هنا يُكتب محبوسًا ثم يُنشر بالقاعدة.', en: 'The library clips (5 Oct): 25 clips listened by Gemini from the app’s own copy, checked by the 2 Oct checker (a checker and a sceptic per clip), hadith looked up on dorar from the owner’s PC. Both pre-publish checks passed. Nothing was written to the database; what you accept here is written held, then published under the guard.' } };
fs.writeFileSync(V2 + 'results.json', JSON.stringify({ data, issues, tally, counts: { claims: nClaims, parts: nParts, missing: nMissing, badExit: nBadExit, bookCitations: nBook, bookNoQuote: nBookNoQuote } }, null, 1));
const t = fs.readFileSync(S + 'review.template.html', 'utf8');
const h = t.replace('__DATA__', JSON.stringify(data).replace(/<\/script/gi, '<\\/script'));
fs.writeFileSync(S + 'review.html', h);
fs.writeFileSync(S + '_check_v2.js', h.match(/<script>([\s\S]*)<\/script>/)[1]);
console.log('claims', nClaims, '| with a new result', nClaims - nMissing, '| parts', nParts, '| book citations', nBook, '(no quote:', nBookNoQuote + ')', '| bad exits', nBadExit);
console.log('states:', JSON.stringify(tally));
console.log('corrections applied:', nCorr, 'of', corrections.length);
console.log('books outside the nine, flagged:', nOutside);
console.log('issues:', issues.length); issues.slice(0, 15).forEach((s) => console.log('  ', s));
console.log('page bytes', h.length);

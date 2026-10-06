// test-verses.mjs — seeded misquotes for verses2's in-order comparison (the review panel: v1 passed all of these as "matches")
import { compare } from '../verses/verses2.mjs';
const T = JSON.parse((await import('node:fs')).readFileSync('D:/Deeni Docs/Claims_Redesign_2026-10/test-2videos/verses/claims.json', 'utf8'));
const v736 = T.find((c) => c.tag === 'pkH5vlUGc5U#6').verse_text;
const v2563 = T.find((c) => c.tag === 'pkH5vlUGc5U#10').verse_text;
const cases = [
  ['the real quote, 73:6', 'إن ناشئة الليل هي أشد وطئا وأقوم قيلا', v736, 'matches'],
  ['a middle word dropped', 'إن ناشئة الليل هي أشد وأقوم قيلا', v736, 'differs'],
  ['the order changed', 'إن ناشئة الليل هي وأقوم قيلا أشد وطئا', v736, 'differs'],
  ['a word added', 'إن ناشئة الليل هي أشد وطئا وأقوم قيلا كثيرا', v736, 'differs'],
  ['qala for qul (one letter)', 'قال هو الله أحد', 'قُلْ هُوَ اللَّهُ أَحَدٌ', 'one letter off'],
  ['the negation dropped at the start', 'تأخذه سنة ولا نوم', 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ', 'differs'],
  ['a partial verse, nothing dropped', 'لا تأخذه سنة ولا نوم', 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ', 'matches'],
  ['Mushaf spelling (dagger alif)', 'وعباد الرحمن الذين يمشون على الأرض هونا', v2563, 'matches'],
  ['two stretches joined by …', 'وعباد الرحمن الذين يمشون على الأرض هونا … والذين يبيتون لربهم سجدا وقياما', v2563, 'matches'],
];
let bad = 0;
for (const [name, q, v, want] of cases) { const r = compare(q, v); const ok = r.state.startsWith(want); if (!ok) bad++; console.log(ok ? 'ok  ' : 'FAIL', name, '→', r.state, JSON.stringify({ extra: r.extra, skipped: r.skipped, order: r.outOfOrder, near: r.near })); }
console.log(bad ? `${bad} FAILED of ${cases.length}` : `all ${cases.length} passed`);

// test-state.mjs — the fairness table: the cases the panel raised
import { stateOf, inText } from '../rulings/ladder4.mjs';
const cases = [
  ['repentance enough for missed prayers, he called it one view; the page rejects it', 'opposite', 'one_view', 'matches'],
  ['the same, but he said all scholars', 'one_view', 'agreement', 'overstated'],
  ['our page covers only gold, he spoke of money', 'narrower', 'rule', 'matches'],
  ['he stated a ruling, the page states the contrary as agreed', 'opposite', 'rule', 'corrected'],
  ['he gave the majority view as the rule', 'one_view', 'rule', 'matches'],
  ['nothing states it', 'no', 'rule', 'not_found'],
];
let bad = 0; for (const [name, v, st, want] of cases) { const r = stateOf(v, st); const ok = r.state === want; if (!ok) bad++; console.log(ok ? 'ok  ' : 'FAIL', name, '→', r.state, r.standing || '', r.flag ? '| ' + r.flag : ''); }
const t = 'الحمد لله، فالذي عليه عامة العلماء أن نصاب الذهب عشرون مثقالا وهي خمسة وثمانون جراما تقريبا. والله أعلم';
for (const [s, want] of [['أن نصاب الذهب عشرون مثقالا وهي خمسة وثمانون جراما', true], ['نصاب الفضة مائتا درهم', false], ['', false]]) { const ok = inText(s, t) === want; if (!ok) bad++; console.log(ok ? 'ok  ' : 'FAIL', 'evidence check', JSON.stringify(s.slice(0, 30)), '→', inText(s, t)); }
console.log(bad ? `${bad} FAILED` : 'all passed');

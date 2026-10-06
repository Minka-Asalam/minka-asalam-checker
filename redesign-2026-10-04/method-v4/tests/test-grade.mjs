// test-grade.mjs — seeded cases for chain6's grade reading (each from a real dorar wording pattern)
import { gradeOf, levelOf } from '../hadith/chain6.mjs';
const cases = [
  ['صحيح', 1], ['حسن', 2], ['ضعيف', 4], ['موضوع', 5], ['ضعيف جداً', 4],
  ['صحيح، وهذا إسناد ضعيف', 1],            // the verdict on the hadith leads; the chain remark follows
  ['إسناده ضعيف', 4], ['إسناده صحيح على شرط الشيخين', 1], ['حسن لغيره', 2], ['صحيح لغيره', 1],
  ['ليس بصحيح', 4], ['لا يصح', 4], ['رواه البخاري', 0],   // «رواه» must not read as «واه»
  ['حسن صحيح', 2], ['منكر', 4], ['لا أصل له', 5], ['[فيه] شعبة مولى ابن عَبَّاس ليس بالقوي', 0],
];
let bad = 0; for (const [g, want] of cases) { const got = gradeOf(g); if (got !== want) { bad++; console.log('FAIL', g, 'got', got, 'want', want); } }
const mu = levelOf({ grader: 'البخاري', source: 'صحيح البخاري', grading: '[معلق]' }); if (mu === 1) { bad++; console.log('FAIL suspended Bukhari read as level 1'); }
const bk = levelOf({ grader: 'البخاري', source: 'صحيح البخاري', grading: '[صحيح]' }); if (bk !== 1) { bad++; console.log('FAIL Bukhari not level 1'); }
console.log(bad ? `${bad} FAILED of ${cases.length + 2}` : `all ${cases.length + 2} passed`);

// test-poetry.mjs — the poetry kind on known lines (live calls to aldiwan.net's search; a few seconds each)
import { checkPoetry, eraRank } from '../poetry/poetry.mjs';
const cases = [
  { name: 'the al-Dosari clip (one word changed)', q: 'وإذا خلوت بريبة في ظلمة والنفس داعية إلى العصيان فاستحي من نظر الإله وقل لها إن الذي خلق الظلام يراني', want: { level: 1, state: 'differs', poet: 'القحطاني' } },
  { name: 'al-Mutanabbi, exact', q: 'الخيل والليل والبيداء تعرفني والسيف والرمح والقرطاس والقلم', want: { level: 1, state: 'matches', poet: 'المتنبي' } },
  { name: 'al-Shafi\'i, exact', q: 'دع الأيام تفعل ما تشاء وطب نفسا إذا حكم القضاء', want: { level: 1, state: 'matches', poet: 'الشافعي' } },
  { name: 'Abu al-Atahiya, the common variant (aldiwan has «فيا ليت … بما صنع»)', q: 'ألا ليت الشباب يعود يوما فأخبره بما فعل المشيب', want: { level: 1, state: 'differs', poet: 'العتاهية' } },
  { name: 'al-Mutanabbi, a word changed', q: 'الخيل والليل والصحراء تعرفني والسيف والرمح والقرطاس والقلم', want: { level: 1, state: 'differs', poet: 'المتنبي' } },
  { name: 'al-Mutanabbi named as Shawqi (a note, not a correction)', q: 'الخيل والليل والبيداء تعرفني والسيف والرمح والقرطاس والقلم', named: 'أحمد شوقي', want: { level: 1, state: 'matches', note: 'he named' } },
  { name: 'a prose saying, not a poem', q: 'ومن وجد الله فماذا فقد ومن فقد الله فماذا وجد', want: { notLevel: 1 } },
];
let bad = 0;
for (const c of cases) {
  const r = checkPoetry(c.q, c.named || ''); const w = c.want; const fails = [];
  if (w.level !== undefined && r.level !== w.level) fails.push(`level ${r.level}`);
  if (w.notLevel !== undefined && r.level === w.notLevel) fails.push(`level ${r.level}`);
  if (w.state && r.state !== w.state) fails.push(`state ${r.state}`);
  if (w.poet && !(r.oldest && r.oldest.poet.includes(w.poet))) fails.push(`poet ${r.oldest && r.oldest.poet}`);
  if (w.note && !(r.notes || []).some((n) => n.includes(w.note))) fails.push('no note');
  if (fails.length) bad++;
  console.log(fails.length ? 'FAIL' : 'ok  ', c.name, '→ level', r.level, r.state, r.oldest ? `| ${r.oldest.poet} · ${r.oldest.era} · ${r.oldest.poem.slice(0, 40)}` : '', (r.notes || []).length ? '| ' + r.notes.join(' / ') : '', fails.length ? '| ' + fails.join(', ') : '');
}
const order = ['العصر الجاهلي', 'العصر الأموي', 'العصر العباسي', 'العصر الحديث'].map(eraRank); if (!order.every((x, i) => i === 0 || x > order[i - 1])) { bad++; console.log('FAIL era order', order); }
console.log(bad ? `${bad} FAILED` : 'all passed');

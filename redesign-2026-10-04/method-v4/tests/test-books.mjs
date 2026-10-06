// test-books.mjs — the unreviewed-book rule against the live list (refreshes the snapshot first)
import { refresh, bookStatus } from '../books/bookStatus.mjs';
const snap = refresh();
const cases = [
  ['a verified copy (al-Mughni)', 'https://usul.ai/t/al-mughni-sharh-mukhtasar-al-khiraqi/140?versionId=5HK0y3GSR2', 'cleared'],
  ['confirmed 5 Oct (Riyad al-Salihin)', 'https://usul.ai/t/riyad-salihin/3?versionId=iIOeGbEJmk', 'cleared'],
  ['confirmed 5 Oct (Hilyat al-Awliya)', 'https://usul.ai/t/hilyat-awliya/82?versionId=PmkKxjex9a', 'cleared'],
  ['confirmed 5 Oct (the Risala)', 'https://usul.ai/t/a-treatise-on-predestination-and-fate/15?versionId=9Oh-dWgoTC', 'cleared'],
  ['not confirmed (al-Hikam al-Ata\'iyya)', 'https://usul.ai/t/al-hikam-al-ataiyya/9?versionId=I0rAzTA3UZ', 'not_reviewed'],
  ['a hadith on dorar is not a book', 'https://dorar.net/h/olzwIslF', 'n/a'],
  ['a fatwa body is not a book', 'https://www.islamweb.net/ar/fatwa/422932/', 'n/a'],
];
let bad = 0; for (const [name, link, want] of cases) { const got = bookStatus(link, snap); if (got !== want) bad++; console.log(got === want ? 'ok  ' : 'FAIL', name, '→', got); }
console.log(`cleared books on the live list: ${snap.cleared.length}`); console.log(bad ? `${bad} FAILED` : 'all passed');

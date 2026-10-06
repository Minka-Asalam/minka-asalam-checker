// hadith-tiers.mjs — WHICH dorar entry may be the source of a hadith claim (the owner's fixed order, agreed 2 Oct 2026).
//
// dorar lists one hadith many times, once per book or scholar that mentions it. The cited entry must come, in this
// order, from:
//   tier 1  Sahih al-Bukhari or Sahih Muslim
//   tier 2  al-Albani's grading books: Sahih/Da'if al-Jami', Sahih/Da'if al-Targhib, Sahih/Da'if of the Sunan
//           (Abi Dawud, al-Tirmidhi, al-Nasa'i, Ibn Majah), al-Silsila al-Sahiha / al-Da'ifa, Irwa' al-Ghalil, Ghayat al-Maram
//   tier 3  Shu'ayb al-Arna'ut's gradings: the Musnad, the Sunan, Ibn Hibban
//   tier 4  Ibn Hajar's grading works
// A side book that only mentions the hadith with a passing remark on one chain or narrator (al-Matjar al-Rabih,
// Dhakhirat al-Huffaz, Majma' al-Zawa'id, Fath al-Bari, Lisan al-Mizan, Mizan al-I'tidal, al-Jami' al-Saghir,
// al-Tarikh al-Kabir…) and a scholar's fatwa or lesson NEVER give the grade; they may be shown as extra mentions.
// The same hadith from another entry in tiers 1–4 counts as found (e.g. Bukhari 554 for Bukhari 7434).
//
// The lists below are the line's own names, read against the book names dorar prints. Where the line names a scholar's
// works without listing them (tier 4), the list is ours and is printed in the package README for the owner to confirm.
// Anything not on a list is NOT a tier: the tools print it as a side mention, never as the grade.
//
//   import { tierOf, TIER_NAMES } from './hadith-tiers.mjs'
//   tierOf({ grader, source })  ->  { tier: 1|2|3|4|null, kind: 'tier'|'side'|'fatwa', label }
//   node hadith-tiers.mjs "<grader>" "<source>"     (prints the verdict, for a quick look)

const norm = (s) => String(s ?? '')
  .replace(/[ً-ْٰـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();

const any = (n, list) => list.some((x) => n.includes(norm(x)));
const SUNAN = ['ابي داود', 'الترمذي', 'النسائي', 'ابن ماجه'];

// tier 2: al-Albani, only in the books the line names
const ALBANI_BOOKS = [
  'صحيح الجامع', 'ضعيف الجامع', 'صحيح الترغيب', 'ضعيف الترغيب',
  ...SUNAN.flatMap((s) => [`صحيح ${s}`, `ضعيف ${s}`]),
  'السلسله الصحيحه', 'السلسله الضعيفه', 'ارواء الغليل', 'غايه المرام',
];
// tier 3: Shu'ayb al-Arna'ut's takhrij of the Musnad, the Sunan and Ibn Hibban
const ARNAUT_BOOKS = ['تخريج المسند', 'تخريج صحيح ابن حبان', 'تخريج سنن']; // every Sunan he edited (Abi Dawud, Ibn Majah, al-Daraqutni…)
// tier 4: Ibn Hajar's grading works (OUR reading of "his grading works"; Fath al-Bari and Lisan al-Mizan are named side books)
const IBN_HAJAR_BOOKS = ['التلخيص الحبير', 'هدايه الرواه', 'الامالي المطلقه', 'نتائج الافكار', 'موافقه الخبر الخبر', 'بلوغ المرام', 'الدرايه في تخريج'];
// a fatwa or a lesson: never the grade
const FATWA = ['فتاوي', 'فتوي', 'نور علي الدرب', 'حديث المساء', 'الشروح', 'دروس', 'الدرر السنيه', 'لقاء الباب المفتوح', 'اللقاء الشهري'];

export const TIER_NAMES = {
  1: 'tier 1: Sahih al-Bukhari or Sahih Muslim',
  2: "tier 2: al-Albani's grading books",
  3: "tier 3: Shu'ayb al-Arna'ut's gradings",
  4: "tier 4: Ibn Hajar's grading works",
  side: 'side mention: NEVER the grade (may be shown as an extra mention)',
  fatwa: "a scholar's fatwa or lesson: NEVER the grade (may be shown as an extra mention)",
};

export function tierOf({ grader, source } = {}) {
  const g = norm(grader), s = norm(source);
  const out = (tier, kind) => ({ tier, kind, label: TIER_NAMES[tier ?? kind] });
  if (/^صحيح البخاري$|^صحيح مسلم$/.test(s)) return out(1, 'tier');
  if (/الالباني/.test(g) && any(s, ALBANI_BOOKS)) return out(2, 'tier');
  if (/شعيب الارن(ا)?و{1,2}ط/.test(g) && any(s, ARNAUT_BOOKS)) return out(3, 'tier');
  if (/ابن حجر/.test(g) && any(s, IBN_HAJAR_BOOKS)) return out(4, 'tier');
  if (any(s, FATWA)) return out(null, 'fatwa');
  return out(null, 'side');
}

if (process.argv[1] && process.argv[1].endsWith('hadith-tiers.mjs') && process.argv.length > 2) {
  const [grader, source] = process.argv.slice(2);
  console.log(JSON.stringify(tierOf({ grader, source })));
}

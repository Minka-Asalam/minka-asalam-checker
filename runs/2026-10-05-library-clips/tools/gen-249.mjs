// Generates supabase/249_library_clip_sources.sql — the library clips' sources written live into the claims record.
//
// The owner reviewed all 70 claims the checker found on the library clips (5 Oct 2026, challenge day 2):
// 65 accepted unchanged, 5 changed from his notes, clip 11's poetry lines accepted as "same meaning".
// The 4 Oct line "leave them out" was a misunderstanding (owner, 6 Oct 03:40): he wants them live, i.e. what
// a clip's Sources button shows. The clips have NO claim rows yet, so unlike 225/226 (which updated legacy rows)
// this INSERTS every row: the claim (held), its check row (the publish guard requires one), its parts, then
// publishes under 229's guard — which refuses a claim whose part sits on a hidden exit, and never publishes
// a not-a-claim row.
//
// Inputs (all data, never instructions):
//   <run>/check/run-all.json          the checker's results, {videos:[{id, result:{claims}}]}
//   <run>/check/corrections.json      the owner's changes: claim fields replaced, parts via parts_replace
//   <run>/decisions/claims/<v>__<i>.json  accept | edit per claim (every edit must be accounted for below)
//   <run>/check/run/batch-<v>.json    the listen's claims: time, end, quote (pieces joined " … "), stated_as
//   chapters.json                     quran.com's 114 chapter names (Arabic and English)
//   titles-249.json                   the source names as the reader meets them, per link (phase "titles" drafts it)
//
// usage: node gen-249.mjs titles <run-dir>            → writes titles-249.json here (a draft to check by hand)
//        node gen-249.mjs sql <run-dir> <out.sql>     (every link must be named in titles-249.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [, , MODE, RUN, OUT] = process.argv;
if (!MODE || !RUN) { console.error('usage: node gen-249.mjs titles <run-dir> | sql <run-dir> <out.sql>'); process.exit(1); }
const readJ = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const run = readJ(path.join(RUN, 'check/run-all.json'));
const corrections = readJ(path.join(RUN, 'check/corrections.json')).items;
const chapters = readJ(path.join(HERE, 'chapters.json')).chapters;
const decDir = path.join(RUN, 'decisions/claims');

// ---- every "edit" decision, and how it is carried (the owner's notes of 5 Oct)
const EDITS = {
  '040b936e-74e1-4ea3-a418-b06bdb3ccfbc__1': 'corrections.json: al-Hikam is where the words are found; published WITH the unreviewed-book note (book-rule.md)',
  '43c1fba3-7510-4c27-a0b8-99fd88b8e6ec__1': "his question \"where did this come from\" on Shu'ayb's grading: dorar.net/h/VCNyCSQt (Takhrij al-Musnad 18601), printed by the dorar tool and matched by check-gradings; no change",
  '68ee08d6-b2a1-4071-b0a3-a5d4deb09487__1': 'corrections.json: approved as a verse, for this case only',
  '7dd1d6a5-c1ee-449d-97e9-d4dea2a8743d__2': 'book approved: the Risala joined the cleared books by migration 245; no change to the claim',
  '8264f19d-ca26-4d91-9baf-be09a03d1007__1': "books approved: Riyad al-Salihin + Hilyat al-Awliya joined the cleared books by migration 245; no change to the claim",
  'eb31fe16-1aec-443c-b9ed-368ff7e04e08__1': "corrections.json: al-Tirmidhi 3393 (al-Albani: sahih) carries the reward without the certainty condition",
};
const CLEARED_BOOKS = new Set(['al-mughni-sharh-mukhtasar-al-khiraqi', 'al-majmu-sharh-al-madhhab', 'kuwaiti-encyclopedia-of-jurisprudence', 'zad-al-maad-fi-hady-khayr-al-ibad', "al-ashbah-wa'l-nazair-1", 'al-sira-al-nabawiyya-1', 'tafsir-al-baghawi', 'tafsir-al-tabari-jami-al-bayan', 'tarikh-al-tabari', 'a-treatise-on-predestination-and-fate', 'riyad-salihin', 'hilyat-awliya']);
const NOTE = { ar: 'كتابٌ لم يراجعه مختصٌّ بعد', en: 'Book not yet reviewed by a specialist' };

const A = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const q = (s) => (s == null || s === '' ? 'null' : `$t$${String(s)}$t$`);
const qi = (n) => (n == null ? 'null' : String(Number(n)));
const J = (o) => q(JSON.stringify(o)) + '::jsonb';
const sec = (ts) => { if (!ts) return null; const p = String(ts).split(':').map(Number); return p.reduce((a, b) => a * 60 + b, 0); };
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const usulSlug = (u) => (String(u || '').match(/usul\.ai\/t\/([^/?]+)/) || [])[1] || null;
const pinned = /^https:\/\/usul\.ai\/t\/[a-z0-9][a-z0-9'._-]*\/[1-9][0-9]*\?versionId=[A-Za-z0-9_.-]+$/;
const CLAIM_KIND = { hadith: 'hadith', report: 'report', quran: 'quran', ruling: 'ruling', number: 'number', fatwa: 'fatwa', no_origin: 'ruling', poetry: 'saying' };
const PART_KINDS = new Set(['ruling', 'attribution', 'standing', 'quote', 'report', 'figure', 'verse', 'hadith', 'fatwa', 'saying']);
const PART_KIND = { hadith: 'hadith', report: 'report', quran: 'verse', ruling: 'ruling', number: 'figure', fatwa: 'fatwa', no_origin: 'ruling', poetry: 'quote' };
const STATE_RANK = ['corrected', 'not_found', 'overstated', 'by_meaning', 'matches']; // worst first; not_a_claim apart
const VERDICT = { matches: 'ok', by_meaning: 'imprecise', overstated: 'imprecise', corrected: 'wrong', not_found: 'unverifiable', not_a_claim: 'not_a_claim' };
const SEVERITY = { none: 'none', minor: 'amber', real: 'red' };

// ---- the names the reader meets (as gen-226; new books from this run added)
const WORKS = {
  'kuwaiti-encyclopedia-of-jurisprudence': { ar: 'الموسوعة الفقهية الكويتية', en: 'Kuwaiti Encyclopaedia of Jurisprudence' },
  'al-mughni-sharh-mukhtasar-al-khiraqi': { ar: 'المغني لابن قدامة', en: 'Al-Mughni, Ibn Qudama' },
  'tafsir-al-baghawi': { ar: 'تفسير البغوي', en: 'Tafsir al-Baghawi' },
  'tafsir-al-tabari-jami-al-bayan': { ar: 'تفسير الطبري', en: 'Tafsir al-Tabari' },
  'riyad-salihin': { ar: 'رياض الصالحين للنووي', en: 'Riyad al-Salihin, al-Nawawi' },
  'hilyat-awliya': { ar: 'حلية الأولياء لأبي نعيم', en: "Hilyat al-Awliya', Abu Nu'aym" },
  'a-treatise-on-predestination-and-fate': { ar: 'رسالة في القضاء والقدر لابن عثيمين', en: "Risala fi al-Qada' wa-l-Qadar, Ibn Uthaymin" },
  'al-hikam-al-ataiyya': { ar: 'الحكم العطائية لابن عطاء الله السكندري', en: "Al-Hikam al-Ata'iyya, Ibn Ata'illah al-Iskandari" },
};
const GRADERS = { 'الألباني': 'al-Albani', 'شعيب الأرنؤوط': "Shu'ayb al-Arna'ut", 'شعيب الأرناؤوط': "Shu'ayb al-Arna'ut", 'ابن حجر': 'Ibn Hajar', 'ابن حجر العسقلاني': 'Ibn Hajar', 'البخاري': 'al-Bukhari', 'مسلم': 'Muslim', 'أحمد شاكر': 'Ahmad Shakir', 'الترمذي': 'al-Tirmidhi', 'ابن حبان': 'Ibn Hibban', 'النووي': 'al-Nawawi', 'ابن باز': 'Ibn Baz', 'الوادعي': "al-Wadi'i", 'الدارقطني': 'al-Daraqutni' };
const NARRATORS = { 'أبو هريرة': 'Abu Hurayra', 'عبدالله بن عمر': 'Abdullah ibn Umar', 'عبد الله بن عمر': 'Abdullah ibn Umar', 'عبدالله بن عباس': 'Abdullah ibn Abbas', 'عبد الله بن عباس': 'Abdullah ibn Abbas', 'أنس بن مالك': 'Anas ibn Malik', 'عبدالله بن مسعود': "Abdullah ibn Mas'ud", 'عبد الله بن مسعود': "Abdullah ibn Mas'ud", 'جابر بن عبدالله': 'Jabir ibn Abdullah', 'عائشة أم المؤمنين': "A'isha", 'أبو موسى الأشعري': "Abu Musa al-Ash'ari", 'أبو الدرداء': "Abu al-Darda'", 'معاذ بن جبل': "Mu'adh ibn Jabal", 'أبو ذر الغفاري': 'Abu Dharr', 'أبو سعيد الخدري': "Abu Sa'id al-Khudri", 'عمر بن الخطاب': 'Umar ibn al-Khattab', 'علي بن أبي طالب': 'Ali ibn Abi Talib', 'البراء بن عازب': "al-Bara' ibn Azib", 'شداد بن أوس': 'Shaddad ibn Aws', 'صهيب بن سنان الرومي': 'Suhayb al-Rumi', 'صهيب': 'Suhayb', 'عبدالله بن عمرو': 'Abdullah ibn Amr', 'عبد الله بن عمرو': 'Abdullah ibn Amr', 'أبو أمامة الباهلي': 'Abu Umama al-Bahili', 'جرير بن عبدالله': 'Jarir ibn Abdullah', 'سعد بن أبي وقاص': "Sa'd ibn Abi Waqqas", 'حذيفة بن اليمان': 'Hudhayfa ibn al-Yaman', 'المستورد بن شداد': 'al-Mustawrid ibn Shaddad', 'عقبة بن عامر': 'Uqba ibn Amir', 'كعب بن عجرة': "Ka'b ibn Ujra" };
const GRADE_EN = { 'صحيح': 'Sahih', 'حسن': 'Hasan', 'حسن لغيره': 'Hasan li-ghayrihi', 'صحيح لغيره': 'Sahih li-ghayrihi', 'ضعيف': "Da'if", 'حسن صحيح': 'Hasan sahih', 'إسناده صحيح': 'Sahih chain', 'إسناده حسن': 'Hasan chain', 'إسناده ضعيف': 'Weak chain', 'إسناده قوي': 'Strong chain','إسناده صحيح على شرط مسلم': "Sahih chain on Muslim's conditions", 'إسناده صحيح على شرط الشيخين': "Sahih chain on the two Shaykhs' conditions", 'صحيح على شرط مسلم': "Sahih on Muslim's conditions", 'أخرجه في صحيحه': 'In his Sahih', 'رجاله رجال الصحيح': "Its narrators are the Sahih's narrators" };
const COLL_EN = { 'صحيح البخاري': 'Sahih al-Bukhari', 'صحيح مسلم': 'Sahih Muslim', 'صحيح الترمذي': 'Sahih al-Tirmidhi', 'صحيح أبي داود': 'Sahih Abi Dawud', 'صحيح النسائي': "Sahih al-Nasa'i", 'صحيح ابن ماجه': 'Sahih Ibn Majah', 'صحيح الجامع': "Sahih al-Jami'", 'صحيح الترغيب': 'Sahih al-Targhib', 'السلسلة الصحيحة': 'Al-Silsila al-Sahiha', 'تخريج المسند لشعيب': 'Takhrij al-Musnad', 'تخريج المسند': 'Takhrij al-Musnad', 'تخريج سنن ابن ماجه': 'Takhrij Sunan Ibn Majah', 'تخريج سنن أبي داود': 'Takhrij Sunan Abi Dawud', 'تخريج صحيح ابن حبان': 'Takhrij Sahih Ibn Hibban', 'سنن الترمذي': 'Sunan al-Tirmidhi', 'صحيح ابن حبان': 'Sahih Ibn Hibban', 'إرواء الغليل': "Irwa' al-Ghalil" };
const tr = (map, s) => (s && map[String(s).trim()]) || (s ? String(s).trim() : '');
const strip = (x) => String(x || '').replace(/\([^)]*\)/g, '').replace(/\[|\]/g, '').replace(/\s+/g, ' ').trim();
const gradeEn = (g) => GRADE_EN[g] || GRADE_EN[String(g).split('،')[0].trim()] || null;

// a draft name for a link from the part's own source fields; the hand check edits the draft
function draftTitle(s) {
  const link = s.link || ''; const h = host(link);
  if (h === 'usul.ai') {
    const slug = usulSlug(link); const w = WORKS[slug];
    if (!w) return { ar: '', en: '', dar: '', den: '', note: 'UNKNOWN WORK ' + slug };
    const vp = s.volume && s.page ? { ar: `${A(s.volume)}/${A(s.page)}`, en: `${s.volume}/${s.page}` } : null;
    const unreviewed = !CLEARED_BOOKS.has(slug);
    return { ar: `${w.ar}${vp ? ' ' + vp.ar : ''}`, en: `${w.en}${vp ? ' ' + vp.en : ''}`, dar: unreviewed ? NOTE.ar : '', den: unreviewed ? NOTE.en : '' };
  }
  if (h === 'dorar.net') {
    const coll = String(s.collection || '').trim(), num = String(s.number || '').trim();
    const g = strip(s.grading), grader = strip(s.grader), narr = strip(s.narrator);
    const sahihayn = /^(البخاري|مسلم)$/.test(grader) || /^صحيح (البخاري|مسلم)$/.test(coll);
    const dar = [g, sahihayn ? '' : grader, narr].filter(Boolean).join(' · ');
    const den = [gradeEn(g) || '', sahihayn ? '' : tr(GRADERS, grader), tr(NARRATORS, narr)].filter(Boolean).join(' · ');
    return { ar: coll ? `${coll} ${A(num)}` : '', en: coll ? `${COLL_EN[coll] || coll} ${num}` : '', dar, den };
  }
  if (h === 'quran.com') {
    const m = link.match(/quran\.com\/(\d+)\/(\d+)(?:-(\d+))?$/);
    if (m) {
      const ch = chapters.find((c) => c.id === Number(m[1]));
      const ar = `${ch ? ch.name_arabic : 'سورة ' + m[1]} ${A(m[2])}${m[3] ? '–' + A(m[3]) : ''}`;
      const en = `${ch ? ch.name_simple : 'Surah ' + m[1]} ${m[1]}:${m[2]}${m[3] ? '-' + m[3] : ''}`;
      return { ar, en, dar: 'نص المصحف', den: 'The mushaf text' };
    }
  }
  if (h === 'aldiwan.net') {
    const work = String(s.work_ar || '');
    // the poem's English name is written by hand in titles-249.json (one poem in this run)
    return { ar: work.split(' — ')[0].replace(/\s*\(.*\)\s*/, ' ').trim() || 'الديوان', en: '', dar: work.split(' — ').slice(1).join(' — '), den: '' };
  }
  return { ar: '', en: '', dar: '', den: '', note: 'UNKNOWN SITE ' + h };
}

// ---- the reviewed claims: run-all + the owner's corrections + his decisions
const videos = [];
const decisions = {};
for (const f of fs.readdirSync(decDir)) decisions[f.replace(/\.json$/, '')] = readJ(path.join(decDir, f));
const usedEdits = new Set();
for (const v of run.videos) {
  const batchFile = path.join(RUN, 'check/run', `batch-${v.id}.json`);
  const b = readJ(batchFile); const bv = b.videos ? b.videos[0] : b;
  if (bv.id !== v.id) throw new Error('batch id mismatch ' + v.id);
  const claims = [];
  for (const c0 of v.result.claims) {
    const key = `${v.id}__${c0.i}`;
    const d = decisions[key]; if (!d) throw new Error('no decision for ' + key);
    if (d.decision === 'edit') { if (!EDITS[key]) throw new Error('an edit not accounted for: ' + key + ' ' + d.edit); usedEdits.add(key); }
    else if (d.decision !== 'accept') throw new Error(`decision ${d.decision} on ${key}`);
    const c = JSON.parse(JSON.stringify(c0));
    for (const k of corrections.filter((x) => x.video === v.id && x.i === c.i)) { Object.assign(c, k.claim || {}); if (k.parts_replace) c.parts = JSON.parse(JSON.stringify(k.parts_replace)); }
    const bc = bv.claims.find((x) => x.i === c.i); if (!bc) throw new Error('no listened claim for ' + key);
    claims.push({ ...c, said: bc });
  }
  videos.push({ id: v.id, title: bv.title, claims });
}
for (const k of Object.keys(EDITS)) if (!usedEdits.has(k)) throw new Error('EDITS names a claim with no edit decision: ' + k);
const nCorr = corrections.filter((k) => videos.some((v) => v.id === k.video && v.claims.some((c) => c.i === k.i))).length;
if (nCorr !== corrections.length) throw new Error(`only ${nCorr} of ${corrections.length} corrections land on a claim`);

const allLinks = new Map();
for (const v of videos) for (const c of v.claims) for (const p of c.parts) { const s = p.source || {}; if (s.link && !allLinks.has(s.link)) allLinks.set(s.link, s); }

// ---- phase: titles
const TITLES_FILE = path.join(HERE, 'titles-249.json');
if (MODE === 'titles') {
  const existing = fs.existsSync(TITLES_FILE) ? readJ(TITLES_FILE) : {};
  const out = {}; let fresh = 0;
  for (const [link, s] of allLinks) { if (existing[link] && existing[link].ar) { out[link] = existing[link]; continue; } out[link] = draftTitle(s); fresh++; }
  fs.writeFileSync(TITLES_FILE, JSON.stringify(out, null, 1));
  const gaps = Object.entries(out).filter(([, t]) => !t.ar || !t.en || t.note);
  console.log(`titles: ${allLinks.size} links, ${fresh} drafted now, ${gaps.length} missing a name in one language`);
  for (const [l, t] of gaps) console.log('  NEEDS A NAME:', l, t.note || '', JSON.stringify(t));
  process.exit(0);
}

// ---- phase: sql
if (MODE !== 'sql' || !OUT) { console.error('give: sql <run-dir> <out.sql>'); process.exit(1); }
const TITLES = readJ(TITLES_FILE);
for (const link of allLinks.keys()) { const t = TITLES[link]; if (!t) throw new Error('no title for ' + link); if (!t.ar || !t.en || t.note) throw new Error('title incomplete for ' + link); }

// A part's time: the pieces of the listened claim its words were said in (a unit told in pieces keeps each
// piece's time, 225); else the claim's own span. Matching is by shared words after folding the spelling.
const fold = (s) => String(s || '').replace(/[\u064B-\u0652\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^\u0621-\u064Aa-zA-Z0-9 ]+/g, ' ').toLowerCase().split(/\s+/).filter((w) => w.length > 1);
function partSpan(c, p) {
  const whole = { t0: sec(c.said.timestamp), t1: sec(c.said.timestamp_end), how: 'claim' };
  const pieces = c.said.pieces || [];
  if (pieces.length < 2 || !p.said_text) return whole;
  const pw = new Set(fold(p.said_text));
  const hits = pieces.filter((pc) => { const w = fold(pc.quote); if (!w.length) return false; const shared = w.filter((x) => pw.has(x)).length; return shared / w.length >= 0.5 || shared / pw.size >= 0.5; });
  if (!hits.length) return whole;
  return { t0: Math.min(...hits.map((h) => sec(h.timestamp))), t1: Math.max(...hits.map((h) => sec(h.timestamp_end))), how: `${hits.length}/${pieces.length} pieces` };
}

// the gradings list the app reads (videoSources.ts): the part's own grader first, then every other grader
function gradingsOf(s) {
  if (!s.gradings || !s.gradings.length) return null;
  const one = (grader, grading, collection, number, link) => {
    const g = strip(grader); const w = String(grading || '').trim();
    const o = { grader_ar: g, word_ar: w };
    if (GRADERS[g]) o.grader_en = GRADERS[g];
    if (gradeEn(w)) o.word_en = gradeEn(w);
    if (collection) { o.work_ar = `${collection}${number ? ' ' + A(number) : ''}`; if (COLL_EN[collection]) o.work_en = `${COLL_EN[collection]}${number ? ' ' + number : ''}`; }
    if (link) o.link = link;
    return o;
  };
  return [one(s.grader, s.grading, s.collection, s.number, s.link), ...s.gradings.map((g) => one(g.grader, g.grading, g.collection, g.number, g.link))];
}

const sql = []; const out = (s) => sql.push(s);
const log = [];
const totals = { videos: 0, claims: 0, published: 0, held: 0, parts: 0 };
const allIds = videos.map((v) => `'${v.id}'`).join(', ');
out(`-- 249: THE LIBRARY CLIPS' SOURCES, LIVE — the owner's review of 5 Oct written into the claims record.
-- Generated by D:/Deeni Docs/curation/tools 2026-10-06 write-back 249/gen-249.mjs (challenge day 3, 6 Oct 2026) from
-- D:/Deeni Docs/curation/2026-10-05 Clip library run: the checker's results (check/run-all.json), the owner's
-- 5 corrections (check/corrections.json) and his decision on every claim (decisions/claims, 70 of 70: 64 accept,
-- 6 edit — each edit accounted for in the generator's EDITS table). The 4 Oct "leave them out" was a
-- misunderstanding (owner, 6 Oct 03:40): he wants them live, i.e. what a clip's Sources button shows.
-- The clips carry NO claim rows before this (tripwire), so every row is INSERTED, HELD first: the claim, its
-- check row (the publish guard requires one), its parts; then the claims publish and 229's guard decides
-- (a part on a hidden exit refuses, a not-a-claim row is never published, a state row needs a part).
-- A book outside the cleared list (al-Hikam al-Ata'iyya) carries the unreviewed-book note (book-rule.md):
-- the label under the book's name, the explanation in the part's difference.
-- Backup: D:/Deeni Docs/curation/backups/2026-10-06 pre-249/ + tag pre-249-2026-10-06.

begin;

create temp table _before_249 on commit drop as
select (select count(*) from video_claims) as claims, (select count(*) from claim_assertions) as parts,
       (select count(*) from video_claims where published) as published, (select count(*) from video_claim_checks) as checks;

-- tripwire: the ${videos.length} clips exist and carry no claim rows yet
do $$
declare n int;
begin
  select count(*) into n from videos where id in (${allIds});
  if n <> ${videos.length} then raise exception '249 tripwire: % of the ${videos.length} clips exist', n; end if;
  select count(*) into n from video_claims where video_id in (${allIds});
  if n <> 0 then raise exception '249 tripwire: the clips already carry % claim rows', n; end if;
end $$;
`);

for (const v of videos) {
  const pub = [], held = [];
  out(`\n-- ===== ${v.id} (${String(v.title).replace(/\$t\$/g, '').slice(0, 60)}) — ${v.claims.length} claim(s) =====`);
  for (const c of v.claims) {
    const states = c.parts.map((p) => p.state);
    const allNot = states.every((s) => s === 'not_a_claim');
    const worst = allNot ? 'not_a_claim' : STATE_RANK.find((s) => states.includes(s));
    if (!worst) throw new Error(`${v.id} #${c.i}: no state among ${states}`);
    if (worst !== c.state) log.push(`NOTE ${v.id} #${c.i}: the checker's claim state ${c.state}, its parts' worst ${worst} (written: ${worst})`);
    const flow = c.flow_kind; if (!CLAIM_KIND[flow]) throw new Error(`${v.id} #${c.i}: flow ${flow}`);
    const t0 = sec(c.said.timestamp), t1 = sec(c.said.timestamp_end);
    if (t0 == null) throw new Error(`${v.id} #${c.i}: no time`);
    if (!c.line_ar || !c.line_en) throw new Error(`${v.id} #${c.i}: the claim line is missing a language`);
    out(`\n-- claim ${c.i}: ${flow}${c.sub_kind ? '/' + c.sub_kind : ''}, ${worst}, level ${c.level}, ${c.parts.length} part(s)${allNot ? ' — HELD (not a claim)' : ''}
insert into video_claims (video_id, position, kind, timestamp_seconds, end_seconds, quote, text_ar, text_en, flow_kind, sub_kind, state, level, published)
values ('${v.id}', ${c.i}, ${q(CLAIM_KIND[flow])}, ${t0}, ${qi(t1 != null && t1 >= t0 ? t1 : null)}, ${q(c.said.quote)}, ${q(c.line_ar)}, ${q(c.line_en)}, ${q(flow)}, ${q(c.sub_kind)}, ${q(worst)}, ${qi(c.level)}, false);
insert into video_claim_checks (claim_id, attribution, reference, stated_as, verdict, severity, rule, reason, reason_ar, claim_en, looked_up, harm, harm_basis, harm_basis_ar, load_bearing)
select c.id, ${q(c.said.attribution)}, ${q(c.said.reference)}, ${q(['definitive', 'opinion', 'disputed'].includes(c.said.stated_as) ? c.said.stated_as : null)}, ${q(worst === 'matches' && flow === 'hadith' && c.level >= 4 ? 'weak' : VERDICT[worst])}, ${q(SEVERITY[c.harm || 'none'])}, 'none',
  ${q(c.reason_en || c.reason_ar)}, ${q(c.reason_ar)}, ${q(c.line_en)}, ${c.parts.some((p) => (p.search_log || []).some((l) => /dorar/.test(l.source))) ? 'true' : 'false'}, ${q(c.harm || 'none')}, ${q(c.harm_basis_en)}, ${q(c.harm_basis_ar)}, ${c.load_bearing ? 'true' : 'false'}
from video_claims c where c.video_id = '${v.id}' and c.position = ${c.i};`);
    if (!['none', 'minor', 'real'].includes(c.harm || 'none')) throw new Error(`${v.id} #${c.i}: harm ${c.harm}`);
    c.parts.forEach((p, k) => {
      const s = p.source || {}; const link = s.link || null; const title = link ? TITLES[link] : null;
      const kind = PART_KINDS.has(p.kind) ? p.kind : PART_KIND[p.flow_kind];
      if (!kind) throw new Error(`${v.id} #${c.i}: part kind ${p.kind}/${p.flow_kind}`);
      if (!['spoken', 'implied'].includes(p.origin || 'spoken')) throw new Error(`${v.id} #${c.i}: origin ${p.origin}`);
      const implied = p.origin === 'implied';
      const span = implied ? { t0: null, t1: null, how: 'implied' } : partSpan(c, p);
      if ((c.said.pieces || []).length > 1) log.push(`time ${v.id.slice(0, 8)} #${c.i}.${k + 1}: ${span.t0}-${span.t1} (${span.how}) «${String(p.said_text || '').slice(0, 50)}»`);
      const pinUrl = [link, s.page_url].find((u) => u && pinned.test(u) && s.volume && s.page) || null;
      const gradings = gradingsOf(s);
      totals.parts++;
      out(`insert into claim_assertions (claim_id, position, kind, origin, text_ar, text_en, flow_kind, exit_id, state, level, said_text,
  timestamp_seconds, end_seconds, source_link, source_site, source_quote, source_page_url, source_volume, source_page,
  source_title_ar, source_title_en, source_detail_ar, source_detail_en, gradings, difference_ar, difference_en, search_log, checked_at)
select c.id, ${k + 1}, ${q(kind)}, ${q(p.origin || 'spoken')},
  ${q(p.text_ar)}, ${q(p.text_en)}, ${q(p.flow_kind)}, ${q(p.exit_id)}, ${q(p.state)}, ${qi(p.level)}, ${implied ? 'null' : q(p.said_text)},
  ${qi(span.t0)}, ${qi(span.t1 != null && span.t0 != null && span.t1 >= span.t0 ? span.t1 : null)}, ${q(link)}, ${q(s.site)}, ${q(s.quote)}, ${pinUrl ? q(pinUrl) : 'null'}, ${pinUrl ? q(String(s.volume)) : 'null'}, ${pinUrl ? Number(s.page) : 'null'},
  ${q(title && title.ar)}, ${q(title && title.en)}, ${q(title && title.dar)}, ${q(title && title.den)}, ${gradings ? J(gradings) : 'null'}, ${q(p.difference_ar)}, ${q(p.difference_en)}, ${p.search_log ? J(p.search_log) : 'null'}, '2026-10-05'::timestamptz
from video_claims c where c.video_id = '${v.id}' and c.position = ${c.i};`);
    });
    (allNot ? held : pub).push(c.i);
  }
  if (pub.length) out(`\n-- publish (229's guard decides each row)
update video_claims set published = true where video_id = '${v.id}' and position in (${pub.join(', ')});`);
  const nParts = v.claims.reduce((a, c) => a + c.parts.length, 0);
  out(`do $$
declare n int;
begin
  select count(*) into n from video_claims where video_id = '${v.id}' and published and state is not null and published_at is not null;
  if n <> ${pub.length} then raise exception '249 probe ${v.id}: % published claims, expected ${pub.length}', n; end if;
  select count(*) into n from video_claims where video_id = '${v.id}' and not published;
  if n <> ${held.length} then raise exception '249 probe ${v.id}: % held claims, expected ${held.length}', n; end if;
  select count(*) into n from claim_assertions a join video_claims c on c.id = a.claim_id where c.video_id = '${v.id}' and a.state is not null;
  if n <> ${nParts} then raise exception '249 probe ${v.id}: % parts with a state, expected ${nParts}', n; end if;
  select count(*) into n from video_claim_checks k join video_claims c on c.id = k.claim_id where c.video_id = '${v.id}';
  if n <> ${v.claims.length} then raise exception '249 probe ${v.id}: % check rows, expected ${v.claims.length}', n; end if;
end $$;`);
  totals.videos++; totals.claims += v.claims.length; totals.published += pub.length; totals.held += held.length;
}

out(`
-- the whole write: these clips only, nothing else touched
do $$
declare b record; n int;
begin
  select * into b from _before_249;
  select count(*) into n from video_claims; if n - b.claims <> ${totals.claims} then raise exception '249 probe: % new claims, expected ${totals.claims}', n - b.claims; end if;
  select count(*) into n from claim_assertions; if n - b.parts <> ${totals.parts} then raise exception '249 probe: % new parts, expected ${totals.parts}', n - b.parts; end if;
  select count(*) into n from video_claims where published; if n - b.published <> ${totals.published} then raise exception '249 probe: % newly published, expected ${totals.published}', n - b.published; end if;
  select count(*) into n from video_claim_checks; if n - b.checks <> ${totals.claims} then raise exception '249 probe: % new check rows, expected ${totals.claims}', n - b.checks; end if;
  select count(*) into n from claim_assertions a join video_claims c on c.id = a.claim_id
    left join claim_exits e on e.kind = a.flow_kind and e.exit_id = a.exit_id
   where c.video_id in (${allIds}) and c.published and a.state is not null and not coalesce(e.publishable, false);
  if n <> 0 then raise exception '249 probe: % published parts on a hidden exit', n; end if;
  select count(*) into n from claim_assertions a join video_claims c on c.id = a.claim_id
   where c.video_id in (${allIds}) and a.source_link is not null and coalesce(btrim(a.source_title_ar), '') = '';
  if n <> 0 then raise exception '249 probe: % sourced parts without a name', n; end if;
  raise notice '249 applied: ${totals.claims} claims on ${totals.videos} clips (${totals.published} published, ${totals.held} not-a-claim held), ${totals.parts} parts';
end $$;

commit;
`);
fs.writeFileSync(OUT, sql.join('\n') + '\n');
fs.writeFileSync(path.join(HERE, 'gen-249.log.txt'), log.join('\n') + '\n');
console.log(`wrote ${OUT}: ${totals.videos} clips, ${totals.claims} claims (${totals.published} published, ${totals.held} held), ${totals.parts} parts`);
console.log(log.filter((l) => l.startsWith('NOTE')).join('\n'));

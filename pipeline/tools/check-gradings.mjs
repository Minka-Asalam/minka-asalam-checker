// THE GRADING PASS TEST (2026-10-01). Does every hadith line say what the
// dorar page it links to says? Grade, grader, book and number, each compared
// against the entry on the linked page itself — the test a judge would do by
// tapping the link. No model, no tokens: curl + string comparison.
//
// Two inputs, detected by shape:
//   - the live table: the JSON printed by
//       npx supabase db query --linked "select c.id, v.title, c.position, c.timestamp_seconds,
//         c.source_collection, c.source_collection_ar, c.source_number, c.source_grader,
//         c.source_grader_ar, c.source_grading, c.source_url from video_claims c
//         left join videos v on v.id = c.video_id where c.kind = 'hadith' and c.published"
//     (old rows store a grading as ONE of four words, so a page that says more
//      — "sahih li-ghayrihi", "its chain is hasan" — is reported as FLATTENED)
//   - checker v2's results.json (data.videos[].claims[].new.parts[] with
//     flow_kind 'hadith' and a dorar source; the grader's exact word is kept,
//     so it is compared word for word)
//
//   node check-gradings.mjs <input.json> [report.json] [--cache <dir>]
//
// The joined package's copy (2026-10-02) also reads the workflow's own return value
// (videos[].result.claims[].parts), checks every entry of source.gradings against ITS
// page (one source per grader), and fails a line whose grader or grading packs several
// graders into one field. Run it on the run's output BEFORE anything is published.
//
// Exit code 0 = every line matches its page; 1 = at least one does not.
// The report's `mismatch` pile is what must be fixed; `unclear` is where the
// page gives a note rather than a grade (a scholar's call, never the script's);
// `unchecked` is where there is no single entry to compare with (a search-page
// link, a page that would not load). A grading is a judgement: this script
// reports, it never rewrites anything.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const cacheAt = args.indexOf('--cache');
const CACHE = cacheAt >= 0 ? args.splice(cacheAt, 2)[1] : path.join(path.dirname(fileURLToPath(import.meta.url)), 'page-cache');
const [IN, OUT = IN.replace(/\.json$/i, '') + '.grading-report.json'] = args;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
fs.mkdirSync(CACHE, { recursive: true });

// ---------- input ----------
const raw = fs.readFileSync(IN, 'utf8');
const doc = JSON.parse(raw.slice(raw.indexOf('{')));
const lines = [];
// v2 comes in two shapes: the assembler's results.json (data.videos[].claims[].new.parts) and the
// workflow's own return value (videos[].result.claims[].parts) — the joined package checks the run's
// output BEFORE anything is assembled or published (2026-10-02).
const v2videos = doc.data?.videos
  ? doc.data.videos.map((v) => ({ v, claims: (v.claims ?? []).map((c) => ({ c, parts: c.new?.parts ?? [] })) }))
  : Array.isArray(doc.videos) && doc.videos.some((v) => v.result?.claims)
    ? doc.videos.map((v) => ({ v, claims: (v.result?.claims ?? []).map((c) => ({ c, parts: c.parts ?? [] })) }))
    : null;
if (v2videos) {
  for (const { v, claims } of v2videos)
    for (const { c, parts } of claims)
      for (const p of parts) {
        if (p.flow_kind !== 'hadith' || p.kind !== 'hadith' || !p.source?.link) continue;
        const id = `${v.video_id ?? v.id ?? v.videoId}#${c.i}.${p.position}`;
        const where = `${v.title ?? v.video_id ?? v.id} · ${c.timestamp ?? ''}`;
        lines.push({
          id, where,
          book: p.source.collection, number: p.source.number,
          grader: p.source.grader, words: p.source.grading, level: p.level, url: p.source.link, v: 2, othersGrade: (p.source.gradings ?? []).length > 0,
        });
        // ONE SOURCE PER GRADER (2026-10-02): every other grader is its own entry with its own page,
        // and each is checked against that page like the main line.
        for (const [k, g] of (p.source.gradings ?? []).entries()) {
          if (!g?.link) continue;
          lines.push({ id: `${id}/g${k + 1}`, where, book: g.collection, number: g.number, grader: g.grader, words: g.grading, level: null, url: g.link, v: 2, extraGrader: true });
        }
      }
} else {
  for (const r of doc.rows ?? doc) {
    const t = r.timestamp_seconds;
    lines.push({
      id: r.id,
      where: `${r.title ?? r.video_id} · ${t == null ? '#' + r.position : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`}`,
      book: r.source_collection_ar || r.source_collection, bookEn: r.source_collection, number: r.source_number,
      grader: r.source_grader_ar || r.source_grader, graderEn: r.source_grader, grading: r.source_grading, url: r.source_url, v: 1,
    });
  }
}

// ---------- Arabic, compared loosely ----------
const norm = (s) =>
  String(s ?? '')
    .replace(/[ً-ٰٟـ]/g, '') // marks, tatweel
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[\[\]«»"'()،,.:؛]/g, ' ')
    .replace(/\s+/g, ' ').trim();
const digits = (s) => String(s ?? '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const numbers = (s) => (digits(s).match(/\d+/g) ?? []);

// The grader's word → our level, from checker v2's hadith flow step s5
// (flow-hadith.md). Longest phrase first, anchored at the start of the ruling.
const FAMILIES = [
  ['sahih', ['صحيح لغيره', 'اسناده صحيح', 'صحيح']],
  ['hasan', ['حسن صحيح', 'حسن لغيره', 'اسناده حسن', 'حسن']],
  ['daif', ['ضعيف جدا', 'اسناده ضعيف', 'ضعيف', 'منكر', 'لا يصح']],
  ['mawdu', ['موضوع', 'باطل', 'لا اصل له']],
].map(([lvl, ps]) => [lvl, ps.map(norm)]);
const PLAIN = { sahih: 'صحيح', hasan: 'حسن', daif: 'ضعيف', mawdu: 'موضوع' };
const LEVEL_OF = { 1: 'sahih', 2: 'hasan', 4: 'daif', 5: 'mawdu' };
const EN = { sahih: 'Authentic (sahih)', hasan: 'Sound (hasan)', daif: 'Weak', mawdu: 'Fabricated' };
function family(ruling) {
  const r = norm(ruling);
  let best = null;
  for (const [lvl, ps] of FAMILIES) for (const p of ps) if ((r === p || r.startsWith(p + ' ')) && (!best || p.length > best.p.length)) best = { lvl, p };
  return best && { level: best.lvl, phrase: best.p, extra: r.slice(best.p.length).trim() };
}

// ---------- the page ----------
const text = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const field = (t, re) => ((t.match(re) || [])[1] || '').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function page(url) {
  const file = path.join(CACHE, url.replace(/^https:\/\/dorar\.net\//, '').replace(/[^A-Za-z0-9]+/g, '_') + '.html');
  if (fs.existsSync(file) && fs.statSync(file).size > 20000) return fs.readFileSync(file, 'utf8');
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const html = execFileSync('curl', ['-s', '-L', '--max-time', '40', '-A', UA, '-H', 'Accept-Language: ar,en;q=0.8', url], { maxBuffer: 64 << 20 }).toString('utf8');
      if (/خلاصة حكم المحدث/.test(html)) { fs.writeFileSync(file, html); await sleep(800); return html; }
    } catch {}
    await sleep(3000 * attempt); // Cloudflare blocks come and go
  }
  return null;
}

// The entry the link names is the FIRST card on its page (an /h/ permalink and
// a /hadith/sharh/ explanation page both lead with it).
function entry(html) {
  const t = text(html);
  const i = t.indexOf('خلاصة حكم المحدث');
  const s = t.slice(i, i + 3000);
  return {
    ruling: field(s, /خلاصة حكم المحدث\s*:\s*(.+?)\s+الراوي\s*:/),
    grader: field(s, /(?<!حكم )المحدث\s*:\s*(.+?)\s*\|/),
    book: field(s, /المصدر\s*:\s*(.+?)\s*\|?\s*الصفحة/),
    ref: field(s, /الصفحة أو الرقم\s*:\s*(.+?)\s*(?:\||التخريج|التصنيف|$)/),
    takhrij: field(s, /التخريج\s*:\s*(.+?)\s*(?:التصنيف|\|\s*أصول|$)/),
  };
}

// The two Sahihs' entries are graded by their authors; a line may name no grader there.
const SELF_GRADED = ['البخاري', 'مسلم'].map(norm);
// A collection's name as a takhrij writes it ("أخرجه أبو داود (96)").
const AUTHORS = [
  ['البخاري', 'البخاري'], ['مسلم', 'مسلم'], ['ابي داود', 'ابو داود'], ['الترمذي', 'الترمذي'], ['النسائي', 'النسائي'],
  ['ابن ماجه', 'ابن ماجه'], ['احمد', 'احمد'], ['مالك', 'مالك'], ['طبراني', 'الطبراني'], ['المستدرك', 'الحاكم'],
  ['ابن حبان', 'ابن حبان'], ['ابن خزيمه', 'ابن خزيمه'], ['الدارمي', 'الدارمي'], ['البيهقي', 'البيهقي'], ['ابي يعلي', 'ابو يعلي'],
];
const authorOf = (book) => { const b = norm(book); return norm((AUTHORS.find(([k]) => b.includes(norm(k))) ?? [])[1]) || null; };
// al-Albani's Sahih / Da'if of a Sunan keep that Sunan's numbers (his own
// edition's): "Sunan al-Nasa'i 2236" linking to his Sahih al-Nasa'i 2236 is
// the same entry, though the page's takhrij counts it 2237 in another edition.
// Shu'ayb al-Arna'ut's takhrij of the Musnad keeps the Musnad's numbers, and
// al-Hakim's book goes by two names.
const baseOf = (book) => {
  const b = norm(book);
  if (/^المستدرك/.test(b)) return 'المستدرك';
  if (/^(مسند احمد|تخريج المسند)/.test(b)) return 'مسند احمد';
  return b.replace(/^(سنن|صحيح|ضعيف)\s+/, '');
};
// Is our book and number in the page's takhrij? "أخرجه أبو داود (96)", or for a
// volume/page reference "الطبراني في ((المعجم الكبير)) (17/ 186) (498)". When the
// takhrij names the author's work ("الطبراني في المعجم الأوسط"), it must be ours.
function inTakhrijOf(book, number, takhrij) {
  const author = authorOf(book), nums = numbers(number);
  if (!author) return false;
  // One segment per source cited: split on the Arabic comma OUTSIDE parentheses
  // ("البخاري (1901، 2008)، ومسلم (759)" is two segments, not three).
  const segs = [];
  let depth = 0, cur = '';
  for (const ch of String(takhrij ?? '')) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if ((ch === '،' || ch === '.') && depth === 0) { segs.push(cur); cur = ''; } else cur += ch;
  }
  segs.push(cur);
  for (const raw of segs) {
    const s = norm(raw);
    const at = s.indexOf(author);
    if (at < 0) continue;
    const after = s.slice(at + author.length).trim();
    const work = after.match(/^في ([^\d]+)/);
    if (work && !norm(book).split(' ').some((w) => w.length > 3 && !/^(المعجم|السنن)$/.test(w) && work[1].includes(w))) continue;
    const here = numbers(after);
    if (nums.every((n) => here.includes(n))) return true;
  }
  return false;
}
// The same scholar under two spellings (dorar writes الأرناؤوط; others الأرنؤوط).
const nameKey = (s) => norm(s).replace(/ارناووط|ارنووط|ارناوط/g, 'ارناووط');
const sameName = (a, b) => { const x = nameKey(a), y = nameKey(b); return !!x && !!y && (x === y || x.includes(y) || y.includes(x)); };

// ---------- compare ----------
const report = { input: IN, at: new Date().toISOString(), lines: lines.length, match: [], mismatch: [], unclear: [], unchecked: [] };
for (const [n, L] of lines.entries()) {
  process.stdout.write(`${n + 1}/${lines.length}\r`);
  const base = { id: L.id, where: L.where, url: L.url, line: { book: L.book, number: L.number, grader: L.grader, grading: L.words ?? L.grading ?? LEVEL_OF[L.level] } };
  if (!/^https:\/\/dorar\.net\/(h\/|hadith\/sharh\/)/.test(L.url ?? '')) { report.unchecked.push({ ...base, why: 'the link is not a single dorar entry (a search page or another site), so there is nothing to compare with' }); continue; }
  const html = await page(L.url);
  if (!html) { report.unchecked.push({ ...base, why: 'the page did not load after five tries' }); continue; }
  const P = entry(html);
  const out = { ...base, page: P, problems: [] };

  // Grade.
  // A v2 part where graders differ packs them as "words1؛ words2" and
  // "grader1؛ grader2 (where)": the FIRST is the one the link answers for; the
  // others are reported as needing a page of their own, not compared here.
  const fam = family(P.ruling);
  const words = L.v === 2 ? String(L.words ?? '').split('؛')[0].trim() : null;
  const grader1 = String(L.grader ?? '').split('؛')[0].trim();
  const extra = L.v === 2 ? String(L.grader ?? '').split('؛').slice(1).map((s) => s.trim()).filter(Boolean) : [];
  if (extra.length) out.otherGraders = extra;
  // The write-back rule (2026-10-02): the page's word alone and one grader per field. Several graders or
  // gradings packed into one field ("A؛ B") fail — each grader goes into source.gradings with its own link.
  if (L.v === 2 && (/؛/.test(String(L.grader ?? '')) || /؛/.test(String(L.words ?? ''))))
    out.problems.push({ part: 'grader', ours: `${L.grader ?? ''} / ${L.words ?? ''}`, page: P.grader, kind: 'several graders packed into one field' });
  const ours = L.v === 2 ? (L.extraGrader || L.othersGrade || L.level === 3 || extra.length ? family(words)?.level : LEVEL_OF[L.level]) : L.grading; // graders differ: the link answers for its own grader only (the part ranks at the weaker; each other grader is checked on its own page)
  if (!fam) out.note = `the page gives a note, not a grade: «${P.ruling}»`;
  else if (fam.level !== ours) out.problems.push({ part: 'grade', ours: L.words ?? EN[ours] ?? ours, page: P.ruling, kind: 'a different grade' });
  else if (L.v === 2 ? norm(words) !== norm(P.ruling) : !!fam.extra || fam.phrase !== norm(PLAIN[ours]))
    out.problems.push({ part: 'grade', ours: L.words ?? EN[ours], page: P.ruling, kind: L.v === 2 ? (norm(words).startsWith(norm(P.ruling)) ? 'the page\'s word plus the checker\'s own note' : 'not the page\'s exact words') : 'flattened: the page says more than the one word we show' });

  // Grader.
  if (!grader1) { if (!SELF_GRADED.includes(norm(P.grader))) out.problems.push({ part: 'grader', ours: '(none)', page: P.grader, kind: 'the line names no grader; the page does' }); }
  else if (!sameName(grader1, P.grader)) out.problems.push({ part: 'grader', ours: L.grader, page: P.grader, kind: 'a different grader' });
  else if (norm(grader1) !== norm(P.grader) && L.v === 2) out.spelling = `grader spelled «${grader1}», the page «${P.grader}»`;

  // Book and number. Either the line names the page's own book and number, or
  // it names the ORIGINAL collection while the entry sits in the grader's book
  // (Sunan Abi Dawud 864 · al-Albani, linking to his Sahih Abi Dawud) — the
  // ordinary way to cite, and true only when the page's own takhrij says
  // "Abu Dawud (864)". Anything else is a different book.
  const num = numbers(L.number)[0];
  const onPage = sameName(L.book, P.book) && (!num || numbers(P.ref).includes(num));
  const inTakhrij = inTakhrijOf(L.book, L.number, P.takhrij);
  if (onPage) out.cited = 'the page\'s own book';
  else if (num && baseOf(L.book) === baseOf(P.book) && numbers(P.ref).includes(num)) out.cited = 'the collection, at its number in the grader\'s edition of it';
  else if (inTakhrij) out.cited = 'the original collection, named in the page\'s takhrij';
  else out.problems.push({ part: 'book', ours: `${L.book ?? '(none)'} ${L.number ?? ''}`.trim(), page: `${P.book} ${P.ref}`.trim(), takhrij: P.takhrij || '(none on the page)', kind: sameName(L.book, P.book) ? 'a different number' : 'a book the page does not name' });

  if (out.problems.length) report.mismatch.push(out);
  else if (out.note) report.unclear.push(out);
  else report.match.push(out);
}

// ---------- summary ----------
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
const by = {};
for (const m of report.mismatch) for (const p of m.problems) by[`${p.part}: ${p.kind}`] = (by[`${p.part}: ${p.kind}`] ?? 0) + 1;
console.log(`\n${report.lines} lines: ${report.match.length} match their page, ${report.mismatch.length} do not, ${report.unclear.length} unclear (the page gives a note), ${report.unchecked.length} unchecked`);
for (const [k, v] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(`  ${v}  ${k}`);
console.log(`→ ${OUT}`);
process.exit(report.mismatch.length ? 1 : 0);

// bookStatus.mjs — the owner's unreviewed-book rule (5 Oct 2026, Docs curation/2026-10-05 Clip library run/decisions/
// book-rule.md). A source from a book is "cleared" when its usul.ai slug is a cleared row of claim_sources (the nine
// verified copies + the books the owner confirmed in a review, 245); any other book is "not_reviewed": the review page
// flags it for the owner to confirm (it joins the list, no note, never asked again), refuse (the part becomes not
// found) or leave (published WITH the note «كتابٌ لم يراجعه مختصٌّ بعد» / "Book not yet reviewed by a specialist").
// Non-book sources (quran.com, dorar, fatwa bodies, aldiwan) are not books: "n/a".
//   node bookStatus.mjs refresh     → books-cleared.json from the live list (run from any folder; queries via D:\Deeni)
//   node bookStatus.mjs <link>      → cleared | not_reviewed | n/a
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const SNAP = path.join(HERE, 'books-cleared.json');
export function refresh() {
  const q = path.join(HERE, '.books-query.sql');
  fs.writeFileSync(q, 'select usul_slug, usul_version, status, verified_copy from claim_sources where usul_slug is not null;');
  const out = execFileSync('npx', ['supabase', 'db', 'query', '--linked', '--output-format', 'json', '-f', `"${q}"`], { cwd: 'D:/Deeni', encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] });
  const rows = JSON.parse(out.slice(out.indexOf('{'))).rows;
  const snap = { at: new Date().toISOString(), cleared: rows.filter((r) => r.status === 'cleared').map((r) => ({ slug: r.usul_slug, version: r.usul_version, verified_copy: r.verified_copy })) };
  fs.writeFileSync(SNAP, JSON.stringify(snap, null, 1)); return snap;
}
const snapshot = () => (fs.existsSync(SNAP) ? JSON.parse(fs.readFileSync(SNAP, 'utf8')) : refresh());
export function bookStatus(link, snap = snapshot()) {
  const m = /usul\.ai\/t\/([^/?#]+)/.exec(String(link || '')); if (!m) return 'n/a';
  return snap.cleared.some((b) => b.slug === decodeURIComponent(m[1])) ? 'cleared' : 'not_reviewed';
}
export const NOTE = { ar: 'كتابٌ لم يراجعه مختصٌّ بعد', en: 'Book not yet reviewed by a specialist',
  tap_ar: 'وجدنا العبارة في هذا الكتاب، ووجودُها فيه لا يعني صحةَ مضمونها، ولا اتفاقَ العلماء عليه.',
  tap_en: 'We found these words in this book. Being in it does not mean the content is sound, or that scholars agree on it.' };
if (process.argv[1] && process.argv[1].endsWith('bookStatus.mjs') && process.argv[2]) {
  if (process.argv[2] === 'refresh') { const s = refresh(); console.log('cleared books', s.cleared.length, s.cleared.map((b) => b.slug).join(' ')); }
  else console.log(bookStatus(process.argv[2]));
}

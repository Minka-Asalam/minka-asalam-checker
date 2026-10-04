// cloud-probe.mjs — run this FIRST in a cloud session, before any checker run (2026-10-01).
// Cloudflare may treat a cloud provider's network differently from a home connection. This probe asks dorar
// the eight questions whose answers we already know, through dorar.mjs exactly as the checker will, and says
// whether the path works from where it runs.
//   node cloud-probe.mjs            (from the tools folder; needs node 18+ and curl on PATH)
// Writes cloud-probe-report.json beside itself and prints one line per question and a verdict:
//   GO       — every query answered and the known permalink came back for at least 7 of 8
//   PARTIAL  — answers came back but some were blocked or missed: run the checker with fewer agents at once
//              (two or three), and expect some x_pending_lookup claims to re-run later in a browser
//   NO-GO    — every query blocked: do not run the hadith rung in the cloud; run it locally
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LEDGER = path.join(HERE, 'cloud-probe-ledger.jsonl');
const QUESTIONS = [
  { claim: '4-gN9WBQ_4Q#3', q: 'قال بلال أخذ بنفسي الذي أخذ بنفسك', expect: ['uA5QxD9J'] },
  { claim: '4-gN9WBQ_4Q#16', q: 'إذا أويت إلى فراشك فاقرأ آية الكرسي', expect: ['7uyVAFAJ', 'OoepGnas'] },
  { claim: '4-gN9WBQ_4Q#14', q: 'أوصاني خليلي بثلاث أوتر', expect: ['Ct62BcsJ', 'g8ZWRIRI'] },
  { claim: '4-gN9WBQ_4Q#15', q: 'من بات طاهرا بات في شعاره ملك', expect: ['OCJvpa9a'] },
  { claim: 'dx_P6i6IfSw#1', q: 'صيام يوم عاشوراء أحتسب على الله', expect: ['Yjk7gFh8'] },
  { claim: 'dx_P6i6IfSw#2', q: 'صيام يوم عرفة أحتسب على الله', expect: ['Yjk7gFh8'] },
  { claim: 'Q4AXCXJ3ppo#1', q: 'اقتنى كلبا إلا كلب صيد أو ماشية', expect: ['RYYNzrX1'] },
  { claim: 'Q4AXCXJ3ppo#10', q: 'بينما كلب يطيف بركية', expect: ['gnzn6z29'] },
];

const rows = [];
try { execFileSync('curl', ['--version'], { stdio: 'ignore' }); } catch { console.log('NO-GO: curl is not installed here; the tool needs it (node fetch is refused by dorar).'); process.exit(1); }
for (const x of QUESTIONS) {
  const t0 = Date.now();
  let out = '', code = 0;
  try { out = execFileSync('node', [path.join(HERE, 'dorar.mjs'), 'search', x.q, '--tag', 'probe:' + x.claim, '--ledger', LEDGER], { maxBuffer: 20 * 1024 * 1024 }).toString('utf8'); }
  catch (e) { code = e.status; out = String(e.stdout || ''); }
  const status = (out.match(/^STATUS (\w+)/m) || [])[1] || 'error';
  const tries = (out.match(/page \S+ in \d+ ms \((\d+) tries\)/) || [])[1] || '?';
  const found = x.expect.filter((id) => out.includes('/h/' + id));
  rows.push({ claim: x.claim, query: x.q, status, exit: code, pageTries: +tries || null, ms: Date.now() - t0, expected: x.expect, found });
  console.log(`${x.claim.padEnd(16)} ${status.padEnd(8)} ${String(Date.now() - t0).padStart(6)} ms  tries ${tries}  known link ${found.length ? 'FOUND ' + found.join(',') : 'missing'}`);
}
const blocked = rows.filter((r) => r.status === 'blocked').length;
const known = rows.filter((r) => r.found.length).length;
const verdict = blocked === rows.length ? 'NO-GO' : blocked === 0 && known >= 7 ? 'GO' : 'PARTIAL';
const report = { at: new Date().toISOString(), host: process.env.HOSTNAME || null, verdict, blocked, knownFound: known, of: rows.length, rows };
fs.writeFileSync(path.join(HERE, 'cloud-probe-report.json'), JSON.stringify(report, null, 1));
console.log(`\nVERDICT ${verdict}: ${known}/${rows.length} known links found, ${blocked} blocked. Report: cloud-probe-report.json`);

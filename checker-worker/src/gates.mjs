// The two automatic gates of the joined package, run on every result before the
// person sees it (the same scripts the library run had to pass):
//   check-dorar-links.mjs  no dorar link, grade or quote the dorar tool did not print
//   check-gradings.mjs     every hadith grade equals the dorar page it links to
// A part that fails a gate is never shown with its source: it becomes "pending"
// (level 0, no source), so nothing invented reaches the person.
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { PIPELINE } from './env.mjs';

function node(args, cwd) {
  return new Promise((resolve) => execFile(process.execPath, args, { cwd, maxBuffer: 16 * 1024 * 1024, timeout: 10 * 60 * 1000, windowsHide: true },
    (err, stdout, stderr) => resolve({ code: err ? (err.code ?? 1) : 0, out: String(stdout || '') + String(stderr || '') })));
}

export async function runGates(runDir, runFile, batchFiles, log) {
  const tools = path.join(PIPELINE, 'tools');
  const ledger = path.join(runDir, 'dorar-ledger.jsonl');
  if (!fs.existsSync(ledger)) fs.writeFileSync(ledger, '');
  const bad = new Map(); // "<vid>#<i>" -> Set of part positions ('*' = the whole claim)
  const mark = (tag, part) => { const s = bad.get(tag) || new Set(); s.add(part ?? '*'); bad.set(tag, s); };

  const a = await node([path.join(tools, 'check-dorar-links.mjs'), '--results', runFile, '--ledger', ledger,
    '--inputs', batchFiles.join(',')], runDir);
  log?.(`gate dorar-links exit ${a.code}\n${a.out.slice(-4000)}`);
  for (const m of a.out.matchAll(/^FAULT (\S+#\d+)(?: part (\d+))? (R\d)/gm)) {
    if (m[3] === 'R5') continue; // a pending part without a blocked entry is already pending
    mark(m[1], m[2] ? Number(m[2]) : null);
  }

  const report = path.join(runDir, 'gradings-report.json');
  const b = await node([path.join(tools, 'check-gradings.mjs'), runFile, report, '--cache', path.join(runDir, 'gradings-cache')], runDir);
  log?.(`gate gradings exit ${b.code}\n${b.out.slice(-2000)}`);
  if (fs.existsSync(report)) {
    const r = JSON.parse(fs.readFileSync(report, 'utf8'));
    for (const x of r.mismatch || []) {
      const m = /^(.+#\d+)\.(\d+)/.exec(String(x.id || ''));
      if (m) mark(m[1], Number(m[2]));
    }
  }
  return { dorarLinks: a.code, gradings: b.code, bad };
}

const ORDER = ['corrected', 'not_found', 'overstated', 'pending', 'not_checked', 'by_meaning', 'matches'];

// Applies the gate results to the workflow's return, in place.
export function applyGates(ret, bad) {
  let changed = 0;
  for (const v of ret.videos || []) {
    for (const c of v.result?.claims || []) {
      const s = bad.get(`${v.id}#${c.i}`);
      if (!s) continue;
      for (const p of c.parts || []) {
        if (s.has('*') || s.has(p.position)) {
          p.state = 'pending'; p.level = 0; p.source = null; p.gate_failed = true; changed++;
        }
      }
      const states = (c.parts || []).map((p) => p.state);
      c.state = ORDER.find((st) => states.includes(st)) || c.state;
    }
  }
  return changed;
}

// Listening: the same script the library run used (D:/Deeni/mobile/scripts/
// tag-with-gemini.ts, claims only, cut by source unit), on the clip's YouTube
// link, then the same batch builder (src/build-batch.mjs = the 5 Oct clip run's
// copy: the canonical verse text from quran.com, up to 30 verses a quote).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { DEENI, HERE } from './env.mjs';

const GEMINI_OUT = path.join(os.tmpdir(), 'deeni-gemini');
// Gemini Flash list price is well under $1 per million tokens; counted at $1 so the budget errs high.
const GEMINI_USD_PER_MTOK = 1;
// 3.6 first: on 5 Oct evening 3.7 hung for 4 minutes before answering busy, 3.6 answered. Never a lite model (they under-extract).
const MODELS = 'gemini-3.6-flash,gemini-3.7-flash,gemini-3.8-flash,gemini-3.5-flash';

function run(cmd, args, opts) {
  return new Promise((resolve) => {
    execFile(cmd, args, { maxBuffer: 32 * 1024 * 1024, windowsHide: true, ...opts }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code ?? 1) : 0, stdout: String(stdout || ''), stderr: String(stderr || ''), err });
    });
  });
}

// -> { ok: true, result, file, usd } | { ok: false, why }
export async function listen(youtubeId, log) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) return { ok: false, why: 'bad id' };
  const file = path.join(GEMINI_OUT, `result-${youtubeId}.json`);
  try { fs.unlinkSync(file); } catch { /* none yet */ }
  // Gemini answers "busy" at times (5 Oct evening: three models in a row); the script already
  // rotates models, and the whole listen is tried up to three times, a minute apart.
  let r;
  for (let attempt = 1; attempt <= 3 && !fs.existsSync(file); attempt++) {
    if (attempt > 1) await new Promise((res) => setTimeout(res, 60000));
    // npx on Windows is a .cmd: it needs a shell; the id was checked above, so nothing else reaches the command line.
    r = await run(`npx tsx mobile/scripts/tag-with-gemini.ts ${youtubeId} --claims-only --models=${MODELS}`, [], {
      cwd: DEENI, shell: true, timeout: 9 * 60 * 1000,
    });
    log?.(`listen attempt ${attempt} exit ${r.code}\n${r.stdout.slice(-1500)}\n${r.stderr.slice(-800)}`);
  }
  if (!fs.existsSync(file)) return { ok: false, why: `no listen result (exit ${r?.code})` };
  const result = JSON.parse(fs.readFileSync(file, 'utf8'));
  const usd = ((result.tokens || 0) * GEMINI_USD_PER_MTOK) / 1e6;
  return { ok: true, result, file, usd };
}

// -> the batch object (title, speaker, claims with i, kind, timestamp, quote, ..., verse_text)
export async function buildBatch(runDir, listenFile, speaker, log) {
  const r = await run(process.execPath, [path.join(HERE, 'src', 'build-batch.mjs'), runDir, speaker || 'unknown', 'creator', listenFile], {
    cwd: runDir, timeout: 3 * 60 * 1000,
  });
  log?.(`batch exit ${r.code}\n${r.stdout}\n${r.stderr.slice(-1000)}`);
  const id = path.basename(listenFile).replace(/^result-|\.json$/g, '');
  const bf = path.join(runDir, `batch-${id}.json`);
  if (!fs.existsSync(bf)) throw new Error(`build-batch wrote no batch (exit ${r.code})`);
  return { file: `batch-${id}.json`, batch: JSON.parse(fs.readFileSync(bf, 'utf8')) };
}

export function timeToSeconds(t) {
  if (t == null || t === '') return null;
  if (typeof t === 'number') return t;
  const parts = String(t).split(':').map(Number);
  if (parts.some((x) => Number.isNaN(x))) return null;
  return parts.reduce((a, b) => a * 60 + b, 0);
}

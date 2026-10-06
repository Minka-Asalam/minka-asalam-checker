// One check, start to finish, in the order the person sees it:
//   1 YouTube's data service: the clip exists, is public, is at most 3 minutes  (free, seconds)
//   2 gate 1: is it Islamic content? only "no" is refused, not counted             (~0.1¢, seconds)
//   3 the listen (Gemini), cut by source unit                                       (~5¢, about a minute)
//   4 gate 2: nothing quotable -> stop here                                         (instant)
//   5 the engine: Checker 2 (checker + sceptic), or Checker 3 when switched on     (minutes; most of the money)
//   6 the two automatic gates (dorar links, gradings against their page)          (a minute)
//   7 the counts and rows                                                           (instant)
import fs from 'node:fs';
import path from 'node:path';
import { RUNS } from './env.mjs';
import { Spend } from './claude.mjs';
import { clipInfo } from './youtube.mjs';
import { gate1 } from './gate1.mjs';
import { listen, buildBatch, timeToSeconds } from './listen.mjs';
import { runChecker2 } from './checker2.mjs';
import { runGates, applyGates } from './gates.mjs';
import { buildResult } from './result.mjs';

export const MAX_SECONDS = 180;
// The most one check may spend (owner, 6 Oct). Set CHECKER_CAP_USD in .env to change it.
export const CAP_USD = Number(process.env.CHECKER_CAP_USD || 1.0);
const SLACK = 5; // YouTube rounds; a "3:00" clip may report 181 s

// progress({ step, done, total, result? }) — result = the rows found so far, while the check runs; log(text)
// source 'youtube' takes youtubeId; source 'file' takes file = { url (short-lived link), mime, name, seconds }.
// -> { status: 'done'|'refused'|'failed', refusal, counted, result, costUsd, info }
export async function runCheck({ runId, source = 'youtube', youtubeId, file, engine = 'checker2', rulesVersion = '1', progress, log }) {
  const spend = new Spend();
  const runDir = path.join(RUNS, `${new Date().toISOString().slice(0, 10)}_${runId || youtubeId}`);
  fs.mkdirSync(runDir, { recursive: true });
  const logFile = path.join(runDir, 'worker.log');
  const say = (t) => { fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${t}\n`); log?.(t); };
  const out = (o) => { say(`end: ${o.status} ${o.refusal || ''} cost $${spend.usd.toFixed(4)}`); return { ...o, costUsd: spend.usd, spend }; };

  // A CLIP FROM THE PHONE (owner, 6 Oct): no YouTube metadata, so no gate 1 (the plan of 3 Oct: "unclear and
  // every file go on to the listen"); Gemini reads the file through a short-lived link; its length is checked
  // again after listening, from the moments it heard.
  if (source === 'file') return runFileCheck();

  let info;
  try {
    info = await clipInfo(youtubeId);
  } catch (e) {
    say(`youtube data service failed: ${e.message}`);
    return out({ status: 'failed', refusal: 'failed', counted: false });
  }
  if (!info.ok || info.live) return out({ status: 'refused', refusal: 'unreadable', counted: false, info });
  const base = { info: { title: info.title, channelTitle: info.channelTitle, seconds: info.seconds } };
  if (info.seconds == null || info.seconds > MAX_SECONDS + SLACK) return out({ status: 'refused', refusal: 'too_long', counted: false, ...base });

  progress?.({ step: 'gate1' });
  const g1 = await gate1(info, spend);
  say(`gate 1: ${g1.answer} (${g1.why})`);
  if (g1.answer === 'no') return out({ status: 'refused', refusal: 'not_islamic', counted: false, ...base });

  progress?.({ step: 'listen' });
  const heard = await listen(youtubeId, say);
  if (!heard.ok) { say(`listen failed: ${heard.why}`); return out({ status: 'failed', refusal: 'failed', counted: false, ...base }); }
  return afterListen(heard, info.channelTitle, base);

  async function runFileCheck() {
    const fbase = { info: { title: file?.name || null, channelTitle: null, seconds: file?.seconds ?? null } };
    if (!file?.url) return out({ status: 'failed', refusal: 'file_unreadable', counted: false, ...fbase });
    progress?.({ step: 'listen' });
    const heard = await listen({ remoteId: String(runId).replace(/[^A-Za-z0-9_-]/g, ''), url: file.url, mime: file.mime }, say);
    if (!heard.ok) {
      say(`listen failed on the file: ${heard.why}`);
      // A spent Google quota is not the file's fault: "failed" (not counted, Try again), not "unreadable".
      if (heard.quota) return out({ status: 'failed', refusal: 'failed', counted: false, ...fbase });
      return out({ status: 'refused', refusal: 'file_unreadable', counted: false, ...fbase });
    }
    const heardSeconds = Math.max(0, ...(heard.result.claims || []).flatMap((c) => [timeToSeconds(c.timestamp_end), timeToSeconds(c.timestamp)]).filter((x) => x != null));
    if (heardSeconds > MAX_SECONDS + 10) { spend.addUsd('gemini', heard.usd); say(`the file runs past 3 minutes (a quote at ${heardSeconds}s)`); return out({ status: 'refused', refusal: 'too_long', counted: false, ...fbase }); }
    return afterListen(heard, null, fbase);
  }

  async function afterListen(heard, speaker, base) {
  spend.addUsd('gemini', heard.usd);
  const { file: batchFile, batch } = await buildBatch(runDir, heard.file, speaker, say);
  const quotable = (batch.claims || []).length;
  say(`listen: ${quotable} quotes (${(batch.claims || []).map((c) => c.kind).join(', ')})`);
  if (!quotable) return out({ status: 'refused', refusal: 'nothing_to_check', counted: false, ...base });

  progress?.({ step: 'checking', done: 0, total: quotable });
  let ret;
  if (engine === 'checker3') {
    const { runChecker3 } = await import('./checker3.mjs');
    ret = await runChecker3(runDir, batchFile, batch, { spend, log: say, capUsd: CAP_USD, onProgress: (d, claimsSoFar) => progress?.({ step: 'checking', done: d, total: quotable, result: claimsSoFar ? buildResult({ ret: { videos: [{ result: { claims: claimsSoFar } }] }, batch, engine, rulesVersion }) : undefined }), onPhase: (p) => { if (p === 'Verify') progress?.({ step: 'second_look' }); } });
  } else {
    ret = await runChecker2(runDir, [{ id: batch.id, file: batchFile }], {
      spend, log: say, capUsd: CAP_USD,
      onPhase: (p) => { if (p === 'Verify') progress?.({ step: 'second_look' }); },
    });
  }
  if (!ret?.videos?.[0]?.result?.claims?.length) { say('the engine returned no result'); return out({ status: 'failed', refusal: 'failed', counted: false, ...base }); }

  const runFile = path.join(runDir, 'run.json');
  fs.writeFileSync(runFile, JSON.stringify(ret, null, 1));
  const g = await runGates(runDir, runFile, [path.join(runDir, batchFile)], say);
  const changed = applyGates(ret, g.bad);
  say(`gates: dorar-links ${g.dorarLinks}, gradings ${g.gradings}; ${changed} part(s) set to pending`);
  fs.writeFileSync(path.join(runDir, 'run-gated.json'), JSON.stringify(ret, null, 1));

  const result = buildResult({ ret, batch, engine, rulesVersion });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(result, null, 1));
  say(`spend by model: ${JSON.stringify(spend.byModel)} tokens ${JSON.stringify(spend.tokens)}`);
  return out({ status: 'done', refusal: null, counted: true, result, ...base });
  }
}

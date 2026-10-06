// The Checker worker: runs on the owner's PC (dorar answers only a home line).
// It only reaches OUT: every few seconds it asks the database for the oldest
// waiting check, runs it, and writes the result back. Nothing on the PC is
// opened to the internet. While the PC is off, checks simply wait.
//   node src/worker.mjs            (keep it running; see README for starting it with Windows)
import os from 'node:os';
import { createClient } from '@supabase/supabase-js';
import { need } from './env.mjs';
import { runCheck } from './run-check.mjs';

const VERSION = 'worker-2 (6 Oct 2026: files, live rows, notification)';
// Checker 3 since 6 Oct ~01:45 (the owner's 09:00 safety line passed: 31/31 verses and 11/11 hadith as in his review, 0 wrong hadith).
const ENGINE = process.env.CHECKER_ENGINE || 'checker3';
const POLL_MS = 5000;
const BEAT_MS = 60000;

const db = createClient(need('SUPABASE_URL'), need('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const say = (t) => console.log(`${stamp()}  ${t}`);

async function beat() {
  const { error } = await db.rpc('checker_heartbeat', { p_version: `${VERSION} · ${ENGINE} · ${os.hostname()}` });
  if (error) say(`heartbeat failed: ${error.message}`);
}

async function note(runId, text) {
  await db.from('checker_run_logs').insert({ run_id: runId, note: String(text).slice(0, 20000) });
}

async function update(runId, fields) {
  const { error } = await db.from('checker_runs').update(fields).eq('id', runId);
  if (error) say(`update failed for ${runId}: ${error.message}`);
}

async function settings() {
  const { data } = await db.from('checker_settings').select('rules_version').eq('id', true).maybeSingle();
  return { rulesVersion: data?.rules_version || '1' };
}

// A check left "running" by a crash or a restart goes back to the queue.
async function recover() {
  const { data, error } = await db.from('checker_runs').update({ status: 'waiting', step: null, step_done: null, step_total: null, started_at: null })
    .eq('status', 'running').select('id');
  if (error) say(`recover failed: ${error.message}`);
  else if (data?.length) say(`put ${data.length} interrupted check(s) back in the queue`);
}

const BUCKET = 'checker-uploads';
const mimeOf = (p) => ({ mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', '3gp': 'video/3gpp', mkv: 'video/x-matroska', m4v: 'video/x-m4v' })[String(p).split('.').pop().toLowerCase()] || 'video/mp4';

async function removeFile(path) {
  if (!path) return;
  const { error } = await db.storage.from(BUCKET).remove([path]);
  if (error) say(`could not delete ${path}: ${error.message}`);
}

// Files nobody is checking any more (an upload whose request was refused, a crash): deleted after a day.
async function sweepUploads() {
  const { data: folders } = await db.storage.from(BUCKET).list('', { limit: 1000 });
  const { data: active } = await db.from('checker_runs').select('file_path').in('status', ['waiting', 'running']).not('file_path', 'is', null);
  const keep = new Set((active || []).map((r) => r.file_path));
  const dayAgo = Date.now() - 24 * 3600 * 1000;
  for (const f of folders || []) {
    const { data: files } = await db.storage.from(BUCKET).list(f.name, { limit: 1000 });
    const old = (files || []).filter((x) => x.created_at && Date.parse(x.created_at) < dayAgo).map((x) => `${f.name}/${x.name}`).filter((p) => !keep.has(p));
    if (old.length) { await db.storage.from(BUCKET).remove(old); say(`swept ${old.length} old upload(s)`); }
  }
}

async function handle(run) {
  say(`check ${run.id}: ${run.source === 'file' ? `file ${run.file_name || run.file_path}` : `youtube ${run.youtube_id}`}`);
  const { rulesVersion } = await settings();
  let file = null;
  if (run.source === 'file') {
    // a link to the uploaded clip that Gemini can read for the next half hour
    const { data, error } = await db.storage.from(BUCKET).createSignedUrl(run.file_path, 1800);
    file = { url: error ? null : data?.signedUrl, mime: mimeOf(run.file_path), name: run.file_name, seconds: run.duration_seconds };
    if (error) say(`could not sign ${run.file_path}: ${error.message}`);
  }
  let r;
  try {
    r = await runCheck({
      runId: run.id, source: run.source || 'youtube', youtubeId: run.youtube_id, file, engine: ENGINE, rulesVersion,
      progress: (p) => update(run.id, { step: p.step, step_done: p.done ?? null, step_total: p.total ?? null, ...(p.result ? { result: p.result } : {}) }),
      log: (t) => { say(`  ${String(t).split('\n')[0].slice(0, 200)}`); note(run.id, t).catch(() => {}); },
    });
  } catch (e) {
    say(`check ${run.id} crashed: ${e?.stack || e}`);
    await note(run.id, `crash: ${e?.stack || e}`);
    await update(run.id, { status: 'failed', refusal: 'failed', counted: false, finished_at: new Date().toISOString() });
    await removeFile(run.file_path);
    return;
  }
  await update(run.id, {
    status: r.status,
    refusal: r.refusal,
    counted: r.counted,
    result: r.result ?? null,
    engine: r.result ? ENGINE : null,
    rules_version: r.result ? rulesVersion : null,
    title: r.info?.title ?? run.title ?? null,
    channel_title: r.info?.channelTitle ?? null,
    duration_seconds: r.info?.seconds ?? run.duration_seconds ?? null,
    cost_usd: Number((r.costUsd || 0).toFixed(4)),
    step: null,
    finished_at: new Date().toISOString(),
  });
  say(`check ${run.id}: ${r.status}${r.refusal ? ` (${r.refusal})` : ''}, ${(r.costUsd || 0).toFixed(3)}`);
  await removeFile(run.file_path); // the clip is deleted when its check ends (the owner's privacy rule)
  // "your result is ready" (in the app and as a push) for a finished check, or one that found nothing to look up
  if (r.status === 'done' || r.refusal === 'nothing_to_check') {
    const { error } = await db.rpc('checker_notify_done', { p_run: run.id });
    if (error) say(`notify failed: ${error.message}`);
  }
}

say(`Checker worker starting: ${VERSION}, engine ${ENGINE}`);
await beat();
await recover();
setInterval(() => { beat().catch((e) => say(`heartbeat error: ${e.message}`)); }, BEAT_MS);
setInterval(() => { sweepUploads().catch((e) => say(`sweep error: ${e.message}`)); }, 3600 * 1000);
sweepUploads().catch((e) => say(`sweep error: ${e.message}`));

for (;;) {
  try {
    const { data, error } = await db.rpc('checker_claim_next');
    if (error) { say(`claim failed: ${error.message}`); await new Promise((r) => setTimeout(r, POLL_MS * 4)); continue; }
    const run = Array.isArray(data) ? data[0] : data;
    if (run?.id) { await handle(run); continue; }
  } catch (e) {
    say(`loop error: ${e?.message || e}`);
  }
  await new Promise((r) => setTimeout(r, POLL_MS));
}

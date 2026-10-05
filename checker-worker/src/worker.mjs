// The Checker worker: runs on the owner's PC (dorar answers only a home line).
// It only reaches OUT: every few seconds it asks the database for the oldest
// waiting check, runs it, and writes the result back. Nothing on the PC is
// opened to the internet. While the PC is off, checks simply wait.
//   node src/worker.mjs            (keep it running; see README for starting it with Windows)
import os from 'node:os';
import { createClient } from '@supabase/supabase-js';
import { need } from './env.mjs';
import { runCheck } from './run-check.mjs';

const VERSION = 'worker-1 (5 Oct 2026)';
const ENGINE = process.env.CHECKER_ENGINE || 'checker2';
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

async function handle(run) {
  say(`check ${run.id}: youtube ${run.youtube_id}`);
  const { rulesVersion } = await settings();
  let r;
  try {
    r = await runCheck({
      runId: run.id, youtubeId: run.youtube_id, engine: ENGINE, rulesVersion,
      progress: (p) => update(run.id, { step: p.step, step_done: p.done ?? null, step_total: p.total ?? null }),
      log: (t) => { say(`  ${String(t).split('\n')[0].slice(0, 200)}`); note(run.id, t).catch(() => {}); },
    });
  } catch (e) {
    say(`check ${run.id} crashed: ${e?.stack || e}`);
    await note(run.id, `crash: ${e?.stack || e}`);
    await update(run.id, { status: 'failed', refusal: 'failed', counted: false, finished_at: new Date().toISOString() });
    return;
  }
  await update(run.id, {
    status: r.status,
    refusal: r.refusal,
    counted: r.counted,
    result: r.result ?? null,
    engine: r.result ? ENGINE : null,
    rules_version: r.result ? rulesVersion : null,
    title: r.info?.title ?? null,
    channel_title: r.info?.channelTitle ?? null,
    duration_seconds: r.info?.seconds ?? null,
    cost_usd: Number((r.costUsd || 0).toFixed(4)),
    step: null,
    finished_at: new Date().toISOString(),
  });
  say(`check ${run.id}: ${r.status}${r.refusal ? ` (${r.refusal})` : ''}, $${(r.costUsd || 0).toFixed(3)}`);
}

say(`Checker worker starting: ${VERSION}, engine ${ENGINE}`);
await beat();
await recover();
setInterval(() => { beat().catch((e) => say(`heartbeat error: ${e.message}`)); }, BEAT_MS);

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

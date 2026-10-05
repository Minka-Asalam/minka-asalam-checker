// Checker 2 (the 2 Oct joined package, the one all 27 library clips ran on 5 Oct)
// on one clip, run from its OWN workflow script, unchanged: pipeline/
// claims-workflow-v2.js is executed here with a stand-in for the Claude Code
// workflow globals, so the checker's and the sceptic's prompts, the rules and
// the output schema are exactly the reviewed ones. Only the way a helper runs
// differs: src/agent.mjs (the API, fixed tools, no shell) instead of a session.
import fs from 'node:fs';
import path from 'node:path';
import { PIPELINE } from './env.mjs';
import { runAgent } from './agent.mjs';

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const fwd = (p) => p.split(path.sep).join('/');

let compiled;
function workflow() {
  if (!compiled) {
    const src = fs.readFileSync(path.join(PIPELINE, 'claims-workflow-v2.js'), 'utf8').replace(/^export const meta/m, 'const meta');
    compiled = new AsyncFunction('args', 'agent', 'pipeline', 'phase', 'log', src);
  }
  return compiled;
}

// Copies the sheets the prompts read (model.md, works.md, flow-*.md) into the check's folder.
export function prepareRunDir(runDir) {
  for (const f of fs.readdirSync(path.join(PIPELINE, 'sheets'))) fs.copyFileSync(path.join(PIPELINE, 'sheets', f), path.join(runDir, f));
  fs.mkdirSync(path.join(runDir, 'scratch'), { recursive: true });
}

// videos: [{ id, file }] (batch files inside runDir). onPhase(name) reports progress.
export async function runChecker2(runDir, videos, { spend, log, onPhase, poetryTool } = {}) {
  prepareRunDir(runDir);
  const ctx = {
    dir: runDir,
    tools: path.join(PIPELINE, 'tools'),
    scratch: path.join(runDir, 'scratch'),
    ledger: path.join(runDir, 'dorar-ledger.jsonl'),
    poetryTool,
  };
  const args = { dir: fwd(runDir), tools: fwd(ctx.tools), videos, bookTool: 'usul-online.mjs', scratch: fwd(ctx.scratch) };
  const agent = (prompt, opts = {}) => {
    onPhase?.(opts.phase || 'Check');
    return runAgent(prompt, { schema: opts.schema, effort: opts.effort || 'high', label: opts.label, ctx, spend, log });
  };
  const pipeline = (items, ...stages) => Promise.all(items.map(async (v) => {
    let out = v, first = true;
    for (const st of stages) { out = first ? await st(v) : await st(out, v); first = false; }
    return out;
  }));
  const ret = await workflow()(args, agent, pipeline, (p) => onPhase?.(p), (m) => log?.(String(m)));
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(ret, null, 1));
  return ret; // { videos: [{ id, result, checkedRaw }] }
}

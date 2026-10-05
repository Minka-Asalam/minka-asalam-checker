// One checking helper (Checker 2's checker or sceptic), run directly on the
// Anthropic API instead of inside a Claude Code session.
//
// SAFETY: the helper gets NO shell on this PC. A clip's words are untrusted
// (anyone can upload anything), so the helper may only:
//   read_file   a file inside this check's own folder
//   write_file  a file inside this check's scratch folder
//   run_tool    one of the checker's own Node tools, with plain arguments
//               (no shell: the arguments are passed as a list)
//   http_get    a page on the trusted source sites below
//   web_search  Anthropic's server-side search (runs on Anthropic's side)
//   submit_result  the final answer, once
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { anthropic, MODELS } from './claude.mjs';

const TOOLS_ALLOWED = ['continuation.mjs', 'usul-online.mjs', 'shamela.mjs', 'dorar.mjs', 'hadith-tiers.mjs', 'poetry.mjs'];
const HOSTS = ['api.usul.ai', 'usul.ai', 'shamela.ws', 'api.quran.com', 'quran.com', 'islamweb.net', 'www.islamweb.net',
  'islamqa.info', 'dar-alifta.org', 'www.dar-alifta.org', 'binbaz.org.sa', 'www.alifta.gov.sa', 'alifta.gov.sa',
  'www.aldiwan.net', 'aldiwan.net', 'dorar.net'];
const MAX_OUT = 24000;
const MAX_TURNS = 150;

const clip = (s) => (s.length <= MAX_OUT ? s : `${s.slice(0, MAX_OUT * 0.7)}\n…[${s.length - MAX_OUT} characters cut]…\n${s.slice(-MAX_OUT * 0.3)}`);
const inside = (dir, p) => { const r = path.resolve(p); const d = path.resolve(dir); return r === d || r.startsWith(d + path.sep); };

function runNode(file, args, opts) {
  return new Promise((resolve) => {
    execFile(process.execPath, [file, ...args], { maxBuffer: 16 * 1024 * 1024, windowsHide: true, timeout: 180000, ...opts },
      (err, stdout, stderr) => resolve(`${stdout || ''}${stderr ? `\n[stderr]\n${stderr}` : ''}${err && err.killed ? '\n[timed out]' : err ? `\n[exit ${err.code}]` : ''}`));
  });
}

function htmlToText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/h\d>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

const PREAMBLE = (ctx) => `You are running inside the Minka Asalam Checker worker, through the API. You have NO shell. The task text below was written for a shell; translate it like this:
- Wherever it says run: node "<some path>/<name>.mjs" <arguments>, call the run_tool tool with tool = "<name>.mjs" and args = the arguments as a list of plain strings (no quotes, no shell syntax). An argument of the form @<file> must name a file inside ${ctx.scratch}.
- Wherever it says to read a file, call read_file with its path. Write files only with write_file, only inside ${ctx.scratch}.
- Wherever it says curl a URL, call http_get with the URL (plain Arabic in the query is fine; it is encoded for you). Wherever it says WebSearch, use web_search.
- node -e encodeURIComponent is not needed: http_get encodes.
- The tools folder is ${ctx.tools}. The check's folder is ${ctx.dir}.
When you are finished, call submit_result exactly once with the final JSON object. Do not write the result as text.`;

export async function runAgent(prompt, { schema, effort = 'high', label = 'agent', ctx, spend, log }) {
  const client = anthropic();
  const tools = [
    { name: 'read_file', description: 'Read a text file inside the check folder.', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
    { name: 'write_file', description: 'Write a text file inside the scratch folder.', input_schema: { type: 'object', properties: { path: { type: 'string' }, text: { type: 'string' } }, required: ['path', 'text'] } },
    { name: 'run_tool', description: `Run one of the checker's Node tools with plain arguments. Allowed: ${TOOLS_ALLOWED.join(', ')}.`, input_schema: { type: 'object', properties: { tool: { type: 'string', enum: TOOLS_ALLOWED }, args: { type: 'array', items: { type: 'string' } } }, required: ['tool', 'args'] } },
    { name: 'http_get', description: `GET a page or API answer from a trusted source site (${HOSTS.join(', ')}). HTML is returned as plain text.`, input_schema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
    { type: 'web_search_20260209', name: 'web_search', max_uses: 12 },
    { name: 'submit_result', description: 'Submit the final result object. Call exactly once, at the end.', input_schema: schema },
  ];
  const messages = [{ role: 'user', content: prompt }];
  const system = PREAMBLE(ctx);

  async function call(tool) {
    const a = tool.input || {};
    try {
      if (tool.name === 'read_file') {
        if (!inside(ctx.dir, a.path)) return 'refused: only files inside the check folder can be read';
        return clip(fs.readFileSync(a.path, 'utf8'));
      }
      if (tool.name === 'write_file') {
        if (!inside(ctx.scratch, a.path)) return `refused: write only inside ${ctx.scratch}`;
        fs.mkdirSync(path.dirname(a.path), { recursive: true });
        fs.writeFileSync(a.path, String(a.text ?? ''), 'utf8');
        return 'written';
      }
      if (tool.name === 'run_tool') {
        if (!TOOLS_ALLOWED.includes(a.tool)) return 'refused: unknown tool';
        const args = (Array.isArray(a.args) ? a.args : []).map(String);
        for (const x of args) if (x.startsWith('@') && !inside(ctx.scratch, x.slice(1))) return `refused: @files must be inside ${ctx.scratch}`;
        const file = a.tool === 'poetry.mjs' ? ctx.poetryTool : path.join(ctx.tools, a.tool);
        if (!file) return 'refused: tool not available';
        return clip(await runNode(file, args, { cwd: ctx.dir, env: { ...process.env, DORAR_LEDGER: ctx.ledger } }));
      }
      if (tool.name === 'http_get') {
        const u = new URL(a.url);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return 'refused: not a web address';
        if (!HOSTS.includes(u.hostname)) return `refused: ${u.hostname} is not on the trusted list`;
        const res = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' }, signal: AbortSignal.timeout(60000) });
        const text = await res.text();
        const body = /html/i.test(res.headers.get('content-type') || '') ? htmlToText(text) : text;
        return clip(`[HTTP ${res.status}]\n${body}`);
      }
      return 'refused: unknown tool';
    } catch (e) {
      return `error: ${String(e?.message || e).slice(0, 500)}`;
    }
  }

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const stream = client.messages.stream({
      model: MODELS.opus,
      max_tokens: 32000,
      system,
      tools,
      messages,
      output_config: { effort },
      cache_control: { type: 'ephemeral' },
    });
    const res = await stream.finalMessage();
    spend?.add(MODELS.opus, res.usage);
    messages.push({ role: 'assistant', content: res.content });
    if (res.stop_reason === 'refusal') { log?.(`${label}: refusal`); return null; }
    if (res.stop_reason === 'pause_turn') continue;
    const uses = res.content.filter((b) => b.type === 'tool_use');
    const submit = uses.find((b) => b.name === 'submit_result');
    if (submit) { log?.(`${label}: submitted after ${turn + 1} turns`); return submit.input; }
    if (!uses.length) {
      if (res.stop_reason === 'max_tokens') { messages.push({ role: 'user', content: 'Continue. When finished, call submit_result.' }); continue; }
      messages.push({ role: 'user', content: 'Call submit_result now with the final JSON object.' });
      continue;
    }
    const results = await Promise.all(uses.map(async (u) => ({ type: 'tool_result', tool_use_id: u.id, content: await call(u) })));
    messages.push({ role: 'user', content: results });
  }
  log?.(`${label}: no result after ${MAX_TURNS} turns`);
  return null;
}

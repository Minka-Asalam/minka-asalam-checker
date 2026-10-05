// One Anthropic client for the worker, and the money it spends.
// Prices in USD per million tokens (Anthropic's list prices, read 5 Oct 2026).
// Cache reads are counted at a tenth of the input price and cache writes at
// 1.25x, rounding up where the price list is lower, so the budget errs high.
import Anthropic from '@anthropic-ai/sdk';
import { need } from './env.mjs';

export const MODELS = {
  opus: 'claude-opus-5-5',
  sonnet: 'claude-sonnet-5-5',
  haiku: 'claude-haiku-4-5',
};

const PRICE = {
  'claude-opus-5-5': { in: 4, out: 20 },
  'claude-sonnet-5-5': { in: 2, out: 10 },
  'claude-haiku-4-5': { in: 1, out: 5 },
};
const WEB_SEARCH_USD = 0.01; // $10 per 1,000 searches

let client;
export function anthropic() {
  if (!client) client = new Anthropic({ apiKey: need('ANTHROPIC_API_KEY'), maxRetries: 4, timeout: 15 * 60 * 1000 });
  return client;
}

// A running total for one check: add every response's usage to it.
export class Spend {
  constructor() { this.usd = 0; this.calls = 0; this.tokens = { in: 0, out: 0, cacheRead: 0, cacheWrite: 0 }; this.byModel = {}; }
  add(model, usage) {
    if (!usage) return;
    const p = PRICE[model] || PRICE['claude-opus-5-5'];
    const inT = usage.input_tokens || 0, outT = usage.output_tokens || 0;
    const cr = usage.cache_read_input_tokens || 0, cw = usage.cache_creation_input_tokens || 0;
    const searches = usage.server_tool_use?.web_search_requests || 0;
    const usd = (inT * p.in + outT * p.out + cr * p.in * 0.1 + cw * p.in * 1.25) / 1e6 + searches * WEB_SEARCH_USD;
    this.usd += usd; this.calls += 1;
    this.tokens.in += inT; this.tokens.out += outT; this.tokens.cacheRead += cr; this.tokens.cacheWrite += cw;
    this.byModel[model] = (this.byModel[model] || 0) + usd;
  }
  addUsd(label, usd) { this.usd += usd; this.byModel[label] = (this.byModel[label] || 0) + usd; }
}

// The first JSON object or array in a model's text answer.
export function parseJson(text) {
  if (!text) return null;
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(t); } catch { /* fall through */ }
  const start = t.search(/[[{]/);
  if (start < 0) return null;
  for (let end = t.length; end > start; end--) {
    const c = t[end - 1];
    if (c !== '}' && c !== ']') continue;
    try { return JSON.parse(t.slice(start, end)); } catch { /* keep shrinking */ }
  }
  return null;
}

// One small question, one JSON answer. Retries once when the answer is not JSON.
export async function askJson({ model, system, prompt, spend, maxTokens = 8000, effort }) {
  const req = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };
  if (system) req.system = system;
  if (model !== MODELS.haiku) req.output_config = { effort: effort || 'medium' };
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await anthropic().messages.create(req);
    spend?.add(model, res.usage);
    if (res.stop_reason === 'refusal') return null;
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    const json = parseJson(text);
    if (json) return json;
  }
  return null;
}

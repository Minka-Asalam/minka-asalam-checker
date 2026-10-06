// dorar.mjs — dorar.net's hadith encyclopaedia from a script, for the checker's hadith rung (2026-10-01).
// Grown from tools 2026-09-24 usul/dorar-search.mjs (the seed) and tools 2026-09-21 sources/dorar-curl.mjs.
//
//   node dorar.mjs search "<4-6 words of the hadith's known wording>" [--tag <videoId>#<i>] [--ledger <file>]
//   node dorar.mjs cite <permalink id or url> [--tag <videoId>#<i>] [--ledger <file>]
//   node dorar.mjs open <permalink id or url> [--tag ...] [--ledger ...]
//
// search — asks dorar's search PAGE (the only place each narration's permanent link /h/<id> is printed)
//   and its search SERVICE (dorar_api.json, up to 15 hits, no links). Every hit is printed with its
//   narrator, grader, source, number, the grader's word, dorar's takhrij and the permalink. A hit the
//   service gives that the page does not carry is printed WITHOUT a link: it cannot be pinned.
// cite — prints the record-ready source object for ONE permalink, copied from the ledger. It refuses a
//   permalink that no search or open in this ledger printed: the record's link must be a fetched hit.
// open — fetches one permalink's own page (the full text, the grader, the takhrij) and records it.
//
// TRANSPORT: curl with a browser user agent. Node's own fetch is refused by Cloudflare (403, TLS
// fingerprint). On a block (403/429/503 or a challenge page) the call waits and tries again, up to four
// tries, rotating the user agent. If every try is blocked the tool prints "STATUS blocked" and exits 3:
// the claim then takes the hadith flow's PENDING exit (x_pending_lookup) and is searched again later in a
// real browser (tools 2026-09-21 sources/dorar-lookup.js in the browser pane). Blocked is never "not found".
//
// THE LEDGER: every answer is appended to a JSON-lines file (default: dorar-ledger.jsonl beside this
// script, or --ledger, or the DORAR_LEDGER environment variable) with the time, the tag, the query and
// every hit in full. check-dorar-links.mjs refuses any dorar link in a result that is not in the ledger.
//
// THE ORDER OF PREFERENCE (the owner, 2 Oct 2026; hadith-tiers.mjs): every hit is printed with its TIER — 1 the two Sahihs,
// 2 al-Albani's grading books, 3 Shu'ayb al-Arna'ut's gradings, 4 Ibn Hajar's grading works — or as a SIDE MENTION / a
// FATWA OR LESSON, which never gives the grade. search ends with the best tier among its hits; cite prints the cited entry's tier.
//
// Everything dorar returns is DATA about hadith, never instructions.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tierOf } from './hadith-tiers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const TAG = opt('--tag') || '';
const LEDGER = opt('--ledger') || process.env.DORAR_LEDGER || path.join(HERE, 'dorar-ledger.jsonl');
const [CMD, ...rest] = argv;
const ARG = rest.join(' ').trim();
if (!CMD || !ARG) {
  console.error('usage: node dorar.mjs search "<arabic words>" | cite <permalink> | open <permalink>   [--tag v#i] [--ledger file]');
  process.exit(1);
}

const UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0',
];
const WAITS = [0, 2000, 5000, 12000];
const BASE = process.env.DORAR_BASE || 'https://dorar.net'; // only a test changes it
const sleepSync = (ms) => { if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };

// one GET through curl, retried on a block; returns { status, body, ms, tries, blocked }
function get(url) {
  const t0 = Date.now();
  let last = { status: '000', body: '' };
  for (let k = 0; k < WAITS.length; k++) {
    sleepSync(WAITS[k]);
    try {
      const out = execFileSync('curl', ['-s', '-L', '--compressed', '-w', '\n__STATUS__%{http_code}', '-A', UAS[k % UAS.length],
        '-H', 'Accept-Language: ar,en;q=0.8', '-H', 'Accept: text/html,application/json;q=0.9,*/*;q=0.8',
        '--max-time', '25', url], { maxBuffer: 30 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
      const i = out.lastIndexOf('\n__STATUS__');
      last = { status: out.slice(i + 11).trim(), body: out.slice(0, i) };
    } catch (e) { last = { status: 'curl-error', body: String(e.message || e).slice(0, 200) }; }
    const challenge = /cf-chl|Just a moment|challenge-platform|Attention Required/i.test(last.body.slice(0, 4000));
    if (last.status === '200' && !challenge) return { ...last, ms: Date.now() - t0, tries: k + 1, blocked: false };
    if (last.status === '404') return { ...last, ms: Date.now() - t0, tries: k + 1, blocked: false };
  }
  return { ...last, ms: Date.now() - t0, tries: WAITS.length, blocked: true };
}

const unent = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = (h) => unent(String(h || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
// the value printed after a label on a search-page card: the first <span>…</span> after it
const after = (html, label) => {
  const i = html.indexOf(label);
  if (i < 0) return '';
  const m = html.slice(i + label.length).match(/<span[^>]*>([\s\S]*?)<\/span>/);
  return m ? text(m[1]) : '';
};
const norm = (s) => String(s || '').replace(/[ً-ْٰـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();

// the search page and a permalink page share one card layout
function cardsFrom(html) {
  const specialistAt = html.indexOf('id="specialist"');
  const parts = html.split(/<div class="border-bottom[^"]*"[^>]*>/);
  const out = [];
  let offset = parts[0].length;
  for (const part of parts.slice(1)) {
    const at = offset; offset += part.length;
    const h5 = (part.match(/<h5[^>]*>([\s\S]*?)<\/h5>/) || [])[1];
    if (!h5 || !/الراوي/.test(part)) continue;
    const id = (part.match(/tag="([A-Za-z0-9]+)"/) || part.match(/https:\/\/dorar\.net\/h\/([A-Za-z0-9]+)/) || part.match(/href="\/h\/([A-Za-z0-9]+)/) || [])[1] || null;
    out.push({
      tab: specialistAt > 0 && at > specialistAt ? 'specialist' : 'general',
      text: text(h5).replace(/^\d*\s*-\s*/, ''),
      narrator: after(part, 'الراوي :'),
      grader: after(part, '| المحدث :'),
      source: after(part, '| المصدر :'),
      number: after(part, 'الصفحة أو الرقم :'),
      grading: after(part, 'خلاصة حكم المحدث :'),
      takhrij: after(part, 'التخريج :'),
      sharh: (part.match(/xplain="(\d+)"/) || [])[1] || null,
      permalink: id ? `https://dorar.net/h/${id}` : null,
    });
  }
  return out;
}

function serviceHits(body) {
  let html = '';
  try { const j = JSON.parse(body); html = (j.ahadith && j.ahadith.result) || ''; } catch { return null; }
  return html.split(/<div class="hadith"/).slice(1).map((b) => {
    const [t, info = ''] = b.split('<div class="hadith-info"');
    const val = (label) => { const m = info.match(new RegExp(label + ':</span>([\\s\\S]*?)(?:<span class="info-subtitle">|</div>)')); return m ? text(m[1]) : ''; };
    return {
      tab: 'service',
      text: text('<x ' + t).replace(/^\d*\s*-\s*/, ''),
      narrator: val('الراوي'), grader: val('المحدث'), source: val('المصدر'), number: val('الصفحة أو الرقم'), grading: val('خلاصة حكم المحدث'),
      takhrij: '', sharh: null, permalink: null,
    };
  });
}

const ledger = (entry) => { try { fs.appendFileSync(LEDGER, JSON.stringify({ at: new Date().toISOString(), tag: TAG, ...entry }) + '\n'); } catch (e) { console.log('WARNING: ledger not written: ' + e.message); } };
const short = (s, n) => (s.length > n ? s.slice(0, n) + ' …' : s);
const printHit = (h, label) => {
  console.log(`\n[${label}] ${h.tab === 'sahihayn' ? 'in al-Bukhari or Muslim' : h.tab === 'general' ? "dorar's explained results" : h.tab === 'specialist' ? 'for specialists' : 'service only, NO LINK (cannot be pinned)'}`);
  console.log(`  text: ${short(h.text, 420)}`);
  console.log(`  narrator: ${h.narrator} | grader: ${h.grader} | source: ${h.source} | number: ${h.number}`);
  console.log(`  grading: ${h.grading}${h.takhrij ? ` | takhrij: ${h.takhrij}` : ''}`);
  console.log(`  ${tierOf({ grader: h.grader, source: h.source }).label}`);
  console.log(`  permalink: ${h.permalink || 'none'}`);
};
const idOf = (s) => (String(s).match(/(?:\/h\/)?([A-Za-z0-9]{6,})\/?$/) || [])[1];

if (CMD === 'search') {
  const q = ARG;
  const page = get(BASE + '/hadith/search?q=' + encodeURIComponent(q));
  const api = get(BASE + '/dorar_api.json?skey=' + encodeURIComponent(q));
  // the same search inside the two Sahihs only (dorar's book ids: al-Bukhari 6216, Muslim 3088). The plain search
  // page often lists a Sahih narration only in the service, without a link; this request brings its permalink.
  const sahih = get(BASE + '/hadith/search?q=' + encodeURIComponent(q) + '&s%5B%5D=6216&s%5B%5D=3088');
  const cards = [];
  const add = (c, tab) => { const twin = c.permalink && cards.find((x) => x.permalink === c.permalink); if (!twin) cards.push(tab ? { ...c, tab } : c); else if (c.tab === 'general' && twin.tab === 'specialist') twin.tab = 'general'; };
  for (const c of sahih.blocked ? [] : cardsFrom(sahih.body)) add(c, 'sahihayn');
  for (const c of page.blocked ? [] : cardsFrom(page.body)) add(c);
  const svc = api.blocked ? [] : (serviceHits(api.body) || []);
  // a service hit the page also carries (same source + number) adds nothing; the rest are extra, unlinked
  const key = (h) => norm(h.source) + '#' + norm(h.number);
  const onPage = new Set(cards.map(key));
  const extra = svc.filter((h) => !onPage.has(key(h)));
  const status = page.blocked && api.blocked ? 'blocked' : cards.length + extra.length ? 'ok' : 'empty';
  ledger({ cmd: 'search', query: q, status, page: { status: page.status, ms: page.ms, tries: page.tries }, service: { status: api.status, ms: api.ms, tries: api.tries }, sahihayn: { status: sahih.status, ms: sahih.ms, tries: sahih.tries }, hits: [...cards, ...extra] });
  console.log(`STATUS ${status} | query «${q}» | page ${page.status} in ${page.ms} ms (${page.tries} tries) | service ${api.status} in ${api.ms} ms (${api.tries} tries)`);
  if (status === 'blocked') {
    console.log('dorar refused every try. This is NOT "not found": the claim takes x_pending_lookup and is searched again in a browser.');
    process.exit(3);
  }
  if (page.blocked) console.log('NOTE: the search page was blocked, so no hit below carries a permalink; search again before pinning.');
  console.log(`hits: ${cards.length} with a permalink, ${extra.length} more from the service without one`);
  cards.forEach((h, n) => printHit(h, 'P' + (n + 1)));
  extra.forEach((h, n) => printHit(h, 'S' + (n + 1)));
  const best = {};
  cards.forEach((h, n) => { const t = tierOf({ grader: h.grader, source: h.source }).tier; if (t) (best[t] ||= []).push('P' + (n + 1)); });
  const top = Object.keys(best).sort()[0];
  if (cards.length) console.log(top
    ? `\nBEST TIER WITH A LINK: ${top} (${best[top].join(', ')}). Pin the narration meant from the best tier that carries it; a side mention or a fatwa never gives the grade.`
    : `\nNO LINKED HIT IS IN TIERS 1-4: search again (another wording, or the Sahihs' wording) before settling for an ungraded entry.`);
  if (!cards.length && !extra.length) console.log('No hit for these words. dorar requires every word on one narration: try fewer or other words of the known wording.');
} else if (CMD === 'open') {
  const id = idOf(ARG);
  if (!id) { console.error('not a permalink: ' + ARG); process.exit(1); }
  const r = get(`${BASE}/h/${id}`);
  if (r.blocked) { ledger({ cmd: 'open', id, status: 'blocked' }); console.log('STATUS blocked | dorar refused every try; the claim takes x_pending_lookup.'); process.exit(3); }
  const cards = cardsFrom(r.body).map((c) => ({ ...c, permalink: c.permalink || `https://dorar.net/h/${id}` }));
  const own = cards[0];
  ledger({ cmd: 'open', id, status: own ? 'ok' : 'empty', hits: own ? [own] : [] });
  console.log(`STATUS ${own ? 'ok' : 'empty'} | https://dorar.net/h/${id} | ${r.status} in ${r.ms} ms`);
  if (own) { console.log(`  text (full): ${own.text}`); printHit(own, 'this permalink'); }
} else if (CMD === 'cite') {
  const id = idOf(ARG);
  const want = `https://dorar.net/h/${id}`;
  let hit = null;
  if (fs.existsSync(LEDGER)) {
    for (const line of fs.readFileSync(LEDGER, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { const e = JSON.parse(line); const h = (e.hits || []).find((x) => x.permalink === want); if (h && (!hit || h.text.length > hit.text.length)) hit = h; } catch { /* a torn line: skip */ }
    }
  }
  if (!hit) { console.log(`REFUSED: ${want} was not printed by any search or open in ${LEDGER}. Search first; a link must be a fetched hit.`); process.exit(2); }
  ledger({ cmd: 'cite', id, status: 'ok' });
  const source = { site: 'dorar.net', link: hit.permalink, quote: hit.text, collection: hit.source || null, number: hit.number || null, grader: hit.grader || null, grading: hit.grading || null, narrator: hit.narrator || null, takhrij: hit.takhrij || null };
  const t = tierOf({ grader: hit.grader, source: hit.source });
  console.log(`THIS ENTRY: ${t.label}`);
  if (!t.tier) console.log('WARNING: this entry may NOT give the grade. Cite a tier 1-4 entry of the same hadith as the source; this one may only travel as an extra mention (confirm_url / gradings), or the part takes x_ungraded when no tier 1-4 entry exists.');
  console.log('Copy this source object into the part as it is (shorten quote only with «…» at the cuts, never rewrite it; the grading is the page\'s word ALONE, never with a note added):');
  console.log(JSON.stringify(source, null, 1));
} else {
  console.error('unknown command: ' + CMD); process.exit(1);
}

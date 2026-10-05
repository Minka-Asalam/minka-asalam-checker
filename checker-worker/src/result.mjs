// The result the person sees (written to checker_runs.result): COUNTS, then one
// row per quote. No score, no colour for the clip, no grade for the speaker.
// Contract (the app reads exactly this; version it if it changes):
// { version: 1, engine, rules_version,
//   counts: { quotes, sourced, corrected, not_found, other },
//   rows: [{ i, t, t_end, said, flow_kind, state, level, parts_total, parts_sourced,
//            source: { title_ar, title_en, link, quote } | null }] }
import { timeToSeconds } from './listen.mjs';

const SOURCED = ['matches', 'by_meaning', 'overstated'];
const HIDDEN = ['not_a_claim'];

function sourceOf(c) {
  const parts = (c.parts || []).filter((p) => p.source && p.source.link);
  const p = parts.find((x) => x.state === 'matches' && x.flow_kind === c.flow_kind) || parts.find((x) => x.state === 'matches') || parts[0];
  if (!p) return null;
  const s = p.source;
  let ar = null, en = null;
  if (/quran\.com/.test(s.link)) {
    const m = /quran\.com\/(\d+)\/(\d+(?:-\d+)?)/.exec(s.link);
    ar = m ? `القرآن الكريم ${m[1]}:${m[2]}` : 'القرآن الكريم';
    en = m ? `The Qur'an ${m[1]}:${m[2]}` : "The Qur'an";
  } else if (/dorar\.net/.test(s.link)) {
    ar = [s.collection, s.number].filter(Boolean).join(' ') || 'الدرر السنية';
    if (s.grader) ar += ` · ${s.grader}`;
    en = ar;
  } else {
    ar = s.work_ar || s.collection || s.site || null;
    if (ar && s.volume && s.page) ar += ` ${s.volume}/${s.page}`;
    else if (ar && s.page) ar += ` ص${s.page}`;
    en = ar;
  }
  return { title_ar: ar, title_en: en, link: s.page_url || s.link, quote: s.quote || null };
}

export function buildResult({ ret, batch, engine, rulesVersion }) {
  const byI = new Map((batch.claims || []).map((c) => [c.i, c]));
  const counts = { quotes: 0, sourced: 0, corrected: 0, not_found: 0, other: 0 };
  const rows = [];
  const claims = ret.videos?.[0]?.result?.claims || [];
  for (const c of claims) {
    if (HIDDEN.includes(c.state)) continue;
    const b = byI.get(c.i) || {};
    counts.quotes++;
    if (SOURCED.includes(c.state)) counts.sourced++;
    else if (c.state === 'corrected') counts.corrected++;
    else if (c.state === 'not_found') counts.not_found++;
    else counts.other++;
    const parts = c.parts || [];
    rows.push({
      i: c.i,
      t: timeToSeconds(b.timestamp),
      t_end: timeToSeconds(b.timestamp_end),
      said: b.quote || parts.map((p) => p.said_text).filter(Boolean).join(' … '),
      flow_kind: c.flow_kind,
      state: c.state,
      level: c.level ?? 0,
      parts_total: parts.length,
      parts_sourced: parts.filter((p) => SOURCED.includes(p.state) || p.state === 'corrected').length,
      source: sourceOf(c),
    });
  }
  rows.sort((x, y) => (x.t ?? 1e9) - (y.t ?? 1e9) || x.i - y.i);
  return { version: 1, engine, rules_version: rulesVersion, counts, rows };
}

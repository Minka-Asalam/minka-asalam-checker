// Builds placements.html (the owner's map-placement review) from clips.json + listen/result-<id>.json.
import fs from 'node:fs';
const clips = JSON.parse(fs.readFileSync('clips.json', 'utf8'));
const speakers = Object.fromEntries(JSON.parse(fs.readFileSync('speakers.json', 'utf8')).map((s) => [s.id, s]));
const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const rows = clips.map((c) => {
  const f = `listen/result-${c.id}.json`;
  const teacher = (speakers[c.id]?.pname || c.credit || '').replace(/\s+/g, ' ').trim();
  const base = { id: c.id, title: c.title, teacher, len: mmss(c.seconds) };
  if (!fs.existsSync(f)) return { ...base, wait: true, tags: [] };
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  return { ...base, summary_ar: r.summary_ar || '', tags: (r.tags || []).map((t) => ({ path: t.path_ar || t.node_path, ts: t.timestamp, quote: t.quote_ar || t.quote || '', why: t.why || '', conf: t.confidence || '' })) };
}).sort((a, b) => (a.wait ? 1 : 0) - (b.wait ? 1 : 0));
fs.writeFileSync('placements.html', fs.readFileSync('placement-template.html', 'utf8').replace('__CLIPS__', JSON.stringify(rows).replace(/</g, '\u003c')));
console.log(rows.filter((r) => !r.wait).length, 'listened,', rows.filter((r) => r.wait).length, 'waiting');

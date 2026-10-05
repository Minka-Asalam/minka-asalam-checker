// Builds one checker batch per library clip with that clip's own teacher (build-batch.mjs takes one speaker per
// call and rewrites index.json each time), then writes the merged index.json for the workflow.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const R = 'D:/Deeni Docs/curation/2026-10-05 Clip library run';
const clips = JSON.parse(fs.readFileSync(`${R}/clips.json`, 'utf8'));
const speakers = Object.fromEntries(JSON.parse(fs.readFileSync(`${R}/speakers.json`, 'utf8')).map(s => [s.id, s]));
const CREATORS = /أحمد العربي|فداء الدين|Ousama Alshurafa/; // the rest are teachers/scholars by title
const index = [];
for (const c of clips) {
  const f = `${R}/listen/result-${c.id}.json`;
  if (!fs.existsSync(f)) { console.log('NOT LISTENED', c.title); continue; }
  const s = speakers[c.id] || {};
  const name = (s.pname || s.snap || c.credit || 'unknown').replace(/\s+/g, ' ').trim();
  const kind = CREATORS.test(name) ? 'creator' : 'scholar';
  const out = execFileSync('node', ['build-batch.mjs', 'run', name, kind, f], { encoding: 'utf8' });
  process.stdout.write(`${c.title} | ${name} (${kind}) | ${out.split('\n')[0].replace(/^[^:]+: /, '')}\n`);
  const bf = `run/batch-${c.id}.json`;
  const b = JSON.parse(fs.readFileSync(bf, 'utf8'));
  b.title = c.title; b.seconds = c.seconds;
  fs.writeFileSync(bf, JSON.stringify(b, null, 1));
  index.push({ id: c.id, file: `batch-${c.id}.json` });
}
fs.writeFileSync('run/index.json', JSON.stringify(index, null, 1));
console.log('index.json:', index.length);

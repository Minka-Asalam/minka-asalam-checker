// hcheck2.mjs — method v4 (4 Oct 2026, after the review panel): stage 5 for hadith. A DIFFERENT model (Opus) reads the
// speaker's words and the full text of the picked dorar narration: is this the hadith he told? v4 fixes:
//   - the speaker's words are taken from the claim's OWN video (hcheck v1 took the group's first video, so a group of two
//     videos could pair a narration with another video's quote);
//   - judge only from the narration text shown, not from memory;
//   - "who said it" is its own question: the Prophet, a Companion's own words, or a hadith qudsi, against how he introduced it.
//   node hcheck2.mjs prompts <dir with out/ and inputs/> <answer dir>
import fs from 'node:fs';
const [cmd, DIR = '.', OUTDIR = 'runs'] = process.argv.slice(2);
const GUARD = 'RULES FOR YOU: Do not read any other file, do not run any command, do not search the web, do not start other agents. Write exactly one file, the answer file named below, containing only the JSON asked for.';
const items = [];
for (const f of fs.readdirSync(`${DIR}/out`).filter((x) => /-g\d+\.json$/.test(x) && !x.startsWith('ledger'))) {
  const g = f.match(/-g(\d+)\.json$/)[1]; const o = JSON.parse(fs.readFileSync(`${DIR}/out/${f}`, 'utf8')); const inp = JSON.parse(fs.readFileSync(`${DIR}/inputs/group-${g}.json`, 'utf8'));
  for (const v of o.videos) { const iv = inp.videos.find((x) => x.id === v.id);
    for (const c of v.claims) { const s = c.parts[0].source; if (!s) continue; const ic = iv.claims.find((x) => x.i === c.i);
      items.push({ tag: `${v.id}#${c.i}`, quote: ic.quote, att: ic.attribution, en: ic.claim_en, src: `${s.collection} ${s.number || ''} · ${s.grader}: ${s.grading}`, text: s.quote, narrator: s.narrator }); } }
}
if (cmd === 'prompts') {
  const B = 5; let b = 0; fs.mkdirSync(OUTDIR, { recursive: true });
  for (let k = 0; k < items.length; k += B) { b++; const part = items.slice(k, k + B); const out = `${OUTDIR.replace(/\\/g, '/')}/hcheck-b${b}.json`;
    fs.writeFileSync(`${OUTDIR}/prompt-hcheck-b${b}.txt`, `${GUARD}\n\nA speaker in a religious video quoted a hadith (or a report). Beside each is the narration chosen as its source, as dorar.net prints it. Judge ONLY from the narration text shown, never from what you remember of the hadith.\n1. Is this narration the hadith he told?\n- "yes": the same saying or event, in words that carry what he said;\n- "partly": the same hadith, but he added, changed or left out a detail;\n- "no": a different hadith (even on the same topic), or the text shown does not contain what he said.\n2. Who says it in the narration, and is that whom he named? who = "prophet" (the Prophet's words or deed), "qudsi" (Allah's words told by the Prophet), "companion" (a Companion's own words or deed), "other"; who_matches = "yes" | "no" (he attributed it to the Prophet and it is a Companion's words, or the reverse) | "unclear".\n\n${part.map((x) => `- tag: ${x.tag}\n  the speaker's words: ${x.quote}${x.att ? `\n  how he introduced it: ${x.att}` : ''}\n  in English: ${x.en}\n  the chosen narration (${x.src}${x.narrator ? `, narrator: ${x.narrator}` : ''}):\n  ${x.text}`).join('\n\n')}\n\nWrite this JSON to the file ${out}:\n{"claims":[{"tag":"<tag>","same":"yes|partly|no","who":"prophet|qudsi|companion|other","who_matches":"yes|no|unclear","why":"<one short English sentence>"}]}\nOne entry per claim, same tags.`); }
  console.log('hadith second-look prompts', b, 'picks', items.length);
}

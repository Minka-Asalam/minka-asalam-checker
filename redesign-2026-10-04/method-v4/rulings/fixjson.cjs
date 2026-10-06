// fixjson.cjs <file>...: repairs a helper's answer file when the ONLY fault is one bracket: the claims list left unclosed
// (Haiku wrote "]}]}}" for "]}]}]}") or a stray closing brace. Tries inserting "]" or removing "}" at the parser's error
// position, at most 3 times, and keeps a repair only if the result parses with a claims list. The answers' words are never touched.
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  let s = fs.readFileSync(f, 'utf8'); let fixes = 0, ok = false;
  for (let k = 0; k < 4; k++) {
    try { const j = JSON.parse(s); ok = Array.isArray(j.claims); break; } catch (e) {
      const m = /position (\d+)/.exec(e.message); const p = m ? +m[1] : -1;
      if (p < 0 || fixes >= 3) break;
      const tries = [s.slice(0, p) + ']' + s.slice(p), s[p] === '}' ? s.slice(0, p) + s.slice(p + 1) : null].filter(Boolean);
      const good = tries.find((t) => { try { JSON.parse(t); return true; } catch (e2) { const m2 = /position (\d+)/.exec(e2.message); return m2 && +m2[1] > p; } });
      if (!good) break; s = good; fixes++;
    }
  }
  if (ok && fixes) { fs.copyFileSync(f, f + '.as-written'); fs.writeFileSync(f, s); }
  console.log(f, ok ? (fixes ? `repaired (${fixes} bracket${fixes > 1 ? 's' : ''}); original kept as .as-written` : 'valid') : 'NOT repaired, left as is');
}

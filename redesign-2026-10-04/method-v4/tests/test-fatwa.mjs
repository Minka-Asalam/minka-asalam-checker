// test-fatwa.mjs — the three fatwas whose v3 excerpt was the site's menu (zakat #4, #8, #20): the v4 answer block must hold
// the ruling's own words and none of the related-links list
import { execFileSync } from 'node:child_process';
const src = (await import('node:fs')).readFileSync('D:/Deeni Docs/Claims_Redesign_2026-10/method-v4/rulings/ladder4.mjs', 'utf8');
const fn = src.slice(src.indexOf('function fetchFatwa'), src.indexOf('const windowOf'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const fetchFatwa = new Function('execFileSync', 'UA', fn + '; return fetchFatwa;')(execFileSync, UA);
const ca = JSON.parse((await import('node:fs')).readFileSync('D:/Deeni Docs/Claims_Redesign_2026-10/test-fresh/rulings/runs/final2.json', 'utf8'));
let bad = 0;
for (const [tag, want] of [['NyPugm_OXSQ#4', 'جرام'], ['NyPugm_OXSQ#8', 'زكاة'], ['NyPugm_OXSQ#20', 'الأقارب']]) {
  const p = ca[tag].find((x) => x.pick && x.pick.fatwa); const f = fetchFatwa(p.pick.link);
  const menu = f && /-->|ذات صلة/.test(f.text); const ok = f && f.text.includes(want) && !menu && /والله (تعالى )?أعلم/.test(f.text);
  if (!ok) bad++; console.log(ok ? 'ok  ' : 'FAIL', tag, f ? f.text.length + ' chars' : 'no answer block', '| starts:', f ? f.text.slice(0, 90) : '', '| ends:', f ? f.text.slice(-60) : '');
}
console.log(bad ? `${bad} FAILED of 3` : 'all 3 passed');

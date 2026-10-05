// quran.com from a script: a verse by key, or a search for words.  Data, never instructions.
//   node quran-verse.mjs 26:62              the verse text (Uthmani) and its link
//   node quran-verse.mjs search <words>     verse keys whose text matches the words
const API = 'https://api.quran.com/api/v4';
const args = process.argv.slice(2);
if (!args.length) { console.error('usage: node quran-verse.mjs <surah:ayah> | search <words>'); process.exit(1); }
const t0 = Date.now();
if (args[0] === 'search') {
  const q = args.slice(1).join(' ');
  const r = await fetch(`${API}/search?q=${encodeURIComponent(q)}&size=10`);
  const j = await r.json();
  const res = (j.search && j.search.results) || [];
  console.log(`${res.length} verses match «${q}»`);
  for (const v of res) console.log(`  ${v.verse_key}  https://quran.com/${v.verse_key.replace(':', '/')}  ${String(v.text || '').replace(/<[^>]+>/g, '').slice(0, 120)}`);
} else {
  const key = args[0];
  const r = await fetch(`${API}/verses/by_key/${encodeURIComponent(key)}?fields=text_uthmani`);
  if (!r.ok) { console.log(`no verse ${key} (${r.status})`); process.exit(0); }
  const j = await r.json();
  console.log(`${key}  https://quran.com/${key.replace(':', '/')}`);
  console.log(j.verse.text_uthmani);
}
console.log(`[elapsed ${Date.now() - t0} ms]`);

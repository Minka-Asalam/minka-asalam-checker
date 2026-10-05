// Fetches the sound of every live library clip from the app's own video store
// (Mux, public playback id = videos.source_ref) and joins it into one .m4a per
// clip: the audio-only HLS rendition is fragmented MP4, so init segment + media
// segments in order is a playable file. No ffmpeg needed. Writes clips.json.
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const q = `select v.id, v.title, v.spoken_language, v.subtitle_language, v.source_ref, coalesce(v.credited_name_snapshot,'') credit, v.created_at::date d from videos v where v.archived_at is null and v.is_reel and v.mux_asset_id is not null order by v.created_at`;
const raw = execSync(`npx supabase db query --linked "${q}"`, { cwd: 'D:/Deeni', encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const rows = JSON.parse(raw.slice(raw.indexOf('{'))).rows;
const get = async (u, bin) => { for (let i = 0; i < 4; i++) { try { const r = await fetch(u); if (r.ok) return bin ? Buffer.from(await r.arrayBuffer()) : await r.text(); } catch {} await new Promise(r => setTimeout(r, 1500)); } throw new Error('fetch failed ' + u.slice(0, 80)); };
const out = [];
for (const v of rows) {
  const master = await get(`https://stream.mux.com/${v.source_ref}.m3u8`);
  const aUri = (master.match(/TYPE=AUDIO[^\n]*URI="([^"]+)"/) || [])[1];
  if (!aUri) { console.log('NO AUDIO RENDITION', v.title); continue; }
  const pl = await get(aUri);
  const init = (pl.match(/#EXT-X-MAP:URI="([^"]+)"/) || [])[1];
  const segs = pl.split('\n').filter(l => l && !l.startsWith('#'));
  const dur = pl.split('\n').filter(l => l.startsWith('#EXTINF:')).reduce((a, l) => a + parseFloat(l.slice(8)), 0);
  const parts = [await get(init, true)];
  for (const s of segs) parts.push(await get(s, true));
  const file = `audio/${v.id}.m4a`;
  fs.writeFileSync(file, Buffer.concat(parts));
  out.push({ ...v, seconds: Math.round(dur), file });
  console.log(`${Math.round(dur)}s  ${(fs.statSync(file).size / 1e6).toFixed(1)} MB  ${v.title}`);
}
fs.writeFileSync('clips.json', JSON.stringify(out, null, 1));
console.log(out.length, 'clips');

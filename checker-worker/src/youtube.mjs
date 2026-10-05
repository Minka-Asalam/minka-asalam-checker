// What YouTube's own data service says about a clip, before any money is spent:
// its length, title, description, channel name and the channel's own description.
import { need } from './env.mjs';

const API = 'https://www.googleapis.com/youtube/v3';

function seconds(iso) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!m) return null;
  const [, d, h, mi, s] = m.map((x) => Number(x || 0));
  return d * 86400 + h * 3600 + mi * 60 + s;
}

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube data service ${res.status}`);
  return res.json();
}

// { ok: true, title, description, channelId, channelTitle, channelDescription, seconds, live }
// or { ok: false } when the clip is missing, private, or not embeddable/public.
export async function clipInfo(id) {
  const key = need('YOUTUBE_API_KEY');
  const v = await get(`${API}/videos?part=snippet,contentDetails,status&id=${encodeURIComponent(id)}&key=${key}`);
  const item = v.items?.[0];
  if (!item || item.status?.privacyStatus === 'private' || item.status?.uploadStatus === 'rejected') return { ok: false };
  const sn = item.snippet || {};
  let channelDescription = '';
  if (sn.channelId) {
    try {
      const c = await get(`${API}/channels?part=snippet&id=${encodeURIComponent(sn.channelId)}&key=${key}`);
      channelDescription = c.items?.[0]?.snippet?.description || '';
    } catch { /* the channel's description is a help, not a need */ }
  }
  return {
    ok: true,
    title: sn.title || '',
    description: sn.description || '',
    channelId: sn.channelId || null,
    channelTitle: sn.channelTitle || '',
    channelDescription,
    seconds: seconds(item.contentDetails?.duration),
    live: sn.liveBroadcastContent && sn.liveBroadcastContent !== 'none',
  };
}

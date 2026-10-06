'use strict';
// YouTube Data API v3 호출. 키는 서버(.env)에만 있고 응답·로그에 절대 싣지 않는다.
// YOUTUBE_API_BASE 는 테스트(가짜 서버)용 — 실제 운영에서는 설정하지 않는다
const BASE = (process.env.YOUTUBE_API_BASE || 'https://www.googleapis.com/youtube/v3').replace(/\/$/, '');

const configured = () => !!(process.env.YOUTUBE_API_KEY || '').trim();

class YtError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}

async function call(endpoint, params) {
  const key = (process.env.YOUTUBE_API_KEY || '').trim();
  if (!key) throw new YtError('YouTube API 키가 서버에 설정되어 있지 않습니다.', 503, 'no_key');
  const qs = new URLSearchParams({ ...params, key });
  let res;
  try { res = await fetch(`${BASE}/${endpoint}?${qs}`, { signal: AbortSignal.timeout(15000) }); }
  catch (e) { throw new YtError('YouTube API에 연결할 수 없습니다.', 502, 'network'); }
  let body = null;
  try { body = await res.json(); } catch (e) {}
  if (!res.ok) {
    const reason = body?.error?.errors?.[0]?.reason || '';
    if (reason === 'keyInvalid' || /API key not valid/i.test(body?.error?.message || ''))
      throw new YtError('YouTube API 키가 올바르지 않습니다.', 502, 'key_invalid');
    if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded')
      throw new YtError('YouTube API 일일 할당량을 초과했습니다. 내일 다시 시도하세요.', 429, 'quota');
    if (reason === 'commentsDisabled') throw new YtError('이 영상은 댓글이 막혀 있습니다.', 403, 'comments_disabled');
    if (reason === 'videoNotFound' || res.status === 404) throw new YtError('영상을 찾을 수 없습니다.', 404, 'not_found');
    if (reason === 'accessNotConfigured' || res.status === 403)
      throw new YtError('YouTube Data API v3가 이 키에 허용되어 있지 않습니다(Google Cloud에서 API 사용 설정 확인).', 502, 'forbidden');
    throw new YtError(`YouTube API 오류(${res.status})`, 502, 'upstream');
  }
  return body;
}

// ISO8601 길이(PT1M13S) → 초
function seconds(iso) {
  const m = String(iso || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
}

// 영상 URL 에서 영상 ID 를 뽑는다 (watch?v= / youtu.be / shorts / embed / live)
function videoId(url) {
  const s = String(url || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  let u;
  try { u = new URL(s); } catch (e) { return ''; }
  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0].slice(0, 11);
  if (host.endsWith('youtube.com')) {
    if (u.searchParams.get('v')) return u.searchParams.get('v').slice(0, 11);
    const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }
  return '';
}

// 유료광고(유료 프로모션 포함) 표기 — YouTube 가 영상에 붙인 값(paidProductPlacementDetails)만 본다.
// true/false, 값이 없으면 null(확인불가). 제목·설명의 #광고 같은 글자는 보지 않는다.
const paidFlag = v => (v && v.paidProductPlacementDetails && typeof v.paidProductPlacementDetails.hasPaidProductPlacement === 'boolean')
  ? v.paidProductPlacementDetails.hasPaidProductPlacement : null;
const paidLabel = p => p === true ? '있음' : p === false ? '없음' : '확인불가';

// 영상 ID 목록 → { id: {views, likes, comments, paid} } (50개씩 묶어서 호출)
async function videoStats(ids) {
  const out = {};
  const uniq = [...new Set(ids.filter(Boolean))];
  for (let i = 0; i < uniq.length; i += 50) {
    const chunk = uniq.slice(i, i + 50);
    const data = await call('videos', { part: 'statistics,paidProductPlacementDetails', id: chunk.join(','), maxResults: 50 });
    (data.items || []).forEach(v => {
      const s = v.statistics || {};
      out[v.id] = { views: +s.viewCount || 0, likes: +s.likeCount || 0, comments: +s.commentCount || 0, paid: paidFlag(v) };
    });
  }
  return out;
}

// CID 목록 → 채널명·핸들·구독자·평균 쇼츠 조회수(최근 5개). 채널 하나당 API 3회(약 3 쿼터).
async function channelInfo(cids) {
  const out = {};
  const uniq = [...new Set(cids)].slice(0, 20);
  const base = await call('channels', { part: 'snippet,statistics,contentDetails', id: uniq.join(','), maxResults: 50 });
  const byId = {};
  (base.items || []).forEach(c => { byId[c.id] = c; });
  for (const cid of uniq) {
    const c = byId[cid];
    if (!c) { out[cid] = { ok: false, error: '유튜브에 없는 채널 ID' }; continue; }
    const info = {
      ok: true,
      name: c.snippet?.title || '',
      handle: c.snippet?.customUrl || '',
      subscribers: c.statistics?.hiddenSubscriberCount ? null : (+c.statistics?.subscriberCount || 0),
      totalViews: +c.statistics?.viewCount || 0,
      avgShortsViews: null,
      shortsCounted: 0,
    };
    try {
      const uploads = c.contentDetails?.relatedPlaylists?.uploads;
      if (uploads) {
        const pl = await call('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: 30 });
        const ids = (pl.items || []).map(i => i.contentDetails?.videoId).filter(Boolean);
        if (ids.length) {
          const vs = await call('videos', { part: 'contentDetails,statistics', id: ids.join(','), maxResults: 50 });
          const order = new Map(ids.map((id, i) => [id, i]));
          const shorts = (vs.items || [])
            .filter(v => { const s = seconds(v.contentDetails?.duration); return s > 0 && s <= 180; })
            .sort((a, b) => order.get(a.id) - order.get(b.id))
            .slice(0, 5);
          if (shorts.length) {
            info.avgShortsViews = Math.round(shorts.reduce((n, v) => n + (+v.statistics?.viewCount || 0), 0) / shorts.length);
            info.shortsCounted = shorts.length;
          }
        }
      }
    } catch (e) { if (e instanceof YtError && ['quota', 'key_invalid', 'forbidden'].includes(e.code)) throw e; }
    out[cid] = info;
  }
  return out;
}

// 영상 ID 목록 → { id: {title, channelId, channelTitle, publishedAt, seconds, views, likes, comments} }
// (리포트 "자동 조회": URL 에서 영상·채널을 알아낼 때 사용)
async function videoDetails(ids) {
  const out = {};
  const uniq = [...new Set(ids.filter(Boolean))];
  for (let i = 0; i < uniq.length; i += 50) {
    const chunk = uniq.slice(i, i + 50);
    const data = await call('videos', { part: 'snippet,contentDetails,statistics,paidProductPlacementDetails', id: chunk.join(','), maxResults: 50 });
    (data.items || []).forEach(v => {
      const sn = v.snippet || {}, st = v.statistics || {};
      out[v.id] = {
        title: sn.title || '', channelId: sn.channelId || '', channelTitle: sn.channelTitle || '',
        publishedAt: sn.publishedAt || '', seconds: seconds(v.contentDetails && v.contentDetails.duration),
        views: +st.viewCount || 0, likes: +st.likeCount || 0, comments: +st.commentCount || 0,
        paid: paidFlag(v),
      };
    });
  }
  return out;
}

// 채널 ID 목록 → { id: {name, handle, subscribers(숨김이면 null)} }
async function channelStats(channelIds) {
  const out = {};
  const uniq = [...new Set(channelIds.filter(Boolean))];
  for (let i = 0; i < uniq.length; i += 50) {
    const chunk = uniq.slice(i, i + 50);
    const data = await call('channels', { part: 'snippet,statistics', id: chunk.join(','), maxResults: 50 });
    (data.items || []).forEach(c => {
      out[c.id] = {
        name: (c.snippet && c.snippet.title) || '', handle: (c.snippet && c.snippet.customUrl) || '',
        subscribers: c.statistics && c.statistics.hiddenSubscriberCount ? null : (+(c.statistics && c.statistics.subscriberCount) || 0),
      };
    });
  }
  return out;
}

// 영상 한 개의 인기 댓글(좋아요·관련도 순) — commentThreads.list 1회 호출(할당량 1)
// 댓글이 막힌 영상·없는 영상은 오류 없이 빈 목록을 돌려준다
async function topComments(vid, max = 5) {
  try {
    const data = await call('commentThreads', { part: 'snippet', videoId: vid, order: 'relevance', maxResults: Math.min(Math.max(max, 1), 20), textFormat: 'plainText' });
    return (data.items || []).map(it => {
      const sn = (it.snippet && it.snippet.topLevelComment && it.snippet.topLevelComment.snippet) || {};
      return { id: (it.snippet && it.snippet.topLevelComment && it.snippet.topLevelComment.id) || it.id || '', text: String(sn.textDisplay || sn.textOriginal || ''), likes: +sn.likeCount || 0, author: sn.authorDisplayName || '' };
    }).filter(c => c.text);
  } catch (e) {
    if (e instanceof YtError && ['comments_disabled', 'not_found'].includes(e.code)) return [];
    throw e;
  }
}

module.exports = { paidLabel, topComments, configured, YtError, videoId, videoStats, channelInfo, videoDetails, channelStats };

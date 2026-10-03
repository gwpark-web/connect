'use strict';
/* ============================================================
   커넥트 스튜디오 백엔드 (Node 내장 모듈만 사용 — npm install 불필요)
   실행: node server.js        설정: .env (예시는 .env.example)
   ------------------------------------------------------------
   · 로그인/권한(관리자·광고주)   · 캠페인 저장·조회
   · 참여 영상 리포트 저장        · 짤 회원 메모
   · 조회수 갱신(하루 1회/플랫폼)  · YouTube 채널·영상 조회
   ============================================================ */
const http = require('http');
const crypto = require('crypto');
require('./lib/env').loadEnv();
const store = require('./lib/store');
const auth = require('./lib/auth');
const yt = require('./lib/youtube');
const zeal = require('./lib/zeal');

const PORT = +process.env.PORT || 4000;
// 기본은 이 컴퓨터(127.0.0.1)에서만 접속된다. 같은 네트워크의 다른 기기에서도 쓰려면 .env 에 HOST=0.0.0.0 (강한 비밀번호 필수)
const HOST = process.env.HOST || '127.0.0.1';
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:8787,http://127.0.0.1:8787')
  .split(',').map(s => s.trim()).filter(Boolean);
const PLATFORMS = ['yt', 'ig', 'tt'];
const PRODUCTS = ['조회수당', '업로드당', '프리미엄'];

/* ── 공통 ── */
function cors(req, res) {
  const origin = req.headers.origin;
  // 지정한 출처 + 이 컴퓨터의 localhost/127.0.0.1(포트 무관, VS Code Live Server 등 로컬 개발용)
  if (origin && (ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
}
function send(req, res, status, obj) {
  cors(req, res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readJson(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(Object.assign(new Error('invalid JSON'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}
const todayKST = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const nextResetKST = () => { const d = new Date(Date.now() + 9 * 3600e3); d.setUTCHours(24, 0, 0, 0); return new Date(d.getTime() - 9 * 3600e3).toISOString(); };
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const normName = s => str(s, 200).replace(/\s+/g, ' ');
const CAMPAIGN_KEY = /^[A-Za-z0-9_.:-]{1,60}$/;

function need(req, res, role) {
  const user = auth.fromRequest(req);
  if (!user) { send(req, res, 401, { error: '로그인이 필요합니다.' }); return null; }
  if (role && user.role !== role) { send(req, res, 403, { error: '권한이 없습니다.' }); return null; }
  return user;
}

/* ── 로그인 시도 제한(IP당 1분 10회, LOGIN_RATE_LIMIT 로 조정) ── */
const attempts = new Map();
function tooManyLogins(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter(t => now - t < 60000);
  list.push(now); attempts.set(ip, list);
  return list.length > (+process.env.LOGIN_RATE_LIMIT || 10);
}

/* ── 캠페인 입력 정리 ── */
function cleanCampaign(b, partial) {
  const out = {};
  const has = k => b[k] !== undefined;
  if (!partial || has('title')) { out.title = str(b.title, 100); if (!out.title) return { error: '캠페인명을 입력해주세요.' }; }
  if (!partial || has('platforms') || has('platform')) {
    const raw = Array.isArray(b.platforms) ? b.platforms : [b.platform];
    out.platforms = [...new Set(raw.map(p => str(p, 4)).filter(p => PLATFORMS.includes(p)))];
    if (!out.platforms.length) return { error: '플랫폼을 선택해주세요.' };
  }
  if (!partial || has('product')) { out.product = PRODUCTS.includes(b.product) ? b.product : '조회수당'; }
  ['client', 'agency'].forEach(k => { if (!partial || has(k)) out[k] = str(b[k], 60); });
  ['goalViews', 'goalVids'].forEach(k => { if (!partial || has(k)) out[k] = str(b[k], 20).replace(/[^0-9]/g, ''); });
  ['start', 'end'].forEach(k => { if (!partial || has(k)) { const v = str(b[k], 10); out[k] = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ''; } });
  if (!partial || has('thumb')) { const t = str(b.thumb, 500); out.thumb = /^(https?:\/\/|img\/)/.test(t) ? t : ''; }
  if (!partial || has('status')) out.status = ['recruiting', 'channel-select', 'progress', 'done'].includes(b.status) ? b.status : 'recruiting';
  return { value: out };
}
const visibleTo = (user, c) => user.role === 'admin' ||
  (!!user.brand && [c.client, c.agency].some(v => v && v.toLowerCase() === user.brand.toLowerCase()));

/* ── 라우터 ── */
async function route(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const m = req.method;

  if (m === 'OPTIONS') { cors(req, res); res.writeHead(204); return res.end(); }

  if (p === '/api/health' && m === 'GET') return send(req, res, 200, { ok: true, auth: auth.configured(), youtube: yt.configured(), zealLive: zeal.liveConfigured() });

  /* 로그인 */
  if (p === '/api/login' && m === 'POST') {
    if (tooManyLogins(req.socket.remoteAddress)) return send(req, res, 429, { error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.' });
    const b = await readJson(req);
    if (!auth.configured()) return send(req, res, 503, { error: '서버에 계정이 설정되어 있지 않습니다(.env 의 ADMIN_EMAIL/ADMIN_PASSWORD).' });
    const user = auth.login(b.email, b.password);
    if (!user) return send(req, res, 401, { error: '아이디(이메일) 또는 비밀번호를 확인해주세요.' });
    return send(req, res, 200, { token: auth.sign(user), user });
  }
  if (p === '/api/me' && m === 'GET') { const u = need(req, res); return u && send(req, res, 200, { user: u }); }

  /* 캠페인 */
  if (p === '/api/campaigns' && m === 'GET') {
    const user = need(req, res); if (!user) return;
    const list = store.get().campaigns.filter(c => visibleTo(user, c));
    return send(req, res, 200, { campaigns: list });
  }
  if (p === '/api/campaigns' && m === 'POST') {
    const user = need(req, res, 'admin'); if (!user) return;
    const r = cleanCampaign(await readJson(req), false);
    if (r.error) return send(req, res, 400, { error: r.error });
    const c = { id: 'c_' + crypto.randomBytes(6).toString('hex'), ...r.value, createdAt: new Date().toISOString(), createdBy: user.email };
    store.get().campaigns.unshift(c); store.save();
    return send(req, res, 201, { campaign: c });
  }
  let mm = p.match(/^\/api\/campaigns\/(c_[0-9a-f]{12})$/);
  if (mm && m === 'PATCH') {
    const user = need(req, res, 'admin'); if (!user) return;
    const c = store.get().campaigns.find(x => x.id === mm[1]);
    if (!c) return send(req, res, 404, { error: '캠페인을 찾을 수 없습니다.' });
    const r = cleanCampaign(await readJson(req), true);
    if (r.error) return send(req, res, 400, { error: r.error });
    Object.assign(c, r.value, { updatedAt: new Date().toISOString() }); store.save();
    return send(req, res, 200, { campaign: c });
  }
  if (mm && m === 'DELETE') {
    const user = need(req, res, 'admin'); if (!user) return;
    const db = store.get(); const n = db.campaigns.length;
    db.campaigns = db.campaigns.filter(x => x.id !== mm[1]); store.save();
    return send(req, res, n === db.campaigns.length ? 404 : 200, { ok: n !== db.campaigns.length });
  }

  /* 참여 영상 리포트 */
  if (p === '/api/videos' && m === 'GET') {
    const user = need(req, res); if (!user) return;
    const key = url.searchParams.get('campaign') || 'default';
    if (!CAMPAIGN_KEY.test(key)) return send(req, res, 400, { error: 'campaign 값이 올바르지 않습니다.' });
    const db = store.get();
    // 관리자는 작업본, 광고주는 [광고주 연동]으로 내보낸 공개본만 본다
    if (user.role !== 'admin') return send(req, res, 200, { rows: (db.videosPub[key] || {}).rows || [] });
    return send(req, res, 200, { rows: db.videos[key] || [], pub: pubState(db, key) });
  }
  if (p === '/api/videos/publish' && m === 'POST') {
    const user = need(req, res, 'admin'); if (!user) return;
    const key = url.searchParams.get('campaign') || 'default';
    if (!CAMPAIGN_KEY.test(key)) return send(req, res, 400, { error: 'campaign 값이 올바르지 않습니다.' });
    const db = store.get();
    const rows = db.videos[key] || [];
    if (!rows.length) return send(req, res, 400, { error: '연동할 리포트 데이터가 없습니다. 먼저 리포트를 업로드해주세요.' });
    db.videosPub[key] = { rows: JSON.parse(JSON.stringify(rows)), comments: JSON.parse(JSON.stringify(db.comments[key] || { items: [] })), at: new Date().toISOString() };
    store.save();
    return send(req, res, 200, { count: rows.length, pub: pubState(db, key) });
  }
  if (p === '/api/videos' && m === 'POST') {
    const user = need(req, res, 'admin'); if (!user) return;
    const key = url.searchParams.get('campaign') || 'default';
    if (!CAMPAIGN_KEY.test(key)) return send(req, res, 400, { error: 'campaign 값이 올바르지 않습니다.' });
    const body = await readJson(req);
    if (!Array.isArray(body) || body.length > 5000) return send(req, res, 400, { error: 'rows 는 5000개 이하의 배열이어야 합니다.' });
    const db = store.get();
    // 업로드는 "올린 파일에 들어 있는 플랫폼"의 기존 행만 모두 지우고 새로 등록한다.
    // 파일에 없는 플랫폼의 행과 다른 캠페인(campaign 값이 다른 리포트)은 그대로 둔다.
    // (같은 파일 안에서 같은 플랫폼·같은 채널명은 한 줄로 합침)
    const byName = new Map();
    body.forEach(raw => {
      if (!raw || typeof raw !== 'object') return;
      const row = {};
      Object.keys(raw).slice(0, 30).forEach(k => { const v = raw[k]; if (typeof v === 'string' || typeof v === 'number') row[str(k, 40)] = str(v, 500); });
      const nm = normName(row.name); if (!nm) return;
      row.name = nm;
      const k = rowPlat(row) + '|' + nm;
      const prev = byName.get(k);
      if (prev) Object.assign(prev, row); else byName.set(k, row);
    });
    if (!byName.size) return send(req, res, 400, { error: '등록할 수 있는 행(채널명)이 없습니다. 기존 데이터는 그대로 두었습니다.' });
    const scope = new Set([...byName.values()].map(rowPlat));
    const existing = db.videos[key] || [];
    const kept = existing.filter(r => !scope.has(rowPlat(r)));
    const replaced = existing.length - kept.length;
    db.videos[key] = [...kept, ...byName.values()]; store.save();
    return send(req, res, 200, { rows: db.videos[key], added: byName.size, replaced, kept: kept.length, platforms: [...scope], pub: pubState(db, key) });
  }

  /* 베스트 댓글 — 관리자가 [댓글 불러오기]를 눌렀을 때만 YouTube 에서 가져온다(영상마다 API 호출이 필요해서 별도 기능) */
  if (p === '/api/comments' && m === 'GET') {
    const user = need(req, res); if (!user) return;
    const key = url.searchParams.get('campaign') || 'default';
    if (!CAMPAIGN_KEY.test(key)) return send(req, res, 400, { error: 'campaign 값이 올바르지 않습니다.' });
    const db = store.get();
    // 광고주는 [연동]으로 내보낸 공개본의 댓글만 본다
    const c = user.role === 'admin' ? (db.comments[key] || null) : ((db.videosPub[key] || {}).comments || null);
    return send(req, res, 200, { items: (c && c.items) || [], at: (c && c.at) || null, videos: (c && c.videos) || 0 });
  }
  if (p === '/api/comments/fetch' && m === 'POST') {
    const user = need(req, res, 'admin'); if (!user) return;
    const b = await readJson(req);
    const key = str(b.campaign, 60);
    if (!CAMPAIGN_KEY.test(key)) return send(req, res, 400, { error: 'campaign 값이 올바르지 않습니다.' });
    const db = store.get();
    const prev = db.comments[key];
    if (prev && prev.at && Date.now() - new Date(prev.at).getTime() < COMMENT_COOLDOWN_MS)
      return send(req, res, 429, { error: 'cooldown', message: '방금 불러왔습니다. 잠시 후(1분 뒤) 다시 시도해주세요.' });
    const num = v => { const n = Number(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return isFinite(n) ? n : 0; };
    // 댓글이 많은 영상 순으로 최대 10개만(API 호출을 아끼기 위해)
    const targets = (db.videos[key] || [])
      .map(r => ({ r, vid: yt.videoId(r['영상 URL'] || r.url || r['URL'] || ''), n: num(r['댓글']) }))
      .filter(t => t.vid && t.n > 0).sort((a, b2) => b2.n - a.n).slice(0, COMMENT_MAX_VIDEOS);
    if (!targets.length) return send(req, res, 400, { error: '댓글을 불러올 영상이 없습니다. 영상 URL(유튜브)이 있고 댓글 수가 1개 이상인 영상이 필요합니다.' });
    const items = [];
    try {
      for (const t of targets) {
        const list = await yt.topComments(t.vid, COMMENT_PER_VIDEO);
        list.forEach(c => items.push({ text: str(c.text, 500), likes: c.likes, channel: str(t.r.name, 80), vid: t.vid, url: `https://www.youtube.com/watch?v=${t.vid}${c.id ? '&lc=' + encodeURIComponent(c.id) : ''}` }));
      }
    } catch (e) {
      if (e instanceof yt.YtError) return send(req, res, e.status, { error: e.message, code: e.code });
      throw e;
    }
    items.sort((a, b2) => b2.likes - a.likes);
    db.comments[key] = { at: new Date().toISOString(), videos: targets.length, items: items.slice(0, COMMENT_KEEP) };
    store.save();
    return send(req, res, 200, { items: db.comments[key].items, at: db.comments[key].at, videos: targets.length, pub: pubState(db, key) });
  }

  /* KOBIS(영화진흥위원회) 중계 — 영업 캘린더가 쓴다. 키는 서버 .env 에만 둔다 */
  if (p === '/api/kobis/movies' && m === 'GET') {
    const user = need(req, res, 'admin'); if (!user) return;
    const key = (process.env.KOBIS_API_KEY || '').trim();
    if (!key) return send(req, res, 503, { error: 'KOBIS API 키가 서버에 설정되어 있지 않습니다(.env 의 KOBIS_API_KEY).' });
    const qs = new URLSearchParams({ key });
    ['movieNm', 'openStartDt', 'openEndDt', 'itemPerPage', 'curPage'].forEach(k => {
      const v = url.searchParams.get(k);
      if (v !== null && /^[^\r\n&=]{0,60}$/.test(v)) qs.set(k, v);
    });
    let r;
    try { r = await fetch('https://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieList.json?' + qs, { signal: AbortSignal.timeout(15000) }); }
    catch (e) { return send(req, res, 502, { error: 'KOBIS 에 연결할 수 없습니다.' }); }
    if (!r.ok) return send(req, res, 502, { error: `KOBIS 오류(${r.status})` });
    let body = null; try { body = await r.json(); } catch (e) {}
    if (!body) return send(req, res, 502, { error: 'KOBIS 응답을 읽을 수 없습니다.' });
    return send(req, res, 200, body);
  }

  /* 짤 회원 메모 */
  if (p === '/api/zeal-memos' && m === 'GET') {
    const user = need(req, res, 'admin'); if (!user) return;
    const key = str(url.searchParams.get('key'), 80);
    return send(req, res, 200, { memos: store.get().zealMemos[key] || [] });
  }
  if (p === '/api/zeal-memos' && m === 'POST') {
    const user = need(req, res, 'admin'); if (!user) return;
    const b = await readJson(req);
    const key = str(b.key, 80), text = str(b.text, 2000);
    if (!key || !text) return send(req, res, 400, { error: '메모 내용을 입력해주세요.' });
    const db = store.get();
    const memo = { text, date: new Date().toISOString(), by: user.email };
    (db.zealMemos[key] = db.zealMemos[key] || []).unshift(memo); store.save();
    return send(req, res, 201, { memo, memos: db.zealMemos[key] });
  }

  /* 리포트 "자동 조회" — URL만 받아서 YouTube 에서 영상·채널 정보를 가져오고, 채널 ID(CID)로 짤 회원까지 조회 */
const kstParts = iso => { const d = new Date(new Date(iso).getTime() + 9 * 3600e3); const p = n => String(n).padStart(2, '0'); return `${p(d.getUTCFullYear() % 100)}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}`; };
const fmtSubs = n => n == null ? '비공개' : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(n);
const fmtDur = s => `${s}초`;

/* 조회수 갱신 — 캠페인×플랫폼 하루 1회(한국시간 자정에 초기화) */
  if (p === '/api/refresh' && m === 'POST') {
    const user = need(req, res, 'admin'); if (!user) return;
    const b = await readJson(req);
    const key = str(b.campaign, 60), plat = str(b.platform || 'all', 4);
    if (!CAMPAIGN_KEY.test(key) || !(plat === 'all' || PLATFORMS.includes(plat))) return send(req, res, 400, { error: '요청 값이 올바르지 않습니다.' });
    const db = store.get();
    const targets = plat === 'all' ? PLATFORMS : [plat];
    const today = todayKST();
    const results = {};
    for (const t of targets) {
      const logKey = `${key}:${t}`;
      if (db.refreshLog[logKey] === today) { results[t] = { status: 'limited' }; continue; }
      if (t !== 'yt') { results[t] = { status: 'unsupported', message: '인스타그램/틱톡은 아직 API가 연결되지 않았습니다.' }; continue; }
      const rows = (db.videos[key] || []).filter(r => rowPlat(r) === 'yt' && yt.videoId(r['영상 URL'] || r.url || r['URL'] || ''));
      if (!rows.length) { results[t] = { status: 'no_videos', message: '갱신할 YouTube 영상 URL이 없습니다(리포트에 "영상 URL" 열이 필요합니다).' }; continue; }
      try {
        const stats = await yt.videoStats(rows.map(r => yt.videoId(r['영상 URL'] || r.url || r['URL'])));
        let n = 0;
        rows.forEach(r => {
          const s = stats[yt.videoId(r['영상 URL'] || r.url || r['URL'])];
          if (!s) return;
          r['조회수'] = String(s.views); r['좋아요'] = String(s.likes); r['댓글'] = String(s.comments); n++;
        });
        db.refreshLog[logKey] = today; store.save();
        results[t] = { status: 'ok', requested: rows.length, updated: n };
      } catch (e) {
        if (e instanceof yt.YtError) return send(req, res, e.status, { error: e.message, code: e.code });
        throw e;
      }
    }
    const all = Object.values(results);
    if (all.every(r => r.status === 'limited')) return send(req, res, 429, { error: 'limit', nextAt: nextResetKST(), results });
    return send(req, res, 200, { results, rows: db.videos[key] || [], pub: pubState(db, key), nextAt: nextResetKST() });
  }

  /* 리포트 자동 조회: { campaign, urls:[...] } → 영상·채널(YouTube) + 짤 회원(CID) */
  if (p === '/api/report/lookup' && m === 'POST') {
    const user = need(req, res, 'admin'); if (!user) return;
    const b = await readJson(req);
    const key = str(b.campaign, 60);
    if (!CAMPAIGN_KEY.test(key)) return send(req, res, 400, { error: 'campaign 값이 올바르지 않습니다.' });
    const urls = [...new Set((Array.isArray(b.urls) ? b.urls : []).map(u => str(u, 500)).filter(Boolean))];
    if (!urls.length) return send(req, res, 400, { error: '조회할 URL이 없습니다.' });
    if (urls.length > 200) return send(req, res, 400, { error: 'URL은 한 번에 200개까지 조회할 수 있습니다.' });
    const failed = [];
    const items = [];   // {url, vid}
    const seen = new Set();
    urls.forEach(u => {
      const vid = yt.videoId(u);
      if (vid) { if (seen.has(vid)) failed.push({ url: u, reason: '같은 영상이 이미 목록에 있습니다.' }); else { seen.add(vid); items.push({ url: u, vid }); } return; }
      if (/instagram\.com|tiktok\.com/i.test(u)) failed.push({ url: u, reason: '인스타그램/틱톡은 아직 지원하지 않습니다(유튜브 영상 주소만 가능).' });
      else failed.push({ url: u, reason: '유튜브 영상 주소가 아닙니다.' });
    });
    let details = {}, chans = {}, zres = { members: {}, status: 'none', warning: '' };
    try {
      if (items.length) {
        details = await yt.videoDetails(items.map(i => i.vid));
        chans = await yt.channelStats(Object.values(details).map(d => d.channelId));
        zres = await zeal.lookup([...new Set(Object.values(details).map(d => d.channelId).filter(Boolean))]);
      }
    } catch (e) {
      if (e instanceof yt.YtError) return send(req, res, e.status, { error: e.message, code: e.code });
      throw e;
    }
    const rows = [];
    items.forEach(({ url, vid }) => {
      const d = details[vid];
      if (!d) { failed.push({ url, reason: 'YouTube에서 찾을 수 없습니다(삭제되었거나 비공개 영상).' }); return; }
      const ch = chans[d.channelId] || {};
      const eng = d.views ? ((d.likes + d.comments) / d.views * 100) : 0;
      rows.push({
        name: d.channelTitle || ch.name || '', '업로드일': kstParts(d.publishedAt), '구독자': fmtSubs(ch.subscribers),
        '영상 제목': d.title, '영상 길이': fmtDur(d.seconds), '조회수': String(d.views), '좋아요': String(d.likes), '댓글': String(d.comments),
        '참여율': eng.toFixed(1) + '%', '플랫폼': 'yt', '영상 URL': url, cid: d.channelId, handle: ch.handle || '',
        zeal: !!zres.members[d.channelId],
      });
    });
    // 조회만 한다(저장하지 않음) — 화면에서 '저장'을 누르면 POST /api/videos 로 기존 데이터를 교체한다
    const zealOut = {};
    rows.forEach(r => { const mem = zres.members[r.cid]; if (mem) zealOut[r.cid] = { id: mem.id, nick: mem.nick, phone: mem.phone, channels: mem.channels, note: mem.note }; });
    return send(req, res, 200, { rows, failed, zeal: zealOut, zealStatus: zres.status, zealWarning: zres.warning, total: urls.length });
  }

  /* 짤 회원 목록(관리자만) — 화면의 짤 배지/패널이 쓴다 */
  if (p === '/api/zeal/members' && m === 'GET') {
    const user = need(req, res, 'admin'); if (!user) return;
    return send(req, res, 200, { members: zeal.all(), live: zeal.liveConfigured() });
  }
  if (p === '/api/zeal/import' && m === 'POST') {
    const user = need(req, res, 'admin'); if (!user) return;
    const b = await readJson(req, 5 * 1024 * 1024);
    return send(req, res, 200, { imported: zeal.importMembers(b.members || b) });
  }

  /* YouTube 채널 조회 (CID 불러오기) */
  if (p === '/api/youtube/channels' && m === 'POST') {
    const user = need(req, res, 'admin'); if (!user) return;
    const b = await readJson(req);
    const cids = (Array.isArray(b.cids) ? b.cids : []).map(c => str(c, 30)).filter(c => /^UC[0-9A-Za-z_-]{22}$/.test(c));
    if (!cids.length) return send(req, res, 400, { error: '올바른 채널 ID(UC...)가 없습니다.' });
    try { return send(req, res, 200, { results: await yt.channelInfo(cids) }); }
    catch (e) { if (e instanceof yt.YtError) return send(req, res, e.status, { error: e.message, code: e.code }); throw e; }
  }

  return send(req, res, 404, { error: 'not found' });
}

const COMMENT_COOLDOWN_MS = Number(process.env.COMMENT_COOLDOWN_MS || 60000), COMMENT_MAX_VIDEOS = 10, COMMENT_PER_VIDEO = 5, COMMENT_KEEP = 30;

// 행의 플랫폼(yt/ig/tt). 값이 없거나 알 수 없으면 yt(현재 API 연동이 되는 유일한 플랫폼)로 본다
const PLAT_ALIAS = { '유튜브': 'yt', youtube: 'yt', yt: 'yt', '인스타그램': 'ig', '인스타': 'ig', instagram: 'ig', ig: 'ig', '틱톡': 'tt', tiktok: 'tt', tt: 'tt' };
const rowPlat = r => PLAT_ALIAS[String((r && (r['플랫폼'] || r.platform)) || '').trim().toLowerCase()] || 'yt';

// 공개본 상태: never(연동한 적 없음) / synced(작업본과 같음) / pending(연동 후 작업본이 바뀜)
function pubState(db, key) {
  const pub = db.videosPub[key];
  if (!pub) return { state: 'never', at: null };
  const same = JSON.stringify(pub.rows) === JSON.stringify(db.videos[key] || [])
    && JSON.stringify((pub.comments || {}).items || []) === JSON.stringify((db.comments[key] || {}).items || []);
  return { state: same ? 'synced' : 'pending', at: pub.at, count: pub.rows.length };
}

const server = http.createServer((req, res) => {
  route(req, res).catch(e => {
    if (e && e.status) return send(req, res, e.status, { error: e.message });
    console.error('[error]', req.method, req.url, e && e.message);
    send(req, res, 500, { error: '서버 오류가 발생했습니다.' });
  });
});

store.get();
const migrated = zeal.migrateLocalSnapshot();
server.listen(PORT, HOST, () => {
  console.log(`커넥트 백엔드 실행 중 → http://localhost:${PORT}  (접속 허용: ${HOST === '127.0.0.1' ? '이 컴퓨터만' : HOST})`);
  const weak = auth.weakAccounts();
  if (weak.length) console.log(`  ⚠ 짧은 비밀번호 계정이 있습니다(${weak.join(', ')}) — 로컬 테스트용으로만 쓰고, 서버를 공개하기 전에 바꾸세요.`);
  console.log(`  로그인 계정: ${auth.configured() ? '설정됨' : '없음(.env 필요)'}  ·  YouTube API: ${yt.configured() ? '설정됨' : '키 없음'}  ·  짤 어드민: ${zeal.liveConfigured() ? '직접 조회' : '연결 안 됨(저장된 목록만)'}`);
  if (migrated) console.log(`  짤 회원 ${migrated}명을 data-zeal.json 에서 가져왔습니다.`);
  console.log(`  허용 출처: ${ORIGINS.join(', ')}`);
});
process.on('SIGINT', () => { store.flushNow(); process.exit(0); });
process.on('SIGTERM', () => { store.flushNow(); process.exit(0); });

'use strict';
/* ============================================================
   짤(ZEAL) 회원 조회
   ------------------------------------------------------------
   채널 ID(CID) → 짤 회원 정보(닉네임·이메일·연락처·메모).
   조회 순서:
     1) 저장된 목록(db.zealMembers) — 수집 도구로 받은 data-zeal.json 을 가져오거나, 이전에 조회한 결과
     2) 짤 어드민 직접 조회(설정되어 있을 때만) — 어드민 API 2단계:
          /api/yt/list.php?search=<CID>              → 채널 + user_uid·user_id·user_name
          /api/member/zslist.php?search=uid=<uid>    → phone·memo
   어드민 주소/세션 쿠키는 .env (ZEAL_ADMIN_BASE / ZEAL_ADMIN_COOKIE) 에만 둔다.
   쿠키는 로그인이 만료되면 새로 복사해 넣어야 한다. 연락처 같은 개인정보라 로그에 남기지 않는다.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const store = require('./store');

const TTL_FOUND = 24 * 3600e3;    // 조회해 둔 회원 정보는 하루 뒤 다시 조회
const TTL_MISS = 3600e3;          // 못 찾은 CID 는 1시간 동안 다시 묻지 않는다
// 어드민 API 경로(/api/...)는 도메인 바로 뒤에서 시작하므로, 주소창의 전체 주소를 넣어도 도메인(origin)만 쓴다
const adminOrigin = raw => { try { return new URL(String(raw || '').trim()).origin; } catch (e) { return ''; } };
const cfg = () => ({ base: adminOrigin(process.env.ZEAL_ADMIN_BASE), cookie: (process.env.ZEAL_ADMIN_COOKIE || '').trim() });
const liveConfigured = () => { const c = cfg(); return !!(c.base && c.cookie); };

class ZealError extends Error { constructor(m, code) { super(m); this.code = code; } }

function fmtPhone(p) {
  const d = String(p == null ? '' : p).replace(/\D/g, '');
  let x = d; if (x.length === 10 && x[0] === '1') x = '0' + x;
  if (x.length === 11) return x.slice(0, 3) + '-' + x.slice(3, 7) + '-' + x.slice(7);
  if (x.length === 10) return x.slice(0, 3) + '-' + x.slice(3, 6) + '-' + x.slice(6);
  return x;
}

async function getJson(pathAndQuery) {
  const { base, cookie } = cfg();
  let res;
  try {
    res = await fetch(base + pathAndQuery, { headers: { Cookie: cookie, Accept: 'application/json' }, redirect: 'manual', signal: AbortSignal.timeout(10000) });
  } catch (e) { throw new ZealError('짤 어드민에 연결할 수 없습니다.', 'network'); }
  // 로그인이 풀리면 로그인 페이지로 넘기거나(3xx) 401/403 을 준다
  if ([301, 302, 303, 307, 308, 401, 403].includes(res.status)) throw new ZealError('짤 어드민 로그인이 만료되었습니다(.env 의 ZEAL_ADMIN_COOKIE 를 새로 넣어주세요).', 'auth');
  if (!res.ok) throw new ZealError(`짤 어드민 응답 오류(${res.status})`, 'upstream');
  try { return await res.json(); }
  catch (e) { throw new ZealError('짤 어드민 응답을 읽을 수 없습니다(로그인 만료일 수 있습니다).', 'auth'); }
}

async function liveLookup(cid) {
  const j = await getJson('/api/yt/list.php?page=0&filter=all&search=' + encodeURIComponent(cid));
  const y = (j.datas || [])[0];
  if (!y) return null;
  let mem = null;
  if (y.user_uid != null) {
    try {
      const m = await getJson('/api/member/zslist.php?page=0&size=5&sort=join_desc&permission_filter=all&search=' + encodeURIComponent('uid=' + y.user_uid));
      mem = (m.datas || [])[0] || null;
    } catch (e) { if (e.code === 'auth') throw e; }   // 회원 상세만 실패하면 채널 기준 정보까지만 저장
  }
  return {
    id: y.user_id || '', nick: y.user_name || '', phone: fmtPhone(mem && mem.phone),
    channels: [y.channel_id || cid], note: (mem && mem.memo) || '',
  };
}

// 한 번에 3개씩 조회
async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

/* 여러 CID 조회 → { members:{cid:{id,nick,phone,channels,note}}, status, warning } */
async function lookup(cids) {
  const db = store.get();
  db.zealMembers = db.zealMembers || {};
  db.zealMisses = db.zealMisses || {};
  const now = Date.now();
  const members = {};
  let warning = '';
  const need = [];
  const live = liveConfigured();
  [...new Set(cids)].forEach(cid => {
    const m = db.zealMembers[cid];
    const fresh = m && (m.fetchedAt === 0 || now - (m.fetchedAt || 0) < TTL_FOUND);   // 0 = 수집 도구에서 가져온 값(만료 없음)
    if (m && (fresh || !live)) { members[cid] = m; return; }       // 저장된 값 사용(어드민 미연결이면 오래된 값도 그대로)
    if (db.zealMisses[cid] && now - db.zealMisses[cid] < TTL_MISS) return;   // 최근에 못 찾은 CID
    if (live) need.push(cid);
  });
  if (live && need.length) {
    let authFailed = false;
    await pool(need, 3, async cid => {
      if (authFailed) return;
      try {
        const m = await liveLookup(cid);
        if (m) { db.zealMembers[cid] = { ...m, fetchedAt: now }; members[cid] = db.zealMembers[cid]; delete db.zealMisses[cid]; }
        else db.zealMisses[cid] = now;
      } catch (e) {
        if (e instanceof ZealError) { warning = e.message; if (e.code === 'auth') authFailed = true; }
        else throw e;
        // 실패했어도 예전에 저장해 둔 값이 있으면 그걸 쓴다
        if (db.zealMembers[cid]) members[cid] = db.zealMembers[cid];
      }
    });
    store.save();
  }
  const status = live ? (warning ? 'live-error' : 'live') : 'snapshot';
  if (!live && !Object.keys(members).length && cids.length) warning = '짤 어드민이 연결되어 있지 않아(.env) 저장된 회원 목록으로만 조회했습니다.';
  return { members, status, warning };
}

/* 수집 도구(data-zeal.json) 형식으로 목록 가져오기: { CID: {id,nick,phone,channels,note} } */
function importMembers(obj) {
  const db = store.get();
  db.zealMembers = db.zealMembers || {};
  let n = 0;
  Object.keys(obj || {}).slice(0, 5000).forEach(cid => {
    const m = obj[cid]; if (!/^UC[0-9A-Za-z_-]{22}$/.test(cid) || !m || typeof m !== 'object') return;
    db.zealMembers[cid] = {
      id: String(m.id || '').slice(0, 120), nick: String(m.nick || '').slice(0, 80), phone: String(m.phone || '').slice(0, 30),
      channels: Array.isArray(m.channels) ? m.channels.map(c => String(c).slice(0, 60)).slice(0, 20) : [cid],
      note: String(m.note || '').slice(0, 500), fetchedAt: 0,   // 0 = 수집 도구에서 가져온 값(자동 만료 없음)
    };
    n++;
  });
  store.save();
  return n;
}

// 처음 시작할 때 connect/data-zeal.json(로컬 수집본)이 있으면 한 번 가져온다
function migrateLocalSnapshot() {
  const db = store.get();
  if (db.zealMembers && Object.keys(db.zealMembers).length) return 0;
  const f = path.join(__dirname, '..', '..', 'connect', 'data-zeal.json');
  try { return importMembers(JSON.parse(fs.readFileSync(f, 'utf8'))); } catch (e) { return 0; }
}

const all = () => (store.get().zealMembers || {});
module.exports = { lookup, importMembers, migrateLocalSnapshot, liveConfigured, all, ZealError };

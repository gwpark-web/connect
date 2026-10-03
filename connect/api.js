/* ══ 백엔드 연결 ═══════════════════════════════════════════════════════════
   서버(connect-server)가 있으면 로그인·캠페인·리포트·조회수 갱신·YouTube 조회를 서버로 처리하고,
   서버가 없거나 주소를 모르면(예: 공개 정적 배포) 기존 데모 동작을 그대로 쓴다.
   · 주소: localhost 에서는 http://localhost:4000, 그 외에는 window.CONNECT_API_BASE 로 지정
           (지정하지 않으면 서버 기능이 꺼지고 데모로 동작한다)
   · 로그인 토큰은 sessionStorage(탭을 닫으면 사라짐)에 둔다.
   ══════════════════════════════════════════════════════════════════════ */
const Api = (function () {
  const host = location.hostname;
  const BASE = String(window.CONNECT_API_BASE || ((host === 'localhost' || host === '127.0.0.1') ? 'http://localhost:4000' : '')).replace(/\/$/, '');
  const SS = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) {} },
  };
  let token = SS.get('cs_token') || '';
  let user = null;
  try { user = JSON.parse(SS.get('cs_user') || 'null'); } catch (e) {}
  let up = null;   // 서버가 응답했는지(null = 아직 모름)

  function clear() { token = ''; user = null; SS.del('cs_token'); SS.del('cs_user'); }

  // 항상 {ok, status, data, error, down} 형태로 돌려준다(예외를 던지지 않는다)
  async function req(path, opt) {
    opt = opt || {};
    if (!BASE) return { ok: false, down: true, status: 0, error: '서버가 설정되어 있지 않습니다.' };
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    let res;
    try {
      res = await fetch(BASE + path, {
        method: opt.method || 'GET', headers, cache: 'no-store',
        body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined,
      });
    } catch (e) { up = false; return { ok: false, down: true, status: 0, error: '서버에 연결할 수 없습니다.' }; }
    up = true;
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (res.status === 401 && token) clear();          // 만료·변조된 토큰은 로그아웃 처리
    return { ok: res.ok, status: res.status, data: data, error: data && data.error };
  }

  async function ping() { const r = await req('/api/health'); return r.ok; }

  async function login(email, password) {
    const r = await req('/api/login', { method: 'POST', body: { email: email, password: password } });
    if (r.ok) { token = r.data.token; user = r.data.user; SS.set('cs_token', token); SS.set('cs_user', JSON.stringify(user)); }
    return r;
  }

  async function restore() {
    if (!token) return false;
    const r = await req('/api/me');
    if (r.ok) { user = r.data.user; SS.set('cs_user', JSON.stringify(user)); return true; }
    return false;
  }

  return {
    enabled: !!BASE, base: BASE, req: req, ping: ping, login: login, restore: restore, logout: clear,
    isUp: function () { return up === true; },
    isLoggedIn: function () { return !!token && !!user; },
    isAdmin: function () { return !!user && user.role === 'admin'; },
    user: function () { return user; },
  };
})();

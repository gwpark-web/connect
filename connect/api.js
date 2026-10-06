/* ══ 백엔드 연결 ═══════════════════════════════════════════════════════════
   서버(connect-server)가 있으면 로그인·캠페인·리포트·조회수 갱신·YouTube 조회를 서버로 처리하고,
   서버가 없거나 주소를 모르면(예: 공개 정적 배포) 기존 데모 동작을 그대로 쓴다.
   · 주소: localhost 에서는 http://localhost:4000, 그 외에는 window.CONNECT_API_BASE 로 지정
           (지정하지 않으면 서버 기능이 꺼지고 데모로 동작한다)
   · 공유용: 주소 뒤에 ?api=https://…trycloudflare.com 을 붙이면 그 서버에 연결한다(이 탭에서만, 다시 끄려면 ?api=off).
           남의 서버로 로그인 정보가 가지 않도록, 서버가 개인키로 서명한 신원 증명을 이 파일의 공개키로 검증한 뒤에만 연결한다.
   · 로그인 토큰은 sessionStorage(탭을 닫으면 사라짐)에 둔다.
   ══════════════════════════════════════════════════════════════════════ */
const Api = (function () {
  const host = location.hostname;
  const isLocalPage = host === 'localhost' || host === '127.0.0.1';
  // 서버 신원 확인용 공개키(비밀이 아니다) — 서버의 `node gen-identity.js` 가 보여 주는 값과 같아야 한다
  const SERVER_PUBKEY = 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAET6P8xu7wERhneqFVoJrgp0vNqD9O45QskXTU8sfoKe1XlsE2wyTaKpznroI8Vvp+/BqgINLTnq6OYiF+zDjglQ==';
  const SS = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) {} },
  };
  const BASE = String(window.CONNECT_API_BASE || SS.get('cs_api') || (isLocalPage ? 'http://localhost:4000' : '')).replace(/\/$/, '');

  // ── ?api= 로 받은 서버 주소 처리 ──
  // 허용: https 의 trycloudflare.com 주소(임시 터널). 이 컴퓨터에서 연 화면이면 localhost 도 허용(개발·시험용)
  function parseServer(v) {
    let u; try { u = new URL(v); } catch (e) { return null; }
    if (u.username || u.password) return null;
    if (u.protocol === 'https:' && /(^|\.)trycloudflare\.com$/i.test(u.hostname)) return u.origin;
    if (isLocalPage && u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return u.origin;
    return null;
  }
  const b64bytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  // 서버가 nonce 에 서명해 돌려준 값을 공개키로 검증한다. 실패·응답 없음은 모두 false
  async function verifyServer(origin) {
    try {
      const nonce = btoa(String.fromCharCode.apply(null, crypto.getRandomValues(new Uint8Array(16)))).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c]));
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 8000);
      const res = await fetch(origin + '/api/identity?nonce=' + nonce, { cache: 'no-store', signal: ctl.signal });
      clearTimeout(timer);
      if (!res.ok) return false;
      const d = await res.json();
      const key = await crypto.subtle.importKey('spki', b64bytes(SERVER_PUBKEY), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64bytes(d.sig), new TextEncoder().encode('connect-identity:' + nonce));
    } catch (e) { return false; }
  }
  function notice(msg) {
    console.warn('[connect] ' + msg);
    const show = function () {
      const el = document.createElement('div');
      el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99999;background:#1c1c1c;color:#fff;padding:10px 16px;border-radius:8px;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,.3);max-width:90vw';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 12000);
    };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }
  (function handleApiParam() {
    const params = new URLSearchParams(location.search);
    const raw = params.get('api');
    if (raw === null) return;
    params.delete('api');
    const q = params.toString();
    const cleanUrl = location.pathname + (q ? '?' + q : '') + location.hash;
    if (raw === 'off') { SS.del('cs_api'); SS.del('cs_token'); SS.del('cs_user'); location.replace(cleanUrl); return; }
    const origin = parseServer(raw);
    if (!origin) { notice('허용되지 않은 서버 주소라 연결하지 않았습니다(데모 모드).'); return; }
    verifyServer(origin).then(function (ok) {
      if (!ok) { notice('서버 신원을 확인하지 못해 연결하지 않았습니다(데모 모드).'); return; }
      if (SS.get('cs_api') !== origin) { SS.del('cs_token'); SS.del('cs_user'); }   // 다른 서버의 로그인은 이어가지 않는다
      SS.set('cs_api', origin);
      location.replace(cleanUrl);   // 주소창에서 ?api= 를 지우고 다시 불러온다(그때부터 연결 모드)
    });
  })();
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

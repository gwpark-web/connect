'use strict';
// 로그인과 토큰. 계정은 .env 에서 읽는다:
//   ADMIN_EMAIL / ADMIN_PASSWORD
//   ADVERTISERS = 이메일|비밀번호|브랜드명 ; 이메일|비밀번호|브랜드명 ...   (세미콜론으로 여러 개)
// 토큰은 HMAC-SHA256 서명 + 만료시간이 들어간 문자열이며 Authorization: Bearer 로 보낸다.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const store = require('./store');

const TTL_MS = 12 * 60 * 60 * 1000;

function secret() {
  if (process.env.TOKEN_SECRET) return process.env.TOKEN_SECRET;
  // .env 에 없으면 한 번 만들어 data/ 에 저장해 재시작해도 토큰이 유지되게 한다
  const f = path.join(store.DIR, 'secret.key');
  try { return fs.readFileSync(f, 'utf8').trim(); } catch (e) {}
  const s = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(store.DIR, { recursive: true });
  fs.writeFileSync(f, s, { mode: 0o600 });
  return s;
}

function accounts() {
  const list = [];
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    list.push({ email: process.env.ADMIN_EMAIL.trim().toLowerCase(), password: process.env.ADMIN_PASSWORD, role: 'admin', name: '관리자', brand: '' });
  }
  (process.env.ADVERTISERS || '').split(';').map(s => s.trim()).filter(Boolean).forEach(item => {
    const [email, password, brand] = item.split('|').map(s => (s || '').trim());
    if (email && password) list.push({ email: email.toLowerCase(), password, role: 'advertiser', name: brand || email, brand: brand || '' });
  });
  return list;
}

const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

function login(email, password) {
  const em = String(email || '').trim().toLowerCase();
  const found = accounts().find(a => a.email === em);
  // 계정이 없어도 비교를 한 번 수행해 응답 시간 차이로 계정 존재 여부가 드러나지 않게 한다
  const ok = safeEqual(password || '', found ? found.password : crypto.randomBytes(8).toString('hex'));
  if (!found || !ok) return null;
  return { email: found.email, role: found.role, name: found.name, brand: found.brand };
}

const b64 = buf => Buffer.from(buf).toString('base64url');

function sign(user) {
  const payload = b64(JSON.stringify({ ...user, exp: Date.now() + TTL_MS }));
  const sig = b64(crypto.createHmac('sha256', secret()).update(payload).digest());
  return `${payload}.${sig}`;
}

function verify(token) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig) return null;
  const expect = b64(crypto.createHmac('sha256', secret()).update(payload).digest());
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!data.exp || data.exp < Date.now()) return null;
  return { email: data.email, role: data.role, name: data.name, brand: data.brand };
}

function fromRequest(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? verify(m[1]) : null;
}

const configured = () => accounts().length > 0;
// 비밀번호가 8자 미만인 계정(시작할 때 경고용). 비밀번호 값은 내보내지 않고 계정 이름만 돌려준다.
// 비밀번호가 8자 미만인 계정인지(인터넷으로 들어오는 로그인을 막을 때 쓴다). 없는 계정은 false
const isWeak = email => { const em = String(email || '').trim().toLowerCase(); const f = accounts().find(a => a.email === em); return !!f && f.password.length < 8; };
const weakAccounts = () => accounts().filter(a => a.password.length < 8).map(a => a.email);

module.exports = { login, sign, fromRequest, configured, weakAccounts, isWeak };

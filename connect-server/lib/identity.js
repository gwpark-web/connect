'use strict';
// 서버 신원 증명 — 사이트가 주소창의 "?api=" 로 받은 서버 주소가 진짜 우리 서버인지 확인하는 데 쓴다.
// 서버만 개인키(.env 의 IDENTITY_PRIVATE_KEY)를 갖고, 사이트(api.js)에는 공개키만 들어 있다.
// 사이트가 보낸 임의 문자열(nonce)에 서명해 돌려주면 사이트가 공개키로 검증한다 → 남의 서버로 로그인 정보가 가는 것을 막는다.
const crypto = require('crypto');

// .env 값이 바뀌면 다시 읽는다(값이 같으면 캐시를 쓴다)
let cache = { raw: null, key: null };
function key() {
  const b64 = (process.env.IDENTITY_PRIVATE_KEY || '').trim();
  if (b64 === cache.raw) return cache.key;
  let k = null;
  if (b64) { try { k = crypto.createPrivateKey({ key: Buffer.from(b64, 'base64'), format: 'der', type: 'pkcs8' }); } catch (e) {} }
  cache = { raw: b64, key: k };
  return k;
}

const configured = () => !!key();
const publicKeyB64 = () => key() ? crypto.createPublicKey(key()).export({ type: 'spki', format: 'der' }).toString('base64') : '';
// 서명 대상은 접두어를 붙여 다른 용도의 서명과 섞이지 않게 한다. WebCrypto 가 읽는 r||s(ieee-p1363) 형식으로 낸다.
const sign = nonce => crypto.sign('sha256', Buffer.from('connect-identity:' + nonce), { key: key(), dsaEncoding: 'ieee-p1363' }).toString('base64');

function generate() {
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  return privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
}

module.exports = { configured, publicKeyB64, sign, generate };

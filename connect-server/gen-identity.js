'use strict';
// 서버 신원 키를 만들어 .env 에 넣는다(이미 있으면 그대로 두고 공개키만 보여준다).
// 실행: node gen-identity.js  → 출력된 공개키를 connect/api.js 의 SERVER_PUBKEY 에 붙인다(공개키는 비밀이 아니다).
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '.env');
let text = '';
try { text = fs.readFileSync(file, 'utf8'); } catch (e) {}
if (!/^IDENTITY_PRIVATE_KEY=.+/m.test(text)) {
  const id = require('./lib/identity');
  if (text && !text.endsWith('\n')) text += '\n';
  text += '\n# 서버 신원 증명용 개인키 — 절대 공유·커밋하지 마세요(공개키는 사이트 api.js 에 들어 있다)\nIDENTITY_PRIVATE_KEY=' + id.generate() + '\n';
  fs.writeFileSync(file, text);
  console.log('새 신원 키를 .env 에 만들었습니다.');
} else {
  console.log('.env 에 신원 키가 이미 있습니다.');
}
require('./lib/env').loadEnv();
console.log('공개키(api.js 의 SERVER_PUBKEY 에 넣을 값):\n' + require('./lib/identity').publicKeyB64());

'use strict';
// 디즈니+ '공개 예정 영화 및 시리즈' 페이지의 '공개 예정' 줄에서 신작을 읽어 영업 캘린더에 돌려준다.
//  - 목록: 페이지 HTML 에 이미 들어 있는 '공개 예정' 줄의 작품(로그인 불필요)
//  - 상세: 작품 페이지의 제목(…, 2026년 10월 30일, 디즈니+에서 공개)에서 공개일, '카테고리'(시리즈/영화)·장르를 읽는다
//  - 디즈니+ 에는 넷플릭스의 '한국 작품' 같은 표시가 없어서, 카테고리가 '시리즈'인 작품만 남긴다(영화는 극장 개봉으로 KOBIS 가 다룸)
const BASE = 'https://www.disneyplus.com';
const PAGE_URL = BASE + '/ko-kr/browse/page-36541dc7-6961-4bbb-a07b-ef97d7da7995';
const ROW_TITLE = '공개 예정';
const KEEP_CATEGORY = '시리즈';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const RESULT_TTL = 6 * 3600e3;
const CONCURRENCY = 3;

const detailCache = new Map();   // entity 경로 → { date, category, genre }
let result = null;
let inflight = null;

const unesc = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

async function getText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' }, signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}

// '공개 예정' 제목(h2) 아래 줄의 작품 링크만 모은다 — 같은 페이지의 '이번 주 새로운 에피소드'(이미 방영 중)·예고편 줄은 뺀다
function parseRow(html) {
  const out = [];
  const heads = [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)];   // 줄 제목들 — 제목 사이가 한 줄
  heads.forEach((h, i) => {
    if (unesc(h[1]).trim() !== ROW_TITLE) return;
    const seg = html.slice(h.index, i + 1 < heads.length ? heads[i + 1].index : undefined);
    const re = /aria-label="([^"]+)" href="(\/ko-kr\/browse\/entity-[0-9a-f-]{36})"/g;
    let m;
    while ((m = re.exec(seg))) if (!out.some(o => o.path === m[2])) out.push({ title: unesc(m[1]).trim(), path: m[2] });
  });
  return out;
}

async function fetchDetail(path) {
  const hit = detailCache.get(path);
  if (hit && hit.date) return hit;   // 날짜가 아직 없는(미정) 작품은 다음 갱신 때 다시 확인
  const html = await getText(BASE + path);
  const t = html.match(/<title[^>]*>([^<]*)<\/title>/);
  const title = t ? unesc(t[1]) : '';
  const d = title.match(/(\d{4})년 (\d{1,2})월 (\d{1,2})일, 디즈니\+에서 공개/);
  const ym = d ? null : title.match(/(\d{4})년 (\d{1,2})월, 디즈니\+에서 공개/);   // 월까지만 정해진 작품(날짜 미정)
  const cat = html.match(/"heading":"카테고리:","value":"([^"]+)"/);
  const gen = html.match(/"genres":\[([^\]]*)\]/);
  const detail = {
    date: d ? `${d[1]}-${String(d[2]).padStart(2, '0')}-${String(d[3]).padStart(2, '0')}` : '',
    when: d ? '' : (ym ? `${ym[1]}년 ${ym[2]}월` : '미정'),   // 정확한 날짜가 없을 때의 공개 시기 표시
    category: cat ? cat[1] : '',
    genre: gen ? (gen[1].match(/"([^"]+)"/g) || []).map(s => s.slice(1, -1)).join(', ') : '',
  };
  detailCache.set(path, detail);
  return detail;
}

async function build() {
  const list = parseRow(await getText(PAGE_URL));
  const items = [];
  let next = 0, failed = 0;
  const worker = async () => {
    while (next < list.length) {
      const it = list[next++];
      try {
        const d = await fetchDetail(it.path);
        if (d.category === KEEP_CATEGORY) items.push({ id: it.path.slice('/ko-kr/browse/entity-'.length), title: it.title, category: d.category, date: d.date, when: d.when, genre: d.genre, url: BASE + it.path });
      } catch (e) { failed++; }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  items.sort((a, b) => (a.date || '9').localeCompare(b.date || '9') || a.title.localeCompare(b.title, 'ko'));   // 날짜 미정은 맨 뒤
  return { at: new Date().toISOString(), total: list.length, failed, items };
}

async function upcomingSeries(force) {
  if (!force && result && Date.now() - Date.parse(result.at) < RESULT_TTL) return result;
  if (!inflight) inflight = build().then(r => { result = r; return r; }).finally(() => { inflight = null; });
  return inflight;
}

module.exports = { upcomingSeries };

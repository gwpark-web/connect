'use strict';
// 넷플릭스 신작(about.netflix.com/ko/new-to-watch) 중 "한국 작품"만 골라 돌려준다. 영업 캘린더가 쓴다.
//  - 목록: 신작 페이지가 쓰는 공개 데이터(/api/data/releases) — 제목·공개일·작품 번호
//  - 국가: 작품 상세 페이지(/kr/title/<번호>)의 '특징'에 적힌 "한국 작품" 글자를 본다(로그인 불필요)
// 상세 페이지는 작품마다 한 번만 읽고 메모리에 둔다(목록 결과도 6시간 캐시).
const LIST_URL = 'https://about.netflix.com/api/data/releases';
const TITLE_URL = 'https://www.netflix.com/kr/title/';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const RESULT_TTL = 6 * 3600e3;
const MAX_PAGES = 8;       // 목록 페이지 상한(한 달 ≈ 4쪽)
const CONCURRENCY = 4;     // 상세 페이지 동시 요청 수 — 넷플릭스 서버에 부담을 주지 않도록

const detailCache = new Map();   // videoID → { kr, genre, features, at }
let result = null;               // { at, items }
let inflight = null;

const unesc = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
const plain = s => unesc(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const kstDate = ms => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);

async function getText(url, lang) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': lang }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}

async function fetchList() {
  const out = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = JSON.parse(await getText(`${LIST_URL}?language=ko&page=${page}&country=KR`, 'ko-KR,ko;q=0.9'));
    (body.data || []).forEach(d => { if (d.videoID && d.startTime) out.push({ id: d.videoID, title: d.title1 || '', kind: d.title2 || '', date: kstDate(d.startTime) }); });
    if (page >= (body.totalPages || 1)) break;
  }
  return out;
}

// 상세 페이지의 <h4>장르</h4>·<h4>…특징:</h4> 바로 뒤 글자를 읽는다
async function fetchDetail(id) {
  const hit = detailCache.get(id);
  if (hit) return hit;
  const html = await getText(TITLE_URL + id, 'ko-KR,ko;q=0.9');
  const field = label => {
    const m = html.match(new RegExp('<h4[^>]*>\\s*' + label + '[^<]*</h4>\\s*(?:<span[^>]*>([\\s\\S]*?)</span>|<p[^>]*>([\\s\\S]*?)</p>)'));
    return m ? plain(m[1] || m[2] || '') : '';
  };
  const features = field('(?:시리즈|영화)?\\s*특징');
  const d = { kr: /한국 작품/.test(features), genre: field('장르'), features, at: Date.now() };
  detailCache.set(id, d);
  return d;
}

async function build() {
  const list = await fetchList();
  const items = [];
  let next = 0, failed = 0;
  const worker = async () => {
    while (next < list.length) {
      const it = list[next++];
      try {
        const d = await fetchDetail(it.id);
        if (d.kr) items.push({ id: String(it.id), title: it.title, kind: it.kind, date: it.date, genre: d.genre, features: d.features, url: TITLE_URL + it.id });
      } catch (e) { failed++; }   // 한 작품이 실패해도 나머지는 계속
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'ko'));
  return { at: new Date().toISOString(), total: list.length, failed, items };
}

// force=true 면 캐시를 무시하고 다시 읽는다(작품별 상세는 그대로 재사용)
async function koreanReleases(force) {
  if (!force && result && Date.now() - Date.parse(result.at) < RESULT_TTL) return result;
  if (!inflight) inflight = build().then(r => { if (!r.failed || r.items.length || !result) result = r; return result; }).finally(() => { inflight = null; });
  return inflight;
}

module.exports = { koreanReleases };

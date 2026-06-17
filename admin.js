// ── ROUTING ──
const pages = ['p5','p-detail-internal','p-detail-premium'];

function goBackToList() { goTo('p5'); }

function goTo(id) {
  pages.forEach(p => document.getElementById(p).classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
  if (id === 'p-detail-premium') renderChannels('pdpChTable');
}

// ── p5 캠페인 데이터 ──
const P5_SVG = {
  yt: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>`,
  ig: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>`,
  tt: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>`
};
const P5_PLATFORM_LABEL = { yt:'유튜브 쇼츠', ig:'인스타그램 릴스', tt:'틱톡' };
const P5_STATUS_LABEL   = { recruiting:'모집 중', channel:'채널 선정 중', ready:'오픈 준비중', active:'진행 중', done:'완료' };

const p5Filter = { client: 'ALL', product: 'ALL', platform: 'ALL' };

function switchPremiumTab(tab) {
  document.querySelectorAll('.pdp-tab').forEach((el, i) => el.classList.toggle('active', String(i+1) === String(tab)));
  document.querySelectorAll('.pdp-pane').forEach((el, i) => el.classList.toggle('active', String(i+1) === String(tab)));
  if (String(tab) === '2') renderChannels('pdpChTable');
}

function setP5Filter(type, value) {
  p5Filter[type] = value;
  renderP5();
}

let p5Campaigns = [
  { title:'영화 〈토이 스토리 5〉',              product:'조회수당', status:'done',    thumb:'img/toy_story5.jpg', thumbBg:'',                                           platforms:['yt'],      goalType:'조회수', goalValue:'500000', client:'월트디즈니 코리아',  assignee:'박건우', startDate:'2026-05-26', endDate:'2026-06-08', budget:'45000000', unitPrice:'90',    detailPage:'p-detail-internal' },
  { title:'시리즈 〈다 이루어질지니〉',            product:'프리미엄', status:'channel', thumb:'',                   thumbBg:'background:linear-gradient(160deg,#1a0828,#3d1060)', platforms:['yt','ig'], goalType:'조회수', goalValue:'300000', client:'카카오엔터테인먼트', assignee:'김현묵', startDate:'2026-05-01', endDate:'2026-06-30', budget:'32000000', unitPrice:'0',     detailPage:'p-detail-premium'  },
  { title:'EPEX — UNIVERSE 음원 바이럴 캠페인',  product:'업로드당', status:'ready',   thumb:'',                   thumbBg:'background:linear-gradient(160deg,#0a1628,#1a3060)', platforms:['yt','tt'], goalType:'영상수', goalValue:'2500',   client:'SM엔터테인먼트',      assignee:'박건우', startDate:'2026-06-15', endDate:'2026-07-15', budget:'18000000', unitPrice:'7200',  detailPage:'p-detail-internal' }
];

function renderP5() {
  const list = document.getElementById('p5CampaignList');
  if (!list) return;
  const filtered = p5Campaigns.filter(c =>
    (p5Filter.client  === 'ALL' || c.client  === p5Filter.client) &&
    (p5Filter.product === 'ALL' || c.product === p5Filter.product) &&
    (p5Filter.platform === 'ALL' || c.platforms.includes(p5Filter.platform))
  );
  if (!filtered.length) { list.innerHTML = '<div style="padding:40px;text-align:center;color:var(--gray-light);font-size:13px">조건에 맞는 캠페인이 없습니다.</div>'; return; }
  list.innerHTML = filtered.map((c, i) => {
    const i_orig = p5Campaigns.indexOf(c);
    const thumbHtml = c.thumb ? `<img src="${c.thumb}" alt="${c.title}">` : '';
    const thumbAttr = c.thumbBg ? ` style="${c.thumbBg}"` : '';
    const badges    = c.platforms.map(p => `<span class="platform-badge ${p}">${P5_SVG[p]} ${P5_PLATFORM_LABEL[p]}</span>`).join('');
    const goalStr   = Number(c.goalValue).toLocaleString() + (c.goalType === '조회수' ? '회' : '개');
    const budgetFmt = Number(c.budget).toLocaleString();
    const actionBtn = `<button class="card-btn primary" data-fn="goTo" data-args="${c.detailPage}" data-stop="1">상세 보기 →</button>`;
    return `
      <div class="campaign-card" data-fn="goTo" data-args="${c.detailPage}">
        <div class="card-thumb"${thumbAttr}>${thumbHtml}</div>
        <div class="card-left">
          <div class="card-product-tag">${c.product}</div>
          <div class="status-badge ${c.status}">${P5_STATUS_LABEL[c.status] || c.status}</div>
        </div>
        <div class="card-center">
          <div class="card-title">${c.title}</div>
          <div class="card-meta">
            <div class="card-platform-badges">${badges}</div>
            <div class="card-meta-goal">목표 <span>${goalStr}</span></div>
          </div>
          <div class="card-internal-row">
            <span class="card-internal-item">클라이언트 <strong>${c.client}</strong></span>
            <span class="card-internal-item">담당자 <strong>${c.assignee}</strong></span>
            <span class="card-internal-item">집행 금액 <strong>${budgetFmt}원</strong></span>
          </div>
        </div>
        <div class="card-right">
          <button class="card-btn secondary" data-fn="openP5Edit" data-args="${i_orig}" data-stop="1">수정</button>
          ${actionBtn}
        </div>
      </div>`;
  }).join('');
}

let p5EditIdx = -1;

function updateP5GoalUnit() {
  const isViews = document.getElementById('p5e-goal-views')?.checked;
  document.getElementById('p5e-goal-unit').textContent = isViews ? '회' : '개';
  const lbl = document.getElementById('p5e-unitprice-label');
  if (lbl) lbl.textContent = isViews ? '단가 (조회당)' : '단가 (영상당)';
}

function openP5Edit(idx) {
  p5EditIdx = parseInt(idx);
  const c = p5Campaigns[p5EditIdx];
  document.getElementById('p5e-title').value    = c.title;
  document.getElementById('p5e-product').value  = c.product;
  document.getElementById('p5e-client').value   = c.client;
  document.getElementById('p5e-assignee').value = c.assignee;
  document.getElementById('p5e-goal-val').value = Number(c.goalValue).toLocaleString();
  document.getElementById('p5e-start').value    = c.startDate;
  document.getElementById('p5e-end').value      = c.endDate || '';
  document.getElementById('p5e-status').value   = c.status;
  document.getElementById('p5e-budget').value    = Number(c.budget).toLocaleString();
  document.getElementById('p5e-unitprice').value  = Number(c.unitPrice || 0).toLocaleString();
  document.getElementById('p5e-platform').value   = c.platforms[0] || 'yt';
  document.getElementById('p5e-goal-views').checked = c.goalType === '조회수';
  document.getElementById('p5e-goal-vids').checked  = c.goalType === '영상수';
  updateP5GoalUnit();
  document.getElementById('p5EditModal').classList.add('active');
}

function closeP5Edit() {
  document.getElementById('p5EditModal').classList.remove('active');
  p5EditIdx = -1;
}

function saveP5Edit() {
  if (p5EditIdx < 0) return;
  const c = p5Campaigns[p5EditIdx];
  c.title     = document.getElementById('p5e-title').value.trim();
  c.product   = document.getElementById('p5e-product').value;
  c.client    = document.getElementById('p5e-client').value.trim();
  c.assignee  = document.getElementById('p5e-assignee').value;
  c.goalValue = document.getElementById('p5e-goal-val').value.replace(/,/g,'').replace(/[^0-9]/g,'');
  c.goalType  = document.getElementById('p5e-goal-views').checked ? '조회수' : '영상수';
  c.budget    = document.getElementById('p5e-budget').value.replace(/,/g,'').replace(/[^0-9]/g,'');
  c.unitPrice = document.getElementById('p5e-unitprice').value.replace(/,/g,'').replace(/[^0-9]/g,'');
  c.startDate = document.getElementById('p5e-start').value;
  c.endDate   = document.getElementById('p5e-end').value;
  c.status    = document.getElementById('p5e-status').value;
  c.platforms = [document.getElementById('p5e-platform').value];
  closeP5Edit();
  renderP5();
}

// ── 유튜브 댓글 분석기 ──
const YCA_YT_KEY     = 'AIzaSyCG1-LJtqq48N7713WR5bJr_hNusrS6q0g';
const YCA_CLAUDE_KEY = '799b73c1-e79f-4e6c-a63d-5de2cfd41c71';
let yca_allComments = [];

function ycaExtractVideoId(url) {
  for (const p of [/(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/, /^([a-zA-Z0-9_-]{11})$/]) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function ycaSetStatus(msg, isErr) {
  const el = document.getElementById('yca-status');
  el.textContent = msg;
  el.className = 'yca-status' + (isErr ? ' err' : '');
}

function ycaEscHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function ycaFetchComments() {
  const url      = document.getElementById('yca-urlInput').value.trim();
  const maxCount = parseInt(document.getElementById('yca-maxCount').value);
  if (!url) { ycaSetStatus('유튜브 URL을 입력해주세요.', true); return; }
  const videoId = ycaExtractVideoId(url);
  if (!videoId) { ycaSetStatus('유효한 유튜브 URL을 확인해주세요.', true); return; }

  document.getElementById('yca-fetchBtn').disabled = true;
  document.getElementById('yca-statsArea').style.display = 'none';
  document.getElementById('yca-analysisResult').style.display = 'none';
  yca_allComments = [];
  ycaSetStatus('댓글 수집 중...');

  const push = s => yca_allComments.push({
    author   : s.authorDisplayName,
    text     : s.textDisplay.replace(/<br>/g,'\n').replace(/<[^>]+>/g,'').replace(/@\S+\s*/g,'').trim(),
    likes    : s.likeCount || 0,
    published: s.publishedAt
  });

  try {
    let pageToken = '', threadsFetched = 0;
    while (threadsFetched < maxCount) {
      let apiUrl = 'https://www.googleapis.com/youtube/v3/commentThreads'
        + '?part=snippet,replies&videoId=' + videoId
        + '&maxResults=' + Math.min(100, maxCount - threadsFetched)
        + '&order=relevance&key=' + YCA_YT_KEY;
      if (pageToken) apiUrl += '&pageToken=' + pageToken;
      const data = await fetch(apiUrl).then(r => r.json());
      if (data.error) { ycaSetStatus('API 오류: ' + data.error.message, true); document.getElementById('yca-fetchBtn').disabled = false; return; }

      for (const item of (data.items || [])) {
        push(item.snippet.topLevelComment.snippet);

        const totalReplies  = item.snippet.totalReplyCount || 0;
        const inlineReplies = item.replies?.comments || [];

        if (totalReplies > 0) {
          if (totalReplies <= inlineReplies.length) {
            for (const r of inlineReplies) push(r.snippet);
          } else {
            // 인라인 개수보다 대댓글이 더 많으면 별도 API로 전체 수집
            const parentId = item.snippet.topLevelComment.id;
            let rToken = '';
            do {
              let rUrl = 'https://www.googleapis.com/youtube/v3/comments'
                + '?part=snippet&parentId=' + parentId
                + '&maxResults=100&key=' + YCA_YT_KEY;
              if (rToken) rUrl += '&pageToken=' + rToken;
              const rd = await fetch(rUrl).then(r => r.json());
              if (rd.error) break;
              for (const r of (rd.items || [])) push(r.snippet);
              rToken = rd.nextPageToken || '';
            } while (rToken);
          }
        }
      }

      threadsFetched += (data.items || []).length;
      ycaSetStatus(yca_allComments.length + '개 수집 중...');
      pageToken = data.nextPageToken || '';
      if (!pageToken || threadsFetched >= maxCount) break;
    }

    if (yca_allComments.length === 0) { ycaSetStatus('댓글이 없거나 댓글이 비활성화된 영상입니다.', true); document.getElementById('yca-fetchBtn').disabled = false; return; }
    const totalLikes = yca_allComments.reduce((a, c) => a + c.likes, 0);
    document.getElementById('yca-s-total').textContent = yca_allComments.length.toLocaleString();
    document.getElementById('yca-s-likes').textContent = totalLikes.toLocaleString();
    document.getElementById('yca-s-avg').textContent   = Math.round(totalLikes / yca_allComments.length);
    ycaRenderComments('top');
    document.getElementById('yca-statsArea').style.display = 'block';
    ycaSetStatus(yca_allComments.length + '개 댓글 수집 완료');
  } catch(e) {
    ycaSetStatus('네트워크 오류. 콘솔을 확인해주세요.', true);
    console.error(e);
  }
  document.getElementById('yca-fetchBtn').disabled = false;
}

function ycaRenderComments(sort) {
  const sorted = [...yca_allComments];
  if (sort === 'top')  sorted.sort((a,b) => b.likes - a.likes);
  if (sort === 'new')  sorted.sort((a,b) => new Date(b.published) - new Date(a.published));
  if (sort === 'long') sorted.sort((a,b) => b.text.length - a.text.length);
  document.getElementById('yca-commentList').innerHTML = sorted.map(c =>
    `<div class="yca-comment-item"><div class="yca-comment-meta"><span class="yca-comment-author">${ycaEscHtml(c.author)}</span><span class="yca-comment-likes">👍 ${c.likes.toLocaleString()}</span></div><div class="yca-comment-text">${ycaEscHtml(c.text)}</div></div>`
  ).join('');
}

function ycaSortComments(type) {
  document.querySelectorAll('[data-fn="ycaSortComments"]').forEach(b => b.classList.remove('on'));
  document.querySelector(`[data-fn="ycaSortComments"][data-args="${type}"]`)?.classList.add('on');
  ycaRenderComments(type);
}

function ycaSwitchTab(panelId) {
  document.querySelectorAll('.yca-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.yca-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-fn="ycaSwitchTab"][data-args="${panelId}"]`)?.classList.add('active');
  document.getElementById(panelId)?.classList.add('active');
}

async function ycaAnalyzeComments() {
  if (yca_allComments.length === 0) return;
  const btn = document.getElementById('yca-analyzeBtn');
  btn.disabled = true;
  btn.textContent = 'AI 분석 중...';
  ycaSetStatus('AI가 댓글을 분석하고 있습니다...');

  const top200 = [...yca_allComments].sort((a,b) => b.likes - a.likes).slice(0,200)
    .map((c,i) => `[${i+1}] (좋아요 ${c.likes}) ${c.text}`).join('\n');

  const prompt = `다음은 유튜브 영상의 댓글 ${yca_allComments.length}개 중 상위 댓글입니다.\n\n${top200}\n\n아래 형식의 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만:\n{\n  "positive": 긍정 댓글 비율(정수 퍼센트),\n  "neutral": 중립 댓글 비율(정수 퍼센트),\n  "negative": 부정 댓글 비율(정수 퍼센트),\n  "keywords": ["키워드1","키워드2","키워드3","키워드4","키워드5","키워드6","키워드7","키워드8"],\n  "summary": "댓글 전체 흐름과 주요 반응을 3~5문장으로 요약. 구체적인 내용 언급 필수.",\n  "insight": "콘텐츠 제작자나 마케터에게 유용한 인사이트와 시사점을 3~5문장으로 서술."\n}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key': YCA_CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:1000, messages:[{ role:'user', content:prompt }] })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error?.message || `HTTP ${resp.status}`);

    const raw    = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    const parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());

    document.getElementById('yca-a-pos').textContent = parsed.positive + '%';
    document.getElementById('yca-a-neu').textContent = parsed.neutral  + '%';
    document.getElementById('yca-a-neg').textContent = parsed.negative + '%';
    document.getElementById('yca-a-keywords').innerHTML = (parsed.keywords||[]).map(k=>`<span class="yca-kw-tag">#${ycaEscHtml(k)}</span>`).join('');
    document.getElementById('yca-a-summary').textContent = parsed.summary;
    document.getElementById('yca-a-insight').textContent = parsed.insight;
    document.getElementById('yca-analysisResult').style.display = 'block';
    ycaSetStatus('분석 완료');
  } catch(e) {
    ycaSetStatus('오류: ' + e.message, true);
    console.error(e);
  }
  btn.disabled = false;
  btn.textContent = 'AI로 다시 분석하기';
}

// ── INIT ──
renderP5();
goTo('p5');

// ── EVENT DISPATCHER (MV3 CSP: no inline handlers) ──
(function() {
  const fnMap = {
    goTo, goBackToList,
    toggleCh,
    openP5Edit, closeP5Edit, saveP5Edit, setP5Filter, switchPremiumTab,
    ycaFetchComments, ycaSortComments, ycaSwitchTab, ycaAnalyzeComments
  };

  document.addEventListener('change', function(e) {
    const el = e.target.closest('select[data-filter-type]');
    if (!el) return;
    setP5Filter(el.dataset.filterType, el.value);
  });

  document.addEventListener('click', function(e) {
    const el = e.target.closest('[data-fn],[data-toggle],[data-fileinput]');
    if (!el) return;

    if (el.dataset.stop) e.stopPropagation();

    if (el.dataset.fileinput) {
      document.getElementById(el.dataset.fileinput).click();
      return;
    }
    if (el.dataset.toggle) {
      el.classList.toggle(el.dataset.toggle);
      return;
    }
    const fn = fnMap[el.dataset.fn];
    if (!fn) return;
    const args = el.dataset.args ? el.dataset.args.split('|') : [];
    fn(...args);
  });

  document.addEventListener('change', function(e) {
    const el = e.target;
    if (!el.dataset.change) return;
    if (el.dataset.change === 'updateP5GoalUnit') { updateP5GoalUnit(); return; }
  });
})();

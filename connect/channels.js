// ── 채널 데이터 ──────────────────────────────────────────────────────
const channels = [
  { emoji:'🎬', name:'궁금해소',   handle:'@궁금해소',       cat:'엔터테인먼트', platform:'yt', subsNum:997000,  subs:'99.7만', views:'85만',  rate:12.4, repeat:4 },
  { emoji:'🍜', name:'평양냉면',   handle:'@pyeongyang',     cat:'엔터테인먼트', platform:'yt', subsNum:350000,  subs:'35만',   views:'42만',  rate:9.8,  repeat:0 },
  { emoji:'🌊', name:'지우멍',     handle:'@jiwumung',       cat:'커뮤니티·썰', platform:'yt', subsNum:125000,  subs:'12.5만', views:'18만',  rate:14.2, repeat:2 },
  { emoji:'😸', name:'확고냥쇼츠', handle:'@hwakgocat',      cat:'엔터테인먼트', platform:'yt', subsNum:67000,   subs:'6.7만',  views:'9만',   rate:11.1, repeat:0 },
  { emoji:'🎤', name:'쇼쇼짱',     handle:'@showshowjjang',  cat:'음악',         platform:'ig', subsNum:24000,   subs:'2.4만',  views:'3.2만', rate:8.7,  repeat:1 },
  { emoji:'👗', name:'패피소희',   handle:'@fashionsohi',    cat:'패션·뷰티',   platform:'ig', subsNum:180000,  subs:'18만',   views:'22만',  rate:13.5, repeat:0 },
  { emoji:'🎮', name:'겜쟁이남자', handle:'@gameman',        cat:'게임·IT',      platform:'yt', subsNum:440000,  subs:'44만',   views:'61만',  rate:10.2, repeat:3 },
  { emoji:'🍳', name:'요리하는곰', handle:'@cooking_bear',   cat:'음식·요리',   platform:'yt', subsNum:270000,  subs:'27만',   views:'38만',  rate:15.1, repeat:0 },
  { emoji:'💪', name:'헬스왕김씨', handle:'@healthking',     cat:'운동·헬스',   platform:'tt', subsNum:91000,   subs:'9.1만',  views:'13만',  rate:11.8, repeat:1 },
  { emoji:'📱', name:'썰전쟁',     handle:'@ssul_wars',      cat:'커뮤니티·썰', platform:'yt', subsNum:530000,  subs:'53만',   views:'71만',  rate:16.3, repeat:0 },
  { emoji:'🌸', name:'뷰티일기',   handle:'@beauty_diary',   cat:'패션·뷰티',   platform:'ig', subsNum:112000,  subs:'11.2만', views:'14만',  rate:12.9, repeat:2 },
  { emoji:'🎵', name:'뮤직박스',   handle:'@musicbox_kr',    cat:'음악',         platform:'yt', subsNum:83000,   subs:'8.3만',  views:'11만',  rate:9.4,  repeat:0 },
];

const GOAL = 30;
let _chActiveTab = 0;

// ── 짤 회원 데이터 (플랫폼 서버 연동 가정) ──────────────────────────
const ZEAL_MEMBERS = {
  '@궁금해소':    { id:'gung9@zeal.kr',     nick:'궁해소',   phone:'010-2341-5678', channels:['@궁금해소'],                 note:'VIP · 재참여 2회' },
  '@jiwumung':    { id:'jiwu@zeal.kr',       nick:'지우멍',   phone:'010-9876-1234', channels:['@jiwumung'],                  note:'' },
  '@gameman':     { id:'gameman@zeal.kr',    nick:'겜쟁남',   phone:'010-5555-7890', channels:['@gameman','@gameman_shorts'], note:'재참여 3회' },
  '@ssul_wars':   { id:'ssul@zeal.kr',       nick:'썰전쟁',   phone:'010-1111-3344', channels:['@ssul_wars'],                 note:'' },
  '@fashionsohi': { id:'sohi2@zeal.kr',      nick:'패피소희', phone:'010-7788-2211', channels:['@fashionsohi','@sohi_ig'],    note:'패션 카테고리 전문' },
};

function zealBadgeHtml(handle) {
  if (ZEAL_MEMBERS[handle]) {
    const enc = encodeURIComponent(handle);
    return `<button class="zeal-badge zeal-badge--member" data-fn="openZealPanel" data-stop="1" data-args="${enc}">짤</button>`;
  }
  return `<span class="zeal-badge zeal-badge--none">-</span>`;
}

// ── 짤 회원 사이드패널 함수 (channels.js에서 공유 — admin/site 양쪽) ──
function openZealPanel(keyEnc) {
  const handle = decodeURIComponent(keyEnc);
  const m = ZEAL_MEMBERS[handle];
  if (!m) return;
  document.getElementById('zealPanelNick').textContent     = m.nick;
  document.getElementById('zealPanelId').textContent       = m.id;
  document.getElementById('zealPanelPhone').textContent    = m.phone;
  document.getElementById('zealPanelChannels').textContent = m.channels.join(', ');
  document.getElementById('zealPanelNote').textContent     = m.note || '-';
  document.getElementById('zealPanelHandle').value         = handle;
  _renderZealMemoHistory(handle);
  document.getElementById('zealSheet').removeAttribute('hidden');
}

function closeZealPanel() {
  const el = document.getElementById('zealSheet');
  if (el) el.setAttribute('hidden', '');
}

function saveZealMemo() {
  const handle = document.getElementById('zealPanelHandle').value;
  const ta = document.getElementById('zealMemoInput');
  const text = (ta.value || '').trim();
  if (!text) return;
  const key = 'zealMemo:' + handle;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(key) || '[]'); } catch(_) {}
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}.${pad(now.getMonth()+1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  history.unshift({ text, date: dateStr });
  try { localStorage.setItem(key, JSON.stringify(history)); } catch(_) {}
  ta.value = '';
  _renderZealMemoHistory(handle);
}

function _renderZealMemoHistory(handle) {
  const el = document.getElementById('zealMemoHistory');
  if (!el) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem('zealMemo:' + handle) || '[]'); } catch(_) {}
  if (!history.length) {
    el.innerHTML = '<div class="zeal-memo-empty">작성된 메모가 없습니다.</div>';
    return;
  }
  el.innerHTML = history.map(h => `
    <div class="zeal-memo-item">
      <div class="zeal-memo-date">${h.date}</div>
      <div class="zeal-memo-text">${h.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>
    </div>
  `).join('');
}

// ── 채널별 검토용 영상 더미 데이터 (드라이브 링크) ──────────────────
const CH_VIDEO = {
  0: { url: 'https://drive.google.com/file/d/dummy_0/view', title: '궁금해소 × 토이스토리5 공식 협업 영상', dur: '12:34' },
  2: { url: 'https://drive.google.com/file/d/dummy_2/view', title: '지우멍 × 토이스토리5 브이로그 영상',  dur: '8:17'  },
  6: { url: 'https://drive.google.com/file/d/dummy_6/view', title: '겜쟁이남자 × 토이스토리5 협업 영상', dur: '15:02' },
  9: { url: null }, // 영상 준비 중
};

// ── 채널별 배포 링크 더미 데이터 (게시물 URL + 업로드 시각) ─────────────
// TODO: 어드민 구축 시 API 응답으로 대체
const CH_POST = {
  0:  { url: 'https://www.youtube.com/shorts/dR7kGv2x3Hs', uploadedAt: '2025-07-18 10:30' },
  1:  { url: 'https://www.youtube.com/shorts/pLm4nQ8rWZo', uploadedAt: '2025-07-18 14:20' },
  2:  { url: 'https://www.youtube.com/shorts/tKc9bJ6vNxY', uploadedAt: '2025-07-19 09:15' },
  3:  { url: 'https://www.youtube.com/shorts/aHs5mR2pQeL', uploadedAt: '2025-07-19 11:00' },
  4:  { url: 'https://www.instagram.com/reel/Cxk7mNpWqR8/', uploadedAt: '2025-07-19 15:30' },
  5:  { url: 'https://www.instagram.com/reel/Dyk9pLqVwS3/', uploadedAt: '2025-07-20 08:30' },
  6:  { url: 'https://www.youtube.com/shorts/gVr3hM7nBwP', uploadedAt: '2025-07-20 11:45' },
  7:  { url: 'https://www.youtube.com/shorts/jFq8sN4mCkE', uploadedAt: '2025-07-20 14:20' },
  8:  { url: 'https://www.tiktok.com/@healthking/video/7259384710234', uploadedAt: '2025-07-21 10:00' },
  9:  { url: 'https://www.youtube.com/shorts/nWx2vB6kHrT', uploadedAt: '2025-07-21 13:15' },
  10: { url: 'https://www.instagram.com/reel/Ezp4qMsRtU7/', uploadedAt: '2025-07-22 09:00' },
  11: { url: 'https://www.youtube.com/shorts/oBn5tC9jLqM', uploadedAt: '2025-07-22 12:30' },
};

// 시뮬레이션: 초기 게시물 등록 완료 채널 인덱스 (관리자 미구축으로 클라이언트 토글)
// TODO: 어드민 구축 시 서버 상태로 대체
let _simPosted = new Set([0, 6]);

// ── 채널별 수정 요청 히스토리 (더미: 시간순 누적) ────────────────────
const chRevisions = {
  0: [
    { round: 1, ts: '2025-07-14 14:32', text: '인트로 부분 브랜드 로고 노출 시간이 짧습니다. 3초 이상으로 늘려주세요.' },
  ],
  6: [
    { round: 1, ts: '2025-07-10 11:15', text: '제품 클로즈업 씬이 누락되었습니다. 편집본에 추가 부탁드립니다.' },
    { round: 2, ts: '2025-07-12 16:48', text: '브랜드 멘션 타이밍이 영상 초반으로 당겨져야 합니다. 1분 이내 언급 부탁드려요.' },
  ],
};

// ── 상태 ─────────────────────────────────────────────────────────────
const chState = {};
channels.forEach((_, i) => { chState[i] = 'pending'; });

const chReviewState = {}; // '최종 확정 중'→'제작 중'→'검토 필요'→[수정시]'수정 중'→'검토 필요'→[승인]'업로드 대기'→'업로드 완료'

// ── 데모 초기 상태 (탭2·탭3 바로 확인 가능하도록 일부 시딩) ─────────────
[0, 2, 5, 6, 9, 11].forEach(i => { chState[i] = 'selected'; chReviewState[i] = '승인 완료'; });
[1, 3, 4, 7].forEach(i => { chState[i] = 'selected'; chReviewState[i] = '제작 중'; });

let _chChecked      = new Set();
let _chPendingIdx   = null;
let _chReviewIdx    = null; // 영상 검토 모달 대상 채널 인덱스
let _chFilterStatus = '';
let _chReviewFilter = '';
let _chSort         = 'subs';
let _chSortDir      = 'desc';

// ── 유틸 ──────────────────────────────────────────────────────────────
function fmtSubs(n) {
  if (n >= 1000000) { const v = n / 1000000; return parseFloat(v.toFixed(1)) + 'M'; }
  if (n >= 1000)    { const v = n / 1000;    return parseFloat(v.toFixed(1)) + 'K'; }
  return String(n);
}

// ── 플랫폼 아이콘 ─────────────────────────────────────────────────────
const PLAT_ICON = {
  yt: `<span class="ch-plat-icon ch-plat-icon--yt" title="유튜브">
    <svg viewBox="0 0 20 14" width="18" height="13" fill="none">
      <rect width="20" height="14" rx="4" fill="#FF0000"/>
      <polygon points="8,3.5 8,10.5 14.5,7" fill="#fff"/>
    </svg>
  </span>`,
  ig: `<span class="ch-plat-icon ch-plat-icon--ig" title="인스타그램"></span>`,
  tt: `<span class="ch-plat-icon ch-plat-icon--tt" title="틱톡">
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
      <rect width="20" height="20" rx="5" fill="#010101"/>
      <path d="M13.5 4.5c.3 1.8 1.5 2.8 3 3v2.2c-1.1 0-2.1-.4-3-1v4.3a4 4 0 1 1-2.5-3.7V11.5a2 2 0 1 0 1.5 1.9V4.5h1z" fill="#fff"/>
    </svg>
  </span>`,
};
function platBadge(p) { return PLAT_ICON[p] || `<span class="ch-plat-icon">${p}</span>`; }

// ── ER 바 ─────────────────────────────────────────────────────────────
function erBar(rate) {
  const pct = Math.min(rate / 20 * 100, 100).toFixed(1);
  const cls = rate >= 12 ? 'hi' : rate >= 8 ? 'mid' : 'lo';
  return `<div class="ch-er-wrap">
    <div class="ch-er-bar-bg"><div class="ch-er-bar-fill ch-er-bar-fill--${cls}" style="width:${pct}%"></div></div>
    <span class="ch-er-val ch-er-val--${cls}">${rate.toFixed(1)}%</span>
  </div>`;
}

// ── 정렬·필터된 인덱스 ───────────────────────────────────────────────
function filteredIndices() {
  let list = channels.map((ch, i) => ({ ch, i }));
  if (_chFilterStatus) list = list.filter(({ i }) => chState[i] === _chFilterStatus);

  const d = _chSortDir === 'asc' ? 1 : -1;
  list.sort((a, b) => {
    let diff = 0;
    if      (_chSort === 'repeat') diff = (a.ch.repeat || 0) - (b.ch.repeat || 0);
    else if (_chSort === 'views')  diff = parseFloat(a.ch.views) - parseFloat(b.ch.views);
    else if (_chSort === 'rate')   diff = a.ch.rate - b.ch.rate;
    else                           diff = a.ch.subsNum - b.ch.subsNum;
    return diff * d;
  });
  return list;
}

// ── 테이블 렌더 ──────────────────────────────────────────────────────
function renderChannels() {
  const tbody = document.getElementById('chTable');
  if (!tbody) return;

  const list = filteredIndices();
  const rcEl = document.getElementById('chResultCount');
  if (rcEl) rcEl.textContent = `${list.length}개 채널`;

  const selCount = Object.values(chState).filter(s => s === 'selected').length;
  const isMaxed  = selCount >= GOAL;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--gray-light)">검색 결과가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(({ ch, i }) => {
    const state = chState[i];
    const rowCls = state === 'selected' ? 'ch-row--selected' : state === 'rejected' ? 'ch-row--rejected' : '';

    const canCheck = state === 'pending' && !isMaxed;
    const isChecked = _chChecked.has(i);
    const checkCell = `<td class="ch-check-cell">
      <input type="checkbox" class="ch-row-check" data-fn="toggleChCheck" data-args="${i}"
        ${!canCheck && !isChecked ? 'disabled' : ''}
        ${isChecked ? 'checked' : ''}>
    </td>`;

    let actionHtml = '';
    if (state === 'pending') {
      actionHtml = `<button class="ch-action-btn ch-action-select" data-fn="openChSelectModal" data-args="${i}">선정</button><button class="ch-action-btn ch-action-reject" data-fn="rejectCh" data-args="${i}">반려</button>`;
    } else if (state === 'selected') {
      actionHtml = `<span class="ch-action-done">✓ 선정됨</span>`;
    } else {
      actionHtml = `<span class="ch-action-rej">반려됨</span><button class="ch-undo-btn" data-fn="undoCh" data-args="${i}">되돌리기</button>`;
    }

    return `
      <tr class="${rowCls}" id="chtr${i}">
        ${checkCell}
        <td style="text-align:center;padding:0 4px">${platBadge(ch.platform)}</td>
        <td>
          <div class="ch-cell">
            <div class="ch-thumb">${ch.emoji}</div>
            <div>
              <div class="ch-name">${ch.name}</div>
              <div class="ch-handle">${ch.handle}</div>
            </div>
          </div>
        </td>
        <td style="text-align:center"><span class="cat-tag">${ch.cat}</span></td>
        <td class="n-cell">${fmtSubs(ch.subsNum)}</td>
        <td class="n-cell">${ch.views}<div class="n-sub">평균</div></td>
        <td>${erBar(ch.rate)}</td>
        <td style="text-align:center">${ch.repeat ? `<span class="ch-hist-val ch-hist-val--on">${ch.repeat}</span>` : `<span class="ch-hist-val ch-hist-val--off">-</span>`}</td>
        <td style="text-align:center">${zealBadgeHtml(ch.handle)}</td>
        <td class="ch-action-cell">${actionHtml}</td>
      </tr>`;
  }).join('');
}

// ── 탭 전환 ──────────────────────────────────────────────────────────
function chSwitchTab(idx) {
  _chActiveTab = Number(idx);
  document.querySelectorAll('.ch-tab-card').forEach((el, i) => {
    el.classList.toggle('ch-tab-card--active', i === _chActiveTab);
  });
  [0, 1, 2].forEach(i => {
    const p = document.getElementById(`chPanel${i}`);
    if (p) p.style.display = i === _chActiveTab ? '' : 'none';
  });
}

// ── 요약 갱신 ────────────────────────────────────────────────────────
function updateChSummary() {
  const selCount  = Object.values(chState).filter(s => s === 'selected').length;
  const pendCount = Object.values(chState).filter(s => s === 'pending').length;

  // 완료 배너
  const bannerEl = document.getElementById('chCompleteBanner');
  if (bannerEl) bannerEl.style.display = selCount >= GOAL ? '' : 'none';

  // ① 탭 히어로 숫자
  const heroSel = document.getElementById('chTabHeroSel');
  if (heroSel) heroSel.textContent = selCount;
  // ② 탭 히어로 + 분포
  const rvCounts = { '최종 확정 중': 0, '제작 중': 0, '검토 필요': 0, '수정 중': 0, '승인 완료': 0 };
  channels.forEach((_, i) => {
    if (chState[i] === 'selected') {
      const rs = chReviewState[i] || '최종 확정 중';
      if (rvCounts[rs] !== undefined) rvCounts[rs]++;
    }
  });
  const hero2 = document.getElementById('chTabHero2Sel');
  if (hero2) hero2.textContent = rvCounts['검토 필요'];
  const eConf = document.getElementById('chT2Confirming');
  const eProd = document.getElementById('chT2Producing');
  const eDone = document.getElementById('chT2Done');
  if (eConf) eConf.textContent = `최종 확정 중 ${rvCounts['최종 확정 중']}`;
  if (eProd) eProd.textContent = `제작 중 ${rvCounts['제작 중']}`;
  if (eDone) eDone.textContent = `승인 ${rvCounts['승인 완료']}`;

  // 플랫폼별 선정 수 (분포 텍스트)
  const platSel = { yt: 0, ig: 0, tt: 0 };
  channels.forEach((ch, i) => {
    if (chState[i] === 'selected') platSel[ch.platform] = (platSel[ch.platform] || 0) + 1;
  });
  const ytEl = document.getElementById('chBdYtNum');
  const igEl = document.getElementById('chBdIgNum');
  const ttEl = document.getElementById('chBdTtNum');
  if (ytEl) ytEl.textContent = platSel.yt || 0;
  if (igEl) igEl.textContent = platSel.ig || 0;
  if (ttEl) ttEl.textContent = platSel.tt || 0;

  renderReviewPanel();
  renderResultPanel();
}

// ── 검토 현황 패널 ────────────────────────────────────────────────────
const REVIEW_ORDER = ['최종 확정 중', '제작 중', '검토 필요', '수정 중'];
const REVIEW_BADGE_CLS = {
  '최종 확정 중': 'ch-rv-badge--confirming',
  '제작 중':      'ch-rv-badge--producing',
  '검토 필요':    'ch-rv-badge--needcheck',
  '수정 중':      'ch-rv-badge--revision',
};
const PLAT_LABEL = { yt: 'YT', ig: 'IG', tt: 'TT' };

function renderReviewPanel() {
  const container = document.getElementById('chReviewList');
  if (!container) return;

  const isAdmin = document.body.dataset.viewerRole === 'admin';

  // 상태별 카운트 집계
  const counts = { '': 0, '최종 확정 중': 0, '제작 중': 0, '검토 필요': 0, '수정 중': 0 };
  channels.forEach((_, i) => {
    if (chState[i] === 'selected' && (chReviewState[i] || '최종 확정 중') !== '승인 완료') {
      const rs = chReviewState[i] || '최종 확정 중';
      counts['']++;
      if (counts[rs] !== undefined) counts[rs]++;
    }
  });

  // 칩 카운트 텍스트 + 비활성 처리
  const CHIP_LABELS = { '': '전체', '최종 확정 중': '최종 확정 중', '제작 중': '제작 중', '검토 필요': '검토 필요', '수정 중': '수정 중' };
  document.querySelectorAll('#chReviewChipsRow .ch-chip').forEach(btn => {
    const key = btn.dataset.args || '';
    const cnt = counts[key] ?? 0;
    btn.textContent = cnt > 0 ? `${CHIP_LABELS[key]} ${cnt}` : CHIP_LABELS[key];
    btn.classList.toggle('ch-chip--active', key === _chReviewFilter);
    btn.classList.toggle('ch-chip--zero', cnt === 0 && key !== '');
  });

  const allItems = channels
    .map((ch, i) => ({ ch, i }))
    .filter(({ i }) => chState[i] === 'selected' && (chReviewState[i] || '최종 확정 중') !== '승인 완료')
    .sort((a, b) => {
      const oa = REVIEW_ORDER.indexOf(chReviewState[a.i] || '최종 확정 중');
      const ob = REVIEW_ORDER.indexOf(chReviewState[b.i] || '최종 확정 중');
      return oa - ob;
    });

  const items = _chReviewFilter
    ? allItems.filter(({ i }) => (chReviewState[i] || '최종 확정 중') === _chReviewFilter)
    : allItems;

  // 총계 카운트
  const cntEl = document.getElementById('chReviewResultCount');
  if (cntEl) cntEl.textContent = `${items.length}개 채널`;

  if (!items.length) {
    container.innerHTML = `<div class="ch-placeholder">
      <div class="ch-placeholder-icon">📋</div>
      <div class="ch-placeholder-title">검토 현황</div>
      <div class="ch-placeholder-desc">채널을 선정하면 여기서 크리에이터별 진행 상황을 확인할 수 있습니다.</div>
    </div>`;
    return;
  }

  container.innerHTML = items.map(({ ch, i }) => {
    const rs = chReviewState[i] || '최종 확정 중';
    const badgeCls = REVIEW_BADGE_CLS[rs] || '';
    const SIM_BTN = {
      '최종 확정 중': `<button class="ch-rv-sim-btn" data-fn="advanceReviewState" data-args="${i}">관리자 확정 →</button><button class="ch-rv-sim-btn ch-rv-sim-btn--reject" data-fn="creatorRejectCh" data-args="${i}">크리에이터 거절</button>`,
      '제작 중':      `<button class="ch-rv-sim-btn" data-fn="advanceReviewState" data-args="${i}">검토 요청 →</button><button class="ch-rv-sim-btn ch-rv-sim-btn--reject" data-fn="creatorRejectCh" data-args="${i}">반려</button>`,
      '검토 필요':    `<button class="ch-rv-review-btn" data-fn="openReviewModal" data-args="${i}">영상 검토</button>`,
      '수정 중':      `<button class="ch-rv-sim-btn" data-fn="advanceReviewState" data-args="${i}">재제작 완료 →</button>`,
    };
    const simBtns = SIM_BTN[rs] || `<span class="ch-rv-sim-inactive">진행 중</span>`;
    return `<div class="ch-rv-item">
      <div class="ch-rv-left">
        <div class="ch-thumb">${ch.emoji}</div>
        <div class="ch-rv-info">
          <div class="ch-rv-name">${ch.name}${ZEAL_MEMBERS[ch.handle] ? ' <span class="zeal-rv-badge">짤</span>' : ''}</div>
          <div class="ch-rv-meta">${ch.handle} · ${PLAT_LABEL[ch.platform] || ch.platform} · 구독자 ${fmtSubs(ch.subsNum)}</div>
        </div>
      </div>
      <span class="ch-rv-badge ${badgeCls}">${rs}</span>
      ${isAdmin ? `<div class="ch-rv-sim"><span class="ch-rv-sim-label">시뮬</span>${simBtns}</div>` : ''}
    </div>`;
  }).join('');
}

// ── 결과 패널 렌더 ────────────────────────────────────────────────────
function renderResultPanel() {
  const container = document.getElementById('chResultContent');
  if (!container) return;

  const isAdmin = document.body.dataset.viewerRole === 'admin';

  const doneItems = channels
    .map((ch, i) => ({ ch, i }))
    .filter(({ i }) => chState[i] === 'selected' && chReviewState[i] === '승인 완료');

  const doneCount = doneItems.length;
  const postedCount = doneItems.filter(({ i }) => _simPosted.has(i)).length;
  const pct = GOAL > 0 ? Math.round(postedCount / GOAL * 100) : 0;

  // 탭3 카드 카운트 + 뱃지 갱신
  const hero3 = document.getElementById('chTabHero3Sel');
  if (hero3) hero3.textContent = postedCount;
  const badge3 = document.getElementById('chTab3Badge');
  if (badge3) {
    const isDone = postedCount >= GOAL;
    badge3.textContent = isDone ? '완료' : '진행 중';
    badge3.className = isDone ? 'ch-tab3-badge ch-tab3-badge--done' : 'ch-tab3-badge ch-tab3-badge--progress';
  }

  // 헤더 액션 버튼 + 뱃지 갱신
  const headerActions = document.getElementById('chHeaderActions');
  const campaignBadge = document.getElementById('chCampaignBadge');
  if (headerActions) headerActions.style.display = doneCount > 0 ? '' : 'none';
  if (campaignBadge) {
    campaignBadge.textContent = doneCount > 0 ? '결과 단계' : '진행 중';
    campaignBadge.className   = doneCount > 0 ? 'cd-badge done' : 'cd-badge running';
  }

  if (!doneCount) {
    container.innerHTML = `<div class="ch-placeholder">
      <div class="ch-placeholder-icon">📊</div>
      <div class="ch-placeholder-title">캠페인 결과</div>
      <div class="ch-placeholder-desc">승인된 영상이 생기면 결과 리포트가 표시됩니다.</div>
    </div>`;
    return;
  }

  const tableRows = doneItems.map(({ ch, i }) => {
    const post = CH_POST[i];
    const isPosted = _simPosted.has(i);
    const postCell = isPosted
      ? `<div class="ch-result-post-cell">
           <a class="ch-result-link" href="${post?.url || '#'}" target="_blank" rel="noopener">게시물 보기 →</a>
           ${isAdmin ? `<button class="ch-sim-btn ch-sim-btn--on" data-fn="toggleSimPost" data-args="${i}">✓ 등록됨</button>` : ''}
         </div>`
      : `<div class="ch-result-post-cell">
           <span class="ch-result-wait">업로드전</span>
           ${isAdmin ? `<button class="ch-sim-btn ch-sim-btn--off" data-fn="toggleSimPost" data-args="${i}">+ 등록</button>` : ''}
         </div>`;
    const vidUrl = (post?.url && post.url !== '#') ? post.url : '';
    return `<tr>
      <td class="vid-cb-td"><input type="checkbox" class="vid-row-cb" data-cid="${encodeURIComponent(ch.handle)}" data-url="${vidUrl}"></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">${ch.emoji}</span>
          <div>
            <div style="font-weight:600;font-size:12px;color:var(--gray-dark)">${ch.name}</div>
            <div style="font-size:11px;color:var(--gray-light)">${ch.handle}</div>
          </div>
        </div>
      </td>
      <td style="text-align:center;padding:0 4px">${platBadge(ch.platform)}</td>
      <td style="text-align:center">${postCell}</td>
      <td style="text-align:right;font-size:12px;color:var(--gray-light)">집계 예정</td>
      <td style="text-align:right;font-size:12px;color:var(--gray-light)">집계 예정</td>
      <td style="text-align:right;font-size:12px;color:var(--gray-light)">집계 예정</td>
      <td style="text-align:center">${zealBadgeHtml(ch.handle)}</td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <div class="cd-report-row">

      <div class="cd-result-card">
        ${pct >= 100 ? '<div class="cd-result-badge">🏆 영상 목표 달성!</div>' : ''}
        <div class="cd-result-hero">${pct}%</div>
        <div class="cd-result-list">
          <div class="cd-result-item">
            <span class="cd-result-lbl">목표 영상 수</span>
            <span class="cd-result-val">${GOAL}개</span>
          </div>
          <div class="cd-result-item">
            <span class="cd-result-lbl">게시물 등록 완료</span>
            <span class="cd-result-val cd-result-val--accent">${postedCount}개</span>
          </div>
          <div class="cd-result-item">
            <span class="cd-result-lbl">달성 조회수</span>
            <span class="cd-result-val" style="opacity:.6;font-size:12px">집계 예정</span>
          </div>
          <div class="cd-result-item" style="border-bottom:none">
            <span class="cd-result-lbl">집행 금액</span>
            <span class="cd-result-val">₩150,000,000</span>
          </div>
        </div>
      </div>

      <div class="cd-timeline-card">
        <div class="cd-timeline-head">리포트 타임라인 <span class="cd-timeline-period">성과 집계 예정</span></div>
        <div class="cd-tl-progress">
          <div class="cd-tl-prog-track">
            <div class="cd-tl-prog-fill" style="width:${pct >= 100 ? 84 : 0}%"></div>
            <div class="cd-tl-marker" style="left:25%">
              <div class="cd-tl-marker-dot"></div>
              <div class="cd-tl-marker-lbl">1차</div>
              <div class="cd-tl-marker-tip">1차 · 전체 완료 시점</div>
            </div>
            <div class="cd-tl-marker" style="left:70%">
              <div class="cd-tl-marker-dot"></div>
              <div class="cd-tl-marker-lbl">2차</div>
              <div class="cd-tl-marker-tip">2차 · 완료 2주 후</div>
            </div>
            <div class="cd-tl-marker cd-tl-marker--final" style="left:100%">
              <div class="cd-tl-marker-dot"></div>
              <div class="cd-tl-marker-lbl">최종</div>
              <div class="cd-tl-marker-tip">최종 · 완료 4주 후</div>
            </div>
          </div>
        </div>
        <div class="cd-tl-list">
          <div class="cd-tl-row">
            <div class="cd-tl-num">1</div>
            <div class="cd-tl-info">
              <div class="cd-tl-title">1차 <span class="cd-tl-pct">집계 예정</span></div>
              <div class="cd-tl-meta">전체 승인 완료 시점 기준</div>
            </div>
          </div>
          <div class="cd-tl-row">
            <div class="cd-tl-num">2</div>
            <div class="cd-tl-info">
              <div class="cd-tl-title">2차 <span class="cd-tl-pct">집계 예정</span></div>
              <div class="cd-tl-meta">완료 2주 후 기준</div>
            </div>
          </div>
          <div class="cd-tl-row cd-tl-row--final">
            <div class="cd-tl-num cd-tl-num--final">🏆</div>
            <div class="cd-tl-info">
              <div class="cd-tl-title">최종 <span class="cd-tl-pct">집계 예정</span></div>
              <div class="cd-tl-meta">완료 4주 후 기준</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div class="vid-card">
      <div class="vid-card-head">
        참여 영상
        ${isAdmin ? `<div class="vid-head-actions">
          <button class="cd-btn cd-btn-excel vid-refresh-btn" data-fn="refreshViewCounts"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>조회수 갱신</button>
          <button class="cd-btn cd-btn-edit" data-fn="openReportUploadModal"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>리포트 업로드</button>
        </div>` : ''}
      </div>
      <div class="vid-stat-strip">
        <div class="vid-stat-col">
          <div class="vid-stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="m9 9 6 3-6 3V9z" fill="currentColor" stroke="none"/></svg>
          </div>
          <div class="vid-stat-num vid-stat-num--accent">${doneCount}</div>
          <div class="vid-stat-lbl">완료 영상</div>
        </div>
        <div class="vid-stat-col">
          <div class="vid-stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg>
          </div>
          <div class="vid-stat-num" style="font-size:13px;color:var(--gray-light)">집계 예정</div>
          <div class="vid-stat-lbl">총 조회수</div>
        </div>
        <div class="vid-stat-col">
          <div class="vid-stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <div class="vid-stat-num" style="font-size:13px;color:var(--gray-light)">집계 예정</div>
          <div class="vid-stat-lbl">총 좋아요</div>
        </div>
        <div class="vid-stat-col">
          <div class="vid-stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="vid-stat-num" style="font-size:13px;color:var(--gray-light)">집계 예정</div>
          <div class="vid-stat-lbl">총 댓글</div>
        </div>
      </div>
      ${isAdmin ? `<div class="ch-sim-notice">
        <span class="ch-sim-notice-icon">🔧</span>
        게시물 등록은 관리자가 설정합니다 · 아래 [+ 등록] 버튼은 표시 시뮬레이션용입니다
      </div>` : ''}
      <div class="vid-table-wrap">
        <table class="vid-table" data-vid-mode="premium">
          <thead>
            <tr>
              <th class="vid-cb-th"><input type="checkbox" class="vid-select-all" aria-label="전체선택"></th>
              <th style="min-width:140px">채널</th>
              <th style="text-align:center;width:50px">플랫폼</th>
              <th style="text-align:center;min-width:160px">게시물 (관리자 등록)</th>
              <th style="text-align:right;width:72px">조회수</th>
              <th style="text-align:right;width:64px">좋아요</th>
              <th style="text-align:right;width:52px">댓글</th>
              <th style="text-align:center;width:52px">짤</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>`;
}

// ── 관리자 확정 시뮬레이션 (더미 토글) ──────────────────────────────
const ADVANCE_MAP = { '최종 확정 중': '제작 중', '제작 중': '검토 필요', '수정 중': '검토 필요' };

function advanceReviewState(idx) {
  const i = Number(idx);
  if (chState[i] !== 'selected') return;
  const cur = chReviewState[i] || '최종 확정 중';
  const next = ADVANCE_MAP[cur];
  if (next) chReviewState[i] = next;
  updateChSummary(); // renderReviewPanel + 탭 카드 ② 분포 갱신
}

// ── 크리에이터 거절 시뮬레이션 (더미 토글) ──────────────────────────
function creatorRejectCh(idx) {
  const i = Number(idx);
  if (chState[i] !== 'selected') return;
  chState[i] = 'rejected';
  delete chReviewState[i];
  renderChannels();
  updateChSummary();
}

// ── 토스트 ───────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'ch-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('ch-toast--show'));
  setTimeout(() => {
    t.classList.remove('ch-toast--show');
    setTimeout(() => t.remove(), 280);
  }, 2500);
}

// ── 영상 검토 모달 ────────────────────────────────────────────────────
function openReviewModal(idx) {
  _chReviewIdx = Number(idx);
  const ch = channels[_chReviewIdx];
  if (!ch) return;

  // 헤더
  const nameEl = document.getElementById('chRvModalName');
  const metaEl = document.getElementById('chRvModalMeta');
  if (nameEl) nameEl.textContent = ch.name;
  if (metaEl) metaEl.textContent = `${ch.handle} · ${PLAT_LABEL[ch.platform] || ch.platform}`;

  // 영상 영역
  const vd = CH_VIDEO[_chReviewIdx];
  const videoBox = document.getElementById('chRvVideoBox');
  if (videoBox) {
    if (vd && vd.url) {
      videoBox.innerHTML = `
        <div class="ch-rv-video-info">
          <div class="ch-rv-video-title">${vd.title}</div>
          <div class="ch-rv-video-dur">${vd.dur}</div>
        </div>
        <a class="ch-rv-video-link" href="${vd.url}" target="_blank" rel="noopener">영상 보기 →</a>`;
    } else {
      videoBox.innerHTML = `
        <div class="ch-rv-video-none">
          <span class="ch-rv-video-link ch-rv-video-link--disabled">영상 보기 →</span>
          <span class="ch-rv-video-pending">영상 준비 중</span>
        </div>`;
    }
  }

  // 수정 요청 히스토리
  const histBox = document.getElementById('chRvHistBox');
  if (histBox) {
    const revs = chRevisions[_chReviewIdx];
    if (revs && revs.length) {
      histBox.style.display = '';
      histBox.innerHTML = `<div class="ch-rv-hist-title">수정 요청 내역</div>` +
        revs.map(r => `<div class="ch-rv-hist-item">
          <div class="ch-rv-hist-meta">
            <span class="ch-rv-hist-round">${r.round}차 요청</span>
            <span class="ch-rv-hist-ts">${r.ts}</span>
          </div>
          <div class="ch-rv-hist-text">${r.text}</div>
        </div>`).join('');
    } else {
      histBox.style.display = 'none';
    }
  }

  // 수정 요청 입력 영역 초기화
  const revBox  = document.getElementById('chRvRevisionBox');
  const ta      = document.getElementById('chRvRevisionText');
  if (revBox) revBox.style.display = 'none';
  if (ta)    { ta.value = ''; ta.addEventListener('input', _onRevisionInput); }
  _setRevisionFooter(false);

  const modal = document.getElementById('chReviewModal');
  if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function _onRevisionInput() {
  const btn = document.getElementById('chRvFooterSubmit');
  if (btn) btn.disabled = !this.value.trim();
}

function _setRevisionFooter(revMode) {
  const normal   = document.getElementById('chRvFooterNormal');
  const revision = document.getElementById('chRvFooterRevision');
  if (normal)   normal.style.display   = revMode ? 'none' : '';
  if (revision) revision.style.display = revMode ? ''     : 'none';
}

function closeReviewModal() {
  const modal = document.getElementById('chReviewModal');
  if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
  const ta = document.getElementById('chRvRevisionText');
  if (ta) ta.removeEventListener('input', _onRevisionInput);
  _chReviewIdx = null;
}

function approveReview() {
  if (_chReviewIdx === null) return;
  chReviewState[_chReviewIdx] = '승인 완료';
  closeReviewModal();
  updateChSummary();
  showToast('승인되었습니다');
}

function requestRevision() {
  const box = document.getElementById('chRvRevisionBox');
  if (!box) return;
  box.style.display = '';
  _setRevisionFooter(true);
  const ta = document.getElementById('chRvRevisionText');
  if (ta) ta.focus();
}

function cancelRevision() {
  const box = document.getElementById('chRvRevisionBox');
  if (box) box.style.display = 'none';
  const ta = document.getElementById('chRvRevisionText');
  if (ta) ta.value = '';
  const btn = document.getElementById('chRvFooterSubmit');
  if (btn) btn.disabled = true;
  _setRevisionFooter(false);
}

function submitRevision() {
  const ta = document.getElementById('chRvRevisionText');
  if (!ta || !ta.value.trim()) return;
  if (_chReviewIdx === null) return;
  const text = ta.value.trim();
  if (!chRevisions[_chReviewIdx]) chRevisions[_chReviewIdx] = [];
  const round = chRevisions[_chReviewIdx].length + 1;
  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  chRevisions[_chReviewIdx].push({ round, ts, text });
  chReviewState[_chReviewIdx] = '수정 중';
  closeReviewModal();
  updateChSummary();
  showToast('수정 요청이 전달되었습니다');
}

// ── 게시물 등록 시뮬레이션 토글 ─────────────────────────────────────────
// TODO: 어드민 구축 시 POST /api/result/:channelId/register 로 대체
function toggleSimPost(idx) {
  const i = Number(idx);
  if (_simPosted.has(i)) _simPosted.delete(i);
  else _simPosted.add(i);
  renderResultPanel();
}

// ── 컬럼 정렬 토글 ───────────────────────────────────────────────────
const SORT_KEYS = ['subs', 'views', 'rate', 'repeat'];

function chSortBy(key) {
  if (_chSort === key) {
    _chSortDir = _chSortDir === 'desc' ? 'asc' : 'desc';
  } else {
    _chSort = key;
    _chSortDir = 'desc';
  }
  updateSortArrows();
  renderChannels();
}

function updateSortArrows() {
  SORT_KEYS.forEach(k => {
    const el = document.getElementById(`chSortArr-${k}`);
    if (!el) return;
    if (k === _chSort) {
      el.textContent = _chSortDir === 'desc' ? '↓' : '↑';
      el.classList.add('ch-sort-arrow--active');
    } else {
      el.textContent = '↕';
      el.classList.remove('ch-sort-arrow--active');
    }
  });
}

// ── 체크박스 & 벌크 선정 ────────────────────────────────────────────
function toggleChCheck(idx) {
  const i = Number(idx);
  if (chState[i] !== 'pending') return;

  if (_chChecked.has(i)) {
    _chChecked.delete(i);
  } else {
    const selCount = Object.values(chState).filter(s => s === 'selected').length;
    if (selCount + _chChecked.size >= GOAL) {
      alert(`최대 ${GOAL}개까지 선정 가능합니다.\n현재 선정: ${selCount}개, 선택 중: ${_chChecked.size}개`);
      return;
    }
    _chChecked.add(i);
  }
  updateChActionBar();
  renderChannels();
}

function updateChActionBar() {
  const bar   = document.getElementById('chBulkBar');
  const label = document.getElementById('chBulkLabel');
  if (!bar) return;
  if (_chChecked.size > 0) {
    bar.style.display = '';
    if (label) label.textContent = `${_chChecked.size}개 선택됨`;
  } else {
    bar.style.display = 'none';
  }
}

function selectChecked() {
  if (_chChecked.size === 0) return;
  const selCount = Object.values(chState).filter(s => s === 'selected').length;
  if (selCount + _chChecked.size > GOAL) {
    alert(`최대 ${GOAL}개까지 선정 가능합니다.\n현재 선정 ${selCount}개 + 선택 ${_chChecked.size}개 = ${selCount + _chChecked.size}개`);
    return;
  }
  const countEl = document.getElementById('chModalCount');
  const listEl  = document.getElementById('chModalList');
  if (countEl) countEl.textContent = _chChecked.size;
  if (listEl) {
    listEl.innerHTML = [..._chChecked].sort((a, b) => a - b).map(i => {
      const ch = channels[i];
      return `<div class="ch-modal-row">
        <div class="ch-modal-emoji">${ch.emoji}</div>
        <div>
          <div class="ch-modal-name">${ch.name}</div>
          <div class="ch-modal-meta">${ch.handle} · 구독자 ${fmtSubs(ch.subsNum)}</div>
        </div>
      </div>`;
    }).join('');
  }
  const modal = document.getElementById('chSelectModal');
  if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

// ── 단일 채널 선정 모달 ──────────────────────────────────────────────
function openChSelectModal(idx) {
  _chPendingIdx = Number(idx);
  const ch = channels[_chPendingIdx];
  if (!ch) return;
  const thumbEl = document.getElementById('chSingleThumb');
  const nameEl  = document.getElementById('chSingleName');
  const metaEl  = document.getElementById('chSingleMeta');
  if (thumbEl) thumbEl.textContent = ch.emoji;
  if (nameEl)  nameEl.textContent  = ch.name;
  if (metaEl)  metaEl.textContent  = `${ch.handle} · ${ch.cat} · 구독자 ${fmtSubs(ch.subsNum)}`;
  const modal = document.getElementById('chSingleModal');
  if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeSingleModal() {
  const modal = document.getElementById('chSingleModal');
  if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
  _chPendingIdx = null;
}

function confirmChSelect() {
  if (_chPendingIdx === null) return;
  const selCount = Object.values(chState).filter(s => s === 'selected').length;
  if (selCount >= GOAL) { closeSingleModal(); return; }
  chState[_chPendingIdx] = 'selected';
  chReviewState[_chPendingIdx] = '최종 확정 중';
  _chChecked.delete(_chPendingIdx);
  closeSingleModal();
  updateChActionBar();
  renderChannels();
  updateChSummary();
}

function closeChSelectModal() {
  const modal = document.getElementById('chSelectModal');
  if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
}

function confirmChSelectMulti() {
  [..._chChecked].forEach(i => { chState[i] = 'selected'; chReviewState[i] = '최종 확정 중'; });
  _chChecked.clear();
  closeChSelectModal();
  updateChActionBar();
  renderChannels();
  updateChSummary();
}

function clearChecked() {
  _chChecked.clear();
  updateChActionBar();
  renderChannels();
}

// ── 개별 액션 ────────────────────────────────────────────────────────
function rejectCh(idx) {
  const i = Number(idx);
  _chChecked.delete(i);
  chState[i] = 'rejected';
  updateChActionBar();
  renderChannels();
  updateChSummary();
}

function undoCh(idx) {
  const i = Number(idx);
  if (chState[i] !== 'rejected') return; // 선정 취소 불가, 반려만 되돌리기 가능
  chState[i] = 'pending';
  renderChannels();
  updateChSummary();
}

// ── 상태 필터 칩 ─────────────────────────────────────────────────────
function chSetStatus(val) {
  _chFilterStatus = val || '';
  document.querySelectorAll('#chPanel0 .ch-chip').forEach(btn => {
    btn.classList.toggle('ch-chip--active', (btn.dataset.args || '') === _chFilterStatus);
  });
  renderChannels();
}

function chSetReviewStatus(val) {
  _chReviewFilter = val || '';
  renderReviewPanel();
}

// ── p-list 프리미엄 카드 진행률 갱신 ─────────────────────────────────
function updateListCardPremium() {
  const progressWrap = document.getElementById('premiumCardProgress');
  const statusHint   = document.getElementById('premiumCardHint');
  const fillEl       = document.getElementById('premiumProgressFill');
  const textEl       = document.getElementById('premiumProgressText');
  if (!progressWrap || !statusHint) return;

  const doneCount = channels.reduce((n, _, i) =>
    n + (chState[i] === 'selected' && chReviewState[i] === '승인 완료' ? 1 : 0), 0);

  progressWrap.style.display = '';
  statusHint.style.display   = 'none';

  const pct     = Math.round(doneCount / GOAL * 100);
  const fillPct = Math.min(pct, 100);
  if (fillEl) fillEl.style.width = `${fillPct}%`;
  if (textEl) {
    const pctCls  = pct >= 100 ? 'card-progress-pct over' : 'card-progress-pct';
    const pctSpan = `<span class="${pctCls}">(${pct}%)</span>`;
    textEl.innerHTML = `${doneCount} / ${GOAL}개 ${pctSpan}`;
  }
}

// ── 조회수 갱신 (API / 크롤링 연동 예정) ──────────────────────────────
// TODO: GET /api/result/:campaignId/views 응답으로 테이블 행 업데이트
function refreshViewCounts() {
  const TODAY = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const LAST_KEY = 'cs_refresh_last';

  if (localStorage.getItem(LAST_KEY) === TODAY) {
    // 오늘 이미 갱신 완료 → 제한 모달 표시
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const nextEl = document.getElementById('refreshNextTime');
    if (nextEl) {
      nextEl.textContent = '다음 갱신 가능 시간: ' + tomorrow.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) + ' 오전 12:00';
    }
    const modal = document.getElementById('refreshLimitModal');
    if (modal) modal.classList.add('open');
    return;
  }

  const btn = document.querySelector('.vid-refresh-btn');
  if (!btn || btn.disabled) return;
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '갱신 중…';
  // 연동 전 1.2s 로딩 시뮬레이션
  setTimeout(() => {
    localStorage.setItem(LAST_KEY, TODAY);
    btn.disabled = false;
    btn.innerHTML = orig;
    // 연동 완료 후: renderResultPanel() 또는 개별 행 업데이트
  }, 1200);
}

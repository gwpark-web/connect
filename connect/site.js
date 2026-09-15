try { emailjs.init('PR1yiM-fDVGYx5wCo'); } catch(e) { console.warn('EmailJS init failed', e); }

// ── ROUTING ──
const pages = ['p1','p3','p4','p-list','p-channels','p-detail','p-detail-upload','p-detail-empty','p-admin'];
const authPages = ['p-brochure'];
const navMap = { p1:'nav-p1', p3:'nav-p3' };
const ctaPages = ['p-channels'];
const p0ActivePages = ['p1','p3','p4'];
const DETAIL_PAGES = ['p-detail', 'p-detail-upload', 'p-channels', 'p-detail-empty'];

// ── 캠페인 카드 정렬 (광고주 p-list · 관리자 p-admin 공통) ──────────────────

// 진행 상황 우선순위 — 작을수록 왼쪽. 진행 중을 맨 앞에 둔다.
var CAMPAIGN_STATUS_ORDER = {
  progress: 0, running: 0,            // 진행 중
  'channel-select': 1, recruiting: 1, // 채널 선정 중
  ready: 2, open: 2,                  // 오픈 준비
  done: 3                             // 완료
};

// 1순위 진행 상황, 2순위 시작일(최신 우선)
function compareCampaignCards(a, b) {
  var sa = CAMPAIGN_STATUS_ORDER[(a.dataset.campaignStatus || '').toLowerCase()];
  var sb = CAMPAIGN_STATUS_ORDER[(b.dataset.campaignStatus || '').toLowerCase()];
  if (sa === undefined) sa = 99;
  if (sb === undefined) sb = 99;
  if (sa !== sb) return sa - sb;
  var da = a.dataset.editStart || '';
  var db = b.dataset.editStart || '';
  if (da !== db) return db.localeCompare(da);
  return 0;
}

function sortCampaignGrid(grid) {
  if (!grid) return;
  Array.from(grid.querySelectorAll('.campaign-card'))
    .sort(compareCampaignCards)
    .forEach(function(c) { grid.appendChild(c); });
}

function sortAllCampaignGrids() {
  document.querySelectorAll('#p-list .campaign-list, .adm-report-grid')
    .forEach(sortCampaignGrid);
}


let campaignReturnPage = 'p-list';

function goBackToList() { goTo(campaignReturnPage); }

function filterCampaigns() {
  const typeVal = document.getElementById('campaignTypeFilter')?.value || 'all';
  const activeChip = document.querySelector('#p-list .status-chip.active');
  const statusVal = activeChip ? activeChip.dataset.status : 'all';
  document.querySelectorAll('#p-list .campaign-card').forEach(card => {
    const typeMatch = typeVal === 'all' || card.dataset.campaignType === typeVal;
    const statusMatch = statusVal === 'all' || card.dataset.campaignStatus === statusVal;
    card.style.display = (typeMatch && statusMatch) ? '' : 'none';
  });
}

function updateChipCounts() {
  const cards = document.querySelectorAll('#p-list .campaign-card');
  const counts = { all: cards.length };
  cards.forEach(card => {
    const s = card.dataset.campaignStatus;
    if (s) counts[s] = (counts[s] || 0) + 1;
  });

  document.querySelectorAll('#p-list .status-chip').forEach(chip => {
    const count = counts[chip.dataset.status] || 0;
    chip.querySelector('.chip-count').textContent = count;
    const empty = count === 0;
    chip.disabled = empty;
    chip.classList.toggle('disabled', empty);
    if (empty && chip.classList.contains('active')) {
      chip.classList.remove('active');
      document.querySelector('#p-list .status-chip[data-status="all"]').classList.add('active');
    }
  });
}

function initCampaignFilter() {
  const typeSel = document.getElementById('campaignTypeFilter');
  if (typeSel) typeSel.addEventListener('change', filterCampaigns);

  document.querySelectorAll('#p-list .status-chip').forEach(chip => {
    chip.addEventListener('click', function(e) {
      e.stopPropagation();
      document.querySelectorAll('#p-list .status-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      filterCampaigns();
    });
  });

  updateChipCounts();
}

function goTo(id) {
  if (DETAIL_PAGES.includes(id)) {
    const cur = pages.find(p => document.getElementById(p)?.classList.contains('active'));
    if (cur && !DETAIL_PAGES.includes(cur)) {
      campaignReturnPage = cur;
      document.body.dataset.viewerRole = cur === 'p-admin' ? 'admin' : 'advertiser';
    }
  }
  authPages.forEach(p => document.getElementById(p).classList.remove('active'));
  pages.forEach(p => document.getElementById(p).classList.remove('active'));
  document.getElementById(id).classList.add('active');
  Object.values(navMap).forEach(n => document.getElementById(n)?.classList.remove('active'));
  document.getElementById(navMap[id])?.classList.add('active');
  document.body.classList.toggle('p0-active', p0ActivePages.includes(id));
  var gni = document.getElementById('gnb-user-info');
  if (gni) gni.hidden = (id !== 'p-admin');
  window.scrollTo(0,0);
  document.getElementById('p1').scrollTop = 0;

  const bar = document.getElementById('ctaBar');
  bar.classList.toggle('visible', ctaPages.includes(id));

  if (id === 'p-channels') { updateSortArrows(); renderChannels(); updateChSummary(); }
  if (id === 'p-list' || id === 'p-admin') { if (typeof updateListCardPremium === 'function') updateListCardPremium(); }
  if (id === 'p1') { setTimeout(runStatCountUp, 200); }
}

function goToAuth(id) {
  authPages.forEach(p => document.getElementById(p).classList.remove('active'));
  pages.forEach(p => document.getElementById(p).classList.remove('active'));
  document.body.classList.toggle('p0-active', id === 'p-brochure');
  document.getElementById(id).classList.add('active');
  document.getElementById('ctaBar').classList.remove('visible');
}

function doLogin() {
  authPages.forEach(p => document.getElementById(p).classList.remove('active'));
  goTo('p-list');
}

function toggleAllAgree(master) {
  document.querySelectorAll('.agree-check').forEach(cb => cb.checked = master.checked);
}

function showBizFile(input) {
  const el = document.getElementById('bizFileName');
  if (input.files && input.files[0]) {
    el.textContent = '📎 ' + input.files[0].name;
    el.classList.add('visible');
  }
}


const EJS_SVC  = 'service_zl4kqql';
const EJS_TPL  = 'template_y1ou73n';

// ── BROCHURE SUBMIT ──
function submitBrochure() {
  const company = document.getElementById('br-company').value.trim() || '(미입력)';
  const email   = document.getElementById('br-email').value.trim()   || '(미입력)';

  const getLabelText = id => document.querySelector(`label[for="${id}"]`)?.textContent?.trim() || '';
  const cats = ['br-c1','br-c2','br-c3','br-c4','br-c5','br-c6','br-c7','br-c8']
    .filter(id => document.getElementById(id)?.checked)
    .map(getLabelText).join(', ') || '(선택 없음)';

  emailjs.send(EJS_SVC, EJS_TPL, {
    subject: `[커넥트 스튜디오] 상품소개서 요청 - ${company}`,
    body:
      `회사명 / 브랜드명 : ${company}\n` +
      `이메일            : ${email}\n` +
      `카테고리          : ${cats}`
  }).then(() => {
    alert('요청이 접수되었습니다.\n입력하신 이메일로 소개서를 발송해드립니다.');
    goTo('p1');
  }).catch(() => {
    alert('전송 중 오류가 발생했습니다. 다시 시도해주세요.');
  });
}

// ── INQUIRY SUBMIT ──
function submitInquiry() {
  const company  = document.getElementById('iq-company').value.trim() || '(미입력)';
  const name     = document.getElementById('iq-name').value.trim()    || '(미입력)';
  const phone    = document.getElementById('iq-phone').value.trim()   || '(미입력)';
  const email    = document.getElementById('iq-email').value.trim()   || '(미입력)';

  const getLabelText = id => document.querySelector(`label[for="${id}"]`)?.textContent?.trim() || '';
  const cats = ['iq-c1','iq-c2','iq-c3','iq-c4','iq-c5','iq-c6','iq-c7','iq-c8']
    .filter(id => document.getElementById(id)?.checked)
    .map(getLabelText).join(', ') || '(선택 없음)';
  const platforms = ['iq-yt','iq-ig','iq-tt']
    .filter(id => document.getElementById(id)?.checked)
    .map(getLabelText).join(', ') || '(선택 없음)';
  const budget = getLabelText(document.querySelector('[name="iq-budget"]:checked')?.id) || '(선택 없음)';
  const timing = getLabelText(document.querySelector('[name="iq-timing"]:checked')?.id) || '(선택 없음)';

  emailjs.send(EJS_SVC, EJS_TPL, {
    subject: `[커넥트 스튜디오] 캠페인 문의 - ${company}`,
    body:
      `회사명 / 브랜드명 : ${company}\n` +
      `담당자명          : ${name}\n` +
      `연락처            : ${phone}\n` +
      `이메일            : ${email}\n\n` +
      `광고 카테고리     : ${cats}\n` +
      `집행 플랫폼       : ${platforms}\n` +
      `예산 규모         : ${budget}\n` +
      `희망 라이브 시기  : ${timing}`
  }).then(() => {
    alert('문의가 접수되었습니다.\n영업일 기준 1일 내 담당자가 연락드립니다.');
    goTo('p1');
  }).catch(() => {
    alert('전송 중 오류가 발생했습니다. 다시 시도해주세요.');
  });
}

/* [SEC-STRUCTURE] 구조 섹션 카드 슬라이드 토글 */
function setCardSlide(cardId, slideIdx) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const track = card.querySelector('.p0-cc-slider-track');
  const dots = card.querySelectorAll('.p0-cc-dot');
  const idx = parseInt(slideIdx);
  track.style.transform = `translateX(-${idx * 100}%)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

// ── 새 캠페인 요청 모달 ──
function openNewCampaignModal() {
  document.getElementById('newCampaignModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeNewCampaignModal() {
  document.getElementById('newCampaignModal').classList.remove('open');
  document.body.style.overflow = '';
}

function selectCampaignProduct(val) {
  document.querySelectorAll('#ncr-products .ncr-prod-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.args === val);
  });
}

function toggleCampaignPlatform(val) {
  const btn = document.querySelector(`#ncr-platforms [data-args="${val}"]`);
  if (btn) btn.classList.toggle('selected');
}

function submitNewCampaign() {
  const name = document.getElementById('ncr-name').value.trim();
  const product = document.querySelector('#ncr-products .ncr-prod-btn.selected')?.dataset.args;
  const platforms = [...document.querySelectorAll('#ncr-platforms .ncr-plat-btn.selected')].map(b => b.dataset.args);

  document.getElementById('ncr-name').classList.toggle('error', !name);
  document.getElementById('ncr-products').classList.toggle('error', !product);
  document.getElementById('ncr-platforms').classList.toggle('error', platforms.length === 0);
  if (!name || !product || platforms.length === 0) return;

  const flexible = document.getElementById('ncr-flexible').checked;
  const formData = {
    name,
    product,
    platforms,
    goal: document.getElementById('ncr-goal').value.trim(),
    date: flexible ? '협의 가능' : document.getElementById('ncr-date').value,
    memo: document.getElementById('ncr-memo').value.trim(),
  };

  // TODO: 전송 로직 연결 (EmailJS 또는 백엔드 API)
  console.log('[새 캠페인 요청]', formData);

  closeNewCampaignModal();
  const toast = document.getElementById('ncrToast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// 모달 오버레이 클릭 시 닫기
document.getElementById('newCampaignModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeNewCampaignModal();
});
document.getElementById('taxModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeTaxModal();
});

// 협의 가능 체크 시 날짜 비활성
document.getElementById('ncr-flexible')?.addEventListener('change', function() {
  document.getElementById('ncr-date').disabled = this.checked;
  if (this.checked) document.getElementById('ncr-date').value = '';
});

function toggleVidList() {
  const wrap = document.getElementById('vidTableWrap');
  const btn = document.getElementById('vidExpandBtn');
  if (!wrap || !btn) return;
  const expanded = wrap.dataset.expanded === '1';
  if (expanded) {
    wrap.style.maxHeight = '';
    wrap.dataset.expanded = '0';
    btn.textContent = '전체 147개 보기 ↓';
  } else {
    wrap.style.maxHeight = 'none';
    wrap.dataset.expanded = '1';
    btn.textContent = '접기 ↑';
  }
}

// ── 세금계산서 요청 ──
let _taxBtnId = null;
const _TAX_STORE_KEY = 'cs_tax_biz_info'; // TODO: 서버 연동 시 localStorage 대체

function _taxLoadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(_TAX_STORE_KEY) || 'null');
    if (!saved) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
    set('taxEmail', saved.email);
    set('taxBizNum', saved.bizNum);
    set('taxAddress', saved.address);
    set('taxItem', saved.item);
    const chk = document.getElementById('taxSaveInfo');
    if (chk) chk.checked = true;
  } catch(e) {}
}

function openTaxModal(amount, btnId) {
  document.getElementById('taxAmountDisplay').textContent = amount || '–';
  _taxBtnId = btnId || null;
  // 초기화
  ['taxEmail','taxBizNum','taxAddress','taxNote'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('taxItem').value = '숏폼 광고 캠페인';
  document.getElementById('taxFileName').textContent = '선택된 파일 없음';
  document.getElementById('taxFileInput').value = '';
  document.getElementById('taxSaveInfo').checked = false;
  _taxLoadSaved();
  document.getElementById('taxModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTaxModal() {
  document.getElementById('taxModal').classList.remove('open');
  document.body.style.overflow = '';
}

function submitTaxRequest() {
  const email   = document.getElementById('taxEmail').value.trim();
  const bizNum  = document.getElementById('taxBizNum').value.trim();
  const address = document.getElementById('taxAddress').value.trim();
  const item    = document.getElementById('taxItem').value.trim();
  const note    = document.getElementById('taxNote').value.trim();
  const amount  = document.getElementById('taxAmountDisplay').textContent;

  // 필수 검증
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('유효한 이메일을 입력해주세요.'); return;
  }
  if (!/^\d{3}-\d{2}-\d{5}$/.test(bizNum)) {
    alert('사업자등록번호를 올바르게 입력해주세요.\n형식: 000-00-00000'); return;
  }
  if (!address) { alert('사업장 주소를 입력해주세요.'); return; }
  if (!item)    { alert('품목명을 입력해주세요.'); return; }

  // localStorage 저장 (TODO: 서버 연동 시 대체)
  if (document.getElementById('taxSaveInfo').checked) {
    localStorage.setItem(_TAX_STORE_KEY, JSON.stringify({ email, bizNum, address, item }));
  }

  // TODO: 전송 로직 연결 (EmailJS 또는 백엔드 API)
  console.log('[세금계산서 요청]', { amount, email, bizNum, address, item, note, btnId: _taxBtnId });

  closeTaxModal();

  if (_taxBtnId) {
    const btn = document.getElementById(_taxBtnId);
    if (btn) {
      btn.textContent = '✓ 요청됨';
      btn.disabled = true;
      btn.classList.add('cd-btn-tax--done');
    }
  }

  const toast = document.getElementById('taxToast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// 사업자등록번호 자동 하이픈
document.getElementById('taxBizNum')?.addEventListener('input', function() {
  let v = this.value.replace(/\D/g, '').slice(0, 10);
  if (v.length > 5)      v = v.slice(0,3) + '-' + v.slice(3,5) + '-' + v.slice(5);
  else if (v.length > 3) v = v.slice(0,3) + '-' + v.slice(3);
  this.value = v;
});

// 파일 선택 후 파일명 표시
document.getElementById('taxFileInput')?.addEventListener('change', function() {
  document.getElementById('taxFileName').textContent = this.files[0]?.name || '선택된 파일 없음';
});

// ── 스탯 상세 팝업 ──
const _STAT_DATA = {
  views: [
    { avatar:'하', bg:'#fff0e8', fg:'#e05000', name:'하봄',         subs:'292K',  val:97376, url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'무', bg:'#e8f0ff', fg:'#3050d0', name:'무비랩',       subs:'450K',  val:82140, url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'시', bg:'#f0e8ff', fg:'#7030a0', name:'시네마틱',     subs:'380K',  val:74850, url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'예', bg:'#eae8f0', fg:'#5e3ea0', name:'예고공식',     subs:'10.6K', val:18434, url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'포', bg:'#e8f0f0', fg:'#2a7070', name:'포브스튜디오', subs:'1.4M',  val:5950,  url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'하', bg:'#eaf0e8', fg:'#3a7d44', name:'하씨네 CINE',  subs:'210K',  val:2441,  url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'무', bg:'#f0f0e8', fg:'#806020', name:'무비플렉스',   subs:'87K',   val:1893,  url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'N',  bg:'#e8eaf0', fg:'#666',    name:'NOT NORMAL',   subs:'367',   val:1424,  url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'리', bg:'#ffe8e8', fg:'#c03030', name:'리뷰엔진',     subs:'52K',   val:1203,  url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'필', bg:'#e8fff0', fg:'#208050', name:'필름노트',     subs:'43K',   val:980,   url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
  ],
  likes: [
    { avatar:'하', bg:'#fff0e8', fg:'#e05000', name:'하봄',         subs:'292K',  val:1740, url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'예', bg:'#eae8f0', fg:'#5e3ea0', name:'예고공식',     subs:'10.6K', val:215,  url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'시', bg:'#f0e8ff', fg:'#7030a0', name:'시네마틱',     subs:'380K',  val:198,  url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'무', bg:'#e8f0ff', fg:'#3050d0', name:'무비랩',       subs:'450K',  val:187,  url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'하', bg:'#eaf0e8', fg:'#3a7d44', name:'하씨네 CINE',  subs:'210K',  val:24,   url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'포', bg:'#e8f0f0', fg:'#2a7070', name:'포브스튜디오', subs:'1.4M',  val:21,   url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'리', bg:'#ffe8e8', fg:'#c03030', name:'리뷰엔진',     subs:'52K',   val:18,   url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'무', bg:'#f0f0e8', fg:'#806020', name:'무비플렉스',   subs:'87K',   val:11,   url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'N',  bg:'#e8eaf0', fg:'#666',    name:'NOT NORMAL',   subs:'367',   val:6,    url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
    { avatar:'필', bg:'#e8fff0', fg:'#208050', name:'필름노트',     subs:'43K',   val:4,    url:'https://www.youtube.com/shorts/dQw4w9WgXcQ' },
  ],
  comments: [
    // 긍정·기대 반응 우선, 좋아요 수 내림차순 — TODO: 백엔드 감정 분류 연동 시 대체
    { text:'이거 무조건 본다 어릴 때 토이스토리 보면서 울었던 기억이 ㅠㅠ',              channel:'하봄',        likes:1284, tag:'기대' },
    { text:'개봉일 6월 17일 맞죠? 바로 예매했어요 🎬',                                  channel:'예고공식',    likes:892,  tag:'기대' },
    { text:'어른이 된 앤디를 보니까 왜 눈물이 나지... 픽사 천재들',                      channel:'무비랩',      likes:741,  tag:'감동' },
    { text:'우디 목소리 배우 바뀐 거 알고 있었는데도 예고편 보다 울어버렸다',             channel:'시네마틱',    likes:634,  tag:'감동' },
    { text:'토이스토리 1편이 1995년인데 30년 만에 5편이라니... 인생 애니',               channel:'포브스튜디오', likes:512, tag:'추억' },
    { text:'이 영화 꼭 아이 데리고 봐야겠다 나도 울고 아이도 울겠지만',                  channel:'하씨네 CINE', likes:409, tag:'기대' },
    { text:'픽사 망했다는 소리 들었는데 이거 보고 무조건 부활각',                        channel:'NOT NORMAL',  likes:387,  tag:'기대' },
    { text:'음악도 존재... 랜디 뉴먼이 또 You\'ve Got a Friend 부르면 나 진짜',          channel:'무비플렉스',  likes:312,  tag:'음악' },
    { text:'극장 가서 봐야 하는 영화 오랜만에 나왔다 OTT로 보면 아깝다',                 channel:'리뷰엔진',    likes:276,  tag:'기대' },
    { text:'버즈 새 목소리도 진짜 잘 어울리더라 처음엔 어색했는데',                      channel:'필름노트',    likes:198,  tag:'호평' },
    { text:'픽사 이 자식들 또 어른들 울리려고 ㅋㅋㅋ 근데 간다',                        channel:'하봄',        likes:167,  tag:'기대' },
    { text:'스타크래프트, 마인크래프트 이어 토이스토리까지 내 추억 공략하는 거냐',        channel:'무비랩',      likes:143,  tag:'추억' },
  ],
};

function openStatModal(type) {
  const titleEl = document.getElementById('statModalTitle');
  const subEl   = document.getElementById('statModalSub');
  const bodyEl  = document.getElementById('statModalBody');
  if (type === 'views') {
    titleEl.textContent = '조회수 TOP 10 채널';
    subEl.textContent   = '참여 영상 기준 조회수 상위 채널';
    bodyEl.innerHTML    = _statRankHTML(_STAT_DATA.views, v => v.toLocaleString() + '회');
  } else if (type === 'likes') {
    titleEl.textContent = '좋아요 TOP 10 채널';
    subEl.textContent   = '참여 영상 기준 좋아요 상위 채널';
    bodyEl.innerHTML    = _statRankHTML(_STAT_DATA.likes, v => v.toLocaleString() + '개');
  } else if (type === 'comments') {
    titleEl.textContent = '베스트 댓글';
    subEl.textContent   = '주요 반응 · 좋아요 많은 순 (긍정·기대 우선)';
    bodyEl.innerHTML    = _statCmtHTML(_STAT_DATA.comments);
  }
  document.getElementById('statModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeStatModal() {
  document.getElementById('statModal').classList.remove('open');
  document.body.style.overflow = '';
}

function _statRankHTML(items, fmt) {
  const medals = ['🥇','🥈','🥉'];
  const linkIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
  return '<ul class="stat-rank-list">' + items.map((d, i) => `
    <li class="stat-rank-item${i < 3 ? ' stat-rank-item--top' : ''}">
      <span class="stat-rank-num">${i < 3 ? medals[i] : i + 1}</span>
      <span class="stat-rank-av" style="background:${d.bg};color:${d.fg}">${d.avatar}</span>
      <div class="stat-rank-info">
        <span class="stat-rank-name">${d.name}</span>
        <span class="stat-rank-subs">${d.subs} 구독</span>
      </div>
      <span class="stat-rank-val${i < 3 ? ' stat-rank-val--hi' : ''}">${fmt(d.val)}</span>
      <a class="stat-rank-link" href="${d.url}" target="_blank" rel="noopener" title="영상 보기">${linkIcon}</a>
    </li>`).join('') + '</ul>';
}

const _STAT_TAG_COLOR = { '기대':'#ff6200', '감동':'#a040e0', '추억':'#2080d0', '음악':'#20a060', '호평':'#c05000' };
function _statCmtHTML(items) {
  // 채널명 → 영상 URL (조회수/좋아요 데이터에서). 실서비스에선 각 댓글이 자기 영상 URL을
  // 갖고, 가능하면 댓글 deep-link(유튜브 &lc=<댓글ID>)까지 붙여 바로 꽂히게 한다.
  const urlByCh = {};
  [].concat(_STAT_DATA.views, _STAT_DATA.likes).forEach(d => { if (d.name && d.url) urlByCh[d.name] = d.url; });
  const linkIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
  return '<ul class="stat-cmt-list">' + items.map(d => {
    const c = _STAT_TAG_COLOR[d.tag] || '#888';
    const url = d.url || urlByCh[d.channel] || 'https://www.youtube.com/shorts/dQw4w9WgXcQ';
    return `<li class="stat-cmt-item">
      <div class="stat-cmt-meta">
        <span class="stat-cmt-tag" style="background:${c}1a;color:${c}">${d.tag}</span>
        <span class="stat-cmt-likes">♥ ${d.likes.toLocaleString()}</span>
      </div>
      <p class="stat-cmt-text">"${d.text}"</p>
      <div class="stat-cmt-foot">
        <span class="stat-cmt-ch">— ${d.channel}</span>
        <a class="stat-cmt-link" href="${url}" target="_blank" rel="noopener" title="이 댓글이 달린 영상 보기">영상에서 보기 ${linkIcon}</a>
      </div>
    </li>`;
  }).join('') + '</ul>';
}

document.getElementById('statModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeStatModal();
});

// ── 조회수 갱신 제한 모달 ──
function closeRefreshLimitModal() {
  document.getElementById('refreshLimitModal').classList.remove('open');
}

// ── 리포트 업로드 모달 ──
function openReportUploadModal() {
  document.getElementById('reportUploadModal').classList.add('open');
}
function closeReportUploadModal() {
  document.getElementById('reportUploadModal').classList.remove('open');
}
function ruSwitchTab(idx) {
  const i = Number(idx);
  document.querySelectorAll('#reportUploadModal .ru-tab').forEach((btn, j) => {
    btn.classList.toggle('ru-tab--active', j === i);
  });
}

// ── SCROLL — #p1이 스크롤 컨테이너이므로 window 대신 #p1 이벤트 감지 ──
const _p1El = document.getElementById('p1');
_p1El.addEventListener('scroll', () => {
  document.querySelector('.gnb').classList.toggle('scrolled', _p1El.scrollTop > 30);
});

// ── INIT ──
goTo('p1');
document.body.classList.add('p0-active');

/* [SEC-PROCESS] 프로세스 데이터 및 렌더링 */
// ── 섹션6 진행 프로세스 데이터 ──
const processSteps = {
  standard: [
    { label: 'BRAND',    brand: true,  title: '캠페인 준비',  emoji: '📋', items: [
      /* 항목 1 */ '목표·예산·일정 설정',
      /* 항목 2 */ '최적 상품 선택',
      /* 항목 3 */ '가이드 제공',
    ]},
    { label: 'STEP. 01', brand: false, title: '캠페인 오픈',  emoji: '🎯', items: [
      /* 항목 1 */ '캠페인 오픈 알림',
      /* 항목 2 */ '채널 자율 참여',
      /* 항목 3 */ '목표 도달까지 참여 지속',
    ]},
    { label: 'STEP. 02', brand: false, title: '콘텐츠 확산',  emoji: '🎬', items: [
      /* 항목 1 */ '가이드 기반 자율 제작',
      /* 항목 2 */ '다수 채널 동시 업로드',
      /* 항목 3 */ '브랜드 노출 시작',
    ]},
    { label: 'STEP. 03', brand: false, title: '실시간 관리',  emoji: '📈', items: [
      /* 항목 1 */ '조회수 집계',
      /* 항목 2 */ '검수·수정 반영',
      /* 항목 3 */ '목표 도달 시 자동 종료',
    ]},
    { label: 'BRAND',    brand: true,  title: '리포트 확인',  emoji: '📊', items: [
      /* 항목 1 */ '채널별 상세 데이터',
      /* 항목 2 */ '추가 조회 발생',
      /* 항목 3 */ '유지 기간 관리',
    ]},
  ],
  premium: [
    { label: 'BRAND',    brand: true,  title: '캠페인 준비',    emoji: '📋', items: [
      /* 항목 1 */ '목표·예산·일정 설정',
      /* 항목 2 */ '최적 상품 선택',
      /* 항목 3 */ '가이드 제공',
    ]},
    { label: 'STEP. 01', brand: false, title: '캠페인 오픈',    emoji: '🎯', items: [
      /* 항목 1 */ '캠페인 오픈 알림',
      /* 항목 2 */ '채널 자율 참여',
      /* 항목 3 */ '모집 마감',
    ]},
    { label: ['STEP. 02', 'BRAND'], brand: false, title: '채널 선정·제작', emoji: '🔍', items: [
      /* 항목 1 */ '참여 채널 선정',
      /* 항목 2 */ '선정 채널 확정',
      /* 항목 3 */ '선정 채널 가이드 전달',
    ]},
    { label: 'STEP. 03', brand: false, title: '콘텐츠 확산',    emoji: '🎬', items: [
      /* 항목 1 */ '제작 영상 검수·수정',
      /* 항목 2 */ '채널 순차 업로드',
      /* 항목 3 */ '브랜드 노출 시작',
    ]},
    { label: 'STEP. 04', brand: false, title: '실시간 관리',    emoji: '📈', items: [
      /* 항목 1 */ '성과 집계',
      /* 항목 2 */ '검수·수정 반영',
      /* 항목 3 */ '업로드 완료 시 종료',
    ]},
    { label: 'BRAND',    brand: true,  title: '리포트 확인',    emoji: '📊', items: [
      /* 항목 1 */ '채널별 상세 데이터',
      /* 항목 2 */ '추가 조회 발생',
      /* 항목 3 */ '유지 기간 관리',
    ]},
  ],
};

let _p0RoleTimer = null;
let _p0CurrentMode = 'std';

function _buildProcessCard(step) {
  const isBrand = step.brand;
  const items = step.items.filter(t => t).map(t => `<li>${t}</li>`).join('');
  let badgeHTML;
  if (Array.isArray(step.label)) {
    const badges = step.label.map((lbl, i) =>
      `<div class="wp-step-badge${i > 0 ? ' p0-role-brand-badge' : ''}">${lbl}</div>`
    ).join('');
    badgeHTML = `<div class="wp-step-badge-group">${badges}</div>`;
  } else {
    badgeHTML = `<div class="wp-step-badge${isBrand ? ' p0-role-brand-badge' : ''}">${step.label}</div>`;
  }
  return `<div class="wp-card${isBrand ? ' p0-role-brand-card-v2' : ''}">
    ${badgeHTML}
    <div class="wp-card-icon">${step.emoji}</div>
    <div class="wp-card-title">${step.title}</div>
    <div class="wp-card-divider"></div>
    <ul class="wp-checklist">${items}</ul>
  </div>`;
}

function renderProcessCards(mode, animIdx) {
  const grid = document.getElementById('p0RoleGrid');
  if (!grid) return;
  const steps = processSteps[mode === 'pre' ? 'premium' : 'standard'];
  grid.innerHTML = steps.map(s => _buildProcessCard(s)).join('');
  if (animIdx !== undefined) {
    const card = grid.children[animIdx];
    if (card) {
      card.classList.add('p0rc-entering');
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('p0rc-visible')));
    }
  }
}

function p0RoleToggle(mode) {
  if (mode === _p0CurrentMode) return;
  document.querySelectorAll('.p0rt-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.args === mode)
  );
  clearTimeout(_p0RoleTimer);
  if (mode === 'std') {
    // pre → std: 카드 2(채널 선정·검토) 접기 후 5장 렌더
    const grid = document.getElementById('p0RoleGrid');
    const card2 = grid && grid.children[2];
    if (card2) {
      card2.classList.add('p0rc-collapsing');
      _p0RoleTimer = setTimeout(() => {
        renderProcessCards(mode);
        _p0CurrentMode = mode;
      }, 440);
    } else {
      renderProcessCards(mode);
      _p0CurrentMode = mode;
    }
  } else {
    // std → pre: 6장 렌더 후 카드 2 펼치기
    renderProcessCards(mode, 2);
    _p0CurrentMode = mode;
  }
}

renderProcessCards('std');

/* [SEC-STRUCTURE] 구조 섹션 CC 토글 */
function p0CcToggle(mode) {
  document.querySelectorAll('#p0CcToggle .p0rt-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.args === mode)
  );
  const track = document.querySelector('#p0CcCard2 .p0-cc-slider-track');
  if (track) track.style.transform = `translateX(-${mode === 'pre' ? 100 : 0}%)`;
}

// ── 캠페인 카드 수정 패널 ─────────────────────────────────────────────
(function() {
  var _card = null;

  const STATUS_MAP = {
    done:            { cls: 'done',      text: '완료' },
    progress:        { cls: 'running',   text: '진행 중' },
    'channel-select':{ cls: 'recruiting',text: '채널 선정 중' },
    recruiting:      { cls: 'recruiting',text: '모집중' }
  };

  const PLAT_SVG = {
    yt: `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>유튜브`,
    ig: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>인스타`,
    tt: `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>틱톡`
  };

  function openPanel(card) {
    _card = card;
    const d = card.dataset;
    document.getElementById('ce-title').value      = d.editTitle || '';
    fillAccountSelect(document.getElementById('ce-client'), d.editClient, '계정 선택');
    document.getElementById('ce-product').value    = d.editProduct || '조회수당';
    document.getElementById('ce-status').value     = d.editStatus || 'recruiting';
    document.getElementById('ce-goal-type').value  = d.editGoalType || '조회수';
    document.getElementById('ce-goal-value').value = d.editGoalValue || '';
    document.getElementById('ce-current').value    = d.editCurrent || '';
    document.getElementById('ce-start').value      = d.editStart || '';
    document.getElementById('ce-end').value        = d.editEnd || '';
    document.getElementById('ce-thumb').value      = d.editThumb || '';

    const plats = (d.editPlatforms || '').split(',').filter(Boolean);
    document.querySelectorAll('.ce-plat-cb').forEach(cb => {
      cb.checked = plats.includes(cb.value);
    });

    document.getElementById('cardEditPanel').classList.add('active');
    document.getElementById('cardEditOverlay').classList.add('active');
  }

  function closePanel() {
    document.getElementById('cardEditPanel').classList.remove('active');
    document.getElementById('cardEditOverlay').classList.remove('active');
    _card = null;
  }

  function savePanel() {
    if (!_card) return;
    const title     = document.getElementById('ce-title').value.trim();
    if (!title) { alert('캠페인명을 입력해주세요.'); return; }

    const client    = document.getElementById('ce-client').value.trim();
    const product   = document.getElementById('ce-product').value;
    const status    = document.getElementById('ce-status').value;
    const goalType  = document.getElementById('ce-goal-type').value;
    const goalValue = document.getElementById('ce-goal-value').value.replace(/,/g,'');
    const current   = document.getElementById('ce-current').value.replace(/,/g,'');
    const start     = document.getElementById('ce-start').value;
    const end       = document.getElementById('ce-end').value;
    const thumb     = document.getElementById('ce-thumb').value.trim();
    const plats     = [...document.querySelectorAll('.ce-plat-cb:checked')].map(c => c.value);

    // update data attrs
    Object.assign(_card.dataset, {
      editTitle:     title,
      editClient:    client,
      editProduct:   product,
      editStatus:    status,
      editGoalType:  goalType,
      editGoalValue: goalValue,
      editCurrent:   current,
      editStart:     start,
      editEnd:       end,
      editThumb:     thumb,
      editPlatforms: plats.join(','),
      campaignStatus: status,
    });

    // title
    const titleEl = _card.querySelector('.card-title');
    if (titleEl) titleEl.textContent = title;

    // product tag
    const tagEl = _card.querySelector('.card-product-tag');
    if (tagEl) tagEl.textContent = product;

    // status badge
    const badgeEl = _card.querySelector('.status-badge');
    if (badgeEl) {
      const s = STATUS_MAP[status] || { cls: status, text: status };
      badgeEl.className = `status-badge ${s.cls}`;
      badgeEl.textContent = s.text;
    }

    // platform badges
    // 플랫폼 배지 + 광고주 계정(우측)을 함께 다시 그린다.
    // 배지만 덮어쓰면 같은 행에 있던 계정 칩이 지워진다.
    const platEl = _card.querySelector('.card-platform-badges');
    if (platEl) {
      platEl.innerHTML =
        plats.map(p => `<span class="platform-badge ${p}">${PLAT_SVG[p] || p}</span>`).join('') +
        (client ? `<span class="card-agency" title="광고주 계정">${client}</span>` : '');
    }

    // thumbnail
    const thumbDiv = _card.querySelector('.card-thumb');
    if (thumbDiv) {
      const img = thumbDiv.querySelector('img');
      if (thumb) {
        if (img) { img.src = thumb; }
        else { thumbDiv.style.backgroundImage = `url(${thumb})`; }
        thumbDiv.style.background = '';
      }
    }

    // progress
    const gv = parseInt(goalValue) || 0;
    const cv = parseInt(current) || 0;
    const pct = gv > 0 ? Math.min(Math.round(cv / gv * 100), 100) : 0;
    _card.dataset.pct = gv > 0 ? Math.round(cv / gv * 100) : 0;

    const fillEl = _card.querySelector('.card-progress-fill');
    if (fillEl) fillEl.style.width = pct + '%';

    const textEl = _card.querySelector('.card-progress-text');
    if (textEl) {
      const unit = goalType === '조회수' ? '회' : '개';
      const pctSpan = cv > gv
        ? `<span class="card-progress-pct over">(${Math.round(cv/gv*100)}%)</span>`
        : `<span class="card-progress-pct">(${pct}%)</span>`;
      textEl.innerHTML = `${Number(cv).toLocaleString()} / ${Number(gv).toLocaleString()}${unit} ${pctSpan}`;
    }

    closePanel();
  }

  // 이벤트 바인딩
  document.addEventListener('click', function(e) {
    const editBtn = e.target.closest('.card-edit-btn');
    if (editBtn) {
      e.stopPropagation();
      openPanel(editBtn.closest('.campaign-card'));
      return;
    }
    if (e.target.closest('#cardEditClose') || e.target.closest('#cardEditCancel')) {
      closePanel(); return;
    }
    if (e.target.closest('#cardEditSave')) { savePanel(); return; }
    if (e.target.id === 'cardEditOverlay') { closePanel(); return; }
  });
})();

// ── 회차 추가 모달 ───────────────────────────────────────────────────
// 수정 중인 회차 행. null 이면 추가 모드.
let _editRoundRow = null;

function arSetMode(isEdit) {
  const t = document.getElementById('ar-title');
  const s = document.getElementById('ar-submit');
  if (t) t.textContent = isEdit ? '리포트 수정' : '리포트 회차 추가';
  if (s) s.textContent = isEdit ? '수정' : '추가';
}

function openAddRoundModal() {
  if (!isAdminViewer()) return;
  _editRoundRow = null;
  document.getElementById('addRoundForm')?.reset();
  arSetMode(false);
  updateRoundPreview();
  document.getElementById('addRoundModal').classList.add('active');
}

// 타임라인 회차 버튼 — fnMap 은 문자열만 넘겨서 버튼 참조를 못 받으므로 위임으로 처리한다
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-tl-act]');
  if (!btn) return;
  e.stopPropagation();
  if (btn.dataset.tlAct === 'edit') openEditRoundModal(btn);
  else deleteRound(btn);
});

// 폼 입력이 바뀌면 미리보기를 다시 만든다
document.addEventListener('input', function(e) {
  if (e.target.closest('#addRoundForm')) updateRoundPreview();
});
document.addEventListener('change', function(e) {
  if (e.target.closest('#addRoundForm')) updateRoundPreview();
});

// 타임라인 행의 표시 문자열을 되읽어 폼을 채운다 (행이 정적 HTML이라 별도 저장소가 없다)
function openEditRoundModal(btn) {
  if (!isAdminViewer()) return;
  const row = btn?.closest('.cd-tl-row');
  if (!row) return;
  _editRoundRow = row;

  const title = row.querySelector('.cd-tl-title')?.textContent.trim() || '';
  const metas = [...row.querySelectorAll('.cd-tl-meta')].map(e => e.textContent.trim());
  const isFinal = row.classList.contains('cd-tl-row--final');

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('ar-round', isFinal ? '' : (title.match(/^(\d+)차/) || [, ''])[1]);
  set('ar-type', isFinal ? 'final' : 'interim');
  set('ar-views', (title.match(/([\d,]+)회/) || [, ''])[1]);
  set('ar-vids', (metas.join(' ').match(/참여 영상\s*([\d,]+)개/) || [, ''])[1]);
  set('ar-date', (metas[0] || '').replace(/\s*기준.*$/, '').trim());
  // 두 번째 meta 줄은 비고(주황색)로만 쓰인다
  set('ar-memo', metas.length > 1 ? metas[1] : '');

  arSetMode(true);
  updateRoundPreview();
  document.getElementById('addRoundModal').classList.add('active');
}

function deleteRound(btn) {
  if (!isAdminViewer()) return;
  const row = btn?.closest('.cd-tl-row');
  if (!row) return;
  const label = row.querySelector('.cd-tl-title')?.textContent.trim().split('·')[0].trim() || '이 회차';
  if (!confirm(`${label} 리포트를 삭제할까요?`)) return;
  row.remove();
}

// 카카오톡으로 보낼 문구 미리보기 — 입력값이 비면 자리표시자로 두고 NaN 이 나오지 않게 한다
function updateRoundPreview() {
  const pre = document.getElementById('ar-preview');
  if (!pre) return;
  const val = id => (document.getElementById(id)?.value || '').trim();
  const num = s => { const n = parseInt(String(s).replace(/,/g, ''), 10); return Number.isFinite(n) ? n : null; };

  const isFinal = val('ar-type') === 'final';
  const label = isFinal ? '최종' : (val('ar-round') ? val('ar-round') + '차' : '□차');
  const page = _editRoundRow?.closest('.page-wrapper') || document.querySelector('.page-wrapper.active');
  const name = page?.querySelector('.cd-name')?.textContent.trim() || '캠페인';

  // 목표 항목은 캠페인 유형마다 다르다 (조회수당=목표 조회수, 프리미엄=목표 영상 수).
  // 결과 카드의 실제 라벨을 그대로 읽어 문구가 어긋나지 않게 한다.
  const goalItem = [...(page?.querySelectorAll('.cd-result-item') || [])]
    .find(el => (el.querySelector('.cd-result-lbl')?.textContent || '').includes('목표'));
  const goalLbl = goalItem?.querySelector('.cd-result-lbl')?.textContent.trim() || '목표';
  const goalRaw = goalItem?.querySelector('.cd-result-val')?.textContent.trim() || '';
  const goalUnit = /개/.test(goalRaw) ? '개' : '회';
  const goal = num(goalRaw);
  const views = num(val('ar-views'));
  const vids = num(val('ar-vids'));

  // 캠페인명에 이미 〈 〉/< > 가 있으면 겹치지 않게 그대로 쓴다
  const nameText = /[<〈]/.test(name) ? name : `<${name}>`;

  pre.textContent = [
    `${label} ${nameText} 캠페인 현황 안내드립니다.`,
    `${goalLbl}: ${goal != null ? goal.toLocaleString() : '—'} ${goalUnit}`,
    `현재 조회수: ${views != null ? views.toLocaleString() : '—'} 회` +
      (val('ar-date') ? `(${val('ar-date')} 기준)` : ''),
    `총 참여 영상: ${vids != null ? vids.toLocaleString() : '—'} 개`,
    val('ar-memo') ? '\n' + val('ar-memo') : ''
  ].filter(Boolean).join('\n');
}

function copyRoundPreview() {
  const pre = document.getElementById('ar-preview');
  if (!pre) return;
  navigator.clipboard?.writeText(pre.textContent).then(
    () => admToast('메시지를 복사했습니다'),
    () => admToast('복사에 실패했습니다')
  );
}

function closeAddRoundModal() {
  _editRoundRow = null;
  document.getElementById('addRoundModal').classList.remove('active');
}

function submitAddRound() {
  const round  = document.getElementById('ar-round')?.value.trim();
  const type   = document.getElementById('ar-type')?.value;
  const views  = document.getElementById('ar-views')?.value.trim();
  const vids   = document.getElementById('ar-vids')?.value.trim();
  const date   = document.getElementById('ar-date')?.value.trim();
  const memo   = document.getElementById('ar-memo')?.value.trim();

  if (!round) { alert('회차를 입력해주세요.'); return; }
  if (!date)  { alert('기준 시각을 입력해주세요.'); return; }

  const isFinal = type === 'final';
  // 수정 중이면 그 행이 속한 타임라인, 아니면 현재 보고 있는 페이지의 타임라인
  const page = _editRoundRow?.closest('.page-wrapper') || document.querySelector('.page-wrapper.active');
  const list = _editRoundRow?.closest('.cd-tl-list') || page?.querySelector('.cd-tl-list');
  if (!list) { closeAddRoundModal(); return; }

  const viewsNum = parseInt((views || '0').replace(/,/g, '')) || 0;
  const vidsNum  = parseInt((vids || '0').replace(/,/g, '')) || 0;

  // 달성률은 목표와 같은 단위로 비교한다.
  // 조회수당은 목표가 "회"(조회수), 프리미엄은 "개"(영상 수)라 비교 대상이 다르다.
  const goalItem = [...(page?.querySelectorAll('.cd-result-item') || [])]
    .find(el => (el.querySelector('.cd-result-lbl')?.textContent || '').includes('목표'));
  const goalRaw  = goalItem?.querySelector('.cd-result-val')?.textContent || '';
  const goalNum  = parseInt(goalRaw.replace(/[^0-9]/g, '')) || 0;
  const byVideos = /개/.test(goalRaw);
  const actual   = byVideos ? vidsNum : viewsNum;
  const pct      = actual && goalNum ? Math.round(actual / goalNum * 100) : 0;
  const viewsFmt = viewsNum ? viewsNum.toLocaleString() + '회' : '';
  const vidsFmt  = vids ? `참여 영상 ${vids}개` : '';

  const label = isFinal ? '최종' : `${round}차`;
  // 기존 정적 행과 같은 형식: "2차 · 355,305회 (71%)" — 조회수와 퍼센트 사이는 공백
  const viewsPart = [viewsFmt, pct ? `<span class="cd-tl-pct">(${pct}%)</span>` : ''].filter(Boolean).join(' ');
  const titleText = [label, viewsPart].filter(Boolean).join(' · ');
  const metaText  = [date ? `${date} 기준` : '', vidsFmt].filter(Boolean).join(' · ');

  const row = document.createElement('div');
  row.className = isFinal ? 'cd-tl-row cd-tl-row--final' : 'cd-tl-row';
  row.innerHTML = `
    <div class="cd-tl-num${isFinal ? ' cd-tl-num--final' : ''}">${isFinal ? '🏆' : round}</div>
    <div class="cd-tl-info">
      <div class="cd-tl-title">${titleText}</div>
      ${metaText ? `<div class="cd-tl-meta">${metaText}</div>` : ''}
      ${memo ? `<div class="cd-tl-meta" style="color:var(--orange)">${memo}</div>` : ''}
    </div>
    <div class="cd-tl-act admin-only">
      <button class="cd-tl-act-btn" data-tl-act="edit" title="수정" aria-label="회차 수정"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
      <button class="cd-tl-act-btn cd-tl-act-btn--del" data-tl-act="delete" title="삭제" aria-label="회차 삭제"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
    </div>`;

  if (_editRoundRow) {
    // 수정 — 자리를 유지한 채 내용만 바꾼다
    _editRoundRow.className = row.className;
    _editRoundRow.innerHTML = row.innerHTML;
  } else if (isFinal) {
    list.appendChild(row);
  } else {
    const finalRow = list.querySelector('.cd-tl-row--final');
    finalRow ? list.insertBefore(row, finalRow) : list.appendChild(row);
  }

  closeAddRoundModal();
}

// ── 캠페인 등록 모달 ─────────────────────────────────────────────────
// ── 보고서 등록: 캠페인 생성에서 불러오기 ─────────────────────────────
// 캠페인 생성 표를 읽어 피커 데이터로 쓴다. 실서비스에선 이 목록이 백엔드의
// 생성 캠페인 목록이 되고, 보고서는 선택한 캠페인의 id 를 링크로 저장한다.
const CREATED_YEAR = 2026; // 생성 표 기간이 MM.DD 형식이라 연도 보정용 (데모 기준)
let _createdCampaignsCache = [];

// "05.26~06.25" → ["2026-05-26","2026-06-25"] (종료월 < 시작월이면 종료는 +1년)
function parsePeriod(p) {
  const m = String(p).match(/(\d{1,2})\.(\d{1,2})\s*~\s*(\d{1,2})\.(\d{1,2})/);
  if (!m) return ['', ''];
  const sm = +m[1], sd = +m[2], em = +m[3], ed = +m[4];
  const ey = em < sm ? CREATED_YEAR + 1 : CREATED_YEAR;
  const iso = (y, mo, d) => `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return [iso(CREATED_YEAR, sm, sd), iso(ey, em, ed)];
}

function readCreatedCampaigns() {
  const rows = document.querySelectorAll('#adm-sub-studio-campaign tbody tr');
  const out = [];
  rows.forEach((tr, idx) => {
    const c = tr.children;
    if (c.length < 7) return;
    const name = (c[0].textContent || '').trim();
    if (!name) return;
    const platCls = c[2].querySelector('.platform-badge')?.className || '';
    const platform = /\byt\b/.test(platCls) ? 'yt' : /\big\b/.test(platCls) ? 'ig' : /\btt\b/.test(platCls) ? 'tt' : '';
    const [start, end] = parsePeriod((c[6].textContent || '').trim());
    out.push({
      idx, name,
      brand: (c[1].getAttribute('title') || c[1].textContent || '').trim(),
      platform,
      type: (c[3].textContent || '').trim(),
      goal: (c[5].textContent || '').trim(),
      period: (c[6].textContent || '').trim(),
      start, end,
    });
  });
  return out;
}

function fillCampaignSourceSelect() {
  const sel = document.getElementById('creg-source');
  if (!sel) return;
  _createdCampaignsCache = readCreatedCampaigns();
  const platKo = { yt: '유튜브', ig: '인스타', tt: '틱톡' };
  sel.innerHTML = '<option value="">직접 입력</option>' +
    _createdCampaignsCache.map(c =>
      `<option value="${c.idx}">${c.name} · ${platKo[c.platform] || '-'} · ${c.period}</option>`).join('');
}

function applyCampaignSource(idxStr) {
  const hint = document.querySelector('.creg-source-hint');
  const srcId = document.getElementById('creg-source-id');
  const set = (id, v) => { const el = document.getElementById(id); if (el && v != null && v !== '') el.value = v; };
  if (idxStr === '' || idxStr == null) {
    if (srcId) srcId.value = '';
    if (hint) hint.textContent = '선택하면 캠페인명·광고주·플랫폼·목표·시작일이 자동으로 채워집니다 (종료일만 입력)';
    return;
  }
  const c = _createdCampaignsCache.find(x => x.idx === Number(idxStr));
  if (!c) return;
  set('creg-title', c.name);
  set('creg-client', c.brand);
  set('creg-platform', c.platform);
  set('creg-goal-views', (c.goal || '').replace(/[^0-9,]/g, ''));
  set('creg-start', c.start);
  set('creg-end', c.end);   // 예비 종료 — 실제 종료일로 수정 가능
  if (srcId) srcId.value = `${c.name}|${c.platform}|${c.start}`;
  if (hint) hint.textContent = `✓ 「${c.name}」 연결됨 · 시작 ${c.start}(생성) — 실제 종료일을 확인/입력하세요`;
}

document.addEventListener('change', function (e) {
  if (e.target && e.target.id === 'creg-source') applyCampaignSource(e.target.value);
});

function openCampaignRegModal() {
  document.getElementById('campaignRegForm')?.reset();
  fillAccountSelect(document.getElementById('creg-agency'), '', '선택 안함');
  fillCampaignSourceSelect();
  applyCampaignSource('');   // 힌트 초기화 + 링크 해제
  const toggle = document.getElementById('cregPremiumToggle');
  if (toggle) toggle.dataset.on = 'false';
  document.getElementById('campaignRegModal').classList.add('active');
}

function closeCampaignRegModal() {
  document.getElementById('campaignRegModal').classList.remove('active');
}

function toggleCregPremium() {
  const btn = document.getElementById('cregPremiumToggle');
  if (btn) btn.dataset.on = btn.dataset.on === 'true' ? 'false' : 'true';
}

// 광고주(에이전시) 계정 — 등록 모달과 수정 사이드패널이 같은 목록을 쓴다.
// TODO: 계정 관리 탭/서버에서 받아오도록 교체
const AGENCY_ACCOUNTS = ['투래빗', '프리엠컴퍼니', '월트디즈니 코리아', '카카오엔터테인먼트', 'SM엔터테인먼트'];

// 목록을 select 에 채우고 현재 값을 선택한다. 목록에 없는 값이면 그 값도 옵션으로 남겨
// 기존 카드 데이터가 사라지지 않게 한다.
function fillAccountSelect(sel, current, placeholder) {
  if (!sel) return;
  const cur = (current || '').trim();
  const opts = AGENCY_ACCOUNTS.slice();
  if (cur && !opts.includes(cur)) opts.unshift(cur);
  sel.innerHTML = `<option value="">${placeholder}</option>` +
    opts.map(o => `<option value="${o}"${o === cur ? ' selected' : ''}>${o}</option>`).join('');
  sel.value = cur;
}

const CREG_PLAT = {
  yt: `<span class="platform-badge yt"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>쇼츠</span>`,
  ig: `<span class="platform-badge ig"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>릴스</span>`,
  tt: `<span class="platform-badge tt"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>틱톡</span>`,
};

function submitCampaignReg() {
  const title    = document.getElementById('creg-title')?.value.trim();
  const platform = document.getElementById('creg-platform')?.value;
  if (!title)    { alert('캠페인명을 입력해주세요.'); return; }
  if (!platform) { alert('플랫폼을 선택해주세요.'); return; }

  const isPremium = document.getElementById('cregPremiumToggle')?.dataset.on === 'true';
  const client    = document.getElementById('creg-client')?.value.trim() || '-';
  // 카드 플랫폼 행에 노출할 광고주 계정 — 에이전시를 고르면 그쪽을 우선한다
  const agency    = document.getElementById('creg-agency')?.value.trim() || '';
  const acct      = agency || (client !== '-' ? client : '');
  const startDate = document.getElementById('creg-start')?.value || '';
  const endDate   = document.getElementById('creg-end')?.value || '';
  const goalViews = (document.getElementById('creg-goal-views')?.value || '').replace(/,/g, '');
  const goalVids  = (document.getElementById('creg-goal-vids')?.value  || '').replace(/,/g, '');
  const thumbUrl  = document.getElementById('creg-thumb-url')?.value.trim() || '';

  const product = isPremium ? '프리미엄' : (goalViews ? '조회수당' : '업로드당');
  const thumbBg = thumbUrl ? '' : 'background:linear-gradient(160deg,#1a1a2e,#16213e)';

  // 신규 캠페인(모집중)은 진행률 0% + 상세보기 버튼 — 기존 카드와 동일한 구성
  const goalNum = goalViews || goalVids;
  const goalUnit = goalViews ? '회' : '개';
  const progressText = goalNum
    ? `0 / ${Number(goalNum).toLocaleString()}${goalUnit} <span class="card-progress-pct">(0%)</span>`
    : '집계 예정';
  // 신규 캠페인은 아직 집계 데이터가 없다 → 데모(토이스토리) 상세가 아니라 빈 상세로.
  // 실서비스에선 캠페인 id 로 각자의 리포트를 로드하는 자리.
  const detailTarget = 'p-detail-empty';

  const card = document.createElement('div');
  card.className = 'campaign-card';
  card.dataset.campaignStatus = 'recruiting';
  card.dataset.pct = '0';
  // 카드 클릭도 상세로 (기존 정적 카드와 동일)
  card.setAttribute('data-fn', 'goTo');
  card.setAttribute('data-args', detailTarget);
  // 수정 사이드패널이 읽는 값들 — 없으면 등록한 카드를 편집할 수 없다
  Object.assign(card.dataset, {
    editTitle: title,
    editClient: acct,
    editProduct: product,
    editStatus: 'recruiting',
    editGoalType: goalViews ? '조회수' : '영상수',
    editGoalValue: goalViews || goalVids || '',
    editCurrent: '0',
    editStart: startDate,
    editEnd: endDate,
    editThumb: thumbUrl,
    editPlatforms: platform,
    // 캠페인 생성에서 불러온 경우 출처 링크 (name|platform|start). 캘린더 조인·추적용.
    sourceId: document.getElementById('creg-source-id')?.value || '',
  });
  card.innerHTML = `
    <div class="card-thumb"${thumbUrl ? '' : ` style="${thumbBg}"`}>${thumbUrl
      ? `<img src="${thumbUrl}" alt="${title}" loading="lazy">`
      : ''}<button class="card-edit-btn">수정</button></div>
    <div class="card-thumb-info">
      <div class="card-product-tag">${product}</div>
      <div class="status-badge recruiting">모집 중</div>
    </div>
    <div class="card-body">
      <div class="card-title">${title}</div>
      <div class="card-platform-badges">
        ${CREG_PLAT[platform] || ''}
        ${acct ? `<span class="card-agency" title="광고주 계정">${acct}</span>` : ''}
      </div>
      <div class="card-progress-wrap">
        <div class="card-progress-track"><div class="card-progress-fill" style="width:0%"></div></div>
        <div class="card-progress-text">${progressText}</div>
      </div>
      <button class="card-btn primary" data-fn="goTo" data-args="${detailTarget}" data-stop="1">상세 보기 →</button>
    </div>`;

  const grid = document.querySelector('#adm-panel-report .adm-report-grid');
  if (grid) grid.prepend(card);
  closeCampaignRegModal();
}


// ── EVENT DISPATCHER (MV3 CSP: no inline handlers) ──
(function() {
  const fnMap = {
    goTo, goToAuth, goBackToList, doLogin,
    submitInquiry, submitBrochure, setCardSlide,
    openNewCampaignModal, closeNewCampaignModal,
    selectCampaignProduct, toggleCampaignPlatform, submitNewCampaign,
    toggleVidList,
    openTaxModal, closeTaxModal, submitTaxRequest,
    openStatModal, closeStatModal,
    openChSelectModal, closeSingleModal, confirmChSelect,
    closeChSelectModal, confirmChSelectMulti,
    toggleChCheck, selectChecked, clearChecked,
    rejectCh, undoCh,
    chSortBy, chSetStatus, chSetReviewStatus, chSwitchTab,
    advanceReviewState, creatorRejectCh,
    openReviewModal, closeReviewModal, approveReview, requestRevision, cancelRevision, submitRevision, saveChVideoLink,
    toggleSimPost,
    refreshViewCounts,
    closeRefreshLimitModal,
    openReportUploadModal, closeReportUploadModal, ruSwitchTab,
    p0RoleToggle,
    p0CcToggle,
    openZealPanel, closeZealPanel, saveZealMemo,
    openAddRoundModal, closeAddRoundModal, submitAddRound, copyRoundPreview,
    openCampaignRegModal, closeCampaignRegModal, submitCampaignReg, toggleCregPremium, saveAccountEdit,
  };

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
    if (el.dataset.change === 'showBizFile') { showBizFile(el); return; }
    if (el.dataset.change === 'toggleAllAgree') { toggleAllAgree(el); return; }
  });

  initCampaignFilter();
  sortAllCampaignGrids();
  setTimeout(runStatCountUp, 300);

  // Fluent Emoji CDN 로드 실패 → 시스템 이모지로 폴백 (MV3 CSP: addEventListener만 사용)
  document.querySelectorAll('.p0-ch-emoji').forEach(img => {
    img.addEventListener('error', function() {
      const fb = document.createElement('span');
      fb.className = 'p0-ch-emoji-fb';
      fb.textContent = this.dataset.fb || '';
      fb.style.display = 'block';
      this.parentNode.insertBefore(fb, this);
      this.remove();
    });
  });
})();

/* ── 통계 카운트업 애니메이션 ── */
function runStatCountUp() {
  document.querySelectorAll('.p0-why-stat-num').forEach(el => {
    const em = el.querySelector('em');
    if (!em) return;
    if (!em.dataset.orig) em.dataset.orig = em.textContent.trim();
    const orig = em.dataset.orig;
    const m = orig.match(/^(\d+)([KM]?)$/);
    if (!m) return;
    const target = +m[1], unit = m[2];
    const dur = 1400, t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      em.textContent = Math.round(ease * target) + unit;
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  });
}

// ── ADMIN PAGE: 탭 / 서브탭 / 모달 ──
// ── 캠페인 행 → 생성/수정 모달 채우기 ──────────────────────────────────
// 행이 정적 HTML이라 별도 데이터 배열 없이 셀 값을 그대로 읽는다.
const MC_PLATFORM = { '유튜브': 'YouTube', '인스타': 'Instagram', '틱톡': 'TikTok' };

// 표의 기간은 "08.24~09.24" 처럼 연도가 없다. date 입력을 채우려면 연도가 필요해
// 목록의 다른 캠페인과 같은 2026년으로 본다.
function mcParseDate(md) {
  const m = /^(\d{2})\.(\d{2})$/.exec((md || '').trim());
  return m ? '2026-' + m[1] + '-' + m[2] : '';
}

// 팝업 표는 열 구성이 달라(팝업명/순서/…) 캠페인 모달을 채울 수 없다. 전용 모달로 보낸다.
function openPopupModalFromRow(tr) {
  if (!tr) return;
  const cell = i => (tr.children[i]?.textContent || '').trim();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('mp-name', cell(0));
  set('mp-order', cell(1));
  set('mp-visible', cell(4) || '숨김');

  const t = document.getElementById('mp-title');
  const s = document.getElementById('mp-submit');
  if (t) t.textContent = '짤 팝업 수정';
  if (s) s.textContent = '수정';

  hideRowMenu();
  document.getElementById('modal-studio-popup')?.classList.add('open');
}

function resetPopupModal() {
  ['mp-name', 'mp-order'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const v = document.getElementById('mp-visible');
  if (v) v.selectedIndex = 0;
  const t = document.getElementById('mp-title');
  const s = document.getElementById('mp-submit');
  if (t) t.textContent = '짤 팝업 생성';
  if (s) s.textContent = '생성';
}

// ── 계정 수정/삭제 ──────────────────────────────────────────────
let _accEditRow = null;
function openAccountEditModal(tr) {
  if (!tr) return;
  _accEditRow = tr;
  const nameEl = document.getElementById('acc-eName');
  const pwEl = document.getElementById('acc-ePw');
  if (nameEl) nameEl.value = (tr.children[0]?.textContent || '').trim();
  if (pwEl) pwEl.value = '';
  document.getElementById('modal-account-edit')?.classList.add('open');
}
function saveAccountEdit() {
  const name = (document.getElementById('acc-eName')?.value || '').trim();
  if (!name) { alert('표시 이름을 입력해주세요.'); return; }
  if (_accEditRow && _accEditRow.children[0]) _accEditRow.children[0].textContent = name;
  _accEditRow = null;
  document.getElementById('modal-account-edit')?.classList.remove('open');
}
function updateAccountCount() {
  const n = document.querySelectorAll('#adm-account-body tr').length;
  const chip = document.querySelector('[data-adm-tab="account"] .chip-count');
  if (chip) chip.textContent = n;
}

function openCampaignModalFromRow(tr) {
  if (!tr) return;
  const cell = i => (tr.children[i]?.textContent || '').trim();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };

  const period = cell(6).split('~');
  set('mc-name',  cell(0));
  set('mc-brand', cell(1));
  set('mc-platform', MC_PLATFORM[cell(2)] || 'YouTube');
  set('mc-type',  cell(3));
  set('mc-price', cell(4));
  set('mc-goal',  cell(5).replace(/,/g, ''));
  set('mc-start', mcParseDate(period[0]));
  set('mc-end',   mcParseDate(period[1]));

  const title = document.getElementById('mc-title');
  const submit = document.getElementById('mc-submit');
  if (title)  title.textContent = '짤 캠페인 수정';
  if (submit) submit.textContent = '수정';

  hideRowMenu();
  document.getElementById('modal-studio-campaign')?.classList.add('open');
}

// [+ 캠페인 생성] 으로 열 때는 빈 폼 + 생성 모드로 되돌린다
function resetCampaignModal() {
  ['mc-name', 'mc-brand', 'mc-price', 'mc-goal', 'mc-start', 'mc-end']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['mc-service', 'mc-platform', 'mc-content', 'mc-type', 'mc-approve', 'mc-status']
    .forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });
  const title = document.getElementById('mc-title');
  const submit = document.getElementById('mc-submit');
  if (title)  title.textContent = '짤 캠페인 생성';
  if (submit) submit.textContent = '생성';
}

function admToast(msg) {
  const el = document.getElementById('admToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2500);
}

// 캠페인 목록 새로고침 — 외부 서버에서 다시 내려받는다.
// TODO: 실제 수신 API 연결 (지금은 로딩 표현 + 수신 시각 갱신까지만)
const ADM_REFRESH_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%SPIN%><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';

function admRefreshCampaigns() {
  const btn = document.getElementById('adm-refresh-btn');
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  btn.innerHTML = ADM_REFRESH_ICON.replace('%SPIN%', ' style="animation:spin .6s linear infinite"') + '불러오는 중…';

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = ADM_REFRESH_ICON.replace('%SPIN%', '') + '새로고침';
    const stamp = document.getElementById('adm-refresh-time');
    if (stamp) {
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      stamp.textContent = '최근 수신 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    admToast('캠페인 목록을 새로 받았습니다');
  }, 1100);
}

// 스테이징 재연동 — 외부 서버로 나가는 작업이라 모달 없이 버튼에서 바로 처리한다.
// TODO: 실제 연동 API 연결 (지금은 요청 접수까지만 표현)
function restageRow(btn) {
  if (btn.disabled) return;
  const row = btn.closest('tr');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = '재연동 중…';

  admToast('스테이징 재연동을 요청했습니다');

  setTimeout(() => {
    const badge = row?.children[7]?.querySelector('.adm-badge');
    if (badge) {
      badge.className = 'adm-badge adm-ok';
      badge.textContent = '연동완료';
    }
    btn.disabled = false;
    btn.textContent = label;
  }, 1200);
}

function hideRowMenu() {
  const m = document.getElementById('admRowMenu');
  if (m) { m.hidden = true; m._row = null; }
}

function toggleRowMenu(btn) {
  const menu = document.getElementById('admRowMenu');
  if (!menu) return;
  const row = btn.closest('tr');
  if (!menu.hidden && menu._row === row) { hideRowMenu(); return; }
  const r = btn.getBoundingClientRect();
  menu.hidden = false;
  menu._row = row;
  // 아래 공간이 부족하면 버튼 위쪽으로 띄운다
  const below = window.innerHeight - r.bottom;
  menu.style.left = Math.max(8, r.right - menu.offsetWidth) + 'px';
  menu.style.top = (below < menu.offsetHeight + 12 ? r.top - menu.offsetHeight - 6 : r.bottom + 6) + 'px';
}

document.addEventListener('click', function(e) {
  // 메인 탭
  const tabbtn = e.target.closest('[data-adm-tab]');
  if (tabbtn) {
    const tab = tabbtn.dataset.admTab;
    document.querySelectorAll('#p-admin [data-adm-tab]').forEach(b => b.classList.toggle('active', b.dataset.admTab === tab));
    document.querySelectorAll('.adm-panel').forEach(p => p.classList.toggle('active', p.id === 'adm-panel-' + tab));
    // 상단 우측 버튼은 탭마다 다르다 — 해당 탭에서만 노출
    const tabBtn = { report: ['adm-report-btn'], create: ['adm-refresh-time', 'adm-refresh-btn', 'adm-create-btn'] };
    Object.entries(tabBtn).forEach(function([t, ids]) {
      ids.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.hidden = (tab !== t);
      });
    });
    if (tab === 'sales' && window.scRender) window.scRender();
    return;
  }
  // 캠페인 목록 새로고침 (외부 서버 수신)
  if (e.target.closest('#adm-refresh-btn')) {
    admRefreshCampaigns();
    return;
  }
  // 캠페인 행 — 스테이징 재연동 (외부 서버 연동, 모달 없음)
  const restageBtn = e.target.closest('[data-adm-restage]');
  if (restageBtn) {
    restageRow(restageBtn);
    return;
  }
  // 행 수정 → 그 표에 맞는 모달을 채워서 연다
  const rowBtn = e.target.closest('[data-adm-edit-row]');
  if (rowBtn) {
    const tr = rowBtn.closest('tr');
    if (tr?.closest('#adm-panel-account')) openAccountEditModal(tr);
    else if (tr?.closest('#adm-sub-studio-popup')) openPopupModalFromRow(tr);
    else openCampaignModalFromRow(tr);
    return;
  }
  // 계정 삭제
  const accDel = e.target.closest('[data-adm-acc-del]');
  if (accDel) {
    const tr = accDel.closest('tr');
    const name = (tr?.children[0]?.textContent || '이 계정').trim();
    if (confirm(`${name} 계정을 삭제할까요?`)) { tr.remove(); updateAccountCount(); }
    return;
  }
  // 캠페인 행 — 더보기 메뉴
  const menuBtn = e.target.closest('[data-adm-rowmenu]');
  if (menuBtn) {
    toggleRowMenu(menuBtn);
    return;
  }
  if (!e.target.closest('#admRowMenu')) hideRowMenu();
  // 모달 접이식 섹션
  const accBtn = e.target.closest('[data-adm-acc]');
  if (accBtn) {
    accBtn.closest('.adm-acc')?.classList.toggle('open');
    return;
  }
  // 서브탭
  const subtabbtn = e.target.closest('[data-adm-sub]');
  if (subtabbtn) {
    const sub = subtabbtn.dataset.admSub;
    document.querySelectorAll('#p-admin [data-adm-sub]').forEach(b => b.classList.toggle('active', b.dataset.admSub === sub));
    document.querySelectorAll('.adm-subpanel').forEach(p => p.classList.toggle('active', p.id === 'adm-sub-' + sub));
    return;
  }
  // 모달 열기
  const modalTrigger = e.target.closest('[data-adm-modal]');
  if (modalTrigger) {
    const overlay = document.getElementById(modalTrigger.dataset.admModal);
    if (modalTrigger.dataset.admModal === 'modal-studio-campaign') resetCampaignModal();
    if (modalTrigger.dataset.admModal === 'modal-studio-popup') resetPopupModal();
    if (overlay) overlay.classList.add('open');
    return;
  }
  // 행 더보기 메뉴 항목
  const rowAct = e.target.closest('[data-rowmenu-act]');
  if (rowAct) {
    const menu = document.getElementById('admRowMenu');
    const row = menu?._row;
    if (row) {
      const badge = row.children[7]?.querySelector('.adm-badge');
      if (rowAct.dataset.rowmenuAct === 'end' && badge) {
        badge.className = 'adm-badge adm-hidden';
        badge.textContent = '종료';
      } else if (rowAct.dataset.rowmenuAct === 'delete' && badge) {
        badge.className = 'adm-badge adm-no';
        badge.textContent = '미반영';
      }
    }
    hideRowMenu();
    return;
  }
  // 모달 닫기
  const closeBtn = e.target.closest('[data-adm-close]');
  if (closeBtn) {
    closeBtn.closest('.adm-overlay')?.classList.remove('open');
    return;
  }
  // 오버레이 배경 클릭으로 닫기
  if (e.target.classList.contains('adm-overlay')) {
    e.target.classList.remove('open');
    return;
  }
  // 필터 칩
  const chip = e.target.closest('#p-admin .adm-chip');
  if (chip) {
    chip.closest('.adm-filters').querySelectorAll('.adm-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  }
});

// ════════════════════════════════════════════
// 영업 캘린더 (Sales Calendar)
// ════════════════════════════════════════════
(function () {
  var STORE_KEY = 'cs_sales_cal_v1';
  var STATUSES = ['미접촉', '접이중', '접촉완료', '진행', '무산'];
  var CLOSED = ['진행', '무산'];
  var scView = 'month';   // 달력이 기본 (영업 목록은 보조 뷰)
  var scMonth = startOfMonth(new Date());
  var scEditId = null;
  var scItems = scLoad();
  var scSortKey = 'date';
  var scSortDir = 1; // 1 = 오름차순, -1 = 내림차순

  function uid() { return Math.random().toString(36).slice(2, 10); }
  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function today0() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function dday(dateStr) {
    if (!dateStr) return 9999;
    var d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return 9999;
    return Math.round((d - today0()) / 86400000);
  }
  function fmtDate(s) {
    if (!s) return '—';
    var p = s.split('-');
    if (p.length < 3 || !p[1] || !p[2]) return s;
    return p[0].slice(2) + '.' + p[1] + '.' + p[2];
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function scLoad() {
    try { var r = localStorage.getItem(STORE_KEY); if (r) return JSON.parse(r); } catch (e) {}
    return [];
  }
  function scSave() { try { localStorage.setItem(STORE_KEY, JSON.stringify(scItems)); } catch (e) {} }

  function scSortVal(it, key) {
    if (key === 'date') return it.date || 'zzzzz';
    if (key === 'lastContact') return it.lastContact || 'zzzzz';
    if (key === 'title') return (it.title || '').toLowerCase();
    if (key === 'type') return (it.type || '').toLowerCase();
    if (key === 'filmCat') return (it.filmCat || '').toLowerCase();
    if (key === 'genre') return (it.genre || '').toLowerCase();
    if (key === 'company') return (it.company || '').toLowerCase();
    if (key === 'country') return (it.country || '').toLowerCase();
    if (key === 'source') return (it.source || '').toLowerCase();
    if (key === 'owner') return (it.owner || '').toLowerCase();
    if (key === 'status') return STATUSES.indexOf(it.status);
    if (key === 'priority') return { high: 0, mid: 1, low: 2, inprog: 3, none: 4 }[scPriority(it).cls];
    return '';
  }


  function scFiltered() {
    var type = (g('sc-fType') || {}).value || '';
    var filmCat = (g('sc-fFilmCat') || {}).value || '';
    // '전체'는 value="" 이므로 || 'open' 을 쓰면 안 됨 (전체가 미완료로 되돌아감)
    var statusEl = g('sc-fStatus');
    var status = statusEl ? statusEl.value : 'open';
    var q = ((g('sc-fQuery') || {}).value || '').trim().toLowerCase();
    var list = scItems.filter(function (it) {
      if (it.date && dday(it.date) < -7) return false;
      if (type && it.type !== type) return false;
      if (filmCat && it.filmCat !== filmCat) return false;
      if (status === 'open') { if (CLOSED.indexOf(it.status) !== -1) return false; }
      else if (status && it.status !== status) return false;
      if (q && (it.title + ' ' + (it.company || '')).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    list.sort(function (a, b) {
      var av = scSortVal(a, scSortKey), bv = scSortVal(b, scSortKey);
      if (av < bv) return -scSortDir;
      if (av > bv) return scSortDir;
      return 0;
    });
    return list;
  }

  function g(id) { return document.getElementById(id); }

  function scRenderTop() {
    var t = today0();
    var wd = ['일','월','화','수','목','금','토'][t.getDay()];
    var el = g('sc-today-date');
    if (el) el.textContent = t.getFullYear() + '. ' + pad(t.getMonth() + 1) + '. ' + pad(t.getDate()) + ' (' + wd + ')';
    var due = scItems.filter(function (it) {
      if (CLOSED.indexOf(it.status) !== -1) return false;
      var n = dday(it.date); return n >= 0 && n <= 60;
    }).length;
    var ce = g('sc-today-count');
    if (ce) ce.innerHTML = due ? '연락할 작품 <b style="color:var(--orange)">' + due + '</b>건' : '연락할 작품 없음';
    var openCnt = scItems.filter(function (it) { return CLOSED.indexOf(it.status) === -1; }).length;
    var tc = g('sc-tab-count');
    if (tc) tc.textContent = openCnt;
    var lc = g('sc-list-count');
    if (lc) lc.textContent = openCnt;
    var sn = g('sc-source-note');
    if (sn) sn.textContent = '전체 ' + scItems.length + '건';
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function scUpdateSortHead() {
    var head = g('sc-row-head');
    if (!head) return;
    head.querySelectorAll('[data-sort-key]').forEach(function (el) {
      var k = el.dataset.sortKey;
      el.classList.remove('sc-sort-asc', 'sc-sort-desc');
      if (k === scSortKey) el.classList.add(scSortDir === 1 ? 'sc-sort-asc' : 'sc-sort-desc');
    });
  }

  function scRenderList() {
    var tbody = g('sc-buckets'), empty = g('sc-empty');
    if (!tbody) return;
    var list = scFiltered();
    scUpdateSortHead();
    if (!list.length) { tbody.innerHTML = ''; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;
    tbody.innerHTML = list.map(rowHTML).join('');
  }

  function naverSearch(title, type) {
    var kw = type === '드라마' ? '드라마' : '영화';
    return 'https://search.naver.com/search.naver?where=nexearch&query=' + encodeURIComponent(title + ' ' + kw);
  }

  var KOBIS_POPUP_BASE = 'https://www.kobis.or.kr/kobis/business/mast/mvie/searchMovieList.do?dtTp=movie&dtCd=';

  // 우선순위 = 상태값 + 마감 임박도(D-day) 반영.
  // 무산=제외, 진행=진행중, 나머지(미접촉·접이중·접촉완료)는 개봉일까지 남은 일수로.
  function scPriority(it) {
    if (it.status === '무산') return { label: '제외', cls: 'none' };
    if (it.status === '진행') return { label: '진행', cls: 'inprog' };
    var n = dday(it.date);
    if (n === 9999 || n < 0) return { label: '낮음', cls: 'low' };
    if (n <= 14) return { label: '높음', cls: 'high' };
    if (n <= 30) return { label: '보통', cls: 'mid' };
    return { label: '낮음', cls: 'low' };
  }

  function rowHTML(it) {
    var n = dday(it.date);
    var urgent = n >= 0 && n <= 14 && CLOSED.indexOf(it.status) === -1;
    var ddayStr = n === 9999
      ? '<span class="sc-dday is-past">—</span>'
      : n < 0
        ? '<span class="sc-dday is-past">공개됨</span>'
        : '<span class="sc-dday' + (urgent ? ' is-urgent' : '') + '">D-' + n + '</span>';
    var pri = scPriority(it);
    var sourceCell = it.movieCd
      ? '<a class="sc-link-kobis" href="' + KOBIS_POPUP_BASE + esc(it.movieCd) + '" target="_blank" rel="noopener">KOBIS</a>'
      : (it.source ? '<span class="sc-source-tag">' + esc(it.source) + '</span>' : '<span style="color:var(--gray-light)">—</span>');
    return '<tr class="sc-tr' + (urgent ? ' is-urgent' : '') + (CLOSED.indexOf(it.status) !== -1 ? ' is-closed' : '') + '" data-sc-id="' + it.id + '">' +
      '<td class="sc-dday-col">' + ddayStr + '<span class="sc-date">' + fmtDate(it.date) + '</span></td>' +
      '<td style="text-align:center"><span class="sc-pri sc-pri--' + pri.cls + '">' + pri.label + '</span></td>' +
      '<td class="sc-title">' + esc(it.title) +
        (it.filmCat ? '<span class="sc-filmcat">' + esc(it.filmCat) + '</span>' : '') + '</td>' +
      '<td><span class="sc-type-badge">' + esc(it.type || '—') + '</span></td>' +
      '<td class="sc-genre">' + esc(it.genre || '—') + '</td>' +
      '<td class="sc-country">' + esc(it.country || '—') + '</td>' +
      '<td class="sc-company">' + esc(it.company || '—') + '</td>' +
      '<td>' + sourceCell + '</td>' +
      '<td><button class="sc-status sc-st-' + it.status + '" data-sc-cycle="' + it.id + '">' +
        '<i class="sc-dot"></i>' + it.status +
      '</button></td>' +
      '<td class="sc-owner">' + esc(it.owner || '—') + '</td>' +
    '</tr>';
  }

  // 캠페인 상태 → 바 색/라벨
  var CAMP_CAL = {
    done:             { cls: 'done',     label: '완료' },
    progress:         { cls: 'progress', label: '진행중' },
    'channel-select': { cls: 'upcoming', label: '준비' },
    recruiting:       { cls: 'upcoming', label: '예정' },
  };
  function scIso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // 캠페인 보고서 카드에서 캠페인을 읽는다. 시작=생성(불러오기 자동채움), 종료=보고서.
  // 실서비스에선 이 목록이 백엔드 조인 결과가 된다.
  function readReportCampaigns() {
    var out = [];
    document.querySelectorAll('.adm-report-grid .campaign-card').forEach(function (card) {
      var d = card.dataset;
      if (!d.editStart || !d.editEnd) return;
      out.push({
        name: d.editTitle || (card.querySelector('.card-title') || {}).textContent || '캠페인',
        start: d.editStart, end: d.editEnd,
        status: d.editStatus || d.campaignStatus || 'recruiting',
      });
    });
    return out;
  }

  // 달력 = 진행 캠페인만 (프로스펙트는 영업 목록 뷰). 기간을 가로 바로 그린다.
  function scRenderMonth() {
    var y = scMonth.getFullYear(), m = scMonth.getMonth();
    var lbl = g('sc-month-label');
    if (lbl) lbl.textContent = y + '년 ' + (m + 1) + '월';

    var gridStart = new Date(y, m, 1 - new Date(y, m, 1).getDay());
    var gridEnd = new Date(gridStart); gridEnd.setDate(gridStart.getDate() + 41);
    var gsISO = scIso(gridStart), geISO = scIso(gridEnd);
    var tISO = today0().toISOString().slice(0, 10);

    var camps = readReportCampaigns().filter(function (c) {
      return c.end >= gsISO && c.start <= geISO;   // 이 달 그리드에 걸치는 것만
    });

    var dows = ['일', '월', '화', '수', '목', '금', '토'];
    var html = '<div class="sc-cal-dows">' +
      dows.map(function (d, i) { return '<div class="sc-dow' + (i === 0 ? ' sun' : '') + '">' + d + '</div>'; }).join('') + '</div>';

    function colOf(weekStart, iso) {
      return Math.round((new Date(iso + 'T00:00:00') - weekStart) / 86400000);
    }

    var labeled = {};   // 캠페인별 라벨은 화면상 첫 세그먼트에 한 번만
    for (var w = 0; w < 6; w++) {
      var weekStart = new Date(gridStart); weekStart.setDate(gridStart.getDate() + w * 7);
      var weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
      var wsISO = scIso(weekStart), weISO = scIso(weekEnd);

      var days = '';
      for (var i = 0; i < 7; i++) {
        var cur = new Date(weekStart); cur.setDate(weekStart.getDate() + i);
        var iso = scIso(cur);
        days += '<div class="sc-wd' + (cur.getMonth() !== m ? ' is-out' : '') +
          (iso === tISO ? ' is-today' : '') + (cur.getDay() === 0 ? ' sun' : '') +
          '"><span class="sc-wd-n">' + cur.getDate() + '</span></div>';
      }

      // 이 주 세그먼트 + lane 배정(겹치면 다음 줄)
      var segs = camps.filter(function (c) { return c.end >= wsISO && c.start <= weISO; })
        .map(function (c) {
          var s = c.start > wsISO ? c.start : wsISO;
          var e = c.end < weISO ? c.end : weISO;
          return { c: c, col1: colOf(weekStart, s) + 1, col2: colOf(weekStart, e) + 1,
                   startsHere: c.start >= wsISO, endsHere: c.end <= weISO };
        }).sort(function (a, b) { return a.col1 - b.col1; });
      var laneEnd = [];
      segs.forEach(function (seg) {
        var lane = 0;
        while (lane < laneEnd.length && laneEnd[lane] >= seg.col1) lane++;
        seg.lane = lane; laneEnd[lane] = seg.col2;
      });
      var bars = segs.map(function (seg) {
        var info = CAMP_CAL[seg.c.status] || CAMP_CAL.recruiting;
        var showLabel = !labeled[seg.c.name];   // 화면 첫 세그먼트에만
        if (showLabel) labeled[seg.c.name] = 1;
        var cont = seg.startsHere ? '' : '‹ ';    // 앞 주에서 이어짐 표시
        return '<div class="sc-camp-bar sc-camp-' + info.cls +
          (seg.startsHere ? ' is-start' : '') + (seg.endsHere ? ' is-end' : '') +
          '" style="grid-column:' + seg.col1 + ' / ' + (seg.col2 + 1) + ';grid-row:' + (seg.lane + 1) + '"' +
          ' title="' + esc(seg.c.name) + ' · ' + info.label + ' (' + seg.c.start + '~' + seg.c.end + ')">' +
          (showLabel ? '<span class="sc-camp-label">' + cont + esc(seg.c.name) + '</span>' : '') + '</div>';
      }).join('');

      html += '<div class="sc-week">' +
        '<div class="sc-week-days">' + days + '</div>' +
        '<div class="sc-week-bars">' + bars + '</div></div>';
    }

    var grid = g('sc-cal-grid');
    if (grid) grid.innerHTML = html;
  }

  function scRender() { scRenderTop(); if (scView === 'list') scRenderList(); else scRenderMonth(); }

  // 시트 열기/닫기
  function scToggleCancelReason(status) {
    var wrap = g('sc-cancel-reason-wrap');
    if (wrap) wrap.hidden = (status !== '무산');
  }
  function scOpenSheet(id) {
    scEditId = id || null;
    var it = id ? scItems.find(function (x) { return x.id === id; }) : null;
    g('sc-sheet-title').textContent = it ? '일정 편집' : '일정 추가';
    g('sc-iTitle').value = it ? it.title : '';
    g('sc-iType').value = it ? it.type : '영화';
    g('sc-iCountry').value = it ? (it.country || '') : '';
    g('sc-iDate').value = it ? it.date : '';
    g('sc-iCompany').value = it ? (it.company || '') : '';
    g('sc-iContact').value = it ? (it.contact || '') : '';
    g('sc-iStatus').value = it ? it.status : '미접촉';
    g('sc-iPriority').value = it ? (it.priority || '보통') : '보통';
    g('sc-iOwner').value = it ? (it.owner || '') : '';
    g('sc-iLastContact').value = it ? (it.lastContact || '') : '';
    g('sc-iNextAction').value = it ? (it.nextAction || '') : '';
    g('sc-iNextActionDate').value = it ? (it.nextActionDate || '') : '';
    g('sc-iCancelReason').value = it ? (it.cancelReason || '') : '';
    g('sc-iUrl').value = it ? (it.url || '') : '';
    g('sc-iMemo').value = it ? (it.memo || '') : '';
    var mcInput = g('sc-iMovieCd'); if (mcInput) mcInput.value = it ? (it.movieCd || '') : '';
    scToggleCancelReason(it ? it.status : '미접촉');
    g('sc-btn-delete').hidden = !it;
    g('sc-sheet').hidden = false;
    setTimeout(function () { g('sc-iTitle').focus(); }, 40);
  }
  function scCloseSheet() { g('sc-sheet').hidden = true; scEditId = null; }
  function scSaveSheet() {
    var title = g('sc-iTitle').value.trim();
    var date = g('sc-iDate').value;
    if (!title) { scToast('작품명을 입력하세요'); g('sc-iTitle').focus(); return; }
    if (!date) { scToast('개봉일을 선택하세요'); g('sc-iDate').focus(); return; }
    var data = {
      title: title, type: g('sc-iType').value, date: date,
      country: g('sc-iCountry').value.trim(),
      company: g('sc-iCompany').value.trim(),
      contact: g('sc-iContact').value.trim(),
      status: g('sc-iStatus').value,
      priority: g('sc-iPriority').value,
      owner: g('sc-iOwner').value.trim(),
      lastContact: g('sc-iLastContact').value,
      nextAction: g('sc-iNextAction').value.trim(),
      nextActionDate: g('sc-iNextActionDate').value,
      cancelReason: g('sc-iCancelReason').value.trim(),
      url: g('sc-iUrl').value.trim(),
      memo: g('sc-iMemo').value.trim()
    };
    if (scEditId) {
      var it = scItems.find(function (x) { return x.id === scEditId; });
      Object.assign(it, data);
      // movieCd·source는 편집 시 보존 (덮어쓰지 않음)
    } else {
      var mcInput = g('sc-iMovieCd');
      var movieCd = mcInput ? mcInput.value.trim() : '';
      scItems.push(Object.assign({ id: uid(), source: movieCd ? 'KOBIS' : 'manual', movieCd: movieCd }, data));
    }
    scSave(); scCloseSheet(); scRender();
    scToast(scEditId ? '저장했습니다' : '추가했습니다');
  }
  function scDeleteItem() {
    if (!scEditId) return;
    scItems = scItems.filter(function (x) { return x.id !== scEditId; });
    scSave(); scCloseSheet(); scRender(); scToast('삭제했습니다');
  }

  var toastTimer;
  function scToast(msg) {
    var el = g('sc-toast'); if (!el) return;
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 1800);
  }

  // 이벤트
  document.addEventListener('click', function (e) {
    var sortSpan = e.target.closest('[data-sort-key]');
    if (sortSpan) {
      var k = sortSpan.dataset.sortKey;
      if (scSortKey === k) { scSortDir = -scSortDir; } else { scSortKey = k; scSortDir = 1; }
      if (scView === 'list') scRenderList();
      return;
    }
    if (e.target.id === 'sc-btn-sync') { scSync(); return; }
    if (e.target.id === 'sc-btn-add') { scOpenSheet(null); return; }
    if (e.target.id === 'sc-btn-save') { scSaveSheet(); return; }
    if (e.target.id === 'sc-btn-cancel' || e.target.id === 'sc-sheet-close') { scCloseSheet(); return; }
    if (e.target.id === 'sc-btn-delete') { scDeleteItem(); return; }
    if (e.target.id === 'sc-sheet-scrim') { scCloseSheet(); return; }
    if (e.target.id === 'sc-reset-filters') {
      var ft = g('sc-fType'), fs = g('sc-fStatus'), fq = g('sc-fQuery');
      if (ft) ft.value = ''; if (fs) fs.value = 'open'; if (fq) fq.value = '';
      scRender(); return;
    }
    var segBtn = e.target.closest('[data-sc-view]');
    if (segBtn) {
      scView = segBtn.dataset.scView;
      document.querySelectorAll('[data-sc-view]').forEach(function (b) { b.classList.toggle('active', b === segBtn); });
      var vl = g('sc-view-list'), vm = g('sc-view-month');
      if (vl) vl.hidden = scView !== 'list'; if (vm) vm.hidden = scView !== 'month';
      // 필터 + 상단 정보줄(날짜·연락할 작품 수·갱신·일정추가)은 영업 목록에서만 노출
      var flt = document.querySelector('.sc-filters');
      if (flt) flt.hidden = scView !== 'list';
      var top = document.querySelector('#adm-panel-sales .sc-toprow');
      if (top) top.hidden = scView !== 'list';
      scRender(); return;
    }
    if (e.target.id === 'sc-prev-month') { scMonth = new Date(scMonth.getFullYear(), scMonth.getMonth() - 1, 1); scRenderMonth(); return; }
    if (e.target.id === 'sc-next-month') { scMonth = new Date(scMonth.getFullYear(), scMonth.getMonth() + 1, 1); scRenderMonth(); return; }
    if (e.target.id === 'sc-this-month') { scMonth = startOfMonth(new Date()); scRenderMonth(); return; }
    var cycleBtn = e.target.closest('[data-sc-cycle]');
    if (cycleBtn) {
      e.stopPropagation();
      var itC = scItems.find(function (x) { return x.id === cycleBtn.dataset.scCycle; });
      if (itC) {
        itC.status = STATUSES[(STATUSES.indexOf(itC.status) + 1) % STATUSES.length];
        scSave(); scRender();
        var row = document.querySelector('tr[data-sc-id="' + itC.id + '"]');
        if (row) { row.classList.add('is-flash'); setTimeout(function () { row.classList.remove('is-flash'); }, 900); }
      }
      return;
    }
    var row = e.target.closest('tr[data-sc-id]');
    if (row && row.dataset.scId && !e.target.closest('.sc-link-col')) { scOpenSheet(row.dataset.scId); return; }
    var chip = e.target.closest('.sc-cal-chip');
    if (chip && chip.dataset.scId) { scOpenSheet(chip.dataset.scId); return; }
  });

  document.addEventListener('input', function (e) {
    if (['sc-fType','sc-fFilmCat','sc-fStatus','sc-fQuery'].indexOf(e.target.id) !== -1) scRender();
    if (e.target.id === 'sc-iTitle') scAcDebounce(e.target.value);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && g('sc-sheet') && !g('sc-sheet').hidden) scCloseSheet();
  });

  // 상태 변경 시 무산 사유 필드 표시/숨김
  var scStatusSel = g('sc-iStatus');
  if (scStatusSel) scStatusSel.addEventListener('change', function() { scToggleCancelReason(this.value); });

  // ── KOBIS API 연동 ────────────────────────────────────────────────
  var KOBIS_KEY = 'fc1410907e1bad0b8c48a0ebf75e7bcf';
  var KOBIS_BASE = 'https://www.kobis.or.kr/kobisopenapi/webservice/rest/';

  function kobisDateFmt(dt) {
    if (!dt) return '';
    if (dt.length === 8) return dt.slice(0,4) + '-' + dt.slice(4,6) + '-' + dt.slice(6,8);
    if (dt.length === 10 && dt.indexOf('-') !== -1) return dt;
    return '';
  }
  function kobisCompany(companys) {
    if (!companys || !companys.length) return '';
    // 배급사 우선, 없으면 수입사, 없으면 첫 번째 회사
    var dist = companys.find(function(c) { return c.companyPart === '배급사'; });
    if (dist) return dist.companyNm;
    var imp = companys.find(function(c) { return c.companyPart === '수입사'; });
    if (imp) return imp.companyNm;
    return companys[0].companyNm;
  }

  // 자동완성용 제목 검색 (OpenAPI)
  async function kobisFetch(params) {
    var url = KOBIS_BASE + 'movie/searchMovieList.json?key=' + KOBIS_KEY + '&itemPerPage=10&' + params;
    try {
      var res = await fetch(url);
      var json = await res.json();
      return (json.movieListResult && json.movieListResult.movieList) || [];
    } catch(e) { return []; }
  }

  // 개봉 예정작 조회 (searchMovieList.json — openDt·repNationNm·movieCd 반환)
  var KOBIS_PROXY = 'https://corsproxy.io/?url=';
  async function kobisScheduleFetch() {
    var y = new Date().getFullYear();
    var url = KOBIS_BASE + 'movie/searchMovieList.json?key=' + KOBIS_KEY +
      '&openStartDt=' + y + '&openEndDt=' + (y + 1) + '&itemPerPage=100&curPage=1';
    // 7일 전 기준 cutoff (이미 지난 개봉작 제외)
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    var cutoffStr = cutoff.getFullYear() + pad(cutoff.getMonth()+1) + pad(cutoff.getDate());
    async function tryFetch(u) {
      var r = await fetch(u); if (!r.ok) throw new Error('fail'); return r.json();
    }
    var json;
    try { json = await tryFetch(url); } catch(e) {
      try { json = await tryFetch(KOBIS_PROXY + encodeURIComponent(url)); } catch(e2) {
        try { json = await tryFetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url)); } catch(e3) { return []; }
      }
    }
    var ADULT_GENRES = ['성인물', '에로', '성인', 'adult', 'erotic'];
    var list = (json.movieListResult && json.movieListResult.movieList) || [];
    return list.filter(function(m) {
      // 성인물·에로 장르 제외
      var genre = (m.repGenreNm || '').toLowerCase();
      if (ADULT_GENRES.some(function(g) { return genre.indexOf(g) !== -1; })) return false;
      // 7일 이상 지난 개봉작 제외 (날짜 미등록은 유지)
      if (!m.openDt || m.openDt.length < 8) return true;
      return m.openDt >= cutoffStr;
    });
  }

  // ── 자동완성 ──
  var _acTimer;
  function scAcDebounce(val) {
    clearTimeout(_acTimer);
    if (!val || val.length < 2) { scAcClear(); return; }
    _acTimer = setTimeout(function() { scAcSearch(val); }, 380);
  }
  async function scAcSearch(q) {
    var movies = await kobisFetch('movieNm=' + encodeURIComponent(q));
    var drop = g('sc-ac-drop');
    if (!drop) return;
    if (!movies.length) { drop.hidden = true; return; }
    drop.innerHTML = movies.slice(0, 6).map(function(m) {
      var dt = kobisDateFmt(m.openDt);
      var co = kobisCompany(m.companys);
      return '<div class="sc-ac-item" data-mc="' + esc(m.movieCd) + '" data-mn="' + esc(m.movieNm) + '" data-dt="' + esc(dt) + '" data-co="' + esc(co) + '">' +
        '<span class="sc-ac-name">' + esc(m.movieNm) + '</span>' +
        '<span class="sc-ac-meta">' + (dt || '개봉일 미정') + (co ? ' · ' + co : '') + '</span>' +
      '</div>';
    }).join('');
    drop.hidden = false;
  }
  function scAcClear() { var d = g('sc-ac-drop'); if (d) d.hidden = true; }

  // 자동완성 클릭 → 폼 채우기
  document.addEventListener('click', function(e) {
    var item = e.target.closest('.sc-ac-item');
    if (item) {
      g('sc-iTitle').value  = item.dataset.mn;
      if (item.dataset.dt) g('sc-iDate').value = item.dataset.dt;
      if (item.dataset.co) g('sc-iCompany').value = item.dataset.co;
      g('sc-iType').value = '영화';
      g('sc-iUrl').value = '';
      // movieCd를 hidden input에 임시 저장 (저장 시 item에 반영)
      var mcInput = g('sc-iMovieCd');
      if (mcInput) mcInput.value = item.dataset.mc || '';
      scAcClear();
      return;
    }
    if (!e.target.closest('#sc-ac-drop') && !e.target.closest('#sc-iTitle')) scAcClear();
  });


  // ── 외부 API 동기화 (확장 가능 구조) ──────────────────────────────
  // 새 API 추가 시 _syncSources 배열에 { name, fn } 형태로 push
  var _syncSources = [];

  // KOBIS 소스 등록 (searchMovieList.json — movieCd·openDt·repNationNm 반환)
  _syncSources.push({
    name: 'KOBIS',
    fn: async function() {
      var movies = await kobisScheduleFetch();
      var added = 0;
      movies.forEach(function(m) {
        var title = m.movieNm || '';
        if (!title) return;
        var exists = scItems.some(function(it) { return it.title === title && it.source === 'KOBIS'; });
        if (exists) return;
        scItems.push({
          id: uid(), title: title, type: '영화',
          filmCat: m.typeNm || '',
          genre: m.repGenreNm || '',
          country: m.repNationNm || '한국',
          date: kobisDateFmt(m.openDt || '') || '',
          company: kobisCompany(m.companys),
          movieCd: m.movieCd || '',
          status: '미접촉', owner: '',
          url: '', memo: '', source: 'KOBIS'
        });
        added++;
      });
      return added;
    }
  });

  async function scSync() {
    var btn = g('sc-btn-sync');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    var orig = btn.innerHTML;
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin .6s linear infinite"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>갱신 중…';
    // 기존 리스트 전체 초기화 후 KOBIS 재수신
    scItems = [];
    var totalAdded = 0;
    for (var i = 0; i < _syncSources.length; i++) {
      try { totalAdded += await _syncSources[i].fn(); } catch(e) {}
    }
    scSave(); scRender();
    scToast(totalAdded ? 'KOBIS ' + totalAdded + '건 불러왔습니다' : 'KOBIS 데이터가 없습니다');
    btn.disabled = false;
    btn.innerHTML = orig;
  }

  // 전역 노출 (탭 전환 시 호출용)
  window.scRender = scRender;

  // 초기 렌더
  scRender();
})();

// 관리자 보고서 정렬 드롭다운 (기본순 = 위 진행 상황·날짜 정렬)
(function() {
  var sel = document.getElementById('adm-report-sort');
  if (!sel) return;
  function admSortReport() {
    var val = sel.value;
    var grid = document.querySelector('.adm-report-grid');
    if (!grid) return;
    var cards = Array.from(grid.querySelectorAll('.campaign-card'));
    cards.sort(function(a, b) {
      var pctA = parseFloat(a.dataset.pct) || 0;
      var pctB = parseFloat(b.dataset.pct) || 0;
      if (val === 'pct-desc') return pctB - pctA;
      if (val === 'pct-asc')  return pctA - pctB;
      return compareCampaignCards(a, b);
    });
    cards.forEach(function(c) { grid.appendChild(c); });
  }
  sel.addEventListener('change', admSortReport);
})();

// 캠페인 보고서 검색
(function() {
  var input = document.getElementById('adm-report-search');
  if (!input) return;
  input.addEventListener('input', function() {
    var q = this.value.trim().toLowerCase();
    var grid = document.querySelector('.adm-report-grid');
    if (!grid) return;
    grid.querySelectorAll('.campaign-card').forEach(function(card) {
      var title = (card.querySelector('.card-title')?.textContent || '').toLowerCase();
      var client = (card.dataset.editClient || '').toLowerCase();
      card.hidden = q ? !(title.includes(q) || client.includes(q)) : false;
    });
  });
})();

// 정적 테이블(캠페인 생성, 계정 관리) 열 정렬
(function() {
  var admSortState = {};
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.adm-th-sort[data-adm-col]');
    if (!btn) return;
    var thead = btn.closest('thead');
    if (!thead) return;
    var table = thead.closest('table');
    if (!table) return;
    var colIdx = parseInt(btn.dataset.admCol, 10);
    var key = table.id || table.className;
    var cur = admSortState[key] || { col: -1, dir: 'asc' };
    var dir = (cur.col === colIdx && cur.dir === 'asc') ? 'desc' : 'asc';
    admSortState[key] = { col: colIdx, dir: dir };

    // 헤더 아이콘 업데이트
    thead.querySelectorAll('.adm-th-sort').forEach(function(b) {
      b.classList.remove('adm-sort-asc', 'adm-sort-desc');
    });
    btn.classList.add(dir === 'asc' ? 'adm-sort-asc' : 'adm-sort-desc');

    // tbody 행 정렬
    var tbody = table.querySelector('tbody');
    if (!tbody) return;
    var rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort(function(a, b) {
      var cellA = (a.cells[colIdx] ? a.cells[colIdx].textContent : '').trim();
      var cellB = (b.cells[colIdx] ? b.cells[colIdx].textContent : '').trim();
      var numA = parseFloat(cellA.replace(/[^0-9.-]/g, ''));
      var numB = parseFloat(cellB.replace(/[^0-9.-]/g, ''));
      var cmp = (!isNaN(numA) && !isNaN(numB))
        ? numA - numB
        : cellA.localeCompare(cellB, 'ko');
      return dir === 'asc' ? cmp : -cmp;
    });
    rows.forEach(function(r) { tbody.appendChild(r); });
  });
})();

// ── 경계 글로우 animation 동기화 — 항상 상위 섹션 기준으로 하위를 맞춤 ──
(function syncGlowAnimations() {
  // refClass: 상위 섹션 클래스, targetClass: 하위 섹션 클래스
  var pairs = [
    { name: 'br3-breathe', ref: 'p0-products-section', target: 'p0-role-section' },
    { name: 'br4-breathe', ref: 'p0-role-section',     target: 'p0-cta' }
  ];

  function sync() {
    var all = document.getAnimations();
    pairs.forEach(function(p) {
      var anims = all.filter(function(a) { return a.animationName === p.name; });
      if (anims.length < 2) return;
      var refAnim = null;
      anims.forEach(function(a) {
        var el = a.effect && a.effect.target;
        if (el && el.classList && el.classList.contains(p.ref)) refAnim = a;
      });
      if (!refAnim) refAnim = anims[0];
      var t = refAnim.currentTime;
      anims.forEach(function(a) { if (a !== refAnim) a.currentTime = t; });
    });
  }
  requestAnimationFrame(function() { requestAnimationFrame(sync); });
})();

// ── 영상 테이블 체크박스 액션바 ─────────────────────────────────────────
(function() {
  function getChecked() {
    return [...document.querySelectorAll('.vid-row-cb:checked')];
  }

  function syncSelectAll(table) {
    const all = table.querySelector('.vid-select-all');
    const rows = [...table.querySelectorAll('.vid-row-cb')];
    if (!all || !rows.length) return;
    const checkedCount = rows.filter(r => r.checked).length;
    all.checked = checkedCount === rows.length;
    all.indeterminate = checkedCount > 0 && checkedCount < rows.length;
  }

  function updateBar() {
    const bar = document.getElementById('vidActionBar');
    if (!bar) return;
    const checked = getChecked();
    if (!checked.length) { bar.hidden = true; return; }
    bar.hidden = false;
    document.getElementById('vidActionCount').textContent = checked.length;
    const hasPremium = checked.some(cb => cb.closest('table')?.dataset.vidMode === 'premium');
    document.getElementById('vidActionVideo').hidden = !hasPremium;
  }

  document.addEventListener('change', function(e) {
    const cb = e.target;
    if (cb.classList.contains('vid-select-all')) {
      const table = cb.closest('table');
      if (table) table.querySelectorAll('.vid-row-cb').forEach(c => { c.checked = cb.checked; });
      updateBar();
      return;
    }
    if (cb.classList.contains('vid-row-cb')) {
      const table = cb.closest('table');
      if (table) syncSelectAll(table);
      updateBar();
    }
  });

  document.addEventListener('click', function(e) {
    if (e.target.id === 'vidActionChannel') {
      getChecked().forEach(cb => {
        const cid = decodeURIComponent(cb.dataset.cid || '');
        if (cid) window.open('https://www.youtube.com/' + cid, '_blank');
      });
      return;
    }
    if (e.target.id === 'vidActionVideo') {
      getChecked().forEach(cb => {
        const url = cb.dataset.url;
        if (url) window.open(url, '_blank');
      });
      return;
    }
    if (e.target.id === 'vidActionClose') {
      document.querySelectorAll('.vid-row-cb, .vid-select-all').forEach(c => {
        c.checked = false;
        c.indeterminate = false;
      });
      document.getElementById('vidActionBar').hidden = true;
    }
  });
})();

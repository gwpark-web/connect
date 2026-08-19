try { emailjs.init('PR1yiM-fDVGYx5wCo'); } catch(e) { console.warn('EmailJS init failed', e); }

// ── ROUTING ──
const pages = ['p1','p3','p4','p7','p-shop','p-list','p-form','p-channels','p-detail','p-detail-upload'];
const authPages = ['p-signup','p-brochure'];
const navMap = { p1:'nav-p1', p3:'nav-p3', p7:'nav-p7' };
const ctaPages = ['p-shop','p-form','p-channels'];
const p0ActivePages = ['p1','p3','p4','p7'];

function goBackToList() { goTo('p-list'); }

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
  authPages.forEach(p => document.getElementById(p).classList.remove('active'));
  pages.forEach(p => document.getElementById(p).classList.remove('active'));
  document.getElementById(id).classList.add('active');
  Object.values(navMap).forEach(n => document.getElementById(n)?.classList.remove('active'));
  document.getElementById(navMap[id])?.classList.add('active');
  document.body.classList.toggle('p0-active', p0ActivePages.includes(id));
  window.scrollTo(0,0);
  document.getElementById('p1').scrollTop = 0;

  const bar = document.getElementById('ctaBar');
  if (ctaPages.includes(id)) {
    bar.classList.add('visible');
    updateCta(id);
  } else {
    bar.classList.remove('visible');
  }

  if (id === 'p-channels') { updateSortArrows(); renderChannels(); updateChSummary(); }
  if (id === 'p-list') { if (typeof updateListCardPremium === 'function') updateListCardPremium(); }
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

// ── p-shop — 상품 선택 ──
let selectedProduct = null;
function selectProduct(key, name, price) {
  document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('prod-'+key).classList.add('selected');
  selectedProduct = { key, name, price };
  updateCta('p-shop');
}

// ── p-form — 날짜 계산 ──
function calcDates() {
  const live = document.getElementById('liveDate').value;
  if (!live) return;
  const d = new Date(live);
  const open = new Date(d); open.setDate(d.getDate()-14);
  const close = new Date(d); close.setDate(d.getDate()-11);
  document.getElementById('openDate').value = open.toISOString().split('T')[0];
  document.getElementById('closeDate').value = close.toISOString().split('T')[0];
}

// ── CTA ──
function updateCta(page) {
  const info = document.getElementById('ctaInfo');
  const btn = document.getElementById('ctaBtn');
  if (page === 'p-shop') {
    if (selectedProduct) {
      info.innerHTML = `선택: <strong>${selectedProduct.name}</strong> &nbsp;·&nbsp; <span class="orange">${selectedProduct.price}</span> (VAT 별도)`;
      btn.classList.add('on'); btn.textContent = '다음 단계로 →';
    } else {
      info.innerHTML = '상품을 선택해 주세요';
      btn.classList.remove('on');
    }
  } else if (page === 'p-form') {
    info.innerHTML = '정보를 입력하고 다음 단계로 진행하세요';
    btn.classList.add('on'); btn.textContent = '다음 단계로 →';
  } else if (page === 'p-channels') {
    const n = Object.values(chState || {}).filter(s => s === 'selected').length;
    if (n >= 30) {
      info.innerHTML = `<strong style="color:var(--orange)">30개 선정 완료</strong> · 확정 후 제작 가이드가 전달됩니다`;
      btn.classList.add('on'); btn.textContent = '선정 확정 →';
    } else if (n > 0) {
      info.innerHTML = `<strong>${n}개</strong> 선정됨 · 목표 30개까지 추가 선정 가능`;
      btn.classList.remove('on');
    } else {
      info.innerHTML = '채널을 선택해 주세요 (최대 30개)';
      btn.classList.remove('on');
    }
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
    subEl.textContent   = '총 310개 댓글 중 주요 반응 · 긍정 순';
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
  return '<ul class="stat-cmt-list">' + items.map(d => {
    const c = _STAT_TAG_COLOR[d.tag] || '#888';
    return `<li class="stat-cmt-item">
      <div class="stat-cmt-meta">
        <span class="stat-cmt-tag" style="background:${c}1a;color:${c}">${d.tag}</span>
        <span class="stat-cmt-likes">♥ ${d.likes.toLocaleString()}</span>
      </div>
      <p class="stat-cmt-text">"${d.text}"</p>
      <span class="stat-cmt-ch">— ${d.channel}</span>
    </li>`;
  }).join('') + '</ul>';
}

document.getElementById('statModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeStatModal();
});

function handleCta() {
  const active = pages.find(p => document.getElementById(p).classList.contains('active'));
  if (active === 'p-shop') goTo('p-form');
  else if (active === 'p-form') goTo('p-channels');
  else if (active === 'p-channels') { alert('선정 완료! 캠페인이 시작됩니다.'); goTo('p-list'); }
}

// ── SCROLL — #p1이 스크롤 컨테이너이므로 window 대신 #p1 이벤트 감지 ──
const _p1El = document.getElementById('p1');
_p1El.addEventListener('scroll', () => {
  document.querySelector('.gnb').classList.toggle('scrolled', _p1El.scrollTop > 30);
});

// ── INIT ──
goTo('p1');
document.body.classList.add('p0-active');

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

function p0CcToggle(mode) {
  document.querySelectorAll('#p0CcToggle .p0rt-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.args === mode)
  );
  const track = document.querySelector('#p0CcCard2 .p0-cc-slider-track');
  if (track) track.style.transform = `translateX(-${mode === 'pre' ? 100 : 0}%)`;
}

// ── EVENT DISPATCHER (MV3 CSP: no inline handlers) ──
(function() {
  const fnMap = {
    goTo, goToAuth, goBackToList, doLogin, handleCta,
    selectProduct,
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
    openReviewModal, closeReviewModal, approveReview, requestRevision, cancelRevision, submitRevision,
    toggleSimPost,
    p0RoleToggle,
    p0CcToggle
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
    if (el.dataset.change === 'calcDates') { calcDates(); return; }
    if (el.dataset.change === 'showBizFile') { showBizFile(el); return; }
    if (el.dataset.change === 'toggleAllAgree') { toggleAllAgree(el); return; }
  });

  initCampaignFilter();
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

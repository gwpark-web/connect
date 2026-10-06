try { emailjs.init('PR1yiM-fDVGYx5wCo'); } catch(e) { console.warn('EmailJS init failed', e); }

// ── ROUTING ──
const pages = ['p1','p3','p4','p-list','p-channels','p-detail','p-detail-upload','p-detail-empty','p-admin'];
const authPages = ['p-brochure'];
const navMap = { p1:'nav-p1', p3:'nav-p3' };
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

// 상태 칩 · 유형 선택 · 캠페인명 검색을 한꺼번에 적용 (하나만 바꿔도 나머지 조건이 유지되도록)
function filterCampaigns() {
  const typeVal = document.getElementById('campaignTypeFilter')?.value || 'all';
  const activeChip = document.querySelector('#p-list .status-chip.active');
  const statusVal = activeChip ? activeChip.dataset.status : 'all';
  const query = (document.getElementById('campaignSearch')?.value || '').trim().toLowerCase();
  document.querySelectorAll('#p-list .campaign-card').forEach(card => {
    const typeMatch = typeVal === 'all' || card.dataset.campaignType === typeVal;
    const statusMatch = statusVal === 'all' || card.dataset.campaignStatus === statusVal;
    const title = (card.querySelector('.card-title')?.textContent || '').toLowerCase();
    const queryMatch = !query || title.includes(query);
    card.style.display = (typeMatch && statusMatch && queryMatch) ? '' : 'none';
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
  const search = document.getElementById('campaignSearch');
  if (search) search.addEventListener('input', filterCampaigns);

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
  // 서버 주소가 설정된 환경에서는 관리자 화면을 관리자 로그인 후에만 연다
  if (id === 'p-admin' && Api.enabled && !Api.isAdmin()) {
    alert(Api.isUp() ? '관리자 계정으로 로그인해주세요.' : '로그인 서버에 연결할 수 없습니다. 서버가 켜져 있는지 확인해주세요.');
    return;
  }
  if (DETAIL_PAGES.includes(id)) {
    const cur = pages.find(p => document.getElementById(p)?.classList.contains('active'));
    if (cur && !DETAIL_PAGES.includes(cur)) {
      campaignReturnPage = cur;
      // 로그인한 상태면 계정의 역할을, 아니면(데모) 들어온 경로로 판정한다
      document.body.dataset.viewerRole = Api.isLoggedIn()
        ? (Api.isAdmin() ? 'admin' : 'advertiser')
        : (cur === 'p-admin' ? 'admin' : 'advertiser');
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

  // 프리미엄 3단계 화면은 캠페인마다 상태가 다르다 — 카드에서 열었으면 그 캠페인으로, 아니면 기본(데모)으로 맞춘다
  if (typeof pmEnsureContext === 'function') {
    if (id === 'p-channels' && window._pmNextCtx) { const n = window._pmNextCtx; window._pmNextCtx = null; pmEnsureContext(n.key, n.vals); }
    else pmEnsureContext('demo');
  }
  if (id === 'p-channels') { updateSortArrows(); renderChannels(); updateChSummary(); }
  if (id === 'p-list' || id === 'p-admin') { if (typeof updateListCardPremium === 'function') updateListCardPremium(); }
  if (id === 'p1') { setTimeout(runStatCountUp, 200); }
  // 검토용 백엔드에 저장된 참여 영상 데이터가 있으면 복원(서버 미실행 시 조용히 무시)
  if (id === 'p-detail' || id === 'p-detail-upload') { ruLoadFromServer(id); }
  // 캠페인 카드 정보·회차 타임라인(관리자는 작업본, 광고주는 연동된 내용)
  if (['p-list', 'p-admin', 'p-detail', 'p-detail-upload', 'p-channels'].includes(id)) { metaLoad(); }
}

function goToAuth(id) {
  authPages.forEach(p => document.getElementById(p).classList.remove('active'));
  pages.forEach(p => document.getElementById(p).classList.remove('active'));
  document.body.classList.toggle('p0-active', id === 'p-brochure');
  document.getElementById(id).classList.add('active');
}

// 로그인 실패 메시지를 로그인 상자 안에 보여준다
function showLoginError(msg) {
  const el = document.getElementById('loginError');
  if (!el) { if (msg) alert(msg); return; }
  el.textContent = msg || '';
  el.hidden = !msg;
}

// 서버가 있으면 실제 계정으로 로그인한다(관리자 → 관리자 화면, 광고주 → 내 캠페인).
// 서버 주소가 없는 공개 데모에서는 입력값이 있으면 데모 로그인으로 넘어간다.
async function doLogin() {
  const inputs = document.querySelectorAll('#p4 .auth-form-box .auth-input');
  const idEl = inputs[0], pwEl = inputs[1];
  const id = (idEl?.value || '').trim();
  const pw = pwEl?.value || '';
  showLoginError('');
  if (!id || !pw) { showLoginError('아이디(이메일)와 비밀번호를 입력해주세요.'); return; }

  if (Api.enabled) {
    if (!(Api.isUp() || await Api.ping())) {
      showLoginError('로그인 서버에 연결할 수 없습니다. 서버가 켜져 있는지 확인해주세요.');
      return;
    }
    const r = await Api.login(id, pw);
    if (!r.ok) {
      showLoginError(r.status === 401 ? '아이디(이메일) 또는 비밀번호를 확인해주세요.' : (r.error || '로그인에 실패했습니다.'));
      return;
    }
    pwEl.value = '';
    ruResetVidTables();
    authPages.forEach(p => document.getElementById(p).classList.remove('active'));
    updateGnbSession();
    await syncCampaigns();
    if (Api.isAdmin()) zealSyncFromServer(); else zealClear();
    metaLoad();
    goTo(Api.isAdmin() ? 'p-admin' : 'p-list');
    return;
  }
  authPages.forEach(p => document.getElementById(p).classList.remove('active'));
  goTo('p-list');
}

// 서버가 연결된 환경에서는 관리자도 같은 로그인으로 들어오므로 '관리자' 지름길 버튼을 숨긴다.
// (서버 주소가 없는 공개 데모에서는 관리자 화면을 볼 유일한 입구라 그대로 둔다)
if (Api.enabled) document.querySelectorAll('.adm-entry-btn').forEach(b => { b.hidden = true; });

// Enter 키로 로그인, 입력을 고치면 이전 오류 메시지를 지운다
document.querySelectorAll('#p4 .auth-form-box .auth-input').forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  el.addEventListener('input', () => showLoginError(''));
});

// 참여 영상 표를 처음(데모) 상태로 되돌린다 — 로그아웃/다른 계정 로그인 시 이전 계정이 본 리포트가 남지 않게 한다
const _vidTableBaseline = new Map();
const _vidStatBaseline = new Map();
document.querySelectorAll('.vid-table tbody').forEach(tb => _vidTableBaseline.set(tb, tb.innerHTML));
document.querySelectorAll('.vid-card .vid-stat-strip').forEach(st => _vidStatBaseline.set(st, [...st.querySelectorAll('.vid-stat-num')].map(n => n.textContent)));
// 타임라인·정적 캠페인 카드도 처음 상태를 기억했다가 로그아웃/로그인 때 되돌린다(이전 계정이 고친 내용이 남지 않게)
const _tlBaseline = new Map();
document.querySelectorAll('.cd-tl-list').forEach(l => _tlBaseline.set(l, l.innerHTML));
const _cardBaseline = new Map();
document.querySelectorAll('.campaign-card:not([data-server-id])').forEach(c => {
  _cardBaseline.set(c, { html: c.innerHTML, attrs: [...c.attributes].map(a => [a.name, a.value]) });
});
function ruResetVidTables() {
  _vidTableBaseline.forEach((html, tb) => { tb.innerHTML = html; });
  _vidStatBaseline.forEach((texts, st) => {
    st.querySelectorAll('.vid-stat-num').forEach((n, i) => { n.textContent = texts[i]; });
    const card = st.closest('.vid-card'); if (card) delete card.dataset.statLive;
  });
  _tlBaseline.forEach((html, l) => { l.innerHTML = html; });
  _cardBaseline.forEach((b, c) => {
    [...c.attributes].forEach(a => c.removeAttribute(a.name));
    b.attrs.forEach(([n, v]) => c.setAttribute(n, v));
    c.innerHTML = b.html;
  });
  window._pubByKey = {};
  if (typeof pmReset === 'function') pmReset();   // 새 프리미엄 캠페인에서 만든 채널·선정 상태는 계정이 바뀌면 버린다
}

// ── 참여 영상 요약(총 업로드수·조회수·좋아요·댓글) — 리포트가 반영되면 표의 행에서 다시 계산한다 ──
// 서버에 올린/조회한 데이터가 들어온 뒤(statLive)에만 계산한다. 그 전에는 예시(정적) 숫자를 그대로 둔다.
function vidRecomputeStats(card) {
  const table = card && card.querySelector('.vid-table');
  const strip = card && card.querySelector('.vid-stat-strip');
  if (!table || !strip) return;
  const col = l => ruTableColIndex(table, l);
  const ci = { views: col('조회수'), likes: col('좋아요'), comments: col('댓글') };
  const sum = { views: 0, likes: 0, comments: 0 };
  const trs = [...table.querySelectorAll('tbody tr')];
  trs.forEach(tr => {
    Object.keys(sum).forEach(k => {
      if (ci[k] < 0 || !tr.children[ci[k]]) return;
      sum[k] += ruParseNumber(tr.children[ci[k]].textContent) || 0;
    });
  });
  const nums = [...strip.querySelectorAll('.vid-stat-num')];
  const vals = [trs.length, sum.views, sum.likes, sum.comments];
  nums.forEach((n, i) => { if (i < vals.length) n.textContent = vals[i].toLocaleString(); });
  card.dataset.statLive = '1';
}

function doLogout() {
  Api.logout();
  ruResetVidTables();
  zealClear();                       // 관리자가 받아 둔 짤 회원 정보(연락처 등)를 메모리에서 지운다
  document.querySelectorAll('.campaign-card[data-server-id]').forEach(el => el.remove());
  updateGnbSession();
  goTo('p1');
}

// 상단 Login 버튼을 로그인 상태에 맞춰 바꾼다
// 로그인한 사용자의 첫 화면(관리자 → 관리자 화면, 광고주 → 내 캠페인 목록)
function goMyPage() {
  if (!Api.isLoggedIn()) { goTo('p4'); return; }
  goTo(Api.isAdmin() ? 'p-admin' : 'p-list');
}

function updateGnbSession() {
  const mp = document.getElementById('gnb-mypage');
  if (mp) mp.hidden = !Api.isLoggedIn();
  const b = document.querySelector('.gnb-btn-login:not(.gnb-btn-mypage)');
  if (!b) return;
  if (Api.isLoggedIn()) { b.textContent = '로그아웃'; b.dataset.fn = 'doLogout'; delete b.dataset.args; }
  else { b.textContent = 'Login'; b.dataset.fn = 'goTo'; b.dataset.args = 'p4'; }
  const gni = document.getElementById('gnb-user-info');
  if (gni && Api.isLoggedIn()) gni.textContent = (Api.isAdmin() ? '관리자 · ' : '') + Api.user().name;
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

  // EmailJS는 send()에 넘긴 키 이름이 템플릿 안의 {{변수}}와 "똑같아야" 내용이 채워진다.
  // 템플릿 쪽 변수명을 모르는 상태라 자주 쓰이는 이름(subject/body, message, from_name,
  // reply_to)을 전부 같이 보낸다 — 템플릿이 쓰지 않는 키는 그냥 무시되니 더 보낸다고 문제되지 않는다.
  const brochureBody =
    `회사명 / 브랜드명 : ${company}\n` +
    `이메일            : ${email}\n` +
    `카테고리          : ${cats}`;
  emailjs.send(EJS_SVC, EJS_TPL, {
    subject: `[커넥트 스튜디오] 상품소개서 요청 - ${company}`,
    body: brochureBody,
    message: brochureBody,
    from_name: company,
    reply_to: email,
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

  // EmailJS는 send()에 넘긴 키 이름이 템플릿 안의 {{변수}}와 "똑같아야" 내용이 채워진다.
  // 템플릿 쪽 변수명을 모르는 상태라 자주 쓰이는 이름(subject/body, message, from_name,
  // reply_to)을 전부 같이 보낸다 — 템플릿이 쓰지 않는 키는 그냥 무시되니 더 보낸다고 문제되지 않는다.
  const inquiryBody =
    `회사명 / 브랜드명 : ${company}\n` +
    `담당자명          : ${name}\n` +
    `연락처            : ${phone}\n` +
    `이메일            : ${email}\n\n` +
    `광고 카테고리     : ${cats}\n` +
    `집행 플랫폼       : ${platforms}\n` +
    `예산 규모         : ${budget}\n` +
    `희망 라이브 시기  : ${timing}`;
  emailjs.send(EJS_SVC, EJS_TPL, {
    subject: `[커넥트 스튜디오] 캠페인 문의 - ${company}`,
    body: inquiryBody,
    message: inquiryBody,
    from_name: company,
    reply_to: email,
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
  const productBtn = document.querySelector('#ncr-products .ncr-prod-btn.selected');
  const product = productBtn?.dataset.args;
  const platformBtns = [...document.querySelectorAll('#ncr-platforms .ncr-plat-btn.selected')];
  const platforms = platformBtns.map(b => b.dataset.args);

  document.getElementById('ncr-name').classList.toggle('error', !name);
  document.getElementById('ncr-products').classList.toggle('error', !product);
  document.getElementById('ncr-platforms').classList.toggle('error', platforms.length === 0);
  if (!name || !product || platforms.length === 0) return;

  const flexible = document.getElementById('ncr-flexible').checked;
  const goal = document.getElementById('ncr-goal').value.trim();
  const date = flexible ? '협의 가능' : (document.getElementById('ncr-date').value || '(미입력)');
  const memo = document.getElementById('ncr-memo').value.trim();
  const productLabel = (productBtn.querySelector('.ncr-prod-name')?.textContent || product).trim();
  const platformLabel = platformBtns.map(b => b.textContent.trim()).join(', ');

  // 문의하기·상품소개서 요청과 같은 방식(EmailJS)으로 담당자에게 메일을 보낸다.
  // 키 이름 규칙(subject/body/message/from_name/reply_to)도 동일하다 — submitInquiry 주석 참고.
  const requestBody =
    `캠페인명          : ${name}\n` +
    `희망 상품         : ${productLabel}\n` +
    `집행 플랫폼       : ${platformLabel}\n` +
    `목표              : ${goal || '(미입력)'}\n` +
    `희망 시작일       : ${date}\n` +
    `메모              : ${memo || '(없음)'}`;

  const submitBtn = document.querySelector('#newCampaignModal .ncr-submit');
  if (submitBtn) submitBtn.disabled = true;
  emailjs.send(EJS_SVC, EJS_TPL, {
    subject: `[커넥트 스튜디오] 새 캠페인 요청 - ${name}`,
    body: requestBody,
    message: requestBody,
    from_name: name,
    reply_to: '',
  }).then(() => {
    closeNewCampaignModal();
    // 같은 내용이 다시 전송되지 않도록 입력을 비운다
    ['ncr-name', 'ncr-goal', 'ncr-date', 'ncr-memo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('ncr-flexible').checked = false;
    document.getElementById('ncr-date').disabled = false;
    document.querySelectorAll('#ncr-products .ncr-prod-btn.selected, #ncr-platforms .ncr-plat-btn.selected').forEach(b => b.classList.remove('selected'));
    const toast = document.getElementById('ncrToast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }).catch(() => {
    alert('전송 중 오류가 발생했습니다. 다시 시도해주세요.');
  }).finally(() => {
    if (submitBtn) submitBtn.disabled = false;
  });
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

// ── 참여 영상 표: 30개까지만 보여주고 나머지는 [전체 보기]로 펼친다 ──
const VID_PAGE_LIMIT = 30;

// 필터를 통과한 행 중 31번째부터 숨기고(펼쳤으면 모두 표시), 버튼 문구·표시를 맞춘다
function vidApplyLimit(card) {
  if (!card) return;
  const rows = [...card.querySelectorAll('.vid-table tbody tr')].filter(tr => tr.style.display !== 'none');
  const expanded = card.dataset.vidExpanded === '1';
  rows.forEach((tr, i) => tr.classList.toggle('vid-row-extra', !expanded && i >= VID_PAGE_LIMIT));
  const btn = card.querySelector('.vid-expand-btn');
  if (!btn) return;
  btn.hidden = rows.length <= VID_PAGE_LIMIT;
  btn.textContent = expanded ? '접기 ↑' : `전체 ${rows.length.toLocaleString()}개 보기 ↓`;
}

function toggleVidList() {
  // 클릭 위임 방식이라 버튼을 인자로 받지 못한다 — 지금 화면에 보이는 버튼의 카드를 쓴다
  const card = [...document.querySelectorAll('.vid-expand-btn')].find(b => b.offsetParent !== null)?.closest('.vid-card');
  if (!card) return;
  card.dataset.vidExpanded = card.dataset.vidExpanded === '1' ? '0' : '1';
  vidApplyLimit(card);
}

// 행이 추가·삭제·복원될 때마다 자동으로 다시 계산한다
document.querySelectorAll('.vid-card .vid-table tbody').forEach(tb => {
  const card = tb.closest('.vid-card');
  new MutationObserver(() => { vidApplyLimit(card); if (card.dataset.statLive === '1') vidRecomputeStats(card); }).observe(tb, { childList: true });
  vidApplyLimit(card);
});

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

// 지금 보이는 참여 영상 카드 — 리포트가 반영되어 요약이 다시 계산된 상태면 실제 표에서 TOP10 을 만든다
function _liveStatCard() {
  const table = findVisibleVidTable();
  const card = table && table.closest('.vid-card');
  return card && card.dataset.statLive === '1' ? { card, table } : null;
}

// 표의 행 → TOP10 항목. field: '조회수' | '좋아요'
function _statItemsFromTable(table, field) {
  const col = l => ruTableColIndex(table, l);
  const ni = col('채널명'), si = col('구독자'), vi = col(field), ti = col('영상 제목');
  const palette = [['#fff0e8', '#e05000'], ['#e8f0ff', '#3050d0'], ['#f0e8ff', '#7030a0'], ['#eae8f0', '#5e3ea0'], ['#e8f0f0', '#2a7070'], ['#eaf0e8', '#3a7d44'], ['#ffe8e8', '#c03030'], ['#e8fff0', '#208050']];
  const items = [...table.querySelectorAll('tbody tr')].map(tr => {
    const name = ruNormalizeName(tr.children[ni]?.getAttribute('title') || tr.children[ni]?.textContent);
    const a = tr.children[ti]?.querySelector('a');
    const href = a ? a.getAttribute('href') : '';
    const sum = [...name].reduce((n, ch) => n + ch.charCodeAt(0), 0);
    const [bg, fg] = palette[sum % palette.length];
    return {
      avatar: (name || '?').charAt(0), bg, fg, name,
      subs: (tr.children[si]?.textContent || '-').trim(),
      val: ruParseNumber(tr.children[vi]?.textContent) || 0,
      url: /^https?:\/\//i.test(href || '') ? href : '',
    };
  }).filter(d => d.name && d.val > 0);
  return items.sort((x, y) => y.val - x.val).slice(0, 10);
}

async function openStatModal(type) {
  const titleEl = document.getElementById('statModalTitle');
  const subEl   = document.getElementById('statModalSub');
  const bodyEl  = document.getElementById('statModalBody');
  const live = _liveStatCard();
  const empty = msg => `<p class="stat-empty">${msg}</p>`;
  if (type === 'views') {
    titleEl.textContent = '조회수 TOP 10 채널';
    subEl.textContent   = '참여 영상 기준 조회수 상위 채널';
    if (live) {
      const items = _statItemsFromTable(live.table, '조회수');
      bodyEl.innerHTML = items.length ? _statRankHTML(items, v => v.toLocaleString() + '회', _campaignTotalViews()) : empty('조회수 데이터가 아직 없습니다.');
    } else bodyEl.innerHTML = _statRankHTML(_STAT_DATA.views, v => v.toLocaleString() + '회', _campaignTotalViews());
  } else if (type === 'likes') {
    titleEl.textContent = '좋아요 TOP 10 채널';
    subEl.textContent   = '참여 영상 기준 좋아요 상위 채널';
    if (live) {
      const items = _statItemsFromTable(live.table, '좋아요');
      bodyEl.innerHTML = items.length ? _statRankHTML(items, v => v.toLocaleString() + '개') : empty('좋아요 데이터가 아직 없습니다.');
    } else bodyEl.innerHTML = _statRankHTML(_STAT_DATA.likes, v => v.toLocaleString() + '개');
  } else if (type === 'comments') {
    titleEl.textContent = '베스트 댓글';
    subEl.textContent   = '주요 반응 · 좋아요 많은 순';
    if (live) await _renderLiveComments(bodyEl);
    else bodyEl.innerHTML = _statCmtHTML(_STAT_DATA.comments);
  }
  document.getElementById('statModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// 실제 댓글 — 서버에 저장된 댓글을 보여주고, 관리자는 [댓글 불러오기]로 YouTube 에서 새로 가져온다
// (영상마다 API 호출이 필요해서 리포트 반영과 별도 버튼으로 둔다)
async function _renderLiveComments(bodyEl) {
  let data = { items: [], at: null, videos: 0 };
  if (Api.enabled && Api.isLoggedIn()) {
    const r = await Api.req(`/api/comments?campaign=${encodeURIComponent(ruCampaignKey())}`);
    if (r.ok) data = r.data;
  }
  const bar = Api.isAdmin()
    ? `<div class="stat-cmt-bar"><button class="cd-btn cd-btn-excel" id="cmtFetchBtn" data-fn="fetchBestComments">댓글 불러오기</button>
         <span class="stat-cmt-hint">${data.at ? `마지막 불러오기 ${new Date(data.at).toLocaleString('ko-KR')} · 영상 ${data.videos}개` : '댓글이 많은 영상 10개에서 인기 댓글을 가져옵니다'}</span></div>` : '';
  const list = data.items.length ? _statCmtHTML(data.items)
    : `<p class="stat-empty">${Api.isAdmin() ? '아직 불러온 댓글이 없습니다. [댓글 불러오기]를 눌러주세요.' : '아직 공개된 댓글이 없습니다.'}</p>`;
  bodyEl.innerHTML = bar + list;
}

async function fetchBestComments() {
  const btn = document.getElementById('cmtFetchBtn');
  if (btn) { btn.disabled = true; btn.textContent = '불러오는 중…'; }
  const r = await Api.req('/api/comments/fetch', { method: 'POST', body: { campaign: ruCampaignKey() } });
  if (btn) { btn.disabled = false; btn.textContent = '댓글 불러오기'; }
  if (!r.ok) { alert((r.data && r.data.message) || r.error || '댓글을 불러오지 못했습니다.'); return; }
  if (r.data.pub) ruShowPubState(r.data.pub);
  await _renderLiveComments(document.getElementById('statModalBody'));
}

function closeStatModal() {
  document.getElementById('statModal').classList.remove('open');
  document.body.style.overflow = '';
}

// 지금 보고 있는 캠페인의 총 조회수 — TOP10 기여도(%) 계산 기준
function _campaignTotalViews() {
  const el = document.querySelector('.page-wrapper.active .vid-stat-num--accent');
  return el ? Number(el.textContent.replace(/[^0-9]/g, '')) : 0;
}

function _statRankHTML(items, fmt, total) {
  const medals = ['🥇','🥈','🥉'];
  const share = v => {
    const pct = v / total * 100;
    return (pct < 1 ? pct.toFixed(1) : Math.round(pct)) + '%';
  };
  const linkIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
  return '<ul class="stat-rank-list">' + items.map((d, i) => `
    <li class="stat-rank-item${i < 3 ? ' stat-rank-item--top' : ''}">
      <span class="stat-rank-num">${i < 3 ? medals[i] : i + 1}</span>
      <span class="stat-rank-av" style="background:${d.bg};color:${d.fg}">${escHtml(d.avatar)}</span>
      <div class="stat-rank-info">
        <span class="stat-rank-name">${escHtml(d.name)}</span>
        <span class="stat-rank-subs">${escHtml(d.subs)} 구독</span>
      </div>
      <span class="stat-rank-val${i < 3 ? ' stat-rank-val--hi' : ''}">${fmt(d.val)}</span>
      ${total ? `<span class="stat-rank-share">${share(d.val)}</span>` : ''}
      ${d.url ? `<a class="stat-rank-link" href="${escHtml(d.url)}" target="_blank" rel="noopener" title="영상 보기">${linkIcon}</a>` : '<span class="stat-rank-link"></span>'}
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
    const safeUrl = /^https?:\/\//i.test(url) ? url : '#';
    return `<li class="stat-cmt-item">
      <div class="stat-cmt-meta">
        ${d.tag ? `<span class="stat-cmt-tag" style="background:${c}1a;color:${c}">${escHtml(d.tag)}</span>` : ''}
        <span class="stat-cmt-likes">♥ ${d.likes.toLocaleString()}</span>
      </div>
      <p class="stat-cmt-text">"${escHtml(d.text)}"</p>
      <div class="stat-cmt-foot">
 <span class="stat-cmt-ch">— ${escHtml(d.channel)}</span>
        <a class="stat-cmt-link" href="${escHtml(safeUrl)}" target="_blank" rel="noopener" title="이 댓글이 달린 영상 보기">영상에서 보기 ${linkIcon}</a>
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

// 현재 활성 페이지의 플랫폼 목록 — 리포트 업로드/조회수 갱신에서
// "이 캠페인이 복수 플랫폼인가"를 판단하는 공통 기준.
// p-channels(프리미엄)는 헤더의 data-platforms(캠페인 지정 플랫폼)를, p-detail·
// p-detail-upload는 정적 헤더의 .cd-meta .platform-badge로 판단한다.
function getActivePagePlatforms() {
  const activeId = pages.find(p => document.getElementById(p)?.classList.contains('active'));
  if (activeId === 'p-channels') {
    return chCampaignPlatforms();   // 캠페인 생성 시 지정된 플랫폼 (channels.js)
  }
  const wrap = activeId && document.getElementById(activeId);
  if (!wrap) return [];
  const plats = new Set();
  wrap.querySelectorAll('.cd-meta .platform-badge').forEach(b => {
    ['yt', 'ig', 'tt'].forEach(p => { if (b.classList.contains(p)) plats.add(p); });
  });
  return [...plats];
}

// ── 리포트 업로드 모달 ──
function openReportUploadModal() {
  // 이전에 고른 파일·파싱 결과가 남아있지 않도록 매번 초기화
  _ruParsedRows = null;
  const fileInput = document.getElementById('ruFileInput');
  if (fileInput) fileInput.value = '';
  const dropLabel = document.getElementById('ruDropLabel');
  if (dropLabel) dropLabel.textContent = '엑셀(.xlsx)·CSV 파일을 클릭하여 선택';
  // 자동 조회 탭 초기화
  _ruAutoUrls = [];
  const autoFile = document.getElementById('ruAutoFile'); if (autoFile) autoFile.value = '';
  const autoLabel = document.getElementById('ruAutoLabel'); if (autoLabel) autoLabel.textContent = 'URL 열이 있는 엑셀·CSV 파일을 클릭하여 선택';
  const autoRes = document.getElementById('ruAutoResult'); if (autoRes) { autoRes.hidden = true; autoRes.innerHTML = ''; }
  ruAutoBtnSet(0);
  ruSwitchTab(0);
  const submitBtn = document.getElementById('ruSubmitBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = submitBtn.innerHTML.replace(/\(\d+개\)/, '(0개)'); }

  const plats = getActivePagePlatforms();
  const field = document.getElementById('ruPlatformField');
  const select = document.getElementById('ruPlatformSelect');
  if (field && select) {
    if (plats.length > 1) {
      select.innerHTML = plats.map(p => `<option value="${p}">${PLAT_NAME_KO[p] || p}</option>`).join('');
      field.style.display = '';
    } else {
      field.style.display = 'none';
    }
  }
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
  [0, 1].forEach(j => { const pane = document.getElementById('ruPane' + j); if (pane) pane.style.display = j === i ? '' : 'none'; });
}

// ── 리포트 다운로드 / CSV 업로드 (검토용 — 백엔드 없이 브라우저에서만 동작) ──
// 화면에 보이는 .vid-table 하나를 대상으로 한다. 페이지 wrapper가 전부 DOM에
// 동시 존재해 같은 클래스 테이블이 여럿일 수 있어 실제로 보이는 것만 고른다.
function findVisibleVidTable() {
  return [...document.querySelectorAll('.vid-table')].find(t => t.offsetParent !== null) || null;
}

// Blob 을 파일로 저장한다
function ruSaveBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// CSV 글자 해석: UTF-8 이 아니면(한국어 윈도우 엑셀이 저장한 CSV 는 대개 EUC-KR/CP949) EUC-KR 로 읽는다
function ruDecodeText(u8) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^\uFEFF/, ''); }
  catch (e) { return new TextDecoder('euc-kr').decode(u8); }
}

// 업로드한 파일(엑셀 .xlsx 또는 CSV)을 문자열 표(행 배열)로 읽는다
async function ruReadFile(file) {
  if (/\.xls$/i.test(file.name)) throw new Error('.xls(구버전 엑셀)은 읽을 수 없습니다. .xlsx 또는 .csv로 저장해 주세요.');
  const buf = await file.arrayBuffer();
  const u8 = new Uint8Array(buf);
  if (u8[0] === 0x50 && u8[1] === 0x4B) return (await Xlsx.read(buf)).rows;   // zip 으로 시작하면 엑셀(.xlsx)
  return parseCsv(ruDecodeText(u8));
}

// 따옴표로 감싼 콤마·줄바꿈 정도만 지원하는 단순 CSV 파서(리포트 업로드 용도로 충분)
function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = ''; rows.push(row); row = [];
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => f.trim() !== ''));
}

function ruTableColIndex(table, label) {
  const ths = [...table.querySelectorAll('thead th')];
  return ths.findIndex(th => (th.querySelector('.vid-sort-btn')?.textContent || th.textContent || '').includes(label));
}

// ── 리포트 다운로드: 현재 보이는 표를 엑셀(.xlsx)로 저장 ──
function downloadReport() {
  const table = findVisibleVidTable();
  if (!table) { alert('다운로드할 참여 영상 데이터가 없습니다.'); return; }

  const SKIP_CLASSES = ['vid-cb-th', 'vid-del-col', 'zeal-col'];
  const ths = [...table.querySelectorAll('thead th')];
  const keepIdx = [];
  const headers = [];
  ths.forEach((th, i) => {
    if (SKIP_CLASSES.some(c => th.classList.contains(c))) return;
    const label = (th.querySelector('.vid-sort-btn')?.textContent || th.textContent || '').replace(/[↓↕↑]/g, '').trim();
    if (!label) return; // 아바타 등 라벨 없는 열은 제외
    keepIdx.push(i);
    headers.push(label);
  });

  const rows = [headers];
  table.querySelectorAll('tbody tr').forEach(tr => {
    const tds = [...tr.children];
    rows.push(keepIdx.map(i => {
      const td = tds[i];
      if (!td) return '';
      if (td.querySelector('.ch-plat-icon--yt')) return '유튜브';
      if (td.querySelector('.ch-plat-icon--tt')) return '틱톡';
      if (td.querySelector('.ch-plat-icon--ig')) return '인스타그램';
      return td.textContent.trim().replace(/\s+/g, ' ');
    }));
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  ruSaveBlob(`참여영상_리포트_${stamp}.xlsx`, Xlsx.write(rows, { numericCols: ['조회수', '좋아요', '댓글'], sheetName: '참여영상' }));
}

// 샘플 파일(.xlsx). kind='auto' 는 자동 조회용(URL 열만), 그 외는 파일 업로드용(전체 열)
function downloadSampleFile(kind) {
  if (kind === 'auto') {
    ruSaveBlob('자동조회_샘플.xlsx', Xlsx.write([
      ['URL'],
      ['https://www.youtube.com/shorts/영상ID11자리'],
      ['https://youtu.be/영상ID11자리'],
    ], { sheetName: 'URL 목록' }));
    return;
  }
  ruSaveBlob('리포트_업로드_샘플.xlsx', Xlsx.write([
    // "영상 URL"은 선택 열 — 유튜브 영상 주소를 넣으면 조회수 갱신 때 서버가 YouTube API로 최신 수치를 가져온다
    ['플랫폼', '채널명', '업로드일', '구독자', '영상 제목', '영상 길이', '조회수', '좋아요', '댓글', '영상 URL'],
    ['유튜브', '핫클립', '26/05/01', '1.2M', 'EPEX - UNIVERSE M/V 반응', '43초', '2850000', '12500', '390', 'https://www.youtube.com/shorts/영상ID11자리'],
    ['유튜브', '뮤직트렌드', '26/04/28', '450K', 'UNIVERSE 챌린지 따라해봄', '38초', '2000000', '8800', '225', ''],
  ], { numericCols: ['조회수', '좋아요', '댓글'], sheetName: '리포트' }));
}

// ── CSV 업로드: 파일 선택 시 파싱만 해두고, [적용] 클릭 시 표에 반영 ──
let _ruParsedRows = null;

async function handleReportCsvFile(input) {
  const file = input.files && input.files[0];
  const label = document.getElementById('ruDropLabel');
  const btn = document.getElementById('ruSubmitBtn');
  _ruParsedRows = null;
  if (btn) { btn.disabled = true; btn.innerHTML = btn.innerHTML.replace(/\(\d+개\)/, '(0개)'); }
  if (!file) return;

  let rows;
  try { rows = await ruReadFile(file); }
  catch (e) { if (label) label.textContent = e.message || '파일을 읽을 수 없습니다.'; return; }
  if (rows.length < 2) {
    if (label) label.textContent = '유효한 데이터가 없습니다. 헤더 + 최소 1행이 필요합니다.';
    return;
  }
  const header = rows[0].map(h => h.trim());
  const nameIdx = header.indexOf('채널명');
  if (nameIdx === -1) {
    if (label) label.textContent = '"채널명" 컬럼을 찾을 수 없습니다. 샘플 파일 형식을 확인해주세요.';
    return;
  }
  // "채널명"을 중복 판정 기준(key)으로 쓰고, 나머지는 CSV에 있는 컬럼만큼
  // 그대로 가져간다 — 표의 어떤 컬럼이든 이름만 맞으면 반영되는 범용 구조.
  _ruParsedRows = rows.slice(1).map(r => {
    const row = { name: (r[nameIdx] || '').trim() };
    header.forEach((h, i) => { if (i !== nameIdx && h) row[h] = r[i]; });
    return row;
  }).filter(r => r.name);

  if (label) label.textContent = `${file.name} 선택됨 (${_ruParsedRows.length}행 인식)`;
  if (btn) {
    btn.disabled = _ruParsedRows.length === 0;
    btn.innerHTML = btn.innerHTML.replace(/\(\d+개\)/, `(${_ruParsedRows.length}개)`);
  }
}

// 천단위 콤마를 붙여야 하는 컬럼 — 표에 항상 완전한 숫자로 들어가는 것만 포함한다.
// "구독자"는 기존 표가 1.2M·450K처럼 약어로 쓰고 있어 그대로 텍스트로 둔다.
const RU_NUMERIC_COLS = new Set(['조회수', '좋아요', '댓글']);

const RU_PLAT_KEY = { '유튜브': 'yt', youtube: 'yt', yt: 'yt', '인스타그램': 'ig', '인스타': 'ig', instagram: 'ig', ig: 'ig', '틱톡': 'tt', tiktok: 'tt', tt: 'tt' };

// "9,999,999" · "1.2만" · "3.4K" · "2억" 같은 표기를 정수로 바꾼다. 읽을 수 없으면 null.
// (표에서 내려받은 리포트·엑셀 저장본에는 콤마가 들어가므로, Number()로만 바꾸면 0이 되어 값이 지워진다)
function ruParseNumber(v) {
  const s = String(v == null ? '' : v).trim().replace(/[,\s]/g, '');
  if (!s || s === '-') return null;
  const m = s.match(/^([+-]?\d*\.?\d+)(억|만|천|k|m|b)?$/i);
  if (!m) return null;
  const unit = { '억': 1e8, '만': 1e4, '천': 1e3, k: 1e3, m: 1e6, b: 1e9 }[(m[2] || '').toLowerCase()] || 1;
  return Math.round(parseFloat(m[1]) * unit);
}

// 칸에 링크(<a>)나 배지(<span>)처럼 요소 하나가 글자를 감싸고 있으면 그 요소는 남기고 글자만 바꾼다
// (통째로 textContent 를 덮어쓰면 링크·배지 모양이 사라진다)
function ruSetCellText(td, val) {
  const only = td.children.length === 1 ? td.firstElementChild : null;
  if (only && !only.children.length) only.textContent = val;
  else td.textContent = val;
}

// 채널명 비교용 — 앞뒤 공백·연속 공백 차이로 매칭이 깨지지 않도록 정규화
// 영상 길이는 초 단위로만 보여준다 — "1분 5초", "1:05", "01:02:03", "PT1M5S", 65 모두 "65초"
function ruDurationSeconds(v) {
  const t = String(v == null ? '' : v).trim();
  if (!t) return null;
  let m = t.match(/^(?:(\d+)\s*시간)?\s*(?:(\d+)\s*분)?\s*(?:(\d+)\s*초)?$/);
  if (m && (m[1] || m[2] || m[3])) return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
  m = t.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  if (m) return (+m[1] || 0) * 3600 + (+m[2]) * 60 + (+m[3]);
  m = t.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (m && (m[1] || m[2] || m[3])) return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
  if (/^\d+(\.\d+)?$/.test(t)) return Math.round(+t);
  return null;
}

function ruNormalizeName(s) { return (s || '').trim().replace(/\s+/g, ' '); }

// 새 행을 만들 때, CSV가 값을 주지 않는 열(체크박스·삭제·짤·상태 등)은
// 종류에 맞는 플레이스홀더로 채워 기존 행과 같은 모양을 유지한다.
function ruBuildPlaceholderCell(th, name) {
  const td = document.createElement('td');
  if (th.classList.contains('vid-cb-th')) {
    td.className = 'vid-cb-td';
    td.innerHTML = '<input type="checkbox" class="vid-row-cb">';
  } else if (th.classList.contains('vid-del-col')) {
    td.className = 'vid-del-col';
    td.style.textAlign = 'center';
    td.innerHTML = VID_DEL_BTN;
  } else if (th.classList.contains('zeal-col')) {
    td.className = 'zeal-col';
    td.style.textAlign = 'center';
    td.textContent = '-';
  } else if (th.classList.contains('vid-vis-col')) {
    td.style.textAlign = 'center';
    td.innerHTML = '<span class="vid-vis vid-vis--public">공개</span>';
  } else if (th.textContent.trim().startsWith('영상 제목')) {
    td.innerHTML = '<a class="vid-table-link" href="#" target="_blank">-</a>';    // 영상 URL 을 받으면 이 링크 주소가 된다
  } else if (th.textContent.trim().startsWith('참여율')) {
    td.className = 'vid-er';
    td.textContent = '-';
  } else if (th.textContent.trim() === '플랫폼') {
    td.style.textAlign = 'center';
    td.textContent = '-';
  } else {
    td.textContent = '-';
  }
  return td;
}

// rows(배열, {name, ...필드})를 표 DOM에 upsert한다. 채널명(정규화) 기준으로
// 기존 행을 찾아 덮어쓰고, 없으면 새 행을 만든다 — CSV 적용과 서버에서
// 불러온 데이터 복원에 공통으로 쓰는 핵심 로직이라 분리해뒀다.
// 행의 플랫폼 키(yt/ig/tt) — 값이 없거나 알 수 없으면 yt
function ruRowPlat(r) {
  return RU_PLAT_KEY[String((r && (r['플랫폼'] || r.platform)) || '').trim().toLowerCase()] || 'yt';
}

function ruApplyRowsToTable(table, rows, opts) {
  const ths = [...table.querySelectorAll('thead th')];
  const nameCol = ruTableColIndex(table, '채널명');
  const tbody = table.querySelector('tbody');

  // replace: 리포트 업로드 — 올린 행에 들어 있는 플랫폼의 기존 행만 지우고 새로 등록한다(다른 플랫폼 행은 그대로)
  // replaceAll: 서버에 저장된 전체 목록으로 표를 통째로 맞춘다(복원·저장 직후)
  let removed = 0;
  if (opts && opts.replaceAll) {
    removed = tbody.querySelectorAll('tr').length;
    tbody.innerHTML = '';
  } else if (opts && opts.replace) {
    const scope = new Set(rows.map(ruRowPlat));
    tbody.querySelectorAll('tr').forEach(tr => {
      if (scope.has(tr.dataset.platform || 'yt')) { tr.remove(); removed++; }
    });
  }

  // 같은 채널명이라도 플랫폼이 다르면 다른 행이다
  const rowsByName = new Map();
  tbody.querySelectorAll('tr').forEach(tr => {
    const nameCell = tr.children[nameCol];
    const name = ruNormalizeName(nameCell?.getAttribute('title') || nameCell?.textContent);
    if (name) rowsByName.set((tr.dataset.platform || 'yt') + '|' + name, tr);
  });

  let updated = 0, added = 0;
  rows.forEach(r => {
    const nm = ruNormalizeName(r.name);
    if (!nm) return;
    const key = ruRowPlat(r) + '|' + nm;
    let tr = rowsByName.get(key);
    if (!tr) {
      tr = document.createElement('tr');
      ths.forEach(th => tr.appendChild(ruBuildPlaceholderCell(th, r.name)));
      const newCb = tr.querySelector('.vid-row-cb');
      if (newCb) newCb.dataset.cid = r.name;      // 기존 행과 같은 방식(채널명) — CID 가 있으면 아래에서 덮어쓴다
      if (nameCol > -1) {
        tr.children[nameCol].textContent = r.name;
        tr.children[nameCol].setAttribute('title', r.name);
      }
      tr.dataset.platform = ruRowPlat(r);
      const pi = ruTableColIndex(table, '플랫폼');
      if (pi > -1 && !r['플랫폼']) tr.children[pi].innerHTML = platBadge(ruRowPlat(r));   // 플랫폼 값이 없으면 유튜브
      tbody.appendChild(tr);
      rowsByName.set(key, tr);
      added++;
    } else {
      updated++;
    }
    const tds = [...tr.children];
    // 채널 ID(CID)가 있으면 행에 보관하고, 관리자 화면의 짤 칸을 짤 회원 배지로 채운다
    if (r.cid) {
      tr.dataset.cid = r.cid;
      const zi = ruTableColIndex(table, '짤');
      if (zi > -1 && tds[zi]) tds[zi].innerHTML = zealBadgeHtml({ cid: r.cid }) || '';
      // 선택한 행의 "채널 이동/영상 열기" 동작이 쓰는 값(채널 주소·영상 주소)
      const cb = tr.querySelector('.vid-row-cb');
      if (cb) {
        cb.dataset.cid = encodeURIComponent('channel/' + r.cid);
        const vu = String(r['영상 URL'] || '').trim();
        if (/^https?:\/\//i.test(vu)) cb.dataset.url = vu;
      }
    }
    Object.keys(r).forEach(field => {
      if (field === 'name') return;
      const val = r[field];
      if (val === undefined || val === '') return;
      if (field === '영상 URL') {
        // 표에 열은 없지만 영상 제목 링크의 주소로 쓴다(http/https만 — javascript: 같은 주소는 막는다)
        const a = tds[ruTableColIndex(table, '영상 제목')]?.querySelector('a');
        const url = String(val).trim();
        if (a && /^https?:\/\//i.test(url)) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        return;
      }
      const colIdx = ruTableColIndex(table, field);
      if (colIdx === -1 || !tds[colIdx]) return;
      if (field === '플랫폼') {
        // 업로드당 표의 플랫폼 칸은 아이콘이다 — 글자로 덮어쓰지 않고, 필터가 쓰는 data-platform 만 맞춘다
        const key = RU_PLAT_KEY[String(val).trim().toLowerCase()];
        if (key) tr.dataset.platform = key;
        if (!tds[colIdx].querySelector('.ch-plat-icon')) tds[colIdx].innerHTML = key ? platBadge(key) : escHtml(val);
        return;
      }
      if (field === '상태') {
        // 공개/비공개 배지 — 글자와 함께 색 클래스도 맞춘다
        const v = tds[colIdx].querySelector('.vid-vis');
        if (v) {
          const priv = /비공개/.test(String(val));
          v.className = 'vid-vis ' + (priv ? 'vid-vis--private' : 'vid-vis--public');
          v.textContent = priv ? '비공개' : '공개';
          return;
        }
      }
      if (field === '영상 길이') {
        const sec = ruDurationSeconds(val);
        ruSetCellText(tds[colIdx], sec === null ? val : sec + '초');
        return;
      }
      if (RU_NUMERIC_COLS.has(field)) {
        // 천단위 콤마·단위(만/억/K/M)가 섞인 값도 읽는다. 읽을 수 없는 값('-' 등)은 기존 값을 그대로 둔다
        const n = ruParseNumber(val);
        if (n === null) return;
        tds[colIdx].textContent = n.toLocaleString();
      } else {
        ruSetCellText(tds[colIdx], val);
      }
    });
  });
  vidRecomputeStats(table.closest('.vid-card'));
  return { updated, added, removed };
}

// ── 참여 영상 리포트 서버 연동 ──
// 서버(connect-server)가 있고 로그인한 상태면 서버에 저장·복원하고, 없으면 화면에만 반영한다.
function ruCampaignKey() {
  return pages.find(p => document.getElementById(p)?.classList.contains('active')) || 'default';
}

// 페이지 진입 시 서버에 저장된 값이 있으면 표에 복원한다(새로고침해도 유지)
function ruLoadFromServer(pageId) {
  if (!['p-detail', 'p-detail-upload'].includes(pageId)) return;
  if (!Api.enabled || !Api.isLoggedIn()) return;
  Api.req(`/api/videos?campaign=${encodeURIComponent(pageId)}`).then(async r => {
    if (r.ok && r.data && r.data.pub) ruNotePub(pageId, r.data.pub);
    if (!r.ok || !r.data) return;
    const rows = r.data.rows || [], hidden = r.data.hidden || [];
    if (!rows.length && !hidden.length) return;
    if (rows.length && Api.isAdmin()) await zealSyncFromServer();      // 짤 칸을 채우려면 회원 목록이 먼저 있어야 한다
    const table = findVisibleVidTable();
    if (!table) return;
    if (rows.length) ruApplyRowsToTable(table, rows, { replace: true });   // 서버에 저장된 플랫폼의 행은 서버 내용으로 바꾸고, 서버에 없는 플랫폼의 행(예시 데이터 등)은 그대로 둔다
    ruApplyHidden(table, hidden);
  });
}

// 관리자가 삭제한 행('삭제됨' 표시)을 표에서 뺀다 — 예시(화면에만 있는) 행의 삭제도 서버에서 이어받는다
function ruApplyHidden(table, hidden) {
  if (!hidden || !hidden.length) return;
  const ni = ruTableColIndex(table, '채널명');
  const gone = new Set(hidden.map(h => (h.platform || 'yt') + '|' + ruNormalizeName(h.name)));
  table.querySelectorAll('tbody tr').forEach(tr => {
    const c = tr.children[ni];
    const nm = ruNormalizeName((c && (c.getAttribute('title') || c.textContent)) || '');
    if (gone.has((tr.dataset.platform || 'yt') + '|' + nm)) tr.remove();
  });
}

// ── 광고주 연동: 관리자가 올린 리포트(작업본)는 [광고주 연동]을 눌러야 광고주 사이트에 보인다 ──
const RU_PUB_LABEL = { never: '연동 전', pending: '연동 필요', synced: '연동 완료', busy: '연동 중…' };
function ruShowPubState(pub, busy) {
  const st = busy ? 'busy' : ((pub && pub.state) || 'never');
  // 지금 보고 있는 화면의 버튼만 바꾼다(캠페인마다 연동 상태가 따로 있다)
  document.querySelectorAll('.page-wrapper.active .vid-publish-btn').forEach(btn => {
    btn.dataset.state = st;
    const lb = btn.querySelector('.vid-publish-label');
    if (lb) lb.textContent = RU_PUB_LABEL[st];
    const tip = pub && pub.at ? '마지막 연동: ' + new Date(pub.at).toLocaleString('ko-KR') : '관리자가 올린 리포트를 광고주 사이트에 반영합니다';
    btn.title = st === 'pending' ? '연동 후 내용이 바뀌었습니다. 눌러서 광고주 사이트에 다시 반영하세요. ' + tip : tip;
  });
}

// 캠페인(화면 key)별 연동 상태를 기억해 두고, 해당 화면이 보일 때 버튼에 표시한다
window._pubByKey = window._pubByKey || {};
function ruNotePub(key, pub) {
  if (!pub) return;
  window._pubByKey[key] = pub;
  if (ruCampaignKey() === key) ruShowPubState(pub);
}
function ruRefreshPubButton() {
  const k = ruCampaignKey();
  if (window._pubByKey[k]) ruShowPubState(window._pubByKey[k]);
}

async function publishToAdvertiser() {
  if (!Api.enabled || !(Api.isUp() || await Api.ping())) { alert('광고주 연동은 서버에 연결되어 있어야 합니다. 서버가 켜져 있는지 확인해주세요.'); return; }
  if (!Api.isAdmin()) { alert('관리자 계정으로 로그인해야 합니다.'); return; }
  const btn = [...document.querySelectorAll('.vid-publish-btn')].find(b => b.offsetParent !== null);
  const prevState = btn ? btn.dataset.state : 'never';
  if (btn) btn.disabled = true;
  ruShowPubState(null, true);
  const r = await Api.req(`/api/videos/publish?campaign=${encodeURIComponent(ruCampaignKey())}`, { method: 'POST' });
  if (btn) btn.disabled = false;
  if (!r.ok) { ruShowPubState({ state: prevState }); alert(r.error || '광고주 연동에 실패했습니다.'); return; }
  ruNotePub(ruCampaignKey(), r.data.pub);
  alert(r.data.count ? `리포트 ${r.data.count}개와 변경된 캠페인 정보를 광고주 사이트에 연동했습니다.` : '변경된 캠페인 정보를 광고주 사이트에 연동했습니다.');
}

// ── 자동 조회: URL 열만 읽는다 → 서버가 YouTube 에서 영상·채널 정보를 가져오고 → 채널 ID(CID)로 짤 회원까지 조회 ──
let _ruAutoUrls = [];
let _ruAutoRows = null;     // 조회 결과(저장 전)

function ruAutoBtnSet(n) {
  const b = document.getElementById('ruAutoBtn');
  if (!b) return;
  b.disabled = n === 0;
  b.textContent = `조회 시작 (${n}개)`;
  b.hidden = false;
  const sv = document.getElementById('ruAutoSaveBtn');
  if (sv) sv.hidden = true;
  _ruAutoRows = null;
}

async function handleAutoLookupFile(input) {
  const file = input.files && input.files[0];
  const label = document.getElementById('ruAutoLabel');
  const box = document.getElementById('ruAutoResult');
  _ruAutoUrls = [];
  ruAutoBtnSet(0);
  if (box) { box.hidden = true; box.innerHTML = ''; }
  if (!file) return;
  let rows;
  try { rows = await ruReadFile(file); }
  catch (e) { if (label) label.textContent = e.message || '파일을 읽을 수 없습니다.'; return; }
  if (rows.length < 2) { if (label) label.textContent = '유효한 데이터가 없습니다. 헤더 + 최소 1행이 필요합니다.'; return; }
  // URL 열만 읽는다(다른 열은 무시). 머리글은 "URL"(대소문자 무관)이며 예전 샘플의 "영상 URL"도 받아준다.
  const idx = rows[0].map(h => h.trim().toLowerCase()).findIndex(h => h === 'url' || h === '영상 url' || h === '영상url');
  if (idx === -1) { if (label) label.textContent = '"URL" 열을 찾을 수 없습니다. 헤더 행에 URL이 있어야 합니다.'; return; }
  const urls = [...new Set(rows.slice(1).map(r => (r[idx] || '').trim()).filter(Boolean))];
  if (!urls.length) { if (label) label.textContent = 'URL 열이 비어 있습니다.'; return; }
  _ruAutoUrls = urls;
  if (label) label.textContent = `${file.name} 선택됨 (URL ${urls.length}개 인식)`;
  ruAutoBtnSet(urls.length);
}

async function runAutoLookup() {
  if (!_ruAutoUrls.length) return;
  const table = findVisibleVidTable();
  const box = document.getElementById('ruAutoResult');
  const showBox = html => { if (box) { box.innerHTML = html; box.hidden = false; } };
  if (!table) { alert('반영할 참여 영상 표를 찾을 수 없습니다.'); return; }
  if (!Api.enabled || !(Api.isUp() || await Api.ping())) {
    showBox('<div class="ru-auto-warn">자동 조회는 서버에 연결되어 있어야 합니다. 서버가 켜져 있는지 확인해주세요.</div>');
    return;
  }
  if (!Api.isAdmin()) { showBox('<div class="ru-auto-warn">관리자 계정으로 로그인해야 자동 조회를 쓸 수 있습니다.</div>'); return; }

  const btn = document.getElementById('ruAutoBtn');
  btn.disabled = true; btn.textContent = '조회 중…';
  showBox('<div class="ru-auto-sum">YouTube와 짤 어드민에서 가져오는 중입니다…</div>');
  const r = await Api.req('/api/report/lookup', { method: 'POST', body: { campaign: ruCampaignKey(), urls: _ruAutoUrls } });
  ruAutoBtnSet(_ruAutoUrls.length);
  if (!r.ok) { showBox(`<div class="ru-auto-warn">${escHtml(r.error || '조회에 실패했습니다.')}</div>`); return; }

  const d = r.data;
  Object.assign(ZEAL_MEMBERS, d.zeal || {});              // 짤 회원 정보를 화면 데이터에 합친다(관리자만 받는다)
  // 조회 결과는 '저장'을 눌러야 표에 반영된다 — 한 건도 못 가져왔으면 저장 버튼을 보이지 않는다
  if (d.rows.length) {
    _ruAutoRows = d.rows;
    document.getElementById('ruAutoBtn').hidden = true;
    document.getElementById('ruAutoSaveBtn').hidden = false;
  }
  const zealCount = d.rows.filter(x => x.zeal).length;
  const failHtml = d.failed.length
    ? `<ul class="ru-auto-fail">${d.failed.map(f => `<li><span class="ru-auto-url">${escHtml(f.url.length > 60 ? f.url.slice(0, 57) + '…' : f.url)}</span> — ${escHtml(f.reason)}</li>`).join('')}</ul>` : '';
  const warn = d.zealWarning ? `<div class="ru-auto-warn">⚠ ${escHtml(d.zealWarning)}</div>` : '';
  showBox(
    `<div class="ru-auto-sum"><b>성공 ${d.rows.length}개</b> · 실패 ${d.failed.length}개 · 짤 회원 확인 ${zealCount}개 <span class="ru-auto-sub">${d.rows.length ? '(아직 저장 전입니다 — 아래 [저장]을 누르면 기존 데이터를 모두 지우고 새로 등록합니다)' : '(가져온 영상이 없어 기존 데이터는 그대로 둡니다)'}</span></div>` + warn + failHtml
  );
}

// 표에 남아 있는 '올리지 않은 플랫폼' 행 수(서버에 없는 예시 데이터 포함)
function ruKeptRows(table, plats) {
  return [...table.querySelectorAll('tbody tr')].filter(tr => !plats.includes(tr.dataset.platform || 'yt')).length;
}

// 저장 결과 안내 — 올린 플랫폼은 새로 덮어썼고, 올리지 않은 플랫폼은 그대로 뒀다는 것을 알려준다
function ruSaveSummary(count, plats, replaced, kept, where) {
  const names = plats.map(p => PLAT_NAME_KO[p] || p).join('·');
  let msg = `${count}개 ${where} 저장 완료\n${names} 기존 ${replaced}개를 지우고 새로 등록했습니다`;
  if (kept) msg += `\n(올리지 않은 다른 플랫폼 ${kept}개는 그대로 유지)`;
  return msg;
}

// 자동 조회 결과 저장 — 조회한 플랫폼의 기존 행을 지우고 조회한 행으로 교체
async function saveAutoLookup() {
  if (!_ruAutoRows || !_ruAutoRows.length) return;
  const table = findVisibleVidTable();
  if (!table) { alert('반영할 참여 영상 표를 찾을 수 없습니다.'); return; }
  const r = await Api.req(`/api/videos?campaign=${encodeURIComponent(ruCampaignKey())}`, { method: 'POST', body: _ruAutoRows });
  if (!r.ok) { alert(r.error || '서버 저장에 실패했습니다.'); return; }
  ruApplyRowsToTable(table, r.data.rows, { replace: true });
  ruShowPubState(r.data.pub);
  closeReportUploadModal();
  alert(ruSaveSummary(r.data.added, r.data.platforms, r.data.replaced, ruKeptRows(table, r.data.platforms), '서버에'));
}

async function applyReportCsv() {
  if (!_ruParsedRows || !_ruParsedRows.length) return;
  const table = findVisibleVidTable();
  if (!table) { alert('반영할 참여 영상 표를 찾을 수 없습니다.'); return; }

  if (Api.enabled && (Api.isUp() || await Api.ping())) {
    if (!Api.isAdmin()) { alert('관리자 계정으로 로그인해야 리포트를 업로드할 수 있습니다.'); return; }
    const r = await Api.req(`/api/videos?campaign=${encodeURIComponent(ruCampaignKey())}`, { method: 'POST', body: _ruParsedRows });
    if (!r.ok) { alert(r.error || '서버 저장에 실패했습니다.'); return; }
    ruApplyRowsToTable(table, r.data.rows, { replace: true });
    ruShowPubState(r.data.pub);
    closeReportUploadModal();
    alert(ruSaveSummary(r.data.added, r.data.platforms, r.data.replaced, ruKeptRows(table, r.data.platforms), '서버에'));
    return;
  }
  // 서버가 없으면 화면에만 반영(새로고침하면 초기화)
  const before = table.querySelectorAll('tbody tr').length;
  const { removed } = ruApplyRowsToTable(table, _ruParsedRows, { replace: true });
  closeReportUploadModal();
  alert(ruSaveSummary(_ruParsedRows.length, [...new Set(_ruParsedRows.map(ruRowPlat))], removed, before - removed, '화면에만') + '\n(서버에 연결되지 않아 새로고침하면 초기화됩니다)');
}

// ── SCROLL — #p1이 스크롤 컨테이너이므로 window 대신 #p1 이벤트 감지 ──
const _p1El = document.getElementById('p1');
_p1El.addEventListener('scroll', () => {
  document.querySelector('.gnb').classList.toggle('scrolled', _p1El.scrollTop > 30);
});

// ── INIT ──
goTo('p1');
document.body.classList.add('p0-active');
// 서버가 있으면 이전 로그인(같은 탭)을 복원한다
Api.ping().then(async up => {
  if (!up) return;
  if (await Api.restore()) { updateGnbSession(); syncCampaigns(); metaLoad(); if (Api.isAdmin()) zealSyncFromServer(); }
  else { Api.logout(); updateGnbSession(); }
});

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
      /* 항목 2 */ '가이드 준수 확인',
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
      /* 항목 2 */ '가이드 준수 확인',
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
      // 펼칠 때 붙은 entering/visible 이 남아 있으면 우선순위가 더 높아 접는 스타일이 먹지 않는다 → 먼저 제거
      card2.classList.remove('p0rc-entering', 'p0rc-visible');
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

/* [SEC-CHANNELS] 대표 카테고리 3폰 대각선 클러스터 (좌 Instagram → 중앙 YouTube → 우 TikTok, 카테고리가 좌→우로 순환) */
const p0ChCategories = [
  { emoji: '🎥', name: '영화·드라마', like: 12480, comment: 892, share: 341 },
  { emoji: '📺', name: '방송·예능', like: 8765, comment: 543, share: 210 },
  { emoji: '😂', name: '유머·이슈', like: 24310, comment: 1876, share: 902 },
  { emoji: '💡', name: '지식·정보', like: 6120, comment: 398, share: 154 },
  { emoji: '🎧', name: '음악', like: 15870, comment: 1043, share: 467 },
  { emoji: '🍳', name: '요리', like: 9340, comment: 621, share: 288 },
  { emoji: '🐈', name: '동물', like: 31200, comment: 2456, share: 1180 },
  { emoji: '🏀', name: '스포츠', like: 11045, comment: 734, share: 305 },
];
let _p0ChIndex = 0;
let _p0ChBoosts = [0, 0, 0, 0, 0, 0, 0, 0];

function p0ChFmt(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '만';
  return n.toLocaleString();
}

function p0ChRender() {
  const phone = document.getElementById('p0ChPhone');
  if (!phone) return;
  const total = p0ChCategories.length;
  const i = ((_p0ChIndex % total) + total) % total;
  const leftIdx = i;
  const centerIdx = (i - 1 + total) % total;
  const rightIdx = (i - 2 + total) % total;
  const left = p0ChCategories[leftIdx];
  const center = p0ChCategories[centerIdx];
  const right = p0ChCategories[rightIdx];
  const boost = _p0ChBoosts[centerIdx] || 0;

  document.getElementById('p0ChLeftEmoji').textContent = left.emoji;
  document.getElementById('p0ChLeftAvatar').textContent = left.emoji;
  document.getElementById('p0ChLeftName').textContent = left.name;

  document.getElementById('p0ChRightEmoji').textContent = right.emoji;
  document.getElementById('p0ChRightAvatar').textContent = right.emoji;
  document.getElementById('p0ChRightName').textContent = right.name;

  document.getElementById('p0ChEmoji').textContent = center.emoji;
  document.getElementById('p0ChCapAvatar').textContent = center.emoji;
  document.getElementById('p0ChCapName').textContent = center.name;
  document.getElementById('p0ChLikeCount').textContent = p0ChFmt(center.like + boost);
  document.getElementById('p0ChCommentCount').textContent = p0ChFmt(center.comment + Math.floor(boost / 4));
  document.getElementById('p0ChShareCount').textContent = p0ChFmt(center.share + Math.floor(boost / 6));

  document.querySelectorAll('#p0ChProgress > span > i').forEach((el, idx) => {
    if (idx < centerIdx) { el.style.width = '100%'; el.style.background = 'rgba(255,255,255,0.85)'; }
    else if (idx === centerIdx) { el.style.width = '100%'; el.style.background = '#FF0000'; }
    else { el.style.width = '0%'; el.style.background = 'transparent'; }
  });
}

function p0ChGoTo(index) {
  const total = p0ChCategories.length;
  _p0ChIndex = ((index % total) + total) % total;
  p0ChRender();
}
function p0ChSlideNext() { p0ChGoTo(_p0ChIndex + 1); }
function p0ChSlidePrev() { p0ChGoTo(_p0ChIndex - 1); }

function p0ChFitStage() {
  const outer = document.getElementById('p0ChStageOuter');
  const stage = document.getElementById('p0ChStage');
  if (!outer || !stage) return;
  const naturalW = 460, naturalH = 560;
  const scale = Math.min(1, outer.clientWidth / naturalW);
  stage.style.transform = 'scale(' + scale + ')';
  outer.style.height = (naturalH * scale) + 'px';
}

function p0ChInit() {
  const outer = document.getElementById('p0ChStageOuter');
  if (!document.getElementById('p0ChPhone') || !outer) return;
  p0ChRender();
  p0ChFitStage();
  window.addEventListener('resize', p0ChFitStage);
  if (window.ResizeObserver) {
    new ResizeObserver(p0ChFitStage).observe(outer);
  }
  setInterval(p0ChSlideNext, 1500);
  setInterval(() => {
    const total = p0ChCategories.length;
    const centerIdx = ((_p0ChIndex - 1 + total) % total + total) % total;
    _p0ChBoosts[centerIdx] = (_p0ChBoosts[centerIdx] || 0) + Math.floor(Math.random() * 5) + 1;
    p0ChRender();
  }, 500);
}
p0ChInit();

/* [SEC-CASES] 집행 사례 마키 카드 — 브랜드 추가/삭제/순서 변경은 이 배열만 수정하면 된다 */
/* 흰 배경 카드와 유색/어두운 배경 카드가 3칸 주기로 고르게 섞이도록 배치
   (흰색: pixar·lotte·mindmark·plusm / 유색: 그 외) — 순서만 바꿔도 배치가 유지되도록
   같은 계열(검정·네이비) 카드는 서로 붙지 않게 나눠 배치했다 */
const p0CaseLogos = [
  { file: 'img/cases/pixar.jpg',        name: 'Pixar Animation Studios' }, // 흰색
  { file: 'img/cases/golddust.jpg',     name: 'Gold Dust Entertainment' }, // 검정
  { file: 'img/cases/jtbc.jpg',         name: 'JTBC' },                    // 유채색 그라데이션
  { file: 'img/cases/lotte.jpg',        name: 'Lotte Entertainment' },     // 흰색
  { file: 'img/cases/munhakdongne.jpg', name: '문학동네' },                 // 네이비
  { file: 'img/cases/naver.jpg',        name: 'Naver' },                   // 초록
  { file: 'img/cases/mindmark.jpg',     name: 'Mindmark' },                // 흰색
  { file: 'img/cases/wb.jpg',           name: 'Warner Bros.' },            // 네이비
  { file: 'img/cases/nexon.jpg',        name: 'Nexon' },                   // 검정
  { file: 'img/cases/plusm.jpg',        name: 'Plus M' },                  // 흰색
  { file: 'img/cases/disneyplus.jpg',   name: 'Disney+' },                 // 짙은 틸
];

function p0CaseRender() {
  const track = document.querySelector('.p0-gallery-section .p0-marquee-track');
  if (!track) return;
  const card = (logo, hidden) =>
    `<div class="p0-s3-card"><img class="p0-s3-media" src="${logo.file}" alt="${logo.name}" loading="lazy"${hidden ? ' aria-hidden="true"' : ''}></div>`;
  // 무한 루프를 위해 원본 세트 뒤에 동일한 세트를 한 번 더 복제
  track.innerHTML =
    p0CaseLogos.map(l => card(l, false)).join('') +
    p0CaseLogos.map(l => card(l, true)).join('');
}
p0CaseRender();

/* 섹션3 마키 양끝 — 가장자리에 다가갈수록 카드가 작아지며 사라진다.
   투명도는 건드리지 않는다(흰 카드가 배경과 섞여 탁해지지 않게). CSS의 scale 속성에
   --edge-scale 값을 넣으며, 화면에 보일 때만 프레임마다 갱신한다. */
(function p0CaseEdgeScale() {
  const section = document.getElementById('sec-cases');
  const wrap = document.querySelector('.p0-gallery-section .p0-gallery-wrap');
  if (!section || !wrap) return;
  const MIN = 0.55;                       // 가장 가장자리에서의 최소 크기
  function update() {
    const w = wrap.getBoundingClientRect();
    if (!w.width) return;
    const zone = Math.min(170, w.width * 0.16);   // 크기가 변하는 구간(px)
    wrap.querySelectorAll('.p0-s3-card').forEach(card => {
      const r = card.getBoundingClientRect();
      const d = Math.min(r.left + r.width / 2 - w.left, w.right - (r.left + r.width / 2));
      const t = Math.max(0, Math.min(1, d / zone));
      const eased = t * t * (3 - 2 * t);            // smoothstep
      card.style.setProperty('--edge-scale', (MIN + (1 - MIN) * eased).toFixed(3));
    });
  }
  let raf = 0;
  function loop() { update(); raf = requestAnimationFrame(loop); }
  new IntersectionObserver(entries => {
    const on = entries[0].isIntersecting;
    if (on && !raf) loop();
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  }).observe(section);
  update();
})();

/* [SEC-STRUCTURE] 구조 섹션 CC 토글 */
function p0CcToggle(mode) {
  document.querySelectorAll('#p0CcToggle .p0rt-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.args === mode)
  );
  const track = document.querySelector('#p0CcCard2 .p0-cc-slider-track');
  if (track) track.style.transform = `translateX(-${mode === 'pre' ? 100 : 0}%)`;
  // 캠페인 오픈·확산 결과 카드도 같은 모드 내용으로 바뀐다 (CSS 가 data-mode 로 전환)
  const flow = document.querySelector('#sec-structure .p0-cc-flow');
  if (flow) flow.dataset.mode = mode;
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

  // 카드 한 장을 값(v)대로 다시 그린다 — 수정 패널 저장과 서버에서 받은 값 적용이 함께 쓴다.
  // 값은 모두 textContent/속성으로만 넣는다(관리자가 입력한 글이 다른 사용자 화면에서 코드로 실행되지 않게).
  // v: { title, client, product, status, goalType, goalValue, current, start, end, thumb, platforms[] }
  function applyCardValues(card, v) {
    Object.assign(card.dataset, {
      editTitle: v.title, editClient: v.client, editProduct: v.product, editStatus: v.status,
      editGoalType: v.goalType, editGoalValue: v.goalValue, editCurrent: v.current,
      editStart: v.start, editEnd: v.end, editThumb: v.thumb, editPlatforms: v.platforms.join(','),
      campaignStatus: v.status,
    });
    card.dataset.campaignStatus = v.status;

    const titleEl = card.querySelector('.card-title');
    if (titleEl) titleEl.textContent = v.title;
    const tagEl = card.querySelector('.card-product-tag');
    if (tagEl) tagEl.textContent = v.product;

    const badgeEl = card.querySelector('.status-badge');
    if (badgeEl) {
      const s = STATUS_MAP[v.status] || { cls: v.status, text: v.status };
      badgeEl.className = `status-badge ${s.cls}`;
      badgeEl.textContent = s.text;
    }

    // 플랫폼 배지 + 광고주 계정(우측)을 함께 다시 그린다. 배지만 덮어쓰면 같은 행에 있던 계정 칩이 지워진다.
    const platEl = card.querySelector('.card-platform-badges');
    if (platEl) {
      platEl.innerHTML = v.platforms.map(p => `<span class="platform-badge ${p}">${PLAT_SVG[p] || ''}</span>`).join('');
      if (v.client) {
        const chip = document.createElement('span');
        chip.className = 'card-agency'; chip.title = '광고주 계정'; chip.textContent = v.client;
        platEl.appendChild(chip);
      }
    }

    // 썸네일(http(s) 또는 img/ 상대경로만)
    const thumbDiv = card.querySelector('.card-thumb');
    if (thumbDiv && /^(https?:\/\/[^\s"'()<>\\]+|img\/[A-Za-z0-9_./-]+)$/.test(v.thumb || '')) {
      const img = thumbDiv.querySelector('img');
      if (img) { img.src = v.thumb; }
      else { thumbDiv.style.backgroundImage = `url(${v.thumb})`; }
      thumbDiv.style.background = '';
    }

    // 진행률
    const gv = parseInt(v.goalValue) || 0;
    const cv = parseInt(v.current) || 0;
    const pct = gv > 0 ? Math.min(Math.round(cv / gv * 100), 100) : 0;
    card.dataset.pct = gv > 0 ? Math.round(cv / gv * 100) : 0;
    const fillEl = card.querySelector('.card-progress-fill');
    if (fillEl) fillEl.style.width = pct + '%';
    const textEl = card.querySelector('.card-progress-text');
    if (textEl) {
      const unit = v.goalType === '조회수' ? '회' : '개';
      textEl.textContent = `${cv.toLocaleString()} / ${gv.toLocaleString()}${unit} `;
      const pctSpan = document.createElement('span');
      pctSpan.className = 'card-progress-pct' + (gv > 0 && cv > gv ? ' over' : '');
      pctSpan.textContent = `(${gv > 0 && cv > gv ? Math.round(cv / gv * 100) : pct}%)`;
      textEl.appendChild(pctSpan);
    }
  }
  window.applyCardValues = applyCardValues;

  // 카드의 data-edit-* 값 → v (서버 저장·다른 카드에 적용할 때 쓴다)
  window.cardValuesFromCard = function (card) {
    const d = card.dataset;
    return {
      title: d.editTitle || (card.querySelector('.card-title')?.textContent || '').trim(),
      client: d.editClient || '', product: d.editProduct || '조회수당', status: d.editStatus || 'recruiting',
      goalType: d.editGoalType || '조회수', goalValue: d.editGoalValue || '', current: d.editCurrent || '',
      start: d.editStart || '', end: d.editEnd || '', thumb: d.editThumb || '',
      platforms: (d.editPlatforms || '').split(',').filter(Boolean),
    };
  };

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

    // 서버에 저장된 캠페인이면 서버에도 반영한다(실패하면 알려준다)
    if (_card.dataset.serverId && Api.isLoggedIn()) {
      Api.req('/api/campaigns/' + _card.dataset.serverId, {
        method: 'PATCH',
        body: {
          title, client, product, status, platforms: plats, start, end, thumb,
          goalViews: goalType === '조회수' ? goalValue : '',
          goalVids:  goalType === '조회수' ? '' : goalValue,
        },
      }).then(r => { if (!r.ok) alert(r.error || '서버 저장에 실패했습니다. 화면에만 반영되었습니다.'); });
    }

    const vals = { title, client, product, status, goalType, goalValue, current, start, end, thumb, platforms: plats };
    applyCardValues(_card, vals);
    // 등록해서 만든 카드는 상품 유형에 맞는 상세 화면으로 연결을 다시 맞춘다(프리미엄 ↔ 일반)
    if (_card.dataset.built === '1') {
      const prem = product === '프리미엄';
      if (prem && !_card.dataset.pmKey) _card.dataset.pmKey = _card.dataset.serverId || ('local-' + Date.now().toString(36));
      const fn = prem ? 'openPremiumCampaign' : 'goTo', arg = prem ? _card.dataset.pmKey : 'p-detail-empty';
      _card.setAttribute('data-fn', fn); _card.setAttribute('data-args', arg);
      const btn = _card.querySelector('.card-btn.primary');
      if (btn) { btn.setAttribute('data-fn', fn); btn.setAttribute('data-args', arg); }
      _card.dataset.campaignType = prem ? 'connect' : (product === '업로드당' ? 'upload' : 'view');
    }
    // 기본(정적) 카드면 서버에 정보를 저장한다 — 광고주 화면에는 [연동]을 누르면 반영된다
    if (!_card.dataset.serverId && typeof metaSaveCard === 'function') metaSaveCard(_card, vals);
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

// ── 회차 타임라인 행 만들기·읽기 (서버 저장/적용에 같은 구조를 쓴다) ──
const TL_ACT_HTML = `
      <button class="cd-tl-act-btn" data-tl-act="edit" title="수정" aria-label="회차 수정"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
      <button class="cd-tl-act-btn cd-tl-act-btn--del" data-tl-act="delete" title="삭제" aria-label="회차 삭제"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>`;

// d: { final, num, title(예: "2차 · 355,305회"), pct(예: "(71%)"), metas:[{text, memo}] } → 행 요소. 글은 모두 textContent 로 넣는다.
function tlRowEl(d) {
  const row = document.createElement('div');
  row.className = d.final ? 'cd-tl-row cd-tl-row--final' : 'cd-tl-row';
  const num = document.createElement('div');
  num.className = 'cd-tl-num' + (d.final ? ' cd-tl-num--final' : '');
  num.textContent = d.num || (d.final ? '🏆' : '');
  const info = document.createElement('div'); info.className = 'cd-tl-info';
  const title = document.createElement('div'); title.className = 'cd-tl-title';
  title.textContent = d.title || '';
  if (d.pct) {
    title.appendChild(document.createTextNode(' '));
    const p = document.createElement('span'); p.className = 'cd-tl-pct'; p.textContent = d.pct; title.appendChild(p);
  }
  info.appendChild(title);
  (d.metas || []).forEach(mt => {
    if (!mt.text) return;
    const el = document.createElement('div'); el.className = 'cd-tl-meta'; el.textContent = mt.text;
    if (mt.memo) el.style.color = 'var(--orange)';
    info.appendChild(el);
  });
  const act = document.createElement('div'); act.className = 'cd-tl-act admin-only'; act.innerHTML = TL_ACT_HTML;
  row.append(num, info, act);
  return row;
}

// 행 → 데이터(위의 d). 정적 HTML 로 들어 있던 행도 같은 방식으로 읽는다.
function tlRowData(row) {
  const titleEl = row.querySelector('.cd-tl-title');
  const pctEl = titleEl && titleEl.querySelector('.cd-tl-pct');
  const pct = pctEl ? pctEl.textContent.trim() : '';
  let title = '';
  if (titleEl) { const c = titleEl.cloneNode(true); c.querySelector('.cd-tl-pct')?.remove(); title = c.textContent.trim().replace(/\s+/g, ' '); }
  return {
    final: row.classList.contains('cd-tl-row--final'),
    num: (row.querySelector('.cd-tl-num')?.textContent || '').trim(),
    title, pct,
    metas: [...row.querySelectorAll('.cd-tl-meta')].map(e => ({ text: e.textContent.trim().replace(/\s+/g, ' '), memo: /orange/.test(e.getAttribute('style') || '') })),
  };
}

// 타임라인 목록 전체를 서버에 저장한다(서버가 없으면 아무것도 안 한다). 광고주에게는 [연동] 후 보인다.
function metaSaveTimeline(list) {
  const page = list && list.closest('.page-wrapper');
  if (!page || !Api.enabled || !Api.isLoggedIn() || !Api.isAdmin() || !['p-detail', 'p-detail-upload'].includes(page.id)) return;
  const rows = [...list.querySelectorAll('.cd-tl-row')].map(tlRowData);
  Api.req('/api/campaign-meta?campaign=' + encodeURIComponent(page.id), { method: 'POST', body: { timeline: rows } }).then(r => {
    if (!r.ok) { alert(r.error || '회차 변경을 서버에 저장하지 못했습니다. 화면에만 반영되었습니다.'); return; }
    ruNotePub(page.id, r.data.pub);
  });
}

// 정적 캠페인 카드 정보를 서버에 저장한다
function metaSaveCard(card, vals) {
  const key = card.dataset.args;
  if (!key || !Api.enabled || !Api.isLoggedIn() || !Api.isAdmin()) return;
  Api.req('/api/campaign-meta?campaign=' + encodeURIComponent(key), { method: 'POST', body: { card: vals } }).then(r => {
    if (!r.ok) { alert(r.error || '캠페인 정보를 서버에 저장하지 못했습니다. 화면에만 반영되었습니다.'); return; }
    ruNotePub(key, r.data.pub);
    if (typeof showToast === 'function') showToast('저장했습니다. 광고주 화면에는 해당 캠페인의 [연동]을 누르면 반영됩니다.');
  });
}

// 서버의 캠페인 카드·타임라인 정보를 화면에 적용한다(관리자는 작업본, 광고주는 연동된 내용)
async function metaLoad() {
  if (!Api.enabled || !Api.isLoggedIn()) return;
  const r = await Api.req('/api/campaign-meta');
  if (!r.ok || !r.data) return;
  if (r.data.pub) { window._pubByKey = r.data.pub; ruRefreshPubButton(); }
  const meta = r.data.meta || {};
  Object.keys(meta).forEach(key => {
    const m = meta[key] || {};
    if (m.card) {
      document.querySelectorAll('.campaign-card:not([data-server-id])').forEach(card => {
        if (card.dataset.args === key && typeof window.applyCardValues === 'function') window.applyCardValues(card, m.card);
      });
    }
    if (m.timeline) {
      const list = document.querySelector('#' + CSS.escape(key) + ' .cd-tl-list');
      if (list) { list.innerHTML = ''; m.timeline.forEach(d => list.appendChild(tlRowEl(d))); }
    }
  });
}

function deleteRound(btn) {
  if (!isAdminViewer()) return;
  const row = btn?.closest('.cd-tl-row');
  if (!row) return;
  const label = row.querySelector('.cd-tl-title')?.textContent.trim().split('·')[0].trim() || '이 회차';
  if (!confirm(`${label} 리포트를 삭제할까요?`)) return;
  const list = row.closest('.cd-tl-list');
  row.remove();
  metaSaveTimeline(list);
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
  const metaText  = [date ? `${date} 기준` : '', vidsFmt].filter(Boolean).join(' · ');
  const row = tlRowEl({
    final: isFinal, num: isFinal ? '🏆' : round,
    title: [label, viewsFmt].filter(Boolean).join(' · '),
    pct: pct ? `(${pct}%)` : '',
    metas: [{ text: metaText, memo: false }, { text: memo || '', memo: true }],
  });

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
  metaSaveTimeline(list);
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

const escHtml = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// 캠페인 카드 한 장. 관리자 등록(서버/로컬)과 서버에서 불러온 목록이 같은 모양을 쓴다.
// c = {id?, title, platforms[], product, client, agency, goalViews, goalVids, start, end, thumb, status, sourceId?}
// 서버에서 온 값은 다른 사용자 화면에도 그려지므로 모두 이스케이프해서 넣는다.
function buildCampaignCard(c, opts) {
  const admin = !!(opts && opts.admin);
  const product = c.product || '조회수당';
  const plats = (c.platforms || []).filter(p => CREG_PLAT[p]);
  const acct = (c.agency || '').trim() || ((c.client || '').trim() !== '-' ? (c.client || '').trim() : '');
  const goalViews = c.goalViews || '', goalVids = c.goalVids || '';
  const thumbUrl = /^(https?:\/\/|img\/)/.test(c.thumb || '') ? c.thumb : '';
  const thumbBg = thumbUrl ? '' : 'background:linear-gradient(160deg,#1a1a2e,#16213e)';
  const status = c.status || 'recruiting';
  const SM = { recruiting: ['recruiting', '모집 중'], 'channel-select': ['recruiting', '채널 선정 중'], progress: ['running', '진행 중'], done: ['done', '완료'] };
  const [badgeCls, badgeText] = SM[status] || SM.recruiting;
  const goalNum = goalViews || goalVids;
  const goalUnit = goalViews ? '회' : '개';
  const progressText = goalNum ? `0 / ${Number(goalNum).toLocaleString()}${goalUnit} <span class="card-progress-pct">(0%)</span>` : '집계 예정';
  // 신규 캠페인은 아직 집계 데이터가 없다 → 데모 상세가 아니라 빈 상세로.
  // 프리미엄은 채널 선정 → 검토 현황 → 결과 3단계 화면(#p-channels)으로 연다. 일반(조회수당·업로드당) 상세와 구조가 다르다.
  const isPremium = product === '프리미엄';
  const pmKey = isPremium ? (c.id || ('local-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6))) : '';
  const detailFn = isPremium ? 'openPremiumCampaign' : 'goTo';
  const detailTarget = isPremium ? pmKey : 'p-detail-empty';

  const card = document.createElement('div');
  card.className = 'campaign-card';
  card.dataset.campaignStatus = status;
  card.dataset.campaignType = product === '프리미엄' ? 'connect' : (product === '업로드당' ? 'upload' : 'view');
  card.dataset.pct = '0';
  if (c.id) card.dataset.serverId = c.id;
  card.setAttribute('data-fn', detailFn);
  card.setAttribute('data-args', detailTarget);
  card.dataset.built = '1';
  if (isPremium) card.dataset.pmKey = pmKey;
  // 수정 사이드패널이 읽는 값들 — 없으면 등록한 카드를 편집할 수 없다
  Object.assign(card.dataset, {
    editTitle: c.title, editClient: acct, editProduct: product, editStatus: status,
    editGoalType: goalViews ? '조회수' : '영상', editGoalValue: goalNum || '', editCurrent: '0',
    editStart: c.start || '', editEnd: c.end || '', editThumb: thumbUrl, editPlatforms: plats.join(','),
    // 캠페인 생성에서 불러온 경우 출처 링크 (name|platform|start). 캘린더 조인·추적용.
    sourceId: c.sourceId || '',
  });
  card.innerHTML = `
    <div class="card-thumb"${thumbUrl ? '' : ` style="${thumbBg}"`}>${thumbUrl
      ? `<img src="${escHtml(thumbUrl)}" alt="${escHtml(c.title)}" loading="lazy">`
      : ''}${admin ? '<button class="card-edit-btn">수정</button>' : ''}</div>
    <div class="card-thumb-info">
      <div class="card-product-tag">${escHtml(product)}</div>
      <div class="status-badge ${badgeCls}">${badgeText}</div>
    </div>
    <div class="card-body">
      <div class="card-title">${escHtml(c.title)}</div>
      <div class="card-platform-badges">
        ${plats.map(p => CREG_PLAT[p]).join('')}
        ${acct ? `<span class="card-agency" title="광고주 계정">${escHtml(acct)}</span>` : ''}
      </div>
      <div class="card-progress-wrap">
        <div class="card-progress-track"><div class="card-progress-fill" style="width:0%"></div></div>
        <div class="card-progress-text">${progressText}</div>
      </div>
      <button class="card-btn primary" data-fn="${detailFn}" data-args="${escHtml(detailTarget)}" data-stop="1">상세 보기 →</button>
    </div>`;
  return card;
}

// 서버에 저장된 캠페인을 관리자 목록·광고주 목록에 그린다(관리자는 전체, 광고주는 서버가 걸러준 자기 것만)
async function syncCampaigns() {
  if (!Api.isLoggedIn()) return;
  const r = await Api.req('/api/campaigns');
  if (!r.ok) return;
  renderServerCampaigns(r.data.campaigns || []);
}

function renderServerCampaigns(list) {
  document.querySelectorAll('.campaign-card[data-server-id]').forEach(el => el.remove());
  const adminGrid = document.querySelector('#adm-panel-report .adm-report-grid');
  const advList = document.querySelector('#p-list .campaign-list');
  list.slice().reverse().forEach(c => {            // 오래된 것부터 prepend → 최신이 맨 위
    if (adminGrid && Api.isAdmin()) adminGrid.prepend(buildCampaignCard(c, { admin: true }));
    if (advList) advList.prepend(buildCampaignCard(c, { admin: false }));
  });
  try { updateChipCounts(); filterCampaigns(); } catch (e) {}
}

async function submitCampaignReg() {
  const title    = document.getElementById('creg-title')?.value.trim();
  const platform = document.getElementById('creg-platform')?.value;
  if (!title)    { alert('캠페인명을 입력해주세요.'); return; }
  if (!platform) { alert('플랫폼을 선택해주세요.'); return; }

  const isPremium = document.getElementById('cregPremiumToggle')?.dataset.on === 'true';
  const client    = document.getElementById('creg-client')?.value.trim() || '';
  const agency    = document.getElementById('creg-agency')?.value.trim() || '';
  const goalViews = (document.getElementById('creg-goal-views')?.value || '').replace(/,/g, '');
  const goalVids  = (document.getElementById('creg-goal-vids')?.value  || '').replace(/,/g, '');
  const data = {
    title, platforms: [platform],
    product: isPremium ? '프리미엄' : (goalViews ? '조회수당' : '업로드당'),
    client: client === '-' ? '' : client, agency,
    goalViews, goalVids,
    start: document.getElementById('creg-start')?.value || '',
    end: document.getElementById('creg-end')?.value || '',
    thumb: document.getElementById('creg-thumb-url')?.value.trim() || '',
    status: 'recruiting',
  };

  // 서버가 있으면 서버에 저장 → 광고주 화면에도 보이고 새로고침해도 남는다
  if (Api.enabled && (Api.isUp() || await Api.ping())) {
    if (!Api.isAdmin()) { alert('관리자 계정으로 로그인해야 캠페인을 등록할 수 있습니다.'); return; }
    const r = await Api.req('/api/campaigns', { method: 'POST', body: data });
    if (!r.ok) { alert(r.error || '캠페인 등록에 실패했습니다.'); return; }
    await syncCampaigns();
    closeCampaignRegModal();
    return;
  }
  // 서버가 없으면 예전처럼 이 화면에만 만든다(데모)
  const card = buildCampaignCard({ ...data, sourceId: document.getElementById('creg-source-id')?.value || '' }, { admin: true });
  const grid = document.querySelector('#adm-panel-report .adm-report-grid');
  if (grid) grid.prepend(card);
  closeCampaignRegModal();
}


// ── EVENT DISPATCHER (MV3 CSP: no inline handlers) ──
(function() {
  const fnMap = {
    goTo, goToAuth, goBackToList, doLogin, doLogout,
    submitInquiry, submitBrochure, setCardSlide,
    openNewCampaignModal, closeNewCampaignModal,
    selectCampaignProduct, toggleCampaignPlatform, submitNewCampaign,
    toggleVidList, goMyPage, fetchBestComments,
    openTaxModal, closeTaxModal, submitTaxRequest,
    openStatModal, closeStatModal,
    openChSelectModal, closeSingleModal, confirmChSelect,
    closeChSelectModal, confirmChSelectMulti,
    toggleChCheck, selectChecked, viewCheckedChannels, clearChecked, openPremiumCampaign, chRefreshStats,
    rejectCh, undoCh,
    chSortBy, chSetStatus, chSetReviewStatus, chSwitchTab,
    advanceReviewState, creatorRejectCh,
    openRevisionModal, closeReviewModal, approveReview, submitRevision, saveChVideoLink,
    openRevLogPanel, closeRevLogPanel, toggleRevCheck,
    toggleSimPost,
    pmSetPlatformFilter,
    refreshViewCounts,
    closeRefreshLimitModal,
    openReportUploadModal, closeReportUploadModal, ruSwitchTab,
    downloadReport, downloadSampleFile, applyReportCsv, runAutoLookup, saveAutoLookup, publishToAdvertiser,
    openChUploadModal, closeChUploadModal, chUploadSwitchTab, chUploadRun,
    p0RoleToggle,
    p0CcToggle,
    p0ChSlidePrev, p0ChSlideNext,
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
    if (el.dataset.change === 'handleReportCsvFile') { handleReportCsvFile(el); return; }
    if (el.dataset.change === 'handleAutoLookupFile') { handleAutoLookupFile(el); return; }
  });

  // 참여 영상 표 플랫폼 필터 (정적 표: p-detail·p-detail-upload).
  // 프리미엄(p-channels)은 데이터를 다시 그려야 해서 channels.js의
  // pmSetPlatformFilter(→ data-fn 경로)를 따로 쓰고, 여기선 다루지 않는다.
  document.addEventListener('click', function(e) {
    const chip = e.target.closest('.vid-plat-filter [data-vid-plat]');
    if (!chip) return;
    const bar = chip.closest('.vid-plat-filter');
    const card = chip.closest('.vid-card');
    if (!bar || !card) return;
    bar.querySelectorAll('[data-vid-plat]').forEach(b => b.classList.toggle('active', b === chip));
    const want = chip.dataset.vidPlat;
    card.querySelectorAll('.vid-table-wrap tbody tr[data-platform]').forEach(tr => {
      tr.style.display = (want === 'all' || tr.dataset.platform === want) ? '' : 'none';
    });
    vidApplyLimit(card);
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
    // K/M 약식(200K, 60M) 또는 콤마 포함 전체 수치(200,000 / 60,000,000) 모두 지원
    const km = orig.match(/^(\d+)([KM])$/);
    const target = km ? +km[1] : parseInt(orig.replace(/,/g, ''), 10);
    const unit = km ? km[2] : '';
    if (isNaN(target)) return;
    const dur = 1400, t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      const v = Math.round(ease * target);
      em.textContent = km ? v + unit : v.toLocaleString();
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


  // 국가 필터 선택지 — 목록에 있는 국가만, 많은 순으로(선택해 둔 국가는 목록에서 빠져도 유지)
  function scSyncCountryOptions() {
    var sel = g('sc-fCountry');
    if (!sel) return;
    var cur = sel.value;
    var counts = {};
    scItems.forEach(function (it) { var c = (it.country || '').trim(); if (c) counts[c] = (counts[c] || 0) + 1; });
    if (cur && !counts[cur]) counts[cur] = 0;
    var names = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b, 'ko'); });
    var sig = names.join('|');
    if (sel.dataset.sig === sig) return;      // 바뀐 게 없으면 다시 그리지 않는다
    sel.dataset.sig = sig;
    sel.innerHTML = '<option value="">전체</option>' + names.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
    sel.value = cur;
  }

  function scFiltered() {
    var type = (g('sc-fType') || {}).value || '';
    var filmCat = (g('sc-fFilmCat') || {}).value || '';
    var country = (g('sc-fCountry') || {}).value || '';
    // '전체'는 value="" 이므로 || 'open' 을 쓰면 안 됨 (전체가 미완료로 되돌아감)
    var statusEl = g('sc-fStatus');
    var status = statusEl ? statusEl.value : 'open';
    var q = ((g('sc-fQuery') || {}).value || '').trim().toLowerCase();
    var list = scItems.filter(function (it) {
      if (it.date && dday(it.date) < -7) return false;
      if (type && it.type !== type) return false;
      if (filmCat && it.filmCat !== filmCat) return false;
      if (country && (it.country || '') !== country) return false;
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

  function scRender() { scSyncCountryOptions(); scRenderTop(); if (scView === 'list') scRenderList(); else scRenderMonth(); }

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
      var ft = g('sc-fType'), fs = g('sc-fStatus'), fq = g('sc-fQuery'), fcn = g('sc-fCountry');
      if (ft) ft.value = ''; if (fs) fs.value = 'open'; if (fq) fq.value = ''; if (fcn) fcn.value = '';
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
    if (['sc-fType','sc-fFilmCat','sc-fCountry','sc-fStatus','sc-fQuery'].indexOf(e.target.id) !== -1) scRender();
    if (e.target.id === 'sc-iTitle') scAcDebounce(e.target.value);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && g('sc-sheet') && !g('sc-sheet').hidden) scCloseSheet();
  });

  // 상태 변경 시 무산 사유 필드 표시/숨김
  var scStatusSel = g('sc-iStatus');
  if (scStatusSel) scStatusSel.addEventListener('change', function() { scToggleCancelReason(this.value); });

  // ── KOBIS API 연동 ────────────────────────────────────────────────
  // KOBIS 호출은 서버(connect-server)가 대신 한다 — API 키는 서버 .env 에만 있다.
  // (서버가 연결되지 않은 공개 데모에서는 개봉 일정·영화 검색이 비어 있다)
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

  // 서버 중계 호출: 영화 목록(searchMovieList) 배열을 돌려준다. 실패하면 빈 배열
  async function kobisRelay(params) {
    if (!Api.enabled || !Api.isLoggedIn()) return [];
    var r = await Api.req('/api/kobis/movies?' + params);
    if (!r.ok || !r.data) return [];
    return (r.data.movieListResult && r.data.movieListResult.movieList) || [];
  }

  // 자동완성용 제목 검색
  async function kobisFetch(params) {
    return kobisRelay('itemPerPage=10&' + params);
  }

  // 개봉 예정작 조회 (openDt·repNationNm·movieCd 반환)
  async function kobisScheduleFetch() {
    var y = new Date().getFullYear();
    // 7일 전 기준 cutoff (이미 지난 개봉작 제외)
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    var cutoffStr = cutoff.getFullYear() + pad(cutoff.getMonth()+1) + pad(cutoff.getDate());
    var ADULT_GENRES = ['성인물', '에로', '성인', 'adult', 'erotic'];
    var list = await kobisRelay('openStartDt=' + y + '&openEndDt=' + (y + 1) + '&itemPerPage=100&curPage=1');
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
      // hidden 속성은 .campaign-card 의 display:flex 에 밀려 먹히지 않는다
      card.style.display = (!q || title.includes(q) || client.includes(q)) ? '' : 'none';
    });
  });
})();

// 참여 영상 행 삭제 (관리자 전용 — 버튼 열이 광고주에게는 CSS로 숨겨진다)
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.vid-del-btn');
  if (!btn) return;
  var row = btn.closest('tr');
  if (!row) return;
  var title = (row.querySelector('.vid-table-link') || row.querySelector('td:nth-child(2)'));
  var name = title ? title.textContent.trim().replace(/\s+/g, ' ') : '이 영상';
  if (name.length > 40) name = name.slice(0, 40) + '…';
  if (!confirm('"' + name + '"\n\n이 영상을 캠페인에서 삭제할까요?')) return;
  // 서버에 연결된 관리자 화면(조회수당·업로드당)이면 서버에도 반영한다 — 광고주에게는 [연동] 후 보인다
  var table = row.closest('table');
  var pageId = ruCampaignKey();
  if (Api.enabled && Api.isLoggedIn() && Api.isAdmin() && table && ['p-detail', 'p-detail-upload'].indexOf(pageId) !== -1) {
    var ni = ruTableColIndex(table, '채널명');
    var cell = row.children[ni];
    var chName = ruNormalizeName((cell && (cell.getAttribute('title') || cell.textContent)) || '');
    Api.req('/api/videos/delete?campaign=' + encodeURIComponent(pageId), { method: 'POST', body: { name: chName, platform: row.dataset.platform || 'yt' } }).then(function(r) {
      if (!r.ok) { alert(r.error || '서버에 삭제를 반영하지 못했습니다.'); return; }
      row.remove();
      if (r.data.pub) ruShowPubState(r.data.pub);
      if (typeof showToast === 'function') showToast('삭제했습니다. 광고주 화면에는 [연동]을 누르면 반영됩니다.');
    });
    return;
  }
  row.remove();   // 서버가 없는 데모에서는 화면에서만 지운다
});

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

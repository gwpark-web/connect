try { emailjs.init('PR1yiM-fDVGYx5wCo'); } catch(e) { console.warn('EmailJS init failed', e); }

// ── ROUTING ──
const pages = ['p1','p2','p3','p4','p7','p-shop','p-list','p-form','p-channels','p-detail','p-prod-view','p-prod-upload','p-prod-premium'];
const authPages = ['p-signup','p-brochure'];
const navMap = { p1:'nav-p1', p2:'nav-p2', p3:'nav-p3', p7:'nav-p7' };
const ctaPages = ['p-shop','p-form','p-channels'];
const p0ActivePages = ['p1','p2','p3','p7','p-prod-view','p-prod-upload','p-prod-premium'];

function goBackToList() { goTo('p-list'); }

function toggleServiceMenu() {
  document.getElementById('serviceDropdownMenu').classList.toggle('open');
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('serviceDropdownMenu');
  if (!menu || !menu.classList.contains('open')) return;
  if (!e.target.closest('.gnb-dropdown')) menu.classList.remove('open');
});

function goTo(id) {
  document.getElementById('serviceDropdownMenu')?.classList.remove('open');
  authPages.forEach(p => document.getElementById(p).classList.remove('active'));
  pages.forEach(p => document.getElementById(p).classList.remove('active'));
  document.getElementById(id).classList.add('active');
  Object.values(navMap).forEach(n => document.getElementById(n)?.classList.remove('active'));
  document.getElementById(navMap[id])?.classList.add('active');
  document.body.classList.toggle('p0-active', p0ActivePages.includes(id));
  window.scrollTo(0,0);

  const bar = document.getElementById('ctaBar');
  if (ctaPages.includes(id)) {
    bar.classList.add('visible');
    updateCta(id);
  } else {
    bar.classList.remove('visible');
  }

  if (id === 'p-channels') renderChannels('chTable');
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
    const n = selected4.size;
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

function handleCta() {
  const active = pages.find(p => document.getElementById(p).classList.contains('active'));
  if (active === 'p-shop') goTo('p-form');
  else if (active === 'p-form') goTo('p-channels');
  else if (active === 'p-channels') { alert('선정 완료! 캠페인이 시작됩니다.'); goTo('p-list'); }
}

// ── SCROLL ──
window.addEventListener('scroll', () => {
  document.querySelector('.gnb').classList.toggle('scrolled', window.scrollY > 30);
});

// ── INIT ──
goTo('p1');
document.body.classList.add('p0-active');

// ── EVENT DISPATCHER (MV3 CSP: no inline handlers) ──
(function() {
  const fnMap = {
    goTo, goToAuth, goBackToList, doLogin, handleCta,
    selectProduct, toggleCh, toggleServiceMenu,
    submitInquiry, submitBrochure
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
})();

emailjs.init('PR1yiM-fDVGYx5wCo');

// ── ROUTING ──
const pages = ['p0','p1','p2','p3','p4','p5','p6'];
const authPages = ['p-login','p-signup','p-inquiry','p-brochure'];
const navMap = { p0:'nav-p0', p1:'nav-p1', p2:'nav-p2', p3:'nav-p1', p4:'nav-p2', p5:'nav-p2', p6:'nav-p6' };
const ctaPages = ['p1','p3','p4'];

function goTo(id) {
  authPages.forEach(p => document.getElementById(p).classList.remove('active'));
  pages.forEach(p => document.getElementById(p).classList.remove('active'));
  document.getElementById(id).classList.add('active');
  Object.values(navMap).forEach(n => document.getElementById(n)?.classList.remove('active'));
  document.getElementById(navMap[id])?.classList.add('active');
  document.body.classList.toggle('p0-active', id === 'p0');
  window.scrollTo(0,0);

  const bar = document.getElementById('ctaBar');
  if (ctaPages.includes(id)) {
    bar.classList.add('visible');
    updateCta(id);
  } else {
    bar.classList.remove('visible');
  }

  if (id === 'p4') renderChannels();
}

function goToAuth(id) {
  authPages.forEach(p => document.getElementById(p).classList.remove('active'));
  pages.forEach(p => document.getElementById(p).classList.remove('active'));
  document.body.classList.toggle('p0-active', id === 'p-inquiry' || id === 'p-brochure');
  document.getElementById(id).classList.add('active');
}

function doLogin() {
  authPages.forEach(p => document.getElementById(p).classList.remove('active'));
  goTo('p2');
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

// ── PAGE 1 — 상품 선택 ──
let selectedProduct = null;
function selectProduct(key, name, price) {
  document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('prod-'+key).classList.add('selected');
  selectedProduct = { key, name, price };
  updateCta('p1');
}

// ── PAGE 3 — 날짜 계산 ──
function calcDates() {
  const live = document.getElementById('liveDate').value;
  if (!live) return;
  const d = new Date(live);
  const open = new Date(d); open.setDate(d.getDate()-14);
  const close = new Date(d); close.setDate(d.getDate()-11);
  document.getElementById('openDate').value = open.toISOString().split('T')[0];
  document.getElementById('closeDate').value = close.toISOString().split('T')[0];
}

// ── PAGE 4 — 채널 선정 ──
const channels = [
  { emoji:'🎬', name:'궁금해소', handle:'@궁금해소', cat:'엔터테인먼트', platforms:['yt'], subs:'99.7만', views:'85만', rate:'12.4%' },
  { emoji:'🍜', name:'평양냉면', handle:'@pyeongyang', cat:'엔터테인먼트', platforms:['yt','ig'], subs:'35만', views:'42만', rate:'9.8%' },
  { emoji:'🌊', name:'지우멍', handle:'@jiwumung', cat:'커뮤니티·썰', platforms:['yt'], subs:'12.5만', views:'18만', rate:'14.2%' },
  { emoji:'😸', name:'확고냥쇼츠', handle:'@hwakgocat', cat:'엔터테인먼트', platforms:['yt','tt'], subs:'6.7만', views:'9만', rate:'11.1%' },
  { emoji:'🎤', name:'쇼쇼짱', handle:'@showshowjjang', cat:'음악', platforms:['yt','ig','tt'], subs:'2.4만', views:'3.2만', rate:'8.7%' },
  { emoji:'👗', name:'패피소희', handle:'@fashionsohi', cat:'패션·뷰티', platforms:['ig','tt'], subs:'18만', views:'22만', rate:'13.5%' },
  { emoji:'🎮', name:'겜쟁이남자', handle:'@gameman', cat:'게임·IT', platforms:['yt'], subs:'44만', views:'61만', rate:'10.2%' },
  { emoji:'🍳', name:'요리하는곰', handle:'@cooking_bear', cat:'음식·요리', platforms:['yt','ig'], subs:'27만', views:'38만', rate:'15.1%' },
  { emoji:'💪', name:'헬스왕김씨', handle:'@healthking', cat:'운동·헬스', platforms:['yt','tt'], subs:'9.1만', views:'13만', rate:'11.8%' },
  { emoji:'📱', name:'썰전쟁', handle:'@ssul_wars', cat:'커뮤니티·썰', platforms:['yt'], subs:'53만', views:'71만', rate:'16.3%' },
  { emoji:'🌸', name:'뷰티일기', handle:'@beauty_diary', cat:'패션·뷰티', platforms:['ig','tt'], subs:'11.2만', views:'14만', rate:'12.9%' },
  { emoji:'🎵', name:'뮤직박스', handle:'@musicbox_kr', cat:'음악', platforms:['yt','ig'], subs:'8.3만', views:'11만', rate:'9.4%' },
];
let selected4 = new Set();

function renderChannels() {
  const tbody = document.getElementById('chTable');
  tbody.innerHTML = channels.map((ch, i) => `
    <tr class="${selected4.has(i)?'sel-row':''}" id="tr${i}">
      <td style="color:var(--gray-light);font-size:12px;text-align:center">${i+1}</td>
      <td><div class="ch-cell"><div class="ch-thumb">${ch.emoji}</div><div><div class="ch-name">${ch.name}</div><div class="ch-handle">${ch.handle}</div></div></div></td>
      <td style="text-align:center"><span class="cat-tag">${ch.cat}</span></td>
      <td><div class="p-dots">${ch.platforms.includes('yt')?'<span class="p-dot yt">YT</span>':''}${ch.platforms.includes('ig')?'<span class="p-dot ig">IG</span>':''}${ch.platforms.includes('tt')?'<span class="p-dot tt">TT</span>':''}</div></td>
      <td class="n-cell">${ch.subs}</td>
      <td class="n-cell">${ch.views}<div class="n-sub">평균</div></td>
      <td class="n-cell" style="color:var(--orange)">${ch.rate}</td>
      <td style="text-align:center"><button class="sel-btn ${selected4.has(i)?'on':''}" data-fn="toggleCh" data-args="${i}">${selected4.has(i)?'✓ 선정됨':'선정하기'}</button></td>
    </tr>
  `).join('');
}

function toggleCh(i) {
  if (selected4.has(i)) { selected4.delete(i); }
  else { if (selected4.size >= 30) { alert('최대 30개까지 선정 가능합니다.'); return; } selected4.add(i); }
  renderChannels();
  document.getElementById('cNum').textContent = `${selected4.size} / 30`;
  updateCta('p4');
}

// ── CTA ──
function updateCta(page) {
  const info = document.getElementById('ctaInfo');
  const btn = document.getElementById('ctaBtn');
  if (page === 'p1') {
    if (selectedProduct) {
      info.innerHTML = `선택: <strong>${selectedProduct.name}</strong> &nbsp;·&nbsp; <span class="orange">${selectedProduct.price}</span> (VAT 별도)`;
      btn.classList.add('on'); btn.textContent = '다음 단계로 →';
    } else {
      info.innerHTML = '상품을 선택해 주세요';
      btn.classList.remove('on');
    }
  } else if (page === 'p3') {
    info.innerHTML = '정보를 입력하고 다음 단계로 진행하세요';
    btn.classList.add('on'); btn.textContent = '다음 단계로 →';
  } else if (page === 'p4') {
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
    goTo('p0');
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
    goTo('p0');
  }).catch(() => {
    alert('전송 중 오류가 발생했습니다. 다시 시도해주세요.');
  });
}

function handleCta() {
  const active = pages.find(p => document.getElementById(p).classList.contains('active'));
  if (active === 'p1') goTo('p3');
  else if (active === 'p3') goTo('p4');
  else if (active === 'p4') { alert('선정 완료! 캠페인이 시작됩니다.'); goTo('p2'); }
}

// ── SCROLL ──
window.addEventListener('scroll', () => {
  document.querySelector('.gnb').classList.toggle('scrolled', window.scrollY > 30);
});

// ── INIT ──
goTo('p0');
document.body.classList.add('p0-active');

// ── EVENT DISPATCHER (MV3 CSP: no inline handlers) ──
(function() {
  const fnMap = {
    goTo, goToAuth, doLogin, handleCta,
    selectProduct, toggleCh,
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

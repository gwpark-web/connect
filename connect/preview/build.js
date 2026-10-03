/* ============================================================
   어드민 디자인 레퍼런스 프리뷰 생성기 (테스트 전용)
   oh-my-design.kr 의 4개 브랜드 디자인 시스템을 캠페인 관리 /
   채널 선정 두 페이지에 적용해 8개 미리보기 + 갤러리를 만든다.
   라이브 페이지(site.html)는 건드리지 않는다.
   실행: node preview/build.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const OUT = __dirname;

/* ---------- 폰트 (전 테마 공통 로드) ---------- */
const FONTS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Oswald:wght@500;600;700&family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">`;

/* ---------- 공통 베이스 CSS (CSS 변수로 테마 구동) ---------- */
const BASE_CSS = `
:root{
  --radius-card:14px; --radius-btn:10px; --radius-pill:999px; --radius-input:9px;
  --btn-shadow:none; --card-shadow:none; --card-border:1px solid var(--border);
  --h1-weight:800; --h1-tracking:-.01em;
  --thumb-bg:linear-gradient(160deg,#1a1a2e,#16213e);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-ui);font-size:14px;-webkit-font-smoothing:antialiased;line-height:1.5}
.wrap{max-width:1180px;margin:0 auto;padding:26px 24px 64px}
.pv-brandbar{font-size:12px;color:var(--muted);margin-bottom:16px;display:flex;gap:7px;align-items:center}
.pv-brandbar b{color:var(--brand);font-weight:700}
.pv-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:22px}
.pv-h1{font-family:var(--font-display);font-size:34px;font-weight:var(--h1-weight);letter-spacing:var(--h1-tracking);margin:0 0 5px;line-height:1.15}
.pv-hbadge{font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;background:var(--peach);color:var(--brand);margin-left:10px;vertical-align:middle}
.pv-sub{color:var(--muted);font-size:13px}
.pv-actions{display:flex;gap:10px}
.pv-btn{font-family:var(--font-ui);font-size:14px;font-weight:600;height:42px;padding:0 20px;border-radius:var(--radius-btn);border:1px solid transparent;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:filter .15s,transform .05s}
.pv-btn--primary{background:var(--brand);color:var(--on-brand);box-shadow:var(--btn-shadow)}
.pv-btn--primary:hover{filter:brightness(.94)}
.pv-btn--ghost{background:var(--surface);color:var(--text);border-color:var(--border)}
.pv-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.pv-chip{height:36px;padding:0 15px;border-radius:var(--radius-pill);border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:7px;cursor:pointer}
.pv-chip .n{font-size:11px;background:var(--surface-alt);color:var(--muted);border-radius:999px;padding:1px 7px}
.pv-chip--active{background:var(--brand);color:var(--on-brand);border-color:var(--brand)}
.pv-chip--active .n{background:rgba(255,255,255,.28);color:var(--on-brand)}
.pv-toolbar{display:flex;justify-content:space-between;gap:12px;margin-bottom:18px;flex-wrap:wrap}
.pv-search{position:relative}
.pv-search input{height:40px;width:280px;max-width:100%;padding:0 14px 0 38px;border-radius:var(--radius-input);border:1px solid var(--border);background:var(--surface);color:var(--text);font-family:inherit;font-size:13px}
.pv-search svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--muted)}
.pv-select{height:40px;padding:0 30px 0 14px;border-radius:var(--radius-input);border:1px solid var(--border);background:var(--surface);color:var(--text);font-family:inherit;font-size:13px}
.pv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.pv-ccard{background:var(--surface);border:var(--card-border);border-radius:var(--radius-card);box-shadow:var(--card-shadow);overflow:hidden;display:flex;flex-direction:column}
.pv-thumb{height:148px;position:relative;background:var(--thumb-bg)}
.pv-statuspill{position:absolute;top:12px;right:12px;font-size:11px;font-weight:700;padding:5px 11px;border-radius:999px;background:#fff;color:#333;box-shadow:0 1px 4px rgba(0,0,0,.18)}
.pv-tagrow{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;border-bottom:1px solid var(--border)}
.pv-ptag{font-size:12px;color:var(--muted);font-weight:600}
.pv-cstatus{font-size:11px;font-weight:700;color:var(--brand);display:inline-flex;align-items:center;gap:5px}
.pv-cstatus::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor}
.pv-cbody{padding:16px;display:flex;flex-direction:column;gap:11px;flex:1}
.pv-ctitle{font-family:var(--font-display);font-size:16px;font-weight:700;line-height:1.35}
.pv-plats{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.pv-plat{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;display:inline-flex;align-items:center;gap:4px}
.pv-plat.yt{background:#FEECEC;color:#E60000}.pv-plat.ig{background:#FCE7F3;color:#C13584}.pv-plat.tt{background:#E9E9E9;color:#111}
.pv-agency{margin-left:auto;font-size:11px;color:var(--muted)}
.pv-track{height:7px;background:var(--surface-alt);border-radius:999px;overflow:hidden;border:var(--track-border,none)}
.pv-fill{height:100%;background:var(--brand);border-radius:999px}
.pv-progtext{font-size:12px;color:var(--muted);margin-top:7px}
.pv-progtext b{color:var(--text);font-weight:700}
.pv-pct{color:var(--brand);font-weight:700}
.pv-cbtn{margin-top:auto;height:44px;border:none;border-radius:var(--radius-btn);background:var(--brand);color:var(--on-brand);font-family:var(--font-ui);font-weight:700;font-size:14px;cursor:pointer;box-shadow:var(--btn-shadow)}
.pv-summary{display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap}
.pv-stat{flex:1;min-width:130px;background:var(--surface);border:var(--card-border);border-radius:var(--radius-card);box-shadow:var(--card-shadow);padding:16px 18px}
.pv-stat .k{font-size:12px;color:var(--muted)}
.pv-stat .v{font-family:var(--font-display);font-size:26px;font-weight:800;margin-top:4px}
.pv-stat .v.brand{color:var(--brand)}
.pv-panel{background:var(--surface);border:var(--card-border);border-radius:var(--radius-card);box-shadow:var(--card-shadow);overflow:hidden}
table.pv-tbl{width:100%;border-collapse:collapse;font-size:13px}
.pv-tbl thead th{text-align:left;padding:12px 16px;font-size:12px;color:var(--muted);font-weight:600;background:var(--surface-alt);border-bottom:1px solid var(--border)}
.pv-tbl tbody td{padding:11px 16px;border-bottom:1px solid var(--border);vertical-align:middle}
.pv-tbl tbody tr:last-child td{border-bottom:none}
.pv-chcell{display:flex;align-items:center;gap:10px}
.pv-chthumb{width:34px;height:34px;border-radius:50%;background:var(--surface-alt);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.pv-chname{font-weight:700}
.pv-chhandle{font-size:11px;color:var(--muted)}
.pv-cid{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:var(--muted);background:var(--surface-alt);padding:2px 7px;border-radius:5px}
.pv-cat{font-size:11px;background:var(--surface-alt);color:var(--muted);padding:3px 9px;border-radius:999px;white-space:nowrap}
.pv-erbar{display:flex;align-items:center;gap:8px}
.pv-erbar .b{height:6px;width:70px;background:var(--surface-alt);border-radius:999px;overflow:hidden}
.pv-erbar .b i{display:block;height:100%;background:var(--brand)}
.pv-num{font-variant-numeric:tabular-nums;font-weight:600}
.pv-act-sel{height:30px;padding:0 15px;border-radius:var(--radius-btn);background:var(--brand);color:var(--on-brand);border:none;font-weight:700;font-size:12px;cursor:pointer;box-shadow:var(--btn-shadow)}
.pv-act-done{font-size:12px;color:var(--brand);font-weight:700}
.pv-zeal{font-size:11px;font-weight:700;color:var(--brand);background:var(--peach);padding:3px 9px;border-radius:999px}
@media(max-width:820px){.pv-grid{grid-template-columns:1fr}}
`;

/* ---------- 4개 브랜드 테마 ---------- */
const THEMES = {
  neosapience: {
    name: 'Neosapience', tag: '연구 신뢰 + 따뜻한 크리에이터 · 필 버튼 · 소프트 라운드',
    vars: `
      --bg:#ffffff;--surface:#ffffff;--surface-alt:#f4f4f4;--text:#111827;--muted:#6b7280;--border:#e8e8e8;
      --brand:#f97316;--brand-ink:#ea6a10;--on-brand:#ffffff;--peach:#ffe7d4;
      --font-ui:'Plus Jakarta Sans','Pretendard',sans-serif;--font-display:'Plus Jakarta Sans','Pretendard',sans-serif;
      --radius-card:22px;--radius-btn:999px;--radius-input:12px;--radius-pill:999px;
      --card-shadow:0 6px 20px rgba(17,24,39,.06);--card-border:1px solid #efefef;
      --thumb-bg:linear-gradient(150deg,#fe7e43,#f97316 55%,#ea580c);
      --h1-weight:700;`,
    css: `[data-theme=neosapience] .pv-statuspill{background:#fff;color:#f97316}`,
  },
  mikan: {
    name: 'Mikan', tag: '밝은 감귤 에드테크 · 3D 하드섀도우 버튼 · 경쾌',
    vars: `
      --bg:#f7f4f3;--surface:#ffffff;--surface-alt:#faf6f4;--text:#333333;--muted:#666666;--border:#eeeeee;
      --brand:#ff4c0a;--brand-ink:#ff7f09;--on-brand:#ffffff;--peach:#ffe8dd;
      --font-ui:'Noto Sans JP','Pretendard',sans-serif;--font-display:'Noto Sans JP','Pretendard',sans-serif;
      --radius-card:12px;--radius-btn:8px;--radius-input:8px;--radius-pill:999px;
      --card-shadow:0 2px 10px rgba(226,111,0,.07);--card-border:1px solid #f0eae6;
      --btn-shadow:#e26f00 0 4px 0 0;
      --thumb-bg:linear-gradient(150deg,#ff9f45,#ff4c0a);
      --h1-weight:900;`,
    css: `
      [data-theme=mikan] .pv-btn--primary:active,[data-theme=mikan] .pv-cbtn:active,[data-theme=mikan] .pv-act-sel:active{transform:translateY(3px);box-shadow:none}
      [data-theme=mikan] .pv-stat .v{font-family:'Oswald',sans-serif;letter-spacing:.5px}
      [data-theme=mikan] .pv-chip--active{box-shadow:#e26f00 0 3px 0 0}`,
  },
  hubspot: {
    name: 'HubSpot', tag: '따뜻한 에디토리얼 SaaS · 세리프 제목 · 테두리형 무섀도우 카드',
    vars: `
      --bg:#fcfcfa;--surface:#ffffff;--surface-alt:#f8f5ee;--text:#1f1f1f;--muted:#60605f;--border:#e6e1d4;
      --brand:#ff4800;--brand-ink:#e03e00;--on-brand:#ffffff;--peach:#fcded2;
      --font-ui:'Inter','Pretendard',sans-serif;--font-display:'Source Serif 4',Georgia,serif;
      --radius-card:16px;--radius-btn:8px;--radius-input:6px;--radius-pill:8px;
      --card-shadow:none;--card-border:1.5px solid #1f1f1f;
      --thumb-bg:linear-gradient(150deg,#042729,#0c3e41);
      --h1-weight:500;--h1-tracking:-.005em;`,
    css: `
      [data-theme=hubspot] .pv-statuspill{background:var(--peach);color:var(--brand);box-shadow:none}
      [data-theme=hubspot] .pv-chip{border-width:1.5px}
      [data-theme=hubspot] .pv-chip:not(.pv-chip--active){border-color:#dcd6c6}
      [data-theme=hubspot] .pv-zeal{border:1.5px solid var(--brand)}
      [data-theme=hubspot] .pv-tagrow{border-bottom:1.5px solid #eee}`,
  },
  reddit: {
    name: 'Reddit', tag: '기능적 뉴트럴 · 시스템폰트 · 필 버튼 · 콘텐츠 우선',
    vars: `
      --bg:#ffffff;--surface:#ffffff;--surface-alt:#f6f8f9;--text:#181c1f;--muted:#5c6c74;--border:rgba(0,0,0,.16);
      --brand:#d93900;--brand-ink:#ae2c00;--on-brand:#ffffff;--peach:#ffe3d6;
      --font-ui:-apple-system,system-ui,'Segoe UI',Roboto,Helvetica,Arial,'Pretendard',sans-serif;--font-display:-apple-system,system-ui,'Segoe UI',Roboto,'Pretendard',sans-serif;
      --radius-card:16px;--radius-btn:999px;--radius-input:999px;--radius-pill:999px;
      --card-shadow:0 1px 2px rgba(0,0,0,.06);--card-border:1px solid rgba(0,0,0,.16);
      --thumb-bg:linear-gradient(150deg,#1a1a1b,#303236);
      --h1-weight:700;`,
    css: `
      [data-theme=reddit] .pv-chip:not(.pv-chip--active){background:var(--surface-alt);border-color:transparent}
      [data-theme=reddit] .pv-cbtn,[data-theme=reddit] .pv-btn{letter-spacing:.01em}`,
  },
};

/* ---------- 아이콘 ---------- */
const searchIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`;
const plat = (t, label) => `<span class="pv-plat ${t}">${label}</span>`;

/* ---------- 캠페인 카드 ---------- */
function card(c) {
  return `
    <div class="pv-ccard">
      <div class="pv-thumb"><span class="pv-statuspill">${c.status}</span></div>
      <div class="pv-tagrow"><span class="pv-ptag">${c.product}</span><span class="pv-cstatus">${c.status}</span></div>
      <div class="pv-cbody">
        <div class="pv-ctitle">${c.title}</div>
        <div class="pv-plats">${c.plats}<span class="pv-agency">${c.agency}</span></div>
        <div>
          <div class="pv-track"><div class="pv-fill" style="width:${c.pct}%"></div></div>
          <div class="pv-progtext"><b>${c.cur}</b> / ${c.goal} <span class="pv-pct">(${c.pct}%)</span></div>
        </div>
        <button class="pv-cbtn">${c.btn}</button>
      </div>
    </div>`;
}

/* ---------- 페이지 1: 캠페인 관리 ---------- */
function pageCampaign(themeName) {
  return `
  <div class="pv-brandbar">커넥트 스튜디오 <span>·</span> 관리자 <span>·</span> <b>${themeName}</b> 스타일 프리뷰</div>
  <div class="pv-head">
    <div><h1 class="pv-h1">캠페인 관리</h1><div class="pv-sub">매니저 · 박건우</div></div>
    <div class="pv-actions">
      <button class="pv-btn pv-btn--ghost">← 돌아가기</button>
      <button class="pv-btn pv-btn--primary">보고서 등록하기</button>
    </div>
  </div>
  <div class="pv-tabs">
    <button class="pv-chip pv-chip--active">캠페인 보고서 <span class="n">40</span></button>
    <button class="pv-chip">캠페인 생성 <span class="n">23</span></button>
    <button class="pv-chip">계정 관리 <span class="n">4</span></button>
    <button class="pv-chip">캘린더 <span class="n">48</span></button>
  </div>
  <div class="pv-toolbar">
    <div class="pv-search">${searchIcon}<input placeholder="캠페인 검색..."></div>
    <select class="pv-select"><option>기본순</option><option>최신순</option></select>
  </div>
  <div class="pv-grid">
    ${card({product:'업로드당',status:'진행 중',title:'EPEX — UNIVERSE 음원 바이럴 캠페인',plats:plat('yt','쇼츠')+plat('tt','틱톡'),agency:'SM엔터테인먼트',pct:65,cur:'1,620',goal:'2,500개',btn:'상세 보기 →'})}
    ${card({product:'프리미엄',status:'채널 선정 중',title:'시리즈 〈다 이루어질지니〉',plats:plat('yt','쇼츠')+plat('ig','릴스'),agency:'카카오엔터테인먼트',pct:23,cur:'7',goal:'30개',btn:'채널 선정하기 →'})}
    ${card({product:'조회수당',status:'완료',title:'영화 〈토이 스토리 5〉',plats:plat('yt','쇼츠'),agency:'월트디즈니 코리아',pct:104,cur:'524,812',goal:'500,000회',btn:'상세 보기 →'})}
  </div>`;
}

/* ---------- 페이지 2: 채널 선정 ---------- */
function chRow(r) {
  return `<tr>
    <td>${plat(r.p, r.pl)}</td>
    <td><div class="pv-chcell"><div class="pv-chthumb">${r.emoji}</div><div><div class="pv-chname">${r.name}</div><div class="pv-chhandle">${r.handle}</div></div></div></td>
    <td>${r.cid ? `<span class="pv-cid">${r.cid}</span>` : '<span style="color:var(--muted)">-</span>'}</td>
    <td><span class="pv-cat">${r.cat}</span></td>
    <td class="pv-num">${r.subs}</td>
    <td><div class="pv-erbar"><div class="b"><i style="width:${r.er*5}%"></i></div><span class="pv-num">${r.er}%</span></div></td>
    <td>${r.zeal ? '<span class="pv-zeal">짤</span>' : '<span style="color:var(--muted)">-</span>'}</td>
    <td>${r.done ? '<span class="pv-act-done">✓ 선정됨</span>' : '<button class="pv-act-sel">선정</button>'}</td>
  </tr>`;
}
function pageChannels(themeName) {
  const rows = [
    {p:'yt',pl:'YT',emoji:'📦',name:'궁금해소',handle:'@궁금해소',cid:'',cat:'엔터테인먼트',subs:'99.7만',er:12.4,zeal:true,done:true},
    {p:'yt',pl:'YT',emoji:'📓',name:'썰전쟁',handle:'@ssul_wars',cid:'',cat:'커뮤니티·썰',subs:'53만',er:16.3,zeal:true,done:true},
    {p:'yt',pl:'YT',emoji:'🎮',name:'겜쟁이남자',handle:'@gameman',cid:'',cat:'게임·IT',subs:'44만',er:10.2,zeal:false,done:false},
    {p:'ig',pl:'IG',emoji:'👗',name:'패피소희',handle:'@fashionsohi',cid:'',cat:'패션',subs:'21만',er:11.1,zeal:true,done:false},
    {p:'yt',pl:'YT',emoji:'🎯',name:'삽시간',handle:'@asaptime',cid:'UCnLwQwwn3Q4NaTjfE…',cat:'미분류',subs:'274',er:0,zeal:true,done:false},
    {p:'yt',pl:'YT',emoji:'🍜',name:'평양냉면',handle:'@pyeongyang',cid:'',cat:'엔터테인먼트',subs:'35만',er:9.8,zeal:false,done:false},
  ].map(chRow).join('');
  return `
  <div class="pv-brandbar">커넥트 스튜디오 <span>·</span> 프리미엄 캠페인 <span>·</span> <b>${themeName}</b> 스타일 프리뷰</div>
  <div class="pv-head">
    <div><h1 class="pv-h1">시리즈 〈다 이루어질지니〉<span class="pv-hbadge">채널 선정 중</span></h1><div class="pv-sub">프리미엄 캠페인 · 채널 선정</div></div>
    <div class="pv-actions"><button class="pv-btn pv-btn--ghost">리포트 다운로드</button><button class="pv-btn pv-btn--primary">검수로 →</button></div>
  </div>
  <div class="pv-tabs">
    <button class="pv-chip pv-chip--active">채널 선정</button>
    <button class="pv-chip">검수</button>
    <button class="pv-chip">결과</button>
  </div>
  <div class="pv-summary">
    <div class="pv-stat"><div class="k">목표 채널</div><div class="v">30</div></div>
    <div class="pv-stat"><div class="k">선정 완료</div><div class="v brand">7</div></div>
    <div class="pv-stat"><div class="k">남은 채널</div><div class="v">23</div></div>
    <div class="pv-stat"><div class="k">합산 구독자</div><div class="v">1.8M</div></div>
  </div>
  <div class="pv-panel">
    <table class="pv-tbl">
      <thead><tr><th>플랫폼</th><th>채널명</th><th>CID</th><th>카테고리</th><th>구독자</th><th>평균 참여율</th><th>짤</th><th>액션</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

/* ---------- 파일 생성 ---------- */
function skeleton({ title, theme, body }) {
  const t = THEMES[theme];
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>${FONTS}
<style>${BASE_CSS}
body[data-theme=${theme}]{${t.vars}}
${t.css}
</style></head>
<body data-theme="${theme}"><div class="wrap">${body}</div></body></html>`;
}

const PAGES = [
  { key: 'campaign', label: '캠페인 관리', fn: pageCampaign },
  { key: 'channels', label: '채널 선정', fn: pageChannels },
];

let made = [];
for (const page of PAGES) {
  for (const [theme, t] of Object.entries(THEMES)) {
    const file = `${page.key}-${theme}.html`;
    fs.writeFileSync(path.join(OUT, file),
      skeleton({ title: `${page.label} · ${t.name} 프리뷰`, theme, body: page.fn(t.name) }), 'utf8');
    made.push({ file, page: page.label, pageKey: page.key, brand: t.name, tag: t.tag });
  }
}

/* ---------- 갤러리 index.html ---------- */
function galleryCard(m) {
  return `<a class="g-card" href="${m.file}" target="_blank" rel="noopener">
    <div class="g-frame"><iframe src="${m.file}" scrolling="no" tabindex="-1"></iframe></div>
    <div class="g-meta"><div class="g-brand">${m.brand}</div><div class="g-tag">${m.tag}</div></div>
    <div class="g-open">열기 →</div>
  </a>`;
}
const gallery = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>어드민 디자인 레퍼런스 프리뷰</title>${FONTS}
<style>
*{box-sizing:border-box}body{margin:0;background:#0f1115;color:#e8eaed;font-family:'Pretendard',-apple-system,sans-serif}
.gwrap{max-width:1200px;margin:0 auto;padding:40px 24px 80px}
h1{font-size:26px;margin:0 0 6px}.lede{color:#9aa3b2;font-size:14px;margin:0 0 8px}
.note{color:#6b7480;font-size:12px;margin:0 0 34px}
h2{font-size:16px;margin:36px 0 16px;padding-bottom:10px;border-bottom:1px solid #23262d;color:#c8ccd4}
.g-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
@media(max-width:1000px){.g-grid{grid-template-columns:repeat(2,1fr)}}
.g-card{display:block;background:#171a21;border:1px solid #262a33;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;transition:border-color .15s,transform .1s}
.g-card:hover{border-color:#4f8cff;transform:translateY(-2px)}
.g-frame{height:210px;overflow:hidden;background:#fff;position:relative}
.g-frame iframe{width:1180px;height:840px;border:0;transform:scale(.305);transform-origin:top left;pointer-events:none}
.g-meta{padding:12px 14px 6px}.g-brand{font-size:14px;font-weight:700}.g-tag{font-size:11px;color:#8b93a2;margin-top:3px;line-height:1.5}
.g-open{padding:0 14px 12px;font-size:12px;color:#4f8cff;font-weight:600}
</style></head>
<body><div class="gwrap">
  <h1>어드민 디자인 레퍼런스 프리뷰</h1>
  <p class="lede">2개 페이지 × 4개 브랜드 — oh-my-design.kr 디자인 시스템 적용 (테스트 전용)</p>
  <p class="note">Neosapience · Mikan · HubSpot · Reddit · 라이브 페이지(site.html)는 변경되지 않았습니다. 카드를 클릭하면 전체 화면으로 열립니다.</p>
  ${PAGES.map(p => `<h2>${p.label}</h2><div class="g-grid">${made.filter(m => m.pageKey === p.key).map(galleryCard).join('')}</div>`).join('')}
</div></body></html>`;
fs.writeFileSync(path.join(OUT, 'index.html'), gallery, 'utf8');

console.log('생성 완료:', made.length, '개 프리뷰 + 갤러리(index.html)');
made.forEach(m => console.log('  ·', m.file, '—', m.page, '/', m.brand));

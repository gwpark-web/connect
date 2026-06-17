// ── 채널 데이터 (광고주 채널 선정 화면 + 운영자 프리미엄 캠페인 상세 탭2 공용) ──
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

function renderChannels(tbodyId = 'chTable') {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
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
  renderChannels('chTable');
  renderChannels('pdpChTable');
  const cnt = `${selected4.size} / 30`;
  const cNum = document.getElementById('cNum');
  const pdpCNum = document.getElementById('pdpCNum');
  if (cNum) cNum.textContent = cnt;
  if (pdpCNum) pdpCNum.textContent = cnt;
  if (typeof updateCta === 'function') updateCta('p-channels');
}

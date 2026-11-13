// 文昌閣：寫准考證（用毛筆在准考證上寫一筆，放上供桌）、獻聰明菜、包子粽子（包中）、文昌籤。
// 場景座標跟正殿一樣是 360 × 645；SVG 裡的 id 都加 w 前綴，避免跟其他殿的 SVG 撞名。
import bgUrl from './assets/wen/wen-bg.webp';
import festUrl from './assets/wen/wen-festival.webp';
import brushUrl from './assets/wen/brush.webp';
import ticketUrl from './assets/wen/ticket.webp';
import vegUrl from './assets/wen/veggies.webp';
import bunsUrl from './assets/wen/buns.webp';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 文字內容（原創） ---------- */
export const WEN_QIAN = [
  { no: 1, level: '上上', title: '登科', poem: ['十年燈火伴書窗', '一朝筆落墨生香', '平日功夫今日見', '金榜題名在前方'],
    gist: '平常的累積會在考場上出現。相信自己準備過的東西。', tip: '今天把最常錯的三題再寫一遍。' },
  { no: 2, level: '上吉', title: '專心', poem: ['手機翻面放一旁', '一盞茶時讀一章', '心定自然記得牢', '分心再多也白忙'],
    gist: '讀書不在時間長，在於專心的那一段有多紮實。', tip: '用 25 分鐘番茄鐘讀一段，中間不碰手機。' },
  { no: 3, level: '中吉', title: '溫故', poem: ['新書未讀舊書黃', '回頭翻翻也無妨', '錯題本是藏寶圖', '一頁一頁變分糧'],
    gist: '與其一直衝新進度，不如回頭把錯過的地方補好。', tip: '翻開錯題本或考古題，挑一題重新算。' },
  { no: 4, level: '中平', title: '歇息', poem: ['燈下苦讀到天光', '腦袋昏昏字成霜', '睡飽再戰效率好', '熬夜反把分數傷'],
    gist: '最近太累了。睡眠也是準備考試的一部分。', tip: '今天比平常早 30 分鐘睡覺。' },
  { no: 5, level: '上吉', title: '問人', poem: ['一題卡住半天長', '開口一問便通暢', '不恥下問非丟臉', '師友都是你書囊'],
    gist: '卡住的地方問人最快，不用不好意思。', tip: '把一個卡很久的問題拿去問老師、同學或學長姐。' },
  { no: 6, level: '中吉', title: '穩心', poem: ['考前心跳像擂鼓', '深深吸氣慢慢吐', '會的題目先寫完', '難題留待最後補'],
    gist: '緊張是正常的。先拿穩會的分數，再回頭挑戰難題。', tip: '練習一次 4-7-8 呼吸：吸 4 秒、停 7 秒、吐 8 秒。' },
  { no: 7, level: '中平', title: '踏實', poem: ['莫羨他人分數高', '自家進步才重要', '昨日今日比一比', '一步一步上青霄'],
    gist: '跟別人比只會更焦慮，跟昨天的自己比就好。', tip: '寫下這週比上週進步的一件小事。' },
  { no: 8, level: '上上', title: '文昌', poem: ['文昌點燈照書窗', '筆下生花字字香', '心中有數不慌忙', '鯉躍龍門好風光'],
    gist: '方向對了，持續下去就會看到成果。文昌帝君替你點燈。', tip: '把考試日期寫在看得到的地方，倒數計時。' },
];

const GREET = [
  '文昌帝君捧著書卷微微一笑：「讀書辛苦了，喝口水再繼續。」',
  '文昌帝君點點頭：「不會的地方，就是下一步要學的地方。」',
  '文昌帝君拿起毛筆：「名字我記下了，考場上別慌。」',
  '文昌帝君摸摸鬍子：「睡飽、吃飽，腦袋才會靈光。」',
];
const NAMES = ['一', '二', '三', '四', '五', '六', '七', '八'];

/* ---------- 場景 ---------- */
// 參考點：文昌臉 (180,290)、供桌桌面 y≈382、拜墊中心 (184,525)；供桌上左右兩支蠟燭在 x≈100、258
const BIG = [180, 330]; // 大張准考證中心（寫字時）
const SMALL = [182, 392, .17]; // 放到供桌前緣：位置與縮放
export const WEN_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="文昌閣" class="wen-svg">
  <defs>
    <filter id="wLit" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="1 .03 0 0 .01  .02 .95 0 0 0  .01 .02 .9 0 0  0 0 0 1 0"/>
    </filter>
    <radialGradient id="wHalo"><stop offset="0" stop-color="#F2FFF6" stop-opacity=".95"/><stop offset=".6" stop-color="#9FE3C8" stop-opacity=".35"/><stop offset="1" stop-color="#9FE3C8" stop-opacity="0"/></radialGradient>
  </defs>
  <image id="wBg" href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice" style="display:none"/>
  <circle id="wHaloC" cx="180" cy="300" r="58" fill="url(#wHalo)" opacity=".15" style="mix-blend-mode:screen"/>
  <rect class="hit" data-wen="deity" role="button" tabindex="0" aria-label="向文昌帝君問安" x="140" y="250" width="80" height="110" rx="22" fill="transparent"/>

  <!-- 供品：聰明菜（左）、包子粽子（右）；獻了才出現 -->
  <image id="wVeg" class="wen-offer" href="${vegUrl}" x="117" y="341" width="38" height="40" style="display:none" filter="url(#wLit)"/>
  <image id="wBuns" class="wen-offer" href="${bunsUrl}" x="198" y="360" width="46" height="30" style="display:none" filter="url(#wLit)"/>

  <!-- 准考證：寫字時是大張，寫完縮小放到供桌前緣 -->
  <g id="wTicket" class="wen-ticket" data-wen="ticket" role="button" tabindex="0" aria-label="准考證" style="display:none">
    <image href="${ticketUrl}" x="-110" y="-98" width="220" height="195"/>
    <text id="wName" x="-12" y="-28" text-anchor="middle" font-family="'Noto Serif TC', serif" font-weight="700" font-size="17" fill="#5A2318"></text>
    <text id="wDate" x="-12" y="2" text-anchor="middle" font-family="'Noto Serif TC', serif" font-size="12" fill="#7A3A2A"></text>
    <path id="wInk" d="" fill="none" stroke="#1E1410" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
  </g>
  <image id="wBrush" class="wen-brush" href="${brushUrl}" x="0" y="0" width="50" height="56" style="display:none" pointer-events="none"/>
</svg>`;

export function initWenchang(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc } = api;
  const host = $('#wenHost');
  host.innerHTML = WEN_SVG(bgUrl);
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const wen = state.wen || (state.wen = { exam: null, vegDay: '', bunDay: '', qian: null });
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const daysLeft = () => {
    if (!wen.exam?.date) return null;
    const a = new Date(dayKey() + 'T00:00:00'), b = new Date(wen.exam.date + 'T00:00:00');
    return Math.round((b - a) / 864e5);
  };
  const active = () => !!wen.exam && (daysLeft() === null || daysLeft() >= 0);

  /* ----- 文昌問安 ----- */
  function greetGod() {
    S('wHaloC').setAttribute('opacity', '.7'); setTimeout(() => S('wHaloC').setAttribute('opacity', '.15'), 1400);
    burst('spark', 180, 295, reduce ? 3 : 10);
    say(GREET[Math.floor(Math.random() * GREET.length)], 'god');
  }

  /* ----- 准考證 ----- */
  const ticket = S('wTicket'), brush = S('wBrush'), ink = S('wInk');
  let mode = 'off'; // off｜write（大張，等你寫）｜placed（在供桌上）
  const setT = (x, y, s) => ticket.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
  const fillText = () => {
    S('wName').textContent = wen.exam ? wen.exam.name : '';
    const d = daysLeft();
    S('wDate').textContent = wen.exam?.date ? `${wen.exam.date.replace(/-/g, '/')}${d > 0 ? `・倒數 ${d} 天` : d === 0 ? '・就是今天' : ''}` : '';
  };
  const paintTicket = () => {
    fillText();
    if (mode === 'write') return;
    mode = active() ? 'placed' : 'off';
    ticket.style.display = mode === 'off' ? 'none' : '';
    ticket.setAttribute('aria-label', wen.exam ? `准考證：${wen.exam.name}` : '准考證');
    if (mode === 'placed') { setT(...SMALL); ink.setAttribute('d', wen.exam.ink || ''); }
  };
  paintTicket();
  function openTicket() {
    const d = daysLeft();
    const body = openSheet('寫准考證', `
      <p>寫下你要考的試，用毛筆在准考證上寫一筆，文昌帝君會把它放在供桌上，每天陪你倒數。</p>
      <label class="field"><span>考什麼</span><input id="wExam" class="wen-input" maxlength="12" placeholder="例如：學測、多益、國考" value="${esc(wen.exam?.name || '')}"></label>
      <label class="field"><span>考試日期（可以不填）</span><input id="wDay" class="wen-input" type="date" value="${esc(wen.exam?.date || '')}"></label>
      ${active() ? `<p class="hint">現在供桌上的是「${esc(wen.exam.name)}」${d > 0 ? `，還有 ${d} 天` : d === 0 ? '，就是今天，加油' : ''}。重新寫會換掉它。</p>` : ''}
      <div class="row"><button class="btn" id="wGo">拿毛筆來寫</button></div>`);
    const name = body.querySelector('#wExam'), day = body.querySelector('#wDay');
    setTimeout(() => name.focus(), 50);
    body.querySelector('#wGo').addEventListener('click', () => {
      const n = name.value.trim().replace(/\s+/g, ' ');
      if (!n) { name.focus(); return; }
      wen.exam = { name: n, date: day.value || '', ink: '' }; save();
      closeSheet(); startWrite();
    });
  }
  // 大張准考證飛出來，等你用毛筆寫一筆
  let strokes = [], cur = null, len = 0;
  function startWrite() {
    mode = 'write'; strokes = []; cur = null; len = 0; ink.setAttribute('d', '');
    fillText(); ticket.style.display = '';
    ticket.classList.add('writing');
    animT([SMALL[0], SMALL[1] - 40, .3], [...BIG, 1], 420);
    brush.style.display = ''; placeBrush(BIG[0] + 70, BIG[1] + 70);
    sfx.pop();
    say('按住准考證，像拿毛筆一樣在上面<b>寫一筆</b>：一個勾、一個圈，或簽個名都可以。', 'god');
  }
  function animT(from, to, ms, done) {
    const t0 = performance.now();
    const step = (t) => {
      const k = reduce ? 1 : Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setT(from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e, from[2] + (to[2] - from[2]) * e);
      if (k < 1) requestAnimationFrame(step); else done?.();
    };
    requestAnimationFrame(step);
  }
  // 筆尖在毛筆圖的左下角；毛筆拿在手指上方一點
  const placeBrush = (tx, ty) => { brush.setAttribute('x', (tx - 2).toFixed(1)); brush.setAttribute('y', (ty - 54).toFixed(1)); };
  const local = (p) => [p.x - BIG[0], p.y - BIG[1]];
  const inTicket = ([x, y]) => x > -104 && x < 104 && y > -90 && y < 90;
  const pathD = () => strokes.map((s) => 'M' + s.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')).join(' ');
  ticket.addEventListener('pointerdown', (e) => {
    if (mode === 'placed') { tapPlaced(); return; }
    if (mode !== 'write') return;
    e.preventDefault(); ticket.setPointerCapture(e.pointerId);
    const p = pt(e), q = [p.x, p.y - 26]; // 筆尖在手指上方，看得到自己寫的字
    placeBrush(...q);
    const l = local({ x: q[0], y: q[1] });
    cur = inTicket(l) ? [l] : []; strokes.push(cur);
  });
  ticket.addEventListener('pointermove', (e) => {
    if (mode !== 'write' || !cur) return;
    const p = pt(e), q = [p.x, p.y - 26];
    placeBrush(...q);
    const l = local({ x: q[0], y: q[1] });
    if (!inTicket(l)) return;
    const last = cur[cur.length - 1];
    if (last) { const d = Math.hypot(l[0] - last[0], l[1] - last[1]); if (d < 2) return; len += d; }
    cur.push(l); ink.setAttribute('d', pathD());
    if (Math.random() < .15) emit('spark', q[0], q[1]);
  });
  const up = () => {
    if (mode !== 'write' || !cur) return;
    cur = null;
    if (len > 90) finishWrite(); else if (len > 0) say('再多寫一點，寫一個完整的勾或圈。', 'god');
  };
  ticket.addEventListener('pointerup', up);
  ticket.addEventListener('pointercancel', up);
  ticket.addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; if (mode === 'write') autoWrite(); else if (mode === 'placed') tapPlaced(); });
  function autoWrite() { // 鍵盤：自動打一個勾
    strokes = [[[-60, 30], [-40, 52], [10, 0]]]; ink.setAttribute('d', pathD()); len = 120; finishWrite();
  }
  function finishWrite() {
    mode = 'placed'; brush.style.display = 'none'; ticket.classList.remove('writing');
    wen.exam.ink = pathD(); save();
    sfx.chime(); sfx.buzz([15, 50, 15]);
    burst('spark', BIG[0], BIG[1], reduce ? 4 : 16);
    setTimeout(() => {
      animT([...BIG, 1], SMALL, 650, () => { burst('spark', SMALL[0], SMALL[1], reduce ? 3 : 10); });
      const d = daysLeft();
      say(`准考證放上供桌了。文昌帝君記下了「${esc(wen.exam.name)}」${d > 0 ? `，還有 <b>${d} 天</b>，每天來上香陪你倒數` : d === 0 ? '，就是今天，深呼吸，你可以的' : ''}。`, 'god');
    }, 500);
  }
  function tapPlaced() {
    const d = daysLeft();
    sfx.knock();
    say(`供桌上的准考證：「${esc(wen.exam.name)}」${d > 0 ? `，還有 ${d} 天。今天也讀一點點就好。` : d === 0 ? '，就是今天！' : '。'}`);
  }

  /* ----- 獻聰明菜、包子粽子 ----- */
  const OFFERS = {
    veg: { el: S('wVeg'), key: 'vegDay', at: [136, 360], again: '今天的聰明菜已經擺上去了：蔥、芹菜、蒜、菜頭，一樣都沒少。',
      say: '聰明菜擺上供桌了：<b>蔥</b>是聰明、<b>芹菜</b>是勤學、<b>蒜</b>是會算、<b>菜頭</b>是好彩頭。拜完記得帶回家煮來吃。' },
    buns: { el: S('wBuns'), key: 'bunDay', at: [221, 372], again: '今天的包子粽子已經擺好了，包你中！',
      say: '包子和粽子擺上供桌了，<b>包中</b>！文昌帝君笑了：「吃飽才有力氣讀書。」' },
  };
  const paintOffers = () => { for (const o of Object.values(OFFERS)) o.el.style.display = wen[o.key] === dayKey() ? '' : 'none'; };
  paintOffers();
  function offer(k) {
    const o = OFFERS[k];
    if (wen[o.key] === dayKey()) { say(o.again); return; }
    wen[o.key] = dayKey(); save(); paintOffers();
    o.el.classList.remove('pop'); void o.el.getBoundingClientRect(); o.el.classList.add('pop');
    sfx.pop(); setTimeout(() => sfx.chime(), 300);
    burst('spark', o.at[0], o.at[1], reduce ? 3 : 10);
    say(o.say, 'god');
  }

  /* ----- 文昌籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!wen.qian || wen.qian.date !== t) { wen.qian = { date: t, no: 1 + Math.floor(Math.random() * WEN_QIAN.length) }; save(); sfx.rattle(1); }
    const f = WEN_QIAN.find((x) => x.no === wen.qian.no);
    openSheet(`文昌籤第${NAMES[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>文昌籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日讀書小功課</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，分數還是靠你自己一題一題寫出來。</p>`);
  }

  const ACTS = { ticket: openTicket, veg: () => offer('veg'), buns: () => offer('buns'), qian: openQian };
  svg.addEventListener('click', (e) => { if (e.target.closest('[data-wen="deity"]')) greetGod(); });
  svg.querySelector('[data-wen="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#wenBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-wen]'); if (b) ACTS[b.dataset.wen](); });

  return {
    enter() {
      if (mode === 'write') { mode = 'off'; brush.style.display = 'none'; ticket.classList.remove('writing'); }
      paintTicket(); paintOffers();
      const d = daysLeft();
      say(!wen.exam ? '歡迎來到文昌閣！先點燭、上香向文昌帝君稟報，再按「准考證」寫下你要考的試，用毛筆在上面寫一筆。'
        : active() && d > 0 ? `歡迎回來。「${esc(wen.exam.name)}」還有 <b>${d} 天</b>，上個香，今天也讀一點點。`
        : active() && d === 0 ? `今天就是「${esc(wen.exam.name)}」！深呼吸，會的先寫，文昌帝君陪著你。`
        : '又見面了。可以獻聰明菜、擺包子粽子，或抽一支文昌籤。考完了也可以再寫一張新的准考證。', 'god');
    },
    setFestive(on) { S('wBg').setAttribute('href', on ? festUrl : bgUrl); },
    god: '文昌帝君', qianName: '文昌籤', qianCount: WEN_QIAN.length,
    hasQianToday: () => !!wen.qian && wen.qian.date === dayKey(),
    setQian(no) { wen.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

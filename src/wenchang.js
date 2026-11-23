// 文昌閣：寫准考證（用毛筆在准考證上寫一筆，放上供桌）、獻聰明菜、包子粽子（包中）、文昌籤。
// 場景座標跟正殿一樣是 360 × 645；SVG 裡的 id 都加 w 前綴，避免跟其他殿的 SVG 撞名。
import bgUrl from './assets/wen/wen-bg.webp';
import festUrl from './assets/wen/wen-festival.webp';
import brushUrl from './assets/wen/brush.webp';
import ticketUrl from './assets/wen/ticket.webp';
import vegUrl from './assets/wen/veggies.webp';
import bunsUrl from './assets/wen/buns.webp';

import { wallet } from './wallet.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 照筆順描字：每天一個字，座標在 0～100 的方格裡，每一筆是一條折線（照書寫方向）
const ZI = [
  { c: '中', why: '考中', s: [[[28, 30], [28, 64]], [[28, 30], [72, 30], [72, 64]], [[28, 62], [72, 62]], [[50, 8], [50, 94]]] },
  { c: '上', why: '金榜上榜', s: [[[48, 12], [48, 86]], [[48, 48], [76, 48]], [[12, 86], [88, 86]]] },
  { c: '文', why: '文思泉湧', s: [[[48, 8], [54, 22]], [[14, 32], [86, 32]], [[70, 32], [54, 62], [18, 90]], [[30, 40], [56, 70], [88, 90]]] },
  { c: '正', why: '正常發揮', s: [[[18, 14], [82, 14]], [[50, 14], [50, 86]], [[50, 50], [78, 50]], [[26, 40], [26, 86]], [[10, 88], [90, 88]]] },
  { c: '王', why: '考場稱王', s: [[[20, 16], [80, 16]], [[26, 50], [74, 50]], [[50, 16], [50, 86]], [[12, 86], [88, 86]]] },
  { c: '大', why: '大吉大利', s: [[[12, 36], [88, 36]], [[50, 8], [48, 50], [14, 90]], [[52, 46], [70, 72], [90, 90]]] },
];
const GRID = { x: 70, y: 220, w: 220 }; // 描字紙在場景裡的位置（左上角、邊長）
const g2s = ([u, v]) => [GRID.x + 10 + u * 2, GRID.y + 10 + v * 2]; // 0～100 → 場景座標
const s2g = (x, y) => [(x - GRID.x - 10) / 2, (y - GRID.y - 10) / 2];
const segDist = ([px, py], [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
const lineDist = (p, P) => { let m = 1e9; for (let i = 1; i < P.length; i++) m = Math.min(m, segDist(p, P[i - 1], P[i])); return m; };
const resample = (P, n) => { const out = []; let L = 0; const seg = []; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(d); L += d; } for (let k = 0; k <= n; k++) { let t = (L * k) / n, i = 0; while (i < seg.length - 1 && t > seg[i]) { t -= seg[i]; i++; } const r = seg[i] ? t / seg[i] : 0; out.push([P[i][0] + (P[i + 1][0] - P[i][0]) * r, P[i][1] + (P[i + 1][1] - P[i][1]) * r]); } return out; };
const plen = (P) => P.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : 0), 0);
const ziOfDay = (day) => { const d = new Date(day.replace(/-/g, '/')); return ZI[Math.floor(d / 864e5) % ZI.length]; };

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
const NAMES = Array.from({ length: 60 }, (_, i) => { const n = i + 1, d = '一二三四五六七八九'; return n < 10 ? d[n - 1] : `${n >= 20 ? d[Math.floor(n / 10) - 1] : ''}十${n % 10 ? d[n % 10 - 1] : ''}`; }); // 第幾首（籤加量後到 24 首）

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
  <circle transform="translate(182 380) scale(1.38) translate(-182 -380)" id="wHaloC" cx="180" cy="300" r="58" fill="url(#wHalo)" opacity=".15" style="mix-blend-mode:screen"/>
  <rect transform="translate(182 380) scale(1.38) translate(-182 -380)" class="hit" data-wen="deity" role="button" tabindex="0" aria-label="向文昌帝君問安" x="140" y="250" width="80" height="110" rx="22" fill="transparent"/>

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
  <!-- 描字紙（米字格）：寫准考證、每天練字時出現 -->
  <g id="wGrid" class="wen-grid" data-wen="grid" tabindex="0" aria-label="描字紙" style="display:none">
    <rect x="${GRID.x}" y="${GRID.y}" width="${GRID.w}" height="${GRID.w}" rx="10" fill="#FBF3DF" stroke="#B8322A" stroke-width="3"/>
    <path d="M${GRID.x + 10} ${GRID.y + 110}h200M${GRID.x + 110} ${GRID.y + 10}v200M${GRID.x + 10} ${GRID.y + 10}l200 200M${GRID.x + 210} ${GRID.y + 10}l-200 200" stroke="#E7A79A" stroke-width="1.2" stroke-dasharray="5 5"/>
    <rect x="${GRID.x + 10}" y="${GRID.y + 10}" width="200" height="200" fill="none" stroke="#E7A79A" stroke-width="1.2"/>
    <g id="wGuide" fill="none" stroke-linecap="round" stroke-linejoin="round"></g>
    <path id="wTrace" d="" fill="none" stroke="#1E1410" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>
    <path id="wTry" d="" fill="none" stroke="#1E1410" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>
    <text id="wGridTip" x="${GRID.x + GRID.w / 2}" y="${GRID.y - 10}" text-anchor="middle" font-family="Huninn, sans-serif" font-size="15" fill="#FFF4D8" stroke="#3A1A0E" stroke-width="3" paint-order="stroke"></text>
  </g>
  <!-- 考試倒數牌 -->
  <g id="wCount" pointer-events="none" style="display:none">
    <rect x="10" y="100" width="132" height="28" rx="14" fill="#123A2E" opacity=".8"/>
    <text id="wCountT" x="76" y="119" text-anchor="middle" font-family="Huninn, sans-serif" font-size="14" fill="#DFFFEF"></text>
  </g>
  <image id="wBrush" class="wen-brush" href="${brushUrl}" x="0" y="0" width="50" height="56" style="display:none" pointer-events="none"/>
</svg>`;

export function initWenchang(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam } = api;
  const host = $('#wenHost');
  host.innerHTML = WEN_SVG(bgUrl);
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const wen = state.wen || (state.wen = { exam: null, vegDay: '', bunDay: '', qian: null });
  wen.trace = wen.trace || { day: '', days: 0, best: {} };
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
  const paintCount = () => {
    const d = daysLeft(), on = active() && d !== null;
    S('wCount').style.display = on ? '' : 'none';
    if (on) S('wCountT').textContent = d === 0 ? `${wen.exam.name}・就是今天！` : `${wen.exam.name}・倒數 ${d} 天`;
  };
  const paintTicket = () => {
    fillText(); paintCount();
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
      ${active() ? `<div class="row"><button class="btn gold" id="wTraceGo">${wen.trace.day === dayKey() ? '再描一次' : '描今天的字'}「${ziOfDay(dayKey()).c}」</button></div>
      <p class="hint">每天一個字，照筆順描，描得準分數就高。已經練字 ${wen.trace.days} 天。</p><hr class="wen-hr">` : ''}
      <p>寫下你要考的試，再用毛筆照筆順描一個字，文昌帝君會把准考證放在供桌上，每天陪你倒數。</p>
      <label class="field"><span>考什麼</span><input id="wExam" class="wen-input" maxlength="12" placeholder="例如：學測、多益、國考" value="${esc(wen.exam?.name || '')}"></label>
      <label class="field"><span>考試日期（可以不填）</span><input id="wDay" class="wen-input" type="date" value="${esc(wen.exam?.date || '')}"></label>
      ${active() ? `<p class="hint">現在供桌上的是「${esc(wen.exam.name)}」${d > 0 ? `，還有 ${d} 天` : d === 0 ? '，就是今天，加油' : ''}。重新寫會換掉它。</p>` : ''}
      <div class="row"><button class="btn" id="wGo">拿毛筆來寫</button></div>`);
    const name = body.querySelector('#wExam'), day = body.querySelector('#wDay');
    body.querySelector('#wTraceGo')?.addEventListener('click', () => { closeSheet(); startWrite('daily'); });
    if (!active()) setTimeout(() => name.focus(), 50);
    body.querySelector('#wGo').addEventListener('click', () => {
      const n = name.value.trim().replace(/\s+/g, ' ');
      if (!n) { name.focus(); return; }
      wen.exam = { name: n, date: day.value || '', ink: '' }; save();
      closeSheet(); startWrite();
    });
  }
  // 描字：先出現米字格，照筆順一筆一筆描今天的字
  const grid = S('wGrid'), guide = S('wGuide'), trace = S('wTrace'), tryP = S('wTry');
  let zi = null, si = 0, done = [], cur = null, scores = [], miss = 0, why = 'ticket';
  const toD = (P) => 'M' + P.map((q) => g2s(q).map((v) => v.toFixed(1)).join(' ')).join(' L');
  function paintGuide() {
    guide.innerHTML = zi.s.map((P, i) => {
      const [x, y] = g2s(P[0]), now = i === si, past = i < si;
      return `<path d="${toD(P)}" stroke="${now ? '#E8A43A' : '#D8CBB4'}" stroke-width="${now ? 16 : 14}" opacity="${past ? 0 : now ? .9 : .7}"/>`
        + (past ? '' : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${now ? 9 : 7}" fill="${now ? '#C2372B' : '#B8A88E'}"/><text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="${now ? 11 : 9}" fill="#fff" font-family="Huninn, sans-serif">${i + 1}</text>`);
    }).join('');
    trace.setAttribute('d', done.map(toD).join(' '));
    S('wGridTip').textContent = si < zi.s.length ? `描「${zi.c}」第 ${si + 1}／${zi.s.length} 筆，從紅點開始` : '';
  }
  function startWrite(kind = 'ticket') {
    why = kind; mode = 'write'; zi = ziOfDay(dayKey()); si = 0; done = []; cur = null; scores = []; miss = 0;
    ticket.style.display = 'none'; grid.style.display = ''; tryP.setAttribute('d', '');
    grid.classList.remove('pop'); void grid.getBoundingClientRect(); grid.classList.add('pop');
    paintGuide();
    brush.style.display = ''; placeBrush(GRID.x + GRID.w - 20, GRID.y + GRID.w + 10);
    cam?.zoom?.(180, 330, 300);
    sfx.pop();
    say(`今天的字是「<b>${zi.c}</b>」（${zi.why}）。照著<b>筆順</b>，從紅點開始一筆一筆描，描得越準分數越高。毛筆會在手指上方。`, 'god');
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
  const LIFT = 56; // 筆尖在手指上方，看得到自己寫的字
  grid.addEventListener('pointerdown', (e) => {
    if (mode !== 'write' || si >= zi.s.length) return;
    e.preventDefault(); grid.setPointerCapture(e.pointerId);
    const p = pt(e); placeBrush(p.x, p.y - LIFT);
    cur = [s2g(p.x, p.y - LIFT)];
  });
  grid.addEventListener('pointermove', (e) => {
    if (mode !== 'write') return;
    const p = pt(e); placeBrush(p.x, p.y - LIFT);
    if (!cur) return;
    const q = s2g(p.x, p.y - LIFT), l = cur[cur.length - 1];
    if (Math.hypot(q[0] - l[0], q[1] - l[1]) < 1) return;
    cur.push(q); tryP.setAttribute('d', toD(cur));
  });
  const up = () => {
    if (mode !== 'write' || !cur) return;
    const U = cur; cur = null; tryP.setAttribute('d', '');
    judge(U);
  };
  grid.addEventListener('pointerup', up);
  grid.addEventListener('pointercancel', () => { cur = null; tryP.setAttribute('d', ''); });
  grid.addEventListener('keydown', (e) => { if (e.key === 'Enter' && mode === 'write') autoWrite(); });
  ticket.addEventListener('pointerdown', () => { if (mode === 'placed') tapPlaced(); });
  ticket.addEventListener('keydown', (e) => { if (e.key === 'Enter' && mode === 'placed') tapPlaced(); });
  // 評一筆：起點、終點、整條線離範本多遠
  function judge(U) {
    const P = zi.s[si], L = plen(P);
    if (plen(U) < Math.max(5, L * .45)) { if (plen(U) > 1) { miss++; say('這一筆短了一點，要描到黃色那條的尾巴。'); } return; }
    const A = resample(U, 16), B = resample(P, 16);
    const avg = (A.reduce((a, q) => a + lineDist(q, P), 0) / A.length + B.reduce((a, q) => a + lineDist(q, U), 0) / B.length) / 2;
    const d0 = Math.hypot(U[0][0] - P[0][0], U[0][1] - P[0][1]), d1 = Math.hypot(U[U.length - 1][0] - P[P.length - 1][0], U[U.length - 1][1] - P[P.length - 1][1]);
    const rev = Math.hypot(U[0][0] - P[P.length - 1][0], U[0][1] - P[P.length - 1][1]) < d0 && Math.hypot(U[U.length - 1][0] - P[0][0], U[U.length - 1][1] - P[0][1]) < d1;
    if (rev && avg < 14) { miss++; sfx.knock(); say('方向反了！要從<b>紅點</b>那一頭開始寫。'); return; }
    if (avg > 13 || d0 > 24 || d1 > 26) {
      miss++; sfx.knock();
      const later = zi.s.findIndex((Q, i) => i > si && lineDist(U[0], Q) < 10 && lineDist(U[U.length - 1], Q) < 10);
      say(later > 0 ? `筆順不對喔，這個是第 ${later + 1} 筆。先寫<b>第 ${si + 1} 筆</b>（亮黃色那條）。` : '偏掉了，沿著亮黃色那條再描一次。');
      return;
    }
    const sc = Math.max(55, Math.round(100 - avg * 2.6 - Math.max(0, d0 - 6) * .8 - Math.max(0, d1 - 6) * .8));
    scores.push(sc); done.push(U); si++;
    sfx.pop(); sfx.buzz(10);
    const [ex, ey] = g2s(U[U.length - 1]);
    emit('text', ex, ey - 16, { text: sc >= 92 ? '漂亮！' : sc >= 80 ? '不錯' : '好', color: '#FFE08A', life: 1, vy: -26 });
    paintGuide();
    if (si >= zi.s.length) finishTrace();
  }
  function autoWrite() { // 鍵盤：自動描好
    for (; si < zi.s.length; si++) { done.push(zi.s[si]); scores.push(95); }
    paintGuide(); finishTrace();
  }
  function finishTrace() {
    const score = Math.max(40, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) - miss * 3);
    const t = dayKey(), tr = wen.trace, first = tr.day !== t;
    const old = tr.best[zi.c] || 0, newBest = old && score > old;
    tr.best[zi.c] = Math.max(old, score);
    if (first) { tr.day = t; tr.days++; wallet.earn(score >= 90 ? 13 : 8, `描字「${zi.c}」`, 180, 240); }
    save();
    sfx.chime(); sfx.buzz([15, 50, 15]);
    burst('spark', 180, 330, reduce ? 4 : 18);
    emit('text', 180, 250, { text: `${score} 分`, color: '#FFE08A', life: 2, vy: -20 });
    const word = score >= 90 ? '字跡端正，文昌帝君滿意地點點頭。' : score >= 75 ? '寫得很穩，再慢一點會更漂亮。' : '有寫完就很棒，明天再練練。';
    const tail = `${first ? `今天第一次練字，福氣 +${score >= 90 ? 13 : 8}。` : ''}${newBest ? `「${zi.c}」的最高分刷新了！` : ''}已經練字 ${tr.days} 天。`;
    say(`「${zi.c}」描好了，<b>${score} 分</b>！${word}${tail}`, 'god');
    if (why === 'ticket') {
      // 描好的字縮小蓋在准考證右上角的照片格
      wen.exam.ink = done.map((U) => 'M' + U.map(([u, v]) => `${(46 + u * .4).toFixed(1)} ${(-76 + v * .4).toFixed(1)}`).join(' L')).join(' '); save();
      ink.setAttribute('d', wen.exam.ink);
      setTimeout(() => { grid.style.display = 'none'; ticket.style.display = ''; fillText(); setT(...BIG, 1); finishWrite(); }, 900);
    } else {
      mode = 'off'; brush.style.display = 'none';
      setTimeout(() => { grid.style.display = 'none'; paintTicket(); cam?.reset?.(500); }, 1400);
    }
  }
  function finishWrite() {
    mode = 'placed'; brush.style.display = 'none'; ticket.classList.remove('writing'); cam?.reset?.(600);
    setTimeout(() => {
      animT([...BIG, 1], SMALL, 650, () => { burst('spark', SMALL[0], SMALL[1], reduce ? 3 : 10); });
      const d = daysLeft();
      paintCount();
      say(`准考證放上供桌了，左上角會每天幫你倒數。文昌帝君記下了「${esc(wen.exam.name)}」${d > 0 ? `，還有 <b>${d} 天</b>，每天來描一個字、陪你倒數` : d === 0 ? '，就是今天，深呼吸，你可以的' : ''}。`, 'god');
    }, 2600);
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
      if (mode === 'write') { mode = 'off'; brush.style.display = 'none'; grid.style.display = 'none'; ticket.classList.remove('writing'); }
      paintTicket(); paintOffers();
      const d = daysLeft();
      say(!wen.exam ? '歡迎來到文昌閣！先點燭、上香向文昌帝君稟報，再按「准考證」寫下你要考的試，用毛筆在上面寫一筆。'
        : active() && d > 0 ? `歡迎回來。「${esc(wen.exam.name)}」還有 <b>${d} 天</b>。${wen.trace.day === dayKey() ? '今天也讀一點點。' : `按「准考證」描今天的字「${ziOfDay(dayKey()).c}」。`}`
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

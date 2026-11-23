// 彌勒殿「歡喜堂」：摸肚子（在彌勒佛的大肚子上來回摸，摸到他哈哈大笑）；丟煩惱（寫下煩惱揉成紙團，丟進左邊的大布袋，換回一顆金橘）；彌勒籤。
// 構圖跟月老閣一樣（不放大）。場景座標 360 × 645；SVG 裡的 id 都加 ml 前綴。
// 道具有 Gemini 圖就用圖（src/assets/ml/note.webp、kumquat.webp），沒有先用程式畫的。
import bgUrl from './assets/ml/ml-bg.webp';
import festUrl from './assets/ml/ml-festival.webp';
import { makeCarrier } from './carry.js';

const ART = import.meta.glob('./assets/ml/{note,kumquat}.webp', { eager: true, import: 'default' });
const art = (k) => ART[`./assets/ml/${k}.webp`];
import { wallet } from './wallet.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 文字內容（原創） ---------- */
export const ML_QIAN = [
  { no: 1, level: '上上', title: '開口笑', poem: ['大肚能容事', '開口笑呵呵', '天大的煩惱', '笑一笑變小'],
    gist: '事情沒有你想的那麼糟。先笑一個，腦袋就鬆開了。', tip: '今天看一個讓你笑出來的影片或漫畫。' },
  { no: 2, level: '中吉', title: '布袋', poem: ['布袋背身上', '什麼都能裝', '裝了又倒掉', '一身輕飄飄'],
    gist: '別把每件事都背在身上，該放下的就放下。', tip: '清掉手機裡一個讓你煩的群組通知。' },
  { no: 3, level: '上吉', title: '好運', poem: ['金橘掛滿枝', '圓圓又亮亮', '好運滾進門', '擋也擋不住'],
    gist: '好事正在路上，保持開心的心情接住它。', tip: '今天對路上一個人笑一下，或說聲謝謝。' },
  { no: 4, level: '中平', title: '慢慢來', poem: ['彌勒坐得穩', '一點都不急', '飯要一口吃', '路要一步走'],
    gist: '別急著一次做完。拆成小步驟，一步一步來。', tip: '把今天要做的事寫成三件，先做最簡單的那件。' },
  { no: 5, level: '上吉', title: '貴人', poem: ['孩子圍著跳', '彌勒樂陶陶', '身邊好朋友', '就是你的寶'],
    gist: '身邊有人在乎你。有事就開口，大家都願意幫。', tip: '傳訊息給一個好久沒聯絡的朋友。' },
  { no: 6, level: '中吉', title: '寬心', poem: ['人家說閒話', '彌勒聽了笑', '嘴長在他身', '心長在我身'],
    gist: '別人的評價不用全收下。你知道自己是誰就好。', tip: '寫下三件你喜歡自己的地方。' },
  { no: 7, level: '中平', title: '吃飽', poem: ['肚子先吃飽', '心情才會好', '天大的事情', '吃完再來想'],
    gist: '先照顧好身體，好好吃一頓，再來想辦法。', tip: '今天好好吃一頓熱的，不要邊吃邊滑手機。' },
  { no: 8, level: '上上', title: '歡喜', poem: ['今天也很好', '明天會更好', '歡歡又喜喜', '福氣跟著跑'],
    gist: '開心的人福氣多。今天就是好日子。', tip: '睡前想三件今天開心的小事。' },
];
const GREET = [
  '彌勒佛哈哈笑：「來來來，笑一個！」',
  '彌勒佛拍拍肚子：「煩惱裝進來，笑容帶回去。」',
  '彌勒佛眯著眼睛：「別皺眉頭，會老喔，哈哈哈！」',
  '彌勒佛說：「天塌下來，我的肚子先頂著。」',
];
const LAUGH = [
  '彌勒佛被你摸得哈哈大笑：「好癢好癢！好啦，今天的好心情送給你！」',
  '彌勒佛笑到肚子一抖一抖：「笑一笑，十年少！」',
  '彌勒佛笑呵呵：「摸摸肚，煩惱除，回家吃飯不用愁！」',
  '彌勒佛笑彎了眼：「今天也要開開心心的喔！」',
];
const WORRIES = ['工作', '錢', '考試', '人際', '感情', '雜七雜八'];
const NAMES = Array.from({ length: 60 }, (_, i) => { const n = i + 1, d = '一二三四五六七八九'; return n < 10 ? d[n - 1] : `${n >= 20 ? d[Math.floor(n / 10) - 1] : ''}十${n % 10 ? d[n % 10 - 1] : ''}`; }); // 第幾首（籤加量後到 24 首）

/* ---------- 場景 ---------- */
// 參考點（跟月老閣同構圖）：彌勒佛臉 (180,250)、肚子 (180,300)、供桌桌面 y≈385、左邊地上的大布袋開口 (58,440)
const FACE = [180, 250], BELLY = [180, 302];
const NOTE_REST = [296, 612];
const SACK = [60, 446];
// 金橘盆（供桌左邊桌面）：每丟一個煩惱換一顆金橘放進盆裡，滿 12 顆就「滿盆好運」
const BASIN = [112, 386], KQ_FULL = 12;
const kqSlot = (i) => { const rows = [[5, 0], [4, 1], [3, 2]]; let k = i; for (const [n, r] of rows) { if (k < n) return [BASIN[0] + (k - (n - 1) / 2) * 10.5, BASIN[1] - 14 - r * 8]; k -= n; } return BASIN; };

const noteSvg = () => art('note')
  ? `<image href="${art('note')}" x="-22" y="-40" width="44" height="40"/>`
  : `<g transform="translate(0 -18)">
      <path d="M-16 -8 Q-18 -16 -8 -17 Q0 -22 8 -16 Q18 -15 16 -5 Q20 4 12 10 Q4 18 -6 13 Q-17 12 -16 2 Q-21 -3 -16 -8 Z" fill="#FFFDF5" stroke="#B9AE96" stroke-width="1.2"/>
      <path d="M-9 -6 L-2 -2 L4 -9 M-4 4 L5 2 L9 8 M-10 6 L-6 1" stroke="#CFC4AA" stroke-width="1" fill="none"/>
      <path d="M-8 -10 Q0 -6 9 -11" stroke="#7E8AA8" stroke-width="1.1" fill="none" opacity=".6"/>
    </g>`;
const kumquatSvg = () => art('kumquat')
  ? `<image href="${art('kumquat')}" x="-16" y="-16" width="32" height="32"/>`
  : `<circle r="11" fill="url(#mlKq)"/><path d="M0 -11 C3 -16 8 -16 10 -14 C7 -11 3 -10 0 -11 Z" fill="#5DA04A"/>`;

export const ML_SVG = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="歡喜堂" class="ml-svg">
  <defs>
    <radialGradient id="mlHalo"><stop offset="0" stop-color="#FFFBE0" stop-opacity=".95"/><stop offset=".6" stop-color="#FFC24A" stop-opacity=".35"/><stop offset="1" stop-color="#FFC24A" stop-opacity="0"/></radialGradient>
    <radialGradient id="mlKq" cx=".4" cy=".35"><stop offset="0" stop-color="#FFE7A0"/><stop offset=".6" stop-color="#FFA526"/><stop offset="1" stop-color="#E8770E"/></radialGradient>
    <radialGradient id="mlContact"><stop offset="0" stop-color="#3A1A08" stop-opacity=".4"/><stop offset="1" stop-color="#3A1A08" stop-opacity="0"/></radialGradient>
  </defs>
  <circle id="mlHaloC" cx="${FACE[0]}" cy="${FACE[1] + 20}" r="72" fill="url(#mlHalo)" opacity=".18" style="mix-blend-mode:screen"/>
  <!-- 臉：問安；肚子：按住來回摸 -->
  <rect class="hit" data-ml="deity" role="button" tabindex="0" aria-label="向彌勒佛問安" x="140" y="205" width="80" height="62" rx="24" fill="transparent"/>
  <ellipse class="hit ml-belly" data-ml="belly" role="button" tabindex="0" aria-label="彌勒佛的肚子，按住來回摸" cx="${BELLY[0]}" cy="${BELLY[1]}" rx="40" ry="32" fill="transparent"/>
  <ellipse id="mlRub" cx="${BELLY[0]}" cy="${BELLY[1]}" rx="34" ry="26" fill="none" stroke="#FFE08A" stroke-width="2.4" stroke-dasharray="4 4" opacity="0" pointer-events="none"/>
  <g id="mlMeter" opacity="0" pointer-events="none" transform="translate(${BELLY[0]} ${BELLY[1] - 78})">
    <rect x="-44" y="-7" width="88" height="14" rx="7" fill="#FFF6DE" stroke="#E0A040" stroke-width="1.4"/>
    <rect id="mlMeterFill" x="-41" y="-4" width="0" height="8" rx="4" fill="#FF9A2A"/>
    <text y="-12" text-anchor="middle" font-size="10" fill="#8A4A10" font-weight="700">開心度</text>
  </g>
  <ellipse id="mlRing" cx="${SACK[0]}" cy="${SACK[1]}" rx="30" ry="10" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <!-- 金橘盆 -->
  <g id="mlBasin" class="ml-basin" data-ml="basin" role="button" tabindex="0" aria-label="金橘盆">
    <ellipse cx="${BASIN[0]}" cy="${BASIN[1] + 1}" rx="34" ry="5" fill="url(#mlContact)"/>
    <g id="mlKqPile"></g>
    <path d="M${BASIN[0] - 32} ${BASIN[1] - 10} h64 l-6 12 q-26 6 -52 0z" fill="#C2372B" stroke="#7A1A10" stroke-width="1.2"/>
    <path d="M${BASIN[0] - 32} ${BASIN[1] - 10} h64" stroke="#F2C14E" stroke-width="2.4" stroke-linecap="round"/>
    <text x="${BASIN[0]}" y="${BASIN[1] - 1}" text-anchor="middle" font-size="7" fill="#FFE08A" font-weight="700">大吉</text>
  </g>
  <g id="mlKqOut" style="display:none" pointer-events="none">${kumquatSvg()}</g>
  <!-- 煩惱紙團（寫好才出現） -->
  <g id="mlNote" class="ml-prop" data-ml="note" role="button" tabindex="0" aria-label="煩惱紙團，拿起來丟進左邊的大布袋" style="display:none" transform="translate(${NOTE_REST[0]} ${NOTE_REST[1]})">
    <ellipse cx="0" cy="2" rx="18" ry="4" fill="url(#mlContact)"/>
    <rect x="-28" y="-44" width="56" height="48" fill="transparent"/>
    ${noteSvg()}
  </g>
</svg>`;

export function initMile(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam } = api;
  const host = $('#mlHost');
  host.innerHTML = ML_SVG();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const ml = state.ml || (state.ml = { rubDay: '', streak: 0, tossed: 0, qian: null });
  ml.kq = ml.kq || 0; ml.pots = ml.pots || 0;
  function paintPile() {
    S('mlKqPile').innerHTML = Array.from({ length: Math.min(ml.kq, KQ_FULL) }, (_, i) => { const [x, y] = kqSlot(i); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(.36)">${kumquatSvg()}</g>`; }).join('');
    S('mlBasin').setAttribute('aria-label', `金橘盆：${ml.kq} 顆`);
  }
  paintPile();

  const glow = (o = .8, ms = 1600) => { S('mlHaloC').setAttribute('opacity', String(o)); setTimeout(() => S('mlHaloC').setAttribute('opacity', '.18'), ms); };
  function greetGod() { glow(.7, 1400); burst('spark', FACE[0], FACE[1], reduce ? 3 : 10); say(GREET[Math.floor(Math.random() * GREET.length)], 'god'); }

  /* ----- 摸肚子 ----- */
  const NEED = 520;
  let rub = null;
  const meter = (k) => { S('mlMeterFill').setAttribute('width', (82 * Math.min(1, k)).toFixed(1)); };
  function laugh() {
    const t = dayKey(), first = ml.rubDay !== t;
    if (first) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      ml.streak = ml.rubDay === dayKey(y) ? ml.streak + 1 : 1; ml.rubDay = t; save();
    }
    glow(.95, 2400); sfx.chime(); sfx.buzz([20, 40, 20, 40, 20]);
    burst('spark', BELLY[0], BELLY[1], reduce ? 5 : 22);
    for (let i = 0; i < 4; i++) setTimeout(() => emit('heart', FACE[0] + (Math.random() - .5) * 60, FACE[1] - 10), i * 140);
    emit('text', FACE[0], FACE[1] - 60, { text: '哈哈哈！', color: '#E8770E', size: 16, life: 1.4 });
    say(`${LAUGH[Math.floor(Math.random() * LAUGH.length)]}${first ? `<br><small>連續 ${ml.streak} 天逗彌勒佛笑。</small>` : '<br><small>今天已經笑過了，再摸一次他也很開心。</small>'}`, 'god');
  }
  const belly = svg.querySelector('[data-ml="belly"]');
  belly.addEventListener('pointerdown', (e) => {
    e.preventDefault(); belly.setPointerCapture(e.pointerId);
    const p = pt(e); rub = { x: p.x, y: p.y, d: 0, last: 0 };
    S('mlRub').setAttribute('opacity', '.9'); S('mlMeter').setAttribute('opacity', '1'); meter(0);
    cam?.zoom(BELLY[0], BELLY[1] - 10, 200);
  });
  belly.addEventListener('pointermove', (e) => {
    if (!rub) return;
    const p = pt(e); rub.d += Math.hypot(p.x - rub.x, p.y - rub.y); rub.x = p.x; rub.y = p.y;
    meter(rub.d / NEED);
    if (rub.d - rub.last > 34) { // 光點冒在肚子上緣和臉旁邊，不在手指底下
      rub.last = rub.d; sfx.pop?.();
      emit('spark', BELLY[0] + (Math.random() - .5) * 70, BELLY[1] - 36 - Math.random() * 20);
    }
    if (rub.d > NEED) { rubEnd(true); }
  });
  function rubEnd(done = false) {
    if (!rub) return;
    const short = rub.d < 12; rub = null;
    S('mlRub').setAttribute('opacity', '0');
    setTimeout(() => S('mlMeter').setAttribute('opacity', '0'), done ? 900 : 200);
    if (done) { laugh(); cam?.reset(1600); return; }
    cam?.reset(300);
    say(short ? '按住彌勒佛的<b>大肚子</b>，手指來回摸，摸到他笑出來。' : '再多摸幾下，彌勒佛快笑出來了！', 'god');
  }
  belly.addEventListener('pointerup', () => rubEnd());
  belly.addEventListener('pointercancel', () => rubEnd());
  belly.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); laugh(); } });

  /* ----- 丟煩惱 ----- */
  let draft = null;
  const noteEl = S('mlNote');
  const carrier = makeCarrier({
    svg, el: noteEl, sfx, cam, ring: S('mlRing'), lift: 70, radius: 40,
    rest: () => NOTE_REST, target: () => SACK, zoom: () => [SACK[0] + 50, SACK[1], 220],
    onTap: () => say('按住右下角的<b>紙團</b>拿起來，丟進左邊地上的<b>大布袋</b>。', 'god'),
    onDrop() { noteEl.style.display = 'none'; swallow(); },
  });
  function swallow() {
    sfx.knock(); setTimeout(() => sfx.chime(), 350);
    burst('spark', SACK[0], SACK[1] - 6, reduce ? 4 : 14);
    ml.tossed = (ml.tossed || 0) + 1; save();
    // 布袋吐出一顆金橘，彈到供桌前
    const kq = S('mlKqOut'); kq.style.display = '';
    const slot = Math.min(ml.kq, KQ_FULL - 1), from = SACK, to = kqSlot(slot), t0 = performance.now(), ms = reduce ? 200 : 900;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const x = from[0] + (to[0] - from[0]) * k, y = from[1] + (to[1] - from[1]) * k - Math.sin(k * Math.PI) * 70;
      kq.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(k * 360).toFixed(0)}) scale(${(1 - .64 * k).toFixed(2)})`);
      if (k < 1) requestAnimationFrame(step);
      else {
        kq.style.display = 'none';
        ml.kq++; save(); paintPile();
        emit('text', to[0], to[1] - 24, { text: '大吉大利', color: '#E8770E', size: 13, life: 1.4 });
        const full = ml.kq >= KQ_FULL;
        say(`煩惱「${esc(draft.w)}」被彌勒佛的布袋吃掉了，換回一顆<b>金橘</b>放進供桌上的金橘盆，大吉大利！<br><small>已經丟掉 ${ml.tossed} 個煩惱，盆裡有 ${Math.min(ml.kq, KQ_FULL)}／${KQ_FULL} 顆金橘。</small>`, 'god');
        if (full) setTimeout(fullPot, 1600);
        draft = null; cam?.reset(1600);
      }
    };
    requestAnimationFrame(step);
  }
  function fullPot() {
    ml.pots++; save();
    sfx.chime(); setTimeout(() => sfx.chime(), 220); sfx.buzz([20, 60, 20, 60, 40]);
    burst('spark', BASIN[0], BASIN[1] - 20, reduce ? 6 : 30); glow(.9, 2200);
    wallet.earn(30, '金橘滿盆好運', BASIN[0], BASIN[1] - 50);
    emit('text', BASIN[0] + 10, BASIN[1] - 50, { text: '滿盆好運', color: '#FFE08A', size: 18, life: 2, vy: -24 });
    say(`金橘盆滿了！彌勒佛笑得肚子都在抖：「<b>滿盆好運</b>，金橘我替你收好了，好運帶回家！」福氣 +30。<br><small>這是你收成的第 ${ml.pots} 盆。盆子空出來了，可以再慢慢裝。</small>`, 'god');
    setTimeout(() => { ml.kq = 0; save(); paintPile(); }, 2400);
  }
  const tapBasin = () => { sfx.pop(); say(`金橘盆裡有 ${ml.kq}／${KQ_FULL} 顆金橘${ml.pots ? `，已經收成過 ${ml.pots} 盆` : ''}。按「丟煩惱」把煩惱丟進布袋，就會換一顆金橘。`, 'god'); };
  S('mlBasin').addEventListener('click', tapBasin);
  S('mlBasin').addEventListener('keydown', (e) => { if (e.key === 'Enter') tapBasin(); });
  function openToss() {
    const body = openSheet('把煩惱丟進布袋', `
      <p>彌勒佛的布袋什麼都裝得下。把煩惱寫下來，揉成紙團，親手丟進布袋裡。</p>
      <div class="field"><span>煩惱的是</span><div class="chips">${WORRIES.map((w, i) => `<button type="button" class="chip" data-w="${w}" aria-pressed="${!i}">${w}</button>`).join('')}</div></div>
      <input id="mlText" class="yue-wish" maxlength="20" placeholder="也可以寫一句（可以不填）">
      <div class="row"><button class="btn" id="mlGo">揉成紙團</button></div>`);
    let w = WORRIES[0];
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-w]'); if (b) { w = b.dataset.w; body.querySelectorAll('[data-w]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); } });
    body.querySelector('#mlGo').addEventListener('click', () => {
      const t = body.querySelector('#mlText').value.trim();
      draft = { w: t || w }; closeSheet();
      noteEl.style.display = ''; carrier.home();
      noteEl.classList.remove('pop'); void noteEl.getBoundingClientRect(); noteEl.classList.add('pop');
      sfx.pop();
      say('煩惱揉成紙團了，在右下角。按住它拿起來，丟進左邊地上的<b>大布袋</b>。', 'god');
    });
  }

  /* ----- 彌勒籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!ml.qian || ml.qian.date !== t) { ml.qian = { date: t, no: 1 + Math.floor(Math.random() * ML_QIAN.length) }; save(); sfx.rattle(1); }
    const f = ML_QIAN.find((x) => x.no === ml.qian.no);
    openSheet(`彌勒籤第${NAMES[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>彌勒籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日開心小功課</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，笑一笑最重要。</p>`);
  }

  const ACTS = { rub: () => { cam?.zoom(BELLY[0], BELLY[1] - 10, 200); say('按住彌勒佛的<b>大肚子</b>，手指來回摸，摸到他笑出來。', 'god'); setTimeout(() => { if (!rub) cam?.reset(); }, 2600); }, toss: () => (draft ? carrier.auto() : openToss()) };
  svg.addEventListener('click', (e) => { if (e.target.closest('[data-ml="deity"]')) greetGod(); });
  svg.querySelector('[data-ml="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#mlBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-ml]'); if (b) ACTS[b.dataset.ml](); });

  return {
    enter() {
      say(ml.rubDay === dayKey() ? '歡迎回到歡喜堂。彌勒佛今天已經被你逗笑了。有煩惱就按「丟煩惱」，丟進他的大布袋。'
        : '歡迎來到歡喜堂！先點燭、上香，再按住彌勒佛的<b>大肚子</b>來回摸，摸到他哈哈大笑。有煩惱就按「丟煩惱」。', 'god');
    },
    leave() { if (draft) { draft = null; noteEl.style.display = 'none'; } },
    god: '彌勒', qianName: '彌勒籤', qianCount: ML_QIAN.length,
    hasQianToday: () => !!ml.qian && ml.qian.date === dayKey(),
    setQian(no) { ml.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

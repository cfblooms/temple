// 月老閣：求紅線（連三聖筊）、綁紅線、寫愛心木牌、獻喜糖、清醒戀愛籤。
// 場景座標跟正殿一樣是 360 × 645；SVG 裡的 id 都加 y 前綴，避免跟其他殿的 SVG 撞名。
import bgUrl from './assets/yue/yue-bg.webp';
import festUrl from './assets/yue/yue-festival.webp';
import candyUrl from './assets/yue/candy.webp';
import spoolUrl from './assets/yue/spool.webp';
import pouchUrl from './assets/yue/pouch.webp';
import plaqueUrl from './assets/yue/plaque.webp';
import jiaoFlat from './assets/jiao-flat.webp';
import jiaoRound from './assets/jiao-round.webp';
import { tossJiao } from './jiaotoss.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 文字內容（原創） ---------- */
export const LOVE_QIAN = [
  { no: 1, level: '上吉', title: '花開', poem: ['春風不急花自開', '好緣原是慢慢來', '先把自己照顧好', '對的人會走過來'],
    gist: '緣分不用追著跑。把生活過好、讓自己發光，吸引來的人也會比較對頻。', tip: '今天做一件只為自己開心的小事，例如買一束花給自己。' },
  { no: 2, level: '中吉', title: '看清', poem: ['甜言蜜語似糖霜', '日久方知心短長', '不看他說看他做', '真心自有好時光'],
    gist: '喜歡一個人時容易只聽好聽的話。觀察對方怎麼做，比聽他怎麼說更準。', tip: '想一想：對方上一次為你做的實際小事是什麼？' },
  { no: 3, level: '上上', title: '相知', poem: ['兩心相照不設防', '粗茶淡飯也飄香', '吵架也要留一句', '我在這裡別慌張'],
    gist: '好的關係不是不吵架，是吵完還知道彼此在同一邊。', tip: '今天跟重要的人說一句「謝謝你」或「辛苦了」。' },
  { no: 4, level: '中平', title: '放手', poem: ['舊夢如雲留不住', '轉身方見滿天星', '放下不是輸給誰', '是把心門留給明'],
    gist: '有些人是來教你一課的，不是來陪你一輩子的。放下不等於失敗。', tip: '把一張讓你難過的舊照片收進資料夾，先不要每天看。' },
  { no: 5, level: '上吉', title: '開口', poem: ['心事藏久變成霜', '一句真心暖過湯', '勇敢說出不丟臉', '月老替你牽紅繩'],
    gist: '喜歡、在意、委屈，都要說出口。對方不是讀心大師。', tip: '把一件一直想說的話，用溫和的方式說出來，或先寫下來。' },
  { no: 6, level: '中吉', title: '自在', poem: ['一人吃飯也很香', '一人看海也很長', '不是沒人才單身', '是在等個好對象'],
    gist: '單身不是缺陷。享受一個人的時光，也是在為未來的關係打底。', tip: '今天一個人去吃一家想吃很久的店。' },
  { no: 7, level: '中平', title: '界線', poem: ['愛人先要愛自己', '委屈求全不長久', '說清底線不算兇', '好人會懂會停手'],
    gist: '健康的愛有界線。對方真的在乎你，就會尊重你的「不要」。', tip: '想一條你在感情裡絕對不讓步的原則，寫在手機備忘錄。' },
  { no: 8, level: '上上', title: '牽手', poem: ['紅線一頭繫在你', '另一頭在人海裡', '不早不晚剛剛好', '相逢一笑便知己'],
    gist: '時機到了就會遇見。在那之前，好好生活、多出門走走、多認識人。', tip: '答應一個朋友的邀約，去一個沒去過的地方。' },
];

const GREET = [
  '月老笑呵呵地翻著姻緣簿：「別急別急，你的名字我看到了。」',
  '月老摸摸鬍子：「先學會愛自己，紅線才綁得牢。」',
  '月老眨眨眼：「好緣分像慢火燉湯，急不得。」',
  '月老點點頭：「真心待人的人，紅線會自己找上門。」',
];

const NAMES = ['一', '二', '三', '四', '五', '六', '七', '八'];

/* ---------- 場景 ---------- */
// 參考點：月老臉 (180,230)、姻緣簿 (192,262)、供桌桌面 y≈384、拜墊中心 (180,581)
const SLOTS = [[42, 242], [52, 292], [42, 342], [318, 242], [308, 292], [318, 342]];
export const YUE_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="月老閣" class="yue-svg">
  <defs>
    <filter id="yLit" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="1 .04 0 0 .01  .02 .9 0 0 0  .02 .02 .84 0 .01  0 0 0 1 0"/>
    </filter>
    <filter id="yGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="yContact"><stop offset="0" stop-color="#2A0A08" stop-opacity=".55"/><stop offset="1" stop-color="#2A0A08" stop-opacity="0"/></radialGradient>
    <radialGradient id="yHalo"><stop offset="0" stop-color="#FFE6EE" stop-opacity=".95"/><stop offset=".6" stop-color="#FF9DB8" stop-opacity=".35"/><stop offset="1" stop-color="#FF9DB8" stop-opacity="0"/></radialGradient>
  </defs>
  <image id="yBg" href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice" style="display:none"/>
  <circle id="yHaloC" cx="180" cy="245" r="62" fill="url(#yHalo)" opacity=".2" style="mix-blend-mode:screen"/>
  <rect class="hit" data-yue="deity" role="button" tabindex="0" aria-label="向月老問安" x="132" y="200" width="112" height="140" rx="24" fill="transparent"/>

  <!-- 愛心木牌（兩根紅柱上） -->
  <g id="yPlaques">${SLOTS.map(([x, y], i) => `
    <g class="yue-plaque" id="yPlq${i}" data-yue="plaque" data-i="${i}" style="display:none" transform="translate(${x} ${y})">
      <image href="${plaqueUrl}" x="-15" y="-18" width="30" height="36" filter="url(#yLit)"/>
      <text x="0" y="5" text-anchor="middle" font-family="Huninn, sans-serif" font-size="6.5" fill="#6A2A14"></text>
      <text x="0" y="12.5" text-anchor="middle" font-family="Huninn, sans-serif" font-size="6.5" fill="#6A2A14"></text>
    </g>`).join('')}
  </g>

  <!-- 喜糖（供桌右側，獻了才出現） -->
  <image id="yCandy" class="yue-candy" href="${candyUrl}" x="197" y="361" width="48" height="27" style="display:none" filter="url(#yLit)"/>

  <!-- 紅線線軸（拜墊左邊） -->
  <ellipse cx="72" cy="611" rx="26" ry="5" fill="url(#yContact)"/>
  <image id="ySpool" class="yue-spool" data-yue="spool" href="${spoolUrl}" x="46" y="578" width="52" height="35" filter="url(#yLit)"/>

  <!-- 人偶 -->
  <image opacity="0" id="yAvatar" class="yue-avatar" data-yue="avatar" filter="url(#yLit)" x="117" y="452" width="130" height="142" preserveAspectRatio="xMidYMax meet"/>

  <!-- 紅線 -->
  <path id="yThread" d="" fill="none" stroke="#E8262E" stroke-width="2.2" stroke-linecap="round" pointer-events="none"/>
  <path id="yThreadGlow" d="" fill="none" stroke="#FF8FA8" stroke-width="5" stroke-linecap="round" opacity="0" filter="url(#yGlow)" pointer-events="none"/>
  <circle id="yTarget" cx="192" cy="262" r="26" fill="none" stroke="#FFB3C6" stroke-width="2" stroke-dasharray="5 5" opacity="0" pointer-events="none"/>
</svg>`;

export function initYuelao(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc } = api;
  const host = $('#yueHost');
  host.innerHTML = YUE_SVG(bgUrl);
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const yue = state.yue || (state.yue = { thread: null, tieDay: '', plaques: [], candyDay: '', qian: null, askDay: '', askTries: 0 });
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const BOOK = [192, 262];
  let hands = [182, 525];

  /* ----- 月老問安 ----- */
  function greetGod() {
    S('yHaloC').setAttribute('opacity', '.7'); setTimeout(() => S('yHaloC').setAttribute('opacity', '.2'), 1400);
    burst('heart', 180, 240, reduce ? 3 : 8);
    say(GREET[Math.floor(Math.random() * GREET.length)], 'god');
  }

  /* ----- 求紅線：連續三個聖筊 ----- */
  const jiaoPair = (a, b) => `<div class="cai-jiao">${[a, b].map((f) => `<img src="${f === 'flat' ? jiaoFlat : jiaoRound}" alt="${f === 'flat' ? '平面' : '凸面'}" class="${f}">`).join('')}</div>`;
  function openAsk() {
    const t = dayKey();
    if (yue.thread) {
      const body = openSheet('紅線香火袋', `
        <div class="cai-hb"><img src="${pouchUrl}" alt="紅線香火袋"></div>
        <p>你在 ${esc(yue.thread.date.replace(/-/g, '/'))} 向月老求到了紅線，香火袋收在身上。</p>
        <p class="hint">${yue.tieDay === t ? '今天的紅線已經綁好了。' : '還沒綁的話，從你的手（或左下角的線軸）拉一條紅線到月老手上的姻緣簿。'}</p>
        <div class="row"><button class="btn ghost" id="yOk">收好了</button>${yue.tieDay === t ? '' : '<button class="btn" id="yGoTie">去綁紅線</button>'}</div>`);
      body.querySelector('#yOk').addEventListener('click', closeSheet);
      body.querySelector('#yGoTie')?.addEventListener('click', () => { closeSheet(); hintTie(); });
      return;
    }
    if (yue.askDay !== t) { yue.askDay = t; yue.askTries = 0; save(); }
    const body = openSheet('向月老求紅線', `
      <div class="cai-hb"><img src="${pouchUrl}" alt="紅線香火袋"></div>
      <p>先在心裡跟月老稟報：你的名字、生日、住在哪裡，還有你希望遇到什麼樣的人。要<b>連續擲到三個聖筊</b>，月老才會給你紅線。</p>
      <p class="yue-dots" id="yDots" aria-label="聖筊進度"></p>
      <div id="yJiaoOut"></div>
      <div class="row"><button class="btn" id="yThrow">擲筊請示</button></div>
      <p class="hint" id="yTries"></p>`);
    const out = body.querySelector('#yJiaoOut'), btn = body.querySelector('#yThrow'), tries = body.querySelector('#yTries'), dots = body.querySelector('#yDots');
    let run = 0;
    const paint = () => {
      dots.innerHTML = [0, 1, 2].map((i) => `<span class="${i < run ? 'on' : ''}"></span>`).join('');
      tries.textContent = yue.askTries >= 3 ? '今天已經請示三輪了，明天再來吧。月老不會跑掉的。' : `擲到陰筊就要重新來一輪。今天還有 ${3 - yue.askTries} 輪。`;
      btn.disabled = yue.askTries >= 3;
    };
    paint();
    btn.addEventListener('click', async () => {
      if (yue.askTries >= 3 || yue.thread || btn.disabled) return;
      const r = Math.random(), key = r < .55 ? 'sheng' : r < .8 ? 'xiao' : 'yin';
      const faces = key === 'sheng' ? ['flat', 'round'] : key === 'xiao' ? ['flat', 'flat'] : ['round', 'round'];
      if (Math.random() < .5) faces.reverse();
      btn.disabled = true;
      const ok = await tossJiao({ tip: run ? `已經 ${run} 個聖筊了，再跟月老說一次` : '跟月老稟報你的名字、生日、住哪裡，和想遇到的人', faces, key });
      btn.disabled = false;
      if (!ok) return;
      out.innerHTML = jiaoPair(...faces);
      if (key === 'sheng') {
        run++; paint();
        if (run < 3) { sfx.chime(); out.insertAdjacentHTML('beforeend', `<p><b>聖筊！</b>第 ${run} 個了，再擲一次。</p>`); return; }
        yue.thread = { date: dayKey() }; save(); sfx.chime(); sfx.buzz([20, 60, 20]);
        out.insertAdjacentHTML('beforeend', '<p><b>三個聖筊！</b>月老答應了，給你一個紅線香火袋。接下來把紅線綁到月老的姻緣簿上。</p>');
        btn.textContent = '收下，去綁紅線'; btn.className = 'btn gold';
        btn.onclick = () => { closeSheet(); burst('heart', 180, 300, reduce ? 4 : 14); hintTie(); };
        tries.textContent = '';
        return;
      }
      if (key === 'xiao') { out.insertAdjacentHTML('beforeend', '<p><b>笑筊</b>，月老笑而不答。把想要的緣分說得更具體一點，再擲一次（不用重來）。</p>'); return; }
      run = 0; yue.askTries++; save(); paint();
      out.insertAdjacentHTML('beforeend', `<p><b>陰筊</b>，月老覺得還差一點。${yue.askTries < 3 ? '深呼吸，重新稟報一次，再從頭擲。' : ''}</p>`);
    });
  }

  /* ----- 綁紅線：從人偶的手拉到姻緣簿 ----- */
  const thread = S('yThread'), glow = S('yThreadGlow'), target = S('yTarget');
  const curve = (x, y) => { const [hx, hy] = hands, mx = (hx + x) / 2, my = Math.max(hy, y) + 30; return `M${hx} ${hy} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`; };
  let pull = null;
  function hintTie() {
    if (!yue.thread) { say('要先<b>求紅線</b>，連擲三個聖筊，月老才會給你紅線喔。', 'god'); return; }
    if (yue.tieDay === dayKey()) { say('今天的紅線已經綁好了，月老幫你記在姻緣簿上了。'); return; }
    target.setAttribute('opacity', '.9'); setTimeout(() => target.setAttribute('opacity', '0'), 1600);
    say('按住你的手（或左下角的紅線軸），把紅線拉到月老手上的<b>姻緣簿</b>再放開。', 'god');
  }
  const startPull = (e) => {
    if (!yue.thread || yue.tieDay === dayKey()) { hintTie(); return; }
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    pull = { el: e.currentTarget }; target.setAttribute('opacity', '.9');
    const p = pt(e); thread.setAttribute('d', curve(p.x, p.y)); sfx.pop();
  };
  const movePull = (e) => {
    if (!pull) return;
    const p = pt(e); thread.setAttribute('d', curve(p.x, p.y - 40)); // 線頭在手指上方
    if (Math.random() < .25) emit('spark', p.x, p.y - 40);
  };
  const endPull = (e) => {
    if (!pull) return;
    pull = null; target.setAttribute('opacity', '0');
    const p = pt(e);
    if (Math.hypot(p.x - BOOK[0], p.y - 40 - BOOK[1]) < 46) tieDone();
    else { thread.setAttribute('d', ''); say('紅線沒有搭到姻緣簿，再拉一次，拉到月老手上的書再放開。'); }
  };
  for (const id of ['yAvatar', 'ySpool']) {
    const el = S(id);
    el.addEventListener('pointerdown', startPull); el.addEventListener('pointermove', movePull);
    el.addEventListener('pointerup', endPull); el.addEventListener('pointercancel', () => { pull = null; thread.setAttribute('d', ''); target.setAttribute('opacity', '0'); });
  }
  function tieDone() {
    yue.tieDay = dayKey(); save();
    const d = curve(...BOOK); thread.setAttribute('d', d); glow.setAttribute('d', d);
    glow.setAttribute('opacity', '.9'); sfx.chime(); sfx.buzz([15, 50, 15]);
    burst('heart', BOOK[0], BOOK[1], reduce ? 4 : 16);
    S('yHaloC').setAttribute('opacity', '.75');
    emit('text', 180, 200, { text: '紅線綁好了', color: '#FFD0DC', life: 1.8, vy: -24 });
    say('紅線綁好了！月老把你的名字寫進姻緣簿：「不早不晚，剛剛好。」', 'god');
    setTimeout(() => { glow.setAttribute('opacity', '0'); S('yHaloC').setAttribute('opacity', '.2'); }, 1800);
    setTimeout(() => { thread.setAttribute('d', ''); }, 3200);
  }

  /* ----- 愛心木牌 ----- */
  const paintPlaques = () => {
    SLOTS.forEach((_, i) => {
      const g = S('yPlq' + i), p = yue.plaques[i];
      g.style.display = p ? '' : 'none';
      if (!p) return;
      const [a, b] = g.querySelectorAll('text'), s = [...p.text];
      a.textContent = s.slice(0, 4).join(''); b.textContent = s.slice(4, 8).join('') + (s.length > 8 ? '…' : '');
      g.setAttribute('aria-label', '愛心木牌：' + p.text);
    });
  };
  paintPlaques();
  function openPlaque() {
    const full = yue.plaques.length >= SLOTS.length;
    const body = openSheet('寫愛心木牌', `
      <p>寫一句心願，掛到紅柱上。只存在你自己的手機裡，別人看不到。</p>
      <textarea id="yWish" class="yue-wish" maxlength="24" rows="2" placeholder="例如：遇到一個會一起吃宵夜的人"></textarea>
      <p class="hint">${full ? '木牌已經掛滿 6 塊了，新的會換掉最舊的那一塊。' : `已經掛了 ${yue.plaques.length} 塊，最多 6 塊。`}</p>
      <div class="row"><button class="btn" id="yHang">掛上去</button></div>`);
    const ta = body.querySelector('#yWish'), btn = body.querySelector('#yHang');
    setTimeout(() => ta.focus(), 50);
    btn.addEventListener('click', () => {
      const text = ta.value.trim().replace(/\s+/g, ' ');
      if (!text) { ta.focus(); return; }
      if (yue.plaques.length >= SLOTS.length) yue.plaques.shift();
      yue.plaques.push({ text, date: dayKey() }); save(); paintPlaques(); closeSheet();
      const i = yue.plaques.length - 1, [x, y] = SLOTS[i], g = S('yPlq' + i);
      g.classList.remove('pop'); void g.getBoundingClientRect(); g.classList.add('pop');
      sfx.knock(); sfx.chime(); burst('heart', x, y, reduce ? 3 : 10);
      say(`木牌掛好了：「${esc(text)}」。點一下柱子上的木牌，可以再看一次。`, 'god');
    });
  }
  svg.addEventListener('click', (e) => {
    const g = e.target.closest('[data-yue="plaque"]'); if (!g) return;
    const p = yue.plaques[+g.dataset.i]; if (!p) return;
    sfx.knock(); say(`${esc(p.date.replace(/-/g, '/'))} 掛的木牌：「${esc(p.text)}」`);
  });

  /* ----- 獻喜糖 ----- */
  const candy = S('yCandy');
  const paintCandy = () => { candy.style.display = yue.candyDay === dayKey() ? '' : 'none'; };
  paintCandy();
  function offerCandy() {
    if (yue.candyDay === dayKey()) { say('今天的喜糖已經擺在供桌上了，月老正偷偷嘗一顆。'); return; }
    yue.candyDay = dayKey(); save(); paintCandy();
    candy.classList.remove('pop'); void candy.getBoundingClientRect(); candy.classList.add('pop');
    sfx.pop(); setTimeout(() => sfx.chime(), 300);
    burst('heart', 221, 368, reduce ? 3 : 10);
    say('喜糖擺上供桌了。月老笑瞇瞇：「甜甜的，緣分也會甜甜的。等你有好消息，再來請我吃一次。」', 'god');
  }

  /* ----- 清醒戀愛籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!yue.qian || yue.qian.date !== t) { yue.qian = { date: t, no: 1 + Math.floor(Math.random() * LOVE_QIAN.length) }; save(); sfx.rattle(1); }
    const f = LOVE_QIAN.find((x) => x.no === yue.qian.no);
    openSheet(`清醒戀愛籤第${NAMES[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>戀愛籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日戀愛小練習</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，感情的事還是要靠兩個人好好溝通。</p>`);
  }

  const ACTS = { thread: () => (!yue.thread || yue.tieDay === dayKey() ? openAsk() : hintTie()), ask: openAsk, tie: hintTie, plaque: openPlaque, candy: offerCandy, qian: openQian };
  svg.addEventListener('click', (e) => { if (e.target.closest('[data-yue="deity"]')) greetGod(); });
  svg.querySelector('[data-yue="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#yueBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-yue]'); if (b) ACTS[b.dataset.yue](); });

  return {
    enter(char) {
      const el = S('yAvatar'), h = 130 * char.scale, w = 120 * char.scale;
      el.setAttribute('href', char.kneel); el.setAttribute('width', w); el.setAttribute('height', h);
      el.setAttribute('x', 182 - w / 2); el.setAttribute('y', 593 - h);
      hands = [182, 593 - h * 0.52];
      paintCandy(); paintPlaques();
      const t = dayKey();
      say(!yue.thread ? '歡迎來到月老閣！先點燭、上香向月老問好，再按「紅線」求紅線：連擲三個聖筊，月老就會給你紅線。'
        : yue.tieDay !== t ? '歡迎回來。你已經有紅線了，按住你的手，把紅線拉到月老的姻緣簿上綁好。'
        : '又見面了。可以寫一塊愛心木牌、獻一盤喜糖，或抽一支清醒戀愛籤。', 'god');
    },
    setFestive(on) { S('yBg').setAttribute('href', on ? festUrl : bgUrl); },
    god: '月老', qianName: '清醒戀愛籤', qianCount: LOVE_QIAN.length,
    hasQianToday: () => !!yue.qian && yue.qian.date === dayKey(),
    setQian(no) { yue.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

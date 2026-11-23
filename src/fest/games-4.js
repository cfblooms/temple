// 第四批節慶小遊戲：元宵前「乞龜」、七月最後一天「搶孤」
import { art, hasArt, clamp, rand, place } from './core.js';
import { backdrop } from './games-1.js';
import { tossJiao } from '../jiaotoss.js';

const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function flyTo(st, el, from, to, ms, s0 = 1, s1 = 1, done) {
  st.tween(ms, (k, e) => place(el, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(k * Math.PI) * 24, s0 + (s1 - s0) * e), done);
}

/* ================= 乞龜：擲筊向神明借紅龜粿，明年加倍還 ================= */
// 澎湖、台南的元宵習俗：擲到聖筊就能把神桌上的紅龜粿「乞」回家吃平安，隔年元宵前再做一隻加倍的來還願。
// 這裡做成「再擲一次挑戰大一號」：連續聖筊越多借越大隻；太貪心沒擲到聖筊就退一號。
const SIZES = [
  { name: '小紅龜', jin: 1, s: .62 },
  { name: '中紅龜', jin: 3, s: .86 },
  { name: '大紅龜', jin: 6, s: 1.12 },
  { name: '龜王', jin: 12, s: 1.4 },
];
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const jinTxt = (n) => (n <= 10 ? CN[n] : n < 20 ? `十${n > 10 ? CN[n - 10] : ''}` : n < 100 ? `${CN[Math.floor(n / 10)]}十${n % 10 ? CN[n % 10] : ''}` : `${n}`) + '斤';
// 紅龜粿（手繪替代圖，原點在中心；有 tg-gui.webp 就用那張）
const turtleSvg = (w, h) => `<ellipse cy="${h * .36}" rx="${w * .46}" ry="${h * .1}" fill="#6FAE52"/>
  <circle cx="${w * .44}" cy="${-h * .02}" r="${h * .14}" fill="#E0443E"/>
  ${[[-.34, -.26], [.3, -.28], [-.34, .26], [.3, .28]].map(([x, y]) => `<ellipse cx="${w * x}" cy="${h * y}" rx="${w * .09}" ry="${h * .1}" fill="#D23A34"/>`).join('')}
  <ellipse rx="${w * .4}" ry="${h * .34}" fill="#E8483F" stroke="#B02A22" stroke-width="2"/>
  <path d="M${-w * .2} ${-h * .14}h${w * .4}l${w * .08} ${h * .14}l${-w * .08} ${h * .14}h${-w * .4}l${-w * .08} ${-h * .14}z" fill="none" stroke="#B02A22" stroke-width="2"/>
  <path d="M0 ${-h * .34}v${h * .2}M0 ${h * .14}v${h * .2}M${-w * .28} ${-h * .24}l${w * .08} ${h * .1}M${w * .28} ${-h * .24}l${-w * .08} ${h * .1}M${-w * .28} ${h * .24}l${w * .08} ${-h * .1}M${w * .28} ${h * .24}l${-w * .08} ${-h * .1}" stroke="#B02A22" stroke-width="2"/>
  <ellipse cx="${-w * .14}" cy="${-h * .18}" rx="${w * .08}" ry="${h * .05}" fill="#FFF" opacity=".35"/>`;
const turtle = (w, h) => art('tg-gui', w, h, turtleSvg);
// 最大一號（龜王）：有 qg-gui-king.webp 就換成背上有「福」字的龜王
const turtleOf = (lv, w, h) => (lv >= 3 && hasArt('qg-gui-king') ? art('qg-gui-king', w, h * 1.15, '') : turtle(w, h));
const tray = `<ellipse cy="10" rx="70" ry="16" fill="#7A2A18"/><ellipse rx="70" ry="16" fill="#C8462E" stroke="#E8B060" stroke-width="3"/><ellipse rx="56" ry="10" fill="#A8382A"/>`;
const basket = `<path d="M-46 -10 L-38 34 Q0 44 38 34 L46 -10Z" fill="#C89A5A" stroke="#8A6030" stroke-width="2"/>
  ${[-30, -14, 2, 18, 34].map((x) => `<path d="M${x} -8 L${x - 2} 34" stroke="#8A6030" stroke-width="1.4"/>`).join('')}
  <ellipse cy="-10" rx="46" ry="10" fill="#E8C07A" stroke="#8A6030" stroke-width="2"/><path d="M-40 -12 Q0 -70 40 -12" stroke="#8A6030" stroke-width="5" fill="none"/>
  <rect x="-20" y="8" width="40" height="16" rx="3" fill="#E0443E"/><text y="21" text-anchor="middle" class="fest-small" fill="#FFE29A">平安</text>`;

function lunarYearOfToday() { return new Date().getFullYear(); } // 正月十三、十四一定落在國曆 1～3 月

const qigui = {
  play(st, o) {
    const { state, save, real } = o;
    const ALTAR = [180, 300], BASKET = [180, 540];
    const year = lunarYearOfToday();
    const loan = state.qigui && state.qigui.y < year && !state.qigui.back ? state.qigui : null;
    const already = real && state.qigui?.y === year; // 今年已經乞過：可以再玩，但不會改掉借據
    const keep = real && !already;
    let level = 0, streak = 0, busy = false;

    st.set(`${backdrop('qigui', { wall: ['#5A1E18', '#8A3020'], table: 330, tableColor: ['#B8462E', '#7A2A18'], extra: `
      <circle cx="180" cy="120" r="80" fill="#FFE29A" opacity=".18"/>
      <text x="180" y="96" text-anchor="middle" class="fest-sign">乞龜</text>
      <text x="180" y="124" text-anchor="middle" class="fest-small" fill="#FFE29A">擲筊乞平安・明年加倍還</text>
      ${[50, 310].map((x) => `<g transform="translate(${x} 70)"><path d="M0-30v14" stroke="#7A3A1A" stroke-width="2"/><ellipse cy="10" rx="22" ry="26" fill="#E0443E"/><ellipse cy="10" rx="30" ry="34" fill="url(#fGlow)" opacity=".5"/><rect x="-9" y="-18" width="18" height="5" fill="#FFC94A"/><rect x="-9" y="34" width="18" height="5" fill="#FFC94A"/></g>`).join('')}
      <rect x="20" y="330" width="320" height="18" fill="#E8B060" opacity=".5"/>
      <text x="180" y="440" text-anchor="middle" class="fest-tip" id="qgInfo"></text>` })}
      <g id="qgTray" transform="translate(${ALTAR[0]} ${ALTAR[1] + 24})">${tray}</g>
      <g id="qgGui" class="fest-hit" filter="url(#fToy)"><circle r="60" fill="#000" opacity="0"/><g id="qgGuiArt">${turtle(110, 80)}</g></g>
      <g id="qgBasket" transform="translate(${BASKET[0]} ${BASKET[1]})">${art('qg-basket', 110, 100, basket)}</g>
      <g id="qgBack" style="display:none" class="fest-hit" filter="url(#fToy)"><circle r="60" fill="#000" opacity="0"/><g id="qgBackArt">${turtle(110, 80)}</g></g>`);
    const gui = st.$('#qgGui'), info = st.$('#qgInfo');
    let shownLv = 0;
    const showSize = () => { if ((level >= 3) !== (shownLv >= 3)) st.$('#qgGuiArt').innerHTML = turtleOf(level, 110, 80); shownLv = level; place(gui, ...ALTAR, SIZES[level].s); info.textContent = streak ? `連續 ${streak} 個聖筊：${SIZES[level].name}（${jinTxt(SIZES[level].jin)}）` : ''; };
    place(gui, ...ALTAR, SIZES[0].s); gui.style.opacity = '.45';

    if (loan) giveBack(); else intro();

    // 去年借的先還：籃子裡是加倍大的紅龜，拖到神桌上
    function giveBack() {
      const twice = loan.jin * 2, el = st.$('#qgBack'), s = clamp(SIZES[loan.lv].s * 1.3, .8, 1.6);
      let pos = [...BASKET], done = false;
      if (loan.lv >= 3) st.$('#qgBackArt').innerHTML = turtleOf(3, 110, 80);
      gui.style.display = 'none'; el.style.display = '';
      place(el, BASKET[0], BASKET[1] - 20, s);
      st.progress(0, 4);
      st.say(`去年你向神明乞了一隻<b>${SIZES[loan.lv].name}（${jinTxt(loan.jin)}）</b>，今年要<b>加倍還</b>！籃子裡是做好的 ${jinTxt(twice)} 紅龜粿，按住把它端到神桌上。`, 'temple');
      st.hold(el, {
        magnet: () => (done ? null : [ALTAR[0], ALTAR[1], 50]),
        onStart() { if (!done) st.zoom(180, 420, 280); },
        onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y, s * 1.05); },
        onUp() {
          if (done) return;
          if (D(pos, ALTAR) < 40) back(); else flyTo(st, el, pos, [BASKET[0], BASKET[1] - 20], 300, s, s);
        },
      });
      st.buttons([{ label: '幫我端上去', on: back }]);
      function back() {
        if (done) return; done = true; st.reset(); place(el, ...ALTAR, s);
        st.sfx.bowl(); st.burst('star', ...ALTAR, 18); st.progress(1, 4);
        if (real) { state.qigui.back = year; save(); }
        st.say(`還願完成！${jinTxt(twice)}的紅龜擺上神桌，會分給大家吃平安。今年也可以再乞一隻。`, 'temple');
        st.buttons([{ label: '再乞一隻', primary: true, on: () => { el.style.display = 'none'; gui.style.display = ''; intro(true); } }]);
      }
    }

    function intro(again) {
      st.progress(again ? 1 : 0, 4);
      if (already && !again) { st.say(`今年你已經乞過一隻<b>${SIZES[state.qigui.lv].name}</b>了，明年記得還 ${jinTxt(state.qigui.jin * 2)}。這次可以再玩玩看（不會改掉借據）。`, 'temple'); st.buttons([{ label: '再玩一次', primary: true, on: toss }]); return; }
      st.say(`${again ? '' : '元宵前，廟裡把一隻隻<b>紅龜粿</b>擺上神桌（龜代表長壽平安）。'}擲筊問神明能不能借一隻回家：<b>聖筊</b>就能借。擲到聖筊後可以<b>再擲一次挑戰大一號</b>，但沒擲到聖筊會退一號。借回家的，<b>明年要加倍還</b>。`, 'temple');
      st.buttons([{ label: '擲筊乞龜', primary: true, on: toss }]);
    }

    async function toss() {
      if (busy) return; busy = true; st.buttons([]);
      const r = Math.random(), key = r < .5 ? 'sheng' : r < .75 ? 'xiao' : 'yin';
      const faces = key === 'sheng' ? ['flat', 'round'] : key === 'xiao' ? ['flat', 'flat'] : ['round', 'round'];
      if (Math.random() < .5) faces.reverse();
      const next = streak ? SIZES[Math.min(3, level + 1)] : SIZES[0];
      const ok = await tossJiao({ tip: streak ? `跟神明說：想換大一號的${next.name}` : '跟神明稟報名字、住哪裡，想乞一隻紅龜回家吃平安', faces, key });
      busy = false;
      if (!st.alive) return;
      if (!ok) { menu(); return; }
      if (key === 'sheng') {
        if (streak) level = Math.min(3, level + 1);
        streak++; gui.style.opacity = '1';
        st.sfx.chime(); st.burst('star', ...ALTAR, 14);
        st.zoom(180, 320, 260); st.later(700, () => st.reset());
        showSize(); st.progress(Math.min(3, (loan ? 1 : 0) + 1 + level), 4);
        if (level >= 3) { st.say(`<b>聖筊！</b>神明把<b>龜王（${jinTxt(SIZES[3].jin)}）</b>借給你了，真的很有福氣！`, 'temple'); take(); return; }
        st.say(`<b>聖筊！</b>可以借<b>${SIZES[level].name}（${jinTxt(SIZES[level].jin)}）</b>。要就借這隻，還是再擲一次換<b>${SIZES[level + 1].name}</b>？`, 'temple');
      } else if (streak) {
        const was = level; level = Math.max(0, level - 1); streak = 0; st.sfx.knock();
        showSize(); info.textContent = `${was ? '退一號：' : ''}${SIZES[level].name}（${jinTxt(SIZES[level].jin)}）`;
        st.say(`${key === 'xiao' ? '笑筊' : '陰筊'}，神明笑你太貪心囉～${was ? `退一號，借<b>${SIZES[level].name}</b>就好` : `不過<b>小紅龜</b>還是借你`}。`, 'temple');
        take(); return;
      } else {
        st.sfx.knock();
        st.say(`${key === 'xiao' ? '<b>笑筊</b>，神明在笑，可能沒說清楚' : '<b>陰筊</b>，神明說再想想'}。把名字和心願再說一次，重新擲。`, 'temple');
      }
      menu();
    }
    function menu() {
      if (!streak) { st.buttons([{ label: '擲筊乞龜', primary: true, on: toss }]); return; }
      st.buttons([{ label: `就借${SIZES[level].name}`, primary: true, on: take }, { label: `再擲換${SIZES[level + 1].name}`, on: toss }]);
    }

    // 按住紅龜端到籃子裡帶回家
    function take() {
      const sz = SIZES[level]; let pos = [...ALTAR], done = false;
      gui.style.opacity = '1'; showSize();
      st.buttons([{ label: '幫我放進籃子', on: () => put() }]);
      st.say(`按住<b>${sz.name}</b>，把它端到下面的竹籃裡帶回家。`, 'temple');
      st.zoom(180, 430, 300);
      st.hold(gui, {
        magnet: () => (done ? null : [BASKET[0], BASKET[1] - 24, 50]),
        onMove(x, y) { if (done) return; pos = [x, y]; place(gui, x, y, sz.s * 1.05); },
        onUp() { if (done) return; if (D(pos, [BASKET[0], BASKET[1] - 24]) < 44) put(); else flyTo(st, gui, pos, ALTAR, 300, sz.s, sz.s); },
      });
      function put() {
        if (done) return; done = true; st.buttons([]);
        place(gui, BASKET[0], BASKET[1] - 24, sz.s * .8); st.reset();
        st.sfx.pop(); st.burst('star', BASKET[0], BASKET[1] - 30, 16); st.progress(4, 4);
        if (keep) { state.qigui = { y: year, lv: level, jin: sz.jin }; save(); }
        const twice = jinTxt(sz.jin * 2);
        st.later(900, () => o.done(`乞到<b>${sz.name}（${jinTxt(sz.jin)}）</b>！帶回家和家人分著吃，吃了平安又長壽。<br>記得<b>明年元宵前</b>回來，做一隻<b>${twice}</b>的紅龜還給神明。`));
      }
    }
  },
};

/* ================= 搶孤：爬孤柱、上孤棧、搶順風旗（節奏遊戲） ================= */
// 頭城搶孤在農曆七月最後一天、關鬼門前：先爬抹了牛油的孤柱上孤棚，再爬上插滿供品的孤棧，搶到最頂端的順風旗。
// 圓圈縮到手的位置時點一下：抓準了往上爬，沒抓到牛油太滑會滑下來一點。隔壁隊也在爬。
const POLE_STEPS = 12, STACK_STEPS = 8, TOTAL = POLE_STEPS + STACK_STEPS;
const STEP_H = 46, BASE_Y = 560, PLAT = BASE_Y - POLE_STEPS * STEP_H; // 孤棚檯面高度
const climber = (c) => `<g><ellipse cx="0" cy="30" rx="10" ry="4" fill="#000" opacity="0"/>
  <path d="M-8 6 L-12 30M8 6 L12 30" stroke="#2A2A3A" stroke-width="7" stroke-linecap="round"/>
  <rect x="-11" y="-14" width="22" height="24" rx="8" fill="${c}"/>
  <path d="M-10 -10 L-16 -34M10 -10 L16 -34" stroke="#E8B48A" stroke-width="6" stroke-linecap="round"/>
  <circle cy="-24" r="11" fill="#E8B48A"/><path d="M-11 -28 Q0 -40 11 -28" fill="#2A1A12"/><rect x="-12" y="-30" width="24" height="5" rx="2" fill="#E0443E"/></g>`;
const flagSvg = `<rect x="-2" y="-40" width="4" height="64" fill="#8A6030"/><path d="M2 -40 L44 -30 L2 -18Z" fill="#E0443E"/><text x="16" y="-26" class="fest-small" fill="#FFE29A" style="font-size:9px">順風</text>`;

const qianggu = {
  play(st, o) {
    const ME = 130, RIVAL = 236; // 兩根孤柱的 x
    const worldH = BASE_Y + 80 - (PLAT - STACK_STEPS * 40 - 120);
    let my = 0, rv = 0, beatAt = 0, beatMs = 900, run = 0, tapped = true, over = false, combo = 0, started = false;
    const TOP = PLAT - STACK_STEPS * 40 - 30; // 旗子
    const yOf = (n) => (n <= POLE_STEPS ? BASE_Y - n * STEP_H : PLAT - (n - POLE_STEPS) * 40);
    // 孤棧：竹架堆供品的尖塔
    const stack = (x) => `<path d="M${x - 34} ${PLAT} L${x - 6} ${TOP + 26} L${x + 6} ${TOP + 26} L${x + 34} ${PLAT}Z" fill="#C8A060" stroke="#8A6030" stroke-width="2"/>
      ${Array.from({ length: 7 }, (_, i) => { const y = PLAT - 20 - i * 46, w = 30 - i * 3.6; return `<rect x="${x - w}" y="${y - 10}" width="${w * 2}" height="14" rx="5" fill="${['#E0443E', '#F3C64A', '#7BB35A', '#F09A2A'][i % 4]}"/>`; }).join('')}`;
    st.set(`<g id="qgWorld">
      <defs><linearGradient id="qgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1230"/><stop offset=".7" stop-color="#3A2050"/><stop offset="1" stop-color="#6A3040"/></linearGradient>
      <linearGradient id="qgPole" x1="0" x2="1"><stop offset="0" stop-color="#7A4A22"/><stop offset=".45" stop-color="#E8C890"/><stop offset="1" stop-color="#6A3A18"/></linearGradient></defs>
      <rect x="0" y="${PLAT - STACK_STEPS * 40 - 400}" width="360" height="${worldH + 800}" fill="url(#qgSky)"/>
      ${Array.from({ length: 40 }, () => `<circle cx="${rand(0, 360)}" cy="${rand(TOP - 300, BASE_Y)}" r="${rand(.6, 1.5)}" fill="#FFF8D8" opacity="${rand(.3, .8)}"/>`).join('')}
      <circle cx="300" cy="${TOP - 60}" r="26" fill="#FFF2C0" opacity=".9"/>
      ${hasArt('qgu-pole') ? `<g transform="translate(180 ${(PLAT + BASE_Y) / 2 + 20})">${art('qgu-pole', 300, BASE_Y - PLAT + 80, '')}</g>` : `
      ${[ME, RIVAL].map((x) => `<rect x="${x - 9}" y="${PLAT}" width="18" height="${BASE_Y - PLAT + 40}" fill="url(#qgPole)"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${x - 8} ${PLAT + 40 + i * 80} q4 14 0 26" stroke="#FFF6D8" stroke-width="2" opacity=".6" fill="none"/>`).join('')}`).join('')}
      <rect x="60" y="${PLAT - 6}" width="240" height="16" fill="#8A3020"/><rect x="60" y="${PLAT - 10}" width="240" height="6" fill="#E8B060"/>
      ${[80, 280].map((x) => `<rect x="${x - 5}" y="${PLAT + 10}" width="10" height="${BASE_Y - PLAT + 30}" fill="#5A3018" opacity=".7"/>`).join('')}`}
      ${stack(ME)}${stack(RIVAL)}
      <g id="qgFlagMe" transform="translate(${ME} ${TOP})">${art('qgu-flag', 50, 70, flagSvg)}</g>
      <g id="qgFlagRv" transform="translate(${RIVAL} ${TOP})">${art('qgu-flag', 50, 70, flagSvg)}</g>
      <rect x="0" y="${BASE_Y + 30}" width="360" height="400" fill="#3A2418"/>
      ${Array.from({ length: 14 }, (_, i) => `<circle cx="${12 + i * 26}" cy="${BASE_Y + 50 + (i % 2) * 8}" r="12" fill="#1E120C"/>`).join('')}
      <g id="qgRv">${art('qgu-rival', 40, 70, climber('#3A6AB8'))}</g>
      <g id="qgMe">${art('qgu-climber', 40, 70, climber('#E0443E'))}</g>
      <g id="qgRing" pointer-events="none"><circle r="20" fill="none" stroke="#FFE29A" stroke-width="4"/></g>
      <g id="qgTarget" pointer-events="none"><circle r="20" fill="none" stroke="#FFF" stroke-width="2" stroke-dasharray="4 4" opacity=".8"/></g>
    </g>
    <text id="qgJudge" x="180" y="250" text-anchor="middle" class="fest-sign" style="font-size:26px" opacity="0"></text>`);
    const W = st.$('#qgWorld'), meEl = st.$('#qgMe'), rvEl = st.$('#qgRv'), ring = st.$('#qgRing'), target = st.$('#qgTarget'), judge = st.$('#qgJudge');
    let camY = 0;
    const draw = () => {
      // 世界往下捲，讓自己的爬手維持在畫面 y≈380
      const want = clamp(380 - yOf(my), 0, 380 - TOP + 40);
      camY += (want - camY) * .18;
      W.setAttribute('transform', `translate(0 ${camY.toFixed(1)})`);
      place(meEl, ME, yOf(my));
      place(rvEl, RIVAL, yOf(rv));
      place(target, ME, yOf(my) - 34); // 手抓的位置
    };
    draw(); st.progress(0, 4);
    st.zoom(180, 400, 300, 0);
    st.say('七月最後一天、關鬼門前搶孤！孤柱抹滿了牛油很滑。<b>黃色圓圈縮到手上的虛線圈時點一下畫面</b>（或按「抓！」），抓得準就往上爬，沒抓到會滑下來。先爬上孤棚，再爬孤棧搶<b>順風旗</b>。', 'temple');
    st.buttons([{ label: '開始爬', primary: true, on: begin }]);

    function judgeText(t, c) { judge.textContent = t; judge.style.fill = c; judge.setAttribute('opacity', '1'); st.tween(600, (k) => judge.setAttribute('opacity', (1 - k).toFixed(2))); }
    function begin() {
      if (started) return; started = true;
      st.buttons([{ label: '抓！', primary: true, on: hit }]);
      st.touch({ down: () => hit() });
      nextBeat();
      requestAnimationFrame(loop);
    }
    function nextBeat() {
      // 越爬越快
      beatMs = my < POLE_STEPS ? 860 - my * 14 : 700 - (my - POLE_STEPS) * 12;
      beatAt = performance.now() + beatMs; tapped = false; run++;
    }
    let lastT = 0;
    function loop(t) {
      if (!st.alive || over) return;
      const dt = lastT ? Math.min(.05, (t - lastT) / 1000) : 0; lastT = t;
      const left = beatAt - t;
      const k = clamp(left / beatMs, 0, 1);
      ring.setAttribute('transform', `translate(${ME} ${yOf(my) - 34}) scale(${(1 + k * 1.6).toFixed(3)})`);
      ring.setAttribute('opacity', (1 - k * .6).toFixed(2));
      if (left < -220) { if (!tapped) miss('太慢了'); nextBeat(); }
      // 隔壁隊每拍大約爬 0.75 格
      rv = Math.min(TOTAL, rv + dt * 0.75 / (beatMs / 1000));
      draw();
      if (rv >= TOTAL && !over) end(false);
      requestAnimationFrame(loop);
    }
    function hit() {
      if (!started || over || tapped) return;
      const err = Math.abs(performance.now() - beatAt);
      tapped = true;
      if (err < 110) { climb(2); combo++; judgeText(combo >= 3 ? `完美！連 ${combo}` : '完美！', '#FFE29A'); st.sfx.pop(); st.sfx.buzz?.(12); }
      else if (err < 230) { climb(1); combo = 0; judgeText('好', '#FFF4D8'); st.sfx.knock(); }
      else miss('太早了');
      nextBeat();
    }
    function climb(n) {
      const was = my; my = Math.min(TOTAL, my + n);
      st.burst('spark', ME, yOf(my) - 30, 5);
      if (was < POLE_STEPS && my >= POLE_STEPS) { st.say('爬上<b>孤棚</b>了！接著爬孤棧，越上面越快喔。', 'temple'); st.sfx.chime(); }
      st.progress(my >= TOTAL ? 4 : my >= POLE_STEPS + 4 ? 3 : my >= POLE_STEPS ? 2 : my >= 4 ? 1 : 0, 4);
      if (my >= TOTAL) end(true);
    }
    function miss(why) {
      combo = 0; tapped = true;
      const floor = my >= POLE_STEPS ? POLE_STEPS : 0; // 上了孤棚就不會再滑下柱子
      const slip = my > floor ? 1 : 0;
      my = Math.max(floor, my - slip);
      judgeText(slip ? `${why}・滑下來了` : why, '#B8D8FF');
      if (slip) st.burst('steam', ME, yOf(my) - 10, 4, { color: '#FFF', vy: 40 });
      st.sfx.buzz?.([30]);
    }
    function end(win) {
      over = true; st.buttons([]); ring.style.display = 'none'; target.style.display = 'none';
      const fl = st.$(win ? '#qgFlagMe' : '#qgFlagRv');
      const x = win ? ME : RIVAL;
      st.tween(700, (k, e) => place(fl, x + e * (win ? -20 : 20), TOP - e * 30, 1 + e * .4, -e * 20));
      const fire = (n) => { if (n <= 0 || !st.alive) return; st.burst('star', rand(40, 320), rand(120, 300), 12, { color: ['#FFE29A', '#F2627A', '#8AD0FF'][n % 3] }); st.sfx.pop(); st.later(180, () => fire(n - 1)); };
      fire(win ? 14 : 5);
      st.later(1500, () => o.done(win
        ? '搶到<b>順風旗</b>了！傳說搶到的人整年平安，把旗子插在漁船上就會一路順風、滿載而歸。搶孤也是讓好兄弟吃飽、送他們回去的最後一場熱鬧，今晚就關鬼門了。'
        : '隔壁隊先搶到順風旗了，不過你也爬上了孤棧，大家一起熱熱鬧鬧送好兄弟回去。明年再來挑戰！'));
    }
  },
};

export const GAMES = { qigui, qianggu };

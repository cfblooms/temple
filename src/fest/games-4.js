// 第四批節慶小遊戲：元宵前「乞龜」、七月最後一天「搶孤」
import { art, hasArt, clamp, rand, pick, place } from './core.js';
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
  { name: '小紅龜', jin: 1, s: .9 },
  { name: '中紅龜', jin: 3, s: 1.2 },
  { name: '大紅龜', jin: 6, s: 1.55 },
  { name: '龜王', jin: 12, s: 2 },
];
const WISH = ['平安', '健康', '學業', '事業', '姻緣', '財運'];
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

// 龜山：廟裡兩旁地上一層層疊起來的紅龜粿（裝飾，看起來很多很熱鬧）
function guiShan() {
  const pile = (cx, flip) => { let h = ''; [[3, 606], [2, 576], [1, 548]].forEach(([n, y], r) => { for (let i = 0; i < n; i++) { const x = cx + (i - (n - 1) / 2) * 44; h += `<g transform="translate(${x} ${y}) scale(${flip}.42 .42)">${turtle(110, 80)}</g>`; } }); return h; };
  return `<g pointer-events="none">${pile(58, '')}${pile(302, '-')}</g>`;
}
function lunarYearOfToday() { return new Date().getFullYear(); } // 正月十三、十四一定落在國曆 1～3 月

const qigui = {
  play(st, o) {
    const { state, save, real } = o;
    const ALTAR = [180, 300], BASKET = [180, 540];
    const year = lunarYearOfToday();
    const loan = state.qigui && state.qigui.y < year && !state.qigui.back ? state.qigui : null;
    const already = real && state.qigui?.y === year; // 今年已經乞過：可以再玩，但不會改掉借據
    const keep = real && !already;
    let level = 0, streak = 0, busy = false, wish = '';

    st.set(`${backdrop('qigui', { wall: ['#5A1E18', '#8A3020'], table: 330, tableColor: ['#B8462E', '#7A2A18'], extra: `
      <circle cx="180" cy="120" r="80" fill="#FFE29A" opacity=".18"/>
      <text x="180" y="96" text-anchor="middle" class="fest-sign">乞龜</text>
      <text x="180" y="124" text-anchor="middle" class="fest-small" fill="#FFE29A">擲筊乞平安・明年加倍還</text>
      ${[50, 310].map((x) => `<g transform="translate(${x} 70)"><path d="M0-30v14" stroke="#7A3A1A" stroke-width="2"/><ellipse cy="10" rx="22" ry="26" fill="#E0443E"/><ellipse cy="10" rx="30" ry="34" fill="url(#fGlow)" opacity=".5"/><rect x="-9" y="-18" width="18" height="5" fill="#FFC94A"/><rect x="-9" y="34" width="18" height="5" fill="#FFC94A"/></g>`).join('')}
      <rect x="20" y="330" width="320" height="18" fill="#E8B060" opacity=".5"/>
` , over: `<text x="180" y="452" text-anchor="middle" class="fest-tip" id="qgInfo"></text>` })}
      ${guiShan()}
      <g id="qgTray" transform="translate(${ALTAR[0]} ${ALTAR[1] + 24}) scale(1.3)">${tray}</g>
      <g id="qgNext" opacity="0" pointer-events="none"><g opacity=".35">${turtle(110, 80)}</g><ellipse rx="52" ry="40" fill="none" stroke="#FFE29A" stroke-width="2.5" stroke-dasharray="6 5"/><text id="qgNextTxt" y="-48" text-anchor="middle" class="fest-small" fill="#FFE29A"></text></g>
      <g id="qgGui" class="fest-hit" filter="url(#fToy)"><circle r="60" fill="#000" opacity="0"/><g id="qgGuiArt">${turtle(110, 80)}</g></g>
      <g id="qgBasket" transform="translate(${BASKET[0]} ${BASKET[1]})">${art('qg-basket', 110, 100, basket)}</g>
      <g id="qgBack" style="display:none" class="fest-hit" filter="url(#fToy)"><circle r="60" fill="#000" opacity="0"/><g id="qgBackArt">${turtle(110, 80)}</g></g>
      <clipPath id="qgBF"><path d="M-60 -9 Q0 19 60 -9 L60 70 L-60 70Z"/></clipPath>
      <g id="qgBasketFront" pointer-events="none" style="display:none" transform="translate(${BASKET[0]} ${BASKET[1]})"><g clip-path="url(#qgBF)">${art('qg-basket', 110, 100, basket)}</g></g>`);
    const gui = st.$('#qgGui'), info = st.$('#qgInfo');
    let shownLv = 0;
    const nextEl = st.$('#qgNext');
    const showSize = () => {
      if ((level >= 3) !== (shownLv >= 3)) st.$('#qgGuiArt').innerHTML = turtleOf(level, 110, 80);
      shownLv = level; place(gui, ...ALTAR, SIZES[level].s);
      info.textContent = streak ? `連續 ${streak} 個聖筊：${SIZES[level].name}（${jinTxt(SIZES[level].jin)}）` : '';
      // 下一號的虛線輪廓：看得到再擲一次能換多大隻
      const nx = streak && level < 3 ? SIZES[level + 1] : null;
      nextEl.setAttribute('opacity', nx ? '1' : '0');
      if (nx) { place(nextEl, ALTAR[0], ALTAR[1] - 6, nx.s); st.$('#qgNextTxt').textContent = `${nx.name}・${jinTxt(nx.jin)}`; }
    };
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
      if (!wish) { pickWish(); return; }
      st.buttons([{ label: '擲筊乞龜', primary: true, on: toss }]);
    }
    // 先跟神明說想求什麼（紅紙條會貼在托盤上）
    function pickWish() {
      st.buttons(WISH.map((w) => ({ label: `求${w}`, on: () => {
        wish = w; st.sfx.pop();
        st.add(`<g transform="translate(${ALTAR[0]} ${ALTAR[1] + 52})" pointer-events="none"><rect x="-34" y="-12" width="68" height="24" rx="3" fill="#E0443E" stroke="#F3C64A" stroke-width="1.5"/><text y="6" text-anchor="middle" class="fest-small" fill="#FFE29A">求${w}</text></g>`);
        st.say(`跟神明說：想乞一隻紅龜回家，<b>求${w}</b>。現在擲筊，聖筊就能借。`, 'temple');
        st.buttons([{ label: '擲筊乞龜', primary: true, on: toss }]);
      } })));
    }

    async function toss() {
      if (busy) return; busy = true; st.buttons([]);
      const r = Math.random(), key = r < .5 ? 'sheng' : r < .75 ? 'xiao' : 'yin';
      const faces = key === 'sheng' ? ['flat', 'round'] : key === 'xiao' ? ['flat', 'flat'] : ['round', 'round'];
      if (Math.random() < .5) faces.reverse();
      const next = streak ? SIZES[Math.min(3, level + 1)] : SIZES[0];
      const ok = await tossJiao({ tip: streak ? `跟神明說：想換大一號的${next.name}` : `跟神明稟報名字、住哪裡，想乞一隻紅龜回家求${wish || '平安'}`, faces, key });
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
      const bs = clamp(sz.s * 1.3, 1, 2.2), BIN = [BASKET[0], BASKET[1] - 15 * bs]; // 籃子跟著紅龜的大小換大一點的
      st.tween(300, (k, e) => place(st.$('#qgBasket'), ...BASKET, 1 + (bs - 1) * e));
      st.buttons([{ label: '幫我放進籃子', on: () => put() }]);
      st.say(`按住<b>${sz.name}</b>，把它端到下面的竹籃裡帶回家。`, 'temple');
      st.zoom(180, 430, 300);
      st.hold(gui, {
        magnet: () => (done ? null : [...BIN, 50 + 10 * bs]),
        onMove(x, y) { if (done) return; pos = [x, y]; place(gui, x, y, sz.s * 1.05); },
        onUp() { if (done) return; if (D(pos, BIN) < 44 + 10 * bs) put(); else flyTo(st, gui, pos, ALTAR, 300, sz.s, sz.s); },
      });
      function put() {
        if (done) return; done = true; st.buttons([]);
        // 紅龜「放進」籃子：籃子跟著紅龜變大，籃子前緣（qgBasketFront）蓋在紅龜前面，看起來是裝在裡面
        const bf = st.$('#qgBasketFront');
        place(st.$('#qgBasket'), ...BASKET, bs); place(bf, ...BASKET, bs); bf.style.display = '';
        flyTo(st, gui, pos, BIN, 220, sz.s, sz.s * .82); st.reset();
        st.sfx.pop(); st.burst('star', BASKET[0], BASKET[1] - 30, 16); st.progress(4, 4);
        if (keep) { state.qigui = { y: year, lv: level, jin: sz.jin }; save(); }
        const twice = jinTxt(sz.jin * 2);
        st.say(`乞到<b>${sz.name}（${jinTxt(sz.jin)}）</b>！帶回家跟家人分著吃。`, 'temple');
        st.later(1100, () => share(level, () => o.done(`${sz.name}分完了，一家人吃了平安又長壽${wish ? `，也求到${wish}` : ''}。<br>記得<b>明年元宵前</b>回來，做一隻<b>${twice}</b>的紅龜還給神明。`)));
      }
    }
    // 回家分紅龜：在紅龜上劃過去切開，一塊一塊分給家人（大隻切比較多塊）
    function share(lv, fin) {
      const CUTS = [1, 2, 3, 4][lv], C = [180, 380], S = 2.2;
      const fam = ['agong', 'ama', 'dad', 'mom', 'kid', 'senior'].filter((id) => id !== o.me?.id).slice(0, CUTS + 1).map((id) => o.chars?.byId?.(id)).filter(Boolean);
      const seats = fam.map((_, i) => { const a = Math.PI * (1.15 + i * .7 / Math.max(1, fam.length - 1)); return [180 + Math.cos(a) * 150 + 0, 210 + Math.sin(a) * 40 + (i % 2) * 18]; });
      st.reset(0); st.buttons([]);
      st.set(`${backdrop('chunjie-home', { wall: ['#F4E2C4', '#E8C89C'], table: 330 })}
        <ellipse cx="${C[0]}" cy="${C[1] + 70}" rx="150" ry="34" fill="#000" opacity=".12"/>
        <g transform="translate(${C[0]} ${C[1] + 40}) scale(1.9)">${tray}</g>
        <clipPath id="qgCut"><ellipse cx="${C[0]}" cy="${C[1]}" rx="${44 * S}" ry="${27 * S}"/></clipPath>
        <g id="qgHome" transform="translate(${C[0]} ${C[1]}) scale(${S})">${turtleOf(lv, 110, 80)}</g>
        <g id="qgLines" clip-path="url(#qgCut)"></g>
        ${fam.map((c, i) => `<g id="fam${i}" transform="translate(${seats[i][0].toFixed(1)} ${seats[i][1].toFixed(1)})"><circle r="27" fill="#FFF4E0" stroke="#E0443E" stroke-width="2"/><clipPath id="fc${i}"><circle r="25"/></clipPath><image href="${c.face}" x="-25" y="-25" width="50" height="50" clip-path="url(#fc${i})" preserveAspectRatio="xMidYMid slice"/><text y="42" text-anchor="middle" class="fest-small" fill="#7A2A18">${c.name}</text></g>`).join('')}
        <text x="180" y="560" text-anchor="middle" class="fest-tip" id="cutTip">手指在紅龜上劃過去，切 ${CUTS} 刀</text>`);
      st.say(`回到家，大家都在等！手指在紅龜上<b>劃過去切開</b>，切 ${CUTS} 刀，分給 ${fam.length} 個家人。`, 'temple');
      let cuts = 0, a = null, doneCut = false;
      const lines = st.$('#qgLines');
      const cut = (p0, p1) => {
        cuts++; st.sfx.knock?.(); st.sfx.buzz?.(15);
        lines.insertAdjacentHTML('beforeend', `<path d="M${p0.x.toFixed(1)} ${p0.y.toFixed(1)}L${p1.x.toFixed(1)} ${p1.y.toFixed(1)}" stroke="#7A1E18" stroke-width="3" stroke-linecap="round"/><path d="M${(p0.x + 2).toFixed(1)} ${(p0.y + 2).toFixed(1)}L${(p1.x + 2).toFixed(1)} ${(p1.y + 2).toFixed(1)}" stroke="#FFE0D0" stroke-width="1.5" opacity=".7"/>`);
        st.burst('spark', (p0.x + p1.x) / 2, (p0.y + p1.y) / 2, 8, { color: '#FFF4D8' });
        st.$('#cutTip').textContent = cuts < CUTS ? `還要切 ${CUTS - cuts} 刀` : '';
        if (cuts >= CUTS) serve();
      };
      st.touch({
        down(p) { if (!doneCut) a = p; },
        up(p) {
          if (doneCut || !a) return;
          const len = Math.hypot(p.x - a.x, p.y - a.y), mx = (p.x + a.x) / 2, my = (p.y + a.y) / 2;
          if (len > 70 && Math.abs(mx - C[0]) < 110 && Math.abs(my - C[1]) < 80) cut(a, p);
          a = null;
        },
      });
      st.buttons([{ label: '幫我切', on: () => { while (!doneCut) cut({ x: 90 + cuts * 50, y: C[1] - 70 }, { x: 110 + cuts * 50, y: C[1] + 70 }); } }]);
      function serve() {
        if (doneCut) return; doneCut = true; st.buttons([]); st.sfx.chime();
        fam.forEach((c, i) => st.later(350 + i * 380, () => {
          const pc = st.add(`<g pointer-events="none"><path d="M-14 -8 L14 -10 L12 10 L-12 8Z" fill="#E8483F" stroke="#B02A22" stroke-width="1.5"/><path d="M-10 -2h20" stroke="#B02A22"/></g>`);
          st.tween(500, (k, e) => place(pc, C[0] + (seats[i][0] - C[0]) * e, C[1] + (seats[i][1] - C[1]) * e - Math.sin(k * Math.PI) * 50, 1 - e * .4), () => {
            pc.remove(); st.burst('heart', seats[i][0], seats[i][1] - 10, 6); st.sfx.pop();
            st.floatText(pick(['好Q！', '甜甜的', '吃平安', '長命百歲', '讚啦']), seats[i][0], seats[i][1] - 40, '#C8382E');
          });
        }));
        st.later(500 + fam.length * 380 + 900, fin);
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

// 爬柱的姿勢：有 Gemini 的兩張爬姿（左手在上 -a、右手在上 -b）就輪流換；
// 沒有的話用原本那張圖，左右翻面＋伸長縮短，看起來像兩手交替往上拉。
const poseA = (key, c) => (hasArt(key + '-a') ? art(key + '-a', 56, 100, '') : art(key, 40, 96, climber(c)));
const poseB = (key, c) => (hasArt(key + '-b') ? art(key + '-b', 56, 100, '') : `<g transform="scale(-1 1)">${art(key, 40, 96, climber(c))}</g>`);
// 爬的動畫狀態：reach 0→1 伸手、1→0 拉上去；alt 換手
function climbAnim() { return { t: 1, alt: 0, slip: 0, from: 0, to: 0 }; }
const qianggu = {
  play(st, o) {
    const ME = hasArt('qgu-pole') ? 120 : 130, RIVAL = hasArt('qgu-pole') ? 239 : 236; // 兩根孤柱的 x（對齊孤柱圖裡的柱子）
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
      <g id="qgRv"><g class="pa">${poseA('qgu-rival', '#3A6AB8')}</g><g class="pb" style="display:none">${poseB('qgu-rival', '#3A6AB8')}</g></g>
      <g id="qgMe"><g class="pa">${poseA('qgu-climber', '#E0443E')}</g><g class="pb" style="display:none">${poseB('qgu-climber', '#E0443E')}</g></g>
      <g id="qgRing" pointer-events="none"><circle r="20" fill="none" stroke="#FFE29A" stroke-width="4"/></g>
      <g id="qgTarget" pointer-events="none"><circle r="20" fill="none" stroke="#FFF" stroke-width="2" stroke-dasharray="4 4" opacity=".8"/></g>
    </g>
    <text id="qgJudge" x="180" y="250" text-anchor="middle" class="fest-sign" style="font-size:26px" opacity="0"></text>`);
    const W = st.$('#qgWorld'), meEl = st.$('#qgMe'), rvEl = st.$('#qgRv'), ring = st.$('#qgRing'), target = st.$('#qgTarget'), judge = st.$('#qgJudge');
    let camY = 0;
    const am = climbAnim(), ar = climbAnim();
    let rvShown = 0;
    // 一步爬上去：先伸手（身體拉長），再把身體拉上去（縮回來），換另一隻手
    const startClimb = (a, from, to) => { a.from = from; a.to = to; a.t = 0; a.alt ^= 1; };
    const animPose = (el, a, x, dt) => {
      const up = a.to < a.from ? 0 : 1; // 往上
      a.t = Math.min(1, a.t + dt / .32); a.slip = Math.max(0, a.slip - dt * 2.5);
      const k = a.t, reach = k < .45 ? k / .45 : 1 - (k - .45) / .55; // 0→1→0
      const yy = yOf(a.from + (a.to - a.from) * (k < .45 ? k * .2 : .09 + (k - .45) / .55 * .91));
      const sy = 1 + reach * .16 * up, sx = 1 - reach * .06 * up;
      const sway = Math.sin(performance.now() / 260 + x) * 1.6 + a.slip * Math.sin(performance.now() / 30) * 6;
      el.querySelector('.pa').style.display = a.alt ? 'none' : ''; el.querySelector('.pb').style.display = a.alt ? '' : 'none';
      el.setAttribute('transform', `translate(${x.toFixed(1)} ${yy.toFixed(1)}) rotate(${sway.toFixed(1)}) translate(0 30) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(0 -30)`);
      return yy;
    };
    let lastDraw = performance.now();
    const draw = () => {
      const now = performance.now(), dt = Math.min(.05, (now - lastDraw) / 1000); lastDraw = now;
      // 世界往下捲，讓自己的爬手維持在畫面 y≈380
      const want = clamp(380 - yOf(my), 0, 380 - TOP + 40);
      camY += (want - camY) * .18;
      W.setAttribute('transform', `translate(0 ${camY.toFixed(1)})`);
      if (am.t >= 1) { am.from = am.to = my; }
      const myY = animPose(meEl, am, ME, dt);
      // 對手：每爬滿一格做一次伸手拉身
      if (Math.floor(rv) > rvShown) { startClimb(ar, rvShown, Math.floor(rv)); rvShown = Math.floor(rv); }
      if (ar.t >= 1) { ar.from = ar.to = rv; }
      animPose(rvEl, ar, RIVAL, dt);
      place(target, ME, myY - 44); // 手抓的位置
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
      ring.setAttribute('transform', `translate(${ME} ${yOf(my) - 44}) scale(${(1 + k * 1.6).toFixed(3)})`);
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
      startClimb(am, was, my);
      st.burst('spark', ME, yOf(my) - 30, 5);
      if (was < POLE_STEPS && my >= POLE_STEPS) { st.say('爬上<b>孤棚</b>了！接著爬孤棧，越上面越快喔。', 'temple'); st.sfx.chime(); }
      st.progress(my >= TOTAL ? 4 : my >= POLE_STEPS + 4 ? 3 : my >= POLE_STEPS ? 2 : my >= 4 ? 1 : 0, 4);
      if (my >= TOTAL) end(true);
    }
    function miss(why) {
      combo = 0; tapped = true;
      const floor = my >= POLE_STEPS ? POLE_STEPS : 0; // 上了孤棚就不會再滑下柱子
      const slip = my > floor ? 1 : 0;
      const was = my; my = Math.max(floor, my - slip);
      if (slip) { am.from = was; am.to = my; am.t = .45; am.slip = 1; }
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

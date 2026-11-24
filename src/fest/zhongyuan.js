// 中元普渡法會（七月十四、十五兩天）
// 十四：寫牌位貼上牌位牆 → 晚上到河邊放水燈（燈上寫姓氏）
// 十五：擺普渡桌（可以擺供品店買的普渡供品）→ 把載著祖先名字的紙法船送進金爐
// 素淨的畫面，不用紅燈籠。手勢規則：拿起來的東西浮在手指上方，做動作時鏡頭拉近。
import { art, hasArt, sitArt, sitImg, clamp, rand, place } from './core.js';
import { backdrop } from './games-1.js';
import fruitUrl from '../assets/offer/fruit.webp';
import teaUrl from '../assets/offer/tea.webp';
import cakesUrl from '../assets/offer/cakes.webp';
import furnaceUrl from '../assets/furnace.webp';

// 供品店（另一條分支做的）：有就接上，沒有也能玩
const SHOP = Object.values(import.meta.glob('../shop.js', { eager: true }))[0] || null;

const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const img = (url, w, h) => `<image href="${url}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
const hit = (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#000" opacity="0"/>`;
const escX = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function flyTo(st, el, from, to, ms, s0 = 1, s1 = 1, done) {
  st.tween(ms, (k, e) => place(el, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(k * Math.PI) * 20, s0 + (s1 - s0) * e), done);
}
function loop(st, fn) { let last = performance.now(); const f = (t) => { if (!st.alive) return; const dt = Math.min(.05, (t - last) / 1000); last = t; if (fn(dt, t) !== false) requestAnimationFrame(f); }; requestAnimationFrame(f); }
// 直書：一個字一行
function vtext(s, x, y, size, cls = 'zy-tab-txt', gap = 1.06) {
  return [...s].map((c, i) => `<text x="${x}" y="${(y + i * size * gap).toFixed(1)}" text-anchor="middle" class="${cls}" style="font-size:${size}px">${escX(c)}</text>`).join('');
}

/* ---------- 牌位 ---------- */
const TAB_W = 44, TAB_H = 120;
const tabletBase = (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3" fill="#F6D86A" stroke="#C8962E" stroke-width="2"/>
  <rect x="${-w / 2 + 4}" y="${-h / 2 + 4}" width="${w - 8}" height="${h - 8}" rx="2" fill="none" stroke="#C8382E" stroke-width="1.2"/>
  <path d="M${-w / 2} ${-h / 2 + 2} Q0 ${-h / 2 - 12} ${w / 2} ${-h / 2 + 2}Z" fill="#E8B83A" stroke="#C8962E" stroke-width="1.5"/>
  <ellipse cy="${h / 2 - 9}" rx="${w / 2 - 6}" ry="4" fill="#F2A8B8" opacity=".8"/>`;
// 牌位正中間寫「○○ 往生蓮位」，左下小字「陽上 ○○ 叩薦」
function tablet(name, by, w = TAB_W, h = TAB_H) {
  const main = `${name}往生蓮位`, n = [...main].length;
  const size = Math.min(10, (h - 34) / (n * 1.06));
  const bys = `陽上${by}叩薦`, bn = [...bys].length, bsize = Math.min(5.6, (h - 40) / (bn * 1.04));
  return `${art('zy-tablet', w, h + 10, tabletBase(w, h))}
    <text y="${-h / 2 + 12}" text-anchor="middle" class="zy-tab-txt" style="font-size:5px">佛光注照</text>
    ${vtext(main, 2, -h / 2 + 22, size)}
    ${vtext(bys, -w / 2 + 9, -h / 2 + 34, bsize, 'zy-tab-by', 1.04)}`;
}
const NAME_CHIPS = [['歷代祖先', '自己家的祖先，可以寫上姓氏'], ['冤親債主', '過去結下的緣，化解心結'], ['地基主', '住處原本的主人'], ['自己寫', '一位想念的親人或毛小孩']];

/* ---------- 法船（紙紮） ---------- */
const boatArt = (w, h) => `<path d="M-60 6 L60 6 L46 30 L-46 30Z" fill="#C8382E" stroke="#8A2420" stroke-width="2"/>
  <path d="M-46 14 L46 14" stroke="#F3C64A" stroke-width="3"/><path d="M-40 22 L40 22" stroke="#F3C64A" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="M60 6 Q76 -4 70 -20 Q82 -16 80 -2 Q74 10 60 14Z" fill="#F3C64A" stroke="#C8962E" stroke-width="1.5"/><circle cx="72" cy="-12" r="2" fill="#1E120C"/>
  <path d="M-60 6 Q-72 -6 -66 -18 Q-58 -6 -52 6Z" fill="#F3C64A" stroke="#C8962E" stroke-width="1.5"/>
  <rect x="-2" y="-62" width="4" height="68" fill="#8A5A3A"/>
  <path d="M-34 -56 L32 -56 L30 0 L-32 0Z" fill="#FFF4D8" stroke="#E0C48A" stroke-width="2"/>
  <path d="M2 -66 L22 -61 L2 -56Z" fill="#E0443E"/>`;
const sailNames = (names) => {
  const list = names.slice(0, 3);
  const cols = list.map((s, i) => vtext(s.slice(0, 6), 21 - i * 15, -46, 6.4, 'zy-tab-txt', 1.08)).join('');
  return `<g class="zy-sail" pointer-events="none">${cols}</g>`;
};

/* ---------- 普渡桌（第一版就有的四樣） ---------- */
const basin = `<ellipse cy="6" rx="34" ry="12" fill="#C8C0B0"/><ellipse rx="30" ry="9" fill="#9CC8E0"/><path d="M14 -20 q10 10 2 24" stroke="#FFF" stroke-width="6" fill="none" stroke-linecap="round"/>`;
const waterLamp = `<path d="M-26 6 L26 6 L18 20 L-18 20Z" fill="#E8D8B8"/><path d="M-20 6 L-16 -26 L16 -26 L20 6Z" fill="#FFF4D8" stroke="#E0C48A" stroke-width="2"/><ellipse cy="-6" rx="12" ry="14" fill="url(#fGlow)"/><path d="M0 -14 c4 4 4 8 0 10 c-4 -2 -4 -6 0 -10z" fill="#FFB43A"/>`;

// 今年寫過的牌位
const thisYear = () => new Date().getFullYear();
function myTablets(state) {
  state.zyTablets ||= [];
  return state.zyTablets.filter((t) => t.y === thisYear());
}
const surnameOf = (state) => {
  const t = myTablets(state).find((x) => /^.氏/.test(x.name));
  return t ? t.name[0] : '';
};

const zhongyuan = {
  name: '普渡法會', game: '寫牌位・放水燈・普渡・燒法船',
  days: ['寫牌位・放水燈', '普渡・燒法船'],
  dayLabels: ['十四', '十五'],
  dayOf: (L) => clamp((L?.day || 14) - 13, 1, 2),
  play(st, o) {
    if ((o.day || 1) === 2) puduDay(st, o); else eveDay(st, o);
  },
};

/* ================= 七月十四：寫牌位、放水燈 ================= */
function eveDay(st, o) {
  st.progress(0, 2);
  writeTablet(st, o, () => river(st, o, () => o.done(`水燈漂遠了，替祖先和好兄弟照亮了水路。明天七月十五是普渡正日，記得回來擺普渡桌、燒法船，把${myTablets(o.state).length > 1 ? '這些' : '這位'}祖先的名字一起送上去。`)));
}

// 寫牌位：先填表，再把牌位拿去貼在牌位牆上
function writeTablet(st, o, next) {
  const { state, save } = o;
  const COLS = 5, ROWS = 3, SX = 62, SY = 140, X0 = 56, Y0 = 150;
  const slots = Array.from({ length: COLS * ROWS }, (_, i) => [X0 + (i % COLS) * SX, Y0 + Math.floor(i / COLS) * SY]);
  const mine = myTablets(state).slice(-6);
  const FILL = ['陳氏歷代祖先', '林氏歷代祖先', '黃氏歷代祖先', '張氏歷代祖先', '李氏歷代祖先', '王氏歷代祖先', '吳氏歷代祖先', '劉氏歷代祖先', '蔡氏歷代祖先', '楊氏歷代祖先'];
  // 牌位牆：中間偏下留一格給新的；其他格放今年寫過的和別的香客的
  const target = 7, used = new Set([target]);
  const mineSlots = [6, 8, 2, 12, 1, 13].slice(0, mine.length);
  mineSlots.forEach((s) => used.add(s));
  const others = slots.map((_, i) => i).filter((i) => !used.has(i));
  const REST = [180, 560];

  st.set(`${backdrop('zhongyuan-wall', { wall: ['#E4DCCC', '#C8BCA8'], table: 610, tableColor: ['#A88A60', '#7A6040'], extra: `
      <rect x="18" y="58" width="324" height="452" rx="8" fill="#7A4A2A"/><rect x="26" y="66" width="308" height="436" rx="4" fill="#A86A3A"/>
      ${[0, 1, 2].map((r) => `<rect x="26" y="${Y0 + r * SY + 64}" width="308" height="8" fill="#7A4A2A"/>`).join('')}
      <text x="180" y="44" text-anchor="middle" class="fest-sign" style="fill:#6A4A2A;font-size:24px">中元普渡・超薦牌位</text>` })}
    ${others.map((i, k) => `<g transform="translate(${slots[i][0]} ${slots[i][1]})" opacity=".82">${tablet(FILL[k % FILL.length], '香客', TAB_W, TAB_H)}</g>`).join('')}
    ${mine.map((t, k) => `<g transform="translate(${slots[mineSlots[k]][0]} ${slots[mineSlots[k]][1]})">${tablet(t.name, t.by, TAB_W, TAB_H)}</g>`).join('')}
    <rect id="zSlot" x="${slots[target][0] - TAB_W / 2 - 4}" y="${slots[target][1] - TAB_H / 2 - 10}" width="${TAB_W + 8}" height="${TAB_H + 16}" rx="4" fill="#FFF4D8" fill-opacity=".18" stroke="#FFF4D8" stroke-width="2.5" stroke-dasharray="6 5"/>
    <g id="zLotus" opacity="0" pointer-events="none"><circle cx="${slots[target][0]}" cy="${slots[target][1]}" r="70" fill="url(#fGlow)"/></g>
    <g id="zTab" class="fest-hit" filter="url(#fToy)" style="display:none"></g>
    <text id="zTip" x="180" y="${REST[1] + 76}" text-anchor="middle" class="fest-tip" style="display:none">按住牌位，貼到牆上的空格</text>`);
  st.say('中元普渡法會開始了。先替祖先<b>寫一張牌位</b>，貼上牌位牆，法會期間師父會一起誦經超薦。', 'temple');

  // 填牌位（HTML 表單蓋在畫面下半）
  const host = st.svg.parentNode;
  const form = document.createElement('div');
  form.className = 'fest-form';
  const by = (state.name && state.name !== '香客') ? state.name : '';
  form.innerHTML = `<b class="fest-form-h">寫牌位</b>
    <div class="fest-form-chips">${NAME_CHIPS.map(([n, d], i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}" data-k="${i}" title="${d}">${n}</button>`).join('')}</div>
    <label class="field" data-f="sur"><span>姓氏（可不填）</span><input type="text" id="zSur" maxlength="2" placeholder="例如：王" value="${escX(surnameOf(state))}"></label>
    <label class="field" data-f="own" hidden><span>稱呼和名字</span><input type="text" id="zOwn" maxlength="8" placeholder="例如：先父王大明、愛犬小黑"></label>
    <label class="field"><span>陽上（寫牌位的人）</span><input type="text" id="zBy" maxlength="6" placeholder="你的名字" value="${escX(by)}"></label>
    <p class="fest-form-pv">牌位上會寫：<b id="zPv"></b></p>
    <button type="button" class="fest-btn primary" id="zOk">寫好了</button>`;
  host.appendChild(form);
  st.onCleanup(() => form.remove());
  let kind = 0;
  const $f = (s) => form.querySelector(s);
  const nameNow = () => {
    if (kind === 0) { const s = $f('#zSur').value.trim(); return s ? `${s.slice(0, 2)}氏歷代祖先` : '歷代祖先'; }
    if (kind === 3) return $f('#zOwn').value.trim() || '親人';
    return NAME_CHIPS[kind][0];
  };
  const pv = () => { $f('#zPv').textContent = `${nameNow()} 往生蓮位`; };
  pv();
  form.addEventListener('input', pv);
  form.addEventListener('click', (e) => {
    const c = e.target.closest('[data-k]');
    if (c) {
      kind = +c.dataset.k;
      form.querySelectorAll('[data-k]').forEach((b) => b.classList.toggle('on', b === c));
      $f('[data-f="sur"]').hidden = kind !== 0; $f('[data-f="own"]').hidden = kind !== 3;
      pv(); st.sfx.pop();
      if (kind === 3) $f('#zOwn').focus();
    }
    if (e.target.closest('#zOk')) {
      const name = nameNow(), who = $f('#zBy').value.trim() || '弟子';
      if (by !== who && who !== '弟子' && (!state.name || state.name === '香客')) state.name = who;
      form.remove(); stick(name, who);
    }
  });

  function stick(name, who) {
    const el = st.$('#zTab'), S = slots[target];
    el.innerHTML = `${hit(TAB_W + 30, TAB_H + 30)}${tablet(name, who)}`;
    el.style.display = ''; place(el, REST[0], REST[1], 1.25);
    st.$('#zTip').style.display = '';
    st.sfx.knock();
    st.say(`寫好了：<b>${escX(name)}</b>。按住牌位（會浮在手指上方），貼到牆上的<b>虛線空格</b>。`, 'temple');
    let pos = [...REST], done = false;
    const finish = () => {
      if (done) return; done = true; st.buttons([]);
      place(el, S[0], S[1]); st.$('#zSlot').setAttribute('opacity', '0'); st.$('#zTip').style.display = 'none';
      state.zyTablets = [...(state.zyTablets || []).filter((t) => t.y >= thisYear() - 1), { name, by: who, y: thisYear() }].slice(-12);
      save();
      st.sfx.bowl(); st.zoom(S[0], S[1], 200, 500);
      st.tween(900, (k) => st.$('#zLotus').setAttribute('opacity', (Math.sin(k * Math.PI) * .9).toFixed(2)));
      st.burst('star', S[0], S[1] - 40, 10, { color: '#FFF3B0' });
      st.floatText('往生蓮位', S[0], S[1] - TAB_H / 2 - 8, '#FFF4D0');
      st.progress(1, 2);
      st.later(1500, () => {
        st.reset();
        st.say('牌位貼上去了。要再寫一張嗎？寫完就等天黑去<b>放水燈</b>。', 'temple');
        st.buttons([{ label: '去放水燈', primary: true, on: next }, ...(myTablets(state).length < 6 ? [{ label: '再寫一張', on: () => writeTablet(st, o, next) }] : [])]);
      });
    };
    st.hold(el, {
      magnet: () => (done ? null : [S[0], S[1], 50]),
      onStart() { if (!done) { st.zoom(S[0], S[1] + 90, 250, 400); place(el, ...pos, 1); } },
      onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y); },
      onUp() {
        if (done) return;
        if (D(pos, S) < 34) finish();
        else { st.reset(); flyTo(st, el, pos, REST, 300, 1, 1.25); pos = [...REST]; }
      },
    });
    st.buttons([{ label: '幫我貼上', on: finish }]);
  }
}

// 放水燈：手指在燈下方撥水，燈往手指那邊漂，避開石頭
function river(st, o, next) {
  st.buttons([]);
  const ROCKS = [[110, 470], [250, 380], [140, 270], [240, 180]];
  const sur = surnameOf(o.state) || (o.state.name && o.state.name !== '香客' ? o.state.name[0] : '福');
  let lx = 180, ly = 560, tx = 180, bump = 0;
  st.set(`${backdrop('zhongyuan-river', { wall: ['#1A2A40', '#2A4A60'], table: 645, extra: `
    <path d="M60 645 C40 400 120 200 100 0 L260 0 C240 200 320 400 300 645Z" fill="#2E5A7A"/>
    ${Array.from({ length: 14 }, (_, i) => `<path d="M${rand(80, 260)} ${i * 46} q12 -4 24 0" stroke="#7AB0D0" stroke-width="2" fill="none" opacity=".5"/>`).join('')}
    ${Array.from({ length: 5 }, (_, i) => `<g transform="translate(${rand(110, 250)} ${60 + i * 26}) scale(.35)" opacity=".6">${waterLamp}</g>`).join('')}` })}
    ${ROCKS.map(([x, y]) => `<g transform="translate(${x} ${y})"><ellipse rx="26" ry="14" fill="#4A4A50"/><ellipse cx="-6" cy="-4" rx="12" ry="5" fill="#6A6A70"/></g>`).join('')}
    <g id="wl" filter="url(#fToy)">${art('zy-lamp', 60, 54, waterLamp)}<text y="10" text-anchor="middle" class="zy-lamp-txt">${escX(sur)}</text></g>
    <text x="180" y="610" text-anchor="middle" class="fest-tip">手指在水燈下面左右撥水</text>`);
  const wl = st.$('#wl');
  st.say(`天黑了，七月十四晚上<b>放水燈</b>。燈上寫著「${escX(sur)}」，替祖先和水裡的好兄弟照路。手指放在<b>水燈下方</b>左右移動撥水，避開石頭往上游漂。`, 'temple');
  st.touch({ move(p) { tx = clamp(p.x, 80, 280); } });
  loop(st, (dt, t) => {
    lx += (tx - lx) * Math.min(1, dt * 1.6); ly -= (bump > 0 ? -40 : 34) * dt; bump -= dt;
    for (const r of ROCKS) if (bump <= 0 && D([lx, ly], r) < 34) { bump = .5; st.sfx.knock(); lx += lx < r[0] ? -14 : 14; }
    place(wl, lx, ly + Math.sin(t / 300) * 2, 1, Math.sin(t / 400) * 5);
    if (Math.random() < .1) st.emit('spark', lx, ly - 6, { vy: -10, vx: rand(-6, 6), life: .8, color: '#FFD07A' });
    if (ly < 70) {
      st.progress(2, 2); st.sfx.chime();
      st.tween(800, (k, e) => wl.setAttribute('opacity', (1 - e).toFixed(2)));
      st.later(900, next);
      return false;
    }
  });
}

/* ================= 七月十五：普渡桌、燒法船 ================= */
function puduDay(st, o) {
  st.progress(0, 2);
  puduTable(st, o, () => burnBoat(st, o));
}

function puduTable(st, o, next) {
  const BASE = [['fruit', fruitUrl, 64, 74], ['cakes', cakesUrl, 70, 62], ['tea', teaUrl, 66, 47], ['basin', null, 70, 40]];
  // 背景圖的普渡長桌桌面大約在 y 370～580：供品要「坐」在桌面上（以前擺在桌子後緣，看起來浮在半空）
  const SPOTS = [[82, 408], [150, 402], [216, 402], [286, 410]], REST = [[60, 560], [140, 570], [220, 570], [300, 560]];
  const XSPOTS = [[76, 478], [144, 484], [216, 484], [284, 478]]; // 前排：供品店買的
  const shopItems = () => (SHOP?.ITEMS || []).filter((it) => (it.tags || []).includes('pudu') && SHOP.pantry?.count(it.id) > 0);
  let placed = 0, extra = 0, pos = [0, 0], tabled = false;
  st.set(`${backdrop('zhongyuan', { wall: ['#D8D4CC', '#B8B0A4'], table: 380, tableColor: ['#B8A07A', '#8A7650'], extra: `<rect x="40" y="120" width="70" height="150" fill="#F4EEE2" stroke="#C8BEB0"/><rect x="250" y="120" width="70" height="150" fill="#F4EEE2" stroke="#C8BEB0"/><text x="180" y="110" text-anchor="middle" class="fest-sign" style="fill:#6A5A4A;font-size:26px">慶讚中元</text>` })}
    ${SPOTS.map(([x, y], i) => `<ellipse id="zs${i}" cx="${x}" cy="${y + 20}" rx="28" ry="7" fill="none" stroke="#FFF" stroke-width="2" stroke-dasharray="5 5"/>`).join('')}
    <g id="zxSpots"></g><g id="zxItems"></g>
    ${BASE.map(([k, url, w, h]) => `<g id="zy-${k}" class="fest-hit" filter="url(#fToy)"><g transform="translate(0 ${20 - h / 2})">${hit(w, h)}</g><g transform="translate(0 20)">${url ? sitImg(url, w, h) : sitArt('zy-basin', w, h, basin)}</g></g>`).join('')}`);
  BASE.forEach(([k], i) => place(st.$('#zy-' + k), ...REST[i]));
  const tabs = myTablets(o.state);
  st.say(`七月十五普渡正日。把供品擺上桌，請${tabs.length ? `<b>${escX(tabs[0].name)}</b>和` : '祖先和'}四方沒人祭拜的好兄弟來享用。別忘了<b>臉盆和毛巾</b>，讓祂們遠道而來可以洗洗手。`, 'temple');
  BASE.forEach(([k], i) => {
    const el = st.$('#zy-' + k); let done = false;
    st.hold(el, {
      magnet: () => (done ? null : [...SPOTS[placed] || SPOTS[0], 40]),
      onStart() { if (!done) st.zoom(180, 400, 280); },
      onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y); },
      onUp() {
        if (done) return; st.reset();
        const s = SPOTS[placed];
        if (s && D(pos, s) < 32) { done = true; place(el, ...s); st.$('#zs' + placed).setAttribute('opacity', '0'); placed++; st.sfx.pop(); if (placed === 4) baseDone(); }
        else flyTo(st, el, pos, REST[i], 300);
      },
    });
  });
  st.buttons([{ label: '幫我擺好', on: () => { BASE.forEach(([k], i) => place(st.$('#zy-' + k), ...SPOTS[i])); SPOTS.forEach((_, i) => st.$('#zs' + i).setAttribute('opacity', '0')); placed = 4; baseDone(); } }]);

  // 基本四樣擺好後：有在供品店買普渡供品的，可以再擺到前排
  function baseDone() {
    const list = shopItems().slice(0, 4);
    if (!list.length) {
      if (SHOP?.ITEMS) st.say('擺好了。廟口<b>供品店</b>有賣三牲、麵線、罐頭這些普渡供品，下次可以先買來一起擺。', 'temple');
      table(); return;
    }
    st.say(`你在供品店買的普渡供品也可以擺上來：按住拿到<b>前排</b>的空位。`, 'temple');
    st.$('#zxSpots').innerHTML = XSPOTS.slice(0, list.length).map(([x, y], i) => `<ellipse id="zx${i}" cx="${x}" cy="${y + 18}" rx="26" ry="6" fill="none" stroke="#FFF" stroke-width="2" stroke-dasharray="5 5"/>`).join('');
    const XR = list.map((_, i) => [60 + i * (240 / Math.max(1, list.length - 1 || 1)), 584]);
    if (list.length === 1) XR[0] = [180, 584];
    st.$('#zxItems').innerHTML = list.map((it, i) => `<g id="zxi${i}" class="fest-hit" filter="url(#fToy)"><g transform="translate(0 -12)">${hit(64, 64)}</g><g transform="translate(0 18)">${it.img ? sitImg(it.img, 60, 60) : `<circle cy="-24" r="24" fill="#F3C64A"/>`}</g><text y="34" text-anchor="middle" class="fest-tip" style="font-size:12px">${escX(it.name)}</text></g>`).join('');
    list.forEach((it, i) => {
      const el = st.$('#zxi' + i); let done = false;
      place(el, ...XR[i]);
      st.hold(el, {
        magnet: () => (done ? null : [...XSPOTS[extra] || XSPOTS[0], 40]),
        onStart() { if (!done) st.zoom(180, 450, 280); },
        onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y); },
        onUp() {
          if (done) return; st.reset();
          const s = XSPOTS[extra];
          if (s && D(pos, s) < 32 && SHOP.pantry.take(it.id)) {
            done = true; place(el, ...s); el.querySelector('text')?.remove(); st.$('#zx' + extra)?.setAttribute('opacity', '0'); extra++; st.sfx.pop();
            st.burst('star', s[0], s[1] - 20, 6, { color: '#FFF3B0' });
            if (extra === list.length) table();
          } else flyTo(st, el, pos, XR[i], 300);
        },
      });
    });
    st.buttons([{ label: '這樣就好，開始普渡', primary: true, on: table }]);
  }
  function table() {
    if (tabled) return; tabled = true; st.buttons([]); st.progress(1, 2); st.sfx.bowl();
    st.say(`普渡桌擺好了${extra ? `，還多擺了 ${extra} 樣供品店的供品，好兄弟吃得很飽` : ''}。法會最後要<b>燒法船</b>，載著祖先的名字和大家的祝福升天。`, 'temple');
    st.later(1800, next);
  }
}

// 紙紮財寶：燒給祖先在那邊過好日子（都是紙做的，畫成紙紮的樣子：亮色＋金邊）。有 Gemini 圖 zy-<id> 就換掉
const gold = '#F3C64A', goldD = '#B8860B';
const TREASURES = [
  { id: 'villa', name: '豪宅別墅', big: true, draw: `<path d="M-30 -2 L-30 -26 L30 -26 L30 -2Z" fill="#FFF4E0" stroke="${goldD}" stroke-width="1.2"/><path d="M-34 -26 L0 -44 L34 -26Z" fill="#C8302A" stroke="${goldD}" stroke-width="1.2"/><path d="M-22 -40 L22 -40" stroke="${gold}" stroke-width="2"/>${[-20, -6, 8, 22].map((x) => `<rect x="${x - 3}" y="-22" width="6" height="8" fill="#7AB8E0" stroke="${goldD}" stroke-width=".8"/>`).join('')}<rect x="-5" y="-12" width="10" height="10" fill="#8A3A20" stroke="${gold}"/>${[-26, 26].map((x) => `<rect x="${x - 2}" y="-26" width="4" height="24" fill="${gold}"/>`).join('')}<rect x="-32" y="-3" width="64" height="3" fill="${gold}"/><text y="-30" text-anchor="middle" style="font-size:6px;fill:#FFE29A;font-weight:700">別墅</text>` },
  { id: 'car', name: '超跑', big: true, draw: `<path d="M-32 -6 Q-30 -16 -16 -18 L-6 -26 Q8 -28 18 -18 L30 -14 Q34 -10 32 -6Z" fill="#E0242A" stroke="#7A1010" stroke-width="1.2"/><path d="M-4 -24 L14 -18 L-10 -18Z" fill="#9AD0F0"/><path d="M-30 -10 h62" stroke="${gold}" stroke-width="1.4"/>${[-20, 20].map((x) => `<circle cx="${x}" cy="-5" r="6" fill="#222"/><circle cx="${x}" cy="-5" r="3" fill="#D8D8E0"/>`).join('')}<rect x="27" y="-14" width="5" height="3" fill="#FFE07A"/>` },
  { id: 'gold', name: '金條', big: true, draw: `${[[-14, 0], [0, 0], [14, 0], [-7, -8], [7, -8], [0, -16]].map(([x, y]) => `<path d="M${x - 8} ${y} L${x - 6} ${y - 7} L${x + 6} ${y - 7} L${x + 8} ${y}Z" fill="${gold}" stroke="${goldD}" stroke-width="1"/><path d="M${x - 5} ${y - 5} h7" stroke="#FFF3C0" stroke-width="1"/>`).join('')}` },
  { id: 'ingot', name: '元寶', big: true, draw: `${[[-12, 0], [12, 0], [0, -10]].map(([x, y]) => `<path d="M${x - 13} ${y - 8} Q${x} ${y + 4} ${x + 13} ${y - 8} Q${x + 10} ${y + 2} ${x} ${y + 2} Q${x - 10} ${y + 2} ${x - 13} ${y - 8}Z" fill="${gold}" stroke="${goldD}" stroke-width="1"/><ellipse cx="${x}" cy="${y - 7}" rx="6" ry="4" fill="#FFD84A" stroke="${goldD}" stroke-width=".8"/>`).join('')}` },
  { id: 'bag', name: '名牌包', draw: `<path d="M-12 -18 Q-12 -28 0 -28 Q12 -28 12 -18" stroke="#6A3A1A" stroke-width="2.4" fill="none"/><path d="M-18 -18 L18 -18 L20 0 L-20 0Z" fill="#E07A2A" stroke="#8A4A14" stroke-width="1.2"/><path d="M-18 -12 h36" stroke="#8A4A14" stroke-width="1"/><rect x="-4" y="-14" width="8" height="5" rx="1" fill="${gold}" stroke="${goldD}" stroke-width=".8"/>` },
  { id: 'watch', name: '金錶', draw: `<rect x="-5" y="-30" width="10" height="30" rx="3" fill="${gold}" stroke="${goldD}"/><circle cy="-15" r="10" fill="${gold}" stroke="${goldD}" stroke-width="1.2"/><circle cy="-15" r="7.4" fill="#1A2A4A"/><path d="M0 -15 v-5 M0 -15 l4 2" stroke="#FFF" stroke-width="1"/>${[0, 90, 180, 270].map((a) => `<circle cx="0" cy="-21" r=".8" fill="#FFE07A" transform="rotate(${a} 0 -15)"/>`).join('')}` },
  { id: 'phone', name: '最新手機', draw: `<rect x="-9" y="-30" width="18" height="30" rx="3" fill="#2A2A30" stroke="#888" stroke-width="1"/><rect x="-7" y="-27" width="14" height="24" rx="1.6" fill="#5A7AE0"/><path d="M-7 -12 Q0 -22 7 -16 L7 -3 L-7 -3Z" fill="#9A6AE0" opacity=".8"/><rect x="-3" y="-29" width="6" height="1.6" rx=".8" fill="#111"/>` },
  { id: 'game', name: '遊戲機', draw: `<rect x="-20" y="-16" width="40" height="16" rx="3" fill="#2A2A30"/><rect x="-12" y="-14.5" width="24" height="13" rx="1" fill="#6AC0E0"/><rect x="-22" y="-16" width="9" height="16" rx="4" fill="#E0443E"/><rect x="13" y="-16" width="9" height="16" rx="4" fill="#3A8AE0"/><circle cx="-17.5" cy="-11" r="1.8" fill="#222"/>${[[17, -11], [19, -8], [15, -8], [17, -5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#FFF"/>`).join('')}` },
];
const treasure = (t, w, h) => sitArt('zy-' + t.id, w, h, `<g transform="translate(0 ${h / 2}) scale(${(w / 64).toFixed(3)})">${t.draw}</g>`, .3);
// 法船上的甲板位置（船的區域座標；對齊 zy-boat 圖的船舷）
const DECK = () => (hasArt('zy-boat')
  ? [[-31, 30, 26], [-14, 30, 26], [18, 30, 26], [36, 30, 26], [-24, 38, 19], [-7, 38, 19], [10, 38, 19], [27, 38, 19]]
  : [[-40, 6, 20], [-22, 6, 20], [22, 6, 20], [40, 6, 20], [-31, 12, 15], [-12, 12, 15], [12, 12, 15], [31, 12, 15]]);
const loadedHtml = (ids) => { const d = DECK(); return ids.map((id, i) => { const t = TREASURES.find((x) => x.id === id), [x, y, w] = d[i]; return `<g transform="translate(${x} ${y})">${treasure(t, w, w)}</g>`; }).join(''); };

// 先把紙紮財寶裝上法船（點一下就飛上船），裝好再送去燒
function loadBoat(st, o, names, next) {
  const BC = [180, 300], BS = 2.5, SHELF = TREASURES.map((_, i) => [52 + (i % 4) * 85, i < 4 ? 500 : 568]);
  let loaded = [];
  st.set(`${backdrop('zhongyuan-boat', { wall: ['#1E2236', '#3A3A50'], table: 470, tableColor: ['#5A5050', '#3A3434'] })}
    <rect x="12" y="452" width="336" height="150" rx="14" fill="#2A1A14" opacity=".55"/>
    <g id="lBoat" transform="translate(${BC[0]} ${BC[1]}) scale(${BS})"><g filter="url(#fToy)">${art('zy-boat', 160, 110, boatArt)}${sailNames(names)}</g><g id="lDeck"></g></g>
    ${TREASURES.map((t, i) => `<g id="tr-${t.id}" class="fest-hit" data-t="${t.id}" transform="translate(${SHELF[i][0]} ${SHELF[i][1] + 16})">${hit(70, 70)}${treasure(t, 52, 48)}<text y="16" text-anchor="middle" class="fest-small" fill="#FFE29A">${t.name}</text></g>`).join('')}`);
  st.progress(0, 2);
  st.say('燒法船之前，先把<b>紙紮財寶</b>裝上船：豪宅、超跑、名牌包、金錶、最新手機、遊戲機、金條、元寶……讓祖先和好兄弟在那邊也過好日子。<b>點一下</b>就會搬上船，至少裝 4 樣。', 'temple');
  const go = () => { st.buttons([]); next(loaded); };
  const load = (id) => {
    if (loaded.includes(id) || loaded.length >= 8) return;
    const el = st.$('#tr-' + id), i = loaded.length, [dx, dy, w] = DECK()[i];
    loaded.push(id); st.sfx.pop();
    const from = [+el.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)/)[1], +el.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)/)[2]];
    const to = [BC[0] + dx * BS, BC[1] + dy * BS];
    el.classList.remove('fest-hit');
    st.tween(420, (k, e) => place(el, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(k * Math.PI) * 60, 1 - .1 * e), () => {
      el.style.display = 'none';
      st.$('#lDeck').innerHTML = loadedHtml(loaded);
      st.burst('star', to[0], to[1] - 20, 8, { color: '#FFE29A' });
    });
    if (loaded.length === 4) st.say('法船越來越氣派了！還可以再裝，裝好了按「<b>法船啟航</b>」。', 'temple');
    if (loaded.length >= 4) st.buttons([{ label: '法船啟航', primary: true, on: go }, ...(loaded.length < 8 ? [{ label: '全部裝上', on: () => TREASURES.forEach((t, k) => st.later(k * 120, () => load(t.id))) }] : [])]);
    if (loaded.length === 8) st.say('八樣財寶全部裝滿，法船金光閃閃！按「<b>法船啟航</b>」送祂們上路。', 'temple');
  };
  st.world.addEventListener('click', (e) => { const g = e.target.closest('[data-t]'); if (g) load(g.dataset.t); });
  st.buttons([{ label: '全部裝上', on: () => TREASURES.forEach((t, k) => st.later(k * 120, () => load(t.id))) }]);
}

// 燒法船：按住紙法船（浮在手指上方），送進金爐口
function burnBoat(st, o) {
  st.buttons([]);
  const tabs = myTablets(o.state);
  // 法會報名處報的超薦蓮位也一起載走
  const F = o.state.fahui || {};
  const fh = [...Object.values(F.reg || {}), ...(F.done || [])].flatMap((r) => (r?.names || []).filter((n) => n.kind === 'cj').map((n) => n.name)).filter(Boolean);
  const all = [...new Set([...tabs.map((t) => t.name), ...fh])];
  const names = all.length ? all : ['歷代祖先'];
  loadBoat(st, o, names, (loaded) => burnLoaded(st, o, names, loaded));
}
function burnLoaded(st, o, names, loaded) {
  const FW = 210, FH = 268, FC = [180, 330], MOUTH = [180, FC[1] + 88], REST = [180, 528]; // 法船放高一點，不要被下面的按鈕蓋住
  st.set(`${backdrop('zhongyuan-boat', { wall: ['#1E2236', '#3A3A50'], table: 470, tableColor: ['#5A5050', '#3A3434'], extra: `
    ${Array.from({ length: 18 }, () => `<circle cx="${rand(10, 350)}" cy="${rand(10, 200)}" r="${rand(.8, 1.8).toFixed(1)}" fill="#FFF4D8" opacity="${rand(.3, .8).toFixed(2)}"/>`).join('')}` })}
    <g id="zGlow" opacity=".35" pointer-events="none"><ellipse cx="${MOUTH[0]}" cy="${MOUTH[1]}" rx="80" ry="60" fill="url(#fGlow)"/></g>
    <image href="${furnaceUrl}" x="${FC[0] - FW / 2}" y="${FC[1] - FH / 2}" width="${FW}" height="${FH}" filter="url(#fToy)"/>
    <circle id="zMouth" cx="${MOUTH[0]}" cy="${MOUTH[1]}" r="34" fill="none" stroke="#FFF4D8" stroke-width="2.5" stroke-dasharray="7 6"/>
    <g id="zBoat" class="fest-hit" filter="url(#fToy)">${hit(170, 120)}${art('zy-boat', 160, 110, boatArt)}${sailNames(names)}${loadedHtml(loaded)}</g>`);
  const el = st.$('#zBoat');
  place(el, ...REST);
  st.say(`法船裝滿了 ${loaded.length} 樣財寶，帆上寫著<b>${names.slice(0, 3).map(escX).join('、')}</b>${names.length > 3 ? '等' : ''}。按住法船（會浮在手指上方），送進<b>金爐口</b>。`, 'temple');
  let pos = [...REST], done = false;
  const go = () => {
    if (done) return; done = true; st.buttons([]);
    st.$('#zMouth').setAttribute('opacity', '0');
    st.zoom(MOUTH[0], MOUTH[1] - 40, 260, 500);
    st.tween(500, (k, e) => place(el, pos[0] + (MOUTH[0] - pos[0]) * e, pos[1] + (MOUTH[1] - pos[1]) * e, 1 - .7 * e), () => {
      el.style.display = 'none'; st.sfx.bowl();
      st.tween(1400, (k) => st.$('#zGlow').setAttribute('opacity', (.35 + Math.sin(k * Math.PI) * .65).toFixed(2)));
      for (let i = 0; i < 36; i++) st.later(i * 30, () => st.emit('spark', MOUTH[0] + rand(-24, 24), MOUTH[1] - 10, { vy: rand(-140, -70), vx: rand(-20, 20), life: rand(.8, 1.4), color: i % 3 ? '#FFB43A' : '#FFE08A' }));
      st.later(700, rise);
    });
  };
  // 法船化成金光，載著名字升天
  function rise() {
    const ghost = st.add(`<g pointer-events="none" opacity="0"><ellipse rx="90" ry="70" fill="url(#fGlow)"/>${art('zy-boat', 160, 110, boatArt)}${sailNames(names)}${loadedHtml(loaded)}</g>`);
    const y0 = FC[1] - FH / 2 - 10;
    st.reset(1600);
    st.tween(2600, (k, e) => {
      place(ghost, MOUTH[0] + Math.sin(k * 5) * 10, y0 - e * 300, .5 + .2 * e);
      ghost.setAttribute('opacity', (k < .2 ? k * 5 : 1 - (k - .2) / .8).toFixed(2));
      if (Math.random() < .3) st.emit('star', MOUTH[0] + rand(-30, 30), y0 - e * 300 + 20, { vy: 20, vx: rand(-10, 10), life: .9, color: '#FFF3B0' });
    }, () => {
      st.progress(2, 2); st.sfx.chime();
      st.floatText('法船啟航', 180, 120, '#FFF4D0');
      st.later(1200, () => o.done(`法船載著${names.length > 1 ? `${names.length} 張牌位上的名字` : `「${escX(names[0])}」`}、${loaded.length} 樣紙紮財寶和大家的祝福升天了。中元普渡圓滿，七月也是孝親月，記得打電話給家裡的長輩。`));
    });
  }
  st.hold(el, {
    magnet: () => (done ? null : [MOUTH[0], MOUTH[1], 54]),
    onStart() { if (!done) st.zoom(MOUTH[0], MOUTH[1] + 100, 270, 400); },
    onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y); },
    onUp() {
      if (done) return;
      if (D(pos, MOUTH) < 54) go();
      else { st.reset(); flyTo(st, el, pos, REST, 300); pos = [...REST]; }
    },
  });
  st.buttons([{ label: '幫我送進去', on: () => { pos = [...REST]; go(); } }]);
}

export const GAMES = { zhongyuan };

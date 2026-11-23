// 第三批節慶小遊戲：端午、七夕、中元、中秋、重陽
import { art, clamp, rand, pick, place } from './core.js';
import { backdrop } from './games-1.js';
import tigerAwakeUrl from '../assets/tiger-awake.webp';
import tigerHappyUrl from '../assets/tiger-happy.webp';
import fruitUrl from '../assets/offer/fruit.webp';
import teaUrl from '../assets/offer/tea.webp';
import cakesUrl from '../assets/offer/cakes.webp';

const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function flyTo(st, el, from, to, ms, s0 = 1, s1 = 1, done) {
  st.tween(ms, (k, e) => place(el, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(k * Math.PI) * 20, s0 + (s1 - s0) * e), done);
}
const img = (url, w, h) => `<image href="${url}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}"/>`;
const hit = (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#000" opacity="0"/>`;
// 每幀跑的迴圈，舞台關掉就停
function loop(st, fn) { let last = performance.now(); const f = (t) => { if (!st.alive) return; const dt = Math.min(.05, (t - last) / 1000); last = t; if (fn(dt, t) !== false) requestAnimationFrame(f); }; requestAnimationFrame(f); }

/* ================= 端午：正午立蛋、掛香包 ================= */
const egg = `<ellipse rx="25" ry="34" fill="#FFF8EE" stroke="#E8D6BE" stroke-width="2"/><ellipse cx="-8" cy="-14" rx="7" ry="10" fill="#FFF" opacity=".8"/>`;
const sachet = `${hit(60, 90)}<path d="M0 -44 L0 -26" stroke="#E0443E" stroke-width="2"/><path d="M-22 -26 L22 -26 L26 12 Q0 34 -26 12Z" fill="#E0443E" stroke="#B02A22" stroke-width="2"/><circle cy="-6" r="9" fill="#F3C64A"/><path d="M-4 30v14M0 32v16M4 30v14" stroke="#F3C64A" stroke-width="2.4"/>`;

const duanwu = {
  play(st, o) {
    const BASE = [180, 420], HOOK = [282, 168];
    const h = new Date().getHours(), noon = h >= 11 && h < 13;
    let a = rand(-.06, .06), w = 0, fx = null, f0 = null, ok = 0, phase = 'egg', falls = 0;
    st.set(`${backdrop('duanwu', { wall: ['#CFE8F0', '#F4E2B8'], table: 440, tableColor: ['#C9A06A', '#9C744A'], extra: `
      <circle cx="70" cy="90" r="34" fill="#FFE07A"/><circle cx="70" cy="90" r="50" fill="#FFE07A" opacity=".25"/>
      <rect x="230" y="70" width="110" height="240" fill="#8A5A3A"/><rect x="242" y="82" width="86" height="216" fill="#C8302A"/>
      <path d="M244 90 l18 -40 M250 92 l26 -48 M256 92 l8 -52" stroke="#5E9A4A" stroke-width="5" stroke-linecap="round"/><path d="M318 92 l-14 -46 M312 92 l-24 -40" stroke="#7BB35A" stroke-width="5" stroke-linecap="round"/>
      <circle cx="${HOOK[0]}" cy="${HOOK[1] - 46}" r="5" fill="#F3C64A"/>` })}
      <ellipse cx="${BASE[0]}" cy="${BASE[1] + 2}" rx="40" ry="6" fill="#000" opacity=".12"/>
      <g id="egg"><g transform="translate(0 -34)">${art('dw-egg', 54, 72, egg)}</g></g>
      <g id="meter" transform="translate(180 500)"><rect x="-70" y="-6" width="140" height="12" rx="6" fill="#FFF" opacity=".7"/><rect id="meterFill" x="-70" y="-6" width="0" height="12" rx="6" fill="#3E9E86"/></g>
      <text x="180" y="560" text-anchor="middle" class="fest-tip">手指在這下面左右移，扶住蛋</text>
      <g id="sachet" class="fest-hit" filter="url(#fToy)" style="display:none">${art('dw-sachet', 60, 90, sachet)}</g>`);
    const eggEl = st.$('#egg');
    st.progress(0, 2);
    st.say(`端午節正午立蛋！${noon ? '現在剛好是<b>正午</b>，陽氣最旺，蛋特別好立。' : '（正午 11 點到 1 點玩會比較好立。）'}手指按在<b>蛋的下方</b>，蛋往哪邊倒，手指就往哪邊輕輕移，撐 2.5 秒就成功。`, 'temple');
    st.touch({
      down(p) { if (phase === 'egg') { fx = p.x; f0 = p.x; } },
      move(p) { if (phase === 'egg') fx = p.x; },
      up() { fx = null; },
    });
    const NEED = 2.5, G = noon ? .8 : 1.2;
    loop(st, (dt) => {
      if (phase !== 'egg') return false;
      const ctrl = fx === null ? 0 : clamp((fx - f0) / 50, -1.4, 1.4);
      w += (G * Math.sin(a) + rand(-.3, .3) - ctrl * 2.4) * dt;
      w *= .95; a += w * dt;
      if (fx !== null) f0 += (fx - f0) * Math.min(1, dt * 1.2); // 手指停住，慢慢回到中立
      place(eggEl, BASE[0], BASE[1], 1, a * 57.3);
      if (Math.abs(a) < .16 && fx !== null) ok += dt; else ok = Math.max(0, ok - dt * .5);
      st.$('#meterFill').setAttribute('width', (140 * Math.min(1, ok / NEED)).toFixed(1));
      if (Math.abs(a) > 1) {
        falls++; st.sfx.knock(); a = rand(-.05, .05); w = 0; ok = 0;
        st.say(falls > 2 ? '倒了沒關係，蛋往右倒，手指就往右邊移一點點；動作小一點比較穩。' : '蛋倒了，再扶一次。', 'temple');
      }
      if (ok >= NEED) { stood(); return false; }
    });
    function stood() {
      phase = 'sachet'; place(eggEl, BASE[0], BASE[1]); st.sfx.chime(); st.burst('star', BASE[0], BASE[1] - 40, 16);
      st.progress(1, 2); st.floatText('立起來了！', BASE[0], BASE[1] - 90, '#C8382E');
      st.$('#meter').setAttribute('opacity', '0');
      const sc = st.$('#sachet'); sc.style.display = ''; const rest = [80, 520]; place(sc, ...rest);
      st.say('蛋站好了，今年好運！再把<b>香包</b>掛到門上的釘子，驅蚊保平安。', 'temple');
      let pos = [...rest], done = false;
      st.hold(sc, {
        magnet: () => (done ? null : [HOOK[0], HOOK[1], 50]),
        onStart() { if (!done) st.zoom(220, 280, 260); },
        onMove(x, y) { if (done) return; pos = [x, y]; place(sc, x, y); },
        onUp() {
          if (done) return; st.reset();
          if (D(pos, HOOK) < 34) { done = true; place(sc, ...HOOK); hung(); } else flyTo(st, sc, pos, rest, 300);
        },
      });
      st.buttons([{ label: '幫我掛', on: () => { if (!done) { done = true; place(sc, ...HOOK); hung(); } } }]);
    }
    let fin = false;
    function hung() {
      if (fin) return; fin = true; st.buttons([]); st.sfx.pop(); st.progress(2, 2);
      st.burst('spark', HOOK[0], HOOK[1], 12, { color: '#F3C64A' });
      st.later(600, () => o.done(`${noon ? '正午' : ''}立蛋成功、香包掛好了。端午記得吃粽子、多喝水，夏天平平安安。`));
    }
    st.buttons([{ label: '幫我扶', on: () => { ok = NEED; } }]);
  },
};

/* ================= 七夕：搭鵲橋 ================= */
const magpie = `${hit(50, 40)}<ellipse rx="16" ry="10" fill="#2A2A3A"/><ellipse cx="2" cy="3" rx="9" ry="6" fill="#FFF"/><circle cx="14" cy="-6" r="7" fill="#2A2A3A"/><circle cx="16" cy="-7" r="1.6" fill="#FFF"/><path d="M20 -6 l6 1 -6 2z" fill="#F3C64A"/><path d="M-14 -2 l-14 -4 2 8z" fill="#3A4A7A"/><path d="M-4 -6 Q-2 -22 10 -14" fill="#3A4A7A"/>`;
const star = (c) => `<circle r="20" fill="url(#fGlow)"/><path d="M0-12 3-4 12-4 5 2 8 11 0 6-8 11-5 2-12-4-3-4z" fill="${c}"/>`;

const qixi = {
  play(st, o) {
    const N = 5, SLOTS = Array.from({ length: N }, (_, i) => { const k = (i + 1) / (N + 1); return [60 + 240 * k, 300 - Math.sin(k * Math.PI) * 60]; });
    const REST = [[50, 500], [120, 540], [180, 500], [240, 540], [310, 500]];
    let filled = 0;
    st.set(`${backdrop('qixi', { wall: ['#14143A', '#3A2A5A'], table: 645, extra: `
      ${Array.from({ length: 50 }, () => `<circle cx="${rand(0, 360)}" cy="${rand(0, 645)}" r="${rand(.5, 1.6)}" fill="#FFF8D8" opacity="${rand(.3, .9)}"/>`).join('')}
      <path d="M150 0 C120 200 240 400 190 645 L250 645 C300 400 180 200 210 0Z" fill="#B8C8FF" opacity=".18"/>` })}
      <g id="niulang" transform="translate(40 320)">${star('#9AD0FF')}</g><text x="40" y="360" text-anchor="middle" class="fest-tip">牛郎</text>
      <g id="zhinu" transform="translate(320 320)">${star('#FFB8D8')}</g><text x="320" y="360" text-anchor="middle" class="fest-tip">織女</text>
      ${SLOTS.map(([x, y], i) => `<circle id="qs${i}" cx="${x}" cy="${y}" r="16" fill="none" stroke="#FFF4D8" stroke-width="2" stroke-dasharray="4 4" opacity=".7"/>`).join('')}
      ${REST.map((_, i) => `<g id="mp${i}" class="fest-hit" filter="url(#fToy)">${art('qx-magpie', 52, 40, magpie)}</g>`).join('')}`);
    REST.forEach((r, i) => place(st.$('#mp' + i), ...r));
    st.progress(0, N);
    st.say('七夕，牛郎和織女隔著銀河一年見一次。把喜鵲一隻一隻<b>拖到虛線圈</b>，搭成鵲橋讓他們見面。', 'temple');
    // 喜鵲在原地輕輕飛
    const idle = REST.map(() => true);
    loop(st, (dt, t) => { REST.forEach((r, i) => { if (idle[i]) place(st.$('#mp' + i), r[0], r[1] + Math.sin(t / 300 + i) * 5, 1, Math.sin(t / 200 + i) * 6); }); return filled < N; });
    REST.forEach((r, i) => {
      const el = st.$('#mp' + i); let done = false, pos = [...r];
      st.hold(el, {
        magnet: () => (done ? null : [...SLOTS[filled], 40]),
        onStart() { if (!done) { idle[i] = false; st.zoom(180, 380, 300); } },
        onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y); },
        onUp() {
          if (done) return; st.reset();
          const s = SLOTS[filled];
          if (s && D(pos, s) < 30) {
            done = true; place(el, ...s); st.$('#qs' + filled).setAttribute('opacity', '0'); filled++;
            st.sfx.pop(); st.progress(filled, N); st.burst('star', ...s, 8, { color: '#FFE0F0' });
            if (filled === N) meet();
          } else { flyTo(st, el, pos, r, 300, 1, 1, () => { idle[i] = true; }); }
        },
      });
    });
    let met = false;
    function meet() {
      if (met) return; met = true;
      st.buttons([]); st.sfx.bowl();
      const a = st.$('#niulang'), b = st.$('#zhinu');
      st.tween(2200, (k, e) => {
        const kk = e, ia = Math.min(N - 1, Math.floor(kk * N)), ib = Math.max(0, N - 1 - Math.floor(kk * N));
        const pa = [40 + (170 - 40) * e, 320 - Math.sin(e * Math.PI / 2) * 60], pb = [320 - (320 - 190) * e, 320 - Math.sin(e * Math.PI / 2) * 60];
        place(a, ...pa); place(b, ...pb);
      }, () => {
        st.burst('heart', 180, 250, 20, { color: '#FF8AB0' }); st.sfx.chime();
        st.floatText('鵲橋相會', 180, 200, '#FFE0F0');
        o.done('鵲橋搭好，牛郎織女見面了。七夕也是七娘媽生，保佑小朋友平安長大。想求姻緣，可以去月老閣走走。');
        st.later(50, () => st.buttons([{ label: '去月老閣', primary: true, on: () => o.goHall('yue') }, { label: '回到殿裡', on: () => o.goHall(null) }]));
      });
    }
    st.buttons([{ label: '幫我搭', on: () => { idle.fill(false); REST.forEach((_, i) => { if (filled < N) { place(st.$('#mp' + i), ...SLOTS[filled]); st.$('#qs' + filled).setAttribute('opacity', '0'); filled++; } }); st.progress(N, N); meet(); } }]);
  },
};

/* ================= 中元：普度、放水燈 ================= */
// 素淨的畫面，不用紅燈籠。供品是分享給無主的好兄弟，水燈照亮水路。
const basin = `<ellipse cy="6" rx="34" ry="12" fill="#C8C0B0"/><ellipse rx="30" ry="9" fill="#9CC8E0"/><path d="M14 -20 q10 10 2 24" stroke="#FFF" stroke-width="6" fill="none" stroke-linecap="round"/>`;
const waterLamp = `<path d="M-26 6 L26 6 L18 20 L-18 20Z" fill="#E8D8B8"/><path d="M-20 6 L-16 -26 L16 -26 L20 6Z" fill="#FFF4D8" stroke="#E0C48A" stroke-width="2"/><ellipse cy="-6" rx="12" ry="14" fill="url(#fGlow)"/><path d="M0 -14 c4 4 4 8 0 10 c-4 -2 -4 -6 0 -10z" fill="#FFB43A"/>`;

const zhongyuan = {
  play(st, o) {
    const ITEMS = [['fruit', fruitUrl, 64, 74, '水果'], ['cakes', cakesUrl, 70, 62, '餅乾糕點'], ['tea', teaUrl, 66, 47, '清茶'], ['basin', null, 70, 40, '臉盆毛巾']];
    const SPOTS = [[80, 352], [150, 346], [220, 346], [290, 356]], REST = [[60, 520], [140, 530], [220, 530], [300, 520]];
    let placed = 0, pos = [0, 0];
    st.set(`${backdrop('zhongyuan', { wall: ['#D8D4CC', '#B8B0A4'], table: 380, tableColor: ['#B8A07A', '#8A7650'], extra: `<rect x="40" y="120" width="70" height="150" fill="#F4EEE2" stroke="#C8BEB0"/><rect x="250" y="120" width="70" height="150" fill="#F4EEE2" stroke="#C8BEB0"/><text x="180" y="110" text-anchor="middle" class="fest-sign" style="fill:#6A5A4A;font-size:26px">慶讚中元</text>` })}
      ${SPOTS.map(([x, y], i) => `<ellipse id="zs${i}" cx="${x}" cy="${y + 20}" rx="28" ry="7" fill="none" stroke="#FFF" stroke-width="2" stroke-dasharray="5 5"/>`).join('')}
      ${ITEMS.map(([k, url, w, h]) => `<g id="zy-${k}" class="fest-hit" filter="url(#fToy)">${hit(w, h)}${url ? img(url, w, h) : art('zy-basin', w, h, basin)}</g>`).join('')}`);
    ITEMS.forEach(([k], i) => place(st.$('#zy-' + k), ...REST[i]));
    st.progress(0, 2);
    st.say('七月十五中元普度，把供品擺上桌，分享給四方沒人祭拜的好兄弟。別忘了<b>臉盆和毛巾</b>，讓祂們遠道而來可以洗洗手。', 'temple');
    ITEMS.forEach(([k], i) => {
      const el = st.$('#zy-' + k); let done = false;
      st.hold(el, {
        magnet: () => (done ? null : [...SPOTS[placed] || SPOTS[0], 40]),
        onStart() { if (!done) st.zoom(180, 400, 280); },
        onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y); },
        onUp() {
          if (done) return; st.reset();
          const s = SPOTS[placed];
          if (s && D(pos, s) < 32) { done = true; place(el, ...s); st.$('#zs' + placed).setAttribute('opacity', '0'); placed++; st.sfx.pop(); if (placed === 4) table(); }
          else flyTo(st, el, pos, REST[i], 300);
        },
      });
    });
    st.buttons([{ label: '幫我擺好', on: () => { ITEMS.forEach(([k], i) => place(st.$('#zy-' + k), ...SPOTS[i])); SPOTS.forEach((_, i) => st.$('#zs' + i).setAttribute('opacity', '0')); placed = 4; table(); } }]);
    let tabled = false;
    function table() {
      if (tabled) return; tabled = true; st.buttons([]); st.progress(1, 2); st.sfx.bowl();
      st.say('普度桌擺好了。接著到河邊<b>放水燈</b>，替水裡的好兄弟照亮回家的路。', 'temple');
      st.later(1600, river);
    }
    function river() {
      const ROCKS = [[110, 470], [250, 380], [140, 270], [240, 180]];
      let lx = 180, ly = 560, tx = 180, bump = 0;
      st.set(`${backdrop('zhongyuan-river', { wall: ['#1A2A40', '#2A4A60'], table: 645, extra: `
        <path d="M60 645 C40 400 120 200 100 0 L260 0 C240 200 320 400 300 645Z" fill="#2E5A7A"/>
        ${Array.from({ length: 14 }, (_, i) => `<path d="M${rand(80, 260)} ${i * 46} q12 -4 24 0" stroke="#7AB0D0" stroke-width="2" fill="none" opacity=".5"/>`).join('')}` })}
        ${ROCKS.map(([x, y]) => `<g transform="translate(${x} ${y})"><ellipse rx="26" ry="14" fill="#4A4A50"/><ellipse cx="-6" cy="-4" rx="12" ry="5" fill="#6A6A70"/></g>`).join('')}
        <g id="wl" filter="url(#fToy)">${art('zy-lamp', 60, 54, waterLamp)}</g>
        <text x="180" y="560" text-anchor="middle" class="fest-tip">手指在水燈下面左右撥水</text>`);
      const wl = st.$('#wl');
      st.say('手指放在<b>水燈下方</b>左右移動撥水，水燈會往手指那邊漂，避開石頭往上游漂。', 'temple');
      st.touch({ move(p) { tx = clamp(p.x, 80, 280); } });
      loop(st, (dt, t) => {
        lx += (tx - lx) * Math.min(1, dt * 1.6); ly -= (bump > 0 ? -40 : 34) * dt; bump -= dt;
        for (const r of ROCKS) if (bump <= 0 && D([lx, ly], r) < 34) { bump = .5; st.sfx.knock(); lx += lx < r[0] ? -14 : 14; }
        place(wl, lx, ly + Math.sin(t / 300) * 2, 1, Math.sin(t / 400) * 5);
        if (Math.random() < .1) st.emit('spark', lx, ly - 6, { vy: -10, vx: rand(-6, 6), life: .8, color: '#FFD07A' });
        if (ly < 70) {
          st.progress(2, 2); st.sfx.chime();
          st.tween(800, (k, e) => wl.setAttribute('opacity', (1 - e).toFixed(2)));
          st.later(900, () => o.done('水燈漂遠了，替好兄弟照亮了水路。七月也是孝親月，記得打電話給家裡的長輩。'));
          return false;
        }
      });
    }
  },
};

/* ================= 中秋：剝柚子、柚子帽給虎爺 ================= */
const pomelo = (p) => `<circle r="56" fill="#F7EBD0"/>${Array.from({ length: 10 }, (_, i) => `<path d="M0 0 L${(Math.cos(i / 10 * 6.283) * 50).toFixed(1)} ${(Math.sin(i / 10 * 6.283) * 50).toFixed(1)}" stroke="#F0D8A8" stroke-width="2"/>`).join('')}
  <circle id="peel" r="60" fill="#B8D86A" stroke="#8AAE4A" stroke-width="3"/><path id="peelHi" d="M-30 -30 q10 -14 26 -16" stroke="#E0F0A8" stroke-width="6" fill="none" stroke-linecap="round"/>`;
const hat = `${hit(110, 70)}<path d="M-52 18 Q-56 -40 0 -44 Q56 -40 52 18 Q0 30 -52 18Z" fill="#B8D86A" stroke="#8AAE4A" stroke-width="3"/><path d="M-50 16 Q0 26 50 16" stroke="#F7EBD0" stroke-width="6" fill="none"/><path d="M0 -44 q-4 -14 6 -22" stroke="#6A8A3A" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="12" cy="-62" rx="10" ry="5" fill="#7BB35A" transform="rotate(-20 12 -62)"/>`;

const zhongqiu = {
  play(st, o) {
    const POM = [180, 320], TIGER = [282, 548], HEAD = [276, 484];
    let acc = 0, lastA = null, phase = 'peel';
    st.set(`${backdrop('zhongqiu', { wall: ['#1E2440', '#3A3050'], table: 430, tableColor: ['#8A6A4A', '#5A4430'], extra: `<circle id="moon" cx="280" cy="100" r="46" fill="#FFF0B8" opacity=".75"/><circle cx="280" cy="100" r="70" fill="#FFF0B8" opacity=".12"/>` })}
      <circle id="ring" cx="${POM[0]}" cy="${POM[1]}" r="96" fill="none" stroke="#FFF4D8" stroke-width="3" stroke-dasharray="8 8" opacity=".6"/>
      <g id="pom" transform="translate(${POM[0]} ${POM[1]})">${pomelo()}</g>
      <g id="tiger" transform="translate(${TIGER[0]} ${TIGER[1]})">${img(tigerAwakeUrl, 140, 168)}</g>
      <g id="hat" class="fest-hit" filter="url(#fToy)" style="display:none">${art('zq-hat', 110, 70, hat)}</g>
      <text id="ringTxt" x="${POM[0]}" y="${POM[1] + 122}" text-anchor="middle" class="fest-tip">沿著虛線圈畫圈剝皮</text>`);
    const peel = st.$('#peel');
    st.progress(0, 3);
    st.say('中秋節剝柚子！手指沿著柚子外面的<b>虛線圈</b>畫圈，把柚子皮剝下來（手指不會擋到柚子）。', 'temple');
    st.touch({
      down() { lastA = null; if (phase === 'peel') st.zoom(180, 360, 300); },
      move(p) {
        if (phase !== 'peel') return;
        const dx = p.x - POM[0], dy = p.y - POM[1], r = Math.hypot(dx, dy);
        if (r < 60 || r > 170) { lastA = null; return; }
        const a = Math.atan2(dy, dx);
        if (lastA !== null) { let d = a - lastA; if (d > Math.PI) d -= 6.283; if (d < -Math.PI) d += 6.283; acc += Math.abs(d); }
        lastA = a;
        const k = clamp(acc / (6.283 * 2), 0, 1);
        // 皮從下往上一圈圈剝開
        peel.setAttribute('clip-path', ''); peel.setAttribute('r', (60 * (1 - k * .15)).toFixed(1));
        peel.setAttribute('opacity', (1 - k * .9).toFixed(2));
        if (Math.random() < .2) st.emit('paper', POM[0] + Math.cos(a) * 58, POM[1] + Math.sin(a) * 58, { color: '#B8D86A', vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, g: 200, life: .7 });
        if (k >= 1) peeled();
      },
      up() { lastA = null; },
    });
    function peeled() {
      if (phase !== 'peel') return; phase = 'hat'; st.reset();
      st.$('#ring').setAttribute('opacity', '0'); st.$('#ringTxt').setAttribute('opacity', '0'); st.$('#peelHi').setAttribute('opacity', '0');
      st.sfx.chime(); st.progress(1, 3); st.burst('star', ...POM, 12);
      const h = st.$('#hat'); h.style.display = ''; const rest = [80, 520]; place(h, ...rest);
      st.say('剝好了，柚子香香的！把剝下來的<b>柚子帽</b>拿給虎爺戴。', 'cat');
      let pos = [...rest], done = false;
      st.hold(h, {
        magnet: () => (done ? null : [...HEAD, 50]),
        onStart() { if (!done) st.zoom(200, 450, 260); },
        onMove(x, y) { if (done) return; pos = [x, y]; place(h, x, y, .8); },
        onUp() { if (done) return; st.reset(); if (D(pos, HEAD) < 36) { done = true; wear(h); } else flyTo(st, h, pos, rest, 300, .8, 1); },
      });
      st.buttons([{ label: '幫虎爺戴上', on: () => { if (!done) { done = true; wear(h); } } }]);
    }
    let worn = false;
    function wear(h) {
      if (worn) return; worn = true;
      place(h, HEAD[0], HEAD[1], .62, -8);
      st.$('#tiger').innerHTML = img(tigerHappyUrl, 140, 168);
      st.sfx.purr?.(); st.burst('heart', ...HEAD, 12); st.progress(2, 3);
      st.say('虎爺戴上柚子帽，開心得呼嚕呼嚕！最後一起<b>拜月亮</b>。', 'cat');
      st.buttons([{ label: '拜月亮', primary: true, on: moon }]);
    }
    let mooned = false;
    function moon() {
      if (mooned) return; mooned = true; st.buttons([]); st.sfx.bowl();
      st.tween(1200, (k, e) => { st.$('#moon').setAttribute('opacity', (.75 + e * .25).toFixed(2)); st.$('#moon').setAttribute('r', (46 + e * 8).toFixed(1)); });
      st.burst('star', 280, 100, 20, { color: '#FFF0B8' }); st.progress(3, 3);
      st.later(1300, () => o.done('月圓人團圓。中秋也是土地公得道日，可以順便去福德祠拜一下。祝你中秋快樂！'));
    }
  },
};

/* ================= 重陽：放風箏 ================= */
const kite = `${hit(70, 90)}<path d="M0 -40 L30 0 L0 44 L-30 0Z" fill="#E0443E" stroke="#B02A22" stroke-width="2"/><path d="M0 -40 V44 M-30 0 H30" stroke="#F3C64A" stroke-width="2"/><circle r="9" fill="#F3C64A"/><path d="M0 44 q-10 14 4 22 q12 8 -2 20" stroke="#E0443E" stroke-width="2" fill="none"/>`;
const coin = `<circle r="13" fill="#F3C64A" stroke="#C8963E" stroke-width="2"/><rect x="-4" y="-4" width="8" height="8" fill="#C8963E"/>`;

const chongyang = {
  play(st, o) {
    const HAND = [180, 600], N = 5;
    let kx = 180, ky = 470, tx = 180, pulling = false, got = 0, lastY = null, coins = [];
    st.set(`${backdrop('chongyang', { wall: ['#8EC8F0', '#E8F4FF'], table: 560, tableColor: ['#8AC46A', '#5E9A4A'], extra: `<path d="M0 560 L80 470 L150 520 L230 440 L360 540 L360 560Z" fill="#7AB35A" opacity=".7"/>${[[60, 120], [280, 200], [150, 300]].map(([x, y]) => `<g opacity=".85"><ellipse cx="${x}" cy="${y}" rx="40" ry="14" fill="#FFF"/><ellipse cx="${x + 20}" cy="${y - 8}" rx="24" ry="12" fill="#FFF"/></g>`).join('')}` })}
      <line id="line" x1="${HAND[0]}" y1="${HAND[1]}" stroke="#5A3A2A" stroke-width="1.6"/>
      <g id="coins"></g>
      <g id="kite" filter="url(#fToy)">${art('cy-kite', 70, 90, kite)}</g>
      <text x="180" y="580" text-anchor="middle" class="fest-tip">在下面左右拉線、往下拉讓風箏飛高</text>`);
    const kEl = st.$('#kite'), line = st.$('#line'), cG = st.$('#coins');
    st.progress(0, N);
    st.say('九月初九重陽節，登高放風箏，也是敬老節。手指在畫面<b>下方</b>左右移動控制方向，<b>往下拉</b>風箏就飛高，去吃天上的金幣。', 'temple');
    const spawn = () => { const c = { x: rand(50, 310), y: rand(90, 330), el: null }; cG.insertAdjacentHTML('beforeend', `<g transform="translate(${c.x.toFixed(0)} ${c.y.toFixed(0)})">${coin}</g>`); c.el = cG.lastElementChild; coins.push(c); };
    spawn(); spawn();
    st.touch({
      down(p) { lastY = p.y; pulling = true; },
      move(p) { tx = clamp(p.x, 40, 320); if (lastY !== null && p.y > lastY) ky -= (p.y - lastY) * 1.1; lastY = p.y; },
      up() { pulling = false; lastY = null; },
    });
    loop(st, (dt, t) => {
      kx += (tx - kx) * Math.min(1, dt * 1.8);
      ky += (pulling ? 6 : 22) * dt; // 不拉會慢慢掉
      ky = clamp(ky, 70, 480);
      const sway = Math.sin(t / 500) * 10;
      place(kEl, kx + sway, ky, 1, (tx - kx) * .15 + Math.sin(t / 300) * 5);
      line.setAttribute('x2', (kx + sway).toFixed(1)); line.setAttribute('y2', (ky + 40).toFixed(1));
      for (const c of [...coins]) {
        if (D([kx + sway, ky], [c.x, c.y]) < 34) {
          c.el.remove(); coins.splice(coins.indexOf(c), 1); got++; st.sfx.pop(); st.burst('star', c.x, c.y, 10); st.progress(got, N);
          st.floatText('+福', c.x, c.y - 10, '#C8382E');
          if (got >= N) { done(); return false; }
          spawn();
        }
      }
    });
    function done() {
      st.sfx.chime();
      st.later(500, () => o.done('風箏飛得好高，把福氣都收回來了。重陽敬老，今天記得問候家裡的長輩。'));
    }
    st.buttons([{ label: '幫我飛', on: () => { const c = coins[0]; if (c) { tx = c.x; ky = c.y; } } }]);
  },
};

export const GAMES = { duanwu, qixi, zhongyuan, zhongqiu, chongyang };

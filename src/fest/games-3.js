// 第三批節慶小遊戲：端午、七夕、中元、中秋、重陽
import { art, hasArt, clamp, rand, pick, place } from './core.js';
import { backdrop } from './games-1.js';
import tigerAwakeUrl from '../assets/tiger-awake.webp';
import tigerHappyUrl from '../assets/tiger-happy.webp';

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
      <circle cx="${HOOK[0]}" cy="${HOOK[1] - 46}" r="5" fill="#F3C64A"/>`, over: `<circle cx="${HOOK[0]}" cy="${HOOK[1] - 46}" r="5" fill="#F3C64A"/>` })}
      <ellipse cx="${BASE[0]}" cy="${BASE[1] + 2}" rx="40" ry="6" fill="#000" opacity=".12"/>
      <g id="egg"><g transform="translate(0 -34)">${art('dw-egg', 54, 72, egg)}</g></g>
      <g id="meter" transform="translate(180 500)"><rect x="-70" y="-6" width="140" height="12" rx="6" fill="#FFF" opacity=".7"/><rect id="meterFill" x="-70" y="-6" width="0" height="12" rx="6" fill="#3E9E86"/></g>
      <text x="180" y="560" text-anchor="middle" class="fest-tip">手指在這下面左右移，扶住蛋</text>
      <g id="sachet" class="fest-hit" filter="url(#fToy)" style="display:none">${art('dw-sachet', 60, 90, sachet)}</g>
      <g id="zong"></g>`);
    const eggEl = st.$('#egg');
    // 先包粽子，包好才立蛋
    ['#egg', '#meter'].forEach((k) => { st.$(k).style.display = 'none'; });
    st.$('#egg').previousElementSibling.style.display = 'none';
    st.$('#meter').nextElementSibling.style.display = 'none';
    phase = 'zong';
    zongzi(st, o, () => {
      ['#egg', '#meter'].forEach((k) => { st.$(k).style.display = ''; });
      st.$('#egg').previousElementSibling.style.display = '';
      st.$('#meter').nextElementSibling.style.display = '';
      phase = 'egg'; startEgg();
    });
    function startEgg() {
    st.progress(3, 5);
    st.say(`粽子掛好了！接著<b>正午立蛋</b>！${noon ? '現在剛好是<b>正午</b>，陽氣最旺，蛋特別好立。' : '（正午 11 點到 1 點玩會比較好立。）'}手指按在<b>蛋的下方</b>，蛋往哪邊倒，手指就往哪邊輕輕移，撐 2.5 秒就成功。`, 'temple');
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
    st.buttons([{ label: '幫我扶', on: () => { if (phase === 'egg') { a = 0; w = 0; stood(); } } }]); // 以前只設 ok = NEED，下一格就被扣掉，按了沒反應
    }
    function stood() {
      phase = 'sachet'; place(eggEl, BASE[0], BASE[1]); st.sfx.chime(); st.burst('star', BASE[0], BASE[1] - 40, 16);
      st.progress(4, 5); st.floatText('立起來了！', BASE[0], BASE[1] - 90, '#C8382E');
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
      if (fin) return; fin = true; st.buttons([]); st.sfx.pop(); st.progress(5, 5);
      st.burst('spark', HOOK[0], HOOK[1], 12, { color: '#F3C64A' });
      st.later(600, () => o.done(`親手包的粽子、${noon ? '正午' : ''}立起來的蛋、門上的香包，端午三件事都做到了。記得多喝水，夏天平平安安。`));
    }
  },
};

/* ---------- 包粽子：竹葉捲成漏斗 → 放料 → 摺起來 → 綁繩子 ---------- */
const ZFILL = [
  { id: 'pork', name: '滷肉', c: '#7A3A1E' }, { id: 'mush', name: '香菇', c: '#4A2E1E' }, { id: 'yolk', name: '鹹蛋黃', c: '#F0A020' },
  { id: 'peanut', name: '花生', c: '#D8A868' }, { id: 'chestnut', name: '栗子', c: '#B8742E' }, { id: 'shrimp', name: '蝦米', c: '#F08A6A' },
];
function zongzi(st, o, next) {
  const C = [180, 440], TRAY = ZFILL.map((_, i) => [52 + i * 51, 590]);
  const z = st.$('#zong');
  const riceTex = (y0, h) => Array.from({ length: 16 }, () => `<ellipse cx="${rand(-30, 30).toFixed(1)}" cy="${(y0 + rand(0, h)).toFixed(1)}" rx="3" ry="1.8" fill="#FFFDF4" stroke="#E8E0C8" stroke-width=".5"/>`).join('');
  z.innerHTML = `
    <g id="zLeaf" transform="translate(${C[0]} ${C[1]})">
      <path id="zLeafFlat" d="M-110 30 Q-20 -30 110 -10 Q20 30 -110 30Z" fill="#5E9A4A" stroke="#3E7A2E" stroke-width="2"/>
      <path id="zLeafFlat2" d="M-110 50 Q-10 0 110 16 Q10 56 -110 50Z" fill="#6BAA55" stroke="#3E7A2E" stroke-width="2"/>
      <g id="zCone" opacity="0">
        <path d="M-52 -60 L0 60 L52 -60Z" fill="#5E9A4A" stroke="#3E7A2E" stroke-width="2.5"/>
        <clipPath id="zClip"><path d="M-48 -58 L0 52 L48 -58Z"/></clipPath>
        <g clip-path="url(#zClip)"><g id="zIn"></g></g>
        <path d="M-52 -60 Q0 -48 52 -60" stroke="#8ACB6E" stroke-width="3" fill="none"/>
        <path d="M-30 -40 L0 40 M24 -50 L4 30" stroke="#3E7A2E" stroke-width="1" opacity=".5"/>
      </g>
      <g id="zDone" opacity="0">
        <path d="M-58 36 L0 -58 L58 36 Q0 50 -58 36Z" fill="#5E9A4A" stroke="#3E7A2E" stroke-width="2.5"/>
        <path d="M-30 -10 L30 30 M10 -40 L-20 36" stroke="#3E7A2E" stroke-width="1.2" opacity=".5"/>
        <g id="zStr"></g>
      </g>
    </g>
    <g id="zRice" class="fest-hit" data-nograb transform="translate(300 520)"><ellipse cx="0" cy="8" rx="30" ry="9" fill="#C8A878"/><ellipse rx="30" ry="12" fill="#FFFDF4" stroke="#D8C8A8"/>${riceTex(-8, 14)}<text y="30" text-anchor="middle" class="fest-small" fill="#5A3A20">糯米</text></g>
    ${ZFILL.map((f, i) => `<g id="zf-${f.id}" class="fest-hit" data-nograb filter="url(#fToy)" transform="translate(${TRAY[i][0]} ${TRAY[i][1]})">${art('dw-' + f.id, 40, 34, `<circle r="15" fill="#FFF" stroke="#D8C8B0"/>${f.id === 'yolk' ? '<circle r="9" fill="#F0A020"/>' : f.id === 'pork' ? '<rect x="-10" y="-7" width="20" height="14" rx="4" fill="#7A3A1E"/><rect x="-10" y="-2" width="20" height="3" fill="#F4E0C0"/>' : `${[[-5, -3], [5, -4], [0, 5], [-6, 5], [6, 4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${f.c}"/>`).join('')}`}`)}<text y="30" text-anchor="middle" class="fest-small" fill="#5A3A20">${f.name}</text></g>`).join('')}
    <g id="zPad" opacity="0" pointer-events="none"><circle cx="${C[0]}" cy="${C[1] + 120}" r="48" fill="none" stroke="#FFF4D8" stroke-width="3" stroke-dasharray="8 8"/><text x="${C[0]}" y="${C[1] + 126}" text-anchor="middle" class="fest-tip">在這裡畫圈綁繩</text></g>`;
  ['#zRice', ...ZFILL.map((f) => '#zf-' + f.id)].forEach((k) => { st.$(k).style.display = 'none'; });
  let phase = 'leaf', layers = [], rice = 0, fy0 = null, acc = 0, lastA = null;
  st.progress(0, 5);
  st.say('五月初五端午節！先<b>包粽子</b>：手指按住竹葉<b>往上滑</b>，把兩片竹葉捲成漏斗。', 'temple');
  st.buttons([{ label: '幫我捲', on: () => cone() }]);
  st.zoom(180, 480, 300);
  function cone() {
    if (phase !== 'leaf') return; phase = 'fill';
    st.sfx.pop(); st.$('#zLeafFlat').style.display = 'none'; st.$('#zLeafFlat2').style.display = 'none';
    st.tween(300, (k) => st.$('#zCone').setAttribute('opacity', k.toFixed(2)));
    ['#zRice', ...ZFILL.map((f) => '#zf-' + f.id)].forEach((k) => { st.$(k).style.display = ''; });
    st.progress(1, 5);
    st.say('竹葉捲好了。先放一匙<b>糯米</b>墊底，再放<b>三樣</b>喜歡的料，最後再蓋一層糯米。點一下就會放進去。', 'temple');
    st.buttons([{ label: '幫我放料', on: () => {
      const tap = (k) => st.$(k).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      if (!rice) tap('#zRice');
      ZFILL.filter((f) => !layers.includes(f.id)).slice(0, Math.max(0, 3 - layers.length)).forEach((f) => tap('#zf-' + f.id));
      tap('#zRice');
    } }]);
  }
  const levelY = () => 50 - (rice * 16 + layers.length * 13);
  const addLayer = (c, h, tex) => { const y = levelY() - h; st.$('#zIn').insertAdjacentHTML('beforeend', `<g><rect x="-50" y="${y}" width="100" height="${h + 2}" fill="${c}"/>${tex || Array.from({ length: 6 }, () => `<circle cx="${rand(-26, 26).toFixed(1)}" cy="${(y + rand(2, h)).toFixed(1)}" r="${rand(2.5, 4.5).toFixed(1)}" fill="rgb(0 0 0 / .18)"/>`).join('')}</g>`); st.emit('spark', C[0] + rand(-20, 20), C[1] + y, { color: '#FFFDF4', speed: 30, life: .5 }); st.sfx.pop(); };
  st.$('#zRice').addEventListener('click', () => {
    if (phase !== 'fill') return;
    if (rice === 0) { addLayer('#FFF8E8', 16, riceTex(levelY() - 16, 14)); rice = 1; st.say('糯米墊好了。再放<b>三樣料</b>。', 'temple'); return; }
    if (layers.length < 3) { st.say(`料還不夠，再放 ${3 - layers.length} 樣（滷肉、香菇、蛋黃……）。`, 'temple'); return; }
    addLayer('#FFF8E8', 16, riceTex(levelY() - 16, 14)); rice = 2; phase = 'fold'; st.progress(2, 5);
    ['#zRice', ...ZFILL.map((f) => '#zf-' + f.id)].forEach((k) => { st.$(k).style.display = 'none'; });
    st.say('滿滿一包！手指在粽子上<b>往下滑</b>，把竹葉蓋下來摺好。', 'temple');
    st.buttons([{ label: '幫我摺', on: fold }]);
  });
  ZFILL.forEach((f) => st.$('#zf-' + f.id).addEventListener('click', (e) => {
    if (phase !== 'fill') return;
    if (!rice) { st.say('先放一匙<b>糯米</b>墊底喔（右邊那碗）。', 'temple'); return; }
    if (layers.includes(f.id) || layers.length >= 4) return;
    layers.push(f.id); addLayer(f.c + '', 12); e.currentTarget.setAttribute('opacity', '.35');
    st.say(layers.length >= 3 ? `放了${layers.map((id) => ZFILL.find((x) => x.id === id).name).join('、')}。最後再<b>蓋一層糯米</b>（點糯米）。` : `${f.name}放好了，再放 ${3 - layers.length} 樣。`, 'temple');
  }));
  function fold() {
    if (phase !== 'fold') return; phase = 'tie';
    st.sfx.pop();
    st.tween(320, (k) => { st.$('#zCone').setAttribute('opacity', (1 - k).toFixed(2)); st.$('#zDone').setAttribute('opacity', k.toFixed(2)); });
    st.progress(2, 5); st.$('#zPad').setAttribute('opacity', '1');
    st.say('摺好了！最後用棉繩綁緊：手指在粽子<b>下面的圈圈</b>裡<b>畫圈</b>，繞三圈。', 'temple');
    st.buttons([{ label: '幫我綁', on: () => { acc = 99; tie(); } }]);
  }
  function tie() {
    const turns = Math.min(3, Math.floor(acc / (Math.PI * 2)));
    st.$('#zStr').innerHTML = Array.from({ length: turns }, (_, i) => `<path d="M-50 ${14 - i * 18} Q0 ${26 - i * 18} 50 ${14 - i * 18}" stroke="#F4ECD8" stroke-width="3.2" fill="none"/>`).join('') + (turns >= 3 ? '<path d="M0 -58 v-60" stroke="#F4ECD8" stroke-width="3"/>' : '');
    if (turns >= 3 && phase === 'tie') {
      phase = 'done'; st.$('#zPad').setAttribute('opacity', '0'); st.buttons([]);
      st.sfx.chime(); st.burst('star', C[0], C[1] - 20, 14); st.floatText('粽子包好了！', C[0], C[1] - 90, '#3E7A2E');
      st.progress(3, 5);
      // 粽子提起來，掛到牆上的釘子旁邊，畫面讓給立蛋
      st.later(900, () => { const zl = st.$('#zLeaf'); st.tween(700, (k, e) => zl.setAttribute('transform', `translate(${C[0] + (226 - C[0]) * e} ${C[1] + (262 - C[1]) * e}) scale(${1 - e * .5})`), () => { st.reset(); next(); }); });
    }
  }
  st.touch({
    down(p) { fy0 = p; lastA = null; },
    move(p) {
      if (phase === 'leaf' && fy0 && fy0.y - p.y > 60) { fy0 = null; cone(); return; }
      if (phase === 'fold' && fy0 && p.y - fy0.y > 50) { fy0 = null; fold(); return; }
      if (phase !== 'tie') return;
      const dx = p.x - C[0], dy = p.y - (C[1] + 120), r = Math.hypot(dx, dy);
      if (r < 10 || r > 140) { lastA = null; return; }
      const a = Math.atan2(dy, dx);
      if (lastA !== null) { let d = a - lastA; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; acc += Math.abs(d); }
      lastA = a; tie();
    },
    up() { fy0 = null; },
  });
}

/* ================= 七夕：搭鵲橋 ================= */
const magpie = `${hit(50, 40)}<ellipse rx="16" ry="10" fill="#2A2A3A"/><ellipse cx="2" cy="3" rx="9" ry="6" fill="#FFF"/><circle cx="14" cy="-6" r="7" fill="#2A2A3A"/><circle cx="16" cy="-7" r="1.6" fill="#FFF"/><path d="M20 -6 l6 1 -6 2z" fill="#F3C64A"/><path d="M-14 -2 l-14 -4 2 8z" fill="#3A4A7A"/><path d="M-4 -6 Q-2 -22 10 -14" fill="#3A4A7A"/>`;
const star = (c) => `<circle r="20" fill="url(#fGlow)"/><path d="M0-12 3-4 12-4 5 2 8 11 0 6-8 11-5 2-12-4-3-4z" fill="${c}"/>`;

// 牛郎、織女（有 Gemini 圖 qx-niulang / qx-zhinu 就換掉；原點在腳底中間）
const niulang = (w, h) => `<g transform="translate(0 ${-h / 2}) scale(${(h / 120).toFixed(3)})">
  <ellipse cy="58" rx="22" ry="5" fill="#000" opacity=".2"/>
  <path d="M-18 56 L-14 10 Q0 2 14 10 L18 56Z" fill="#5A7AB8"/><path d="M-18 56 L-14 10 L0 16 L0 58Z" fill="#4A6AA8"/>
  <rect x="-16" y="30" width="32" height="6" fill="#8A5A2E"/>
  <path d="M-14 14 L-26 40M14 14 L26 40" stroke="#5A7AB8" stroke-width="8" stroke-linecap="round"/><circle cx="-26" cy="42" r="5" fill="#FFE0C4"/><circle cx="26" cy="42" r="5" fill="#FFE0C4"/>
  <circle cy="-12" r="22" fill="#FFE0C4"/><path d="M-22 -16 Q-20 -36 0 -36 Q20 -36 22 -16 Q12 -26 0 -24 Q-12 -26 -22 -16Z" fill="#2A1A12"/>
  <ellipse cy="-30" rx="34" ry="7" fill="#D8B060"/><path d="M-16 -32 Q0 -52 16 -32Z" fill="#E8C070"/>
  <circle cx="-8" cy="-10" r="2.6" fill="#2A1A12"/><circle cx="8" cy="-10" r="2.6" fill="#2A1A12"/><path d="M-5 -1 Q0 3 5 -1" stroke="#B05A40" stroke-width="2" fill="none"/>
  <ellipse cx="-13" cy="-3" rx="4" ry="2.4" fill="#F79B8E" opacity=".6"/><ellipse cx="13" cy="-3" rx="4" ry="2.4" fill="#F79B8E" opacity=".6"/></g>`;
const zhinu = (w, h) => `<g transform="translate(0 ${-h / 2}) scale(${(h / 120).toFixed(3)})">
  <ellipse cy="58" rx="24" ry="5" fill="#000" opacity=".2"/>
  <path d="M-24 58 Q-18 20 -12 10 Q0 4 12 10 Q18 20 24 58Z" fill="#F2A0C0"/><path d="M-6 10 L0 58 L6 10" fill="#FFE0EC"/>
  <path d="M-40 20 Q-20 0 0 14 Q20 0 40 20" stroke="#B8D8FF" stroke-width="4" fill="none" opacity=".8"/>
  <path d="M-12 14 L-22 38M12 14 L22 38" stroke="#F2A0C0" stroke-width="8" stroke-linecap="round"/><circle cx="-22" cy="40" r="5" fill="#FFE0C4"/><circle cx="22" cy="40" r="5" fill="#FFE0C4"/>
  <circle cy="-12" r="22" fill="#FFE0C4"/><path d="M-22 -10 Q-24 -36 0 -36 Q24 -36 22 -10 Q14 -24 0 -24 Q-14 -24 -22 -10Z" fill="#2A1A12"/>
  <circle cx="-14" cy="-36" r="9" fill="#2A1A12"/><circle cx="14" cy="-36" r="9" fill="#2A1A12"/><path d="M-6 -36 l-4 -10 M6 -36 l4 -10" stroke="#F3C64A" stroke-width="2.4"/><circle cx="16" cy="-30" r="3" fill="#FF8AB0"/>
  <circle cx="-8" cy="-10" r="2.6" fill="#2A1A12"/><circle cx="8" cy="-10" r="2.6" fill="#2A1A12"/><path d="M-5 -1 Q0 3 5 -1" stroke="#D05A70" stroke-width="2" fill="none"/>
  <ellipse cx="-13" cy="-3" rx="4" ry="2.4" fill="#F79B8E" opacity=".7"/><ellipse cx="13" cy="-3" rx="4" ry="2.4" fill="#F79B8E" opacity=".7"/></g>`;
const needle = `<path d="M0 -70 L3 60 L0 72 L-3 60Z" fill="#D8DCE4" stroke="#8A909A" stroke-width="1"/><ellipse id="eye" cy="-54" rx="2.2" ry="7" fill="#1A1A3A" stroke="#8A909A" stroke-width="1"/>`;

const qixi = {
  play(st, o) {
    const N = 7, SLOTS = Array.from({ length: N }, (_, i) => { const k = (i + 1) / (N + 1); return [40 + 280 * k, 330 - Math.sin(k * Math.PI) * 70]; });
    const NL = [42, 372], ZN = [318, 372];
    let filled = 0, phase = 'bridge';
    st.set(`${backdrop('qixi', { wall: ['#14143A', '#3A2A5A'], table: 645, extra: `
      ${Array.from({ length: 50 }, () => `<circle cx="${rand(0, 360)}" cy="${rand(0, 645)}" r="${rand(.5, 1.6)}" fill="#FFF8D8" opacity="${rand(.3, .9)}"/>`).join('')}
      <path d="M150 0 C120 200 240 400 190 645 L250 645 C300 400 180 200 210 0Z" fill="#B8C8FF" opacity=".18"/>` })}
      <g id="bridge"></g>
      ${SLOTS.map(([x, y], i) => `<circle id="qs${i}" cx="${x}" cy="${y}" r="15" fill="none" stroke="#FFF4D8" stroke-width="2" stroke-dasharray="4 4" opacity=".6"/>`).join('')}
      <g id="niulang">${art('qx-niulang', 70, 110, niulang)}</g>
      <g id="zhinu">${art('qx-zhinu', 70, 110, zhinu)}</g>
      <text x="${NL[0]}" y="${NL[1] + 22}" text-anchor="middle" class="fest-tip" id="nlT">牛郎</text><text x="${ZN[0]}" y="${ZN[1] + 22}" text-anchor="middle" class="fest-tip" id="znT">織女</text>
      <g id="birds"></g>
      <g id="qiao" style="display:none"></g>`);
    const nl = st.$('#niulang'), zn = st.$('#zhinu');
    place(nl, ...NL); place(zn, ...ZN);
    st.progress(0, N + 3);
    st.say('七夕，牛郎和織女隔著銀河一年才見一次。天上飛過的<b>喜鵲</b>，<b>點一下</b>牠就會飛去搭橋。搭滿七隻，鵲橋就通了！', 'temple');
    // 喜鵲一群一群從兩邊飛過，點到的飛去橋上
    const birds = [], layer = st.$('#birds');
    let spawn = .3;
    const spawnBird = () => {
      const fromL = Math.random() < .5, y = rand(150, 560), sp = rand(60, 110) * (fromL ? 1 : -1);
      layer.insertAdjacentHTML('beforeend', `<g class="fest-hit" data-nograb>${art('qx-magpie', 52, 40, magpie)}</g>`);
      const el = layer.lastElementChild, b = { el, x: fromL ? -30 : 390, y, vx: sp, ph: rand(0, 6), free: true };
      el.addEventListener('pointerdown', (e) => { e.stopPropagation(); catchBird(b); });
      birds.push(b);
    };
    function catchBird(b) {
      if (!b.free || phase !== 'bridge' || filled >= N) return;
      b.free = false; b.el.dataset.caught = '1'; const s = SLOTS[filled], from = [b.x, b.y], i = filled++;
      st.sfx.pop(); st.burst('star', b.x, b.y, 6, { color: '#FFE0F0' });
      st.tween(500, (k, e) => place(b.el, from[0] + (s[0] - from[0]) * e, from[1] + (s[1] - from[1]) * e - Math.sin(k * Math.PI) * 30, 1, 0), () => {
        st.$('#qs' + i).setAttribute('opacity', '0');
        st.$('#bridge').insertAdjacentHTML('beforeend', `<ellipse cx="${s[0]}" cy="${s[1] + 10}" rx="26" ry="7" fill="#FFF4D8" opacity=".25"/>`);
        st.progress(i + 1, N + 3);
        if (i + 1 === N) meet();
      });
    }
    loop(st, (dt, t) => {
      if (phase === 'bridge' && filled < N) { spawn -= dt; if (spawn <= 0) { spawnBird(); spawn = rand(.55, 1.1); } }
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i]; if (!b.free) continue;
        b.x += b.vx * dt; b.ph += dt * 6;
        place(b.el, b.x, b.y + Math.sin(b.ph) * 8, 1, Math.sin(b.ph * 2) * 8);
        b.el.setAttribute('transform', b.el.getAttribute('transform') + (b.vx < 0 ? ' scale(-1 1)' : ''));
        if (b.x < -50 || b.x > 410) { b.el.remove(); birds.splice(i, 1); }
      }
      return phase === 'bridge' || birds.some((b) => b.free);
    });
    let met = false;
    function meet() {
      if (met) return; met = true; phase = 'meet';
      birds.forEach((b) => { if (b.free) { b.free = false; b.el.remove(); } });
      st.buttons([]); st.sfx.bowl();
      ['#nlT', '#znT'].forEach((k) => st.$(k).setAttribute('opacity', '0'));
      st.say('鵲橋搭好了！牛郎和織女踏上橋，朝對方走過去……', 'temple');
      const path = (e, from, to) => { const x = from + (to - from) * e, k = (x - 40) / 280; return [x, 340 - Math.sin(clamp(k, 0, 1) * Math.PI) * 70 + 22]; };
      st.zoom(180, 300, 300, 1200);
      st.tween(2600, (k, e) => { place(nl, ...path(e, NL[0], 160), 1, Math.sin(k * 40) * 3); place(zn, ...path(e, ZN[0], 200), 1, Math.sin(k * 40 + 1) * 3); }, () => {
        st.burst('heart', 180, 250, 22, { color: '#FF8AB0' }); st.sfx.chime();
        st.floatText('鵲橋相會', 180, 200, '#FFE0F0'); st.progress(N + 1, N + 3);
        st.later(1400, qiqiao);
      });
    }
    // 七夕「乞巧」：月光下穿針，穿過針孔就是向織女討到一雙巧手
    function qiqiao() {
      phase = 'needle'; st.reset();
      const q = st.$('#qiao'); q.style.display = '';
      q.innerHTML = `<rect y="360" width="360" height="285" fill="#0E0E2A" opacity=".5"/><circle cx="290" cy="120" r="34" fill="#FFF2C0"/>
        <g id="ndl" transform="translate(180 470)">${needle}</g>
        <path id="thread" d="" stroke="#FF6A8A" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <text x="180" y="590" text-anchor="middle" class="fest-tip" id="ndlTip">線頭對準針孔時點一下</text>`;
      let n = 0, x = 0, t0 = performance.now(), sp = 1.6, wait = false;
      st.say('牛郎織女見面了。七夕也叫<b>乞巧節</b>：女孩子在月光下穿針，向織女求一雙巧手。線頭會左右晃，<b>對準針孔的時候點一下</b>，穿過三根針！', 'temple');
      const draw = () => { st.$('#thread').setAttribute('d', `M${(180 + x - 60).toFixed(1)} 560 Q${(180 + x - 20).toFixed(1)} 470 ${(180 + x).toFixed(1)} 416`); };
      loop(st, (dt, t) => { if (phase !== 'needle') return false; if (!wait) { x = Math.sin((t - t0) / 1000 * sp * 2.2) * 70; draw(); } return true; });
      const go = () => {
        if (phase !== 'needle' || wait) return;
        wait = true;
        if (Math.abs(x) < 9) {
          n++; st.sfx.chime(); st.burst('star', 180, 416, 12, { color: '#FFB8D8' }); st.floatText(['巧！', '更巧！', '心靈手巧！'][n - 1], 180, 380, '#FFE0F0');
          st.progress(N + 1 + Math.min(2, n), N + 3);
          if (n >= 3) { phase = 'end'; st.later(800, end); return; }
          st.later(700, () => { wait = false; sp += .5; t0 = performance.now(); st.$('#ndlTip').textContent = `第 ${n + 1} 根針`; });
        } else { st.sfx.knock(); st.floatText('差一點', 180 + x, 390, '#B8D8FF'); st.later(500, () => { wait = false; }); }
      };
      st.touch({ down: go });
      st.buttons([{ label: '穿！', primary: true, on: go }, { label: '幫我穿', on: () => { x = 0; wait = false; go(); } }]);
    }
    function end() {
      st.buttons([]);
      o.done('鵲橋搭好，牛郎織女見面了，你也向織女乞到一雙巧手。七夕也是七娘媽生，保佑小朋友平安長大。想求姻緣，可以去月老閣走走。');
      st.later(50, () => st.buttons([{ label: '去月老閣', primary: true, on: () => o.goHall('yue') }, { label: '回到殿裡', on: () => o.goHall(null) }]));
    }
    st.buttons([{ label: '幫我搭', on: () => { while (filled < N) { const b = { el: st.add(`<g>${art('qx-magpie', 52, 40, magpie)}</g>`), x: rand(0, 360), y: 600, free: true }; catchBird(b); } } }]);
  },
};

/* ================= 中秋：剝柚子、柚子帽給虎爺 ================= */
const pomelo = (p) => `<circle r="56" fill="#F7EBD0"/>${Array.from({ length: 10 }, (_, i) => `<path d="M0 0 L${(Math.cos(i / 10 * 6.283) * 50).toFixed(1)} ${(Math.sin(i / 10 * 6.283) * 50).toFixed(1)}" stroke="#F0D8A8" stroke-width="2"/>`).join('')}
  ${hasArt('zq-pomelo') ? `<g id="peel" transform="translate(4 -2)">${art('zq-pomelo', 124, 127, '')}</g><path id="peelHi" opacity="0"` : `<circle id="peel" r="60" fill="#B8D86A" stroke="#8AAE4A" stroke-width="3"/><path id="peelHi"`} d="M-30 -30 q10 -14 26 -16" stroke="#E0F0A8" stroke-width="6" fill="none" stroke-linecap="round"/>`;
const hat = `${hit(110, 70)}<path d="M-52 18 Q-56 -40 0 -44 Q56 -40 52 18 Q0 30 -52 18Z" fill="#B8D86A" stroke="#8AAE4A" stroke-width="3"/><path d="M-50 16 Q0 26 50 16" stroke="#F7EBD0" stroke-width="6" fill="none"/><path d="M0 -44 q-4 -14 6 -22" stroke="#6A8A3A" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="12" cy="-62" rx="10" ry="5" fill="#7BB35A" transform="rotate(-20 12 -62)"/>`;

const zhongqiu = {
  play(st, o) {
    const POM = [180, 320], TIGER = [282, 548], HEAD = [276, 484];
    let acc = 0, lastA = null, phase = 'peel';
    st.set(`${backdrop('zhongqiu', { wall: ['#1E2440', '#3A3050'], table: 430, tableColor: ['#8A6A4A', '#5A4430'], extra: `<circle id="moon" cx="280" cy="100" r="46" fill="#FFF0B8" opacity=".75"/><circle cx="280" cy="100" r="70" fill="#FFF0B8" opacity=".12"/>`, over: `<circle id="moon" cx="280" cy="100" r="46" fill="url(#fGlow)" opacity="0"/>` })}
      <circle id="ring" cx="${POM[0]}" cy="${POM[1]}" r="96" fill="none" stroke="#FFF4D8" stroke-width="3" stroke-dasharray="8 8" opacity=".6"/>
      <g id="pom" transform="translate(${POM[0]} ${POM[1]})">${pomelo()}</g>
      <g id="tiger" transform="translate(${TIGER[0]} ${TIGER[1]})">${img(tigerAwakeUrl, 140, 168)}</g>
      <g id="hat" class="fest-hit" filter="url(#fToy)" style="display:none">${art('zq-hat', 100, 90, hat)}</g>
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

export const GAMES = { duanwu, qixi, zhongqiu, chongyang };

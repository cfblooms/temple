// 第四批節慶小遊戲：尾牙（臘月十六）夾刈包
import { art, clamp, rand, place } from './core.js';
import { backdrop } from './games-1.js';
import godTudi from '../assets/gods/tudigong.webp';

const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function flyTo(st, el, from, to, ms, s0 = 1, s1 = 1, done) {
  st.tween(ms, (k, e) => place(el, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(k * Math.PI) * 20, s0 + (s1 - s0) * e), done);
}

/* ================= 尾牙：夾刈包 ================= */
// 刈包又叫「虎咬豬」：張開像老虎的嘴，咬住一塊滷肉，把一整年的壞運咬掉；形狀也像錢包，把財氣包起來。
// 流程：滷肉、酸菜拖進刈包 → 花生粉在上面左右搖著撒 → 香菜可加可不加 → 往下滑夾起來 → 端上供桌拜土地公 → 拿回來咬三口。
// 美術：wy-bun-open（張開的空刈包）、wy-gua（夾好的刈包）、wy-pork（一片滷五花）、wy-suancai（一小堆酸菜）；花生粉、香菜沿用清明潤餅的 rb-peanut、rb-cilantro。
const bunOpen = () => `<path d="M-92 6C-98-46-50-62 0-62S98-46 92 6Z" fill="#FFFBF2" stroke="#E6DAC4" stroke-width="2"/>
  <path d="M-70-6C-60-40 60-40 70-6" stroke="#F1E6D2" stroke-width="3" fill="none"/>
  <path d="M-96 6C-100 48-50 58 0 58S100 48 96 6C60 18-60 18-96 6Z" fill="#FBF4E6" stroke="#E6DAC4" stroke-width="2"/>
  <ellipse cy="10" rx="88" ry="14" fill="#F6EDDC"/>`;
const bunShut = () => `<path d="M-94 22C-100-40-50-58 0-58S100-40 94 22C60 40-60 40-94 22Z" fill="#FFFBF2" stroke="#E6DAC4" stroke-width="2"/>
  <path d="M-88 18C-50 30 50 30 88 18" stroke="#7A3A1E" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M-80 22C-40 32 40 32 80 22" stroke="#C9A030" stroke-width="5" stroke-linecap="round" fill="none" stroke-dasharray="10 6"/>
  <path d="M-60 24l-6 8M-20 28l-4 9M30 28l5 8M66 22l7 7" stroke="#4E9A3E" stroke-width="5" stroke-linecap="round"/>
  <path d="M-70-10C-60-40 60-40 70-10" stroke="#F1E6D2" stroke-width="3" fill="none"/>`;
const pork = () => `<rect x="-56" y="-16" width="112" height="32" rx="10" fill="#8A4220"/><rect x="-52" y="-7" width="104" height="6" rx="3" fill="#F4DDB4"/><rect x="-52" y="5" width="104" height="5" rx="2.5" fill="#F4DDB4" opacity=".8"/><rect x="-56" y="-16" width="112" height="7" rx="4" fill="#5E2A12"/>`;
const suancai = () => Array.from({ length: 16 }, (_, k) => `<path d="M${-44 + (k % 8) * 12} ${-6 + Math.floor(k / 8) * 9}q6-7 12 0" stroke="${k % 3 ? '#7E8A2C' : '#A8A23A'}" stroke-width="6" stroke-linecap="round" fill="none"/>`).join('');
const cilantro = () => [-40, -14, 14, 40].map((x, i) => `<g transform="translate(${x} ${i % 2 ? -4 : 2}) rotate(${i * 40 - 60})"><path d="M0 0v-12" stroke="#3E7A2E" stroke-width="2"/><circle cx="-4" cy="-14" r="5" fill="#4E9A3E"/><circle cx="4" cy="-15" r="5" fill="#5EAA4A"/><circle cy="-20" r="5" fill="#4E9A3E"/></g>`).join('');
const dish = `<ellipse cy="10" rx="34" ry="12" fill="#FFFFFF" stroke="#D8C8B0" stroke-width="2"/>`;

const WY = [
  { id: 'pork', name: '滷肉', need: true, tray: () => `${dish}<g transform="scale(.48)">${art('wy-pork', 130, 70, pork)}</g>`, on: () => art('wy-pork', 132, 60, pork), dy: -4 },
  { id: 'suancai', name: '酸菜', need: true, tray: () => `${dish}<g transform="scale(.6)">${art('wy-suancai', 100, 50, suancai)}</g>`, on: () => art('wy-suancai', 118, 44, suancai), dy: -16 },
  { id: 'peanut', name: '花生粉', need: true, tray: () => art('rb-peanut', 70, 50, `${dish}<ellipse cy="2" rx="24" ry="10" fill="#D8A868"/>`) },
  { id: 'cilantro', name: '香菜', need: false, tray: () => art('rb-cilantro', 70, 52, `${dish}<g transform="scale(.6)">${cilantro()}</g>`), on: cilantro, dy: -24 },
];

const weiya = {
  play(st, o) {
    const BUN = [180, 384], ALTAR = [180, 238], REST = [[52, 548], [136, 556], [224, 556], [308, 548]];
    let phase = 'fill', pos = [0, 0], fold = 0, startY = null, sprinkle = 0, bites = 0;
    const laid = new Set();
    st.set(`${backdrop('weiya', { wall: ['#F6D9B0', '#E8B888'], table: 470, tableColor: ['#B97A48', '#8A5430'], extra: `
      ${[46, 314].map((x) => `<g transform="translate(${x} 70)"><path d="M0-40v14" stroke="#7A3A1A" stroke-width="2"/><ellipse rx="22" ry="26" fill="#E0443E"/><path d="M0-26c-10 8-10 44 0 52M0-26c10 8 10 44 0 52" stroke="#FFB43A" stroke-width="1.6" fill="none"/><rect x="-10" y="-30" width="20" height="6" rx="2" fill="#F3C64A"/><rect x="-10" y="24" width="20" height="6" rx="2" fill="#F3C64A"/><text y="6" text-anchor="middle" class="fest-small" fill="#FFE29A">${x < 180 ? '福' : '財'}</text></g>`).join('')}
      <circle cx="180" cy="118" r="78" fill="#FFE9A8" opacity=".45"/>
      <rect x="60" y="246" width="240" height="40" rx="6" fill="#A4352A"/><rect x="60" y="246" width="240" height="7" rx="3" fill="#D8574A"/>
      <path d="M78 286v40M282 286v40" stroke="#6A2418" stroke-width="10"/>
      <rect x="40" y="306" width="280" height="150" rx="18" fill="#D8B07A" opacity=".55"/>` })}
      <g id="halo" opacity="0"><circle cx="180" cy="118" r="80" fill="url(#fGlow)"/></g>
      <image href="${godTudi}" x="122" y="40" width="116" height="184" preserveAspectRatio="xMidYMax meet"/>
      <ellipse cx="${ALTAR[0]}" cy="${ALTAR[1] + 12}" rx="58" ry="12" fill="#FFF6E2" stroke="#E0C49A" stroke-width="2"/>
      <g id="open" transform="translate(${BUN[0]} ${BUN[1]})"><g id="openArt">${art('wy-bun-open', 210, 140, bunOpen)}</g><g id="fill"></g><g id="dust"></g></g>
      <defs><mask id="wyBite" maskUnits="userSpaceOnUse" x="-200" y="-200" width="400" height="400"><rect x="-200" y="-200" width="400" height="400" fill="#fff"/><g id="bites"></g></mask></defs>
      <g id="gua" class="fest-hit" data-nograb style="display:none" filter="url(#fToy)"><g mask="url(#wyBite)">${art('wy-gua', 200, 140, bunShut)}</g></g>
      ${WY.map((f) => `<g id="wy-${f.id}" class="fest-hit" data-nograb filter="url(#fToy)">${f.tray()}<text y="38" text-anchor="middle" class="fest-small" fill="#FFF4D8" stroke="#5A2A10" stroke-width="3" paint-order="stroke">${f.name}</text></g>`).join('')}
      <text id="tip" x="180" y="592" text-anchor="middle" class="fest-tip">按住料拖到刈包上</text>`);
    WY.forEach((f, i) => place(st.$('#wy-' + f.id), ...REST[i]));
    const tip = (t) => { st.$('#tip').textContent = t; };
    st.progress(0, 4);
    st.say('臘月十六<b>尾牙</b>，拜土地公吃刈包！刈包又叫「虎咬豬」，把壞運一口咬掉。把<b>滷肉、酸菜</b>拖進刈包，再拿<b>花生粉</b>在上面左右搖著撒。', 'temple');

    const need = () => WY.filter((f) => f.need && !laid.has(f.id));
    function check() {
      const left = need();
      if (left.length) { st.say(`再放${left.map((f) => `<b>${f.name}</b>`).join('、')}。${laid.has('cilantro') ? '' : '香菜可加可不加。'}`, 'temple'); return; }
      if (phase !== 'fill') return;
      st.progress(1, 4);
      st.say(`料都放好了${laid.has('cilantro') ? '，連香菜都有' : '（不加香菜也可以）'}。手指放在刈包<b>上面往下滑</b>，把它夾起來。`, 'temple');
      tip('在刈包上方往下滑');
      st.buttons([{ label: '夾起來', primary: true, on: autoFold }]);
    }
    function lay(f) {
      laid.add(f.id); st.$('#wy-' + f.id).style.display = 'none';
      if (f.on) st.$('#fill').insertAdjacentHTML('beforeend', `<g class="lay-${f.id}" transform="translate(${rand(-6, 6).toFixed(1)} ${f.dy})">${f.on()}</g>`);
      // 花生粉永遠撒在最上面
      const dust = st.$('#dust'); dust.parentNode.appendChild(dust);
      st.sfx.pop(); st.burst('star', BUN[0], BUN[1] - 20, 6);
      check();
    }

    WY.forEach((f, i) => {
      const el = st.$('#wy-' + f.id);
      const over = () => Math.abs(pos[0] - BUN[0]) < 100 && Math.abs(pos[1] - BUN[1]) < 60;
      let last = null;
      st.hold(el, {
        magnet: () => (laid.has(f.id) || phase !== 'fill' || f.id === 'peanut' ? null : [BUN[0], BUN[1], 90]),
        onStart() { if (!laid.has(f.id) && phase === 'fill') { st.zoom(180, 440, 280); last = null; } },
        onMove(x, y) {
          if (laid.has(f.id) || phase !== 'fill') return;
          pos = [x, y]; place(el, x, y, f.id === 'peanut' ? 1.1 : 1, f.id === 'peanut' && over() ? -25 : 0);
          // 花生粉：拿在刈包上面左右搖，粉就撒下去
          if (f.id !== 'peanut' || !over()) { last = null; return; }
          if (last) {
            const d = D(last, pos);
            sprinkle += d;
            if (d > 2 && Math.random() < .7) st.emit('spark', x + rand(-14, 14), y + 10, { vy: 90, vx: rand(-12, 12), g: 200, life: .5, color: '#D8A868', s1: 1 });
            const n = st.$('#dust').childElementCount;
            if (sprinkle / 16 > n && n < 46) st.$('#dust').insertAdjacentHTML('beforeend', `<circle cx="${rand(-60, 60).toFixed(1)}" cy="${rand(-30, 4).toFixed(1)}" r="${rand(1.6, 3.2).toFixed(1)}" fill="${Math.random() < .3 ? '#B8864A' : '#E2B878'}"/>`);
            if (sprinkle > 720) { pos = REST[i]; st.reset(); lay(f); st.floatText('香！', BUN[0], BUN[1] - 50, '#8A5430'); }
          }
          last = pos;
        },
        onUp() {
          if (laid.has(f.id) || phase !== 'fill') return; st.reset();
          if (f.id === 'peanut') {
            if (sprinkle > 0 && over()) st.say(`花生粉撒了${Math.round(sprinkle / 7.2)}%，<b>按住繼續左右搖</b>。`, 'temple');
            else st.say('花生粉要<b>拿在刈包上面左右搖</b>，才撒得下去。', 'temple');
            flyTo(st, el, pos, REST[i], 300); return;
          }
          if (over()) lay(f); else flyTo(st, el, pos, REST[i], 300);
        },
      });
    });

    // 往下滑夾起來：手指在刈包上方，上半片跟著往下蓋
    const open = st.$('#open'), gua = st.$('#gua');
    st.touch({
      down(p) { if (phase === 'fill' && !need().length && Math.abs(p.x - BUN[0]) < 130 && p.y < BUN[1] + 10 && p.y > BUN[1] - 170) { phase = 'fold'; startY = p.y; st.zoom(180, BUN[1], 280); } else if (phase === 'fold') startY = p.y - fold * 90; },
      move(p) { if (phase !== 'fold' || startY === null) return; fold = clamp((p.y - startY) / 90, fold, 1); drawFold(); if (fold >= 1) folded(); },
      up() { startY = null; },
    });
    function drawFold() {
      open.setAttribute('transform', `translate(${BUN[0]} ${BUN[1] + fold * 14}) scale(${(1 - fold * .08).toFixed(3)} ${(1 - fold * .55).toFixed(3)})`);
      st.$('#fill').setAttribute('opacity', (1 - fold * .8).toFixed(2));
    }
    function autoFold() { if (phase !== 'fill' && phase !== 'fold') return; st.buttons([]); phase = 'fold'; const run = () => { if (phase !== 'fold') return; fold = Math.min(1, fold + .06); drawFold(); if (fold >= 1) folded(); else st.later(30, run); }; run(); }
    function folded() {
      if (phase !== 'fold') return; phase = 'offer'; st.buttons([]); st.reset();
      open.style.display = 'none'; gua.style.display = ''; pos = [...BUN];
      st.tween(320, (k) => place(gua, BUN[0], BUN[1], .8 + Math.sin(k * Math.PI) * .25 + k * .2));
      st.sfx.chime(); st.burst('star', BUN[0], BUN[1], 12);
      st.floatText('虎咬豬！', BUN[0], BUN[1] - 64, '#8A5430');
      st.progress(2, 4);
      st.say('夾好了！先別急著吃，<b>按住刈包端上供桌</b>，請土地公先吃。', 'temple');
      tip('按住刈包拖到土地公面前');
      st.buttons([{ label: '端去拜土地公', primary: true, on: () => offer() }]);
    }

    st.hold(gua, {
      magnet: () => (phase === 'offer' ? [ALTAR[0], ALTAR[1], 80] : null),
      onStart() { if (phase === 'offer') st.zoom(180, 300, 310); else if (phase === 'eat') bite(); },
      onMove(x, y) { if (phase !== 'offer') return; pos = [x, y]; place(gua, x, y, .7); },
      onUp() {
        if (phase !== 'offer') return;
        if (D(pos, ALTAR) < 50) offer(true); else { st.reset(); flyTo(st, gua, pos, BUN, 300, .7, 1); pos = [...BUN]; }
      },
    });
    function offer(dropped) {
      if (phase !== 'offer') return; phase = 'pray'; st.buttons([]); tip('');
      const go = () => {
        place(gua, ALTAR[0], ALTAR[1], .6); st.zoom(180, 170, 260);
        st.sfx.knock?.(); st.progress(3, 4);
        const halo = st.$('#halo');
        st.tween(600, (k) => halo.setAttribute('opacity', k.toFixed(2)));
        st.later(400, () => { st.burst('star', 180, 120, 18); st.sfx.chime(); });
        st.say('土地公呵呵笑：「尾牙吃刈包，一年辛苦了！明年頭家疼你、生意興隆，錢包跟刈包一樣飽。」', 'god');
        st.later(2600, () => {
          st.tween(400, (k) => halo.setAttribute('opacity', (1 - k).toFixed(2)));
          flyTo(st, gua, ALTAR, BUN, 500, .6, 1, () => {
            phase = 'eat'; pos = [...BUN]; st.zoom(180, BUN[1], 260);
            st.say('拜完了，換你吃！<b>點刈包咬一口</b>，虎咬豬，把今年的壞運咬掉。', 'temple');
            tip('點刈包咬一口');
            st.buttons([{ label: '咬一口', primary: true, on: bite }]);
          });
        });
      };
      if (dropped) go(); else { st.zoom(180, 300, 310); flyTo(st, gua, BUN, ALTAR, 520, 1, .6, go); }
    }
    const BITES = [[78, -14], [56, -38], [86, 14]];
    function bite() {
      if (phase !== 'eat' || bites >= 3) return;
      const [bx, by] = BITES[bites++];
      // 咬一口：遮罩挖掉一個缺口（刈包內容座標是以中心為原點，大小 200x140）
      st.$('#bites').insertAdjacentHTML('beforeend', `<circle cx="${bx}" cy="${by}" r="30" fill="#000"/><circle cx="${bx - 16}" cy="${by + 22}" r="16" fill="#000"/>`);
      st.sfx.pop(); st.sfx.buzz?.(15);
      st.burst('spark', BUN[0] + bx * .9, BUN[1] + by * .9, 8, () => ({ color: Math.random() < .5 ? '#D8A868' : '#FFF6E2', g: 220, speed: rand(30, 80), life: .6 }));
      st.floatText(['好吃！', '壞運咬掉！', '飽了！'][bites - 1], BUN[0], BUN[1] - 70, '#8A5430');
      if (bites < 3) return;
      phase = 'end'; st.buttons([]); tip(''); st.reset(); st.progress(4, 4);
      st.later(900, () => o.done(`刈包吃完了！尾牙是一年最後一次「做牙」，拜土地公謝謝祂照顧一整年。刈包像老虎咬住豬肉，把壞運咬掉；也像錢包，把財氣包起來${laid.has('cilantro') ? '' : '（不加香菜，土地公也不會說什麼）'}。`));
    }
  },
};

export const GAMES = { weiya };

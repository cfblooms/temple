// 第二批節慶小遊戲：天公生、元宵、清明
import { art, hasArt, sitArt, clamp, rand, pick, place } from './core.js';
import { backdrop } from './games-1.js';
import { pickRiddles } from './riddles.js';

const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function flyTo(st, el, from, to, ms, s0 = 1, s1 = 1, done) {
  st.tween(ms, (k, e) => place(el, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(k * Math.PI) * 20, s0 + (s1 - s0) * e), done);
}
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/* ================= 天公生：擺頂桌 ================= */
// 天公吃素：六齋放「頂桌」，葷的和粿放「下桌」給從神；兩邊立甘蔗
const TG_ITEMS = [
  { id: 'mian', name: '麵線', top: true, draw: `<ellipse rx="20" ry="9" fill="#F7F0DC" stroke="#D8C8A0"/><path d="M-16 -2h32M-16 2h32" stroke="#E8DCC0"/><rect x="-4" y="-9" width="8" height="18" fill="#E0443E"/>` },
  { id: 'gu', name: '香菇', top: true, draw: `<ellipse cy="4" rx="7" ry="9" fill="#EBD7B8"/><path d="M-20 2C-20-14 20-14 20 2Z" fill="#8A5A34"/><circle cx="-6" cy="-6" r="2.4" fill="#C49A6A"/><circle cx="7" cy="-4" r="2" fill="#C49A6A"/>` },
  { id: 'jinzhen', name: '金針', top: true, draw: `${[-12, -4, 4, 12].map((x, i) => `<path d="M${x} 12 Q${x + 3} -2 ${x - 2} -14" stroke="#F09A2A" stroke-width="5" stroke-linecap="round" fill="none"/>`).join('')}<rect x="-16" y="4" width="32" height="5" rx="2" fill="#E0443E"/>` },
  { id: 'erh', name: '木耳', top: true, draw: `<path d="M-18 4C-22-12-4-16 0-6C4-16 22-12 18 4C10 14-10 14-18 4Z" fill="#3A2A2A"/><path d="M-10 0C-6-4 6-4 10 0" stroke="#5A4646" stroke-width="2" fill="none"/>` },
  { id: 'orange', name: '橘子塔', top: true, draw: `<defs><radialGradient id="tgOr" cx=".35" cy=".3"><stop offset="0" stop-color="#FFD27A"/><stop offset=".6" stop-color="#F59A1E"/><stop offset="1" stop-color="#C8640A"/></radialGradient></defs><ellipse cy="17" rx="22" ry="4" fill="#C8302A"/>${[[-14, 9], [0, 9], [14, 9], [-7, -3], [7, -3], [0, -15]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.6" fill="url(#tgOr)"/><circle cx="${x - 2.5}" cy="${y - 3}" r="1.6" fill="#FFF3C8" opacity=".7"/>`).join('')}<path d="M0 -22 l-2 -5 M0 -22 q4 -4 7 -2" stroke="#3E7A2A" stroke-width="1.8" fill="none"/><rect x="-5" y="-12" width="10" height="8" fill="#E0443E" transform="rotate(45 0 -8)"/>` },
  { id: 'malao', name: '麻荖', top: true, draw: `<ellipse cy="12" rx="22" ry="6" fill="#F4E8D0" stroke="#D8C8A0"/>${[[-12, 4], [0, 2], [12, 4], [-6, -6], [6, -6]].map(([x, y]) => `<g transform="translate(${x} ${y}) rotate(-12)"><rect x="-10" y="-5" width="20" height="10" rx="5" fill="#FFF8EC" stroke="#E2D2B4"/>${[-6, -2, 2, 6].map((dx) => `<circle cx="${dx}" cy="${(dx % 4) ? -1 : 1.5}" r="1.3" fill="#F0E2C2"/>`).join('')}</g>`).join('')}<rect x="-6" y="-16" width="12" height="9" fill="#E0443E"/><text y="-9" text-anchor="middle" style="font-size:7px;fill:#FFE29A;font-weight:700">囍</text>` },
  { id: 'ji', name: '全雞', top: false, draw: `<ellipse cy="4" rx="22" ry="13" fill="#E8B060"/><circle cx="18" cy="-8" r="8" fill="#E8B060"/><path d="M24 -14l4-4 2 5z" fill="#E0443E"/><path d="M-22 0l-8-6M-20 8l-8 2" stroke="#C8904A" stroke-width="4" stroke-linecap="round"/>` },
  { id: 'gui', name: '紅龜粿', top: false, draw: `<ellipse rx="22" ry="15" fill="#E0443E"/><path d="M-10-6h20M-12 0h24M-10 6h20M0-12v24" stroke="#B02A22" stroke-width="2"/><circle cx="22" cy="-2" r="5" fill="#E0443E"/><ellipse cy="15" rx="20" ry="3" fill="#7BB35A"/>` },
];
const cane = `<rect x="-5" y="-110" width="10" height="220" rx="4" fill="#7A3A5A"/>${[-80, -40, 0, 40, 80].map((y) => `<rect x="-6" y="${y}" width="12" height="3" fill="#5A2440"/>`).join('')}<path d="M0 -110c-14-20-26-24-34-20M0 -110c10-24 24-30 34-28M0 -112c-2-22 2-34 8-40" stroke="#5E9A4A" stroke-width="5" stroke-linecap="round" fill="none"/><rect x="-9" y="-10" width="18" height="26" fill="#E0443E"/>`;

const tiangong = {
  play(st, o) {
    // 供品底部對齊桌面：頂桌桌面 y≈296、下桌桌面 y≈404（對齊背景圖）
    const TOP = [76, 118, 160, 202, 244, 286].map((x) => [x, 296]), LOW = [[124, 404], [236, 404]], CANE = [[34, 330], [326, 330]];
    const REST = [[42, 548], [96, 562], [150, 548], [204, 562], [258, 548], [312, 562], [70, 606], [290, 606]];
    const NALL = TG_ITEMS.length + 2;
    let topFill = 0, lowFill = 0, canes = 0, pos = [0, 0];
    const items = shuffle(TG_ITEMS);
    st.set(`${backdrop('tiangong', { wall: ['#3A2A50', '#6A3A40'], table: 470, tableColor: ['#8A3020', '#5A2014'], extra: `
      <circle cx="180" cy="80" r="70" fill="#FFE29A" opacity=".25"/><text x="180" y="96" text-anchor="middle" class="fest-sign">天公</text>
      <rect x="66" y="300" width="228" height="16" fill="#C8462E"/><rect x="74" y="316" width="10" height="70" fill="#8A3020"/><rect x="276" y="316" width="10" height="70" fill="#8A3020"/>
      <rect x="66" y="300" width="228" height="10" fill="#E8B060" opacity=".6"/>
      <rect x="90" y="388" width="180" height="10" fill="#E0443E"/><rect x="40" y="430" width="280" height="16" fill="#A8402A"/>
      <text x="300" y="296" class="fest-small" fill="#FFE29A">頂桌</text><text x="276" y="426" class="fest-small" fill="#FFE29A">下桌</text>`, over: `<text x="180" y="96" text-anchor="middle" class="fest-sign">天公</text><text x="300" y="282" class="fest-small" fill="#FFE29A">頂桌</text><text x="300" y="386" class="fest-small" fill="#FFE29A">下桌</text>` })}
      ${TOP.map(([x, y], i) => `<ellipse id="ts${i}" cx="${x}" cy="${y - 1}" rx="18" ry="4.5" fill="rgb(255 244 216 / .15)" stroke="#FFF4D8" stroke-width="1.8" stroke-dasharray="4 3"/>`).join('')}
      ${LOW.map(([x, y], i) => `<ellipse id="ls${i}" cx="${x}" cy="${y - 1}" rx="26" ry="6" fill="rgb(255 244 216 / .15)" stroke="#FFF4D8" stroke-width="2" stroke-dasharray="5 4"/>`).join('')}
      ${CANE.map(([x, y], i) => `<rect id="cs${i}" x="${x - 9}" y="${y - 112}" width="18" height="224" fill="none" stroke="#FFF4D8" stroke-width="2" stroke-dasharray="6 5" opacity="0"/>`).join('')}
      ${items.map((it) => `<g id="tg-${it.id}" class="fest-hit"><circle cy="-20" r="26" fill="#000" opacity="0"/>${it.top ? sitArt('tg-' + it.id, 40, 34, it.draw) : sitArt('tg-' + it.id, 56, 44, it.draw)}</g>`).join('')}
      <g id="cane0" class="fest-hit" filter="url(#fToy)" style="display:none"><rect x="-30" y="-115" width="60" height="230" fill="#000" opacity="0"/>${art('tg-cane', 70, 230, cane)}</g><g id="cane1" class="fest-hit" filter="url(#fToy)" style="display:none"><rect x="-30" y="-115" width="60" height="230" fill="#000" opacity="0"/>${art('tg-cane', 70, 230, cane)}</g>`);
    items.forEach((it, i) => place(st.$('#tg-' + it.id), ...REST[i]));
    st.progress(0, NALL);
    st.say('正月初九天公生，玉皇大帝生日。天公<b>吃素</b>：麵線、香菇、金針、木耳、<b>麻荖</b>和<b>橘子塔</b>擺上面的<b>頂桌</b>；全雞和紅龜粿是請從神吃的，擺<b>下桌</b>。', 'temple');
    const step = () => st.progress(topFill + lowFill + canes, NALL);
    items.forEach((it, i) => {
      const el = st.$('#tg-' + it.id); let done = false;
      const target = () => (it.top ? TOP[topFill] : LOW[lowFill]);
      const other = () => (it.top ? LOW[lowFill] : TOP[topFill]);
      st.hold(el, {
        magnet: () => (done || !target() ? null : [...target(), 36]),
        onStart() { if (!done) st.zoom(180, 380, 280); },
        onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y, 1.08); },
        onUp() {
          if (done) return; st.reset();
          const t = target();
          if (t && D(pos, t) < 30) {
            done = true; place(el, ...t);
            st.$((it.top ? '#ts' : '#ls') + (it.top ? topFill : lowFill)).setAttribute('opacity', '0');
            it.top ? topFill++ : lowFill++;
            st.sfx.pop(); st.burst('star', ...t, 8); step();
            if (topFill + lowFill === TG_ITEMS.length) canesUp();
          } else {
            const ot = other();
            if (ot && D(pos, ot) < 50) st.say(it.top ? `${it.name}是素的，要放<b>頂桌</b>給天公。` : `${it.name}是葷的（或是給從神的粿），天公吃素，要放<b>下桌</b>。`, 'temple');
            flyTo(st, el, pos, REST[i], 300);
          }
        },
      });
    });
    function canesUp() {
      st.say('擺好了！最後把兩根<b>甘蔗</b>立在供桌兩邊（甘蔗諧音「甘願」，也像通天的梯子）。', 'temple');
      [0, 1].forEach((k) => {
        const el = st.$('#cane' + k), rest = k ? [250, 560] : [110, 560]; let done = false;
        el.style.display = ''; place(el, ...rest, .3, 90); st.$('#cs' + k).setAttribute('opacity', '.8');
        st.hold(el, {
          magnet: () => (done ? null : [...CANE[k], 50]),
          onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y, .7); },
          onUp() {
            if (done) return;
            if (D(pos, CANE[k]) < 40) { done = true; place(el, ...CANE[k]); st.$('#cs' + k).setAttribute('opacity', '0'); canes++; st.sfx.pop(); step(); if (canes === 2) finish(); }
            else place(el, ...rest, .3, 90);
          },
        });
      });
      st.buttons([{ label: '幫我立好', on: () => { [0, 1].forEach((k) => { place(st.$('#cane' + k), ...CANE[k]); st.$('#cs' + k).setAttribute('opacity', '0'); }); canes = 2; step(); finish(); } }]);
    }
    let fin = false;
    function finish() {
      if (fin) return; fin = true; st.buttons([]); st.sfx.bowl();
      const rain = (n) => { if (n <= 0) return; st.emit('star', rand(40, 320), 40, { vy: rand(50, 110), vx: rand(-10, 10), life: 2.6, color: '#FFE9A0' }); st.later(60, () => rain(n - 1)); };
      rain(40);
      st.later(1600, () => {
        o.done('頂桌擺好了，天公收到你的心意。傳統是初九凌晨子時拜，拜完三跪九叩，祈求整年平安。要不要去凌霄寶殿敬天、寫疏文給天公？');
        st.later(50, () => st.buttons([{ label: '去凌霄寶殿', primary: true, on: () => o.goHall('tg') }, { label: '回到殿裡', on: () => o.goHall(null) }]));
      });
    }
    st.buttons([{ label: '幫我擺好', on: () => { items.forEach((it) => { const el = st.$('#tg-' + it.id); const t = it.top ? TOP[topFill++] : LOW[lowFill++]; if (t) place(el, ...t); }); TOP.forEach((_, i) => st.$('#ts' + i).setAttribute('opacity', '0')); LOW.forEach((_, i) => st.$('#ls' + i).setAttribute('opacity', '0')); step(); canesUp(); } }]);
  },
};

/* ================= 元宵：猜燈謎、放天燈 ================= */
const WISHES = ['平安順利', '身體健康', '考試順利', '財源廣進', '好姻緣', '家庭和樂'];
const lantern = (lit) => hasArt('yx-lantern') ? `<line x1="0" y1="-60" x2="0" y2="-42" stroke="#7A3A1A" stroke-width="2"/>${lit ? '<ellipse rx="46" ry="48" fill="url(#fGlow)" opacity=".8"/>' : ''}
  <g style="filter:${lit ? 'brightness(1.12) saturate(1.1)' : 'brightness(.72) saturate(.8)'}" transform="translate(0 4)">${art('yx-lantern', 70, 93, '')}</g>` : `<line x1="0" y1="-60" x2="0" y2="-34" stroke="#7A3A1A" stroke-width="2"/><rect x="-12" y="-38" width="24" height="7" rx="2" fill="#E0A440"/>
  <ellipse rx="30" ry="32" fill="${lit ? '#FF5A3A' : '#B8483A'}"/>${lit ? '<ellipse rx="40" ry="42" fill="url(#fGlow)" opacity=".7"/>' : ''}<path d="M0-32c-14 6-14 58 0 64M0-32c14 6 14 58 0 64" stroke="#FFC94A" stroke-width="1.6" fill="none"/>
  <rect x="-12" y="30" width="24" height="7" rx="2" fill="#E0A440"/><path d="M-6 37v14M0 37v18M6 37v14" stroke="#E0A440" stroke-width="2"/>`;
const skyLantern = (wish) => hasArt('yx-skylantern') ? `<ellipse cy="40" rx="60" ry="70" fill="url(#fGlow)" opacity=".6"/>${art('yx-skylantern', 116, 160, '')}
  ${[...wish].map((c, i, a) => `<text y="${-40 + i * (90 / Math.max(4, a.length))}" text-anchor="middle" class="fest-cp" fill="#FFF6DA" style="fill:#FFF6DA;font-size:${a.length > 4 ? 18 : 22}px;paint-order:stroke;stroke:#A8281E;stroke-width:3px">${c}</text>`).join('')}` : `<path d="M-46 60 L-56 -60 Q0 -86 56 -60 L46 60Z" fill="#FFF0C8" stroke="#E0A440" stroke-width="2"/><ellipse cy="60" rx="46" ry="8" fill="#E0A440"/><ellipse cy="52" rx="16" ry="10" fill="url(#fGlow)"/>
  ${[...wish].map((c, i, a) => `<text y="${-30 + i * (90 / Math.max(4, a.length))}" text-anchor="middle" class="fest-cp" fill="#C8382E" style="font-size:${a.length > 4 ? 18 : 22}px">${c}</text>`).join('')}`;

const yuanxiao = {
  play(st, o) {
    // 題庫一百多題＋程式出題，記住看過的題目，一輪之內不重複
    const seen = o.state ? (o.state.yxSeen ||= []) : [];
    const qs = pickRiddles(3, seen); if (seen.length > 400) seen.splice(0, seen.length - 400); o.save?.();
    const AT = [[80, 190], [180, 160], [280, 190]];
    let solved = 0, cur = -1;
    st.set(`${backdrop('yuanxiao', { wall: ['#1E1A40', '#3A2050'], table: 560, tableColor: ['#4A3A30', '#2A1E18'], extra: `<path d="M0 100 Q180 150 360 100" stroke="#5A3A2A" stroke-width="3" fill="none"/>${Array.from({ length: 30 }, () => `<circle cx="${rand(0, 360)}" cy="${rand(0, 500)}" r="${rand(.6, 1.6)}" fill="#FFF8D8" opacity="${rand(.3, .9)}"/>`).join('')}` })}
      ${AT.map(([x, y], i) => `<g id="lan${i}" class="fest-hit" data-i="${i}" transform="translate(${x} ${y})">${lantern(false)}<text y="7" text-anchor="middle" class="fest-small" fill="#FFE29A">謎</text></g>`).join('')}
      <g id="sky" style="display:none"></g>`);
    st.progress(0, 4);
    st.say('元宵節猜燈謎！點一盞燈籠看謎題，猜對燈籠就會亮。三盞都點亮，就能放天燈。', 'temple');
    const ask = (i) => {
      if (cur === -2 || st.$('#lan' + i).dataset.done) return;
      cur = i; const r = qs[i]; st.sfx.knock();
      st.say(`燈謎：${r.q}`, 'temple');
      st.buttons(shuffle(r.opts).map((x) => ({ label: x, on: () => answer(i, x) })));
    };
    st.world.addEventListener('click', (e) => { const g = e.target.closest('[data-i]'); if (g) ask(+g.dataset.i); });
    function answer(i, x) {
      if (cur !== i) return;
      const r = qs[i];
      if (x !== r.a) { st.say(`不是「${x}」喔，再想想：${r.q}`, 'temple'); st.sfx.knock(); return; }
      const g = st.$('#lan' + i); g.dataset.done = '1'; g.innerHTML = `${lantern(true)}<text y="7" text-anchor="middle" class="fest-small" fill="#FFF4D0">${r.a}</text>`;
      solved++; st.progress(solved, 4); st.sfx.chime(); st.burst('star', ...AT[i], 14);
      st.buttons([]); cur = -1;
      if (solved < 3) st.say(`答對了，是「${r.a}」！再點下一盞燈籠。`, 'temple');
      else skyStart();
    }
    function skyStart() {
      cur = -2;
      st.say('三盞燈都亮了！來放天燈：先選一個願望寫在天燈上。', 'temple');
      st.buttons(WISHES.map((w) => ({ label: w, on: () => launchPrep(w) })));
    }
    function launchPrep(wish) {
      const sky = st.$('#sky'); sky.innerHTML = skyLantern(wish); sky.style.display = ''; sky.classList.add('fest-hit');
      let pos = [180, 440], vy = 0, lastY = null, gone = false;
      place(sky, ...pos);
      st.buttons([{ label: '放手讓它飛', on: () => fly(-260) }]);
      st.say(`寫上「${wish}」了。按住天燈下面，<b>往上一推</b>再放手，讓它飛上天。`, 'temple');
      st.hold(sky, {
        onStart() { lastY = null; vy = 0; },
        onMove(x, y) { if (gone) return; const ny = Math.min(470, y); if (lastY !== null) vy = vy * .6 + (ny - lastY) * .4; lastY = ny; pos = [clamp(x, 70, 290), ny]; place(sky, ...pos); },
        onUp() { if (gone) return; if (vy < -4 || pos[1] < 300) fly(vy * 20); else { st.say('再用力往上推一點。', 'temple'); flyTo(st, sky, pos, [180, 440], 300); pos = [180, 440]; } },
      });
      function fly(v) {
        if (gone) return; gone = true; st.buttons([]); st.sfx.bowl();
        const from = [...pos];
        st.tween(2600, (k, e) => {
          const y = from[1] - e * (from[1] + 120), x = from[0] + Math.sin(k * 6) * 14;
          place(sky, x, y, 1 - e * .7);
          if (Math.random() < .3) st.emit('spark', x, y + 60 * (1 - e * .7), { vy: 30, vx: rand(-8, 8), life: .6, color: '#FFC94A' });
        }, () => { st.progress(4, 4); o.done(`天燈帶著「${wish}」飛上天了。元宵記得吃湯圓，團團圓圓。`); });
      }
    }
  },
};

/* ================= 清明：捲潤餅 ================= */
const RUNBING = [
  { id: 'cabbage', name: '高麗菜', c: '#B8DC8A' }, { id: 'sprout', name: '豆芽菜', c: '#F4EFD8' }, { id: 'egg', name: '蛋絲', c: '#F7D64A' },
  { id: 'tofu', name: '豆干絲', c: '#B8885A' }, { id: 'peanut', name: '花生糖粉', c: '#D8A868' }, { id: 'cilantro', name: '香菜', c: '#4E9A3E' },
];
// 清明節一家人圍著桌子包潤餅，每個人愛吃的料都不一樣：照家人點的單包，再兩邊摺起來、往上捲、端給他。
const ORDERS = [
  { id: 'agong', want: ['cabbage', 'tofu', 'peanut'], no: 'cilantro', line: '阿公牙齒不好，高麗菜、豆干，花生粉多一點，<b>不要香菜</b>。', ok: '軟軟的，好吃！', bad: '哎唷，阿公說不要香菜啦～' },
  { id: 'ama', want: ['sprout', 'egg', 'cilantro'], no: 'peanut', line: '阿嬤要豆芽菜、蛋絲、香菜，<b>不要花生粉</b>，太甜。', ok: '跟阿嬤以前包的一樣香。', bad: '阿嬤說太甜了，不過還是吃光光。' },
  { id: 'kid', want: ['egg', 'peanut'], no: 'cabbage', line: '小朋友只要蛋絲和花生粉，<b>不要青菜</b>！', ok: '耶～甜甜的！', bad: '小朋友把青菜挑出來了……' },
  { id: 'dad', want: ['cabbage', 'sprout', 'tofu', 'egg'], no: '', line: '爸爸什麼都要，越大捲越好，至少四樣！', ok: '大捲又飽滿，讚！', bad: '爸爸說料太少了，再包一捲。' },
  { id: 'mom', want: ['sprout', 'cilantro', 'tofu'], no: 'egg', line: '媽媽要豆芽、豆干、香菜，<b>不要蛋</b>。', ok: '清爽好吃，謝謝你。', bad: '媽媽笑著說：我不吃蛋啦。' },
];
const rbIcon = (f, s = 1) => `<g transform="scale(${s})">${art('rb-' + f.id, 56, 40, `<ellipse rx="26" ry="14" fill="#FFF" stroke="#D8C8B0"/>${Array.from({ length: 9 }, (_, k) => `<rect x="${-16 + (k % 3) * 11}" y="${-8 + Math.floor(k / 3) * 5}" width="9" height="3.4" rx="1.6" fill="${f.c}" transform="rotate(${(k * 37) % 30 - 15} ${-12 + (k % 3) * 11} ${-6 + Math.floor(k / 3) * 5})"/>`).join('')}`)}</g>`;
const runbing = {
  play(st, o) {
    const PLATE = [180, 340], REST = RUNBING.map((_, i) => [62 + (i % 3) * 118, i < 3 ? 488 : 552]); // 托盤：兩排三格
    const fam = ORDERS.filter((x) => x.id !== o.me?.id).sort(() => Math.random() - .5).slice(0, 3);
    const SEATS = [[70, 150], [180, 132], [290, 150]];
    let laid = [], phase = 'fill', pos = [0, 0], roll = 0, startY = null, cur = 0, folded = { L: false, R: false }, score = 0;
    const face = (id) => o.chars?.byId?.(id)?.face || '';
    st.set(`${backdrop('qingming', { wall: ['#DCEBD0', '#B8D4A8'], table: 230, tableColor: ['#D8B48A', '#B08A60'], extra: `<g opacity=".5">${[50, 120, 250, 320].map((x) => `<path d="M${x} 230 q-4-40 8-70 q-14 30-30 40" stroke="#6BA35A" stroke-width="4" fill="none"/>`).join('')}</g>` })}
      ${fam.map((f, i) => `<g id="seat${i}" transform="translate(${SEATS[i][0]} ${SEATS[i][1]})"><circle r="30" fill="#FFF4E0" stroke="#7BB35A" stroke-width="3"/><clipPath id="rbf${i}"><circle r="28"/></clipPath><image href="${face(f.id)}" x="-28" y="-28" width="56" height="56" clip-path="url(#rbf${i})" preserveAspectRatio="xMidYMid slice"/><text y="46" text-anchor="middle" class="fest-small" fill="#3A5A2A">${o.chars?.byId?.(f.id)?.name || ''}</text><g id="mark${i}"></g></g>`).join('')}
      <g id="order"></g>
      <defs>
        <radialGradient id="rbPlate" cx=".45" cy=".35"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".75" stop-color="#F4F0E8"/><stop offset="1" stop-color="#D8D0C2"/></radialGradient>
        <radialGradient id="rbSkin" cx=".5" cy=".45"><stop offset="0" stop-color="#FFF9EC"/><stop offset=".8" stop-color="#F7E9CC"/><stop offset="1" stop-color="#EED8B0"/></radialGradient>
        <linearGradient id="rbRoll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6E2"/><stop offset=".5" stop-color="#F3E0BC"/><stop offset="1" stop-color="#D8BE90"/></linearGradient>
      </defs>
      <ellipse cx="${PLATE[0] + 4}" cy="${PLATE[1] + 16}" rx="134" ry="64" fill="#3A2410" opacity=".18"/>
      <ellipse cx="${PLATE[0]}" cy="${PLATE[1] + 4}" rx="132" ry="66" fill="url(#rbPlate)" stroke="#C8C0B2" stroke-width="1.5"/>
      <ellipse cx="${PLATE[0]}" cy="${PLATE[1] + 4}" rx="122" ry="60" fill="none" stroke="#5A7AB8" stroke-width="2.2" opacity=".75"/>
      <ellipse cx="${PLATE[0]}" cy="${PLATE[1] + 6}" rx="108" ry="52" fill="#EFEAE0"/>
      <g id="wrap"><path id="skin" d="${(() => { const n = 28, pts = Array.from({ length: n }, (_, i) => { const a = i / n * 6.283, r = 1 + Math.sin(i * 2.7) * .025 + Math.cos(i * 1.3) * .02; return [PLATE[0] + Math.cos(a) * 106 * r, PLATE[1] + Math.sin(a) * 51 * r]; }); return 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L') + 'Z'; })()}" fill="url(#rbSkin)" stroke="#E2CDA4" stroke-width="1.4" stroke-linejoin="round"/>
        ${Array.from({ length: 14 }, (_, i) => `<ellipse cx="${(PLATE[0] + Math.cos(i * 2.4) * 70 * ((i % 3) / 3 + .3)).toFixed(1)}" cy="${(PLATE[1] + Math.sin(i * 2.4) * 32 * ((i % 3) / 3 + .3)).toFixed(1)}" rx="${(5 + (i % 4) * 2)}" ry="${(2.4 + (i % 3))}" fill="#E8CFA0" opacity=".35"/>`).join('')}
        <g id="fill"></g>
        <path id="flapL" d="M${PLATE[0] - 104} ${PLATE[1]} Q${PLATE[0] - 70} ${PLATE[1] - 46} ${PLATE[0] - 50} ${PLATE[1]} Q${PLATE[0] - 70} ${PLATE[1] + 46} ${PLATE[0] - 104} ${PLATE[1]}Z" fill="#F7EBD0" stroke="#E0CCA6" stroke-width="2" opacity="0"/>
        <path id="flapR" d="M${PLATE[0] + 104} ${PLATE[1]} Q${PLATE[0] + 70} ${PLATE[1] - 46} ${PLATE[0] + 50} ${PLATE[1]} Q${PLATE[0] + 70} ${PLATE[1] + 46} ${PLATE[0] + 104} ${PLATE[1]}Z" fill="#F7EBD0" stroke="#E0CCA6" stroke-width="2" opacity="0"/></g>
      <g id="foldHint" opacity="0" pointer-events="none"><path d="M${PLATE[0] - 120} ${PLATE[1]} h40 l-8 -7 m8 7 l-8 7" stroke="#7A5A2A" stroke-width="3" fill="none"/><path d="M${PLATE[0] + 120} ${PLATE[1]} h-40 l8 -7 m-8 7 l8 7" stroke="#7A5A2A" stroke-width="3" fill="none"/></g>
      <g id="roll" style="display:none" class="fest-hit"><ellipse cy="20" rx="72" ry="6" fill="#3A2410" opacity=".18"/><rect x="-72" y="-17" width="144" height="34" rx="17" fill="url(#rbRoll)" stroke="#D2B88A" stroke-width="1.6"/><path d="M-60 -9 Q0 -14 60 -9" stroke="#FFFDF4" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round"/><path d="M-30 -16 Q-26 0 -30 16 M10 -16 Q14 0 10 16" stroke="#E2CDA4" stroke-width="1.2" fill="none"/><g id="rollEnds"></g></g>
      ${RUNBING.map((f, i) => `<g id="rb-${f.id}" class="fest-hit" data-nograb filter="url(#fToy)">${rbIcon(f)}<text y="30" text-anchor="middle" class="fest-small" fill="#5A3A20">${f.name}</text></g>`).join('')}`);
    RUNBING.forEach((f, i) => place(st.$('#rb-' + f.id), ...REST[i]));
    st.progress(0, fam.length);
    const byId = (id) => RUNBING.find((x) => x.id === id);
    function showOrder() {
      const f = fam[cur], [sx, sy] = SEATS[cur];
      fam.forEach((_, i) => st.$('#seat' + i).setAttribute('opacity', i === cur || i < cur ? '1' : '.55'));
      // 點單泡泡：要的料（圖）＋不要的（打叉）
      st.$('#order').innerHTML = `<g transform="translate(180 ${sy + 92})"><rect x="-150" y="-20" width="300" height="44" rx="14" fill="#FFFDF4" stroke="#7BB35A" stroke-width="2"/><path d="M${sx - 180 - 8} -20 l8 -26 l8 26" fill="#FFFDF4" stroke="#7BB35A" stroke-width="2"/>
        ${f.want.map((id, k) => `<g transform="translate(${-128 + k * 46} 2)">${rbIcon(byId(id), .62)}</g>`).join('')}
        ${f.no ? `<g transform="translate(120 2)">${rbIcon(byId(f.no), .62)}<path d="M-14 -12 L14 12 M14 -12 L-14 12" stroke="#E0443E" stroke-width="4" stroke-linecap="round"/></g>` : ''}</g>`;
      st.say(f.line + ' 把料<b>拖到餅皮上</b>（點一下也可以）。', 'temple');
      st.buttons([{ label: '放好了，摺起來', primary: true, on: toFold }, { label: '照單放料', on: () => { resetSkin(); fam[cur].want.forEach((id) => lay(byId(id))); } }, { label: '重來', on: resetSkin }]);
    }
    function resetSkin() {
      if (phase !== 'fill') return;
      laid = []; st.$('#fill').innerHTML = '';
      RUNBING.forEach((f, i) => { const el = st.$('#rb-' + f.id); el.style.display = ''; place(el, ...REST[i]); });
    }
    const lay = (f) => {
      if (phase !== 'fill' || laid.includes(f)) return;
      laid.push(f); st.$('#rb-' + f.id).style.display = 'none';
      const n = laid.length, y = PLATE[1] - 24 + (n - 1) * 8;
      // 料鋪成一長條：一根一根細絲（彎彎的），中間厚兩頭薄，像真的堆在餅皮上
      st.$('#fill').insertAdjacentHTML('beforeend', `<g>${Array.from({ length: 34 }, (_, k) => { const t = k / 33, x = PLATE[0] - 74 + t * 148 + rand(-4, 4), yy = y + rand(-6, 6) * (1 - Math.abs(t - .5)), L = rand(9, 16), a = rand(-40, 40) * Math.PI / 180, dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2; return `<path d="M${(x - dx).toFixed(1)} ${(yy - dy).toFixed(1)} q${(dx + rand(-3, 3)).toFixed(1)} ${(dy + rand(-3, 3)).toFixed(1)} ${(dx * 2).toFixed(1)} ${(dy * 2).toFixed(1)}" stroke="${f.c}" stroke-width="${rand(2.4, 4).toFixed(1)}" stroke-linecap="round" fill="none"/>`; }).join('')}<path d="M${PLATE[0] - 70} ${y + 3} Q${PLATE[0]} ${y + 9} ${PLATE[0] + 70} ${y + 3}" stroke="rgb(0 0 0 / .08)" stroke-width="5" fill="none"/></g>`);
      st.sfx.pop(); st.emit('spark', PLATE[0] + rand(-40, 40), y, { color: f.c, speed: 30, life: .5 });
    };
    RUNBING.forEach((f, i) => {
      const el = st.$('#rb-' + f.id); let moved = false;
      st.hold(el, {
        magnet: () => (phase !== 'fill' ? null : [PLATE[0], PLATE[1], 90]),
        onStart(x, y) { moved = false; pos = [x, y]; if (phase === 'fill') st.zoom(180, 400, 300); },
        onMove(x, y) { if (phase !== 'fill') return; if (D(pos, [x, y]) > 4) moved = true; pos = [x, y]; place(el, x, y); },
        onUp() {
          if (phase !== 'fill') return; st.reset();
          if (!moved || (Math.abs(pos[0] - PLATE[0]) < 110 && Math.abs(pos[1] - PLATE[1]) < 60)) lay(f);
          else flyTo(st, el, pos, REST[i], 300);
        },
      });
    });
    // 兩邊往內摺：手指從餅皮左邊往右滑、右邊往左滑
    function toFold() {
      if (phase !== 'fill') return;
      if (!laid.length) { st.say('餅皮上還沒有料喔。', 'temple'); return; }
      phase = 'fold'; st.buttons([{ label: '幫我摺', on: () => { fold('L'); fold('R'); } }]);
      st.$('#foldHint').setAttribute('opacity', '1'); st.zoom(180, 360, 300);
      st.say('先把餅皮<b>左右兩邊往中間摺</b>（料才不會掉出來）：手指從左邊往右滑，再從右邊往左滑。', 'temple');
    }
    function fold(side) {
      if (phase !== 'fold' || folded[side]) return;
      folded[side] = true; st.sfx.pop();
      const fl = st.$('#flap' + side); st.tween(260, (k) => fl.setAttribute('opacity', k.toFixed(2)));
      if (folded.L && folded.R) {
        phase = 'roll0'; st.$('#foldHint').setAttribute('opacity', '0'); st.buttons([{ label: '幫我捲', primary: true, on: autoRoll }]);
        st.say('摺好了！現在<b>從餅皮下面往上滑</b>，把它捲起來。', 'temple');
      }
    }
    let fx0 = null;
    st.touch({
      down(p) {
        if (phase === 'fold') fx0 = p;
        else if (phase === 'roll0' && p.y > PLATE[1] - 20 && p.y < PLATE[1] + 150) { phase = 'roll'; startY = p.y; }
        else if (phase === 'roll') startY = p.y + roll * 140;
      },
      move(p) {
        if (phase === 'fold' && fx0) { const dx = p.x - fx0.x; if (fx0.x < PLATE[0] && dx > 50) { fold('L'); fx0 = null; } else if (fx0.x > PLATE[0] && dx < -50) { fold('R'); fx0 = null; } return; }
        if (phase !== 'roll' || startY === null) return; roll = clamp((startY - p.y) / 140, roll, 1); drawRoll(); if (roll >= 1) rolled();
      },
      up() { startY = null; fx0 = null; },
    });
    const wrap = st.$('#wrap'), rl = st.$('#roll');
    function drawRoll() {
      const bottom = PLATE[1] + 50 - roll * 100;
      st.$('#skin').setAttribute('ry', (50 * (1 - roll * .7)).toFixed(1));
      st.$('#skin').setAttribute('cy', (PLATE[1] - roll * 15).toFixed(1));
      for (const k of ['#fill', '#flapL', '#flapR']) { st.$(k).setAttribute('transform', `translate(0 ${(-roll * 15).toFixed(1)}) scale(1 ${(1 - roll * .7).toFixed(3)})`); st.$(k).setAttribute('transform-origin', `${PLATE[0]} ${PLATE[1]}`); }
      rl.style.display = ''; place(rl, PLATE[0], bottom, 1);
      rl.setAttribute('opacity', Math.min(1, roll * 3).toFixed(2));
    }
    function autoRoll() { if (phase !== 'roll0' && phase !== 'roll') return; phase = 'roll'; const run = () => { if (phase !== 'roll') return; roll = Math.min(1, roll + .05); drawRoll(); if (roll >= 1) rolled(); else st.later(30, run); }; run(); }
    // 捲好了：端給家人（按住捲好的潤餅拖到他的頭像，或按按鈕）
    function rolled() {
      if (phase !== 'roll') return; phase = 'serve'; st.buttons([]); st.reset();
      wrap.style.display = 'none'; place(rl, PLATE[0], PLATE[1], 1.15);
      st.$('#rollEnds').innerHTML = laid.slice(0, 4).map((f, k) => `<circle cx="${-70 + (k % 2) * 3}" cy="${-6 + k * 4}" r="3" fill="${f.c}"/><circle cx="${70 - (k % 2) * 3}" cy="${-6 + k * 4}" r="3" fill="${f.c}"/>`).join('');
      st.sfx.chime(); st.burst('star', PLATE[0], PLATE[1], 10);
      const target = SEATS[cur]; let p = [...PLATE], gone = false;
      st.say(`捲好了！<b>按住潤餅</b>，端給${o.chars?.byId?.(fam[cur].id)?.name || '家人'}。`, 'temple');
      const give = () => { if (gone) return; gone = true; st.tween(380, (k, e) => place(rl, p[0] + (target[0] - p[0]) * e, p[1] + (target[1] - p[1]) * e, 1.15 - e * .6), judge); };
      st.buttons([{ label: '端過去', primary: true, on: give }]);
      st.hold(rl, {
        magnet: () => (gone || phase !== 'serve' ? null : [...target, 60]),
        onMove(x, y) { if (gone || phase !== 'serve') return; p = [x, y]; place(rl, x, y, 1); },
        onUp() { if (gone || phase !== 'serve') return; if (D(p, target) < 60) give(); else { place(rl, PLATE[0], PLATE[1], 1.15); p = [...PLATE]; } },
      });
    }
    function judge() {
      const f = fam[cur], ids = laid.map((x) => x.id);
      const miss = f.want.filter((id) => !ids.includes(id)), bad = f.no && ids.includes(f.no);
      const good = !miss.length && !bad, [sx, sy] = SEATS[cur];
      rl.style.display = 'none';
      if (good) { score++; st.burst('heart', sx, sy, 12); st.sfx.chime(); st.$('#mark' + cur).innerHTML = '<circle cx="22" cy="-22" r="11" fill="#7BB35A"/><path d="M16 -22l4 4 8-8" stroke="#FFF" stroke-width="3" fill="none"/>'; }
      else { st.sfx.knock(); st.$('#mark' + cur).innerHTML = '<circle cx="22" cy="-22" r="11" fill="#F3C64A"/><text x="22" y="-17" text-anchor="middle" font-size="14" font-weight="900" fill="#7A3A1A">~</text>'; }
      st.floatText(good ? f.ok.slice(0, 10) : '嗯……', sx, sy - 44, good ? '#3A7A2A' : '#9A5A2A');
      st.say(good ? `${o.chars?.byId?.(f.id)?.name || ''}：「${f.ok}」` : (bad ? f.bad : `少放了${miss.map((id) => byId(id).name).join('、')}。${f.bad}`), 'temple');
      cur++; st.progress(cur, fam.length);
      st.later(1400, () => {
        if (cur >= fam.length) { phase = 'end'; finish(); return; }
        // 下一捲：新的餅皮
        laid = []; roll = 0; folded = { L: false, R: false }; phase = 'fill';
        wrap.style.display = ''; rl.style.display = 'none'; st.$('#fill').innerHTML = '';
        ['#skin', '#fill', '#flapL', '#flapR'].forEach((k) => st.$(k).removeAttribute('transform'));
        st.$('#skin').setAttribute('ry', '50'); st.$('#skin').setAttribute('cy', PLATE[1]);
        ['#flapL', '#flapR'].forEach((k) => st.$(k).setAttribute('opacity', '0'));
        RUNBING.forEach((x, i) => { const el = st.$('#rb-' + x.id); el.style.display = ''; place(el, ...REST[i]); });
        showOrder();
      });
    }
    function finish() {
      st.buttons([]); st.$('#order').innerHTML = '';
      const all = score === fam.length;
      st.burst('star', 180, 200, 24);
      st.later(600, () => o.done(`${all ? '三捲都包得剛剛好，全家吃得好開心！' : `包了 ${fam.length} 捲，${score} 捲剛好合家人的口味。`}清明慎終追遠，吃潤餅的時候，可以跟家人聊聊阿公阿嬤以前的故事。`));
    }
    showOrder();
  },
};

// 媽祖生改成完整的小遶境，在 raojing.js

export const GAMES = { tiangong, yuanxiao, qingming: runbing };

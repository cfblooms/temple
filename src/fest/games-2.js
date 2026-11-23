// 第二批節慶小遊戲：天公生、元宵、清明、媽祖生
import { art, clamp, rand, pick, place } from './core.js';
import { backdrop } from './games-1.js';

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
  { id: 'ji', name: '全雞', top: false, draw: `<ellipse cy="4" rx="22" ry="13" fill="#E8B060"/><circle cx="18" cy="-8" r="8" fill="#E8B060"/><path d="M24 -14l4-4 2 5z" fill="#E0443E"/><path d="M-22 0l-8-6M-20 8l-8 2" stroke="#C8904A" stroke-width="4" stroke-linecap="round"/>` },
  { id: 'gui', name: '紅龜粿', top: false, draw: `<ellipse rx="22" ry="15" fill="#E0443E"/><path d="M-10-6h20M-12 0h24M-10 6h20M0-12v24" stroke="#B02A22" stroke-width="2"/><circle cx="22" cy="-2" r="5" fill="#E0443E"/><ellipse cy="15" rx="20" ry="3" fill="#7BB35A"/>` },
];
const cane = `<rect x="-5" y="-110" width="10" height="220" rx="4" fill="#7A3A5A"/>${[-80, -40, 0, 40, 80].map((y) => `<rect x="-6" y="${y}" width="12" height="3" fill="#5A2440"/>`).join('')}<path d="M0 -110c-14-20-26-24-34-20M0 -110c10-24 24-30 34-28M0 -112c-2-22 2-34 8-40" stroke="#5E9A4A" stroke-width="5" stroke-linecap="round" fill="none"/><rect x="-9" y="-10" width="18" height="26" fill="#E0443E"/>`;

const tiangong = {
  play(st, o) {
    const TOP = [[96, 282], [148, 282], [212, 282], [264, 282]], LOW = [[140, 412], [220, 412]], CANE = [[34, 330], [326, 330]];
    const REST = [[46, 530], [100, 540], [154, 530], [208, 540], [262, 530], [316, 540]];
    let topFill = 0, lowFill = 0, canes = 0, pos = [0, 0];
    const items = shuffle(TG_ITEMS);
    st.set(`${backdrop('tiangong', { wall: ['#3A2A50', '#6A3A40'], table: 470, tableColor: ['#8A3020', '#5A2014'], extra: `
      <circle cx="180" cy="80" r="70" fill="#FFE29A" opacity=".25"/><text x="180" y="96" text-anchor="middle" class="fest-sign">天公</text>
      <rect x="66" y="300" width="228" height="16" fill="#C8462E"/><rect x="74" y="316" width="10" height="70" fill="#8A3020"/><rect x="276" y="316" width="10" height="70" fill="#8A3020"/>
      <rect x="66" y="300" width="228" height="10" fill="#E8B060" opacity=".6"/>
      <rect x="90" y="388" width="180" height="10" fill="#E0443E"/><rect x="40" y="430" width="280" height="16" fill="#A8402A"/>
      <text x="300" y="296" class="fest-small" fill="#FFE29A">頂桌</text><text x="276" y="426" class="fest-small" fill="#FFE29A">下桌</text>` })}
      ${TOP.map(([x, y], i) => `<ellipse id="ts${i}" cx="${x}" cy="${y + 12}" rx="22" ry="6" fill="none" stroke="#FFF4D8" stroke-width="2" stroke-dasharray="5 4"/>`).join('')}
      ${LOW.map(([x, y], i) => `<ellipse id="ls${i}" cx="${x}" cy="${y + 14}" rx="26" ry="6" fill="none" stroke="#FFF4D8" stroke-width="2" stroke-dasharray="5 4"/>`).join('')}
      ${CANE.map(([x, y], i) => `<rect id="cs${i}" x="${x - 9}" y="${y - 112}" width="18" height="224" fill="none" stroke="#FFF4D8" stroke-width="2" stroke-dasharray="6 5" opacity="0"/>`).join('')}
      ${items.map((it) => `<g id="tg-${it.id}" class="fest-hit" filter="url(#fToy)"><circle r="28" fill="#000" opacity="0"/>${art('tg-' + it.id, 50, 40, it.draw)}</g>`).join('')}
      <g id="cane0" class="fest-hit" filter="url(#fToy)" style="display:none"><rect x="-30" y="-115" width="60" height="230" fill="#000" opacity="0"/>${art('tg-cane', 70, 230, cane)}</g><g id="cane1" class="fest-hit" filter="url(#fToy)" style="display:none"><rect x="-30" y="-115" width="60" height="230" fill="#000" opacity="0"/>${art('tg-cane', 70, 230, cane)}</g>`);
    items.forEach((it, i) => place(st.$('#tg-' + it.id), ...REST[i]));
    st.progress(0, 8);
    st.say('正月初九天公生，玉皇大帝生日。天公<b>吃素</b>：麵線、香菇、金針、木耳擺上面的<b>頂桌</b>；全雞和紅龜粿是請從神吃的，擺<b>下桌</b>。', 'temple');
    const step = () => st.progress(topFill + lowFill + canes, 8);
    items.forEach((it, i) => {
      const el = st.$('#tg-' + it.id); let done = false;
      const target = () => (it.top ? TOP[topFill] : LOW[lowFill]);
      const other = () => (it.top ? LOW[lowFill] : TOP[topFill]);
      st.hold(el, {
        magnet: () => (done || !target() ? null : [...target(), 36]),
        onStart() { if (!done) st.zoom(180, 380, 280); },
        onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y, 1.1); },
        onUp() {
          if (done) return; st.reset();
          const t = target();
          if (t && D(pos, t) < 30) {
            done = true; place(el, ...t);
            st.$((it.top ? '#ts' : '#ls') + (it.top ? topFill : lowFill)).setAttribute('opacity', '0');
            it.top ? topFill++ : lowFill++;
            st.sfx.pop(); st.burst('star', ...t, 8); step();
            if (topFill + lowFill === 6) canesUp();
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
      st.later(1600, () => o.done('頂桌擺好了，天公收到你的心意。傳統是初九凌晨子時拜，拜完三跪九叩，祈求整年平安。'));
    }
    st.buttons([{ label: '幫我擺好', on: () => { items.forEach((it) => { const el = st.$('#tg-' + it.id); const t = it.top ? TOP[topFill++] : LOW[lowFill++]; if (t) place(el, ...t); }); TOP.forEach((_, i) => st.$('#ts' + i).setAttribute('opacity', '0')); LOW.forEach((_, i) => st.$('#ls' + i).setAttribute('opacity', '0')); step(); canesUp(); } }]);
  },
};

/* ================= 元宵：猜燈謎、放天燈 ================= */
const RIDDLES = [
  { q: '千條線，萬條線，掉到水裡看不見。（猜一種天氣）', a: '雨', opts: ['雨', '麵線', '頭髮'] },
  { q: '麻屋子，紅帳子，裡面住個白胖子。（猜一種食物）', a: '花生', opts: ['花生', '粽子', '湯圓'] },
  { q: '有面沒有口，有腳沒有手，聽人講話不開口。（猜一樣家具）', a: '桌子', opts: ['桌子', '鏡子', '時鐘'] },
  { q: '小小一間房，只有一扇窗，又唱歌又演戲，天天都開張。（猜一樣電器）', a: '電視', opts: ['電視', '冰箱', '電話'] },
  { q: '身穿綠衣裳，肚裡水汪汪，生的子兒多，個個黑臉膛。（猜一種水果）', a: '西瓜', opts: ['西瓜', '芭樂', '奇異果'] },
  { q: '一個老公公，天天起得早，白天出去晚上回，從來不說話。（猜一樣東西）', a: '太陽', opts: ['太陽', '月亮', '公雞'] },
];
const WISHES = ['平安順利', '身體健康', '考試順利', '財源廣進', '好姻緣', '家庭和樂'];
const lantern = (lit) => `<line x1="0" y1="-60" x2="0" y2="-34" stroke="#7A3A1A" stroke-width="2"/><rect x="-12" y="-38" width="24" height="7" rx="2" fill="#E0A440"/>
  <ellipse rx="30" ry="32" fill="${lit ? '#FF5A3A' : '#B8483A'}"/>${lit ? '<ellipse rx="40" ry="42" fill="url(#fGlow)" opacity=".7"/>' : ''}<path d="M0-32c-14 6-14 58 0 64M0-32c14 6 14 58 0 64" stroke="#FFC94A" stroke-width="1.6" fill="none"/>
  <rect x="-12" y="30" width="24" height="7" rx="2" fill="#E0A440"/><path d="M-6 37v14M0 37v18M6 37v14" stroke="#E0A440" stroke-width="2"/>`;
const skyLantern = (wish) => `<path d="M-46 60 L-56 -60 Q0 -86 56 -60 L46 60Z" fill="#FFF0C8" stroke="#E0A440" stroke-width="2"/><ellipse cy="60" rx="46" ry="8" fill="#E0A440"/><ellipse cy="52" rx="16" ry="10" fill="url(#fGlow)"/>
  ${[...wish].map((c, i, a) => `<text y="${-30 + i * (90 / Math.max(4, a.length))}" text-anchor="middle" class="fest-cp" fill="#C8382E" style="font-size:${a.length > 4 ? 18 : 22}px">${c}</text>`).join('')}`;

const yuanxiao = {
  play(st, o) {
    const qs = shuffle(RIDDLES).slice(0, 3), AT = [[80, 190], [180, 160], [280, 190]];
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
const runbing = {
  play(st, o) {
    const PLATE = [180, 300], REST = RUNBING.map((_, i) => [70 + (i % 3) * 110, i < 3 ? 470 : 536]); // 托盤：兩排三格
    let laid = [], phase = 'fill', pos = [0, 0], roll = 0, startY = null;
    st.set(`${backdrop('qingming', { wall: ['#DCEBD0', '#B8D4A8'], table: 230, tableColor: ['#D8B48A', '#B08A60'], extra: `<g opacity=".5">${[50, 120, 250, 320].map((x) => `<path d="M${x} 230 q-4-40 8-70 q-14 30-30 40" stroke="#6BA35A" stroke-width="4" fill="none"/>`).join('')}</g>` })}
      <ellipse cx="${PLATE[0]}" cy="${PLATE[1] + 4}" rx="130" ry="64" fill="#FFFFFF" stroke="#D8C8B0" stroke-width="2"/>
      <g id="wrap"><ellipse id="skin" cx="${PLATE[0]}" cy="${PLATE[1]}" rx="104" ry="50" fill="#FBF3E2" stroke="#E8D8B8" stroke-width="2"/><g id="fill"></g></g>
      <g id="roll" style="display:none"><rect x="-96" y="-16" width="192" height="32" rx="16" fill="#F7EBD0" stroke="#E0CCA6" stroke-width="2"/><path d="M-80 0h160" stroke="#E8D8B8" stroke-width="2" stroke-dasharray="8 6"/></g>
      ${RUNBING.map((f, i) => `<g id="rb-${f.id}" class="fest-hit" data-nograb filter="url(#fToy)">${art('rb-' + f.id, 56, 40, `<ellipse rx="26" ry="14" fill="#FFF" stroke="#D8C8B0"/>${Array.from({ length: 9 }, (_, k) => `<rect x="${-16 + (k % 3) * 11}" y="${-8 + Math.floor(k / 3) * 5}" width="9" height="3.4" rx="1.6" fill="${f.c}" transform="rotate(${(k * 37) % 30 - 15} ${-12 + (k % 3) * 11} ${-6 + Math.floor(k / 3) * 5})"/>`).join('')}`)}<text y="30" text-anchor="middle" class="fest-small" fill="#5A3A20">${f.name}</text></g>`).join('')}`);
    RUNBING.forEach((f, i) => place(st.$('#rb-' + f.id), ...REST[i]));
    st.progress(0, 2);
    st.say('清明節吃潤餅。把下面的料一樣一樣<b>拖到餅皮上</b>，至少放四樣，再往上滑把它捲起來。', 'temple');
    RUNBING.forEach((f, i) => {
      const el = st.$('#rb-' + f.id); let done = false;
      st.hold(el, {
        magnet: () => (done || phase !== 'fill' ? null : [PLATE[0], PLATE[1], 90]),
        onStart() { if (!done && phase === 'fill') st.zoom(180, 380, 280); },
        onMove(x, y) { if (done || phase !== 'fill') return; pos = [x, y]; place(el, x, y); },
        onUp() {
          if (done || phase !== 'fill') return; st.reset();
          if (Math.abs(pos[0] - PLATE[0]) < 100 && Math.abs(pos[1] - PLATE[1]) < 50) {
            done = true; el.style.display = 'none'; laid.push(f);
            const n = laid.length, y = PLATE[1] - 22 + (n - 1) * 8;
            st.$('#fill').insertAdjacentHTML('beforeend', Array.from({ length: 12 }, (_, k) => `<rect x="${PLATE[0] - 66 + k * 11 + rand(-3, 3)}" y="${y + rand(-3, 3)}" width="10" height="4" rx="2" fill="${f.c}" transform="rotate(${rand(-20, 20)} ${PLATE[0] - 60 + k * 11} ${y})"/>`).join(''));
            st.sfx.pop();
            if (n >= 4 && n === 4) { st.progress(1, 2); st.say(`放了${laid.map((x) => x.name).join('、')}。還可以再加，或直接<b>從餅皮下方往上滑</b>捲起來。`, 'temple'); st.buttons([{ label: '捲起來', primary: true, on: autoRoll }]); }
            else if (n < 4) st.say(`${f.name}放好了，再放 ${4 - n} 樣。`, 'temple');
          } else flyTo(st, el, pos, REST[i], 300);
        },
      });
    });
    // 往上滑捲起來：手指在餅皮下面，捲的那一條跟著往上跑
    st.touch({
      down(p) { if (laid.length >= 4 && phase === 'fill' && p.y > PLATE[1] && p.y < PLATE[1] + 130) { phase = 'roll'; startY = p.y; st.zoom(180, 330, 300); } else if (phase === 'roll') startY = p.y + roll * 140; },
      move(p) { if (phase !== 'roll' || startY === null) return; roll = clamp((startY - p.y) / 140, roll, 1); drawRoll(); if (roll >= 1) rolled(); },
      up() { startY = null; },
    });
    const wrap = st.$('#wrap'), rl = st.$('#roll');
    function drawRoll() {
      const bottom = PLATE[1] + 50 - roll * 100;
      wrap.setAttribute('clip-path', '');
      st.$('#skin').setAttribute('ry', (50 * (1 - roll * .7)).toFixed(1));
      st.$('#skin').setAttribute('cy', (PLATE[1] - roll * 15).toFixed(1));
      st.$('#fill').setAttribute('transform', `translate(0 ${(-roll * 15).toFixed(1)}) scale(1 ${(1 - roll * .7).toFixed(3)})`);
      st.$('#fill').setAttribute('transform-origin', `${PLATE[0]} ${PLATE[1]}`);
      rl.style.display = ''; place(rl, PLATE[0], bottom, 1);
      rl.setAttribute('opacity', Math.min(1, roll * 3).toFixed(2));
    }
    function autoRoll() { if (phase === 'end') return; phase = 'roll'; const run = () => { if (phase !== 'roll') return; roll = Math.min(1, roll + .05); drawRoll(); if (roll >= 1) rolled(); else st.later(30, run); }; run(); }
    function rolled() {
      if (phase === 'end') return; phase = 'end'; st.buttons([]); st.reset();
      wrap.style.display = 'none'; place(rl, PLATE[0], PLATE[1], 1.15);
      st.progress(2, 2); st.sfx.chime(); st.burst('star', PLATE[0], PLATE[1], 14);
      st.floatText('潤餅捲好了', PLATE[0], PLATE[1] - 50, '#5A3A20');
      st.later(900, () => o.done(`包了${laid.length}樣料的潤餅，香香的。清明慎終追遠，吃潤餅的時候，可以跟家人聊聊阿公阿嬤以前的故事。`));
    }
  },
};

/* ================= 媽祖生：鑽轎腳 ================= */
const sedan = (n) => `<rect x="-120" y="34" width="240" height="7" rx="3" fill="#7A3A1A"/>
  <path d="M-44 -70 L44 -70 L54 -60 L-54 -60Z" fill="#F3C64A"/><path d="M0 -96 L-36 -70 L36 -70Z" fill="#E0443E"/><circle cy="-100" r="7" fill="#F3C64A"/>
  <rect x="-44" y="-60" width="88" height="94" rx="6" fill="#C8302A" stroke="#F3C64A" stroke-width="4"/>
  <rect x="-28" y="-46" width="56" height="62" rx="4" fill="#FFE9B8"/><circle cy="-22" r="14" fill="#FFE0C4"/><path d="M-18 -30 Q0 -50 18 -30 L14 -26 Q0 -40 -14 -26Z" fill="#F3C64A"/><path d="M-20 16 Q0 -8 20 16Z" fill="#E0443E"/>
  <text y="30" text-anchor="middle" class="fest-small" fill="#FFE29A">${n}</text>`;

const mazu = {
  play(st, o) {
    const AV = [180, 560], NAMES = ['大媽', '二媽', '三媽'];
    let low = false, k = 0, x = 460, phase = 'walk', lowAmt = 0;
    const me = o.me; mazu.warned = false;
    st.set(`${backdrop('mazu', { wall: ['#BFE0F2', '#F8E2C0'], table: 470, tableColor: ['#C8B8A0', '#A8987E'], extra: `<g opacity=".8">${[30, 110, 250, 330].map((xx, i) => `<path d="M${xx} 470 v-200" stroke="#7A3A1A" stroke-width="3"/><path d="M${xx} 270 l40 14 l-40 14z" fill="${['#E0443E', '#F3C64A', '#3E9E86', '#E0443E'][i]}"/>`).join('')}</g>${Array.from({ length: 6 }, (_, i) => `<circle cx="${30 + i * 60}" cy="${470 - 8}" r="12" fill="#E0443E" opacity=".4"/>`).join('')}` })}
      <g id="av"><ellipse cx="0" cy="0" rx="46" ry="8" fill="#000" opacity=".15"/><image href="${me.kneel}" x="-60" y="-130" width="120" height="130" preserveAspectRatio="xMidYMax meet"/></g>
      <g id="sedan">${art('mz-sedan', 240, 210, sedan(NAMES[0]))}<g class="bearer">${[-100, 100].map((bx) => `<g transform="translate(${bx} 40)"><circle cy="-6" r="10" fill="#FFE0C4"/><rect x="-10" y="4" width="20" height="40" rx="6" fill="#F7F7F7"/><path d="M-6 44v22M6 44v22" stroke="#3A2A2A" stroke-width="6" stroke-linecap="round"/></g>`).join('')}</g></g>
      <text x="180" y="610" text-anchor="middle" class="fest-tip">按住畫面就會趴低</text>`);
    const av = st.$('#av'), sd = st.$('#sedan');
    st.progress(0, 3);
    st.say('三月廿三媽祖生，神轎出巡！傳說從轎底鑽過去會被保佑。轎子靠近時<b>按住畫面</b>讓自己趴低，等轎子過去再放開。', 'temple');
    st.touch({ down() { low = true; }, up() { low = false; } });
    st.buttons([]);
    const SED_Y = 380; // 轎槓的高度：跪著的頭會撞到，趴低剛好過
    let last = performance.now();
    const loop = () => {
      if (!st.alive || phase === 'end') return;
      const t = performance.now(), dt = Math.min(.05, (t - last) / 1000); last = t;
      lowAmt += ((low ? 1 : 0) - lowAmt) * Math.min(1, dt * 10);
      av.setAttribute('transform', `translate(${AV[0]} ${AV[1] + lowAmt * 26}) rotate(${(lowAmt * -8).toFixed(1)}) scale(1 ${(1 - lowAmt * .38).toFixed(3)})`);
      const over = Math.abs(x - AV[0]) < 130;
      // 轎子走到頭上、自己還沒趴低：轎班停下來等
      const blocked = over && lowAmt < .7 && x > AV[0];
      if (!blocked) x -= 110 * dt;
      if (blocked && !mazu.warned) { mazu.warned = true; st.say('轎子在等你，<b>按住畫面</b>趴低！', 'temple'); }
      const bob = Math.sin(t / 160) * 3;
      place(sd, x, SED_Y + bob);
      if (over && lowAmt > .7 && Math.random() < .25) st.emit('star', x + rand(-60, 60), SED_Y + 30, { vy: 40, vx: rand(-10, 10), life: .8 });
      if (x < -140) {
        k++; st.progress(k, 3); st.sfx.chime(); st.burst('star', AV[0], AV[1] - 80, 16);
        mazu.warned = false;
        if (k >= 3) { phase = 'end'; st.later(600, () => o.done('鑽過大媽、二媽、三媽的轎腳，媽祖保佑你一整年平安順利。')); return; }
        x = 480; sd.querySelector('text') && (sd.querySelector('text').textContent = NAMES[k]);
        st.say(`鑽過${NAMES[k - 1]}的轎腳了！下一頂是<b>${NAMES[k]}</b>，等祂靠近再按住。`, 'temple');
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
};

export const GAMES = { tiangong, yuanxiao, qingming: runbing, mazu };

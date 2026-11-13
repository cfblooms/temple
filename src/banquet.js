// 廟口流水席辦桌：拜拜完的平安宴。一張紅圓桌坐十個人（你＋九位香客），總舖師從出菜口一道一道出菜，
// 你把菜端上桌（每道都有好彩頭），冷盤先上、甜湯最後；吃完舉杯「乾杯」，再把剩菜打包回家（菜尾），
// 隔天回來就多一道「菜尾湯」。每天一桌，十二道菜慢慢收集成菜單。
// 場景 360 × 645；SVG 裡的 id 都加 bz 前綴。
import { makeCarrier } from './carry.js';
import { reduce, sleep, tween, pick, daily, yesterdayKey, onSwipe } from './stall.js';

// kind 決定暫代美術怎麼畫；c 是主色
export const DISHES = [
  { id: 'cold', name: '五福拼盤', luck: '五福臨門', kind: 'cold', first: true },
  { id: 'geng', name: '海鮮羹', luck: '料多福也多', kind: 'soup', c: '#C98A4A' },
  { id: 'crab', name: '紅蟳米糕', luck: '鴻運當頭', kind: 'crab' },
  { id: 'fotiao', name: '佛跳牆', luck: '福氣滿堂', kind: 'jar' },
  { id: 'chicken', name: '白斬雞', luck: '吃雞起家', kind: 'chicken' },
  { id: 'fish', name: '清蒸魚', luck: '年年有餘', kind: 'fish', note: '魚不能翻面，要從上面一層吃完再挑骨頭。' },
  { id: 'kong', name: '筍絲焢肉', luck: '節節高升', kind: 'pork' },
  { id: 'bihun', name: '炒米粉', luck: '長長久久', kind: 'noodle', c: '#E8C88A' },
  { id: 'roll', name: '炸蝦捲', luck: '金條滿桌', kind: 'roll' },
  { id: 'mianxian', name: '豬腳麵線', luck: '去霉添壽', kind: 'noodle', c: '#F3E2C0', pork: true },
  { id: 'tangyuan', name: '花生粉炸湯圓', luck: '圓圓滿滿', kind: 'fried', last: true },
  { id: 'fruit', name: '水果拼盤', luck: '甜甜蜜蜜', kind: 'fruit', last: true },
];
const CAIWEI = { id: 'caiwei', name: '菜尾湯', luck: '惜福，隔天更入味', kind: 'soup', c: '#B8783A', bonus: true };
const MAINS = DISHES.filter((d) => !d.first && !d.last);
const CHEER = ['好彩頭！', '讚啦！', '來來來，呷！', '總舖師好手藝！', '香喔～'];
const SEATS = Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (.9 + i / 8 * 1.2); return [180 + Math.cos(a) * 150, 404 + Math.sin(a) * 78]; });
const SLOTS = [[180, 420], [124, 408], [236, 408], [148, 444], [212, 444], [180, 392], [100, 434], [260, 434]];
const TRAY = [306, 610], BAG = [52, 612], CUP = [244, 616];
const ME = [180, 540];

// 依日期固定的亂數（同一天進來看到同一桌人、同一份菜單）
function seeded(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
function shuffle(a, rnd) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// 暫代美術：向量畫的菜（等 Gemini 生的菜圖到了換成 <image>）
function dishArt(d) {
  const plate = '<ellipse cx="0" cy="2" rx="27" ry="10" fill="#F7F4EE" stroke="#7FA6D8" stroke-width="1.6"/><ellipse cx="0" cy="1" rx="20" ry="6.5" fill="#FFFFFF"/>';
  const bowl = (fill) => `<path d="M-22 -6c0 12 10 18 22 18s22-6 22-18z" fill="#F7F4EE" stroke="#7FA6D8" stroke-width="1.6"/><ellipse cx="0" cy="-6" rx="22" ry="6" fill="${fill}"/>`;
  switch (d.kind) {
    case 'cold': return plate + ['#E8402A', '#F2C14A', '#6BAE5A', '#F7E6DA', '#C8783E'].map((c, i) => { const a = i / 5 * Math.PI * 2; return `<ellipse cx="${(Math.cos(a) * 11).toFixed(1)}" cy="${(Math.sin(a) * 3.6 - 2).toFixed(1)}" rx="7" ry="3.4" fill="${c}"/>`; }).join('') + '<circle cx="0" cy="-3" r="3" fill="#FFF" stroke="#E8402A"/>';
    case 'soup': return bowl(d.c) + '<circle cx="-6" cy="-7" r="2" fill="#F7E6DA"/><circle cx="5" cy="-5" r="2.4" fill="#E88E5A"/><path d="M-10 -6h4M8 -8h5" stroke="#6BAE5A" stroke-width="1.4"/>';
    case 'crab': return plate + '<ellipse cx="0" cy="-2" rx="18" ry="6" fill="#B07A4A"/><ellipse cx="0" cy="-6" rx="11" ry="5" fill="#E2402A"/><path d="M-11 -6l-7 -4M11 -6l7 -4M-9 -3l-8 1M9 -3l8 1" stroke="#E2402A" stroke-width="2" stroke-linecap="round"/><circle cx="-3" cy="-9" r="1" fill="#222"/><circle cx="3" cy="-9" r="1" fill="#222"/>';
    case 'jar': return '<ellipse cx="0" cy="4" rx="20" ry="5" fill="#7A4A2A" opacity=".3"/><path d="M-16 2c-4-10-2-20 4-24h24c6 4 8 14 4 24z" fill="#8A4A2A" stroke="#5A2A1A" stroke-width="1.4"/><ellipse cx="0" cy="-22" rx="13" ry="4" fill="#C8783E"/><path d="M-14 -12h28" stroke="#E8B84A" stroke-width="2"/><text x="0" y="-4" text-anchor="middle" style="font-size:8px;fill:#FFE08A;font-weight:900">福</text>';
    case 'chicken': return plate + '<path d="M-16 -2c0-8 6-10 10-10l4 4 6-6c6 0 12 4 12 10z" fill="#F7D98A" stroke="#D8A84A"/><path d="M-6 -6h14M-10 -2h20" stroke="#E8B860" stroke-width="1"/><path d="M14 -6l6 -8" stroke="#E8402A" stroke-width="2.4" stroke-linecap="round"/>';
    case 'fish': return '<ellipse cx="0" cy="2" rx="30" ry="10" fill="#F7F4EE" stroke="#7FA6D8" stroke-width="1.6"/><ellipse cx="-2" cy="-1" rx="18" ry="6" fill="#D8D0C0"/><path d="M16 -1l9 -6v12z" fill="#D8D0C0"/><circle cx="-14" cy="-2" r="1.4" fill="#222"/><path d="M-8 -5h18" stroke="#6BAE5A" stroke-width="1.6"/><path d="M-6 -3h14" stroke="#E8402A" stroke-width="1"/>';
    case 'pork': return plate + '<rect x="-16" y="-9" width="14" height="10" rx="2" fill="#8A4A2A"/><rect x="2" y="-9" width="14" height="10" rx="2" fill="#9A5A32"/><path d="M-16 -7h14M2 -7h14" stroke="#F7E6DA" stroke-width="2"/><path d="M-18 0q18 -6 36 0" stroke="#D8B86A" stroke-width="3" fill="none"/>';
    case 'noodle': return plate + `<path d="M-16 -2c4-6 8 2 12-4s8 2 12-4 6 4 8 2" stroke="${d.c}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-12 -6c4-4 8 2 12-2s8 2 10-2" stroke="${d.c}" stroke-width="3" fill="none" stroke-linecap="round"/>` + (d.pork ? '<ellipse cx="8" cy="-8" rx="7" ry="5" fill="#8A4A2A"/>' : '<path d="M-6 -4h4M6 -6h4" stroke="#6BAE5A" stroke-width="2"/>');
    case 'roll': return plate + [-12, 0, 12].map((x) => `<rect x="${x - 5}" y="-12" width="10" height="12" rx="4" fill="#E8A83A" stroke="#B8782A"/>`).join('') + '<path d="M-20 0h40" stroke="#6BAE5A" stroke-width="2"/>';
    case 'fried': return plate + [[-10, -4], [0, -7], [10, -4], [-5, -1], [5, -1]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#E8A83A" stroke="#B8782A"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="1.4" fill="#FFE08A"/>`).join('') + Array.from({ length: 14 }, (_, i) => `<circle cx="${-14 + (i * 7) % 28}" cy="${-8 + (i * 5) % 9}" r=".9" fill="#D8B888"/>`).join('') + '<ellipse cx="0" cy="1" rx="17" ry="3" fill="#E0C49A" opacity=".8"/>';
    case 'balls': return bowl('#E8C8A0') + '<circle cx="-7" cy="-7" r="3.4" fill="#FFF"/><circle cx="2" cy="-6" r="3.4" fill="#F7B8C8"/><circle cx="9" cy="-8" r="3" fill="#FFF"/>';
    case 'fruit': return plate + '<circle cx="-10" cy="-4" r="5" fill="#F28A1E"/><circle cx="0" cy="-6" r="5" fill="#E8402A"/><circle cx="10" cy="-4" r="5" fill="#8AC85A"/><path d="M-4 0l8 0" stroke="#F7E06A" stroke-width="4" stroke-linecap="round"/>';
  }
  return plate;
}

const svgOf = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="廟口流水席辦桌" class="stall-svg bz-svg">
  <defs>
    <linearGradient id="bzSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2A5A"/><stop offset=".5" stop-color="#C8664A"/><stop offset="1" stop-color="#F2B07A"/></linearGradient>
    <linearGradient id="bzGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B8987A"/><stop offset="1" stop-color="#8A6A52"/></linearGradient>
    <linearGradient id="bzCloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8402A"/><stop offset="1" stop-color="#B82A1E"/></linearGradient>
    <radialGradient id="bzBulb"><stop offset="0" stop-color="#FFF1B0"/><stop offset="1" stop-color="#FFD06A" stop-opacity="0"/></radialGradient>
    <radialGradient id="bzShadow"><stop offset="0" stop-color="#2A0E06" stop-opacity=".45"/><stop offset="1" stop-color="#2A0E06" stop-opacity="0"/></radialGradient>
    <clipPath id="bzFaceClip"><circle cx="0" cy="0" r="21"/></clipPath>
    <clipPath id="bzMeClip"><circle cx="0" cy="0" r="28"/></clipPath>
  </defs>
  <rect width="360" height="645" fill="url(#bzSky)"/>
  <!-- 遠景廟頂 -->
  <path d="M60 250l40-26h160l40 26z" fill="#7A2A22" opacity=".55"/><path d="M90 250h180v40H90z" fill="#6A2A22" opacity=".45"/>
  <rect y="290" width="360" height="355" fill="url(#bzGround)"/>
  <!-- 紅白帆布棚 -->
  <path d="M0 60h360v64H0z" fill="#E8402A"/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 40 + 20} 60h20v64h-20z" fill="#FFF4E8"/>`).join('')}
  <path d="M0 124${Array.from({ length: 9 }, (_, i) => `q20 18 40 0`).join('')}V124z" fill="#E8402A"/>
  <path d="M0 124${Array.from({ length: 9 }, (_, i) => `q20 18 40 0`).join('')}" fill="none" stroke="#B82A1E" stroke-width="2"/>
  <rect x="10" y="124" width="6" height="180" fill="#8A8A92"/><rect x="344" y="124" width="6" height="180" fill="#8A8A92"/>
  <path d="M0 150q90 30 180 0t180 0" stroke="#3A2A2A" stroke-width="1.2" fill="none"/>
  ${Array.from({ length: 9 }, (_, i) => { const x = 20 + i * 40, y = 150 + Math.sin((x / 360) * Math.PI * 2) * -12 + 10; return `<circle class="bz-bulb" cx="${x}" cy="${y.toFixed(1)}" r="9" fill="url(#bzBulb)"/><circle cx="${x}" cy="${y.toFixed(1)}" r="3" fill="#FFF1B0"/>`; }).join('')}
  <!-- 出菜口 -->
  <g transform="translate(${TRAY[0]} ${TRAY[1]})">
    <ellipse cx="0" cy="6" rx="40" ry="7" fill="url(#bzShadow)"/>
    <rect x="-38" y="-6" width="76" height="12" rx="3" fill="#C0C0C8" stroke="#8A8A92"/>
  </g>
  <g transform="translate(${TRAY[0]} ${TRAY[1] - 58})"><path d="M-14 0c-8 0-10-12-2-14 2-8 14-8 16 0 8 2 6 14-2 14z" fill="#FFF"/><rect x="-11" y="0" width="22" height="7" fill="#FFF" stroke="#D8D0C0"/></g>
  <text x="${TRAY[0]}" y="${TRAY[1] - 34}" text-anchor="middle" class="bz-tag">總舖師出菜</text>
  <!-- 九位香客（桌子後面一圈） -->
  <g id="bzGuests"></g>
  <!-- 紅圓桌 -->
  <ellipse cx="180" cy="478" rx="140" ry="16" fill="url(#bzShadow)"/>
  <path d="M42 420c0 30 4 52 6 56 40 12 224 12 264 0 2-4 6-26 6-56z" fill="url(#bzCloth)"/>
  <path d="M48 476c40 12 224 12 264 0" stroke="#8A1A14" stroke-width="2" fill="none"/>
  <ellipse cx="180" cy="420" rx="138" ry="62" fill="#E8402A"/>
  <ellipse cx="180" cy="416" rx="130" ry="56" fill="#F05A40"/>
  <ellipse cx="180" cy="416" rx="130" ry="56" fill="none" stroke="#FFB07A" stroke-width="1" opacity=".6"/>
  <circle id="bzSlotRing" cx="180" cy="420" r="26" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <g id="bzTable"></g>
  <!-- 你 -->
  <g id="bzMe" transform="translate(${ME[0]} ${ME[1]})">
    <path d="M-34 52c0-26 14-34 34-34s34 8 34 34z" fill="#F7E6D2" stroke="#C9A98A"/>
    <g clip-path="url(#bzMeClip)"><rect x="-28" y="-28" width="56" height="56" fill="#FFF4E0"/><image id="bzMeImg" x="-28" y="-28" width="56" height="56" preserveAspectRatio="xMidYMin slice"/></g>
    <circle r="28" fill="none" stroke="#FFF4E0" stroke-width="3"/>
  </g>
  <!-- 打包袋 -->
  <g id="bzBag" transform="translate(${BAG[0]} ${BAG[1]})" style="display:none">
    <ellipse cx="0" cy="4" rx="26" ry="5" fill="url(#bzShadow)"/>
    <path d="M-22 2l4-34h36l4 34z" fill="#F4F0E6" stroke="#C9C0B0" opacity=".95"/>
    <path d="M-12 -32c0-12 8-12 8 0M4 -32c0-12 8-12 8 0" stroke="#E8402A" stroke-width="2.6" fill="none"/>
    <text x="0" y="-10" text-anchor="middle" style="font-size:9px;fill:#E8402A;font-weight:900">打包</text>
  </g>
  <circle id="bzBagRing" cx="${BAG[0]}" cy="${BAG[1] - 16}" r="26" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <!-- 今天的菜（出菜口上） -->
  <g id="bzDish" class="stall-prop" data-bz="dish" role="button" tabindex="0" aria-label="這道菜，端上桌" style="display:none"><g id="bzDishArt"></g></g>
  <text id="bzDishName" x="${TRAY[0]}" y="${TRAY[1] + 26}" text-anchor="middle" class="bz-tag"></text>
  <!-- 剩菜（菜尾） -->
  <g id="bzLeft" class="stall-prop" data-bz="left" role="button" tabindex="0" aria-label="剩菜，打包帶回家" style="display:none"><g transform="scale(1.3)">${dishArt({ kind: 'soup', c: '#B8783A' })}</g></g>
  <!-- 酒杯 -->
  <g id="bzCup" class="stall-prop" data-bz="cup" role="button" tabindex="0" aria-label="酒杯，往上滑乾杯" transform="translate(${CUP[0]} ${CUP[1]})" style="display:none">
    <ellipse cx="0" cy="3" rx="16" ry="4" fill="url(#bzShadow)"/>
    <path d="M-10 0l-3 -26h26l-3 26z" fill="#E8F4FF" stroke="#9AB8D8" stroke-width="1.2" opacity=".95"/>
    <path d="M-11 -12h22l-1.5 12h-19z" fill="#E8A83A" opacity=".85"/><ellipse cx="0" cy="-13" rx="11" ry="2" fill="#FFF4C0"/>
  </g>
  <path id="bzCupHint" d="M${CUP[0] + 26} ${CUP[1] - 12}v-30l-6 6M${CUP[0] + 26} ${CUP[1] - 42}l6 6" stroke="#FFE08A" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0"/>
</svg>`;

export function initBanquet(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, addFish, me, chars } = api;
  const host = $('#bzHost');
  host.innerHTML = svgOf();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const bz = state.bz || (state.bz = { last: '', streak: 0, total: 0, seen: [], pack: '', day: null });
  let phase = 'idle', menu = [], idx = 0, run = 0, guests = [];

  function todayMenu() {
    const t = dayKey(), rnd = seeded('menu' + t);
    const unseen = MAINS.filter((d) => !bz.seen.includes(d.id)), rest = MAINS.filter((d) => bz.seen.includes(d.id));
    const mains = [...shuffle(unseen, rnd), ...shuffle(rest, rnd)].slice(0, 3);
    const last = DISHES.filter((d) => d.last); const end = last.find((d) => !bz.seen.includes(d.id)) || last[Math.floor(rnd() * last.length)];
    const m = [DISHES[0], ...mains, end];
    if (bz.pack === yesterdayKey()) m.splice(1, 0, CAIWEI); // 昨天打包的菜尾，今天變成菜尾湯
    return m;
  }
  function paintGuests(show) {
    const mine = me().id;
    guests = shuffle(chars.filter((c) => c.id !== mine), seeded('guest' + dayKey())).slice(0, 9);
    S('bzGuests').innerHTML = SEATS.map(([x, y], i) => `<g class="bz-guest" id="bzG${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" style="${show ? '' : 'display:none'}">
      <path d="M-24 40c0-20 10-26 24-26s24 6 24 26z" fill="${['#7FA6D8', '#F2C14A', '#8AC85A', '#E88EA0', '#C8A0E0', '#F28A5A', '#6BC8C0', '#D8D0C0', '#A0C8F0'][i]}"/>
      <g clip-path="url(#bzFaceClip)"><rect x="-21" y="-21" width="42" height="42" fill="#FFF4E0"/><image href="${guests[i].face}" x="-21" y="-21" width="42" height="42" preserveAspectRatio="xMidYMin slice"/></g>
      <circle r="21" fill="none" stroke="#FFF4E0" stroke-width="2.4"/>
    </g>`).join('');
    S('bzMeImg').setAttribute('href', me().face);
  }
  function paintTable(list) {
    S('bzTable').innerHTML = list.map((d, i) => `<g transform="translate(${SLOTS[i][0]} ${SLOTS[i][1]}) scale(1.3)">${dishArt(d)}</g>`).join('');
  }
  function guestsCheer(n = 3) {
    const picks = shuffle([...Array(9).keys()], Math.random).slice(0, n);
    picks.forEach((i, k) => {
      const g = S('bzG' + i); if (!g) return;
      const [x, y] = SEATS[i];
      setTimeout(() => {
        tween(360, (e, raw) => g.setAttribute('transform', `translate(${x.toFixed(1)} ${(y - Math.sin(raw * Math.PI) * 10).toFixed(1)})`), (q) => q);
        emit('heart', x, y - 24);
      }, k * 90);
    });
  }

  /* ----- 開席：香客一位一位入座 ----- */
  async function openFeast() {
    if (phase === 'done') { showMenu(); return; }
    if (phase !== 'idle') { say(phase === 'serve' ? '菜在右下角出菜口，按住端上桌。' : '照總舖師說的下一步。'); return; }
    const r = ++run; phase = 'seating';
    menu = todayMenu(); idx = 0; paintTable([]);
    paintGuests(false);
    say('廟口紅棚下擺好了圓桌。拜拜完，大家一起來吃<b>平安宴</b>！香客們陸續入座……');
    for (let i = 0; i < 9; i++) {
      await sleep(reduce ? 30 : 150); if (r !== run) return;
      const g = S('bzG' + i); g.style.display = ''; g.classList.remove('pop'); void g.getBoundingClientRect(); g.classList.add('pop');
      sfx.knock();
    }
    await sleep(300); if (r !== run) return;
    phase = 'serve'; nextDish();
  }

  /* ----- 上菜 ----- */
  function nextDish() {
    const d = menu[idx];
    S('bzDishArt').innerHTML = `<g transform="scale(1.3)">${dishArt(d)}</g>`;
    S('bzDish').style.display = ''; carrier.home();
    S('bzDish').classList.remove('pop'); void S('bzDish').getBoundingClientRect(); S('bzDish').classList.add('pop');
    S('bzDishName').textContent = d.name;
    sfx.pop();
    say(idx === 0 ? `總舖師喊：「出菜囉！」第一道一定是冷盤——<b>${d.name}</b>。按住右下角的菜，<b>端到桌子中間</b>。`
      : d.bonus ? `總舖師端出一鍋<b>菜尾湯</b>：「昨天打包的菜尾，加點料煮成湯，今天更入味！」端上桌吧。`
      : `第 ${idx + 1} 道：<b>${d.name}</b>。端上桌！`);
  }
  const slot = () => SLOTS[Math.min(idx, SLOTS.length - 1)];
  const carrier = makeCarrier({
    svg, el: S('bzDish'), sfx, cam, ring: S('bzSlotRing'), lift: 64, radius: 30,
    rest: () => [TRAY[0], TRAY[1] - 6], target: slot, zoom: () => [slot()[0] + 40, slot()[1] + 40, 250],
    onTap: () => say('按住這道菜拿起來（菜會浮在手指上面），拖到圓桌中間發光的地方。'),
    onDrop() {
      const d = menu[idx];
      S('bzDish').style.display = 'none'; S('bzDishName').textContent = '';
      paintTable(menu.slice(0, idx + 1));
      const [x, y] = slot();
      for (let i = 0; i < 8; i++) setTimeout(() => emit('smoke', x + (Math.random() - .5) * 20, y - 8, { color: '#FFFFFF', alpha: .4 }), i * 60);
      burst('spark', x, y - 6, reduce ? 2 : 8);
      sfx.chime(); sfx.buzz([12, 30, 12]);
      emit('text', x, y - 40, { text: d.luck, color: '#FFE08A', size: 16, life: 1.8 });
      guestsCheer(4);
      if (!d.bonus && !bz.seen.includes(d.id)) { bz.seen.push(d.id); save(); emit('text', x, y - 62, { text: '新菜色！', color: '#FFF4E0', size: 12, life: 1.6 }); }
      say(`<b>${d.name}</b>上桌，「${d.luck}」！${pick(CHEER)}${d.note ? `<br>${d.note}` : ''}`);
      idx++;
      cam?.reset(500);
      setTimeout(() => (idx < menu.length ? nextDish() : toastStep()), 1100);
    },
  });

  /* ----- 乾杯 ----- */
  function toastStep() {
    phase = 'toast';
    S('bzCup').style.display = ''; S('bzCup').setAttribute('transform', `translate(${CUP[0]} ${CUP[1]})`);
    S('bzCupHint').setAttribute('opacity', '1');
    say('菜都上齊了！主委站起來敬大家。拿起你的杯子，在杯子上<b>往上滑</b>，一起<b>乾杯</b>！');
  }
  onSwipe(S('bzCup'), svg, {
    dir: 'up', dist: 50,
    onMove(p, k) { if (phase === 'toast') S('bzCup').setAttribute('transform', `translate(${CUP[0]} ${CUP[1] - Math.min(1, k) * 40})`); },
    onDone() { if (phase === 'toast') cheers(); },
  });
  S('bzCup').addEventListener('keydown', (e) => { if (e.key === 'Enter' && phase === 'toast') cheers(); });
  async function cheers() {
    phase = 'cheers'; S('bzCupHint').setAttribute('opacity', '0');
    await tween(260, (k) => S('bzCup').setAttribute('transform', `translate(${CUP[0] - k * 60} ${CUP[1] - 40 - k * 90}) rotate(${-k * 10})`));
    sfx.knock(); sfx.knock(.06); sfx.knock(.12); sfx.buzz([20, 40, 20]);
    guestsCheer(9);
    emit('text', 180, 300, { text: '乾杯！', color: '#FFE08A', size: 26, life: 1.8 });
    burst('spark', 184, 486, reduce ? 4 : 20);
    await sleep(900);
    S('bzCup').style.display = 'none';
    packStep();
  }

  /* ----- 打包菜尾 ----- */
  function packStep() {
    phase = 'pack';
    S('bzBag').style.display = ''; S('bzLeft').style.display = ''; leftC.home();
    say('吃飽了！桌上還有剩菜，台灣人說<b>惜福</b>：按住桌上的<b>剩菜</b>，放進左下角的塑膠袋<b>打包</b>。');
  }
  const leftC = makeCarrier({
    svg, el: S('bzLeft'), sfx, cam, ring: S('bzBagRing'), lift: 64, radius: 30,
    rest: () => [180, 420], target: () => [BAG[0], BAG[1] - 14], zoom: () => [110, 530, 260],
    onTap: () => say('按住<b>剩菜</b>拿起來，放進左下角的<b>打包</b>袋。'),
    onDrop() {
      S('bzLeft').style.display = 'none'; paintTable([]);
      sfx.pop(); sfx.buzz([14]);
      emit('text', BAG[0] + 30, BAG[1] - 70, { text: '惜福', color: '#FFE08A', life: 1.6 });
      finish();
    },
  });
  function finish() {
    phase = 'done';
    const first = daily(bz, dayKey(), yesterdayKey());
    bz.pack = dayKey(); bz.day = dayKey(); save();
    if (first) addFish(1);
    cam?.reset(300);
    sfx.chime();
    const got = bz.seen.length;
    setTimeout(() => say(`平安宴圓滿！打包的菜尾明天會變成<b>菜尾湯</b>，記得回來喝。<br>菜單收集 ${got}/${DISHES.length}${got >= DISHES.length ? '，十二道全吃過了，你是辦桌老饕！' : '，每天的菜都不太一樣。'}${first ? '<br>虎爺叼來小魚乾 ×1。' : ''}`), 400);
  }

  function showMenu() {
    openSheet(`辦桌菜單 ${bz.seen.length}/${DISHES.length}`, `
      <ul class="bz-menu">${DISHES.map((d) => { const on = bz.seen.includes(d.id) || d.first; return `<li class="${on ? 'on' : ''}"><svg viewBox="-32 -26 64 40" aria-hidden="true">${on ? dishArt(d) : '<ellipse cx="0" cy="2" rx="27" ry="10" fill="none" stroke="currentColor" stroke-dasharray="3 3"/>'}</svg><b>${on ? d.name : '？？？'}</b><span>${on ? d.luck : '還沒吃過'}</span></li>`; }).join('')}</ul>
      <p class="hint">辦桌是冷盤先上、甜點（炸湯圓）或水果最後。每天一桌，${bz.streak > 1 ? `已經連續 ${bz.streak} 天來吃。` : '明天的菜會不一樣。'}</p>`);
  }

  $('#bzBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-bz]'); if (!b) return;
    const a = b.dataset.bz;
    if (a === 'open') openFeast();
    else if (a === 'serve') { if (phase === 'serve') carrier.auto(); else if (phase === 'idle') openFeast(); else say(phase === 'done' ? '今天的平安宴吃完了，明天再來。' : '照總舖師說的下一步。'); }
    else if (a === 'toast') { if (phase === 'toast') cheers(); else say(phase === 'pack' ? '已經乾過杯了，剩菜打包吧。' : '菜上齊了才乾杯。'); }
    else if (a === 'pack') { if (phase === 'pack') leftC.auto(); else say('吃完、乾杯以後再打包。'); }
    else if (a === 'menu') showMenu();
  });

  return {
    enter() {
      run++; menu = todayMenu();
      for (const id of ['bzDish', 'bzLeft', 'bzBag', 'bzCup']) S(id).style.display = 'none';
      S('bzCupHint').setAttribute('opacity', '0'); S('bzDishName').textContent = '';
      if (bz.day === dayKey()) {
        phase = 'done'; paintGuests(true); paintTable([]);
        say('今天的平安宴已經吃過了，香客們還在聊天。明天回來喝<b>菜尾湯</b>，菜色也會換。按「菜單」看收集到的菜。');
        return;
      }
      phase = 'idle'; paintGuests(false); paintTable([]);
      say(`廟口紅棚下的<b>流水席</b>開桌了！${bz.pack === yesterdayKey() ? '昨天打包的菜尾，總舖師煮成<b>菜尾湯</b>了。' : ''}按「<b>開席</b>」請香客入座。`);
    },
    leave() { run++; },
  };
}

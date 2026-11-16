// 許願放生池（id fs）：每天來餵魚、放一隻小烏龜、放一盞蓮花水燈。
// 池子會跟著你來的天數一天天變熱鬧：清水小池 → 荷葉田田 → 蓮花盛開 → 金鯉現身 → 鯉躍龍門。
// 場景 360 × 645，跟攤位一樣是一整張蓋在正殿上面的 SVG；SVG 裡的 id 都加 p 前綴。
// 美術：有 Gemini 圖就用（src/assets/fs/*.webp），沒有先用程式畫的。
import { makeCarrier } from './carry.js';
import { reduce, sleep, tween, pick, daily, yesterdayKey } from './stall.js';
import { wallet } from './wallet.js';

const ART = import.meta.glob('./assets/fs/*.webp', { eager: true, import: 'default' });
const art = (k) => ART[`./assets/fs/${k}.webp`];

/* ---------- 數值 ---------- */
const POND = { cx: 180, cy: 405, rx: 165, ry: 124 }; // 池面
const SWIM = { rx: 138, ry: 96 }; // 魚游的範圍
const ROCK = [286, 322]; // 烏龜曬太陽的石頭
const SCOOP_REST = [300, 606], BUCKET = [62, 612], TRAY = [180, 616];
const ENTRY = [128, 518]; // 小烏龜下水的地方
const LAMP_IN = [180, 500];
const FEEDS = 3; // 每天可以餵幾勺
const LAMP_COST = 10; // 水燈香油錢（福氣幣）
const FEED_GIFT = 10; // 每天第一次餵魚
const STAGES = [
  { at: 0, name: '清水小池', fish: 3, tip: '池子剛整理好，水還有點濁，只有三條小鯉魚。' },
  { at: 3, name: '荷葉田田', fish: 5, tip: '水清了，荷葉一片片浮上來，魚也多了。' },
  { at: 7, name: '蓮花盛開', fish: 7, tip: '蓮花開了，蜻蜓也飛來了。' },
  { at: 14, name: '金鯉現身', fish: 9, tip: '池裡出現一條金色的錦鯉，看到牠會有好運。' },
  { at: 30, name: '鯉躍龍門', fish: 12, tip: '錦鯉會跳出水面！整個池子熱熱鬧鬧。' },
];
const KOI = [ // 身體、斑、鰭
  ['#FFF6EC', '#E8402A', '#FFE6DA'], ['#FF8A3A', '#FFF6EC', '#FFC08A'], ['#FFF6EC', '#2A2A30', '#FFE6DA'],
  ['#F2603A', '#FFE08A', '#FFB08A'], ['#FFFFFF', '#E8402A', '#FFE6DA'], ['#E8C690', '#E8402A', '#FFE6C0'],
];
const GOLD = ['#FFD24A', '#FFF2A8', '#FFE58A'];
const WISHES = [['peace', '平安'], ['health', '健康'], ['study', '學業'], ['work', '事業'], ['love', '姻緣'], ['money', '財運']];
const WHO = [['me', '自己'], ['family', '家人'], ['friend', '朋友'], ['love', '另一半'], ['pet', '毛小孩']];
const TNAMES = ['阿龜', '慢慢', '小綠', '圓圓', '豆豆', '殼殼', '福福', '壽壽', '小石頭', '布丁'];
const FISH_LINE = [
  '魚兒圍過來搶著吃，水面冒出一圈一圈的泡泡。',
  '一條紅白錦鯉吃得最快，尾巴一甩濺起小水花。',
  '魚兒吃飽了，慢慢游回荷葉底下。',
  '水面閃閃發亮，好像在跟你說謝謝。',
];
const TURTLE_LINE = [
  '小烏龜伸長脖子看了你一眼，慢慢游走了。',
  '小烏龜划了兩下，爬上石頭曬太陽。',
  '小烏龜一下水就鑽進荷葉底下，探出頭來。',
];

const KEY = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const inPond = (x, y, sx = POND.rx - 14, sy = POND.ry - 12) => ((x - POND.cx) / sx) ** 2 + ((y - POND.cy) / sy) ** 2 < 1;
const randIn = () => { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()); return [POND.cx + Math.cos(a) * SWIM.rx * r, POND.cy + Math.sin(a) * SWIM.ry * r]; };
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs = {}, html = '') => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); if (html) el.innerHTML = html; return el; };

/* ---------- 程式畫的暫代圖 ---------- */
const koiSVG = ([b, s, f], big = 1) => art(big > 1 ? 'koi-gold' : 'koi')
  ? `<image href="${art(big > 1 ? 'koi-gold' : 'koi')}" x="-24" y="-12" width="48" height="24"/>`
  : `<g transform="scale(${big})">
    <path class="tail" d="M-11 0L-23 -7Q-19 0 -23 7Z" fill="${f}" opacity=".9"/>
    <path d="M2 -4L-4 -11L-6 -4ZM2 4L-4 11L-6 4Z" fill="${f}" opacity=".85"/>
    <path d="M-13 0C-8 -7 7 -7 14 0C7 7 -8 7 -13 0Z" fill="${b}"/>
    <ellipse cx="4" cy="-1" rx="5" ry="3" fill="${s}"/><ellipse cx="-5" cy="1.5" rx="3.5" ry="2.2" fill="${s}"/>
    <circle cx="10" cy="-2.6" r=".9" fill="#2A1A14"/><circle cx="10" cy="2.6" r=".9" fill="#2A1A14"/>
  </g>`;
const turtleTop = () => art('turtle')
  ? '<image href="' + art('turtle') + '" x="-16" y="-13" width="32" height="26"/>'
  : `<g><ellipse cx="13" cy="0" rx="5" ry="4" fill="#9ACB6A"/>
    <ellipse cx="6" cy="-9" rx="3.4" ry="2.4" fill="#9ACB6A"/><ellipse cx="6" cy="9" rx="3.4" ry="2.4" fill="#9ACB6A"/>
    <ellipse cx="-7" cy="-8" rx="3" ry="2.2" fill="#9ACB6A"/><ellipse cx="-7" cy="8" rx="3" ry="2.2" fill="#9ACB6A"/>
    <ellipse cx="0" cy="0" rx="11" ry="9" fill="#4E8A4A"/><path d="M-6 -4h12M-6 4h12M0 -8v16" stroke="#7FB86A" stroke-width="1.2"/>
    <circle cx="15" cy="-1.5" r=".9" fill="#1A2A10"/><circle cx="15" cy="1.5" r=".9" fill="#1A2A10"/></g>`;
const turtleSide = (w = 40) => art('turtle-side')
  ? `<image href="${art('turtle-side')}" x="${-w / 2}" y="${-w * .8}" width="${w}" height="${w * .8}"/>`
  : `<g transform="scale(${w / 40})"><ellipse cx="0" cy="-2" rx="16" ry="3" fill="#000" opacity=".15"/>
    <path d="M-14 -4c0-10 6-15 14-15s14 5 14 15z" fill="#4E8A4A"/><path d="M-8 -12l8 -3 8 3M-12 -6h24" stroke="#7FB86A" stroke-width="1.4" fill="none"/>
    <ellipse cx="-10" cy="-3" rx="3" ry="3" fill="#9ACB6A"/><ellipse cx="9" cy="-3" rx="3" ry="3" fill="#9ACB6A"/>
    <circle cx="17" cy="-11" r="5.5" fill="#9ACB6A"/><circle cx="19" cy="-12" r="1.2" fill="#1A2A10"/><path d="M17 -8.5q2 1 4 0" stroke="#1A2A10" stroke-width=".8" fill="none"/></g>`;
const lampSVG = (open = 0) => art(open ? 'lamp-open' : 'lamp')
  ? `<image href="${art(open ? 'lamp-open' : 'lamp')}" x="-20" y="-30" width="40" height="34"/>`
  : `<g><ellipse cx="0" cy="0" rx="18" ry="5" fill="#6BAE5A"/>
    ${[-40, -20, 0, 20, 40].map((a) => `<path d="M0 -2C-6 -10 -5 -22 0 -26C5 -22 6 -10 0 -2Z" fill="${a ? '#FFB8C8' : '#FF9AB0'}" stroke="#F27A96" stroke-width=".6" transform="rotate(${a * (open ? 1.5 : .5)})"/>`).join('')}
    <circle cx="0" cy="-8" r="3.2" fill="#FFE08A"/><path d="M0 -11q1.6 -3 0 -6q-1.6 3 0 6z" fill="#FF9A3A"/></g>`;
const scoopSVG = () => art('scoop')
  ? `<image href="${art('scoop')}" x="-26" y="-46" width="52" height="46"/>`
  : `<g><path d="M6 -14L26 -44" stroke="#B8844A" stroke-width="5" stroke-linecap="round"/>
    <path d="M-18 -18c0 12 6 17 15 17s15 -5 15 -17z" fill="#E8DCC6" stroke="#B8A888" stroke-width="1.2"/>
    <ellipse cx="-3" cy="-18" rx="15" ry="4" fill="#C8783E"/>
    <circle cx="-8" cy="-20" r="1.6" fill="#E89A4A"/><circle cx="-1" cy="-21" r="1.6" fill="#D8783A"/><circle cx="4" cy="-19.5" r="1.6" fill="#E89A4A"/></g>`;
const bucketSVG = () => art('bucket')
  ? `<image href="${art('bucket')}" x="-34" y="-58" width="68" height="58"/>`
  : `<g><ellipse cx="0" cy="0" rx="30" ry="6" fill="#000" opacity=".18"/>
    <path d="M-28 -40l5 38c1 3 45 3 46 0l5 -38z" fill="#6AA8D8"/><ellipse cx="0" cy="-40" rx="28" ry="7" fill="#9FD0F0" stroke="#4A88B8" stroke-width="1.4"/>
    <path d="M-26 -40c0 -22 52 -22 52 0" stroke="#4A88B8" stroke-width="2" fill="none"/></g>`;
const lilySVG = (r, rot) => art('lily')
  ? `<image href="${art('lily')}" x="${-r}" y="${-r * .7}" width="${r * 2}" height="${r * 1.4}" transform="rotate(${rot})"/>`
  : `<path d="M0 0L${r} ${-r * .18}A${r} ${r * .62} 0 1 0 ${r} ${r * .18}Z" fill="#5FA850" stroke="#3E8A3A" stroke-width=".8" transform="rotate(${rot})"/><path d="M0 0L${-r * .6} ${-r * .2}M0 0L${-r * .5} ${r * .3}" stroke="#7FC86A" stroke-width=".8" transform="rotate(${rot})"/>`;
const lotusSVG = () => art('lotus')
  ? `<image href="${art('lotus')}" x="-15" y="-24" width="30" height="28"/>`
  : `<g>${[-50, -25, 0, 25, 50].map((a) => `<path d="M0 0C-5 -7 -4 -17 0 -21C4 -17 5 -7 0 0Z" fill="#FFC8D6" stroke="#F28AA6" stroke-width=".6" transform="rotate(${a})"/>`).join('')}<circle cx="0" cy="-5" r="3" fill="#FFE08A"/></g>`;

function bgSVG() {
  if (art('bg')) return `<image href="${art('bg')}" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>`;
  const stones = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2, x = POND.cx + Math.cos(a) * (POND.rx + 8), y = POND.cy + Math.sin(a) * (POND.ry + 8);
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${14 + (i % 3) * 3}" ry="${8 + (i % 2) * 2}" fill="${i % 2 ? '#B8AE9E' : '#A89E8E'}" stroke="#8A806E" stroke-width="1"/>`;
  }).join('');
  return `
  <rect width="360" height="645" fill="#CFE6C0"/>
  <rect width="360" height="190" fill="url(#pSky)"/>
  <path d="M0 150h360v70H0z" fill="#B8352A"/>
  <path d="M-10 150l40 -40h300l40 40z" fill="#8A3A2A"/><path d="M-10 150l40 -40h300l40 40" fill="none" stroke="#5A2418" stroke-width="2"/>
  ${Array.from({ length: 16 }, (_, i) => `<path d="M${10 + i * 22} 150v-34" stroke="#6A2A1E" stroke-width="2"/>`).join('')}
  <path d="M0 150h360" stroke="#F6C84A" stroke-width="3"/>
  ${[50, 130, 230, 310].map((x) => `<rect x="${x - 14}" y="166" width="28" height="36" rx="3" fill="#E8DCC6" stroke="#8A3A2A" stroke-width="2"/><path d="M${x} 168v32M${x - 12} 184h24" stroke="#8A3A2A" stroke-width="1.4"/>`).join('')}
  <path d="M0 220h360v40H0z" fill="#8FC07A"/>
  ${[20, 70, 300, 345].map((x, i) => `<circle cx="${x}" cy="${238 + (i % 2) * 6}" r="${26 + (i % 2) * 6}" fill="#5FA050"/><circle cx="${x + 12}" cy="${232 + (i % 2) * 6}" r="${16}" fill="#7FB86A"/>`).join('')}
  <path d="M0 540h360v105H0z" fill="#D8CDB4"/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 45} 540v105" stroke="#C4B89C" stroke-width="1.2"/>`).join('')}
  <path d="M0 590h360" stroke="#C4B89C" stroke-width="1.2"/>
  ${stones}
  <rect x="238" y="250" width="70" height="26" rx="4" fill="#8A3A2A" stroke="#F6C84A" stroke-width="2"/>
  <text x="273" y="268" text-anchor="middle" class="fs-sign">許願放生池</text>`;
}

const svgOf = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="許願放生池" class="stall-svg fs-svg">
  <defs>
    <linearGradient id="pSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD4F4"/><stop offset="1" stop-color="#E8F4F0"/></linearGradient>
    <radialGradient id="pWater" cx=".5" cy=".4" r=".7"><stop offset="0" id="pW0" stop-color="#7FD0D8"/><stop offset="1" id="pW1" stop-color="#3E98B0"/></radialGradient>
    <clipPath id="pClip"><ellipse cx="${POND.cx}" cy="${POND.cy}" rx="${POND.rx}" ry="${POND.ry}"/></clipPath>
  </defs>
  ${bgSVG()}
  ${art('bg') ? '' : `<ellipse cx="${POND.cx}" cy="${POND.cy}" rx="${POND.rx}" ry="${POND.ry}" fill="url(#pWater)"/>`}
  <ellipse id="pMurk" cx="${POND.cx}" cy="${POND.cy}" rx="${POND.rx}" ry="${POND.ry}" fill="#8A9A6A" opacity="0"/>
  <g clip-path="url(#pClip)">
    <g id="pShine" opacity=".35">${[[120, 350], [230, 440], [170, 480]].map(([x, y]) => `<path d="M${x - 18} ${y}q18 -6 36 0" stroke="#FFF" stroke-width="1.4" fill="none"/>`).join('')}</g>
    <g id="pFish"></g>
    <g id="pPads"></g>
    <g id="pLamps"></g>
    <g id="pFood"></g>
    <g id="pRip"></g>
  </g>
  <g id="pRock" transform="translate(${ROCK[0]} ${ROCK[1]})">
    ${art('rock') ? `<image href="${art('rock')}" x="-40" y="-30" width="80" height="44"/>` : '<path d="M-36 8c-4 -22 14 -34 38 -32s38 14 32 32c-6 8 -64 8 -70 0z" fill="#9A9080" stroke="#7A705E" stroke-width="1.4"/><path d="M-20 -14q14 -8 30 -4" stroke="#B8AE9E" stroke-width="2" fill="none"/>'}
    <g id="pSun"></g>
  </g>
  <g id="pFly" style="display:none"><path d="M-8 -3l8 3-8 3M8 -3l-8 3 8 3" fill="#BFE6FF" opacity=".8"/><path d="M-1 0h14" stroke="#3E6FD8" stroke-width="2" stroke-linecap="round"/></g>
  <g id="pJump" style="display:none"></g>
  <!-- 地上的道具 -->
  <g id="pBucket" transform="translate(${BUCKET[0]} ${BUCKET[1]})">${bucketSVG()}<g id="pPeek" transform="translate(0 -40)">${turtleSide(30)}</g></g>
  <text x="${BUCKET[0]}" y="636" text-anchor="middle" class="xr-tag">小烏龜</text>
  <g id="pTurtle" class="stall-prop" tabindex="0" role="button" aria-label="小烏龜，拖到池邊放進池裡" style="display:none">${turtleSide(40)}</g>
  <g id="pTray" transform="translate(${TRAY[0]} ${TRAY[1]})">${art('tray') ? `<image href="${art('tray')}" x="-34" y="-14" width="68" height="22"/>` : '<rect x="-32" y="-10" width="64" height="14" rx="4" fill="#A0703E" stroke="#6A4420" stroke-width="1.2"/>'}</g>
  <text x="${TRAY[0]}" y="636" text-anchor="middle" class="xr-tag">蓮花水燈</text>
  <g id="pLamp" class="stall-prop" tabindex="0" role="button" aria-label="蓮花水燈，拖到池裡放水燈" style="display:none">${lampSVG()}</g>
  <g id="pScoop" class="stall-prop" tabindex="0" role="button" aria-label="魚飼料，拖到池面上撒下去" transform="translate(${SCOOP_REST[0]} ${SCOOP_REST[1]})">${scoopSVG()}</g>
  <text x="${SCOOP_REST[0]}" y="636" text-anchor="middle" class="xr-tag" id="pScoopTag">魚飼料</text>
  <circle id="pEntryRing" cx="${ENTRY[0]}" cy="${ENTRY[1]}" r="20" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <circle id="pLampRing" cx="${LAMP_IN[0]}" cy="${LAMP_IN[1]}" r="22" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <g id="pStage" transform="translate(16 286)"><rect x="0" y="-14" width="96" height="20" rx="10" fill="rgb(40 20 10 / .55)"/><text id="pStageT" x="48" y="0" text-anchor="middle" class="fs-stage"></text></g>
</svg>`;

export function initPond(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam } = api;
  const host = $('#fsHost');
  host.innerHTML = svgOf();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const fs = state.fs || (state.fs = { last: '', streak: 0, total: 0, feed: { date: '', n: 0 }, turtles: [], tDay: '', lamps: [], lDay: '' });
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  let running = false, raf = 0, last = 0, run = 0;
  let fish = [], swimmers = [], food = [], lampsF = [], flyT = 0, jumpAt = 0;

  const stageNo = () => STAGES.reduce((n, s, i) => (fs.total >= s.at ? i : n), 0);
  const fedToday = () => (fs.feed.date === dayKey() ? fs.feed.n : 0);

  /* ----- 畫池子：依階段放魚、荷葉、蓮花 ----- */
  function paint() {
    const st = stageNo();
    S('pStageT').textContent = STAGES[st].name;
    S('pMurk').setAttribute('opacity', st === 0 ? '.28' : '0');
    // 荷葉、蓮花
    const pads = [[78, 352, 15, 20], [104, 470, 17, 200], [252, 474, 16, 120], [208, 318, 13, 300], [312, 420, 14, 60], [52, 420, 12, 160], [160, 510, 13, 250]];
    S('pPads').innerHTML = st < 1 ? '' : pads.slice(0, st >= 2 ? 7 : 4).map(([x, y, r, rot], i) => `<g transform="translate(${x} ${y})">${lilySVG(r, rot)}${st >= 2 && i % 2 === 0 ? `<g transform="translate(2 -2)">${lotusSVG()}</g>` : ''}</g>`).join('');
    // 魚
    const want = STAGES[st].fish + (st >= 3 ? 1 : 0);
    while (fish.length < want) addFish(st >= 3 && !fish.some((f) => f.gold) ? 'gold' : null);
    // 烏龜：前三隻在石頭上曬太陽，其他在水裡游
    const ts = fs.turtles;
    S('pSun').innerHTML = ts.slice(-3).map((_, i) => `<g transform="translate(${-18 + i * 18} ${-14 - (i % 2) * 6}) scale(${i % 2 ? -1 : 1} 1)">${turtleSide(26)}</g>`).join('');
    const swimN = Math.min(8, Math.max(0, ts.length - 3));
    while (swimmers.length < swimN) swimmers.push(makeSwimmer('turtle'));
    // 水燈：最近 7 天的燈還漂在池上
    const wk = new Date(); wk.setDate(wk.getDate() - 6);
    const keep = fs.lamps.filter((l) => new Date(l.t || 0) >= new Date(wk.toDateString()));
    S('pLamps').innerHTML = ''; lampsF = [];
    keep.slice(-7).forEach((l, i) => addLampFloat(i));
    S('pFly').style.display = st >= 2 ? '' : 'none';
    S('pPeek').style.display = fs.tDay === dayKey() ? 'none' : '';
    S('pScoopTag').textContent = `魚飼料 ${Math.max(0, FEEDS - fedToday())}/${FEEDS}`;
  }
  function addFish(kind) {
    const gold = kind === 'gold', [x, y] = randIn();
    const el = mk('g', { class: 'fs-koi' }, koiSVG(gold ? GOLD : KOI[fish.length % KOI.length], gold ? 1.35 : .85 + Math.random() * .35));
    S('pFish').appendChild(el);
    fish.push({ el, x, y, a: Math.random() * 6.28, v: 16 + Math.random() * 8, to: randIn(), ph: Math.random() * 6, gold, tail: el.querySelector('.tail') });
  }
  function makeSwimmer() {
    const [x, y] = randIn();
    const el = mk('g', { class: 'fs-turtle' }, turtleTop());
    S('pFish').appendChild(el);
    return { el, x, y, a: Math.random() * 6.28, v: 7, to: randIn(), ph: 0, turtle: true };
  }
  function addLampFloat(i, at) {
    const [x, y] = at || [POND.cx - 90 + (i % 4) * 58, POND.cy - 30 + Math.floor(i / 4) * 70 + (i % 2) * 14];
    const el = mk('g', { class: 'fs-lamp' }, lampSVG(1));
    S('pLamps').appendChild(el);
    const L = { el, x, y, ox: x, oy: y, ph: Math.random() * 6 };
    lampsF.push(L); return L;
  }

  /* ----- 每一幀：魚游、搶飼料、蜻蜓、錦鯉跳 ----- */
  function steer(f, dt) {
    let [tx, ty] = f.to, speed = f.v;
    if (!f.turtle && food.length) {
      let best = null, bd = 1e9;
      for (const p of food) { const d = Math.hypot(p.x - f.x, p.y - f.y); if (d < bd) { bd = d; best = p; } }
      if (best) { tx = best.x; ty = best.y; speed = f.v * 2.8; if (bd < 7) eat(best, f); }
    } else if (Math.hypot(tx - f.x, ty - f.y) < 12) f.to = randIn();
    const want = Math.atan2(ty - f.y, tx - f.x);
    let d = want - f.a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    f.a += Math.max(-2.6 * dt, Math.min(2.6 * dt, d)) * (f.turtle ? .6 : 1);
    f.x += Math.cos(f.a) * speed * dt; f.y += Math.sin(f.a) * speed * dt;
    if (!inPond(f.x, f.y, SWIM.rx + 10, SWIM.ry + 10)) { f.a += Math.PI * dt * 3; f.to = randIn(); }
    f.ph += dt * (speed / 6);
    f.el.setAttribute('transform', `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${(f.a * 57.3).toFixed(1)})`);
    f.tail?.setAttribute('transform', `rotate(${(Math.sin(f.ph) * 14).toFixed(1)} -11 0)`);
  }
  function frame(t) {
    if (!running) return;
    const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    for (const f of fish) steer(f, dt);
    for (const f of swimmers) steer(f, dt);
    for (const L of lampsF) { L.ph += dt * .5; L.el.setAttribute('transform', `translate(${(L.ox + Math.sin(L.ph) * 8).toFixed(1)} ${(L.oy + Math.cos(L.ph * .8) * 4).toFixed(1)})`); }
    for (const p of food) { p.age += dt; p.el.setAttribute('opacity', p.age > 9 ? String(Math.max(0, 1 - (p.age - 9))) : '1'); }
    food = food.filter((p) => { if (p.age > 10) { p.el.remove(); return false; } return true; });
    if (S('pFly').style.display !== 'none') {
      flyT += dt;
      const x = 180 + Math.sin(flyT * .7) * 120, y = 330 + Math.sin(flyT * 1.3) * 50 - 20;
      S('pFly').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${Math.cos(flyT * .7) > 0 ? 0 : 180})`);
    }
    if (stageNo() >= 4 && !reduce && t > jumpAt) { jumpAt = t + 7000 + Math.random() * 6000; if (jumpAt - t > 100) koiJump(); }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function ripple(x, y, r = 16, ms = 900) {
    const c = mk('circle', { cx: x, cy: y, r: 2, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.4, opacity: '.8' });
    S('pRip').appendChild(c);
    tween(ms, (k) => { c.setAttribute('r', (2 + r * k).toFixed(1)); c.setAttribute('opacity', (.8 * (1 - k)).toFixed(2)); }).then(() => c.remove());
  }
  function eat(p, f) {
    food = food.filter((q) => q !== p); p.el.remove();
    ripple(p.x, p.y, 10, 500);
    if (f.gold) emit('spark', p.x, p.y);
  }
  async function koiJump() {
    const g = S('pJump'), [x0] = randIn(), y0 = POND.cy + 20, dir = Math.random() < .5 ? 1 : -1;
    g.innerHTML = koiSVG(Math.random() < .4 ? GOLD : pick(KOI), 1.3); g.style.display = '';
    ripple(x0, y0, 20);
    await tween(1100, (k, raw) => {
      const x = x0 + dir * 70 * raw, y = y0 - Math.sin(raw * Math.PI) * 90;
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(dir > 0 ? -70 + raw * 140 : 250 - raw * 140).toFixed(0)}) scale(1 ${dir})`);
    }, (k) => k);
    g.style.display = 'none'; ripple(x0 + dir * 70, y0, 22); burst('drop', x0 + dir * 70, y0, 6);
  }

  /* ----- 1. 餵魚：按住飼料勺，浮在手指上方，到池面上放開就撒下去 ----- */
  const scoop = S('pScoop');
  let drag = null, spos = [...SCOOP_REST], busy = false;
  const placeScoop = (tilt = 0) => scoop.setAttribute('transform', `translate(${spos[0].toFixed(1)} ${spos[1].toFixed(1)}) rotate(${tilt})`);
  scoop.addEventListener('pointerdown', (e) => {
    if (busy) return;
    e.preventDefault(); scoop.setPointerCapture(e.pointerId);
    const p = pt(e); drag = { moved: false, x0: p.x, y0: p.y }; scoop.classList.add('held'); sfx.pop();
  });
  scoop.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pt(e);
    if (!drag.moved && Math.hypot(p.x - drag.x0, p.y - drag.y0) > 6) {
      if (fedToday() >= FEEDS) { drag = null; scoop.classList.remove('held'); full(); return; }
      drag.moved = true; cam?.zoom(POND.cx, POND.cy, 300);
    }
    if (!drag.moved) return;
    spos = [Math.max(24, Math.min(336, p.x)), Math.max(80, Math.min(620, p.y - 72))];
    placeScoop(inPond(spos[0], spos[1] - 18) ? -25 : 0);
  });
  const scoopUp = () => {
    if (!drag) return;
    const moved = drag.moved; drag = null; scoop.classList.remove('held');
    if (!moved) { feed(); return; }
    const at = [spos[0], spos[1] - 18];
    if (inPond(...at)) pour(at); else { say('拿到<b>池面上</b>再放開，飼料才會撒進水裡。'); homeScoop(); }
  };
  scoop.addEventListener('pointerup', scoopUp); scoop.addEventListener('pointercancel', scoopUp);
  scoop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); feed(); } });
  function homeScoop() {
    const from = [...spos];
    tween(380, (k) => { spos = [from[0] + (SCOOP_REST[0] - from[0]) * k, from[1] + (SCOOP_REST[1] - from[1]) * k]; placeScoop(); });
    cam?.reset(500);
  }
  function full() { say('今天的魚飼料撒完了，魚兒吃得飽飽的。<b>明天再來餵</b>，池子會越來越熱鬧。'); sfx.knock(); }
  function feed() { // 按鈕或點一下：勺子自己飛到池面撒
    if (busy) return;
    if (fedToday() >= FEEDS) { full(); return; }
    busy = true; cam?.zoom(POND.cx, POND.cy, 300);
    const to = randIn(), from = [...spos];
    tween(600, (k) => { spos = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] + 18 - from[1]) * k - Math.sin(k * Math.PI) * 30]; placeScoop(-25 * k); })
      .then(() => { busy = false; pour(to); });
  }
  async function pour(at) {
    busy = true; const my = run;
    placeScoop(-50); sfx.rattle(.5);
    for (let i = 0; i < 8; i++) {
      const x = at[0] + (Math.random() - .5) * 44, y = at[1] + (Math.random() - .5) * 26;
      if (!inPond(x, y)) continue;
      const el = mk('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 2.2, fill: i % 2 ? '#C8783E' : '#E89A4A', stroke: '#8A4A1E', 'stroke-width': .5 });
      S('pFood').appendChild(el); food.push({ el, x, y, age: 0 });
      setTimeout(() => ripple(x, y, 8, 500), i * 40);
    }
    await sleep(350); if (my !== run) return;
    homeScoop(); busy = false;
    const today = dayKey();
    if (fs.feed.date !== today) fs.feed = { date: today, n: 0 };
    fs.feed.n++;
    const first = daily(fs, today, yesterdayKey());
    save();
    S('pScoopTag').textContent = `魚飼料 ${Math.max(0, FEEDS - fs.feed.n)}/${FEEDS}`;
    if (first) {
      wallet.earn(FEED_GIFT, '放生池餵魚', at[0], at[1] - 30);
      const st = stageNo(), prev = STAGES.reduce((n, s, i) => (fs.total - 1 >= s.at ? i : n), 0);
      if (st > prev) { setTimeout(() => levelUp(st), 1400); return; }
      const next = STAGES[st + 1];
      say(`${pick(FISH_LINE)}<br>今天第一次來餵魚，福氣 +${FEED_GIFT}。${fs.streak > 1 ? `已經連續來了 <b>${fs.streak}</b> 天。` : ''}${next ? `再來 ${next.at - fs.total} 天，池子會變成「${next.name}」。` : ''}`);
    } else say(fs.feed.n >= FEEDS ? `${pick(FISH_LINE)}今天的三勺都餵完了，明天再來。` : `${pick(FISH_LINE)}還可以再餵 ${FEEDS - fs.feed.n} 勺。`);
  }
  function levelUp(st) {
    paint(); sfx.chime(); sfx.buzz([20, 60, 20, 60, 40]);
    burst('spark', POND.cx, POND.cy, reduce ? 6 : 30);
    emit('text', POND.cx, POND.cy - 60, { text: STAGES[st].name, color: '#FFE08A', life: 2.2 });
    say(`池子變熱鬧了！升級成「<b>${STAGES[st].name}</b>」。${STAGES[st].tip}`);
  }

  /* ----- 2. 放小烏龜：每天一隻，取名字、許個願，抱到池邊放下去 ----- */
  let tDraft = null;
  const turtle = makeCarrier({
    svg, el: S('pTurtle'), sfx, cam, ring: S('pEntryRing'), lift: 64, radius: 30,
    rest: () => [BUCKET[0], BUCKET[1] - 40], target: () => ENTRY, zoom: () => [ENTRY[0] + 30, ENTRY[1] - 60, 240],
    onTap: () => say('按住<b>小烏龜</b>，拖到池邊發亮的圈圈放下。'),
    async onDrop() {
      if (!tDraft) return;
      S('pTurtle').style.display = 'none'; sfx.pop(); ripple(ENTRY[0], ENTRY[1] - 8, 22); burst('drop', ENTRY[0], ENTRY[1] - 8, 8);
      const t = { name: tDraft.name, wish: tDraft.wish, t: Date.now() };
      fs.turtles.push(t); fs.tDay = dayKey(); tDraft = null; save();
      // 游一小段給你看，然後回到池子裡
      const sw = makeSwimmer(); sw.x = ENTRY[0]; sw.y = ENTRY[1] - 16; sw.a = -1.2; sw.to = fs.turtles.length <= 3 ? [ROCK[0] - 20, ROCK[1] + 10] : randIn();
      swimmers.push(sw);
      await sleep(1800); cam?.reset();
      emit('text', ENTRY[0] + 30, ENTRY[1] - 70, { text: `${t.name}：${WISHES.find((w) => w[0] === t.wish)[1]}`, color: '#BFF0A8', life: 2 });
      if (fs.turtles.length <= 3) { sw.el.remove(); swimmers = swimmers.filter((x) => x !== sw); }
      paint();
      say(`${pick(TURTLE_LINE)}<br>「${esc(t.name)}」幫你守著「${WISHES.find((w) => w[0] === t.wish)[1]}」的願望。池裡現在有 <b>${fs.turtles.length}</b> 隻小烏龜。`);
      if (fs.turtles.length === 1) setTimeout(() => say('小提醒：現實中隨意放生會傷害生態，放生前要先問專家喔。這座池子只收你的心意。'), 4200);
    },
  });
  function openTurtle() {
    if (fs.tDay === dayKey()) { say(`今天已經放過一隻小烏龜了。明天再來，牠會帶朋友回來。池裡有 <b>${fs.turtles.length}</b> 隻。`); sfx.knock(); return; }
    let wish = WISHES[0][0];
    const body = openSheet('放一隻小烏龜', `
      <p>烏龜代表長壽平安。幫今天的小烏龜取個名字，讓牠替你守一個願望。</p>
      <input id="pTName" class="yue-wish" maxlength="6" placeholder="${pick(TNAMES)}">
      <div class="chips" id="pWish">${WISHES.map(([id, n], i) => `<button type="button" class="chip" data-w="${id}" aria-pressed="${i === 0}">${n}</button>`).join('')}</div>
      <div class="row"><button class="btn" id="pTGo">抱起小烏龜</button></div>`);
    body.querySelector('#pWish').addEventListener('click', (e) => {
      const b = e.target.closest('[data-w]'); if (!b) return;
      wish = b.dataset.w; body.querySelectorAll('[data-w]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    body.querySelector('#pTGo').addEventListener('click', () => {
      const inp = body.querySelector('#pTName');
      tDraft = { name: inp.value.trim().replace(/\s+/g, '') || inp.placeholder, wish };
      closeSheet(); S('pPeek').style.display = 'none'; S('pTurtle').style.display = ''; turtle.home();
      cam?.zoom(BUCKET[0] + 60, BUCKET[1] - 90, 260);
      say(`「${esc(tDraft.name)}」從水桶裡探出頭。按住牠，拖到<b>池邊發亮的圈圈</b>放下。`);
    });
  }

  /* ----- 3. 放水燈：寫一個願望，蓮花燈放進池裡，漂著慢慢開 ----- */
  let lDraft = null;
  const lamp = makeCarrier({
    svg, el: S('pLamp'), sfx, cam, ring: S('pLampRing'), lift: 64, radius: 30,
    rest: () => [TRAY[0], TRAY[1] - 10], target: () => LAMP_IN, zoom: () => [LAMP_IN[0], LAMP_IN[1] - 50, 240],
    onTap: () => say('按住<b>蓮花燈</b>，拖到池面發亮的圈圈放下。'),
    async onDrop() {
      if (!lDraft) return;
      S('pLamp').style.display = 'none'; sfx.chime(); ripple(LAMP_IN[0], LAMP_IN[1], 24);
      const rec = { wish: lDraft.wish, who: lDraft.who, t: Date.now() };
      fs.lamps.push(rec); if (fs.lamps.length > 30) fs.lamps.shift(); fs.lDay = dayKey(); lDraft = null; save();
      const L = addLampFloat(0, [...LAMP_IN]);
      const to = [POND.cx + (Math.random() - .5) * 160, POND.cy - 20 + (Math.random() - .5) * 60];
      await tween(2400, (k) => { L.ox = LAMP_IN[0] + (to[0] - LAMP_IN[0]) * k; L.oy = LAMP_IN[1] + (to[1] - LAMP_IN[1]) * k; });
      burst('spark', L.ox, L.oy - 10, reduce ? 4 : 14);
      cam?.reset();
      say(`蓮花燈漂到池中央，花瓣一片一片打開。<br>願「${esc(rec.wish)}」${WHO.find((w) => w[0] === rec.who)[1] === '自己' ? '' : `，保佑${WHO.find((w) => w[0] === rec.who)[1]}`}。這盞燈會在池上漂七天。`);
    },
  });
  function openLamp() {
    if (fs.lDay === dayKey()) { say('今天的水燈已經放了，看它在池上漂。明天可以再放一盞。'); sfx.knock(); return; }
    let who = 'me';
    const body = openSheet('放一盞蓮花水燈', `
      <p>寫下一個小小的願望，放進池裡。香油錢 <b>${LAMP_COST}</b> 福氣幣（你有 ${wallet.balance()}）。</p>
      <input id="pLWish" class="yue-wish" maxlength="12" placeholder="例如：考試順利、家人健康">
      <div class="chips" id="pWho">${WHO.map(([id, n], i) => `<button type="button" class="chip" data-o="${id}" aria-pressed="${i === 0}">為${n}</button>`).join('')}</div>
      <div class="row"><button class="btn" id="pLGo">點燈</button></div>`);
    body.querySelector('#pWho').addEventListener('click', (e) => {
      const b = e.target.closest('[data-o]'); if (!b) return;
      who = b.dataset.o; body.querySelectorAll('[data-o]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    body.querySelector('#pLGo').addEventListener('click', () => {
      const wish = body.querySelector('#pLWish').value.trim().replace(/\s+/g, ' ') || '一切平安';
      if (!wallet.spend(LAMP_COST, '放生池水燈')) { say(`福氣幣不夠（要 ${LAMP_COST}）。每天來餵魚、上香都能攢福氣。`); return; }
      lDraft = { wish, who }; closeSheet();
      S('pLamp').style.display = ''; lamp.home();
      cam?.zoom(TRAY[0], TRAY[1] - 90, 260);
      say('蓮花燈點亮了。按住它，拖到<b>池面發亮的圈圈</b>放下。');
    });
  }

  /* ----- 4. 池子日記 ----- */
  function openLog() {
    const st = stageNo(), next = STAGES[st + 1];
    const pct = next ? Math.round(((fs.total - STAGES[st].at) / (next.at - STAGES[st].at)) * 100) : 100;
    const ts = fs.turtles.slice(-12).reverse().map((t) => `<li><b>${esc(t.name)}</b>守著「${WISHES.find((w) => w[0] === t.wish)?.[1] || '平安'}」・${new Date(t.t).getMonth() + 1}/${new Date(t.t).getDate()}</li>`).join('');
    const ls = fs.lamps.slice(-5).reverse().map((l) => `<li>為${WHO.find((w) => w[0] === l.who)?.[1] || '自己'}：${esc(l.wish)}</li>`).join('');
    openSheet('池子日記', `
      <p>現在是「<b>${STAGES[st].name}</b>」。${STAGES[st].tip}</p>
      <div class="fs-meter" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      <p class="hint">${next ? `來餵魚 ${fs.total} 天，再 ${next.at - fs.total} 天變成「${next.name}」。` : '池子已經是最熱鬧的樣子了！'}${fs.streak > 1 ? ` 連續 ${fs.streak} 天。` : ''}</p>
      <p>池裡有 <b>${fish.length}</b> 條錦鯉${fish.some((f) => f.gold) ? '（含一條金鯉）' : ''}、<b>${fs.turtles.length}</b> 隻小烏龜。</p>
      ${ts ? `<ul class="ts-list">${ts}</ul>` : '<p class="hint">還沒放過小烏龜。按「放烏龜」放第一隻。</p>'}
      ${ls ? `<p><b>最近的水燈</b></p><ul class="ts-list">${ls}</ul>` : ''}
      <p class="hint">現實中隨意放生會傷害生態，這座池子只收你的心意。</p>`);
  }

  $('#fsBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-fs]'); if (!b) return;
    const a = b.dataset.fs;
    if (a === 'feed') feed(); else if (a === 'turtle') openTurtle(); else if (a === 'lamp') openLamp(); else if (a === 'log') openLog();
  });

  return {
    enter() {
      run++; busy = false; tDraft = null; lDraft = null; spos = [...SCOOP_REST]; placeScoop();
      S('pTurtle').style.display = 'none'; S('pLamp').style.display = 'none';
      paint(); start();
      const st = stageNo(), left = FEEDS - fedToday();
      say(fs.last === dayKey()
        ? `又來看池子了。${left ? `還有 ${left} 勺魚飼料可以餵。` : '今天的飼料餵完了，坐著看魚游也很療癒。'}${fs.tDay !== dayKey() ? '今天的小烏龜還在水桶裡等你。' : ''}`
        : `來到許願放生池，現在是「<b>${STAGES[st].name}</b>」。<br>按住右下角的<b>魚飼料</b>拖到池面撒下去；每天還可以放一隻<b>小烏龜</b>、一盞<b>蓮花水燈</b>。天天來，池子會越來越熱鬧。`);
    },
    leave() { run++; stop(); busy = false; drag = null; },
  };
}

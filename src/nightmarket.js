// 廟口夜市：山門外的三個攤位——套圈圈、撈金魚、射氣球。
// 每個攤位每天免費玩 3 輪，之後每輪 10 福氣幣。贏了拿「彩券」，到點心攤換廟口點心（放進供品籃，可以拜神明），
// 也可以 10 張換 30 福氣幣。
// 手勢都照全廟的規則：拿著的東西（圈圈、紙網、準星）浮在手指上方，手指不會擋住要瞄的東西；玩的時候鏡頭拉近攤位。
// 場景 360 × 645；SVG 裡的 id 都加 n 前綴。美術還沒生好之前先用程式畫的圖，assets/ys/*.webp 放進來就會自動換上。
import { wallet } from './wallet.js';
import { registerItems, pantry } from './shop.js';
import { reduce, sleep, tween, shake, pick, svgPt } from './stall.js';

const ART = import.meta.glob('./assets/ys/*.webp', { eager: true, import: 'default' });
const art = (k) => ART[`./assets/ys/${k}.webp`];

const FREE = 3; // 每攤每天免費輪數
const COST = 10; // 之後每輪幾福氣幣
const GAMES = { ring: '套圈圈', fish: '撈金魚', pop: '射氣球' };

/* ---------- 廟口點心（用彩券換，放進供品籃） ---------- */
const emojiImg = (e, bg) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="54" r="40" fill="${bg}"/><text x="50" y="72" font-size="58" text-anchor="middle">${e}</text></svg>`)}`;
export const SNACKS = [
  { id: 'ys-soda', name: '彈珠汽水', tix: 3, emoji: '🥤', bg: '#BFE6FF', mean: '透心涼', fav: ['san'], tags: ['veg'] },
  { id: 'ys-tanghulu', name: '糖葫蘆', tix: 4, emoji: '🍡', bg: '#FFD0D0', mean: '紅紅火火', fav: ['san'], tags: ['veg'] },
  { id: 'ys-cotton', name: '棉花糖', tix: 4, emoji: '🍭', bg: '#FFE0F2', mean: '甜甜軟軟', fav: ['san', 'yue'], tags: ['veg'] },
  { id: 'ys-eggcake', name: '雞蛋糕', tix: 5, emoji: '🧇', bg: '#FFE6B0', mean: '圓圓滿滿', fav: ['tudi'], tags: [] },
  { id: 'ys-qq', name: '地瓜球', tix: 5, emoji: '🍠', bg: '#FFD8A8', mean: 'Q 彈好運', fav: ['ml'], tags: ['veg'] },
  { id: 'ys-sausage', name: '烤香腸', tix: 6, emoji: '🌭', bg: '#FFC8A8', mean: '香氣十足', fav: ['ji'], tags: ['pudu'] },
  { id: 'ys-dachang', name: '大腸包小腸', tix: 8, emoji: '🥪', bg: '#F6D8B0', mean: '大小通吃', fav: ['gg'], tags: ['pudu'] },
  { id: 'ys-boba', name: '珍珠奶茶', tix: 8, emoji: '🧋', bg: '#E8D2B8', mean: '圓圓都中', fav: ['wen'], tags: ['veg'] },
].map((s) => ({ ...s, img: art(s.id.slice(3)) || emojiImg(s.emoji, s.bg) }));
// 供品店也賣（比較貴，夜市換最划算）
registerItems(SNACKS.map((s) => ({ id: s.id, name: s.name, price: s.tix * 8, mean: s.mean, img: s.img, fav: s.fav, tags: [...s.tags, 'yeshi'], w: 26 })));

/* ---------- 套圈圈 ---------- */
// 越後排越難套，獎品越大
const RING_ROWS = [
  { y: 252, s: .62, val: 5, xs: [100, 152, 208, 260], items: [['🐯', '虎爺布偶', 'tiger'], ['🐱', '招財貓', 'cat'], ['🧸', '大熊', 'bear'], ['💰', '金元寶撲滿', 'piggy']] },
  { y: 322, s: .78, val: 3, xs: [76, 142, 218, 284], items: [['🦆', '小黃鴨', 'duck'], ['🎐', '風鈴', 'chime'], ['🪀', '溜溜球', 'yoyo'], ['🏮', '小燈籠', 'lantern']] },
  { y: 402, s: .95, val: 1, xs: [112, 180, 248], items: [['🍬', '糖果', 'candy'], ['🎈', '氣球', 'toyballoon'], ['✏️', '鉛筆', 'pencil']] },
];
const RINGS = 5, RING_REST = [180, 584], LIFT = 84;
const ringScale = (y) => Math.max(.5, Math.min(1.05, .55 + (y - 230) / 170 * .42));

/* ---------- 撈金魚 ---------- */
const TUB = { cx: 180, cy: 372, rx: 150, ry: 112 };
const FISH = { red: { val: 1, cost: 13, color: '#F2552E', fin: '#FFB08A', v: .045, n: 6, name: '紅金魚' }, black: { val: 2, cost: 19, color: '#2E2A36', fin: '#6A6080', v: .04, n: 2, name: '黑凸眼' }, gold: { val: 4, cost: 25, color: '#FFC83A', fin: '#FFF0A0', v: .07, n: 1, name: '黃金魚' } };
const BOWL = [304, 548], POI_LIFT = 78, POI_R = 26, FISH_TIME = 40;

/* ---------- 射氣球 ---------- */
const BAL_X = [84, 132, 180, 228, 276], BAL_Y = [232, 288, 344, 400], DARTS = 8, AIM_LIFT = 110;
const BAL_COLORS = ['#F2552E', '#3E8FE8', '#FFB02E', '#5CC46A', '#E86AB8', '#9A6AE8'];

const BOSS = [
  '老闆：「少年欸，手勢不錯喔！」', '老闆：「明天再來，老闆算你便宜。」', '老闆：「拿彩券去換點心，順便拜拜。」',
  '老闆：「好運氣都是練出來的啦。」', '老闆：「廟口逛一圈，心情就好了。」',
];

const svgOf = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="廟口夜市" class="stall-svg ys-svg">
  <defs>
    <linearGradient id="nSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B1840"/><stop offset=".55" stop-color="#3A2456"/><stop offset="1" stop-color="#5A2A3A"/></linearGradient>
    <linearGradient id="nGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A3A30"/><stop offset="1" stop-color="#3A1E18"/></linearGradient>
    <radialGradient id="nGlow"><stop offset="0" stop-color="#FFD27A" stop-opacity=".7"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient>
    <radialGradient id="nShadow"><stop offset="0" stop-color="#120604" stop-opacity=".5"/><stop offset="1" stop-color="#120604" stop-opacity="0"/></radialGradient>
    <radialGradient id="nWater" cx=".5" cy=".4"><stop offset="0" stop-color="#7FD4F0"/><stop offset=".7" stop-color="#3E9ED0"/><stop offset="1" stop-color="#2A70A8"/></radialGradient>
    <clipPath id="nTubClip"><ellipse cx="${TUB.cx}" cy="${TUB.cy}" rx="${TUB.rx - 6}" ry="${TUB.ry - 6}"/></clipPath>
  </defs>
  ${art('bg') ? `<image href="${art('bg')}" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>` : `
  <rect width="360" height="645" fill="url(#nSky)"/>
  <g opacity=".8">${Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 67) % 350 + 6}" cy="${(i * 41) % 110 + 10}" r="${i % 3 ? 1 : 1.6}" fill="#FFF6D0"/>`).join('')}</g>
  <rect y="470" width="360" height="175" fill="url(#nGround)"/>
  <!-- 兩旁的攤子 -->
  <path d="M-10 140h80l-10 40H0z" fill="#E8402A"/><path d="M-10 140h80" stroke="#FFF4E0" stroke-width="3" stroke-dasharray="10 10"/>
  <rect x="0" y="180" width="62" height="300" fill="#4A2A2A"/>
  <path d="M290 140h80v40h-70z" fill="#2E8A5A"/><path d="M290 140h80" stroke="#FFF4E0" stroke-width="3" stroke-dasharray="10 10"/>
  <rect x="298" y="180" width="62" height="300" fill="#2A3A3A"/>
  <!-- 中間的攤位 -->
  <rect x="40" y="186" width="280" height="300" rx="6" fill="#5A2E22"/>
  <path d="M30 150h300l-10 40H40z" fill="#C8302A"/>
  <path d="M30 150h300" stroke="#FFE08A" stroke-width="4"/>
  ${Array.from({ length: 10 }, (_, i) => `<path d="M${40 + i * 28} 190q14 14 28 0" fill="#FFF4E0"/>`).join('')}
  <rect x="34" y="476" width="292" height="22" rx="4" fill="#8A4A2A"/><rect x="34" y="476" width="292" height="5" fill="#B0703E"/>`}
  <!-- 燈串 -->
  <path d="M0 108q90 30 180 0t180 0" fill="none" stroke="#2A1A10" stroke-width="1.4"/>
  ${Array.from({ length: 13 }, (_, i) => { const x = i * 30, y = 108 + Math.sin((x % 180) / 180 * Math.PI) * 15; return `<circle class="bz-bulb" cx="${x}" cy="${y.toFixed(1)}" r="4" fill="${['#FFD27A', '#FF8A6A', '#9AE0FF'][i % 3]}"/>`; }).join('')}
  <g id="nSign"><rect x="110" y="122" width="140" height="30" rx="8" fill="#FFE08A" stroke="#C8302A" stroke-width="3"/><text id="nSignT" x="180" y="143" text-anchor="middle" class="ys-sign">廟口夜市</text></g>

  <!-- 大廳：三個攤位 -->
  <g id="nLobby">
    ${[['ring', 66, '套圈圈', '#E8402A', '⭕'], ['fish', 180, '撈金魚', '#2E8ACC', '🐟'], ['pop', 294, '射氣球', '#9A4AD8', '🎈']].map(([k, x, n, c, e]) => `
    <g class="ys-booth" data-ys="${k}" role="button" tabindex="0" aria-label="${n}" transform="translate(${x} 330)">
      <ellipse cx="0" cy="96" rx="46" ry="7" fill="url(#nShadow)"/>
      <circle cx="0" cy="-40" r="56" fill="url(#nGlow)"/>
      <path d="M-50 -70h100l-8 26h-84z" fill="${c}"/><path d="M-50 -70h100" stroke="#FFF4E0" stroke-width="3" stroke-dasharray="8 8"/>
      <rect x="-42" y="-44" width="84" height="130" rx="6" fill="#FFF4E0" opacity=".95"/>
      <text x="0" y="16" text-anchor="middle" font-size="44">${e}</text>
      <text x="0" y="60" text-anchor="middle" class="ys-booth-n">${n}</text>
      <text id="nFree-${k}" x="0" y="78" text-anchor="middle" class="ys-booth-f"></text>
    </g>`).join('')}
    <g class="ys-booth" data-ys="snack" role="button" tabindex="0" aria-label="點心攤換點心" transform="translate(180 540)">
      <rect x="-90" y="-26" width="180" height="52" rx="14" fill="#FFE08A" stroke="#C8302A" stroke-width="3"/>
      <text x="-56" y="12" text-anchor="middle" font-size="28">🍡</text>
      <text x="14" y="-2" text-anchor="middle" class="ys-booth-n">彩券換點心</text>
      <text id="nTixL" x="14" y="16" text-anchor="middle" class="ys-booth-f dark"></text>
    </g>
  </g>

  <!-- 套圈圈 -->
  <g id="nRing" style="display:none">
    <path d="M70 226h220l46 230H24z" fill="#7A4A2E"/>
    <path d="M70 226h220l46 230H24z" fill="none" stroke="#B0703E" stroke-width="3"/>
    ${[290, 362, 440].map((y) => `<path d="M${50 - (y - 226) * .2} ${y - 6}h${260 + (y - 226) * .4}" stroke="#5A321E" stroke-width="2" opacity=".6"/>`).join('')}
    <g id="nPrizes"></g>
    <g id="nLanded"></g>
    <text id="nRingLeft" x="180" y="520" text-anchor="middle" class="ys-hud"></text>
    <g id="nRingHand" transform="translate(${RING_REST[0]} ${RING_REST[1]})"></g>
  </g>

  <!-- 撈金魚 -->
  <g id="nFish" style="display:none">
    <ellipse cx="${TUB.cx}" cy="${TUB.cy + 14}" rx="${TUB.rx + 6}" ry="${TUB.ry + 6}" fill="#1A3A5A" opacity=".5"/>
    <ellipse cx="${TUB.cx}" cy="${TUB.cy}" rx="${TUB.rx}" ry="${TUB.ry}" fill="#3A8ACC" stroke="#9AD8F0" stroke-width="7"/>
    <ellipse cx="${TUB.cx}" cy="${TUB.cy}" rx="${TUB.rx - 6}" ry="${TUB.ry - 6}" fill="url(#nWater)"/>
    <g clip-path="url(#nTubClip)"><g id="nSwim"></g><g id="nRipples"></g></g>
    <g id="nBowl" transform="translate(${BOWL[0]} ${BOWL[1]})">
      <ellipse cx="0" cy="22" rx="34" ry="6" fill="url(#nShadow)"/>
      <path d="M-30 -6q0 32 30 32t30-32z" fill="#BFE6FF" opacity=".85" stroke="#FFFFFF" stroke-width="2"/>
      <ellipse cx="0" cy="-6" rx="30" ry="7" fill="#7FD4F0" stroke="#FFFFFF" stroke-width="2"/>
      <text id="nBowlN" x="0" y="16" text-anchor="middle" class="ys-hud dark">0</text>
    </g>
    <g id="nDur" transform="translate(40 504)">
      <text x="0" y="0" class="ys-hud small">紙網</text>
      <rect x="34" y="-10" width="120" height="11" rx="5.5" fill="#1A0A08" opacity=".5"/>
      <rect id="nDurBar" x="34" y="-10" width="120" height="11" rx="5.5" fill="#FFE08A"/>
      <text id="nTime" x="164" y="0" class="ys-hud small"></text>
    </g>
    <g id="nPoi" style="display:none" pointer-events="none"></g>
  </g>

  <!-- 射氣球 -->
  <g id="nPop" style="display:none">
    <rect x="44" y="196" width="272" height="236" rx="10" fill="#C89A62" stroke="#7A4A2E" stroke-width="6"/>
    <g opacity=".25">${Array.from({ length: 40 }, (_, i) => `<circle cx="${54 + (i * 53) % 252}" cy="${206 + (i * 31) % 216}" r="1.6" fill="#5A321E"/>`).join('')}</g>
    <g id="nStuck"></g>
    <g id="nBalloons"></g>
    <text id="nDartLeft" x="180" y="470" text-anchor="middle" class="ys-hud"></text>
    <g id="nDart" style="display:none" pointer-events="none"></g>
    <g id="nAim" style="display:none" pointer-events="none">
      <circle r="16" fill="none" stroke="#FFFFFF" stroke-width="2.4"/><circle r="16" fill="none" stroke="#C8302A" stroke-width="1" stroke-dasharray="3 3"/>
      <path d="M-24 0h14M10 0h14M0 -24v14M0 10v14" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
      <circle r="2.4" fill="#C8302A"/>
    </g>
  </g>

  <text id="nTix" x="338" y="176" text-anchor="end" class="ys-hud small"></text>
  <rect id="nPad" x="0" y="0" width="360" height="645" fill="transparent" style="display:none"/>
</svg>`;

// 程式畫的道具（之後換成 Gemini 圖）
const ringArt = (c = '#E8402A') => art('ring')
  ? `<image href="${art('ring')}" x="-28" y="-14" width="56" height="28"/>`
  : `<ellipse rx="24" ry="9" fill="none" stroke="#7A1A10" stroke-width="7" opacity=".35" transform="translate(0 2)"/><ellipse rx="24" ry="9" fill="none" stroke="${c}" stroke-width="6"/><ellipse rx="24" ry="9" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".5" stroke-dasharray="6 10"/>`;
const poiArt = (wet) => art('poi')
  ? `<image href="${art('poi')}" x="-30" y="-30" width="60" height="100" opacity="${wet ? .85 : 1}"/>`
  : `<path d="M0 ${POI_R} v50" stroke="#E8402A" stroke-width="7" stroke-linecap="round"/>
     <circle r="${POI_R}" fill="#FFFFFF" fill-opacity="${wet ? .35 : .75}" stroke="#E8402A" stroke-width="5"/>
     ${wet ? '' : '<path d="M-14 -10q8-8 18-4" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".8"/>'}`;
const dartArt = () => art('dart')
  ? `<image href="${art('dart')}" x="-10" y="-6" width="20" height="44"/>`
  : '<path d="M0 0l-3 10h6z" fill="#CCCCCC"/><rect x="-2" y="10" width="4" height="18" fill="#E8402A"/><path d="M0 26l-7 10h14z" fill="#FFE08A"/>';
const fishArt = (k) => `<path d="M-18 0q8-11 22-8q10 2 14 8q-4 6-14 8q-14 3-22-8z" fill="${FISH[k].color}"/><path d="M-16 0l-12-9q3 9 0 18z" fill="${FISH[k].fin}"/><circle cx="10" cy="-2" r="2.2" fill="${k === 'black' ? '#FFFFFF' : '#2A1A10'}"/>${k === 'gold' ? '<path d="M-2 -6l2-3 2 3" stroke="#FFFFFF" stroke-width="1.4" fill="none"/>' : ''}`;
const balloonArt = (c, gold) => `<path d="M0 22q-4 14 2 26" stroke="#FFF4E0" stroke-width="1" fill="none"/><ellipse rx="19" ry="23" fill="${gold ? '#FFC83A' : c}" stroke="${gold ? '#FFF0A0' : 'none'}" stroke-width="2"/><path d="M-3 22l3 5 3-5z" fill="${gold ? '#FFC83A' : c}"/><ellipse cx="-7" cy="-9" rx="5" ry="8" fill="#FFFFFF" opacity=".45"/>${gold ? '<text y="6" text-anchor="middle" font-size="14" fill="#7A4A10" font-weight="900">福</text>' : ''}`;

export function initNightMarket(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam } = api;
  const host = $('#ysHost');
  host.innerHTML = svgOf();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const ys = state.ys || (state.ys = { day: '', plays: {}, tix: 0, snacks: {}, best: {}, rounds: 0 });
  let game = null, run = 0, busy = false;

  const today = () => { if (ys.day !== dayKey()) { ys.day = dayKey(); ys.plays = {}; save(); } };
  const freeLeft = (g) => { today(); return Math.max(0, FREE - (ys.plays[g] || 0)); };
  function paintHud() {
    for (const g of Object.keys(GAMES)) { const f = freeLeft(g); S('nFree-' + g).textContent = f ? `今天免費 ${f} 輪` : `一輪 ${COST} 福氣幣`; }
    S('nTixL').textContent = `彩券 ${ys.tix} 張`;
    S('nTix').textContent = game ? `彩券 ${ys.tix} 張` : '';
  }
  const addTix = (n, x, y) => { if (n <= 0) return; ys.tix += n; save(); if (x != null) emit('text', x, y, { text: `彩券 +${n}`, color: '#FFE08A', size: 15 }); paintHud(); };

  function show(which) {
    S('nLobby').style.display = which ? 'none' : '';
    for (const [g, id] of [['ring', 'nRing'], ['fish', 'nFish'], ['pop', 'nPop']]) S(id).style.display = which === g ? '' : 'none';
    S('nPad').style.display = which ? '' : 'none';
    S('nSignT').textContent = which ? GAMES[which] : '廟口夜市';
    game = which; paintHud();
  }

  // 付費／免費一輪
  function pay(g) {
    if (freeLeft(g)) { ys.plays[g] = (ys.plays[g] || 0) + 1; save(); return 'free'; }
    if (wallet.spend(COST, `夜市${GAMES[g]}`)) { ys.plays[g] = (ys.plays[g] || 0) + 1; save(); return 'paid'; }
    say(`今天${GAMES[g]}的免費三輪玩完了，再玩一輪要 ${COST} 福氣幣，你身上只有 ${wallet.balance()} 枚。上香、摸財神元寶都能賺福氣幣，明天也會再送三輪。`);
    return '';
  }
  function start(g) {
    if (busy) { say('這一輪還沒玩完喔。'); return; }
    const how = pay(g); if (!how) return;
    run++; show(g); sfx.bowl();
    const tag = how === 'free' ? `（今天還有 ${freeLeft(g)} 輪免費）` : `（付了 ${COST} 福氣幣，還剩 ${wallet.balance()} 枚）`;
    ({ ring: startRing, fish: startFish, pop: startPop })[g](tag);
  }
  function backToLobby() { run++; busy = false; cam?.reset(); show(null); S('nPoi').style.display = 'none'; S('nAim').style.display = 'none'; }

  async function finish(g, gain, lines) {
    busy = false;
    ys.rounds = (ys.rounds || 0) + 1;
    const best = ys.best[g] || 0; if (gain > best) ys.best[g] = gain;
    save();
    await sleep(500);
    cam?.reset();
    if (gain) { sfx.chime(); burst('spark', 180, 300, reduce ? 4 : 20); }
    addTix(gain);
    const body = openSheet(`${GAMES[g]}・這一輪`, `
      <p>${lines}</p>
      <p class="ys-big">拿到彩券 <b>${gain}</b> 張${gain > best && best ? '，<b>新紀錄！</b>' : ''}</p>
      <p class="hint">身上有彩券 ${ys.tix} 張。${pick(BOSS)}</p>
      <div class="row"><button class="btn" id="nAgain">再玩一輪${freeLeft(g) ? `（免費，剩 ${freeLeft(g)}）` : `（${COST} 福氣幣）`}</button><button class="btn ghost" id="nSnack">去換點心</button><button class="btn ghost" id="nBack">逛其他攤</button></div>`);
    body.querySelector('#nAgain').addEventListener('click', () => { closeSheet(); start(g); });
    body.querySelector('#nSnack').addEventListener('click', () => { closeSheet(); backToLobby(); openSnacks(); });
    body.querySelector('#nBack').addEventListener('click', () => { closeSheet(); backToLobby(); say('逛到別攤看看。'); });
  }

  /* ===================== 套圈圈 ===================== */
  let pegs = [], ringsLeft = 0, ringWon = [];
  function startRing(tag) {
    busy = true; ringsLeft = RINGS; ringWon = [];
    pegs = RING_ROWS.flatMap((r) => r.xs.map((x, i) => ({ x, y: r.y, s: r.s, val: r.val, e: r.items[i][0], name: r.items[i][1], img: art('prize-' + r.items[i][2]), won: false })));
    S('nPrizes').innerHTML = pegs.map((p, i) => `<g id="nPeg${i}" transform="translate(${p.x} ${p.y}) scale(${p.s})">
      <ellipse cx="0" cy="2" rx="20" ry="6" fill="#3A1E12" opacity=".5"/><rect x="-14" y="-6" width="28" height="8" rx="3" fill="#E8C890"/>
      ${p.img ? `<image href="${p.img}" x="-24" y="-50" width="48" height="48"/>` : `<text y="-10" text-anchor="middle" font-size="34">${p.e}</text>`}
      <text y="18" text-anchor="middle" class="ys-val">${p.val} 張</text></g>`).join('');
    S('nLanded').innerHTML = '';
    paintRing(); handRing();
    cam?.zoom(180, 400, 330, 500);
    say(`套圈圈！${tag}<br>手指放在下面，<b>往上一甩</b>就把圈圈丟出去：甩越快飛越遠。後排的獎品比較難，彩券也比較多。一共 ${RINGS} 個圈。`);
  }
  const paintRing = () => { S('nRingLeft').textContent = ringsLeft ? `還有 ${ringsLeft} 個圈` : ''; };
  const handRing = (x = RING_REST[0], y = RING_REST[1]) => {
    const h = S('nRingHand');
    h.style.display = ringsLeft ? '' : 'none';
    h.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    h.innerHTML = ringArt(['#E8402A', '#FFB02E', '#3E8FE8', '#5CC46A', '#E86AB8'][(RINGS - ringsLeft) % 5]);
  };
  let rDrag = null;
  function ringDown(p) {
    if (busy !== true || !ringsLeft || rDrag) return;
    rDrag = { samples: [{ x: p.x, y: p.y, t: performance.now() }], y0: p.y };
    handRing(p.x, p.y - LIFT); sfx.pop();
  }
  function ringMove(p) {
    if (!rDrag) return;
    const now = performance.now();
    rDrag.samples.push({ x: p.x, y: p.y, t: now });
    while (rDrag.samples.length > 2 && now - rDrag.samples[0].t > 140) rDrag.samples.shift();
    handRing(p.x, p.y - LIFT);
    const a = rDrag.samples[0];
    if (a.y - p.y > 42 && now - a.t < 240) throwRing(p); // 往上甩到一定速度就直接丟出去，不用等放開
  }
  function ringUp(p) {
    if (!rDrag) return;
    const a = rDrag.samples[0], dt = Math.max(16, performance.now() - a.t);
    if ((a.y - p.y) / dt > .25) { throwRing(p); return; }
    rDrag = null; handRing();
    say('手指按住往<b>上甩</b>，圈圈才會飛出去。');
  }
  async function throwRing(p) {
    const a = rDrag.samples[0], dt = Math.max(16, performance.now() - a.t);
    rDrag = null;
    const vy = (p.y - a.y) / dt, vx = (p.x - a.x) / dt;
    const power = Math.max(.3, Math.min(2, -vy));
    const sx = p.x, sy = p.y - LIFT;
    let lx = sx + (vx / Math.max(.2, -vy)) * (sy - 200) * .55, ly = Math.max(186, 486 - (power - .3) * 210);
    lx = Math.max(30, Math.min(330, lx));
    // 一點點瞄準輔助：落點很靠近獎品就吸過去一些
    const near = pegs.filter((q) => !q.won).map((q) => ({ q, d: Math.hypot(q.x - lx, (q.y - ly) * 1.8) })).sort((m, n) => m.d - n.d)[0];
    if (near && near.d < 30 * near.q.s) { lx += (near.q.x - lx) * .45; ly += (near.q.y - ly) * .45; }
    ringsLeft--; paintRing();
    const r = run, hand = S('nRingHand'), fly = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    fly.innerHTML = hand.innerHTML; hand.style.display = 'none'; S('nLanded').appendChild(fly);
    busy = 'fly'; sfx.knock();
    cam?.zoom(lx, ly + 40, 240, 420);
    await tween(560, (k, raw) => {
      const x = sx + (lx - sx) * raw, y = sy + (ly - sy) * raw - Math.sin(raw * Math.PI) * 90, s = 1 + (ringScale(ly) - 1) * raw;
      fly.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)} ${(s * (1 + .5 * Math.sin(raw * Math.PI * 4))).toFixed(3)})`);
    }, (k) => k);
    if (r !== run) return;
    const hit = pegs.find((q) => !q.won && Math.abs(q.x - lx) < 14 * q.s && Math.abs(q.y - ly) < 10 * q.s);
    if (hit) {
      hit.won = true; ringWon.push(hit);
      fly.setAttribute('transform', `translate(${hit.x} ${hit.y - 2}) scale(${hit.s})`);
      sfx.chime(); sfx.buzz([20, 30, 20]);
      burst('spark', hit.x, hit.y - 20, reduce ? 3 : 14);
      emit('text', hit.x, hit.y - 46, { text: `套中${hit.name}！`, color: '#FFE08A', size: 15 });
      S('nPeg' + pegs.indexOf(hit))?.classList.add('ys-won');
    } else {
      const s = ringScale(ly);
      await tween(260, (k) => fly.setAttribute('transform', `translate(${lx.toFixed(1)} ${(ly - Math.sin(k * Math.PI) * 14).toFixed(1)}) scale(${s})`));
      sfx.knock(.02);
      emit('text', lx, ly - 30, { text: pick(['差一點！', '沒套到', '可惜～']), color: '#FFF4E0', size: 13 });
      setTimeout(() => tween(400, (k) => fly.setAttribute('opacity', (1 - k).toFixed(2))).then(() => fly.remove()), 600);
    }
    await sleep(500); if (r !== run) return;
    cam?.zoom(180, 400, 330, 400);
    busy = true;
    if (ringsLeft) { handRing(); return; }
    const gain = ringWon.reduce((n, q) => n + q.val, 0);
    finish('ring', gain, ringWon.length ? `套中了：${ringWon.map((q) => `${q.e}${q.name}`).join('、')}。獎品換成彩券給你。` : '五個圈都沒套中，老闆送你一顆糖安慰一下。');
  }

  /* ===================== 撈金魚 ===================== */
  let fishes = [], dur = 100, caught = [], poi = null, fishT0 = 0;
  function startFish(tag) {
    busy = true; dur = 100; caught = []; poi = null;
    fishes = [];
    for (const [k, F] of Object.entries(FISH)) for (let i = 0; i < F.n; i++) spawnFish(k);
    S('nBowlN').textContent = '0'; paintDur();
    cam?.zoom(180, 400, 320, 500);
    say(`撈金魚！${tag}<br>按住水面，紙網會浮在手指上方；<b>慢慢移到魚的下面，放開</b>就撈起來。動作太快、泡水太久紙會破。黃金魚最值錢！`);
    fishT0 = performance.now();
    const r = run; let last = fishT0;
    const loop = (now) => {
      if (r !== run || game !== 'fish') return;
      const dt = Math.min(50, now - last); last = now;
      swim(dt);
      if (poi && poi.wet && busy === true) {
        dur -= dt / 1000 * (5 + 55 * Math.min(1.2, poi.spd));
        if (Math.random() < dt / 160) ripple(poi.x, poi.y);
        if (dur <= 0) { tear(); }
        paintDur();
      }
      const left = Math.max(0, FISH_TIME - (now - fishT0) / 1000);
      S('nTime').textContent = `${Math.ceil(left)} 秒`;
      if (left <= 0 && busy === true) { endFish('時間到！'); return; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  function spawnFish(k) {
    let x, y;
    do { x = TUB.cx + (Math.random() - .5) * TUB.rx * 1.6; y = TUB.cy + (Math.random() - .5) * TUB.ry * 1.6; } while (((x - TUB.cx) / (TUB.rx - 24)) ** 2 + ((y - TUB.cy) / (TUB.ry - 20)) ** 2 > 1);
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.innerHTML = art('fish-' + k) ? `<image href="${art('fish-' + k)}" x="-24" y="-14" width="48" height="28"/>` : fishArt(k);
    S('nSwim').appendChild(el);
    fishes.push({ k, x, y, a: Math.random() * Math.PI * 2, v: FISH[k].v * (.7 + Math.random() * .6), el, wig: Math.random() * 6 });
  }
  function swim(dt) {
    for (const f of fishes) {
      f.a += (Math.random() - .5) * .006 * dt;
      // 碰到盆邊就轉回中間
      const ex = (f.x - TUB.cx) / (TUB.rx - 22), ey = (f.y - TUB.cy) / (TUB.ry - 20);
      if (ex * ex + ey * ey > .8) { const to = Math.atan2(TUB.cy - f.y, TUB.cx - f.x); f.a += Math.sin(to - f.a) * .004 * dt; }
      let v = f.v;
      // 紙網在水裡亂動，魚會嚇跑
      if (poi && poi.wet) {
        const d = Math.hypot(f.x - poi.x, f.y - poi.y);
        if (d < 60 && poi.spd > .18) { const away = Math.atan2(f.y - poi.y, f.x - poi.x); f.a += Math.sin(away - f.a) * .01 * dt; v *= 2.2; }
      }
      f.x += Math.cos(f.a) * v * dt; f.y += Math.sin(f.a) * v * dt * .8;
      f.wig += dt * .012;
      const flip = Math.cos(f.a) < 0 ? -1 : 1;
      f.el.setAttribute('transform', `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${(Math.sin(f.a) * 25 * flip).toFixed(1)}) scale(${flip} ${(1 + Math.sin(f.wig) * .04).toFixed(3)})`);
    }
  }
  function ripple(x, y) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('fill', 'none'); c.setAttribute('stroke', '#FFFFFF'); c.setAttribute('stroke-width', '1.4');
    S('nRipples').appendChild(c);
    tween(700, (k) => { c.setAttribute('rx', (POI_R + k * 20).toFixed(1)); c.setAttribute('ry', ((POI_R + k * 20) * .45).toFixed(1)); c.setAttribute('opacity', (.7 * (1 - k)).toFixed(2)); }).then(() => c.remove());
  }
  function paintDur() {
    const k = Math.max(0, dur) / 100;
    S('nDurBar').setAttribute('width', (120 * k).toFixed(1));
    S('nDurBar').setAttribute('fill', k > .5 ? '#FFE08A' : k > .25 ? '#FFA03A' : '#FF5A3A');
  }
  const drawPoi = () => { const g = S('nPoi'); g.style.display = poi ? '' : 'none'; if (!poi) return; g.setAttribute('transform', `translate(${poi.x.toFixed(1)} ${poi.y.toFixed(1)})`); g.innerHTML = poiArt(poi.wet); };
  const inTub = (x, y) => ((x - TUB.cx) / (TUB.rx - 8)) ** 2 + ((y - TUB.cy) / (TUB.ry - 8)) ** 2 < 1;
  function fishDown(p) {
    if (busy !== true) return;
    const x = p.x, y = p.y - POI_LIFT;
    poi = { x, y, t: performance.now(), spd: 0, wet: inTub(x, y) };
    if (poi.wet) { ripple(x, y); sfx.pop(); }
    drawPoi();
  }
  function fishMove(p) {
    if (!poi || busy !== true) return;
    const now = performance.now(), x = p.x, y = p.y - POI_LIFT, dt = Math.max(8, now - poi.t);
    const spd = Math.hypot(x - poi.x, y - poi.y) / dt;
    poi.spd = poi.spd * .7 + spd * .3; poi.x = x; poi.y = y; poi.t = now;
    const wet = inTub(x, y); if (wet && !poi.wet) { ripple(x, y); sfx.pop(); } poi.wet = wet;
    drawPoi();
  }
  async function fishUp() {
    if (!poi || busy !== true) return;
    const p = poi; poi = null; drawPoi();
    if (!p.wet) return;
    const f = fishes.map((q) => ({ q, d: Math.hypot(q.x - p.x, q.y - p.y) })).filter((m) => m.d < POI_R - 2).sort((m, n) => m.d - n.d)[0]?.q;
    if (!f) { dur -= 3; paintDur(); ripple(p.x, p.y); if (dur <= 0) tear(p); return; }
    const F = FISH[f.k];
    if (dur <= F.cost) { tear(p, f); return; }
    dur -= F.cost; paintDur();
    fishes.splice(fishes.indexOf(f), 1); caught.push(f.k);
    sfx.chime(); sfx.buzz([15, 25, 15]);
    for (let i = 0; i < 6; i++) emit('drop', p.x + (Math.random() - .5) * 30, p.y, { color: '#BFE6FF', vy: -80 - Math.random() * 60, vx: (Math.random() - .5) * 60 });
    emit('text', p.x, p.y - 40, { text: `撈到${F.name}！`, color: '#FFE08A', size: 15 });
    // 魚跳進碗裡
    const el = f.el; S('nFish').appendChild(el);
    const x0 = f.x, y0 = f.y;
    await tween(520, (k, raw) => el.setAttribute('transform', `translate(${(x0 + (BOWL[0] - x0) * raw).toFixed(1)} ${(y0 + (BOWL[1] - 4 - y0) * raw - Math.sin(raw * Math.PI) * 70).toFixed(1)}) rotate(${raw * 360}) scale(${1 - raw * .45})`), (k) => k);
    el.remove(); S('nBowlN').textContent = String(caught.length);
    if (!fishes.length) { for (const [k, F2] of Object.entries(FISH)) for (let i = 0; i < F2.n; i++) spawnFish(k); say('老闆又倒了一桶魚進來！'); }
  }
  function tear(p = poi, f) {
    if (busy !== true) return;
    busy = 'torn'; poi = null; drawPoi();
    sfx.knock(); sfx.buzz([40]); shake(svg, 3);
    if (p) { ripple(p.x, p.y); emit('text', p.x, p.y - 30, { text: f ? `${FISH[f.k].name}太重，紙破了！` : '紙網破了！', color: '#FFF4E0', size: 14 }); }
    endFish(f ? `${FISH[f.k].name}太重，紙網破掉了。` : '紙網泡太久破掉了。');
  }
  function endFish(why) {
    busy = 'end';
    const n = (k) => caught.filter((c) => c === k).length;
    const gain = caught.reduce((s, k) => s + FISH[k].val, 0);
    const list = Object.keys(FISH).filter((k) => n(k)).map((k) => `${FISH[k].name} ${n(k)} 隻`).join('、');
    finish('fish', gain, `${why}${caught.length ? `這一輪撈到 ${list}。老闆幫你把魚放回盆子，換成彩券。` : '一隻都沒撈到，下次動作再慢一點。'}`);
  }

  /* ===================== 射氣球 ===================== */
  let balloons = [], darts = 0, popped = [], aim = null;
  function startPop(tag) {
    busy = true; darts = DARTS; popped = []; aim = null;
    const golds = new Set(); while (golds.size < 2) golds.add(Math.floor(Math.random() * 20));
    balloons = [];
    BAL_Y.forEach((y, r) => BAL_X.forEach((x, c) => { const i = r * 5 + c; balloons.push({ i, x0: x, x, y, row: r, gold: golds.has(i), color: BAL_COLORS[(r * 2 + c) % BAL_COLORS.length], alive: true }); }));
    S('nBalloons').innerHTML = balloons.map((b) => `<g id="nB${b.i}" transform="translate(${b.x} ${b.y})">${art(b.gold ? 'balloon-gold' : 'balloon') ? `<image href="${art(b.gold ? 'balloon-gold' : 'balloon')}" x="-21" y="-25" width="42" height="74"/>` : balloonArt(b.color, b.gold)}</g>`).join('');
    S('nStuck').innerHTML = '';
    paintDarts();
    cam?.zoom(180, 360, 300, 500);
    say(`射氣球！${tag}<br>按住畫面，準星會出現在手指上方；對準了<b>放開</b>就射出飛鏢。手按太久會晃喔！金色的「福」氣球三張彩券。${DARTS} 支飛鏢。`);
    const r = run;
    const loop = (now) => {
      if (r !== run || game !== 'pop') return;
      // 第二、四排會左右滑
      for (const b of balloons) if (b.alive && b.row % 2) { b.x = b.x0 + Math.sin(now / (b.row === 1 ? 700 : 520) + b.row) * 18; S('nB' + b.i).setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y})`); }
      if (aim) {
        const held = (now - aim.t0) / 1000, amp = 2.5 + Math.max(0, held - 1.6) * 5;
        aim.sx = Math.sin(now / 180) * Math.min(14, amp); aim.sy = Math.cos(now / 230) * Math.min(14, amp) * .7;
        S('nAim').setAttribute('transform', `translate(${(aim.x + aim.sx).toFixed(1)} ${(aim.y + aim.sy).toFixed(1)})`);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  const paintDarts = () => { S('nDartLeft').textContent = darts ? `還有 ${darts} 支飛鏢` : ''; };
  function popDown(p) { if (busy !== true || !darts) return; aim = { x: p.x, y: p.y - AIM_LIFT, sx: 0, sy: 0, t0: performance.now() }; S('nAim').style.display = ''; sfx.pop(); }
  function popMove(p) { if (!aim) return; aim.x = p.x; aim.y = p.y - AIM_LIFT; }
  async function popUp() {
    if (!aim || busy !== true) return;
    const tx = aim.x + aim.sx, ty = aim.y + aim.sy; aim = null; S('nAim').style.display = 'none';
    darts--; paintDarts(); busy = 'fly';
    const r = run, d = S('nDart'); d.style.display = ''; d.innerHTML = dartArt();
    const fx0 = 180, fy0 = 640;
    sfx.knock();
    await tween(170, (k, raw) => d.setAttribute('transform', `translate(${(fx0 + (tx - fx0) * raw).toFixed(1)} ${(fy0 + (ty - fy0) * raw).toFixed(1)}) scale(${1 - raw * .4})`), (k) => k);
    if (r !== run) return;
    d.style.display = 'none';
    const b = balloons.find((q) => q.alive && ((tx - q.x) / 20) ** 2 + ((ty - q.y) / 24) ** 2 < 1);
    if (b) {
      b.alive = false; popped.push(b);
      const el = S('nB' + b.i);
      sfx.pop(); sfx.buzz([25]); shake(svg, 2);
      burst('spark', b.x, b.y, reduce ? 3 : 12);
      for (let i = 0; i < 6; i++) emit('drop', b.x, b.y, { color: b.gold ? '#FFC83A' : b.color, vy: -60 - Math.random() * 80, vx: (Math.random() - .5) * 120 });
      emit('text', b.x, b.y - 30, { text: b.gold ? '福氣球！+3' : '啪！', color: b.gold ? '#FFE08A' : '#FFF4E0', size: b.gold ? 16 : 14 });
      tween(120, (k) => el.setAttribute('opacity', (1 - k).toFixed(2))).then(() => el.remove());
    } else {
      const onBoard = tx > 46 && tx < 314 && ty > 198 && ty < 430;
      if (onBoard) { const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(.6)`); g.innerHTML = dartArt(); S('nStuck').appendChild(g); }
      sfx.knock(.02);
      emit('text', tx, ty - 24, { text: onBoard ? '射到板子了' : '飛出去了', color: '#FFF4E0', size: 12 });
    }
    await sleep(250); if (r !== run) return;
    busy = true;
    if (darts && balloons.some((q) => q.alive)) return;
    const gain = popped.reduce((n, q) => n + (q.gold ? 3 : 1), 0) + (balloons.every((q) => !q.alive) ? 5 : 0);
    finish('pop', gain, popped.length ? `射破 ${popped.length} 顆氣球${popped.some((q) => q.gold) ? `，其中 ${popped.filter((q) => q.gold).length} 顆是金色福氣球` : ''}。` : '一顆都沒射中，老闆說：「放開之前先等準星停穩。」');
  }

  /* ===================== 點心攤 ===================== */
  function openSnacks() {
    sfx.knock();
    const draw = () => `
      <p>彩券 <b>${ys.tix}</b> 張・福氣幣 <b>${wallet.balance()}</b> 枚</p>
      <p class="hint">換來的點心放進<b>供品籃</b>，進殿點「供品」就能擺上供桌，拜拜完再「吃平安」。</p>
      <div class="ys-snacks">${SNACKS.map((s) => {
        const favs = s.fav.map((h) => api.godName?.(h)).filter(Boolean);
        return `<div class="ys-snack"><img src="${s.img}" alt=""><b>${s.name}</b><small>${s.mean}${favs.length ? `・${favs.join('、')}最愛` : ''}</small>
          <button type="button" class="btn" data-sn="${s.id}" ${ys.tix < s.tix ? 'disabled' : ''}>${s.tix} 張</button>${ys.snacks[s.id] ? `<i>換過 ${ys.snacks[s.id]}</i>` : ''}</div>`;
      }).join('')}</div>
      <div class="row"><button type="button" class="btn ghost" data-sn="fu" ${ys.tix < 10 ? 'disabled' : ''}>10 張換 30 福氣幣</button></div>
      <p class="hint">點心圖鑑 ${SNACKS.filter((s) => ys.snacks[s.id]).length} / ${SNACKS.length}</p>`;
    const body = openSheet('廟口點心攤', `<div class="ys-shop">${draw()}</div>`);
    const root = body.querySelector('.ys-shop');
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-sn]'); if (!b || b.disabled) return;
      if (b.dataset.sn === 'fu') {
        if (ys.tix < 10) return;
        ys.tix -= 10; save(); wallet.earn(30, '夜市彩券換福氣幣');
        sfx.chime(); say('十張彩券換了 30 福氣幣，可以拿去供品店買供品，或再玩幾輪。');
      } else {
        const s = SNACKS.find((x) => x.id === b.dataset.sn); if (!s || ys.tix < s.tix) return;
        const first = !ys.snacks[s.id];
        ys.tix -= s.tix; ys.snacks[s.id] = (ys.snacks[s.id] || 0) + 1;
        pantry.add(s.id); // 跟供品店同一個供品籃
        save(); sfx.pop(); sfx.buzz(10);
        say(`換到一份<b>${s.name}</b>（${s.mean}），放進供品籃了。${first ? '點心圖鑑多一格！' : ''}${s.fav.length && api.godName ? `${s.fav.map((h) => api.godName(h)).filter(Boolean).join('、')}最愛這個。` : ''}`);
      }
      const top = body.scrollTop; root.innerHTML = draw(); body.scrollTop = top; paintHud();
    });
    say('點心攤阿姨：「彩券拿來，阿姨幫你包！點心也可以拿去拜神明喔。」');
  }

  /* ===================== 手勢分派 ===================== */
  const pad = S('nPad');
  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault(); pad.setPointerCapture(e.pointerId);
    const p = svgPt(svg, e);
    if (game === 'ring') ringDown(p); else if (game === 'fish') fishDown(p); else if (game === 'pop') popDown(p);
  });
  pad.addEventListener('pointermove', (e) => {
    const p = svgPt(svg, e);
    if (game === 'ring') ringMove(p); else if (game === 'fish') fishMove(p); else if (game === 'pop') popMove(p);
  });
  const up = (e) => {
    const p = svgPt(svg, e);
    if (game === 'ring') ringUp(p); else if (game === 'fish') fishUp(p); else if (game === 'pop') popUp(p);
  };
  pad.addEventListener('pointerup', up);
  pad.addEventListener('pointercancel', () => { rDrag = null; if (game === 'ring' && busy === true) handRing(); poi = null; drawPoi(); aim = null; S('nAim').style.display = 'none'; });

  // 大廳點攤位
  const pickBooth = (k) => { if (k === 'snack') openSnacks(); else start(k); };
  S('nLobby').addEventListener('click', (e) => { const b = e.target.closest('[data-ys]'); if (b) pickBooth(b.dataset.ys); });
  S('nLobby').addEventListener('keydown', (e) => { const b = e.target.closest('[data-ys]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pickBooth(b.dataset.ys); } });
  $('#ysBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-ys]'); if (!b) return;
    const a = b.dataset.ys;
    if (a === 'snack') { openSnacks(); return; }
    if (game === a && busy) { say(`正在玩${GAMES[a]}。`); return; }
    if (busy) { backToLobby(); }
    start(a);
  });

  return {
    enter() {
      backToLobby(); today(); paintHud();
      const fresh = Object.keys(GAMES).every((g) => freeLeft(g) === FREE);
      say(`走出山門，廟口夜市燈都亮了！套圈圈、撈金魚、射氣球${fresh ? '<b>每攤今天都送三輪免費</b>' : '隨你挑'}。贏來的彩券可以到點心攤換糖葫蘆、雞蛋糕、珍奶，拿去拜拜也可以。`);
    },
    leave() { run++; busy = false; game = null; poi = null; aim = null; rDrag = null; },
  };
}

import { TEST, testSaveKey, initTestPanel } from './testmode.js'; // 試玩模式（?test=1），要最先載入：日期平移
import './style.css';
import { SCENE_SVG } from './scene.js';
import { CHARS, DEFAULT_CHAR, charById } from './chars.js';
import { FORTUNES, CATEGORIES, DAILY, cn } from './fortunes.js';
import { QIAN_LISTS } from './qian-more.js'; // 籤詩加量（各殿 24 首、心安籤 36 首）
import { initDaily } from './daily.js'; // 每日輕任務、奇遇、香火
import { initNpc } from './npc.js'; // 殿裡的其他香客
import { initFx, emit, burst, onTick, setFxView, REDUCED_MOTION } from './fx.js';
import * as sfx from './audio.js';
import { renderCard } from './card.js';
import { FURNACE_SVG, bindJoss } from './joss.js';
import { initCaishen } from './caishen.js';
import { initYuelao } from './yuelao.js';
import { initTudigong } from './tudigong.js';
import { initWenchang } from './wenchang.js';
import { initJigong } from './jigong.js';
import { initSantaizi } from './santaizi.js';
import { initGuanyin } from './guanyin.js';
import { initGuangong } from './guangong.js';
import { initZhusheng } from './zhusheng.js';
import { initTaisui } from './taisui.js';
import { initMuniang } from './muniang.js';
import { initMile } from './mile.js';
import { initJigai } from './jigai.js';
import { initBanquet } from './banquet.js';
import { initPond } from './pond.js';
import { initStudy, initSleep, initBoard, initGate, initWash } from './places.js';
import { initXiaoren } from './xiaoren.js';
import { initNightMarket } from './nightmarket.js';
import { initShoujing } from './shoujing.js';
import { initFahui, fahuiNews } from './fahui.js';
import { initJingxin } from './jingxin.js';
import { initJieqian, TOPICS as ASK_TOPICS } from './jieqian.js';
import { initXitai } from './xitai.js';
import { initTiangong } from './tiangong.js';
import { tossJiao } from './jiaotoss.js';
import { initToday } from './today.js'; // 「今日」膠囊：節慶倒數＋每日小任務合成一顆
import { initCloud } from './cloud.js'; // 匿名雲端存檔＋復原碼
import { initGuide } from './guide.js'; // 參拜流程進度條（新手引導）
import { initAmulet } from './amulet.js';
import { initFest } from './fest/index.js';
import { lunarFix, lunarOf, FESTIVALS } from './fest/core.js';
import { wallet, EARN } from './wallet.js';
import { initShop, pantry, itemById, favOf } from './shop.js';
import { openDonate, donateOn } from './donate.js'; // 香油錢箱（真的錢，自願贊助作者）
import mapUrl from './assets/temple-map.webp';
import hallBg from './assets/hall-bg.webp';
import hallFest from './assets/hall-festival.webp';
import caiBg from './assets/cai/cai-bg.webp';
import caiFest from './assets/cai/cai-festival.webp';
import yueBg from './assets/yue/yue-bg.webp';
import yueFest from './assets/yue/yue-festival.webp';
import tudiBg from './assets/tudi/tudi-bg.webp';
import tudiFest from './assets/tudi/tudi-festival.webp';
import wenBg from './assets/wen/wen-bg.webp';
import wenFest from './assets/wen/wen-festival.webp';
import jiBg from './assets/ji/ji-bg.webp';
import jiFest from './assets/ji/ji-festival.webp';
import sanBg from './assets/san/san-bg.webp';
import sanFest from './assets/san/san-festival.webp';
import gyBg from './assets/gy/gy-bg.webp';
import gyFest from './assets/gy/gy-festival.webp';
import ggBg from './assets/gg/gg-bg.webp';
import ggFest from './assets/gg/gg-festival.webp';
import zsBg from './assets/zs/zs-bg.webp';
import zsFest from './assets/zs/zs-festival.webp';
import tsBg from './assets/ts/ts-bg.webp';
import tsFest from './assets/ts/ts-festival.webp';
import tgBg from './assets/tg/tg-bg.webp';
import tgFest from './assets/tg/tg-festival.webp';
import tubeUrl from './assets/tube.webp';
import godMazu from './assets/gods/mazu.webp';
import godCai from './assets/gods/caishen.webp';
import godYue from './assets/gods/yuelao.webp';
import godWen from './assets/gods/wenchang.webp';
import godGuan from './assets/gods/guangong.webp';
import godGuanyin from './assets/gods/guanyin.webp';
import godJi from './assets/gods/jigong.webp';
import godTudi from './assets/gods/tudigong.webp';
import godZhu from './assets/gods/zhusheng.webp';
import godSan from './assets/gods/santaizi.webp';
import godTai from './assets/gods/taisui.webp';
import godTian from './assets/gods/tiangong.webp';
import godMu from './assets/gods/muniang.webp';
import godMile from './assets/gods/mile.webp';
import muBg from './assets/mu/mu-bg.webp';
import muFest from './assets/mu/mu-festival.webp';
import mlBg from './assets/ml/ml-bg.webp';
import mlFest from './assets/ml/ml-festival.webp';
import flowersUrl from './assets/offer/flowers.webp';
import fruitUrl from './assets/offer/fruit.webp';
import cakesUrl from './assets/offer/cakes.webp';
import teaUrl from './assets/offer/tea.webp';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

/* ---------- 存檔（只存在這支手機的瀏覽器） ---------- */
const REAL_KEY = 'cyber-temple.v1', KEY = testSaveKey(REAL_KEY); // 試玩模式用另一份存檔
const state = {
  name: '香客', char: DEFAULT_CHAR, muted: false,
  fish: 0, streak: 0, lastCheckin: '', affection: 0,
  fortune: null, // { no, cat, wish, date }
};
try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
// 雲端備份（cloud.js）：每次存檔記下時間，4 秒後悄悄備份；試玩模式、內嵌預覽不備份
const cloud = initCloud({ key: KEY, state, bootT: state._t || 0, enabled: KEY === REAL_KEY && window.top === window.self && location.protocol.startsWith('http') });
const save = () => { state._t = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} cloud.schedule(); };
wallet.bind(state, save, { emit });
// 只在這次參拜有效的狀態
const session = { lit: false, incenseUntil: 0, xiaoRun: 0, busy: false, drawFails: 0, shengRun: 0, confirming: false };
let daily = null, npc = null; // 最後面才建立（要等各殿、攤位都準備好）

/* ---------- 日期與農曆 ---------- */
const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const LM = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const LD = (n) => n === 10 ? '初十' : n === 20 ? '二十' : n === 30 ? '三十'
  : (n < 10 ? '初' : n < 20 ? '十' : n < 30 ? '廿' : '三十') + '一二三四五六七八九'[(n % 10) - 1];
function lunar(d = new Date()) {
  const fx = lunarFix(d); if (fx) return { text: `農曆${LM[fx.mon - 1]}月${LD(fx.day)}`, ...fx };
  try {
    const parts = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { month: 'numeric', day: 'numeric' }).formatToParts(d);
    const m = parts.find((p) => p.type === 'month').value, day = +parts.find((p) => p.type === 'day').value;
    const leap = /閏|bis/.test(m), mon = parseInt(m.replace(/\D/g, ''), 10);
    if (!mon || !day) return null;
    return { text: `農曆${leap ? '閏' : ''}${LM[mon - 1]}月${LD(day)}`, day, mon, leap };
  } catch { return null; }
}
const L = lunar();
const isYa = !!L && (L.day === 2 || L.day === 16); // 初二、十六做牙
// 節慶廟（方案三）：春節 正月初一～十五、土地公與濟公生 二月初二（頭牙）、文昌生 二月初三、媽祖生 三月廿三、中秋 八月十五、三太子 九月初九、觀音 二月／六月／九月十九、註生娘娘 三月二十、關公 六月廿四、尾牙 臘月十六（太歲殿的正月安太歲季跟春節同一段）。中元不換紅燈籠。
const FESTS = [[1, 1, 15, '春節'], [2, 2, 2, '土地公・濟公聖誕'], [2, 3, 3, '文昌帝君聖誕'], [3, 23, 23, '媽祖聖誕'], [8, 15, 15, '中秋'], [9, 9, 9, '三太子聖誕'], [2, 19, 19, '觀音菩薩聖誕'], [6, 19, 19, '觀音菩薩成道日'], [9, 19, 19, '觀音菩薩出家日'], [3, 20, 20, '註生娘娘聖誕'], [6, 24, 24, '關聖帝君聖誕'], [7, 18, 18, '瑤池金母聖誕'], [12, 16, 16, '尾牙'], [3, 15, 15, '趙公明元帥聖誕'], [7, 22, 22, '財神爺聖誕']];
const fest = L && !L.leap ? FESTS.find(([m, a, b]) => L.mon === m && L.day >= a && L.day <= b) : null;
let festive = !!fest;
// 每座殿：背景、人偶跪的高度（拜墊）、香爐的上下位移。點燭、上香、擲筊、抽籤共用同一套。
const HALLS = {
  main: { name: '正殿', god: '媽祖', face: godMazu, bg: hallBg, fest: hallFest, base: 536, burnerDy: 0 },
  cai: { name: '財神聚寶閣', god: '財神', face: godCai, bg: caiBg, fest: caiFest, base: 536, burnerDy: 0 },
  yue: { name: '月老閣', god: '月老', face: godYue, bg: yueBg, fest: yueFest, base: 593, burnerDy: 14 },
  tudi: { name: '福德祠', god: '土地公', face: godTudi, bg: tudiBg, fest: tudiFest, base: 536, burnerDy: 0 },
  wen: { name: '文昌閣', god: '文昌', face: godWen, bg: wenBg, fest: wenFest, base: 536, burnerDy: 0 },
  ji: { name: '濟公堂', god: '濟公', face: godJi, bg: jiBg, fest: jiFest, base: 536, burnerDy: 0 },
  san: { name: '三太子殿', god: '三太子', face: godSan, bg: sanBg, fest: sanFest, base: 536, burnerDy: 0 },
  gy: { name: '觀音殿', god: '觀音', face: godGuanyin, bg: gyBg, fest: gyFest, base: 536, burnerDy: 0 },
  gg: { name: '關帝殿', god: '關公', face: godGuan, bg: ggBg, fest: ggFest, base: 536, burnerDy: 0 },
  zs: { name: '註生娘娘殿', god: '註生娘娘', face: godZhu, bg: zsBg, fest: zsFest, base: 536, burnerDy: 0 },
  ts: { name: '太歲殿', god: '太歲', face: godTai, bg: tsBg, fest: tsFest, base: 536, burnerDy: 0 },
  // 母娘、彌勒的背景照月老閣的構圖生，不用放大
  mu: { name: '瑤池宮', god: '母娘', face: godMu, bg: muBg, fest: muFest, base: 593, burnerDy: 14, noZoom: true },
  ml: { name: '歡喜堂', god: '彌勒', face: godMile, bg: mlBg, fest: mlFest, base: 593, burnerDy: 14, noZoom: true },
  tg: { name: '凌霄寶殿', god: '天公', face: godTian, bg: tgBg, fest: tgFest, base: 536, burnerDy: 0 },
};
// 月老閣的鏡頭比較近（神像大、供桌大），其他殿的背景以供桌桌面 (182, 380) 為中心放大到同樣的比例
const ZOOM = 1.38, ANCHOR = [182, 380];
for (const [k, H] of Object.entries(HALLS)) {
  if (k === 'yue' || H.noZoom) continue;
  H.zoom = ZOOM; H.base = Math.round(ANCHOR[1] + (H.base - ANCHOR[1]) * ZOOM);
}
const bgTransform = (H) => (H.zoom ? `translate(${ANCHOR[0]} ${ANCHOR[1]}) scale(${H.zoom}) translate(${-ANCHOR[0]} ${-ANCHOR[1]})` : '');
let hall = 'main';
const hallImg = () => festive ? HALLS[hall].fest : HALLS[hall].bg;
const today = new Date();
const dateLine = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}${L ? '・' + L.text : ''}`;
const lunarLine = () => { $('#lunar').innerHTML = L ? `${L.text}${fest ? `<br><b>${fest[3]}</b>` : isYa ? '<br><b>今日做牙</b>' : ''}` : ''; };
lunarLine();

/* ---------- 對話列 ---------- */
const WHO = { temple: ['廟公', ''], cat: ['虎爺', 'cat'], god: ['神明指引', 'god'] };
function say(text, who = 'temple') {
  const el = $('#say'), w = $('#sayWho');
  w.textContent = WHO[who][0]; w.className = 'say-who ' + WHO[who][1];
  $('#sayText').innerHTML = text;
  el.classList.remove('pop', 'open'); void el.offsetWidth; el.classList.add('pop');
  sayFit();
}
// 廟公只佔兩行，話太長就出現 ▾，點一下展開（蓋在場景上，場景不會被推下去）
function sayFit() { const t = $('#sayText'); $('#say').classList.toggle('more', t.scrollHeight > t.clientHeight + 2 || $('#say').classList.contains('open')); }
$('#say').addEventListener('click', () => { const el = $('#say'); if (el.classList.contains('more')) el.classList.toggle('open'); });
addEventListener('resize', () => { $('#say').classList.remove('open'); sayFit(); });
document.fonts?.ready.then(sayFit);

/* ---------- 場景 ---------- */
$('#sceneHost').innerHTML = SCENE_SVG(hallImg());
// 點農曆可預覽平日／節慶兩種廟（試玩用）
$('#lunar').addEventListener('click', () => {
  festive = !festive;
  $('#hallBg').setAttribute('href', hallImg());
  const FEST_SAY = { yue: '這是七夕的月老閣：滿天燈籠和愛心，桃花瓣飄下來。', tudi: '這是頭牙（二月初二）和尾牙（臘月十六）的福德祠：榕樹上掛滿紅燈籠和銅錢串。', wen: '這是文昌帝君聖誕和考季的文昌閣：紅燈籠和許願木牌掛滿書架。', ji: '這是濟公聖誕的濟公堂：橘色燈籠一串一串，紅葫蘆掛在柱子上。', san: '這是九月初九三太子聖誕：紅燈籠、彩色氣球，供桌鋪上紅桌巾。', gy: '這是觀音菩薩紀念日的觀音殿：蓮花燈一盞一盞飄在空中。', gg: '這是六月廿四關聖帝君聖誕：紅燈籠掛滿大殿，供桌鋪上龍紋紅桌巾。', zs: '這是三月二十註生娘娘聖誕：花環和燈籠掛滿殿裡，花瓣飄下來。', ts: '這是正月安太歲季的太歲殿：紅燈籠一串一串掛起來。', mu: '這是七月十八瑤池金母聖誕：燈籠和桃花掛滿瑤池宮。', ml: '這是正月初一彌勒佛誕：紅燈籠、鞭炮串和金橘擺滿歡喜堂。', tg: '這是正月初九天公生的凌霄寶殿：甘蔗立在供桌兩旁，紅燈籠掛滿大殿。' };
  say(festive ? `${FEST_SAY[hall] || '這是過年過節的廟：紅燈籠全掛上了。'}再點一次農曆換回平日。` : '換回平日的廟。');
});
initFx($('#fx'));
const svg = $('#sceneHost svg');
const S = (id) => svg.getElementById ? svg.getElementById(id) : svg.querySelector('#' + id);

/* ---------- 鏡頭：點燭、上香、獻供時把供桌拉近 ---------- */
const VH = 645 / 360, FULL = { x: 0, y: 0, w: 360 };
let view = { ...FULL }, camRun = 0, camTimer = 0;
const zoomed = () => view.w < 359;
function applyView(v) {
  const box = `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${(v.w * VH).toFixed(2)}`;
  document.querySelectorAll('#sceneHost > svg, #caiHost > svg, #yueHost > svg, #tudiHost > svg, #wenHost > svg, #jiHost > svg, #sanHost > svg, #gyHost > svg, #ggHost > svg, #zsHost > svg, #tsHost > svg, #muHost > svg, #mlHost > svg, #jgHost > svg, #bzHost > svg, #xrHost > svg, #sjHost > svg, #fhHost > svg, #jxHost > svg, #fsHost > svg, #xiHost > svg, #tgHost > svg, #jqHost > svg, #ysHost > svg, #zxHost > svg, #xdHost > svg, #rjHost > svg, #smHost > svg, #waHost > svg').forEach((el) => el.setAttribute('viewBox', box));
  setFxView(v.x, v.y, v.w);
}
function camera(to, ms = 650) {
  clearTimeout(camTimer);
  const from = { ...view }, run = ++camRun;
  $('#sceneWrap').classList.toggle('close-up', to.w < 359);
  if (REDUCED_MOTION || !ms || (from.x === to.x && from.y === to.y && from.w === to.w)) { view = { ...to }; applyView(view); return; }
  let t0 = null;
  onTick((t) => {
    if (run !== camRun) return false;
    if (t0 === null) t0 = t;
    const k = Math.min(1, (t - t0) / (ms / 1000)), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    view = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e };
    applyView(view);
    if (k >= 1) return false;
  });
}
// 供桌特寫：兩支蠟燭、香爐、供品都在畫面裡，下面還看得到跪著的自己
function altarView(dy = 0) { const w = 214, cy = 384 + dy + (HALLS[hall] ? HALLS[hall].burnerDy : 0); return { x: 182 - w / 2, y: cy - (w * VH) / 2, w }; }
const zoomIn = () => camera(altarView());
// 給各殿用的鏡頭：做動作時把那一塊放大，放開再拉回全景
const cam = {
  zoom(cx, cy, w = 220, ms = 450) { const h = w * VH; camera({ x: Math.max(0, Math.min(360 - w, cx - w / 2)), y: Math.max(0, Math.min(645 - h, cy - h / 2)), w }, ms); },
  reset(delay = 0) { zoomOut(delay); },
};
function zoomOut(delay = 0) { clearTimeout(camTimer); camTimer = setTimeout(() => camera(FULL), delay); }

function paintAvatar() {
  const c = charById(state.char);
  const el = S('avatarImg'), h = 130 * c.scale, w = 120 * c.scale;
  el.setAttribute('href', c.kneel);
  el.setAttribute('width', w); el.setAttribute('height', h);
  el.setAttribute('x', 182 - w / 2); el.setAttribute('y', 536 - h); // 其他殿用 #avatarG 整組往下移
  $('#meThumb').src = c.face;
  $('#meName').textContent = state.name;
}
paintAvatar();

function updateFish() { $('#fishCount').textContent = state.fish; }
updateFish();

/* ---------- 福氣幣（全廟共用的遊戲幣，見 wallet.js） ---------- */
wallet.bind(state, save, {
  emit,
  short: (need) => { sfx.knock(); say(`福氣幣還差 <b>${need}</b> 枚。每天上香、到各殿上香、摸財神元寶都會得到福氣幣。`); },
});
wallet.onChange((n, d) => {
  $('#fuCount').textContent = n;
  if (d) { const el = $('#btnFu'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
});
const paintBasket = () => { const n = pantry.total(); $('#basketN').textContent = n; $('#basketN').hidden = !n; };

const SUB = {}; // 專科殿堂模組（財神、月老、土地公、文昌、濟公），初始化後填入
const drawnToday = () => (hall === 'main' ? !!state.fortune : SUB[hall].hasQianToday());
function markNext() {
  const d = drawnToday();
  const next = !session.lit ? 'candle' : session.incenseUntil < Date.now() && !d ? 'incense' : !d ? 'draw' : hall === 'main' ? 'card' : '';
  document.querySelectorAll('.bar button[data-act]').forEach((b) => b.classList.toggle('next', b.dataset.act === next));
  paintRite();
}
// 參拜流程進度條：點燭 → 上香 → 抽籤 → 擲筊確認（guide.js 負責畫）
let guide = null;
function riteStatus() {
  if (stall || hall !== 'main' || $('#sceneWrap').hidden) return null; // 參拜步驟卡只在正殿出現
  const key = `${hall}|${dayKey()}`;
  if (drawnToday()) return { done: true, key };
  if (session.confirming) return { step: 3, key, tip: '問神明：「這是你要給我的籤嗎？」擲出聖筊才算數' };
  if (!session.lit) { const n = (lit.L ? 1 : 0) + (lit.R ? 1 : 0); return { step: 0, key, sub: `亮 ${n}／2`, tip: tool.kind === 'lighter' ? '按住畫面打火，移到燭芯的虛線圈停一下；不想拖，按「點一下點燭」' : undefined }; }
  if (!rite().until) return { step: 1, key };
  return { step: 2, key };
}
function paintRite() { guide?.paint(riteStatus()); }
// 今天每座殿點過的蠟燭、上過的香要存檔，重新整理後進度還在
function rite(h = hall) {
  if (!state.rite || state.rite.date !== dayKey()) state.rite = { date: dayKey(), h: {} };
  return state.rite.h[h] || (state.rite.h[h] = { L: false, R: false, until: 0 });
}

/* ---------- 手上的工具：打火機、三炷香 ---------- */
const WICK = { L: [106, 345], R: [258, 345] };   // 燭芯
const FIRE = { L: [106, 335], R: [258, 335] };   // 燭火
let BURNER = [182, 356];                         // 香爐口（換殿時會變）
let lit = { L: false, R: false };
const tool = { kind: null, x: 0, y: 0, down: false, hold: 0, sticksLit: false, then: null, smoke: 0 };
const dist = (x, y, [tx, ty]) => Math.hypot(x - tx, y - ty);
function svgPt(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function placeTool(x, y) { tool.x = x; tool.y = y; S('tool').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${tool.kind === 'sticks' ? -8 : 0})`); }
// 手機上手指會擋住東西：工具浮在手指上方一段距離，靠近目標時自動吸過去
const LIFT = 92;
function magnetTarget() {
  if (tool.kind === 'lighter') { const k = ['L', 'R'].find((id) => !lit[id]); return k ? WICK[k] : null; }
  if (!tool.sticksLit) { const k = lit.L && lit.R ? (dist(tool.x, tool.y, FIRE.L) < dist(tool.x, tool.y, FIRE.R) ? 'L' : 'R') : lit.L ? 'L' : lit.R ? 'R' : null; return k ? FIRE[k] : null; }
  return [BURNER[0], BURNER[1] - 58]; // 香腳對準香爐口
}
function follow(p) {
  let x = p.x, y = p.y - LIFT * view.w / 360; // 拉近時抬高的距離跟著縮，手指和工具在螢幕上的距離不變
  const t = magnetTarget();
  if (t) {
    const d = Math.hypot(x - t[0], y - t[1]), R = 46;
    if (d < R) { const k = 1 - d / R; x += (t[0] - x) * Math.min(1, k * 1.6); y += (t[1] - y) * Math.min(1, k * 1.6); }
  }
  placeTool(x, y);
}
function aimAt(p) {
  const a = S('aim');
  if (!p) { a.setAttribute('opacity', '0'); return; }
  a.setAttribute('cx', p[0]); a.setAttribute('cy', p[1]);
  a.setAttribute('opacity', (0.55 + 0.45 * Math.sin(performance.now() / 180)).toFixed(2));
}
function equip(kind, then) {
  tool.kind = kind; tool.then = then || null; tool.hold = 0; tool.down = false; tool.sticksLit = false; tool.auto = false;
  S('tool').style.display = '';
  S('toolLighter').style.display = kind === 'lighter' ? '' : 'none';
  S('toolSticks').style.display = kind === 'sticks' ? '' : 'none';
  S('handTips').setAttribute('opacity', '0');
  svg.style.touchAction = 'none'; $('#sceneWrap').classList.add('tooling');
  // 從人偶手上拿出來，停在人偶右上方，不擋到臉
  const [rx, ry] = kind === 'lighter' ? LIGHTER_REST : [272, 432];
  pullOut(rx, ry);
  onTick(toolTick);
  zoomIn();
  if (kind === 'lighter') { S('wickRings').style.display = ''; paintWickRings(); tapBtn(true); }
}
const LIGHTER_REST = [272, 428], HAND = [182, 488];
function pullOut(x, y) {
  const t0 = performance.now(), D = REDUCED_MOTION ? 1 : 320;
  onTick(() => {
    const k = Math.min(1, (performance.now() - t0) / D), e = 1 - (1 - k) ** 3;
    if (!tool.kind || tool.down) { S('tool').removeAttribute('opacity'); return false; }
    placeTool(HAND[0] + (x - HAND[0]) * e, HAND[1] + (y - HAND[1]) * e);
    S('tool').setAttribute('opacity', (0.3 + 0.7 * e).toFixed(2));
    if (k >= 1) { S('tool').removeAttribute('opacity'); return false; }
  });
}
function paintWickRings() { for (const k of ['L', 'R']) S('wickRing' + k).style.display = lit[k] ? 'none' : ''; }
// 簡易模式：不用按住拖曳，按一下打火機自己飛過去點
let tapEl = null;
function tapBtn(on) {
  if (!on) { tapEl?.remove(); tapEl = null; return; }
  if (tapEl) return;
  tapEl = document.createElement('button');
  tapEl.type = 'button'; tapEl.className = 'tap-easy'; tapEl.textContent = '點一下點燭';
  tapEl.addEventListener('click', autoLight);
  $('#sceneWrap').appendChild(tapEl);
}
async function autoLight() {
  if (tool.kind !== 'lighter' || tool.auto) return;
  tool.auto = true; tapBtn(false);
  for (const k of ['L', 'R']) {
    if (lit[k] || tool.kind !== 'lighter') continue;
    const [x0, y0] = [tool.x, tool.y], [x1, y1] = WICK[k], t0 = performance.now(), D = REDUCED_MOTION ? 1 : 420;
    await new Promise((ok) => onTick(() => {
      const q = Math.min(1, (performance.now() - t0) / D), e = q < .5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2;
      placeTool(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e - 24 * Math.sin(Math.PI * q));
      if (q >= 1) { ok(); return false; }
    }));
    tool.down = true; sfx.knock();
    await sleep(REDUCED_MOTION ? 50 : 450); // toolTick 會在燭芯上停 0.35 秒點著
    if (!lit[k]) lightOne(k);
    tool.down = false;
  }
  tool.auto = false;
}
function unequip(outDelay = 500) {
  tapBtn(false); S('wickRings').style.display = 'none';
  tool.kind = null; tool.down = false; zoomOut(outDelay);
  S('tool').style.display = 'none'; S('lighterFlame').style.display = 'none'; aimAt(null);
  svg.style.touchAction = ''; $('#sceneWrap').classList.remove('tooling');
}
function toolTick(t, dt) {
  if (!tool.kind) return false;
  if (tool.kind === 'lighter') {
    S('lighterFlame').style.display = tool.down ? '' : 'none';
    if (tool.down) S('lighterFlame').setAttribute('transform', `scale(${(1 + .08 * Math.sin(t * 30)).toFixed(3)} ${(1 + .12 * Math.sin(t * 23)).toFixed(3)})`);
    const id = ['L', 'R'].find((k) => !lit[k] && dist(tool.x, tool.y, WICK[k]) < 18);
    const next = ['L', 'R'].find((k) => !lit[k]);
    aimAt(next ? WICK[next] : null);
    if (tool.down && id) {
      tool.hold += dt;
      if (Math.random() < .3) emit('spark', WICK[id][0], WICK[id][1]);
      if (tool.hold > .35) { tool.hold = 0; lightOne(id); }
    } else tool.hold = 0;
  } else {
    if (!tool.sticksLit) {
      const id = ['L', 'R'].find((k) => lit[k] && dist(tool.x, tool.y, FIRE[k]) < 18);
      aimAt(FIRE[dist(tool.x, tool.y, FIRE.L) < dist(tool.x, tool.y, FIRE.R) ? 'L' : 'R']);
      if (id) {
        tool.hold += dt;
        S('handTips').setAttribute('opacity', Math.min(1, tool.hold / .7).toFixed(2));
        if (tool.hold > .7) {
          tool.sticksLit = true; sfx.pop(); sfx.buzz(8); burst('spark', tool.x, tool.y, 8);
          say('香點著了。舉香拜一拜，在心裡報上名字、說說心願，再把香插進中間的香爐。');
        }
      } else if (tool.hold < .7) { tool.hold = Math.max(0, tool.hold - dt); S('handTips').setAttribute('opacity', Math.min(1, tool.hold / .7).toFixed(2)); }
    } else {
      aimAt(BURNER);
      S('handTips').setAttribute('opacity', (0.75 + 0.25 * Math.sin(t * 6)).toFixed(2));
      tool.smoke += dt;
      if (tool.smoke > (REDUCED_MOTION ? .6 : .2)) { tool.smoke = 0; emit('smoke', tool.x + rand(-6, 6), tool.y - 2); }
      // 香腳碰到香爐口就插進去
      if (dist(tool.x, tool.y + 58, BURNER) < 22) { unequip(2200); plantIncense(); return false; }
    }
  }
}
svg.addEventListener('pointerdown', (e) => {
  if (!tool.kind || tool.auto) return;
  e.preventDefault(); svg.setPointerCapture(e.pointerId);
  tool.down = true; if (tool.kind === 'lighter') sfx.knock();
  follow(svgPt(e));
});
svg.addEventListener('pointermove', (e) => { if (tool.kind && tool.down && !tool.auto) follow(svgPt(e)); });
const lift = () => { if (!tool.auto) tool.down = false; };
svg.addEventListener('pointerup', lift); svg.addEventListener('pointercancel', lift);

/* ---------- 點燭 ---------- */
let flicker = false;
function lightOne(id) {
  if (lit[id]) return;
  lit[id] = true; rite()[id] = true; save();
  daily?.hit('candle');
  paintWickRings();
  sfx.pop(); sfx.buzz(8);
  S('flame' + id).setAttribute('opacity', '1');
  burst('spark', WICK[id][0], WICK[id][1] - 10, 14);
  startFlicker();
  if (lit.L && lit.R) {
    session.lit = true; markNext();
    const then = tool.then;
    if (tool.kind === 'lighter') setTimeout(() => { putBack(() => { unequip(then ? 500 : 1300); then && then(); }); }, 450);
    if (!then && !tool.quiet) say('兩支蠟燭都點亮了（2／2），殿裡暖起來了。接著<b>上香</b>吧。');
  } else if (tool.kind === 'lighter') say('點著一支了！<b>已點亮 1／2</b>，再把火移到另一支蠟燭芯上。');
  paintRite();
}
// 點完把打火機收回人偶手上
function putBack(then) {
  if (!tool.kind || REDUCED_MOTION) { then(); return; }
  const [x0, y0] = [tool.x, tool.y], t0 = performance.now(), D = 300;
  tool.auto = true;
  onTick(() => {
    const k = Math.min(1, (performance.now() - t0) / D), e = k * k;
    placeTool(x0 + (HAND[0] - x0) * e, y0 + (HAND[1] - y0) * e);
    S('tool').setAttribute('opacity', (1 - 0.8 * e).toFixed(2));
    if (k >= 1) { tool.auto = false; S('tool').removeAttribute('opacity'); then(); return false; }
  });
}
function startFlicker() {
  if (flicker) return;
  flicker = true;
  onTick((t) => {
    // 規格書的燭光公式：alpha = 0.8 + 0.2 * sin(time * frequency)
    if (lit.L) {
      S('glowL').setAttribute('opacity', (0.8 + 0.2 * Math.sin(t * 7)).toFixed(3));
      S('flameL').setAttribute('transform', `translate(106 346) scale(${(.65 * (0.95 + 0.07 * Math.sin(t * 11))).toFixed(3)} ${(.65 * (0.97 + 0.08 * Math.sin(t * 9))).toFixed(3)})`);
    }
    if (lit.R) {
      S('glowR').setAttribute('opacity', (0.8 + 0.2 * Math.sin(t * 5.3 + 1)).toFixed(3));
      S('flameR').setAttribute('transform', `translate(258 346) scale(${(.65 * (0.95 + 0.07 * Math.sin(t * 10 + 2))).toFixed(3)} ${(.65 * (0.97 + 0.08 * Math.sin(t * 8 + 1))).toFixed(3)})`);
    }
    if (session.lit) S('halo').setAttribute('opacity', (0.45 + 0.12 * Math.sin(t * 1.5)).toFixed(3));
  });
}
function startLighter(then, text) {
  if (session.lit) { say('燭火已經點著了，很亮喔。接著可以上香。'); return; }
  equip('lighter', then);
  say(text || '拿起打火機了。<b>按住畫面</b>打出火，把火苗移到蠟燭芯（虛線圈）上停一下，兩支都要點。不想拖曳，按「點一下點燭」也可以。');
}
function lightCandlesNow() { tool.quiet = true; lightOne('L'); lightOne('R'); tool.quiet = false; }

/* ---------- 上香 ---------- */
const BURN = 180; // 秒
const STICKS = [[172, 214, 162, 168], [180, 214, 180, 162], [188, 214, 198, 168]];
function startIncense() {
  if (session.incenseUntil > Date.now()) { say('香還在燒，心意神明收到了。可以抽籤或擲筊問事。'); return; }
  if (!session.lit) { startLighter(startIncense, '香要從燭火點，先拿打火機把兩支蠟燭點亮。<b>按住畫面</b>打火，移到蠟燭芯上，或按「點一下點燭」。'); return; }
  equip('sticks');
  say('拿起三炷香了。<b>按住畫面</b>把香頭移到燭火上點著。');
}
function bow() {
  const a = S('avatarImg');
  a.classList.remove('bow'); void a.getBoundingClientRect(); a.classList.add('bow');
}
function plantIncense() {
  session.incenseUntil = Date.now() + BURN * 1000;
  rite().until = session.incenseUntil; save();
  routeDone(hall);
  sfx.pop(); sfx.buzz(8); bow();
  burst('spark', 182, 305 + HALLS[hall].burnerDy, 10);
  runIncense();
  say('三炷清香插進香爐，青煙裊裊往上飄。可以抽籤問事，拜完也可以去廟埕的金爐<b>燒金紙</b>。');
  // 每座殿當天第一次上香，福氣幣 +5（鼓勵到各殿走走）
  if (!state.fuHalls || state.fuHalls.date !== dayKey()) state.fuHalls = { date: dayKey(), list: [] };
  if (!state.fuHalls.list.includes(hall)) { state.fuHalls.list.push(hall); save(); wallet.earn(EARN.hall, `${HALLS[hall].god}上香`, 182, 290 + HALLS[hall].burnerDy); }
  const gain = checkin(); // 不管拜哪位神明，上完香就算今天參拜，連續天數 +1
  afterIncense(gain);
  if (gain) setTimeout(() => { burst('fish', 182, 470, Math.min(gain, 5)); say(`今天的參拜完成！已連續參拜 <b>${state.streak}</b> 天，虎爺叼來開運小魚乾 ×${gain}，還有福氣幣 +${checkin.fu}。${state.streak % 7 === 0 ? '連續七天，加碼！' : ''}福氣幣可以到<b>廟口供品店</b>買供品。`, 'cat'); }, 1900);
  markNext();
}
let incenseRun = 0;
function runIncense() {
  S('incense').style.display = '';
  const run = ++incenseRun, dy = HALLS[hall].burnerDy;
  let acc = 0;
  onTick((t, dt) => {
    if (run !== incenseRun) return false;
    const left = (session.incenseUntil - Date.now()) / 1000;
    if (left <= 0) { S('incense').style.display = 'none'; markNext(); return false; }
    const k = 0.25 + 0.75 * (left / BURN); // 香越燒越短
    STICKS.forEach(([x1, y1, x2, y2], i) => {
      const x = x1 + (x2 - x1) * k, y = y1 + (y2 - y1) * k;
      S('stick' + i).setAttribute('d', `M${x1} ${y1} L${x.toFixed(1)} ${y.toFixed(1)}`);
      S('tip' + i).setAttribute('cx', x.toFixed(1)); S('tip' + i).setAttribute('cy', y.toFixed(1));
      S('tip' + i).setAttribute('opacity', (0.7 + 0.3 * Math.sin(t * 6 + i)).toFixed(2));
    });
    acc += dt;
    if (acc > (REDUCED_MOTION ? 0.6 : 0.16)) {
      acc = 0;
      const i = Math.floor(Math.random() * 3), [x1, y1, x2, y2] = STICKS[i];
      emit('smoke', 2 + x1 + (x2 - x1) * k, 140 + dy + y1 + (y2 - y1) * k - 2);
    }
  });
}
function incenseNow() { if (session.incenseUntil > Date.now()) return startIncense(); lightCandlesNow(); plantIncense(); }

/* ---------- 燒金紙 ---------- */
let stopJoss = null;
function openJoss() {
  if (session.busy) return;
  const N = 5;
  const pre = session.incenseUntil > Date.now() ? '' : '通常是點燭、上香拜完以後，才把金紙拿去金爐化掉。';
  const body = openSheet('廟埕金爐・化金紙', `
    <p class="hint">${pre}把金紙<b>一張一張</b>拖進爐口（點一下也可以），不要整疊丟，才燒得完整。</p>
    <div class="joss-stage">${FURNACE_SVG}</div>
    <p class="joss-count" id="jossCount" aria-live="polite">手上還有 ${N} 張金紙</p>`, () => { stopJoss && stopJoss(); stopJoss = null; });
  stopJoss = bindJoss(body, {
    total: N,
    onBurn: (left) => {
      sfx.pop(); sfx.buzz(12);
      $('#jossCount').textContent = left ? `手上還有 ${left} 張金紙` : '金紙都化完了';
    },
    onDone: () => {
      sfx.chime();
      $('#jossCount').insertAdjacentHTML('afterend', '<button class="btn" id="jossDone">化完了，回到大殿</button>');
      $('#jossDone').addEventListener('click', () => { closeSheet(); say('金紙化成輕煙往上送，這份心意神明收到了。', 'god'); routeDone('joss'); });
    },
  });
}

/* ---------- 擲筊 ---------- */
const JIAO = {
  sheng: { name: '聖筊', faces: ['flat', 'round'], text: '一平一凸，是<b>聖筊</b>。神明同意，這件事可以放心去做。' },
  xiao: { name: '笑筊', faces: ['flat', 'flat'], text: '兩面都平，是<b>笑筊</b>。神明笑而不答，可能問題不夠清楚，換個說法再問。' },
  yin: { name: '陰筊', faces: ['round', 'round'], text: '兩面都凸，是<b>陰筊</b>。神明不太同意，或是時機還沒到，先緩一緩。' },
};
function setFace(el, face) {
  el.querySelector('.face-flat').style.display = face === 'flat' ? '' : 'none';
  el.querySelector('.face-round').style.display = face === 'round' ? '' : 'none';
}
async function throwJiao(tip, cancel = true) {
  if (!(await tossJiao({ tip, cancel }))) return null;
  return new Promise((resolve) => {
    const r = Math.random(), b = STALLS.xi?.mod.boost(hall) || 0; // 酬神戲的好運加成
    const key = r < 0.5 + b ? 'sheng' : r < 0.75 + b / 2 ? 'xiao' : 'yin';
    const faces = [...JIAO[key].faces]; if (Math.random() < 0.5) faces.reverse();
    const jdy = Math.min(26, HALLS[hall].base - 536);
    const blocks = [
      { el: S('jiaoA'), x0: 172, y0: 480, x1: rand(132, 158), y1: rand(580, 596) + jdy, spin: rand(540, 900) * (Math.random() < .5 ? -1 : 1), end: rand(-25, 25) },
      { el: S('jiaoB'), x0: 192, y0: 480, x1: rand(206, 232), y1: rand(584, 600) + jdy, spin: rand(540, 900) * (Math.random() < .5 ? -1 : 1), end: rand(-25, 25) },
    ];
    const dur = REDUCED_MOTION ? 0.2 : 0.95, HOP = REDUCED_MOTION ? 0 : 0.32; // 落地後再彈一下才停
    let t0 = null, landed = false, thud = false;
    cam.zoom(182, 560 + jdy, 250, 380); // 鏡頭靠近地板看筊杯落地
    blocks.forEach((b, i) => { b.el.setAttribute('opacity', '1'); b.sh = S(i ? 'jiaoShB' : 'jiaoShA'); b.sh.setAttribute('cy', (b.y1 + 9).toFixed(1)); });
    onTick((t) => {
      if (t0 === null) t0 = t;
      const el = t - t0, k = Math.min(1, el / dur), h = Math.min(1, Math.max(0, (el - dur) / (HOP || 1)));
      if (k >= 1 && !thud) { thud = true; sfx.knock(); sfx.buzz(10); }
      blocks.forEach((b, i) => {
        const hopY = HOP ? 9 * Math.sin(Math.PI * h) * (1 - h * .4) : 0;
        const x = b.x0 + (b.x1 - b.x0) * k + (k >= 1 ? (i ? 4 : -4) * h : 0);
        const air = 150 * 4 * k * (1 - k);
        const y = b.y0 + (b.y1 - b.y0) * k - air - hopY;
        const rot = b.end + b.spin * (1 - k) + (k >= 1 ? (i ? 10 : -10) * Math.sin(Math.PI * h) : 0);
        const flipping = k < 1 && Math.floor((b.spin * k) / 150) % 2 === 0;
        setFace(b.el, k < 1 ? (flipping ? 'flat' : 'round') : faces[i]);
        const sc = 1 + 0.35 * Math.sin(Math.PI * k);
        b.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(3)} ${(sc * (k < 1 ? Math.abs(Math.cos((b.spin * k) * Math.PI / 300)) * .6 + .4 : 1)).toFixed(3)})`);
        // 接觸陰影：筊越高越淡、越大；落地時最清楚
        const lift = Math.min(1, (air + hopY * 6) / 150);
        b.sh.setAttribute('cx', x.toFixed(1));
        b.sh.setAttribute('rx', (14 + 10 * lift).toFixed(1));
        b.sh.setAttribute('opacity', (k < .15 ? k / .15 * .25 : .55 - .4 * lift).toFixed(2));
      });
      if (k >= 1 && h >= 1 && !landed) {
        landed = true; sfx.knock(0.09); sfx.buzz([10, 40, 10]);
        daily?.hit('jiao'); // 擲一次就算，結果如何都算完成
        setTimeout(() => resolve(key), 350); // 停穩了才說結果
        zoomOut(2100);
        setTimeout(() => blocks.forEach((b) => b.sh.setAttribute('opacity', '0')), 2300);
        return false;
      }
    });
  });
}
async function freeJiao() {
  if (session.busy) return;
  session.busy = true;
  say('在心裡默念想問的事，一次只問一件，問成「是不是」的問題。');
  const key = await throwJiao('一次只問一件事，問成「是不是」的問題');
  session.busy = false;
  if (!key) { say('想好要問什麼再來擲筊。'); return; }
  session.xiaoRun = key === 'xiao' ? session.xiaoRun + 1 : 0;
  if (session.xiaoRun >= 3) {
    session.xiaoRun = 0;
    say('連三個笑筊！虎爺從桌下探頭小聲說：「問題可能太籠統了，拆小一點再問一次喵。」', 'cat');
    catHappy();
    return;
  }
  if (key === 'sheng') sfx.chime();
  say(JIAO[key].text, 'god');
  session.shengRun = key === 'sheng' ? session.shengRun + 1 : 0;
  if (key === 'sheng' && daily) {
    if (daily.chance(0.012)) daily.qiyu('goldjiao', () => { for (const k of ['A', 'B']) S('jiao' + k).classList.add('gold-jiao'); burst('spark', 182, 590, 30); setTimeout(() => { for (const k of ['A', 'B']) S('jiao' + k).classList.remove('gold-jiao'); }, 4000); });
    else if (session.shengRun === 3) daily.qiyu('triple', () => burst('spark', 182, 590, 24));
  }
}
// 上完香：委託、香火、奇遇
function afterIncense(gain) {
  if (!daily) return;
  daily.hit('incense', hall);
  const x = daily.incense(hall);
  paintGods();
  if (x?.up) setTimeout(() => daily.showToast(`<b>${HALLS[hall].god}的香火升到 Lv.${x.lv}</b>　已經來上香 ${x.days} 天${x.lv < 8 ? `，再 ${x.next - x.days} 天升下一級` : ''}`), 400);
  const hr = new Date().getHours(), by = HALLS[hall].burnerDy;
  if (gain && daily.chance(0.04)) daily.qiyu('hongbao', () => { wallet.earn(66, '天降紅包', 182, 200); burst('spark', 182, 160, 20); });
  else if (gain && daily.isMoonDay() && state.qiyuMoon !== dayKey()) { state.qiyuMoon = dayKey(); save(); daily.qiyu('moonday'); }
  else if (gain && (hr >= 23 || hr < 4)) daily.qiyu('night');
  else if (gain && hr >= 5 && hr < 7) daily.qiyu('early');
  else if (daily.chance(0.05)) daily.qiyu('smokering', () => smokeRing(182, 230 + by));
}
function smokeRing(x, y) {
  const r = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  r.setAttribute('cx', x); r.setAttribute('cy', y); r.setAttribute('rx', 16); r.setAttribute('ry', 7);
  r.setAttribute('class', 'smoke-ring');
  svg.appendChild(r); setTimeout(() => r.remove(), 4200);
}

/* ---------- 底部面板 ---------- */
let onSheetClose = null;
function openSheet(title, html, onClose) {
  $('#sheetTitle').textContent = title;
  $('#sheetBody').innerHTML = html;
  $('#sheet').hidden = false; $('#sheetBack').hidden = false;
  onSheetClose = onClose || null;
  $('#sheetBody').scrollTop = 0;
  return $('#sheetBody');
}
function closeSheet() {
  $('#sheet').hidden = true; $('#sheetBack').hidden = true;
  const f = onSheetClose; onSheetClose = null; f && f();
}
$('#sheetClose').addEventListener('click', closeSheet);
$('#sheetBack').addEventListener('click', closeSheet);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

function chipGroup(name, items, current) {
  return `<div class="chips" data-group="${name}">${items.map((it) => `<button type="button" class="chip" data-v="${it.id}" aria-pressed="${it.id === current}">${esc(it.name)}</button>`).join('')}</div>`;
}
function bindChips(root, onPick) {
  root.querySelectorAll('[data-group]').forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    onPick(g.dataset.group, b.dataset.v);
  }));
}

/* ---------- 抽籤 ---------- */
const draft = { cat: 'peace', wish: '', no: 0 };
const askNow = () => (state.ask && state.ask.date === dayKey() && !state.ask.no && state.ask.hall === hall ? state.ask : null);
function openDraw() {
  if (session.busy) return;
  session.confirming = false; paintRite();
  const ask = askNow(), askT = ask && ASK_TOPICS.find((t) => t.id === ask.topic);
  if (askT) { draft.cat = askT.cat; if (ask.q) draft.wish = ask.q; }
  if (session.incenseUntil < Date.now() && !session.lit) say('通常會先點燭、上香再抽籤，不過心誠最重要，直接來也可以。');
  // 先抽再說：抽籤前不用填資料，心裡默念就好；抽到籤以後才邀請寫下心願（showFortune）
  if (!askT) draft.wish = '';
  const body = openSheet(`向${hall === 'main' ? '神明' : SUB[hall].god}稟報`, `
    <p class="hint">在心裡跟神明說想問的事，一次問一件。</p>
    ${askT ? `<p class="hint">問事：<b>${askT.name}</b>${ask.q ? `「${esc(ask.q)}」` : ''}。抽到籤、擲出聖筊後，拿去廟埕給廟公解。</p>` : ''}
    ${hall === 'main' ? `<div class="field"><span>想問的方向</span>${chipGroup('cat', CATEGORIES, draft.cat)}</div>` : `<p class="hint">今天抽的是<b>${SUB[hall].qianName}</b>。</p>`}
    <button class="btn" id="goShake">搖籤筒</button>`);
  bindChips(body, (_, v) => { draft.cat = v; });
  $('#goShake').addEventListener('click', () => {
    session.drawFails = 0;
    shake();
  });
}

const STICK_ART = Object.values(import.meta.glob('./assets/act/qian-stick.webp', { eager: true, import: 'default' }))[0];
// 籤枝畫在籤筒「後面」：從筒口慢慢冒出來，冒出來以後籤號印在籤枝上
const TUBE = `<svg viewBox="0 -78 140 248" aria-hidden="true"><g class="tube" id="bigTube">
  <g id="outStick" style="display:none"><g class="stick-rise">${STICK_ART ? `<image href="${STICK_ART}" x="60" y="-6" width="19" height="124" preserveAspectRatio="none"/>` : `<rect x="62" y="-4" width="15" height="120" rx="5" fill="#E8C77A" stroke="#B88A3A" stroke-width="1"/><rect x="62" y="-4" width="15" height="14" rx="5" fill="#C8352B"/>`}<text id="stickTxt" x="69.5" y="24" text-anchor="middle" font-size="11" font-weight="900" fill="#8A2A1E" font-family="serif"></text></g></g>
  <image href="${tubeUrl}" x="38" y="6" width="63" height="160"/></g></svg>`;

async function shake() {
  const body = openSheet('搖籤筒', `
    <div class="tube-stage">${TUBE}</div>
    <p class="stick-no" id="stickNo">沙沙沙……</p>
    <p class="hint" id="shakeHint">籤筒稍微往前傾，輕輕搖到一支籤跳出來。</p>
    <button class="btn" id="goConfirm" hidden>拿這支籤請示神明（擲筊）</button>`);
  const tube = $('#bigTube', body);
  tube.classList.add('shake'); sfx.rattle(1.4); sfx.buzz([20, 40, 20, 40, 20]);
  await sleep(REDUCED_MOTION ? 300 : 1500);
  if ($('#sheet').hidden) return;
  tube.classList.remove('shake');
  draft.no = 1 + Math.floor(Math.random() * (hall === 'main' ? FORTUNES.length : SUB[hall].qianCount));
  // 籤號直排印在籤枝上
  $('#stickTxt', body).innerHTML = [...cn(draft.no)].map((c, i) => `<tspan x="69.5" dy="${i ? 12 : 0}">${c}</tspan>`).join('');
  $('#outStick', body).style.display = '';
  sfx.knock();
  await sleep(REDUCED_MOTION ? 50 : 750);
  if ($('#sheet').hidden) return;
  $('#stickNo', body).textContent = `第${cn(draft.no)}籤`;
  $('#shakeHint', body).innerHTML = '<b>還差一步：</b>拿這支籤擲筊請示神明，擲出聖筊才算數。';
  session.confirming = true; paintRite();
  daily?.hit('draw'); // 看到籤號就算完成，不看擲筊結果
  const btn = $('#goConfirm', body); btn.hidden = false; btn.focus();
  btn.addEventListener('click', confirmStick);
}

async function confirmStick() {
  closeSheet();
  session.busy = true;
  say(`請示神明：弟子${esc(state.name)}抽到第${cn(draft.no)}籤，是這一支嗎？`);
  await sleep(300);
  const key = await throwJiao(`請示神明：抽到的是第${cn(draft.no)}籤嗎？`, false);
  session.busy = false;
  if (key === 'sheng') session.confirming = false;
  if (key === 'sheng') {
    sfx.chime();
    if (daily) {
      const qf = QIAN_LISTS[hall]?.find((x) => x.no === draft.no);
      if (qf?.level === '上上') setTimeout(() => daily.qiyu('topqian'), 1200);
    }
    const ask = askNow();
    if (ask) { // 問事：籤拿去給廟公解
      ask.no = draft.no; ask.read = false;
      if (hall === 'main') state.fortune = { no: draft.no, cat: draft.cat, wish: draft.wish, date: dayKey() }; else SUB[hall].setQian(draft.no);
      save(); markNext(); burst('spark', 182, 590, 18);
      say(`聖筊！神明確認就是第${cn(draft.no)}籤。帶著籤詩去<b>解籤處</b>，請廟公阿伯解給你聽。`, 'god');
      await sleep(1500); showStall('jq'); return;
    }
    say(`聖筊！神明確認就是第${cn(draft.no)}籤，去看籤詩吧。`, 'god');
    if (hall !== 'main') { SUB[hall].setQian(draft.no); markNext(); burst('spark', 182, 590, 18); await sleep(900); SUB[hall].openQian(); return; }
    state.fortune = { no: draft.no, cat: draft.cat, wish: draft.wish, date: dayKey() };
    save(); markNext();
    burst('spark', 182, 590, 18);
    await sleep(900);
    showFortune();
  } else {
    session.drawFails++;
    if (session.drawFails >= 3) {
      session.confirming = false; paintRite();
      say(`${JIAO[key].name}。已經連續三次不是了，神明也許想讓你先靜一下。可以敲敲左下角的磬，深呼吸，再來搖籤。`, 'god');
      return;
    }
    say(`${JIAO[key].name}，神明示意不是這一支。把籤放回去，重新搖一次。`, 'god');
    await sleep(1400);
    shake();
  }
}

function showFortune() {
  const f = state.fortune && FORTUNES.find((x) => x.no === state.fortune.no);
  if (!f) { openDraw(); return; }
  const cat = CATEGORIES.find((c) => c.id === state.fortune.cat) || CATEGORIES[0];
  const others = CATEGORIES.filter((c) => c.id !== cat.id);
  openSheet(`第${cn(f.no)}籤・${f.title}`, `
    <div class="slip">
      <div class="slip-side"><span>心安籤第${cn(f.no)}首</span><span class="lv">${f.level}</span></div>
      <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
    </div>
    <div class="explain">
      <h3>白話解籤</h3>
      <p>${f.gist}</p>
      <p><span class="tag">${cat.name}</span>${f[cat.id]}</p>
      ${state.fortune.wish ? `<p class="hint">你的心願：${esc(state.fortune.wish)}</p>` : ''}
      ${state.fortune.wish ? '' : `<div class="wish-ask" id="wishAsk">
        <h3>要把這件事留在廟裡嗎？</h3>
        <p class="hint">寫下來，會印在祈福卡上。不寫也可以。</p>
        <label class="field"><span>稱呼</span><input type="text" id="drawName" maxlength="12" value="${esc(state.name)}"></label>
        <label class="field"><span>心願</span><input type="text" id="drawWish" maxlength="30" placeholder="例：期末考順利歐趴"></label>
        <button class="btn gold" id="saveWish" type="button">留在廟裡</button>
      </div>`}
      <h3>神明小叮嚀</h3>
      <p>${f.tip}</p>
      <details><summary class="hint">看其他方向的解釋</summary>
        ${others.map((c) => `<p><span class="tag">${c.name}</span>${f[c.id]}</p>`).join('')}
      </details>
    </div>
    <p class="hint">籤詩是心靈參考，重要的決定還是要和信任的人商量。</p>
    <div class="row"><button class="btn" id="toCard">做成祈福卡</button><button class="btn ghost" id="keep">收下籤詩</button></div>
    <button class="btn gold" id="toGong">拿去給廟公解籤</button>
    <button class="btn ghost" id="askOther">問另一件事</button>`);
  $('#saveWish')?.addEventListener('click', () => {
    const n = $('#drawName').value.trim(), w = $('#drawWish').value.trim();
    if (n) { state.name = n; paintAvatar(); }
    if (w) state.fortune.wish = w;
    save(); sfx.chime?.();
    $('#wishAsk').innerHTML = w ? `<p class="hint">你的心願：${esc(w)}。已經留在廟裡了。</p>` : '<p class="hint">好，稱呼記下了。</p>';
  });
  $('#toGong').addEventListener('click', () => {
    state.ask = { date: dayKey(), topic: ASK_TOPICS.find((t) => t.cat === state.fortune.cat)?.id || 'work', hall: 'main', q: state.fortune.wish || '', no: state.fortune.no, read: false };
    save(); closeSheet(); showStall('jq');
  });
  $('#toCard').addEventListener('click', openCard);
  $('#askOther').addEventListener('click', openDraw);
  $('#keep').addEventListener('click', () => { closeSheet(); say('籤詩收好了。之後點「抽籤」可以再看一次，也能做成祈福卡分享。'); });
}

/* ---------- 祈福卡 ---------- */
async function openCard() {
  const body = openSheet('祈福卡', `<p class="hint">製作中……</p>`);
  const f = state.fortune && FORTUNES.find((x) => x.no === state.fortune.no);
  const cat = state.fortune && (CATEGORIES.find((c) => c.id === state.fortune.cat) || CATEGORIES[0]);
  const dIdx = [...dayKey()].reduce((a, c) => a + c.charCodeAt(0), 0) % DAILY.length;
  const url = await renderCard({ avatar: charById(state.char).kneel, name: state.name, dateLine, fortune: f, category: cat?.name, wish: state.fortune?.wish, daily: DAILY[dIdx], bg: hallImg() });
  if ($('#sheet').hidden) return;
  daily?.hit('card');
  const shareText = f
    ? `我在心靈大廟抽到第${cn(f.no)}籤「${f.title}」${f.level}：${f.poem.join('，')}。`
    : `今日神明小指引：${DAILY[dIdx]}`;
  body.innerHTML = `
    <img class="card-img" src="${url}" alt="祈福卡：${esc(shareText)}">
    <p class="hint">手機上長按圖片就能儲存，或直接分享到 IG 限動、Threads。</p>
    <div class="row"><button class="btn gold" id="copyText">複製祈福文字</button>${f ? '' : '<button class="btn" id="cardDraw">先去抽支籤</button>'}</div>`;
  $('#copyText').addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(shareText); e.target.textContent = '已複製'; }
    catch { e.target.textContent = '無法複製，請長按圖片分享'; }
  });
  $('#cardDraw')?.addEventListener('click', openDraw);
}

/* ---------- 虎爺 ---------- */
function catHappy() {
  const tiger = S('tiger');
  S('catEyesOpen').style.display = 'none'; S('catEyesClosed').style.display = '';
  tiger.classList.remove('happy'); void tiger.getBoundingClientRect(); tiger.classList.add('happy');
  burst('heart', 130, 420, 5);
  sfx.purr(); sfx.buzz([15, 30, 15, 30, 15]);
  clearTimeout(catHappy.t);
  catHappy.t = setTimeout(() => { S('catEyesOpen').style.display = ''; S('catEyesClosed').style.display = 'none'; tiger.classList.remove('happy'); }, 1600);
}
const level = () => 1 + Math.floor(state.affection / 50);

function checkin() {
  const k = dayKey();
  if (state.lastCheckin === k) return 0;
  const y = new Date(); y.setDate(y.getDate() - 1);
  state.streak = state.lastCheckin === dayKey(y) ? state.streak + 1 : 1;
  state.lastCheckin = k;
  let gain = state.streak % 7 === 0 ? 5 : 1;
  if (isYa) gain *= 2;
  state.fish += gain; save(); updateFish();
  checkin.fu = EARN.checkin + (state.streak % 7 === 0 ? EARN.week : 0);
  wallet.earn(checkin.fu, '每日上香');
  return gain;
}

function petTiger() {
  catHappy(); daily?.hit('tiger');
  state.affection += 1; save();
  const gain = checkin();
  if (gain) {
    burst('fish', 130, 430, Math.min(gain, 5));
    say(`虎爺伸了個懶腰，叼來今天的開運小魚乾 ×${gain}、福氣幣 +${checkin.fu}！${state.streak % 7 === 0 ? '連續七天，加碼！' : `已連續參拜 ${state.streak} 天。`}${isYa ? '今天做牙，虎爺加菜雙倍。' : ''}點右上角小魚乾可以餵虎爺。`, 'cat');
  } else {
    const lines = ['呼嚕呼嚕……（虎爺翻出肚子）', '虎爺用頭蹭了蹭你的手。', '虎爺瞇起眼睛，鈴鐺叮了一聲。', '虎爺說：今天也辛苦了喵。', '虎爺把尾巴捲在你手上，看起來很放心。'];
    say(lines[Math.floor(Math.random() * lines.length)], 'cat');
  }
}

function openTiger() {
  const draw = () => {
    const lv = level(), pct = (state.affection % 50) * 2, done = state.lastCheckin === dayKey();
    const days = done ? ((state.streak - 1) % 7) + 1 : 0;
    return `
      <p class="hint">下壇將軍虎爺，鎮守神桌下，招財、防小人。每天來摸摸祂，就能領開運小魚乾。</p>
      <div class="cat-panel">
        <div class="stat"><small>開運小魚乾</small><b>${state.fish}</b></div>
        <div class="stat"><small>好感度 Lv.${lv}</small><b>${state.affection}</b><div class="meter"><i style="width:${pct}%"></i></div></div>
      </div>
      <div class="field"><span>這週簽到（第 7 天送 5 條${isYa ? '，今天做牙雙倍' : ''}）</span><div class="week">${Array.from({ length: 7 }, (_, i) => `<i class="${i < days ? 'on' : ''}"></i>`).join('')}</div></div>
      <div class="row">
        <button class="btn gold" id="tCheck" ${done ? 'disabled' : ''}>${done ? '今天領過了' : '摸摸虎爺領小魚乾'}</button>
        <button class="btn" id="tFeed" ${state.fish ? '' : 'disabled'}>餵一條小魚乾</button>
      </div>`;
  };
  const body = openSheet('照顧虎爺', draw());
  const rebind = () => {
    $('#tCheck', body).addEventListener('click', () => { petTiger(); body.innerHTML = draw(); rebind(); });
    $('#tFeed', body).addEventListener('click', () => {
      if (!state.fish) return;
      const before = level();
      state.fish -= 1; state.affection += 10; save(); updateFish();
      daily?.hit('feed');
      catHappy(); burst('fish', 130, 435, 1);
      emit('text', 130, 400, { text: '好感 +10', color: '#FFD0A0' });
      say(level() > before ? `虎爺好感升到 Lv.${level()}！祂把鈴鐺搖得叮叮響。` : '虎爺吃得津津有味，舔舔嘴巴。', 'cat');
      body.innerHTML = draw(); rebind();
    });
  };
  rebind();
}

/* ---------- 磬與神明 ---------- */
const CALM = ['煩惱 -1', '心隨境寂', '呼——', '放鬆肩膀', '平安 +1'];
function ringQing() {
  const b = S('qingBowl');
  b.classList.remove('ring'); void b.getBoundingClientRect(); b.classList.add('ring');
  sfx.bowl(); sfx.buzz(200);
  emit('text', 309, 515, { text: CALM[Math.floor(Math.random() * CALM.length)] });
  say('噹——磬聲慢慢散開。跟著吸氣四秒，停兩秒，再吐氣四秒。');
}
/* ---------- 獻供：供桌拉近，自己把供品一樣一樣擺上去 ---------- */
// slot = 擺在供桌上的位置（場景座標），els = 場景裡對應的圖
const OFFERS = [
  { id: 'flowers', name: '鮮花', mean: '表敬意', img: flowersUrl, els: ['offFlowerL', 'offFlowerR'], slots: [[131, 368], [233, 368]] },
  { id: 'fruit', name: '水果', mean: '求平安', img: fruitUrl, els: ['offFruit'], slots: [[139, 373]] },
  { id: 'tea', name: '清茶', mean: '清心', img: teaUrl, els: ['offTea'], slots: [[180, 378]] },
  { id: 'cakes', name: '糕餅', mean: '圓滿', img: cakesUrl, els: ['offCakes'], slots: [[222, 374]] },
];
const TABLE = { x0: 92, x1: 272, y0: 326, y1: 418 }; // 放在這個範圍內都算擺上供桌
const offeredToday = () => (state.offer && state.offer.date === dayKey() ? state.offer.items : []);
function showOffers(anim) {
  const done = offeredToday();
  OFFERS.forEach((o) => o.els.forEach((id) => {
    const el = S(id), on = done.includes(o.id);
    el.style.display = on ? '' : 'none';
    if (on && anim === o.id) { el.classList.remove('pop'); void el.getBoundingClientRect(); el.classList.add('pop'); }
  }));
}
showOffers();
/* ---------- 供品店買來的供品：每殿供桌最多再擺 4 樣（當天有效） ---------- */
const SHRINE_MAX = 4;
// [中心 x, 底部 y]：正殿中間已經有鮮花水果，買的擺在蠟燭外側；其他殿擺在香爐兩邊
const SHRINE_SLOTS = { main: [[80, 389], [285, 389], [150, 395], [216, 395]], other: [[122, 390], [242, 390], [86, 393], [278, 393]] };
const shrineSlots = () => SHRINE_SLOTS[hall === 'main' ? 'main' : 'other'];
function shrineList(h = hall) {
  if (!state.shrine || state.shrine.date !== dayKey()) state.shrine = { date: dayKey(), halls: {} };
  return state.shrine.halls[h] || (state.shrine.halls[h] = []);
}
function paintShrine(pop = -1) {
  const slots = shrineSlots();
  S('shrine').setAttribute('transform', `translate(0 ${HALLS[hall].burnerDy})`);
  S('shrine').innerHTML = shrineList().map((id, i) => {
    const it = itemById(id); if (!it || !slots[i]) return '';
    const [cx, by] = slots[i], w = Math.round(it.w * 1.4), h = it.tall ? 80 : Math.round(w * 1.3);
    return `<g class="offer${i === pop ? ' pop' : ''}"><ellipse cx="${cx}" cy="${by - 1.5}" rx="${(w * 0.46).toFixed(1)}" ry="2.6" fill="url(#contact)"/>
      <image href="${it.img}" x="${cx - w / 2}" y="${by - h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet" filter="url(#lit)"/></g>`;
  }).join('');
}

let offerUI = null;
function offerGifts() {
  if (offerUI) return;
  const main = hall === 'main', done = main ? offeredToday() : [];
  const basicsLeft = main && done.length < OFFERS.length;
  if (!basicsLeft && !pantry.total()) {
    shop.openShop({
      back: () => { if (pantry.total()) offerGifts(); },
      line: main ? '今天的鮮花、水果、清茶、糕餅都擺好了。想多供一點，在供品店挑神明愛吃的，買好按下面的按鈕去擺。'
        : `供品籃是空的。挑幾樣${HALLS[hall].god}愛吃的，買好按下面的按鈕回來擺上供桌。`,
    });
    return;
  }
  session.busy = true; camera(altarView(58)); // 下面有供品盤，鏡頭往下移一點，讓供桌在畫面上半部
  const tray = document.createElement('div');
  tray.className = 'offer-tray'; tray.id = 'offerTray';
  $('#sceneWrap').append(tray);
  offerUI = { tray, drag: null };
  renderTray();
  const fav = favHere();
  say(main
    ? '供桌拉近了。把下面的供品<b>拖到供桌上</b>（點一下也會自己擺好）。鮮花放兩邊，水果、清茶、糕餅擺中間，供品店買的擺在蠟燭外側。'
    : `${HALLS[hall].god}的供桌拉近了。把供品籃裡的東西<b>拖到供桌上</b>。${fav.length ? `${HALLS[hall].god}最愛${fav.map((x) => x.name).join('、')}。` : ''}`);
  tray.addEventListener('pointerdown', offerDown);
  tray.addEventListener('click', (e) => {
    if (e.target.closest('#offerClose')) { endOffer(); return; }
    if (e.target.closest('#offerShop')) { endOffer(0); shop.openShop({ back: () => { if (pantry.total() || (hall === 'main' && offeredToday().length < OFFERS.length)) offerGifts(); } }); return; }
    const b = e.target.closest('.offer-item'); if (!b || b.classList.contains('done')) return;
    if (e.detail === 0) placeAny(b); // 鍵盤
  });
}
const favHere = () => favOf(hall);
function renderTray() {
  const main = hall === 'main', done = main ? offeredToday() : [], full = shrineList().length >= SHRINE_MAX;
  const basics = main && done.length < OFFERS.length ? OFFERS.map((o) => `<button type="button" class="offer-item${done.includes(o.id) ? ' done' : ''}" data-offer="${o.id}" aria-label="把${o.name}擺上供桌">
      <img src="${o.img}" alt="" draggable="false"><b>${o.name}</b><small>${o.mean}</small></button>`).join('') : '';
  const bag = pantry.list().filter((it) => !it.tags.includes('kuqian')).map((it) => `<button type="button" class="offer-item bag${full ? ' done' : ''}${it.fav.includes(hall) ? ' fav' : ''}" data-item="${it.id}" aria-label="把${it.name}擺上供桌，還有 ${pantry.count(it.id)} 份">
      <img src="${it.img}" alt="" draggable="false"><b>${it.name}</b><small>${it.fav.includes(hall) ? '最愛' : it.mean}</small><i class="offer-n">${pantry.count(it.id)}</i></button>`).join('');
  offerUI.tray.innerHTML = `<p class="offer-tip">${full ? `今天這張供桌已經擺了 ${SHRINE_MAX} 樣買來的供品` : '按住供品拖到供桌上，或點一下'}</p>
    <div class="offer-items">${basics}${bag}<button type="button" class="offer-item shop-tile" id="offerShop" aria-label="去廟口供品店買供品"><span class="shop-ico" aria-hidden="true">店</span><b>供品店</b><small>福氣幣 ${wallet.balance()}</small></button></div>
    <button type="button" class="offer-close" id="offerClose">先這樣</button>`;
}
function trayPick(b) {
  if (b.dataset.offer) { const o = OFFERS.find((x) => x.id === b.dataset.offer); return { ...o, place: () => placeOffer(o.id) }; }
  const it = itemById(b.dataset.item), slot = shrineSlots()[shrineList().length] || shrineSlots()[0];
  return { name: it.name, img: it.img, slots: [[slot[0], slot[1] - 14 + HALLS[hall].burnerDy]], place: () => placeItem(it.id) };
}
const placeAny = (b) => trayPick(b).place();
function offerDown(e) {
  const b = e.target.closest('.offer-item'); if (!b || b.id === 'offerShop' || b.classList.contains('done') || offerUI.drag) return;
  e.preventDefault(); b.setPointerCapture(e.pointerId);
  const o = trayPick(b);
  const ghost = document.createElement('img');
  ghost.src = o.img; ghost.className = 'offer-ghost'; ghost.alt = '';
  $('#sceneWrap').append(ghost);
  const d = offerUI.drag = { o, b, ghost, sx: e.clientX, sy: e.clientY, moved: false, run: 0 };
  sfx.knock(); b.classList.add('lifting');
  moveGhost(e);
  const move = (ev) => { if (Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) > 8) d.moved = true; moveGhost(ev); };
  const up = (ev) => {
    b.removeEventListener('pointermove', move); b.removeEventListener('pointerup', up); b.removeEventListener('pointercancel', up);
    if (!offerUI) { ghost.remove(); return; }
    offerUI.drag = null; b.classList.remove('lifting'); aimAt(null); d.run = -1;
    const p = ghostPt(ev), dy = HALLS[hall].burnerDy;
    const onTable = p.x > TABLE.x0 - 40 && p.x < TABLE.x1 + 50 && p.y > TABLE.y0 + dy && p.y < TABLE.y1 + dy;
    if (!d.moved || onTable) { ghost.remove(); o.place(); return; }
    ghost.classList.add('back'); setTimeout(() => ghost.remove(), 250);
    say(`再往上一點，把${o.name}放到<b>供桌</b>上（金色虛線圈的位置）。`);
  };
  b.addEventListener('pointermove', move); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  onTick((t) => { if (d.run < 0) return false; aimAt(o.slots[Math.floor(t * 1.2) % o.slots.length]); });
}
// 供品浮在手指上方，跟工具一樣不會被手指擋住
const GHOST_LIFT = 80;
function ghostPt(e) { return svgPt({ clientX: e.clientX, clientY: e.clientY - GHOST_LIFT }); }
function moveGhost(e) {
  const r = $('#sceneWrap').getBoundingClientRect(), g = offerUI.drag.ghost;
  g.style.transform = `translate(${(e.clientX - r.left).toFixed(1)}px, ${(e.clientY - r.top - GHOST_LIFT).toFixed(1)}px) translate(-50%, -50%)`;
}
function placeOffer(id) {
  const o = OFFERS.find((x) => x.id === id);
  if (!state.offer || state.offer.date !== dayKey()) state.offer = { date: dayKey(), items: [] };
  if (state.offer.items.includes(id)) return;
  state.offer.items.push(id); save();
  daily?.hit('offer');
  showOffers(id);
  sfx.pop(); sfx.buzz(10);
  o.slots.forEach(([x, y]) => burst('spark', x, y - 8, 6));
  emit('text', 182, 412, { text: `${o.name}・${o.mean}`, size: 12 });
  if (offerUI) renderTray();
  const left = OFFERS.filter((x) => !state.offer.items.includes(x.id));
  if (left.length) { say(`${o.name}擺好了，${o.mean}。還有${left.map((x) => x.name).join('、')}。`); return; }
  const more = pantry.total();
  setTimeout(() => {
    if (!more) endOffer(1800);
    bow(); sfx.chime(); S('halo').setAttribute('opacity', '.7'); burst('heart', 182, 340, 6);
    say(`供品都擺好了：鮮花表敬意、水果求平安、清茶清心、糕餅圓滿。雙手合十拜一拜。${more ? '供品籃裡還有買來的供品，也可以擺上去。' : ''}`);
  }, 500);
}
function placeItem(id) {
  const it = itemById(id), list = shrineList();
  if (list.length >= SHRINE_MAX) { say(`供桌上已經擺了 ${SHRINE_MAX} 樣買來的供品，明天再來換新的吧。`); return; }
  if (!pantry.take(id)) return;
  list.push(id); save(); paintShrine(list.length - 1); paintBasket();
  daily?.hit('offer');
  const [cx, by] = shrineSlots()[list.length - 1], dy = HALLS[hall].burnerDy;
  sfx.pop(); sfx.buzz(10);
  burst('spark', cx, by - 10 + dy, 6);
  emit('text', 182, 412 + dy, { text: `${it.name}・${it.mean}`, size: 12 });
  if (offerUI) renderTray();
  const god = HALLS[hall].god;
  if (it.fav.includes(hall)) {
    const back = Math.round(it.price / 2);
    setTimeout(() => {
      bow(); sfx.chime(); sfx.buzz([10, 40, 10]); burst('heart', 182, 300, 8);
      if (hall === 'main') S('halo').setAttribute('opacity', '.8');
      wallet.earn(back, `${god}回禮`, 182, 270);
      say(`${god}最愛${it.name}了！神像好像笑了一下，回禮福氣幣 +${back}。`, 'god');
    }, 350);
    return;
  }
  const fav = favHere().filter((x) => !list.includes(x.id));
  say(`${it.name}擺上${god}的供桌了，${it.mean}。${fav.length ? `悄悄說：${god}最愛的是${fav.map((x) => x.name).join('、')}。` : ''}`);
}
function endOffer(delay = 300) {
  if (!offerUI) return;
  if (offerUI.drag) { offerUI.drag.run = -1; offerUI.drag.ghost.remove(); aimAt(null); }
  offerUI.tray.remove(); offerUI = null; session.busy = false;
  zoomOut(delay);
}
function greetDeity() {
  const h = S('halo'); h.setAttribute('opacity', '.75');
  daily?.hit('greet');
  burst('spark', 182, 290, 12);
  const i = Math.floor(Math.random() * DAILY.length);
  say(DAILY[i], 'god');
  if (daily?.chance(0.06)) daily.qiyu('wink', () => { h.setAttribute('opacity', '1'); burst('spark', 182, 250, 26); });
}

/* ---------- 選角色 ---------- */
function openAvatar() {
  let pick = charById(state.char).id;
  const body = openSheet('選我的人偶', `
    <label class="field"><span>暱稱</span><input type="text" id="avName" maxlength="12" value="${esc(state.name)}"></label>
    <div class="char-grid" role="radiogroup" aria-label="角色">${CHARS.map((c) => `
      <button type="button" class="char" data-id="${c.id}" role="radio" aria-checked="${c.id === pick}">
        <img src="${c.face}" alt="" loading="lazy"><span>${c.name}</span></button>`).join('')}
    </div>
    <p class="hint">之後會加「上傳照片，生成自己的人偶」。</p>
    <button class="btn" id="avSave">完成，回到大殿</button>
    <details class="cloud-box"><summary>換手機也能接回進度</summary>
      <p class="hint" id="cloudState"></p>
      <div class="field"><span>你的復原碼（請自己存好，不要給別人）</span><div class="cloud-code"><input type="text" id="cloudCode" readonly value="${esc(cloud.code())}"><button type="button" class="btn ghost" id="cloudCopy">複製</button></div></div>
      <label class="field"><span>在新手機上：貼上舊手機的復原碼</span><input type="text" id="cloudIn" placeholder="貼上復原碼" autocomplete="off" spellcheck="false"></label>
      <button type="button" class="btn gold" id="cloudGo">接回進度</button>
      <p class="hint">存檔（包含寫下的心願）會備份在本站雲端，只用來還原你的進度，不會拿去做別的用途。</p>
    </details>`);
  const st = cloud.status;
  $('#cloudState').textContent = !cloud.enabled ? '試玩模式不會備份。' : st.on ? (st.last ? `已備份到雲端（${new Date(st.last).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}）。` : '雲端備份已開啟。') : '目前只存在這支手機（雲端連不上）。';
  $('#cloudCopy').addEventListener('click', async (e) => { try { await navigator.clipboard.writeText(cloud.code()); e.target.textContent = '已複製'; } catch { $('#cloudCode').select(); e.target.textContent = '請長按複製'; } });
  $('#cloudGo').addEventListener('click', async (e) => {
    const v = $('#cloudIn').value.trim(); if (!v) return;
    if (v === cloud.code()) { $('#cloudState').textContent = '這就是這支手機的復原碼喔。'; return; }
    if (!confirmRestore()) return;
    e.target.disabled = true; e.target.textContent = '接回中…';
    const r = await cloud.restore(v);
    e.target.disabled = false; e.target.textContent = '接回進度';
    $('#cloudState').textContent = r === 'bad' ? '復原碼格式不對，請整段貼上。' : r === 'none' ? '找不到這個復原碼的存檔。' : r === 'offline' ? '現在連不上雲端，等一下再試。' : '';
  });
  function confirmRestore() {
    const b = $('#cloudGo');
    if (b.dataset.sure) return true;
    b.dataset.sure = '1'; b.textContent = '確定？這支手機的進度會被換掉（再按一次）';
    return false;
  }
  body.querySelector('.char-grid').addEventListener('click', (e) => {
    const b = e.target.closest('.char'); if (!b) return;
    pick = b.dataset.id;
    body.querySelectorAll('.char').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  });
  $('#avSave').addEventListener('click', () => {
    state.char = pick; state.name = $('#avName').value.trim() || '香客'; save(); paintAvatar(); npc?.paint(hall);
    closeSheet(); say(`${esc(state.name)}，歡迎回到大殿。`);
  });
}

/* ---------- 綁定 ---------- */
const ACTIONS = {
  candle: () => startLighter(), incense: startIncense, jiao: freeJiao, joss: openJoss,
  draw: () => (hall !== 'main' ? (SUB[hall].hasQianToday() ? SUB[hall].openQian() : openDraw())
    : state.fortune && state.fortune.date === dayKey() ? showFortune() : openDraw()),
  card: openCard, offer: offerGifts, deity: greetDeity, tiger: petTiger, qing: ringQing,
  amulet: () => amulet.open(),
};
// 用鍵盤（沒有拖曳）時，點燭、上香直接完成
const QUICK = {
  candle: () => { if (session.lit) return startLighter(); lightCandlesNow(); say('兩支蠟燭都點亮了，殿裡暖起來了。接著上香吧。'); },
  incense: incenseNow,
};
function act(name, keyboard) {
  if (offerUI) { endOffer(name === 'offer' ? 300 : 0); if (name === 'offer') return; }
  if (tool.kind) { const same = (name === 'candle' && tool.kind === 'lighter') || (name === 'incense' && tool.kind === 'sticks'); unequip(); if (same) { say('先把手上的東西放下了。'); return; } }
  (keyboard && QUICK[name] ? QUICK[name] : ACTIONS[name])();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('.bar button[data-act]'); if (b) act(b.dataset.act, e.detail === 0);
});
svg.addEventListener('click', (e) => {
  if (tool.kind) return; // 拿著工具時，點畫面是在移動工具
  const h = e.target.closest('[data-hit]'); if (h && !session.busy) act(h.dataset.hit);
});
svg.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const h = e.target.closest('[data-hit]'); if (h) { e.preventDefault(); act(h.dataset.hit, true); }
});
$('#btnAvatar').addEventListener('click', openAvatar);
$('.fish').setAttribute('role', 'button'); $('.fish').tabIndex = 0;
$('.fish').addEventListener('click', openTiger);
$('.fish').addEventListener('keydown', (e) => { if (e.key === 'Enter') openTiger(); });
const mute = $('#btnMute');
const paintMute = () => { sfx.setMuted(state.muted); mute.setAttribute('aria-pressed', String(state.muted)); mute.setAttribute('aria-label', state.muted ? '開啟聲音' : '關閉聲音'); };
mute.addEventListener('click', () => { state.muted = !state.muted; save(); paintMute(); });
paintMute();

// 一進來的招呼
if (state.fortune && state.fortune.date !== dayKey()) state.fortune = null;
function greet() {
if (state.lastCheckin !== dayKey()) say(`歡迎來參拜${state.name !== '香客' ? '，' + esc(state.name) : ''}。先拿打火機點燭、點香，再抽籤，拜完可以去燒金紙。供桌下的橘貓虎爺也在等你摸摸祂。${isYa ? '今天是做牙日，虎爺的小魚乾雙倍。' : ''}`);
else say('又見面了。今天想問什麼？擲筊可以隨時問神明。');
const fl = festMod.greetLine(); if (fl) say(`${$('#sayText').innerHTML}<br>${fl}`);
}

/* ---------- 全廟地圖 ---------- */
// x / y 是標籤中心在地圖上的百分比，w 是寬度百分比（要蓋住原圖上的標籤）
const AREAS = [
  { id: 'hall', name: '正殿・進入參拜', x: 51.1, y: 31.3, w: 24, main: true },
  { id: 'backyard', name: '後院靜心閣', x: 51.1, y: 3.7, w: 23, main: true, info: '後院靜心閣：每天抄一段心經或大悲咒，敲木魚念佛號，讓心靜下來。' },
  { id: 'study', name: '伴讀自習室', x: 70, y: 7.1, w: 19.5, main: true, info: '伴讀自習室：點一根蠟燭當番茄鐘，燒完就是讀完一段。' },
  { id: 'sleep', name: '睡前熄燈室', x: 78.7, y: 13.2, w: 13, main: true, info: '睡前熄燈室：睡前一分鐘擦去灰塵濁氣，敲磬三下，螢幕慢慢暗下來。' },
  { id: 'wings', name: '兩廂專科殿堂', x: 50.6, y: 19.2, w: 19.5, main: true, info: '兩廂專科殿堂：十多位神明各有一座殿。' },
  { id: 'jigong', name: '濟公解憂林', x: 25.3, y: 20.5, w: 12.5, main: true, info: '濟公解憂林：讓濟公師父用破芭蕉扇拍散執念，跳出看破人生的語錄。' },
  { id: 'yuelao', name: '月老閣', x: 79.1, y: 20.5, w: 11, main: true, info: '月老閣：抽清醒戀愛籤，和另一半一起綁定連理紅燭。' },
  { id: 'wenchang', name: '文昌閣', x: 14.4, y: 31.3, w: 9, main: true, info: '文昌閣：求考運，准考證順時針過香爐三圈。' },
  { id: 'caishen', name: '財神聚寶閣', x: 87.2, y: 31.3, w: 16, main: true, info: '財神聚寶閣：摸摸大金元寶，今日財氣 +88。' },
  { id: 'board', name: '媽祖遶境看板', x: 76.7, y: 61.1, w: 14, h: 4.4, main: true, info: '媽祖遶境看板：三月瘋媽祖，跟著神轎路線，用走路步數換算隨香公里數。' },
  { id: 'banquet', name: '流水席辦桌', x: 50.1, y: 77.7, w: 20.5, main: true, info: '流水席紅圓桌：拜完一起吃平安宴。' },
  { id: 'jinting', name: '環保金亭', x: 68.6, y: 79.1, w: 12.5, h: 4.4, main: true, info: '環保金亭：把寫好的祈願疏文化成青煙，上達天聽。' },
  { id: 'pond', name: '許願放生池', x: 86.2, y: 81.1, w: 12, main: true, info: '許願放生池：每天餵魚、放小烏龜、放蓮花水燈，池子會一天天變熱鬧。' },
  { id: 'fahui', name: '法會報名處', x: 19, y: 47.5, w: 15, main: true, info: '法會報名處：報名水懺、梁皇寶懺、禮斗法會，寫上家人的名字。' },
  { id: 'jieqian', name: '廟公解籤處', x: 64, y: 53, w: 14, main: true, info: '廟公解籤處：問事、抽籤，請廟公阿伯用白話解給你聽。' },
  { id: 'shoujing', name: '青衣阿嬤收驚', x: 17.6, y: 82.8, w: 22.5, main: true, info: '青衣阿嬤收驚攤：阿嬤持香幫你收驚安神。' },
  { id: 'xiaoren', name: '鵝頸橋打小人', x: 87.2, y: 85.4, w: 17.5, main: true, info: '鵝頸橋打小人攤：婆婆用舊拖鞋幫你打走霉運。' },
  { id: 'yeshi', name: '廟口夜市', x: 68, y: 96.4, w: 13, main: true, info: '廟口夜市：套圈圈、撈金魚、射氣球，贏彩券換點心。' },
  { id: 'shop', name: '廟口供品店', x: 22, y: 57, w: 18, main: true, info: '廟口供品店：用福氣幣買供品。' },
  { id: 'xitai', name: '酬神戲台', x: 22, y: 68.5, w: 16, main: true, info: '酬神戲台：神明生日那天，廟埕搭台演布袋戲。' },
  { id: 'gate', name: '朱紅牌樓山門', x: 50, y: 89.8, w: 15, main: true, info: '朱紅牌樓山門：跨過門檻，就從日常切換到廟裡的氛圍。' },
  { id: 'wash', name: '淨身石槽', x: 30, y: 98, w: 14, h: 4.4, main: true, info: '淨身石槽：用楊柳枝沾抹草水，擦去一身灰塵濁氣。' },
  // 香油錢箱：安靜的樣式、不閃爍；沒設收款連結就不出現（見 donate.js）
  ...(donateOn() ? [{ id: 'donate', name: '香油錢箱', x: 36, y: 43.5, w: 11, cls: 'donate' }] : []),
];

function buildMap() {
  const wrap = $('#mapWrap');
  $('#mapImg').src = mapUrl;
  const html = AREAS.map((a) => `<button type="button" class="area${a.main ? ' main' : ''}${a.title ? ' title' : ''}${a.cls ? ` ${a.cls}` : ''}" data-area="${a.id}"
    style="left:${a.x}%;top:${a.y}%;min-width:${a.w}%;${a.h ? `min-height:${a.h * 1.433}cqw;` : ''}">${esc(a.name)}</button>`).join('');
  wrap.insertAdjacentHTML('beforeend', `<button type="button" class="hall-hit" data-area="hall" aria-label="進入正殿參拜"></button><div class="plaque">心靈大廟</div>${html}`);
  wrap.addEventListener('click', (e) => {
    const b = e.target.closest('[data-area]'); if (!b) return;
    const a = AREAS.find((x) => x.id === b.dataset.area);
    if (a.id === 'hall') { showHall(); return; }
    if (a.id === 'caishen') { showCai(); return; }
    if (a.id === 'yuelao') { showYue(); return; }
    if (a.id === 'wenchang') { showWen(); return; }
    if (a.id === 'jigong') { showJi(); return; }
    if (a.id === 'jinting') { openJoss(); return; }
    if (a.id === 'banquet') { showStall('bz'); return; }
    if (a.id === 'xiaoren') { showStall('xr'); return; }
    if (a.id === 'shoujing') { showStall('sj'); return; }
    if (a.id === 'fahui') { showStall('fh'); return; }
    if (a.id === 'backyard') { showStall('jx'); return; }
    if (a.id === 'jieqian') { showStall('jq'); return; }
    if (a.id === 'pond') { showStall('fs'); return; }
    if (a.id === 'xitai') { showStall('xi'); return; }
    if (a.id === 'yeshi') { showStall('ys'); return; }
    const PLACE = { study: 'zx', sleep: 'xd', board: 'rj', gate: 'sm', wash: 'wa' };
    if (PLACE[a.id]) { showStall(PLACE[a.id]); return; }
    if (a.id === 'wings') { pickHall(); return; }
    if (a.id === 'shop') { shop.openShop(); return; }
    if (a.id === 'donate') { openDonate({ openSheet, sfx }); return; }
    sfx.knock();
    say(`${a.info}這一區還在興建中。想拜拜可以點<b>兩廂專科殿堂</b>，十四位神明的殿都開了；廟埕的流水席辦桌、青衣阿嬤收驚、鵝頸橋打小人，還有後院的靜心閣、許願放生池、山門外的廟口夜市也開張了。`);
  });
}

// 兩廂專科殿堂：一次列出所有殿，點了就進去
function pickHall() {
  sfx.knock();
  const body = openSheet('兩廂專科殿堂', `<p style="margin:0 0 8px;color:#7A5A48;font-size:13px">想拜哪一位？點了就進殿。</p><div class="hall-pick">`
    + Object.entries(HALLS).map(([id, H]) => `<button type="button" data-pick="${id}"${id === state.home ? ' class="on"' : ''}><img src="${H.face}" alt=""><span>${H.god}</span><small>${H.name}</small></button>`).join('')
    + SOON.map(([name, face]) => `<button type="button" class="soon" disabled><img src="${face}" alt=""><span>${name}</span><small>籌備中</small></button>`).join('')
    + '</div>');
  body.querySelector('.hall-pick').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]'); if (!b) return;
    closeSheet(); SHOW[b.dataset.pick]();
  });
}

/* ---------- 今日參拜路線：像真的去廟裡，一殿一殿拜，最後到金亭化金紙 ---------- */
const ROUTE = [
  { id: 'main', name: '正殿', area: 'hall', how: '上香' },
  { id: 'cai', name: '財神閣', area: 'caishen', how: '上香' },
  { id: 'yue', name: '月老閣', area: 'yuelao', how: '上香' },
  { id: 'tudi', name: '福德祠', area: '', how: '上香' },
  { id: 'joss', name: '金亭', area: 'jinting', how: '化金紙' },
];
const routeDay = () => (!!L && (L.day === 1 || L.day === 15)) || !!fest || festive; // 初一、十五、節日才走全廟巡禮
function route() {
  if (!state.route || state.route.date !== dayKey()) state.route = { date: dayKey(), done: [], bonus: false };
  return state.route;
}
function paintRoute() {
  const r = route(), next = ROUTE.find((x) => !r.done.includes(x.id));
  $('#routeBar').innerHTML = `<span class="route-h">今日參拜</span>${ROUTE.map((x, i) => `<button type="button" class="route-step${r.done.includes(x.id) ? ' done' : ''}${x === next ? ' next' : ''}" data-step="${x.id}" aria-label="${x.name}${r.done.includes(x.id) ? '，已完成' : ''}"><b>${r.done.includes(x.id) ? '✓' : i + 1}</b>${x.name}</button>`).join('')}`;
  document.querySelectorAll('.area').forEach((el) => { const st = ROUTE.find((x) => x.area === el.dataset.area); el.classList.toggle('done', !!st && r.done.includes(st.id)); });
}
function routeDone(id) {
  if (!routeDay()) return;
  const r = route();
  if (r.done.includes(id)) return;
  r.done.push(id); save(); paintRoute();
  if (r.bonus || !ROUTE.every((x) => r.done.includes(x.id))) return;
  r.bonus = true; state.fish += 3; save(); updateFish();
  setTimeout(() => {
    sfx.chime(); sfx.buzz([20, 60, 20, 60, 40]);
    say('今日巡禮<b>圓滿</b>！正殿、財神、月老、土地公都拜過，金紙也化了。虎爺叼來開運小魚乾 ×3。下次初一、十五再來走一趟吧。', 'cat');
    if (!$('#sceneWrap').hidden) burst('spark', 182, 300, REDUCED_MOTION ? 6 : 30);
  }, 1600);
}
function openStep(id) {
  const st = ROUTE.find((x) => x.id === id);
  if (SHOW[id]) SHOW[id](); else openJoss();
  return st;
}

function showMap() {
  if (tool.kind) unequip(); endOffer(0); camera(FULL, 0); SUB[hall]?.leave?.();
  $('#sceneWrap').hidden = true; $('#bar').hidden = true; $('#caiBar').hidden = true; $('#yueBar').hidden = true; $('#tudiBar').hidden = true; $('#wenBar').hidden = true; $('#jiBar').hidden = true; $('#sanBar').hidden = true; $('#gyBar').hidden = true; $('#ggBar').hidden = true; $('#zsBar').hidden = true; $('#tsBar').hidden = true; $('#muBar').hidden = true; $('#mlBar').hidden = true; leaveStall(); $('#jgHost').hidden = true; jg.reset(); $('#tgBar').hidden = true; $('#mapView').hidden = false;
  $('#btnMap').hidden = true; $('#routeBar').hidden = !routeDay(); paintRoute(); paintRite();
  const r = route(), next = ROUTE.find((x) => !r.done.includes(x.id));
  const fn = fahuiNews(state, dayKey()); document.querySelector('.area[data-area="fahui"]')?.classList.toggle('due', fn.due);
  if (!routeDay()) { say(fn.line || '點<b>紅色標籤</b>就能進去逛。初一、十五和節日有<b>全廟巡禮</b>。'); return; }
  say(!r.done.length ? '今天有<b>全廟巡禮</b>！照下面的路線一站一站拜，走完有加碼。'
    : next ? `已拜 ${r.done.length} 站，下一站：<b>${next.name}</b>（${next.how}）。`
    : '今天的巡禮都走完了，圓滿！');
}

function switchHall(h) {
  if (tool.kind) unequip(); endOffer(0); camera(FULL, 0); SUB[hall]?.leave?.();
  hall = h;
  const r = rite(h); // 今天這殿點過的蠟燭、上過的香（有存檔，重新整理也還在）
  const st = { lit: { L: r.L, R: r.R }, sLit: r.L && r.R, until: r.until };
  lit = st.lit; session.lit = st.sLit; session.incenseUntil = st.until;
  const H = HALLS[h], dy = H.base - 536;
  BURNER = [182, 356 + H.burnerDy];
  $('#hallBg').setAttribute('href', hallImg());
  $('#hallBg').setAttribute('transform', bgTransform(H));
  for (const id of ['#halo', '#deity']) document.querySelector(id)?.setAttribute('transform', bgTransform(H));
  for (const id of ['mainOnlyA', 'mainOnlyB', 'mainOnlyC']) S(id).style.display = h === 'main' ? '' : 'none';
  S('avatarG').setAttribute('transform', `translate(0 ${dy})`);
  S('burnerG').setAttribute('transform', `translate(0 ${H.burnerDy})`);
  paintShrine(); $('#basketBtn').hidden = false;
  for (const k of ['L', 'R']) { S('flame' + k).setAttribute('opacity', lit[k] ? '1' : '0'); if (!lit[k]) S('glow' + k).setAttribute('opacity', '0'); }
  if (lit.L || lit.R) startFlicker();
  if (session.incenseUntil > Date.now()) runIncense(); else { incenseRun++; S('incense').style.display = 'none'; }
  $('#mapView').hidden = true; $('#sceneWrap').hidden = false; $('#btnMap').hidden = false; $('#routeBar').hidden = true;
  $('#bar').hidden = h !== 'main';
  for (const k of ['A', 'B']) S('jiao' + k).setAttribute('opacity', '0');
  for (const k of ['cai', 'yue', 'tudi', 'wen', 'ji', 'san', 'gy', 'gg', 'zs', 'ts', 'mu', 'ml', 'tg']) { $(`#${k}Host`).hidden = k !== h; $(`#${k}Bar`).hidden = k !== h; }
  leaveStall(); $('#sceneHost').hidden = false; $('#jgHost').hidden = h !== 'ts'; jg.reset();
  sfx.bowl();
  state.home = h; state.recentHalls = [h, ...(state.recentHalls || []).filter((x) => x !== h)].slice(0, 6); save();
  $('#godBar').hidden = false; paintGods();
  markNext();
  npc?.paint(h);
  if (daily) {
    if (h === 'main' && state.offer?.date === dayKey() && state.offer.items.length && daily.chance(0.1)) daily.qiyu('tigersnack', catHappy);
    else if (switchHall.n++ && daily.chance(0.03)) daily.qiyu('kitten', kittenRun);
  }
}
switchHall.n = 0;
function kittenRun() {
  const k = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  k.setAttribute('href', S('catEyesOpen').getAttribute('href'));
  k.setAttribute('width', 46); k.setAttribute('height', 56); k.setAttribute('x', -23); k.setAttribute('y', 560 + Math.min(26, HALLS[hall].base - 536));
  k.setAttribute('class', 'kitten-run');
  svg.appendChild(k); setTimeout(() => k.remove(), 3000);
}
// 神明列：可以左右滑。已開放的殿在前面，其他是「籌備中」
const SOON = [
];
// 神明列：預設只放「今日三尊」（現在這殿、今天過生日的神明、最近拜過的），右邊「全部神明」展開 14 位；展開過就記住
const FEST_GOD = [['媽祖', 'main'], ['土地公', 'tudi'], ['濟公', 'ji'], ['文昌', 'wen'], ['三太子', 'san'], ['觀音', 'gy'], ['註生', 'zs'], ['關聖', 'gg'], ['瑤池', 'mu'], ['趙公明', 'cai'], ['財神', 'cai']];
function todayGods() {
  const fg = fest ? FEST_GOD.filter(([k]) => fest[3].includes(k)).map(([, id]) => id) : [];
  const ids = [hall, ...fg, ...(state.recentHalls || []), 'main', 'cai', 'yue'].filter((id) => HALLS[id]);
  const keep = new Set([...new Set(ids)].slice(0, 3));
  return Object.keys(HALLS).filter((id) => keep.has(id)); // 照固定順序排，換殿時頭像不會跳來跳去
}
function paintGods() {
  const bar = $('#godBar'), open = !!state.godsOpen;
  const pick = open ? Object.keys(HALLS) : todayGods();
  const n = Object.keys(HALLS).length;
  bar.classList.toggle('compact', !open);
  bar.innerHTML = pick.map((id) => { const H = HALLS[id], x = daily?.xh(id); return `<button type="button" class="god${id === hall && !stall ? ' on' : ''}" data-god="${id}" role="tab" aria-selected="${id === hall}" style="--xh:${x ? x.pct.toFixed(3) : 0}">${x?.lv ? `<i class="xh-lv">${x.lv}</i>` : ''}<img src="${H.face}" alt=""><span>${H.god}</span></button>`; }).join('')
    + SOON.map(([name, face], i) => `<button type="button" class="god soon" data-soon="${i}" aria-label="${name}（籌備中）"><img src="${face}" alt=""><span>${name}</span></button>`).join('')
    + `<button type="button" class="god more" data-more="1" aria-expanded="${open}" aria-label="${open ? '收起，只看今日三尊' : `全部神明（${n} 位）`}"><i aria-hidden="true">${open ? '‹' : n}</i><span>${open ? '收起' : '全部神明'}</span></button>`;
  // 廟埕攤位（辦桌、收驚、打小人）不放神明列，從地圖走過去
  const on = bar.querySelector('.god.on');
  if (on && open) bar.scrollLeft = Math.max(0, on.offsetLeft - 12);
}
$('#godBar').addEventListener('click', (e) => {
  if (e.target.closest('[data-more]')) { state.godsOpen = !state.godsOpen; save(); sfx.knock(); paintGods(); if (!state.godsOpen) $('#godBar').scrollLeft = 0; return; }
  const s = e.target.closest('[data-soon]');
  if (s) { const [name, , text] = SOON[+s.dataset.soon]; sfx.knock(); say(`${text}。${name}的殿正在準備中，敬請期待。`); return; }
  const st = e.target.closest('[data-stall]'); if (st) { showStall(st.dataset.stall); return; }
  const b = e.target.closest('[data-god]'); if (!b) return;
  if (b.dataset.god === hall && !stall) return;
  SHOW[b.dataset.god]();
});
// 電腦上用滑鼠滾輪也能左右捲
$('#godBar').addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  e.preventDefault(); $('#godBar').scrollLeft += e.deltaY;
}, { passive: false });
function showHall() { switchHall('main'); greet(); }
function showYue() { switchHall('yue'); yue.enter(charById(state.char)); }
function showCai() { switchHall('cai'); cai.enter(charById(state.char)); }
function showTudi() { switchHall('tudi'); tudi.enter(); }
function showWen() { switchHall('wen'); wen.enter(); }
function showJi() { switchHall('ji'); ji.enter(); }
function showSan() { switchHall('san'); san.enter(); }
function showGy() { switchHall('gy'); gy.enter(); }
function showGg() { switchHall('gg'); gg.enter(); }
function showZs() { switchHall('zs'); zs.enter(); }
function showTs() { switchHall('ts'); ts.enter(); }
function showMu() { switchHall('mu'); mu.enter(); }
function showMl() { switchHall('ml'); ml.enter(); }
function showTg() { switchHall('tg'); tg.enter(); }
const SHOW = { main: showHall, cai: showCai, yue: showYue, tudi: showTudi, wen: showWen, ji: showJi, san: showSan, gy: showGy, gg: showGg, zs: showZs, ts: showTs, mu: showMu, ml: showMl, tg: showTg };
$('#btnMap').addEventListener('click', showMap);
$('#routeBar').addEventListener('click', (e) => { const b = e.target.closest('[data-step]'); if (b) openStep(b.dataset.step); });
const cai = initCaishen({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, lunar: () => L });
const yue = initYuelao({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, chars: CHARS, me: () => charById(state.char) });
const tudi = initTudigong({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam });
const wen = initWenchang({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam });
const ji = initJigong({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam });
const san = initSantaizi({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam });
const gy = initGuanyin({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam });
const gg = initGuangong({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam });
const zs = initZhusheng({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam });
const ts = initTaisui({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam });
const mu = initMuniang({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam });
const ml = initMile({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam });
const addFish = (n) => { state.fish += n; save(); updateFish(); };
const me = () => charById(state.char);
const xapi = { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, addFish, me, chars: CHARS, lunar, halls: HALLS };
const amulet = initAmulet({ ...xapi, svg });
const jg = initJigai(xapi);
// 廟埕攤位：不是神明殿，是一整張自己的場景，蓋在正殿上面（神明列最後面、地圖上都進得去）
const ICON = {
  bz: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="15" rx="10" ry="4.5" fill="#E8402A"/><path d="M2 15v3c0 2 4.5 4 10 4s10-2 10-4v-3" fill="#B82A1E"/><path d="M6 13c0-4 2.6-6 6-6s6 2 6 6z" fill="#F7F4EE"/><path d="M9 7l1-4M14 7l1-4" stroke="#C8783E" stroke-width="1.4" stroke-linecap="round"/></svg>',
  xr: '<svg viewBox="0 0 24 24"><ellipse cx="9" cy="12" rx="5" ry="9" fill="#3E6FD8" transform="rotate(-30 9 12)"/><path d="M5 9c3 2 6 1 8-1" stroke="#FFF" stroke-width="2.4" fill="none" transform="rotate(-30 9 12)"/><rect x="13" y="13" width="9" height="9" rx="1" fill="#FFF6E2" stroke="#C8302A"/><circle cx="17.5" cy="16" r="1.4" fill="none" stroke="#3B1F17"/><path d="M17.5 17.4v3M16 18.5h3" stroke="#3B1F17"/></svg>',
  sj: '<svg viewBox="0 0 24 24"><path d="M8 21l-1-12M12 21V8M16 21l1-12" stroke="#B0603A" stroke-width="1.6"/><circle cx="7" cy="8.6" r="1.4" fill="#FF7A3A"/><circle cx="12" cy="7.6" r="1.4" fill="#FF7A3A"/><circle cx="17" cy="8.6" r="1.4" fill="#FF7A3A"/><path d="M5 6c2-3 4-1 6-3M12 5c2-2 5 0 7-3" stroke="#BFE6FF" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>',
};
const STALLS = {
  bz: { name: '流水席辦桌', short: '辦桌', icon: ICON.bz, mod: initBanquet(xapi) },
  sj: { name: '青衣阿嬤收驚', short: '收驚', icon: ICON.sj, mod: initShoujing(xapi) },
  xr: { name: '鵝頸橋打小人', short: '打小人', icon: ICON.xr, mod: initXiaoren(xapi) },
  fh: { name: '法會壇', short: '法會', icon: '', mod: initFahui(xapi) },
  jx: { name: '後院靜心閣', short: '靜心閣', mod: initJingxin(xapi) },
  jq: { name: '廟公解籤處', short: '解籤', mod: initJieqian({ ...xapi, halls: HALLS, goDraw: (h) => { SHOW[h](); setTimeout(openDraw, 500); } }) },
  fs: { name: '許願放生池', short: '放生池', mod: initPond(xapi) },
  xi: { name: '酬神戲台', short: '戲台', mod: initXitai(xapi) },
  ys: { name: '廟口夜市', short: '夜市', icon: '', mod: initNightMarket({ ...xapi, godName: (h) => HALLS[h]?.god }) },
  zx: { name: '伴讀自習室', short: '自習室', mod: initStudy(xapi) },
  xd: { name: '睡前熄燈室', short: '熄燈室', mod: initSleep(xapi) },
  rj: { name: '媽祖遶境看板', short: '遶境看板', mod: initBoard(xapi) },
  sm: { name: '朱紅牌樓山門', short: '山門', mod: initGate({ ...xapi, goHall: () => SHOW.main() }) },
  wa: { name: '淨身石槽', short: '淨身', mod: initWash(xapi) },
};
let stall = null;
function leaveStall() {
  if (stall) STALLS[stall].mod.leave();
  stall = null;
  for (const k of Object.keys(STALLS)) { $(`#${k}Host`).hidden = true; $(`#${k}Bar`).hidden = true; }
}
function showStall(k) {
  if (tool.kind) unequip(); endOffer(0); camera(FULL, 0);
  if (stall && stall !== k) STALLS[stall].mod.leave();
  stall = k;
  $('#bar').hidden = true;
  for (const h of ['cai', 'yue', 'tudi', 'wen', 'ji', 'san', 'gy', 'gg', 'zs', 'ts', 'mu', 'ml', 'tg']) { $(`#${h}Host`).hidden = true; $(`#${h}Bar`).hidden = true; }
  $('#jgHost').hidden = true; jg.reset();
  for (const s of Object.keys(STALLS)) { $(`#${s}Host`).hidden = s !== k; $(`#${s}Bar`).hidden = s !== k; }
  $('#sceneHost').hidden = true; $('#basketBtn').hidden = true;
  $('#mapView').hidden = true; $('#sceneWrap').hidden = false; $('#btnMap').hidden = false; $('#routeBar').hidden = true;
  sfx.bowl(); paintGods(); paintRite();
  $('#godBar').hidden = true; // 攤位、夜市不能參拜，神明列收起來（回神明殿從「逛廟」）
  STALLS[k].mod.enter();
  daily?.hit('stall', k);
}
const shop = initShop({ state, save, openSheet, closeSheet, say, sfx, esc, hall: () => hall, godName: (h) => HALLS[h]?.god, onChange: () => { paintBasket(); if (offerUI) renderTray(); } });
paintBasket();
$('#btnFu').addEventListener('click', () => { if (offerUI) endOffer(0); shop.openShop(); });
$('#basketBtn').addEventListener('click', () => act('offer'));
const tg = initTiangong({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam });
const festMod = initFest({ $, state, save, say, sfx, openSheet, closeSheet, esc, dayKey, updateFish, chars: { byId: charById, me: () => charById(state.char) }, goHall: (h) => (SHOW[h] || showHall)() });
SUB.cai = cai; SUB.yue = yue; SUB.tudi = tudi; SUB.wen = wen; SUB.ji = ji; SUB.san = san; SUB.gy = gy; SUB.gg = gg; SUB.zs = zs; SUB.ts = ts; SUB.mu = mu; SUB.ml = ml; SUB.tg = tg;
buildMap();
// 神明生日：地圖上的戲台標籤改成「今日開演」
{ const bd = STALLS.xi.mod.birthdayToday(); const el = document.querySelector('[data-area="xitai"]'); if (bd.length && el) { el.textContent = '酬神戲台・今日開演'; el.classList.add('live'); } }

// 每天回來的理由：每日輕任務、奇遇、香火（daily.js）；殿裡的其他香客（npc.js）
guide = initGuide({ wrap: $('#sceneWrap'), state, save, sfx });
daily = initDaily({ $, state, save, sfx, wallet, halls: HALLS, stalls: STALLS, qianName: (h) => (h === 'main' ? '心安籤' : SUB[h].qianName), openSheet, dayKey, esc, burst, lunar });
daily.chip.addEventListener('click', () => {
  daily.open((name) => { // 任務卡的「前往」：直接帶到那個動作
    closeSheet();
    if (stall || (name === 'tiger' && hall !== 'main')) (name === 'tiger' ? showHall : SHOW[hall])();
    setTimeout(() => act(name), stall ? 400 : 60);
  });
  // 收起來的參拜流程提示，可以在這裡再打開
  if (state.guide?.off) {
    $('#sheetBody').insertAdjacentHTML('beforeend', '<button type="button" class="btn ghost" id="riteOn">重新顯示參拜流程提示</button>');
    $('#riteOn').addEventListener('click', () => { guide.reset(); closeSheet(); paintRite(); say('參拜流程提示打開了：點燭 → 上香 → 抽籤 → 擲筊確認，畫面上方會告訴你在第幾步。'); });
  }
});
initToday({ $, wrap: $('#sceneWrap'), openSheet, closeSheet, sfx });
npc = initNpc({ svg, chars: CHARS, me: () => charById(state.char), halls: HALLS, dayKey, sfx, hit: () => {
  daily.hit('npc');
  state.npcTalk = (state.npcTalk || 0) + 1; save();
  if (state.npcTalk === 10) daily.qiyu('friend');
} });
if (TEST) initTestPanel({ openSheet, closeSheet, festivals: FESTIVALS, lunarOf, lunarText: (d) => lunar(d)?.text, deityFests: FESTS, festMod, saveKey: KEY, realKey: REAL_KEY });
// 打開就直接進上次拜的那位神明；地圖是「逛逛全廟」
SHOW[HALLS[state.home] ? state.home : 'main']();
// 靜態首屏（index.html 的 #boot）淡出，換成真的殿
{ const boot = document.getElementById('boot'); if (boot) { requestAnimationFrame(() => boot.classList.add('gone')); setTimeout(() => boot.remove(), 600); } }

// PWA：只在正式網站（非內嵌預覽）註冊離線快取
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.top === window.self) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// 法會壇：法會報名＋每天回來拜懺（水懺、梁皇寶懺）＋禮斗法會（安斗、點斗燈、添油、拜北斗九皇）。
// 照廟裡的做法：先到報名處登記名字——活著的家人寫「消災祿位」（紅牌），過世的親人寫「超薦蓮位」（黃牌）；
// 法會那幾天每天到壇前跟著誦一段，一字敲一下木魚；全部拜完，功德迴向給牌位上的人，拿到「圓滿疏文」。
// 廟裡的法會照農曆固定日子辦（共修，壇前會有其他信眾一起拜），其他時候也可以自己發願開始（自修）。
// 報名資料：state.fahui = { cur, reg: { [法會id]: { names:[{name, kind:'xz'|'cj'}], mode:'gx'|'zx'|'wait', joined, segs, last, lamp } }, done:[…] }
// 其他模組要加一場法會：import { FAHUI } from './fahui.js' 再 push 一筆同樣格式的設定（在 initFahui 之前）。
// 場景 360 × 645，SVG 裡的 id 都加 fh 前綴。
import { reduce, sleep, tween, pick } from './stall.js';
import { makeCarrier } from './carry.js';
import { muyuSVG, strikeMuyu, makeChant, MUYU_TOP } from './muyu.js';
import { lunarOf } from './fest/core.js';
import lighterUrl from './assets/lighter.webp';

// 美術：有 Gemini 圖就用圖（src/assets/fh/*.webp），沒有先用向量畫
const ART = import.meta.glob('./assets/fh/*.webp', { eager: true, import: 'default' });
const art = (k) => ART[`./assets/fh/${k}.webp`];
// 福氣幣（供品店那邊做的共用錢包）：有就用，沒有就略過
const WALLET = import.meta.glob('./wallet.js', { eager: true });
const wallet = WALLET['./wallet.js']?.wallet;

/* ---------- 誦唸的內容 ----------
   遊戲裡每天誦的是佛號加一句簡短的祈願（代表當天的功課），不是懺本原文。 */
const V = {
  shijia: { t: '稱念佛號', s: '南無本師釋迦牟尼佛' },
  guanyin: { t: '稱念聖號', s: '南無大悲觀世音菩薩' },
  amituo: { t: '稱念佛號', s: '南無阿彌陀佛' },
  chanhui: { t: '懺悔發願', s: '過去種種不善，今日誠心懺悔，從今改過向善。' },
  jingxin: { t: '祈願', s: '願心中煩惱，如水洗淨，身心安樂。' },
  jiaren: { t: '祈願', s: '願家人平安健康，所求順遂。' },
  zuxian: { t: '祈願', s: '願歷代祖先，離苦得樂，往生善處。' },
  huixiang: { t: '迴向', s: '願此功德，迴向牌位上的每一位，在世消災延壽，往生離苦得樂。' },
};
// 北斗九皇（七星＋左輔右弼）：禮斗九天，每天禮拜一位星君，天上那顆星亮起來
const STARS = [
  ['天樞', '貪狼'], ['天璇', '巨門'], ['天璣', '祿存'], ['天權', '文曲'], ['玉衡', '廉貞'],
  ['開陽', '武曲'], ['搖光', '破軍'], ['洞明', '左輔'], ['隱元', '右弼'],
];
const NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const starPage = (i) => ({ t: `禮拜北斗第${NUM[i]}星君`, s: `北斗第${NUM[i]}，${STARS[i][0]}宮${STARS[i][1]}星君，照臨本命，消災解厄，延壽平安。`, star: i });
const doudengPage = { t: '斗燈祈願', s: '南斗注生，北斗解厄，斗燈長明，元辰光彩。' };

// 法會設定。windows = 廟裡辦法會的農曆日子 [月, 起日]，連辦 days 天
export const FAHUI = [
  {
    id: 'shuichan', name: '水懺法會', full: '慈悲三昧水懺法會', short: '水懺', days: 3, unit: '卷', units: ['上卷', '中卷', '下卷'],
    windows: [[2, 17], [6, 17], [9, 17]], when: '觀音菩薩聖誕、成道、出家日前三天（二月、六月、九月十七～十九）',
    about: '唐朝悟達國師膝上長了人面瘡，痛苦難當，遇到迦諾迦尊者用三昧法水洗瘡，才解開累世的冤結。國師因此寫下這部懺法，共上中下三卷，教人懺悔業障、化解冤親。',
    kinds: ['xz', 'cj'], buddhist: true,
    day: (i) => [[V.guanyin, V.chanhui], [V.shijia, V.jingxin], [V.guanyin, V.huixiang]][i],
  },
  {
    id: 'lianghuang', name: '梁皇寶懺', full: '梁皇寶懺法會', short: '梁皇', days: 7, unit: '天', units: null,
    windows: [[4, 8], [10, 8]], when: '浴佛節起七天（四月初八～十四）、下元節前七天（十月初八～十四）',
    about: '南朝梁武帝為了超度皇后郗氏，請寶誌禪師等高僧集經編成這部懺法，共十卷，被稱為「懺中之王」。廟裡通常分七天拜完，消災祈福、超薦祖先都可以登記。',
    kinds: ['xz', 'cj'], buddhist: true,
    day: (i) => [[V.shijia, V.chanhui], [V.guanyin, V.jiaren], [V.amituo, V.zuxian], [V.shijia, V.jingxin], [V.guanyin, V.chanhui], [V.amituo, V.jiaren], [V.shijia, V.huixiang]][i],
  },
  {
    id: 'lidou', name: '禮斗法會', full: '禮斗祈福法會', short: '禮斗', days: 9, unit: '天', units: null,
    windows: [[1, 7], [9, 1]], when: '新春禮斗（正月初七～十五）、九皇禮斗（九月初一～初九）',
    about: '道教的祈福法會。斗燈裡裝滿白米，插上七星劍、尺、秤、剪刀、鏡子和涼傘，中間點一盞油燈，代表你的本命元辰。法會期間斗燈不能熄，每天添油、禮拜北斗九皇星君，祈求消災解厄、延壽添福。',
    kinds: ['xz'], buddhist: false, lamp: true,
    day: (i) => [starPage(i), doudengPage],
  },
];
const KIND = { xz: ['消災祿位', '紅牌，寫還在世的家人朋友'], cj: ['超薦蓮位', '黃牌，寫已經過世的親人、祖先'] };
const MAX_NAMES = 8;

/* ---------- 日期 ---------- */
const dk = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
const LM = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const LD = (n) => n === 10 ? '初十' : n === 20 ? '二十' : n === 30 ? '三十' : (n < 10 ? '初' : n < 20 ? '十' : '廿') + '一二三四五六七八九'[(n % 10) - 1];
const md = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
const lunarCache = new Map();
const lun = (d) => { const k = dk(d); if (!lunarCache.has(k)) lunarCache.set(k, lunarOf(d)); return lunarCache.get(k); };
// 今天是不是在某場法會裡：回傳 { start, dayIdx }
export function windowAt(F, date = new Date()) {
  for (let i = 0; i < F.days; i++) {
    const d = addDays(date, -i), L = lun(d);
    if (L && !L.leap && F.windows.some(([m, a]) => L.mon === m && L.day === a)) return { start: d, dayIdx: i };
  }
  return null;
}
// 下一場（含今天正在辦的）
export function nextWindow(F, from = new Date()) {
  const now = windowAt(F, from); if (now) return { ...now, active: true };
  for (let i = 1; i < 420; i++) { const d = addDays(from, i), w = windowAt(F, d); if (w && w.dayIdx === 0) return { start: d, dayIdx: 0, active: false, inDays: i }; }
  return null;
}
const rangeText = (F, w) => { const end = addDays(w.start, F.days - 1), L = lun(w.start), L2 = lun(end); return `國曆 ${md(w.start)}～${md(end)}（農曆${L ? `${LM[L.mon - 1]}月${LD(L.day)}` : ''}～${L2 ? LD(L2.day) : ''}）`; };

/* ---------- 每天的頁面：一頁最多 3 行 × 13 字 ---------- */
const PUNCT = /[，。、；：！？]/;
function pagesOf(F, i) {
  const out = [];
  for (const v of F.day(i)) {
    // 太長就在句號切開
    const parts = v.s.length > 39 ? v.s.split(/(?<=。)/).filter(Boolean) : [v.s];
    let buf = '';
    for (const p of parts) { if ((buf + p).length > 39 && buf) { out.push({ ...v, s: buf }); buf = ''; } buf += p; }
    if (buf) out.push({ ...v, s: buf });
  }
  return out;
}
const taps = (s) => [...s].filter((c) => !PUNCT.test(c)).length;

/* ---------- 場景 ---------- */
const AV = { x: 128, base: 632, w: 132, h: 142 };
const MUYU = [276, 618], MUYU_S = .58;
const BOOK = { x: 52, y: 380, w: 256, h: 92 };
const ALTAR_Y = 330, LAMP_AT = [180, ALTAR_Y + 2], LAMP_REST = [44, 560], OIL_REST = [44, 560], LIGHTER_REST = [44, 590];
const WICK = [180, ALTAR_Y - 64];
const STAR_XY = [[112, 134], [136, 124], [160, 130], [180, 144], [206, 150], [234, 142], [258, 124], [222, 166], [196, 168]];

const lampSVG = () => art('doudeng')
  ? `<image href="${art('doudeng')}" x="-42" y="-92" width="84" height="96"/>`
  : `<ellipse cx="0" cy="2" rx="36" ry="6" fill="#1A0A08" opacity=".3"/>
    <path d="M-34 -40h68l-8 42h-52z" fill="#C8302A" stroke="#7A1A10" stroke-width="2"/>
    <path d="M-34 -40h68l-2 8h-64z" fill="#E0A440"/>
    <text x="0" y="-10" text-anchor="middle" font-size="20" font-weight="900" fill="#FFD86A" font-family="Noto Serif TC, serif">斗</text>
    <ellipse cx="0" cy="-40" rx="34" ry="6" fill="#F7EBD2"/>
    <path d="M-22 -40l-6 -46M-28 -86l-4 4M-28 -86l4 2" stroke="#C9CED6" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M24 -40v-40" stroke="#B88A4A" stroke-width="3"/><path d="M22 -74h4M22 -66h4M22 -58h4" stroke="#5A3A1A" stroke-width="1"/>
    <path d="M12 -40l2 -30M6 -68h16" stroke="#8A6A4A" stroke-width="1.6"/><path d="M6 -68l-3 8h6zM22 -68l-3 8h6z" fill="#E0A440"/>
    <circle cx="-12" cy="-58" r="7" fill="#E8EEF4" stroke="#B88A4A" stroke-width="1.6"/>
    <path d="M-6 -40l-4 -34M-16 -76q6 -10 12 0z" stroke="#7A1A10" stroke-width="1.4" fill="#E0544A"/>
    <path d="M30 -40l4 -12M34 -52l-6 -2M34 -52l2 6" stroke="#8A8E96" stroke-width="1.6"/>
    <path d="M-8 -44h16l-2 -12h-12z" fill="#E0A440" stroke="#8A5A1E"/>
    <path d="M0 -56v-6" stroke="#3B1F17" stroke-width="1.4"/>`;
const oilSVG = () => art('oil')
  ? `<image href="${art('oil')}" x="-24" y="-46" width="48" height="48"/>`
  : `<ellipse cx="0" cy="2" rx="18" ry="4" fill="#1A0A08" opacity=".3"/>
    <path d="M-14 0l-3 -24h34l-3 24z" fill="#F4EAD6" stroke="#B89A6A" stroke-width="1.4"/>
    <path d="M17 -22q10 -2 12 -10" stroke="#B89A6A" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="0" cy="-24" rx="17" ry="4" fill="#E8B83A"/>
    <path d="M-8 -12h16" stroke="#C8302A" stroke-width="2"/>`;

const svgOf = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="法會壇" class="stall-svg fh-svg" tabindex="-1">
  <defs>
    <linearGradient id="fhWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A1E14"/><stop offset=".72" stop-color="#7A2E1C"/><stop offset=".73" stop-color="#9A6A44"/><stop offset="1" stop-color="#6E4428"/></linearGradient>
    <radialGradient id="fhHalo"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".95"/><stop offset=".6" stop-color="#FFC860" stop-opacity=".35"/><stop offset="1" stop-color="#FFC860" stop-opacity="0"/></radialGradient>
    <radialGradient id="fhStarGlow"><stop offset="0" stop-color="#FFF4C0"/><stop offset=".4" stop-color="#FFD86A" stop-opacity=".7"/><stop offset="1" stop-color="#FFD86A" stop-opacity="0"/></radialGradient>
    <radialGradient id="fhShadow"><stop offset="0" stop-color="#2A0E06" stop-opacity=".5"/><stop offset="1" stop-color="#2A0E06" stop-opacity="0"/></radialGradient>
    <radialGradient id="fhFlame" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".5" stop-color="#FFB840"/><stop offset="1" stop-color="#FF6A20" stop-opacity="0"/></radialGradient>
  </defs>
  ${art('bg') ? `<image href="${art('bg')}" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>` : `
  <rect width="360" height="645" fill="url(#fhWall)"/>
  <rect x="0" y="0" width="22" height="470" fill="#B8322A"/><rect x="338" y="0" width="22" height="470" fill="#B8322A"/>
  <path d="M0 470h360" stroke="#3A160C" stroke-width="3"/>
  <g opacity=".22" stroke="#2A0E06">${Array.from({ length: 7 }, (_, i) => `<path d="M0 ${500 + i * 22}h360"/>`).join('')}</g>
  <g id="fhHangings">${[60, 120, 240, 300].map((x) => `<g transform="translate(${x} 80)"><path d="M0 0v12" stroke="#7A1A10"/><ellipse cx="0" cy="24" rx="10" ry="13" fill="#E8402A"/><path d="M-10 24h20" stroke="#FFD86A" stroke-width="1.2"/><path d="M0 37v8" stroke="#FFD86A" stroke-width="1.6"/></g>`).join('')}</g>`}
  <!-- 法會分頁 -->
  <g id="fhTabs"></g>
  <!-- 中間：佛號牌（水懺、梁皇）或斗姆元君＋北斗九皇（禮斗） -->
  <circle cx="180" cy="232" r="92" fill="url(#fhHalo)"/>
  <g id="fhBuddha">
    <path d="M150 312q30 -18 60 0q-30 12 -60 0z" fill="#F3A6B8"/><path d="M158 310q22 -26 44 0" fill="#F7C6D2" stroke="#E07A98" stroke-width="1"/>
    <rect x="160" y="150" width="40" height="156" rx="6" fill="#B8322A" stroke="#E0A440" stroke-width="3"/>
    <text id="fhPlaque" x="180" y="229" text-anchor="middle" class="fh-plaque" writing-mode="tb">南無本師釋迦牟尼佛</text>
  </g>
  <g id="fhDou" style="display:none">
    <path id="fhDipper" d="${STAR_XY.slice(0, 7).map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('')}" stroke="#FFE9A8" stroke-width="1" stroke-dasharray="2 3" fill="none" opacity=".5"/>
    <g id="fhStars">${STAR_XY.map(([x, y], i) => `<g class="fh-star" data-i="${i}" transform="translate(${x} ${y})"><circle r="11" fill="url(#fhStarGlow)" opacity="0" class="glow"/><path d="M0 -5l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#8A7A6A" class="core"/></g>`).join('')}</g>
    <rect x="160" y="178" width="40" height="84" rx="6" fill="#2A3E7A" stroke="#E0A440" stroke-width="3"/>
    <text x="180" y="220" text-anchor="middle" class="fh-plaque" writing-mode="tb">斗姆元君</text>
  </g>
  <!-- 牌位：左紅（消災祿位）右黃（超薦蓮位） -->
  <g id="fhBoardL" transform="translate(28 132)"><rect width="72" height="190" rx="6" fill="#C8302A" stroke="#E0A440" stroke-width="2.4"/><path d="M-4 0h80l-6 -10h-68z" fill="#E0A440"/>
    <text x="36" y="18" text-anchor="middle" class="fh-board-h" id="fhBoardLH">消災祿位</text><g id="fhNamesL" class="fh-names"></g></g>
  <g id="fhBoardR" transform="translate(260 132)"><rect width="72" height="190" rx="6" fill="#F2D27A" stroke="#B88A2A" stroke-width="2.4"/><path d="M-4 0h80l-6 -10h-68z" fill="#B88A2A"/>
    <text x="36" y="18" text-anchor="middle" class="fh-board-h dark">超薦蓮位</text><g id="fhNamesR" class="fh-names dark"></g></g>
  <!-- 供桌 -->
  <path d="M40 ${ALTAR_Y}h280l10 48h-300z" fill="#E8B83A"/><path d="M40 ${ALTAR_Y}h280v10h-280z" fill="#C8302A"/>
  <path d="M120 ${ALTAR_Y + 10}l-6 38M240 ${ALTAR_Y + 10}l6 38" stroke="#B88A2A" stroke-width="2"/>
  <g id="fhCandles">${[86, 274].map((x) => `<g transform="translate(${x} ${ALTAR_Y + 2})"><rect x="-5" y="-30" width="10" height="30" rx="2" fill="#E0402A"/><ellipse cx="0" cy="-36" rx="4" ry="7" fill="url(#fhFlame)" class="fh-flicker"/></g>`).join('')}</g>
  <g id="fhFlowers">${[120, 240].map((x) => `<g transform="translate(${x} ${ALTAR_Y + 2})"><path d="M-6 0h12l-2 -14h-8z" fill="#3E9E86"/><circle cx="-5" cy="-20" r="5" fill="#FFB0C0"/><circle cx="5" cy="-22" r="5" fill="#FFE08A"/><circle cx="0" cy="-28" r="5" fill="#FF8A9A"/></g>`).join('')}</g>
  <g id="fhBurner" transform="translate(180 ${ALTAR_Y + 4})"><path d="M-24 -4q0 -18 24 -18t24 18z" fill="#B8862A"/><rect x="-26" y="-6" width="52" height="6" rx="2" fill="#8A5A1E"/>
    <path d="M-6 -22l-2 -22M0 -22v-24M6 -22l2 -22" stroke="#B0603A" stroke-width="1.6"/><circle cx="-8" cy="-44" r="1.6" fill="#FF7A3A"/><circle cx="0" cy="-46" r="1.6" fill="#FF7A3A"/><circle cx="8" cy="-44" r="1.6" fill="#FF7A3A"/></g>
  <rect id="fhLampRing" x="${LAMP_AT[0] - 40}" y="${LAMP_AT[1] - 96}" width="80" height="100" rx="10" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <g id="fhLampSpot" style="display:none"><ellipse cx="${LAMP_AT[0]}" cy="${LAMP_AT[1]}" rx="36" ry="7" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3"/><text x="${LAMP_AT[0]}" y="${LAMP_AT[1] - 14}" text-anchor="middle" class="xr-tag">安斗處</text></g>
  <!-- 斗燈 -->
  <g id="fhLamp" class="stall-prop" role="button" tabindex="0" aria-label="斗燈，拿到供桌中間安斗" style="display:none">${lampSVG()}
    <g id="fhLampFire" style="display:none" transform="translate(0 -62)"><circle r="18" fill="url(#fhHalo)" opacity=".8"/><ellipse cx="0" cy="-6" rx="4.5" ry="9" fill="url(#fhFlame)" class="fh-flicker"/></g></g>
  <!-- 油壺、打火機 -->
  <g id="fhOil" class="stall-prop" role="button" tabindex="0" aria-label="油壺，拿到斗燈上添油" style="display:none">${oilSVG()}</g>
  <g id="fhLighter" class="stall-prop" role="button" tabindex="0" aria-label="打火機，拿到斗燈的燈芯點火" style="display:none"><image href="${lighterUrl}" x="-24" y="-48" width="48" height="48"/></g>
  <rect id="fhWickRing" x="${WICK[0] - 22}" y="${WICK[1] - 22}" width="44" height="44" rx="22" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <!-- 經本 -->
  <g id="fhBook">
    <path d="M${BOOK.x - 6} ${BOOK.y + BOOK.h + 6}l14 18h${BOOK.w - 16}l14 -18z" fill="#6A3A1E"/>
    <rect x="${BOOK.x}" y="${BOOK.y}" width="${BOOK.w}" height="${BOOK.h}" rx="4" fill="#FFF6E2" stroke="#C8A070" stroke-width="2"/>
    <path d="M${BOOK.x + BOOK.w / 2} ${BOOK.y}v${BOOK.h}" stroke="#E8D4B0" stroke-width="1.4"/>
    <text id="fhPageT" x="180" y="${BOOK.y - 6}" text-anchor="middle" class="xr-tag fh-page-t"></text>
    <g id="fhText"></g>
  </g>
  <text id="fhProg" x="246" y="506" text-anchor="middle" class="xr-tag"></text>
  <!-- 一起拜的信眾（共修期間） -->
  <g id="fhCrowd"></g>
  <!-- 你 -->
  <ellipse cx="${AV.x}" cy="${AV.base}" rx="56" ry="8" fill="url(#fhShadow)"/>
  <path d="M${AV.x - 46} ${AV.base + 2}q46 -16 92 0q-46 12 -92 0z" fill="#C8302A"/>
  <image id="fhMe" x="${AV.x - AV.w / 2}" y="${AV.base - AV.h}" width="${AV.w}" height="${AV.h}"/>
  <!-- 木魚 -->
  ${muyuSVG('fhMuyu', { x: MUYU[0], y: MUYU[1], s: MUYU_S })}
  <circle id="fhBeat" cx="${MUYU[0]}" cy="${MUYU[1] - 46 * MUYU_S}" r="40" fill="none" stroke="#FFE08A" stroke-width="2" opacity="0" pointer-events="none"/>
  <text id="fhTapHint" x="${MUYU[0] - 6}" y="528" text-anchor="middle" class="xr-tag" opacity="0">點下半部敲木魚</text>
  <rect id="fhZone" class="muyu-zone" x="0" y="480" width="360" height="165" fill="transparent" style="display:none"/>
</svg>`;

export function initFahui(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, addFish, me, chars } = api;
  const host = $('#fhHost');
  host.innerHTML = svgOf();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const fh = state.fahui || (state.fahui = {});
  fh.reg ||= {}; fh.done ||= []; fh.cur ||= 'lianghuang';
  if (!FAHUI.some((F) => F.id === fh.cur)) fh.cur = FAHUI[0].id;
  let phase = 'idle', run = 0, chant = null;
  const F = () => FAHUI.find((x) => x.id === fh.cur);
  const reg = (id = fh.cur) => fh.reg[id];

  /* ----- 畫面 ----- */
  function paintMe() {
    const c = me(); const w = AV.w * c.scale, h = AV.h * c.scale;
    const el = S('fhMe'); el.setAttribute('href', c.kneel);
    el.setAttribute('width', w); el.setAttribute('height', h); el.setAttribute('x', AV.x - w / 2); el.setAttribute('y', AV.base - h);
  }
  function paintTabs() {
    const n = FAHUI.length, gap = 6, w = Math.min(96, (330 - gap * (n - 1)) / n), x0 = 180 - (n * w + (n - 1) * gap) / 2;
    S('fhTabs').innerHTML = FAHUI.map((x, i) => {
      const on = x.id === fh.cur, r = fh.reg[x.id], wa = windowAt(x);
      return `<g class="fh-tab${on ? ' on' : ''}" data-fh="${x.id}" role="button" tabindex="0" aria-pressed="${on}" aria-label="${x.name}" transform="translate(${x0 + i * (w + gap)} 92)">
        <rect width="${w}" height="26" rx="13" fill="${on ? '#E0544A' : '#FFF4E0'}" stroke="${on ? '#FFD86A' : '#C8A070'}" stroke-width="1.6"/>
        <text x="${w / 2}" y="17.5" text-anchor="middle" class="fh-tab-t${on ? ' on' : ''}">${x.name}</text>
        ${wa || (r && r.last !== dayKey() && r.mode !== 'wait') ? `<circle cx="${w - 6}" cy="4" r="4.5" fill="${wa ? '#FFD86A' : '#3E9E86'}" stroke="#7A1A10" stroke-width="1"/>` : ''}
      </g>`;
    }).join('');
  }
  // 牌位上直書名字，一欄一個人
  function namesCol(list, dark) {
    if (!list.length) return `<text x="36" y="104" text-anchor="middle" class="fh-empty${dark ? ' dark' : ''}" writing-mode="tb">尚未登記</text>`;
    const n = Math.min(list.length, 4), cw = 64 / n;
    const shown = list.slice(0, 4);
    return shown.map((p, i) => {
      const x = 68 - cw * (i + .5), nm = p.name.slice(0, 6);
      const fs = Math.min(15, Math.floor(150 / Math.max(3, nm.length + 2)), cw - 2);
      return `<text x="${x.toFixed(1)}" y="30" text-anchor="start" writing-mode="tb" class="fh-name" font-size="${fs}">${esc(nm)}${p.kind === 'cj' ? '' : ''}</text>`;
    }).join('') + (list.length > 4 ? `<text x="36" y="184" text-anchor="middle" class="fh-more">等 ${list.length} 位</text>` : '');
  }
  function paintBoards() {
    const f = F(), r = reg(), list = r ? r.names : [];
    S('fhNamesL').innerHTML = namesCol(list.filter((p) => p.kind === 'xz'), false);
    S('fhNamesR').innerHTML = namesCol(list.filter((p) => p.kind === 'cj'), true);
    S('fhBoardR').style.display = f.kinds.includes('cj') ? '' : 'none';
    S('fhBoardLH').textContent = f.lamp ? '斗燈主' : '消災祿位';
    S('fhBuddha').style.display = f.buddhist ? '' : 'none';
    S('fhDou').style.display = f.lamp ? '' : 'none';
    S('fhBurner').style.display = f.lamp && r?.lamp?.placed ? 'none' : '';
    paintStars();
    paintLamp();
  }
  function paintStars() {
    const r = reg(), n = r && F().lamp ? r.segs || 0 : 0;
    svg.querySelectorAll('.fh-star').forEach((g) => {
      const on = +g.dataset.i < n;
      g.querySelector('.glow').setAttribute('opacity', on ? '1' : '0');
      g.querySelector('.core').setAttribute('fill', on ? '#FFF4C0' : '#8A7A6A');
    });
  }
  function lampState() { return reg()?.lamp || null; }
  function paintLamp() {
    const f = F(), L = lampState();
    const el = S('fhLamp');
    if (!f.lamp || !L || !L.placed) { el.style.display = 'none'; S('fhLampFire').style.display = 'none'; return; }
    el.style.display = ''; el.setAttribute('transform', `translate(${LAMP_AT[0]} ${LAMP_AT[1]})`);
    const fire = S('fhLampFire'); fire.style.display = L.lit ? '' : 'none';
    // 今天還沒添油：火變小
    fire.setAttribute('opacity', L.oil === dayKey() ? '1' : '.55');
  }
  function paintCrowd() {
    const f = F(), w = windowAt(f), r = reg();
    if (!w || !r || r.mode !== 'gx') { S('fhCrowd').innerHTML = ''; return; }
    const pool = chars.filter((c) => c.id !== state.char && c.kneel);
    const seed = [...dayKey()].reduce((a, c) => a + c.charCodeAt(0), 0);
    const picks = [0, 1, 2].map((i) => pool[(seed + i * 5) % pool.length]);
    const spots = [[44, 500, .42], [318, 500, .42], [250, 492, .36]];
    S('fhCrowd').innerHTML = picks.map((c, i) => { const [x, y, s] = spots[i], w = 132 * s * c.scale, h = 142 * s * c.scale; return `<image href="${c.kneel}" x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" opacity=".92"/>`; }).join('');
  }
  function paintBook(page, lit = 0) {
    const g = S('fhText');
    if (!page) {
      g.innerHTML = '';
      S('fhPageT').textContent = '';
      return;
    }
    S('fhPageT').textContent = page.t;
    const chs = [...page.s], cols = 13, cw = (BOOK.w - 24) / cols, rh = 26;
    let k = 0;
    g.innerHTML = chs.map((c, i) => {
      const x = BOOK.x + 12 + cw * (i % cols) + cw / 2, y = BOOK.y + 26 + rh * Math.floor(i / cols);
      const p = PUNCT.test(c), on = p ? k <= lit && k > 0 && k <= lit : k < lit;
      const cls = p ? 'fh-ch p' : `fh-ch${k < lit ? ' on' : k === lit ? ' next' : ''}`;
      if (!p) k++;
      return `<text x="${x.toFixed(1)}" y="${y}" text-anchor="middle" class="${cls}">${c}</text>`;
    }).join('');
  }
  function paintProg(extra = '') {
    const f = F(), r = reg();
    if (!r) { S('fhProg').textContent = `${f.name}・還沒報名`; return; }
    const n = r.segs || 0;
    S('fhProg').textContent = extra || `${f.name}・${r.mode === 'gx' ? '共修' : r.mode === 'wait' ? '等法會開始' : '自修'}・已完成 ${n}／${f.days} ${f.units ? '卷' : '天'}`;
  }
  function paintAll() { paintTabs(); paintBoards(); paintCrowd(); paintBook(null); paintProg(); }

  /* ----- 分頁切換 ----- */
  S('fhTabs').addEventListener('click', (e) => {
    const t = e.target.closest('[data-fh]'); if (!t || t.dataset.fh === fh.cur) return;
    if (phase !== 'idle') { say('先把今天這段誦完，再換別的法會。'); return; }
    fh.cur = t.dataset.fh; save(); sfx.knock(); paintAll(); intro();
  });
  S('fhTabs').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.target.closest('[data-fh]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });

  function statusLine(f) {
    const w = nextWindow(f);
    if (!w) return '';
    if (w.active) return `廟裡正在辦${f.name}，今天是第 ${w.dayIdx + 1} 天（${rangeText(f, w)}）。`;
    return `下一場${f.name}：${rangeText(f, w)}，還有 ${w.inDays} 天。`;
  }
  function intro() {
    const f = F(), r = reg();
    if (!r) { say(`<b>${f.full}</b>：${f.about.slice(0, 46)}……<br>${statusLine(f)}按「<b>報名</b>」寫上要祈福的名字。`); return; }
    if (r.mode === 'wait') {
      const w = nextWindow(f);
      if (w?.active) { r.mode = 'gx'; save(); } else { say(`你已經報名了${f.name}，名字都寫上牌位了。${statusLine(f)}到時候每天來拜一段；等不及的話也可以按「<b>今日功課</b>」先自己開始。`); return; }
    }
    if (r.last === dayKey()) { say(`今天的${f.short}功課做完了，已完成 ${r.segs}／${f.days}。明天再來誦下一段。`); return; }
    say(`${f.name}第 ${r.segs + 1} ${f.units ? '卷' : '天'}${f.units ? `（${f.units[r.segs]}）` : ''}。按「<b>今日功課</b>」${f.lamp ? (r.lamp?.placed ? '先幫斗燈添油，再' : '先安斗、點斗燈，再') : ''}跟著經本一字敲一下木魚。`);
  }

  /* ----- 報名 ----- */
  function openSignup() {
    if (phase !== 'idle') { say('先把今天這段誦完。'); return; }
    const f = F(), r = reg(), w = nextWindow(f);
    const draft = r ? r.names.map((p) => ({ ...p })) : [];
    let kind = f.kinds[0];
    const body = openSheet(`${f.name}報名`, `
      <p style="margin:0">${esc(f.about)}</p>
      <p class="hint" style="margin:6px 0 0">廟裡的日子：${f.when}。${w ? (w.active ? `<b>現在正在辦</b>，今天第 ${w.dayIdx + 1} 天。` : `下一場是${rangeText(f, w)}。`) : ''}</p>
      <div class="field" style="margin-top:10px"><span>寫上牌位的名字（最多 ${MAX_NAMES} 位）</span>
        <div class="fh-list" id="fhList"></div>
      </div>
      ${f.kinds.length > 1 ? `<div class="field"><span>登記在哪一塊牌位</span><div class="chips" id="fhKind">${f.kinds.map((k, i) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${i === 0}">${KIND[k][0]}</button>`).join('')}</div><span class="hint" id="fhKindHint">${KIND[f.kinds[0]][1]}</span></div>` : `<p class="hint" style="margin:0">斗燈一盞一位，寫上要點斗燈的人。</p>`}
      <div class="row" style="align-items:center"><input id="fhName" class="yue-wish" maxlength="6" placeholder="${f.kinds.length > 1 ? '名字，例如：王小明、王氏歷代祖先' : '名字'}" style="flex:1 1 140px">
        <button type="button" class="btn ghost" id="fhAdd" style="flex:0 0 auto">加上去</button></div>
      <div class="row"><button type="button" class="chip" id="fhAddMe">＋ 我自己（${esc(state.name !== '香客' ? state.name : '香客')}）</button></div>
      <div class="row" id="fhGo"></div>
      <p class="hint">遊戲裡每天誦的是${f.buddhist ? '佛號' : '星君聖號'}加一句簡短祈願，代表當天的功課；想參加真正的法會，可以到附近寺廟報名或依經本誦讀。</p>`);
    function paintList() {
      body.querySelector('#fhList').innerHTML = draft.length
        ? draft.map((p, i) => `<span class="fh-tag ${p.kind}">${esc(p.name)}<small>${KIND[p.kind][0].slice(0, 2)}</small><button type="button" data-del="${i}" aria-label="刪掉${esc(p.name)}">✕</button></span>`).join('')
        : '<span class="hint">還沒有名字</span>';
      const go = body.querySelector('#fhGo');
      if (r) go.innerHTML = `<button type="button" class="btn" data-go="save">更新牌位名字</button>`;
      else if (w?.active) go.innerHTML = `<button type="button" class="btn" data-go="gx">報名，今天就開始</button>`;
      else go.innerHTML = `<button type="button" class="btn" data-go="wait">報名，等廟裡法會（${w ? md(w.start) : ''}）</button><button type="button" class="btn ghost" data-go="zx">今天就自己發願開始</button>`;
    }
    paintList();
    const add = (name, k = kind) => {
      name = name.trim().slice(0, 6); if (!name) return;
      if (draft.length >= MAX_NAMES) { say(`一場法會最多寫 ${MAX_NAMES} 位。`); return; }
      if (draft.some((p) => p.name === name && p.kind === k)) return;
      draft.push({ name, kind: k }); sfx.pop(); paintList();
    };
    body.addEventListener('click', (e) => {
      const k = e.target.closest('[data-k]');
      if (k) { kind = k.dataset.k; body.querySelectorAll('[data-k]').forEach((x) => x.setAttribute('aria-pressed', String(x === k))); body.querySelector('#fhKindHint').textContent = KIND[kind][1]; return; }
      const d = e.target.closest('[data-del]'); if (d) { draft.splice(+d.dataset.del, 1); paintList(); return; }
      if (e.target.closest('#fhAdd')) { const i = body.querySelector('#fhName'); add(i.value); i.value = ''; i.focus(); return; }
      if (e.target.closest("#fhAddMe")) { add(state.name !== '香客' ? state.name : '香客', 'xz'); return; }
      const g = e.target.closest('[data-go]'); if (!g) return;
      const i = body.querySelector('#fhName'); if (i.value.trim()) add(i.value);
      if (!draft.length) { say('先寫上至少一個名字。'); return; }
      if (g.dataset.go === 'save') { r.names = draft; save(); closeSheet(); paintAll(); say('牌位上的名字更新好了。'); return; }
      fh.reg[f.id] = { names: draft, mode: g.dataset.go, joined: dayKey(), segs: 0, last: '', lamp: f.lamp ? { placed: false, lit: false, oil: '' } : null };
      save(); closeSheet(); paintAll(); sfx.chime();
      burst('spark', 64, 230, reduce ? 3 : 12); if (draft.some((p) => p.kind === 'cj')) burst('spark', 296, 230, reduce ? 3 : 12);
      const nm = draft.map((p) => esc(p.name)).join('、');
      if (g.dataset.go === 'wait') say(`報名好了！<b>${nm}</b> 的名字寫上牌位了。${statusLine(f)}法會那幾天每天來拜一段，記得回來喔。`);
      else say(`報名好了，<b>${nm}</b> 的名字寫上牌位了。${g.dataset.go === 'gx' ? '今天就跟大家一起共修。' : '自己發願拜也很好，每天來一段就可以。'}按「<b>今日功課</b>」開始。`);
    });
    body.querySelector('#fhName').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(e.target.value); e.target.value = ''; } });
  }

  /* ----- 今日功課 ----- */
  function today() {
    if (phase !== 'idle') { say(phase === 'chant' ? '正在誦經，點畫面下半部敲木魚，一字一下。' : '照提示做下一步。'); return; }
    const f = F(), r = reg();
    if (!r) { openSignup(); return; }
    if (r.last === dayKey()) { say(`今天的${f.short}功課做完了（${r.segs}／${f.days}）。明天再來，功德一天一天累積。`); return; }
    if (r.mode === 'wait') {
      const w = nextWindow(f);
      if (w?.active) r.mode = 'gx'; else r.mode = 'zx';
      save(); paintProg();
    }
    if (f.lamp) startLamp(); else startChant();
  }

  // 禮斗：第一天安斗＋點燈，之後每天添油
  const lamp = makeCarrier({
    svg, el: S('fhLamp'), sfx, cam, ring: S('fhLampRing'), lift: 70, radius: 40,
    rest: () => LAMP_REST, target: () => LAMP_AT, zoom: () => [150, 420, 300],
    onTap: () => say('按住<b>斗燈</b>拿起來，放到供桌中間發光的「安斗處」。'),
    onDrop() {
      const L = lampState(); L.placed = true; save();
      sfx.knock(); sfx.buzz([12]); burst('spark', LAMP_AT[0], LAMP_AT[1] - 40, reduce ? 3 : 14);
      S('fhLampSpot').style.display = 'none'; S('fhBurner').style.display = 'none';
      phase = 'light'; S('fhLighter').style.display = ''; lighter.home();
      cam?.reset(150);
      say('斗安好了。現在按住左下角的<b>打火機</b>，移到斗燈中間的<b>燈芯</b>點火。');
    },
  });
  const lighter = makeCarrier({
    svg, el: S('fhLighter'), sfx, cam, ring: S('fhWickRing'), lift: 80, radius: 30,
    rest: () => LIGHTER_REST, target: () => [WICK[0], WICK[1] + 24], zoom: () => [180, 360, 240],
    onTap: () => say('按住<b>打火機</b>，拿到斗燈的燈芯上。'),
    onDrop() {
      const L = lampState(); L.lit = true; L.oil = dayKey(); save();
      sfx.pop(); sfx.chime(); burst('spark', WICK[0], WICK[1], reduce ? 4 : 18);
      S('fhLighter').style.display = 'none'; paintLamp();
      say('斗燈點亮了，這盞燈代表本命元辰，法會期間每天來添油，讓它一直亮著。');
      setTimeout(() => { if (phase === 'light') startChant(); }, 1400);
    },
  });
  const oil = makeCarrier({
    svg, el: S('fhOil'), sfx, cam, ring: S('fhLampRing'), lift: 70, radius: 40,
    rest: () => OIL_REST, target: () => [LAMP_AT[0] + 2, LAMP_AT[1] - 50], zoom: () => [170, 380, 260],
    onTap: () => say('按住<b>油壺</b>，拿到斗燈上面添油。'),
    async onDrop() {
      const L = lampState(); L.oil = dayKey(); L.lit = true; save();
      const r0 = run;
      for (let i = 0; i < 8; i++) { emit('drop', LAMP_AT[0] + 12, LAMP_AT[1] - 52); await sleep(60); }
      if (r0 !== run) return;
      S('fhOil').style.display = 'none'; paintLamp(); sfx.chime();
      burst('spark', WICK[0], WICK[1], reduce ? 3 : 12);
      say('油添好了，斗燈又亮起來。');
      setTimeout(() => { if (phase === 'oil') startChant(); }, 1200);
    },
  });
  function startLamp() {
    const L = lampState();
    run++;
    if (!L.placed) {
      phase = 'place';
      S('fhLamp').style.display = ''; lamp.home(); S('fhLampSpot').style.display = '';
      say('禮斗第一天要<b>安斗</b>：按住左邊的<b>斗燈</b>（裝滿白米，插著七星劍、尺、秤、剪刀、鏡子、涼傘），放到供桌中間的安斗處。');
      return;
    }
    if (!L.lit) { phase = 'light'; S('fhLighter').style.display = ''; lighter.home(); cam?.reset(); say('斗燈還沒點亮。按住<b>打火機</b>，移到燈芯點火。'); return; }
    if (L.oil !== dayKey()) { phase = 'oil'; S('fhOil').style.display = ''; oil.home(); say('先幫斗燈<b>添油</b>：按住左邊的<b>油壺</b>，拿到斗燈上面。'); return; }
    startChant();
  }

  // 誦經：一字一下木魚
  let pages = [], pi = 0, lit = 0, good = 0, total = 0;
  function startChant() {
    const f = F(), r = reg();
    run++; phase = 'chant';
    pages = pagesOf(f, r.segs); pi = 0; lit = 0; good = 0; total = 0;
    chant = makeChant({ bpm: 76 });
    paintBook(pages[0], 0);
    S('fhZone').style.display = ''; S('fhTapHint').setAttribute('opacity', '1');
    cam?.zoom(190, 500, 320);
    paintProg(`${f.name}・第 ${r.segs + 1}／${f.days} ${f.units ? '卷' : '天'}${f.units ? `・${f.units[r.segs]}` : ''}`);
    say(`${f.lamp ? `今天禮拜北斗第${NUM[r.segs]}位星君。` : ''}跟著經本，<b>一字敲一下木魚</b>（點畫面下半部任何地方）。照著金色光圈縮到木魚的節奏敲，慢慢來，心靜下來就好。`);
    beatLoop(run);
  }
  function beatLoop(r) {
    const step = (now) => {
      if (r !== run || phase !== 'chant') { S('fhBeat').setAttribute('opacity', '0'); return; }
      if (chant.on) { const rr = chant.ring(now, 22, 54); S('fhBeat').setAttribute('r', rr.toFixed(1)); S('fhBeat').setAttribute('opacity', (.2 + .6 * (1 - (rr - 22) / 32)).toFixed(2)); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function strike() {
    if (phase !== 'chant') return;
    const { grade } = chant.judge(performance.now());
    strikeMuyu(svg, 'fhMuyu', grade);
    sfx.muyu?.(grade === 'perfect' ? 1 : .97 + Math.random() * .06);
    sfx.buzz?.([5]);
    total++; if (grade !== 'off') good++;
    lit++;
    const page = pages[pi];
    // 字亮起來的位置冒一點金光
    const idx = [...page.s].reduce((a, c, i) => { if (a.k < lit && !PUNCT.test(c)) { a.k++; a.i = i; } return a; }, { k: 0, i: 0 }).i;
    const cols = 13, cw = (BOOK.w - 24) / cols;
    emit('spark', BOOK.x + 12 + cw * (idx % cols) + cw / 2, BOOK.y + 20 + 26 * Math.floor(idx / cols));
    paintBook(page, lit);
    if (lit < taps(page.s)) return;
    // 這一頁誦完
    pi++;
    if (pi < pages.length) {
      const r0 = run; phase = 'flip';
      setTimeout(() => { if (r0 !== run) return; phase = 'chant'; lit = 0; paintBook(pages[pi], 0); sfx.knock(); }, 500);
      return;
    }
    finishDay();
  }
  async function finishDay() {
    const f = F(), r = reg(), r0 = run;
    phase = 'huixiang'; S('fhZone').style.display = 'none'; S('fhTapHint').setAttribute('opacity', '0');
    sfx.bowl();
    say(`誦完了，<b>迴向</b>給牌位上的${r.names.map((p) => esc(p.name)).slice(0, 4).join('、')}${r.names.length > 4 ? '等人' : ''}。`);
    cam?.reset(200);
    // 金光從經本飄到牌位
    for (let i = 0; i < (reduce ? 3 : 14); i++) {
      if (r0 !== run) return;
      emit('spark', 64, 240); if (f.kinds.includes('cj') && r.names.some((p) => p.kind === 'cj')) emit('spark', 296, 240);
      emit('text', 180, BOOK.y - 4, { text: '✦', color: '#FFE08A', size: 10, life: 1 });
      await sleep(90);
    }
    if (f.lamp) {
      const i = r.segs, [x, y] = STAR_XY[i];
      burst('spark', x, y, reduce ? 3 : 16);
      emit('text', x, y - 12, { text: `${STARS[i][1]}星君`, color: '#FFF4C0', size: 12, life: 1.8 });
    }
    r.segs++; r.last = dayKey(); save();
    paintStars(); paintTabs();
    const acc = total ? Math.round(good / total * 100) : 100;
    if (r.segs >= f.days) { await sleep(900); if (r0 === run) complete(); return; }
    phase = 'idle'; paintBook(null); paintProg();
    if (addFish && r.segs === 1) addFish(1);
    say(`第 ${r.segs} ${f.units ? '卷' : '天'}功德圓滿${f.units ? `（${f.units[r.segs - 1]}）` : ''}。木魚敲得穩的有 ${acc}%。${f.lamp ? '斗燈會一直亮著，' : ''}明天再來拜${f.units ? `${f.units[r.segs]}` : `第 ${r.segs + 1} 天`}，還有 ${f.days - r.segs} ${f.units ? '卷' : '天'}。`);
  }

  /* ----- 圓滿 ----- */
  function complete() {
    const f = F(), r = reg();
    const rec = { id: f.id, name: f.full, names: r.names, from: r.joined, to: dayKey(), mode: r.mode, who: state.name };
    fh.done.unshift(rec); fh.done = fh.done.slice(0, 30);
    delete fh.reg[f.id]; save();
    phase = 'idle';
    sfx.chime(); sfx.buzz?.([20, 60, 20, 60, 40]);
    burst('spark', 180, 230, reduce ? 6 : 40);
    if (wallet) wallet.earn(f.days * 12, `${f.name}圓滿`, 180, 300); else addFish?.(3);
    paintAll();
    say(`<b>${f.full}</b>功德圓滿！${wallet ? `福氣幣 +${f.days * 12}。` : '虎爺叼來小魚乾 ×3。'}這是你的<b>圓滿疏文</b>。`);
    showShuwen(rec);
  }
  function shuwenLines(rec) {
    const f = FAHUI.find((x) => x.id === rec.id) || F();
    const xz = rec.names.filter((p) => p.kind === 'xz').map((p) => p.name), cj = rec.names.filter((p) => p.kind === 'cj').map((p) => p.name);
    const [y, m, d] = rec.to.split('-'); const [y0, m0, d0] = rec.from.split('-');
    const lines = [
      f.buddhist ? '伏以 佛光普照 法雨均霑' : '伏以 斗光普照 星輝長明',
      `今有信眾 ${rec.who || '香客'} 虔誠參加${rec.name}`,
    ];
    if (xz.length) lines.push(`${f.lamp ? '斗燈主' : '消災祿位'}：${xz.join('、')}`);
    if (cj.length) lines.push(`超薦蓮位：${cj.join('、')}`);
    lines.push(`自${y0}年${m0}月${d0}日至${m}月${d}日 ${f.units ? `誦畢${f.units.length === 3 ? '上中下三卷' : `${f.days}卷`}` : f.lamp ? `禮拜北斗九皇 ${f.days} 日` : `共修 ${f.days} 日`}`);
    if (f.buddhist) {
      if (xz.length) lines.push('祈願在世親友 消災延壽 吉祥如意');
      if (cj.length) lines.push('祈願往生親人 離苦得樂 往生淨土');
      lines.push('願以此功德 普及於一切 我等與眾生 皆共成佛道');
    } else lines.push('祈願星君賜福 元辰光彩 消災解厄 闔家平安');
    lines.push(`心靈大廟法會壇 謹疏　${y}年${m}月${d}日`);
    return lines;
  }
  function showShuwen(rec) {
    const lines = shuwenLines(rec);
    const body = openSheet('圓滿疏文', `
      <div class="fh-shuwen" role="img" aria-label="${esc(lines.join('。'))}">
        <div class="fh-sw-cols">${['疏文', ...lines].map((l, i) => `<p class="${i === 0 ? 'h' : ''}">${esc(l)}</p>`).join('')}</div>
        <div class="fh-seal">功德<br>圓滿</div>
      </div>
      <div class="row"><button type="button" class="btn gold" id="fhSave">存成圖片</button></div>
      <p class="hint">真正的法會圓滿後，疏文會在金爐化掉、上達天聽；這張留給你當紀念。</p>`);
    body.querySelector('#fhSave').addEventListener('click', () => saveShuwen(lines));
  }
  // 疏文存成 PNG：直書，從右到左
  function saveShuwen(lines) {
    const W = 720, H = 1040, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#FFF4DC'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#C8302A'; g.lineWidth = 10; g.strokeRect(24, 24, W - 48, H - 48); g.lineWidth = 2; g.strokeRect(40, 40, W - 80, H - 80);
    const all = ['疏文', ...lines], fs = 30, colW = Math.min(64, (W - 140) / all.length);
    all.forEach((l, i) => {
      const x = W - 90 - i * colW, big = i === 0;
      g.fillStyle = big ? '#C8302A' : '#3B1F17';
      g.font = `${big ? 900 : 600} ${big ? 40 : fs}px "Noto Serif TC", "Songti TC", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      let y = big ? 110 : 100;
      const step = big ? 52 : Math.min(fs + 4, (H - 200) / Math.max(1, [...l].length));
      for (const ch of l) { if (ch === ' ') { y += step * .5; continue; } const rot = /[：、（）]/.test(ch); g.save(); g.translate(x, y); if (rot) g.rotate(Math.PI / 2); g.fillText(ch, 0, 0); g.restore(); y += step; }
    });
    g.save(); g.translate(150, H - 190); g.rotate(-.08); g.fillStyle = 'rgba(200,48,42,.85)'; g.fillRect(-70, -70, 140, 140);
    g.fillStyle = '#FFF4DC'; g.font = '900 44px "Noto Serif TC", serif'; g.textAlign = 'center'; g.fillText('功德', 0, -22); g.fillText('圓滿', 0, 30); g.restore();
    const a = document.createElement('a'); a.download = '圓滿疏文.png'; a.href = c.toDataURL('image/png'); a.click();
  }

  /* ----- 疏文、日程 ----- */
  function openRecords() {
    const list = fh.done;
    const body = openSheet('我的疏文', `
      ${FAHUI.map((f) => { const r = fh.reg[f.id]; return r ? `<p style="margin:0 0 6px"><b>${f.name}</b>：${r.mode === 'wait' ? '已報名，等法會開始' : `已完成 ${r.segs}／${f.days}`}，牌位 ${r.names.map((p) => esc(p.name)).join('、')}</p>` : ''; }).join('')}
      ${list.length ? `<div class="fh-recs">${list.map((x, i) => `<button type="button" class="fh-rec" data-rec="${i}"><b>${esc(x.name)}</b><small>${x.to.replace(/-/g, '/')} 圓滿・${x.names.length} 位</small></button>`).join('')}</div>` : '<p class="hint">還沒有圓滿的法會。報名後每天來拜一段，拜完就會拿到圓滿疏文。</p>'}`);
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-rec]'); if (b) showShuwen(list[+b.dataset.rec]); });
  }
  function openCalendar() {
    openSheet('法會日程', `
      <div class="explain">${FAHUI.map((f) => { const w = nextWindow(f); return `<h3>${f.full}・${f.days} 天</h3><p>${f.when}。<br>${w ? (w.active ? `<b>正在辦，今天第 ${w.dayIdx + 1} 天</b>（${rangeText(f, w)}）` : `下一場：${rangeText(f, w)}`) : ''}</p>`; }).join('')}</div>
      <p class="hint">廟裡辦法會的日子，壇前會有其他信眾一起共修。其他時候報名，也可以選「自己發願開始」，每天拜一段就好。</p>`);
  }

  /* ----- 綁定 ----- */
  S('fhZone').addEventListener('pointerdown', (e) => { e.preventDefault(); strike(); });
  svg.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && phase === 'chant' && !e.repeat) { e.preventDefault(); strike(); } });
  $('#fhBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-fh]'); if (!b) return;
    const a = b.dataset.fh;
    if (a === 'signup') openSignup();
    else if (a === 'today') { today(); if (phase === 'chant') svg.focus({ preventScroll: true }); }
    else if (a === 'records') openRecords();
    else if (a === 'cal') openCalendar();
  });

  function resetProps() {
    for (const id of ['fhOil', 'fhLighter', 'fhLampSpot', 'fhZone']) S(id).style.display = 'none';
    S('fhTapHint').setAttribute('opacity', '0'); S('fhBeat').setAttribute('opacity', '0');
    // 斗燈拿到一半離開：還沒安好就收起來
    const L = lampState(); if (!L || !L.placed) S('fhLamp').style.display = 'none';
  }
  return {
    enter() {
      run++; phase = 'idle'; resetProps(); paintMe();
      // 有正在辦的法會、又還沒報名那一場：直接切過去
      const active = FAHUI.find((f) => windowAt(f));
      if (active && !reg() && !fh.reg[active.id]) fh.cur = active.id;
      paintAll(); intro();
    },
    leave() { run++; phase = 'idle'; resetProps(); paintBook(null); },
  };
}

// 地圖、招呼語用：今天有沒有要提醒的法會
export function fahuiNews(state, dayKey) {
  const fh = state.fahui || { reg: {} };
  const due = FAHUI.filter((f) => { const r = fh.reg?.[f.id]; return r && r.mode !== 'wait' && r.last !== dayKey; });
  const active = FAHUI.filter((f) => windowAt(f));
  const waitingNow = active.filter((f) => fh.reg?.[f.id]?.mode === 'wait');
  return { due: due.length > 0 || waitingNow.length > 0, active, line: active.length ? `廟裡正在辦<b>${active.map((f) => f.name).join('、')}</b>，可以到廟埕左邊的<b>法會報名處</b>報名。` : due.length ? `今天的<b>${due[0].name}</b>功課還沒做，記得到<b>法會報名處</b>拜一段。` : '' };
}

// 酬神戲台：神明生日那天，廟埕搭起布袋戲台。出香油錢（福氣幣）點一齣戲請神明看，
// 開演先「跳加官」扮仙，再演正戲。玩家就是主演：在戲台下面按住操偶（戲偶浮在手指上方的戲台上），
// 照後場的提示往上甩、往對手揮、左右搖、按住運功。演完把「敬獻」紅彩牌拖上戲台掛好，
// 神明給好運加成：當天在那位神明殿裡擲筊，聖筊機率提高。
// 沒有神明生日的日子是「排練」：可以免費試演，不掛名、沒有加成。
// 場景 360 × 645；SVG 裡的 id 都加 xi 前綴。有 Gemini 圖（src/assets/xi/<key>.webp）就自動換上。
import { makeCarrier } from './carry.js';
import { wallet } from './wallet.js';
import { reduce, sleep, tween, shake, pick } from './stall.js';

const ART = import.meta.glob('./assets/xi/*.webp', { eager: true, import: 'default' });
const art = (k) => ART[`./assets/xi/${k}.webp`];

export const PRICE = 66; // 六六大順

// 神明生日（農曆月、日）→ 殿的 id。沒有開殿的神明（例如還沒合進來的天公殿）會自動略過。
export const BIRTHDAYS = [
  [1, 1, 'ml', '彌勒佛誕'], [1, 9, 'tg', '天公生'], [2, 2, 'tudi', '土地公聖誕'], [2, 2, 'ji', '濟公聖誕'],
  [2, 3, 'wen', '文昌帝君聖誕'], [2, 19, 'gy', '觀音菩薩聖誕'], [3, 15, 'cai', '財神爺聖誕'],
  [3, 20, 'zs', '註生娘娘聖誕'], [3, 23, 'main', '媽祖聖誕'], [6, 24, 'gg', '關聖帝君聖誕'],
  [7, 18, 'mu', '瑤池金母聖誕'], [8, 15, 'yue', '月下老人聖誕'], [9, 9, 'san', '中壇元帥聖誕'],
];

// 手勢：up 往上甩、hit 往對手揮、shake 左右搖、hold 按住不動
const GEST = {
  up: ['↑', '往上甩'], hit: ['→', '往對手揮過去'], shake: ['↔', '左右快搖'], hold: ['●', '按住不動'],
};

// 戲偶外觀：face 臉色、robe 戲服、trim 滾邊、hat 帽子、beard 鬍子、prop 手上拿的
const P = {
  jiaguan: { name: '加官', face: '#FFFFFF', robe: '#D8302A', trim: '#FFD24A', hat: 'guan', hatC: '#2A1A12', mask: true, prop: 'tablet' },
  lv: { name: '呂洞賓', face: '#F6CFAE', robe: '#3E7FB8', trim: '#FFE08A', hat: 'scholar', hatC: '#2A3A5A', beard: 'long', prop: 'sword' },
  shrimp: { name: '蝦兵', face: '#FF9A7A', robe: '#2E8F86', trim: '#FFD24A', hat: 'shrimp', hatC: '#FF7A5A', prop: 'spear' },
  guan: { name: '關公', face: '#C8302A', robe: '#2E7A4A', trim: '#FFD24A', hat: 'helmet', hatC: '#2E7A4A', beard: 'long', prop: 'blade' },
  guard: { name: '守關將', face: '#3E6FD8', robe: '#4A4A5A', trim: '#C8C8D0', hat: 'helmet', hatC: '#5A5A6A', fierce: true, prop: 'spear' },
  nezha: { name: '哪吒', face: '#FCE0C8', robe: '#E8402A', trim: '#FFD24A', hat: 'buns', hatC: '#2A1A12', prop: 'ring' },
  aobing: { name: '敖丙', face: '#BFE6FF', robe: '#2E6FA8', trim: '#9FD8FF', hat: 'horns', hatC: '#E8D8A0', fierce: true, prop: 'spear' },
  mazu: { name: '媽祖', face: '#F6CFAE', robe: '#E8A23A', trim: '#D8302A', hat: 'crown', hatC: '#FFD24A', prop: 'hu' },
  qianli: { name: '千里眼', face: '#3E9A5A', robe: '#8A3A2A', trim: '#FFD24A', hat: 'horns', hatC: '#D8302A', fierce: true, prop: 'spear' },
  shanbo: { name: '梁山伯', face: '#F6CFAE', robe: '#5E9ACF', trim: '#FFFFFF', hat: 'scholar', hatC: '#2A3A5A', prop: 'fan' },
  yingtai: { name: '祝英台', face: '#FCE0C8', robe: '#F28AAE', trim: '#FFFFFF', hat: 'scholar', hatC: '#2A3A5A', prop: 'fan', lady: true },
  jigong: { name: '濟公', face: '#F6CFAE', robe: '#B89A6A', trim: '#6A4A2A', hat: 'monk', hatC: '#B89A6A', prop: 'fan' },
  bully: { name: '惡霸', face: '#E8B89A', robe: '#3A2A2A', trim: '#C8783E', hat: 'cap', hatC: '#2A1A12', fierce: true, beard: 'short', prop: 'none' },
  scholar: { name: '書生', face: '#F6CFAE', robe: '#E8E0C8', trim: '#2E6FA8', hat: 'scholar', hatC: '#2A3A5A', prop: 'brush' },
  examiner: { name: '主考官', face: '#F6CFAE', robe: '#D8302A', trim: '#FFD24A', hat: 'guan', hatC: '#2A1A12', beard: 'long', prop: 'hu' },
  guanyin: { name: '觀音', face: '#FFF4EA', robe: '#FFFFFF', trim: '#7FC4F0', hat: 'veil', hatC: '#FFFFFF', prop: 'willow', lady: true },
  honghai: { name: '紅孩兒', face: '#FCE0C8', robe: '#E8402A', trim: '#FF9A3A', hat: 'buns', hatC: '#2A1A12', fierce: true, prop: 'spear' },
  caishen: { name: '財神', face: '#F6CFAE', robe: '#D8302A', trim: '#FFD24A', hat: 'guan', hatC: '#2A1A12', beard: 'long', prop: 'ingot' },
  ghost: { name: '窮鬼', face: '#C8D8C0', robe: '#6A6A7A', trim: '#9A9AA8', hat: 'hair', hatC: '#4A4A5A', prop: 'none' },
};

// 戲碼：for = 最適合的神明；cues 是主演要做的動作（旁白、手勢、成功時台下喊什麼）
const PLAYS = [
  { id: 'baxian', name: '八仙過海', sub: '扮仙祝壽，哪位神明生日都適合', for: ['mu', 'tg', 'ml', 'tudi', 'zs'], hero: 'lv', foe: 'shrimp', sea: true,
    cues: [
      { g: 'hold', line: '八仙要渡東海去給神明祝壽，呂洞賓先運起仙氣', act: 'charge', ok: '仙氣滿滿！' },
      { g: 'up', line: '踏上寶劍，一躍飛過大浪', act: 'flip', ok: '好身手！' },
      { g: 'hit', line: '龍宮蝦兵擋路，揮劍把它打回海裡', act: 'hit', ok: '打得好！' },
      { g: 'shake', line: '渡過東海，八仙搖頭晃腦唱起賀壽歌', act: 'dance', ok: '壽比南山！' },
    ] },
  { id: 'wuguan', name: '過五關斬六將', sub: '三國戲，關公的招牌', for: ['gg'], hero: 'guan', foe: 'guard',
    cues: [
      { g: 'hit', line: '關公護送嫂嫂，來到第一關，守將不讓過', act: 'hit', ok: '一刀斬！' },
      { g: 'up', line: '赤兔馬長嘶一聲，躍過關門', act: 'flip', ok: '赤兔快馬！' },
      { g: 'hold', line: '又一關，關公凝神提起青龍偃月刀', act: 'charge', ok: '殺氣騰騰！' },
      { g: 'hit', line: '一路斬過五關，大刀一揮', act: 'hit', ok: '忠義千秋！' },
    ] },
  { id: 'nezha', name: '哪吒鬧東海', sub: '三太子的成名戲', for: ['san'], hero: 'nezha', foe: 'aobing', sea: true,
    cues: [
      { g: 'shake', line: '哪吒在海邊甩起混天綾，把東海攪得翻天', act: 'dance', ok: '好頑皮！' },
      { g: 'up', line: '龍太子敖丙衝出來，哪吒踩風火輪跳上天', act: 'flip', ok: '風火輪！' },
      { g: 'hit', line: '丟出乾坤圈，正中敖丙', act: 'hit', ok: '中了！' },
      { g: 'hold', line: '哪吒現出三頭六臂，威風凜凜', act: 'charge', ok: '三太子威武！' },
    ] },
  { id: 'mazu', name: '媽祖收二將', sub: '媽祖收服千里眼、順風耳', for: ['main'], hero: 'mazu', foe: 'qianli',
    cues: [
      { g: 'hold', line: '桃花山上的千里眼作亂，媽祖靜心運起法力', act: 'charge', ok: '法力無邊！' },
      { g: 'hit', line: '千里眼衝過來，媽祖揮袖一擋', act: 'hit', ok: '擋得好！' },
      { g: 'up', line: '媽祖騰雲駕霧，飛到半空', act: 'flip', ok: '天上聖母！' },
      { g: 'shake', line: '千里眼心服口服，從此跟在媽祖身邊守護', act: 'dance', ok: '收服了！' },
    ] },
  { id: 'liangzhu', name: '梁祝・十八相送', sub: '月老最愛看的愛情戲', for: ['yue'], hero: 'shanbo', foe: 'yingtai', love: true,
    cues: [
      { g: 'shake', line: '梁山伯和祝英台同窗三年，一起搖頭晃腦唸書', act: 'dance', ok: '書呆子！' },
      { g: 'hit', line: '十八里相送，梁山伯走近一步', act: 'near', ok: '好甜！' },
      { g: 'hold', line: '英台暗示自己是女兒身，山伯還聽不懂……停在原地想一想', act: 'charge', ok: '終於懂了！' },
      { g: 'up', line: '兩人化作一對蝴蝶，飛上天', act: 'flip', ok: '比翼雙飛！' },
    ] },
  { id: 'jigong', name: '濟公戲惡霸', sub: '瘋瘋癲癲的濟公教訓壞人', for: ['ji'], hero: 'jigong', foe: 'bully',
    cues: [
      { g: 'shake', line: '濟公喝了一口酒，搖著破扇子晃進市場', act: 'dance', ok: '好酒量！' },
      { g: 'hit', line: '惡霸欺負賣菜阿婆，濟公一扇搧過去', act: 'hit', ok: '搧得好！' },
      { g: 'up', line: '惡霸撲過來，濟公一個筋斗翻開', act: 'flip', ok: '翻得漂亮！' },
      { g: 'hold', line: '濟公唸咒施展定身法', act: 'charge', ok: '定住了！' },
    ] },
  { id: 'zhuangyuan', name: '狀元及第', sub: '考試順利的好兆頭', for: ['wen'], hero: 'scholar', foe: 'examiner',
    cues: [
      { g: 'hold', line: '書生十年寒窗，挑燈苦讀', act: 'charge', ok: '用功！' },
      { g: 'hit', line: '進了考場，提筆一揮寫好文章', act: 'near', ok: '好文章！' },
      { g: 'up', line: '放榜了！金榜題名，高中狀元', act: 'flip', ok: '狀元郎！' },
      { g: 'shake', line: '騎馬遊街，好不風光', act: 'dance', ok: '光宗耀祖！' },
    ] },
  { id: 'honghai', name: '觀音收紅孩兒', sub: '慈悲收服頑皮的紅孩兒', for: ['gy'], hero: 'guanyin', foe: 'honghai',
    cues: [
      { g: 'hit', line: '紅孩兒噴出三昧真火，觀音用楊柳枝一揮', act: 'hit', ok: '火滅了！' },
      { g: 'hold', line: '觀音靜靜坐上蓮台，等紅孩兒自己坐下', act: 'charge', ok: '大慈大悲！' },
      { g: 'up', line: '蓮台化成千瓣金光', act: 'flip', ok: '金光閃閃！' },
      { g: 'shake', line: '紅孩兒變成善財童子，開心拜觀音', act: 'dance', ok: '善哉！' },
    ] },
  { id: 'caishen', name: '財神趕窮鬼', sub: '把窮鬼趕走，財源滾滾來', for: ['cai'], hero: 'caishen', foe: 'ghost',
    cues: [
      { g: 'shake', line: '財神爺搖著金元寶出場，叮叮噹噹', act: 'dance', ok: '發財！' },
      { g: 'hit', line: '窮鬼想偷溜進來，財神一揮把它趕出去', act: 'hit', ok: '窮鬼滾！' },
      { g: 'hold', line: '財神運起財氣，招來五路財源', act: 'charge', ok: '財氣滿滿！' },
      { g: 'up', line: '金元寶往上一拋，灑滿戲台', act: 'flip', ok: '財源滾滾！' },
    ] },
];
// 開演一定先「跳加官」扮仙
const OPENING = { hero: 'jiaguan', cues: [
  { g: 'shake', line: '鑼鼓響起，先跳加官！加官戴著笑臉面具搖搖擺擺出場', act: 'dance', ok: '加官！' },
  { g: 'up', line: '高高舉起「加官晉祿」牌', act: 'raise', ok: '晉祿！' },
] };

const STAGE_Y = 418;              // 戲偶底部（被台口板擋住的地方）
const HERO_X = 130, FOE_X = 236;  // 戲偶的起始位置
const OPEN_L = 76, OPEN_R = 284;  // 戲口左右
const BANNER_HOOK = [180, 254], BANNER_REST = [296, 610];
const CUE_MS = 4200;

/* ---------- 戲偶 SVG（原點在戲偶底部中心） ---------- */
function hatSVG(p) {
  const c = p.hatC;
  switch (p.hat) {
    case 'guan': return `<path d="M-24 -96h48v-14c0-6-48-6-48 0z" fill="${c}"/><rect x="-34" y="-104" width="14" height="5" rx="2.5" fill="${c}"/><rect x="20" y="-104" width="14" height="5" rx="2.5" fill="${c}"/><circle cx="0" cy="-104" r="3" fill="#FFD24A"/>`;
    case 'scholar': return `<path d="M-22 -96c0-18 44-18 44 0z" fill="${c}"/><path d="M14 -104l14 10M-14 -104l-14 10" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
    case 'helmet': return `<path d="M-26 -90c0-26 52-26 52 0z" fill="${c}"/><path d="M-26 -90h52" stroke="#FFD24A" stroke-width="3"/><path d="M0 -114l-5 -14h10z" fill="#E8402A"/><circle cx="0" cy="-100" r="4" fill="#FFD24A"/>`;
    case 'buns': return `<circle cx="-16" cy="-108" r="9" fill="${c}"/><circle cx="16" cy="-108" r="9" fill="${c}"/><path d="M-23 -92c0-16 46-16 46 0z" fill="${c}"/><path d="M-22 -108h-4M22 -108h4" stroke="#E8402A" stroke-width="3"/>`;
    case 'horns': return `<path d="M-24 -92c0-14 48-14 48 0z" fill="#2A1A12"/><path d="M-14 -102c-6-10-4-18 2-22-2 8 2 14 6 18zM14 -102c6-10 4-18-2-22 2 8-2 14-6 18z" fill="${c}"/>`;
    case 'crown': return `<path d="M-22 -94l4 -22 9 10 9 -16 9 16 9 -10 4 22z" fill="${c}" stroke="#C8783E" stroke-width="1.2"/><circle cx="0" cy="-104" r="3.4" fill="#E8402A"/><path d="M-22 -94c-4 8-4 22 0 30M22 -94c4 8 4 22 0 30" stroke="#FFD24A" stroke-width="2" fill="none"/>`;
    case 'monk': return `<path d="M-24 -92c-2-22 50-22 48 0z" fill="${c}"/><rect x="-10" y="-110" width="20" height="12" rx="3" fill="#8A6A3A"/><text x="0" y="-101" text-anchor="middle" font-size="9" font-weight="900" fill="#FFF4E0">佛</text>`;
    case 'veil': return `<path d="M-26 -60c-4-40 4-60 26-60s30 20 26 60c-6-30-14-42-26-42s-20 12-26 42z" fill="${c}" stroke="#D8E8F0" stroke-width="1.2"/><circle cx="0" cy="-108" r="4" fill="#FF9EBB"/>`;
    case 'shrimp': return `<path d="M-20 -96c4-16 36-16 40 0" fill="${c}"/><path d="M-6 -112c-10-16-20-18-26-14M6 -112c10-16 20-18 26-14" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case 'cap': return `<path d="M-23 -92c0-14 46-14 46 0z" fill="${c}"/><rect x="-25" y="-94" width="50" height="5" rx="2" fill="${c}"/>`;
    default: return `<path d="M-24 -84c-4-22 6-32 24-32s28 10 24 32c-6-10-14-14-24-14s-18 4-24 14z" fill="${c}"/>`;
  }
}
function propSVG(p) {
  switch (p.prop) {
    case 'sword': return `<g transform="translate(30 -46) rotate(-30)"><rect x="-2" y="-46" width="4" height="40" fill="#DCE4EA" stroke="#7A8590" stroke-width=".8"/><rect x="-7" y="-6" width="14" height="4" fill="#FFD24A"/><rect x="-2" y="-2" width="4" height="10" fill="#8A3A2A"/></g>`;
    case 'blade': return `<g transform="translate(32 -40) rotate(-10)"><rect x="-1.6" y="-70" width="3.2" height="90" fill="#8A4A2A"/><path d="M-2 -70c10-4 20 4 18 22-6-8-12-12-18-10z" fill="#DCE4EA" stroke="#7A8590" stroke-width=".8"/><circle cx="0" cy="-66" r="3" fill="#2E7A4A"/></g>`;
    case 'spear': return `<g transform="translate(-30 -40) rotate(14)"><rect x="-1.4" y="-62" width="2.8" height="80" fill="#8A6A3A"/><path d="M0 -76l5 14h-10z" fill="#DCE4EA" stroke="#7A8590" stroke-width=".8"/><path d="M-4 -60h8" stroke="#E8402A" stroke-width="3"/></g>`;
    case 'fan': return `<g transform="translate(30 -50) rotate(-20)"><path d="M0 0l-16 -26a30 30 0 0 1 32 0z" fill="#F3E2B8" stroke="#8A6234" stroke-width="1"/><path d="M0 0v-30M0 0l-9-28M0 0l9-28" stroke="#C9A26A" stroke-width=".8"/></g>`;
    case 'ring': return `<g transform="translate(32 -48)"><circle r="11" fill="none" stroke="#FFD24A" stroke-width="5"/><path d="M-30 20c10-10 20-6 30-16" stroke="#E8402A" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
    case 'brush': return `<g transform="translate(30 -50) rotate(-24)"><rect x="-1.6" y="-26" width="3.2" height="28" fill="#8A4A2A"/><path d="M-3 2h6l-3 9z" fill="#2A1A12"/></g>`;
    case 'willow': return `<g transform="translate(30 -46)"><path d="M0 0l4 -34" stroke="#5E9A4A" stroke-width="2"/><path d="M4 -34c8 4 10 14 8 22M4 -26c-6 4-8 12-6 20" stroke="#7DBA6A" stroke-width="1.6" fill="none"/></g>`;
    case 'ingot': return `<g transform="translate(32 -52)"><path d="M-14 0c0-8 6-6 8-10h12c2 4 8 2 8 10z" fill="#FFD24A" stroke="#C8783E" stroke-width="1.2"/><ellipse cx="0" cy="-8" rx="6" ry="5" fill="#FFE08A" stroke="#C8783E" stroke-width="1"/></g>`;
    case 'tablet': return `<g id="xiTablet" transform="translate(32 -54)"><rect x="-9" y="-30" width="18" height="40" rx="2" fill="#FFF4E0" stroke="#D8302A" stroke-width="1.6"/><text x="0" y="-16" text-anchor="middle" font-size="8" font-weight="900" fill="#D8302A">加官</text><text x="0" y="-4" text-anchor="middle" font-size="8" font-weight="900" fill="#D8302A">晉祿</text></g>`;
    case 'hu': return `<g transform="translate(30 -50) rotate(-12)"><rect x="-4" y="-26" width="8" height="30" rx="3" fill="#F3E2B8" stroke="#8A6234" stroke-width="1"/></g>`;
    default: return '';
  }
}
function puppetSVG(key) {
  const p = P[key], img = art(key);
  if (img) return `<image href="${img}" x="-58" y="-136" width="116" height="140"/>`;
  const eyes = p.mask ? '<path d="M-11 -76q4 -5 8 0M3 -76q4 -5 8 0" stroke="#2A1A12" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M-10 -64q10 10 20 0" stroke="#D8302A" stroke-width="2.4" fill="#FFF" stroke-linecap="round"/>'
    : p.fierce ? '<path d="M-14 -82l9 4M14 -82l-9 4" stroke="#2A1A12" stroke-width="2.6" stroke-linecap="round"/><circle cx="-8" cy="-74" r="3.6" fill="#FFF"/><circle cx="8" cy="-74" r="3.6" fill="#FFF"/><circle cx="-8" cy="-74" r="2" fill="#2A1A12"/><circle cx="8" cy="-74" r="2" fill="#2A1A12"/><path d="M-7 -62q7 -5 14 0" stroke="#2A1A12" stroke-width="2" fill="none"/>'
    : '<ellipse cx="-8" cy="-74" rx="3.4" ry="4.4" fill="#2A1A12"/><ellipse cx="8" cy="-74" rx="3.4" ry="4.4" fill="#2A1A12"/><circle cx="-7" cy="-76" r="1.3" fill="#FFF"/><circle cx="9" cy="-76" r="1.3" fill="#FFF"/><path d="M-5 -63q5 4 10 0" stroke="#A0523C" stroke-width="2" fill="none" stroke-linecap="round"/>';
  const beard = p.beard === 'long' ? '<path d="M-10 -60c-2 18 4 30 10 34 6-4 12-16 10-34-6 4-14 4-20 0z" fill="#2A1A12"/>'
    : p.beard === 'short' ? '<path d="M-12 -60c4 8 20 8 24 0-6 4-18 4-24 0z" fill="#2A1A12"/>' : '';
  const cheeks = p.fierce || p.mask ? '' : `<ellipse cx="-14" cy="-66" rx="4.4" ry="2.8" fill="#F29A8A" opacity="${p.lady ? .7 : .45}"/><ellipse cx="14" cy="-66" rx="4.4" ry="2.8" fill="#F29A8A" opacity="${p.lady ? .7 : .45}"/>`;
  return `
    <path d="M-30 4c0-28 6-44 30-44s30 16 30 44z" fill="${p.robe}"/>
    <path d="M-30 4c0-28 6-44 30-44s30 16 30 44" fill="none" stroke="${p.trim}" stroke-width="3"/>
    <path d="M-8 -40l8 14 8 -14" fill="none" stroke="${p.trim}" stroke-width="3"/>
    <ellipse cx="-30" cy="-30" rx="9" ry="13" fill="${p.robe}" stroke="${p.trim}" stroke-width="2" transform="rotate(-24 -30 -30)"/>
    <ellipse cx="30" cy="-30" rx="9" ry="13" fill="${p.robe}" stroke="${p.trim}" stroke-width="2" transform="rotate(24 30 -30)"/>
    <circle cx="-34" cy="-42" r="5" fill="${p.face === '#FFFFFF' ? '#F6CFAE' : p.face}"/><circle cx="34" cy="-42" r="5" fill="${p.face === '#FFFFFF' ? '#F6CFAE' : p.face}"/>
    <circle cx="0" cy="-72" r="25" fill="${p.face}" stroke="rgb(0 0 0 / .12)"/>
    ${cheeks}${eyes}${beard}${hatSVG(p)}${propSVG(p)}`;
}

/* ---------- 戲台 ---------- */
const svgOf = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="廟埕酬神布袋戲台" class="stall-svg xi-svg">
  <defs>
    <linearGradient id="xiSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A1440"/><stop offset=".6" stop-color="#3A1E3A"/><stop offset="1" stop-color="#5A2A22"/></linearGradient>
    <linearGradient id="xiGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#C8883E"/></linearGradient>
    <linearGradient id="xiCurtain" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A81E1A"/><stop offset=".5" stop-color="#E8402A"/><stop offset="1" stop-color="#A81E1A"/></linearGradient>
    <radialGradient id="xiLamp"><stop offset="0" stop-color="#FFF2B0" stop-opacity=".9"/><stop offset="1" stop-color="#FF9A3A" stop-opacity="0"/></radialGradient>
    <radialGradient id="xiGlow"><stop offset="0" stop-color="#FFF2B0" stop-opacity=".95"/><stop offset=".6" stop-color="#FFD24A" stop-opacity=".4"/><stop offset="1" stop-color="#FFD24A" stop-opacity="0"/></radialGradient>
    <clipPath id="xiOpen"><rect x="${OPEN_L}" y="262" width="${OPEN_R - OPEN_L}" height="${STAGE_Y - 262}"/></clipPath>
  </defs>
  ${art('stage') ? `<image href="${art('stage')}" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>` : `
  <rect width="360" height="645" fill="url(#xiSky)"/>
  <g fill="#FFF4C8" opacity=".7"><circle cx="40" cy="60" r="1.2"/><circle cx="120" cy="34" r="1"/><circle cx="300" cy="50" r="1.4"/><circle cx="250" cy="96" r="1"/><circle cx="70" cy="120" r="1"/></g>
  <circle cx="300" cy="96" r="18" fill="#FFF4C8" opacity=".85"/>
  <rect y="470" width="360" height="175" fill="#6A4A3A"/>
  <path d="M0 500h360M0 540h360M0 590h360M60 470v175M150 470v175M240 470v175M330 470v175" stroke="#5A3A2C" stroke-width="2"/>
  <!-- 戲台：屋頂、柱子 -->
  <rect x="44" y="220" width="12" height="250" fill="#A81E1A"/><rect x="304" y="220" width="12" height="250" fill="#A81E1A"/>
  <path d="M20 222c40-10 60-40 70-62h180c10 22 30 52 70 62z" fill="#C8302A"/>
  <path d="M20 222c40-10 60-40 70-62h180c10 22 30 52 70 62" fill="none" stroke="url(#xiGold)" stroke-width="5"/>
  <path d="M90 160c10-30 170-30 180 0z" fill="#2E6F5A"/><path d="M14 226c-6-6-4-16 4-18M346 226c6-6 4-16-4-18" stroke="#FFD24A" stroke-width="4" fill="none" stroke-linecap="round"/>
  <rect x="56" y="232" width="248" height="30" fill="url(#xiGold)"/>
  <path d="M66 247h228" stroke="#C8302A" stroke-width="2" stroke-dasharray="6 5"/>
  <!-- 燈籠 -->
  <circle cx="34" cy="262" r="30" fill="url(#xiLamp)"/><circle cx="326" cy="262" r="30" fill="url(#xiLamp)"/>
  <path d="M34 232v14M326 232v14" stroke="#2A1A12" stroke-width="1.4"/>
  <ellipse cx="34" cy="262" rx="13" ry="16" fill="#E8402A"/><ellipse cx="326" cy="262" rx="13" ry="16" fill="#E8402A"/>
  <path d="M28 246h12M28 278h12M320 246h12M320 278h12" stroke="#FFD24A" stroke-width="3"/>`}
  <!-- 戲口裡面：布景 -->
  <g clip-path="url(#xiOpen)">
    <rect x="${OPEN_L}" y="262" width="${OPEN_R - OPEN_L}" height="${STAGE_Y - 262}" fill="#2A3A6A" id="xiBack"/>
    <g id="xiScenery"></g>
    <g id="xiLove" opacity="0"></g>
    <circle id="xiGlowC" cx="${HERO_X}" cy="${STAGE_Y - 70}" r="10" fill="url(#xiGlow)" opacity="0"/>
    <g id="xiFoe" transform="translate(${FOE_X} ${STAGE_Y})"><g id="xiFoeArt"></g></g>
    <g id="xiHero" transform="translate(${HERO_X} ${STAGE_Y})"><g id="xiHeroArt"></g></g>
    <!-- 布幕 -->
    <rect id="xiCurL" x="${OPEN_L}" y="262" width="${(OPEN_R - OPEN_L) / 2}" height="${STAGE_Y - 262}" fill="url(#xiCurtain)"/>
    <rect id="xiCurR" x="${(OPEN_L + OPEN_R) / 2}" y="262" width="${(OPEN_R - OPEN_L) / 2}" height="${STAGE_Y - 262}" fill="url(#xiCurtain)"/>
  </g>
  ${art('stage') ? '' : `
  <rect x="${OPEN_L - 6}" y="262" width="6" height="${STAGE_Y - 262}" fill="url(#xiGold)"/><rect x="${OPEN_R}" y="262" width="6" height="${STAGE_Y - 262}" fill="url(#xiGold)"/>`}
  <!-- 台口板（戲偶的下半身藏在後面） -->
  <rect x="50" y="398" width="260" height="72" rx="4" fill="#C8302A"/>
  <rect x="50" y="398" width="260" height="72" rx="4" fill="none" stroke="url(#xiGold)" stroke-width="5"/>
  <rect x="122" y="412" width="116" height="44" rx="6" fill="#FFF4E0" stroke="#FFD24A" stroke-width="2"/>
  <text id="xiBoard" x="180" y="432" text-anchor="middle" class="xi-board">酬神戲台</text>
  <text id="xiBoard2" x="180" y="449" text-anchor="middle" class="xi-board2">排練中</text>
  <path d="M60 416c14 0 14 14 28 14M300 416c-14 0-14 14-28 14" stroke="#FFD24A" stroke-width="3" fill="none"/>
  <!-- 敬獻彩牌掛的位置 -->
  <g id="xiHung" style="display:none"></g>
  <circle id="xiHookRing" cx="${BANNER_HOOK[0]}" cy="${BANNER_HOOK[1] - 10}" r="30" fill="none" stroke="#FFE08A" stroke-width="2.4" stroke-dasharray="5 4" opacity="0"/>
  <!-- 台下觀眾 -->
  <g id="xiCrowd" opacity=".92">
    ${[[26, 618, '#3A2A4A'], [70, 630, '#4A2A2A'], [116, 622, '#2A3A4A'], [244, 624, '#3A3A2A'], [290, 632, '#4A2A3A'], [334, 620, '#2A2A4A']].map(([x, y, c], i) => `<g class="xi-fan" style="animation-delay:${i * -.23}s" transform="translate(${x} ${y})"><path d="M-20 30c0-22 8-32 20-32s20 10 20 32z" fill="${c}"/><circle cy="-12" r="14" fill="${c}"/></g>`).join('')}
  </g>
  <!-- 提示：後場喊的動作 -->
  <g id="xiCueG" opacity="0">
    <rect x="22" y="478" width="316" height="58" rx="14" fill="#1A0A08" opacity=".72"/>
    <text id="xiCueLine" x="180" y="499" text-anchor="middle" class="xi-cue-line"></text>
    <text id="xiCueG2" x="180" y="524" text-anchor="middle" class="xi-cue-g"></text>
    <rect id="xiTimer" x="40" y="530" width="280" height="3" rx="1.5" fill="#FFE08A"/>
  </g>
  <!-- 操偶區 -->
  <g id="xiPadG" opacity="0">
    <rect x="14" y="544" width="332" height="90" rx="18" fill="#FFF4E0" opacity=".1" stroke="#FFE08A" stroke-width="1.6" stroke-dasharray="6 5"/>
    <text x="180" y="594" text-anchor="middle" class="xi-pad">在這裡按住，操控台上的戲偶</text>
  </g>
  <rect id="xiPad" x="0" y="470" width="360" height="175" fill="transparent" style="display:none"/>
  <!-- 敬獻彩牌（演完拿起來，掛上戲台） -->
  <g id="xiBanner" class="stall-prop" role="button" tabindex="0" aria-label="敬獻紅彩牌，拖上戲台掛好" transform="translate(${BANNER_REST[0]} ${BANNER_REST[1]})" style="display:none"></g>
</svg>`;

const bannerSVG = (name, play, w = 150) => `
  <path d="M${-w / 2} -40h${w}v30c-10 6-20 6-${w / 4} 0s-20 6-${w / 4} 0s-20 6-${w / 4} 0s-20 6-${w / 4} 0z" fill="#D8302A" stroke="#FFD24A" stroke-width="2"/>
  <path d="M${-w / 2 + 4} -36h${w - 8}" stroke="#FFD24A" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="0" y="-24" text-anchor="middle" class="xi-ban">${name}　敬獻</text>
  <text x="0" y="-12" text-anchor="middle" class="xi-ban2">${play}</text>`;

const seaSVG = `<path d="M76 380c20-10 30 0 50-8s30 6 50-2 30 4 50-4 30 6 58-2v62H76z" fill="#2E6FA8"/><path d="M76 392c20-8 30 2 50-6s30 6 50-2 30 4 50-4 30 6 58-2" stroke="#BFE6FF" stroke-width="2" fill="none"/>`;
const hillSVG = `<path d="M76 360l40-50 30 30 40-60 40 50 30-30 28 30v90H76z" fill="#3E5A7A"/><path d="M76 380l50-30 40 20 60-30 58 30v50H76z" fill="#4E7A5A"/>`;

export function initXitai(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, lunar, halls } = api;
  const host = $('#xiHost');
  host.innerHTML = svgOf();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const xi = state.xi || (state.xi = { shows: [], bless: null });
  let phase = 'idle', run = 0, show = null;

  const godName = (id) => halls[id]?.god || '神明';
  // 今天生日的神明（同一天可能兩位，例如二月初二土地公、濟公）
  const today = () => { const L = lunar(); return !L || L.leap ? [] : BIRTHDAYS.filter(([m, d, id]) => L.mon === m && L.day === d && halls[id]); };
  function upcoming(n = 4) {
    const out = [], seen = new Set(), d = new Date();
    for (let i = 0; i < 400 && out.length < n; i++, d.setDate(d.getDate() + 1)) {
      const L = lunar(new Date(d)); if (!L || L.leap) continue;
      for (const b of BIRTHDAYS) if (b[0] === L.mon && b[1] === L.day && halls[b[2]] && !seen.has(b[2])) { seen.add(b[2]); out.push({ b, days: i, text: L.text }); }
    }
    return out;
  }

  /* ----- 戲偶動作 ----- */
  let heroX = HERO_X;
  const pose = { hero: { x: HERO_X, y: 0, r: 0, s: 1 }, foe: { x: FOE_X, y: 0, r: 0, s: 1 } };
  const paint = (k) => { const p = pose[k], el = S(k === 'hero' ? 'xiHero' : 'xiFoe'), flip = k === 'foe' ? -1 : 1; el.setAttribute('transform', `translate(${p.x.toFixed(1)} ${(STAGE_Y + p.y).toFixed(1)}) rotate(${p.r.toFixed(1)} 0 -50) scale(${(flip * p.s).toFixed(3)} ${p.s.toFixed(3)})`); };
  const setPuppet = (k, key) => { S(k === 'hero' ? 'xiHeroArt' : 'xiFoeArt').innerHTML = key ? puppetSVG(key) : ''; };
  async function act(kind, good) {
    const h = pose.hero, f = pose.foe, dir = Math.sign(f.x - h.x) || 1;
    if (kind === 'flip' || kind === 'raise') {
      sfx.drum(); sfx.drum(.12);
      await tween(560, (k) => { h.y = -70 * Math.sin(Math.PI * k); h.r = kind === 'flip' ? 360 * k : 0; paint('hero'); }, (k) => k);
      h.r = 0; paint('hero');
      if (kind === 'raise') { const t = S('xiTablet'); if (t) { t.setAttribute('transform', 'translate(34 -104) scale(1.5)'); setTimeout(() => t.setAttribute('transform', 'translate(32 -54)'), 1400); } }
    } else if (kind === 'hit' || kind === 'near') {
      const x0 = h.x, tx = f.x - dir * (kind === 'near' ? 56 : 40);
      await tween(160, (k) => { h.x = x0 + (tx - x0) * k; h.r = 14 * dir * k; paint('hero'); }, (k) => k * k);
      if (kind === 'hit') {
        sfx.knock(); sfx.gong(.02); shake(svg, good ? 6 : 3); burst('spark', f.x - dir * 20, STAGE_Y - 70, reduce ? 3 : 12);
        await tween(380, (k) => { f.x = FOE_X + dir * 24 * Math.sin(Math.PI * k); f.r = dir * 22 * Math.sin(Math.PI * k); paint('foe'); });
      } else {
        sfx.chime(); for (let i = 0; i < 5; i++) setTimeout(() => emit('heart', (h.x + f.x) / 2 + (Math.random() - .5) * 30, STAGE_Y - 100), i * 90);
      }
      await tween(260, (k) => { h.x = tx + (x0 - tx) * k; h.r = 14 * dir * (1 - k); paint('hero'); });
      heroX = h.x;
    } else if (kind === 'dance') {
      sfx.drum(); sfx.drum(.18); sfx.drum(.36);
      await tween(900, (k) => { h.r = 16 * Math.sin(k * Math.PI * 6); h.y = -8 * Math.abs(Math.sin(k * Math.PI * 6)); paint('hero'); if (show?.play?.love) { f.r = -12 * Math.sin(k * Math.PI * 6); paint('foe'); } }, (k) => k);
      h.r = 0; h.y = 0; paint('hero'); f.r = 0; paint('foe');
    } else if (kind === 'charge') {
      const g = S('xiGlowC'); g.setAttribute('cx', h.x);
      await tween(700, (k) => { g.setAttribute('r', (10 + 60 * k).toFixed(1)); g.setAttribute('opacity', (k * .9).toFixed(2)); h.s = 1 + .12 * k; paint('hero'); });
      sfx.gong(); burst('spark', h.x, STAGE_Y - 70, reduce ? 4 : 20);
      await tween(380, (k) => { g.setAttribute('opacity', ((1 - k) * .9).toFixed(2)); h.s = 1.12 - .12 * k; paint('hero'); });
    }
  }

  /* ----- 1. 點戲 ----- */
  function openStart() {
    if (phase !== 'idle' && phase !== 'done') { say(phase === 'banner' ? '戲演完了，把右下角的<b>紅彩牌</b>拖上戲台掛好。' : '戲還在演，照提示在戲台下面操偶。'); return; }
    const gods = today(), real = gods.length > 0, bal = wallet.balance();
    let god = real ? gods[0][2] : null;
    const rec = (id) => PLAYS.find((p) => p.for.includes(id)) || PLAYS[0];
    let play = rec(god || 'main').id;
    const nxt = !real ? upcoming(1)[0] : null;
    const chips = () => PLAYS.map((p) => `<button type="button" class="chip" data-p="${p.id}" aria-pressed="${p.id === play}">${p.name}${god && p.for.includes(god) ? '・推薦' : ''}</button>`).join('');
    const body = openSheet(real ? '酬神點戲' : '戲台排練', `
      ${real ? `<p>今天是<b>${gods.map((g) => g[3]).join('、')}</b>！廟埕搭起了布袋戲台。出香油錢請一齣戲給${gods.length > 1 ? '神明' : godName(god)}看，演完戲台會掛上你的名字。</p>
        ${gods.length > 1 ? `<div class="chips" id="xiGods">${gods.map((g, i) => `<button type="button" class="chip" data-g="${g[2]}" aria-pressed="${i === 0}">敬${godName(g[2])}</button>`).join('')}</div>` : ''}`
        : `<p>今天沒有神明生日，戲班在<b>排練</b>：可以免費試演，不掛名、沒有好運加成。${nxt ? `<br>下一場是<b>${nxt.b[3]}</b>（${nxt.text}，${nxt.days ? `還有 ${nxt.days} 天` : '就是今天'}）。` : ''}</p>`}
      <p class="hint" style="margin:6px 0 4px">選一齣戲：</p>
      <div class="chips" id="xiPlays">${chips()}</div>
      <p class="hint" id="xiSub">${PLAYS.find((p) => p.id === play).sub}</p>
      ${real ? `<label class="field"><span>敬獻人</span><input type="text" id="xiName" maxlength="8" value="${esc(state.name)}"></label>
        <p class="hint">香油錢 <b>${PRICE}</b> 福氣幣（你有 ${bal}）。演得越好，神明給的好運越多。</p>` : ''}
      <div class="row"><button class="btn" id="xiGo">${real ? `出香油錢 ${PRICE}，開演` : '免費試演'}</button></div>`);
    const pl = body.querySelector('#xiPlays');
    pl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      play = b.dataset.p; pl.querySelectorAll('[data-p]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      body.querySelector('#xiSub').textContent = PLAYS.find((p) => p.id === play).sub;
    });
    body.querySelector('#xiGods')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-g]'); if (!b) return;
      god = b.dataset.g; body.querySelectorAll('[data-g]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      play = rec(god).id; pl.innerHTML = chips(); body.querySelector('#xiSub').textContent = PLAYS.find((p) => p.id === play).sub;
    });
    body.querySelector('#xiGo').addEventListener('click', () => {
      const name = real ? (body.querySelector('#xiName').value.trim().replace(/\s+/g, ' ') || state.name) : '';
      if (real && !wallet.spend(PRICE, `酬神戲・${PLAYS.find((p) => p.id === play).name}`)) {
        body.querySelector('#xiGo').textContent = `福氣幣不夠（要 ${PRICE}）`; sfx.knock(); return;
      }
      closeSheet(); startShow({ real, god, play: PLAYS.find((p) => p.id === play), name });
    });
  }

  /* ----- 2. 開演 ----- */
  async function startShow(o) {
    const r = ++run;
    show = { ...o, score: 0, cues: [...OPENING.cues.map((c) => ({ ...c, opening: true })), ...o.play.cues] };
    phase = 'show';
    S('xiScenery').innerHTML = o.play.sea ? seaSVG : hillSVG;
    S('xiBack').setAttribute('fill', o.play.love ? '#5A3A6A' : o.play.sea ? '#1E3A6A' : '#2A3A5A');
    S('xiBoard').textContent = o.real ? `${o.god === 'main' ? '天上聖母' : godName(o.god)}聖誕` : '酬神戲台';
    S('xiBoard2').textContent = o.play.name;
    setPuppet('hero', OPENING.hero); setPuppet('foe', null);
    Object.assign(pose.hero, { x: HERO_X + 50, y: 0, r: 0, s: 1 }); Object.assign(pose.foe, { x: FOE_X, y: 0, r: 0, s: 1 });
    paint('hero'); paint('foe'); heroX = pose.hero.x;
    cam?.zoom(180, 400, 300);
    say(`${o.real ? `<b>${esc(o.name)}</b>出香油錢 ${PRICE}，請戲班演<b>${o.play.name}</b>給${godName(o.god)}看！` : `排練<b>${o.play.name}</b>。`}<br>你是主演：在戲台<b>下面</b>按住操偶，照提示做動作。`);
    // 鑼鼓開場、拉開布幕
    for (let i = 0; i < 6; i++) sfx.drum(i * .16);
    sfx.gong(1);
    await sleep(1000); if (r !== run) return;
    const half = (OPEN_R - OPEN_L) / 2;
    await tween(800, (k) => { S('xiCurL').setAttribute('width', (half * (1 - k)).toFixed(1)); S('xiCurR').setAttribute('x', ((OPEN_L + OPEN_R) / 2 + half * k).toFixed(1)); S('xiCurR').setAttribute('width', (half * (1 - k)).toFixed(1)); });
    if (r !== run) return;
    S('xiPadG').setAttribute('opacity', '1'); S('xiPad').style.display = '';
    for (let i = 0; i < show.cues.length; i++) {
      if (i === OPENING.cues.length) { // 加官下台、正戲上場
        S('xiCueG').setAttribute('opacity', '0');
        await tween(400, (k) => { pose.hero.y = 110 * k; paint('hero'); });
        setPuppet('hero', o.play.hero); setPuppet('foe', o.play.foe);
        S('xiLove').setAttribute('opacity', '0');
        pose.hero.x = HERO_X; heroX = HERO_X; pose.foe.y = 110; paint('foe');
        sfx.gong();
        await tween(420, (k) => { pose.hero.y = 110 * (1 - k); pose.foe.y = 110 * (1 - k); paint('hero'); paint('foe'); });
        if (r !== run) return;
        say(`加官跳完了，正戲<b>${o.play.name}</b>開演！台上是<b>${P[o.play.hero].name}</b>和<b>${P[o.play.foe].name}</b>。`);
      }
      const res = await cue(show.cues[i], r);
      if (r !== run) return;
      show.score += res;
    }
    await curtainCall(r);
  }

  // 一個提示：等玩家做出對的手勢，或時間到
  let want = null;
  function cue(c, r) {
    return new Promise((resolve) => {
      const [icon, how] = GEST[c.g];
      S('xiCueLine').textContent = c.line;
      S('xiCueG2').textContent = `${icon}　${c.g === 'hit' ? (show.play.love && !c.opening ? '往對方滑過去' : how) : how}`;
      S('xiCueG').setAttribute('opacity', '1');
      const t0 = performance.now();
      let done = false;
      const finish = async (grade) => {
        if (done) return; done = true; want = null;
        S('xiCueG').setAttribute('opacity', '.35');
        emit('text', 180 + (Math.random() - .5) * 80, 300, { text: grade === 2 ? `讚！${c.ok}` : grade ? c.ok : '慢了一拍', color: grade ? '#FFE08A' : '#FFF4E0', size: grade === 2 ? 18 : 15, life: 1.3 });
        await act(c.act, grade > 0);
        if (grade) { sfx.clap(grade === 2 ? 14 : 8); cheer(grade); sfx.buzz(grade === 2 ? [20, 30, 20] : [16]); }
        await sleep(350);
        resolve(grade);
      };
      want = { g: c.g, hit: (grade) => finish(grade) };
      const tick = (now) => {
        if (done || r !== run) { if (!done) { done = true; want = null; resolve(0); } return; }
        const k = (now - t0) / CUE_MS;
        S('xiTimer').setAttribute('width', (280 * Math.max(0, 1 - k)).toFixed(1));
        if (k >= 1) { finish(0); return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      want.t0 = t0;
    });
  }
  const gradeNow = () => (performance.now() - (want?.t0 || 0) < CUE_MS * .5 ? 2 : 1);
  function cheer(grade) {
    S('xiCrowd').classList.remove('xi-cheer'); void S('xiCrowd').getBoundingClientRect(); S('xiCrowd').classList.add('xi-cheer');
    for (let i = 0; i < (grade === 2 ? 6 : 3); i++) setTimeout(() => emit('text', 30 + Math.random() * 300, 590, { text: pick(['好！', '讚！', '水喔！', '好啊！']), color: '#FFE08A', size: 12, life: 1 }), i * 110);
  }

  /* ----- 操偶：手指在戲台下面，戲偶在台上跟著左右走 ----- */
  let drag = null;
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const pad = S('xiPad');
  pad.addEventListener('pointerdown', (e) => {
    if (phase !== 'show') return;
    e.preventDefault(); pad.setPointerCapture(e.pointerId);
    const p = pt(e);
    drag = { pts: [{ x: p.x, y: p.y, t: performance.now() }], x0: p.x, y0: p.y, hx: heroX, rev: 0, lastDir: 0, ext: p.x, hold: null };
    if (want?.g === 'hold') startHold();
  });
  function startHold() {
    const d = drag; if (!d) return;
    const g = S('xiGlowC'); g.setAttribute('cx', pose.hero.x);
    d.hold = setTimeout(() => { if (drag === d && want?.g === 'hold') want.hit(gradeNow()); }, 850);
    const t0 = performance.now();
    const step = (t) => { if (drag !== d || !d.hold || want?.g !== 'hold') { if (want?.g === 'hold') g.setAttribute('opacity', '0'); return; } const k = Math.min(1, (t - t0) / 850); g.setAttribute('r', (10 + 30 * k).toFixed(1)); g.setAttribute('opacity', (k * .6).toFixed(2)); requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  pad.addEventListener('pointermove', (e) => {
    if (!drag || phase !== 'show') return;
    const p = pt(e), now = performance.now(), d = drag;
    d.pts.push({ x: p.x, y: p.y, t: now }); while (d.pts.length && now - d.pts[0].t > 320) d.pts.shift();
    // 戲偶跟著手指左右走（在台上，手指不會擋到）
    if (!want || want.g !== 'hit') {
      pose.hero.x = Math.max(OPEN_L + 30, Math.min(OPEN_R - 30, d.hx + (p.x - d.x0) * .8));
      pose.hero.r = Math.max(-12, Math.min(12, (p.x - (d.pts[d.pts.length - 2]?.x ?? p.x)) * 1.2));
      paint('hero'); heroX = pose.hero.x;
    }
    if (d.hold && Math.hypot(p.x - d.x0, p.y - d.y0) > 16) { clearTimeout(d.hold); d.hold = null; S('xiGlowC').setAttribute('opacity', '0'); }
    if (!want) return;
    const first = d.pts[0];
    if (want.g === 'up' && first.y - p.y > 50) { want.hit(gradeNow()); return; }
    if (want.g === 'hit') {
      const dir = Math.sign(pose.foe.x - pose.hero.x) || 1;
      if ((p.x - first.x) * dir > 50) { want.hit(gradeNow()); return; }
    }
    if (want.g === 'shake') {
      const dir = Math.sign(p.x - d.ext);
      if (Math.abs(p.x - d.ext) > 14 && dir) {
        if (d.lastDir && dir !== d.lastDir) { d.rev++; d.revT = d.revT || now; }
        d.lastDir = dir; d.ext = p.x;
      } else if ((p.x - d.ext) * d.lastDir > 0) d.ext = p.x;
      if (d.rev >= 3) { want.hit(gradeNow()); }
    }
  });
  const up = () => { if (!drag) return; clearTimeout(drag.hold); drag = null; pose.hero.r = 0; if (phase === 'show') paint('hero'); };
  pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
  // 鍵盤／不方便滑的人：按 Enter 就做目前的動作
  svg.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && want) { e.preventDefault(); want.hit(1); } });

  /* ----- 3. 謝幕、掛彩牌 ----- */
  async function curtainCall(r) {
    phase = 'bow'; S('xiCueG').setAttribute('opacity', '0'); S('xiPadG').setAttribute('opacity', '0'); S('xiPad').style.display = 'none';
    const max = show.cues.length * 2, sc = show.score;
    show.grade = sc >= max - 2 ? 2 : sc >= max / 2 ? 1 : 0;
    // 戲偶鞠躬
    await tween(500, (k) => { pose.hero.r = 30 * Math.sin(Math.PI * k); pose.foe.r = 30 * Math.sin(Math.PI * k); paint('hero'); paint('foe'); });
    sfx.gong(); sfx.clap(20); cheer(2);
    if (r !== run) return;
    const words = ['熱熱鬧鬧', '台下一直叫好', '滿堂彩'];
    if (!show.real) {
      say(`排練完畢，${words[show.grade]}！（${sc}/${max} 分）<br>等神明生日那天出香油錢正式演，戲台會掛上你的名字，還有好運加成。`);
      await closeCurtain(); phase = 'done'; cam?.reset(400); return;
    }
    phase = 'banner';
    const b = S('xiBanner'); b.innerHTML = bannerSVG(esc(show.name), show.play.name, 120); b.style.display = ''; banner.home();
    b.classList.remove('pop'); void b.getBoundingClientRect(); b.classList.add('pop');
    cam?.reset(200);
    say(`謝幕！${words[show.grade]}（${sc}/${max} 分）。<br>戲班送上一面<b>紅彩牌</b>：按住右下角的彩牌，拖上戲台掛在屋簷下。`);
  }
  async function closeCurtain() {
    const half = (OPEN_R - OPEN_L) / 2;
    await tween(700, (k) => { S('xiCurL').setAttribute('width', (half * k).toFixed(1)); S('xiCurR').setAttribute('x', ((OPEN_L + OPEN_R) / 2 + half * (1 - k)).toFixed(1)); S('xiCurR').setAttribute('width', (half * k).toFixed(1)); });
  }
  const banner = makeCarrier({
    svg, el: S('xiBanner'), sfx, cam, ring: S('xiHookRing'), lift: 70, radius: 34,
    rest: () => BANNER_REST, target: () => BANNER_HOOK, zoom: () => [180, 330, 260],
    onTap: () => say('按住<b>紅彩牌</b>拿起來，往上拖到戲台屋簷下的金色橫樑。'),
    async onDrop() {
      if (phase !== 'banner') return;
      S('xiBanner').style.display = 'none';
      hang(show.name, show.play.name);
      sfx.gong(); sfx.chime(); sfx.clap(16); sfx.buzz([20, 50, 20, 50, 40]);
      burst('spark', 180, 240, reduce ? 6 : 30);
      const boost = [0.1, 0.12, 0.15][show.grade];
      xi.bless = { day: dayKey(), god: show.god, boost };
      xi.shows.unshift({ day: dayKey(), god: show.god, play: show.play.name, name: show.name, grade: show.grade });
      xi.shows = xi.shows.slice(0, 40);
      let back = 0;
      if (show.grade === 2) { back = 18; wallet.earn(back, '酬神戲滿堂彩，神明回禮', 180, 300); }
      save(); phase = 'done';
      await closeCurtain();
      cam?.reset(300);
      say(`「<b>${esc(show.name)} 敬獻</b>」掛上戲台了！${godName(show.god)}看得很開心。<br>今天到${halls[show.god]?.name || '殿裡'}擲筊，<b>聖筊機率 +${Math.round(boost * 100)}%</b>。${back ? `滿堂彩，神明回禮福氣幣 ${back}。` : ''}`, 'god');
    },
  });
  function hang(name, play) {
    const h = S('xiHung');
    h.innerHTML = `<g transform="translate(${BANNER_HOOK[0]} ${BANNER_HOOK[1] + 30})">${bannerSVG(esc(name), play, 170)}</g>`;
    h.style.display = '';
  }

  /* ----- 紅榜、戲碼表 ----- */
  function openLog() {
    const rows = xi.shows.map((s) => `<li><b>${esc(s.name)}</b> 敬獻${godName(s.god)}《${s.play}》<small>（${s.day}${s.grade === 2 ? '・滿堂彩' : ''}）</small></li>`).join('');
    openSheet('酬神紅榜', rows ? `<ul class="ts-list">${rows}</ul>` : '<p class="hint">還沒有敬獻過。神明生日那天來點一齣戲，名字就會上紅榜。</p>');
  }
  function openList() {
    const g = today(), up = upcoming(6);
    openSheet('戲台檔期', `
      <p>${g.length ? `今天是<b>${g.map((x) => x[3]).join('、')}</b>，戲台開演！` : '戲台只在神明生日搭起來，其他日子在排練。'}</p>
      <ul class="ts-list">${up.map(({ b, days, text }) => `<li><b>${b[3]}</b>　${text}<small>　${days ? `還有 ${days} 天` : '今天'}</small></li>`).join('')}</ul>
      <p class="hint">每齣戲開演前都會先「跳加官」扮仙。香油錢 ${PRICE} 福氣幣，好運加成只在當天、那位神明的殿裡有效。</p>`);
  }

  $('#xiBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-xi]'); if (!b) return;
    const a = b.dataset.xi;
    if (a === 'start') openStart();
    else if (a === 'banner') phase === 'banner' ? banner.auto() : say('正式酬神演完才有紅彩牌可以掛。');
    else if (a === 'list') openList();
    else if (a === 'log') openLog();
  });

  function reset() {
    want = null; drag = null;
    const half = (OPEN_R - OPEN_L) / 2;
    S('xiCurL').setAttribute('width', half); S('xiCurR').setAttribute('x', (OPEN_L + OPEN_R) / 2); S('xiCurR').setAttribute('width', half);
    for (const id of ['xiCueG', 'xiPadG', 'xiGlowC']) S(id).setAttribute('opacity', '0');
    S('xiPad').style.display = 'none'; S('xiBanner').style.display = 'none';
    S('xiBoard').textContent = '酬神戲台';
    const g = today(), mine = xi.shows.find((s) => s.day === dayKey());
    S('xiBoard2').textContent = g.length ? '今日開演' : '排練中';
    if (mine) hang(mine.name, mine.play); else S('xiHung').style.display = 'none';
  }

  return {
    enter() {
      run++; phase = 'idle'; show = null; reset();
      const g = today(), nxt = g.length ? null : upcoming(1)[0];
      say(g.length ? `今天是<b>${g.map((x) => x[3]).join('、')}</b>！廟埕搭起布袋戲台，鑼鼓已經響了。<br>按「<b>點戲</b>」出香油錢請一齣戲。`
        : `戲台空著，戲班在後台排練。神明生日那天才正式開演${nxt ? `，下一場是<b>${nxt.b[3]}</b>（還有 ${nxt.days} 天）` : ''}。<br>想先試試看？按「<b>點戲</b>」免費試演。`);
    },
    leave() { run++; phase = 'idle'; want = null; drag = null; },
    // 給擲筊用：今天在這位神明殿裡的聖筊加成
    boost(hallId) { const b = xi.bless; return b && b.day === dayKey() && b.god === hallId ? b.boost : 0; },
    birthdayToday: () => today(),
  };
}

import './style.css';
import { SCENE_SVG } from './scene.js';
import { CHARS, DEFAULT_CHAR, charById } from './chars.js';
import { FORTUNES, CATEGORIES, DAILY, cn } from './fortunes.js';
import { initFx, emit, burst, onTick, REDUCED_MOTION } from './fx.js';
import * as sfx from './audio.js';
import { renderCard } from './card.js';
import { FURNACE_SVG, bindJoss } from './joss.js';
import { initCaishen } from './caishen.js';
import { initYuelao } from './yuelao.js';
import { tossJiao } from './jiaotoss.js';
import mapUrl from './assets/temple-map.webp';
import hallBg from './assets/hall-bg.webp';
import hallFest from './assets/hall-festival.webp';
import caiBg from './assets/cai/cai-bg.webp';
import caiFest from './assets/cai/cai-festival.webp';
import yueBg from './assets/yue/yue-bg.webp';
import yueFest from './assets/yue/yue-festival.webp';
import tubeUrl from './assets/tube.webp';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

/* ---------- 存檔（只存在這支手機的瀏覽器） ---------- */
const KEY = 'cyber-temple.v1';
const state = {
  name: '香客', char: DEFAULT_CHAR, muted: false,
  fish: 0, streak: 0, lastCheckin: '', affection: 0,
  fortune: null, // { no, cat, wish, date }
};
try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
// 只在這次參拜有效的狀態
const session = { lit: false, incenseUntil: 0, xiaoRun: 0, busy: false, drawFails: 0 };

/* ---------- 日期與農曆 ---------- */
const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const LM = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const LD = (n) => n === 10 ? '初十' : n === 20 ? '二十' : n === 30 ? '三十'
  : (n < 10 ? '初' : n < 20 ? '十' : n < 30 ? '廿' : '三十') + '一二三四五六七八九'[(n % 10) - 1];
function lunar(d = new Date()) {
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
// 節慶廟（方案三）：春節 正月初一～十五、媽祖生 三月廿三、中秋 八月十五、三太子 九月初九。中元不換紅燈籠。
const FESTS = [[1, 1, 15, '春節'], [3, 23, 23, '媽祖聖誕'], [8, 15, 15, '中秋'], [9, 9, 9, '三太子聖誕']];
const fest = L && !L.leap ? FESTS.find(([m, a, b]) => L.mon === m && L.day >= a && L.day <= b) : null;
let festive = !!fest;
// 每座殿：背景、人偶跪的高度（拜墊）、香爐的上下位移。點燭、上香、擲筊、抽籤共用同一套。
const HALLS = {
  main: { name: '正殿', bg: hallBg, fest: hallFest, base: 536, burnerDy: 0 },
  cai: { name: '財神聚寶閣', bg: caiBg, fest: caiFest, base: 536, burnerDy: 0 },
  yue: { name: '月老閣', bg: yueBg, fest: yueFest, base: 593, burnerDy: 14 },
};
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
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}

/* ---------- 場景 ---------- */
$('#sceneHost').innerHTML = SCENE_SVG(hallImg());
// 點農曆可預覽平日／節慶兩種廟（試玩用）
$('#lunar').addEventListener('click', () => {
  festive = !festive;
  $('#hallBg').setAttribute('href', hallImg());
  const inYue = !$('#yueHost').hidden;
  say(festive ? (inYue ? '這是七夕的月老閣：滿天蓮花燈、桃花瓣飄下來。再點一次農曆換回平日。' : '這是過年過節的廟：紅燈籠全掛上了。再點一次農曆換回平日。') : '換回平日的廟。');
});
initFx($('#fx'));
const svg = $('#sceneHost svg');
const S = (id) => svg.getElementById ? svg.getElementById(id) : svg.querySelector('#' + id);

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

const SUB = {}; // 專科殿堂模組（財神、月老），初始化後填入
const drawnToday = () => (hall === 'main' ? !!state.fortune : SUB[hall].hasQianToday());
function markNext() {
  const d = drawnToday();
  const next = !session.lit ? 'candle' : session.incenseUntil < Date.now() && !d ? 'incense' : !d ? 'draw' : hall === 'main' ? 'card' : '';
  document.querySelectorAll('.bar button[data-act]').forEach((b) => b.classList.toggle('next', b.dataset.act === next));
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
  let x = p.x, y = p.y - LIFT;
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
  tool.kind = kind; tool.then = then || null; tool.hold = 0; tool.down = false; tool.sticksLit = false;
  S('tool').style.display = '';
  S('toolLighter').style.display = kind === 'lighter' ? '' : 'none';
  S('toolSticks').style.display = kind === 'sticks' ? '' : 'none';
  S('handTips').setAttribute('opacity', '0');
  svg.style.touchAction = 'none'; $('#sceneWrap').classList.add('tooling');
  placeTool(kind === 'lighter' ? 212 : 230, 470);
  onTick(toolTick);
}
function unequip() {
  tool.kind = null; tool.down = false;
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
      if (dist(tool.x, tool.y + 58, BURNER) < 22) { unequip(); plantIncense(); return false; }
    }
  }
}
svg.addEventListener('pointerdown', (e) => {
  if (!tool.kind) return;
  e.preventDefault(); svg.setPointerCapture(e.pointerId);
  tool.down = true; if (tool.kind === 'lighter') sfx.knock();
  follow(svgPt(e));
});
svg.addEventListener('pointermove', (e) => { if (tool.kind && tool.down) follow(svgPt(e)); });
const lift = () => { tool.down = false; };
svg.addEventListener('pointerup', lift); svg.addEventListener('pointercancel', lift);

/* ---------- 點燭 ---------- */
let flicker = false;
function lightOne(id) {
  if (lit[id]) return;
  lit[id] = true;
  sfx.pop(); sfx.buzz(8);
  S('flame' + id).setAttribute('opacity', '1');
  burst('spark', WICK[id][0], WICK[id][1] - 10, 14);
  if (!flicker) {
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
  if (lit.L && lit.R) {
    session.lit = true; markNext();
    const then = tool.then;
    if (tool.kind === 'lighter') setTimeout(() => { unequip(); then && then(); }, 450);
    if (!then && !tool.quiet) say('兩支蠟燭都點亮了，殿裡暖起來了。接著上香吧。');
  } else if (tool.kind === 'lighter') say('點著一支了！再把火移到另一支蠟燭芯上。');
}
function startLighter(then, text) {
  if (session.lit) { say('燭火已經點著了，很亮喔。接著可以上香。'); return; }
  equip('lighter', then);
  say(text || '拿起打火機了。<b>按住畫面</b>打出火，把火苗移到蠟燭芯（虛線圈）上停一下。兩支都要點。');
}
function lightCandlesNow() { tool.quiet = true; lightOne('L'); lightOne('R'); tool.quiet = false; }

/* ---------- 上香 ---------- */
const BURN = 180; // 秒
const STICKS = [[172, 214, 162, 168], [180, 214, 180, 162], [188, 214, 198, 168]];
function startIncense() {
  if (session.incenseUntil > Date.now()) { say('香還在燒，心意神明收到了。可以抽籤或擲筊問事。'); return; }
  if (!session.lit) { startLighter(startIncense, '香要從燭火點，先拿打火機把兩支蠟燭點亮。<b>按住畫面</b>打火，移到蠟燭芯上。'); return; }
  equip('sticks');
  say('拿起三炷香了。<b>按住畫面</b>把香頭移到燭火上點著。');
}
function bow() {
  const a = S('avatarImg');
  a.classList.remove('bow'); void a.getBoundingClientRect(); a.classList.add('bow');
}
function plantIncense() {
  session.incenseUntil = Date.now() + BURN * 1000;
  routeDone(hall);
  sfx.pop(); sfx.buzz(8); bow();
  burst('spark', 182, 305 + HALLS[hall].burnerDy, 10);
  runIncense();
  say('三炷清香插進香爐，青煙裊裊往上飄。可以抽籤問事，拜完也可以去廟埕的金爐<b>燒金紙</b>。');
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
    const r = Math.random();
    const key = r < 0.5 ? 'sheng' : r < 0.75 ? 'xiao' : 'yin';
    const faces = [...JIAO[key].faces]; if (Math.random() < 0.5) faces.reverse();
    const jdy = Math.min(26, HALLS[hall].base - 536);
    const blocks = [
      { el: S('jiaoA'), x0: 172, y0: 480, x1: rand(132, 158), y1: rand(580, 596) + jdy, spin: rand(540, 900) * (Math.random() < .5 ? -1 : 1), end: rand(-25, 25) },
      { el: S('jiaoB'), x0: 192, y0: 480, x1: rand(206, 232), y1: rand(584, 600) + jdy, spin: rand(540, 900) * (Math.random() < .5 ? -1 : 1), end: rand(-25, 25) },
    ];
    const dur = REDUCED_MOTION ? 0.2 : 0.95;
    let t0 = null, landed = false;
    blocks.forEach((b) => b.el.setAttribute('opacity', '1'));
    onTick((t) => {
      if (t0 === null) t0 = t;
      const k = Math.min(1, (t - t0) / dur);
      blocks.forEach((b, i) => {
        const x = b.x0 + (b.x1 - b.x0) * k;
        const y = b.y0 + (b.y1 - b.y0) * k - 150 * 4 * k * (1 - k);
        const rot = b.end + b.spin * (1 - k);
        const flipping = k < 1 && Math.floor((b.spin * k) / 150) % 2 === 0;
        setFace(b.el, k < 1 ? (flipping ? 'flat' : 'round') : faces[i]);
        const sc = 1 + 0.35 * Math.sin(Math.PI * k);
        b.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(3)} ${(sc * (k < 1 ? Math.abs(Math.cos((b.spin * k) * Math.PI / 300)) * .6 + .4 : 1)).toFixed(3)})`);
      });
      if (k >= 1 && !landed) {
        landed = true; sfx.knock(); sfx.knock(0.09); sfx.buzz([10, 40, 10]);
        setTimeout(() => resolve(key), 250);
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
function openDraw() {
  if (session.busy) return;
  if (session.incenseUntil < Date.now() && !session.lit) say('通常會先點燭、上香再抽籤，不過心誠最重要，直接來也可以。');
  const body = openSheet(`向${hall === 'main' ? '神明' : SUB[hall].god}稟報`, `
    <p class="hint">抽籤前先報上自己是誰、想問什麼。一次問一件事，同一件事不要一直重抽。</p>
    <label class="field"><span>稱呼</span><input type="text" id="drawName" maxlength="12" value="${esc(state.name)}"></label>
    ${hall === 'main' ? `<div class="field"><span>想問的方向</span>${chipGroup('cat', CATEGORIES, draft.cat)}</div>` : `<p class="hint">今天抽的是<b>${SUB[hall].qianName}</b>。</p>`}
    <label class="field"><span>心願（選填，會印在祈福卡上）</span><input type="text" id="drawWish" maxlength="30" placeholder="例：期末考順利歐趴" value="${esc(draft.wish)}"></label>
    <button class="btn" id="goShake">稟報完畢，搖籤筒</button>`);
  bindChips(body, (_, v) => { draft.cat = v; });
  $('#goShake').addEventListener('click', () => {
    const n = $('#drawName').value.trim();
    if (n) { state.name = n; save(); paintAvatar(); }
    draft.wish = $('#drawWish').value.trim();
    session.drawFails = 0;
    shake();
  });
}

const TUBE = `<svg viewBox="0 0 140 170" aria-hidden="true"><g class="tube" id="bigTube"><image href="${tubeUrl}" x="38" y="6" width="63" height="160"/></g>
  <g id="outStick" style="display:none"><rect x="96" y="0" width="12" height="70" rx="5" fill="#E8C77A" transform="rotate(18 102 35)"/><rect x="96" y="0" width="12" height="12" rx="5" fill="#C8352B" transform="rotate(18 102 35)"/></g></svg>`;

async function shake() {
  const body = openSheet('搖籤筒', `
    <div class="tube-stage">${TUBE}</div>
    <p class="stick-no" id="stickNo">沙沙沙……</p>
    <p class="hint" id="shakeHint">籤筒稍微往前傾，輕輕搖到一支籤跳出來。</p>
    <button class="btn" id="goConfirm" hidden>擲筊請示神明</button>`);
  const tube = $('#bigTube', body);
  tube.classList.add('shake'); sfx.rattle(1.4); sfx.buzz([20, 40, 20, 40, 20]);
  await sleep(REDUCED_MOTION ? 300 : 1500);
  if ($('#sheet').hidden) return;
  tube.classList.remove('shake');
  draft.no = 1 + Math.floor(Math.random() * (hall === 'main' ? FORTUNES.length : SUB[hall].qianCount));
  $('#outStick', body).style.display = '';
  $('#stickNo', body).textContent = `第${cn(draft.no)}籤`;
  $('#shakeHint', body).textContent = '要擲出聖筊，神明確認是這一支，才算數。';
  sfx.knock();
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
  if (key === 'sheng') {
    sfx.chime();
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
      <h3>神明小叮嚀</h3>
      <p>${f.tip}</p>
      <details><summary class="hint">看其他方向的解釋</summary>
        ${others.map((c) => `<p><span class="tag">${c.name}</span>${f[c.id]}</p>`).join('')}
      </details>
    </div>
    <p class="hint">籤詩是心靈參考，重要的決定還是要和信任的人商量。</p>
    <div class="row"><button class="btn" id="toCard">做成祈福卡</button><button class="btn ghost" id="keep">收下籤詩</button></div>
    <button class="btn ghost" id="askOther">問另一件事，重新稟報</button>`);
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
  return gain;
}

function petTiger() {
  catHappy();
  state.affection += 1; save();
  const gain = checkin();
  if (gain) {
    burst('fish', 130, 430, Math.min(gain, 5));
    say(`虎爺伸了個懶腰，叼來今天的開運小魚乾 ×${gain}！${state.streak % 7 === 0 ? '連續七天，加碼！' : `已連續參拜 ${state.streak} 天。`}${isYa ? '今天做牙，虎爺加菜雙倍。' : ''}點右上角小魚乾可以餵虎爺。`, 'cat');
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
const OFFER_IDS = ['offFlowerL', 'offFlowerR', 'offFruit', 'offCakes', 'offTea'];
function offerGifts() {
  if (session.offered) { burst('heart', 182, 370, 6); say('供品都擺好了，神明收到你的心意。'); return; }
  session.offered = true; session.busy = true;
  say('雙手捧著鮮花、水果、糕餅和清茶，一樣一樣擺上供桌……');
  OFFER_IDS.forEach((id, i) => setTimeout(() => {
    const el = S(id); el.style.display = ''; el.classList.remove('pop'); void el.getBoundingClientRect(); el.classList.add('pop');
    sfx.pop(); const b = el.getBBox(); burst('spark', b.x + b.width / 2, b.y + 6, 5);
    if (i === OFFER_IDS.length - 1) {
      session.busy = false; bow(); sfx.chime(); S('halo').setAttribute('opacity', '.7');
      say('供品擺好了。鮮花表敬意、水果求平安、糕餅圓滿、清茶清心。');
    }
  }, 380 * i));
}
function greetDeity() {
  const h = S('halo'); h.setAttribute('opacity', '.75');
  burst('spark', 182, 290, 12);
  const i = Math.floor(Math.random() * DAILY.length);
  say(DAILY[i], 'god');
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
    <button class="btn" id="avSave">完成，回到大殿</button>`);
  body.querySelector('.char-grid').addEventListener('click', (e) => {
    const b = e.target.closest('.char'); if (!b) return;
    pick = b.dataset.id;
    body.querySelectorAll('.char').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  });
  $('#avSave').addEventListener('click', () => {
    state.char = pick; state.name = $('#avName').value.trim() || '香客'; save(); paintAvatar();
    closeSheet(); say(`${esc(state.name)}，歡迎回到大殿。`);
  });
}

/* ---------- 綁定 ---------- */
const ACTIONS = {
  candle: () => startLighter(), incense: startIncense, jiao: freeJiao, joss: openJoss,
  draw: () => (hall !== 'main' ? (SUB[hall].hasQianToday() ? SUB[hall].openQian() : openDraw())
    : state.fortune && state.fortune.date === dayKey() ? showFortune() : openDraw()),
  card: openCard, offer: offerGifts, deity: greetDeity, tiger: petTiger, qing: ringQing,
};
// 用鍵盤（沒有拖曳）時，點燭、上香直接完成
const QUICK = {
  candle: () => { if (session.lit) return startLighter(); lightCandlesNow(); say('兩支蠟燭都點亮了，殿裡暖起來了。接著上香吧。'); },
  incense: incenseNow,
};
function act(name, keyboard) {
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
}

/* ---------- 全廟地圖 ---------- */
// x / y 是標籤中心在地圖上的百分比，w 是寬度百分比（要蓋住原圖上的標籤）
const AREAS = [
  { id: 'hall', name: '正殿・進入參拜', x: 51.1, y: 31.3, w: 24, main: true },
  { id: 'backyard', name: '後院靜心閣', x: 51.1, y: 3.7, w: 23, title: true, info: '後院長效靜心閣：點一支 25 分鐘會慢慢融化的蠟燭，配著古寺夜雨聲專心讀書。' },
  { id: 'study', name: '伴讀自習室', x: 70, y: 7.1, w: 19.5, info: '伴讀自習室：番茄鐘燃燭計時，手機橫放就是開運桌面擺飾。' },
  { id: 'sleep', name: '睡前熄燈室', x: 78.7, y: 13.2, w: 13, info: '睡前熄燈室：睡前一分鐘擦去灰塵濁氣，敲磬三下，螢幕慢慢暗下來。' },
  { id: 'wings', name: '兩廂專科殿堂', x: 50.6, y: 19.2, w: 19.5, title: true, info: '兩廂專科殿堂：文昌、財神、濟公、月老、觀音、天公、母娘、彌勒、太歲九座殿。' },
  { id: 'jigong', name: '濟公解憂林', x: 25.3, y: 20.5, w: 12.5, info: '濟公解憂林：讓濟公師父用破芭蕉扇拍散執念，跳出看破人生的語錄。' },
  { id: 'yuelao', name: '月老閣', x: 79.1, y: 20.5, w: 11, main: true, info: '月老閣：抽清醒戀愛籤，和另一半一起綁定連理紅燭。' },
  { id: 'wenchang', name: '文昌閣', x: 14.4, y: 31.3, w: 9, info: '文昌閣：求考運，准考證順時針過香爐三圈。' },
  { id: 'caishen', name: '財神聚寶閣', x: 87.2, y: 31.3, w: 16, main: true, info: '財神聚寶閣：摸摸大金元寶，今日財氣 +88。' },
  { id: 'board', name: '媽祖遶境看板', x: 76.7, y: 61.1, w: 14, h: 4.4, info: '媽祖遶境看板：三月瘋媽祖，跟著神轎路線，用走路步數換算隨香公里數。' },
  { id: 'banquet', name: '流水席辦桌', x: 50.3, y: 77.7, w: 21.5, info: '流水席紅圓桌：全服一起湊菜，湊滿就開席。' },
  { id: 'jinting', name: '環保金亭', x: 71.1, y: 78.7, w: 18.5, h: 4.4, main: true, info: '環保金亭：把寫好的祈願疏文化成青煙，上達天聽。' },
  { id: 'pond', name: '許願放生池', x: 85, y: 81.1, w: 12, info: '許願放生池：把蓮花水燈放進池裡，看它慢慢綻放。' },
  { id: 'shoujing', name: '青衣阿嬤收驚', x: 17.6, y: 82.8, w: 22.5, info: '青衣阿嬤收驚攤：寫下委屈字條化煙，阿嬤持香為你拂塵安神。' },
  { id: 'xiaoren', name: '鵝頸橋打小人', x: 87.2, y: 85.4, w: 17.5, info: '鵝頸橋打小人攤：寫下討厭的代號，婆婆用舊拖鞋幫你打走霉運。' },
  { id: 'gate', name: '朱紅牌樓山門', x: 50, y: 89.8, w: 15, info: '朱紅牌樓山門：跨過門檻，就從日常切換到廟裡的氛圍。' },
  { id: 'wash', name: '淨身石槽', x: 30, y: 98, w: 14, h: 4.4, info: '淨身石槽：用楊柳枝沾抹草水，擦去一身灰塵濁氣。' },
];

function buildMap() {
  const wrap = $('#mapWrap');
  $('#mapImg').src = mapUrl;
  const html = AREAS.map((a) => `<button type="button" class="area${a.main ? ' main' : ''}${a.title ? ' title' : ''}" data-area="${a.id}"
    style="left:${a.x}%;top:${a.y}%;min-width:${a.w}%;${a.h ? `min-height:${a.h * 1.433}cqw;` : ''}">${esc(a.name)}</button>`).join('');
  wrap.insertAdjacentHTML('beforeend', `<button type="button" class="hall-hit" data-area="hall" aria-label="進入正殿參拜"></button><div class="plaque">心靈大廟</div>${html}`);
  wrap.addEventListener('click', (e) => {
    const b = e.target.closest('[data-area]'); if (!b) return;
    const a = AREAS.find((x) => x.id === b.dataset.area);
    if (a.id === 'hall') { showHall(); return; }
    if (a.id === 'caishen') { showCai(); return; }
    if (a.id === 'yuelao') { showYue(); return; }
    if (a.id === 'jinting') { openJoss(); return; }
    sfx.knock();
    say(`${a.info}這一區還在興建中，目前開放的是正殿、財神聚寶閣和月老閣。`);
  });
}

/* ---------- 今日參拜路線：像真的去廟裡，一殿一殿拜，最後到金亭化金紙 ---------- */
const ROUTE = [
  { id: 'main', name: '正殿', area: 'hall', how: '上香' },
  { id: 'cai', name: '財神閣', area: 'caishen', how: '上香' },
  { id: 'yue', name: '月老閣', area: 'yuelao', how: '上香' },
  { id: 'joss', name: '金亭', area: 'jinting', how: '化金紙' },
];
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
  const r = route();
  if (r.done.includes(id)) return;
  r.done.push(id); save(); paintRoute();
  if (r.bonus || !ROUTE.every((x) => r.done.includes(x.id))) return;
  r.bonus = true; state.fish += 3; save(); updateFish();
  setTimeout(() => {
    sfx.chime(); sfx.buzz([20, 60, 20, 60, 40]);
    say('今日參拜<b>圓滿</b>！正殿、財神、月老都拜過，金紙也化了。虎爺叼來開運小魚乾 ×3，明天再來走一趟吧。', 'cat');
    if (!$('#sceneWrap').hidden) burst('spark', 182, 300, REDUCED_MOTION ? 6 : 30);
  }, 1600);
}
function openStep(id) {
  const st = ROUTE.find((x) => x.id === id);
  if (id === 'main') showHall(); else if (id === 'cai') showCai(); else if (id === 'yue') showYue(); else openJoss();
  return st;
}

function showMap() {
  if (tool.kind) unequip();
  $('#sceneWrap').hidden = true; $('#bar').hidden = true; $('#caiBar').hidden = true; $('#yueBar').hidden = true; $('#mapView').hidden = false;
  $('#btnMap').hidden = true; $('#routeBar').hidden = false; paintRoute();
  const r = route(), next = ROUTE.find((x) => !r.done.includes(x.id));
  say(!r.done.length ? '這是心靈大廟全區。像真的去廟裡一樣，照下面的<b>今日參拜路線</b>走：先拜正殿，再到財神閣、月老閣，最後到金亭化金紙。'
    : next ? `已經拜了 ${r.done.length} 站，下一站是<b>${next.name}</b>（${next.how}）。點下面的路線或地圖上的紅色標籤過去。`
    : '今天的參拜路線都走完了，圓滿！想再進去哪座殿坐坐都可以。');
}

// 每座殿各自記得蠟燭、香的狀態（這次參拜的，不存檔）
const hallState = {};
function switchHall(h) {
  if (tool.kind) unequip();
  hallState[hall] = { lit, sLit: session.lit, until: session.incenseUntil };
  hall = h;
  const st = hallState[h] || { lit: { L: false, R: false }, sLit: false, until: 0 };
  lit = st.lit; session.lit = st.sLit; session.incenseUntil = st.until;
  const H = HALLS[h], dy = H.base - 536;
  BURNER = [182, 356 + H.burnerDy];
  $('#hallBg').setAttribute('href', hallImg());
  for (const id of ['mainOnlyA', 'mainOnlyB', 'mainOnlyC']) S(id).style.display = h === 'main' ? '' : 'none';
  S('avatarG').setAttribute('transform', `translate(0 ${dy})`);
  S('burnerG').setAttribute('transform', `translate(0 ${H.burnerDy})`);
  for (const k of ['L', 'R']) { S('flame' + k).setAttribute('opacity', lit[k] ? '1' : '0'); if (!lit[k]) S('glow' + k).setAttribute('opacity', '0'); }
  if (session.incenseUntil > Date.now()) runIncense(); else { incenseRun++; S('incense').style.display = 'none'; }
  $('#mapView').hidden = true; $('#sceneWrap').hidden = false; $('#btnMap').hidden = false; $('#routeBar').hidden = true;
  $('#bar').hidden = h !== 'main';
  for (const k of ['A', 'B']) S('jiao' + k).setAttribute('opacity', '0');
  for (const k of ['cai', 'yue']) { $(`#${k}Host`).hidden = k !== h; $(`#${k}Bar`).hidden = k !== h; }
  sfx.bowl();
  markNext();
}
function showHall() { switchHall('main'); greet(); }
function showYue() { switchHall('yue'); yue.enter(charById(state.char)); }
function showCai() { switchHall('cai'); cai.enter(charById(state.char)); }
$('#btnMap').addEventListener('click', showMap);
$('#routeBar').addEventListener('click', (e) => { const b = e.target.closest('[data-step]'); if (b) openStep(b.dataset.step); });
const cai = initCaishen({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc });
const yue = initYuelao({ $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc });
SUB.cai = cai; SUB.yue = yue;
buildMap();

showMap();

// PWA：只在正式網站（非內嵌預覽）註冊離線快取
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.top === window.self) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

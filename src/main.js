import './style.css';
import { SCENE_SVG } from './scene.js';
import { OPTIONS, DEFAULT_AVATAR, avatarMarkup } from './avatar.js';
import { FORTUNES, CATEGORIES, DAILY, cn } from './fortunes.js';
import { initFx, emit, burst, onTick, REDUCED_MOTION } from './fx.js';
import * as sfx from './audio.js';
import { renderCard } from './card.js';
import mapUrl from './assets/temple-map.webp';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

/* ---------- 存檔（只存在這支手機的瀏覽器） ---------- */
const KEY = 'cyber-temple.v1';
const state = {
  name: '香客', avatar: { ...DEFAULT_AVATAR }, muted: false,
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
    return { text: `農曆${leap ? '閏' : ''}${LM[mon - 1]}月${LD(day)}`, day };
  } catch { return null; }
}
const L = lunar();
const isYa = !!L && (L.day === 2 || L.day === 16); // 初二、十六做牙
const today = new Date();
const dateLine = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}${L ? '・' + L.text : ''}`;
$('#lunar').innerHTML = L ? `${L.text}${isYa ? '<br><b>今日做牙</b>' : ''}` : '';

/* ---------- 對話列 ---------- */
const WHO = { temple: ['廟公', ''], cat: ['虎爺', 'cat'], god: ['神明指引', 'god'] };
function say(text, who = 'temple') {
  const el = $('#say'), w = $('#sayWho');
  w.textContent = WHO[who][0]; w.className = 'say-who ' + WHO[who][1];
  $('#sayText').innerHTML = text;
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}

/* ---------- 場景 ---------- */
$('#sceneHost').innerHTML = SCENE_SVG;
initFx($('#fx'));
const svg = $('#sceneHost svg');
const S = (id) => svg.getElementById ? svg.getElementById(id) : svg.querySelector('#' + id);

function paintAvatar() {
  S('avatarSlot').innerHTML = avatarMarkup(state.avatar);
  $('#meThumb').innerHTML = avatarMarkup(state.avatar);
  $('#meName').textContent = state.name;
}
paintAvatar();

function updateFish() { $('#fishCount').textContent = state.fish; }
updateFish();

function markNext() {
  const next = !session.lit ? 'candle' : session.incenseUntil < Date.now() && !state.fortune ? 'incense' : !state.fortune ? 'draw' : 'card';
  document.querySelectorAll('.bar button').forEach((b) => b.classList.toggle('next', b.dataset.act === next));
}

/* ---------- 點燭 ---------- */
function lightCandles(quiet) {
  if (session.lit) { if (!quiet) say('燭火已經點著了，很亮喔。接著可以上香。'); return; }
  session.lit = true;
  sfx.pop(); setTimeout(sfx.pop, 160); sfx.buzz(8);
  for (const id of ['L', 'R']) {
    S('flame' + id).setAttribute('opacity', '1');
    burst('spark', id === 'L' ? 80 : 280, 168, 14);
  }
  onTick((t) => {
    // 規格書的燭光公式：alpha = 0.8 + 0.2 * sin(time * frequency)
    const a = 0.8 + 0.2 * Math.sin(t * 7), b = 0.8 + 0.2 * Math.sin(t * 5.3 + 1);
    S('glowL').setAttribute('opacity', a.toFixed(3));
    S('glowR').setAttribute('opacity', b.toFixed(3));
    S('flameL').setAttribute('transform', `translate(80 176) scale(${(0.95 + 0.07 * Math.sin(t * 11)).toFixed(3)} ${(0.97 + 0.08 * Math.sin(t * 9)).toFixed(3)})`);
    S('flameR').setAttribute('transform', `translate(280 176) scale(${(0.95 + 0.07 * Math.sin(t * 10 + 2)).toFixed(3)} ${(0.97 + 0.08 * Math.sin(t * 8 + 1)).toFixed(3)})`);
    S('halo').setAttribute('opacity', (0.85 + 0.1 * Math.sin(t * 1.5)).toFixed(3));
  });
  if (!quiet) say('兩支小胖蠟燭點亮了，殿裡暖起來了。接著上香吧。');
  markNext();
}

/* ---------- 上香 ---------- */
const BURN = 180; // 秒
const STICKS = [[172, 214, 162, 168], [180, 214, 180, 162], [188, 214, 198, 168]];
function offerIncense() {
  if (session.incenseUntil > Date.now()) { say('香還在燒，心意神明收到了。可以抽籤或擲筊問事。'); return; }
  const auto = !session.lit;
  lightCandles(true);
  session.incenseUntil = Date.now() + BURN * 1000;
  S('incense').style.display = '';
  sfx.pop(); sfx.buzz(8);
  burst('spark', 180, 165, 10);
  let acc = 0;
  onTick((t, dt) => {
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
      emit('smoke', x1 + (x2 - x1) * k, y1 + (y2 - y1) * k - 2);
    }
  });
  say((auto ? '幫你先把燭點好了。' : '') + '三炷清香插進香爐，青煙裊裊往上飄。可以在心裡跟神明說說話，再來抽籤。');
  markNext();
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
function throwJiao() {
  return new Promise((resolve) => {
    const r = Math.random();
    const key = r < 0.5 ? 'sheng' : r < 0.75 ? 'xiao' : 'yin';
    const faces = [...JIAO[key].faces]; if (Math.random() < 0.5) faces.reverse();
    const blocks = [
      { el: S('jiaoA'), x0: 166, y0: 470, x1: rand(138, 162), y1: rand(362, 376), spin: rand(540, 900) * (Math.random() < .5 ? -1 : 1), end: rand(-25, 25) },
      { el: S('jiaoB'), x0: 194, y0: 470, x1: rand(198, 222), y1: rand(366, 382), spin: rand(540, 900) * (Math.random() < .5 ? -1 : 1), end: rand(-25, 25) },
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
  say('在心裡默念想問的事，一次只問一件，問成「是不是」的問題。筊杯擲出去囉……');
  const key = await throwJiao();
  session.busy = false;
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
  const body = openSheet('向神明稟報', `
    <p class="hint">抽籤前先報上自己是誰、想問什麼。一次問一件事，同一件事不要一直重抽。</p>
    <label class="field"><span>稱呼</span><input type="text" id="drawName" maxlength="12" value="${esc(state.name)}"></label>
    <div class="field"><span>想問的方向</span>${chipGroup('cat', CATEGORIES, draft.cat)}</div>
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

const TUBE = `<svg viewBox="0 0 140 170" aria-hidden="true"><g class="tube" id="bigTube">
  <g stroke="#E8C77A" stroke-width="7" stroke-linecap="round"><path d="M42 70V30M56 70V18M70 70V24M84 70V14M98 70V28"/></g>
  <g stroke="#C8352B" stroke-width="7" stroke-linecap="round"><path d="M42 30v0M56 18v0M70 24v0M84 14v0M98 28v0"/></g>
  <rect x="30" y="64" width="80" height="100" rx="10" fill="#2F6B5E"/><rect x="30" y="78" width="80" height="8" fill="#E6B85C"/><rect x="30" y="142" width="80" height="8" fill="#E6B85C"/>
  <text x="70" y="124" text-anchor="middle" font-family="Noto Serif TC, serif" font-weight="900" font-size="28" fill="#F6D98A">籤</text></g>
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
  draft.no = 1 + Math.floor(Math.random() * FORTUNES.length);
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
  await sleep(500);
  const key = await throwJiao();
  session.busy = false;
  if (key === 'sheng') {
    sfx.chime();
    say(`聖筊！神明確認就是第${cn(draft.no)}籤，去看籤詩吧。`, 'god');
    state.fortune = { no: draft.no, cat: draft.cat, wish: draft.wish, date: dayKey() };
    save(); markNext();
    burst('spark', 180, 370, 18);
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
  const url = await renderCard({ avatar: state.avatar, name: state.name, dateLine, fortune: f, category: cat?.name, wish: state.fortune?.wish, daily: DAILY[dIdx] });
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
  burst('heart', 180, 280, 5);
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
    burst('fish', 180, 290, Math.min(gain, 5));
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
      catHappy(); burst('fish', 180, 300, 1);
      emit('text', 180, 262, { text: '好感 +10', color: '#FFD0A0' });
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
  emit('text', 56, 400, { text: CALM[Math.floor(Math.random() * CALM.length)] });
  say('噹——磬聲慢慢散開。跟著吸氣四秒，停兩秒，再吐氣四秒。');
}
function greetDeity() {
  const h = S('halo'); h.setAttribute('opacity', '1');
  burst('spark', 180, 125, 12);
  const i = Math.floor(Math.random() * DAILY.length);
  say(DAILY[i], 'god');
}

/* ---------- 捏人偶 ---------- */
function openAvatar() {
  const draft = { ...DEFAULT_AVATAR, ...state.avatar };
  const swatches = (group, list) => `<div class="chips" data-swatch="${group}">${list.map((c) => `<button type="button" class="swatch" style="background:${c}" data-v="${c}" aria-label="${{ skin: '膚色', hairColor: '髮色', eyeColor: '瞳色' }[group]} ${c}" aria-pressed="${draft[group] === c}"></button>`).join('')}</div>`;
  const body = openSheet('捏我的 Q 版人偶', `
    <div class="av-preview"><svg viewBox="0 0 100 120" id="avPrev" aria-label="人偶預覽">${avatarMarkup(draft)}</svg></div>
    <label class="field"><span>暱稱</span><input type="text" id="avName" maxlength="12" value="${esc(state.name)}"></label>
    <div class="field"><span>髮型</span>${chipGroup('hair', OPTIONS.hair, draft.hair)}</div>
    <div class="field"><span>髮色</span>${swatches('hairColor', OPTIONS.hairColor)}</div>
    <div class="field"><span>膚色</span>${swatches('skin', OPTIONS.skin)}</div>
    <div class="field"><span>眼睛</span>${chipGroup('eyes', OPTIONS.eyes, draft.eyes)}</div>
    <div class="field"><span>瞳色</span>${swatches('eyeColor', OPTIONS.eyeColor)}</div>
    <div class="field"><span>穿著</span>${chipGroup('outfit', OPTIONS.outfit, draft.outfit)}</div>
    <div class="field"><span>配件</span>${chipGroup('acc', OPTIONS.acc, draft.acc)}</div>
    <p class="hint">這是免費版人偶（方案 A）。上傳照片生成 3D 黏土人偶（方案 B）要接雲端 AI，之後再做。</p>
    <button class="btn" id="avSave">完成，回到大殿</button>`);
  const repaint = () => { $('#avPrev', body).innerHTML = avatarMarkup(draft); };
  bindChips(body, (g, v) => { draft[g] = v; repaint(); });
  body.querySelectorAll('[data-swatch]').forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    draft[g.dataset.swatch] = b.dataset.v; repaint();
  }));
  $('#avSave').addEventListener('click', () => {
    state.avatar = draft; state.name = $('#avName').value.trim() || '香客'; save(); paintAvatar();
    closeSheet(); say(`${esc(state.name)}，歡迎回到大殿。`);
  });
}

/* ---------- 綁定 ---------- */
const ACTIONS = {
  candle: () => lightCandles(), incense: offerIncense, jiao: freeJiao,
  draw: () => (state.fortune && state.fortune.date === dayKey() ? showFortune() : openDraw()),
  card: openCard, deity: greetDeity, tiger: petTiger, qing: ringQing,
};
document.querySelector('.bar').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-act]'); if (b) ACTIONS[b.dataset.act]();
});
svg.addEventListener('click', (e) => {
  const h = e.target.closest('[data-hit]'); if (h && !session.busy) ACTIONS[h.dataset.hit]();
});
svg.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const h = e.target.closest('[data-hit]'); if (h) { e.preventDefault(); ACTIONS[h.dataset.hit](); }
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
if (state.lastCheckin !== dayKey()) say(`歡迎來參拜${state.name !== '香客' ? '，' + esc(state.name) : ''}。先點燭、上香，再抽籤。供桌下的橘貓虎爺也在等你摸摸祂。${isYa ? '今天是做牙日，虎爺的小魚乾雙倍。' : ''}`);
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
  { id: 'yuelao', name: '月老閣', x: 79.1, y: 20.5, w: 11, info: '月老閣：抽清醒戀愛籤，和另一半一起綁定連理紅燭。' },
  { id: 'wenchang', name: '文昌閣', x: 14.4, y: 31.3, w: 9, info: '文昌閣：求考運，准考證順時針過香爐三圈。' },
  { id: 'caishen', name: '財神聚寶閣', x: 87.2, y: 31.3, w: 16, info: '財神聚寶閣：摸摸大金元寶，今日財氣 +88。' },
  { id: 'board', name: '媽祖遶境看板', x: 76.7, y: 61.1, w: 14, h: 4.4, info: '媽祖遶境看板：三月瘋媽祖，跟著神轎路線，用走路步數換算隨香公里數。' },
  { id: 'banquet', name: '流水席辦桌', x: 50.3, y: 77.7, w: 21.5, info: '流水席紅圓桌：全服一起湊菜，湊滿就開席。' },
  { id: 'jinting', name: '環保金亭', x: 71.1, y: 78.7, w: 18.5, h: 4.4, info: '環保金亭：把寫好的祈願疏文化成青煙，上達天聽。' },
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
    sfx.knock();
    say(`${a.info}這一區還在興建中，目前開放的是正殿。`);
  });
}

function showMap() {
  $('#sceneWrap').hidden = true; $('#bar').hidden = true; $('#mapView').hidden = false;
  $('#btnMap').hidden = true;
  say('這是心靈大廟全區。從山門走進來，正殿已經開放參拜，其他殿堂陸續興建中。點紅色的「正殿」進去吧。');
}

function showHall() {
  $('#mapView').hidden = true; $('#sceneWrap').hidden = false; $('#bar').hidden = false;
  $('#btnMap').hidden = false;
  sfx.bowl();
  greet();
  markNext();
}
$('#btnMap').addEventListener('click', showMap);
buildMap();

showMap();

// PWA：只在正式網站（非內嵌預覽）註冊離線快取
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.top === window.self) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// 節慶小遊戲：日曆、節慶印章冊、小遊戲舞台（自己的 SVG，蓋在殿的場景上面）。
// 每個小遊戲是一個 { id, play(stage, opt) }，在 games-*.js 裡。
// 手勢規則：拿起來的東西浮在手指上方（手指不會擋住），做動作時鏡頭拉近那一塊。
const ART = import.meta.glob('../assets/fest/*.webp', { eager: true, import: 'default' });

/* ---------- 美術：有 Gemini 圖就用圖，沒有先用手繪 SVG 代替 ---------- */
// 道具一律以中心為原點；w、h 是畫面上的大小
export function art(key, w, h, fallback) {
  const url = ART[`../assets/fest/${key}.webp`];
  if (url) return `<image href="${url}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
  return typeof fallback === 'function' ? fallback(w, h) : fallback;
}
export const hasArt = (key) => !!ART[`../assets/fest/${key}.webp`];
export const artUrl = (key) => ART[`../assets/fest/${key}.webp`];

/* ---------- 日曆 ---------- */
let fmt = null;
// 瀏覽器內建農曆（ICU）在新月剛好接近午夜時會差一天：2027 年春節實際是 2/6（新月 2/6 23:56 台灣時間），ICU 算成 2/7。
// 正月初一～三十（2027/2/6～3/7）手動修正。
export function lunarFix(d) {
  const y = d.getFullYear(), t = new Date(y, d.getMonth(), d.getDate()).getTime();
  if (y === 2027 && t >= new Date(2027, 1, 6).getTime() && t <= new Date(2027, 2, 7).getTime()) {
    const n = Math.round((t - new Date(2027, 1, 6).getTime()) / 864e5) + 1;
    return { mon: 1, day: n, leap: false };
  }
  return null;
}
export function lunarOf(d) {
  const fx = lunarFix(d); if (fx) return fx;
  try {
    fmt ||= new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { month: 'numeric', day: 'numeric' });
    const parts = fmt.formatToParts(d);
    const m = parts.find((p) => p.type === 'month').value, day = +parts.find((p) => p.type === 'day').value;
    const mon = parseInt(m.replace(/\D/g, ''), 10);
    return mon && day ? { mon, day, leap: /閏|bis/.test(m) } : null;
  } catch { return null; }
}
// 節氣（21 世紀通用公式）：清明 C=4.81（四月）、冬至 C=21.94（十二月）
const term = (y, C) => { const Y = y % 100; return Math.floor(Y * 0.2422 + C) - Math.floor(Y / 4); };
const isLunar = (mon, a, b = a) => (d, L) => !!L && !L.leap && L.mon === mon && L.day >= a && L.day <= b;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// 全年節慶（照日曆順序，從春節開始）
export const FESTIVALS = [
  { id: 'chunjie', name: '春節', game: '初一到初五每天不同', when: isLunar(1, 1, 5), date: '正月初一～初五' },
  { id: 'tiangong', name: '天公生', game: '擺頂桌', when: isLunar(1, 9), date: '正月初九' },
  { id: 'yuanxiao', name: '元宵', game: '放天燈・猜燈謎', when: isLunar(1, 15), date: '正月十五' },
  { id: 'qingming', name: '清明', game: '捲潤餅', when: (d) => d.getMonth() === 3 && d.getDate() === term(d.getFullYear(), 4.81), date: '國曆 4/4 或 4/5' },
  { id: 'mazu', name: '媽祖生', game: '鑽轎腳', when: isLunar(3, 23), date: '三月廿三' },
  { id: 'duanwu', name: '端午', game: '正午立蛋・掛香包', when: isLunar(5, 5), date: '五月初五' },
  { id: 'qixi', name: '七夕', game: '搭鵲橋', when: isLunar(7, 7), date: '七月初七' },
  { id: 'zhongyuan', name: '中元', game: '普度・放水燈', when: isLunar(7, 15), date: '七月十五' },
  { id: 'zhongqiu', name: '中秋', game: '柚子帽給虎爺', when: isLunar(8, 15), date: '八月十五' },
  { id: 'chongyang', name: '重陽', game: '放風箏', when: isLunar(9, 9), date: '九月初九' },
  { id: 'dongzhi', name: '冬至', game: '搓湯圓', when: (d) => d.getMonth() === 11 && d.getDate() === term(d.getFullYear(), 21.94), date: '國曆 12/21 或 12/22' },
  { id: 'songshen', name: '送神', game: '黏灶君嘴・擦神桌', when: isLunar(12, 24), date: '臘月廿四' },
  { id: 'chuxi', name: '除夕', game: '貼春聯・拉長年菜', when: (d) => { const n = lunarOf(addDays(d, 1)); return !!n && !n.leap && n.mon === 1 && n.day === 1; }, date: '臘月最後一天' },
];
export const festById = (id) => FESTS_BY_ID[id];
const FESTS_BY_ID = Object.fromEntries(FESTIVALS.map((f) => [f.id, f]));

const midnight = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
// 今天是哪個節慶（可能沒有）
export function todayFest(d = new Date()) {
  const L = lunarOf(d);
  const f = FESTIVALS.find((x) => x.when(d, L));
  return f ? { f, L } : null;
}
// 每個節慶下一次是幾天後（掃未來 400 天，結果記起來）
let upcoming = null, upcomingKey = '';
export function nextDates() {
  const t0 = midnight(), key = t0.toDateString();
  if (upcoming && upcomingKey === key) return upcoming;
  const out = {};
  for (let i = 0; i < 400 && Object.keys(out).length < FESTIVALS.length; i++) {
    const d = addDays(t0, i), L = lunarOf(d);
    for (const f of FESTIVALS) if (!(f.id in out) && f.when(d, L)) out[f.id] = { date: d, days: i };
  }
  upcoming = out; upcomingKey = key;
  return out;
}

/* ---------- 舞台 ---------- */
const VW = 360, VH = 645, LIFT = 74;
export function makeStage(host, { sfx, say, onClose }) {
  host.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="節慶小遊戲">
    <defs>
      <radialGradient id="fGlow"><stop offset="0" stop-color="#FFF3B0" stop-opacity=".95"/><stop offset="1" stop-color="#FFC94A" stop-opacity="0"/></radialGradient>
      <filter id="fToy" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#3B1408" flood-opacity=".35"/></filter>
    </defs>
    <g id="fWorld"></g><g id="fFx" pointer-events="none"></g>
  </svg>
  <button type="button" class="fest-close" aria-label="離開小遊戲">✕</button>
  <div class="fest-steps" aria-hidden="true"></div>
  <div class="fest-actions"></div>`;
  const svg = host.querySelector('svg'), world = svg.querySelector('#fWorld'), fxL = svg.querySelector('#fFx');
  const actions = host.querySelector('.fest-actions'), steps = host.querySelector('.fest-steps');
  let view = { x: 0, y: 0, w: VW }, camRun = 0, alive = true;
  const cleanups = [], timers = [];
  const setView = (v) => { view = v; svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${(v.w * VH / VW).toFixed(2)}`); };
  function camera(to, ms = 500) {
    const from = { ...view }, run = ++camRun, t0 = performance.now();
    if (ms <= 0 || matchMedia('(prefers-reduced-motion: reduce)').matches) { setView(to); return; }
    const step = (t) => {
      if (run !== camRun || !alive) return;
      const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setView({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e });
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const lift = () => LIFT * view.w / VW; // 拉近時抬高的距離跟著縮，手指和道具在螢幕上的距離不變

  // 粒子（SVG，量少就好）
  const parts = [];
  let fxOn = false;
  function fxLoop(t) {
    if (!alive) return;
    let last = fxLoop.last || t; const dt = Math.min(.05, (t - last) / 1000); fxLoop.last = t;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.age += dt;
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const k = p.age / p.life;
      if (k >= 1) { p.el.remove(); parts.splice(i, 1); continue; }
      p.el.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(p.s0 + (p.s1 - p.s0) * k).toFixed(2)})`);
      p.el.setAttribute('opacity', (p.fade ? 1 - k : 1 - k * k).toFixed(2));
    }
    if (parts.length) requestAnimationFrame(fxLoop); else { fxOn = false; fxLoop.last = 0; }
  }
  const SHAPES = {
    spark: (c) => `<circle r="2.4" fill="${c || '#FFE08A'}"/>`,
    star: (c) => `<path d="M0-6 1.6-1.6 6 0 1.6 1.6 0 6-1.6 1.6-6 0-1.6-1.6z" fill="${c || '#FFE08A'}"/>`,
    steam: () => `<circle r="7" fill="#FFFFFF" opacity=".55"/>`,
    heart: (c) => `<path d="M0 5C-7 0-7-5-3.5-5.5-1.5-6 0-4 0-3c0-1 1.5-3 3.5-2.5C7-5 7 0 0 5z" fill="${c || '#F2627A'}"/>`,
    paper: (c) => `<rect x="-3" y="-2" width="6" height="4" fill="${c || '#E0443E'}"/>`,
    smoke: () => `<circle r="5" fill="#B8B0A8" opacity=".5"/>`,
  };
  function emit(kind, x, y, o = {}) {
    if (parts.length > 160) return;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.innerHTML = SHAPES[kind](o.color);
    fxL.appendChild(el);
    const a = o.angle ?? Math.random() * Math.PI * 2, s = o.speed ?? (30 + Math.random() * 60);
    parts.push({ el, x, y, vx: o.vx ?? Math.cos(a) * s, vy: o.vy ?? Math.sin(a) * s - 20, g: o.g ?? 0, age: 0, life: o.life ?? (.8 + Math.random() * .5), s0: o.s0 ?? 1, s1: o.s1 ?? .6, fade: o.fade });
    if (!fxOn) { fxOn = true; requestAnimationFrame(fxLoop); }
  }
  const burst = (kind, x, y, n = 16, o) => { for (let i = 0; i < n; i++) emit(kind, x, y, typeof o === 'function' ? o(i) : o); };
  function floatText(text, x, y, color = '#FFF4D0') {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    el.setAttribute('x', x); el.setAttribute('y', y); el.setAttribute('text-anchor', 'middle');
    el.setAttribute('class', 'fest-float'); el.setAttribute('fill', color); el.textContent = text;
    fxL.appendChild(el); later(1500, () => el.remove());
  }

  function later(ms, fn) { const id = setTimeout(() => alive && fn(), ms); timers.push(id); return id; }
  function tween(ms, fn, done) {
    const t0 = performance.now();
    const step = (t) => { if (!alive) return; const k = Math.min(1, (t - t0) / ms); fn(k, 1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); else done?.(); };
    requestAnimationFrame(step);
  }
  const $ = (sel) => svg.querySelector(sel);

  // 按住拿起來：道具浮在手指上方，靠近目標會吸過去
  // el：要按住的東西；onMove(x, y) 拿到的是道具的位置（已經抬高）；magnet() 回傳 [x, y, r] 或 null
  function hold(el, { onStart, onMove, onUp, magnet, liftBy = 1 }) {
    let id = null;
    const at = (e) => {
      const p = pt(e);
      let x = p.x, y = p.y - lift() * liftBy;
      const m = magnet?.();
      if (m) { const d = Math.hypot(x - m[0], y - m[1]), R = m[2] || 40; if (d < R) { const k = Math.min(1, (1 - d / R) * 1.6); x += (m[0] - x) * k; y += (m[1] - y) * k; } }
      return [x, y, p];
    };
    const down = (e) => {
      if (id !== null || !alive) return;
      e.preventDefault(); id = e.pointerId; svg.setPointerCapture?.(e.pointerId);
      sfx.pop(); onStart?.(...at(e));
      onMove?.(...at(e));
    };
    const move = (e) => { if (e.pointerId === id) onMove?.(...at(e)); };
    const up = (e) => { if (e.pointerId !== id) return; id = null; onUp?.(...at(e)); };
    el.addEventListener('pointerdown', down);
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    cleanups.push(() => { el.removeEventListener('pointerdown', down); svg.removeEventListener('pointermove', move); svg.removeEventListener('pointerup', up); svg.removeEventListener('pointercancel', up); });
  }
  // 整個畫面的手勢（搓、拉、畫圈）
  function touch({ down, move, up }) {
    let id = null;
    const d = (e) => { if (id !== null || !alive) return; if (e.target.closest?.('[data-nograb]')) return; id = e.pointerId; svg.setPointerCapture?.(id); e.preventDefault(); down?.(pt(e)); };
    const m = (e) => { if (e.pointerId === id) move?.(pt(e)); };
    const u = (e) => { if (e.pointerId !== id) return; id = null; up?.(pt(e)); };
    svg.addEventListener('pointerdown', d); svg.addEventListener('pointermove', m); svg.addEventListener('pointerup', u); svg.addEventListener('pointercancel', u);
    const off = () => { svg.removeEventListener('pointerdown', d); svg.removeEventListener('pointermove', m); svg.removeEventListener('pointerup', u); svg.removeEventListener('pointercancel', u); };
    cleanups.push(off);
    return off;
  }
  // 畫面下方的大按鈕（鍵盤和不方便做手勢的人也能玩）
  function buttons(list) {
    actions.innerHTML = list.map((b, i) => `<button type="button" class="fest-btn${b.primary ? ' primary' : ''}" data-i="${i}">${b.label}</button>`).join('');
    actions.onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) list[+b.dataset.i].on(); };
  }
  function progress(n, total) {
    steps.innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
  }

  const stage = {
    svg, world, $, pt, lift, emit, burst, floatText, later, tween, hold, touch, buttons, progress, sfx, say,
    W: VW, H: VH,
    set(html) { world.innerHTML = html; },
    add(html) { world.insertAdjacentHTML('beforeend', html); return world.lastElementChild; },
    zoom(cx, cy, w = 230, ms = 450) { const h = w * VH / VW; camera({ x: Math.max(0, Math.min(VW - w, cx - w / 2)), y: Math.max(0, Math.min(VH - h, cy - h / 2)), w }, ms); },
    reset(ms = 500) { camera({ x: 0, y: 0, w: VW }, ms); },
    onCleanup(fn) { cleanups.push(fn); },
    get alive() { return alive; },
    destroy() {
      alive = false; camRun++;
      timers.forEach(clearTimeout); cleanups.forEach((f) => f());
      parts.length = 0; host.innerHTML = '';
    },
  };
  host.querySelector('.fest-close').addEventListener('click', () => onClose());
  return stage;
}

// 小工具
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const place = (el, x, y, s = 1, r = 0) => el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})${r ? ` rotate(${r.toFixed(1)})` : ''}${s !== 1 ? ` scale(${s.toFixed(3)})` : ''}`);

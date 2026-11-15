// 廟埕攤位（辦桌、收驚、打小人）和祭改共用的小工具。
// 攤位是一整張不透明的場景，蓋在正殿 SVG 上面；座標一樣是 360 × 645，鏡頭跟著 cam 一起拉近。
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const svgPt = (svg, e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
export const pick = (a) => a[Math.floor(Math.random() * a.length)];

// 補間：fn(k) 每幀呼叫，k 從 0 到 1（已套 easeOutCubic）
export function tween(ms, fn, ease = (k) => 1 - Math.pow(1 - k, 3)) {
  return new Promise((res) => {
    if (reduce) ms = Math.min(ms, 120);
    const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / ms); fn(ease(k), k); if (k < 1) requestAnimationFrame(step); else res(); };
    requestAnimationFrame(step);
  });
}

// 打擊感：整張場景震一下
export function shake(el, amp = 5, ms = 220) {
  if (reduce) return;
  const t0 = performance.now();
  const step = (t) => {
    const k = (t - t0) / ms; if (k >= 1) { el.style.transform = ''; return; }
    const a = amp * (1 - k);
    el.style.transform = `translate(${(Math.random() - .5) * 2 * a}px, ${(Math.random() - .5) * 2 * a}px)`;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// 每日紀錄：同一天只算一次，連續天數
export function daily(rec, today, yesterday) {
  if (rec.last === today) return false;
  rec.streak = rec.last === yesterday ? (rec.streak || 0) + 1 : 1;
  rec.total = (rec.total || 0) + 1; rec.last = today;
  return true;
}
export const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

// 文字換行放進 SVG <text>
export function svgText(el, lines, dy = 14) {
  el.innerHTML = '';
  lines.forEach((l, i) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'tspan'); s.setAttribute('x', el.getAttribute('x')); s.setAttribute('dy', i ? dy : 0); s.textContent = l; el.appendChild(s); });
}

// 單手滑動手勢：按下後往某方向滑超過 dist 就觸發
export function onSwipe(el, svg, { dir = 'up', dist = 50, onMove, onDone, onStart }) {
  let s = null;
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); s = svgPt(svg, e); onStart?.(s); });
  el.addEventListener('pointermove', (e) => {
    if (!s) return;
    const p = svgPt(svg, e), d = dir === 'up' ? s.y - p.y : dir === 'down' ? p.y - s.y : 0;
    onMove?.(p, Math.max(0, d) / dist);
    if (d > dist) { s = null; onDone?.(p); }
  });
  const end = () => { if (s) { s = null; onMove?.(null, 0); } };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}

// 暫代美術用的 Q 版人物（還沒有正式圖檔前先用向量畫）
export function grannySVG({ x, y, robe = '#3E6FA8', s = 1, id = '' }) {
  return `<g ${id ? `id="${id}"` : ''} transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="62" rx="44" ry="7" fill="#1A0A08" opacity=".25"/>
    <path d="M-38 62c0-34 14-52 38-52s38 18 38 52z" fill="${robe}"/>
    <path d="M-10 14l10 14 10-14" fill="none" stroke="#FFF4E0" stroke-width="2.4" opacity=".8"/>
    <circle cx="0" cy="-14" r="26" fill="#F6CFAE"/>
    <path d="M-27 -16c0-20 12-30 27-30s27 10 27 30c-6-10-14-14-27-14s-21 4-27 14z" fill="#D9D4CC"/>
    <circle cx="0" cy="-46" r="11" fill="#D9D4CC"/>
    <path d="M-12 -14q4 4 8 0M4 -14q4 4 8 0" stroke="#3B1F17" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="-15" cy="-5" rx="5" ry="3" fill="#F29A8A" opacity=".55"/><ellipse cx="15" cy="-5" rx="5" ry="3" fill="#F29A8A" opacity=".55"/>
    <path d="M-6 0q6 5 12 0" stroke="#A0523C" stroke-width="2" fill="none" stroke-linecap="round"/>
    <rect x="-22" y="-12" width="44" height="2" fill="none"/>
    <circle cx="-15" cy="-14" r="8" fill="none" stroke="#8A6A4A" stroke-width="1.6"/><circle cx="15" cy="-14" r="8" fill="none" stroke="#8A6A4A" stroke-width="1.6"/><path d="M-7 -14h14" stroke="#8A6A4A" stroke-width="1.6"/>
  </g>`;
}

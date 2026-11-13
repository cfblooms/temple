// 粒子層：香煙、金光、愛心、小魚乾、浮字。座標用場景的 360 × 540。
const W = 360, H = 540;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let cv, g, scale = 1, dpr = 1, cssW = 360;
// 鏡頭（供桌特寫時會放大）：畫面左上角的場景座標與看得到的寬度
const view = { x: 0, y: 0, w: W };
const parts = [];
const tickers = new Set();
let running = false, last = 0;

export function initFx(canvas) {
  cv = canvas; g = cv.getContext('2d');
  const fit = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));
    cssW = r.width; scale = cssW / view.w;
  };
  new ResizeObserver(fit).observe(cv);
  fit();
}

// 跟著 SVG 的 viewBox 一起移動，粒子才會黏在對的位置
export function setFxView(x, y, w) { view.x = x; view.y = y; view.w = w; scale = cssW / w; kick(); }

// 每幀都會呼叫的函式（例如燭光閃爍），回傳 false 就移除
export function onTick(fn) { tickers.add(fn); kick(); }

function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); } }

export function emit(type, x, y, o = {}) {
  if (reduce && type !== 'text' && Math.random() < 0.6) return;
  const p = { type, x, y, vx: 0, vy: 0, age: 0, life: 1.5, size: 6, rot: 0, ...o };
  switch (type) {
    case 'smoke': Object.assign(p, { vx: (Math.random() - .5) * 6, vy: -18 - Math.random() * 8, life: 3.2, size: 2.5 }); break;
    case 'spark': { const a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 60; Object.assign(p, { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: .9 + Math.random() * .5, size: 1.5 + Math.random() * 2 }); break; }
    case 'heart': Object.assign(p, { vx: (Math.random() - .5) * 30, vy: -40 - Math.random() * 20, life: 1.4, size: 6 + Math.random() * 3 }); break;
    case 'fish': Object.assign(p, { vx: (Math.random() - .5) * 40, vy: -70, life: 1.3, size: 9 }); break;
    case 'text': Object.assign(p, { vy: -22, life: 1.8, size: 15, ...o }); break;
  }
  parts.push(p);
  kick();
}

export function burst(type, x, y, n) { for (let i = 0; i < n; i++) emit(type, x, y); }

function heart(s) {
  g.beginPath();
  g.moveTo(0, s * .35);
  g.bezierCurveTo(-s * 1.1, -s * .4, -s * .45, -s * 1.1, 0, -s * .45);
  g.bezierCurveTo(s * .45, -s * 1.1, s * 1.1, -s * .4, 0, s * .35);
  g.fill();
}

function fish(s) {
  g.beginPath(); g.ellipse(0, 0, s, s * .5, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(s * .8, 0); g.lineTo(s * 1.6, -s * .5); g.lineTo(s * 1.6, s * .5); g.fill();
  g.fillStyle = '#3B1F17'; g.beginPath(); g.arc(-s * .5, -s * .1, s * .12, 0, Math.PI * 2); g.fill();
}

function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, cv.width, cv.height);
  g.setTransform(scale * dpr, 0, 0, scale * dpr, -view.x * scale * dpr, -view.y * scale * dpr);

  for (const fn of tickers) if (fn(now / 1000, dt) === false) tickers.delete(fn);

  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.age += dt;
    if (p.age >= p.life) { parts.splice(i, 1); continue; }
    const k = p.age / p.life;
    p.x += p.vx * dt; p.y += p.vy * dt;
    g.save(); g.translate(p.x, p.y);
    switch (p.type) {
      case 'smoke': {
        p.vx += Math.sin(now / 400 + p.y / 20) * 8 * dt;
        g.globalAlpha = .35 * (1 - k); g.fillStyle = '#EDE6DA';
        g.beginPath(); g.arc(0, 0, p.size + k * 9, 0, Math.PI * 2); g.fill(); break;
      }
      case 'spark': p.vy += 60 * dt; g.globalAlpha = 1 - k; g.fillStyle = '#FFD86B'; g.beginPath(); g.arc(0, 0, p.size, 0, Math.PI * 2); g.fill(); break;
      case 'heart': g.globalAlpha = 1 - k * k; g.fillStyle = '#FF7FA0'; heart(p.size); break;
      case 'fish': p.vy += 120 * dt; g.globalAlpha = 1 - k * k; g.rotate(Math.sin(p.age * 8) * .3); g.fillStyle = '#E6B85C'; fish(p.size); break;
      case 'text': {
        g.globalAlpha = k < .15 ? k / .15 : 1 - Math.max(0, (k - .6) / .4);
        g.font = `900 ${p.size}px "Noto Serif TC", serif`; g.textAlign = 'center';
        g.lineWidth = 4; g.strokeStyle = 'rgba(40,10,6,.75)'; g.strokeText(p.text, 0, 0);
        g.fillStyle = p.color || '#FFE08A'; g.fillText(p.text, 0, 0); break;
      }
    }
    g.restore();
  }

  if (parts.length || tickers.size) requestAnimationFrame(loop);
  else { running = false; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); }
}

export { W as SCENE_W, H as SCENE_H, reduce as REDUCED_MOTION };

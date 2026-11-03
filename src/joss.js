// 廟埕金爐：把金紙一張一張拖進爐口化掉。自成一格的小 SVG 場景，自己跑粒子。
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const paper = (id, x, y, r = 0) => `
  <g id="${id}" transform="translate(${x} ${y}) rotate(${r})">
    <rect x="-34" y="-25" width="68" height="50" rx="3" fill="#E9CF96" stroke="#C9A060" stroke-width="1"/>
    <rect x="-17" y="-15" width="34" height="30" rx="2" fill="url(#foilG)"/>
    <rect x="-7" y="-7" width="14" height="14" rx="2" fill="none" stroke="#C0302A" stroke-width="1.6"/>
    <text x="0" y="4.2" text-anchor="middle" font-family="Noto Serif TC, serif" font-weight="900" font-size="10" fill="#C0302A">福</text>
  </g>`;

const flame = (x, h, w, d, cls) => `<path class="jf ${cls}" style="animation-delay:${d}s" d="M${x} 0 C${x + w} ${-h * .45} ${x + w * .4} ${-h * .8} ${x} ${-h} C${x - w * .4} ${-h * .8} ${x - w} ${-h * .45} ${x} 0 Z"/>`;

export const FURNACE_SVG = `
<svg viewBox="0 0 300 350" class="joss-svg" role="img" aria-label="廟埕金爐">
  <defs>
    <linearGradient id="foilG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3B8"/><stop offset=".5" stop-color="#F2C24E"/><stop offset="1" stop-color="#C98E22"/></linearGradient>
    <linearGradient id="brickG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2675A"/><stop offset="1" stop-color="#A9362E"/></linearGradient>
    <linearGradient id="roofJ" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ED8C0"/><stop offset="1" stop-color="#3F9E86"/></linearGradient>
    <linearGradient id="goldJ" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0B0"/><stop offset=".5" stop-color="#F4C55A"/><stop offset="1" stop-color="#D49530"/></linearGradient>
    <radialGradient id="mouthG" cx=".5" cy=".85" r=".8"><stop offset="0" stop-color="#FFE08A"/><stop offset=".35" stop-color="#FF7A2A"/><stop offset="1" stop-color="#3A0E08"/></radialGradient>
    <radialGradient id="heatG"><stop offset="0" stop-color="#FFB850" stop-opacity=".7"/><stop offset="1" stop-color="#FFB850" stop-opacity="0"/></radialGradient>
    <linearGradient id="jfG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFE27A"/><stop offset=".6" stop-color="#FF8A2E"/><stop offset="1" stop-color="#E8452A"/></linearGradient>
    <filter id="jtoy" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#3A0E08" flood-opacity=".35"/></filter>
    <clipPath id="mouthClip"><path d="M112 222 V180 Q150 140 188 180 V222 Z"/></clipPath>
  </defs>
  <rect width="300" height="350" rx="18" fill="#4A1E16"/>
  <ellipse cx="150" cy="318" rx="140" ry="22" fill="#2E120C"/>
  <circle id="heat" cx="150" cy="190" r="110" fill="url(#heatG)" opacity=".5"/>
  <g filter="url(#jtoy)">
    <!-- 煙囪與屋頂 -->
    <rect x="132" y="22" width="36" height="40" rx="6" fill="url(#brickG)"/>
    <path d="M118 30 Q150 6 182 30 Z" fill="url(#roofJ)"/>
    <path d="M62 92 Q150 34 238 92 Q244 100 232 100 H68 Q56 100 62 92 Z" fill="url(#roofJ)"/>
    <circle cx="150" cy="52" r="7" fill="url(#goldJ)"/>
    <!-- 爐身 -->
    <path d="M78 100 H222 Q232 100 232 112 V250 Q232 262 220 262 H80 Q68 262 68 250 V112 Q68 100 78 100 Z" fill="url(#brickG)"/>
    <path d="M68 140 H232 M68 200 H232" stroke="#8E2A24" stroke-opacity=".35" stroke-width="2"/>
    <rect x="62" y="252" width="176" height="20" rx="6" fill="url(#goldJ)"/>
    <text x="150" y="126" text-anchor="middle" font-family="Noto Serif TC, serif" font-weight="900" font-size="15" fill="#FFE9A0" letter-spacing="4">天公金爐</text>
    <!-- 爐口 -->
    <path d="M108 226 V178 Q150 134 192 178 V226 Z" fill="url(#goldJ)"/>
    <path d="M112 222 V180 Q150 140 188 180 V222 Z" fill="url(#mouthG)"/>
    <g clip-path="url(#mouthClip)"><g id="fire" transform="translate(150 224)">
      ${flame(-22, 34, 13, 0, 'a')}${flame(18, 40, 14, -.2, 'b')}${flame(-2, 54, 18, -.35, 'c')}
      <path d="M-40 0 Q0 -12 40 0 Z" fill="#2A0C06"/>
    </g></g>
  </g>
  <g id="burning"></g>
  <g id="embers" pointer-events="none"></g>
  <!-- 金紙疊 -->
  <g id="stack">${paper('p3', 152, 312, 4)}${paper('p2', 148, 308, -3)}${paper('p1', 150, 304, 1)}</g>
  <g id="jossTop" class="joss-top" role="button" tabindex="0" aria-label="拿一張金紙放進金爐">${paper('pTop', 150, 300, 0)}</g>
</svg>`;

export function bindJoss(root, { total = 5, onBurn, onDone }) {
  const svg = root.querySelector('svg.joss-svg');
  const $ = (id) => svg.querySelector('#' + id);
  const top = $('jossTop'), embers = $('embers'), burning = $('burning'), fire = $('fire'), heat = $('heat');
  const MOUTH = { x: 150, y: 196 };
  let left = total, drag = null, flare = 0, parts = [], raf = 0, alive = true, flying = false;

  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const setTop = (x, y, r = 0) => top.setAttribute('transform', `translate(${x - 150} ${y - 300}) rotate(${r} 150 300)`);
  const paintStack = () => {
    ['p1', 'p2', 'p3'].forEach((id, i) => { $(id).style.display = left - 1 > i ? '' : 'none'; });
    top.style.display = left > 0 ? '' : 'none';
  };

  function loop(now) {
    if (!alive) return;
    flare = Math.max(0, flare - 0.016 * 1.2);
    const s = 1 + flare * .7 + .04 * Math.sin(now / 90);
    fire.setAttribute('transform', `translate(150 224) scale(${(1 + flare * .25).toFixed(3)} ${s.toFixed(3)})`);
    heat.setAttribute('opacity', (.45 + flare * .5 + .05 * Math.sin(now / 200)).toFixed(3));
    if (Math.random() < .05 + flare * .5) spawn(1);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.age += .016;
      if (p.age > p.life) { p.el.remove(); parts.splice(i, 1); continue; }
      p.vx += Math.sin(now / 300 + p.seed) * .04; p.x += p.vx; p.y += p.vy;
      const k = p.age / p.life;
      p.el.setAttribute('cx', p.x.toFixed(1)); p.el.setAttribute('cy', p.y.toFixed(1));
      p.el.setAttribute('opacity', (1 - k).toFixed(2));
    }
    raf = requestAnimationFrame(loop);
  }
  function spawn(n, ash) {
    if (reduce && parts.length > 6) return;
    for (let i = 0; i < n; i++) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const isAsh = ash && Math.random() < .4;
      el.setAttribute('r', isAsh ? (1.6 + Math.random() * 1.6).toFixed(1) : (1 + Math.random() * 1.8).toFixed(1));
      el.setAttribute('fill', isAsh ? '#7A6A60' : Math.random() < .5 ? '#FFD86B' : '#FF8A3A');
      embers.appendChild(el);
      parts.push({ el, x: 130 + Math.random() * 40, y: 190 + Math.random() * 20, vx: (Math.random() - .5) * 1.2, vy: -(1 + Math.random() * 1.8), age: 0, life: 1.2 + Math.random() * 1.4, seed: Math.random() * 9 });
    }
  }

  function burn(fromX, fromY, fromR) {
    if (left <= 0 || flying) return;
    flying = true; left--;
    // 飛進爐口的那張
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = paper('fly', 0, 0, 0);
    burning.appendChild(g);
    top.style.display = 'none';
    const t0 = performance.now(), dur = reduce ? 200 : 650;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - (1 - k) * (1 - k);
      const x = fromX + (MOUTH.x - fromX) * e, y = fromY + (MOUTH.y - fromY) * e - 30 * Math.sin(Math.PI * k);
      const sc = 1 - .7 * e, r = fromR + 40 * e;
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${sc.toFixed(3)})`);
      g.setAttribute('opacity', (1 - Math.max(0, (k - .7) / .3)).toFixed(2));
      if (k < 1) return requestAnimationFrame(step);
      g.remove(); flying = false;
      flare = 1; spawn(reduce ? 4 : 22, true);
      setTop(150, 300); paintStack();
      onBurn && onBurn(left);
      if (left === 0) onDone && onDone();
    };
    requestAnimationFrame(step);
  }

  top.addEventListener('pointerdown', (e) => {
    if (flying || left <= 0) return;
    e.preventDefault(); top.setPointerCapture(e.pointerId);
    const p = pt(e); drag = { x0: p.x, y0: p.y, moved: false, x: 150, y: 300 };
  });
  top.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pt(e); drag.x = 150 + p.x - drag.x0; drag.y = 300 + p.y - drag.y0;
    if (Math.hypot(p.x - drag.x0, p.y - drag.y0) > 6) drag.moved = true;
    setTop(drag.x, drag.y, (drag.x - 150) * .1);
  });
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null;
    // 點一下、或拖到爐子上方放手，都會送進爐口
    if (!d.moved || (Math.abs(d.x - MOUTH.x) < 70 && d.y < 250)) burn(d.x, d.y, (d.x - 150) * .1);
    else setTop(150, 300);
  };
  top.addEventListener('pointerup', end);
  top.addEventListener('pointercancel', end);
  top.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); burn(150, 300, 0); } });

  paintStack();
  raf = requestAnimationFrame(loop);
  return () => { alive = false; cancelAnimationFrame(raf); };
}

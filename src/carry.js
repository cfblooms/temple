// 拿起來放到某個位置的道具（註生娘娘的花、太歲符）：
// 按住拿起來，道具浮在手指上方（手指不會擋住），靠近目標會吸過去，放開在目標上就完成；
// 拿起來時鏡頭放大目標那一塊。按鈕／鍵盤可以叫它自己飛過去。
// 道具結構：<g el transform=translate(x y)>…</g>，原點在道具底部中心（放上去的那一點）。
export function makeCarrier({ svg, el, rest, target, radius = 40, lift = 56, cam, zoom, onDrop, onTap, sfx, ring }) {
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  let pos = [...rest()], drag = null, busy = false;
  const place = (s = 1) => el.setAttribute('transform', `translate(${pos[0].toFixed(1)} ${pos[1].toFixed(1)}) scale(${s})`);
  const tween = (to, ms, done) => {
    const from = [...pos], t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      pos = [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(k * Math.PI) * (ms > 400 ? 30 : 0)];
      place(); if (k < 1) requestAnimationFrame(step); else done?.();
    };
    requestAnimationFrame(step);
  };
  const near = () => Math.hypot(pos[0] - target()[0], pos[1] - target()[1]) < radius;
  el.addEventListener('pointerdown', (e) => {
    if (busy) return;
    e.preventDefault(); el.setPointerCapture(e.pointerId);
    const p = pt(e); drag = { moved: false, x0: p.x, y0: p.y };
    el.classList.add('held'); sfx?.pop();
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pt(e);
    if (!drag.moved && Math.hypot(p.x - drag.x0, p.y - drag.y0) > 6) {
      drag.moved = true; ring?.setAttribute('opacity', '.9');
      if (zoom) cam?.zoom(...zoom());
    }
    if (!drag.moved) return;
    pos = [Math.max(20, Math.min(340, p.x)), Math.max(60, Math.min(620, p.y - lift))];
    const [tx, ty] = target();
    if (Math.hypot(pos[0] - tx, pos[1] - ty) < radius * 1.8) pos = [pos[0] + (tx - pos[0]) * .4, pos[1] + (ty - pos[1]) * .4]; // 靠近就吸過去
    place();
  });
  const up = () => {
    if (!drag) return;
    const moved = drag.moved; drag = null; el.classList.remove('held'); ring?.setAttribute('opacity', '0');
    if (!moved) { onTap(); return; }
    if (near()) { busy = true; tween(target(), 160, () => { busy = false; onDrop(); }); return; }
    cam?.reset(300); tween(rest(), 380);
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  function auto() { // 自己飛過去放好
    if (busy || drag) return;
    busy = true; if (zoom) cam?.zoom(...zoom());
    setTimeout(() => tween(target(), 650, () => { busy = false; onDrop(); }), 250);
  }
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auto(); } });
  return { auto, home() { pos = [...rest()]; place(); } };
}

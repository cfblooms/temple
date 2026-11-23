// 可以拿起來「倒」的道具（土地公的澆水壺、濟公的酒葫蘆）：
// 按住拖到目標上方會自己傾斜倒出來，倒滿一段時間就完成；按鈕／鍵盤可以讓它自己飛過去倒。
// 道具的結構：<g el transform=translate(x y)><g tilt><image .../></g></g>，原點在道具中心。
export function makePourer({ svg, el, tilt, shadow, target, rest, pourAt, spout, angle = -32, emit, drop = {}, isDone, onDone, onTap, sfx, cam }) {
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  let pos = [...rest], ang = 0, drag = null, pour = 0, anim = 0, lastT = 0, autoRun = 0;
  const place = () => {
    el.setAttribute('transform', `translate(${pos[0].toFixed(1)} ${pos[1].toFixed(1)})`);
    tilt.setAttribute('transform', `rotate(${ang.toFixed(1)})`);
    if (shadow) shadow.style.display = drag || autoRun || Math.hypot(pos[0] - rest[0], pos[1] - rest[1]) > 2 ? 'none' : '';
  };
  const spoutAt = () => {
    const a = ang * Math.PI / 180, [sx, sy] = spout;
    return [pos[0] + sx * Math.cos(a) - sy * Math.sin(a), pos[1] + sx * Math.sin(a) + sy * Math.cos(a)];
  };
  const near = () => Math.hypot(pos[0] - pourAt[0], pos[1] - pourAt[1]) < 46;
  function tick(dt) {
    const want = near() ? angle : 0;
    ang += (want - ang) * Math.min(1, dt * 10);
    if (want && Math.abs(ang) > Math.abs(angle) * .6) {
      const [x, y] = spoutAt();
      if (Math.random() < .8) emit('drop', x, y, drop);
      if (!isDone()) { pour += dt; if (pour > 1.1) { pour = 0; onDone(); } }
    }
    place();
  }
  function loop(t) {
    const dt = lastT ? Math.min(.05, (t - lastT) / 1000) : .016; lastT = t;
    tick(dt);
    if (drag || Math.abs(ang) > .5) anim = requestAnimationFrame(loop);
    else { anim = 0; lastT = 0; place(); }
  }
  const kick = () => { if (!anim) { lastT = 0; anim = requestAnimationFrame(loop); } };
  function goHome() {
    const from = [...pos], t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 380), e = 1 - Math.pow(1 - k, 3);
      pos = [from[0] + (rest[0] - from[0]) * e, from[1] + (rest[1] - from[1]) * e];
      place();
      if (k < 1 && !drag) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  el.addEventListener('pointerdown', (e) => {
    if (autoRun) return;
    e.preventDefault(); el.setPointerCapture(e.pointerId);
    const p = pt(e);
    drag = { moved: false, x0: p.x, y0: p.y }; pour = 0;
    el.classList.add('held');
    target?.setAttribute('opacity', isDone() ? '0' : '.9');
    sfx?.pop(); kick();
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pt(e);
    if (Math.hypot(p.x - drag.x0, p.y - drag.y0) > 6) drag.moved = true;
    if (!drag.moved) return;
    if (!drag.zoomed) { drag.zoomed = true; cam?.zoom(pourAt[0], pourAt[1] + 20, 210); } // 拿起來就放大目標那一塊，看得清楚在倒
    pos = [Math.max(30, Math.min(340, p.x)), Math.max(60, Math.min(615, p.y - 44))]; // 拿在手指上方，不會被手指擋住
    if (!isDone() && Math.hypot(pos[0] - pourAt[0], pos[1] - pourAt[1]) < 70) { // 靠近目標就吸過去
      pos = [pos[0] + (pourAt[0] - pos[0]) * .35, pos[1] + (pourAt[1] - pos[1]) * .35];
    }
  });
  const release = () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null; el.classList.remove('held'); target?.setAttribute('opacity', '0');
    if (!moved) onTap(); else cam?.reset(450);
    goHome(); kick();
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  function auto() {
    if (isDone()) { onTap(); return; }
    if (drag || autoRun) return;
    const run = ++autoRun, from = [...pos], t0 = performance.now();
    const end = () => { autoRun = 0; goHome(); kick(); cam?.reset(300); };
    cam?.zoom(pourAt[0], pourAt[1] + 20, 210);
    const step = (t) => {
      if (run !== autoRun) return;
      const s = (t - t0) / 1000;
      if (s < .5) { const k = s / .5, e = k * k * (3 - 2 * k); pos = [from[0] + (pourAt[0] - from[0]) * e, from[1] + (pourAt[1] - from[1]) * e - Math.sin(k * Math.PI) * 30]; }
      else pos = [...pourAt];
      tick(1 / 60);
      if (isDone() && s > .6) { setTimeout(end, 350); autoRun = -1; return; }
      if (s > 3) { end(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auto(); } });
  place();
  return { auto, place, dragging: () => !!drag };
}

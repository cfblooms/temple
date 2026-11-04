// 自己擲筊：雙手按住稟報，再往上一甩把筊丟出去。
// 全螢幕蓋在最上層（連底部抽屜也蓋過去），正殿、財神閣、月老閣共用。
import jiaoFlat from './assets/jiao-flat.webp';
import jiaoRound from './assets/jiao-round.webp';
import * as sfx from './audio.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NAME = { sheng: '聖筊', xiao: '笑筊', yin: '陰筊' };
let el = null;

function build() {
  el = document.createElement('div');
  el.className = 'jt';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', '擲筊');
  el.innerHTML = `
    <p class="jt-tip" aria-live="polite"></p>
    <div class="jt-floor"></div>
    <div class="jt-pair"><img class="jt-a" alt=""><img class="jt-b" alt=""></div>
    <p class="jt-result"></p>
    <div class="jt-row"><button type="button" class="jt-auto">幫我擲</button><button type="button" class="jt-cancel">先不擲</button></div>`;
  document.body.appendChild(el);
}
const img = (face) => (face === 'flat' ? jiaoFlat : jiaoRound);

/**
 * faces: ['flat','round'] 之類，有給就在畫面上掉下來給你看；沒給就只收手勢（正殿自己會演）。
 * 回傳 Promise<boolean>：true 表示擲出去了，false 表示取消。
 */
export function tossJiao({ tip = '在心裡稟報想問的事', faces = null, key = null, cancel = true } = {}) {
  if (!el) build();
  const tipEl = el.querySelector('.jt-tip'), pair = el.querySelector('.jt-pair'), res = el.querySelector('.jt-result');
  const a = el.querySelector('.jt-a'), b = el.querySelector('.jt-b');
  a.src = jiaoRound; b.src = jiaoRound; a.className = 'jt-a round'; b.className = 'jt-b round';
  pair.className = 'jt-pair'; pair.style.transform = ''; res.textContent = ''; res.className = 'jt-result';
  el.querySelector('.jt-row').hidden = false; el.querySelector('.jt-cancel').hidden = !cancel;
  tipEl.innerHTML = `${tip}<br><b>按住筊杯稟報，再往上一甩</b>`;
  el.hidden = false;
  return new Promise((resolve) => {
    let hold = null, samples = [], done = false, timer = 0;
    const cleanup = () => {
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      el.querySelector('.jt-auto').onclick = null; el.querySelector('.jt-cancel').onclick = null;
      clearTimeout(timer);
    };
    const finish = (ok) => { done = true; cleanup(); if (!ok || !faces) { el.hidden = true; resolve(ok); return; } fall().then(() => resolve(true)); };
    const down = (e) => {
      if (done || e.target.closest('button')) return;
      e.preventDefault(); el.setPointerCapture(e.pointerId);
      hold = performance.now(); samples = [[e.clientX, e.clientY, hold]];
      pair.classList.add('hold'); sfx.knock();
      timer = setTimeout(() => { if (hold) { tipEl.innerHTML = '稟報好了，<b>往上甩出去！</b>'; pair.classList.add('ready'); sfx.buzz(10); } }, 650);
    };
    const move = (e) => {
      if (!hold) return;
      const now = performance.now(); samples.push([e.clientX, e.clientY, now]);
      while (samples.length > 2 && now - samples[0][2] > 110) samples.shift();
      const dy = Math.min(0, e.clientY - samples[0][1]); pair.style.transform = `translateY(${Math.max(-40, dy * .4)}px)`;
    };
    const up = (e) => {
      if (!hold) return;
      const held = performance.now() - hold; hold = null; clearTimeout(timer);
      pair.classList.remove('hold', 'ready'); pair.style.transform = '';
      const s0 = samples[0], dt = Math.max(16, performance.now() - s0[2]) / 1000, vy = (e.clientY - s0[1]) / dt;
      if (held < 600) { tipEl.innerHTML = '先<b>按住</b>筊杯，在心裡把話說完，再往上甩。'; return; }
      if (vy > -350) { tipEl.innerHTML = '手指<b>往上一甩</b>，把筊杯丟出去。'; return; }
      finish(true);
    };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.querySelector('.jt-auto').onclick = () => finish(true);
    el.querySelector('.jt-cancel').onclick = () => finish(false);
  });

  function fall() {
    el.querySelector('.jt-row').hidden = true; tipEl.textContent = '';
    sfx.pop();
    return new Promise((ok) => {
      const run = (node, face, dx, rot) => node.animate([
        { transform: 'translate(0,0) rotate(0) scale(1)' },
        { transform: `translate(${dx * .5}px,-46vh) rotate(${rot * .6}deg) scale(1.25)`, offset: .45 },
        { transform: `translate(${dx}px,0) rotate(${rot}deg) scale(1)`, offset: .85 },
        { transform: `translate(${dx * 1.08}px,-14px) rotate(${rot + 8}deg) scale(1)`, offset: .92 },
        { transform: `translate(${dx * 1.1}px,0) rotate(${rot + 10}deg) scale(1)` },
      ], { duration: reduce ? 200 : 1100, easing: 'cubic-bezier(.3,.1,.4,1)', fill: 'forwards' });
      // 半空中翻面
      const flip = setInterval(() => { for (const n of [a, b]) { const f = n.classList.contains('round') ? 'flat' : 'round'; n.src = img(f); n.className = n.className.replace(/round|flat/, f); } }, 120);
      const r = (x) => (Math.random() - .5) * x;
      const anA = run(a, faces[0], -30 + r(20), 360 + r(80)), anB = run(b, faces[1], 30 + r(20), -360 + r(80));
      setTimeout(() => {
        clearInterval(flip);
        [[a, faces[0], 'jt-a'], [b, faces[1], 'jt-b']].forEach(([n, f, c]) => { n.src = img(f); n.className = `${c} ${f}`; });
      }, reduce ? 150 : 900);
      Promise.all([anA.finished, anB.finished]).then(() => {
        sfx.knock(); sfx.knock(90); sfx.buzz([10, 40, 10]);
        if (key) { res.textContent = NAME[key]; res.className = 'jt-result on ' + key; if (key === 'sheng') sfx.chime(); }
        setTimeout(() => { anA.cancel(); anB.cancel(); el.hidden = true; ok(); }, reduce ? 500 : 1100);
      });
    });
  }
}

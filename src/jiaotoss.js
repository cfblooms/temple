// 自己擲筊：手指按住筊杯在心裡稟報，再往上一甩把筊丟出去。沒有「幫我擲」，一定要自己甩。
// 全螢幕蓋在最上層（連底部抽屜也蓋過去），所有殿共用（正殿、各殿、月老求紅線、財神發財金）。
// 筊杯一按住就浮在手指上方，手指不會擋到筊；手指往上滑超過一點點就直接丟出去，不用等放開。
import jiaoFlat from './assets/jiao-flat.webp';
import jiaoRound from './assets/jiao-round.webp';
import * as sfx from './audio.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NAME = { sheng: '聖筊', xiao: '笑筊', yin: '陰筊' };
const LIFT = 120; // 筊杯浮在手指上方多少 px
const READY = 450; // 按住多久之後提示「可以甩了」
let el = null;

function build() {
  el = document.createElement('div');
  el.className = 'jt';
  el.hidden = true;
  el.tabIndex = -1;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', '擲筊：按住筊杯稟報，再往上甩出去。鍵盤可按住空白鍵再放開。');
  el.innerHTML = `
    <p class="jt-tip" aria-live="polite"></p>
    <div class="jt-floor"></div>
    <div class="jt-pair"><img class="jt-a" alt="" draggable="false"><img class="jt-b" alt="" draggable="false"></div>
    <div class="jt-swipe" aria-hidden="true"><i></i><span>按住・往上滑</span></div>
    <p class="jt-result"></p>
    <div class="jt-row"><button type="button" class="jt-cancel">先不擲</button></div>`;
  document.body.appendChild(el);
}
const img = (face) => (face === 'flat' ? jiaoFlat : jiaoRound);

/**
 * faces: ['flat','round'] 之類，有給就在畫面上掉下來給你看；沒給就只收手勢，筊杯飛出畫面上方（正殿自己會演落地）。
 * 回傳 Promise<boolean>：true 表示擲出去了，false 表示取消。
 */
export function tossJiao({ tip = '在心裡稟報想問的事', faces = null, key = null, cancel = true } = {}) {
  if (!el) build();
  const tipEl = el.querySelector('.jt-tip'), pair = el.querySelector('.jt-pair'), res = el.querySelector('.jt-result');
  const swipe = el.querySelector('.jt-swipe'), row = el.querySelector('.jt-row'), cancelBtn = el.querySelector('.jt-cancel');
  const a = el.querySelector('.jt-a'), b = el.querySelector('.jt-b');
  a.src = jiaoRound; b.src = jiaoRound; a.className = 'jt-a round'; b.className = 'jt-b round';
  pair.className = 'jt-pair'; res.textContent = ''; res.className = 'jt-result';
  row.hidden = false; cancelBtn.hidden = !cancel; swipe.hidden = false;
  const baseTip = `${tip}<br><b>手指按住，往上一滑就丟出去</b>`;
  tipEl.innerHTML = baseTip;
  el.hidden = false;
  el.focus({ preventScroll: true });

  // 筊杯位置（畫面座標，筊杯中心）
  const rest = () => ({ x: innerWidth / 2, y: innerHeight * 0.7 });
  let pos = rest();
  const place = (p, smooth) => {
    pos = p;
    pair.style.transition = smooth ? 'transform .18s ease-out' : 'none';
    pair.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -50%)`;
  };
  place(pos, false);

  return new Promise((resolve) => {
    let hold = null, samples = [], done = false, timer = 0, kb = false;
    const onResize = () => { if (!hold && !done) place(rest(), false); };
    const cleanup = () => {
      el.removeEventListener('touchmove', noScroll); el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      el.removeEventListener('keydown', keyDown); el.removeEventListener('keyup', keyUp);
      removeEventListener('resize', onResize);
      cancelBtn.onclick = null; clearTimeout(timer);
    };
    const finish = (ok, vy = -900) => {
      done = true; cleanup();
      if (!ok) { el.hidden = true; resolve(false); return; }
      fly(vy).then(() => resolve(true));
    };
    const grab = () => {
      hold = performance.now();
      pair.classList.add('hold'); swipe.hidden = true; sfx.knock(); sfx.buzz(8);
      timer = setTimeout(() => { if (hold) { tipEl.innerHTML = '稟報好了，<b>手指往上一滑！</b>'; pair.classList.add('ready'); sfx.buzz(10); } }, READY);
    };
    const release = () => {
      hold = null; clearTimeout(timer);
      pair.classList.remove('hold', 'ready');
    };
    const miss = (html) => { tipEl.innerHTML = html; place(rest(), true); swipe.hidden = false; };

    const noScroll = (e) => { if (!e.target.closest('button')) e.preventDefault(); }; // 不讓頁面或外層視窗被一起拖動
    const down = (e) => {
      if (done || hold || e.target.closest('button')) return;
      e.preventDefault(); el.setPointerCapture(e.pointerId);
      grab();
      const now = performance.now(); samples = [[e.clientX, e.clientY, now]];
      place({ x: e.clientX, y: e.clientY - LIFT }, true);
    };
    // 看最近 0.3 秒：手指從最低點往上移了多少。一滑到門檻就直接丟出去，不用等放開（放開前手指停一下、或系統搶走手勢也不怕）
    const rise = () => {
      const last = samples[samples.length - 1]; let low = last;
      for (const sm of samples) if (sm[1] > low[1]) low = sm;
      const dy = low[1] - last[1];
      return { dy, vy: -dy / (Math.max(16, last[2] - low[2]) / 1000) };
    };
    const track = (e) => {
      const now = performance.now(); samples.push([e.clientX, e.clientY, now]);
      while (samples.length > 2 && now - samples[0][2] > 300) samples.shift();
    };
    const move = (e) => {
      if (!hold || kb) return;
      track(e);
      place({ x: e.clientX, y: e.clientY - LIFT }, false);
      const r = rise();
      if (r.dy >= 45) { release(); finish(true, Math.min(r.vy, -700)); }
    };
    const up = (e) => {
      if (!hold || kb) return;
      if (e.type === 'pointerup') track(e);
      release();
      const r = rise();
      if (r.dy >= 18) { finish(true, Math.min(r.vy, -700)); return; }
      miss('手指按住，<b>往上一滑</b>就丟出去了。');
    };
    // 鍵盤：按住空白鍵（或 Enter）稟報，放開就擲
    const keyDown = (e) => {
      if (e.key === 'Escape' && cancel) { e.preventDefault(); finish(false); return; }
      if ((e.key !== ' ' && e.key !== 'Enter') || e.target.closest('button') || done) return;
      e.preventDefault(); if (hold || e.repeat) return;
      kb = true; grab(); place({ x: pos.x, y: pos.y - 30 }, true);
    };
    const keyUp = (e) => {
      if (!kb || (e.key !== ' ' && e.key !== 'Enter')) return;
      e.preventDefault(); kb = false;
      release();
      finish(true);
    };
    el.addEventListener('touchmove', noScroll, { passive: false }); el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('keydown', keyDown); el.addEventListener('keyup', keyUp);
    addEventListener('resize', onResize);
    cancelBtn.onclick = () => finish(false);
  });

  // 從手指放開的地方飛上去：甩得越快飛越高。有 faces 就翻轉落地給你看結果，沒有就飛出畫面上方。
  function fly(vy) {
    row.hidden = true; swipe.hidden = true; tipEl.textContent = '';
    sfx.pop();
    const power = Math.max(0.6, Math.min(1.25, -vy / 1400));
    const r = (x) => (Math.random() - .5) * x;
    const flip = setInterval(() => { for (const n of [a, b]) { const f = n.classList.contains('round') ? 'flat' : 'round'; n.src = img(f); n.className = n.className.replace(/round|flat/, f); } }, 110);
    if (!faces) {
      // 正殿：筊杯往上飛出畫面，接著在殿裡落地
      const up = -(pos.y + 200);
      const go = (n, dx, rot) => n.animate([
        { transform: 'translate(0,0) rotate(0)' },
        { transform: `translate(${dx}px,${up}px) rotate(${rot}deg) scale(1.15)` },
      ], { duration: reduce ? 150 : 420, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
      const anA = go(a, -20 + r(20), 300 + r(120)), anB = go(b, 20 + r(20), -300 + r(120));
      return Promise.all([anA.finished, anB.finished]).then(() => {
        clearInterval(flip); el.hidden = true; anA.cancel(); anB.cancel();
      });
    }
    return new Promise((ok) => {
      const land = rest(), dyLand = land.y - pos.y, dxLand = land.x - pos.x;
      const peak = Math.max(60 - pos.y, -(innerHeight * 0.38 * power)); // 飛到最高點，但不要飛出畫面
      const run = (node, dx, rot) => node.animate([
        { transform: 'translate(0,0) rotate(0) scale(1)' },
        { transform: `translate(${dxLand + dx * .5}px,${peak}px) rotate(${rot * .6}deg) scale(1.25)`, offset: .45 },
        { transform: `translate(${dxLand + dx}px,${dyLand}px) rotate(${rot}deg) scale(1)`, offset: .85 },
        { transform: `translate(${dxLand + dx * 1.08}px,${dyLand - 14}px) rotate(${rot + 8}deg) scale(1)`, offset: .92 },
        { transform: `translate(${dxLand + dx * 1.1}px,${dyLand}px) rotate(${rot + 10}deg) scale(1)` },
      ], { duration: reduce ? 200 : 1100, easing: 'cubic-bezier(.3,.1,.4,1)', fill: 'forwards' });
      const anA = run(a, -30 + r(20), 360 + r(80)), anB = run(b, 30 + r(20), -360 + r(80));
      setTimeout(() => {
        clearInterval(flip);
        [[a, faces[0], 'jt-a'], [b, faces[1], 'jt-b']].forEach(([n, f, c]) => { n.src = img(f); n.className = `${c} ${f}`; });
      }, reduce ? 150 : 900);
      Promise.all([anA.finished, anB.finished]).then(() => {
        sfx.knock(); sfx.knock(0.09); sfx.buzz([10, 40, 10]);
        if (key) { res.textContent = NAME[key]; res.className = 'jt-result on ' + key; if (key === 'sheng') sfx.chime(); }
        setTimeout(() => { anA.cancel(); anB.cancel(); el.hidden = true; ok(); }, reduce ? 500 : 1100);
      });
    });
  }
}

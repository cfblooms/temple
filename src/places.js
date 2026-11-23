// 地圖上原本只有介紹的五個地方（加強清單 E）：
//   zx 伴讀自習室：點一根蠟燭當番茄鐘，燒完一根就是讀完一段
//   xd 睡前熄燈室：擦掉心鏡上的灰、慢慢敲三下磬、畫面慢慢暗下來
//   rj 媽祖遶境看板：輸入今天走的步數，換成隨香公里，神轎沿著遶境路線前進
//   sm 朱紅牌樓山門：走龍門、跨門檻不踩門檻，再進正殿
//   wa 淨身石槽：楊柳枝沾抹草水，把身上的灰點點拍掉
// 每個地方都是 360 × 645 的一整張 SVG（跟攤位一樣），圖都是程式畫的，之後有 Gemini 圖再換。
import { reduce, tween, pick, daily, yesterdayKey } from './stall.js';
import { wallet } from './wallet.js';

const NS = 'http://www.w3.org/2000/svg';
const LIFT = 56; // 拿著的東西浮在手指上方
const svgPt = (svg, e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
const put = (el, x, y, r = 0, s = 1) => el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})${r ? ` rotate(${r.toFixed(1)})` : ''}${s !== 1 ? ` scale(${s})` : ''}`);
const mount = (host, inner, cls) => { host.innerHTML = `<svg viewBox="0 0 360 645" xmlns="${NS}" class="place-svg ${cls}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`; return host.querySelector('svg'); };

// 按住拿起來拖：道具浮在手指上方；onMove 拿到的是道具的位置
function dragger(svg, el, { onDown, onMove, onUp, lift = LIFT }) {
  let on = false;
  el.addEventListener('pointerdown', (e) => {
    if (onDown && onDown() === false) return;
    e.preventDefault(); el.setPointerCapture(e.pointerId); on = true;
    const p = svgPt(svg, e); onMove(p.x, p.y - lift, true);
  });
  el.addEventListener('pointermove', (e) => { if (!on) return; const p = svgPt(svg, e); onMove(Math.max(14, Math.min(346, p.x)), Math.max(40, p.y - lift)); });
  const up = () => { if (!on) return; on = false; onUp?.(); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}
const BG = (a, b, id) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="360" height="645" fill="url(#${id})"/>`;
const streakOf = (rec, dayKey) => daily(rec, dayKey(), yesterdayKey());

/* ================= 伴讀自習室：番茄鐘燃燭 ================= */
const ZX_MINS = [15, 25, 45];
const ZX_PAY = 6, ZX_PAY_MAX = 4; // 每完成一根 +6，一天最多算 4 根
const ZX_CHEER = [
  '文昌帝君：「一根蠟燭的時間，專心就夠了。」',
  '文昌帝君：「讀不懂的地方圈起來，明天再看一次就懂了。」',
  '文昌帝君：「起來喝口水、伸個懶腰，休息五分鐘再點下一根。」',
  '文昌帝君：「今天比昨天多懂一點點，就是進步。」',
  '文昌帝君：「不用跟別人比，跟昨天的自己比就好。」',
];
export function initStudy(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, cam } = api;
  const zx = state.zx || (state.zx = { run: null, day: '', n: 0, mins: 0, last: '', streak: 0, total: 0 });
  const svg = mount($('#zxHost'), `${BG('#F3DDB8', '#D9B27E', 'zxBg')}
    <rect x="34" y="70" width="130" height="150" rx="8" fill="#BFE0F2" stroke="#8A5A32" stroke-width="8"/><path d="M99 70v150M34 145h130" stroke="#8A5A32" stroke-width="5"/>
    <circle cx="70" cy="108" r="14" fill="#FFF3C0" opacity=".9"/><path d="M40 200q30-30 60-10t60-6v36H40z" fill="#9CCB8A" opacity=".8"/>
    <g transform="translate(226 74)"><rect width="104" height="66" rx="4" fill="#FFF8EA" stroke="#C8302A" stroke-width="3"/><text x="52" y="28" text-anchor="middle" class="place-sign">文昌帝君</text><text x="52" y="50" text-anchor="middle" class="place-small">伴讀自習室</text></g>
    <text id="zxTime" x="250" y="200" text-anchor="middle" class="zx-time">25:00</text>
    <text id="zxSub" x="250" y="226" text-anchor="middle" class="place-small">點蠟燭開始計時</text>
    <rect x="0" y="430" width="360" height="215" fill="#A0703E"/><rect x="0" y="430" width="360" height="14" fill="#C8955A"/>
    <g transform="translate(70 452)"><path d="M0 18 L-50 4 L-50 -40 L0 -26Z" fill="#FFF8EA" stroke="#C9B48A"/><path d="M0 18 L50 4 L50 -40 L0 -26Z" fill="#FFFDF4" stroke="#C9B48A"/><path d="M-42 -22h34M-42 -14h34M-42 -6h30M8 -22h34M8 -14h34M8 -6h26" stroke="#8A7A60" stroke-width="1.4" opacity=".55"/></g>
    <g transform="translate(300 452)"><rect x="-10" y="-80" width="8" height="80" fill="#3B3B3B"/><path d="M-36 -78 L22 -78 L8 -106 L-22 -106Z" fill="#2E7A5A"/><ellipse cx="-6" cy="0" rx="26" ry="6" fill="#3B3B3B"/><path id="zxLampLight" d="M-30 -78 L-70 0 L58 0 L18 -78Z" fill="#FFF3C0" opacity=".18"/></g>
    <g id="zxCandle" class="place-hit" tabindex="0" role="button" aria-label="點蠟燭開始番茄鐘">
      <ellipse cx="180" cy="440" rx="44" ry="10" fill="#B8863A"/><path d="M146 440 Q180 456 214 440 L206 426 L154 426Z" fill="#E0B050"/>
      <rect id="zxWax" x="164" y="300" width="32" height="126" rx="6" fill="#D8343A"/><rect id="zxWaxHi" x="168" y="300" width="7" height="126" rx="3" fill="#F2787A" opacity=".7"/>
      <path id="zxWick" d="M180 300v-12" stroke="#2A1A10" stroke-width="2"/>
      <g id="zxFlame" opacity="0"><ellipse cx="180" cy="270" rx="34" ry="40" fill="#FFE29A" opacity=".25"/><path d="M180 254 C192 270 190 284 180 290 C170 284 168 270 180 254Z" fill="#FFB43A"/><path d="M180 266 C185 274 184 282 180 286 C176 282 175 274 180 266Z" fill="#FFF4C0"/></g>
      <rect x="130" y="240" width="100" height="210" fill="#000" opacity="0"/>
    </g>
    <g id="zxDots" transform="translate(180 560)"></g>
    <text x="180" y="610" text-anchor="middle" class="place-small" fill="#FFF4E0" id="zxToday"></text>`, 'zx-svg');
  const S = (id) => svg.querySelector('#' + id);
  let tick = 0;
  const today = () => (zx.day === dayKey() ? zx.n : 0);
  const fmt = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  function paint() {
    const r = zx.run, now = Date.now();
    const left = r ? r.t0 + r.mins * 60000 - now : 0, k = r ? Math.max(0, Math.min(1, left / (r.mins * 60000))) : 1;
    const h = 20 + 106 * k, y = 426 - h;
    S('zxWax').setAttribute('y', y.toFixed(1)); S('zxWax').setAttribute('height', h.toFixed(1));
    S('zxWaxHi').setAttribute('y', y.toFixed(1)); S('zxWaxHi').setAttribute('height', h.toFixed(1));
    S('zxWick').setAttribute('d', `M180 ${y.toFixed(1)}v-12`);
    S('zxFlame').setAttribute('transform', `translate(0 ${(y - 300).toFixed(1)})`);
    S('zxFlame').setAttribute('opacity', r ? '1' : '0');
    S('zxTime').textContent = r ? fmt(left) : `${zx.pick || 25}:00`;
    S('zxSub').textContent = r ? `專心讀書中・${r.mins} 分鐘` : '點蠟燭開始計時';
    const n = today();
    S('zxDots').innerHTML = Array.from({ length: Math.max(4, n) }, (_, i) => `<g transform="translate(${(i - (Math.max(4, n) - 1) / 2) * 30} 0)"><circle r="11" fill="${i < n ? '#D8343A' : 'none'}" stroke="#FFE08A" stroke-width="2"/>${i < n ? '<path d="M0 -14v-5" stroke="#FFB43A" stroke-width="3" stroke-linecap="round"/>' : ''}</g>`).join('');
    S('zxToday').textContent = `今天燒完 ${n} 根・總共讀了 ${zx.mins} 分鐘`;
  }
  function check() {
    const r = zx.run; if (!r) return;
    if (Date.now() >= r.t0 + r.mins * 60000) finish();
  }
  function finish() {
    const r = zx.run; zx.run = null;
    if (zx.day !== dayKey()) { zx.day = dayKey(); zx.n = 0; }
    zx.n++; zx.mins += r.mins; streakOf(zx, dayKey); save();
    sfx.chime(); sfx.buzz?.([30, 60, 30]);
    burst('spark', 180, 300, reduce ? 4 : 18);
    if (zx.n <= ZX_PAY_MAX) wallet.earn(ZX_PAY, '番茄鐘', 180, 250);
    paint();
    say(`一根蠟燭燒完了，專心了 <b>${r.mins} 分鐘</b>！${pick(ZX_CHEER)}${zx.n <= ZX_PAY_MAX ? `福氣 +${ZX_PAY}。` : ''}今天第 ${zx.n} 根，連續 ${zx.streak} 天來自習。`, 'god');
  }
  function choose() {
    if (zx.run) { say(`蠟燭還在燒，剩 <b>${fmt(zx.run.t0 + zx.run.mins * 60000 - Date.now())}</b>。可以先離開，時間到回來就會算。`, 'god'); return; }
    const body = openSheet('點一根讀書蠟燭', `<p class="hint">蠟燭燒完就是讀完一段。中間可以離開這個畫面，回來時間到了就算數。</p>
      <div class="row">${ZX_MINS.map((m) => `<button type="button" class="btn ${m === 25 ? 'gold' : 'ghost'}" data-m="${m}">${m} 分鐘${m === 25 ? '（番茄鐘）' : ''}</button>`).join('')}</div>`);
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]'); if (!b) return;
      closeSheet(); light(+b.dataset.m);
    });
  }
  function light(mins) {
    zx.run = { t0: Date.now(), mins }; zx.pick = mins; save();
    sfx.pop(); emit('spark', 180, 286); cam?.zoom?.(180, 330, 260);
    setTimeout(() => cam?.reset?.(700), 900);
    paint();
    say(`蠟燭點上了，<b>${mins} 分鐘</b>專心讀書。手機放旁邊，燒完會叮一聲。`, 'god');
  }
  function quit() {
    if (!zx.run) { say('還沒點蠟燭喔。點桌上的紅蠟燭開始。', 'god'); return; }
    zx.run = null; save(); paint(); sfx.knock();
    say('蠟燭先吹熄了。沒關係，累了就休息，等一下再點一根。', 'god');
  }
  function log() {
    openSheet('讀書紀錄', `<p>今天燒完 <b>${today()}</b> 根蠟燭，總共專心讀了 <b>${zx.mins}</b> 分鐘。</p>
      <p>來自習 <b>${zx.total}</b> 天，連續 <b>${zx.streak}</b> 天。</p>
      <p class="hint">每天前 ${ZX_PAY_MAX} 根各有福氣 +${ZX_PAY}。讀 25 分鐘、休息 5 分鐘，最不容易累。</p>`);
  }
  S('zxCandle').addEventListener('click', choose);
  S('zxCandle').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } });
  $('#zxBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-zx]'); if (!b) return;
    ({ light: choose, quit, log })[b.dataset.zx]();
  });
  return {
    enter() {
      check(); paint();
      clearInterval(tick); tick = setInterval(() => { check(); paint(); S('zxFlame').setAttribute('opacity', zx.run ? (0.85 + Math.random() * .15).toFixed(2) : '0'); }, 1000);
      if (!zx.run) say('伴讀自習室：點桌上的<b>紅蠟燭</b>，選要讀多久，蠟燭燒完就是讀完一段。', 'god');
      else say(`蠟燭還在燒，剩 <b>${fmt(zx.run.t0 + zx.run.mins * 60000 - Date.now())}</b>，繼續加油。`, 'god');
    },
    leave() { clearInterval(tick); tick = 0; },
  };
}

/* ================= 睡前熄燈室：擦心鏡、敲磬、慢慢變暗 ================= */
const DUST = [[132, 196], [164, 172], [204, 180], [232, 214], [150, 236], [196, 226], [226, 268], [134, 280], [172, 300], [212, 312], [178, 260], [246, 244]];
const XD_PAY = 5;
export function initSleep(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, dayKey, cam } = api;
  const xd = state.xd || (state.xd = { last: '', streak: 0, total: 0 });
  const MIRROR = [190, 244], BELL = [262, 486], CLOTH_REST = [76, 590];
  const svg = mount($('#xdHost'), `${BG('#2C2848', '#16132A', 'xdBg')}
    ${Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 67) % 340 + 10}" cy="${(i * 41) % 130 + 20}" r="${i % 3 ? 1.2 : 1.8}" fill="#FFF3C0" opacity=".7"/>`).join('')}
    <rect x="0" y="420" width="360" height="225" fill="#3A2E3A"/><rect x="20" y="430" width="320" height="18" rx="4" fill="#5A4250"/>
    <g transform="translate(${MIRROR[0]} ${MIRROR[1]})"><circle r="104" fill="#8A6A3A"/><circle r="94" fill="#C8B080"/><circle r="88" fill="#9EB8D0"/><circle id="xdGlow" r="88" fill="#E8F4FF" opacity="0"/><path d="M-50 -50 Q-20 -70 10 -60" stroke="#FFF" stroke-width="6" opacity=".35" fill="none" stroke-linecap="round"/></g>
    <text x="${MIRROR[0]}" y="${MIRROR[1] + 128}" text-anchor="middle" class="place-small" fill="#E8E0FF">心鏡</text>
    <g id="xdDust">${DUST.map(([x, y], i) => `<g class="xd-dust" transform="translate(${x} ${y})"><circle r="${16 + (i % 3) * 4}" fill="#6A6070" opacity=".85"/><circle cx="5" cy="-4" r="${7 + (i % 2) * 3}" fill="#7A7080" opacity=".8"/></g>`).join('')}</g>
    <g transform="translate(96 472)"><ellipse cx="0" cy="10" rx="20" ry="5" fill="#2A1A10" opacity=".5"/><path d="M-14 8 Q0 18 14 8 L10 -2 L-10 -2Z" fill="#C8963E"/><g id="xdLamp"><ellipse cx="0" cy="-22" rx="22" ry="26" fill="#FFE29A" opacity=".22"/><path d="M0 -26 C6 -18 6 -10 0 -6 C-6 -10 -6 -18 0 -26Z" fill="#FFB43A"/></g></g>
    <g id="xdBell" class="place-hit" tabindex="0" role="button" aria-label="敲磬"><ellipse cx="${BELL[0]}" cy="${BELL[1] + 30}" rx="50" ry="12" fill="#8A2A2A"/><path d="M${BELL[0] - 40} ${BELL[1] - 10} Q${BELL[0]} ${BELL[1] + 50} ${BELL[0] + 40} ${BELL[1] - 10}Z" fill="#B8863A"/><ellipse cx="${BELL[0]}" cy="${BELL[1] - 10}" rx="40" ry="9" fill="#6A4A20"/><ellipse cx="${BELL[0]}" cy="${BELL[1] - 11}" rx="34" ry="6" fill="#3A2A12"/><rect x="${BELL[0] - 60}" y="${BELL[1] - 40}" width="120" height="90" fill="#000" opacity="0"/></g>
    <g id="xdMallet" transform="translate(320 470) rotate(30)"><rect x="-3" y="-44" width="6" height="50" rx="3" fill="#7A4A22"/><rect x="-9" y="-56" width="18" height="16" rx="5" fill="#E0D0B0"/></g>
    <g id="xdRings"></g>
    <g id="xdCloth" class="place-hit" tabindex="0" role="button" aria-label="拿抹布擦心鏡"><rect x="-26" y="-18" width="52" height="36" rx="8" fill="#F4ECDC" stroke="#C9B48A" stroke-width="2"/><path d="M-18 -8h36M-18 2h36M-18 12h26" stroke="#D8C8A8" stroke-width="2"/><rect x="-40" y="-36" width="80" height="72" fill="#000" opacity="0"/></g>
    <text id="xdStep" x="180" y="404" text-anchor="middle" class="place-sign" fill="#FFE08A"></text>
    <rect id="xdDark" width="360" height="645" fill="#05040C" opacity="0" pointer-events="none"/>
    <text id="xdBreath" x="190" y="256" text-anchor="middle" class="xd-breath" opacity="0"></text>`, 'xd-svg');
  const S = (id) => svg.querySelector('#' + id);
  const dust = [...svg.querySelectorAll('.xd-dust')].map((el, i) => ({ el, x: DUST[i][0], y: DUST[i][1], a: .85 }));
  let phase = 'idle', hits = 0, lastHit = 0, run = 0, cloth = [...CLOTH_REST];
  const moveCloth = (x, y) => { cloth = [x, y]; put(S('xdCloth'), x, y); };
  function reset() {
    run++; phase = 'wipe'; hits = 0; lastHit = 0;
    dust.forEach((d) => { d.a = .85; d.el.setAttribute('opacity', '1'); });
    moveCloth(...CLOTH_REST); S('xdCloth').style.display = '';
    S('xdGlow').setAttribute('opacity', '0'); S('xdDark').setAttribute('opacity', '0'); S('xdBreath').setAttribute('opacity', '0');
    S('xdLamp').setAttribute('transform', ''); S('xdStep').textContent = '一、擦去心鏡上的灰塵';
    document.body.classList.remove('xd-night');
    say('睡前一分鐘。先拿<b>左下角的抹布</b>，把心鏡上灰灰的點點擦乾淨，像把今天的煩心事擦掉。', 'god');
  }
  dragger(svg, S('xdCloth'), {
    onDown: () => phase === 'wipe',
    onMove(x, y, first) {
      moveCloth(x, y); if (first) cam?.zoom?.(MIRROR[0], MIRROR[1] + 30, 280);
      for (const d of dust) if (d.a > 0 && Math.hypot(d.x - x, d.y - y) < 34) {
        d.a = d.a - .12; if (d.a < .03) d.a = 0; d.el.setAttribute('opacity', (d.a / .85).toFixed(2));
        if (d.a === 0) { emit('spark', d.x, d.y); sfx.pop(); }
      }
      const left = dust.filter((d) => d.a > 0).length;
      S('xdGlow').setAttribute('opacity', ((1 - left / dust.length) * .45).toFixed(2));
      if (!left && phase === 'wipe') wiped();
    },
    onUp() { if (phase === 'wipe') { cam?.reset?.(300); tween(300, (k) => moveCloth(cloth[0] + (CLOTH_REST[0] - cloth[0]) * k, cloth[1] + (CLOTH_REST[1] - cloth[1]) * k)); } },
  });
  function wiped() {
    phase = 'bell'; cam?.reset?.(500); S('xdCloth').style.display = 'none';
    burst('spark', MIRROR[0], MIRROR[1], reduce ? 3 : 14); sfx.chime();
    S('xdStep').textContent = '二、慢慢敲磬三下';
    say('心鏡亮了。接著<b>點右邊的磬</b>，敲三下。每一下都等聲音慢慢散掉，再敲下一下。', 'god');
  }
  function ring() {
    if (phase !== 'bell') return;
    const now = performance.now();
    if (hits && now - lastHit < 1800) { say('還在響呢…等聲音<b>慢慢散掉</b>再敲。', 'god'); return; }
    hits++; lastHit = now; sfx.bowl(); sfx.buzz?.(12);
    const m = S('xdMallet');
    tween(160, (k) => m.setAttribute('transform', `translate(${320 - k * 30} ${470 - k * 10}) rotate(${30 - k * 50})`)).then(() => tween(400, (k) => m.setAttribute('transform', `translate(${290 + k * 30} ${460 + k * 10}) rotate(${-20 + k * 50})`)));
    const g = document.createElementNS(NS, 'ellipse');
    g.setAttribute('cx', BELL[0]); g.setAttribute('cy', BELL[1] - 10); g.setAttribute('fill', 'none'); g.setAttribute('stroke', '#FFE08A'); g.setAttribute('stroke-width', '2');
    S('xdRings').appendChild(g);
    tween(1800, (k) => { g.setAttribute('rx', (40 + k * 120).toFixed(1)); g.setAttribute('ry', (9 + k * 30).toFixed(1)); g.setAttribute('opacity', (1 - k).toFixed(2)); }).then(() => g.remove());
    emit('text', BELL[0], BELL[1] - 60, { text: ['一', '二', '三'][hits - 1], color: '#FFE08A', life: 1.2, vy: -20 });
    if (hits >= 3) { phase = 'dim'; setTimeout(dim, 1600); }
  }
  S('xdBell').addEventListener('click', ring);
  S('xdBell').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ring(); } });
  S('xdCloth').addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && phase === 'wipe') { e.preventDefault(); dust.forEach((d) => { d.a = 0; d.el.setAttribute('opacity', '0'); }); wiped(); } });
  function dim() {
    const my = run;
    S('xdStep').textContent = '三、跟著呼吸，慢慢變暗';
    say('跟著字慢慢呼吸。畫面會越來越暗，暗了就把手機放下，晚安。', 'god');
    const B = S('xdBreath'); const words = ['吸氣…', '吐氣…', '吸氣…', '吐氣…', '吸氣…', '吐氣…'];
    words.forEach((w, i) => setTimeout(() => { if (my !== run) return; B.textContent = w; tween(1800, (k) => B.setAttribute('opacity', Math.sin(k * Math.PI).toFixed(2)), (k) => k); }, i * 2000));
    tween(12000, (k) => { if (my !== run) return; S('xdDark').setAttribute('opacity', (k * .82).toFixed(3)); S('xdLamp').setAttribute('transform', `scale(${(1 - k * .6).toFixed(3)})`); }, (k) => k)
      .then(() => {
        if (my !== run) return;
        phase = 'done'; B.textContent = '晚安'; B.setAttribute('opacity', '1');
        const first = streakOf(xd, dayKey); save();
        if (first) wallet.earn(XD_PAY, '睡前熄燈', 180, 330);
        document.body.classList.add('xd-night');
        say(`晚安。${first ? `今天的熄燈儀式完成，福氣 +${XD_PAY}。` : ''}已經連續 <b>${xd.streak}</b> 天好好睡前放鬆。點一下畫面就會亮回來。`, 'god');
      });
  }
  document.addEventListener('pointerdown', () => { if (document.body.classList.contains('xd-night')) document.body.classList.remove('xd-night'); }, true);
  $('#xdBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-xd]'); if (!b) return;
    if (b.dataset.xd === 'start') reset();
    else openSheet('睡前紀錄', `<p>睡前熄燈 <b>${xd.total}</b> 天，連續 <b>${xd.streak}</b> 天。</p><p class="hint">每天第一次做完福氣 +${XD_PAY}。擦心鏡、敲三下磬、跟著呼吸，大約一分鐘，做完就把手機放下吧。</p>`);
  });
  return {
    enter() { reset(); },
    leave() { run++; phase = 'idle'; document.body.classList.remove('xd-night'); },
  };
}

/* ================= 媽祖遶境看板：步數換隨香公里 ================= */
// 大甲媽遶境的主要停駕點（公里數是大約的累計距離）
const RJ_STOPS = [
  { km: 0, name: '大甲鎮瀾宮', line: '起駕！神轎從大甲出發，鞭炮聲響個不停。' },
  { km: 38, name: '彰化南瑤宮', line: '進了彰化，路邊的阿伯請大家喝涼水。' },
  { km: 62, name: '員林福寧宮', line: '員林的香客好多，有人在發平安餅。' },
  { km: 88, name: '北斗奠安宮', line: '北斗肉圓的香味飄過來了。' },
  { km: 108, name: '西螺福興宮', line: '過了西螺大橋，進入雲林。' },
  { km: 170, name: '新港奉天宮', line: '到新港了！媽祖在這裡祝壽，大家一起拜拜。' },
  { km: 232, name: '西螺（回程）', line: '回程了，腳有點痠，但心裡很滿。' },
  { km: 300, name: '彰化（回程）', line: '快到家了，路上的人都說「媽祖辛苦了」。' },
  { km: 340, name: '回鑾大甲', line: '回鑾！走完一整趟遶境，好厲害。' },
];
const RJ_LAP = 340, STEP_KM = .0007; // 一步大約 70 公分
const RJ_PATH = [[70, 150], [110, 205], [96, 262], [150, 300], [128, 352], [196, 404], [268, 452], [214, 494], [138, 520], [70, 470]]; // 看板上的路線（跟停駕點一一對應，最後一點回到起點附近）
export function initBoard(api) {
  const { $, state, save, say, sfx, burst, openSheet, closeSheet, dayKey, esc } = api;
  const rj = state.rj || (state.rj = { km: 0, laps: 0, log: {}, stop: 0 });
  const stopXY = (i) => (i === RJ_STOPS.length - 1 ? [70, 150] : RJ_PATH[i]);
  const svg = mount($('#rjHost'), `${BG('#F6E6C8', '#E6C894', 'rjBg')}
    <rect x="18" y="60" width="324" height="520" rx="14" fill="#8A2A22"/><rect x="30" y="72" width="300" height="496" rx="8" fill="#FFF6E2"/>
    <text x="180" y="108" text-anchor="middle" class="place-sign">三月瘋媽祖・隨香看板</text>
    <path d="M${RJ_PATH.map((p) => p.join(' ')).join(' L')} L70 150" fill="none" stroke="#E8C690" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <path id="rjDone" fill="none" stroke="#E0443E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    ${RJ_STOPS.slice(0, -1).map((s, i) => `<g transform="translate(${RJ_PATH[i][0]} ${RJ_PATH[i][1]})"><circle r="8" fill="#FFF6E2" stroke="#C8302A" stroke-width="3" class="rj-stop" id="rjS${i}"/><text x="${RJ_PATH[i][0] > 200 ? -14 : 14}" y="4" text-anchor="${RJ_PATH[i][0] > 200 ? 'end' : 'start'}" class="place-small">${s.name}</text></g>`).join('')}
    <g id="rjSedan"><ellipse cx="0" cy="4" rx="16" ry="4" fill="#000" opacity=".2"/><rect x="-11" y="-22" width="22" height="22" rx="3" fill="#E0443E" stroke="#8A2A22" stroke-width="1.6"/><path d="M-15 -22 L0 -32 L15 -22Z" fill="#F3C64A" stroke="#8A2A22" stroke-width="1.4"/><rect x="-6" y="-17" width="12" height="10" fill="#FFE08A"/><path d="M-20 -4h40" stroke="#7A4A22" stroke-width="3" stroke-linecap="round"/></g>
    <text id="rjKm" x="180" y="610" text-anchor="middle" class="rj-km"></text>
    <text id="rjNext" x="180" y="634" text-anchor="middle" class="place-small"></text>`, 'rj-svg');
  const S = (id) => svg.querySelector('#' + id);
  // 這一趟走到哪：回傳座標和已走過的折線
  function at(km) {
    const k = km % RJ_LAP; let i = 0;
    while (i < RJ_STOPS.length - 2 && k >= RJ_STOPS[i + 1].km) i++;
    const a = RJ_STOPS[i], b = RJ_STOPS[i + 1], t = (k - a.km) / (b.km - a.km);
    const [x0, y0] = stopXY(i), [x1, y1] = stopXY(i + 1);
    const pts = RJ_PATH.slice(0, i + 1).concat([[x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]]);
    return { i, pos: pts[pts.length - 1], pts };
  }
  function paint() {
    const { i, pos, pts } = at(rj.km);
    S('rjDone').setAttribute('d', 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L'));
    put(S('rjSedan'), pos[0], pos[1]);
    RJ_STOPS.slice(0, -1).forEach((_, j) => S('rjS' + j).setAttribute('fill', j <= i ? '#F3C64A' : '#FFF6E2'));
    const lapKm = rj.km % RJ_LAP, nx = RJ_STOPS[i + 1];
    S('rjKm').textContent = `隨香 ${lapKm.toFixed(1)}／${RJ_LAP} 公里${rj.laps ? `・已走完 ${rj.laps} 趟` : ''}`;
    S('rjNext').textContent = `下一站 ${nx.name}，還有 ${(nx.km - lapKm).toFixed(1)} 公里`;
  }
  function addSteps(steps) {
    const t = dayKey(), before = rj.log[t] || 0;
    steps = Math.max(0, Math.min(60000, Math.round(steps)));
    const add = (steps - before) * STEP_KM; // 今天改數字只算差額
    rj.log[t] = steps;
    const keys = Object.keys(rj.log).sort((a, b) => new Date(a) - new Date(b)); while (keys.length > 60) delete rj.log[keys.shift()];
    const fromKm = rj.km; rj.km = Math.max(0, rj.km + add);
    const passed = [];
    const lap0 = Math.floor(fromKm / RJ_LAP), lap1 = Math.floor(rj.km / RJ_LAP);
    for (let L = lap0; L <= lap1; L++) for (const s of RJ_STOPS.slice(1)) { const at = L * RJ_LAP + s.km; if (at > fromKm && at <= rj.km) passed.push(s); }
    save();
    // 神轎慢慢走過去
    const toKm = rj.km;
    rj.km = fromKm;
    tween(reduce ? 100 : 1400, (k) => { rj.km = fromKm + (toKm - fromKm) * k; paint(); }).then(() => {
      rj.km = toKm;
      let msg = `今天走了 <b>${steps.toLocaleString()}</b> 步，大約 ${(steps * STEP_KM).toFixed(1)} 公里，神轎跟著你往前走。`;
      for (const s of passed) {
        if (s.km === RJ_LAP) { rj.laps++; wallet.earn(88, '走完一趟遶境', 180, 300); msg += `<br><b>${s.line}</b>福氣 +88。`; }
        else { wallet.earn(10, `隨香到${s.name}`, 180, 300); msg += `<br>到了<b>${s.name}</b>：${s.line}福氣 +10。`; }
      }
      save(); paint();
      if (passed.length) { sfx.chime(); burst('spark', ...at(rj.km).pos, reduce ? 4 : 16); } else sfx.pop();
      say(msg, 'god');
    });
  }
  function ask() {
    const t = dayKey(), now = rj.log[t] || 0;
    const body = openSheet('今天走了幾步？', `<p class="hint">打開手機的健康或計步 App，看今天走了幾步，填進來。一步大約 70 公分，會換算成隨香公里。${now ? `今天已經記了 ${now.toLocaleString()} 步，改數字只會補差額。` : ''}</p>
      <input id="rjIn" type="number" inputmode="numeric" min="0" max="60000" step="100" value="${now || ''}" placeholder="例如 6000" class="rj-in" aria-label="今天的步數">
      <div class="row">${[3000, 6000, 10000].map((n) => `<button type="button" class="btn ghost" data-n="${n}">${n.toLocaleString()} 步</button>`).join('')}</div>
      <div class="row"><button type="button" class="btn gold" id="rjOk">記下來，跟著神轎走</button></div>`);
    body.addEventListener('click', (e) => {
      const n = e.target.closest('[data-n]'); if (n) { body.querySelector('#rjIn').value = n.dataset.n; return; }
      if (e.target.closest('#rjOk')) {
        const v = +body.querySelector('#rjIn').value;
        if (!(v > 0)) { body.querySelector('#rjIn').focus(); return; }
        closeSheet(); addSteps(v);
      }
    });
  }
  function route() {
    const lapKm = rj.km % RJ_LAP;
    const days = Object.entries(rj.log).slice(-7).map(([d, n]) => `<li>${esc(d.slice(5))}：${n.toLocaleString()} 步</li>`).join('');
    openSheet('遶境路線', `<p>大甲媽祖每年三月遶境，九天八夜、來回大約 ${RJ_LAP} 公里。你每天走路，神轎就跟著往前一點。</p>
      <ul class="ts-list">${RJ_STOPS.map((s) => `<li>${lapKm >= s.km && s.km < RJ_LAP ? '✓' : '・'} ${s.name}（約 ${s.km} 公里）</li>`).join('')}</ul>
      ${days ? `<p><b>最近的步數</b></p><ul class="ts-list">${days}</ul>` : ''}
      <p class="hint">公里數是大約的，真的要去隨香記得穿好走的鞋、多喝水。</p>`);
  }
  $('#rjBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-rj]'); if (!b) return;
    if (b.dataset.rj === 'steps') ask(); else route();
  });
  return {
    enter() {
      paint();
      say(rj.log[dayKey()] ? `今天記了 ${rj.log[dayKey()].toLocaleString()} 步。走更多可以再改數字。` : '媽祖遶境看板：今天走了幾步？按<b>記步數</b>填進來，神轎就跟著你往前走。', 'god');
    },
    leave() {},
  };
}

/* ================= 朱紅牌樓山門：龍門進、跨門檻 ================= */
export function initGate(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, dayKey, cam, me, goHall } = api;
  const sm = state.sm || (state.sm = { last: '', streak: 0, total: 0 });
  const SILL = 452; // 門檻的高度
  const DOORS = [{ id: 'tiger', x: 70, name: '虎門' }, { id: 'mid', x: 180, name: '中門' }, { id: 'dragon', x: 290, name: '龍門' }];
  const svg = mount($('#smHost'), `${BG('#BFE0F2', '#F6E6C8', 'smBg')}
    <circle cx="300" cy="80" r="26" fill="#FFF3C0"/>
    <rect x="0" y="470" width="360" height="175" fill="#C8B89A"/><path d="M0 500h360M0 540h360M0 590h360M60 470v175M150 470v175M240 470v175M320 470v175" stroke="#B0A080" stroke-width="2"/>
    <g id="smArch">
      <path d="M0 132 Q180 92 360 132 L360 156 L0 156Z" fill="#2E6A4A"/><path d="M-6 132 Q180 86 366 132" stroke="#F3C64A" stroke-width="5" fill="none"/>
      <rect x="10" y="156" width="340" height="40" fill="#C8302A"/><rect x="120" y="160" width="120" height="32" rx="3" fill="#1E3A6A" stroke="#F3C64A" stroke-width="3"/><text x="180" y="184" text-anchor="middle" class="sm-plaque">心靈大廟</text>
      ${[14, 124, 216, 326].map((x) => `<rect x="${x}" y="196" width="20" height="${SILL - 196 + 12}" fill="#B8302A" stroke="#7A1E1A" stroke-width="2"/>`).join('')}
      <rect x="34" y="196" width="90" height="14" fill="#E0443E"/><rect x="236" y="196" width="90" height="14" fill="#E0443E"/><rect x="144" y="196" width="72" height="14" fill="#E0443E"/>
      ${DOORS.map((d) => `<g class="place-hit sm-door" data-door="${d.id}" tabindex="0" role="button" aria-label="走${d.name}"><rect x="${d.id === 'mid' ? 144 : d.x - 36}" y="210" width="${d.id === 'mid' ? 72 : 72}" height="${SILL - 210}" fill="#FFF8EA" opacity=".001"/><text x="${d.x}" y="238" text-anchor="middle" class="sm-door-t">${d.name}</text></g>`).join('')}
      <rect id="smSill" x="10" y="${SILL}" width="340" height="18" rx="3" fill="#7A4A22" stroke="#4A2A12" stroke-width="2"/>
    </g>
    <g id="smMe" transform="translate(290 560)"><ellipse cx="0" cy="34" rx="30" ry="6" fill="#000" opacity=".18"/><circle r="30" fill="#FFF4E0" stroke="#E0A440" stroke-width="3"/><clipPath id="smMeC"><circle r="27"/></clipPath><image id="smMeImg" x="-27" y="-27" width="54" height="54" clip-path="url(#smMeC)" preserveAspectRatio="xMidYMid slice"/></g>
    <g id="smFoot" class="place-hit" style="display:none" tabindex="0" role="button" aria-label="抬腳跨過門檻"><ellipse cx="0" cy="0" rx="16" ry="24" fill="#3B2A22"/><ellipse cx="0" cy="-8" rx="11" ry="13" fill="#5A4234"/><rect x="-30" y="-36" width="60" height="72" fill="#000" opacity="0"/></g>
    <text id="smTip" x="180" y="620" text-anchor="middle" class="place-small"></text>`, 'sm-svg');
  const S = (id) => svg.querySelector('#' + id);
  let phase = 'door', foot = [290, 520], inSill = 0, slips = 0;
  const FOOT_REST = [290, 530];
  function reset() {
    phase = 'door'; slips = 0; inSill = 0; cam?.reset?.(0);
    S('smMeImg').setAttribute('href', me().face); put(S('smMe'), 180, 560);
    S('smFoot').style.display = 'none'; S('smTip').textContent = '進廟要從哪一個門走？';
    say('來到山門了。牌樓下有三個門，<b>進廟要走哪一個？</b>點一下門。', 'temple');
  }
  function pickDoor(id) {
    if (phase !== 'door') return;
    if (id === 'mid') { sfx.knock(); say('<b>中門</b>是神明走的，平常人不走中門喔。再選一次。', 'temple'); return; }
    if (id === 'tiger') { sfx.knock(); say('<b>虎門</b>是出廟時走的（龍進虎出）。進廟要走另一邊。', 'temple'); return; }
    phase = 'sill'; sfx.pop();
    tween(500, (k) => put(S('smMe'), 180 + 110 * k, 560));
    say('對！<b>龍門</b>進、虎門出。接著抬腳<b>跨過門檻</b>：按住腳往上拉，要一下子跨過去，<b>不要踩在門檻上</b>。', 'temple');
    S('smTip').textContent = '按住腳，快快往上跨過門檻';
    setTimeout(() => { S('smFoot').style.display = ''; foot = [...FOOT_REST]; put(S('smFoot'), ...foot); cam?.zoom?.(290, 470, 230); }, 520);
  }
  svg.querySelectorAll('.sm-door').forEach((el) => {
    el.addEventListener('click', () => pickDoor(el.dataset.door));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickDoor(el.dataset.door); } });
  });
  // 腳在門檻那一帶停太久就算踩到
  dragger(svg, S('smFoot'), {
    lift: 40,
    onDown: () => phase === 'sill',
    onMove(x, y) {
      if (phase !== 'sill') return;
      foot = [Math.max(250, Math.min(330, x)), Math.min(FOOT_REST[1], y)]; put(S('smFoot'), ...foot);
      const over = foot[1] > SILL - 18 && foot[1] < SILL + 30;
      if (over) { if (!inSill) inSill = performance.now(); else if (performance.now() - inSill > 320) stepped(); }
      else inSill = 0;
      if (foot[1] < SILL - 40) crossed();
    },
    onUp() { if (phase === 'sill') { inSill = 0; tween(250, (k) => put(S('smFoot'), foot[0] + (FOOT_REST[0] - foot[0]) * k, foot[1] + (FOOT_REST[1] - foot[1]) * k)); foot = [...FOOT_REST]; } },
  });
  S('smFoot').addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && phase === 'sill') { e.preventDefault(); crossed(); } });
  function stepped() {
    inSill = 0; slips++; sfx.knock(); emit('text', foot[0], SILL - 30, { text: '踩到了', color: '#FFB0B0', life: .9, vy: -30 });
    foot = [...FOOT_REST]; put(S('smFoot'), ...foot);
    say('哎呀，<b>踩到門檻</b>了。門檻是神明的肩膀，要一步<b>跨過去</b>。再試一次，往上拉快一點。', 'temple');
  }
  function crossed() {
    phase = 'in'; S('smFoot').style.display = 'none'; cam?.reset?.(500);
    tween(700, (k) => put(S('smMe'), 290, 560 - k * 180, 0, 1 - k * .4)).then(() => {
      burst('spark', 290, 360, reduce ? 4 : 18); sfx.chime();
      const first = streakOf(sm, dayKey); save();
      if (first) wallet.earn(3, '跨過山門', 290, 330);
      S('smTip').textContent = '';
      say(`跨進山門了${slips ? '' : '，一次就成功'}！從這裡開始，就從日常走進廟裡。${first ? '福氣 +3。' : ''}按<b>進正殿</b>去參拜吧。`, 'temple');
    });
  }
  $('#smBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-sm]'); if (!b) return;
    if (b.dataset.sm === 'again') reset();
    else if (b.dataset.sm === 'hall') goHall();
    else openSheet('山門小知識', `<p><b>龍進虎出</b>：面對廟，右手邊是龍門（進），左手邊是虎門（出）。中門是神明走的。</p>
      <p><b>不踩門檻</b>：門檻像是神明的肩膀，也是擋住外面煩惱的那條線，要跨過去，不要踩。</p>
      <p class="hint">跨過山門 ${sm.total} 次，連續 ${sm.streak} 天。</p>`);
  });
  return { enter: reset, leave() { cam?.reset?.(0); } };
}

/* ================= 淨身石槽：楊柳枝沾抹草水 ================= */
const SPOTS = [[150, 216], [210, 210], [130, 290], [232, 292], [180, 330], [120, 380], [244, 376], [170, 410], [206, 440]];
export function initWash(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, dayKey, cam, me } = api;
  const wa = state.wash || (state.wash = { last: '', streak: 0, total: 0 });
  const TROUGH = [180, 548], REST = [306, 560];
  const svg = mount($('#waHost'), `${BG('#E2EEDC', '#C8D8B8', 'waBg')}
    <path d="M0 140 Q60 90 120 140 T240 140 T360 130 V0 H0Z" fill="#8AB878" opacity=".5"/>
    ${[40, 320].map((x) => `<g transform="translate(${x} 70)"><path d="M0 0 v120" stroke="#6A4A2A" stroke-width="6"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M0 ${i * 8} q${x < 180 ? 20 : -20} 40 ${x < 180 ? 10 : -10} 110" stroke="#7AAA5A" stroke-width="2.4" fill="none" opacity=".8"/>`).join('')}</g>`).join('')}
    <rect x="0" y="470" width="360" height="175" fill="#B8B0A0"/>
    <g id="waMe"><ellipse cx="180" cy="468" rx="80" ry="12" fill="#000" opacity=".15"/><image id="waMeImg" x="70" y="170" width="220" height="300" preserveAspectRatio="xMidYMax meet"/></g>
    <g id="waSpots">${SPOTS.map(([x, y], i) => `<g class="wa-spot" transform="translate(${x} ${y})"><circle r="${12 + (i % 3) * 3}" fill="#5A5048" opacity=".55"/><circle cx="4" cy="-3" r="6" fill="#4A4038" opacity=".5"/></g>`).join('')}</g>
    <g transform="translate(${TROUGH[0]} ${TROUGH[1]})"><rect x="-120" y="-30" width="240" height="62" rx="18" fill="#8A8478" stroke="#5A5448" stroke-width="3"/><rect x="-106" y="-22" width="212" height="26" rx="10" fill="#7AB8C8"/><path d="M-90 -12q20 -6 40 0t40 0t40 0t40 0" stroke="#BFE6F2" stroke-width="2" fill="none"/><text y="24" text-anchor="middle" class="place-small" fill="#FFF4E0">抹草水</text></g>
    <g id="waWet" transform="translate(326 300)"><rect width="16" height="80" rx="8" fill="#FFF" stroke="#5A8A9A" stroke-width="2"/><rect id="waWetF" x="2" y="78" width="12" height="0" rx="6" fill="#7AB8C8"/></g>
    <g id="waBranch" class="place-hit" tabindex="0" role="button" aria-label="拿楊柳枝"><path d="M0 0 L-4 -70" stroke="#7A5A32" stroke-width="4" stroke-linecap="round"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M-2 ${-30 - i * 7} q${i % 2 ? 14 : -14} 6 ${i % 2 ? 18 : -18} 22" stroke="#6AA84A" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}<path d="M6 -8 q10 -6 14 -18 M-6 -10 q-10 -4 -14 -16" stroke="#3E8A4A" stroke-width="4" fill="none"/><g id="waDrip" opacity="0">${[0, 1, 2].map((i) => `<circle cx="${-10 + i * 10}" cy="${-14 + i * 5}" r="2.6" fill="#7AB8C8"/>`).join('')}</g><rect x="-34" y="-84" width="68" height="100" fill="#000" opacity="0"/></g>
    <text id="waTip" x="180" y="626" text-anchor="middle" class="place-small"></text>`, 'wa-svg');
  const S = (id) => svg.querySelector('#' + id);
  const spots = [...svg.querySelectorAll('.wa-spot')].map((el, i) => ({ el, x: SPOTS[i][0], y: SPOTS[i][1], a: 1 }));
  let wet = 0, pos = [...REST], phase = 'idle', lastSp = 0;
  const paintWet = () => { const h = 76 * wet; S('waWetF').setAttribute('y', (78 - h).toFixed(1)); S('waWetF').setAttribute('height', h.toFixed(1)); S('waDrip').setAttribute('opacity', wet > .05 ? '1' : '0'); };
  function reset() {
    phase = 'wash'; wet = 0; pos = [...REST]; put(S('waBranch'), ...pos);
    spots.forEach((s) => { s.a = 1; s.el.setAttribute('opacity', '1'); });
    S('waMeImg').setAttribute('href', me().kneel || me().face); paintWet();
    S('waTip').textContent = '楊柳枝先沾抹草水，再拍拍身上的灰點';
    say('淨身石槽：拿起<b>楊柳枝</b>，先放進下面的石槽<b>沾抹草水</b>，再在身上灰灰的地方輕輕拍，把濁氣拍掉。', 'temple');
  }
  dragger(svg, S('waBranch'), {
    lift: 64,
    onDown: () => phase === 'wash',
    onMove(x, y, first) {
      const v = Math.hypot(x - pos[0], y - pos[1]);
      pos = [x, y]; put(S('waBranch'), x, y, Math.max(-30, Math.min(30, (x - 180) / 6)));
      if (Math.abs(x - TROUGH[0]) < 110 && Math.abs(y - TROUGH[1]) < 34) {
        if (wet < 1) { wet = Math.min(1, wet + .08); paintWet(); if (wet >= 1) { sfx.pop(); emit('text', x, y - 80, { text: '沾好了', color: '#BFE6F2', life: .8, vy: -30 }); } }
        return;
      }
      if (first) return;
      for (const s of spots) {
        if (s.a <= 0 || Math.hypot(s.x - x, s.y - (y - 40)) > 40) continue;
        if (wet <= 0) { if (performance.now() - lastSp > 1500) { lastSp = performance.now(); say('楊柳枝乾了，先去下面的石槽<b>沾一下抹草水</b>。', 'temple'); } break; }
        s.a = s.a - .2 - Math.min(.2, v / 100); if (s.a < .03) s.a = 0; wet = Math.max(0, wet - .035); paintWet();
        s.el.setAttribute('opacity', s.a.toFixed(2));
        if (Math.random() < .5) emit('spark', s.x + (Math.random() - .5) * 16, s.y, { color: '#BFE6F2' });
        if (s.a === 0) { sfx.pop(); sfx.buzz?.(8); }
      }
      if (spots.every((s) => s.a === 0)) clean();
    },
    onUp() { if (phase === 'wash') { const from = [...pos]; tween(300, (k) => put(S('waBranch'), from[0] + (REST[0] - from[0]) * k, from[1] + (REST[1] - from[1]) * k)); pos = [...REST]; } },
  });
  S('waBranch').addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && phase === 'wash') { e.preventDefault(); spots.forEach((s) => { s.a = 0; s.el.setAttribute('opacity', '0'); }); clean(); } });
  function clean() {
    if (phase !== 'wash') return; phase = 'done';
    put(S('waBranch'), ...REST); pos = [...REST];
    burst('spark', 180, 320, reduce ? 4 : 22); sfx.chime();
    const first = streakOf(wa, dayKey); save();
    if (first) wallet.earn(3, '淨身', 180, 260);
    S('waTip').textContent = '';
    say(`身上清清爽爽了！抹草自古就是避邪淨身用的，帶著乾淨的心進廟。${first ? '福氣 +3。' : ''}已經淨身 ${wa.total} 天。`, 'temple');
  }
  $('#waBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-wa]'); if (!b) return;
    if (b.dataset.wa === 'again') reset();
    else openSheet('淨身小知識', `<p><b>抹草</b>（又叫魚臭木）是台灣民間常用的淨身草，泡在水裡，用來洗手、擦身，有去霉氣、避邪的意思。</p><p><b>楊柳枝</b>是觀音菩薩手上的那一枝，沾水灑一灑，代表清淨。</p><p class="hint">淨身 ${wa.total} 天，連續 ${wa.streak} 天。</p>`);
  });
  return { enter: reset, leave() { phase = 'idle'; } };
}

// 太歲殿・祭改（改運）：照廟裡法師祭改的順序——寫替身（名字、生肖、想改的事）→ 對替身吹三口氣
// → 拿替身從頭順到腳，把霉氣帶走 → 撒鹽米「一撒天清、二撒地靈、三撒人長生」→ 替身放進金爐化掉 → 過七星橋。
// 疊在太歲殿上面的透明圖層（跟其他殿一樣 viewBox 0 0 360 645），只有道具可以點。SVG 裡的 id 都加 jg 前綴。
import furnaceUrl from './assets/furnace.webp';
import { makeCarrier } from './carry.js';
import { reduce, sleep, tween, pick, svgPt, daily, yesterdayKey, onSwipe } from './stall.js';

const ZOD = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];
const FIX = [['luck', '運勢不順'], ['health', '身體健康'], ['work', '工作卡關'], ['love', '感情'], ['money', '破財'], ['xiao', '小人是非'], ['exam', '考運']];
const SALT = ['一撒天清', '二撒地靈', '三撒人長生'];
const AFTER = [
  '祭改完，舊的不順就留在替身上了。接下來，你只要往前走。',
  '改運最重要的一步在後面：今天開始，好好吃飯、好好睡覺。',
  '太歲星君說：「運是走出來的。七星橋走過了，路就開了。」',
  '把今天當成新的開始，做一件你拖了很久的小事。',
];
const KNEEL_BASE = 595; // 太歲殿拜墊（放大後）
const DOLL = [26, 44]; // 替身寬高，原點在底部中心
const FURN = [56, 548]; // 金爐口
const STARS = Array.from({ length: 7 }, (_, i) => { const t = i / 6; return [40 + t * 280, 626 - Math.sin(t * Math.PI) * 56]; });

const svgOf = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="祭改" class="jg-svg">
  <defs>
    <radialGradient id="jgFire"><stop offset="0" stop-color="#FFF2B0"/><stop offset=".5" stop-color="#FF9A3A"/><stop offset="1" stop-color="#E2402A" stop-opacity="0"/></radialGradient>
    <radialGradient id="jgStar"><stop offset="0" stop-color="#FFF7C8"/><stop offset=".5" stop-color="#FFD45A" stop-opacity=".8"/><stop offset="1" stop-color="#FFD45A" stop-opacity="0"/></radialGradient>
  </defs>
  <g id="jgPath" style="display:none" pointer-events="none"></g>
  <g id="jgFurn" style="display:none">
    <circle id="jgFireGlow" cx="${FURN[0]}" cy="${FURN[1]}" r="36" fill="url(#jgFire)" opacity="0" style="mix-blend-mode:screen"/>
    <image href="${furnaceUrl}" x="${FURN[0] - 40}" y="${FURN[1] - 46}" width="80" height="92"/>
    <circle id="jgFurnRing" cx="${FURN[0]}" cy="${FURN[1]}" r="22" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  </g>
  <g id="jgBridge" style="display:none">
    <path d="M24 640Q180 520 336 640" fill="none" stroke="#C8302A" stroke-width="7" stroke-linecap="round" opacity=".85"/>
    <path d="M24 632Q180 512 336 632" fill="none" stroke="#E8B84A" stroke-width="2" opacity=".9"/>
    ${STARS.map(([x, y], i) => `<g class="jg-star" data-jg="star" data-i="${i}" role="button" tabindex="0" aria-label="第${i + 1}顆星">
      <circle cx="${x}" cy="${y}" r="20" fill="transparent"/>
      <circle id="jgGlow${i}" cx="${x}" cy="${y}" r="18" fill="url(#jgStar)" opacity="0"/>
      <path id="jgStar${i}" transform="translate(${x} ${y})" d="M0 -10l3 6.5 7 .8-5.2 4.8 1.4 7L0 5.5-6.2 9.1l1.4-7L-10 -2.7l7-.8z" fill="#7A6A5A" stroke="#FFE08A" stroke-width="1.2"/>
      <text x="${x}" y="${y + 3.5}" text-anchor="middle" class="jg-no">${i + 1}</text>
    </g>`).join('')}
  </g>
  <g id="jgDoll" class="jg-doll" data-jg="doll" role="button" tabindex="0" aria-label="替身" style="display:none">
    <g id="jgDollArt">
      <path d="M0 ${-DOLL[1]}c6 0 8 4 8 8s-2 6-4 7h10l-2 8h-7l3 21h-6l-2-12-2 12h-6l3-21h-7l-2-8h10c-2-1-4-3-4-7s2-8 8-8z" fill="#FFF6E2" stroke="#C8302A" stroke-width="1.6"/>
      <path id="jgDirt" d="M0 ${-DOLL[1]}c6 0 8 4 8 8s-2 6-4 7h10l-2 8h-7l3 21h-6l-2-12-2 12h-6l3-21h-7l-2-8h10c-2-1-4-3-4-7s2-8 8-8z" fill="#5A5048" opacity="0"/>
      <text id="jgDollName" x="0" y="${-DOLL[1] + 24}" text-anchor="middle" class="jg-name"></text>
    </g>
  </g>
  <g id="jgBurn" class="jg-doll" data-jg="burn" role="button" tabindex="0" aria-label="替身，放進金爐" style="display:none"><use href="#jgDollArt"/></g>
  <rect id="jgTap" x="0" y="140" width="360" height="505" fill="transparent" style="display:none" data-jg="tap"/>
</svg>`;

export function initJigai(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, addFish, me } = api;
  const host = $('#jgHost');
  host.innerHTML = svgOf();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const jg = state.jg || (state.jg = { last: '', streak: 0, total: 0 });
  let phase = 'idle', draft = null, run = 0, dollPos = [182, 440];

  // 跪在拜墊上的你：頭、肩、胸、肚子、膝蓋
  const body = () => {
    const h = 130 * me().scale, top = KNEEL_BASE - h;
    return [['頭', top + h * .2], ['肩膀', top + h * .42], ['胸口', top + h * .55], ['肚子', top + h * .68], ['膝蓋', top + h * .88]].map(([n, y]) => [n, 182, y]);
  };
  const placeDoll = (x, y, rot = 0, s = 1) => { dollPos = [x, y]; S('jgDoll').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s})`); };

  /* ----- 1. 寫替身 ----- */
  function start() {
    if (phase !== 'idle' && phase !== 'done') { say('祭改還沒做完，照太歲星君說的下一步。', 'god'); return; }
    const ts = state.ts || {};
    const sheet = openSheet('祭改・寫替身', `
      <p>替身是一張紙人，寫上名字和生肖，等一下由它把你的霉氣帶走、燒掉。犯太歲的年、或最近諸事不順，都可以來祭改。</p>
      <div class="ts-zod" id="jgZod">${ZOD.map((z, i) => `<button type="button" class="chip" data-z="${i}" aria-pressed="${i === ts.z}">${z}</button>`).join('')}</div>
      <input id="jgName" class="yue-wish" maxlength="4" placeholder="名字（最多 4 個字）" value="${esc(ts.name || (state.name !== '香客' ? state.name : ''))}">
      <div class="field"><span>想改的是</span><div class="chips" id="jgFix">${FIX.map(([id, n], i) => `<button type="button" class="chip" data-f="${id}" aria-pressed="${i === 0}">${n}</button>`).join('')}</div></div>
      <p id="jgNote" class="hint"></p>
      <div class="row"><button class="btn" id="jgGo">寫好替身</button></div>`);
    let z = ts.z >= 0 ? ts.z : -1, fix = FIX[0][0];
    sheet.addEventListener('click', (e) => {
      const b = e.target.closest('[data-z]'), f = e.target.closest('[data-f]');
      if (b) { z = +b.dataset.z; sheet.querySelectorAll('[data-z]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }
      if (f) { fix = f.dataset.f; sheet.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === f))); }
    });
    sheet.querySelector('#jgGo').addEventListener('click', () => {
      const name = sheet.querySelector('#jgName').value.trim().replace(/\s+/g, '');
      if (z < 0) { sheet.querySelector('#jgNote').textContent = '先選一個生肖。'; return; }
      if (!name) { sheet.querySelector('#jgName').focus(); return; }
      draft = { z, name, fix }; closeSheet(); blowStep();
    });
  }

  /* ----- 2. 吹三口氣 ----- */
  let puffs = 0;
  function blowStep() {
    const r = ++run; phase = 'blow'; puffs = 0;
    S('jgDollName').textContent = draft.name.slice(0, 2);
    S('jgDirt').setAttribute('opacity', '0');
    S('jgDoll').style.display = ''; placeDoll(182, 438);
    S('jgDoll').classList.remove('pop'); void S('jgDoll').getBoundingClientRect(); S('jgDoll').classList.add('pop');
    S('jgTap').style.display = '';
    cam?.zoom(182, 470, 230);
    sfx.pop();
    say(`替身寫好了：屬${ZOD[draft.z]}的「${esc(draft.name)}」。<br>先對替身<b>吹三口氣</b>，把自己的氣交給它：在畫面上<b>由下往上滑</b>。`, 'god');
    idle(r);
  }
  function idle(r) {
    const step = (t) => {
      if (r !== run || phase !== 'blow') return;
      placeDoll(182, 438 + Math.sin(t / 420) * 3, Math.sin(t / 300) * 3);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  onSwipe(S('jgTap'), svg, {
    dir: 'up', dist: 60,
    onStart(p) { if (phase === 'salt') salt(p); },
    async onDone() {
      if (phase !== 'blow') return;
      puffs++;
      const b = body()[0];
      for (let i = 0; i < 12; i++) setTimeout(() => emit('smoke', 182 + (Math.random() - .5) * 10, b[2] + 8 - i * 4, { color: '#E8F4FF', alpha: .55, vy: -70 - Math.random() * 30, life: 1.2 }), i * 25);
      sfx.buzz([10]);
      const d = S('jgDollArt');
      tween(500, (k) => d.setAttribute('transform', `rotate(${Math.sin(k * Math.PI * 5) * 14 * (1 - k)}) translate(0 ${-Math.sin(k * Math.PI) * 8})`));
      emit('text', 230, 410, { text: ['一口', '兩口', '三口'][puffs - 1], color: '#E8F4FF', size: 15, life: 1 });
      if (puffs < 3) return;
      await sleep(600); rubStep();
    },
  });

  /* ----- 3. 從頭順到腳 ----- */
  let marks = [], next = 0, drag = null;
  function rubStep() {
    phase = 'rub'; next = 0; S('jgTap').style.display = 'none';
    marks = body();
    S('jgPath').style.display = '';
    S('jgPath').innerHTML = `<path d="M182 ${marks[0][2]}V${marks[4][2]}" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 5" opacity=".7"/>`
      + marks.map(([n, x, y], i) => `<circle id="jgM${i}" cx="${x}" cy="${y}" r="7" fill="none" stroke="#FFE08A" stroke-width="2"/><text x="${x + 26}" y="${y + 4}" class="jg-mark">${n}</text>`).join('');
    cam?.zoom(182, (marks[0][2] + marks[4][2]) / 2, 210);
    say('現在<b>按住替身</b>，從你的<b>頭</b>開始，沿著光點<b>一路往下順到膝蓋</b>，把不順的霉氣都帶到替身上。', 'god');
  }
  const DOLL_C = () => [dollPos[0], dollPos[1] - DOLL[1] / 2]; // 替身中心
  S('jgDoll').addEventListener('pointerdown', (e) => {
    if (phase !== 'rub') return;
    e.preventDefault(); S('jgDoll').setPointerCapture(e.pointerId); drag = true; sfx.pop(); S('jgDoll').classList.add('held');
  });
  S('jgDoll').addEventListener('pointermove', (e) => {
    if (!drag || phase !== 'rub') return;
    const p = svgPt(svg, e);
    // 替身浮在手指左上方，手指不會擋住身上的光點
    let x = p.x - 34, y = p.y - 44 + DOLL[1] / 2;
    const m = marks[next];
    if (m && Math.hypot(x - m[1], y - DOLL[1] / 2 - m[2]) < 30) { x += (m[1] - x) * .5; y += (m[2] + DOLL[1] / 2 - y) * .5; }
    placeDoll(x, y, Math.sin(performance.now() / 90) * 4);
    const [cx, cy] = DOLL_C();
    if (m && Math.hypot(cx - m[1], cy - m[2]) < 16) {
      S('jgM' + next).setAttribute('fill', '#FFE08A');
      for (let i = 0; i < 6; i++) emit('smoke', m[1] + (Math.random() - .5) * 40, m[2] + (Math.random() - .5) * 12, { color: '#6A5E58', alpha: .5, vx: (cx - m[1]) * .4, vy: -10, life: .9 });
      sfx.knock(); sfx.buzz([12]);
      next++;
      S('jgDirt').setAttribute('opacity', (next / marks.length * .55).toFixed(2));
      emit('text', m[1] - 50, m[2], { text: m[0], color: '#FFE08A', size: 12, life: .8 });
      if (next >= marks.length) { drag = false; S('jgDoll').classList.remove('held'); saltStep(); }
    }
  });
  const dropDoll = () => {
    if (!drag) return; drag = false; S('jgDoll').classList.remove('held');
    if (phase === 'rub' && next < marks.length) say(`還沒順完喔。從<b>${marks[next][0]}</b>繼續，按住替身往下。`, 'god');
  };
  S('jgDoll').addEventListener('pointerup', dropDoll);
  S('jgDoll').addEventListener('pointercancel', dropDoll);
  S('jgDoll').addEventListener('keydown', async (e) => { // 鍵盤：自己順下去
    if (e.key !== 'Enter' || phase !== 'rub') return;
    for (; next < marks.length; next++) { S('jgM' + next).setAttribute('fill', '#FFE08A'); placeDoll(marks[next][1], marks[next][2] + DOLL[1] / 2); await sleep(200); }
    S('jgDirt').setAttribute('opacity', '.55'); saltStep();
  });

  /* ----- 4. 撒鹽米 ----- */
  let salts = 0;
  function saltStep() {
    phase = 'salt'; salts = 0;
    S('jgPath').style.display = 'none'; S('jgTap').style.display = '';
    placeDoll(232, 470, 8);
    sfx.chime();
    say('霉氣都到替身上了，它變得灰灰的。<br>接著<b>撒鹽米</b>淨身：在你身邊<b>點三下</b>。', 'god');
  }
  function salt(p) {
    if (phase !== 'salt') return;
    const x = Math.max(80, Math.min(280, p.x)), y = Math.max(380, Math.min(600, p.y));
    for (let i = 0; i < (reduce ? 4 : 16); i++) emit('drop', x + (Math.random() - .5) * 50, y - 60 - Math.random() * 30, { color: i % 3 ? '#FFFFFF' : '#F3E6C0', vx: (Math.random() - .5) * 60, vy: 20 + Math.random() * 40 });
    sfx.rattle(.25); sfx.buzz([8]);
    emit('text', 182, 400 - salts * 22, { text: SALT[salts], color: '#FFF4E0', size: 15, life: 1.6 });
    salts++;
    if (salts < 3) return;
    phase = 'burnwait';
    setTimeout(burnStep, 900);
  }

  /* ----- 5. 化替身 ----- */
  const carrier = makeCarrier({
    svg, el: S('jgBurn'), sfx, cam, ring: S('jgFurnRing'), lift: 60, radius: 26,
    rest: () => [232, 470], target: () => [FURN[0], FURN[1] + DOLL[1] / 2 - 8], zoom: () => [FURN[0] + 60, FURN[1] - 30, 240],
    onTap: () => { if (phase === 'burn') say('按住<b>替身</b>，放進左邊的<b>金爐</b>。', 'god'); },
    onDrop: () => { if (phase === 'burn') burnDoll(); },
  });
  function burnStep() {
    phase = 'burn'; S('jgTap').style.display = 'none';
    S('jgFurn').style.display = ''; S('jgDoll').style.display = 'none'; S('jgBurn').style.display = ''; carrier.home();
    cam?.zoom(150, 500, 280);
    say('最後把<b>替身</b>拿去左邊的<b>金爐</b>化掉，舊的不順就跟它一起走了。', 'god');
  }
  async function burnDoll() {
    phase = 'fire'; S('jgBurn').style.display = 'none';
    S('jgFireGlow').setAttribute('opacity', '1'); sfx.pop(); sfx.buzz([20, 40, 20]);
    for (let i = 0; i < 18; i++) setTimeout(() => { emit('smoke', FURN[0] + (Math.random() - .5) * 20, FURN[1] - 40, { color: '#9A8E88', alpha: .4 }); emit('spark', FURN[0], FURN[1] - 20); }, i * 70);
    emit('text', FURN[0] + 50, FURN[1] - 80, { text: '替身化掉了', color: '#FFE08A', life: 1.8 });
    await sleep(1500);
    S('jgFireGlow').setAttribute('opacity', '0'); S('jgFurn').style.display = 'none';
    bridgeStep();
  }

  /* ----- 6. 過七星橋 ----- */
  let star = 0;
  function bridgeStep() {
    phase = 'bridge'; star = 0;
    S('jgBridge').style.display = '';
    for (let i = 0; i < 7; i++) { S('jgStar' + i).setAttribute('fill', '#7A6A5A'); S('jgGlow' + i).setAttribute('opacity', '0'); }
    cam?.zoom(180, 560, 340);
    say('改運的最後一步：<b>過七星橋</b>。照順序<b>點亮 1 到 7 顆星</b>，一步一步走過去。', 'god');
  }
  function stepStar(i) {
    if (phase !== 'bridge') return;
    if (i !== star) { sfx.knock(); say(`照順序來，下一顆是第 <b>${star + 1}</b> 顆。`, 'god'); return; }
    S('jgStar' + i).setAttribute('fill', '#FFD45A'); S('jgGlow' + i).setAttribute('opacity', '1');
    burst('spark', STARS[i][0], STARS[i][1], reduce ? 2 : 6); sfx.pop(); sfx.buzz([10]);
    star++;
    if (star < 7) return;
    finish();
  }
  svg.addEventListener('click', (e) => { const s = e.target.closest('[data-jg="star"]'); if (s) stepStar(+s.dataset.i); });
  svg.addEventListener('keydown', (e) => { const s = e.target.closest('[data-jg="star"]'); if (s && e.key === 'Enter') stepStar(+s.dataset.i); });

  function finish() {
    phase = 'done'; sfx.chime(); sfx.buzz([20, 60, 20, 60, 40]);
    burst('spark', 182, 300, reduce ? 6 : 30);
    const first = daily(jg, dayKey(), yesterdayKey()); save();
    if (first) addFish(1);
    const fix = FIX.find((f) => f[0] === draft.fix)[1];
    setTimeout(() => {
      S('jgBridge').style.display = 'none'; cam?.reset();
      openSheet('祭改圓滿', `
        <div class="slip"><div class="slip-side"><span>改運疏文</span><span class="lv">改</span></div>
          <p class="poem"><span>替身代我除不順</span><span>七星照路${fix}開</span></p></div>
        <div class="explain"><p>屬${ZOD[draft.z]}的「<b>${esc(draft.name)}</b>」祭改圓滿。${pick(AFTER)}</p></div>
        <p class="hint">${first ? `虎爺叼來小魚乾 ×1。這是你第 ${jg.total} 次祭改。` : '今天已經祭改過了。'}${state.ts && state.ts.year ? '' : '犯太歲的話，也可以順便「安太歲」點光明燈。'}</p>`);
    }, 1200);
  }

  $('#tsBar').addEventListener('click', (e) => { if (e.target.closest('button[data-jg]')) start(); });

  return {
    start,
    reset() {
      run++; phase = 'idle'; drag = false;
      for (const id of ['jgDoll', 'jgBurn', 'jgPath', 'jgFurn', 'jgBridge', 'jgTap']) S(id).style.display = 'none';
    },
  };
}

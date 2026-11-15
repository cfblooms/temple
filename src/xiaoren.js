// 鵝頸橋打小人：照民間做法走一輪——稟告（寫代號、選要打走的是哪一種小人）→ 跟著婆婆的口訣用舊拖鞋打小人紙
// → 祭白虎（肥豬肉塞進紙老虎嘴裡，讓牠吃飽不咬人）→ 把打爛的小人紙放進火盆化掉 → 請貴人。
// 只寫代號、不寫真名：打的是霉運和是非，不是要傷害誰。驚蟄（國曆 3/5、3/6 前後）是打小人的日子。
// 場景 360 × 645；SVG 裡的 id 都加 x 前綴。
import { makeCarrier } from './carry.js';
import bgUrl from './assets/xr/bg.webp';
import popoUrl from './assets/xr/popo.webp';
import brickUrl from './assets/xr/brick.webp';
import paperUrl from './assets/xr/paper.webp';
import tigerUrl from './assets/xr/tiger.webp';
import tigerFullUrl from './assets/xr/tiger-full.webp';
import porkUrl from './assets/xr/pork.webp';
import potUrl from './assets/xr/pot.webp';
import slipUrl from './assets/xr/slipper.webp';
import { reduce, sleep, tween, shake, pick, daily, yesterdayKey } from './stall.js';

const KINDS = [
  ['work', '職場小人'], ['gossip', '背後說閒話的'], ['peach', '爛桃花'], ['friend', '損友'],
  ['lazy', '拖延的自己'], ['habit', '戒不掉的壞習慣'], ['luck', '一整年的霉運'],
];
const CHANT = [
  '打你個小人頭，霉運不上頭',
  '打你個小人手，壞心縮回手',
  '打你個小人嘴，是非不再追',
  '打你個小人腳，害人踢鐵板',
  '打走小人好運來，貴人通通靠過來',
];
const HITS = 5; // 每一句打幾下
const BEAT = 640;
const GUIREN = [
  ['boss', '好主管', '工作上遇到願意拉你一把的人'], ['mate', '好同事', '有人跟你同一陣線、幫你分擔'],
  ['love', '好姻緣', '出現真心對你好的人'], ['pal', '好朋友', '低潮的時候有人陪你吃宵夜'],
  ['money', '財運貴人', '有人帶你看見賺錢的好機會'],
];
const POPA = [
  '婆婆：「打完就放下，別再讓他住在你心裡。」',
  '婆婆：「小人打走了，接下來換貴人來。」',
  '婆婆：「氣出完了，晚上好好睡一覺。」',
  '婆婆：「記得，你值得被好好對待。」',
];

const PAPER = [180, 492]; // 小人紙底部中心
const SLIP_REST = [214, 352], SLIP_HIT = [180, 440];
const TIGER = [278, 486], MOUTH = [278, 403];
const PORK_REST = [290, 606];
const POT = [74, 598];
const SCRAP = [180, 494];

const svgOf = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="鵝頸橋打小人攤" class="stall-svg xr-svg">
  <defs>
    <radialGradient id="xFire"><stop offset="0" stop-color="#FFF2B0"/><stop offset=".5" stop-color="#FF9A3A"/><stop offset="1" stop-color="#E2402A" stop-opacity="0"/></radialGradient>
    <radialGradient id="xShadow"><stop offset="0" stop-color="#120604" stop-opacity=".55"/><stop offset="1" stop-color="#120604" stop-opacity="0"/></radialGradient>
  </defs>
  <image href="${bgUrl}" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>
  <image href="${popoUrl}" x="14" y="379" width="100" height="161"/>
  <text x="64" y="554" text-anchor="middle" class="xr-tag">打小人婆婆</text>
  <!-- 磚頭和小人紙 -->
  <ellipse cx="180" cy="530" rx="78" ry="12" fill="url(#xShadow)"/>
  <image href="${brickUrl}" x="105" y="474" width="150" height="78"/>
  <g id="xPaper" transform="translate(${PAPER[0]} ${PAPER[1]})">
    <g id="xPaperArt">
      <image href="${paperUrl}" x="-33" y="-97" width="66" height="95"/>
      <text id="xName" x="0" y="-8" text-anchor="middle" class="xr-name"></text>
      <path id="xC1" d="M-30 -84l18 8 10 -6 20 10 14 -4" stroke="#B89A7A" stroke-width="1.4" fill="none" opacity="0"/>
      <path id="xC2" d="M-30 -50l14 -6 16 8 12 -4 18 6" stroke="#B89A7A" stroke-width="1.4" fill="none" opacity="0"/>
      <path id="xC3" d="M-12 -96l6 30 -10 22 8 40" stroke="#B89A7A" stroke-width="1.4" fill="none" opacity="0"/>
      <path id="xC4" d="M18 -96l-4 26 12 18 -8 50" stroke="#B89A7A" stroke-width="1.4" fill="none" opacity="0"/>
      <path id="xC5" d="M-28 -24l22 6 18 -10 20 4" stroke="#B89A7A" stroke-width="1.4" fill="none" opacity="0"/>
    </g>
  </g>
  <circle id="xRing" cx="${SLIP_HIT[0]}" cy="${SLIP_HIT[1] + 4}" r="40" fill="none" stroke="#FFE08A" stroke-width="3" opacity="0"/>
  <circle id="xRingT" cx="${SLIP_HIT[0]}" cy="${SLIP_HIT[1] + 4}" r="24" fill="none" stroke="#FFE08A" stroke-width="1.4" stroke-dasharray="3 3" opacity="0"/>
  <!-- 紙老虎（祭白虎） -->
  <g id="xTiger" transform="translate(${TIGER[0]} ${TIGER[1]})" style="display:none">
    <ellipse cx="0" cy="4" rx="40" ry="7" fill="url(#xShadow)"/>
    <image id="xTigerOpen" href="${tigerUrl}" x="-40" y="-128" width="80" height="127"/>
    <g id="xFull" opacity="0"><image href="${tigerFullUrl}" x="-40" y="-128" width="80" height="127"/></g>
  </g>
  <circle id="xTigerRing" cx="${MOUTH[0]}" cy="${MOUTH[1]}" r="16" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <!-- 肥豬肉 -->
  <g id="xPork" class="stall-prop" data-xr="pork" role="button" tabindex="0" aria-label="肥豬肉，拿去餵紙老虎" transform="translate(${PORK_REST[0]} ${PORK_REST[1]})" style="display:none">
    <ellipse cx="0" cy="2" rx="24" ry="5" fill="url(#xShadow)"/>
    <image href="${porkUrl}" x="-28" y="-26" width="56" height="29"/>
  </g>
  <!-- 火盆 -->
  <g id="xPot" transform="translate(${POT[0]} ${POT[1]})">
    <ellipse cx="0" cy="8" rx="34" ry="7" fill="url(#xShadow)"/>
    <circle id="xFlameGlow" cx="0" cy="-30" r="34" fill="url(#xFire)" opacity="0" style="mix-blend-mode:screen"/>
    <image href="${potUrl}" x="-40" y="-30" width="80" height="61"/>
    <g id="xFlame" opacity="0" transform="translate(0 -12)"><path d="M-14 -12c-4-14 6-18 4-30 10 8 12 18 8 30zM2 -12c0-12 10-14 10-26 8 10 6 20 2 26z" fill="#FF9A3A"/><path d="M-6 -12c-2-8 4-10 4-16 6 6 4 12 2 16z" fill="#FFF2B0"/></g>
  </g>
  <text x="${POT[0]}" y="${POT[1] + 28}" text-anchor="middle" class="xr-tag">火盆</text>
  <circle id="xPotRing" cx="${POT[0]}" cy="${POT[1] - 22}" r="28" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <!-- 打爛的小人紙（揉成一團） -->
  <g id="xScrap" class="stall-prop" data-xr="scrap" role="button" tabindex="0" aria-label="打爛的小人紙，放進火盆化掉" transform="translate(${SCRAP[0]} ${SCRAP[1]})" style="display:none">
    <path d="M-16 0c-6-10 0-22 10-22 4-6 16-4 18 4 8 2 8 14 2 18z" fill="#F3E6CC" stroke="#B89A7A" stroke-width="1.4"/>
    <path d="M-8 -14l8 4 6 -6M-10 -6l10 2" stroke="#B89A7A" stroke-width="1.2" fill="none"/>
  </g>
  <!-- 口訣 -->
  <g id="xChantG" opacity="0">
    <rect x="34" y="178" width="292" height="62" rx="14" fill="#1A0A08" opacity=".55"/>
    <text id="xChant" x="180" y="206" text-anchor="middle" class="xr-chant"></text>
    <g id="xDots"></g>
  </g>
  <!-- 拖鞋（浮在小人紙上方，手指不會擋到） -->
  <g id="xSlip" transform="translate(${SLIP_REST[0]} ${SLIP_REST[1]}) rotate(-28)" style="display:none" pointer-events="none">
    <image href="${slipUrl}" x="-32" y="-35" width="63" height="70" transform="rotate(-40)"/>
  </g>
  <rect id="xTap" x="0" y="150" width="360" height="495" fill="transparent" style="display:none" data-xr="tap"/>
</svg>`;

export function initXiaoren(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, addFish } = api;
  const host = $('#xrHost');
  host.innerHTML = svgOf();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const xr = state.xr || (state.xr = { last: '', streak: 0, total: 0, kinds: {} });
  let phase = 'idle', draft = null, run = 0;
  const jingzhe = () => { const d = new Date(); return d.getMonth() === 2 && (d.getDate() === 5 || d.getDate() === 6); };

  /* ----- 1. 稟告 ----- */
  function openStart() {
    if (phase !== 'idle' && phase !== 'done') { say(phase === 'hit' ? '正在打，跟著口訣點畫面。' : '還沒做完，照婆婆說的下一步。'); return; }
    const body = openSheet('稟告：要打走什麼？', `
      <p>先跟白虎爺稟告要打走的是哪一種小人。<b>只寫代號，不寫真名</b>：打的是霉運和是非，不是要傷害誰。</p>
      <div class="chips" id="xKinds">${KINDS.map(([id, n], i) => `<button type="button" class="chip" data-k="${id}" aria-pressed="${i === 0}">${n}</button>`).join('')}</div>
      <input id="xCode" class="yue-wish" maxlength="6" placeholder="代號，例如：A 先生、那件衰事">
      <p class="hint">${jingzhe() ? '今天驚蟄，正是打小人的日子！' : '民間習俗在驚蟄（國曆三月初）打小人，平常心情不好也可以來。'}</p>
      <div class="row"><button class="btn" id="xGo">寫上小人紙，開打</button></div>`);
    let kind = KINDS[0][0];
    body.querySelector('#xKinds').addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      kind = b.dataset.k; body.querySelectorAll('[data-k]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    body.querySelector('#xGo').addEventListener('click', () => {
      const code = body.querySelector('#xCode').value.trim().replace(/\s+/g, ' ') || KINDS.find((k) => k[0] === kind)[1];
      draft = { kind, code }; closeSheet(); startHit();
    });
  }

  /* ----- 2. 打小人：跟著拍子打 ----- */
  let hits = 0, line = 0, combo = 0, beat0 = 0, lastHit = 0;
  function paintChant() {
    S('xChant').textContent = CHANT[line];
    S('xDots').innerHTML = Array.from({ length: HITS }, (_, i) => `<circle cx="${180 + (i - (HITS - 1) / 2) * 18}" cy="226" r="5" fill="${i < hits ? '#FFE08A' : 'none'}" stroke="#FFE08A" stroke-width="1.6"/>`).join('');
  }
  function resetPaper() {
    for (let i = 1; i <= 5; i++) S('xC' + i).setAttribute('opacity', '0');
    S('xPaper').style.display = ''; S('xPaper').setAttribute('transform', `translate(${PAPER[0]} ${PAPER[1]})`);
    S('xPaperArt').setAttribute('transform', '');
  }
  async function startHit() {
    const r = ++run;
    resetPaper(); S('xName').textContent = draft.code.slice(0, 6);
    hits = 0; line = 0; combo = 0; phase = 'hit';
    sfx.pop(); cam?.zoom(180, 380, 250);
    say(`婆婆把「<b>${esc(draft.code)}</b>」寫上小人紙，壓在磚頭上，把舊拖鞋交給你。<br>跟著口訣，光圈縮到最小的時候<b>點畫面</b>打下去！`);
    await sleep(900); if (r !== run) return;
    S('xSlip').style.display = ''; S('xChantG').setAttribute('opacity', '1'); S('xTap').style.display = '';
    paintChant(); beat0 = performance.now(); ringLoop(r);
  }
  function ringLoop(r) {
    const ring = S('xRing'), t = S('xRingT');
    ring.setAttribute('opacity', '.9'); t.setAttribute('opacity', '.7');
    const step = (now) => {
      if (r !== run || phase !== 'hit') { ring.setAttribute('opacity', '0'); t.setAttribute('opacity', '0'); return; }
      const k = ((now - beat0) % BEAT) / BEAT; // 0 → 1，1 的時候剛好是拍點
      ring.setAttribute('r', (24 + (1 - k) * 46).toFixed(1));
      ring.setAttribute('opacity', (.35 + k * .6).toFixed(2));
      // 拖鞋跟著拍子在上面晃
      if (now - lastHit > 240) S('xSlip').setAttribute('transform', `translate(${SLIP_REST[0]} ${(SLIP_REST[1] - 8 * Math.sin(k * Math.PI)).toFixed(1)}) rotate(${(-28 - 10 * k).toFixed(1)})`);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  async function whack() {
    const now = performance.now();
    if (phase !== 'hit' || now - lastHit < 170) return;
    lastHit = now;
    const off = ((now - beat0) % BEAT), d = Math.min(off, BEAT - off);
    const grade = d < 110 ? 2 : d < 210 ? 1 : 0;
    combo = grade ? combo + 1 : 0;
    // 拖鞋甩下去
    const slip = S('xSlip');
    await tween(70, (k) => slip.setAttribute('transform', `translate(${SLIP_REST[0] + (SLIP_HIT[0] - SLIP_REST[0]) * k} ${SLIP_REST[1] + (SLIP_HIT[1] - SLIP_REST[1]) * k}) rotate(${-28 + 28 * k})`), (k) => k * k);
    sfx.knock(); if (grade === 2) sfx.knock(.03);
    sfx.buzz(grade === 2 ? [28] : [14]);
    shake(svg, grade === 2 ? 6 : 3);
    const art = S('xPaperArt');
    art.setAttribute('transform', 'translate(0 0) scale(1.08 .86)');
    setTimeout(() => art.setAttribute('transform', ''), 90);
    burst('spark', SLIP_HIT[0], SLIP_HIT[1] + 10, reduce ? 2 : grade === 2 ? 10 : 4);
    for (let i = 0; i < 4; i++) emit('drop', SLIP_HIT[0] + (Math.random() - .5) * 40, SLIP_HIT[1] + 30, { color: '#B89A7A', vy: -60 - Math.random() * 40, vx: (Math.random() - .5) * 80 });
    emit('text', SLIP_HIT[0] + (Math.random() - .5) * 60, SLIP_HIT[1] - 50, { text: grade === 2 ? (combo > 3 ? `讚！×${combo}` : '讚！') : grade ? '好！' : '啪', color: grade === 2 ? '#FFE08A' : '#FFF4E0', size: grade === 2 ? 18 : 14, life: .8 });
    hits++; paintChant();
    setTimeout(() => tween(160, (k) => slip.setAttribute('transform', `translate(${SLIP_HIT[0] + (SLIP_REST[0] - SLIP_HIT[0]) * k} ${SLIP_HIT[1] + (SLIP_REST[1] - SLIP_HIT[1]) * k}) rotate(${-28 * k})`)), 40);
    if (hits < HITS) return;
    // 唸完一句
    S('xC' + (line + 1))?.setAttribute('opacity', '1');
    hits = 0; line++;
    sfx.chime();
    if (line < CHANT.length) { setTimeout(paintChant, 260); return; }
    finishHit();
  }
  async function finishHit() {
    phase = 'tear'; S('xTap').style.display = 'none'; S('xChantG').setAttribute('opacity', '0'); S('xSlip').style.display = 'none';
    // 小人紙被打爛、揉成一團
    const p = S('xPaper');
    await tween(380, (k) => p.setAttribute('transform', `translate(${PAPER[0]} ${PAPER[1]}) rotate(${k * 18}) scale(${1 - k * .7})`));
    p.style.display = 'none'; S('xScrap').style.display = ''; scrap.home();
    burst('spark', SCRAP[0], SCRAP[1] - 10, reduce ? 3 : 14);
    sfx.buzz([20, 40, 30]);
    cam?.zoom(250, 470, 240);
    say('打完了！小人紙被你打得稀巴爛。<br>接著<b>祭白虎</b>：按住右下角的<b>肥豬肉</b>，塞進紙老虎嘴巴，讓牠吃飽就不會亂咬人。');
    S('xTiger').style.display = ''; S('xPork').style.display = ''; pork.home();
    S('xTiger').classList.remove('pop'); void S('xTiger').getBoundingClientRect(); S('xTiger').classList.add('pop');
    phase = 'tiger';
  }

  /* ----- 3. 祭白虎 ----- */
  const pork = makeCarrier({
    svg, el: S('xPork'), sfx, cam, ring: S('xTigerRing'), lift: 64, radius: 24,
    rest: () => PORK_REST, target: () => [MOUTH[0], MOUTH[1] + 6], zoom: () => [MOUTH[0] - 30, MOUTH[1] + 20, 220],
    onTap: () => say('按住<b>肥豬肉</b>拿起來，往上拖到紙老虎的嘴巴。'),
    async onDrop() {
      if (phase !== 'tiger') return;
      S('xPork').style.display = 'none';
      S('xTigerOpen').setAttribute('opacity', '0'); S('xFull').setAttribute('opacity', '1');
      sfx.purr(); sfx.buzz([10, 30, 10]);
      const t = S('xTiger');
      await tween(500, (k) => t.setAttribute('transform', `translate(${TIGER[0]} ${TIGER[1]}) rotate(${Math.sin(k * Math.PI * 4) * 4})`));
      emit('text', MOUTH[0] - 20, MOUTH[1] - 40, { text: '吃飽了', color: '#FFE08A', life: 1.4 });
      say('紙老虎吃飽了，乖乖趴著。最後一步：按住打爛的<b>小人紙</b>，丟進左下角的<b>火盆</b>化掉。');
      phase = 'burn'; cam?.zoom(120, 540, 250);
    },
  });

  /* ----- 4. 化解：小人紙進火盆 ----- */
  const scrap = makeCarrier({
    svg, el: S('xScrap'), sfx, cam, ring: S('xPotRing'), lift: 64, radius: 28,
    rest: () => SCRAP, target: () => [POT[0], POT[1] - 22], zoom: () => [POT[0] + 50, POT[1] - 60, 240],
    onTap: () => say(phase === 'burn' ? '按住<b>小人紙</b>，拖到左下角的<b>火盆</b>。' : '先餵紙老虎吃<b>肥豬肉</b>。'),
    async onDrop() {
      if (phase !== 'burn') { say('先祭白虎：把<b>肥豬肉</b>塞進紙老虎嘴裡。'); scrap.home(); cam?.reset(200); return; }
      phase = 'fire'; S('xScrap').style.display = 'none';
      S('xFlame').setAttribute('opacity', '1'); S('xFlameGlow').setAttribute('opacity', '1');
      sfx.pop(); sfx.buzz([20, 50, 20]);
      for (let i = 0; i < 18; i++) setTimeout(() => { emit('smoke', POT[0] + (Math.random() - .5) * 30, POT[1] - 30, { color: '#B8A8A0', alpha: .4 }); emit('spark', POT[0], POT[1] - 28); }, i * 70);
      emit('text', POT[0] + 40, POT[1] - 80, { text: '霉運化掉了', color: '#FFE08A', life: 1.8 });
      await sleep(1600);
      S('xFlame').setAttribute('opacity', '0'); S('xFlameGlow').setAttribute('opacity', '0');
      cam?.reset(); openGuiren();
    },
  });

  /* ----- 5. 請貴人 ----- */
  function openGuiren() {
    const body = openSheet('打完小人，請貴人', `
      <p>婆婆收起拖鞋：「小人打走了，空出來的位子，留給貴人。」想請哪一種貴人來？</p>
      <div class="row" id="xGui">${GUIREN.map(([id, n]) => `<button type="button" class="btn ghost" data-g="${id}">${n}</button>`).join('')}</div>`);
    body.querySelector('#xGui').addEventListener('click', (e) => {
      const b = e.target.closest('[data-g]'); if (!b) return;
      const g = GUIREN.find((x) => x[0] === b.dataset.g);
      const first = daily(xr, dayKey(), yesterdayKey());
      xr.kinds[draft.kind] = (xr.kinds[draft.kind] || 0) + 1; save();
      if (first) addFish(1);
      closeSheet(); phase = 'done';
      sfx.chime(); burst('spark', 180, 300, reduce ? 6 : 26);
      for (let i = 0; i < 6; i++) setTimeout(() => emit('heart', 140 + Math.random() * 80, 420), i * 90);
      say(`貴人符燒給白虎爺了：願<b>${g[1]}</b>出現，${g[2]}。<br>${pick(POPA)}${first ? `<br>今天第一次打小人，虎爺叼來小魚乾 ×1（已經連續 ${xr.streak} 天來出氣）。` : ''}`);
      S('xTiger').style.display = 'none'; S('xTigerOpen').setAttribute('opacity', '1'); S('xFull').setAttribute('opacity', '0');
      resetPaper(); S('xName').textContent = '';
    });
  }

  S('xTap').addEventListener('pointerdown', (e) => { e.preventDefault(); whack(); });
  $('#xrBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-xr]'); if (!b) return;
    const a = b.dataset.xr;
    if (a === 'start') openStart();
    else if (a === 'pork') phase === 'tiger' ? pork.auto() : say('打完小人才祭白虎。');
    else if (a === 'burn') phase === 'burn' ? scrap.auto() : say(phase === 'tiger' ? '先祭白虎：把肥豬肉塞進紙老虎嘴裡。' : '打完小人、祭過白虎，才把小人紙化掉。');
    else if (a === 'log') openLog();
  });
  svg.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && phase === 'hit') { e.preventDefault(); whack(); } });

  function openLog() {
    const rows = KINDS.filter(([id]) => xr.kinds[id]).map(([id, n]) => `<li><b>${n}</b>打走 ${xr.kinds[id]} 次</li>`).join('');
    openSheet('出氣紀錄', `
      <p>一共打走 <b>${xr.total || 0}</b> 次小人${xr.streak > 1 ? `，連續 ${xr.streak} 天` : ''}。</p>
      ${rows ? `<ul class="ts-list">${rows}</ul>` : '<p class="hint">還沒打過。按「開打」寫一張小人紙吧。</p>'}
      <p class="hint">心裡的委屈如果一直放不下，找信任的人聊聊，或打 1925 安心專線（24 小時免付費）。</p>`);
  }

  return {
    enter() {
      run++; phase = 'idle'; resetPaper(); S('xName').textContent = '';
      for (const id of ['xSlip', 'xTiger', 'xPork', 'xScrap', 'xTap']) S(id).style.display = 'none';
      S('xChantG').setAttribute('opacity', '0');
      say(xr.last === dayKey() ? '又來了？婆婆笑笑：「今天的氣還沒出完喔？再打一張也可以。」'
        : `來到鵝頸橋底，打小人婆婆招手：「心裡有什麼不爽快，寫下來，婆婆陪你打。」${jingzhe() ? '<br>今天<b>驚蟄</b>，正是打小人的日子！' : ''}<br>按「<b>開打</b>」開始。`);
    },
    leave() { run++; phase = 'idle'; },
  };
}

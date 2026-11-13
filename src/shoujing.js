// 青衣阿嬤收驚：照廟裡的做法——先稟報姓名和受驚的事（幫家人收驚就帶他的衣服）→ 阿嬤拿三炷香在頭頂、前胸、後背繞，
// 一邊喊名字「回來喔」；玩家要做的是跟著光圈慢慢深呼吸（按住吸氣、放開吐氣），心跳一下一下慢下來
// → 米卦：把包著紅布的米杯往下一翻，掀開看米面 → 收驚符＋平安茶。
// 場景 360 × 645；SVG 裡的 id 都加 sj 前綴。
import { makeCarrier } from './carry.js';
import bgUrl from './assets/sj/bg.webp';
import grannyUrl from './assets/sj/granny.webp';
import cupUrl from './assets/sj/cup.webp';
import shirtUrl from './assets/sj/shirt.webp';
import { reduce, sleep, tween, pick, daily, yesterdayKey, onSwipe } from './stall.js';

const WHO = [['me', '我自己'], ['kid', '小孩'], ['family', '家人'], ['pet', '毛小孩']];
const WHAT = [['scare', '被嚇到'], ['sleep', '睡不好、做惡夢'], ['stress', '壓力好大'], ['exam', '考前緊張'], ['sad', '剛經歷難過的事'], ['uneasy', '心神不寧']];
const ZONES = [
  { name: '頭頂', at: [180, 462], r: 26 }, { name: '頭頂', at: [180, 462], r: 26 },
  { name: '前胸', at: [180, 528], r: 34 }, { name: '前胸', at: [180, 528], r: 34 },
  { name: '後背', at: [180, 510], r: 64 }, { name: '後背', at: [180, 510], r: 64 },
];
const RICE = {
  flat: ['米面平平的', '心已經定下來了，今晚會好睡。'],
  dent: ['中間凹了一個小窩', '是真的被嚇到了，阿嬤已經幫你收回來，不用怕了。'],
  stand: ['有一粒米站了起來', '你身邊有貴人在照顧你，難過的時候記得開口。'],
  scatter: ['米粒有點散', '最近太累了，今天早點睡，別再滑手機了。'],
};
const TIPS = [
  '睡前把手機放遠一點，關燈後慢慢吸氣四秒、吐氣六秒，做五次。',
  '回家喝一杯溫溫的平安茶（溫開水也可以），跟自己說：「我很安全，我回來了。」',
  '洗個熱水澡，從頭沖到腳，想像今天的驚嚇都被沖走。',
  '寫下今天讓你害怕的事，寫完把紙摺起來，明天再看，通常就沒那麼可怕了。',
];
const INHALE = 3200, EXHALE = 4200;

const AV = { x: 180, base: 604, w: 150, h: 162 }; // 跪著的你
const SHIRT_REST = [302, 610], SHIRT_AT = [104, 352];
const CUP = [180, 364];
// 阿嬤：平常站在櫃台後面（下半身被櫃台擋住），收驚時走出來站到你右手邊
const GW = 92, GH = 221;
const G_HOME = [180, 462, 1], G_SIDE = [272, 608, .9];

const svgOf = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="青衣阿嬤收驚攤" class="stall-svg sj-svg">
  <defs>
    <radialGradient id="sjShadow"><stop offset="0" stop-color="#2A0E06" stop-opacity=".5"/><stop offset="1" stop-color="#2A0E06" stop-opacity="0"/></radialGradient>
    <radialGradient id="sjCalm"><stop offset="0" stop-color="#BFE6FF" stop-opacity="0"/><stop offset=".75" stop-color="#BFE6FF" stop-opacity=".18"/><stop offset="1" stop-color="#E8F6FF" stop-opacity=".55"/></radialGradient>
  </defs>
  <image href="${bgUrl}" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>
  <clipPath id="sjGClip" clipPathUnits="userSpaceOnUse"><rect x="-200" y="-400" width="400" height="${400 - (G_HOME[1] - 350)}"/></clipPath>
  <g id="sjGrannyG" transform="translate(${G_HOME[0]} ${G_HOME[1]})"><g class="sj-granny-idle"><image id="sjGranny" href="${grannyUrl}" x="${-GW / 2}" y="${-GH}" width="${GW}" height="${GH}"/></g></g>
  <text id="sjGrannyTag" x="180" y="${G_HOME[1] - GH - 6}" text-anchor="middle" class="xr-tag" style="fill:#FFF4E0">青衣阿嬤</text>
  <!-- 米卦杯 -->
  <g id="sjCup" class="stall-prop" data-sj="cup" role="button" tabindex="0" aria-label="米卦杯，往下滑翻過來" transform="translate(${CUP[0]} ${CUP[1]})" style="display:none">
    <ellipse cx="0" cy="4" rx="26" ry="5" fill="url(#sjShadow)"/>
    <g id="sjCupBody">
      <image href="${cupUrl}" x="-26" y="-55" width="52" height="57"/>
    </g>
    <g id="sjRice" style="display:none">
      <ellipse cx="0" cy="-3" rx="24" ry="8" fill="#F7EBD2" stroke="#D9C49A" stroke-width="1.2"/>
      <g id="sjRiceMark"></g>
    </g>
  </g>
  <path id="sjSwipeHint" d="M${CUP[0] + 40} ${CUP[1] - 46}v28l-6 -6M${CUP[0] + 40} ${CUP[1] - 18}l6 -6" stroke="#FFE08A" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0"/>
  <!-- 家人的衣服 -->
  <g id="sjShirt" class="stall-prop" data-sj="shirt" role="button" tabindex="0" aria-label="家人的衣服，放到桌上" transform="translate(${SHIRT_REST[0]} ${SHIRT_REST[1]})" style="display:none">
    <ellipse cx="0" cy="2" rx="26" ry="5" fill="url(#sjShadow)"/>
    <image href="${shirtUrl}" x="-25" y="-55" width="50" height="57"/>
  </g>
  <rect id="sjShirtRing" x="${SHIRT_AT[0] - 32}" y="${SHIRT_AT[1] - 60}" width="64" height="66" rx="8" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <!-- 你 -->
  <ellipse cx="${AV.x}" cy="${AV.base}" rx="60" ry="9" fill="url(#sjShadow)"/>
  <image id="sjMe" x="${AV.x - AV.w / 2}" y="${AV.base - AV.h}" width="${AV.w}" height="${AV.h}"/>
  <!-- 呼吸光圈 -->
  <g id="sjBreath" opacity="0" pointer-events="none">
    <circle id="sjRingMax" cx="180" cy="520" r="96" fill="none" stroke="#E8F6FF" stroke-width="1.6" stroke-dasharray="3 5"/>
    <circle id="sjRing" cx="180" cy="520" r="40" fill="url(#sjCalm)" stroke="#E8F6FF" stroke-width="3"/>
    <text id="sjCue" x="180" y="420" text-anchor="middle" class="sj-cue">按住・吸氣</text>
  </g>
  <!-- 三炷香 -->
  <g id="sjInc" style="display:none" pointer-events="none">
    <path d="M-4 0l-3 -40M0 0v-42M4 0l3 -40" stroke="#B0603A" stroke-width="2"/>
    <circle cx="-7" cy="-40" r="2.4" fill="#FF7A3A"/><circle cx="0" cy="-42" r="2.4" fill="#FF7A3A"/><circle cx="7" cy="-40" r="2.4" fill="#FF7A3A"/>
    <rect x="-5" y="0" width="10" height="12" rx="3" fill="#F6CFAE"/>
  </g>
  <g id="sjHeartG" opacity="0">
    <rect x="262" y="236" width="86" height="30" rx="15" fill="#1A0A08" opacity=".45"/>
    <path id="sjHeart" d="M280 247c-3-4-9-2-9 2 0 4 9 9 9 9s9-5 9-9c0-4-6-6-9-2z" fill="#FF7F8A"/>
    <text id="sjBpm" x="296" y="256" class="sj-bpm">110</text>
  </g>
  <rect id="sjTap" x="0" y="150" width="360" height="495" fill="transparent" style="display:none"/>
</svg>`;

export function initShoujing(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, addFish, me } = api;
  const host = $('#sjHost');
  host.innerHTML = svgOf();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const sj = state.sj || (state.sj = { last: '', streak: 0, total: 0 });
  let phase = 'idle', draft = null, run = 0;

  function paintMe() {
    const c = me(); const w = AV.w * c.scale, h = AV.h * c.scale;
    const el = S('sjMe'); el.setAttribute('href', c.kneel);
    el.setAttribute('width', w); el.setAttribute('height', h); el.setAttribute('x', AV.x - w / 2); el.setAttribute('y', AV.base - h);
  }

  /* ----- 1. 稟報 ----- */
  function openStart() {
    if (phase !== 'idle' && phase !== 'done') { say('收驚還沒做完，照阿嬤說的下一步。'); return; }
    const body = openSheet('收驚：跟阿嬤說說', `
      <p>阿嬤會喊名字，把被嚇走的魂收回來。幫家人收驚的話，帶他的衣服來就可以。</p>
      <div class="field"><span>幫誰收驚</span><div class="chips" id="sjWho">${WHO.map(([id, n], i) => `<button type="button" class="chip" data-w="${id}" aria-pressed="${i === 0}">${n}</button>`).join('')}</div></div>
      <div class="field"><span>最近怎麼了</span><div class="chips" id="sjWhat">${WHAT.map(([id, n], i) => `<button type="button" class="chip" data-t="${id}" aria-pressed="${i === 0}">${n}</button>`).join('')}</div></div>
      <input id="sjName" class="yue-wish" maxlength="5" placeholder="名字或小名（阿嬤會喊）" value="${esc(state.name !== '香客' ? state.name : '')}">
      <div class="row"><button class="btn" id="sjGo">請阿嬤收驚</button></div>`);
    let who = 'me', what = 'scare';
    body.addEventListener('click', (e) => {
      const w = e.target.closest('[data-w]'), t = e.target.closest('[data-t]');
      if (w) { who = w.dataset.w; body.querySelectorAll('[data-w]').forEach((x) => x.setAttribute('aria-pressed', String(x === w))); }
      if (t) { what = t.dataset.t; body.querySelectorAll('[data-t]').forEach((x) => x.setAttribute('aria-pressed', String(x === t))); }
    });
    body.querySelector('#sjGo').addEventListener('click', () => {
      const name = body.querySelector('#sjName').value.trim() || (who === 'me' ? '乖孫' : who === 'pet' ? '毛寶貝' : '寶貝');
      draft = { who, what, name }; closeSheet();
      if (who === 'me') startBreath();
      else {
        phase = 'shirt'; S('sjShirt').style.display = ''; shirt.home();
        say(`幫${WHO.find((x) => x[0] === who)[1]}收驚，要用他的衣服代替本人。按住右下角的<b>衣服</b>，攤到阿嬤的桌上。`);
      }
    });
  }
  const shirt = makeCarrier({
    svg, el: S('sjShirt'), sfx, cam, ring: S('sjShirtRing'), lift: 64, radius: 34,
    rest: () => SHIRT_REST, target: () => SHIRT_AT, zoom: () => [170, 440, 280],
    onTap: () => say('按住<b>衣服</b>拿起來，放到阿嬤前面的桌上。'),
    onDrop() { sfx.pop(); cam?.reset(200); startBreath(); },
  });

  /* ----- 阿嬤的動作 ----- */
  const GG = S('sjGrannyG'), GI = S('sjGranny');
  let gPos = G_HOME;
  function grannyAt([x, y, sc], rot = 0, dy = 0) { GG.setAttribute('transform', `translate(${x.toFixed(1)} ${(y + dy).toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc})`); }
  function clipGranny(on) { if (on) GI.setAttribute('clip-path', 'url(#sjGClip)'); else GI.removeAttribute('clip-path'); }
  async function grannyMove(to) {
    if (gPos === to) return;
    const r = run;
    await tween(reduce ? 60 : 260, (k) => { GG.style.opacity = String(1 - k); grannyAt(gPos, 0, -k * 12); });
    if (r !== run) { GG.style.opacity = ''; return; }
    gPos = to; clipGranny(to === G_HOME); S('sjGrannyTag').style.display = to === G_HOME ? '' : 'none';
    sfx.knock();
    await tween(reduce ? 60 : 320, (k) => { GG.style.opacity = String(k); grannyAt(to, 0, -Math.sin(k * Math.PI) * 14); });
    GG.style.opacity = '';
  }
  async function grannyBow(deg = -16, ms = 700) {
    await tween(ms, (k) => grannyAt(gPos, Math.sin(k * Math.PI) * deg, Math.sin(k * Math.PI) * 6));
  }
  function grannyHome() { gPos = G_HOME; clipGranny(true); GG.style.opacity = ''; S('sjGrannyTag').style.display = ''; grannyAt(G_HOME); }

  /* ----- 2. 阿嬤持香，你深呼吸 ----- */
  let breath = 0, bpm = 110, holdAt = 0, exhaling = false;
  const forOther = () => draft && draft.who !== 'me';
  async function startBreath() {
    const r = ++run; phase = 'walk';
    say('阿嬤拿起三炷香，從櫃台後面走出來，站到你旁邊……');
    await grannyMove(G_SIDE); if (r !== run) return;
    await grannyBow(-10, 500); if (r !== run) return;
    phase = 'breath'; breath = 0; bpm = 110 - (forOther() ? 0 : 0);
    S('sjBreath').setAttribute('opacity', '1'); S('sjHeartG').setAttribute('opacity', '1'); S('sjBpm').textContent = bpm;
    S('sjInc').style.display = ''; placeInc(244, 470, 0);
    S('sjTap').style.display = '';
    cam?.zoom(180, 470, 300);
    say(`阿嬤點起三炷香：「<b>${esc(draft.name)}</b>，阿嬤幫你收驚喔。」<br>${forOther() ? '你幫他深呼吸：' : ''}<b>按住畫面吸氣</b>，光圈變大；<b>放開吐氣</b>，慢慢的就好。`);
    heartLoop(r);
  }
  function placeInc(x, y, rot) { S('sjInc').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`); }
  function heartLoop(r) {
    let t0 = performance.now();
    const step = (now) => {
      if (r !== run || phase !== 'breath') return;
      const per = 60000 / bpm, k = ((now - t0) % per) / per;
      S('sjHeart').setAttribute('transform', `translate(280 251) scale(${(1 + (k < .15 ? (.15 - k) * 1.6 : 0)).toFixed(3)}) translate(-280 -251)`);
      if (!holdAt && !exhaling) S('sjRing').setAttribute('r', (40 + Math.sin(now / 500) * 2).toFixed(1));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function inhale() {
    if (phase !== 'breath' || exhaling || holdAt) return;
    holdAt = performance.now(); const r = run;
    S('sjCue').textContent = '吸～'; sfx.bowl();
    const step = (now) => {
      if (!holdAt || r !== run) return;
      const k = Math.min(1, (now - holdAt) / INHALE);
      S('sjRing').setAttribute('r', (40 + 56 * k).toFixed(1));
      grannyAt(gPos, -2 * k, -4 * k);
      if (k >= 1) { S('sjCue').textContent = '可以放開，吐氣'; S('sjRingMax').setAttribute('stroke', '#FFE08A'); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  async function exhale() {
    if (!holdAt) return;
    const held = performance.now() - holdAt; holdAt = 0;
    S('sjRingMax').setAttribute('stroke', '#E8F6FF');
    if (held < INHALE * .6) { S('sjCue').textContent = '按住・吸氣'; S('sjRing').setAttribute('r', '40'); say('再慢一點，吸久一點點，等光圈碰到外面那一圈再放開。'); return; }
    exhaling = true; const r = run;
    const z = ZONES[breath];
    S('sjCue').textContent = '吐～';
    // 阿嬤拿香繞
    const r0 = +S('sjRing').getAttribute('r');
    const lines = [`${esc(draft.name)}，回來喔～`, '三魂七魄，回來喔～', '不驚不驚，阿嬤在這裡', '嚇到的，通通收回來', `${esc(draft.name)}，好好吃飯好好睡`, '平平安安，回來喔～'];
    say(`阿嬤拿香在你的<b>${z.name}</b>繞圈：「${lines[breath]}」`, 'temple');
    await tween(EXHALE, (k, raw) => {
      if (r !== run) return;
      S('sjRing').setAttribute('r', (r0 - (r0 - 40) * k).toFixed(1));
      const a = raw * Math.PI * 2 * 2 - Math.PI / 2;
      const x = z.at[0] + Math.cos(a) * z.r, y = z.at[1] + Math.sin(a) * z.r * .55 - 30;
      placeInc(x, y, Math.cos(a) * 12);
      // 阿嬤跟著香繞圈搖身體，繞頭頂時往前探、繞後背時彎得更低
      const lean = z.name === '頭頂' ? -6 : z.name === '前胸' ? -10 : -16;
      grannyAt(gPos, lean * Math.min(1, raw * 4, (1 - raw) * 4) + Math.sin(a) * 4, Math.abs(Math.sin(a)) * 3);
      if (Math.random() < .35) emit('smoke', x, y - 42, { color: '#F4F1EA', alpha: .45 });
    }, (k) => k);
    if (r !== run) return;
    bpm = Math.max(68, bpm - 7); S('sjBpm').textContent = bpm;
    sfx.buzz([8]);
    emit('text', 300, 230, { text: `心跳 ${bpm}`, color: '#BFE6FF', size: 12, life: 1.2 });
    breath++; exhaling = false; S('sjCue').textContent = '按住・吸氣';
    if (breath < ZONES.length) return;
    finishBreath();
  }
  async function finishBreath() {
    phase = 'cup'; S('sjTap').style.display = 'none'; S('sjBreath').setAttribute('opacity', '0');
    S('sjInc').style.display = 'none';
    burst('spark', 180, 500, reduce ? 3 : 14); sfx.chime();
    const r = run;
    say('阿嬤對著你深深一鞠躬：「好了好了，收回來了。」');
    await grannyBow(-22, 900); if (r !== run) return;
    await grannyMove(G_HOME); if (r !== run) return;
    await sleep(200);
    S('sjCup').style.display = ''; S('sjCupBody').setAttribute('transform', ''); S('sjRice').style.display = 'none';
    S('sjSwipeHint').setAttribute('opacity', '1');
    cam?.zoom(180, 360, 220);
    say('心跳慢下來了。阿嬤拿出包著紅布的<b>米卦杯</b>：「來，看看米怎麼說。」<br>在杯子上<b>往下滑</b>，把杯子翻過來。');
  }

  /* ----- 3. 米卦 ----- */
  let riceKey = 'flat';
  onSwipe(S('sjCup'), svg, {
    dir: 'down', dist: 34,
    onMove(p, k) { if (phase === 'cup') S('sjCupBody').setAttribute('transform', `rotate(${(Math.min(1, k) * 40).toFixed(1)} 0 -16)`); },
    async onDone() {
      if (phase === 'reveal') { reveal(); return; }
      if (phase !== 'cup') return;
      phase = 'flipping'; S('sjSwipeHint').setAttribute('opacity', '0');
      await tween(320, (k) => S('sjCupBody').setAttribute('transform', `rotate(${40 + 140 * k} 0 -16)`));
      sfx.knock(); sfx.buzz([16]);
      S('sjCupBody').setAttribute('transform', 'rotate(180 0 -16)');
      riceKey = pick(Object.keys(RICE));
      phase = 'reveal';
      say('杯子倒扣在桌上了。阿嬤唸了幾句，<b>點一下杯子</b>，掀開來看米。');
    },
  });
  S('sjCup').addEventListener('click', () => { if (phase === 'reveal') reveal(); else if (phase === 'cup') flipAuto(); });
  async function flipAuto() {
    if (phase !== 'cup') return;
    phase = 'flipping'; S('sjSwipeHint').setAttribute('opacity', '0');
    await tween(420, (k) => S('sjCupBody').setAttribute('transform', `rotate(${180 * k} 0 -16)`));
    sfx.knock(); riceKey = pick(Object.keys(RICE)); phase = 'reveal';
    say('杯子倒扣在桌上了。<b>點一下杯子</b>，掀開來看米。');
  }
  function riceMark(k) {
    if (k === 'dent') return '<ellipse cx="2" cy="-3" rx="6" ry="2.4" fill="#C9B48A"/>';
    if (k === 'stand') return '<rect x="-1" y="-12" width="2.4" height="8" rx="1.2" fill="#FFFDF4" stroke="#C9B48A" stroke-width=".6"/>';
    if (k === 'scatter') return Array.from({ length: 9 }, (_, i) => `<ellipse cx="${-18 + i * 4.5}" cy="${-3 + (i % 3) * 2 - 2}" rx="1.6" ry=".9" fill="#E0CC9E"/>`).join('');
    return '';
  }
  async function reveal() {
    if (phase !== 'reveal') return;
    phase = 'read';
    await tween(300, (k) => S('sjCupBody').setAttribute('transform', `translate(${k * 40} ${-k * 30}) rotate(${180 - 40 * k} 0 -16)`));
    S('sjCupBody').style.opacity = '0'; S('sjRice').style.display = ''; S('sjRiceMark').innerHTML = riceMark(riceKey);
    burst('spark', CUP[0], CUP[1] - 8, reduce ? 2 : 8); sfx.chime();
    const [look, mean] = RICE[riceKey];
    say(`米卦：<b>${look}</b>。<br>阿嬤：「${mean}」`);
    await sleep(2200);
    finish(look, mean);
  }

  /* ----- 4. 收驚符、平安茶 ----- */
  function finish(look, mean) {
    const first = daily(sj, dayKey(), yesterdayKey()); save();
    if (first) addFish(1);
    phase = 'done'; cam?.reset();
    const tip = pick(TIPS);
    openSheet('收驚好了', `
      <div class="slip"><div class="slip-side"><span>收驚符</span><span class="lv">安</span></div>
        <p class="poem"><span>驚魂收回心安定</span><span>${esc(draft.name).slice(0, 5)}平安好眠</span></p></div>
      <div class="explain">
        <h3>米卦</h3><p>${look}：${mean}</p>
        <h3>阿嬤交代</h3><p>${tip}</p>
      </div>
      <p class="hint">${first ? `今天安神了，虎爺叼來小魚乾 ×1。已經連續 ${sj.streak} 天來安神。` : '今天已經安過神了，想再來隨時都可以。'}</p>
      <p class="hint">如果一直睡不好、心慌好幾週，記得看醫生或打 1925 安心專線。</p>`);
    sfx.bowl();
    S('sjShirt').style.display = 'none';
  }

  S('sjTap').addEventListener('pointerdown', (e) => { e.preventDefault(); S('sjTap').setPointerCapture(e.pointerId); inhale(); });
  S('sjTap').addEventListener('pointerup', exhale);
  S('sjTap').addEventListener('pointercancel', exhale);
  svg.addEventListener('keydown', (e) => { if (e.key === ' ' && phase === 'breath' && !e.repeat) { e.preventDefault(); inhale(); } });
  svg.addEventListener('keyup', (e) => { if (e.key === ' ' && phase === 'breath') { e.preventDefault(); exhale(); } });
  $('#sjBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-sj]'); if (!b) return;
    const a = b.dataset.sj;
    if (a === 'start') openStart();
    else if (a === 'cup') { if (phase === 'cup') flipAuto(); else if (phase === 'reveal') reveal(); else say('收完驚，阿嬤才會拿米卦杯出來。'); }
    else if (a === 'log') openSheet('安神紀錄', `<p>一共收驚 <b>${sj.total || 0}</b> 次${sj.streak > 1 ? `，連續 ${sj.streak} 天` : ''}。</p><p>${pick(TIPS)}</p><p class="hint">收驚是讓心安定下來的老習俗。身體不舒服還是要看醫生。</p>`);
  });

  return {
    enter() {
      run++; phase = 'idle'; holdAt = 0; exhaling = false; paintMe(); grannyHome();
      for (const id of ['sjCup', 'sjShirt', 'sjInc', 'sjTap']) S(id).style.display = 'none';
      S('sjCupBody').style.opacity = ''; S('sjBreath').setAttribute('opacity', '0'); S('sjHeartG').setAttribute('opacity', '0'); S('sjSwipeHint').setAttribute('opacity', '0');
      say(sj.last === dayKey() ? '阿嬤：「今天又來啦？心還慌慌的嗎？再收一次也可以。」'
        : '青衣阿嬤拍拍椅子：「來，坐。最近有沒有被什麼嚇到、睡不好？阿嬤幫你收驚。」<br>按「<b>收驚</b>」開始。');
    },
    leave() { run++; phase = 'idle'; holdAt = 0; grannyHome(); },
  };
}

// 觀音殿：拿楊柳枝灑淨水，把心裡的烏雲化成蓮花；點蓮花燈；觀音籤。
// 場景座標跟正殿一樣是 360 × 645；SVG 裡的 id 都加 g 前綴，避免跟其他殿的 SVG 撞名。
import bgUrl from './assets/gy/gy-bg.webp';
import festUrl from './assets/gy/gy-festival.webp';
import vaseUrl from './assets/gy/vase.webp';
import willowUrl from './assets/gy/willow.webp';
import lotusUrl from './assets/gy/lotus.webp';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 文字內容（原創） ---------- */
export const GY_QIAN = [
  { no: 1, level: '上上', title: '聽見', poem: ['千手千眼看人間', '你的眼淚我看見', '說不出口的委屈', '輕輕放下在這邊'],
    gist: '你的難過有人懂。不用一直假裝沒事。', tip: '找一個信任的人，說出一件你一直憋著的事。' },
  { no: 2, level: '中吉', title: '柔軟', poem: ['楊柳隨風不會斷', '硬碰硬的才會傷', '軟一點也是力量', '退一步路反而寬'],
    gist: '不是每件事都要硬撐到底。柔軟不是輸，是另一種堅強。', tip: '今天遇到卡住的事，試著換一個說法、換一條路。' },
  { no: 3, level: '上吉', title: '淨心', poem: ['一滴淨水灑心頭', '昨夜煩憂隨水流', '心若乾淨如蓮葉', '泥裡也能開花朵'],
    gist: '環境再亂，你的心可以保持乾淨。不必跟著別人起舞。', tip: '睡前花三分鐘，把今天不開心的事想一遍，然後跟它說再見。' },
  { no: 4, level: '中平', title: '慈悲', poem: ['對人慈悲容易做', '對己慈悲常忘了', '你也值得被溫柔', '先抱一抱自己吧'],
    gist: '你對別人很好，卻對自己很嚴格。今天對自己好一點。', tip: '對自己說三句你會對好朋友說的鼓勵的話。' },
  { no: 5, level: '上吉', title: '平安', poem: ['淨瓶甘露灑四方', '家家戶戶得安康', '心中掛念的那人', '菩薩替你看顧著'],
    gist: '你掛念的人會平安的。把擔心換成祝福。', tip: '傳一則訊息給你掛念的人，簡單問候就好。' },
  { no: 6, level: '中吉', title: '等待', poem: ['蓮花不急著開放', '時候到了自然香', '你等的那件事啊', '正在路上慢慢趕'],
    gist: '急不來的事，就交給時間。該來的會來。', tip: '今天先做好眼前能做的一件小事，其他的放心等。' },
  { no: 7, level: '中平', title: '放手', poem: ['手裡抓得緊緊的', '握久了手也會疼', '張開手掌看一看', '空了才能接新的'],
    gist: '有些人事物，放手比抓緊更好。空出來，才有位置給新的。', tip: '整理手機相簿或聊天紀錄，刪掉一些讓你難過的東西。' },
  { no: 8, level: '上上', title: '圓滿', poem: ['蓮台坐穩心不慌', '風雨過後見晴光', '你走過的每一步', '都在讓你更圓滿'],
    gist: '過去的辛苦都沒有白費，它們讓你變成現在的你。', tip: '寫下這一年你撐過的三件事，給自己拍拍手。' },
];
const GREET = [
  '觀音菩薩微微一笑：「孩子，累了嗎？坐下來，慢慢說。」',
  '觀音菩薩輕輕點頭：「你心裡的聲音，我都聽見了。」',
  '淨瓶裡的水閃了一下光。觀音菩薩說：「先深呼吸，一切都會好的。」',
  '觀音菩薩看著你：「不用急著好起來，難過也是可以的。」',
];
const AFTER = [
  '烏雲都化成蓮花了。觀音菩薩說：「心裡的天空，本來就是晴的。」',
  '最後一朵蓮花飄上去了。觀音菩薩輕聲說：「放下了，就輕了。」',
  '雲散了，殿裡亮了起來。觀音菩薩說：「下次又變陰天，再來找我灑一灑。」',
];
const CLOUDS = [['焦慮', 92, 236], ['委屈', 272, 226], ['疲累', 70, 318], ['難過', 292, 308], ['害怕', 180, 190]];
const NAMES = ['一', '二', '三', '四', '五', '六', '七', '八'];

/* ---------- 場景 ---------- */
// 參考點：觀音臉 (180,290)、供桌桌面 y≈378、拜墊中心 (184,525)
const VASE = [62, 562, 31, 64]; // 淨瓶：中心 x、y、寬、高
const MOUTH = [VASE[0] + 1, VASE[1] - VASE[3] / 2 + 6]; // 瓶口
const W_W = 72, W_H = 81; // 楊柳枝大小；原點在枝條上端（手拿的地方）
const LIFT = 92; // 拿著時，枝條上端在手指上方這麼高，葉子才不會被手指擋住
const LAMP = [199, 349, 46, 36];
const cloudSvg = (w) => `
  <g class="gy-cloud" data-word="${w}">
    <g class="gy-puff">
      <circle cx="-22" cy="4" r="15"/><circle cx="-6" cy="-8" r="19"/><circle cx="14" cy="-4" r="17"/><circle cx="27" cy="7" r="12"/>
      <rect x="-34" y="2" width="68" height="17" rx="8.5"/>
    </g>
    <text class="gy-word" y="9" text-anchor="middle">${w}</text>
  </g>`;
export const GY_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="觀音殿" class="gy-svg">
  <defs>
    <filter id="gLit" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="1 .02 0 0 .01  .01 .97 0 0 0  .01 .02 .95 0 0  0 0 0 1 0"/>
    </filter>
    <radialGradient id="gContact"><stop offset="0" stop-color="#2A1A10" stop-opacity=".5"/><stop offset="1" stop-color="#2A1A10" stop-opacity="0"/></radialGradient>
    <radialGradient id="gHalo"><stop offset="0" stop-color="#FFFBEA" stop-opacity=".95"/><stop offset=".6" stop-color="#FFE3A8" stop-opacity=".35"/><stop offset="1" stop-color="#FFE3A8" stop-opacity="0"/></radialGradient>
    <radialGradient id="gLampGlow"><stop offset="0" stop-color="#FFE6A0" stop-opacity=".9"/><stop offset="1" stop-color="#FFB86B" stop-opacity="0"/></radialGradient>
  </defs>
  <image id="gBg" href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice" style="display:none"/>
  <circle transform="translate(182 380) scale(1.38) translate(-182 -380)" id="gHaloC" cx="180" cy="295" r="58" fill="url(#gHalo)" opacity=".15" style="mix-blend-mode:screen"/>
  <rect transform="translate(182 380) scale(1.38) translate(-182 -380)" class="hit" data-gy="deity" role="button" tabindex="0" aria-label="向觀音菩薩問安" x="145" y="255" width="72" height="105" rx="22" fill="transparent"/>

  <!-- 蓮花燈（點了才出現） -->
  <circle id="gLampGlow" cx="${LAMP[0] + LAMP[2] / 2}" cy="${LAMP[1] + 10}" r="34" fill="url(#gLampGlow)" opacity="0" style="mix-blend-mode:screen"/>
  <image id="gLamp" class="gy-lamp" href="${lotusUrl}" x="${LAMP[0]}" y="${LAMP[1]}" width="${LAMP[2]}" height="${LAMP[3]}" style="display:none" filter="url(#gLit)"/>

  <!-- 心裡的烏雲（按「灑淨水」才出現） -->
  <g id="gClouds" pointer-events="none"></g>
  <g id="gBlooms" pointer-events="none"></g>

  <!-- 淨瓶與楊柳枝（拜墊左前方） -->
  <ellipse cx="${VASE[0]}" cy="${VASE[1] + VASE[3] / 2 - 1}" rx="18" ry="4" fill="url(#gContact)"/>
  <image href="${vaseUrl}" x="${VASE[0] - VASE[2] / 2}" y="${VASE[1] - VASE[3] / 2}" width="${VASE[2]}" height="${VASE[3]}" filter="url(#gLit)"/>
  <g id="gWillow" class="gy-willow" data-gy="willow" role="button" tabindex="0" aria-label="楊柳枝，拿起來搖一搖灑淨水">
    <g id="gWillowTilt">
      <rect x="${-W_W}" y="-6" width="${W_W + 12}" height="${W_H + 8}" fill="transparent"/>
      <image href="${willowUrl}" x="${-W_W * .93}" y="-2" width="${W_W}" height="${W_H}" filter="url(#gLit)"/>
    </g>
  </g>
</svg>`;

export function initGuanyin(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam } = api;
  const host = $('#gyHost');
  host.innerHTML = GY_SVG(bgUrl);
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const gy = state.gy || (state.gy = { cleared: 0, clearDay: '', lampDay: '', lampFor: '', qian: null });
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };

  /* ----- 問安 ----- */
  function greetGod() {
    S('gHaloC').setAttribute('opacity', '.7'); setTimeout(() => S('gHaloC').setAttribute('opacity', '.15'), 1400);
    burst('spark', 180, 295, reduce ? 3 : 10);
    say(GREET[Math.floor(Math.random() * GREET.length)], 'god');
  }

  /* ----- 烏雲 ----- */
  const cloudsG = S('gClouds'), bloomsG = S('gBlooms');
  let clouds = []; // { el, x, y, hp, hitT, ph }
  function spawnClouds() {
    cloudsG.innerHTML = ''; clouds = [];
    CLOUDS.forEach(([w, x, y], i) => {
      cloudsG.insertAdjacentHTML('beforeend', cloudSvg(w));
      clouds.push({ el: cloudsG.lastElementChild, x, y, hp: 3, hitT: 0, ph: i * 1.3, a: 0 });
    });
    kickC();
  }
  let cAnim = 0;
  function cloudLoop(t) {
    for (const c of clouds) {
      c.a = Math.min(1, c.a + .04);
      const k = c.hp / 3, s = .75 + .25 * k;
      c.el.setAttribute('transform', `translate(${(c.x + Math.sin(t / 1400 + c.ph) * 5).toFixed(1)} ${(c.y + Math.sin(t / 900 + c.ph) * 2).toFixed(1)}) scale(${s.toFixed(2)})`);
      c.el.setAttribute('opacity', (c.a * (.55 + .45 * k)).toFixed(2));
    }
    cAnim = clouds.length ? requestAnimationFrame(cloudLoop) : 0;
  }
  const kickC = () => { if (!cAnim && clouds.length) cAnim = requestAnimationFrame(cloudLoop); };
  function bloom(c) {
    c.el.remove(); clouds = clouds.filter((x) => x !== c);
    const NS = 'http://www.w3.org/2000/svg', img = document.createElementNS(NS, 'image');
    img.setAttribute('href', lotusUrl); img.setAttribute('width', '34'); img.setAttribute('height', '26');
    bloomsG.appendChild(img);
    const t0 = performance.now(), x0 = c.x, y0 = c.y;
    const step = (t) => {
      const s = (t - t0) / 1000, k = Math.min(1, s / 2.2);
      img.setAttribute('x', (x0 - 17 + Math.sin(s * 3) * 4).toFixed(1)); img.setAttribute('y', (y0 - 13 - s * 34).toFixed(1));
      img.setAttribute('opacity', (k < .15 ? k / .15 : 1 - Math.max(0, (k - .5) / .5)).toFixed(2));
      if (k < 1) requestAnimationFrame(step); else img.remove();
    };
    requestAnimationFrame(step);
    sfx.pop(); setTimeout(() => sfx.chime(), 120);
    burst('spark', c.x, c.y, reduce ? 3 : 10);
    emit('text', c.x, c.y - 18, { text: `${c.el.dataset.word} 化成蓮花`, color: '#FFE3EE', life: 1.5, vy: -26, size: 13 });
    if (!clouds.length) allClear();
  }
  function allClear() {
    if (gy.clearDay !== dayKey()) { gy.clearDay = dayKey(); gy.cleared++; save(); }
    setTimeout(() => {
      sfx.chime(); sfx.buzz([15, 50, 15]);
      S('gHaloC').setAttribute('opacity', '.8'); setTimeout(() => S('gHaloC').setAttribute('opacity', '.15'), 2000);
      burst('spark', 180, 290, reduce ? 4 : 16);
      say(AFTER[Math.floor(Math.random() * AFTER.length)], 'god');
      cam?.reset(800);
    }, 600);
  }
  function sprinkleAt(x, y, sp) { // 葉子附近的雲被淨水打到
    const now = performance.now();
    for (const c of [...clouds]) {
      if (Math.hypot(c.x - x, c.y - y) > 52 || now - c.hitT < 160) continue;
      c.hitT = now; c.hp--;
      for (let i = 0; i < 4; i++) emit('drop', c.x + (Math.random() - .5) * 40, c.y - 10, { color: '#CFEFFF' });
      if (c.hp <= 0) bloom(c); else sfx.knock();
    }
    if (sp > 0 && Math.random() < .6) emit('drop', x + (Math.random() - .5) * 30, y + Math.random() * 14, { color: '#CFEFFF' });
  }

  /* ----- 楊柳枝：拿起來搖 ----- */
  const willow = S('gWillow'), tilt = S('gWillowTilt');
  const REST = [...MOUTH], REST_ANG = 205; // 插在瓶子裡：枝條上端朝下插進瓶口，葉子朝上
  let pos = [...REST], ang = REST_ANG, wdrag = null;
  const placeW = () => {
    willow.setAttribute('transform', `translate(${pos[0].toFixed(1)} ${pos[1].toFixed(1)})`);
    tilt.setAttribute('transform', `rotate(${ang.toFixed(1)})`);
  };
  const leaves = () => { // 葉子中段的位置（場景座標）
    const a = ang * Math.PI / 180, lx = -W_W * .55, ly = W_H * .62;
    return [pos[0] + lx * Math.cos(a) - ly * Math.sin(a), pos[1] + lx * Math.sin(a) + ly * Math.cos(a)];
  };
  placeW();
  function goHome() {
    const from = [...pos], a0 = ang, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 420), e = 1 - Math.pow(1 - k, 3);
      pos = [from[0] + (REST[0] - from[0]) * e, from[1] + (REST[1] - from[1]) * e]; ang = a0 + (REST_ANG - a0) * e; placeW();
      if (k < 1 && !wdrag) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const lift = () => LIFT; // 場景座標；放大時螢幕上的距離會變大一點，手指更不會擋到
  willow.addEventListener('pointerdown', (e) => {
    e.preventDefault(); willow.setPointerCapture(e.pointerId);
    const p = pt(e); wdrag = { moved: false, x0: p.x, y0: p.y, lx: p.x, ly: p.y, lt: performance.now() };
    willow.classList.add('held'); sfx.pop();
  });
  willow.addEventListener('pointermove', (e) => {
    if (!wdrag) return;
    const p = pt(e), now = performance.now();
    if (!wdrag.moved && Math.hypot(p.x - wdrag.x0, p.y - wdrag.y0) > 6) {
      wdrag.moved = true;
      if (!clouds.length && gy.clearDay !== dayKey()) spawnClouds();
      if (clouds.length) cam?.zoom(180, 300, 300); // 放大烏雲那一塊
    }
    if (!wdrag.moved) return;
    const dt = Math.max(8, now - wdrag.lt) / 1000, vx = (p.x - wdrag.lx) / dt, vy = (p.y - wdrag.ly) / dt;
    wdrag.lx = p.x; wdrag.ly = p.y; wdrag.lt = now;
    pos = [Math.max(20, Math.min(360, p.x + 24)), Math.max(40, Math.min(560, p.y - lift()))];
    ang = Math.max(-40, Math.min(40, -vx / 22));
    placeW();
    const sp = Math.hypot(vx, vy);
    if (sp > 200) { const [x, y] = leaves(); sprinkleAt(x, y, sp); }
  });
  const wUp = () => {
    if (!wdrag) return;
    const moved = wdrag.moved; wdrag = null; willow.classList.remove('held');
    if (!moved) tapWillow(); else if (clouds.length) cam?.reset(300);
    goHome();
  };
  willow.addEventListener('pointerup', wUp);
  willow.addEventListener('pointercancel', wUp);
  function tapWillow() {
    if (clouds.length) { say('按住淨瓶裡的<b>楊柳枝</b>拿起來，在烏雲旁邊<b>左右搖一搖</b>，淨水灑到的雲就會化成蓮花。', 'god'); return; }
    if (gy.clearDay === dayKey()) { say('今天心裡的烏雲都化成蓮花了。想再灑一灑也可以，拿起楊柳枝搖一搖就好。', 'god'); return; }
    startSprinkle();
  }
  function startSprinkle() {
    spawnClouds(); sfx.knock();
    say('心裡的烏雲飄出來了：焦慮、委屈、疲累、難過、害怕。按住淨瓶裡的<b>楊柳枝</b>拿起來，在雲旁邊<b>左右搖</b>，用淨水把它們化成蓮花。', 'god');
  }
  function autoSprinkle() { // 按鈕／鍵盤：楊柳枝自己飛過去灑
    if (!clouds.length) { if (gy.clearDay === dayKey()) { tapWillow(); return; } spawnClouds(); }
    cam?.zoom(180, 300, 300);
    const t0 = performance.now(), order = [...clouds].sort((a, b) => a.x - b.x);
    const step = (t) => {
      const s = (t - t0) / 1000, i = Math.floor(s / .9), c = order[i];
      if (!c || !clouds.length) { goHome(); return; }
      const k = (s % .9) / .9;
      pos = [c.x + 30 + Math.sin(k * Math.PI * 6) * 18, c.y - 50]; ang = Math.cos(k * Math.PI * 6) * 30; placeW();
      const [x, y] = leaves(); sprinkleAt(c.x, c.y, 300); emit('drop', x, y, { color: '#CFEFFF' });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  willow.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); autoSprinkle(); } });

  /* ----- 蓮花燈 ----- */
  const lamp = S('gLamp'), glow = S('gLampGlow');
  let flick = 0;
  const lampOn = () => gy.lampDay === dayKey();
  function paintLamp() {
    lamp.style.display = lampOn() ? '' : 'none';
    cancelAnimationFrame(flick);
    if (!lampOn()) { glow.setAttribute('opacity', '0'); return; }
    if (reduce) { glow.setAttribute('opacity', '.7'); return; }
    const f = (t) => { glow.setAttribute('opacity', (.6 + Math.sin(t / 180) * .08 + Math.sin(t / 77) * .05).toFixed(2)); flick = requestAnimationFrame(f); };
    flick = requestAnimationFrame(f);
  }
  paintLamp();
  function openLamp() {
    if (lampOn()) { say(`今天的蓮花燈已經點亮了${gy.lampFor ? `，為「${esc(gy.lampFor)}」祈福` : ''}。燈會亮到今天結束。`, 'god'); cam?.zoom(LAMP[0] + 20, LAMP[1], 180); cam?.reset(1800); return; }
    const body = openSheet('點一盞蓮花燈', `
      <p>這盞燈想為誰點？可以是自己、家人、朋友，或是你掛念的人。</p>
      <input id="gFor" class="yue-wish" maxlength="10" placeholder="例如：媽媽、自己、小黑（可以不填）">
      <div class="row"><button class="btn" id="gGo">點燈</button></div>`);
    const inp = body.querySelector('#gFor');
    setTimeout(() => inp.focus(), 50);
    body.querySelector('#gGo').addEventListener('click', () => {
      gy.lampFor = inp.value.trim(); gy.lampDay = dayKey(); save(); closeSheet();
      cam?.zoom(LAMP[0] + 20, LAMP[1], 180);
      setTimeout(() => {
        paintLamp(); lamp.classList.remove('pop'); void lamp.getBoundingClientRect(); lamp.classList.add('pop');
        sfx.pop(); setTimeout(() => sfx.chime(), 300);
        burst('spark', LAMP[0] + LAMP[2] / 2, LAMP[1] + 8, reduce ? 3 : 12);
        say(`蓮花燈點亮了${gy.lampFor ? `，為「${esc(gy.lampFor)}」祈福` : ''}。觀音菩薩說：「心裡有光的人，走到哪裡都不怕黑。」`, 'god');
        cam?.reset(2200);
      }, 500);
    });
  }

  /* ----- 觀音籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!gy.qian || gy.qian.date !== t) { gy.qian = { date: t, no: 1 + Math.floor(Math.random() * GY_QIAN.length) }; save(); sfx.rattle(1); }
    const f = GY_QIAN.find((x) => x.no === gy.qian.no);
    openSheet(`觀音籤第${NAMES[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>觀音籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日安心小功課</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，真的很難受的時候，記得找身邊的人或專業的人聊聊。</p>`);
  }

  const ACTS = { water: () => (clouds.length ? autoSprinkle() : gy.clearDay === dayKey() ? autoSprinkle() : startSprinkle()), lamp: openLamp, qian: openQian };
  svg.addEventListener('click', (e) => { if (e.target.closest('[data-gy="deity"]')) greetGod(); });
  svg.querySelector('[data-gy="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#gyBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-gy]'); if (b) ACTS[b.dataset.gy](); });

  return {
    enter() {
      paintLamp(); placeW();
      say(!gy.cleared ? '歡迎來到觀音殿。先點燭、上香。心裡悶悶的時候，按「灑淨水」，用楊柳枝把烏雲化成蓮花。'
        : gy.clearDay === dayKey() ? '又回來了呀。今天的烏雲已經散了，要不要點一盞蓮花燈，或抽支觀音籤？'
        : `歡迎回來，你已經化開 ${gy.cleared} 次烏雲了。今天心裡的天氣怎麼樣？`, 'god');
    },
    setFestive(on) { S('gBg').setAttribute('href', on ? festUrl : bgUrl); },
    god: '觀音', qianName: '觀音籤', qianCount: GY_QIAN.length,
    hasQianToday: () => !!gy.qian && gy.qian.date === dayKey(),
    setQian(no) { gy.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

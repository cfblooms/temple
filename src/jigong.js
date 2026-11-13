// 濟公堂：寫下煩惱，拿破扇把字搧走；拿酒葫蘆敬濟公一杯；濟公籤。
// 場景座標跟正殿一樣是 360 × 645；SVG 裡的 id 都加 j 前綴，避免跟其他殿的 SVG 撞名。
import bgUrl from './assets/ji/ji-bg.webp';
import festUrl from './assets/ji/ji-festival.webp';
import fanUrl from './assets/ji/fan.webp';
import gourdUrl from './assets/ji/gourd.webp';
import cupUrl from './assets/ji/cup.webp';
import { makePourer } from './pour.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 文字內容（原創） ---------- */
export const JI_QIAN = [
  { no: 1, level: '上吉', title: '放下', poem: ['破扇一搧煩惱飛', '鞋兒破了照樣追', '心頭若是不掛事', '天天都是好光輝'],
    gist: '讓你睡不著的事，十年後多半想不起來。先放下，明天再處理。', tip: '把今天最煩的一件事寫在紙上，然後揉掉丟進垃圾桶。' },
  { no: 2, level: '中吉', title: '吃飯', poem: ['餓了吃飯睏了眠', '何必天天想明天', '肚子飽了心就寬', '煩惱自己會變淺'],
    gist: '很多煩躁其實是餓了、累了。先照顧好身體再說。', tip: '今天好好吃一頓熱的，不要邊吃邊滑手機。' },
  { no: 3, level: '上上', title: '笑看', poem: ['人家笑我太瘋癲', '我笑人家看不穿', '自己開心最要緊', '別人眼光風一般'],
    gist: '不用活成別人期待的樣子。你開心、不傷人，就好。', tip: '做一件你一直想做、但怕別人覺得奇怪的小事。' },
  { no: 4, level: '中平', title: '慢走', poem: ['急急忙忙往前衝', '鞋掉了都不知道', '停下來喝一口酒', '路還在那沒跑掉'],
    gist: '最近太趕了。慢一點不會怎樣，路不會跑掉。', tip: '今天出門走路，刻意放慢一半速度。' },
  { no: 5, level: '上吉', title: '善心', poem: ['一碗熱粥給人家', '自己肚裡也開花', '幫人不必敲鑼鼓', '好心總會回到家'],
    gist: '默默做的好事，最後都會用另一種方式回來。', tip: '今天幫一個人一個小忙，不用說出來。' },
  { no: 6, level: '中吉', title: '裝傻', poem: ['聰明人兒爭不休', '傻子坐著曬日頭', '有些話聽過就算', '吵贏了也沒甜頭'],
    gist: '不是每場架都要吵贏。有些事裝傻，反而比較快樂。', tip: '下次想反駁別人時，先數到五再決定要不要說。' },
  { no: 7, level: '中平', title: '自嘲', poem: ['跌了一跤笑一聲', '拍拍屁股又前行', '會笑自己的人哪', '天塌下來也不驚'],
    gist: '搞砸了沒關係，能笑著說出來，就已經走過去一半了。', tip: '把最近一件糗事，用好笑的方式講給朋友聽。' },
  { no: 8, level: '上上', title: '自在', poem: ['破帽破扇破袈裟', '走遍天涯都是家', '身上沒有多的東西', '心裡反而開滿花'],
    gist: '擁有的少一點，心反而輕一點。斷捨離也是修行。', tip: '今天丟掉或送出三樣用不到的東西。' },
];

const GREET = [
  '濟公搖搖破扇：「哎呀，愁眉苦臉幹嘛？來來來，煩惱寫給我。」',
  '濟公打了個嗝：「酒肉穿腸過，佛祖心中留。你呢，心裡留了什麼？」',
  '濟公笑嘻嘻：「鞋破帽破身也破，你笑我來我笑你。」',
  '濟公伸個懶腰：「天塌下來有高個子頂著，先睡飽再說。」',
];
const AFTER = [
  '濟公把扇子一收：「看吧，搧一搧就沒了。煩惱是紙做的，你自己把它想成石頭。」',
  '濟公哈哈大笑：「飛走啦飛走啦！明天它要是又回來，再來找我搧。」',
  '濟公眨眨眼：「這種小事也值得煩？走走走，吃飯去。」',
  '濟公拍拍你的肩：「事情還是要做，但心不用跟著揪成一團。」',
];
const NAMES = ['一', '二', '三', '四', '五', '六', '七', '八'];

/* ---------- 場景 ---------- */
// 參考點：濟公臉 (180,290)、供桌桌面 y≈378、拜墊中心 (184,525)
const CUP = [204, 352, 34]; // 酒杯：x、y、寬
const RIM = [CUP[0] + 15.5, CUP[1] + 6]; // 杯口
const GOURD_REST = [62, 588];
const GOURD_SPOUT = [4, -23];
const GOURD_ANG = -115;
const GOURD_POUR = (() => { // 葫蘆嘴剛好在杯口上方 26
  const a = GOURD_ANG * Math.PI / 180, [sx, sy] = GOURD_SPOUT;
  return [RIM[0] - (sx * Math.cos(a) - sy * Math.sin(a)), RIM[1] - 26 - (sx * Math.sin(a) + sy * Math.cos(a))];
})();
const FAN_REST = [300, 565];
export const JI_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="濟公堂" class="ji-svg">
  <defs>
    <filter id="jLit" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="1 .03 0 0 .01  .02 .93 0 0 0  .01 .02 .85 0 0  0 0 0 1 0"/>
    </filter>
    <radialGradient id="jContact"><stop offset="0" stop-color="#2A140A" stop-opacity=".55"/><stop offset="1" stop-color="#2A140A" stop-opacity="0"/></radialGradient>
    <radialGradient id="jHalo"><stop offset="0" stop-color="#FFF3C8" stop-opacity=".95"/><stop offset=".6" stop-color="#FFC36B" stop-opacity=".35"/><stop offset="1" stop-color="#FFC36B" stop-opacity="0"/></radialGradient>
  </defs>
  <image id="jBg" href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice" style="display:none"/>
  <circle id="jHaloC" cx="180" cy="300" r="56" fill="url(#jHalo)" opacity=".15" style="mix-blend-mode:screen"/>
  <rect class="hit" data-ji="deity" role="button" tabindex="0" aria-label="向濟公問安" x="142" y="255" width="78" height="105" rx="22" fill="transparent"/>

  <!-- 酒杯（供桌右側，一直都在；敬了酒才有酒） -->
  <image href="${cupUrl}" x="${CUP[0]}" y="${CUP[1]}" width="${CUP[2]}" height="${CUP[2]}" filter="url(#jLit)"/>
  <ellipse id="jWine" cx="${RIM[0]}" cy="${RIM[1] + 1.5}" rx="11" ry="3" fill="#D8892E" opacity="0"/>

  <!-- 煩惱字（寫了才出現） -->
  <g id="jWords" pointer-events="none"></g>

  <!-- 酒葫蘆（拜墊左前方，可以拿起來倒） -->
  <ellipse id="jGourdShadow" cx="${GOURD_REST[0]}" cy="${GOURD_REST[1] + 24}" rx="20" ry="4" fill="url(#jContact)"/>
  <g id="jGourd" class="ji-prop" data-ji="gourd" role="button" tabindex="0" aria-label="酒葫蘆">
    <g id="jGourdTilt"><image href="${gourdUrl}" x="-20" y="-24.5" width="40" height="49" filter="url(#jLit)"/></g>
  </g>

  <!-- 破扇（拜墊右前方，可以拿起來搧） -->
  <ellipse id="jFanShadow" cx="${FAN_REST[0]}" cy="${FAN_REST[1] + 30}" rx="22" ry="4" fill="url(#jContact)"/>
  <g id="jFan" class="ji-prop" data-ji="fan" role="button" tabindex="0" aria-label="破扇" transform="translate(${FAN_REST[0]} ${FAN_REST[1]})">
    <g id="jFanTilt"><image href="${fanUrl}" x="-26" y="-31" width="52" height="62" filter="url(#jLit)"/></g>
  </g>
</svg>`;

export function initJigong(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc } = api;
  const host = $('#jiHost');
  host.innerHTML = JI_SVG(bgUrl);
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const ji = state.ji || (state.ji = { fanned: 0, fanDay: '', wineDay: '', qian: null });
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };

  /* ----- 濟公問安 ----- */
  function greetGod() {
    S('jHaloC').setAttribute('opacity', '.7'); setTimeout(() => S('jHaloC').setAttribute('opacity', '.15'), 1400);
    burst('spark', 180, 295, reduce ? 3 : 10);
    say(GREET[Math.floor(Math.random() * GREET.length)], 'god');
  }

  /* ----- 敬一杯 ----- */
  const wine = S('jWine');
  const poured = () => ji.wineDay === dayKey();
  const paintWine = () => wine.setAttribute('opacity', poured() ? '.95' : '0');
  paintWine();
  const gourd = makePourer({
    svg, el: S('jGourd'), tilt: S('jGourdTilt'), shadow: S('jGourdShadow'), sfx, emit,
    rest: GOURD_REST, pourAt: GOURD_POUR, spout: GOURD_SPOUT, angle: GOURD_ANG, drop: { color: '#E8A23A' },
    isDone: poured,
    onDone() {
      ji.wineDay = dayKey(); save(); paintWine();
      sfx.chime(); sfx.buzz([15, 40, 15]);
      burst('spark', RIM[0], RIM[1], reduce ? 3 : 10);
      say('酒倒好了。濟公鼻子先動了一下，眼睛都還沒睜開就笑了：「好酒！這杯我記在你帳上，保佑你今天順順的。」', 'god');
    },
    onTap: () => (poured() ? say('今天已經敬過一杯了，濟公說再喝就要醉倒在供桌上了。') : say('按住左下角的<b>酒葫蘆</b>，拿到供桌右邊的小酒杯上面，就會自己倒酒。', 'god')),
  });

  /* ----- 搧煩惱 ----- */
  const wordsG = S('jWords');
  let words = []; // { el, x, y, vx, vy, r, vr, gone, a }
  function placeWords(text) {
    wordsG.innerHTML = ''; words = [];
    const chars = [...text].filter((c) => c.trim());
    const n = chars.length, per = n > 8 ? Math.ceil(n / 2) : n;
    chars.forEach((c, i) => {
      const row = Math.floor(i / per), col = i % per, cnt = Math.min(per, n - row * per);
      const x = 180 + (col - (cnt - 1) / 2) * Math.min(26, 230 / cnt) + (Math.random() - .5) * 4;
      const y = (n > 8 ? 300 : 318) + row * 34 + (Math.random() - .5) * 6;
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      el.setAttribute('class', 'ji-word'); el.setAttribute('text-anchor', 'middle');
      el.textContent = c; wordsG.appendChild(el);
      words.push({ el, x, y, vx: 0, vy: 0, r: (Math.random() - .5) * 10, vr: 0, gone: false, a: 1, bob: Math.random() * 6 });
    });
    paintWords(0);
  }
  function paintWords(t) {
    for (const w of words) {
      const by = w.gone ? 0 : Math.sin(t / 600 + w.bob) * 2;
      w.el.setAttribute('transform', `translate(${w.x.toFixed(1)} ${(w.y + by).toFixed(1)}) rotate(${w.r.toFixed(1)})`);
      w.el.setAttribute('opacity', w.a.toFixed(2));
    }
  }
  let wordAnim = 0, lastW = 0;
  function wordLoop(t) {
    const dt = lastW ? Math.min(.05, (t - lastW) / 1000) : .016; lastW = t;
    for (const w of words) {
      if (!w.gone) continue;
      w.x += w.vx * dt; w.y += w.vy * dt; w.vy -= 30 * dt; w.r += w.vr * dt; w.a = Math.max(0, w.a - dt * .9);
    }
    paintWords(t);
    words = words.filter((w) => { if (w.gone && w.a <= 0) { w.el.remove(); return false; } return true; });
    if (words.length) wordAnim = requestAnimationFrame(wordLoop); else { wordAnim = 0; lastW = 0; }
  }
  const kickWords = () => { if (!wordAnim) { lastW = 0; wordAnim = requestAnimationFrame(wordLoop); } };
  function blow(fx, fy, vx, vy) {
    const sp = Math.hypot(vx, vy);
    let hit = false;
    for (const w of words) {
      if (w.gone || Math.hypot(w.x - fx, w.y - fy) > 44) continue;
      const k = Math.max(1, 420 / Math.max(sp, 1));
      w.gone = true; hit = true;
      w.vx = vx * k * .9 + (Math.random() - .5) * 60; w.vy = vy * k * .9 - 40 - Math.random() * 40; w.vr = (Math.random() - .5) * 720;
      emit('spark', w.x, w.y);
    }
    if (hit) { sfx.pop(); kickWords(); if (words.every((w) => w.gone)) allGone(); }
  }
  function allGone() {
    ji.fanned++; ji.fanDay = dayKey(); save();
    setTimeout(() => {
      sfx.chime(); sfx.buzz([15, 50, 15]);
      burst('spark', 180, 300, reduce ? 4 : 14);
      emit('text', 180, 250, { text: '煩惱飛走了', color: '#FFE6B0', life: 1.8, vy: -24 });
      say(AFTER[Math.floor(Math.random() * AFTER.length)], 'god');
    }, 500);
  }
  function openWorry() {
    const body = openSheet('寫下煩惱', `
      <p>把現在心裡最煩的事寫成一句話。寫完它會飄在供桌前，拿濟公的破扇把字<b>一個一個搧走</b>。</p>
      <textarea id="jWorry" class="yue-wish" maxlength="16" rows="2" placeholder="例如：報告寫不完、主管好煩"></textarea>
      <p class="hint">只存在這一下，搧走就沒了，不會記下來。</p>
      <div class="row"><button class="btn" id="jGo">寫好了</button></div>`);
    const ta = body.querySelector('#jWorry');
    setTimeout(() => ta.focus(), 50);
    body.querySelector('#jGo').addEventListener('click', () => {
      const t = ta.value.trim().replace(/\s+/g, '');
      if (!t) { ta.focus(); return; }
      closeSheet(); placeWords(t); kickWords(); sfx.knock();
      say('煩惱飄在供桌前了。按住右下角的<b>破扇</b>，在字上面用力<b>左右搧</b>，把它們搧走！', 'god');
    });
  }

  /* ----- 破扇：拿起來，在字上面揮 ----- */
  const fan = S('jFan'), fanTilt = S('jFanTilt'), fanShadow = S('jFanShadow');
  let fanPos = [...FAN_REST], fdrag = null;
  const placeFan = (ang = 0) => {
    fan.setAttribute('transform', `translate(${fanPos[0].toFixed(1)} ${fanPos[1].toFixed(1)})`);
    fanTilt.setAttribute('transform', `rotate(${ang.toFixed(1)})`);
    fanShadow.style.display = Math.hypot(fanPos[0] - FAN_REST[0], fanPos[1] - FAN_REST[1]) > 2 ? 'none' : '';
  };
  const fanHome = () => {
    const from = [...fanPos], t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 380), e = 1 - Math.pow(1 - k, 3); fanPos = [from[0] + (FAN_REST[0] - from[0]) * e, from[1] + (FAN_REST[1] - from[1]) * e]; placeFan(0); if (k < 1 && !fdrag) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const fanHint = () => (words.some((w) => !w.gone) ? say('拿著扇子在字上面<b>左右快快地搧</b>，太慢搧不動喔。', 'god') : openWorry());
  fan.addEventListener('pointerdown', (e) => {
    e.preventDefault(); fan.setPointerCapture(e.pointerId);
    const p = pt(e); fdrag = { moved: false, x0: p.x, y0: p.y, lx: p.x, ly: p.y, lt: performance.now() };
    fan.classList.add('held'); sfx.pop();
  });
  fan.addEventListener('pointermove', (e) => {
    if (!fdrag) return;
    const p = pt(e), now = performance.now();
    if (Math.hypot(p.x - fdrag.x0, p.y - fdrag.y0) > 6) fdrag.moved = true;
    if (!fdrag.moved) return;
    const dt = Math.max(8, now - fdrag.lt) / 1000, vx = (p.x - fdrag.lx) / dt, vy = (p.y - fdrag.ly) / dt;
    fdrag.lx = p.x; fdrag.ly = p.y; fdrag.lt = now;
    fanPos = [Math.max(26, Math.min(334, p.x)), Math.max(60, Math.min(610, p.y - 40))];
    placeFan(Math.max(-35, Math.min(35, vx / 25)));
    if (Math.hypot(vx, vy) > 260) blow(fanPos[0], fanPos[1] - 10, vx, vy);
  });
  const fanUp = () => { if (!fdrag) return; const moved = fdrag.moved; fdrag = null; fan.classList.remove('held'); if (!moved) fanHint(); fanHome(); };
  fan.addEventListener('pointerup', fanUp);
  fan.addEventListener('pointercancel', fanUp);
  function autoFan() { // 按鈕／鍵盤：扇子自己飛過去左右搧
    if (!words.some((w) => !w.gone)) { openWorry(); return; }
    const t0 = performance.now(), ys = [...new Set(words.filter((w) => !w.gone).map((w) => Math.round(w.y)))];
    let px = 60, py = ys[0];
    const step = (t) => {
      const s = (t - t0) / 1000, i = Math.min(ys.length - 1, Math.floor(s / .7)), k = (s % .7) / .7;
      const x = 60 + 240 * (i % 2 ? 1 - k : k), y = ys[i] + 10;
      fanPos = [x, y]; placeFan((i % 2 ? -1 : 1) * 25);
      blow(x, y - 10, (x - px) * 60, (y - py) * 60 - 1); px = x; py = y;
      if (s < ys.length * .7 && words.some((w) => !w.gone)) requestAnimationFrame(step); else fanHome();
    };
    requestAnimationFrame(step);
  }
  fan.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); autoFan(); } });

  /* ----- 濟公籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!ji.qian || ji.qian.date !== t) { ji.qian = { date: t, no: 1 + Math.floor(Math.random() * JI_QIAN.length) }; save(); sfx.rattle(1); }
    const f = JI_QIAN.find((x) => x.no === ji.qian.no);
    openSheet(`濟公籤第${NAMES[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>濟公籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日放鬆小功課</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，濟公說：認真過日子，但別太認真看待煩惱。</p>`);
  }

  const ACTS = { worry: () => (words.some((w) => !w.gone) ? autoFan() : openWorry()), wine: () => gourd.auto(), qian: openQian };
  svg.addEventListener('click', (e) => { if (e.target.closest('[data-ji="deity"]')) greetGod(); });
  svg.querySelector('[data-ji="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#jiBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-ji]'); if (b) ACTS[b.dataset.ji](); });

  return {
    enter() {
      paintWine(); gourd.place(); placeFan();
      say(!ji.fanned ? '歡迎來到濟公堂！先點燭、上香跟濟公打聲招呼。有煩惱就按「搧煩惱」寫下來，拿破扇把它搧走。'
        : ji.fanDay === dayKey() ? '又來啦？今天的煩惱已經搧走了，要不要敬濟公一杯，或抽支濟公籤？'
        : `歡迎回來，你已經搧走 ${ji.fanned} 次煩惱了。今天心裡有什麼卡卡的，寫下來搧掉吧。`, 'god');
    },
    setFestive(on) { S('jBg').setAttribute('href', on ? festUrl : bgUrl); },
    god: '濟公', qianName: '濟公籤', qianCount: JI_QIAN.length,
    hasQianToday: () => !!ji.qian && ji.qian.date === dayKey(),
    setQian(no) { ji.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

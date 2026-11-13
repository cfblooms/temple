// 關帝殿：把想戒掉的壞習慣寫在紙條上，拿青龍刀一刀斬斷，之後每天「守諾第 N 天」；翻春秋看一句義氣語錄；關帝籤。
// 場景座標跟正殿一樣是 360 × 645；SVG 裡的 id 都加 q 前綴，避免跟其他殿的 SVG 撞名。
import bgUrl from './assets/gg/gg-bg.webp';
import festUrl from './assets/gg/gg-festival.webp';
import bladeUrl from './assets/gg/blade.webp';
import stripUrl from './assets/gg/strip.webp';
import bookUrl from './assets/gg/book.webp';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 文字內容（原創） ---------- */
export const GG_QIAN = [
  { no: 1, level: '上上', title: '守信', poem: ['一諾說出重千金', '風吹雨打不改心', '答應的事做到了', '別人自然會相信'],
    gist: '說到做到，是你最大的本錢。信用累積起來，機會就來了。', tip: '今天把一件答應別人、還沒做的小事做完。' },
  { no: 2, level: '中吉', title: '義氣', poem: ['朋友有難伸隻手', '不問回報不回頭', '今天你幫的那個人', '明天會陪你喝酒'],
    gist: '真心對人，人也會真心對你。身邊的朋友是你的貴人。', tip: '主動關心一個最近比較安靜的朋友。' },
  { no: 3, level: '上吉', title: '專注', poem: ['青龍刀下不猶豫', '一刀一刀向前去', '工作也要這樣做', '心定事情就順利'],
    gist: '事業運不錯，但要專心。先把手上最重要的一件事做好。', tip: '今天上班前，寫下最重要的一件事，先做它。' },
  { no: 4, level: '中平', title: '忍耐', poem: ['過關斬將不簡單', '一關一關慢慢闖', '現在卡住別心慌', '撐過去就是好漢'],
    gist: '最近工作壓力大，卡關是正常的。穩住，不要衝動做決定。', tip: '生氣的時候先離開座位喝杯水，再回來處理。' },
  { no: 5, level: '上吉', title: '正直', poem: ['做人做事要堂堂', '不怕別人在背後講', '腳步站得正正的', '小人也拿你沒辦法'],
    gist: '有人在背後說話也不用怕。你站得正，時間會證明一切。', tip: '把該留的紀錄、信件好好整理，保護自己。' },
  { no: 6, level: '中吉', title: '斷捨', poem: ['該斷的事要斷乾淨', '拖拖拉拉最傷心', '一刀下去雖然痛', '從此天空一片晴'],
    gist: '有些人事物早就該放下了。下定決心，痛一下就過去。', tip: '取消一個你一直想退、卻還沒退的東西。' },
  { no: 7, level: '中平', title: '夜讀', poem: ['關公夜裡讀春秋', '一盞燈下看千秋', '多學一點不吃虧', '本事在身不用愁'],
    gist: '現在是充實自己的好時候。學到的東西，沒有人拿得走。', tip: '今天花二十分鐘學一個工作上用得到的新技能。' },
  { no: 8, level: '上上', title: '同心', poem: ['桃園三人結兄弟', '同心協力不分離', '團隊一起往前走', '再難的事也可以'],
    gist: '跟團隊合作會比單打獨鬥好。把功勞分出去，路會更寬。', tip: '今天公開謝謝一位幫過你的同事。' },
];
const BOOK = [
  '答應別人的事，就算沒人記得，你自己要記得。',
  '真正的勇氣，是知道會輸還是站在對的那一邊。',
  '朋友不在多，有一個肯在半夜接你電話的就夠了。',
  '寧可慢一點做對，也不要快一點做錯。',
  '戒掉一個壞習慣，比學會十個新技能還難，所以更值得驕傲。',
  '不貪不該拿的，晚上就睡得著。',
  '被人誤會的時候，先把事情做好，不用急著解釋。',
  '對比你弱的人客氣，對比你強的人不卑不亢。',
  '今天守住的一個小承諾，是明天大信用的開始。',
  '跌倒不丟臉，跌倒了不敢再站起來才可惜。',
];
const GREET = [
  '關老爺撫著長鬚：「有什麼事想要了斷？說出來，我幫你斬。」',
  '關老爺微微點頭：「做人，最要緊的是一個『信』字。」',
  '關老爺放下春秋：「你來了。最近工作還順嗎？」',
  '關老爺目光炯炯：「心裡正，就什麼都不用怕。」',
];
const NAMES = ['一', '二', '三', '四', '五', '六', '七', '八'];

/* ---------- 場景 ---------- */
// 參考點：關公臉 (180,285)、供桌桌面 y≈378、拜墊中心 (184,525)
const STRIP = [182, 318, 46, 108]; // 紙條中心 x、y、寬、高
const BLADE_REST = [300, 566];
const BLADE_TIP = [19, -30]; // 刀頭相對手拿的位置
export const GG_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="關帝殿" class="gg-svg">
  <defs>
    <filter id="qLit" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="1 .03 0 0 .01  .02 .93 0 0 0  .01 .02 .85 0 0  0 0 0 1 0"/>
    </filter>
    <radialGradient id="qContact"><stop offset="0" stop-color="#2A140A" stop-opacity=".55"/><stop offset="1" stop-color="#2A140A" stop-opacity="0"/></radialGradient>
    <radialGradient id="qHalo"><stop offset="0" stop-color="#FFF3C8" stop-opacity=".95"/><stop offset=".6" stop-color="#FFC36B" stop-opacity=".35"/><stop offset="1" stop-color="#FFC36B" stop-opacity="0"/></radialGradient>
    <clipPath id="qCutA"><polygon points="140,240 230,240 230,306 140,330"/></clipPath>
    <clipPath id="qCutB"><polygon points="140,330 230,306 230,400 140,400"/></clipPath>
  <g id="qStripArt">
    <image href="${stripUrl}" x="${STRIP[0] - STRIP[2] / 2}" y="${STRIP[1] - STRIP[3] / 2}" width="${STRIP[2]}" height="${STRIP[3]}"/>
    <text id="qStripText" class="gg-word" x="${STRIP[0]}" y="${STRIP[1] - 30}" text-anchor="middle"></text>
  </g>
  </defs>
  <image id="qBg" href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice" style="display:none"/>
  <circle id="qHaloC" cx="180" cy="290" r="58" fill="url(#qHalo)" opacity=".15" style="mix-blend-mode:screen"/>
  <rect class="hit" data-gg="deity" role="button" tabindex="0" aria-label="向關公問安" x="142" y="250" width="78" height="110" rx="22" fill="transparent"/>

  <!-- 紙條（寫了才出現）：整張、斬開後的上下兩半 -->
  <g id="qStrip" class="gg-strip" pointer-events="none" style="display:none"><use href="#qStripArt"/></g>
  <g id="qHalfA" style="display:none"><use href="#qStripArt" clip-path="url(#qCutA)"/></g>
  <g id="qHalfB" style="display:none"><use href="#qStripArt" clip-path="url(#qCutB)"/></g>

  <!-- 春秋（供桌左邊，點一下翻開） -->
  <image class="hit gg-book" data-gg="book" role="button" tabindex="0" aria-label="春秋，翻開看一句" href="${bookUrl}" x="122" y="348" width="40" height="37" filter="url(#qLit)"/>

  <!-- 青龍刀（拜墊右前方，拿起來往下一揮） -->
  <ellipse id="qBladeShadow" cx="${BLADE_REST[0]}" cy="${BLADE_REST[1] + 30}" rx="26" ry="4" fill="url(#qContact)"/>
  <g id="qBlade" class="gg-blade" data-gg="blade" role="button" tabindex="0" aria-label="青龍刀，拿起來往下斬" transform="translate(${BLADE_REST[0]} ${BLADE_REST[1]})">
    <g id="qBladeTilt"><rect x="-36" y="-40" width="72" height="80" fill="transparent"/><image href="${bladeUrl}" x="-34" y="-37" width="68" height="74" filter="url(#qLit)"/></g>
  </g>
</svg>`;

const daysSince = (key) => { const [y, m, d] = key.split('-').map(Number); return Math.round((new Date().setHours(0, 0, 0, 0) - new Date(y, m - 1, d).getTime()) / 864e5); };

export function initGuangong(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam } = api;
  const host = $('#ggHost');
  host.innerHTML = GG_SVG(bgUrl);
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const gg = state.gg || (state.gg = { vow: null, cuts: 0, qian: null });
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const vowDay = () => (gg.vow ? daysSince(gg.vow.start) + 1 : 0);

  function greetGod() {
    S('qHaloC').setAttribute('opacity', '.7'); setTimeout(() => S('qHaloC').setAttribute('opacity', '.15'), 1400);
    burst('spark', 180, 290, reduce ? 3 : 10);
    say(gg.vow ? `關老爺看了你一眼：「『${esc(gg.vow.text)}』，今天是守諾第 ${vowDay()} 天。我看著呢。」` : GREET[Math.floor(Math.random() * GREET.length)], 'god');
  }

  /* ----- 寫紙條 ----- */
  let pending = ''; // 還沒斬的紙條
  const showStrip = (on) => { S('qStrip').style.display = on ? '' : 'none'; };
  function setStripText(t) {
    const el = S('qStripText'); el.innerHTML = '';
    [...t].forEach((c, i) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'tspan'); s.setAttribute('x', STRIP[0]); s.setAttribute('y', STRIP[1] - 33 + i * 13.5); s.textContent = c; el.appendChild(s); });
  }
  function openVow() {
    const has = gg.vow;
    const body = openSheet(has ? '守諾中' : '寫下要斬斷的事', `
      ${has ? `<p>你正在戒「<b>${esc(gg.vow.text)}</b>」，今天是<b>守諾第 ${vowDay()} 天</b>。每天回來上香，就是跟關老爺報到。</p><p class="hint">破戒了也沒關係，誠實面對，再斬一次就好。</p>` : ''}
      <p>寫下想戒掉的壞習慣，或想切斷的爛事（最多 7 個字）。它會掛在供桌前，拿右下角的<b>青龍刀</b>往下一揮，一刀斬斷。</p>
      <input id="qVow" class="yue-wish" maxlength="7" placeholder="例如：熬夜滑手機、拖延">
      <div class="row"><button class="btn" id="qGo">${has ? '換一件，重新斬' : '寫好了'}</button></div>`);
    const inp = body.querySelector('#qVow');
    setTimeout(() => inp.focus(), 50);
    body.querySelector('#qGo').addEventListener('click', () => {
      const t = inp.value.trim().replace(/\s+/g, '');
      if (!t) { inp.focus(); return; }
      closeSheet(); pending = t; setStripText(t); showStrip(true); sfx.knock();
      say('紙條掛在供桌前了。按住右下角的<b>青龍刀</b>拿起來，對準紙條<b>用力往下一揮</b>！', 'god');
    });
  }

  /* ----- 斬 ----- */
  function cut() {
    if (!pending) return;
    const t = pending; pending = '';
    S('qStrip').style.display = 'none';
    const A = S('qHalfA'), B = S('qHalfB'); A.style.display = ''; B.style.display = '';
    sfx.knock(); sfx.buzz([30, 30, 60]); burst('spark', STRIP[0], STRIP[1], reduce ? 6 : 26);
    const t0 = performance.now();
    const step = (now) => {
      const s = (now - t0) / 1000, o = Math.max(0, 1 - s / 1.1).toFixed(2);
      A.setAttribute('transform', `translate(${-s * 40} ${-s * 30 + s * s * 140}) rotate(${-s * 40} ${STRIP[0]} ${STRIP[1]})`); A.setAttribute('opacity', o);
      B.setAttribute('transform', `translate(${s * 36} ${s * s * 200}) rotate(${s * 30} ${STRIP[0]} ${STRIP[1]})`); B.setAttribute('opacity', o);
      if (s < 1.1) requestAnimationFrame(step); else { A.style.display = 'none'; B.style.display = 'none'; A.removeAttribute('transform'); B.removeAttribute('transform'); }
    };
    requestAnimationFrame(step);
    gg.vow = { text: t, start: dayKey() }; gg.cuts++; save();
    emit('text', 182, 250, { text: '一刀兩斷', color: '#FFE08A', life: 1.8, vy: -24, size: 20 });
    setTimeout(() => {
      S('qHaloC').setAttribute('opacity', '.75'); setTimeout(() => S('qHaloC').setAttribute('opacity', '.15'), 1600);
      sfx.chime();
      say(`斬斷了！關老爺沉聲說：「『${esc(t)}』從今天起跟你一刀兩斷。」之後每天回來上香，就是<b>守諾第 N 天</b>。`, 'god');
      cam?.reset(900);
    }, 700);
  }

  /* ----- 青龍刀：拿起來，往下揮過紙條 ----- */
  const blade = S('qBlade'), tilt = S('qBladeTilt'), shadow = S('qBladeShadow');
  let pos = [...BLADE_REST], ang = 0, drag = null;
  const place = () => {
    blade.setAttribute('transform', `translate(${pos[0].toFixed(1)} ${pos[1].toFixed(1)})`);
    tilt.setAttribute('transform', `rotate(${ang.toFixed(1)})`);
    shadow.style.display = Math.hypot(pos[0] - BLADE_REST[0], pos[1] - BLADE_REST[1]) > 2 ? 'none' : '';
  };
  const tip = () => { const a = ang * Math.PI / 180; return [pos[0] + BLADE_TIP[0] * Math.cos(a) - BLADE_TIP[1] * Math.sin(a), pos[1] + BLADE_TIP[0] * Math.sin(a) + BLADE_TIP[1] * Math.cos(a)]; };
  const inStrip = ([x, y]) => Math.abs(x - STRIP[0]) < STRIP[2] / 2 + 10 && Math.abs(y - STRIP[1]) < STRIP[3] / 2;
  function home() {
    const from = [...pos], a0 = ang, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 380), e = 1 - Math.pow(1 - k, 3); pos = [from[0] + (BLADE_REST[0] - from[0]) * e, from[1] + (BLADE_REST[1] - from[1]) * e]; ang = a0 * (1 - e); place(); if (k < 1 && !drag) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  blade.addEventListener('pointerdown', (e) => {
    e.preventDefault(); blade.setPointerCapture(e.pointerId);
    const p = pt(e); drag = { moved: false, x0: p.x, y0: p.y, lx: p.x, ly: p.y, lt: performance.now(), above: false };
    blade.classList.add('held'); sfx.pop();
  });
  blade.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pt(e), now = performance.now();
    if (!drag.moved && Math.hypot(p.x - drag.x0, p.y - drag.y0) > 6) { drag.moved = true; if (pending) cam?.zoom(182, 360, 250); }
    if (!drag.moved) return;
    const dt = Math.max(8, now - drag.lt) / 1000, vy = (p.y - drag.ly) / dt, vx = (p.x - drag.lx) / dt;
    drag.lx = p.x; drag.ly = p.y; drag.lt = now;
    pos = [Math.max(26, Math.min(334, p.x)), Math.max(60, Math.min(610, p.y - 60))]; // 刀在手指上方
    ang = Math.max(-20, Math.min(60, vy / 30 + vx / 60)); // 往下揮刀會往前傾
    place();
    const tp = tip();
    if (tp[1] < STRIP[1] - 20) drag.above = true; // 先舉到紙條上方
    if (pending && drag.above && vy > 380 && inStrip(tp)) cut();
    if (vy > 380 && Math.random() < .4) emit('spark', tp[0], tp[1]);
  });
  const up = () => {
    if (!drag) return;
    const moved = drag.moved; drag = null; blade.classList.remove('held');
    if (!moved) bladeHint(); else if (pending) { cam?.reset(300); say('要先把刀<b>舉到紙條上面</b>，再<b>快快地往下</b>揮過紙條。'); }
    home();
  };
  blade.addEventListener('pointerup', up);
  blade.addEventListener('pointercancel', up);
  function bladeHint() {
    if (pending) say('按住青龍刀拿起來，<b>舉到紙條上方</b>，再<b>用力往下一揮</b>。', 'god');
    else openVow();
  }
  function autoCut() { // 按鈕／鍵盤：刀自己揮
    if (!pending) { openVow(); return; }
    cam?.zoom(182, 360, 250);
    const t0 = performance.now();
    const step = (t) => {
      const s = (t - t0) / 1000;
      if (s < .45) { const k = s / .45; pos = [BLADE_REST[0] + (STRIP[0] - 10 - BLADE_REST[0]) * k, BLADE_REST[1] + (STRIP[1] - 70 - BLADE_REST[1]) * k]; ang = -20 * k; }
      else { const k = Math.min(1, (s - .45) / .18); pos = [STRIP[0] - 10, STRIP[1] - 70 + 150 * k]; ang = -20 + 80 * k; if (k > .4) cut(); }
      place();
      if (s < .7) requestAnimationFrame(step); else home();
    };
    requestAnimationFrame(step);
  }
  blade.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); autoCut(); } });

  /* ----- 春秋 ----- */
  function openBook() {
    const d = new Date(), n = (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % BOOK.length;
    sfx.knock();
    openSheet('翻開春秋', `
      <p class="hint">關老爺夜讀春秋。今天翻到這一句：</p>
      <blockquote class="gg-quote">${BOOK[n]}</blockquote>
      ${gg.vow ? `<p>你正在戒「${esc(gg.vow.text)}」，今天是守諾第 <b>${vowDay()}</b> 天。</p>` : ''}
      <p class="hint">每天一句，明天再來翻。</p>`);
  }

  /* ----- 關帝籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!gg.qian || gg.qian.date !== t) { gg.qian = { date: t, no: 1 + Math.floor(Math.random() * GG_QIAN.length) }; save(); sfx.rattle(1); }
    const f = GG_QIAN.find((x) => x.no === gg.qian.no);
    openSheet(`關帝籤第${NAMES[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>關帝籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日事業小功課</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，關老爺說：路是自己一步一步走出來的。</p>`);
  }

  const ACTS = { cut: () => (pending ? autoCut() : openVow()), book: openBook, qian: openQian };
  svg.addEventListener('click', (e) => { if (e.target.closest('[data-gg="deity"]')) greetGod(); else if (e.target.closest('[data-gg="book"]')) openBook(); });
  svg.querySelector('[data-gg="book"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') openBook(); });
  svg.querySelector('[data-gg="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#ggBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-gg]'); if (b) ACTS[b.dataset.gg](); });

  return {
    enter() {
      place();
      say(gg.vow ? `歡迎回來。「${esc(gg.vow.text)}」，今天是<b>守諾第 ${vowDay()} 天</b>。上一炷香跟關老爺報到吧。`
        : '歡迎來到關帝殿！先點燭、上香。有想戒掉的壞習慣，按「斬斷」寫下來，拿青龍刀一刀斬斷它。', 'god');
    },
    setFestive(on) { S('qBg').setAttribute('href', on ? festUrl : bgUrl); },
    god: '關公', qianName: '關帝籤', qianCount: GG_QIAN.length,
    hasQianToday: () => !!gg.qian && gg.qian.date === dayKey(),
    setQian(no) { gg.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

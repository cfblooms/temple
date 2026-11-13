// 天公殿（凌霄寶殿）：玉皇大帝。
// 招牌動作一「敬天」：轉身面向天空，把三支香插進廟口的天公爐，再三拜，雲會一層層散開。
// 招牌動作二「上疏」：寫一張給天公的疏文，包在天公金裡，往天上一甩，化成金光送上天。
// 另有天公籤。場景座標 360 × 645；SVG 裡的 id 都加 k 前綴。
import { makeCarrier } from './carry.js';
import sticksUrl from './assets/sticks.webp';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// 生好的圖放進 src/assets/tg/ 就會自動換上（burner、gold、scroll）；沒有就用程式畫的暫代圖
const ART = import.meta.glob('./assets/tg/*.webp', { eager: true, import: 'default' });
const art = (k) => ART[`./assets/tg/${k}.webp`];

/* ---------- 文字內容（原創） ---------- */
export const TG_QIAN = [
  { no: 1, level: '上上', title: '天光', poem: ['天公伯仔目睭金', '好心好事攏看真', '今日認真做一項', '日頭會照你的門'],
    gist: '你默默做的好事，天都看在眼裡。繼續照自己的步調走就好。', tip: '今天把一件拖了很久的小事做完。' },
  { no: 2, level: '上吉', title: '憨人', poem: ['天公疼憨人一個', '算盤免打那麼多', '心直腳步踏實地', '福氣自己會來坐'],
    gist: '不用想太多、算太精，老實做人，福氣自然來。', tip: '今天少想一點「萬一」，先做再說。' },
  { no: 3, level: '中吉', title: '雲開', poem: ['烏雲蓋天莫驚惶', '風吹雲散見日光', '眼前歹勢一陣子', '轉個彎就是好康'],
    gist: '現在的卡關只是一陣子，再撐一下就會轉好。', tip: '寫下最近最煩的一件事，再寫一個你能做的小步驟。' },
  { no: 4, level: '中平', title: '守時', poem: ['天有四時照順序', '春耕秋收免著急', '種子埋落要等待', '時到花開自然齊'],
    gist: '事情有它的時間，急不來。現在是播種的時候。', tip: '今天替一個長期目標做十五分鐘。' },
  { no: 5, level: '上吉', title: '厚道', poem: ['頭頂三尺有神明', '做人厚道路就平', '一句好話送別人', '天公記你一筆情'],
    gist: '對人好一點，說話留餘地，好運會從人緣來。', tip: '今天真心稱讚一個人。' },
  { no: 6, level: '中吉', title: '平安', poem: ['出門平安返厝安', '三頓吃飽睏得飽', '大富大貴免強求', '一家健康上蓋好'],
    gist: '平安健康就是最大的福氣，今天先顧好身體。', tip: '今天早點睡，或傳訊息問候家人。' },
  { no: 7, level: '上上', title: '登高', poem: ['一步一步上天梯', '甘蔗倒吃節節甜', '今年苦過後來甜', '天公看你肯打拚'],
    gist: '越往後越甜。現在辛苦的路，是在往上走。', tip: '回頭看一年前的自己，找出一件已經進步的事。' },
  { no: 8, level: '中平', title: '敬天', poem: ['人在做來天在看', '莫因無人就放寬', '心內有天自有尺', '暗暝行路也心安'],
    gist: '沒人看的時候也照規矩來，心裡踏實，走夜路也不怕。', tip: '今天遵守一個只有你自己知道的小承諾。' },
];
const GREET = [
  '天公伯摸摸鬍子：「來了啊。天頂看得到你，免驚。」',
  '天公伯拿著玉笏點點頭：「心誠就好，供品不用多。」',
  '天公伯笑咪咪：「天公疼憨人，你老實打拚，我都知。」',
  '天公伯說：「抬頭看看天，煩惱就沒那麼大了。」',
];
const CATS = ['闔家平安', '身體健康', '工作順利', '學業進步', '心想事成'];
const NUMS = ['一', '二', '三', '四', '五', '六', '七', '八'];

/* ---------- 場景座標 ---------- */
const BURN = [180, 470]; // 天公爐爐口中心
const STICK_REST = [302, 604];
const SCROLL_REST = [62, 606];
const GATE = [180, 92]; // 南天門

// 暫代圖（程式畫的）。原點在底部中心。
const BURNER_SVG = `
  <path d="M-58 -14 L-70 70 L-56 70 L-44 0 Z M58 -14 L70 70 L56 70 L44 0 Z M-8 0 L-10 74 L10 74 L8 0 Z" fill="#7A5420"/>
  <ellipse cx="0" cy="-8" rx="74" ry="52" fill="#B8862E"/>
  <ellipse cx="0" cy="-14" rx="70" ry="44" fill="#D6A23E"/>
  <path d="M-62 -30 C-40 10 40 10 62 -30" stroke="#8A5E1E" stroke-width="3" fill="none" opacity=".6"/>
  <rect x="-30" y="-36" width="60" height="30" rx="5" fill="#9A2A20" stroke="#F3CF6A" stroke-width="2"/>
  <text x="0" y="-15" text-anchor="middle" class="tg-plate">天公爐</text>
  <path d="M-74 -54 c-18 -6 -22 -40 -6 -44 c8 -2 12 8 6 14 M74 -54 c18 -6 22 -40 6 -44 c-8 -2 -12 8 -6 14" stroke="#C8962E" stroke-width="9" fill="none" stroke-linecap="round"/>
  <ellipse cx="0" cy="-56" rx="70" ry="13" fill="#E8BC54"/>
  <ellipse cx="0" cy="-55" rx="60" ry="9" fill="#5A4030"/>
  <ellipse cx="0" cy="-54" rx="56" ry="7" fill="#9A8A78"/>`;
const SCROLL_SVG = `
  <rect x="-20" y="-50" width="40" height="50" rx="2" fill="#E8B83A" stroke="#B0303A" stroke-width="2"/>
  <rect x="-13" y="-42" width="26" height="26" fill="#F7D35A" stroke="#C88A20" stroke-width="1.2"/>
  <circle cx="0" cy="-29" r="7" fill="none" stroke="#C0392B" stroke-width="1.6"/>
  <rect x="-11" y="-54" width="22" height="46" rx="1" fill="#FFF3C2" opacity=".0"/>
  <path d="M-20 -14 h40" stroke="#B0303A" stroke-width="3"/>`;

const cloud = (x, y, s, o = .92) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><ellipse cx="0" cy="0" rx="46" ry="18" fill="#FFF8EE"/><circle cx="-20" cy="-8" r="18" fill="#FFF8EE"/><circle cx="8" cy="-16" r="22" fill="#FFF8EE"/><circle cx="30" cy="-4" r="15" fill="#FFF8EE"/><ellipse cx="0" cy="8" rx="44" ry="8" fill="#F2D9C6" opacity=".7"/></g>`;

export const TG_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="凌霄寶殿" class="tg-svg">
  <defs>
    <radialGradient id="kHalo"><stop offset="0" stop-color="#FFF3C8" stop-opacity=".95"/><stop offset=".6" stop-color="#FFD36B" stop-opacity=".35"/><stop offset="1" stop-color="#FFD36B" stop-opacity="0"/></radialGradient>
    <linearGradient id="kSkyG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#25306E"/><stop offset=".38" stop-color="#6A5AA0"/><stop offset=".62" stop-color="#F2A27A"/><stop offset=".78" stop-color="#FFD9A0"/>
    </linearGradient>
    <linearGradient id="kBeamG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4C8" stop-opacity=".95"/><stop offset="1" stop-color="#FFE08A" stop-opacity="0"/></linearGradient>
    <linearGradient id="kFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B8A08A"/><stop offset="1" stop-color="#7A6250"/></linearGradient>
    <radialGradient id="kContact"><stop offset="0" stop-color="#1A0A12" stop-opacity=".55"/><stop offset="1" stop-color="#1A0A12" stop-opacity="0"/></radialGradient>
  </defs>
  <image id="kBg" href="${bg}" x="0" y="0" width="360" height="645" style="display:none"/>
  <circle transform="translate(182 380) scale(1.38) translate(-182 -380)" id="kHaloC" cx="182" cy="300" r="60" fill="url(#kHalo)" opacity=".12" style="mix-blend-mode:screen"/>
  <rect transform="translate(182 380) scale(1.38) translate(-182 -380)" class="hit" data-tg="deity" role="button" tabindex="0" aria-label="向天公伯問安" x="140" y="252" width="84" height="112" rx="22" fill="transparent"/>

  <!-- 敬天：轉身面向天空（廟口、天公爐） -->
  <g id="kSky" data-tg="sky" style="display:none">
    <rect width="360" height="645" fill="url(#kSkyG)"/>
    <g id="kStars" fill="#FFF6D0">${[[30, 40], [80, 22], [130, 60], [250, 30], [300, 64], [336, 20], [200, 18], [60, 110], [310, 120]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.2 : 1.8}" opacity=".8"/>`).join('')}</g>
    <g id="kGate" opacity=".18" transform="translate(${GATE[0]} ${GATE[1]})">
      <path d="M-60 10 L-60 -18 L60 -18 L60 10" fill="none" stroke="#FFE7A0" stroke-width="5"/>
      <path d="M-74 -18 Q0 -46 74 -18 Z" fill="#FFE7A0"/><path d="M-40 -30 Q0 -58 40 -30 Z" fill="#FFF3C8"/>
      <rect x="-14" y="-12" width="28" height="22" fill="#FFF3C8" opacity=".8"/>
    </g>
    <rect id="kBeam" x="130" y="0" width="100" height="470" fill="url(#kBeamG)" opacity="0" style="mix-blend-mode:screen"/>
    <g id="kCloudL">${cloud(70, 120, 1.25)}${cloud(30, 205, 1)}${cloud(120, 260, .9, .85)}${cloud(60, 310, 1.1, .8)}</g>
    <g id="kCloudR">${cloud(290, 110, 1.2)}${cloud(330, 200, 1.05)}${cloud(235, 250, .95, .85)}${cloud(300, 300, 1.1, .8)}</g>
    <!-- 廟口屋簷 -->
    <path d="M0 0 H360 V30 Q300 52 180 44 Q60 52 0 30 Z" fill="#7A1E1A"/>
    <path d="M0 30 Q60 52 180 44 Q300 52 360 30 V40 Q300 62 180 54 Q60 62 0 40 Z" fill="#C8962E"/>
    ${[18, 54, 90, 126, 162, 198, 234, 270, 306, 342].map((x) => `<rect x="${x - 4}" y="0" width="8" height="${38 + Math.abs(180 - x) * -.04}" fill="#5A1410" opacity=".5"/>`).join('')}
    <!-- 廟埕地面、欄杆 -->
    <path d="M0 520 H360 V645 H0 Z" fill="url(#kFloor)"/>
    <path d="M0 520 H360" stroke="#E8D2B0" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${i * 60 - 30} 645 L${180 + (i - 3) * 22} 520" stroke="#6A5444" stroke-width="1.2" opacity=".5"/>`).join('')}
    <rect x="0" y="500" width="360" height="8" fill="#9A7A60"/>${[20, 70, 120, 240, 290, 340].map((x) => `<rect x="${x - 4}" y="480" width="8" height="40" fill="#A88A70"/>`).join('')}
    <rect x="0" y="480" width="360" height="5" fill="#B89A80"/>
    <!-- 天公爐（香插進爐口） -->
    <ellipse cx="${BURN[0]}" cy="${BURN[1] + 80}" rx="86" ry="10" fill="url(#kContact)"/>
    <rect x="${BURN[0] - 44}" y="${BURN[1] + 66}" width="88" height="22" rx="4" fill="#5A2A1E"/>
    <g id="kBurner" transform="translate(${BURN[0]} ${BURN[1] + 66})">
      ${art('burner') ? `<image href="${art('burner')}" x="-90" y="-150" width="180" height="150"/>` : `<g transform="translate(0 -70)">${BURNER_SVG}</g>`}
    </g>
    <g id="kPlanted" style="display:none">
      ${[-10, 0, 10].map((dx, i) => `<line x1="${BURN[0] + dx}" y1="${BURN[1] - 6}" x2="${BURN[0] + dx * 2.2}" y2="${BURN[1] - 66}" stroke="#7A3A1A" stroke-width="2.4" stroke-linecap="round"/><circle cx="${BURN[0] + dx * 2.2}" cy="${BURN[1] - 66}" r="2.2" fill="#FF7A3A"/>`).join('')}
    </g>
    <circle id="kRing" cx="${BURN[0]}" cy="${BURN[1] - 6}" r="30" fill="none" stroke="#FFE08A" stroke-width="2.4" stroke-dasharray="6 4" opacity="0"/>

    <!-- 三支香 -->
    <g id="kSticks" class="tg-prop" data-tg="sticks" role="button" tabindex="0" aria-label="三支香，插進天公爐" style="display:none" transform="translate(${STICK_REST[0]} ${STICK_REST[1]})">
      <ellipse cx="0" cy="2" rx="16" ry="3" fill="url(#kContact)"/>
      <image href="${sticksUrl}" x="-22" y="-86" width="44" height="88"/>
    </g>
    <!-- 疏文（包在天公金裡） -->
    <g id="kScroll" class="tg-prop" data-tg="scroll" role="button" tabindex="0" aria-label="疏文，往上甩送上天" style="display:none" transform="translate(${SCROLL_REST[0]} ${SCROLL_REST[1]})">
      <ellipse cx="0" cy="2" rx="22" ry="4" fill="url(#kContact)"/>
      ${art('gold') ? `<image href="${art('gold')}" x="-32" y="-58" width="64" height="58"/>` : `<g transform="translate(0 0)">${SCROLL_SVG}</g>`}
      ${art('scroll') ? `<image href="${art('scroll')}" x="-14" y="-74" width="28" height="56"/>` : ''}
    </g>

    <!-- 拜（三拜） -->
    <g id="kBow" class="tg-btn" data-tg="bow" role="button" tabindex="0" aria-label="拜" style="display:none" transform="translate(180 598)">
      <circle r="30" fill="#B0303A" stroke="#FFE08A" stroke-width="3"/>
      <text y="9" text-anchor="middle" class="tg-bow">拜</text>
      <text id="kBowN" y="50" text-anchor="middle" class="tg-small">0 / 3</text>
    </g>
    <g class="tg-btn" data-tg="back" role="button" tabindex="0" aria-label="轉回殿裡" transform="translate(52 82)">
      <rect x="-40" y="-16" width="80" height="32" rx="16" fill="#FFF6E4" opacity=".92" stroke="#B0303A" stroke-width="1.5"/>
      <text y="5" text-anchor="middle" class="tg-back">↩ 回殿裡</text>
    </g>
  </g>
</svg>`;

export function initTiangong(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam } = api;
  const host = $('#tgHost');
  host.innerHTML = TG_SVG('');
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const tg = state.tg || (state.tg = { jing: '', days: 0, shu: [], qian: null });
  if (!Array.isArray(tg.shu)) tg.shu = [];
  const jingToday = () => tg.jing === dayKey();
  const shuToday = () => tg.shu.some((x) => x.date === dayKey());

  function greetGod() {
    S('kHaloC').setAttribute('opacity', '.7'); setTimeout(() => S('kHaloC').setAttribute('opacity', '.12'), 1400);
    burst('spark', 182, 290, reduce ? 3 : 10);
    say(GREET[Math.floor(Math.random() * GREET.length)], 'god');
  }

  /* ----- 轉身面向天空 ----- */
  let mode = null; // 'jing' | 'shu' | null
  let bows = 0, smokeT = 0;
  const sky = S('kSky');
  function openSky(m) {
    mode = m; cam?.reset(0);
    sky.style.display = ''; sky.classList.remove('tg-turn'); void sky.getBoundingClientRect(); sky.classList.add('tg-turn');
    $('#tgBar').classList.add('tg-sky-on'); $('#sceneWrap').classList.add('tg-sky');
    S('kSticks').style.display = 'none'; S('kScroll').style.display = 'none'; S('kBow').style.display = 'none';
    partClouds(jingToday() ? 3 : 0, true);
    S('kPlanted').style.display = jingToday() ? '' : 'none';
    if (jingToday()) smoke(); else clearInterval(smokeT);
    sfx.bowl();
  }
  function closeSky(msg) {
    mode = null; clearInterval(smokeT); cam?.reset(0);
    sky.style.display = 'none'; $('#tgBar').classList.remove('tg-sky-on'); $('#sceneWrap').classList.remove('tg-sky');
    if (msg) say(msg, 'god');
  }
  function partClouds(n, instant) {
    const k = Math.min(3, n) / 3;
    for (const [id, dir] of [['kCloudL', -1], ['kCloudR', 1]]) {
      const el = S(id); el.style.transition = instant || reduce ? 'none' : 'transform 1.1s cubic-bezier(.3,.8,.3,1)';
      el.style.transform = `translate(${dir * 150 * k}px, ${-20 * k}px)`;
    }
    S('kGate').setAttribute('opacity', (.18 + .72 * k).toFixed(2));
    S('kBeam').setAttribute('opacity', n >= 3 ? '.85' : (.25 * k).toFixed(2));
  }
  function smoke() {
    clearInterval(smokeT);
    smokeT = setInterval(() => { if (mode) emit('smoke', BURN[0] + (Math.random() - .5) * 26, BURN[1] - 68); }, reduce ? 900 : 260);
  }

  /* ----- 敬天：三支香插天公爐，三拜 ----- */
  const sticks = S('kSticks');
  const stickCarrier = makeCarrier({
    svg, el: sticks, sfx, cam, ring: S('kRing'), lift: 70, radius: 34,
    rest: () => STICK_REST, target: () => [BURN[0], BURN[1] + 6], zoom: () => [BURN[0], BURN[1] - 60, 230],
    onTap: () => say('按住右下角的<b>三支香</b>拿起來，插進前面的<b>天公爐</b>。', 'god'),
    onDrop() {
      sticks.style.display = 'none'; S('kPlanted').style.display = ''; smoke();
      sfx.pop(); sfx.buzz?.(20); burst('spark', BURN[0], BURN[1] - 60, reduce ? 3 : 12);
      bows = 0; S('kBowN').textContent = '0 / 3'; S('kBow').style.display = '';
      say('香插好了。面向天空，按「<b>拜</b>」三下：一拜天、二拜地、三拜自己的良心。', 'god');
      cam?.reset(900);
    },
  });
  function startJing() {
    openSky('jing');
    if (jingToday()) {
      say(`今天已經敬過天了，香還在天公爐裡燒著（敬天第 ${tg.days} 天）。可以按「上疏」寫一張給天公的疏文。`, 'god');
      return;
    }
    sticks.style.display = ''; stickCarrier.home();
    sticks.classList.remove('pop'); void sticks.getBoundingClientRect(); sticks.classList.add('pop');
    say('轉過身來，面向天空。拜天公要先拜廟口的<b>天公爐</b>：按住右下角的三支香，插進爐裡。', 'god');
  }
  const BOW_SAY = ['一拜天，謝謝天公伯照顧。', '二拜地，謝謝腳下這塊土地。', '三拜良心，凡事問心無愧。'];
  function bow() {
    if (mode !== 'jing' || bows >= 3) return;
    bows++; S('kBowN').textContent = `${bows} / 3`;
    sfx.knock(); sfx.buzz?.(18);
    // 鞠躬：畫面往下沉一下再回來
    if (!reduce) { cam?.zoom(180, 360, 340, 220); setTimeout(() => cam?.reset(0), 260); }
    partClouds(bows);
    burst('spark', 180, 260 - bows * 50, reduce ? 3 : 8);
    say(BOW_SAY[bows - 1], 'god');
    if (bows < 3) return;
    S('kBow').style.display = 'none';
    tg.jing = dayKey(); tg.days = (tg.days || 0) + 1; save();
    sfx.chime(); sfx.buzz?.([20, 50, 20, 50, 40]);
    const rain = (n) => { if (n <= 0 || mode !== 'jing') return; emit('spark', 40 + Math.random() * 280, 60 + Math.random() * 40); setTimeout(() => rain(n - 1), 50); };
    rain(reduce ? 6 : 36);
    emit('text', 180, 200, { text: `敬天第 ${tg.days} 天`, color: '#FFE08A', life: 2.4, vy: -16 });
    setTimeout(() => { if (mode === 'jing') say(`雲開了，南天門亮起來。天公伯收到你的心意了。${shuToday() ? '' : '有什麼想跟天公說的，可以按「<b>上疏</b>」寫下來。'}`, 'god'); }, 900);
  }

  /* ----- 上疏：寫疏文包天公金，往天上甩 ----- */
  const scroll = S('kScroll');
  let draft = null, sPos = [...SCROLL_REST], sDrag = null, flying = false;
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const placeScroll = (x, y, s = 1, r = 0) => { sPos = [x, y]; scroll.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${s.toFixed(3)})`); };
  function openShu() {
    if (shuToday()) {
      const mine = tg.shu.slice(-6).reverse();
      openSheet('給天公的疏文', `
        <p>今天的疏文已經送上天了。一天一張，明天再來寫。</p>
        <ul class="tg-list">${mine.map((x) => `<li><small>${esc(x.date)}</small><b>${esc(x.cat)}</b>${esc(x.name)}：${esc(x.wish || '')}</li>`).join('')}</ul>
        <p class="hint">傳統上疏文會跟天公金一起化掉，代表把心願呈給玉皇大帝。</p>`);
      return;
    }
    const body = openSheet('寫疏文給天公', `
      <p>疏文是寫給玉皇大帝的「信」。寫好會包進<b>天公金</b>，在廟口往天上一甩，化成金光送上天。</p>
      <div class="field"><span>想求什麼</span><div class="chips">${CATS.map((c, i) => `<button type="button" class="chip" data-c="${i}" aria-pressed="${i === 0}">${c}</button>`).join('')}</div></div>
      <input id="kName" class="yue-wish" maxlength="6" placeholder="你的名字（最多 6 個字）" value="${esc(state.name && state.name !== '香客' ? state.name : '')}">
      <input id="kWish" class="yue-wish" maxlength="24" placeholder="想跟天公說的一句話（可以不寫）">
      <div class="row"><button class="btn" id="kGo">寫好了，包進天公金</button></div>`);
    let cat = 0;
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      cat = +b.dataset.c; body.querySelectorAll('[data-c]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    body.querySelector('#kGo').addEventListener('click', () => {
      const name = body.querySelector('#kName').value.trim().replace(/\s+/g, ' ');
      if (!name) { body.querySelector('#kName').focus(); return; }
      draft = { cat: CATS[cat], name, wish: body.querySelector('#kWish').value.trim() };
      closeSheet(); openSky('shu');
      scroll.style.display = ''; placeScroll(...SCROLL_REST);
      scroll.classList.remove('pop'); void scroll.getBoundingClientRect(); scroll.classList.add('pop');
      sfx.pop();
      say('疏文包好了，在左下角。<b>按住它，往天上用力一甩</b>，放手讓它飛上去。', 'god');
    });
  }
  scroll.addEventListener('pointerdown', (e) => {
    if (flying || !draft) return;
    e.preventDefault(); scroll.setPointerCapture(e.pointerId);
    const p = pt(e); sDrag = { x0: p.x, y0: p.y, moved: false, hist: [[p.x, p.y, performance.now()]] };
    scroll.classList.add('held'); sfx.pop();
  });
  scroll.addEventListener('pointermove', (e) => {
    if (!sDrag) return;
    const p = pt(e), now = performance.now();
    sDrag.hist.push([p.x, p.y, now]); while (sDrag.hist.length > 6) sDrag.hist.shift();
    if (!sDrag.moved && Math.hypot(p.x - sDrag.x0, p.y - sDrag.y0) > 6) { sDrag.moved = true; cam?.zoom(120, 520, 280, 300); }
    if (!sDrag.moved) return;
    placeScroll(Math.max(30, Math.min(330, p.x)), Math.max(150, Math.min(620, p.y - 64)), 1.1); // 疏文浮在手指上方
  });
  const sUp = () => {
    if (!sDrag) return;
    const d = sDrag; sDrag = null; scroll.classList.remove('held');
    if (!d.moved) { say('按住疏文，<b>往上一甩</b>再放手。想讓它自己飛，可以再按一次下面的「上疏」。', 'god'); return; }
    const [a, b] = [d.hist[0], d.hist[d.hist.length - 1]], dt = Math.max(16, b[2] - a[2]);
    const vy = (b[1] - a[1]) / dt; // 每毫秒（往上是負的）
    if (vy < -0.35 && a[1] - b[1] > 24) { fly(); return; }
    cam?.reset(200);
    say('力道不夠，疏文掉回來了。再<b>快一點往上甩</b>。', 'god');
    tweenScroll(SCROLL_REST, 1, 360);
  };
  scroll.addEventListener('pointerup', sUp);
  scroll.addEventListener('pointercancel', sUp);
  scroll.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fly(); } });
  function tweenScroll(to, s1, ms, done, arc = 0) {
    const from = [...sPos], t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      placeScroll(from[0] + (to[0] - from[0]) * e + Math.sin(k * Math.PI * 2) * arc, from[1] + (to[1] - from[1]) * e, 1 + (s1 - 1) * e, Math.sin(k * 12) * arc * .4);
      if (k < 1) requestAnimationFrame(step); else done?.();
    };
    requestAnimationFrame(step);
  }
  function fly() {
    if (flying || !draft) return;
    flying = true; sfx.chime();
    cam?.zoom(180, 200, 300, 900); // 鏡頭跟著往上看
    let trail = setInterval(() => emit('spark', sPos[0], sPos[1] - 20), reduce ? 200 : 40);
    tweenScroll([GATE[0], GATE[1] + 30], .25, reduce ? 300 : 1300, () => {
      clearInterval(trail); scroll.style.display = 'none';
      burst('spark', GATE[0], GATE[1] + 10, reduce ? 4 : 26);
      S('kGate').setAttribute('opacity', '1'); S('kBeam').setAttribute('opacity', '.9');
      emit('text', 180, GATE[1] + 70, { text: '已呈凌霄寶殿', color: '#FFE08A', life: 2.4, vy: -10 });
      tg.shu.push({ date: dayKey(), ...draft }); if (tg.shu.length > 30) tg.shu.shift(); save();
      sfx.buzz?.([20, 40, 20]);
      say(`疏文化成金光，送上天了。「${esc(draft.name)}・${esc(draft.cat)}」天公伯收到了。${jingToday() ? '' : '下次可以先「<b>敬天</b>」插香三拜，再上疏。'}`, 'god');
      draft = null; flying = false;
      setTimeout(() => { if (mode === 'shu') { cam?.reset(0); partClouds(jingToday() ? 3 : 0); } }, 2200);
    }, 18);
  }
  function startShu() {
    if (draft) { if (mode !== 'shu') { openSky('shu'); scroll.style.display = ''; placeScroll(...SCROLL_REST); } else fly(); return; }
    openShu();
  }

  /* ----- 天公籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!tg.qian || tg.qian.date !== t) { tg.qian = { date: t, no: 1 + Math.floor(Math.random() * TG_QIAN.length) }; save(); sfx.rattle(1); }
    const f = TG_QIAN.find((x) => x.no === tg.qian.no);
    openSheet(`天公籤第${NUMS[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>天公籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日小功課</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，日子還是自己一步一步走出來的。</p>`);
  }

  const ACTS = { jing: () => (mode === 'jing' ? closeSky('轉回殿裡了。') : startJing()), shu: startShu };
  svg.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tg]'); if (!t) return;
    const k = t.dataset.tg;
    if (k === 'deity') greetGod();
    else if (k === 'bow') bow();
    else if (k === 'back') closeSky('轉回殿裡了。');
    else if (k === 'sticks' && e.detail === 0) stickCarrier.auto();
  });
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest('[data-tg]'); if (!t) return;
    const k = t.dataset.tg;
    if (k === 'deity') greetGod(); else if (k === 'bow') bow(); else if (k === 'back') closeSky('轉回殿裡了。'); else return;
    e.preventDefault();
  });
  $('#tgBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-tg]'); if (b) ACTS[b.dataset.tg](); });
  // 在天空畫面時按點燭、上香、擲筊、抽籤，先轉回殿裡
  $('#tgBar').addEventListener('click', (e) => { if (mode && e.target.closest('button[data-act]')) closeSky(); }, true);

  return {
    enter() {
      if (mode) closeSky();
      say(jingToday() ? `歡迎回來。今天已經敬過天了（敬天第 ${tg.days} 天）。可以抽天公籤，或寫疏文給天公。`
        : '歡迎來到凌霄寶殿，這裡拜的是玉皇大帝，大家叫祂「天公伯」。拜天公要先<b>敬天</b>：按「敬天」轉身面向天空，把香插進天公爐。', 'god');
    },
    leave() { if (mode) closeSky(); },
    god: '天公', qianName: '天公籤', qianCount: TG_QIAN.length,
    hasQianToday: () => !!tg.qian && tg.qian.date === dayKey(),
    setQian(no) { tg.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

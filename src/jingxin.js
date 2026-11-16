// 後院靜心閣：兩件安靜的事。
// 1. 抄經：選《心經》或《大悲咒》，每天描一段（毛筆筆尖浮在手指上方，寫的字不會被手指擋住），
//    抄滿一整部可以「迴向」給自己、家人、朋友或眾生。
// 2. 敲木魚：選一句佛號，跟著光圈的節拍敲，一下念一個字，念滿 7／21／108 聲。木魚元件在 muyu.js，法會也用同一個。
// 場景 360 × 645；SVG 裡的 id 都加 jx 前綴。
import { SUTRAS } from './sutras.js';
import { muyuSVG, strikeMuyu, makeChant } from './muyu.js';
import { reduce, sleep, tween, pick, daily, yesterdayKey } from './stall.js';

// 正式圖檔：有就自動換上（bg 背景、brush 毛筆、paper 抄經紙）
const ART = import.meta.glob('./assets/jx/*.webp', { eager: true, import: 'default' });
const BG = ART['./assets/jx/bg.webp'], BRUSH = ART['./assets/jx/brush.webp'], PAPER = ART['./assets/jx/paper.webp'];

const FONT = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';
const LIFT = 72; // 筆尖在手指上方幾個螢幕像素
const BOX = { x: 180, y: 318, s: 176 }; // 描字的田字格（中心、邊長）
const AV = { x: 180, base: 612, w: 140, h: 152 };
const DESK_MUYU = [262, 478], BIG_MUYU = [180, 470];

const CHANTS = [
  ['amtb', '南無阿彌陀佛', '念佛號，求心安、為家人祈福'],
  ['gy', '南無觀世音菩薩', '求觀音菩薩保佑平安、解憂'],
  ['sjmn', '南無本師釋迦牟尼佛', '感恩、讓心定下來'],
  ['om', '嗡嘛呢叭咪吽', '六字大明咒，觀音心咒'],
];
const GOALS = [7, 21, 108];
const SPEEDS = [['slow', '慢', 50], ['mid', '中', 64], ['fast', '快', 80]];
const WHO = [['self', '自己'], ['family', '家人'], ['friend', '朋友'], ['pet', '毛小孩'], ['late', '過世的親人'], ['all', '一切眾生']];
const WISH = {
  self: '身心安定，煩惱漸少，日日好眠', family: '身體健康，平安順遂，家和萬事興', friend: '心想事成，所求如願，平安喜樂',
  pet: '無病無痛，快樂自在，陪伴長久', late: '離苦得樂，往生善處，不再掛念', all: '離苦得樂，世界和平，人人心安',
};
const CALM = [
  '敲完坐一下，閉上眼睛，數十次呼吸再起來。',
  '今天如果有讓你生氣的人，試著在心裡跟他說一聲「祝你平安」。',
  '把手機放下五分鐘，看看窗外，聽聽周圍的聲音。',
  '喝一杯溫開水，慢慢喝完。',
];

const svgOf = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="後院靜心閣" class="stall-svg jx-svg" tabindex="0">
  <defs>
    <linearGradient id="jxWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E4A30"/><stop offset=".55" stop-color="#A0714A"/><stop offset="1" stop-color="#C9955E"/></linearGradient>
    <linearGradient id="jxFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D8B98A"/><stop offset="1" stop-color="#B8915E"/></linearGradient>
    <radialGradient id="jxMoon" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#FFF6DC"/><stop offset=".7" stop-color="#F6E2B0"/><stop offset="1" stop-color="#E8C88A"/></radialGradient>
    <radialGradient id="jxSun" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#FFF1C8" stop-opacity=".55"/><stop offset="1" stop-color="#FFF1C8" stop-opacity="0"/></radialGradient>
    <radialGradient id="jxShadow"><stop offset="0" stop-color="#2A0E06" stop-opacity=".45"/><stop offset="1" stop-color="#2A0E06" stop-opacity="0"/></radialGradient>
    <radialGradient id="jxDim" cx=".5" cy=".62" r=".75"><stop offset="0" stop-color="#140806" stop-opacity=".55"/><stop offset="1" stop-color="#140806" stop-opacity=".92"/></radialGradient>
    <pattern id="jxGrid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M0 0h44v44" fill="none" stroke="#A08060" stroke-width="1" opacity=".35"/></pattern>
  </defs>
  ${BG ? `<image href="${BG}" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>` : `
  <rect width="360" height="645" fill="url(#jxWall)"/>
  <rect y="430" width="360" height="215" fill="url(#jxFloor)"/><rect y="430" width="360" height="215" fill="url(#jxGrid)"/>
  <rect y="424" width="360" height="8" fill="#5A3A22"/>
  <!-- 月洞窗、竹子 -->
  <circle cx="180" cy="190" r="104" fill="#5A3A22"/><circle cx="180" cy="190" r="94" fill="url(#jxMoon)"/>
  <g stroke="#5E8E4A" stroke-width="5" stroke-linecap="round" opacity=".85">
    <path d="M128 290V110M146 290V130M226 290V96"/>
    <path d="M128 160l-26-14M128 200l22-16M146 170l24-10M226 140l-28-12M226 190l24-16" stroke-width="3"/>
  </g>
  <g fill="#7FB060" opacity=".85"><ellipse cx="100" cy="142" rx="14" ry="4" transform="rotate(-28 100 142)"/><ellipse cx="172" cy="158" rx="14" ry="4" transform="rotate(-18 172 158)"/><ellipse cx="196" cy="126" rx="14" ry="4" transform="rotate(24 196 126)"/><ellipse cx="252" cy="172" rx="14" ry="4" transform="rotate(-30 252 172)"/></g>
  <circle cx="180" cy="190" r="94" fill="none" stroke="#8A5A30" stroke-width="3"/>
  <!-- 掛軸 -->
  <rect x="20" y="70" width="50" height="190" rx="3" fill="#F4E8CF" stroke="#8A5A30" stroke-width="2"/><rect x="16" y="64" width="58" height="8" rx="4" fill="#5A3A22"/><rect x="16" y="258" width="58" height="8" rx="4" fill="#5A3A22"/>
  <text x="45" y="150" text-anchor="middle" class="jx-scroll">靜</text><text x="45" y="210" text-anchor="middle" class="jx-scroll" style="font-size:26px">心</text>
  <rect x="290" y="70" width="50" height="190" rx="3" fill="#F4E8CF" stroke="#8A5A30" stroke-width="2"/><rect x="286" y="64" width="58" height="8" rx="4" fill="#5A3A22"/><rect x="286" y="258" width="58" height="8" rx="4" fill="#5A3A22"/>
  <circle cx="315" cy="130" r="16" fill="none" stroke="#3B2A1E" stroke-width="4" stroke-dasharray="80 30" stroke-linecap="round"/>
  <text x="315" y="200" text-anchor="middle" class="jx-scroll" style="font-size:20px">自在</text>
  <polygon points="80,0 280,0 330,430 30,430" fill="url(#jxSun)"/>
  <!-- 矮桌 -->
  <rect x="36" y="440" width="288" height="16" rx="5" fill="#7A4A26"/><rect x="36" y="440" width="288" height="5" rx="2.5" fill="#A06A3A"/>
  <rect x="52" y="456" width="10" height="44" fill="#5A3418"/><rect x="298" y="456" width="10" height="44" fill="#5A3418"/>
  <!-- 小香爐 -->
  <path d="M168 440c0-12 4-18 12-18s12 6 12 18z" fill="#B88A3A"/><rect x="164" y="420" width="32" height="5" rx="2.5" fill="#D9AE52"/>
  <path d="M178 420v-34M182 420v-30" stroke="#B0603A" stroke-width="1.4"/><circle cx="178" cy="386" r="1.6" fill="#FF7A3A"/><circle cx="182" cy="390" r="1.6" fill="#FF7A3A"/>`}
  <!-- 桌上的抄經紙、筆架 -->
  <g id="jxDeskPaper" class="stall-prop" role="button" tabindex="0" aria-label="抄經紙，點了開始抄經">
    <rect x="58" y="420" width="76" height="24" rx="2" fill="#FBF4E2" stroke="#C9B48A" transform="skewX(-14) translate(104 0)"/>
    <path d="M78 428h42M76 434h40" stroke="#3B2A1E" stroke-width="1.4" opacity=".5" transform="skewX(-14) translate(104 0)"/>
    <path d="M70 438l26-34" stroke="#7A4A22" stroke-width="3.4" stroke-linecap="round"/><path d="M70 438l-4 5" stroke="#1A0A08" stroke-width="4" stroke-linecap="round"/>
    <text id="jxDeskTag" x="98" y="470" text-anchor="middle" class="xr-tag" style="fill:#FFF4E0">抄經</text>
  </g>
  <g id="jxDeskMuyuG" class="stall-prop" role="button" tabindex="0" aria-label="木魚，點了開始敲木魚">
    ${muyuSVG('jxSm', { x: DESK_MUYU[0], y: DESK_MUYU[1] - 34, s: .42 })}
    <text x="${DESK_MUYU[0]}" y="470" text-anchor="middle" class="xr-tag" style="fill:#FFF4E0">敲木魚</text>
  </g>
  <!-- 你 -->
  <ellipse cx="${AV.x}" cy="${AV.base}" rx="58" ry="9" fill="url(#jxShadow)"/>
  <ellipse cx="${AV.x}" cy="${AV.base - 4}" rx="52" ry="11" fill="#C8463A"/><ellipse cx="${AV.x}" cy="${AV.base - 7}" rx="44" ry="7" fill="#E0644E"/>
  <image id="jxMe" x="${AV.x - AV.w / 2}" y="${AV.base - AV.h}" width="${AV.w}" height="${AV.h}"/>

  <!-- ===== 抄經：大張紙 ===== -->
  <g id="jxTrace" style="display:none">
    <rect width="360" height="645" fill="#140806" opacity=".55"/>
    ${PAPER ? `<image href="${PAPER}" x="34" y="112" width="292" height="380" preserveAspectRatio="none"/>`
      : `<rect x="34" y="112" width="292" height="380" rx="6" fill="#FBF4E2" stroke="#C9B48A" stroke-width="2"/>
         <rect x="34" y="112" width="292" height="12" rx="6" fill="#8A5A30"/><rect x="34" y="480" width="292" height="12" rx="6" fill="#8A5A30"/>`}
    <text id="jxTitle" x="180" y="148" text-anchor="middle" class="jx-title"></text>
    <g id="jxLine"></g>
    <g transform="translate(${BOX.x - BOX.s / 2} ${BOX.y - BOX.s / 2})">
      <rect width="${BOX.s}" height="${BOX.s}" fill="#FFFDF6" stroke="#C8302A" stroke-width="2"/>
      <path d="M${BOX.s / 2} 0V${BOX.s}M0 ${BOX.s / 2}H${BOX.s}M0 0L${BOX.s} ${BOX.s}M${BOX.s} 0L0 ${BOX.s}" stroke="#C8302A" stroke-width="1" stroke-dasharray="5 5" opacity=".45"/>
    </g>
    <text id="jxGhost" x="${BOX.x}" y="${BOX.y}" text-anchor="middle" dominant-baseline="central" class="jx-ghost"></text>
    <path id="jxInk" d="" fill="none" stroke="#1E120C" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" opacity=".88"/>
    <text id="jxDone" x="${BOX.x}" y="${BOX.y}" text-anchor="middle" dominant-baseline="central" class="jx-done" opacity="0"></text>
    <rect x="${BOX.x - BOX.s / 2}" y="${BOX.y + BOX.s / 2 + 8}" width="${BOX.s}" height="5" rx="2.5" fill="#E8DCC4"/>
    <rect id="jxMeter" x="${BOX.x - BOX.s / 2}" y="${BOX.y + BOX.s / 2 + 8}" width="0" height="5" rx="2.5" fill="#C8302A"/>
    <text id="jxHint" x="180" y="466" text-anchor="middle" class="jx-hint">手指放在字的下方，毛筆尖在手指上面</text>
    <rect id="jxTraceHit" width="360" height="645" fill="transparent"/>
    <g id="jxBrush" pointer-events="none" style="display:none">
      ${BRUSH ? `<image href="${BRUSH}" x="-4" y="-74" width="64" height="78"/>`
        : `<path d="M0 0c-3-6-2-14 4-18l6 6c-2 7-6 11-10 12z" fill="#1E120C"/><path d="M4 -18l40 -48" stroke="#9A6A32" stroke-width="7" stroke-linecap="round"/><path d="M4 -18l7 -8" stroke="#C8302A" stroke-width="8" stroke-linecap="round"/><path d="M42 -63l4 -5" stroke="#3B2A1E" stroke-width="7" stroke-linecap="round"/>`}
    </g>
  </g>

  <!-- ===== 敲木魚 ===== -->
  <g id="jxChant" style="display:none">
    <rect width="360" height="645" fill="url(#jxDim)"/>
    <g id="jxBeads"></g>
    <text id="jxCount" x="180" y="196" text-anchor="middle" class="jx-count"></text>
    <g id="jxWords"></g>
    <ellipse id="jxGuide" cx="${BIG_MUYU[0]}" cy="${BIG_MUYU[1] - 62}" rx="80" ry="60" fill="none" stroke="#FFE08A" stroke-width="2.4" opacity="0"/>
    ${muyuSVG('jxBig', { x: BIG_MUYU[0], y: BIG_MUYU[1], s: 1.35 })}
    <text id="jxCue" x="180" y="540" text-anchor="middle" class="jx-cue">點畫面任何地方，敲一下開始</text>
    <rect id="jxTapHit" width="360" height="645" fill="transparent"/>
  </g>
</svg>`;

export function initJingxin(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, addFish, me } = api;
  const host = $('#jxHost');
  host.innerHTML = svgOf();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const jx = state.jx || (state.jx = {});
  jx.sutra ||= 'xin'; jx.pos ||= { xin: 0, dabei: 0 }; jx.copies ||= { xin: 0, dabei: 0 }; jx.pending ||= 0;
  jx.copy ||= {}; jx.muyu ||= {}; jx.sheng ||= 0; jx.dedic ||= [];
  let mode = 'idle';
  const desk = (on) => { for (const id of ['jxDeskPaper', 'jxDeskMuyuG']) S(id).style.display = on ? '' : 'none'; };

  function paintMe() {
    const c = me(); const w = AV.w * c.scale, h = AV.h * c.scale;
    const el = S('jxMe'); el.setAttribute('href', c.kneel);
    el.setAttribute('width', w); el.setAttribute('height', h); el.setAttribute('x', AV.x - w / 2); el.setAttribute('y', AV.base - h);
  }
  const svgAt = (cx, cy) => { const p = svg.createSVGPoint(); p.x = cx; p.y = cy; return p.matrixTransform(svg.getScreenCTM().inverse()); };

  /* ================= 抄經 ================= */
  const SU = () => SUTRAS[jx.sutra];
  let chars = [], ci = 0, strokes = [], cur = null;

  // 描得像不像：把字和筆跡各畫在小畫布上，算「字被蓋到幾成」和「筆跡有幾成在字上」
  const N = 96, K = N / BOX.s;
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const cx2 = cv.getContext('2d', { willReadFrequently: true });
  let glyph = null, near = null;
  function maskOf(draw) {
    cx2.clearRect(0, 0, N, N); cx2.fillStyle = cx2.strokeStyle = '#000'; draw();
    const d = cx2.getImageData(0, 0, N, N).data, m = new Uint8Array(N * N);
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
    return m;
  }
  function prepGlyph(ch) {
    const font = `900 ${Math.round(150 * K)}px ${FONT}`;
    const put = (stroke) => { cx2.font = font; cx2.textAlign = 'center'; cx2.textBaseline = 'middle'; if (stroke) { cx2.lineWidth = 22 * K; cx2.lineJoin = 'round'; cx2.strokeText(ch, N / 2, N / 2 + 2 * K); } cx2.fillText(ch, N / 2, N / 2 + 2 * K); };
    glyph = maskOf(() => put(false)); near = maskOf(() => put(true));
  }
  function score() {
    const ink = maskOf(() => {
      cx2.lineWidth = 15 * K; cx2.lineCap = cx2.lineJoin = 'round';
      for (const s of strokes) { if (!s.length) continue; cx2.beginPath(); s.forEach(([x, y], i) => (i ? cx2.lineTo(x * K, y * K) : cx2.moveTo(x * K, y * K))); if (s.length === 1) cx2.lineTo(s[0][0] * K + .1, s[0][1] * K); cx2.stroke(); }
    });
    let g = 0, gi = 0, ik = 0, ikn = 0;
    for (let i = 0; i < ink.length; i++) { if (glyph[i]) { g++; if (ink[i]) gi++; } if (ink[i]) { ik++; if (near[i]) ikn++; } }
    return { cover: g ? gi / g : 1, prec: ik ? ikn / ik : 0 };
  }

  function chooseSutra(after) {
    const body = openSheet('要抄哪一部？', `
      <p>每天抄一段就好，抄滿一整部可以<b>迴向</b>給想祝福的人。換一部經，原本的進度會留著。</p>
      <div class="jx-pick">${Object.entries(SUTRAS).map(([k, s]) => `<button type="button" class="jx-su${k === jx.sutra ? ' on' : ''}" data-su="${k}"><b>${s.name}</b><small>${s.full}・${s.segs.length} 段</small><small>${k === 'xin' ? '最常抄的經，講放下和不執著' : '觀世音菩薩的咒，求平安、消災'}</small><small>已抄 ${jx.pos[k]} / ${s.segs.length} 段${jx.copies[k] ? `・抄滿 ${jx.copies[k]} 部` : ''}</small></button>`).join('')}</div>`);
    body.querySelector('.jx-pick').addEventListener('click', (e) => {
      const b = e.target.closest('[data-su]'); if (!b) return;
      jx.sutra = b.dataset.su; save(); closeSheet(); after?.();
    });
  }

  function startTrace() {
    if (mode === 'chant') stopChant(false);
    if (!jx.picked) { jx.picked = true; save(); chooseSutra(startTrace); return; }
    const su = SU(), seg = su.segs[jx.pos[jx.sutra]];
    chars = [...seg.join('')]; ci = 0;
    mode = 'trace';
    desk(false); S('jxTrace').style.display = '';
    S('jxTitle').textContent = `${su.name}・第 ${jx.pos[jx.sutra] + 1} / ${su.segs.length} 段`;
    paintLine(); loadChar();
    cam?.zoom(180, 300, 300);
    sfx.bowl();
    say(`今天抄《${su.name}》這一段：「<b>${esc(seg.join('，'))}</b>」<br>照著淡淡的字描。<b>手指放在字的下面</b>，毛筆尖會在手指上方寫。`);
  }
  function paintLine() {
    const n = chars.length, gap = Math.min(24, 260 / n), x0 = 180 - (gap * (n - 1)) / 2;
    S('jxLine').innerHTML = chars.map((c, i) => `<text x="${(x0 + i * gap).toFixed(1)}" y="${i === ci ? 186 : 184}" text-anchor="middle" class="jx-small${i < ci ? ' done' : i === ci ? ' cur' : ''}" style="font-size:${Math.min(19, gap - 2)}px">${c}</text>`).join('')
      + `<rect x="${(x0 + ci * gap - gap / 2 + 1).toFixed(1)}" y="192" width="${(gap - 2).toFixed(1)}" height="2.4" rx="1.2" fill="#C8302A"/>`;
  }
  function loadChar() {
    const ch = chars[ci];
    strokes = []; cur = null; S('jxInk').setAttribute('d', ''); S('jxInk').setAttribute('opacity', '.88');
    S('jxGhost').textContent = ch; S('jxDone').textContent = ch; S('jxDone').setAttribute('opacity', '0');
    S('jxMeter').setAttribute('width', '0');
    prepGlyph(ch);
    S('jxBrush').style.display = 'none';
  }
  const local = (p) => [p.x - (BOX.x - BOX.s / 2), p.y - (BOX.y - BOX.s / 2)];
  const inBox = ([x, y]) => x > -6 && x < BOX.s + 6 && y > -6 && y < BOX.s + 6;
  const pathD = () => strokes.map((s) => 'M' + s.map(([x, y]) => `${(x + BOX.x - BOX.s / 2).toFixed(1)} ${(y + BOX.y - BOX.s / 2).toFixed(1)}`).join(' L')).join(' ');
  const tipOf = (e) => svgAt(e.clientX, e.clientY - LIFT);
  function placeBrush(p) { const b = S('jxBrush'); b.style.display = ''; b.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`); }
  let moves = 0, busy = false;
  const hit = S('jxTraceHit');
  hit.addEventListener('pointerdown', (e) => {
    if (mode !== 'trace' || busy) return;
    e.preventDefault(); hit.setPointerCapture(e.pointerId);
    const p = tipOf(e); placeBrush(p);
    const l = local(p); cur = inBox(l) ? [l] : []; strokes.push(cur);
    S('jxHint').style.display = 'none';
  });
  hit.addEventListener('pointermove', (e) => {
    if (mode !== 'trace' || !cur || busy) return;
    const p = tipOf(e); placeBrush(p);
    const l = local(p);
    if (!inBox(l)) { if (cur.length) { cur = []; strokes.push(cur); } return; }
    const last = cur[cur.length - 1];
    if (last && Math.hypot(l[0] - last[0], l[1] - last[1]) < 2.5) return;
    cur.push(l); S('jxInk').setAttribute('d', pathD());
    if (++moves % 8 === 0) { const s = score(); paintMeter(s); if (s.cover > .72 && s.prec > .55) charDone(); }
  });
  const up = () => {
    if (mode !== 'trace' || !cur) return;
    cur = null;
    const s = score(); paintMeter(s);
    if (s.cover >= .5 && s.prec >= .55) charDone();
    else if (s.prec < .4 && strokes.flat().length > 30) say('筆跡跑到字外面了，沿著淡淡的筆畫慢慢描。描錯沒關係，繼續描就好。');
  };
  hit.addEventListener('pointerup', up); hit.addEventListener('pointercancel', up);
  function paintMeter(s) { S('jxMeter').setAttribute('width', (BOX.s * Math.min(1, s.cover / .5) * (s.prec >= .55 ? 1 : .7)).toFixed(1)); }

  async function charDone() {
    if (busy) return;
    busy = true; cur = null; S('jxBrush').style.display = 'none';
    sfx.knock(); sfx.buzz([10]);
    S('jxMeter').setAttribute('width', BOX.s);
    await tween(reduce ? 60 : 380, (k) => { S('jxInk').setAttribute('opacity', (.88 * (1 - k)).toFixed(2)); S('jxDone').setAttribute('opacity', k.toFixed(2)); });
    if (!reduce) emit('spark', BOX.x + 50, BOX.y - 50);
    await sleep(reduce ? 60 : 260);
    ci++; busy = false;
    if (mode !== 'trace') return;
    if (ci >= chars.length) { segDone(); return; }
    paintLine(); loadChar();
  }
  function autoChar() { if (mode === 'trace' && !busy) charDone(); } // 鍵盤：直接寫好這個字

  function segDone() {
    const su = SU(), k = jx.sutra, seg = su.segs[jx.pos[k]];
    paintLine();
    const first = daily(jx.copy, dayKey(), yesterdayKey());
    if (first) addFish(1);
    jx.pos[k]++;
    let full = false;
    if (jx.pos[k] >= su.segs.length) { jx.pos[k] = 0; jx.copies[k]++; jx.pending++; (jx.pendSu ||= []).push(su.name); full = true; }
    save();
    sfx.chime(); burst('spark', 180, 300, reduce ? 4 : 18);
    mode = 'segdone';
    setTimeout(() => {
      closeTrace();
      if (full) { say(`《${su.name}》<b>整部抄滿了</b>！這是你抄滿的第 ${jx.copies[k]} 部。現在可以把這份功德<b>迴向</b>給想祝福的人。`, 'temple'); openDedicate(); return; }
      const left = su.segs.length - jx.pos[k];
      say(`這一段抄好了：「${esc(seg.join('，'))}」。${first ? `今天的抄經完成，已經連續 <b>${jx.copy.streak}</b> 天，虎爺叼來小魚乾 ×1。` : ''}<br>《${su.name}》還剩 ${left} 段，明天再來抄下一段；想多抄就再按「抄經」。`);
    }, reduce ? 200 : 1300);
  }
  function closeTrace() {
    S('jxTrace').style.display = 'none'; S('jxBrush').style.display = 'none'; S('jxHint').style.display = '';
    mode = 'idle'; busy = false; cam?.reset(); desk(true);
  }

  /* ================= 迴向 ================= */
  function openDedicate() {
    if (!jx.pending) {
      const su = SU(), left = su.segs.length - jx.pos[jx.sutra];
      say(`抄滿一整部經才能迴向。《${su.name}》還剩 <b>${left}</b> 段，每天一段，慢慢來。${jx.dedic.length ? '按「靜心紀錄」可以看之前的迴向。' : ''}`);
      return;
    }
    const body = openSheet('迴向', `
      <p>把抄經的功德，送給你想祝福的人。</p>
      <div class="field"><span>迴向給</span><div class="chips" id="jxWho">${WHO.map(([id, n], i) => `<button type="button" class="chip" data-w="${id}" aria-pressed="${i === 1}">${n}</button>`).join('')}</div></div>
      <input id="jxName" class="yue-wish" maxlength="8" placeholder="名字或稱呼（例如：阿嬤、小黑）">
      <input id="jxWish" class="yue-wish" maxlength="20" placeholder="想祝福什麼（可以不寫）">
      <div class="row"><button class="btn" id="jxGo">迴向</button></div>`);
    let who = 'family';
    body.addEventListener('click', (e) => {
      const w = e.target.closest('[data-w]'); if (!w) return;
      who = w.dataset.w; body.querySelectorAll('[data-w]').forEach((x) => x.setAttribute('aria-pressed', String(x === w)));
    });
    body.querySelector('#jxGo').addEventListener('click', () => {
      const label = WHO.find((x) => x[0] === who)[1];
      const name = body.querySelector('#jxName').value.trim() || (who === 'self' ? (state.name !== '香客' ? state.name : '我自己') : label);
      const wish = body.querySelector('#jxWish').value.trim() || WISH[who];
      const sutra = (jx.pendSu || []).shift() || SU().name;
      jx.pending--; jx.dedic.unshift({ date: dayKey(), who, name, wish, sutra }); jx.dedic = jx.dedic.slice(0, 30); save();
      closeSheet(); sfx.bowl(); burst('spark', 180, 200, reduce ? 4 : 24);
      openSheet('迴向文', `
        <div class="slip"><div class="slip-side"><span>迴向</span><span class="lv">安</span></div>
          <p class="poem"><span>願以此抄經功德</span><span>迴向${esc(name).slice(0, 8)}</span><span>${esc(wish).slice(0, 20)}</span></p></div>
        <p class="hint">抄的是《${sutra}》。迴向的心意最重要，想到他的時候，在心裡再說一次就好。</p>`);
      say(`你把《${sutra}》的功德迴向給<b>${esc(name)}</b>：「${esc(wish)}」。`, 'temple');
    });
  }

  /* ================= 敲木魚 ================= */
  let chant = null, words = [], wi = 0, count = 0, goal = 21, stats = { n: 0, p: 0, g: 0 }, lastHit = 0, crun = 0;
  function openChant() {
    if (mode === 'chant') { stopChant(true); return; }
    if (mode === 'trace') closeTrace();
    const last = jx.lastChant || {};
    const body = openSheet('敲木魚', `
      <p>跟著光圈的節拍敲，一下念一個字。不用急，敲錯拍也沒關係。</p>
      <div class="field"><span>念哪一句</span><div class="jx-pick">${CHANTS.map(([id, t, d]) => `<button type="button" class="jx-su${id === (last.id || 'amtb') ? ' on' : ''}" data-c="${id}"><b>${t}</b><small>${d}</small></button>`).join('')}</div></div>
      <div class="field"><span>念幾聲</span><div class="chips">${GOALS.map((g) => `<button type="button" class="chip" data-g="${g}" aria-pressed="${g === (last.goal || 21)}">${g} 聲</button>`).join('')}</div></div>
      <div class="field"><span>速度</span><div class="chips">${SPEEDS.map(([id, n]) => `<button type="button" class="chip" data-s="${id}" aria-pressed="${id === (last.speed || 'mid')}">${n}</button>`).join('')}</div></div>
      <div class="row"><button class="btn" id="jxStart">開始</button></div>`);
    let cid = last.id || 'amtb', g = last.goal || 21, sp = last.speed || 'mid';
    body.addEventListener('click', (e) => {
      const c = e.target.closest('[data-c]'), gg = e.target.closest('[data-g]'), s = e.target.closest('[data-s]');
      if (c) { cid = c.dataset.c; body.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x === c)); }
      if (gg) { g = +gg.dataset.g; body.querySelectorAll('[data-g]').forEach((x) => x.setAttribute('aria-pressed', String(x === gg))); }
      if (s) { sp = s.dataset.s; body.querySelectorAll('[data-s]').forEach((x) => x.setAttribute('aria-pressed', String(x === s))); }
    });
    body.querySelector('#jxStart').addEventListener('click', () => {
      jx.lastChant = { id: cid, goal: g, speed: sp }; save(); closeSheet();
      startChant(CHANTS.find((x) => x[0] === cid), g, SPEEDS.find((x) => x[0] === sp)[2]);
    });
  }
  function startChant([, text], g, bpm) {
    mode = 'chant'; words = [...text]; wi = 0; count = 0; goal = g; stats = { n: 0, p: 0, g: 0 };
    chant = makeChant({ bpm });
    desk(false); S('jxChant').style.display = ''; S('jxCue').textContent = '點畫面任何地方，敲一下開始';
    paintWords(); paintCount();
    cam?.zoom(180, 360, 320);
    sfx.bowl();
    say(`念「<b>${text}</b>」${goal} 聲。<br>點畫面任何地方敲木魚，<b>光圈縮到木魚邊上</b>的時候敲最準。`);
    const r = ++crun;
    const loop = (now) => {
      if (r !== crun || mode !== 'chant') return;
      const gd = S('jxGuide');
      if (chant.on) {
        // 停太久就不催，等你再敲
        if (now - lastHit > chant.per * 4) { chant.stop(); S('jxCue').textContent = '慢慢來，準備好再敲'; gd.setAttribute('opacity', '0'); }
        else { const rr = chant.ring(now, 76, 124); gd.setAttribute('rx', rr.toFixed(1)); gd.setAttribute('ry', (rr * .76).toFixed(1)); gd.setAttribute('opacity', (.25 + .65 * chant.phase(now)).toFixed(2)); }
      } else {
        const k = (Math.sin(now / 600) + 1) / 2; gd.setAttribute('rx', (80 + k * 10).toFixed(1)); gd.setAttribute('ry', (61 + k * 8).toFixed(1)); gd.setAttribute('opacity', (.25 + k * .3).toFixed(2));
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  function paintWords() {
    const n = words.length, gap = Math.min(40, 300 / n), x0 = 180 - (gap * (n - 1)) / 2;
    S('jxWords').innerHTML = words.map((c, i) => `<text x="${(x0 + i * gap).toFixed(1)}" y="256" text-anchor="middle" class="jx-word${i < wi ? ' lit' : ''}" style="font-size:${Math.min(32, gap - 4)}px">${c}</text>`).join('');
  }
  function paintCount() {
    S('jxCount').textContent = `第 ${Math.min(count + 1, goal)} / ${goal} 聲`;
    // 念珠：一圈 18 顆，念一聲亮一顆
    const nb = 18, lit = goal <= nb ? count : count % nb, tot = Math.min(goal, nb);
    S('jxBeads').innerHTML = Array.from({ length: tot }, (_, i) => {
      const a = Math.PI + (i / (tot - 1 || 1)) * Math.PI, x = 180 + Math.cos(a) * 130, y = 168 + Math.sin(a) * 40 + 40;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.4" fill="${i < lit ? '#FFD36A' : '#6E4A30'}" stroke="#3B1F17" stroke-width="1"/>`;
    }).join('');
  }
  function strike(e) {
    if (mode !== 'chant') return;
    e?.preventDefault?.();
    const now = performance.now(), wasOn = chant.on;
    const { grade } = chant.judge(now); lastHit = now;
    if (!wasOn) S('jxCue').textContent = grade ? '跟著光圈敲' : '';
    stats.n++; if (grade === 'perfect') stats.p++; else if (grade === 'good') stats.g++;
    strikeMuyu(svg, 'jxBig', grade);
    sfx.muyu(1 + (Math.random() - .5) * .03, grade === 'off' ? .7 : 1);
    if (grade === 'perfect' && !reduce) emit('spark', BIG_MUYU[0] + 10, BIG_MUYU[1] - 120);
    wi++; paintWords();
    if (wi < words.length) return;
    // 念完一聲
    count++; wi = 0;
    setTimeout(() => { if (mode === 'chant') paintWords(); }, chant.per * .6);
    paintCount();
    if (count % 7 === 0 || count === goal) sfx.bowl();
    if (count >= goal) finishChant();
  }
  function stopChant(summary) {
    if (mode !== 'chant') return;
    if (summary && count > 0) { finishChant(); return; }
    crun++; mode = 'idle'; chant?.stop(); S('jxChant').style.display = 'none'; cam?.reset(); desk(true);
    if (summary) say('木魚先放著，想敲再來。');
  }
  function finishChant() {
    crun++; mode = 'idle'; chant.stop();
    const calm = stats.n ? Math.round(((stats.p + stats.g * .6) / stats.n) * 100) : 0;
    jx.sheng += count;
    const first = daily(jx.muyu, dayKey(), yesterdayKey()); save();
    if (first) addFish(1);
    burst('spark', 180, 340, reduce ? 4 : 20); sfx.chime();
    const text = words.join('');
    setTimeout(() => {
      S('jxChant').style.display = 'none'; cam?.reset(); desk(true);
      openSheet('今日靜心', `
        <div class="jx-sum"><b>${count}</b><span>聲「${esc(text)}」</span></div>
        <p>心定指數 <b>${calm}%</b>${calm >= 85 ? '，每一下都很穩。' : calm >= 60 ? '，心慢慢靜下來了。' : '，沒關係，下次跟著光圈慢慢敲。'}</p>
        <p>${pick(CALM)}</p>
        <p class="hint">${first ? `今天靜心完成，已經連續 ${jx.muyu.streak} 天。虎爺叼來小魚乾 ×1。` : '今天已經敲過了，想再敲隨時都可以。'}累計念了 ${jx.sheng} 聲。</p>`);
      say(`念完 ${count} 聲「${esc(text)}」。坐一下再起來吧。`);
    }, reduce ? 100 : 900);
  }
  S('jxTapHit').addEventListener('pointerdown', strike);

  /* ================= 紀錄 ================= */
  function openLog() {
    const su = SU(), k = jx.sutra, pos = jx.pos[k];
    const book = su.segs.map((s, i) => `<span class="${i < pos ? 'done' : i === pos ? 'cur' : ''}">${s.join('　')}</span>`).join('　');
    const body = openSheet('靜心紀錄', `
      <p>抄經 <b>${jx.copy.total || 0}</b> 天${jx.copy.streak > 1 ? `（連續 ${jx.copy.streak} 天）` : ''}・敲木魚 <b>${jx.muyu.total || 0}</b> 天${jx.muyu.streak > 1 ? `（連續 ${jx.muyu.streak} 天）` : ''}・累計念 ${jx.sheng} 聲</p>
      <h3 class="jx-h">《${su.name}》 ${pos} / ${su.segs.length} 段${jx.copies[k] ? `・已抄滿 ${jx.copies[k]} 部` : ''}</h3>
      <div class="jx-book">${book}</div>
      <div class="row"><button class="btn ghost" id="jxSwap">換一部經</button></div>
      ${jx.dedic.length ? `<h3 class="jx-h">迴向</h3><ul class="jx-dedic">${jx.dedic.slice(0, 8).map((d) => `<li><b>${esc(d.name)}</b>：${esc(d.wish)}<small>${d.date}・${d.sutra}</small></li>`).join('')}</ul>` : ''}
      ${jx.pending ? `<p class="hint">還有 ${jx.pending} 部經的功德還沒迴向，按「迴向」。</p>` : ''}`);
    body.querySelector('#jxSwap').addEventListener('click', () => { closeSheet(); chooseSutra(() => say(`換成抄《${SU().name}》了，進度在第 ${jx.pos[jx.sutra] + 1} 段。按「抄經」開始。`)); });
  }

  /* ================= 按鈕、鍵盤 ================= */
  S('jxDeskPaper').addEventListener('click', () => { if (mode === 'idle') startTrace(); });
  S('jxDeskMuyuG').addEventListener('click', () => { if (mode !== 'idle') return; strikeMuyu(svg, 'jxSm', 'good'); sfx.muyu(); setTimeout(openChant, 350); });
  svg.addEventListener('keydown', (e) => {
    if (e.key === ' ' && mode === 'chant') { if (!e.repeat) strike(e); return; }
    if (e.key === 'Enter' && mode === 'trace') { e.preventDefault(); autoChar(); return; }
    if (e.key === 'Enter' && mode === 'idle') { const t = e.target.closest?.('[id]'); if (t?.id === 'jxDeskPaper') startTrace(); else if (t?.id === 'jxDeskMuyuG') openChant(); }
    if (e.key === 'Escape') { if (mode === 'trace') closeTrace(); else if (mode === 'chant') stopChant(true); }
  });
  $('#jxBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-jx]'); if (!b) return;
    const a = b.dataset.jx;
    if (a === 'copy') { if (mode === 'trace') { closeTrace(); say('經先放著，下次從這一段的開頭繼續抄。'); } else startTrace(); }
    else if (a === 'muyu') openChant();
    else if (a === 'dedic') { if (mode === 'trace') closeTrace(); stopChant(false); openDedicate(); }
    else if (a === 'log') openLog();
  });

  return {
    enter() {
      paintMe(); mode = 'idle'; crun++;
      S('jxTrace').style.display = 'none'; S('jxChant').style.display = 'none'; desk(true);
      const today = dayKey();
      const su = SU();
      say(jx.copy.last === today && jx.muyu.last === today ? '今天已經抄過經、敲過木魚了。想再坐一下也很好。'
        : jx.copy.total || jx.muyu.total ? `回到靜心閣了。《${su.name}》抄到第 ${jx.pos[jx.sutra] + 1} 段，今天要抄一段，還是敲一下木魚？`
        : '後院的靜心閣很安靜，窗外有竹子。可以點桌上的<b>抄經紙</b>描一段經文，或點<b>木魚</b>跟著節拍念佛號。<br>每天來一下，心會慢慢定下來。');
    },
    leave() { crun++; if (mode === 'chant') chant?.stop(); mode = 'idle'; S('jxTrace').style.display = 'none'; S('jxChant').style.display = 'none'; S('jxBrush').style.display = 'none'; busy = false; },
  };
}

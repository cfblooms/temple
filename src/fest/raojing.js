// 媽祖生（三月廿三）小遶境：
// 1 路邊擺香案 → 2 千里眼、順風耳大仙尪仔開路（擊掌、合照）→ 3 鑼鼓陣跟著打鼓、舞獅咬紅包
// → 4 神轎來了，跪在路上鑽轎腳 → 5 媽祖停在你的香案前，給你一張平安符。
// 手勢規則：拿起來的東西浮在手指上方；做動作時鏡頭拉近那一塊。
// 有 Gemini 圖（src/assets/fest/mz-*.webp、bg-mazu.webp）就自動換掉下面的手繪 SVG。
import { art, hasArt, rand, place } from './core.js';
import { backdrop } from './games-1.js';
import { CHARS } from '../chars.js';
import burnerUrl from '../assets/burner.webp';
import flowersUrl from '../assets/offer/flowers.webp';
import fruitUrl from '../assets/offer/fruit.webp';
import teaUrl from '../assets/offer/tea.webp';
import hongbaoUrl from '../assets/cai/hongbao.webp';
// 福氣幣（供品店那條分支的 src/wallet.js）；還沒合進來時就不給錢
const wallet = Object.values(import.meta.glob('../wallet.js', { eager: true }))[0]?.wallet;
const FU_REWARD = 30;

const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const img = (url, w, h) => `<image href="${url}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
const hit = (w, h, dy = 0) => `<rect x="${-w / 2}" y="${-h / 2 + dy}" width="${w}" height="${h}" fill="#000" opacity="0"/>`;
function flyTo(st, el, from, to, ms, done) {
  st.tween(ms, (k, e) => place(el, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(k * Math.PI) * 20), done);
}

/* ---------- 版面 ---------- */
const LANE = 500;          // 遶境隊伍的腳踩在這條線上
const AV = [285, 612];     // 自己跪的位置（腳）
const AV_ROW = [200, 606]; // 鑽轎腳時跪到路中間
const TABLE = [86, 520];   // 香案桌面中間
const PALM = [300, 452];   // 自己舉起來的手
const SED_Y = 420;         // 神轎中心高度：跪著的頭會碰到轎底，趴低剛好過

/* ---------- 手繪替代圖（以腳底為原點） ---------- */
// 大仙尪仔：大頭、長袍到地，一手招牌動作、一手舉高等你擊掌（手掌在 +52, -205）
function puppet(kind) {
  const qly = kind === 'qly';
  const face = qly ? '#4FA86A' : '#D9483B', faceD = qly ? '#2F7A48' : '#A42E24';
  const robe = qly ? '#2F6FB0' : '#E0863A', robeD = qly ? '#1F4E80' : '#B0602A';
  const sign = qly
    // 千里眼：手掌遮在眉毛上往遠方看
    ? `<path d="M-34 -140 Q-58 -170 -40 -214" stroke="${robe}" stroke-width="14" stroke-linecap="round" fill="none"/><ellipse cx="-30" cy="-216" rx="22" ry="9" fill="${face}" transform="rotate(-8 -30 -216)"/>`
    // 順風耳：手掌圈在大耳朵後面
    : `<path d="M-34 -140 Q-70 -160 -58 -196" stroke="${robe}" stroke-width="14" stroke-linecap="round" fill="none"/><ellipse cx="-60" cy="-200" rx="10" ry="16" fill="${face}"/>`;
  const ears = qly ? '' : `<ellipse cx="-46" cy="-186" rx="14" ry="24" fill="${face}" stroke="${faceD}" stroke-width="2"/><ellipse cx="46" cy="-186" rx="14" ry="24" fill="${face}" stroke="${faceD}" stroke-width="2"/><ellipse cx="-46" cy="-184" rx="6" ry="13" fill="${faceD}"/><ellipse cx="46" cy="-184" rx="6" ry="13" fill="${faceD}"/>`;
  const horns = qly ? `<path d="M-22 -222 l-8 -22 l16 14z M22 -222 l8 -22 l-16 14z" fill="#F3C64A"/>` : `<path d="M0 -232 l-6 -16 l12 0z" fill="#F3C64A"/>`;
  const eyes = qly
    ? `<circle cx="-15" cy="-188" r="11" fill="#FFF"/><circle cx="15" cy="-188" r="11" fill="#FFF"/><circle cx="-13" cy="-188" r="6" fill="#1E120C"/><circle cx="17" cy="-188" r="6" fill="#1E120C"/><circle cx="-11" cy="-190" r="2" fill="#FFF"/><circle cx="19" cy="-190" r="2" fill="#FFF"/>`
    : `<circle cx="-15" cy="-190" r="9" fill="#FFF"/><circle cx="15" cy="-190" r="9" fill="#FFF"/><circle cx="-15" cy="-190" r="5" fill="#1E120C"/><circle cx="15" cy="-190" r="5" fill="#1E120C"/>`;
  return `<ellipse cy="0" rx="58" ry="8" fill="#000" opacity=".18"/>
    <path d="M-40 -150 Q-48 -70 -64 0 L64 0 Q48 -70 40 -150Z" fill="${robe}" stroke="${robeD}" stroke-width="3"/>
    <path d="M-30 -150 L30 -150 L24 -96 L-24 -96Z" fill="#F3C64A" stroke="#C8962A" stroke-width="2"/><circle cy="-122" r="10" fill="#E0443E" stroke="#C8962A" stroke-width="2"/>
    <rect x="-64" y="-14" width="128" height="14" rx="4" fill="${robeD}"/>
    ${[-40, -14, 12, 38].map((x) => `<path d="M${x} -90 v84" stroke="${robeD}" stroke-width="2" opacity=".5"/>`).join('')}
    <path d="M34 -140 Q46 -170 52 -194" stroke="${robe}" stroke-width="14" stroke-linecap="round" fill="none"/>
    <g transform="translate(52 -207)"><ellipse rx="12" ry="14" fill="${face}" stroke="${faceD}" stroke-width="2"/>${[-8, -3, 3, 8].map((x) => `<rect x="${x - 2}" y="-24" width="4" height="12" rx="2" fill="${face}" stroke="${faceD}" stroke-width="1.2"/>`).join('')}</g>
    ${ears}
    <circle cy="-185" r="44" fill="${face}" stroke="${faceD}" stroke-width="3"/>
    ${horns}
    <path d="M-40 -205 Q0 -250 40 -205 Q30 -228 0 -232 Q-30 -228 -40 -205Z" fill="#2A1A14"/>
    ${eyes}
    <path d="M-22 -206 l14 4 M22 -206 l-14 4" stroke="#1E120C" stroke-width="4" stroke-linecap="round"/>
    <path d="M-16 -164 Q0 -150 16 -164" stroke="#1E120C" stroke-width="3" fill="#7A1E1A"/>
    <path d="M-8 -164 v5 M8 -164 v5" stroke="#FFF" stroke-width="3"/>
    ${sign}
    <text y="-58" text-anchor="middle" class="fest-small" fill="#FFF4D8">${qly ? '千里眼' : '順風耳'}</text>`;
}
const PUP_W = 150, PUP_H = 260;
const pupArt = (kind) => `<g transform="translate(0 ${-PUP_H / 2})">${art('mz-' + kind, PUP_W, PUP_H, `<g transform="translate(0 ${PUP_H / 2})">${puppet(kind)}</g>`)}</g>`;
const PUP_PALM = [52, -207];

// 鑼鼓陣：小推車上一面大鼓、一面鑼（鼓面在 0, -96）
const drumFallback = `<ellipse rx="96" ry="8" fill="#000" opacity=".18"/>
  <rect x="-90" y="-50" width="180" height="34" rx="6" fill="#8A3A1E"/><circle cx="-60" cy="-12" r="14" fill="#3A2A2A"/><circle cx="60" cy="-12" r="14" fill="#3A2A2A"/>
  <rect x="-58" y="-150" width="116" height="104" rx="18" fill="#C8302A" stroke="#7A1E1A" stroke-width="4"/>
  <ellipse cy="-96" rx="44" ry="46" fill="#F3E0B8" stroke="#C8962A" stroke-width="4"/><text y="-88" text-anchor="middle" class="fest-sign dark">鼓</text>
  <path d="M70 -150 v80" stroke="#7A3A1A" stroke-width="4"/><circle cx="70" cy="-112" r="22" fill="#E8B84A" stroke="#B08020" stroke-width="3"/><circle cx="70" cy="-112" r="6" fill="#B08020"/>
  <path d="M-92 -140 L-70 -112 M-104 -126 L-74 -106" stroke="#7A3A1A" stroke-width="5" stroke-linecap="round"/>`;
const drumArt = `<g transform="translate(0 -85)">${art('mz-drum', 210, 170, `<g transform="translate(0 85)">${drumFallback}</g>`)}</g>`;
const DRUM_FACE = [0, -96];

// 舞獅：面向左走，嘴巴在 -52, -70
const lionFallback = `<ellipse rx="80" ry="8" fill="#000" opacity=".18"/>
  <path d="M-30 -80 Q40 -110 90 -60 Q100 -20 80 0 L-10 0 Q-30 -40 -30 -80Z" fill="#F3C64A"/>
  ${[-10, 20, 50, 80].map((x) => `<path d="M${x} -96 q8 30 -4 70" stroke="#E0443E" stroke-width="5" fill="none"/>`).join('')}
  <path d="M10 0 v-10 M50 0 v-10" stroke="#E0443E" stroke-width="10" stroke-linecap="round"/>
  <circle cx="-30" cy="-90" r="50" fill="#E0443E" stroke="#B02A22" stroke-width="3"/>
  <circle cx="-30" cy="-128" r="12" fill="#CFE8F0" stroke="#F3C64A" stroke-width="3"/>
  <path d="M-72 -120 q-6 -20 10 -26 M10 -120 q6 -20 -10 -26" stroke="#FFF" stroke-width="6" stroke-linecap="round" fill="none"/>
  <circle cx="-48" cy="-100" r="11" fill="#FFF"/><circle cx="-14" cy="-100" r="11" fill="#FFF"/><circle cx="-50" cy="-100" r="6" fill="#1E120C"/><circle cx="-16" cy="-100" r="6" fill="#1E120C"/>
  <g class="jaw"><path d="M-78 -76 Q-30 -40 18 -76 Q-30 -56 -78 -76Z" fill="#7A1E1A"/><path d="M-78 -76 Q-30 -30 18 -76" stroke="#FFF" stroke-width="4" fill="none" stroke-dasharray="4 5"/></g>
  <path d="M-74 -70 q-14 10 -6 26 M14 -70 q14 10 6 26" stroke="#FFF" stroke-width="5" fill="none"/>`;
const lionArt = `<g transform="translate(0 -80)">${art('mz-lion', 190, 160, `<g transform="translate(0 80)">${lionFallback}</g>`)}</g>`;
const LION_MOUTH = [-52, -70];

// 神轎（正面）＋前後轎班
const sedanFallback = `<path d="M-120 64 L-50 24 M120 64 L50 24" stroke="#7A3A1A" stroke-width="12" stroke-linecap="round"/>
  <path d="M-60 -70 L60 -70 L72 -56 L-72 -56Z" fill="#F3C64A"/><path d="M0 -104 L-46 -70 L46 -70Z" fill="#E0443E"/><circle cy="-108" r="8" fill="#F3C64A"/>
  <rect x="-50" y="-56" width="100" height="120" rx="6" fill="#C8302A" stroke="#F3C64A" stroke-width="4"/>
  <rect x="-32" y="-42" width="64" height="62" rx="4" fill="#FFE9B8"/><circle cy="-16" r="14" fill="#FFE0C4"/><path d="M-18 -24 Q0 -46 18 -24 L14 -20 Q0 -34 -14 -20Z" fill="#F3C64A"/><path d="M-20 20 Q0 -4 20 20Z" fill="#E0443E"/>
  <rect x="-44" y="30" width="88" height="26" rx="4" fill="#E8B84A"/>`;
const bearer = (x) => `<g transform="translate(${x} 72)"><circle cy="-8" r="11" fill="#FFE0C4"/><path d="M-12 -14 q12 -12 24 0" fill="#3A2A2A"/><rect x="-11" y="4" width="22" height="40" rx="6" fill="#F7F7F7" stroke="#D8D0C0"/><rect x="-11" y="20" width="22" height="6" fill="#E0443E"/><path class="leg" d="M-6 44v24M6 44v24" stroke="#3A2A2A" stroke-width="6" stroke-linecap="round"/></g>`;

// 香案、平安符、手
const tableFallback = `<rect x="-74" y="-6" width="148" height="14" rx="3" fill="#B0402A" stroke="#7A2418" stroke-width="2"/>
  <rect x="-70" y="8" width="140" height="58" fill="#C8302A"/><path d="M-70 8 h140 v18 h-140z" fill="#F3C64A" opacity=".85"/>
  <text y="54" text-anchor="middle" class="fest-small" fill="#FFE29A">恭迎聖駕</text>
  <path d="M-66 66 v26 M66 66 v26" stroke="#7A2418" stroke-width="8" stroke-linecap="round"/>`;
const amuletFallback = `<rect x="-18" y="-26" width="36" height="52" rx="5" fill="#E0443E" stroke="#F3C64A" stroke-width="3"/>
  <path d="M0 -36 v10" stroke="#F3C64A" stroke-width="3"/><circle cy="-38" r="4" fill="none" stroke="#F3C64A" stroke-width="2.5"/>
  <text y="-4" text-anchor="middle" font-size="13" font-weight="900" fill="#FFE29A">平安</text><text y="14" text-anchor="middle" font-size="9" font-weight="700" fill="#FFE29A">天上聖母</text>
  <path d="M-4 26 v12 M0 26 v14 M4 26 v12" stroke="#F3C64A" stroke-width="2"/>`;
const palmSvg = `<circle r="36" fill="#000" opacity="0"/><path d="M-10 30 v-14 q-14 -2 -14 -16 v-14 q0 -6 6 -6 q5 0 5 6 v-14 q0 -6 6 -6 q5 0 5 6 v-4 q0 -6 6 -6 q5 0 5 6 v4 q0 -6 6 -6 q5 0 5 6 v26 q6 -8 12 -6 q5 2 1 10 q-8 14 -18 24 v10z" fill="#FFD9B8" stroke="#C88A60" stroke-width="2"/>`;

// slot 的高度讓供品底部「坐」在香案桌面上（以前底部落在桌裙上，看起來浮在桌子前面）
const OFFER = [
  { id: 'burner', name: '香爐', url: burnerUrl, w: 52, h: 38, slot: [TABLE[0] - 2, TABLE[1] - 28] },
  { id: 'flowers', name: '鮮花', url: flowersUrl, w: 26, h: 48, slot: [TABLE[0] - 52, TABLE[1] - 34] },
  { id: 'fruit', name: '水果', url: fruitUrl, w: 38, h: 44, slot: [TABLE[0] + 46, TABLE[1] - 30] },
  { id: 'tea', name: '清茶', url: teaUrl, w: 38, h: 27, slot: [TABLE[0] - 28, TABLE[1] - 24] },
];
const TRAY = [[62, 610], [116, 614], [170, 610], [224, 614]]; // 左下角留空，不要被「試玩」標籤擋住

/* ---------- 合照：把舞台畫成 PNG ---------- */
async function snapshot(svg) {
  const toData = (url) => fetch(url).then((r) => r.blob()).then((b) => new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); })).catch(() => '');
  const clone = svg.cloneNode(true);
  clone.querySelector('#fFx')?.remove();
  clone.querySelectorAll('[data-nophoto]').forEach((n) => n.remove());
  clone.setAttribute('viewBox', '0 0 360 645'); clone.setAttribute('width', 720); clone.setAttribute('height', 1290);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const cache = {};
  await Promise.all([...clone.querySelectorAll('image')].map(async (im) => {
    const u = im.getAttribute('href'); if (!u || u.startsWith('data:')) return;
    cache[u] ||= toData(u); im.setAttribute('href', await cache[u]);
  }));
  // SVG 當圖片時讀不到網頁的 CSS，字型樣式直接寫進去
  clone.querySelectorAll('text').forEach((t) => { t.setAttribute('font-family', 'sans-serif'); if (!t.getAttribute('font-size')) t.setAttribute('font-size', '13'); t.setAttribute('font-weight', '700'); });
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  const pic = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const W = 720, H = 1060, PAD = 30, c = document.createElement('canvas');
  c.width = W; c.height = H + 150;
  const g = c.getContext('2d');
  g.fillStyle = '#FFFDF6'; g.fillRect(0, 0, c.width, c.height);
  // 只取隊伍和自己那一段（y 170～700）
  g.drawImage(pic, 0, 340, 720, 1060 * (720 - PAD * 2) / 720 * 720 / (720 - PAD * 2), PAD, PAD, W - PAD * 2, H - PAD * 2);
  URL.revokeObjectURL(url);
  const d = new Date();
  g.fillStyle = '#7A1E1A'; g.textAlign = 'center';
  g.font = '900 44px serif'; g.fillText('媽祖生・遶境平安', W / 2, H + 50);
  g.fillStyle = '#9C744A'; g.font = '28px sans-serif'; g.fillText(`與千里眼、順風耳合影　${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`, W / 2, H + 100);
  return c.toDataURL('image/png');
}

/* ================= 主遊戲 ================= */
export const mazu = {
  play(st, o) {
    const me = o.me;
    const others = CHARS.filter((c) => c.id !== me.id && c.kneel);
    const crowd = [...others].sort(() => Math.random() - .5).slice(0, 3), npc = crowd[0];
    const kneelImg = (c, s = 1) => `<image href="${c.kneel}" x="${-60 * s}" y="${-130 * s}" width="${120 * s}" height="${130 * s}" preserveAspectRatio="xMidYMax meet"/>`;
    st.set(`${backdrop('mazu', { wall: ['#BFE0F2', '#F8E2C0'], table: 430, tableColor: ['#C8BCA8', '#A89A84'], extra: `
        ${[[0, 150, '#E8C8A0'], [96, 120, '#F0D8B8'], [214, 160, '#E4BC98'], [300, 130, '#F2D2AE']].map(([x, h, c]) => `<rect x="${x}" y="${430 - h - 120}" width="${x === 300 ? 60 : 110}" height="${h + 120}" fill="${c}" stroke="#C8A27A"/><rect x="${x + 14}" y="${430 - h - 96}" width="30" height="34" fill="#9CC6DA" opacity=".8"/><rect x="${x + 56}" y="${430 - h - 96}" width="30" height="34" fill="#9CC6DA" opacity=".8"/><rect x="${x}" y="${430 - 70}" width="${x === 300 ? 60 : 110}" height="12" fill="#C8302A"/>`).join('')}
        <path d="M-10 150 Q90 190 180 160 Q270 130 370 170" stroke="#7A3A1A" stroke-width="2" fill="none"/>
        ${[30, 80, 130, 180, 230, 280, 330].map((x, i) => `<g transform="translate(${x} ${168 + Math.sin(i * 1.3) * 10})"><path d="M0 -12 v6" stroke="#7A3A1A"/><ellipse rx="10" ry="12" fill="#E0443E"/><rect x="-5" y="-12" width="10" height="3" fill="#F3C64A"/><rect x="-5" y="9" width="10" height="3" fill="#F3C64A"/></g>`).join('')}
        <path d="M0 470 H360" stroke="#FFF" stroke-width="3" stroke-dasharray="18 14" opacity=".6"/>` })}
      <g id="lane"></g>
      <g id="table" transform="translate(${TABLE[0]} ${TABLE[1]})">${art('mz-table', 160, 110, `<g transform="translate(0 -14)">${tableFallback}</g>`)}</g>
      ${OFFER.map((it) => `<ellipse id="slot-${it.id}" cx="${it.slot[0]}" cy="${it.slot[1] + it.h / 2 - 2}" rx="${it.w / 2 + 2}" ry="5" fill="none" stroke="#FFF4D8" stroke-width="2" stroke-dasharray="4 3" data-nophoto/>`).join('')}
      ${OFFER.map((it) => `<g id="of-${it.id}" class="fest-hit" filter="url(#fToy)">${hit(Math.max(48, it.w + 10), Math.max(48, it.h + 10))}${img(it.url, it.w, it.h)}</g>`).join('')}
      <g id="npc" style="display:none"><ellipse rx="40" ry="7" fill="#000" opacity=".15"/>${kneelImg(npc, .9)}</g>
      ${crowd.slice(1).map((c, i) => `<g id="npc${i + 1}" style="display:none"><ellipse rx="36" ry="6" fill="#000" opacity=".15"/>${kneelImg(c, .8)}</g>`).join('')}
      <g id="av"><ellipse rx="46" ry="8" fill="#000" opacity=".15"/>${kneelImg(me)}</g>
      <g id="sedanLayer"></g>
      <g id="props"></g>
      <text id="tip" x="0" y="0" text-anchor="middle" class="fest-tip" data-nophoto></text>`);
    const $ = st.$, lane = $('#lane'), avEl = $('#av'), tip = $('#tip');
    const setTip = (t) => { tip.textContent = t; };
    const av = { x: AV[0], y: AV[1], low: 0, want: 0 };
    const placeAv = () => avEl.setAttribute('transform', `translate(${av.x.toFixed(1)} ${(av.y + av.low * 26).toFixed(1)}) rotate(${(av.low * -8).toFixed(1)}) scale(1 ${(1 - av.low * .38).toFixed(3)})`);
    placeAv();
    OFFER.forEach((it, i) => place($('#of-' + it.id), ...TRAY[i]));
    const TOTAL = 5; let stepN = 0;
    const step = () => { stepN++; st.progress(stepN, TOTAL); };
    st.progress(0, TOTAL);
    st.buttons([]);

    /* ---- 走路的演員（每幀一起更新） ---- */
    const actors = [];
    function actor(html, x, { y = LANE, speed = 90, sway = 4, bob = 4, layer = lane } = {}) {
      layer.insertAdjacentHTML('beforeend', `<g>${html}</g>`);
      const a = { el: layer.lastElementChild, x, y, tx: x, speed, sway, bob, ph: Math.random() * 6, arrive: null, wiggle: 0, nod: 0, hold: false };
      a.go = (tx, cb) => { a.tx = tx; a.arrive = cb || null; };
      a.kill = () => { a.el.remove(); actors.splice(actors.indexOf(a), 1); };
      actors.push(a); return a;
    }
    let lowHeld = false, over = false;
    let tickHook = null;
    let last = performance.now();
    const loop = (t) => {
      if (!st.alive) return;
      const dt = Math.min(.05, (t - last) / 1000); last = t;
      for (const a of [...actors]) {
        const moving = Math.abs(a.tx - a.x) > .5 && !a.hold;
        if (moving) { const s = Math.sign(a.tx - a.x); a.x += s * Math.min(Math.abs(a.tx - a.x), a.speed * dt); }
        else if (a.arrive && Math.abs(a.tx - a.x) <= .5) { const cb = a.arrive; a.arrive = null; cb(); }
        a.ph += dt * (moving ? 9 : 3);
        a.wiggle = Math.max(0, a.wiggle - dt * 2); a.nod = Math.max(0, a.nod - dt);
        const bob = moving ? Math.abs(Math.sin(a.ph)) * -a.bob : Math.sin(a.ph) * 1.2;
        const rot = Math.sin(a.ph * .5) * a.sway * (moving ? 1 : .4) + Math.sin(a.wiggle * 18) * 8 * a.wiggle + Math.sin(a.nod * Math.PI * 3) * 7;
        place(a.el, a.x, a.y + bob + Math.abs(Math.sin(a.nod * Math.PI * 3)) * 10, 1, rot);
        a.el.querySelectorAll('.leg').forEach((l) => l.setAttribute('transform', moving ? `translate(0 ${(Math.sin(a.ph * 2) * 2).toFixed(1)})` : ''));
      }
      av.low += (av.want - av.low) * Math.min(1, dt * 10); placeAv();
      // 提示字跟著鏡頭，永遠在畫面上方、大小不變
      if (tip.textContent) { const v = st.svg.viewBox.baseVal, k = v.width / 360; tip.setAttribute('transform', `translate(${(v.x + 180 * k).toFixed(1)} ${(v.y + 74 * k).toFixed(1)}) scale(${k.toFixed(3)})`); }
      tickHook?.(dt, t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // 拿起來浮在手指上方、碰到目標就觸發
    function grab(el, home, { target, onHit, onLift }) {
      let busy = false;
      st.hold(el, {
        magnet: () => (busy ? null : target()),
        onStart() { onLift?.(); },
        onMove(x, y) {
          if (busy) return;
          place(el, x, y, 1.08);
          const tg = target();
          if (tg && D([x, y], tg) < 4) { busy = true; onHit(() => { busy = false; }); }
        },
        onUp(x, y) { if (!busy) flyTo(st, el, [x, y], home, 260); },
      });
    }

    /* ================= 1. 擺香案 ================= */
    st.say('三月廿三媽祖生，媽祖要出來遶境了！先在家門口<b>擺香案</b>接駕：把下面的香爐、鮮花、水果、清茶<b>按住拖到桌上</b>。', 'temple');
    setTip('把供品拖到香案上');
    st.zoom(120, 540, 250);
    let placed = 0;
    OFFER.forEach((it, i) => {
      const el = $('#of-' + it.id);
      let done = false;
      grab(el, TRAY[i], {
        target: () => (done ? null : it.slot),
        onHit() {
          done = true; placed++;
          place(el, ...it.slot); el.classList.remove('fest-hit'); el.style.pointerEvents = 'none';
          $('#slot-' + it.id)?.remove();
          st.sfx.knock(); st.burst('star', it.slot[0], it.slot[1], 8);
          st.floatText(it.name, it.slot[0], it.slot[1] - 30);
          if (placed === OFFER.length) {
            step(); st.sfx.chime();
            st.say('香案擺好了！遠遠聽到鑼鼓聲……<b>千里眼、順風耳</b>大仙尪仔開路來了！', 'temple');
            setTip('');
            st.later(900, () => { st.reset(600); phasePuppets(); });
          }
        },
      });
    });

    /* ================= 2. 千里眼、順風耳 ================= */
    let palm = null;
    function phasePuppets() {
      const qly = actor(pupArt('qly'), 450, { speed: 110, sway: 6, bob: 6 });
      const sfe = actor(pupArt('sfe'), 560, { speed: 110, sway: 6, bob: 6 });
      st.sfx.knock(); st.later(300, () => st.sfx.knock());
      $('#props').insertAdjacentHTML('beforeend', `<g id="palm" class="fest-hit" style="display:none" filter="url(#fToy)">${palmSvg}</g>`);
      palm = $('#props').lastElementChild; place(palm, ...PALM);
      let who = qly;
      const palmAt = () => (who ? [who.x + PUP_PALM[0], who.y + PUP_PALM[1]] : null);
      let five = 0;
      grab(palm, PALM, {
        target: () => (who && Math.abs(who.tx - who.x) < 1 ? palmAt() : null),
        onHit(release) {
          const p = palmAt(); five++;
          st.sfx.knock(); st.sfx.knock(.05); st.sfx.buzz?.([15, 30, 15]);
          st.burst('star', p[0], p[1], 18); st.floatText('啪！', p[0], p[1] - 26);
          who.wiggle = 1;
          const cur = who; who = null;
          st.later(250, () => { flyTo(st, palm, p, PALM, 300, release); });
          if (five === 1) {
            st.say('千里眼：「我看得遠，看到你今年一路順風！」<br>換<b>順風耳</b>，一樣舉手跟祂擊掌。', 'temple');
            st.later(700, () => { cur.go(70); sfe.go(205, () => { who = sfe; }); });
          } else {
            step(); st.sfx.chime();
            st.later(700, () => { palm.style.display = 'none'; st.reset(500); photoTime(qly, sfe); });
          }
        },
      });
      qly.go(205, () => {
        who = qly; palm.style.display = '';
        st.zoom(230, 380, 250);
        st.say('千里眼走到你面前，手舉得高高的！<b>按住你的手</b>舉到祂的手掌上，擊個掌！', 'temple');
        setTip('按住手，舉到大仙的手掌');
      });
      sfe.go(330);
    }

    function photoTime(qly, sfe) {
      setTip('');
      st.say('大仙尪仔說要跟你<b>合照</b>！擺好姿勢……', 'temple');
      qly.go(95); sfe.go(300);
      const pose = st.add(`<g data-nophoto></g>`);
      st.tween(500, (k, e) => { av.x = AV[0] + (180 - AV[0]) * e; });
      st.buttons([
        { label: '📸 合照', primary: true, on: () => shoot() },
        { label: '不用了', on: () => afterPhoto() },
      ]);
      let shooting = false;
      async function shoot() {
        if (shooting) return; shooting = true;
        st.buttons([]);
        for (const n of ['3', '2', '1']) {
          const t = st.add(`<text x="180" y="300" text-anchor="middle" class="fest-count" data-nophoto>${n}</text>`);
          st.sfx.pop(); await new Promise((r) => st.later(600, r)); t.remove();
        }
        let url = '';
        try { url = await snapshot(st.svg); } catch { url = ''; }
        if (!st.alive) return;
        const flash = st.add(`<rect width="360" height="645" fill="#FFF" data-nophoto/>`);
        st.sfx.chime();
        st.tween(500, (k) => flash.setAttribute('opacity', (1 - k).toFixed(2)), () => flash.remove());
        if (!url) { st.say('喀嚓！（這台手機存不了相片，不過大仙記得你了。）', 'temple'); st.later(900, afterPhoto); return; }
        pose.innerHTML = `<rect width="360" height="645" fill="#000" opacity=".55"/>
          <g transform="translate(180 300) rotate(-3)"><rect x="-120" y="-180" width="240" height="330" fill="#FFFDF6" filter="url(#fToy)"/><image href="${url}" x="-110" y="-170" width="220" height="${220 * 1210 / 720}" preserveAspectRatio="xMidYMin meet"/></g>`;
        st.say('拍好了！跟千里眼、順風耳的合照，可以存到手機。', 'temple');
        st.buttons([
          { label: '存相片', on: () => { const a = document.createElement('a'); a.href = url; a.download = `媽祖生遶境合照-${Date.now()}.png`; document.body.appendChild(a); a.click(); a.remove(); } },
          { label: '繼續看遶境', primary: true, on: () => { pose.remove(); afterPhoto(); } },
        ]);
      }
      function afterPhoto() {
        st.buttons([]); pose.remove();
        qly.go(-140, () => qly.kill()); st.later(500, () => sfe.go(-140, () => sfe.kill()));
        st.tween(500, (k, e) => { av.x = 180 + (AV[0] - 180) * e; });
        st.later(900, phaseDrum);
      }
    }

    /* ================= 3. 鑼鼓陣、舞獅 ================= */
    function phaseDrum() {
      st.say('<b>鑼鼓陣</b>來了！看鼓面上的圈圈縮到最小的時候，<b>點鼓</b>跟著打，打中三下。', 'temple');
      const drum = actor(drumArt, 460, { speed: 120, sway: 2, bob: 3 });
      drum.el.insertAdjacentHTML('beforeend', `<g class="ring" style="display:none" data-nophoto><circle cx="${DRUM_FACE[0]}" cy="${DRUM_FACE[1]}" r="44" fill="none" stroke="#FFF4D8" stroke-width="4"/></g><circle class="dhit" cx="${DRUM_FACE[0]}" cy="${DRUM_FACE[1]}" r="70" fill="#000" opacity="0" style="cursor:pointer"/>`);
      const ring = drum.el.querySelector('.ring circle'), dhit = drum.el.querySelector('.dhit');
      let beats = false, good = 0, t0 = 0;
      const BEAT = 1000;
      drum.go(190, () => {
        st.zoom(190, 400, 250); setTip('圈圈縮到鼓邊時點鼓');
        drum.el.querySelector('.ring').style.display = ''; beats = true; t0 = performance.now();
      });
      tickHook = (dt, t) => {
        if (!beats) return;
        const k = ((t - t0) % BEAT) / BEAT;
        ring.setAttribute('r', (44 * (2.2 - 1.2 * k)).toFixed(1));
        ring.setAttribute('opacity', (.4 + .6 * k).toFixed(2));
        // 鑼每四拍敲一下，有節奏感
        const n = Math.floor((t - t0) / BEAT);
        if (n !== tickHook.n) { tickHook.n = n; if (n % 4 === 3) st.sfx.bowl(); }
      };
      dhit.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!beats) return;
        st.sfx.knock(); drum.wiggle = .5;
        const ph = ((performance.now() - t0) % BEAT) / BEAT, off = Math.min(ph, 1 - ph) * BEAT;
        const p = [drum.x + DRUM_FACE[0], drum.y + DRUM_FACE[1]];
        if (off < 200) {
          good++; st.burst('spark', p[0], p[1], 12); st.floatText(good === 3 ? '讚！' : '咚！', p[0], p[1] - 56);
          if (good >= 3) {
            beats = false; tickHook = null; step();
            drum.el.querySelector('.ring').remove(); dhit.remove();
            st.sfx.chime(); setTip('');
            st.later(500, () => { st.reset(500); drum.go(-160, () => drum.kill()); phaseLion(); });
          }
        } else st.floatText('再等一下', p[0], p[1] - 56, '#FFE0C0');
      });
    }

    function phaseLion() {
      const lion = actor(lionArt, 470, { speed: 130, sway: 8, bob: 10 });
      st.say('<b>舞獅</b>跳過來討紅包了！按住<b>紅包</b>，拿到獅子嘴邊餵牠。', 'temple');
      $('#props').insertAdjacentHTML('beforeend', `<g id="hb" class="fest-hit" filter="url(#fToy)" style="display:none">${hit(56, 64)}${img(hongbaoUrl, 40, 46)}</g>`);
      const hb = $('#props').lastElementChild; place(hb, ...PALM);
      let ready = false, fed = false;
      lion.go(210, () => {
        ready = true; hb.style.display = '';
        st.zoom(200, 420, 250); setTip('把紅包拿到獅子嘴邊');
      });
      grab(hb, PALM, {
        target: () => (ready && !fed ? [lion.x + LION_MOUTH[0], lion.y + LION_MOUTH[1]] : null),
        onHit() {
          fed = true; hb.style.display = 'none';
          const p = [lion.x + LION_MOUTH[0], lion.y + LION_MOUTH[1]];
          st.sfx.knock(); st.sfx.knock(.12); st.sfx.knock(.24);
          lion.wiggle = 1.5;
          st.burst('paper', p[0], p[1], 22, () => ({ color: Math.random() < .5 ? '#E0443E' : '#F3C64A', g: 120 }));
          st.floatText('大吉！', p[0], p[1] - 40);
          step(); setTip('');
          st.later(1200, () => { st.reset(500); lion.go(-160, () => lion.kill()); st.later(600, phaseSedan); });
        },
      });
    }

    /* ================= 4. 鑽轎腳 ================= */
    // 神轎來之前：放一串鞭炮迎接（按住香，把香頭碰到鞭炮下面的引信）
    function phaseSedan() {
      const FC = [40, 300], FUSE = [40, 432], REST = [196, 520];
      $('#props').insertAdjacentHTML('beforeend', `<g id="fcG"><path d="M${FC[0] - 18} 160 Q${FC[0]} 150 ${FC[0] + 30} 170" stroke="#5E9A4A" stroke-width="5" fill="none"/><line x1="${FC[0]}" y1="168" x2="${FC[0]}" y2="186" stroke="#7A3A1A" stroke-width="2"/>
        <g id="fcStr" transform="translate(${FC[0]} ${FC[1]})">${hasArt('cj-firecracker') ? art('cj-firecracker', 60, 260, '') : `${Array.from({ length: 16 }, (_, i) => `<rect x="${i % 2 ? 2 : -14}" y="${-120 + i * 15}" width="12" height="20" rx="3" fill="#E0443E" stroke="#9A2420"/>`).join('')}`}</g>
        <circle id="fcFuse" cx="${FUSE[0]}" cy="${FUSE[1]}" r="14" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 4"/></g>
        <g id="fcStick" class="fest-hit" filter="url(#fToy)">${hit(40, 110)}<rect x="-2.5" y="-50" width="5" height="100" rx="2" fill="#B0703E"/><circle cy="-52" r="9" fill="url(#fGlow)"/><circle cy="-52" r="3" fill="#FF6A2A"/></g>`);
      const stick = $('#fcStick'); place(stick, ...REST);
      st.zoom(110, 400, 280);
      st.say('聽到鑼聲了，神轎快到了！先<b>放鞭炮</b>迎接媽祖：按住點著的香，把香頭碰到鞭炮<b>下面的引信</b>。', 'temple');
      setTip('香頭碰到鞭炮的引信');
      let lit = false;
      const light = () => {
        if (lit) return; lit = true; stick.remove(); $('#fcFuse').remove(); setTip(''); st.buttons([]);
        const str = $('#fcStr');
        for (let i = 0; i < 22; i++) st.later(i * 110, () => {
          const y = FUSE[1] - i * 12;
          st.burst('paper', FC[0] + rand(-10, 10), y, 6, { color: i % 2 ? '#E0443E' : '#F3C64A', speed: 90, life: .9 });
          st.emit('smoke', FC[0] + rand(-12, 12), y, { vx: rand(-20, 20), vy: -20, life: 1.4, s0: .8, s1: 2, fade: true });
          st.sfx.pop(); st.sfx.buzz?.(8);
          str.setAttribute('transform', `translate(${FC[0] + rand(-2, 2)} ${FC[1]})`);
          str.style.clipPath = `inset(0 0 ${Math.min(100, (i + 1) / 22 * 100).toFixed(0)}% 0)`;
        });
        st.later(22 * 110 + 300, () => { st.floatText('劈哩啪啦，迎媽祖！', 140, 260, '#FFE08A'); st.later(700, sedanCome); });
      };
      st.hold(stick, {
        magnet: () => (lit ? null : [FUSE[0], FUSE[1] + 52, 46]),
        onMove(x, y) { if (lit) return; place(stick, x, y); if (Math.hypot(x - FUSE[0], y - 52 - FUSE[1]) < 16) light(); },
        onUp(x, y) { if (!lit) flyTo(st, stick, [x, y], REST, 260); },
        liftBy: .6,
      });
      st.buttons([{ label: '幫我點', on: light }]);
    }
    function sedanCome() {
      // 路中間跪了一排信徒，一起等鑽轎腳
      const row = [[320, 600, $('#npc')], [112, 612, $('#npc1')], [30, 604, $('#npc2')]].filter((r) => r[2]);
      row.forEach(([x, y, el]) => { el.style.display = ''; place(el, x, y); });
      st.say('媽祖的<b>神轎</b>來了！大家都跪到路中間等著鑽轎腳。轎子到你頭上時<b>按住畫面</b>趴低，轎子過去再放開。', 'temple');
      setTip('轎子靠近時按住畫面趴低');
      const npcEl = $('#npc');
      st.tween(600, (k, e) => { av.x = AV[0] + (AV_ROW[0] - AV[0]) * e; av.y = AV[1] + (AV_ROW[1] - AV[1]) * e; });
      const sed = actor(`${bearer(-112)}${bearer(112)}${art('mz-sedan', 240, 222, sedanFallback)}`, 520, { y: SED_Y, speed: 95, sway: 1.5, bob: 3, layer: $('#sedanLayer') });
      st.sfx.chime();
      let warned = false, passed = false, early = false;
      const offTouch = st.touch({ down() { lowHeld = true; }, up() { lowHeld = false; } });
      st.zoom(240, 480, 330, 700);
      tickHook = (dt) => {
        av.want = lowHeld ? 1 : 0;
        // 旁邊的信徒自己會趴（轎子一個一個從大家頭上過去）
        row.forEach((r) => {
          const nOver = Math.abs(sed.x - r[0]) < 150;
          r.low = (r.low || 0) + ((nOver ? 1 : 0) - (r.low || 0)) * Math.min(1, dt * 8);
          r[2].setAttribute('transform', `translate(${r[0]} ${r[1] + r.low * 24}) rotate(${(r.low * -8).toFixed(1)}) scale(1 ${(1 - r.low * .38).toFixed(3)})`);
        });
        over = Math.abs(sed.x - av.x) < 135;
        // 轎子到頭上卻還沒趴低：轎班停下來等你
        sed.hold = over && av.low < .7 && sed.x > av.x;
        if (sed.hold && !warned) { warned = true; st.say('轎班停下來等你了，<b>按住畫面</b>趴低！', 'temple'); }
        if (!over && lowHeld && sed.x > av.x + 220 && !early) { early = true; st.floatText('還沒到喔', av.x, av.y - 150, '#FFE0C0'); }
        if (over && av.low > .7 && Math.random() < .3) st.emit('star', sed.x + rand(-60, 60), SED_Y + 70, { vy: 40, vx: rand(-10, 10), life: .8 });
        if (!passed && sed.x < av.x - 140) {
          passed = true; step(); st.sfx.chime(); st.burst('star', av.x, av.y - 80, 18);
          st.floatText('鑽過轎腳了！', av.x, av.y - 150);
        }
      };
      sed.go(TABLE[0] + 20, () => {
        tickHook = null; offTouch(); lowHeld = false; av.want = 0;
        row.slice(1).forEach((r) => { r[2].style.display = 'none'; });
        phaseAmulet(sed, npcEl);
      });
    }

    /* ================= 5. 停駕、平安符 ================= */
    function phaseAmulet(sed, npcEl) {
      setTip('');
      st.zoom(130, 470, 280);
      st.say('神轎在你的<b>香案</b>前停下來了！轎子點頭三下，媽祖收到你的心意。', 'temple');
      sed.nod = 1; st.sfx.bowl();
      st.later(1300, () => {
        st.tween(500, (k, e) => { av.x = AV_ROW[0] + (AV[0] - AV_ROW[0]) * e; av.y = AV_ROW[1] + (AV[1] - AV_ROW[1]) * e; });
        npcEl.style.display = 'none';
        const from = [sed.x, SED_Y - 20], hover = [190, 360];
        $('#props').insertAdjacentHTML('beforeend', `<g id="amu" class="fest-hit" filter="url(#fToy)">${hit(70, 90)}<circle r="46" fill="url(#fGlow)" opacity=".8"/>${art('mz-amulet', 44, 66, amuletFallback)}</g>`);
        const amu = $('#props').lastElementChild; place(amu, ...from, .4);
        st.tween(900, (k, e) => place(amu, from[0] + (hover[0] - from[0]) * e, from[1] + (hover[1] - from[1]) * e - Math.sin(k * Math.PI) * 50, .4 + .6 * e), () => {
          st.reset(500);
          st.say('媽祖賜你一張<b>平安符</b>！按住平安符，收到自己身上。', 'temple');
          setTip('把平安符拿到自己身上');
        });
        const chest = () => [av.x, av.y - 70];
        let got = false;
        grab(amu, hover, {
          target: () => (got ? null : chest()),
          onHit() {
            got = true; amu.remove();
            st.sfx.chime(); st.burst('star', av.x, av.y - 70, 24); st.floatText('平安符 ×1', av.x, av.y - 150);
            step(); setTip('');
            const d = new Date();
            const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            o.state.amulets ||= {};
            if (o.real && wallet && o.state.amulets.mazu !== key) wallet.earn(FU_REWARD, '媽祖生遶境平安符');
            if (o.real) o.state.amulets.mazu = key;
            o.save?.();
            sed.go(-200, () => sed.kill());
            st.later(900, () => o.done(`跟千里眼、順風耳擊了掌，鑼鼓陣和舞獅熱熱鬧鬧走過，你還鑽過了媽祖的轎腳。神轎停在你的香案前，賜你一張平安符：出入平安，海上陸上都有媽祖照顧。${o.real && wallet ? `<br>福氣幣 +${FU_REWARD}。` : ''}`));
          },
        });
      });
    }
  },
};

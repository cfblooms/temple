// 木魚共用元件：靜心閣「敲木魚」和法會「跟著誦經」都用這一個。
//   muyuSVG(id, { x, y, s })  畫木魚（放在紅色小蒲墊上）＋木槌＋漣漪；原點在墊子底部中心。
//   strikeMuyu(svg, id, grade) 敲一下：木槌落下、木魚縮一下、漣漪散開（grade: 'perfect' | 'good' | 'off'）。
//   makeChant({ bpm })         節拍器：judge(now) 判斷這一下準不準，phase(now) 給引導光圈用。
//   聲音用 sfx.muyu()（audio.js，Web Audio 合成，不用音檔）。
// 有正式圖檔就自動換上：src/assets/muyu/muyu.webp（木魚本體＋墊子）、mallet.webp（木槌，槌頭在左上、握柄在右下）。
const ART = import.meta.glob('./assets/muyu/*.webp', { eager: true, import: 'default' });
const BODY_IMG = ART['./assets/muyu/muyu.webp'];
const MALLET_IMG = ART['./assets/muyu/mallet.webp'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 木槌繞握柄末端轉：PIVOT 是轉軸，REST 是平常舉起來的角度，敲到時是 0 度（槌頭剛好碰到木魚頭頂）
const PIVOT = [80, -62], REST = 26;
export const MUYU_TOP = [8, -88]; // 木槌敲到的點（相對原點），粒子特效可以從這裡噴

export function muyuSVG(id, { x = 180, y = 480, s = 1 } = {}) {
  const body = BODY_IMG
    ? `<image href="${BODY_IMG}" x="-66" y="-112" width="132" height="118"/>`
    : `<ellipse cx="0" cy="-4" rx="60" ry="10" fill="#B8322A"/>
       <path d="M-60 -6q0 12 60 12t60-12v6q0 12-60 12t-60-12z" fill="#8E2219"/>
       <path d="M-30 -4q-6 -4 -2 -10M30 -4q6 -4 2 -10" stroke="#F2C14E" stroke-width="2" fill="none" stroke-linecap="round"/>
       <ellipse cx="0" cy="-46" rx="54" ry="40" fill="url(#${id}Wood)"/>
       <path d="M-50 -40q50 22 100 0" stroke="#5A2210" stroke-width="5" fill="none" stroke-linecap="round"/>
       <path d="M-46 -36q46 16 92 0" stroke="#2A0E06" stroke-width="2.4" fill="none" opacity=".7"/>
       <circle cx="-30" cy="-58" r="5" fill="#2A0E06"/><circle cx="-31.5" cy="-59.5" r="1.6" fill="#FFF4E0"/>
       <circle cx="30" cy="-58" r="5" fill="#2A0E06"/><circle cx="28.5" cy="-59.5" r="1.6" fill="#FFF4E0"/>
       <path d="M-14 -72q14 -8 28 0M-20 -64q20 -9 40 0" stroke="#7A3216" stroke-width="1.6" fill="none" opacity=".6"/>
       <ellipse cx="-20" cy="-70" rx="16" ry="8" fill="#FFE0B0" opacity=".28" transform="rotate(-18 -20 -70)"/>`;
  const mallet = MALLET_IMG
    ? `<image href="${MALLET_IMG}" x="-14" y="-118" width="108" height="72"/>`
    : `<path d="M${PIVOT[0]} ${PIVOT[1]}L14 -94" stroke="#7A4A22" stroke-width="5" stroke-linecap="round"/>
       <path d="M${PIVOT[0]} ${PIVOT[1]}l-12 -6" stroke="#B8322A" stroke-width="6" stroke-linecap="round"/>
       <ellipse cx="8" cy="-97" rx="12" ry="10" fill="#C98A4A" stroke="#7A4A22" stroke-width="1.6"/>
       <ellipse cx="4" cy="-101" rx="4" ry="2.6" fill="#FFE8C0" opacity=".6"/>`;
  return `<g id="${id}" transform="translate(${x} ${y}) scale(${s})">
    <defs><radialGradient id="${id}Wood" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#D9783A"/><stop offset=".6" stop-color="#A84A1E"/><stop offset="1" stop-color="#6E2A10"/></radialGradient>
      <radialGradient id="${id}Glow"><stop offset="0" stop-color="#FFE08A" stop-opacity=".8"/><stop offset="1" stop-color="#FFE08A" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="0" cy="6" rx="66" ry="10" fill="#1A0A08" opacity=".28"/>
    <circle id="${id}Halo" cx="0" cy="-46" r="70" fill="url(#${id}Glow)" opacity="0" pointer-events="none"/>
    <g id="${id}Body">${body}</g>
    <g id="${id}Fx" pointer-events="none"></g>
    <g id="${id}Mallet" transform="rotate(${REST} ${PIVOT[0]} ${PIVOT[1]})">${mallet}</g>
  </g>`;
}

const tw = (ms, fn) => new Promise((res) => {
  const t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / ms); fn(k); if (k < 1) requestAnimationFrame(step); else res(); };
  requestAnimationFrame(step);
});

export function strikeMuyu(svg, id, grade = 'good') {
  const S = (k) => svg.querySelector('#' + id + k);
  const mallet = S('Mallet'), body = S('Body'), fx = S('Fx'), halo = S('Halo');
  if (!mallet) return;
  const rot = (a) => mallet.setAttribute('transform', `rotate(${a.toFixed(1)} ${PIVOT[0]} ${PIVOT[1]})`);
  // 木槌：很快落下，再慢慢舉回去
  tw(reduce ? 1 : 55, (k) => rot(REST * (1 - k))).then(() => tw(reduce ? 1 : 260, (k) => rot(REST * (1 - Math.pow(1 - k, 2)))));
  // 木魚被敲到縮一下
  if (!reduce) tw(220, (k) => { const q = Math.sin(k * Math.PI) * (1 - k); body.setAttribute('transform', `translate(0 ${(q * 3).toFixed(2)}) scale(${(1 + q * .05).toFixed(3)} ${(1 - q * .07).toFixed(3)})`); });
  // 漣漪：準的是金色，不準是淡淡的白色
  const col = grade === 'perfect' ? '#FFE08A' : grade === 'good' ? '#FFF4E0' : '#C9C0B8';
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  c.setAttribute('cx', '0'); c.setAttribute('cy', '-46'); c.setAttribute('fill', 'none'); c.setAttribute('stroke', col);
  fx.appendChild(c);
  tw(reduce ? 200 : 900, (k) => {
    c.setAttribute('rx', (56 + k * 70).toFixed(1)); c.setAttribute('ry', (42 + k * 40).toFixed(1));
    c.setAttribute('stroke-width', (3.4 * (1 - k) + .4).toFixed(2)); c.setAttribute('opacity', ((1 - k) * (grade === 'off' ? .5 : .95)).toFixed(2));
  }).then(() => c.remove());
  if (grade === 'perfect' && halo) tw(reduce ? 120 : 520, (k) => halo.setAttribute('opacity', (Math.sin(k * Math.PI) * .9).toFixed(2)));
}

// 節拍器。拍點在 phase = 0；第一下敲的時候才開始算（第一下一定準）
export function makeChant({ bpm = 72, perfect = 90, good = 200 } = {}) {
  let per = 60000 / bpm, t0 = 0, on = false;
  const phase = (now) => (on ? ((((now - t0) % per) + per) % per) / per : 0);
  return {
    get on() { return on; },
    get per() { return per; },
    start(now = performance.now()) { t0 = now; on = true; },
    stop() { on = false; },
    setBpm(b) { const now = performance.now(), ph = phase(now); per = 60000 / b; if (on) t0 = now - ph * per; },
    phase,
    // 這一下離最近的拍點多遠（毫秒，負的是太早）
    judge(now = performance.now()) {
      if (!on) { this.start(now); return { off: 0, grade: 'perfect' }; }
      const ph = phase(now), off = (ph > .5 ? ph - 1 : ph) * per, a = Math.abs(off);
      return { off, grade: a < perfect ? 'perfect' : a < good ? 'good' : 'off' };
    },
    // 引導光圈的半徑：拍點時剛好貼著木魚，拍與拍之間從外面慢慢縮進來
    ring(now, r0 = 56, r1 = 120) { const ph = phase(now); return r0 + (r1 - r0) * (1 - ph); },
  };
}

// 第一批節慶小遊戲：冬至（搓湯圓、下鍋、拜神明祖先）、送神、除夕、春節（初一～初五）
// 座標 360 × 645。道具有 Gemini 圖（src/assets/fest/<key>.webp）就用圖，沒有先用 SVG 手繪。
import { art, hasArt, artUrl, sitImg, sitArt, clamp, rand, pick, place } from './core.js';
import burnerUrl from '../assets/burner.webp';
import lighterUrl from '../assets/lighter.webp';
import tigerSleepUrl from '../assets/tiger-sleep.webp';
import hongbaoUrl from '../assets/cai/hongbao.webp';
import fruitUrl from '../assets/offer/fruit.webp';
import flowersUrl from '../assets/offer/flowers.webp';
import cakesUrl from '../assets/offer/cakes.webp';
import teaUrl from '../assets/offer/tea.webp';
import mazuUrl from '../assets/gods/mazu.webp';
import caishenUrl from '../assets/gods/caishen.webp';
import bzFishUrl from '../assets/bz/fish.webp';
import bzChickenUrl from '../assets/bz/chicken.webp';
import bzFotiaoUrl from '../assets/bz/fotiao.webp';
import bzKongUrl from '../assets/bz/kong.webp';
import tudiUrl from '../assets/gods/tudigong.webp';

const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// 背景：有 bg-<id> 圖就用，沒有就畫一面暖色牆＋木桌
export function backdrop(id, { wall = ['#F8E1C4', '#EFC9A2'], table = 420, tableColor = ['#C98A55', '#9C5F33'], extra = '', over = '' } = {}) {
  const key = `bg-${id}`;
  const img = art(key, 360, 645, '');
  // 有背景圖時 extra（程式畫的牆面裝飾）不畫，只疊 over（招牌字、遊戲要用到的 id）
  if (img) return `<g transform="translate(180 322.5)">${img}</g>${over}`;
  return `<defs><linearGradient id="wall-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall[0]}"/><stop offset="1" stop-color="${wall[1]}"/></linearGradient>
    <linearGradient id="tab-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tableColor[0]}"/><stop offset="1" stop-color="${tableColor[1]}"/></linearGradient></defs>
    <rect width="360" height="645" fill="url(#wall-${id})"/>
    <path d="M-20 0 L120 0 L40 ${table} L-20 ${table}z" fill="#FFF6D8" opacity=".25"/>
    ${extra}
    ${table < 645 ? `<rect y="${table}" width="360" height="${645 - table}" fill="url(#tab-${id})"/><rect y="${table}" width="360" height="7" fill="#E8B07A" opacity=".8"/>` : ''}`;
}
// 平滑的封閉曲線（湯圓、麵糰）
function blobPath(rs, cx = 0, cy = 0) {
  const n = rs.length, P = rs.map((r, i) => { const a = i / n * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * .92]; });
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
// 回到原位的小動畫
function flyTo(st, el, from, to, ms, s0 = 1, s1 = 1, done) {
  st.tween(ms, (k, e) => place(el, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(k * Math.PI) * 24, s0 + (s1 - s0) * e), done);
}

/* ================= 冬至：搓湯圓 → 下鍋 → 拜神明、拜祖先 → 吃湯圓 ================= */
const TY = { white: ['#FFFBF4', '#E6D3BF'], red: ['#F8A6B4', '#DE7488'] };
const dough = (c) => (w, h) => `<ellipse cy="${h * .3}" rx="${w * .55}" ry="${h * .18}" fill="#C28A5C" opacity=".5"/>
  <path d="M${-w * .45} ${h * .28}C${-w * .5} ${-h * .1} ${-w * .2} ${-h * .45} 0 ${-h * .42}C${w * .25} ${-h * .45} ${w * .5} ${-h * .05} ${w * .45} ${h * .28}Z" fill="${c[0]}" stroke="${c[1]}" stroke-width="2"/>
  <ellipse cx="${-w * .12}" cy="${-h * .2}" rx="${w * .12}" ry="${h * .08}" fill="#FFF" opacity=".7"/>`;
const bowl = (w, h) => `<ellipse cy="${-h * .18}" rx="${w * .5}" ry="${h * .16}" fill="#F3C9A8"/>
  <path d="M${-w * .5} ${-h * .18}C${-w * .45} ${h * .38} ${w * .45} ${h * .38} ${w * .5} ${-h * .18}Z" fill="#FFFFFF" stroke="#D9C2AA" stroke-width="2"/>
  <path d="M${-w * .34} ${h * .02}h${w * .68}" stroke="#4A8ACB" stroke-width="3" stroke-dasharray="6 5"/>
  <rect x="${-w * .18}" y="${h * .3}" width="${w * .36}" height="${h * .1}" rx="3" fill="#E9DCCB"/>`;
const ty = (c, r = 11) => `<circle r="${r}" fill="${TY[c][0]}" stroke="${TY[c][1]}" stroke-width="1.6"/><ellipse cx="${-r * .32}" cy="${-r * .36}" rx="${r * .3}" ry="${r * .19}" fill="#FFF" opacity=".8"/>`;
// 竹篩（放搓好的生湯圓）
const sieve = (w, h) => `<ellipse cy="${h * .12}" rx="${w * .5}" ry="${h * .36}" fill="#B98543"/>
  <ellipse rx="${w * .5}" ry="${h * .36}" fill="#E7C27E" stroke="#A8732F" stroke-width="3"/>
  <ellipse rx="${w * .42}" ry="${h * .28}" fill="none" stroke="#C99A55" stroke-width="1.5" stroke-dasharray="3 3"/>
  <path d="M${-w * .4} 0h${w * .8}M0 ${-h * .27}v${h * .54}" stroke="#C99A55" stroke-width="1" opacity=".6"/>`;
// 湯鍋＋瓦斯爐
// 揉湯圓的圓木板（斜看是橢圓）：邊框厚度、木紋、撒一點麵粉
const board = `<ellipse cy="9" rx="96" ry="31" fill="#8A5A2E"/><ellipse rx="96" ry="31" fill="#D9A866"/><ellipse rx="88" ry="27" fill="#E6BC7E"/>
  ${[18, 34, 52, 70].map((r) => `<ellipse rx="${r}" ry="${(r * .3).toFixed(1)}" fill="none" stroke="#C99A5C" stroke-width="1.2" opacity=".6"/>`).join('')}
  ${[[-46, -6, 16], [32, 8, 12], [-10, 12, 9], [54, -10, 8], [-62, 10, 7]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * .35).toFixed(1)}" fill="#FFFDF6" opacity=".55"/>`).join('')}`;
const pot = (w, h) => `<rect x="${-w * .42}" y="${h * .28}" width="${w * .84}" height="${h * .2}" rx="8" fill="#3E3A38"/>
  <g class="dz-flame">${[-.22, 0, .22].map((k) => `<path d="M${w * k - 7} ${h * .3}Q${w * k} ${h * .12} ${w * k + 7} ${h * .3}Z" fill="#5AA8FF" opacity=".9"/>`).join('')}</g>
  <path d="M${-w * .46} ${-h * .12}L${-w * .4} ${h * .3}Q0 ${h * .4} ${w * .4} ${h * .3}L${w * .46} ${-h * .12}Z" fill="#8C8F96" stroke="#5E6168" stroke-width="2"/>
  <rect x="${-w * .58}" y="${-h * .06}" width="${w * .14}" height="${h * .07}" rx="4" fill="#3E3A38"/><rect x="${w * .44}" y="${-h * .06}" width="${w * .14}" height="${h * .07}" rx="4" fill="#3E3A38"/>
  <ellipse cy="${-h * .12}" rx="${w * .46}" ry="${h * .14}" fill="#B7BAC0" stroke="#5E6168" stroke-width="2"/>`;
// 祖先牌位
const tablet = (w, h) => `<rect x="${-w * .5}" y="${h * .36}" width="${w}" height="${h * .14}" rx="3" fill="#7A2E1A"/>
  <path d="M${-w * .4} ${h * .38}V${-h * .32}Q0 ${-h * .56} ${w * .4} ${-h * .32}V${h * .38}Z" fill="#9C3A20" stroke="#E2B04A" stroke-width="3"/>
  <rect x="${-w * .26}" y="${-h * .3}" width="${w * .52}" height="${h * .64}" rx="3" fill="#2A120A" stroke="#E2B04A" stroke-width="1.5"/>
  ${[...'歷代祖先'].map((c, i) => `<text y="${-h * .19 + i * h * .155}" text-anchor="middle" class="dz-tab">${c}</text>`).join('')}`;
// 小香爐＋三炷香
const censer = (lit) => `<g><path d="M-14 0h28l-4 14h-20z" fill="#B8892E" stroke="#7A5418" stroke-width="1.5"/><rect x="-16" y="-4" width="32" height="6" rx="3" fill="#D9A93F"/>
  ${lit ? [-5, 0, 5].map((x) => `<line x1="${x}" y1="-4" x2="${x * 1.6}" y2="-34" stroke="#8C3A1C" stroke-width="2"/><circle cx="${x * 1.6}" cy="-34" r="2" fill="#FF7A2E"/>`).join('') : ''}</g>`;

const dongzhi = {
  play(st, o) {
    const N = 6, BOARD = [180, 318], PAD = [180, 452], SIEVE = [272, 566], POT = [180, 440];
    const WY = hasArt('dz-pot') ? -54 : -20; // 鍋裡水面的高度（對齊 dz-pot 圖裡的水）
    const DOUGH = { white: [64, 560], red: [146, 578] };
    let phase = 'pick', made = 0, color = 'white', acc = 0, need = 0, lastA = null, jit = [], ballPos = [...BOARD], balls = [];
    const sign = `<g transform="translate(180 120)"><rect x="-58" y="-34" width="116" height="68" rx="6" fill="#E0443E"/><text y="12" text-anchor="middle" class="fest-sign">冬至</text></g>`;
    st.set(`${backdrop('dongzhi', { table: 250, extra: sign, over: `<text x="180" y="132" text-anchor="middle" class="fest-sign">冬至</text>` })}
      <g id="kitchen">
        <g transform="translate(${BOARD[0]} ${BOARD[1] + 14})">${hasArt('dz-board') ? art('dz-board', 200, 90, '') : board}</g>
        <circle id="pad" cx="${PAD[0]}" cy="${PAD[1]}" r="54" fill="rgb(255 244 216 / .12)" stroke="#FFF4D8" stroke-width="3" stroke-dasharray="8 8" opacity="0"/>
        <path id="padArrow" d="M${PAD[0] + 54} ${PAD[1] - 6}l-7 10h14z" fill="#FFF4D8" opacity="0"/>
        <text id="padTxt" x="${PAD[0]}" y="${PAD[1] + 6}" text-anchor="middle" class="fest-tip" opacity="0">手指在這裡畫圈</text>
        <g id="sieve" transform="translate(${SIEVE[0]} ${SIEVE[1]})">${art('dz-sieve', 132, 80, sieve)}<g id="onSieve"></g></g>
        <g class="fest-hit" data-c="white" transform="translate(${DOUGH.white[0]} ${DOUGH.white[1]})">${art('dz-dough-white', 92, 66, dough(TY.white))}</g>
        <g class="fest-hit" data-c="red" transform="translate(${DOUGH.red[0]} ${DOUGH.red[1]})">${art('dz-dough-red', 92, 66, dough(TY.red))}</g>
      </g>
      <g id="cook" style="display:none">
        <g transform="translate(${POT[0]} ${POT[1]})">${art('dz-pot', 300, 300, pot)}
          <clipPath id="dzWater"><ellipse cy="${WY}" rx="86" ry="27"/></clipPath>
          ${hasArt('dz-pot') ? '' : `<ellipse cy="${WY}" rx="86" ry="27" fill="#DCEAF0"/>`}
          <g clip-path="url(#dzWater)"><g id="inPot"></g>
            <ellipse cy="${WY + 4}" rx="86" ry="27" fill="#BFD8E2" opacity=".28"/>
            <g id="ripples" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".7"></g></g>
        </g>
        <g id="bowls"></g>
      </g>
      <g id="ball" style="display:none" filter="url(#fToy)"><path id="ballP"/><ellipse cx="-8" cy="-10" rx="7" ry="4.5" fill="#FFF" opacity=".75"/></g>`);
    const ball = st.$('#ball'), ballP = st.$('#ballP');
    st.progress(0, N);
    const shape = (p) => {
      const R = 26 - 4 * p;
      ballP.setAttribute('d', blobPath(jit.map((j) => R * (1 + j * (1 - p) * (1 - p)))));
      ballP.setAttribute('fill', TY[color][0]); ballP.setAttribute('stroke', TY[color][1]); ballP.setAttribute('stroke-width', '2');
    };
    const padOn = (v) => ['#pad', '#padTxt', '#padArrow'].forEach((s) => st.$(s).setAttribute('opacity', v ? '1' : '0'));
    const hint = () => {
      const w = balls.filter((c) => c === 'white').length, r = balls.length - w, left = N - made;
      const tip = made === 0 ? '冬至搓湯圓，吃了就長一歲。先點一團麵糰，白的或紅的都可以。'
        : (w === 0 && left <= 3) ? `還差 ${left} 顆，記得也搓幾顆<b>白的</b>，紅白都有才吉利。`
          : (r === 0 && left <= 3) ? `還差 ${left} 顆，記得也搓幾顆<b>紅的</b>，紅白都有才吉利。`
            : `第 ${made + 1} 顆（共 ${N} 顆），再點一團麵糰。`;
      st.say(tip, 'temple');
    };
    hint();
    st.buttons([]);

    /* ---------- 1. 搓湯圓 ---------- */
    st.world.addEventListener('click', (e) => {
      const g = e.target.closest('[data-c]');
      if (!g || phase !== 'pick') return;
      color = g.dataset.c; jit = Array.from({ length: 10 }, () => rand(-.38, .38)); acc = 0; lastA = null;
      need = Math.PI * 2 * (made === 0 ? 3 : 2); // 第一顆搓三圈，之後兩圈
      ballPos = [...BOARD]; ball.style.display = ''; shape(0);
      flyTo(st, ball, DOUGH[color], BOARD, 420, .5, 1);
      st.sfx.pop(); phase = 'rub'; padOn(true);
      st.zoom(180, 392, 250);
      st.say(`手指在湯圓<b>下面</b>的圈圈裡畫圈，麵糰就會被搓圓。${made === 0 ? '搓三圈' : '兩圈'}就好。`, 'temple');
      st.buttons([{ label: '幫我搓圓', on: () => { acc = 99; rubbed(); } }]);
    });
    function rubbed() {
      if (phase !== 'rub') return;
      phase = 'carry'; shape(1); place(ball, ...BOARD); padOn(false);
      st.burst('star', BOARD[0], BOARD[1], 12, { color: '#FFF3B0' }); st.sfx.chime();
      st.reset();
      st.say('圓滾滾！按住湯圓，把它放到右下角的<b>竹篩</b>上。', 'temple');
      st.buttons([{ label: '放到竹篩', on: () => drop(true) }]);
    }
    // 畫圈：以圈圈中心算角度，轉多少累積多少（手指在湯圓下面，不會擋住）
    st.touch({
      down() { lastA = null; },
      move(p) {
        if (phase !== 'rub') return;
        const dx = p.x - PAD[0], dy = p.y - PAD[1], r = Math.hypot(dx, dy);
        if (r < 10 || r > 140) { lastA = null; return; }
        const a = Math.atan2(dy, dx);
        if (lastA !== null) { let d = a - lastA; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; acc += Math.abs(d); }
        lastA = a;
        const p01 = clamp(acc / need, 0, 1);
        shape(p01);
        place(ball, BOARD[0] + Math.cos(a) * 6 * (1 - p01 * .5), BOARD[1] + Math.sin(a) * 3, 1, Math.cos(a) * 10);
        if (Math.random() < .08) st.emit('spark', BOARD[0] + rand(-20, 20), BOARD[1] + rand(-10, 14), { color: '#FFFFFF', speed: 20, life: .5 });
        if (p01 >= 1) rubbed();
      },
    });
    const SLOTS = [[-36, -6], [-12, -12], [12, -12], [36, -6], [-22, 10], [2, 6], [26, 10]];
    st.hold(ball, {
      magnet: () => (phase === 'carry' ? [SIEVE[0], SIEVE[1] - 6, 64] : null),
      onStart() { if (phase === 'carry') st.zoom(232, 480, 270); },
      onMove(x, y) { if (phase !== 'carry') return; ballPos = [x, y]; place(ball, x, y, .85); },
      onUp() { if (phase === 'carry') drop(D(ballPos, [SIEVE[0], SIEVE[1] - 6]) < 44); },
    });
    function drop(ok) {
      if (phase !== 'carry') return;
      if (!ok) { flyTo(st, ball, ballPos, BOARD, 300, .85, 1); st.reset(); return; }
      phase = 'pick'; ball.style.display = 'none';
      const [sx, sy] = SLOTS[made]; made++; balls.push(color);
      st.$('#onSieve').insertAdjacentHTML('beforeend', `<g transform="translate(${sx} ${sy})">${ty(color, 11)}</g>`);
      st.sfx.pop(); st.burst('spark', SIEVE[0], SIEVE[1] - 10, 8);
      st.progress(made, N); st.reset();
      if (made < N) { st.buttons([]); hint(); return; }
      startCook();
    }

    /* ---------- 2. 下鍋：倒進滾水，浮起來就熟了 ---------- */
    let floatT = 0;
    function startCook() {
      phase = 'pour';
      ['[data-c="white"]', '[data-c="red"]'].forEach((s) => { const el = st.$(s); st.tween(300, (k) => el.setAttribute('opacity', 1 - k), () => { el.style.display = 'none'; }); });
      st.$('#kitchen > g:first-child').style.display = 'none';
      st.$('#cook').style.display = '';
      const sv = st.$('#sieve'); sv.classList.add('fest-hit');
      const steamy = () => { if (!st.alive || phase === 'offer' || phase === 'end') return; st.emit('steam', POT[0] + rand(-70, 70), POT[1] - 30, { vx: rand(-6, 6), vy: -28, life: 1.4, s0: .5, s1: 1.5, fade: true }); st.later(phase === 'boil' ? 160 : 420, steamy); };
      steamy();
      st.zoom(200, 470, 300);
      st.say('六顆都搓好了！水滾了，按住<b>竹篩</b>，倒進鍋子裡。', 'temple');
      st.buttons([{ label: '倒進鍋裡', on: () => pour(true) }]);
      let pos = [...SIEVE];
      st.hold(sv, {
        magnet: () => (phase === 'pour' ? [POT[0], POT[1] + WY - 10, 80] : null),
        onMove(x, y) { if (phase !== 'pour') return; pos = [x, y]; place(sv, x, y, .9, clamp((SIEVE[1] - y) / 6, 0, 30)); },
        onUp() { if (phase !== 'pour') return; if (D(pos, [POT[0], POT[1] + WY - 10]) < 60) pour(true); else flyTo(st, sv, pos, SIEVE, 300, .9, 1); },
      });
    }
    function pour() {
      if (phase !== 'pour') return;
      phase = 'boil';
      const sv = st.$('#sieve');
      st.tween(380, (k, e) => { place(sv, POT[0] + 40, POT[1] - 80, .9, 40 * e); sv.setAttribute('opacity', 1 - k * .2); }, () => {
        st.$('#onSieve').innerHTML = '';
        st.tween(300, (k) => sv.setAttribute('opacity', .8 * (1 - k)), () => { sv.style.display = 'none'; });
      });
      const inPot = st.$('#inPot');
      inPot.innerHTML = balls.map((c, i) => `<g data-k="${i}" opacity=".45">${ty(c, 12)}</g>`).join('');
      const kids = [...inPot.children], X = balls.map((_, i) => -55 + i * 22 + rand(-4, 4)), up = balls.map(() => false);
      // 水面的小漣漪：湯圓浮上來的地方一圈一圈散開
      const rip = st.$('#ripples'), ring = (x) => { rip.insertAdjacentHTML('beforeend', `<ellipse cx="${x}" cy="${WY}" rx="4" ry="1.5"/>`); const e = rip.lastElementChild; st.tween(900, (k) => { e.setAttribute('rx', (4 + k * 22).toFixed(1)); e.setAttribute('ry', (1.5 + k * 7).toFixed(1)); e.setAttribute('opacity', (1 - k).toFixed(2)); }, () => e.remove()); };
      st.sfx.bowl?.(); st.burst('spark', POT[0], POT[1] - 30, 14, { color: '#FFFFFF' });
      st.zoom(180, 420, 250);
      st.say('湯圓沉到鍋底了。等它們一顆一顆<b>浮起來</b>，就是煮熟了。', 'temple');
      st.buttons([]);
      // 沉在底下（看起來淡淡的）→ 一顆一顆浮上水面，在水面上輕輕晃
      const t0 = performance.now();
      const loop = (t) => {
        if (!st.alive || phase === 'offer' || phase === 'end') return;
        const s = (t - t0) / 1000;
        kids.forEach((k, i) => {
          const rise = clamp((s - .8 - i * .45) / .6, 0, 1);
          if (rise >= 1 && !up[i]) { up[i] = true; st.sfx.pop(); ring(X[i]); }
          k.setAttribute('opacity', (.45 + .55 * rise).toFixed(2));
          place(k, X[i] + Math.sin(s * 2 + i) * 3, WY + 14 - 14 * rise + Math.sin(s * 3 + i * 1.7) * 1.5 * rise, .85 + .15 * rise);
        });
        if (Math.random() < .06) ring(rand(-70, 70));
        if (up.every(Boolean) && phase === 'boil') ready();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    function ready() {
      phase = 'scoop';
      st.reset();
      st.say('全部浮起來，熟了！盛成<b>三碗</b>：一碗拜神明、一碗拜祖先、一碗自己吃。點鍋子盛起來。', 'temple');
      const scoop = () => serve();
      st.buttons([{ label: '盛三碗', primary: true, on: scoop }]);
      const pt = st.$('#cook > g'); pt.classList.add('fest-hit'); pt.addEventListener('click', scoop, { once: true });
    }
    /* ---------- 3. 盛三碗，端去拜 ---------- */
    const BW = [[84, 560], [180, 574], [276, 560]];
    const bowlHtml = (cs) => `${art('dz-bowl', 96, 81, bowl)}<g transform="translate(0 -16)">${cs.map((c, i) => `<g transform="translate(${(i - (cs.length - 1) / 2) * 20} ${i % 2 ? -3 : 0})">${ty(c, 9.5)}</g>`).join('')}</g>`;
    function serve() {
      if (phase !== 'scoop') return;
      phase = 'serve';
      st.$('#inPot').innerHTML = '';
      // 紅白盡量平均分到三碗
      const sorted = [...balls].sort(), per = [[], [], []];
      sorted.forEach((c, i) => per[i % 3].push(c));
      st.$('#bowls').innerHTML = per.map((cs, i) => `<g data-b="${i}" transform="translate(${BW[i][0]} ${BW[i][1]})">${bowlHtml(cs)}</g>`).join('');
      per.forEach((_, i) => { const b = st.$(`[data-b="${i}"]`); st.tween(360, (k, e) => place(b, BW[i][0], BW[i][1] + 30 * (1 - e), .6 + .4 * e)); });
      st.sfx.chime();
      st.later(700, offer);
      offer.per = per;
    }

    /* ---------- 4. 拜神明、拜祖先 ---------- */
    const GOD = [100, 352], ANC = [262, 352];
    function offer() {
      phase = 'offer';
      st.$('#kitchen').style.display = 'none';
      const pot = st.$('#cook > g'); pot.style.display = 'none';
      st.add(`<g id="altar">
        ${hasArt('bg-dongzhi-altar') ? `<g transform="translate(180 322.5)">${art('bg-dongzhi-altar', 360, 645, '')}</g><text x="180" y="120" text-anchor="middle" class="fest-sign" style="font-size:22px">冬至圓</text>` : `
        <rect width="360" height="645" fill="#8E3324"/>
        <rect width="360" height="300" fill="#B5432E"/><path d="M0 300h360" stroke="#E2B04A" stroke-width="4"/>
        <g transform="translate(180 54)"><rect x="-70" y="-24" width="140" height="44" rx="6" fill="#E0443E" stroke="#E2B04A" stroke-width="2"/><text y="8" text-anchor="middle" class="fest-sign" style="font-size:22px">冬至圓</text></g>
        <path d="M18 316h324l-10 30H28z" fill="#6E2A14"/><rect x="28" y="346" width="304" height="140" fill="#7E3418"/>
        <rect x="28" y="346" width="304" height="8" fill="#9C4A24"/>`}
        <g transform="translate(${GOD[0]} 214)"><ellipse cy="96" rx="58" ry="10" fill="#000" opacity=".2"/><image href="${mazuUrl}" x="-56" y="-104" width="112" height="204" preserveAspectRatio="xMidYMax meet"/></g>
        <g transform="translate(${ANC[0]} 236)">${art('dz-tablet', 92, 150, tablet)}</g>
        ${[[GOD[0], '拜神明'], [ANC[0], '拜祖先']].map(([x, t]) => `<g transform="translate(${x} 420)"><rect x="-38" y="-15" width="76" height="30" rx="5" fill="#E0443E" stroke="#E2B04A" stroke-width="2"/><text y="6" text-anchor="middle" class="fest-small" fill="#FFE29A">${t}</text></g>`).join('')}
        <g id="cenG" transform="translate(${GOD[0] + 44} 330)">${censer(false)}</g><g id="cenA" transform="translate(${ANC[0] - 44} 330)">${censer(false)}</g>
        <ellipse id="spotG" cx="${GOD[0]}" cy="${GOD[1] + 4}" rx="44" ry="12" fill="none" stroke="#FFE29A" stroke-width="3" stroke-dasharray="7 6"/>
        <ellipse id="spotA" cx="${ANC[0]}" cy="${ANC[1] + 4}" rx="44" ry="12" fill="none" stroke="#FFE29A" stroke-width="3" stroke-dasharray="7 6"/>
        ${hasArt('bg-dongzhi-altar') ? '' : '<rect y="486" width="360" height="160" fill="#C98A55"/><rect y="486" width="360" height="7" fill="#E8B07A"/>'}
        <g id="me" transform="translate(180 470)" opacity="0"><image href="${o.me.kneel}" x="-62" y="-136" width="124" height="136" preserveAspectRatio="xMidYMax meet"/></g>
      </g>`);
      // 碗搬到最上層（蓋在供桌上面）
      const bowlsG = st.$('#bowls'); st.world.appendChild(bowlsG);
      st.$('#cook').style.display = 'none'; bowlsG.style.display = '';
      st.say('端一碗給<b>神明</b>、一碗給<b>祖先</b>：按住碗，放到供桌上發亮的位置。冬至祭祖是台灣的老習俗，謝謝祖先保佑一整年。', 'temple');
      st.progress(0, 3);
      const placed = { G: null, A: null };
      [0, 1, 2].forEach((i) => {
        const b = st.$(`[data-b="${i}"]`); b.classList.add('fest-hit');
        let pos = [...BW[i]];
        const free = () => !Object.values(placed).includes(i);
        const near = () => { const g = D(pos, GOD), a = D(pos, ANC); return !placed.G && g < 60 && g <= a ? 'G' : !placed.A && a < 60 ? 'A' : null; };
        st.hold(b, {
          magnet: () => { if (phase !== 'offer' || !free()) return null; const g = D(pos, GOD), a = D(pos, ANC); return !placed.G && (g < a || placed.A) ? [...GOD, 70] : !placed.A ? [...ANC, 70] : null; },
          onStart() { if (phase === 'offer' && free()) st.zoom(180, 400, 330); },
          onMove(x, y) { if (phase !== 'offer' || !free()) return; pos = [x, y]; place(b, x, y, .8); },
          onUp() {
            if (phase !== 'offer' || !free()) return;
            const k = near();
            if (k) setDown(i, k); else { flyTo(st, b, pos, BW[i], 300, .8, 1); st.reset(); }
          },
        });
      });
      const setDown = (i, k) => {
        placed[k] = i;
        const b = st.$(`[data-b="${i}"]`), to0 = k === 'G' ? GOD : ANC, to = [to0[0], to0[1] - 26]; // 碗底對齊桌面（碗圖是置中的，往上提半個碗高）
        place(b, ...to, .8); b.classList.remove('fest-hit');
        st.$(k === 'G' ? '#spotG' : '#spotA').style.display = 'none';
        st.burst('star', to[0], to[1] - 20, 10, { color: '#FFE29A' }); st.sfx.chime();
        st.reset();
        const n = (placed.G !== null) + (placed.A !== null);
        st.progress(n, 3);
        if (n < 2) { st.say(k === 'G' ? '神明那碗擺好了，再端一碗給<b>祖先</b>。' : '祖先那碗擺好了，再端一碗給<b>神明</b>。', 'temple'); return; }
        pray();
      };
      // 不方便拖的人：一鍵擺好
      st.buttons([{ label: '幫我擺上供桌', on: () => {
        if (phase !== 'offer') return;
        const left = [0, 1, 2].filter((i) => !Object.values(placed).includes(i));
        if (placed.G === null) setDown(left.shift(), 'G');
        if (placed.A === null && phase === 'offer') setDown(left.shift(), 'A');
      } }]);
    }
    function pray() {
      phase = 'pray';
      ['#cenG', '#cenA'].forEach((s) => { st.$(s).innerHTML = censer(true); });
      const me = st.$('#me');
      st.tween(400, (k) => me.setAttribute('opacity', k));
      let bows = 0;
      st.say('點好香了。點你自己，或按「拜一拜」，<b>拜三拜</b>：謝謝神明照顧，也跟祖先說說這一年過得怎樣。', 'temple');
      const bow = () => {
        if (phase !== 'pray') return;
        bows++; st.sfx.knock();
        st.tween(520, (k) => { const d = Math.sin(k * Math.PI); me.setAttribute('transform', `translate(180 470) translate(0 ${d * 6}) scale(1 ${1 - d * .1})`); });
        st.floatText(`第${'一二三'[bows - 1]}拜`, 180, 320);
        [GOD, ANC].forEach(([x]) => st.emit('smoke', x + (x < 180 ? 44 : -44), 296, { vx: rand(-4, 4), vy: -20, life: 1.6, s0: .6, s1: 1.4, fade: true }));
        st.progress(2 + (bows >= 3), 3);
        if (bows >= 3) { phase = 'eat'; st.later(600, eatTime); }
      };
      me.classList.add('fest-hit'); me.addEventListener('click', bow);
      st.buttons([{ label: '拜一拜', primary: true, on: bow }]);
    }
    /* ---------- 5. 吃湯圓，長一歲 ---------- */
    function eatTime() {
      const left = [0, 1, 2].find((i) => st.$(`[data-b="${i}"]`).classList.contains('fest-hit'));
      const b = st.$(`[data-b="${left}"]`);
      st.zoom(BW[left][0], 520, 260);
      st.say('拜好了。剩下這碗是你的，點碗吃湯圓！吃了冬至圓，就長一歲。', 'temple');
      const eat = () => {
        if (phase !== 'eat') return;
        phase = 'end';
        const kids = [...b.querySelectorAll(':scope > g:last-child > g')];
        kids.forEach((k, i) => st.later(300 * i, () => { k.remove(); st.sfx.pop(); st.floatText(i === kids.length - 1 ? '+1 歲' : '好Q', BW[left][0], BW[left][1] - 60); }));
        st.later(300 * kids.length + 500, () => { st.reset(); o.done('冬至圓吃完，又長一歲囉。神明和祖先都收到你的心意了。冬天夜長，早點休息、手腳顧暖。'); });
      };
      b.addEventListener('click', eat, { once: true });
      st.buttons([{ label: '吃湯圓', primary: true, on: eat }]);
    }
  },
};

/* ================= 送神：麥芽糖黏灶君嘴、擦神桌 ================= */
const zaojun = (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="4" fill="#F7E7C6" stroke="#C8382E" stroke-width="6"/>
  <g id="zjFig">
    <path d="M-44 70 Q-46 20 0 14 Q46 20 44 70Z" fill="#D2483C"/><path d="M-10 18 L0 60 L10 18" fill="#F3C64A"/>
    <circle cy="-14" r="34" fill="#FFE0C4"/>
    <path d="M-40 -34 Q0 -70 40 -34 L36 -26 Q0 -50 -36 -26Z" fill="#2E2A3A"/><rect x="-46" y="-34" width="92" height="7" rx="3" fill="#2E2A3A"/>
    <circle cx="-12" cy="-18" r="3.6" fill="#3B1F17"/><circle cx="12" cy="-18" r="3.6" fill="#3B1F17"/>
    <ellipse cx="-20" cy="-6" rx="6" ry="3.5" fill="#F79B8E" opacity=".6"/><ellipse cx="20" cy="-6" rx="6" ry="3.5" fill="#F79B8E" opacity=".6"/>
    <path d="M-16 4 Q-22 34 0 40 Q22 34 16 4 Q0 12 -16 4Z" fill="#3B3B3B"/>
    <path id="zjMouth" d="M-7 4 Q0 2 7 4" stroke="#7A2A20" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  </g>
  <text y="${h / 2 - 12}" text-anchor="middle" class="fest-small" fill="#C8382E">司命灶君</text>`;
const jar = (w, h) => `<ellipse cy="${h * .38}" rx="${w * .42}" ry="${h * .08}" fill="#7A4A24" opacity=".35"/>
  <path d="M${-w * .38} ${-h * .18}Q${-w * .5} ${h * .4} 0 ${h * .4}Q${w * .5} ${h * .4} ${w * .38} ${-h * .18}Z" fill="#C88A4A" stroke="#8A5A2E" stroke-width="2"/>
  <ellipse cy="${-h * .2}" rx="${w * .34}" ry="${h * .08}" fill="#E8A030" stroke="#8A5A2E" stroke-width="2"/>
  <rect x="${-w * .18}" y="${-h * .02}" width="${w * .36}" height="${h * .22}" fill="#E0443E"/><text y="${h * .16}" text-anchor="middle" class="fest-small" fill="#FFE29A">糖</text>`;
const brush = () => `<rect x="-20" y="-10" width="40" height="80" fill="#000" opacity="0"/><path d="M0 0 L-5 -2 L-4 10 L4 10 L5 -2Z" fill="#F3E2C0" stroke="#8A6234" stroke-width="1"/><circle id="brushTip" cy="-1" r="4.4" fill="#E8A030" opacity="0"/><rect x="-3" y="10" width="6" height="58" rx="3" fill="#B0703E"/>`;
const duster = () => {
  if (hasArt('ss-duster')) return `<rect x="-26" y="-60" width="52" height="144" fill="#000" opacity="0"/><g transform="translate(0 -5)">${art('ss-duster', 57, 130, '')}</g>`;
  // 雞毛撢子：木柄＋一束放射狀的雞毛（橘、褐、米白），底部紅線綁紮，柄尾有紅穗
  const cols = ['#8A4A22', '#B8662E', '#D9893C', '#E8B46A', '#F3D9A8', '#C9772F'];
  const feather = (a, len, c, w) => `<g transform="rotate(${a} 0 8)"><path d="M0 8 C${-w} ${8 - len * .3} ${-w * 1.1} ${8 - len * .75} 0 ${8 - len} C${w * 1.1} ${8 - len * .75} ${w} ${8 - len * .3} 0 8Z" fill="${c}" stroke="#6A3A18" stroke-width=".9"/><path d="M0 8 L0 ${8 - len + 4}" stroke="#5A2E12" stroke-width="1.1" opacity=".7"/><path d="M0 ${8 - len * .3} L${-w * .8} ${8 - len * .45} M0 ${8 - len * .5} L${w * .85} ${8 - len * .64} M0 ${8 - len * .68} L${-w * .6} ${8 - len * .8}" stroke="#FFF2D0" stroke-width=".9" opacity=".55" fill="none"/></g>`;
  const back = [-58, -40, -22, -4, 14, 32, 50].map((a, k) => feather(a, 54 - Math.abs(a) * .18, cols[k % 3], 8)).join('');
  const front = [-48, -30, -12, 6, 24, 42].map((a, k) => feather(a, 44 - Math.abs(a) * .15, cols[3 + (k % 3)], 7)).join('');
  return `<rect x="-26" y="-60" width="52" height="144" fill="#000" opacity="0"/><ellipse cy="82" rx="10" ry="3" fill="#000" opacity=".15"/>${back}${front}<path d="M-6 8 L6 8 L5 20 L-5 20Z" fill="#B8301E" stroke="#7A1E12" stroke-width="1"/><path d="M-5 11 H5 M-5 15 H5" stroke="#F3C64A" stroke-width="1.2"/><rect x="-3.4" y="18" width="6.8" height="62" rx="3.4" fill="url(#dsHandle)" stroke="#6A3A18" stroke-width="1"/><path d="M-3.4 40 H3.4 M-3.4 60 H3.4" stroke="#6A3A18" stroke-width="1.2"/><circle cy="76" r="1.6" fill="#3A2010"/><path d="M0 78 Q-5 88 -2 96 M0 78 Q5 88 2 96" stroke="#C8382E" stroke-width="1.8" fill="none" stroke-linecap="round"/><defs><linearGradient id="dsHandle" x1="0" x2="1"><stop offset="0" stop-color="#B8844A"/><stop offset=".5" stop-color="#E0B070"/><stop offset="1" stop-color="#8A5A2E"/></linearGradient></defs>`;
};

const songshen = {
  play(st, o) {
    const ZJ_DY = hasArt('ss-zaojun') ? -14 : 4; // Gemini 灶君圖的嘴巴比畫面中心高一點
    const PRINT = [180, 200], MOUTH = [180, 200 + ZJ_DY], JAR = [72, 430], JAR_MOUTH = [72, 378];
    const BR_REST = [292, 400], DU_REST = [296, 478];
    const DUST = [[44, 440], [128, 434], [204, 440], [268, 436], [326, 442], [116, 300], [246, 120]];
    let phase = 'paint', honey = 0, cov = 0, tip = [...BR_REST], dust = DUST.map(() => 1), last = null;
    st.set(`${backdrop('songshen', { wall: ['#EFD8B8', '#D9B48A'], table: 420, extra: `<rect x="0" y="380" width="360" height="44" fill="#A56A3E"/>` })}
      <path d="M112 92 L180 50 L248 92" stroke="#8A5A2E" stroke-width="1.6" fill="none"/><circle cx="180" cy="50" r="3.6" fill="#5A3A1E"/><g id="print" filter="url(#fToy)" transform="translate(${PRINT[0]} ${PRINT[1]})">${art('ss-zaojun', 170, 230, zaojun)}<ellipse id="zjSweet" cx="0" cy="${ZJ_DY}" rx="11" ry="5.5" fill="#E8A030" opacity="0"/></g>
      <g transform="translate(${JAR[0]} ${JAR[1]})">${sitArt('ss-jar', 70, 70, jar, .42)}</g>
      <g id="stove" transform="translate(180 530)"${hasArt('bg-songshen') ? ' style="display:none"' : ''}><rect x="-170" y="-90" width="340" height="200" fill="#B5643C"/><path d="M-170 -50h340M-170 -10h340M-170 30h340M-90 -90v40M40 -90v40M-20 -50v40M110 -50v40M-120 -10v40M60 -10v40" stroke="#8E4A2A" stroke-width="2"/><path d="M-50 110 v-70 a50 50 0 0 1 100 0 v70z" fill="#3A1E12"/><path d="M-26 108c-6-22 8-30 10-42 8 10 4 18 10 24 4-6 2-14 8-18 6 14 10 22 4 36z" fill="#FF8A3A"/></g>
      ${DUST.map(([x, y], i) => `<g id="dust${i}" transform="translate(${x} ${y})"><ellipse rx="20" ry="9" fill="#9A8C80" opacity=".75"/><circle cx="-8" cy="-3" r="5" fill="#B5A79A" opacity=".8"/><circle cx="7" cy="2" r="4" fill="#857668" opacity=".7"/></g>`).join('')}
      <g id="brush" class="fest-hit" transform="translate(${BR_REST[0]} ${BR_REST[1]})" filter="url(#fToy)">${brush()}</g>
      <g id="duster" class="fest-hit" transform="translate(${DU_REST[0]} ${DU_REST[1]})" filter="url(#fToy)" style="display:none">${duster()}</g>`);
    const brushEl = st.$('#brush'), dusterEl = st.$('#duster');
    st.progress(0, 3);
    st.say('臘月廿四送灶神回天庭報告。先拿<b>刷子</b>沾左邊罐子裡的麥芽糖，塗在灶君嘴上，讓祂上天只說好話。', 'temple');
    const paintMouth = (k) => { st.$('#zjSweet').setAttribute('opacity', (k * .9).toFixed(2)); };
    st.buttons([{ label: '幫我塗', on: () => { if (phase === 'paint') { cov = 170; paintMouth(1); sweet(); } } }]);
    st.hold(brushEl, {
      magnet: () => (phase === 'paint' && honey <= 0 ? [...JAR_MOUTH, 40] : null),
      onStart() { if (phase === 'paint') st.zoom(170, 300, 270); last = null; },
      onMove(x, y) {
        if (phase !== 'paint') return;
        tip = [x, y]; place(brushEl, x, y, 1, -18);
        if (D(tip, JAR_MOUTH) < 22 && honey < 1) { honey = 1; st.$('#brushTip').setAttribute('opacity', '1'); st.sfx.pop(); st.say('沾到了，黏黏的。現在塗在灶君的<b>嘴巴</b>上，來回刷幾下。', 'temple'); }
        if (honey > 0 && D(tip, MOUTH) < 24 && last) {
          const m = D(tip, last); cov += m; honey -= m / 240;
          paintMouth(clamp(cov / 170, 0, 1));
          if (Math.random() < .2) st.emit('spark', x, y, { color: '#F3B040', speed: 18, life: .5 });
          if (honey <= 0) { honey = 0; st.$('#brushTip').setAttribute('opacity', '0'); if (cov < 170) st.say('糖用完了，再去罐子沾一點。', 'temple'); }
          if (cov >= 170) sweet();
        }
        last = tip;
      },
      onUp() { if (phase === 'paint') { flyTo(st, brushEl, tip, BR_REST, 300); st.reset(); } },
    });
    function sweet() {
      phase = 'dust'; st.progress(1, 3);
      st.$('#zjMouth')?.setAttribute('d', 'M-9 2 Q0 12 9 2'); // 用 Gemini 灶君圖時沒有這條嘴巴線
      flyTo(st, brushEl, tip, BR_REST, 300); st.reset();
      st.burst('heart', MOUTH[0], MOUTH[1], 8, { color: '#F3B040' }); st.sfx.chime();
      st.floatText('甜甜嘴', MOUTH[0], MOUTH[1] - 60, '#C8382E');
      st.later(700, () => {
        brushEl.style.display = 'none'; dusterEl.style.display = '';
        st.say('灶君嘴甜了。順便大掃除：拿<b>雞毛撢子</b>把桌上和灶君身上的灰塵撢乾淨。', 'temple');
        st.buttons([{ label: '幫我撢', on: () => { dust = dust.map(() => 0); DUST.forEach((_, i) => st.$('#dust' + i).setAttribute('opacity', '0')); clean(); } }]);
      });
      st.buttons([]);
    }
    let dpos = [...DU_REST];
    st.hold(dusterEl, {
      onStart() { last = null; },
      onMove(x, y) {
        if (phase !== 'dust') return;
        dpos = [x, y]; place(dusterEl, x, y, 1, Math.sin(performance.now() / 60) * 10);
        if (last) {
          const m = D(dpos, last);
          DUST.forEach((p, i) => {
            if (dust[i] <= 0 || D(dpos, p) > 30) return;
            dust[i] = Math.max(0, dust[i] - m / 70);
            st.$('#dust' + i).setAttribute('opacity', dust[i].toFixed(2));
            if (Math.random() < .3) st.emit('smoke', p[0] + rand(-8, 8), p[1], { vx: rand(-20, 20), vy: -20, life: .8, s0: .5, s1: 1.2, fade: true });
          });
          if (dust.every((v) => v <= 0)) clean();
        }
        last = dpos;
      },
      onUp() { if (phase === 'dust') flyTo(st, dusterEl, dpos, DU_REST, 300); },
    });
    function clean() {
      if (phase !== 'dust') return;
      phase = 'send'; st.progress(2, 3);
      flyTo(st, dusterEl, dpos, DU_REST, 300);
      st.burst('star', 180, 440, 16); st.sfx.chime();
      st.say('亮晶晶！最後點灶君，或按「恭送灶君」，送祂上天。', 'temple');
      const go = () => {
        if (phase !== 'send') return; phase = 'end'; st.buttons([]);
        const fig = st.$('#zjFig') || st.$('#print'), base = fig.id === 'print' ? `translate(${PRINT[0]} ${PRINT[1]}) ` : '';
        st.sfx.bowl();
        st.tween(1800, (k, e) => {
          fig.setAttribute('transform', `${base}translate(0 ${(-e * 260).toFixed(1)}) scale(${(1 - e * .4).toFixed(3)})`);
          if (Math.random() < .5) st.emit('star', PRINT[0] + rand(-30, 30), PRINT[1] - e * 260 + 40, { vy: 30, vx: rand(-10, 10), life: .7 });
        }, () => {
          fig.setAttribute('opacity', '0');
          st.add(`<text x="${PRINT[0]}" y="${PRINT[1] - 10}" text-anchor="middle" class="fest-sign dark">上天言好事</text><text x="${PRINT[0]}" y="${PRINT[1] + 30}" text-anchor="middle" class="fest-sign dark">回宮降吉祥</text>`);
          st.progress(3, 3);
          o.done('灶君帶著甜甜的嘴上天庭了，會幫你家說好話。除夕晚上記得接神回來。');
        });
      };
      st.$('#print').classList.add('fest-hit'); st.$('#print').addEventListener('click', go);
      st.buttons([{ label: '恭送灶君', primary: true, on: go }]);
    }
  },
};

/* ================= 除夕：貼春聯、拉長年菜 ================= */
const COUPLETS = [
  { up: '天增歲月人增壽', down: '春滿乾坤福滿門', top: '四季平安' },
  { up: '一帆風順年年好', down: '萬事如意步步高', top: '吉星高照' },
  { up: '春回大地千山秀', down: '日照神州百業興', top: '萬象更新' },
  { up: '平安二字值千金', down: '和順一門有百福', top: '家和萬事興' },
];
const vText = (s, x, y0, step) => [...s].map((c, i) => `<text x="${x}" y="${y0 + i * step}" text-anchor="middle" class="fest-cp">${c}</text>`).join('');

const chuxi = {
  play(st, o) {
    const cp = pick(COUPLETS);
    const SLOT = {
      up: { at: [298, 350], w: 36, h: 236, name: '上聯' },   // 面對大門的右手邊
      down: { at: [62, 350], w: 36, h: 236, name: '下聯' },
      top: { at: [180, 104], w: 172, h: 40, name: '橫批' },
      fu: { at: [180, 320], w: 70, h: 70, name: '福' },
    };
    const REST = { top: [70, 528], up: [146, 520], down: [214, 520], fu: [292, 528] };
    const restScale = { top: .42, up: .36, down: .36, fu: .6 };
    const paper = (k) => {
      const s = SLOT[k];
      if (k === 'fu') return `<g><rect x="-30" y="-30" width="60" height="60" fill="#E0443E" stroke="#B02A22" stroke-width="2" transform="rotate(45)"/><text id="fuTxt" y="12" text-anchor="middle" class="fest-fu">福</text></g>`;
      if (k === 'top') return `<rect x="${-s.w / 2}" y="${-s.h / 2}" width="${s.w}" height="${s.h}" fill="#E0443E" stroke="#B02A22" stroke-width="2"/>${[...cp.top].map((c, i, a) => `<text x="${(i - (a.length - 1) / 2) * 30}" y="9" text-anchor="middle" class="fest-cp">${c}</text>`).join('')}`;
      return `<rect x="${-s.w / 2}" y="${-s.h / 2}" width="${s.w}" height="${s.h}" fill="#E0443E" stroke="#B02A22" stroke-width="2"/>${vText(cp[k], 0, -s.h / 2 + 28, 31)}`;
    };
    let placed = new Set(), held = null, pos = [0, 0], fuFlip = false, phase = 'paste';
    st.set(`${backdrop('chuxi', { wall: ['#D8CFC4', '#B9AFA4'], table: 645, extra: `
      <rect x="20" y="60" width="320" height="520" fill="#8A5A3A"/><rect x="40" y="80" width="280" height="500" fill="#6E4128"/>
      <rect x="96" y="150" width="84" height="410" fill="#B8302A" stroke="#7A1E1A" stroke-width="3"/><rect x="180" y="150" width="84" height="410" fill="#B8302A" stroke="#7A1E1A" stroke-width="3"/>
      ${[0, 1, 2, 3, 4].map((r) => [0, 1, 2].map((c) => `<circle cx="${110 + c * 28}" cy="${200 + r * 70}" r="5" fill="#F3C64A"/><circle cx="${194 + c * 28}" cy="${200 + r * 70}" r="5" fill="#F3C64A"/>`).join('')).join('')}
      <circle cx="168" cy="370" r="9" fill="none" stroke="#F3C64A" stroke-width="3"/><circle cx="192" cy="370" r="9" fill="none" stroke="#F3C64A" stroke-width="3"/>
      <rect x="0" y="580" width="360" height="65" fill="#9C8C7A"/>` })}
      ${Object.entries(SLOT).map(([k, s]) => `<rect id="slot-${k}" x="${s.at[0] - s.w / 2}" y="${s.at[1] - s.h / 2}" width="${s.w}" height="${s.h}" fill="none" stroke="#FFF4D8" stroke-width="2.5" stroke-dasharray="7 6" opacity=".75" ${k === 'fu' ? `transform="rotate(45 ${s.at[0]} ${s.at[1]})"` : ''}/>`).join('')}
      ${Object.keys(SLOT).map((k) => `<g id="p-${k}" class="fest-hit" data-k="${k}" filter="url(#fToy)">${paper(k)}</g>`).join('')}`);
    const els = Object.fromEntries(Object.keys(SLOT).map((k) => [k, st.$('#p-' + k)]));
    for (const k in els) place(els[k], ...REST[k], restScale[k]);
    st.progress(0, 5);
    st.say(`除夕貼春聯！按住紅紙拖到門上虛線的位置。<b>上聯貼右邊、下聯貼左邊</b>（面對大門看），橫批在上面，福字貼門中間。`, 'temple');
    for (const k in els) {
      st.hold(els[k], {
        magnet: () => (phase === 'paste' && held === k ? [...SLOT[k].at, 60] : null),
        onStart() { if (phase !== 'paste' || placed.has(k)) return; held = k; st.zoom(SLOT[k].at[0], Math.max(SLOT[k].at[1], 260), 280); },
        onMove(x, y) { if (held !== k) return; pos = [x, y]; place(els[k], x, y, k === 'fu' ? .9 : .7); },
        onUp() {
          if (held !== k) { if (phase === 'fu' && k === 'fu') flip(); return; }
          held = null; st.reset();
          if (D(pos, SLOT[k].at) < 34) {
            placed.add(k); flyTo(st, els[k], pos, SLOT[k].at, 200, .8, 1);
            st.$('#slot-' + k).setAttribute('opacity', '0'); st.sfx.pop(); st.burst('star', ...SLOT[k].at, 8);
            st.progress(placed.size, 5);
            if (placed.size === 4) allUp();
            else st.say(`${SLOT[k].name}貼好了。還有 ${4 - placed.size} 張。`, 'temple');
          } else {
            const near = Object.entries(SLOT).find(([kk, s]) => kk !== k && D(pos, s.at) < 60);
            if (near && (k === 'up' || k === 'down')) st.say(`這張是<b>${SLOT[k].name}</b>，要貼${k === 'up' ? '右' : '左'}邊喔（面對大門看）。上聯最後一個字是仄聲，下聯最後一個字是平聲。`, 'temple');
            flyTo(st, els[k], pos, REST[k], 320, .7, restScale[k]);
          }
        },
      });
    }
    st.buttons([{ label: '幫我貼好', on: () => { for (const k in els) if (!placed.has(k)) { placed.add(k); place(els[k], ...SLOT[k].at); st.$('#slot-' + k).setAttribute('opacity', '0'); } st.progress(4, 5); allUp(); } }]);
    function flip() {
      fuFlip = !fuFlip; st.sfx.pop();
      st.$('#fuTxt').setAttribute('transform', fuFlip ? 'rotate(180 0 -2)' : '');
      st.say(fuFlip ? '福字倒過來，「福<b>到</b>了」！大門正門也有人習慣正貼，都可以。' : '換回正貼。', 'temple');
    }
    function allUp() {
      phase = 'fu';
      st.burst('paper', 180, 300, 30, () => ({ vy: rand(-140, -60), vx: rand(-80, 80), g: 160, life: 1.6, color: pick(['#E0443E', '#F3C64A']) })); st.sfx.chime();
      st.say('春聯貼好了，門口喜氣洋洋。<b>點福字</b>可以倒過來貼。好了就按「圍爐」。', 'temple');
      st.buttons([{ label: '倒貼福字', on: flip }, { label: '圍爐', primary: true, on: dinner }]);
    }
    // 圍爐：長年菜用筷子往上拉，越長越長壽
    function dinner() {
      if (phase === 'veg' || phase === 'end') return;
      phase = 'veg'; st.buttons([]); st.reset(0);
      // 背景圖的圓桌：桌面橢圓中心 (178, 418)，後緣 y≈385、前緣 y≈450。年菜擺在桌上，長年菜在正前方
      const hasBg = hasArt('bg-chuxi-dinner');
      const BOWL = hasBg ? [180, 452] : [180, 548];
      let top = BOWL[1] - 40, tx = 180, lastY = null;
      const DISHES = hasBg ? [[bzFishUrl, 100, 404, 96, 48, '年年有餘'], [bzChickenUrl, 262, 404, 90, 53, '全雞'], [bzFotiaoUrl, 56, 446, 78, 58, '佛跳牆'], [bzKongUrl, 304, 446, 84, 46, '控肉']] : [];
      st.set(`${backdrop('chuxi-dinner', { wall: ['#5A2A20', '#3A1A14'], table: 330, tableColor: ['#B8302A', '#8A2420'], extra: `<ellipse cx="180" cy="470" rx="200" ry="120" fill="#C8463A"/>${[[60, 400, '#F3C64A'], [300, 400, '#E8A06A'], [70, 560, '#9AC46A'], [300, 560, '#F2E2C0']].map(([x, y, c]) => `<g transform="translate(${x} ${y})"><ellipse rx="42" ry="16" fill="#FFF"/><ellipse rx="32" ry="10" fill="${c}"/></g>`).join('')}` })}
        <defs><linearGradient id="vegStem" x1="0" x2="1"><stop offset="0" stop-color="#9ACB6A"/><stop offset=".5" stop-color="#D8EFA8"/><stop offset="1" stop-color="#7AB04E"/></linearGradient>
          <linearGradient id="chopG" x1="0" x2="1"><stop offset="0" stop-color="#8A1A14"/><stop offset=".5" stop-color="#D8443A"/><stop offset="1" stop-color="#7A1410"/></linearGradient></defs>
        ${DISHES.map(([url, x, y, w, h]) => `<g transform="translate(${x} ${y})">${sitImg(url, w, h, .4)}</g>`).join('')}
        <g transform="translate(${BOWL[0]} ${BOWL[1]})">${sitArt('dz-bowl', 104, 76, bowl, .42)}</g>
        <ellipse cx="${BOWL[0]}" cy="${BOWL[1] - 60}" rx="36" ry="8" fill="#5E9A3A"/>
        ${[-22, -8, 8, 22].map((dx, i) => `<ellipse cx="${BOWL[0] + dx}" cy="${BOWL[1] - 63 + (i % 2) * 3}" rx="13" ry="5" fill="${i % 2 ? '#7EBE52' : '#5A9A38'}" transform="rotate(${dx} ${BOWL[0] + dx} ${BOWL[1] - 63})"/>`).join('')}
        <path id="vegS" fill="none" stroke="#4E8A30" stroke-width="10" stroke-linecap="round"/>
        <path id="veg" fill="none" stroke="url(#vegStem)" stroke-width="7" stroke-linecap="round"/>
        <g id="leaves"></g>
        <g id="chop" filter="url(#fToy)"><path d="M-5 0 L-11 -96 M5 0 L11 -96" stroke="url(#chopG)" stroke-width="5.5" stroke-linecap="round"/><path d="M-10.3 -84 L-11 -96 M10.3 -84 L11 -96" stroke="#F3C64A" stroke-width="6" stroke-linecap="round"/></g>
        <g transform="translate(180 74)"><rect x="-62" y="-24" width="124" height="42" rx="8" fill="#B8302A" stroke="#F3C64A" stroke-width="2"/><text y="8" text-anchor="middle" class="fest-sign" style="font-size:24px">長年菜</text></g>`);
      const veg = st.$('#veg'), vegS = st.$('#vegS'), leaves = st.$('#leaves'), chop = st.$('#chop');
      const B0 = [BOWL[0], BOWL[1] - 60];
      // 一整根芥菜：莖從碗裡被筷子拉上來，兩邊交錯長出皺皺的葉子
      const leaf = (x, y, side, sz) => `<path d="M${x} ${y} q${side * sz * .5} ${-sz * .55} ${side * sz * 1.25} ${-sz * .2} q${-side * sz * .1} ${sz * .5} ${-side * sz * .55} ${sz * .62} q${-side * sz * .35} ${sz * .05} ${-side * sz * .7} ${-sz * .42}z" fill="${side > 0 ? '#5FA83E' : '#4E9632'}" stroke="#3A7A26" stroke-width="1"/><path d="M${x} ${y} q${side * sz * .5} ${-sz * .25} ${side * sz * 1.05} ${-sz * .18}" stroke="#CFE9A0" stroke-width="1.2" fill="none"/>`;
      const draw = () => {
        const mx = (B0[0] + tx) / 2 + Math.sin(top / 40) * 12, my = (B0[1] + top) / 2;
        const d = `M${B0[0]} ${B0[1]} Q${mx.toFixed(1)} ${my.toFixed(1)} ${tx.toFixed(1)} ${top.toFixed(1)}`;
        veg.setAttribute('d', d); vegS.setAttribute('d', d);
        const n = Math.floor((B0[1] - top) / 26);
        leaves.innerHTML = Array.from({ length: n }, (_, i) => {
          const k = (i + .6) / Math.max(1, n + .4), u = 1 - k;
          const x = u * u * B0[0] + 2 * u * k * mx + k * k * tx, y = u * u * B0[1] + 2 * u * k * my + k * k * top;
          return leaf(x, y, i % 2 ? 1 : -1, 32 - k * 9);
        }).join('');
        place(chop, tx, top);
      };
      draw();
      st.say('除夕圍爐，長年菜要<b>整根不切</b>。手指按住往上慢慢拉，筷子會夾著菜往上，拉到上面的字就好。', 'temple');
      st.touch({
        down(p) { lastY = p.y; },
        move(p) {
          if (phase !== 'veg') return;
          const want = p.y - st.lift();
          if (want < top) {
            const step = top - want;
            if (step > 26) { st.say('慢慢拉，菜才不會斷。', 'temple'); top -= 26; } else top = want;
          }
          top = Math.max(110, top); tx = clamp(p.x, 120, 240);
          draw();
          if (top <= 120) {
            phase = 'end';
            st.burst('star', tx, top, 18); st.sfx.chime(); st.progress(5, 5);
            st.floatText('長長久久', 180, 140, '#FFE08A');
            st.later(600, () => o.done('長年菜拉得好長，祝全家長命百歲、年年有餘。吃完年夜飯記得守歲。'));
          }
        },
        up() { lastY = null; },
      });
      st.buttons([{ label: '幫我拉', on: () => { const run = () => { if (phase !== 'veg') return; top -= 12; draw(); if (top <= 120) { top = 120; phase = 'end'; st.progress(5, 5); st.sfx.chime(); st.floatText('長長久久', 180, 140, '#FFE08A'); st.later(500, () => o.done('長年菜拉得好長，祝全家長命百歲、年年有餘。')); } else st.later(40, run); }; run(); } }]);
    }
  },
};

/* ================= 春節：初一～初五 ================= */
const sticks = () => `<rect x="-22" y="-80" width="44" height="86" fill="#000" opacity="0"/><path d="M-5 0 L-9 -70 M0 0 L0 -74 M5 0 L9 -70" stroke="#9A4A2E" stroke-width="2.6" stroke-linecap="round"/><path d="M-5 0 L-6 -16 M0 0 L0 -16 M5 0 L6 -16" stroke="#E0443E" stroke-width="3.2" stroke-linecap="round"/><circle cx="-9" cy="-70" r="2.6" fill="#FF6A3A"/><circle cy="-74" r="2.6" fill="#FF6A3A"/><circle cx="9" cy="-70" r="2.6" fill="#FF6A3A"/>`;
const img = (url, w, h) => `<image href="${url}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}"/>`;

const chunjie = {
  days: ['搶頭香', '回娘家發紅包', '赤狗日早早睡', '接神擺四果', '開工放鞭炮'],
  play(st, o) {
    const day = clamp(o.day || 1, 1, 5);
    [touxiang, hongbao, sleepIn, jieshen, kaigong][day - 1](st, o);
  },
};

// 初一：開廟門搶頭香
function touxiang(st, o) {
  const BURNER = [180, 360], MOUTH = [180, 336], REST = [292, 525];
  let phase = 'wait', opened = 0, pos = [...REST], autoGo = false;
  st.set(`${backdrop('chunjie', { wall: ['#F2C9A0', '#D8986A'], table: 430, tableColor: ['#B8302A', '#8A2420'] })}
    <g transform="translate(${BURNER[0]} ${BURNER[1] + 20})">${img(burnerUrl, 170, 125)}</g>
    <g id="planted" style="display:none" transform="translate(${MOUTH[0]} ${MOUTH[1] + 6})">${sticks()}</g>
    <g id="sticks" class="fest-hit" filter="url(#fToy)" style="display:none">${sticks()}</g>
    ${hasArt('cj-door') ? `<defs><clipPath id="cjL"><rect width="180" height="645"/></clipPath><clipPath id="cjR"><rect x="180" width="180" height="645"/></clipPath></defs>
    <g id="doorL"><image href="${artUrl('cj-door')}" width="360" height="645" clip-path="url(#cjL)"/></g><g id="doorR"><image href="${artUrl('cj-door')}" width="360" height="645" clip-path="url(#cjR)"/></g>` : `
    <g id="doorL"><rect x="0" y="0" width="180" height="645" fill="#B8302A" stroke="#7A1E1A" stroke-width="4"/>${[0, 1, 2, 3, 4, 5, 6].map((r) => [0, 1, 2, 3].map((c) => `<circle cx="${30 + c * 40}" cy="${70 + r * 80}" r="7" fill="#F3C64A"/>`).join('')).join('')}<circle cx="164" cy="330" r="14" fill="none" stroke="#F3C64A" stroke-width="4"/></g>
    <g id="doorR"><rect x="180" y="0" width="180" height="645" fill="#B8302A" stroke="#7A1E1A" stroke-width="4"/>${[0, 1, 2, 3, 4, 5, 6].map((r) => [0, 1, 2, 3].map((c) => `<circle cx="${210 + c * 40}" cy="${70 + r * 80}" r="7" fill="#F3C64A"/>`).join('')).join('')}<circle cx="196" cy="330" r="14" fill="none" stroke="#F3C64A" stroke-width="4"/></g>`}
    <g id="rivals"></g>
    <text id="count" x="180" y="300" text-anchor="middle" class="fest-count"></text>`);
  const stk = st.$('#sticks');
  // 一起搶頭香的香客：門一開就從兩邊衝過來，誰先插上香誰是頭香
  const RIV = ['pilgrim', 'ama', 'bajiu', 'miaokou', 'driver', 'agong', 'councilor', 'mama'].filter((id) => id !== o.chars.me?.()?.id).sort(() => Math.random() - .5).slice(0, 3)
    .map((id, i) => ({ c: o.chars.byId(id), from: [[-40, 560], [400, 590], [-40, 470]][i], to: [MOUTH[0] + [-22, 22, -8][i], MOUTH[1] + 4], t: [rand(1.2, 1.7), rand(1.9, 2.6), rand(2.7, 3.6)][i], in: false }));
  st.$('#rivals').innerHTML = RIV.map((r, i) => `<g id="rv${i}" style="display:none"><g class="rv-run"><path d="M10 -6 L14 -66" stroke="#9A4A2E" stroke-width="2.4" stroke-linecap="round"/><circle cx="14" cy="-66" r="2.4" fill="#FF6A3A"/><circle r="22" fill="#FFF4E0" stroke="#E0A440" stroke-width="2.4"/><clipPath id="rvc${i}"><circle r="20"/></clipPath><image href="${r.c.face}" x="-20" y="-20" width="40" height="40" clip-path="url(#rvc${i})" preserveAspectRatio="xMidYMid slice"/></g></g>`).join('');
  const rivalsIn = () => RIV.filter((r) => r.in).length;
  function runRivals() {
    RIV.forEach((r, i) => {
      const el = st.$('#rv' + i); el.style.display = ''; place(el, ...r.from);
      st.tween(r.t * 1000, (k) => {
        const x = r.from[0] + (r.to[0] - r.from[0]) * k, y = r.from[1] + (r.to[1] - r.from[1]) * k - Math.abs(Math.sin(k * 18)) * 8;
        place(el, x, y, 1 - k * .25);
        if (k >= 1 && !r.in) {
          r.in = true; st.sfx.pop(); st.floatText(`${r.c.name}插上了`, r.to[0], r.to[1] - 90, '#FFF4E0');
          if (phase === 'go' && rivalsIn() === 1) st.say(`<b>${r.c.name}</b>先插上了！快，還有位置！`, 'temple');
        }
      }, (k) => k);
    });
  }
  st.progress(0, 1);
  st.say('大年初一搶頭香！廟門一開，就把香插進香爐。準備好了嗎？', 'temple');
  const go = () => {
    if (phase !== 'wait') return; phase = 'count'; st.buttons([]);
    [3, 2, 1].forEach((n, i) => st.later(i * 800, () => { st.$('#count').textContent = n; st.sfx.knock(); }));
    st.later(2400, () => {
      st.$('#count').textContent = ''; st.sfx.bowl();
      st.tween(500, (k, e) => { st.$('#doorL').setAttribute('transform', `translate(${-e * 180} 0)`); st.$('#doorR').setAttribute('transform', `translate(${e * 180} 0)`); });
      stk.style.display = ''; place(stk, ...REST); phase = 'go'; opened = performance.now();
      runRivals();
      st.say('廟門開了！大家都衝進來了，<b>按住香</b>，快插進香爐！', 'temple');
      st.buttons([{ label: '幫我插', on: () => { if (phase !== 'go' || autoGo) return; autoGo = true; flyTo(st, stk, pos, [MOUTH[0], MOUTH[1] + 6], 1700); st.later(1700, plant); } }]);
    });
  };
  st.buttons([{ label: '開廟門', primary: true, on: go }]);
  st.hold(stk, {
    magnet: () => (phase === 'go' ? [...MOUTH, 50] : null),
    onStart() { if (phase === 'go') st.zoom(200, 420, 260, 250); },
    onMove(x, y) { if (phase !== 'go') return; pos = [x, y]; place(stk, x, y, 1, -6); if (Math.random() < .2) st.emit('smoke', x, y - 74, { vy: -24, vx: rand(-5, 5), life: 1.2, s0: .3, s1: 1, fade: true }); },
    onUp() { if (phase !== 'go') return; if (D(pos, MOUTH) < 34) plant(); else { flyTo(st, stk, pos, REST, 260); st.reset(300); } },
  });
  function plant() {
    if (phase !== 'go') return; phase = 'end';
    const s = (performance.now() - opened) / 1000, rank = 1 + rivalsIn();
    stk.style.display = 'none'; st.$('#planted').style.display = '';
    st.reset(); st.progress(1, 1); st.sfx.chime();
    const puff = () => { st.emit('smoke', MOUTH[0] + rand(-8, 8), MOUTH[1] - 74, { vy: -26, vx: rand(-6, 6), life: 2, s0: .4, s1: 1.4, fade: true }); st.later(300, puff); };
    puff();
    st.burst('star', MOUTH[0], MOUTH[1] - 60, 20);
    st.floatText(rank === 1 ? '頭香！' : `第 ${rank} 名`, 180, 220, '#FFE08A');
    const first = RIV.filter((r) => r.in)[0];
    o.done(`開門後 ${s.toFixed(1)} 秒就插上香，${rank === 1 ? `比${RIV.map((r) => r.c.name).join('、')}都快，搶到<b>頭香</b>！` : `被${first.c.name}搶先一步，排第 ${rank} 位，也很早！`}新年第一炷香，祝你整年順順利利。`);
  }
}

// 初二：回娘家發紅包
function hongbao(st, o) {
  const fam = [
    { id: 'ama', name: '外婆', at: [70, 270], line: '外婆：「乖孫，新年快樂！吃飽未？桌上有甜粿。」' },
    { id: 'agong', name: '外公', at: [180, 220], line: '外公：「好好好，平安就好，工作別太累。」' },
    { id: 'kid', name: '小姪子', at: [290, 270], line: '小姪子：「謝謝！恭喜發財，我要存起來買書包！」' },
  ];
  const REST = [180, 520];
  let got = new Set(), pos = [...REST], held = false;
  st.set(`${backdrop('chunjie-home', { wall: ['#FBE2C8', '#F1C49A'], table: 430, extra: `<g transform="translate(180 120)"><rect x="-26" y="-26" width="52" height="52" fill="#E0443E" transform="rotate(45)"/><text y="11" text-anchor="middle" class="fest-fu">春</text></g>`, over: `<text x="180" y="107" text-anchor="middle" class="fest-fu">春</text>` })}
    ${fam.map((f) => { const c = o.chars.byId(f.id); return `<g id="f-${f.id}" transform="translate(${f.at[0]} ${f.at[1]})"><circle r="48" fill="#FFF4E0" stroke="#E0A440" stroke-width="3"/><clipPath id="cl-${f.id}"><circle r="45"/></clipPath><image href="${c.face}" x="-45" y="-45" width="90" height="90" clip-path="url(#cl-${f.id})" preserveAspectRatio="xMidYMid slice"/><rect x="-30" y="52" width="60" height="22" rx="11" fill="#E0443E"/><text y="68" text-anchor="middle" class="fest-small" fill="#FFF4E0">${f.name}</text></g>`; }).join('')}
    <g transform="translate(${REST[0] + 6} ${REST[1] + 6})" opacity=".7">${img(hongbaoUrl, 66, 74)}</g>
    <g id="hb" class="fest-hit" filter="url(#fToy)">${img(hongbaoUrl, 66, 74)}</g>`);
  const hb = st.$('#hb'); place(hb, ...REST);
  st.progress(0, 3);
  st.say('大年初二回娘家！按住紅包，拿去給外婆、外公和小姪子。', 'temple');
  const nearest = () => { let best = null; for (const f of fam) if (!got.has(f.id) && (!best || D(pos, f.at) < D(pos, best.at))) best = f; return best; };
  st.hold(hb, {
    magnet: () => { const f = nearest(); return f ? [...f.at, 70] : null; },
    onStart() { held = true; },
    onMove(x, y) { pos = [x, y]; place(hb, x, y, .8); },
    onUp() {
      held = false; const f = nearest();
      if (f && D(pos, f.at) < 50) give(f); else flyTo(st, hb, pos, REST, 300, .8, 1);
    },
  });
  function give(f) {
    got.add(f.id); place(hb, ...REST);
    st.sfx.pop(); st.burst('heart', ...f.at, 10);
    st.$('#f-' + f.id).classList.add('fest-happy');
    st.say(f.line, 'temple'); st.progress(got.size, 3);
    if (got.size === 3) { hb.style.display = 'none'; st.buttons([]); st.later(1400, () => o.done('紅包發完，大家都笑咪咪。回娘家最重要的是陪陪家人。')); }
  }
  st.buttons([{ label: '發給下一位', on: () => { const f = fam.find((x) => !got.has(x.id)); if (f) give(f); } }]);
}

// 初三：赤狗日，不出門、早早睡（幫虎爺蓋被子、關燈）
function sleepIn(st, o) {
  const TIGER = [180, 412]; // 臥在背景圖的圓地毯上
  // 被子：從虎爺腳邊（摺成一長條）往上拉到肩膀。BOT＝被子下緣（墊子前緣），FULL＝蓋好的高度
  const BOT = 500, START = 474, FULL = 432;
  let top = START, phase = 'cover', cord = 0, pulling = false, noise = 0, wakes = 0, lastP = null, waking = false;
  // 台灣紅底牡丹花布（有 Gemini 花布圖 cj-quilt 就用圖當花紋）
  const quiltPat = hasArt('cj-quilt')
    ? `<pattern id="quiltPat" patternUnits="userSpaceOnUse" width="90" height="90"><image href="${artUrl('cj-quilt')}" width="90" height="90" preserveAspectRatio="xMidYMid slice"/></pattern>`
    : `<pattern id="quiltPat" patternUnits="userSpaceOnUse" width="64" height="56">
        <rect width="64" height="56" fill="#C8242A"/>
        ${[[16, 14], [48, 42]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M-12 4 Q-16 -6 -6 -6 M12 4 Q16 -6 6 -6" stroke="#2E7A3A" stroke-width="3" fill="none"/><ellipse cx="-10" cy="5" rx="6" ry="3" fill="#3E8E46" transform="rotate(-30 -10 5)"/><ellipse cx="10" cy="5" rx="6" ry="3" fill="#3E8E46" transform="rotate(30 10 5)"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cy="-5" rx="4.6" ry="6.4" fill="#F27AA0" transform="rotate(${a})"/>`).join('')}<circle r="3.4" fill="#FFE07A"/></g>`).join('')}
        ${[[48, 12], [16, 42]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[0, 90, 180, 270].map((a) => `<circle cx="0" cy="-3" r="2.4" fill="#FFF4E8" transform="rotate(${a})"/>`).join('')}<circle r="1.6" fill="#F3C64A"/></g>`).join('')}
      </pattern>`;
  st.set(`${backdrop('chunjie-night', { wall: ['#3A3456', '#262040'], table: 470, tableColor: ['#6A4A6A', '#4A3450'], extra: `<circle cx="80" cy="110" r="28" fill="#FFF3C0"/><circle cx="92" cy="102" r="28" fill="#3A3456"/><ellipse cx="${TIGER[0]}" cy="${TIGER[1] + 58}" rx="130" ry="30" fill="#E0544A"/>` })}
    <defs>${quiltPat}
      <linearGradient id="quiltShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF" stop-opacity=".18"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2A0006" stop-opacity=".35"/></linearGradient>
      <radialGradient id="lampGlow"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".55"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
      <linearGradient id="lampShade" x1="0" x2="1"><stop offset="0" stop-color="#F2D08A"/><stop offset=".5" stop-color="#FFF2C8"/><stop offset="1" stop-color="#E0B868"/></linearGradient>
    </defs>
    <ellipse cx="${TIGER[0]}" cy="${BOT + 6}" rx="128" ry="12" fill="#000" opacity=".22"/>
    <g transform="translate(${TIGER[0]} ${TIGER[1]})">${img(tigerSleepUrl, 220, 160)}</g>
    <g id="blanket">
      <path id="blkP" fill="url(#quiltPat)"/><path id="blkS" fill="url(#quiltShade)"/>
      <path id="blkFold" fill="#FFF6EA" stroke="#E8D6C0" stroke-width="1.5"/>
      <path id="blkStitch" fill="none" stroke="#FFF6EA" stroke-width="1.4" stroke-dasharray="4 4" opacity=".7"/>
    </g>
    <g id="lamp" transform="translate(302 236)">
      <ellipse id="lampG" cy="-10" rx="90" ry="80" fill="url(#lampGlow)"/>
      <rect x="-3" y="-4" width="6" height="118" rx="3" fill="#8A6A3E"/><ellipse cy="116" rx="26" ry="7" fill="#6A4E2A"/>
      <path id="lampS" d="M-34 0 L34 0 L22 -50 L-22 -50Z" fill="url(#lampShade)" stroke="#C8963E" stroke-width="1.5"/>
      <path d="M-34 0 L34 0" stroke="#C8963E" stroke-width="3"/>
      <line x1="16" y1="2" x2="16" y2="44" id="cordL" stroke="#C8963E" stroke-width="2"/>
      <g id="cordK" class="fest-hit"><circle cx="16" cy="48" r="14" fill="#000" opacity="0"/><circle id="cordB" cx="16" cy="48" r="6" fill="#E0443E" stroke="#8A2A20" stroke-width="1.5"/></g>
    </g>
    <g id="hush" transform="translate(110 64)"><rect width="140" height="12" rx="6" fill="#1A1430" stroke="#8A7AB0" stroke-width="1.5"/><rect id="hushF" x="1.5" y="1.5" width="0" height="9" rx="4.5" fill="#7CD08A"/><text x="70" y="-6" text-anchor="middle" class="fest-small" fill="#E8E0FF">輕輕的…別吵醒虎爺</text></g>
    <text id="zzz" x="${TIGER[0] + 70}" y="${TIGER[1] - 50}" class="fest-small" fill="#FFF3C0">z z z</text>
    <rect id="dark" width="360" height="645" fill="#0A0818" opacity="0" pointer-events="none"/>`);
  // 動作太大會吵醒虎爺：手指移動越快，噓量表越滿；滿了虎爺醒來，被子滑下去一點
  const paintHush = () => { const k = Math.min(1, noise / 100); st.$('#hushF').setAttribute('width', (137 * k).toFixed(1)); st.$('#hushF').setAttribute('fill', k > .7 ? '#F27A6A' : k > .4 ? '#F3C64A' : '#7CD08A'); };
  const hear = (p) => {
    const now = performance.now();
    if (lastP) {
      const dt = Math.max(8, now - lastP.t), v = Math.hypot(p.x - lastP.x, p.y - lastP.y) / dt; // 每毫秒幾單位
      noise = Math.max(0, noise - dt * .03) + Math.max(0, v - .4) * 20;
      paintHush();
      if (noise >= 100) wake();
    }
    lastP = { x: p.x, y: p.y, t: now };
  };
  function wake() {
    if (waking) return; waking = true; noise = 0; wakes++; paintHush();
    st.sfx.knock(); st.floatText('！', TIGER[0] - 30, TIGER[1] - 70, '#FFE08A');
    st.$('#zzz').textContent = '';
    st.say(wakes > 1 ? '又吵醒了…虎爺翻個身。<b>慢慢地</b>拉，像怕吵醒小嬰兒那樣。' : '太大力了！虎爺張開一隻眼睛。噓～<b>慢慢地</b>拉，量表不要變紅。', 'cat');
    if (phase === 'cover') { top = Math.min(START, top + 20); drawBlanket(); }
    st.later(1300, () => { waking = false; st.$('#zzz').textContent = 'z z z'; });
  }
  // 被子蓋在虎爺身上：上緣隨身體起伏（中間高），左右兩邊垂到墊子外，下緣有一點弧度
  const drawBlanket = () => {
    const L = 64, R = 300, hump = 14 * (START - top) / (START - FULL);
    const edge = `M${L} ${top + 10} C${L + 40} ${top - hump} ${R - 40} ${top - hump} ${R} ${top + 10}`;
    const body = `${edge} C${R + 14} ${top + 30} ${R + 18} ${BOT - 14} ${R + 6} ${BOT} Q${TIGER[0]} ${BOT + 12} ${L - 6} ${BOT} C${L - 18} ${BOT - 14} ${L - 14} ${top + 30} ${L} ${top + 10}Z`;
    st.$('#blkP').setAttribute('d', body); st.$('#blkS').setAttribute('d', body);
    // 白色被頭（摺邊）
    st.$('#blkFold').setAttribute('d', `${edge} L${R + 2} ${top + 22} C${R - 40} ${top + 12 - hump} ${L + 40} ${top + 12 - hump} ${L - 2} ${top + 22}Z`);
    st.$('#blkStitch').setAttribute('d', `M${L + 14} ${top + 38} C${L + 50} ${top + 28 - hump} ${R - 50} ${top + 28 - hump} ${R - 14} ${top + 38}`);
  };
  drawBlanket();
  st.progress(0, 2);
  st.say('初三是「赤狗日」，習俗是不出門、不拜年、早點睡。虎爺已經睡著了，按住<b>被子邊邊</b>往上拉，幫祂蓋好。動作要<b>輕</b>，太快會吵醒祂。', 'temple');
  st.touch({
    down(p) { pulling = phase === 'lamp'; lastP = null; },
    move(p) {
      if (phase !== 'end') hear(p);
      if (waking) return;
      if (phase === 'cover') {
        const want = clamp(p.y - st.lift() * .4, FULL, START);
        if (want < top) { top = want; drawBlanket(); }
        if (top <= FULL + 2) { phase = 'lamp'; st.progress(1, 2); st.sfx.pop(); st.burst('heart', TIGER[0], TIGER[1] - 40, 6); st.say('蓋好了，虎爺打呼嚕。最後把右上角燈的<b>拉繩</b>輕輕往下拉，關燈睡覺。', 'cat'); }
      } else if (phase === 'lamp' && pulling) {
        const dy = clamp(p.y - st.lift() * .4 - 284, 0, 50);
        cord = dy; st.$('#cordK').setAttribute('transform', `translate(0 ${dy})`); st.$('#cordL').setAttribute('y2', 44 + dy);
        if (dy >= 40) lightsOff();
      }
    },
    up() { if (phase === 'lamp') { cord = 0; st.$('#cordK').setAttribute('transform', ''); st.$('#cordL').setAttribute('y2', 44); } },
  });
  function lightsOff() {
    if (phase !== 'lamp') return; phase = 'end'; st.buttons([]);
    st.sfx.knock(); st.$('#lampS').setAttribute('fill', '#8A7A5A'); st.$('#lampG').setAttribute('opacity', '0');
    st.tween(700, (k, e) => st.$('#dark').setAttribute('opacity', (e * .55).toFixed(2)));
    st.progress(2, 2); st.$('#hush').style.display = 'none';
    ['Z', 'z', 'Z'].forEach((z, i) => st.later(400 + i * 500, () => st.floatText(z, TIGER[0] + 60 + i * 14, TIGER[1] - 60 - i * 16, '#FFF3C0')));
    st.later(1600, () => o.done(`${wakes ? `中間吵醒虎爺 ${wakes} 次，最後還是哄睡了。` : '一次都沒吵醒虎爺，好溫柔！'}晚安。初三在家好好休息，把過年的元氣補回來。`));
  }
  st.buttons([{ label: '幫我蓋好、關燈', on: () => { top = FULL; drawBlanket(); phase = 'lamp'; lightsOff(); } }]);
}

// 初四：接神，擺四果
function jieshen(st, o) {
  // 供品底部對齊桌面（y = TOP），同一條線上才不會歪；sitImg 會加貼桌陰影
  const TOP = 389;
  const ITEMS = [['fruit', fruitUrl, 58, 66, '水果'], ['flowers', flowersUrl, 38, 68, '鮮花'], ['cakes', cakesUrl, 62, 55, '糕餅'], ['tea', teaUrl, 58, 41, '清茶']];
  const SPOTS = [[92, TOP], [150, TOP], [210, TOP], [268, TOP]];
  const REST = [[58, 566], [138, 572], [222, 572], [302, 566]];
  let filled = [], pos = [0, 0];
  const beams = `<g id="beams" opacity="0">${[90, 150, 210, 270].map((x) => `<path d="M${x} 0 L${x - 26} ${TOP} L${x + 26} ${TOP}Z" fill="#FFE9A0" opacity=".3"/>`).join('')}</g>`;
  const cloud = (w) => `<g opacity=".95">${[[-w * .32, 6, w * .26], [0, 0, w * .34], [w * .32, 6, w * .26], [-w * .12, 12, w * .3], [w * .14, 12, w * .3]].map(([x, y, r]) => `<ellipse cx="${x.toFixed(1)}" cy="${y}" rx="${r.toFixed(1)}" ry="${(r * .42).toFixed(1)}" fill="#FFF8E6"/>`).join('')}<ellipse cy="14" rx="${(w * .55).toFixed(1)}" ry="6" fill="#F3D9A0" opacity=".6"/></g>`;
  // 回來的神明：財神爺在中間最大，土地公、媽祖在兩邊（站在雲上，從天上降下來）
  const GODS = [['cai', caishenUrl, 180, 250, 150, '財神爺'], ['tudi', tudiUrl, 70, 268, 108, '土地公'], ['mazu', mazuUrl, 290, 268, 108, '媽祖']];
  st.set(`${backdrop('chunjie-jieshen', { wall: ['#F4D2A8', '#E0A878'], table: 400, tableColor: ['#B8302A', '#8A2420'], extra: `<path d="M0 0 H360 V60 Q180 100 0 60Z" fill="#E0443E"/>${beams}`, over: beams })}
    <g id="gods">${GODS.map(([k, url, x, y, h, name]) => `<g id="god-${k}" opacity="0" transform="translate(${x} ${y - 260})"><ellipse cy="${-h * .5}" rx="${h * .55}" ry="${h * .62}" fill="url(#fGlow)" opacity=".85"/><image href="${url}" x="${-h * .36}" y="${-h}" width="${h * .72}" height="${h}" preserveAspectRatio="xMidYMax meet"/><g transform="translate(0 2)">${cloud(h * .8)}</g><text y="${26}" text-anchor="middle" class="fest-small" fill="#7A2A18" stroke="#FFF8E6" stroke-width="3" paint-order="stroke">${name}</text></g>`).join('')}</g>
    ${SPOTS.map(([x, y], i) => `<ellipse id="spot${i}" cx="${x}" cy="${y - 1}" rx="24" ry="5" fill="rgb(255 244 216 / .18)" stroke="#FFF4D8" stroke-width="2" stroke-dasharray="5 4"/>`).join('')}
    ${ITEMS.map(([k, url, w, h]) => `<g id="it-${k}" class="fest-hit">${sitImg(url, w, h)}</g>`).join('')}`);
  ITEMS.forEach(([k], i) => place(st.$('#it-' + k), ...REST[i]));
  st.progress(0, 4);
  st.say('初四接神：年前送上天的眾神，今天要回到人間了，<b>財神爺</b>也一起回來！把四樣供品擺上供桌，歡迎祂們回來。', 'temple');
  const freeSpot = () => { let b = -1; SPOTS.forEach((s, i) => { if (!filled.includes(i) && (b < 0 || D(pos, s) < D(pos, SPOTS[b]))) b = i; }); return b; };
  const putOn = (el, s) => { place(el, ...SPOTS[s]); st.$('#spot' + s).setAttribute('opacity', '0'); };
  ITEMS.forEach(([k], i) => {
    const el = st.$('#it-' + k); let done = false;
    st.hold(el, {
      magnet: () => { if (done) return null; const s = freeSpot(); return s >= 0 ? [...SPOTS[s], 40] : null; },
      onStart() { if (!done) st.zoom(180, 430, 280); },
      onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y); },
      onUp() {
        if (done) return; st.reset();
        const s = freeSpot();
        if (s >= 0 && D(pos, SPOTS[s]) < 36) {
          done = true; filled.push(s); putOn(el, s);
          st.sfx.pop(); st.burst('star', SPOTS[s][0], SPOTS[s][1] - 30, 8);
          st.progress(filled.length, 4);
          if (filled.length === 4) welcome();
        } else flyTo(st, el, pos, REST[i], 300);
      },
    });
  });
  function welcome() {
    st.buttons([]); st.sfx.bowl(); st.zoom(180, 300, 330);
    st.tween(1200, (k, e) => st.$('#beams').setAttribute('opacity', e.toFixed(2)));
    const rain = (n) => { if (n <= 0) return; st.emit('star', rand(30, 330), 0, { vy: rand(60, 120), vx: rand(-10, 10), life: 2.4, s0: 1, s1: .4 }); st.later(70, () => rain(n - 1)); };
    rain(40);
    // 神明一位一位坐雲降下來，財神爺最後到
    [1, 2, 0].forEach((gi, n) => st.later(500 + n * 650, () => {
      const [k, , x, y] = GODS[gi], g = st.$('#god-' + k);
      st.sfx.chime();
      st.tween(1100, (t, e) => { g.setAttribute('opacity', Math.min(1, t * 2).toFixed(2)); g.setAttribute('transform', `translate(${x} ${(y - 260 * (1 - e)).toFixed(1)})`); });
      if (k === 'cai') st.later(1100, () => { st.floatText('財神爺回來了！', 180, 92, '#FFE08A'); st.burst('coin', 180, 200, 18); });
    }));
    st.later(4200, () => o.done('眾神回到人間，財神爺也到了，金光灑滿供桌。新的一年，請神明繼續保佑、財源滾滾。'));
  }
  st.buttons([{ label: '幫我擺好', on: () => { ITEMS.forEach(([k], i) => { if (!filled.includes(i)) putOn(st.$('#it-' + k), i); }); filled = [0, 1, 2, 3]; st.progress(4, 4); welcome(); } }]);
}

// 初五：開工放鞭炮，迎財神
function kaigong(st, o) {
  const X = 250, TOP = 70, SEG = 15, FUSE = [X, TOP + SEG * 26 + 18], REST = [90, 520];
  // 有鞭炮串圖：整串一張圖，從下面一節一節剪掉（圖裡炮身在 23%～93%，最下面是引信）
  const FC = hasArt('cj-firecracker'), FC_TOP = 12, FC_H = FUSE[1] + 4 - FC_TOP, FC_W = FC_H * 160 / 985;
  let phase = 'light', pos = [...REST], heat = 0, popped = 0;
  st.set(`${backdrop('chunjie-kaigong', { wall: ['#F6D2A4', '#E8AC72'], table: 520, extra: `<rect x="40" y="90" width="120" height="160" rx="6" fill="#E0443E"/><text x="100" y="160" text-anchor="middle" class="fest-sign">開工</text><text x="100" y="215" text-anchor="middle" class="fest-sign">大吉</text>`, over: `<text x="100" y="160" text-anchor="middle" class="fest-sign">開工</text><text x="100" y="215" text-anchor="middle" class="fest-sign">大吉</text>` })}
    ${FC ? '' : `<line x1="${X}" y1="0" x2="${X}" y2="${FUSE[1]}" stroke="#5A3018" stroke-width="2"/>`}
    ${FC ? `<defs><clipPath id="fcClip"><rect id="fcRect" x="${X - 60}" y="0" width="120" height="${FC_TOP + FC_H}"/></clipPath></defs><image href="${artUrl('cj-firecracker')}" x="${X - FC_W / 2}" y="${FC_TOP}" width="${FC_W}" height="${FC_H}" clip-path="url(#fcClip)"/>${Array.from({ length: SEG }, (_, i) => `<g id="seg${i}"></g>`).join('')}` : `
    ${Array.from({ length: SEG }, (_, i) => `<g id="seg${i}" transform="translate(${X} ${TOP + i * 26})"><rect x="-22" y="0" width="18" height="24" rx="4" fill="#E0443E" stroke="#9A2420" stroke-width="1.4" transform="rotate(-25 -13 12)"/><rect x="4" y="0" width="18" height="24" rx="4" fill="#E0443E" stroke="#9A2420" stroke-width="1.4" transform="rotate(25 13 12)"/></g>`).join('')}`}
    <circle cx="${FUSE[0]}" cy="${FUSE[1]}" r="16" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 4" id="fuseRing"/>
    <g id="lighter" class="fest-hit" filter="url(#fToy)"><g id="flame" style="display:none"><circle cy="-4" r="12" fill="url(#fGlow)"/><path d="M0 -15 C6 -8 6 -1 0 1 C-6 -1 -6 -8 0 -15 Z" fill="#FF9A3A"/></g><image href="${lighterUrl}" x="-57" y="-1.5" width="60" height="60"/></g>`);
  const lt = st.$('#lighter'); place(lt, ...REST);
  st.progress(0, 2);
  st.say('初五開工、迎財神！按住打火機，把火靠近鞭炮最下面的<b>引信</b>，停一下就會點著。', 'temple');
  st.hold(lt, {
    magnet: () => (phase === 'light' ? [...FUSE, 44] : null),
    onStart() { if (phase === 'light') { st.$('#flame').style.display = ''; st.zoom(X - 30, FUSE[1] + 40, 230); } },
    onMove(x, y) {
      if (phase !== 'light') return; pos = [x, y]; place(lt, x, y);
      if (D(pos, FUSE) < 14) { heat += 1 / 30; if (Math.random() < .4) st.emit('spark', ...FUSE, { speed: 30, life: .4 }); if (heat > .6) fire(); } else heat = Math.max(0, heat - .05);
    },
    onUp() { st.$('#flame').style.display = 'none'; if (phase === 'light') { flyTo(st, lt, pos, REST, 300); st.reset(); } },
  });
  // 手指停著不動也要能點著
  const keep = () => { if (phase !== 'light') return; if (D(pos, FUSE) < 14 && st.$('#flame').style.display === '') { heat += .05; if (heat > .6) fire(); } st.later(50, keep); };
  keep();
  function fire() {
    if (phase !== 'light') return; phase = 'pop'; st.buttons([]);
    st.$('#flame').style.display = 'none'; flyTo(st, lt, pos, REST, 300); st.$('#fuseRing').setAttribute('opacity', '0');
    st.reset(); st.progress(1, 2);
    const bang = () => {
      const i = SEG - 1 - popped; if (i < 0) { done(); return; }
      const y = TOP + i * 26 + 12;
      st.$('#seg' + i).setAttribute('opacity', '0');
      if (FC) st.$('#fcRect').setAttribute('height', (FC_TOP + FC_H * (.23 + .7 * i / SEG)).toFixed(1));
      st.burst('star', X, y, 6, { color: '#FFE08A', speed: 70, life: .4 });
      st.burst('paper', X, y, 5, () => ({ vx: rand(-90, 90), vy: rand(-80, 0), g: 200, life: 1.4, color: '#E0443E' }));
      st.emit('smoke', X, y, { vy: -14, vx: rand(-10, 10), life: 1.6, s0: .8, s1: 2.2, fade: true });
      st.sfx.knock(); st.sfx.buzz?.(15);
      st.world.setAttribute('transform', `translate(${rand(-3, 3)} ${rand(-3, 3)})`);
      popped++; st.later(110, bang);
    };
    bang();
  }
  function done() {
    st.world.setAttribute('transform', ''); st.progress(2, 2); st.sfx.chime();
    st.floatText('開工大吉', 180, 300, '#FFE08A');
    o.done('劈哩啪啦！開工大吉，財神爺聽到鞭炮聲就會來。要不要順便去財神殿拜一下？');
    st.later(50, () => st.buttons([{ label: '去財神殿迎財神', primary: true, on: () => o.goHall('cai') }, { label: '回到殿裡', on: () => o.goHall(null) }]));
  }
  st.buttons([{ label: '幫我點', on: () => { pos = [...FUSE]; place(lt, ...FUSE); fire(); } }]);
}

export const GAMES = { dongzhi, songshen, chuxi, chunjie };

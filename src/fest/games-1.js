// 第一批節慶小遊戲：冬至、送神、除夕、春節（初一～初五）
// 座標 360 × 645。道具有 Gemini 圖（src/assets/fest/<key>.webp）就用圖，沒有先用 SVG 手繪。
import { art, clamp, rand, pick, place } from './core.js';
import burnerUrl from '../assets/burner.webp';
import lighterUrl from '../assets/lighter.webp';
import tigerSleepUrl from '../assets/tiger-sleep.webp';
import hongbaoUrl from '../assets/cai/hongbao.webp';
import fruitUrl from '../assets/offer/fruit.webp';
import flowersUrl from '../assets/offer/flowers.webp';
import cakesUrl from '../assets/offer/cakes.webp';
import teaUrl from '../assets/offer/tea.webp';

const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// 背景：有 bg-<id> 圖就用，沒有就畫一面暖色牆＋木桌
export function backdrop(id, { wall = ['#F8E1C4', '#EFC9A2'], table = 420, tableColor = ['#C98A55', '#9C5F33'], extra = '' } = {}) {
  const key = `bg-${id}`;
  const img = art(key, 360, 645, '');
  if (img) return `<g transform="translate(180 322.5)">${img}</g>`;
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

/* ================= 冬至：搓湯圓 ================= */
const TY = { white: ['#FFFBF4', '#E6D3BF'], red: ['#F8A6B4', '#DE7488'] };
const dough = (c) => (w, h) => `<ellipse cy="${h * .3}" rx="${w * .55}" ry="${h * .18}" fill="#C28A5C" opacity=".5"/>
  <path d="M${-w * .45} ${h * .28}C${-w * .5} ${-h * .1} ${-w * .2} ${-h * .45} 0 ${-h * .42}C${w * .25} ${-h * .45} ${w * .5} ${-h * .05} ${w * .45} ${h * .28}Z" fill="${c[0]}" stroke="${c[1]}" stroke-width="2"/>
  <ellipse cx="${-w * .12}" cy="${-h * .2}" rx="${w * .12}" ry="${h * .08}" fill="#FFF" opacity=".7"/>`;
const bowl = (w, h) => `<ellipse cy="${-h * .18}" rx="${w * .5}" ry="${h * .16}" fill="#F3C9A8"/>
  <path d="M${-w * .5} ${-h * .18}C${-w * .45} ${h * .38} ${w * .45} ${h * .38} ${w * .5} ${-h * .18}Z" fill="#FFFFFF" stroke="#D9C2AA" stroke-width="2"/>
  <path d="M${-w * .34} ${h * .02}h${w * .68}" stroke="#4A8ACB" stroke-width="3" stroke-dasharray="6 5"/>
  <rect x="${-w * .18}" y="${h * .3}" width="${w * .36}" height="${h * .1}" rx="3" fill="#E9DCCB"/>`;

const dongzhi = {
  play(st, o) {
    const N = 4, PLATE = [180, 290], PAD = [180, 410], BOWL = [282, 520];
    let phase = 'pick', made = 0, color = 'white', acc = 0, lastA = null, jit = [], ballPos = [...PLATE];
    st.set(`${backdrop('dongzhi', { table: 250, extra: `<g transform="translate(180 120)"><rect x="-58" y="-34" width="116" height="68" rx="6" fill="#E0443E"/><text y="12" text-anchor="middle" class="fest-sign">冬至</text></g>` })}
      <g transform="translate(${PLATE[0]} ${PLATE[1] + 18})"><ellipse rx="78" ry="20" fill="#FFF6E6" stroke="#E0C4A0" stroke-width="2"/></g>
      <circle id="pad" cx="${PAD[0]}" cy="${PAD[1]}" r="52" fill="none" stroke="#FFF4D8" stroke-width="3" stroke-dasharray="8 8" opacity="0"/>
      <text id="padTxt" x="${PAD[0]}" y="${PAD[1] + 6}" text-anchor="middle" class="fest-tip" opacity="0">在這裡畫圈</text>
      <g id="bowl" transform="translate(${BOWL[0]} ${BOWL[1]})">${art('dz-bowl', 130, 96, bowl)}<g id="inBowl"></g></g>
      <g class="fest-hit" data-c="white" transform="translate(62 512)">${art('dz-dough-white', 92, 66, dough(TY.white))}</g>
      <g class="fest-hit" data-c="red" transform="translate(140 530)">${art('dz-dough-red', 92, 66, dough(TY.red))}</g>
      <g id="ball" style="display:none" filter="url(#fToy)"><path id="ballP"/><ellipse cx="-8" cy="-10" rx="7" ry="4.5" fill="#FFF" opacity=".75"/></g>
      <g id="steam" opacity="0"></g>`);
    const ball = st.$('#ball'), ballP = st.$('#ballP');
    st.progress(0, N);
    const shape = (p) => {
      const R = 26 - 4 * p;
      ballP.setAttribute('d', blobPath(jit.map((j) => R * (1 + j * (1 - p) * (1 - p)))));
      ballP.setAttribute('fill', TY[color][0]); ballP.setAttribute('stroke', TY[color][1]); ballP.setAttribute('stroke-width', '2');
    };
    const hint = () => st.say(made === 0 ? '冬至吃湯圓，吃了就長一歲。先點一團麵糰，白的或紅的都可以。' : `第 ${made + 1} 顆，再點一團麵糰。紅白都要有，才吉利。`, 'temple');
    hint();
    // 點麵糰：揪一小塊放到盤子上
    st.world.addEventListener('click', (e) => {
      const g = e.target.closest('[data-c]');
      if (!g || phase !== 'pick') return;
      color = g.dataset.c; jit = Array.from({ length: 10 }, () => rand(-.38, .38)); acc = 0; lastA = null;
      ballPos = [...PLATE]; ball.style.display = ''; shape(0);
      flyTo(st, ball, [+g.getAttribute('transform').match(/[\d.]+/g)[0], 510], PLATE, 420, .5, 1);
      st.sfx.pop(); phase = 'rub';
      st.$('#pad').setAttribute('opacity', '.9'); st.$('#padTxt').setAttribute('opacity', '1');
      st.zoom(180, 370, 250);
      st.say('手指在湯圓<b>下面</b>的圈圈裡畫圈，把麵糰搓圓。搓三圈就好。', 'temple');
      st.buttons([{ label: '幫我搓圓', on: () => { acc = 99; rubbed(); } }]);
    });
    function rubbed() {
      if (phase !== 'rub') return;
      phase = 'carry'; shape(1); place(ball, ...PLATE);
      st.$('#pad').setAttribute('opacity', '0'); st.$('#padTxt').setAttribute('opacity', '0');
      st.burst('star', PLATE[0], PLATE[1], 12, { color: '#FFF3B0' }); st.sfx.chime();
      st.reset();
      st.say('圓滾滾！按住湯圓，把它放進右下角的碗裡。', 'temple');
      st.buttons([{ label: '放進碗裡', on: () => drop(true) }]);
    }
    // 畫圈：以圈圈中心算角度，轉多少累積多少
    st.touch({
      down(p) { lastA = null; },
      move(p) {
        if (phase !== 'rub') return;
        const dx = p.x - PAD[0], dy = p.y - PAD[1], r = Math.hypot(dx, dy);
        if (r < 10 || r > 140) { lastA = null; return; }
        const a = Math.atan2(dy, dx);
        if (lastA !== null) { let d = a - lastA; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; acc += Math.abs(d); }
        lastA = a;
        const p01 = clamp(acc / (Math.PI * 6), 0, 1);
        shape(p01);
        place(ball, PLATE[0] + Math.cos(a) * 5 * (1 - p01 * .5), PLATE[1] + Math.sin(a) * 2.5, 1, Math.cos(a) * 8);
        if (Math.random() < .08) st.emit('spark', PLATE[0] + rand(-20, 20), PLATE[1] + rand(-10, 14), { color: '#FFFFFF', speed: 20, life: .5 });
        if (p01 >= 1) rubbed();
      },
    });
    st.hold(ball, {
      magnet: () => (phase === 'carry' ? [BOWL[0], BOWL[1] - 26, 60] : null),
      onStart() { if (phase === 'carry') st.zoom(230, 470, 260); },
      onMove(x, y) { if (phase !== 'carry') return; ballPos = [x, y]; place(ball, x, y, .85); },
      onUp() { if (phase === 'carry') drop(D(ballPos, [BOWL[0], BOWL[1] - 26]) < 40); },
    });
    function drop(ok) {
      if (phase !== 'carry') return;
      if (!ok) { flyTo(st, ball, ballPos, PLATE, 300, .85, 1); st.reset(); return; }
      phase = 'pick'; ball.style.display = 'none'; made++;
      const slots = [[-22, -24], [10, -28], [-6, -36], [24, -36]], [sx, sy] = slots[made - 1];
      st.$('#inBowl').insertAdjacentHTML('beforeend', `<g transform="translate(${sx} ${sy})"><circle r="11" fill="${TY[color][0]}" stroke="${TY[color][1]}" stroke-width="1.6"/><ellipse cx="-3.5" cy="-4" rx="3.2" ry="2" fill="#FFF" opacity=".8"/></g>`);
      st.sfx.pop(); st.burst('spark', BOWL[0], BOWL[1] - 30, 8);
      st.progress(made, N); st.reset();
      if (made < N) { st.buttons([]); hint(); return; }
      // 煮好了
      phase = 'eat';
      const steam = st.$('#steam'); steam.setAttribute('opacity', '1');
      const puff = () => { if (phase !== 'eat') return; st.emit('steam', BOWL[0] + rand(-20, 20), BOWL[1] - 44, { vx: rand(-6, 6), vy: -30, life: 1.6, s0: .6, s1: 1.6, fade: true }); st.later(260, puff); };
      puff();
      st.say('四顆湯圓煮好了，熱呼呼的。點碗，或按「吃湯圓」。', 'temple');
      st.buttons([{ label: '吃湯圓', primary: true, on: eat }]);
      st.$('#bowl').classList.add('fest-hit'); st.$('#bowl').addEventListener('click', eat, { once: true });
    }
    function eat() {
      if (phase !== 'eat') return;
      phase = 'end';
      const kids = [...st.$('#inBowl').children];
      kids.forEach((k, i) => st.later(260 * i, () => { k.remove(); st.sfx.pop(); st.floatText('+1 歲', BOWL[0], BOWL[1] - 60); }));
      st.later(260 * kids.length + 300, () => o.done('冬至湯圓吃完，又長一歲囉。冬天夜長，早點休息、手腳顧暖。'));
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
const duster = () => `<rect x="-24" y="-22" width="48" height="94" fill="#000" opacity="0"/><g><ellipse cy="-6" rx="20" ry="13" fill="#E07A3A"/><ellipse cx="-8" cy="-10" rx="12" ry="9" fill="#F2A04A"/><ellipse cx="9" cy="-8" rx="12" ry="9" fill="#C9572C"/><ellipse cy="-14" rx="10" ry="7" fill="#F7C25A"/></g><rect x="-3" y="4" width="6" height="66" rx="3" fill="#8A5A2E"/>`;

const songshen = {
  play(st, o) {
    const PRINT = [180, 200], MOUTH = [180, 204], JAR = [72, 404], JAR_MOUTH = [72, 386];
    const BR_REST = [292, 400], DU_REST = [292, 515];
    const DUST = [[54, 452], [128, 440], [198, 460], [250, 446], [318, 470], [116, 300], [246, 120]];
    let phase = 'paint', honey = 0, cov = 0, tip = [...BR_REST], dust = DUST.map(() => 1), last = null;
    st.set(`${backdrop('songshen', { wall: ['#EFD8B8', '#D9B48A'], table: 420, extra: `<rect x="0" y="380" width="360" height="44" fill="#A56A3E"/>` })}
      <g id="print" transform="translate(${PRINT[0]} ${PRINT[1]})">${art('ss-zaojun', 170, 230, zaojun)}<ellipse id="zjSweet" cx="0" cy="4" rx="11" ry="5.5" fill="#E8A030" opacity="0"/></g>
      <g transform="translate(${JAR[0]} ${JAR[1]})">${art('ss-jar', 70, 70, jar)}</g>
      <g id="stove" transform="translate(180 530)"><rect x="-170" y="-90" width="340" height="200" fill="#B5643C"/><path d="M-170 -50h340M-170 -10h340M-170 30h340M-90 -90v40M40 -90v40M-20 -50v40M110 -50v40M-120 -10v40M60 -10v40" stroke="#8E4A2A" stroke-width="2"/><path d="M-50 110 v-70 a50 50 0 0 1 100 0 v70z" fill="#3A1E12"/><path d="M-26 108c-6-22 8-30 10-42 8 10 4 18 10 24 4-6 2-14 8-18 6 14 10 22 4 36z" fill="#FF8A3A"/></g>
      ${DUST.map(([x, y], i) => `<g id="dust${i}" transform="translate(${x} ${y})"><ellipse rx="20" ry="9" fill="#9A8C80" opacity=".75"/><circle cx="-8" cy="-3" r="5" fill="#B5A79A" opacity=".8"/><circle cx="7" cy="2" r="4" fill="#857668" opacity=".7"/></g>`).join('')}
      <g id="brush" class="fest-hit" transform="translate(${BR_REST[0]} ${BR_REST[1]})" filter="url(#fToy)">${brush()}</g>
      <g id="duster" class="fest-hit" transform="translate(${DU_REST[0]} ${DU_REST[1]})" filter="url(#fToy)" style="display:none">${duster()}</g>`);
    const brushEl = st.$('#brush'), dusterEl = st.$('#duster');
    st.progress(0, 3);
    st.say('臘月廿四送灶神回天庭報告。先拿<b>刷子</b>沾左邊罐子裡的麥芽糖，塗在灶君嘴上，讓祂上天只說好話。', 'temple');
    const paintMouth = (k) => { st.$('#zjSweet').setAttribute('opacity', (k * .9).toFixed(2)); };
    st.hold(brushEl, {
      magnet: () => (phase === 'paint' && honey <= 0 ? [...JAR_MOUTH, 40] : null),
      onStart() { if (phase === 'paint') st.zoom(170, 300, 270); last = null; },
      onMove(x, y) {
        if (phase !== 'paint') return;
        tip = [x, y]; place(brushEl, x, y, 1, -18);
        if (D(tip, JAR_MOUTH) < 22 && honey < 1) { honey = 1; st.$('#brushTip').setAttribute('opacity', '1'); st.sfx.pop(); st.say('沾到了，黏黏的。現在塗在灶君的<b>嘴巴</b>上，來回刷幾下。', 'temple'); }
        if (honey > 0 && D(tip, MOUTH) < 24 && last) {
          const m = D(tip, last); cov += m; honey -= m / 140;
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
      st.$('#zjMouth').setAttribute('d', 'M-9 2 Q0 12 9 2');
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
      const BOWL = [180, 548];
      let top = 500, tx = 180, lastY = null;
      st.set(`${backdrop('chuxi-dinner', { wall: ['#5A2A20', '#3A1A14'], table: 330, tableColor: ['#B8302A', '#8A2420'] })}
        <ellipse cx="180" cy="470" rx="200" ry="120" fill="#C8463A"/>
        ${[[60, 400, '#F3C64A'], [300, 400, '#E8A06A'], [70, 560, '#9AC46A'], [300, 560, '#F2E2C0']].map(([x, y, c]) => `<g transform="translate(${x} ${y})"><ellipse rx="42" ry="16" fill="#FFF"/><ellipse rx="32" ry="10" fill="${c}"/></g>`).join('')}
        <path id="veg" fill="none" stroke="#4E9A3E" stroke-width="7" stroke-linecap="round"/>
        <g id="leaves"></g>
        <g transform="translate(${BOWL[0]} ${BOWL[1]})">${art('dz-bowl', 120, 88, bowl)}</g>
        <g id="chop" filter="url(#fToy)"><path d="M-4 0 L-10 90 M4 0 L10 90" stroke="#5A3018" stroke-width="5" stroke-linecap="round"/></g>
        <text x="180" y="80" text-anchor="middle" class="fest-sign">長年菜</text>`);
      const veg = st.$('#veg'), leaves = st.$('#leaves'), chop = st.$('#chop');
      const draw = () => {
        veg.setAttribute('d', `M${BOWL[0]} ${BOWL[1] - 20} Q${(BOWL[0] + tx) / 2 + Math.sin(top / 40) * 12} ${(BOWL[1] + top) / 2} ${tx} ${top}`);
        const n = Math.floor((BOWL[1] - top) / 34);
        leaves.innerHTML = Array.from({ length: n }, (_, i) => { const k = (i + .5) / Math.max(1, n), y = BOWL[1] - 20 + (top - BOWL[1] + 20) * k, x = BOWL[0] + (tx - BOWL[0]) * k; return `<ellipse cx="${x + (i % 2 ? 10 : -10)}" cy="${y}" rx="11" ry="5" fill="#6BB34E" transform="rotate(${i % 2 ? 30 : -30} ${x + (i % 2 ? 10 : -10)} ${y})"/>`; }).join('');
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
  let phase = 'wait', opened = 0, pos = [...REST];
  st.set(`${backdrop('chunjie', { wall: ['#F2C9A0', '#D8986A'], table: 430, tableColor: ['#B8302A', '#8A2420'] })}
    <g transform="translate(${BURNER[0]} ${BURNER[1] + 20})">${img(burnerUrl, 170, 125)}</g>
    <g id="planted" style="display:none" transform="translate(${MOUTH[0]} ${MOUTH[1] + 6})">${sticks()}</g>
    <g id="sticks" class="fest-hit" filter="url(#fToy)" style="display:none">${sticks()}</g>
    <g id="doorL"><rect x="0" y="0" width="180" height="645" fill="#B8302A" stroke="#7A1E1A" stroke-width="4"/>${[0, 1, 2, 3, 4, 5, 6].map((r) => [0, 1, 2, 3].map((c) => `<circle cx="${30 + c * 40}" cy="${70 + r * 80}" r="7" fill="#F3C64A"/>`).join('')).join('')}<circle cx="164" cy="330" r="14" fill="none" stroke="#F3C64A" stroke-width="4"/></g>
    <g id="doorR"><rect x="180" y="0" width="180" height="645" fill="#B8302A" stroke="#7A1E1A" stroke-width="4"/>${[0, 1, 2, 3, 4, 5, 6].map((r) => [0, 1, 2, 3].map((c) => `<circle cx="${210 + c * 40}" cy="${70 + r * 80}" r="7" fill="#F3C64A"/>`).join('')).join('')}<circle cx="196" cy="330" r="14" fill="none" stroke="#F3C64A" stroke-width="4"/></g>
    <text id="count" x="180" y="300" text-anchor="middle" class="fest-count"></text>`);
  const stk = st.$('#sticks');
  st.progress(0, 1);
  st.say('大年初一搶頭香！廟門一開，就把香插進香爐。準備好了嗎？', 'temple');
  const go = () => {
    if (phase !== 'wait') return; phase = 'count'; st.buttons([]);
    [3, 2, 1].forEach((n, i) => st.later(i * 800, () => { st.$('#count').textContent = n; st.sfx.knock(); }));
    st.later(2400, () => {
      st.$('#count').textContent = ''; st.sfx.bowl();
      st.tween(500, (k, e) => { st.$('#doorL').setAttribute('transform', `translate(${-e * 180} 0)`); st.$('#doorR').setAttribute('transform', `translate(${e * 180} 0)`); });
      stk.style.display = ''; place(stk, ...REST); phase = 'go'; opened = performance.now();
      st.say('廟門開了！<b>按住香</b>，快插進香爐！', 'temple');
      st.buttons([{ label: '插香', on: () => plant() }]);
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
    const s = (performance.now() - opened) / 1000, rank = Math.max(1, Math.round(s * 2.2));
    stk.style.display = 'none'; st.$('#planted').style.display = '';
    st.reset(); st.progress(1, 1); st.sfx.chime();
    const puff = () => { st.emit('smoke', MOUTH[0] + rand(-8, 8), MOUTH[1] - 74, { vy: -26, vx: rand(-6, 6), life: 2, s0: .4, s1: 1.4, fade: true }); st.later(300, puff); };
    puff();
    st.burst('star', MOUTH[0], MOUTH[1] - 60, 20);
    st.floatText(rank === 1 ? '頭香！' : `第 ${rank} 名`, 180, 220, '#FFE08A');
    o.done(`開門後 ${s.toFixed(1)} 秒就插上香，${rank === 1 ? '搶到<b>頭香</b>！' : `排在第 ${rank} 位，也很早！`}新年第一炷香，祝你整年順順利利。`);
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
  st.set(`${backdrop('chunjie-home', { wall: ['#FBE2C8', '#F1C49A'], table: 430, extra: `<g transform="translate(180 120)"><rect x="-26" y="-26" width="52" height="52" fill="#E0443E" transform="rotate(45)"/><text y="11" text-anchor="middle" class="fest-fu">春</text></g>` })}
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
  const TIGER = [180, 380];
  let top = 590, phase = 'cover', cord = 0, pulling = false;
  st.set(`${backdrop('chunjie-night', { wall: ['#3A3456', '#262040'], table: 470, tableColor: ['#6A4A6A', '#4A3450'], extra: `<circle cx="80" cy="110" r="28" fill="#FFF3C0"/><circle cx="92" cy="102" r="28" fill="#3A3456"/>` })}
    <ellipse cx="${TIGER[0]}" cy="${TIGER[1] + 58}" rx="130" ry="30" fill="#E0544A"/>
    <g transform="translate(${TIGER[0]} ${TIGER[1]})">${img(tigerSleepUrl, 220, 160)}</g>
    <g id="blanket"><path id="blkP" fill="#F3C64A" stroke="#C8963E" stroke-width="3"/><g id="blkDots"></g></g>
    <g id="lamp" transform="translate(300 170)"><path d="M-30 0 L30 0 L18 -44 L-18 -44Z" fill="#FFE29A"/><line x1="18" y1="0" x2="18" y2="70" id="cordL" stroke="#C8963E" stroke-width="2"/><circle id="cordK" cx="18" cy="74" r="7" fill="#E0443E" class="fest-hit"/></g>
    <rect id="dark" width="360" height="645" fill="#0A0818" opacity="0" pointer-events="none"/>`);
  const drawBlanket = () => {
    st.$('#blkP').setAttribute('d', `M30 ${top} Q180 ${top - 18} 330 ${top} L340 645 L20 645Z`);
    st.$('#blkDots').innerHTML = [0, 1, 2, 3, 4].map((i) => `<circle cx="${70 + i * 55}" cy="${top + 30 + (i % 2) * 16}" r="7" fill="#E0544A"/>`).join('');
  };
  drawBlanket();
  st.progress(0, 2);
  st.say('初三是「赤狗日」，習俗是不出門、不拜年、早點睡。虎爺已經睡著了，按住<b>被子邊邊</b>往上拉，幫祂蓋好。', 'temple');
  st.touch({
    down() { pulling = phase === 'lamp'; },
    move(p) {
      if (phase === 'cover') {
        const want = clamp(p.y - st.lift() * .4, 400, 600);
        if (want < top) { top = want; drawBlanket(); }
        if (top <= 410) { phase = 'lamp'; st.progress(1, 2); st.sfx.pop(); st.burst('heart', TIGER[0], TIGER[1] - 40, 6); st.say('蓋好了，虎爺打呼嚕。最後把右上角燈的<b>拉繩</b>往下拉，關燈睡覺。', 'cat'); }
      } else if (phase === 'lamp' && pulling) {
        const dy = clamp(p.y - st.lift() * .4 - 244, 0, 50);
        cord = dy; st.$('#cordK').setAttribute('cy', 74 + dy); st.$('#cordL').setAttribute('y2', 70 + dy);
        if (dy >= 40) lightsOff();
      }
    },
    up() { if (phase === 'lamp') { cord = 0; st.$('#cordK').setAttribute('cy', 74); st.$('#cordL').setAttribute('y2', 70); } },
  });
  function lightsOff() {
    if (phase !== 'lamp') return; phase = 'end'; st.buttons([]);
    st.sfx.knock(); st.$('#lamp path').setAttribute('fill', '#8A7A5A');
    st.tween(700, (k, e) => st.$('#dark').setAttribute('opacity', (e * .55).toFixed(2)));
    st.progress(2, 2);
    ['Z', 'z', 'Z'].forEach((z, i) => st.later(400 + i * 500, () => st.floatText(z, TIGER[0] + 60 + i * 14, TIGER[1] - 60 - i * 16, '#FFF3C0')));
    st.later(1600, () => o.done('晚安。初三在家好好休息，把過年的元氣補回來。'));
  }
  st.buttons([{ label: '幫我蓋好、關燈', on: () => { top = 405; drawBlanket(); phase = 'lamp'; lightsOff(); } }]);
}

// 初四：接神，擺四果
function jieshen(st, o) {
  const ITEMS = [['fruit', fruitUrl, 70, 80, '水果'], ['flowers', flowersUrl, 44, 80, '鮮花'], ['cakes', cakesUrl, 76, 67, '糕餅'], ['tea', teaUrl, 72, 51, '清茶']];
  const SPOTS = [[78, 392], [146, 388], [214, 388], [282, 392]];
  const REST = [[60, 530], [140, 525], [220, 532], [300, 536]];
  let filled = [], pos = [0, 0];
  st.set(`${backdrop('chunjie-jieshen', { wall: ['#F4D2A8', '#E0A878'], table: 400, tableColor: ['#B8302A', '#8A2420'], extra: `<path d="M0 0 H360 V60 Q180 100 0 60Z" fill="#E0443E"/><g id="beams" opacity="0">${[60, 140, 220, 300].map((x) => `<path d="M${x} 0 L${x - 20} 380 L${x + 20} 380Z" fill="#FFE9A0" opacity=".35"/>`).join('')}</g>` })}
    ${SPOTS.map(([x, y], i) => `<ellipse id="spot${i}" cx="${x}" cy="${y + 10}" rx="28" ry="8" fill="none" stroke="#FFF4D8" stroke-width="2" stroke-dasharray="5 5"/>`).join('')}
    ${ITEMS.map(([k, url, w, h], i) => `<g id="it-${k}" class="fest-hit" filter="url(#fToy)">${img(url, w, h)}</g>`).join('')}`);
  ITEMS.forEach(([k], i) => place(st.$('#it-' + k), ...REST[i]));
  st.progress(0, 4);
  st.say('初四接神：送上天的眾神今天回到人間。把四樣供品擺上供桌，歡迎祂們回來。', 'temple');
  const freeSpot = () => { let b = -1; SPOTS.forEach((s, i) => { if (!filled.includes(i) && (b < 0 || D(pos, s) < D(pos, SPOTS[b]))) b = i; }); return b; };
  ITEMS.forEach(([k, , , , name], i) => {
    const el = st.$('#it-' + k); let done = false;
    st.hold(el, {
      magnet: () => { if (done) return null; const s = freeSpot(); return s >= 0 ? [SPOTS[s][0], SPOTS[s][1] - 20, 44] : null; },
      onStart() { if (!done) st.zoom(180, 430, 280); },
      onMove(x, y) { if (done) return; pos = [x, y]; place(el, x, y); },
      onUp() {
        if (done) return; st.reset();
        const s = freeSpot();
        if (s >= 0 && D(pos, [SPOTS[s][0], SPOTS[s][1] - 20]) < 34) {
          done = true; filled.push(s); place(el, SPOTS[s][0], SPOTS[s][1] - 20);
          st.$('#spot' + s).setAttribute('opacity', '0'); st.sfx.pop(); st.burst('star', SPOTS[s][0], SPOTS[s][1] - 30, 8);
          st.progress(filled.length, 4);
          if (filled.length === 4) welcome();
        } else flyTo(st, el, pos, REST[i], 300);
      },
    });
  });
  function welcome() {
    st.buttons([]); st.sfx.bowl();
    st.tween(1200, (k, e) => st.$('#beams').setAttribute('opacity', e.toFixed(2)));
    const rain = (n) => { if (n <= 0) return; st.emit('star', rand(30, 330), 0, { vy: rand(60, 120), vx: rand(-10, 10), life: 2.4, s0: 1, s1: .4 }); st.later(70, () => rain(n - 1)); };
    rain(40);
    st.later(1800, () => o.done('眾神回到人間了，金光灑滿供桌。新的一年，請神明繼續保佑。'));
  }
  st.buttons([{ label: '幫我擺好', on: () => { ITEMS.forEach(([k], i) => { if (!filled.includes(i)) place(st.$('#it-' + k), SPOTS[i][0], SPOTS[i][1] - 20); st.$('#spot' + i).setAttribute('opacity', '0'); }); filled = [0, 1, 2, 3]; st.progress(4, 4); welcome(); } }]);
}

// 初五：開工放鞭炮，迎財神
function kaigong(st, o) {
  const X = 250, TOP = 70, SEG = 15, FUSE = [X, TOP + SEG * 26 + 18], REST = [90, 520];
  let phase = 'light', pos = [...REST], heat = 0, popped = 0;
  st.set(`${backdrop('chunjie-kaigong', { wall: ['#F6D2A4', '#E8AC72'], table: 520, extra: `<rect x="40" y="90" width="120" height="160" rx="6" fill="#E0443E"/><text x="100" y="160" text-anchor="middle" class="fest-sign">開工</text><text x="100" y="215" text-anchor="middle" class="fest-sign">大吉</text>` })}
    <line x1="${X}" y1="0" x2="${X}" y2="${FUSE[1]}" stroke="#5A3018" stroke-width="2"/>
    ${Array.from({ length: SEG }, (_, i) => `<g id="seg${i}" transform="translate(${X} ${TOP + i * 26})"><rect x="-22" y="0" width="18" height="24" rx="4" fill="#E0443E" stroke="#9A2420" stroke-width="1.4" transform="rotate(-25 -13 12)"/><rect x="4" y="0" width="18" height="24" rx="4" fill="#E0443E" stroke="#9A2420" stroke-width="1.4" transform="rotate(25 13 12)"/></g>`).join('')}
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

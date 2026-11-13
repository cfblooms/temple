// 太歲殿：安太歲（選生肖、寫名字到太歲符上，拿進光明燈櫃點亮一整年；臘月謝太歲）；查今年誰犯太歲；太歲籤。
// 場景座標 360 × 645；SVG 裡的 id 都加 v 前綴。
import bgUrl from './assets/ts/ts-bg.webp';
import festUrl from './assets/ts/ts-festival.webp';
import talUrl from './assets/ts/talisman.webp';
import offUrl from './assets/ts/lamp-off.webp';
import onUrl from './assets/ts/lamp-on.webp';
import { makeCarrier } from './carry.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 生肖與太歲 ---------- */
const ZOD = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];
const STEM = '甲乙丙丁戊己庚辛壬癸', BR = '子丑寅卯辰巳午未申酉戌亥';
const PO = { 0: 9, 9: 0, 6: 3, 3: 6, 5: 8, 8: 5, 2: 11, 11: 2, 4: 1, 1: 4, 10: 7, 7: 10 };
const XING = [[2, 5, 8], [1, 10, 7], [0, 3]];
export function lunarYear(d = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { year: 'numeric', month: 'numeric' }).formatToParts(d);
    const ry = parts.find((p) => p.type === 'relatedYear');
    if (ry) return +ry.value;
    const m = parseInt(parts.find((p) => p.type === 'month').value.replace(/\D/g, ''), 10);
    return d.getMonth() <= 1 && m >= 11 ? d.getFullYear() - 1 : d.getFullYear();
  } catch { return d.getMonth() <= 1 ? d.getFullYear() - 1 : d.getFullYear(); }
}
const brOf = (y) => ((y - 4) % 12 + 12) % 12;
const ganzhi = (y) => STEM[((y - 4) % 10 + 10) % 10] + BR[brOf(y)];
export function clash(p, y) { // 這個生肖今年犯什麼
  const b = brOf(y), out = [];
  if (p === b) out.push('值太歲');
  if ((p + 6) % 12 === b) out.push('沖太歲');
  if (p !== b && XING.some((g) => g.includes(p) && g.includes(b))) out.push('刑太歲');
  if (p === b && [4, 6, 9, 11].includes(p)) out.push('刑太歲');
  if ((p + b) % 12 === 7) out.push('害太歲');
  if (PO[p] === b) out.push('破太歲');
  return out;
}

/* ---------- 文字內容（原創） ---------- */
export const TS_QIAN = [
  { no: 1, level: '上上', title: '順年', poem: ['太歲星君點點頭', '今年一路好行走', '小心駛得萬年船', '平平安安到年頭'],
    gist: '今年整體平順，保持謹慎，就能穩穩走完一年。', tip: '把今年想完成的三件事寫下來，貼在看得到的地方。' },
  { no: 2, level: '中吉', title: '化解', poem: ['犯了太歲別擔心', '安了光明照你心', '凡事多想想一下', '壞事也會變好運'],
    gist: '犯太歲不是壞事，是提醒你今年多一分小心。', tip: '重要的決定，今天先別急，睡一晚再說。' },
  { no: 3, level: '上吉', title: '貴人', poem: ['十二生肖排排坐', '總有一個幫你多', '有困難時說出口', '貴人就在你身旁'],
    gist: '今年貴人運不錯，遇到困難記得開口。', tip: '跟一位很久沒聯絡的長輩打個招呼。' },
  { no: 4, level: '中平', title: '守成', poem: ['今年不宜大冒險', '守住現有最要緊', '錢財慢慢存起來', '明年再來展身手'],
    gist: '今年適合穩紮穩打，不適合衝動投資或大變動。', tip: '檢查一下這個月的花費，找一項可以省的。' },
  { no: 5, level: '上吉', title: '健康', poem: ['身體是你的本錢', '早睡早起多運動', '太歲保你身強健', '一年四季都輕鬆'],
    gist: '把身體顧好，就是今年最好的開運。', tip: '今天走路多走二十分鐘，或早一小時睡覺。' },
  { no: 6, level: '中吉', title: '和氣', poem: ['口舌是非少一點', '笑容多給人家點', '退一步海闊天空', '和氣生財在眼前'],
    gist: '今年容易有口角，少說一句，多笑一下。', tip: '今天遇到不順的事，先深呼吸三次再開口。' },
  { no: 7, level: '中平', title: '出行', poem: ['出門在外多留心', '東西收好不遺失', '開車慢行看路況', '平安回家最開心'],
    gist: '出門要多注意交通和隨身物品，慢一點沒關係。', tip: '出門前檢查鑰匙、錢包、證件，再出發。' },
  { no: 8, level: '上上', title: '光明', poem: ['一盞明燈照前程', '黑夜裡也看得清', '心裡有光不迷路', '今年事事都光明'],
    gist: '心裡有方向，就不怕走夜路。今年會越走越亮。', tip: '寫下今年最想成為的樣子，一句話就好。' },
];
const GREET = [
  '太歲星君拿著令旗：「今年由我值年，有我在，別怕。」',
  '太歲星君點點頭：「安了太歲，就安心過日子吧。」',
  '太歲星君說：「十二生肖我都照顧，你也不例外。」',
  '太歲星君目光溫和：「凡事小心一點，今年會平平安安的。」',
];
const NAMES = ['一', '二', '三', '四', '五', '六', '七', '八'];

/* ---------- 場景 ---------- */
// 參考點：太歲臉 (180,285)、供桌桌面 y≈378、拜墊中心 (184,525)
const CAB = [278, 474, 26, 27]; // 光明燈櫃：左上 x、y、每格寬、高（3×3）
const MINE = [1, 1]; // 你的燈：中間那格
const NICHE = [CAB[0] + CAB[2] * (MINE[0] + .5), CAB[1] + CAB[3] * (MINE[1] + .5)];
const TAL = [28, 54]; // 太歲符寬高（原點在底部中心）
const T_REST = [58, 610];
const OTHERS = [1, 0, 1, 0, 0, 1, 1, 0, 1]; // 其他人點的燈（裝飾）
export const TS_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="太歲殿" class="ts-svg">
  <defs>
    <filter id="vLit" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="1 .03 0 0 .01  .02 .93 0 0 0  .01 .02 .88 0 0  0 0 0 1 0"/>
    </filter>
    <radialGradient id="vContact"><stop offset="0" stop-color="#1A0A12" stop-opacity=".6"/><stop offset="1" stop-color="#1A0A12" stop-opacity="0"/></radialGradient>
    <radialGradient id="vHalo"><stop offset="0" stop-color="#FFF3C8" stop-opacity=".95"/><stop offset=".6" stop-color="#FFC36B" stop-opacity=".35"/><stop offset="1" stop-color="#FFC36B" stop-opacity="0"/></radialGradient>
    <radialGradient id="vGlow"><stop offset="0" stop-color="#FFE6A0" stop-opacity=".95"/><stop offset="1" stop-color="#FFB050" stop-opacity="0"/></radialGradient>
  </defs>
  <image id="vBg" href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice" style="display:none"/>
  <circle transform="translate(182 380) scale(1.38) translate(-182 -380)" id="vHaloC" cx="180" cy="285" r="58" fill="url(#vHalo)" opacity=".15" style="mix-blend-mode:screen"/>
  <rect transform="translate(182 380) scale(1.38) translate(-182 -380)" class="hit" data-ts="deity" role="button" tabindex="0" aria-label="向太歲星君問安" x="142" y="245" width="78" height="115" rx="22" fill="transparent"/>

  <!-- 光明燈櫃（拜墊右邊） -->
  <ellipse cx="${CAB[0] + CAB[2] * 1.5}" cy="${CAB[1] + CAB[3] * 3 + 14}" rx="52" ry="6" fill="url(#vContact)"/>
  <g class="hit" data-ts="cab" role="button" tabindex="0" aria-label="光明燈櫃">
    <rect x="${CAB[0] - 6}" y="${CAB[1] - 20}" width="${CAB[2] * 3 + 12}" height="${CAB[3] * 3 + 34}" rx="6" fill="#3A1A22" stroke="#C8963E" stroke-width="2"/>
    <text class="ts-cab-title" x="${CAB[0] + CAB[2] * 1.5}" y="${CAB[1] - 6}" text-anchor="middle">光明燈</text>
    ${OTHERS.map((on, i) => {
      const c = i % 3, r = Math.floor(i / 3), mine = c === MINE[0] && r === MINE[1];
      return `<image ${mine ? 'id="vMine"' : ''} href="${on && !mine ? onUrl : offUrl}" x="${CAB[0] + c * CAB[2]}" y="${CAB[1] + r * CAB[3]}" width="${CAB[2]}" height="${CAB[3]}"/>`;
    }).join('')}
    <circle id="vMineGlow" cx="${NICHE[0]}" cy="${NICHE[1] + 2}" r="22" fill="url(#vGlow)" opacity="0" style="mix-blend-mode:screen"/>
    <rect id="vRing" x="${NICHE[0] - CAB[2] / 2 - 1}" y="${NICHE[1] - CAB[3] / 2 - 1}" width="${CAB[2] + 2}" height="${CAB[3] + 2}" rx="4" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  </g>

  <!-- 太歲符（寫好才出現在左下角） -->
  <g id="vTal" class="ts-prop" data-ts="tal" role="button" tabindex="0" aria-label="太歲符，拿進光明燈櫃" style="display:none" transform="translate(${T_REST[0]} ${T_REST[1]})">
    <ellipse cx="0" cy="2" rx="14" ry="3" fill="url(#vContact)"/>
    <image href="${talUrl}" x="${-TAL[0] / 2}" y="${-TAL[1]}" width="${TAL[0]}" height="${TAL[1]}" filter="url(#vLit)"/>
    <text id="vTalText" class="ts-name" x="0" y="${-TAL[1] + 13}" text-anchor="middle"></text>
  </g>
</svg>`;

export function initTaisui(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam } = api;
  const host = $('#tsHost');
  host.innerHTML = TS_SVG(bgUrl);
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const ts = state.ts || (state.ts = { year: 0, z: -1, name: '', thanked: false, qian: null });
  const Y = () => lunarYear();
  const lit = () => ts.year === Y();
  const yearName = () => `${ganzhi(Y())}${ZOD[brOf(Y())]}年`;
  const isLaYue = () => { try { const m = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { month: 'numeric' }).formatToParts(new Date()).find((p) => p.type === 'month').value; return parseInt(m.replace(/\D/g, ''), 10) === 12; } catch { return false; } };

  function greetGod() {
    S('vHaloC').setAttribute('opacity', '.7'); setTimeout(() => S('vHaloC').setAttribute('opacity', '.15'), 1400);
    burst('spark', 180, 285, reduce ? 3 : 10);
    say(GREET[Math.floor(Math.random() * GREET.length)], 'god');
  }

  /* ----- 你的那盞燈 ----- */
  let flick = 0;
  function paintLamp() {
    S('vMine').setAttribute('href', lit() ? onUrl : offUrl);
    cancelAnimationFrame(flick);
    const g = S('vMineGlow');
    if (!lit()) { g.setAttribute('opacity', '0'); return; }
    if (reduce) { g.setAttribute('opacity', '.6'); return; }
    const f = (t) => { g.setAttribute('opacity', (.55 + Math.sin(t / 200) * .08 + Math.sin(t / 83) * .05).toFixed(2)); flick = requestAnimationFrame(f); };
    flick = requestAnimationFrame(f);
  }
  paintLamp();

  /* ----- 安太歲 ----- */
  let draft = null; // { z, name }
  const tal = S('vTal');
  const carrier = makeCarrier({
    svg, el: tal, sfx, cam, ring: S('vRing'), lift: 60, radius: 26,
    rest: () => T_REST, target: () => [NICHE[0], NICHE[1] + TAL[1] / 2 - 4], zoom: () => [NICHE[0] - 40, NICHE[1] - 10, 200],
    onTap: () => say('按住左下角的<b>太歲符</b>拿起來，放進右邊<b>光明燈櫃</b>中間那一格。', 'god'),
    onDrop() {
      tal.style.display = 'none';
      Object.assign(ts, { year: Y(), z: draft.z, name: draft.name, thanked: false }); save(); paintLamp();
      sfx.chime(); sfx.buzz([15, 40, 15, 40, 20]);
      burst('spark', NICHE[0], NICHE[1], reduce ? 4 : 18);
      emit('text', NICHE[0] - 40, NICHE[1] - 75, { text: '光明燈亮了', color: '#FFE08A', life: 1.8, vy: -24 });
      S('vHaloC').setAttribute('opacity', '.75'); setTimeout(() => S('vHaloC').setAttribute('opacity', '.15'), 1800);
      const c = clash(draft.z, Y());
      say(`太歲安好了！屬${ZOD[draft.z]}的「${esc(draft.name)}」，光明燈會亮一整個${yearName()}。${c.length ? `今年${c.join('、')}，有太歲星君照看，凡事多想一下就好。` : '今年沒有犯太歲，安個平安更安心。'}`, 'god');
      draft = null; cam?.reset(2200);
    },
  });
  function setTalText(z, name) {
    const el = S('vTalText'); el.innerHTML = '';
    [...`屬${ZOD[z]}`, '·', ...name].slice(0, 7).forEach((c, i) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'tspan'); s.setAttribute('x', '0'); s.setAttribute('y', -TAL[1] + 14 + i * 6); s.textContent = c === '·' ? '' : c; el.appendChild(s); });
  }
  function openAn() {
    if (lit()) {
      const la = isLaYue() && !ts.thanked;
      const body = openSheet(la ? '謝太歲' : '今年已安太歲', `
        <p>屬${ZOD[ts.z]}的「<b>${esc(ts.name)}</b>」已經安了${yearName()}的太歲，光明燈亮著。</p>
        ${la ? '<p>年底到了，按習俗要<b>謝太歲</b>，謝謝太歲星君這一年的照顧。</p><div class="row"><button class="btn" id="vThank">謝太歲</button></div>'
          : ts.thanked ? '<p class="hint">今年已經謝過太歲了，明年過年再來安新的。</p>' : '<p class="hint">臘月（農曆十二月）回來謝太歲，一年就圓滿了。</p>'}`);
      body.querySelector('#vThank')?.addEventListener('click', () => {
        ts.thanked = true; save(); closeSheet();
        sfx.chime(); burst('spark', 180, 285, reduce ? 4 : 20);
        say('謝過太歲了。太歲星君收起令旗：「這一年辛苦了，明年也平平安安。」', 'god');
      });
      return;
    }
    const body = openSheet(`安太歲・${yearName()}`, `
      <p>選生肖、寫上名字，太歲符會出現在左下角。把它拿進<b>光明燈櫃</b>，燈就會亮一整年。也可以幫家人安。</p>
      <div class="ts-zod">${ZOD.map((z, i) => { const c = clash(i, Y()); return `<button type="button" class="chip" data-z="${i}" aria-pressed="false">${z}${c.length ? '<i>犯</i>' : ''}</button>`; }).join('')}</div>
      <p id="vNote" class="hint">標「犯」的生肖今年犯太歲。</p>
      <input id="vName" class="yue-wish" maxlength="4" placeholder="名字（最多 4 個字）">
      <div class="row"><button class="btn" id="vGo">寫上太歲符</button></div>`);
    let z = -1;
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-z]'); if (!b) return;
      z = +b.dataset.z; body.querySelectorAll('[data-z]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const c = clash(z, Y());
      body.querySelector('#vNote').innerHTML = c.length ? `屬${ZOD[z]}今年<b>${c.join('、')}</b>，建議安太歲。` : `屬${ZOD[z]}今年沒有犯太歲，安個平安也很好。`;
    });
    body.querySelector('#vGo').addEventListener('click', () => {
      const name = body.querySelector('#vName').value.trim().replace(/\s+/g, '');
      if (z < 0) { body.querySelector('#vNote').innerHTML = '先選一個生肖。'; return; }
      if (!name) { body.querySelector('#vName').focus(); return; }
      draft = { z, name }; closeSheet(); setTalText(z, name);
      tal.style.display = ''; carrier.home();
      tal.classList.remove('pop'); void tal.getBoundingClientRect(); tal.classList.add('pop');
      sfx.pop();
      say('太歲符寫好了，在左下角。按住它拿起來，放進右邊<b>光明燈櫃</b>中間那一格。', 'god');
    });
  }

  /* ----- 查今年犯太歲 ----- */
  function openWho() {
    const y = Y(), list = ZOD.map((z, i) => [z, clash(i, y)]).filter(([, c]) => c.length);
    openSheet(`${yearName()}犯太歲的生肖`, `
      <ul class="ts-list">${list.map(([z, c]) => `<li><b>屬${z}</b>${c.join('、')}</li>`).join('')}</ul>
      <p>犯太歲不是壞事，是提醒這一年凡事多小心。可以安太歲、點光明燈求個安心。</p>
      <p class="hint">依民俗「值、沖、刑、害、破」推算，各家廟宇說法可能略有不同。</p>`);
  }

  /* ----- 太歲籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!ts.qian || ts.qian.date !== t) { ts.qian = { date: t, no: 1 + Math.floor(Math.random() * TS_QIAN.length) }; save(); sfx.rattle(1); }
    const f = TS_QIAN.find((x) => x.no === ts.qian.no);
    openSheet(`太歲籤第${NAMES[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>太歲籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日平安小功課</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，平安是自己一天一天顧出來的。</p>`);
  }

  const ACTS = { an: () => (draft ? carrier.auto() : openAn()), who: openWho, qian: openQian };
  svg.addEventListener('click', (e) => {
    if (e.target.closest('[data-ts="deity"]')) greetGod();
    else if (e.target.closest('[data-ts="cab"]')) { if (draft) carrier.auto(); else openAn(); }
  });
  svg.querySelector('[data-ts="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#tsBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-ts]'); if (b) ACTS[b.dataset.ts](); });

  return {
    enter() {
      paintLamp();
      say(lit() ? `歡迎回來。屬${ZOD[ts.z]}的「${esc(ts.name)}」的光明燈還亮著。${isLaYue() && !ts.thanked ? '年底了，記得按「安太歲」<b>謝太歲</b>。' : '上一炷香跟太歲星君問安吧。'}`
        : `歡迎來到太歲殿！今年是${yearName()}。按「安太歲」選生肖、寫名字，把太歲符放進光明燈櫃，燈會亮一整年。`, 'god');
    },
    setFestive(on) { S('vBg').setAttribute('href', on ? festUrl : bgUrl); },
    god: '太歲', qianName: '太歲籤', qianCount: TS_QIAN.length,
    hasQianToday: () => !!ts.qian && ts.qian.date === dayKey(),
    setQian(no) { ts.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

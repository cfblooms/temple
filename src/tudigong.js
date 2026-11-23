// 福德祠（土地公）：每天澆水種福德樹（種子 → 發芽 → 小樹 → 結金果）、獻麻糬花生、土地公籤。
// 場景座標跟正殿一樣是 360 × 645；SVG 裡的 id 都加 t 前綴，避免跟其他殿的 SVG 撞名。
import bgUrl from './assets/tudi/tudi-bg.webp';
import festUrl from './assets/tudi/tudi-festival.webp';
import canUrl from './assets/tudi/can.webp';
import mochiUrl from './assets/tudi/mochi.webp';
import tree1 from './assets/tudi/tree-1.webp';
import tree2 from './assets/tudi/tree-2.webp';
import tree3 from './assets/tudi/tree-3.webp';
import tree4 from './assets/tudi/tree-4.webp';
import { makePourer } from './pour.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TREES = [tree1, tree2, tree3, tree4];
// 澆幾天會長到哪一階段：第 2 天發芽、第 4 天小樹、第 7 天結金果
const STAGE_AT = [0, 2, 4, 7];
const STAGE_NAME = ['種子', '小芽', '小樹', '金果樹'];
const stageOf = (days) => (days >= 7 ? 3 : days >= 4 ? 2 : days >= 2 ? 1 : 0);

/* ---------- 文字內容（原創） ---------- */
export const TUDI_QIAN = [
  { no: 1, level: '上吉', title: '安居', poem: ['門前榕樹好遮陰', '厝內燈火暖人心', '平安就是大財富', '一家和氣值千金'],
    gist: '家裡平平安安、大家說得上話，就是最實在的福氣。', tip: '今天回家跟家人多聊五分鐘，問問他們今天過得怎樣。' },
  { no: 2, level: '中吉', title: '勤耕', poem: ['一分耕耘一分田', '汗水滴落變銅錢', '莫嫌日日都平淡', '秋來倉滿笑開顏'],
    gist: '現在做的小事都在累積，不用急著看到成果。', tip: '把今天最重要的一件工作先做完，再滑手機。' },
  { no: 3, level: '上上', title: '貴人', poem: ['巷口阿伯點點頭', '隔壁阿姨送菜頭', '人情來往心頭暖', '貴人原在身邊留'],
    gist: '貴人常常就是身邊的普通人。對人好一點，好運會繞回來。', tip: '跟每天會遇到的一個人（警衛、店員、同事）說聲謝謝。' },
  { no: 4, level: '中平', title: '守成', poem: ['風大莫要強出頭', '先顧本業穩穩收', '錢財慢慢存起來', '雨過天晴再出遊'],
    gist: '最近適合穩穩來，不適合衝動投資或大手筆花錢。', tip: '打開記帳，看看這個月最大筆的花費是什麼。' },
  { no: 5, level: '上吉', title: '開店', poem: ['招牌掛起笑臉迎', '一碗一碗用真心', '客人吃得歡喜走', '口碑自會傳千里'],
    gist: '做生意、做工作都一樣：把眼前的人顧好，生意自然會來。', tip: '把一件交出去的成品再檢查一次，多做一點點細節。' },
  { no: 6, level: '中吉', title: '歸鄉', poem: ['離家打拚日子長', '電話一通報平安', '故鄉土地記得你', '累了就回來看看'],
    gist: '在外面再忙，也別忘了根在哪裡。累了休息不丟臉。', tip: '傳一則訊息給很久沒聯絡的家人或老朋友。' },
  { no: 7, level: '中平', title: '小心', poem: ['路上坑洞要看清', '出門記得帶傘行', '小事做足不出錯', '土地公在暗中迎'],
    gist: '最近多注意小細節：門鎖、瓦斯、行車安全，小心駛得萬年船。', tip: '出門前確認一下鑰匙、錢包、手機和雨傘。' },
  { no: 8, level: '上上', title: '豐收', poem: ['一粒種子落土中', '日日澆水不放空', '有朝金果滿枝頭', '福氣原來慢慢紅'],
    gist: '每天一點點的堅持，會在某天一起開花結果。', tip: '挑一個每天做五分鐘就好的小習慣，從今天開始。' },
];

const GREET = [
  '土地公摸摸白鬍子：「來啦？坐一下，喝杯茶再走。」',
  '土地公笑咪咪：「家裡大小都平安吧？平安就好、平安就好。」',
  '土地公拄著拐杖點點頭：「今天的樹有沒有澆水呀？」',
  '土地公舉起金元寶晃一晃：「財不用多，夠用、心安就好。」',
];
const NAMES = ['一', '二', '三', '四', '五', '六', '七', '八'];

/* ---------- 場景 ---------- */
// 參考點：土地公臉 (182,280)、供桌桌面 y≈384、拜墊中心 (184,525)、福德樹盆土 (300,578)
const POT = { x: 264, y: 510, w: 72, h: 100 };
const SOIL = [300, 578];
const CAN_REST = [56, 584];
const CAN_POUR = [321, 526]; // 壺嘴剛好在盆土正上方
const SPOUT = [-28, 7]; // 壺嘴相對水壺中心（沒傾斜時）
export const TUDI_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="福德祠" class="tudi-svg">
  <defs>
    <filter id="tLit" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="1 .03 0 0 .01  .02 .94 0 0 0  .01 .02 .86 0 0  0 0 0 1 0"/>
    </filter>
    <radialGradient id="tContact"><stop offset="0" stop-color="#2A140A" stop-opacity=".55"/><stop offset="1" stop-color="#2A140A" stop-opacity="0"/></radialGradient>
    <radialGradient id="tHalo"><stop offset="0" stop-color="#FFF3C8" stop-opacity=".95"/><stop offset=".6" stop-color="#FFD36B" stop-opacity=".35"/><stop offset="1" stop-color="#FFD36B" stop-opacity="0"/></radialGradient>
  </defs>
  <image id="tBg" href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice" style="display:none"/>
  <circle transform="translate(182 380) scale(1.38) translate(-182 -380)" id="tHaloC" cx="182" cy="290" r="58" fill="url(#tHalo)" opacity=".15" style="mix-blend-mode:screen"/>
  <rect transform="translate(182 380) scale(1.38) translate(-182 -380)" class="hit" data-tudi="deity" role="button" tabindex="0" aria-label="向土地公問安" x="146" y="252" width="72" height="108" rx="22" fill="transparent"/>

  <!-- 麻糬花生（供桌右側，獻了才出現） -->
  <image id="tMochi" class="tudi-mochi" href="${mochiUrl}" x="199" y="356" width="46" height="34" style="display:none" filter="url(#tLit)"/>

  <!-- 福德樹（拜墊右前方） -->
  <ellipse cx="300" cy="609" rx="30" ry="5" fill="url(#tContact)"/>
  <circle id="tTarget" cx="${SOIL[0]}" cy="${SOIL[1] - 6}" r="24" fill="none" stroke="#BFE8FF" stroke-width="2" stroke-dasharray="5 5" opacity="0" pointer-events="none"/>
  <image id="tTree" class="tudi-tree" data-tudi="tree" role="button" tabindex="0" aria-label="福德樹" href="${tree1}" x="${POT.x}" y="${POT.y}" width="${POT.w}" height="${POT.h}" filter="url(#tLit)"/>

  <!-- 澆水壺（拜墊左前方，可以拿起來） -->
  <ellipse id="tCanShadow" cx="${CAN_REST[0]}" cy="${CAN_REST[1] + 25}" rx="26" ry="4.5" fill="url(#tContact)"/>
  <g id="tCan" class="tudi-can" data-tudi="can" role="button" tabindex="0" aria-label="澆水壺" transform="translate(${CAN_REST[0]} ${CAN_REST[1]})">
    <g id="tCanTilt"><image href="${canUrl}" x="-29" y="-26" width="58" height="53" filter="url(#tLit)"/></g>
  </g>
</svg>`;

export function initTudigong(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam } = api;
  const host = $('#tudiHost');
  host.innerHTML = TUDI_SVG(bgUrl);
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const tu = state.tudi || (state.tudi = { days: 0, waterDay: '', mochiDay: '', gold: 0, qian: null });
  const watered = () => tu.waterDay === dayKey();

  /* ----- 土地公問安 ----- */
  function greetGod() {
    S('tHaloC').setAttribute('opacity', '.7'); setTimeout(() => S('tHaloC').setAttribute('opacity', '.15'), 1400);
    burst('spark', 182, 285, reduce ? 3 : 10);
    say(GREET[Math.floor(Math.random() * GREET.length)], 'god');
  }

  /* ----- 福德樹 ----- */
  const tree = S('tTree');
  const paintTree = () => {
    const st = stageOf(tu.days);
    tree.setAttribute('href', TREES[st]);
    tree.setAttribute('aria-label', `福德樹：${STAGE_NAME[st]}，已經澆水 ${tu.days} 天`);
    tree.classList.toggle('ripe', st === 3);
  };
  paintTree();
  const left = () => { const st = stageOf(tu.days); return st < 3 ? [STAGE_AT[st + 1] - tu.days, STAGE_NAME[st + 1]] : null; };

  function grow() {
    const before = stageOf(tu.days);
    tu.days++; tu.waterDay = dayKey(); save();
    const after = stageOf(tu.days);
    paintTree();
    sfx.chime(); sfx.buzz([15, 40, 15]);
    emit('text', SOIL[0] - 20, POT.y - 4, { text: `澆水第 ${tu.days} 天`, color: '#CFF0FF', life: 1.8, vy: -22 });
    if (after !== before) {
      tree.classList.remove('pop'); void tree.getBoundingClientRect(); tree.classList.add('pop');
      burst('spark', SOIL[0], POT.y + 30, reduce ? 4 : 18);
    }
    const nx = left();
    say(after === 3 && before !== 3 ? '哇！福德樹<b>結出金果</b>了！點一下樹，把金果摘下來。'
      : after !== before ? `福德樹長成<b>${STAGE_NAME[after]}</b>了！${nx ? `再澆 ${nx[0]} 天會變成${nx[1]}。` : ''}`
      : nx ? `澆好水了。再澆 ${nx[0]} 天，福德樹會變成<b>${nx[1]}</b>。明天記得再來喔。` : '澆好水了，金果亮晶晶的。點一下樹就能摘。', 'god');
  }
  function harvest() {
    tu.gold++; tu.days = 0; save();
    sfx.chime(); setTimeout(() => sfx.chime(), 220); sfx.buzz([20, 60, 20, 60, 40]);
    burst('spark', SOIL[0], POT.y + 20, reduce ? 6 : 30);
    emit('text', SOIL[0] - 24, POT.y, { text: '土地公金 +1', color: '#FFE08A', life: 2, vy: -26 });
    setTimeout(() => { paintTree(); tree.classList.remove('pop'); void tree.getBoundingClientRect(); tree.classList.add('pop'); }, 500);
    say(`摘下金果，換成一份<b>土地公金</b>（你已經有 ${tu.gold} 份）。土地公又幫你種下一顆新的種子，明天開始再澆水吧。`, 'god');
  }
  function tapTree() {
    if (stageOf(tu.days) === 3) { harvest(); return; }
    const nx = left();
    sfx.knock();
    say(`這是你的福德樹（${STAGE_NAME[stageOf(tu.days)]}），已經澆水 ${tu.days} 天。${watered() ? '今天澆過了，明天再來。' : '今天還沒澆水：拿起左下角的澆水壺，移到樹上面就會澆水。'}${nx ? `再澆 ${nx[0]} 天會變成${nx[1]}。` : ''}`);
  }

  /* ----- 澆水壺：拿起來移到盆子上，自己會倒水 ----- */
  const target = S('tTarget');
  const can = makePourer({
    cam, svg, el: S('tCan'), tilt: S('tCanTilt'), shadow: S('tCanShadow'), target, sfx, emit,
    rest: CAN_REST, pourAt: CAN_POUR, spout: SPOUT, isDone: watered, onDone: grow, onTap: () => hintWater(),
  });
  const autoWater = () => can.auto();
  function hintWater() {
    if (watered()) { say(`今天已經澆過水了（第 ${tu.days} 天）。福德樹喜歡每天一點點，明天再來。`); return; }
    target.setAttribute('opacity', '.9'); setTimeout(() => { if (!can.dragging()) target.setAttribute('opacity', '0'); }, 1600);
    say('按住左下角的<b>澆水壺</b>，移到右邊福德樹的上面，就會自己倒水。', 'god');
  }

  /* ----- 福德樹進度 ----- */
  function openTree() {
    const st = stageOf(tu.days), nx = left();
    const body = openSheet('我的福德樹', `
      <div class="tudi-tree-card"><img src="${TREES[st]}" alt="福德樹：${STAGE_NAME[st]}"></div>
      <p class="tudi-steps">${STAGE_NAME.map((n, i) => `<span class="${i <= st ? 'on' : ''}"><b>${STAGE_AT[i] || 1}</b>${n}</span>`).join('')}</p>
      <p>已經澆水 <b>${tu.days}</b> 天${nx ? `，再澆 ${nx[0]} 天會變成<b>${nx[1]}</b>` : '，金果已經熟了'}。漏掉一天不會枯，只是長得慢一點。</p>
      <p class="hint">摘過的土地公金：${tu.gold} 份。${watered() ? '今天已經澆過水了。' : '今天還沒澆水。'}</p>
      <div class="row">${st === 3 ? '<button class="btn gold" id="tPick">摘金果</button>' : watered() ? '<button class="btn ghost" id="tOk">好</button>' : '<button class="btn" id="tWater">去澆水</button>'}</div>`);
    body.querySelector('#tOk')?.addEventListener('click', closeSheet);
    body.querySelector('#tPick')?.addEventListener('click', () => { closeSheet(); harvest(); });
    body.querySelector('#tWater')?.addEventListener('click', () => { closeSheet(); autoWater(); });
  }

  /* ----- 獻麻糬花生 ----- */
  const mochi = S('tMochi');
  const paintMochi = () => { mochi.style.display = tu.mochiDay === dayKey() ? '' : 'none'; };
  paintMochi();
  function offerMochi() {
    if (tu.mochiDay === dayKey()) { say('今天的麻糬花生已經擺在供桌上了，土地公說牙口不好，麻糬剛剛好。'); return; }
    tu.mochiDay = dayKey(); save(); paintMochi();
    mochi.classList.remove('pop'); void mochi.getBoundingClientRect(); mochi.classList.add('pop');
    sfx.pop(); setTimeout(() => sfx.chime(), 300);
    burst('spark', 222, 368, reduce ? 3 : 10);
    say('麻糬和花生擺上供桌了。土地公呵呵笑：「軟軟的麻糬黏住好運，花生是好事一件接一件生。」', 'god');
  }

  /* ----- 土地公籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!tu.qian || tu.qian.date !== t) { tu.qian = { date: t, no: 1 + Math.floor(Math.random() * TUDI_QIAN.length) }; save(); sfx.rattle(1); }
    const f = TUDI_QIAN.find((x) => x.no === tu.qian.no);
    openSheet(`土地公籤第${NAMES[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>福德籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日小功課</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，日子還是要自己好好過。</p>`);
  }

  const ACTS = { water: autoWater, tree: openTree, mochi: offerMochi, qian: openQian };
  svg.addEventListener('click', (e) => {
    if (e.target.closest('[data-tudi="deity"]')) greetGod();
    else if (e.target.closest('[data-tudi="tree"]')) tapTree();
  });
  S('tTree').addEventListener('keydown', (e) => { if (e.key === 'Enter') tapTree(); });
  svg.querySelector('[data-tudi="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#tudiBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-tudi]'); if (b) ACTS[b.dataset.tudi](); });

  return {
    enter() {
      paintTree(); paintMochi(); can.place();
      const st = stageOf(tu.days);
      say(!tu.days && !tu.gold ? '歡迎來到福德祠！先點燭、上香向土地公問好。右邊有一盆福德樹的種子，每天用左下角的澆水壺澆一次水，七天就會結出金果。'
        : st === 3 ? '歡迎回來！你的福德樹結金果了，點一下樹就能摘。'
        : !watered() ? `歡迎回來。福德樹已經澆水 ${tu.days} 天，今天也來澆一下吧：拿起左下角的澆水壺，移到樹上面。`
        : '又見面了。可以獻一盤麻糬花生，或抽一支土地公籤。', 'god');
    },
    setFestive(on) { S('tBg').setAttribute('href', on ? festUrl : bgUrl); },
    god: '土地公', qianName: '土地公籤', qianCount: TUDI_QIAN.length,
    hasQianToday: () => !!tu.qian && tu.qian.date === dayKey(),
    setQian(no) { tu.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

// 財神聚寶閣：摸元寶、擲金幣進聚寶盆、借發財金、財神籤。
// 場景座標跟正殿一樣是 360 × 645；SVG 裡的 id 都加 c 前綴，避免跟正殿的 SVG 撞名。
import bgUrl from './assets/cai/cai-bg.webp';
import festUrl from './assets/cai/cai-festival.webp';
import bowlUrl from './assets/cai/bowl.webp';
import ingotUrl from './assets/cai/ingot.webp';
import coinUrl from './assets/cai/coin.webp';
import hongbaoUrl from './assets/cai/hongbao.webp';
import jiaoFlat from './assets/jiao-flat.webp';
import jiaoRound from './assets/jiao-round.webp';
import { tossJiao } from './jiaotoss.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 文字內容（原創） ---------- */
export const CAI_QIAN = [
  { no: 1, level: '上上', title: '聚沙', poem: ['點滴聚沙成寶山', '勤耕不怕歲時寒', '一分心血一分利', '他日回頭笑展顏'], gist: '小錢慢慢存，日積月累就很可觀。現在的每一分努力都算數。', tip: '今天記一筆帳，看看錢都去了哪裡。' },
  { no: 2, level: '上吉', title: '開門', poem: ['晨鐘響過市門開', '笑臉迎人福自來', '誠信二字值千金', '回頭客是聚寶台'], gist: '做生意、做工作，誠信和笑臉就是最好的招牌，老客人會幫你帶新客人。', tip: '主動跟一位老客戶或同事問聲好。' },
  { no: 3, level: '中吉', title: '順水', poem: ['順水行舟莫貪快', '帆收七分穩過灘', '利多之時須留步', '守得本金心自安'], gist: '運勢不錯，但別一次押太多。留點餘裕，賺得安心才是真的賺。', tip: '投資前先問自己：如果賠了，晚上睡得著嗎？' },
  { no: 4, level: '中平', title: '耕田', poem: ['春耕未見秋收穀', '莫怨今朝汗濕衣', '根深自有枝頭果', '時到花開不用催'], gist: '努力還沒看到回報很正常，基礎正在變穩，再撐一下。', tip: '把今天完成的一件事寫下來，給自己鼓勵。' },
  { no: 5, level: '上吉', title: '貴人', poem: ['一盞清茶話短長', '座中自有指路郎', '虛心多問三分利', '莫把面子當衣裳'], gist: '身邊有人能幫你。放下面子開口問，收穫會比想像中多。', tip: '請教一位比你資深的人一個問題。' },
  { no: 6, level: '中吉', title: '補網', poem: ['漁翁晴日補破網', '不待風來才著忙', '漏處先縫心不慌', '明朝出海滿船艙'], gist: '先把漏財的小地方補起來，比急著賺更多還實在。', tip: '檢查一下有沒有忘記取消的訂閱。' },
  { no: 7, level: '中平', title: '守成', poem: ['莫羨他家金滿堂', '自家燈火也明亮', '量入為出知足樂', '安穩便是好時光'], gist: '不用跟別人比，把自己的生活照顧好就是福氣。', tip: '今天少買一樣不需要的東西。' },
  { no: 8, level: '上上', title: '轉運', poem: ['冬盡寒梅吐嫩芽', '一陽來復到人家', '舊債漸清新路闊', '金光遍照福無涯'], gist: '低潮快過了。把舊的帳一筆一筆清掉，新的機會就在前面。', tip: '整理錢包，把舊發票和收據清乾淨。' },
];
const GREET = [
  '財神爺笑咪咪：「錢要賺，也要記得吃飯睡覺。」',
  '財神爺說：「正財靠努力，偏財靠緣分，兩個都不能急。」',
  '財神爺摸摸鬍子：「今天對人客氣一點，財氣自己會找上門。」',
  '財神爺說：「存錢像種樹，最好的時間是十年前，其次是今天。」',
  '財神爺眨眨眼：「先付錢給自己，再付錢給別人。」',
];
const BLESS = [
  ['財源滾滾', '今天多一分耐心，錢就多留下一分。'],
  ['招財進寶', '機會來的時候，記得先開口說「我可以」。'],
  ['生意興隆', '把每一位客人都當成老朋友。'],
  ['年年有餘', '每個月先存一點，再安排其他花費。'],
  ['金玉滿堂', '家人平安健康，就是最大的財富。'],
  ['步步高升', '把手上的事做到最好，上面的人看得見。'],
];
const MISS = ['差一點點！手指往聚寶盆的方向甩快一點。', '金幣滾走了，撿回來再試一次。', '偏了一點，瞄準盆口再甩一次。'];

/* ---------- 場景 ---------- */
export const CAI_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="財神聚寶閣" class="cai-svg">
  <defs>
    <filter id="cLit" color-interpolation-filters="sRGB">
      <feColorMatrix type="saturate" values=".85"/>
      <feColorMatrix type="matrix" values=".95 .05 0 0 .01  .02 .85 0 0 0  0 .02 .7 0 0  0 0 0 1 0"/>
    </filter>
    <radialGradient id="cContact"><stop offset="0" stop-color="#1A0A04" stop-opacity=".6"/><stop offset="1" stop-color="#1A0A04" stop-opacity="0"/></radialGradient>
    <radialGradient id="cHalo"><stop offset="0" stop-color="#FFF4C8" stop-opacity=".95"/><stop offset=".6" stop-color="#FFD36A" stop-opacity=".35"/><stop offset="1" stop-color="#FFD36A" stop-opacity="0"/></radialGradient>
  </defs>
  <image id="cBg" href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>
  <circle id="cHaloC" cx="180" cy="300" r="58" fill="url(#cHalo)" opacity=".3" style="mix-blend-mode:screen"/>
  <rect class="hit" data-cai="deity" role="button" tabindex="0" aria-label="向財神爺問安" x="148" y="255" width="66" height="95" rx="20" fill="transparent"/>

  <!-- 財氣 -->
  <g pointer-events="none">
    <rect x="10" y="10" width="104" height="30" rx="15" fill="#3A1208" opacity=".7"/>
    <text x="24" y="31" font-family="Huninn, sans-serif" font-size="15" fill="#FFE08A">財氣 <tspan id="cWealth">0</tspan></text>
  </g>

  <!-- 聚寶盆（左前方） -->
  <ellipse cx="58" cy="594" rx="44" ry="7" fill="url(#cContact)"/>
  <g id="cBowl" class="cai-bowl" data-cai="bowl"><image href="${bowlUrl}" x="8" y="500" width="100" height="96" filter="url(#cLit)"/></g>

  <!-- 大金元寶（右前方） -->
  <ellipse cx="304" cy="586" rx="44" ry="7" fill="url(#cContact)"/>
  <g id="cIngot" class="cai-ingot hit" data-cai="ingot" role="button" tabindex="0" aria-label="摸摸大金元寶">
    <image href="${ingotUrl}" x="256" y="512" width="96" height="76" filter="url(#cLit)"/>
  </g>

  <!-- 人偶 -->
  <ellipse cx="184" cy="533" rx="44" ry="7" fill="url(#cContact)"/>
  <image id="cAvatar" filter="url(#cLit)" x="117" y="396" width="130" height="142" preserveAspectRatio="xMidYMax meet"/>

  <!-- 金幣（下方，往聚寶盆甩） -->
  <circle id="cAim" cx="58" cy="528" r="30" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="5 5" opacity="0" pointer-events="none"/>
  <g id="cCoin" class="cai-coin" data-cai="coin" role="button" tabindex="0" aria-label="拿金幣丟進聚寶盆">
    <circle cx="0" cy="0" r="24" fill="transparent"/>
    <image href="${coinUrl}" x="-14" y="-15" width="28" height="30"/>
  </g>
</svg>`;

export function initCaishen(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc } = api;
  const host = $('#caiHost');
  host.innerHTML = CAI_SVG(bgUrl);
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const cai = state.cai || (state.cai = { wealth: 0, rubDay: '', streak: 0, coins: 0, coinDay: '', loan: null, qian: null, jiaoDay: '', jiaoTries: 0 });
  const paintWealth = () => { S('cWealth').textContent = cai.wealth; };
  paintWealth();

  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const addWealth = (n, x, y) => { cai.wealth += n; save(); paintWealth(); emit('text', x, y, { text: `財氣 +${n}`, color: '#FFE08A', life: 1.6, vy: -30 }); };

  /* ----- 摸元寶 ----- */
  const ingot = S('cIngot');
  let rub = null;
  function rubDone() {
    const t = dayKey();
    ingot.classList.remove('glow'); void ingot.getBoundingClientRect(); ingot.classList.add('glow');
    burst('spark', 304, 540, 24); sfx.chime(); sfx.buzz([10, 40, 10]);
    if (cai.rubDay === t) { say('今天已經摸過元寶了，財氣滿滿。明天再來摸，連續天數會繼續累積。', 'god'); return; }
    const y = new Date(); y.setDate(y.getDate() - 1);
    cai.streak = cai.rubDay === dayKey(y) ? cai.streak + 1 : 1;
    cai.rubDay = t;
    const bonus = Math.min(cai.streak - 1, 6) * 10;
    addWealth(88 + bonus, 304, 520);
    say(`摸到金元寶了！今日財氣 +88${bonus ? `，連續 ${cai.streak} 天再加 ${bonus}` : ''}。${cai.streak >= 7 ? '連續一整週，財神爺都記住你了。' : '明天再來，連續天數越多，財氣越高。'}`, 'god');
  }
  ingot.addEventListener('pointerdown', (e) => { e.preventDefault(); ingot.setPointerCapture(e.pointerId); const p = pt(e); rub = { x: p.x, y: p.y, d: 0, last: 0 }; });
  ingot.addEventListener('pointermove', (e) => {
    if (!rub) return;
    const p = pt(e); rub.d += Math.hypot(p.x - rub.x, p.y - rub.y); rub.x = p.x; rub.y = p.y;
    if (rub.d - rub.last > 30) { rub.last = rub.d; emit('spark', p.x, p.y); ingot.classList.toggle('rub'); }
    if (rub.d > 420) { rub = null; ingot.classList.remove('rub'); rubDone(); }
  });
  const rubEnd = () => {
    if (!rub) return;
    const short = rub.d < 12; rub = null; ingot.classList.remove('rub');
    if (short) hintRub();
  };
  ingot.addEventListener('pointerup', rubEnd); ingot.addEventListener('pointercancel', rubEnd);
  ingot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); rubDone(); } });
  function hintRub() {
    ingot.classList.remove('wiggle'); void ingot.getBoundingClientRect(); ingot.classList.add('wiggle');
    say('用手指按住右下角的大金元寶，來回摸一摸，把財氣摸到身上。');
  }

  /* ----- 擲金幣進聚寶盆 ----- */
  const coin = S('cCoin'), aim = S('cAim');
  const HOME = [200, 612], MOUTH = { x: 58, y: 530, r: 34 };
  let cpos = [...HOME], drag = null, flying = false;
  const placeCoin = (x, y, r = 0, s = 1) => { cpos = [x, y]; coin.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(0)}) scale(${s})`); };
  placeCoin(...HOME);
  coin.addEventListener('pointerdown', (e) => {
    if (flying) return;
    e.preventDefault(); coin.setPointerCapture(e.pointerId);
    const p = pt(e); drag = { ox: p.x - cpos[0], oy: p.y - cpos[1], samples: [[p.x, p.y, performance.now()]], moved: 0 };
    aim.setAttribute('opacity', '.9');
  });
  coin.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pt(e), now = performance.now();
    drag.samples.push([p.x, p.y, now]); while (drag.samples.length > 2 && now - drag.samples[0][2] > 90) drag.samples.shift();
    drag.moved += 1;
    placeCoin(p.x - drag.ox, p.y - drag.oy);
  });
  const coinUp = () => {
    if (!drag) return;
    const s = drag.samples, a = s[0], b = s[s.length - 1], dt = Math.max(16, b[2] - a[2]) / 1000;
    let vx = (b[0] - a[0]) / dt, vy = (b[1] - a[1]) / dt;
    drag = null; aim.setAttribute('opacity', '0');
    const sp = Math.hypot(vx, vy);
    if (sp < 250 || vy > -100) { // 沒有往上甩
      flyHome();
      say('按住金幣，往左上方的聚寶盆<b>甩</b>出去，手指放開金幣就會飛。');
      return;
    }
    // 輔助瞄準：手機甩動速度差很多，只看方向。方向大致朝聚寶盆就幫忙修成漂亮拋物線
    const T = Math.min(.9, Math.max(.55, sp / 2600)), g = 1300;
    const ix = (MOUTH.x - cpos[0]) / T, iy = (MOUTH.y - cpos[1] - .5 * g * T * T) / T;
    let da = Math.abs(Math.atan2(vy, vx) - Math.atan2(iy, ix)); if (da > Math.PI) da = 2 * Math.PI - da;
    if (da < .5) launch(ix * (0.97 + Math.random() * .06), iy);
    else { const k = Math.min(.55, 800 / sp); launch(vx * k, vy * k); }
  };
  coin.addEventListener('pointerup', coinUp); coin.addEventListener('pointercancel', coinUp);
  coin.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!flying) autoToss(); } });
  function autoToss() { // 鍵盤／按鈕：自動丟一個漂亮的拋物線
    placeCoin(...HOME); const T = .7, g = 1300;
    launch((MOUTH.x - HOME[0]) / T, (MOUTH.y - HOME[1] - .5 * g * T * T) / T);
  }
  function flyHome() {
    const [x0, y0] = cpos, t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / 250); placeCoin(x0 + (HOME[0] - x0) * k, y0 + (HOME[1] - y0) * k); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function launch(vx, vy) {
    flying = true; sfx.pop();
    let [x, y] = cpos, last = performance.now(), rot = 0;
    const g = 1300;
    const step = (now) => {
      const dt = Math.min(.033, (now - last) / 1000); last = now;
      const py = y; vy += g * dt; x += vx * dt; y += vy * dt; rot += vx * dt * 2;
      // 往下掉、穿過盆口
      if (vy > 0 && py < MOUTH.y && y >= MOUTH.y && Math.abs(x - MOUTH.x) < MOUTH.r) { placeCoin(x, MOUTH.y, rot, .8); return hit(); }
      placeCoin(x, y, rot);
      if (y > 660 || x < -30 || x > 390) return miss();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function hit() {
    const bowl = S('cBowl');
    coin.style.opacity = '0';
    bowl.classList.remove('bounce'); void bowl.getBoundingClientRect(); bowl.classList.add('bounce');
    sfx.chime(); sfx.buzz(12);
    burst('spark', MOUTH.x, MOUTH.y - 6, reduce ? 4 : 22);
    const t = dayKey();
    if (cai.coinDay !== t) { cai.coinDay = t; cai.coins = 0; }
    cai.coins++;
    const n = cai.coins <= 8 ? 8 : 1; // 每天前 8 枚各 +8
    addWealth(n, MOUTH.x + 20, MOUTH.y - 20);
    say(cai.coins === 1 ? '叮噹！金幣進了聚寶盆，聚寶盆閃了一下金光。再丟一枚試試？' : cai.coins === 8 ? '今天已經丟進 8 枚，八方來財！之後再丟也可以，只是財氣加得比較少。' : `叮噹！今天第 ${cai.coins} 枚進盆。`, 'god');
    setTimeout(() => { placeCoin(...HOME); coin.style.opacity = ''; flying = false; }, 650);
  }
  function miss() {
    sfx.knock();
    say(MISS[Math.floor(Math.random() * MISS.length)]);
    setTimeout(() => { placeCoin(...HOME); flying = false; }, 500);
  }

  /* ----- 財神爺問安 ----- */
  function greetGod() {
    S('cHaloC').setAttribute('opacity', '.75'); setTimeout(() => S('cHaloC').setAttribute('opacity', '.3'), 1400);
    burst('spark', 180, 290, 12);
    say(GREET[Math.floor(Math.random() * GREET.length)], 'god');
  }

  /* ----- 借發財金 ----- */
  const jiaoPair = (a, b) => `<div class="cai-jiao">${[a, b].map((f) => `<img src="${f === 'flat' ? jiaoFlat : jiaoRound}" alt="${f === 'flat' ? '平面' : '凸面'}" class="${f}">`).join('')}</div>`;
  function openLoan() {
    const t = dayKey();
    if (cai.loan) {
      const same = cai.loan.date === t;
      const body = openSheet('發財金・還願', `
        <div class="cai-hb"><img src="${hongbaoUrl}" alt="發財金紅包"><b>${esc(cai.loan.word)}</b></div>
        <p>你在 ${esc(cai.loan.date.replace(/-/g, '/'))} 向財神爺借了一份發財金。</p>
        <p class="hint">${same ? '今天才剛借，帶在身上就好。下次來參拜再還願，才能再借。' : '傳統上借了發財金，有賺到就回來還願、添一點香油，讓好運繼續流動。'}</p>
        <div class="row">${same ? '<button class="btn ghost" id="cOk">收好了</button>' : '<button class="btn gold" id="cRepay">還願，謝謝財神爺</button>'}</div>`);
      body.querySelector('#cOk')?.addEventListener('click', closeSheet);
      body.querySelector('#cRepay')?.addEventListener('click', () => {
        cai.loan = null; save(); closeSheet();
        addWealth(66, 180, 330); sfx.chime(); burst('spark', 180, 330, 18);
        say('還願完成，財神爺很開心：「有借有還，再借不難。」現在可以再借一次發財金了。', 'god');
      });
      return;
    }
    if (cai.jiaoDay !== t) { cai.jiaoDay = t; cai.jiaoTries = 0; }
    const body = openSheet('借發財金', `
      <div class="cai-hb"><img src="${hongbaoUrl}" alt="發財金紅包"></div>
      <p>先在心裡跟財神爺說：你是誰、做什麼工作、想借發財金做什麼。擲到<b>聖筊</b>，財神爺才會借你。</p>
      <div id="cJiaoOut"></div>
      <div class="row"><button class="btn" id="cThrow">擲筊請示</button></div>
      <p class="hint" id="cTries"></p>`);
    const out = body.querySelector('#cJiaoOut'), btn = body.querySelector('#cThrow'), tries = body.querySelector('#cTries');
    const paintTries = () => { tries.textContent = cai.jiaoTries >= 3 ? '今天已經擲了三次，明天再來請示吧。' : `今天還可以擲 ${3 - cai.jiaoTries} 次。`; btn.disabled = cai.jiaoTries >= 3; };
    paintTries();
    btn.addEventListener('click', async () => {
      if (cai.jiaoTries >= 3 || btn.disabled || cai.loan) return;
      const r = Math.random(), key = r < .5 ? 'sheng' : r < .75 ? 'xiao' : 'yin';
      const faces = key === 'sheng' ? ['flat', 'round'] : key === 'xiao' ? ['flat', 'flat'] : ['round', 'round'];
      if (Math.random() < .5) faces.reverse();
      btn.disabled = true;
      const ok = await tossJiao({ tip: '跟財神爺說：你是誰、想借發財金做什麼', faces, key });
      btn.disabled = false;
      if (!ok) return;
      cai.jiaoTries++; save();
      out.innerHTML = jiaoPair(...faces);
      if (key === 'sheng') {
        const [word, line] = BLESS[Math.floor(Math.random() * BLESS.length)];
        cai.loan = { date: t, word }; save(); sfx.chime();
        out.insertAdjacentHTML('beforeend', `<p><b>聖筊！</b>財神爺借你一份發財金：<b>${word}</b>。${line}</p>`);
        btn.textContent = '收進錢包'; btn.className = 'btn gold'; btn.disabled = false;
        btn.onclick = () => { closeSheet(); burst('spark', 180, 470, 20); say(`發財金收好了：「${word}」。下次來記得還願喔。`, 'god'); };
        tries.textContent = '';
        return;
      }
      out.insertAdjacentHTML('beforeend', `<p>${key === 'xiao' ? '<b>笑筊</b>，財神爺笑而不答。把想借的理由說得更清楚一點，再擲一次。' : '<b>陰筊</b>，財神爺覺得時機還沒到。先緩一緩也沒關係。'}</p>`);
      paintTries();
    });
  }

  /* ----- 財神籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!cai.qian || cai.qian.date !== t) { cai.qian = { date: t, no: 1 + Math.floor(Math.random() * CAI_QIAN.length) }; save(); sfx.rattle(1); }
    const f = CAI_QIAN.find((x) => x.no === cai.qian.no);
    openSheet(`財神籤第${'一二三四五六七八'[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>財神籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日開運小事</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，理財投資請量力而為。</p>`);
  }

  const ACTS = { ingot: hintRub, coin: () => { if (!flying) { aim.setAttribute('opacity', '.9'); setTimeout(() => aim.setAttribute('opacity', '0'), 900); say('按住下方的金幣，往左上方的聚寶盆甩出去！'); } }, loan: openLoan, qian: openQian, deity: greetGod };
  svg.addEventListener('click', (e) => { const h = e.target.closest('[data-cai="deity"]'); if (h) greetGod(); });
  svg.querySelector('[data-cai="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#caiBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-cai]'); if (b) ACTS[b.dataset.cai](); });

  return {
    enter(char) {
      const el = S('cAvatar'), h = 130 * char.scale, w = 120 * char.scale;
      el.setAttribute('href', char.kneel); el.setAttribute('width', w); el.setAttribute('height', h);
      el.setAttribute('x', 182 - w / 2); el.setAttribute('y', 536 - h);
      paintWealth();
      say(cai.rubDay === dayKey() ? '歡迎回到財神聚寶閣。今天元寶摸過了，可以丟金幣進聚寶盆、借發財金或抽財神籤。' : '歡迎來到財神聚寶閣！先摸摸右下角的大金元寶，今日財氣 +88。也可以把金幣甩進聚寶盆。', 'god');
    },
    setFestive(on) { S('cBg').setAttribute('href', on ? festUrl : bgUrl); },
  };
}

// 母娘殿「瑤池宮」：說心事（寫下心裡的話，摺成紙鶴，拿起來送到母娘面前，紙鶴飛進瑤池）；獻蟠桃；母娘籤。
// 構圖跟月老閣一樣（不放大）。場景座標 360 × 645；SVG 裡的 id 都加 mu 前綴。
// 道具有 Gemini 圖就用圖（src/assets/mu/crane.webp、peach.webp），沒有先用程式畫的。
import bgUrl from './assets/mu/mu-bg.webp';
import festUrl from './assets/mu/mu-festival.webp';
import { makeCarrier } from './carry.js';

const ART = import.meta.glob('./assets/mu/{crane,peach}.webp', { eager: true, import: 'default' });
const art = (k) => ART[`./assets/mu/${k}.webp`];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 文字內容（原創） ---------- */
export const MU_QIAN = [
  { no: 1, level: '上上', title: '歸來', poem: ['走了好遠的路', '鞋子都磨破', '母娘門沒關', '回來就是家'],
    gist: '再累都可以回來。你不用很厲害，才值得被照顧。', tip: '今天打給一個讓你安心的人，聊五分鐘就好。' },
  { no: 2, level: '中吉', title: '放下', poem: ['肩上扛太多', '一路不敢停', '放下一點點', '天也不會塌'],
    gist: '有些責任不是你一個人的。試著分出去一件。', tip: '寫下今天最重的一件事，問自己：真的只能我做嗎？' },
  { no: 3, level: '上吉', title: '蟠桃', poem: ['瑤池桃花開', '三千年一回', '好事慢慢熟', '甜在等待後'],
    gist: '你努力的事正在慢慢成熟，別急著摘。', tip: '今天吃一樣水果，慢慢吃，好好品嚐。' },
  { no: 4, level: '中平', title: '雲開', poem: ['烏雲蓋半天', '雨下了三天', '母娘輕輕吹', '雲後是藍天'],
    gist: '低潮會過去的。現在先照顧好身體，等天晴。', tip: '今天出門曬十分鐘太陽，或打開窗戶透透氣。' },
  { no: 5, level: '上吉', title: '仙鶴', poem: ['白鶴飛過池', '一聲叫得長', '心事交給它', '送到母娘旁'],
    gist: '說出來就輕了。不用一個人把話吞下去。', tip: '把心裡的話寫下來，寫完就好，不用給誰看。' },
  { no: 6, level: '中吉', title: '慈心', poem: ['對人那麼好', '對己那麼兇', '母娘心疼你', '也對自己好'],
    gist: '你對別人很溫柔，也要對自己溫柔一點。', tip: '今天對自己說一句：「辛苦了，你做得很好。」' },
  { no: 7, level: '中平', title: '靜水', poem: ['池水不起波', '倒影看得清', '心靜下來時', '答案自己明'],
    gist: '現在不急著做決定。先靜下來，答案會浮上來。', tip: '睡前關掉手機，安靜坐三分鐘，只聽自己呼吸。' },
  { no: 8, level: '上上', title: '團圓', poem: ['天上一盞燈', '地上一個家', '母娘牽著手', '大家都平安'],
    gist: '家人平安就是最大的福。今天好好跟家人相處。', tip: '今天跟家人吃頓飯，或傳一張照片給家人。' },
];
const GREET = [
  '母娘溫柔地看著你：「孩子，累了吧？先坐下來歇一歇。」',
  '母娘說：「心裡有事，就說給母娘聽。」',
  '母娘微笑：「不管走多遠，這裡都等你回來。」',
  '母娘輕聲說：「別太勉強自己，慢慢來就好。」',
];
const REPLY = [
  '紙鶴飛進瑤池，化成一圈一圈的光。母娘說：「我聽到了。剩下的，交給母娘。」',
  '紙鶴繞著母娘飛了一圈，落進池裡。母娘說：「說出來就好，你已經很勇敢了。」',
  '紙鶴輕輕落在蓮花上。母娘說：「這件事不用一個人扛，今晚好好睡。」',
  '紙鶴化成星星飄走了。母娘說：「孩子，你不是一個人。」',
];
const TOPICS = ['工作好累', '家裡的事', '感情', '身體', '說不出來'];
const NAMES = ['一', '二', '三', '四', '五', '六', '七', '八'];

/* ---------- 場景 ---------- */
// 參考點（跟月老閣同構圖）：母娘臉 (180,245)、供桌桌面 y≈385、拜墊 (184,575)、右邊圓窗外是瑤池 (330,300)
const FACE = [180, 250];
const CRANE_REST = [296, 610];
const POOL = [334, 300];
const PEACH = [118, 388, 48, 40]; // 蟠桃盤：底部中心、寬、高（供桌左邊）

const craneSvg = () => art('crane')
  ? `<image href="${art('crane')}" x="-30" y="-46" width="60" height="46"/>`
  : `<g transform="translate(0 -22)">
      <path d="M-26 4 L0 -6 L26 4 L4 8 Z" fill="#FFFFFF" stroke="#C9C2D8" stroke-width="1"/>
      <path d="M0 -6 L-6 -26 L4 -4 Z" fill="#F4F0FA" stroke="#C9C2D8" stroke-width="1"/>
      <path d="M0 -6 L16 -22 L10 -2 Z" fill="#EDE7F6" stroke="#C9C2D8" stroke-width="1"/>
      <path d="M26 4 L32 -6 L28 6 Z" fill="#FFFFFF" stroke="#C9C2D8" stroke-width="1"/>
      <path d="M-26 4 L-34 -2 L-28 6 Z" fill="#FFFFFF" stroke="#C9C2D8" stroke-width="1"/>
      <circle cx="31" cy="-5" r="1.6" fill="#D8343A"/>
    </g>`;
const peachSvg = (w, h) => art('peach')
  ? `<image href="${art('peach')}" x="${-w / 2}" y="${-h}" width="${w}" height="${h}"/>`
  : `<ellipse cx="0" cy="-3" rx="${w / 2}" ry="5" fill="#E9E2D0" stroke="#C8B48A"/>
     ${[[-11, -12], [11, -12], [0, -24]].map(([x, y]) => `<g transform="translate(${x} ${y})">
       <path d="M0 9 C-11 9 -12 -4 -6 -9 C-3 -11 0 -9 0 -9 C0 -9 3 -11 6 -9 C12 -4 11 9 0 9 Z" fill="url(#muPeachG)"/>
       <path d="M0 -9 C-1 -3 -1 3 0 8" stroke="#E8A0A0" stroke-width="1" fill="none"/>
       <path d="M0 -9 C4 -14 9 -14 11 -12 C8 -9 4 -8 0 -9 Z" fill="#6DAE5A"/></g>`).join('')}`;

export const MU_SVG = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="瑤池宮" class="mu-svg">
  <defs>
    <radialGradient id="muHalo"><stop offset="0" stop-color="#FFFBEA" stop-opacity=".95"/><stop offset=".6" stop-color="#C9B8FF" stop-opacity=".35"/><stop offset="1" stop-color="#C9B8FF" stop-opacity="0"/></radialGradient>
    <radialGradient id="muPeachG" cx=".45" cy=".35"><stop offset="0" stop-color="#FFF4EC"/><stop offset=".55" stop-color="#FFB6B0"/><stop offset="1" stop-color="#F0707A"/></radialGradient>
    <radialGradient id="muContact"><stop offset="0" stop-color="#2A1A3A" stop-opacity=".4"/><stop offset="1" stop-color="#2A1A3A" stop-opacity="0"/></radialGradient>
  </defs>
  <circle id="muHaloC" cx="${FACE[0]}" cy="${FACE[1]}" r="64" fill="url(#muHalo)" opacity=".18" style="mix-blend-mode:screen"/>
  <rect class="hit" data-mu="deity" role="button" tabindex="0" aria-label="向母娘問安" x="132" y="200" width="112" height="150" rx="24" fill="transparent"/>
  <g id="muPeach" class="mu-offer" transform="translate(${PEACH[0]} ${PEACH[1]})" style="display:none">${peachSvg(PEACH[2], PEACH[3])}</g>
  <ellipse id="muRing" cx="${FACE[0]}" cy="${FACE[1] + 40}" rx="40" ry="14" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <!-- 紙鶴（寫好心事才出現） -->
  <g id="muCrane" class="mu-prop" data-mu="crane" role="button" tabindex="0" aria-label="紙鶴，拿起來送到母娘面前" style="display:none" transform="translate(${CRANE_REST[0]} ${CRANE_REST[1]})">
    <ellipse cx="0" cy="2" rx="22" ry="4" fill="url(#muContact)"/>
    <rect x="-36" y="-52" width="72" height="56" fill="transparent"/>
    ${craneSvg()}
  </g>
  <g id="muFly" style="display:none" pointer-events="none">${craneSvg()}</g>
</svg>`;

export function initMuniang(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam } = api;
  const host = $('#muHost');
  host.innerHTML = MU_SVG();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const mu = state.mu || (state.mu = { talks: 0, talkDay: '', peachDay: '', qian: null });

  const glow = (o = .75, ms = 1600) => { S('muHaloC').setAttribute('opacity', String(o)); setTimeout(() => S('muHaloC').setAttribute('opacity', '.18'), ms); };
  function greetGod() { glow(.7, 1400); burst('spark', FACE[0], FACE[1], reduce ? 3 : 10); say(GREET[Math.floor(Math.random() * GREET.length)], 'god'); }

  /* ----- 說心事 → 紙鶴 ----- */
  let draft = null;
  const craneEl = S('muCrane');
  const carrier = makeCarrier({
    svg, el: craneEl, sfx, cam, ring: S('muRing'), lift: 80, radius: 44,
    rest: () => CRANE_REST, target: () => [FACE[0], FACE[1] + 40], zoom: () => [FACE[0], FACE[1] + 70, 240],
    onTap: () => say('按住右下角的<b>紙鶴</b>拿起來，送到<b>母娘</b>面前。', 'god'),
    onDrop() { craneEl.style.display = 'none'; flyAway(); },
  });
  function flyAway() {
    const fly = S('muFly'); fly.style.display = '';
    sfx.chime(); glow(.85, 2200);
    const from = [FACE[0], FACE[1] + 40], t0 = performance.now(), ms = reduce ? 300 : 1800;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      // 先繞母娘一小圈，再往右飛進圓窗外的瑤池
      const a = k * Math.PI * 2;
      const cx = from[0] + (POOL[0] - from[0]) * k * k, cy = from[1] + (POOL[1] - from[1]) * k * k;
      const x = cx + Math.cos(a) * 30 * (1 - k), y = cy - Math.sin(a) * 18 * (1 - k);
      fly.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(1 - k * .6).toFixed(3)})`);
      fly.setAttribute('opacity', (1 - Math.max(0, k - .8) * 5).toFixed(2));
      if (Math.random() < .3) emit('spark', x, y - 10);
      if (k < 1) requestAnimationFrame(step);
      else {
        fly.style.display = 'none';
        burst('spark', POOL[0], POOL[1], reduce ? 4 : 18); emit('heart', FACE[0], FACE[1] + 20);
        const t = dayKey();
        if (mu.talkDay !== t) { mu.talks = (mu.talks || 0) + 1; mu.talkDay = t; }
        save();
        say(`${REPLY[Math.floor(Math.random() * REPLY.length)]}<br><small>這是你第 ${mu.talks} 天跟母娘說心事。</small>`, 'god');
        draft = null; cam?.reset(1600);
      }
    };
    requestAnimationFrame(step);
  }
  function openTalk() {
    const body = openSheet('跟母娘說心事', `
      <p>心裡卡著的話，說給母娘聽。寫完會摺成一隻紙鶴，你親手把它送到母娘面前。</p>
      <div class="field"><span>是什麼事</span><div class="chips">${TOPICS.map((w, i) => `<button type="button" class="chip" data-t="${w}" aria-pressed="${!i}">${w}</button>`).join('')}</div></div>
      <textarea id="muText" class="yue-wish" rows="3" maxlength="60" placeholder="想說什麼都可以（可以不填，只存在你的手機裡）"></textarea>
      <div class="row"><button class="btn" id="muGo">摺成紙鶴</button></div>
      <p class="hint">如果心裡真的很難受，記得找信任的人或專業的人聊聊。台灣安心專線 1925，24 小時都有人接。</p>`);
    let topic = TOPICS[0];
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { topic = b.dataset.t; body.querySelectorAll('[data-t]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); } });
    body.querySelector('#muGo').addEventListener('click', () => {
      draft = { topic, text: body.querySelector('#muText').value.trim() }; closeSheet();
      craneEl.style.display = ''; carrier.home();
      craneEl.classList.remove('pop'); void craneEl.getBoundingClientRect(); craneEl.classList.add('pop');
      sfx.pop();
      say(`「${esc(topic)}」摺成了一隻紙鶴，在右下角。按住它拿起來，送到<b>母娘</b>面前。`, 'god');
    });
  }

  /* ----- 獻蟠桃 ----- */
  const paintPeach = () => { S('muPeach').style.display = mu.peachDay === dayKey() ? '' : 'none'; };
  paintPeach();
  function offerPeach() {
    if (mu.peachDay === dayKey()) { say('今天的蟠桃已經擺上供桌了，母娘很開心。'); return; }
    mu.peachDay = dayKey(); save(); paintPeach();
    cam?.zoom(PEACH[0] + 30, PEACH[1] - 20, 200);
    const el = S('muPeach'); el.classList.remove('pop'); void el.getBoundingClientRect(); el.classList.add('pop');
    sfx.pop(); setTimeout(() => sfx.chime(), 300);
    burst('spark', PEACH[0], PEACH[1] - 20, reduce ? 3 : 10);
    say('一盤粉嫩的<b>蟠桃</b>擺上供桌了。傳說瑤池的蟠桃三千年才熟一次，獻給母娘，祝家人<b>平安長壽</b>。', 'god');
    cam?.reset(2000);
  }

  /* ----- 母娘籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!mu.qian || mu.qian.date !== t) { mu.qian = { date: t, no: 1 + Math.floor(Math.random() * MU_QIAN.length) }; save(); sfx.rattle(1); }
    const f = MU_QIAN.find((x) => x.no === mu.qian.no);
    openSheet(`母娘籤第${NAMES[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>母娘籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日溫柔小功課</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，重要的事還是要跟信任的人商量。</p>`);
  }

  const ACTS = { talk: () => (draft ? carrier.auto() : openTalk()), peach: offerPeach };
  svg.addEventListener('click', (e) => { if (e.target.closest('[data-mu="deity"]')) greetGod(); });
  svg.querySelector('[data-mu="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#muBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-mu]'); if (b) ACTS[b.dataset.mu](); });

  return {
    enter() {
      paintPeach();
      say(mu.talks ? `歡迎回到瑤池宮。你已經跟母娘說了 ${mu.talks} 天心事。先點燭、上香，心裡有話就按「說心事」。`
        : '歡迎來到瑤池宮，這裡拜的是瑤池金母，大家叫她「母娘」。先點燭、上香。心累的時候按「說心事」，寫下來摺成紙鶴送給母娘。', 'god');
    },
    leave() { if (draft) { draft = null; craneEl.style.display = 'none'; } },
    god: '母娘', qianName: '母娘籤', qianCount: MU_QIAN.length,
    hasQianToday: () => !!mu.qian && mu.qian.date === dayKey(),
    setQian(no) { mu.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

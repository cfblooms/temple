// 廟公解籤處：照廟裡的做法——先想好要問什麼事（問事），到神明前稟報、搖籤、擲出聖筊確認，
// 再把籤詩拿到解籤處，請廟公依你問的事情講白話。
// 玩家要做的：按住籤詩拿起來（浮在手指上方），交到廟公手上 → 廟公推一下老花眼鏡、翻籤簿 → 解籤。
// 場景 360 × 645；SVG 裡的 id 都加 jq 前綴。正式圖還沒來之前，背景借收驚攤的木櫃台加上招牌、籤詩櫃，廟公先用向量畫。
import { makeCarrier } from './carry.js';
import { reduce, sleep, tween, pick } from './stall.js';
import { FORTUNES, cn } from './fortunes.js';
import { CAI_QIAN } from './caishen.js';
import { LOVE_QIAN } from './yuelao.js';
import { TUDI_QIAN } from './tudigong.js';
import { WEN_QIAN } from './wenchang.js';
import { JI_QIAN } from './jigong.js';
import { SAN_QIAN } from './santaizi.js';
import { GY_QIAN } from './guanyin.js';
import { GG_QIAN } from './guangong.js';
import { ZS_QIAN } from './zhusheng.js';
import { TS_QIAN } from './taisui.js';
import { MU_QIAN } from './muniang.js';
import { ML_QIAN } from './mile.js';
import fallbackBg from './assets/sj/bg.webp';

// 正式圖（生圖清單/11-廟公解籤處.md）放進 src/assets/jq/ 就會自動換上
const ART = import.meta.glob('./assets/jq/*.webp', { eager: true, import: 'default' });
const BG = ART['./assets/jq/bg.webp'];
const GONG = ART['./assets/jq/miaogong.webp'];

// 每座殿的籤：清單、存在 state 的哪裡、籤名
const SRC = {
  main: { list: FORTUNES, key: null, name: '心安籤' },
  cai: { list: CAI_QIAN, key: 'cai', name: '財神籤' }, yue: { list: LOVE_QIAN, key: 'yue', name: '清醒戀愛籤' },
  tudi: { list: TUDI_QIAN, key: 'tudi', name: '土地公籤' }, wen: { list: WEN_QIAN, key: 'wen', name: '文昌籤' },
  ji: { list: JI_QIAN, key: 'ji', name: '濟公籤' }, san: { list: SAN_QIAN, key: 'san', name: '三太子籤' },
  gy: { list: GY_QIAN, key: 'gy', name: '觀音籤' }, gg: { list: GG_QIAN, key: 'gg', name: '關帝籤' },
  zs: { list: ZS_QIAN, key: 'zs', name: '註生娘娘籤' }, ts: { list: TS_QIAN, key: 'ts', name: '太歲籤' },
  mu: { list: MU_QIAN, key: 'mu', name: '母娘籤' }, ml: { list: ML_QIAN, key: 'ml', name: '彌勒籤' },
};

// 問事的主題：cat 對到心安籤上原本就寫好的方向；hall 是廟公推薦去問的神明
export const TOPICS = [
  { id: 'work', name: '工作', cat: 'career', hall: 'gg' },
  { id: 'love', name: '感情', cat: 'love', hall: 'yue' },
  { id: 'health', name: '健康', cat: 'peace', hall: 'gy' },
  { id: 'exam', name: '考試', cat: 'study', hall: 'wen' },
  { id: 'money', name: '財運', cat: 'career', hall: 'cai' },
  { id: 'family', name: '家庭', cat: 'peace', hall: 'main' },
  { id: 'people', name: '人際', cat: 'love', hall: 'ml' },
  { id: 'move', name: '出行搬家', cat: 'peace', hall: 'tudi' },
];
const CAT_TOPIC = { career: 'work', love: 'love', peace: 'health', study: 'exam' };
const WHY = { gg: '關聖帝君講信用、管事業', yue: '月老專管姻緣', gy: '觀音菩薩最疼受苦的人', wen: '文昌帝君管考運', cai: '財神爺管錢財', main: '媽祖婆什麼都照顧，家裡的事最常來問祂', ml: '彌勒佛笑口常開，人緣最好', tudi: '土地公管地方、管房子' };

const tierOf = (lv) => (lv === '上上' || lv === '上吉' ? 'good' : lv === '中吉' ? 'mid' : 'flat');
const OPEN = {
  上上: ['哎唷，<b>上上籤</b>！阿伯在這裡解籤三十年，看到上上籤還是替人家歡喜。', '<b>上上籤</b>喔，神明這次是笑咪咪地回你。'],
  上吉: ['<b>上吉</b>，是好籤，神明有在挺你。', '來，<b>上吉籤</b>。好籤不用怕，阿伯慢慢講給你聽。'],
  中吉: ['<b>中吉</b>，好的那邊比較多，重點在你「怎麼做」。', '<b>中吉籤</b>。不是不好，是神明提醒你走穩一點。'],
  中平: ['<b>中平</b>，不要看到「平」就失望。平就是穩，穩才走得遠。', '<b>中平籤</b>是在跟你說：先別急，時候還在醞釀。'],
};
const ADVICE = {
  work: {
    good: ['工作這邊正在往上走，有機會就舉手，不要客氣。', '你做的事有人看在眼裡，這陣子提案、面試、談加薪都適合。'],
    mid: ['工作可以前進，但先把手上的事收尾漂亮，再接新的。', '想換跑道可以先打聽、先準備，不要一衝動就遞辭呈。'],
    flat: ['這一季先守住，把基本功練穩，機會來的時候才接得住。', '現在不是大動作的時機，默默累積，下一波會輪到你。'],
  },
  love: {
    good: ['感情的緣分有在動，喜歡就好好說出口。', '有對象的感情會更穩，單身的人這陣子容易遇到聊得來的人。'],
    mid: ['感情需要多一點耐心，看對方怎麼做，比聽他怎麼說準。', '先把話講清楚，誤會解開了，感情才會順。'],
    flat: ['緣分還在路上，先把自己照顧好，對的人會看見你。', '不要為了怕寂寞勉強自己，不合適的放下，心才有位置。'],
  },
  health: {
    good: ['身體正在回穩，維持現在的作息，繼續保持。', '精神會越來越好，有空出去走走、曬曬太陽。'],
    mid: ['小毛病別硬撐，該休息就休息，該看醫生就去看。', '最近累積太多疲勞，早點睡比什麼補品都有用。'],
    flat: ['這段時間要慢下來，吃飯睡覺照時間，身體會謝謝你。', '心裡的壓力也會變成身體的病，找人聊聊，不要悶著。'],
  },
  exam: {
    good: ['考運不錯，平常讀的會考出來，相信自己。', '準備的方向是對的，考前把錯題再看一遍就好。'],
    mid: ['還有進步空間，先補最弱的那一科，分數會上來。', '不要一直刷新題，回頭把觀念弄懂比較實在。'],
    flat: ['這次先把基礎打穩，別跟別人比進度，比昨天的自己就好。', '一次考試不代表全部，按部就班，下一次會更好。'],
  },
  money: {
    good: ['財運有起色，正財穩、偏財也有一點，但見好就收。', '有進帳的機會，記得先存一份起來，福氣才留得住。'],
    mid: ['錢可以賺，但別一次押太多，留點餘裕睡得比較好。', '先把漏財的小地方補起來，比急著賺更多實在。'],
    flat: ['這陣子守財比求財重要，大筆花費先緩一緩。', '不要聽人家說穩賺就跟，錢慢慢存，才是自己的。'],
  },
  family: {
    good: ['家裡和樂，有什麼想一起做的事，這陣子很適合。', '家人之間的心是連在一起的，多回家吃頓飯。'],
    mid: ['家裡有些小摩擦，先退一步，好好說，不要冷戰。', '長輩的話聽一半、體諒一半，家就會順。'],
    flat: ['家裡的事急不來，給彼此一點時間跟空間。', '先照顧好自己的情緒，回家才有力氣照顧別人。'],
  },
  people: {
    good: ['人緣很好，這陣子容易遇到貴人，多出去走走。', '朋友會幫你，有需要就開口，不要不好意思。'],
    mid: ['跟人相處多一點體諒，少一句計較，關係就會鬆開。', '有人誤會你也不用急著解釋，日久見人心。'],
    flat: ['合不來的人不用勉強，保持禮貌、保持距離就好。', '少說別人的是非，自己身邊的人反而會靠過來。'],
  },
  move: {
    good: ['出門、搬家都順，挑個好天氣就可以動身。', '新的地方會帶來新的機會，放心去。'],
    mid: ['可以動，但行程、合約多看兩遍，細節不要省。', '搬家看房子先看採光跟通風，住得舒服比什麼都重要。'],
    flat: ['還沒準備好就先別急著動，多比較幾個選擇。', '出遠門要多留時間，慢慢來，平安最重要。'],
  },
};
const VERDICT = {
  good: '照這支籤看，方向是對的，可以放心往前走。',
  mid: '可以做，但要多想一步、慢一點，把準備做足。',
  flat: '時機還在醞釀，不急著今天決定，先把該準備的準備好。',
};
const DO = {
  work: ['今天把待辦清單最上面那件做完。', '主動跟同事或主管說一聲謝謝。'],
  love: ['傳個訊息問候在乎的人。', '今天做一件讓自己開心的小事。'],
  health: ['今晚提早半小時睡。', '喝一杯溫開水，起來伸展三分鐘。'],
  exam: ['把最常錯的三題再寫一遍。', '讀書時手機翻面放遠一點。'],
  money: ['今天記一筆帳。', '檢查有沒有忘記取消的訂閱。'],
  family: ['打個電話回家。', '幫家人做一件小事，不用說出來。'],
  people: ['跟一位好久沒聯絡的朋友打聲招呼。', '今天少說一句抱怨，多說一句謝謝。'],
  move: ['出門前把重要的東西再檢查一次。', '把房間清出一角，讓新的東西有地方放。'],
};
const CLOSE = {
  health: '籤詩是讓心安定的，身體不舒服一定要給醫生看喔。',
  money: '投資理財要量力而為，賠了睡不著的錢就不要碰。',
  _: '籤詩給你方向，路還是你自己走。阿伯在這裡，有事再來問。',
};
// 同一天同一支籤同一件事，再看一次講的話一樣
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, seed) => arr[seed % arr.length];

export function readingOf(entry, halls) {
  const src = SRC[entry.hall], f = src?.list.find((x) => x.no === entry.no);
  if (!f) return null;
  const t = TOPICS.find((x) => x.id === entry.topic) || TOPICS[0], tier = tierOf(f.level);
  const seed = hash(`${entry.date}|${entry.hall}|${entry.no}|${t.id}`);
  const god = halls[entry.hall]?.god || '神明';
  const own = entry.hall === 'main' && f[t.cat];
  return {
    f, t, god, src,
    open: pickBy(OPEN[f.level] || OPEN['中平'], seed),
    hallNote: t.hall === entry.hall ? `你找${god}問${t.name}，找對神明了，${WHY[t.hall]}。` : `你在${god}那裡問${t.name}，神明都是疼人的，阿伯幫你轉個彎講。`,
    gist: f.gist,
    own, // 心安籤上原本就寫好的這一方向
    advice: pickBy(ADVICE[t.id][tier], seed >> 3),
    verdict: entry.q ? VERDICT[tier] : '',
    act: pickBy(DO[t.id], seed >> 5),
    tip: f.tip,
    close: CLOSE[t.id] || CLOSE._,
  };
}

const svgOf = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="廟公解籤處" class="stall-svg jq-svg">
  <defs>
    <radialGradient id="jqShadow"><stop offset="0" stop-color="#2A0E06" stop-opacity=".5"/><stop offset="1" stop-color="#2A0E06" stop-opacity="0"/></radialGradient>
    <linearGradient id="jqWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A6234"/><stop offset="1" stop-color="#6E3F1E"/></linearGradient>
    <clipPath id="jqCounter" clipPathUnits="userSpaceOnUse"><rect x="0" y="0" width="360" height="352"/></clipPath>
  </defs>
  <image href="${BG || fallbackBg}" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>
  <!-- 招牌（字由程式寫，背景圖不畫字） -->
  <rect x="104" y="86" width="152" height="46" rx="6" fill="#2E1A10" stroke="#E2B04A" stroke-width="3"/>
  <text x="180" y="119" text-anchor="middle" class="jq-sign">解 籤 處</text>
  ${BG ? '' : `
  <!-- 暫代：籤詩櫃 -->
  <g transform="translate(118 148)">
    <rect x="-6" y="-6" width="136" height="145" rx="4" fill="url(#jqWood)" stroke="#4A2812" stroke-width="2"/>
    ${Array.from({ length: 20 }, (_, i) => { const c = i % 4, r = Math.floor(i / 4); return `<rect x="${c * 31 + 2}" y="${r * 27 + 2}" width="27" height="23" rx="2" fill="#B97A44" stroke="#5A3014"/><text x="${c * 31 + 15.5}" y="${r * 27 + 13}" text-anchor="middle" class="jq-drawer">${cn(i + 1)}</text><circle cx="${c * 31 + 15.5}" cy="${r * 27 + 19}" r="1.8" fill="#E2B04A"/>`; }).join('')}
  </g>`}
  <!-- 廟公（櫃台後面，下半身被櫃台擋住） -->
  <g clip-path="url(#jqCounter)">
    <g id="jqGong" transform="translate(180 352)" class="stall-prop" data-jq="gong" role="button" tabindex="0" aria-label="廟公">
      <g class="jq-idle">${GONG ? `<image href="${GONG}" x="-100" y="-175" width="200" height="300"/>` : gongSVG()}</g>
    </g>
  </g>
  <!-- 籤簿（廟公翻的） -->
  <g id="jqBook" transform="translate(120 346)" opacity="0">
    <path d="M0 0l-34 -6v-30l34 6z" fill="#FFF6E2" stroke="#8A5A2A"/><path d="M0 0l34 -6v-30l-34 6z" fill="#FFF6E2" stroke="#8A5A2A"/>
    <path d="M-28 -24l22 4M-28 -17l22 4M28 -24l-22 4M28 -17l-22 4" stroke="#C8302A" stroke-width="1.2"/>
  </g>
  <circle id="jqGlint" cx="196" cy="252" r="0" fill="#FFFFFF" opacity=".9"/>
  <!-- 你 -->
  <ellipse cx="180" cy="604" rx="60" ry="9" fill="url(#jqShadow)"/>
  <image id="jqMe" x="105" y="442" width="150" height="162"/>
  <!-- 籤詩 -->
  <rect id="jqRing" x="146" y="296" width="68" height="60" rx="8" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <g id="jqSlip" class="stall-prop" data-jq="slip" role="button" tabindex="0" aria-label="籤詩，交給廟公" style="display:none">
    <ellipse cx="0" cy="2" rx="18" ry="4" fill="url(#jqShadow)"/>
    <g transform="rotate(-8)">
      <rect x="-14" y="-62" width="28" height="62" rx="2" fill="#F6D24A" stroke="#C8302A" stroke-width="1.6"/>
      <rect x="-10" y="-58" width="20" height="54" fill="none" stroke="#C8302A" stroke-width=".8"/>
      <text id="jqSlipNo" x="0" y="-30" text-anchor="middle" class="jq-slip"></text>
    </g>
  </g>
</svg>`;

// 暫代美術：Q 版廟公。光頭兩側白髮、長長的白眉毛、圓框老花眼鏡掛在鼻頭、白鬍子，深藍唐裝背心配金色盤扣，胸前口袋插一支毛筆
function gongSVG() {
  return `
    <path d="M-62 40c0-48 22-72 62-72s62 24 62 72z" fill="#F7F2E6"/>
    <path d="M-50 40c0-40 16-62 50-62s50 22 50 62z" fill="#24366A"/>
    <path d="M0 -22v62" stroke="#E2B04A" stroke-width="2"/>
    ${[-8, 6, 20].map((y) => `<path d="M-7 ${y}h14" stroke="#E2B04A" stroke-width="3" stroke-linecap="round"/>`).join('')}
    <rect x="22" y="-6" width="16" height="12" rx="2" fill="#1B2852"/><path d="M30 -6l2 -22" stroke="#6E3F1E" stroke-width="3" stroke-linecap="round"/><path d="M32 -28l1 -6" stroke="#222" stroke-width="3" stroke-linecap="round"/>
    <circle cx="0" cy="-66" r="40" fill="#F6CFAE"/>
    <ellipse cx="-6" cy="-94" rx="14" ry="6" fill="#FFFFFF" opacity=".55"/>
    <path d="M-40 -64c-6-14 0-26 8-30 2 10 4 20 2 34zM40 -64c6-14 0-26-8-30-2 10-4 20-2 34z" fill="#EDEDED"/>
    <path d="M-30 -78q12 -8 22 -2M30 -78q-12 -8 -22 -2" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M-30 -78l-8 8M30 -78l8 8" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
    <circle cx="-14" cy="-60" r="11" fill="#FFFFFF" fill-opacity=".25" stroke="#B8862E" stroke-width="2.6"/>
    <circle cx="14" cy="-60" r="11" fill="#FFFFFF" fill-opacity=".25" stroke="#B8862E" stroke-width="2.6"/>
    <path d="M-3 -61h6" stroke="#B8862E" stroke-width="2.4"/>
    <path d="M-18 -60q4 3 8 0M10 -60q4 3 8 0" stroke="#3B1F17" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="-24" cy="-46" rx="6" ry="3.5" fill="#F29A8A" opacity=".6"/><ellipse cx="24" cy="-46" rx="6" ry="3.5" fill="#F29A8A" opacity=".6"/>
    <ellipse cx="0" cy="-48" rx="5" ry="4" fill="#E9AE8E"/>
    <path d="M-16 -40q8 -6 16 -2q8 -4 16 2q-6 4 -16 3q-10 1 -16 -3z" fill="#FFFFFF"/>
    <path d="M-7 -34q7 22 14 0z" fill="#FFFFFF"/>
    <path d="M-5 -36q5 4 10 0" stroke="#A0523C" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
}

export function initJieqian(api) {
  const { $, state, save, say, sfx, burst, openSheet, closeSheet, dayKey, esc, cam, me, halls, goDraw } = api;
  const host = $('#jqHost');
  host.innerHTML = svgOf();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const jq = state.jq || (state.jq = { log: [] });
  let reading = false;

  const pending = () => { const a = state.ask; return a && a.date === dayKey() && a.no && !a.read ? a : null; };
  const SLIP_REST = [262, 560], SLIP_AT = [180, 350];

  function paintMe() {
    const c = me(); const w = 150 * c.scale, h = 162 * c.scale;
    const el = S('jqMe'); el.setAttribute('href', c.kneel);
    el.setAttribute('width', w); el.setAttribute('height', h); el.setAttribute('x', 180 - w / 2); el.setAttribute('y', 604 - h);
  }
  function showSlip() {
    const a = pending();
    S('jqSlip').style.display = a ? '' : 'none';
    if (a) { S('jqSlipNo').textContent = cn(a.no); slip.home(); }
  }

  const slip = makeCarrier({
    svg, el: S('jqSlip'), sfx, cam, ring: S('jqRing'), lift: 70, radius: 40,
    rest: () => SLIP_REST, target: () => SLIP_AT, zoom: () => [180, 330, 260],
    onTap: () => say('按住<b>籤詩</b>拿起來，交到廟公手上。'),
    onDrop: () => read(pending()),
  });

  /* ----- 問事：想好問什麼，推薦去問哪位神明 ----- */
  function openAsk() {
    const a0 = state.ask && state.ask.date === dayKey() && !state.ask.read ? state.ask : null;
    let topic = a0?.topic || 'work', hall = a0?.hall || TOPICS[0].hall;
    const hallChips = () => Object.entries(halls).filter(([id]) => SRC[id]).map(([id, H]) => `<button type="button" class="chip" data-h="${id}" aria-pressed="${id === hall}">${esc(H.god)}</button>`).join('');
    const body = openSheet('問事：跟廟公說說', `
      <p>阿伯：「想問什麼事？一次問一件就好。想好了，去跟神明稟報、抽一支籤，再拿來給阿伯解。」</p>
      <div class="field"><span>問哪方面</span><div class="chips" id="jqTopic">${TOPICS.map((t) => `<button type="button" class="chip" data-t="${t.id}" aria-pressed="${t.id === topic}">${t.name}</button>`).join('')}</div></div>
      <label class="field"><span>想問的事（選填）</span><input type="text" id="jqQ" maxlength="30" placeholder="例：下個月要不要換工作？" value="${esc(a0?.q || '')}"></label>
      <div class="field"><span>去問哪位神明</span><p class="hint" id="jqWhy"></p><div class="chips" id="jqHall">${hallChips()}</div></div>
      <div class="row"><button class="btn" id="jqGo"></button></div>`);
    const paint = () => {
      body.querySelectorAll('[data-t]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.t === topic)));
      body.querySelectorAll('[data-h]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.h === hall)));
      const t = TOPICS.find((x) => x.id === topic);
      body.querySelector('#jqWhy').textContent = `問${t.name}，阿伯建議去拜${halls[t.hall].god}：${WHY[t.hall]}。`;
      body.querySelector('#jqGo').textContent = `去${halls[hall].name}向${halls[hall].god}稟報`;
    };
    body.addEventListener('click', (e) => {
      const t = e.target.closest('[data-t]'), h = e.target.closest('[data-h]');
      if (t) { topic = t.dataset.t; hall = TOPICS.find((x) => x.id === topic).hall; sfx.pop(); paint(); }
      if (h) { hall = h.dataset.h; sfx.pop(); paint(); }
    });
    body.querySelector('#jqGo').addEventListener('click', () => {
      state.ask = { date: dayKey(), topic, hall, q: body.querySelector('#jqQ').value.trim(), no: 0, read: false };
      save(); closeSheet();
      goDraw(hall);
    });
    paint();
  }

  /* ----- 解籤：今天抽過的籤，挑一支來問 ----- */
  function todays() {
    const out = [];
    for (const [id, s] of Object.entries(SRC)) {
      if (!halls[id]) continue;
      const rec = s.key ? state[s.key]?.qian : state.fortune;
      if (rec && rec.date === dayKey() && rec.no) out.push({ hall: id, no: rec.no, cat: rec.cat });
    }
    return out;
  }
  function openPick() {
    if (pending()) { say('籤詩在你手上，按住拿起來交給阿伯就好。'); return; }
    const list = todays();
    if (!list.length) {
      openSheet('解籤', '<p>阿伯：「今天還沒抽籤喔。先按「<b>問事</b>」想好要問什麼，去神明那裡抽一支再來。」</p><div class="row"><button class="btn" id="jqToAsk">問事</button></div>');
      $('#jqToAsk').addEventListener('click', openAsk);
      return;
    }
    const body = openSheet('解籤：今天抽的籤', `
      <p>阿伯：「拿哪一支來？順便說說你想問什麼。」</p>
      <div class="jq-list">${list.map((x, i) => { const s = SRC[x.hall], f = s.list.find((k) => k.no === x.no); return `<button type="button" class="jq-pick" data-i="${i}"${i === 0 ? ' aria-pressed="true"' : ''}><img src="${halls[x.hall].face}" alt=""><span><b>${s.name}第${cn(x.no)}籤</b><small>${f.title}・${f.level}</small></span></button>`; }).join('')}</div>
      <div class="field"><span>想問哪方面</span><div class="chips">${TOPICS.map((t, i) => `<button type="button" class="chip" data-t="${t.id}" aria-pressed="${i === 0}">${t.name}</button>`).join('')}</div></div>
      <label class="field"><span>想問的事（選填）</span><input type="text" id="jqQ2" maxlength="30" placeholder="例：這段感情要不要繼續？"></label>
      <div class="row"><button class="btn" id="jqTake">拿去給廟公</button></div>`);
    let i = 0, topic = list[0].cat ? CAT_TOPIC[list[0].cat] : TOPICS.find((t) => t.hall === list[0].hall)?.id || 'work';
    const paint = () => {
      body.querySelectorAll('[data-i]').forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.i === i)));
      body.querySelectorAll('[data-t]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.t === topic)));
    };
    paint();
    body.addEventListener('click', (e) => {
      const p = e.target.closest('[data-i]'), t = e.target.closest('[data-t]');
      if (p) { i = +p.dataset.i; sfx.pop(); paint(); }
      if (t) { topic = t.dataset.t; sfx.pop(); paint(); }
    });
    body.querySelector('#jqTake').addEventListener('click', () => {
      const x = list[i];
      state.ask = { date: dayKey(), topic, hall: x.hall, q: body.querySelector('#jqQ2').value.trim(), no: x.no, read: false };
      save(); closeSheet(); showSlip();
      say('籤詩拿在手上了。<b>按住籤詩</b>，往上交到阿伯手裡。');
    });
  }

  /* ----- 廟公看籤、解籤 ----- */
  async function read(a) {
    if (!a || reading) return;
    reading = true;
    S('jqSlip').style.display = 'none';
    sfx.pop(); say('阿伯把老花眼鏡往上推了推：「我看看喔……」');
    const glint = S('jqGlint'), book = S('jqBook');
    if (!GONG) await tween(260, (k) => glint.setAttribute('r', (Math.sin(k * Math.PI) * 9).toFixed(1)));
    book.setAttribute('opacity', '1'); sfx.rattle(.4);
    await tween(reduce ? 100 : 900, (k) => book.setAttribute('transform', `translate(120 346) scale(${1 + Math.sin(k * Math.PI * 3) * .06} 1)`));
    await sleep(reduce ? 100 : 300);
    book.setAttribute('opacity', '0');
    cam?.reset(300);
    a.read = true;
    const entry = { date: a.date, topic: a.topic, hall: a.hall, no: a.no, q: a.q };
    jq.log = [entry, ...(jq.log || []).filter((x) => !(x.date === entry.date && x.hall === entry.hall && x.no === entry.no && x.topic === entry.topic))].slice(0, 20);
    save();
    sfx.chime(); burst?.('spark', 180, 300, reduce ? 4 : 14);
    reading = false;
    showReading(entry);
    say('阿伯解完籤，喝了一口茶：「還有想問的，再來找阿伯。」');
  }

  function showReading(entry) {
    const r = readingOf(entry, halls);
    if (!r) { say('阿伯翻了翻籤簿：「這支籤阿伯找不到，再抽一支看看？」'); return; }
    const { f, t } = r;
    openSheet(`廟公解籤・${r.src.name}第${cn(f.no)}籤`, `
      <div class="slip">
        <div class="slip-side"><span>${r.src.name}第${cn(f.no)}首・${f.title}</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain jq-talk">
        <p class="hint">問事：<span class="tag">${t.name}</span>${entry.q ? esc(entry.q) : ''}</p>
        <p>${r.open}${r.hallNote}</p>
        <h3>籤詩在說什麼</h3>
        <p>${r.gist}</p>
        <h3>問${t.name}</h3>
        ${r.own ? `<p>籤上本來就有寫：${r.own}</p>` : ''}
        <p>${r.advice}</p>
        ${entry.q ? `<p>你問「${esc(entry.q)}」，${r.verdict}</p>` : ''}
        <h3>阿伯叮嚀</h3>
        <p>${r.tip}還有，${r.act}</p>
        <p class="hint">${r.close}</p>
      </div>
      <div class="row"><button class="btn" id="jqAgain">再問一件事</button><button class="btn ghost" id="jqOk">謝謝阿伯</button></div>`);
    $('#jqAgain').addEventListener('click', openAsk);
    $('#jqOk').addEventListener('click', closeSheet);
  }

  function openLog() {
    const log = jq.log || [];
    if (!log.length) { openSheet('解籤簿', '<p>還沒有請阿伯解過籤。按「<b>問事</b>」開始。</p>'); return; }
    const body = openSheet('解籤簿', `<p class="hint">阿伯幫你解過的籤（最近 20 支），點一下再看一次。</p><div class="jq-list">${log.map((x, i) => { const s = SRC[x.hall], f = s?.list.find((k) => k.no === x.no); if (!f) return ''; const t = TOPICS.find((k) => k.id === x.topic); return `<button type="button" class="jq-pick" data-l="${i}"><img src="${halls[x.hall]?.face || ''}" alt=""><span><b>${x.date.slice(5).replace('-', '/')}・問${t?.name || ''}</b><small>${s.name}第${cn(x.no)}籤 ${f.title}・${f.level}${x.q ? '｜' + esc(x.q) : ''}</small></span></button>`; }).join('')}</div>`);
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-l]'); if (b) showReading(log[+b.dataset.l]); });
  }

  function tapGong() {
    sfx.knock();
    if (pending()) { say('阿伯伸出手：「籤詩拿來，阿伯幫你看。」按住<b>籤詩</b>交給阿伯。'); return; }
    say(pick(['阿伯：「心裡有事？說出來，阿伯幫你參詳參詳。」按「<b>問事</b>」。', '阿伯：「抽到籤看不懂沒關係，拿來阿伯講白話給你聽。」', '阿伯喝了一口茶：「籤詩是神明的話，阿伯只是翻譯啦。」']));
  }
  S('jqGong').addEventListener('click', tapGong);
  S('jqGong').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapGong(); } });
  $('#jqBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-jq]'); if (!b) return;
    const a = b.dataset.jq;
    if (a === 'ask') openAsk();
    else if (a === 'read') { if (pending()) slip.auto(); else openPick(); }
    else if (a === 'log') openLog();
  });

  return {
    enter() {
      paintMe(); showSlip(); reading = false;
      const a = pending();
      say(a ? `抽到第${cn(a.no)}籤了！<b>按住籤詩</b>拿起來，交到廟公阿伯手上，請他解籤。`
        : '廟公阿伯推了推老花眼鏡：「來，坐。想問工作、感情、考試都可以。」<br>按「<b>問事</b>」想好要問什麼；今天已經抽過籤的話，按「<b>解籤</b>」。');
    },
    leave() { reading = false; },
    pending,
  };
}

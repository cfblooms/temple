// 註生娘娘殿：栽花（選紅花或白花，拿起來插進供桌上的花盆，寫下為誰祈福）；獻虎頭鞋；娘娘籤。
// 文案溫柔、不做任何醫療承諾。場景座標 360 × 645；SVG 裡的 id 都加 z 前綴。
import bgUrl from './assets/zs/zs-bg.webp';
import festUrl from './assets/zs/zs-festival.webp';
import potUrl from './assets/zs/pot.webp';
import redUrl from './assets/zs/flower-red.webp';
import whiteUrl from './assets/zs/flower-white.webp';
import shoesUrl from './assets/zs/shoes.webp';
import { makeCarrier } from './carry.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 文字內容（原創） ---------- */
export const ZS_QIAN = [
  { no: 1, level: '上上', title: '花開', poem: ['天上花園一盆花', '娘娘親手照顧它', '時候到了自然開', '不用急也不用怕'],
    gist: '你在等的那件事，有它自己的時間。先把自己照顧好。', tip: '今天早點睡，好好吃一頓營養的飯。' },
  { no: 2, level: '中吉', title: '安心', poem: ['心裡七上又八下', '娘娘輕輕拍拍她', '放鬆一點身體好', '好消息會來敲門'],
    gist: '太緊張反而不好。放鬆的心情，是給自己最好的禮物。', tip: '找一件讓你放鬆的事，今天做十五分鐘。' },
  { no: 3, level: '上吉', title: '平安', poem: ['小小孩兒笑呵呵', '跌倒爬起又唱歌', '娘娘派了十二婆', '一個一個顧著他'],
    gist: '孩子會平安長大的。大人別太焦慮，孩子感受得到。', tip: '今天陪孩子（或心裡的那個小孩）玩十分鐘。' },
  { no: 4, level: '中平', title: '等候', poem: ['春天播種秋天收', '中間雨水慢慢流', '等待也是在準備', '準備好了福自有'],
    gist: '等待不是白等。這段時間，好好準備自己的身體和心情。', tip: '有疑問就問專業的醫生，不要自己一直上網查。' },
  { no: 5, level: '上吉', title: '相伴', poem: ['兩個人兒手牽手', '風風雨雨一起走', '不管將來怎麼樣', '有你在就是福'],
    gist: '身邊的伴是最大的支持。彼此打氣，路就不孤單。', tip: '今天跟另一半說一句謝謝，或給一個擁抱。' },
  { no: 6, level: '中吉', title: '長大', poem: ['虎頭鞋兒穿上腳', '一步一步學走好', '今天跌倒明天跑', '娘娘看了微微笑'],
    gist: '孩子有自己的步調，不用跟別人比。慢慢來也很好。', tip: '寫下孩子最近進步的一件小事，好好誇他。' },
  { no: 7, level: '中平', title: '照顧', poem: ['照顧別人辛苦了', '自己也要被照顧', '累了就說我累了', '休息一下沒關係'],
    gist: '照顧家人很辛苦，你也需要被照顧。開口請人幫忙。', tip: '把一件家事交給別人做，今天讓自己休息一下。' },
  { no: 8, level: '上上', title: '福氣', poem: ['紅花白花都是花', '每一朵都是寶啊', '娘娘賜你好福氣', '一家和樂笑哈哈'],
    gist: '每個孩子都是寶，每個家都有自己的福氣。', tip: '今天跟家人一起吃頓飯，聊聊天。' },
];
const GREET = [
  '註生娘娘溫柔地笑：「來，坐下來歇一歇。」',
  '註生娘娘輕聲說：「心裡掛念的事，慢慢說給我聽。」',
  '註生娘娘點點頭：「天上的花園裡，每一朵花我都記得。」',
  '註生娘娘說：「別太累了，先把自己照顧好。」',
];
const NAMES = ['一', '二', '三', '四', '五', '六', '七', '八'];
const WHO = ['自己', '另一半', '寶寶', '家人'];

/* ---------- 場景 ---------- */
// 參考點：娘娘臉 (180,280)、供桌桌面 y≈380、拜墊中心 (184,525)
const POT = [134, 381, 46, 42]; // 花盆：底部中心 x、y（桌面）、寬、高
const SOIL = [POT[0], POT[1] - POT[2] * .82]; // 花插下去的位置（土面）
const FLOWER = [24, 52]; // 花的寬、高（原點在花莖底部）
const F_REST = [300, 600];
const SHOES = [200, 352, 46, 36];
export const ZS_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="註生娘娘殿" class="zs-svg">
  <defs>
    <filter id="zLit" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="1 .03 0 0 .01  .02 .95 0 0 0  .01 .02 .9 0 0  0 0 0 1 0"/>
    </filter>
    <radialGradient id="zContact"><stop offset="0" stop-color="#2A140A" stop-opacity=".5"/><stop offset="1" stop-color="#2A140A" stop-opacity="0"/></radialGradient>
    <radialGradient id="zHalo"><stop offset="0" stop-color="#FFF6E0" stop-opacity=".95"/><stop offset=".6" stop-color="#FFC3C8" stop-opacity=".35"/><stop offset="1" stop-color="#FFC3C8" stop-opacity="0"/></radialGradient>
  </defs>
  <image id="zBg" href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice" style="display:none"/>
  <circle id="zHaloC" cx="180" cy="285" r="58" fill="url(#zHalo)" opacity=".15" style="mix-blend-mode:screen"/>
  <rect class="hit" data-zs="deity" role="button" tabindex="0" aria-label="向註生娘娘問安" x="145" y="245" width="72" height="115" rx="22" fill="transparent"/>

  <!-- 花盆（一直在供桌左邊）＋栽好的花 -->
  <image id="zPlanted" href="${redUrl}" x="${SOIL[0] - FLOWER[0] * .65}" y="${SOIL[1] - FLOWER[1] * 1.3 + 8}" width="${FLOWER[0] * 1.3}" height="${FLOWER[1] * 1.3}" style="display:none" filter="url(#zLit)"/>
  <image class="hit" data-zs="pot" role="button" tabindex="0" aria-label="花盆" href="${potUrl}" x="${POT[0] - POT[2] / 2}" y="${POT[1] - POT[3]}" width="${POT[2]}" height="${POT[3]}" filter="url(#zLit)"/>
  <ellipse id="zRing" cx="${SOIL[0]}" cy="${SOIL[1]}" rx="20" ry="6" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <image id="zShoes" class="zs-offer" href="${shoesUrl}" x="${SHOES[0]}" y="${SHOES[1]}" width="${SHOES[2]}" height="${SHOES[3]}" style="display:none" filter="url(#zLit)"/>

  <!-- 拿在手上的花（選好才出現） -->
  <g id="zFlower" class="zs-prop" data-zs="flower" role="button" tabindex="0" aria-label="花，拿起來插進花盆" style="display:none" transform="translate(${F_REST[0]} ${F_REST[1]})">
    <ellipse cx="0" cy="2" rx="14" ry="3" fill="url(#zContact)"/>
    <rect x="-16" y="${-FLOWER[1] * 1.3 - 4}" width="32" height="${FLOWER[1] * 1.3 + 8}" fill="transparent"/>
    <image id="zFlowerImg" href="${redUrl}" x="${-FLOWER[0] * .65}" y="${-FLOWER[1] * 1.3}" width="${FLOWER[0] * 1.3}" height="${FLOWER[1] * 1.3}" filter="url(#zLit)"/>
  </g>
</svg>`;

export function initZhusheng(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam } = api;
  const host = $('#zsHost');
  host.innerHTML = ZS_SVG(bgUrl);
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const zs = state.zs || (state.zs = { flower: null, shoeDay: '', qian: null });

  function greetGod() {
    S('zHaloC').setAttribute('opacity', '.7'); setTimeout(() => S('zHaloC').setAttribute('opacity', '.15'), 1400);
    burst('spark', 180, 285, reduce ? 3 : 10);
    say(GREET[Math.floor(Math.random() * GREET.length)], 'god');
  }

  /* ----- 栽花 ----- */
  let draft = null; // { c: 'red' | 'white', who }
  const paintPlanted = () => {
    const f = zs.flower, el = S('zPlanted');
    el.style.display = f ? '' : 'none';
    if (f) el.setAttribute('href', f.c === 'white' ? whiteUrl : redUrl);
  };
  paintPlanted();
  const flowerEl = S('zFlower');
  const carrier = makeCarrier({
    svg, el: flowerEl, sfx, cam, ring: S('zRing'), lift: 70, radius: 30,
    rest: () => F_REST, target: () => SOIL, zoom: () => [SOIL[0] + 20, SOIL[1] + 20, 200],
    onTap: () => say('按住右下角的<b>花</b>拿起來，插進供桌左邊的<b>花盆</b>裡。', 'god'),
    onDrop() {
      flowerEl.style.display = 'none';
      zs.flower = { c: draft.c, who: draft.who, day: dayKey() }; save(); paintPlanted();
      const el = S('zPlanted'); el.classList.remove('pop'); void el.getBoundingClientRect(); el.classList.add('pop');
      sfx.chime(); sfx.buzz([15, 40, 15]);
      burst('spark', SOIL[0], SOIL[1] - 20, reduce ? 4 : 16);
      emit('heart', SOIL[0], SOIL[1] - 30); emit('heart', SOIL[0] + 6, SOIL[1] - 40);
      S('zHaloC').setAttribute('opacity', '.75'); setTimeout(() => S('zHaloC').setAttribute('opacity', '.15'), 1800);
      say(`${draft.c === 'white' ? '白花' : '紅花'}栽好了，為「${esc(draft.who)}」祈福。註生娘娘說：「這盆花我替你照顧，你也要好好照顧自己。」`, 'god');
      draft = null; cam?.reset(1800);
    },
  });
  function openPlant() {
    const f = zs.flower;
    const body = openSheet('栽一盆花', `
      ${f ? `<p>花盆裡現在是一朵<b>${f.c === 'white' ? '白花' : '紅花'}</b>，為「${esc(f.who)}」祈福。想換一朵也可以。</p>` : ''}
      <p>民間說每個人在天上都有一盆花。選一朵你喜歡的花，插進供桌上的花盆，為心裡掛念的人祈福。</p>
      <div class="zs-pick">
        <button type="button" class="zs-flower on" data-c="red"><img src="${redUrl}" alt=""><span>紅花</span></button>
        <button type="button" class="zs-flower" data-c="white"><img src="${whiteUrl}" alt=""><span>白花</span></button>
      </div>
      <div class="field"><span>為誰祈福</span><div class="chips">${WHO.map((w, i) => `<button type="button" class="chip" data-who="${w}" aria-pressed="${!i}">${w}</button>`).join('')}</div></div>
      <input id="zName" class="yue-wish" maxlength="8" placeholder="也可以寫名字（可以不填）">
      <div class="row"><button class="btn" id="zGo">選好了</button></div>
      <p class="hint">這是心意與祝福，身體的事記得找專業醫師。</p>`);
    let c = 'red', who = WHO[0];
    body.addEventListener('click', (e) => {
      const fb = e.target.closest('[data-c]'); if (fb) { c = fb.dataset.c; body.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('on', b === fb)); }
      const wb = e.target.closest('[data-who]'); if (wb) { who = wb.dataset.who; body.querySelectorAll('[data-who]').forEach((b) => b.setAttribute('aria-pressed', String(b === wb))); }
    });
    body.querySelector('#zGo').addEventListener('click', () => {
      const n = body.querySelector('#zName').value.trim();
      draft = { c, who: n || who }; closeSheet();
      S('zFlowerImg').setAttribute('href', c === 'white' ? whiteUrl : redUrl);
      flowerEl.style.display = ''; carrier.home();
      flowerEl.classList.remove('pop'); void flowerEl.getBoundingClientRect(); flowerEl.classList.add('pop');
      sfx.pop();
      say('花在右下角。按住它拿起來，插進供桌左邊的<b>花盆</b>裡。', 'god');
    });
  }

  /* ----- 虎頭鞋 ----- */
  const paintShoes = () => { S('zShoes').style.display = zs.shoeDay === dayKey() ? '' : 'none'; };
  paintShoes();
  function offerShoes() {
    if (zs.shoeDay === dayKey()) { say('今天的虎頭鞋已經擺上供桌了。'); return; }
    zs.shoeDay = dayKey(); save(); paintShoes();
    cam?.zoom(SHOES[0] + 20, SHOES[1] + 10, 190);
    const el = S('zShoes'); el.classList.remove('pop'); void el.getBoundingClientRect(); el.classList.add('pop');
    sfx.pop(); setTimeout(() => sfx.chime(), 300);
    burst('spark', SHOES[0] + 23, SHOES[1] + 18, reduce ? 3 : 10);
    say('一雙虎頭鞋擺上供桌了。老虎眼睛圓圓的，保佑孩子<b>虎頭虎腦、平安長大</b>，走路穩穩的。', 'god');
    cam?.reset(2000);
  }

  /* ----- 娘娘籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!zs.qian || zs.qian.date !== t) { zs.qian = { date: t, no: 1 + Math.floor(Math.random() * ZS_QIAN.length) }; save(); sfx.rattle(1); }
    const f = ZS_QIAN.find((x) => x.no === zs.qian.no);
    openSheet(`娘娘籤第${NAMES[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>娘娘籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日溫柔小功課</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，身體的事請找專業醫師。</p>`);
  }

  const ACTS = { plant: () => (draft ? carrier.auto() : openPlant()), shoes: offerShoes, qian: openQian };
  svg.addEventListener('click', (e) => {
    if (e.target.closest('[data-zs="deity"]')) greetGod();
    else if (e.target.closest('[data-zs="pot"]')) { if (draft) carrier.auto(); else openPlant(); }
  });
  svg.querySelector('[data-zs="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#zsBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-zs]'); if (b) ACTS[b.dataset.zs](); });

  return {
    enter() {
      paintPlanted(); paintShoes();
      const f = zs.flower;
      say(f ? `歡迎回來。花盆裡的${f.c === 'white' ? '白花' : '紅花'}還開著，為「${esc(f.who)}」祈福。今天也來上一炷香吧。`
        : '歡迎來到註生娘娘殿。先點燭、上香。按「栽花」選一朵花，插進供桌上的花盆，為心裡掛念的人祈福。', 'god');
    },
    setFestive(on) { S('zBg').setAttribute('href', on ? festUrl : bgUrl); },
    god: '註生娘娘', qianName: '娘娘籤', qianCount: ZS_QIAN.length,
    hasQianToday: () => !!zs.qian && zs.qian.date === dayKey(),
    setQian(no) { zs.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

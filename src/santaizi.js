// 三太子殿：轉風火輪集「衝勁」；獻零食（養樂多、糖果罐、奶嘴）；太子籤。
// 場景座標跟正殿一樣是 360 × 645；SVG 裡的 id 都加 s 前綴，避免跟其他殿的 SVG 撞名。
import bgUrl from './assets/san/san-bg.webp';
import festUrl from './assets/san/san-festival.webp';
import wheelUrl from './assets/san/wheel.webp';
import yogurtUrl from './assets/san/yogurt.webp';
import candyUrl from './assets/san/candy.webp';
import paciUrl from './assets/san/pacifier.webp';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 文字內容（原創） ---------- */
export const SAN_QIAN = [
  { no: 1, level: '上上', title: '出發', poem: ['風火輪兒轉三圈', '想做的事別拖延', '先踏出去再說吧', '路會自己鋪眼前'],
    gist: '一直在想的那件事，今天先做第一步，不用等準備好。', tip: '把拖最久的一件事，今天做五分鐘就好。' },
  { no: 2, level: '中吉', title: '玩心', poem: ['太子愛玩又愛笑', '糖果揣在口袋跑', '大人也要有玩心', '開心才會做得好'],
    gist: '最近太嚴肅了。留一點時間玩，效率反而更好。', tip: '今天做一件純粹好玩、沒有目的的小事。' },
  { no: 3, level: '上吉', title: '平安', poem: ['出門東西檢查好', '慢慢開車不急躁', '太子坐在副駕駛', '一路綠燈到家早'],
    gist: '出門在外，平安最大。慢一點，早一點出發。', tip: '今天出門前多看一眼：鑰匙、手機、錢包、心情。' },
  { no: 4, level: '中平', title: '勇氣', poem: ['個子小小膽子大', '海龍王也不怕他', '心裡怕的那件事', '其實沒有那麼可怕'],
    gist: '你怕的事情，多半比想像中小。先面對，就贏一半。', tip: '寫下你最怕的那件事最壞會怎樣，你會發現撐得住。' },
  { no: 5, level: '上吉', title: '貴人', poem: ['乾坤圈兒繞一繞', '好朋友們圍來到', '有事開口說出來', '幫你的人比你想的多'],
    gist: '不要什麼都自己扛。開口求助，貴人就在身邊。', tip: '今天主動問一個人：「可以幫我一下嗎？」' },
  { no: 6, level: '中吉', title: '重來', poem: ['蓮花化身又一回', '跌倒爬起拍拍灰', '昨天搞砸沒關係', '今天的你是新的'],
    gist: '昨天不順，不代表今天也會。每天都可以重新開始。', tip: '睡前跟自己說一句：「明天是新的一天。」' },
  { no: 7, level: '中平', title: '專心', poem: ['火尖槍要對準頭', '東跑西跑不成就', '一次只做一件事', '做完再換下一手'],
    gist: '同時做太多事，什麼都做不好。先挑一件做完。', tip: '把手機放遠一點，專心做一件事 25 分鐘。' },
  { no: 8, level: '上上', title: '童心', poem: ['養樂多一口乾杯', '笑得眼睛瞇成堆', '簡單的事最快樂', '別讓長大偷走美'],
    gist: '快樂可以很簡單。今天允許自己像小孩一樣開心。', tip: '買一樣小時候愛吃的零食，慢慢吃完它。' },
];
const GREET = [
  '三太子踩著風火輪轉了一圈：「嘿！你來啦！要不要一起轉輪子？」',
  '三太子晃著乾坤圈：「有糖果嗎？沒有也沒關係，我保佑你啦！」',
  '三太子雙手叉腰：「誰欺負你？跟我說，我去幫你出氣！」',
  '三太子眨眨眼：「出門開車要慢慢的喔，我會坐在你旁邊。」',
];
const DONE = [
  '風火輪轉得呼呼響！三太子跳上輪子繞了廟一圈：「衝衝衝！今天的衝勁給你！」',
  '輪子冒出火花，三太子笑得好開心：「轉得好！今天做什麼都有勁！」',
  '三太子拍拍手：「哇，你比哪吒還會轉！出門平安，一路順風！」',
];
const NAMES = ['一', '二', '三', '四', '五', '六', '七', '八'];
const SNACKS = {
  yogurt: { name: '乳酸飲料', img: yogurtUrl, x: 117, y: 341, w: 25, h: 41, say: '乳酸飲料擺上供桌了！三太子插上吸管：「一口乾杯！今天腸胃順、心情也順！」' },
  paci: { name: '奶嘴', img: paciUrl, x: 144, y: 352, w: 29, h: 32, say: '奶嘴擺上去了。三太子臉紅了一下：「我、我已經長大了啦……不過還是謝謝你。」小朋友平安長大，三太子會保佑。' },
  candy: { name: '糖果罐', img: candyUrl, x: 202, y: 337, w: 38, h: 46, say: '整罐糖果擺上供桌！三太子眼睛都亮了：「好多棒棒糖！今天你說什麼我都幫！」' },
};

/* ---------- 場景 ---------- */
// 參考點：三太子臉 (180,285)、供桌桌面 y≈378、拜墊中心 (184,525)
const WHEEL = [298, 566, 74]; // 風火輪：中心 x、y、大小
const NEED = 1080; // 轉滿三圈
const RING = 2 * Math.PI * 44;
export const SAN_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="三太子殿" class="san-svg">
  <defs>
    <filter id="sLit" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="1 .03 0 0 .01  .02 .93 0 0 0  .01 .02 .85 0 0  0 0 0 1 0"/>
    </filter>
    <radialGradient id="sContact"><stop offset="0" stop-color="#2A140A" stop-opacity=".55"/><stop offset="1" stop-color="#2A140A" stop-opacity="0"/></radialGradient>
    <radialGradient id="sHalo"><stop offset="0" stop-color="#FFF3C8" stop-opacity=".95"/><stop offset=".6" stop-color="#FFB06B" stop-opacity=".35"/><stop offset="1" stop-color="#FFB06B" stop-opacity="0"/></radialGradient>
    <radialGradient id="sFire"><stop offset=".55" stop-color="#FF8A2A" stop-opacity="0"/><stop offset=".8" stop-color="#FF8A2A" stop-opacity=".55"/><stop offset="1" stop-color="#FFD24A" stop-opacity="0"/></radialGradient>
  </defs>
  <image id="sBg" href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice" style="display:none"/>
  <circle id="sHaloC" cx="180" cy="290" r="56" fill="url(#sHalo)" opacity=".15" style="mix-blend-mode:screen"/>
  <rect class="hit" data-san="deity" role="button" tabindex="0" aria-label="向三太子問安" x="145" y="250" width="72" height="110" rx="22" fill="transparent"/>

  <!-- 零食（獻了才出現） -->
  ${Object.entries(SNACKS).map(([k, o]) => `<image id="s_${k}" class="san-offer" href="${o.img}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" style="display:none" filter="url(#sLit)"/>`).join('')}

  <!-- 風火輪（拜墊右前方，按住畫圈轉它） -->
  <ellipse cx="${WHEEL[0]}" cy="${WHEEL[1] + WHEEL[2] / 2 - 2}" rx="30" ry="5" fill="url(#sContact)"/>
  <g class="san-wheel" data-san="wheel" role="button" tabindex="0" aria-label="風火輪，畫圈轉三圈">
    <circle cx="${WHEEL[0]}" cy="${WHEEL[1]}" r="58" fill="transparent"/>
    <circle id="sFireC" cx="${WHEEL[0]}" cy="${WHEEL[1]}" r="50" fill="url(#sFire)" opacity="0"/>
    <circle cx="${WHEEL[0]}" cy="${WHEEL[1]}" r="44" fill="none" stroke="#3A1A0A" stroke-opacity=".25" stroke-width="5"/>
    <circle id="sRing" cx="${WHEEL[0]}" cy="${WHEEL[1]}" r="44" fill="none" stroke="#FFD24A" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="0 ${RING.toFixed(1)}" transform="rotate(-90 ${WHEEL[0]} ${WHEEL[1]})"/>
    <g id="sWheelRot"><image href="${wheelUrl}" x="${WHEEL[0] - WHEEL[2] / 2}" y="${WHEEL[1] - WHEEL[2] / 2}" width="${WHEEL[2]}" height="${WHEEL[2]}" filter="url(#sLit)"/></g>
  </g>
</svg>`;

export function initSantaizi(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, cam } = api;
  const host = $('#sanHost');
  host.innerHTML = SAN_SVG(bgUrl);
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const san = state.san || (state.san = { spins: 0, spinDay: '', snack: {}, qian: null });
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };

  /* ----- 三太子問安 ----- */
  function greetGod() {
    S('sHaloC').setAttribute('opacity', '.7'); setTimeout(() => S('sHaloC').setAttribute('opacity', '.15'), 1400);
    burst('spark', 180, 290, reduce ? 3 : 10);
    say(GREET[Math.floor(Math.random() * GREET.length)], 'god');
  }

  /* ----- 風火輪：按住，在輪子旁邊畫圈 ----- */
  const wheel = svg.querySelector('[data-san="wheel"]'), rotG = S('sWheelRot'), ring = S('sRing'), fire = S('sFireC');
  const spunToday = () => san.spinDay === dayKey();
  let rot = 0, total = 0, omega = 0, grab = null, anim = 0, lastT = 0;
  const paint = () => {
    rotG.setAttribute('transform', `rotate(${rot.toFixed(1)} ${WHEEL[0]} ${WHEEL[1]})`);
    const k = spunToday() ? 1 : Math.min(1, total / NEED);
    ring.setAttribute('stroke-dasharray', `${(k * RING).toFixed(1)} ${RING.toFixed(1)}`);
    fire.setAttribute('opacity', Math.min(1, Math.abs(omega) / 900).toFixed(2));
  };
  const angAt = (p) => Math.atan2(p.y - WHEEL[1], p.x - WHEEL[0]) * 180 / Math.PI;
  function addTurn(d) {
    rot += d;
    if (spunToday()) return;
    total += Math.abs(d);
    if (total >= NEED) finish();
  }
  function finish() {
    san.spinDay = dayKey(); san.spins++; save();
    sfx.chime(); sfx.buzz([15, 40, 15, 40, 20]);
    burst('spark', WHEEL[0], WHEEL[1], reduce ? 5 : 24);
    emit('text', WHEEL[0] - 40, WHEEL[1] - 70, { text: '衝勁 +1', color: '#FFD86B', life: 1.8, vy: -26 });
    setTimeout(() => {
      S('sHaloC').setAttribute('opacity', '.7'); setTimeout(() => S('sHaloC').setAttribute('opacity', '.15'), 1600);
      say(`${DONE[Math.floor(Math.random() * DONE.length)]}（已經集了 ${san.spins} 天衝勁）`, 'god');
      cam?.reset(600);
    }, 500);
  }
  function loop(t) {
    const dt = lastT ? Math.min(.05, (t - lastT) / 1000) : .016; lastT = t;
    if (!grab) { addTurn(omega * dt); omega *= Math.exp(-dt * 1.6); }
    if (Math.abs(omega) > 500 && Math.random() < .5) {
      const a = Math.random() * Math.PI * 2; emit('spark', WHEEL[0] + Math.cos(a) * 38, WHEEL[1] + Math.sin(a) * 38);
    }
    paint();
    if (grab || Math.abs(omega) > 8) anim = requestAnimationFrame(loop);
    else { anim = 0; lastT = 0; omega = 0; paint(); }
  }
  const kick = () => { if (!anim) { lastT = 0; anim = requestAnimationFrame(loop); } };
  wheel.addEventListener('pointerdown', (e) => {
    e.preventDefault(); wheel.setPointerCapture(e.pointerId);
    const p = pt(e); grab = { a: angAt(p), t: performance.now(), moved: 0 };
    omega = 0; if (!spunToday()) total = Math.min(total, NEED - 1);
    sfx.pop(); kick();
    cam?.zoom(WHEEL[0] - 30, WHEEL[1] - 20, 220); // 放大輪子，手指在輪子外圈畫圈就好
  });
  wheel.addEventListener('pointermove', (e) => {
    if (!grab) return;
    const p = pt(e), now = performance.now();
    if (Math.hypot(p.x - WHEEL[0], p.y - WHEEL[1]) < 8) return; // 太靠中心角度會亂跳
    const a = angAt(p); let d = a - grab.a; if (d > 180) d -= 360; if (d < -180) d += 360;
    const dt = Math.max(8, now - grab.t) / 1000;
    omega = omega * .6 + (d / dt) * .4; grab.a = a; grab.t = now; grab.moved += Math.abs(d);
    addTurn(d);
  });
  const up = () => {
    if (!grab) return;
    const moved = grab.moved; grab = null; kick();
    if (moved < 20) { cam?.reset(300); hint(); return; }
    if (!spunToday()) {
      cam?.reset(1200);
      say(`還差一點！已經轉了 ${(total / 360).toFixed(1)} 圈，按住輪子<b>繞大圈</b>，轉滿三圈。`, 'god');
    }
  };
  wheel.addEventListener('pointerup', up);
  wheel.addEventListener('pointercancel', up);
  function hint() {
    say(spunToday() ? '今天的衝勁已經集滿了，想轉還是可以轉著玩。明天再來，連續集衝勁！'
      : '按住右下角的<b>風火輪</b>，手指在輪子外面<b>繞圈圈</b>，不用壓在輪子上。轉滿三圈，三太子就把衝勁給你。', 'god');
  }
  function autoSpin() { // 按鈕／鍵盤：輪子自己轉
    if (spunToday()) { hint(); omega = 900; kick(); return; }
    cam?.zoom(WHEEL[0] - 30, WHEEL[1] - 20, 220);
    omega = 1500; kick();
    const keep = () => { if (!spunToday() && !grab) { omega = Math.max(omega, 1300); requestAnimationFrame(keep); } };
    requestAnimationFrame(keep);
  }
  wheel.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); autoSpin(); } });

  /* ----- 獻零食 ----- */
  const paintSnacks = () => { for (const k of Object.keys(SNACKS)) S('s_' + k).style.display = san.snack[k] === dayKey() ? '' : 'none'; };
  paintSnacks();
  function offer(k) {
    const o = SNACKS[k], el = S('s_' + k);
    if (san.snack[k] === dayKey()) { say(`今天的${o.name}已經擺上去了，三太子正抱著它呢。`); return; }
    san.snack[k] = dayKey(); save(); paintSnacks();
    el.classList.remove('pop'); void el.getBoundingClientRect(); el.classList.add('pop');
    sfx.pop(); setTimeout(() => sfx.chime(), 300);
    burst('spark', o.x + o.w / 2, o.y + o.h / 2, reduce ? 3 : 10);
    say(o.say, 'god');
  }
  function openSnacks() {
    const body = openSheet('獻零食給三太子', `
      <p>三太子是小孩子神，最愛甜甜的零食。每樣一天可以獻一次。</p>
      <div class="san-snacks">${Object.entries(SNACKS).map(([k, o]) => `<button type="button" class="san-snack${san.snack[k] === dayKey() ? ' done' : ''}" data-snack="${k}"><img src="${o.img}" alt=""><span>${o.name}${san.snack[k] === dayKey() ? '・已獻' : ''}</span></button>`).join('')}</div>`);
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-snack]'); if (b) { closeSheet(); setTimeout(() => offer(b.dataset.snack), 200); } });
  }

  /* ----- 太子籤 ----- */
  function openQian() {
    const t = dayKey();
    if (!san.qian || san.qian.date !== t) { san.qian = { date: t, no: 1 + Math.floor(Math.random() * SAN_QIAN.length) }; save(); sfx.rattle(1); }
    const f = SAN_QIAN.find((x) => x.no === san.qian.no);
    openSheet(`太子籤第${NAMES[f.no - 1]}首・${f.title}`, `
      <div class="slip">
        <div class="slip-side"><span>太子籤</span><span class="lv">${f.level}</span></div>
        <p class="poem">${f.poem.map((l) => `<span>${l}</span>`).join('')}</p>
      </div>
      <div class="explain">
        <h3>白話解籤</h3><p>${f.gist}</p>
        <h3>今日元氣小功課</h3><p>${f.tip}</p>
      </div>
      <p class="hint">一天抽一支。籤詩是心靈參考，三太子說：衝是要衝，但記得看路。</p>`);
  }

  const ACTS = { wheel: autoSpin, snack: openSnacks, qian: openQian };
  svg.addEventListener('click', (e) => { if (e.target.closest('[data-san="deity"]')) greetGod(); });
  svg.querySelector('[data-san="deity"]').addEventListener('keydown', (e) => { if (e.key === 'Enter') greetGod(); });
  $('#sanBar').addEventListener('click', (e) => { const b = e.target.closest('button[data-san]'); if (b) ACTS[b.dataset.san](); });

  return {
    enter() {
      total = 0; omega = 0; paintSnacks(); paint();
      say(!san.spins ? '歡迎來到三太子殿！先點燭、上香。然後按住右下角的<b>風火輪</b>畫圈轉三圈，跟三太子借今天的衝勁。'
        : spunToday() ? '又來找三太子玩啦？今天的衝勁已經集好了，要不要獻個零食，或抽支太子籤？'
        : `歡迎回來！你已經集了 ${san.spins} 天衝勁。今天也來轉一下風火輪吧。`, 'god');
    },
    setFestive(on) { S('sBg').setAttribute('href', on ? festUrl : bgUrl); },
    god: '三太子', qianName: '太子籤', qianCount: SAN_QIAN.length,
    hasQianToday: () => !!san.qian && san.qian.date === dayKey(),
    setQian(no) { san.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

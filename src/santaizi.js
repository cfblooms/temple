// 三太子殿：轉風火輪集「衝勁」；獻零食（養樂多、糖果罐、奶嘴）；太子籤。
// 場景座標跟正殿一樣是 360 × 645；SVG 裡的 id 都加 s 前綴，避免跟其他殿的 SVG 撞名。
import bgUrl from './assets/san/san-bg.webp';
import festUrl from './assets/san/san-festival.webp';
import wheelUrl from './assets/san/wheel.webp';
import yogurtUrl from './assets/san/yogurt.webp';
import candyUrl from './assets/san/candy.webp';
import paciUrl from './assets/san/pacifier.webp';
import godUrl from './assets/gods/santaizi.webp';
import { wallet } from './wallet.js';

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
const NAMES = Array.from({ length: 60 }, (_, i) => { const n = i + 1, d = '一二三四五六七八九'; return n < 10 ? d[n - 1] : `${n >= 20 ? d[Math.floor(n / 10) - 1] : ''}十${n % 10 ? d[n % 10 - 1] : ''}`; }); // 第幾首（籤加量後到 24 首）
const SNACKS = {
  yogurt: { name: '乳酸飲料', img: yogurtUrl, x: 117, y: 341, w: 25, h: 41, say: '乳酸飲料擺上供桌了！三太子插上吸管：「一口乾杯！今天腸胃順、心情也順！」' },
  paci: { name: '奶嘴', img: paciUrl, x: 144, y: 352, w: 29, h: 32, say: '奶嘴擺上去了。三太子臉紅了一下：「我、我已經長大了啦……不過還是謝謝你。」小朋友平安長大，三太子會保佑。' },
  candy: { name: '糖果罐', img: candyUrl, x: 202, y: 337, w: 38, h: 46, say: '整罐糖果擺上供桌！三太子眼睛都亮了：「好多棒棒糖！今天你說什麼我都幫！」' },
};

/* ---------- 場景 ---------- */
// 參考點：三太子臉 (180,285)、供桌桌面 y≈378、拜墊中心 (184,525)
const WHEEL = [298, 566, 74]; // 風火輪：中心 x、y、大小
const BPM = 128, BEAT = 60000 / BPM, SONG = 28; // 一首 28 拍
const LO = 260, HI = 620; // 跟上節拍的轉速（度／秒）：大約兩拍轉一圈
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
  <circle transform="translate(182 380) scale(1.38) translate(-182 -380)" id="sHaloC" cx="180" cy="290" r="56" fill="url(#sHalo)" opacity=".15" style="mix-blend-mode:screen"/>
  <rect transform="translate(182 380) scale(1.38) translate(-182 -380)" class="hit" data-san="deity" role="button" tabindex="0" aria-label="向三太子問安" x="145" y="250" width="72" height="110" rx="22" fill="transparent"/>

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
  <!-- 節拍燈：每一拍亮一下 -->
  <circle id="sBeat" cx="${WHEEL[0]}" cy="${WHEEL[1]}" r="52" fill="none" stroke="#7CF3FF" stroke-width="3" opacity="0" pointer-events="none"/>
  <!-- 衝勁條 -->
  <g id="sMeter" pointer-events="none" style="display:none">
    <rect x="96" y="440" width="168" height="16" rx="8" fill="#2A0E2E" opacity=".75"/>
    <rect id="sMeterFill" x="98" y="442" width="0" height="12" rx="6" fill="#FF4FD8"/>
    <text id="sMeterT" x="180" y="432" text-anchor="middle" font-family="Huninn, sans-serif" font-size="14" fill="#FFF" stroke="#2A0E2E" stroke-width="3" paint-order="stroke">衝勁</text>
  </g>
  <!-- 電音三太子跳舞 -->
  <g id="sDance" pointer-events="none" style="display:none">
    <rect x="0" y="0" width="360" height="645" fill="#12001E" opacity=".45"/>
    <g class="san-lights">
      <path d="M40 0L120 470H10z" fill="#FF4FD8" opacity=".25"/><path d="M320 0L350 470H240z" fill="#4FE8FF" opacity=".25"/><path d="M180 0L250 470H110z" fill="#FFE24F" opacity=".18"/>
    </g>
    <g class="san-dancer"><image href="${godUrl}" x="110" y="250" width="140" height="140"/></g>
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
  // 電音節奏：一首 28 拍，每一拍看你這一拍轉得快不快，剛好就加衝勁；衝勁滿了三太子跳舞
  let rot = 0, omega = 0, grab = null, anim = 0, lastT = 0;
  let song = null; // { beat, next, acc, power, combo }
  const beatC = S('sBeat'), meter = S('sMeter');
  const paint = () => {
    rotG.setAttribute('transform', `rotate(${rot.toFixed(1)} ${WHEEL[0]} ${WHEEL[1]})`);
    const k = song ? song.power / 100 : spunToday() ? 1 : 0;
    ring.setAttribute('stroke-dasharray', `${(k * RING).toFixed(1)} ${RING.toFixed(1)}`);
    fire.setAttribute('opacity', Math.min(1, Math.abs(omega) / 700).toFixed(2));
    if (song) {
      S('sMeterFill').setAttribute('width', (164 * song.power / 100).toFixed(1));
      S('sMeterT').textContent = `衝勁 ${Math.round(song.power)}%${song.combo >= 3 ? `・連續 ${song.combo} 拍` : ''}`;
    }
  };
  const angAt = (p) => Math.atan2(p.y - WHEEL[1], p.x - WHEEL[0]) * 180 / Math.PI;
  function addTurn(d) { rot += d; if (song) song.acc += Math.abs(d); }
  function startSong() {
    if (song) return;
    song = { beat: 0, next: performance.now() + BEAT, acc: 0, power: 0, combo: 0 };
    meter.style.display = ''; paint();
    cam?.zoom(WHEEL[0] - 50, WHEEL[1] - 50, 260);
    say('電音下去！跟著<b>咚、咚</b>的節拍繞圈，大概<b>兩拍轉一圈</b>。轉太慢或太快都不算，剛剛好衝勁才會漲。', 'god');
    sfx.edm?.(0); kick();
  }
  function stopSong() { song = null; meter.style.display = 'none'; beatC.setAttribute('opacity', '0'); }
  function onBeat() {
    const sp = song.acc / (BEAT / 1000); song.acc = 0; song.beat++;
    const ok = sp >= LO && sp <= HI;
    if (ok) { song.combo++; song.power = Math.min(100, song.power + 5 + Math.min(song.combo, 4) * .5); }
    else { song.combo = 0; song.power = Math.max(0, song.power - 2); }
    sfx.edm?.(song.beat, song.combo >= 6);
    beatC.setAttribute('stroke', ok ? '#7CF3FF' : '#FF7A7A');
    beatC.setAttribute('opacity', '.95'); setTimeout(() => beatC.setAttribute('opacity', '0'), 160);
    if (song.beat % 2 === 0 || !ok) emit('text', WHEEL[0], WHEEL[1] - 64, { text: ok ? (song.combo >= 6 ? '超嗨！' : '剛好！') : sp < LO ? '快一點' : '太快了', color: ok ? '#7CF3FF' : '#FFB0B0', life: .7, vy: -40 });
    if (ok && Math.random() < .6) { const a = Math.random() * Math.PI * 2; emit('spark', WHEEL[0] + Math.cos(a) * 40, WHEEL[1] + Math.sin(a) * 40); }
    if (song.power >= 100) { stopSong(); dance(); return; }
    if (song.beat >= SONG) {
      const pct = Math.round(song.power); stopSong(); cam?.reset(900);
      say(`音樂停了，衝勁集到 ${pct}%。再來一首！手指在輪子外圈<b>穩穩地繞</b>，跟著咚咚的拍子，兩拍一圈。`, 'god');
    }
  }
  function dance() {
    const first = !spunToday();
    if (first) { san.spinDay = dayKey(); san.spins++; }
    san.dances = (san.dances || 0) + 1; save();
    sfx.chime(); sfx.buzz([15, 40, 15, 40, 20]);
    burst('spark', WHEEL[0], WHEEL[1], reduce ? 5 : 24);
    cam?.reset(500);
    const d = S('sDance'); d.style.display = '';
    let i = 0; const beats = setInterval(() => { sfx.edm?.(i, true); if (i % 2 === 0) burst('spark', 100 + Math.random() * 160, 260 + Math.random() * 120, reduce ? 2 : 8); if (++i >= 12) { clearInterval(beats); d.style.display = 'none'; } }, BEAT);
    if (first) wallet.earn(10, '電音三太子', 180, 240);
    say(`衝勁集滿了！三太子跳起電音舞：「嗨起來！今天做什麼都衝衝衝！」${first ? `福氣 +10，已經集了 ${san.spins} 天衝勁。` : '今天的衝勁已經集過了，再跳一次也很開心。'}`, 'god');
  }
  function loop(t) {
    const dt = lastT ? Math.min(.05, (t - lastT) / 1000) : .016; lastT = t;
    if (!grab) { addTurn(omega * dt); omega *= Math.exp(-dt * 1.6); }
    if (song && t >= song.next) { song.next += BEAT; onBeat(); }
    if (Math.abs(omega) > 400 && Math.random() < .4) {
      const a = Math.random() * Math.PI * 2; emit('spark', WHEEL[0] + Math.cos(a) * 38, WHEEL[1] + Math.sin(a) * 38);
    }
    paint();
    if (grab || song || Math.abs(omega) > 8) anim = requestAnimationFrame(loop);
    else { anim = 0; lastT = 0; omega = 0; paint(); }
  }
  const kick = () => { if (!anim) { lastT = 0; anim = requestAnimationFrame(loop); } };
  wheel.addEventListener('pointerdown', (e) => {
    e.preventDefault(); wheel.setPointerCapture(e.pointerId);
    const p = pt(e); grab = { a: angAt(p), t: performance.now(), moved: 0 };
    omega = 0; sfx.pop(); kick();
    cam?.zoom(WHEEL[0] - 50, WHEEL[1] - 50, 260); // 放大輪子，手指在輪子外圈畫圈就好
  });
  wheel.addEventListener('pointermove', (e) => {
    if (!grab) return;
    const p = pt(e), now = performance.now();
    if (Math.hypot(p.x - WHEEL[0], p.y - WHEEL[1]) < 8) return; // 太靠中心角度會亂跳
    const a = angAt(p); let d = a - grab.a; if (d > 180) d -= 360; if (d < -180) d += 360;
    const dt = Math.max(8, now - grab.t) / 1000;
    omega = omega * .6 + (d / dt) * .4; grab.a = a; grab.t = now; grab.moved += Math.abs(d);
    addTurn(d);
    if (!song && grab.moved > 90) startSong(); // 一開始轉就放音樂
  });
  const up = () => {
    if (!grab) return;
    const moved = grab.moved; grab = null; kick();
    if (moved < 20 && !song) { cam?.reset(300); hint(); }
  };
  wheel.addEventListener('pointerup', up);
  wheel.addEventListener('pointercancel', up);
  function hint() {
    say(spunToday() ? '今天的衝勁已經集滿了，想再聽電音、看三太子跳舞，還是可以再轉！'
      : '按住右下角的<b>風火輪</b>，手指在輪子外面<b>繞圈圈</b>，音樂就會開始。跟著節拍兩拍轉一圈，衝勁集滿三太子會跳舞。', 'god');
  }
  function autoSpin() { // 按鈕／鍵盤：輪子自己跟著節拍轉
    if (song) return;
    startSong(); omega = 420; kick();
    const keep = () => { if (song && !grab) { omega = 420; requestAnimationFrame(keep); } };
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
      stopSong(); omega = 0; paintSnacks(); paint();
      say(!san.spins ? '歡迎來到三太子殿！先點燭、上香。然後按住右下角的<b>風火輪</b>畫圈，跟著電音的節拍轉，衝勁集滿三太子會跳舞給你看！'
        : spunToday() ? '又來找三太子玩啦？今天的衝勁已經集好了，要不要獻個零食，或抽支太子籤？'
        : `歡迎回來！你已經集了 ${san.spins} 天衝勁。今天也來跟著電音轉風火輪吧。`, 'god');
    },
    leave() { stopSong(); },
    setFestive(on) { S('sBg').setAttribute('href', on ? festUrl : bgUrl); },
    god: '三太子', qianName: '太子籤', qianCount: SAN_QIAN.length,
    hasQianToday: () => !!san.qian && san.qian.date === dayKey(),
    setQian(no) { san.qian = { date: dayKey(), no }; save(); },
    openQian,
  };
}

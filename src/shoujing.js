// 青衣阿嬤收驚：照廟裡的做法——先稟報姓名和受驚的事（幫家人收驚就帶他的衣服）→ 阿嬤拿三炷香在頭頂、前胸、後背繞，
// 一邊喊名字「回來喔」；玩家要做的是跟著光圈慢慢深呼吸（按住吸氣、放開吐氣），心跳一下一下慢下來
// → 衣服蓋廟印：拿起廟印（浮在手指上方），蓋在自己的衣服（或家人的衣服）三個地方，每蓋一次回印泥沾一下
// → 燒符化水：拿符到油燈上點著，趁燒拿到水碗上放開，符灰落水變成符水；再拿毛巾沾符水擦額頭、手心、胸口
// → 米卦：把包著紅布的米杯往下一翻，掀開看米面 → 收驚符＋平安茶。
// 場景 360 × 645；SVG 裡的 id 都加 sj 前綴。
import { makeCarrier } from './carry.js';
import bgUrl from './assets/sj/bg.webp';
import grannyUrl from './assets/sj/granny.webp';
// 阿嬤收驚的三個動作圖（繞頭頂、繞前胸、鞠躬）：有圖就換成香拿在阿嬤手上，沒有就用飄著的香
const POSE_ART = import.meta.glob('./assets/sj/granny-*.webp', { eager: true, import: 'default' });
const POSE = (k) => POSE_ART[`./assets/sj/granny-${k}.webp`];
// 動作圖的框（腳底中心是原點）和香頭位置
const PW = 105, PH = 237, PX = -70, PY = -233;
const TIP = { up: [-52, -230], chest: [-62, -176], bow: [-52, -191] };
import cupUrl from './assets/sj/cup.webp';
// 蓋印、符水的道具：有圖（assets/sj/<名>.webp）就用圖，沒有先用向量畫的
const PROP_ART = import.meta.glob('./assets/sj/{seal,pad,fu,bowl,lamp,towel}.webp', { eager: true, import: 'default' });
const prop = (k, w, h, fallback) => { const u = PROP_ART[`./assets/sj/${k}.webp`]; return u ? `<image href="${u}" x="${-w / 2}" y="${-h}" width="${w}" height="${h}"/>` : fallback; };
import shirtUrl from './assets/sj/shirt.webp';
import { reduce, sleep, tween, pick, daily, yesterdayKey, onSwipe, svgPt } from './stall.js';

const WHO = [['me', '我自己'], ['kid', '小孩'], ['family', '家人'], ['pet', '毛小孩']];
const WHAT = [['scare', '被嚇到'], ['sleep', '睡不好、做惡夢'], ['stress', '壓力好大'], ['exam', '考前緊張'], ['sad', '剛經歷難過的事'], ['uneasy', '心神不寧']];
const ZONES = [
  { name: '頭頂', at: [180, 462], r: 26 }, { name: '頭頂', at: [180, 462], r: 26 },
  { name: '前胸', at: [180, 528], r: 34 }, { name: '前胸', at: [180, 528], r: 34 },
  { name: '後背', at: [180, 510], r: 64 }, { name: '後背', at: [180, 510], r: 64 },
];
const RICE = {
  flat: ['米面平平的', '心已經定下來了，今晚會好睡。'],
  dent: ['中間凹了一個小窩', '是真的被嚇到了，阿嬤已經幫你收回來，不用怕了。'],
  stand: ['有一粒米站了起來', '你身邊有貴人在照顧你，難過的時候記得開口。'],
  scatter: ['米粒有點散', '最近太累了，今天早點睡，別再滑手機了。'],
};
const TIPS = [
  '睡前把手機放遠一點，關燈後慢慢吸氣四秒、吐氣六秒，做五次。',
  '回家喝一杯溫溫的平安茶（溫開水也可以），跟自己說：「我很安全，我回來了。」',
  '洗個熱水澡，從頭沖到腳，想像今天的驚嚇都被沖走。',
  '寫下今天讓你害怕的事，寫完把紙摺起來，明天再看，通常就沒那麼可怕了。',
];
const INHALE = 3200, EXHALE = 4200;

const AV = { x: 180, base: 604, w: 150, h: 162 }; // 跪著的你
const SHIRT_REST = [302, 610], SHIRT_AT = [104, 352];
// 桌上的道具（底部中心）：印泥＋廟印、水碗、油燈、符、毛巾
const PAD = [252, 378], BOWL = [180, 378], LAMP = [234, 372], FU_REST = [288, 382], TOWEL_REST = [240, 386];
const FLAME = [LAMP[0], LAMP[1] - 24], WATER = [BOWL[0], BOWL[1] - 15];
const FU_H = 46;
const CUP = [180, 364];
// 阿嬤：平常站在櫃台後面（下半身被櫃台擋住），收驚時走出來站到你右手邊
const GW = 92, GH = 221;
const G_HOME = [180, 462, 1], G_SIDE = [272, 608, .9];

function fuSVG() {
  return `<rect x="-10" y="${-FU_H}" width="20" height="${FU_H}" rx="1" fill="#F6D24A" stroke="#D9A92E" stroke-width=".8"/>
    <path d="M0 ${-FU_H + 5}v${FU_H - 10}M-5 ${-FU_H + 10}h10M-6 ${-FU_H + 18}q6 4 12 0M-4 ${-FU_H + 26}l8 6M4 ${-FU_H + 26}l-8 6M-5 -9h10" stroke="#C0282A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <circle cx="0" cy="${-FU_H + 4}" r="2" fill="none" stroke="#C0282A" stroke-width="1.2"/>`;
}

const svgOf = () => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="青衣阿嬤收驚攤" class="stall-svg sj-svg">
  <defs>
    <radialGradient id="sjShadow"><stop offset="0" stop-color="#2A0E06" stop-opacity=".5"/><stop offset="1" stop-color="#2A0E06" stop-opacity="0"/></radialGradient>
    <radialGradient id="sjCalm"><stop offset="0" stop-color="#BFE6FF" stop-opacity="0"/><stop offset=".75" stop-color="#BFE6FF" stop-opacity=".18"/><stop offset="1" stop-color="#E8F6FF" stop-opacity=".55"/></radialGradient>
  </defs>
  <image href="${bgUrl}" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>
  <clipPath id="sjGClip" clipPathUnits="userSpaceOnUse"><rect x="-200" y="-400" width="400" height="${400 - (G_HOME[1] - 350)}"/></clipPath>
  <g id="sjGrannyG" transform="translate(${G_HOME[0]} ${G_HOME[1]})"><g class="sj-granny-idle"><image id="sjGranny" href="${grannyUrl}" x="${-GW / 2}" y="${-GH}" width="${GW}" height="${GH}"/></g></g>
  <text id="sjGrannyTag" x="180" y="${G_HOME[1] - GH - 6}" text-anchor="middle" class="xr-tag" style="fill:#FFF4E0">青衣阿嬤</text>
  <!-- 米卦杯 -->
  <g id="sjCup" class="stall-prop" data-sj="cup" role="button" tabindex="0" aria-label="米卦杯，往下滑翻過來" transform="translate(${CUP[0]} ${CUP[1]})" style="display:none">
    <ellipse cx="0" cy="4" rx="26" ry="5" fill="url(#sjShadow)"/>
    <g id="sjCupBody">
      <image href="${cupUrl}" x="-26" y="-55" width="52" height="57"/>
    </g>
    <g id="sjRice" style="display:none">
      <ellipse cx="0" cy="-3" rx="24" ry="8" fill="#F7EBD2" stroke="#D9C49A" stroke-width="1.2"/>
      <g id="sjRiceMark"></g>
    </g>
  </g>
  <path id="sjSwipeHint" d="M${CUP[0] + 40} ${CUP[1] - 46}v28l-6 -6M${CUP[0] + 40} ${CUP[1] - 18}l6 -6" stroke="#FFE08A" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0"/>
  <!-- 家人的衣服 -->
  <g id="sjShirt" class="stall-prop" data-sj="shirt" role="button" tabindex="0" aria-label="家人的衣服，放到桌上" transform="translate(${SHIRT_REST[0]} ${SHIRT_REST[1]})" style="display:none">
    <ellipse cx="0" cy="2" rx="26" ry="5" fill="url(#sjShadow)"/>
    <image href="${shirtUrl}" x="-25" y="-55" width="50" height="57"/>
  </g>
  <rect id="sjShirtRing" x="${SHIRT_AT[0] - 32}" y="${SHIRT_AT[1] - 60}" width="64" height="66" rx="8" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0"/>
  <!-- 你 -->
  <ellipse cx="${AV.x}" cy="${AV.base}" rx="60" ry="9" fill="url(#sjShadow)"/>
  <image id="sjMe" x="${AV.x - AV.w / 2}" y="${AV.base - AV.h}" width="${AV.w}" height="${AV.h}"/>
  <g id="sjMarks" pointer-events="none"></g>
  <!-- 印泥、水碗、油燈 -->
  <g id="sjPad" transform="translate(${PAD[0]} ${PAD[1]})" style="display:none" pointer-events="none">
    <ellipse cx="0" cy="1" rx="18" ry="4" fill="url(#sjShadow)"/>
    ${prop('pad', 36, 16, '<path d="M-15 -2v-6h30v6a15 4 0 0 1 -30 0z" fill="#B8893F"/><ellipse cx="0" cy="-8" rx="15" ry="4.2" fill="#D4A95A"/><ellipse cx="0" cy="-8.4" rx="11.5" ry="3" fill="#C0282A"/>')}
  </g>
  <g id="sjBowl" transform="translate(${BOWL[0]} ${BOWL[1]})" style="display:none" pointer-events="none">
    <ellipse cx="0" cy="1" rx="26" ry="5" fill="url(#sjShadow)"/>
    ${prop('bowl', 52, 26, '<path d="M-24 -17h48q-3 17 -24 17q-21 0 -24 -17z" fill="#FBF7EE" stroke="#CDBFA6" stroke-width="1"/><path d="M-21 -10q21 6 42 0" stroke="#4F7FB8" stroke-width="1.4" fill="none" opacity=".7"/><rect x="-8" y="-2" width="16" height="3" rx="1" fill="#E8DFCC"/>')}
    <ellipse id="sjWater" cx="0" cy="-15" rx="21" ry="4.2" fill="#BFE0F2" opacity=".92"/>
    <ellipse id="sjSwirl" cx="0" cy="-15" rx="6" ry="1.4" fill="none" stroke="#FFF4C8" stroke-width="1.2" opacity="0"/>
  </g>
  <g id="sjLamp" transform="translate(${LAMP[0]} ${LAMP[1]})" style="display:none" pointer-events="none">
    <ellipse cx="0" cy="1" rx="14" ry="3.4" fill="url(#sjShadow)"/>
    ${prop('lamp', 30, 34, '<path d="M-6 0h12l-2 -8h-8z" fill="#B8893F"/><path d="M-13 -12q13 8 26 0z" fill="#D4A95A" stroke="#9C6F2E" stroke-width=".8"/><ellipse cx="0" cy="-12" rx="13" ry="2.6" fill="#E9C26E"/><path d="M0 -12v-5" stroke="#5A3A20" stroke-width="1.4"/>')}
    <g class="sj-flame"><path d="M0 -36q7 9 0 18q-7 -9 0 -18z" fill="#FFB347"/><path d="M0 -29q3 5 0 10q-3 -5 0 -10z" fill="#FFF3B0"/></g>
  </g>
  <circle id="sjSpot" class="sj-spot" r="11" fill="#FFE08A" fill-opacity=".18" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 3" opacity="0" pointer-events="none"/>
  <text id="sjSpotTag" class="sj-spot-tag" text-anchor="middle" opacity="0" pointer-events="none"></text>
  <!-- 廟印 -->
  <g id="sjSeal" class="stall-prop" data-sj="seal" role="button" tabindex="0" aria-label="廟印，拿起來蓋在衣服上" transform="translate(${PAD[0]} ${PAD[1] - 8})" style="display:none">
    <g id="sjSealBody">${prop('seal', 26, 44, '<rect x="-12" y="-13" width="24" height="13" rx="2" fill="#A8743F" stroke="#7A4E25" stroke-width=".8"/><rect x="-12" y="-2.4" width="24" height="2.4" fill="#C0282A"/><path d="M-5 -13l-2 -20h14l-2 20z" fill="#8A5A2B"/><circle cx="0" cy="-36" r="7" fill="#8A5A2B"/><circle cx="-2" cy="-38" r="2" fill="#B98A57"/><text x="0" y="-4" text-anchor="middle" font-size="8" font-weight="900" fill="#FFE9B8">印</text>')}</g>
  </g>
  <!-- 符 -->
  <g id="sjFu" class="stall-prop" data-sj="fu" role="button" tabindex="0" aria-label="收驚符，拿到油燈上點著" transform="translate(${FU_REST[0]} ${FU_REST[1]})" style="display:none">
    <g transform="rotate(-8)">${prop('fu', 20, FU_H, fuSVG())}</g>
  </g>
  <g id="sjFuB" class="stall-prop" data-sj="fub" role="button" tabindex="0" aria-label="燒著的符，拿到水碗上" transform="translate(${FLAME[0]} ${FLAME[1]})" style="display:none">
    <clipPath id="sjFuClip" clipPathUnits="userSpaceOnUse"><rect id="sjFuClipR" x="-20" y="${-FU_H - 4}" width="40" height="${FU_H + 4}"/></clipPath>
    <g clip-path="url(#sjFuClip)">${prop('fu', 20, FU_H, fuSVG())}</g>
    <path id="sjChar" d="M-10 0h20" stroke="#3A1E10" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
    <g id="sjFire"><g class="sj-flame"><path d="M-8 2q-2 -12 8 -20q10 8 8 20z" fill="#FF8A3A" opacity=".9"/><path d="M-4 2q0 -8 4 -12q4 4 4 12z" fill="#FFE27A"/></g></g>
  </g>
  <!-- 毛巾 -->
  <g id="sjTowel" class="stall-prop" data-sj="towel" role="button" tabindex="0" aria-label="毛巾，沾符水擦身體" transform="translate(${TOWEL_REST[0]} ${TOWEL_REST[1]})" style="display:none">
    <ellipse cx="0" cy="1" rx="17" ry="3.6" fill="url(#sjShadow)"/>
    <g id="sjTowelBody">${prop('towel', 34, 18, '<rect x="-16" y="-15" width="32" height="15" rx="4" fill="#FFFDF6" stroke="#D8CFC0" stroke-width="1"/><path d="M-16 -8h32" stroke="#E7DDCB" stroke-width="1"/><path d="M-12 -15v15M12 -15v15" stroke="#9FC6E4" stroke-width="1.6" opacity=".8"/>')}</g>
    <ellipse id="sjTowelWet" cx="0" cy="-8" rx="13" ry="6" fill="#E9D79A" opacity="0"/>
  </g>
  <!-- 呼吸光圈 -->
  <g id="sjBreath" opacity="0" pointer-events="none">
    <circle id="sjRingMax" cx="180" cy="520" r="96" fill="none" stroke="#E8F6FF" stroke-width="1.6" stroke-dasharray="3 5"/>
    <circle id="sjRing" cx="180" cy="520" r="40" fill="url(#sjCalm)" stroke="#E8F6FF" stroke-width="3"/>
    <text id="sjCue" x="180" y="420" text-anchor="middle" class="sj-cue">按住・吸氣</text>
  </g>
  <!-- 三炷香 -->
  <g id="sjInc" style="display:none" pointer-events="none">
    <path d="M-4 0l-3 -40M0 0v-42M4 0l3 -40" stroke="#B0603A" stroke-width="2"/>
    <circle cx="-7" cy="-40" r="2.4" fill="#FF7A3A"/><circle cx="0" cy="-42" r="2.4" fill="#FF7A3A"/><circle cx="7" cy="-40" r="2.4" fill="#FF7A3A"/>
    <rect x="-5" y="0" width="10" height="12" rx="3" fill="#F6CFAE"/>
  </g>
  <g id="sjHeartG" opacity="0">
    <rect x="262" y="236" width="86" height="30" rx="15" fill="#1A0A08" opacity=".45"/>
    <path id="sjHeart" d="M280 247c-3-4-9-2-9 2 0 4 9 9 9 9s9-5 9-9c0-4-6-6-9-2z" fill="#FF7F8A"/>
    <text id="sjBpm" x="296" y="256" class="sj-bpm">110</text>
  </g>
  <rect id="sjTap" x="0" y="150" width="360" height="495" fill="transparent" style="display:none"/>
</svg>`;

export function initShoujing(api) {
  const { $, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, addFish, me } = api;
  const host = $('#sjHost');
  host.innerHTML = svgOf();
  const svg = host.querySelector('svg');
  const S = (id) => svg.querySelector('#' + id);
  const sj = state.sj || (state.sj = { last: '', streak: 0, total: 0 });
  let phase = 'idle', draft = null, run = 0;

  function paintMe() {
    const c = me(); const w = AV.w * c.scale, h = AV.h * c.scale;
    const el = S('sjMe'); el.setAttribute('href', c.kneel);
    el.setAttribute('width', w); el.setAttribute('height', h); el.setAttribute('x', AV.x - w / 2); el.setAttribute('y', AV.base - h);
  }

  /* ----- 1. 稟報 ----- */
  function openStart() {
    if (phase !== 'idle' && phase !== 'done') { say('收驚還沒做完，照阿嬤說的下一步。'); return; }
    const body = openSheet('收驚：跟阿嬤說說', `
      <p>阿嬤會喊名字，把被嚇走的魂收回來。幫家人收驚的話，帶他的衣服來就可以。</p>
      <div class="field"><span>幫誰收驚</span><div class="chips" id="sjWho">${WHO.map(([id, n], i) => `<button type="button" class="chip" data-w="${id}" aria-pressed="${i === 0}">${n}</button>`).join('')}</div></div>
      <div class="field"><span>最近怎麼了</span><div class="chips" id="sjWhat">${WHAT.map(([id, n], i) => `<button type="button" class="chip" data-t="${id}" aria-pressed="${i === 0}">${n}</button>`).join('')}</div></div>
      <input id="sjName" class="yue-wish" maxlength="5" placeholder="名字或小名（阿嬤會喊）" value="${esc(state.name !== '香客' ? state.name : '')}">
      <div class="row"><button class="btn" id="sjGo">請阿嬤收驚</button></div>`);
    let who = 'me', what = 'scare';
    body.addEventListener('click', (e) => {
      const w = e.target.closest('[data-w]'), t = e.target.closest('[data-t]');
      if (w) { who = w.dataset.w; body.querySelectorAll('[data-w]').forEach((x) => x.setAttribute('aria-pressed', String(x === w))); }
      if (t) { what = t.dataset.t; body.querySelectorAll('[data-t]').forEach((x) => x.setAttribute('aria-pressed', String(x === t))); }
    });
    body.querySelector('#sjGo').addEventListener('click', () => {
      const name = body.querySelector('#sjName').value.trim() || (who === 'me' ? '乖孫' : who === 'pet' ? '毛寶貝' : '寶貝');
      draft = { who, what, name }; closeSheet();
      if (who === 'me') startBreath();
      else {
        phase = 'shirt'; S('sjShirt').style.display = ''; shirt.home();
        say(`幫${WHO.find((x) => x[0] === who)[1]}收驚，要用他的衣服代替本人。按住右下角的<b>衣服</b>，攤到阿嬤的桌上。`);
      }
    });
  }
  const shirt = makeCarrier({
    svg, el: S('sjShirt'), sfx, cam, ring: S('sjShirtRing'), lift: 64, radius: 34,
    rest: () => SHIRT_REST, target: () => SHIRT_AT, zoom: () => [170, 440, 280],
    onTap: () => say('按住<b>衣服</b>拿起來，放到阿嬤前面的桌上。'),
    onDrop() { sfx.pop(); cam?.reset(200); startBreath(); },
  });

  /* ----- 阿嬤的動作 ----- */
  const GG = S('sjGrannyG'), GI = S('sjGranny');
  let gPos = G_HOME;
  function grannyAt([x, y, sc], rot = 0, dy = 0, dx = 0) { GG.setAttribute('transform', `translate(${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc})`); }
  const hasPoses = !!(POSE('up') && POSE('chest') && POSE('bow'));
  let pose = null;
  function setPose(k) {
    if (!hasPoses || pose === k) return;
    pose = k;
    if (k) { GI.setAttribute('href', POSE(k)); GI.setAttribute('x', PX); GI.setAttribute('y', PY); GI.setAttribute('width', PW); GI.setAttribute('height', PH); }
    else { GI.setAttribute('href', grannyUrl); GI.setAttribute('x', -GW / 2); GI.setAttribute('y', -GH); GI.setAttribute('width', GW); GI.setAttribute('height', GH); }
  }
  // 香頭在畫面上的位置（跟著阿嬤的位置和大小）
  function tipAt(dx = 0, dy = 0) { const [tx, ty] = TIP[pose] || TIP.up; const [x, y, sc] = gPos; return [x + dx + tx * sc, y + dy + ty * sc]; }
  function clipGranny(on) { if (on) GI.setAttribute('clip-path', 'url(#sjGClip)'); else GI.removeAttribute('clip-path'); }
  async function grannyMove(to) {
    if (gPos === to) return;
    const r = run;
    await tween(reduce ? 60 : 260, (k) => { GG.style.opacity = String(1 - k); grannyAt(gPos, 0, -k * 12); });
    if (r !== run) { GG.style.opacity = ''; return; }
    gPos = to; clipGranny(to === G_HOME); setPose(to === G_HOME ? null : 'up'); S('sjGrannyTag').style.display = to === G_HOME ? '' : 'none';
    sfx.knock();
    await tween(reduce ? 60 : 320, (k) => { GG.style.opacity = String(k); grannyAt(to, 0, -Math.sin(k * Math.PI) * 14); });
    GG.style.opacity = '';
  }
  async function grannyBow(deg = -16, ms = 700) {
    await tween(ms, (k) => grannyAt(gPos, Math.sin(k * Math.PI) * deg, Math.sin(k * Math.PI) * 6));
  }
  function grannyHome() { setPose(null); gPos = G_HOME; clipGranny(true); GG.style.opacity = ''; S('sjGrannyTag').style.display = ''; grannyAt(G_HOME); }

  /* ----- 2. 阿嬤持香，你深呼吸 ----- */
  let breath = 0, bpm = 110, holdAt = 0, exhaling = false;
  const forOther = () => draft && draft.who !== 'me';
  async function startBreath() {
    const r = ++run; phase = 'walk';
    say('阿嬤拿起三炷香，從櫃台後面走出來，站到你旁邊……');
    await grannyMove(G_SIDE); if (r !== run) return;
    await grannyBow(-10, 500); if (r !== run) return;
    phase = 'breath'; breath = 0; bpm = 110 - (forOther() ? 0 : 0);
    S('sjBreath').setAttribute('opacity', '1'); S('sjHeartG').setAttribute('opacity', '1'); S('sjBpm').textContent = bpm;
    if (!hasPoses) { S('sjInc').style.display = ''; placeInc(244, 470, 0); }
    S('sjTap').style.display = '';
    cam?.zoom(180, 470, 300);
    say(`阿嬤點起三炷香：「<b>${esc(draft.name)}</b>，阿嬤幫你收驚喔。」<br>${forOther() ? '你幫他深呼吸：' : ''}<b>按住畫面吸氣</b>，光圈變大；<b>放開吐氣</b>，慢慢的就好。`);
    heartLoop(r);
  }
  function placeInc(x, y, rot) { S('sjInc').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`); }
  function heartLoop(r) {
    let t0 = performance.now();
    const step = (now) => {
      if (r !== run || phase !== 'breath') return;
      const per = 60000 / bpm, k = ((now - t0) % per) / per;
      S('sjHeart').setAttribute('transform', `translate(280 251) scale(${(1 + (k < .15 ? (.15 - k) * 1.6 : 0)).toFixed(3)}) translate(-280 -251)`);
      if (!holdAt && !exhaling) S('sjRing').setAttribute('r', (40 + Math.sin(now / 500) * 2).toFixed(1));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function inhale() {
    if (phase !== 'breath' || exhaling || holdAt) return;
    holdAt = performance.now(); const r = run;
    S('sjCue').textContent = '吸～'; sfx.bowl();
    const step = (now) => {
      if (!holdAt || r !== run) return;
      const k = Math.min(1, (now - holdAt) / INHALE);
      S('sjRing').setAttribute('r', (40 + 56 * k).toFixed(1));
      grannyAt(gPos, -2 * k, -4 * k);
      if (k >= 1) { S('sjCue').textContent = '可以放開，吐氣'; S('sjRingMax').setAttribute('stroke', '#FFE08A'); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  async function exhale() {
    if (!holdAt) return;
    const held = performance.now() - holdAt; holdAt = 0;
    S('sjRingMax').setAttribute('stroke', '#E8F6FF');
    if (held < INHALE * .6) { S('sjCue').textContent = '按住・吸氣'; S('sjRing').setAttribute('r', '40'); say('再慢一點，吸久一點點，等光圈碰到外面那一圈再放開。'); return; }
    exhaling = true; const r = run;
    const z = ZONES[breath];
    S('sjCue').textContent = '吐～';
    // 阿嬤拿香繞
    const r0 = +S('sjRing').getAttribute('r');
    const lines = [`${esc(draft.name)}，回來喔～`, '三魂七魄，回來喔～', '不驚不驚，阿嬤在這裡', '嚇到的，通通收回來', `${esc(draft.name)}，好好吃飯好好睡`, '平平安安，回來喔～'];
    say(`阿嬤拿香在你的<b>${z.name}</b>繞圈：「${lines[breath]}」`, 'temple');
    await tween(EXHALE, (k, raw) => {
      if (r !== run) return;
      S('sjRing').setAttribute('r', (r0 - (r0 - 40) * k).toFixed(1));
      const a = raw * Math.PI * 2 * 2 - Math.PI / 2;
      const x = z.at[0] + Math.cos(a) * z.r, y = z.at[1] + Math.sin(a) * z.r * .55 - 30;
      // 阿嬤跟著香繞圈搖身體，繞頭頂時往前探、繞後背時彎得更低
      const lean = z.name === '頭頂' ? -6 : z.name === '前胸' ? -10 : -16;
      if (hasPoses) {
        // 香拿在阿嬤手上：整個人輕輕畫小圈，香頭冒煙
        setPose(z.name === '頭頂' ? 'up' : 'chest');
        const dx = Math.cos(a) * 6, dy = Math.sin(a) * 3;
        grannyAt(gPos, (lean / 2) * Math.min(1, raw * 4, (1 - raw) * 4), dy, dx);
        if (Math.random() < .35) { const [sx, sy] = tipAt(dx, dy); emit('smoke', sx, sy, { color: '#F4F1EA', alpha: .45 }); }
        return;
      }
      placeInc(x, y, Math.cos(a) * 12);
      grannyAt(gPos, lean * Math.min(1, raw * 4, (1 - raw) * 4) + Math.sin(a) * 4, Math.abs(Math.sin(a)) * 3);
      if (Math.random() < .35) emit('smoke', x, y - 42, { color: '#F4F1EA', alpha: .45 });
    }, (k) => k);
    if (r !== run) return;
    bpm = Math.max(68, bpm - 7); S('sjBpm').textContent = bpm;
    sfx.buzz([8]);
    emit('text', 300, 230, { text: `心跳 ${bpm}`, color: '#BFE6FF', size: 12, life: 1.2 });
    breath++; exhaling = false; S('sjCue').textContent = '按住・吸氣';
    if (breath < ZONES.length) return;
    finishBreath();
  }
  async function finishBreath() {
    phase = 'bowing'; S('sjTap').style.display = 'none'; S('sjBreath').setAttribute('opacity', '0');
    S('sjInc').style.display = 'none';
    burst('spark', 180, 500, reduce ? 3 : 14); sfx.chime();
    const r = run;
    say('阿嬤對著你深深一鞠躬：「好了好了，收回來了。」');
    setPose('bow');
    await grannyBow(hasPoses ? -8 : -22, 900); if (r !== run) return;
    await grannyMove(G_HOME); if (r !== run) return;
    await sleep(200); if (r !== run) return;
    startSeal();
  }

  /* ----- 3. 衣服蓋廟印 ----- */
  // 位置用跪姿圖的比例算（圖 210×440，等比塞進 AV 的框，寬約高的 0.48）
  function avatarPt(fx, fy) { const h = AV.h * me().scale, w = h * .48; return [AV.x + (fx - .5) * w, AV.base - h + fy * h]; }
  const shirtPt = (dx, dy) => [SHIRT_AT[0] + dx, SHIRT_AT[1] + dy];
  const sealSpots = () => forOther()
    ? [['領口', shirtPt(0, -36)], ['左襟', shirtPt(-12, -18)], ['右襟', shirtPt(12, -18)]]
    : [['左肩', avatarPt(.22, .43)], ['右肩', avatarPt(.78, .43)], ['衣襬', avatarPt(.5, .69)]];
  const wipeSpots = () => forOther()
    ? [['領口', shirtPt(0, -34)], ['胸前', shirtPt(0, -18)], ['袖口', shirtPt(-17, -8)]]
    : [['額頭', avatarPt(.5, .16)], ['手心', avatarPt(.5, .5)], ['胸口', avatarPt(.5, .66)]];
  const workZoom = () => forOther() ? [176, 350, 200] : [190, 470, 220];
  let spots = [], spotI = 0, stamping = false;
  function showSpot(r = 11) {
    const sp = spots[spotI]; const on = !!sp;
    S('sjSpot').setAttribute('opacity', on ? '1' : '0'); S('sjSpotTag').setAttribute('opacity', on ? '1' : '0');
    if (!on) return;
    const [x, y] = sp[1]; const rr = forOther() ? r * .8 : r;
    S('sjSpot').setAttribute('cx', x); S('sjSpot').setAttribute('cy', y); S('sjSpot').setAttribute('r', rr);
    const tg = S('sjSpotTag'); tg.textContent = sp[0];
    const right = x > 180 || forOther();
    tg.setAttribute('x', x + (right ? rr + 16 : -rr - 16)); tg.setAttribute('y', y + 4);
  }
  function addMark([x, y], i) {
    const sc = forOther() ? .7 : .9, rot = [-8, 6, -3][i % 3];
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = `<g class="sj-mark"><rect x="-8" y="-8" width="16" height="16" rx="2" fill="#C0282A" fill-opacity=".08" stroke="#C0282A" stroke-width="1.6"/><text x="0" y="3.8" text-anchor="middle" font-size="10.5" font-weight="900" fill="#C0282A">安</text></g>`;
    g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${sc})`);
    g.setAttribute('opacity', '.88');
    S('sjMarks').appendChild(g);
  }
  const seal = makeCarrier({
    svg, el: S('sjSeal'), sfx, cam, lift: 64, radius: 16,
    rest: () => [PAD[0], PAD[1] - 8], target: () => (spots[spotI] || spots[0])[1], zoom: workZoom,
    onTap: () => say(`按住<b>廟印</b>拿起來，它會浮在手指上面，對準發光的<b>${spots[spotI]?.[0] || ''}</b>放開。`),
    async onDrop() {
      if (phase !== 'seal' || stamping) return;
      stamping = true;
      const r = run, i = spotI, at = spots[i][1];
      await tween(reduce ? 60 : 140, (k) => S('sjSealBody').setAttribute('transform', `translate(0 ${(k * 4).toFixed(1)}) scale(${(1 + k * .06).toFixed(3)} ${(1 - k * .1).toFixed(3)})`));
      sfx.knock(); sfx.buzz([10]); addMark(at, i);
      await tween(reduce ? 60 : 220, (k) => S('sjSealBody').setAttribute('transform', `translate(0 ${(4 - k * 4).toFixed(1)}) scale(${(1.06 - k * .06).toFixed(3)} ${(.9 + k * .1).toFixed(3)})`));
      S('sjSealBody').setAttribute('transform', ''); stamping = false;
      if (r !== run) return;
      emit('text', at[0], at[1] - 14, { text: '安', color: '#FFB0A8', size: 12, life: 1 });
      spotI++;
      if (spotI < spots.length) {
        showSpot(); seal.back();
        say(`<b>${spots[i][0]}</b>蓋好了。廟印回到印泥上沾一下，再蓋<b>${spots[spotI][0]}</b>。`);
        return;
      }
      showSpot(); seal.back(); sfx.chime(); burst('spark', at[0], at[1], reduce ? 2 : 8);
      say(forOther() ? '三個印都蓋好了。阿嬤：「回去讓他穿上這件衣服睡一晚，神明幫他顧著。」' : '三個印都蓋好了。阿嬤：「有廟裡的印在身上，神明幫你顧著，不怕了。」');
      await sleep(1500); if (r !== run) return;
      startFu();
    },
  });
  function startSeal() {
    phase = 'seal'; spots = sealSpots(); spotI = 0; showSpot(); S('sjHeartG').setAttribute('opacity', '0');
    S('sjPad').style.display = ''; S('sjSeal').style.display = ''; seal.home();
    cam?.zoom(...workZoom());
    say(`阿嬤從抽屜拿出<b>廟印</b>和印泥：「${forOther() ? '衣服' : '你的衣服'}蓋個廟裡的印，神明的保佑就跟著回家。」<br>按住廟印拿起來，蓋在發光的<b>${spots[0][0]}</b>。`);
  }

  /* ----- 4. 燒符化水、符水擦身 ----- */
  let burn = 0, burnRun = 0;
  function setBurn(b) {
    burn = Math.min(1, b); const y = -FU_H * burn;
    S('sjFuClipR').setAttribute('height', ((FU_H + 4) * (1 - burn)).toFixed(1));
    S('sjChar').setAttribute('transform', `translate(0 ${y.toFixed(1)})`); S('sjFire').setAttribute('transform', `translate(0 ${y.toFixed(1)}) scale(${(1 - burn * .5).toFixed(2)})`);
    S('sjChar').setAttribute('opacity', burn >= 1 ? '0' : '.85');
  }
  function burnLoop() {
    const r = ++burnRun; let last = performance.now();
    const step = (now) => {
      if (r !== burnRun || phase !== 'fuBowl') return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      setBurn(Math.min(.6, burn + dt * .06)); // 慢慢燒，最多燒到六成等你拿到碗上
      const [x, y] = fuB.at();
      if (Math.random() < .25) emit('smoke', x, y - FU_H * burn - 8, { color: '#EDE6DA', alpha: .4 });
      if (Math.random() < .06) emit('spark', x, y - FU_H * burn, {});
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const fu = makeCarrier({
    svg, el: S('sjFu'), sfx, cam, lift: 64, radius: 18,
    rest: () => FU_REST, target: () => FLAME, zoom: () => [208, 380, 170],
    onTap: () => say('按住<b>符</b>拿起來，它會浮在手指上面，拿到<b>油燈的火</b>上點著。'),
    onDrop() {
      if (phase !== 'fuLight') return;
      phase = 'fuBowl'; S('sjFu').style.display = 'none';
      setBurn(0); S('sjFuB').style.display = ''; fuB.home();
      sfx.pop(); burst('spark', FLAME[0], FLAME[1], reduce ? 2 : 6);
      burnLoop();
      say('符點著了，火慢慢往上燒。趁還在燒，按住它拿到<b>水碗</b>上面放開。');
    },
  });
  const fuB = makeCarrier({
    svg, el: S('sjFuB'), sfx, cam, lift: 64, radius: 22,
    rest: () => FLAME, target: () => [WATER[0], WATER[1] - 6], zoom: () => [200, 380, 170],
    onTap: () => say('按住燒著的符，拿到<b>水碗</b>上面放開，讓符灰落進水裡。'),
    async onDrop() {
      if (phase !== 'fuBowl') return;
      phase = 'ash'; burnRun++; const r = run;
      const b0 = burn;
      await tween(reduce ? 120 : 1300, (k) => {
        setBurn(b0 + (1 - b0) * k);
        if (Math.random() < .45) emit('drop', WATER[0] + (Math.random() - .5) * 10, WATER[1] - 10 - FU_H * burn * .3, { color: '#6B625A' });
        if (Math.random() < .2) emit('smoke', WATER[0], WATER[1] - 16 - FU_H * burn, { color: '#EDE6DA', alpha: .4 });
      }, (k) => k);
      if (r !== run) return;
      S('sjFuB').style.display = 'none';
      sfx.bowl();
      await tween(reduce ? 120 : 1400, (k) => {
        S('sjWater').setAttribute('fill', mix('#BFE0F2', '#EBD58E', k));
        S('sjSwirl').setAttribute('opacity', String(Math.sin(k * Math.PI) * .9));
        S('sjSwirl').setAttribute('rx', (6 + k * 12).toFixed(1));
      });
      if (r !== run) return;
      burst('spark', WATER[0], WATER[1], reduce ? 2 : 8);
      say('符灰落進水裡，化成淡淡金色的<b>符水</b>。阿嬤：「來，用符水擦一擦，驚就散了。」');
      await sleep(1600); if (r !== run) return;
      startWipe();
    },
  });
  function mix(a, b, k) { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
  function startFu() {
    phase = 'fuLight'; spots = []; showSpot();
    S('sjSeal').style.display = 'none'; S('sjPad').style.display = 'none';
    S('sjBowl').style.display = ''; S('sjLamp').style.display = ''; S('sjFu').style.display = ''; fu.home();
    S('sjWater').setAttribute('fill', '#BFE0F2'); S('sjSwirl').setAttribute('opacity', '0');
    cam?.zoom(208, 380, 200);
    say('阿嬤端來一碗清水，點起小油燈，把一張<b>收驚符</b>放在桌上：「符燒進水裡，變成符水。」<br>按住符拿起來，拿到<b>油燈的火</b>上點著。');
  }

  // 毛巾：按住拿起來，毛巾浮在手指上方，在發光的地方來回擦；放開就回碗邊再沾一次符水
  const WIPE_NEED = 150, TOWEL_LIFT = 62;
  let wipe = null, rubbed = 0;
  const towelEl = S('sjTowel');
  function placeTowel(x, y, s = 1) { towelEl.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})`); }
  function startWipe() {
    phase = 'wipe'; spots = wipeSpots(); spotI = 0; rubbed = 0; showSpot(16);
    S('sjLamp').style.display = 'none';
    towelEl.style.display = ''; placeTowel(...TOWEL_REST); S('sjTowelWet').setAttribute('opacity', '0');
    cam?.zoom(...workZoom());
    say(`按住<b>毛巾</b>拿起來，它會浮在手指上面，沾了符水，在發光的<b>${spots[0][0]}</b>上輕輕來回擦一擦。`);
  }
  towelEl.addEventListener('pointerdown', (e) => {
    if (phase !== 'wipe') return;
    e.preventDefault(); towelEl.setPointerCapture(e.pointerId);
    const p = svgPt(svg, e); wipe = { last: null };
    towelEl.classList.add('held'); sfx.pop();
    S('sjTowelWet').setAttribute('opacity', '.55');
    for (let i = 0; i < (reduce ? 1 : 4); i++) emit('drop', BOWL[0] + (Math.random() - .5) * 20, BOWL[1] - 18, { color: '#EBD58E' });
    moveTowel(p);
  });
  function moveTowel(p) {
    const x = Math.max(20, Math.min(340, p.x)), y = Math.max(60, Math.min(620, p.y - TOWEL_LIFT));
    placeTowel(x, y, 1.05);
    const sp = spots[spotI]; if (!sp) return;
    const near = Math.hypot(x - sp[1][0], y + 8 - sp[1][1]) < (forOther() ? 20 : 26);
    if (wipe.last && near) {
      const d = Math.hypot(x - wipe.last[0], y - wipe.last[1]);
      rubbed += Math.min(d, 24);
      if (Math.random() < .3) emit('drop', x + (Math.random() - .5) * 16, y - 4, { color: '#F3E4A8' });
      S('sjSpot').setAttribute('fill-opacity', (.18 + .5 * Math.min(1, rubbed / WIPE_NEED)).toFixed(2));
      if (rubbed >= WIPE_NEED) { spotDone(); if (!wipe) return; }
    }
    wipe.last = [x, y];
  }
  towelEl.addEventListener('pointermove', (e) => { if (wipe && phase === 'wipe') moveTowel(svgPt(svg, e)); });
  const towelUp = () => {
    if (!wipe) return;
    wipe = null; towelEl.classList.remove('held');
    if (phase === 'wipe') { placeTowel(...TOWEL_REST); S('sjTowelWet').setAttribute('opacity', '0'); }
  };
  towelEl.addEventListener('pointerup', towelUp); towelEl.addEventListener('pointercancel', towelUp);
  towelEl.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && phase === 'wipe') { e.preventDefault(); rubbed = WIPE_NEED; spotDone(); } });
  async function spotDone() {
    const sp = spots[spotI]; rubbed = 0; S('sjSpot').setAttribute('fill-opacity', '.18');
    sfx.chime(); sfx.buzz([8]); burst('spark', sp[1][0], sp[1][1], reduce ? 2 : 7);
    emit('text', sp[1][0], sp[1][1] - 16, { text: '清涼', color: '#FFF0B8', size: 11, life: 1 });
    spotI++; showSpot(16);
    if (spotI < spots.length) { say(`<b>${sp[0]}</b>擦好了，涼涼的。再擦<b>${spots[spotI][0]}</b>。`); return; }
    phase = 'wiped'; wipe = null; towelEl.classList.remove('held');
    const r = run;
    say(forOther() ? '擦好了。阿嬤把剩下的符水倒進小瓶子：「回家用這個幫他擦擦額頭、手心，再好好睡一覺。」' : '擦好了，整個人清清爽爽的。阿嬤：「驚嚇都擦掉了。」');
    await sleep(900); if (r !== run) return;
    await tween(reduce ? 60 : 400, (k) => { towelEl.style.opacity = String(1 - k); });
    towelEl.style.display = 'none'; towelEl.style.opacity = '';
    await sleep(900); if (r !== run) return;
    showCup();
  }

  function showCup() {
    for (const id of ['sjBowl', 'sjLamp']) S(id).style.display = 'none';
    phase = 'cup';
    S('sjCup').style.display = ''; S('sjCupBody').setAttribute('transform', ''); S('sjRice').style.display = 'none';
    S('sjSwipeHint').setAttribute('opacity', '1');
    cam?.zoom(180, 360, 220);
    say('最後，阿嬤拿出包著紅布的<b>米卦杯</b>：「來，看看米怎麼說。」<br>在杯子上<b>往下滑</b>，把杯子翻過來。');
  }

  /* ----- 5. 米卦 ----- */
  let riceKey = 'flat';
  onSwipe(S('sjCup'), svg, {
    dir: 'down', dist: 34,
    onMove(p, k) { if (phase === 'cup') S('sjCupBody').setAttribute('transform', `rotate(${(Math.min(1, k) * 40).toFixed(1)} 0 -16)`); },
    async onDone() {
      if (phase === 'reveal') { reveal(); return; }
      if (phase !== 'cup') return;
      phase = 'flipping'; S('sjSwipeHint').setAttribute('opacity', '0');
      await tween(320, (k) => S('sjCupBody').setAttribute('transform', `rotate(${40 + 140 * k} 0 -16)`));
      sfx.knock(); sfx.buzz([16]);
      S('sjCupBody').setAttribute('transform', 'rotate(180 0 -16)');
      riceKey = pick(Object.keys(RICE));
      phase = 'reveal';
      say('杯子倒扣在桌上了。阿嬤唸了幾句，<b>點一下杯子</b>，掀開來看米。');
    },
  });
  S('sjCup').addEventListener('click', () => { if (phase === 'reveal') reveal(); else if (phase === 'cup') flipAuto(); });
  async function flipAuto() {
    if (phase !== 'cup') return;
    phase = 'flipping'; S('sjSwipeHint').setAttribute('opacity', '0');
    await tween(420, (k) => S('sjCupBody').setAttribute('transform', `rotate(${180 * k} 0 -16)`));
    sfx.knock(); riceKey = pick(Object.keys(RICE)); phase = 'reveal';
    say('杯子倒扣在桌上了。<b>點一下杯子</b>，掀開來看米。');
  }
  function riceMark(k) {
    if (k === 'dent') return '<ellipse cx="2" cy="-3" rx="6" ry="2.4" fill="#C9B48A"/>';
    if (k === 'stand') return '<rect x="-1" y="-12" width="2.4" height="8" rx="1.2" fill="#FFFDF4" stroke="#C9B48A" stroke-width=".6"/>';
    if (k === 'scatter') return Array.from({ length: 9 }, (_, i) => `<ellipse cx="${-18 + i * 4.5}" cy="${-3 + (i % 3) * 2 - 2}" rx="1.6" ry=".9" fill="#E0CC9E"/>`).join('');
    return '';
  }
  async function reveal() {
    if (phase !== 'reveal') return;
    phase = 'read';
    await tween(300, (k) => S('sjCupBody').setAttribute('transform', `translate(${k * 40} ${-k * 30}) rotate(${180 - 40 * k} 0 -16)`));
    S('sjCupBody').style.opacity = '0'; S('sjRice').style.display = ''; S('sjRiceMark').innerHTML = riceMark(riceKey);
    burst('spark', CUP[0], CUP[1] - 8, reduce ? 2 : 8); sfx.chime();
    const [look, mean] = RICE[riceKey];
    say(`米卦：<b>${look}</b>。<br>阿嬤：「${mean}」`);
    await sleep(2200);
    finish(look, mean);
  }

  /* ----- 6. 收驚符、平安茶 ----- */
  function finish(look, mean) {
    const first = daily(sj, dayKey(), yesterdayKey()); save();
    if (first) addFish(1);
    phase = 'done'; cam?.reset();
    const tip = pick(TIPS);
    openSheet('收驚好了', `
      <div class="slip"><div class="slip-side"><span>收驚符</span><span class="lv">安</span></div>
        <p class="poem"><span>驚魂收回心安定</span><span>${esc(draft.name).slice(0, 5)}平安好眠</span></p></div>
      <div class="explain">
        <h3>衣服蓋印・符水</h3><p>${forOther() ? `${esc(draft.name)}的衣服蓋了三個廟印，符水裝瓶帶回家，幫他擦額頭、手心。` : '衣服蓋了三個廟印，額頭、手心、胸口都用符水擦過了。'}</p>
        <h3>米卦</h3><p>${look}：${mean}</p>
        <h3>阿嬤交代</h3><p>${tip}</p>
      </div>
      <p class="hint">${first ? `今天安神了，虎爺叼來小魚乾 ×1。已經連續 ${sj.streak} 天來安神。` : '今天已經安過神了，想再來隨時都可以。'}</p>
      <p class="hint">如果一直睡不好、心慌好幾週，記得看醫生或打 1925 安心專線。</p>`);
    sfx.bowl();
    S('sjShirt').style.display = 'none';
  }

  S('sjTap').addEventListener('pointerdown', (e) => { e.preventDefault(); S('sjTap').setPointerCapture(e.pointerId); inhale(); });
  S('sjTap').addEventListener('pointerup', exhale);
  S('sjTap').addEventListener('pointercancel', exhale);
  svg.addEventListener('keydown', (e) => { if (e.key === ' ' && phase === 'breath' && !e.repeat) { e.preventDefault(); inhale(); } });
  svg.addEventListener('keyup', (e) => { if (e.key === ' ' && phase === 'breath') { e.preventDefault(); exhale(); } });
  $('#sjBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-sj]'); if (!b) return;
    const a = b.dataset.sj;
    if (a === 'start') openStart();
    else if (a === 'cup') { if (phase === 'cup') flipAuto(); else if (phase === 'reveal') reveal(); else if (phase === 'seal') { say('先把廟印蓋好。'); seal.auto(); }
      else if (phase === 'fuLight') fu.auto();
      else if (phase === 'fuBowl') fuB.auto();
      else if (phase === 'wipe') { rubbed = WIPE_NEED; spotDone(); }
      else say('收完驚，阿嬤才會拿米卦杯出來。'); }
    else if (a === 'log') openSheet('安神紀錄', `<p>一共收驚 <b>${sj.total || 0}</b> 次${sj.streak > 1 ? `，連續 ${sj.streak} 天` : ''}。</p><p>${pick(TIPS)}</p><p class="hint">收驚是讓心安定下來的老習俗。身體不舒服還是要看醫生。</p>`);
  });

  return {
    enter() {
      run++; phase = 'idle'; holdAt = 0; exhaling = false; paintMe(); grannyHome();
      for (const id of ['sjCup', 'sjShirt', 'sjInc', 'sjTap', 'sjPad', 'sjSeal', 'sjBowl', 'sjLamp', 'sjFu', 'sjFuB', 'sjTowel']) S(id).style.display = 'none';
      S('sjMarks').innerHTML = ''; spots = []; showSpot(); burnRun++; wipe = null;
      S('sjCupBody').style.opacity = ''; S('sjBreath').setAttribute('opacity', '0'); S('sjHeartG').setAttribute('opacity', '0'); S('sjSwipeHint').setAttribute('opacity', '0');
      say(sj.last === dayKey() ? '阿嬤：「今天又來啦？心還慌慌的嗎？再收一次也可以。」'
        : '青衣阿嬤拍拍椅子：「來，坐。最近有沒有被什麼嚇到、睡不好？阿嬤幫你收驚。」<br>按「<b>收驚</b>」開始。');
    },
    leave() { run++; burnRun++; phase = 'idle'; holdAt = 0; wipe = null; grannyHome(); },
  };
}

// 元宵：鹽水蜂炮。穿好護具 → 點炮城 → 左右閃躲沖天炮，撐越久越旺。
// 手勢規則：護具和點火香拿起來浮在手指上方；閃躲是「相對滑動」，手指在哪裡滑都可以，不會擋住自己。
import { art, clamp, rand, pick, place } from './core.js';
import { backdrop } from './games-1.js';
// 福氣幣（供品店那邊做的共用遊戲幣）：有 wallet.js 就發，沒有就跳過
const WALLET = import.meta.glob('../wallet.js', { eager: true });
const wallet = WALLET['../wallet.js']?.wallet;

const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function flyTo(st, el, from, to, ms, done) {
  st.tween(ms, (k, e) => place(el, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(k * Math.PI) * 20), done);
}

/* ---------- 手繪替代圖（有 Gemini 圖會自動換掉） ---------- */
// 全罩安全帽：臉的地方挖空（只留淡淡的透明面罩），戴上後還看得到自己的臉
const helmetSvg = (w, h) => `<g transform="scale(${(w / 80).toFixed(3)})">
  <path fill-rule="evenodd" d="M-38 6C-40-30-20-42 0-42S40-30 38 6L36 26C20 34-20 34-36 26Z M-25-10C-25-22 25-22 25-10L23 14C10 19-10 19-23 14Z" fill="#F3C64A" stroke="#B8861E" stroke-width="2.5"/>
  <path d="M-25-10C-25-22 25-22 25-10L23 14C10 19-10 19-23 14Z" fill="#BFE0F2" opacity=".18" stroke="#3A4A5A" stroke-width="2"/>
  <path d="M-18-14C-10-17-2-17 4-15" stroke="#FFF" stroke-width="3" stroke-linecap="round" opacity=".8"/>
  <rect x="-6" y="-42" width="12" height="14" rx="3" fill="#E0443E"/></g>`;
const towelSvg = (w, h) => `<g transform="scale(${(w / 70).toFixed(3)})">
  <path d="M-32-6C-20 6 20 6 32-6L34 6C20 18-20 18-34 6Z" fill="#FFF8EC" stroke="#D8C8B0" stroke-width="2"/>
  <path d="M-30-2C-18 8 18 8 30-2" stroke="#E0443E" stroke-width="3" fill="none"/>
  <path d="M18 8l6 20 8-4-4-18" fill="#FFF8EC" stroke="#D8C8B0" stroke-width="2"/></g>`;
const glovesSvg = (w, h) => `<g transform="scale(${(w / 70).toFixed(3)})">${[-16, 16].map((x, i) => `<g transform="translate(${x} 0) rotate(${i ? 14 : -14})">
  <path d="M-12 14V-6C-12-14-6-18 0-18S12-14 12-6V14Z" fill="#F7F2E6" stroke="#C8BCA0" stroke-width="2"/>
  <ellipse cx="${i ? 13 : -13}" cy="-2" rx="5" ry="8" fill="#F7F2E6" stroke="#C8BCA0" stroke-width="2"/>
  <rect x="-13" y="10" width="26" height="8" rx="3" fill="#3E7EC8"/></g>`).join('')}</g>`;
const torchSvg = (w, h) => `<g transform="scale(${(h / 110).toFixed(3)})"><rect x="-3" y="-48" width="6" height="100" rx="3" fill="#8A5A34"/><rect x="-4" y="-52" width="8" height="12" rx="3" fill="#C8382E"/></g>`;
const towerSvg = (w, h) => `<g>
  <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="#B8241E" stroke="#F3C64A" stroke-width="5"/>
  ${Array.from({ length: 7 }, (_, r) => Array.from({ length: 9 }, (_, c) => `<circle cx="${-w / 2 + 16 + c * (w - 32) / 8}" cy="${-h / 2 + 26 + r * (h - 44) / 6}" r="4" fill="#3A1A12"/><path d="M${-w / 2 + 16 + c * (w - 32) / 8} ${-h / 2 + 22 + r * (h - 44) / 6}v-6" stroke="#E8D8B0" stroke-width="2"/>`).join('')).join('')}
  <rect x="${-w / 2 + 30}" y="${-h / 2 - 24}" width="${w - 60}" height="26" rx="6" fill="#F3C64A"/>
  <text y="${-h / 2 - 5}" text-anchor="middle" class="fest-small" fill="#7A1E1A" font-size="17">平安炮城</text></g>`;
const rocketSvg = `<path d="M-16 0H6" stroke="#E8D8B0" stroke-width="2"/><rect x="0" y="-3" width="14" height="6" rx="2" fill="#E0443E"/><path d="M14-3l6 3-6 3z" fill="#F3C64A"/>`;
const goldSvg = (w) => `<circle r="${w / 2}" fill="#F3C64A" stroke="#B8861E" stroke-width="2"/><text y="${w * .2}" text-anchor="middle" class="fest-small" font-size="${w * .55}" fill="#9A2420">旺</text>`;

// 站在人群裡的自己：一個比例一致的 Q 版小人（頭用自己角色的臉），下半身被前排的人擋住。
// 護具直接畫在身上：全罩安全帽包住頭、面罩看得到自己的臉；毛巾圍在脖子；手套套在兩隻手上；身上本來就穿厚外套。
const HEAD_Y = -122, HR = 34; // 頭的中心、半徑
function avatarSvg(me) {
  const face = me.face || me.kneel;
  const skin = '#F6D2B4';
  return `<defs>
      <clipPath id="fpFace"><circle cx="0" cy="${HEAD_Y}" r="${HR - 1}"/></clipPath>
      <clipPath id="fpVisor"><ellipse cx="0" cy="${HEAD_Y + 4}" rx="27" ry="23"/></clipPath>
      <linearGradient id="fpJacket" x1="0" x2="1"><stop offset="0" stop-color="#9A2A22"/><stop offset=".45" stop-color="#D8443A"/><stop offset="1" stop-color="#8A2018"/></linearGradient>
      <radialGradient id="fpHelm" cx=".35" cy=".3"><stop offset="0" stop-color="#FFF0A0"/><stop offset=".55" stop-color="#F3C64A"/><stop offset="1" stop-color="#C8901E"/></radialGradient>
    </defs>
    <g id="fpLean">
    <!-- 厚外套＋袖子 -->
    <path d="M-30 -84 C-44 -78 -52 -56 -54 -30 L-38 -28 C-36 -50 -32 -64 -24 -72Z" fill="url(#fpJacket)" stroke="#6A1410" stroke-width="1.5"/>
    <path d="M30 -84 C44 -78 52 -56 54 -30 L38 -28 C36 -50 32 -64 24 -72Z" fill="url(#fpJacket)" stroke="#6A1410" stroke-width="1.5"/>
    <path d="M-38 0 C-40 -50 -32 -86 0 -88 C32 -86 40 -50 38 0Z" fill="url(#fpJacket)" stroke="#6A1410" stroke-width="1.5"/>
    <path d="M0 -86 V0" stroke="#5A100C" stroke-width="2"/><path d="M-3 -80 h6 M-3 -70 h6 M-3 -60 h6 M-3 -50 h6" stroke="#E8C080" stroke-width="1.4"/>
    <path d="M-36 -40 h72" stroke="#F3C64A" stroke-width="3" opacity=".8"/>
    <!-- 手（沒戴手套時） -->
    <g id="fpHands">${[-46, 46].map((x) => `<circle cx="${x}" cy="-26" r="8.5" fill="${skin}" stroke="#C89A7A" stroke-width="1.2"/>`).join('')}</g>
    <!-- 脖子和頭 -->
    <rect x="-9" y="${HEAD_Y + HR - 6}" width="18" height="12" fill="${skin}"/>
    <circle cx="0" cy="${HEAD_Y}" r="${HR}" fill="#FFF4E0"/>
    <image href="${face}" x="${-HR}" y="${HEAD_Y - HR}" width="${HR * 2}" height="${HR * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#fpFace)"/>
    <!-- 毛巾 -->
    <g id="gTowel" style="display:none"><path d="M-30 -92 C-16 -82 16 -82 30 -92 L32 -80 C16 -70 -16 -70 -32 -80Z" fill="#FFF8EC" stroke="#D8C8B0" stroke-width="1.6"/><path d="M-28 -86 C-14 -78 14 -78 28 -86" stroke="#E0443E" stroke-width="2.4" fill="none"/><path d="M16 -76 l4 22 9 -2 -3 -22Z" fill="#FFF8EC" stroke="#D8C8B0" stroke-width="1.6"/></g>
    <!-- 手套 -->
    <g id="gGloves" style="display:none">${[-46, 46].map((x, i) => `<g transform="translate(${x} -28) rotate(${i ? 12 : -12})"><path d="M-10 10 V-4 C-10 -12 -5 -15 0 -15 S10 -12 10 -4 V10Z" fill="#F7F2E6" stroke="#C8BCA0" stroke-width="1.6"/><ellipse cx="${i ? 10 : -10}" cy="-2" rx="4" ry="6.5" fill="#F7F2E6" stroke="#C8BCA0" stroke-width="1.6"/><rect x="-11" y="7" width="22" height="7" rx="3" fill="#3E7EC8"/></g>`).join('')}</g>
    <!-- 全罩安全帽：外殼包住整顆頭，面罩挖空看得到臉 -->
    <g id="gHelmet" style="display:none">
      <path fill-rule="evenodd" d="M${-HR - 8} ${HEAD_Y + 4} C${-HR - 10} ${HEAD_Y - 40} ${-20} ${HEAD_Y - HR - 12} 0 ${HEAD_Y - HR - 12} S${HR + 10} ${HEAD_Y - 40} ${HR + 8} ${HEAD_Y + 4} L${HR + 6} ${HEAD_Y + 26} C${20} ${HEAD_Y + 40} ${-20} ${HEAD_Y + 40} ${-HR - 6} ${HEAD_Y + 26}Z M-27 ${HEAD_Y + 4} a27 23 0 1 0 54 0 a27 23 0 1 0 -54 0Z" fill="url(#fpHelm)" stroke="#9A6A10" stroke-width="2"/>
      <ellipse cx="0" cy="${HEAD_Y + 4}" rx="27" ry="23" fill="#9AD0F0" opacity=".22" stroke="#3A4A5A" stroke-width="2.2"/>
      <path d="M-20 ${HEAD_Y - 10} C-12 ${HEAD_Y - 16} 0 ${HEAD_Y - 17} 8 ${HEAD_Y - 14}" stroke="#FFF" stroke-width="3" stroke-linecap="round" opacity=".7"/>
      <rect x="-5" y="${HEAD_Y - HR - 12}" width="10" height="14" rx="3" fill="#E0443E"/>
      <path d="M-14 ${HEAD_Y + 32} h28" stroke="#9A6A10" stroke-width="3" stroke-linecap="round"/>
    </g>
    </g>`;
}
// 前排的人（背影），擋住自己的下半身，看起來是站在人群裡
const frontCrowd = (y) => `<g pointer-events="none">${Array.from({ length: 9 }, (_, i) => { const x = i * 45 - 4 + (i % 2) * 10, yy = y + (i % 2) * 10; return `<g transform="translate(${x} ${yy})"><path d="M-30 70 C-30 20 -22 8 0 8 S30 20 30 70Z" fill="${['#1E2030', '#2A1E28', '#222A2A'][i % 3]}"/><circle cy="-8" r="19" fill="${['#2A2630', '#3A3440', '#24222A', '#4A3A2A'][i % 4]}"/><path d="M-12-20 a15 15 0 0 1 16 -4" stroke="#FFF" stroke-width="3" stroke-linecap="round" opacity=".25" fill="none"/><path d="M-28 30h56" stroke="#000" stroke-width="10" opacity=".2"/></g>`; }).join('')}</g>`;

const GEAR = [
  { id: 'helmet', name: '全罩安全帽', at: [96, 420], size: [64, 64], draw: helmetSvg, to: [0, -122], why: '臉和眼睛最怕被炮打到' },
  { id: 'towel', name: '毛巾圍脖子', at: [96, 520], size: [62, 36], draw: towelSvg, to: [0, -84], why: '塞住領口，火花才不會鑽進衣服' },
  { id: 'gloves', name: '棉手套', at: [268, 470], size: [62, 44], draw: glovesSvg, to: [0, -30], why: '手也要包起來' },
];
const TIERS = [[90, '旺到爆', '鹽水人說炮炸得越旺，今年就越旺。你撐完整座炮城，今年旺到爆！'], [60, '大旺', '炮城炸得好旺，今年事事順，運勢一路往上衝。'], [30, '很旺', '炮聲響亮，把霉運都炸跑了，今年穩穩地旺。'], [0, '小旺', '有拜有保佑，炮城點著就是好兆頭，明年再來炸更旺。']];

const fengpao = {
  play(st, o) {
    const FEET = 585, TOWER = [180, 175], TW = 220, TH = 170, FUSE = [180 + TW / 2 - 14, TOWER[1] + TH / 2 + 30], TORCH = [300, 380];
    let phase = 'dress', worn = 0, px = 180;
    const me = o.me;
    st.set(`${backdrop('fengpao', { wall: ['#0E0E2A', '#3A1A30'], table: 600, tableColor: ['#3A2A24', '#22160F'], extra: `
      ${Array.from({ length: 26 }, () => `<circle cx="${rand(0, 360)}" cy="${rand(0, 300)}" r="${rand(.6, 1.6)}" fill="#FFF8D8" opacity="${rand(.3, .9)}"/>`).join('')}
      <path d="M0 330h360v40H0z" fill="#2A1A20"/>${[20, 70, 290, 340].map((x) => `<rect x="${x - 18}" y="250" width="36" height="90" fill="#3A2430"/><rect x="${x - 10}" y="270" width="8" height="10" fill="#FFC94A" opacity=".5"/>`).join('')}
      <g opacity=".55">${Array.from({ length: 14 }, (_, i) => `<circle cx="${i * 27 + 6}" cy="${392 + (i % 2) * 8}" r="13" fill="#1A1218"/><rect x="${i * 27 - 8}" y="${400 + (i % 2) * 8}" width="28" height="40" rx="10" fill="#1A1218"/>`).join('')}</g>` })}
      <g id="tower" transform="translate(${TOWER[0]} ${TOWER[1]})">${art('fp-tower', TW, TH, towerSvg)}</g>
      <path id="fuseLine" d="M${TOWER[0] + TW / 2 - 14} ${TOWER[1] + TH / 2} q10 14 0 30" stroke="#E8D8B0" stroke-width="2.5" fill="none"/>
      <circle id="fuseRing" cx="${FUSE[0]}" cy="${FUSE[1]}" r="16" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="4 4" opacity="0"/>
      <g id="rockets"></g>
      <g id="av" transform="translate(180 ${FEET})">${avatarSvg(me)}</g>
      ${frontCrowd(FEET - 20)}
      ${GEAR.map((g) => `<g id="gear-${g.id}" class="fest-hit" filter="url(#fToy)"><circle r="34" fill="#000" opacity="0"/>${art('fp-' + g.id, g.size[0], g.size[1], g.draw)}<text y="${g.size[1] / 2 + 18}" text-anchor="middle" class="fest-small" fill="#FFE29A">${g.name}</text></g>`).join('')}
      <g id="torch" class="fest-hit" filter="url(#fToy)" style="display:none"><rect x="-20" y="-60" width="40" height="120" fill="#000" opacity="0"/><g id="ember" transform="translate(0 -52)"><circle r="10" fill="url(#fGlow)"/><circle r="3.5" fill="#FF6A2A"/></g>${art('fp-torch', 30, 110, torchSvg)}</g>
      <g id="hud" style="display:none"><rect x="230" y="14" width="120" height="34" rx="17" fill="rgb(255 246 232 / .9)"/><text id="wangTxt" x="290" y="37" text-anchor="middle" class="fest-small" font-size="16" fill="#9A2420">旺 0</text>
        <g id="shields" transform="translate(60 31)"></g><rect x="60" y="54" width="240" height="6" rx="3" fill="rgb(255 246 232 / .3)"/><rect id="timeBar" x="60" y="54" width="240" height="6" rx="3" fill="#F3C64A"/></g>
      <text id="tip" x="180" y="584" text-anchor="middle" class="fest-tip">把護具拖到自己身上</text>`);
    const av = st.$('#av'), rk = st.$('#rockets'), torch = st.$('#torch');
    GEAR.forEach((g) => place(st.$('#gear-' + g.id), ...g.at));
    st.progress(0, 3);
    st.zoom(180, FEET - 90, 260, 600);
    st.say('元宵夜，台南鹽水放蜂炮！炮會直接往人群飛，一定要包緊緊。先把<b>安全帽、毛巾、手套</b>拖到自己身上穿好。', 'temple');

    /* ---------- 第一步：穿護具 ---------- */
    const wear = (g) => {
      st.$('#gear-' + g.id).style.display = 'none';
      st.$('#g' + g.id[0].toUpperCase() + g.id.slice(1)).style.display = '';
      if (g.id === 'gloves') st.$('#fpHands').style.display = 'none';
      worn++; st.sfx.knock(); st.burst('star', 180 + g.to[0], FEET + g.to[1], 10);
      if (worn < GEAR.length) st.say(`穿好了，${g.why}。還有 ${GEAR.length - worn} 樣。`, 'temple');
      else st.later(400, readyToLight);
    };
    GEAR.forEach((g) => {
      const el = st.$('#gear-' + g.id), target = [180 + g.to[0], FEET + g.to[1]];
      let pos = [...g.at];
      st.hold(el, {
        magnet: () => [...target, 46],
        onMove(x, y) { if (phase !== 'dress') return; pos = [x, y]; place(el, x, y, 1.1); },
        onUp() {
          if (phase !== 'dress') return;
          if (D(pos, target) < 34) wear(g);
          else { flyTo(st, el, pos, g.at, 300); st.say(`把${g.name}拖到自己的${g.id === 'helmet' ? '頭上' : g.id === 'towel' ? '脖子' : '身上'}。`, 'temple'); }
        },
      });
    });
    st.buttons([{ label: '幫我穿', on: () => { if (phase === 'dress') GEAR.forEach((g) => st.$('#gear-' + g.id).style.display !== 'none' && wear(g)); } }]);

    /* ---------- 第二步：點炮城 ---------- */
    let tpos = [...TORCH], heat = 0, lit = false;
    function readyToLight() {
      phase = 'light'; st.progress(1, 3);
      torch.style.display = ''; place(torch, ...TORCH);
      st.$('#fuseRing').setAttribute('opacity', '1');
      st.zoom(240, 330, 240);
      st.$('#tip').textContent = '按住點火香，靠近炮城的引信';
      st.say('全副武裝！現在<b>按住點火香</b>，把火頭靠近炮城右下角的<b>引信</b>，停一下就會點著。', 'temple');
      st.buttons([{ label: '幫我點', on: () => { tpos = [...FUSE]; place(torch, FUSE[0], FUSE[1] + 52); fire(); } }]);
    }
    // 點火香的火頭在上端（-52），拿著時讓火頭在手指上方
    st.hold(torch, {
      magnet: () => (phase === 'light' ? [FUSE[0], FUSE[1] + 52, 40] : null),
      onMove(x, y) { if (phase !== 'light') return; tpos = [x, y - 52]; place(torch, x, y); },
      onUp() { if (phase === 'light') { flyTo(st, torch, [tpos[0], tpos[1] + 52], TORCH, 300); heat = 0; } },
      liftBy: .6,
    });
    const keep = () => {
      if (phase !== 'light') return;
      if (D(tpos, FUSE) < 16) { heat += .05; if (Math.random() < .5) st.emit('spark', ...FUSE, { speed: 30, life: .4 }); if (heat > .6) fire(); }
      st.later(50, keep);
    };
    keep();
    function fire() {
      if (lit) return; lit = true; phase = 'fuse';
      st.$('#fuseRing').setAttribute('opacity', '0'); torch.style.display = 'none';
      st.buttons([]); st.sfx.pop();
      st.say('嘶嘶嘶，引信燒起來了……<b>站穩，準備閃！</b>', 'temple');
      // 引信火花往上爬
      st.tween(1200, (k) => st.emit('spark', FUSE[0] - 4 * Math.sin(k * 6), FUSE[1] - k * 30, { speed: 40, life: .35, color: '#FFB43A' }), () => startDodge());
    }

    /* ---------- 第三步：閃蜂炮 ---------- */
    const DUR = 30, SHIELD = 4;
    let t = 0, wang = 0, shield = SHIELD, inv = 0, spawnT = 1, goldT = 4, dir = 0, ended = false;
    const rockets = [], golds = [];
    const paintShields = () => { st.$('#shields').innerHTML = Array.from({ length: SHIELD }, (_, i) => `<g transform="translate(${i * 24} 0) scale(.27)" opacity="${i < shield ? 1 : .25}">${helmetSvg(80, 80)}</g>`).join(''); };
    const addWang = (n) => { wang = Math.min(120, wang + n); st.$('#wangTxt').textContent = `旺 ${Math.floor(wang)}`; };
    function spawnRocket(speedK) {
      const sx = TOWER[0] + rand(-TW / 2 + 16, TW / 2 - 16), sy = TOWER[1] + rand(-TH / 2 + 20, TH / 2 - 10);
      const tx = clamp(px + rand(-95, 95), 10, 350), ty = FEET - 60;
      const sp = 190 + speedK * 180, d = Math.hypot(tx - sx, ty - sy);
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      el.innerHTML = art('fp-rocket', 40, 14, rocketSvg);
      rk.appendChild(el);
      rockets.push({ x: sx, y: sy, vx: (tx - sx) / d * sp, vy: (ty - sy) / d * sp, el, min: 999 });
      if (Math.random() < .4) st.emit('spark', sx, sy, { speed: 50, life: .3 });
    }
    function startDodge() {
      if (!st.alive) return;
      phase = 'dodge'; st.progress(2, 3);
      st.$('#hud').style.display = ''; paintShields();
      st.reset(500); // 整座炮城到自己都要看得到
      st.$('#tip').textContent = '';
      st.say('蜂炮來了！<b>左右滑動</b>閃開沖天炮，接住金色的「旺」字更旺。撐完整座炮城最旺！', 'temple');
      st.sfx.knock(); st.sfx.buzz?.([30, 40, 30]);
      // 相對滑動：手指在哪都行，身體跟著手指移動的距離走
      let sx0 = 0, px0 = 0;
      st.touch({ down(p) { sx0 = p.x; px0 = px; }, move(p) { if (phase === 'dodge') px = clamp(px0 + (p.x - sx0) * 1.3, 52, 308); } });
      st.buttons([{ label: '◀ 左', on() {} }, { label: '右 ▶', on() {} }]);
      const acts = st.svg.parentElement.querySelectorAll('.fest-actions .fest-btn');
      acts.forEach((b, i) => {
        const on = (e) => { e.preventDefault(); dir = i ? 1 : -1; }, off = () => { dir = 0; };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
      });
      const key = (e) => { if (e.key === 'ArrowLeft') dir = e.type === 'keydown' ? -1 : 0; if (e.key === 'ArrowRight') dir = e.type === 'keydown' ? 1 : 0; };
      addEventListener('keydown', key); addEventListener('keyup', key);
      st.onCleanup(() => { removeEventListener('keydown', key); removeEventListener('keyup', key); });
      let last = performance.now();
      const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const loop = () => {
        if (!st.alive || ended) return;
        const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
        t += dt; inv = Math.max(0, inv - dt);
        px = clamp(px + dir * 280 * dt, 52, 308);
        const lean = dir || 0;
        av.setAttribute('transform', `translate(${px.toFixed(1)} ${FEET}) rotate(${(lean * 6).toFixed(1)})`);
        av.setAttribute('opacity', inv > 0 && Math.floor(inv * 12) % 2 ? '.4' : '1');
        const k = t / DUR;
        st.$('#timeBar').setAttribute('width', (240 * (1 - Math.min(1, k))).toFixed(1));
        addWang(dt * 2);
        // 發射：越後面越密、越快，偶爾一排齊發
        spawnT -= dt;
        if (spawnT <= 0) {
          const n = Math.random() < .12 + k * .25 ? 3 : 1;
          for (let i = 0; i < n; i++) spawnRocket(k);
          spawnT = Math.max(.24, .7 - k * .44) * rand(.7, 1.2);
          st.$('#tower').setAttribute('transform', `translate(${TOWER[0] + (calm ? 0 : rand(-2, 2))} ${TOWER[1]})`);
        }
        if (Math.random() < .3) st.emit('smoke', TOWER[0] + rand(-90, 90), TOWER[1] - 60, { vy: -20, vx: rand(-10, 10), life: 1.4, s0: .8, s1: 2, fade: true });
        // 金色「旺」慢慢飄下來
        goldT -= dt;
        if (goldT <= 0) {
          const el = st.add(`<g class="fp-gold">${art('fp-gold', 30, 30, goldSvg)}</g>`);
          golds.push({ x: rand(40, 320), y: 280, el });
          goldT = rand(3.5, 5.5);
        }
        const body = [px, FEET - 60], head = [px, FEET + HEAD_Y];
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.x += r.vx * dt; r.y += r.vy * dt;
          r.el.setAttribute('transform', `translate(${r.x.toFixed(1)} ${r.y.toFixed(1)}) rotate(${(Math.atan2(r.vy, r.vx) * 180 / Math.PI).toFixed(1)})`);
          if (Math.random() < .35) st.emit('spark', r.x, r.y, { speed: 15, life: .25, color: '#FFB43A' });
          const d = Math.min(D([r.x, r.y], body) - 22, D([r.x, r.y], head) - 30);
          r.min = Math.min(r.min, d);
          if (d < 0 && inv <= 0) {
            r.el.remove(); rockets.splice(i, 1);
            shield--; inv = .9; paintShields();
            st.burst('star', r.x, r.y, 12, { color: '#FFE08A', speed: 80, life: .4 });
            st.sfx.knock(); st.sfx.buzz?.(40);
            if (!calm) { st.world.setAttribute('transform', `translate(${rand(-4, 4)} ${rand(-4, 4)})`); st.later(90, () => st.world.setAttribute('transform', '')); }
            st.floatText('碰！', r.x, r.y - 10, '#FF8A5A');
            if (shield <= 0) { end(false); return; }
            continue;
          }
          if (r.y > FEET + 30 || r.x < -30 || r.x > 390) {
            if (r.min < 26 && r.min > 0) { addWang(4); st.floatText('好險！+4', px, FEET - 150, '#FFE08A'); }
            r.el.remove(); rockets.splice(i, 1);
          }
        }
        for (let i = golds.length - 1; i >= 0; i--) {
          const g = golds[i]; g.y += 70 * dt; g.x += Math.sin((t + i) * 2) * 20 * dt;
          place(g.el, g.x, g.y);
          if (D([g.x, g.y], body) < 40 || D([g.x, g.y], head) < 40) {
            addWang(10); st.sfx.chime(); st.burst('star', g.x, g.y, 12, { color: '#F3C64A' }); st.floatText('旺 +10', g.x, g.y - 20, '#F3C64A');
            g.el.remove(); golds.splice(i, 1);
          } else if (g.y > FEET + 20) { g.el.remove(); golds.splice(i, 1); }
        }
        if (t >= DUR) { end(true); return; }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    function end(full) {
      ended = true; phase = 'end'; st.progress(3, 3); st.buttons([]);
      rockets.forEach((r) => r.el.remove()); golds.forEach((g) => g.el.remove());
      if (full) addWang(20);
      const score = Math.min(100, Math.floor(wang));
      const [, tier, line] = TIERS.find(([n]) => score >= n);
      const best = Math.max(o.state.fengpaoBest || 0, score);
      if (o.real || best > (o.state.fengpaoBest || 0)) { o.state.fengpaoBest = best; o.save(); }
      // 節日當天第一次玩：旺度換福氣幣（最多 20 枚）
      const today = new Date().toDateString();
      if ((o.reward ?? o.real) && wallet && o.state.fengpaoPaid !== today) { o.state.fengpaoPaid = today; o.save(); wallet.earn(Math.max(5, Math.round(score / 5)), '鹽水蜂炮', 180, 340); }
      av.setAttribute('opacity', '1'); av.setAttribute('transform', `translate(${px.toFixed(1)} ${FEET})`);
      st.reset();
      st.$('#tip').textContent = '';
      st.burst('star', 180, 250, 30, { color: '#F3C64A', speed: 120 });
      st.floatText(`${tier}！`, 180, 300, '#FFE08A');
      st.sfx.chime();
      const head = full ? '整座炮城炸完了，你撐到最後！' : '護具被炸鬆了，先退到旁邊喘口氣。';
      st.later(700, () => o.done(`${head}今年旺度 <b>${score}</b>，<b>${tier}</b>。${line}${best > score ? `（最高紀錄 ${best}）` : ''}`));
    }
  },
};

export const GAMES = { fengpao };

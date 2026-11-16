// 財神殿・補財庫：備庫錢和供品 → 把庫錢拿上供桌 → 依序拜五路財神 → 金爐一張張化庫錢 → 財庫慢慢填滿。
// 庫錢和供品在供品店買（福氣幣），也可以在備辦單上直接買。財庫存在 state.cai.ku。
// 美術：先用程式畫的替代圖，src/assets/cai/ 放進同名 webp 就會自動換上（見 生圖清單/16-補財庫.md）。
import { wallet } from './wallet.js';
import { pantry, registerItems } from './shop.js';
import { furnaceSvg, bindJoss } from './joss.js';
import { makeCarrier } from './carry.js';
import ingotUrl from './assets/cai/ingot.webp';

const ART = import.meta.glob('./assets/cai/{kuqian,kuqian-stack,kuqian-bundle,fagao,wanglai,tablets,vault,goldpile}.webp', { eager: true, import: 'default' });
const art = (n) => ART[`./assets/cai/${n}.webp`];
const svgUrl = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 替代圖（之後換 Gemini 圖） ---------- */
const PH = {
  // 一張庫錢：黃紙、紅框、中間「庫」字印
  kuqian: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 60"><rect x="3" y="3" width="52" height="54" rx="4" fill="#F6D776" stroke="#C98E22" stroke-width="2"/><rect x="9" y="9" width="40" height="42" rx="2" fill="none" stroke="#C2372B" stroke-width="2"/><circle cx="29" cy="30" r="13" fill="#C2372B"/><text x="29" y="36" text-anchor="middle" font-size="17" font-weight="700" fill="#FFE9A8" font-family="serif">庫</text></svg>`),
  // 一疊庫錢（金爐下面那疊）
  'kuqian-stack': svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 62">${[0, 1, 2, 3, 4].map((i) => `<rect x="${6 + i}" y="${32 - i * 6}" width="64" height="26" rx="3" fill="${i % 2 ? '#F2CB5E' : '#F6D776'}" stroke="#B9812A" stroke-width="1.5"/>`).join('')}<rect x="34" y="6" width="10" height="52" fill="#C2372B"/><text x="39" y="30" text-anchor="middle" font-size="9" fill="#FFE9A8" font-family="serif">庫</text></svg>`),
  // 綁紅繩的一大綑庫錢（拿去供桌那個），原點在底部中央
  'kuqian-bundle': svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 56">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${4 + (i % 2) * 2}" y="${36 - i * 6}" width="70" height="18" rx="3" fill="${i % 2 ? '#F2CB5E' : '#F8DC82'}" stroke="#B9812A" stroke-width="1.4"/>`).join('')}<rect x="35" y="4" width="10" height="50" fill="#C2372B"/><rect x="22" y="2" width="36" height="16" rx="3" fill="#C2372B"/><text x="40" y="14" text-anchor="middle" font-size="10" font-weight="700" fill="#FFE9A8" font-family="serif">補財庫</text></svg>`),
  fagao: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 54"><ellipse cx="30" cy="48" rx="24" ry="5" fill="#B9812A"/><path d="M8 46 C6 30 14 22 20 26 C20 12 40 12 40 26 C46 22 54 30 52 46 Z" fill="#F7A1A8"/><path d="M20 26 C24 34 36 34 40 26" fill="none" stroke="#E07A86" stroke-width="2"/><path d="M14 38 C20 42 40 42 46 38" fill="none" stroke="#E07A86" stroke-width="2"/><circle cx="30" cy="20" r="3" fill="#E2453A"/></svg>`),
  wanglai: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 70"><path d="M25 26 L14 4 L22 14 L25 0 L28 14 L36 4 Z" fill="#4FA35A"/><ellipse cx="25" cy="48" rx="17" ry="21" fill="#F0B43A"/><path d="M12 38 L38 62 M12 52 L30 68 M18 30 L40 50 M38 38 L12 62 M38 52 L20 68 M32 30 L10 50" stroke="#B9781E" stroke-width="1.6"/><rect x="10" y="44" width="30" height="10" rx="2" fill="#E2453A"/><text x="25" y="52" text-anchor="middle" font-size="7.5" fill="#FFE9A8" font-family="serif">旺來</text></svg>`),
};
const IMG = (n) => art(n) || PH[n];

// 五路財神（中、東、南、西、北），補財庫依序拜
const ROADS = [
  { dir: '中路', god: '武財神 趙公明', short: '趙公明', wish: '統領五路，財源有根' },
  { dir: '東路', god: '招寶天尊 蕭升', short: '招寶', wish: '招來機會和貴人' },
  { dir: '南路', god: '招財使者 陳九公', short: '招財', wish: '工作順，正財穩' },
  { dir: '西路', god: '納珍天尊 曹寶', short: '納珍', wish: '守得住，不漏財' },
  { dir: '北路', god: '利市仙官 姚少司', short: '利市', wish: '生意興，偏財有緣' },
];

// 庫錢和供品放進供品店（財神最愛，排在最前面）
const ITEMS = [
  { id: 'kuqian', name: '庫錢', price: 30, mean: '補財庫必備', img: IMG('kuqian-bundle'), fav: ['cai'], tags: ['kuqian'], w: 34 },
  { id: 'fagao', name: '發糕', price: 20, mean: '發財步步高', img: IMG('fagao'), fav: ['cai'], tags: ['veg'], w: 26 },
  { id: 'wanglai', name: '鳳梨', price: 20, mean: '旺來', img: IMG('wanglai'), fav: ['cai'], tags: ['veg'], w: 20, tall: true },
];
registerItems(ITEMS);
// 金元寶 'ingot' 供品店本來就有，補財庫也算加分供品
const EXTRAS = [
  { id: 'fagao', name: '發糕', img: IMG('fagao'), mean: '發財步步高' },
  { id: 'wanglai', name: '鳳梨', img: IMG('wanglai'), mean: '旺來' },
  { id: 'ingot', name: '金元寶', img: ingotUrl, mean: '招財進寶', price: 66 },
];
const price = (id) => (ITEMS.find((x) => x.id === id) || EXTRAS.find((x) => x.id === id)).price;

// 財庫等級：每一庫 100 分，補滿一庫就「圓滿」，再開下一庫
const CAP = 100;
const LEVELS = [[0, '空庫'], [1, '見底'], [25, '小有積蓄'], [50, '半庫'], [75, '豐盈'], [100, '滿庫']];
const levelOf = (f) => LEVELS.filter(([v]) => f >= v).pop()[1];
// 補財庫好日子（農曆）：正月初五接財神、三月十五趙公明聖誕、七月廿二財神爺聖誕，財庫加倍
const GOOD = [[1, 5, '正月初五接財神'], [3, 15, '趙公明元帥聖誕'], [7, 22, '財神爺聖誕']];

export function initCaiku({ svg, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam, lunar, hideCoin }) {
  const cai = state.cai;
  const ku = cai.ku || (cai.ku = { fill: 0, full: 0, total: 0, day: '', log: [], name: '' });
  if (wallet.balance() !== state.fu) wallet.bind(state, save, { emit }); // main.js 還沒接上錢包時，自己接上（接過了就略過）
  const S = (id) => svg.querySelector('#' + id);
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs = {}, html = '') => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); if (html) el.innerHTML = html; return el; };

  /* ---------- 場景：財庫小牌（左上，財氣下面） ---------- */
  const chip = mk('g', { id: 'kuChip', class: 'ku-chip', 'data-cai': 'vault', role: 'button', tabindex: '0', 'aria-label': '看財庫、補財庫' }, `
    <rect x="10" y="46" width="104" height="30" rx="15" fill="#3A1208" opacity=".7"/>
    <text x="24" y="66" font-family="Huninn, sans-serif" font-size="13" fill="#FFE08A">財庫</text>
    <rect x="56" y="56" width="48" height="10" rx="5" fill="#1E0904" stroke="#FFE08A" stroke-opacity=".5"/>
    <rect id="kuChipFill" x="57" y="57" width="0" height="8" rx="4" fill="#FFC93C"/>`);
  svg.insertBefore(chip, S('cBowl').previousElementSibling);
  const paintChip = () => S('kuChipFill').setAttribute('width', (46 * ku.fill / CAP).toFixed(1));
  paintChip();

  // 補財庫儀式用的圖層：供桌上的庫錢、供品、五路財神牌位（畫在人偶後面）
  const layer = mk('g', { id: 'kuLayer', style: 'display:none' });
  S('cAvatar').before(layer);
  const TABLE = [182, 408]; // 供桌前緣
  const TAB = ROADS.map((r, i) => ({ ...r, x: [182, 128, 236, 101, 263][i], y: 378 + [0, 6, 6, 14, 14][i] })); // 中路在中間，兩邊往外排

  /* ---------- 財庫畫面（表單裡） ---------- */
  function vaultSvg(fill) {
    const vault = art('vault'), pile = art('goldpile');
    const h = 150 * Math.min(1, fill / CAP);
    // 程式畫的金子：一排排金幣和元寶，從下面慢慢露出來
    const coins = [];
    for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) {
      const x = 84 + c * 17 + (r % 2 ? 8 : 0), y = 226 - r * 15;
      coins.push((r + c) % 4 === 0
        ? `<path d="M${x - 9} ${y} c3 2 6 2 7 -2 c1 -4 4 -4 5 0 c1 4 4 4 7 2 c-1 6 -5 8 -10 8 s-8 -2 -9 -8z" fill="#F4C24A" stroke="#B9801E" stroke-width="1"/>`
        : `<ellipse cx="${x}" cy="${y}" rx="8.5" ry="5" fill="${(r + c) % 3 ? '#FFD45A' : '#F2B83A'}" stroke="#B9801E" stroke-width="1"/>`);
    }
    return `<svg viewBox="0 0 300 260" class="ku-vault" role="img" aria-label="財庫，目前${levelOf(fill)}">
      <defs><clipPath id="kuIn"><rect x="70" y="70" width="160" height="164" rx="6"/></clipPath>
        <clipPath id="kuRise"><rect id="kuRiseR" x="60" y="${234 - h}" width="180" height="${h + 10}"/></clipPath>
        <radialGradient id="kuGlow"><stop offset="0" stop-color="#FFE9A0" stop-opacity=".9"/><stop offset="1" stop-color="#FFE9A0" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="150" cy="248" rx="120" ry="10" fill="#2A0E06" opacity=".4"/>
      ${vault ? `<image href="${vault}" x="20" y="0" width="260" height="256"/>` : `
      <path d="M48 52 L150 14 L252 52 Z" fill="#C2372B" stroke="#8A2016" stroke-width="3"/>
      <rect x="52" y="50" width="196" height="196" rx="10" fill="#A9362E" stroke="#7A1F14" stroke-width="3"/>
      <rect x="64" y="62" width="172" height="176" rx="8" fill="#3A1208"/>
      <path d="M64 62 L40 74 L40 232 L64 238 Z" fill="#C2372B" stroke="#7A1F14" stroke-width="2"/>
      <path d="M236 62 L260 74 L260 232 L236 238 Z" fill="#C2372B" stroke="#7A1F14" stroke-width="2"/>
      <circle cx="52" cy="152" r="5" fill="#F4C24A"/><circle cx="248" cy="152" r="5" fill="#F4C24A"/>
      <rect x="118" y="22" width="64" height="24" rx="4" fill="#F4C24A" stroke="#8A2016" stroke-width="2"/>
      <text x="150" y="40" text-anchor="middle" font-size="16" font-weight="700" fill="#8A2016" font-family="serif">財庫</text>`}
      <g clip-path="url(#kuIn)"><g clip-path="url(#kuRise)">
        ${pile ? `<image href="${pile}" x="66" y="70" width="168" height="170" preserveAspectRatio="xMidYMax meet"/>` : coins.join('')}
      </g></g>
      <circle id="kuShine" cx="150" cy="150" r="90" fill="url(#kuGlow)" opacity="0" pointer-events="none"/>
    </svg>`;
  }
  function animateVault(root, from, to, done) {
    const r = root.querySelector('#kuRiseR'), shine = root.querySelector('#kuShine'), lab = root.querySelector('#kuPct');
    const t0 = performance.now(), dur = reduce ? 1 : 1600;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), f = from + (to - from) * e, h = 150 * Math.min(1, f / CAP);
      r.setAttribute('y', (234 - h).toFixed(1)); r.setAttribute('height', (h + 10).toFixed(1));
      shine.setAttribute('opacity', (Math.sin(k * Math.PI) * .9).toFixed(2));
      if (lab) lab.textContent = Math.round(f);
      if (k < 1) requestAnimationFrame(step); else done?.();
    };
    requestAnimationFrame(step);
  }

  const goodDay = () => { const L = lunar && lunar(); return L && !L.leap ? GOOD.find(([m, d]) => L.mon === m && L.day === d) : null; };
  const doneToday = () => ku.day === dayKey();

  function openVault() {
    sfx.knock();
    const g = goodDay();
    const body = openSheet('財神殿・補財庫', `
      <div class="ku-wrap">${vaultSvg(ku.fill)}
        <p class="ku-lv"><b>${levelOf(ku.fill)}</b>　<span id="kuPct">${ku.fill}</span> / ${CAP}${ku.full ? `　已補滿 <b>${ku.full}</b> 庫` : ''}</p>
      </div>
      <p>傳說每個人出生時，都向天庫借了一筆錢，存進自己的<b>財庫</b>。財庫空了，錢就留不住。準備<b>庫錢</b>和供品拜五路財神，把庫錢化給天庫，就是<b>補財庫</b>。</p>
      ${g ? `<p class="ku-good">今天是<b>${g[2]}</b>，補財庫加倍！</p>` : '<p class="hint">正月初五、三月十五、七月廿二補財庫，財庫加倍。</p>'}
      ${ku.log.length ? `<details class="ku-log"><summary>補財庫紀錄（${ku.total} 次）</summary><ul>${ku.log.slice(-8).reverse().map((l) => `<li>${esc(l.date.replace(/-/g, '/'))}　${esc(l.name)}　+${l.add}</li>`).join('')}</ul></details>` : ''}
      <div class="row">${doneToday() ? '<button class="btn ghost" id="kuOk">今天補過了，明天再來</button>' : '<button class="btn gold" id="kuGo">準備補財庫</button>'}</div>`);
    body.querySelector('#kuOk')?.addEventListener('click', closeSheet);
    body.querySelector('#kuGo')?.addEventListener('click', openPrep);
  }

  /* ---------- 備辦：庫錢（必備）＋加分供品＋寫名字 ---------- */
  let pick = new Set();
  function openPrep() {
    const draw = () => {
      const kq = pantry.count('kuqian');
      const row = (it, must) => {
        const own = pantry.count(it.id), on = pick.has(it.id);
        return `<div class="ku-item${must ? ' must' : ''}${on || (must && own) ? ' on' : ''}">
          <img src="${it.img}" alt=""><div><b>${it.name}</b><small>${it.mean}${must ? '・必備' : '・加分'}</small><small>供品籃有 ${own}</small></div>
          ${must ? '' : `<button type="button" class="ku-tog" data-tog="${it.id}" ${own ? '' : 'disabled'} aria-pressed="${on}">${on ? '擺上 ✓' : '擺上'}</button>`}
          <button type="button" class="shop-buy" data-buy="${it.id}" ${wallet.balance() < price(it.id) ? 'disabled' : ''} aria-label="用 ${price(it.id)} 福氣幣買${it.name}"><i class="fu-coin" aria-hidden="true">福</i>${price(it.id)}</button>
        </div>`;
      };
      return `<p class="shop-bal"><i class="fu-coin" aria-hidden="true">福</i><b>${wallet.balance()}</b> 福氣幣</p>
        ${row({ ...ITEMS[0], img: IMG('kuqian-bundle') }, true)}
        <p class="hint">再擺一樣供品，財庫多補一點（每樣 +2）：</p>
        ${EXTRAS.map((x) => row(x, false)).join('')}
        <label class="ku-name">庫錢上要寫誰的名字？<input id="kuName" maxlength="12" value="${esc(ku.name || state.name || '')}" placeholder="自己或家人的名字"></label>
        <div class="row"><button class="btn gold" id="kuStart" ${kq ? '' : 'disabled'}>${kq ? '拿到供桌上' : '先買一份庫錢'}</button></div>`;
    };
    const body = openSheet('補財庫・備辦', `<div class="ku-prep">${draw()}</div>`);
    const root = body.querySelector('.ku-prep');
    const redraw = () => { const n = root.querySelector('#kuName').value; root.innerHTML = draw(); root.querySelector('#kuName').value = n; };
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-buy]'), t = e.target.closest('[data-tog]');
      if (b) {
        const id = b.dataset.buy, it = ITEMS.find((x) => x.id === id) || EXTRAS.find((x) => x.id === id);
        if (!wallet.spend(price(id), `補財庫買${it.name}`)) { say('福氣幣不夠了。每天上香、摸元寶都能得到福氣幣。'); return; }
        pantry.add(id); sfx.pop(); sfx.buzz(10);
        if (id !== 'kuqian') pick.add(id);
        redraw(); return;
      }
      if (t) { const id = t.dataset.tog; pick.has(id) ? pick.delete(id) : pick.add(id); sfx.pop(); redraw(); return; }
      if (e.target.closest('#kuStart')) {
        const name = root.querySelector('#kuName').value.trim() || state.name || '我';
        if (!pantry.count('kuqian')) return;
        ku.name = name; save();
        closeSheet(); begin([...pick].filter((id) => pantry.count(id) > 0));
      }
    });
  }

  /* ---------- 儀式：庫錢上供桌 → 拜五路財神 ---------- */
  let cer = null; // 進行中的儀式
  function begin(extras) {
    cer = { extras, bowed: 0 };
    hideCoin(true);
    layer.style.display = '';
    layer.innerHTML = `
      <ellipse id="kuRing" cx="${TABLE[0]}" cy="${TABLE[1] - 4}" rx="40" ry="12" fill="none" stroke="#FFE08A" stroke-width="2" stroke-dasharray="5 5" opacity="0"/>
      <g id="kuExtras">${extras.map((id, i) => { const it = EXTRAS.find((x) => x.id === id), x = [118, 246, 92][i]; return `<image class="ku-pop" href="${it.img}" x="${x - 17}" y="${TABLE[1] - 36}" width="34" height="34" preserveAspectRatio="xMidYMax meet"/>`; }).join('')}</g>
      <g id="kuTabs" style="display:none">${TAB.map((t, i) => `
        <g class="ku-tab" data-cai="tab" data-i="${i}" role="button" tabindex="0" aria-label="拜${t.dir}${t.god}" transform="translate(${t.x} ${t.y})">
          ${art('tablets') ? '' : `<rect x="-11" y="-34" width="22" height="36" rx="3" fill="#C2372B" stroke="#F4C24A" stroke-width="1.6"/><path d="M-13 -34 h26 l-4 -6 h-18z" fill="#F4C24A"/>
          <text x="0" y="-21" text-anchor="middle" font-size="8" fill="#FFE9A8" font-family="serif">${t.dir[0]}</text><text x="0" y="-10" text-anchor="middle" font-size="7" fill="#FFE9A8" font-family="serif">財</text><text x="0" y="-2" text-anchor="middle" font-size="7" fill="#FFE9A8" font-family="serif">神</text>`}
          <circle class="ku-tab-lit" cx="0" cy="-16" r="18" fill="#FFE9A0" opacity="0"/>
          <rect x="-18" y="-44" width="36" height="52" fill="transparent"/>
        </g>`).join('')}</g>
      <g id="kuBundle" class="ku-bundle" data-cai="bundle" role="button" tabindex="0" aria-label="把庫錢拿到供桌上"><image href="${IMG('kuqian-bundle')}" x="-30" y="-42" width="60" height="42"/></g>`;
    sfx.pop();
    const bundle = S('kuBundle');
    makeCarrier({
      svg, el: bundle, rest: () => [200, 618], target: () => TABLE, radius: 42, lift: 60, cam, sfx, ring: S('kuRing'),
      zoom: () => [182, 470, 240],
      onTap: () => say('按住下面那綑庫錢，拿到<b>供桌</b>上（虛線圈那裡）。庫錢會浮在手指上方。'),
      onDrop: placed,
    }).home();
    cam.zoom(182, 480, 260, 500);
    say(`東西備好了${extras.length ? `，${extras.map((id) => EXTRAS.find((x) => x.id === id).name).join('、')}也擺上桌了` : ''}。按住下面那綑<b>庫錢</b>，拿到供桌上。`, 'god');
  }
  function placed() {
    sfx.chime(); sfx.buzz(12); burst('spark', TABLE[0], TABLE[1] - 20, reduce ? 4 : 16);
    const b = S('kuBundle'); b.classList.add('placed'); b.removeAttribute('role'); b.removeAttribute('data-cai'); b.removeAttribute('tabindex');
    S('kuTabs').style.display = '';
    cam.zoom(182, 372, 210, 600);
    nextTab();
  }
  function nextTab() {
    svg.querySelectorAll('.ku-tab').forEach((el, i) => el.classList.toggle('next', i === cer.bowed));
    const r = TAB[cer.bowed];
    say(cer.bowed === 0
      ? `五路財神請到供桌上了。從<b>中路</b>開始，點牌位一拜：先拜${r.god}（${r.wish}）。`
      : `再拜<b>${r.dir}</b>${r.god}：${r.wish}。`, 'god');
  }
  function bow(i) {
    if (!cer || i !== cer.bowed) { if (cer) say(`先拜<b>${TAB[cer.bowed].dir}</b>，照中、東、南、西、北的順序。`); return; }
    const el = svg.querySelectorAll('.ku-tab')[i], t = TAB[i];
    el.classList.remove('next'); el.classList.add('lit');
    sfx.chime(); sfx.buzz(10); burst('spark', t.x, t.y - 20, reduce ? 3 : 12);
    emit('text', t.x, t.y - 46, { text: t.short, color: '#FFE08A', life: 1.4, vy: -24 });
    cer.bowed++;
    if (cer.bowed < TAB.length) return nextTab();
    say(`${ku.name}的心意，五路財神都收到了。最後把庫錢拿去金爐化給天庫。`, 'god');
    setTimeout(openBurn, reduce ? 200 : 1300);
  }
  svg.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-cai="tab"]'); if (tab) bow(+tab.dataset.i);
    if (e.target.closest('[data-cai="vault"]')) openVault();
  });
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tab = e.target.closest('[data-cai="tab"]'); if (tab) { e.preventDefault(); bow(+tab.dataset.i); }
    if (e.target.closest('[data-cai="vault"]')) { e.preventDefault(); openVault(); }
  });

  /* ---------- 化庫錢：金爐一張一張燒 ---------- */
  let stop = null;
  function openBurn() {
    if (!cer) return;
    cam.reset(0);
    const N = 5;
    let burnt = false;
    const body = openSheet('補財庫・化庫錢', `
      <p class="hint">庫錢上寫著「<b>${esc(ku.name)}</b>」。<b>一張一張</b>拖進爐口（點一下也可以），讓天庫收到。</p>
      <div class="joss-stage">${furnaceSvg(IMG('kuqian'), IMG('kuqian-stack'))}</div>
      <p class="joss-count" id="kuCount" aria-live="polite">還有 ${N} 張庫錢</p>`, () => { stop && stop(); stop = null; if (!burnt) cancel('庫錢還沒化完，下次再從頭補財庫。'); });
    stop = bindJoss(body, {
      total: N, lift: 50,
      onBurn: (left) => { sfx.pop(); sfx.buzz(12); body.querySelector('#kuCount').textContent = left ? `還有 ${left} 張庫錢` : '庫錢都化完了，天庫收到了'; },
      onDone: () => { burnt = true; sfx.chime(); setTimeout(() => finish(), reduce ? 100 : 700); },
    });
  }
  function cancel(msg) {
    cer = null; layer.style.display = 'none'; layer.innerHTML = ''; hideCoin(false); cam.reset(0);
    if (msg) say(msg);
  }
  function finish() {
    // 用掉供品籃裡的東西
    pantry.take('kuqian'); cer.extras.forEach((id) => pantry.take(id));
    const g = goodDay();
    const add = (10 + 2 * cer.extras.length) * (g ? 2 : 1);
    const from = ku.fill;
    let to = from + add, rounds = 0;
    ku.day = dayKey(); ku.total++;
    ku.log.push({ date: dayKey(), name: ku.name, add }); if (ku.log.length > 30) ku.log.shift();
    if (to >= CAP) { rounds = 1; ku.full++; ku.fill = to - CAP; } else ku.fill = to;
    save(); paintChip();
    const shown = rounds ? CAP : to;
    stop && stop(); stop = null;
    const body = openSheet('補財庫・圓滿', `
      <div class="ku-wrap">${vaultSvg(from)}<p class="ku-lv"><b id="kuLv">${levelOf(from)}</b>　<span id="kuPct">${from}</span> / ${CAP}</p></div>
      <p class="ku-add">財庫 <b>+${add}</b>${g ? `（${g[2]}加倍）` : ''}</p>
      <p id="kuMsg" class="hint">金子慢慢流進財庫……</p>
      <div class="row"><button class="btn gold" id="kuOk">謝謝五路財神</button></div>`);
    animateVault(body, from, shown, () => {
      body.querySelector('#kuLv').textContent = levelOf(shown);
      burst('spark', 180, 300, reduce ? 6 : 26); sfx.chime();
      body.querySelector('#kuMsg').innerHTML = rounds
        ? `<b>補滿一庫了！</b>這是你的第 ${ku.full} 庫，財神爺回禮 88 福氣幣。財庫重新開一庫，繼續累積。`
        : `財庫現在是<b>${levelOf(to)}</b>，還差 ${CAP - to} 補滿一庫。明天再來，財庫會一天比一天滿。`;
      if (rounds) wallet.earn(88, '補滿財庫');
    });
    body.querySelector('#kuOk').addEventListener('click', closeSheet);
    cancel();
    say(rounds ? `補滿一庫，財源滾滾！${ku.name}的財庫滿了。` : `補財庫完成，財庫 +${add}。錢要賺，也要守得住。`, 'god');
  }

  return {
    openVault,
    leave() { if (cer) cancel(); },
  };
}

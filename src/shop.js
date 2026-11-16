// 廟口供品店：用福氣幣買供品，買來的放在「供品籃」(state.pantry = { id: 數量 })，到任何一殿都能擺上供桌。
// 其他功能（普渡桌、酬神戲台…）可以 import { ITEMS, pantry, favOf } from './shop.js'。
import { wallet } from './wallet.js';
import guiUrl from './assets/fest/tg-gui.webp';
import mianUrl from './assets/fest/tg-mian.webp';
import jiUrl from './assets/fest/tg-ji.webp';
import fishUrl from './assets/bz/fish.webp';
import guUrl from './assets/fest/tg-gu.webp';
import jinzhenUrl from './assets/fest/tg-jinzhen.webp';
import erhUrl from './assets/fest/tg-erh.webp';
import caneUrl from './assets/fest/tg-cane.webp';
import fruitUrl from './assets/bz/fruit.webp';
import wineUrl from './assets/ji/gourd.webp';
import yogurtUrl from './assets/san/yogurt.webp';
import candyJarUrl from './assets/san/candy.webp';
import ingotUrl from './assets/cai/ingot.webp';
import xiCandyUrl from './assets/yue/candy.webp';
import peachUrl from './assets/mu/peach.webp';
import kumquatUrl from './assets/ml/kumquat.webp';
import veggiesUrl from './assets/wen/veggies.webp';
import bunsUrl from './assets/wen/buns.webp';
import mochiUrl from './assets/tudi/mochi.webp';
import lotusUrl from './assets/gy/lotus.webp';

// fav = 哪幾殿的神明最愛（殿的 id，main = 媽祖正殿）
// tags：pudu = 適合中元普渡；veg = 素供（天公、觀音、彌勒）；w = 擺上桌的寬度（場景單位）
export const ITEMS = [
  { id: 'mian', name: '麵線', price: 15, mean: '福壽綿長', img: mianUrl, fav: ['main'], tags: ['pudu', 'veg'], w: 30 },
  { id: 'peach', name: '壽桃', price: 30, mean: '祝壽添福', img: peachUrl, fav: ['mu', 'main'], tags: ['veg'], w: 24 },
  { id: 'ingot', name: '金元寶', price: 66, mean: '招財進寶', img: ingotUrl, fav: ['cai'], tags: [], w: 30 },
  { id: 'xicandy', name: '喜糖', price: 20, mean: '甜甜蜜蜜', img: xiCandyUrl, fav: ['yue'], tags: ['veg'], w: 32 },
  { id: 'mochi', name: '麻糬', price: 20, mean: '黏住好運', img: mochiUrl, fav: ['tudi'], tags: ['veg'], w: 30 },
  { id: 'veggies', name: '聰明菜', price: 20, mean: '聰明伶俐', img: veggiesUrl, fav: ['wen'], tags: ['veg'], w: 26 },
  { id: 'buns', name: '包子粽子', price: 25, mean: '包中', img: bunsUrl, fav: ['wen'], tags: ['pudu'], w: 32 },
  { id: 'wine', name: '米酒', price: 30, mean: '敬一杯', img: wineUrl, fav: ['ji'], tags: ['pudu'], w: 20 },
  { id: 'yogurt', name: '養樂多', price: 15, mean: '健康長大', img: yogurtUrl, fav: ['san'], tags: ['pudu'], w: 15 },
  { id: 'candyjar', name: '糖果罐', price: 20, mean: '童心歡喜', img: candyJarUrl, fav: ['san'], tags: ['pudu', 'veg'], w: 22 },
  { id: 'lotus', name: '蓮花燈', price: 30, mean: '心如蓮花', img: lotusUrl, fav: ['gy'], tags: ['veg'], w: 30 },
  { id: 'chicken', name: '全雞', price: 60, mean: '三牲・起家', img: jiUrl, fav: ['gg'], tags: ['pudu'], w: 32 },
  { id: 'gui', name: '紅龜粿', price: 20, mean: '平安長壽', img: guiUrl, fav: ['zs'], tags: ['pudu', 'veg'], w: 28 },
  { id: 'fish', name: '全魚', price: 50, mean: '年年有餘', img: fishUrl, fav: ['ts'], tags: ['pudu'], w: 34 },
  { id: 'cane', name: '甘蔗', price: 25, mean: '節節高升', img: caneUrl, fav: ['tg'], tags: ['veg'], w: 12, tall: true },
  { id: 'gu', name: '香菇', price: 20, mean: '素齋', img: guUrl, fav: ['tg'], tags: ['pudu', 'veg'], w: 28 },
  { id: 'jinzhen', name: '金針', price: 15, mean: '素齋', img: jinzhenUrl, fav: [], tags: ['pudu', 'veg'], w: 30 },
  { id: 'erh', name: '木耳', price: 15, mean: '素齋', img: erhUrl, fav: [], tags: ['pudu', 'veg'], w: 28 },
  { id: 'kumquat', name: '金桔', price: 15, mean: '大吉大利', img: kumquatUrl, fav: ['ml'], tags: ['veg'], w: 20 },
  { id: 'fruitplate', name: '水果盤', price: 30, mean: '四季平安', img: fruitUrl, fav: [], tags: ['pudu', 'veg'], w: 34 },
];
// 其他功能要加自己的商品（例如補財庫的庫錢）：在自己的模組裡呼叫 registerItems([{ id, name, price, mean, img, fav: [], tags: [], w }])
// 不用改這個檔案，id 重複的會被略過。tags 可以自訂（例如 'kuqian'），店裡照樣會列出來。
export function registerItems(list) { list.forEach((it) => { if (!ITEMS.some((x) => x.id === it.id)) ITEMS.push({ fav: [], tags: [], w: 28, ...it }); }); }
export const itemById = (id) => ITEMS.find((x) => x.id === id);
export const favOf = (hallId) => ITEMS.filter((x) => x.fav.includes(hallId));

let st = null, persist = () => {};
export const pantry = {
  count: (id) => (st && st.pantry ? st.pantry[id] || 0 : 0),
  add(id, n = 1) { if (!st) return; st.pantry = st.pantry || {}; st.pantry[id] = (st.pantry[id] || 0) + n; persist(); },
  take(id) {
    if (!pantry.count(id)) return false;
    st.pantry[id] -= 1; if (!st.pantry[id]) delete st.pantry[id]; persist();
    return true;
  },
  list: () => ITEMS.filter((x) => pantry.count(x.id) > 0),
  total: () => (st && st.pantry ? Object.values(st.pantry).reduce((a, b) => a + b, 0) : 0),
};

// ctx: { state, save, openSheet, closeSheet, say, sfx, esc, hall: () => 目前殿 id, godName: (id) => 神明名, onChange }
export function initShop(ctx) {
  st = ctx.state; persist = ctx.save;
  const { openSheet, say, sfx } = ctx;

  function openShop(opts = {}) {
    sfx.knock();
    const here = ctx.hall();
    const draw = () => {
      // 這殿神明最愛的排最前面
      const list = [...ITEMS].sort((a, b) => (b.fav.includes(here) ? 1 : 0) - (a.fav.includes(here) ? 1 : 0));
      return `<div class="shop-head"><span class="shop-bal"><i class="fu-coin" aria-hidden="true">福</i><b>${wallet.balance()}</b> 福氣幣</span><span class="shop-bag">供品籃 ${pantry.total()} 樣</span></div>
        <p class="shop-tip">每天上香、摸財神元寶都會得到福氣幣。買好的供品放在供品籃，進殿點右上角<b>供品</b>就能擺上桌。標<b>最愛</b>的擺給那位神明，神明會回禮。</p>
        <div class="shop-grid">${list.map((it) => {
          const favs = it.fav.map((h) => ctx.godName(h)).filter(Boolean);
          const own = pantry.count(it.id), poor = wallet.balance() < it.price;
          return `<div class="shop-item${it.fav.includes(here) ? ' here' : ''}">
            ${favs.length ? `<span class="shop-fav">${favs.join('・')}最愛</span>` : ''}
            <img src="${it.img}" alt="" loading="lazy"><b>${it.name}</b><small>${it.mean}</small>
            <button type="button" class="shop-buy" data-buy="${it.id}" ${poor ? 'disabled' : ''} aria-label="用 ${it.price} 福氣幣買${it.name}"><i class="fu-coin" aria-hidden="true">福</i>${it.price}</button>
            ${own ? `<span class="shop-own">有 ${own}</span>` : ''}</div>`;
        }).join('')}</div>
        ${opts.back ? '<button type="button" class="btn" id="shopBack">買好了，去擺供品</button>' : ''}`;
    };
    const body = openSheet('廟口供品店', `<div class="shop">${draw()}</div>`);
    const root = body.querySelector('.shop');
    root.addEventListener('click', (e) => {
      if (e.target.closest('#shopBack')) { ctx.closeSheet(); opts.back(); return; }
      const b = e.target.closest('[data-buy]'); if (!b) return;
      const it = itemById(b.dataset.buy);
      if (!wallet.spend(it.price, `買${it.name}`)) return;
      pantry.add(it.id); sfx.pop(); sfx.buzz(10);
      const top = body.scrollTop; root.innerHTML = draw(); body.scrollTop = top;
      say(`買了一份${it.name}（${it.mean}），放進供品籃了。${it.fav.length ? `${it.fav.map((h) => ctx.godName(h)).join('、')}最愛這個。` : ''}`, 'temple');
      ctx.onChange && ctx.onChange();
    });
    say(opts.line || '廟口供品店開門囉！老闆娘說：「要拜哪位神明？挑祂愛吃的，心意最到。」', 'temple');
  }
  return { openShop };
}

// 福氣幣：全廟共用的遊戲幣（存在 state.fu）。
// 任何模組都可以直接 import { wallet } from './wallet.js'，main.js 開機時呼叫 wallet.bind(state, save, fx)。
//   wallet.balance()              → 目前有幾枚
//   wallet.earn(n, why, x?, y?)   → 加錢；給了場景座標就在那裡飄「福氣 +n」
//   wallet.spend(n, why)          → 夠就扣掉並回 true，不夠回 false（不扣，會跳提示）
//   wallet.onChange(fn)           → 餘額改變時呼叫 fn(balance, delta, why)
const START = 100; // 新香客見面禮
let st = null, persist = () => {}, fx = {};
const subs = [];
const tell = (d, why) => subs.forEach((f) => { try { f(st.fu, d, why); } catch {} });

export const wallet = {
  bind(state, save, opts = {}) {
    st = state; persist = save; fx = opts;
    if (typeof st.fu !== 'number' || !Number.isFinite(st.fu)) { st.fu = START; persist(); }
    tell(0, 'bind');
  },
  balance: () => (st ? st.fu : 0),
  earn(n, why = '', x, y) {
    n = Math.round(n); if (!st || n <= 0) return;
    st.fu += n; persist(); tell(n, why);
    if (x != null && fx.emit) fx.emit('text', x, y, { text: `福氣 +${n}`, color: '#FFD86A' });
  },
  spend(n, why = '') {
    n = Math.round(n); if (!st || n < 0) return false;
    if (st.fu < n) { tell(0, 'short'); fx.short && fx.short(n - st.fu, why); return false; }
    st.fu -= n; persist(); tell(-n, why);
    return true;
  },
  onChange(fn) { subs.push(fn); if (st) fn(st.fu, 0, 'bind'); return () => subs.splice(subs.indexOf(fn), 1); },
};

// 怎麼賺福氣幣（集中在這裡，方便之後調）
export const EARN = {
  checkin: 20, // 每天第一次上香
  week: 50, // 連續第 7、14、21… 天再加
  hall: 5, // 每座殿當天第一次上香
  ingot: 30, // 摸財神金元寶（每天一次）
};

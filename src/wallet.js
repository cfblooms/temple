// 福氣幣：全遊戲共用的遊戲幣，存在 state.fu。廟口供品店那邊定的介面，這裡是最小版本（衝突時以供品店的版本為準）。
let st = null, persist = () => {};
const subs = new Set();
const notify = () => subs.forEach((fn) => { try { fn(st.fu); } catch {} });
export const wallet = {
  bind(state, save) { st = state; persist = save; if (typeof st.fu !== 'number') { st.fu = 100; persist(); } notify(); },
  balance() { return st ? st.fu : 0; },
  spend(n, why) { if (!st || st.fu < n) return false; st.fu -= n; persist(); notify(); return true; },
  earn(n, why) { if (!st) return; st.fu += n; persist(); notify(); },
  onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
};

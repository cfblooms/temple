// 使用數據（Umami）：只記「發生了什麼事」，不記名字、心願、籤詩內容，也不用 cookie。
// 網站 ID 和 Umami 的網址在 Cloudflare Pages 的環境變數設定（VITE_UMAMI_ID、VITE_UMAMI_SRC），
// 沒設定時什麼都不載入。瀏覽器開了「不要追蹤」也不記。
//
// 事件：
//   open          每次打開，data.day = 第一次來之後的第幾天（0 = 第一天）→ 算 D1／D7 回訪
//   scene         進到一個殿或攤位，data.id = 場景代號，data.n = 這個人總共去過幾個不同場景
//   draw          搖到一支籤（第一次另外送 first_draw）
//   rite          抽到的籤擲出聖筊＝完成一輪參拜（第一次另外送 first_rite，data.min = 從第一次打開到完成過了幾分鐘）
const SRC = import.meta.env.VITE_UMAMI_SRC || '';
const ID = import.meta.env.VITE_UMAMI_ID || '';

export function initAnalytics({ state, save, enabled = true }) {
  const dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const on = enabled && SRC && ID && !dnt;
  const queue = [];
  if (on) {
    const s = document.createElement('script');
    s.defer = true; s.src = SRC; s.dataset.websiteId = ID; s.dataset.doNotTrack = 'true';
    s.onload = () => { while (queue.length) send(...queue.shift()); };
    document.head.appendChild(s);
  }
  function send(name, data) { try { window.umami?.track(name, data); } catch {} }
  function track(name, data) {
    if (!on) return;
    if (window.umami) send(name, data); else if (queue.length < 30) queue.push([name, data]);
  }
  // 自己記一點點進度，才知道是不是「第一次」（只在這支手機，跟著存檔走）
  const m = state.metrics || (state.metrics = {});
  const now = Date.now();
  if (!m.first) { m.first = now; save(); }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstDay = new Date(m.first); firstDay.setHours(0, 0, 0, 0);
  track('open', { day: Math.round((today - firstDay) / 864e5) });

  return {
    track,
    scene(id) {
      const seen = m.scenes || (m.scenes = []);
      if (!seen.includes(id)) { seen.push(id); save(); }
      track('scene', { id, n: seen.length });
    },
    draw() {
      if (!m.drew) { m.drew = Date.now(); save(); track('first_draw', { min: Math.round((m.drew - m.first) / 6e4) }); }
      track('draw');
    },
    rite(hall) {
      if (!m.rite) { m.rite = Date.now(); save(); track('first_rite', { hall, min: Math.round((m.rite - m.first) / 6e4) }); }
      track('rite', { hall });
    },
  };
}

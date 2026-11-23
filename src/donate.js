// 香油錢箱：玩家自願贊助作者（真的錢，不是福氣幣）。
// 原則：不擋任何玩法、不給任何遊戲內好處、不跳出來催，只在地圖上放一個安靜的香油錢箱。
//
// 要開啟：把收款連結填進 LINKS（或在 Cloudflare Pages 設環境變數 VITE_DONATE_URL）。
// LINKS 是空的時候，地圖上不會出現香油錢箱。
const ENV_URL = import.meta.env.VITE_DONATE_URL;
export const LINKS = [
  // { name: '綠界贊助（信用卡・ATM・超商）', url: 'https://p.ecpay.com.tw/XXXXXX' },
  // { name: 'Ko-fi（海外・PayPal）', url: 'https://ko-fi.com/XXXXXX' },
  ...(ENV_URL ? [{ name: '添香油錢', url: ENV_URL }] : []),
];
export const donateOn = () => LINKS.length > 0;

const safeUrl = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch { return null; } };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const BOX_SVG = `<svg viewBox="0 0 120 96" width="120" height="96" aria-hidden="true">
  <rect x="14" y="30" width="92" height="58" rx="6" fill="#B8322A" stroke="#7A1A10" stroke-width="3"/>
  <rect x="8" y="22" width="104" height="14" rx="4" fill="#D9A04A" stroke="#7A4A14" stroke-width="2.5"/>
  <rect x="44" y="26" width="32" height="5" rx="2.5" fill="#3A140C"/>
  <rect x="36" y="46" width="48" height="30" rx="3" fill="#FFE7B0" stroke="#D9A04A" stroke-width="2"/>
  <text x="60" y="67" text-anchor="middle" font-family="Noto Serif TC, serif" font-weight="900" font-size="17" fill="#B8322A">香油</text>
  <g class="dn-coin"><circle cx="60" cy="10" r="8" fill="#F2C14E" stroke="#A8761E" stroke-width="2"/><rect x="57" y="7" width="6" height="6" fill="#A8761E"/></g>
</svg>`;

export function openDonate({ openSheet, sfx }) {
  sfx?.knock?.();
  const links = LINKS.map((l) => ({ ...l, url: safeUrl(l.url) })).filter((l) => l.url);
  openSheet('香油錢箱', `
    <div class="dn">
      <div class="dn-box">${BOX_SVG}</div>
      <p>心靈大廟是一個人慢慢蓋起來的小廟，<b>免費、沒有廣告</b>。</p>
      <p>如果這裡曾經讓你心安一點，可以隨喜添一點香油錢，幫忙付主機和畫神明的費用。</p>
      <p class="hint">不添也完全沒關係。所有殿、所有籤、所有玩法都一樣開著，神明不會因此少保佑你，遊戲裡也不會多送什麼。</p>
      <div class="dn-links">${links.map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.name)}</a>`).join('')}</div>
      <p class="hint dn-small">會開到外部的付款頁面，金額你自己決定。</p>
    </div>`);
}

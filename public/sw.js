// 離線快取（Service Worker）
// - 網頁本身（index.html）：先用網路，斷線才用快取，所以一更新就拿到新版。
// - /assets/ 底下的圖、程式：檔名裡有指紋（hash），內容永遠不會變，所以「先用快取，沒有才上網抓」。
//   抓到一次就存起來，之後切 App、網路不穩、Safari 把圖從記憶體丟掉再要一次，都直接從手機裡拿，不會再變藍色問號。
// - 安裝時先把每一殿都會用到的小圖（蠟燭、香、筊、金紙、人物、神明頭像…）存好。
// - 每次部署，build 會把下面兩個清單換成這一版的檔名（vite.config.js 的 swManifest），
//   新版 SW 一啟用就把舊版不用的檔案、舊的快取刪掉，手機不會越存越肥。
const VERSION = 'dev';
const CORE = [];   // 安裝時先存好的小圖
const ALL = [];    // 這一版所有 /assets/ 檔案（用來清掉舊版的）
const PAGES = 'temple-pages-' + VERSION;
const ASSETS = 'temple-assets';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const pages = await caches.open(PAGES);
    await pages.add('/').catch(() => {});
    const assets = await caches.open(ASSETS);
    // 一張一張來、失敗就算了，不能讓一張圖卡住整個安裝
    for (let i = 0; i < CORE.length; i += 6) {
      await Promise.allSettled(CORE.slice(i, i + 6).map(async (u) => {
        if (await assets.match(u)) return;
        const r = await fetch(u);
        if (r.ok) await assets.put(u, r);
      }));
    }
  })());
});

self.addEventListener('activate', (e) => e.waitUntil((async () => {
  // 舊版快取（包含舊的 temple-v1：它把每個回應都存，連錯誤頁也存）全部刪掉
  for (const k of await caches.keys()) if (k !== PAGES && k !== ASSETS) await caches.delete(k);
  if (ALL.length) {
    const keep = new Set(ALL), c = await caches.open(ASSETS);
    for (const req of await c.keys()) if (!keep.has(new URL(req.url).pathname)) await c.delete(req);
  }
  await self.clients.claim();
})()));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// iPhone 切到別的 App 再回來時，正在下載的圖常常被系統砍掉；多試兩次
async function fetchRetry(req, tries = 3) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(req);
      if (r.ok || i >= tries - 1) return r;
    } catch (err) { if (i >= tries - 1) throw err; }
    await wait(400 * (i + 1));
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return; // 雲端存檔、外部字型不經過這裡

  if (url.pathname.startsWith('/assets/')) {
    // 有指紋的檔案：先用快取（?r= 之類的重試參數不影響）
    e.respondWith((async () => {
      const c = await caches.open(ASSETS);
      const hit = await c.match(url.pathname);
      if (hit) return hit;
      const r = await fetchRetry(new Request(url.pathname, { credentials: 'same-origin' }));
      // 只存真的圖檔／程式；Cloudflare 找不到檔案時會回首頁 HTML，那種不能存
      const type = r.headers.get('content-type') || '';
      if (r.ok && !type.includes('text/html')) c.put(url.pathname, r.clone()).catch(() => {});
      return r;
    })());
    return;
  }

  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r.ok) { const copy = r.clone(); caches.open(PAGES).then((c) => c.put('/', copy)).catch(() => {}); }
        return r;
      } catch (err) {
        const hit = await caches.match('/');
        if (hit) return hit;
        throw err;
      }
    })());
  }
  // 其他（icon、manifest…）交給瀏覽器自己處理
});

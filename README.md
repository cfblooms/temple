# 心靈大廟（Q 版賽博廟宇）可玩原型

## 這一版有什麼
- 正殿主壇：Q 版天上聖母、長明燭、香爐、籤筒、供果、磬、拜墊
- 點燭（燭光閃爍用規格書的 `0.8 + 0.2·sin` 公式）、上香（三炷香 3 分鐘燒短、青煙粒子）
- 擲筊：聖筊 50%、笑筊 25%、陰筊 25%；連三笑筊有虎爺彩蛋
- 抽籤：稟報 → 搖籤筒 → 擲筊確認（要聖筊才算數）→ 直書籤詩＋分類白話解
- 12 首原創「心安籤」（src/fortunes.js），之後可擴到 60 首
- 橘貓虎爺：摸摸呼嚕、每日簽到領小魚乾（第 7 天 5 條、初二十六做牙雙倍）、餵食升好感
- 捏人偶（方案 A，純 SVG 圖層）：髮型、髮色、膚色、眼睛、服裝、配件
- 拍立得祈福卡（canvas 輸出 PNG，長按儲存分享）
- 農曆日期（瀏覽器 Intl 中國曆）、音效（Web Audio 即時合成）、手機震動
- 進度存在瀏覽器 localStorage；PWA manifest＋離線快取

## 架構
Vite（建置）＋ 原生 JS 模組 ＋ SVG 場景 ＋ Canvas 粒子層 ＋ Web Audio。
- 還沒用 Pixi.js：目前畫面全是手繪向量，SVG 改起來最快、檔案最小（gzip 約 22KB）。等有正式美術圖檔、或要做淨身擦除遮罩、水波漣漪這類 WebGL 特效時，再把 src/scene.js 換成 Pixi 畫布。
- 還沒用 Howler.js：目前音效是程式合成，沒有音檔。有正式錄音後，把 src/audio.js 裡的函式換成 Howler 播放即可，呼叫端不用改。

## 本機開發
```bash
npm install
npm run dev          # 開發伺服器
npm run build        # 輸出 dist/，部署用
npm run build:single # 輸出 dist-single/index.html，單一檔案，方便直接傳給朋友試玩
```

## 部署到 Cloudflare Pages
1. 把這個資料夾推到 GitHub。
2. Cloudflare 後台 → Workers & Pages → Create → Pages → 連接該 repo。
3. Build command：`npm run build`，Output directory：`dist`。
4. 部署完會拿到 `https://xxx.pages.dev`，手機開啟後可「加入主畫面」當 App 用。

## 下一步（規格書裡還沒做的）
千人光明燈海與集氣（需要 Supabase＋Workers）、靜心閣番茄鐘、山門收驚／打小人、各殿神明、
方案 B 雲端 AI 人偶、金流與廣告、節慶活動。

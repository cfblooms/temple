import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 首屏用正殿背景：index.html 裡的 %BOOT_BG% 換成圖檔路徑，打包時 Vite 會再換成帶 hash 的檔名，
// 瀏覽器一拿到 HTML 就開始抓這張圖，不用等 1MB 的 JS 跑完。單檔版（圖都內嵌在 JS 裡）就不放。
const bootBg = (single) => ({
  name: 'boot-bg',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      if (!single) return html.replaceAll('%BOOT_BG%', '/src/assets/hall-bg.webp');
      return html.replace(/<link rel="preload" as="image" href="%BOOT_BG%"[^>]*>\n?/, '').replace(` style="--boot-bg:url('%BOOT_BG%')"`, '');
    },
  },
});

// `npm run build`        -> dist/ for Cloudflare Pages (PWA, multi-file)
// `npm run build:single` -> dist-single/index.html, one self-contained file for quick sharing
export default defineConfig(({ mode }) => ({
  plugins: [bootBg(mode === 'single'), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
}));

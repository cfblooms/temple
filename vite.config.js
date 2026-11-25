import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// 每殿都會用到的小圖：安裝 SW 時先存進手機，切 App、網路不穩也不會變問號
const CORE = /^(candle|candle-r|sticks|lighter|burner|furnace|jiao-flat|jiao-round|joss-sheet|joss-stack|tube|qing|kid-face|.*-kneel|.*-face|caishen|guangong|guanyin|jigong|mazu|mile|muniang|santaizi|taisui|tiangong|tudigong|wenchang|yuelao|zhusheng|cakes|flowers|flowers-r|fruit|tea)-[\w-]{8}\.webp$/;

// build 完把這一版的檔名清單和版本號寫進 dist/sw.js
function swManifest() {
  let outDir = 'dist', files = [];
  return {
    name: 'sw-manifest',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    generateBundle(_, bundle) { files = Object.keys(bundle).filter((f) => f.startsWith('assets/')); },
    closeBundle() {
      const sw = resolve(outDir, 'sw.js');
      if (!existsSync(sw)) return;
      const all = files.map((f) => '/' + f).sort();
      const core = all.filter((f) => CORE.test(f.slice('/assets/'.length)));
      const version = Date.now().toString(36);
      const src = readFileSync(sw, 'utf8')
        .replace("const VERSION = 'dev';", `const VERSION = '${version}';`)
        .replace('const CORE = [];', `const CORE = ${JSON.stringify(core)};`)
        .replace('const ALL = [];', `const ALL = ${JSON.stringify(all)};`);
      writeFileSync(sw, src);
    },
  };
}

// `npm run build`        -> dist/ for Cloudflare Pages (PWA, multi-file)
// `npm run build:single` -> dist-single/index.html, one self-contained file for quick sharing
export default defineConfig(({ mode }) => ({
  plugins: mode === 'single' ? [viteSingleFile()] : [swManifest()],
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
}));

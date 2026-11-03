import candleUrl from './assets/candle.webp';
import tigerAwake from './assets/tiger-awake.webp';
import tigerHappy from './assets/tiger-happy.webp';
import tubeUrl from './assets/tube.webp';
import qingUrl from './assets/qing.webp';
import jiaoFlat from './assets/jiao-flat.webp';
import jiaoRound from './assets/jiao-round.webp';

// 正殿主壇場景（SVG，座標 360 × 540）。Q 版公仔＋黏土光影風格；可點的物件都帶 data-hit。

// 動漫閉眼（慈眉善目）
const calmEye = (cx, cy, flip) => `<path d="M${cx - 8} ${cy} Q${cx} ${cy + 7} ${cx + 8} ${cy}" stroke="#2A1A1A" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M${flip ? cx + 8 : cx - 8} ${cy} l${flip ? 3 : -3} -2.4" stroke="#2A1A1A" stroke-width="2" stroke-linecap="round"/>`;

// 動漫睜眼（大眼＋高光）
const animeEye = (cx, cy, irisId, rx = 5.6, ry = 7) => `
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${irisId})"/>
  <ellipse cx="${cx}" cy="${cy + 1}" rx="${rx * .48}" ry="${ry * .5}" fill="#1E1010" opacity=".75"/>
  <circle cx="${cx - rx * .35}" cy="${cy - ry * .4}" r="${rx * .42}" fill="#FFF"/>
  <circle cx="${cx + rx * .4}" cy="${cy + ry * .42}" r="${rx * .2}" fill="#FFF"/>`;

const candle = (x, id) => `
  <g class="hit" data-hit="candle" role="button" tabindex="0" aria-label="點燭">
    <circle id="glow${id}" cx="${x}" cy="182" r="50" fill="url(#glowG)" opacity="0"/>
    <image href="${candleUrl}" x="${x - 21}" y="172" width="42.5" height="51"/>
    <g id="flame${id}" opacity="0" transform="translate(${x} 176)">
      <path d="M0 -24 C10 -11 9 0 0 2 C-9 0 -10 -11 0 -24 Z" fill="url(#flameG)"/>
      <path d="M0 -13 C4 -7 4 -1 0 0 C-4 -1 -4 -7 0 -13 Z" fill="#FFFBE0"/>
    </g>
  </g>`;

const lantern = (x, cls) => `
  <g class="lantern ${cls}" filter="url(#toy)">
    <path d="M${x} 36 v10" stroke="#C8912F" stroke-width="1.6"/>
    <rect x="${x - 10}" y="44" width="20" height="6" rx="3" fill="url(#goldG)"/>
    <ellipse cx="${x}" cy="70" rx="21" ry="22" fill="url(#lanternG)"/>
    <path d="M${x - 12} 50 q-9 20 0 40 M${x + 12} 50 q9 20 0 40" stroke="#C02A22" stroke-opacity=".35" stroke-width="1.4" fill="none"/>
    <ellipse cx="${x - 8}" cy="60" rx="5" ry="8" fill="#FFF" opacity=".4" transform="rotate(20 ${x - 8} 60)"/>
    <rect x="${x - 10}" y="89" width="20" height="6" rx="3" fill="url(#goldG)"/>
    <path d="M${x - 4} 95 v10 M${x} 95 v12 M${x + 4} 95 v10" stroke="#F2C14E" stroke-width="1.8" stroke-linecap="round"/>
    <text x="${x}" y="77" text-anchor="middle" font-family="Huninn, sans-serif" font-size="17" fill="#FFE9A0">福</text>
  </g>`;

const jiaoBlock = (id) => `
  <g id="${id}" opacity="0">
    <g class="face-flat"><image href="${jiaoFlat}" x="-14.3" y="-22" width="28.6" height="44" transform="rotate(90)"/></g>
    <g class="face-round" style="display:none"><image href="${jiaoRound}" x="-14.3" y="-22" width="28.6" height="44" transform="rotate(90)"/></g>
  </g>`;

export const SCENE_SVG = (bg) => `
<svg viewBox="0 0 360 645" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="心靈大廟正殿">
  <defs>
    <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F59A86"/><stop offset="1" stop-color="#D9605A"/></linearGradient>
    <radialGradient id="backLight" cx=".5" cy=".3" r=".55"><stop offset="0" stop-color="#FFF1D6" stop-opacity=".75"/><stop offset="1" stop-color="#FFF1D6" stop-opacity="0"/></radialGradient>
    <linearGradient id="roofG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ED8C0"/><stop offset="1" stop-color="#3F9E86"/></linearGradient>
    <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9B48C"/><stop offset="1" stop-color="#CF9068"/></linearGradient>
    <radialGradient id="pool" cx=".5" cy=".7" r=".55"><stop offset="0" stop-color="#FFF4DE" stop-opacity=".7"/><stop offset="1" stop-color="#FFF4DE" stop-opacity="0"/></radialGradient>
    <linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0B0"/><stop offset=".5" stop-color="#F4C55A"/><stop offset="1" stop-color="#D49530"/></linearGradient>
    <linearGradient id="robeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A80"/><stop offset="1" stop-color="#E0443E"/></linearGradient>
    <radialGradient id="skinG" cx=".42" cy=".38" r=".68"><stop offset="0" stop-color="#FFF6EE"/><stop offset=".7" stop-color="#FFE6D6"/><stop offset="1" stop-color="#F2C9B0"/></radialGradient>
    <linearGradient id="hairG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A4048"/><stop offset="1" stop-color="#22161C"/></linearGradient>
    <radialGradient id="haloG"><stop offset="0" stop-color="#FFF4C8" stop-opacity=".95"/><stop offset=".6" stop-color="#FFD36A" stop-opacity=".35"/><stop offset="1" stop-color="#FFD36A" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowG"><stop offset="0" stop-color="#FFE29A" stop-opacity=".95"/><stop offset="1" stop-color="#FFB850" stop-opacity="0"/></radialGradient>
    <radialGradient id="nicheG" cx=".5" cy=".45"><stop offset="0" stop-color="#B8423C"/><stop offset="1" stop-color="#7A1F22"/></radialGradient>
    <radialGradient id="lanternG" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#FF9A84"/><stop offset=".6" stop-color="#F0483C"/><stop offset="1" stop-color="#C42C26"/></radialGradient>
    <radialGradient id="candleG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFB0A0"/><stop offset=".6" stop-color="#FF6A5A"/><stop offset="1" stop-color="#E0443E"/></radialGradient>
    <linearGradient id="flameG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A3A"/><stop offset="1" stop-color="#FFD25A"/></linearGradient>
    <radialGradient id="orangeG" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFD48A"/><stop offset="1" stop-color="#F28A1E"/></radialGradient>
    <linearGradient id="jadeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7CCFB4"/><stop offset=".4" stop-color="#4DB096"/><stop offset="1" stop-color="#2E8A72"/></linearGradient>
    <linearGradient id="clothG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0645C"/><stop offset="1" stop-color="#D2443E"/></linearGradient>
    <radialGradient id="furG" cx=".42" cy=".35" r=".75"><stop offset="0" stop-color="#FFD39A"/><stop offset=".6" stop-color="#FFA048"/><stop offset="1" stop-color="#EC7E26"/></radialGradient>
    <linearGradient id="catIris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A3A10"/><stop offset=".55" stop-color="#C08A1E"/><stop offset="1" stop-color="#FFE08A"/></linearGradient>
    <radialGradient id="cushionG" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#FFE7A0"/><stop offset="1" stop-color="#E8A83A"/></radialGradient>
    <radialGradient id="redCushion" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#FF9A8A"/><stop offset="1" stop-color="#D84A42"/></radialGradient>
    <linearGradient id="jiaoG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8564A"/><stop offset="1" stop-color="#A82A24"/></linearGradient>
    <filter id="toy" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="2.4" flood-color="#5A1A10" flood-opacity=".3"/></filter>
    <radialGradient id="floorShadow"><stop offset="0" stop-color="#2A1408" stop-opacity=".45"/><stop offset="1" stop-color="#2A1408" stop-opacity="0"/></radialGradient>
  </defs>

  <!-- 背景：Gemini 生成的正殿（方案一） -->
  <image id="hallBg" href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>

  <!-- 神明光暈與點擊區 -->
  <circle class="deity-halo" id="halo" cx="182" cy="300" r="58" fill="url(#haloG)" opacity=".35" style="mix-blend-mode:screen"/>
  <rect id="deity" class="hit" data-hit="deity" role="button" tabindex="0" aria-label="向神明問安" x="150" y="255" width="65" height="100" rx="20" fill="transparent"/>

  <!-- 供桌兩端的蠟燭 -->
  <g transform="translate(34 182) scale(.9)">${candle(80, 'L')}</g>
  <g transform="translate(6 182) scale(.9)">${candle(280, 'R')}</g>

  <!-- 香爐（背景圖裡的）與香 -->
  <g class="hit" data-hit="incense" role="button" tabindex="0" aria-label="上香">
    <rect x="160" y="335" width="45" height="45" fill="transparent"/>
    <g transform="translate(2 140)"><g id="incense" style="display:none">
      <path id="stick0" d="M172 212 L162 166" stroke="#C0603E" stroke-width="2.4" stroke-linecap="round"/>
      <path id="stick1" d="M180 212 L180 160" stroke="#C0603E" stroke-width="2.4" stroke-linecap="round"/>
      <path id="stick2" d="M188 212 L198 166" stroke="#C0603E" stroke-width="2.4" stroke-linecap="round"/>
      <circle id="tip0" cx="162" cy="166" r="2.4" fill="#FF6A3A"/><circle id="tip1" cx="180" cy="160" r="2.4" fill="#FF6A3A"/><circle id="tip2" cx="198" cy="166" r="2.4" fill="#FF6A3A"/>
    </g></g>
  </g>

  <!-- 籤筒（放在左邊地上） -->
  <ellipse cx="46" cy="562" rx="26" ry="7" fill="url(#floorShadow)"/>
  <g class="hit" data-hit="draw" role="button" tabindex="0" aria-label="抽籤">
    <g id="tubeScene"><image href="${tubeUrl}" x="30" y="479" width="32" height="82"/></g>
  </g>

  <!-- 橘貓虎爺（供桌下） -->
  <ellipse cx="130" cy="470" rx="30" ry="7" fill="url(#floorShadow)"/>
  <g id="tiger" class="hit" data-hit="tiger" role="button" tabindex="0" aria-label="摸摸虎爺">
    <g class="cat-body">
      <image id="catEyesOpen" href="${tigerAwake}" x="90" y="410" width="60" height="64"/>
      <image id="catEyesClosed" href="${tigerHappy}" x="90" y="410" width="60" height="64" style="display:none"/>
    </g>
  </g>

  <!-- 磬（右邊地上） -->
  <ellipse cx="305" cy="572" rx="38" ry="9" fill="url(#floorShadow)"/>
  <g class="hit" data-hit="qing" role="button" tabindex="0" aria-label="敲磬">
    <g class="qing-bowl" id="qingBowl"><image href="${qingUrl}" x="270" y="506" width="80" height="68"/></g>
  </g>

  <!-- 人偶跪在拜墊上 -->
  <svg id="avatarSlot" x="128" y="406" width="108" height="130" viewBox="0 0 100 120"></svg>

  <!-- 筊杯 -->
  <g id="jiaoLayer">${jiaoBlock('jiaoA')}${jiaoBlock('jiaoB')}</g>
</svg>`;

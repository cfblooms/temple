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
    <g filter="url(#toy)">
      <ellipse cx="${x}" cy="223" rx="18" ry="5" fill="url(#goldG)"/>
      <rect x="${x - 15}" y="184" width="30" height="38" rx="14" fill="url(#candleG)"/>
      <ellipse cx="${x - 7}" cy="194" rx="4" ry="7" fill="#FFF" opacity=".45"/>
      <ellipse cx="${x - 5.5}" cy="202" rx="2.4" ry="3" fill="#3A1414"/><circle cx="${x - 6.3}" cy="200.8" r="1" fill="#FFF"/>
      <ellipse cx="${x + 5.5}" cy="202" rx="2.4" ry="3" fill="#3A1414"/><circle cx="${x + 4.7}" cy="200.8" r="1" fill="#FFF"/>
      <path d="M${x - 2.5} 208 q2.5 3 5 0" stroke="#3A1414" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="${x - 10}" cy="207" rx="3.4" ry="2" fill="#FF9AAA" opacity=".8"/><ellipse cx="${x + 10}" cy="207" rx="3.4" ry="2" fill="#FF9AAA" opacity=".8"/>
      <path d="M${x} 184 v-6" stroke="#5A3020" stroke-width="1.8" stroke-linecap="round"/>
    </g>
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
  <g id="${id}" opacity="0" filter="url(#toy)">
    <g class="face-flat"><path d="M-17 5 C-18 -10 18 -10 17 5 C10 -1 -10 -1 -17 5 Z" fill="#FF8C7A"/><path d="M-10 -2 C-5 -5 5 -5 10 -2" stroke="#FFF" stroke-opacity=".6" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>
    <g class="face-round" style="display:none"><path d="M-17 5 C-18 -10 18 -10 17 5 C10 -1 -10 -1 -17 5 Z" fill="url(#jiaoG)"/><ellipse cx="-4" cy="-4" rx="6" ry="2" fill="#FFF" opacity=".55"/></g>
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
  <image href="${bg}" x="0" y="0" width="360" height="645" preserveAspectRatio="xMidYMid slice"/>

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
  <g transform="translate(-280 245) scale(1.4)">  <g class="hit" data-hit="draw" role="button" tabindex="0" aria-label="抽籤">
    <g id="tubeScene" filter="url(#toy)">
      <path d="M224 190 v-16 M230 190 v-22 M236 190 v-14 M242 190 v-19" stroke="#F2D58A" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M224 175 v0 M230 169 v0 M236 177 v0 M242 172 v0" stroke="#F0483C" stroke-width="3.4" stroke-linecap="round"/>
      <rect x="219" y="186" width="28" height="40" rx="9" fill="url(#jadeG)"/>
      <rect x="219" y="192" width="28" height="4" fill="url(#goldG)"/><rect x="219" y="214" width="28" height="4" fill="url(#goldG)"/>
      <rect x="223" y="189" width="4" height="34" rx="2" fill="#FFF" opacity=".35"/>
      <text x="233" y="209" text-anchor="middle" font-family="Huninn, sans-serif" font-size="10" fill="#FFF3C0">籤</text>
    </g>
  </g>
</g>

  <!-- 橘貓虎爺（供桌下） -->
  <ellipse cx="130" cy="470" rx="30" ry="7" fill="url(#floorShadow)"/>
  <g transform="translate(-5 219.5) scale(.75)">  <g id="tiger" class="hit" data-hit="tiger" role="button" tabindex="0" aria-label="摸摸虎爺">
    <g class="cat-tail"><path d="M202 328 q18 -2 15 -20 q-1 -6 -7 -4" stroke="#FF9A40" stroke-width="8" fill="none" stroke-linecap="round"/></g>
    <g class="cat-body" filter="url(#toy)">
      <ellipse cx="180" cy="322" rx="27" ry="12" fill="url(#furG)"/>
      <ellipse cx="166" cy="331" rx="8" ry="4.5" fill="#FFF4E6"/><ellipse cx="194" cy="331" rx="8" ry="4.5" fill="#FFF4E6"/>
      <path d="M160 288 L156 266 Q158 262 162 265 L176 278 Z M200 288 L204 266 Q202 262 198 265 L184 278 Z" fill="url(#furG)"/>
      <path d="M162 284 L160 271 L171 280 Z M198 284 L200 271 L189 280 Z" fill="#FFB0B8"/>
      <ellipse cx="180" cy="297" rx="24" ry="21" fill="url(#furG)"/>
      <ellipse cx="180" cy="306" rx="11" ry="7" fill="#FFF4E6"/>
      <path d="M173 280 h14 M180 279 v9 M174 284 h12 M173 288 h14" stroke="#D2661A" stroke-width="2" stroke-linecap="round"/>
      <path d="M158 296 h6 M157 301 h6 M196 296 h6 M197 301 h6" stroke="#E07A26" stroke-width="2" stroke-linecap="round"/>
      <g id="catEyesOpen">${animeEye(170.5, 297, 'catIris', 5, 6.4)}${animeEye(189.5, 297, 'catIris', 5, 6.4)}</g>
      <g id="catEyesClosed" style="display:none" stroke="#2A1A1A" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M165 296 q5.5 5 11 0 M184 296 q5.5 5 11 0"/></g>
      <path d="M178 304 h4 l-2 2.6 z" fill="#FF7A8A"/>
      <path d="M180 306.6 q-2.6 3 -5.2 1 M180 306.6 q2.6 3 5.2 1" stroke="#7A3A12" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <ellipse cx="164" cy="306" rx="4.4" ry="2.6" fill="#FF8AA0" opacity=".55"/><ellipse cx="196" cy="306" rx="4.4" ry="2.6" fill="#FF8AA0" opacity=".55"/>
      <ellipse cx="170" cy="284" rx="6" ry="3" fill="#FFF" opacity=".35" transform="rotate(-20 170 284)"/>
      <path d="M166 316 q14 6 28 0" stroke="#F0483C" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      <circle cx="180" cy="320" r="4.2" fill="url(#goldG)"/><circle cx="178.6" cy="318.6" r="1.3" fill="#FFF"/>
    </g>
  </g>
</g>

  <!-- 磬（右邊地上） -->
  <ellipse cx="305" cy="572" rx="38" ry="9" fill="url(#floorShadow)"/>
  <g transform="translate(253 115)">  <g class="hit" data-hit="qing" role="button" tabindex="0" aria-label="敲磬">
    <g filter="url(#toy)">
      <ellipse cx="52" cy="450" rx="32" ry="12" fill="url(#redCushion)"/>
      <g class="qing-bowl" id="qingBowl">
        <path d="M28 420 Q30 448 52 450 Q74 448 76 420 Z" fill="url(#goldG)"/>
        <ellipse cx="52" cy="420" rx="24" ry="6.4" fill="#C8862A"/>
        <path d="M33 428 Q36 442 46 446" stroke="#FFF" stroke-opacity=".7" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      </g>
      <path d="M86 444 L98 406" stroke="#B07A4A" stroke-width="5" stroke-linecap="round"/>
      <circle cx="98" cy="404" r="6" fill="#FFE29A"/><circle cx="96.6" cy="402.6" r="1.8" fill="#FFF"/>
    </g>
  </g>
</g>

  <!-- 人偶跪在拜墊上 -->
  <svg id="avatarSlot" x="128" y="406" width="108" height="130" viewBox="0 0 100 120"></svg>

  <!-- 筊杯 -->
  <g id="jiaoLayer">${jiaoBlock('jiaoA')}${jiaoBlock('jiaoB')}</g>
</svg>`;

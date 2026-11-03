// 正殿主壇場景（SVG，座標 360 × 540）。可點的物件都帶 data-hit。
const candle = (x, id) => `
  <g class="hit" data-hit="candle" role="button" tabindex="0" aria-label="點燭">
    <circle id="glow${id}" cx="${x}" cy="186" r="46" fill="url(#glowG)" opacity="0"/>
    <path d="M${x - 16} 226 h32 l-4 -6 h-24 z" fill="url(#goldG)"/>
    <rect x="${x - 13}" y="186" width="26" height="36" rx="11" fill="#E8483A"/>
    <rect x="${x - 13}" y="186" width="9" height="36" rx="4.5" fill="#FF7A66" opacity=".55"/>
    <circle cx="${x - 5}" cy="202" r="1.8" fill="#4A120D"/><circle cx="${x + 5}" cy="202" r="1.8" fill="#4A120D"/>
    <path d="M${x - 4} 208 q4 4 8 0" stroke="#4A120D" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="${x - 9}" cy="207" rx="3" ry="1.8" fill="#FFB0A0" opacity=".8"/><ellipse cx="${x + 9}" cy="207" rx="3" ry="1.8" fill="#FFB0A0" opacity=".8"/>
    <path d="M${x} 186 v-6" stroke="#3B1F17" stroke-width="1.6"/>
    <g id="flame${id}" opacity="0" transform="translate(${x} 178)">
      <path d="M0 -22 C9 -10 8 0 0 2 C-8 0 -9 -10 0 -22 Z" fill="#FFB52E"/>
      <path d="M0 -13 C4 -7 4 -1 0 0 C-4 -1 -4 -7 0 -13 Z" fill="#FFF4C2"/>
    </g>
  </g>`;

const lantern = (x, cls) => `
  <g class="lantern ${cls}">
    <path d="M${x} 24 v12" stroke="#E6B85C" stroke-width="1.5"/>
    <rect x="${x - 9}" y="34" width="18" height="5" rx="1.5" fill="#E6B85C"/>
    <ellipse cx="${x}" cy="60" rx="19" ry="23" fill="#D8352A"/>
    <path d="M${x} 37 v46 M${x - 11} 39 q-8 21 0 42 M${x + 11} 39 q8 21 0 42" stroke="#A32219" stroke-width="1.2" fill="none"/>
    <rect x="${x - 9}" y="81" width="18" height="5" rx="1.5" fill="#E6B85C"/>
    <path d="M${x - 5} 86 v10 M${x} 86 v12 M${x + 5} 86 v10" stroke="#E6B85C" stroke-width="1.4"/>
    <text x="${x}" y="67" text-anchor="middle" font-family="Noto Serif TC, serif" font-weight="900" font-size="17" fill="#FFE08A">福</text>
  </g>`;

const jiaoBlock = (id) => `
  <g id="${id}" opacity="0">
    <g class="face-flat"><path d="M-17 5 C-18 -10 18 -10 17 5 C10 -1 -10 -1 -17 5 Z" fill="#E86E58" stroke="#8E2118" stroke-width="1.2"/><path d="M-10 -1 C-6 -4 6 -4 10 -1" stroke="#F7A894" stroke-width="1.2" fill="none"/></g>
    <g class="face-round" style="display:none"><path d="M-17 5 C-18 -10 18 -10 17 5 C10 -1 -10 -1 -17 5 Z" fill="#9E2219" stroke="#5E120C" stroke-width="1.2"/><path d="M-9 -4 C-4 -7 4 -7 9 -4" stroke="#E0675A" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>
  </g>`;

export const SCENE_SVG = `
<svg viewBox="0 0 360 540" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="心靈大廟正殿">
  <defs>
    <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A1E1A"/><stop offset="1" stop-color="#4A100E"/></linearGradient>
    <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6B3A26"/><stop offset="1" stop-color="#9A6040"/></linearGradient>
    <linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6D98A"/><stop offset="1" stop-color="#C08A2C"/></linearGradient>
    <linearGradient id="robeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E0483A"/><stop offset="1" stop-color="#A82A20"/></linearGradient>
    <radialGradient id="haloG"><stop offset="0" stop-color="#FFE7A0" stop-opacity=".85"/><stop offset=".6" stop-color="#F2B94A" stop-opacity=".25"/><stop offset="1" stop-color="#F2B94A" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowG"><stop offset="0" stop-color="#FFD27A" stop-opacity=".9"/><stop offset="1" stop-color="#FFB040" stop-opacity="0"/></radialGradient>
    <radialGradient id="nicheG" cx=".5" cy=".55"><stop offset="0" stop-color="#5A1A12"/><stop offset="1" stop-color="#2A0B08"/></radialGradient>
  </defs>

  <!-- 牆與樑 -->
  <rect width="360" height="340" fill="url(#wallG)"/>
  <g stroke="#E6B85C" stroke-opacity=".12" stroke-width="1" fill="none">
    <path d="M40 120h40v40h-40zM280 120h40v40h-40zM40 180h40v40h-40zM280 180h40v40h-40z"/>
    <path d="M60 120v100M300 120v100M40 140h40M280 140h40M40 200h40M280 200h40"/>
  </g>
  <rect width="360" height="22" fill="#3A0D0B"/>
  <rect y="20" width="360" height="4" fill="#E6B85C" opacity=".8"/>
  <rect x="6" y="24" width="24" height="316" fill="#A3241D"/><rect x="330" y="24" width="24" height="316" fill="#A3241D"/>
  <g fill="#E6B85C"><rect x="4" y="24" width="28" height="7"/><rect x="328" y="24" width="28" height="7"/><rect x="4" y="300" width="28" height="7"/><rect x="328" y="300" width="28" height="7"/></g>
  <path d="M18 60 q8 20 0 40 q-8 20 0 40 q8 20 0 40 q-8 20 0 40" stroke="#E6B85C" stroke-opacity=".5" stroke-width="2" fill="none"/>
  <path d="M342 60 q-8 20 0 40 q8 20 0 40 q-8 20 0 40 q8 20 0 40" stroke="#E6B85C" stroke-opacity=".5" stroke-width="2" fill="none"/>

  <!-- 匾額 -->
  <rect x="112" y="4" width="136" height="34" rx="3" fill="#1F120E" stroke="url(#goldG)" stroke-width="3"/>
  <text x="180" y="29" text-anchor="middle" font-family="Noto Serif TC, serif" font-weight="900" font-size="20" letter-spacing="6" fill="#F2CC74">心靈大廟</text>

  ${lantern(58, 'l')}
  ${lantern(302, 'r')}

  <!-- 神龕 -->
  <rect x="88" y="46" width="184" height="184" rx="10" fill="url(#goldG)"/>
  <path d="M96 230 V96 Q96 56 136 56 H224 Q264 56 264 96 V230 Z" fill="url(#nicheG)"/>
  <circle class="deity-halo" id="halo" cx="180" cy="128" r="74" fill="url(#haloG)" opacity=".75"/>
  <path d="M96 64 q11 14 22 0 q11 14 22 0 q11 14 22 0 q11 14 22 0 q11 14 22 0 q11 14 22 0 q11 14 22 0 q11 14 22 0 v-12 h-176 z" fill="#F2C14E"/>
  <path d="M96 64 q11 14 22 0 q11 14 22 0 q11 14 22 0 q11 14 22 0 q11 14 22 0 q11 14 22 0 q11 14 22 0 q11 14 22 0" stroke="#C8352B" stroke-width="2" fill="none"/>

  <!-- 主神：Q 版天上聖母 -->
  <g id="deity" class="hit" data-hit="deity" role="button" tabindex="0" aria-label="向神明問安">
    <path d="M128 228 Q128 150 150 140 H210 Q232 150 232 228 Z" fill="#7A3A12" opacity=".6"/>
    <g fill="#FFFFFF" opacity=".9"><circle cx="138" cy="222" r="14"/><circle cx="158" cy="226" r="12"/><circle cx="202" cy="226" r="12"/><circle cx="222" cy="222" r="14"/><circle cx="180" cy="228" r="13"/></g>
    <path d="M140 220 Q138 168 160 158 H200 Q222 168 220 220 Z" fill="url(#robeG)"/>
    <path d="M160 158 L180 182 L200 158" fill="#F6D98A"/>
    <path d="M144 196 h72" stroke="#F6D98A" stroke-width="5"/>
    <path d="M144 196 h72" stroke="#2F6B5E" stroke-width="2" stroke-dasharray="4 4"/>
    <ellipse cx="170" cy="186" rx="6" ry="7" fill="#FFE6D3"/><ellipse cx="190" cy="186" rx="6" ry="7" fill="#FFE6D3"/>
    <path d="M168 192 q-6 -20 6 -26 q8 -4 6 6 q-2 8 4 10" stroke="#E6B85C" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="180" cy="122" r="31" fill="#FFE6D3"/>
    <path d="M150 116 Q152 88 180 88 Q208 88 210 116 Q196 104 180 106 Q164 104 150 116 Z" fill="#2B1D18"/>
    <path d="M166 124 q5 -4 10 0 M184 124 q5 -4 10 0" stroke="#2B1D18" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="163" cy="134" rx="5.5" ry="3" fill="#FF8C8C" opacity=".4"/><ellipse cx="197" cy="134" rx="5.5" ry="3" fill="#FF8C8C" opacity=".4"/>
    <path d="M175 137 q5 4 10 0" stroke="#A33B2E" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="180" cy="113" r="2" fill="#D8352A"/>
    <path d="M146 96 L152 74 L164 86 L172 66 L180 80 L188 66 L196 86 L208 74 L214 96 Z" fill="url(#goldG)" stroke="#A8761C" stroke-width="1"/>
    <rect x="146" y="94" width="68" height="7" rx="2" fill="#E6B85C"/>
    <circle cx="180" cy="86" r="5" fill="#D8352A"/><circle cx="160" cy="90" r="3" fill="#2F6B5E"/><circle cx="200" cy="90" r="3" fill="#2F6B5E"/>
    <g stroke="#E6B85C" stroke-width="1.2"><path d="M148 101 v22 M154 101 v16 M206 101 v16 M212 101 v22"/></g>
    <g fill="#F6D98A"><circle cx="148" cy="124" r="2"/><circle cx="154" cy="118" r="2"/><circle cx="206" cy="118" r="2"/><circle cx="212" cy="124" r="2"/></g>
  </g>

  <!-- 供桌 -->
  <rect x="26" y="226" width="308" height="11" rx="2" fill="#5A2414"/>
  <rect x="26" y="226" width="308" height="3" fill="#E6B85C" opacity=".8"/>

  ${candle(82, 'L')}
  ${candle(278, 'R')}

  <!-- 供果 -->
  <ellipse cx="128" cy="225" rx="22" ry="4" fill="url(#goldG)"/>
  <circle cx="118" cy="214" r="9" fill="#F39A2B"/><circle cx="137" cy="214" r="9" fill="#F39A2B"/><circle cx="128" cy="204" r="9" fill="#FFB347"/>
  <path d="M128 196 l3 -4" stroke="#2F6B5E" stroke-width="2"/>

  <!-- 香爐 -->
  <g class="hit" data-hit="incense" role="button" tabindex="0" aria-label="上香">
    <g id="incense" style="display:none">
      <path id="stick0" d="M172 214 L162 168" stroke="#B5462E" stroke-width="2.2" stroke-linecap="round"/>
      <path id="stick1" d="M180 214 L180 162" stroke="#B5462E" stroke-width="2.2" stroke-linecap="round"/>
      <path id="stick2" d="M188 214 L198 168" stroke="#B5462E" stroke-width="2.2" stroke-linecap="round"/>
      <circle id="tip0" cx="162" cy="168" r="2" fill="#FF5A2A"/><circle id="tip1" cx="180" cy="162" r="2" fill="#FF5A2A"/><circle id="tip2" cx="198" cy="168" r="2" fill="#FF5A2A"/>
    </g>
    <path d="M150 208 Q150 226 166 228 H194 Q210 226 210 208 Z" fill="url(#goldG)"/>
    <ellipse cx="180" cy="208" rx="31" ry="6" fill="#C08A2C"/>
    <ellipse cx="180" cy="208" rx="25" ry="4" fill="#9A9A92"/>
    <path d="M150 208 q-8 -2 -8 6 M210 208 q8 -2 8 6" stroke="#C08A2C" stroke-width="3" fill="none"/>
    <path d="M168 218 h24" stroke="#A8761C" stroke-width="1.4"/>
  </g>

  <!-- 籤筒 -->
  <g class="hit" data-hit="draw" role="button" tabindex="0" aria-label="抽籤">
    <g id="tubeScene">
      <path d="M223 190 v-16 M229 190 v-22 M235 190 v-14 M241 190 v-19" stroke="#E8C77A" stroke-width="3" stroke-linecap="round"/>
      <path d="M223 174 h0 M229 168 h0" stroke="#C8352B" stroke-width="3" stroke-linecap="round"/>
      <rect x="219" y="188" width="26" height="38" rx="4" fill="#2F6B5E"/>
      <rect x="219" y="194" width="26" height="4" fill="#E6B85C"/><rect x="219" y="216" width="26" height="4" fill="#E6B85C"/>
      <text x="232" y="211" text-anchor="middle" font-family="Noto Serif TC, serif" font-weight="900" font-size="10" fill="#F6D98A">籤</text>
    </g>
  </g>

  <!-- 桌裙與虎爺龕 -->
  <path d="M30 237 H330 V332 H30 Z" fill="#B8302A"/>
  <path d="M30 237 H330 V250 H30 Z" fill="#E6B85C"/>
  <path d="M30 250 q15 10 30 0 q15 10 30 0 q15 10 30 0 q15 10 30 0 q15 10 30 0 q15 10 30 0 q15 10 30 0 q15 10 30 0 q15 10 30 0 q15 10 30 0" fill="#E6B85C"/>
  <text x="82" y="300" text-anchor="middle" font-family="Noto Serif TC, serif" font-weight="900" font-size="22" fill="#F2CC74">合境</text>
  <text x="278" y="300" text-anchor="middle" font-family="Noto Serif TC, serif" font-weight="900" font-size="22" fill="#F2CC74">平安</text>
  <path d="M138 332 V292 Q138 264 180 264 Q222 264 222 292 V332 Z" fill="url(#goldG)"/>
  <path d="M144 332 V294 Q144 270 180 270 Q216 270 216 294 V332 Z" fill="#2A0B08"/>

  <!-- 橘貓虎爺 -->
  <g id="tiger" class="hit" data-hit="tiger" role="button" tabindex="0" aria-label="摸摸虎爺">
    <g class="cat-tail"><path d="M200 326 q16 -2 14 -18 q-1 -6 -6 -4" stroke="#E07A22" stroke-width="7" fill="none" stroke-linecap="round"/></g>
    <g class="cat-body">
      <ellipse cx="180" cy="318" rx="30" ry="15" fill="#F08A2E"/>
      <path d="M160 308 q4 8 0 16 M172 305 q3 9 0 18 M188 305 q-3 9 0 18 M200 308 q-4 8 0 16" stroke="#C8621A" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="166" cy="330" rx="8" ry="4" fill="#FFE2C2"/><ellipse cx="194" cy="330" rx="8" ry="4" fill="#FFE2C2"/>
      <path d="M163 286 L160 268 L174 279 Z M197 286 L200 268 L186 279 Z" fill="#F08A2E"/>
      <path d="M164 283 L162 273 L170 280 Z M196 283 L198 273 L190 280 Z" fill="#FFB8A8"/>
      <circle cx="180" cy="294" r="19" fill="#F59A3C"/>
      <path d="M174 281 h12 M180 280 v9 M175 285 h10 M174 289 h12" stroke="#B85A16" stroke-width="1.8" stroke-linecap="round"/>
      <g id="catEyesOpen"><ellipse cx="172" cy="295" rx="2.6" ry="3.2" fill="#2B1D18"/><ellipse cx="188" cy="295" rx="2.6" ry="3.2" fill="#2B1D18"/><circle cx="171" cy="294" r="1" fill="#FFF"/><circle cx="187" cy="294" r="1" fill="#FFF"/></g>
      <g id="catEyesClosed" style="display:none" stroke="#2B1D18" stroke-width="2" fill="none" stroke-linecap="round"><path d="M168 296 q4 -4 8 0 M184 296 q4 -4 8 0"/></g>
      <path d="M178 300 h4 l-2 2.5 z" fill="#FF8C8C"/>
      <path d="M180 302.5 q-3 3 -6 1 M180 302.5 q3 3 6 1" stroke="#7A3A12" stroke-width="1.3" fill="none"/>
      <path d="M164 300 l-10 -2 M164 303 l-10 2 M196 300 l10 -2 M196 303 l10 2" stroke="#FFE2C2" stroke-width="1"/>
      <ellipse cx="168" cy="301" rx="3.5" ry="2" fill="#FF8C8C" opacity=".45"/><ellipse cx="192" cy="301" rx="3.5" ry="2" fill="#FF8C8C" opacity=".45"/>
      <path d="M168 310 q12 5 24 0" stroke="#C8352B" stroke-width="2.4" fill="none"/>
      <circle cx="180" cy="314" r="3.6" fill="#F2C14E" stroke="#A8761C" stroke-width="1"/>
    </g>
  </g>

  <!-- 地板 -->
  <rect y="332" width="360" height="208" fill="url(#floorG)"/>
  <g stroke="#3E1E12" stroke-opacity=".35" stroke-width="1.2">
    <path d="M0 356 H360 M0 388 H360 M0 428 H360 M0 476 H360 M0 532 H360"/>
    <path d="M180 332 V540 M120 332 L60 540 M240 332 L300 540 M60 332 L-60 540 M300 332 L420 540"/>
  </g>

  <!-- 磬 -->
  <g class="hit" data-hit="qing" role="button" tabindex="0" aria-label="敲磬">
    <ellipse cx="52" cy="452" rx="30" ry="9" fill="#C8352B"/>
    <ellipse cx="52" cy="448" rx="30" ry="9" fill="#E0483A"/>
    <g class="qing-bowl" id="qingBowl">
      <path d="M28 420 Q30 448 52 450 Q74 448 76 420 Z" fill="url(#goldG)"/>
      <ellipse cx="52" cy="420" rx="24" ry="6" fill="#8A5A18"/>
      <path d="M34 432 q18 6 36 0" stroke="#A8761C" stroke-width="1.2" fill="none"/>
    </g>
    <path d="M84 444 L98 404" stroke="#8A5A2A" stroke-width="4" stroke-linecap="round"/>
    <circle cx="98" cy="403" r="5" fill="#E8C77A"/>
  </g>

  <!-- 拜墊與人偶 -->
  <ellipse cx="180" cy="524" rx="62" ry="15" fill="#A82A20"/>
  <ellipse cx="180" cy="520" rx="58" ry="13" fill="#E6B85C"/>
  <ellipse cx="180" cy="520" rx="46" ry="9" fill="#D8A23A"/>
  <svg id="avatarSlot" x="122" y="396" width="116" height="139" viewBox="0 0 100 120"></svg>

  <!-- 筊杯 -->
  <g id="jiaoLayer">${jiaoBlock('jiaoA')}${jiaoBlock('jiaoB')}</g>
</svg>`;

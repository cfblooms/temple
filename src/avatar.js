// 方案 A：免費 Q 版人偶。二頭身、動漫大眼、黏土公仔光影，純 SVG 圖層組裝（座標 100 × 120）。
export const OPTIONS = {
  hair: [
    { id: 'short', name: '短髮' },
    { id: 'long', name: '長髮' },
    { id: 'buns', name: '雙丸子' },
    { id: 'pony', name: '馬尾' },
  ],
  hairColor: ['#3A2A2A', '#7A4A30', '#E0A04A', '#B8B8D8', '#F28DB0'],
  skin: ['#FFE9DC', '#FAD6BC', '#E3AE88', '#B07A55'],
  eyeColor: ['#6B3E26', '#2F6FB0', '#3E8E6A', '#8A4FC0'],
  eyes: [
    { id: 'round', name: '水汪汪' },
    { id: 'smile', name: '笑瞇瞇' },
    { id: 'star', name: '星星眼' },
  ],
  outfit: [
    { id: 'vest', name: '進香團背心' },
    { id: 'uniform', name: '水手服' },
    { id: 'hoodie', name: '帽T' },
    { id: 'tang', name: '紅唐裝' },
  ],
  acc: [
    { id: 'none', name: '不戴' },
    { id: 'glasses', name: '圓眼鏡' },
    { id: 'cap', name: '進香帽' },
    { id: 'flower', name: '小花夾' },
  ],
};

export const DEFAULT_AVATAR = { hair: 'buns', hairColor: '#3A2A2A', skin: '#FFE9DC', eyeColor: '#6B3E26', eyes: 'round', outfit: 'vest', acc: 'flower' };

// 顏色調亮（amt>0）或調暗（amt<0）
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

let uid = 0;

function defs(c, p) {
  const ec = c.eyeColor || '#6B3E26';
  const lin = (id, top, mid, bot) => `<linearGradient id="${p}${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${bot}"/></linearGradient>`;
  return `<defs>
    <radialGradient id="${p}skin" cx=".42" cy=".38" r=".68"><stop offset="0" stop-color="${shade(c.skin, .35)}"/><stop offset=".7" stop-color="${c.skin}"/><stop offset="1" stop-color="${shade(c.skin, -.12)}"/></radialGradient>
    ${lin('hair', shade(c.hairColor, .28), c.hairColor, shade(c.hairColor, -.3))}
    ${lin('iris', shade(ec, -.55), ec, shade(ec, .55))}
    <radialGradient id="${p}blush"><stop offset="0" stop-color="#FF7E9A" stop-opacity=".6"/><stop offset="1" stop-color="#FF7E9A" stop-opacity="0"/></radialGradient>
    <filter id="${p}soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#4A1A10" flood-opacity=".28"/></filter>
  </defs>`;
}

function cloth(p, id, base) {
  return `<linearGradient id="${p}${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(base, .3)}"/><stop offset="1" stop-color="${shade(base, -.18)}"/></linearGradient>`;
}

function body(c, p) {
  const hand = (x, r) => `<ellipse cx="${x}" cy="96" rx="5" ry="8.5" fill="url(#${p}skin)" transform="rotate(${r} ${x} 96)"/>`;
  const hands = hand(46.6, 14) + hand(53.4, -14) + `<ellipse cx="47" cy="91" rx="1.6" ry="2.6" fill="#FFF" opacity=".55" transform="rotate(14 47 91)"/>`;
  const legs = (col) => `<ellipse cx="50" cy="114" rx="28" ry="7.5" fill="${shade(col, -.1)}"/><ellipse cx="44" cy="112" rx="10" ry="3" fill="#FFF" opacity=".18"/>`;
  const torso = 'M34 116 Q32 92 41 82 L59 82 Q68 92 66 116 Z';
  const shine = `<path d="M38 110 Q37 94 43 86" stroke="#FFF" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  switch (c.outfit) {
    case 'uniform':
      return `<defs>${cloth(p, 'c1', '#FFFFFF')}${cloth(p, 'c2', '#3B4F8C')}</defs>` + legs('#3B4F8C') + `<path d="${torso}" fill="url(#${p}c1)"/><path d="M39 82 L50 95 L61 82 L66 88 L50 101 L34 88 Z" fill="url(#${p}c2)"/><path d="M38 86 l24 0" stroke="#FFF" stroke-width="1" opacity=".7"/><path d="M50 95 l-6 8 l6 -2 l6 2 z" fill="#E8485A"/>` + shine + hands;
    case 'hoodie':
      return `<defs>${cloth(p, 'c1', '#F7B2C4')}</defs>` + legs('#6A7A9A') + `<path d="${torso}" fill="url(#${p}c1)"/><path d="M38 82 Q50 92 62 82" stroke="${shade('#F7B2C4', -.15)}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M45 87v9M55 87v9" stroke="#FFF" stroke-width="1.8" stroke-linecap="round"/><circle cx="45" cy="97" r="1.6" fill="#FFF"/><circle cx="55" cy="97" r="1.6" fill="#FFF"/><path d="M41 106 h18 l-2 7 h-14 z" fill="${shade('#F7B2C4', -.08)}"/>` + shine + hands;
    case 'tang':
      return `<defs>${cloth(p, 'c1', '#E04848')}</defs>` + legs('#3A2A2A') + `<path d="${torso}" fill="url(#${p}c1)"/><path d="M50 82 V116" stroke="#F6C85C" stroke-width="1.6"/><g fill="#F6C85C"><rect x="46" y="88" width="8" height="2.4" rx="1.2"/><rect x="46" y="104" width="8" height="2.4" rx="1.2"/></g><path d="M41 82 L50 86 L59 82" stroke="#F6C85C" stroke-width="2.4" fill="none" stroke-linecap="round"/>` + shine + hands;
    default: // 進香團背心
      return `<defs>${cloth(p, 'c1', '#FFFFFF')}${cloth(p, 'c2', '#FFD23F')}</defs>` + legs('#4A5A88') + `<path d="${torso}" fill="url(#${p}c1)"/><path d="M35 116 Q34 94 41 83 L46 83 L46 116 Z M65 116 Q66 94 59 83 L54 83 L54 116 Z" fill="url(#${p}c2)"/><path d="M37 106 h9 M54 106 h9" stroke="#E8485A" stroke-width="3" stroke-linecap="round"/>` + shine + hands;
  }
}

function backHair(c, p) {
  const h = `url(#${p}hair)`;
  switch (c.hair) {
    case 'long': return `<path d="M13 50 Q8 96 26 104 Q50 110 74 104 Q92 96 87 50 Z" fill="${h}"/>`;
    case 'buns': return `<circle cx="22" cy="20" r="12.5" fill="${h}"/><circle cx="78" cy="20" r="12.5" fill="${h}"/><path d="M15 15 q6 -6 12 -3 M71 12 q6 -3 12 3" stroke="#FFF" stroke-opacity=".5" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M27 29 q-6 0 -8 -5 M73 29 q6 0 8 -5" stroke="#F27A9A" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'pony': return `<path d="M78 34 Q104 40 96 80 Q92 66 84 60 Q80 48 74 44 Z" fill="${h}"/><circle cx="80" cy="34" r="4.5" fill="#F27A9A"/><circle cx="79" cy="33" r="1.5" fill="#FFF" opacity=".7"/>`;
    default: return '';
  }
}

function frontHair(c, p) {
  const h = `url(#${p}hair)`;
  const bangs = c.hair === 'short'
    ? 'M12 60 C6 -6 94 -6 88 60 C84 46 80 40 74 40 C70 32 62 30 56 37 C50 29 40 30 35 38 C27 37 18 44 13 58 Z'
    : 'M12 58 C6 -6 94 -6 88 58 C83 44 78 38 72 39 C68 31 60 29 53 36 C47 28 38 30 33 38 C26 36 18 42 14 56 Z';
  const side = c.hair === 'short' ? '' : `<path d="M14 50 Q12 70 18 80 Q20 66 22 56 Z M86 50 Q88 70 82 80 Q80 66 78 56 Z" fill="${h}"/>`;
  return `<path d="${bangs}" fill="${h}"/>${side}
    <path d="M26 30 Q50 16 74 30" stroke="#FFF" stroke-opacity=".3" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="9 6"/>
    <path d="M50 14 q4 -11 13 -8" stroke="${shade(c.hairColor, .1)}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}

function eye(cx, cy, c, p) {
  const lid = `<path d="M${cx - 8.8} ${cy - 3} Q${cx - 6} ${cy - 11.2} ${cx} ${cy - 11} Q${cx + 6} ${cy - 11.2} ${cx + 8.8} ${cy - 3}" stroke="#2A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const lash = cx < 50
    ? `<path d="M${cx - 8.6} ${cy - 3.5} l-3 -1" stroke="#2A1A1A" stroke-width="2" stroke-linecap="round"/>`
    : `<path d="M${cx + 8.6} ${cy - 3.5} l3 -1" stroke="#2A1A1A" stroke-width="2" stroke-linecap="round"/>`;
  const iris = `<ellipse cx="${cx}" cy="${cy}" rx="8" ry="9.8" fill="url(#${p}iris)"/><ellipse cx="${cx}" cy="${cy + 1.2}" rx="3.6" ry="4.8" fill="#1E1010" opacity=".75"/><ellipse cx="${cx}" cy="${cy + 5.5}" rx="5" ry="2.4" fill="#FFF" opacity=".22"/>`;
  if (c.eyes === 'star') {
    return iris + `<path d="M${cx - 2} ${cy - 7} l1.6 3.4 3.6 1 -3 2.2 .8 3.6 -3 -2 -3 2 .8 -3.6 -3 -2.2 3.6 -1z" fill="#FFF"/><circle cx="${cx + 3.4}" cy="${cy + 4}" r="1.5" fill="#FFF"/>` + lid + lash;
  }
  return iris + `<circle cx="${cx - 2.6}" cy="${cy - 3.8}" r="3.1" fill="#FFF"/><circle cx="${cx + 3.2}" cy="${cy + 3.8}" r="1.5" fill="#FFF"/>` + lid + lash;
}

function face(c, p) {
  let eyes;
  if (c.eyes === 'smile') {
    eyes = `<path d="M29 58 Q37 48 45 58 M55 58 Q63 48 71 58" stroke="#2A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M29 58 l-3 1 M71 58 l3 1" stroke="#2A1A1A" stroke-width="2" stroke-linecap="round"/>`;
  } else eyes = eye(36.5, 59, c, p) + eye(63.5, 59, c, p);
  return `${eyes}
    <ellipse cx="26" cy="68" rx="8" ry="5" fill="url(#${p}blush)"/><ellipse cx="74" cy="68" rx="8" ry="5" fill="url(#${p}blush)"/>
    <path d="M23 67 l2 -2.4 M27 67 l2 -2.4 M71 67 l2 -2.4 M75 67 l2 -2.4" stroke="#FFF" stroke-width="1" opacity=".7" stroke-linecap="round"/>
    <circle cx="50" cy="65" r="1" fill="${shade(c.skin, -.25)}"/>
    <path d="M45 69.5 Q50 76 55 69.5 Z" fill="#D9545E"/><path d="M47.5 72.5 Q50 74.5 52.5 72.5" stroke="#FF9AAA" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
}

function accessory(c) {
  switch (c.acc) {
    case 'glasses': return `<g fill="#FFF" fill-opacity=".12" stroke="#7A4A30" stroke-width="2"><circle cx="37" cy="57" r="11"/><circle cx="63" cy="57" r="11"/></g><path d="M48 56 h4" stroke="#7A4A30" stroke-width="2"/><path d="M30 51 l4 -3" stroke="#FFF" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
    case 'cap': return `<path d="M17 32 Q50 -6 83 32 Z" fill="#FFD23F"/><path d="M24 22 Q40 8 58 10" stroke="#FFF" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M11 32 Q50 23 89 32 Q50 39 11 32 Z" fill="#F0B020"/><circle cx="50" cy="12" r="3.5" fill="#E8485A"/>`;
    case 'flower': return `<g transform="translate(76 27)"><g fill="#FF9EBB"><circle cx="0" cy="-5.5" r="4.6"/><circle cx="5.2" cy="-1.6" r="4.6"/><circle cx="3.2" cy="4.4" r="4.6"/><circle cx="-3.2" cy="4.4" r="4.6"/><circle cx="-5.2" cy="-1.6" r="4.6"/></g><circle r="3" fill="#FFE066"/><circle cx="-1.6" cy="-6.5" r="1.4" fill="#FFF" opacity=".8"/></g>`;
    default: return '';
  }
}

// 回傳 100×120 座標內的 SVG 內容。每次呼叫用不同 id 前綴，避免同頁多個人偶的漸層互相干擾。
export function avatarMarkup(c, prefix) {
  const p = prefix || `av${++uid}_`;
  c = { ...DEFAULT_AVATAR, ...c };
  return [
    defs(c, p),
    `<g filter="url(#${p}soft)">`,
    backHair(c, p),
    body(c, p),
    `<circle cx="50" cy="48" r="37" fill="url(#${p}skin)"/>`,
    `<ellipse cx="36" cy="72" rx="12" ry="5" fill="#FFF" opacity=".12"/>`,
    face(c, p),
    frontHair(c, p),
    accessory(c),
    `</g>`,
  ].join('');
}

export function avatarSVGString(c, w = 100, h = 120) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="${w}" height="${h}">${avatarMarkup(c, 'card_')}</svg>`;
}

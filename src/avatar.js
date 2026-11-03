// 方案 A：免費 Q 版人偶，純 SVG 圖層組裝（座標系 100 × 120，跪坐合掌姿勢）。
export const OPTIONS = {
  hair: [
    { id: 'short', name: '短髮' },
    { id: 'long', name: '長髮' },
    { id: 'buns', name: '雙丸子' },
    { id: 'pony', name: '馬尾' },
  ],
  hairColor: ['#2B1D18', '#6B3E26', '#C9772F', '#9A9AA8', '#D9577A'],
  skin: ['#FFE6D3', '#F6CDA8', '#DDA77B', '#A9734D'],
  eyes: [
    { id: 'round', name: '圓圓眼' },
    { id: 'smile', name: '笑瞇眼' },
    { id: 'star', name: '閃亮眼' },
  ],
  outfit: [
    { id: 'vest', name: '進香團背心' },
    { id: 'uniform', name: '學生制服' },
    { id: 'hoodie', name: '帽T' },
    { id: 'tang', name: '紅唐裝' },
  ],
  acc: [
    { id: 'none', name: '不戴' },
    { id: 'glasses', name: '眼鏡' },
    { id: 'cap', name: '進香帽' },
    { id: 'flower', name: '小花夾' },
  ],
};

export const DEFAULT_AVATAR = { hair: 'buns', hairColor: '#2B1D18', skin: '#FFE6D3', eyes: 'round', outfit: 'vest', acc: 'none' };

function body(c) {
  const hands = `<ellipse cx="46.5" cy="88" rx="4.2" ry="8" fill="${c.skin}" transform="rotate(14 46.5 88)"/><ellipse cx="53.5" cy="88" rx="4.2" ry="8" fill="${c.skin}" transform="rotate(-14 53.5 88)"/>`;
  const legs = (col) => `<ellipse cx="50" cy="111" rx="30" ry="8" fill="${col}"/>`;
  const torso = 'M32 112 Q31 86 40 74 L60 74 Q69 86 68 112 Z';
  switch (c.outfit) {
    case 'uniform':
      return legs('#2E3B63') + `<path d="${torso}" fill="#FAFAF5"/><path d="M38 74 L50 88 L62 74 L66 80 L50 94 L34 80 Z" fill="#2E3B63"/><path d="M48 88 L52 88 L54 98 L50 101 L46 98 Z" fill="#C8352B"/>` + hands;
    case 'hoodie':
      return legs('#5B6B7A') + `<path d="${torso}" fill="#F2A7B5"/><path d="M38 74 Q50 82 62 74" stroke="#E08799" stroke-width="3" fill="none"/><path d="M44 80v8M56 80v8" stroke="#FFF" stroke-width="1.6" stroke-linecap="round"/><path d="M40 100 h20 l-2 8 h-16 z" fill="#E68FA0"/>` + hands;
    case 'tang':
      return legs('#2B1D18') + `<path d="${torso}" fill="#C8352B"/><path d="M50 74 V112" stroke="#E6B85C" stroke-width="1.4"/><g fill="#E6B85C"><rect x="46" y="80" width="8" height="2" rx="1"/><rect x="46" y="96" width="8" height="2" rx="1"/><rect x="46" y="104" width="8" height="2" rx="1"/></g><path d="M41 74 L50 78 L59 74" stroke="#E6B85C" stroke-width="2" fill="none"/>` + hands;
    default: // vest 進香團背心
      return legs('#3A4A6B') + `<path d="${torso}" fill="#FFFFFF"/><path d="M33 112 Q32 88 40 75 L46 75 L46 112 Z M67 112 Q68 88 60 75 L54 75 L54 112 Z" fill="#F4C430"/><path d="M36 100 h10 M54 100 h10" stroke="#C8352B" stroke-width="3"/>` + hands;
  }
}

function backHair(c) {
  const h = c.hairColor;
  switch (c.hair) {
    case 'long': return `<path d="M16 46 Q14 92 30 98 L70 98 Q86 92 84 46 Z" fill="${h}"/>`;
    case 'buns': return `<circle cx="24" cy="18" r="11" fill="${h}"/><circle cx="76" cy="18" r="11" fill="${h}"/>`;
    case 'pony': return `<path d="M76 30 Q100 40 90 74 Q86 60 78 54 Z" fill="${h}"/><circle cx="80" cy="30" r="4" fill="#C8352B"/>`;
    default: return '';
  }
}

function fringe(c) {
  const h = c.hairColor;
  if (c.hair === 'short') return `<path d="M17 50 C14 8 86 8 83 50 L80 40 L72 34 L64 40 L56 30 L46 38 L36 30 L28 40 L20 40 Z" fill="${h}"/>`;
  return `<path d="M18 48 C16 8 84 8 82 48 L76 36 L66 40 L58 28 L50 36 L42 28 L34 40 L24 36 Z" fill="${h}"/>`;
}

function eyes(c) {
  const ink = '#2B1D18';
  if (c.eyes === 'smile') return `<path d="M32 52 Q38 45 44 52 M56 52 Q62 45 68 52" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const sparkle = c.eyes === 'star'
    ? `<path d="M36 46 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2z M60 46 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2z" fill="#FFF"/>`
    : `<circle cx="36.5" cy="48" r="1.8" fill="#FFF"/><circle cx="60.5" cy="48" r="1.8" fill="#FFF"/>`;
  const r = c.eyes === 'star' ? 6 : 5;
  return `<ellipse cx="38" cy="51" rx="${r - 1}" ry="${r}" fill="${ink}"/><ellipse cx="62" cy="51" rx="${r - 1}" ry="${r}" fill="${ink}"/>${sparkle}`;
}

function accessory(c) {
  switch (c.acc) {
    case 'glasses': return `<g fill="none" stroke="#3B2A22" stroke-width="2"><circle cx="38" cy="51" r="8.5"/><circle cx="62" cy="51" r="8.5"/><path d="M46.5 51 h7"/></g>`;
    case 'cap': return `<path d="M20 30 Q50 -4 80 30 Z" fill="#F4C430"/><path d="M14 30 Q50 22 86 30 Q50 36 14 30 Z" fill="#E0A818"/><circle cx="50" cy="12" r="3" fill="#C8352B"/>`;
    case 'flower': return `<g transform="translate(74 24)"><g fill="#FF8FA8"><circle cx="0" cy="-5" r="4"/><circle cx="4.8" cy="-1.5" r="4"/><circle cx="3" cy="4" r="4"/><circle cx="-3" cy="4" r="4"/><circle cx="-4.8" cy="-1.5" r="4"/></g><circle r="2.6" fill="#FFD84D"/></g>`;
    default: return '';
  }
}

// 回傳 100×120 座標內的 SVG 內容
export function avatarMarkup(c) {
  return [
    body(c),
    backHair(c),
    `<circle cx="17.5" cy="52" r="5" fill="${c.skin}"/><circle cx="82.5" cy="52" r="5" fill="${c.skin}"/>`,
    `<circle cx="50" cy="44" r="33" fill="${c.skin}"/>`,
    fringe(c),
    eyes(c),
    `<ellipse cx="29" cy="62" rx="6" ry="3.5" fill="#FF8C8C" opacity=".45"/><ellipse cx="71" cy="62" rx="6" ry="3.5" fill="#FF8C8C" opacity=".45"/>`,
    `<path d="M45.5 62 Q50 66.5 54.5 62" stroke="#8A3B2E" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    accessory(c),
  ].join('');
}

export function avatarSVGString(c, w = 100, h = 120) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="${w}" height="${h}">${avatarMarkup(c)}</svg>`;
}

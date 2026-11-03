// 拍立得祈福卡：畫到 canvas，輸出 PNG。
import { avatarSVGString } from './avatar.js';
import { cn } from './fortunes.js';
import hallBg from './assets/hall-bg.webp';

const SERIF = '"Noto Serif TC", "Songti TC", serif';
const UI = '"Huninn", "PingFang TC", "Microsoft JhengHei", sans-serif';

function loadImg(src) {
  return new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = src; });
}

function wrap(g, text, maxW) {
  const lines = []; let cur = '';
  for (const ch of text) {
    if (g.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; } else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function renderCard({ avatar, name, dateLine, fortune, category, wish, daily, bg: photo = hallBg }) {
  const W = 720, H = 1080;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  try {
    await Promise.all([
      document.fonts.load(`900 40px ${SERIF}`, '心靈大廟第籤'),
      document.fonts.load(`600 34px ${SERIF}`, fortune ? fortune.poem.join('') : daily),
      document.fonts.load(`28px ${UI}`, name + (wish || '')),
    ]);
  } catch {}

  // 相紙
  g.fillStyle = '#FBF4E6'; g.fillRect(0, 0, W, H);

  // 照片區：正殿紅牆＋光暈
  const px = 40, py = 40, pw = 640, ph = 560;
  const bg = g.createLinearGradient(0, py, 0, py + ph);
  bg.addColorStop(0, '#F59A86'); bg.addColorStop(1, '#C9504C');
  g.fillStyle = bg; g.fillRect(px, py, pw, ph);
  try { const hb = await loadImg(photo); const sh = hb.width * ph / pw; g.drawImage(hb, 0, hb.height * 0.36 - sh / 2, hb.width, sh, px, py, pw, ph); } catch {}
  const halo = g.createRadialGradient(360, 300, 10, 360, 300, 300);
  halo.addColorStop(0, 'rgba(255,225,150,.75)'); halo.addColorStop(.55, 'rgba(242,185,74,.2)'); halo.addColorStop(1, 'rgba(242,185,74,0)');
  g.fillStyle = halo; g.fillRect(px, py, pw, ph);
  g.fillStyle = 'rgba(255,216,107,.8)';
  for (let i = 0; i < 40; i++) { const x = px + 20 + ((i * 97) % (pw - 40)), y = py + 20 + ((i * 53) % (ph - 40)); g.beginPath(); g.arc(x, y, (i % 3) + 1.2, 0, Math.PI * 2); g.fill(); }

  // 地面＋拜墊
  g.fillStyle = 'rgba(40,20,10,.25)'; g.fillRect(px, py + ph - 110, pw, 110);
  g.fillStyle = '#E6B85C'; g.beginPath(); g.ellipse(360, py + ph - 52, 170, 36, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#D8A23A'; g.beginPath(); g.ellipse(360, py + ph - 52, 130, 24, 0, 0, Math.PI * 2); g.fill();

  // 人偶
  try {
    const img = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(avatarSVGString(avatar, 400, 480)));
    g.drawImage(img, 160, py + 40, 400, 480);
  } catch {}

  g.fillStyle = '#FFF1C8'; g.font = `30px ${UI}`; g.textAlign = 'left';
  g.fillText('心靈大廟', px + 24, py + 50);
  g.font = `22px ${UI}`; g.fillStyle = 'rgba(255,240,210,.85)';
  g.fillText(dateLine, px + 24, py + 84);

  // 文字區
  g.textAlign = 'center'; g.fillStyle = '#3B1F17';
  let y = 668;
  if (fortune) {
    g.fillStyle = '#B8322A'; g.font = `900 34px ${SERIF}`;
    g.fillText(`第${cn(fortune.no)}籤・${fortune.level}・${fortune.title}`, 360, y);
    y += 62; g.fillStyle = '#3B1F17'; g.font = `600 36px ${SERIF}`;
    g.fillText(`${fortune.poem[0]}，${fortune.poem[1]}`, 360, y); y += 54;
    g.fillText(`${fortune.poem[2]}，${fortune.poem[3]}`, 360, y); y += 60;
    g.font = `26px ${UI}`; g.fillStyle = '#7A5A4C';
    const line = `祈求${category}：${wish || fortune.gist}`;
    for (const l of wrap(g, line, 560).slice(0, 2)) { g.fillText(l, 360, y); y += 38; }
  } else {
    g.fillStyle = '#B8322A'; g.font = `900 32px ${SERIF}`; g.fillText('今日神明小指引', 360, y);
    y += 70; g.fillStyle = '#3B1F17'; g.font = `600 40px ${SERIF}`;
    for (const l of wrap(g, daily, 580)) { g.fillText(l, 360, y); y += 58; }
  }

  g.textAlign = 'left'; g.font = `28px ${UI}`; g.fillStyle = '#3B1F17';
  g.fillText(`${name} 敬上`, 60, 1018);

  // 燙金印章
  g.save(); g.translate(600, 990); g.rotate(-0.12);
  g.fillStyle = '#C8352B'; g.beginPath(); g.roundRect(-46, -46, 92, 92, 10); g.fill();
  g.strokeStyle = '#F6D98A'; g.lineWidth = 3; g.beginPath(); g.roundRect(-39, -39, 78, 78, 6); g.stroke();
  g.fillStyle = '#F6D98A'; g.font = `900 34px ${SERIF}`; g.textAlign = 'center';
  g.fillText('心', 0, -4); g.fillText('安', 0, 32);
  g.restore();

  return c.toDataURL('image/png');
}

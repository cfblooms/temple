// 殿裡的其他香客：用現成的角色圖，每天每殿隨機 0～2 位跪在神桌前面（比玩家遠一點、小一點）。
// 點一下會冒一句話；進殿後也會自己說一句。每天、每殿固定是同樣的人（用日期當種子）。
// 畫在正殿 SVG 的人偶前面一層（#npcG），各殿的道具圖層蓋在上面，所以不會擋到道具。

const NS = 'http://www.w3.org/2000/svg';

// 各殿香客常說的話（{god} 換成神明名字）
const WISH = {
  main: ['來跟媽祖說說最近的事', '求全家出入平安', '下禮拜要出遠門，來拜一下', '媽祖保佑我媽開刀順利', '來還願的，上次真的有靈'],
  cai: ['這個月業績拜託了', '來摸元寶，沾沾財氣', '想開一間小店，來問問', '求年終多一點', '樂透只差一個號碼…'],
  yue: ['求一個對的人', '想問他是不是正緣', '單身好久了，來報到', '來替好朋友求紅線', '我們下個月結婚，來謝月老'],
  tudi: ['求家裡平平安安', '新家入厝前來拜拜', '土地公保佑生意興隆', '帶了麻糬來給土地公', '每天上班前都會來'],
  wen: ['下禮拜段考，拜託了', '準考證影本放這裡', '求國考上榜', '幫孩子求考運', '論文快寫不完了…'],
  ji: ['來把煩惱搧走', '最近好累，來坐一下', '濟公笑一笑我就好多了', '帶了一壺酒來', '心裡卡卡的'],
  san: ['帶孩子來拜三太子', '明天比賽，求衝勁', '帶了養樂多來', '孩子最近很皮…', '求開車平安'],
  gy: ['心裡好亂，來靜一靜', '求家人身體健康', '來點一盞蓮花燈', '觀音媽，謝謝祢', '想放下一些事'],
  gg: ['來發誓戒菸', '求工作順利、不遇小人', '答應的事一定做到', '來斬斷壞習慣', '關老爺保佑我堅持下去'],
  zs: ['求寶寶健康', '來還願，孩子滿月了', '帶虎頭鞋來', '求一家和樂', '幫女兒求好孕'],
  ts: ['今年犯太歲，來安一下', '來點光明燈', '查查今年要注意什麼', '求今年平平順順', '帶全家的名字來'],
  tg: ['來敬天公', '寫了一張疏文', '天公伯仔保佑', '求今年風調雨順', '初九要來拜'],
  mu: ['來跟母娘說心事', '想家了', '好久沒回來了', '帶了蟠桃', '今天只想被抱一下'],
  ml: ['來摸彌勒的肚子', '笑一笑就沒事了', '把煩惱丟進布袋', '最近要多笑', '彌勒佛好可愛'],
};
// 角色自己的口頭禪（有的話會跟上面混著說）
const SELF = {
  kid: ['阿嬤帶我來的', '我要考一百分！'], junior: ['段考快到了啦'], senior: ['學測拜託拜託'], student: ['期末報告救我'],
  driver: ['跑車前先來拜一下', '今天載到好客人'], worker: ['工地平安最重要'], farmer: ['求今年收成好'],
  engineer: ['專案不要再改需求了…'], finance: ['股市拜託綠轉紅'], lawyer: ['明天開庭'], boss: ['公司尾牙要辦大一點'],
  councilor: ['來跟鄉親打招呼'], mama: ['寶寶在踢我'], ama: ['阿嬤來替孫子求平安'], agong: ['阿公每天都來走走'],
  pilgrim: ['進香團剛到'], pilgrim2: ['走路來的，腳好痠'], bajiu: ['兄弟一起來拜'], taimei: ['來拜一下比較安心啦'],
  miaokou: ['今天要出陣頭'], dad: ['老婆叫我來拜的'], mom: ['買完菜順路來拜'], hoodie: ['滑板摔了，來收驚'],
};

function seedRand(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}

export function initNpc({ svg, chars, me, halls, dayKey, sfx, hit }) {
  const avatar = svg.querySelector('#avatarG');
  const g = document.createElementNS(NS, 'g');
  g.id = 'npcG';
  avatar.parentNode.insertBefore(g, avatar);
  let hall = 'main', people = [], timer = 0;

  function lineFor(p) {
    const r = Math.random(), own = SELF[p.c.id];
    if (own && r < 0.4) return own[Math.floor(Math.random() * own.length)];
    const list = WISH[hall] || WISH.main;
    return list[Math.floor(Math.random() * list.length)];
  }
  function bubble(p, text) {
    p.el.querySelector('.npc-say')?.remove();
    const b = document.createElementNS(NS, 'g');
    b.setAttribute('class', 'npc-say');
    const w = Math.min(150, 14 + text.length * 10.5), x = Math.max(4, Math.min(356 - w, p.x - w / 2)), y = p.top - 30;
    b.innerHTML = `<rect x="${x}" y="${y}" width="${w}" height="22" rx="11" fill="#FFF8EC" stroke="#C89A5A" stroke-width="1"/>
      <path d="M${p.x - 5} ${y + 21} l5 7 l5 -7z" fill="#FFF8EC"/>
      <text x="${x + w / 2}" y="${y + 15}" text-anchor="middle" font-size="10.5" fill="#5A3A1A">${text}</text>`;
    p.el.appendChild(b);
    clearTimeout(p.t); p.t = setTimeout(() => b.remove(), 2400);
  }
  function paint(h) {
    hall = h; clearTimeout(timer);
    for (const p of people) clearTimeout(p.t);
    g.innerHTML = ''; people = [];
    const H = halls[h]; if (!H) return;
    const rnd = seedRand(`${dayKey()}|${h}`);
    const n = rnd() < 0.15 ? 0 : rnd() < 0.55 ? 1 : 2; // 大部分時候有 1～2 位
    const pool = chars.filter((c) => c.id !== me().id && c.kneel);
    const sides = rnd() < 0.5 ? [0, 1] : [1, 0];
    const base = 472 + (H.base - 536) * 0.35; // 神桌前面一排
    for (let i = 0; i < n; i++) {
      const c = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; if (!c) break;
      const left = sides[i] === 0, s = 0.6 * (c.scale || 1), w = 130 * s, ht = 142 * s;
      const x = left ? 80 : 282;
      const el = document.createElementNS(NS, 'g');
      el.setAttribute('class', 'npc');
      el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.setAttribute('aria-label', `香客：${c.name}`);
      el.innerHTML = `<ellipse cx="${x}" cy="${base - 1}" rx="${w * 0.32}" ry="4" fill="#000" opacity=".18"/>
        <image href="${c.kneel}" x="${x - w / 2}" y="${base - ht}" width="${w}" height="${ht}" preserveAspectRatio="xMidYMax meet" filter="url(#lit)"
          ${left ? `transform="translate(${2 * x} 0) scale(-1 1)"` : ''} style="opacity:.96"/>`;
      g.appendChild(el);
      const p = { c, x, top: base - ht, el, t: 0 };
      people.push(p);
      const talk = () => { bubble(p, lineFor(p)); sfx?.pop?.(); hit?.('npc', h); };
      el.addEventListener('click', (e) => { e.stopPropagation(); talk(); });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); talk(); } });
    }
    if (people.length) timer = setTimeout(() => { const p = people[Math.floor(Math.random() * people.length)]; bubble(p, lineFor(p)); }, 2200);
  }
  function hide(on) { g.style.display = on ? 'none' : ''; }
  return { paint, hide };
}

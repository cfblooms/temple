// 每天回來的理由：
// 1. 神明委託：每天 3 件小任務，帶你到不同的殿和攤位走走。每件 +10 福氣幣，三件都做完再 +30。
// 2. 奇遇：參拜時小機率發生的彩蛋（金色聖筊、神明眨眼、小虎爺跑過…），第一次遇到收進「奇遇圖鑑」並送福氣幣。
// 3. 香火：每座殿各自累積「上過香的天數」，神明列的頭像外圈會一圈圈變滿，升等時會提示。
// 存檔：state.quest = { date, list:[{ ev, arg, done }], bonus }，state.qiyu = { id: 次數 }，state.xh = { 殿: { days, last } }

const QUEST_FU = 10, QUEST_ALL = 30, QIYU_FU = 20;
const XH_LV = [1, 3, 7, 14, 30, 60, 100, 180]; // 第 N 級需要的上香天數

export const QIYU = [
  { id: 'goldjiao', name: '金色聖筊', hint: '擲筊時，很少很少見的一種光', text: '筊杯落地閃出金光！是難得一見的金色聖筊。' },
  { id: 'triple', name: '連三聖筊', hint: '同一次參拜，筊杯連續說了三次「是」', text: '連續三個聖筊！神明今天特別肯定你。' },
  { id: 'wink', name: '神明眨眼', hint: '多跟神明打招呼', text: '你好像看到神明對你眨了一下眼睛。' },
  { id: 'smokering', name: '香煙成圈', hint: '上香的時候抬頭看看', text: '香煙在空中繞成一個圓圈，慢慢升上去。' },
  { id: 'kitten', name: '小虎爺巡殿', hint: '在各殿之間走走', text: '一隻小虎爺從殿裡咚咚咚跑過去了！' },
  { id: 'tigersnack', name: '虎爺偷吃', hint: '正殿擺了供品之後', text: '虎爺趁大家不注意，偷偷咬了一口供品…噓。' },
  { id: 'hongbao', name: '天降紅包', hint: '每天第一次上香', text: '一個紅包從樑上飄下來，福氣幣 +66！' },
  { id: 'topqian', name: '上上籤', hint: '抽籤，神明也確認了', text: '抽到上上籤！今天是好日子。' },
  { id: 'moonday', name: '初一十五', hint: '農曆初一或十五來上香', text: '初一十五來上香，香火特別旺。' },
  { id: 'night', name: '夜深人靜', hint: '很晚很晚的時候來上香', text: '深夜的殿裡好安靜，只有你和神明。' },
  { id: 'early', name: '晨鐘', hint: '很早很早的時候來上香', text: '清晨的第一炷香，殿裡還有露水的味道。' },
  { id: 'friend', name: '廟裡熟面孔', hint: '常常跟殿裡的香客聊天', text: '跟香客聊了十次天，大家都認得你了！' },
];

function seedRand(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}

export function initDaily({ $, state, save, sfx, wallet, halls, stalls, qianName, openSheet, dayKey, esc, burst, lunar }) {
  const wrap = $('#sceneWrap');
  // 右上角（供品籃下面）的委託小晶片
  const chip = document.createElement('button');
  chip.type = 'button'; chip.className = 'quest-chip'; chip.id = 'questBtn';
  chip.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h11l3 3v15H5z" fill="#FFF4D8" stroke="#8A5A32" stroke-width="1.3"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#C2372B" stroke-width="1.5"/></svg><span id="questTxt"></span>';
  wrap.appendChild(chip);
  const toast = document.createElement('div');
  toast.className = 'quest-toast'; toast.setAttribute('role', 'status'); toast.hidden = true;
  wrap.appendChild(toast);
  // 一次只顯示一則，後面的排隊（例如委託完成和香火升級同時發生）
  const queue = [];
  let busy = false;
  const next = () => {
    const html = queue.shift(); if (!html) { busy = false; return; }
    busy = true;
    toast.innerHTML = html; toast.hidden = false; toast.classList.remove('in'); void toast.offsetWidth; toast.classList.add('in');
    setTimeout(() => { toast.hidden = true; setTimeout(next, 250); }, 3400);
  };
  const showToast = (html) => { queue.push(html); if (!busy) next(); };

  /* ---------- 神明委託 ---------- */
  const hallIds = Object.keys(halls);
  const H = (h) => halls[h];
  function make() {
    const rnd = seedRand(`quest|${dayKey()}`), pick = (a) => a[Math.floor(rnd() * a.length)];
    const away = hallIds.filter((h) => h !== (state.home || 'main'));
    const h1 = pick(away), h2 = pick(away.filter((h) => h !== h1));
    const third = pick([
      { ev: 'stall', arg: pick(Object.keys(stalls)) }, { ev: 'feed' }, { ev: 'offer' }, { ev: 'npc' }, { ev: 'stall', arg: pick(Object.keys(stalls)) },
    ]);
    return [{ ev: 'incense', arg: h1 }, { ev: rnd() < 0.5 ? 'sheng' : 'draw', arg: h2 }, third].map((q) => ({ ...q, done: false }));
  }
  function today() {
    if (!state.quest || state.quest.date !== dayKey()) { state.quest = { date: dayKey(), list: make(), bonus: false }; save(); }
    return state.quest;
  }
  const label = (q) => {
    const h = q.arg && H(q.arg);
    switch (q.ev) {
      case 'incense': return `到${h.name}給${h.god}上一炷香`;
      case 'sheng': return `在${h.name}擲出一個聖筊`;
      case 'draw': return `在${h.name}抽一支${qianName(q.arg)}`;
      case 'stall': return `去${stalls[q.arg]?.name || '廟埕'}逛逛`;
      case 'feed': return '餵虎爺一條小魚乾（點上方的小魚乾）';
      case 'offer': return '在任何一殿擺一樣供品';
      case 'npc': return '跟殿裡的香客聊聊天（點他一下）';
      default: return '';
    }
  };
  const go = (q) => (q.ev === 'incense' || q.ev === 'sheng' || q.ev === 'draw' ? q.arg : null);
  function paintChip() {
    const t = today(), n = t.list.filter((q) => q.done).length;
    $('#questTxt').textContent = `委託 ${n}/3`;
    chip.classList.toggle('all', n === 3);
    chip.setAttribute('aria-label', `今日神明委託，完成 ${n} 件，共 3 件`);
  }
  function hit(ev, arg) {
    const t = today();
    const q = t.list.find((x) => !x.done && x.ev === ev && (x.arg === undefined || x.arg === arg));
    if (!q) return;
    q.done = true; save();
    wallet.earn(QUEST_FU, '神明委託');
    sfx.chime?.();
    let extra = '';
    if (!t.bonus && t.list.every((x) => x.done)) {
      t.bonus = true; save(); wallet.earn(QUEST_ALL, '委託全部完成');
      state.questDays = (state.questDays || 0) + 1; save();
      extra = `<br><b>今天三件都完成了！</b>再 +${QUEST_ALL}，累積完成 ${state.questDays} 天。`;
    }
    showToast(`<b>委託完成</b>・${esc(label(q))}　福氣 +${QUEST_FU}${extra}`);
    paintChip();
  }

  /* ---------- 奇遇 ---------- */
  function qiyu(id, fx) {
    const e = QIYU.find((x) => x.id === id); if (!e) return false;
    state.qiyu = state.qiyu || {};
    const first = !state.qiyu[id];
    state.qiyu[id] = (state.qiyu[id] || 0) + 1; save();
    if (first) wallet.earn(QIYU_FU, '奇遇');
    fx?.();
    showToast(`<b>✦ 奇遇・${e.name}</b><br>${e.text}${first ? `<br>第一次遇到，收進奇遇圖鑑，福氣 +${QIYU_FU}` : ''}`);
    return true;
  }
  const chance = (p) => Math.random() < p;

  /* ---------- 香火 ---------- */
  function xh(h) {
    const r = state.xh?.[h] || { days: 0, last: '' };
    let lv = 0; while (lv < XH_LV.length && r.days >= XH_LV[lv]) lv++;
    const lo = lv ? XH_LV[lv - 1] : 0, hi = XH_LV[lv] ?? lo;
    return { days: r.days, lv, next: hi, pct: lv >= XH_LV.length ? 1 : (r.days - lo) / (hi - lo) };
  }
  function incense(h) {
    state.xh = state.xh || {};
    const r = state.xh[h] || (state.xh[h] = { days: 0, last: '' });
    if (r.last === dayKey()) return null;
    const before = xh(h).lv;
    r.days++; r.last = dayKey(); save();
    const now = xh(h);
    return { up: now.lv > before, ...now };
  }

  /* ---------- 面板：委託＋圖鑑＋香火 ---------- */
  function open(goHall) {
    const t = today();
    const found = QIYU.filter((e) => state.qiyu?.[e.id]).length;
    const body = openSheet('今日神明委託', `
      <p class="hint">每天三件小委託，到不同的殿走走。每件福氣 +${QUEST_FU}，三件都做完再 +${QUEST_ALL}。明天會換新的。</p>
      <ol class="quest-list">${t.list.map((q, i) => `<li class="${q.done ? 'done' : ''}"><span>${q.done ? '✓' : i + 1}</span><b>${esc(label(q))}</b>${!q.done && go(q) ? `<button type="button" class="chip" data-go="${go(q)}">過去</button>` : ''}</li>`).join('')}</ol>
      <h3 class="quest-h">奇遇圖鑑 <small>${found}/${QIYU.length}</small></h3>
      <div class="qiyu-grid">${QIYU.map((e) => { const n = state.qiyu?.[e.id]; return `<div class="qiyu ${n ? 'on' : ''}"><b>${n ? e.name : '？？？'}</b><small>${n ? `遇過 ${n} 次` : esc(e.hint)}</small></div>`; }).join('')}</div>
      <h3 class="quest-h">各殿香火</h3>
      <p class="hint">每天在一座殿上香，那座殿的香火就 +1 天。神明列頭像的金色外圈滿了就升一級。</p>
      <div class="xh-grid">${hallIds.map((h) => { const x = xh(h); return `<div class="xh"><img src="${H(h).face}" alt=""><b>${H(h).god}</b><small>${x.lv ? `Lv.${x.lv}` : '還沒拜過'}・${x.days} 天</small></div>`; }).join('')}</div>`);
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) goHall(b.dataset.go); });
  }

  paintChip();
  return { hit, qiyu, chance, xh, incense, open, paintChip, chip, showToast, isMoonDay: () => { const L = lunar(); return !!L && (L.day === 1 || L.day === 15); } };
}

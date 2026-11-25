// 每天回來的理由：
// 1. 每日輕任務：每天 3 個選項，完成其中 1 件就能領「今日印章」；另外兩件是加碼。一週任 3 天有印章就能領回顧卡。
// 2. 奇遇：參拜時小機率發生的彩蛋（金色聖筊、神明眨眼、小虎爺跑過…），第一次遇到收進「奇遇圖鑑」並送福氣幣。
// 3. 香火：每座殿各自累積「上過香的天數」，神明列的頭像外圈會一圈圈變滿，升等時會提示。
// 存檔：state.quest = { v:2, date, list:[{ id, done }], claimed, extra }，state.stampDays = [日期]，state.weekClaim，state.qiyu = { id: 次數 }，state.xh = { 殿: { days, last } }

const STAMP_FU = 15, EXTRA_FU = 5, WEEK_FU = 30, QIYU_FU = 20; // 今日印章、加碼（每天最多 2 次）、一週任三天
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
  { id: 'lionwink', name: '石獅眨眼', hint: '進廟前摸摸山門的石獅', text: '石獅子好像對你眨了一下眼睛，嘴角還翹了一下。' },
  { id: 'friend', name: '廟裡熟面孔', hint: '常常跟殿裡的香客聊天', text: '跟香客聊了十次天，大家都認得你了！' },
];

function seedRand(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}

import { qiyuBoost } from './testmode.js';
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
    clearTimeout(toastT); toastT = setTimeout(() => { toast.hidden = true; setTimeout(next, 200); }, 2400);
  };
  let toastT = 0;
  // 點一下就收起來；手指一碰遊戲畫面也收起來，不擋著玩
  const dismiss = () => { if (toast.hidden) return; clearTimeout(toastT); toast.hidden = true; setTimeout(next, 200); };
  toast.addEventListener('click', dismiss);
  wrap.addEventListener('pointerdown', (e) => { if (e.target !== toast) dismiss(); }, true);
  const showToast = (html) => { queue.push(html); if (!busy) next(); };

  const hallIds = Object.keys(halls);
  const H = (h) => halls[h];
  /* ---------- 每日輕任務：每天三選一，完成一件就能領今日印章 ---------- */
  // 依「第一階段每日輕任務規劃」：1 項超輕＋1 項參拜＋1 項探索；不看擲筊／抽籤結果；漏一天不扣任何東西。
  const TASKS = {
    greet: { kind: 'light', name: '向今天的神明問安', how: '點一下神像', sec: '約 20 秒', act: 'deity' },
    tiger: { kind: 'light', name: '摸摸虎爺，看看祂今天的反應', how: '點一下供桌下的虎爺', sec: '約 20 秒', act: 'tiger' },
    lion: { kind: 'light', name: '摸摸山門的石獅', how: '逛廟 → 山門，摸一隻就算', sec: '約 20 秒', act: 'gate' },
    card: { kind: 'light', name: '看一眼今日祈福卡', how: '打開祈福卡', sec: '約 20 秒', act: 'card' },
    candle: { kind: 'rite', name: '點亮一支蠟燭', how: '一支就算，也可以用「點一下點燭」', sec: '約 30 秒', act: 'candle' },
    incense: { kind: 'rite', name: '上一炷香', how: '在任何一殿上香都算', sec: '約 30 秒', act: 'incense' },
    jiao: { kind: 'explore', name: '向神明請示一次', how: '擲一次筊就好，結果如何都算完成', sec: '約 40 秒', act: 'jiao' },
    draw: { kind: 'explore', name: '為一件在意的事求籤', how: '搖到籤、看到籤號就算', sec: '約 1 分鐘', act: 'draw' },
    offer: { kind: 'explore', name: '擺上一份供品', how: '免費的鮮花、水果也可以', sec: '約 40 秒', act: 'offer' },
  };
  const KINDS = ['light', 'rite', 'explore'];
  const ids = (k) => Object.keys(TASKS).filter((id) => TASKS[id].kind === k);
  function make() {
    const rnd = seedRand(`quest2|${dayKey()}`);
    return KINDS.map((k) => { const a = ids(k); return { id: a[Math.floor(rnd() * a.length)], done: false }; });
  }
  function today() {
    if (!state.quest || state.quest.date !== dayKey() || state.quest.v !== 2) { state.quest = { v: 2, date: dayKey(), list: make(), claimed: false, extra: 0 }; save(); }
    return state.quest;
  }
  // 印章：state.stampDays = ['2026-11-24', ...]（只記日期，不記連續）
  const stampDays = () => state.stampDays || (state.stampDays = []);
  function weekKeys(d = new Date()) { // 這週一到週日
    const m = new Date(d); m.setHours(12, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => { const x = new Date(m); x.setDate(m.getDate() + i); return dayKey(x); });
  }
  const weekStamped = () => weekKeys().filter((k) => stampDays().includes(k)).length;
  const weekKey = () => weekKeys()[0];
  const weekReady = () => weekStamped() >= 3 && state.weekClaim !== weekKey();
  const doneN = () => today().list.filter((q) => q.done).length;
  function paintChip() {
    const t = today(), n = doneN();
    const ready = (n && !t.claimed) || weekReady();
    $('#questTxt').textContent = ready ? '印章待領' : t.claimed ? '今日已收下' : '今日小任務 0/1';
    chip.classList.toggle('all', !!ready);
    chip.classList.toggle('calm', t.claimed && !ready);
    chip.setAttribute('aria-label', ready ? '今日印章待領，點開領取' : t.claimed ? '今天的印章已經收下' : '今日小任務，挑一件做就能領今日印章');
  }
  function hit(ev) {
    const t = today();
    const q = t.list.find((x) => !x.done && x.id === ev);
    if (!q) return;
    q.done = true;
    const first = doneN() === 1;
    let extra = '';
    if (!first && t.extra < 2) { t.extra++; wallet.earn(EXTRA_FU, '加碼小任務'); extra = `　加碼福氣 +${EXTRA_FU}`; }
    save(); sfx.chime?.();
    showToast(first
      ? `<b>小任務完成</b>・${esc(TASKS[ev].name)}<br>點右上角「印章待領」收下今日印章`
      : `<b>加碼完成</b>・${esc(TASKS[ev].name)}${extra}`);
    paintChip();
  }
  function claim() {
    const t = today(); if (t.claimed || !doneN()) return;
    t.claimed = true;
    if (!stampDays().includes(dayKey())) stampDays().push(dayKey());
    while (stampDays().length > 120) stampDays().shift();
    save(); wallet.earn(STAMP_FU, '今日印章'); sfx.chime?.();
    showToast(`<b>今天的心意已收下</b>　今日印章 ×1、福氣 +${STAMP_FU}<br>你可以繼續逛逛，也可以先休息。`);
    paintChip();
  }
  function claimWeek() {
    if (!weekReady()) return;
    state.weekClaim = weekKey(); state.weekCards = (state.weekCards || 0) + 1; save();
    wallet.earn(WEEK_FU, '一週回望'); sfx.chime?.();
    showToast(`<b>一週回望</b>　這週來了 ${weekStamped()} 天，收下第 ${state.weekCards} 張回顧卡、福氣 +${WEEK_FU}`);
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
  const chance = (p) => Math.random() < (qiyuBoost ? Math.max(p, .5) : p); // 試玩模式可以調成很容易遇到

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
  function open(goAct) {
    const t = today();
    const found = QIYU.filter((e) => state.qiyu?.[e.id]).length;
    const back = !t.claimed && !doneN() && state.stampDays?.length && !stampDays().includes(dayKey(new Date(Date.now() - 864e5)));
    const n = doneN(), wk = weekKeys(), ws = weekStamped();
    const body = openSheet('今日在廟裡', `
      <p class="hint">${back ? '歡迎回來，之前收下的印章都還在。今天想從哪裡開始？' : '挑一件想做的小事，<b>完成其中一件</b>就能領今日印章。另外兩件是加碼，不做也沒關係。'}</p>
      <ol class="quest-list">${t.list.map((q) => { const T = TASKS[q.id]; return `<li class="${q.done ? 'done' : ''}">
        <span>${q.done ? '✓' : ''}</span><div class="q-txt"><b>${esc(T.name)}</b><small>${esc(T.how)}・${T.sec}</small></div>
        ${q.done ? '<em>完成</em>' : `<button type="button" class="chip" data-act="${T.act}">前往</button>`}</li>`; }).join('')}</ol>
      <div class="stamp-row">
        <div class="day-stamp ${t.claimed ? 'on' : ''}" aria-hidden="true">${t.claimed ? '印' : ''}</div>
        <div><b>今日印章</b><small>${t.claimed ? '已收下' : n ? '可以領了' : '完成任一件就能領'}・加碼已領 ${t.extra}/2</small></div>
        ${!t.claimed && n ? '<button type="button" class="btn gold" id="qClaim">收下今日印章</button>' : ''}
      </div>
      <h3 class="quest-h">一週回望 <small>這週 ${ws} 天・任 3 天就能領</small></h3>
      <div class="week-stamps">${wk.map((k, i) => `<i class="${stampDays().includes(k) ? 'on' : ''}${k === dayKey() ? ' now' : ''}"><span>${'一二三四五六日'[i]}</span></i>`).join('')}</div>
      ${weekReady() ? '<button type="button" class="btn gold" id="qWeek">領這週的回顧卡</button>' : state.weekClaim === weekKey() ? '<p class="hint">這週的回顧卡已經收下了。</p>' : '<p class="hint">不用連續，漏掉的日子也不會清空。</p>'}
      <h3 class="quest-h">奇遇圖鑑 <small>${found}/${QIYU.length}</small></h3>
      <div class="qiyu-grid">${QIYU.map((e) => { const c = state.qiyu?.[e.id]; return `<div class="qiyu ${c ? 'on' : ''}"><b>${c ? e.name : '？？？'}</b><small>${c ? `遇過 ${c} 次` : esc(e.hint)}</small></div>`; }).join('')}</div>
      <h3 class="quest-h">各殿香火</h3>
      <p class="hint">每天在一座殿上香，那座殿的香火就 +1 天。神明列頭像的金色外圈滿了就升一級。</p>
      <div class="xh-grid">${hallIds.map((h) => { const x = xh(h); return `<div class="xh"><img src="${H(h).face}" alt=""><b>${H(h).god}</b><small>${x.lv ? `Lv.${x.lv}` : '還沒拜過'}・${x.days} 天</small></div>`; }).join('')}</div>`);
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (b) { goAct(b.dataset.act); return; }
      if (e.target.closest('#qClaim')) { claim(); open(goAct); return; }
      if (e.target.closest('#qWeek')) { claimWeek(); open(goAct); }
    });
  }

  paintChip();
  return { hit, qiyu, chance, xh, incense, open, paintChip, chip, showToast, isMoonDay: () => { const L = lunar(); return !!L && (L.day === 1 || L.day === 15); } };
}

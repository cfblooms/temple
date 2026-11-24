// 參拜流程進度條：點燭 → 上香 → 抽籤 → 擲筊確認。
// 每一步都看得到「現在在哪、還剩幾步、這一步要做什麼」；可以收起來，在「今日小任務」裡再打開。
// main.js 每次狀態改變就呼叫 paint(status)，這裡只負責畫。
const STEPS = ['點燭', '上香', '抽籤', '擲筊確認'];
const TIP = [
  '按住打火機，移到燭芯的虛線圈停一下',
  '拿香到燭火上點著，再插進香爐',
  '選想問的方向，搖籤筒',
  '抽到籤還要擲出聖筊，才算數',
];

export function initGuide({ wrap, state, save, sfx }) {
  const el = document.createElement('div');
  el.className = 'rite';
  el.setAttribute('role', 'status');
  el.hidden = true;
  el.innerHTML = `
    <ol class="rite-dots" aria-hidden="true">${STEPS.map(() => '<li></li>').join('')}</ol>
    <b class="rite-h"></b>
    <button type="button" class="rite-x" aria-label="收起參拜流程提示">×</button>`;
  wrap.appendChild(el); // 小小一塊疊在殿畫面左上（節慶燈籠下面），不蓋神像
  let doneTimer = 0, last = '';

  el.querySelector('.rite-x').addEventListener('click', () => {
    state.guide = { ...(state.guide || {}), off: true }; save();
    el.hidden = true; sfx?.knock?.();
  });

  /** status: { step: 0..3, sub?: '已點亮 1／2', tip?: string, done?: bool, key: 這次參拜的識別（殿＋日期） } */
  function paint(st) {
    if (state.guide?.off || !st) { el.hidden = true; return; }
    if (st.done) {
      // 完成時亮一下就收起來；同一殿同一天只亮一次
      if (last === st.key + '|done' || !last.startsWith(st.key)) { el.hidden = true; last = st.key + '|done'; return; }
      last = st.key + '|done';
      el.classList.add('ok');
      el.querySelector('.rite-h').textContent = '參拜完成 ✓';
      el.querySelectorAll('.rite-dots li').forEach((li) => { li.className = 'done'; });
      el.hidden = false;
      clearTimeout(doneTimer); doneTimer = setTimeout(() => { el.hidden = true; }, 3200);
      return;
    }
    clearTimeout(doneTimer);
    last = st.key + '|' + st.step;
    el.classList.remove('ok');
    el.querySelector('.rite-h').textContent = `參拜 ${st.step + 1}／${STEPS.length}・${STEPS[st.step]}${st.sub ? ` ${st.sub}` : ''}`;
    el.querySelectorAll('.rite-dots li').forEach((li, i) => { li.className = i < st.step ? 'done' : i === st.step ? 'now' : ''; });
    el.title = st.tip || TIP[st.step];
    el.hidden = false;
  }
  function reset() { state.guide = { ...(state.guide || {}), off: false }; save(); last = ''; }
  return { paint, reset, el };
}

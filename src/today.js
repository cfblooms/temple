// 「今日」：把原本兩顆浮在場景上的膠囊（節慶倒數、今日小任務）合成一顆。
// 點開是一張小面板，再從面板進到原本的節慶印章冊、每日輕任務。
// 原本的兩顆按鈕還留在畫面裡（CSS 藏起來），這裡只是讀它們的文字、幫忙點它們，所以兩邊的邏輯都不用改。
export function initToday({ $, wrap, openSheet, closeSheet, sfx }) {
  const fest = $('#festBtn'), quest = $('#questBtn');
  const chip = document.createElement('button');
  chip.type = 'button'; chip.className = 'today-chip'; chip.id = 'todayBtn';
  chip.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="#FFF4D8" stroke="#8A5A32" stroke-width="1.4"/><path d="M3.5 9.5h17" stroke="#C2372B" stroke-width="2"/><path d="M8 3v4M16 3v4" stroke="#8A5A32" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="15" r="2.6" fill="#E0443E"/></svg><b>今日</b><span id="todayTxt"></span>';
  wrap.appendChild(chip);

  const festTxt = () => $('#festTxt')?.textContent || '節慶';
  const questTxt = () => $('#questTxt')?.textContent || '';
  const questReady = () => quest?.classList.contains('all');
  const festToday = () => fest?.classList.contains('today');

  function paint() {
    // 最要緊的一件事寫在膠囊上：印章待領 > 今天的節慶 > 小任務進度
    const q = questTxt().replace('今日小任務 ', '').replace('今日已收下', '✓');
    const t = questReady() ? '印章待領' : festToday() ? festTxt() : q;
    $('#todayTxt').textContent = t;
    chip.classList.toggle('ready', !!questReady());
    chip.classList.toggle('fest', !questReady() && !!festToday());
    chip.setAttribute('aria-label', `今日：${questReady() ? '今日印章待領' : questTxt()}；${festTxt()}。點開看今天有什麼`);
  }
  const mo = new MutationObserver(paint);
  for (const el of [fest, quest]) if (el) mo.observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
  paint();

  chip.addEventListener('click', () => {
    sfx?.knock?.();
    const body = openSheet('今日', `
      <p class="hint">今天有什麼，都在這裡。不用每天全做，漏掉的日子也不會清空。</p>
      <div class="today-list">
        <button type="button" class="today-row${questReady() ? ' hot' : ''}" data-go="quest">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h11l3 3v15H5z" fill="#FFF4D8" stroke="#8A5A32" stroke-width="1.3"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#C2372B" stroke-width="1.5"/></svg>
          <span><b>每日小任務</b><small>${questReady() ? '印章待領，點開收下' : questTxt()}</small></span><i aria-hidden="true">›</i>
        </button>
        <button type="button" class="today-row${festToday() ? ' hot' : ''}" data-go="fest">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1v3" stroke="#7A3A1A" stroke-width="1.6"/><ellipse cx="12" cy="13" rx="8" ry="8.5" fill="#E0443E"/><path d="M12 4.5c-3 2-3 15 0 17M12 4.5c3 2 3 15 0 17" stroke="#FFB43A" stroke-width="1.2" fill="none"/><rect x="8" y="3.5" width="8" height="2.4" rx="1" fill="#FFC94A"/><rect x="8" y="20" width="8" height="2.4" rx="1" fill="#FFC94A"/></svg>
          <span><b>節慶印章冊</b><small>${festToday() ? `今天：${festTxt()}` : `下一個：${festTxt()}`}</small></span><i aria-hidden="true">›</i>
        </button>
      </div>`);
    body.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
      const go = b.dataset.go === 'quest' ? quest : fest;
      closeSheet(); setTimeout(() => go?.click(), 60);
    }));
  });
  return { chip, paint };
}

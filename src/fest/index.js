// 節慶入口：場景左上角的燈籠按鈕 → 節慶印章冊；節日當天可以玩那個節慶的小遊戲並蓋章。
// 平常日也能「試玩」（不蓋章），方便預覽。
import { FESTIVALS, festById, todayFest, nextDates, makeStage, lunarOf } from './core.js';
import { GAMES as G1 } from './games-1.js';
import { GAMES as G2 } from './games-2.js';

const GAMES = { ...G1, ...G2 };
const STAMP_DAYS = 330; // 一年內蓋過的章算「今年已蓋」

export function initFest({ $, state, save, say, sfx, openSheet, closeSheet, esc, dayKey, updateFish, chars, goHall }) {
  const wrap = $('#sceneWrap');
  wrap.insertAdjacentHTML('beforeend', `<div id="festHost" class="fest-host" hidden></div>
    <button type="button" class="fest-chip" id="festBtn" aria-label="節慶活動與印章冊"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1v3" stroke="#7A3A1A" stroke-width="1.6"/><ellipse cx="12" cy="13" rx="8" ry="8.5" fill="#E0443E"/><path d="M12 4.5c-3 2-3 15 0 17M12 4.5c3 2 3 15 0 17" stroke="#FFB43A" stroke-width="1.2" fill="none"/><rect x="8" y="3.5" width="8" height="2.4" rx="1" fill="#FFC94A"/><rect x="8" y="20" width="8" height="2.4" rx="1" fill="#FFC94A"/></svg><span id="festTxt"></span></button>`);
  const host = $('#festHost'), btn = $('#festBtn');
  state.festStamps ||= {};

  const stamped = (id) => {
    const s = state.festStamps[id]; if (!s) return false;
    const [y, m, d] = s.split('-').map(Number);
    return (Date.now() - new Date(y, m - 1, d).getTime()) / 864e5 < STAMP_DAYS;
  };
  const playable = (id) => !!GAMES[id];

  function paintChip() {
    const t = todayFest();
    if (t && playable(t.f.id)) {
      btn.classList.add('today');
      $('#festTxt').textContent = t.f.id === 'chunjie' && t.L ? `初${'一二三四五'[t.L.day - 1]}・${GAMES.chunjie.days[t.L.day - 1]}` : `今天${t.f.name}`;
      btn.setAttribute('aria-label', `今天是${t.f.name}，來玩${t.f.game}`);
      return;
    }
    btn.classList.remove('today');
    const nd = nextDates();
    const soon = FESTIVALS.filter((f) => nd[f.id] && nd[f.id].days > 0).sort((a, b) => nd[a.id].days - nd[b.id].days)[0];
    $('#festTxt').textContent = soon ? `${soon.name}・${nd[soon.id].days}天` : '節慶';
    btn.setAttribute('aria-label', soon ? `節慶印章冊，${soon.name}還有 ${nd[soon.id].days} 天` : '節慶印章冊');
  }

  const md = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  function openAlbum() {
    const t = todayFest(), nd = nextDates();
    const list = [...FESTIVALS].sort((a, b) => (nd[a.id]?.days ?? 999) - (nd[b.id]?.days ?? 999));
    const got = FESTIVALS.filter((f) => stamped(f.id)).length;
    const body = openSheet('節慶印章冊', `
      <p class="hint">每到一個節慶，當天來廟裡玩那天的小遊戲就能蓋一枚章，一年集滿 ${FESTIVALS.length} 枚。節慶前三天，左上角的燈籠會開始倒數。今年已經蓋了 <b>${got}</b> 枚。</p>
      ${t && playable(t.f.id) ? `<button type="button" class="btn" data-go="${t.f.id}">今天是${t.f.name}：${t.f.game}</button>` : ''}
      <div class="stamp-grid">${list.map((f) => {
        const n = nd[f.id], s = stamped(f.id);
        return `<div class="stamp${s ? ' got' : ''}${t?.f.id === f.id ? ' now' : ''}">
          <div class="stamp-seal" aria-hidden="true">${s ? f.name : ''}</div>
          <div class="stamp-info"><b>${f.name}</b><span>${f.game}</span><small>${f.date}${n ? `・${n.days === 0 ? '今天' : `${md(n.date)}，還有 ${n.days} 天`}` : ''}</small></div>
          ${playable(f.id) ? `<button type="button" class="chip" data-try="${f.id}">${t?.f.id === f.id ? '開始' : '試玩'}</button>` : '<span class="chip soon">籌備中</span>'}
        </div>`;
      }).join('')}</div>
      <p class="muted small">試玩不會蓋章，只有節日當天玩才會蓋。</p>`);
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-go],[data-try]'); if (!b) return;
      const id = b.dataset.go || b.dataset.try;
      if (id === 'chunjie' && !(t && t.f.id === 'chunjie')) { pickDay(); return; }
      closeSheet(); start(id, { real: t?.f.id === id });
    });
  }
  // 春節試玩：選初幾
  function pickDay() {
    const body = openSheet('春節試玩：選一天', `<p>春節初一到初五每天的小遊戲都不一樣。</p>
      <div class="day-list">${GAMES.chunjie.days.map((d, i) => `<button type="button" class="day-btn" data-d="${i + 1}"><b>初${'一二三四五'[i]}</b><span>${d}</span></button>`).join('')}</div>`);
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (!b) return; closeSheet(); start('chunjie', { real: false, day: +b.dataset.d }); });
  }

  let stage = null, hidden = [];
  function start(id, { real = false, day } = {}) {
    const f = festById(id), game = GAMES[id];
    if (!game) return;
    if (stage) stop(true);
    // 收起殿裡的按鈕列和神明列，小遊戲用自己的
    hidden = [...document.querySelectorAll('nav.bar:not([hidden]), #godBar, #festBtn')];
    hidden.forEach((el) => { el.dataset.festHid = '1'; el.hidden = true; });
    host.hidden = false; wrap.classList.add('festing');
    stage = makeStage(host, { sfx, say, onClose: () => stop() });
    const L = lunarOf(new Date());
    sfx.chime();
    game.play(stage, {
      real, day: day || (id === 'chunjie' && L ? Math.min(5, L.day) : 1),
      chars, me: chars.me(), esc, state, save,
      goHall: (h) => { stop(true); if (h) goHall(h); },
      done: (text) => finish(f, real, text),
    });
  }
  function finish(f, real, text) {
    let extra = '';
    if (real && state.festStamps[f.id] !== dayKey()) { // 春節初一到初五每天都有
      const first = !stamped(f.id);
      state.festStamps[f.id] = dayKey(); state.fish += 6; save(); updateFish?.();
      extra = first ? `<br>節慶印章冊蓋上「${f.name}」，虎爺叼來小魚乾 ×6。` : '<br>虎爺叼來小魚乾 ×6，明天再來。';
    } else if (!real) extra = '<br>（這是試玩，節日當天來玩才會蓋章。）';
    say(`${text}${extra}`, 'god');
    sfx.chime(); sfx.buzz?.([20, 50, 30]);
    stage?.buttons([{ label: '回到殿裡', primary: true, on: () => stop() }, { label: '印章冊', on: () => { stop(); openAlbum(); } }]);
    paintChip();
  }
  function stop(quiet) {
    stage?.destroy(); stage = null;
    host.hidden = true; wrap.classList.remove('festing');
    hidden.forEach((el) => { if (el.dataset.festHid) { el.hidden = false; delete el.dataset.festHid; } });
    hidden = [];
    if (!quiet) say('回到殿裡了。左上角的燈籠可以看節慶印章冊。');
  }

  btn.addEventListener('click', () => {
    sfx.knock();
    const t = todayFest();
    if (t && playable(t.f.id)) start(t.f.id, { real: true }); else openAlbum();
  });
  paintChip();
  return {
    openAlbum, start, stop, paintChip,
    greetLine() { // 進廟的招呼加一句節慶
      const t = todayFest();
      if (t && playable(t.f.id)) return state.festStamps[t.f.id] === dayKey() ? '' : `今天是<b>${t.f.name}</b>，點左上角的燈籠玩「${t.f.game}」，可以蓋節慶印章。`;
      const nd = nextDates(), soon = FESTIVALS.find((f) => nd[f.id] && nd[f.id].days > 0 && nd[f.id].days <= 3);
      return soon ? `再 ${nd[soon.id].days} 天就是<b>${soon.name}</b>了，當天記得回來玩「${soon.game}」。` : '';
    },
  };
}

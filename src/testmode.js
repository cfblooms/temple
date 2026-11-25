// 試玩模式（給做遊戲的人用）：網址加 ?test=1 打開，?test=0 關掉。
// 打開後：
// 1. 用另一份存檔（第一次會複製正式存檔），正式進度不會被弄亂。
// 2. 可以「假裝今天是哪一天」：整個遊戲的日期（農曆、節慶廟、每日次數、法會、補財庫好日子…）都跟著變。
// 3. 奇遇可以調成很容易遇到。
// 一般玩家網址沒有 ?test，這支檔案什麼都不做。
const FLAG = 'cyber-temple.test', OFF = 'cyber-temple.test.offset', BOOST = 'cyber-temple.test.qiyu';
const RealDate = Date;
const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

let on = false;
try {
  const q = new URLSearchParams(location.search).get('test');
  if (q === '0' || q === 'off') { ls.del(FLAG); ls.del(OFF); ls.del(BOOST); }
  else if (q !== null) ls.set(FLAG, '1');
} catch {}
on = ls.get(FLAG) === '1';

export const TEST = on;
const offset = on ? (+ls.get(OFF) || 0) : 0;
export const qiyuBoost = on && ls.get(BOOST) === '1';

// 時間平移：沒帶參數的 new Date() 和 Date.now() 都加上 offset
if (on && offset) {
  class TestDate extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + offset); }
    static now() { return RealDate.now() + offset; }
  }
  globalThis.Date = TestDate;
}

/* ---------- 試玩面板 ---------- */
const pad = (n) => String(n).padStart(2, '0');
const midnight = (d) => new RealDate(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const x = new RealDate(d); x.setDate(x.getDate() + n); return x; };
const md = (d) => `${d.getMonth() + 1}/${d.getDate()}`;

function setNow(target) { // target：想假裝的時間（RealDate）
  ls.set(OFF, String(Math.round(target.getTime() - RealDate.now())));
  location.reload();
}
function jumpToDay(day, hour) { // 跳到某一天，時間保留現在（或指定幾點）
  const now = new Date(), t = new RealDate(day.getFullYear(), day.getMonth(), day.getDate(), hour ?? now.getHours(), hour == null ? now.getMinutes() : 0);
  setNow(t);
}
// 從今天（真實日期）往後找，第一個符合的日子
function findNext(test) {
  const t0 = midnight(new RealDate());
  for (let i = 0; i < 400; i++) { const d = addDays(t0, i); if (test(d)) return d; }
  return null;
}

export function initTestPanel({ openSheet, closeSheet, festivals, lunarOf, lunarText, deityFests, festMod, saveKey, realKey }) {
  if (!on) return;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'testBtn'; btn.className = 'test-chip';
  const now = new Date();
  btn.textContent = `試${offset ? md(now) : "玩"}`;
  btn.setAttribute('aria-label', '試玩模式面板');
  document.body.appendChild(btn);

  const isLunar = (m, d) => (x) => { const L = lunarOf(x); return !!L && !L.leap && L.mon === m && L.day === d; };
  const nextOf = (when) => findNext((d) => when(d, lunarOf(d)));

  function open() {
    const n = new Date(), L = lunarText(n);
    const fest = festivals.map((f) => ({ f, d: nextOf(f.when) }));
    const gods = deityFests.map(([m, a, , name]) => ({ name, d: findNext(isLunar(m, a)), m, a }));
    const moon = [['初一', 1], ['十五', 15], ['做牙（初二）', 2], ['做牙（十六）', 16]].map(([name, day]) => ({ name, d: findNext((x) => { const l = lunarOf(x); return !!l && !l.leap && l.day === day; }) }));
    const dBtn = (d, label = '跳到這天', hour) => d ? `<button type="button" class="chip" data-jump="${d.getTime()}"${hour != null ? ` data-h="${hour}"` : ''}>${label} ${md(d)}</button>` : '';
    const body = openSheet('試玩模式', `
      <p class="hint">現在假裝是 <b>${n.getFullYear()}/${n.getMonth() + 1}/${n.getDate()} ${pad(n.getHours())}:${pad(n.getMinutes())}</b>　${L || ''}${offset ? '' : '（真實的今天）'}<br>
      試玩用另一份存檔，不會弄亂正式進度。「每天一次」的東西玩過了，按「下一天」就能再玩。</p>
      <div class="row test-row">
        <button type="button" class="btn ghost" data-step="-1">前一天</button>
        <button type="button" class="btn gold" data-step="1">下一天</button>
        <button type="button" class="btn ghost" id="tReal">回到真實今天</button>
      </div>
      <div class="row test-row">
        <input type="date" id="tDate" value="${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}">
        <input type="time" id="tTime" value="${pad(n.getHours())}:${pad(n.getMinutes())}">
        <button type="button" class="btn gold" id="tGo">跳過去</button>
      </div>

      <h3 class="quest-h">節慶小遊戲</h3>
      <p class="muted small">「直接玩」不用換日期；「跳到這天」會把日期換成節日當天，可以看到燈籠倒數、節慶廟、蓋章。</p>
      <div class="test-list">${fest.map(({ f, d }) => `<div class="test-item"><div><b>${f.name}</b><small>${f.game}・${f.date}</small></div>
        <div class="test-acts"><button type="button" class="chip" data-play="${f.id}">直接玩</button>${dBtn(d, '跳到', f.id === 'duanwu' ? 12 : null)}</div></div>`).join('')}</div>

      <h3 class="quest-h">神明聖誕（節慶廟、酬神戲）</h3>
      <div class="test-list">${gods.map(({ name, d }) => `<div class="test-item"><div><b>${name}</b></div><div class="test-acts">${dBtn(d, '跳到')}</div></div>`).join('')}</div>

      <h3 class="quest-h">初一十五・做牙（全廟巡禮）</h3>
      <div class="test-list">${moon.map(({ name, d }) => `<div class="test-item"><div><b>${name}</b></div><div class="test-acts">${dBtn(d, '跳到')}</div></div>`).join('')}</div>

      <h3 class="quest-h">奇遇</h3>
      <div class="row test-row"><button type="button" class="btn ${qiyuBoost ? 'gold' : 'ghost'}" id="tQiyu">${qiyuBoost ? '奇遇很容易遇到：開' : '奇遇很容易遇到：關'}</button></div>

      <h3 class="quest-h">存檔</h3>
      <div class="row test-row">
        <button type="button" class="btn ghost" id="tCopy">重新複製正式存檔</button>
        <button type="button" class="btn ghost" id="tWipe">從頭開始（新玩家）</button>
      </div>
      <div class="row test-row"><button type="button" class="btn ghost" id="tExit">離開試玩模式</button></div>`);

    body.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.step) { const d = new Date(); d.setDate(d.getDate() + +b.dataset.step); setNow(new RealDate(d.getTime())); }
      else if (b.dataset.jump) jumpToDay(new RealDate(+b.dataset.jump), b.dataset.h != null ? +b.dataset.h : null);
      else if (b.dataset.play) { closeSheet(); festMod.start(b.dataset.play, { real: false }); }
      else if (b.id === 'tReal') { ls.del(OFF); location.reload(); }
      else if (b.id === 'tGo') {
        const [y, m, d] = (body.querySelector('#tDate').value || '').split('-').map(Number);
        const [hh, mm] = (body.querySelector('#tTime').value || '12:00').split(':').map(Number);
        if (y && m && d) setNow(new RealDate(y, m - 1, d, hh || 0, mm || 0));
      }
      else if (b.id === 'tQiyu') { if (qiyuBoost) ls.del(BOOST); else ls.set(BOOST, '1'); location.reload(); }
      else if (b.id === 'tCopy') { const r = ls.get(realKey); if (r) ls.set(saveKey, r); else ls.del(saveKey); location.reload(); }
      else if (b.id === 'tWipe') { ls.del(saveKey); ls.set(saveKey + '.fresh', '1'); location.reload(); }
      else if (b.id === 'tExit') { ls.del(FLAG); ls.del(OFF); ls.del(BOOST); location.href = location.pathname; }
    });
  }
  btn.addEventListener('click', open);
}

// 試玩存檔：第一次打開時複製正式存檔
export function testSaveKey(realKey) {
  if (!on) return realKey;
  const k = realKey + '.test';
  if (ls.get(k) === null && ls.get(k + '.fresh') === null) { const r = ls.get(realKey); if (r) ls.set(k, r); }
  ls.del(k + '.fresh');
  return k;
}

// 雲端存檔：不用註冊。第一次打開時產生一組匿名 ID＋密鑰（只存在這支手機），之後每次存檔就悄悄備份到 /api/save。
// 換手機、清快取時，用「復原碼」（ID.密鑰）就能把進度接回來。
// 伺服器沒開（還沒綁 D1、單檔試玩版、離線）時什麼都不做，遊戲照樣只存在手機裡。
const ID_KEY = 'cyber-temple.cloud';
const API = '/api/save';
const DELAY = 4000; // 存檔後 4 秒才上傳，連續操作只傳一次

function rnd() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } },
};
const CODE = /^[A-Za-z0-9_-]{16,64}\.[A-Za-z0-9_-]{16,64}$/;

/**
 * key：遊戲存檔用的 localStorage key；state：遊戲的 state 物件（save() 會先寫 state._t）。
 * enabled：試玩模式、內嵌預覽時傳 false。
 */
export function initCloud({ key, state, bootT = 0, enabled = true }) {
  let ident = null;
  try { ident = JSON.parse(ls.get(ID_KEY) || 'null'); } catch {}
  if (!ident || !CODE.test(`${ident.id}.${ident.secret}`)) { ident = { id: rnd(), secret: rnd() }; ls.set(ID_KEY, JSON.stringify(ident)); }
  const code = () => `${ident.id}.${ident.secret}`;
  const status = { on: false, last: 0, error: '' }; // on：伺服器有回應過
  // bootT：打開遊戲時手機裡那份存檔的時間（遊戲初始化時自己存的不算），拿來跟雲端比誰新
  let timer = 0, sending = false, again = false, started = false, pending = false, touched = false;
  const touch = () => { touched = true; };
  addEventListener('pointerdown', touch, { once: true, capture: true });
  addEventListener('keydown', touch, { once: true, capture: true });

  const req = (method, body, k = code(), extra = {}) => fetch(API, { method, headers: { 'x-temple-key': k, ...(body ? { 'content-type': 'application/json' } : {}) }, body, ...extra });

  // 另一台裝置存過比較新的進度：換成那一份再重新整理（只在剛打開、還沒動到存檔時才自動換）
  function adopt(remote) {
    if (touched) return false; // 已經開始玩了，不要突然換掉
    try { if (sessionStorage.getItem('cloud-adopted') === String(remote.t)) return false; sessionStorage.setItem('cloud-adopted', String(remote.t)); } catch {}
    if (!ls.set(key, remote.data)) return false;
    location.reload();
    return true;
  }

  async function push(keepalive = false) {
    if (!enabled) return;
    if (!started) { pending = true; return; } // 還沒跟雲端比過誰新，先不要傳
    if (sending) { again = true; return; }
    sending = true;
    try {
      const data = ls.get(key); if (!data) return;
      const r = await req('PUT', JSON.stringify({ t: state._t || Date.now(), data }), code(), keepalive && data.length < 60000 ? { keepalive: true } : {});
      if (r.ok) { status.on = true; status.last = Date.now(); status.error = ''; }
      else if (r.status === 409) { status.on = true; adopt(await r.json()); }
      else status.error = String(r.status);
    } catch (e) { status.error = 'offline'; } finally {
      sending = false;
      if (again) { again = false; schedule(); }
    }
  }
  function schedule() { if (!enabled) return; clearTimeout(timer); timer = setTimeout(() => push(), DELAY); }
  function flush() { if (timer) { clearTimeout(timer); timer = 0; push(true); } }
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  // 打開時：看雲端有沒有比較新的；沒有就把手機這份傳上去（第一次也會在這時建立）
  async function start() {
    if (!enabled) return;
    let go = true;
    try {
      const r = await req('GET');
      if (r.status === 404) status.on = true;
      else if (!r.ok) { status.error = String(r.status); go = r.status !== 503 && r.status !== 404; }
      else {
        status.on = true;
        const remote = await r.json();
        if (remote.t > bootT + 1000 && adopt(remote)) return;
        if (remote.t === (state._t || 0)) { status.last = Date.now(); go = pending; }
      }
    } catch { status.error = 'offline'; }
    started = true;
    if (go && status.on) push();
  }
  start();

  /** 用復原碼接回另一台裝置的進度。回傳 'ok' | 'bad' | 'none' | 'offline' */
  async function restore(input) {
    const k = String(input || '').trim();
    if (!CODE.test(k)) return 'bad';
    try {
      const r = await req('GET', null, k);
      if (r.status === 404 || r.status === 403) return 'none';
      if (!r.ok) return 'offline';
      const remote = await r.json();
      const [id, secret] = k.split('.');
      ls.set(ID_KEY, JSON.stringify({ id, secret }));
      ls.set(key, remote.data);
      try { sessionStorage.setItem('cloud-adopted', String(remote.t)); } catch {}
      location.reload();
      return 'ok';
    } catch { return 'offline'; }
  }

  return { schedule, flush, restore, code, status, enabled };
}

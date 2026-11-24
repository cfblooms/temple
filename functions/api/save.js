// 雲端存檔（Cloudflare Pages Function + D1）：/api/save
// 每位玩家第一次打開遊戲時，瀏覽器自己產生一組匿名 ID 和密鑰（不用註冊、不收任何個資）。
// 存檔就是遊戲本來存在手機裡的那包 JSON，這裡只負責保管和還原。
// 需要在 Cloudflare Pages 專案綁一個 D1 資料庫，變數名稱 DB；沒綁的時候回 503，遊戲照樣只存在手機裡。
const MAX = 512 * 1024; // 一份存檔最大 512KB（現在大約幾 KB）
const ID = /^[A-Za-z0-9_-]{16,64}$/;
let ready = false;

async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

async function auth(request, env) {
  if (!env.DB) return { err: json({ error: 'no-db' }, 503) };
  const [id, secret] = (request.headers.get('x-temple-key') || '').split('.');
  if (!ID.test(id || '') || !ID.test(secret || '')) return { err: json({ error: 'bad-key' }, 400) };
  if (!ready) {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS saves (id TEXT PRIMARY KEY, key_hash TEXT NOT NULL, data TEXT NOT NULL, t INTEGER NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL)').run();
    ready = true;
  }
  const row = await env.DB.prepare('SELECT key_hash, data, t FROM saves WHERE id = ?').bind(id).first();
  const hash = await sha256(secret);
  if (row && row.key_hash !== hash) return { err: json({ error: 'forbidden' }, 403) };
  return { id, hash, row };
}

export async function onRequestGet({ request, env }) {
  const a = await auth(request, env); if (a.err) return a.err;
  if (!a.row) return json({ error: 'not-found' }, 404);
  return json({ t: a.row.t, data: a.row.data });
}

export async function onRequestPut({ request, env }) {
  const a = await auth(request, env); if (a.err) return a.err;
  const text = await request.text();
  if (text.length > MAX) return json({ error: 'too-big' }, 413);
  let body; try { body = JSON.parse(text); } catch { return json({ error: 'bad-json' }, 400); }
  const t = Number(body.t), data = body.data;
  if (!Number.isFinite(t) || typeof data !== 'string') return json({ error: 'bad-body' }, 400);
  try { JSON.parse(data); } catch { return json({ error: 'bad-data' }, 400); }
  // 雲端那份比較新（另一台裝置剛存過）：不蓋掉，把新的那份回給玩家
  if (a.row && a.row.t > t) return json({ error: 'stale', t: a.row.t, data: a.row.data }, 409);
  const now = Date.now();
  await env.DB.prepare('INSERT INTO saves (id, key_hash, data, t, created, updated) VALUES (?1, ?2, ?3, ?4, ?5, ?5) ON CONFLICT(id) DO UPDATE SET data = ?3, t = ?4, updated = ?5')
    .bind(a.id, a.hash, data, t, now).run();
  return json({ ok: true, t });
}

export async function onRequestDelete({ request, env }) {
  const a = await auth(request, env); if (a.err) return a.err;
  await env.DB.prepare('DELETE FROM saves WHERE id = ?').bind(a.id).run();
  return json({ ok: true });
}

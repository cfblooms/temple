// 媽祖平安符收集：每天可以求一個平安符（擲到聖筊才給），在香爐上「過爐」三圈，收進收集冊。
// 12 種平安符，集滿有獎。存檔：state.amulet = { day, got: { id: 次數 }, all: bool }
import { tossJiao } from './jiaotoss.js';
import { wallet } from './wallet.js';

const NS = 'http://www.w3.org/2000/svg';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const AMULETS = [
  { id: 'ping', name: '出入平安', color: '#D8343A', note: '出門在外，平平安安回家。' },
  { id: 'jia', name: '闔家平安', color: '#E8762A', note: '全家大小都健健康康。' },
  { id: 'kang', name: '身體健康', color: '#3E9A5A', note: '吃得下、睡得好、笑得出來。' },
  { id: 'xue', name: '學業進步', color: '#2E7AB8', note: '讀書專心，越讀越懂。' },
  { id: 'kao', name: '考試順利', color: '#5A4AB0', note: '會的都寫對，不會的猜對。' },
  { id: 'shi', name: '事業順利', color: '#8A5A2A', note: '工作順心，遇到好同事。' },
  { id: 'cai', name: '招財進寶', color: '#C8963E', note: '錢來得正，也留得住。' },
  { id: 'yuan', name: '姻緣美滿', color: '#E06A9A', note: '遇到懂你的人，或跟身邊的人更好。' },
  { id: 'che', name: '行車平安', color: '#4A6A7A', note: '開車騎車都穩穩的，一路順風。' },
  { id: 'hang', name: '海上平安', color: '#2A8A9A', note: '媽祖最拿手的：出海的人都平安回港。' },
  { id: 'mian', name: '好眠安睡', color: '#6A5A9A', note: '晚上不胡思亂想，一覺到天亮。' },
  { id: 'xin', name: '心想事成', color: '#B8322A', note: '心裡想的事，一步一步實現。' },
];
const ALL_FU = 60, NEW_FU = 8;
const BURNER = [184, 378];

const pouch = (a, w = 26) => `
  <g>
    <path d="M${-w * .18} ${-w * .72} q${w * .18} ${-w * .35} ${w * .36} 0" fill="none" stroke="#F2C14E" stroke-width="1.6"/>
    <rect x="${-w / 2}" y="${-w * .62}" width="${w}" height="${w * 1.25}" rx="${w * .2}" fill="${a.color}" stroke="#F2C14E" stroke-width="1.6"/>
    <rect x="${-w * .28}" y="${-w * .45}" width="${w * .56}" height="${w * .9}" rx="2" fill="#FFF4D8"/>
    <text x="0" y="${-w * .14}" text-anchor="middle" font-size="${w * .24}" fill="${a.color}" font-weight="700">${a.name.slice(0, 2)}</text>
    <text x="0" y="${w * .2}" text-anchor="middle" font-size="${w * .24}" fill="${a.color}" font-weight="700">${a.name.slice(2)}</text>
  </g>`;

export function initAmulet({ svg, state, save, say, sfx, burst, emit, openSheet, closeSheet, dayKey, esc, cam }) {
  const st = state.amulet || (state.amulet = { day: '', got: {}, all: false });
  const owned = () => AMULETS.filter((a) => st.got[a.id]).length;
  const todayDone = () => st.day === dayKey();

  function book(extra = '') {
    const body = openSheet('平安符收集冊', `
      ${extra}
      <p class="hint">每天可以向媽祖求一個平安符：擲到<b>聖筊</b>，媽祖就給你，再拿到香爐上<b>過爐三圈</b>收進冊子。集滿 ${AMULETS.length} 種有大獎。</p>
      <div class="amu-grid">${AMULETS.map((a) => { const n = st.got[a.id]; return `<div class="amu ${n ? 'on' : ''}" style="--c:${a.color}"><span class="amu-bag"><i>${n ? a.name : '？？'}</i></span><small>${n ? (n > 1 ? `×${n}` : '已收集') : '還沒求到'}</small></div>`; }).join('')}</div>
      <p class="amu-count">已經收集 <b>${owned()}</b>／${AMULETS.length} 種</p>
      <div class="row">${todayDone() ? '<button class="btn ghost" id="amOk">今天已經求過了，明天再來</button>' : '<button class="btn gold" id="amAsk">求今天的平安符</button>'}</div>`);
    body.querySelector('#amOk')?.addEventListener('click', closeSheet);
    body.querySelector('#amAsk')?.addEventListener('click', ask);
  }

  async function ask() {
    if (todayDone()) return;
    const r = Math.random(), key = r < .55 ? 'sheng' : r < .8 ? 'xiao' : 'yin';
    const faces = key === 'sheng' ? ['flat', 'round'] : key === 'xiao' ? ['flat', 'flat'] : ['round', 'round'];
    if (Math.random() < .5) faces.reverse();
    const ok = await tossJiao({ tip: '跟媽祖說：你想求哪一方面的平安', faces, key });
    if (!ok) return;
    if (key !== 'sheng') {
      book(`<p class="amu-msg">${key === 'xiao' ? '<b>笑筊</b>，媽祖笑笑的，再說清楚一點，再擲一次。' : '<b>陰筊</b>，媽祖覺得再等等，深呼吸，再擲一次。'}</p>`);
      return;
    }
    // 聖筊：抽一個平安符（優先給還沒有的）
    const miss = AMULETS.filter((a) => !st.got[a.id]);
    const pool = miss.length && Math.random() < .75 ? miss : AMULETS;
    const a = pool[Math.floor(Math.random() * pool.length)];
    closeSheet();
    passBurner(a);
  }

  // 平安符在香爐上方繞三圈（過爐）
  function passBurner(a) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('pointer-events', 'none');
    g.innerHTML = pouch(a, 30);
    svg.appendChild(g);
    cam?.zoom?.(BURNER[0], BURNER[1] + 10, 220);
    sfx.chime();
    say('聖筊！媽祖答應了。平安符在香爐上<b>過爐三圈</b>，沾沾香火…', 'god');
    const t0 = performance.now(), ms = reduce ? 600 : 3000;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms), ang = k * Math.PI * 6;
      const x = BURNER[0] + Math.cos(ang) * 30, y = BURNER[1] - 32 + Math.sin(ang) * 8;
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(Math.sin(ang) * 10).toFixed(1)})`);
      if (Math.random() < .25) emit('smoke', BURNER[0] + (Math.random() - .5) * 20, BURNER[1] - 10);
      if (k < 1) { requestAnimationFrame(step); return; }
      g.remove(); cam?.reset?.(600);
      done(a);
    };
    requestAnimationFrame(step);
  }

  function done(a) {
    const first = !st.got[a.id];
    st.got[a.id] = (st.got[a.id] || 0) + 1; st.day = dayKey(); save();
    burst('spark', BURNER[0], BURNER[1] - 40, reduce ? 4 : 18); sfx.chime();
    if (first) wallet.earn(NEW_FU, '新的平安符', BURNER[0], BURNER[1] - 60);
    let tail = '';
    if (!st.all && owned() === AMULETS.length) {
      st.all = true; save(); wallet.earn(ALL_FU, '平安符全部集滿', BURNER[0], BURNER[1] - 80);
      setTimeout(() => burst('spark', 180, 300, reduce ? 6 : 40), 400);
      tail = `<p class="amu-msg"><b>十二種平安符全部集滿了！</b>媽祖保佑你樣樣平安，福氣 +${ALL_FU}。</p>`;
    }
    book(`<div class="amu-new" style="--c:${a.color}"><span class="amu-bag big"><i>${a.name}</i></span>
      <p><b>${first ? '新的平安符！' : '又求到一個'}「${esc(a.name)}」</b><br>${a.note}${first ? `<br>福氣 +${NEW_FU}` : ''}</p></div>${tail}`);
    say(`過爐完成，「${esc(a.name)}」平安符收進收集冊了。${a.note}`, 'god');
  }

  return { open: book, todayDone };
}

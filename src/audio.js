// 音效：先用 Web Audio 即時合成，不需要音檔。之後有正式錄音再換成 Howler.js 播檔案。
let ctx = null;
let muted = false;

export function setMuted(v) { muted = v; }
export function isMuted() { return muted; }

function ac() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function noiseBuffer(c, secs) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * secs), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function env(c, g, t, peak, attack, decay) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

// 點火「啵」
export function pop() {
  const c = ac(); if (!c) return;
  const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.09);
  env(c, g, t, 0.35, 0.005, 0.12);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.2);
}

// 木頭筊杯「噠」
export function knock(delay = 0) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const src = c.createBufferSource(); src.buffer = noiseBuffer(c, 0.08);
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 4;
  const g = c.createGain(); env(c, g, t, 0.9, 0.002, 0.07);
  const o = c.createOscillator(), og = c.createGain();
  o.frequency.value = 420; env(c, og, t, 0.25, 0.002, 0.06);
  src.connect(bp).connect(g).connect(c.destination);
  o.connect(og).connect(c.destination);
  src.start(t); o.start(t); o.stop(t + 0.1);
}

// 磬／頌缽長尾音
export function bowl() {
  const c = ac(); if (!c) return;
  const t = c.currentTime, base = 392;
  [[1, 0.28, 6], [2.71, 0.12, 4.5], [5.12, 0.06, 3], [8.2, 0.025, 2]].forEach(([r, a, d]) => {
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.value = base * r;
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 3.2; lg.gain.value = a * 0.25;
    lfo.connect(lg).connect(g.gain);
    env(c, g, t, a, 0.01, d);
    o.connect(g).connect(c.destination);
    o.start(t); lfo.start(t); o.stop(t + d + 0.1); lfo.stop(t + d + 0.1);
  });
}

// 虎爺呼嚕
export function purr() {
  const c = ac(); if (!c) return;
  const t = c.currentTime, dur = 1.4;
  const src = c.createBufferSource(); src.buffer = noiseBuffer(c, dur);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
  const g = c.createGain(); g.gain.value = 0;
  const lfo = c.createOscillator(), lg = c.createGain();
  lfo.frequency.value = 24; lg.gain.value = 0.35; lfo.connect(lg).connect(g.gain);
  const master = c.createGain(); env(c, master, t, 1, 0.15, dur - 0.15);
  src.connect(lp).connect(g).connect(master).connect(c.destination);
  src.start(t); lfo.start(t); lfo.stop(t + dur);
}

// 搖籤筒沙沙
export function rattle(secs = 1.4) {
  const c = ac(); if (!c) return;
  for (let s = 0; s < secs; s += 0.07 + Math.random() * 0.05) knock(s);
}

// 好結果的叮
export function chime() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  [[880, 0], [1318, 0.12]].forEach(([f, d]) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    env(c, g, t + d, 0.18, 0.01, 0.9);
    o.connect(g).connect(c.destination); o.start(t + d); o.stop(t + d + 1);
  });
}

export function buzz(pattern) {
  if (muted) return;
  try { navigator.vibrate && navigator.vibrate(pattern); } catch {}
}

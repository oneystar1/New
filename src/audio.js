// Tiny synthesised sound effects (no audio files needed).
let ac = null;
let muted = false;

function ctx() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

export function unlockAudio() { ctx(); }
export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }

function tone(freq, dur, { type = 'square', vol = 0.15, slide = 0, delay = 0 } = {}) {
  const a = ctx(); if (!a || muted) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, a.currentTime + delay);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), a.currentTime + delay + dur);
  g.gain.setValueAtTime(vol, a.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + delay + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + delay); o.stop(a.currentTime + delay + dur + 0.02);
}

function noise(dur, { vol = 0.2, delay = 0, lowpass = 3000 } = {}) {
  const a = ctx(); if (!a || muted) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass;
  const g = a.createGain(); g.gain.setValueAtTime(vol, a.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + delay + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start(a.currentTime + delay);
}

export const sfx = {
  menuMove: () => tone(660, 0.05, { vol: 0.08 }),
  menuSelect: () => { tone(520, 0.08, { vol: 0.1 }); tone(780, 0.12, { vol: 0.1, delay: 0.08 }); },
  pitch: () => noise(0.12, { vol: 0.08, lowpass: 1500 }),
  swing: () => noise(0.15, { vol: 0.12, lowpass: 900 }),
  crack: (power = 1) => { noise(0.08, { vol: 0.35 * power, lowpass: 5000 }); tone(180, 0.1, { type: 'triangle', vol: 0.25 * power, slide: -120 }); },
  glove: () => { noise(0.06, { vol: 0.25, lowpass: 1200 }); tone(120, 0.06, { type: 'sine', vol: 0.2 }); },
  strike: () => tone(300, 0.15, { type: 'sawtooth', vol: 0.12, slide: -150 }),
  ball: () => tone(240, 0.1, { type: 'triangle', vol: 0.1 }),
  out: () => { tone(400, 0.1, { vol: 0.12 }); tone(300, 0.15, { vol: 0.12, delay: 0.1 }); },
  safe: () => { tone(500, 0.08, { vol: 0.12 }); tone(700, 0.12, { vol: 0.12, delay: 0.08 }); },
  homer: () => { for (let i = 0; i < 6; i++) tone(440 * Math.pow(2, i / 6), 0.18, { vol: 0.14, delay: i * 0.09 }); noise(1.2, { vol: 0.15, delay: 0.3, lowpass: 2500 }); },
  cheer: () => noise(0.9, { vol: 0.12, lowpass: 2200 }),
  run: () => tone(360, 0.03, { type: 'square', vol: 0.05 }),
  bounce: () => tone(200, 0.05, { type: 'sine', vol: 0.1, slide: -80 }),
  foul: () => tone(350, 0.12, { type: 'square', vol: 0.08, slide: 60 }),
  inning: () => { tone(392, 0.15, { vol: 0.12 }); tone(523, 0.15, { vol: 0.12, delay: 0.15 }); tone(659, 0.25, { vol: 0.12, delay: 0.3 }); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { vol: 0.14, delay: i * 0.18 })); },
};

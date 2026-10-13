// Synthesized sound effects with the Web Audio API: no asset files, works
// offline, trivially portable into the Capacitor shell. Every sound is a
// short envelope on one or two oscillators.

let ctx: AudioContext | null = null;
let enabled = true;

export function setSfxEnabled(on: boolean): void { enabled = on; }

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, slide = 0, delay = 0): void {
  const c = ac();
  if (!c || !enabled) return;
  const o = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + delay;
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur: number, gain = 0.08, delay = 0): void {
  const c = ac();
  if (!c || !enabled) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buf;
  g.gain.value = gain;
  src.connect(g).connect(c.destination);
  src.start(c.currentTime + delay);
}

export const sfx = {
  tap: () => tone(520 + Math.random() * 80, 0.06, 'square', 0.05, 120),
  cash: () => { tone(880, 0.08, 'triangle', 0.08); tone(1320, 0.1, 'triangle', 0.08, 0, 0.06); },
  buy: () => { tone(440, 0.07, 'square', 0.07); tone(660, 0.09, 'square', 0.07, 0, 0.07); },
  manager: () => { tone(523, 0.1, 'triangle', 0.1); tone(659, 0.1, 'triangle', 0.1, 0, 0.1); tone(784, 0.16, 'triangle', 0.1, 0, 0.2); },
  pull: () => { noise(0.12, 0.05); tone(300, 0.25, 'sawtooth', 0.06, 500); },
  rare: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, 0, i * 0.09)); },
  grail: () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, 0, i * 0.1)); noise(0.4, 0.04, 0.5); },
  bad: () => { tone(220, 0.18, 'sawtooth', 0.08, -80); tone(160, 0.25, 'sawtooth', 0.08, -60, 0.15); },
  grab: () => { noise(0.05, 0.06); tone(700 + Math.random() * 200, 0.05, 'square', 0.05, 200); },
  secured: () => { tone(988, 0.08, 'square', 0.08); tone(1319, 0.12, 'square', 0.08, 0, 0.07); },
  doors: () => { noise(0.3, 0.1); tone(120, 0.4, 'sawtooth', 0.1, 60); },
  calledOut: () => { tone(400, 0.12, 'square', 0.1, -200); tone(400, 0.12, 'square', 0.1, -200, 0.18); tone(400, 0.3, 'square', 0.1, -300, 0.36); },
  achievement: () => { [784, 988, 1175].forEach((f, i) => tone(f, 0.14, 'triangle', 0.1, 0, i * 0.08)); },
  message: () => { tone(1200, 0.06, 'sine', 0.07); tone(1600, 0.08, 'sine', 0.07, 0, 0.07); },
  deal: () => { tone(660, 0.08, 'triangle', 0.09); tone(880, 0.08, 'triangle', 0.09, 0, 0.08); tone(1320, 0.14, 'triangle', 0.09, 0, 0.16); },
};

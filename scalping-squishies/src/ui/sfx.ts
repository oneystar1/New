// Synthesized sound effects with the Web Audio API: no asset files, works
// offline, trivially portable into the Capacitor shell. Every sound is a
// short envelope on one or two oscillators.

let ctx: AudioContext | null = null;
let enabled = true;

export function setSfxEnabled(on: boolean): void { enabled = on; if (!on) ambience.stop(); }

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

// ---------------------------------------------------------------------------
// Camp ambience: a looping wind bed (filtered noise with a slow LFO), the
// occasional car door, sparrows once the sky lightens, a door chime at 7:00.
// Started by the restock overlay for the camp phase and stopped after it.
// ---------------------------------------------------------------------------
let amb: { master: GainNode; src: AudioBufferSourceNode; filter: BiquadFilterNode; lfo: OscillatorNode; lfoGain: GainNode; timer: ReturnType<typeof setInterval>; dawn: number } | null = null;

function carDoor(): void {
  noise(0.07, 0.05);
  tone(95, 0.18, 'sine', 0.07, -40, 0.02);
}
function sparrow(): void {
  const base = 2600 + Math.random() * 600;
  [0, 0.11, 0.25].forEach((d, i) => { if (i < 2 || Math.random() < 0.5) tone(base + i * 150, 0.07, 'sine', 0.025, 500, d); });
}

export const ambience = {
  start(): void {
    if (amb || !enabled) return;
    const c = ac();
    if (!c) return;
    // Brown-ish noise: integrate white noise so the wind sits low and soft.
    const seconds = 3;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    // Fade the loop seam.
    const fade = Math.floor(c.sampleRate * 0.05);
    for (let i = 0; i < fade; i++) { const k = i / fade; d[i] *= k; d[d.length - 1 - i] *= k; }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.7;
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.13;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain).connect(filter.frequency);
    const master = c.createGain();
    master.gain.setValueAtTime(0.0001, c.currentTime);
    master.gain.exponentialRampToValueAtTime(0.06, c.currentTime + 1.5);
    src.connect(filter).connect(master).connect(c.destination);
    src.start();
    lfo.start();
    const timer = setInterval(() => {
      if (!amb || !enabled) return;
      const r = Math.random();
      if (r < 0.22) carDoor();
      else if (amb.dawn > 0.55 && r < 0.22 + 0.3 * amb.dawn) sparrow();
    }, 3200);
    amb = { master, src, filter, lfo, lfoGain, timer, dawn: 0 };
  },
  /** 0 = night, 1 = sunrise: the wind drops and brightens a little as the lot wakes up. */
  dawn(p: number): void {
    if (!amb) return;
    const c = ac();
    if (!c) return;
    amb.dawn = Math.max(0, Math.min(1, p));
    amb.filter.frequency.setTargetAtTime(320 + amb.dawn * 380, c.currentTime, 0.5);
    amb.master.gain.setTargetAtTime(0.06 * (1 - amb.dawn * 0.45), c.currentTime, 0.5);
  },
  /** The store door: a two-note chime, then the wind stops. */
  chime(): void {
    tone(1318, 0.35, 'sine', 0.08);
    tone(1760, 0.55, 'sine', 0.08, 0, 0.18);
  },
  stop(): void {
    if (!amb) return;
    const a = amb;
    amb = null;
    clearInterval(a.timer);
    const c = ac();
    if (!c) return;
    try {
      a.master.gain.setTargetAtTime(0.0001, c.currentTime, 0.25);
      a.src.stop(c.currentTime + 1);
      a.lfo.stop(c.currentTime + 1);
    } catch { /* already stopped */ }
  },
};

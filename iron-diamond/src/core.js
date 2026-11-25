// IRON DIAMOND — core: math, RNG, input, audio, 3D camera, drawing helpers.
'use strict';
const W = 960, H = 540, TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const hyp = Math.hypot;
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function approach(v, t, d) { return v < t ? Math.min(t, v + d) : Math.max(t, v - d); }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function shade(hex, f) { // f<0 darker, f>0 lighter
  const n = parseInt(hex.slice(1), 16); let r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
// visual quality: 'high' adds bloom, light beams, flares and grain; dropped automatically on slow devices
const FX = { high: true, auto: true };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } },
};

// ---------------------------------------------------------------- input
const BTNS = ['up', 'down', 'left', 'right', 'a', 'b', 'start'];
const KEYMAP = [
  { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], a: ['KeyJ', 'Space', 'KeyZ'], b: ['KeyK', 'KeyX'], start: ['Enter', 'Escape'] },
  { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], a: ['Comma', 'Numpad1', 'NumpadEnter'], b: ['Period', 'Numpad2'], start: ['Backspace', 'Numpad0'] },
];
const Input = {
  keys: new Set(), latch: new Set(), touch: {}, touchLatch: {}, pads: [{}, {}], prev: [{}, {}], twoPlayer: false, onKey: null,
  init() {
    addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Backspace'].includes(e.code)) e.preventDefault();
      if (!e.repeat && this.onKey) this.onKey(e.code);
      this.keys.add(e.code); this.latch.add(e.code);
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.touch = {}; });
  },
  poll() {
    const gps = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    for (let i = 0; i < 2; i++) {
      this.prev[i] = this.pads[i];
      const p = {};
      const maps = (!this.twoPlayer && i === 0) ? KEYMAP : (i < KEYMAP.length ? [KEYMAP[i]] : []);
      if (this.twoPlayer || i === 0) for (const m of maps) for (const b of BTNS) if (m[b].some(k => this.keys.has(k) || this.latch.has(k))) p[b] = true;
      if (!this.twoPlayer && i === 0) { /* P1 owns everything in 1P */ }
      const gp = gps[i];
      if (gp) {
        const bt = n => gp.buttons[n] && gp.buttons[n].pressed;
        if (bt(0) || bt(2)) p.a = true; if (bt(1) || bt(3)) p.b = true; if (bt(9) || bt(8)) p.start = true;
        if (bt(12) || gp.axes[1] < -0.5) p.up = true; if (bt(13) || gp.axes[1] > 0.5) p.down = true;
        if (bt(14) || gp.axes[0] < -0.5) p.left = true; if (bt(15) || gp.axes[0] > 0.5) p.right = true;
      }
      if (!this.twoPlayer && i === 0 && gps[1]) { const g2 = gps[1]; if (g2.buttons[0] && g2.buttons[0].pressed) p.a = true; }
      if (i === 0) for (const b of BTNS) if (this.touch[b] || this.touchLatch[b]) p[b] = true;
      this.pads[i] = p;
    }
    this.latch.clear(); this.touchLatch = {};
  },
  held(i, b) { return !!(this.pads[i] && this.pads[i][b]); },
  hit(i, b) { return !!(this.pads[i] && this.pads[i][b] && !this.prev[i][b]); },
  anyHit(b) { return this.hit(0, b) || this.hit(1, b); },
  anyHeld(b) { return this.held(0, b) || this.held(1, b); },
  axis(i) { return { x: (this.held(i, 'right') ? 1 : 0) - (this.held(i, 'left') ? 1 : 0), y: (this.held(i, 'up') ? 1 : 0) - (this.held(i, 'down') ? 1 : 0) }; },
};

// ---------------------------------------------------------------- audio (all synthesized)
const Sfx = {
  ac: null, master: null, music: null, muted: store.get('ironDiamond.muted', false), musicOn: true, _seq: null,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.6;
    const comp = this.ac.createDynamicsCompressor(); this.master.connect(comp); comp.connect(this.ac.destination);
    this.music = this.ac.createGain(); this.music.gain.value = 0.22; this.music.connect(this.master);
    const len = this.ac.sampleRate; this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.startMusic();
  },
  toggleMute() { this.muted = !this.muted; store.set('ironDiamond.muted', this.muted); if (this.master) this.master.gain.value = this.muted ? 0 : 0.6; },
  tone(f, dur, type = 'square', vol = 0.2, slide = 0, when = 0, dest) {
    if (!this.ac) return; const t = this.ac.currentTime + when;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.3, freq = 2000, q = 1, when = 0, type = 'bandpass', dest) {
    if (!this.ac) return; const t = this.ac.currentTime + when;
    const s = this.ac.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  buzz(ms) { try { if (navigator.vibrate && FX.haptics !== false) navigator.vibrate(ms); } catch (e) { } },
  play(name) {
    const hap = { bat: 18, hit: 25, heavy: 45, boom: [60, 40, 90], clash: 30, hr: [30, 40, 30, 40, 60] }[name]; if (hap) this.buzz(hap);
    if (!this.ac) return;
    switch (name) {
      case 'move': this.tone(660, 0.05, 'square', 0.06); break;
      case 'ok': this.tone(520, 0.06, 'square', 0.1); this.tone(1040, 0.1, 'square', 0.08, 0, 0.05); break;
      case 'back': this.tone(300, 0.1, 'square', 0.08, -120); break;
      case 'pitch': this.noise(0.25, 0.12, 3000, 0.6, 0, 'highpass'); this.tone(220, 0.2, 'sawtooth', 0.05, 400); break;
      case 'plasma': this.tone(180, 0.6, 'sawtooth', 0.12, 900); this.noise(0.5, 0.1, 5000, 2); break;
      case 'mitt': this.noise(0.08, 0.35, 900, 1.5); this.tone(140, 0.08, 'sine', 0.25); break;
      case 'bat': this.noise(0.12, 0.6, 2400, 0.8); this.tone(1400, 0.08, 'triangle', 0.25, -600); this.tone(90, 0.15, 'sine', 0.4); break;
      case 'foul': this.noise(0.06, 0.3, 1800, 1); break;
      case 'swing': this.noise(0.18, 0.12, 1200, 0.5, 0, 'bandpass'); this.tone(300, 0.12, 'sawtooth', 0.04, 500); break;
      case 'catch': this.noise(0.06, 0.25, 700, 1.5); break;
      case 'throw': this.noise(0.15, 0.1, 2500, 0.7); break;
      case 'step': this.tone(90 + Math.random() * 30, 0.04, 'square', 0.03); break;
      case 'out': this.tone(392, 0.12, 'square', 0.12); this.tone(262, 0.25, 'square', 0.12, 0, 0.12); break;
      case 'safe': this.tone(523, 0.1, 'square', 0.12); this.tone(784, 0.2, 'square', 0.12, 0, 0.1); break;
      case 'run': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.15, 'square', 0.1, 0, i * 0.08)); break;
      case 'hr': [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.25, 'sawtooth', 0.1, 0, i * 0.09)); this.noise(1.5, 0.15, 800, 0.3, 0.2, 'lowpass'); break;
      case 'crowd': this.noise(1.6, 0.12, 900, 0.4, 0, 'bandpass'); break;
      case 'clash': this.tone(110, 0.5, 'sawtooth', 0.25, -60); this.noise(0.4, 0.3, 600, 1); this.tone(880, 0.3, 'square', 0.08, -400, 0.1); break;
      case 'hit': this.noise(0.1, 0.5, 1500, 1.2); this.tone(160, 0.12, 'square', 0.18, -80); break;
      case 'heavy': this.noise(0.25, 0.7, 500, 0.9); this.tone(80, 0.3, 'sawtooth', 0.3, -40); break;
      case 'block': this.tone(1200, 0.06, 'square', 0.12); this.noise(0.05, 0.2, 4000, 2); break;
      case 'whiff': this.noise(0.12, 0.08, 2000, 0.6); break;
      case 'boom': this.noise(1.2, 0.9, 400, 0.6, 0, 'lowpass'); this.tone(60, 0.9, 'sawtooth', 0.4, -30); this.noise(0.6, 0.5, 2500, 0.5, 0.05); break;
      case 'buzz': this.tone(110, 0.35, 'sawtooth', 0.15); break;
      case 'cash': this.tone(1318, 0.08, 'square', 0.1); this.tone(1760, 0.15, 'square', 0.1, 0, 0.07); break;
      case 'servo': this.tone(240, 0.15, 'sawtooth', 0.04, 200); break;
    }
  },
  startMusic() {
    if (!this.ac || this._seq) return;
    const bpm = 112, step = 60 / bpm / 4; let next = this.ac.currentTime + 0.1, i = 0;
    const roots = [45, 45, 41, 43]; // A, A, F, G (minor-ish synthwave)
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    const tick = () => {
      if (!this.ac) return;
      while (next < this.ac.currentTime + 0.25) {
        const when = next - this.ac.currentTime, bar = Math.floor(i / 16) % 4, s = i % 16, r = roots[bar];
        if (this.musicOn) {
          if (s % 4 === 0) { this.tone(55, 0.18, 'sine', 0.55, -25, when, this.music); }
          if (s === 4 || s === 12) this.noise(0.14, 0.35, 1800, 0.7, when, 'bandpass', this.music);
          if (s % 2 === 1) this.noise(0.03, 0.12, 8000, 1, when, 'highpass', this.music);
          if (s % 2 === 0) this.tone(mtof(r - 12 + (s % 8 === 6 ? 12 : 0)), step * 1.7, 'sawtooth', 0.12, 0, when, this.music);
          const arp = [0, 7, 12, 15, 12, 7, 3, 7][s % 8];
          if (s % 2 === 0) this.tone(mtof(r + 24 + arp), step * 1.2, 'square', 0.035, 0, when, this.music);
        }
        next += step; i++;
      }
    };
    this._seq = setInterval(tick, 60);
  },
};

// ---------------------------------------------------------------- 3D camera (z up, home plate at origin, +y to centre field)
class Cam {
  constructor() { this.pos = { x: 0, y: -30, z: 8 }; this.tgt = { x: 0, y: 50, z: 3 }; this.f = 700; this.cx = W / 2; this.cy = H / 2; this.update(); }
  set(px, py, pz, tx, ty, tz, f) { this.pos.x = px; this.pos.y = py; this.pos.z = pz; this.tgt.x = tx; this.tgt.y = ty; this.tgt.z = tz; if (f) this.f = f; this.update(); }
  update() {
    let fx = this.tgt.x - this.pos.x, fy = this.tgt.y - this.pos.y, fz = this.tgt.z - this.pos.z;
    let l = hyp(fx, fy, fz); fx /= l; fy /= l; fz /= l;
    let rx = fy, ry = -fx, rz = 0; l = hyp(rx, ry) || 1; rx /= l; ry /= l; // right = f x up(z)
    const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
    this.F = [fx, fy, fz]; this.R = [rx, ry, rz]; this.U = [ux, uy, uz];
  }
  toCam(x, y, z) {
    const dx = x - this.pos.x, dy = y - this.pos.y, dz = z - this.pos.z, R = this.R, U = this.U, F = this.F;
    return [dx * R[0] + dy * R[1] + dz * R[2], dx * U[0] + dy * U[1] + dz * U[2], dx * F[0] + dy * F[1] + dz * F[2]];
  }
  proj(x, y, z) {
    const c = this.toCam(x, y, z); if (c[2] < 0.5) return null;
    const s = this.f / c[2]; return { x: this.cx + c[0] * s, y: this.cy - c[1] * s, s, d: c[2] };
  }
  // project a world polygon with near-plane clipping; returns screen points or null
  poly(pts) {
    const NEAR = 1; const cs = pts.map(p => this.toCam(p[0], p[1], p[2] || 0)); const out = [];
    for (let i = 0; i < cs.length; i++) {
      const a = cs[i], b = cs[(i + 1) % cs.length], ain = a[2] >= NEAR, bin = b[2] >= NEAR;
      if (ain) out.push(a);
      if (ain !== bin) { const t = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]); }
    }
    if (out.length < 3) return null;
    return out.map(c => [this.cx + c[0] * this.f / c[2], this.cy - c[1] * this.f / c[2]]);
  }
  fillPoly(ctx, pts, style) { const sp = this.poly(pts); if (!sp) return false; ctx.beginPath(); ctx.moveTo(sp[0][0], sp[0][1]); for (let i = 1; i < sp.length; i++) ctx.lineTo(sp[i][0], sp[i][1]); ctx.closePath(); if (style) { ctx.fillStyle = style; ctx.fill(); } return true; }
  line(ctx, a, b, style, width) {
    let ca = this.toCam(a[0], a[1], a[2] || 0), cb = this.toCam(b[0], b[1], b[2] || 0);
    if (ca[2] < 1 && cb[2] < 1) return;
    if (ca[2] < 1) { const t = (1 - ca[2]) / (cb[2] - ca[2]); ca = [ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, 1]; }
    if (cb[2] < 1) { const t = (1 - cb[2]) / (ca[2] - cb[2]); cb = [cb[0] + (ca[0] - cb[0]) * t, cb[1] + (ca[1] - cb[1]) * t, 1]; }
    ctx.strokeStyle = style; ctx.lineWidth = width; ctx.beginPath();
    ctx.moveTo(this.cx + ca[0] * this.f / ca[2], this.cy - ca[1] * this.f / ca[2]);
    ctx.lineTo(this.cx + cb[0] * this.f / cb[2], this.cy - cb[1] * this.f / cb[2]); ctx.stroke();
  }
}
function circlePts(cx, cy, r, n = 28, z = 0, a0 = 0, a1 = TAU) { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]); } if (a1 - a0 >= TAU - 1e-6) p.pop(); return p; }

// ---------------------------------------------------------------- 2D helpers
const FONT_H = '"Orbitron", "Rajdhani", system-ui, sans-serif';
const FONT_B = '"Rajdhani", "Segoe UI", system-ui, sans-serif';
function txt(ctx, s, x, y, size, color, align = 'left', font = FONT_B, weight = 700) {
  ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function glowTxt(ctx, s, x, y, size, color, glow, align = 'center', font = FONT_H, weight = 900) {
  ctx.save(); ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.shadowColor = glow; ctx.shadowBlur = size * 0.6; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.shadowBlur = 0; ctx.fillText(s, x, y); ctx.restore();
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function panel(ctx, x, y, w, h, accent = '#46e0ff', alpha = 0.72) {
  ctx.save(); rrect(ctx, x, y, w, h, 8);
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, `rgba(18,24,44,${alpha})`); g.addColorStop(1, `rgba(8,11,24,${alpha + 0.08})`);
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = hexA(accent, 0.55); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 10, y + 0.75); ctx.lineTo(x + Math.min(w - 10, 70), y + 0.75); ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
function bar(ctx, x, y, w, h, frac, color, bg = 'rgba(255,255,255,0.1)') {
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h); frac = clamp(frac, 0, 1);
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(color, -0.25)); g.addColorStop(1, color);
  ctx.fillStyle = g; ctx.fillRect(x, y, w * frac, h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, w * frac, Math.max(1, h * 0.35));
}
function hpColor(f) { return f > 0.6 ? '#3dffa0' : f > 0.3 ? '#ffd23d' : '#ff4a5a'; }
// soft additive glow sprite cache
const glowCache = {};
function glowSprite(color) {
  if (glowCache[color]) return glowCache[color];
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, hexA(color, 1)); gr.addColorStop(0.25, hexA(color, 0.5)); gr.addColorStop(1, hexA(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return glowCache[color] = c;
}
function glow(ctx, x, y, r, color, a = 1) { if (r < 0.5) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2); ctx.restore(); }

// ---------------------------------------------------------------- particles (screen-space or world-space)
class Particles {
  constructor() { this.list = []; }
  add(p) { this.list.push(Object.assign({ life: 1, t: 0, vx: 0, vy: 0, vz: 0, g: 0, size: 3, color: '#fff', drag: 0, kind: 'dot' }, p)); }
  burst(x, y, z, n, color, speed = 20, opts = {}) {
    for (let i = 0; i < n; i++) { const a = rnd(TAU), e = rnd(-0.2, 1.2), sp = rnd(0.3, 1) * speed; this.add(Object.assign({ x, y, z, vx: Math.cos(a) * sp * Math.cos(e), vy: Math.sin(a) * sp * Math.cos(e), vz: Math.sin(e) * sp, g: 30, life: rnd(0.4, 1), color, size: rnd(0.2, 0.5) }, opts)); }
  }
  update(dt) {
    for (const p of this.list) { p.t += dt; p.vz -= p.g * dt; const d = 1 - p.drag * dt; p.vx *= d; p.vy *= d; p.vz *= d; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0 && p.g > 0) { p.z = 0; p.vz *= -0.4; p.vx *= 0.6; p.vy *= 0.6; } }
    this.list = this.list.filter(p => p.t < p.life);
  }
  drawWorld(ctx, cam) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of this.list) {
      const q = cam.proj(p.x, p.y, p.z); if (!q) continue; const k = 1 - p.t / p.life; const r = Math.max(1, p.size * q.s);
      if (p.kind === 'smoke') { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.35 * k; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(q.x, q.y, r * (1.5 - k), 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; }
      else { ctx.globalAlpha = k; ctx.fillStyle = p.color; ctx.fillRect(q.x - r / 2, q.y - r / 2, r, r); if (r > 1.5) { ctx.globalAlpha = k * 0.5; ctx.drawImage(glowSprite(p.color), q.x - r * 3, q.y - r * 3, r * 6, r * 6); } }
    }
    ctx.restore();
  }
}

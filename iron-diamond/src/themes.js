// IRON DIAMOND — home-park themes: every club's stadium has its own sky, skyline and weather.
'use strict';
const THEMES = {
  NTR: { sky: ['#0b0420', '#3a0d4a', '#ff3d8a'], stars: 0.2, line: 'city', ink: '#0c0618', lights: ['#ff3d8a', '#46e0ff', '#ffe14a'], fx: 'rain', name: 'NEON DISTRICT DOME' },
  DIW: { sky: ['#120c08', '#3b2414', '#a8541f'], stars: 0.1, line: 'stacks', ink: '#120d0a', lights: ['#ffa04a', '#ff6a2a'], fx: 'embers', name: 'FOUNDRY FIELD' },
  NVV: { sky: ['#0a0418', '#2a0f4a', '#6a2c8a'], stars: 0.4, line: 'towers', ink: '#0d0820', lights: ['#ffe03d', '#ff3d8a', '#ffffff'], fx: 'search', name: 'THE JACKPOT' },
  LBE: { sky: ['#000000', '#03040a', '#0a0f1e'], stars: 1.6, line: 'domes', ink: '#14161e', lights: ['#58a6ff'], obj: { type: 'earth', x: 0.78, y: 0.16, r: 46 }, dirt: '#6b6d76', grass: '#1f5a4c', grade: 0.15, name: 'TRANQUILITY PARK' },
  MDD: { sky: ['#2a1210', '#8a3d24', '#e08a5a'], stars: 0.15, line: 'mesas', ink: '#3a170e', lights: ['#ff6a2a'], obj: { type: 'moons', x: 0.2, y: 0.14, r: 14 }, fx: 'dust', dirt: '#9a3f22', grass: '#3d5a2a', name: 'OLYMPUS GROUNDS' },
  ATA: { sky: ['#01121a', '#023848', '#0a7a7a'], stars: 0, line: 'coral', ink: '#02202a', lights: ['#3dfff0', '#7affc8'], fx: 'bubbles', caustics: true, grass: '#136048', name: 'THE TRENCH DOME' },
  SVK: { sky: ['#020a06', '#06261a', '#0d4a2c'], stars: 0.3, line: 'campus', ink: '#04140c', lights: ['#5dff8e', '#ffffff'], fx: 'code', name: 'KERNEL STADIUM' },
  ACG: { sky: ['#020814', '#0a1a3a', '#1b3a6a'], stars: 1, line: 'ice', ink: '#c8dcf0', inkLight: true, lights: ['#c8f4ff'], aurora: true, fx: 'snow', name: 'THE ICEBOX' },
  CSP: { sky: ['#06050e', '#1a1430', '#4a3a5a'], stars: 0.9, line: 'pyramids', ink: '#120e10', lights: ['#ffd84a'], obj: { type: 'moon', x: 0.72, y: 0.15, r: 34 }, fx: 'sand', dirt: '#a8814e', name: 'NECROPOLIS PARK' },
  BBZ: { sky: ['#07070a', '#1a1014', '#4a1418'], stars: 0.2, line: 'spire', ink: '#0a0a0e', lights: ['#ff4a4a', '#ffffff'], fx: 'rain', name: 'BLITZ ARENA' },
  RJU: { sky: ['#140a24', '#5a2048', '#ff8a3d'], stars: 0.3, line: 'hills', ink: '#0c0a14', lights: ['#ffe14a', '#ff8a3d'], fx: 'fireflies', name: 'JUNGLE CAGE' },
  SSF: { sky: ['#0a1430', '#3a3a6a', '#ff9a4a'], stars: 0.2, line: 'harbor', ink: '#0a0e1e', lights: ['#ffc04a', '#1fb6ff'], obj: { type: 'sun', x: 0.25, y: 0.42, r: 40 }, name: 'SUNSET BOWL' },
};
const _lines = {};
// a skyline is a silhouette polygon (x, height) plus window lights; built once per theme
function skylineFor(kind) {
  if (_lines[kind]) return _lines[kind];
  const rng = mulberry(kind.length * 977 + kind.charCodeAt(0)), pts = [], wins = [], extra = [], Wd = W + 160;
  const step = (x0, w, h) => { pts.push([x0, h], [x0 + w, h]); };
  let x = 0;
  if (kind === 'city' || kind === 'towers' || kind === 'campus' || kind === 'harbor' || kind === 'stacks' || kind === 'spire') {
    while (x < Wd) {
      let w = 18 + rng() * 40, h = 30 + rng() * 80;
      if (kind === 'towers') { h = 40 + rng() * 120; w = 22 + rng() * 26; }
      if (kind === 'campus') { h = 18 + rng() * 40; w = 40 + rng() * 60; }
      if (kind === 'harbor') { h = 12 + rng() * 50; }
      step(x, w, h);
      if (kind === 'stacks' && rng() < 0.4) extra.push({ type: 'stack', x: x + w * 0.5, h: h + 40 + rng() * 50, w: 6 });
      if (kind !== 'harbor' || h > 30) for (let k = 0; k < h / 10; k++) if (rng() < 0.45) wins.push([x + 4 + rng() * (w - 10), h - 6 - k * 10, rng()]);
      x += w + 2;
    }
    if (kind === 'spire') extra.push({ type: 'spire', x: Wd * 0.55, h: 230 });
    if (kind === 'harbor') extra.push({ type: 'sails', x: Wd * 0.62 });
  } else if (kind === 'domes') {
    while (x < Wd) { const r = 20 + rng() * 50; for (let i = 0; i <= 10; i++) { const a = Math.PI - Math.PI * i / 10; pts.push([x + r + Math.cos(a) * r, Math.sin(a) * r * 0.7]); } wins.push([x + r, r * 0.35, rng()]); x += r * 2 + 10 + rng() * 40; pts.push([x - 5, 4]); }
  } else if (kind === 'mesas') {
    while (x < Wd) { const w = 60 + rng() * 140, h = 30 + rng() * 70; pts.push([x, 5], [x + 18, h], [x + w - 18, h], [x + w, 5]); x += w + rng() * 30; }
  } else if (kind === 'coral') {
    while (x < Wd) { const w = 10 + rng() * 22, h = 40 + rng() * 140; pts.push([x, 4], [x + w / 2, h], [x + w, 4]); if (rng() < 0.5) wins.push([x + w / 2, h * 0.6, rng()]); x += w * 0.7 + rng() * 14; }
  } else if (kind === 'ice') {
    let h = 40; while (x < Wd) { h = clamp(h + (rng() - 0.5) * 70, 20, 150); pts.push([x, h]); x += 14 + rng() * 26; }
  } else if (kind === 'pyramids') {
    while (x < Wd) { const w = 80 + rng() * 160; pts.push([x, 3], [x + w / 2, w * 0.42], [x + w, 3]); wins.push([x + w / 2, w * 0.42, 1]); x += w * (0.8 + rng() * 0.4); }
  } else { // hills
    for (; x < Wd; x += 10) pts.push([x, 40 + Math.sin(x * 0.012) * 30 + Math.sin(x * 0.031 + 2) * 18 + (x > Wd * 0.4 && x < Wd * 0.5 ? (1 - Math.abs(x - Wd * 0.45) / (Wd * 0.05)) * 90 : 0)]);
    for (let i = 0; i < 160; i++) { const wx = rng() * Wd; wins.push([wx, 8 + rng() * 40, rng()]); }
  }
  return _lines[kind] = { pts, wins, extra, Wd };
}
function themeOf(team) { return THEMES[team.id] || THEMES.NTR; }
function drawThemeSky(ctx, cam, team, t, hy, stars) {
  const th = themeOf(team);
  const g = ctx.createLinearGradient(0, Math.min(0, hy - 400), 0, hy + 20); g.addColorStop(0, th.sky[0]); g.addColorStop(0.6, th.sky[1]); g.addColorStop(1, th.sky[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (th.stars) { ctx.fillStyle = '#ffffff'; for (const [sx, sy, b] of stars) { if (sy > hy - 30) continue; ctx.globalAlpha = Math.min(1, (0.25 + 0.5 * b * (0.6 + 0.4 * Math.sin(t * 2 + sx))) * th.stars); ctx.fillRect(sx, sy, 1.4, 1.4); } ctx.globalAlpha = 1; }
  const yaw = Math.atan2(cam.F[0], cam.F[1]); // sky objects drift with the camera's heading
  if (th.aurora) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 3; b++) { ctx.beginPath(); for (let x = 0; x <= W; x += 16) { const y = hy - 170 - b * 34 + Math.sin(x * 0.008 + t * 0.4 + b) * 26 + Math.sin(x * 0.021 - t * 0.25) * 12; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } for (let x = W; x >= 0; x -= 16) { const y = hy - 120 - b * 34 + Math.sin(x * 0.009 + t * 0.35 + b * 2) * 20; ctx.lineTo(x, y); } ctx.closePath(); const ag = ctx.createLinearGradient(0, hy - 220, 0, hy - 90); ag.addColorStop(0, 'rgba(120,80,255,0)'); ag.addColorStop(0.5, `rgba(60,255,170,${0.18 - b * 0.04})`); ag.addColorStop(1, 'rgba(60,255,200,0)'); ctx.fillStyle = ag; ctx.fill(); }
    ctx.restore();
  }
  if (th.obj) {
    const o = th.obj, ox = ((o.x * W - yaw * 500) % (W + 200) + W + 200) % (W + 200) - 100, oy = hy - (1 - o.y) * 260;
    if (o.type === 'earth') { glow(ctx, ox, oy, o.r * 2.4, '#4aa8ff', 0.5); const eg = ctx.createRadialGradient(ox - o.r * 0.3, oy - o.r * 0.3, 2, ox, oy, o.r); eg.addColorStop(0, '#9fd8ff'); eg.addColorStop(0.5, '#2a6ad0'); eg.addColorStop(1, '#0a1a40'); ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(ox, oy, o.r, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(80,200,120,0.75)'; for (const [a, b2, c] of [[-0.3, -0.2, 0.35], [0.25, 0.15, 0.25], [-0.1, 0.4, 0.2]]) { ctx.beginPath(); ctx.ellipse(ox + a * o.r, oy + b2 * o.r, c * o.r, c * o.r * 0.6, 0.5, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(0,0,20,0.55)'; ctx.beginPath(); ctx.arc(ox + o.r * 0.45, oy + o.r * 0.1, o.r * 0.95, 0, TAU); ctx.fill(); }
    if (o.type === 'moon') { glow(ctx, ox, oy, o.r * 3, '#ffe9b0', 0.45); ctx.fillStyle = '#f6e6c0'; ctx.beginPath(); ctx.arc(ox, oy, o.r, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(160,140,110,0.35)'; for (const [a, b2, c] of [[-0.3, -0.2, 0.2], [0.3, 0.25, 0.15], [0.05, 0.35, 0.1]]) { ctx.beginPath(); ctx.arc(ox + a * o.r, oy + b2 * o.r, c * o.r, 0, TAU); ctx.fill(); } }
    if (o.type === 'moons') { for (const [dx, dy, r] of [[0, 0, o.r], [70, 24, o.r * 0.6]]) { ctx.fillStyle = '#d8b8a0'; ctx.beginPath(); ctx.arc(ox + dx, oy + dy, r, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(60,20,10,0.5)'; ctx.beginPath(); ctx.arc(ox + dx + r * 0.4, oy + dy, r, 0, TAU); ctx.fill(); } }
    if (o.type === 'sun') { glow(ctx, ox, hy - 10, 260, '#ff9a4a', 0.55); ctx.fillStyle = '#ffd08a'; ctx.beginPath(); ctx.arc(ox, hy - 6, o.r, Math.PI, 0); ctx.fill(); }
  }
  if (th.fx === 'search') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + Math.sin(t * 0.5 + i * 2.1) * 0.6, bx = W * (0.2 + i * 0.3), by = hy; const sg = ctx.createLinearGradient(bx, by, bx + Math.cos(a) * 500, by + Math.sin(a) * 500); sg.addColorStop(0, 'rgba(255,240,180,0.25)'); sg.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a - 0.05) * 600, by + Math.sin(a - 0.05) * 600); ctx.lineTo(bx + Math.cos(a + 0.05) * 600, by + Math.sin(a + 0.05) * 600); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  // skyline silhouette with parallax
  const sl = skylineFor(th.line), off = ((cam.pos.x * 0.3 + yaw * 300) % 160 + 160) % 160;
  ctx.save(); ctx.translate(-off, 0);
  ctx.fillStyle = th.ink; ctx.beginPath(); ctx.moveTo(0, hy + 400); for (const [x, h] of sl.pts) ctx.lineTo(x, hy - 30 - h); ctx.lineTo(sl.Wd, hy + 400); ctx.closePath(); ctx.fill();
  if (th.inkLight) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(0, hy + 400); for (const [x, h] of sl.pts) ctx.lineTo(x, hy - 30 - h * 0.92); ctx.lineTo(sl.Wd, hy + 400); ctx.closePath(); ctx.fill(); }
  for (const e of sl.extra) {
    ctx.fillStyle = th.ink;
    if (e.type === 'stack') { ctx.fillRect(e.x - e.w / 2, hy - 30 - e.h, e.w, e.h); const fy = hy - 30 - e.h; glow(ctx, e.x, fy, 14, '#ff6a2a', 0.5 + 0.3 * Math.sin(t * 3 + e.x)); for (let k = 0; k < 4; k++) { const p = ((t * 0.25 + k / 4 + e.x * 0.01) % 1); ctx.fillStyle = `rgba(70,60,60,${0.35 * (1 - p)})`; ctx.beginPath(); ctx.arc(e.x + p * 30, fy - p * 70, 6 + p * 18, 0, TAU); ctx.fill(); } }
    if (e.type === 'spire') { ctx.fillRect(e.x - 4, hy - 30 - e.h, 8, e.h); ctx.beginPath(); ctx.arc(e.x, hy - 30 - e.h * 0.7, 16, 0, TAU); ctx.fill(); glow(ctx, e.x, hy - 30 - e.h, 10, '#ff4a4a', 0.5 + 0.5 * (Math.sin(t * 4) > 0)); }
    if (e.type === 'sails') { for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(e.x + k * 26, hy - 34); ctx.quadraticCurveTo(e.x + k * 26 + 6, hy - 90 + k * 8, e.x + k * 26 + 30, hy - 34); ctx.closePath(); ctx.fillStyle = '#e8eef8'; ctx.fill(); } }
  }
  for (const [x, h, r] of sl.wins) { const c = th.lights[Math.floor(r * th.lights.length) % th.lights.length]; if (th.line === 'pyramids') { glow(ctx, x, hy - 30 - h, 10, c, 0.7); continue; } ctx.fillStyle = hexA(c, 0.35 + 0.35 * ((Math.sin(t * 0.7 + r * 40) > -0.6) ? 1 : 0)); ctx.fillRect(x, hy - 30 - h, th.line === 'hills' ? 2 : 5, 2); }
  ctx.restore();
}
// screen-space weather drawn over the scene (cheap: positions are pure functions of time)
function drawThemeFx(ctx, team, t, cam) {
  const th = themeOf(team);
  // colour grade: each park's light tints the whole scene
  ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = th.grade ?? 0.35; ctx.fillStyle = th.sky[2]; ctx.fillRect(0, 0, W, H); ctx.restore(); if (!th.fx || th.fx === 'search') { if (th.caustics) drawCaustics(ctx, t); return; }
  if (th.caustics) drawCaustics(ctx, t);
  const n = FX.high ? 90 : 40; ctx.save();
  for (let i = 0; i < n; i++) {
    const r1 = (i * 0.6180339) % 1, r2 = (i * 0.4142135) % 1, r3 = (i * 0.7320508) % 1;
    if (th.fx === 'rain') { const x = (r1 * W + t * 120) % W, y = (r2 * H + t * (700 + r3 * 300)) % H; ctx.strokeStyle = 'rgba(170,200,255,0.28)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y - 16); ctx.stroke(); }
    else if (th.fx === 'snow') { const x = (r1 * W + Math.sin(t + i) * 20 + t * 15) % W, y = (r2 * H + t * (30 + r3 * 40)) % H; ctx.fillStyle = 'rgba(240,248,255,0.8)'; ctx.beginPath(); ctx.arc(x, y, 1 + r3 * 1.8, 0, TAU); ctx.fill(); }
    else if (th.fx === 'embers') { const y = H - ((r2 * H + t * (40 + r3 * 50)) % H), x = (r1 * W + Math.sin(t * 2 + i) * 15) % W; ctx.fillStyle = `rgba(255,${120 + r3 * 80 | 0},40,${0.5 + 0.5 * Math.sin(t * 6 + i)})`; ctx.fillRect(x, y, 2, 2); }
    else if (th.fx === 'dust' || th.fx === 'sand') { const x = (r1 * W + t * (60 + r3 * 80)) % W, y = (r2 * H + Math.sin(t + i) * 10) % H; ctx.fillStyle = th.fx === 'dust' ? 'rgba(230,150,110,0.25)' : 'rgba(240,210,150,0.25)'; ctx.fillRect(x, y, 3 + r3 * 4, 1.5); }
    else if (th.fx === 'bubbles') { const y = H - ((r2 * H + t * (25 + r3 * 35)) % H), x = (r1 * W + Math.sin(t * 1.5 + i) * 12) % W; ctx.strokeStyle = 'rgba(180,255,250,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 1.5 + r3 * 3, 0, TAU); ctx.stroke(); }
    else if (th.fx === 'code') { if (i % 2) continue; const x = Math.floor(r1 * 48) * 20, y = (r2 * H + t * (60 + r3 * 60)) % H; ctx.fillStyle = 'rgba(93,255,142,0.22)'; ctx.font = `700 11px ${FONT_H}`; ctx.fillText(((i * 7 + Math.floor(t * 4)) % 2) ? '1' : '0', x, y); }
    else if (th.fx === 'fireflies') { const x = (r1 * W + Math.sin(t * 0.7 + i) * 30) % W, y = (r2 * H * 0.8 + Math.cos(t * 0.9 + i) * 20); const a = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7); glow(ctx, x, y, 6, '#d8ff6a', a * 0.8); }
  }
  ctx.restore();
}
function drawCaustics(ctx, t) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(120,255,240,0.05)'; ctx.lineWidth = 10;
  for (let k = 0; k < 7; k++) { ctx.beginPath(); for (let x = 0; x <= W; x += 24) { const y = (k * 90 + Math.sin(x * 0.02 + t * 1.2 + k) * 18 + Math.sin(x * 0.007 - t * 0.6) * 30 + t * 12) % (H + 60) - 30; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  ctx.restore();
}

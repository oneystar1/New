// IRON DIAMOND — match rendering & HUD.
'use strict';
const ease = k => k * k * (3 - 2 * k);
function matchCamera(m) {
  const k = ease(m.camK), c = m.cam;
  const fx = clamp(m.focus.x, -230, 230), fy = clamp(m.focus.y, 0, 330);
  const bp = [0, -31, 11.5], bt = [0, 40, 2.6], bf = 860;
  const fp = [fx * 0.7, fy - 150, 112 + fy * 0.1], ft = [fx, fy + 18, 0], ff = 640;
  const sh = m.shake * 1.2;
  c.set(lerp(bp[0], fp[0], k) + rnd(-sh, sh) * 0.3, lerp(bp[1], fp[1], k), lerp(bp[2], fp[2], k) + rnd(-sh, sh) * 0.2, lerp(bt[0], ft[0], k), lerp(bt[1], ft[1], k), lerp(bt[2], ft[2], k), lerp(bf, ff, k));
  return c;
}
function batSwingDir(p, hand, kind) {
  let psi, el;
  if (kind === 'bunt') { psi = 0; el = 5; }
  else if (p == null) { psi = 200; el = 65; }
  else if (p < 0.45) { const k = p / 0.45; psi = 200 + 160 * k; el = 65 - 68 * k; }
  else { const k = Math.min(1, (p - 0.45) / 0.55); psi = 360 + 120 * k; el = -3 + 53 * k; }
  if (hand < 0) psi = 180 - psi;
  psi *= DEG; el *= DEG; return [Math.cos(el) * Math.cos(psi), Math.cos(el) * Math.sin(psi), Math.sin(el)];
}
function drawMatch(ctx, m) {
  const cam = matchCamera(m), home = m.sides[1].team, t = m.time;
  Park.draw(ctx, cam, home, t, (c, w, h, tt) => drawBigBoard(c, w, h, m, tt));
  const ents = [];
  const fieldSide = m.sides[m.fld], batSide = m.sides[m.bat];
  const boost = lerp(1, 1.7, ease(m.camK));
  const pitchView = m.state === 'pitch' || (m.state === 'wait' && m.view === 'bat') || m.state === 'intro';
  const pt = m.pt;
  // fielders
  for (const f of m.fielders) {
    let x = f.x, y = f.y; const o = { t: t + f.hx * 0.01, run: hyp(f.vx, f.vy) > 1 ? 1 : 0, back: f.vy > 4, lean: clamp(f.vx / 30, -1, 1) };
    let sc = 1; if (pitchView && f.pos === 'C') { o.back = true; o.crouch = 0.5; o.alpha = 0.42; sc = 0.62; y = -4.5; }
    if (pitchView && f.pos === 'P' && pt) {
      o.back = false;
      if (pt.stage === 'windup') o.throwArm = clamp((pt.t - (pt.wt - 0.6)) / 0.6, 0, 1) * 0.6;
      else if (pt.stage === 'flight') o.throwArm = clamp(0.6 + (pt.t - pt.t0) / 0.25 * 0.4, 0, 1);
      else if (pt.stage === 'aim') o.ball = true;
    }
    if (m.ball && m.ball.held && m.ball.held.f === f) o.ball = true;
    if (f.throwAnim > 0) { o.throwArm = 1 - f.throwAnim / 0.3; f.throwAnim -= 1 / 60; }
    ents.push({ x, y, z: 0, r: f.r, team: fieldSide.team, o, ctrl: m.ctrlF === f, side: fieldSide, sc });
  }
  // batter, runners
  if (pitchView && pt) {
    const bt = m.batter(), bx = m.batterX();
    ents.push({ x: bx, y: 0, z: 0, r: bt, team: batSide.team, o: { t, back: true }, batter: true, side: batSide });
    for (let i = 0; i < 3; i++) if (m.bases[i]) { const B = BASES[i + 1], N = BASES[(i + 2) % 4]; const d = hyp(N.x - B.x, N.y - B.y); ents.push({ x: B.x + (N.x - B.x) / d * 4, y: B.y + (N.y - B.y) / d * 4, z: 0, r: m.bases[i], team: batSide.team, o: { t, back: false, crouch: 0.2 }, side: batSide }); }
  } else if (m.runners) {
    for (const rn of m.runners) { if (rn.out || rn.scored) continue; const p = basePos(rn.s); const dir = rn.tgt >= rn.s ? 1 : -1; const seg = Math.min(3, Math.floor(rn.s)); const a = BASES[seg], b = BASES[seg + 1]; const vy = (b.y - a.y) * dir, vx = (b.x - a.x) * dir; const moving = rn.s !== rn.tgt; ents.push({ x: p.x, y: p.y, z: 0, r: rn.r, team: batSide.team, o: { t: t + rn.start, run: moving ? 1 : 0, back: moving ? vy > 0 : false, lean: moving ? clamp(vx / 80, -1, 1) : 0 }, side: batSide }); }
  }
  // umpire drone
  for (const e of ents) { e.q = cam.proj(e.x, e.y, 0); }
  // shadows (three faint ones from the light towers + a core)
  ctx.save();
  for (const e of ents) { if (!e.q || e.ump) continue; const r = 1.6 * e.q.s * boost; ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(e.q.x, e.q.y, r * 1.1, r * 0.38, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (const dx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(e.q.x + dx * r * 1.3, e.q.y + r * 0.1, r * 1.4, r * 0.3, dx * 0.3, 0, TAU); ctx.fill(); } }
  ctx.restore();
  // ball shadow + landing marker
  const ballW = ballWorld(m);
  if (m.landing && m.state === 'play') { const q = cam.proj(m.landing.x, m.landing.y, 0.1); if (q) { const r = 3 * q.s * boost; ctx.strokeStyle = hexA('#ffd84a', 0.6 + 0.3 * Math.sin(t * 10)); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(q.x, q.y, r, r * 0.4, 0, 0, TAU); ctx.stroke(); } }
  if (ballW) { const q = cam.proj(ballW.x, ballW.y, 0); if (q) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(q.x, q.y, Math.max(1.5, 0.5 * q.s * boost), Math.max(0.8, 0.2 * q.s * boost), 0, 0, TAU); ctx.fill(); } }
  // control ring
  for (const e of ents) if (e.ctrl && e.q) { const r = 2.6 * e.q.s * boost; ctx.strokeStyle = e.team.g; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(e.q.x, e.q.y, r, r * 0.4, 0, 0, TAU); ctx.stroke(); glow(ctx, e.q.x, e.q.y, r * 1.4, e.team.g, 0.35); }
  // entities sorted far → near; the ball is inserted by depth
  const list = ents.filter(e => e.q).map(e => ({ d: e.q.d, e }));
  if (ballW) { const q = cam.proj(ballW.x, ballW.y, ballW.z); if (q) list.push({ d: q.d - 0.5, ball: q, w: ballW }); }
  list.sort((a, b) => b.d - a.d);
  for (const it of list) {
    if (it.ball) { drawBall(ctx, cam, it.ball, it.w, m, boost); continue; }
    const e = it.e, q = e.q;
    if (e.ump) { const z = 7.5 + Math.sin(t * 2) * 0.3, p = cam.proj(e.x, e.y, z); if (p) { ctx.fillStyle = '#1a1f2b'; ctx.beginPath(); ctx.arc(p.x, p.y, 0.6 * p.s, 0, TAU); ctx.fill(); glow(ctx, p.x, p.y, 1.2 * p.s, '#ff3d5a', 0.8); ctx.fillStyle = '#ff3d5a'; ctx.beginPath(); ctx.arc(p.x, p.y, 0.18 * p.s, 0, TAU); ctx.fill(); } continue; }
    const hp = e.r.hp / maxHp(e.r, e.side);
    if (e.batter) { drawBatter(ctx, cam, m, e, q); continue; }
    drawRobot(ctx, q.x, q.y, q.s * boost * (e.sc || 1), e.r, e.team, Object.assign({ hp }, e.o));
    if (e.ctrl) { const top = q.y - CLASSES[e.r.cls].h * q.s * boost - 10; ctx.fillStyle = e.team.g; ctx.beginPath(); ctx.moveTo(q.x - 6, top - 8); ctx.lineTo(q.x + 6, top - 8); ctx.lineTo(q.x, top); ctx.closePath(); ctx.fill(); }
  }
  m.parts.drawWorld(ctx, cam);
  Park.drawBackstop(ctx, cam);
  // strike zone & aim reticle (batting view)
  if (pitchView && pt && m.camK < 0.2) drawZone(ctx, cam, m);
  // vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  drawHUD(ctx, m, pitchView);
  if (m.state === 'clash' && m.clash) m.clash.draw(ctx);
  drawBanners(ctx, m);
}
function ballWorld(m) {
  if ((m.state === 'pitch' || (m.state === 'wait' && m.view === 'bat')) && m.pt) {
    const pt = m.pt; if (pt.hitBall) return { x: pt.hitBall.x, y: pt.hitBall.y, z: pt.hitBall.z };
    if (pt.stage === 'flight' || pt.stage === 'post') return { x: pt.bx, y: pt.by, z: pt.bz, pitch: true }; return null;
  }
  if (m.ball && !(m.ball.held && m.ball.held.f)) return { x: m.ball.x, y: m.ball.y, z: m.ball.z };
  return null;
}
function drawBall(ctx, cam, q, w, m, boost) {
  const r = Math.max(2.2, 0.16 * q.s * (w.pitch ? 1.5 : boost));
  let col = '#ffffff';
  if (w.pitch && m.pt) col = PITCHES[m.pt.type].col;
  // trail
  if (m.ball && m.ball.trail && !w.pitch) { ctx.strokeStyle = 'rgba(200,240,255,0.35)'; ctx.lineWidth = r; ctx.beginPath(); let first = true; for (const p of m.ball.trail) { const tq = cam.proj(p[0], p[1], p[2]); if (!tq) continue; if (first) { ctx.moveTo(tq.x, tq.y); first = false; } else ctx.lineTo(tq.x, tq.y); } ctx.lineTo(q.x, q.y); ctx.stroke(); }
  glow(ctx, q.x, q.y, r * 4, col, 0.8);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill();
  if (w.pitch && m.pt && PITCHES[m.pt.type].wobble) glow(ctx, q.x, q.y, r * 7, '#b14bff', 0.6 + 0.4 * Math.sin(m.time * 40));
}
function drawBatter(ctx, cam, m, e, q) {
  const pt = m.pt, hand = pt.hand, X = e.x; const sw = pt.swing;
  let p = null, kind = sw ? sw.kind : null;
  if (sw) p = clamp((pt.t - sw.t0) / 0.3, 0, 1);
  if (pt.hit && sw) p = clamp((pt.t - sw.t0) / 0.3, 0, 1);
  let hx = X + hand * 0.55, hy = 0.2, hz = 4.6;
  if (kind === 'bunt') { hx = X + hand * 0.9; hy = 0.5; hz = 3.1; }
  else if (p != null) { const k = p < 0.45 ? p / 0.45 : 1 - (p - 0.45) / 0.55 * 0.4; hx = X + hand * (0.55 + 0.7 * k); hy = 0.2 + 0.5 * k; hz = 4.6 - 1.3 * k; }
  const hq = cam.proj(hx, hy, hz); const d = batSwingDir(p, hand, kind); const L = 3.1;
  const eq = cam.proj(hx + d[0] * L, hy + d[1] * L, hz + d[2] * L);
  const hp = e.r.hp / maxHp(e.r, e.side);
  const o = Object.assign({ hp, hands: hq ? { x: (hq.x - q.x) / q.s, y: (hq.y - q.y) / q.s } : null }, e.o);
  if (p != null && kind !== 'bunt') o.lean = hand * Math.sin(p * Math.PI) * 0.6;
  drawRobot(ctx, q.x, q.y, q.s, e.r, e.team, o);
  if (hq && eq) {
    const tm = e.team; ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = hexA(tm.g, 0.35); ctx.lineWidth = 0.55 * q.s; ctx.beginPath(); ctx.moveTo(hq.x, hq.y); ctx.lineTo(eq.x, eq.y); ctx.stroke();
    ctx.strokeStyle = '#1a1f2b'; ctx.lineWidth = 0.22 * q.s; ctx.beginPath(); ctx.moveTo(hq.x, hq.y); ctx.lineTo(lerp(hq.x, eq.x, 0.3), lerp(hq.y, eq.y, 0.3)); ctx.stroke();
    ctx.strokeStyle = '#eaffff'; ctx.lineWidth = 0.26 * q.s; ctx.beginPath(); ctx.moveTo(lerp(hq.x, eq.x, 0.3), lerp(hq.y, eq.y, 0.3)); ctx.lineTo(eq.x, eq.y); ctx.stroke();
    ctx.restore(); glow(ctx, eq.x, eq.y, 1.2 * q.s, tm.g, 0.6);
    if (p != null && p > 0.25 && p < 0.7 && kind !== 'bunt') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(tm.g, 0.25); ctx.lineWidth = 0.8 * q.s; ctx.beginPath(); ctx.moveTo(eq.x, eq.y); const d2 = batSwingDir(Math.max(0, p - 0.12), hand, kind); const e2 = cam.proj(hx + d2[0] * L, hy + d2[1] * L, hz + d2[2] * L); if (e2) ctx.lineTo(e2.x, e2.y); ctx.stroke(); ctx.restore(); }
  }
}
function drawZone(ctx, cam, m) {
  const pt = m.pt;
  const c = [[-ZONE_X + 0.12, 0, ZONE_Z0], [ZONE_X - 0.12, 0, ZONE_Z0], [ZONE_X - 0.12, 0, ZONE_Z1], [-ZONE_X + 0.12, 0, ZONE_Z1]];
  const humanBat = m.pad(m.bat) != null;
  ctx.save(); ctx.globalAlpha = humanBat ? 0.9 : 0.45;
  for (let i = 0; i < 4; i++) cam.line(ctx, c[i], c[(i + 1) % 4], 'rgba(160,240,255,0.55)', 1.5);
  ctx.restore();
  // batter's sweet-spot indicator
  if (humanBat) { const q = cam.proj(pt.shift, 0, BAT_Z); if (q) { ctx.strokeStyle = hexA(m.sides[m.bat].team.g, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, 0.35 * q.s, 0, TAU); ctx.stroke(); } }
  // pitcher aim reticle (only when it would not spoil a human batter)
  if (m.pad(m.fld) != null && (!humanBat || m.cfg.showAim) && pt.stage === 'aim') {
    const q = cam.proj(pt.aimX, 0, pt.aimZ); if (q) { const r = 0.32 * q.s, col = PITCHES[pt.type].col; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.moveTo(q.x - r * 1.7, q.y); ctx.lineTo(q.x - r * 0.6, q.y); ctx.moveTo(q.x + r * 0.6, q.y); ctx.lineTo(q.x + r * 1.7, q.y); ctx.moveTo(q.x, q.y - r * 1.7); ctx.lineTo(q.x, q.y - r * 0.6); ctx.moveTo(q.x, q.y + r * 0.6); ctx.lineTo(q.x, q.y + r * 1.7); ctx.stroke(); glow(ctx, q.x, q.y, r * 2, col, 0.4); }
  }
}
function drawBigBoard(ctx, w, h, m, t) {
  const n = Math.max(m.innings, m.inning);
  txt(ctx, 'IRON DIAMOND', 12, 20, 22, m.sides[1].team.g, 'left', FONT_H, 900);
  txt(ctx, `INN ${m.inning}`, w - 12, 20, 20, '#ffffff', 'right', FONT_H, 900);
  const cw = Math.min(30, (w - 200) / (n + 2));
  for (let i = 0; i < n; i++) txt(ctx, String(i + 1), 110 + i * cw, 52, 16, '#8f9bc0', 'center', FONT_H, 700);
  txt(ctx, 'R', 110 + n * cw + 14, 52, 16, '#ffd84a', 'center', FONT_H, 900); txt(ctx, 'H', 110 + (n + 1) * cw + 14, 52, 16, '#8f9bc0', 'center', FONT_H, 900);
  for (let s = 0; s < 2; s++) {
    const y = 84 + s * 36, sd = m.sides[s];
    ctx.fillStyle = sd.team.p; ctx.fillRect(12, y - 13, 8, 26);
    txt(ctx, sd.team.id, 28, y, 24, '#ffffff', 'left', FONT_H, 900);
    for (let i = 0; i < n; i++) { const v = m.line[s][i]; txt(ctx, v == null ? '' : String(v), 110 + i * cw, y, 20, '#ffffff', 'center', FONT_H, 700); }
    txt(ctx, String(m.score[s]), 110 + n * cw + 14, y, 24, '#ffd84a', 'center', FONT_H, 900); txt(ctx, String(sd.hits), 110 + (n + 1) * cw + 14, y, 20, '#ffffff', 'center', FONT_H, 700);
  }
}
function drawHUD(ctx, m, pitchView) {
  // score bug
  const x = 14, y = 12;
  panel(ctx, x, y, 300, 76, '#46e0ff', 0.8);
  for (let s = 0; s < 2; s++) {
    const sd = m.sides[s], yy = y + 22 + s * 32, bat = m.bat === s;
    if (bat) { const g = ctx.createLinearGradient(x + 6, 0, x + 140, 0); g.addColorStop(0, hexA(sd.team.g, 0.35)); g.addColorStop(1, hexA(sd.team.g, 0)); ctx.fillStyle = g; ctx.fillRect(x + 6, yy - 14, 134, 28); ctx.fillStyle = sd.team.g; ctx.fillRect(x + 6, yy - 14, 3, 28); }
    drawEmblem(ctx, x + 22, yy, 12, sd.team);
    txt(ctx, sd.team.id, x + 42, yy, 20, bat ? '#ffffff' : '#a9b3d3', 'left', FONT_H, 900);
    txt(ctx, String(m.score[s]), x + 132, yy, 26, '#ffffff', 'right', FONT_H, 900);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 144, y + 8, 1.5, 60);
  txt(ctx, (m.half ? '▼' : '▲') + ' ' + m.inning, x + 154, y + 22, 18, '#ffffff', 'left', FONT_H, 900);
  const dots = (label, n, max, col, yy) => { txt(ctx, label, x + 154, yy, 13, '#9aa6c8', 'left', FONT_H, 700); for (let i = 0; i < max; i++) { ctx.fillStyle = i < n ? col : 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(x + 174 + i * 13, yy, 4.5, 0, TAU); ctx.fill(); if (i < n) glow(ctx, x + 174 + i * 13, yy, 9, col, 0.5); } };
  dots('B', m.balls, 3, '#3dffa0', y + 44); dots('S', m.strikes, 2, '#ffd23d', y + 60);
  txt(ctx, 'O', x + 214, y + 44, 13, '#9aa6c8', 'left', FONT_H, 700); for (let i = 0; i < 2; i++) { ctx.fillStyle = i < m.outs ? '#ff4a5a' : 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(x + 232 + i * 13, y + 44, 4.5, 0, TAU); ctx.fill(); }
  // base diamond
  const bx = x + 268, by = y + 38;
  const occ = m.state === 'play' && m.runners.length ? [1, 2, 3].map(b => m.runners.some(r => !r.out && !r.scored && Math.round(r.s) === b && Math.abs(r.s - b) < 0.05)) : m.bases.map(Boolean);
  const bp = [[bx + 12, by], [bx, by - 12], [bx - 12, by]];
  for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(bp[i][0], bp[i][1]); ctx.rotate(Math.PI / 4); ctx.fillStyle = occ[i] ? m.sides[m.bat].team.g : 'rgba(255,255,255,0.15)'; ctx.fillRect(-5.5, -5.5, 11, 11); ctx.restore(); }
  if (m.state === 'over') return;
  const humanBat = m.pad(m.bat) != null, humanFld = m.pad(m.fld) != null;
  if (pitchView && m.pt && m.state !== 'intro') {
    // batter card
    const bt = m.batter(), bs = m.sides[m.bat];
    robotCard(ctx, 14, H - 98, bt, bs, 'AT BAT', `${bs.batIdx + 1}. ${bt.pos}`, [['POW', m.st(bt, 'pow')], ['CON', m.st(bt, 'con')], ['SPD', m.st(bt, 'spd')]]);
    const pr = m.pitcher(), ps = m.sides[m.fld];
    robotCard(ctx, W - 354, H - 98, pr, ps, 'PITCHING', `VEL ${m.st(pr, 'vel')} · BRK ${m.st(pr, 'brk')}`, null, pr.battery / 100);
    // pitch selector
    if (humanFld) {
      const pt = m.pt; panel(ctx, W - 164, H - 268, 150, 162, ps.team.g, 0.75);
      txt(ctx, 'PITCH  [B]', W - 152, H - 252, 13, '#9aa6c8', 'left', FONT_H, 700);
      PITCHES.forEach((p, i) => { const yy = H - 230 + i * 25, sel = i === pt.type, can = p.cost <= pr.battery; if (sel) { ctx.fillStyle = hexA(p.col, 0.18); ctx.fillRect(W - 158, yy - 11, 138, 22); } ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(W - 146, yy, 4, 0, TAU); ctx.fill(); txt(ctx, p.name, W - 136, yy, 15, can ? (sel ? '#ffffff' : '#aab4d6') : '#5a6280', 'left', FONT_H, sel ? 900 : 700); if (p.cost > 3) txt(ctx, `⚡${p.cost}`, W - 26, yy, 13, '#d06bff', 'right', FONT_B, 700); });
    }
    let hint = '';
    if (humanBat && humanFld) hint = 'BATTER: ←/→ shift · A swing · B power · ↓+A bunt     PITCHER: aim, B pitch, A throw, steer ←/→';
    else if (humanBat) hint = '←/→ SHIFT   A SWING   B POWER SWING   ↓+A BUNT';
    else if (humanFld) hint = m.pt.stage === 'aim' ? 'D-PAD AIM   B PITCH TYPE   A THROW' : 'HOLD ←/→ TO STEER THE PITCH';
    if (hint) txt(ctx, hint, W / 2, H - 14, 15, '#c8d2f0', 'center', FONT_B, 700);
  } else if (m.state === 'play' || m.state === 'wait') {
    drawMinimap(ctx, m);
    let hint = '';
    if (humanFld && m.ball) hint = m.ball.held && m.ball.held.f ? 'HOLD DIRECTION + A TO THROW:  → 1ST   ↑ 2ND   ← 3RD   ↓ HOME' : 'RUN TO THE BALL — YELLOW RING MARKS THE LANDING SPOT';
    if (humanBat && m.state === 'play') hint = (hint ? hint + '     ' : '') + 'A ADVANCE RUNNERS   B RETREAT';
    if (hint) txt(ctx, hint, W / 2, H - 14, 15, '#c8d2f0', 'center', FONT_B, 700);
  }
}
function robotCard(ctx, x, y, r, sd, label, sub, stats, battery) {
  panel(ctx, x, y, 340, 84, sd.team.g, 0.8);
  // portrait
  ctx.save(); rrect(ctx, x + 8, y + 8, 68, 68, 6); ctx.fillStyle = hexA(sd.team.p, 0.25); ctx.fill(); ctx.clip(); drawRobot(ctx, x + 42, y + 8 + 68 + 26, 12.5, r, sd.team, { t: performance.now() / 1000, hp: r.hp / maxHp(r, sd) }); ctx.restore();
  txt(ctx, label, x + 86, y + 16, 11, sd.team.g, 'left', FONT_H, 900);
  txt(ctx, `${r.name} #${r.num}`, x + 86, y + 34, 18, '#ffffff', 'left', FONT_H, 900);
  txt(ctx, `${CLASSES[r.cls].name} · ${sub}`, x + 86, y + 52, 13, '#9aa6c8', 'left', FONT_B, 700);
  const hp = r.hp / maxHp(r, sd);
  txt(ctx, 'ARMOR', x + 86, y + 69, 10, '#9aa6c8', 'left', FONT_H, 700); bar(ctx, x + 138, y + 65, 80, 8, hp, hpColor(hp));
  if (battery != null) { txt(ctx, 'CELL', x + 230, y + 69, 10, '#9aa6c8', 'left', FONT_H, 700); bar(ctx, x + 264, y + 65, 64, 8, battery, battery > 0.3 ? '#46e0ff' : '#ff4a5a'); }
  if (stats) stats.forEach(([k, v], i) => { txt(ctx, k, x + 266 + i * 26, y + 14, 9, '#9aa6c8', 'center', FONT_H, 700); txt(ctx, String(v), x + 266 + i * 26, y + 30, 15, '#ffffff', 'center', FONT_H, 900); });
}
function drawMinimap(ctx, m) {
  const cx = W - 92, cy = H - 40, k = 0.32;
  panel(ctx, W - 188, H - 172, 176, 150, '#46e0ff', 0.7);
  const P = (x, y) => [cx + x * k, cy - y * k];
  ctx.fillStyle = 'rgba(40,140,80,0.35)'; ctx.beginPath(); ctx.moveTo(...P(0, 0)); for (let i = 0; i <= 20; i++) { const th = -P_ + 2 * P_ * i / 20; ctx.lineTo(...P(...polar(fenceR(th), th))); } ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let b = 0; b <= 4; b++) { const B = BASES[b]; b ? ctx.lineTo(...P(B.x, B.y)) : ctx.moveTo(...P(B.x, B.y)); } ctx.stroke();
  for (const f of m.fielders) { ctx.fillStyle = m.ctrlF === f ? '#ffffff' : m.sides[m.fld].team.g; ctx.beginPath(); ctx.arc(...P(f.x, f.y), m.ctrlF === f ? 3.5 : 2.5, 0, TAU); ctx.fill(); }
  for (const rn of m.runners || []) if (!rn.out && !rn.scored) { const p = basePos(rn.s); ctx.fillStyle = m.sides[m.bat].team.p; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(...P(p.x, p.y), 3.2, 0, TAU); ctx.fill(); ctx.stroke(); }
  if (m.ball) { const b = m.ball; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(...P(b.x, b.y), 2, 0, TAU); ctx.fill(); glow(ctx, ...P(b.x, b.y), 6, '#ffffff', 0.6); }
}
function drawBanners(ctx, m) {
  const list = m.banners; if (!list.length) return; const b = list[list.length - 1];
  const k = b.t / b.dur, inA = Math.min(1, b.t / 0.15), outA = Math.min(1, (b.dur - b.t) / 0.25), a = Math.min(inA, outA);
  ctx.save(); ctx.globalAlpha = a; const y = H * 0.36;
  const sc = 1 + (1 - inA) * 0.4; ctx.translate(W / 2, y); ctx.scale(sc, sc);
  const w = Math.min(W, b.text.length * b.size * 0.75 + 120);
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.2, 'rgba(5,8,20,0.7)'); g.addColorStop(0.8, 'rgba(5,8,20,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -b.size * 0.75, w, b.size * 1.5 + (b.sub ? 26 : 0));
  ctx.fillStyle = b.glow; ctx.fillRect(-w * 0.3, -b.size * 0.75, w * 0.6, 2); ctx.fillRect(-w * 0.3, b.size * 0.75 + (b.sub ? 26 : 0), w * 0.6, 2);
  glowTxt(ctx, b.text, 0, 0, b.size, b.color, b.glow);
  if (b.sub) txt(ctx, b.sub, 0, b.size * 0.62 + 6, 18, '#dfe6ff', 'center', FONT_H, 700);
  ctx.restore();
}

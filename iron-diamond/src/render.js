// IRON DIAMOND — match rendering & HUD.
'use strict';
const ease = k => k * k * (3 - 2 * k);
function matchCamera(m) {
  const k = ease(m.camK), c = m.cam;
  const fx = clamp(m.focus.x, -230, 230), fy = clamp(m.focus.y, 0, 330);
  const pc = m.pitchCam(), bp = pc ? [2.6, 70, 10] : [0, -31, 11.5], bt = pc ? [0, 0, 3.0] : [0, 40, 2.6], bf = pc ? 1300 : 860;
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
function replayView(m) {
  // a stand-in match object whose positions come from the recorded frame
  const rp = m.replay, i = Math.floor(rp.i), k = rp.i - i, A = rp.frames[i], B = rp.frames[Math.min(i + 1, rp.frames.length - 1)];
  const L = (a, b) => a + (b - a) * k, vm = Object.create(m);
  vm.fielders = m.rec ? m.rec.fielders.map((f, j) => ({ r: A.f[j][4], pos: f.pos, x: L(A.f[j][0], B.f[j][0]), y: L(A.f[j][1], B.f[j][1]), vx: A.f[j][2], vy: A.f[j][3], hx: f.hx, hy: f.hy })) : [];
  vm.runners = m.rec ? m.rec.runners.map((rn, j) => ({ r: A.r[j][3], s: L(A.r[j][0], B.r[j][0]), tgt: A.r[j][1], out: A.r[j][2] === 1, scored: A.r[j][2] === 2, start: rn.start })) : [];
  const trail = []; for (let t = Math.max(0, i - 10); t <= i; t++) trail.push(rp.frames[t].b);
  vm.ball = { x: L(A.b[0], B.b[0]), y: L(A.b[1], B.b[1]), z: L(A.b[2], B.b[2]), held: A.h >= 0 ? { f: vm.fielders[A.h] } : null, trail };
  vm.state = 'play'; vm.view = 'field'; vm.camK = 1; vm.ctrlF = null; vm.landing = null; vm.banners = []; vm.isReplay = true; vm.ticker = null;
  return vm;
}
function replayCamera(vm, rp) {
  const b = vm.ball.held && vm.ball.held.f ? { x: vm.ball.held.f.x, y: vm.ball.held.f.y, z: 4 } : vm.ball;
  const fin = rp.frames[rp.frames.length - 1].b, aim = { x: lerp(b.x, fin[0], 0.4), y: lerp(b.y, fin[1], 0.4), z: Math.min(b.z, 40) * 0.5 + 3 };
  const want = { x: aim.x * 0.6 - 50, y: aim.y * 0.6 - 75, z: 14 + aim.z * 0.5 };
  if (!rp.cam) rp.cam = { x: -38, y: -40, z: 9, tx: 0, ty: 30, tz: 4 };
  const c = rp.cam, k = 0.08; c.x = lerp(c.x, want.x, k); c.y = lerp(c.y, want.y, k); c.z = lerp(c.z, want.z, k); c.tx = lerp(c.tx, aim.x, 0.15); c.ty = lerp(c.ty, aim.y, 0.15); c.tz = lerp(c.tz, aim.z, 0.15);
  vm.cam.set(c.x, c.y, c.z, c.tx, c.ty, c.tz, 720); return vm.cam;
}
function drawMatch(ctx, m) {
  if (m.state === 'replay' && m.replay) return drawReplay(ctx, m);
  const cam = m.isReplay ? replayCameraCached : matchCamera(m), home = m.sides[1].team, t = m.time;
  Park.draw(ctx, cam, home, t, (c, w, h, tt) => drawBigBoard(c, w, h, m, tt), { homeStands: !m.isReplay && m.pitchCam() && m.camK < 0.5 });
  const ents = [];
  const fieldSide = m.sides[m.fld], batSide = m.sides[m.bat];
  const boost = lerp(1, 1.9, ease(m.camK));
  const pitchView = m.state === 'pitch' || (m.state === 'wait' && m.view === 'bat') || m.state === 'intro';
  const pt = m.pt;
  // fielders
  for (const f of m.fielders) {
    let x = f.x, y = f.y; const o = { t: t + f.hx * 0.01, run: hyp(f.vx, f.vy) > 1 ? 1 : 0, back: f.vy > 4, lean: clamp(f.vx / 30, -1, 1) };
    const pcam = m.pitchCam();
    let sc = 1; if (pitchView && f.pos === 'C') { o.back = !pcam; o.crouch = 0.5; o.alpha = pcam ? 0.7 : 0.42; sc = pcam ? 0.6 : 0.62; y = pcam ? -5.5 : -4.5; }
    if (pitchView && f.pos === 'P' && pt) {
      o.back = pcam; if (pcam) o.alpha = 0.92;
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
    ents.push({ x: bx, y: 0, z: 0, r: bt, team: batSide.team, o: { t, back: !m.pitchCam() }, batter: true, side: batSide });
    for (let i = 0; i < 3; i++) if (m.bases[i]) { const st = pt.steal && pt.steal.r === m.bases[i] ? pt.steal : null; if (st) { const p2 = basePos(i + 1 + st.prog); ents.push({ x: p2.x, y: p2.y, z: 0, r: m.bases[i], team: batSide.team, o: { t, run: 1, back: true, lean: 0.4 }, side: batSide }); continue; } const lead = pt.stealPlan && pt.stealPlan.from === i + 1 ? 10 : 4; const B = BASES[i + 1], N = BASES[(i + 2) % 4]; const d = hyp(N.x - B.x, N.y - B.y); ents.push({ x: B.x + (N.x - B.x) / d * lead, y: B.y + (N.y - B.y) / d * lead, z: 0, r: m.bases[i], team: batSide.team, o: { t, back: false, crouch: lead > 4 ? 0.45 : 0.2, lean: lead > 4 ? -0.3 : 0 }, side: batSide }); }
  } else if (m.runners) {
    for (const rn of m.runners) { if (rn.out || rn.scored) continue; const p = basePos(rn.s); const dir = rn.tgt >= rn.s ? 1 : -1; const seg = Math.min(3, Math.floor(rn.s)); const a = BASES[seg], b = BASES[seg + 1]; const vy = (b.y - a.y) * dir, vx = (b.x - a.x) * dir; const moving = rn.s !== rn.tgt, slide = moving && rn.tgt % 1 === 0 && Math.abs(rn.tgt - rn.s) * 90 < 7 && rn.tgt > rn.s; ents.push({ x: p.x, y: p.y, z: 0, r: rn.r, team: batSide.team, o: { t: t + rn.start, run: moving && !slide ? 1 : 0, crouch: slide ? 0.7 : 0, back: moving ? vy > 0 : false, lean: slide ? clamp(vx / 40, -1, 1) * 1.2 + 0.3 : moving ? clamp(vx / 80, -1, 1) : 0 }, side: batSide }); }
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
    const aura = (e.batter && m.odBat) || (m.odFld && e.r && e.r.pos === 'P' && pitchView);
    if (aura) { const ac = e.team.g, hh = CLASSES[e.r.cls].h * q.s; glow(ctx, q.x, q.y - hh * 0.5, hh * (0.9 + 0.1 * Math.sin(t * 8)), ac, 0.55); for (let k = 0; k < 6; k++) { const ph = ((t * 0.8 + k / 6) % 1); glow(ctx, q.x + Math.sin(k * 2.1 + t) * hh * 0.3, q.y - ph * hh * 1.2, 6 + q.s * 0.5, ac, 1 - ph); } }
    if (e.batter) { drawBatter(ctx, cam, m, e, q); continue; }
    drawRobot(ctx, q.x, q.y, q.s * boost * (e.sc || 1), e.r, e.team, Object.assign({ hp }, e.o));
    if (e.ctrl) { const top = q.y - CLASSES[e.r.cls].h * q.s * boost - 10; ctx.fillStyle = e.team.g; ctx.beginPath(); ctx.moveTo(q.x - 6, top - 8); ctx.lineTo(q.x + 6, top - 8); ctx.lineTo(q.x, top); ctx.closePath(); ctx.fill(); }
  }
  m.parts.drawWorld(ctx, cam);
  Park.drawBackstop(ctx, cam);
  // contact flash + shockwave ring
  if (pitchView && pt && pt.hitT != null && pt.cross) { const k = (pt.t - pt.hitT) / 0.35; if (k >= 0 && k < 1) { const q = cam.proj(pt.cross.x, 0, pt.cross.z); if (q) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(200,250,255,${1 - k})`; ctx.lineWidth = 6 * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(q.x, q.y, 20 + k * 180, (20 + k * 180) * 0.6, 0, 0, TAU); ctx.stroke(); ctx.restore(); glow(ctx, q.x, q.y, 120 * (1 - k) + 20, '#ffffff', 1 - k); } if (k < 0.25) { ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - k * 4)})`; ctx.fillRect(0, 0, W, H); } } }
  // strike zone & aim reticle (batting view)
  if (pitchView && pt && m.camK < 0.2) drawZone(ctx, cam, m);
  // Rookie assist: show where the pitch will cross once it's halfway there
  if (pitchView && pt && pt.stage === 'flight' && m.diff === 0 && m.pad(m.bat) != null && m.pad(m.fld) == null) {
    const u = (pt.t - pt.t0) / pt.T; if (u > 0.4) { const q = cam.proj(pt.aimX, 0, pt.aimZ); if (q) { const a = Math.min(1, (u - 0.4) * 3); ctx.strokeStyle = `rgba(255,216,74,${0.7 * a})`; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(q.x, q.y, 0.3 * q.s, 0, TAU); ctx.stroke(); ctx.setLineDash([]); } }
  }
  // swing feedback
  if (m.fb && m.time - m.fb.t < 1.1 && pitchView) { const k = (m.time - m.fb.t) / 1.1, q = cam.proj(0, 0, 4.6); if (q) { ctx.globalAlpha = 1 - k * k; glowTxt(ctx, m.fb.text, q.x, q.y - k * 30, 26, '#ffffff', m.fb.color); ctx.globalAlpha = 1; } }
  drawThemeFx(ctx, home, t, cam);
  Game.bloom && Game.bloom();
  if (m.cutFlash > 0) { ctx.fillStyle = `rgba(255,255,255,${m.cutFlash * 2.2})`; ctx.fillRect(0, 0, W, H); }
  // vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (!m.isReplay) { drawHUD(ctx, m, pitchView); drawTicker(ctx, m); }
  if (m.cfg.derby && !m.isReplay) drawDerbyHud(ctx, m);
  if (pitchView && m.walkup && m.state !== 'intro') drawWalkup(ctx, m);
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
  const r = Math.max(2.4, 0.16 * q.s * (w.pitch ? 1.8 : boost));
  let col = '#ffffff';
  if (w.pitch && m.pt) col = PITCHES[m.pt.type].col;
  // trail
  if (m.ball && m.ball.trail && !w.pitch) { ctx.strokeStyle = 'rgba(200,240,255,0.35)'; ctx.lineWidth = r; ctx.beginPath(); let first = true; for (const p of m.ball.trail) { const tq = cam.proj(p[0], p[1], p[2]); if (!tq) continue; if (first) { ctx.moveTo(tq.x, tq.y); first = false; } else ctx.lineTo(tq.x, tq.y); } ctx.lineTo(q.x, q.y); ctx.stroke(); }
  // pitch motion streak + plasma lightning
  if (w.pitch && m.pt && m.pt.trail && m.pt.stage === 'flight') {
    const tr = m.pt.trail; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 1; i < tr.length; i++) { const a = cam.proj(...tr[i - 1]), b = cam.proj(...tr[i]); if (!a || !b) continue; ctx.strokeStyle = hexA(col, 0.12 + 0.5 * i / tr.length); ctx.lineWidth = r * 1.6 * i / tr.length; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    if (PITCHES[m.pt.type].wobble) { ctx.strokeStyle = 'rgba(220,160,255,0.85)'; ctx.lineWidth = 1.3; for (let k = 0; k < 3; k++) { ctx.beginPath(); let px = q.x, py = q.y; ctx.moveTo(px, py); const an = m.time * 30 + k * 2.1; for (let j = 1; j <= 4; j++) { px = q.x + Math.cos(an) * r * 1.6 * j + rnd(-r, r); py = q.y + Math.sin(an) * r * 1.6 * j + rnd(-r, r); ctx.lineTo(px, py); } ctx.stroke(); } }
    ctx.restore();
  }
  glow(ctx, q.x, q.y, r * 4, col, 0.8);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill();
  if (w.pitch && m.pt && PITCHES[m.pt.type].wobble) glow(ctx, q.x, q.y, r * 7, '#b14bff', 0.6 + 0.4 * Math.sin(m.time * 40));
}
function drawBatter(ctx, cam, m, e, q) {
  const pt = m.pt, hand = pt.hand, X = e.x; const sw = pt.swing;
  let p = null, kind = sw ? sw.kind : null;
  if (!sw && pt.buntHold) kind = 'bunt';
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
  ctx.save(); ctx.globalAlpha = humanBat || m.pitchCam() ? 0.9 : 0.45;
  for (let i = 0; i < 4; i++) cam.line(ctx, c[i], c[(i + 1) % 4], 'rgba(160,240,255,0.55)', 1.5);
  ctx.restore();
  // sweet-spot rings: contact (solid), power (dashed gold), bunt (filled green while squared)
  if (humanBat) { const q = cam.proj(pt.shift, 0, BAT_Z); if (q) {
    const tm = m.sides[m.bat].team, zc = m.swingZone('contact'), zp = m.swingZone('power'), zb = m.swingZone('bunt'), sw = pt.swing;
    const ring = (z, col, dash, fill) => { ctx.save(); ctx.beginPath(); ctx.ellipse(q.x, q.y, z.reach * q.s, z.vtol * q.s, 0, 0, TAU); if (fill) { ctx.fillStyle = fill; ctx.fill(); } ctx.setLineDash(dash || []); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); };
    if (pt.buntHold || (sw && sw.kind === 'bunt')) ring(zb, 'rgba(61,255,160,0.9)', null, 'rgba(61,255,160,0.10)');
    else { ring(zc, hexA(tm.g, sw && sw.kind === 'contact' ? 0.95 : 0.6)); ring(zp, sw && sw.kind === 'power' ? '#ffd84a' : 'rgba(255,216,74,0.6)', [5, 4]); }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.5, 0, TAU); ctx.fill();
  } }
  // pitcher aim reticle (only when it would not spoil a human batter)
  if (m.pad(m.fld) != null && (!humanBat || m.cfg.showAim) && pt.stage === 'aim') {
    const q = cam.proj(pt.aimX, 0, pt.aimZ); if (q) { const r = 0.32 * q.s, col = PITCHES[pt.type].col; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.moveTo(q.x - r * 1.7, q.y); ctx.lineTo(q.x - r * 0.6, q.y); ctx.moveTo(q.x + r * 0.6, q.y); ctx.lineTo(q.x + r * 1.7, q.y); ctx.moveTo(q.x, q.y - r * 1.7); ctx.lineTo(q.x, q.y - r * 0.6); ctx.moveTo(q.x, q.y + r * 0.6); ctx.lineTo(q.x, q.y + r * 1.7); ctx.stroke(); glow(ctx, q.x, q.y, r * 2, col, 0.4); }
  }
}
function drawBigBoard(ctx, w0, h, m, t) {
  // right-hand jumbotron: live portrait of the batter (or the home emblem)
  const jx = 404, w = 400; ctx.save(); ctx.beginPath(); ctx.rect(jx, 0, 116, 160); ctx.clip();
  const bs = m.sides[m.bat], bt = m.batter && m.batter();
  const jg = ctx.createLinearGradient(0, 0, 0, 160); jg.addColorStop(0, shade(bs.team.p, -0.3)); jg.addColorStop(1, '#05070f'); ctx.fillStyle = jg; ctx.fillRect(jx, 0, 116, 160);
  if (bt && (m.state === 'pitch' || m.state === 'wait')) { drawRobot(ctx, jx + 58, 230, 26, bt, bs.team, { t, hp: 1 }); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(jx, 132, 116, 28); txt(ctx, bt.name, jx + 58, 146, 15, '#ffffff', 'center', FONT_H, 900); }
  else drawEmblem(ctx, jx + 58, 80, 40, m.sides[1].team);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < 160; y += 4) ctx.fillRect(jx, y, 116, 1.5);
  ctx.restore(); ctx.fillStyle = m.sides[1].team.g; ctx.fillRect(jx - 4, 0, 2, 160);
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
  for (let s2 = 0; s2 < 2; s2++) { const od = m.sides[s2].od || 0, full = od >= 100, col = m.sides[s2].team.g, yy = y + 22 + s2 * 32; ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 42, yy + 11, 90, 3); ctx.fillStyle = full ? (Math.sin(m.time * 10) > 0 ? '#ffffff' : col) : col; ctx.fillRect(x + 42, yy + 11, 90 * od / 100, 3); if (full) glow(ctx, x + 132, yy + 12, 8, col, 0.8); }
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
    const TL = Game.touchLand; robotCard(ctx, TL ? W - 354 : 14, TL ? 12 : H - 98, bt, bs, 'AT BAT', `${bs.batIdx + 1}. ${bt.pos}`, [['POW', m.st(bt, 'pow')], ['CON', m.st(bt, 'con')], ['SPD', m.st(bt, 'spd')]]);
    const pr = m.pitcher(), ps = m.sides[m.fld];
    robotCard(ctx, W - 354, TL ? 102 : H - 98, pr, ps, 'PITCHING', `VEL ${m.st(pr, 'vel')} · BRK ${m.st(pr, 'brk')}`, null, pr.battery / 100);
    if (humanFld) drawPitchRail(ctx, m, pr, ps, TL);
    if (humanBat && m.state === 'pitch') drawSwingPanel(ctx, m, TL);
    let hint = '';
    if (humanBat && humanFld) hint = 'PITCHER: aim, B or tap to pick a pitch, A throw, steer ←/→';
    else if (humanBat) hint = '';
    else if (humanFld) hint = m.pt.stage === 'aim' ? 'D-PAD AIM   B PITCH TYPE   A THROW' : 'HOLD ←/→ TO STEER THE PITCH';
    if (hint) txt(ctx, hint, W / 2, Game.touchLand ? H - 58 : H - 14, 15, '#c8d2f0', 'center', FONT_B, 700);
  } else if (m.state === 'play' || m.state === 'wait') {
    drawMinimap(ctx, m);
    let hint = '';
    if (humanFld && m.ball) hint = m.ball.held && m.ball.held.f ? 'HOLD DIRECTION + A TO THROW:  → 1ST   ↑ 2ND   ← 3RD   ↓ HOME' : 'RUN TO THE BALL — YELLOW RING MARKS THE LANDING SPOT';
    if (humanBat && m.state === 'play') hint = (hint ? hint + '     ' : '') + 'A ADVANCE RUNNERS   B RETREAT';
    if (hint) txt(ctx, hint, W / 2, Game.touchLand ? H - 58 : H - 14, 15, '#c8d2f0', 'center', FONT_B, 700);
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
  const oy = Game.touchLand ? 12 - (H - 172) : 0;
  const cx = W - 92, cy = H - 40 + oy, k = 0.32;
  panel(ctx, W - 188, H - 172 + oy, 176, 150, '#46e0ff', 0.7);
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

function drawTicker(ctx, m) {
  const tk = m.ticker; if (!tk || m.state === 'clash' || m.state === 'intro') return;
  const age = m.time - tk.t; if (age > 5) return;
  const a = Math.min(1, age * 4, (5 - age) * 2); ctx.save(); ctx.globalAlpha = a;
  ctx.font = `700 15px ${FONT_H}`; const w = Math.min(560, ctx.measureText(tk.text).width + 40), x = 14, y = 96;
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(8,12,28,0.88)'); g.addColorStop(1, 'rgba(8,12,28,0.55)');
  ctx.fillStyle = g; rrect(ctx, x, y, w, 26, 6); ctx.fill(); ctx.fillStyle = m.sides[m.bat].team.g; ctx.fillRect(x, y, 3, 26);
  txt(ctx, tk.text, x + 14, y + 13.5, 14, '#e8ecff', 'left', FONT_H, 700); ctx.restore();
}

let replayCameraCached = null;
function drawReplay(ctx, m) {
  const vm = replayView(m), rp = m.replay; replayCameraCached = replayCamera(vm, rp);
  drawMatch(ctx, vm);
  // broadcast treatment: letterbox, scanlines, REPLAY bug
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 46); ctx.fillRect(0, H - 46, W, 46);
  const tm = m.sides[m.bat].team;
  if (Math.sin(m.time * 6) > -0.2) { ctx.fillStyle = '#ff3d3d'; ctx.beginPath(); ctx.arc(30, 23, 7, 0, TAU); ctx.fill(); glow(ctx, 30, 23, 16, '#ff3d3d', 0.6); }
  txt(ctx, 'REPLAY', 46, 24, 20, '#ffffff', 'left', FONT_H, 900);
  txt(ctx, rp.label, W / 2, 24, 20, tm.g, 'center', FONT_H, 900);
  txt(ctx, '½ SPEED', W - 20, 24, 14, '#9aa6c8', 'right', FONT_H, 700);
  const humans = m.ctrl.some(c => c != null); if (humans) txt(ctx, 'A  SKIP', W - 20, H - 23, 14, '#9aa6c8', 'right', FONT_H, 700);
  ctx.fillStyle = tm.g; ctx.fillRect(0, H - 46, W * (rp.i / Math.max(1, rp.frames.length - 1)), 3);
}

function drawWalkup(ctx, m) {
  const wu = m.walkup, age = m.time - wu.t; if (age > 2.6 || age < 0) return;
  const r = wu.r, sd = m.sideOf(r), tm = sd.team, k = ease(clamp(age / 0.35, 0, 1)), out = ease(clamp((age - 2.2) / 0.4, 0, 1));
  const x = -440 + 454 * k - 470 * out, y = 136, w = 420, h = 104;
  ctx.save(); ctx.translate(x, y);
  // angled team-colour plate
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w - 26, h); ctx.lineTo(0, h); ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, hexA(tm.p, 0.95)); g.addColorStop(0.55, 'rgba(8,11,24,0.92)'); g.addColorStop(1, 'rgba(8,11,24,0.75)'); ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip(); drawEmblem(ctx, 70, 52, 70, tm, 0.18); drawRobot(ctx, 70, h + 40, 17, r, tm, { t: m.time, hp: r.hp / maxHp(r, sd) }); ctx.restore();
  ctx.fillStyle = tm.g; ctx.fillRect(0, h - 3, w - 25, 3);
  txt(ctx, 'NOW BATTING', 150, 20, 12, tm.g, 'left', FONT_H, 900);
  txt(ctx, `#${r.num}`, 150, 50, 30, 'rgba(255,255,255,0.55)', 'left', FONT_H, 900);
  ctx.font = `900 30px ${FONT_H}`; const nw = ctx.measureText(`#${r.num} `).width;
  txt(ctx, r.name, 150 + nw, 50, 30, '#ffffff', 'left', FONT_H, 900);
  const st = m.bstat && m.bstat.get(r);
  const line = !st || (!st.ab && !st.h) ? 'FIRST AT-BAT TODAY' : `TODAY  ${st.h}-FOR-${st.ab}${st.hr ? ` · ${st.hr} HR` : ''}${st.rbi ? ` · ${st.rbi} RBI` : ''}${st.k ? ` · ${st.k} K` : ''}`;
  txt(ctx, `${CLASSES[r.cls].name} · POW ${m.st(r, 'pow')} · CON ${m.st(r, 'con')} · SPD ${m.st(r, 'spd')}`, 150, 74, 13, '#c8d2f0', 'left', FONT_B, 700);
  txt(ctx, line, 150, 92, 13, '#ffd84a', 'left', FONT_H, 700);
  ctx.restore();
}

function drawPitchRail(ctx, m, pr, ps, TL) {
  const pt = m.pt, ih = TL ? 30 : 46, gap = TL ? 3 : 5, top = TL ? 206 : 100, w = TL ? 150 : 176, x0 = W - w - 10;
  if (m.bases.some(Boolean)) { const y = top + PITCHES.length * (ih + gap), sel = !!pt.pickSel, x = x0 - (sel ? 10 : 0), warn = !!pt.stealPlan;
    tapZone(x, y, w + 10, ih, () => { if (pt.stage === 'aim') { pt.pickSel = true; Sfx.play('move'); } });
    ctx.save(); rrect(ctx, x, y, w + (sel ? 10 : 0), ih, 7); ctx.fillStyle = sel ? 'rgba(255,106,106,0.3)' : 'rgba(10,14,30,0.78)'; ctx.fill(); ctx.strokeStyle = sel || warn ? '#ff6a6a' : 'rgba(140,160,220,0.25)'; ctx.lineWidth = sel ? 2 : 1; ctx.stroke(); ctx.restore();
    txt(ctx, '⤺', x + 22, y + ih / 2, 18, '#ff6a6a', 'center', FONT_B, 700); txt(ctx, 'PICKOFF', x + 40, y + ih / 2, TL ? 13 : 15, sel ? '#ffffff' : '#c8d2f0', 'left', FONT_H, 900);
    if (warn && Math.sin(m.time * 8) > -0.3) txt(ctx, 'BIG LEAD!', x + w - 8 + (sel ? 10 : 0), y + ih / 2, 10, '#ff6a6a', 'right', FONT_H, 900); }
  txt(ctx, 'PITCHES · B / TAP', W - 14, top - 12, 11, '#9aa6c8', 'right', FONT_H, 900);
  PITCHES.forEach((p, i) => {
    const y = top + i * (ih + gap), sel = i === pt.type && !pt.pickSel, can = p.cost <= pr.battery, x = x0 - (sel ? 10 : 0);
    tapZone(x, y, w + 10, ih, () => { if (pt.stage !== 'aim') return; if (can) { pt.type = i; pt.pickSel = false; Sfx.play('move'); } else Sfx.play('buzz'); });
    ctx.save(); rrect(ctx, x, y, w + (sel ? 10 : 0), ih, 7);
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, sel ? hexA(p.col, 0.32) : 'rgba(10,14,30,0.78)'); g.addColorStop(1, 'rgba(8,11,24,0.85)');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = sel ? p.col : 'rgba(140,160,220,0.25)'; ctx.lineWidth = sel ? 2 : 1; ctx.stroke(); ctx.restore();
    if (sel) glow(ctx, x + 4, y + ih / 2, 18, p.col, 0.6);
    ctx.globalAlpha = can ? 1 : 0.4;
    // movement icon: where the ball bends on its way in
    const ix = x + 22, iy = y + ih / 2, k = ih * 0.36; ctx.strokeStyle = p.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ix, iy - k);
    if (p.wobble) { for (let j = 1; j <= 6; j++) ctx.lineTo(ix + (j % 2 ? 4 : -4), iy - k + j * k / 3); } else ctx.quadraticCurveTo(ix, iy, ix + p.bx * 5, iy + k - p.bz * 2);
    ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.wobble ? ix : ix + p.bx * 5, p.wobble ? iy + k : iy + k - p.bz * 2, 2.5, 0, TAU); ctx.fill();
    txt(ctx, p.name, x + 40, TL ? y + ih / 2 : y + 15, TL ? 13 : 15, sel ? '#ffffff' : '#c8d2f0', 'left', FONT_H, 900);
    if (!TL) { txt(ctx, 'SPD', x + 40, y + 33, 9, '#8f9bc0', 'left', FONT_H, 700); bar(ctx, x + 64, y + 29, 50, 6, (p.spd - 0.6) / 0.55, p.col); }
    txt(ctx, p.cost > 3 ? `⚡${p.cost}` : `${p.cost}`, x + w - 8 + (sel ? 10 : 0), TL ? y + ih / 2 : y + 33, 11, p.cost > 3 ? '#d06bff' : '#8f9bc0', 'right', FONT_H, 700);
    ctx.globalAlpha = 1;
  });
}
function drawSwingPanel(ctx, m, TL) {
  const pt = m.pt, sw = pt.swing, touch = document.body.classList.contains('touch'), cw = 80, gap = 4, y = TL ? 272 : H - 58, x0 = TL ? 16 : W / 2 - (cw * 3 + gap * 2) / 2;
  const opts = [['contact', 'A', 'CONTACT', 'BIG ZONE'], ['power', 'B', 'POWER', 'FAR HIT'], ['bunt', 'HOLD ↓', 'BUNT', '']];
  opts.forEach(([k, key, name, sub], i) => {
    const x = x0 + i * (cw + gap), on = (sw && sw.kind === k) || (k === 'bunt' && pt.buntHold), col = k === 'power' ? '#ffd84a' : k === 'bunt' ? '#3dffa0' : m.sides[m.bat].team.g;
    ctx.save(); rrect(ctx, x, y, cw, 40, 7); ctx.fillStyle = on ? hexA(col, 0.3) : 'rgba(8,11,24,0.78)'; ctx.fill(); ctx.strokeStyle = on ? col : hexA(col, 0.45); ctx.lineWidth = on ? 2 : 1; ctx.stroke(); ctx.restore();
    txt(ctx, name, x + cw / 2, y + 14, 13, '#ffffff', 'center', FONT_H, 900);
    ctx.font = `900 9px ${FONT_H}`; const kw = ctx.measureText(key).width + 8; ctx.fillStyle = hexA(col, 0.9); rrect(ctx, x + 5, y + 24, kw, 12, 3); ctx.fill(); txt(ctx, key, x + 5 + kw / 2, y + 30.5, 9, '#05070f', 'center', FONT_H, 900); txt(ctx, sub, x + 9 + kw + (cw - 14 - kw) / 2, y + 30.5, 8, '#9aa6c8', 'center', FONT_H, 700);
  });
  const sc = m.stealCandidate();
  if ((sc && !pt.steal) || pt.steal) { const lbl = pt.steal ? 'RUNNING!' : `↑ STEAL ${['', '2ND', '3RD'][sc]}`, ready = pt.stage === 'windup' || (pt.stage === 'flight' && (pt.t - pt.t0) / pt.T < 0.35), sx = x0 + cw * 3 + gap * 2 - 96, sy = y - 58;
    tapZone(sx, sy, 96, 20, () => m.startSteal(true));
    ctx.save(); rrect(ctx, sx, sy, 96, 20, 10); ctx.fillStyle = pt.steal ? 'rgba(255,216,74,0.35)' : ready ? 'rgba(255,216,74,0.22)' : 'rgba(8,11,24,0.7)'; ctx.fill(); ctx.strokeStyle = ready || pt.steal ? '#ffd84a' : 'rgba(255,216,74,0.4)'; ctx.stroke(); ctx.restore();
    txt(ctx, lbl, sx + 48, sy + 10.5, 10, ready || pt.steal ? '#ffffff' : '#c8b878', 'center', FONT_H, 900); }
  if (m.cfg.meter === false) return;
  // timing meter: swing when the marker crosses the window
  const bw = cw * 3 + gap * 2, by = y - 18, bx = x0;
  ctx.fillStyle = 'rgba(8,11,24,0.78)'; rrect(ctx, bx, by - 5, bw, 12, 6); ctx.fill();
  const flying = pt.stage === 'flight' || pt.stage === 'post';
  const T = pt.T || 55 / m.pitchSpeed(pt.type), u0 = (T - IDEAL) / T, zc = m.swingZone('contact'), zp = m.swingZone('power');
  const X = u => bx + clamp(u, 0, 1.08) / 1.08 * bw;
  ctx.globalAlpha = flying ? 1 : 0.45;
  ctx.fillStyle = hexA(m.sides[m.bat].team.g, 0.55); ctx.fillRect(X(u0 - zc.win / T), by - 3, X(u0 + zc.win / T) - X(u0 - zc.win / T), 8);
  ctx.fillStyle = 'rgba(255,216,74,0.85)'; ctx.fillRect(X(u0 - zp.win / T), by - 3, X(u0 + zp.win / T) - X(u0 - zp.win / T), 8);
  ctx.globalAlpha = 1;
  txt(ctx, 'TIMING', bx + bw / 2, by - 14, 9, '#9aa6c8', 'center', FONT_H, 900); if (!TL) txt(ctx, '←/→ SHIFT SO THE RINGS COVER THE PITCH', W / 2, H - 9, 10, '#8f9bc0', 'center', FONT_H, 700);
  if (pt.stage === 'flight') { const u = (pt.t - pt.t0) / pt.T, mx = X(u); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(mx, by - 8); ctx.lineTo(mx + 5, by - 14); ctx.lineTo(mx - 5, by - 14); ctx.fill(); ctx.fillRect(mx - 1, by - 6, 2, 14); }
  if (pt.swingU != null) { const sx = X(pt.swingU); ctx.fillStyle = pt.hit ? '#3dffa0' : '#ff6a6a'; ctx.fillRect(sx - 2, by - 7, 4, 16); }
}

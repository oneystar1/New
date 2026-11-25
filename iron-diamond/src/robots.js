// IRON DIAMOND — vector robot renderer. Units are feet; origin at the feet, -y is up.
'use strict';
const OUT = '#070a12';
function drawRobot(ctx, x, y, s, r, team, o = {}) {
  const t = o.t || 0, back = !!o.back, cls = r.cls;
  const P = r.scrap ? '#7a7f88' : team.p, S = r.scrap ? '#3b3f46' : team.s, G = r.scrap ? '#ffb347' : team.g;
  const dmg = o.hp == null ? 1 : o.hp;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const run = o.run || 0, ph = t * 12, crouch = o.crouch || 0;
  const metal = (c) => { const g = ctx.createLinearGradient(-1.6, 0, 1.6, 0); g.addColorStop(0, shade(c, 0.35)); g.addColorStop(0.45, c); g.addColorStop(1, shade(c, -0.45)); return g; };
  const cap = (x1, y1, x2, y2, w, col) => { ctx.strokeStyle = OUT; ctx.lineWidth = w + 0.16; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const poly = (pts, fill) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.12; ctx.stroke(); };
  const ell = (cx, cy, rx, ry, fill, stroke = true) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = OUT; ctx.lineWidth = 0.12; ctx.stroke(); } };
  const lamp = (cx, cy, rr, col = G) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, rr * 0.55, 0, TAU); ctx.fill(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite(col), cx - rr * 3, cy - rr * 3, rr * 6, rr * 6); ctx.restore(); };
  const rr = (x0, y0, w, h, rad, fill) => { rrect(ctx, x0, y0, w, h, rad); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.12; ctx.stroke(); };
  // leg cycle
  const legL = Math.sin(ph) * run, legR = -legL;
  const bob = run ? Math.abs(Math.cos(ph)) * 0.18 * run : 0;
  ctx.translate(0, crouch * 1.4 - bob * 0.5);
  // default arm targets (relative to shoulder) — may be overridden
  const arms = (sx, sy, side) => {
    const sw = (side < 0 ? legL : legR) * 0.7;
    let hx = sx + side * 0.25 + sw * 0.4, hy = sy + 1.9 - Math.abs(sw) * 0.3;
    if (o.hands) { hx = o.hands.x + side * 0.12; hy = o.hands.y; }
    if (o.throwArm != null && side === 1) { const p = o.throwArm; if (p < 0.6) { const k = p / 0.6; hx = sx + 0.6 - k * 0.2; hy = sy + 1.6 - k * 3.4; } else { const k = (p - 0.6) / 0.4; hx = sx + 0.4 - k * 1.2; hy = sy - 1.8 + k * 3.6; } }
    if (o.ball && side === 1 && !o.hands && o.throwArm == null) { hx = sx + 0.1; hy = sy + 1.2; }
    if (o.block) { hx = side * 0.35; hy = sy - 0.3; }
    if (o.reach != null && side === 1) { hx = sx + 0.5 + o.reach * 2.6; hy = sy + 0.4 - o.reach * 0.3; }
    if (o.windup != null && side === 1) { hx = sx - 0.9 * o.windup; hy = sy - 0.8 * o.windup; }
    return [hx, hy];
  };
  const drawArm = (sx, sy, side, w, col, handR, handCol) => {
    const [hx, hy] = arms(sx, sy, side);
    const ex = (sx + hx) / 2 + side * 0.35, ey = (sy + hy) / 2 + 0.15;
    cap(sx, sy, ex, ey, w, col); cap(ex, ey, hx, hy, w * 0.85, typeof col === 'string' ? shade(col, -0.15) : '#2a303d');
    ell(hx, hy, handR, handR, handCol || '#2a303d');
    if (o.ball && side === 1 && o.throwArm == null) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy - 0.1, 0.22, 0, TAU); ctx.fill(); }
    if (o.reach > 0.6 && side === 1) lamp(hx + 0.2, hy, 0.25, G);
  };
  const lean = o.lean || 0;
  const upper = () => { ctx.transform(1, 0, lean * 0.13, 1, 0, 0); };
  const backNum = (cy, size) => { ctx.save(); ctx.font = `900 ${size}px ${FONT_H}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = S; ctx.fillText(String(r.num), 0, cy); ctx.restore(); };
  // order arms so the far arm draws first. Side +1 is the robot's "throwing" arm (viewer right in back view)
  const armSides = back ? [-1, 1] : [1, -1];

  if (cls === 'STRIKER') {
    const hipY = -3.3;
    // legs
    for (const side of [-1, 1]) {
      const sw = side < 0 ? legL : legR, lift = Math.max(0, sw) * 0.7;
      const fx = side * 0.5 + sw * 0.15, fy = -lift;
      const kx = side * 0.62 + sw * 0.1, ky = -1.7 - lift * 0.6 + crouch * 0.5;
      cap(side * 0.38, hipY, kx, ky, 0.52, metal(shade(P, -0.2))); cap(kx, ky, fx, fy - 0.25, 0.42, '#2a303d');
      rr(fx - 0.32, fy - 0.35, 0.64, 0.35, 0.12, S);
      ell(kx, ky, 0.2, 0.2, S);
    }
    ctx.save(); upper();
    for (const side of armSides) if (side === (back ? -1 : 1)) drawArm(side * 1.05, -5.45, side, 0.36, metal(P), 0.24);
    poly([[-0.62, hipY], [0.62, hipY], [1.02, -5.65], [-1.02, -5.65]], metal(P));
    rr(-0.55, -3.75, 1.1, 0.55, 0.15, '#1f2430');
    if (!back) { poly([[-0.8, -4.65], [0.8, -4.65], [0.92, -5.6], [-0.92, -5.6]], metal(S)); lamp(0, -4.95, 0.2); }
    else { rr(-0.62, -5.45, 1.24, 1.5, 0.2, metal(shade(P, -0.3))); backNum(-4.65, 0.75); lamp(-0.35, -3.85, 0.12, G); lamp(0.35, -3.85, 0.12, G); }
    ell(-1.05, -5.5, 0.43, 0.38, metal(S)); ell(1.05, -5.5, 0.43, 0.38, metal(S));
    rr(-0.18, -6.0, 0.36, 0.3, 0.06, '#2a303d');
    rr(-0.46, -6.9, 0.92, 0.95, 0.32, metal(P));
    if (!back) { rr(-0.4, -6.55, 0.8, 0.24, 0.1, '#0a0e18'); ctx.fillStyle = G; ctx.fillRect(-0.36, -6.5, 0.72, 0.13); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite(G), -1.1, -7.2, 2.2, 1.6); ctx.restore(); }
    else { cap(0, -6.85, 0, -7.25, 0.12, S); }
    for (const side of armSides) if (side === (back ? 1 : -1)) drawArm(side * 1.05, -5.45, side, 0.36, metal(P), 0.24);
    ctx.restore();
  } else if (cls === 'TITAN') {
    // treads
    const tx = (t * (run ? 9 : 0)) % 0.6;
    rr(-1.55, -1.25, 3.1, 1.25, 0.55, '#191d25');
    ctx.save(); rrect(ctx, -1.5, -1.2, 3.0, 1.15, 0.5); ctx.clip(); ctx.fillStyle = '#2c3240';
    for (let i = -3; i < 6; i++) ctx.fillRect(-1.6 + i * 0.6 + tx, -1.2, 0.24, 1.2);
    ctx.restore();
    for (const wx of [-1.0, 0, 1.0]) { ell(wx, -0.6, 0.32, 0.32, metal('#4a5263')); ell(wx, -0.6, 0.12, 0.12, S, false); }
    rr(-0.95, -2.05, 1.9, 0.9, 0.2, metal('#3c4352'));
    ctx.save(); upper();
    for (const side of armSides) if (side === (back ? -1 : 1)) drawArm(side * 1.95, -5.3, side, 0.62, metal(shade(P, -0.15)), 0.5, metal('#3a4150'));
    poly([[-1.15, -1.95], [1.15, -1.95], [1.75, -5.9], [-1.75, -5.9]], metal(P));
    if (!back) { poly([[-0.9, -3.0], [0.9, -3.0], [1.1, -4.6], [-1.1, -4.6]], '#1d222c'); for (let i = 0; i < 4; i++) { ctx.fillStyle = hexA(G, 0.85); ctx.fillRect(-0.75, -3.25 - i * 0.35, 1.5, 0.12); } lamp(0, -5.15, 0.32); }
    else { rr(-1.2, -5.6, 2.4, 2.2, 0.3, metal(shade(P, -0.3))); backNum(-4.5, 1.0); lamp(-0.7, -3.2, 0.2, G); lamp(0.7, -3.2, 0.2, G); }
    for (const side of [-1, 1]) { rr(side * 1.95 - 0.6, -6.3, 1.2, 1.0, 0.25, metal(S)); lamp(side * 1.95, -6.05, 0.09, G); }
    ell(0, -6.05, 0.55, 0.42, metal('#3c4352'));
    if (!back) { lamp(-0.2, -6.1, 0.1); lamp(0.2, -6.1, 0.1); }
    for (const side of armSides) if (side === (back ? 1 : -1)) drawArm(side * 1.95, -5.3, side, 0.62, metal(shade(P, -0.15)), 0.5, metal('#3a4150'));
    ctx.restore();
  } else if (cls === 'VECTOR') {
    const hb = Math.sin(t * 3.3) * 0.18; ctx.translate(0, -hb);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite(G), -0.9, -1.6, 1.8, 2.2); ctx.restore();
    poly([[-0.35, -1.6], [0.35, -1.6], [0.2, -1.05], [-0.2, -1.05]], '#2a303d');
    lamp(0, -1.0, 0.22, G);
    ctx.save(); upper();
    for (const side of armSides) if (side === (back ? -1 : 1)) drawArm(side * 1.35, -3.7, side, 0.26, metal(S), 0.22, metal(P));
    ell(0, -3.35, 1.05, 1.5, metal(P));
    ctx.strokeStyle = OUT; ctx.lineWidth = 0.36; ctx.beginPath(); ctx.ellipse(0, -3.1, 1.22, 0.32, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = S; ctx.lineWidth = 0.22; ctx.beginPath(); ctx.ellipse(0, -3.1, 1.22, 0.32, 0, 0, TAU); ctx.stroke();
    if (!back) { ell(0, -3.95, 0.42, 0.42, '#0b0f19'); lamp(0, -3.95, 0.24); }
    else { backNum(-3.75, 0.7); lamp(-0.45, -2.4, 0.1, G); lamp(0.45, -2.4, 0.1, G); }
    cap(0, -4.8, 0, -5.45, 0.1, '#8b94a8'); lamp(0, -5.5, 0.12, G);
    for (const side of [-1, 1]) poly([[side * 0.8, -4.2], [side * 1.25, -4.85], [side * 0.95, -3.9]], metal(S));
    for (const side of armSides) if (side === (back ? 1 : -1)) drawArm(side * 1.35, -3.7, side, 0.26, metal(S), 0.22, metal(P));
    ctx.restore();
  } else { // RAPTOR
    const hipY = -3.25;
    const tailSide = back ? 1 : -1;
    if (!back) { ctx.strokeStyle = OUT; ctx.lineWidth = 0.34; ctx.beginPath(); ctx.moveTo(0, -3.2); ctx.quadraticCurveTo(1.6 * tailSide, -2.4 + Math.sin(t * 4) * 0.2, 1.8 * tailSide, -3.6); ctx.stroke(); ctx.strokeStyle = S; ctx.lineWidth = 0.2; ctx.stroke(); }
    for (const side of [-1, 1]) {
      const sw = side < 0 ? legL : legR, lift = Math.max(0, sw) * 0.75;
      const hx = side * 0.45, kx = side * 0.85 + sw * 0.1, ky = -2.15 - lift * 0.4 + crouch * 0.4, ax = side * 0.5 + sw * 0.2, ay = -0.75 - lift, tx2 = side * 0.72 + sw * 0.25, ty = -lift * 0.5;
      cap(hx, hipY, kx, ky, 0.55, metal(shade(P, -0.15))); cap(kx, ky, ax, ay, 0.34, '#2a303d'); cap(ax, ay, tx2, ty - 0.08, 0.26, S);
      poly([[tx2 - 0.35, ty], [tx2 + 0.4, ty], [tx2 + 0.1, ty - 0.25]], '#2a303d');
    }
    ctx.save(); upper();
    for (const side of armSides) if (side === (back ? -1 : 1)) drawArm(side * 0.95, -5.0, side, 0.3, metal(S), 0.2, G);
    poly([[-0.7, hipY], [0.7, hipY], [1.0, -5.25], [0, -5.6], [-1.0, -5.25]], metal(P));
    if (!back) { poly([[-0.45, -3.9], [0.45, -3.9], [0.6, -4.9], [0, -5.15], [-0.6, -4.9]], metal(S)); lamp(0, -4.45, 0.16); }
    else { backNum(-4.4, 0.7); }
    for (const side of [-1, 1]) poly([[side * 0.55, -5.2], [side * 1.55, -6.15], [side * 1.05, -5.0]], metal(S));
    rr(-0.5, -6.35, 1.0, 0.72, 0.18, metal(P));
    poly([[-0.25, -6.35], [0.25, -6.35], [0, -6.95]], metal(S));
    if (!back) { ctx.fillStyle = '#0a0e18'; ctx.fillRect(-0.42, -6.05, 0.84, 0.2); ctx.fillStyle = G; ctx.fillRect(-0.36, -6.0, 0.72, 0.1); lamp(0.15 * Math.sin(t * 2), -5.95, 0.14); }
    if (back) { ctx.strokeStyle = OUT; ctx.lineWidth = 0.34; ctx.beginPath(); ctx.moveTo(0, -3.3); ctx.quadraticCurveTo(1.4 * tailSide, -2.2 + Math.sin(t * 4) * 0.2, 1.7 * tailSide, -3.3); ctx.stroke(); ctx.strokeStyle = S; ctx.lineWidth = 0.2; ctx.stroke(); }
    for (const side of armSides) if (side === (back ? 1 : -1)) drawArm(side * 0.95, -5.0, side, 0.3, metal(S), 0.2, G);
    ctx.restore();
  }
  // damage tint / hit flash
  if (dmg < 0.35 && Math.sin(t * 25) > 0.6) { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite('#ff7a2a'), -1, -6, 2, 2); }
  ctx.restore();
  if (o.flash > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, o.flash * 3); ctx.drawImage(glowSprite('#ffffff'), x - 3 * s, y - 7 * s, 6 * s, 7 * s); ctx.restore(); }
}
function robotHeight(r) { return CLASSES[r.cls].h; }

// a team emblem drawn inside a hexagon badge
function drawEmblem(ctx, x, y, size, team, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 20, size / 20); ctx.globalAlpha = a; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); for (let i = 0; i < 6; i++) { const an = i * TAU / 6 + Math.PI / 6; ctx.lineTo(Math.cos(an) * 20, Math.sin(an) * 20); } ctx.closePath();
  const g = ctx.createLinearGradient(0, -20, 0, 20); g.addColorStop(0, shade(team.p, 0.15)); g.addColorStop(1, shade(team.p, -0.45)); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = team.s; ctx.stroke();
  ctx.fillStyle = team.s; ctx.strokeStyle = team.s; ctx.lineWidth = 2.6;
  const e = team.emblem; ctx.beginPath();
  if (e === 'blade') { ctx.moveTo(-9, 10); ctx.lineTo(10, -11); ctx.lineTo(12, -9); ctx.lineTo(-7, 12); ctx.closePath(); ctx.fill(); ctx.fillRect(-11, 5, 8, 3); }
  else if (e === 'gear') { for (let i = 0; i < 8; i++) { const an = i * TAU / 8; ctx.save(); ctx.rotate(an); ctx.fillRect(-2.2, -13, 4.4, 5); ctx.restore(); } ctx.arc(0, 0, 9, 0, TAU); ctx.fill(); ctx.fillStyle = shade(team.p, -0.3); ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill(); }
  else if (e === 'bolt') { ctx.moveTo(3, -13); ctx.lineTo(-7, 2); ctx.lineTo(0, 2); ctx.lineTo(-3, 13); ctx.lineTo(8, -3); ctx.lineTo(1, -3); ctx.closePath(); ctx.fill(); }
  else if (e === 'moon') { ctx.arc(0, 0, 11, 0, TAU); ctx.fill(); ctx.fillStyle = shade(team.p, -0.2); ctx.beginPath(); ctx.arc(5, -3, 9, 0, TAU); ctx.fill(); }
  else if (e === 'tri') { ctx.moveTo(0, -12); ctx.lineTo(11, 9); ctx.lineTo(-11, 9); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill(); }
  else if (e === 'wave') { for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-12, -6 + k * 6); ctx.bezierCurveTo(-6, -11 + k * 6, -2, -1 + k * 6, 2, -6 + k * 6); ctx.bezierCurveTo(6, -11 + k * 6, 10, -1 + k * 6, 12, -6 + k * 6); ctx.stroke(); } }
  else if (e === 'chip') { ctx.strokeRect(-7, -7, 14, 14); for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 4.5, -7); ctx.lineTo(k * 4.5, -12); ctx.moveTo(k * 4.5, 7); ctx.lineTo(k * 4.5, 12); ctx.moveTo(-7, k * 4.5); ctx.lineTo(-12, k * 4.5); ctx.moveTo(7, k * 4.5); ctx.lineTo(12, k * 4.5); ctx.stroke(); } ctx.fillRect(-3, -3, 6, 6); }
  else if (e === 'flake') { for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.moveTo(-4, -9); ctx.lineTo(0, -6); ctx.lineTo(4, -9); ctx.moveTo(-4, 9); ctx.lineTo(0, 6); ctx.lineTo(4, 9); ctx.stroke(); ctx.restore(); } }
  else if (e === 'eye') { ctx.moveTo(-13, 0); ctx.quadraticCurveTo(0, -11, 13, 0); ctx.quadraticCurveTo(0, 11, -13, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-2, 13); ctx.stroke(); }
  else if (e === 'chevron') { for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(-11, -2 + k * 8); ctx.lineTo(0, -11 + k * 8); ctx.lineTo(11, -2 + k * 8); ctx.stroke(); } }
  else if (e === 'claw') { for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 6 - 3, -11); ctx.quadraticCurveTo(k * 6 + 4, -2, k * 6 - 1, 11); ctx.lineWidth = 3.2; ctx.stroke(); } }
  else if (e === 'sun') { ctx.arc(0, 0, 6, 0, TAU); ctx.fill(); for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * TAU / 8); ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, -13); ctx.stroke(); ctx.restore(); } }
  ctx.restore();
}

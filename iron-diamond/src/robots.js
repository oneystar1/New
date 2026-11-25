// IRON DIAMOND — vector robot renderer, high-tech edition. Units are feet; origin at the feet, -y is up.
// Every frame is layered armour plates over a carbon under-suit, with glowing actuator joints,
// emissive circuit traces, wraparound visors, thrusters and a cool rim light from the upper left.
'use strict';
const OUT = '#070a12';
function drawRobot(ctx, x, y, s, r, team, o = {}) {
  const t = o.t || 0, back = !!o.back, cls = r.cls;
  const P = r.scrap ? '#7a7f88' : team.p, S = r.scrap ? '#3b3f46' : team.s, G = r.scrap ? '#ffb347' : team.g;
  const dmg = o.hp == null ? 1 : o.hp, hi = s > 3.2, lo = s < 2.2; // level of detail by on-screen size
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const run = o.run || 0, ph = t * 12, crouch = o.crouch || 0, pulse = 0.7 + 0.3 * Math.sin(t * 3.1 + (r.num || 0));
  // ---- materials
  const metal = (c) => { const g = ctx.createLinearGradient(-1.6, -0.5, 1.6, 0.5); g.addColorStop(0, shade(c, 0.5)); g.addColorStop(0.18, shade(c, 0.18)); g.addColorStop(0.27, shade(c, 0.7)); g.addColorStop(0.34, shade(c, 0.1)); g.addColorStop(0.72, shade(c, -0.3)); g.addColorStop(1, shade(c, -0.62)); return g; };
  const suit = (() => { const g = ctx.createLinearGradient(-1, 0, 1, 0); g.addColorStop(0, '#3a4560'); g.addColorStop(0.5, '#1d2232'); g.addColorStop(1, '#0d1018'); return g; })();
  const glass = (y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#2a3a66'); g.addColorStop(0.45, '#070a14'); g.addColorStop(1, '#141c36'); return g; };
  const rim = ctx.createLinearGradient(-2.4, -7.5, 0.4, -1); rim.addColorStop(0, 'rgba(205,235,255,0.85)'); rim.addColorStop(1, 'rgba(205,235,255,0)');
  const PM = metal(P), SM = metal(S), DM = metal(shade(P, -0.35)), GM = metal('#4a5266');
  // ---- primitives
  const path = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); };
  const plate = (pts, fill, lw = 0.1) => { path(pts); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = lw; ctx.stroke(); if (hi) { ctx.strokeStyle = rim; ctx.lineWidth = 0.055; ctx.stroke(); } };
  const ell = (cx, cy, rx, ry, fill, stroke = true) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = OUT; ctx.lineWidth = 0.1; ctx.stroke(); if (hi) { ctx.strokeStyle = rim; ctx.lineWidth = 0.05; ctx.stroke(); } } };
  const rr = (x0, y0, w, h, rad, fill) => { rrect(ctx, x0, y0, w, h, rad); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.1; ctx.stroke(); if (hi) { ctx.strokeStyle = rim; ctx.lineWidth = 0.05; ctx.stroke(); } };
  const cap = (x1, y1, x2, y2, w, col) => { ctx.strokeStyle = OUT; ctx.lineWidth = w + 0.14; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
  const glowLine = (pts, w = 0.06, a = 1, closed = false) => {
    if (lo) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (closed) ctx.closePath();
    ctx.strokeStyle = hexA(G, 0.4 * a * pulse); ctx.lineWidth = w * 3.4; ctx.stroke(); ctx.strokeStyle = hexA(shade(G, 0.55), 0.95 * a); ctx.lineWidth = w; ctx.stroke(); ctx.restore();
  };
  const lamp = (cx, cy, rr2, col = G) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, rr2 * 0.55, 0, TAU); ctx.fill(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const k = rr2 * (2.6 + pulse * 0.9); ctx.drawImage(glowSprite(col), cx - k, cy - k, k * 2, k * 2); ctx.restore(); };
  const joint = (cx, cy, jr) => { ell(cx, cy, jr, jr, '#151a26'); if (!lo) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(G, 0.85 * pulse); ctx.lineWidth = jr * 0.32; ctx.beginPath(); ctx.arc(cx, cy, jr * 0.62, t * 2, t * 2 + TAU * 0.75); ctx.stroke(); ctx.restore(); } ctx.fillStyle = shade(G, 0.6); ctx.beginPath(); ctx.arc(cx, cy, jr * 0.22, 0, TAU); ctx.fill(); };
  // tapered armour segment between two points, laid over a thinner under-suit strut
  const limb = (x1, y1, x2, y2, w1, w2, fill, stripe) => {
    cap(x1, y1, x2, y2, Math.min(w1, w2) * 0.55, '#1a1f2c');
    let dx = x2 - x1, dy = y2 - y1; const l = hyp(dx, dy) || 1; dx /= l; dy /= l; const nx = -dy, ny = dx;
    const a = 0.12, ax1 = x1 + dx * l * a, ay1 = y1 + dy * l * a, ax2 = x2 - dx * l * a, ay2 = y2 - dy * l * a;
    plate([[ax1 + nx * w1 / 2, ay1 + ny * w1 / 2], [ax2 + nx * w2 / 2, ay2 + ny * w2 / 2], [ax2 - nx * w2 / 2, ay2 - ny * w2 / 2], [ax1 - nx * w1 / 2, ay1 - ny * w1 / 2]], fill);
    if (stripe && hi) glowLine([[lerp(ax1, ax2, 0.15) + nx * w1 * 0.18, lerp(ay1, ay2, 0.15) + ny * w1 * 0.18], [lerp(ax1, ax2, 0.85) + nx * w2 * 0.18, lerp(ay1, ay2, 0.85) + ny * w2 * 0.18]], 0.045, 0.8);
  };
  const traces = (segs, speed = 1) => { if (!hi) return; for (const sg of segs) glowLine(sg, 0.04, 0.7); const k = (((t * 0.8 * speed) % 1) + 1) % 1; for (const sg of segs) { const i = Math.min(sg.length - 2, Math.floor(k * (sg.length - 1))), f = k * (sg.length - 1) - i; const px = lerp(sg[i][0], sg[i + 1][0], f), py = lerp(sg[i][1], sg[i + 1][1], f); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite('#ffffff'), px - 0.2, py - 0.2, 0.4, 0.4); ctx.restore(); } };
  const hexCore = (cx, cy, rad) => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const an = i * TAU / 6 + Math.PI / 6; ctx.lineTo(cx + Math.cos(an) * rad, cy + Math.sin(an) * rad); } ctx.closePath(); ctx.fillStyle = '#080b14'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.08; ctx.stroke(); glowLine((() => { const p = []; for (let i = 0; i < 6; i++) { const an = i * TAU / 6 + Math.PI / 6; p.push([cx + Math.cos(an) * rad * 0.78, cy + Math.sin(an) * rad * 0.78]); } return p; })(), 0.05, 1, true); if (!lo) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(G, 0.9); ctx.lineWidth = 0.05; for (let i = 0; i < 3; i++) { const an = t * 3 + i * TAU / 3; ctx.beginPath(); ctx.arc(cx, cy, rad * 0.45, an, an + 0.9); ctx.stroke(); } ctx.restore(); } lamp(cx, cy, rad * 0.4); };
  const visor = (x0, y0, w, h) => { rrect(ctx, x0, y0, w, h, h * 0.45); ctx.fillStyle = glass(y0, y0 + h); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.07; ctx.stroke(); if (lo) { ctx.fillStyle = G; ctx.fillRect(x0 + w * 0.1, y0 + h * 0.4, w * 0.8, h * 0.25); return; }
    ctx.save(); rrect(ctx, x0, y0, w, h, h * 0.45); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + w * 0.45, y0); ctx.lineTo(x0 + w * 0.3, y0 + h); ctx.lineTo(x0 - 0.1, y0 + h); ctx.fill();
    const sx = x0 + w / 2 + Math.sin(t * 2.3 + (r.num || 0)) * w * 0.35; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hexA(G, 0.95); ctx.fillRect(sx - w * 0.12, y0 + h * 0.35, w * 0.24, h * 0.3); ctx.drawImage(glowSprite(G), sx - w * 0.4, y0 - h, w * 0.8, h * 3); ctx.restore(); };
  const thruster = (cx, cy, w) => { rr(cx - w / 2, cy, w, w * 0.9, w * 0.2, GM); if (lo) return; const fl = 0.7 + 0.3 * Math.sin(t * 40 + cx * 9); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, cy + w * 0.9, 0, cy + w * 0.9 + w * 2.2 * fl); g.addColorStop(0, hexA(shade(G, 0.6), 0.95)); g.addColorStop(1, hexA(G, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - w * 0.38, cy + w * 0.9); ctx.lineTo(cx + w * 0.38, cy + w * 0.9); ctx.lineTo(cx, cy + w * 0.9 + w * 2.2 * fl); ctx.closePath(); ctx.fill(); ctx.restore(); };
  const backNum = (cy, size) => { ctx.save(); ctx.font = `900 ${size}px ${FONT_H}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = shade(S, 0.1); ctx.fillText(String(r.num), 0, cy); if (!lo) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hexA(G, 0.35); ctx.fillText(String(r.num), 0, cy); } ctx.restore(); };
  // ---- motion
  const legL = Math.sin(ph) * run, legR = -legL, bob = run ? Math.abs(Math.cos(ph)) * 0.18 * run : 0;
  ctx.translate(0, crouch * 1.4 - bob * 0.5);
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
  const drawArm = (sx, sy, side, w, fill, handR, blade) => {
    const [hx, hy] = arms(sx, sy, side);
    const ex = (sx + hx) / 2 + side * 0.35, ey = (sy + hy) / 2 + 0.15;
    limb(sx, sy, ex, ey, w * 1.15, w * 0.85, fill, true);
    if (cls === 'TITAN' && hi) { ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(sx - side * 0.2, sy + 0.25); ctx.lineTo(ex - side * 0.15, ey - 0.15); ctx.stroke(); }
    limb(ex, ey, hx, hy, w * 0.9, w * 0.75, fill === PM ? DM : fill, false);
    joint(ex, ey, w * 0.42);
    if (blade) { let dx = hx - ex, dy = hy - ey; const l = hyp(dx, dy) || 1; dx /= l; dy /= l; const nx = -dy * side, ny = dx * side; const b = [[ex + nx * 0.15, ey + ny * 0.15], [hx + dx * 0.55 + nx * 0.05, hy + dy * 0.55 + ny * 0.05], [hx + nx * 0.28, hy + ny * 0.28]]; plate(b, SM, 0.07); glowLine([b[0], b[1]], 0.04, 1); }
    ell(hx, hy, handR, handR * 0.9, GM); glowLine([[hx - handR * 0.6, hy - handR * 0.2], [hx + handR * 0.6, hy - handR * 0.2]], 0.04, 0.9);
    if (o.ball && side === 1 && o.throwArm == null) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy - 0.1, 0.22, 0, TAU); ctx.fill(); }
    if (o.reach > 0.6 && side === 1) lamp(hx + 0.2, hy, 0.28, G);
  };
  const lean = o.lean || 0, upper = () => { ctx.transform(1, 0, lean * 0.13, 1, 0, 0); };
  const armSides = back ? [-1, 1] : [1, -1], farArm = back ? -1 : 1, nearArm = -farArm;

  if (cls === 'STRIKER') {
    const hipY = -3.3;
    for (const side of [-1, 1]) {
      const sw = side < 0 ? legL : legR, lift = Math.max(0, sw) * 0.7, fx = side * 0.5 + sw * 0.15, fy = -lift, kx = side * 0.62 + sw * 0.1, ky = -1.7 - lift * 0.6 + crouch * 0.5;
      limb(side * 0.36, hipY, kx, ky, 0.64, 0.46, PM, true); limb(kx, ky, fx, fy - 0.3, 0.46, 0.32, DM, true);
      plate([[fx - 0.34, fy], [fx + 0.38, fy], [fx + 0.3, fy - 0.36], [fx - 0.2, fy - 0.42]], SM, 0.08); glowLine([[fx - 0.22, fy - 0.08], [fx + 0.26, fy - 0.08]], 0.035);
      joint(kx, ky, 0.21);
    }
    ctx.save(); upper();
    drawArm(farArm * 1.08, -5.45, farArm, 0.36, PM, 0.24);
    plate([[-0.5, hipY + 0.15], [0.5, hipY + 0.15], [0.62, hipY - 0.4], [-0.62, hipY - 0.4]], '#1d2232');
    for (let i = 0; i < 3; i++) rr(-0.5 + i * 0.03, -3.85 - i * 0.24, 1.0 - i * 0.06, 0.2, 0.08, suit);
    if (!back) {
      plate([[-1.06, -5.72], [1.06, -5.72], [0.88, -4.62], [0.32, -4.28], [-0.32, -4.28], [-0.88, -4.62]], PM);
      plate([[-0.72, -5.55], [0.72, -5.55], [0.6, -4.8], [0, -4.5], [-0.6, -4.8]], SM, 0.07);
      traces([[[-0.26, -4.95], [-0.62, -5.2], [-0.9, -5.2]], [[0.26, -4.95], [0.62, -5.2], [0.9, -5.2]], [[0, -4.7], [0, -4.4], [-0.2, -4.2]]]);
      hexCore(0, -4.98, 0.27);
    } else {
      plate([[-1.02, -5.72], [1.02, -5.72], [0.7, -4.0], [-0.7, -4.0]], DM);
      for (let i = 0; i < 4; i++) lamp(0, -5.4 + i * 0.36, 0.06);
      backNum(-4.85, 0.62); thruster(-0.42, -4.75, 0.28); thruster(0.42, -4.75, 0.28);
    }
    for (const side of [-1, 1]) { const pp = [[side * 0.72, -5.88], [side * 1.48, -5.7], [side * 1.52, -5.12], [side * 0.98, -5.0]]; plate(pp, SM); glowLine([[side * 0.82, -5.82], [side * 1.42, -5.66]], 0.04); }
    rr(-0.17, -6.05, 0.34, 0.32, 0.06, suit);
    rr(-0.47, -6.98, 0.94, 0.98, 0.36, PM);
    plate([[-0.47, -6.55], [-0.62, -6.75], [-0.6, -6.25], [-0.45, -6.2]], SM, 0.06); plate([[0.47, -6.55], [0.62, -6.75], [0.6, -6.25], [0.45, -6.2]], SM, 0.06);
    if (!back) { visor(-0.42, -6.66, 0.84, 0.32); glowLine([[-0.3, -6.9], [0.3, -6.9]], 0.035, 0.7); }
    else { glowLine([[-0.25, -6.75], [0.25, -6.75]], 0.04); glowLine([[-0.18, -6.55], [0.18, -6.55]], 0.04); cap(0, -6.95, 0, -7.3, 0.08, S); lamp(0, -7.32, 0.06); }
    drawArm(nearArm * 1.08, -5.45, nearArm, 0.36, PM, 0.24);
    ctx.restore();
  } else if (cls === 'TITAN') {
    const tx = (t * (run ? 9 : 0)) % 0.5;
    rr(-1.6, -1.3, 3.2, 1.3, 0.6, '#151922');
    ctx.save(); rrect(ctx, -1.55, -1.25, 3.1, 1.2, 0.55); ctx.clip(); ctx.fillStyle = '#2a3040'; for (let i = -4; i < 8; i++) ctx.fillRect(-1.7 + i * 0.5 + tx, -1.25, 0.2, 1.25); ctx.restore();
    for (const wx of [-1.05, 0, 1.05]) { ell(wx, -0.62, 0.34, 0.34, GM); if (!lo) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(G, 0.8); ctx.lineWidth = 0.06; ctx.beginPath(); ctx.arc(wx, -0.62, 0.2, t * 4, t * 4 + 4); ctx.stroke(); ctx.restore(); } }
    plate([[-1.7, -1.05], [1.7, -1.05], [1.55, -1.55], [-1.55, -1.55]], SM); glowLine([[-1.45, -1.3], [1.45, -1.3]], 0.04, 0.8);
    rr(-0.95, -2.1, 1.9, 0.75, 0.2, GM);
    ctx.save(); upper();
    drawArm(farArm * 2.0, -5.3, farArm, 0.66, PM, 0.5);
    plate([[-1.2, -1.95], [1.2, -1.95], [1.8, -5.95], [-1.8, -5.95]], PM);
    if (!back) {
      plate([[-1.25, -4.7], [1.25, -4.7], [1.5, -5.85], [-1.5, -5.85]], SM, 0.08);
      rr(-0.95, -4.55, 1.9, 1.5, 0.15, '#0c1018');
      for (let i = 0; i < 5; i++) { const a = 0.5 + 0.5 * Math.sin(t * 5 - i); ctx.fillStyle = hexA(G, 0.35 + 0.55 * a); ctx.fillRect(-0.82, -4.4 + i * 0.27, 1.64, 0.1); }
      hexCore(0, -5.28, 0.36);
      traces([[[-0.4, -5.28], [-1.2, -5.28], [-1.45, -5.0]], [[0.4, -5.28], [1.2, -5.28], [1.45, -5.0]]]);
    } else {
      backNum(-4.3, 0.95);
      for (const sx2 of [-0.8, 0.8]) { rr(sx2 - 0.25, -6.35, 0.5, 1.4, 0.12, GM); if (!lo) glow(ctx, sx2, -6.4, 0.6, '#ff9a4a', 0.55 + 0.25 * Math.sin(t * 9 + sx2)); }
    }
    for (const side of [-1, 1]) { rr(side * 2.0 - 0.65, -6.4, 1.3, 1.05, 0.25, SM); plate([[side * 1.45, -6.4], [side * 2.55, -6.4], [side * 2.4, -6.75], [side * 1.6, -6.75]], PM, 0.08); for (let k = 0; k < 3; k++) { ctx.fillStyle = hexA(G, 0.75); ctx.fillRect(side * 2.0 - 0.4, -6.2 + k * 0.22, 0.8, 0.07); } }
    ell(0, -6.1, 0.6, 0.46, GM);
    if (!back) visor(-0.42, -6.28, 0.84, 0.2);
    drawArm(nearArm * 2.0, -5.3, nearArm, 0.66, PM, 0.5);
    ctx.restore();
  } else if (cls === 'VECTOR') {
    const hb = Math.sin(t * 3.3) * 0.18; ctx.translate(0, -hb);
    if (!lo) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const p = (((t * 0.9 + k / 3) % 1) + 1) % 1; ctx.strokeStyle = hexA(G, 0.55 * (1 - p)); ctx.lineWidth = 0.06; ctx.beginPath(); ctx.ellipse(0, -1.05 + p * 1.0 + hb, 0.4 + p * 0.9, (0.4 + p * 0.9) * 0.28, 0, 0, TAU); ctx.stroke(); } ctx.drawImage(glowSprite(G), -0.9, -1.7, 1.8, 2.2); ctx.restore(); }
    plate([[-0.36, -1.65], [0.36, -1.65], [0.22, -1.08], [-0.22, -1.08]], GM, 0.07); lamp(0, -1.02, 0.2, G);
    ctx.save(); upper();
    const pod = (side) => { const [hx, hy] = arms(side * 1.35, -3.7, side); if (!lo) { ctx.save(); ctx.setLineDash([0.12, 0.1]); ctx.lineDashOffset = -t * 2; ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(G, 0.75); ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(side * 0.95, -3.6); ctx.lineTo(hx, hy); ctx.stroke(); ctx.restore(); } ell(side * 1.12, -3.65, 0.2, 0.2, SM); plate([[hx - 0.28, hy - 0.35], [hx + 0.28, hy - 0.35], [hx + 0.2, hy + 0.3], [hx - 0.2, hy + 0.3]], SM, 0.07); glowLine([[hx - 0.15, hy + 0.1], [hx + 0.15, hy + 0.1]], 0.04); if (o.ball && side === 1) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy + 0.4, 0.22, 0, TAU); ctx.fill(); } if (o.reach > 0.6 && side === 1) lamp(hx + 0.2, hy, 0.28, G); };
    pod(farArm);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -3.35, 1.05, 1.5, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = PM; ctx.fillRect(-1.1, -4.9, 2.2, 3.2); ctx.fillStyle = DM; ctx.fillRect(0.08, -4.9, 1.1, 3.2); ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, -3.35, 1.05, 1.5, 0, 0, TAU); ctx.strokeStyle = OUT; ctx.lineWidth = 0.1; ctx.stroke(); if (hi) { ctx.strokeStyle = rim; ctx.lineWidth = 0.05; ctx.stroke(); }
    glowLine([[0.04, -4.8], [0.04, -1.95]], 0.045, 0.9);
    ctx.strokeStyle = OUT; ctx.lineWidth = 0.34; ctx.beginPath(); ctx.ellipse(0, -3.05, 1.2, 0.3, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = SM; ctx.lineWidth = 0.22; ctx.stroke();
    if (!lo) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(G, 0.85); ctx.lineWidth = 0.05; ctx.beginPath(); ctx.ellipse(0, -3.05, 1.2, 0.3, 0, t * 2, t * 2 + 2.2); ctx.stroke(); ctx.restore(); }
    if (!back) { ell(0, -3.95, 0.46, 0.46, '#070a12'); if (!lo) { ctx.save(); ctx.strokeStyle = hexA(G, 0.6); ctx.lineWidth = 0.04; for (let k = 0; k < 6; k++) { const an = t * 1.5 + k * TAU / 6; ctx.beginPath(); ctx.arc(0, -3.95, 0.36, an, an + 0.6); ctx.stroke(); } ctx.restore(); } ell(0, -3.95, 0.24, 0.24, glass(-4.2, -3.7), false); lamp(0, -3.95, 0.16); }
    else { backNum(-3.7, 0.62); for (let i = 0; i < 3; i++) glowLine([[-0.5, -2.7 + i * 0.18], [0.5, -2.7 + i * 0.18]], 0.035, 0.7); }
    cap(0, -4.8, 0, -5.45, 0.08, '#8b94a8'); lamp(0, -5.5, 0.11 + 0.04 * Math.sin(t * 6), G);
    for (const side of [-1, 1]) { const f = [[side * 0.78, -4.25], [side * 1.32, -4.95], [side * 0.98, -3.9]]; plate(f, SM, 0.07); glowLine([f[0], f[1]], 0.035, 0.8); }
    pod(nearArm);
    ctx.restore();
  } else { // RAPTOR
    const hipY = -3.25, tailSide = back ? 1 : -1;
    const tail = () => { const pts = []; for (let i = 0; i <= 6; i++) { const k = i / 6; pts.push([tailSide * (0.2 + k * 1.7), -3.2 + Math.sin(k * 3) * 0.9 * k - k * 0.2 + Math.sin(t * 4 + k * 3) * 0.12 * k]); } for (let i = 0; i < 6; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], w = 0.32 - i * 0.04; limb(ax, ay, bx, by, w, w * 0.85, i % 2 ? DM : PM, false); } lamp(pts[6][0], pts[6][1], 0.1); };
    if (!back) tail();
    for (const side of [-1, 1]) {
      const sw = side < 0 ? legL : legR, lift = Math.max(0, sw) * 0.75;
      const hx = side * 0.45, kx = side * 0.88 + sw * 0.1, ky = -2.15 - lift * 0.4 + crouch * 0.4, ax = side * 0.5 + sw * 0.2, ay = -0.78 - lift, tx2 = side * 0.72 + sw * 0.25, ty = -lift * 0.5;
      limb(hx, hipY, kx, ky, 0.66, 0.5, PM, true); limb(kx, ky, ax, ay, 0.42, 0.28, DM, true); cap(ax, ay, tx2, ty - 0.08, 0.2, '#1a1f2c');
      plate([[tx2 - 0.38, ty], [tx2 + 0.45, ty], [tx2 + 0.12, ty - 0.28]], SM, 0.07); joint(kx, ky, 0.2); joint(ax, ay, 0.13);
    }
    ctx.save(); upper();
    drawArm(farArm * 0.98, -5.0, farArm, 0.32, PM, 0.2, true);
    plate([[-0.72, hipY], [0.72, hipY], [1.02, -5.25], [0, -5.62], [-1.02, -5.25]], PM);
    if (!back) { plate([[-0.48, -3.85], [0.48, -3.85], [0.62, -4.9], [0, -5.18], [-0.62, -4.9]], SM, 0.07); traces([[[0, -4.2], [0, -3.6]], [[-0.3, -4.7], [-0.75, -4.95]], [[0.3, -4.7], [0.75, -4.95]]]); hexCore(0, -4.45, 0.2); }
    else { backNum(-4.4, 0.6); for (let i = 0; i < 4; i++) lamp(0, -5.3 + i * 0.35, 0.05); }
    for (const side of [-1, 1]) { const f = [[side * 0.55, -5.2], [side * 1.62, -6.25], [side * 1.08, -4.98]]; plate(f, SM); glowLine([[side * 0.62, -5.2], [side * 1.55, -6.18]], 0.04); }
    if (back) for (let i = 0; i < 3; i++) { const f = [[-0.14, -4.0 - i * 0.55], [0, -4.6 - i * 0.55], [0.14, -4.0 - i * 0.55]]; plate(f, SM, 0.06); glowLine([f[0], f[1]], 0.03); }
    plate([[-0.08, -6.4], [0.08, -6.4], [0.02, -6.95], [-0.3, -6.75]], SM, 0.06); glowLine([[0, -6.45], [-0.26, -6.75]], 0.035);
    plate([[-0.54, -5.75], [0.54, -5.75], [0.5, -6.25], [0.18, -6.58], [-0.18, -6.58], [-0.5, -6.25]], PM);
    if (!back) { rrect(ctx, -0.44, -6.12, 0.88, 0.2, 0.08); ctx.fillStyle = '#05070d'; ctx.fill(); const ex2 = Math.sin(t * 2.2) * 0.28; ctx.fillStyle = G; ctx.fillRect(-0.4, -6.07, 0.8, 0.1); lamp(ex2, -6.02, 0.15); }
    if (back) tail();
    drawArm(nearArm * 0.98, -5.0, nearArm, 0.32, PM, 0.2, true);
    ctx.restore();
  }
  // battle damage: scorch marks below 65% armor, cracks and shorting sparks below 40%
  if (dmg < 0.65 && !back || dmg < 0.65 && back) {
    const cy = { STRIKER: -4.6, TITAN: -4.2, VECTOR: -3.4, RAPTOR: -4.4 }[cls], sd = (r.num || 7) * 1.37;
    for (let k = 0; k < (dmg < 0.4 ? 3 : 2); k++) { const ox = Math.sin(sd + k * 2.1) * 0.6, oy = cy + Math.cos(sd * 1.3 + k) * 0.6, rr2 = 0.32 + 0.12 * k; const sg = ctx.createRadialGradient(ox, oy, 0, ox, oy, rr2); sg.addColorStop(0, 'rgba(10,8,6,0.75)'); sg.addColorStop(0.6, 'rgba(40,25,10,0.35)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(ox, oy, rr2, 0, TAU); ctx.fill(); }
    if (dmg < 0.4) {
      ctx.strokeStyle = 'rgba(5,5,8,0.85)'; ctx.lineWidth = 0.07; ctx.beginPath(); let px = Math.sin(sd) * 0.5, py = cy - 0.7; ctx.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (k % 2 ? 0.22 : -0.18); py += 0.28; ctx.lineTo(px, py); } ctx.stroke();
      ctx.strokeStyle = 'rgba(255,170,90,0.5)'; ctx.lineWidth = 0.03; ctx.stroke();
      if (Math.sin(t * 19 + sd) > 0.86) { const sx = Math.sin(sd * 2) * 0.7, sy = cy - 0.4; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 0.06; for (let k = 0; k < 5; k++) { const an = k * 1.26 + t * 9; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(an) * 0.45, sy + Math.sin(an) * 0.45); ctx.stroke(); } ctx.drawImage(glowSprite('#ffb347'), sx - 0.8, sy - 0.8, 1.6, 1.6); ctx.restore(); }
    }
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

// IRON DIAMOND — the ballpark: geometry + rendering through the 3D camera.
'use strict';
const BASES = [{ x: 0, y: 0 }, { x: 63.64, y: 63.64 }, { x: 0, y: 127.28 }, { x: -63.64, y: 63.64 }, { x: 0, y: 0 }];
const MOUND = { x: 0, y: 60.5 };
const FENCE_H = 10;
function fenceR(th) { return 338 + 64 * Math.cos(2 * th); } // th = angle from the centre-field line
function polar(r, th) { return [Math.sin(th) * r, Math.cos(th) * r]; }
function basePos(s) { s = clamp(s, 0, 4); const i = Math.min(3, Math.floor(s)), f = s - i; const a = BASES[i], b = BASES[i + 1]; return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) }; }

const Park = {
  built: false,
  build() {
    if (this.built) return; this.built = true;
    const P = 45 * DEG;
    // playing-surface boundary (fair arc + foul-territory walls + backstop)
    const arc = []; for (let i = 0; i <= 40; i++) { const th = -P + 2 * P * i / 40; arc.push([...polar(fenceR(th), th), 0]); }
    const rp = polar(fenceR(P), P), lp = polar(fenceR(-P), -P);
    this.arc = arc;
    this.sideR = [[rp[0], rp[1] - 60, 0], [62, -10, 0]];
    this.sideL = [[-62, -10, 0], [lp[0], lp[1] - 60, 0]];
    this.backstop = []; for (let i = 0; i <= 12; i++) { const a = -20 * DEG - (140 * DEG) * i / 12; this.backstop.push([Math.cos(a) * 62, Math.sin(a) * 52 - 4, 0]); }
    this.boundary = [...arc, [rp[0], rp[1] - 60, 0], ...[[62, -10, 0]], ...this.backstop, [-62, -10, 0], [lp[0], lp[1] - 60, 0]];
    // stands: a ring of quads behind the outfield arc and the side walls
    this.stands = [];
    const tier = (a, b, h0, h1, out0, out1) => {
      // a, b: boundary points; push a quad sloping up and out
      const dx = b[0] - a[0], dy = b[1] - a[1], l = hyp(dx, dy), nx = -dy / l, ny = dx / l; // outward normal (boundary is clockwise from left pole)
      this.stands.push({ pts: [[a[0] + nx * out0, a[1] + ny * out0, h0], [b[0] + nx * out0, b[1] + ny * out0, h0], [b[0] + nx * out1, b[1] + ny * out1, h1], [a[0] + nx * out1, a[1] + ny * out1, h1]], mid: [(a[0] + b[0]) / 2 + nx * (out0 + out1) / 2, (a[1] + b[1]) / 2 + ny * (out0 + out1) / 2, (h0 + h1) / 2] });
    };
    const outer = [[lp[0], lp[1] - 60, 0], ...arc, [rp[0], rp[1] - 60, 0]];
    // walk clockwise: left side wall (going away from home), arc, right side wall (coming back)
    const ring = [[-62, -10, 0], [lp[0], lp[1] - 60, 0], ...arc, [rp[0], rp[1] - 60, 0], [62, -10, 0]];
    for (let i = 0; i < ring.length - 1; i++) { tier(ring[i], ring[i + 1], FENCE_H, 30, 4, 56); tier(ring[i], ring[i + 1], 34, 54, 62, 118); }
    this.ring = ring;
    // crowd lights: random dots on the stand slopes
    const rng = mulberry(77); this.crowd = [];
    for (let i = 0; i < 1100; i++) {
      const q = this.stands[Math.floor(rng() * this.stands.length)].pts, u = rng(), v = rng();
      const p0 = q[0].map((c, k) => lerp(c, q[1][k], u)), p1 = q[3].map((c, k) => lerp(c, q[2][k], u)); const p = p0.map((c, k) => lerp(c, p1[k], v));
      this.crowd.push({ p, c: rng() < 0.12 ? 1 : 0, ph: rng() * TAU });
    }
    // light towers
    this.towers = [[-300, 330], [300, 330], [-250, 40], [250, 40]].map(([x, y]) => ({ x, y, z: 150 }));
    this.bands = []; for (let j = -3; j < 16; j += 2) this.bands.push([[-500, j * 30, 0], [500, j * 30, 0], [500, j * 30 + 30, 0], [-500, j * 30 + 30, 0]]);
    this.stripes = [];
    for (let i = -14; i < 14; i++) this.stripes.push([[i * 30, -80, 0], [i * 30 + 30, -80, 0], [i * 30 + 30, 470, 0], [i * 30, 470, 0], i & 1]);
    this.skyStars = []; for (let i = 0; i < 90; i++) this.skyStars.push([rng() * W, rng() * H * 0.5, rng()]);
    this.skyline = []; let x = 0; while (x < W + 60) { const w = 18 + rng() * 40; this.skyline.push([x, w, 30 + rng() * 80, rng()]); x += w + 2; }
  },
  draw(ctx, cam, homeTeam, t, sb) {
    this.build();
    const hz = cam.proj(cam.pos.x + cam.F[0] * 5000, cam.pos.y + cam.F[1] * 5000, 0);
    const hy = hz ? clamp(hz.y, -200, H + 200) : H / 2, th = themeOf(homeTeam);
    drawThemeSky(ctx, cam, homeTeam, t, hy, this.skyStars);
    // concourse plane under everything
    cam.fillPoly(ctx, [[-700, -400, -0.5], [700, -400, -0.5], [700, 800, -0.5], [-700, 800, -0.5]], '#0c1020');
    // stands (painter sorted)
    const st = this.stands.map(s => ({ s, d: cam.toCam(...s.mid)[2] })).sort((a, b) => b.d - a.d);
    const standLo = mixHex('#1c2240', th.sky[1], 0.35), standHi = mixHex('#161b33', th.sky[1], 0.35);
    for (const { s } of st) { if (cam.fillPoly(ctx, s.pts, s.pts[0][2] > 30 ? standHi : standLo)) { ctx.strokeStyle = 'rgba(120,140,220,0.08)'; ctx.lineWidth = 1; ctx.stroke(); } }
    // crowd dots
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const flash = Math.floor(t * 6) * 131; let ci = 0;
    for (const c of this.crowd) {
      ci++; const q = cam.proj(c.p[0], c.p[1], c.p[2]); if (!q || q.x < -5 || q.x > W + 5 || q.y < -5 || q.y > H + 5) continue;
      const sz = clamp(q.s * 1.6, 0.8, 4); const tw = 0.5 + 0.5 * Math.sin(t * 3 + c.ph);
      ctx.fillStyle = c.c ? hexA(homeTeam.g, 0.5 + 0.4 * tw) : `rgba(${150 + tw * 60 | 0},${160 + tw * 50 | 0},220,0.35)`; ctx.fillRect(q.x, q.y, sz, sz);
      if (FX.high && (flash + ci * 977) % 1800 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(q.x - 1, q.y - 1, sz + 2, sz + 2); ctx.drawImage(glowSprite('#ffffff'), q.x - 9, q.y - 9, 18, 18); }
    }
    ctx.restore();
    // neon rim on top of stands
    for (let i = 0; i < this.ring.length - 1; i++) { const a = this.stands[i * 2 + 1].pts; cam.line(ctx, a[3], a[2], hexA(homeTeam.g, 0.75), 2); }
    // cantilevered roof canopy with an LED underside and truss struts
    for (let i = 0; i < this.ring.length - 1; i++) {
      const a = this.stands[i * 2 + 1].pts, dxa = a[3][0] - a[0][0], dya = a[3][1] - a[0][1], dxb = a[2][0] - a[1][0], dyb = a[2][1] - a[1][1];
      const ia = [a[3][0] - dxa * 0.45, a[3][1] - dya * 0.45, 66], ib = [a[2][0] - dxb * 0.45, a[2][1] - dyb * 0.45, 66];
      const oa = [a[3][0], a[3][1], 60], ob = [a[2][0], a[2][1], 60];
      if (cam.fillPoly(ctx, [oa, ob, ib, ia], '#0b0f22')) { ctx.strokeStyle = 'rgba(140,160,230,0.12)'; ctx.lineWidth = 1; ctx.stroke(); }
      cam.line(ctx, ia, ib, hexA(homeTeam.g, 0.55), 1.5);
      if (i % 3 === 0) cam.line(ctx, [a[3][0], a[3][1], a[3][2]], ia, 'rgba(90,100,140,0.5)', 1.5);
    }
    // scoreboard in deep centre
    if (sb) this.drawBoard(ctx, cam, homeTeam, sb, t);
    // light towers
    for (const tw of this.towers) {
      cam.line(ctx, [tw.x, tw.y, 0], [tw.x, tw.y, tw.z], '#2a3150', 3);
      const q = cam.proj(tw.x, tw.y, tw.z); if (q) { const lw = clamp(48 * q.s, 3, 28); ctx.fillStyle = '#e8f0ff'; ctx.fillRect(q.x - lw / 2, q.y - lw / 4, lw, lw / 2); glow(ctx, q.x, q.y, Math.min(320, 260 * q.s + 30), '#bcd4ff', 0.55); }
    }
    // ----- ground
    cam.fillPoly(ctx, this.boundary, th.grass || '#16502b');
    ctx.save(); if (cam.fillPoly(ctx, this.boundary, null)) ctx.clip();
    for (const s of this.stripes) if (s[4]) cam.fillPoly(ctx, s.slice(0, 4), 'rgba(80,180,100,0.12)');
    if (FX.high) for (const s of this.bands) cam.fillPoly(ctx, s, 'rgba(0,30,10,0.09)');
    // infield dirt fan + base path arc
    const fan = [[0, 0, 0]]; for (let i = 0; i <= 24; i++) { const th = -P_ + 2 * P_ * i / 24; fan.push([...polar(158, th), 0]); }
    const dirt = th.dirt || '#7a4a30'; cam.fillPoly(ctx, fan, dirt);
    // infield grass
    cam.fillPoly(ctx, [[0, 8, 0], [56, 63.6, 0], [0, 119, 0], [-56, 63.6, 0]], th.grass ? shade(th.grass, 0.06) : '#1b5e33');
    for (const s of this.stripes) if (s[4]) { /* subtle checker on infield */ }
    cam.fillPoly(ctx, circlePts(0, 0, 14, 24), dirt);
    cam.fillPoly(ctx, circlePts(MOUND.x, MOUND.y, 9, 24), shade(dirt, 0.08));
    for (let b = 1; b <= 3; b++) cam.fillPoly(ctx, circlePts(BASES[b].x, BASES[b].y, 7, 16), dirt);
    // warning track
    const track = []; for (let i = 0; i <= 40; i++) { const th = -P_ + 2 * P_ * i / 40; track.push([...polar(fenceR(th) - 0.5, th), 0]); }
    for (let i = 40; i >= 0; i--) { const th = -P_ + 2 * P_ * i / 40; track.push([...polar(fenceR(th) - 14, th), 0]); }
    cam.fillPoly(ctx, track, shade(dirt, -0.25));
    if (FX.high) { ctx.save(); ctx.globalAlpha = 0.09; ctx.fillStyle = Park._pat || (Park._pat = ctx.createPattern(grainTex(), 'repeat')); ctx.fillRect(0, 0, W, H); ctx.restore(); }
    const pool = cam.proj(0, 150, 0); if (pool) glow(ctx, pool.x, pool.y, Math.min(900, 330 * pool.s + 60), '#cfe2ff', 0.1);
    ctx.restore();
    // foul lines + boxes (neon)
    const fl = fenceR(P_) + 2;
    for (const sgn of [-1, 1]) {
      cam.line(ctx, [0, 0, 0.05], [sgn * Math.sin(P_) * fl, Math.cos(P_) * fl, 0.05], 'rgba(150,240,255,0.35)', 5);
      cam.line(ctx, [0, 0, 0.05], [sgn * Math.sin(P_) * fl, Math.cos(P_) * fl, 0.05], '#e9fbff', 1.6);
      const pole = polar(fenceR(P_), sgn * P_); cam.line(ctx, [pole[0], pole[1], 0], [pole[0], pole[1], 45], '#ffe14a', 3);
    }
    for (const sgn of [-1, 1]) { const bx = sgn * 3.2; const box = [[bx - 2, -3, 0.05], [bx + 2, -3, 0.05], [bx + 2, 3, 0.05], [bx - 2, 3, 0.05]]; for (let i = 0; i < 4; i++) cam.line(ctx, box[i], box[(i + 1) % 4], 'rgba(255,255,255,0.7)', 1.2); }
    // home plate & rubber & bases (glowing pads)
    cam.fillPoly(ctx, [[-0.71, 0.7, 0.06], [0.71, 0.7, 0.06], [0.71, 0, 0.06], [0, -0.71, 0.06], [-0.71, 0, 0.06]], '#f4f7ff');
    cam.fillPoly(ctx, [[-1, 60.2, 0.3], [1, 60.2, 0.3], [1, 60.7, 0.3], [-1, 60.7, 0.3]], '#f4f7ff');
    for (let b = 1; b <= 3; b++) {
      const B = BASES[b]; cam.fillPoly(ctx, [[B.x, B.y - 1.2, 0.3], [B.x + 1.2, B.y, 0.3], [B.x, B.y + 1.2, 0.3], [B.x - 1.2, B.y, 0.3]], '#f4f7ff');
      const q = cam.proj(B.x, B.y, 0.3); if (q) glow(ctx, q.x, q.y, 3.5 * q.s + 4, homeTeam.g, 0.5);
    }
    // outfield wall (padded, with LED ad strip)
    for (let i = 0; i < this.ring.length - 1; i++) {
      const a = this.ring[i], b = this.ring[i + 1];
      const h = (i === 0 || i === this.ring.length - 2) ? 6 : FENCE_H;
      cam.fillPoly(ctx, [[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], h], [a[0], a[1], h]], '#0f2a4a');
      const k = (i + Math.floor(t * 4)) % 6;
      cam.fillPoly(ctx, [[a[0], a[1], h * 0.55], [b[0], b[1], h * 0.55], [b[0], b[1], h * 0.85], [a[0], a[1], h * 0.85]], k < 3 ? hexA(homeTeam.p, 0.9) : hexA(homeTeam.s, 0.65));
      cam.line(ctx, [a[0], a[1], h], [b[0], b[1], h], hexA(homeTeam.g, 0.9), 2);
    }
    this.drawDistances(ctx, cam);
    if (FX.high) this.drawBeams(ctx, cam, t);
  },
  drawBeams(ctx, cam, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const tw of this.towers) {
      const q = cam.proj(tw.x, tw.y, tw.z); if (!q) continue;
      const gx = lerp(tw.x, 0, 0.72), gy = lerp(tw.y, 170, 0.72), dx = gx - tw.x, dy = gy - tw.y, l = hyp(dx, dy), nx = -dy / l * 85, ny = dx / l * 85;
      const a = cam.proj(gx + nx, gy + ny, 0), b = cam.proj(gx - nx, gy - ny, 0); if (!a || !b) continue;
      const g = ctx.createLinearGradient(q.x, q.y, (a.x + b.x) / 2, (a.y + b.y) / 2); g.addColorStop(0, 'rgba(190,215,255,0.16)'); g.addColorStop(1, 'rgba(190,215,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.closePath(); ctx.fill();
      // lens flare ghosts toward the screen centre
      if (q.x > -40 && q.x < W + 40 && q.y > -40 && q.y < H) {
        const vx = W / 2 - q.x, vy = H / 2 - q.y;
        [[0.3, 12, '#7fd8ff', 0.12], [0.55, 22, '#b48cff', 0.07]].forEach(([k, r, c, al]) => glow(ctx, q.x + vx * k, q.y + vy * k, r, c, al));
        ctx.globalAlpha = 0.35; ctx.fillStyle = 'rgba(220,235,255,0.5)'; ctx.fillRect(q.x - 60, q.y - 0.75, 120, 1.5); ctx.globalAlpha = 1;
      }
    }
    // dust motes drifting through the light
    for (let i = 0; i < 40; i++) { const x = ((i * 73.3 + t * (6 + i % 5)) % 520) - 260, y = 60 + (i * 41.7) % 300, z = 20 + ((i * 17.1 + t * 3) % 70); const q = cam.proj(x, y, z); if (q) { ctx.fillStyle = 'rgba(220,235,255,0.35)'; const r = Math.max(1, q.s * 0.6); ctx.fillRect(q.x, q.y, r, r); } }
    ctx.restore();
  },
  drawDistances(ctx, cam) {
    for (const [deg, label] of [[-45, '335'], [-22, '375'], [0, '402'], [22, '375'], [45, '335']]) {
      const th = deg * DEG, r = fenceR(th) - 0.3, p = polar(r, th); const q = cam.proj(p[0], p[1], 4.2); if (!q || q.s < 0.6) continue;
      txt(ctx, label, q.x, q.y, Math.min(28, q.s * 4.5), '#ffffff', 'center', FONT_H, 900);
    }
  },
  drawBackstop(ctx, cam) {
    const pts = this.backstop; for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      cam.fillPoly(ctx, [[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], 7], [a[0], a[1], 7]], 'rgba(120,200,255,0.06)');
      cam.line(ctx, [a[0], a[1], 7], [b[0], b[1], 7], 'rgba(140,220,255,0.35)', 1.5);
    }
  },
  drawBoard(ctx, cam, team, sb, t) {
    // affine map of a canvas panel onto the big board
    const y = 480, z0 = 40, z1 = 88, w = 92, cx = 22;
    const tl = cam.proj(cx - w, y, z1), tr = cam.proj(cx + w, y, z1), bl = cam.proj(cx - w, y, z0); if (!tl || !tr || !bl) return;
    cam.line(ctx, [cx - 70, y, 0], [cx - 70, y, z0], '#1a2040', 6); cam.line(ctx, [cx + 70, y, 0], [cx + 70, y, z0], '#1a2040', 6);
    ctx.save();
    const ax = (tr.x - tl.x) / 520, ay = (tr.y - tl.y) / 520, bx = (bl.x - tl.x) / 160, by = (bl.y - tl.y) / 160;
    ctx.transform(ax, ay, bx, by, tl.x, tl.y);
    ctx.fillStyle = '#05070f'; ctx.fillRect(-6, -6, 532, 172); ctx.strokeStyle = team.g; ctx.lineWidth = 3; ctx.strokeRect(-6, -6, 532, 172);
    sb(ctx, 520, 160, t);
    ctx.restore();
  },
};
const P_ = 45 * DEG;

let _grain = null;
function grainTex() {
  if (_grain) return _grain; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const d = g.createImageData(128, 128);
  const rng = mulberry(9); for (let i = 0; i < d.data.length; i += 4) { const v = rng() < 0.5 ? 0 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = rng() * 120; }
  g.putImageData(d, 0, 0); return _grain = c;
}

function mixHex(a, b, k) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const c = i => Math.round(lerp(A >> i & 255, B >> i & 255, k)); return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); }

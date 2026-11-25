// IRON DIAMOND — CLASH: close plays are settled in a holo-ring brawl. Damage is permanent.
'use strict';
class Clash {
  constructor({ match, a, b, base, sk }) {
    this.m = match; this.sk = sk; this.base = base; this.t = 0; this.intro = 1.1; this.dur = 9; this.done = false; this.result = null; this.endT = 0; this.shake = 0;
    const mk = (o, x, dir) => ({ r: o.r, side: o.side, pad: o.pad, x, vx: 0, dir, st: 'idle', stT: 0, dealt: 0, flash: 0, think: 0, hold: 0, wantBlock: false, max: maxHp(o.r, o.side), anim: rnd(5) });
    this.f = [mk(a, -150, 1), mk(b, 150, -1)];
    this.sparks = []; this.floaters = [];
    Sfx.play('clash');
  }
  S(f, k) { return stat(f.r, k, f.side); }
  dmg(f, heavy) { const base = 3 + this.S(f, 'fgt') * 0.75 + this.S(f, 'pow') * 0.25; let d = base * (heavy ? 2.3 : 1); if (f.r.cls === 'TITAN' && heavy) d *= 1.2; if (f.r.cls === 'RAPTOR' && !heavy) d *= 1.12; return d * rnd(0.9, 1.1); }
  update(dt) {
    this.t += dt; this.shake = Math.max(0, this.shake - dt * 3);
    for (const p of this.sparks) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; } this.sparks = this.sparks.filter(p => p.t < p.life);
    for (const p of this.floaters) p.t += dt; this.floaters = this.floaters.filter(p => p.t < 1);
    for (const f of this.f) { f.flash = Math.max(0, f.flash - dt); f.anim += dt; }
    if (this.intro > 0) { this.intro -= dt; return; }
    if (this.result) { this.endT -= dt; if (this.endT <= 0) this.done = true; return; }
    const [A, B] = this.f;
    for (const f of this.f) this.control(f, f === A ? B : A, dt);
    for (const f of this.f) {
      f.x += f.vx * dt; f.vx *= Math.pow(0.02, dt) ; f.x = clamp(f.x, -290, 290);
      f.dir = f === A ? Math.sign(B.x - A.x) || 1 : Math.sign(A.x - B.x) || -1;
    }
    // keep apart
    const gap = B.x - A.x, minG = 96; if (Math.abs(gap) < minG) { const push = (minG - Math.abs(gap)) / 2 * Math.sign(gap || 1); A.x -= push; B.x += push; }
    // attacks
    for (const f of this.f) this.attackTick(f, f === A ? B : A, dt);
    if (this.result) return;
    if (this.t - 1.1 >= this.dur) this.finish(null);
  }
  control(f, o, dt) {
    if (f.st === 'stun' || f.st === 'ko') { f.stT -= dt; if (f.stT <= 0 && f.st === 'stun') f.st = 'idle'; return; }
    if (f.st === 'jab' || f.st === 'heavy') return;
    const spd = 150 + this.S(f, 'spd') * 14;
    let mv = 0, jab = false, heavy = false, block = false;
    if (f.pad != null) {
      const a = Input.axis(f.pad); mv = a.x; block = Input.held(f.pad, 'down'); jab = Input.hit(f.pad, 'a'); heavy = Input.hit(f.pad, 'b');
    } else {
      f.think -= dt; const d = Math.abs(o.x - f.x);
      if (f.think <= 0) {
        f.think = rnd(0.08, 0.2) / this.sk; f.plan = null;
        if (o.st === 'heavy' && o.stT > 0.2 && d < 150 && Math.random() < 0.65 * this.sk) f.plan = 'block';
        else if (d > 105) f.plan = 'in';
        else if (Math.random() < 0.55 * this.sk) f.plan = Math.random() < 0.68 ? 'jab' : 'heavy';
        else if (Math.random() < 0.25) f.plan = 'out';
        else if (o.st === 'jab' && Math.random() < 0.4 * this.sk) f.plan = 'block';
      }
      const toward = Math.sign(o.x - f.x);
      if (f.plan === 'in') mv = toward; else if (f.plan === 'out') mv = -toward;
      else if (f.plan === 'block') block = true;
      else if (f.plan === 'jab') { jab = true; f.plan = null; } else if (f.plan === 'heavy') { heavy = true; f.plan = null; }
    }
    if (block) { f.st = 'block'; f.vx = 0; return; } else if (f.st === 'block') f.st = 'idle';
    if (jab) { f.st = 'jab'; f.stT = 0; f.hitDone = false; f.len = f.r.cls === 'VECTOR' ? 0.26 : 0.32; Sfx.play('whiff'); return; }
    if (heavy) { f.st = 'heavy'; f.stT = 0; f.hitDone = false; f.len = f.r.cls === 'TITAN' ? 0.85 : 0.75; Sfx.play('servo'); return; }
    if (mv) f.x += mv * spd * dt;
    f.moving = !!mv;
  }
  attackTick(f, o, dt) {
    if (f.st !== 'jab' && f.st !== 'heavy') return;
    f.stT += dt; const heavy = f.st === 'heavy';
    const a0 = heavy ? f.len * 0.56 : f.len * 0.25, a1 = heavy ? f.len * 0.7 : f.len * 0.5, range = heavy ? 120 : 98;
    if (!f.hitDone && f.stT >= a0 && f.stT <= a1) {
      const d = Math.abs(o.x - f.x);
      if (d <= range && o.st !== 'ko') {
        f.hitDone = true; let dm = this.dmg(f, heavy); let blocked = false;
        if (o.st === 'block') { blocked = true; dm *= heavy ? 0.5 : 0.15; }
        dm = Math.round(dm); o.r.hp = Math.max(0, o.r.hp - dm); f.dealt += dm; o.flash = 0.15;
        o.vx = f.dir * (heavy ? (blocked ? 260 : 420) : (blocked ? 60 : 150));
        if (!blocked || heavy) { o.st = 'stun'; o.stT = heavy ? 0.45 : 0.2; }
        const hx = (f.x + o.x) / 2;
        for (let i = 0; i < (heavy ? 26 : 12); i++) this.sparks.push({ x: hx, y: -95 + rnd(-20, 20), vx: f.dir * rnd(50, 400) + rnd(-80, 80), vy: rnd(-380, -40), t: 0, life: rnd(0.25, 0.6), c: blocked ? '#9fe6ff' : pick(['#ffd84a', '#ff9a3d', '#ffffff']) });
        this.floaters.push({ x: o.x, y: -190, t: 0, s: blocked ? `BLOCK ${dm}` : `-${dm}`, c: blocked ? '#9fe6ff' : '#ffd84a' });
        Sfx.play(blocked ? 'block' : heavy ? 'heavy' : 'hit'); this.shake = heavy ? 0.5 : 0.2; this.m.shake = Math.max(this.m.shake, heavy ? 0.4 : 0.15);
        if (o.r.hp <= 0) { o.st = 'ko'; this.finish(o === this.f[0] ? 'b' : 'a', true); }
      }
    }
    if (f.stT >= f.len) f.st = 'idle';
  }
  finish(winner, ko) {
    const [A, B] = this.f;
    if (!winner) winner = A.dealt >= B.dealt ? 'a' : 'b';
    this.result = { winner, ko: !!ko, aDestroyed: A.r.hp <= 0, bDestroyed: B.r.hp <= 0, dealt: [A.dealt, B.dealt] };
    this.endT = ko ? 2.0 : 1.4;
    if (ko) { const L = winner === 'a' ? B : A; Sfx.play('boom'); Sfx.play('roar'); this.shake = 1.2; for (let i = 0; i < 80; i++) this.sparks.push({ x: L.x, y: -80 + rnd(-40, 40), vx: rnd(-500, 500), vy: rnd(-700, -50), t: 0, life: rnd(0.5, 1.4), c: pick(['#ffd84a', '#ff6a2a', '#ffffff', '#ff3d3d']) }); }
    else Sfx.play('buzz');
  }
  draw(ctx) {
    const cx = W / 2, fy = 400; const sh = this.shake * 10;
    ctx.save(); ctx.translate(rnd(-sh, sh), rnd(-sh, sh));
    // dim + vignette
    ctx.fillStyle = 'rgba(3,5,14,0.72)'; ctx.fillRect(-20, -20, W + 40, H + 40);
    const [A, B] = this.f; const ta = A.side.team, tb = B.side.team;
    // holo floor
    ctx.save(); ctx.beginPath(); ctx.moveTo(cx - 420, fy + 60); ctx.lineTo(cx + 420, fy + 60); ctx.lineTo(cx + 300, fy - 40); ctx.lineTo(cx - 300, fy - 40); ctx.closePath();
    const g = ctx.createLinearGradient(0, fy - 40, 0, fy + 60); g.addColorStop(0, 'rgba(70,224,255,0.05)'); g.addColorStop(1, 'rgba(70,224,255,0.22)'); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(120,230,255,0.25)'; ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 30, fy - 40); ctx.lineTo(cx + i * 42, fy + 60); ctx.stroke(); }
    for (let k = 0; k < 6; k++) { const yy = fy - 40 + Math.pow(k / 5, 1.6) * 100; ctx.beginPath(); ctx.moveTo(cx - 420, yy); ctx.lineTo(cx + 420, yy); ctx.stroke(); }
    ctx.restore();
    // silhouetted crowd behind the ring, phone lights flickering
    ctx.fillStyle = 'rgba(4,6,14,0.9)';
    for (let i = 0; i < 46; i++) { const x = cx - 470 + i * 21 + (i % 3) * 4, y = fy - 185 + Math.sin(i * 1.7) * 6 + Math.abs(Math.sin(this.t * 6 + i)) * (this.result ? 6 : 2); ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.fillRect(x - 11, y + 6, 22, 40); if ((i * 7 + Math.floor(this.t * 5)) % 11 === 0) glow(ctx, x + 6, y + 14, 8, i % 2 ? ta.g : tb.g, 0.8); }
    // holo pillars at the corners
    for (const [k, col] of [[-1, ta.g], [1, tb.g]]) { const px = cx + k * 310; const pg = ctx.createLinearGradient(0, fy - 200, 0, fy + 40); pg.addColorStop(0, hexA(col, 0)); pg.addColorStop(0.5, hexA(col, 0.55)); pg.addColorStop(1, hexA(col, 0.1)); ctx.fillStyle = pg; ctx.fillRect(px - 5, fy - 200, 10, 240); glow(ctx, px, fy - 60 - (this.t * 60 % 140), 18, col, 0.8); }
    // ropes in team colours
    for (const [k, col] of [[0, ta.g], [1, tb.g]]) { const x0 = k ? cx + 300 : cx - 300; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 12; for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(x0, fy - 60 - j * 45); ctx.lineTo(cx, fy - 60 - j * 45 - 6); ctx.stroke(); } ctx.shadowBlur = 0; }
    // fighters
    for (const f of [A, B]) {
      const x = cx + f.x, s = 21; const t = f.anim;
      const ell = ctx.createRadialGradient(x, fy, 0, x, fy, 60); ell.addColorStop(0, 'rgba(0,0,0,0.6)'); ell.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = ell; ctx.fillRect(x - 60, fy - 15, 120, 30);
      if (f.st === 'ko' && this.result) { if (Math.floor(this.t * 12) % 2) continue; }
      const o = { t, back: false, flip: f.dir < 0, lean: f.st === 'heavy' ? 0.6 : f.moving ? 0.35 : 0, run: f.moving ? 0.8 : 0, flash: f.flash, hp: f.r.hp / f.max };
      if (f.st === 'jab') o.reach = Math.sin(clamp(f.stT / f.len, 0, 1) * Math.PI);
      if (f.st === 'heavy') { const p = f.stT / f.len; if (p < 0.56) o.windup = p / 0.56; else o.reach = Math.sin(clamp((p - 0.56) / 0.44, 0, 1) * Math.PI) * 1.15; }
      if (f.st === 'block') o.block = true;
      if (f.st === 'stun') o.lean = -0.7;
      // flip handles direction: lean is in local coords
      drawRobot(ctx, x, fy, s, f.r, f.side.team, o);
      if (f.st === 'heavy' && f.stT < f.len * 0.56) glow(ctx, x + f.dir * 10, fy - 110, 30 + 40 * (f.stT / f.len), f.side.team.g, 0.7);
    }
    // sparks
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of this.sparks) { const k = 1 - p.t / p.life; ctx.fillStyle = p.c; ctx.globalAlpha = k; ctx.fillRect(cx + p.x - 2, fy + p.y - 2, 4, 4); ctx.globalAlpha = k * 0.6; ctx.drawImage(glowSprite(p.c), cx + p.x - 10, fy + p.y - 10, 20, 20); }
    ctx.restore();
    for (const p of this.floaters) { ctx.globalAlpha = 1 - p.t; txt(ctx, p.s, cx + p.x, fy + p.y - p.t * 40, 24, p.c, 'center', FONT_H, 900); ctx.globalAlpha = 1; }
    // HUD: health bars
    const hb = (f, x, al) => {
      const team = f.side.team, w = 330, fr = f.r.hp / f.max;
      panel(ctx, x - (al ? w : 0) - 12, 26, w + 24, 74, team.g, 0.8);
      drawEmblem(ctx, al ? x - w + 14 : x + w - 14, 62, 18, team);
      txt(ctx, `${f.r.name}  #${f.r.num}`, al ? x - w + 40 : x + w - 40, 46, 22, '#ffffff', al ? 'left' : 'right', FONT_H, 900);
      txt(ctx, `${CLASSES[f.r.cls].name} · FGT ${this.S(f, 'fgt')} · POW ${this.S(f, 'pow')}`, al ? x - w + 40 : x + w - 40, 68, 15, '#9aa6c8', al ? 'left' : 'right');
      if (al) bar(ctx, x - w + 40, 80, w - 40, 12, fr, hpColor(fr));
      else { const bw = w - 40, fw = bw * clamp(fr, 0, 1); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x, 80, bw, 12); ctx.fillStyle = hpColor(fr); ctx.fillRect(x + bw - fw, 80, fw, 12); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + bw - fw, 80, fw, 4); }
    };
    hb(A, cx - 40, true); hb(B, cx + 40, false);
    txt(ctx, A.pad != null || B.pad != null ? '' : '', cx, 30, 12, '#fff');
    const left = Math.max(0, Math.ceil(this.dur - Math.max(0, this.t - 1.1)));
    glowTxt(ctx, String(left), cx, 62, 40, '#ffffff', '#46e0ff');
    const what = this.base === 4 ? 'HOME PLATE' : ['', 'FIRST', 'SECOND', 'THIRD'][this.base] + ' BASE';
    txt(ctx, `CLOSE PLAY AT ${what}`, cx, 112, 16, '#ffd84a', 'center', FONT_H, 900);
    txt(ctx, 'RUNNER WINS → SAFE   ·   FIELDER WINS → OUT', cx, 134, 13, '#9aa6c8', 'center', FONT_B, 700);
    if (A.pad != null || B.pad != null) txt(ctx, '←/→ MOVE   A STRIKE   B HEAVY (BREAKS GUARD)   ↓ GUARD', cx, H - 26, 15, '#c8d2f0', 'center', FONT_B, 700);
    if (this.intro > 0) {
      const k = 1 - this.intro / 1.1; const sc = 1 + Math.max(0, 0.4 - k) * 3;
      ctx.save(); ctx.translate(cx, H / 2 - 40); ctx.scale(sc, sc); glowTxt(ctx, 'CLASH!', 0, 0, 96, '#ffffff', '#ff3d5a'); ctx.restore();
    }
    if (this.result) {
      const win = this.result.winner === 'a' ? A : B; const safe = this.result.winner === 'a';
      glowTxt(ctx, this.result.ko ? 'K.O.' : 'TIME', cx, H / 2 - 70, 70, '#ffffff', '#ff3d5a');
      glowTxt(ctx, safe ? 'SAFE!' : 'OUT!', cx, H / 2 + 6, 54, safe ? '#3dffa0' : '#ff4a5a', safe ? '#3dffa0' : '#ff4a5a');
    }
    ctx.restore();
  }
}

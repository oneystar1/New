// IRON DIAMOND — the match engine: pitching, batting, fielding, running, rules, AI.
'use strict';
const PITCHES = [
  { name: 'FASTBALL', spd: 1.0, bx: 0, bz: 0.35, col: '#ffffff', cost: 2 },
  { name: 'CURVE', spd: 0.8, bx: 0.9, bz: -2.1, col: '#8fe3ff', cost: 3 },
  { name: 'SLIDER', spd: 0.9, bx: 1.7, bz: -0.5, col: '#b4ff7a', cost: 3 },
  { name: 'CHANGEUP', spd: 0.7, bx: 0.3, bz: -1.0, col: '#ffd37a', cost: 2 },
  { name: 'PLASMA', spd: 1.12, bx: 0, bz: 0, col: '#d06bff', cost: 14, wobble: true },
];
const BAT_Z = 2.55, IDEAL = 0.13, ZONE_X = 0.95, ZONE_Z0 = 1.5, ZONE_Z1 = 3.7;
const FIELD_HOME = { P: [0, 60.5], C: [0, -3.5], '1B': [66, 86], '2B': [30, 126], SS: [-32, 124], '3B': [-66, 86], LF: [-128, 238], CF: [0, 288], RF: [128, 238] };
const SKILL = [0.62, 0.86, 1.06];
const CLOSE_FT = 18;

class Match {
  constructor(cfg) {
    this.cfg = cfg; this.diff = cfg.diff ?? 1; this.sk = SKILL[this.diff];
    this.sides = [0, 1].map(i => ({ idx: i, team: TEAMS[cfg.teams[i]], ro: cfg.rosters[i], batIdx: 0, up: (cfg.up && cfg.up[i]) || {}, hits: 0, scrapN: 0, ko: 0, lost: 0, k: 0 }));
    for (const sd of this.sides) for (let i = 0; i < 9; i++) { const r = sd.ro.lineup[i]; if (!r.alive || r.hp <= 0) this.substitute(sd, r, true); }
    for (const sd of this.sides) for (const r of sd.ro.lineup.concat(sd.ro.bench)) r.battery = 100;
    this.ctrl = cfg.ctrl; this.innings = cfg.innings || 3;
    this.inning = 1; this.half = 0; this.outs = 0; this.balls = 0; this.strikes = 0; this.score = [0, 0]; this.line = [[], []];
    this.bases = [null, null, null];
    this.cam = new Cam(); this.camK = 0; this.view = 'bat'; this.focus = { x: 0, y: 60 };
    this.parts = new Particles(); this.banners = []; this.time = 0; this.shake = 0;
    this.state = 'intro'; this.timer = 2.6; this.over = false; this.log = [];
    this.fielders = []; this.runners = []; this.ball = null;
    this.events = { hr: 0, plays: 0, clashes: 0 };
    this.buildFielders(); this.pt = null;
    Sfx.play('crowd');
  }
  // ------------------------------------------------------------ helpers
  get bat() { return this.half; } get fld() { return 1 - this.half; }
  human(side) { return this.ctrl[side]; }
  pad(side) { const c = this.ctrl[side]; return c == null ? null : c; }
  batter() { const sd = this.sides[this.bat]; return sd.ro.lineup[sd.batIdx % 9]; }
  pitcher() { return this.sides[this.fld].ro.lineup.find(r => r.pos === 'P'); }
  st(r, k) { const sd = this.sides.find(s => s.team.id === r.team) || this.sides[0]; return stat(r, k, sd); }
  sideOf(r) { return this.sides.find(s => s.team.id === r.team) || this.sides[0]; }
  banner(text, color = '#ffffff', glowc = '#46e0ff', dur = 1.4, size = 64, sub = '') { this.banners.push({ text, color, glow: glowc, t: 0, dur, size, sub }); }
  substitute(sd, r, quiet) {
    const i = sd.ro.lineup.indexOf(r); if (i < 0) return r;
    let nr = sd.ro.bench.find(b => b.alive && b.hp > 0);
    if (nr) sd.ro.bench.splice(sd.ro.bench.indexOf(nr), 1); else { sd.scrapN++; nr = scrapBot(sd.team, sd.scrapN); }
    nr.pos = r.pos; nr.battery = 100; r.pos = 'X'; sd.ro.lineup[i] = nr; if (!r.scrap) sd.ro.bench.push(r);
    if (!quiet) this.log.push(`${nr.name} replaces ${r.name}`);
    return nr;
  }
  buildFielders() {
    const sd = this.sides[this.fld];
    this.fielders = sd.ro.lineup.map(r => { const h = FIELD_HOME[r.pos]; return { r, pos: r.pos, x: h[0], y: h[1], hx: h[0], hy: h[1], vx: 0, vy: 0, task: 'home', react: 0, face: 1, anim: 0 }; });
  }
  F(pos) { return this.fielders.find(f => f.pos === pos); }
  fspeed(f) { return 16 + this.st(f.r, 'spd') * 1.35; }
  rspeed(r) { return 18 + this.st(r, 'spd') * 1.5; }
  reach(f) { return 2.6 + this.st(f.r, 'fld') * 0.17; }
  armSpd(f) { return 64 + this.st(f.r, 'arm') * 5.5; }

  // ------------------------------------------------------------ flow
  update(dt) {
    this.time += dt; this.parts.update(dt); this.shake = Math.max(0, this.shake - dt * 2);
    for (const b of this.banners) b.t += dt; this.banners = this.banners.filter(b => b.t < b.dur);
    // smoke from damaged bots
    if (Math.random() < 0.3) for (const e of this.visibleBots()) { const f = e.r.hp / maxHp(e.r, this.sideOf(e.r)); if (f < 0.35 && Math.random() < 0.08) this.parts.add({ x: e.x + rnd(-1, 1), y: e.y, z: 6, vz: 6, vx: rnd(-2, 2), vy: rnd(-2, 2), life: 1.4, size: 1.2, color: '#5a5f6e', kind: 'smoke' }); }
    switch (this.state) {
      case 'intro': this.timer -= dt; if (this.timer <= 0) this.startHalf(); break;
      case 'pitch': this.updatePitch(dt); break;
      case 'play': this.updatePlay(dt); break;
      case 'clash': this.clash.update(dt); if (this.clash.done) this.resolveClash(); break;
      case 'wait': this.timer -= dt; if (this.state === 'wait' && this.view === 'field' && this.fielders.length) this.idleFielders(dt); if (this.timer <= 0) { const f = this.next; this.next = null; f && f(); } break;
      case 'over': break;
    }
    // camera blend
    this.camK = approach(this.camK, this.view === 'field' ? 1 : 0, dt * 1.6);
  }
  wait(sec, fn) { this.state = 'wait'; this.timer = sec; this.next = fn; }
  startHalf() {
    this.outs = 0; this.bases = [null, null, null]; this.balls = 0; this.strikes = 0;
    if (!this.line[this.half][this.inning - 1]) this.line[this.half][this.inning - 1] = 0;
    this.buildFielders(); this.view = 'bat';
    const p = this.pitcher(); p.battery = Math.min(100, p.battery + 30);
    this.banner(`${this.half ? 'BOTTOM' : 'TOP'} ${this.inning}${this.inning > this.innings ? ' · EXTRAS' : ''}`, '#ffffff', this.sides[this.bat].team.g, 1.6, 48, `${this.sides[this.bat].team.city} ${this.sides[this.bat].team.name} AT BAT`);
    this.wait(1.6, () => this.newPitch(true));
  }
  endHalf() {
    // game over checks
    const last = this.inning >= this.innings;
    if (this.half === 0 && last && this.score[1] > this.score[0]) return this.endGame();
    if (this.half === 1 && last && this.score[0] !== this.score[1]) return this.endGame();
    if (this.half === 1 && this.inning >= this.innings + 3) return this.endGame();
    if (this.half === 1) { this.inning++; this.half = 0; } else this.half = 1;
    this.startHalf();
  }
  endGame() {
    this.state = 'over'; this.over = true; this.view = 'field';
    const w = this.score[0] === this.score[1] ? -1 : (this.score[1] > this.score[0] ? 1 : 0);
    this.winner = w;
    this.banner(w < 0 ? 'DRAW' : 'GAME', '#ffffff', w < 0 ? '#ffffff' : this.sides[w].team.g, 3, 72, w < 0 ? '' : `${this.sides[w].team.city} ${this.sides[w].team.name} WIN`);
    Sfx.play('hr');
  }
  checkWalkoff() { if (this.half === 1 && this.inning >= this.innings && this.score[1] > this.score[0]) return true; return false; }

  // ------------------------------------------------------------ pitching & batting
  newPitch(newBatter) {
    if (newBatter) { this.balls = 0; this.strikes = 0; }
    const prev = this.pt; const b = this.batter();
    this.pt = { stage: 'aim', t: 0, type: prev && this.human(this.fld) != null ? prev.type : 0, aimX: 0, aimZ: 2.6, steer: 0, swing: null, shift: newBatter || !prev ? 0 : prev.shift, cpuT: rnd(0.6, 1.2) / (this.cfg.fast ? 4 : 1), result: null, cross: null, hand: b.hand, plan: null, bx: 0, by: 0, bz: 0, catcher: false, hit: false };
    this.view = 'bat'; this.state = 'pitch'; this.buildFielders();
  }
  pitchSpeed(type) { const p = this.pitcher(); const base = 52 + this.st(p, 'vel') * 3.3; const humanBat = this.human(this.bat) != null && this.human(this.fld) == null; return base * PITCHES[type].spd * (0.8 + 0.2 * p.battery / 100) * (humanBat ? [0.82, 1, 1.12][this.diff] : 1); }
  updatePitch(dt) {
    const pt = this.pt, P = this.pad(this.fld), B = this.pad(this.bat), pr = this.pitcher(), bt = this.batter();
    pt.t += dt;
    // batter shifting
    if (B != null) { const ax = Input.axis(B).x; pt.shift = clamp(pt.shift + ax * dt * 3.2, -1, 1); }
    else if (pt.plan) pt.shift = approach(pt.shift, pt.plan.shift, dt * 3);
    // swing input (human)
    if (B != null && !pt.swing && pt.stage !== 'after' && pt.stage !== 'aim') {
      if (Input.hit(B, 'a')) pt.swing = { t0: pt.t, kind: Input.held(B, 'down') ? 'bunt' : 'contact' };
      else if (Input.hit(B, 'b')) pt.swing = { t0: pt.t, kind: 'power' };
      if (pt.swing) Sfx.play(pt.swing.kind === 'bunt' ? 'servo' : 'swing');
    }
    if (pt.stage === 'aim') {
      if (P != null) {
        const a = Input.axis(P); pt.aimX = clamp(pt.aimX + a.x * dt * 2.6, -2.4, 2.4); pt.aimZ = clamp(pt.aimZ + a.y * dt * 2.6, 0.6, 4.8);
        if (Input.hit(P, 'b')) { pt.type = (pt.type + 1) % PITCHES.length; Sfx.play('move'); }
        if (Input.hit(P, 'a')) { if (PITCHES[pt.type].cost > pr.battery) { Sfx.play('buzz'); pt.type = 0; } else this.windup(); }
      } else {
        pt.cpuT -= dt; if (pt.cpuT <= 0) this.cpuChoosePitch(), this.windup();
      }
    } else if (pt.stage === 'windup') {
      if (pt.t >= pt.wt) this.release();
    } else if (pt.stage === 'flight') {
      const u = (pt.t - pt.t0) / pt.T;
      if (P != null && u < 0.8) { const ax = Input.axis(P).x; const ns = clamp(pt.steer + ax * dt * 2.4, -1.5, 1.5); pt.aimX += ns - pt.steer; pt.steer = ns; }
      this.ballAt(Math.min(u, 1));
      if (u >= 1 && !pt.cross) this.crossPlate();
    } else if (pt.stage === 'post') {
      // ball carries to the mitt, or hit ball leaves
      if (pt.hitBall) { this.stepBall(dt); }
      else { const u = (pt.t - pt.t0) / pt.T; if (!pt.catcher) { const k = (u - 1) * pt.T; pt.bx = pt.cross.x + pt.dv.x * k; pt.by = -pt.dv.y * k; pt.bz = pt.cross.z + pt.dv.z * k; if (pt.by <= -3) { pt.by = -3; pt.catcher = true; Sfx.play('mitt'); } } }
      pt.postT -= dt; if (pt.postT <= 0) { const f = pt.after; pt.after = null; f && f(); }
    }
  }
  cpuChoosePitch() {
    const pt = this.pt, pr = this.pitcher(), ahead = this.strikes > this.balls;
    const w = [4, 2, 2, 2, pr.battery > 40 ? 1.2 : 0]; let t = weightedPick(Math.random, w); pt.type = t;
    const ctl = this.st(pr, 'brk') / 10 * this.sk;
    const waste = ahead && Math.random() < 0.35;
    const zx = waste ? pick([-1, 1]) * rnd(1.1, 1.7) : rnd(-0.85, 0.85), zz = waste ? pick([1.0, 4.2]) : rnd(1.8, 3.4);
    pt.aimX = clamp(zx + gauss() * 0.35 * (1.2 - ctl), -2.4, 2.4); pt.aimZ = clamp(zz + gauss() * 0.35 * (1.2 - ctl), 0.6, 4.8);
  }
  windup() { const pt = this.pt; pt.stage = 'windup'; pt.wt = pt.t + 0.6; }
  release() {
    const pt = this.pt, pr = this.pitcher(), bt = this.batter(), ty = PITCHES[pt.type];
    pr.battery = Math.max(0, pr.battery - ty.cost);
    pt.stage = 'flight'; pt.t0 = pt.t; const v = this.pitchSpeed(pt.type); pt.T = 55 / v;
    const bk = 0.6 + this.st(pr, 'brk') * 0.07, hand = pr.hand;
    pt.rel = { x: hand * 1.1, y: 55, z: 6.0 }; pt.brk = { x: -hand * ty.bx * bk, z: ty.bz * bk };
    Sfx.play(ty.wobble ? 'plasma' : 'pitch');
    // CPU batter plan
    if (this.pad(this.bat) == null) {
      const con = this.st(bt, 'con'), pow = this.st(bt, 'pow'), sk = this.human(this.fld) != null ? this.sk : 0.9;
      const fool = ty.wobble ? 1.6 : ty.bz < -0.6 ? 1.35 : 1;
      const err = 0.4 * (1.3 - con / 10) / sk * fool;
      const px = pt.aimX + gauss() * err, pz = pt.aimZ + gauss() * err;
      const inZone = Math.abs(px) < ZONE_X && pz > ZONE_Z0 && pz < ZONE_Z1, near = Math.abs(px) < 1.6 && pz > 1.0 && pz < 4.3;
      let prob = inZone ? 0.82 : near ? 0.3 : 0.05; if (this.strikes === 2) prob += 0.12; if (this.balls === 3) prob -= 0.15; if (ty.wobble) prob -= 0.05;
      const plan = { shift: clamp(px, -1, 1) };
      if (Math.random() < prob) {
        const sdT = 0.075 * (1.35 - con / 10) / sk * (ty.wobble ? 1.5 : 1);
        const bias = ty.name === 'CHANGEUP' ? -0.06 : ty.name === 'CURVE' ? -0.03 : 0;
        plan.swingAt = pt.T - IDEAL + bias + gauss() * sdT; plan.kind = (pow >= 7 && this.strikes < 2 && Math.random() < 0.45) ? 'power' : (this.st(bt, 'spd') >= 8 && Math.random() < 0.06 && this.outs < 2 ? 'bunt' : 'contact');
        if (plan.kind === 'bunt') plan.swingAt = pt.T * 0.3;
      }
      pt.plan = plan;
    }
  }
  ballAt(u) {
    const pt = this.pt, ty = PITCHES[pt.type];
    const ex = pt.aimX - pt.brk.x, ez = pt.aimZ - pt.brk.z;
    pt.bx = lerp(pt.rel.x, ex, u) + pt.brk.x * u * u * u; pt.by = lerp(pt.rel.y, 0, u); pt.bz = lerp(pt.rel.z, ez, u) + pt.brk.z * u * u * u;
    if (ty.wobble) { pt.bx += Math.sin(u * 20) * 0.55 * (1 - u); pt.bz += Math.cos(u * 17) * 0.35 * (1 - u); }
    // CPU swing trigger
    if (pt.plan && pt.plan.swingAt != null && !pt.swing && (pt.t - pt.t0) >= pt.plan.swingAt) { pt.swing = { t0: pt.t, kind: pt.plan.kind }; Sfx.play(pt.plan.kind === 'bunt' ? 'servo' : 'swing'); }
  }
  batterX() { return -this.pt.hand * 2.7 + this.pt.shift; }
  crossPlate() {
    const pt = this.pt, bt = this.batter(), ty = PITCHES[pt.type];
    const x = pt.aimX, z = pt.aimZ; pt.cross = { x, z };
    // velocity at plate for the carry to the mitt
    const e = 0.002; const a = { x: pt.bx, z: pt.bz }; this.ballAt(1 - e); const dv = { x: (a.x - pt.bx) / (e * pt.T), y: 55 / pt.T, z: (a.z - pt.bz) / (e * pt.T) }; this.ballAt(1); pt.bx = x; pt.bz = z; pt.by = 0; pt.dv = dv;
    pt.stage = 'post'; pt.postT = 1.0;
    const sw = pt.swing; const humanBat = this.pad(this.bat) != null;
    const bxp = this.batterX();
    if (sw && sw.t0 <= pt.t + 0.001) {
      const age = pt.t - sw.t0, con = this.st(bt, 'con'), pow = this.st(bt, 'pow');
      const assist = humanBat && this.human(this.fld) == null ? [1.25, 1.06, 0.95][this.diff] : 1;
      const K = { contact: [1.05, 1.15, 0.11], power: [0.8, 0.85, 0.075], bunt: [1.35, 1.0, 0.6] }[sw.kind];
      const cm = (0.82 + con * 0.035) * assist;
      const reach = K[0] * cm, vtol = K[1] * cm, win = K[2] * (0.85 + con * 0.03) * assist;
      const timing = sw.kind === 'bunt' ? 0 : (age - IDEAL) / win, dx = x - pt.shift, dz = z - BAT_Z;
      if (Math.abs(timing) <= 1 && Math.abs(dx) <= reach && Math.abs(dz) <= vtol) {
        const q = clamp(1 - 0.45 * Math.pow(Math.abs(dx) / reach, 1.5) - 0.35 * Math.pow(Math.abs(dz) / vtol, 1.5) - 0.45 * Math.pow(Math.abs(timing), 1.5), 0.05, 1);
        return this.contact(q, timing, dx, dz, sw.kind);
      }
      pt.result = 'whiff'; this.strike(true); return;
    }
    // no swing: hit-by-pitch?
    if (Math.abs(x - bxp) < 0.85 && z > 0.3 && z < 5.6) { pt.result = 'hbp'; return this.hitByPitch(); }
    const strike = Math.abs(x) <= ZONE_X && z >= ZONE_Z0 && z <= ZONE_Z1;
    if (strike) { pt.result = 'strike'; this.strike(false); } else { pt.result = 'ball'; this.ballCall(); }
  }
  strike(swinging) {
    const pt = this.pt; this.strikes++;
    if (this.strikes >= 3) {
      this.banner('STRIKEOUT', '#ffffff', '#ff4a5a', 1.3, 60); this.sides[this.fld].k++;
      pt.after = () => { this.outs++; Sfx.play('out'); this.nextBatter(); };
    } else { this.banner(swinging ? 'SWING & MISS' : 'STRIKE', '#ffffff', '#ffd23d', 0.9, 44); pt.after = () => this.newPitch(false); }
  }
  ballCall() {
    const pt = this.pt; this.balls++;
    if (this.balls >= 4) { this.banner('WALK', '#ffffff', '#3dffa0', 1.1, 54); pt.after = () => { this.forceAdvance(); this.nextBatter(); }; }
    else { this.banner('BALL', '#ffffff', '#3dffa0', 0.8, 40); pt.after = () => this.newPitch(false); }
  }
  hitByPitch() {
    const bt = this.batter(), dmg = rint(8, 16); bt.hp -= dmg; this.shake = 0.5; Sfx.play('hit');
    this.parts.burst(this.batterX(), 0, 4, 24, '#ffb347', 18);
    this.banner('HIT BY PITCH', '#ffffff', '#ff7a2a', 1.2, 48, `-${dmg} ARMOR`);
    this.pt.after = () => { let r = bt; if (bt.hp <= 0) { r = this.destroy(bt, this.sides[this.bat]); } this.forceAdvance(r); this.nextBatter(); };
  }
  forceAdvance(r) { // walk / HBP
    const b = r || this.batter();
    if (this.bases[0]) { if (this.bases[1]) { if (this.bases[2]) { this.scoreRun(this.bases[2]); } this.bases[2] = this.bases[1]; } this.bases[1] = this.bases[0]; }
    this.bases[0] = b;
  }
  scoreRun(r) { this.score[this.bat]++; this.line[this.bat][this.inning - 1] = (this.line[this.bat][this.inning - 1] || 0) + 1; Sfx.play('run'); if (this.playRuns) this.playRuns.push(r); }
  nextBatter() {
    const sd = this.sides[this.bat]; sd.batIdx = (sd.batIdx + 1) % 9;
    if (this.checkWalkoff()) return this.endGame();
    if (this.outs >= 3) return this.wait(0.9, () => this.endHalf());
    this.newPitch(true);
  }
  contact(q, timing, dx, dz, kind) {
    const pt = this.pt, bt = this.batter(), hand = pt.hand, pow = this.st(bt, 'pow');
    Sfx.play('bat'); this.shake = 0.25 + q * 0.3; pt.hit = true;
    let v, th, ph;
    if (kind === 'bunt') { v = rnd(26, 40); th = rnd(-14, 2); ph = rnd(-32, 32); }
    else {
      v = (72 + 96 * q) * (0.8 + 0.045 * pow) * (kind === 'power' ? 1.17 : 1);
      th = 14 + dz * 26 + (kind === 'power' ? 6 : 0) + gauss() * 6 + (1 - q) * gauss() * 14;
      ph = -hand * timing * 42 + hand * dx * 12 + gauss() * 6;
      if (q < 0.14) { ph = pick([-1, 1]) * rnd(60, 110); th = rnd(20, 60); }
    }
    th = clamp(th, -15, 72);
    (this.playLog = this.playLog || []).push({ q: +q.toFixed(2), v: Math.round(v), th: Math.round(th), ph: Math.round(ph), kind });
    const vx = v * Math.cos(th * DEG) * Math.sin(ph * DEG), vy = v * Math.cos(th * DEG) * Math.cos(ph * DEG), vz = v * Math.sin(th * DEG);
    this.parts.burst(pt.cross.x, 0, pt.cross.z, 18, '#bff6ff', 25);
    const foulNow = Math.abs(ph) > 45 && (th < 28 || Math.abs(ph) > 78);
    if (foulNow) {
      pt.hitBall = { x: pt.cross.x, y: 0.2, z: pt.cross.z, vx, vy, vz, bounced: true }; pt.postT = 1.0;
      this.banner('FOUL BALL', '#ffffff', '#ffd23d', 0.9, 44); Sfx.play('foul');
      pt.after = () => { if (this.strikes < 2) this.strikes++; this.newPitch(false); };
      return;
    }
    this.events.plays++;
    pt.postT = 0.05; pt.after = () => this.beginPlay({ x: pt.cross.x, y: 0.4, z: pt.cross.z, vx, vy, vz }, th);
  }
  stepBall(dt) { const b = this.pt.hitBall; b.vz -= 32 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; if (b.z < 0) { b.z = 0; b.vz *= -0.4; } }
  destroy(r, sd) {
    r.alive = false; r.hp = 0; sd.lost++; this.sides[1 - sd.idx].ko++;
    Sfx.play('boom'); this.shake = 1;
    this.banner('DESTROYED', '#ffffff', '#ff3d3d', 1.8, 64, `${r.name} #${r.num} IS SCRAP`);
    const nr = this.substitute(sd, r); this.log.push(`${r.name} destroyed`);
    return nr;
  }

  // ------------------------------------------------------------ live ball
  beginPlay(b, theta) {
    this.state = 'play'; this.view = 'field'; this.maxDist = 0; this.playT = 0; this.stillT = 0; this.playRuns = []; this.thirdOutKind = null; this.hr = false; this.foul = false;
    this.ball = { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, held: null, batted: true, bounced: false, thrown: false, thrower: null, cool: 0, trail: [], rest: false };
    this.launch = theta < 12 ? 'ground' : theta < 24 ? 'liner' : 'fly';
    this.focus = { x: b.x, y: 20 };
    // runners
    this.runners = [];
    const bt = this.batter();
    const occ = [true, !!this.bases[0], !!this.bases[1], !!this.bases[2]];
    const forced = b2 => { for (let k = 0; k < b2; k++) if (!occ[k]) return false; return true; };
    this.runners.push({ r: bt, s: 0, tgt: 1, start: 0, force: 1, needTag: false, out: false, scored: false, isBatter: true, minBase: 1, immune: 0, delay: 0.25 });
    for (let i = 0; i < 3; i++) if (this.bases[i]) {
      const base = i + 1, f = forced(base);
      const tgt = this.launch === 'fly' ? base + 0.42 : base + 1;
      this.runners.push({ r: this.bases[i], s: base, tgt, start: base, force: f ? base + 1 : null, needTag: false, out: false, scored: false, isBatter: false, minBase: f ? base + 1 : base, immune: 0, delay: 0 });
    }
    // fielders react
    for (const f of this.fielders) { f.react = (0.12 + rnd(0.2)) / (this.human(this.fld) != null ? 1 : this.sk); f.task = 'home'; }
    this.chaser = null; this.predict(); this.assignCovers();
    this.ctrlF = null;
  }
  physBall(b, dt, sim) {
    if (b.held) return;
    const sp = hyp(b.vx, b.vy, b.vz), k = b.thrown ? 0.0004 : 0.0022;
    b.vx -= k * sp * b.vx * dt; b.vy -= k * sp * b.vy * dt; b.vz -= (32 + k * sp * b.vz) * dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (b.z <= 0.15 && b.vz < 0) {
      b.z = 0.15;
      if (!sim && !b.bounced) { b.bounced = true; this.onFirstBounce(); }
      if (sim) b.bounced = true;
      if (b.thrown) { b.thrown = false; }
      if (Math.abs(b.vz) > 5) { b.vz = -b.vz * 0.42; b.vx *= 0.75; b.vy *= 0.75; if (!sim && Math.abs(b.vz) > 8) this.parts.burst(b.x, b.y, 0.2, 5, '#c08a5a', 8, { g: 40, size: 0.25 }); }
      else { b.vz = 0; const h = hyp(b.vx, b.vy); if (h > 0) { const nh = Math.max(0, h - 15 * dt); b.vx *= nh / h; b.vy *= nh / h; } }
    }
    // walls
    const r = hyp(b.x, b.y), th = Math.atan2(b.x, b.y);
    if (Math.abs(th) <= P_) {
      const fr = fenceR(th);
      if (r >= fr) {
        if (!sim && b.batted && !b.bounced && b.z > FENCE_H) { if (!this.hr) this.homeRun(); return; }
        if (b.z > FENCE_H + 3 && !sim) { b.vx *= 0.3; b.vy *= 0.3; }
        const nx = Math.sin(th), ny = Math.cos(th), vn = b.vx * nx + b.vy * ny;
        if (vn > 0) { b.vx -= 1.5 * vn * nx; b.vy -= 1.5 * vn * ny; } b.x = nx * (fr - 0.5); b.y = ny * (fr - 0.5);
        if (!sim) { b.batted = false; this.shake = Math.max(this.shake, 0.15); }
      }
    } else {
      const sg = Math.sign(th), nx = sg * Math.SQRT1_2, ny = -Math.SQRT1_2, d = b.x * nx + b.y * ny; // distance outside foul line
      if (d > 55) { const vn = b.vx * nx + b.vy * ny; if (vn > 0) { b.vx -= 1.5 * vn * nx; b.vy -= 1.5 * vn * ny; } b.x -= nx * (d - 55); b.y -= ny * (d - 55); }
    }
    if (b.y < -55) { b.y = -55; b.vy = Math.abs(b.vy) * 0.4; }
  }
  onFirstBounce() {
    const b = this.ball;
    if (b.batted) {
      const th = Math.atan2(b.x, b.y);
      if (Math.abs(th) > P_ + 0.01 && hyp(b.x, b.y) > 3) { this.foulBall(); return; }
      for (const rn of this.runners) if (!rn.out && !rn.scored && rn.tgt % 1 !== 0) rn.tgt = Math.ceil(rn.tgt);
    }
  }
  foulBall() {
    this.foul = true; this.banner('FOUL BALL', '#ffffff', '#ffd23d', 0.9, 44); Sfx.play('foul');
    this.wait(1.0, () => { if (this.strikes < 2) this.strikes++; this.newPitch(false); });
  }
  homeRun() {
    this.hr = true; this.events.hr++; Sfx.play('hr'); this.shake = 0.6;
    const b = this.ball; for (let i = 0; i < 4; i++) setTimeout(() => this.parts.burst(b.x + rnd(-40, 40), b.y + rnd(0, 60), 60 + rnd(40), 40, pick([this.sides[this.bat].team.g, '#ffffff', this.sides[this.bat].team.p]), 50, { g: 12, size: 1.6, drag: 1.5 }), i * 250);
    this.banner('HOME RUN', '#ffffff', this.sides[this.bat].team.g, 2.4, 80, `${this.batter().name} GOES DEEP`);
    b.held = { x: b.x, y: b.y }; b.vx = b.vy = b.vz = 0;
    const scorers = this.runners.filter(r => !r.out && !r.scored).sort((a, c) => c.s - a.s);
    this.sides[this.bat].hits++;
    this.wait(2.6, () => { for (const r of scorers) this.scoreRun(r.r); this.bases = [null, null, null]; this.playRuns = null; this.nextBatter(); });
  }
  predict() {
    const b = this.ball; if (b.held) { this.path = null; return; }
    const c = { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, thrown: b.thrown, batted: b.batted, bounced: b.bounced };
    const path = []; const dt = 1 / 30;
    for (let i = 0; i < 240; i++) { for (let k = 0; k < 2; k++) this.physBall(c, dt / 2, true); path.push({ t: (i + 1) * dt, x: c.x, y: c.y, z: c.z, b: c.bounced }); if (c.vz === 0 && hyp(c.vx, c.vy) < 0.5) break; }
    this.path = path;
    // landing marker
    this.landing = null; if (!b.bounced) { const l = path.find(p => p.z <= 0.3); if (l) this.landing = l; }
    // choose chaser
    let best = null;
    for (const f of this.fielders) {
      const sp = this.fspeed(f), re = this.reach(f);
      for (const p of path) { if (p.z > 7.5) continue; const d = hyp(p.x - f.x, p.y - f.y) - re; if (d <= sp * Math.max(0, p.t - Math.max(0, f.react))) { if (!best || p.t < best.t - 0.05 || (Math.abs(p.t - best.t) < 0.05 && d < best.d)) best = { f, t: p.t, x: p.x, y: p.y, d }; break; } }
    }
    if (!best) { const e = path[path.length - 1]; let bf = null, bd = 1e9; for (const f of this.fielders) { const d = hyp(e.x - f.x, e.y - f.y) / this.fspeed(f); if (d < bd) { bd = d; bf = f; } } best = { f: bf, t: path[path.length - 1].t + bd, x: e.x, y: e.y }; }
    const prev = this.chaser; this.chaser = best.f; this.icpt = best; this.predStamp = this.playT;
    if (prev !== this.chaser) this.assignCovers();
  }
  assignCovers() {
    const ch = this.chaser ? this.chaser.pos : null, bx = this.ball ? this.ball.x : 0;
    const c = {}; c[1] = ch === '1B' ? (ch === 'P' ? '2B' : 'P') : '1B';
    c[2] = ch === 'SS' ? '2B' : ch === '2B' ? 'SS' : (bx > 0 ? 'SS' : '2B');
    c[3] = ch === '3B' ? (c[2] === 'SS' ? 'LF' : 'SS') : '3B';
    c[4] = ch === 'C' ? (c[1] === 'P' ? '3B' : 'P') : 'C';
    if (ch === 'P' && c[1] === 'P') c[1] = '2B';
    this.cover = c;
  }
  coverOf(base) { return this.F(this.cover[base]); }
  updatePlay(dt) {
    this.playT += dt; const b = this.ball;
    if (this.hr || this.foul) return;
    const n = 4; for (let i = 0; i < n; i++) this.physBall(b, dt / n, false);
    if (b.batted) this.maxDist = Math.max(this.maxDist || 0, hyp(b.x, b.y));
    if (this.hr || this.foul) return;
    b.cool -= dt;
    if (!b.held) { b.trail.push([b.x, b.y, b.z]); if (b.trail.length > 10) b.trail.shift(); } else b.trail.length = 0;
    this.predT = (this.predT || 0) - dt; if (!b.held && this.predT <= 0) { this.predT = 0.2; this.predict(); }
    // fielders
    const hum = this.pad(this.fld);
    this.ctrlF = hum != null ? (b.held ? b.held.f || null : (b.thrown ? (this.throwRecv || this.chaser) : this.chaser)) : null;
    for (const f of this.fielders) this.updateFielder(f, dt, f === this.ctrlF ? hum : null);
    // ball follows holder
    if (b.held && b.held.f) { b.x = b.held.f.x; b.y = b.held.f.y; b.z = 4; }
    // catches
    if (!b.held) for (const f of this.fielders) {
      if (b.cool > 0 && f === b.thrower) continue;
      if (f.react > 0 && b.batted) continue;
      const d = hyp(b.x - f.x, b.y - f.y); if (d <= this.reach(f) && b.z <= 7.5) { this.catchBall(f); break; }
    }
    // runners
    this.updateRunners(dt);
    if (this.state !== 'play') return;
    // out checks
    this.checkOuts();
    if (this.state !== 'play') return;
    // CPU holder decisions
    if (b.held && b.held.f && hum == null) this.cpuHolder(b.held.f, dt);
    if (b.held && b.held.f && hum != null) this.humanHolder(b.held.f, hum);
    // end of play
    const moving = this.runners.some(r => !r.out && !r.scored && (r.s !== r.tgt || r.tgt % 1 !== 0 || r.delay > 0));
    if (b.held && !moving) { this.stillT += dt; if (this.stillT > (hum != null ? 0.7 : 0.45)) this.endPlay(); } else this.stillT = 0;
    if (this.playT > 40) this.endPlay();
    // camera focus
    const fx = b.held && b.held.f ? b.held.f.x : b.x, fy = b.held && b.held.f ? b.held.f.y : b.y;
    this.focus.x = lerp(this.focus.x, fx, Math.min(1, dt * 3)); this.focus.y = lerp(this.focus.y, fy, Math.min(1, dt * 3));
  }
  idleFielders(dt) { for (const f of this.fielders) { f.vx *= 0.8; f.vy *= 0.8; f.anim = 0; } }
  moveToward(f, tx, ty, dt, spdMul = 1) {
    const dx = tx - f.x, dy = ty - f.y, d = hyp(dx, dy), sp = this.fspeed(f) * spdMul;
    if (d < 0.4) { f.vx = 0; f.vy = 0; return true; }
    const m = Math.min(d, sp * dt); f.vx = dx / d * sp; f.vy = dy / d * sp; f.x += dx / d * m; f.y += dy / d * m; return false;
  }
  updateFielder(f, dt, hum) {
    const b = this.ball; f.react -= dt;
    if (hum != null) { // human-controlled
      const a = Input.axis(hum); const sp = this.fspeed(f) * 1.05; const l = hyp(a.x, a.y) || 1;
      f.vx = a.x / l * sp * (a.x || a.y ? 1 : 0); f.vy = a.y / l * sp * (a.x || a.y ? 1 : 0); f.x += f.vx * dt; f.y += f.vy * dt;
      f.x = clamp(f.x, -300, 300); f.y = clamp(f.y, -40, 420); return;
    }
    if (f.react > 0 && b.batted) return;
    if (b.held && b.held.f === f) return; // holder handled separately
    let tx = f.hx, ty = f.hy, mul = 1;
    const coverBase = [1, 2, 3, 4].find(k => this.cover && this.cover[k] === f.pos);
    if (!b.held && f === this.chaser && this.icpt) { tx = this.icpt.x; ty = this.icpt.y; if (this.icpt.t < 0.3 || b.thrown) { tx = b.x; ty = b.y; } }
    else if (coverBase) { const B = BASES[coverBase]; const off = coverBase === 4 ? [0, 1.5] : [0, 0]; tx = B.x + off[0]; ty = B.y + off[1]; }
    else if (/LF|CF|RF/.test(f.pos) && !b.held) { tx = lerp(f.hx, b.x, 0.3); ty = lerp(f.hy, b.y, 0.3); mul = 0.7; }
    else if (f.pos === 'P') { tx = f.hx; ty = f.hy - 6; mul = 0.6; }
    this.moveToward(f, tx, ty, dt, mul);
  }
  catchBall(f) {
    const b = this.ball, wasFly = b.batted && !b.bounced;
    // bobble chance on hard batted balls for CPU fielders
    if (b.batted && this.human(this.fld) == null && Math.random() < 0.035 / this.sk - this.st(f.r, 'fld') * 0.002) { b.vx *= -0.3; b.vy *= -0.3; b.vz = 6; b.batted = false; b.cool = 0.4; b.thrower = f; Sfx.play('foul'); this.banner('BOBBLED', '#ffffff', '#ff7a2a', 0.8, 36); return; }
    b.held = { f }; b.vx = b.vy = b.vz = 0; b.thrown = false; b.batted = false; f.gather = 0.18 / this.sk; f.decided = null; this.landing = null;
    Sfx.play('catch'); this.throwRecv = null;
    if (wasFly) {
      const bat = this.runners.find(r => r.isBatter); this.banner('CAUGHT', '#ffffff', '#ff4a5a', 1.0, 48);
      this.markOut(bat, 'fly');
      if (this.state !== 'play') return;
      for (const rn of this.runners) if (!rn.out && !rn.scored && !rn.isBatter) { rn.force = null; rn.minBase = rn.start; if (rn.s > rn.start + 0.001) { rn.needTag = true; rn.tgt = rn.start; } else { rn.tgt = rn.start; } }
    }
  }
  throwTo(f, base) {
    const b = this.ball, B = BASES[base]; let recv = this.coverOf(base);
    if (!recv || recv === f) { let bd = 1e9; for (const g of this.fielders) if (g !== f) { const d = hyp(g.x - B.x, g.y - B.y); if (d < bd) { bd = d; recv = g; } } this.cover[base] = recv.pos; }
    const tx = recv && hyp(recv.x - B.x, recv.y - B.y) < 6 ? recv.x : B.x, ty = recv && hyp(recv.x - B.x, recv.y - B.y) < 6 ? recv.y : B.y;
    const d = hyp(tx - f.x, ty - f.y), sp = this.armSpd(f), T = Math.max(0.15, d / sp);
    b.held = null; b.x = f.x; b.y = f.y; b.z = 5; b.vx = (tx - f.x) / T; b.vy = (ty - f.y) / T; b.vz = (4.5 - 5 + 16 * T * T) / T; b.thrown = true; b.batted = false; b.thrower = f; b.cool = 0.3;
    this.throwRecv = recv; f.throwAnim = 0.3; Sfx.play('throw'); this.predT = 0;
  }
  // ------------------------------------------------------------ outs
  runnerPos(rn) { return basePos(rn.s); }
  checkOuts() {
    const b = this.ball; if (!b.held || !b.held.f) return; const h = b.held.f; if (h.tagCool > this.playT) return;
    for (const rn of this.runners) {
      if (rn.out || rn.scored || rn.immune > this.playT) continue;
      // force at a base
      if (rn.force != null && rn.s < rn.force) { const B = BASES[rn.force]; if (hyp(h.x - B.x, h.y - B.y) < 3.4) { this.outPlay(rn, h, 'force', rn.force, (rn.force - rn.s) * 90); return; } }
      // doubled off
      if (rn.needTag && rn.s > rn.start + 0.001) { const B = BASES[rn.start]; if (hyp(h.x - B.x, h.y - B.y) < 3.4) { this.outPlay(rn, h, 'tag-up', rn.start, (rn.s - rn.start) * 90); return; } }
      // tag between bases
      const off = Math.abs(rn.s - Math.round(rn.s)) * 90; if (off > 2.2 || (rn.force != null && rn.s < rn.force && rn.s % 1 !== 0)) {
        const p = this.runnerPos(rn); if (hyp(h.x - p.x, h.y - p.y) < 3.6) { const dest = rn.tgt >= rn.s ? Math.ceil(rn.s) : Math.floor(rn.s); this.outPlay(rn, h, 'tag', dest, Math.abs(dest - rn.s) * 90); return; }
      }
    }
  }
  outPlay(rn, h, kind, base, distFt) {
    if (this.cfg.clash !== false && distFt < CLOSE_FT) { this.startClash(rn, h, kind, base); return; }
    this.banner('OUT', '#ffffff', '#ff4a5a', 0.9, 54); h.tagCool = this.playT + 0.3; this.markOut(rn, kind);
  }
  markOut(rn, kind) {
    if (rn.out) return; rn.out = true; this.outs++; Sfx.play('out');
    if (rn.isBatter) for (const r of this.runners) { if (!r.isBatter) { r.force = null; if (r.minBase > r.start && r.s < r.minBase) r.minBase = r.start; } }
    if (this.outs >= 3) {
      this.thirdOutKind = kind;
      if ((kind === 'force' || (rn.isBatter && rn.s < 1)) && this.playRuns && this.playRuns.length) { this.score[this.bat] -= this.playRuns.length; this.line[this.bat][this.inning - 1] -= this.playRuns.length; this.banner('NO RUNS', '#ffffff', '#ff4a5a', 1.2, 40, 'THIRD OUT ON A FORCE'); }
      this.state = 'wait'; this.timer = 1.3; this.next = () => { this.endPlay(true); };
    }
  }
  startClash(rn, h, kind, base) {
    this.events.clashes++;
    this.state = 'clash'; this.clashCtx = { rn, h, kind, base };
    const offSide = this.sides[this.bat], defSide = this.sides[this.fld];
    this.clash = new Clash({ match: this, a: { r: rn.r, side: offSide, pad: this.pad(this.bat) }, b: { r: h.r, side: defSide, pad: this.pad(this.fld) }, base, sk: this.sk });
  }
  resolveClash() {
    const { rn, h, kind, base } = this.clashCtx, res = this.clash.result; this.state = 'play';
    const offSide = this.sides[this.bat], defSide = this.sides[this.fld];
    if (res.bDestroyed) { const nr = this.destroy(h.r, defSide); h.r = nr; if (this.ball.held && this.ball.held.f === h) { /* new bot keeps the ball */ } }
    if (res.aDestroyed) { const nr = this.destroy(rn.r, offSide); rn.r = nr; }
    if (res.winner === 'a' && !res.aDestroyed) {
      this.banner('SAFE', '#ffffff', '#3dffa0', 1.0, 58); Sfx.play('safe');
      rn.s = base; rn.tgt = base; if (rn.force != null && base >= rn.force) rn.force = null; if (kind === 'tag-up') rn.needTag = false; rn.immune = this.playT + 2.5; h.tagCool = this.playT + 1.2;
      if (base >= 4) { rn.scored = true; this.scoreRun(rn.r); }
      // runner may be pushed past by others; keep the play alive
    } else {
      this.banner('OUT', '#ffffff', '#ff4a5a', 1.0, 58); this.markOut(rn, kind); h.tagCool = this.playT + 0.3;
    }
    this.clash = null;
  }
  // ------------------------------------------------------------ runners
  updateRunners(dt) {
    const hum = this.pad(this.bat), b = this.ball;
    if (hum != null) {
      if (Input.hit(hum, 'a')) { for (const rn of this.runners) if (!rn.out && !rn.scored && !rn.needTag) { const nxt = Math.min(4, Math.floor(rn.s + 1e-6) + 1); if (nxt > rn.tgt || rn.tgt % 1 !== 0) rn.tgt = Math.max(Math.ceil(rn.tgt - 1e-6), nxt); } Sfx.play('servo'); }
      if (Input.hit(hum, 'b')) { for (const rn of this.runners) if (!rn.out && !rn.scored) { const back = Math.max(rn.minBase, rn.s % 1 === 0 ? rn.s : Math.floor(rn.s)); if (back < rn.tgt) rn.tgt = back; } Sfx.play('servo'); }
    } else this.cpuRunners(dt);
    const live = this.runners.filter(r => !r.out && !r.scored).sort((a, c) => c.s - a.s);
    for (let i = 0; i < live.length; i++) {
      const rn = live[i]; if (rn.delay > 0) { rn.delay -= dt; continue; }
      const v = this.rspeed(rn.r) / 90 * dt;
      if (rn.tgt > rn.s) rn.s = Math.min(rn.tgt, rn.s + v); else if (rn.tgt < rn.s) rn.s = Math.max(rn.tgt, rn.s - v);
      if (i > 0 && !live[i - 1].out) { const lead = live[i - 1]; if (rn.s > lead.s - 0.04 && lead.s < 4) { rn.s = Math.max(rn.s - v, lead.s - 0.04); if (rn.tgt > lead.tgt) rn.tgt = Math.max(Math.floor(rn.s), lead.tgt - 1 > rn.minBase ? lead.tgt - 1 : rn.minBase); } }
      if (rn.force != null && rn.s >= rn.force) rn.force = null;
      if (rn.needTag && rn.s <= rn.start + 1e-6) { rn.needTag = false; }
      if (rn.s >= 4 && !rn.scored) { rn.scored = true; this.scoreRun(rn.r); this.banner('RUN SCORES', '#ffffff', this.sides[this.bat].team.g, 0.9, 34); if (this.checkWalkoff()) { this.wait(1.4, () => this.endGame()); return; } }
    }
  }
  defenseETA(base) {
    const b = this.ball, B = BASES[base];
    if (b.held && b.held.f) { const f = b.held.f; const d = hyp(f.x - B.x, f.y - B.y); return (d < 5 ? d / this.fspeed(f) : d / this.armSpd(f) + 0.35) + (f.gather > 0 ? f.gather : 0); }
    if (this.icpt && this.chaser) { const t = Math.max(0, this.icpt.t - (this.playT - (this.predStamp || 0))); return t + hyp(this.icpt.x - B.x, this.icpt.y - B.y) / this.armSpd(this.chaser) + 0.55; }
    return 3;
  }
  cpuRunners(dt) {
    this.runT = (this.runT || 0) - dt; if (this.runT > 0) return; this.runT = 0.15;
    const b = this.ball, margin = 0.22 / (this.human(this.fld) != null ? this.sk : 0.9);
    const live = this.runners.filter(r => !r.out && !r.scored).sort((a, c) => c.s - a.s);
    for (let i = 0; i < live.length; i++) {
      const rn = live[i], lead = i > 0 ? live[i - 1] : null;
      if (rn.tgt % 1 !== 0 || rn.needTag || rn.delay > 0) continue; // waiting on a fly / tagging
      const tg = rn.tgt; const sp = this.rspeed(rn.r);
      // push on to the next base?
      if (tg < 4 && rn.s > tg - 0.3 && !(lead && Math.ceil(lead.tgt) <= tg + 1)) {
        const tRun = (tg + 1 - rn.s) * 90 / sp, tDef = this.defenseETA(tg + 1);
        if (tDef > tRun + margin) rn.tgt = tg + 1;
      }
      // abort a hopeless advance if not forced
      if (rn.force == null && rn.s < rn.tgt && rn.s % 1 > 0.05 && rn.s % 1 < 0.45) {
        const tRun = (rn.tgt - rn.s) * 90 / sp, tDef = this.defenseETA(rn.tgt);
        if (tDef < tRun - 0.7) rn.tgt = Math.max(rn.minBase, Math.floor(rn.s));
      }
    }
    // tag-up from third after a catch
    for (const rn of live) if (!rn.needTag && rn.s === 3 && rn.tgt === 3 && b.held && this.playT < 8 && !rn.isBatter) { const tDef = this.defenseETA(4); if (tDef > 90 / this.rspeed(rn.r) + 0.3) rn.tgt = 4; }
  }
  // ------------------------------------------------------------ fielder with the ball
  cpuHolder(f, dt) {
    if (f.gather > 0) { f.gather -= dt; return; }
    const plan = this.choosePlay(f);
    if (plan.type === 'throw') { this.throwTo(f, plan.base); return; }
    if (plan.type === 'run') { const B = BASES[plan.base]; this.moveToward(f, B.x, B.y, dt); return; }
    if (plan.type === 'chase') { const p = this.runnerPos(plan.rn); this.moveToward(f, p.x, p.y, dt); return; }
    // nothing: walk toward the infield
    if (hyp(f.x, f.y - 60) > 90) this.moveToward(f, f.x * 0.98, f.y * 0.98, dt, 0.3);
  }
  choosePlay(f) {
    let best = null;
    for (const rn of this.runners) {
      if (rn.out || rn.scored) continue;
      let base = null, forceLike = false;
      if (rn.force != null && rn.s < rn.force) { base = rn.force; forceLike = true; }
      else if (rn.needTag && rn.s > rn.start) { base = rn.start; forceLike = true; }
      else if (rn.s !== rn.tgt || rn.s % 1 !== 0) { base = rn.tgt >= rn.s ? Math.ceil(rn.s - 1e-6 + 0.0001) : Math.floor(rn.s); if (base <= rn.s - 1e-6 && rn.tgt >= rn.s) base = Math.ceil(rn.s); }
      if (base == null || base < 1 || base > 4) continue;
      const B = BASES[base], dB = hyp(f.x - B.x, f.y - B.y);
      const tRun = Math.abs(base - rn.s) * 90 / this.rspeed(rn.r);
      const near = dB < 7, tDef = near ? dB / this.fspeed(f) : dB / this.armSpd(f) + 0.2;
      const margin = tRun - tDef;
      // also consider tagging a runner hung up between bases nearby
      const p = this.runnerPos(rn), dR = hyp(p.x - f.x, p.y - f.y);
      if (!forceLike && dR < 22 && rn.s % 1 !== 0) { const sc = 2 - dR / 22; if (!best || sc > best.score) best = { type: 'chase', rn, score: sc }; }
      if (margin > -0.3) { const sc = margin + base * 0.25 + (forceLike ? 0.4 : 0); if (!best || sc > best.score) best = { type: near ? 'run' : 'throw', base, score: sc }; }
    }
    return best || { type: 'hold' };
  }
  humanHolder(f, pad) {
    if (Input.hit(pad, 'a')) {
      const a = Input.axis(pad); let base = null;
      if (a.y > 0) base = 2; else if (a.x < 0) base = 3; else if (a.x > 0) base = 1; else if (a.y < 0) base = 4;
      if (base == null) { const pl = this.choosePlay(f); base = pl.base || (pl.rn ? Math.ceil(pl.rn.s) : 1); }
      const B = BASES[base]; if (hyp(f.x - B.x, f.y - B.y) > 4) this.throwTo(f, base);
    }
  }
  endPlay(fromOut) {
    if (this.state === 'over') return;
    const bat = this.runners.find(r => r.isBatter);
    const live = this.runners.filter(r => !r.out && !r.scored);
    const nb = [null, null, null];
    for (const rn of live.sort((a, c) => c.s - a.s)) { let s = Math.round(rn.s); if (rn.s % 1 !== 0) s = rn.tgt > rn.s ? Math.ceil(rn.s) : Math.floor(rn.s); s = clamp(s, 1, 3); while (s > 1 && nb[s - 1]) s--; while (nb[s - 1] && s < 3) s++; if (!nb[s - 1]) nb[s - 1] = rn.r; }
    if (this.outs >= 3) { this.bases = [null, null, null]; } else this.bases = nb;
    if (bat && !bat.out && !this.hr) { this.sides[this.bat].hits++; const s = Math.round(bat.s); if (!fromOut) this.banner(['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'INSIDE-THE-PARK'][clamp(s, 1, 4)], '#ffffff', this.sides[this.bat].team.g, 1.0, 46); }
    if (this.playLog && this.playLog.length) { const L = this.playLog[this.playLog.length - 1]; L.res = bat ? (bat.out ? 'out' : 'b' + Math.round(bat.s)) : '?'; L.outs = this.outs; L.runs = (this.playRuns || []).length; L.dist = Math.round(this.maxDist || 0); }
    this.playRuns = null; this.runners = []; this.ball = null; this.landing = null;
    if (this.checkWalkoff()) return this.endGame();
    this.wait(1.0, () => this.nextBatter());
  }
  visibleBots() { const out = []; for (const f of this.fielders) out.push(f); if (this.state === 'play' || (this.state === 'wait' && this.view === 'field')) for (const rn of this.runners) if (!rn.out && !rn.scored) { const p = basePos(rn.s); out.push({ r: rn.r, x: p.x, y: p.y }); } return out; }
}

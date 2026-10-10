// The at-bat / ball-in-play state machine.  Drives both human and CPU
// controlled teams.  Rendering is done by the views; this module only
// updates state and exposes it.
import { SPECIES, PITCHES, SPECIAL_BY_TYPE } from '../data/pokemon.js';
import { BASES, POSITIONS, fenceDistance, isFoulAngle, FENCE_HEIGHT, dist, MOUND } from './field.js';
import { Ball, throwVelocity } from './physics.js';
import { sfx } from '../audio.js';

const DT = 1 / 60;
const PLATE_Z = 1.2;          // z where bat meets ball
const RELEASE = { y: 5.6, z: 54 };
const ZONE = { x: 0.85, yLo: 1.5, yHi: 3.6 };
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2; // ~N(0,1) cheap

export class Play {
  constructor(match, input) {
    this.m = match; this.input = input;
    this.phase = 'intro'; this.timer = 0; this.t = 0;
    this.message = null; this.msgTimer = 0;
    this.ball = new Ball();
    this.events = [];           // transient events for views (e.g. 'crack')
    this.gameTime = 0;
    this.setupFielders();
    this.newAtBat();
  }

  // ------------------------------------------------------------ helpers
  say(text, time = 1.0, big = false) { this.message = { text, big }; this.msgTimer = time; }
  emit(e) { this.events.push(e); }
  humanFor(teamIdx) { const s = this.m.humanSlot(teamIdx); return s >= 0 ? this.input.p(s) : null; }
  get batInput() { return this.humanFor(this.m.battingTeam); }
  get fieldInput() { return this.humanFor(this.m.fieldingTeam); }
  batterSpecies() { return SPECIES[this.m.batter.species]; }
  pitcherSpecies() { return SPECIES[this.m.pitcher.species]; }
  rosterSpecies(teamIdx, slot) { return SPECIES[this.m.teams[teamIdx].roster[slot].species]; }

  // ------------------------------------------------------------ at-bat setup
  setupFielders() {
    const t = this.m.fieldingTeam;
    this.fielders = this.m.teams[t].roster.map((r, slot) => {
      const home = POSITIONS[r.pos];
      return { slot, pos: r.pos, x: home.x, z: home.z, homeX: home.x, homeZ: home.z, tx: home.x, tz: home.z,
        hasBall: false, facing: 1, anim: 0, moving: false, state: 'idle', catchT: 0, throwT: 0 };
    });
    this.activeFielder = this.fielders.findIndex(f => f.pos === 'P');
  }

  newAtBat() {
    const m = this.m;
    this.phase = 'intro'; this.timer = 1.1;
    const b = this.batterSpecies();
    // Handedness: decided by species name hash so it's stable.
    this.handed = (m.batter.species.length % 3 === 0) ? 'L' : 'R';
    this.batterX = 0;            // lateral offset of batter in the box (-1..1 ft)
    this.swing = null; this.batAnim = 'bat_stance'; this.batAnimT = 0;
    this.pitchAnim = 'pitch_set'; this.pitchAnimT = 0;
    const ps = this.pitcherSpecies();
    const special = SPECIAL_BY_TYPE[ps.type];
    this.pitchTypes = ['fastball', 'curve', 'slider', 'changeup', special];
    this.pitchSel = 0;
    this.aim = { x: rand(-0.5, 0.5), y: rand(2.0, 3.0) };
    this.pitch = null;
    this.cpuPitchTimer = rand(0.8, 1.8);
    this.cpuBat = null;
    this.runners = [];
    this.ball.reset();
    this.playResult = null;
    this.outsThisPlay = 0;
    this.fieldView = false;
    this.setupFielders();
    this.say(`${b.name.toUpperCase()} AT BAT`, 1.1);
    this.emit('atbat');
  }

  // ------------------------------------------------------------ main update
  update() {
    this.t += DT; this.gameTime += DT;
    if (this.msgTimer > 0) { this.msgTimer -= DT; if (this.msgTimer <= 0) this.message = null; }
    switch (this.phase) {
      case 'intro': this.timer -= DT; if (this.timer <= 0) this.phase = 'pitching'; this.updateBatterMove(); break;
      case 'pitching': this.updatePitching(); break;
      case 'windup': this.updateWindup(); break;
      case 'flight': this.updateFlight(); break;
      case 'callout': this.updateCallout(); break;
      case 'inplay': this.updateInPlay(); break;
      case 'playover': this.updatePlayOver(); break;
      case 'homerun': this.updateHomerun(); break;
      case 'sidechange': this.timer -= DT; if (this.timer <= 0) this.newAtBat(); break;
      case 'gameover': break;
    }
    // animations
    this.batAnimT += DT; this.pitchAnimT += DT;
  }

  // ------------------------------------------------------------ batter movement (pre-pitch and in flight)
  updateBatterMove() {
    const inp = this.batInput;
    if (inp) {
      const dir = (inp.down.left ? -1 : 0) + (inp.down.right ? 1 : 0);
      // Screen-left = +x (first base side) from the pitcher's view.
      this.batterX = clamp(this.batterX - dir * 2.2 * DT, -1.0, 1.0);
    }
  }

  // ------------------------------------------------------------ pitching
  updatePitching() {
    const m = this.m;
    this.updateBatterMove();
    const inp = this.fieldInput;
    if (inp) {
      const spd = 2.4 * DT;
      if (inp.down.left) this.aim.x += spd;   // screen left = +x
      if (inp.down.right) this.aim.x -= spd;
      if (inp.down.up) this.aim.y += spd;
      if (inp.down.down) this.aim.y -= spd;
      this.aim.x = clamp(this.aim.x, -1.6, 1.6); this.aim.y = clamp(this.aim.y, 0.8, 4.4);
      if (inp.pressed.b) { this.pitchSel = (this.pitchSel + 1) % this.pitchTypes.length; sfx.menuMove(); }
      if (inp.pressed.a) this.startWindup();
    } else {
      this.cpuPitchTimer -= DT;
      if (this.cpuPitchTimer <= 0) { this.cpuChoosePitch(); this.startWindup(); }
    }
    // CPU batter drifts toward the middle of the box
    if (!this.batInput) this.batterX += (0 - this.batterX) * 0.02;
  }

  cpuChoosePitch() {
    const m = this.m, ps = this.pitcherSpecies();
    const stamina = m.stamina[m.fieldingTeam];
    const w = [3, 2, 2, 2, stamina > 40 ? 1.2 : 0.2];
    if (m.strikes === 2) { w[1] += 1.5; w[2] += 1; }
    if (m.balls === 3) { w[0] += 3; }
    let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
    while (r > w[i]) { r -= w[i]; i++; }
    this.pitchSel = Math.min(i, 4);
    // Aim: corners when ahead, middle when behind.
    const edge = m.balls < m.strikes ? 0.9 : 0.5;
    this.aim.x = clamp(rand(-edge, edge), -1.2, 1.2);
    this.aim.y = clamp(rand(ZONE.yLo + 0.2, ZONE.yHi - 0.2) + (m.balls < m.strikes ? rand(-0.7, 0.7) : 0), 1.0, 4.2);
    this.cpuSteer = rand(-1, 1) * 0.6;
  }

  startWindup() {
    this.phase = 'windup'; this.timer = 0.55;
    this.pitchAnim = 'pitch_windup'; this.pitchAnimT = 0;
    // Pitch-type text visible to the human pitcher; batter decides blind.
  }

  updateWindup() {
    this.updateBatterMove();
    this.timer -= DT;
    if (this.timer <= 0) this.releasePitch();
  }

  releasePitch() {
    const m = this.m, ps = this.pitcherSpecies();
    const type = this.pitchTypes[this.pitchSel];
    const def = PITCHES[type];
    const stamina = m.stamina[m.fieldingTeam];
    const fatigue = stamina < 30 ? 0.86 : stamina < 60 ? 0.94 : 1.0;
    const veloF = (0.82 + ps.pitch.velo * 0.0034) * fatigue;
    const speed = 92 * def.speed * veloF;              // ft/s
    const controlErr = (0.36 + (1 - ps.pitch.control / 100) * 0.55) * (stamina < 30 ? 1.5 : stamina < 60 ? 1.15 : 1.0);
    const ex = gauss() * controlErr, ey = gauss() * controlErr;
    const tx = this.aim.x + ex, ty = this.aim.y + ey;
    const t = (RELEASE.z - PLATE_Z) / speed;
    const brk = 0.7 + ps.pitch.breakAmt * 0.006;
    const dx = def.dx * brk * (this.pitcherHand === 'L' ? -1 : 1), dy = def.dy * brk;
    const x0 = (this.pitcherHand === 'L' ? 1.4 : -1.4);
    this.pitch = {
      type, def, t: 0, tTotal: t, speed,
      x: x0, y: RELEASE.y, z: RELEASE.z,
      // Velocity so that without break the ball reaches (tx,ty) at the plate.
      vx: (tx - x0) / t, vy: (ty - RELEASE.y) / t, vz: -speed,
      ax: 2 * dx / (t * t), ay: 2 * dy / (t * t), wobble: def.wobble,
      steer: 0, startX: x0, targetX: tx, targetY: ty, dx, dy,
      crossed: false, passedBat: false,
    };
    // break is applied as acceleration so compensate aim so the pitch *ends* near target.
    this.pitch.vx -= dx / t; this.pitch.vy -= dy / t;
    m.stamina[m.fieldingTeam] = Math.max(0, stamina - def.stamina * (1.4 - ps.pitch.stamina * 0.008));
    m.pitchCount[m.fieldingTeam]++;
    this.pitchAnim = 'pitch_release'; this.pitchAnimT = 0;
    this.phase = 'flight';
    this.swing = null;
    sfx.pitch();
    if (!this.batInput) this.cpuPlanSwing();
  }

  get pitcherHand() { return (this.m.pitcher.species.length % 2 === 0) ? 'R' : 'L'; }

  cpuPlanSwing() {
    const m = this.m, bs = this.batterSpecies(), p = this.pitch;
    // Predict final location with some perception noise.
    const noise = 0.55 - bs.contact * 0.004;
    const fx = p.targetX + gauss() * noise, fy = p.targetY + gauss() * noise;
    const inZone = Math.abs(fx) < ZONE.x + 0.15 && fy > ZONE.yLo - 0.15 && fy < ZONE.yHi + 0.15;
    const nearZone = Math.abs(fx) < ZONE.x + 0.6 && fy > ZONE.yLo - 0.5 && fy < ZONE.yHi + 0.5;
    let pSwing = inZone ? 0.8 : nearZone ? 0.42 : 0.1;
    if (m.strikes === 2) pSwing = inZone ? 0.95 : nearZone ? 0.6 : 0.15;
    if (m.balls === 3 && m.strikes < 2) pSwing *= 0.7;
    const swing = Math.random() < pSwing;
    const sigma = 0.092 - bs.contact * 0.0005;
    const err = gauss() * sigma;
    const power = Math.random() < bs.power / 160;
    this.cpuBat = {
      swing, power,
      // schedule the swing so the bat arrives when the ball is at the plate
      swingAt: p.tTotal - (power ? 0.2 : 0.13) + err,
      moveTo: clamp(fx * 0.9 + gauss() * 0.35, -1, 1),
    };
  }

  // ------------------------------------------------------------ pitch flight
  updateFlight() {
    const p = this.pitch, m = this.m;
    // steering by pitcher (KGJ-style mid-flight control)
    const finp = this.fieldInput;
    let steer = 0;
    if (finp) steer = (finp.down.left ? 1 : 0) + (finp.down.right ? -1 : 0);
    else steer = this.cpuSteer || 0;
    const ps = this.pitcherSpecies();
    const steerAcc = 7 + ps.pitch.breakAmt * 0.06;
    let ax = p.ax + steer * steerAcc;
    if (p.wobble) ax += Math.sin(p.t * 40) * p.wobble * 30;
    p.vx += ax * DT; p.vy += p.ay * DT;
    p.x += p.vx * DT; p.y += p.vy * DT; p.z += p.vz * DT;
    p.t += DT;
    // batter movement & swing input
    this.updateBatterMove();
    const binp = this.batInput;
    if (binp) {
      if (!this.swing) {
        if (binp.pressed.a) this.startSwing(binp.down.down ? 'bunt' : 'normal');
        else if (binp.pressed.b) this.startSwing('power');
      }
    } else if (this.cpuBat) {
      const cb = this.cpuBat;
      this.batterX += (cb.moveTo - this.batterX) * 0.08;
      if (cb.swing && !this.swing && p.t >= cb.swingAt) this.startSwing(cb.power ? 'power' : 'normal');
    }
    if (this.swing && !this.swing.done) {
      this.swing.t += DT;
      if (this.swing.t >= this.swing.contactAt) { this.swing.done = true; this.resolveSwing(); if (this.phase !== 'flight') return; }
    }
    if (p.z <= -2.5) {
      // Ball reached the catcher.
      const inZone = Math.abs(p.x) < ZONE.x && p.y > ZONE.yLo && p.y < ZONE.yHi;
      // location sampled at the plate
      if (this.swing) this.callPitch('swing-miss');
      else this.callPitch(inZone ? 'strike' : 'ball');
    }
  }

  startSwing(type) {
    const delays = { normal: 0.13, power: 0.2, bunt: 0.06 };
    this.swing = { type, t: 0, contactAt: delays[type], done: false };
    this.batAnim = type === 'bunt' ? 'bat_swing' : 'bat_load'; this.batAnimT = 0;
    sfx.swing();
  }

  resolveSwing() {
    const p = this.pitch, bs = this.batterSpecies(), m = this.m;
    this.batAnim = 'bat_swing'; this.batAnimT = 0;
    // Where is the ball relative to the hitting plane?
    const e = (p.z - PLATE_Z) / (-p.vz);       // seconds until ball reaches plane; >0 early swing, <0 late
    const win = 0.04 + bs.contact * 0.0005;     // timing window (0.06-0.09 s)
    const reach = 0.85 + bs.contact * 0.005;    // half-width of bat coverage
    const batCentre = this.batterX * 0.9 + (this.handed === 'R' ? 0.15 : -0.15);
    const hOff = p.x - batCentre;
    const planeY = this.swing.type === 'bunt' ? p.y : 2.5 + (this.swing.type === 'power' ? -0.2 : 0);
    const vOff = p.y - planeY;
    const vReach = this.swing.type === 'bunt' ? 2.4 : 1.7;
    const timingOk = Math.abs(e) < (this.swing.type === 'bunt' ? win * 2.2 : win * 1.3);  // outer 30% = foul territory
    const hOk = Math.abs(hOff) < reach * (this.swing.type === 'bunt' ? 1.3 : 1);
    const vOk = Math.abs(vOff) < vReach;
    if (!(timingOk && hOk && vOk)) return; // whiff; flight continues to the catcher
    // ----- contact!
    let q = 1 - 0.55 * Math.abs(e) / win - 0.35 * Math.abs(hOff) / reach - 0.25 * Math.abs(vOff) / vReach;
    q = clamp(q + rand(-0.05, 0.1), 0.3, 1.05);
    const typeMul = { normal: 1.0, power: 1.17, bunt: 0.2 }[this.swing.type];
    const pitchBonus = clamp((p.speed - 70) / 60, 0, 0.5) * 0.15; // faster pitch, harder hit
    const q2 = 0.55 + 0.5 * q;                       // 0.7 .. 1.08
    let exit = Math.min(170, (88 + bs.power * 0.62) * q2 * typeMul * (1 + pitchBonus));
    let la = 11 + vOff * 17 + (this.swing.type === 'power' ? 9 : 0) + rand(-7, 7);
    if (q < 0.55) la += rand(-25, 30);              // mishit: pop-up or chopper
    if (this.swing.type === 'bunt') { la = rand(-10, 8); exit = rand(18, 32); }
    const sign = this.handed === 'R' ? -1 : 1;      // RHB pulls to -x (left field)
    let spray = sign * (e / win) * 60 + gauss() * 6 + hOff * sign * -10 + (this.swing.type === 'bunt' ? rand(-20, 20) : 0);
    spray = clamp(spray, -80, 80);
    this.ball.launch(p.x, Math.max(0.5, p.y), PLATE_Z, exit, la, spray);
    this.ball.drag = 0.0016;
    this.contact = { q, exit, la, spray, type: this.swing.type };
    sfx.crack(this.swing.type === 'bunt' ? 0.3 : Math.min(1, q + 0.2));
    this.emit('crack');
    this.beginInPlay();
  }

  callPitch(kind) {
    const m = this.m;
    let text, res;
    if (kind === 'swing-miss' || kind === 'strike') {
      res = m.addStrike();
      text = res === 'strikeout' ? 'STRIKE THREE!' : (kind === 'swing-miss' ? 'SWING AND A MISS' : 'STRIKE');
      sfx.strike();
      if (res === 'strikeout') { this.playResult = 'strikeout'; sfx.out(); }
    } else {
      res = m.addBall();
      text = res === 'walk' ? 'BALL FOUR - WALK' : 'BALL';
      sfx.ball();
      if (res === 'walk') this.playResult = 'walk';
    }
    this.callResult = res;
    this.say(text, 1.0, res === 'strikeout' || res === 'walk');
    this.phase = 'callout'; this.timer = res === 'strikeout' || res === 'walk' ? 1.5 : 0.9;
    this.pitchAnim = 'pitch_set';
    if (this.swing) { this.batAnim = 'bat_follow'; this.batAnimT = 0; }
  }

  updateCallout() {
    this.timer -= DT;
    if (this.timer > 0) return;
    this.afterPlay();
  }

  /** After the at-bat / play is fully resolved: next batter, side change or game over. */
  afterPlay() {
    const m = this.m;
    const change = m.checkSideChange();
    if (change === 'over') { this.phase = 'gameover'; this.say('GAME OVER', 999, true); sfx.win(); this.emit('gameover'); return; }
    if (change === 'inning') { this.phase = 'sidechange'; this.timer = 2.2; this.say('CHANGE SIDES', 2.2, true); sfx.inning(); this.emit('sidechange'); return; }
    this.newAtBat();
  }

  // ------------------------------------------------------------ ball in play
  beginInPlay() {
    const m = this.m, t = m.battingTeam;
    this.phase = 'inplay'; this.fieldView = true; this.inPlayT = 0;
    this.pitch = null;
    this.foul = false; this.caught = false; this.dead = false; this.holdTimer = 0;
    this.batAnim = 'bat_follow';
    // runners
    this.runners = [];
    for (let b = 1; b <= 3; b++) {
      const slot = m.runners[b - 1];
      if (slot !== null) this.runners.push(this.makeRunner(slot, b, false));
    }
    this.runners.push(this.makeRunner(m.batterIdx[t], 0, true));
    m.batterStats().ab++;
    // set forces
    this.updateForces();
    // initial running decisions
    const grounder = this.ball.vy < 12 || this.contact.la < 12;
    for (const r of this.runners) {
      if (r.isBatter || r.forced || grounder) this.sendRunner(r, r.at + 1);
      else r.state = 'on';
    }
    this.cpuRunDecided = false;
    this.lastFielderTouch = null;
    this.throwing = null;
    // fielders need a moment to read the ball, and misjudge it a little
    const hang = Math.max(0.4, this.ball.predictLanding(0).t);
    this.landNoise = { x: gauss() * 9, z: gauss() * 9, hang };
    for (const f of this.fielders) f.reaction = 0.2 + Math.random() * 0.2;
    this.ballHolder = -1;
    this.catchFlash = 0;
    this.hitBase = 0;
  }

  makeRunner(slot, base, isBatter) {
    const sp = this.rosterSpecies(this.m.battingTeam, slot);
    const b = BASES[base];
    return { slot, at: base, to: base, x: b.x, z: b.z, state: 'on', isBatter, forced: false,
      speed: 18 + sp.speed * 0.1, anim: 0, facing: 1, progress: 0 };
  }

  updateForces() {
    const live = this.runners.filter(r => r.state !== 'out' && r.state !== 'scored');
    const occ = b => live.some(r => r.at === b);
    for (const r of this.runners) {
      r.forced = r.at === 0 || (r.at === 1 && occ(0)) || (r.at === 2 && occ(1) && occ(0)) ||
        (r.at === 3 && occ(2) && occ(1) && occ(0));
    }
  }

  sendRunner(r, toBase) {
    if (r.state === 'out' || r.state === 'scored') return;
    if (toBase > 4) return;
    r.to = Math.min(4, toBase); r.state = 'run';
  }

  updateInPlay() {
    const m = this.m;
    this.inPlayT += DT;
    const ball = this.ball;
    // --- ball
    if (!this.ballHeld()) {
      const bounced = ball.step(DT);
      if (bounced && ball.bounces === 1) {
        if (!this.foulDecided) {
          this.foulDecided = true;
          if (isFoulAngle(ball.x, ball.z)) { this.foulBall(); return; }
          else this.fair = true;
        }
        sfx.bounce();
      }
      if (ball.bounces === 1 && !this.foulDecided) this.foulDecided = true;
      // fence
      const fd = fenceDistance(ball.x, ball.z);
      const bd = Math.hypot(ball.x, ball.z);
      if (bd >= fd) {
        if (ball.airborne && ball.y > FENCE_HEIGHT && !isFoulAngle(ball.x, ball.z)) { this.homeRun(); return; }
        // hit the wall: reflect inward
        const nx = ball.x / bd, nz = ball.z / bd;
        const dot = ball.vx * nx + ball.vz * nz;
        if (dot > 0) { ball.vx -= 1.6 * dot * nx; ball.vz -= 1.6 * dot * nz; ball.vx *= 0.5; ball.vz *= 0.5; }
        ball.x = nx * (fd - 0.5); ball.z = nz * (fd - 0.5);
        ball.airborne = false; ball.rolling = ball.y <= 0.1;
        if (ball.airborne === false && ball.y <= 0.1 && !this.foulDecided) { this.foulDecided = true; this.fair = true; }
      }
      // foul ball that goes out of play behind the plate/stands
      if (ball.z < -60 || Math.abs(ball.x) > ball.z + 90) { this.foulBall(); return; }
    }
    // --- fielders
    this.updateFielders();
    // --- runners
    this.updateRunners();
    // --- end of play?
    this.checkPlayEnd();
  }

  ballHeld() { return this.ballHolder >= 0; }

  foulBall() {
    this.dead = true;
    this.m.addFoul();
    this.m.batterStats().ab--;
    this.playResult = 'foul';
    this.say('FOUL BALL', 1.2);
    sfx.foul();
    this.phase = 'playover'; this.timer = 1.3;
  }

  homeRun() {
    const m = this.m;
    this.phase = 'homerun'; this.timer = 3.2;
    this.ball.stopped = true;
    const n = this.runners.filter(r => r.state !== 'out' && r.state !== 'scored').length;
    const txt = n === 4 ? 'GRAND SLAM!!' : 'HOME RUN!';
    this.say(txt, 3.2, true);
    sfx.homer();
    this.emit('homerun');
    for (const r of this.runners) if (r.state !== 'out') { r.state = 'scored'; m.scoreRun(r.slot, true); }
    m.batterStats().h++; m.batterStats().hr++; m.hits[m.battingTeam]++;
    this.playResult = 'homerun';
    this.hitBase = 4;
    m.runners = [null, null, null];
  }

  updateHomerun() {
    this.timer -= DT;
    if (this.timer <= 0) { this.m.nextBatter(); this.afterPlay(); }
  }

  // ------------------------------------------------------------ fielders
  fielderSpeed(f) { const sp = this.rosterSpecies(this.m.fieldingTeam, f.slot); return 17 + sp.speed * 0.11; }
  catchRadius(f) { const sp = this.rosterSpecies(this.m.fieldingTeam, f.slot); return 2.6 + sp.glove * 0.02; }
  armSpeed(f) { const sp = this.rosterSpecies(this.m.fieldingTeam, f.slot); return 85 + sp.arm * 0.7; }

  /** Predicted landing spot, with the fielders' misjudgement that fades as the ball comes down. */
  landingGuess() {
    const ball = this.ball;
    const land = ball.predictLanding(6);
    if (this.landNoise && ball.airborne) {
      const k = Math.max(0, 1 - (this.inPlayT || 0) / Math.max(0.3, this.landNoise.hang - 0.4));
      land.x += this.landNoise.x * k; land.z += this.landNoise.z * k;
    }
    return land;
  }

  /** Earliest point where fielder f can meet a ball on the ground (or a low liner). */
  intercept(f) {
    const ball = this.ball, spd = this.fielderSpeed(f);
    const b = Object.assign(new Ball(), ball);
    let t = 0;
    for (let i = 0; i < 240; i++) {
      if (dist(f.x, f.z, b.x, b.z) <= spd * t + 1.5 && b.y < 8) return { x: b.x, z: b.z, t };
      if (b.stopped) break;
      for (let k = 0; k < 2; k++) b.step(1 / 60);
      t += 2 / 60;
    }
    return { x: b.x, z: b.z, t: t + dist(f.x, f.z, b.x, b.z) / spd };
  }

  nearestFielderToBall() {
    const ball = this.ball;
    const land = ball.airborne ? this.landingGuess() : { x: ball.x, z: ball.z, t: 0 };
    let best = -1, bestT = 1e9, bestPt = land;
    for (const f of this.fielders) {
      if (f.pos === 'C' && land.z > 20) continue;
      let t, pt;
      if (ball.airborne && land.t > 0.3) { pt = land; t = Math.max(land.t, dist(f.x, f.z, land.x, land.z) / this.fielderSpeed(f)); }
      else { pt = this.intercept(f); t = pt.t; }
      if (t < bestT) { bestT = t; best = this.fielders.indexOf(f); bestPt = pt; }
    }
    return { idx: best, land: bestPt, eta: bestT };
  }

  updateFielders() {
    const m = this.m, ball = this.ball;
    const finp = this.fieldInput;
    const chase = this.nearestFielderToBall();
    if (!this.ballHeld() && !this.throwing) this.activeFielder = chase.idx;
    const coverers = this.assignCoverage(chase.idx);
    for (let i = 0; i < this.fielders.length; i++) {
      const f = this.fielders[i];
      f.moving = false;
      const spd = this.fielderSpeed(f);
      const isActive = i === this.activeFielder && finp;
      if (isActive && !f.hasBall) {
        // Human controls the chaser directly.
        let dx = (finp.down.left ? -1 : 0) + (finp.down.right ? 1 : 0);
        let dz = (finp.down.up ? 1 : 0) + (finp.down.down ? -1 : 0);
        if (dx || dz) { const l = Math.hypot(dx, dz); f.x += dx / l * spd * DT; f.z += dz / l * spd * DT; f.moving = true; if (dx) f.facing = dx; }
      } else if (isActive && f.hasBall) {
        // Human holding the ball: move, or throw with direction + A.
        let dx = (finp.down.left ? -1 : 0) + (finp.down.right ? 1 : 0);
        let dz = (finp.down.up ? 1 : 0) + (finp.down.down ? -1 : 0);
        if (finp.pressed.a) {
          const base = finp.down.up ? 2 : finp.down.left ? 3 : finp.down.right ? 1 : finp.down.down ? 0 : this.defaultThrowBase(f);
          this.throwTo(i, base);
        } else if (dx || dz) { const l = Math.hypot(dx, dz); f.x += dx / l * spd * 0.8 * DT; f.z += dz / l * spd * 0.8 * DT; f.moving = true; if (dx) f.facing = dx; }
      } else {
        // AI movement
        let tx = f.homeX, tz = f.homeZ;
        if (i === chase.idx && !this.ballHeld() && !this.throwing) {
          // chase the ball: run to where we can meet it
          if (f.reaction > 0) { f.reaction -= DT; tx = f.x; tz = f.z; }
          else { tx = chase.land.x; tz = chase.land.z; }
        } else if (i === chase.idx && this.throwing && this.throwing.to === i) {
          // waiting for the throw - stand still on the base
          tx = f.tx; tz = f.tz;
        } else if (coverers[i] !== undefined) {
          const b = BASES[coverers[i]]; tx = b.x; tz = b.z;
        } else if (f.pos === 'LF' || f.pos === 'CF' || f.pos === 'RF') {
          // back up toward the ball a little
          tx = f.homeX + (ball.x - f.homeX) * 0.25; tz = f.homeZ + (ball.z - f.homeZ) * 0.25;
        }
        if (f.hasBall && !finp) this.cpuThrowDecision(i);
        if (f.hasBall && i === this.activeFielder) { tx = f.x; tz = f.z; }
        const dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz);
        if (d > 1.0) { const s = Math.min(d, spd * DT); f.x += dx / d * s; f.z += dz / d * s; f.moving = true; if (Math.abs(dx) > 0.5) f.facing = Math.sign(dx); }
      }
      f.tx = f.x; f.tz = f.z;
      if (f.moving) f.anim += DT; else f.anim = 0;
      if (f.catchT > 0) f.catchT -= DT;
      if (f.throwT > 0) f.throwT -= DT;
      // catching
      if (!this.ballHeld() && !f.hasBall && !this.dead) {
        const d = dist(f.x, f.z, ball.x, ball.z);
        const reach = ball.airborne ? 8 : 6;
        if (d < this.catchRadius(f) && ball.y < reach && (!this.throwing || this.throwing.t > 0.12 || this.throwing.from !== i)) this.catchBall(i);
      }
    }
    if (this.throwing) {
      this.throwing.t += DT;
      // if a throw lands without anyone catching it, it just becomes a loose ball
      if (ball.stopped || ball.rolling) this.throwing = null;
    }
    if (this.catchFlash > 0) this.catchFlash -= DT;
  }

  /** Which fielder covers which base (index -> base). */
  assignCoverage(chaser) {
    const cov = {};
    const byPos = {}; this.fielders.forEach((f, i) => byPos[f.pos] = i);
    const assign = (base, prefs) => { for (const p of prefs) { const i = byPos[p]; if (i !== chaser && cov[i] === undefined) { cov[i] = base; return; } } };
    assign(1, ['1B', 'P', '2B']);
    assign(2, ['2B', 'SS']);
    assign(3, ['3B', 'SS', 'P']);
    assign(0, ['C', 'P']);
    return cov;
  }

  catchBall(i) {
    const f = this.fielders[i], ball = this.ball;
    const wasAir = ball.airborne && !this.throwing;
    const wasThrow = !!this.throwing;
    f.hasBall = true; this.ballHolder = i; this.activeFielder = i;
    f.catchT = 0.35; this.catchFlash = 0.3;
    ball.x = f.x; ball.z = f.z; ball.y = 4; ball.vx = ball.vy = ball.vz = 0; ball.rolling = false; ball.airborne = false; ball.stopped = true;
    sfx.glove();
    this.lastFielderTouch = i;
    this.throwing = null;
    if (wasAir && !this.caught) {
      // Fly out!
      this.caught = true;
      const batter = this.runners.find(r => r.isBatter);
      if (batter && batter.state !== 'out') { this.runnerOut(batter, 'FLY OUT'); }
      if (!this.fair && !this.foulDecided && isFoulAngle(ball.x, ball.z)) this.say('FOUL OUT', 1.0);
      this.foulDecided = true; this.fair = true;
      // tag-up rule: runners who left early go back
      for (const r of this.runners) if (!r.isBatter && r.state === 'run') { r.to = r.at; r.state = 'back'; }
      this.updateForces();
      this.cpuRunDecided = false;
      return;
    }
    // Force / tag outs at a base
    this.checkOutsAt(i);
  }

  /** Check for force plays and tags when fielder i holds the ball. */
  checkOutsAt(i) {
    const f = this.fielders[i];
    for (let b = 0; b <= 4; b++) {
      const base = BASES[b % 4];
      if (dist(f.x, f.z, base.x, base.z) > 3.2) continue;
      for (const r of this.runners) {
        if (r.state === 'run' && r.to === b && r.forced && r.progress < 0.97) this.runnerOut(r, b === 1 ? 'OUT AT FIRST' : 'FORCE OUT');
        if (r.state === 'back' && r.to === b && this.caught && r.progress < 0.97 && !r.isBatter) this.runnerOut(r, 'DOUBLED OFF');
      }
    }
    // tags: runner off a base within reach
    for (const r of this.runners) {
      if ((r.state === 'run' || r.state === 'back') && dist(f.x, f.z, r.x, r.z) < 2.4) {
        const onBase = [0, 1, 2, 3].some(b => dist(r.x, r.z, BASES[b].x, BASES[b].z) < 1.5);
        if (!onBase) this.runnerOut(r, 'TAGGED OUT');
      }
    }
    this.updateForces();
  }

  runnerOut(r, text) {
    if (r.state === 'out') return;
    r.state = 'out';
    this.m.recordOut(); this.outsThisPlay++;
    this.say(text, 1.0);
    sfx.out();
    this.emit('out');
    this.updateForces();
  }

  defaultThrowBase(f) {
    // nearest base with a runner heading to it, else first base
    let best = 1, bestD = 1e9;
    for (const r of this.runners) if (r.state === 'run') {
      const b = BASES[r.to % 4]; const d = dist(f.x, f.z, b.x, b.z);
      if (d < bestD) { bestD = d; best = r.to; }
    }
    return best;
  }

  throwTo(i, base) {
    const f = this.fielders[i];
    const target = BASES[base % 4];
    const d = dist(f.x, f.z, target.x, target.z);
    if (d < 2.5) { // already there: just step on the base
      this.checkOutsAt(i); return;
    }
    const sp = this.armSpeed(f);
    const v = throwVelocity(f.x, 4.5, f.z, target.x, 3.5, target.z, sp);
    const ball = this.ball;
    ball.x = f.x; ball.y = 4.5; ball.z = f.z; ball.vx = v.vx; ball.vy = v.vy; ball.vz = v.vz;
    ball.stopped = false; ball.rolling = false; ball.airborne = false; ball.bounces = 1; ball.drag = 0.001;
    f.hasBall = false; f.throwT = 0.3; this.ballHolder = -1;
    // find who will receive: fielder closest to that base
    let rec = -1, rd = 1e9;
    this.fielders.forEach((g, j) => { if (j === i) return; const dd = dist(g.x, g.z, target.x, target.z); if (dd < rd) { rd = dd; rec = j; } });
    this.throwing = { from: i, to: rec, base, t: 0, eta: v.t };
    if (rec >= 0) { this.activeFielder = rec; }
    sfx.run();
    this.emit('throw');
  }

  cpuThrowDecision(i) {
    const f = this.fielders[i];
    if (f.catchT > 0.05) return; // brief hold after catching
    // Evaluate each base with an incoming runner.
    let best = null, bestScore = -1;
    for (const r of this.runners) {
      if (r.state !== 'run' && r.state !== 'back') continue;
      const b = r.to; const base = BASES[b % 4];
      const d = dist(f.x, f.z, base.x, base.z);
      const tThrow = d / this.armSpeed(f) + 0.25;
      const rem = dist(r.x, r.z, base.x, base.z);
      const tRun = rem / r.speed;
      const margin = tRun - tThrow;
      if (margin > -0.05) {
        let score = margin + (r.forced ? 0.6 : 0.2) + (b === 4 ? 0.8 : b === 1 && r.isBatter ? 0.4 : 0.3);
        if (score > bestScore) { bestScore = score; best = b; }
      }
    }
    if (best !== null) { this.throwTo(i, best); return; }
    // nobody to get: if runners are still moving, throw ahead of the lead runner to hold them
    const lead = this.runners.filter(r => r.state === 'run').sort((a, b) => b.to - a.to)[0];
    if (lead) { const b = Math.min(lead.to + 1, 4); if (dist(f.x, f.z, BASES[b % 4].x, BASES[b % 4].z) > 25) this.throwTo(i, b); }
  }

  // ------------------------------------------------------------ runners
  updateRunners() {
    const m = this.m, ball = this.ball;
    const binp = this.batInput;
    // Human: A = advance everyone, B = retreat everyone.
    if (binp) {
      if (binp.pressed.a) for (const r of this.runners) if (r.state === 'on' || r.state === 'back' || r.state === 'run') {
        if (r.state === 'on') this.sendRunner(r, r.at + 1);
        else if (r.state === 'back') { r.state = 'run'; r.to = r.at + 1; }
        else if (r.state === 'run' && r.progress > 0.9) { /* will decide on arrival */ r.goOn = true; }
      }
      if (binp.pressed.b) for (const r of this.runners) if (r.state === 'run' && !(r.forced && r.isBatter)) { r.state = 'back'; r.to = r.at; r.goOn = false; }
    } else {
      this.cpuRunnerDecisions();
    }
    for (const r of this.runners) {
      if (r.state !== 'run' && r.state !== 'back') continue;
      const target = BASES[r.to % 4];
      const from = BASES[r.at % 4];
      const dx = target.x - r.x, dz = target.z - r.z, d = Math.hypot(dx, dz);
      const total = Math.max(1, dist(from.x, from.z, target.x, target.z));
      r.progress = 1 - d / total;
      const s = Math.min(d, r.speed * DT);
      if (d > 0.01) { r.x += dx / d * s; r.z += dz / d * s; r.facing = Math.sign(dx) || r.facing; }
      r.anim += DT;
      if (d <= r.speed * DT + 0.01) this.runnerArrive(r);
    }
  }

  runnerArrive(r) {
    const m = this.m;
    if (r.state === 'back') { r.state = 'on'; r.progress = 0; r.x = BASES[r.at].x; r.z = BASES[r.at].z; return; }
    const b = r.to;
    r.x = BASES[b % 4].x; r.z = BASES[b % 4].z;
    if (b === 4) { r.state = 'scored'; m.scoreRun(r.slot, true); this.say('RUN SCORES!', 1.0); sfx.safe(); this.updateForces(); return; }
    // tagged/forced out if a fielder holds the ball on this base
    const holder = this.fielders[this.ballHolder];
    if (holder && dist(holder.x, holder.z, r.x, r.z) < 3.2 && (r.forced || !this.caught)) {
      if (r.forced) { this.runnerOut(r, b === 1 ? 'OUT AT FIRST' : 'FORCE OUT'); return; }
      this.runnerOut(r, 'TAGGED OUT'); return;
    }
    r.at = b; r.state = 'on'; r.progress = 0;
    if (r.isBatter) { this.hitBase = Math.max(this.hitBase, b); }
    this.updateForces();
    // Keep going?  (human pressed advance while approaching, or CPU judged it)
    if (r.goOn) { r.goOn = false; this.sendRunner(r, b + 1); }
  }

  cpuRunnerDecisions() {
    const ball = this.ball;
    // decide every few frames
    this.decisionTick = (this.decisionTick || 0) + 1;
    if (this.decisionTick % 8 !== 0) return;
    const holder = this.fielders[this.ballHolder];
    for (const r of this.runners) {
      if (r.state !== 'on' && r.state !== 'run') continue;
      const next = (r.state === 'on' ? r.at : r.to) + 1;
      if (next > 4) continue;
      if (r.state === 'run' && r.progress < 0.6) continue;
      // Time for ball to reach the next base vs runner.
      const base = BASES[next % 4];
      let tBall;
      const bx = holder ? holder.x : ball.x, bz = holder ? holder.z : ball.z;
      const dBall = dist(bx, bz, base.x, base.z);
      if (holder) tBall = dBall / 110 + 0.4;
      else if (ball.airborne && !this.caught) {
        const land = ball.predictLanding(6);
        const f = this.nearestFielderToBall();
        tBall = Math.max(land.t, f.eta) + dist(land.x, land.z, base.x, base.z) / 110 + 0.6;
      } else {
        const f = this.nearestFielderToBall();
        tBall = f.eta + dBall / 110 + 0.5;
      }
      const dRun = (r.state === 'on' ? dist(r.x, r.z, base.x, base.z) : dist(r.x, r.z, BASES[r.to % 4].x, BASES[r.to % 4].z) + 90);
      const tRun = dRun / r.speed;
      if (r.state === 'on') {
        if (r.forced) { this.sendRunner(r, next); continue; }   // must run anyway
        if (this.caught && ball.z < 200) continue;            // don't tag up on short flies
        if (ball.airborne && !this.caught) continue;          // wait for the ball to land
        if (tRun + 0.3 < tBall) this.sendRunner(r, next);
      } else if (r.state === 'run' && r.progress >= 0.6) {
        r.goOn = (tRun + (next >= 3 ? 0.8 : 0.4) < tBall) && !(holder && dist(holder.x, holder.z, base.x, base.z) < 40);
      }
    }
  }

  // ------------------------------------------------------------ end of play
  checkPlayEnd() {
    const m = this.m;
    if (this.dead) return;
    if (m.outs >= 3) { this.endPlay(); return; }
    const anyRunning = this.runners.some(r => r.state === 'run' || r.state === 'back');
    const held = this.ballHeld();
    if (held && !anyRunning) this.holdTimer += DT; else this.holdTimer = 0;
    if (this.holdTimer > 0.6) { this.endPlay(); return; }
    // ball sitting still and nobody moving (shouldn't happen) - force end
    if (this.ball.stopped && !held && !anyRunning && this.inPlayT > 8) this.endPlay();
    if (this.inPlayT > 25) this.endPlay();
  }

  endPlay() {
    const m = this.m, t = m.battingTeam;
    this.dead = true;
    // commit runner positions to match state
    m.runners = [null, null, null];
    for (const r of this.runners) {
      if (r.state === 'on' && r.at >= 1 && r.at <= 3) m.runners[r.at - 1] = r.slot;
      else if (r.state === 'run' || r.state === 'back') { const b = r.state === 'back' ? r.at : r.to; if (b >= 1 && b <= 3) m.runners[b - 1] = r.slot; else if (b === 4) { r.state = 'scored'; m.scoreRun(r.slot, true); } }
    }
    const batter = this.runners.find(r => r.isBatter);
    let text = '';
    if (batter.state === 'out') { text = this.outsThisPlay >= 2 ? 'DOUBLE PLAY!' : (this.caught ? 'OUT!' : 'OUT!'); this.playResult = 'out'; }
    else {
      const b = batter.state === 'scored' ? 4 : (batter.state === 'on' ? batter.at : this.hitBase);
      const names = { 1: 'BASE HIT!', 2: 'DOUBLE!', 3: 'TRIPLE!', 4: 'INSIDE THE PARK HOMER!' };
      // Fielder's choice: batter safe but another runner forced out on the play.
      if (this.outsThisPlay > 0 && b === 1 && !this.caught) { text = "FIELDER'S CHOICE"; this.playResult = 'fc'; }
      else { text = names[b] || 'SAFE!'; m.batterStats().h++; m.hits[t]++; this.playResult = 'hit'; if (b === 4) m.batterStats().hr++; }
      if (this.outsThisPlay >= 2) text = 'DOUBLE PLAY!';
    }
    this.say(text, 1.4, true);
    if (this.playResult === 'hit') sfx.cheer();
    this.phase = 'playover'; this.timer = 1.5;
  }

  updatePlayOver() {
    this.timer -= DT;
    if (this.timer > 0) return;
    if (this.playResult === 'foul') { this.newAtBat(); return; }
    this.m.nextBatter();
    this.afterPlay();
  }
}

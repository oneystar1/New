// IRON DIAMOND — practice: interactive tutorial and Home Run Derby.
'use strict';
const DERBY_KEY = 'ironDiamond.derby.v1';
class PracticeMenu {
  constructor() { this.t = 0; this.sel = 0; }
  update(dt) {
    this.t += dt; this.sel = navList(this.sel, 3);
    if (Input.anyHit('b')) { Game.set(new TitleScene()); Game.scene.pressed = true; return; }
    if (Input.anyHit('a') || Input.anyHit('start')) {
      Sfx.play('ok');
      if (this.sel === 0) Game.set(new TutorialScene());
      if (this.sel === 1) Game.set(new TeamSelect('gauntlet', ([i]) => Game.set(new SluggerSelect(i)), 'DERBY · CHOOSE YOUR CLUB'));
      if (this.sel === 2) { Game.set(new TitleScene()); Game.scene.pressed = true; }
    }
  }
  draw(ctx) {
    drawBackdrop(ctx, this.t + 700, null, 0.66);
    glowTxt(ctx, 'PRACTICE', W / 2, 70, 40, '#ffffff', '#3dffa0');
    menuList(ctx, ['TUTORIAL', 'HOME RUN DERBY', 'BACK'], this.sel, W / 2, 160, { w: 420 });
    const lines = this.sel === 0 ? ['Learn every control step by step:', 'batting, bunting, stealing, pitching, fielding and clashes.'] : this.sel === 1 ? ['A pitching machine, 10 outs, and only homers count.', 'Any swing that stays in the park is an out.'] : [''];
    lines.forEach((l, i) => txt(ctx, l, W / 2, 360 + i * 26, 17, '#c8d2f0', 'center', FONT_B, 700));
    const lb = store.get(DERBY_KEY, []);
    if (this.sel === 1 && lb.length) { txt(ctx, 'BEST DERBY', W / 2, 430, 12, '#3dffa0', 'center', FONT_H, 900); txt(ctx, `${lb[0].hr} HR · ${lb[0].long} FT · ${lb[0].name} (${lb[0].team})`, W / 2, 452, 15, '#ffffff', 'center', FONT_H, 700); }
    footer(ctx, 'A CONFIRM   B BACK');
  }
}
class SluggerSelect {
  constructor(teamIdx) { this.ti = teamIdx; this.t = 0; this.sel = 0; this.ro = buildRoster(teamIdx); this.list = this.ro.lineup.slice().sort((a, b) => b.pow - a.pow); }
  update(dt) {
    this.t += dt; this.sel = navList(this.sel, this.list.length);
    if (Input.anyHit('b')) { Game.set(new PracticeMenu()); return; }
    if (Input.anyHit('a') || Input.anyHit('start')) {
      Sfx.play('ok'); const robot = this.list[this.sel], opp = (this.ti + 5) % 12;
      const cfg = { teams: [this.ti, opp], rosters: [this.ro, buildRoster(opp)], ctrl: [0, null], innings: 99, diff: Game.settings.diff, clash: false, meter: Game.settings.meter, derby: { outs: 10, robot }, noReplay: true };
      Game.set(new GameScene(cfg, m => Game.set(new DerbyResult(m, robot, this.ti))));
    }
  }
  draw(ctx) {
    const tm = TEAMS[this.ti]; drawBackdrop(ctx, this.t + 720, tm, 0.7);
    glowTxt(ctx, 'PICK YOUR SLUGGER', W / 2, 36, 30, '#ffffff', tm.g);
    const items = this.list.map(r => ({ label: `${r.name} · ${CLASSES[r.cls].name}`, value: `POW ${r.pow}` }));
    menuList(ctx, items, this.sel, W / 2 - 120, 64, { w: 440, h: 40 });
    const r = this.list[this.sel]; panel(ctx, W - 300, 70, 260, 400, tm.g, 0.84);
    drawRobot(ctx, W - 170, 380, 34, r, tm, { t: this.t });
    txt(ctx, r.name, W - 170, 420, 20, '#ffffff', 'center', FONT_H, 900);
    txt(ctx, `POW ${r.pow} · CON ${r.con}`, W - 170, 446, 14, '#c8d2f0', 'center', FONT_H, 700);
    footer(ctx, 'POWER HITS FARTHER · CONTACT MAKES SQUARING UP EASIER');
  }
}
class DerbyResult {
  constructor(m, robot, ti) {
    this.m = m; this.t = 0; const D = m.derby || { hr: 0, long: 0, total: 0 };
    this.entry = { hr: D.hr, long: D.long, total: D.total, name: robot.name, team: TEAMS[ti].id };
    const lb = store.get(DERBY_KEY, []); lb.push(this.entry); lb.sort((a, b) => (b.hr - a.hr) || (b.long - a.long)); this.lb = lb.slice(0, 5); store.set(DERBY_KEY, this.lb);
    this.rank = this.lb.indexOf(this.entry);
  }
  update(dt) { this.t += dt; if (this.t > 0.8 && (Input.anyHit('a') || Input.anyHit('start'))) { Sfx.play('ok'); Game.set(new PracticeMenu()); } }
  draw(ctx) {
    const tm = this.m.sides[0].team; drawBackdrop(ctx, this.t + 740, tm, 0.66);
    glowTxt(ctx, 'DERBY RESULTS', W / 2, 50, 36, '#ffffff', tm.g);
    glowTxt(ctx, String(this.entry.hr), W / 2 - 160, 160, 90, '#ffffff', tm.g); txt(ctx, 'HOME RUNS', W / 2 - 160, 222, 14, '#9aa6c8', 'center', FONT_H, 900);
    glowTxt(ctx, `${this.entry.long}`, W / 2 + 160, 160, 90, '#ffffff', '#ffd84a'); txt(ctx, 'LONGEST (FT)', W / 2 + 160, 222, 14, '#9aa6c8', 'center', FONT_H, 900);
    panel(ctx, W / 2 - 260, 260, 520, 206, '#46e0ff', 0.84); txt(ctx, 'LEADERBOARD', W / 2 - 240, 282, 12, '#46e0ff', 'left', FONT_H, 900);
    this.lb.forEach((e, i) => { const y = 312 + i * 30, me = i === this.rank; if (me) { ctx.fillStyle = hexA(tm.g, 0.2); ctx.fillRect(W / 2 - 252, y - 13, 504, 26); } txt(ctx, `${i + 1}`, W / 2 - 230, y, 15, '#9aa6c8', 'center', FONT_H, 900); txt(ctx, `${e.name} · ${e.team}`, W / 2 - 205, y, 15, '#ffffff', 'left', FONT_H, me ? 900 : 700); txt(ctx, `${e.hr} HR`, W / 2 + 120, y, 15, '#ffffff', 'right', FONT_H, 900); txt(ctx, `${e.long} FT`, W / 2 + 230, y, 15, '#ffd84a', 'right', FONT_H, 700); });
    if (this.rank === 0 && this.entry.hr) glowTxt(ctx, 'NEW RECORD!', W / 2, 490, 22, '#ffffff', '#3dffa0');
    footer(ctx, 'PRESS A');
  }
}
function drawDerbyHud(ctx, m) {
  const D = m.derby; if (!D) return; const tm = m.sides[0].team, x = 14, y = 12;
  panel(ctx, x, y, 300, 76, tm.g, 0.92);
  txt(ctx, 'HOME RUN DERBY', x + 14, y + 18, 12, tm.g, 'left', FONT_H, 900);
  txt(ctx, `${D.hr}`, x + 14, y + 50, 34, '#ffffff', 'left', FONT_H, 900); txt(ctx, 'HR', x + 14 + (D.hr > 9 ? 44 : 24), y + 56, 12, '#9aa6c8', 'left', FONT_H, 900);
  const outs = m.cfg.derby.outs; for (let i = 0; i < outs; i++) { ctx.fillStyle = i < D.outs ? '#ff4a5a' : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(x + 112 + i * 18, y + 40, 5.5, 0, TAU); ctx.fill(); }
  txt(ctx, 'OUTS', x + 112, y + 60, 10, '#9aa6c8', 'left', FONT_H, 700); txt(ctx, `LONGEST ${D.long || '—'} FT`, x + 288, y + 60, 11, '#ffd84a', 'right', FONT_H, 700);
  if (m.state === 'derby' && m.ball && !D.cur.called) { const d = Math.round(hyp(m.ball.x, m.ball.y)); glowTxt(ctx, `${d} FT`, W / 2, 110, 40, '#ffffff', tm.g); }
}

// ---------------------------------------------------------------- tutorial
const TUT_STEPS = [
  { role: 'bat', ack: true, title: 'WELCOME TO TRAINING', text: ['Each step waits until you try it. Press A (or tap) to begin.', 'You can skip any step with SKIP or from the pause menu.'] },
  { role: 'bat', title: 'MOVE IN THE BOX', text: ['Hold ← / → to slide the batter.', 'The rings at the plate move with you: cover the pitch with them.'], done: f => (f.shifted || 0) > 0.4 },
  { role: 'bat', title: 'CONTACT SWING', text: ['Press A as the marker reaches the wide window on the timing meter.', 'The solid ring is the contact sweet spot: big and forgiving.'], done: f => f.contact === 'contact' },
  { role: 'bat', title: 'POWER SWING', text: ['Press B for a power swing: the dashed gold ring and gold window are smaller,', 'but a good one goes a long way.'], done: f => f.contact === 'power' },
  { role: 'bat', title: 'BUNT', text: ['Hold ↓ to square around. The green bunt zone appears.', 'Keep holding: if the pitch is inside it, the bat meets the ball by itself.'], done: f => f.contact === 'bunt' },
  { role: 'bat', runner: true, title: 'STEAL A BASE', text: ['A runner is on first. Press ↑ (or tap STEAL) as the pitcher starts his windup.', 'Beat the catcher\'s throw and the base is yours. Close plays become a clash.'], done: f => f.steal },
  { role: 'pitch', title: 'PITCH', text: ['You\'re on the mound. Aim with the d-pad, then press A to throw.', 'The pitch rail on the right shows what you\'re throwing.'], done: f => f.pitched !== undefined },
  { role: 'pitch', title: 'CHANGE PITCHES', text: ['Press B (or tap the rail) to pick a CURVE, SLIDER, CHANGEUP or PLASMA, then throw it.', 'The icon shows how each one bends. PLASMA costs a lot of battery.'], done: f => f.pitched > 0 },
  { role: 'pitch', title: 'STEER THE PITCH', text: ['Throw again and hold ← or → while the ball is in the air.', 'Steering late can paint a corner or make a batter chase.'], done: f => f.steered },
  { role: 'pitch', title: 'FIELD IT', text: ['When they hit it, the fielder with the ring is yours (Fielding Assist chases for you).', 'With the ball: hold a direction + A to throw. → 1st  ↑ 2nd  ← 3rd  ↓ home'], done: f => f.played },
  { role: 'pitch', clash: true, title: 'CLASH!', text: ['A close play turns into a brawl. ←/→ move, A strike, B heavy (breaks guard), ↓ guard.', 'Win it and the runner is out. Damage stays on your robots, so fight smart.'], done: f => f.clashed },
  { role: 'bat', ack: true, last: true, title: 'YOU\'RE READY', text: ['Tip: fill your OVERDRIVE meter (under your score) for a special ability.', 'Practise timing in HOME RUN DERBY. Press A to finish.'] },
];
class TutorialScene extends GameScene {
  constructor() {
    const cfg = { teams: [0, 8], rosters: [buildRoster(0), buildRoster(8)], ctrl: [0, null], innings: 99, diff: 0, clash: true, practice: true, meter: true, assist: true, autoRun: false, noReplay: true };
    super(cfg, () => { }); this.si = 0; this.doneT = 0; this.m.timer = 1.0; this.goStep(0);
    Input.twoPlayer = false;
  }
  goStep(i) { this.si = i; this.doneT = 0; this.m.flags = {}; this.pending = true; this.clashFired = false; }
  applyRole() {
    const m = this.m, st = TUT_STEPS[this.si];
    m.half = st.role === 'bat' ? 0 : 1; m.buildFielders(); m.outs = 0; m.balls = 0; m.strikes = 0;
    const run = st.runner || st.clash ? m.sides[m.bat].ro.lineup[(m.sides[m.bat].batIdx + 4) % 9] : null;
    m.practiceBases = [run, null, null]; m.bases = m.practiceBases.slice(); m.newPitch(true); m.flags = {};
  }
  pauseItems() { const it = super.pauseItems(); it.splice(1, 0, { label: 'SKIP THIS STEP', act: () => { this.paused = false; this.next(); } }); return it.map(x => x.label === 'QUIT MATCH' ? { label: 'EXIT TRAINING', act: () => { Game.set(new PracticeMenu()); } } : x); }
  next() { if (this.si >= TUT_STEPS.length - 1) { Game.set(new PracticeMenu()); return; } this.goStep(this.si + 1); Sfx.play('ok'); }
  update(dt) {
    super.update(dt); if (this.paused || Game.scene !== this) return;
    const m = this.m, st = TUT_STEPS[this.si];
    if (this.pending && m.state === 'pitch' && m.pt.stage === 'aim') { this.pending = false; this.applyRole(); }
    if (st.clash && !this.pending && !this.clashFired && m.state === 'pitch' && m.pt.stage === 'aim' && m.bases[0]) { this.clashFired = true; m.stealClash(m.bases[0], m.F('SS').r, 2, 1, 'CAUGHT STEALING'); }
    if (this.doneT > 0) { this.doneT -= dt; if (this.doneT <= 0) this.next(); return; }
    const ok = st.ack ? (Input.anyHit('a') && this.t > 0.2) : (!this.pending && st.done(m.flags || {}));
    this.t = (this.t || 0) + dt;
    if (ok) { if (st.ack) this.next(); else { this.doneT = 1.2; Sfx.play('cash'); } }
  }
  draw(ctx) {
    super.draw(ctx); if (this.paused) return;
    const st = TUT_STEPS[this.si], x = 330, y = this.m.state === 'clash' ? H - 138 : 8, w = W - x - 14, h = 92;
    ctx.save(); rrect(ctx, x, y, w, h, 10); ctx.fillStyle = 'rgba(6,9,22,0.92)'; ctx.fill(); ctx.strokeStyle = '#3dffa0'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    txt(ctx, `TRAINING · ${this.si + 1} / ${TUT_STEPS.length}`, x + 16, y + 18, 11, '#3dffa0', 'left', FONT_H, 900);
    txt(ctx, st.title, x + 16, y + 40, 20, '#ffffff', 'left', FONT_H, 900);
    st.text.forEach((l, i) => txt(ctx, l, x + 16, y + 62 + i * 18, 14, '#c8d2f0', 'left', FONT_B, 700));
    for (let i = 0; i < TUT_STEPS.length; i++) { ctx.fillStyle = i < this.si ? '#3dffa0' : i === this.si ? '#ffffff' : 'rgba(255,255,255,0.2)'; ctx.fillRect(x + w - 16 - (TUT_STEPS.length - i) * 12, y + 14, 8, 4); }
    if (!st.ack) { const bx = x + w - 84, by = y + 30; tapZone(bx, by, 70, 24, () => this.next()); ctx.save(); rrect(ctx, bx, by, 70, 24, 12); ctx.strokeStyle = 'rgba(200,210,240,0.5)'; ctx.stroke(); ctx.restore(); txt(ctx, 'SKIP ▶', bx + 35, by + 12.5, 11, '#c8d2f0', 'center', FONT_H, 900); }
    if (this.doneT > 0) { const k = 1 - this.doneT / 1.2; glowTxt(ctx, '✔ NICE!', W / 2, 200 - k * 20, 50, '#ffffff', '#3dffa0'); }
  }
}

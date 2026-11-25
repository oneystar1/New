// IRON DIAMOND — scenes: title, menus, team select, VS, game wrapper, results, Gauntlet + garage.
'use strict';
const Game = {
  scene: null, t: 0,
  settings: Object.assign({ innings: 3, diff: 1, clash: true, music: true, fx: 'auto', haptics: true, field: 'assist', run: 'auto', meter: true }, store.get('ironDiamond.settings', {})),
  set(s) { this.scene = s; s.enter && s.enter(); },
  save() { store.set('ironDiamond.settings', this.settings); Sfx.musicOn = this.settings.music; applyFx(); },
};
function applyFx() { const f = Game.settings.fx; FX.high = f !== 'low'; FX.auto = f === 'auto'; FX.haptics = Game.settings.haptics; }
Sfx.musicOn = Game.settings.music; applyFx();
const DIFF_NAMES = ['ROOKIE', 'PRO', 'LEGEND'];
function tapZone(x, y, w, h, fn) { (Game.taps = Game.taps || []).push({ x, y, w, h, fn }); }

// ---------- shared backdrop: orbiting stadium flyover
const bgCam = new Cam();
function drawBackdrop(ctx, t, team, dim = 0.55) {
  const a = t * 0.06; bgCam.set(Math.sin(a) * 260, 140 - Math.cos(a) * 260, 140, 0, 170, 0, 600);
  Park.draw(ctx, bgCam, team || TEAMS[(Math.floor(t / 12)) % TEAMS.length], t, null);
  drawThemeFx(ctx, team || TEAMS[(Math.floor(t / 12)) % TEAMS.length], t, bgCam);
  Game.bloom && Game.bloom();
  ctx.fillStyle = `rgba(4,6,16,${dim})`; ctx.fillRect(0, 0, W, H);
}
function menuList(ctx, items, sel, x, y, opts = {}) {
  const w = opts.w || 360, h = opts.h || 46;
  items.forEach((it, i) => {
    const yy = y + i * (h + 8), on = i === sel, label = typeof it === 'string' ? it : it.label, dis = it.disabled;
    ctx.save(); rrect(ctx, x - w / 2, yy, w, h, 8);
    ctx.fillStyle = on ? 'rgba(70,224,255,0.18)' : 'rgba(10,14,30,0.65)'; ctx.fill();
    ctx.strokeStyle = on ? '#46e0ff' : 'rgba(120,140,200,0.25)'; ctx.lineWidth = on ? 2 : 1; ctx.stroke(); ctx.restore();
    if (on) { glow(ctx, x - w / 2 + 18, yy + h / 2, 16, '#46e0ff', 0.8); ctx.fillStyle = '#46e0ff'; ctx.beginPath(); ctx.moveTo(x - w / 2 + 12, yy + h / 2 - 7); ctx.lineTo(x - w / 2 + 22, yy + h / 2); ctx.lineTo(x - w / 2 + 12, yy + h / 2 + 7); ctx.fill(); }
    tapZone(x - w / 2, yy, w, h, () => { const sc = Game.scene; if ('sel' in sc) sc.sel = i; Input.touchLatch.a = true; });
    txt(ctx, label, x, yy + h / 2 + 1, 20, dis ? '#5a6280' : on ? '#ffffff' : '#b5bfe0', 'center', FONT_H, 900);
    if (it.value != null) txt(ctx, it.value, x + w / 2 - 16, yy + h / 2 + 1, 18, '#ffd84a', 'right', FONT_H, 900);
  });
}
function navList(sel, n) { if (Input.anyHit('up')) { Sfx.play('move'); return (sel + n - 1) % n; } if (Input.anyHit('down')) { Sfx.play('move'); return (sel + 1) % n; } return sel; }
function footer(ctx, s) { txt(ctx, s, W / 2, H - 18, 15, '#8f9bc0', 'center', FONT_B, 700); }
function logo(ctx, x, y, sc, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  // diamond mark
  ctx.save(); ctx.rotate(Math.PI / 4); ctx.strokeStyle = '#46e0ff'; ctx.lineWidth = 4; ctx.shadowColor = '#46e0ff'; ctx.shadowBlur = 20; ctx.strokeRect(-26, -26, 52, 52); ctx.fillStyle = 'rgba(70,224,255,0.15)'; ctx.fillRect(-26, -26, 52, 52); ctx.restore();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill(); glow(ctx, 0, 0, 30, '#ffffff', 0.7);
  glowTxt(ctx, 'IRON', -50, 0, 64, '#ffffff', '#46e0ff', 'right');
  glowTxt(ctx, 'DIAMOND', 50, 0, 64, '#ffffff', '#ff3d8a', 'left');
  const sweep = (t * 0.4) % 1.6 - 0.3; const g = ctx.createLinearGradient(-330 + sweep * 660, 0, -250 + sweep * 660, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(-330, -34, 660, 68);
  ctx.restore();
}

// ---------- TITLE
class TitleScene {
  constructor() { this.sel = 0; this.t = 0; this.pressed = false; }
  items() { const g = store.get(SAVE_KEY, null), se = store.get(SEASON_KEY, null); return ['EXHIBITION', se && !se.done ? 'SEASON · CONTINUE' : 'SEASON', g && !g.done ? 'GAUNTLET · CONTINUE' : 'GAUNTLET', 'PRACTICE · TUTORIAL & DERBY', 'HOW TO PLAY', 'SETTINGS']; }
  update(dt) {
    this.t += dt;
    if (!this.pressed) { if (Input.anyHit('start') || Input.anyHit('a')) { this.pressed = true; Sfx.play('ok'); } return; }
    const it = this.items(); this.sel = navList(this.sel, it.length);
    if (Input.anyHit('a') || Input.anyHit('start')) {
      Sfx.play('ok');
      if (this.sel === 0) Game.set(new ModeScene());
      if (this.sel === 1) Game.set(new SeasonHub());
      if (this.sel === 2) Game.set(new GauntletHub());
      if (this.sel === 3) Game.set(new PracticeMenu());
      if (this.sel === 4) Game.set(new HowToScene());
      if (this.sel === 5) Game.set(new SettingsScene());
    }
  }
  draw(ctx) {
    drawBackdrop(ctx, this.t + 3, null, 0.45);
    { const pt = TEAMS[(Math.floor((this.t + 3) / 12)) % TEAMS.length]; txt(ctx, `${themeOf(pt).name} · HOME OF THE ${pt.name}`, 20, 20, 12, hexA(pt.g, 0.85), 'left', FONT_H, 700); }
    // robot showcase
    const show = [['STRIKER', 0], ['TITAN', 1], ['VECTOR', 2], ['RAPTOR', 8]];
    show.forEach(([cls, ti], i) => { const r = { cls, num: [7, 44, 3, 21][i], name: '', hand: 1 }; const x = [110, 235, 725, 850][i], y = 480; const ell = ctx.createRadialGradient(x, y, 0, x, y, 60); ell.addColorStop(0, 'rgba(0,0,0,0.55)'); ell.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = ell; ctx.fillRect(x - 60, y - 14, 120, 28); drawRobot(ctx, x, y, 17, r, TEAMS[ti], { t: this.t + i, lean: Math.sin(this.t + i) * 0.1 }); });
    logo(ctx, W / 2, 110, 1, this.t);
    txt(ctx, 'ROBOT BASEBALL LEAGUE · 2087 SEASON', W / 2, 160, 18, '#9fdcff', 'center', FONT_H, 700);
    if (!this.pressed) { if (Math.sin(this.t * 4) > -0.3) glowTxt(ctx, 'PRESS START', W / 2, 290, 30, '#ffffff', '#46e0ff'); footer(ctx, 'ENTER / SPACE / TAP · M TO MUTE'); return; }
    menuList(ctx, this.items(), this.sel, W / 2, 182, { h: 38, w: 400 });
    footer(ctx, '↑↓ SELECT   A / ENTER CONFIRM   M MUTE');
  }
}
class ModeScene {
  constructor() { this.sel = 0; this.t = 0; }
  update(dt) {
    this.t += dt; this.sel = navList(this.sel, 3);
    if (Input.anyHit('b')) { Sfx.play('back'); Game.set(new TitleScene()); Game.scene.pressed = true; return; }
    if (Input.anyHit('a') || Input.anyHit('start')) { Sfx.play('ok'); Game.set(new TeamSelect(['1p', '2p', 'cpu'][this.sel], teams => Game.set(new VsScene(['1p', '2p', 'cpu'][this.sel], teams)))); }
  }
  draw(ctx) {
    drawBackdrop(ctx, this.t + 30, null, 0.6);
    glowTxt(ctx, 'EXHIBITION', W / 2, 90, 44, '#ffffff', '#46e0ff');
    menuList(ctx, ['1 PLAYER  VS  CPU', '2 PLAYERS  VS', 'CPU  VS  CPU  (WATCH)'], this.sel, W / 2, 170, { w: 420 });
    const s = Game.settings; txt(ctx, `${s.innings} INNINGS · ${DIFF_NAMES[s.diff]} · CLASHES ${s.clash ? 'ON' : 'OFF'}  (change in SETTINGS)`, W / 2, 360, 15, '#8f9bc0', 'center', FONT_B, 700);
    footer(ctx, 'A CONFIRM   B BACK');
  }
}

// ---------- TEAM SELECT
const ratingCache = {};
function ratingOf(i) { return ratingCache[i] || (ratingCache[i] = teamRating(i)); }
class TeamSelect {
  constructor(mode, done, title) {
    this.mode = mode; this.done = done; this.t = 0; this.title = title;
    this.cur = [0, 1]; this.locked = [null, null]; this.step = 0; Input.twoPlayer = mode === '2p'; // 1p/cpu: step0 pick A, step1 pick B
  }
  update(dt) {
    this.t += dt;
    const move = (i, pad) => { const c = this.cur[i]; let n = c; if (Input.hit(pad, 'left')) n = (c % 6 === 0) ? c + 5 : c - 1; if (Input.hit(pad, 'right')) n = (c % 6 === 5) ? c - 5 : c + 1; if (Input.hit(pad, 'up') || Input.hit(pad, 'down')) n = (c + 6) % 12; if (n !== c) { this.cur[i] = n; Sfx.play('move'); } };
    if (this.mode === '2p') {
      for (let i = 0; i < 2; i++) { if (this.locked[i] == null) { move(i, i); if (Input.hit(i, 'a')) { this.locked[i] = this.cur[i]; Sfx.play('ok'); } } else if (Input.hit(i, 'b')) { this.locked[i] = null; Sfx.play('back'); } }
      if (this.locked[0] == null && this.locked[1] == null && Input.hit(0, 'b')) { Sfx.play('back'); Game.set(new ModeScene()); return; }
      if (this.locked[0] != null && this.locked[1] != null) { this.doneT = (this.doneT || 0) + dt; if (this.doneT > 0.5) this.done([this.locked[0], this.locked[1]]); }
      return;
    }
    const i = this.step; move(i, 0);
    if (Input.hit(0, 'a') || Input.hit(0, 'start')) {
      if (this.step === 1 && this.cur[1] === this.locked[0]) { Sfx.play('buzz'); return; }
      this.locked[i] = this.cur[i]; Sfx.play('ok');
      if (this.mode === 'gauntlet') { this.done([this.locked[0]]); return; }
      if (this.step === 0) { this.step = 1; this.cur[1] = (this.cur[0] + 1 + Math.floor(Math.random() * 11)) % 12; }
      else this.done([this.locked[0], this.locked[1]]);
    }
    if (Input.hit(0, 'b')) { Sfx.play('back'); if (this.step === 1) { this.step = 0; this.locked[0] = null; } else Game.set(this.mode === 'gauntlet' ? new TitleScene() : new ModeScene()); if (Game.scene instanceof TitleScene) Game.scene.pressed = true; }
  }
  draw(ctx) {
    const focusIdx = this.mode === '2p' ? this.cur[0] : this.cur[this.step];
    drawBackdrop(ctx, this.t + 60, TEAMS[focusIdx], 0.62);
    const head = this.title || (this.mode === '2p' ? 'CHOOSE YOUR CLUBS' : this.mode === 'cpu' ? (this.step ? 'CHOOSE THE HOME CLUB' : 'CHOOSE THE AWAY CLUB') : this.step ? 'CHOOSE YOUR OPPONENT' : 'CHOOSE YOUR CLUB');
    glowTxt(ctx, head, W / 2, 40, 30, '#ffffff', '#46e0ff');
    const cw = 140, ch = 92, gx = W / 2 - 3 * cw - 15, gy = 72;
    TEAMS.forEach((tm, i) => {
      const x = gx + (i % 6) * (cw + 6), y = gy + Math.floor(i / 6) * (ch + 8);
      ctx.save(); rrect(ctx, x, y, cw, ch, 8); const g = ctx.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, hexA(tm.p, 0.5)); g.addColorStop(1, 'rgba(8,10,22,0.85)'); ctx.fillStyle = g; ctx.fill();
      const taken = (this.locked[0] === i || this.locked[1] === i);
      ctx.strokeStyle = taken ? '#ffffff' : 'rgba(150,170,230,0.25)'; ctx.lineWidth = taken ? 2 : 1; ctx.stroke(); ctx.restore();
      tapZone(x, y, cw, ch, () => { const p = this.mode === '2p' ? 0 : this.step; if (this.cur[p] === i) Input.touchLatch.a = true; else { this.cur[p] = i; Sfx.play('move'); } });
      drawEmblem(ctx, x + cw / 2, y + 34, 22, tm);
      txt(ctx, tm.city, x + cw / 2, y + 66, 11, '#c8d2f0', 'center', FONT_H, 700);
      txt(ctx, tm.name, x + cw / 2, y + 81, tm.name.length > 11 ? 11 : 14, '#ffffff', 'center', FONT_H, 900);
      for (let p = 0; p < 2; p++) {
        const active = this.mode === '2p' ? true : p === this.step || this.locked[p] != null;
        const show = this.mode === '2p' ? this.cur[p] === i : (p === this.step ? this.cur[p] === i : this.locked[p] === i);
        if (!active || !show) continue; const col = p ? '#ff3d8a' : '#46e0ff';
        ctx.save(); rrect(ctx, x - 3 - p * 3, y - 3 - p * 3, cw + 6 + p * 6, ch + 6 + p * 6, 10); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.stroke(); ctx.restore();
        const lbl = this.mode === '2p' ? `P${p + 1}` : this.mode === 'cpu' ? (p ? 'HOME' : 'AWAY') : (p ? 'CPU' : 'YOU');
        ctx.fillStyle = col; rrect(ctx, x + (p ? cw - 44 : 4), y + 4, 40, 18, 4); ctx.fill(); txt(ctx, lbl, x + (p ? cw - 24 : 24), y + 13, 11, '#05070f', 'center', FONT_H, 900);
      }
    });
    // detail panels
    const showP = this.mode === '2p' ? [0, 1] : [this.step];
    showP.forEach((p, k) => { const w = showP.length > 1 ? 450 : 700; const x = showP.length > 1 ? (k ? W / 2 + 8 : W / 2 - 8 - w) : W / 2 - w / 2; this.detail(ctx, this.cur[p], x, 280, w, 222, p ? '#ff3d8a' : '#46e0ff'); });
    footer(ctx, this.mode === '2p' ? 'P1: WASD + J   ·   P2: ARROWS + ,   ·   B UNLOCK' : '←→↑↓ BROWSE   A SELECT   B BACK');
  }
  detail(ctx, i, x, y, w, h, col) {
    const tm = TEAMS[i], ro = buildRoster(i), rt = ratingOf(i);
    panel(ctx, x, y, w, h, tm.g, 0.85);
    drawEmblem(ctx, x + 38, y + 38, 24, tm);
    txt(ctx, tm.city, x + 72, y + 26, 13, tm.g, 'left', FONT_H, 900);
    txt(ctx, tm.name, x + 72, y + 48, 24, '#ffffff', 'left', FONT_H, 900);
    txt(ctx, '★'.repeat(tm.tier) + '☆'.repeat(3 - tm.tier), x + w - 16, y + 30, 20, '#ffd84a', 'right', FONT_B, 700);
    const stats = [['POWER', rt.pow], ['CONTACT', rt.con], ['SPEED', rt.spd], ['DEFENSE', rt.fld], ['FIGHT', rt.fgt]];
    const bw = w > 500 ? 200 : 150;
    stats.forEach(([k, v], j) => { const yy = y + 84 + j * 24; txt(ctx, k, x + 18, yy, 13, '#9aa6c8', 'left', FONT_H, 700); bar(ctx, x + 108, yy - 5, bw - 40, 10, (v - 2) / 7, tm.g); });
    // featured bots
    const feat = [ro.lineup[3], ro.lineup[0], ro.lineup[8]]; const ox = x + bw + 100, sp = (w - bw - 110) / 3;
    feat.forEach((r, j) => { const rx = ox + j * sp + sp / 2 - 20, ry = y + h - 34; drawRobot(ctx, rx, ry, 14, r, tm, { t: this.t + j }); txt(ctx, r.name, rx, ry + 14, 12, '#ffffff', 'center', FONT_H, 900); txt(ctx, CLASSES[r.cls].name, rx, ry + 27, 10, '#9aa6c8', 'center', FONT_H, 700); });
  }
}

// ---------- VS / lineup splash
class VsScene {
  constructor(mode, teams, extra = {}) {
    this.mode = mode; this.t = 0; this.extra = extra;
    // human team bats first in 1P (away)
    this.teams = teams; this.rosters = extra.rosters || teams.map(i => buildRoster(i));
    this.ctrl = extra.ctrl || (mode === '1p' ? [0, null] : mode === '2p' ? [0, 1] : [null, null]);
    Input.twoPlayer = mode === '2p';
  }
  update(dt) {
    this.t += dt;
    if (this.t > 0.6 && (Input.anyHit('start') || Input.anyHit('a'))) {
      Sfx.play('ok'); const s = Game.settings;
      const cfg = { teams: this.teams, rosters: this.rosters, ctrl: this.ctrl, innings: s.innings, diff: s.diff, clash: s.clash, up: this.extra.up, assist: s.field === 'assist', autoField: s.field === 'auto', autoRun: s.run === 'auto', meter: s.meter };
      const gs = new GameScene(cfg, this.extra.onEnd || (m => Game.set(new ResultScene(m, null)))); gs.onQuit = this.extra.onQuit; Game.set(gs);
    }
    if (Input.anyHit('b') && !this.extra.onEnd) { Sfx.play('back'); Game.set(new ModeScene()); }
  }
  draw(ctx) {
    drawBackdrop(ctx, this.t + 90, TEAMS[this.teams[1]], 0.7);
    txt(ctx, `TONIGHT AT ${themeOf(TEAMS[this.teams[1]]).name}`, W / 2, 63, 12, TEAMS[this.teams[1]].g, 'center', FONT_H, 900);
    for (let s = 0; s < 2; s++) {
      const tm = TEAMS[this.teams[s]], ro = this.rosters[s], x0 = s ? W / 2 + 12 : 20, w = W / 2 - 32, k = Math.min(1, this.t * 3);
      ctx.save(); ctx.translate((s ? 1 : -1) * (1 - k) * 300, 0); ctx.globalAlpha = k;
      panel(ctx, x0, 74, w, 420, tm.g, 0.82);
      drawEmblem(ctx, x0 + 50, 122, 34, tm);
      txt(ctx, s ? 'HOME' : 'AWAY', x0 + 98, 98, 13, tm.g, 'left', FONT_H, 900);
      txt(ctx, tm.city, x0 + 98, 118, 15, '#c8d2f0', 'left', FONT_H, 700);
      txt(ctx, tm.name, x0 + 98, 142, tm.name.length > 12 ? 18 : 24, '#ffffff', 'left', FONT_H, 900);
      const who = this.ctrl[s] != null ? `PLAYER ${this.ctrl[s] + 1}` : 'CPU'; txt(ctx, who, x0 + w - 16, 98, 14, this.ctrl[s] != null ? '#ffd84a' : '#8f9bc0', 'right', FONT_H, 900);
      ro.lineup.forEach((r, i) => {
        const yy = 182 + i * 33; const fr = r.hp / maxHp(r, { up: this.extra.up && this.extra.up[s] });
        txt(ctx, `${i + 1}`, x0 + 22, yy, 14, '#8f9bc0', 'center', FONT_H, 700);
        txt(ctx, r.pos, x0 + 52, yy, 14, tm.g, 'center', FONT_H, 900);
        txt(ctx, `${r.name}`, x0 + 82, yy, 16, '#ffffff', 'left', FONT_H, 900);
        txt(ctx, CLASSES[r.cls].name, x0 + 230, yy, 12, '#9aa6c8', 'left', FONT_H, 700);
        bar(ctx, x0 + w - 100, yy - 4, 80, 8, fr, hpColor(fr));
      });
      ctx.restore();
    }
    const p = 1 + Math.max(0, 0.6 - this.t) * 2; ctx.save(); ctx.translate(W / 2, 38); ctx.scale(p, p); glowTxt(ctx, 'VS', 0, 0, 48, '#ffffff', '#ff3d5a'); ctx.restore();
    if (this.t > 0.6 && Math.sin(this.t * 5) > -0.3) glowTxt(ctx, 'PRESS START', W / 2, H - 24, 22, '#ffffff', '#46e0ff');
  }
}

// ---------- GAME wrapper with pause
class GameScene {
  constructor(cfg, onEnd) { this.m = new Match(cfg); this.onEnd = onEnd; this.paused = false; this.sel = 0; this.overT = 0; this.speed = cfg.speed || 1; }
  update(dt) {
    const m = this.m;
    if (this.paused) {
      const items = this.pauseItems(); this.sel = navList(this.sel, items.length);
      if (Input.anyHit('start') || Input.anyHit('b')) { this.paused = false; return; }
      if (Input.anyHit('a')) { Sfx.play('ok'); const it = items[this.sel]; it.act && it.act(); }
      return;
    }
    if (Input.anyHit('start') && m.state !== 'over') { this.paused = true; this.sel = 0; Sfx.play('ok'); return; }
    if (m.hitStop > 0) { m.hitStop -= dt; m.update(dt * 0.12); return; }
    for (let i = 0; i < this.speed; i++) m.update(dt);
    if (m.over) { this.overT += dt; if (this.overT > 3.2 || (this.overT > 1 && (Input.anyHit('a') || Input.anyHit('start')))) this.onEnd(m); }
  }
  pauseItems() {
    const m = this.m, items = [{ label: 'RESUME', act: () => { this.paused = false; } }];
    for (let s = 0; s < 2; s++) if (m.ctrl[s] != null && m.state === 'pitch' && m.fld === s && m.pt.stage === 'aim') {
      const sd = m.sides[s], rp = sd.ro.bench.find(r => r.alive && r.hp > 0 && r.pos === 'RP');
      if (rp) items.push({ label: `BULLPEN: ${rp.name} IN`, act: () => { const p = m.pitcher(); const i = sd.ro.lineup.indexOf(p); sd.ro.bench.splice(sd.ro.bench.indexOf(rp), 1); rp.pos = 'P'; p.pos = 'RP'; sd.ro.lineup[i] = rp; sd.ro.bench.push(p); m.buildFielders(); this.paused = false; m.banner('PITCHING CHANGE', '#ffffff', sd.team.g, 1.2, 40, `${rp.name} TAKES THE MOUND`); } });
    }
    for (let s2 = 0; s2 < 2; s2++) if (m.ctrl[s2] != null && m.state === 'pitch' && m.fld === s2 && m.pt.stage === 'aim' && !(m.visits || {})[s2]) {
      items.push({ label: 'MOUND VISIT (+25 CELL, ONCE)', act: () => { m.visits = m.visits || {}; m.visits[s2] = true; const p = m.pitcher(); p.battery = Math.min(100, p.battery + 25); this.paused = false; m.banner('MOUND VISIT', '#ffffff', m.sides[s2].team.g, 1.2, 40, `${p.name} RECHARGED`); } });
    }
    items.push({ label: Sfx.muted ? 'SOUND: OFF' : 'SOUND: ON', act: () => Sfx.toggleMute() });
    items.push({ label: this.onQuit ? 'FORFEIT MATCH (COUNTS AS A LOSS)' : 'QUIT MATCH', act: () => { Input.twoPlayer = false; if (this.onQuit) this.onQuit(); else { Game.set(new TitleScene()); Game.scene.pressed = true; } } });
    return items;
  }
  draw(ctx) {
    drawMatch(ctx, this.m);
    if (this.m.state === 'intro') {
      const m = this.m, k = Math.min(1, (2.6 - m.timer) * 2);
      ctx.fillStyle = `rgba(4,6,16,${0.6 * (m.timer / 2.6)})`; ctx.fillRect(0, 0, W, H);
      for (let s = 0; s < 2; s++) { const tm = m.sides[s].team; ctx.save(); ctx.globalAlpha = k; drawEmblem(ctx, W / 2 + (s ? 150 : -150), 230, 60, tm); txt(ctx, tm.name, W / 2 + (s ? 150 : -150), 320, 22, '#ffffff', 'center', FONT_H, 900); ctx.restore(); }
      glowTxt(ctx, m.cfg.derby ? 'HOME RUN DERBY' : m.cfg.practice ? 'TRAINING' : 'PLAY BALL!', W / 2, 400, 50, '#ffffff', '#46e0ff');
    }
    if (this.paused) {
      ctx.fillStyle = 'rgba(3,5,14,0.7)'; ctx.fillRect(0, 0, W, H);
      glowTxt(ctx, 'PAUSED', W / 2, 120, 48, '#ffffff', '#46e0ff');
      menuList(ctx, this.pauseItems().map(i => i.label), this.sel, W / 2, 180, { w: 400 });
    }
  }
}

// ---------- RESULT
class ResultScene {
  constructor(m, g) { this.m = m; this.t = 0; this.g = g; Input.twoPlayer = false; }
  update(dt) { this.t += dt; if (this.t > 0.8 && (Input.anyHit('a') || Input.anyHit('start'))) { Sfx.play('ok'); if (this.g) this.g.next(); else { Game.set(new TitleScene()); Game.scene.pressed = true; } } }
  draw(ctx) {
    const m = this.m; drawBackdrop(ctx, this.t + 120, m.sides[1].team, 0.68);
    const w = m.winner; glowTxt(ctx, w < 0 ? 'DRAW' : 'FINAL', W / 2, 60, 46, '#ffffff', w < 0 ? '#ffffff' : m.sides[w].team.g);
    for (let s = 0; s < 2; s++) {
      const sd = m.sides[s], x = W / 2 + (s ? 60 : -60);
      drawEmblem(ctx, W / 2 + (s ? 200 : -200), 150, 46, sd.team);
      txt(ctx, sd.team.name, W / 2 + (s ? 200 : -200), 214, 20, '#ffffff', 'center', FONT_H, 900);
      glowTxt(ctx, String(m.score[s]), x, 150, 80, s === w ? '#ffffff' : '#9aa6c8', s === w ? sd.team.g : 'rgba(0,0,0,0)');
    }
    const rows = [['HITS', m.sides[0].hits, m.sides[1].hits], ['STRIKEOUTS', m.sides[0].k, m.sides[1].k], ['BOTS DESTROYED', m.sides[0].ko, m.sides[1].ko], ['CLASHES', m.events.clashes, ''], ['HOME RUNS', m.events.hr, '']];
    panel(ctx, W / 2 - 260, 250, 520, rows.length * 30 + 20, '#46e0ff', 0.8);
    rows.forEach(([k, a, b], i) => { const y = 272 + i * 30; txt(ctx, String(a), W / 2 - 200, y, 20, '#ffffff', 'center', FONT_H, 900); txt(ctx, k, W / 2, y, 14, '#9aa6c8', 'center', FONT_H, 700); txt(ctx, String(b), W / 2 + 200, y, 20, '#ffffff', 'center', FONT_H, 900); });
    if (this.g && this.g.lines) this.g.lines.forEach((l, i) => txt(ctx, l, W / 2, 432 + i * 22, i === 0 ? 20 : 15, i === 0 ? '#ffd84a' : '#c8d2f0', 'center', FONT_H, i === 0 ? 900 : 700));
    footer(ctx, 'PRESS A TO CONTINUE');
  }
}

// ---------- GAUNTLET
class GauntletHub {
  constructor() { this.t = 0; this.sel = 0; this.g = store.get(SAVE_KEY, null); if (this.g && this.g.done) this.g = null; }
  enter() { if (!this.g) Game.set(new TeamSelect('gauntlet', ([i]) => { const g = newGauntlet(i); store.set(SAVE_KEY, g); Game.set(new GauntletHub()); }, 'GAUNTLET · CHOOSE YOUR CLUB')); }
  items() { return ['PLAY NEXT MATCH', 'GARAGE', 'ABANDON RUN', 'BACK TO TITLE']; }
  update(dt) {
    this.t += dt; if (!this.g) return; const it = this.items(); this.sel = navList(this.sel, it.length);
    if (this.confirm) { if (Input.anyHit('a')) { store.del(SAVE_KEY); Game.set(new TitleScene()); Game.scene.pressed = true; } if (Input.anyHit('b')) this.confirm = false; return; }
    if (Input.anyHit('b')) { Game.set(new TitleScene()); Game.scene.pressed = true; return; }
    if (Input.anyHit('a') || Input.anyHit('start')) {
      Sfx.play('ok');
      if (this.sel === 0) this.play();
      if (this.sel === 1) Game.set(new GarageScene(this.g));
      if (this.sel === 2) this.confirm = true;
      if (this.sel === 3) { Game.set(new TitleScene()); Game.scene.pressed = true; }
    }
  }
  play() {
    const g = this.g, oppIdx = g.opp[g.stage]; const lvl = Math.floor(g.stage / 2);
    const oppUp = { pow: lvl, con: lvl, fld: lvl, fgt: lvl, arm: Math.max(0, lvl - 1), hp: g.stage === 5 ? 2 : lvl };
    const rosters = [g.roster, buildRoster(oppIdx, g.stage)];
    for (const r of rosters[1].lineup.concat(rosters[1].bench)) r.hp = maxHp(r, { up: oppUp });
    const onEnd = m => {
      const won = m.winner === 0, sd = m.sides[0];
      const runs = m.score[0], earn = (won ? 500 : 150) + runs * 60 + sd.ko * 150 + sd.k * 20 + (g.stage === 5 && won ? 1500 : 0);
      g.credits += earn; g.destroyed += sd.lost; won ? g.wins++ : g.losses++;
      // lineup changes are kept in g.roster (same objects)
      const lines = [won ? `VICTORY  +${earn} CR` : `DEFEAT  +${earn} CR`, `${runs} runs × 60 · ${sd.ko} kills × 150 · ${sd.k} K × 20${won ? ' · win bonus 500' : ' · consolation 150'}${g.stage === 5 && won ? ' · CHAMPION 1500' : ''}`];
      if (won) { g.stage++; if (g.stage >= 6) { g.done = true; lines.push('YOU WON THE IRON DIAMOND CUP!'); } }
      else { g.lives--; lines.push(g.lives > 0 ? `${g.lives} CONTINUE${g.lives > 1 ? 'S' : ''} LEFT` : 'OUT OF CONTINUES — RUN OVER'); if (g.lives <= 0) g.done = true; }
      store.set(SAVE_KEY, g);
      Game.set(new ResultScene(m, { lines, next: () => { if (g.done) { Game.set(new GauntletEnd(g)); } else Game.set(new GauntletHub()); } }));
    };
    const onQuit = () => { g.losses++; g.lives--; if (g.lives <= 0) g.done = true; store.set(SAVE_KEY, g); Game.set(g.done ? new GauntletEnd(g) : new GauntletHub()); };
    Game.set(new VsScene('1p', [g.teamIdx, oppIdx], { rosters, up: [g.up, oppUp], onEnd, onQuit }));
  }
  draw(ctx) {
    const g = this.g; if (!g) { drawBackdrop(ctx, this.t, null); return; }
    const tm = TEAMS[g.teamIdx]; drawBackdrop(ctx, this.t + 150, tm, 0.66);
    glowTxt(ctx, 'THE GAUNTLET', W / 2, 44, 36, '#ffffff', '#ff3d8a');
    panel(ctx, 30, 80, 300, 150, tm.g, 0.82);
    drawEmblem(ctx, 76, 126, 32, tm); txt(ctx, tm.city, 118, 112, 13, tm.g, 'left', FONT_H, 900); txt(ctx, tm.name, 118, 134, 20, '#ffffff', 'left', FONT_H, 900);
    txt(ctx, `CREDITS  ${g.credits}`, 48, 180, 18, '#ffd84a', 'left', FONT_H, 900);
    txt(ctx, `RECORD ${g.wins}-${g.losses}   CONTINUES ${'♦'.repeat(g.lives)}`, 48, 206, 14, '#c8d2f0', 'left', FONT_H, 700);
    // ladder
    const lx = 370, ly = 92; panel(ctx, lx - 16, 80, W - lx - 14, 150, '#46e0ff', 0.8);
    g.opp.forEach((oi, i) => { const x = lx + 30 + i * 92, y = ly + 50, o = TEAMS[oi], cur = i === g.stage; if (cur) { glow(ctx, x, y, 60, o.g, 0.6); } drawEmblem(ctx, x, y, cur ? 30 : 24, o, i < g.stage ? 0.35 : 1); txt(ctx, i === 5 ? 'FINAL' : `MATCH ${i + 1}`, x, y + 46, 11, cur ? '#ffffff' : '#8f9bc0', 'center', FONT_H, 900); txt(ctx, o.id, x, y + 62, 13, cur ? o.g : '#6c769a', 'center', FONT_H, 900); if (i < g.stage) txt(ctx, '✔', x, y, 30, '#3dffa0', 'center'); if (i < 5) { ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x + 34, y - 1, 24, 2); } });
    menuList(ctx, this.items(), this.sel, W / 2, 262, { w: 380 });
    const next = TEAMS[g.opp[g.stage]]; txt(ctx, `NEXT: ${next.city} ${next.name}`, W / 2, 490, 16, next.g, 'center', FONT_H, 900);
    if (this.confirm) { ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H); glowTxt(ctx, 'ABANDON THIS RUN?', W / 2, 240, 34, '#ffffff', '#ff3d5a'); txt(ctx, 'A YES   ·   B NO', W / 2, 300, 18, '#c8d2f0', 'center', FONT_H, 700); }
    footer(ctx, 'DAMAGE CARRIES OVER BETWEEN MATCHES — REPAIR AND UPGRADE IN THE GARAGE');
  }
}
class GauntletEnd {
  constructor(g) { this.g = g; this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 1 && (Input.anyHit('a') || Input.anyHit('start'))) { store.del(SAVE_KEY); Game.set(new TitleScene()); Game.scene.pressed = true; } }
  draw(ctx) {
    const g = this.g, tm = TEAMS[g.teamIdx], champ = g.stage >= 6; drawBackdrop(ctx, this.t + 200, tm, 0.5);
    if (champ) for (let i = 0; i < 6; i++) glow(ctx, W / 2 + Math.sin(this.t * 2 + i) * 300, 120 + Math.cos(this.t * 3 + i * 2) * 60, 60, pick([tm.g, '#ffffff', tm.p]), 0.5);
    drawEmblem(ctx, W / 2, 200, 70, tm);
    glowTxt(ctx, champ ? 'CHAMPIONS' : 'RUN OVER', W / 2, 330, 60, '#ffffff', champ ? tm.g : '#ff3d5a');
    txt(ctx, `${tm.city} ${tm.name} · ${g.wins}-${g.losses} · ${g.destroyed} bots lost`, W / 2, 390, 18, '#c8d2f0', 'center', FONT_H, 700);
    footer(ctx, 'PRESS A');
  }
}
class GarageScene {
  constructor(g, key = SAVE_KEY, back = () => new GauntletHub()) { this.g = g; this.key = key; this.back = back; this.t = 0; this.sel = 0; this.msg = ''; this.msgT = 0; }
  all() { return this.g.roster.lineup.concat(this.g.roster.bench); }
  repairCost() { const sd = { up: this.g.up }; return this.all().filter(r => r.alive).reduce((a, r) => a + Math.max(0, maxHp(r, sd) - r.hp) * 3, 0); }
  dead() { return this.all().filter(r => !r.alive); }
  items() {
    const g = this.g, list = [];
    list.push({ label: 'REPAIR ALL ARMOR', cost: this.repairCost(), act: () => { const sd = { up: g.up }; for (const r of this.all()) if (r.alive) r.hp = maxHp(r, sd); } });
    const d = this.dead(); list.push({ label: `REBUILD SCRAPPED BOTS (${d.length})`, cost: d.length * 350, act: () => { const sd = { up: g.up }; for (const r of d) { r.alive = true; r.hp = maxHp(r, sd); } } });
    for (const u of UPGRADES) { const lv = g.up[u.k] || 0; list.push({ label: u.name, desc: u.desc, lv, cost: lv >= 3 ? null : u.cost[lv], act: () => { g.up[u.k] = lv + 1; if (u.k === 'hp') for (const r of this.all()) if (r.alive) r.hp += 15; } }); }
    list.push({ label: 'DONE', cost: 0, done: true });
    return list;
  }
  update(dt) {
    this.t += dt; this.msgT -= dt; const it = this.items(); this.sel = navList(this.sel, it.length);
    if (Input.anyHit('b')) { store.set(this.key, this.g); Game.set(this.back()); return; }
    if (Input.anyHit('a') || Input.anyHit('start')) {
      const x = it[this.sel]; if (x.done) { store.set(this.key, this.g); Game.set(this.back()); return; }
      if (x.cost == null || x.cost === 0) { Sfx.play('buzz'); this.msg = x.cost == null ? 'MAXED OUT' : 'NOTHING TO DO'; this.msgT = 1.2; return; }
      if (x.cost > this.g.credits) { Sfx.play('buzz'); this.msg = 'NOT ENOUGH CREDITS'; this.msgT = 1.2; return; }
      this.g.credits -= x.cost; x.act(); Sfx.play('cash'); this.msg = 'DONE'; this.msgT = 1; store.set(this.key, this.g);
    }
  }
  draw(ctx) {
    const g = this.g, tm = TEAMS[g.teamIdx]; drawBackdrop(ctx, this.t + 170, tm, 0.75);
    glowTxt(ctx, 'GARAGE', 200, 40, 36, '#ffffff', tm.g);
    txt(ctx, `CREDITS ${g.credits}`, 200, 76, 20, '#ffd84a', 'center', FONT_H, 900);
    const it = this.items();
    it.forEach((x, i) => {
      const y = 100 + i * 40, on = i === this.sel; tapZone(20, y, 360, 34, () => { if (this.sel === i) Input.touchLatch.a = true; else { this.sel = i; Sfx.play('move'); } }); ctx.save(); rrect(ctx, 20, y, 360, 34, 6); ctx.fillStyle = on ? 'rgba(70,224,255,0.18)' : 'rgba(10,14,30,0.7)'; ctx.fill(); ctx.strokeStyle = on ? '#46e0ff' : 'rgba(120,140,200,0.2)'; ctx.stroke(); ctx.restore();
      txt(ctx, x.label, 34, y + 13, 14, '#ffffff', 'left', FONT_H, 900);
      if (x.desc) txt(ctx, x.desc, 34, y + 27, 11, '#9aa6c8', 'left', FONT_B, 700);
      if (x.lv != null) for (let k = 0; k < 3; k++) { ctx.fillStyle = k < x.lv ? tm.g : 'rgba(255,255,255,0.15)'; ctx.fillRect(250 + k * 14, y + 12, 10, 10); }
      if (!x.done) txt(ctx, x.cost == null ? 'MAX' : x.cost ? `${x.cost}` : '—', 368, y + 17, 15, x.cost && x.cost > g.credits ? '#ff6a6a' : '#ffd84a', 'right', FONT_H, 900);
    });
    if (this.msgT > 0) glowTxt(ctx, this.msg, 200, H - 22, 18, '#ffffff', '#46e0ff');
    // roster
    panel(ctx, 400, 20, 540, 500, tm.g, 0.82);
    txt(ctx, 'ROSTER', 418, 40, 14, tm.g, 'left', FONT_H, 900);
    const sd = { up: g.up };
    this.all().forEach((r, i) => {
      const y = 64 + i * 34, x = 418; const fr = r.alive ? r.hp / maxHp(r, sd) : 0;
      ctx.save(); rrect(ctx, x, y - 14, 30, 30, 4); ctx.fillStyle = hexA(tm.p, 0.3); ctx.fill(); ctx.clip(); drawRobot(ctx, x + 15, y + 26, 5, r, tm, { t: this.t }); ctx.restore();
      txt(ctx, i < 9 ? r.pos : r.pos === 'RP' ? 'RP' : 'BN', x + 52, y, 13, tm.g, 'center', FONT_H, 900);
      txt(ctx, r.name, x + 76, y - 4, 15, r.alive ? '#ffffff' : '#ff6a6a', 'left', FONT_H, 900);
      txt(ctx, `${CLASSES[r.cls].name} · P${stat(r, 'pow', sd)} C${stat(r, 'con', sd)} S${stat(r, 'spd', sd)} F${stat(r, 'fgt', sd)}`, x + 76, y + 10, 11, '#9aa6c8', 'left', FONT_B, 700);
      if (r.alive) bar(ctx, x + 380, y - 4, 120, 8, fr, hpColor(fr)); else txt(ctx, 'SCRAPPED', x + 440, y, 13, '#ff4a5a', 'center', FONT_H, 900);
    });
  }
}
class HowToScene {
  constructor() { this.t = 0; this.page = 0; }
  update(dt) { this.t += dt; if (Input.anyHit('right') || Input.anyHit('a')) { if (this.page === 2) { Game.set(new TitleScene()); Game.scene.pressed = true; return; } this.page++; Sfx.play('move'); } if (Input.anyHit('left') && this.page > 0) { this.page--; Sfx.play('move'); } if (Input.anyHit('b')) { Game.set(new TitleScene()); Game.scene.pressed = true; } }
  draw(ctx) {
    drawBackdrop(ctx, this.t + 240, null, 0.78);
    const pages = [
      ['BATTING & PITCHING', ['BATTER  ←/→ shift so the rings cover the pitch (solid = contact, dashed = power)', 'A  contact swing — wider sweet spot', 'B  power swing — smaller window, much harder hit', 'HOLD ↓  square up to bunt: the bat meets the ball by itself', 'Timing: swing early to pull, late to go the other way. High pitches fly, low pitches bounce.', '', 'PITCHER  D-pad aims, B cycles pitch, A throws', 'Hold ←/→ while the ball is in the air to steer it', 'PLASMA ball wobbles and is fast, but drains 14 power cell'], '#46e0ff'],
      ['FIELDING & RUNNING', ['You control the fielder nearest the ball (the one with the ring)', 'Fly balls show a yellow landing ring — get under it to catch', 'With the ball: hold a direction + A to throw', '→ first   ↑ second   ← third   ↓ home   (no direction = smart throw)', 'Run onto a base or into a runner to make the out yourself', '', 'ON OFFENSE  A sends runners on, B sends them back, ↑ STEALS during the windup', 'Runners go automatically on grounders and wait on fly balls', 'PICKOFF on the pitch rail catches runners taking a BIG LEAD', 'FIELDING / BASE RUNNING (Settings): ASSIST or AUTO do it for you'], '#3dffa0'],
      ['CLASH & THE GAUNTLET', ['A close play at a base becomes a CLASH: a 9-second brawl', '←/→ move   A strike   B heavy (breaks guard)   ↓ guard', 'Runner wins: SAFE.  Fielder wins: OUT.  Out of time: most damage wins', 'Armor damage is permanent. Hit 0 and the bot is DESTROYED and replaced', 'OVERDRIVE: good plays fill the meter under your score; full = a special ability', '', 'SEASON  11 rounds vs every club, top 4 make the playoffs', 'GAUNTLET  beat 5 clubs and the final with 3 continues', 'Credits from wins, runs, Ks and kills buy GARAGE repairs and upgrades'], '#ff3d8a'],
    ];
    const [title, lines, col] = pages[this.page];
    glowTxt(ctx, title, W / 2, 60, 34, '#ffffff', col);
    panel(ctx, 80, 100, W - 160, 370, col, 0.82);
    lines.forEach((l, i) => txt(ctx, l, 110, 130 + i * 36, 18, l === l.toUpperCase() && l ? '#ffffff' : '#c8d2f0', 'left', FONT_B, 700));
    footer(ctx, `PAGE ${this.page + 1} / 3   ·   → / A NEXT   ← BACK   B EXIT`);
  }
}
class SettingsScene {
  constructor() { this.t = 0; this.sel = 0; }
  rows() {
    const s = Game.settings, cyc = (k, o) => d => { s[k] = o[(o.indexOf(s[k]) + d + o.length) % o.length]; };
    return [
      { label: 'INNINGS', value: String(s.innings), ch: cyc('innings', [3, 5, 7, 9]) },
      { label: 'DIFFICULTY', value: DIFF_NAMES[s.diff], ch: d => { s.diff = (s.diff + d + 3) % 3; } },
      { label: 'FIELDING', value: s.field.toUpperCase(), ch: cyc('field', ['assist', 'auto', 'manual']), help: 'ASSIST: chases when you let go · AUTO: CPU fields, you can take over' },
      { label: 'BASE RUNNING', value: s.run.toUpperCase(), ch: cyc('run', ['auto', 'manual']), help: 'AUTO: runners take smart extra bases · A / B still override' },
      { label: 'TIMING METER', value: s.meter ? 'ON' : 'OFF', ch: () => { s.meter = !s.meter; }, help: 'Shows the swing window while you bat' },
      { label: 'CLASHES', value: s.clash ? 'ON' : 'OFF', ch: () => { s.clash = !s.clash; } },
      { label: 'EFFECTS', value: s.fx.toUpperCase(), ch: cyc('fx', ['auto', 'high', 'low']), help: 'AUTO lowers glow and light effects on slow phones' },
      { label: 'SOUND', value: Sfx.muted ? 'OFF' : 'ON', ch: () => Sfx.toggleMute() },
      { label: 'MUSIC', value: s.music ? 'ON' : 'OFF', ch: () => { s.music = !s.music; } },
      { label: 'VIBRATION', value: s.haptics ? 'ON' : 'OFF', ch: () => { s.haptics = !s.haptics; } },
      { label: 'BACK', back: true },
    ];
  }
  update(dt) {
    this.t += dt; const rows = this.rows(); this.sel = navList(this.sel, rows.length);
    const d = Input.anyHit('right') || Input.anyHit('a') ? 1 : Input.anyHit('left') ? -1 : 0;
    if (Input.anyHit('b') || (rows[this.sel].back && Input.anyHit('a'))) { Game.save(); Game.set(new TitleScene()); Game.scene.pressed = true; return; }
    if (d && rows[this.sel].ch) { Sfx.play('move'); rows[this.sel].ch(d); Game.save(); }
  }
  draw(ctx) {
    drawBackdrop(ctx, this.t + 300, null, 0.72); glowTxt(ctx, 'SETTINGS', W / 2, 36, 32, '#ffffff', '#46e0ff');
    const rows = this.rows(); menuList(ctx, rows, this.sel, W / 2, 62, { w: 460, h: 34 });
    footer(ctx, rows[this.sel].help || '←/→ OR TAP TO CHANGE   ·   B BACK');
  }
}

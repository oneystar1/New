// IRON DIAMOND — Season: an 11-round round robin against every club, standings, top-4 playoffs.
'use strict';
const SEASON_KEY = 'ironDiamond.season.v1';
function roundRobin(n) { // circle method: n-1 rounds of n/2 pairings
  const ids = [...Array(n).keys()], rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pr = []; for (let i = 0; i < n / 2; i++) { const a = ids[i], b = ids[n - 1 - i]; pr.push((r + i) % 2 ? [a, b] : [b, a]); } // [away, home]
    rounds.push(pr); ids.splice(1, 0, ids.pop());
  }
  return rounds;
}
function poisson(l) { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }
function simScore(a, b, upA = {}, upB = {}) {
  const ra = ratingOf(a), rb = ratingOf(b), bo = (r, up) => (r.pow + (up.pow || 0) + r.con + (up.con || 0) + (r.spd + (up.spd || 0)) * 0.5) / 2.5, df = (r, up) => r.fld + ((up.arm || 0) + (up.fgt || 0)) * 0.4;
  let sa = poisson(clamp(3.8 + (bo(ra, upA) - df(rb, upB)) * 0.8, 1.2, 9)), sb = poisson(clamp(4.0 + (bo(rb, upB) - df(ra, upA)) * 0.8, 1.2, 9));
  while (sa === sb) { if (Math.random() < 0.5) sa++; else sb++; }
  return [sa, sb];
}
function newSeason(teamIdx) {
  return { teamIdx, roster: buildRoster(teamIdx), credits: 600, up: {}, round: 0, sched: roundRobin(12), rec: TEAMS.map(() => ({ w: 0, l: 0, rf: 0, ra: 0, last: [] })), mine: [], phase: 'season', po: null, done: false, destroyed: 0 };
}
function seasonTable(S) { return TEAMS.map((t, i) => ({ i, ...S.rec[i] })).sort((a, b) => (b.w - a.w) || ((b.rf - b.ra) - (a.rf - a.ra)) || (b.rf - a.rf)); }
function applyResult(S, away, home, sa, sh) {
  const A = S.rec[away], B = S.rec[home]; A.rf += sa; A.ra += sh; B.rf += sh; B.ra += sa;
  if (sa > sh) { A.w++; B.l++; A.last.push('W'); B.last.push('L'); } else { B.w++; A.l++; B.last.push('W'); A.last.push('L'); }
  A.last = A.last.slice(-5); B.last = B.last.slice(-5);
}
// what the player plays next: {opp, home (bool), label}
function nextFixture(S) {
  if (S.phase === 'season') { const g = S.sched[S.round].find(p => p.includes(S.teamIdx)); return { away: g[0], home: g[1], label: `ROUND ${S.round + 1} OF 11` }; }
  if (S.phase === 'semis') { const g = S.po.semis.find(p => p.includes(S.teamIdx)); return { away: g[1], home: g[0], label: 'SEMIFINAL' }; }
  if (S.phase === 'final') return { away: S.po.final[1], home: S.po.final[0], label: 'IRON DIAMOND SERIES · FINAL' };
  return null;
}
// record the player's game (won or lost) and simulate everything else in that round
function finishFixture(S, fx, sa, sh) {
  const me = S.teamIdx, won = (fx.away === me) === (sa > sh);
  S.mine.push({ label: fx.label, opp: fx.away === me ? fx.home : fx.away, home: fx.home === me, us: fx.home === me ? sh : sa, them: fx.home === me ? sa : sh, won });
  if (S.phase === 'season') {
    applyResult(S, fx.away, fx.home, sa, sh);
    for (const g of S.sched[S.round]) if (!g.includes(me)) { const [a, b] = simScore(g[0], g[1]); applyResult(S, g[0], g[1], a, b); }
    S.round++;
    if (S.round >= 11) {
      const tb = seasonTable(S), seeds = tb.slice(0, 4).map(r => r.i);
      S.po = { seeds, semis: [[seeds[0], seeds[3]], [seeds[1], seeds[2]]], final: null, champ: null };
      if (seeds.includes(me)) S.phase = 'semis'; else { simPlayoffs(S); S.phase = 'over'; S.done = true; S.missed = true; }
    }
  } else if (S.phase === 'semis') {
    const winners = S.po.semis.map(p => { if (p.includes(me)) return won ? me : p.find(x => x !== me); const [a, b] = simScore(p[1], p[0]); return a > b ? p[1] : p[0]; });
    S.po.semiWinners = winners;
    if (won) { S.po.final = [winners[0], winners[1]].sort((x, y) => S.po.seeds.indexOf(x) - S.po.seeds.indexOf(y)); S.phase = 'final'; }
    else { const f = winners; const [a, b] = simScore(f[1], f[0]); S.po.final = f; S.po.champ = a > b ? f[1] : f[0]; S.phase = 'over'; S.done = true; }
  } else if (S.phase === 'final') { S.po.champ = won ? me : (fx.away === me ? fx.home : fx.away); S.phase = 'over'; S.done = true; }
  return won;
}
function simPlayoffs(S) { const w = S.po.semis.map(p => { const [a, b] = simScore(p[1], p[0]); return a > b ? p[1] : p[0]; }); S.po.semiWinners = w; S.po.final = w; const [a, b] = simScore(w[1], w[0]); S.po.champ = a > b ? w[1] : w[0]; }

class SeasonHub {
  constructor() { this.t = 0; this.sel = 0; this.S = store.get(SEASON_KEY, null); if (this.S && this.S.done) this.S = null; this.msg = ''; this.msgT = 0; }
  enter() { if (!this.S) Game.set(new TeamSelect('gauntlet', ([i]) => { store.set(SEASON_KEY, newSeason(i)); Game.set(new SeasonHub()); }, 'SEASON · CHOOSE YOUR CLUB')); }
  items() { return ['PLAY NEXT GAME', 'SIM NEXT GAME', 'STANDINGS', 'GARAGE', 'ABANDON SEASON', 'BACK TO TITLE']; }
  update(dt) {
    this.t += dt; this.msgT -= dt; if (!this.S) return;
    if (this.confirm) { if (Input.anyHit('a')) { store.del(SEASON_KEY); Game.set(new TitleScene()); Game.scene.pressed = true; } if (Input.anyHit('b')) this.confirm = false; return; }
    this.sel = navList(this.sel, 6);
    if (Input.anyHit('b')) { Game.set(new TitleScene()); Game.scene.pressed = true; return; }
    if (Input.anyHit('a') || Input.anyHit('start')) {
      Sfx.play('ok');
      if (this.sel === 0) this.play();
      if (this.sel === 1) this.sim();
      if (this.sel === 2) Game.set(new StandingsScene(this.S, () => new SeasonHub()));
      if (this.sel === 3) Game.set(new GarageScene(this.S, SEASON_KEY, () => new SeasonHub()));
      if (this.sel === 4) this.confirm = true;
      if (this.sel === 5) { Game.set(new TitleScene()); Game.scene.pressed = true; }
    }
  }
  after(won, earn, extra) { const S = this.S; S.credits += earn; store.set(SEASON_KEY, S); return S.done ? new SeasonEnd(S) : new SeasonHub(); }
  sim() {
    const S = this.S, fx = nextFixture(S), me = S.teamIdx, [sa, sh] = simScore(fx.away, fx.home, fx.away === me ? S.up : {}, fx.home === me ? S.up : {});
    // a simulated game still wears the roster down
    const all = S.roster.lineup.filter(r => r.alive); for (let i = 0; i < 3; i++) { const r = pick(all); r.hp = Math.max(1, r.hp - rint(5, 15)); }
    const won = finishFixture(S, fx, sa, sh), earn = won ? 300 : 100;
    S.credits += earn; store.set(SEASON_KEY, S); Sfx.play(won ? 'cash' : 'buzz');
    const opp = TEAMS[fx.away === me ? fx.home : fx.away], us = fx.home === me ? sh : sa, them = fx.home === me ? sa : sh;
    if (S.done) { Game.set(new SeasonEnd(S)); return; }
    this.msg = `${won ? 'WIN' : 'LOSS'} ${us}-${them} vs ${opp.name}  ·  +${earn} CR`; this.msgT = 3; this.sel = 0;
  }
  play() {
    const S = this.S, fx = nextFixture(S), me = S.teamIdx, myHome = fx.home === me;
    const teams = [fx.away, fx.home], rosters = teams.map(i => i === me ? S.roster : buildRoster(i, S.round + 7));
    const up = teams.map(i => i === me ? S.up : {});
    const onEnd = m => {
      const mySide = myHome ? 1 : 0, sd = m.sides[mySide], won = m.winner === mySide;
      let a = m.score[0], h = m.score[1]; if (a === h) { if (won) { myHome ? h++ : a++; } else { myHome ? a++ : h++; } } // draws can't stand in a season
      const earn = (won ? 500 : 150) + m.score[mySide] * 60 + sd.ko * 150 + sd.k * 20 + (fx.label.includes('FINAL') && won ? 1500 : 0);
      S.destroyed += sd.lost; finishFixture(S, fx, a, h); S.credits += earn; store.set(SEASON_KEY, S);
      const lines = [won ? `VICTORY  +${earn} CR` : `DEFEAT  +${earn} CR`, `${fx.label} · RECORD ${S.rec[me].w}-${S.rec[me].l}`];
      if (S.phase === 'semis' && fx.label.startsWith('ROUND')) lines.push('YOU MADE THE PLAYOFFS!');
      Game.set(new ResultScene(m, { lines, next: () => Game.set(S.done ? new SeasonEnd(S) : new SeasonHub()) }));
    };
    const ctrl = myHome ? [null, 0] : [0, null];
    Game.set(new VsScene('1p', teams, { rosters, up, onEnd, ctrl, onQuit: () => { finishFixture(S, fx, myHome ? 9 : 0, myHome ? 0 : 9); store.set(SEASON_KEY, S); Game.set(S.done ? new SeasonEnd(S) : new SeasonHub()); } }));
  }
  draw(ctx) {
    const S = this.S; if (!S) { drawBackdrop(ctx, this.t, null); return; }
    const tm = TEAMS[S.teamIdx], me = S.teamIdx, rec = S.rec[me], fx = nextFixture(S); drawBackdrop(ctx, this.t + 400, tm, 0.66);
    if (this.msgT > 0) glowTxt(ctx, this.msg, W / 2, 40, 24, '#ffffff', this.msg.startsWith('WIN') ? '#3dffa0' : '#ff3d5a'); else glowTxt(ctx, '2087 SEASON', W / 2, 40, 34, '#ffffff', '#46e0ff');
    panel(ctx, 24, 76, 290, 168, tm.g, 0.84);
    drawEmblem(ctx, 68, 120, 30, tm); txt(ctx, tm.city, 108, 108, 12, tm.g, 'left', FONT_H, 900); txt(ctx, tm.name, 108, 130, tm.name.length > 11 ? 15 : 20, '#ffffff', 'left', FONT_H, 900);
    const rank = seasonTable(S).findIndex(r => r.i === me) + 1;
    txt(ctx, `${rec.w}-${rec.l}`, 40, 178, 34, '#ffffff', 'left', FONT_H, 900); txt(ctx, `${rank}${['ST', 'ND', 'RD'][rank - 1] || 'TH'} PLACE`, 150, 172, 14, rank <= 4 ? '#3dffa0' : '#c8d2f0', 'left', FONT_H, 900);
    txt(ctx, `RUN DIFF ${rec.rf - rec.ra >= 0 ? '+' : ''}${rec.rf - rec.ra}`, 150, 190, 12, '#9aa6c8', 'left', FONT_H, 700);
    txt(ctx, `CREDITS ${S.credits}`, 40, 224, 16, '#ffd84a', 'left', FONT_H, 900);
    // next game card
    if (fx) { const opp = TEAMS[fx.away === me ? fx.home : fx.away]; panel(ctx, 330, 76, 370, 168, opp.g, 0.84); txt(ctx, fx.label, 515, 98, 13, '#9aa6c8', 'center', FONT_H, 900); drawEmblem(ctx, 420, 160, 34, tm); drawEmblem(ctx, 610, 160, 34, opp); glowTxt(ctx, fx.home === me ? 'VS' : '@', 515, 160, 30, '#ffffff', '#ff3d5a'); txt(ctx, fx.home === me ? 'HOME' : 'AWAY', 420, 212, 12, '#c8d2f0', 'center', FONT_H, 900); txt(ctx, opp.name, 610, 212, opp.name.length > 11 ? 11 : 14, '#ffffff', 'center', FONT_H, 900); txt(ctx, `${S.rec[TEAMS.indexOf(opp)].w}-${S.rec[TEAMS.indexOf(opp)].l}`, 610, 230, 12, '#9aa6c8', 'center', FONT_H, 700); }
    // recent results
    panel(ctx, 716, 76, 220, 168, '#46e0ff', 0.84); txt(ctx, 'RECENT', 732, 96, 12, '#46e0ff', 'left', FONT_H, 900);
    S.mine.slice(-6).reverse().forEach((g, i) => { const y = 120 + i * 21; txt(ctx, g.won ? 'W' : 'L', 734, y, 14, g.won ? '#3dffa0' : '#ff6a6a', 'left', FONT_H, 900); txt(ctx, `${g.us}-${g.them}`, 756, y, 14, '#ffffff', 'left', FONT_H, 700); txt(ctx, `${g.home ? 'vs' : '@'} ${TEAMS[g.opp].id}`, 820, y, 13, '#c8d2f0', 'left', FONT_H, 700); });
    if (!S.mine.length) txt(ctx, 'NO GAMES YET', 826, 160, 13, '#6c769a', 'center', FONT_H, 700);
    menuList(ctx, this.items(), this.sel, W / 2, 262, { w: 380, h: 36 });
    footer(ctx, 'TOP 4 AFTER 11 ROUNDS MAKE THE PLAYOFFS · DAMAGE CARRIES OVER');
    if (this.confirm) { ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H); glowTxt(ctx, 'ABANDON THIS SEASON?', W / 2, 240, 34, '#ffffff', '#ff3d5a'); txt(ctx, 'A YES   ·   B NO', W / 2, 300, 18, '#c8d2f0', 'center', FONT_H, 700); }
  }
}
class StandingsScene {
  constructor(S, back) { this.S = S; this.back = back; this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 0.3 && (Input.anyHit('a') || Input.anyHit('b') || Input.anyHit('start'))) { Sfx.play('back'); Game.set(this.back()); } }
  draw(ctx) {
    const S = this.S, me = S.teamIdx; drawBackdrop(ctx, this.t + 500, TEAMS[me], 0.8);
    glowTxt(ctx, 'STANDINGS', W / 2, 34, 30, '#ffffff', '#46e0ff');
    const x = 130, w = 700, top = 62; panel(ctx, x, top, w, 448, '#46e0ff', 0.86);
    const cols = [['CLUB', x + 70, 'left'], ['W', x + 420, 'center'], ['L', x + 470, 'center'], ['PCT', x + 530, 'center'], ['GB', x + 590, 'center'], ['RD', x + 645, 'center']];
    for (const [l, cx, al] of cols) txt(ctx, l, cx, top + 20, 12, '#9aa6c8', al, FONT_H, 900);
    const tb = seasonTable(S), lead = tb[0];
    tb.forEach((r, i) => {
      const y = top + 46 + i * 33, tm = TEAMS[r.i], mine = r.i === me;
      if (mine) { ctx.fillStyle = hexA(tm.g, 0.18); ctx.fillRect(x + 6, y - 15, w - 12, 30); }
      if (i === 4) { ctx.strokeStyle = '#3dffa0'; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(x + 10, y - 16.5); ctx.lineTo(x + w + 4, y - 16.5); ctx.stroke(); ctx.setLineDash([]); txt(ctx, 'PLAYOFF', x + w + 8, y - 22, 10, '#3dffa0', 'left', FONT_H, 900); txt(ctx, 'LINE', x + w + 8, y - 10, 10, '#3dffa0', 'left', FONT_H, 900); }
      txt(ctx, String(i + 1), x + 24, y, 15, '#9aa6c8', 'center', FONT_H, 900); drawEmblem(ctx, x + 52, y, 11, tm);
      txt(ctx, `${tm.city} ${tm.name}`, x + 70, y, 14, mine ? '#ffffff' : '#c8d2f0', 'left', FONT_H, mine ? 900 : 700);
      const gp = r.w + r.l, gb = ((lead.w - r.w) + (r.l - lead.l)) / 2, rd = r.rf - r.ra;
      txt(ctx, String(r.w), x + 420, y, 15, '#ffffff', 'center', FONT_H, 900); txt(ctx, String(r.l), x + 470, y, 15, '#ffffff', 'center', FONT_H, 900);
      txt(ctx, gp ? (r.w / gp).toFixed(3).replace(/^0/, '') : '.000', x + 530, y, 14, '#c8d2f0', 'center', FONT_H, 700);
      txt(ctx, gb ? String(gb) : '—', x + 590, y, 14, '#c8d2f0', 'center', FONT_H, 700);
      txt(ctx, (rd > 0 ? '+' : '') + rd, x + 645, y, 14, rd > 0 ? '#3dffa0' : rd < 0 ? '#ff6a6a' : '#c8d2f0', 'center', FONT_H, 700);
    });
    footer(ctx, `AFTER ROUND ${Math.min(S.round, 11)} OF 11   ·   A / B BACK`);
  }
}
class SeasonEnd {
  constructor(S) { this.S = S; this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 1 && (Input.anyHit('a') || Input.anyHit('start'))) { store.del(SEASON_KEY); Game.set(new TitleScene()); Game.scene.pressed = true; } }
  draw(ctx) {
    const S = this.S, me = S.teamIdx, champ = S.po && S.po.champ, ct = TEAMS[champ ?? me], mine = champ === me; drawBackdrop(ctx, this.t + 600, ct, 0.5);
    if (mine) for (let i = 0; i < 8; i++) glow(ctx, W / 2 + Math.sin(this.t * 2 + i) * 320, 120 + Math.cos(this.t * 3 + i * 2) * 60, 60, pick([ct.g, '#ffffff', ct.p]), 0.5);
    drawEmblem(ctx, W / 2, 190, 70, ct);
    glowTxt(ctx, mine ? 'SERIES CHAMPIONS' : S.missed ? 'MISSED THE PLAYOFFS' : 'SEASON OVER', W / 2, 310, mine ? 52 : 44, '#ffffff', mine ? ct.g : '#ff3d5a');
    txt(ctx, `${ct.city} ${ct.name} ${mine ? 'WIN' : 'WON'} THE IRON DIAMOND SERIES`, W / 2, 360, 18, '#c8d2f0', 'center', FONT_H, 700);
    const r = S.rec[me]; txt(ctx, `${TEAMS[me].name} · REGULAR SEASON ${r.w}-${r.l} · ${S.destroyed} BOTS LOST`, W / 2, 392, 15, '#9aa6c8', 'center', FONT_H, 700);
    footer(ctx, 'PRESS A');
  }
}

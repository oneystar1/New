// Pre-game lineup card: each team's defensive formation with labels.
import { W, H, text, rect } from '../gfx.js';
import { drawFormation, drawBattingOrder } from '../render/formation.js';
import { sfx } from '../audio.js';

export class LineupScene {
  constructor(game, opts) {
    this.game = game; this.opts = opts; this.t = 0;
    this.teams = [opts.home, opts.away];   // home fields first
    this.idx = 0; this.showOrder = false;
    this.autoTimer = opts.controllers.every(c => c === 'cpu') ? 3.5 : 0;
  }
  update(input) {
    this.t += 1 / 60;
    const any = input.any;
    if (any.pressed.left || any.pressed.right) { this.idx = 1 - this.idx; sfx.menuMove(); }
    if (any.pressed.b) { this.showOrder = !this.showOrder; sfx.menuMove(); }
    if (this.autoTimer) { this.autoTimer -= 1 / 60; if (this.autoTimer <= 0) { if (this.idx === 0) { this.idx = 1; this.autoTimer = 3.5; } else this.start(); } }
    if (any.pressed.a || any.pressed.start) {
      sfx.menuSelect();
      if (this.idx === 0) this.idx = 1; else this.start();
    }
  }
  start() { this.game.goto('game', this.opts); }
  draw() {
    const team = this.teams[this.idx];
    const side = this.idx === 0 ? 'HOME' : 'AWAY';
    drawFormation(team, { title: `${team.city} ${team.name}`.toUpperCase(), subtitle: `${side} DEFENSE`, t: this.t });
    if (this.showOrder) { rect(0, 17, W, H - 17, 'rgba(0,0,0,0.55)'); drawBattingOrder(team, W / 2 - 100, 28); }
    rect(0, H - 10, W, 10, 'rgba(0,0,0,0.75)');
    text((this.idx === 0 ? 'A: NEXT TEAM  ' : 'A: PLAY BALL!  ') + (this.showOrder ? 'B: FORMATION' : 'B: BATTING ORDER') + '  </>: FLIP', W / 2, H - 8, { align: 'center', color: '#fff' });
  }
}

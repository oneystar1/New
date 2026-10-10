import { W, H, ctx, rect, text, panel } from '../gfx.js';
import { Match } from '../game/rules.js';
import { Play } from '../game/play.js';
import { drawBatView } from '../render/batview.js';
import { drawFieldView, resetCamera } from '../render/fieldview.js';
import { drawHud } from '../render/hud.js';
import { drawFormation } from '../render/formation.js';
import { sfx } from '../audio.js';

export class GameScene {
  constructor(game, opts) {
    this.game = game;
    this.match = new Match(opts.away, opts.home, { innings: opts.innings, controllers: opts.controllers });
    this.play = new Play(this.match, game.input);
    this.paused = false; this.t = 0; this.overTimer = 0; this.pauseSel = 0;
    this.lastFieldView = false;
  }
  update(input) {
    this.t += 1 / 60;
    const any = input.any;
    if (any.pressed.start) { this.paused = !this.paused; sfx.menuSelect(); }
    if (this.paused) {
      if (any.pressed.up || any.pressed.down) { this.pauseSel = 1 - this.pauseSel; sfx.menuMove(); }
      if (any.pressed.a) { if (this.pauseSel === 0) this.paused = false; else this.game.goto('title'); }
      return;
    }
    if (this.play.phase === 'gameover') {
      this.overTimer += 1 / 60;
      if (this.overTimer > 1.5 && (any.pressed.a || any.pressed.start)) this.game.goto('result', { match: this.match });
      if (this.overTimer > 6) this.game.goto('result', { match: this.match });
    }
    this.play.update();
    if (this.play.fieldView && !this.lastFieldView) resetCamera();
    this.lastFieldView = this.play.fieldView;
    this.play.events.length = 0;
  }
  draw() {
    if (this.play.phase === 'sidechange') {
      const m = this.match, ft = m.teams[m.fieldingTeam];
      drawFormation(ft, { title: `${ft.city} ${ft.name} TAKE THE FIELD`.toUpperCase(), subtitle: m.inningLabel(), t: this.t });
    } else if (this.play.fieldView) drawFieldView(this.play); else drawBatView(this.play);
    drawHud(this.play);
    if (this.paused) {
      rect(0, 0, W, H, 'rgba(0,0,0,0.5)');
      panel(W / 2 - 50, 90, 100, 44);
      text('PAUSED', W / 2, 96, { align: 'center', color: '#ffd84a' });
      text('RESUME', W / 2, 110, { align: 'center', color: this.pauseSel === 0 ? '#ffd84a' : '#fff' });
      text('QUIT TO TITLE', W / 2, 121, { align: 'center', color: this.pauseSel === 1 ? '#ffd84a' : '#fff' });
    }
  }
}

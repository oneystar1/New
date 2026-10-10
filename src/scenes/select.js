import { W, H, ctx, rect, text, misc, head, panel, rgb, player } from '../gfx.js';
import { TEAMS } from '../data/teams.js';
import { SPECIES, TYPE_COLORS } from '../data/pokemon.js';
import { getComposite, prebuildTeam } from '../assets.js';
import { sfx } from '../audio.js';

export class SelectScene {
  constructor(game, opts) {
    this.game = game; this.opts = opts; this.t = 0;
    this.picks = [0, 1];          // team index for away (P1) / home (P2 or CPU)
    this.step = 0;                // 0 = picking away, 1 = picking home, 2 = done
    this.who = opts.mode === '2p' ? [0, 1] : [0, 0];  // which input slot picks each side
    if (opts.mode === 'cpu') { this.picks = [Math.floor(Math.random() * 4), 0]; this.picks[1] = (this.picks[0] + 1 + Math.floor(Math.random() * 3)) % 4; this.step = 2; this.timer = 0.5; }
  }
  update(input) {
    this.t += 1 / 60;
    if (this.step === 2) {
      this.timer -= 1 / 60;
      if (this.timer <= 0) this.start();
      return;
    }
    const inp = this.opts.mode === '2p' ? input.p(this.who[this.step]) : input.any;
    if (inp.pressed.left) { this.picks[this.step] = (this.picks[this.step] + 3) % 4; sfx.menuMove(); }
    if (inp.pressed.right) { this.picks[this.step] = (this.picks[this.step] + 1) % 4; sfx.menuMove(); }
    if (inp.pressed.b && this.step === 1) { this.step = 0; sfx.menuMove(); return; }
    if (inp.pressed.b && this.step === 0) { this.game.goto('title'); return; }
    if (inp.pressed.a || inp.pressed.start) {
      sfx.menuSelect();
      if (this.step === 0) { this.step = 1; if (this.picks[1] === this.picks[0]) this.picks[1] = (this.picks[0] + 1) % 4; }
      else { this.step = 2; this.timer = 0.6; }
    }
  }
  start() {
    const away = TEAMS[this.picks[0]], home = TEAMS[this.picks[1]];
    prebuildTeam(away); prebuildTeam(home);
    const controllers = this.opts.mode === '1p' ? ['human0', 'cpu'] : this.opts.mode === '2p' ? ['human0', 'human1'] : ['cpu', 'cpu'];
    this.game.goto('game', { away, home, innings: this.opts.innings, controllers });
  }
  draw() {
    rect(0, 0, W, H, '#1a2a4c');
    for (let y = 0; y < H; y += 8) rect(0, y, W, 4, '#1e305a');
    text('CHOOSE YOUR TEAMS', W / 2, 8, { align: 'center', scale: 1, color: '#ffd84a', shadow: '#000' });
    const labels = [this.opts.mode === 'cpu' ? 'CPU (AWAY)' : 'PLAYER 1 (AWAY)', this.opts.mode === '2p' ? 'PLAYER 2 (HOME)' : 'CPU (HOME)'];
    for (let side = 0; side < 2; side++) {
      const x = 6 + side * 158;
      const team = TEAMS[this.picks[side]];
      const active = this.step === side;
      panel(x, 22, 150, 196, 'rgba(10,10,30,0.8)', active ? '#ffd84a' : '#777');
      text(labels[side], x + 75, 26, { align: 'center', color: active ? '#ffd84a' : '#aaa' });
      rect(x + 4, 36, 142, 14, rgb(team.colors.primary));
      text(`${team.city} ${team.name}`, x + 75, 40, { align: 'center', color: '#fff', shadow: '#000' });
      if (active) { text('<', x + 6, 40, { color: '#fff' }); text('>', x + 138, 40, { color: '#fff' }); }
      // roster
      team.roster.forEach((r, i) => {
        const sp = SPECIES[r.species];
        const y = 54 + i * 15;
        head(r.species, x + 6, y - 2);
        text(`${r.pos}`, x + 25, y + 2, { color: '#ccc' });
        text(sp.name, x + 44, y + 2, { color: '#fff' });
        // tiny power/contact/speed bars
        rect(x + 112, y + 1, 30, 2, '#333'); rect(x + 112, y + 1, Math.round(sp.power * 0.3), 2, '#ff7a4a');
        rect(x + 112, y + 4, 30, 2, '#333'); rect(x + 112, y + 4, Math.round(sp.contact * 0.3), 2, '#5ad66a');
        rect(x + 112, y + 7, 30, 2, '#333'); rect(x + 112, y + 7, Math.round(sp.speed * 0.3), 2, '#5aa0ff');
      });
      // showcase sprite
      const comp = getComposite(team.roster[0].species, team);
      player(comp, Math.floor(this.t * 2) % 2 ? 'bat_stance' : 'bat_load', x + 128, 212, 1);
    }
    text('POW', 116, 196, { color: '#ff7a4a' }); text('CON', 116, 204, { color: '#5ad66a' }); text('SPD', 116, 212, { color: '#5aa0ff' });
    const hint = this.step === 2 ? 'PLAY BALL!' : 'LEFT/RIGHT CHOOSE  A CONFIRM  B BACK';
    text(hint, W / 2, 226, { align: 'center', color: '#fff', shadow: '#000' });
  }
}

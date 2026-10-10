import { W, H, ctx, rect, text, misc, head, panel, rgb } from '../gfx.js';
import { TEAMS } from '../data/teams.js';
import { sfx } from '../audio.js';

const MENU = ['1P VS CPU', '2P VERSUS', 'WATCH CPU VS CPU'];
const INNING_OPTS = [3, 6, 9];

export class TitleScene {
  constructor(game) { this.game = game; this.t = 0; this.sel = 0; this.innSel = 0; this.parade = []; 
    const all = TEAMS.flatMap(t => t.roster.map(r => r.species));
    for (let i = 0; i < 12; i++) this.parade.push({ s: all[(i * 7) % all.length], x: i * 30, phase: i });
  }
  update(input) {
    this.t += 1 / 60;
    const a = input.any;
    if (a.pressed.up) { this.sel = (this.sel + MENU.length) % (MENU.length + 1); sfx.menuMove(); }
    if (a.pressed.down) { this.sel = (this.sel + 1) % (MENU.length + 1); sfx.menuMove(); }
    if (this.sel === MENU.length && (a.pressed.left || a.pressed.right)) { this.innSel = (this.innSel + (a.pressed.left ? 2 : 1)) % 3; sfx.menuMove(); }
    if (a.pressed.a || a.pressed.start) {
      if (this.sel < MENU.length) {
        sfx.menuSelect();
        const modes = ['1p', '2p', 'cpu'];
        this.game.goto('select', { mode: modes[this.sel], innings: INNING_OPTS[this.innSel] });
      } else { this.innSel = (this.innSel + 1) % 3; sfx.menuMove(); }
    }
  }
  draw() {
    // sky + field backdrop
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a2a6c'); g.addColorStop(0.6, '#4a7bd0'); g.addColorStop(1, '#2d8a2d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let y = 150; y < H; y += 6) rect(0, y, W, 6, ((y / 6) | 0) % 2 ? '#3f9b3f' : '#45a845');
    rect(0, 146, W, 4, '#f0d44a');
    // title
    text('POKE', W / 2 - 64, 30, { scale: 3, align: 'center', color: '#ffd84a', shadow: '#5a2a00' });
    misc('pokeball', W / 2 - 6, 28 + Math.sin(this.t * 4) * 2, 2);
    text('BALL PARK', W / 2 + 10, 58, { scale: 2, align: 'center', color: '#fff', shadow: '#1a2a6c' });
    text('SLUGFEST OF THE KANTO LEAGUE', W / 2, 84, { align: 'center', color: '#cde', shadow: '#000' });
    // parade of heads running across the field
    for (const p of this.parade) {
      const x = ((p.x + this.t * 28) % (W + 40)) - 20;
      const y = 112 + Math.abs(Math.sin(this.t * 6 + p.phase)) * -6;
      head(p.s, x, y, 2);
    }
    // menu
    panel(W / 2 - 70, 160, 140, 62);
    MENU.forEach((mi, i) => text(mi, W / 2, 166 + i * 12, { align: 'center', color: this.sel === i ? '#ffd84a' : '#fff' }));
    text(`INNINGS: ${INNING_OPTS[this.innSel]}`, W / 2, 166 + 3 * 12, { align: 'center', color: this.sel === MENU.length ? '#ffd84a' : '#ccc' });
    const cy = 166 + this.sel * 12;
    text('>', W / 2 - 62 + Math.sin(this.t * 8) * 1.5, cy, { color: '#ffd84a' });
    if (Math.floor(this.t * 2) % 2 === 0) text('PRESS A / ENTER', W / 2, 228, { align: 'center', color: '#fff', shadow: '#000' });
  }
}

import { W, H, ctx, rect, text, panel, rgb, head } from '../gfx.js';
import { SPECIES } from '../data/pokemon.js';
import { sfx } from '../audio.js';

export class ResultScene {
  constructor(game, opts) { this.game = game; this.m = opts.match; this.t = 0; }
  update(input) {
    this.t += 1 / 60;
    const any = input.any;
    if (this.t > 1 && (any.pressed.a || any.pressed.start)) { sfx.menuSelect(); this.game.goto('title'); }
  }
  draw() {
    const m = this.m;
    rect(0, 0, W, H, '#101830');
    for (let y = 0; y < H; y += 8) rect(0, y, W, 4, '#141e3a');
    const win = m.teams[m.winner];
    text('FINAL', W / 2, 8, { align: 'center', color: '#ffd84a', scale: 2, shadow: '#000' });
    text(`${win.city} ${win.name} WIN!`, W / 2, 28, { align: 'center', color: rgb(win.colors.primary), shadow: '#000' });
    // line score
    const n = Math.max(m.innings, m.lineScore[0].length, m.lineScore[1].length);
    const x0 = 14, y0 = 48, cw = 14;
    panel(6, y0 - 6, W - 12, 40);
    for (let i = 0; i < n; i++) text(String(i + 1), x0 + 40 + i * cw, y0, { color: '#aaa' });
    text('R', x0 + 44 + n * cw, y0, { color: '#ffd84a' }); text('H', x0 + 58 + n * cw, y0, { color: '#ffd84a' });
    for (let t = 0; t < 2; t++) {
      const team = m.teams[t]; const y = y0 + 11 + t * 10;
      text(team.name.slice(0, 5), x0, y, { color: rgb(team.colors.primary) });
      for (let i = 0; i < n; i++) { const v = m.lineScore[t][i]; text(v === undefined ? '-' : String(v), x0 + 40 + i * cw, y); }
      text(String(m.runs[t]), x0 + 44 + n * cw, y, { color: '#fff' }); text(String(m.hits[t]), x0 + 58 + n * cw, y, { color: '#fff' });
    }
    // top hitters
    const rows = [];
    for (let t = 0; t < 2; t++) m.teams[t].roster.forEach((r, i) => { const s = m.stats[t][i]; rows.push({ team: m.teams[t], species: r.species, s }); });
    rows.sort((a, b) => (b.s.h * 2 + b.s.hr * 3 + b.s.rbi) - (a.s.h * 2 + a.s.hr * 3 + a.s.rbi));
    panel(6, 92, W - 12, 112);
    text('STARS OF THE GAME', W / 2, 96, { align: 'center', color: '#ffd84a' });
    rows.slice(0, 5).forEach((r, i) => {
      const y = 108 + i * 18;
      head(r.species, 12, y - 1);
      text(SPECIES[r.species].name, 32, y + 1, { color: rgb(r.team.colors.primary) });
      text(`${r.s.h}-${r.s.ab}  HR ${r.s.hr}  RBI ${r.s.rbi}  R ${r.s.r}`, 120, y + 1, { color: '#fff' });
    });
    if (Math.floor(this.t * 2) % 2 === 0) text('PRESS A', W / 2, 220, { align: 'center', color: '#fff', shadow: '#000' });
  }
}

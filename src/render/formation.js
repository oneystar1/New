// Formation chart: the whole defence on the diamond with a name/position
// label under every player, like a football depth-chart graphic.
import { W, H, ctx, rect, text, panel, rgb, textWidth, player, misc, head } from '../gfx.js';
import { getComposite } from '../assets.js';
import { drawFieldBackdrop, projectStatic } from './fieldview.js';
import { POSITIONS, BASES } from '../game/field.js';
import { SPECIES } from '../data/pokemon.js';

const CAM = { x: 0, y: 10 };
// Chart positions (feet) are spread wider than real fielding spots so the labels never overlap.
const CHART = {
  P: { x: 0, z: 64 }, C: { x: 0, z: -24 },
  '1B': { x: 118, z: 84 }, '2B': { x: 50, z: 168 }, '3B': { x: -118, z: 84 }, SS: { x: -50, z: 168 },
  LF: { x: -150, z: 255 }, CF: { x: 0, z: 300 }, RF: { x: 150, z: 255 },
};

export function drawFormation(team, { title = '', subtitle = '', t = 0 } = {}) {
  drawFieldBackdrop(CAM.x, CAM.y);
  for (let b = 0; b < 4; b++) {
    const p = projectStatic(BASES[b].x, BASES[b].z, CAM.x, CAM.y);
    if (b === 0) misc('homeplate', p.sx - 3, p.sy - 2); else misc('base', p.sx - 3, p.sy - 3);
  }
  // header bar in team colour
  rect(0, 0, W, 16, rgb(team.colors.primary));
  rect(0, 16, W, 1, '#111');
  text(title || `${team.city} ${team.name}`.toUpperCase(), 6, 4, { color: '#fff', shadow: '#000' });
  if (subtitle) text(subtitle, W - 6, 4, { align: 'right', color: '#fff', shadow: '#000' });
  // players, far first
  const slots = [...team.roster].sort((a, b) => CHART[b.pos].z - CHART[a.pos].z);
  for (const r of slots) {
    const pos = CHART[r.pos];
    const p = projectStatic(pos.x, pos.z, CAM.x, CAM.y);
    const comp = getComposite(r.species, team);
    const bob = Math.floor(t * 2 + r.order) % 2 ? 'idle_front' : 'catch_front';
    player(comp, r.pos === 'C' ? 'crouch_front' : (r.pos === 'P' ? 'pitch_set' : bob), p.sx, p.sy + 2, 1);
  }
  // labels in a second pass so they always sit on top of the sprites
  for (const r of slots) {
    const pos = CHART[r.pos];
    const p = projectStatic(pos.x, pos.z, CAM.x, CAM.y);
    if (r.pos === 'C') drawLabel(SPECIES[r.species].name, r.pos, p.sx + 58, p.sy - 22, '#5ab4ff');
    else drawLabel(SPECIES[r.species].name, r.pos, p.sx, p.sy + 5, '#5ab4ff');
  }
}

/** Black label box: white name on top, coloured position below. */
export function drawLabel(name, pos, cx, y, posColor = '#5ab4ff') {
  const w = Math.max(textWidth(name), textWidth(pos)) + 8;
  const x = Math.round(cx - w / 2);
  rect(x, y, w, 19, 'rgba(6,6,14,0.9)');
  rect(x, y, w, 1, '#66687a'); rect(x, y + 18, w, 1, '#66687a'); rect(x, y, 1, 19, '#66687a'); rect(x + w - 1, y, 1, 19, '#66687a');
  text(name.toUpperCase(), cx, y + 3, { align: 'center', color: '#fff' });
  text(pos, cx, y + 11, { align: 'center', color: posColor });
}

/** Batting-order strip used by the lineup scene. */
export function drawBattingOrder(team, x, y) {
  const w = 200, rowH = 18;
  panel(x, y, w, 14 + 9 * rowH);
  text('BATTING ORDER', x + w / 2, y + 4, { align: 'center', color: '#ffd84a' });
  team.roster.forEach((r, i) => {
    const sp = SPECIES[r.species]; const ry = y + 14 + i * rowH;
    text(`${i + 1}`, x + 6, ry + 5, { color: '#ffd84a' });
    head(r.species, x + 16, ry);
    text(sp.name, x + 36, ry + 5, { color: '#fff' });
    text(r.pos, x + 112, ry + 5, { color: '#5ab4ff' });
    rect(x + 132, ry + 3, 30, 3, '#333'); rect(x + 132, ry + 3, Math.round(sp.power * 0.3), 3, '#ff7a4a');
    rect(x + 132, ry + 8, 30, 3, '#333'); rect(x + 132, ry + 8, Math.round(sp.contact * 0.3), 3, '#5ad66a');
    rect(x + 166, ry + 3, 30, 3, '#333'); rect(x + 166, ry + 3, Math.round(sp.speed * 0.3), 3, '#5aa0ff');
    rect(x + 166, ry + 8, 30, 3, '#333'); rect(x + 166, ry + 8, Math.round(sp.arm * 0.3), 3, '#ffd84a');
  });
}

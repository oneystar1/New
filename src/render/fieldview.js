// Overhead fielding / base-running view.
import { W, H, ctx, rect, misc, player, text, rgb } from '../gfx.js';
import { getComposite } from '../assets.js';
import { BASES, fenceDistance, FENCE_LINE, FENCE_CENTER, MOUND } from '../game/field.js';

const SX = 0.72, SZ = 0.45, SY = 0.55;  // px per foot: lateral, depth, height
const HOME = { x: W / 2, y: 206 };
let cam = { x: 0, y: 0 };

function proj(x, z, y = 0) {
  return { sx: HOME.x + x * SX - cam.x, sy: HOME.y - z * SZ - y * SY - cam.y, gy: HOME.y - z * SZ - cam.y };
}

let fieldImg = null;
const FW = 560, FH = 300, FOX = 280, FOY = 240; // offscreen field image; home at (FOX,FOY)
function buildField() {
  const c = document.createElement('canvas'); c.width = FW; c.height = FH;
  const g = c.getContext('2d');
  const P = (x, z) => [FOX + x * SX, FOY - z * SZ];
  // beyond fence: stands
  g.fillStyle = '#4a4a5e'; g.fillRect(0, 0, FW, FH);
  for (let y = 0; y < FH; y += 3) for (let x = (y % 2) * 2; x < FW; x += 3) {
    const cols = ['#e8c9a0', '#d4a373', '#c93b3b', '#3b6ec9', '#f0d44a', '#4fb356', '#eeeeee', '#555'];
    g.fillStyle = cols[(x * 7 + y * 13) % cols.length]; g.fillRect(x, y, 2, 2);
  }
  // grass (fair + foul territory) as a big polygon out to the fence
  g.beginPath();
  const [hx, hy] = P(0, -40); g.moveTo(hx - 170, hy + 10);
  for (let a = -75; a <= 75; a += 3) {
    const th = a * Math.PI / 180; const r = Math.abs(a) <= 45 ? fenceDistance(Math.sin(th) * 400, Math.cos(th) * 400) + 2 : FENCE_LINE + 2;
    const [x, y] = P(Math.sin(th) * r, Math.cos(th) * r); g.lineTo(x, y);
  }
  g.lineTo(hx + 170, hy + 10); g.closePath();
  g.fillStyle = '#3f9b3f'; g.fill();
  g.save(); g.clip();
  for (let y = 0; y < FH; y += 8) { g.fillStyle = ((y / 8) | 0) % 2 ? '#3f9b3f' : '#46a846'; g.fillRect(0, y, FW, 8); }
  g.restore();
  // warning track + wall
  g.strokeStyle = '#c99a62'; g.lineWidth = 5; g.beginPath();
  for (let a = -45; a <= 45; a += 2) { const th = a * Math.PI / 180; const r = fenceDistance(Math.sin(th) * 400, Math.cos(th) * 400) - 3; const [x, y] = P(Math.sin(th) * r, Math.cos(th) * r); a === -45 ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.stroke();
  g.strokeStyle = '#f0d44a'; g.lineWidth = 2; g.beginPath();
  for (let a = -45; a <= 45; a += 2) { const th = a * Math.PI / 180; const r = fenceDistance(Math.sin(th) * 400, Math.cos(th) * 400); const [x, y] = P(Math.sin(th) * r, Math.cos(th) * r); a === -45 ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.stroke();
  // infield dirt: diamond + arc
  g.fillStyle = '#c99a62';
  g.beginPath(); const [ax, ay] = P(0, -12); g.moveTo(ax, ay);
  for (let a = -50; a <= 50; a += 4) { const th = a * Math.PI / 180; const [x, y] = P(Math.sin(th) * 150, Math.cos(th) * 150 - 5); g.lineTo(x, y); }
  g.closePath(); g.fill();
  // infield grass
  g.fillStyle = '#46a846'; g.beginPath();
  const inset = [[0, 12], [50, 63], [0, 115], [-50, 63]];
  inset.forEach(([x, z], i) => { const [px, py] = P(x, z); i ? g.lineTo(px, py) : g.moveTo(px, py); });
  g.closePath(); g.fill();
  // base paths
  g.strokeStyle = '#c99a62'; g.lineWidth = 6; g.beginPath();
  [0, 1, 2, 3, 0].forEach((b, i) => { const [x, y] = P(BASES[b].x, BASES[b].z); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  // foul lines
  g.strokeStyle = '#ffffff'; g.lineWidth = 1.2; g.beginPath();
  const [h0x, h0y] = P(0, 0); g.moveTo(h0x, h0y); let [lx, ly] = P(-FENCE_LINE * 0.707, FENCE_LINE * 0.707); g.lineTo(lx, ly);
  g.moveTo(h0x, h0y); [lx, ly] = P(FENCE_LINE * 0.707, FENCE_LINE * 0.707); g.lineTo(lx, ly); g.stroke();
  // mound
  g.fillStyle = '#d4a86e'; const [mx, my] = P(MOUND.x, MOUND.z); g.beginPath(); g.ellipse(mx, my, 8, 4, 0, 0, Math.PI * 2); g.fill();
  // batter's boxes & plate area
  g.fillStyle = '#c99a62'; g.beginPath(); g.ellipse(h0x, h0y, 16, 8, 0, 0, Math.PI * 2); g.fill();
  fieldImg = c;
}

export function drawFieldView(play) {
  if (!fieldImg) buildField();
  const m = play.m;
  const ball = play.ball;
  // camera follows the ball (clamped so the diamond stays visible)
  const focusX = ball.x * SX, focusZ = ball.z;
  const targetX = Math.max(-120, Math.min(120, focusX * 0.85));
  const targetY = Math.max(-60, Math.min(0, -(focusZ - 120) * SZ * 0.9));
  cam.x += (targetX - cam.x) * 0.1; cam.y += (targetY - cam.y) * 0.1;
  ctx.drawImage(fieldImg, HOME.x - FOX - cam.x, HOME.y - FOY - cam.y);
  // bases
  for (let b = 0; b < 4; b++) {
    const p = proj(BASES[b].x, BASES[b].z);
    if (b === 0) misc('homeplate', p.sx - 3, p.sy - 2); else misc('base', p.sx - 3, p.sy - 3);
  }
  // draw list sorted by depth (far first)
  const items = [];
  const fldTeam = m.teams[m.fieldingTeam], batTeam = m.teams[m.battingTeam];
  for (let i = 0; i < play.fielders.length; i++) {
    const f = play.fielders[i];
    const comp = getComposite(fldTeam.roster[f.slot].species, fldTeam);
    let frame = 'idle_front', flip = false;
    if (f.catchT > 0) frame = 'catch_front';
    else if (f.throwT > 0) { frame = 'throw_side'; flip = f.facing > 0; }
    else if (f.moving) { frame = 'run' + (1 + Math.floor(f.anim * 10) % 4); flip = f.facing > 0; }
    else if (f.hasBall) frame = 'idle_front';
    items.push({ z: f.z, draw: () => { const p = proj(f.x, f.z); player(comp, frame, p.sx, p.sy + 2, 1, flip);
      if (i === play.activeFielder && play.fieldInput && !play.dead) misc('arrow_up', p.sx - 4, p.sy - 36 + Math.sin(play.t * 8) * 2); } });
  }
  for (const r of play.runners) {
    if (r.state === 'out' || r.state === 'scored') continue;
    const comp = getComposite(batTeam.roster[r.slot].species, batTeam);
    const running = r.state === 'run' || r.state === 'back';
    const frame = running ? 'run' + (1 + Math.floor(r.anim * 10) % 4) : 'idle_front';
    items.push({ z: r.z - 0.1, draw: () => { const p = proj(r.x, r.z); player(comp, frame, p.sx, p.sy + 2, 1, r.facing > 0); } });
  }
  // ball
  if (!play.ballHeld() && play.phase !== 'homerun') {
    items.push({ z: ball.z - 0.2, draw: () => {
      const g = proj(ball.x, ball.z, 0);
      ctx.globalAlpha = 0.35; misc('shadow', g.sx - 3, g.gy - 1); ctx.globalAlpha = 1;
      const p = proj(ball.x, ball.z, ball.y);
      const size = ball.y > 40 ? 'ball6' : ball.y > 12 ? 'ball4' : 'ball3';
      const ms = misc(size, 0, -100);
      misc(size, p.sx - ms.w / 2, p.sy - ms.h / 2);
    } });
  } else if (play.phase === 'homerun') {
    const p = proj(ball.x, ball.z, 60 + Math.sin(play.t * 3) * 5);
    misc('star', p.sx - 3, p.sy - 3);
  }
  items.sort((a, b) => b.z - a.z);
  for (const it of items) it.draw();
}

export function resetCamera() { cam = { x: 0, y: 0 }; }

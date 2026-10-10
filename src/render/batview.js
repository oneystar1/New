// Behind-the-pitcher batting view (Ken Griffey Jr. style).
import { W, H, ctx, rect, misc, player, text, rgb, strokeRect } from '../gfx.js';
import { getComposite } from '../assets.js';
import { SPECIES } from '../data/pokemon.js';

const PLATE_Y = 152;          // screen y of the ground at home plate
const MOUND_Z = 60.5;
const UMPIRE_TEAM = { id: 'ump', colors: { primary: [40, 40, 70], secondary: [25, 25, 50], pants: [60, 60, 80] } };

/** Perspective: pixels per foot at depth z (z=0 plate, z=60 mound, nearer camera). */
function k(z) { return 10 + 3.5 * (z / MOUND_Z); }
function groundY(z) { return PLATE_Y + z * (86 / MOUND_Z); }
export function project(x, y, z) { const kk = k(z); return { sx: W / 2 - x * kk, sy: groundY(z) - y * kk, k: kk }; }

let stadium = null;
function buildStadium() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  // sky
  const grad = g.createLinearGradient(0, 0, 0, 90);
  grad.addColorStop(0, '#2a5cc8'); grad.addColorStop(1, '#8fc4ff');
  g.fillStyle = grad; g.fillRect(0, 0, W, 90);
  // clouds
  g.fillStyle = '#ffffff';
  for (const [x, y, w] of [[30, 18, 40], [120, 30, 30], [230, 14, 50], [280, 40, 26]]) { g.fillRect(x, y, w, 5); g.fillRect(x + 6, y - 4, w - 14, 4); g.fillRect(x + 4, y + 5, w - 8, 3); }
  // far stands (crowd)
  g.fillStyle = '#5a5a6e'; g.fillRect(0, 70, W, 32);
  for (let y = 72; y < 100; y += 3) for (let x = (y % 2) * 2; x < W; x += 3) {
    const cols = ['#e8c9a0', '#d4a373', '#f4e1c1', '#c93b3b', '#3b6ec9', '#f0d44a', '#4fb356', '#eeeeee', '#222'];
    g.fillStyle = cols[(x * 7 + y * 13) % cols.length]; g.fillRect(x, y, 2, 2);
  }
  // scoreboard-ish billboard
  g.fillStyle = '#1b1b2b'; g.fillRect(130, 56, 60, 16); g.fillStyle = '#ffd84a'; g.fillRect(133, 59, 54, 10);
  g.fillStyle = '#1b1b2b'; for (let i = 0; i < 6; i++) g.fillRect(136 + i * 9, 61, 6, 6);
  // outfield wall
  g.fillStyle = '#2d6b2d'; g.fillRect(0, 102, W, 8); g.fillStyle = '#f0d44a'; g.fillRect(0, 102, W, 1);
  // grass with mow stripes
  for (let y = 110; y < H; y += 6) { g.fillStyle = ((y / 6) | 0) % 2 ? '#3f9b3f' : '#45a845'; g.fillRect(0, y, W, 6); }
  // infield dirt arc around plate & base paths
  g.fillStyle = '#c99a62';
  g.beginPath(); g.ellipse(W / 2, PLATE_Y + 2, 70, 18, 0, 0, Math.PI * 2); g.fill();
  // dirt toward mound
  g.beginPath(); g.moveTo(W / 2 - 60, PLATE_Y + 6); g.lineTo(W / 2 + 60, PLATE_Y + 6); g.lineTo(W / 2 + 150, H); g.lineTo(W / 2 - 150, H); g.closePath();
  g.fillStyle = '#44a644'; g.fill();
  g.fillStyle = '#c99a62'; g.beginPath(); g.ellipse(W / 2, H + 8, 80, 34, 0, 0, Math.PI * 2); g.fill();
  // foul lines from plate to the corners
  g.strokeStyle = '#ffffff'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(W / 2, PLATE_Y); g.lineTo(-20, 114); g.moveTo(W / 2, PLATE_Y); g.lineTo(W + 20, 114); g.stroke();
  // batter's boxes
  g.strokeStyle = '#eee'; g.lineWidth = 1;
  g.strokeRect(W / 2 - 46, PLATE_Y - 9, 26, 17); g.strokeRect(W / 2 + 20, PLATE_Y - 9, 26, 17);
  stadium = c;
}

export function drawBatView(play) {
  if (!stadium) buildStadium();
  ctx.drawImage(stadium, 0, 0);
  const m = play.m;
  const batTeam = m.teams[m.battingTeam], fldTeam = m.teams[m.fieldingTeam];
  // home plate
  misc('homeplate', W / 2 - 4, PLATE_Y - 3);
  // strike zone guide
  const zx = W / 2 - 0.85 * 10, zy = PLATE_Y - 3.6 * 10;
  ctx.globalAlpha = 0.35; strokeRect(zx, zy, 17, 21, '#ffffff'); ctx.globalAlpha = 1;

  // umpire & catcher (front views)
  const ump = getComposite('umpire', UMPIRE_TEAM);
  player(ump, 'crouch_front', W / 2 + 12, groundY(-19) + 2, 1.5);
  const catcherSlot = fldTeam.roster.find(r => r.pos === 'C');
  const catcher = getComposite(catcherSlot.species, fldTeam);
  player(catcher, play.catchFlash > 0 ? 'catch_front' : 'crouch_front', W / 2 + 1, groundY(-12) + 3, 1.7);

  // batter (side view)
  const bx = (play.handed === 'R' ? -2.9 : 2.9) + play.batterX;
  const bp = project(bx, 0, 0.5);
  const batter = getComposite(m.batter.species, batTeam);
  let frame = play.batAnim;
  if (frame === 'bat_swing' && play.batAnimT > 0.12) frame = 'bat_follow';
  if (frame === 'bat_follow' && play.batAnimT > 0.6 && play.phase === 'pitching') frame = 'bat_stance';
  if (play.phase === 'pitching' || play.phase === 'intro') {
    // idle waggle
    frame = (Math.floor(play.t * 2) % 4 === 0) ? 'bat_load' : 'bat_stance';
    if (play.swing) frame = play.batAnim;
  }
  player(batter, frame, bp.sx, bp.sy, 2, play.handed === 'L');

  // ball in flight (between pitcher and plate)
  if (play.pitch && play.phase === 'flight') {
    const p = play.pitch;
    const pr = project(p.x, p.y, p.z);
    const sh = project(p.x, 0, p.z);
    ctx.globalAlpha = 0.3; misc('shadow', sh.sx - 3, sh.sy - 1); ctx.globalAlpha = 1;
    const size = p.z > 36 ? 'ball8' : p.z > 18 ? 'ball6' : p.z > 5 ? 'ball4' : 'ball3';
    const ms = misc(size, 0, -100); // measure
    const vanished = p.def.vanish && p.z < 34 && p.z > 12;   // Shadow Ball disappears mid-flight
    if (!vanished) misc(size, pr.sx - ms.w / 2, pr.sy - ms.h / 2);
  } else if (play.phase === 'callout' && play.pitch === null) {
    // nothing
  }

  // pitch aim cursor for the human pitcher during selection
  if (play.phase === 'pitching' && play.fieldInput) {
    const c = project(play.aim.x, play.aim.y, 0);
    if (Math.floor(play.t * 8) % 2 === 0) misc('cursor', c.sx - 4, c.sy - 4);
  }

  // pitcher (back view, foreground)
  const pitcher = getComposite(m.pitcher.species, fldTeam);
  const pp = project(0, 0, MOUND_Z);
  let pf = play.pitchAnim;
  if (pf === 'pitch_release' && play.pitchAnimT > 0.5) pf = 'pitch_set';
  misc('mound', pp.sx - 6, pp.sy - 3);
  player(pitcher, pf, pp.sx, pp.sy, 2.2, play.pitcherHand === 'L');
}

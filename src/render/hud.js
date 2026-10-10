// Scoreboard overlay, messages and runner diamond.
import { W, H, ctx, rect, misc, text, panel, rgb, strokeRect, head, textWidth } from '../gfx.js';
import { SPECIES, PITCHES } from '../data/pokemon.js';

function abbr(team) { return team.name.slice(0, 3).toUpperCase(); }

export function drawHud(play) {
  const m = play.m;
  // --- score panel (top-left)
  panel(3, 3, 92, 34);
  const t0 = m.teams[0], t1 = m.teams[1];
  text(abbr(t0), 7, 7, { color: rgb(t0.colors.primary) }); text(String(m.runs[0]), 60, 7, { align: 'right' });
  text(abbr(t1), 7, 17, { color: rgb(t1.colors.primary) }); text(String(m.runs[1]), 60, 17, { align: 'right' });
  if (m.battingTeam === 0) misc('bat_icon', 64, 6); else misc('bat_icon', 64, 16);
  text(m.inningLabel(), 7, 27, { color: '#ffd84a' });
  // outs
  for (let i = 0; i < 3; i++) rect(68 + i * 8, 28, 5, 5, i < m.outs ? '#ff5a4a' : '#444');
  // --- count (top-centre)
  if (!play.fieldView) {
    panel(W / 2 - 34, 3, 68, 13);
    text(`B${m.balls} S${m.strikes}`, W / 2, 6, { align: 'center' });
  }
  // --- runner diamond (top-right)
  panel(W - 31, 3, 28, 24);
  const cx = W - 17, cy = 14;
  const pts = [[cx, cy + 7], [cx + 7, cy], [cx, cy - 7], [cx - 7, cy]];
  for (let b = 1; b <= 3; b++) rect(pts[b][0] - 2, pts[b][1] - 2, 4, 4, m.runners[b - 1] !== null ? '#ffd84a' : '#555');
  rect(pts[0][0] - 2, pts[0][1] - 2, 4, 4, '#aaa');
  // --- batter / pitcher strip (bottom)
  const bs = SPECIES[m.batter.species], ps = SPECIES[m.pitcher.species];
  const st = m.batterStats();
  const bt = m.teams[m.battingTeam], ft = m.teams[m.fieldingTeam];
  panel(3, H - 23, 150, 20);
  head(m.batter.species, 5, H - 21);
  text(bs.name, 23, H - 20, { color: rgb(bt.colors.primary) });
  text(`${st.h}-${st.ab}  HR ${st.hr}`, 23, H - 11, { color: '#ccc' });
  panel(W - 153, H - 23, 150, 20);
  head(m.pitcher.species, W - 151, H - 21);
  text(ps.name, W - 133, H - 20, { color: rgb(ft.colors.primary) });
  // stamina bar
  const stam = m.stamina[m.fieldingTeam];
  rect(W - 133, H - 10, 60, 5, '#333');
  rect(W - 133, H - 10, Math.round(60 * stam / 100), 5, stam > 50 ? '#5ad66a' : stam > 25 ? '#ffd84a' : '#ff5a4a');
  text(`${Math.round(stam)}`, W - 70, H - 11, { color: '#ccc' });
  // pitch type (shown to a human pitcher while choosing, hidden from a human batter in 2P)
  if ((play.phase === 'pitching' || play.phase === 'windup') && play.fieldInput && !play.batInput) {
    const pt = PITCHES[play.pitchTypes[play.pitchSel]];
    const label = pt.name.toUpperCase();
    const w = textWidth(label) + 10;
    panel(W / 2 - w / 2, H - 38, w, 12, 'rgba(10,10,30,0.85)', pt.special ? '#ffd84a' : '#fff');
    text(label, W / 2, H - 35, { align: 'center', color: pt.special ? '#ffd84a' : '#fff' });
  }
  // --- message
  if (play.message) {
    const { text: t, big } = play.message;
    const sc = big ? 2 : 1;
    const w = textWidth(t, sc) + 16;
    const y = play.fieldView ? 44 : 44;
    panel(W / 2 - w / 2, y, w, 10 * sc + 8, 'rgba(10,10,30,0.85)', big ? '#ffd84a' : '#fff');
    text(t, W / 2, y + 4, { align: 'center', scale: sc, color: big ? '#ffd84a' : '#fff', shadow: '#000' });
  }
  // --- control hints
  if (play.phase === 'pitching' && play.t < 2.5) {
    let hint = '';
    if (play.fieldInput && play.batInput) hint = 'P1 AIM+B TYPE+A PITCH   P2 A SWING B POWER';
    else if (play.fieldInput) hint = 'AIM: D-PAD  TYPE: B  PITCH: A  STEER IN FLIGHT';
    else if (play.batInput) hint = 'MOVE: D-PAD  SWING: A  POWER: B  BUNT: DOWN+A';
    if (hint) text(hint, W / 2, H - 34, { align: 'center', color: '#ddd', shadow: '#000' });
  }
  if (play.fieldView && play.inPlayT < 2) {
    if (play.fieldInput) text('MOVE FIELDER  DIR+A: THROW TO BASE', W / 2, H - 34, { align: 'center', color: '#ddd', shadow: '#000' });
    else if (play.batInput) text('A: ADVANCE RUNNERS   B: RETREAT', W / 2, H - 34, { align: 'center', color: '#ddd', shadow: '#000' });
  }
}

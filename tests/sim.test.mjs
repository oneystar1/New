// Headless simulation: CPU vs CPU full games through the Play state machine.
// Catches logic errors (stuck phases, bad outs, runner bugs) without a browser.
import { Match } from '../src/game/rules.js';
import { Play } from '../src/game/play.js';
import { TEAMS } from '../src/data/teams.js';

const fakeInput = { p: () => null };
let failures = 0;
const check = (cond, msg) => { if (!cond) { failures++; console.error('FAIL:', msg); } };

for (let g = 0; g < 6; g++) {
  const away = TEAMS[g % 4], home = TEAMS[(g + 1) % 4];
  const m = new Match(away, home, { innings: 3, controllers: ['cpu', 'cpu'] });
  const play = new Play(m, fakeInput);
  const results = {};
  let steps = 0, lastPhase = play.phase, phaseSteps = 0;
  const seenMsgs = new Set();
  while (play.phase !== 'gameover' && steps < 60 * 60 * 40) {
    play.update(); steps++;
    if (play.phase === lastPhase) phaseSteps++; else { lastPhase = play.phase; phaseSteps = 0; }
    if (play.message) seenMsgs.add(play.message.text);
    if (play.phase === 'playover' && play.timer > 1.4 && play.playResult) results[play.playResult] = (results[play.playResult] || 0) + 1;
    check(phaseSteps < 60 * 40, `phase ${play.phase} stuck for ${phaseSteps} steps (game ${g})`);
    if (phaseSteps >= 60 * 40) break;
    check(m.outs <= 3, `outs > 3 (${m.outs})`);
    check(m.balls <= 3 && m.strikes <= 2, `count overflow ${m.balls}-${m.strikes}`);
    for (const r of play.runners) check(!(r.state === 'run' && r.to > 4), 'runner target beyond home');
  }
  check(play.phase === 'gameover', `game ${g} did not finish (phase ${play.phase}) after ${steps} steps`);
  console.log(`game ${g}: ${away.name} ${m.runs[0]} - ${home.name} ${m.runs[1]}  hits ${m.hits[0]}/${m.hits[1]}  innings played ${m.inning}  sim ${(steps / 60 / 60).toFixed(1)} game-min`,
    JSON.stringify(results));
  check(m.runs[0] !== m.runs[1] || m.inning > m.innings, 'game ended tied without extras');
  const total = Object.values(results).reduce((a, b) => a + b, 0);
  check(total > 10, `too few plays recorded (${total})`);
}
console.log(failures ? `${failures} FAILURES` : 'ALL SIM CHECKS PASSED');
process.exit(failures ? 1 : 0);

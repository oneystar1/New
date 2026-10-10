// Balance diagnostic: simulate many CPU at-bats and report outcome rates.
import { Match } from '../src/game/rules.js';
import { Play } from '../src/game/play.js';
import { TEAMS } from '../src/data/teams.js';
const fakeInput = { p: () => null };
const N = Number(process.argv[2] || 600);
const stats = { pa: 0, k: 0, bb: 0, contact: 0, foul: 0, hit: 0, out: 0, hr: 0, fc: 0, single: 0, double: 0, triple: 0, flyout: 0, groundout: 0 };
const exits = [], dists = [];
let pa = 0;
let gi = 0;
while (pa < N) {
  const m = new Match(TEAMS[gi % TEAMS.length], TEAMS[(gi + 1) % TEAMS.length], { innings: 9, controllers: ['cpu', 'cpu'] }); gi++;
  const play = new Play(m, fakeInput);
  let lastPhase = play.phase, steps = 0, contactLogged = false;
  while (play.phase !== 'gameover' && pa < N && steps < 60 * 60 * 60) {
    play.update(); steps++;
    if (play.phase !== lastPhase) {
      if (play.phase === 'inplay' && !contactLogged) { stats.contact++; contactLogged = true; exits.push(play.contact.exit); const l = play.ball.predictLanding(0); dists.push(Math.hypot(l.x, l.z)); }
      if (play.phase === 'callout' && play.callResult === 'strikeout') { stats.k++; stats.pa++; pa++; }
      if (play.phase === 'callout' && play.callResult === 'walk') { stats.bb++; stats.pa++; pa++; }
      if (play.phase === 'playover') {
        const r = play.playResult;
        if (r === 'foul') stats.foul++;
        else { stats.pa++; pa++; stats[r === 'hit' ? 'hit' : r === 'fc' ? 'fc' : 'out']++;
          if (r === 'hit') { const b = play.hitBase; stats[b === 1 ? 'single' : b === 2 ? 'double' : b === 3 ? 'triple' : 'hr']++; }
          if (r === 'out') { if (play.caught) stats.flyout++; else stats.groundout++; } }
      }
      if (play.phase === 'homerun') { stats.pa++; pa++; stats.hit++; stats.hr++; }
      if (play.phase === 'intro') contactLogged = false;
      lastPhase = play.phase;
    }
  }
}
const pct = v => (100 * v / stats.pa).toFixed(1) + '%';
const bip = stats.hit + stats.out + stats.fc;
console.log(`PA ${stats.pa}: K ${pct(stats.k)}  BB ${pct(stats.bb)}  in-play ${pct(bip)}  fouls/PA ${(stats.foul / stats.pa).toFixed(2)}`);
console.log(`BABIP-ish: hits ${stats.hit}/${bip} = ${(100 * stats.hit / Math.max(1, bip)).toFixed(1)}%   1B ${stats.single} 2B ${stats.double} 3B ${stats.triple} HR ${stats.hr}  FC ${stats.fc}  flyouts ${stats.flyout} groundouts ${stats.groundout}`);
console.log(`AVG ${(stats.hit / Math.max(1, stats.pa - stats.bb)).toFixed(3)}  HR/PA ${pct(stats.hr)}`);
exits.sort((a, b) => a - b); dists.sort((a, b) => a - b);
const q = (arr, p) => arr[Math.floor(arr.length * p)] | 0;
console.log(`exit velo ft/s: p10 ${q(exits, .1)} p50 ${q(exits, .5)} p90 ${q(exits, .9)}   landing ft: p10 ${q(dists, .1)} p50 ${q(dists, .5)} p90 ${q(dists, .9)} max ${q(dists, .999)}`);

// Match state: innings, counts, score, runners, lineups.
import { SPECIES } from '../data/pokemon.js';

export class Match {
  constructor(away, home, { innings = 9, controllers = ['human0', 'cpu'] } = {}) {
    this.teams = [away, home];           // 0 = away (bats top), 1 = home
    this.controllers = controllers;      // per team: 'human0' | 'human1' | 'cpu'
    this.innings = innings;
    this.inning = 1; this.half = 0;      // half 0 = top (away bats)
    this.outs = 0; this.balls = 0; this.strikes = 0;
    this.lineScore = [[], []];
    this.runs = [0, 0]; this.hits = [0, 0]; this.errors = [0, 0];
    this.batterIdx = [0, 0];
    this.runners = [null, null, null];   // 1B,2B,3B -> roster slot index of batting team or null
    this.stamina = [100, 100];           // pitcher stamina per team
    this.pitchCount = [0, 0];
    this.over = false; this.winner = null;
    this.stats = [this.freshStats(away), this.freshStats(home)];
    this.log = [];
  }
  freshStats(team) { return team.roster.map(() => ({ ab: 0, h: 0, hr: 0, rbi: 0, r: 0, so: 0, bb: 0 })); }

  get battingTeam() { return this.half === 0 ? 0 : 1; }
  get fieldingTeam() { return 1 - this.battingTeam; }
  get batter() { const t = this.battingTeam; return this.teams[t].roster[this.batterIdx[t]]; }
  get pitcher() { const t = this.fieldingTeam; return this.teams[t].roster.find(r => r.pos === 'P'); }
  controllerOf(teamIdx) { return this.controllers[teamIdx]; }
  isHuman(teamIdx) { return this.controllers[teamIdx] !== 'cpu'; }
  humanSlot(teamIdx) { const c = this.controllers[teamIdx]; return c === 'human0' ? 0 : c === 'human1' ? 1 : -1; }
  speciesOf(teamIdx, slot) { return SPECIES[this.teams[teamIdx].roster[slot].species]; }
  batterStats() { return this.stats[this.battingTeam][this.batterIdx[this.battingTeam]]; }

  resetCount() { this.balls = 0; this.strikes = 0; }

  addStrike() { this.strikes++; if (this.strikes >= 3) { this.strikeout(); return 'strikeout'; } return 'strike'; }
  addFoul() { if (this.strikes < 2) this.strikes++; return 'foul'; }
  addBall() { this.balls++; if (this.balls >= 4) { this.walk(); return 'walk'; } return 'ball'; }

  strikeout() { this.batterStats().ab++; this.batterStats().so++; this.recordOut(); this.nextBatter(); }

  walk() {
    this.batterStats().bb++;
    // force advance
    const b = this.batterIdx[this.battingTeam];
    let carry = b;
    for (let i = 0; i < 3; i++) {
      if (this.runners[i] === null) { this.runners[i] = carry; carry = null; break; }
      const tmp = this.runners[i]; this.runners[i] = carry; carry = tmp;
    }
    if (carry !== null) this.scoreRun(carry, true);
    this.nextBatter();
  }

  scoreRun(slot, rbi = true) {
    const t = this.battingTeam;
    this.runs[t]++;
    this.lineScore[t][this.inning - 1] = (this.lineScore[t][this.inning - 1] || 0) + 1;
    if (slot !== null && slot !== undefined) this.stats[t][slot].r++;
    if (rbi) this.batterStats().rbi++;
  }

  recordOut() { this.outs++; }

  nextBatter() {
    const t = this.battingTeam;
    this.batterIdx[t] = (this.batterIdx[t] + 1) % 9;
    this.resetCount();
  }

  /** Called after each play; returns 'inning' if the side changed, 'over' if the game ended. */
  checkSideChange() {
    if (this.outs >= 3) {
      this.lineScore[this.battingTeam][this.inning - 1] = this.lineScore[this.battingTeam][this.inning - 1] || 0;
      if (this.checkGameOver()) return 'over';
      this.outs = 0; this.runners = [null, null, null]; this.resetCount();
      if (this.half === 0) this.half = 1; else { this.half = 0; this.inning++; }
      return 'inning';
    }
    if (this.checkGameOver()) return 'over';
    return null;
  }

  checkGameOver() {
    const last = this.inning >= this.innings;
    // Walk-off: home leads in bottom of final/extra inning.
    if (last && this.half === 1 && this.runs[1] > this.runs[0]) { this.end(); return true; }
    if (this.outs >= 3) {
      if (last && this.half === 0 && this.runs[1] > this.runs[0]) { this.end(); return true; } // home ahead after top
      if (last && this.half === 1 && this.runs[0] !== this.runs[1]) { this.end(); return true; }
    }
    return false;
  }

  end() { this.over = true; this.winner = this.runs[0] > this.runs[1] ? 0 : 1; }

  inningLabel() { return `${this.half === 0 ? 'TOP' : 'BOT'} ${this.inning}`; }
}

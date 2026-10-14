import type { GameState, RestockRun, Rival, RivalKind, ItemDef } from './types';
import { STORE_BY_ID } from './data/stores';
import { RIVALS, ENCOUNTERS, LINE_FLAVOR, type EncounterDef } from './data/restock';
import { computeModifiers, storeCycleProfit, storeCycleSeconds, pullItem, earn, bumpMission, isConWeekend, type Modifiers } from './sim';
import { fakeRoll } from './deals';
import { weightedPick } from './math';

// Restock runs: the "standing outside at 6am" part of scalping. You pick a
// store, stand in line behind rivals who each take their share, then when
// doors open you mash GRAB for 12 seconds while Kube Moms, little kids,
// other resellers and the manager interrupt you with choices.

export const RESTOCK_COOLDOWN_SECONDS = 10 * 60;
export const BAN_SECONDS = 10 * 60;
export const DOORS_SECONDS = 12;
export const TAPS_PER_UNIT = 3;
export const ENCOUNTER_EVERY_SECONDS = 3;

const RIVAL_WEIGHTS: Record<RivalKind, number> = { mom: 32, kid: 23, reseller: 18, grandpa: 11, employee: 6, sneakerbro: 10 };

export function restockReady(s: GameState, storeId: string, now: number): boolean {
  return (s.stores[storeId]?.units ?? 0) > 0 && (s.restockReadyAt[storeId] ?? 0) <= now && (s.bannedUntil[storeId] ?? 0) <= now;
}

export function makeRival(kind: RivalKind, rand: () => number): Rival {
  const def = RIVALS[kind];
  const [lo, hi] = def.takes;
  return { kind, name: def.names[Math.floor(rand() * def.names.length)], icon: def.icon, takes: lo + Math.floor(rand() * (hi - lo + 1)) };
}

export function startRun(s: GameState, storeId: string, m: Modifiers, now: number, rand: () => number): RestockRun | null {
  if (!restockReady(s, storeId, now)) return null;
  const stock = Math.round((10 + Math.floor(rand() * 8)) * (isConWeekend(now) ? 1.5 : 1));
  const ahead = Math.max(0, 4 + Math.floor(rand() * 4) - m.linePosition);
  const rivals: Rival[] = [];
  for (let i = 0; i < ahead; i++) rivals.push(makeRival(weightedPick(RIVAL_WEIGHTS, rand), rand));
  const taken = rivals.reduce((a, r) => a + r.takes, 0);
  const lineEnc = ENCOUNTERS.filter((e) => e.line);
  const encounter = rand() < 0.6 ? lineEnc[Math.floor(rand() * lineEnc.length)].id : null;
  return {
    storeId,
    phase: 'line',
    stock,
    remaining: Math.max(1, stock - taken),
    rivals,
    grabbed: 0,
    grabProgress: 0,
    timeLeft: DOORS_SECONDS,
    encounter,
    nextEncounterIn: ENCOUNTER_EVERY_SECONDS,
    limit: null,
    heat: 0,
    banned: false,
    kidsSpared: 0,
    kidsSnatched: 0,
    momsArgued: 0,
    brosRaced: 0,
    log: [LINE_FLAVOR[Math.floor(rand() * LINE_FLAVOR.length)]],
    carry: 4 + m.carry,
  };
}

export function encounterDef(id: string | null): EncounterDef | null {
  return id ? ENCOUNTERS.find((e) => e.id === id) ?? null : null;
}

export function openDoors(run: RestockRun): void {
  if (run.phase !== 'line') return;
  run.phase = 'doors';
  run.encounter = null;
  run.log.push('DOORS OPEN. Go go go.');
}

/** One GRAB tap. Returns true when a unit was secured. */
export function grab(run: RestockRun, tapPower: number): boolean {
  if (run.phase !== 'doors' || run.encounter) return false;
  if (run.remaining <= 0 || run.grabbed >= run.carry || (run.limit !== null && run.grabbed >= run.limit)) return false;
  run.grabProgress += (1 / TAPS_PER_UNIT) * Math.min(3, Math.sqrt(tapPower));
  if (run.grabProgress >= 1) {
    run.grabProgress = 0;
    run.grabbed += 1;
    run.remaining -= 1;
    return true;
  }
  return false;
}

/** Advance the doors timer; spawns encounters; ends the run when time or stock runs out. */
export function tickRun(run: RestockRun, dt: number, rand: () => number): void {
  if (run.phase !== 'doors' || run.encounter) return;
  run.timeLeft -= dt;
  run.nextEncounterIn -= dt;
  const capped = run.grabbed >= run.carry || (run.limit !== null && run.grabbed >= run.limit);
  if (run.timeLeft <= 0 || run.remaining <= 0 || capped) {
    run.phase = 'done';
    run.timeLeft = Math.max(0, run.timeLeft);
    run.log.push(capped ? 'Cart full. Walk of pride to the register.' : run.remaining <= 0 ? 'Shelf empty. Somewhere a kid is crying.' : 'Time. The manager is looking at you.');
    return;
  }
  if (run.nextEncounterIn <= 0) {
    const pool = ENCOUNTERS.filter((e) => !e.line);
    run.encounter = pool[Math.floor(rand() * pool.length)].id;
    run.nextEncounterIn = ENCOUNTER_EVERY_SECONDS + rand() * 2;
  }
}

export function choose(run: RestockRun, choiceIdx: number, rand: () => number): string {
  const enc = encounterDef(run.encounter);
  if (!enc) return '';
  const c = enc.choices[choiceIdx];
  if (!c) return '';
  run.encounter = null;
  let msg = '';
  switch (c.effect) {
    case 'spareKid':
      if (run.grabbed > 0) run.grabbed -= 1; else run.remaining = Math.max(0, run.remaining - 1);
      run.kidsSpared += 1;
      run.heat -= 4;
      msg = 'He hugs it. His mom mouths "thank you". You feel something. Ignore it.';
      break;
    case 'snatchKid':
      run.grabbed += 1;
      run.remaining = Math.max(0, run.remaining - 1);
      run.kidsSnatched += 1;
      run.heat += 10;
      msg = 'Got it. Three people filmed that.';
      break;
    case 'argueMom':
      run.momsArgued += 1;
      run.heat += 6;
      if (rand() < 0.5) { msg = 'You win the argument. The group chat will remember this.'; }
      else { run.timeLeft -= 3; msg = 'She does not move. You lose 3 seconds and some dignity.'; }
      break;
    case 'complimentMom':
      if (rand() < 0.7) msg = '"It IS a nice minivan." She moves the cart. Everyone wins.';
      else { run.timeLeft -= 2; msg = 'She knows what you are doing. 2 seconds gone.'; }
      break;
    case 'crawlMom':
      run.heat += 3;
      run.timeLeft -= 1;
      msg = 'You crawl. A child watches. You are through.';
      break;
    case 'splitShelf': {
      const half = Math.floor(run.remaining / 2);
      run.grabbed = Math.min(run.carry, run.grabbed + half);
      run.remaining -= half;
      run.phase = 'done';
      msg = `Split with Dalton: +${half}. Nobody gets banned today.`;
      run.log.push(msg);
      return msg;
    }
    case 'noSplit':
      run.remaining = Math.max(0, run.remaining - 2);
      msg = 'Dalton shrugs and takes two. It is on.';
      break;
    case 'comply':
      run.limit = run.grabbed + 2;
      msg = 'You nod. Two more, then the register.';
      break;
    case 'cousins':
      if (rand() < 0.6) msg = '"...Fine." He walks off. The cousins are not real.';
      else {
        run.banned = true;
        run.heat += 10;
        run.phase = 'done';
        msg = 'BANNED. Escorted out with your two. Photo on the wall by the register.';
        run.log.push(msg);
        return msg;
      }
      break;
    case 'raceBro':
      run.brosRaced += 1;
      if (rand() < 0.5) { run.grabbed = Math.min(run.carry, run.grabbed + 2); run.remaining = Math.max(0, run.remaining - 2); msg = 'You beat him to the row. +2. He calls it an "L" and films you.'; }
      else { run.remaining = Math.max(0, run.remaining - 4); run.timeLeft -= 2; msg = 'He has camped for sneaker drops. He is faster. Row gone, 2 seconds gone.'; }
      break;
    case 'fudBro':
      if (rand() < 0.7) { msg = 'He opens the app to check. He is gone for the rest of the restock. Bless the chart.'; }
      else { run.remaining = Math.max(0, run.remaining - 3); msg = '"Nice try bro." He takes three and taps his phone at you.'; }
      break;
    case 'halvesBro': {
      const half = Math.floor(run.remaining / 2);
      run.grabbed = Math.min(run.carry, run.grabbed + Math.min(2, half));
      run.remaining = Math.max(0, run.remaining - half);
      msg = `"Respect the hustle." Halves. You secure ${Math.min(2, half)}, he secures a duffel bag.`;
      break;
    }
    case 'letCut':
      run.remaining = Math.max(1, run.remaining - 3);
      run.heat -= 3;
      msg = 'She cuts. Takes three. The kid did not pee.';
      break;
    case 'refuseCut':
      run.heat += 2;
      if (rand() < 0.4) { run.remaining = Math.max(1, run.remaining - 1); msg = 'She argues loudly. The employee lets her in first anyway.'; }
      else msg = '"No." She mutters something about resellers. You hold your spot.';
      break;
  }
  run.log.push(msg);
  return msg;
}

export interface RunResult {
  items: ItemDef[];
  fakes: number;
  cash: number;
  heat: number;
  banned: boolean;
}

/** Apply a finished run to the game state. */
export function finishRun(s: GameState, run: RestockRun, now: number, rand: () => number): RunResult {
  const m = computeModifiers(s, now);
  const items: ItemDef[] = [];
  let fakes = 0;
  for (let i = 0; i < run.grabbed; i++) {
    if (fakeRoll(run.storeId, m, rand)) {
      const it = pullItem(s, run.storeId, m.pullLuck, rand);
      s.shelf[it.id] -= 1;
      s.stats.pulls -= 1;
      s.fakes.push(it.id);
      fakes++;
    } else items.push(pullItem(s, run.storeId, m.pullLuck, rand));
  }
  // Cash is sized by time (30s of that store's income per unit) so a late
  // store's long cycle does not turn a restock into hours of income.
  const storeIps = storeCycleProfit(s, run.storeId, m) / storeCycleSeconds(s, run.storeId, m);
  const cash = storeIps * 30 * run.grabbed + STORE_BY_ID[run.storeId].baseProfit * run.grabbed;
  earn(s, cash);
  s.heat = Math.max(0, Math.min(100, s.heat + run.heat));
  s.restockReadyAt[run.storeId] = now + RESTOCK_COOLDOWN_SECONDS * 1000;
  if (run.banned) s.bannedUntil[run.storeId] = now + BAN_SECONDS * 1000;
  s.stats.restocks += 1;
  s.stats.restockUnits += run.grabbed;
  s.stats.kidsSpared += run.kidsSpared;
  s.stats.kidsSnatched += run.kidsSnatched;
  s.stats.momsArgued += run.momsArgued;
  s.stats.broRaces += run.brosRaced;
  if (run.banned) s.stats.bans += 1;
  if (run.grabbed > s.stats.bestRestock) s.stats.bestRestock = run.grabbed;
  bumpMission(s, 'restocks', 1);
  return { items, fakes, cash, heat: run.heat, banned: run.banned };
}

export function isBanned(s: GameState, storeId: string, now: number): boolean {
  return (s.bannedUntil[storeId] ?? 0) > now;
}

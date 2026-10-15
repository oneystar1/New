import type { GameState, RestockRun, Rival, RivalKind, PullView } from './types';
import { STORE_BY_ID } from './data/stores';
import { RIVALS, ENCOUNTERS, LINE_FLAVOR, INTEL_LINES, type EncounterDef } from './data/restock';
import { computeModifiers, storeCycleProfit, storeCycleSeconds, pullItem, unpull, earn, bumpMission, isConWeekend, weekKey, incomePerSecond, type Modifiers } from './sim';
import { fakeRoll } from './deals';
import { weightedPick, formatCash } from './math';

// Restock runs: the "standing outside at 6am" part of scalping. You pick a
// store, stand in line behind rivals who each take their share, then when
// doors open you mash GRAB for 12 seconds while Kube Moms, little kids,
// other resellers and the manager interrupt you with choices.

export const RESTOCK_COOLDOWN_SECONDS = 10 * 60;
export const BAN_SECONDS = 10 * 60;
export const DOORS_SECONDS = 12;
export const TAPS_PER_UNIT = 3;
export const ENCOUNTER_EVERY_SECONDS = 3;
export const CAMP_SECONDS = 25;
export const CAMP_EVENT_EVERY_SECONDS = 4;
/** Showing up at opening instead of camping: this many latecomers beat you to the line. */
export const SKIP_CAMP_PENALTY = 2;

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
  const intel = s.restockIntel[storeId] ?? 0;
  delete s.restockIntel[storeId];
  const stock = Math.round((10 + Math.floor(rand() * 8)) * (isConWeekend(now) ? 1.5 : 1)) + intel;
  const ahead = Math.max(0, 4 + Math.floor(rand() * 4) - m.linePosition);
  const rivals: Rival[] = [];
  for (let i = 0; i < ahead; i++) rivals.push(makeRival(weightedPick(RIVAL_WEIGHTS, rand), rand));
  const run: RestockRun = {
    storeId,
    phase: 'choice',
    position: rivals.length,
    campLeft: CAMP_SECONDS,
    nextCampEventIn: 2.5,
    eventExpiresIn: null,
    phoneUsed: [],
    momDiscount: 0,
    doorsPenalty: 0,
    coffeeRounds: 0,
    ticketsGrabbed: 0,
    spotsSold: 0,
    stock,
    remaining: stock,
    rivals,
    grabbed: 0,
    grabProgress: 0,
    timeLeft: DOORS_SECONDS,
    encounter: null,
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
  run.remaining = computeRemaining(run);
  return run;
}

/** Stock left for you given your spot: everyone ahead takes their share (moms take fewer after coffee). */
export function computeRemaining(run: RestockRun): number {
  let taken = 0;
  for (let i = 0; i < run.position; i++) {
    const r = run.rivals[i];
    if (r) taken += Math.max(0, r.takes - (r.kind === 'mom' ? run.momDiscount : 0));
    else taken += 2; // latecomers who still beat you
  }
  return Math.max(1, run.stock - taken);
}

export function chooseCamp(run: RestockRun): void {
  if (run.phase !== 'choice') return;
  run.phase = 'camp';
  run.log.push('6:05am. Folding chair out. It is colder than the app said.');
}

export function chooseSkip(run: RestockRun): void {
  if (run.phase !== 'choice') return;
  run.position += SKIP_CAMP_PENALTY;
  run.log.push(`You rolled up at opening. ${SKIP_CAMP_PENALTY} people who camped are ahead of you now.`);
  openDoors(run);
}

/** Advance the camp clock: spawn timed line events, expire them, end the camp. */
export function tickCamp(run: RestockRun, dt: number, rand: () => number): void {
  if (run.phase !== 'camp') return;
  if (run.encounter) {
    if (run.eventExpiresIn !== null) {
      run.eventExpiresIn -= dt;
      if (run.eventExpiresIn <= 0) {
        const enc = encounterDef(run.encounter);
        run.encounter = null;
        run.eventExpiresIn = null;
        if (enc?.id === 'camp_ticket') { run.position += 1; run.log.push('Too slow. The tickets are gone and a mom slid in front of you.'); }
      }
    }
    return; // untimed events pause the clock
  }
  run.campLeft -= dt;
  run.nextCampEventIn -= dt;
  if (run.campLeft <= 0) { openDoors(run); return; }
  if (run.nextCampEventIn <= 0) {
    const pool = ENCOUNTERS.filter((e) => e.line);
    const enc = pool[Math.floor(rand() * pool.length)];
    run.encounter = enc.id;
    run.eventExpiresIn = enc.timed ?? null;
    run.nextCampEventIn = CAMP_EVENT_EVERY_SECONDS + rand() * 2;
  }
}

/** Phone actions while waiting. Each can be used once per camp. */
export function phoneAction(s: GameState, run: RestockRun, id: 'message' | 'intel' | 'nap', rand: () => number): string {
  if (run.phase !== 'camp' || run.encounter || run.phoneUsed.includes(id)) return '';
  run.phoneUsed.push(id);
  switch (id) {
    case 'intel': {
      s.restockIntel[run.storeId] = (s.restockIntel[run.storeId] ?? 0) + 4;
      const line = INTEL_LINES[Math.floor(rand() * INTEL_LINES.length)];
      run.log.push(line);
      return line;
    }
    case 'nap': {
      s.heat = Math.max(0, s.heat - 6);
      if (rand() < 0.35) { run.position += 2; run.log.push('You wake up. Two people are standing where you were standing.'); return 'You wake up two spots back. Heat -6 though.'; }
      run.log.push('Twenty minutes of chair sleep. Heat -6.');
      return 'Chair sleep. Heat -6. Nobody moved.';
    }
    case 'message':
      return 'Phone out. One message, then back to the line.';
  }
}

/** Camp-phase choices (bathroom, coffee, tickets, spot sales, rain, chairs, security, cutters). */
export function campChoose(s: GameState, run: RestockRun, choiceIdx: number, rand: () => number): string {
  const enc = encounterDef(run.encounter);
  if (!enc || run.phase !== 'camp') return '';
  const c = enc.choices[choiceIdx];
  if (!c) return '';
  run.encounter = null;
  run.eventExpiresIn = null;
  const m = computeModifiers(s, Date.now());
  const ips = Math.max(1, incomePerSecond(s, m, true));
  let msg = '';
  switch (c.effect) {
    case 'holdSpot':
      if (rand() < 0.7) msg = 'She held it. She even glared at the guy who tried to slide in. Respect.';
      else { run.position += 2; msg = '"Oh, I thought you left." Two spots gone.'; }
      break;
    case 'justGo': run.position += 2; msg = 'Relief. Also two people are in your spot.'; break;
    case 'holdIt': run.doorsPenalty += 3; msg = 'You hold it. You will be slower at the shelf. Worth it. Maybe.'; break;
    case 'coffeeRound': {
      const cost = Math.max(10, ips * 30);
      if (s.cash < cost) { msg = 'You check your pockets. You cannot afford a round. The line notices.'; break; }
      s.cash -= cost;
      s.heat = Math.max(0, s.heat - 5);
      run.momDiscount = 1;
      run.coffeeRounds += 1;
      msg = `Round bought for ${formatCash(cost)}. Heat -5. The moms are taking one fewer each. Everyone loves you for eleven minutes.`;
      break;
    }
    case 'coffeeSolo': { const cost = Math.max(3, ips * 3); s.cash = Math.max(0, s.cash - cost); msg = 'One coffee. Nobody else gets one. Nobody forgets.'; break; }
    case 'nothing': msg = 'You stay put.'; break;
    case 'grabTicket': run.position = Math.max(0, run.position - 3); run.ticketsGrabbed += 1; msg = 'Ticket in hand. Your spot is locked and three people who blinked are behind you.'; break;
    case 'sellSpot': { const cash = ips * 60; earn(s, cash); run.position += 5; run.spotsSold += 1; msg = `Sold the spot for ${formatCash(cash)} and a taquito. Five people ahead of you now.`; break; }
    case 'stayRain': run.position = Math.max(0, run.position - 3); run.heat = Math.max(0, run.heat - 1); msg = 'Soaked. Three people gave up. You did not.'; break;
    case 'carRain': run.position += 2; msg = 'Dry, warm, two spots back.'; break;
    case 'giveChair': run.heat -= 4; msg = 'He sits. He tells you about 1987. Heat -4.'; break;
    case 'ignoreGrandpa': run.heat += 2; msg = 'You look at your phone very hard. +2 heat.'; break;
    case 'complySecurity': run.position += 1; msg = 'Tent down. In the shuffle someone steps in front of you.'; break;
    case 'argueSecurity': run.heat += 4; if (rand() < 0.5) msg = 'He shrugs and moves on. +4 heat, spot kept.'; else { run.position += 2; msg = 'He makes you move. Two spots gone, +4 heat.'; } break;
    case 'letCut': run.position += 1; run.heat -= 3; msg = 'She cuts. The kid did not pee.'; break;
    case 'refuseCut': run.heat += 2; if (rand() < 0.4) { run.position += 1; msg = 'She argues loudly. The employee lets her in first anyway.'; } else msg = '"No." She mutters something about resellers. You hold your spot.'; break;
    default: msg = ''; break;
  }
  run.remaining = computeRemaining(run);
  if (msg) run.log.push(msg);
  return msg;
}

export function encounterDef(id: string | null): EncounterDef | null {
  return id ? ENCOUNTERS.find((e) => e.id === id) ?? null : null;
}

export function openDoors(run: RestockRun): void {
  if (run.phase !== 'choice' && run.phase !== 'camp') return;
  run.phase = 'doors';
  run.encounter = null;
  run.eventExpiresIn = null;
  run.remaining = computeRemaining(run);
  run.timeLeft = Math.max(4, DOORS_SECONDS - run.doorsPenalty);
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
  items: PullView[];
  fakes: number;
  cash: number;
  heat: number;
  banned: boolean;
}

/** Apply a finished run to the game state. */
export function finishRun(s: GameState, run: RestockRun, now: number, rand: () => number): RunResult {
  const m = computeModifiers(s, now);
  const items: PullView[] = [];
  let fakes = 0;
  for (let i = 0; i < run.grabbed; i++) {
    const p = pullItem(s, run.storeId, m.pullLuck, rand);
    if (fakeRoll(run.storeId, m, rand)) { unpull(s, p); s.fakes.push(p.item.id); fakes++; }
    else items.push(p);
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
  if (run.campLeft < CAMP_SECONDS) s.stats.camps += 1;
  s.stats.coffeeRounds += run.coffeeRounds;
  s.stats.ticketsGrabbed += run.ticketsGrabbed;
  s.stats.spotsSold += run.spotsSold;
  s.stats.restockUnits += run.grabbed;
  if (isConWeekend(now)) {
    const wk = weekKey(now);
    if (s.conWeek.week !== wk) s.conWeek = { week: wk, units: 0 };
    s.conWeek.units += run.grabbed;
  }
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

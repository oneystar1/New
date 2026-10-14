import { describe, it, expect } from 'vitest';
import { initialState } from '../src/engine/state';
import { computeModifiers, tick } from '../src/engine/sim';
import { startRun, openDoors, grab, tickRun, choose, finishRun, restockReady, isBanned, TAPS_PER_UNIT, RESTOCK_COOLDOWN_SECONDS, BAN_SECONDS } from '../src/engine/restock';
import { makeOffer, PRICING } from '../src/engine/deals';
import { RIVALS } from '../src/engine/data/restock';
import { makeRng } from '../src/engine/math';
import type { RestockRun } from '../src/engine/types';

const T0 = 1_700_000_000_000;

function ready() {
  const s = initialState(T0);
  s.stores.bullseye.units = 30;
  s.stores.bullseye.manager = true;
  return s;
}

function runWith(seed = 1): { s: ReturnType<typeof ready>; run: RestockRun } {
  const s = ready();
  const run = startRun(s, 'bullseye', computeModifiers(s, T0), T0, makeRng(seed))!;
  return { s, run };
}

describe('restock runs', () => {
  it('needs units and respects cooldown and bans', () => {
    const s = initialState(T0);
    expect(restockReady(s, 'bullseye', T0)).toBe(false);
    s.stores.bullseye.units = 1;
    expect(restockReady(s, 'bullseye', T0)).toBe(true);
    s.restockReadyAt.bullseye = T0 + 1;
    expect(restockReady(s, 'bullseye', T0)).toBe(false);
    s.restockReadyAt.bullseye = 0;
    s.bannedUntil.bullseye = T0 + 1;
    expect(restockReady(s, 'bullseye', T0)).toBe(false);
  });
  it('builds a line whose rivals eat stock, gear shortens the line', () => {
    const { run } = runWith(3);
    expect(run.phase).toBe('line');
    expect(run.rivals.length).toBeGreaterThanOrEqual(4);
    const taken = run.rivals.reduce((a, r) => a + r.takes, 0);
    expect(run.remaining).toBe(Math.max(1, run.stock - taken));
    const s2 = ready();
    s2.upgrades.push('u_chair', 'u_tent', 'u_minivan');
    const run2 = startRun(s2, 'bullseye', computeModifiers(s2, T0), T0, makeRng(3))!;
    expect(run2.rivals.length).toBeLessThan(run.rivals.length);
    expect(run2.carry).toBe(run.carry + 3);
  });
  it('grab needs three taps per unit and stops at carry or shelf', () => {
    const { run } = runWith(2);
    run.encounter = null;
    openDoors(run);
    expect(grab(run, 1)).toBe(false);
    expect(grab(run, 1)).toBe(false);
    expect(grab(run, 1)).toBe(true);
    expect(run.grabbed).toBe(1);
    const target = Math.min(run.carry, run.remaining + run.grabbed);
    for (let i = 0; i < 100; i++) grab(run, 1);
    expect(run.grabbed).toBe(target);
    expect(grab(run, 1)).toBe(false);
    expect(TAPS_PER_UNIT).toBe(3);
  });
  it('timer ends the run and spawns encounters that pause it', () => {
    const { run } = runWith(4);
    run.encounter = null;
    openDoors(run);
    const rng = makeRng(8);
    tickRun(run, 3.1, rng);
    expect(run.encounter).not.toBeNull();
    const tl = run.timeLeft;
    tickRun(run, 2, rng);
    expect(run.timeLeft).toBe(tl); // paused during encounter
    run.encounter = null;
    tickRun(run, 20, rng);
    expect(run.phase).toBe('done');
  });
  it('choices have consequences: spare vs snatch, split, ban', () => {
    const { run } = runWith(5);
    run.encounter = null;
    openDoors(run);
    run.grabbed = 2;
    run.encounter = 'kid_last';
    choose(run, 0, makeRng(1));
    expect(run.grabbed).toBe(1);
    expect(run.kidsSpared).toBe(1);
    expect(run.heat).toBe(-4);
    run.encounter = 'kid_last';
    choose(run, 1, makeRng(1));
    expect(run.grabbed).toBe(2);
    expect(run.heat).toBe(6);
    run.encounter = 'reseller_split';
    const before = run.remaining;
    choose(run, 0, makeRng(1));
    expect(run.phase).toBe('done');
    expect(run.remaining).toBe(before - Math.floor(before / 2));
    // ban branch: force rng >= 0.6
    const b = runWith(6).run;
    openDoors(b);
    b.encounter = 'manager_limit';
    choose(b, 1, () => 0.99);
    expect(b.banned).toBe(true);
    expect(b.phase).toBe('done');
    b.encounter = 'manager_limit';
  });
  it('sneaker bro encounters: race, FUD, halves', () => {
    expect(RIVALS.sneakerbro.takes).toEqual([3, 4]);
    const { run } = runWith(21);
    run.encounter = null;
    openDoors(run);
    run.remaining = 8;
    run.encounter = 'bro_row';
    choose(run, 0, () => 0.1); // win the race
    expect(run.grabbed).toBe(2);
    expect(run.remaining).toBe(6);
    expect(run.brosRaced).toBe(1);
    run.encounter = 'bro_row';
    choose(run, 1, () => 0.1); // he checks the chart and leaves
    expect(run.remaining).toBe(6);
    run.encounter = 'bro_row';
    choose(run, 2, () => 0.1); // halves
    expect(run.grabbed).toBe(4);
    expect(run.remaining).toBe(3);
  });
  it('comply caps the cart at two more', () => {
    const { run } = runWith(7);
    run.encounter = null;
    openDoors(run);
    run.grabbed = 1;
    run.encounter = 'manager_limit';
    choose(run, 0, makeRng(1));
    expect(run.limit).toBe(3);
    for (let i = 0; i < 30; i++) grab(run, 1);
    expect(run.grabbed).toBe(Math.min(3, run.carry));
  });
  it('finishing a run pays items, cash, heat, cooldown and bans', () => {
    const { s, run } = runWith(9);
    run.encounter = null;
    openDoors(run);
    for (let i = 0; i < 12; i++) grab(run, 1);
    run.phase = 'done';
    run.heat = 10;
    run.banned = true;
    const cashBefore = s.cash;
    const res = finishRun(s, run, T0, makeRng(2));
    expect(res.items.length + res.fakes).toBe(run.grabbed);
    expect(s.cash).toBeGreaterThan(cashBefore);
    expect(s.heat).toBe(10);
    expect(s.restockReadyAt.bullseye).toBe(T0 + RESTOCK_COOLDOWN_SECONDS * 1000);
    expect(s.bannedUntil.bullseye).toBe(T0 + BAN_SECONDS * 1000);
    expect(isBanned(s, 'bullseye', T0 + 1)).toBe(true);
    expect(s.stats.restocks).toBe(1);
    expect(s.stats.bans).toBe(1);
    expect(s.stats.bestRestock).toBe(run.grabbed);
  });
  it('a banned store stops cycling', () => {
    const s = ready();
    s.stores.bullseye.progress = 1e-6;
    s.bannedUntil.bullseye = T0 + 60_000;
    tick(s, 30, T0 + 30_000, makeRng(1));
    expect(s.cash).toBe(10);
    tick(s, 30, T0 + 61_000, makeRng(1));
    expect(s.cash).toBeGreaterThan(10);
  });
});

describe('pricing dial', () => {
  it('retail never spawns karens, insane mostly ghosts and karens, values scale', () => {
    const s = ready();
    s.shelf.doh_kube = 1;
    const m = computeModifiers(s, T0);
    s.pricing = 'retail';
    const rng = makeRng(12);
    for (let i = 0; i < 300; i++) expect(makeOffer(s, m, T0, rng)!.kind).not.toBe('karen');
    s.pricing = 'insane';
    let hostile = 0;
    for (let i = 0; i < 300; i++) { const k = makeOffer(s, m, T0, rng)!.kind; if (k === 'karen' || k === 'ghost') hostile++; }
    expect(hostile).toBeGreaterThan(120);
    // Same seed, both fair: the only difference is the pricing multiplier.
    let checked = false;
    for (let i = 0; i < 400 && !checked; i++) {
      s.pricing = 'fair';
      const a = makeOffer(s, m, T0, makeRng(500 + i))!;
      s.pricing = 'insane';
      const b = makeOffer(s, m, T0, makeRng(500 + i))!;
      if (a.kind === 'fair' && b.kind === 'fair') { expect(b.amount / a.amount).toBeCloseTo(PRICING.insane.value, 3); checked = true; }
    }
    expect(checked).toBe(true);
    s.pricing = 'insane';
    // insane pricing slowly heats you up
    s.heat = 0;
    tick(s, 100, T0 + 100_000, makeRng(1));
    expect(s.heat).toBeGreaterThan(0);
  });
});

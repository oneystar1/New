import { describe, it, expect } from 'vitest';
import { initialState } from '../src/engine/state';
import { computeModifiers, tick, prestige, rollCityOffer, isConWeekend } from '../src/engine/sim';
import { startRun } from '../src/engine/restock';
import { CITIES, CITY_BY_ID } from '../src/engine/data/cities';
import { RANKED_RIVALS } from '../src/engine/data/rivals';
import { TUTORIAL } from '../src/engine/data/tutorial';
import { makeRng } from '../src/engine/math';

const T0 = 1_700_000_000_000; // a Tuesday

describe('cities', () => {
  it('offers two distinct cities, never the current one or Dayton', () => {
    const s = initialState(T0);
    for (let i = 0; i < 50; i++) {
      s.city = CITIES[(i % (CITIES.length - 1)) + 1].id;
      const [a, b] = rollCityOffer(s, makeRng(i));
      expect(a).not.toBe(b);
      expect(a).not.toBe(s.city);
      expect(b).not.toBe(s.city);
      expect(a).not.toBe('dayton');
    }
  });
  it('relocating applies the chosen city perk', () => {
    const s = initialState(T0);
    s.stats.totalCashEarned = 1e9;
    prestige(s, T0, 'austin');
    expect(s.city).toBe('austin');
    expect(s.cityOffer).toBeNull();
    expect(computeModifiers(s, T0).globalProfit).toBeCloseTo(1.3, 6);
    prestige(s, T0, 'nope');
    expect(s.city).toBe('austin'); // unknown id ignored
  });
  it('every city perk is a valid effect', () => {
    for (const c of CITIES) {
      const s = initialState(T0);
      s.city = c.id;
      expect(() => computeModifiers(s, T0)).not.toThrow();
      expect(CITY_BY_ID[c.id]).toBe(c);
    }
  });
});

describe('tutorial and rankings', () => {
  it('tutorial steps complete from state and pay clout once', () => {
    const s = initialState(T0);
    s.stats.taps = 10;
    const res = tick(s, 0.1, T0 + 100, makeRng(1));
    expect(res.tutorialDone).toContain('t_tap');
    expect(s.clout).toBe(5);
    tick(s, 0.1, T0 + 200, makeRng(1));
    expect(s.clout).toBe(5);
    expect(TUTORIAL.length).toBe(9);
  });
  it('overtaking rivals pays clout in order', () => {
    const s = initialState(T0);
    s.stats.lifetimeCashEarned = 70_000;
    const res = tick(s, 0.1, T0 + 100, makeRng(1));
    expect(res.overtook).toEqual(['r_timmy', 'r_ron', 'r_jess']);
    expect(s.clout).toBe(3 + 5 + 8);
    expect(RANKED_RIVALS.every((r, i) => i === 0 || r.netWorth > RANKED_RIVALS[i - 1].netWorth)).toBe(true);
  });
});

describe('con weekend', () => {
  it('is Saturday or Sunday local time and fills restock trucks', () => {
    const sat = new Date(2026, 9, 17, 12).getTime();
    const tue = new Date(2026, 9, 13, 12).getTime();
    expect(isConWeekend(sat)).toBe(true);
    expect(isConWeekend(tue)).toBe(false);
    const s = initialState(tue);
    s.stores.dollar.units = 1;
    const m = computeModifiers(s, tue);
    const a = startRun(s, 'dollar', m, tue, makeRng(4))!;
    const b = startRun(s, 'dollar', m, sat, makeRng(4))!;
    expect(b.stock).toBe(Math.round(a.stock * 1.5));
  });
});

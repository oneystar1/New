import { describe, it, expect } from 'vitest';
import { initialState, migrate, serialize, deserialize } from '../src/engine/state';
import {
  tick, computeModifiers, incomePerSecond, computeOffline, applyOfflineOnLoad, claimOffline, credForRun, prestige,
  pullItem, rollRarity, sellDuplicate, rollMissions, claimDaily, claimMission, passTierReached, claimPassTier, timeSkip,
} from '../src/engine/sim';
import { formatNumber, unitCost, maxAffordable, milestoneMult, makeRng } from '../src/engine/math';
import { STORES, STORE_BY_ID } from '../src/engine/data/stores';
import { ITEMS } from '../src/engine/data/items';
import { UPGRADES } from '../src/engine/data/upgrades';
import { MANAGERS } from '../src/engine/data/managers';
import { PRODUCTS } from '../src/engine/data/shop';
import { applyProduct } from '../src/engine/store';

const T0 = 1_700_000_000_000;

describe('math', () => {
  it('formats numbers with short suffixes and beyond', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1500)).toBe('1.50K');
    expect(formatNumber(2.5e9)).toBe('2.50B');
    expect(formatNumber(1e33)).toBe('1.00Dc');
    expect(formatNumber(1e36)).toBe('1.00aa');
    expect(formatNumber(1e6, 'scientific')).toBe('1.00e+6');
  });
  it('geometric unit cost matches summing singles', () => {
    const st = STORE_BY_ID.fiveunder;
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += unitCost(st, 3 + i);
    expect(unitCost(st, 3, 7)).toBeCloseTo(sum, 6);
  });
  it('maxAffordable never overspends and is maximal', () => {
    const st = STORE_BY_ID.bullseye;
    for (const cash of [0, 500, 720, 5_000, 1e6, 1e9]) {
      const n = maxAffordable(st, 4, cash);
      expect(unitCost(st, 4, n)).toBeLessThanOrEqual(cash + 1e-6);
      if (n > 0 || cash >= unitCost(st, 4)) expect(unitCost(st, 4, n + 1)).toBeGreaterThan(cash);
    }
  });
  it('milestones double', () => {
    expect(milestoneMult(24)).toBe(1);
    expect(milestoneMult(25)).toBe(2);
    expect(milestoneMult(100)).toBe(8);
  });
});

describe('data integrity', () => {
  it('every item points at a real store and stores unlock in order', () => {
    for (const it of ITEMS) expect(STORE_BY_ID[it.storeId]).toBeDefined();
    for (let i = 1; i < STORES.length; i++) {
      expect(STORES[i].baseCost).toBeGreaterThan(STORES[i - 1].baseCost);
      expect(STORES[i].unlockAtTotalUnits).toBeGreaterThanOrEqual(STORES[i - 1].unlockAtTotalUnits);
    }
  });
  it('every store has a manager and three cash upgrades', () => {
    for (const st of STORES) {
      expect(MANAGERS.find((m) => m.storeId === st.id)).toBeDefined();
      expect(UPGRADES.filter((u) => u.id.startsWith(`u_${st.id}_`)).length).toBe(3);
    }
  });
  it('ids are unique', () => {
    const ids = [...ITEMS, ...UPGRADES, ...PRODUCTS].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('simulation', () => {
  it('an unmanaged store pays once per manual cycle', () => {
    const s = initialState(T0);
    s.stores.dollar.units = 1;
    s.stores.dollar.progress = 1e-6;
    tick(s, 0.5, T0 + 500);
    expect(s.cash).toBe(10);
    tick(s, 0.6, T0 + 1100);
    expect(s.cash).toBeCloseTo(11, 6);
    expect(s.stores.dollar.progress).toBe(0);
  });
  it('managed stores earn continuously and milestones apply', () => {
    const s = initialState(T0);
    s.stores.dollar.units = 25;
    s.stores.dollar.manager = true;
    s.stores.dollar.progress = 1e-6;
    const m = computeModifiers(s, T0);
    expect(incomePerSecond(s, m)).toBeCloseTo(50, 6); // 25 units x2 milestone / 1s
    tick(s, 10, T0 + 10_000);
    expect(s.cash).toBeCloseTo(10 + 500, 3);
  });
  it('offline earnings are capped and halved by default, doubled on claim x2', () => {
    const s = initialState(T0);
    s.stores.dollar.units = 10;
    s.stores.dollar.manager = true;
    s.lastSeen = T0;
    const later = T0 + 10 * 3600 * 1000;
    const off = computeOffline(s, later);
    expect(off.cappedSeconds).toBe(2 * 3600);
    expect(off.cash).toBeCloseTo(10 * 2 * 3600 * 0.5, 3);
    applyOfflineOnLoad(s, later);
    expect(s.pendingOffline?.cash).toBeCloseTo(off.cash, 3);
    const got = claimOffline(s, 2);
    expect(got).toBeCloseTo(off.cash * 2, 3);
    expect(s.pendingOffline).toBeNull();
  });
  it('upgrades change modifiers and VIP stacks', () => {
    const s = initialState(T0);
    s.upgrades.push('u_shipping', 'p_offline1', 'u_tap1');
    s.iap.vipUntil = T0 + 1000;
    const m = computeModifiers(s, T0);
    expect(m.globalProfit).toBe(1.5 * 2);
    expect(m.offlineCapHours).toBe(2 + 4 + 4);
    expect(m.tapPower).toBe(2);
  });
  it('events start, apply, and end with hype after-effects', () => {
    const s = initialState(T0);
    s.nextEventAt = T0;
    const rng = makeRng(7);
    const res = tick(s, 0.1, T0 + 100, rng);
    expect(res.eventStarted).not.toBeNull();
    expect(s.event).not.toBeNull();
    const end = s.event!.endsAt + 1;
    tick(s, 0.1, end, rng);
    expect(s.event).toBeNull();
    expect(s.hype.squish !== 1 || s.hype.doh !== 1).toBe(true);
  });
});

describe('prestige', () => {
  it('needs $100M earned and grants power-scaled cred', () => {
    expect(credForRun(99_999_999)).toBe(0);
    expect(credForRun(1e8)).toBe(7);
    expect(credForRun(1e12)).toBe(501);
  });
  it('resets cash stores and cash upgrades but keeps clout/cred upgrades and shelf', () => {
    const s = initialState(T0);
    s.stats.totalCashEarned = 1e12;
    s.cash = 5e8;
    s.stores.bullseye.units = 50;
    s.upgrades.push('u_shipping', 'p_profit');
    s.shelf.sq_golden = 1;
    const gained = prestige(s, T0);
    expect(gained).toBe(501);
    expect(s.cred).toBe(501);
    expect(s.cash).toBe(10);
    expect(s.stores.bullseye.units).toBe(0);
    expect(s.upgrades).toEqual(['p_profit']);
    expect(s.shelf.sq_golden).toBe(1);
    expect(computeModifiers(s, T0).credMult).toBeCloseTo(1 + 501 * 0.02, 6);
  });
});

describe('pulls and shelf', () => {
  it('luck shifts rarity distribution upward', () => {
    const count = (luck: number) => {
      const rng = makeRng(42);
      let rare = 0;
      for (let i = 0; i < 5000; i++) if (rollRarity('botfarm', luck, rng) !== 'common') rare++;
      return rare;
    };
    expect(count(1)).toBeGreaterThan(count(0));
  });
  it('pulls add to the shelf and duplicates sell for at least resale value', () => {
    const s = initialState(T0);
    const rng = makeRng(3);
    const p = pullItem(s, 'dollar', 0, rng);
    const key = p.variant === 'standard' ? p.item.id : `${p.item.id}:${p.variant}`;
    expect(s.shelf[key]).toBe(1);
    expect(sellDuplicate(s, key, T0)).toBe(0);
    pullItem(s, 'dollar', 0, () => 0.01); // force same pool
    const dupId = Object.keys(s.shelf).find((k) => s.shelf[k] > 1) ?? (s.shelf[key] = 2, key);
    const v = sellDuplicate(s, dupId, T0);
    expect(v).toBeGreaterThan(0);
    expect(s.shelf[dupId]).toBe(1);
  });
});

describe('daily systems', () => {
  it('rolls three unique missions per day and claims rewards', () => {
    const s = initialState(T0);
    rollMissions(s, T0, makeRng(1));
    expect(s.missions.length).toBe(3);
    expect(new Set(s.missions.map((m) => m.id)).size).toBe(3);
    const ms = s.missions[0];
    ms.progress = 1e9;
    expect(claimMission(s, ms.id)).toBe(true);
    expect(claimMission(s, ms.id)).toBe(false);
    expect(s.clout).toBeGreaterThan(0);
    expect(s.pass.xp).toBeGreaterThan(0);
  });
  it('daily streak continues on consecutive days and resets after a gap', () => {
    const s = initialState(T0);
    expect(claimDaily(s, T0)?.day).toBe(1);
    expect(claimDaily(s, T0)).toBeNull();
    expect(claimDaily(s, T0 + 86400_000)?.day).toBe(2);
    expect(claimDaily(s, T0 + 5 * 86400_000)?.day).toBe(1);
  });
  it('season pass tiers unlock by xp and premium gating works', () => {
    const s = initialState(T0);
    s.pass.xp = 250;
    expect(passTierReached(s)).toBe(2);
    expect(claimPassTier(s, 1, false, T0)).not.toBeNull();
    expect(claimPassTier(s, 1, false, T0)).toBeNull();
    expect(claimPassTier(s, 1, true, T0)).toBeNull();
    s.pass.premium = true;
    expect(claimPassTier(s, 1, true, T0)).not.toBeNull();
    expect(claimPassTier(s, 3, false, T0)).toBeNull();
  });
});

describe('monetization', () => {
  it('products apply their entitlements', () => {
    const s = initialState(T0);
    s.stores.dollar.units = 10;
    s.stores.dollar.manager = true;
    applyProduct(s, 'ss_starter', T0);
    expect(s.iap.adFreeUntil).toBe(T0 + 7 * 86400_000);
    expect(s.iap.vipUntil).toBe(0);
    expect(s.clout).toBe(300);
    s.clout = 0;
    applyProduct(s, 'ss_noads', T0);
    expect(s.iap.noAds).toBe(true);
    applyProduct(s, 'ss_vip', T0);
    expect(s.iap.vipUntil).toBe(T0 + 7 * 86400_000);
    applyProduct(s, 'ss_vip', T0);
    expect(s.iap.vipUntil).toBe(T0 + 14 * 86400_000);
    applyProduct(s, 'ss_clout_m', T0);
    expect(s.clout).toBe(700);
    const before = s.cash;
    applyProduct(s, 'ss_bundle_drop', T0);
    expect(s.cash).toBeGreaterThan(before);
    expect(s.stats.pulls).toBe(15);
    applyProduct(s, 'ss_pass', T0);
    expect(s.pass.premium).toBe(true);
  });
  it('time skip pays managed income only', () => {
    const s = initialState(T0);
    s.stores.dollar.units = 10;
    expect(timeSkip(s, 1, T0)).toBe(0);
    s.stores.dollar.manager = true;
    expect(timeSkip(s, 1, T0)).toBeCloseTo(10 * 3600, 3);
  });
});

describe('save', () => {
  it('round-trips and migrates partial saves', () => {
    const s = initialState(T0);
    s.cash = 123;
    const back = deserialize(serialize(s), T0);
    expect(back.cash).toBe(123);
    const partial = migrate({ cash: 5, stores: { dollar: { units: 2, progress: 0, manager: true } } }, T0);
    expect(partial.cash).toBe(5);
    expect(partial.stores.dollar.units).toBe(2);
    expect(partial.stores.factory.units).toBe(0);
    expect(partial.pass.season).toBe(1);
    expect(deserialize('not json', T0).cash).toBe(10);
  });
});

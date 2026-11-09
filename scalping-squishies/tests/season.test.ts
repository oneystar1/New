import { describe, it, expect, afterEach } from 'vitest';
import { initialState, migrate } from '../src/engine/state';
import { tick, pullItem, computeModifiers, setProgress, claimDaily, bumpMission } from '../src/engine/sim';
import { SEASONS, SEASON_ITEMS, SEASON_MISSION_BY_ID, activeSeason, seasonEndsAt, setSeasonOverride, itemsForSeason, SEASON_TOKENS, SEASON_SHOP_PRICE, SEASON_TOKENS_PER_CLOUT } from '../src/engine/data/seasons';
import { ITEMS, ALL_ITEMS, ITEM_BY_ID } from '../src/engine/data/items';
import { ART } from '../src/art/art';
import { tickSeason, earnTokens, buySeasonItem, seasonShop, claimSeasonMission, rollSeasonItem, seasonSets } from '../src/engine/season';
import { startRun, chooseSkip, tickRun, finishRun } from '../src/engine/restock';
import { ENCOUNTERS } from '../src/engine/data/restock';
import { makeRng } from '../src/engine/math';

const at = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 12);

afterEach(() => setSeasonOverride(null));

describe('season calendar', () => {
  it('three seasons, 18 exclusive items with art, none in the core catalog', () => {
    expect(SEASONS.length).toBe(3);
    expect(SEASON_ITEMS.length).toBe(18);
    expect(ITEMS.length).toBe(87);
    expect(ALL_ITEMS.length).toBe(105);
    expect(new Set(ALL_ITEMS.map((i) => i.id)).size).toBe(105);
    for (const it of SEASON_ITEMS) {
      expect(it.season).toBeTruthy();
      expect(it.storeId).toBe('season');
      expect(ART[it.id]).toBeTruthy();
      expect(ITEM_BY_ID[it.id]).toBe(it);
      expect(SEASON_SHOP_PRICE[it.rarity]).toBeGreaterThan(0);
    }
    for (const s of SEASONS) expect(itemsForSeason(s.id).length).toBe(6);
  });
  it('windows recur yearly and Dohlidays wraps the new year', () => {
    expect(activeSeason(at(2026, 11, 9))).toBeNull();
    expect(activeSeason(at(2026, 11, 20))?.id).toBe('dohlidays');
    expect(activeSeason(at(2026, 12, 25))?.id).toBe('dohlidays');
    expect(activeSeason(at(2027, 1, 5))?.id).toBe('dohlidays');
    expect(activeSeason(at(2027, 1, 6))).toBeNull();
    expect(activeSeason(at(2027, 2, 14))?.id).toBe('squishyhearts');
    expect(activeSeason(at(2027, 10, 31))?.id).toBe('dohlloween');
    expect(activeSeason(at(2027, 11, 3))).toBeNull();
    const s = activeSeason(at(2026, 12, 25))!;
    expect(seasonEndsAt(s, at(2026, 12, 25))).toBe(Date.UTC(2027, 0, 6));
    expect(seasonEndsAt(s, at(2027, 1, 3))).toBe(Date.UTC(2027, 0, 6));
    setSeasonOverride('dohlidays');
    expect(seasonEndsAt(s, at(2026, 11, 9))).toBe(Date.UTC(2027, 0, 6)); // forced on early: still counts down to the real end
    expect(seasonEndsAt(activeSeason(at(2026, 2, 10))!, at(2026, 2, 10))).toBe(Date.UTC(2027, 0, 6));
  });
  it('override forces a season on or off', () => {
    setSeasonOverride('dohlloween');
    expect(activeSeason(at(2026, 6, 1))?.id).toBe('dohlloween');
    setSeasonOverride('none');
    expect(activeSeason(at(2026, 12, 25))).toBeNull();
  });
});

describe('season play', () => {
  it('tick starts the season, rolls 3 season missions, ends it and converts tokens to Clout', () => {
    const s = initialState(at(2026, 11, 19));
    const rng = makeRng(5);
    let r = tick(s, 1, at(2026, 11, 19), rng);
    expect(s.season.id).toBeNull();
    expect(r.seasonStarted).toBeNull();
    r = tick(s, 1, at(2026, 11, 21), rng);
    expect(r.seasonStarted).toBe('dohlidays');
    expect(s.season.id).toBe('dohlidays');
    expect(s.season.missions.length).toBe(3);
    s.season.tokens = 45;
    const clout = s.clout;
    r = tick(s, 1, at(2027, 1, 7), rng);
    expect(r.seasonEnded).toEqual({ id: 'dohlidays', clout: Math.floor(45 / SEASON_TOKENS_PER_CLOUT) });
    expect(s.clout).toBe(clout + 2);
    expect(s.season.id).toBeNull();
    expect(s.season.tokens).toBe(0);
    expect(s.season.missions.length).toBe(0);
  });
  it('seasonal items only drop in season, pulls and daily login pay tokens', () => {
    const off = initialState(at(2026, 6, 1));
    const rng = makeRng(9);
    for (let i = 0; i < 300; i++) pullItem(off, 'fiveunder', 0, rng);
    expect(SEASON_ITEMS.some((it) => (off.shelf[it.id] ?? 0) > 0)).toBe(false);
    expect(off.season.tokens).toBe(0);

    const on = initialState(at(2026, 12, 1));
    tickSeason(on, at(2026, 12, 1), rng);
    let seasonal = 0;
    for (let i = 0; i < 400; i++) { const p = pullItem(on, 'fiveunder', 0, rng); if (p.item.season === 'dohlidays') seasonal++; }
    expect(seasonal).toBeGreaterThan(30);
    expect(seasonal).toBeLessThan(100);
    expect(on.season.tokens).toBe(400 * SEASON_TOKENS.pull);
    claimDaily(on, at(2026, 12, 1));
    expect(on.season.tokens).toBe(400 * SEASON_TOKENS.pull + SEASON_TOKENS.daily);
    // the season pool is weighted toward commons
    const counts: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) { const it = rollSeasonItem('dohlidays', rng); counts[it.rarity] = (counts[it.rarity] ?? 0) + 1; }
    expect(counts.common).toBeGreaterThan(counts.select * 5);
  });
  it('event shop: one of each, costs tokens, completing the set pays its bonus', () => {
    const s = initialState(at(2026, 12, 1));
    tickSeason(s, at(2026, 12, 1), makeRng(1));
    expect(buySeasonItem(s, 'xm_candycane')).toBeNull(); // no tokens yet
    earnTokens(s, 1000);
    const before = computeModifiers(s, at(2026, 12, 1)).shelfMult;
    for (const row of seasonShop(s)) expect(buySeasonItem(s, row.item.id)?.id).toBe(row.item.id);
    expect(buySeasonItem(s, 'xm_candycane')).toBeNull(); // one each
    expect(s.season.bought.length).toBe(6);
    const total = seasonShop(s).reduce((a, r) => a + r.cost, 0);
    expect(total).toBe(490);
    expect(s.season.tokens).toBe(1000 - total);
    const set = setProgress(s).find((x) => x.id === 'season:dohlidays')!;
    expect(set.done).toBe(true);
    expect(computeModifiers(s, at(2026, 12, 1)).shelfMult).toBeGreaterThan(before + 0.12);
    // seasonal items never count toward store pages or family sets
    for (const x of setProgress(s)) if (x.variant !== 'season') expect(x.have).toBe(0);
    expect(seasonSets(s)[0].done).toBe(true);
  });
  it('season missions track the shared counters and pay tokens', () => {
    const s = initialState(at(2026, 12, 1));
    tickSeason(s, at(2026, 12, 1), makeRng(2));
    const ms = s.season.missions[0];
    const def = SEASON_MISSION_BY_ID[ms.id];
    bumpMission(s, def.counter, def.target);
    expect(ms.progress).toBe(def.target);
    expect(claimSeasonMission(s, ms.id)).toBe(true);
    expect(s.season.tokens).toBe(def.rewardTokens);
    expect(claimSeasonMission(s, ms.id)).toBe(false);
  });
  it('restock units pay tokens in season, the crying kid waits until the cart has three', () => {
    const s = initialState(at(2026, 12, 1));
    tickSeason(s, at(2026, 12, 1), makeRng(3));
    s.stores.bullseye.units = 5;
    const run = startRun(s, 'bullseye', computeModifiers(s, at(2026, 12, 1)), at(2026, 12, 1), makeRng(4))!;
    chooseSkip(run);
    run.grabbed = 4;
    run.phase = 'done';
    const r = finishRun(s, run, at(2026, 12, 1), makeRng(5));
    expect(r.tokens).toBe(4 * SEASON_TOKENS.restockUnit + 4 * SEASON_TOKENS.pull);
    expect(s.season.tokens).toBe(r.tokens);
    const kidCry = ENCOUNTERS.find((e) => e.id === 'kid_cry')!;
    expect(kidCry.minGrabbed).toBe(3);
    // with an empty cart the doors pool never picks it
    const run2 = startRun(s, 'bullseye', computeModifiers(s, at(2026, 12, 1)), at(2026, 12, 2) + 10 * 60_000, makeRng(6))!;
    s.restockReadyAt.bullseye = 0;
    chooseSkip(run2);
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) { run2.encounter = null; run2.nextEncounterIn = 0; run2.timeLeft = 99; tickRun(run2, 0.1, makeRng(i)); if (run2.encounter) seen.add(run2.encounter); }
    expect(seen.has('kid_cry')).toBe(false);
  });
  it('old saves get an empty season block', () => {
    const s = migrate({ cash: 5, stats: { taps: 3 } });
    expect(s.season).toEqual({ id: null, tokens: 0, bought: [], missions: [], missionsDate: '' });
  });
});

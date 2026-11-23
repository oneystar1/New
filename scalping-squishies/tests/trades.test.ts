import { describe, it, expect } from 'vitest';
import { initialState, migrate } from '../src/engine/state';
import { tick } from '../src/engine/sim';
import { rollTrades, acceptTrade, tradeableDupes } from '../src/engine/trades';
import { ITEM_BY_ID, RARITY_ORDER, shelfKey } from '../src/engine/data/items';
import { makeRng } from '../src/engine/math';

const T0 = 1_700_000_000_000;
const DAY = 86_400_000;

describe('trade board', () => {
  it('needs dupes: an empty shelf rolls an empty board, and it rolls once a day', () => {
    const s = initialState(T0);
    expect(rollTrades(s, T0, makeRng(1))).toBe(true);
    expect(s.trades.offers).toEqual([]);
    expect(rollTrades(s, T0 + 3600_000, makeRng(1))).toBe(false);
    s.shelf.doh_kube = 4;
    expect(rollTrades(s, T0 + DAY, makeRng(1))).toBe(true);
    expect(s.trades.offers.length).toBeGreaterThan(0);
  });
  it('offers give a dupe you keep one of, for a slot you lack, at most one tier up', () => {
    const s = initialState(T0);
    s.shelf.doh_kube = 5; // uncommon
    s.shelf.sq_nana = 4; // rare
    s.shelf['doh_glob:glow'] = 3; // rare variant dupe
    rollTrades(s, T0, makeRng(7));
    expect(s.trades.offers.length).toBeGreaterThan(0);
    expect(s.trades.offers.length).toBeLessThanOrEqual(3);
    for (const o of s.trades.offers) {
      const give = ITEM_BY_ID[o.giveKey.split(':')[0]];
      const get = ITEM_BY_ID[o.getItemId];
      expect(s.shelf[shelfKey(o.getItemId, o.getVariant)] ?? 0).toBe(0);
      expect(RARITY_ORDER.indexOf(get.rarity)).toBeLessThanOrEqual(RARITY_ORDER.indexOf(give.rarity) + 1);
      expect(o.giveQty).toBe(RARITY_ORDER.indexOf(get.rarity) > RARITY_ORDER.indexOf(give.rarity) ? 3 : 2);
      expect(s.shelf[o.giveKey]).toBeGreaterThanOrEqual(o.giveQty + 1);
      expect(get.season).toBeUndefined();
    }
  });
  it('accepting swaps the copies, is one-shot, and refuses once the dupes are gone', () => {
    const s = initialState(T0);
    s.shelf.doh_kube = 3;
    rollTrades(s, T0, makeRng(3));
    const o = s.trades.offers[0];
    expect(o).toBeTruthy();
    const got = acceptTrade(s, o.id)!;
    expect(got.item.id).toBe(o.getItemId);
    expect(s.shelf.doh_kube).toBe(3 - o.giveQty);
    expect(s.shelf[shelfKey(o.getItemId, o.getVariant)]).toBe(1);
    expect(s.stats.tradesDone).toBe(1);
    expect(acceptTrade(s, o.id)).toBeNull();
    const s2 = initialState(T0);
    s2.shelf.doh_kube = 3;
    rollTrades(s2, T0, makeRng(3));
    s2.shelf.doh_kube = 2; // sold a dupe in the meantime
    expect(acceptTrade(s2, s2.trades.offers[0].id)).toBeNull();
  });
  it('the tick rolls the board daily and old saves get an empty one', () => {
    const s = initialState(T0);
    s.shelf.sq_mochi = 6;
    tick(s, 1, T0, makeRng(1));
    expect(s.trades.date).toBeTruthy();
    const first = s.trades.offers.map((o) => o.id + o.getItemId).join();
    tick(s, 1, T0 + DAY, makeRng(2));
    expect(s.trades.done).toEqual([]);
    expect(typeof first).toBe('string');
    expect(migrate({ cash: 1 }).trades).toEqual({ date: '', offers: [], done: [], wanted: null });
    expect(tradeableDupes(s).length).toBe(1);
  });
});

describe('wanted post', () => {
  it('only for core items you lack; a collector comes for it at one copy more, certain by day three', async () => {
    const { postWanted } = await import('../src/engine/trades');
    const s = initialState(T0);
    s.shelf.doh_kube = 6; // uncommon dupes
    expect(postWanted(s, 'doh_kube', T0)).toBe(false); // owned
    expect(postWanted(s, 'xm_candycane', T0)).toBe(false); // seasonal
    expect(postWanted(s, 'doh_cloud', T0)).toBe(true); // uncommon, same tier
    expect(s.trades.wanted).toEqual({ itemId: 'doh_cloud', postedOn: '2023-11-14' });
    // by the third day the offer is guaranteed
    rollTrades(s, T0 + 3 * DAY, () => 0.99);
    const w = s.trades.offers.find((o) => o.wanted)!;
    expect(w).toBeTruthy();
    expect(w.getItemId).toBe('doh_cloud');
    expect(w.giveQty).toBe(3); // 2 + 1 for the post
    expect(acceptTrade(s, w.id)!.item.id).toBe('doh_cloud');
    expect(s.trades.wanted).toBeNull();
    // taking it down, and clearing when you get it elsewhere
    expect(postWanted(s, 'doh_gumdrop', T0)).toBe(true);
    s.shelf.doh_gumdrop = 1;
    rollTrades(s, T0 + 4 * DAY, makeRng(1));
    expect(s.trades.wanted).toBeNull();
    expect(postWanted(s, null, T0)).toBe(true);
  });
});

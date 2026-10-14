import { describe, it, expect } from 'vitest';
import { initialState } from '../src/engine/state';
import { computeModifiers, pullItem, rollVariant, rollRarity, setProgress, completedSets, dupeSaleValue, unpull } from '../src/engine/sim';
import { ITEMS, VARIANTS, shelfKey, parseShelfKey, SET_BONUS, FAMILY_SET_BONUS, itemsForStore } from '../src/engine/data/items';
import { STORES } from '../src/engine/data/stores';
import { makeRng } from '../src/engine/math';

const T0 = 1_700_000_000_000;

describe('collection depth', () => {
  it('has 87 items, 348 slots, a chase tier, and no store page under 6 items', () => {
    expect(ITEMS.length).toBe(87);
    expect(ITEMS.length * VARIANTS.length).toBe(348);
    expect(ITEMS.filter((i) => i.rarity === 'chase').length).toBe(5);
    expect(ITEMS.filter((i) => i.rarity === 'grail').length).toBe(8);
    for (const st of STORES) expect(itemsForStore(st.id).length).toBeGreaterThanOrEqual(6);
  });
  it('variants roll at roughly 70/15/10/5 and luck shifts upward', () => {
    const count = (luck: number) => {
      const rng = makeRng(3);
      const c: Record<string, number> = {};
      for (let i = 0; i < 10000; i++) { const v = rollVariant(luck, rng); c[v] = (c[v] ?? 0) + 1; }
      return c;
    };
    const base = count(0);
    expect(base.standard / 10000).toBeGreaterThan(0.66);
    expect(base.standard / 10000).toBeLessThan(0.74);
    expect(base.mini / 10000).toBeGreaterThan(0.03);
    const lucky = count(1);
    expect(lucky.standard).toBeLessThan(base.standard);
  });
  it('chase is rare but reachable from the factory', () => {
    const rng = makeRng(8);
    let chase = 0;
    for (let i = 0; i < 100000; i++) if (rollRarity('factory', 0, rng) === 'chase') chase++;
    expect(chase).toBeGreaterThan(100);
    expect(chase).toBeLessThan(800);
  });
  it('pulls land in variant slots, unpull reverses, shelf keys parse', () => {
    const s = initialState(T0);
    const p = pullItem(s, 'fiveunder', 0, () => 0.99); // last variant bucket = mini
    expect(p.variant).toBe('mini');
    const key = shelfKey(p.item.id, 'mini');
    expect(s.shelf[key]).toBe(1);
    expect(parseShelfKey(key)).toEqual({ itemId: p.item.id, variant: 'mini' });
    expect(parseShelfKey(p.item.id)).toEqual({ itemId: p.item.id, variant: 'standard' });
    unpull(s, p);
    expect(s.shelf[key]).toBe(0);
    expect(s.stats.pulls).toBe(0);
  });
  it('set bonuses apply when a store page or family is complete', () => {
    const s = initialState(T0);
    const before = computeModifiers(s, T0).shelfMult;
    for (const it of itemsForStore('dollar')) s.shelf[shelfKey(it.id, 'glow')] = 1;
    const sets = setProgress(s);
    const glow = sets.find((x) => x.id === 'dollar:glow')!;
    expect(glow.done).toBe(true);
    expect(completedSets(s).length).toBe(1);
    const after = computeModifiers(s, T0).shelfMult;
    expect(after - before).toBeGreaterThan(SET_BONUS.glow); // set bonus plus the slot bonuses
    for (const it of ITEMS.filter((i) => i.family === 'doh')) s.shelf[it.id] = 1;
    expect(completedSets(s).some((x) => x.id === 'family:doh')).toBe(true);
    expect(computeModifiers(s, T0).shelfMult).toBeGreaterThan(after + FAMILY_SET_BONUS);
  });
  it('variant duplicates flip for more than standard ones', () => {
    const s = initialState(T0);
    s.shelf.doh_kube = 2;
    s.shelf['doh_kube:glow'] = 2;
    expect(dupeSaleValue(s, 'doh_kube:glow', T0)).toBeCloseTo(dupeSaleValue(s, 'doh_kube', T0) * 3, 6);
  });
});

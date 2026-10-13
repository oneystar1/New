import type { PassTier } from '../types';

export const PASS_SEASON = 1;
export const PASS_SEASON_NAME = 'Season 1: Kube Fever';
export const PASS_XP_PER_TIER = 100;

// 30 tiers. Free track gives taste; premium track doubles everything and adds
// the exclusive cosmetic-ish grail item at the end.
export const PASS_TIERS: PassTier[] = Array.from({ length: 30 }, (_, i) => {
  const tier = i + 1;
  const xp = tier * PASS_XP_PER_TIER;
  const t: PassTier = { tier, xp };
  if (tier % 5 === 0) {
    t.free = { kind: 'clout', amount: 10 };
    t.premium = { kind: 'clout', amount: 30 };
  } else if (tier % 3 === 0) {
    t.free = { kind: 'pulls', amount: 1 };
    t.premium = { kind: 'pulls', amount: 3 };
  } else if (tier % 2 === 0) {
    t.free = { kind: 'cash', minutesOfIncome: 15 };
    t.premium = { kind: 'cash', minutesOfIncome: 60 };
  } else {
    t.free = { kind: 'boost', mult: 2, minutes: 10 };
    t.premium = { kind: 'boost', mult: 3, minutes: 30 };
  }
  if (tier === 30) {
    t.free = { kind: 'clout', amount: 50 };
    t.premium = { kind: 'item', itemId: 'doh_holo' };
  }
  return t;
});

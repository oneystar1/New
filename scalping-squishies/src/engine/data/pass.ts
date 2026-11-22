import type { PassTier } from '../types';

export const PASS_SEASON = 1;
export const PASS_SEASON_NAME = 'Season 1: Kube Fever';
export const PASS_XP_PER_TIER = 100;

// Pass seasons run two calendar months each from the launch epoch and
// rotate forever: the theme list repeats, the season number keeps counting.
// Season 1 sells as the non-consumable `ss_pass`; later seasons are
// consumables `ss_pass_s<N>` so StoreKit lets a player buy each one.
export const PASS_EPOCH: [number, number] = [2026, 11]; // year, month (1-12)
export const PASS_SEASON_MONTHS = 2;
export const PASS_THEMES: { name: string; blurb: string; finalItem: string }[] = [
  { name: 'Kube Fever', blurb: 'The cube shortage season. Premium ends on the Holo Kube.', finalItem: 'doh_holo' },
  { name: 'Nana Rush', blurb: 'Banana season. Premium ends on the Con Chrome Smusher.', finalItem: 'sq_chrome' },
  { name: 'Glow Up', blurb: 'Everything that glows. Premium ends on the Dough Snow Globe.', finalItem: 'doh_snowglobe' },
  { name: 'Bot Summer', blurb: 'Drops, bots, duffel bags. Premium ends on the Friends & Family Kube.', finalItem: 'doh_ff' },
  { name: 'Factory Season', blurb: 'Back-door season. Premium ends on the Factory Sample Nana.', finalItem: 'sq_sample' },
  { name: 'Smusher Season', blurb: 'Sets and five-packs. Premium ends on the Smusher 5-Pack.', finalItem: 'sq_smusher' },
];

export interface PassSeasonInfo {
  season: number;
  name: string;
  blurb: string;
  finalItem: string;
  productId: string;
  /** Epoch ms of the first day and of the midnight after the last day (UTC). */
  startsAt: number;
  endsAt: number;
}

export function currentPassSeason(now: number): PassSeasonInfo {
  const d = new Date(now);
  const months = (d.getUTCFullYear() - PASS_EPOCH[0]) * 12 + (d.getUTCMonth() + 1 - PASS_EPOCH[1]);
  const idx = Math.max(0, Math.floor(months / PASS_SEASON_MONTHS));
  const season = idx + 1;
  const theme = PASS_THEMES[idx % PASS_THEMES.length];
  const startMonth = PASS_EPOCH[1] - 1 + idx * PASS_SEASON_MONTHS; // 0-based, may exceed 11: Date.UTC normalizes
  return {
    season,
    name: `Season ${season}: ${theme.name}`,
    blurb: theme.blurb,
    finalItem: theme.finalItem,
    productId: season === 1 ? 'ss_pass' : `ss_pass_s${season}`,
    startsAt: Date.UTC(PASS_EPOCH[0], startMonth, 1),
    endsAt: Date.UTC(PASS_EPOCH[0], startMonth + PASS_SEASON_MONTHS, 1),
  };
}

/** The 30-tier track; only the final premium item changes per season. */
export function passTiersFor(finalItem: string): PassTier[] {
  return Array.from({ length: 30 }, (_, i) => buildTier(i + 1, finalItem));
}

// 30 tiers. Free track gives taste; premium track doubles everything and adds
// the exclusive cosmetic-ish grail item at the end.
export const PASS_TIERS: PassTier[] = Array.from({ length: 30 }, (_, i) => buildTier(i + 1, 'doh_holo'));

function buildTier(tier: number, finalItem: string): PassTier {
  return ((i: number) => {
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
    t.premium = { kind: 'item', itemId: finalItem };
  }
  return t;
  })(tier - 1);
}

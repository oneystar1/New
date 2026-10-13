// In-app purchase catalog. Prices are USD tiers that map 1:1 to App Store
// price points. Product ids are what StoreKit / Google Play would use.
export type ProductKind = 'clout' | 'noAds' | 'starter' | 'vip' | 'pass' | 'bundle';

export interface Product {
  id: string;
  kind: ProductKind;
  name: string;
  blurb: string;
  icon: string;
  priceUsd: number;
  /** Clout granted (for clout packs and bundles). */
  clout?: number;
  /** Badge shown on the card. */
  badge?: string;
  /** Hours of current income granted instantly (bundles). */
  incomeHours?: number;
  /** Mystery pulls granted. */
  pulls?: number;
  /** Subscription period for VIP. */
  periodDays?: number;
  /** Show only when the condition holds (set by the shop UI). */
  oneTime?: boolean;
}

export const PRODUCTS: Product[] = [
  { id: 'ss_starter', kind: 'starter', name: 'Starter Hustle Pack', blurb: '300 Clout + 2h income + 5 pulls + No Ads for 7 days. Best value, one time only.', icon: '🎒', priceUsd: 2.99, clout: 300, incomeHours: 2, pulls: 5, badge: '-85%', oneTime: true },
  { id: 'ss_noads', kind: 'noAds', name: 'Remove Ads', blurb: 'No interstitials, ever. Rewarded boosts become free instant claims.', icon: '🚫', priceUsd: 4.99, oneTime: true },
  { id: 'ss_vip', kind: 'vip', name: 'VIP Flipper', blurb: 'Weekly: x2 permanent profit, +4h offline cap, 20 Clout/day, no ads.', icon: '👑', priceUsd: 4.99, periodDays: 7, badge: 'Most popular' },
  { id: 'ss_pass', kind: 'pass', name: 'Hustle Pass Premium', blurb: 'Unlock the premium track: 3x rewards and the Holo Kube at tier 30.', icon: '🎫', priceUsd: 9.99, oneTime: true },
  { id: 'ss_clout_s', kind: 'clout', name: 'Pocket Clout', blurb: '120 Clout', icon: '💠', priceUsd: 1.99, clout: 120 },
  { id: 'ss_clout_m', kind: 'clout', name: 'Bag of Clout', blurb: '700 Clout', icon: '💠', priceUsd: 9.99, clout: 700, badge: '+17%' },
  { id: 'ss_clout_l', kind: 'clout', name: 'Crate of Clout', blurb: '1,600 Clout', icon: '💠', priceUsd: 19.99, clout: 1600, badge: '+33%' },
  { id: 'ss_clout_xl', kind: 'clout', name: 'Pallet of Clout', blurb: '4,500 Clout', icon: '💠', priceUsd: 49.99, clout: 4500, badge: '+50%' },
  { id: 'ss_clout_xxl', kind: 'clout', name: 'Warehouse of Clout', blurb: '10,000 Clout', icon: '💠', priceUsd: 99.99, clout: 10000, badge: '+67%' },
  { id: 'ss_bundle_drop', kind: 'bundle', name: 'Drop Day Bundle', blurb: '8h of income + 10 pulls + 200 Clout.', icon: '🔥', priceUsd: 7.99, clout: 200, incomeHours: 8, pulls: 10 },
];

/** Clout prices for in-game sinks. */
export const CLOUT_COSTS = {
  pull: 25,
  pull10: 220,
  timeSkip1h: 40,
  timeSkip8h: 240,
  boost2x4h: 60,
  instantManager: 100,
  piggyBreak: 80,
  skipAdClaim: 10,
};

export const VIP = {
  profitMult: 2,
  offlineCapHours: 4,
  dailyClout: 20,
};

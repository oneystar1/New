// Monetization abstraction. The game only ever talks to these interfaces, so
// the web build ships with simulated ads/purchases and the iOS build swaps in
// AdMob (rewarded + interstitial) and StoreKit via Capacitor plugins without
// touching game code.

export type AdPlacement =
  | 'offline_double'
  | 'boost_2x'
  | 'free_clout'
  | 'free_pull'
  | 'speed_up'
  | 'piggy_bonus'
  | 'interstitial_prestige';

export interface AdResult {
  /** True when the user watched to completion and should be rewarded. */
  rewarded: boolean;
  /** Reason when not rewarded: closed early, no fill, blocked, etc. */
  reason?: 'skipped' | 'nofill' | 'error' | 'unsupported';
}

export interface PurchaseResult {
  ok: boolean;
  productId: string;
  /** Opaque receipt/transaction id for server validation later. */
  transactionId?: string;
  reason?: 'cancelled' | 'error' | 'unsupported';
}

export interface AdsProvider {
  isReady(placement: AdPlacement): boolean;
  showRewarded(placement: AdPlacement): Promise<AdResult>;
  showInterstitial(placement: AdPlacement): Promise<void>;
}

export interface IapProvider {
  /** Localized price string lookups for the shop UI. */
  getPrice(productId: string): string | null;
  purchase(productId: string): Promise<PurchaseResult>;
  restore(): Promise<string[]>;
}

export interface AnalyticsProvider {
  track(event: string, props?: Record<string, string | number | boolean>): void;
}

export interface MonetizationProvider {
  ads: AdsProvider;
  iap: IapProvider;
  analytics: AnalyticsProvider;
  /** Platform id reported to analytics and used to pick UI copy. */
  platform: 'web' | 'ios' | 'android';
}

/** Ad pacing rules shared by all platforms. */
export const AD_RULES = {
  /** Rewarded ads per day before the game stops offering them. */
  dailyRewardedCap: 20,
  /** Per-placement cooldowns in seconds. */
  cooldownSeconds: {
    offline_double: 0,
    boost_2x: 4 * 3600,
    free_clout: 2 * 3600,
    free_pull: 6 * 3600,
    speed_up: 30 * 60,
    piggy_bonus: 12 * 3600,
    interstitial_prestige: 0,
  } as Record<AdPlacement, number>,
  /** Minimum seconds between interstitials. */
  interstitialMinGap: 20 * 60,
  /** Reward amounts. */
  rewards: {
    boost_2x: { mult: 2, seconds: 4 * 3600 },
    free_clout: 8,
    speed_up: { hours: 1 },
    piggy_bonus: { mult: 1.5 },
  },
};

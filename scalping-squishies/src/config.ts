// Runtime configuration. Values come from Vite env (.env.local for dev,
// CI secrets for release builds). Everything has a safe default so the web
// build runs with no configuration at all.

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env ?? {};

export const CONFIG = {
  /** Backend base URL. Empty disables cloud features (saves stay local). */
  apiUrl: env.VITE_API_URL ?? '',
  /** AdMob ad unit ids. The defaults are Google's public test ids. */
  admob: {
    rewarded: env.VITE_ADMOB_REWARDED ?? 'ca-app-pub-3940256099942544/1712485313',
    interstitial: env.VITE_ADMOB_INTERSTITIAL ?? 'ca-app-pub-3940256099942544/4411468910',
    testing: env.VITE_ADMOB_TESTING !== 'false',
  },
  /** RevenueCat public SDK key for iOS. Empty = purchases unavailable. */
  revenueCatIosKey: env.VITE_RC_IOS_KEY ?? '',
  /** Build label shown in settings. */
  version: env.VITE_APP_VERSION ?? '0.1.0',
};

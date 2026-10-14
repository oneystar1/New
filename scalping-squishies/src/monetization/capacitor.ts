// Native monetization: AdMob for rewarded and interstitial ads, RevenueCat
// for StoreKit purchases, subscriptions, restore and receipt validation.
// Entitlements are read back from RevenueCat so a tampered client cannot
// grant itself Clout; the server (see server/) mirrors them via webhook.
import { AdMob, RewardAdPluginEvents, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Purchases, LOG_LEVEL, type PurchasesStoreProduct } from '@revenuecat/purchases-capacitor';
import type { MonetizationProvider, AdPlacement, AdResult, PurchaseResult, AnalyticsProvider } from './provider';
import { PRODUCTS } from '../engine/data/shop';
import { CONFIG } from '../config';
import { platform } from '../platform/native';

export interface NativeProviderOptions {
  appUserId: string;
  analytics: AnalyticsProvider;
}

export async function createCapacitorProvider(opts: NativeProviderOptions): Promise<MonetizationProvider> {
  // --- Ads ---
  let adsReady = false;
  let rewardedLoaded = false;
  let interstitialLoaded = false;
  try {
    await AdMob.initialize({ initializeForTesting: CONFIG.admob.testing });
    adsReady = true;
    await AdMob.addListener(RewardAdPluginEvents.Loaded, () => { rewardedLoaded = true; });
    await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => { rewardedLoaded = false; });
    await AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => { interstitialLoaded = true; });
    await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => { interstitialLoaded = false; });
  } catch (e) {
    opts.analytics.track('ads_init_failed', { message: String(e) });
  }
  const preloadRewarded = async () => {
    if (!adsReady || rewardedLoaded) return;
    try { await AdMob.prepareRewardVideoAd({ adId: CONFIG.admob.rewarded }); } catch { rewardedLoaded = false; }
  };
  const preloadInterstitial = async () => {
    if (!adsReady || interstitialLoaded) return;
    try { await AdMob.prepareInterstitial({ adId: CONFIG.admob.interstitial }); } catch { interstitialLoaded = false; }
  };
  void preloadRewarded();
  void preloadInterstitial();

  // --- Purchases ---
  let products: Record<string, PurchasesStoreProduct> = {};
  let iapReady = false;
  if (CONFIG.revenueCatIosKey) {
    try {
      await Purchases.setLogLevel({ level: CONFIG.admob.testing ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN });
      await Purchases.configure({ apiKey: CONFIG.revenueCatIosKey, appUserID: opts.appUserId });
      const res = await Purchases.getProducts({ productIdentifiers: PRODUCTS.map((p) => p.id) });
      products = Object.fromEntries(res.products.map((p) => [p.identifier, p]));
      iapReady = true;
    } catch (e) {
      opts.analytics.track('iap_init_failed', { message: String(e) });
    }
  }

  return {
    platform: platform() === 'android' ? 'android' : 'ios',
    ads: {
      isReady: (placement: AdPlacement) => adsReady && (placement === 'interstitial_prestige' ? interstitialLoaded : rewardedLoaded),
      async showRewarded(placement: AdPlacement): Promise<AdResult> {
        if (!adsReady) return { rewarded: false, reason: 'unsupported' };
        try {
          if (!rewardedLoaded) await AdMob.prepareRewardVideoAd({ adId: CONFIG.admob.rewarded });
          let rewarded = false;
          const h = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { rewarded = true; });
          await AdMob.showRewardVideoAd();
          await h.remove();
          rewardedLoaded = false;
          void preloadRewarded();
          opts.analytics.track('ad_shown', { placement, rewarded });
          return rewarded ? { rewarded: true } : { rewarded: false, reason: 'skipped' };
        } catch (e) {
          rewardedLoaded = false;
          void preloadRewarded();
          opts.analytics.track('ad_error', { placement, message: String(e) });
          return { rewarded: false, reason: 'nofill' };
        }
      },
      async showInterstitial(placement: AdPlacement): Promise<void> {
        if (!adsReady) return;
        try {
          if (!interstitialLoaded) await AdMob.prepareInterstitial({ adId: CONFIG.admob.interstitial });
          await AdMob.showInterstitial();
          opts.analytics.track('ad_shown', { placement, rewarded: false });
        } catch { /* no fill: skip silently */ }
        interstitialLoaded = false;
        void preloadInterstitial();
      },
    },
    iap: {
      getPrice(productId: string) {
        const p = products[productId];
        return p ? p.priceString : null;
      },
      async purchase(productId: string): Promise<PurchaseResult> {
        if (!iapReady) return { ok: false, productId, reason: 'unsupported' };
        const product = products[productId];
        if (!product) return { ok: false, productId, reason: 'error' };
        try {
          const r = await Purchases.purchaseStoreProduct({ product });
          return { ok: true, productId, transactionId: r.transaction?.transactionIdentifier ?? undefined };
        } catch (e) {
          const msg = String((e as { message?: string })?.message ?? e);
          const cancelled = /cancel/i.test(msg) || (e as { userCancelled?: boolean })?.userCancelled === true;
          if (!cancelled) opts.analytics.track('iap_error', { productId, message: msg });
          return { ok: false, productId, reason: cancelled ? 'cancelled' : 'error' };
        }
      },
      async restore(): Promise<string[]> {
        if (!iapReady) return [];
        try {
          const r = await Purchases.restorePurchases();
          return activeEntitlementProducts(r.customerInfo);
        } catch {
          return [];
        }
      },
    },
    analytics: opts.analytics,
  };
}

/** Product ids with an active entitlement, read from RevenueCat's customer info. */
export function activeEntitlementProducts(info: { entitlements: { active: Record<string, { productIdentifier: string }> } }): string[] {
  return Object.values(info.entitlements.active).map((e) => e.productIdentifier);
}

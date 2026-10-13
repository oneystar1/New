import type { MonetizationProvider, AdPlacement, AdResult, PurchaseResult } from './provider';
import { PRODUCTS } from '../engine/data/shop';

// Browser implementation used for the web build and for dev. Ads are a
// simulated 5-second countdown overlay; purchases are a confirm dialog. The
// UI layer renders the overlay via the `onSimulatedAd` hook so the provider
// stays free of React.

export interface MockHooks {
  onSimulatedAd: (placement: AdPlacement, kind: 'rewarded' | 'interstitial') => Promise<boolean>;
  onSimulatedPurchase: (productId: string, priceLabel: string) => Promise<boolean>;
}

export function createMockProvider(hooks: MockHooks): MonetizationProvider {
  const events: { event: string; props?: Record<string, unknown>; at: number }[] = [];
  return {
    platform: 'web',
    ads: {
      isReady: () => true,
      async showRewarded(placement: AdPlacement): Promise<AdResult> {
        const done = await hooks.onSimulatedAd(placement, 'rewarded');
        return done ? { rewarded: true } : { rewarded: false, reason: 'skipped' };
      },
      async showInterstitial(placement: AdPlacement): Promise<void> {
        await hooks.onSimulatedAd(placement, 'interstitial');
      },
    },
    iap: {
      getPrice(productId: string) {
        const p = PRODUCTS.find((x) => x.id === productId);
        return p ? `$${p.priceUsd.toFixed(2)}` : null;
      },
      async purchase(productId: string): Promise<PurchaseResult> {
        const p = PRODUCTS.find((x) => x.id === productId);
        if (!p) return { ok: false, productId, reason: 'error' };
        const ok = await hooks.onSimulatedPurchase(productId, `$${p.priceUsd.toFixed(2)}`);
        return ok
          ? { ok: true, productId, transactionId: `mock_${Date.now()}` }
          : { ok: false, productId, reason: 'cancelled' };
      },
      async restore() {
        return [];
      },
    },
    analytics: {
      track(event, props) {
        events.push({ event, props, at: Date.now() });
        if (import.meta.env?.DEV) console.debug('[analytics]', event, props ?? '');
      },
    },
  };
}

# iOS plan

The web build is the game. The iOS app is a native shell around it. This
keeps one codebase, one save format, and one balance table.

## Architecture

```
src/engine/*           pure TypeScript, no DOM: shared by web, iOS, tests, balance sim
src/monetization/*     provider interface + mock (web) ; AdMob/StoreKit impls (iOS)
src/ui/*               React UI, mobile-first, safe-area aware
public/sw.js           PWA offline cache (web only)
```

## Step 1: Capacitor shell (1 day)

```sh
npm i @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Scalping Squishies" com.yourstudio.scalpstreet --web-dir dist
npm run build && npx cap add ios && npx cap sync
npx cap open ios
```

`vite.config.ts` already uses `base: './'` so the bundle loads from the
Capacitor `file://` origin. Set `ios.contentInset = 'always'` and keep the
status bar translucent; the CSS uses `env(safe-area-inset-*)`.

## Step 2: Native plugins

| Concern | Plugin | Where it plugs in |
| --- | --- | --- |
| Rewarded + interstitial ads | `@capacitor-community/admob` | implement `AdsProvider` |
| IAP + subscriptions | `@capgo/capacitor-purchases` (RevenueCat) or `cordova-plugin-purchase` | implement `IapProvider` |
| Haptics | `@capacitor/haptics` | replace `navigator.vibrate` in `HuntTab` |
| Local notifications | `@capacitor/local-notifications` | "offline cap reached", "event starting", "piggy bank full" |
| Cloud save | `@capacitor/preferences` + iCloud KVS plugin | replace `localStorage` in `store.ts` load/save |
| App Tracking Transparency | `capacitor-plugin-app-tracking-transparency` | before first ad request |
| Analytics | Firebase Analytics via `@capacitor-firebase/analytics` | implement `AnalyticsProvider` |

Create `src/monetization/capacitor.ts` exporting `createCapacitorProvider()`
and pick it in `App.tsx` when `Capacitor.isNativePlatform()`.

## Step 3: Store readiness

- Product ids in `src/engine/data/shop.ts` are the App Store Connect ids.
- VIP is an auto-renewable weekly subscription with a 3-day free trial;
  the game already treats `vipUntil` as an expiry timestamp so receipt
  renewals just extend it.
- Starter pack and Remove Ads are non-consumables; Clout packs and the
  bundle are consumables; the pass is a non-consumable per season.
- Server-side receipt validation (RevenueCat handles it) before granting
  Clout, to stop jailbreak purchase spoofing.
- Save migration: `SAVE_VERSION` + `migrate()` means an iOS user and a web
  user can exchange the base64 save code in Settings.

## Step 4: Polish for mobile

- Replace emoji sprites with an original sprite sheet (same ids).
- Add sound (tap, cycle complete, rare pull jingle) through the `sfx`
  setting that already exists.
- Background audio off; `visibilitychange` already saves and resumes.
- Offline notifications scheduled when the app backgrounds: "Your managers
  stop at {cap}; come collect."

## Step 5: Android

Same shell: `npx cap add android`. Swap AdMob ids and use Google Play
Billing through the same IAP plugin.

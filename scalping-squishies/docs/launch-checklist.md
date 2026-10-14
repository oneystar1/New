# Launch checklist

What is done, what you do, and what still needs code.

## Done in this repo

- [x] Game, art, sound, balance, tutorial, live-ops hooks (pass, Con Weekend)
- [x] Capacitor shell config, native provider (AdMob rewarded + interstitial,
      RevenueCat purchases, restore), haptics, Preferences storage, local
      notifications for offline cap and next restock
- [x] Backend: accounts, cloud save, analytics, leaderboard, RevenueCat
      webhook, grant claiming (`server/`)
- [x] Real brand names removed from player-facing text
- [x] Pull odds shown in-game, Restore Purchases button, subscription terms
      on the VIP card

## You do (accounts and paperwork)

- [ ] Apple Developer Program ($99/yr) under an LLC or your name
- [ ] App Store Connect: app record, bundle id `com.oneycollectibles.scalpingsquishies`
      (change in `capacitor.config.ts` if you want another)
- [ ] In-app purchases in App Store Connect with the exact ids in
      `src/engine/data/shop.ts`: `ss_starter`, `ss_noads`, `ss_pass`
      (non-consumable), `ss_vip` (auto-renewable weekly, 3-day trial),
      `ss_clout_s/m/l/xl/xxl`, `ss_bundle_drop` (consumable)
- [ ] RevenueCat project: iOS app, public SDK key into `VITE_RC_IOS_KEY`,
      entitlements `noads`, `vip`, `pass`, webhook to the backend
- [ ] AdMob account: app id into `ios/App/App/Info.plist` (`GADApplicationIdentifier`),
      rewarded and interstitial unit ids into env, `VITE_ADMOB_TESTING=false`
- [ ] Privacy policy URL and support URL (both required by App Review)
- [ ] Age rating questionnaire: 12+, "Simulated Gambling: Infrequent/Mild"
      (the mystery pulls), no real gambling
- [ ] App Tracking Transparency: the AdMob plugin prompts on first ad request;
      add `NSUserTrackingUsageDescription` to Info.plist
- [ ] Deploy the backend (see `server/README.md`) and set `VITE_API_URL`

## On a Mac with Xcode

```sh
npm install
npm run build
npx cap add ios          # once
npx cap sync
npx cap open ios         # set signing team, icons, launch screen, Info.plist keys
```

Add to `ios/App/App/Info.plist`: `GADApplicationIdentifier`,
`NSUserTrackingUsageDescription`, `SKAdNetworkItems` (AdMob's list).
Icons: export `public/icon.svg` at 1024px into the asset catalog.

## Still needs code (after the first TestFlight)

- [ ] Hand-tuned hero sprites and an animated app icon/launch screen
- [ ] Season 2 pass content and the Dohlloween / Dohlidays timed events
- [ ] Push notifications (APNs) if the local ones prove useful
- [ ] A dashboard over the `events` table (D1/D7 retention, ARPDAU,
      ad views per DAU, starter pack conversion)

## Soft launch plan

1. TestFlight to 10 to 20 collectors for a week. Watch where they stall.
2. Release in one small market (New Zealand or Canada) for 2 to 4 weeks.
3. Targets before spending on ads: day-1 retention above 35%, day-7 above
   12%, at least 1.5 rewarded views per daily user, starter pack
   conversion above 2% of day-3 players.
4. Then spend a few hundred dollars on TikTok/Reels creatives built from
   the restock run and the Karen messages, and measure cost per install
   against 90-day revenue per player.

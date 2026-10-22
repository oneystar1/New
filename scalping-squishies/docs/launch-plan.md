# Launch plan

Where the game stands on 2026-10-22 and the shortest path to a soft launch.
Owner column: **me** = Claude can do it in this repo; **you** = needs your
accounts, money, or a Mac.

## Where we are

Built and verified: the whole game loop, 87 items x 4 variants, camp and
doors restock runs, deals feed, prestige, cities, live-ops hooks,
tutorial, splash, original art, sound, mock monetization on web, real
AdMob + RevenueCat provider for native, Capacitor shell config, a Node
backend (auth, cloud save, events, leaderboard, purchase webhook), 67
engine tests, 4 server tests, a browser smoke test, and a soak bot.

Not done: no public URL (the artifact link is private), no CI, no privacy
policy or support page, backend not deployed, iOS project not generated
(needs a Mac), no store assets or listing copy, and no human has
play-tested beyond you.

## Phase 0: make it public and repeatable (this week, mostly me)

The next step. Everything after this needs a public link.

- [ ] **me** GitHub Actions: typecheck, vitest, server tests, build, smoke
      on every push.
- [ ] **me** Deploy the web build to GitHub Pages from the same workflow.
      Public URL on day one, free, and it is the link for playtests,
      the App Store "marketing URL", and TikTok bios.
- [ ] **me** Privacy policy and support pages (static, in `public/`),
      covering local save, optional cloud save, AdMob, RevenueCat, and
      the contact address. App Review requires both URLs.
- [ ] **me** Dockerfile + one-command deploy notes for `server/` (Fly.io
      or Railway), health check, backup of the SQLite file.
- [ ] **me** Export `icon.svg` to 1024 px PNG, an App Store icon set, and
      a launch screen that matches the splash.
- [ ] **me** In-game "Send feedback" link (mailto or a form) in Settings
      so testers can report without leaving the game.
- [ ] **me** `tools/dashboard.mjs`: read the `events` table and print D1 /
      D7 retention, ad views per DAU, starter pack conversion. The
      soft-launch gates below need these numbers.
- [ ] **you** Buy a domain (or use a subdomain you own) for the backend
      and the privacy page. Not required for Pages, required for App
      Store trust.

## Phase 1: accounts (you, 1 week, runs in parallel with phase 0)

Start the Apple one today; approval can take several days.

- [ ] Apple Developer Program under your LLC or name.
- [ ] App Store Connect record, bundle id
      `com.oneycollectibles.scalpingsquishies`.
- [ ] Create the IAPs with the exact ids from `src/engine/data/shop.ts`
      (list in `docs/launch-checklist.md`).
- [ ] RevenueCat project, iOS app, entitlements `noads`, `vip`, `pass`,
      webhook pointed at the deployed backend.
- [ ] AdMob account, app id, one rewarded and one interstitial unit.
- [ ] Name check: search the App Store, USPTO TESS, and Google for
      "Scalping Squishies" before paying for anything with the name on it.

## Phase 2: first device build (one day on a Mac, you + me)

- [ ] `npm run cap:add:ios`, `npm run cap:sync`, open in Xcode.
- [ ] Info.plist: `GADApplicationIdentifier`,
      `NSUserTrackingUsageDescription`, `SKAdNetworkItems`.
- [ ] Signing team, icons from phase 0, launch screen.
- [ ] `.env.local` with real keys, `VITE_ADMOB_TESTING=true` still.
- [ ] Run on a real phone: verify a rewarded ad, a sandbox purchase,
      restore purchases, offline earnings after backgrounding, a local
      notification, and the save surviving a force-quit.
- [ ] Upload build 1 to TestFlight.

## Phase 3: closed test (2 weeks)

- [ ] 10 to 20 testers: collectors from your store's customers plus a few
      people who have never played an idle game. Web link for Android
      and desktop, TestFlight for iPhone.
- [ ] Ask three questions at day 3: where did you stop, what confused
      you, what did you want to buy. Read the feedback link inbox daily.
- [ ] I fix in priority order: anything that blocks progress, anything
      confusing in the first 10 minutes, then balance (the bot's 51/29/16
      income split is a guess until humans play).
- [ ] Decide the first-week content: Season 1 pass is in; confirm the
      first timed event (Dohlloween or Dohlidays) is ready before launch.

## Phase 4: soft launch (2 to 4 weeks)

- [ ] Release in New Zealand or Canada only, `VITE_ADMOB_TESTING=false`.
- [ ] Gates before spending on ads: D1 retention above 35%, D7 above 12%,
      1.5+ rewarded views per daily user, starter pack conversion above
      2% of day-3 players.
- [ ] If a gate fails, fix that funnel step and re-measure; do not widen.

## Phase 5: launch

- [ ] Worldwide release on iOS and the web.
- [ ] Three TikTok/Reels creatives from the restock run and the Karen
      messages; a few hundred dollars; measure cost per install against
      90-day revenue per player.
- [ ] Android via `npx cap add android` once iOS numbers hold.

## Order of the next five actions

1. me: CI + GitHub Pages deploy (public link).
2. you: start the Apple Developer enrollment.
3. me: privacy, support, feedback link, icon set, backend Dockerfile.
4. you: RevenueCat, AdMob, IAP records, domain.
5. both: Mac day, TestFlight build 1.

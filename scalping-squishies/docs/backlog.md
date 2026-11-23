# Improvement backlog

The daily improvement cycle takes items from here first, oldest open
first, one per column: retention/content, polish/bug, launch readiness.
Mark done with the date. Add anything noticed during a cycle.

## Open

| # | Area | Item | Size | Added |
| --- | --- | --- | --- | --- |
| 22 | polish | Comeback crate: tap-through "what changed" lines into the relevant tab (season → Hunt, trades → Shelf) | small | 2026-11-23 |
| 23 | retention | Weekly "collector digest" notification on iOS: trades waiting, season days left, streak shield state | small | 2026-11-23 |
| 20 | launch | Preflight: verify the App Store Connect product list against shop.ts through the ASC API once the key exists | half day | 2026-11-22 |

## Done

| # | Area | Item | Done |
| --- | --- | --- | --- |
| 21 | launch | iOS privacy manifest (PrivacyInfo.xcprivacy) added by the fastlane lane; declares AdMob tracking, collected data types, required-reason APIs | 2026-11-23 |
| 19 | content | Pass season "recap" card when a season rotates: tiers reached, what was claimed, what the new season's final item is | 2026-11-23 |
| 16 | retention | Trade board: a "wanted" post from the player (pick a missing piece; a collector shows up for it within a few days at a steeper price) | 2026-11-23 |
| 15 | retention | Comeback crate: scale the crate with lifetime progress (a relocated player should get more than 60 minutes) and mention what changed while away (season started, restocks ready) | 2026-11-23 |
| 18 | launch | Release preflight (`npm run preflight`): icons, legal pages, product ids documented, bundle id consistency, season windows, pass themes; CI reports it, `--strict` gates store builds | 2026-11-22 |
| 17 | polish | Store shot 02 ("Flip the dohs") captures the pull-result modal; have the smoke test take the hunt capture before the first pull, or add a dedicated listing capture pass | 2026-11-22 |
| 8 | content | Season 2 of the Hustle Pass rotating on the season calendar | 2026-11-22 |
| 12 | polish | Season splash: show the real end date in the player's locale and a "remind me" that schedules the 48h notification on web too (web has no notifications; consider a header reminder instead) (end date is localized and the header countdown is the reminder; nothing further) | 2026-11-21 |
| 13 | launch | Enable the `shots:store` step in CI as an uploaded artifact so listing images refresh on every push | 2026-11-21 |
| 14 | polish | Store screenshots: capture with tutorial toasts suppressed (a `?quiet=1` flag that hides toasts and the coach) | 2026-11-21 |
| 7 | retention | Trade board: NPC collectors who swap your dupes for pieces you are missing | 2026-11-21 |
| 6 | launch | Balance bot in CI: run the simulation on every push, fail on drift, table in the job summary | 2026-11-20 |
| 5 | polish | Carry the dawn scene into the doors phase: OPEN sign, line surging in, shelf emptying | 2026-11-20 |
| 4 | retention | Comeback gift and streak shield: one free missed day, a welcome-back crate after 2+ days away | 2026-11-20 |
| 3 | launch | Store listing pack: title, subtitle, keywords, description, privacy label answers, six framed screenshots by script | 2026-11-19 |
| 2 | polish | Camp ambient sound: wind loop, car doors, a sparrow at sunrise, door chime at 7:00, from the Web Audio system | 2026-11-19 |
| 1 | retention | Dohlidays "what's new" splash: one-time full-screen card with the six items, how to earn Candy Canes, end date | 2026-11-19 |
| 9 | retention | Season notifications: next season start, 48-hour warning when the set is unfinished | 2026-11-19 |
| 10 | bug | Privacy policy promised interstitials between restocks that the game never showed; post-haul interstitial added (gated: 3+ restocks, 20-minute gap, ad-free honored) and the policy text corrected | 2026-11-19 |
| 11 | launch | TestFlight tester notes and day-3 questions (`docs/testflight.md`); feedback inbox check folded into the daily cycle | 2026-11-19 |

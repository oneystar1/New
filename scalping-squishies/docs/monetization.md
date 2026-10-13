# Monetization plan

Scalping Squishies ships with the full hybrid stack used by top-grossing idle
tycoons. Everything below is implemented in the web build behind the
`MonetizationProvider` interface (`src/monetization/provider.ts`) with a
simulated provider; the iOS build swaps in real SDKs (see `ios-plan.md`).

## 1. Rewarded video (opt-in, the primary ad surface)

| Placement | Reward | Cooldown | Where |
| --- | --- | --- | --- |
| `offline_double` | x2 offline earnings | none | welcome-back modal |
| `boost_2x` | x2 profit for 4h | 4h | Shop |
| `speed_up` | 1h of managed income instantly | 30m | Shop |
| `free_clout` | +8 Clout | 2h | Shop |
| `free_pull` | one mystery pull | 6h | Shelf |
| `piggy_bonus` | piggy bank +50% | 12h | Shop |

Rules: 20 rewarded views per day, per-placement cooldowns, rewards scale
with current income (never fixed cash). Remove Ads / VIP turn every
rewarded placement into an instant claim, which is the main thing those
products sell.

## 2. Interstitial (forced, minimal)

One placement: after Relocate (prestige), at most once per 20 minutes.
Suppressed by Remove Ads and VIP. No interstitials anywhere else: idle
players churn on interruptions.

## 3. In-app purchases

| Product id | Price | Contents | Notes |
| --- | --- | --- | --- |
| `ss_starter` | $2.99 | 300 Clout, 2h income, 5 pulls, 7 days ad-free | One time, badge "-85%", shown with a red dot until bought |
| `ss_noads` | $4.99 | Remove interstitials, instant rewarded claims | One time |
| `ss_vip` | $4.99 / week | x2 profit, +4h offline cap, 20 Clout/day, no ads | Auto-renewing subscription on iOS |
| `ss_pass` | $9.99 | Hustle Pass premium track for the season | Per season |
| `ss_clout_s` .. `ss_clout_xxl` | $1.99 to $99.99 | 120 to 10,000 Clout | Escalating value badges |
| `ss_bundle_drop` | $7.99 | 8h income, 10 pulls, 200 Clout | Rotating bundle slot |

Clout sinks: pulls (25 / 220 for ten), time skips (40 / 240), x2 boost 4h
(60), piggy break (80), permanent perks (60 to 450).

## 4. Season pass

30 tiers, 100 XP each, XP from daily missions only (so missions get done).
Free track: small Clout, pulls, boosts, income. Premium track: 3x the
amounts and the exclusive Holo Kube at tier 30. Seasons rotate the
exclusive item and theme.

## 5. Retention mechanics that drive the above

Daily login streak, daily missions, piggy bank (visible balance creates
the urge to break it), market events, achievements paying Clout so free
players still touch the gacha, red-dot badges.

## 6. Analytics events (already emitted)

`session_start`, `buy_units`, `hire_manager`, `buy_upgrade`, `pull`,
`prestige`, `ad_rewarded`, `iap_purchase`, `iap_cancel`, `clout_spend`.
Route these to Firebase/Amplitude on iOS. The KPIs to watch: D1/D7/D30
retention, ARPDAU, rewarded-ad views per DAU, starter-pack conversion,
VIP trial-to-paid.

## 7. Compliance checklist for launch

- Age rating: simulated gambling is absent (pulls cost premium currency
  but App Store treats loot boxes as needing published odds; the Shelf tab
  shows live odds).
- Odds disclosure on the pull screen (done).
- Restore Purchases button (done).
- Subscription terms and price shown before purchase (VIP card).
- Privacy manifest and ATT prompt before ad personalisation on iOS.
- COPPA: do not target under-13; no personal data collected by the game.

# Market research: scalping-themed idle games (October 2026)

This document summarizes the research that shaped Scalp Street. Sources are
listed at the end. Where sources disagreed, the more conservative figure is
used in the game's flavour text.

## 1. The theme: the 2026 squish and doh resale boom

**Dohs (fidget squeezies).** The 2026 NeeDoh shortage is the defining toy
story of the year. Retailers report lines forming two hours before opening
on restock days and have posted "2 per family" limits to curb bulk buying
for resale. Resale premiums on StockX averaged 413% in March and 449% in
April 2026 over a $4-$8 retail price. Schylling paused direct orders with no
resume date and issued counterfeit warnings. Over 50 styles exist; the ones
collectors chase are the Nice Cube (plus Swirl and Candy Swirl variants
found at card shops), Dream Drop, Groovy Glob, Gumdrop, Nice Berg, Groovy
Shroom, Gummy Bear, Cloud Pleaser and the Teenie line. Local Facebook
Marketplace flips at $20-$25 drew public warnings from independent toy
stores. Third-party trackers (Needoh Tracker, TrackaLacker) exist purely to
alert buyers to restocks. By autumn, prices had started drifting down as
restocks landed, which is the "Restock Flood" event in the game.

**Squishes (plush).** The squish plush market is older and tiered. Rough
secondary bands reported in 2026: Select Series and Founders Edition at
$1,000 to $6,700+, Ultra Rare characters at $500 to $1,500, retired standard
characters with tags at $100 to $500. The highest confirmed sale is $6,700
(JSK the Cat). Jack the Black Cat (500 made) is the community "grail" at
$1,800 to $2,500. Fania the Purple Owl hit a $2,999 auction record and then
fell to about $45 after a re-release, the clearest example that only retired
designs hold value. Tags matter: an intact tag adds 50% to 100%. Spring
2026 exclusives (Wisteria the periwinkle cow at Walgreens, the Target
12-inch Easter line, the Amazon-only hummingbird) sold out within hours and
drove freight-forwarder blogs for overseas collectors. Counterfeits are a
growing problem at the high end.

**Scalper culture.** Bots watch retail sites and clear online drops in
seconds; one Pokémon pre-order rush saw scalping groups claim 42,000+
checkouts. Line-camping outside Target at 5am, Discord "cook groups",
burner accounts to beat per-customer limits, ISO ("in search of") posts,
and community backlash against influencers who flip are all recurring
beats. Retailers respond with purchase limits, virtual queues, identity
checks (Pop Mart's four-per-person Labubu rule) and de-shrinking product at
checkout. Every one of these became a store, manager, upgrade or event in
the game.

## 2. The reference game and competitors

`scalpcity.app` could not be reached from the build environment, so its
design was reconstructed from the broader category. The closest commercial
comparable is **Scalpers' Spoils** (Parodie Games, Steam, unreleased): a
first-person management sim where you sprint through restocks, beat online
drops, haggle in your own storefront, manage storage and shelving, and
gamble on blind-box pulls, solo or with up to four players. It is not idle,
but its feature list (drops, storefront, storage, price tracking, delivery
workers, pack-opening) maps cleanly onto idle-tycoon systems.

The idle-tycoon template the category follows:

| Game | Borrowed beat |
| --- | --- |
| AdVenture Capitalist | Ten generators, x12 cost steps, unit milestones that double profit, managers that automate, angel (prestige) multiplier |
| Egg, Inc. | Full offline earnings with an optional ad to double, Soul Egg prestige, "reset as soon as suggested" pacing |
| Idle Miner Tycoon | Manager-driven automation, generous offline, event cadence |
| Cookie Clicker | Active tap loop that automates, achievements with permanent bonuses |
| Clicker Heroes | Prestige as the long-term engine, frequent resets |
| Scalpers' Spoils | Drops, storefront haggling, blind-box pulls, storage |

## 3. Monetization benchmarks

Hybrid monetization (rewarded ads + IAP + subscription + pass) is the 2026
default for idle games, and idle games suit rewarded video better than most
genres because the core loop already implies waiting.

- **Strongest rewarded placements:** offline-earnings doubler on return,
  timed profit boosts, time skips. Size rewards to current income rather
  than fixed amounts. Cap offers per day and per placement because idle
  players return often.
- **Interstitials:** players object to interruptions, not ads. Keep
  forced ads to one natural break (prestige) with a minimum gap.
- **IAP price points seen in shipping idle tycoons:** starter packs at
  $1.99-$4.99, remove-ads at $0.99-$9.99, weekly subscriptions at $1.99-$4.99
  bundling ad removal, a permanent multiplier and a daily premium stipend,
  gem packs from $1.99 to $99.99.
- **Battle pass:** owners are reported to be about 3x more likely to be
  active at six months (vendor claim). Requires a steady content cadence.
- **Judge changes on Day-7 retention and ARPDAU together,** not revenue
  alone.

## 4. Design decisions taken from the research

1. Two product families (squishes, dohs) with separate hype meters so events
   can hit one market without the other, mirroring 2026 where dohs spiked
   while squishes were a mature market.
2. Store list follows the real retail map: dollar store, Five Below style
   discounter, Target style big box (Tuesday restocks), 24-hour Walmart,
   Hallmark style card shop (secretly first to get the Swirl Cube), Costco
   style wholesale club, claw arcade, bot farm, convention floor, factory
   back door.
3. Events: Drop Day, Viral Video (doh), Holiday Squad (squish), Restock
   Flood (price crash), Limit Crackdown (speed halved).
4. Prestige is "Relocate": the community finds your listings, you move to a
   new city and keep Street Cred.
5. Item rarity and value mirrors the real bands: commons near retail, grails
   at 100x to 335x retail. Fania's re-release story is the Ultra Rare owl's
   flavour text.
6. Full hybrid monetization stack as specified in `docs/monetization.md`.

## Sources

- Scalpers' Spoils, Steam listing and Dexerto coverage (2026)
- Modern Retail, "NeeDohs are fetching a premium on resale sites" (StockX
  premiums 413% March / 449% April 2026)
- WGLT, "Bloomington-Normal retailers feel the need for NeeDoh" (July 2026)
- Salina311, "Familia Toys warns Salina shoppers as local Facebook scalping
  surfaces" (April 2026)
- Good Morning America, "NeeDohs are the new viral toy" (2026)
- StockX News, "The rise of NeeDoh"
- Wikipedia, NeeDoh and Schylling (2026 shortage, counterfeits)
- Schylling.com NeeDoh brand page (order pause, MSRP list)
- Needoh Tracker, TrackaLacker (restock tracking, Target/Hallmark pricing)
- Toynk, "Top 10 rarest Squishmallows (2026)" and "Most expensive
  Squishmallow ever sold"
- SquishyTrade, "Most valuable Squishmallows" and "Most valuable Nee-Doh"
- comGateway blogs on the 2026 Easter squish exclusives
- Card Codex, "Can anything stop the Pokémon scalping machine?" (bots, line
  camping, 42k checkouts)
- The Independent SG on Pop Mart Labubu reseller pricing and limits
- Applixir, "Idle game monetization: rewarded ads, IAP and key metrics"
- Unity, "Game monetization: models, strategies & how to choose"
- AppFollow, "Mobile game monetization 2026: the expert playbook"
- Galaxy4Games, "Mobile game monetization trends 2026"
- StudioKrew, "Mobile game monetization models that still work in 2026"
- Cubix, "Game monetization statistics 2026"
- Mellowtel, "Mobile game monetization: 2026 models & strategy guide"
- App Store listings: Merge Miners, Diamond Miner Tycoon, Idle Industry,
  Death Idle Tycoon (price points for starter packs, remove ads, VIP)

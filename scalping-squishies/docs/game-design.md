# Scalping Squishies: game design document

**Elevator pitch.** You are a fidget-toy scalper. Camp the drops, hoard the
jumbo bananas, flip the dough cubes, get found out, move to a new city, do
it again bigger. An idle tycoon with a collection binder and a dynamic resale market.

**Tone.** Affectionate satire. The game never pretends scalping is noble;
every manager, upgrade and event is a joke at the player's expense ("Banned
From The Parking Lot" is an achievement). All brands and characters are
parodies.

## Core loop

```
tap shelf  ─┐                                     ┌─> collect items (shelf bonus)
            ├─> cash ─> buy store units ─> income ─┤
pulls ──────┘             │                       └─> buy managers / upgrades
                          │
                          └─> $100M earned ─> Relocate (prestige) ─> Street Cred ─> +2%/pt forever
```

1. **Hunt (active).** Tapping the shelf earns `1 + 1% of income/sec`,
   scaled by tap upgrades and Street Cred. Sixty taps fill the Hunt meter
   and grant a free mystery pull from the best unlocked store. This is the
   first-session hook before any store is automated.
2. **Routes (generators).** Ten stores. Each unit adds base profit per
   cycle; cost grows geometrically per unit (1.07 to 1.15). Unit milestones
   (25, 50, 100, 200, 300...) double a store's profit. Without a runner a store needs
   a tap to send each run; recruiting a runner (the idle "manager")
   automates it and makes the store count toward offline income.
3. **Upgrades.** Three per store (x2 profit each, gated on unit counts),
   global cash upgrades (shipping supplies, storage unit, label printer,
   cargo van, LLC, warehouse), tap upgrades, family specialisations.
4. **Shelf (collection).** 87 items in four variants (348 slots) across two families (Dohs: stretchy
   dough cubes and globs, Squishies: slow-rise and jumbo squeezies such as
   the viral bananas, cheese cubes, butter sticks, dumplings, mochi,
   Smushers) and six rarity tiers. Each unique item adds a permanent profit bonus (0.5% common to
   20% grail). Duplicates "flip" for a rarity-scaled number of seconds of
   income, so the gacha always pays even on repeats.
5. **Market.** Two hype meters (squish, doh) multiply profit. Events push
   them: Drop Day x3, Viral Video (doh x2, faster), Squishmas Drop (squishy
   x2, faster), Restock Flood x0.5, Limit Crackdown (half speed). Events
   fire every 6-12 minutes of play, last 90-180 seconds, and leave hype
   above or below 1 afterwards, decaying back over time.
6. **Relocate (prestige).** Available after $100M earned in a run. Cred =
   `(earned / 1e6) ^ 0.45`. Each Cred point = +2% profit forever. Resets
   cash, stores, cash upgrades. Keeps shelf, Clout upgrades, Cred upgrades,
   pass, achievements. The Reputation shop spends Cred on x2/x3/x5 profit,
   +50% speed, grail odds, seed money.

## The sketchy side: Deals, Heat, counterfeits

The research kept surfacing the same resale-culture beats: Facebook
Marketplace lowballs, "Is this available?" and never replying, meetups in
police station lots, Friends & Family scams, "hi dear" cheque overpayment
scams, fake-courier Zelle invoices, community groups policing "retail only",
Karens reporting listings, employees holding stock, empty-box returns,
counterfeit cubes with the wrong font, bot farms with the same shipping
address, live-stream sellers double-selling. All of it is in the game.

**Deals feed.** Buyers only ask about what you are flipping: the common item
of every store you run, plus shelf duplicates. With no runs and no dupes the
inbox stays empty. While the player is active, a buyer message arrives roughly
every 30 seconds (faster with channels), up to three open at once, each
expiring after 3 minutes. A new message raises a tappable toast that jumps
to the Messages tab, and the tab shows an unread count. Offers are sized in seconds of current income so
they matter at every stage:

| Kind | Weight | Worth | Accept | Counter | Decline |
| --- | --- | --- | --- | --- | --- |
| Fair buyer | 28 | 12-24s income | paid | 50% paid x1.35, 50% ghosted | nothing |
| Lowball | 26 | 3-6s | paid (counts toward "Lowballed") | 50% paid x2.2, 50% ghosted | nothing |
| "Is this available?" | 14 | 12-24s | 70% no-show, 30% paid | same as fair | nothing |
| Scam | 11 | 50-100s (too good) | lose that much cash (0 with Goods & Services) | they vanish | blocked, +scams dodged |
| Trade | 6 | an item | random pull with +0.2 luck | same | nothing |
| Karen | 8 | nothing | clap back: +10 pass XP, +6 Heat | same | block |
| Sneaker bro | 8 | 20-40s | 60% paid, 40% "the chart dipped" | 60% paid x1.2 | nothing |

Every offer is phrased as a quantity at a unit price (payout = qty x unit).
Unit prices sit where the fiction says: lowballers 55% to 90% of retail,
fair buyers and ghosts 90% to 115% of your ask, sneaker bros 120% to
170%, scammers 3x to 6x (the tell). The income-sized payout is carried by
the quantity, so late-game you are a volume dealer, not a person selling
one Kube for $12 million.

Channels: FleaBay (+10% value), Mercarry (+15% rate), WhatNow Live (+15%
rate), Hype Mode (+10% value), StockyX (+10% value), Scam Radar (flags scams), Goods &
Services Only (scams cost nothing and stop appearing), UV Tag Light (no
counterfeits), PR Apology Template (Heat cools 2x).

**Heat.** 0 to 100. Sketchy tactics add 15 to 35 each, clapping back +6,
flipping a fake +8, the Drop Bot Farm adds 0.0001 per unit per second. It
cools 0.02 per second. At 100: Called Out, profit x0.4 for three minutes,
Heat resets to 45. An apology video (30 Clout) clears it. Relocate resets it.

**Counterfeits.** Pulls from WallyMart (6%), Claw Arcade (5%), Bot Farm
(12%), Convention (8%) and Factory (5%) can be fakes. Fakes sit in a pile on
the Deals tab: toss for an achievement, or flip for 20 seconds of income and
+8 Heat.

## Restock runs: the line, the moms, the kids

Every store you own a unit of gets a restock every 10 minutes. A run has
three phases:

1. **Camp or skip.** The shelf has 10 to 17 units (plus any group-chat
   intel); 4 to 7 rivals are already in line (minus line gear: Folding
   Chair skips 2, Overnight Tent 3). Rivals: Kube Mom (takes 2 to 4), kid
   (1), other reseller (2 to 3), grandpa (1), employee holding stock (2),
   sneaker bro (3 to 4). Show up at opening and 2 latecomers beat you to
   it; camp and the line phase plays out.
2. **Camp.** 25 seconds. Your spot is a live number and what is left on
   the shelf is recomputed from it. Every 4 to 6 seconds an event pauses
   the clock. One-offs fire at most once per camp: you have to pee (ask
   your named neighbor to hold your spot 70/30, just go -2 spots, hold it
   -3s on the doors clock), a coffee run (buy a round: 30s of income, -5
   heat, moms take one fewer each; solo cup: 3s of income; prices are
   shown on the buttons), an employee hands out numbered tickets (3-second
   timed tap: +3 spots and your place is **locked**, nothing but selling it
   can move you back; miss it and lose one), the guy behind you offers
   cash for your spot (60s of income, +5 spots back, clears the ticket),
   rain (stay: +3 spots; car: -2). Gear-gated one-offs only appear with
   the gear you had when the run started: Grandpa needs your chair (-4
   heat and you nap standing from then on, or +2 heat), mall security
   wants the tents down (lose 1 in the shuffle, or argue +4 heat 50/50).
   Repeatable: the "my kid has to pee" cutter (let her -3 heat, refuse +2
   heat with a 40% she gets in anyway), three sneaker bros arriving (let
   them in -3 spots, send them back +2 heat with a 40% they wedge in), the
   kid asleep ahead of you (let him sleep -3 heat, step around him +1 spot
   +2 heat). With a ticket in hand the buttons say so instead of
   promising a spot loss that will not happen. Between events your phone
   works, each once per camp: answer one Marketplace message inline,
   scroll the group for intel (+4 stock on the next run here), or nap (-6
   heat; 35% to lose 2 spots in a chair, 60% standing, 0% with a ticket).
3. **Doors.** 12 seconds (minus any held-bladder penalty). Three taps of GRAB secure one unit, up to your
   carry (4, +3 minivan, +6 "cousins"). Every ~3 to 5 seconds an encounter
   pauses the clock: kid reaches for the last one (spare: -1 unit, -4 heat;
   snatch: +1 unit, +10 heat), mom blocks the aisle (argue +6 heat 50/50,
   compliment her minivan 70% pass, crawl under +3 heat), admin films you,
   Dalton offers to split the shelf (take half, run ends), manager enforces
   the limit (comply: 2 more max; "buying for my cousins": 60% works, 40%
   banned).
4. **Checkout.** Each unit is a real pull from that store (counterfeit odds
   apply), plus cash worth 30 seconds of that store's income per unit. Heat from the
   run is applied. A ban locks the store for 10 minutes: no cycles, no
   restocks, a BANNED badge on the Routes tab.

## Facebook pricing dial

| Setting | Offer value | Feed |
| --- | --- | --- |
| Retail | 0.6x | 60% fair buyers, no Karens, group-approved |
| Fair | 1x | the default mix |
| Scalper | 1.6x | more lowballs, twice the Karens |
| Insane | 2.8x | mostly ghosts and Karens, +0.03 heat/sec |

## Collection depth: variants, sets, chase

The first bot run filled a 72-item binder in 3.5 hours. The fix is depth,
not raw count:

- **Variants.** Every item exists as Standard (70%), Glitter (15%), Glow
  (10%) and Mini (5%), rolled on every pull; luck shifts odds toward the
  rarer ones. 87 items become 348 binder slots. Variant slots add 40% to
  80% of the item's shelf bonus. Variant duplicates flip for 1.5x to 3x.
- **Sets.** Completing a store page in one variant pays +5% (Standard),
  +8% (Glitter), +10% (Glow) or +6% (Mini) profit forever; completing every
  Standard Squishy or Doh pays +15%. 42 sets in all, listed on the Shelf
  tab's Sets view.
- **Chase.** A seventh tier above Grail: five items at roughly 1 in 3,000
  (Five & Under) to 1 in 250 (Factory). Shelf bonus +50% each, duplicates
  flip for a day of income, and a 100-Clout achievement.
- **Gaps filled.** Bullseye went from 3 items to 10 (the endcap food
  squishies), grails from 4 to 8, every store page has at least 6 items.

## Cities, rankings, tutorial, feel

**Relocate picks a city.** When you prestige you are offered two of eleven
cities (never the one you are in). Each carries a perk for the whole run:
Fresno (stores 15% faster), Tampa (offers +25%), Las Vegas (+0.4 pull luck),
Scranton (heat cools 2x), Austin (profit x1.3), Jersey City (offers 30%
more often), Boise (skip 3 in line), Phoenix (carry +4), Orlando (profit
x1.25), Seattle (bot farm 2x), New Orleans (convention 2x). Dayton is the
starting city with no perk.

**Local rankings.** Eleven rivals with fixed net worths from $500 (Little
Timmy) to $1e18 (The Manufacturer). Passing one on lifetime earnings pays
3 to 150 Clout. The ladder is visible on the Hustle tab.

**Tutorial.** Nine steps (tap, buy a unit, hire a manager, camp a restock,
answer a message, buy an upgrade, open a pull, claim a mission, relocate).
Each completes from state and pays Clout. The card hides after step 8 so
the prestige step does not nag.

**Con Weekend.** Saturday and Sunday local time: restock stock x1.5 and a
banner on the Hunt tab. This is the first real-time live event; a backend
would add leaderboards on top.

**Juice.** `src/ui/sfx.ts` synthesizes every sound with the Web Audio API
(no files, works offline, portable to Capacitor). `src/ui/fxbus.ts` lets
the store fire confetti, screen shake and color flashes without importing
React. Pulls scale their celebration to the best rarity in the batch.

## Play-test log

The economy bot (`npm run balance`) plays stores, deals and restocks
greedily. Before the first rebalance the Deals feed and restock cash were
95% of all income and every store unlocked in 16 minutes. After sizing
offers at 3 to 24 seconds of income, restock cash at 30 seconds of the
store's income per unit, and trimming channel and city multipliers to 10
to 30%, a 6-hour perfect run splits 51% stores, 29% deals, 16% restocks,
3% taps, reaches the Factory at 1h 12m and can first prestige at 17m. A
human plays slower, so real numbers land later. The randomized browser
soak (`npm run soak`) runs 150 seconds of random actions with no errors.

## The fiction of automatic cash

Idle income is an abstraction, so the game names it. A store "unit" is a
**run**: one buy-and-flip loop (camp the store, buy the limit, list it,
sell it). Adding runs flips more per trip; milestones double the quantity
per run; a manager repeats the runs while you are away. Every Routes card
shows the math behind its number ("each run flips 4 × Nice Kube: buy at
$6, sell at $41 each") and its progress bar reads buying → listing →
selling. Hype is labelled market price. Taps are curbside flips. The
engine is unchanged; only the presentation makes the money legible. A
real inventory economy (cash only on sale, stock you can be stuck with)
is parked as a possible mid-life "Warehouse" mode.

## Economy tuning

Store table (cost x16 per store, profit/cost ratio falls 38% per store,
cycle doubles). Verified with `npm run balance` (greedy bot, 8h):

| Store | First unit | Profit/cycle | Cycle | Reached by bot |
| --- | --- | --- | --- | --- |
| Dollar Dohjo | $4 | $1 | 1s | 0s |
| Five & Under | $64 | $10 | 3s | 35s |
| Bullseye | $1.0K | $98 | 6s | 1m 24s |
| WallyMart | $16K | $976 | 12s | 4m |
| Hallmarq Cards | $262K | $9.7K | 24s | 11m |
| Wholesale Club | $4.2M | $96K | 48s | 39m |
| Claw Arcade | $67M | $953K | 96s | 1h 23m |
| Drop Bot Farm | $1.07B | $9.5M | 192s | 2h 50m |
| Convention Floor | $17B | $94M | 384s | 3h 54m |
| Factory Back Door | $275B | $930M | 768s | 4h 58m |

A human plays slower than the bot, so the last store is a day-two or
day-three unlock on the first run and a same-session unlock after a few
prestiges. First prestige opens around 30 to 60 minutes for a human.

Offline: managed income x0.5 (base) for up to 2h (base). Clout upgrades
raise the cap to 26h and the rate to 0.75; VIP adds 4h. Returning shows an
offline modal with a "watch to double" offer.

## Currencies

| Currency | Earned by | Spent on |
| --- | --- | --- |
| Cash ($) | stores, taps, flips, rewards | units, managers, cash upgrades |
| Clout (💠, premium) | achievements, missions, daily login, rewarded ads, IAP | pulls, time skips, boosts, perks, piggy bank |
| Street Cred (⭐) | Relocate | Reputation upgrades (spending does not reduce the passive multiplier) |

## Retention systems

- **Daily login** with a 7-day cycling reward track (income, Clout, pulls,
  boost) and a streak counter.
- **Daily missions** (3 per day from a pool of 9) feeding Clout and pass XP.
- **Hustle Pass** (30 tiers, free and premium tracks, seasonal).
- **Achievements** (35) that pay Clout.
- **Piggy bank** collecting 2% of all earnings.
- **Market events** that reward checking in.
- Red-dot badges on tabs when something is claimable.

## Screens

Bottom tab bar, portrait, 520px max width centred on desktop:

1. **Hunt** - tap shelf, hunt meter, daily login, missions.
2. **Routes** - store list with buy x1/x10/x100/max, progress bars,
   managers.
3. **Deals** - Heat meter and apology button, drama ticker, buyer messages
   with Accept / Counter / Decline, counterfeit pile, selling channels.
4. **Shelf** - mystery pulls (Clout or free video), rarity odds, 4-column
   binder with rarity borders, item detail sheet with duplicate flipping.
5. **Hustle** - Relocate card, cash gear, sketchy tactics, Clout perks, Reputation,
   achievements, settings (save export/import, reset).
6. **Shop** - starter pack, VIP, free rewarded boosts with cooldowns,
   piggy bank, Hustle Pass track, Clout sinks, Clout packs, remove ads.

## Content roadmap

- Season 2 pass with a new exclusive item and three new squishes.
- Weekend "Con Weekend" live event with a leaderboard (needs a backend).
- Trade board: swap duplicates with other players (needs accounts).
- Cosmetics: shelf backgrounds, tap effects (pure monetization, no power).
- Art pass v2: hand-tuned paths for the hero items, idle wobble animations
  on the shelf pile, and themed backgrounds per city. (v1, the procedural
  vector sprite system, shipped: see `src/art/`.)

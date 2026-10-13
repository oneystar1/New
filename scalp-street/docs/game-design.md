# Scalp Street: game design document

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
   (25, 50, 100, 200, 300...) double a store's profit. Unmanaged stores need
   a tap to start each cycle; a manager automates it and makes the store
   count toward offline income.
3. **Upgrades.** Three per store (x2 profit each, gated on unit counts),
   global cash upgrades (shipping supplies, storage unit, label printer,
   cargo van, LLC, warehouse), tap upgrades, family specialisations.
4. **Shelf (collection).** 52 items across two families (Dohs: stretchy
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
- **Achievements** (25) that pay Clout.
- **Piggy bank** collecting 2% of all earnings.
- **Market events** that reward checking in.
- Red-dot badges on tabs when something is claimable.

## Screens

Bottom tab bar, portrait, 520px max width centred on desktop:

1. **Hunt** - tap shelf, hunt meter, daily login, missions.
2. **Routes** - store list with buy x1/x10/x100/max, progress bars,
   managers.
3. **Shelf** - mystery pulls (Clout or free video), rarity odds, 4-column
   binder with rarity borders, item detail sheet with duplicate flipping.
4. **Hustle** - Relocate card, cash gear, Clout perks, Reputation,
   achievements, settings (save export/import, reset).
5. **Shop** - starter pack, VIP, free rewarded boosts with cooldowns,
   piggy bank, Hustle Pass track, Clout sinks, Clout packs, remove ads.

## Content roadmap

- Season 2 pass with a new exclusive item and three new squishes.
- Weekend "Con Weekend" live event with a leaderboard (needs a backend).
- Trade board: swap duplicates with other players (needs accounts).
- Cosmetics: shelf backgrounds, tap effects (pure monetization, no power).
- Art pass: replace emoji placeholders with original plush/fidget sprites.

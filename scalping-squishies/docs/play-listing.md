# Google Play listing pack

Everything the Play Console asks for on the store listing and the Data
safety form, ready to paste. Mirrors `docs/store-listing.md`; the name is
subject to the same trademark decision.

## App name (30)

Scalping Squishies

## Short description (80)

Idle flip tycoon. Camp the restock line, hoard the nanas, flip the dohs.

## Full description (4000)

You are a fidget-toy scalper. Not proud of it. Very good at it.

Tap the shelf. Buy out the stores. Hire runners to flip while you sleep.
Then do the part nobody else will: camp the restock line at 6am in a
parking lot with a Kube Mom, a kid with birthday money, three sneaker
bros and a Bluetooth speaker. Hold your spot through bathroom breaks,
coffee runs, rain and a mall cop who wants the tents down. Doors open at
seven. Grab what the moms leave.

Then sell it. The Marketplace never sleeps: fair buyers, lowballers,
ghosts, scammers, Karens who want to speak to someone, and sneaker bros
who think a dough cube is a drop. Price fair and sleep well. Price insane
and watch the community heat climb until they post your listings.

COLLECT
- 87 parody squishies and dohs, four variants each
- Mystery pulls with odds shown up front, counterfeits included
- Store pages, family sets and seasonal sets that pay profit forever
- A trade board where collectors swap your dupes for the pieces you lack

CAMP
- A real line with real people in it, animated from night to sunrise
- Tickets, spot sales, naps, group-chat intel, and the ethics of stepping
  around a sleeping child
- Get banned. Come back in ten minutes.

GROW
- Ten stores from the Dollar Dohjo to the Factory Back Door
- Relocate when the community finds you: keep your Street Cred, start
  fresh in a new city with a new perk
- Daily missions, a rotating Hustle Pass, weekly Con Weekend leaderboards

SEASONS
- Dohlidays, Squishy Hearts and Dohlloween each bring six exclusives,
  their own tokens and an event shop. Miss one and it comes back next
  year.

Plays offline. Your runners keep flipping while you are away. No account
needed. All brands are parodies; any resemblance to a real shortage is
the point.

## Category and tags

Category: Simulation. Tags: idle, tycoon, clicker, collecting, casual.

## Graphics

| Asset | Size | Source |
| --- | --- | --- |
| App icon | 512×512 PNG | `public/icons/icon-512.png` |
| Feature graphic | 1024×500 PNG | `npm run shots:feature` → `docs/store/feature-graphic.png` |
| Phone screenshots | at least 2, 16:9 to 9:16 | `docs/store/0N-*.png` (the iOS 1290×2796 set is accepted) |

## Content rating questionnaire (IARC)

| Question | Answer |
| --- | --- |
| Violence | None |
| Sexual content | None |
| Language | Mild (the Karens) |
| Controlled substances | None |
| Gambling | Simulated gambling with no real money: mystery pulls, odds shown in-app |
| User interaction | No user-to-user communication (leaderboard shows handles only, no chat) |
| Shares location | No |
| Purchases of digital goods | Yes |

Expected rating: Teen (simulated gambling) or Everyone 10+ depending on
region; the odds disclosure matters here.

## Data safety form

Answer "Yes, collects data" and "Yes, shares data" (AdMob), then:

| Data type | Collected | Shared | Purpose | Optional |
| --- | --- | --- | --- | --- |
| Device or other IDs | Yes | Yes (Google AdMob) | App functionality, Advertising | No |
| Purchase history | Yes | No | App functionality | No |
| App interactions (gameplay events) | Yes | No | Analytics | No |
| Advertising data | Yes | Yes (Google AdMob) | Advertising | No |
| Location, contacts, personal info, financial info, messages, photos, files, health, calendar | No | | | |

Security practices: data is encrypted in transit; users can request
deletion (Boost tab → Settings → Delete cloud data, and the privacy page
contact). Data is not processed ephemerally. The app does not require an
account. Mark AdMob as a third-party SDK and note that ads use the
advertising ID only when the user allows personalized ads.

## Ads declaration

Contains ads: Yes. Ad format: rewarded video (optional) and interstitial
(after a Relocate and after a restock haul, never during the first three
restocks, never with Remove Ads or VIP).

## Target audience

Not designed for children. Target age 13+. The game uses the AdMob SDK
with child-directed treatment off.

## Release notes (first version)

First release. Camp the line, flip the dohs, get banned.

## Before the first upload

1. Create the app in Play Console, package `com.oneycollectibles.scalpingsquishies`.
2. Create the in-app products with the same ids as iOS (`docs/launch-checklist.md`);
   `ss_pass_s2` onward are consumables, `ss_vip` is a subscription.
3. Run the Android workflow (`docs/ci.md` section 7); the bundle goes to
   the internal track when the service account secret is set.

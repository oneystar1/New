# App Store listing pack

Everything App Store Connect asks for on the listing page, ready to paste.
Character limits are Apple's. Screenshots come from `npm run shots:store`
(see the bottom). The name is subject to the trademark decision in
`docs/launch-plan.md`; everything below reads the same with a different
name.

## Name (30)

Scalping Squishies

## Subtitle (30)

Idle flip tycoon. Camp. Hoard.

## Promotional text (170, editable without review)

Dohlidays is on: six holiday exclusives, Candy Canes from every restock,
and a Glow-Nose Reindeer Glob that is already sold out everywhere else.

## Description (4000)

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
• 87 parody squishies and dohs, four variants each, from Off-Brand Dough
  Ball to the One-of-One Rainbow Kube
• Mystery pulls with odds shown up front, counterfeits included
• Store pages, family sets and seasonal sets that pay profit forever

CAMP
• A real line with real people in it, animated from night to sunrise
• Tickets, spot sales, naps, group-chat intel, and the ethics of stepping
  around a sleeping child
• Get banned. Come back in ten minutes.

GROW
• Ten stores from the Dollar Dohjo to the Factory Back Door
• Relocate when the community finds you: keep your Street Cred, start
  fresh in a new city with a new perk
• Daily missions, a season pass, weekly Con Weekend leaderboards

SEASONS
• Dohlidays, Squishy Hearts and Dohlloween each bring six exclusives,
  their own tokens and an event shop. Miss one and it comes back next
  year.

Plays offline. Your runners keep flipping while you are away. No account
needed. All brands are parodies; any resemblance to a real shortage is
the point.

## Keywords (100, comma separated, no spaces)

idle,tycoon,clicker,incremental,squishy,fidget,collect,flip,resale,toys,blindbox,capitalist,shop

## What's New (first version)

First release. Camp the line, flip the dohs, get banned.

## URLs

| Field | Value |
| --- | --- |
| Support URL | https://oneystar1.github.io/New/support.html |
| Marketing URL | https://oneystar1.github.io/New/ |
| Privacy Policy URL | https://oneystar1.github.io/New/privacy.html |

(These go live once GitHub Pages is enabled; swap in your domain if you
move the backend and pages there.)

## Age rating questionnaire

| Question | Answer |
| --- | --- |
| Cartoon or fantasy violence | None |
| Realistic violence | None |
| Profanity or crude humor | Infrequent/Mild (the Karens) |
| Mature/suggestive themes | None |
| Horror/fear themes | None |
| Medical/treatment information | None |
| Alcohol, tobacco, drug use | None |
| Simulated gambling | Infrequent/Mild (mystery pulls with disclosed odds, no real money wagered) |
| Sexual content or nudity | None |
| Contests | None |
| Unrestricted web access | No |
| Gambling with real money | No |
| Loot boxes | Yes, odds disclosed in-app before every pull |

Expected rating: 12+.

## App privacy ("nutrition label")

Answer "Yes, we collect data" and then:

| Data type | Collected | Linked to user | Used for tracking | Purpose |
| --- | --- | --- | --- | --- |
| Purchase history | Yes | No | No | App functionality (restoring what you bought) |
| Device ID | Yes | No | Yes (only if the user allows tracking at the ATT prompt) | App functionality, third-party advertising (AdMob) |
| Product interaction (gameplay events) | Yes | No | No | Analytics |
| Advertising data | Yes | No | Yes (with ATT consent) | Third-party advertising |
| Crash data | No | | | |
| Contact info, location, contacts, photos, health, financial info, browsing history, search history, user content | No | | | |

Nothing is linked to the user's identity: the only identifier is a
random device id. Set "Data Linked to You" to none. Mark AdMob's SDK as
the third party. The in-app privacy policy says the same in plain words.

## Review notes (App Review "Notes" field)

Test account: none needed, the game has no login. Purchases use the
sandbox. Rewarded ads are optional; two interstitial placements run
after a Relocate and after a restock, never during the first three
restocks, never with Remove Ads or VIP. Mystery pulls use an in-game
currency (Clout) and show odds before every pull. All store and product
names are parodies; no real brands appear.

## Screenshots

`npm run shots:store` composes the smoke-test screenshots into six
1290×2796 framed images (6.7-inch) with captions in `docs/store/`:

1. Camp the line at 6am
2. Flip the dohs, hoard the nanas
3. Buy out the block
4. Sell to Karens (or don't)
5. Collect 87 parodies
6. Seasons, pass, leaderboards

Run it after `npm run smoke` so the captures are current. App Store
Connect also accepts the same images for 6.5-inch; the 5.5-inch set can
be skipped for iPhone-only apps that target iOS 16+.

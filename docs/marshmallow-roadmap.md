# Marshmallow Quest roadmap

The daily expansion pass reads this file first, builds the next items, and
updates it. Keep entries short. Dates are when something shipped.

## Vision

A full-length 16-bit action adventure: five regions, five dungeons, five
bosses, a cast of marshmallow buddies with skills, equipment and side
quests, a reactive world (day, night, weather), and presentation that holds
up next to the SNES classics. Single HTML file, no build step, phone-first.

## Phases

### A. World (regions, dungeons, bosses)
- [x] Sugarfield overworld, Toasty Woods, Donut Village (Nov 6)
- [x] Cinder Cave + Magma Toad (Nov 8)
- [x] Ember Keep + Pyre Lord, three wings of puzzles (Nov 7-8)
- [x] Glaze Grotto, optional dungeon (Nov 9)
- [x] Frosted Peaks region: snow, ice sliding, cold meter that inverts the fire rule, Snow Slime and Icicle Bat, Sugar Glacier dungeon, Frost Marshal boss, Mitten Charm, Seal 5 (Nov 20)
- [x] Caramel Coast region: tide pools on the clock, Crab Knights, Caramel Jellies, the Sugarplum wreck, Kraken boss, Captain's Compass, Seal 6 (Nov 22)
- [x] Sky Bakery region: cloud platforms over open air (falling), crust planks, gusting wind rects with lulls, Sugar Gull and Burnt Crumb, Cloud Glaze topping, updraft entrance gated on the Mitten Charm (Nov 26)
- [x] Gauntlet third wave: the Oven Lord joins after the Pyre Lord; best times will be slower than before (Nov 28)
- [x] Elder and Granny lines about the sky and the oven (Nov 28)
- [x] The Great Oven: Oven Lord boss (bake fan, stomp trail, coil rows in phase 2) in a brick arena with coil walls, name card, Oven Mitt reward (Nov 27)
- [ ] Rewritten throne room finale with a two-stage Pyre Lord arena

### B. Systems
- [x] Toast as health, soggy, steam, squeeze, vault, bat ride, followers, spear moves, frost jars, currency and shops, day/night, NG+, gauntlet
- [x] Toppings: three equipment slots (crust, glaze, sprinkle) with stat charms bought, found and crafted at the Baker (Nov 20)
- [x] Quest log on the pause screen with main and side quests, markers on the map (Nov 21)
- [x] Badges wall in Puff's home: 16 badges, banner on earn, paged list, kept in NG+ (Nov 24)
- [ ] Save slots (3) and a stats page per slot
- [x] Easy mode (Nov 22); assist toggles still open

### C. Presentation
- [x] Auto-tiled terrain, outlined sprites, fire glow, room camera, reactive music, spatial sfx
- [x] Character portraits in dialog, expressions (Nov 23)
- [x] Boss entrances (camera pan, name card) via bossIntro(); a general cutscene step list is still open (Nov 23)
- [x] Ambient sound beds per area (Nov 23)
- [x] Weather: storm days roll at midnight, noon and sleep; rain with puddles, tint, sulking fire monsters in the lowlands; blizzard with faster cold on the Peaks (Nov 28)
- [ ] Weather follow-ups: lightning flashes (respect FLASH), puddles that linger and dry after the rain, rain on the sky map as a stronger gust day
- [ ] Larger sprite set: 8-direction Puff, enemy death animations per type
- [ ] Title attract mode
- [ ] Badge rewards: a cosmetic topping or home decoration at 9 and 18 badges
- [ ] Cloud tiles are flat; add puffier edges and a second cloud variant
- [ ] Followers in the sky should stay on clouds or wait at the plank
- [ ] Dialog skip hint moved above the box (Nov 24); a proper 'hold B' progress pip is still open

### D. Structure and polish backlog (smaller items)
- [ ] Key rebinding
- [x] Sprinkle economy: monster coin chance 55/75% -> 60/80%, bush 40% -> 50% (Nov 24); watch for prices feeling cheap
- [ ] Replace generated cliffs/water corner tiles with rounded corners

### E. Tech
- [x] Headless Playwright suites in tests/marshmallow, npm run test:mq (Nov 19)
- [ ] Split index.html into modules with a tiny concat build that still emits one file
- [ ] Sprite sheet generator script instead of inline row strings
- [x] Save migration versioning: SAVE_VER and migrateSave() fill new fields on old saves (Nov 24)

## Open bugs
- none known

## Notes for the next passes
- Sliding state must reset on map change (fixed Nov 20); any new movement state needs the same reset in loadMap.
- Peaks enemies use `cold` instead of `heat`; `chill()` is the cold counterpart of `hurtPlayer()`.
- Tide objects sit on shallow tiles and become solid at high tide; refreshSolids runs on every tide change and Puff is hopped out if caught.
- Bosses that must respawn on re-entry use a trigger with a `*Met` flag (taunt once) and are skipped in loadMap.
- Counters live in G.stats via bump(k); badge conditions read them through stat(k). checkBadges() awards one badge per call so banners never pile up.
- New save fields: add a default in migrateSave() and bump SAVE_VER.
- Weather lives in G.weather ('clear'|'storm') and is saved (SAVE_VER 5). rainHere()/blizzardHere() gate every effect by map; puddles are seeded per map from a fixed seed and only exist while it rains.
- Gauntlet stages: 1 toad, 2 Pyre Lord, 4 Oven Lord, 3 = cleared. The boss death branches check G.gauntlet first.
- Bosses with a mini flag use the mini damage path; add a bossN flag, a death branch in damageEnemy, a trigger with a *Met flag, a loadMap skip, and a health bar line.
- Sky: tiles in FALL (just 'A') drop Puff via P.falling and return him to P.safe, which only updates outside wind rects. Wind lives in m.wind rects; windStrength() is a sine gust with a per-rect phase. Warps gate on items with needsItem.
- In Puff's home, tile (8,1) faces the bed when looking down; tests must face up (dir 1) to hit the wall.

## Log
- Nov 28: weather (rain, puddles, blizzard), Oven Lord gauntlet wave, Elder and Granny lines, Storm label
- Nov 27: Oven Lord boss and the Great Oven arena, Oven Mitt, Baker's Dozen badge, boss flame markers on the pause map, Baker line
- Nov 26: Sky Bakery region with wind, falling, two enemies, Cloud Glaze, oven door placeholder; Head in the Clouds badge; plank footsteps (the Nov 25 firing arrived late and was folded into this pass)
- Nov 24: badge wall with 16 badges, kill/coin/sleep counters, save versioning + migration, sprinkle drop nudge, skip hint off the dialog border
- Nov 23: dialog portraits with moods; boss entrance cutscenes for all four bosses; ambient beds; FLASH option and reduced-motion handling; credits skip, remembered intro
- Nov 22: Caramel Coast + Sugarplum wreck + Kraken, tide system, compass, Seal 6; Easy mode; villager progress lines; vent timing
- Nov 21: quest log with map markers; light budget (16 lights, merged, small ones skip darkness holes); cooled keep after the boss; cornered-block auto reset
- Nov 20 (pass 2): Toppings system with seven toppings, shops and crafting; first-contact tips; charge ring; auto-pause and haptics
- Nov 20: Frosted Peaks + Sugar Glacier + Frost Marshal, cold meter, ice sliding, Mitten Charm, Seal 5; roadmap created; daily pass now builds
- Nov 19: tests in repo, interaction prompt, enemy facing, erase save, pixel snap, spaced touch buttons

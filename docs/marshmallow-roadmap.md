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
- [ ] Sky Bakery (late game): wind currents, floating platforms, the Oven Lord
- [ ] Rewritten throne room finale with a two-stage Pyre Lord arena

### B. Systems
- [x] Toast as health, soggy, steam, squeeze, vault, bat ride, followers, spear moves, frost jars, currency and shops, day/night, NG+, gauntlet
- [x] Toppings: three equipment slots (crust, glaze, sprinkle) with stat charms bought, found and crafted at the Baker (Nov 20)
- [x] Quest log on the pause screen with main and side quests, markers on the map (Nov 21)
- [ ] Badges / achievements wall in Puff's home
- [ ] Save slots (3) and a stats page per slot
- [x] Easy mode (Nov 22); assist toggles still open

### C. Presentation
- [x] Auto-tiled terrain, outlined sprites, fire glow, room camera, reactive music, spatial sfx
- [ ] Character portraits in dialog, expressions
- [ ] Boss entrances (camera pan, name card), cutscene system for story beats
- [ ] Ambient sound beds per area (crickets, drips, wind, bubbling)
- [ ] Weather: rain days with puddles; snow in the Peaks
- [ ] Larger sprite set: 8-direction Puff, enemy death animations per type
- [ ] Title attract mode

### D. Structure and polish backlog (smaller items)
- [ ] Key rebinding
- [ ] Reduced-motion and flash safety
- [ ] Sprinkle economy: raise drops or lower sharpen/glaze prices
- [ ] Replace generated cliffs/water corner tiles with rounded corners

### E. Tech
- [x] Headless Playwright suites in tests/marshmallow, npm run test:mq (Nov 19)
- [ ] Split index.html into modules with a tiny concat build that still emits one file
- [ ] Sprite sheet generator script instead of inline row strings
- [ ] Save migration versioning

## Open bugs
- none known

## Notes for the next passes
- Sliding state must reset on map change (fixed Nov 20); any new movement state needs the same reset in loadMap.
- Peaks enemies use `cold` instead of `heat`; `chill()` is the cold counterpart of `hurtPlayer()`.
- Tide objects sit on shallow tiles and become solid at high tide; refreshSolids runs on every tide change and Puff is hopped out if caught.
- Bosses that must respawn on re-entry use a trigger with a `*Met` flag (taunt once) and are skipped in loadMap.

## Log
- Nov 22: Caramel Coast + Sugarplum wreck + Kraken, tide system, compass, Seal 6; Easy mode; villager progress lines; vent timing
- Nov 21: quest log with map markers; light budget (16 lights, merged, small ones skip darkness holes); cooled keep after the boss; cornered-block auto reset
- Nov 20 (pass 2): Toppings system with seven toppings, shops and crafting; first-contact tips; charge ring; auto-pause and haptics
- Nov 20: Frosted Peaks + Sugar Glacier + Frost Marshal, cold meter, ice sliding, Mitten Charm, Seal 5; roadmap created; daily pass now builds
- Nov 19: tests in repo, interaction prompt, enemy facing, erase save, pixel snap, spaced touch buttons

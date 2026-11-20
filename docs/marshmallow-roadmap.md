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
- [ ] Caramel Coast region: tide pools that cycle with the clock, Crab Knights, a shipwreck dungeon, Kraken boss, Seal 6
- [ ] Sky Bakery (late game): wind currents, floating platforms, the Oven Lord
- [ ] Rewritten throne room finale with a two-stage Pyre Lord arena

### B. Systems
- [x] Toast as health, soggy, steam, squeeze, vault, bat ride, followers, spear moves, frost jars, currency and shops, day/night, NG+, gauntlet
- [ ] Toppings: three equipment slots (crust, glaze, sprinkle) with stat charms bought, found and crafted at the Baker
- [ ] Quest log on the pause screen with main and side quests, markers on the map
- [ ] Badges / achievements wall in Puff's home
- [ ] Save slots (3) and a stats page per slot
- [ ] Easy mode and assist toggles

### C. Presentation
- [x] Auto-tiled terrain, outlined sprites, fire glow, room camera, reactive music, spatial sfx
- [ ] Character portraits in dialog, expressions
- [ ] Boss entrances (camera pan, name card), cutscene system for story beats
- [ ] Ambient sound beds per area (crickets, drips, wind, bubbling)
- [ ] Weather: rain days with puddles; snow in the Peaks
- [ ] Larger sprite set: 8-direction Puff, enemy death animations per type
- [ ] Title attract mode

### D. Structure and polish backlog (smaller items)
- [ ] Light budget for phones (cap radial lights, merge small ones)
- [ ] Auto-pause on background, haptics on hurt
- [ ] Cornered-block auto reset (keep east wing, grotto)
- [ ] Cooled keep after the boss (torches out, buddies wandering)
- [ ] First-contact combat tips (Ember wind-up, knight swing)
- [ ] Frost sweep charge ring
- [ ] Villagers who notice progress, night lines
- [ ] Key rebinding
- [ ] Reduced-motion and flash safety
- [ ] Vent corridor timing so a non-stop run always crosses a live vent
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
- Bosses that must respawn on re-entry use a trigger with a `*Met` flag (taunt once) and are skipped in loadMap.

## Log
- Nov 20: Frosted Peaks + Sugar Glacier + Frost Marshal, cold meter, ice sliding, Mitten Charm, Seal 5; roadmap created; daily pass now builds
- Nov 19: tests in repo, interaction prompt, enemy facing, erase save, pixel snap, spaced touch buttons

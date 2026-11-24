# Marshmallow Quest

A 16-bit top-down rescue adventure in the spirit of *A Link to the Past*.
You are Puff, a marshmallow. Fire monsters carried your five buddies off to
Ember Keep. Get too close to fire and you toast; toast all the way and you melt.

Single self-contained HTML file, no build step. Open `index.html` over HTTP or
play the published page.

## Controls

| Action                 | Keyboard              | Touch / Gamepad       |
|------------------------|-----------------------|-----------------------|
| Move                   | Arrows or WASD        | Joystick / left stick |
| Sword, talk, confirm   | Z, J or Space         | A                     |
| Spear thrust           | X or K (tap)          | B                     |
| Spear throw            | X twice quickly       | B twice               |
| Frost sweep            | hold X, release       | hold B                |
| Vault a gap            | X while rolling       | B while rolling       |
| Roll                   | C, L or Shift         | ROLL / X              |
| Item (frost jar, Mallo)| V or I                | ITEM / Y              |
| Pause: map / quest log | Enter, then Left/Right| START, flick stick    |
| Toppings (on pause)    | C                     | ROLL                  |
| Skip a speech          | hold X                | hold B                |
| Mute                   | M                     |                       |

## Mechanics

- **Toast is a resource.** Above half toast you move slower but take less
  damage, and Embers ignore you. Above 80% you leave sticky goo that slows
  monsters. A well-toasted Puff can push through flame curtains. Campfires
  toast you on purpose.
- **Water and cold.** Shallow water resets toast and makes you soggy: fire
  can't toast you, but the sword swings slowly. Douse a flame while soggy and
  the steam cloud confuses monsters. Frost Jars freeze lava into walkable crust
  and snuff any flame, including blue ones the spear can't touch.
- **Squish and stick.** Walk into a narrow gap to squeeze through it. Roll into
  a one-tile cliff to vault it. Roll into a fire bat to hitch a ride.
- **Buddies help.** Ask a rescued buddy in the village to come along. Fluff
  halves lava heat, Mallo stands on plates, Squish improves rolls, Dot saves you
  from melting once per area, Bibi draws monsters away. Boost off a buddy to
  reach the trophy-room shelf.
- **Economy.** Monsters and bushes drop sprinkles. The Baker sells a lamp and
  toppings, Granny sells Frost Jars and Mint Glaze, the Elder sharpens your
  sword. Rarer toppings are crafted at the Baker once you have beaten the boss
  they are named for.
- **Quest log.** The pause screen has two tabs: the world map with goal and
  side-quest markers, and a quest log listing the main quest, the Honey Donut
  and golden sprinkle errands, Seals, the grotto, the Peaks, buddies home and
  the gauntlet with their current step.
- **Cooled keep.** After the Pyre Lord falls, Ember Keep goes quiet: torches
  out, lava crusted over, no monsters, and the freed buddies wander the halls.
  Blocks pushed into a dead corner grind back to their start after a moment.
- **Toppings.** Three equipment slots: crust, glaze, sprinkle. Graham Crust
  (take less), Cracker Crust (roll sooner), Honey Glaze (cool faster), Mint
  Glaze (chill slower), Gold Sprinkles (more drops, found in the Peaks), Fire
  Sprinkles (sword hurts flames more), Star Sprinkles (longer rolls). Open the
  menu from the pause screen with C.
- **Day and night.** Embers are faster at night, shops close, and the lamp
  lights dark caves and dark nights. Sleep at home to skip to morning.
- **Caramel Coast.** East of the woods: hot sand, palms and the sea. Tide
  pools are shallow at low tide (morning and dusk) and deep at high tide
  (midday and night); they are the only way to the wrecked Sugarplum and to
  Seal 6 on an islet. Crab Knights sidestep and pinch, Caramel Jellies drift
  in the shallows. In the wreck, push a crate across the flooded hold at low
  tide to open the cabin, then face the Kraken: it surfaces to spit blinding
  ink and submerges to slap tentacles up through the deck. Reward: the
  Captain's Compass, an on-screen arrow toward your goal in the overworld.
- **Frosted Peaks.** West past the pond: snow, pines, frozen lakes you slide
  across, and a COLD meter that replaces toast. Away from fire Puff stiffens;
  frozen stiff he moves at half speed and cannot roll. Campfires thaw him.
  Snow Slimes and Icicle Bats chill instead of toast. The Sugar Glacier
  dungeon has an ice-slide plate puzzle, Seal 5 in a nook, and the Frost
  Marshal: a charging ice knight who rains icicles. The sword hurts him; the
  spear barely does. Reward: the Mitten Charm.
- **Glaze Grotto.** An optional dungeon under the pond, sealed by a flame
  until you have the spear: a vent corridor, a block puzzle, a squeeze-crack
  side room, a plate for Mallo, and a lava island you cross on frost crust for
  the Sugar Boots (faster rolls). Five Frost Jars inside.
- **Six Marshmallow Seals** are hidden behind the mechanics above. Each
  lengthens the toast meter.
- **Cooling** is slow outdoors and stops entirely while any fire is on screen,
  so jars, water and houses matter. Each spear hit on the Pyre Lord vents
  steam that shields you from his heat for a moment.
- **How to play** page on the title and pause screens, plus one-time tips the
  first time each move becomes possible. Music adds percussion when a monster
  winds up nearby and a low drone as your toast climbs.
- **After the credits:** a boss-rematch gauntlet with a saved best time, and
  New Game+ with upgrades carried over and the village itself on fire. Title
  options: difficulty, speedrun timer, and jars-only cooling.

- **Feedback and comfort.** Enemies show health pips once hit and hits get
  heavier as they weaken. Sounds are panned and quieter with distance. The
  pause screen's Melt Report (V / ITEM) lists melts by area and top causes.
  On touch devices the title menu offers button size, a left-handed layout and
  swipe-to-roll on the stick.

- **Nights** bring Will-o'-Wisps over the pond and woods: harmless drifting
  lights that flare when touched and drop sprinkles. Enemies drop more
  sprinkles after dark.
- **Dungeons** lock the camera to the current room and scroll at doorways.
  Meter upgrades play a fanfare and stretch the bar. Signs read from any side.
  Quit to the title from the pause screen (A).

- **Polish.** A bobbing A bubble marks anything Puff can talk to, read, open
  or push. Knights, Candle Knights, snails and the toad face the way they move.
  The title offers Erase Save, and New Game warns before replacing a save.
  Phones scale to a whole number of device pixels per game pixel.

First-contact tips explain Embers and knights, the frost sweep shows a charge
ring, and the game pauses itself when the app goes to the background.

Dialog shows a portrait of the speaker with a mood, and every boss gets an
entrance: the camera pans to it, a name card drops, then it speaks (A skips).
Areas have ambient sound beds: crickets at night, drips in the cave, bubbling
in the grotto, wind on the Peaks, surf on the coast, a low rumble in the keep.
FLASH on the title (Auto/Reduced/Normal) honors reduced-motion preferences.
Credits skip after three seconds and New Game offers to skip a seen intro.

The BADGE WALL in Puff's home tracks sixteen achievements (first buddy,
each boss, all seals, every region, 100 monsters doused, 250 sprinkles,
full toppings, a night's sleep, a no-melt clear, ten melts, the gauntlet,
New Game+). Earning one shows a banner; face the wall to page through them.
Badges carry into New Game+. Saves carry a version and migrate forward.

Difficulty cycles Normal, Hard, Easy (70% heat, cooling never pauses, one
free save from melting per area). Villagers comment on your latest milestone.

Progress saves to the browser automatically.

## Tests

`npm run test:mq` runs the headless Playwright suites in `tests/marshmallow/`
(main quest, every mechanic, the grotto, checkpoints, feedback and menus).
Each suite prints its checks as JSON; the runner fails on any reported error.

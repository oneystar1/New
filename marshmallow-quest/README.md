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
| Pause, map             | Enter or Esc          | START                 |
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
  honey glaze, Granny sells Frost Jars, the Elder sharpens your sword.
- **Day and night.** Embers are faster at night, shops close, and the lamp
  lights dark caves and dark nights. Sleep at home to skip to morning.
- **Four Marshmallow Seals** are hidden behind the mechanics above. Each
  lengthens the toast meter.
- **After the credits:** a boss-rematch gauntlet with a saved best time, and
  New Game+ with upgrades carried over and the village itself on fire. Title
  options: difficulty, speedrun timer, and jars-only cooling.

Progress saves to the browser automatically.

# Iron Diamond

Robot baseball with a fight on every close play: an original game in the spirit of
the old NES robot-baseball games, rebuilt with modern vector graphics, a 3D night
ballpark, 12 clubs and four modern robot frames.

No build step, no dependencies. Serve the repo over HTTP and open `iron-diamond/`:

```sh
npm start      # then http://localhost:8080/iron-diamond/
```

![batting](../docs/screenshots/iron-diamond/batting.png)
![clash](../docs/screenshots/iron-diamond/clash.png)

## On a phone or tablet

Touch screens get a thumbstick (slide your thumb; the knob follows it) and big
A / B buttons that are labelled with what they do right now (SWING, POWER,
PITCH, THROW, STRIKE…). Everything scales to the screen: on tablets the
controls sit below the picture at full size; on a phone held sideways they float
over it, translucent.



Hold the phone sideways for the full-screen view; the d-pad, A, B and Start
appear as translucent touch buttons and the HUD moves to the top of the screen.
Hits, clash blows and explosions vibrate on phones that support it, and Android
gets a FULL button for true fullscreen. **Settings → Effects** chooses AUTO
(the default, which drops the glow and light effects if the phone can't keep
60 fps), HIGH or LOW.

On a phone you can also tap menu items, team cards and garage rows directly
(tap once to pick, again to confirm).

To publish a single-file copy (for hosting anywhere):

```sh
python3 tools/build_iron_diamond.py iron-diamond-single.html
```

## Modes

- **Exhibition**: 1 player vs CPU, 2 players head to head, or CPU vs CPU to watch.
- **Practice**: an interactive **Tutorial** walks through every control and
  waits for you to try each one (swings, bunt, steal, pitching, steering,
  fielding, a clash). **Home Run Derby** gives you a pitching machine and 10
  outs; only homers count, and the best runs go on a leaderboard.
- **Season**: play an 11-round round robin against every other club while
  the rest of the league plays its own games. Standings track W-L, games back and
  run differential; the top 4 make the playoffs (semifinal, then the Iron
  Diamond Series final). You can play each game or sim it. Damage, credits and
  the garage work as in the Gauntlet.
- **Gauntlet**: pick a club and beat 5 opponents plus a final, with 3 continues.
  Armor damage carries over between matches. Earn credits for wins, runs,
  strikeouts and destroyed bots, then spend them in the **Garage** on repairs,
  rebuilding scrapped bots and club-wide upgrades (power, contact, speed, fight,
  arm, plating). Progress saves in the browser. Forfeiting a match from the
  pause menu counts as a loss and keeps the damage.
- **Settings**: 3/5/7/9 innings, Rookie/Pro/Legend difficulty, clashes on/off, sound, music.

## Controls

| Action | Player 1 | Player 2 | Gamepad / touch |
|---|---|---|---|
| Move / aim / shift | `W A S D` | arrows | d-pad / stick |
| **A**: swing, pitch, throw, strike | `J` / `Space` | `,` | A |
| **B**: power swing, pitch type, retreat, heavy | `K` | `.` | B |
| Start / pause | `Enter` | `Backspace` | Start |
| Mute | `M` | | |

**Batting.** Three swings, shown on a panel while you bat:

- **A · Contact**: the big solid ring at the plate is its sweet spot.
- **B · Power**: the smaller dashed gold ring; harder to square up, hits much farther.
- **Hold ↓ · Bunt**: square around and the bat meets the ball by itself if it's
  inside the green bunt zone. Let go to pull back.

Shift left/right so the rings cover the pitch. The **timing meter** shows a
marker racing toward the swing window (wide = contact, narrow gold = power) and
marks where you swung. After every swing you get feedback (PERFECT, EARLY,
LATE, MISSED · TOO HIGH…). On Rookie a dashed ring shows where the pitch will
cross. A is a contact
swing, B a power swing (smaller window, harder hit), Down+A bunts. Swing early to
pull, late to go the other way; high pitches fly, low pitches bounce.

**Pitching.** Pitches sit on a rail at the side of the screen showing each
one's movement, speed and battery cost. Aim with the d-pad, press B or tap the
rail to pick Fastball / Curve / Slider / Changeup / Plasma, A throws. Hold left/right to steer the ball in flight. Every pitch drains the
pitcher's power cell (Plasma drains 14). From the pause menu you can bring in your
reliever.

**Fielding.** You run the fielder nearest the ball. **Settings → Fielding**:
ASSIST (default) chases the ball whenever you let go of the d-pad and throws if
you hesitate; AUTO lets the CPU field and throw for you (steer to take over);
MANUAL is all you. A yellow ring marks where a fly
ball will land. With the ball, hold a direction and press A to throw (→ 1st, ↑ 2nd,
← 3rd, ↓ home; no direction picks the smart play), or run onto the base or into
the runner yourself.

**Running.** Runners go on grounders and wait on fly balls. A sends everyone
another base, B sends them back. **Settings → Base Running: AUTO** (default)
lets runners take smart extra bases on their own; A and B still override.

**Clash.** A close play at a base becomes a 9-second brawl in a holo-ring: ←/→
move, A strike, B heavy (breaks guard), Down guards. If the runner wins, they're
safe; if the fielder wins, the runner is out. When time runs out, whoever dealt more
damage wins. Damage is permanent, and a bot that hits 0 armor is **destroyed** and
replaced from the bench (or by a scrap drone).

## Stealing, pickoffs and Overdrive

- **Steal**: with a runner on and the base ahead empty, press **↑** (or tap
  STEAL) once the pitcher starts his windup. The runner races the catcher's
  throw; a clear win is safe or out, and a close one becomes a clash at the bag.
  CPU runners steal too, and you can see them take a **big lead** first.
- **Pickoff**: when runners are on, a PICKOFF item appears on the pitch rail.
  Against a runner with a big lead it often catches them (or starts a clash).
- **Overdrive**: hits, homers, walks, strikeouts, steals and clash wins fill
  the meter under each team's score. When it's full, the next batter gets their
  frame's ability for that at-bat: Striker **Lock-On** (sweet spots +35%),
  Titan **Overdrive Swing** (bigger power zone, hits 18% harder), Vector
  **Blink** (45% faster, steals automatic), Raptor **Pounce** (next clash deals
  60% more damage). A full meter on defence gives your pitcher **Shutdown**
  (faster pitches, sharper break). Armed robots glow.
- **Mound visit**: once per game, from the pause menu, recharges your pitcher's
  battery by 25.

## 3D robots

Players on the field are real 3D models rendered with
[three.js](https://threejs.org) (r149, bundled in `vendor/`, MIT) using the same
camera as the stadium and composited into the picture. Each robot is a
procedural rig: a pose function places hips, knees, shoulders and hands (arms
solved with two-bone IK), then armour plates, gauntlets, thigh guards, helmets,
visors, backpacks and thrusters are laid between those joints every frame.
Poses: a side-on batting stance with a two-handed grip (lead hand on the knob)
and a swing keyframed in the robot's own body space (load over the rear
shoulder, launch, flat through the zone, extension, wrap over the lead shoulder)
so the bat never passes through the helmet, a squared-around bunt, pitching windup and release,
fielder throws, running, ready crouch, catcher squat and runners' leads. Menu
portraits and the clash ring still use the 2D renderer. **Settings → Robot
Models** switches the field back to 2D for older devices, and the game falls
back to 2D on its own if WebGL isn't available.

`iron-diamond/dev-models3d.html?pose=bat&view=back` previews the rigs (poses:
`bat`, `bunt`, `pitch`, `run`, `ready`, `catcher`; views: `back`, `front`,
`side`; `p` for swing/windup progress).

## Cameras and sound

- **Pitching view**: when you pitch against the CPU the camera sits behind and
  beside the pitcher (you see his back in the lower left) looking in at the batter (left/right aiming is mirrored to
  match); batting stays behind the plate. The switch to the fielding camera is a
  quick broadcast-style cut. Settings → Pitching View can put it back behind the
  batter.
- **Sound**: all synthesized, with a stadium reverb: a layered bat crack that
  gets louder and brighter the better you square it up, a mitt pop, a pitch
  whoosh timed to the flight, metallic FM clangs in clashes, explosions, a
  brass fanfares on homers.
- **Broadcast booth** (on by default; Settings → Announcer): two recorded voices,
  a play-by-play caller and a color analyst, about 200 lines rendered offline with
  espeak-ng and stored as small MP3s in `src/voice.js`. The caller handles the big
  calls (strikeouts, homers, steals, clashes, walk-offs), describes plays (base
  hits, gappers, deep drives, routine grounders, diving catches, double plays),
  sets the scene (full count, bases loaded, inning intros, score updates spoken as
  "Neo Tokyo three, Detroit two", built from city and number clips), and the
  analyst adds color between pitches. `src/booth.js` queues lines by priority:
  big calls cut in, play descriptions follow, color only fills silence and is
  rate-limited, and stale lines are dropped so it never talks over itself.
- **Crowd** (`Crowd` in `src/booth.js`): the home crowd roots for the bottom-half
  team and has an excitement level driven by the game. Cheers and groans are
  synthesized voices (detuned "throats" through vowel formants) rather than
  noise, so there's no hiss: "ooh" on deep flies, cheers and applause for home
  hits, strikeouts and great catches, groans when the visitors score, boos on a
  hit batter, a stomp-stomp-clap chant with two strikes, an organ "charge" when
  the home team gets runners in scoring position, organ riffs between innings,
  and a roar with stomping on a home homer or walk-off. On screen the fans jump,
  wave team colors, start a wave and flash cameras as the excitement rises.

## Broadcast touches

- **Instant replay**: home runs, walk-offs and long running catches replay at
  half speed from low broadcast angles, letterboxed. A skips.
- **Walk-up intros**: every new batter gets a lower-third card with today's
  line (H-for-AB, HR, RBI, K).
- **Play-by-play** ticker, swing feedback, crowd cheers, and a jumbotron in
  centre field showing the batter.

## Home parks

Each club's stadium has its own sky, skyline, weather and light: rain over the
neon district in Neo Tokyo, smokestacks and embers in Detroit, Earth rising over
the Moon, red dust and two moons on Mars, bubbles and caustics under Atlantis,
aurora and snow in the Arctic, pyramids under a gold moon in Cairo, a sunset
harbour in Sydney, and more. Stadium dirt, grass and colour grading change with
the park.

## The league

Twelve clubs, each with its own colours, emblem, frame mix and strengths: Neo Tokyo
Ronin, Detroit Ironworks, Nova Vegas Voltage, Lunar Base Eclipse, Mars Colony Dust
Devils, Atlantis Abyss, Silicon Valley Kernels, Arctic Circuit Glaciers, Cairo Sphinx
Protocol, Berlin Blitz, Rio Jaguar Units, Sydney Solar Flares.

Four robot frames:

- **Striker**: balanced combat android
- **Titan**: treaded heavy siege frame; huge power and armor, slow
- **Vector**: angular hover sentinel with a floating helm; fastest runner and best glove, fragile
- **Raptor**: digitigrade hunter-killer; quick and vicious in a clash

## Code

`src/core.js` (input, synth audio, 3D camera), `data.js` (clubs, frames, rosters),
`robots.js` (vector robot renderer), `stadium.js` (ballpark), `match.js` (rules,
physics, AI), `clash.js`, `render.js` (match view + HUD), `ui.js` (menus, Gauntlet),
`main.js` (loop). Test hooks: `?demo=1&speed=8` plays CPU vs CPU fast-forwarded.

```sh
npm run test:id   # plays 3 full CPU games headlessly and checks the menu flow
```

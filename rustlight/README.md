# Rustlight

An original top-down action-RPG looter: a blade in one hand, a gun in the
other, and loot on the floor. One HTML file, no build step, no dependencies.

Open `rustlight/index.html` in a browser (it works straight from `file://`).

## How it plays

- Fight through sectors of machines. Every fifth sector is a Warden boss.
- **Blade**: attacks lunge you to the enemy you are aiming at, chain into a
  heavy third hit, and cut enemy shots out of the air.
- **Gun**: hold to fire while moving. Shoot bombers to blow up the pack.
- **Dodge** has invulnerability frames and no stamina bar.
- Hits build a **combo** (up to +50% damage) and fill **Surge**, a shockwave
  followed by six seconds of overdrive.
- **Loot** drops as blades, guns, armor and cores in five rarities. Standing
  on a drop shows a comparison card against what you have equipped.
- Clearing a sector gives a choice of three upgrades. Scrap pays for rerolls
  and for tempering your gear up a level.
- Dying costs one **reboot** and puts you back in the fight in under a second.
  Enemies keep the damage you dealt. Bosses refund a reboot; run out and the
  run ends.

## Controls

| Action        | Keyboard and mouse | Gamepad            | Touch              |
|---------------|--------------------|--------------------|--------------------|
| Move          | WASD / arrows      | Left stick         | Left thumb         |
| Aim           | Mouse              | Right stick        | Right thumb        |
| Blade         | Left click / J     | Right stick or RB  | Right thumb (near) |
| Gun           | Right click / K    | Right stick or RT  | Right thumb (far)  |
| Dodge         | Space / Shift      | A                  | DODGE              |
| Surge         | Q                  | LB / Y             | SURGE              |
| Equip         | E                  | X                  | EQUIP              |
| Pause, gear   | Esc / P            | Start              | II                 |
| Mute          | M                  |                    |                    |

On gamepad and touch the aim stick attacks by itself: blade if an enemy is in
reach in that direction, gun otherwise.

## Test

`node rustlight/smoke.mjs` runs a bot through the real game loop in headless
Chromium (needs Playwright) and fails on any page error or if the bot cannot
clear sectors.

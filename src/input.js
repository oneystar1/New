// Keyboard + gamepad input with two logical players.
// Buttons: up/down/left/right, a, b, start.

const KEYMAP = {
  0: { KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right', KeyJ: 'a', KeyK: 'b', Enter: 'start', Space: 'a', KeyL: 'b' },
  1: { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Comma: 'a', Period: 'b', Enter: 'start', ShiftRight: 'b' },
};
const BUTTONS = ['up', 'down', 'left', 'right', 'a', 'b', 'start'];

function newState() {
  const s = { down: {}, pressed: {}, released: {} };
  for (const b of BUTTONS) { s.down[b] = false; s.pressed[b] = false; s.released[b] = false; }
  return s;
}

export class Input {
  constructor() {
    this.players = [newState(), newState()];
    this.rawKeys = {};
    this.anyPressed = false;
    this.gamepadAssign = [null, null];
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      this.rawKeys[e.code] = true;
      for (let p = 0; p < 2; p++) {
        const b = KEYMAP[p][e.code];
        if (b) { this.players[p].down[b] = true; this.players[p].pressed[b] = true; e.preventDefault(); }
      }
      this.anyPressed = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => {
      this.rawKeys[e.code] = false;
      for (let p = 0; p < 2; p++) {
        const b = KEYMAP[p][e.code];
        if (b) { this.players[p].down[b] = false; this.players[p].released[b] = true; }
      }
    });
    window.addEventListener('blur', () => { for (const p of this.players) for (const b of BUTTONS) p.down[b] = false; });
    this.prevPad = [{}, {}];
  }

  /** Poll gamepads: merge their state into player slots (pad 0 -> P1, pad 1 -> P2). */
  pollGamepads() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let slot = 0;
    for (const gp of pads) {
      if (!gp || slot > 1) continue;
      const p = this.players[slot];
      const prev = this.prevPad[slot];
      const cur = {};
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      cur.left = ax < -0.5 || !!gp.buttons[14]?.pressed;
      cur.right = ax > 0.5 || !!gp.buttons[15]?.pressed;
      cur.up = ay < -0.5 || !!gp.buttons[12]?.pressed;
      cur.down = ay > 0.5 || !!gp.buttons[13]?.pressed;
      cur.a = !!(gp.buttons[0]?.pressed || gp.buttons[2]?.pressed);
      cur.b = !!(gp.buttons[1]?.pressed || gp.buttons[3]?.pressed);
      cur.start = !!gp.buttons[9]?.pressed;
      for (const b of BUTTONS) {
        if (cur[b] && !prev[b]) { p.pressed[b] = true; this.anyPressed = true; }
        if (!cur[b] && prev[b]) p.released[b] = true;
        if (cur[b]) p.down[b] = true;
        else if (prev[b]) p.down[b] = false;
      }
      this.prevPad[slot] = cur;
      slot++;
    }
  }

  /** Call at the end of each frame. */
  endFrame() {
    for (const p of this.players) for (const b of BUTTONS) { p.pressed[b] = false; p.released[b] = false; }
    this.anyPressed = false;
  }

  p(i) { return this.players[i]; }

  /** Combined "either player" view for menus. */
  get any() {
    const out = newState();
    for (const b of BUTTONS) {
      out.down[b] = this.players[0].down[b] || this.players[1].down[b];
      out.pressed[b] = this.players[0].pressed[b] || this.players[1].pressed[b];
    }
    return out;
  }
}

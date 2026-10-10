// Poké Ball Park - entry point.
import { loadAssets } from './assets.js';
import { setContext, W, H, clear, text } from './gfx.js';
import { Input } from './input.js';
import { unlockAudio, toggleMute } from './audio.js';
import { TitleScene } from './scenes/title.js';
import { SelectScene } from './scenes/select.js';
import { GameScene } from './scenes/game.js';
import { LineupScene } from './scenes/lineup.js';
import { ResultScene } from './scenes/result.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
setContext(ctx);

function resize() {
  const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / W, (window.innerHeight - 20) / H)));
  canvas.style.width = (W * scale) + 'px';
  canvas.style.height = (H * scale) + 'px';
}
window.addEventListener('resize', resize); resize();

const game = {
  input: new Input(),
  scene: null,
  goto(name, opts = {}) {
    const S = { title: TitleScene, select: SelectScene, lineup: LineupScene, game: GameScene, result: ResultScene }[name];
    this.scene = new S(this, opts);
    this.sceneName = name;
  },
};
window.pokeBallPark = game; // for debugging / tests

window.addEventListener('keydown', e => { unlockAudio(); if (e.code === 'KeyM') toggleMute(); });
window.addEventListener('pointerdown', () => unlockAudio());

async function boot() {
  clear('#000'); 
  try {
    await loadAssets();
  } catch (e) {
    ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
    ctx.fillText('Failed to load sprites: ' + e.message, 8, 20);
    ctx.fillText('Serve this folder over HTTP (e.g. npx serve .)', 8, 34);
    throw e;
  }
  game.goto('title');
  let last = performance.now(), acc = 0;
  const STEP = 1000 / 60;
  function frame(now) {
    acc += Math.min(100, now - last); last = now;
    game.input.pollGamepads();
    let steps = 0;
    while (acc >= STEP && steps < 4) {
      game.scene.update(game.input);
      game.input.endFrame();
      acc -= STEP; steps++;
    }
    if (steps === 0) { /* nothing updated this frame */ }
    game.scene.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
boot();

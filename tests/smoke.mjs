// Browser smoke test with Playwright: loads the game, drives the menus with
// key presses, plays a few pitches and screenshots each screen.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const PORT = 8123;
const OUT = process.env.SHOT_DIR || 'tests/shots';
mkdirSync(OUT, { recursive: true });
const server = spawn('npx', ['--yes', 'http-server', '.', '-p', String(PORT), '-s', '-c-1'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 760 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
try {
  await page.goto(`http://localhost:${PORT}/index.html`);
  await page.waitForFunction(() => window.pokeBallPark && window.pokeBallPark.sceneName === 'title', null, { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '01-title.png') });
  await page.keyboard.press('KeyJ'); // 1P vs CPU
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '02-select.png') });
  await page.keyboard.press('KeyD'); await page.waitForTimeout(100);
  await page.keyboard.press('KeyJ'); await page.waitForTimeout(200);
  await page.keyboard.press('KeyJ'); await page.waitForTimeout(900);
  await page.waitForFunction(() => window.pokeBallPark.sceneName === 'lineup', null, { timeout: 5000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '02b-lineup-home.png') });
  await page.keyboard.press('KeyK'); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '02c-lineup-order.png') });
  await page.keyboard.press('KeyK'); await page.keyboard.press('KeyJ'); await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '02d-lineup-away.png') });
  await page.keyboard.press('KeyJ'); await page.waitForTimeout(300);
  await page.waitForFunction(() => window.pokeBallPark.sceneName === 'game', null, { timeout: 5000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '03-batting.png') });
  // Swing at a few CPU pitches; screenshot the first ball in play.
  let gotField = false;
  for (let i = 0; i < 8 && !gotField; i++) {
    await page.waitForFunction(() => ['flight', 'gameover'].includes(window.pokeBallPark.scene.play.phase), null, { timeout: 15000 });
    await page.waitForTimeout(i % 2 ? 300 : 260);
    await page.screenshot({ path: path.join(OUT, '03b-pitch-flight.png') });
    await page.keyboard.press(i % 2 ? 'KeyK' : 'KeyJ');
    await page.waitForTimeout(700);
    const phase = await page.evaluate(() => window.pokeBallPark.scene.play.phase);
    if (phase === 'inplay' || phase === 'playover' || phase === 'homerun') {
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, '04-field.png') }); gotField = true;
    }
    await page.waitForFunction(() => ['pitching', 'gameover', 'sidechange'].includes(window.pokeBallPark.scene.play.phase), null, { timeout: 30000 });
  }
  await page.screenshot({ path: path.join(OUT, '05-game.png') });
  // Force a CPU-vs-CPU fast game to exercise everything in the browser.
  await page.evaluate(() => {
    const g = window.pokeBallPark;
    g.goto('game', { away: g.scene.match.teams[0], home: g.scene.match.teams[1], innings: 3, controllers: ['cpu', 'cpu'] });
    // (teams[0]/[1] are whatever was picked; the sim test covers every team)
  });
  let result, shots = 0, sideShot = false;
  for (let chunk = 0; chunk < 400; chunk++) {
    result = await page.evaluate(() => {
      const g = window.pokeBallPark;
      let steps = 0;
      // run until the next interesting moment (ball in play) or 300 steps
      while (g.scene.play.phase !== 'gameover' && steps < 300) { g.scene.play.update(); steps++; if (g.scene.play.phase === 'inplay' && g.scene.play.inPlayT > 1.2 && g.scene.play.inPlayT < 1.25) break; if (g.scene.play.phase === 'sidechange' && g.scene.play.timer < 2.0 && g.scene.play.timer > 1.95) break; }
      g.scene.draw();
      const m = g.scene.match;
      return { runs: m.runs, hits: m.hits, inning: m.inning, phase: g.scene.play.phase, inPlayT: g.scene.play.inPlayT };
    });
    if (result.phase === 'inplay' && shots < 3) { await page.screenshot({ path: path.join(OUT, `08-cpu-field-${shots}.png`) }); shots++; }
    if (result.phase === 'sidechange' && !sideShot) { await page.screenshot({ path: path.join(OUT, '09-sidechange.png') }); sideShot = true; }
    if (result.phase === 'gameover') break;
  }
  console.log('cpu game:', JSON.stringify(result));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '06-gameover.png') });
  await page.evaluate(() => window.pokeBallPark.goto('result', { match: window.pokeBallPark.scene.match }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '07-result.png') });
} finally {
  await browser.close();
  server.kill();
}
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('SMOKE OK - screenshots in', OUT);

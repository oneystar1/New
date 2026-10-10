// iPhone emulation: touch controls drive the game; screenshots portrait + landscape.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const PORT = 8124, OUT = process.env.SHOT_DIR || 'tests/shots';
mkdirSync(OUT, { recursive: true });
const server = spawn('npx', ['--yes', 'http-server', '.', '-p', String(PORT), '-s', '-c-1'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch();
const errors = [];
let failed = false;
try {
  for (const [name, vp] of [['portrait', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]]) {
    const ctx = await browser.newContext({ ...devices['iPhone 13'], viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(name + ' pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(name + ' console: ' + m.text()); });
    await page.goto(`http://localhost:${PORT}/index.html`);
    await page.waitForFunction(() => window.pokeBallPark && window.pokeBallPark.sceneName === 'title', null, { timeout: 15000 });
    await page.waitForTimeout(500);
    const touchShown = await page.evaluate(() => document.getElementById('touch').classList.contains('on'));
    if (!touchShown) { errors.push(name + ': touch controls not shown'); }
    await page.tap('#focus');
    await page.screenshot({ path: path.join(OUT, `10-phone-${name}-title.png`) });
    // tap START -> select
    await page.tap('[data-btn="start"]'); await page.waitForTimeout(300);
    let scene = await page.evaluate(() => window.pokeBallPark.sceneName);
    if (scene !== 'select') { errors.push(name + ': start tap did not open team select (scene ' + scene + ')'); }
    // d-pad right to change team, A to confirm twice, then A through the lineup cards
    const pad = await page.$('#tpad'); const box = await pad.boundingBox();
    await page.touchscreen.tap(box.x + box.width * 0.9, box.y + box.height / 2); await page.waitForTimeout(150);
    const pick = await page.evaluate(() => window.pokeBallPark.scene.picks[0]);
    if (pick !== 1) errors.push(name + ': d-pad right did not change team (pick ' + pick + ')');
    await page.tap('[data-btn="a"]'); await page.waitForTimeout(300);
    await page.tap('[data-btn="a"]');
    await page.waitForFunction(() => window.pokeBallPark.sceneName === 'lineup', null, { timeout: 8000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `10b-phone-${name}-lineup.png`) });
    await page.tap('[data-btn="a"]'); await page.waitForTimeout(300);
    await page.tap('[data-btn="a"]');
    await page.waitForFunction(() => window.pokeBallPark.sceneName === 'game', null, { timeout: 8000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, `11-phone-${name}-batting.png`) });
    // swing at a pitch with the A button
    await page.waitForFunction(() => window.pokeBallPark.scene.play.phase === 'flight', null, { timeout: 15000 });
    await page.waitForTimeout(260);
    await page.tap('[data-btn="a"]');
    await page.waitForTimeout(100);
    const swung = await page.evaluate(() => !!window.pokeBallPark.scene.play.swing);
    if (!swung) errors.push(name + ': A tap during flight did not swing');
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `12-phone-${name}-after-swing.png`) });
    await ctx.close();
  }
} catch (e) { failed = true; errors.push('exception: ' + e.message); }
finally { await browser.close(); server.kill(); }
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('TOUCH OK');

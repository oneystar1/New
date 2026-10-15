// Browser smoke test: serves dist/, loads the game in headless Chromium,
// taps the shelf, buys units, opens every tab, triggers a simulated ad and
// purchase, and screenshots each screen into docs/screenshots.
// Run: npm run build && node tests/smoke.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');

const PORT = 8174;
const OUT = process.env.SHOT_DIR || 'docs/screenshots';
mkdirSync(OUT, { recursive: true });
const server = spawn('npx', ['--yes', 'vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 414, height: 860 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const shot = (n) => page.screenshot({ path: path.join(OUT, n) });
const tab = async (label) => { await page.locator('.nav button', { hasText: label === 'Deals' ? 'Messages' : label }).click(); await page.waitForTimeout(250); };
try {
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('.splash', { timeout: 15000 });
  await shot('00-splash.png');
  await page.waitForSelector('.splash', { state: 'detached', timeout: 10000 });
  await page.getByRole('button', { name: 'Take the tour' }).click();
  await page.waitForSelector('.coach');
  await page.waitForSelector('.shelf', { timeout: 15000 });
  await shot('00b-tour.png');
  for (let i = 0; i < 70; i++) await page.locator('.shelf').dispatchEvent('pointerdown', { clientX: 200, clientY: 400 });
  await page.waitForTimeout(300);
  await shot('01-hunt.png');
  if (await page.locator('.overlay .btn.primary').count()) await page.locator('.overlay .btn.primary').first().click();
  await tab('Routes');
  for (let i = 0; i < 6; i++) { await page.locator('.card .btn.primary').first().click(); await page.waitForTimeout(50); }
  await page.locator('.card .ico-lg').first().click();
  await page.waitForTimeout(600);
  await shot('02-routes.png');
  // Restock run: Dollar Dohjo has units, so a line is ready.
  await tab('Hunt');
  await page.locator('.card .btn.gold', { hasText: 'Camp' }).first().click();
  await page.waitForSelector('.overlay.run');
  await shot('03-choice.png');
  await page.getByRole('button', { name: /Camp the line/ }).click();
  await page.waitForTimeout(400);
  await shot('03b-camp.png');
  // Camp: answer events as they come, use the phone, until the doors open (~25s).
  for (let i = 0; i < 80 && !(await page.locator('.grabbtn').count()) && !(await page.locator('.overlay.run').getByRole('button', { name: 'Check out' }).count()); i++) {
    if (await page.locator('.encounter .btn').count()) { if (i < 6) await shot('03c-camp-event.png'); await page.locator('.encounter .btn').first().click(); }
    else if (await page.locator('.phone .btn:not([disabled])').count()) await page.locator('.phone .btn:not([disabled])').last().click();
    await page.waitForTimeout(400);
  }
  for (let i = 0; i < 40; i++) {
    if (await page.locator('.encounter .btn').count()) { if (i === 10) await shot('04-encounter.png'); await page.locator('.encounter .btn').first().click(); }
    else if (await page.locator('.grabbtn').count()) await page.locator('.grabbtn').dispatchEvent('pointerdown');
    else break;
    await page.waitForTimeout(120);
  }
  await page.getByRole('button', { name: 'Check out' }).click({ timeout: 20000 });
  await page.waitForTimeout(300);
  await shot('05-haul.png');
  await page.getByRole('button', { name: 'Back to the car' }).click();
  await tab('Deals');
  // Force the feed: fast-forward the offer timer through the save and reload.
  await page.evaluate(() => window.dispatchEvent(new Event('scalp-save')));
  await page.evaluate(() => { const k = 'scalp-street-save-v1'; const s = JSON.parse(localStorage.getItem(k)); if (!s) throw new Error('no save yet'); s.nextOfferAt = 0; s.heat = 62; s.shelf = { doh_kube: 2, sq_nana: 1 }; localStorage.setItem(k, JSON.stringify(s)); });
  await page.reload();
  await page.waitForSelector('.splash', { state: 'detached', timeout: 10000 });
  await page.waitForSelector('.shelf');
  await tab('Deals');
  await page.waitForSelector('.offer', { timeout: 30000 }); // feed starts 15s after load
  await shot('06-deals.png');
  const n0 = await page.locator('.offer').count();
  await page.locator('.offer .btn').first().click();
  await page.waitForTimeout(200);
  if ((await page.locator('.offer').count()) !== n0 - 1) throw new Error('offer did not resolve');
  await tab('Shelf');
  await shot('07-shelf.png');
  await tab('Hustle');
  await shot('08-hustle.png');
  await tab('Shop');
  await shot('09-shop.png');
  // Simulated rewarded ad then purchase flow.
  await page.getByRole('button', { name: /Watch/ }).first().click();
  await page.waitForTimeout(500);
  await shot('10-ad.png');
  await page.getByRole('button', { name: /Claim reward/ }).click({ timeout: 8000 });
  await page.waitForTimeout(300);
  await page.locator('.card.starter .btn.primary').click();
  await page.waitForTimeout(300);
  await shot('11-purchase.png');
  await page.getByRole('button', { name: 'Confirm purchase' }).click();
  await page.waitForTimeout(400);
  const cash = await page.locator('.wallet .cash').innerText();
  const clout = await page.locator('.pill.clout').innerText();
  console.log('cash', cash, '| clout', clout);
  // Reload: save persisted and offline modal path does not crash.
  await page.reload();
  await page.waitForSelector('.splash', { state: 'detached', timeout: 10000 });
  await page.waitForSelector('.shelf');
  await tab('Shop');
  if (await page.locator('.card.starter').count()) throw new Error('save did not persist: starter pack offer is back');
  console.log('persisted ok');
} finally {
  await browser.close();
  server.kill();
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('smoke ok');

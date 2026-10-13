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
const tab = async (label) => { await page.locator('.nav button', { hasText: label }).click(); await page.waitForTimeout(250); };
try {
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('.shelf', { timeout: 15000 });
  for (let i = 0; i < 70; i++) await page.locator('.shelf').dispatchEvent('pointerdown', { clientX: 200, clientY: 400 });
  await page.waitForTimeout(300);
  await shot('01-hunt.png');
  if (await page.locator('.overlay .btn.primary').count()) await page.locator('.overlay .btn.primary').first().click();
  await tab('Routes');
  for (let i = 0; i < 6; i++) { await page.locator('.card .btn.primary').first().click(); await page.waitForTimeout(50); }
  await page.locator('.card .ico-lg').first().click();
  await page.waitForTimeout(600);
  await shot('02-routes.png');
  await tab('Shelf');
  await shot('03-shelf.png');
  await tab('Hustle');
  await shot('04-hustle.png');
  await tab('Shop');
  await shot('05-shop.png');
  // Simulated rewarded ad then purchase flow.
  await page.getByRole('button', { name: /Watch/ }).first().click();
  await page.waitForTimeout(500);
  await shot('06-ad.png');
  await page.getByRole('button', { name: /Claim reward/ }).click({ timeout: 8000 });
  await page.waitForTimeout(300);
  await page.locator('.card.starter .btn.primary').click();
  await page.waitForTimeout(300);
  await shot('07-purchase.png');
  await page.getByRole('button', { name: 'Confirm purchase' }).click();
  await page.waitForTimeout(400);
  const cash = await page.locator('.wallet .cash').innerText();
  const clout = await page.locator('.pill.clout').innerText();
  console.log('cash', cash, '| clout', clout);
  // Reload: save persisted and offline modal path does not crash.
  await page.reload();
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

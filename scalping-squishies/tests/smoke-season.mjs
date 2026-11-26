// Second smoke pass: the season splash and the trade board, which the main
// smoke run skips because it forces seasons off. Seeds a save with dupes,
// loads with ?season=dohlidays, dismisses the splash, trades once.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');

const PORT = 8176;
const OUT = process.env.SHOT_DIR || 'docs/screenshots';
mkdirSync(OUT, { recursive: true });
const server = spawn('npx', ['--yes', 'vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
const killServer = () => { try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill(); } };
setTimeout(() => { console.error('smoke-season: timed out after 3 minutes'); killServer(); process.exit(2); }, 180_000).unref();
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 414, height: 860 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const must = (cond, msg) => { if (!cond) errors.push(msg); };
try {
  await page.goto(`http://localhost:${PORT}/?season=dohlidays&quiet=1`);
  await page.waitForSelector('.splash', { state: 'detached', timeout: 15000 });
  const skip = page.getByRole('button', { name: /skip|no thanks|later/i });
  if (await skip.count()) await skip.first().click();
  await page.waitForSelector('.shelf');
  await page.waitForSelector('.season-splash', { timeout: 8000 });
  await page.screenshot({ path: `${OUT}/13-season-splash.png` });
  await page.locator('.season-splash .btn').click();
  await page.waitForTimeout(300);
  must((await page.locator('.season-splash').count()) === 0, 'season splash did not dismiss');
  must((await page.getByText('Candy Canes').count()) > 0, 'season card not on the Hunt tab');
  // seed dupes so the trade board rolls, then reload (init script runs before the app)
  await page.evaluate(() => window.dispatchEvent(new Event('scalp-save')));
  await page.waitForTimeout(300);
  await page.addInitScript(() => {
    const raw = localStorage.getItem('scalp-street-save-v1');
    if (!raw) return;
    const s = JSON.parse(raw);
    s.shelf = { ...(s.shelf || {}), doh_kube: 5, sq_nana: 4, doh_gumdrop: 3 };
    s.trades = { date: '', offers: [], done: [], wanted: null };
    localStorage.setItem('scalp-street-save-v1', JSON.stringify(s));
  });
  await page.reload();
  await page.waitForSelector('.splash', { state: 'detached', timeout: 15000 });
  await page.waitForSelector('.shelf');
  must((await page.locator('.season-splash').count()) === 0, 'season splash showed twice');
  await page.getByRole('button', { name: /shelf/i }).first().click();
  await page.waitForTimeout(300);
  await page.locator('.seg button', { hasText: '🔄' }).first().click();
  await page.waitForTimeout(300);
  const trades = await page.getByRole('button', { name: /^Trade$/ }).count();
  must(trades > 0, 'no trade offers on the board');
  await page.screenshot({ path: `${OUT}/15-trades.png`, fullPage: true });
  if (trades) {
    await page.getByRole('button', { name: /^Trade$/ }).first().click();
    await page.waitForTimeout(500);
    must((await page.locator('.overlay .modal').count()) > 0, 'trade did not show the piece');
    if (await page.locator('.overlay .btn.primary').count()) await page.locator('.overlay .btn.primary').first().click();
    await page.waitForTimeout(200);
    must((await page.getByRole('button', { name: /^Trade$/ }).count()) === trades - 1, 'trade offer did not clear');
  }
  console.log('season splash ok · trade board ok');
} finally {
  await browser.close();
  killServer();
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('smoke-season ok');

// Randomized browser soak: plays for SOAK_SECONDS (default 120) by tapping,
// mashing GRAB, clicking random enabled buttons and switching tabs, and
// fails on any page error or console error. Run: npm run build && node tests/soak.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');

const SECONDS = Number(process.env.SOAK_SECONDS ?? 120);
const PORT = 8176;
const server = spawn('npx', ['--yes', 'vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 414, height: 860 }, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('dialog', (d) => d.dismiss());
const TABS = ['Hunt', 'Routes', 'Deals', 'Shelf', 'Hustle', 'Shop'];
const AVOID = /Hard reset|Import|Export|Not yet|Confirm purchase/;
let actions = 0;
try {
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('.shelf', { timeout: 15000 });
  const end = Date.now() + SECONDS * 1000;
  while (Date.now() < end) {
    const r = Math.random();
    if (await page.locator('.grabbtn').count()) { for (let i = 0; i < 8; i++) await page.locator('.grabbtn').dispatchEvent('pointerdown'); actions++; }
    else if (await page.locator('.encounter .btn').count()) { const b = page.locator('.encounter .btn'); await b.nth(Math.floor(Math.random() * (await b.count()))).click(); actions++; }
    else if (await page.locator('.overlay .btn:not([disabled])').count()) {
      const b = page.locator('.overlay .btn:not([disabled])');
      const n = await b.count();
      const pick = b.nth(Math.floor(Math.random() * n));
      if (!AVOID.test(await pick.innerText())) { await pick.click({ timeout: 2000 }).catch(() => {}); actions++; }
    } else if (r < 0.35 && (await page.locator('.shelf').count())) { for (let i = 0; i < 10; i++) await page.locator('.shelf').dispatchEvent('pointerdown', { clientX: 200, clientY: 400 }); actions++; }
    else if (r < 0.55) { await page.locator('.nav button', { hasText: TABS[Math.floor(Math.random() * TABS.length)] }).click(); actions++; }
    else {
      const b = page.locator('main .btn:not([disabled]), main button.ico-lg:not([disabled]), main .seg button, main .item');
      const n = await b.count();
      if (n) {
        const pick = b.nth(Math.floor(Math.random() * n));
        const txt = (await pick.innerText().catch(() => '')) ?? '';
        if (!AVOID.test(txt)) { await pick.click({ timeout: 2000 }).catch(() => {}); actions++; }
      }
    }
    await page.waitForTimeout(80);
  }
  const stats = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('scalp-street-save-v1') || '{}'); return { cash: s.cash, clout: s.clout, heat: s.heat, stats: s.stats, pricing: s.pricing, offers: (s.offers || []).length, units: Object.values(s.stores || {}).reduce((a, x) => a + x.units, 0) }; });
  console.log('actions', actions);
  console.log(JSON.stringify(stats));
} finally {
  await browser.close();
  server.kill();
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('soak ok');

// Rasterizes public/icon.svg into public/icons/* (web, apple-touch) and assets/* (sources for @capacitor/assets). Needs Playwright Chromium.
// Rasterize public/icon.svg into the icon set and Capacitor assets sources.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
const root = process.argv[2] || process.cwd();
const svg = readFileSync(`${root}/public/icon.svg`, 'utf8');
const b64 = Buffer.from(svg).toString('base64');
const browser = await chromium.launch();
async function shot(w, h, html, out) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: out, omitBackground: false });
  await page.close();
  console.log('wrote', out);
}
const BG = '#1a1030';
const icon = (size, pad = 0, bg = BG) => `<html><body style="margin:0;background:${bg}"><img src="data:image/svg+xml;base64,${b64}" style="position:absolute;left:${pad}px;top:${pad}px;width:${size - 2 * pad}px;height:${size - 2 * pad}px"></body></html>`;
for (const s of [1024, 512, 192, 180]) await shot(s, s, icon(s), `${root}/public/icons/icon-${s}.png`);
// Capacitor assets sources: icon-only (1024, full bleed), icon-foreground (transparent-ish padding), splash 2732.
await shot(1024, 1024, icon(1024), `${root}/assets/icon-only.png`);
await shot(1024, 1024, icon(1024, 160), `${root}/assets/icon-foreground.png`);
await shot(1024, 1024, `<html><body style="margin:0;background:${BG}"></body></html>`, `${root}/assets/icon-background.png`);
const splash = (bg, fg) => `<html><body style="margin:0;background:${bg};display:flex;align-items:center;justify-content:center;width:2732px;height:2732px;flex-direction:column;font-family:-apple-system,Helvetica,Arial,sans-serif">
<img src="data:image/svg+xml;base64,${b64}" style="width:720px;height:720px;border-radius:160px">
<div style="margin-top:80px;font-size:120px;font-weight:800;color:${fg};letter-spacing:-2px">Scalping Squishies</div>
<div style="margin-top:24px;font-size:56px;color:${fg};opacity:.7">Camp the drops. Flip the cubes.</div></body></html>`;
await shot(2732, 2732, splash(BG, '#fff'), `${root}/assets/splash.png`);
await shot(2732, 2732, splash(BG, '#fff'), `${root}/assets/splash-dark.png`);
await browser.close();

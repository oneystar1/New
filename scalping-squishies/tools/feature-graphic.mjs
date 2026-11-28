// Play Store feature graphic (1024x500) from the game's own art: the
// store sprite, three item sprites and the tagline on the night sky.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
const root = process.cwd();
mkdirSync(path.join(root, 'docs', 'store'), { recursive: true });
const icon = readFileSync(path.join(root, 'public', 'icon.svg')).toString('base64');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><html><body style="margin:0;width:1024px;height:500px;overflow:hidden;background:linear-gradient(180deg,#06051a 0%,#3a2a6e 55%,#ff8f6a 100%);font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#fff;position:relative">
  ${Array.from({ length: 40 }, (_, i) => `<div style="position:absolute;left:${(i * 137) % 1024}px;top:${(i * 53) % 260}px;width:${2 + (i % 3)}px;height:${2 + (i % 3)}px;border-radius:50%;background:#fff;opacity:${0.4 + (i % 5) * 0.12}"></div>`).join('')}
  <div style="position:absolute;left:0;right:0;bottom:0;height:130px;background:linear-gradient(180deg,#2a2440,#120d22)"></div>
  <div style="position:absolute;left:0;right:0;bottom:130px;height:140px;background:#2a2346;border-top:8px solid #3a3056"></div>
  <div style="position:absolute;left:60px;bottom:218px;width:160px;height:32px;border-radius:6px;background:#1a1230;border:2px solid #ffe066;box-shadow:0 0 12px rgba(255,224,102,.5);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;letter-spacing:1px">DOLLAR DOHJO</div>
  <div style="position:absolute;left:84px;bottom:130px;width:44px;height:74px;background:#1f1838;border:2px solid #6a5a8a"></div>
  <div style="position:absolute;left:92px;bottom:180px;width:30px;height:12px;border-radius:2px;background:#b33a3a;color:#fff;font-size:7px;font-weight:900;text-align:center;line-height:12px">CLOSED</div>
  ${[190, 228, 266, 304, 342].map((x, i) => `<div style="position:absolute;left:${x}px;bottom:130px;width:18px;height:30px;border-radius:8px;background:${['#b56aa0', '#4ac86a', '#3a4a7a', '#1a1a1a', '#8a7a5a'][i]}"></div><div style="position:absolute;left:${x - 3}px;bottom:158px;width:24px;height:24px;border-radius:50%;background:#2d1f54;border:2px solid #f3d2b3"></div>`).join('')}
  <div style="position:absolute;left:392px;bottom:128px;width:22px;height:36px;border-radius:9px;background:#2a7a5a;border:2px solid #6ef0c2;box-shadow:0 0 14px #6ef0c2"></div>
  <div style="position:absolute;left:386px;bottom:162px;width:32px;height:32px;border-radius:50%;background:#2d1f54;border:2px solid #6ef0c2"></div>
  <div style="position:absolute;left:386px;bottom:200px;font-size:11px;font-weight:900;color:#6ef0c2;letter-spacing:1px">YOU</div>
  <img src="data:image/svg+xml;base64,${icon}" style="position:absolute;right:70px;top:40px;width:150px;height:150px;border-radius:34px;box-shadow:0 20px 50px rgba(0,0,0,.5)">
  <div style="position:absolute;left:400px;top:52px;font-size:58px;font-weight:900;letter-spacing:-2px;line-height:1;text-shadow:0 4px 20px rgba(0,0,0,.5)">Scalping<br>Squishies</div>
  <div style="position:absolute;left:402px;top:190px;font-size:22px;color:#ffd8f0;font-weight:700">Camp the line. Flip the dohs. Get banned.</div>
  <div style="position:absolute;left:402px;top:224px;font-size:16px;color:#c9b8f0">Idle flipping tycoon · offline play · no account</div>
</body></html>`);
await page.screenshot({ path: path.join(root, 'docs', 'store', 'feature-graphic.png') });
await browser.close();
console.log('wrote docs/store/feature-graphic.png');

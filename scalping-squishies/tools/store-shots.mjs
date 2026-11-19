// Composes the smoke-test screenshots into framed App Store images.
// Input: docs/screenshots/*.png (828x1720 from tests/smoke.mjs).
// Output: docs/store/0N-*.png at 1290x2796 (6.7-inch), caption on top.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');

const root = process.cwd();
const IN = path.join(root, 'docs', 'screenshots');
const OUT = path.join(root, 'docs', 'store');
mkdirSync(OUT, { recursive: true });

const SHOTS = [
  { src: '03b-camp.png', out: '01-camp.png', title: 'Camp the line at 6am', sub: 'Moms, kids, sneaker bros. Hold your spot till the doors open.' },
  { src: '01-hunt.png', out: '02-flip.png', title: 'Flip the dohs, hoard the nanas', sub: 'Tap the shelf. Runners keep flipping while you sleep.' },
  { src: '02-routes.png', out: '03-stores.png', title: 'Buy out the block', sub: 'Ten stores, from the Dollar Dohjo to the Factory Back Door.' },
  { src: '06-deals.png', out: '04-deals.png', title: 'Sell to Karens (or don\'t)', sub: 'Lowballers, ghosts, scammers. Price fair or get Called Out.' },
  { src: '07-shelf.png', out: '05-collect.png', title: 'Collect 87 parodies', sub: 'Four variants each. Sets pay profit forever.' },
  { src: '08-hustle.png', out: '06-grow.png', title: 'Seasons, pass, leaderboards', sub: 'Relocate, keep your Street Cred, start again bigger.' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1290, height: 2796 }, deviceScaleFactor: 1 });
for (const s of SHOTS) {
  const file = path.join(IN, s.src);
  if (!existsSync(file)) { console.warn('missing', s.src, '(run npm run smoke first)'); continue; }
  const b64 = readFileSync(file).toString('base64');
  await page.setContent(`<!doctype html><html><body style="margin:0;width:1290px;height:2796px;background:linear-gradient(180deg,#2a1a5a,#1a1030 45%,#0d0a1e);font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#fff;overflow:hidden">
    <div style="position:absolute;left:0;right:0;top:120px;text-align:center;padding:0 90px">
      <div style="font-size:92px;font-weight:900;letter-spacing:-2px;line-height:1.05">${s.title}</div>
      <div style="font-size:42px;color:#c9b8f0;margin-top:26px;line-height:1.3">${s.sub}</div>
    </div>
    <div style="position:absolute;left:50%;top:560px;transform:translateX(-50%);width:1060px;height:2200px;border-radius:120px;background:#0a0816;box-shadow:0 60px 120px rgba(0,0,0,.6),inset 0 0 0 14px #2a2246;overflow:hidden">
      <img src="data:image/png;base64,${b64}" style="position:absolute;left:14px;top:14px;width:1032px;height:2144px;object-fit:cover;object-position:top;border-radius:106px">
      <div style="position:absolute;left:50%;top:30px;transform:translateX(-50%);width:300px;height:80px;border-radius:40px;background:#0a0816"></div>
    </div>
  </body></html>`);
  await page.screenshot({ path: path.join(OUT, s.out) });
  console.log('wrote', s.out);
}
await browser.close();

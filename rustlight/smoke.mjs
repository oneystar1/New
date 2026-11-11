// Headless playtest: a simple bot plays Rustlight through the real update loop.
// Usage: node rustlight/smoke.mjs   (needs Playwright + Chromium)
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const dir = path.dirname(fileURLToPath(import.meta.url));
const shots = process.argv[2];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href);
await page.waitForFunction(() => window.RL);
if (shots) await page.screenshot({ path: path.join(shots, 'title.png') });

const play = (frames, stopAt) => page.evaluate(([frames, stopAt]) => {
  const RL = window.RL; RL.auto = false;
  const blank = () => ({ mx: 0, my: 0, aim: null, melee: 0, shoot: 0, smart: 0, dodge: 0, surge: 0, use: 0, pause: 0, confirm: 0, left: 0, right: 0 });
  const log = { perks: 0, equips: 0, maxDepth: 0, over: 0, stop: null };
  for (let f = 0; f < frames; f++) {
    const s = RL.s, I = blank();
    if (s.state === 'title' || s.state === 'over') I.confirm = 1;
    else if (s.state === 'perk') { I.confirm = 1; log.perks++; }
    else if (s.state === 'play') {
      const P = s.P; let t = null, bd = 1e9;
      for (const e of s.enemies) { const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; t = e; } }
      const item = s.drops.find(d => d.kind === 'item' && !d.bot);
      let goal = t || item || s.gate;
      if (goal) {
        const a = Math.atan2(goal.y - P.y, goal.x - P.x);
        if (t) { I.aim = a; I.smart = 1; const k = bd > 90 ? 1 : bd < 40 ? -1 : 0; const sa = a + Math.PI / 2;
          I.mx = Math.cos(a) * k + Math.cos(sa) * .6; I.my = Math.sin(a) * k + Math.sin(sa) * .6;
          if (f % 50 === 0) I.dodge = 1; I.surge = 1; }
        else { I.mx = Math.cos(a); I.my = Math.sin(a); }
        if (f % 60 === 0) { log.stuck = Math.hypot(P.x - (log.px || 0), P.y - (log.py || 0)) < 12; log.px = P.x; log.py = P.y; }
        if (log.stuck && !t) { const sa = a + Math.PI / 2 * (Math.floor(f / 240) % 2 ? 1 : -1); I.mx = Math.cos(sa); I.my = Math.sin(sa); }
      }
      if (P.near && !P.near.bot) { P.near.bot = 1; I.use = 1; log.equips++; }
      if (stopAt && s[stopAt.k] && s[stopAt.k].length >= stopAt.n) { log.stop = f; break; }
    }
    if (s.state === 'over') log.over++;
    log.maxDepth = Math.max(log.maxDepth, s.depth);
    RL.update(1 / 60, I);
  }
  const s = RL.s; RL.draw();
  return { ...log, state: s.state, depth: s.depth, lvl: s.P.lvl, kills: s.kills, hp: Math.round(s.P.hp), reboots: s.P.reboots,
    gear: Object.values(s.P.gear).map(i => `${i.name} L${i.lvl} r${i.r}`) };
}, [frames, stopAt]);

if (shots) { console.log(await play(900, { k: 'enemies', n: 3 })); await page.screenshot({ path: path.join(shots, 'play.png') }); }
const r = await play(60 * 60 * 6);
console.log(r, errors);
if (shots) await page.screenshot({ path: path.join(shots, 'end.png') });
await browser.close();
if (errors.length || r.kills < 20 || r.maxDepth < 2 || !r.perks) { console.error('FAIL'); process.exit(1); }
console.log('OK');

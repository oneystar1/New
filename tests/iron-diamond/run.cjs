// Headless checks for Iron Diamond: plays full CPU-vs-CPU games at 32x speed and walks the menus.
// Usage: node tests/iron-diamond/run.cjs [games]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.join(__dirname, '../../iron-diamond');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(0, r)); const base = `http://localhost:${server.address().port}/`;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  let failed = 0; const games = +process.argv[2] || 3;
  for (let g = 0; g < games; g++) {
    await p.goto(`${base}?auto=1&demo=1&speed=32&innings=3&away=${g}&home=${(g * 5 + 3) % 12}`);
    let r = null;
    for (let i = 0; i < 180; i++) { await p.waitForTimeout(1000); r = await p.evaluate(() => { const m = window.__lastMatch; return { done: !!m, score: m && m.score, ev: m && m.events, errs: ID.errors }; }); if (r.done || r.errs.length) break; }
    const ok = r.done && !r.errs.length; if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} game ${g + 1}: ${JSON.stringify(r)}`);
  }
  // menus: title -> exhibition -> 1P -> team select -> VS -> match starts
  await p.goto(`${base}?auto=1`); await p.waitForTimeout(800);
  for (const k of ['Enter', 'Enter', 'Enter', 'KeyD', 'KeyJ', 'KeyJ', 'Enter']) { await p.keyboard.press(k); await p.waitForTimeout(k === 'KeyJ' ? 900 : 400); }
  const sc = await p.evaluate(() => ({ scene: ID.scene.constructor.name, errs: ID.errors }));
  const menuOk = sc.scene === 'GameScene' && !sc.errs.length; if (!menuOk) failed++;
  console.log(`${menuOk ? 'ok  ' : 'FAIL'} menu flow: ${JSON.stringify(sc)}`);
  if (errs.length) { failed++; console.log('page errors', errs.slice(0, 5)); }
  await b.close(); server.close();
  console.log(failed ? `${failed} check(s) failed` : 'all checks passed'); process.exit(failed ? 1 : 0);
})();

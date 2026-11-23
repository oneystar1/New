// Release preflight: the things that break App Review or the first launch
// and are easy to forget. Prints a report; --strict exits 1 on any failure.
//   npm run preflight            (report)
//   npm run preflight -- --strict (CI gate before a store build)
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const strict = process.argv.includes('--strict');
const root = process.cwd();
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// Icons and native asset sources
for (const f of ['public/icons/icon-1024.png', 'public/icons/icon-512.png', 'public/icons/icon-192.png', 'public/icons/icon-180.png', 'assets/icon-only.png', 'assets/splash.png', 'assets/splash-dark.png']) ok(`icon asset ${f}`, existsSync(path.join(root, f)));
// Legal pages and contact
ok('privacy.html present', existsSync(path.join(root, 'public/privacy.html')));
ok('support.html present', existsSync(path.join(root, 'public/support.html')));
const email = process.env.VITE_SUPPORT_EMAIL || '';
ok('support email configured (VITE_SUPPORT_EMAIL)', Boolean(email), email ? email : 'unset: the privacy page will show the in-game feedback button only');
// Product ids: every product in shop.ts is documented for App Store Connect
const shop = read('src/engine/data/shop.ts');
const ids = new Set([...shop.matchAll(/id: '(ss_[a-z_]+)'/g)].map((m) => m[1]));
for (const n of [2, 3, 4, 5, 6]) ids.add(`ss_pass_s${n}`);
const checklist = read('docs/launch-checklist.md') + read('docs/ci.md');
for (const id of ids) ok(`product ${id} documented`, checklist.includes(id) || /ss_pass_s\d/.test(id) && checklist.includes('ss_pass_s'), '');
// Server treats per-season passes and clout packs as consumables
ok('server consumable rule covers pass seasons', read('server/index.mjs').includes('ss_pass_s'));
// Bundle id consistent
const capId = /appId: '([^']+)'/.exec(read('capacitor.config.ts'))?.[1] ?? '';
ok('bundle id in capacitor.config.ts', Boolean(capId), capId);
ok('bundle id matches docs', checklist.includes(capId), capId);
ok('fastlane Appfile matches bundle id', read('fastlane/Appfile').includes(capId));
ok('tools/ios-plist.sh executable', (statSync(path.join(root, 'tools/ios-plist.sh')).mode & 0o111) !== 0);
// Seasons: no overlapping windows, and pass themes cover a year
const seasons = read('src/engine/data/seasons.ts');
const windows = [...seasons.matchAll(/start: \[(\d+), (\d+)\],\s*end: \[(\d+), (\d+)\]/g)].map((m) => ({ a: Number(m[1]) * 100 + Number(m[2]), b: Number(m[3]) * 100 + Number(m[4]) }));
const covers = (w, md) => (w.a <= w.b ? md >= w.a && md <= w.b : md >= w.a || md <= w.b);
let overlap = false;
for (let md = 101; md <= 1231; md++) if (windows.filter((w) => covers(w, md)).length > 1) overlap = true;
ok('seasonal windows do not overlap', !overlap, `${windows.length} seasons`);
ok('pass themes defined', (read('src/engine/data/pass.ts').match(/finalItem: '/g) ?? []).length >= 6);
// Privacy manifest for the iOS build (App Review requires it with AdMob and UserDefaults)
const pm = existsSync(path.join(root, 'ios-assets/PrivacyInfo.xcprivacy')) ? read('ios-assets/PrivacyInfo.xcprivacy') : '';
ok('iOS privacy manifest present', Boolean(pm));
ok('privacy manifest declares tracking and UserDefaults reason', pm.includes('NSPrivacyTracking') && pm.includes('CA92.1'));
ok('fastlane adds the privacy manifest', read('fastlane/Fastfile').includes('add_privacy_manifest'));
// No leftover TODOs, no console.log in engine
const srcFiles = ['src/engine/sim.ts', 'src/engine/store.ts', 'src/engine/restock.ts', 'src/engine/deals.ts', 'src/engine/season.ts', 'src/engine/trades.ts'];
ok('no TODO/FIXME in engine', !srcFiles.some((f) => /TODO|FIXME/.test(read(f))));
ok('no console.log in engine', !srcFiles.some((f) => /console\.log/.test(read(f))));
// Version
const pkg = JSON.parse(read('package.json'));
ok('package version set', /^\d+\.\d+\.\d+$/.test(pkg.version ?? ''), pkg.version);

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? '✅' : '❌'} ${c.name}${c.detail ? ` · ${c.detail}` : ''}`);
console.log(`\n${checks.length - failed.length}/${checks.length} preflight checks pass${failed.length ? `; ${failed.length} need attention` : ''}.`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const fs = await import('node:fs');
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Preflight\n\n${checks.map((c) => `- ${c.pass ? '✅' : '❌'} ${c.name}${c.detail ? ` · ${c.detail}` : ''}`).join('\n')}\n`);
}
if (strict && failed.length) process.exit(1);

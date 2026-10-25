// Soft-launch dashboard: pulls GET /v1/admin/stats from the backend and
// prints the gates from docs/launch-plan.md with pass/fail.
//   SS_API_URL=https://scalping-squishies-api.fly.dev SS_ADMIN_TOKEN=... node tools/dashboard.mjs [--days 14] [--json]
// Gates: D1 > 35%, D7 > 12%, rewarded views per DAU >= 1.5, starter pack
// conversion > 2% of players who are 3+ days old.
const args = process.argv.slice(2);
const days = Number(args[args.indexOf('--days') + 1] || 14) || 14;
const asJson = args.includes('--json');
const api = (process.env.SS_API_URL || '').replace(/\/$/, '');
const token = process.env.SS_ADMIN_TOKEN || '';
if (!api || !token) {
  console.error('Set SS_API_URL and SS_ADMIN_TOKEN (the same value as the Fly secret).');
  process.exit(2);
}
const r = await fetch(`${api}/v1/admin/stats?days=${days}`, { headers: { authorization: `Bearer ${token}` } });
if (!r.ok) { console.error(`API returned ${r.status}: ${await r.text()}`); process.exit(1); }
const s = await r.json();
if (asJson) { console.log(JSON.stringify(s, null, 2)); process.exit(0); }

// Gross USD per grant, before Apple's cut. Mirrors src/engine/data/shop.ts.
const PRICE = { ss_starter: 2.99, ss_noads: 4.99, ss_vip: 4.99, ss_pass: 9.99, ss_clout_s: 1.99, ss_clout_m: 9.99, ss_clout_l: 19.99, ss_clout_xl: 49.99, ss_clout_xxl: 99.99, ss_bundle_drop: 7.99 };
const pct = (x) => (x == null ? '  n/a' : `${(x * 100).toFixed(1)}%`);
const gate = (ok, n, min) => (n < min ? `? (only ${n}, need ${min}+)` : ok ? 'PASS' : 'FAIL');
const last7 = s.daily.slice(-7);
const dau7 = last7.reduce((a, d) => a + d.dau, 0);
const rew7 = last7.reduce((a, d) => a + d.rewarded, 0);
const rewardedPerDau = dau7 ? rew7 / dau7 : 0;
const gross = Object.entries(s.grantsByProduct).reduce((a, [p, n]) => a + (PRICE[p] ?? 0) * n, 0);
const arpdau = dau7 ? gross / dau7 : 0;

console.log(`Scalping Squishies · last ${s.days} days · ${new Date(s.generatedAt).toISOString().slice(0, 16)}Z`);
console.log(`Users total ${s.totalUsers} · installs ${s.installs} · platforms ${Object.entries(s.platforms).map(([k, v]) => `${k}:${v}`).join(' ') || 'none'}`);
console.log('');
console.log('Gate                         Value      Target   Result');
console.log(`D1 retention                 ${pct(s.d1.rate).padEnd(10)} >35%     ${gate((s.d1.rate ?? 0) > 0.35, s.d1.eligible, 20)}`);
console.log(`D7 retention                 ${pct(s.d7.rate).padEnd(10)} >12%     ${gate((s.d7.rate ?? 0) > 0.12, s.d7.eligible, 20)}`);
console.log(`Rewarded views / DAU (7d)    ${rewardedPerDau.toFixed(2).padEnd(10)} >=1.5    ${gate(rewardedPerDau >= 1.5, dau7, 20)}`);
console.log(`Starter pack conv. (3d+)     ${pct(s.starter.rate).padEnd(10)} >2%      ${gate((s.starter.rate ?? 0) > 0.02, s.starter.eligible, 50)}`);
console.log(`Gross / DAU (7d, pre-Apple)  $${arpdau.toFixed(3).padEnd(9)} info`);
console.log('');
console.log('Day         Installs  DAU  Rewarded  /DAU  Restocks  Purchases');
for (const d of s.daily) console.log(`${d.day}  ${String(d.installs).padStart(8)}  ${String(d.dau).padStart(3)}  ${String(d.rewarded).padStart(8)}  ${d.rewardedPerDau.toFixed(2).padStart(4)}  ${String(d.restocks).padStart(8)}  ${String(d.purchases).padStart(9)}`);
if (Object.keys(s.grantsByProduct).length) {
  console.log('');
  console.log('Grants by product: ' + Object.entries(s.grantsByProduct).map(([p, n]) => `${p}×${n}`).join(', ') + ` · gross $${gross.toFixed(2)}`);
}

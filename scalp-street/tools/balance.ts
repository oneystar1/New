// Balance simulation: a greedy bot plays the game at 1x speed for N hours of
// "active" play, always buying the cheapest-payback unit/manager/upgrade.
// Run with `npm run balance`. Prints a progression curve and when each store
// and prestige threshold is reached, which is how the tuning tables were set.
import { initialState } from '../src/engine/state';
import { tick, computeModifiers, incomePerSecond, storeUnlocked, credForRun, storeCycleProfit, storeCycleSeconds } from '../src/engine/sim';
import { STORES } from '../src/engine/data/stores';
import { MANAGER_BY_STORE } from '../src/engine/data/managers';
import { UPGRADES } from '../src/engine/data/upgrades';
import { unitCost, formatCash, makeRng, formatDuration } from '../src/engine/math';

const hours = Number(process.argv[2] ?? 8);
const s = initialState(0);
const rng = makeRng(99);
let now = 0;
const dt = 1;
const milestones: string[] = [];
const unlocked = new Set<string>();
let prestigeAt: number | null = null;

for (let t = 0; t < hours * 3600; t += dt) {
  now += dt * 1000;
  tick(s, dt, now, rng);
  // Tap as a human might: ~3 taps/sec for the first 10 minutes, then 0.2/sec.
  const m = computeModifiers(s, now);
  const taps = t < 600 ? 3 : 0.2;
  const ips = incomePerSecond(s, m, true);
  s.cash += (1 + ips * 0.01) * m.tapPower * taps * dt;
  // Keep unmanaged stores running (player taps icons).
  for (const st of STORES) {
    const ss = s.stores[st.id];
    if (ss.units > 0 && !ss.manager && ss.progress <= 0) ss.progress = 1e-6;
  }
  // Greedy: best payback among next unit / manager / upgrade.
  let best: { payback: number; act: () => void } | null = null;
  for (const st of STORES) {
    if (!storeUnlocked(s, st.id)) continue;
    const ss = s.stores[st.id];
    const cost = unitCost(st, ss.units);
    if (cost > s.cash) continue;
    const before = storeCycleProfit(s, st.id, m) / storeCycleSeconds(s, st.id, m);
    ss.units += 1;
    const after = storeCycleProfit(s, st.id, m) / storeCycleSeconds(s, st.id, m);
    ss.units -= 1;
    const gain = after - before || 1e-9;
    const payback = cost / gain;
    if (!best || payback < best.payback) best = { payback, act: () => { s.cash -= cost; ss.units += 1; } };
    const mgr = MANAGER_BY_STORE[st.id];
    if (ss.units > 0 && !ss.manager && mgr.cost <= s.cash) {
      const pb = mgr.cost / Math.max(1e-9, before);
      if (!best || pb < best.payback) best = { payback: pb, act: () => { s.cash -= mgr.cost; ss.manager = true; } };
    }
  }
  for (const u of UPGRADES) {
    if (u.currency !== 'cash' || s.upgrades.includes(u.id) || u.cost > s.cash) continue;
    if (u.requires && s.stores[u.requires.storeId].units < u.requires.units) continue;
    if (u.tier && !s.upgrades.includes(u.id.replace(/_(\d)$/, `_${u.tier - 1}`))) continue;
    const gainMult = u.effect.kind === 'globalProfit' || u.effect.kind === 'globalSpeed' ? u.effect.mult - 1 : u.effect.kind === 'storeProfit' ? 0.3 : 0.1;
    const pb = u.cost / Math.max(1e-9, ips * gainMult);
    if (!best || pb < best.payback) best = { payback: pb, act: () => { s.cash -= u.cost; s.upgrades.push(u.id); } };
  }
  if (best) best.act();
  for (const st of STORES) if (s.stores[st.id].units > 0 && !unlocked.has(st.id)) { unlocked.add(st.id); milestones.push(`${formatDuration(t)}: first ${st.name}`); }
  if (prestigeAt === null && credForRun(s.stats.totalCashEarned) > 0) { prestigeAt = t; milestones.push(`${formatDuration(t)}: prestige available (+${credForRun(s.stats.totalCashEarned)} cred)`); }
  if (t % 1800 === 0) console.log(`${formatDuration(t).padEnd(8)} cash ${formatCash(s.cash).padEnd(10)} ips ${formatCash(incomePerSecond(s, m, true)).padEnd(10)} earned ${formatCash(s.stats.totalCashEarned)}`);
}
console.log('\nMilestones:');
for (const m of milestones) console.log('  ' + m);
console.log(`\nAfter ${hours}h: cred on prestige = ${credForRun(s.stats.totalCashEarned)}`);

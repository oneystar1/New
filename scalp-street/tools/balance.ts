// Balance simulation: a greedy bot plays N simulated hours. It taps, buys
// the best-payback unit/manager/upgrade, keeps unmanaged stores running,
// answers the Deals feed (accepts fair/lowball/bro, declines the rest),
// camps every restock as it comes ready (grabbing 60% of carry, no
// encounters), and reports where the money came from. Run: npm run balance 8
import { initialState } from '../src/engine/state';
import { tick, computeModifiers, incomePerSecond, storeUnlocked, credForRun, storeCycleProfit, storeCycleSeconds, tapValue } from '../src/engine/sim';
import { acceptOffer, declineOffer } from '../src/engine/deals';
import { startRun, openDoors, grab, finishRun, restockReady } from '../src/engine/restock';
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
const src = { stores: 0, taps: 0, deals: 0, restocks: 0 };
let lastEarned = 0;

for (let t = 0; t < hours * 3600; t += dt) {
  now += dt * 1000;
  const before = s.stats.totalCashEarned;
  tick(s, dt, now, rng);
  src.stores += s.stats.totalCashEarned - before;
  const m = computeModifiers(s, now);
  const taps = t < 600 ? 3 : 0.2;
  const tv = tapValue(s, m) * taps * dt;
  s.cash += tv; s.stats.totalCashEarned += tv; s.stats.lifetimeCashEarned += tv; src.taps += tv;
  for (const st of STORES) { const ss = s.stores[st.id]; if (ss.units > 0 && !ss.manager && ss.progress <= 0) ss.progress = 1e-6; }
  // Deals: answer everything in the feed.
  for (const o of [...s.offers]) {
    const b = s.stats.totalCashEarned;
    if (o.kind === 'fair' || o.kind === 'lowball' || o.kind === 'sneakerbro' || o.kind === 'ghost') acceptOffer(s, o.id, now, rng);
    else declineOffer(s, o.id);
    src.deals += s.stats.totalCashEarned - b;
  }
  // Restocks: camp whatever is ready.
  for (const st of STORES) {
    if (!restockReady(s, st.id, now)) continue;
    const run = startRun(s, st.id, m, now, rng);
    if (!run) continue;
    run.encounter = null;
    openDoors(run);
    const target = Math.max(1, Math.floor(run.carry * 0.6));
    while (run.grabbed < target && run.remaining > 0) grab(run, m.tapPower);
    run.phase = 'done';
    const b = s.stats.totalCashEarned;
    finishRun(s, run, now, rng);
    src.restocks += s.stats.totalCashEarned - b;
  }
  // Greedy spend.
  const ips = incomePerSecond(s, m, true);
  let best: { payback: number; act: () => void } | null = null;
  for (const st of STORES) {
    if (!storeUnlocked(s, st.id)) continue;
    const ss = s.stores[st.id];
    const cost = unitCost(st, ss.units);
    if (cost > s.cash) continue;
    const b0 = storeCycleProfit(s, st.id, m) / storeCycleSeconds(s, st.id, m);
    ss.units += 1;
    const b1 = storeCycleProfit(s, st.id, m) / storeCycleSeconds(s, st.id, m);
    ss.units -= 1;
    const payback = cost / Math.max(1e-9, b1 - b0);
    if (!best || payback < best.payback) best = { payback, act: () => { s.cash -= cost; ss.units += 1; } };
    const mgr = MANAGER_BY_STORE[st.id];
    if (ss.units > 0 && !ss.manager && mgr.cost <= s.cash) {
      const pb = mgr.cost / Math.max(1e-9, b0);
      if (!best || pb < best.payback) best = { payback: pb, act: () => { s.cash -= mgr.cost; ss.manager = true; } };
    }
  }
  for (const u of UPGRADES) {
    if (u.currency !== 'cash' || s.upgrades.includes(u.id) || u.cost > s.cash || u.group === 'sketchy') continue;
    if (u.requires && s.stores[u.requires.storeId].units < u.requires.units) continue;
    if (u.tier && !s.upgrades.includes(u.id.replace(/_(\d)$/, `_${u.tier - 1}`))) continue;
    const gainMult = u.effect.kind === 'globalProfit' || u.effect.kind === 'globalSpeed' ? u.effect.mult - 1 : u.effect.kind === 'storeProfit' ? 0.3 : 0.1;
    const pb = u.cost / Math.max(1e-9, ips * gainMult);
    if (!best || pb < best.payback) best = { payback: pb, act: () => { s.cash -= u.cost; s.upgrades.push(u.id); } };
  }
  if (best) best.act();
  for (const st of STORES) if (s.stores[st.id].units > 0 && !unlocked.has(st.id)) { unlocked.add(st.id); milestones.push(`${formatDuration(t)}: first ${st.name}`); }
  if (!milestones.some((x) => x.includes('prestige')) && credForRun(s.stats.totalCashEarned) > 0) milestones.push(`${formatDuration(t)}: prestige available (+${credForRun(s.stats.totalCashEarned)} cred)`);
  if (t % 1800 === 0) {
    const earned = s.stats.totalCashEarned;
    console.log(`${formatDuration(t).padEnd(8)} cash ${formatCash(s.cash).padEnd(10)} ips ${formatCash(incomePerSecond(s, m, true)).padEnd(10)} earned ${formatCash(earned).padEnd(10)} last30m ${formatCash(earned - lastEarned).padEnd(10)} heat ${s.heat.toFixed(0).padStart(3)} shelf ${Object.keys(s.shelf).filter((k) => s.shelf[k] > 0).length}`);
    lastEarned = earned;
  }
}
const total = src.stores + src.taps + src.deals + src.restocks;
console.log('\nIncome sources:');
for (const [k, v] of Object.entries(src)) console.log(`  ${k.padEnd(9)} ${formatCash(v).padEnd(10)} ${((v / total) * 100).toFixed(1)}%`);
console.log('\nMilestones:');
for (const m of milestones) console.log('  ' + m);
console.log(`\nAfter ${hours}h: cred on prestige = ${credForRun(s.stats.totalCashEarned)} · restocks ${s.stats.restocks} · deals ${s.stats.offersAccepted} · called out ${s.stats.calledOut}x`);

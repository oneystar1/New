import type { GameState, ItemFamily, MarketEventKind, Rarity, ItemDef, Reward } from './types';
import { STORES, STORE_BY_ID } from './data/stores';
import { UPGRADE_BY_ID } from './data/upgrades';
import { EVENTS, EVENT_WEIGHTS } from './data/events';
import { ITEMS, ITEM_BY_ID, RARITY_ORDER, RARITY_SHELF_BONUS, itemsForStore } from './data/items';
import { ACHIEVEMENTS } from './data/achievements';
import { MISSION_POOL } from './data/missions';
import { PASS_TIERS } from './data/pass';
import { VIP } from './data/shop';
import { milestoneMult, todayKey, weightedPick, clamp } from './math';

// ---------------------------------------------------------------------------
// Modifiers: everything that multiplies income is computed once per tick so
// the UI and the sim never disagree about "income per second".
// ---------------------------------------------------------------------------

export interface Modifiers {
  storeProfit: Record<string, number>;
  storeSpeed: Record<string, number>;
  familyProfit: Record<ItemFamily, number>;
  globalProfit: number;
  globalSpeed: number;
  tapPower: number;
  offlineCapHours: number;
  offlineRate: number;
  pullLuck: number;
  hypeRecovery: number;
  credMult: number;
  shelfMult: number;
  eventProfit: Record<ItemFamily, number>;
  eventSpeed: Record<ItemFamily, number>;
  boostMult: number;
  vip: boolean;
}

export const BASE_OFFLINE_CAP_HOURS = 2;
export const BASE_OFFLINE_RATE = 0.5;
export const CRED_PER_POINT = 0.02;

export function isVip(s: GameState, now: number): boolean {
  return s.iap.vipUntil > now;
}

/** True when no ads should be shown: Remove Ads, VIP, or a starter-pack window. */
export function isAdFree(s: GameState, now: number): boolean {
  return s.iap.noAds || s.iap.vipUntil > now || s.iap.adFreeUntil > now;
}

export function computeModifiers(s: GameState, now: number): Modifiers {
  const m: Modifiers = {
    storeProfit: {},
    storeSpeed: {},
    familyProfit: { squish: 1, doh: 1 },
    globalProfit: 1,
    globalSpeed: 1,
    tapPower: 1,
    offlineCapHours: BASE_OFFLINE_CAP_HOURS,
    offlineRate: BASE_OFFLINE_RATE,
    pullLuck: 0,
    hypeRecovery: 1,
    credMult: 1 + s.cred * CRED_PER_POINT,
    shelfMult: 1,
    eventProfit: { squish: 1, doh: 1 },
    eventSpeed: { squish: 1, doh: 1 },
    boostMult: 1,
    vip: isVip(s, now),
  };
  for (const st of STORES) {
    m.storeProfit[st.id] = 1;
    m.storeSpeed[st.id] = 1;
  }
  for (const id of s.upgrades) {
    const u = UPGRADE_BY_ID[id];
    if (!u) continue;
    const e = u.effect;
    switch (e.kind) {
      case 'storeProfit': m.storeProfit[e.storeId] *= e.mult; break;
      case 'storeSpeed': m.storeSpeed[e.storeId] *= e.mult; break;
      case 'globalProfit': m.globalProfit *= e.mult; break;
      case 'globalSpeed': m.globalSpeed *= e.mult; break;
      case 'tapPower': m.tapPower *= e.mult; break;
      case 'offlineCapHours': m.offlineCapHours += e.add; break;
      case 'offlineRate': m.offlineRate += e.add; break;
      case 'pullLuck': m.pullLuck += e.add; break;
      case 'hypeDecay': m.hypeRecovery *= e.mult; break;
      case 'familyProfit': m.familyProfit[e.family] *= e.mult; break;
    }
  }
  // Shelf (collection) bonus: each unique item owned adds a small % to profit.
  let shelfBonus = 0;
  for (const it of ITEMS) if ((s.shelf[it.id] ?? 0) > 0) shelfBonus += RARITY_SHELF_BONUS[it.rarity];
  m.shelfMult = 1 + shelfBonus;
  // Event
  if (s.event && s.event.endsAt > now) {
    const ev = EVENTS[s.event.kind];
    const fams: ItemFamily[] = ev.family === 'both' ? ['squish', 'doh'] : [ev.family];
    for (const f of fams) {
      m.eventProfit[f] *= ev.profitMult;
      m.eventSpeed[f] *= ev.speedMult;
    }
  }
  // Timed boosts (rewarded ads, IAP, pass rewards) stack multiplicatively.
  for (const b of s.boosts) if (b.endsAt > now) m.boostMult *= b.mult;
  if (m.vip) {
    m.globalProfit *= VIP.profitMult;
    m.offlineCapHours += VIP.offlineCapHours;
  }
  return m;
}

function storeFamilyMult(storeId: string, table: Record<ItemFamily, number>): number {
  const fam = STORE_BY_ID[storeId].family;
  if (fam === 'mixed') return (table.squish + table.doh) / 2;
  return table[fam];
}

/** Profit for one full cycle of a store with all modifiers. */
export function storeCycleProfit(s: GameState, storeId: string, m: Modifiers): number {
  const st = STORE_BY_ID[storeId];
  const ss = s.stores[storeId];
  if (!ss || ss.units <= 0) return 0;
  const hype = storeFamilyMult(storeId, s.hype);
  return (
    st.baseProfit *
    ss.units *
    milestoneMult(ss.units) *
    m.storeProfit[storeId] *
    storeFamilyMult(storeId, m.familyProfit) *
    storeFamilyMult(storeId, m.eventProfit) *
    m.globalProfit *
    m.credMult *
    m.shelfMult *
    m.boostMult *
    hype
  );
}

export function storeCycleSeconds(_s: GameState, storeId: string, m: Modifiers): number {
  const st = STORE_BY_ID[storeId];
  return st.cycleSeconds / (m.storeSpeed[storeId] * m.globalSpeed * storeFamilyMult(storeId, m.eventSpeed));
}

/** Income per second counting only automated (managed) stores. */
export function incomePerSecond(s: GameState, m: Modifiers, includeUnmanaged = false): number {
  let total = 0;
  for (const st of STORES) {
    const ss = s.stores[st.id];
    if (!ss || ss.units <= 0) continue;
    if (!ss.manager && !includeUnmanaged) continue;
    total += storeCycleProfit(s, st.id, m) / storeCycleSeconds(s, st.id, m);
  }
  return total;
}

export function tapValue(s: GameState, m: Modifiers): number {
  const ips = incomePerSecond(s, m, true);
  return (1 + ips * 0.01) * m.tapPower * m.credMult;
}

// ---------------------------------------------------------------------------
// Earning helpers
// ---------------------------------------------------------------------------

export function earn(s: GameState, amount: number): void {
  if (amount <= 0) return;
  s.cash += amount;
  s.stats.totalCashEarned += amount;
  s.stats.lifetimeCashEarned += amount;
  if (s.cash > s.stats.bestCash) s.stats.bestCash = s.cash;
  // Piggy bank: 2% of all earnings is set aside, breakable with Clout.
  s.piggy += amount * 0.02;
  bumpMission(s, 'cashEarned', amount);
}

export function bumpMission(s: GameState, counter: string, amount: number): void {
  for (const ms of s.missions) {
    const def = MISSION_POOL.find((d) => d.id === ms.id);
    if (def && def.counter === counter && !ms.claimed) ms.progress = Math.min(def.target, ms.progress + amount);
  }
}

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

export interface TickResult {
  completedCycles: number;
  eventStarted: MarketEventKind | null;
  achievementsUnlocked: string[];
}

export function tick(s: GameState, dt: number, now: number, rand: () => number = Math.random): TickResult {
  const res: TickResult = { completedCycles: 0, eventStarted: null, achievementsUnlocked: [] };
  if (dt <= 0) return res;
  const m = computeModifiers(s, now);
  s.stats.playSeconds += dt;

  for (const st of STORES) {
    const ss = s.stores[st.id];
    if (!ss || ss.units <= 0) continue;
    if (!ss.manager && ss.progress <= 0) continue; // waiting for a manual start
    const cycle = storeCycleSeconds(s, st.id, m);
    const profit = storeCycleProfit(s, st.id, m);
    ss.progress += dt / cycle;
    if (ss.progress >= 1) {
      const cycles = ss.manager ? Math.floor(ss.progress) : 1;
      earn(s, profit * cycles);
      s.stats.sales += cycles;
      bumpMission(s, 'sales', cycles);
      res.completedCycles += cycles;
      ss.progress = ss.manager ? ss.progress - cycles : 0;
    }
  }

  // Hype drifts back to 1 after events push it around.
  for (const f of ['squish', 'doh'] as ItemFamily[]) {
    const h = s.hype[f];
    const rate = 0.02 * m.hypeRecovery * dt;
    s.hype[f] = h > 1 ? Math.max(1, h - rate) : Math.min(1, h + rate);
  }

  // Events
  if (s.event && s.event.endsAt <= now) {
    const ended = EVENTS[s.event.kind];
    s.event = null;
    // After-effect: a restock leaves hype low, a drop leaves it high.
    const fams: ItemFamily[] = ended.family === 'both' ? ['squish', 'doh'] : [ended.family];
    for (const f of fams) s.hype[f] = clamp(s.hype[f] * (ended.profitMult >= 1 ? 1.25 : 0.7), 0.5, 2);
  }
  if (!s.event && now >= s.nextEventAt) {
    const kind = weightedPick(EVENT_WEIGHTS, rand);
    s.event = { kind, endsAt: now + EVENTS[kind].durationSeconds * 1000 };
    s.nextEventAt = now + (6 + rand() * 6) * 60_000;
    res.eventStarted = kind;
  }

  // Expire boosts
  s.boosts = s.boosts.filter((b) => b.endsAt > now);

  // Achievements
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue;
    if (a.check(s)) {
      s.achievements.push(a.id);
      s.clout += a.clout;
      res.achievementsUnlocked.push(a.id);
    }
  }
  s.lastSeen = now;
  return res;
}

// ---------------------------------------------------------------------------
// Offline earnings
// ---------------------------------------------------------------------------

export function computeOffline(s: GameState, now: number): { cash: number; seconds: number; cappedSeconds: number } {
  const m = computeModifiers(s, now);
  const seconds = Math.max(0, (now - s.lastSeen) / 1000);
  const cappedSeconds = Math.min(seconds, m.offlineCapHours * 3600);
  const ips = incomePerSecond(s, m, false);
  return { cash: ips * cappedSeconds * m.offlineRate, seconds, cappedSeconds };
}

/** Called on load: credits offline earnings into a pending bucket the UI
 *  presents with an optional "watch ad to double" offer. */
export function applyOfflineOnLoad(s: GameState, now: number): void {
  const off = computeOffline(s, now);
  if (off.seconds >= 60 && off.cash > 0) {
    s.pendingOffline = { cash: off.cash, seconds: off.cappedSeconds };
  }
  // Managed stores keep their progress; unmanaged progress is discarded (it
  // would be exploitable to leave at 99% and come back).
  for (const st of STORES) {
    const ss = s.stores[st.id];
    if (ss && !ss.manager) ss.progress = 0;
  }
  s.lastSeen = now;
}

export function claimOffline(s: GameState, mult = 1): number {
  if (!s.pendingOffline) return 0;
  const amount = s.pendingOffline.cash * mult;
  earn(s, amount);
  s.pendingOffline = null;
  return amount;
}

// ---------------------------------------------------------------------------
// Buying
// ---------------------------------------------------------------------------

export function storeUnlocked(s: GameState, storeId: string): boolean {
  const st = STORE_BY_ID[storeId];
  const total = Object.values(s.stores).reduce((a, b) => a + b.units, 0);
  return total >= st.unlockAtTotalUnits;
}

export function startCycle(s: GameState, storeId: string): boolean {
  const ss = s.stores[storeId];
  if (!ss || ss.units <= 0 || ss.progress > 0) return false;
  ss.progress = 1e-6;
  return true;
}

// ---------------------------------------------------------------------------
// Pulls (gacha) and shelf
// ---------------------------------------------------------------------------

export function highestUnlockedStore(s: GameState): string {
  let best = STORES[0].id;
  for (const st of STORES) if ((s.stores[st.id]?.units ?? 0) > 0) best = st.id;
  return best;
}

export function rollRarity(storeId: string, luck: number, rand: () => number): Rarity {
  const base = STORE_BY_ID[storeId].pullWeights;
  const weights: Partial<Record<Rarity, number>> = {};
  // Luck shifts weight from common toward higher tiers.
  RARITY_ORDER.forEach((r, i) => {
    const w = base[r] ?? 0;
    if (w > 0) weights[r] = w * (1 + luck * i);
  });
  return weightedPick(weights, rand);
}

export function pullItem(s: GameState, storeId: string, luck: number, rand: () => number): ItemDef {
  const rarity = rollRarity(storeId, luck, rand);
  let pool = itemsForStore(storeId).filter((i) => i.rarity === rarity);
  if (pool.length === 0) pool = ITEMS.filter((i) => i.rarity === rarity);
  if (pool.length === 0) pool = itemsForStore(storeId);
  const item = pool[Math.floor(rand() * pool.length)];
  s.shelf[item.id] = (s.shelf[item.id] ?? 0) + 1;
  s.stats.pulls += 1;
  bumpMission(s, 'pulls', 1);
  return item;
}

/** Seconds of income a duplicate sells for, by rarity. */
export const DUPE_VALUE_SECONDS: Record<Rarity, number> = {
  common: 15,
  uncommon: 45,
  rare: 180,
  ultra: 900,
  select: 3600,
  grail: 4 * 3600,
};

export function dupeSaleValue(s: GameState, itemId: string, now: number): number {
  const it = ITEM_BY_ID[itemId];
  const m = computeModifiers(s, now);
  const ips = Math.max(1, incomePerSecond(s, m, true));
  const hype = s.hype[it.family];
  return Math.max(it.retail * it.resaleMult, ips * DUPE_VALUE_SECONDS[it.rarity] * hype);
}

export function sellDuplicate(s: GameState, itemId: string, now: number): number {
  const owned = s.shelf[itemId] ?? 0;
  if (owned <= 1) return 0;
  const val = dupeSaleValue(s, itemId, now);
  s.shelf[itemId] = owned - 1;
  earn(s, val);
  return val;
}

// ---------------------------------------------------------------------------
// Prestige ("Relocate")
// ---------------------------------------------------------------------------

export const PRESTIGE_MIN_EARNED = 100_000_000;

export function credForRun(totalCashEarnedThisRun: number): number {
  if (totalCashEarnedThisRun < PRESTIGE_MIN_EARNED) return 0;
  return Math.floor(Math.pow(totalCashEarnedThisRun / 1e6, 0.45));
}

export function prestige(s: GameState, now: number): number {
  const gained = credForRun(s.stats.totalCashEarned);
  if (gained <= 0) return 0;
  const keepCash = s.upgrades.includes('c_start') ? 10_000 : 10;
  s.cred += gained;
  s.cash = keepCash;
  for (const st of STORES) s.stores[st.id] = { units: 0, progress: 0, manager: false };
  s.upgrades = s.upgrades.filter((id) => UPGRADE_BY_ID[id]?.currency !== 'cash');
  s.event = null;
  s.nextEventAt = now + 3 * 60_000;
  s.hype = { squish: 1, doh: 1 };
  s.stats.totalCashEarned = 0;
  s.stats.prestiges += 1;
  s.pendingOffline = null;
  s.lastSeen = now;
  return gained;
}

// ---------------------------------------------------------------------------
// Daily missions / login
// ---------------------------------------------------------------------------

export function rollMissions(s: GameState, now: number, rand: () => number = Math.random): void {
  const key = todayKey(now);
  if (s.missionsDate === key && s.missions.length) return;
  const pool = [...MISSION_POOL];
  const chosen = [];
  while (chosen.length < 3 && pool.length) {
    const idx = Math.floor(rand() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  s.missions = chosen.map((d) => ({ id: d.id, progress: 0, claimed: false }));
  s.missionsDate = key;
}

export function claimMission(s: GameState, missionId: string): boolean {
  const ms = s.missions.find((x) => x.id === missionId);
  const def = MISSION_POOL.find((d) => d.id === missionId);
  if (!ms || !def || ms.claimed || ms.progress < def.target) return false;
  ms.claimed = true;
  s.clout += def.rewardClout;
  s.pass.xp += def.rewardPassXp;
  return true;
}

export const DAILY_REWARDS: Reward[] = [
  { kind: 'cash', minutesOfIncome: 10 },
  { kind: 'clout', amount: 5 },
  { kind: 'pulls', amount: 1 },
  { kind: 'boost', mult: 2, minutes: 15 },
  { kind: 'clout', amount: 10 },
  { kind: 'pulls', amount: 2 },
  { kind: 'clout', amount: 25 },
];

export function dailyAvailable(s: GameState, now: number): boolean {
  return s.lastDailyClaim !== todayKey(now);
}

function yesterdayKey(now: number): string {
  return todayKey(now - 24 * 3600 * 1000);
}

/** Claims today's login reward; returns the reward or null. */
export function claimDaily(s: GameState, now: number): { reward: Reward; day: number } | null {
  if (!dailyAvailable(s, now)) return null;
  s.dailyStreak = s.lastDailyClaim === yesterdayKey(now) ? s.dailyStreak + 1 : 1;
  s.lastDailyClaim = todayKey(now);
  const day = ((s.dailyStreak - 1) % DAILY_REWARDS.length) + 1;
  const reward = DAILY_REWARDS[day - 1];
  grantReward(s, reward, now);
  return { reward, day };
}

export function grantReward(s: GameState, r: Reward, now: number, rand: () => number = Math.random): ItemDef[] {
  const pulled: ItemDef[] = [];
  switch (r.kind) {
    case 'cash': {
      const m = computeModifiers(s, now);
      const ips = Math.max(1, incomePerSecond(s, m, true));
      earn(s, ips * r.minutesOfIncome * 60);
      break;
    }
    case 'clout':
      s.clout += r.amount;
      break;
    case 'boost':
      addBoost(s, `reward_${now}`, `x${r.mult} Reward Boost`, r.mult, r.minutes * 60, now);
      break;
    case 'item':
      s.shelf[r.itemId] = (s.shelf[r.itemId] ?? 0) + 1;
      pulled.push(ITEM_BY_ID[r.itemId]);
      break;
    case 'pulls': {
      const m = computeModifiers(s, now);
      for (let i = 0; i < r.amount; i++) pulled.push(pullItem(s, highestUnlockedStore(s), m.pullLuck, rand));
      break;
    }
  }
  return pulled;
}

export function addBoost(s: GameState, id: string, label: string, mult: number, seconds: number, now: number): void {
  const existing = s.boosts.find((b) => b.id === id);
  if (existing) existing.endsAt = Math.max(existing.endsAt, now) + seconds * 1000;
  else s.boosts.push({ id, label, mult, endsAt: now + seconds * 1000 });
}

// ---------------------------------------------------------------------------
// Season pass
// ---------------------------------------------------------------------------

export function passTierReached(s: GameState): number {
  let t = 0;
  for (const tier of PASS_TIERS) if (s.pass.xp >= tier.xp) t = tier.tier;
  return t;
}

export function claimPassTier(s: GameState, tier: number, premium: boolean, now: number): ItemDef[] | null {
  const def = PASS_TIERS.find((t) => t.tier === tier);
  if (!def || passTierReached(s) < tier) return null;
  if (premium && !s.pass.premium) return null;
  const list = premium ? s.pass.claimedPremium : s.pass.claimedFree;
  if (list.includes(tier)) return null;
  const reward = premium ? def.premium : def.free;
  if (!reward) return null;
  list.push(tier);
  return grantReward(s, reward, now);
}

/** Time skip: grants `hours` of managed income instantly. */
export function timeSkip(s: GameState, hours: number, now: number): number {
  const m = computeModifiers(s, now);
  const amount = incomePerSecond(s, m, false) * hours * 3600;
  earn(s, amount);
  return amount;
}

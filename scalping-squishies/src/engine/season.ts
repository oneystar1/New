// Seasonal live events: token economy, event shop, season missions and the
// seasonal set. Pure functions over GameState; the calendar check lives in
// data/seasons.ts and `tickSeason` keeps `s.season.id` in sync with it, so
// everything else only looks at `s.season.id`.
import type { GameState, ItemDef, Rarity } from './types';
import {
  SEASON_BY_ID, SEASONS, activeSeason, itemsForSeason, SEASON_MISSION_POOL, SEASON_MISSION_BY_ID,
  SEASON_SHOP_PRICE, SEASON_TOKENS_PER_CLOUT, SEASON_RARITY_WEIGHTS, SEASON_ITEMS, type SeasonDef,
} from './data/seasons';
import { todayKey, weightedPick } from './math';

export interface SeasonTick {
  started: SeasonDef | null;
  ended: { season: SeasonDef; clout: number } | null;
}

/** Called from the main tick: starts/ends seasons by the calendar, rolls the day's season missions. */
export function tickSeason(s: GameState, now: number, rand: () => number): SeasonTick {
  const res: SeasonTick = { started: null, ended: null };
  const cur = activeSeason(now);
  const curId = cur?.id ?? null;
  if (s.season.id !== curId) {
    if (s.season.id) {
      const old = SEASON_BY_ID[s.season.id];
      const clout = Math.floor(s.season.tokens / SEASON_TOKENS_PER_CLOUT);
      s.clout += clout;
      if (old) res.ended = { season: old, clout };
    }
    s.season = { id: curId, tokens: 0, bought: [], missions: [], missionsDate: '' };
    if (cur) res.started = cur;
  }
  if (cur) rollSeasonMissions(s, now, rand);
  return res;
}

export function rollSeasonMissions(s: GameState, now: number, rand: () => number): void {
  const key = todayKey(now);
  if (s.season.missionsDate === key && s.season.missions.length) return;
  const pool = [...SEASON_MISSION_POOL];
  const chosen = [];
  while (chosen.length < 3 && pool.length) chosen.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  s.season.missions = chosen.map((d) => ({ id: d.id, progress: 0, claimed: false }));
  s.season.missionsDate = key;
}

export function bumpSeasonMissions(s: GameState, counter: string, amount: number): void {
  if (!s.season.id) return;
  for (const ms of s.season.missions) {
    const def = SEASON_MISSION_BY_ID[ms.id];
    if (def && def.counter === counter && !ms.claimed) ms.progress += amount;
  }
}

export function claimSeasonMission(s: GameState, missionId: string): boolean {
  const ms = s.season.missions.find((x) => x.id === missionId);
  const def = SEASON_MISSION_BY_ID[missionId];
  if (!ms || !def || ms.claimed || ms.progress < def.target || !s.season.id) return false;
  ms.claimed = true;
  s.season.tokens += def.rewardTokens ?? 0;
  s.pass.xp += def.rewardPassXp;
  return true;
}

/** Add tokens while a season is on. Returns what was added (0 off-season). */
export function earnTokens(s: GameState, n: number): number {
  if (!s.season.id || n <= 0) return 0;
  s.season.tokens += n;
  return n;
}

/** A random seasonal item, weighted toward commons. */
export function rollSeasonItem(seasonId: string, rand: () => number): ItemDef {
  const items = itemsForSeason(seasonId);
  const weights: Partial<Record<Rarity, number>> = {};
  for (const it of items) weights[it.rarity] = SEASON_RARITY_WEIGHTS[it.rarity] ?? 1;
  const rarity = weightedPick(weights, rand);
  const pool = items.filter((i) => i.rarity === rarity);
  return pool[Math.floor(rand() * pool.length)];
}

export interface SeasonShopRow {
  item: ItemDef;
  cost: number;
  /** Already bought from the shop this season (one each; dupes come from pulls). */
  bought: boolean;
  owned: boolean;
}

export function seasonShop(s: GameState): SeasonShopRow[] {
  if (!s.season.id) return [];
  return itemsForSeason(s.season.id).map((item) => ({
    item,
    cost: SEASON_SHOP_PRICE[item.rarity] ?? 999,
    bought: s.season.bought.includes(item.id),
    owned: (s.shelf[item.id] ?? 0) > 0,
  }));
}

/** Spend tokens on a seasonal item (standard variant). Returns the item or null. */
export function buySeasonItem(s: GameState, itemId: string): ItemDef | null {
  const row = seasonShop(s).find((r) => r.item.id === itemId);
  if (!row || row.bought || s.season.tokens < row.cost) return null;
  s.season.tokens -= row.cost;
  s.season.bought.push(itemId);
  s.shelf[itemId] = (s.shelf[itemId] ?? 0) + 1;
  return row.item;
}

export interface SeasonSetRow {
  season: SeasonDef;
  have: number;
  total: number;
  done: boolean;
}

/** Seasonal sets worth showing: the live season, plus any season you own a piece of. */
export function seasonSets(s: GameState): SeasonSetRow[] {
  return SEASONS.map((season) => {
    const items = itemsForSeason(season.id);
    const have = items.filter((i) => (s.shelf[i.id] ?? 0) > 0).length;
    return { season, have, total: items.length, done: have === items.length && items.length > 0 };
  }).filter((r) => r.have > 0 || r.season.id === s.season.id);
}

/** Seasonal items a player can see on the shelf: owned ones plus the live season's. */
export function visibleSeasonItems(s: GameState): ItemDef[] {
  return SEASON_ITEMS.filter((i) => i.season === s.season.id || (s.shelf[i.id] ?? 0) > 0);
}

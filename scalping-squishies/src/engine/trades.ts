// Trade board: NPC collectors who swap pieces you are missing for the
// duplicates clogging your shelf. Three offers a day. You always keep one
// copy of what you give, the piece you get is one you do not own, and the
// rarity never jumps more than one tier, so trades complete pages rather
// than skipping the pull economy.
import type { GameState, ItemDef, PullView, Rarity, Variant } from './types';
import { ITEMS, ITEM_BY_ID, RARITY_ORDER, VARIANTS, shelfKey, parseShelfKey } from './data/items';
import { todayKey } from './math';

export interface TradeOffer {
  id: number;
  collector: string;
  icon: string;
  line: string;
  /** Shelf key you give (item id, or id:variant) and how many. */
  giveKey: string;
  giveQty: number;
  /** What you get: always a slot you do not own. */
  getItemId: string;
  getVariant: Variant;
}

export interface TradeBoard {
  date: string;
  offers: TradeOffer[];
  done: number[];
}

const COLLECTORS: { name: string; icon: string; lines: string[] }[] = [
  { name: 'Nana Pat', icon: '👵', lines: ['"I have three of these and no grandkids left to give them to."', '"My page is missing one. Yours has extras. We are both adults."'] },
  { name: 'Group Admin Brenda', icon: '📱', lines: ['"Trade only, no cash, keep it in the group."', '"I need this one for a giveaway I am not running."'] },
  { name: 'Dalton', icon: '🧢', lines: ['"It\'s for my kid." It is not for his kid.', '"Straight swap, no shipping, meet at the gas station."'] },
  { name: 'Retired guy who is just curious', icon: '👴', lines: ['"Which one is the valuable one? Never mind. Swap?"', '"I bought the wrong one for my grandson. Twice."'] },
  { name: 'the_other_reseller', icon: '🤝', lines: ['"Even trade, bro. Don\'t check the comps."', '"I have a spare. You have a spare. Math."'] },
];

const rarityIndex = (r: Rarity) => RARITY_ORDER.indexOf(r);

/** Dupes you could give: standard-or-variant slots with at least `qty + 1` copies. */
export function tradeableDupes(s: GameState): { key: string; item: ItemDef; variant: Variant; count: number }[] {
  const out: { key: string; item: ItemDef; variant: Variant; count: number }[] = [];
  for (const [key, count] of Object.entries(s.shelf)) {
    if (count < 2) continue;
    const { itemId, variant } = parseShelfKey(key);
    const item = ITEM_BY_ID[itemId];
    if (item && !item.season) out.push({ key, item, variant, count });
  }
  return out;
}

/** Slots you lack that a collector would offer for a dupe of `give`: core items, at most one rarity tier up. */
function wantsFor(s: GameState, give: ItemDef, rand: () => number): { item: ItemDef; variant: Variant } | null {
  const maxTier = Math.min(RARITY_ORDER.length - 1, rarityIndex(give.rarity) + 1);
  const missing = ITEMS.filter((i) => rarityIndex(i.rarity) <= maxTier && (s.shelf[i.id] ?? 0) === 0);
  const sameFamily = missing.filter((i) => i.family === give.family);
  const pool = sameFamily.length && rand() < 0.7 ? sameFamily : missing;
  if (pool.length) return { item: pool[Math.floor(rand() * pool.length)], variant: 'standard' };
  // Every standard at that tier is owned: offer a missing variant slot of something you have.
  const variantGaps: { item: ItemDef; variant: Variant }[] = [];
  for (const i of ITEMS) {
    if (rarityIndex(i.rarity) > maxTier || (s.shelf[i.id] ?? 0) === 0) continue;
    for (const v of VARIANTS) if (v !== 'standard' && (s.shelf[shelfKey(i.id, v)] ?? 0) === 0) variantGaps.push({ item: i, variant: v });
  }
  return variantGaps.length ? variantGaps[Math.floor(rand() * variantGaps.length)] : null;
}

/** Roll today's board if it has not been rolled yet. Returns true when it rolled. */
export function rollTrades(s: GameState, now: number, rand: () => number): boolean {
  const key = todayKey(now);
  if (s.trades.date === key) return false;
  const dupes = tradeableDupes(s);
  const offers: TradeOffer[] = [];
  const usedGive = new Set<string>();
  const usedGet = new Set<string>();
  let guard = 0;
  while (offers.length < 3 && dupes.length && guard++ < 30) {
    const d = dupes[Math.floor(rand() * dupes.length)];
    if (usedGive.has(d.key)) continue;
    const want = wantsFor(s, d.item, rand);
    if (!want) break;
    const getKey = shelfKey(want.item.id, want.variant);
    if (usedGet.has(getKey)) continue;
    const up = rarityIndex(want.item.rarity) - rarityIndex(d.item.rarity);
    const qty = (up >= 1 ? 3 : 2) * (d.variant === 'standard' ? 1 : 1);
    if (d.count < qty + 1) continue;
    const c = COLLECTORS[Math.floor(rand() * COLLECTORS.length)];
    usedGive.add(d.key);
    usedGet.add(getKey);
    offers.push({ id: offers.length + 1, collector: c.name, icon: c.icon, line: c.lines[Math.floor(rand() * c.lines.length)], giveKey: d.key, giveQty: qty, getItemId: want.item.id, getVariant: want.variant });
  }
  s.trades = { date: key, offers, done: [] };
  return true;
}

/** Make the swap. Returns what you got, or null if the offer is gone or you no longer have the dupes. */
export function acceptTrade(s: GameState, id: number): PullView | null {
  const o = s.trades.offers.find((x) => x.id === id);
  if (!o || s.trades.done.includes(id)) return null;
  if ((s.shelf[o.giveKey] ?? 0) < o.giveQty + 1) return null;
  const getKey = shelfKey(o.getItemId, o.getVariant);
  s.shelf[o.giveKey] -= o.giveQty;
  s.shelf[getKey] = (s.shelf[getKey] ?? 0) + 1;
  s.trades.done.push(id);
  s.stats.tradesDone += 1;
  return { item: ITEM_BY_ID[o.getItemId], variant: o.getVariant };
}

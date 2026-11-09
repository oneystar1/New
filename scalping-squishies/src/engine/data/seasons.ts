import type { ItemDef, MissionDef, Rarity } from '../types';

// Seasons: calendar-driven live events that recur every year. Each one
// brings exclusive items that only drop (and can only be bought with the
// season's tokens) while the season is on. Seasonal items never count
// toward store pages or family sets, so a lapsed season cannot lock a
// permanent set; they have their own set bonus instead.

export interface SeasonDef {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  /** Recurs yearly, UTC: [month 1-12, day] inclusive on both ends. May wrap the year. */
  start: [number, number];
  end: [number, number];
  tokenName: string;
  tokenIcon: string;
  /** Permanent profit bonus for owning every seasonal item (standard variant). */
  setBonus: number;
  /** Extra line-flavor while camping during the season. */
  lineFlavor: string[];
}

/** Share of pulls that come from the season pool while a season is on. */
export const SEASON_PULL_CHANCE = 0.15;
/** Rarity weights inside the season pool. */
export const SEASON_RARITY_WEIGHTS: Partial<Record<Rarity, number>> = { common: 50, uncommon: 25, rare: 15, ultra: 7, select: 3 };
/** Token price of each seasonal item in the event shop, by rarity. */
export const SEASON_SHOP_PRICE: Partial<Record<Rarity, number>> = { common: 15, uncommon: 30, rare: 60, ultra: 120, select: 250 };
/** Tokens per action while the season is on. */
export const SEASON_TOKENS = { restockUnit: 2, pull: 1, deal: 1, daily: 5 };
/** Leftover tokens convert to Clout at this rate when the season ends. */
export const SEASON_TOKENS_PER_CLOUT = 20;

export const SEASONS: SeasonDef[] = [
  {
    id: 'dohlidays',
    name: 'Dohlidays',
    icon: '🎄',
    blurb: 'The holiday wave. Candy canes drop from every restock, pull and deal. Spend them on the seasonal set before the trucks stop.',
    start: [11, 20],
    end: [1, 5],
    tokenName: 'Candy Canes',
    tokenIcon: '🍬',
    setBonus: 0.12,
    lineFlavor: [
      'A mall Santa is in line. He is not working today. He wants a Knitten for his own grandkid.',
      'Someone is playing the same holiday song from a phone speaker. It is 6am. It is the fourth loop.',
      'A Kube Mom has a laminated list with checkboxes. Each kid has a column. There are five columns.',
      'The employee peeks out, sees the line, and mouths "Black Friday was easier".',
    ],
  },
  {
    id: 'squishyhearts',
    name: 'Squishy Hearts',
    icon: '💝',
    blurb: 'Two weeks of pink. Heart-shaped everything, bought by people who have never heard the word "restock".',
    start: [2, 1],
    end: [2, 16],
    tokenName: 'Chocolates',
    tokenIcon: '🍫',
    setBonus: 0.08,
    lineFlavor: [
      'A guy in line is on the phone: "No, babe, I\'m at the store. Yes, THE store. No, I did not get the pink one yet."',
      'Two moms are comparing which kid gets the heart cube and which one "gets a card this year".',
    ],
  },
  {
    id: 'dohlloween',
    name: 'Dohlloween',
    icon: '🎃',
    blurb: 'Glow-in-the-dark season. Everything that glows sells, and the line forms in costume.',
    start: [10, 10],
    end: [11, 2],
    tokenName: 'Candy Corn',
    tokenIcon: '🌽',
    setBonus: 0.1,
    lineFlavor: [
      'A dad in a full inflatable dinosaur costume is holding a spot for three people. The costume is load-bearing.',
      'A sneaker bro in a skeleton hoodie insists it is "not a costume, it\'s a fit".',
    ],
  },
];

export const SEASON_BY_ID: Record<string, SeasonDef> = Object.fromEntries(SEASONS.map((x) => [x.id, x]));

const sq = (season: string, id: string, name: string, rarity: Rarity, icon: string, retail: number, resaleMult: number, blurb: string): ItemDef =>
  ({ id, name, family: 'squish', rarity, icon, retail, resaleMult, storeId: 'season', season, blurb });
const dh = (season: string, id: string, name: string, rarity: Rarity, icon: string, retail: number, resaleMult: number, blurb: string): ItemDef =>
  ({ id, name, family: 'doh', rarity, icon, retail, resaleMult, storeId: 'season', season, blurb });

/** Six items per season: 2 common, 1 uncommon, 1 rare, 1 ultra, 1 limited run. */
export const SEASON_ITEMS: ItemDef[] = [
  // Dohlidays
  dh('dohlidays', 'xm_candycane', 'Candy Cane Kube', 'common', '🍬', 6, 1.6, 'Red and white swirl. Peppermint scent lasts a week. The hype lasts a day.'),
  sq('dohlidays', 'xm_gingernana', 'Gingerbread Nana', 'common', '🍪', 13, 1.5, 'A banana shaped like a gingerbread man. Nobody asked. Everybody bought.'),
  dh('dohlidays', 'xm_snowkube', 'Snow Day Kube', 'uncommon', '❄️', 7, 2.8, 'White with glitter flakes. "Limited" according to a sign that is up every year.'),
  sq('dohlidays', 'xm_elfmochi', 'Elf Mochi 12-Pack', 'rare', '🧝', 15, 3.4, 'Twelve tiny elves in a tiny workshop box. Scalpers sell them one at a time.'),
  dh('dohlidays', 'xm_reindeerglow', 'Glow-Nose Reindeer Glob', 'ultra', '🦌', 9, 8.5, 'The nose glows. The rest does not. The listing says "FULL GLOW".'),
  sq('dohlidays', 'xm_advent', 'Advent Nana Calendar', 'select', '📅', 40, 14.0, '24 doors, one banana. Day 24 is a gold tag. Day 1 is already on Marketplace.'),
  // Squishy Hearts
  dh('squishyhearts', 'vd_heartkube', 'Heartbeat Kube', 'common', '💗', 6, 1.6, 'Squeeze it and it "beats". It is your thumb. It was always your thumb.'),
  sq('squishyhearts', 'vd_choconana', 'Chocolate-Dipped Nana', 'common', '🍫', 13, 1.5, 'Brown on the bottom, yellow on top, sticky on the shelf.'),
  dh('squishyhearts', 'vd_cupid', 'Cupid Glob', 'uncommon', '🏹', 7, 2.8, 'Wings are glued on. Wings fall off. Wings are sold separately on Marketplace.'),
  sq('squishyhearts', 'vd_rosemochi', 'Rose Mochi Bouquet', 'rare', '🌹', 16, 3.4, 'Twelve mochi roses. Smells like a candle aisle. Outsold real roses.'),
  dh('squishyhearts', 'vd_lovekube', 'Love Letter Kube', 'ultra', '💌', 9, 8.5, 'Has a tiny note inside. Every note says "restock soon".'),
  sq('squishyhearts', 'vd_goldheart', 'Gold Heart Nana', 'select', '💛', 40, 14.0, 'Gold foil. Numbered to 2,000. "Sold out" was the marketing plan.'),
  // Dohlloween
  dh('dohlloween', 'hw_pumpkube', 'Pumpkin Kube', 'common', '🎃', 6, 1.6, 'Orange, ribbed, slightly sticky. Like the real thing, but it bounces.'),
  sq('dohlloween', 'hw_mummynana', 'Mummy-Wrapped Nana', 'common', '🧻', 13, 1.5, 'A banana in bandages. The bandages are the product.'),
  dh('dohlloween', 'hw_batglob', 'Bat Glob', 'uncommon', '🦇', 7, 2.8, 'Wings stretch. Wings tear. Wings are the whole listing photo.'),
  sq('dohlloween', 'hw_cauldron', 'Cauldron Mochi Set', 'rare', '🫕', 16, 3.4, 'Six mochi in a cauldron. The cauldron is worth more than the mochi.'),
  dh('dohlloween', 'hw_ghostglow', 'Full-Glow Phantom', 'ultra', '👻', 9, 8.5, 'Glows everywhere, finally. Blinds you at 3am when you check your listings.'),
  sq('dohlloween', 'hw_witchnana', 'Witch Hat Nana', 'select', '🧙', 40, 14.0, 'Hat is removable. Hat gets lost. Hatless ones sell for half.'),
];

export const SEASON_ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(SEASON_ITEMS.map((i) => [i.id, i]));

export function itemsForSeason(seasonId: string): ItemDef[] {
  return SEASON_ITEMS.filter((i) => i.season === seasonId);
}

/** Season missions reward tokens instead of Clout. Three are rolled per day while a season is on. */
export const SEASON_MISSION_POOL: MissionDef[] = [
  { id: 's_tap100', name: 'Holiday Rush', blurb: 'Tap the shelf 100 times.', target: 100, counter: 'taps', rewardClout: 0, rewardPassXp: 40, rewardTokens: 10 },
  { id: 's_sales200', name: 'Gift Season', blurb: 'Complete 200 flips.', target: 200, counter: 'sales', rewardClout: 0, rewardPassXp: 60, rewardTokens: 12 },
  { id: 's_deals3', name: 'Secret Santa', blurb: 'Accept 3 offers in the Deals feed.', target: 3, counter: 'deals', rewardClout: 0, rewardPassXp: 60, rewardTokens: 12 },
  { id: 's_pull5', name: 'Stocking Stuffers', blurb: 'Open 5 mystery pulls.', target: 5, counter: 'pulls', rewardClout: 0, rewardPassXp: 60, rewardTokens: 15 },
  { id: 's_restock1', name: 'Door Buster', blurb: 'Complete a restock run.', target: 1, counter: 'restocks', rewardClout: 0, rewardPassXp: 60, rewardTokens: 15 },
  { id: 's_restock2', name: 'Two Trucks', blurb: 'Complete 2 restock runs.', target: 2, counter: 'restocks', rewardClout: 0, rewardPassXp: 100, rewardTokens: 25 },
  { id: 's_units20', name: 'Stock the Sleigh', blurb: 'Add 20 runs.', target: 20, counter: 'unitsBought', rewardClout: 0, rewardPassXp: 60, rewardTokens: 12 },
  { id: 's_ads1', name: 'Sponsored Cheer', blurb: 'Watch 1 boost video.', target: 1, counter: 'adsWatched', rewardClout: 0, rewardPassXp: 40, rewardTokens: 10 },
];
export const SEASON_MISSION_BY_ID: Record<string, MissionDef> = Object.fromEntries(SEASON_MISSION_POOL.map((m) => [m.id, m]));

let override: string | null = null;
/** Force a season on (dev/testing: `?season=dohlidays` or VITE_FORCE_SEASON). `'none'` forces off. */
export function setSeasonOverride(id: string | null): void {
  override = id && id !== '' ? id : null;
}

/** Day-of-year style comparison on UTC month/day so seasons recur yearly and may wrap December into January. */
function inWindow(now: number, start: [number, number], end: [number, number]): boolean {
  const d = new Date(now);
  const md = (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  const a = start[0] * 100 + start[1];
  const b = end[0] * 100 + end[1];
  return a <= b ? md >= a && md <= b : md >= a || md <= b;
}

export function activeSeason(now: number): SeasonDef | null {
  if (override === 'none') return null;
  if (override) return SEASON_BY_ID[override] ?? null;
  return SEASONS.find((x) => inWindow(now, x.start, x.end)) ?? null;
}

/** Epoch ms when the season's last day ends (UTC midnight after `end`), from `now`. */
export function seasonEndsAt(season: SeasonDef, now: number): number {
  const year = new Date(now).getUTCFullYear();
  const end = Date.UTC(year, season.end[0] - 1, season.end[1] + 1);
  // A wrapped season seen from its first half (or forced on early) ends next year.
  return end > now ? end : Date.UTC(year + 1, season.end[0] - 1, season.end[1] + 1);
}

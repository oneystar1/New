// Core data types for the Scalp Street engine. The engine is pure TypeScript
// with no React or DOM dependencies so it can be unit tested, simulated for
// balance, and reused unchanged inside a Capacitor iOS shell.

export type ItemFamily = 'squish' | 'doh';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'ultra' | 'select' | 'grail';

export interface ItemDef {
  id: string;
  name: string;
  family: ItemFamily;
  rarity: Rarity;
  /** Flavor: who or what it is. */
  blurb: string;
  /** Emoji used as the sprite placeholder until art lands. */
  icon: string;
  /** Retail price in dollars (what you pay at the shelf). */
  retail: number;
  /** Baseline resale multiplier over retail before hype/market modifiers. */
  resaleMult: number;
  /** Which store line it drops from. */
  storeId: string;
}

export interface StoreDef {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  /** Family of items this store mostly drops. */
  family: ItemFamily | 'mixed';
  /** Cost of the first unit (one "run" / camper / cart). */
  baseCost: number;
  /** Cost multiplier per unit owned. */
  costGrowth: number;
  /** Base profit per cycle per unit, in dollars. */
  baseProfit: number;
  /** Seconds per cycle before any speed modifiers. */
  cycleSeconds: number;
  /** Units required to unlock this store (sum of all stores' owned counts). */
  unlockAtTotalUnits: number;
  /** Rarity weights for pulls from this store. */
  pullWeights: Partial<Record<Rarity, number>>;
}

export interface ManagerDef {
  id: string;
  storeId: string;
  name: string;
  blurb: string;
  icon: string;
  cost: number;
}

export type UpgradeEffect =
  | { kind: 'storeProfit'; storeId: string; mult: number }
  | { kind: 'storeSpeed'; storeId: string; mult: number }
  | { kind: 'globalProfit'; mult: number }
  | { kind: 'globalSpeed'; mult: number }
  | { kind: 'tapPower'; mult: number }
  | { kind: 'offlineCapHours'; add: number }
  | { kind: 'offlineRate'; add: number }
  | { kind: 'pullLuck'; add: number }
  | { kind: 'hypeDecay'; mult: number }
  | { kind: 'familyProfit'; family: ItemFamily; mult: number }
  | { kind: 'offerRate'; mult: number }
  | { kind: 'offerValue'; mult: number }
  | { kind: 'scamRadar' }
  | { kind: 'scamShield' }
  | { kind: 'fakeShield' }
  | { kind: 'heatDecay'; mult: number }
  | { kind: 'linePosition'; add: number }
  | { kind: 'carry'; add: number };

export type Currency = 'cash' | 'clout' | 'cred';

export interface UpgradeDef {
  id: string;
  name: string;
  blurb: string;
  icon: string;
  cost: number;
  currency: Currency;
  effect: UpgradeEffect;
  /** Optional requirement: store must have at least this many units. */
  requires?: { storeId: string; units: number };
  /** Optional requirement: minimum prestige count. */
  minPrestige?: number;
  /** Upgrades with a tier group are shown in order; only the next one is purchasable. */
  tier?: number;
  /** Heat added when bought (sketchy tactics). */
  heat?: number;
  /** Grouping for the Hustle tab. */
  group?: 'gear' | 'sketchy' | 'channel';
}

export type OfferKind = 'fair' | 'lowball' | 'scam' | 'ghost' | 'trade' | 'karen' | 'sneakerbro';

export interface Offer {
  id: number;
  kind: OfferKind;
  buyer: string;
  avatar: string;
  itemId: string;
  message: string;
  /** Cash offered (0 for karen/trade). */
  amount: number;
  /** Whether the UI should show the scam flag (Scam Radar owned). */
  flagged: boolean;
  expiresAt: number;
}

export type RivalKind = 'mom' | 'kid' | 'reseller' | 'grandpa' | 'employee' | 'sneakerbro';

export interface Rival {
  kind: RivalKind;
  name: string;
  icon: string;
  takes: number;
}

export interface RestockRun {
  storeId: string;
  phase: 'line' | 'doors' | 'done';
  stock: number;
  remaining: number;
  rivals: Rival[];
  grabbed: number;
  grabProgress: number;
  timeLeft: number;
  encounter: string | null;
  nextEncounterIn: number;
  limit: number | null;
  heat: number;
  banned: boolean;
  kidsSpared: number;
  kidsSnatched: number;
  momsArgued: number;
  brosRaced: number;
  log: string[];
  carry: number;
}

export type Pricing = 'retail' | 'fair' | 'scalper' | 'insane';

export interface PullResult {
  item: ItemDef;
  fake: boolean;
}

export interface AchievementDef {
  id: string;
  name: string;
  blurb: string;
  icon: string;
  /** Reward in Clout (premium currency). */
  clout: number;
  check: (s: GameState) => boolean;
}

export type MarketEventKind = 'drop' | 'restock' | 'viral' | 'crackdown' | 'holiday';

export interface MarketEventDef {
  kind: MarketEventKind;
  name: string;
  blurb: string;
  icon: string;
  durationSeconds: number;
  /** Multiplier applied to all profit while active. */
  profitMult: number;
  /** Multiplier applied to cycle speed while active (>1 = faster). */
  speedMult: number;
  /** Which family it affects, or both. */
  family: ItemFamily | 'both';
}

export interface ActiveEvent {
  kind: MarketEventKind;
  endsAt: number; // epoch ms
}

export interface ActiveBoost {
  id: string;
  label: string;
  mult: number;
  endsAt: number;
}

export interface StoreState {
  units: number;
  /** Cycle progress 0..1 (only meaningful when units > 0). */
  progress: number;
  manager: boolean;
}

export interface MissionDef {
  id: string;
  name: string;
  blurb: string;
  /** Target measured against the mission's counter. */
  target: number;
  counter: 'taps' | 'cashEarned' | 'unitsBought' | 'pulls' | 'adsWatched' | 'sales' | 'deals' | 'restocks';
  rewardClout: number;
  rewardPassXp: number;
}

export interface MissionState {
  id: string;
  progress: number;
  claimed: boolean;
}

export interface PassTier {
  tier: number;
  xp: number;
  free?: Reward;
  premium?: Reward;
}

export type Reward =
  | { kind: 'cash'; minutesOfIncome: number }
  | { kind: 'clout'; amount: number }
  | { kind: 'boost'; mult: number; minutes: number }
  | { kind: 'item'; itemId: string }
  | { kind: 'pulls'; amount: number };

export interface PassState {
  season: number;
  xp: number;
  premium: boolean;
  claimedFree: number[];
  claimedPremium: number[];
}

export interface IapState {
  noAds: boolean;
  vipUntil: number; // epoch ms; 0 = none
  /** Ad-free window from the starter pack (no VIP perks). */
  adFreeUntil: number;
  starterPackBought: boolean;
  /** Receipt-ish log, product id -> count, for restore & analytics. */
  purchases: Record<string, number>;
}

export interface Stats {
  totalCashEarned: number;
  lifetimeCashEarned: number;
  taps: number;
  pulls: number;
  unitsBought: number;
  sales: number;
  adsWatched: number;
  prestiges: number;
  playSeconds: number;
  bestCash: number;
  offersAccepted: number;
  offersDeclined: number;
  lowballsAccepted: number;
  scamsDodged: number;
  scamsFell: number;
  ghosted: number;
  karensBlocked: number;
  fakesTossed: number;
  fakesFlipped: number;
  calledOut: number;
  tradesDone: number;
  broDeals: number;
  broBackouts: number;
  broRaces: number;
  restocks: number;
  restockUnits: number;
  bestRestock: number;
  kidsSpared: number;
  kidsSnatched: number;
  momsArgued: number;
  bans: number;
}

export interface GameState {
  version: number;
  createdAt: number;
  lastSeen: number;
  /** Soft currency, dollars. */
  cash: number;
  /** Premium currency. */
  clout: number;
  /** Prestige currency ("Street Cred"). Each point = +2% global profit. */
  cred: number;
  stores: Record<string, StoreState>;
  upgrades: string[];
  /** Item id -> count owned on the shelf (collection). */
  shelf: Record<string, number>;
  /** Market hype per family: 1 = neutral. Drifts over time with events. */
  hype: Record<ItemFamily, number>;
  event: ActiveEvent | null;
  nextEventAt: number;
  boosts: ActiveBoost[];
  achievements: string[];
  missions: MissionState[];
  missionsDate: string; // YYYY-MM-DD the missions were rolled for
  dailyStreak: number;
  lastDailyClaim: string; // YYYY-MM-DD
  pass: PassState;
  iap: IapState;
  piggy: number; // cash accumulated in the piggy bank
  pendingOffline: { cash: number; seconds: number } | null;
  adCooldowns: Record<string, number>; // placement -> epoch ms when available again
  adsToday: { date: string; count: number };
  interstitialSeenAt: number;
  /** Community heat 0..100. At 100 you get Called Out. */
  heat: number;
  offers: Offer[];
  nextOfferAt: number;
  /** Counterfeits pulled but not yet tossed or flipped. */
  fakes: string[];
  /** How hard you scalp on the Facebook listings. Shifts the Deals feed. */
  pricing: Pricing;
  /** Current city (Relocate destination) and the two offered for the next move. */
  city: string;
  cityOffer: [string, string] | null;
  tutorialDone: string[];
  rankRewarded: string[];
  restockReadyAt: Record<string, number>;
  bannedUntil: Record<string, number>;
  stats: Stats;
  settings: { sfx: boolean; haptics: boolean; notation: 'short' | 'scientific' };
}

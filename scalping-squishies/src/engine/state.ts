import type { GameState } from './types';
import { STORES } from './data/stores';
import { todayKey } from './math';

export const SAVE_VERSION = 1;
// Save key kept from the working title so existing players keep their progress.
export const SAVE_KEY = 'scalp-street-save-v1';

export function initialState(now = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastSeen: now,
    cash: 10,
    clout: 0,
    cred: 0,
    stores: Object.fromEntries(STORES.map((s) => [s.id, { units: 0, progress: 0, manager: false }])),
    upgrades: [],
    shelf: {},
    hype: { squish: 1, doh: 1 },
    event: null,
    nextEventAt: now + 5 * 60_000,
    boosts: [],
    achievements: [],
    missions: [],
    missionsDate: '',
    dailyStreak: 0,
    lastDailyClaim: '',
    pass: { season: 1, xp: 0, premium: false, claimedFree: [], claimedPremium: [] },
    iap: { noAds: false, vipUntil: 0, adFreeUntil: 0, starterPackBought: false, purchases: {} },
    piggy: 0,
    pendingOffline: null,
    adCooldowns: {},
    adsToday: { date: todayKey(now), count: 0 },
    interstitialSeenAt: 0,
    heat: 0,
    offers: [],
    nextOfferAt: now + 20_000,
    fakes: [],
    pricing: 'fair',
    city: 'dayton',
    cityOffer: null,
    tutorialDone: [],
    tutorialPaid: [],
    tutorialChoice: 'pending',
    rankRewarded: [],
    conWeek: { week: '', units: 0 },
    handle: '',
    restockReadyAt: {},
    bannedUntil: {},
    restockIntel: {},
    stats: {
      totalCashEarned: 0,
      lifetimeCashEarned: 0,
      taps: 0,
      pulls: 0,
      unitsBought: 0,
      sales: 0,
      adsWatched: 0,
      prestiges: 0,
      playSeconds: 0,
      bestCash: 0,
      offersAccepted: 0,
      offersDeclined: 0,
      lowballsAccepted: 0,
      scamsDodged: 0,
      scamsFell: 0,
      ghosted: 0,
      karensBlocked: 0,
      fakesTossed: 0,
      fakesFlipped: 0,
      calledOut: 0,
      tradesDone: 0,
      broDeals: 0,
      broBackouts: 0,
      broRaces: 0,
      restocks: 0,
      camps: 0,
      coffeeRounds: 0,
      ticketsGrabbed: 0,
      spotsSold: 0,
      restockUnits: 0,
      bestRestock: 0,
      kidsSpared: 0,
      kidsSnatched: 0,
      momsArgued: 0,
      bans: 0,
    },
    settings: { sfx: true, haptics: true, notation: 'short' },
  };
}

/** Bring an older save forward. Each version step is explicit so saves from
 *  the App Store build and the web build stay interchangeable. */
export function migrate(raw: unknown, now = Date.now()): GameState {
  const fresh = initialState(now);
  if (!raw || typeof raw !== 'object') return fresh;
  const s = raw as Partial<GameState>;
  // Shallow merge over defaults so new fields always exist.
  const merged: GameState = {
    ...fresh,
    ...s,
    stores: { ...fresh.stores, ...(s.stores ?? {}) },
    hype: { ...fresh.hype, ...(s.hype ?? {}) },
    pass: { ...fresh.pass, ...(s.pass ?? {}) },
    iap: { ...fresh.iap, ...(s.iap ?? {}) },
    stats: { ...fresh.stats, ...(s.stats ?? {}) },
    settings: { ...fresh.settings, ...(s.settings ?? {}) },
    adsToday: s.adsToday ?? fresh.adsToday,
    offers: Array.isArray(s.offers) ? s.offers.filter((o) => typeof o.qty === 'number') : [],
    fakes: Array.isArray(s.fakes) ? s.fakes : [],
    restockReadyAt: s.restockReadyAt ?? {},
    tutorialDone: Array.isArray(s.tutorialDone) ? s.tutorialDone : [],
    tutorialPaid: Array.isArray(s.tutorialPaid) ? s.tutorialPaid : (Array.isArray(s.tutorialDone) ? s.tutorialDone : []),
    // Existing players who never saw the choice: do not interrupt them.
    tutorialChoice: s.tutorialChoice ?? ((s.stats?.taps ?? 0) > 0 ? 'off' : 'pending'),
    rankRewarded: Array.isArray(s.rankRewarded) ? s.rankRewarded : [],
    city: typeof s.city === 'string' ? s.city : 'dayton',
    conWeek: s.conWeek ?? fresh.conWeek,
    handle: typeof s.handle === 'string' ? s.handle : '',
    bannedUntil: s.bannedUntil ?? {},
    restockIntel: s.restockIntel ?? {},
    version: SAVE_VERSION,
  };
  for (const st of STORES) if (!merged.stores[st.id]) merged.stores[st.id] = { units: 0, progress: 0, manager: false };
  return merged;
}

export function serialize(s: GameState): string {
  return JSON.stringify(s);
}

export function deserialize(json: string, now = Date.now()): GameState {
  try {
    return migrate(JSON.parse(json), now);
  } catch {
    return initialState(now);
  }
}

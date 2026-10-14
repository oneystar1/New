import type { GameState, Offer, OfferKind, ItemDef, Pricing, PullView } from './types';
import { ITEMS, ITEM_BY_ID } from './data/items';
import { BUYER_NAMES, OFFER_TEMPLATES } from './data/offers';
import { computeModifiers, incomePerSecond, earn, bumpMission, pullItem, highestUnlockedStore, type Modifiers } from './sim';
import { formatCash, weightedPick } from './math';

// The Deals feed: a Facebook-Marketplace-style stream of buyers for the
// items on your shelf. Offers are sized in seconds of current income so
// they stay relevant at every stage of the game.

export const MAX_OFFERS = 3;
export const OFFER_INTERVAL_SECONDS = 30;
export const OFFER_TTL_SECONDS = 180;

const KIND_WEIGHTS: Record<OfferKind, number> = { fair: 28, lowball: 26, ghost: 14, scam: 11, karen: 8, trade: 5, sneakerbro: 8 };

/** The Facebook pricing dial: how hard you scalp. */
/** Your listing price as a multiple of retail, for message text. */
export const ASK_MULT: Record<Pricing, number> = { retail: 1, fair: 1.5, scalper: 2, insane: 10 };

export const PRICING: Record<Pricing, { label: string; blurb: string; value: number; weights: Partial<Record<OfferKind, number>> }> = {
  retail: { label: 'Retail', blurb: 'Group-approved. Fair buyers only, no Karens, offers worth 60%.', value: 0.6, weights: { fair: 60, lowball: 10, ghost: 10, scam: 6, karen: 0, trade: 8, sneakerbro: 2 } },
  fair: { label: 'Fair', blurb: 'A little over retail. The normal feed.', value: 1, weights: KIND_WEIGHTS },
  scalper: { label: 'Scalper', blurb: 'Double retail. Offers worth 160%. More lowballs, twice the Karens, sneaker bros show up.', value: 1.6, weights: { fair: 20, lowball: 32, ghost: 16, scam: 12, karen: 16, trade: 4, sneakerbro: 14 } },
  insane: { label: 'Insane', blurb: '10x retail "firm". Offers worth 280%. Ghosts, Karens, sneaker bros, slow heat gain.', value: 2.8, weights: { fair: 8, lowball: 26, ghost: 24, scam: 10, karen: 28, trade: 2, sneakerbro: 16 } },
};

/** Seconds of income an offer is worth, by kind. */
const KIND_SECONDS: Record<OfferKind, [number, number]> = {
  fair: [12, 24],
  lowball: [3, 6],
  scam: [50, 100],
  ghost: [12, 24],
  trade: [0, 0],
  karen: [0, 0],
  sneakerbro: [20, 40],
};

const AVATARS = ['🧔', '👩', '🧑', '👨‍🦳', '👩‍🦰', '🧒', '👵', '🕶️', '🐶', '🌸', '🤖', '🧢'];

let offerSeq = 1;

export function listedItemFor(s: GameState, rand: () => number): ItemDef {
  const owned = ITEMS.filter((i) => (s.shelf[i.id] ?? 0) > 0);
  const pool = owned.length ? owned : ITEMS.filter((i) => i.rarity === 'common');
  return pool[Math.floor(rand() * pool.length)];
}

export function makeOffer(s: GameState, m: Modifiers, now: number, rand: () => number): Offer {
  const pricing = PRICING[s.pricing ?? 'fair'];
  let kind = weightedPick(pricing.weights, rand);
  if (kind === 'scam' && m.scamShield) kind = 'fair';
  const item = listedItemFor(s, rand);
  const ips = Math.max(1, incomePerSecond(s, m, true));
  const [lo, hi] = KIND_SECONDS[kind];
  const secs = lo + rand() * (hi - lo);
  const ask = item.retail * ASK_MULT[s.pricing ?? 'fair'];
  // The payout is sized to income; the fiction carries the scale through
  // quantity. Unit prices stay believable next to retail and your ask:
  // lowballers under retail, fair buyers around the ask, bros above it,
  // scammers absurdly above it (that is the tell).
  const target = kind === 'karen' || kind === 'trade' ? 0 : Math.max(item.retail * 0.5, ips * secs * m.offerValue * pricing.value * s.hype[item.family]);
  const unitMult = kind === 'lowball' ? 0.55 + rand() * 0.35 : kind === 'sneakerbro' ? 1.2 + rand() * 0.5 : kind === 'scam' ? 3 + rand() * 3 : 0.9 + rand() * 0.25;
  const unitRaw = kind === 'lowball' ? item.retail * unitMult : ask * unitMult;
  const unit = target > 0 ? Math.max(0.25, Math.round(unitRaw * 4) / 4) : 0;
  const qty = target > 0 ? Math.max(1, Math.round(target / unit)) : 0;
  const amount = qty * unit;
  const tpl = OFFER_TEMPLATES[kind];
  const message = tpl[Math.floor(rand() * tpl.length)]
    .replace(/\{item\}/g, item.name)
    .replace(/\{price\}/g, formatCash(amount))
    .replace(/\{unit\}/g, formatCash(unit))
    .replace(/\{qty\}/g, qty.toLocaleString())
    .replace(/\{ask\}/g, formatCash(ask))
    .replace(/\{retail\}/g, formatCash(item.retail));
  const BROS = ['Hype Hank', 'DeadstockDrew', 'SZ10_Civic', 'kicks2kubes', 'Bro (matching hoodie)'];
  const buyer = kind === 'karen' && rand() < 0.5 ? 'Karen_From_PTA' : kind === 'sneakerbro' ? BROS[Math.floor(rand() * BROS.length)] : BUYER_NAMES[Math.floor(rand() * BUYER_NAMES.length)];
  return {
    id: offerSeq++,
    kind,
    buyer,
    avatar: AVATARS[Math.floor(rand() * AVATARS.length)],
    itemId: item.id,
    message,
    amount,
    qty,
    unit,
    flagged: kind === 'scam' && m.scamRadar,
    expiresAt: now + OFFER_TTL_SECONDS * 1000,
  };
}

/** Called from tick: expire old offers, spawn new ones while the player is active. */
export function tickOffers(s: GameState, m: Modifiers, now: number, rand: () => number): Offer | null {
  const before = s.offers.length;
  s.offers = s.offers.filter((o) => o.expiresAt > now);
  if (s.offers.length < before) s.stats.offersDeclined += before - s.offers.length;
  if (s.offers.length >= MAX_OFFERS) return null;
  if (now < s.nextOfferAt) return null;
  const o = makeOffer(s, m, now, rand);
  s.offers.push(o);
  s.nextOfferAt = now + (OFFER_INTERVAL_SECONDS / m.offerRate) * (0.7 + rand() * 0.6) * 1000;
  return o;
}

export interface DealOutcome {
  text: string;
  icon: string;
  kind: 'good' | 'bad' | 'info' | 'rare';
  item?: PullView;
}

function remove(s: GameState, id: number): Offer | null {
  const o = s.offers.find((x) => x.id === id) ?? null;
  s.offers = s.offers.filter((x) => x.id !== id);
  return o;
}

export function acceptOffer(s: GameState, id: number, now: number, rand: () => number): DealOutcome | null {
  const o = remove(s, id);
  if (!o) return null;
  const m = computeModifiers(s, now);
  switch (o.kind) {
    case 'fair':
    case 'lowball': {
      earn(s, o.amount);
      s.stats.offersAccepted += 1;
      if (o.kind === 'lowball') s.stats.lowballsAccepted += 1;
      bumpMission(s, 'deals', 1);
      return { text: `${o.buyer} paid ${formatCash(o.amount)}. Met at the police station lot like adults.`, icon: '🤝', kind: 'good' };
    }
    case 'ghost': {
      if (rand() < 0.7) {
        s.stats.ghosted += 1;
        return { text: `${o.buyer} said "omw" and never showed. Listing bumped.`, icon: '👻', kind: 'bad' };
      }
      earn(s, o.amount);
      s.stats.offersAccepted += 1;
      bumpMission(s, 'deals', 1);
      return { text: `${o.buyer} actually showed up! ${formatCash(o.amount)} in hand.`, icon: '🤝', kind: 'good' };
    }
    case 'scam': {
      if (m.scamShield) {
        s.stats.scamsDodged += 1;
        return { text: 'Goods & Services only. The "courier" never materialized. No loss.', icon: '🛡️', kind: 'info' };
      }
      const loss = Math.min(s.cash, o.amount);
      s.cash -= loss;
      s.stats.scamsFell += 1;
      return { text: `Chargeback. The "invoice" was fake. Lost ${formatCash(loss)} and the ${ITEM_BY_ID[o.itemId].name}.`, icon: '💸', kind: 'bad' };
    }
    case 'trade': {
      const got = pullItem(s, highestUnlockedStore(s), m.pullLuck + 0.2, rand);
      s.stats.tradesDone += 1;
      s.stats.offersAccepted += 1;
      bumpMission(s, 'deals', 1);
      return { text: `Traded for a ${got.variant !== 'standard' ? got.variant + ' ' : ''}${got.item.name}.`, icon: '🔄', kind: got.item.rarity === 'common' ? 'info' : 'rare', item: got };
    }
    case 'sneakerbro': {
      // Pays hype prices, but backs out when the chart dips.
      if (rand() < 0.6) {
        earn(s, o.amount);
        s.stats.offersAccepted += 1;
        s.stats.broDeals += 1;
        bumpMission(s, 'deals', 1);
        return { text: `${o.buyer} paid ${formatCash(o.amount)} in a Civic with the bass up. "W cop."`, icon: '👟', kind: 'good' };
      }
      s.stats.broBackouts += 1;
      s.stats.ghosted += 1;
      return { text: `${o.buyer}: "nah the chart dipped 4%, I'm out bro". Left on read.`, icon: '📉', kind: 'bad' };
    }
    case 'karen': {
      // "Clap back": feels great, costs heat.
      s.heat = Math.min(100, s.heat + 6);
      s.pass.xp += 10;
      return { text: 'You clapped back in the comments. +10 pass XP, +6 heat. Screenshots incoming.', icon: '🔥', kind: 'info' };
    }
  }
}

export function counterOffer(s: GameState, id: number, now: number, rand: () => number): DealOutcome | null {
  const o = s.offers.find((x) => x.id === id);
  if (!o) return null;
  if (o.kind === 'karen' || o.kind === 'trade') return acceptOffer(s, id, now, rand);
  remove(s, id);
  if (o.kind === 'sneakerbro') {
    // Haggling is his native language.
    if (rand() < 0.6) {
      const v = o.amount * 1.2;
      earn(s, v);
      s.stats.offersAccepted += 1;
      s.stats.broDeals += 1;
      bumpMission(s, 'deals', 1);
      return { text: `${o.buyer}: "respect the hustle". Paid ${formatCash(v)}.`, icon: '👟', kind: 'good' };
    }
    s.stats.broBackouts += 1;
    return { text: `${o.buyer}: "that's not the StockyX price bro". Gone.`, icon: '📉', kind: 'bad' };
  }
  if (o.kind === 'scam') {
    s.stats.scamsDodged += 1;
    return { text: 'You asked for Goods & Services. They vanished. Classic.', icon: '🚩', kind: 'info' };
  }
  const countered = o.amount * (o.kind === 'lowball' ? 2.2 : 1.35);
  if (rand() < 0.5) {
    earn(s, countered);
    s.stats.offersAccepted += 1;
    bumpMission(s, 'deals', 1);
    return { text: `${o.buyer} took your counter: ${formatCash(countered)}.`, icon: '💰', kind: 'good' };
  }
  s.stats.ghosted += 1;
  return { text: `${o.buyer} left you on read after the counter.`, icon: '👻', kind: 'bad' };
}

export function declineOffer(s: GameState, id: number): DealOutcome | null {
  const o = remove(s, id);
  if (!o) return null;
  s.stats.offersDeclined += 1;
  if (o.kind === 'scam') { s.stats.scamsDodged += 1; return { text: 'Blocked and reported. Stay safe out there.', icon: '🚩', kind: 'info' }; }
  if (o.kind === 'karen') { s.stats.karensBlocked += 1; return { text: 'Blocked. She will make a new account.', icon: '🚫', kind: 'info' }; }
  return { text: 'Declined. The listing stays up.', icon: '🙅', kind: 'info' };
}

// ---- Heat ----

export const HEAT_DECAY_PER_SECOND = 0.02;
export const CALLED_OUT_SECONDS = 180;
export const CALLED_OUT_MULT = 0.4;
export const APOLOGY_CLOUT = 30;

/** Returns true when the community just Called You Out. */
export function tickHeat(s: GameState, m: Modifiers, dt: number, now: number): boolean {
  // Passive heat from the bot farm; everything else is discrete.
  const bots = s.stores.botfarm?.units ?? 0;
  s.heat += bots * 0.0001 * dt;
  s.heat -= HEAT_DECAY_PER_SECOND * m.heatDecay * dt;
  s.heat = Math.max(0, Math.min(100, s.heat));
  if (s.heat >= 100 && !s.boosts.some((b) => b.id === 'called_out')) {
    s.boosts.push({ id: 'called_out', label: '📸 Called Out', mult: CALLED_OUT_MULT, endsAt: now + CALLED_OUT_SECONDS * 1000 });
    s.heat = 45;
    s.stats.calledOut += 1;
    return true;
  }
  return false;
}

export function apologize(s: GameState): boolean {
  if (s.clout < APOLOGY_CLOUT) return false;
  s.clout -= APOLOGY_CLOUT;
  s.heat = 0;
  s.boosts = s.boosts.filter((b) => b.id !== 'called_out');
  return true;
}

// ---- Counterfeits ----

export const FAKE_CHANCE: Record<string, number> = { wallymart: 0.06, botfarm: 0.12, con: 0.08, factory: 0.05, claw: 0.05 };

export function fakeRoll(storeId: string, m: Modifiers, rand: () => number): boolean {
  if (m.fakeShield) return false;
  return rand() < (FAKE_CHANCE[storeId] ?? 0.02);
}

export function tossFake(s: GameState, idx: number): void {
  if (idx < 0 || idx >= s.fakes.length) return;
  s.fakes.splice(idx, 1);
  s.stats.fakesTossed += 1;
}

export function flipFake(s: GameState, idx: number, now: number): number {
  if (idx < 0 || idx >= s.fakes.length) return 0;
  const id = s.fakes.splice(idx, 1)[0];
  const it = ITEM_BY_ID[id];
  const m = computeModifiers(s, now);
  const ips = Math.max(1, incomePerSecond(s, m, true));
  const v = Math.max(it.retail, ips * 20);
  earn(s, v);
  s.heat = Math.min(100, s.heat + 8);
  s.stats.fakesFlipped += 1;
  return v;
}

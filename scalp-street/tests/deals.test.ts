import { describe, it, expect } from 'vitest';
import { initialState } from '../src/engine/state';
import { computeModifiers, tick, prestige } from '../src/engine/sim';
import {
  makeOffer, tickOffers, acceptOffer, counterOffer, declineOffer, tickHeat, apologize, fakeRoll, tossFake, flipFake,
  MAX_OFFERS, CALLED_OUT_MULT, APOLOGY_CLOUT,
} from '../src/engine/deals';
import { makeRng } from '../src/engine/math';
import type { OfferKind } from '../src/engine/types';

const T0 = 1_700_000_000_000;

function rich() {
  const s = initialState(T0);
  s.stores.dollar.units = 100;
  s.stores.dollar.manager = true;
  s.shelf.doh_kube = 2;
  return s;
}

function offerOfKind(kind: OfferKind, s = rich()) {
  const m = computeModifiers(s, T0);
  const rng = makeRng(5);
  for (let i = 0; i < 500; i++) {
    const o = makeOffer(s, m, T0, rng);
    if (o.kind === kind) { s.offers = [o]; return { s, o }; }
  }
  throw new Error('no offer of kind ' + kind);
}

describe('offer feed', () => {
  it('spawns offers on a timer up to the cap and expires them', () => {
    const s = rich();
    s.nextOfferAt = T0;
    const m = computeModifiers(s, T0);
    const rng = makeRng(1);
    expect(tickOffers(s, m, T0, rng)).not.toBeNull();
    expect(tickOffers(s, m, T0, rng)).toBeNull(); // nextOfferAt moved forward
    for (let i = 0; i < 10; i++) { s.nextOfferAt = T0; tickOffers(s, m, T0, rng); }
    expect(s.offers.length).toBe(MAX_OFFERS);
    s.nextOfferAt = Infinity;
    tickOffers(s, m, T0 + 10 * 60_000, rng);
    expect(s.offers.length).toBe(0);
  });
  it('offers mention a shelf item and scale with income', () => {
    const s = rich();
    const m = computeModifiers(s, T0);
    const o = makeOffer(s, m, T0, makeRng(2));
    expect(o.itemId).toBe('doh_kube');
    expect(o.message).toContain('Nice Kube');
  });
  it('fair and lowball offers pay, lowballs pay less', () => {
    const a = offerOfKind('fair');
    const fairAmt = a.o.amount;
    const r = acceptOffer(a.s, a.o.id, T0, makeRng(3));
    expect(r?.kind).toBe('good');
    expect(a.s.cash).toBeGreaterThan(10);
    expect(a.s.stats.offersAccepted).toBe(1);
    const b = offerOfKind('lowball');
    expect(b.o.amount).toBeLessThan(fairAmt);
    acceptOffer(b.s, b.o.id, T0, makeRng(3));
    expect(b.s.stats.lowballsAccepted).toBe(1);
  });
  it('scams cost cash unless Goods & Services is owned', () => {
    const a = offerOfKind('scam');
    a.s.cash = 1000;
    const r = acceptOffer(a.s, a.o.id, T0, makeRng(4));
    expect(r?.kind).toBe('bad');
    expect(a.s.cash).toBeLessThan(1000);
    expect(a.s.stats.scamsFell).toBe(1);
    const b = offerOfKind('scam');
    b.s.upgrades.push('ch_gands');
    b.s.cash = 1000;
    acceptOffer(b.s, b.o.id, T0, makeRng(4));
    expect(b.s.cash).toBe(1000);
    expect(b.s.stats.scamsDodged).toBe(1);
  });
  it('scam shield removes scam offers entirely and scam radar flags them', () => {
    const s = rich();
    s.upgrades.push('ch_gands');
    const m = computeModifiers(s, T0);
    const rng = makeRng(9);
    for (let i = 0; i < 300; i++) expect(makeOffer(s, m, T0, rng).kind).not.toBe('scam');
    const r = offerOfKind('scam');
    expect(r.o.flagged).toBe(false);
    const s2 = rich();
    s2.upgrades.push('ch_radar');
    expect(offerOfKind('scam', s2).o.flagged).toBe(true);
  });
  it('declining a karen blocks her, clapping back adds heat', () => {
    const a = offerOfKind('karen');
    declineOffer(a.s, a.o.id);
    expect(a.s.stats.karensBlocked).toBe(1);
    const b = offerOfKind('karen');
    acceptOffer(b.s, b.o.id, T0, makeRng(1));
    expect(b.s.heat).toBe(6);
  });
  it('trades give an item and counters either pay more or ghost', () => {
    const t = offerOfKind('trade');
    const r = acceptOffer(t.s, t.o.id, T0, makeRng(6));
    expect(r?.item).toBeDefined();
    expect(t.s.stats.tradesDone).toBe(1);
    let paid = 0, ghosted = 0;
    for (let i = 0; i < 40; i++) {
      const c = offerOfKind('lowball');
      const before = c.s.cash;
      counterOffer(c.s, c.o.id, T0, makeRng(100 + i));
      if (c.s.cash > before) { paid++; expect(c.s.cash - before).toBeCloseTo(c.o.amount * 2.2, 3); } else ghosted++;
    }
    expect(paid).toBeGreaterThan(5);
    expect(ghosted).toBeGreaterThan(5);
  });
  it('channel upgrades change rate and value', () => {
    const s = rich();
    s.upgrades.push('ch_fleabay', 'ch_mercarry');
    const m = computeModifiers(s, T0);
    expect(m.offerValue).toBeCloseTo(1.3, 6);
    expect(m.offerRate).toBeCloseTo(1.4, 6);
  });
});

describe('heat', () => {
  it('sketchy upgrades add heat, heat decays, 100 triggers Called Out', () => {
    const s = rich();
    s.heat = 99.99;
    const m = computeModifiers(s, T0);
    s.stores.botfarm.units = 100; // passive heat pushes it over
    expect(tickHeat(s, m, 1, T0)).toBe(true);
    expect(s.heat).toBe(45);
    expect(s.stats.calledOut).toBe(1);
    expect(computeModifiers(s, T0).boostMult).toBeCloseTo(CALLED_OUT_MULT, 6);
    expect(tickHeat(s, m, 60, T0 + 1000)).toBe(false);
    expect(s.heat).toBeLessThan(45 + 60 * 0.04);
    s.clout = APOLOGY_CLOUT;
    expect(apologize(s)).toBe(true);
    expect(s.heat).toBe(0);
    expect(computeModifiers(s, T0).boostMult).toBe(1);
  });
  it('heat decays faster with the PR template and resets on prestige', () => {
    const s = rich();
    s.heat = 50;
    s.upgrades.push('ch_pr');
    tickHeat(s, computeModifiers(s, T0), 100, T0);
    expect(s.heat).toBeCloseTo(50 - 100 * 0.04, 6);
    s.stats.totalCashEarned = 1e12;
    prestige(s, T0);
    expect(s.heat).toBe(0);
    expect(s.offers).toEqual([]);
  });
  it('tick integrates heat and the feed', () => {
    const s = rich();
    s.nextOfferAt = T0;
    const res = tick(s, 1, T0 + 1000, makeRng(2));
    expect(res.offerArrived).not.toBeNull();
    expect(s.offers.length).toBe(1);
  });
});

describe('counterfeits', () => {
  it('fake rolls respect the UV light and the pile can be tossed or flipped', () => {
    const s = rich();
    const m = computeModifiers(s, T0);
    let fakes = 0;
    const rng = makeRng(11);
    for (let i = 0; i < 1000; i++) if (fakeRoll('botfarm', m, rng)) fakes++;
    expect(fakes).toBeGreaterThan(60);
    expect(fakes).toBeLessThan(200);
    s.upgrades.push('ch_uv');
    const m2 = computeModifiers(s, T0);
    for (let i = 0; i < 200; i++) expect(fakeRoll('botfarm', m2, rng)).toBe(false);
    s.fakes = ['doh_kube', 'sq_nana'];
    tossFake(s, 0);
    expect(s.fakes).toEqual(['sq_nana']);
    const before = s.cash;
    expect(flipFake(s, 0, T0)).toBeGreaterThan(0);
    expect(s.cash).toBeGreaterThan(before);
    expect(s.heat).toBe(8);
    expect(s.fakes).toEqual([]);
  });
});

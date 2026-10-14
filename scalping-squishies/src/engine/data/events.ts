import type { MarketEventDef, MarketEventKind } from '../types';

// Market events fire every 6-12 minutes of active play and mirror the real
// resale cycle: drops spike, restocks crash, crackdowns slow everything.
export const EVENTS: Record<MarketEventKind, MarketEventDef> = {
  drop: {
    kind: 'drop',
    name: 'Drop Day',
    blurb: 'A new wave just hit shelves. Everything sells 3x for a few minutes.',
    icon: '🔥',
    durationSeconds: 120,
    profitMult: 3,
    speedMult: 1,
    family: 'both',
  },
  viral: {
    kind: 'viral',
    name: 'Viral Video',
    blurb: 'A teen squeezed a Nice Kube on camera for 40 seconds. Doh demand doubles.',
    icon: '📱',
    durationSeconds: 180,
    profitMult: 2,
    speedMult: 1.5,
    family: 'doh',
  },
  holiday: {
    kind: 'holiday',
    name: 'Dohlidays Drop',
    blurb: 'Seasonal jumbo bananas and glow squishies land. Squishy resale doubles and moves faster.',
    icon: '🎄',
    durationSeconds: 180,
    profitMult: 2,
    speedMult: 1.5,
    family: 'squish',
  },
  restock: {
    kind: 'restock',
    name: 'Restock Flood',
    blurb: 'The factory caught up. Prices crater. Hold your inventory.',
    icon: '🌊',
    durationSeconds: 90,
    profitMult: 0.5,
    speedMult: 1,
    family: 'both',
  },
  crackdown: {
    kind: 'crackdown',
    name: 'Limit Crackdown',
    blurb: '"Two per customer" signs everywhere. Cycles slow to a crawl.',
    icon: '🚫',
    durationSeconds: 90,
    profitMult: 1,
    speedMult: 0.5,
    family: 'both',
  },
};

export const EVENT_WEIGHTS: Record<MarketEventKind, number> = {
  drop: 30,
  viral: 20,
  holiday: 20,
  restock: 18,
  crackdown: 12,
};

import type { UpgradeEffect } from '../types';

export interface CityDef {
  id: string;
  name: string;
  blurb: string;
  icon: string;
  perk: string;
  effect: UpgradeEffect;
}

// Relocate = pick a new city. Each has a perk that shapes the next run.
export const CITIES: CityDef[] = [
  { id: 'dayton', name: 'Dayton, OH', icon: '🏭', blurb: 'Where it started. One Bullseye, one WallyMart, infinite moms.', perk: 'No perk. Humble beginnings.', effect: { kind: 'globalProfit', mult: 1 } },
  { id: 'fresno', name: 'Fresno, CA', icon: '🌞', blurb: 'Hot parking lots, early restocks, nobody asks questions.', perk: 'All stores 15% faster.', effect: { kind: 'globalSpeed', mult: 1.15 } },
  { id: 'tampa', name: 'Tampa, FL', icon: '🐊', blurb: 'Marketplace capital of the world. Everyone is selling something.', perk: 'Offers worth 25% more.', effect: { kind: 'offerValue', mult: 1.25 } },
  { id: 'vegas', name: 'Las Vegas, NV', icon: '🎰', blurb: 'The claw machines are rigged in your favor for once.', perk: 'Much better pull luck.', effect: { kind: 'pullLuck', add: 0.4 } },
  { id: 'scranton', name: 'Scranton, PA', icon: '📄', blurb: 'Quiet. Polite. The group chat is small and forgiving.', perk: 'Heat cools 2x faster.', effect: { kind: 'heatDecay', mult: 2 } },
  { id: 'austin', name: 'Austin, TX', icon: '🎸', blurb: 'Every restock is a festival. Lines are long but the trucks are full.', perk: 'Profit x1.3.', effect: { kind: 'globalProfit', mult: 1.3 } },
  { id: 'jersey', name: 'Jersey City, NJ', icon: '🗽', blurb: 'Across the river from the warehouses. Trucks "fall off" constantly.', perk: 'Offers arrive 30% more often.', effect: { kind: 'offerRate', mult: 1.3 } },
  { id: 'boise', name: 'Boise, ID', icon: '🥔', blurb: 'Nobody here has heard of a cook group. The shelves are full.', perk: 'Skip 3 people in every line.', effect: { kind: 'linePosition', add: 3 } },
  { id: 'phoenix', name: 'Phoenix, AZ', icon: '🌵', blurb: 'Minivans everywhere. Yours is bigger.', perk: 'Carry 4 more per restock.', effect: { kind: 'carry', add: 4 } },
  { id: 'orlando', name: 'Orlando, FL', icon: '🎢', blurb: 'Tourists buy anything at any price. Especially dough.', perk: 'Squishy and doh profit x1.25.', effect: { kind: 'globalProfit', mult: 1.25 } },
  { id: 'seattle', name: 'Seattle, WA', icon: '☕', blurb: 'The bot farm has fiber. The moms have umbrellas.', perk: 'Bot Farm 2x faster.', effect: { kind: 'storeSpeed', storeId: 'botfarm', mult: 2 } },
  { id: 'nola', name: 'New Orleans, LA', icon: '🎺', blurb: 'The convention never ends. Neither does the line.', perk: 'Convention Floor 2x faster.', effect: { kind: 'storeSpeed', storeId: 'con', mult: 2 } },
];

export const CITY_BY_ID: Record<string, CityDef> = Object.fromEntries(CITIES.map((c) => [c.id, c]));

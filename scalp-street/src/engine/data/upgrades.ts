import type { UpgradeDef } from '../types';
import { STORES } from './stores';

// Three cash upgrades per store (x3 profit each), plus global, premium
// (Clout) and prestige (Street Cred) upgrades. Cash upgrade prices scale
// from the store's base cost so they come online at a natural moment.
const storeUpgrades: UpgradeDef[] = STORES.flatMap((s, idx) => {
  const names = [
    ['Cart Alerts', 'Phone buzzes the second stock hits the website.', '📳'],
    ['Burner Accounts', 'Three emails, three carts, three limits.', '📧'],
    ['Discord Cook Group', 'Pay $40/mo to be told what you already knew.', '💬'],
  ];
  return names.map(([name, blurb, icon], tier) => ({
    id: `u_${s.id}_${tier}`,
    name: `${name}: ${s.name}`,
    blurb,
    icon,
    cost: s.baseCost * [400, 6_000, 120_000][tier] * (1 + idx * 0.3),
    currency: 'cash' as const,
    effect: { kind: 'storeProfit' as const, storeId: s.id, mult: 2 },
    requires: { storeId: s.id, units: [25, 100, 300][tier] },
    tier,
  }));
});

const globalCash: UpgradeDef[] = [
  { id: 'u_shipping', name: 'Poly Mailers in Bulk', blurb: 'Shipping supplies at cost. Every sale nets more.', icon: '📮', cost: 5_000, currency: 'cash', effect: { kind: 'globalProfit', mult: 1.5 } },
  { id: 'u_storage', name: 'Storage Unit', blurb: 'The garage is full. The spare room is full. Rent a unit.', icon: '🔐', cost: 250_000, currency: 'cash', effect: { kind: 'globalProfit', mult: 2 } },
  { id: 'u_label', name: 'Thermal Label Printer', blurb: 'No more handwriting addresses at midnight.', icon: '🖨️', cost: 3_000_000, currency: 'cash', effect: { kind: 'globalSpeed', mult: 1.25 } },
  { id: 'u_van', name: 'Cargo Van', blurb: 'Hit six stores before lunch.', icon: '🚐', cost: 60_000_000, currency: 'cash', effect: { kind: 'globalSpeed', mult: 1.5 } },
  { id: 'u_llc', name: 'Form an LLC', blurb: '"Oh I run a small business." Taxes get cheaper.', icon: '🏢', cost: 900_000_000, currency: 'cash', effect: { kind: 'globalProfit', mult: 3 } },
  { id: 'u_warehouse', name: 'Fulfillment Warehouse', blurb: 'Someone else packs boxes now. You "manage".', icon: '🏭', cost: 40_000_000_000, currency: 'cash', effect: { kind: 'globalProfit', mult: 5 } },
  { id: 'u_squishlove', name: 'Slow-Rise Sommelier', blurb: 'You can tell a true slow-rise from a fast-rise across the aisle.', icon: '🍌', cost: 20_000_000, currency: 'cash', effect: { kind: 'familyProfit', family: 'squish', mult: 2 } },
  { id: 'u_dohlove', name: 'Doh Dealer', blurb: 'Your name is known in every dough-cube Facebook group.', icon: '🧊', cost: 20_000_000, currency: 'cash', effect: { kind: 'familyProfit', family: 'doh', mult: 2 } },
  { id: 'u_tap1', name: 'Faster Thumbs', blurb: 'Tapping the shelf finds more loot.', icon: '👍', cost: 500, currency: 'cash', effect: { kind: 'tapPower', mult: 2 } },
  { id: 'u_tap2', name: 'Two-Hand Technique', blurb: 'Grab with both arms. Shelves fear you.', icon: '🙌', cost: 50_000, currency: 'cash', effect: { kind: 'tapPower', mult: 3 } },
  { id: 'u_tap3', name: 'Shopping Cart Sprint', blurb: 'Olympic-grade cart speed.', icon: '🏃', cost: 5_000_000, currency: 'cash', effect: { kind: 'tapPower', mult: 5 } },
];

// Premium (Clout) upgrades: permanent, account-wide, survive prestige.
const premium: UpgradeDef[] = [
  { id: 'p_offline1', name: 'Scheduled Listings I', blurb: 'Offline earnings cap: +4 hours.', icon: '⏰', cost: 60, currency: 'clout', effect: { kind: 'offlineCapHours', add: 4 } },
  { id: 'p_offline2', name: 'Scheduled Listings II', blurb: 'Offline earnings cap: +8 hours.', icon: '⏰', cost: 180, currency: 'clout', effect: { kind: 'offlineCapHours', add: 8 } },
  { id: 'p_offline3', name: 'Scheduled Listings III', blurb: 'Offline earnings cap: +12 hours.', icon: '⏰', cost: 450, currency: 'clout', effect: { kind: 'offlineCapHours', add: 12 } },
  { id: 'p_offrate', name: 'Auto-Relist', blurb: 'Offline earnings rate +25%.', icon: '🔁', cost: 120, currency: 'clout', effect: { kind: 'offlineRate', add: 0.25 } },
  { id: 'p_luck1', name: 'Lucky Keychain', blurb: 'Better odds on rare pulls.', icon: '🍀', cost: 90, currency: 'clout', effect: { kind: 'pullLuck', add: 0.15 } },
  { id: 'p_luck2', name: 'Tag Inspector', blurb: 'Even better odds on rare pulls.', icon: '🔍', cost: 300, currency: 'clout', effect: { kind: 'pullLuck', add: 0.3 } },
  { id: 'p_profit', name: 'Verified Seller Badge', blurb: 'Permanent +50% profit everywhere.', icon: '✅', cost: 250, currency: 'clout', effect: { kind: 'globalProfit', mult: 1.5 } },
  { id: 'p_speed', name: 'Priority Shipping Account', blurb: 'Permanent +25% cycle speed everywhere.', icon: '🚀', cost: 250, currency: 'clout', effect: { kind: 'globalSpeed', mult: 1.25 } },
];

// Prestige (Street Cred) upgrades: spend Cred for permanent boosts. Cred
// spent this way still counts toward the passive multiplier, so spending
// never feels like a loss.
const prestige: UpgradeDef[] = [
  { id: 'c_start', name: 'Seed Money', blurb: 'Start each new city with $10,000.', icon: '💵', cost: 5, currency: 'cred', effect: { kind: 'globalProfit', mult: 1.1 }, minPrestige: 1 },
  { id: 'c_hype', name: 'Hype Cycle Veteran', blurb: 'Hype crashes recover twice as fast.', icon: '📈', cost: 15, currency: 'cred', effect: { kind: 'hypeDecay', mult: 2 }, minPrestige: 1 },
  { id: 'c_profit1', name: 'Reputation I', blurb: 'All profit x2.', icon: '⭐', cost: 25, currency: 'cred', effect: { kind: 'globalProfit', mult: 2 }, minPrestige: 1 },
  { id: 'c_speed1', name: 'Route Memory', blurb: 'All stores 50% faster.', icon: '🗺️', cost: 50, currency: 'cred', effect: { kind: 'globalSpeed', mult: 1.5 }, minPrestige: 2 },
  { id: 'c_profit2', name: 'Reputation II', blurb: 'All profit x3.', icon: '🌟', cost: 150, currency: 'cred', effect: { kind: 'globalProfit', mult: 3 }, minPrestige: 3 },
  { id: 'c_luck', name: 'Grail Radar', blurb: 'Much better odds on Select and Grail pulls.', icon: '📡', cost: 300, currency: 'cred', effect: { kind: 'pullLuck', add: 0.5 }, minPrestige: 3 },
  { id: 'c_profit3', name: 'Reputation III', blurb: 'All profit x5.', icon: '💫', cost: 1_000, currency: 'cred', effect: { kind: 'globalProfit', mult: 5 }, minPrestige: 5 },
];

export const UPGRADES: UpgradeDef[] = [...storeUpgrades, ...globalCash, ...premium, ...prestige];
export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

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
  { id: 'u_dohlove', name: 'Doh Dealer', blurb: 'Your name is known in every dough-cube group chat.', icon: '🧊', cost: 20_000_000, currency: 'cash', effect: { kind: 'familyProfit', family: 'doh', mult: 2 } },
  { id: 'u_chair', name: 'Folding Chair', blurb: 'Arrive at 5am in comfort. Skip 2 people in every restock line.', icon: '🪑', cost: 2_000, currency: 'cash', effect: { kind: 'linePosition', add: 2 } },
  { id: 'u_tent', name: 'Overnight Tent', blurb: 'Sleep in the parking lot. Skip 3 more people in line.', icon: '⛺', cost: 400_000, currency: 'cash', effect: { kind: 'linePosition', add: 3 } },
  { id: 'u_minivan', name: 'Minivan (seats out)', blurb: 'Carry 3 more units out of every restock.', icon: '🚐', cost: 80_000, currency: 'cash', effect: { kind: 'carry', add: 3 } },
  { id: 'u_cousins', name: 'Four "Cousins"', blurb: 'Bring four friends who each count as a family. Carry 6 more per restock.', icon: '👨‍👩‍👧‍👦', cost: 25_000_000, currency: 'cash', effect: { kind: 'carry', add: 6 } },
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

// Sketchy tactics: big multipliers, but each one adds Heat. Heat at 100 gets
// you Called Out by the community (profit x0.4 for a while).
const sketchy: UpgradeDef[] = [
  { id: 'k_emptybox', name: 'Return the Empty Box', blurb: 'Keep the Kube, return the packaging. The shelf tag now says SEALED ONLY.', icon: '📦', cost: 40_000, currency: 'cash', effect: { kind: 'globalProfit', mult: 1.5 }, heat: 20, group: 'sketchy' },
 { id: 'k_hookup', name: 'Employee Hookup', blurb: 'Your cousin holds the restock in the back. Bullseye cycles 2x faster.', icon: '🤫', cost: 150_000, currency: 'cash', effect: { kind: 'storeSpeed', storeId: 'bullseye', mult: 2 }, heat: 15, group: 'sketchy' },
  { id: 'k_sweep', name: 'Shelf-Clearing Sweep', blurb: 'Arm across the endcap, everything into the cart. Profit x1.5. People film you.', icon: '🛒', cost: 2_000_000, currency: 'cash', effect: { kind: 'globalProfit', mult: 1.5 }, heat: 25, group: 'sketchy' },
  { id: 'k_openbox', name: '"Sealed" (It Is Not Sealed)', blurb: 'A hair dryer, some glue, a clean conscience. Profit x1.4.', icon: '🔥', cost: 30_000_000, currency: 'cash', effect: { kind: 'globalProfit', mult: 1.4 }, heat: 30, group: 'sketchy' },
  { id: 'k_captcha', name: 'Captcha Farm', blurb: 'Pay strangers overseas to click the buses. Bot Farm cycles 2x faster.', icon: '🚌', cost: 500_000_000, currency: 'cash', effect: { kind: 'storeSpeed', storeId: 'botfarm', mult: 2 }, heat: 25, group: 'sketchy' },
  { id: 'k_fakehaul', name: 'Fake Haul Video', blurb: 'Film the same 3 Kubes from 12 angles. Hype never decays below 1.2. Profit x1.3.', icon: '🎥', cost: 8_000_000_000, currency: 'cash', effect: { kind: 'globalProfit', mult: 1.3 }, heat: 35, group: 'sketchy' },
];

// Selling channels change how the Deals feed behaves.
const channels: UpgradeDef[] = [
  { id: 'ch_fleabay', name: 'FleaBay Store', blurb: 'Buyers from everywhere. Offers are worth 10% more (after fees, somehow).', icon: '🏷️', cost: 25_000, currency: 'cash', effect: { kind: 'offerValue', mult: 1.1 }, group: 'channel' },
  { id: 'ch_mercarry', name: 'Mercarry Listings', blurb: 'Cross-list everything. Offers arrive 15% more often.', icon: '📱', cost: 300_000, currency: 'cash', effect: { kind: 'offerRate', mult: 1.15 }, group: 'channel' },
  { id: 'ch_whatnow', name: 'WhatNow Live Shows', blurb: '"GOING ONCE" at 1am to 30 viewers. Offers arrive 15% more often.', icon: '📺', cost: 20_000_000, currency: 'cash', effect: { kind: 'offerRate', mult: 1.15 }, group: 'channel' },
  { id: 'ch_whatnow2', name: 'WhatNow Hype Mode', blurb: 'Confetti cannon. Offers pay 10% more.', icon: '🎉', cost: 60_000_000, currency: 'cash', effect: { kind: 'offerValue', mult: 1.1 }, group: 'channel' },
  { id: 'ch_radar', name: 'Scam Radar', blurb: '"Hi dear" and "send your email for the invoice" get a red flag in the feed.', icon: '🚩', cost: 10_000, currency: 'cash', effect: { kind: 'scamRadar' }, group: 'channel' },
  { id: 'ch_gands', name: 'Goods & Services Only', blurb: 'No Friends & Family, no Zelle, no checks. Scams can no longer cost you money.', icon: '🛡️', cost: 2_000_000, currency: 'cash', effect: { kind: 'scamShield' }, group: 'channel' },
  { id: 'ch_uv', name: 'UV Tag Light', blurb: 'Spot the wrong font and the gasoline smell before you pay. No more counterfeit pulls.', icon: '🔦', cost: 5_000_000, currency: 'cash', effect: { kind: 'fakeShield' }, group: 'channel' },
  { id: 'ch_stockyx', name: 'StockyX Listing', blurb: 'Authenticated by a guy who smells the cube. Hype buyers pay 10% more, minus a fee you do not read about.', icon: '📈', cost: 5_000_000, currency: 'cash', effect: { kind: 'offerValue', mult: 1.1 }, group: 'channel' },
  { id: 'ch_pr', name: 'PR Apology Template', blurb: '"I\'ve grown as a person." Heat cools twice as fast.', icon: '📝', cost: 50_000_000, currency: 'cash', effect: { kind: 'heatDecay', mult: 2 }, group: 'channel' },
];

export const UPGRADES: UpgradeDef[] = [...storeUpgrades, ...globalCash, ...sketchy, ...channels, ...premium, ...prestige];
export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

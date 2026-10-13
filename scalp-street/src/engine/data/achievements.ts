import type { AchievementDef } from '../types';
import { STORES } from './stores';
import { ITEMS } from './items';

const totalUnits = (s: { stores: Record<string, { units: number }> }) =>
  Object.values(s.stores).reduce((a, b) => a + b.units, 0);

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'a_first', name: 'First Flip', blurb: 'Earn your first $100.', icon: '💵', clout: 5, check: (s) => s.stats.totalCashEarned >= 100 },
  { id: 'a_1k', name: 'Side Hustle', blurb: 'Earn $1,000.', icon: '💰', clout: 5, check: (s) => s.stats.totalCashEarned >= 1_000 },
  { id: 'a_1m', name: 'Six Figures Is Nothing', blurb: 'Earn $1 million.', icon: '🤑', clout: 15, check: (s) => s.stats.totalCashEarned >= 1e6 },
  { id: 'a_1b', name: 'Squish Billionaire', blurb: 'Earn $1 billion.', icon: '🏦', clout: 30, check: (s) => s.stats.totalCashEarned >= 1e9 },
  { id: 'a_1t', name: 'Economy Ruiner', blurb: 'Earn $1 trillion.', icon: '🌍', clout: 60, check: (s) => s.stats.totalCashEarned >= 1e12 },
  { id: 'a_tap100', name: 'Thumb Blister', blurb: 'Tap the shelf 100 times.', icon: '👆', clout: 5, check: (s) => s.stats.taps >= 100 },
  { id: 'a_tap2k', name: 'Carpal Tunnel Speedrun', blurb: 'Tap the shelf 2,000 times.', icon: '🫲', clout: 15, check: (s) => s.stats.taps >= 2_000 },
  { id: 'a_units25', name: 'Regular', blurb: 'Own 25 total store units.', icon: '🛒', clout: 5, check: (s) => totalUnits(s) >= 25 },
  { id: 'a_units200', name: 'Known By Staff', blurb: 'Own 200 total store units.', icon: '🪪', clout: 15, check: (s) => totalUnits(s) >= 200 },
  { id: 'a_units1000', name: 'Banned From The Parking Lot', blurb: 'Own 1,000 total store units.', icon: '🚔', clout: 40, check: (s) => totalUnits(s) >= 1_000 },
  { id: 'a_allstores', name: 'Full Route', blurb: 'Own at least one unit of every store.', icon: '🗺️', clout: 25, check: (s) => STORES.every((st) => (s.stores[st.id]?.units ?? 0) > 0) },
  { id: 'a_managers', name: 'Delegator', blurb: 'Hire every manager.', icon: '👔', clout: 30, check: (s) => STORES.every((st) => s.stores[st.id]?.manager) },
  { id: 'a_pull10', name: 'Blind Bag Addict', blurb: 'Open 10 mystery pulls.', icon: '🎁', clout: 5, check: (s) => s.stats.pulls >= 10 },
  { id: 'a_pull100', name: 'Gambling, But Cute', blurb: 'Open 100 mystery pulls.', icon: '🎰', clout: 20, check: (s) => s.stats.pulls >= 100 },
  { id: 'a_rare', name: 'Still In The Bag', blurb: 'Own a Rare item.', icon: '🏷️', clout: 5, check: (s) => ITEMS.some((i) => i.rarity === 'rare' && s.shelf[i.id]) },
  { id: 'a_ultra', name: 'ISO Fulfilled', blurb: 'Own an Ultra Rare item.', icon: '💎', clout: 15, check: (s) => ITEMS.some((i) => i.rarity === 'ultra' && s.shelf[i.id]) },
  { id: 'a_select', name: 'Limited Company', blurb: 'Own a Limited Run item.', icon: '🔮', clout: 30, check: (s) => ITEMS.some((i) => i.rarity === 'select' && s.shelf[i.id]) },
  { id: 'a_grail', name: 'Holy Grail', blurb: 'Own a Grail.', icon: '🏆', clout: 60, check: (s) => ITEMS.some((i) => i.rarity === 'grail' && s.shelf[i.id]) },
  { id: 'a_shelf_half', name: 'Half the Binder', blurb: 'Collect half of all items.', icon: '📒', clout: 40, check: (s) => Object.keys(s.shelf).filter((k) => s.shelf[k] > 0).length >= Math.ceil(ITEMS.length / 2) },
  { id: 'a_shelf_full', name: 'Completionist', blurb: 'Collect every item.', icon: '🥇', clout: 150, check: (s) => ITEMS.every((i) => s.shelf[i.id] > 0) },
  { id: 'a_prestige1', name: 'New City, Who Dis', blurb: 'Relocate once.', icon: '🚚', clout: 20, check: (s) => s.stats.prestiges >= 1 },
  { id: 'a_prestige5', name: 'Serial Relocator', blurb: 'Relocate 5 times.', icon: '✈️', clout: 50, check: (s) => s.stats.prestiges >= 5 },
  { id: 'a_streak7', name: 'Daily Grinder', blurb: 'Hit a 7-day login streak.', icon: '📅', clout: 25, check: (s) => s.dailyStreak >= 7 },
  { id: 'a_ads10', name: 'Sponsored Content', blurb: 'Watch 10 boost videos.', icon: '📺', clout: 10, check: (s) => s.stats.adsWatched >= 10 },
  { id: 'a_available', name: 'Is This Available?', blurb: 'Get ghosted by 10 buyers.', icon: '👻', clout: 10, check: (s) => s.stats.ghosted >= 10 },
  { id: 'a_lowball', name: 'Lowballed', blurb: 'Accept 10 lowball offers. Rent is due.', icon: '📉', clout: 10, check: (s) => s.stats.lowballsAccepted >= 10 },
  { id: 'a_scamdodge', name: '"Hi Dear" Detector', blurb: 'Decline 5 scam offers.', icon: '🚩', clout: 15, check: (s) => s.stats.scamsDodged >= 5 },
  { id: 'a_scammed', name: 'Friends & Family', blurb: 'Fall for a scam. Everyone does once.', icon: '💸', clout: 5, check: (s) => s.stats.scamsFell >= 1 },
  { id: 'a_karen', name: 'Karen Magnet', blurb: 'Block 5 angry community members.', icon: '🚫', clout: 10, check: (s) => s.stats.karensBlocked >= 5 },
  { id: 'a_deals100', name: 'Marketplace Mogul', blurb: 'Close 100 deals in the feed.', icon: '🤝', clout: 30, check: (s) => s.stats.offersAccepted >= 100 },
  { id: 'a_trade', name: 'Even Swap', blurb: 'Complete a trade.', icon: '🔄', clout: 5, check: (s) => s.stats.tradesDone >= 1 },
  { id: 'a_fake', name: 'Wrong Font', blurb: 'Toss a counterfeit.', icon: '🔦', clout: 5, check: (s) => s.stats.fakesTossed >= 1 },
  { id: 'a_calledout', name: 'Screenshotted', blurb: 'Get Called Out by the community.', icon: '📸', clout: 15, check: (s) => s.stats.calledOut >= 1 },
  { id: 'a_heat50', name: 'Group Chat Villain', blurb: 'Own 4 sketchy tactics.', icon: '😈', clout: 20, check: (s) => s.upgrades.filter((u) => u.startsWith('k_')).length >= 4 },
  { id: 'a_hour', name: 'Just One More Cycle', blurb: 'Play for a total of one hour.', icon: '⏳', clout: 10, check: (s) => s.stats.playSeconds >= 3600 },
];

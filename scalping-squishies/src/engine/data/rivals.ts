// Local scalper rankings: fake rivals with fixed net worths. Overtaking one
// pays Clout and gives the mid-game a ladder to climb.
export interface RankedRival {
  id: string;
  name: string;
  icon: string;
  netWorth: number;
  blurb: string;
  clout: number;
}

export const RANKED_RIVALS: RankedRival[] = [
  { id: 'r_timmy', name: 'Little Timmy (allowance)', icon: '🧒', netWorth: 500, blurb: 'Has one cube. Will not sell it.', clout: 3 },
  { id: 'r_ron', name: 'Grandpa Ron', icon: '👴', netWorth: 5_000, blurb: 'Buys one for every grandkid. Nine grandkids.', clout: 5 },
  { id: 'r_jess', name: 'Jess from the group', icon: '🌸', netWorth: 60_000, blurb: '"I only sell at retail." Has a storage unit.', clout: 8 },
  { id: 'r_carl', name: 'Camper Carla', icon: '⛺', netWorth: 800_000, blurb: 'Owns a chair for every store in the county.', clout: 10 },
  { id: 'r_hank', name: 'Hype Hank', icon: '👟', netWorth: 12_000_000, blurb: 'Pivoted from sneakers. Still says "W cop".', clout: 15 },
  { id: 'r_brenda', name: 'Group Admin Brenda', icon: '📱', netWorth: 150_000_000, blurb: 'Reports you by day, sells on an alt by night.', clout: 20 },
  { id: 'r_dalton', name: 'Dalton', icon: '🧢', netWorth: 2_500_000_000, blurb: 'Cargo van. System. Never in line, always first.', clout: 25 },
  { id: 'r_bigdawg', name: 'Big Dawg Flips', icon: '🐶', netWorth: 40_000_000_000, blurb: 'Runs three WhatNow shows at once. All at 1am.', clout: 30 },
  { id: 'r_betty', name: 'Bot Betty', icon: '💻', netWorth: 900_000_000_000, blurb: 'Forty burners. One Raspberry Pi. Zero remorse.', clout: 40 },
  { id: 'r_warehouse', name: 'The Warehouse Guy', icon: '🕶️', netWorth: 25_000_000_000_000, blurb: 'Does not scalp. Supplies the scalpers.', clout: 60 },
  { id: 'r_kelly', name: 'The Manufacturer', icon: '🏭', netWorth: 1e18, blurb: 'Made the shortage. Made the money. Made you.', clout: 150 },
];

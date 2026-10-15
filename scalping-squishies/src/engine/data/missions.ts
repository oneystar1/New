import type { MissionDef } from '../types';

// Daily missions: three are rolled per day. Rewards feed Clout and the
// season pass so the pass has a reason to be opened every day.
export const MISSION_POOL: MissionDef[] = [
  { id: 'q_tap50', name: 'Shelf Sweep', blurb: 'Tap the shelf 50 times.', target: 50, counter: 'taps', rewardClout: 3, rewardPassXp: 40 },
  { id: 'q_tap200', name: 'Aisle Marathon', blurb: 'Tap the shelf 200 times.', target: 200, counter: 'taps', rewardClout: 6, rewardPassXp: 80 },
  { id: 'q_units10', name: 'Expand the Route', blurb: 'Add 10 runs.', target: 10, counter: 'unitsBought', rewardClout: 3, rewardPassXp: 40 },
  { id: 'q_units50', name: 'Buy Out the Block', blurb: 'Add 50 runs.', target: 50, counter: 'unitsBought', rewardClout: 6, rewardPassXp: 80 },
  { id: 'q_pull3', name: 'Blind Bag Trio', blurb: 'Open 3 mystery pulls.', target: 3, counter: 'pulls', rewardClout: 4, rewardPassXp: 60 },
  { id: 'q_pull10', name: 'Rip Session', blurb: 'Open 10 mystery pulls.', target: 10, counter: 'pulls', rewardClout: 8, rewardPassXp: 120 },
  { id: 'q_ads2', name: 'Sponsored Hustle', blurb: 'Watch 2 boost videos.', target: 2, counter: 'adsWatched', rewardClout: 5, rewardPassXp: 60 },
  { id: 'q_sales100', name: 'Hundred Sales', blurb: 'Complete 100 flips.', target: 100, counter: 'sales', rewardClout: 4, rewardPassXp: 60 },
  { id: 'q_deals5', name: 'Close the Deal', blurb: 'Accept 5 offers in the Deals feed.', target: 5, counter: 'deals', rewardClout: 4, rewardPassXp: 60 },
  { id: 'q_deals15', name: 'Marketplace Grind', blurb: 'Accept 15 offers in the Deals feed.', target: 15, counter: 'deals', rewardClout: 8, rewardPassXp: 120 },
  { id: 'q_restock1', name: 'Early Bird', blurb: 'Complete a restock run.', target: 1, counter: 'restocks', rewardClout: 4, rewardPassXp: 60 },
  { id: 'q_restock3', name: 'Overnighter', blurb: 'Complete 3 restock runs.', target: 3, counter: 'restocks', rewardClout: 8, rewardPassXp: 120 },
  { id: 'q_sales500', name: 'Volume Seller', blurb: 'Complete 500 flips.', target: 500, counter: 'sales', rewardClout: 8, rewardPassXp: 120 },
];

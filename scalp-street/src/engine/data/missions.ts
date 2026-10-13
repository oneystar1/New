import type { MissionDef } from '../types';

// Daily missions: three are rolled per day. Rewards feed Clout and the
// season pass so the pass has a reason to be opened every day.
export const MISSION_POOL: MissionDef[] = [
  { id: 'q_tap50', name: 'Shelf Sweep', blurb: 'Tap the shelf 50 times.', target: 50, counter: 'taps', rewardClout: 3, rewardPassXp: 40 },
  { id: 'q_tap200', name: 'Aisle Marathon', blurb: 'Tap the shelf 200 times.', target: 200, counter: 'taps', rewardClout: 6, rewardPassXp: 80 },
  { id: 'q_units10', name: 'Expand the Route', blurb: 'Buy 10 store units.', target: 10, counter: 'unitsBought', rewardClout: 3, rewardPassXp: 40 },
  { id: 'q_units50', name: 'Buy Out the Block', blurb: 'Buy 50 store units.', target: 50, counter: 'unitsBought', rewardClout: 6, rewardPassXp: 80 },
  { id: 'q_pull3', name: 'Blind Bag Trio', blurb: 'Open 3 mystery pulls.', target: 3, counter: 'pulls', rewardClout: 4, rewardPassXp: 60 },
  { id: 'q_pull10', name: 'Rip Session', blurb: 'Open 10 mystery pulls.', target: 10, counter: 'pulls', rewardClout: 8, rewardPassXp: 120 },
  { id: 'q_ads2', name: 'Sponsored Hustle', blurb: 'Watch 2 boost videos.', target: 2, counter: 'adsWatched', rewardClout: 5, rewardPassXp: 60 },
  { id: 'q_sales100', name: 'Hundred Sales', blurb: 'Complete 100 store cycles.', target: 100, counter: 'sales', rewardClout: 4, rewardPassXp: 60 },
  { id: 'q_sales500', name: 'Volume Seller', blurb: 'Complete 500 store cycles.', target: 500, counter: 'sales', rewardClout: 8, rewardPassXp: 120 },
];

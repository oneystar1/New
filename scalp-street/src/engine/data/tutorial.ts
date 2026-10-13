import type { GameState } from '../types';

export interface TutorialStep {
  id: string;
  text: string;
  hint: string;
  clout: number;
  tab: 'hunt' | 'stores' | 'deals' | 'shelf' | 'boost' | 'shop';
  check: (s: GameState) => boolean;
}

// First-time user experience: a checklist that pays Clout. Steps complete
// themselves from state so the player never has to "confirm" anything.
export const TUTORIAL: TutorialStep[] = [
  { id: 't_tap', text: 'Tap the shelf 10 times', hint: 'Hunt tab. Every tap is cash. Sixty taps fills the meter for a free pull.', clout: 5, tab: 'hunt', check: (s) => s.stats.taps >= 10 },
  { id: 't_unit', text: 'Buy your first store unit', hint: 'Routes tab. Dollar Dohjo costs $4. Tap its icon to run a cycle.', clout: 5, tab: 'stores', check: (s) => s.stats.unitsBought >= 1 },
  { id: 't_manager', text: 'Hire a manager', hint: 'Routes tab. Cousin Dwayne automates Dollar Dohjo for $100 and earns while you are away.', clout: 10, tab: 'stores', check: (s) => Object.values(s.stores).some((st) => st.manager) },
  { id: 't_restock', text: 'Camp a restock', hint: 'Hunt tab. Stand in line, then mash GRAB when the doors open. Watch out for moms.', clout: 10, tab: 'hunt', check: (s) => s.stats.restocks >= 1 },
  { id: 't_deal', text: 'Answer a Marketplace message', hint: 'Messages tab (💬). Buyers message you about items on your shelf. Accept, counter or decline. "Hi dear" is a scam.', clout: 10, tab: 'deals', check: (s) => s.stats.offersAccepted + s.stats.offersDeclined >= 1 },
  { id: 't_upgrade', text: 'Buy an upgrade', hint: 'Hustle tab. Faster Thumbs is $500 and doubles your tap.', clout: 10, tab: 'boost', check: (s) => s.upgrades.some((u) => u.startsWith('u_')) },
  { id: 't_pull', text: 'Open a mystery pull', hint: 'Fill the Hunt meter, watch a video on the Shelf tab, or spend Clout.', clout: 10, tab: 'shelf', check: (s) => s.stats.pulls >= 1 },
  { id: 't_mission', text: 'Claim a daily mission', hint: 'Hunt tab. Missions pay Clout and Hustle Pass XP.', clout: 10, tab: 'hunt', check: (s) => s.missions.some((m) => m.claimed) },
  { id: 't_prestige', text: 'Relocate to a new city', hint: 'Hustle tab, once you have earned $100M this run. Keep your Street Cred, pick a city perk.', clout: 50, tab: 'boost', check: (s) => s.stats.prestiges >= 1 },
];

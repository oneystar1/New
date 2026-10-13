import type { ManagerDef } from '../types';

// One manager per store. Buying one automates that store's cycle so it
// restarts without a tap (the classic AdCap "manager" beat).
export const MANAGERS: ManagerDef[] = [
  { id: 'm_dollar', storeId: 'dollar', name: 'Cousin Dwayne', icon: '🧢', cost: 100, blurb: 'Will stand in any line for gas money.' },
  { id: 'm_fiveunder', storeId: 'fiveunder', name: 'Camper Carla', icon: '⛺', cost: 2_000, blurb: 'Owns a folding chair for every store in town.' },
  { id: 'm_bullseye', storeId: 'bullseye', name: 'Tuesday Tony', icon: '☕', cost: 25_000, blurb: 'Knows the restock truck driver by name.' },
  { id: 'm_wallymart', storeId: 'wallymart', name: 'Night Shift Nia', icon: '🌙', cost: 300_000, blurb: 'Sleeps in the parking lot. Thrives.' },
  { id: 'm_hallmarq', storeId: 'hallmarq', name: 'Grandma Gwen', icon: '👵', cost: 3_500_000, blurb: 'Gets a senior discount AND first dibs.' },
  { id: 'm_wholesale', storeId: 'wholesale', name: 'Pallet Pete', icon: '🚐', cost: 40_000_000, blurb: 'Has a membership card and a minivan with the seats out.' },
  { id: 'm_claw', storeId: 'claw', name: 'Clawdia', icon: '🦀', cost: 500_000_000, blurb: 'Reads the claw tension like a fortune teller.' },
  { id: 'm_botfarm', storeId: 'botfarm', name: 'Bot Betty', icon: '💻', cost: 6_000_000_000, blurb: 'Runs 40 burner accounts on a Raspberry Pi.' },
  { id: 'm_con', storeId: 'con', name: 'Wristband Wes', icon: '🎟️', cost: 70_000_000_000, blurb: 'Has never once seen a convention panel.' },
  { id: 'm_factory', storeId: 'factory', name: 'The Warehouse Guy', icon: '🕶️', cost: 850_000_000_000, blurb: 'Don\'t ask his name. Don\'t ask anything.' },
];

export const MANAGER_BY_STORE: Record<string, ManagerDef> = Object.fromEntries(MANAGERS.map((m) => [m.storeId, m]));

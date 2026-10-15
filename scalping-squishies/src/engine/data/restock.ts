import type { RivalKind } from '../types';

export const RIVALS: Record<RivalKind, { names: string[]; icon: string; takes: [number, number]; blurb: string }> = {
  mom: {
    names: ['Kube Mom (minivan)', 'Kube Mom (SUV)', 'Kube Mom (three kids = three families)', 'Squad Mom Tiffani', 'Group Admin Brenda'],
    icon: '👩‍👧‍👦',
    takes: [2, 4],
    blurb: 'Two per family. She brought the whole family.',
  },
  kid: {
    names: ['Little Timmy (age 7)', 'Kid with birthday money', 'Girl in a dinosaur hoodie', 'Twins sharing one cart', 'Kid holding a $5 bill'],
    icon: '🧒',
    takes: [1, 1],
    blurb: 'Just wants one. Has wanted one for months.',
  },
  reseller: {
    names: ['Dalton (other reseller)', 'Big Dawg Flips', 'Guy in a cook-group hoodie', 'the_other_reseller', 'Camper Carl\'s cousin'],
    icon: '🧢',
    takes: [2, 3],
    blurb: 'Knows the limit. Has a plan for the limit.',
  },
  grandpa: {
    names: ['Grandpa Ron', 'Nana Pat', 'Retired guy who is just curious'],
    icon: '👴',
    takes: [1, 1],
    blurb: 'Buying one for a grandkid. Protect at all costs.',
  },
  sneakerbro: {
    names: ['Sneaker Bro (pivoted from sneakers)', 'Hype Hank (matching hoodie)', 'Guy who camped for retros, now cubes', 'DeadstockDrew with a Bluetooth speaker', 'Three bros, one Civic'],
    icon: '👟',
    takes: [3, 4],
    blurb: 'Used to camp for sneakers. Same tent, same bot, new product.',
  },
  employee: {
    names: ['Employee "holding one for a friend"', 'Night stocker with a backpack'],
    icon: '🦺',
    takes: [2, 2],
    blurb: 'Did not technically stand in line.',
  },
};

export interface EncounterChoice {
  label: string;
  /** Effect applied when picked; `chance` is probability the good branch happens. */
  effect: 'spareKid' | 'snatchKid' | 'argueMom' | 'complimentMom' | 'crawlMom' | 'splitShelf' | 'noSplit' | 'comply' | 'cousins' | 'letCut' | 'refuseCut' | 'raceBro' | 'fudBro' | 'halvesBro'
    | 'holdSpot' | 'justGo' | 'holdIt' | 'coffeeRound' | 'coffeeSolo' | 'nothing' | 'grabTicket' | 'sellSpot' | 'stayRain' | 'carRain' | 'giveChair' | 'ignoreGrandpa' | 'complySecurity' | 'argueSecurity';
}

export interface EncounterDef {
  id: string;
  kind: RivalKind;
  icon: string;
  text: string;
  choices: EncounterChoice[];
  /** Only during the camp phase (before doors open). */
  line?: boolean;
  /** Timed event: seconds to respond before it resolves on its own (`onExpire`). */
  timed?: number;
  onExpire?: EncounterChoice['effect'];
}

export const ENCOUNTERS: EncounterDef[] = [
  {
    id: 'kid_last', kind: 'kid', icon: '🧒',
    text: 'Little Timmy reaches for the last one at the exact same time. He is looking up at you. He is seven.',
    choices: [
      { label: 'Let him have it', effect: 'spareKid' },
      { label: 'Snatch it (+10 heat)', effect: 'snatchKid' },
    ],
  },
  {
    id: 'kid_cry', kind: 'kid', icon: '😭',
    text: 'A kid is crying at your feet because your cart has nine and the shelf has zero.',
    choices: [
      { label: 'Give him one from the cart', effect: 'spareKid' },
      { label: 'Step over him (+10 heat)', effect: 'snatchKid' },
    ],
  },
  {
    id: 'mom_cart', kind: 'mom', icon: '🛒',
    text: 'A Kube Mom parks her cart sideways across the aisle and starts handing cubes to each of her kids. "Two per FAMILY."',
    choices: [
      { label: 'Argue (+6 heat)', effect: 'argueMom' },
      { label: 'Compliment her minivan', effect: 'complimentMom' },
      { label: 'Crawl under the cart (+3 heat)', effect: 'crawlMom' },
    ],
  },
  {
    id: 'mom_film', kind: 'mom', icon: '📱',
    text: 'Group Admin Brenda is filming you for the group. "Everyone say hi to the scalper."',
    choices: [
      { label: 'Argue on camera (+6 heat)', effect: 'argueMom' },
      { label: 'Smile and wave', effect: 'complimentMom' },
    ],
  },
  {
    id: 'reseller_split', kind: 'reseller', icon: '🧢',
    text: 'Dalton leans in: "Split the shelf? Half each, nobody gets banned."',
    choices: [
      { label: 'Deal (take half, go home)', effect: 'splitShelf' },
      { label: 'No deal, keep grabbing', effect: 'noSplit' },
    ],
  },
  {
    id: 'manager_limit', kind: 'employee', icon: '🦺',
    text: 'Manager: "Sir. SIR. Two per customer."',
    choices: [
      { label: 'Comply (stop at 2 more)', effect: 'comply' },
      { label: '"I\'m buying for my cousins" (ban risk)', effect: 'cousins' },
    ],
  },
  {
    id: 'bro_row', kind: 'sneakerbro', icon: '👟',
    text: 'A Sneaker Bro checks his phone: "Bro the Kube is at 4x on StockyX right now. I\'m taking the whole row." He has a duffel bag.',
    choices: [
      { label: 'Race him for the row', effect: 'raceBro' },
      { label: '"It\'s dipping, check the chart"', effect: 'fudBro' },
      { label: 'Offer to go halves', effect: 'halvesBro' },
    ],
  },
  {
    id: 'bro_legit', kind: 'sneakerbro', icon: '🔍',
    text: 'Sneaker Bro grabs the cube out of YOUR cart to "legit check" it. He smells it. "Font looks off, bro."',
    choices: [
      { label: 'Take it back (+3 heat)', effect: 'crawlMom' },
      { label: 'Let him keep it, grab another', effect: 'noSplit' },
    ],
  },
  {
    id: 'line_bro', kind: 'sneakerbro', icon: '🔊', line: true,
    text: 'Three sneaker bros in matching hoodies arrive at 4am with a tent, a Bluetooth speaker and a cook-group leak of the restock time. The moms were already here.',
    choices: [
      { label: 'Let them vibe', effect: 'letCut' },
      { label: '"Line\'s back there, bro" (+2 heat)', effect: 'refuseCut' },
    ],
  },
  {
    id: 'camp_pee', kind: 'kid', icon: '🚻', line: true,
    text: 'You have to pee. Badly. The gas station is across the lot and the line is not getting shorter.',
    choices: [
      { label: 'Ask the Kube Mom to hold your spot', effect: 'holdSpot' },
      { label: 'Just go (lose 2 spots)', effect: 'justGo' },
      { label: 'Hold it (doors clock -3s)', effect: 'holdIt' },
    ],
  },
  {
    id: 'camp_coffee', kind: 'grandpa', icon: '☕', line: true,
    text: 'Grandpa Ron is taking coffee orders for the line. "My treat if you cover the next round."',
    choices: [
      { label: 'Buy a round for the line (-cash, -5 heat, moms take fewer)', effect: 'coffeeRound' },
      { label: 'Just one for you', effect: 'coffeeSolo' },
      { label: 'Pass', effect: 'nothing' },
    ],
  },
  {
    id: 'camp_ticket', kind: 'employee', icon: '🎟️', line: true, timed: 3, onExpire: 'nothing',
    text: 'An employee comes out with numbered tickets. "One per person, right now." GRAB ONE.',
    choices: [
      { label: '🎟️ Grab a ticket!', effect: 'grabTicket' },
    ],
  },
  {
    id: 'camp_spot', kind: 'reseller', icon: '💵', line: true,
    text: 'Guy behind you leans in. "Twenty bucks for your spot? I\'ll throw in a gas station taquito."',
    choices: [
      { label: 'Sell the spot (cash, +5 spots back)', effect: 'sellSpot' },
      { label: 'Keep it', effect: 'nothing' },
    ],
  },
  {
    id: 'camp_rain', kind: 'mom', icon: '🌧️', line: true,
    text: 'It starts raining sideways. Half the line looks at their cars.',
    choices: [
      { label: 'Stay in it (people leave, you move up 3)', effect: 'stayRain' },
      { label: 'Sit in the car (lose 2 spots)', effect: 'carRain' },
    ],
  },
  {
    id: 'camp_chair', kind: 'grandpa', icon: '🪑', line: true,
    text: 'Grandpa Ron has been standing for an hour. He is looking at your folding chair.',
    choices: [
      { label: 'Give him the chair (-4 heat)', effect: 'giveChair' },
      { label: 'Pretend not to notice (+2 heat)', effect: 'ignoreGrandpa' },
    ],
  },
  {
    id: 'camp_security', kind: 'employee', icon: '🚔', line: true,
    text: 'Mall security: "Tents down, folks. Store policy." He is looking at your tent.',
    choices: [
      { label: 'Comply (lose 1 spot in the shuffle)', effect: 'complySecurity' },
      { label: 'Argue (+4 heat, 50% keep your spot)', effect: 'argueSecurity' },
    ],
  },
  {
    id: 'line_cut', kind: 'mom', icon: '🚻', line: true,
    text: 'A Kube Mom asks to cut in front of you. "My kid has to pee." The kid does not look like he has to pee.',
    choices: [
      { label: 'Let her cut (she takes 3)', effect: 'letCut' },
      { label: 'Refuse (+2 heat, she argues)', effect: 'refuseCut' },
    ],
  },
  {
    id: 'line_kid', kind: 'kid', icon: '🧒', line: true,
    text: 'The kid in front of you has been here since 5am with his dad. He is asleep standing up.',
    choices: [
      { label: 'Let him stay ahead', effect: 'letCut' },
      { label: '"Line\'s moving, buddy" (+2 heat)', effect: 'refuseCut' },
    ],
  },
];

export const PHONE_ACTIONS = [
  { id: 'message', icon: '💬', label: 'Answer a message', blurb: 'Handle one Marketplace offer without leaving the line.' },
  { id: 'intel', icon: '📱', label: 'Scroll the group', blurb: 'Someone always leaks the pallet count. Next run here gets +4 stock.' },
  { id: 'nap', icon: '😴', label: 'Nap in the chair', blurb: '-6 heat. 35% chance you wake up two spots back.' },
] as const;

export const INTEL_LINES = [
  'Night stocker posted a photo of the pallet. Fourteen cases. Deleted in 40 seconds. You saw it.',
  '"Truck came in at 4:10, they are putting out everything" - Brenda, who is also in this line.',
  'Someone in the group counted the boxes through the window. You trust them. You should not.',
  'Store employee\'s cousin says the limit is being lifted today. The store employee\'s cousin is wrong.',
];

export const LINE_FLAVOR = [
  'It is 6:40am. The line is 14 deep. One guy brought a tent.',
  'Someone is passing out coffee. It is Grandpa Ron. He is a saint.',
  'A mom is explaining "two per family" to her kids like a heist plan.',
  'The guy ahead of you is refreshing the app with both thumbs.',
  'Employee peeks through the door, counts heads, winces.',
  'A kid asks you what you are going to do with that many. You do not answer.',
  'Dalton pulls up in the cargo van. He is not even in line. He has a system.',
  'A sneaker bro is explaining "the StockyX chart" to a Kube Mom. She is not listening. She has a list.',
  'Someone\'s Bluetooth speaker is playing a hype playlist at 6am. The bros. It is always the bros.',
];

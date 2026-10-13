import type { RivalKind } from '../types';

export const RIVALS: Record<RivalKind, { names: string[]; icon: string; takes: [number, number]; blurb: string }> = {
  mom: {
    names: ['NeeDoh Mom (minivan)', 'NeeDoh Mom (SUV)', 'NeeDoh Mom (three kids = three families)', 'Squad Mom Tiffani', 'Group Admin Brenda'],
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
  effect: 'spareKid' | 'snatchKid' | 'argueMom' | 'complimentMom' | 'crawlMom' | 'splitShelf' | 'noSplit' | 'comply' | 'cousins' | 'letCut' | 'refuseCut';
}

export interface EncounterDef {
  id: string;
  kind: RivalKind;
  icon: string;
  text: string;
  choices: EncounterChoice[];
  /** Only during the line phase (before doors open). */
  line?: boolean;
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
    text: 'A NeeDoh Mom parks her cart sideways across the aisle and starts handing cubes to each of her kids. "Two per FAMILY."',
    choices: [
      { label: 'Argue (+6 heat)', effect: 'argueMom' },
      { label: 'Compliment her minivan', effect: 'complimentMom' },
      { label: 'Crawl under the cart (+3 heat)', effect: 'crawlMom' },
    ],
  },
  {
    id: 'mom_film', kind: 'mom', icon: '📱',
    text: 'Group Admin Brenda is filming you for the Facebook group. "Everyone say hi to the scalper."',
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
    id: 'line_cut', kind: 'mom', icon: '🚻', line: true,
    text: 'A NeeDoh Mom asks to cut in front of you. "My kid has to pee." The kid does not look like he has to pee.',
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

export const LINE_FLAVOR = [
  'It is 6:40am. The line is 14 deep. One guy brought a tent.',
  'Someone is passing out coffee. It is Grandpa Ron. He is a saint.',
  'A mom is explaining "two per family" to her kids like a heist plan.',
  'The guy ahead of you is refreshing the app with both thumbs.',
  'Employee peeks through the door, counts heads, winces.',
  'A kid asks you what you are going to do with that many. You do not answer.',
  'Dalton pulls up in the cargo van. He is not even in line. He has a system.',
];

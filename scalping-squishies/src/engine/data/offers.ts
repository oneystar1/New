import type { OfferKind } from '../types';

// Buyer personas and message templates for the Deals feed. {item} is
// replaced with the listed item's name and {price} with the offer amount.

export const BUYER_NAMES = [
  'Brayden K.', 'SquishMom2019', 'Hype Hank', 'DeadstockDrew', 'SZ10_Civic', 'kicks2kubes', 'DealzDealzDealz', 'Tyler (no profile pic)', 'Kayleigh ✨', 'Grandpa Ron',
  'ISO_Everything', 'Jess from the group', 'MarketplaceMike', 'Ashlee 🌸', 'Account created today', 'Big Dawg Flips',
  'Nana Pat', 'squeezyqueen', 'Dalton', 'the_other_reseller', 'Karen_From_PTA', 'Local Mom Collective', 'Chad', 'xX_FidgetLord_Xx',
];

export const OFFER_TEMPLATES: Record<OfferKind, string[]> = {
  fair: [
    'Hi! Is the {item} still available? I can do {price} and pick up today.',
    'I\'ll take the {item} for {price}. Cash, your location, no games.',
    'My daughter has been looking for a {item} everywhere. {price} work?',
    'Saw your {item} listing. {price}, I can meet at the Bullseye lot after work.',
    'Been hunting a {item} for months. {price} and I\'ll leave a 5 star review.',
  ],
  lowball: [
    'would u take {price} for the {item}? its only $6 at the store',
    '{price} cash rn for the {item}. firm. lmk',
    'I can do {price} for the {item}, I\'m literally 2 min away',
    'my kid wants the {item} but im not paying scalper prices. {price}?',
    'hey is the {item} available? ill give u {price} and a ride to the store lol',
    '{price}. take it or leave it. (for the {item})',
  ],
  scam: [
    'I\'ll pay {price} for the {item} plus extra for shipping. My courier will pick it up. Send your email for the Zelle invoice.',
    'Interested in the {item}. I\'m out of town but I\'ll send {price} via Friends & Family. Just need you to confirm with this 6-digit code first.',
    'Will pay {price} for the {item} sight unseen. Please ship to my "son" at this PO box. Payment pending until you mark it shipped.',
    'Hi dear, I want the {item} for {price} as a surprise gift. I have sent a cheque for more than the amount, please refund the difference.',
    'Buying the {item} for {price}. I overpaid on PayPal by accident, can you Venmo back the extra right away?',
  ],
  ghost: [
    'Is this available?',
    'is the {item} still available',
    'Is this still available? I can pick up tomorrow for {price}',
    'hi is this available',
    'still available?? {price} ok?',
  ],
  trade: [
    'No cash but I\'ll trade you for the {item}. Got a sealed one from my collection.',
    'Trade? I have something you don\'t have on your shelf. Even swap for the {item}.',
    'Would you do a trade for the {item}? Got a doubles bin, pick anything.',
  ],
  sneakerbro: [
    'Yo what\'s the lowest on the {item}? It\'s at {price} on StockyX rn. Cash app ready. Also trade for size 10 retros?',
    'Bro. {item}. {price}. Deadstock? Still in the bag? I need pics of the tag with today\'s date.',
    'Copped 40 pairs of Pandas last year, now I\'m on dough. {price} for the {item}, I\'ll be there in the Civic.',
    'Legit check on the {item}? If it passes I\'ll do {price}. My guy says the font looks off but my guy says that about everything.',
    'The chart says {item} is up 12% this week. {price}, I\'m buying the dip bro.',
  ],
  karen: [
    'You people are the reason my kids can\'t find a {item} at the store. Hope you\'re proud. Reported.',
    'Retail is $6. You\'re asking {price}?? I\'m posting this in the group.',
    'Scalpers like you should be banned from every store. Enjoy your blood money.',
    'I know what store you got the {item} from. I\'m telling the manager.',
    'Not buying, just here to say this is disgusting. {price} for a {item}. Disgusting.',
  ],
};

/** Community drama ticker: pure flavor, rotates in the Deals tab. */
export const DRAMA_FEED = [
  'ISO Golden Nana, RETAIL ONLY please, no scalpers 🙏',
  'PSA: the "Nice Kube" on Marketplace for $45 is a FAKE, the font is wrong',
  'Bullseye on Route 9 just put up a 2-per-customer sign. Thanks a lot, whoever cleared the endcap.',
  'Someone met a buyer at the gas station at 11pm and got lowballed IN PERSON. Legendary.',
  'Group rule reminder: no reselling above retail. Yes we can see your other listings.',
  'Restock truck spotted at WallyMart 6:40am. Line already 14 deep. One guy brought a tent.',
  'Admin note: "Is this available?" and then never replying is now a bannable offense (it is not, but it should be)',
  'The 17-inch banana is back on the app. Sold out again. 4 seconds. We did not even see it.',
  'Buyer paid Friends & Family for a Smusher set and got a box of rocks. This is why we use Goods & Services.',
  'Reseller posted their "haul" of 40 Nice Kubes. Comment section is a war zone.',
  'Employee at the card shop is holding Candy Swirl Kubes for a "friend". We have screenshots.',
  'Live stream seller sold the same Glow Glob to three people. Refunds "pending".',
  'Lowball of the week: $2 and a half-eaten granola bar for a sealed Nice Burg.',
  'New counterfeit warning from the manufacturer. If it smells like gasoline it is not real.',
  'Reminder that police station parking lots exist. Stop meeting strangers behind the laundromat.',
  'Karen_From_PTA has reported 112 listings this week. She is unstoppable.',
  '"Pending pickup" for 9 days straight means the buyer ghosted, Brayden. Relist it.',
  'Someone returned an empty Nice Kube box to Five & Under and the shelf tag now says SEALED ONLY.',
  'Convention wristband line started at 4am. Booth sold out at 10:02. Resale listings live at 10:03.',
  'A bot farm got caught because every burner account had the same shipping address. Amateurs.',
  'PSA: "I\'ll send my shipper" is a scam. "Confirm with this code" is a scam. "Hi dear" is a scam.',
  'Grandpa Ron just paid full asking for a Mochi Mini. Protect him at all costs.',
  'Group poll: is $25 for a jumbo banana "scalping" or "fair market value"? Comments locked after 400.',
  'The sneaker bros found us. Three guys in Civics camped WallyMart overnight for cubes. They brought a tent AND a Bluetooth speaker.',
  'StockyX now has a dough-cube chart. A grown man said "buy the dip" about a $6 dough cube.',
  'Sneaker Bro tried to "legit check" a Nice Kube by smelling it. Declared it fake. It was real. He bought it anyway.',
  'Someone is calling the black-and-red cube the "Bred" colorway. We are not doing this. We are apparently doing this.',
  'Cook group leaked the restock time. Sneaker bros showed up at 4am in matching hoodies. The moms were already there.',
];

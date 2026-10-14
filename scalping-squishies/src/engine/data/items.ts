import type { ItemDef, Rarity, Variant } from '../types';

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'ultra', 'select', 'grail', 'chase'];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  ultra: 'Ultra Rare',
  select: 'Limited Run',
  grail: 'Grail',
  chase: 'Chase',
};

/** Display names for the two product families. */
export const FAMILY_LABEL = { squish: 'Squishies', doh: 'Dohs' } as const;
export const FAMILY_ICON = { squish: '🍌', doh: '🧊' } as const;

/** Shelf bonus: each unique item owned adds this % to global profit. */
export const RARITY_SHELF_BONUS: Record<Rarity, number> = {
  common: 0.005,
  uncommon: 0.01,
  rare: 0.02,
  ultra: 0.04,
  select: 0.08,
  grail: 0.2,
  chase: 0.5,
};

export const VARIANTS: Variant[] = ['standard', 'glitter', 'glow', 'mini'];
export const VARIANT_LABEL: Record<Variant, string> = { standard: 'Standard', glitter: 'Glitter', glow: 'Glow', mini: 'Mini' };
export const VARIANT_ICON: Record<Variant, string> = { standard: '', glitter: '✦', glow: '☼', mini: '•' };
/** Base odds of each variant on a pull (luck nudges toward the rarer ones). */
export const VARIANT_WEIGHTS: Record<Variant, number> = { standard: 70, glitter: 15, glow: 10, mini: 5 };
/** Shelf bonus multiplier for owning a variant slot, relative to the rarity bonus. */
export const VARIANT_BONUS_MULT: Record<Variant, number> = { standard: 1, glitter: 0.6, glow: 0.8, mini: 0.4 };
/** Duplicate flip value multiplier by variant. */
export const VARIANT_VALUE_MULT: Record<Variant, number> = { standard: 1, glitter: 2, glow: 3, mini: 1.5 };

export function shelfKey(itemId: string, variant: Variant): string {
  return variant === 'standard' ? itemId : `${itemId}:${variant}`;
}
export function parseShelfKey(key: string): { itemId: string; variant: Variant } {
  const [itemId, v] = key.split(':');
  return { itemId, variant: (v as Variant) ?? 'standard' };
}

/** Set bonuses: a complete store page (every item of that store in a given variant) pays a permanent profit bonus. */
export const SET_BONUS: Record<Variant, number> = { standard: 0.05, glitter: 0.08, glow: 0.1, mini: 0.06 };
/** Completing every Standard item of a family. */
export const FAMILY_SET_BONUS = 0.15;

const squish = (
  id: string, name: string, rarity: Rarity, icon: string, retail: number, resaleMult: number, storeId: string, blurb: string,
): ItemDef => ({ id, name, family: 'squish', rarity, icon, retail, resaleMult, storeId, blurb });

const doh = (
  id: string, name: string, rarity: Rarity, icon: string, retail: number, resaleMult: number, storeId: string, blurb: string,
): ItemDef => ({ id, name, family: 'doh', rarity, icon, retail, resaleMult, storeId, blurb });

// Two families of squeezable fidgets, both affectionate parodies of real
// lines. Dohs are the stretchy-dough globs and cubes that caused the 2026
// shortage. Squishies are the slow-rise and jumbo squeezy toys: the viral
// 14 to 17 inch bananas, cheese cubes, butter sticks, blind-box dumplings,
// mochi minis and the sold-out Smusher sets. Resale multipliers follow the
// research: commons move near retail, grails go 50x to 300x.
export const ITEMS: ItemDef[] = [
  // ---- Dohs (stretchy dough globs and cubes) ----
  doh('doh_generic', 'Off-Brand Dough Ball', 'common', '🟢', 1, 0.8, 'dollar', 'It leaks. It is sticky. It is one dollar.'),
  doh('doh_panic', 'Panic Pete', 'common', '😳', 3, 1.2, 'dollar', 'Squeeze him and his eyes pop out. Relatable.'),
  doh('doh_gumdrop', 'Gumdrop', 'common', '🍬', 6, 1.5, 'fiveunder', 'Translucent, jiggly, and gone from every shelf in the county.'),
  doh('doh_shroom', 'Groovy Shroom', 'common', '🍄', 5, 1.4, 'fiveunder', 'Squeeze it and it mushrooms. Literally.'),
  doh('doh_fruit', 'Groovy Fruit', 'common', '🍇', 5, 1.3, 'fiveunder', 'A grape that stretches to your elbow.'),
  doh('doh_cloud', 'Cloud Pleaser', 'uncommon', '☁️', 6, 2.0, 'fiveunder', 'Soft like a cloud. Rare like a parking spot on Drop Day.'),
  doh('doh_kube', 'Nice Kube', 'uncommon', '🧊', 6, 3.0, 'fiveunder', 'The cube that started the shortage. 2 per family limit.'),
  doh('doh_dreamdrip', 'Dream Drip', 'uncommon', '💧', 6, 2.8, 'fiveunder', 'Shaped like a drip. Priced like a dream on resale.'),
  doh('doh_glob', 'Groovy Glob', 'rare', '🫧', 7, 3.5, 'wallymart', 'A glob with attitude. Sells in nine seconds.'),
  doh('doh_gummie', 'Gummie Bear', 'rare', '🧸', 7, 3.2, 'wallymart', 'Bear-shaped, bear-market proof.'),
  doh('doh_coolkat', 'Groovy Cool Kat', 'uncommon', '😼', 6, 2.4, 'wallymart', 'Sunglasses on a dough cat. Peak 2026.'),
  doh('doh_teenie', 'Teenie Ice Baby', 'uncommon', '🍼', 8, 2.5, 'wallymart', 'Half the size, all of the hype.'),
  doh('doh_iceb', 'Nice Ice Baby', 'rare', '🧊', 8, 3.4, 'wallymart', 'Semi-transparent. Stretches. Always bounces back. Unlike your bank account.'),
  doh('doh_heart', 'Color Change Heart', 'uncommon', '💗', 5, 2.2, 'hallmarq', 'Warms in your hand. Cools in a scalper\'s cart.'),
  doh('doh_swirl', 'Nice Kube Swirl', 'rare', '🍥', 8, 5.0, 'hallmarq', 'Only the card shop gets these. Only you know that.'),
  doh('doh_candy', 'Candy Swirl Kube', 'rare', '🍭', 8, 5.5, 'hallmarq', 'Spotted at the card shop with a 2-per-person sign taped to the bin.'),
  doh('doh_berg', 'Nice Burg', 'rare', '🧊', 13, 3.0, 'hallmarq', 'The jumbo cube. Titanic demand.'),
  doh('doh_knitten', 'Knitten', 'uncommon', '🧶', 7, 2.6, 'hallmarq', 'A dough kitten in a Christmas sweater. Dohlidays exclusive.'),
  doh('doh_glitter', 'Glitter Kube', 'rare', '✨', 8, 4.0, 'wholesale', 'Sparkles when squeezed. Also when listed.'),
  doh('doh_ghost', 'Glowy Ghost', 'rare', '👻', 7, 4.5, 'wholesale', 'Dohlloween drop. Glows. Haunts your inventory spreadsheet.'),
  doh('doh_lantern', 'Jack-Glow-Lantern', 'ultra', '🎃', 8, 7.0, 'wholesale', 'Seasonal, glow in the dark, sold out before October.'),
  doh('doh_glow', 'Glow Glob', 'ultra', '🌙', 9, 9.0, 'claw', 'Glows in the dark, like your resale listings at 3am.'),
  doh('doh_reindeer', 'Squisher the Reindeer', 'ultra', '🦌', 9, 8.0, 'claw', 'Dohlidays 2026. Red nose, zero restocks.'),
  doh('doh_superkube', 'Super Nice Kube', 'ultra', '🔷', 15, 8.0, 'botfarm', 'Limited run. Serial numbered. Already in a bot cart.'),
  doh('doh_snowglobe', 'Dough Snow Globe', 'select', '🔮', 12, 20.0, 'botfarm', 'A snow globe you can squeeze. Online-only. Carted in 0.4 seconds.'),
  doh('doh_advent', 'Squish-O-Ween Countdown', 'select', '📅', 30, 15.0, 'con', '24 doors of dough. Scalpers open door one and relist the rest.'),
  doh('doh_holo', 'Holo Kube', 'select', '💎', 12, 25.0, 'con', 'Convention exclusive. 500 made. 499 flipped.'),
  doh('doh_proto', 'Prototype Kube', 'grail', '🏆', 6, 150.0, 'factory', 'Never released. Walked out of the factory in a coat pocket.'),
  // The rest of the real catalog, satirized.
  doh('doh_mini', 'Mini Doh', 'common', '🫘', 3, 1.2, 'dollar', 'Keychain-sized. Loses its keychain in a week.'),
  doh('doh_pressdoh', 'Press-Doh', 'common', '🤏', 4, 1.3, 'dollar', 'Press it. It presses back. That is the whole product.'),
  doh('doh_crunchy', 'Krunchy Kube', 'uncommon', '🧊', 7, 2.6, 'fiveunder', 'Filled with beads that crunch. The sound is the hype.'),
  doh('doh_marbleez', 'Marbleezy', 'uncommon', '🔵', 7, 2.7, 'fiveunder', 'Swirled like a marble. Every one is "one of one" according to the listing.'),
  doh('doh_hearts', 'Doh Heartz', 'common', '❤️', 5, 1.4, 'hallmarq', 'Card-shop checkout bait. Grandma buys six.'),
  doh('doh_jewel', 'Groovy Jool', 'rare', '💠', 8, 3.8, 'hallmarq', 'Faceted like a gem. Priced like one on Marketplace.'),
 doh('doh_lava', 'Lava Squish n\' Flow', 'rare', '🌋', 9, 3.6, 'wallymart', 'Glitter lava inside. Do not microwave. Someone microwaved it.'),
  doh('doh_fuzz', 'Fuzz Baller', 'uncommon', '🧶', 7, 2.3, 'wallymart', 'Fuzzy on the outside, dough on the inside, lint forever.'),
  doh('doh_shaggy', 'Shaggy Doh', 'uncommon', '🦁', 7, 2.4, 'wallymart', 'Long strands. Sheds on everything you own.'),
  doh('doh_dazzler', 'Dippin\' Dazzlr', 'rare', '🍦', 9, 4.2, 'wholesale', 'Dipped in glitter. Looks like ice cream. Tastes like a lawsuit.'),
  doh('doh_sicle', 'Nice-Sickle', 'rare', '🍡', 8, 4.0, 'wholesale', 'Popsicle-shaped. Summer exclusive. Melts in resale value by September.'),
  doh('doh_jellyhops', 'Jelly Hopz', 'uncommon', '🐰', 6, 2.5, 'claw', 'Easter bunny dough. Hops once, then it is yours.'),
  doh('doh_ripples', 'Ripplez', 'uncommon', '〰️', 6, 2.2, 'claw', 'Ridged for texture. Also for "ASMR content".'),
  doh('doh_funkypup', 'Teenie Funky Pupper', 'rare', '🐶', 8, 3.5, 'claw', 'Sunglasses on a dough dog. The claw loves him. The claw lies.'),
  doh('doh_giant', 'Giant Doh', 'ultra', '🟣', 25, 5.0, 'wholesale', 'The size of a cantaloupe. Pallet-only. Sold with a forklift.'),
  // Sneaker-bro colorways: what happens when the Dunk guys discover dough.
  doh('doh_bred', '"Bred" Nice Kube', 'ultra', '🟥', 6, 15.0, 'botfarm', 'Black and red colorway. The sneaker bros named it. The sneaker bros bought it.'),
  doh('doh_panda', '"Panda" Dream Drip', 'rare', '🐼', 6, 6.0, 'botfarm', 'Black and white. Restocks monthly. Still "sold out" on the app.'),
  doh('doh_tripwhite', 'Triple White Glob', 'ultra', '⬜', 7, 10.0, 'con', 'All white. Yellows in a year. Deadstock only, bro.'),
  doh('doh_ff', 'Friends & Family Kube', 'select', '🤝', 6, 40.0, 'con', 'Never sold at retail. Gifted to "the team". On StockyX by Tuesday.'),
  doh('doh_sample_sz', 'Sample Size Glob', 'grail', '👟', 7, 200.0, 'factory', 'Pre-production colorway. Comes with a "legit check" nobody can perform.'),

  // ---- Squishies (slow-rise and jumbo squeezies) ----
  squish('sq_mochi', 'Mochi Mini', 'common', '🍡', 0.3, 1.0, 'dollar', 'Thirty for eight bucks. Lose twenty-nine in the couch.'),
  squish('sq_stress', 'Smiley Stress Ball', 'common', '🙂', 2, 1.1, 'dollar', 'The one from the dentist\'s office.'),
  squish('sq_butter', 'Butter Stick Slow-Rise', 'common', '🧈', 5, 1.5, 'fiveunder', 'Press it flat. Watch it ooze back. Repeat for six hours.'),
  squish('sq_cheese', 'Cheeze Kube', 'uncommon', '🧀', 6, 2.4, 'fiveunder', 'Climbing the charts while the dohs are sold out. Holes included.'),
  squish('sq_dumpling', 'Blind-Box Dumpling', 'uncommon', '🥟', 5, 2.8, 'fiveunder', 'Comes in a tiny steamer. You will buy the whole case for the chase.'),
  squish('sq_toast', 'Slow-Rise Toast', 'common', '🍞', 6, 1.4, 'bullseye', 'Smells like vanilla. Tastes like regret. Do not eat.'),
  squish('sq_avocado', 'Avocado Squeezy', 'uncommon', '🥑', 8, 1.9, 'bullseye', 'Half fruit, half stress relief, all shelf filler.'),
  squish('sq_nana', 'Jumbo Squeezy Nana', 'rare', '🍌', 13, 1.8, 'bullseye', 'Fourteen inches of banana weirdness. Blame the algorithm.'),
  squish('sq_laffy', 'Laffy Snack Nana', 'rare', '🍌', 15, 2.2, 'wallymart', 'The 17-inch one. "Sold out on the app" is part of the listing title now.'),
  squish('sq_taba', 'Taba Pillow Squish', 'uncommon', '🫧', 9, 2.0, 'wallymart', 'Pillowy. Zero resistance. The doh alternative for soft people.'),
  squish('sq_megaball', 'Mega Squeezy Ball (Silver)', 'ultra', '🪩', 20, 4.5, 'wallymart', 'Mega. Huge. Sealed. Silver. Rare, allegedly.'),
  squish('sq_strawb', 'Strawberry Mochi Jumbo', 'uncommon', '🍓', 10, 2.0, 'wholesale', 'Mochi, but the size of your head.'),
  squish('sq_nana17', '17-inch Smush Nana', 'ultra', '🍌', 25, 2.5, 'wholesale', 'The big one. Ships worse than a fridge. Buyers do not care.'),
  squish('sq_smusher', 'Smusher 5-Pack', 'select', '🎨', 40, 3.0, 'wholesale', 'Five colors, one box, out of stock everywhere. Set sold for triple digits.'),
  squish('sq_corn', 'Jumbo Corn Cob', 'rare', '🌽', 14, 2.4, 'claw', 'Kernels are individually squishy. Someone engineered this.'),
  squish('sq_peach', 'Peach Butt Squeezy', 'rare', '🍑', 12, 2.6, 'claw', 'You know exactly why it sells.'),
  squish('sq_clawcat', 'Claw Prize Mochi Cat', 'rare', '🐱', 4, 6.0, 'claw', 'Only drops from the claw. The claw is a liar.'),
  squish('sq_glownana', 'Glow Nana', 'ultra', '🌙', 18, 4.0, 'claw', 'Glows green in the dark. So does your eBay dashboard.'),
  squish('sq_bluecheese', 'Online-Only Blue Cheeze', 'ultra', '🫐', 8, 10.0, 'botfarm', 'Drop-only colorway. Bots ate the whole wheel.'),
  squish('sq_goldumpling', 'Secret Golden Dumpling', 'rare', '🥇', 5, 12.0, 'botfarm', 'One per case. The steamer lid is the tell.'),
  squish('sq_chrome', 'Con Chrome Smusher', 'select', '🪞', 25, 20.0, 'con', 'Booth exclusive. Mirror finish. Wristband line started at 4am.'),
  squish('sq_signed', 'Creator-Signed Nana', 'grail', '✍️', 15, 120.0, 'con', 'Signed by the account that made bananas a personality.'),
  squish('sq_sample', 'Factory Sample Nana', 'select', '🏷️', 13, 60.0, 'factory', 'Pre-production. Tag says SAMPLE. Buyers say YES.'),
  squish('sq_golden', 'Golden Nana (1 of 100)', 'grail', '👑', 13, 300.0, 'factory', 'Numbered. Gilded. The banana. Keep it sealed or it didn\'t happen.'),

  // Bullseye page: the endcap food squishies.
  squish('sq_burger', 'Squeezy Cheeseburger', 'common', '🍔', 8, 1.4, 'bullseye', 'Three layers of squish. Pickle is load-bearing.'),
  squish('sq_donut', 'Slow-Rise Donut', 'uncommon', '🍩', 8, 1.9, 'bullseye', 'Pink frosting. Sprinkles are painted on. Do not lick.'),
  squish('sq_pickle', 'Jumbo Pickle', 'uncommon', '🥒', 12, 2.1, 'bullseye', 'Twelve inches of brined weirdness. Smells faintly of dill. Why.'),
  squish('sq_boba', 'Boba Squeezy', 'rare', '🧋', 10, 2.6, 'bullseye', 'The pearls move. Nobody asked for this. Everyone bought it.'),
  squish('sq_taco', 'Squeezy Taco', 'rare', '🌮', 9, 2.8, 'bullseye', 'Shell is slow-rise, filling is fast-rise. Engineered.'),
  squish('sq_croissant', 'Croissant Slow-Rise', 'ultra', '🥐', 11, 4.0, 'bullseye', 'Bakery exclusive. Flakes are embroidered. Sold out at 7:02am.'),
  squish('sq_firstnana', 'The First Nana', 'grail', '🥇', 13, 180.0, 'bullseye', 'The endcap where it all started, allegedly. Tag dated. Mom cried.'),

  // Grails for the endgame.
  doh('doh_errorprint', 'Error Print Kube', 'grail', '🔁', 6, 160.0, 'factory', 'Tag printed upside down. Factory tried to recall it. Factory failed.'),
  doh('doh_staffglob', 'Con Staff Badge Glob', 'grail', '🪪', 7, 140.0, 'con', 'Only given to booth staff. One booth staffer had a cousin.'),
  doh('doh_founderkube', 'Founder-Signed Kube', 'grail', '✒️', 6, 220.0, 'botfarm', 'Signed by the founder at a trade show. The bot farm bought twelve.'),

  // Chase: one in a few thousand. The reason the pull screen exists.
  doh('doh_firstkube', 'The Kube That Started It', 'chase', '🧊', 4, 900.0, 'fiveunder', 'Original 2017 batch, original font, original shortage. Pulled from a discount bin. Nobody believes you.'),
  doh('doh_rainbowkube', 'One-of-One Rainbow Kube', 'chase', '🌈', 6, 1200.0, 'factory', 'The paint test. Every color at once. The warehouse guy swears there is only one.'),
  doh('doh_proto0', 'Prototype #0', 'chase', '0️⃣', 6, 1500.0, 'factory', 'Before the prototype. Hand-poured. Still slightly warm.'),
  squish('sq_holonana', 'Hologram Nana', 'chase', '🪩', 13, 1000.0, 'con', 'Changes color as you walk past the booth. The booth is gone. The banana remains.'),
  squish('sq_goldenticket', 'Golden Ticket Dumpling', 'chase', '🎫', 5, 800.0, 'wholesale', 'One steamer in every ten thousand cases. The lid is gold. You screamed in the aisle.'),
];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export function itemsForStore(storeId: string): ItemDef[] {
  return ITEMS.filter((i) => i.storeId === storeId);
}

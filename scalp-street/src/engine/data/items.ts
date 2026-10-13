import type { ItemDef, Rarity } from '../types';

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'ultra', 'select', 'grail'];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  ultra: 'Ultra Rare',
  select: 'Select Series',
  grail: 'Grail',
};

/** Shelf bonus: each unique item owned adds this % to global profit. */
export const RARITY_SHELF_BONUS: Record<Rarity, number> = {
  common: 0.005,
  uncommon: 0.01,
  rare: 0.02,
  ultra: 0.04,
  select: 0.08,
  grail: 0.2,
};

const squish = (
  id: string,
  name: string,
  rarity: Rarity,
  icon: string,
  retail: number,
  resaleMult: number,
  storeId: string,
  blurb: string,
): ItemDef => ({ id, name, family: 'squish', rarity, icon, retail, resaleMult, storeId, blurb });

const doh = (
  id: string,
  name: string,
  rarity: Rarity,
  icon: string,
  retail: number,
  resaleMult: number,
  storeId: string,
  blurb: string,
): ItemDef => ({ id, name, family: 'doh', rarity, icon, retail, resaleMult, storeId, blurb });

// Item names are affectionate parodies of real squish plush and doh fidget
// lines. Resale multipliers follow the real secondary market research:
// commons move near retail, grails go 50-500x.
export const ITEMS: ItemDef[] = [
  // ---- Dohs (fidget squeezies) ----
  doh('doh_generic', 'Off-Brand Squeezie', 'common', '🟢', 1, 0.8, 'dollar', 'It leaks. It is sticky. It is one dollar.'),
  doh('doh_stressball', 'Stressball Classic', 'common', '🟡', 2, 1.1, 'dollar', 'The one from the dentist\'s office.'),
  doh('doh_gumdrop', 'Gumdrop', 'common', '🍬', 6, 1.5, 'fiveunder', 'Translucent, jiggly, and gone from every shelf in the county.'),
  doh('doh_shroom', 'Groovy Shroom', 'common', '🍄', 5, 1.4, 'fiveunder', 'Squeeze it and it mushrooms. Literally.'),
  doh('doh_cloud', 'Cloud Pleaser', 'uncommon', '☁️', 6, 2.0, 'fiveunder', 'Soft like a cloud. Rare like a parking spot on Drop Day.'),
  doh('doh_kube', 'Nice Kube', 'uncommon', '🧊', 6, 3.0, 'fiveunder', 'The cube that started the shortage. 2 per family limit.'),
  doh('doh_dreamdrip', 'Dream Drip', 'uncommon', '💧', 6, 2.8, 'fiveunder', 'Shaped like a drip. Priced like a dream on resale.'),
  doh('doh_glob', 'Groovy Glob', 'rare', '🫧', 7, 3.5, 'wallymart', 'A glob with attitude. Sells in nine seconds.'),
  doh('doh_gummie', 'Gummie Bear', 'rare', '🧸', 7, 3.2, 'wallymart', 'Bear-shaped, bear-market proof.'),
  doh('doh_heart', 'Color Change Heart', 'uncommon', '💗', 5, 2.2, 'hallmarq', 'Warms in your hand. Cools in a scalper\'s cart.'),
  doh('doh_swirl', 'Candy Swirl Kube', 'rare', '🍥', 8, 5.0, 'hallmarq', 'Only the card shop gets these. Only you know that.'),
  doh('doh_berg', 'Nice Burg', 'rare', '🧊', 13, 3.0, 'hallmarq', 'The big cube. Titanic demand.'),
  doh('doh_teenie', 'Teenie Ice Baby', 'uncommon', '🍼', 8, 2.5, 'wallymart', 'Half the size, all of the hype.'),
  doh('doh_superkube', 'Super Nice Kube', 'ultra', '🔷', 15, 8.0, 'botfarm', 'Limited run. Serial numbered. Already in a bot cart.'),
  doh('doh_glow', 'Glow Glob', 'ultra', '✨', 9, 9.0, 'claw', 'Glows in the dark, like your resale listings at 3am.'),
  doh('doh_holo', 'Holo Kube', 'select', '💎', 12, 25.0, 'con', 'Convention exclusive. 500 made. 499 flipped.'),
  doh('doh_proto', 'Prototype Kube', 'grail', '🏆', 6, 150.0, 'factory', 'Never released. Walked out of the factory in a coat pocket.'),

  // ---- Squishes (plush) ----
  squish('sq_knockoff', 'Mystery Bin Plush', 'common', '🧸', 5, 0.9, 'dollar', 'Nobody knows what animal it is.'),
  squish('sq_pattie', 'Pattie the Cow', 'common', '🐄', 12, 1.3, 'bullseye', 'The entry-level cow. Everyone has her. Everyone still buys her.'),
  squish('sq_ava', 'Ava the Avocado', 'common', '🥑', 12, 1.2, 'bullseye', 'Half fruit, half pillow, all shelf-filler.'),
  squish('sq_mal', 'Mal the Frog', 'uncommon', '🐸', 15, 1.8, 'bullseye', 'Green. Round. Endcap bait.'),
  squish('sq_kam', 'Kam the Koala', 'uncommon', '🐨', 15, 2.0, 'bullseye', 'Ultra chill. Ultra listed on resale.'),
  squish('sq_archie', 'Archie the Axolotl', 'rare', '🦎', 20, 3.0, 'bullseye', 'Pink. Smiling. The face that launched a thousand ISO posts.'),
  squish('sq_bubba', 'Bubba the Sea Lion', 'uncommon', '🦭', 15, 2.1, 'wallymart', 'Barks when squeezed. Not really. But imagine.'),
  squish('sq_wisterria', 'Wisterria the Cow', 'rare', '🌸', 25, 4.0, 'wallymart', 'Periwinkle, floral belly, sold out in an hour. The spring grail.'),
  squish('sq_lamb', 'Metallic-Ear Lamb', 'rare', '🐑', 25, 3.8, 'wallymart', 'Pastel lamb. Metallic ears. Pharmacy exclusive.'),
  squish('sq_jumbo', '16-inch Floral Belly', 'rare', '🌼', 40, 2.8, 'wholesale', 'Takes up the whole back seat. Worth it.'),
  squish('sq_pallet', '24-inch Pallet Squish', 'ultra', '🛏️', 70, 3.5, 'wholesale', 'Bigger than a toddler. Ships worse than a fridge.'),
  squish('sq_clipon', 'Clip-On Egg Squish', 'uncommon', '🥚', 8, 2.4, 'wholesale', 'Keychain-sized. Fits in a jacket. Very fits in a jacket.'),
  squish('sq_fanya', 'Fanya the Purple Owl', 'ultra', '🦉', 15, 60.0, 'claw', 'Once hit $2,999 at auction. Then they re-released her. Oof.'),
  squish('sq_claw', 'Claw Prize Axolotl', 'rare', '🎀', 10, 4.5, 'claw', 'Only drops from the claw. The claw is a liar.'),
  squish('sq_lullabi', 'Lullabi the Hummingbird', 'ultra', '🐦', 25, 12.0, 'botfarm', 'Online-only spring exclusive. Carted in 0.4 seconds.'),
  squish('sq_bibi', 'Bibi the Pastel Bunny', 'rare', '🐰', 20, 5.0, 'botfarm', '12-inch Easter line. Gone before the eggs.'),
  squish('sq_founder', 'Founders Edition Cat', 'select', '🐈', 30, 80.0, 'con', 'Numbered. Tagged. Sealed in a bag you refuse to open.'),
  squish('sq_jax', 'Jax the Black Cat', 'grail', '🐈‍⬛', 20, 125.0, 'con', '500 made. The one. The grail. Tag intact or it didn\'t happen.'),
  squish('sq_jsk', 'JSK the Cat', 'grail', '👑', 20, 335.0, 'factory', 'Highest confirmed sale ever. Six figures of clout.'),
  squish('sq_sample', 'Factory Sample Cow', 'select', '🏷️', 12, 90.0, 'factory', 'Pre-production. Tag says SAMPLE. Buyers say YES.'),
];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export function itemsForStore(storeId: string): ItemDef[] {
  return ITEMS.filter((i) => i.storeId === storeId);
}

import type { ShapeId } from './shapes';

export type Finish = 'jelly' | 'matte' | 'glitter' | 'glow' | 'holo' | 'chrome' | 'gold' | 'fuzzy' | 'clear';
export type Face = 'happy' | 'panic' | 'cool' | 'sleepy' | 'smug' | 'none' | 'wink';

export interface ArtDef {
  shape: ShapeId;
  c1: string; // highlight / top color
  c2: string; // base color
  finish?: Finish;
  face?: Face;
  /** Secondary accent used by some shapes (stem, stick, pit). */
  accent?: string;
  /** Face ink color; defaults to dark. Light for black-bodied items. */
  faceColor?: string;
}

const d = (shape: ShapeId, c1: string, c2: string, finish: Finish = 'jelly', face: Face = 'happy', accent?: string): ArtDef => ({ shape, c1, c2, finish, face, accent });

// One art definition per item id. Colors are picked per real-world line
// (the Nice Cube family is icy blue, Dream Drop pastel, bananas yellow).
export const ART: Record<string, ArtDef> = {
  // Dohs
  doh_generic: d('ball', '#b8f0a0', '#5fa84a', 'matte', 'sleepy'),
  doh_panic: d('ball', '#ffd9a8', '#e0914a', 'matte', 'panic'),
  doh_gumdrop: d('gumdrop', '#ffb6e6', '#e04fb0', 'jelly'),
  doh_shroom: d('shroom', '#ff9ab6', '#d8456f', 'matte', 'happy'),
  doh_fruit: d('grape', '#c9a0ff', '#7a3fd0', 'jelly'),
  doh_cloud: d('cloud', '#ffffff', '#b9d4ff', 'matte', 'sleepy'),
  doh_kube: d('cube', '#c8f4ff', '#4fb8e8', 'jelly'),
  doh_dreamdrip: d('drop', '#e6d2ff', '#a07aff', 'jelly'),
  doh_glob: d('blob', '#b9ffd9', '#2fcf8a', 'jelly'),
  doh_gummie: d('bear', '#ffd3a8', '#f07a2a', 'jelly'),
  doh_coolkat: d('cat', '#ffe6b8', '#f0a63a', 'matte', 'cool'),
  doh_teenie: d('ice', '#e8fbff', '#8fd8f8', 'clear', 'sleepy'),
  doh_iceb: d('ice', '#e8fbff', '#7fcbf2', 'clear', 'happy'),
  doh_heart: d('heart', '#ffc2d6', '#ff5a8a', 'jelly'),
  doh_swirl: d('swirl', '#d8f6ff', '#4fa8e8', 'jelly'),
  doh_candy: d('swirl', '#ffd6ea', '#ff5aa0', 'jelly', 'wink'),
  doh_berg: d('berg', '#d6f6ff', '#3f9fd8', 'jelly'),
  doh_knitten: d('knit', '#f4e2ff', '#c08ae0', 'fuzzy', 'sleepy'),
  doh_glitter: d('cube', '#ffe9ff', '#c86ad8', 'glitter'),
  doh_ghost: d('ghost', '#f4fff4', '#a8f0a8', 'glow'),
  doh_lantern: d('pumpkin', '#ffc07a', '#f07a1a', 'glow', 'smug'),
  doh_glow: d('blob', '#eaffb0', '#8ae03a', 'glow'),
  doh_reindeer: d('deer', '#e4c3a0', '#a66b3f', 'fuzzy'),
  doh_superkube: d('berg', '#d4e4ff', '#3f6fe8', 'jelly', 'smug'),
  doh_snowglobe: d('globe', '#e8f6ff', '#5fb8ff', 'clear', 'happy', '#7a4b2a'),
  doh_advent: d('calendar', '#ffffff', '#3a9a5a', 'matte', 'none'),
  doh_holo: d('cube', '#ffffff', '#b0c0ff', 'holo'),
  doh_proto: d('proto', '#eeeeee', '#9a9a9a', 'matte', 'none'),
  doh_mini: d('bean', '#ffd0d0', '#ff6a6a', 'jelly', 'happy'),
  doh_pressdoh: d('press', '#d0e8ff', '#6aa0e0', 'matte', 'sleepy'),
  doh_crunchy: d('cube', '#fff0c0', '#f0b030', 'glitter', 'happy'),
  doh_marbleez: d('swirl', '#e0d0ff', '#6a5ad0', 'jelly', 'happy'),
  doh_hearts: d('heart', '#ffd0e0', '#ff7aa8', 'matte', 'wink'),
  doh_jewel: d('jewel', '#d0ffff', '#2ab8c8', 'clear', 'none'),
  doh_lava: d('lava', '#ffd0a0', '#ff5a2a', 'jelly', 'happy'),
  doh_fuzz: d('fuzz', '#ffe0ff', '#d070e0', 'fuzzy', 'sleepy'),
  doh_shaggy: d('fuzz', '#ffe8c0', '#e0a040', 'fuzzy', 'happy'),
  doh_dazzler: d('popsicle', '#ffe0f0', '#ff6ab0', 'glitter', 'happy', '#d9b98a'),
  doh_sicle: d('popsicle', '#d0f8ff', '#4ac8f0', 'clear', 'happy', '#d9b98a'),
  doh_jellyhops: d('bunny', '#e0ffe0', '#6ad87a', 'jelly', 'happy'),
  doh_ripples: d('wave', '#d0e8ff', '#5a90e0', 'jelly', 'sleepy'),
  doh_funkypup: d('pup', '#ffe0c0', '#e0905a', 'matte', 'cool'),
  doh_giant: d('bigball', '#e8d0ff', '#8a4ad8', 'jelly', 'happy'),
  doh_bred: { ...d('cube', '#ff5a5a', '#1a1a1a', 'jelly', 'smug'), faceColor: '#ffffff' },
  doh_panda: { ...d('drop', '#ffffff', '#1f1f1f', 'matte', 'smug'), faceColor: '#ffffff' },
  doh_tripwhite: d('blob', '#ffffff', '#e8e8e8', 'matte', 'cool'),
  doh_ff: d('cube', '#ffe9b0', '#d8a020', 'gold', 'smug'),
  doh_sample_sz: d('blob', '#f0f0f0', '#c0c0c0', 'chrome', 'cool'),

  // Squishies
  sq_mochi: d('mochi', '#ffffff', '#ffc8d8', 'matte', 'sleepy'),
  sq_stress: d('ball', '#ffff9a', '#f0d020', 'matte', 'happy'),
  sq_butter: d('butter', '#fff6b0', '#f0c830', 'matte', 'sleepy'),
  sq_cheese: d('cheese', '#ffe680', '#f0b020', 'matte', 'happy'),
  sq_dumpling: d('dumpling', '#ffffff', '#f0e0c8', 'matte', 'sleepy'),
  sq_toast: d('toast', '#ffe6b0', '#c88a3a', 'matte', 'happy'),
  sq_avocado: d('avocado', '#9ad06a', '#3a7a2a', 'matte', 'happy'),
  sq_nana: d('banana', '#fff2a0', '#f0c020', 'matte', 'happy', '#7a5a2a'),
  sq_laffy: d('banana', '#fff6b8', '#f2cc30', 'matte', 'wink', '#7a5a2a'),
  sq_taba: d('cloud', '#ffffff', '#ffd6e8', 'fuzzy', 'sleepy'),
  sq_megaball: d('bigball', '#ffffff', '#b8b8c8', 'chrome', 'cool'),
  sq_strawb: d('strawberry', '#ff9ab0', '#e0304a', 'matte', 'happy'),
  sq_nana17: d('banana', '#fff0a0', '#e8b810', 'matte', 'smug', '#7a5a2a'),
  sq_smusher: d('pack', '#ffffff', '#2a2a44', 'matte', 'none'),
  sq_corn: d('corn', '#fff0a0', '#f0c020', 'matte', 'happy'),
  sq_peach: d('peach', '#ffd0b0', '#ff8a5a', 'fuzzy', 'wink'),
  sq_clawcat: d('kitty', '#ffffff', '#ffd0e0', 'matte', 'happy'),
  sq_glownana: d('banana', '#e8ffa0', '#9ae020', 'glow', 'smug', '#4a6a2a'),
  sq_bluecheese: d('cheese', '#d0e0ff', '#5a7ae0', 'matte', 'smug'),
  sq_goldumpling: d('dumpling', '#fff0b0', '#e0b020', 'gold', 'happy'),
  sq_chrome: d('pack', '#ffffff', '#8a8a9a', 'chrome', 'none'),
  sq_signed: d('banana', '#fff2a0', '#f0c020', 'matte', 'cool', '#7a5a2a'),
  sq_sample: d('proto', '#fff6c0', '#f0c030', 'matte', 'none'),
  sq_golden: d('banana', '#fff6c0', '#e0a010', 'gold', 'smug', '#7a5a2a'),
};

export const FALLBACK_ART: ArtDef = d('ball', '#dddddd', '#888888', 'matte', 'happy');

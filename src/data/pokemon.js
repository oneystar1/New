// Species table. Stats are 0-100.
//   power   - exit velocity / home run distance
//   contact - how forgiving swing timing & bat alignment are
//   speed   - running speed (base running, fielder range)
//   arm     - throw speed
//   glove   - catch radius / error chance
//   pitch   - { velo, control, breakAmt, stamina } used when pitching
// Each species has an elemental "type" which decides its special pitch.

function sp(name, type, power, contact, speed, arm, glove, pitch) {
  return { name, type, power, contact, speed, arm, glove, pitch: { velo: pitch[0], control: pitch[1], breakAmt: pitch[2], stamina: pitch[3] } };
}

export const SPECIES = {
  // Electric / Normal
  pikachu:    sp('Pikachu',    'electric', 55, 80, 95, 60, 75, [78, 70, 60, 70]),
  raichu:     sp('Raichu',     'electric', 75, 65, 85, 80, 65, [90, 60, 65, 75]),
  eevee:      sp('Eevee',      'normal',   50, 85, 85, 55, 80, [70, 80, 50, 70]),
  jigglypuff: sp('Jigglypuff', 'normal',   45, 75, 50, 45, 70, [60, 85, 70, 65]),
  meowth:     sp('Meowth',     'normal',   50, 80, 80, 60, 70, [72, 72, 55, 60]),
  snorlax:    sp('Snorlax',    'normal',   98, 55, 20, 70, 50, [85, 50, 40, 95]),
  clefairy:   sp('Clefairy',   'normal',   55, 75, 60, 50, 75, [65, 80, 75, 70]),
  magnemite:  sp('Magnemite',  'electric', 60, 60, 55, 85, 85, [88, 85, 45, 80]),
  electabuzz: sp('Electabuzz', 'electric', 85, 60, 70, 90, 60, [95, 60, 55, 80]),
  // Fire
  charmander: sp('Charmander', 'fire',     60, 75, 70, 65, 70, [80, 70, 55, 70]),
  charmeleon: sp('Charmeleon', 'fire',     75, 65, 75, 75, 65, [88, 62, 60, 75]),
  charizard:  sp('Charizard',  'fire',     95, 55, 65, 90, 60, [98, 55, 65, 85]),
  vulpix:     sp('Vulpix',     'fire',     45, 85, 80, 50, 80, [68, 82, 70, 65]),
  growlithe:  sp('Growlithe',  'fire',     65, 70, 85, 70, 75, [82, 68, 50, 72]),
  ponyta:     sp('Ponyta',     'fire',     55, 70, 98, 55, 70, [78, 65, 50, 70]),
  magmar:     sp('Magmar',     'fire',     85, 55, 55, 85, 55, [92, 58, 62, 80]),
  flareon:    sp('Flareon',    'fire',     80, 65, 70, 70, 65, [85, 65, 55, 75]),
  cyndaquil:  sp('Cyndaquil',  'fire',     50, 80, 75, 55, 75, [70, 78, 60, 65]),
  // Water
  squirtle:   sp('Squirtle',   'water',    55, 78, 65, 70, 80, [76, 78, 65, 72]),
  wartortle:  sp('Wartortle',  'water',    70, 68, 60, 80, 78, [84, 70, 68, 78]),
  blastoise:  sp('Blastoise',  'water',    92, 55, 40, 95, 70, [96, 60, 60, 90]),
  psyduck:    sp('Psyduck',    'water',    50, 65, 55, 55, 60, [68, 55, 85, 70]),
  poliwag:    sp('Poliwag',    'water',    40, 80, 80, 50, 75, [66, 80, 70, 65]),
  staryu:     sp('Staryu',     'water',    55, 70, 75, 75, 90, [80, 75, 72, 70]),
  lapras:     sp('Lapras',     'water',    85, 65, 35, 80, 65, [82, 72, 70, 92]),
  vaporeon:   sp('Vaporeon',   'water',    70, 75, 75, 65, 75, [80, 75, 75, 78]),
  magikarp:   sp('Magikarp',   'water',    30, 50, 60, 30, 40, [50, 40, 30, 50]),
  // Grass
  bulbasaur:  sp('Bulbasaur',  'grass',    58, 78, 60, 65, 75, [74, 76, 68, 72]),
  ivysaur:    sp('Ivysaur',    'grass',    72, 68, 55, 75, 70, [82, 70, 72, 78]),
  venusaur:   sp('Venusaur',   'grass',    94, 55, 35, 85, 65, [90, 62, 75, 90]),
  oddish:     sp('Oddish',     'grass',    40, 82, 70, 45, 80, [64, 82, 75, 65]),
  bellsprout: sp('Bellsprout', 'grass',    45, 70, 65, 70, 85, [72, 70, 88, 68]),
  exeggutor:  sp('Exeggutor',  'grass',    88, 55, 30, 70, 55, [84, 55, 70, 85]),
  tangela:    sp('Tangela',    'grass',    50, 72, 55, 60, 95, [70, 75, 90, 75]),
  chikorita:  sp('Chikorita',  'grass',    48, 85, 78, 55, 80, [70, 85, 65, 70]),
  weepinbell: sp('Weepinbell', 'grass',    62, 65, 60, 78, 72, [80, 66, 82, 72]),
  // Fighting / Ground / Rock
  machamp:    sp('Machamp',    'fighting', 96, 58, 55, 95, 70, [96, 55, 50, 85]),
  machoke:    sp('Machoke',    'fighting', 82, 62, 60, 88, 65, [92, 62, 55, 82]),
  primeape:   sp('Primeape',   'fighting', 72, 60, 88, 75, 60, [88, 50, 60, 70]),
  rhydon:     sp('Rhydon',     'ground',   92, 50, 35, 85, 60, [90, 55, 70, 90]),
  golem:      sp('Golem',      'rock',     88, 52, 30, 80, 75, [86, 60, 72, 92]),
  marowak:    sp('Marowak',    'ground',   70, 75, 60, 80, 85, [82, 78, 65, 75]),
  sandslash:  sp('Sandslash',  'ground',   60, 72, 75, 65, 88, [76, 72, 70, 72]),
  tauros:     sp('Tauros',     'normal',   85, 66, 92, 70, 60, [90, 58, 50, 78]),
  kangaskhan: sp('Kangaskhan', 'normal',   80, 70, 65, 72, 78, [84, 70, 60, 85]),
  // Poison / Ghost / Bug / Flying
  gengar:     sp('Gengar',     'ghost',    78, 68, 85, 75, 70, [90, 68, 95, 85]),
  muk:        sp('Muk',        'poison',   84, 55, 25, 70, 65, [78, 50, 85, 95]),
  arbok:      sp('Arbok',      'poison',   66, 72, 72, 78, 70, [84, 74, 80, 75]),
  nidoking:   sp('Nidoking',   'poison',   90, 58, 68, 85, 65, [92, 60, 68, 82]),
  kabutops:   sp('Kabutops',   'rock',     74, 76, 80, 88, 80, [88, 72, 60, 72]),
  scyther:    sp('Scyther',    'bug',      70, 80, 95, 70, 82, [86, 74, 72, 68]),
  dodrio:     sp('Dodrio',     'flying',   62, 74, 98, 60, 70, [84, 66, 55, 65]),
  poliwrath:  sp('Poliwrath',  'water',    76, 64, 70, 82, 78, [88, 66, 70, 85]),
  magneton:   sp('Magneton',   'electric', 64, 62, 50, 90, 92, [92, 90, 48, 88]),
};

// Pitch repertoire. Direction conventions: dx>0 breaks toward the pitcher's
// glove side for a right hander (negative x = toward a right-handed batter),
// dy<0 sinks. Values are feet of movement over the flight.
export const PITCHES = {
  fastball:  { name: 'Fastball',  key: 'up',    speed: 1.00, dx: 0,    dy: 0.3,  wobble: 0, stamina: 3 },
  curve:     { name: 'Curveball', key: 'down',  speed: 0.80, dx: 0.6,  dy: -1.6, wobble: 0, stamina: 4 },
  slider:    { name: 'Slider',    key: 'right', speed: 0.90, dx: 1.5,  dy: -0.4, wobble: 0, stamina: 4 },
  changeup:  { name: 'Changeup',  key: 'left',  speed: 0.72, dx: -0.4, dy: -0.9, wobble: 0, stamina: 3 },
  // Type specials (selected with B)
  flame:     { name: 'Flame Ball', speed: 1.18, dx: 0,    dy: 0.6,  wobble: 0,   stamina: 9, special: 'fire' },
  bubble:    { name: 'Bubble Ball', speed: 0.62, dx: -1.2, dy: -2.2, wobble: 0,  stamina: 8, special: 'water' },
  vine:      { name: 'Vine Ball',  speed: 0.85, dx: -2.0, dy: -0.6, wobble: 0,   stamina: 8, special: 'grass' },
  thunder:   { name: 'Thunderbolt', speed: 1.05, dx: 0,   dy: 0,    wobble: 2.2, stamina: 9, special: 'electric' },
  tackle:    { name: 'Body Slam',  speed: 1.10, dx: 0.8,  dy: 0.4,  wobble: 0,   stamina: 8, special: 'normal' },
  megapunch: { name: 'Mega Punch', speed: 1.22, dx: 0,    dy: 0.7,  wobble: 0,   stamina: 9, special: 'fighting' },
  dig:       { name: 'Dig Sinker', speed: 0.95, dx: 0.5,  dy: -2.8, wobble: 0,   stamina: 8, special: 'ground' },
  rockslide: { name: 'Rock Slide', speed: 1.08, dx: 1.4,  dy: -1.2, wobble: 0,   stamina: 8, special: 'rock' },
  sludge:    { name: 'Sludge Ball', speed: 0.6, dx: -0.9, dy: -2.4, wobble: 0.8, stamina: 8, special: 'poison' },
  shadow:    { name: 'Shadow Ball', speed: 1.0, dx: 0.9,  dy: -0.9, wobble: 0,   stamina: 9, special: 'ghost', vanish: true },
  fury:      { name: 'Fury Cutter', speed: 1.06, dx: 2.0, dy: -0.3, wobble: 0,   stamina: 8, special: 'bug' },
  drill:     { name: 'Drill Peck', speed: 1.12, dx: -0.7, dy: 0.3,  wobble: 1.2, stamina: 8, special: 'flying' },
};

export const SPECIAL_BY_TYPE = {
  fire: 'flame', water: 'bubble', grass: 'vine', electric: 'thunder', normal: 'tackle',
  fighting: 'megapunch', ground: 'dig', rock: 'rockslide', poison: 'sludge', ghost: 'shadow', bug: 'fury', flying: 'drill',
};

export const TYPE_COLORS = {
  fire: [240, 100, 40], water: [70, 140, 230], grass: [90, 190, 90], electric: [250, 210, 50], normal: [190, 180, 160],
  fighting: [190, 60, 50], ground: [210, 170, 90], rock: [160, 140, 100], poison: [160, 80, 180], ghost: [110, 70, 160],
  bug: [150, 190, 60], flying: [150, 170, 230],
};

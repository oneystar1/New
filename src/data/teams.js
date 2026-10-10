// Teams: 9 species each, in batting order, with their fielding position.
// Positions: P C 1B 2B 3B SS LF CF RF
const POS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

function team(id, city, name, colors, lineup) {
  // lineup: array of [species, position] in batting order
  return {
    id, city, name, colors,
    roster: lineup.map(([species, pos], i) => ({ species, pos, order: i })),
  };
}

export const TEAMS = [
  team('pallet', 'Pallet', 'Pikas',
    { primary: [250, 200, 40], secondary: [200, 140, 20], pants: [240, 240, 240], text: '#ffd84a' },
    [['pikachu', 'SS'], ['eevee', 'CF'], ['raichu', '3B'], ['snorlax', '1B'], ['electabuzz', 'P'],
     ['meowth', 'LF'], ['clefairy', '2B'], ['jigglypuff', 'C'], ['magnemite', 'RF']]),
  team('cinnabar', 'Cinnabar', 'Blaze',
    { primary: [220, 50, 40], secondary: [140, 20, 20], pants: [240, 230, 220], text: '#ff5a4a' },
    [['ponyta', 'CF'], ['growlithe', 'LF'], ['charizard', 'P'], ['magmar', '1B'], ['flareon', '3B'],
     ['charmeleon', 'RF'], ['charmander', 'SS'], ['vulpix', '2B'], ['cyndaquil', 'C']]),
  team('cerulean', 'Cerulean', 'Tides',
    { primary: [50, 110, 220], secondary: [20, 60, 150], pants: [235, 240, 250], text: '#5aa0ff' },
    [['vaporeon', 'CF'], ['squirtle', 'SS'], ['lapras', '1B'], ['blastoise', 'P'], ['wartortle', '3B'],
     ['staryu', '2B'], ['poliwag', 'LF'], ['psyduck', 'C'], ['magikarp', 'RF']]),
  team('viridian', 'Viridian', 'Vines',
    { primary: [50, 160, 70], secondary: [20, 100, 40], pants: [240, 240, 230], text: '#5ad66a' },
    [['chikorita', 'CF'], ['oddish', '2B'], ['ivysaur', '3B'], ['venusaur', 'P'], ['exeggutor', '1B'],
     ['weepinbell', 'LF'], ['bulbasaur', 'SS'], ['tangela', 'C'], ['bellsprout', 'RF']]),
  team('pewter', 'Pewter', 'Bruisers',
    { primary: [150, 105, 60], secondary: [90, 55, 25], pants: [225, 215, 200], text: '#d2a060' },
    [['tauros', 'CF'], ['primeape', 'LF'], ['machamp', '1B'], ['rhydon', '3B'], ['kangaskhan', 'C'],
     ['machoke', 'P'], ['marowak', 'SS'], ['sandslash', '2B'], ['golem', 'RF']]),
  team('lavender', 'Lavender', 'Shadows',
    { primary: [125, 70, 175], secondary: [70, 30, 110], pants: [225, 215, 240], text: '#b48aff' },
    [['dodrio', 'CF'], ['scyther', 'LF'], ['nidoking', '1B'], ['gengar', 'P'], ['muk', 'C'],
     ['kabutops', '3B'], ['poliwrath', '2B'], ['arbok', 'SS'], ['magneton', 'RF']]),
];

export { POS };
export function teamById(id) { return TEAMS.find(t => t.id === id); }

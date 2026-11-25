// IRON DIAMOND — robot frames, the 12 clubs, roster generation, league save.
'use strict';
const CLASSES = {
  STRIKER: { name: 'STRIKER', desc: 'Balanced combat android', h: 7.0, hp: 110, base: { pow: 5, con: 6, spd: 6, arm: 6, fld: 6, fgt: 5 } },
  TITAN:   { name: 'TITAN',   desc: 'Treaded heavy siege frame', h: 8.0, hp: 165, base: { pow: 8, con: 4, spd: 3, arm: 6, fld: 4, fgt: 8 } },
  VECTOR:  { name: 'VECTOR',  desc: 'Hover drone, blistering speed', h: 6.6, hp: 80, base: { pow: 3, con: 7, spd: 9, arm: 5, fld: 8, fgt: 3 } },
  RAPTOR:  { name: 'RAPTOR',  desc: 'Digitigrade hunter-killer', h: 7.2, hp: 105, base: { pow: 6, con: 5, spd: 7, arm: 5, fld: 6, fgt: 7 } },
};
const CLASS_KEYS = Object.keys(CLASSES);
// mix = weights for STRIKER, TITAN, VECTOR, RAPTOR ; bias adds to every robot's stats ; tier 1..3
const TEAMS = [
  { id: 'NTR', city: 'NEO TOKYO', name: 'RONIN', p: '#e8213b', s: '#f2f4f8', g: '#ff3d5a', emblem: 'blade', mix: [3, 1, 2, 3], bias: { fgt: 1, spd: 1 }, tier: 3 },
  { id: 'DIW', city: 'DETROIT', name: 'IRONWORKS', p: '#ff7a1a', s: '#3a4352', g: '#ffa04a', emblem: 'gear', mix: [2, 4, 0, 1], bias: { pow: 1, fgt: 1, spd: -1 }, tier: 2 },
  { id: 'NVV', city: 'NOVA VEGAS', name: 'VOLTAGE', p: '#8a3dff', s: '#ffe03d', g: '#ffe03d', emblem: 'bolt', mix: [2, 1, 3, 1], bias: { con: 1, spd: 1 }, tier: 2 },
  { id: 'LBE', city: 'LUNAR BASE', name: 'ECLIPSE', p: '#c8d2e6', s: '#2a5cff', g: '#58a6ff', emblem: 'moon', mix: [3, 1, 2, 1], bias: { fld: 1, arm: 1 }, tier: 3 },
  { id: 'MDD', city: 'MARS COLONY', name: 'DUST DEVILS', p: '#c2471f', s: '#f0c38a', g: '#ff6a2a', emblem: 'tri', mix: [1, 2, 1, 3], bias: { pow: 1, con: -1 }, tier: 1 },
  { id: 'ATA', city: 'ATLANTIS', name: 'ABYSS', p: '#0fb5a6', s: '#0d2346', g: '#3dfff0', emblem: 'wave', mix: [2, 1, 2, 2], bias: { arm: 1 }, tier: 1 },
  { id: 'SVK', city: 'SILICON VALLEY', name: 'KERNELS', p: '#2bd96b', s: '#11151c', g: '#5dff8e', emblem: 'chip', mix: [3, 0, 3, 1], bias: { con: 2, pow: -1 }, tier: 2 },
  { id: 'ACG', city: 'ARCTIC CIRCUIT', name: 'GLACIERS', p: '#9fe6ff', s: '#ffffff', g: '#c8f4ff', emblem: 'flake', mix: [2, 3, 1, 0], bias: { fld: 1 }, tier: 1 },
  { id: 'CSP', city: 'CAIRO', name: 'SPHINX PROTOCOL', p: '#e8b923', s: '#15120c', g: '#ffd84a', emblem: 'eye', mix: [2, 2, 1, 2], bias: { arm: 1, fgt: 1 }, tier: 3 },
  { id: 'BBZ', city: 'BERLIN', name: 'BLITZ', p: '#1c1c22', s: '#ff2f2f', g: '#ff4a4a', emblem: 'chevron', mix: [2, 2, 0, 3], bias: { pow: 1, fgt: 1, fld: -1 }, tier: 2 },
  { id: 'RJU', city: 'RIO', name: 'JAGUAR UNITS', p: '#18a34a', s: '#ffd21f', g: '#ffe14a', emblem: 'claw', mix: [1, 1, 2, 4], bias: { spd: 1, fgt: 1, arm: -1 }, tier: 1 },
  { id: 'SSF', city: 'SYDNEY', name: 'SOLAR FLARES', p: '#ff8a1f', s: '#1fb6ff', g: '#ffc04a', emblem: 'sun', mix: [3, 1, 2, 1], bias: { pow: 1 }, tier: 2 },
];
const CALLSIGNS = ['KESTREL', 'TORQUE', 'RIVET', 'HALO', 'STATIC', 'VANTA', 'ION', 'PATCH', 'BOLT', 'NYX', 'COG', 'EMBER', 'FLUX', 'GAUGE', 'HEX', 'JOLT', 'KRAIT',
  'LUMEN', 'MAKO', 'NOVA', 'ONYX', 'PISTON', 'QUARK', 'ROOK', 'SERVO', 'TANGO', 'VOLT', 'WRAITH', 'XENO', 'YAW', 'ZED', 'ARC', 'BYTE', 'CINDER', 'DYNAMO', 'ECHO', 'FERRO',
  'GLITCH', 'HAVOC', 'IGNIS', 'JACKAL', 'KARMA', 'LATCH', 'MAGNET', 'NEON', 'OMEN', 'PULSE', 'QUILL', 'RAZOR', 'SPROCKET', 'TITANIA', 'UMBRA', 'VECTRA', 'WIDGET', 'XACTO',
  'YOKAI', 'ZENITH', 'ANVIL', 'BLITZEN', 'CHROME', 'DRIFT', 'ENIGMA', 'FUSE', 'GRIT', 'HELIX', 'INDIGO', 'JUNO', 'KILO', 'LANCE', 'MERCURY', 'NIMBUS', 'OXIDE', 'PRISM',
  'AXLE', 'BARRAGE', 'CAIRN', 'DAGGER', 'EDDY', 'FALCON', 'GALE', 'HUSK', 'IRIS', 'JINX', 'KNOX', 'LYNX', 'MANTIS', 'NEEDLE', 'ORBIT', 'PIKE', 'QUASAR', 'RIFT', 'SABLE', 'TALON',
  'UPLINK', 'VORTEX', 'WARDEN', 'XENITH', 'YIELD', 'ZINC', 'APEX', 'BRAVO', 'CIPHER', 'DELTA', 'EPOCH', 'FRACTAL', 'GOLEM', 'HAWK', 'IMPULSE', 'JETT', 'KRYPT', 'LASER', 'MOTH', 'NOMAD',
  'OPAL', 'PHANTOM', 'QUBIT', 'RELAY', 'SPECTER', 'TRIDENT', 'UMBER', 'VIPER', 'WOLFRAM', 'XRAY', 'YONDER', 'ZEPHYR', 'ATLAS', 'BLADE', 'COBALT', 'DIODE', 'ELEKTRA', 'FROST', 'GAMMA',
  'HYDRA', 'ICARUS', 'JUGGERNAUT', 'KITE', 'LOCUS', 'MAGMA', 'NEXUS', 'OCTANE', 'PYLON', 'QUANTA', 'RADIX', 'SIGMA', 'TESLA', 'ULTRA', 'VALVE', 'WIRE', 'XENON', 'YTTRIUM', 'ZERO',
  'ARGON', 'BOLTZ', 'CRANK', 'DUSK', 'EMBERLY', 'FLINT', 'GYRO', 'HALCYON', 'INGOT', 'JOULE', 'KELVIN', 'LUMA', 'MOTOR', 'NICKEL', 'OHM', 'PISTIL', 'QUARTZ', 'ROTOR', 'SOLDER', 'TORCH'];
// every club draws callsigns from its own slice of a fixed shuffle, so names never repeat across the league
const NAME_POOL = (() => { const a = CALLSIGNS.slice(), rng = mulberry(4242); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; })();
const POS_ORDER = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
// class preference per position (weights multiplied with team mix)
const POS_PREF = { P: [3, 1, 1, 1], C: [1, 4, 0, 1], '1B': [1, 3, 1, 1], '2B': [2, 0, 3, 2], '3B': [2, 2, 1, 2], SS: [1, 0, 3, 3], LF: [2, 1, 2, 2], CF: [1, 0, 4, 2], RF: [2, 1, 2, 2] };

function makeRobot(team, rng, cls, pos, num, usedNames) {
  const C = CLASSES[cls], b = team.bias || {};
  const r = { cls, pos, num, hand: rng() < 0.3 ? -1 : 1, alive: true, team: team.id };
  const ti = TEAMS.indexOf(team), per = Math.floor(NAME_POOL.length / TEAMS.length); let name;
  do { name = NAME_POOL[ti * per + Math.floor(rng() * per)]; } while (usedNames.has(name) && usedNames.size < per); usedNames.add(name);
  r.name = name; r.serial = `${team.id}-${String(num).padStart(2, '0')}`;
  for (const k of ['pow', 'con', 'spd', 'arm', 'fld', 'fgt']) r[k] = clamp(Math.round(C.base[k] + (b[k] || 0) + (rng() * 3 - 1.4) + (team.tier - 2) * 0.5), 1, 10);
  r.vel = clamp(Math.round(4 + rng() * 4 + (team.tier - 2) * 0.7 + (pos === 'P' ? 1.5 : 0)), 1, 10);
  r.brk = clamp(Math.round(4 + rng() * 4 + (team.tier - 2) * 0.7 + (pos === 'P' ? 1 : 0)), 1, 10);
  r.maxHp = Math.round(C.hp * (0.9 + rng() * 0.2) / 5) * 5; r.hp = r.maxHp; r.battery = 100;
  return r;
}
function weightedPick(rng, weights) { const tot = weights.reduce((a, b) => a + b, 0); let x = rng() * tot; for (let i = 0; i < weights.length; i++) { x -= weights[i]; if (x <= 0) return i; } return weights.length - 1; }
function buildRoster(teamIdx, seed = 0) {
  const team = TEAMS[teamIdx], rng = mulberry(1000 + teamIdx * 7919 + seed), used = new Set();
  const nums = new Set(); const num = () => { let n; do { n = 1 + Math.floor(rng() * 89); } while (nums.has(n)); nums.add(n); return n; };
  const starters = POS_ORDER.map(pos => { const w = team.mix.map((m, i) => m * POS_PREF[pos][i] + 0.05); return makeRobot(team, rng, CLASS_KEYS[weightedPick(rng, w)], pos, num(), used); });
  const bench = [makeRobot(team, rng, 'STRIKER', 'P', num(), used)];
  bench[0].pos = 'RP';
  for (let i = 0; i < 3; i++) { const r = makeRobot(team, rng, CLASS_KEYS[weightedPick(rng, team.mix.map(m => m + 0.2))], 'BN', num(), used); bench.push(r); }
  // batting order: best contact/speed first, power in the middle, pitcher last
  const order = starters.filter(r => r.pos !== 'P').sort((a, b) => (b.con * 2 + b.spd) - (a.con * 2 + a.spd));
  const power = order.splice(2, 4).sort((a, b) => b.pow - a.pow);
  const lineup = [order[0], order[1], power[1], power[0], power[2], power[3], ...order.slice(2), starters.find(r => r.pos === 'P')];
  return { teamIdx, lineup, bench };
}
function teamRating(teamIdx) { const ro = buildRoster(teamIdx); const all = ro.lineup; const avg = k => all.reduce((a, r) => a + r[k], 0) / all.length; return { pow: avg('pow'), con: avg('con'), spd: avg('spd'), fld: (avg('fld') + avg('arm')) / 2, fgt: avg('fgt') }; }
function cloneRoster(ro) { return JSON.parse(JSON.stringify(ro)); }
function scrapBot(team, n) { return { cls: 'VECTOR', pos: 'BN', num: 90 + n, hand: 1, alive: true, team: team.id, name: 'SCRAP-' + n, serial: 'SCR-' + n, pow: 2, con: 3, spd: 4, arm: 3, fld: 3, fgt: 2, vel: 3, brk: 3, maxHp: 50, hp: 50, battery: 100, scrap: true }; }

// upgrades purchased in Gauntlet mode apply to every robot on the player's club
const UPGRADES = [
  { k: 'pow', name: 'FUSION CORE', desc: '+1 POWER for every bot', cost: [450, 800, 1300] },
  { k: 'con', name: 'TARGETING OPTICS', desc: '+1 CONTACT for every bot', cost: [450, 800, 1300] },
  { k: 'spd', name: 'MAG-SERVO LEGS', desc: '+1 SPEED for every bot', cost: [450, 800, 1300] },
  { k: 'fgt', name: 'COMBAT CHIP', desc: '+1 FIGHT for every bot', cost: [450, 800, 1300] },
  { k: 'arm', name: 'RAIL ACTUATORS', desc: '+1 ARM / VELOCITY', cost: [450, 800, 1300] },
  { k: 'hp', name: 'NANO PLATING', desc: '+15 max ARMOR for every bot', cost: [500, 900, 1400] },
];
function stat(r, k, side) { const up = side && side.up ? (side.up[k] || 0) : 0; if (k === 'vel') return clamp(r.vel + (side && side.up ? (side.up.arm || 0) : 0), 1, 12); return clamp(r[k] + up, 1, 12); }
function maxHp(r, side) { return r.maxHp + (side && side.up ? (side.up.hp || 0) * 15 : 0); }

const SAVE_KEY = 'ironDiamond.gauntlet.v1';
function newGauntlet(teamIdx) {
  const others = TEAMS.map((t, i) => i).filter(i => i !== teamIdx);
  others.sort((a, b) => TEAMS[a].tier - TEAMS[b].tier + (Math.random() - 0.5) * 0.9);
  const opp = [others[0], others[2], others[4], others[6], others[8]];
  const final = others.filter(i => !opp.includes(i)).sort((a, b) => TEAMS[b].tier - TEAMS[a].tier)[0];
  opp.push(final);
  return { teamIdx, roster: buildRoster(teamIdx), credits: 600, up: {}, stage: 0, opp, lives: 3, wins: 0, losses: 0, destroyed: 0, done: false };
}

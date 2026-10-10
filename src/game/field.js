// Field geometry in feet. Origin = home plate. +x toward first base side
// (right field), +z toward centre field, +y up.
export const BASE_DIST = 90;
const D = BASE_DIST / Math.SQRT2; // 63.64

export const BASES = [
  { x: 0, z: 0 },      // 0 home
  { x: D, z: D },      // 1 first
  { x: 0, z: 2 * D },  // 2 second
  { x: -D, z: D },     // 3 third
];
export const MOUND = { x: 0, z: 60.5 };
export const FENCE_LINE = 310, FENCE_CENTER = 385, FENCE_HEIGHT = 9;

/** Fence distance for a point given its angle from the centre-field line. */
export function fenceDistance(x, z) {
  const theta = Math.atan2(x, Math.max(0.001, z)); // 0 = centre, +-pi/4 lines
  const t = Math.min(1, Math.abs(theta) / (Math.PI / 4));
  return FENCE_LINE + (FENCE_CENTER - FENCE_LINE) * Math.cos(t * Math.PI / 2);
}

export function isFoulAngle(x, z) {
  return z < 0 || Math.abs(x) > z + 0.5;
}

export const POSITIONS = {
  P: { x: 0, z: 58 }, C: { x: 0, z: -5 },
  '1B': { x: 72, z: 78 }, '2B': { x: 42, z: 125 }, '3B': { x: -72, z: 78 }, SS: { x: -42, z: 125 },
  LF: { x: -125, z: 225 }, CF: { x: 0, z: 275 }, RF: { x: 125, z: 225 },
};

/** Which position covers each base when fielding. */
export const BASE_COVER = { 1: '1B', 2: '2B', 3: '3B', 0: 'C' };
export const BASE_COVER_ALT = { 2: 'SS' };

export function dist(ax, az, bx, bz) { const dx = ax - bx, dz = az - bz; return Math.hypot(dx, dz); }

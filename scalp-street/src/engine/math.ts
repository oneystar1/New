import type { StoreDef } from './types';

const SHORT_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/** Suffix for exponents beyond the named list: aa, ab, ... az, ba ... */
function alphaSuffix(groupIndex: number): string {
  const n = groupIndex - SHORT_SUFFIXES.length;
  const first = String.fromCharCode(97 + Math.floor(n / 26));
  const second = String.fromCharCode(97 + (n % 26));
  return first + second;
}

export function formatNumber(n: number, notation: 'short' | 'scientific' = 'short', decimals = 2): string {
  if (!Number.isFinite(n)) return '∞';
  if (n < 0) return '-' + formatNumber(-n, notation, decimals);
  if (n < 1000) return n < 100 ? n.toFixed(n % 1 === 0 ? 0 : decimals) : Math.floor(n).toString();
  if (notation === 'scientific') return n.toExponential(decimals);
  const group = Math.floor(Math.log10(n) / 3 + 1e-9);
  const scaled = n / Math.pow(10, group * 3);
  const suffix = group < SHORT_SUFFIXES.length ? SHORT_SUFFIXES[group] : alphaSuffix(group);
  return scaled.toFixed(decimals) + suffix;
}

export function formatCash(n: number, notation: 'short' | 'scientific' = 'short'): string {
  return '$' + formatNumber(n, notation);
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

/** Cost of buying `count` units starting from `owned` (geometric series). */
export function unitCost(store: StoreDef, owned: number, count = 1): number {
  const r = store.costGrowth;
  const first = store.baseCost * Math.pow(r, owned);
  if (count === 1) return first;
  return (first * (Math.pow(r, count) - 1)) / (r - 1);
}

/** Max number of units affordable with `cash` starting from `owned`. */
export function maxAffordable(store: StoreDef, owned: number, cash: number): number {
  const r = store.costGrowth;
  const first = store.baseCost * Math.pow(r, owned);
  if (cash < first) return 0;
  // cash >= first * (r^n - 1)/(r - 1)  =>  n <= log_r(cash*(r-1)/first + 1)
  const n = Math.floor(Math.log(cash * (r - 1) / first + 1) / Math.log(r));
  return Math.max(0, n);
}

/** Unit milestones: every milestone reached doubles that store's profit. */
export const MILESTONES = [25, 50, 100, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000];

export function milestoneMult(units: number): number {
  let m = 1;
  for (const ms of MILESTONES) {
    if (units >= ms) m *= 2;
    else break;
  }
  return m;
}

export function nextMilestone(units: number): number | null {
  for (const ms of MILESTONES) if (units < ms) return ms;
  return null;
}

export function todayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Small seedable RNG so tests and balance sims are deterministic. */
export function makeRng(seed = Date.now()): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

export function weightedPick<T extends string>(weights: Partial<Record<T, number>>, rand: () => number): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((a, [, w]) => a + (w ?? 0), 0);
  let roll = rand() * total;
  for (const [k, w] of entries) {
    roll -= w ?? 0;
    if (roll <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

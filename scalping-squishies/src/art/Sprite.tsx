import { memo } from 'react';
import { SHAPES } from './shapes';
import { ART, FALLBACK_ART, type Face } from './art';
import type { Variant } from '../engine/types';

// Inline-SVG sprite for an item id. Composed from: drop shadow, behind
// parts, gradient body, finish overlay, decorations, highlight, face.
// Pure function of (id, size); memoized so lists stay cheap.

let uid = 0;

function FaceSvg({ face, x, y, s, ink = '#2a1a3a' }: { face: Face; x: number; y: number; s: number; ink?: string }) {
  if (face === 'none') return null;
  const eye = (dx: number) => <circle cx={x + dx * s} cy={y - 2 * s} r={2.2 * s} fill={ink} />;
  switch (face) {
    case 'panic':
      return (
        <g>
          <circle cx={x - 7 * s} cy={y - 2 * s} r={5 * s} fill="#fff" /><circle cx={x + 7 * s} cy={y - 2 * s} r={5 * s} fill="#fff" />
          <circle cx={x - 7 * s} cy={y - 2 * s} r={2.4 * s} fill={ink} /><circle cx={x + 7 * s} cy={y - 2 * s} r={2.4 * s} fill={ink} />
          <ellipse cx={x} cy={y + 6 * s} rx={2.5 * s} ry={3.5 * s} fill={ink} />
        </g>
      );
    case 'cool':
      return (
        <g>
          <rect x={x - 12 * s} y={y - 5 * s} width={10 * s} height={6 * s} rx={2 * s} fill="#1a1a1a" />
          <rect x={x + 2 * s} y={y - 5 * s} width={10 * s} height={6 * s} rx={2 * s} fill="#1a1a1a" />
          <path d={`M${x - 2 * s} ${y - 3 * s}h${4 * s}`} stroke="#1a1a1a" strokeWidth={1.5 * s} />
          <path d={`M${x - 4 * s} ${y + 5 * s}q${4 * s} ${4 * s} ${8 * s} 0`} stroke={ink} strokeWidth={1.8 * s} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'sleepy':
      return (
        <g>
          <path d={`M${x - 10 * s} ${y - 2 * s}q${3 * s} ${3 * s} ${6 * s} 0M${x + 4 * s} ${y - 2 * s}q${3 * s} ${3 * s} ${6 * s} 0`} stroke={ink} strokeWidth={1.8 * s} fill="none" strokeLinecap="round" />
          <path d={`M${x - 3 * s} ${y + 5 * s}q${3 * s} ${2 * s} ${6 * s} 0`} stroke={ink} strokeWidth={1.6 * s} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'smug':
      return (
        <g>
          <path d={`M${x - 10 * s} ${y - 3 * s}l${6 * s} ${2 * s}M${x + 4 * s} ${y - 1 * s}l${6 * s} ${-2 * s}`} stroke={ink} strokeWidth={2 * s} strokeLinecap="round" />
          <path d={`M${x - 4 * s} ${y + 5 * s}q${5 * s} ${3 * s} ${9 * s} ${-2 * s}`} stroke={ink} strokeWidth={1.8 * s} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'wink':
      return (
        <g>
          {eye(-7)}
          <path d={`M${x + 4 * s} ${y - 2 * s}q${3 * s} ${-3 * s} ${6 * s} 0`} stroke={ink} strokeWidth={1.8 * s} fill="none" strokeLinecap="round" />
          <path d={`M${x - 4 * s} ${y + 5 * s}q${4 * s} ${4 * s} ${8 * s} 0`} stroke={ink} strokeWidth={1.8 * s} fill="none" strokeLinecap="round" />
          <circle cx={x - 11 * s} cy={y + 3 * s} r={2.5 * s} fill="#ff8aa8" opacity={0.6} /><circle cx={x + 11 * s} cy={y + 3 * s} r={2.5 * s} fill="#ff8aa8" opacity={0.6} />
        </g>
      );
    default:
      return (
        <g>
          {eye(-7)}{eye(7)}
          <path d={`M${x - 4 * s} ${y + 5 * s}q${4 * s} ${4 * s} ${8 * s} 0`} stroke={ink} strokeWidth={1.8 * s} fill="none" strokeLinecap="round" />
          <circle cx={x - 11 * s} cy={y + 3 * s} r={2.5 * s} fill="#ff8aa8" opacity={0.5} /><circle cx={x + 11 * s} cy={y + 3 * s} r={2.5 * s} fill="#ff8aa8" opacity={0.5} />
        </g>
      );
  }
}

const GLITTER = [[18, 20], [40, 16], [46, 36], [24, 44], [34, 30], [14, 36], [42, 48], [30, 50]];

export const Sprite = memo(function Sprite({ id, size = 48, className, variant = 'standard' }: { id: string; size?: number; className?: string; variant?: Variant }) {
  const a = ART[id] ?? FALLBACK_ART;
  const sh = SHAPES[a.shape];
  const k = `g${(uid = (uid + 1) % 100000)}`;
  // Variants layer on top of the base finish: glitter adds sparkle, glow adds a halo, mini shrinks.
  const finish = variant === 'glitter' ? 'glitter' : variant === 'glow' ? 'glow' : (a.finish ?? 'jelly');
  const scale = variant === 'mini' ? 0.68 : 1;
  const bodyOpacity = finish === 'clear' ? 0.78 : 1;
  const [fx, fy, fs] = sh.face;
  const accent = a.accent ?? a.c2;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} style={{ color: a.c2 }} aria-hidden>
      <defs>
        <radialGradient id={`${k}b`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor={a.c1} />
          <stop offset="1" stopColor={a.c2} />
        </radialGradient>
        {finish === 'holo' && (
          <linearGradient id={`${k}h`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff7ac8" /><stop offset="0.25" stopColor="#ffe066" /><stop offset="0.5" stopColor="#6ef0c2" /><stop offset="0.75" stopColor="#6ec6ff" /><stop offset="1" stopColor="#9b7bff" />
          </linearGradient>
        )}
        {(finish === 'chrome' || finish === 'gold') && (
          <linearGradient id={`${k}m`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" /><stop offset="0.35" stopColor="#ffffff" stopOpacity="0" /><stop offset="0.6" stopColor="#ffffff" stopOpacity="0.5" /><stop offset="1" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>
        )}
        {finish === 'glow' && (
          <filter id={`${k}f`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" /></filter>
        )}
      </defs>
      <ellipse cx="32" cy="58" rx={18 * (sh.shadow ?? 1) * scale} ry="4" fill="#000" opacity="0.3" />
      <g transform={scale === 1 ? undefined : `translate(${32 - 32 * scale} ${58 - 58 * scale}) scale(${scale})`}>
      {finish === 'glow' && <path d={sh.body} fill={a.c1} opacity="0.7" filter={`url(#${k}f)`} />}
      {sh.behind?.map((p, i) => <path key={i} d={p.d} fill={p.fill ?? accent} stroke={p.stroke} strokeWidth={p.width} opacity={p.opacity} strokeLinecap="round" />)}
      <path d={sh.body} fill={`url(#${k}b)`} opacity={bodyOpacity} />
      {finish === 'holo' && <path d={sh.body} fill={`url(#${k}h)`} opacity="0.55" />}
      {(finish === 'chrome' || finish === 'gold') && <path d={sh.body} fill={`url(#${k}m)`} />}
      {finish === 'glitter' && GLITTER.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1} fill="#fff" opacity="0.85" />)}
      {sh.decos?.map((p, i) => <path key={i} d={p.d} fill={p.fill ?? 'none'} stroke={p.stroke} strokeWidth={p.width} opacity={p.opacity} strokeLinecap="round" />)}
      {finish !== 'matte' && finish !== 'fuzzy' && <ellipse cx="24" cy="20" rx="7" ry="4" fill="#fff" opacity={finish === 'clear' ? 0.7 : 0.45} transform="rotate(-25 24 20)" />}
      <FaceSvg face={a.face ?? 'happy'} x={fx} y={fy} s={fs} ink={a.faceColor} />
      </g>
      {variant === 'glitter' && <text x="54" y="14" fontSize="12" fill="#ffe066" textAnchor="middle">✦</text>}
      {variant === 'glow' && <circle cx="54" cy="10" r="4" fill="#b9ffb0" opacity="0.9" />}
      {variant === 'mini' && <text x="52" y="16" fontSize="9" fontWeight="900" fill="#fff" textAnchor="middle" opacity="0.9">mini</text>}
    </svg>
  );
});

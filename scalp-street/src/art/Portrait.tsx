import { memo } from 'react';

// Character portraits for rivals and buyers: head, hair or hat, accessory.
export type PortraitKind = 'mom' | 'kid' | 'reseller' | 'grandpa' | 'employee' | 'sneakerbro' | 'karen' | 'buyer' | 'scammer' | 'ghost' | 'trader' | 'manager' | 'you';

const SKIN = ['#f3d2b3', '#e0b08a', '#c48a5a', '#8d5a3a', '#f7dcc4'];

function skinFor(seed: number): string { return SKIN[Math.abs(seed) % SKIN.length]; }

export const Portrait = memo(function Portrait({ kind, size = 44, seed = 0 }: { kind: PortraitKind; size?: number; seed?: number }) {
  const skin = skinFor(seed + kind.length);
  const hairColors = ['#3a2a1a', '#8a5a2a', '#1a1a1a', '#d8a040', '#b04030'];
  const hair = hairColors[Math.abs(seed) % hairColors.length];
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#2d1f54" />
      {/* shoulders */}
      <path d="M8 64C8 48 18 44 32 44C46 44 56 48 56 64Z" fill={kind === 'employee' ? '#f0a020' : kind === 'sneakerbro' ? '#1a1a1a' : kind === 'reseller' ? '#3a4a7a' : kind === 'karen' ? '#d04a7a' : kind === 'kid' ? '#4ac86a' : kind === 'manager' ? '#c0c8d8' : '#6a5a9a'} />
      {kind === 'employee' && <path d="M22 46L32 64L42 46" fill="none" stroke="#fff" strokeWidth="2" />}
      {kind === 'sneakerbro' && <path d="M14 56h36" stroke="#ffe066" strokeWidth="3" />}
      {/* head */}
      <ellipse cx="32" cy="30" rx="13" ry="15" fill={skin} />
      {/* hair / hat */}
      {kind === 'mom' && <path d="M18 28C16 12 48 10 46 28C44 18 36 16 32 18C28 16 20 18 18 28Z M18 28C14 34 16 44 18 46 M46 28C50 34 48 44 46 46" fill={hair} stroke={hair} strokeWidth="3" />}
      {kind === 'karen' && <path d="M18 28C16 10 48 10 46 28C44 16 40 16 36 20C30 14 22 14 18 28Z M46 26C52 30 50 36 44 40" fill="#d8a040" stroke="#d8a040" strokeWidth="3" />}
      {kind === 'kid' && <path d="M19 24C20 12 44 12 45 24C40 20 24 20 19 24Z" fill={hair} />}
      {kind === 'grandpa' && <><path d="M19 24C20 14 44 14 45 24C40 22 24 22 19 24Z" fill="#dcdcdc" /><circle cx="32" cy="18" r="8" fill={skin} /></>}
      {kind === 'reseller' && <><path d="M16 22C16 8 48 8 48 22Z" fill="#2a3a6a" /><path d="M14 22H54L50 26H16Z" fill="#2a3a6a" /></>}
      {kind === 'sneakerbro' && <><path d="M17 22C17 8 47 8 47 22Z" fill="#1a1a1a" /><path d="M10 24H48L46 28H14Z" fill="#1a1a1a" /><rect x="20" y="28" width="10" height="5" rx="1.5" fill="#1a1a1a" /><rect x="34" y="28" width="10" height="5" rx="1.5" fill="#1a1a1a" /></>}
      {kind === 'employee' && <><path d="M19 24C20 12 44 12 45 24C40 20 24 20 19 24Z" fill={hair} /><rect x="16" y="38" width="12" height="8" rx="2" fill="#fff" /><path d="M18 42h8" stroke="#333" strokeWidth="1.5" /></>}
      {kind === 'manager' && <><path d="M19 24C20 12 44 12 45 24C40 20 24 20 19 24Z" fill="#6a6a6a" /><rect x="22" y="26" width="8" height="5" rx="1" fill="none" stroke="#333" strokeWidth="1.5" /><rect x="34" y="26" width="8" height="5" rx="1" fill="none" stroke="#333" strokeWidth="1.5" /></>}
      {kind === 'buyer' && <path d="M19 26C18 12 46 12 45 26C40 18 24 18 19 26Z" fill={hair} />}
      {kind === 'trader' && <><path d="M19 24C20 12 44 12 45 24C40 20 24 20 19 24Z" fill={hair} /><circle cx="48" cy="44" r="7" fill="#ffe066" /><path d="M45 44h6M48 41v6" stroke="#333" strokeWidth="1.5" /></>}
      {kind === 'scammer' && <><path d="M16 22C16 8 48 8 48 22Z" fill="#222" /><path d="M12 22H52L50 26H14Z" fill="#222" /><rect x="18" y="28" width="28" height="7" rx="3" fill="#222" /></>}
      {kind === 'ghost' && <ellipse cx="32" cy="30" rx="13" ry="15" fill="#f4f4ff" opacity="0.8" />}
      {kind === 'you' && <><path d="M19 24C20 12 44 12 45 24C40 20 24 20 19 24Z" fill="#ff7ac8" /><rect x="14" y="20" width="36" height="5" rx="2" fill="#9b7bff" /></>}
      {/* face */}
      {kind !== 'sneakerbro' && kind !== 'scammer' && kind !== 'manager' && (
        <>
          <circle cx="27" cy="31" r="1.8" fill="#2a1a3a" /><circle cx="37" cy="31" r="1.8" fill="#2a1a3a" />
          {kind === 'karen' ? <path d="M27 38q5-3 10 0" stroke="#2a1a3a" strokeWidth="1.5" fill="none" /> : kind === 'kid' ? <path d="M26 36q6 6 12 0" stroke="#2a1a3a" strokeWidth="1.5" fill="none" /> : <path d="M28 37q4 3 8 0" stroke="#2a1a3a" strokeWidth="1.5" fill="none" />}
          {kind === 'karen' && <path d="M24 26l6 2M40 26l-6 2" stroke="#2a1a3a" strokeWidth="1.5" />}
        </>
      )}
      {kind === 'sneakerbro' && <path d="M27 38q5 4 10 0" stroke="#2a1a3a" strokeWidth="1.5" fill="none" />}
      {kind === 'manager' && <path d="M27 39h10" stroke="#2a1a3a" strokeWidth="1.5" />}
      {kind === 'kid' && <circle cx="22" cy="35" r="2" fill="#ff8aa8" opacity="0.6" />}
      {kind === 'kid' && <circle cx="42" cy="35" r="2" fill="#ff8aa8" opacity="0.6" />}
    </svg>
  );
});

/** Storefront sprite: building, awning stripes, sign glyph per store. */
const STORE_LOOK: Record<string, { awning: string; wall: string; sign: string }> = {
  dollar: { awning: '#5fa84a', wall: '#e8f0d0', sign: '$' },
  fiveunder: { awning: '#2f9fd8', wall: '#dff0ff', sign: '5' },
  bullseye: { awning: '#e03a3a', wall: '#ffe8e8', sign: '◎' },
  wallymart: { awning: '#2f5fd8', wall: '#e0e8ff', sign: '✦' },
  hallmarq: { awning: '#c04a9a', wall: '#ffe0f4', sign: '♥' },
  wholesale: { awning: '#e03a3a', wall: '#f0f0f0', sign: '▣' },
  claw: { awning: '#9b7bff', wall: '#1a1030', sign: '🕹' },
  botfarm: { awning: '#2a2a44', wall: '#101020', sign: '{}' },
  con: { awning: '#ffe066', wall: '#3a2a6a', sign: '★' },
  factory: { awning: '#6a6a6a', wall: '#3a3a3a', sign: '⚙' },
};

export const StoreSprite = memo(function StoreSprite({ id, size = 44 }: { id: string; size?: number }) {
  const l = STORE_LOOK[id] ?? STORE_LOOK.dollar;
  const dark = id === 'claw' || id === 'botfarm' || id === 'factory' || id === 'con';
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect x="8" y="22" width="48" height="36" rx="3" fill={l.wall} />
      <rect x="6" y="14" width="52" height="12" rx="3" fill={l.awning} />
      <path d="M6 26h52v4H6z" fill={l.awning} opacity="0.6" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={6 + i * 8.7 + 2} y="14" width="4" height="12" fill="#fff" opacity="0.35" />)}
      <rect x="26" y="38" width="12" height="20" rx="2" fill={dark ? '#6ec6ff' : '#5a7ad8'} opacity="0.9" />
      <rect x="12" y="34" width="10" height="10" rx="1.5" fill={dark ? '#ffe066' : '#bfe3ff'} />
      <rect x="42" y="34" width="10" height="10" rx="1.5" fill={dark ? '#ffe066' : '#bfe3ff'} />
      <rect x="20" y="4" width="24" height="10" rx="2" fill="#fff" />
      <text x="32" y="12" fontSize="8" fontWeight="900" textAnchor="middle" fill={l.awning} fontFamily="Arial, sans-serif">{l.sign}</text>
      <path d="M4 58h56" stroke="#000" strokeWidth="2" opacity="0.3" />
    </svg>
  );
});

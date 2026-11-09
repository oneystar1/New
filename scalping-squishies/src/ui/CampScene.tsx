import { memo, useEffect, useState } from 'react';
import type { RestockRun, RivalKind } from '../engine/types';
import { Portrait, StoreSprite, type PortraitKind } from '../art/Portrait';
import { STORE_BY_ID } from '../engine/data/stores';
import { CAMP_SECONDS, hasChair, encounterDef } from '../engine/restock';

// The parking lot at dawn. Pure SVG, animated with CSS so it costs nothing
// on the main thread. Night fades to sunrise as the camp clock runs, the
// line stands and fidgets, you are the glowing one, and the store's door
// light comes on as 7:00am approaches.

const W = 360;
const H = 200;
const GROUND = 158;
const DOOR_X = 52;

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hex(a); const [r2, g2, b2] = hex(b);
  const k = Math.max(0, Math.min(1, t));
  const f = (x: number, y: number) => Math.round(x + (y - x) * k).toString(16).padStart(2, '0');
  return `#${f(r1, r2)}${f(g1, g2)}${f(b1, b2)}`;
};
/** Two-stage sky: deep night to violet, then violet to sunrise. */
const sky = (night: string, violet: string, dawn: string, p: number) => (p < 0.6 ? mix(night, violet, p / 0.6) : mix(violet, dawn, (p - 0.6) / 0.4));

const COAT: Record<PortraitKind, string> = {
  mom: '#b56aa0', kid: '#4ac86a', reseller: '#3a4a7a', grandpa: '#8a7a5a', employee: '#f0a020', sneakerbro: '#1a1a1a',
  karen: '#d04a7a', buyer: '#5a4a8a', scammer: '#444', ghost: '#777', trader: '#2a6a5a', manager: '#c0c8d8', you: '#2a7a5a',
};

// Deterministic scatter for stars and weather.
const rnd = (i: number, salt = 0) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x); };
const STARS = Array.from({ length: 28 }, (_, i) => ({ x: rnd(i, 1) * W, y: rnd(i, 2) * 70, r: 0.6 + rnd(i, 3) * 1.1, d: rnd(i, 4) * 3 }));
const DROPS = Array.from({ length: 34 }, (_, i) => ({ x: rnd(i, 5) * W, d: rnd(i, 6) * 1.2, len: 10 + rnd(i, 7) * 8 }));
const FLAKES = Array.from({ length: 26 }, (_, i) => ({ x: rnd(i, 8) * W, d: rnd(i, 9) * 6, r: 1.2 + rnd(i, 10) * 1.6, sway: 6 + rnd(i, 11) * 10 }));

function Figure({ kind, seed, x, y, scale = 1, you = false, delay = 0, chair = false, ticket = false, coffee = false, label }: {
  kind: PortraitKind; seed: number; x: number; y: number; scale?: number; you?: boolean; delay?: number; chair?: boolean; ticket?: boolean; coffee?: boolean; label?: string;
}) {
  const head = 22 * scale;
  return (
    <g className="camper-slot" style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform 0.7s cubic-bezier(.2,.8,.2,1)' }}>
      <g className="camper" style={{ animationDelay: `${delay}s` }}>
        {you && <ellipse cx="0" cy="2" rx={16 * scale} ry="4" fill="#6ef0c2" opacity="0.35" className="you-glow" />}
        {chair && <g transform={`translate(${-10 * scale}, ${-14 * scale}) scale(${scale})`}><rect x="0" y="4" width="20" height="4" rx="1.5" fill="#3a5a8a" /><rect x="2" y="8" width="2.5" height="10" fill="#2a3a5a" /><rect x="15.5" y="8" width="2.5" height="10" fill="#2a3a5a" /><rect x="16" y="-10" width="3" height="14" rx="1" fill="#3a5a8a" /></g>}
        <ellipse cx="0" cy="0" rx={7 * scale} ry="2" fill="#000" opacity="0.35" />
        <rect x={-7 * scale} y={-24 * scale} width={14 * scale} height={24 * scale} rx={6 * scale} fill={you ? '#2a7a5a' : COAT[kind]} stroke={you ? '#6ef0c2' : 'none'} strokeWidth={you ? 1.5 : 0} />
        <g transform={`translate(${-head / 2}, ${-24 * scale - head + 4 * scale})`}><Portrait kind={kind} size={head} seed={seed} /></g>
        {coffee && <text x={9 * scale} y={-14 * scale} fontSize={8 * scale}>☕</text>}
        {ticket && <text x={-14 * scale} y={-24 * scale - head} fontSize={9 * scale}>🎟️</text>}
        {label && <text x="0" y={-24 * scale - head - 6} fontSize="8" fontWeight="800" fill="#6ef0c2" textAnchor="middle" letterSpacing="0.5">{label}</text>}
      </g>
    </g>
  );
}

export const CampScene = memo(function CampScene({ run, seasonId }: { run: RestockRun; seasonId: string | null }) {
  const camp = run.phase === 'camp';
  const p = run.phase === 'choice' ? 0 : camp ? 1 - run.campLeft / CAMP_SECONDS : 1;
  const open = run.phase === 'doors' || run.phase === 'done';
  const st = STORE_BY_ID[run.storeId];
  const enc = encounterDef(run.encounter);

  // Rain lingers a bit after the rain event so the choice has visible weather.
  const [rainUntil, setRainUntil] = useState(0);
  useEffect(() => { if (run.encounter === 'camp_rain') setRainUntil(Date.now() + 14_000); }, [run.encounter]);
  const raining = run.encounter === 'camp_rain' || Date.now() < rainUntil;
  const snowing = seasonId === 'dohlidays' && !raining;

  const skyTop = sky('#06051a', '#3a2a6e', '#ff8f6a', p);
  const skyBot = sky('#171040', '#6a3f8f', '#ffd38a', p);
  const ground = mix('#221c38', '#4a3f5a', p);
  const starAlpha = Math.max(0, 1 - p * 1.5);
  const lampAlpha = 0.55 * Math.max(0, 1 - p * 1.1);
  const doorGlow = open ? 1 : Math.max(0, (p - 0.75) / 0.25);
  const sunY = p > 0.55 ? GROUND - ((p - 0.55) / 0.45) * 90 : GROUND + 30;

  // Line layout: the door is on the left, the line runs right. Long lines fold behind a "+N" sign.
  const slots: { kind: PortraitKind; seed: number }[] = [];
  for (let i = 0; i < run.position; i++) slots.push({ kind: (run.rivals[i]?.kind as RivalKind | undefined) ?? 'buyer', seed: run.rivals[i] ? i : i + 40 });
  const MAX = 7;
  const shown = slots.length > MAX ? slots.slice(0, MAX - 1) : slots;
  const folded = slots.length - shown.length;
  const startX = DOOR_X + 58;
  const step = 27;
  const youX = startX + (shown.length + (folded ? 1 : 0)) * step + 6;
  const tent = run.upgradesSnapshot.includes('u_tent') && !run.seenEvents.includes('camp_security');

  return (
    <svg className="scene" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The line outside ${st.name} at dawn`}>
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={skyTop} /><stop offset="1" stopColor={skyBot} /></linearGradient>
        <radialGradient id="sc-lamp" cx="0.5" cy="0" r="0.9"><stop offset="0" stopColor="#ffe8a0" stopOpacity="0.9" /><stop offset="1" stopColor="#ffe8a0" stopOpacity="0" /></radialGradient>
        <radialGradient id="sc-door" cx="0.5" cy="1" r="1"><stop offset="0" stopColor="#ffd37a" stopOpacity="0.8" /><stop offset="1" stopColor="#ffd37a" stopOpacity="0" /></radialGradient>
        <linearGradient id="sc-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={ground} /><stop offset="1" stopColor="#120d22" /></linearGradient>
        <clipPath id="sc-clip"><rect width={W} height={H} rx="12" /></clipPath>
      </defs>
      <g clipPath="url(#sc-clip)">
        <rect width={W} height={H} fill="url(#sc-sky)" />
        {/* stars */}
        <g opacity={starAlpha}>{STARS.map((s, i) => <circle key={i} className="star" cx={s.x} cy={s.y} r={s.r} fill="#fff" style={{ animationDelay: `${s.d}s` }} />)}</g>
        {/* moon sets, sun rises */}
        <circle cx={300 - p * 70} cy={34 + p * 80} r="11" fill="#fdf6d8" opacity={Math.max(0, 1 - p * 1.2)} />
        <circle cx={300 - p * 70 + 5} cy={30 + p * 80} r="10" fill={skyTop} opacity={Math.max(0, 1 - p * 1.2)} />
        {p > 0.55 && <circle cx="318" cy={sunY} r="16" fill="#ffd166" opacity={Math.min(1, (p - 0.55) * 3)} className="sun" />}
        {/* distant lot: light poles and cars */}
        <rect x="0" y={GROUND - 30} width={W} height="30" fill={mix('#1a1430', '#8a6a7a', p)} opacity="0.55" />
        {[40, 140, 250, 330].map((x) => <g key={x} opacity="0.5"><rect x={x} y={GROUND - 22} width="26" height="9" rx="3" fill="#2a2240" /><rect x={x + 5} y={GROUND - 27} width="15" height="6" rx="2" fill="#2a2240" /></g>)}
        {/* storefront */}
        <rect x="0" y="62" width={W} height={GROUND - 62} fill={mix('#2a2346', '#6a5a7a', p)} />
        <rect x="0" y="62" width={W} height="8" fill={mix('#3a3056', '#8a7a9a', p)} />
        {[120, 180, 240, 300].map((x) => <rect key={x} x={x} y="84" width="34" height="40" rx="2" fill={mix('#141028', '#3a3050', p)} stroke={mix('#4a3f6a', '#9a8aaa', p)} strokeWidth="1.5" />)}
        {/* sign */}
        <rect x="14" y="30" width="150" height="30" rx="6" fill="#1a1230" stroke={st.id === 'claw' || st.id === 'botfarm' ? '#ff7ac8' : '#ffe066'} strokeWidth="2" className="sign" />
        <g transform="translate(20, 34)"><StoreSprite id={st.id} size={22} /></g>
        <text x="48" y="50" fontSize="12" fontWeight="900" fill="#fff" letterSpacing="0.5">{st.name.toUpperCase().slice(0, 16)}</text>
        {/* door */}
        <rect x={DOOR_X - 2} y="92" width="40" height={GROUND - 92} fill="#15102a" />
        <rect x={DOOR_X} y="94" width="36" height={GROUND - 94} fill={mix('#1f1838', '#ffd37a', doorGlow * 0.9)} stroke="#6a5a8a" strokeWidth="1.5" />
        <line x1={DOOR_X + 18} y1="94" x2={DOOR_X + 18} y2={GROUND} stroke="#6a5a8a" strokeWidth="1.5" />
        {doorGlow > 0 && <ellipse cx={DOOR_X + 18} cy={GROUND} rx="60" ry="26" fill="url(#sc-door)" opacity={doorGlow} />}
        <rect x={DOOR_X + 4} y="100" width="28" height="9" rx="2" fill={open ? '#2f9e5a' : '#b33a3a'} />
        <text x={DOOR_X + 18} y="107" fontSize="6.5" fontWeight="900" fill="#fff" textAnchor="middle">{open ? 'OPEN' : 'CLOSED'}</text>
        {/* employee peeks out during the ticket hand-out */}
        {enc?.id === 'camp_ticket' && <g className="arrive"><g transform={`translate(${DOOR_X + 26}, ${GROUND - 44})`}><Portrait kind="employee" size={24} seed={9} /></g><text x={DOOR_X + 50} y={GROUND - 36} fontSize="9">🎟️</text></g>}
        {/* street lamp */}
        {/* street lamp at the far edge so a long line never stands inside the pole */}
        <polygon points={`${W - 14},72 ${W - 120},${GROUND} ${W + 30},${GROUND}`} fill="url(#sc-lamp)" opacity={lampAlpha} className="lamp" />
        <rect x={W - 16} y="68" width="4" height={GROUND - 68} fill="#101020" />
        <rect x={W - 30} y="64" width="28" height="8" rx="3" fill="#202040" />
        <ellipse cx={W - 14} cy="73" rx="8" ry="3" fill="#ffe8a0" opacity={0.4 + lampAlpha} />
        {/* ground */}
        <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="url(#sc-ground)" />
        {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={20 + i * 64} y1={GROUND + 10} x2={6 + i * 64} y2={H} stroke="#5a5070" strokeWidth="2" opacity="0.5" />)}
        {raining && [1, 2, 3].map((i) => <ellipse key={i} cx={60 + i * 95} cy={GROUND + 24 + i * 3} rx={22 + i * 4} ry="3" fill={skyBot} opacity="0.35" />)}
        {/* tent behind you */}
        {tent && <g style={{ transform: `translate(${youX + 22}px, ${GROUND}px)`, transition: 'transform 0.7s' }}><polygon points="-22,0 0,-26 22,0" fill="#3a6a8a" stroke="#1a3a5a" strokeWidth="1.5" /><polygon points="-6,0 0,-12 6,0" fill="#15102a" /></g>}
        {/* the line */}
        {shown.map((sl, i) => <Figure key={i} kind={sl.kind} seed={sl.seed} x={startX + i * step} y={GROUND} delay={i * 0.37} coffee={run.coffeeRounds > 0 && i % 3 === 1} />)}
        {folded > 0 && (
          <g style={{ transform: `translate(${startX + shown.length * step}px, ${GROUND}px)`, transition: 'transform 0.7s' }}>
            <rect x="-11" y="-30" width="22" height="18" rx="4" fill="#1a1230" stroke="#6a5a8a" />
            <text x="0" y="-17" fontSize="9" fontWeight="800" fill="#fff" textAnchor="middle">+{folded}</text>
            <rect x="-1" y="-12" width="2" height="12" fill="#6a5a8a" />
          </g>
        )}
        <Figure kind="you" seed={0} x={youX} y={GROUND} scale={1.15} you chair={hasChair(run)} ticket={run.ticketLocked} coffee={run.coffeeRounds > 0} label="YOU" />
        {/* whoever is talking to you */}
        {enc && enc.id !== 'camp_ticket' && camp && (
          <g className="arrive"><Figure kind={enc.kind} seed={5} x={youX + 30} y={GROUND} delay={0.2} /></g>
        )}
        {/* weather */}
        {raining && DROPS.map((d, i) => <line key={i} className="rain" x1={d.x} y1={-20} x2={d.x - 3} y2={-20 + d.len} stroke="#9ab8e8" strokeWidth="1.2" opacity="0.7" style={{ animationDelay: `${-d.d}s` }} />)}
        {snowing && FLAKES.map((f, i) => <circle key={i} className="snow" cx={f.x} cy={-6} r={f.r} fill="#fff" opacity="0.85" style={{ animationDelay: `${-f.d}s`, ['--sway' as string]: `${f.sway}px` }} />)}
        {/* clock */}
        <rect x={W - 74} y="10" width="64" height="20" rx="10" fill="#0d0a1e" opacity="0.75" />
        <text x={W - 42} y="24" fontSize="11" fontWeight="900" fill="#fff" textAnchor="middle">{clockText(run)}</text>
      </g>
    </svg>
  );
});

function clockText(run: RestockRun): string {
  if (run.phase === 'choice') return '6:05am';
  if (run.phase !== 'camp') return '7:00am';
  const elapsed = CAMP_SECONDS - Math.max(0, Math.min(CAMP_SECONDS, run.campLeft));
  const mins = Math.min(60, Math.floor(5 + (55 * elapsed) / CAMP_SECONDS));
  return mins >= 60 ? '7:00am' : `6:${String(mins).padStart(2, '0')}am`;
}

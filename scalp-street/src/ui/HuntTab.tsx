import { useState, useCallback } from 'react';
import { useGame } from '../engine/store';
import { computeModifiers, tapValue, dailyAvailable, DAILY_REWARDS, highestUnlockedStore } from '../engine/sim';
import { MISSION_POOL } from '../engine/data/missions';
import { STORE_BY_ID } from '../engine/data/stores';
import { ITEMS } from '../engine/data/items';
import { formatCash } from '../engine/math';
import type { Reward } from '../engine/types';

function rewardLabel(r: Reward): string {
  switch (r.kind) {
    case 'cash': return `${r.minutesOfIncome}m of income`;
    case 'clout': return `${r.amount} Clout`;
    case 'boost': return `x${r.mult} for ${r.minutes}m`;
    case 'pulls': return `${r.amount} free pull${r.amount > 1 ? 's' : ''}`;
    case 'item': return 'Exclusive item';
  }
}

export function HuntTab() {
  const s = useGame((g) => g.s);
  const now = useGame((g) => g.now);
  const tap = useGame((g) => g.tap);
  const huntMeter = useGame((g) => g.huntMeter);
  const claimDailyReward = useGame((g) => g.claimDailyReward);
  const claimMissionReward = useGame((g) => g.claimMissionReward);
  const [floats, setFloats] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const m = computeModifiers(s, now);
  const tv = tapValue(s, m);
  const hunting = STORE_BY_ID[highestUnlockedStore(s)];
  const bg = ITEMS.filter((i) => i.storeId === hunting.id).map((i) => i.icon);
  const daily = dailyAvailable(s, now);
  const nextDay = (s.dailyStreak % DAILY_REWARDS.length) + 1;

  const onTap = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      tap();
      if (s.settings.haptics && 'vibrate' in navigator) navigator.vibrate?.(8);
      const rect = e.currentTarget.getBoundingClientRect();
      const id = Date.now() + Math.random();
      setFloats((f) => [...f.slice(-12), { id, x: e.clientX - rect.left, y: e.clientY - rect.top, text: '+' + formatCash(tv) }]);
      setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 900);
    },
    [tap, tv, s.settings.haptics],
  );

  return (
    <div>
      <div className="row between">
        <div>
          <h3 style={{ margin: 0 }}>Hunting at {hunting.icon} {hunting.name}</h3>
          <div className="small">Tap the shelf: +{formatCash(tv)} per grab. Fill the meter for a free pull.</div>
        </div>
      </div>
      <div className="shelf" onPointerDown={onTap}>
        <div className="pile-bg" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => <span key={i}>{bg[i % bg.length] ?? '🧸'}</span>)}
        </div>
        <div className="pile">🧸</div>
        {floats.map((f) => (
          <span key={f.id} className="float" style={{ left: f.x - 20, top: f.y - 20 }}>{f.text}</span>
        ))}
      </div>
      <div className="progress gold"><i style={{ width: `${Math.min(100, huntMeter * 100)}%` }} /></div>
      <div className="hint">Hunt meter · {Math.floor(huntMeter * 100)}%</div>

      <h2 className="sec">Daily login</h2>
      <div className="card row">
        <div className="ico-lg">📅</div>
        <div className="grow">
          <h3>Day {daily ? nextDay : ((s.dailyStreak - 1) % DAILY_REWARDS.length) + 1} · streak {s.dailyStreak}</h3>
          <div className="sub">{daily ? `Today: ${rewardLabel(DAILY_REWARDS[nextDay - 1])}` : 'Claimed. Come back tomorrow for more.'}</div>
        </div>
        <button className="btn mint sm" disabled={!daily} onClick={claimDailyReward}>{daily ? 'Claim' : '✓'}</button>
      </div>

      <h2 className="sec">Daily missions</h2>
      <div className="card missions">
        {s.missions.map((ms) => {
          const d = MISSION_POOL.find((x) => x.id === ms.id)!;
          const done = ms.progress >= d.target;
          return (
            <div className="m row" key={ms.id}>
              <div className="grow">
                <b>{d.name}</b>
                <div className="sub">{d.blurb} · {Math.min(ms.progress, d.target).toLocaleString(undefined, { maximumFractionDigits: 0 })}/{d.target}</div>
                <div className="progress" style={{ marginTop: 4 }}><i style={{ width: `${Math.min(100, (ms.progress / d.target) * 100)}%` }} /></div>
              </div>
              <button className="btn sm" disabled={!done || ms.claimed} onClick={() => claimMissionReward(ms.id)}>
                {ms.claimed ? '✓' : `💠${d.rewardClout}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { useGame } from '../engine/store';
import { computeModifiers, tapValue, dailyAvailable, DAILY_REWARDS, highestUnlockedStore } from '../engine/sim';
import { MISSION_POOL } from '../engine/data/missions';
import { STORE_BY_ID, STORES } from '../engine/data/stores';
import { restockReady, isBanned } from '../engine/restock';
import { formatDuration } from '../engine/math';
import { TUTORIAL } from '../engine/data/tutorial';
import { isConWeekend } from '../engine/sim';
import { Sprite } from '../art/Sprite';
import { StoreSprite } from '../art/Portrait';
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
  const restockStart = useGame((g) => g.restockStart);
  const [floats, setFloats] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const m = computeModifiers(s, now);
  const tv = tapValue(s, m);
  const hunting = STORE_BY_ID[highestUnlockedStore(s)];
  const bgItems = ITEMS.filter((i) => i.storeId === hunting.id);
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

  const nextStep = TUTORIAL.find((t) => !s.tutorialDone.includes(t.id));
  const tutorialOpen = nextStep && s.tutorialDone.length < TUTORIAL.length - 1;

  return (
    <div>
      {isConWeekend(now) && (
        <div className="banner good" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>🎪</span>
          <div className="t"><b>Con Weekend</b><span className="small">Restock trucks are 50% fuller all weekend. Camp everything.</span></div>
        </div>
      )}
      {tutorialOpen && nextStep && (
        <div className="card tutorial">
          <div className="row">
            <div className="ico-lg">🎓</div>
            <div className="grow">
              <h3>Step {s.tutorialDone.length + 1}/{TUTORIAL.length}: {nextStep.text}</h3>
              <div className="sub">{nextStep.hint}</div>
            </div>
            <span className="pill clout">+{nextStep.clout}</span>
          </div>
          <div className="progress mt"><i style={{ width: `${(s.tutorialDone.length / TUTORIAL.length) * 100}%` }} /></div>
        </div>
      )}
      <div className="row between">
        <div>
          <h3 style={{ margin: 0 }} className="row"><StoreSprite id={hunting.id} size={26} /> Hunting at {hunting.name}</h3>
          <div className="small">Tap the shelf: +{formatCash(tv)} per grab. Fill the meter for a free pull.</div>
        </div>
      </div>
      <div className="shelf" onPointerDown={onTap}>
        <div className="pile-bg" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => <span key={i}><Sprite id={bgItems[(i + 1) % bgItems.length]?.id ?? 'sq_nana'} size={34} /></span>)}
        </div>
        <div className="pile"><Sprite id={bgItems[0]?.id ?? 'sq_nana'} size={140} /></div>
        {floats.map((f) => (
          <span key={f.id} className="float" style={{ left: f.x - 20, top: f.y - 20 }}>{f.text}</span>
        ))}
      </div>
      <div className="progress gold"><i style={{ width: `${Math.min(100, huntMeter * 100)}%` }} /></div>
      <div className="hint">Hunt meter · {Math.floor(huntMeter * 100)}%</div>

      <h2 className="sec">Restock lines</h2>
      {STORES.filter((st) => (s.stores[st.id]?.units ?? 0) > 0).length === 0 && <div className="card center sub">Buy a store unit on the Routes tab to start camping its restocks.</div>}
      {STORES.filter((st) => (s.stores[st.id]?.units ?? 0) > 0).map((st) => {
        const ready = restockReady(s, st.id, now);
        const banned = isBanned(s, st.id, now);
        const until = banned ? s.bannedUntil[st.id] : s.restockReadyAt[st.id] ?? 0;
        return (
          <div className="card row" key={st.id}>
            <div className="ico-lg"><StoreSprite id={st.id} size={44} /></div>
            <div className="grow">
              <h3>{st.name}</h3>
              <div className="sub">{banned ? `BANNED · ${formatDuration((until - now) / 1000)} left` : ready ? 'Truck spotted. Line is forming. Grab what the moms leave.' : `Next restock in ${formatDuration((until - now) / 1000)}`}</div>
            </div>
            <button className="btn gold sm" disabled={!ready} onClick={() => restockStart(st.id)}>{banned ? '🚫' : ready ? '⛺ Camp' : '⏳'}</button>
          </div>
        );
      })}

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

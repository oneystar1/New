import { useEffect, useState } from 'react';
import { useGame } from '../engine/store';
import { UPGRADES } from '../engine/data/upgrades';
import { ITEM_BY_ID } from '../engine/data/items';
import { DRAMA_FEED } from '../engine/data/offers';
import { APOLOGY_CLOUT, CALLED_OUT_SECONDS } from '../engine/deals';
import { computeModifiers } from '../engine/sim';
import { formatCash, formatDuration, formatNumber } from '../engine/math';
import type { OfferKind } from '../engine/types';

const KIND_TAG: Record<OfferKind, { label: string; cls: string }> = {
  fair: { label: 'Buyer', cls: 'uncommon' },
  lowball: { label: 'Lowball', cls: 'common' },
  ghost: { label: '"Is this available?"', cls: 'rare' },
  scam: { label: 'Too good', cls: 'grail' },
  trade: { label: 'Trade', cls: 'ultra' },
  karen: { label: 'Not a buyer', cls: 'select' },
};

export function DealsTab() {
  const s = useGame((g) => g.s);
  const now = useGame((g) => g.now);
  const dealAccept = useGame((g) => g.dealAccept);
  const dealCounter = useGame((g) => g.dealCounter);
  const dealDecline = useGame((g) => g.dealDecline);
  const apologize = useGame((g) => g.apologize);
  const fakeToss = useGame((g) => g.fakeToss);
  const fakeFlip = useGame((g) => g.fakeFlip);
  const buyUpgrade = useGame((g) => g.buyUpgrade);
  const [drama, setDrama] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDrama((d) => (d + 1) % DRAMA_FEED.length), 6000);
    return () => clearInterval(t);
  }, []);
  const m = computeModifiers(s, now);
  const calledOut = s.boosts.find((b) => b.id === 'called_out' && b.endsAt > now);
  const channels = UPGRADES.filter((u) => u.group === 'channel' && !s.upgrades.includes(u.id)).sort((a, b) => a.cost - b.cost);
  const heatCls = s.heat >= 75 ? 'bad' : s.heat >= 40 ? 'warm' : '';

  return (
    <div>
      <div className={`card heat ${heatCls}`}>
        <div className="row between">
          <h3>🔥 Community heat · {Math.floor(s.heat)}/100</h3>
          <button className="btn sm" disabled={s.heat < 10 && !calledOut} onClick={apologize}>📝 Apology video 💠{APOLOGY_CLOUT}</button>
        </div>
        <div className="progress heatbar mt"><i style={{ width: `${s.heat}%` }} /></div>
        <div className="small mt">
          {calledOut
            ? `CALLED OUT: the group posted your listings. Profit x0.4 for ${formatDuration((calledOut.endsAt - now) / 1000)}.`
            : `Sketchy tactics, clapping back and bot farms raise it. At 100 the group screenshots you: profit x0.4 for ${CALLED_OUT_SECONDS / 60} minutes.`}
        </div>
      </div>

      <div className="ticker">📣 {DRAMA_FEED[drama]}</div>

      <h2 className="sec">Messages · {s.offers.length} open {m.offerRate > 1 || m.offerValue > 1 ? `· x${m.offerRate.toFixed(1)} rate, x${m.offerValue.toFixed(2)} value` : ''}</h2>
      {s.offers.length === 0 && (
        <div className="card center sub">No messages. Buyers find your listings every ~{Math.round(30 / m.offerRate)}s while you play. Pull more items to list more.</div>
      )}
      {s.offers.map((o) => {
        const it = ITEM_BY_ID[o.itemId];
        const tag = KIND_TAG[o.kind];
        const showTag = o.kind === 'karen' || o.kind === 'trade' || o.kind === 'lowball' || (o.kind === 'scam' && o.flagged);
        return (
          <div className={`card offer ${o.flagged ? 'flagged' : ''}`} key={o.id}>
            <div className="row">
              <div className="ico-lg">{o.avatar}</div>
              <div className="grow">
                <div className="row between">
                  <b>{o.buyer}</b>
                  <span className="small">{it.icon} {it.name} · {formatDuration((o.expiresAt - now) / 1000)}</span>
                </div>
                <div className="msg">{o.message}</div>
                <div className="row" style={{ gap: 6, marginTop: 4 }}>
                  {o.flagged && <span className="tag grail">🚩 scam radar</span>}
                  {showTag && !(o.kind === 'scam') && <span className={`tag ${tag.cls}`}>{tag.label}</span>}
                  {o.amount > 0 && <span className="pill" style={{ color: 'var(--mint)' }}>{formatCash(o.amount)}</span>}
                </div>
              </div>
            </div>
            <div className="row mt">
              {o.kind === 'karen' ? (
                <>
                  <button className="btn grow" onClick={() => dealDecline(o.id)}>🚫 Block</button>
                  <button className="btn grow" onClick={() => dealAccept(o.id)}>🔥 Clap back</button>
                </>
              ) : o.kind === 'trade' ? (
                <>
                  <button className="btn grow" onClick={() => dealDecline(o.id)}>Pass</button>
                  <button className="btn primary grow" onClick={() => dealAccept(o.id)}>🔄 Trade</button>
                </>
              ) : (
                <>
                  <button className="btn grow" onClick={() => dealDecline(o.id)}>Decline</button>
                  <button className="btn grow" onClick={() => dealCounter(o.id)}>Counter</button>
                  <button className="btn mint grow" onClick={() => dealAccept(o.id)}>Accept</button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {s.fakes.length > 0 && (
        <>
          <h2 className="sec">Counterfeit pile · {s.fakes.length}</h2>
          {s.fakes.map((id, idx) => {
            const it = ITEM_BY_ID[id];
            return (
              <div className="card row" key={`${id}-${idx}`}>
                <div className="ico-lg" style={{ filter: 'hue-rotate(60deg)' }}>{it.icon}</div>
                <div className="grow">
                  <h3>"{it.name}"</h3>
                  <div className="sub">Wrong font on the tag. Smells like gasoline. Definitely not real.</div>
                </div>
                <div className="btn-col" style={{ gap: 4 }}>
                  <button className="btn sm" onClick={() => fakeToss(idx)}>🗑️ Toss</button>
                  <button className="btn sm" style={{ color: 'var(--red)' }} onClick={() => fakeFlip(idx)}>😬 Flip it (+8 heat)</button>
                </div>
              </div>
            );
          })}
        </>
      )}

      <h2 className="sec">Selling channels</h2>
      {channels.length === 0 && <div className="card center sub">Every channel unlocked. You are the algorithm now.</div>}
      {channels.map((u) => (
        <div className="card row" key={u.id}>
          <div className="ico-lg">{u.icon}</div>
          <div className="grow">
            <h3>{u.name}</h3>
            <div className="sub">{u.blurb}</div>
          </div>
          <button className="btn primary" disabled={s.cash < u.cost} onClick={() => buyUpgrade(u.id)}>${formatNumber(u.cost)}</button>
        </div>
      ))}
    </div>
  );
}

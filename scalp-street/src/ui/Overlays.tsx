import { useEffect, useState } from 'react';
import { useGame } from '../engine/store';
import { formatCash, formatDuration } from '../engine/math';
import { RARITY_LABEL } from '../engine/data/items';
import { PRODUCTS } from '../engine/data/shop';
import { isAdFree } from '../engine/sim';
import { Sprite } from '../art/Sprite';
import type { AdPlacement } from '../monetization';

/** Offline earnings, pull results, and toasts. */
export function Overlays() {
  const s = useGame((g) => g.s);
  const lastPulls = useGame((g) => g.lastPulls);
  const toasts = useGame((g) => g.toasts);
  const claimOfflineNormal = useGame((g) => g.claimOfflineNormal);
  const claimOfflineDouble = useGame((g) => g.claimOfflineDouble);
  const dismissPulls = useGame((g) => g.dismissPulls);
  const noAds = isAdFree(s, Date.now());

  return (
    <>
      {s.pendingOffline && (
        <div className="overlay">
          <div className="modal center">
            <h2>Welcome back, hustler</h2>
            <p>Your managers kept flipping for {formatDuration(s.pendingOffline.seconds)}.</p>
            <div className="big">{formatCash(s.pendingOffline.cash, s.settings.notation)}</div>
            <div className="actions">
              <button className="btn" onClick={claimOfflineNormal}>Collect</button>
              <button className="btn primary" onClick={() => void claimOfflineDouble()}>
                {noAds ? '👑 Collect x2' : '📺 Watch & Collect x2'}
              </button>
            </div>
          </div>
        </div>
      )}
      {lastPulls && !s.pendingOffline && (
        <div className="overlay" onClick={dismissPulls}>
          <div className="modal center" onClick={(e) => e.stopPropagation()}>
            <h2>{lastPulls.length > 1 ? 'Haul!' : 'Found one!'}</h2>
            <div className="pulls">
              {lastPulls.map((it, i) => (
                <div className={`pull`} key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="i"><Sprite id={it.id} size={64} /></div>
                  <div className="n">{it.name}</div>
                  <span className={`tag ${it.rarity}`}>{RARITY_LABEL[it.rarity]}</span>
                </div>
              ))}
            </div>
            {lastPulls.length === 1 && <p>{lastPulls[0].blurb}</p>}
            <button className="btn primary block" onClick={dismissPulls}>Nice</button>
          </div>
        </div>
      )}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind ?? ''}`}>
            {t.icon && <span>{t.icon}</span>}
            {t.text}
          </div>
        ))}
      </div>
    </>
  );
}

/** Simulated ad for the web build. Rewarded ads require the countdown to
 *  finish; interstitials can be closed after 3 seconds. */
export function AdOverlay({ placement, kind, onDone }: { placement: AdPlacement; kind: 'rewarded' | 'interstitial'; onDone: (ok: boolean) => void }) {
  const total = kind === 'rewarded' ? 5 : 3;
  const [left, setLeft] = useState(total);
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="overlay">
      <div className="modal ad">
        <h2>{kind === 'rewarded' ? 'Sponsored boost' : 'Advertisement'}</h2>
        <div className="screen">
          <b>{left}</b>
          <span>simulated ad · placement: {placement}</span>
          <span className="small">(AdMob / Unity Ads slot on iOS)</span>
        </div>
        <div className="actions">
          {kind === 'rewarded' && <button className="btn ghost" onClick={() => onDone(false)}>Skip (no reward)</button>}
          <button className="btn primary" disabled={left > 0} onClick={() => onDone(true)}>
            {left > 0 ? `Wait ${left}s` : kind === 'rewarded' ? 'Claim reward' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PurchaseOverlay({ productId, price, onDone }: { productId: string; price: string; onDone: (ok: boolean) => void }) {
  const p = PRODUCTS.find((x) => x.id === productId);
  return (
    <div className="overlay">
      <div className="modal center">
        <div style={{ fontSize: 48 }}>{p?.icon}</div>
        <h2>{p?.name}</h2>
        <p>{p?.blurb}</p>
        <div className="big">{price}</div>
        <p className="small">Simulated checkout. On iOS this is the StoreKit sheet; no money changes hands in the web build.</p>
        <div className="actions">
          <button className="btn" onClick={() => onDone(false)}>Cancel</button>
          <button className="btn mint" onClick={() => onDone(true)}>Confirm purchase</button>
        </div>
      </div>
    </div>
  );
}

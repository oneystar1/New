import { useEffect, useState } from 'react';
import { useGame } from '../engine/store';
import { formatCash, formatDuration } from '../engine/math';
import { RARITY_LABEL, VARIANT_LABEL } from '../engine/data/items';
import { PRODUCTS } from '../engine/data/shop';
import { isAdFree } from '../engine/sim';
import { Sprite } from '../art/Sprite';
import type { AdPlacement } from '../monetization';
import { SEASON_BY_ID, SEASON_SHOP_PRICE, SEASON_TOKENS, seasonEndsAt, itemsForSeason } from '../engine/data/seasons';

/** Offline earnings, pull results, and toasts. */
export function Overlays() {
  const s = useGame((g) => g.s);
  const lastPulls = useGame((g) => g.lastPulls);
  const toasts = useGame((g) => g.toasts);
  const claimOfflineNormal = useGame((g) => g.claimOfflineNormal);
  const claimOfflineDouble = useGame((g) => g.claimOfflineDouble);
  const dismissPulls = useGame((g) => g.dismissPulls);
  const requestTab = useGame((g) => g.requestTab);
  const dismissToast = useGame((g) => g.dismissToast);
  const dismissSeasonSplash = useGame((g) => g.dismissSeasonSplash);
  const claimComebackCrate = useGame((g) => g.claimComebackCrate);
  const splashDone = useGame((g) => g.splashDone);
  const noAds = isAdFree(s, Date.now());
  // The season "what's new" card: once per season, after the launch splash and the tutorial choice, never over another overlay.
  const season = s.season.id ? SEASON_BY_ID[s.season.id] : null;
  const showSeason = Boolean(season && splashDone && !s.seasonSplashSeen.includes(season.id) && (s.tutorialChoice === 'off' || s.tutorialChoice === 'done') && !s.pendingOffline && !s.pendingComeback && !lastPulls);

  return (
    <>
      {s.pendingComeback && !s.pendingOffline && !lastPulls && (
        <div className="overlay">
          <div className="modal center">
            <div className="season-hero">📦</div>
            <h2>{s.pendingComeback.days} days away. The lot missed you.</h2>
            <p className="sub">Brenda saved your spot in the group. Dalton did not. Here is a crate to get the routes moving again.</p>
            <div className="big">{s.pendingComeback.incomeMinutes}m of income + {s.pendingComeback.pulls} pull{s.pendingComeback.pulls > 1 ? 's' : ''}</div>
            <button className="btn primary block" onClick={claimComebackCrate}>Open the crate</button>
          </div>
        </div>
      )}
      {s.pendingOffline && !s.pendingComeback && (
        <div className="overlay">
          <div className="modal center">
            <h2>Welcome back, hustler</h2>
            <p>Your crew kept running the routes for {formatDuration(s.pendingOffline.seconds)}: buy the limit, list it, sell it, repeat.</p>
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
      {lastPulls && !s.pendingOffline && !s.pendingComeback && (
        <div className="overlay" onClick={dismissPulls}>
          <div className="modal center" onClick={(e) => e.stopPropagation()}>
            <h2>{lastPulls.length > 1 ? 'Haul!' : 'Found one!'}</h2>
            <div className="pulls">
              {lastPulls.map((p, i) => (
                <div className={`pull`} key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="i"><Sprite id={p.item.id} size={64} variant={p.variant} /></div>
                  <div className="n">{p.variant !== 'standard' ? `${VARIANT_LABEL[p.variant]} ` : ''}{p.item.name}</div>
                  <span className={`tag ${p.item.rarity}`}>{RARITY_LABEL[p.item.rarity]}</span>
                </div>
              ))}
            </div>
            {lastPulls.length === 1 && <p>{lastPulls[0].item.blurb}</p>}
            <button className="btn primary block" onClick={dismissPulls}>Nice</button>
          </div>
        </div>
      )}
      {showSeason && season && (
        <div className="overlay season-splash">
          <div className="modal center">
            <div className="season-hero">{season.icon}</div>
            <h2>{season.name} is on</h2>
            <p className="sub">{season.blurb}</p>
            <div className="season-items">
              {itemsForSeason(season.id).map((it) => (
                <div className={`item r-${it.rarity} ${(s.shelf[it.id] ?? 0) > 0 ? '' : 'unknown'}`} key={it.id}>
                  <div className="i"><Sprite id={it.id} size={40} /></div>
                  <div className="n">{(s.shelf[it.id] ?? 0) > 0 ? it.name : `${season.tokenIcon}${SEASON_SHOP_PRICE[it.rarity]}`}</div>
                </div>
              ))}
            </div>
            <p className="small">Six exclusives, {(season.setBonus * 100).toFixed(0)}% profit forever for the set. They drop from 15% of pulls, or buy them with {season.tokenName}: {SEASON_TOKENS.restockUnit} per restock unit, {SEASON_TOKENS.pull} per pull, {SEASON_TOKENS.deal} per deal, {SEASON_TOKENS.daily} per daily login, plus three season missions a day.</p>
            <p className="small" style={{ color: 'var(--gold)' }}>Last day {new Date(seasonEndsAt(season, Date.now()) - 1).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}. Leftover {season.tokenName} become Clout.</p>
            <button className="btn primary block" onClick={() => { dismissSeasonSplash(); requestTab('hunt'); }}>Let's go</button>
          </div>
        </div>
      )}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind ?? ''} ${t.tab ? 'link' : ''}`} onClick={() => { if (t.tab) { requestTab(t.tab); dismissToast(t.id); } }}>
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

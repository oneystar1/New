import { useGame } from '../engine/store';
import { PRODUCTS, CLOUT_COSTS } from '../engine/data/shop';
import { PASS_TIERS, PASS_SEASON_NAME, PASS_XP_PER_TIER } from '../engine/data/pass';
import { passTierReached, isVip, isAdFree } from '../engine/sim';
import { AD_RULES, type AdPlacement } from '../monetization';
import { formatCash, formatDuration, formatNumber } from '../engine/math';
import type { Reward } from '../engine/types';

const AD_PLACEMENTS: { id: AdPlacement; icon: string; name: string; blurb: string }[] = [
  { id: 'boost_2x', icon: '🚀', name: 'x2 Profit for 4h', blurb: 'Watch a short video. Stacks with everything.' },
  { id: 'speed_up', icon: '⏩', name: 'Skip 1 hour', blurb: 'Instantly collect one hour of managed income.' },
  { id: 'free_clout', icon: '💠', name: `+${AD_RULES.rewards.free_clout} Clout`, blurb: 'A little premium currency, on the house.' },
  { id: 'free_pull', icon: '🎁', name: 'Free mystery pull', blurb: 'One pull from your best store.' },
];

function rewardText(r?: Reward): string {
  if (!r) return '—';
  switch (r.kind) {
    case 'cash': return `💵 ${r.minutesOfIncome}m income`;
    case 'clout': return `💠 ${r.amount}`;
    case 'boost': return `🚀 x${r.mult} ${r.minutes}m`;
    case 'pulls': return `🎁 ${r.amount} pull${r.amount > 1 ? 's' : ''}`;
    case 'item': return '💎 Holo Kube';
  }
}

export function ShopTab() {
  const s = useGame((g) => g.s);
  const now = useGame((g) => g.now);
  const provider = useGame((g) => g.provider);
  const buyProduct = useGame((g) => g.buyProduct);
  const restorePurchases = useGame((g) => g.restorePurchases);
  const watchAd = useGame((g) => g.watchAd);
  const spendClout = useGame((g) => g.spendClout);
  const breakPiggy = useGame((g) => g.breakPiggy);
  const claimPass = useGame((g) => g.claimPass);
  const vip = isVip(s, now);
  const noAds = isAdFree(s, now);
  const tierReached = passTierReached(s);
  const adsLeft = Math.max(0, AD_RULES.dailyRewardedCap - (s.adsToday.count ?? 0));

  const starter = PRODUCTS.find((p) => p.kind === 'starter')!;
  const vipProd = PRODUCTS.find((p) => p.kind === 'vip')!;
  const passProd = PRODUCTS.find((p) => p.kind === 'pass')!;
  const noAdsProd = PRODUCTS.find((p) => p.kind === 'noAds')!;

  return (
    <div>
      {!s.iap.starterPackBought && (
        <div className="card starter rel">
          <span className="badge">{starter.badge}</span>
          <div className="product">
            <div className="ico-lg">{starter.icon}</div>
            <div className="grow">
              <h3>{starter.name}</h3>
              <div className="sub">{starter.blurb}</div>
            </div>
            <button className="btn primary" onClick={() => void buyProduct(starter.id)}>{provider?.iap.getPrice(starter.id)}</button>
          </div>
        </div>
      )}

      <div className="card vip rel">
        {vipProd.badge && <span className="badge">{vipProd.badge}</span>}
        <div className="product">
          <div className="ico-lg">{vipProd.icon}</div>
          <div className="grow">
            <h3>{vipProd.name} {vip && <span className="small">· active {formatDuration((s.iap.vipUntil - now) / 1000)}</span>}</h3>
            <div className="sub">{vipProd.blurb}</div>
          </div>
          <button className="btn gold" onClick={() => void buyProduct(vipProd.id)}>{vip ? 'Extend' : `${provider?.iap.getPrice(vipProd.id)}/wk`}</button>
        </div>
      </div>

      <h2 className="sec">Free boosts {noAds ? '· instant (no ads)' : `· ${adsLeft} videos left today`}</h2>
      {AD_PLACEMENTS.map((a) => {
        const until = s.adCooldowns[a.id] ?? 0;
        const ready = until <= now && (adsLeft > 0 || noAds);
        return (
          <div className="card row" key={a.id}>
            <div className="ico-lg">{a.icon}</div>
            <div className="grow">
              <h3>{a.name}</h3>
              <div className="sub">{a.blurb}</div>
            </div>
            <button className="btn mint sm" disabled={!ready} onClick={() => void watchAd(a.id)}>
              {until > now ? formatDuration((until - now) / 1000) : noAds ? 'Claim' : '📺 Watch'}
            </button>
          </div>
        );
      })}

      <h2 className="sec">Piggy bank</h2>
      <div className="card row">
        <div className="ico-lg">🐷</div>
        <div className="grow">
          <h3>{formatCash(s.piggy)} saved</h3>
          <div className="sub">2% of everything you earn goes in. Smash it for Clout, or watch a video for +50%.</div>
        </div>
        <div className="btn-col" style={{ gap: 4 }}>
          <button className="btn sm" disabled={s.piggy <= 0 || s.clout < CLOUT_COSTS.piggyBreak} onClick={breakPiggy}>💠{CLOUT_COSTS.piggyBreak}</button>
          <button className="btn mint sm" disabled={s.piggy <= 0 || (s.adCooldowns.piggy_bonus ?? 0) > now} onClick={() => void watchAd('piggy_bonus')}>📺 +50%</button>
        </div>
      </div>

      <h2 className="sec">{PASS_SEASON_NAME}</h2>
      <div className="card">
        <div className="row between">
          <div>
            <h3>Tier {tierReached}/30 · {s.pass.xp} XP</h3>
            <div className="sub">Earn XP from daily missions. {s.pass.premium ? 'Premium unlocked.' : passProd.blurb}</div>
          </div>
          {!s.pass.premium && <button className="btn primary sm" onClick={() => void buyProduct(passProd.id)}>{provider?.iap.getPrice(passProd.id)}</button>}
        </div>
        <div className="progress mt"><i style={{ width: `${((s.pass.xp % PASS_XP_PER_TIER) / PASS_XP_PER_TIER) * 100}%` }} /></div>
        <div className="pass-track mt">
          {PASS_TIERS.map((t) => {
            const reached = tierReached >= t.tier;
            const fDone = s.pass.claimedFree.includes(t.tier);
            const pDone = s.pass.claimedPremium.includes(t.tier);
            return (
              <div className={`tier ${reached ? 'reached' : ''}`} key={t.tier}>
                <b>T{t.tier}</b>
                <div className="r">{rewardText(t.free)}</div>
                <button className="btn sm" disabled={!reached || fDone} onClick={() => claimPass(t.tier, false)}>{fDone ? '✓' : 'Claim'}</button>
                <div className="r p">{rewardText(t.premium)}</div>
                <button className="btn gold sm" disabled={!reached || pDone || !s.pass.premium} onClick={() => claimPass(t.tier, true)}>{pDone ? '✓' : s.pass.premium ? 'Claim' : '🔒'}</button>
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="sec">Spend Clout</h2>
      <div className="card">
        <div className="row">
          <button className="btn grow" disabled={s.clout < CLOUT_COSTS.timeSkip1h} onClick={() => spendClout('timeSkip1h')}><span className="btn-col"><span>⏩ Skip 1h</span><span className="price">💠{CLOUT_COSTS.timeSkip1h}</span></span></button>
          <button className="btn grow" disabled={s.clout < CLOUT_COSTS.timeSkip8h} onClick={() => spendClout('timeSkip8h')}><span className="btn-col"><span>⏩ Skip 8h</span><span className="price">💠{CLOUT_COSTS.timeSkip8h}</span></span></button>
          <button className="btn grow" disabled={s.clout < CLOUT_COSTS.boost2x4h} onClick={() => spendClout('boost2x4h')}><span className="btn-col"><span>🚀 x2 4h</span><span className="price">💠{CLOUT_COSTS.boost2x4h}</span></span></button>
        </div>
      </div>

      <h2 className="sec">Clout packs</h2>
      {PRODUCTS.filter((p) => p.kind === 'clout' || p.kind === 'bundle').map((p) => (
        <div className="card rel" key={p.id}>
          {p.badge && <span className="badge">{p.badge}</span>}
          <div className="product">
            <div className="ico-lg">{p.icon}</div>
            <div className="grow">
              <h3>{p.name}</h3>
              <div className="sub">{p.blurb}{p.clout ? ` · ${formatNumber(p.clout / p.priceUsd)} Clout per $` : ''}</div>
            </div>
            <button className="btn primary" onClick={() => void buyProduct(p.id)}>{provider?.iap.getPrice(p.id)}</button>
          </div>
        </div>
      ))}

      {!s.iap.noAds && (
        <div className="card product">
          <div className="ico-lg">{noAdsProd.icon}</div>
          <div className="grow">
            <h3>{noAdsProd.name}</h3>
            <div className="sub">{noAdsProd.blurb}</div>
          </div>
          <button className="btn" onClick={() => void buyProduct(noAdsProd.id)}>{provider?.iap.getPrice(noAdsProd.id)}</button>
        </div>
      )}
      <div className="center mt">
        <button className="btn ghost sm" onClick={() => void restorePurchases()}>Restore purchases</button>
      </div>
      <p className="small center">Web build: purchases and ads are simulated. Nothing is charged.</p>
    </div>
  );
}

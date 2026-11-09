import { useGame } from '../engine/store';
import { SEASON_BY_ID, SEASON_MISSION_BY_ID, SEASON_TOKENS, seasonEndsAt } from '../engine/data/seasons';
import { seasonShop, seasonSets } from '../engine/season';
import { RARITY_LABEL } from '../engine/data/items';
import { formatDuration } from '../engine/math';
import { Sprite } from '../art/Sprite';

/** Live seasonal event: tokens, countdown, event shop and season missions. Renders nothing off-season. */
export function SeasonCard() {
  const s = useGame((g) => g.s);
  const now = useGame((g) => g.now);
  const buySeasonItem = useGame((g) => g.buySeasonItem);
  const claimSeasonMission = useGame((g) => g.claimSeasonMission);
  const season = s.season.id ? SEASON_BY_ID[s.season.id] : null;
  if (!season) return null;
  const shop = seasonShop(s);
  const set = seasonSets(s).find((r) => r.season.id === season.id);
  const left = formatDuration((seasonEndsAt(season, now) - now) / 1000);
  return (
    <>
      <h2 className="sec">{season.icon} {season.name} · {left} left</h2>
      <div className="card" style={{ borderColor: 'var(--gold)' }} data-tut="season">
        <div className="row between">
          <h3>{season.tokenIcon} {s.season.tokens} {season.tokenName}</h3>
          <span className="small" style={{ color: set?.done ? 'var(--mint)' : 'var(--muted)' }}>{set?.done ? '✓ ' : ''}set {set?.have ?? 0}/{set?.total ?? 0} · +{(season.setBonus * 100).toFixed(0)}% profit</span>
        </div>
        <div className="sub">{season.blurb}</div>
        <div className="small mt" style={{ color: 'var(--muted)' }}>
          Earn {season.tokenName}: {SEASON_TOKENS.restockUnit} per restock unit · {SEASON_TOKENS.pull} per pull · {SEASON_TOKENS.deal} per deal · {SEASON_TOKENS.daily} daily login · missions below. Seasonal items also drop from 15% of pulls. Leftovers become Clout when the season ends.
        </div>
      </div>

      <div className="card">
        <h3>Event shop</h3>
        {shop.map((r) => (
          <div className="row" key={r.item.id} style={{ marginTop: 8 }}>
            <div className="ico-lg"><Sprite id={r.item.id} size={40} /></div>
            <div className="grow">
              <b>{r.owned ? r.item.name : '???'}</b> <span className={`tag ${r.item.rarity}`}>{RARITY_LABEL[r.item.rarity]}</span>
              <div className="sub">{r.owned ? r.item.blurb : `${season.name} exclusive. Buy it here or hope for a pull.`}</div>
            </div>
            <button className="btn gold sm" disabled={r.bought || s.season.tokens < r.cost} onClick={() => buySeasonItem(r.item.id)}>
              {r.bought ? '✓' : `${season.tokenIcon}${r.cost}`}
            </button>
          </div>
        ))}
      </div>

      <div className="card missions">
        <h3>Season missions</h3>
        {s.season.missions.map((ms) => {
          const d = SEASON_MISSION_BY_ID[ms.id];
          if (!d) return null;
          const done = ms.progress >= d.target;
          return (
            <div className="m row" key={ms.id}>
              <div className="grow">
                <b>{d.name}</b>
                <div className="sub">{d.blurb} · {Math.min(ms.progress, d.target).toLocaleString(undefined, { maximumFractionDigits: 0 })}/{d.target}</div>
                <div className="progress" style={{ marginTop: 4 }}><i style={{ width: `${Math.min(100, (ms.progress / d.target) * 100)}%` }} /></div>
              </div>
              <button className="btn sm" disabled={!done || ms.claimed} onClick={() => claimSeasonMission(ms.id)}>
                {ms.claimed ? '✓' : `${season.tokenIcon}${d.rewardTokens ?? 0}`}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

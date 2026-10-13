import { useGame, type BuyAmount } from '../engine/store';
import { STORES } from '../engine/data/stores';
import { MANAGER_BY_STORE } from '../engine/data/managers';
import { computeModifiers, storeCycleProfit, storeCycleSeconds, storeUnlocked } from '../engine/sim';
import { unitCost, maxAffordable, formatCash, formatDuration, milestoneMult, nextMilestone } from '../engine/math';
import { isBanned } from '../engine/restock';

const AMOUNTS: BuyAmount[] = [1, 10, 100, 'max'];

export function StoresTab() {
  const s = useGame((g) => g.s);
  const now = useGame((g) => g.now);
  const buyAmount = useGame((g) => g.buyAmount);
  const setBuyAmount = useGame((g) => g.setBuyAmount);
  const buyUnits = useGame((g) => g.buyUnits);
  const startStore = useGame((g) => g.startStore);
  const hireManager = useGame((g) => g.hireManager);
  const m = computeModifiers(s, now);

  return (
    <div>
      <div className="seg">
        {AMOUNTS.map((a) => (
          <button key={String(a)} className={buyAmount === a ? 'active' : ''} onClick={() => setBuyAmount(a)}>
            x{a}
          </button>
        ))}
      </div>
      {STORES.map((st) => {
        const ss = s.stores[st.id];
        const unlocked = storeUnlocked(s, st.id);
        const count = buyAmount === 'max' ? Math.max(1, maxAffordable(st, ss.units, s.cash)) : buyAmount;
        const cost = unitCost(st, ss.units, count);
        const canBuy = unlocked && s.cash >= cost;
        const profit = storeCycleProfit(s, st.id, m);
        const cycle = storeCycleSeconds(s, st.id, m);
        const mgr = MANAGER_BY_STORE[st.id];
        const nm = nextMilestone(ss.units);
        const running = ss.progress > 0;
        return (
          <div className={`card ${unlocked ? '' : 'locked'}`} key={st.id}>
            <div className="row">
              <button
                className="ico-lg"
                style={{ fontSize: 34 }}
                disabled={ss.units <= 0 || ss.manager || running}
                onClick={() => startStore(st.id)}
                title="Run a cycle"
              >
                {st.icon}
              </button>
              <div className="grow">
                <div className="row between">
                  <h3>{st.name} <span className="small">×{ss.units}</span></h3>
                  {ss.units > 0 && <span className="small">{isBanned(s, st.id, now) ? <b style={{ color: 'var(--red)' }}>🚫 BANNED · </b> : null}x{milestoneMult(ss.units)} · {formatDuration(cycle)}</span>}
                </div>
                {ss.units > 0 ? (
                  <>
                    <div className="progress"><i style={{ width: `${Math.min(100, ss.progress * 100)}%` }} /></div>
                    <div className="row between" style={{ marginTop: 4 }}>
                      <span className="small">{formatCash(profit)} / cycle {ss.manager ? '· auto' : running ? '· running' : '· tap icon to run'}</span>
                      {nm && <span className="small">next x2 at {nm}</span>}
                    </div>
                  </>
                ) : (
                  <div className="sub">{unlocked ? st.tagline : `Unlocks at ${st.unlockAtTotalUnits} total units`}</div>
                )}
              </div>
              <button className="btn primary" disabled={!canBuy} onClick={() => buyUnits(st.id)}>
                <span className="btn-col">
                  <span>Buy {buyAmount === 'max' ? `x${count}` : `x${count}`}</span>
                  <span className="price">{formatCash(cost)}</span>
                </span>
              </button>
            </div>
            {ss.units > 0 && !ss.manager && (
              <div className="row between mt">
                <span className="small">{mgr.icon} {mgr.name}: {mgr.blurb}</span>
                <button className="btn gold sm" disabled={s.cash < mgr.cost} onClick={() => hireManager(st.id)}>
                  Hire {formatCash(mgr.cost)}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

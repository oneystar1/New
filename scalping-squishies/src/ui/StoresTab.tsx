import { useGame, type BuyAmount } from '../engine/store';
import { STORES } from '../engine/data/stores';
import { MANAGER_BY_STORE } from '../engine/data/managers';
import { computeModifiers, storeCycleProfit, storeCycleSeconds, storeUnlocked } from '../engine/sim';
import { unitCost, maxAffordable, formatCash, formatDuration, milestoneMult, nextMilestone } from '../engine/math';
import { isBanned } from '../engine/restock';
import { StoreSprite } from '../art/Portrait';
import { Sprite } from '../art/Sprite';
import { itemsForStore } from '../engine/data/items';

/** The fiction behind a run: buy a few of the store's bread-and-butter item, flip them at market. */
function flipMath(storeId: string, units: number, profitPerCycle: number) {
  const pool = itemsForStore(storeId);
  const rep = pool.find((i) => i.rarity === 'common') ?? pool[0];
  const qty = 2 * milestoneMult(units);
  const perRun = units > 0 ? profitPerCycle / units : 0;
  const sale = rep ? rep.retail + perRun / qty : perRun;
  return { rep, qty, sale, perRun };
}

function phaseLabel(progress: number): string {
  return progress < 0.34 ? 'buying' : progress < 0.67 ? 'listing' : 'selling';
}

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
      <div className="card sub" style={{ fontSize: 12 }}>A <b>run</b> is one buy-and-flip loop: camp the store, buy the limit, list it, sell it. Add runs to flip more per trip. Hire a manager and the runs repeat while you are away.</div>
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
        const fm = flipMath(st.id, ss.units, profit);
        return (
          <div className={`card ${unlocked ? '' : 'locked'}`} key={st.id}>
            <div className="row">
              <button
                className="ico-lg"
                style={{ fontSize: 34 }}
                disabled={ss.units <= 0 || ss.manager || running}
                onClick={() => startStore(st.id)}
                title="Send a run"
              >
                <StoreSprite id={st.id} size={44} />
              </button>
              <div className="grow">
                <div className="row between">
                  <h3>{st.name} <span className="small">· {ss.units} run{ss.units === 1 ? '' : 's'}</span></h3>
                  {ss.units > 0 && <span className="small">{isBanned(s, st.id, now) ? <b style={{ color: 'var(--red)' }}>🚫 BANNED · </b> : null}x{milestoneMult(ss.units)} · {formatDuration(cycle)}</span>}
                </div>
                {ss.units > 0 ? (
                  <>
                    <div className="progress"><i style={{ width: `${Math.min(100, ss.progress * 100)}%` }} /></div>
                    <div className="row between" style={{ marginTop: 4 }}>
                      <span className="small">{formatCash(profit)} per trip {ss.manager ? '· manager repeats it' : running ? `· ${phaseLabel(ss.progress)}` : '· tap the store to send a run'}</span>
                      {nm && <span className="small">x2 at {nm} runs</span>}
                    </div>
                    {fm.rep && (
                      <div className="row small flipmath">
                        <Sprite id={fm.rep.id} size={18} />
                        <span>Each run flips {fm.qty} × {fm.rep.name}: buy at ${fm.rep.retail}, sell at {formatCash(fm.sale)} each</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="sub">{unlocked ? st.tagline : `Unlocks at ${st.unlockAtTotalUnits} total runs`}</div>
                )}
              </div>
              <button className="btn primary" disabled={!canBuy} onClick={() => buyUnits(st.id)}>
                <span className="btn-col">
                  <span>{ss.units > 0 ? 'Add' : 'Start'} {count > 1 ? `${count} runs` : 'run'}</span>
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

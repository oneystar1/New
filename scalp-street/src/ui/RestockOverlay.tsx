import { useGame } from '../engine/store';
import { STORE_BY_ID } from '../engine/data/stores';
import { RIVALS } from '../engine/data/restock';
import { encounterDef, DOORS_SECONDS } from '../engine/restock';
import { RARITY_LABEL } from '../engine/data/items';
import { formatCash } from '../engine/math';
import { Sprite } from '../art/Sprite';
import { Portrait, StoreSprite } from '../art/Portrait';

/** Full-screen restock run: line phase, doors phase (mash GRAB), results. */
export function RestockOverlay() {
  const run = useGame((g) => g.run);
  const result = useGame((g) => g.runResult);
  const restockOpen = useGame((g) => g.restockOpen);
  const restockGrab = useGame((g) => g.restockGrab);
  const restockChoose = useGame((g) => g.restockChoose);
  const restockFinish = useGame((g) => g.restockFinish);
  const restockDismiss = useGame((g) => g.restockDismiss);

  if (result) {
    return (
      <div className="overlay">
        <div className="modal center">
          <h2>{result.banned ? 'Escorted out' : result.grabbed >= 8 ? 'Cleared the shelf' : result.grabbed > 0 ? 'Haul secured' : 'Went home empty'}</h2>
          <p>{result.grabbed} grabbed · +{formatCash(result.cash)} · heat {result.heat >= 0 ? '+' : ''}{result.heat}{result.fakes ? ` · ${result.fakes} counterfeit` : ''}</p>
          {result.banned && <p style={{ color: 'var(--red)' }}>Banned from this store for 10 minutes. No cycles, no restocks. Your photo is by the register.</p>}
          <div className="pulls">
            {result.items.map((it, i) => (
              <div className="pull" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="i"><Sprite id={it.id} size={56} /></div>
                <div className="n">{it.name}</div>
                <span className={`tag ${it.rarity}`}>{RARITY_LABEL[it.rarity]}</span>
              </div>
            ))}
          </div>
          <button className="btn primary block" onClick={restockDismiss}>Back to the car</button>
        </div>
      </div>
    );
  }
  if (!run) return null;
  const st = STORE_BY_ID[run.storeId];
  const enc = encounterDef(run.encounter);
  const taken = run.rivals.reduce((a, r) => a + r.takes, 0);

  return (
    <div className="overlay run">
      <div className="modal">
        <div className="row between">
          <h2 className="row" style={{ gap: 8 }}><StoreSprite id={st.id} size={32} /> {st.name} restock</h2>
          <span className="pill">{run.phase === 'line' ? '6:40am' : run.phase === 'doors' ? `${Math.ceil(run.timeLeft)}s` : 'done'}</span>
        </div>

        {run.phase === 'line' && (
          <>
            <p>{run.log[0]}</p>
            <div className="line">
              {run.rivals.map((r, i) => (
                <div className="rival" key={i} title={RIVALS[r.kind].blurb}>
                  <span className="i"><Portrait kind={r.kind} size={28} seed={i} /></span>
                  <span className="n">{r.name}</span>
                  <span className="t">takes {r.takes}</span>
                </div>
              ))}
              <div className="rival you"><span className="i"><Portrait kind="you" size={28} /></span><span className="n">You</span><span className="t">carry up to {run.carry}</span></div>
            </div>
            <p className="small">Shelf has {run.stock}. People ahead will take {taken}. About <b>{run.remaining}</b> left for you when the doors open. Gear (chair, tent) moves you up the line.</p>
            {enc ? (
              <div className="encounter">
                <div className="row"><Portrait kind={enc.kind} size={40} seed={3} /><div className="grow">{enc.text}</div></div>
                <div className="row mt">
                  {enc.choices.map((c, i) => <button key={i} className="btn grow" onClick={() => restockChoose(i)}>{c.label}</button>)}
                </div>
              </div>
            ) : (
              <button className="btn primary block mt" onClick={restockOpen}>🚪 Doors open!</button>
            )}
          </>
        )}

        {run.phase === 'doors' && (
          <>
            <div className="row between small">
              <span>Shelf: <b>{run.remaining}</b></span>
              <span>Cart: <b>{run.grabbed}</b>/{run.limit !== null ? Math.min(run.limit, run.carry) : run.carry}</span>
            </div>
            <div className="progress mt"><i style={{ width: `${(run.timeLeft / DOORS_SECONDS) * 100}%` }} /></div>
            {enc ? (
              <div className="encounter mt">
                <div className="row"><Portrait kind={enc.kind === 'employee' ? 'manager' : enc.kind} size={40} seed={5} /><div className="grow">{enc.text}</div></div>
                <div className="row mt" style={{ flexWrap: 'wrap' }}>
                  {enc.choices.map((c, i) => <button key={i} className="btn grow" onClick={() => restockChoose(i)}>{c.label}</button>)}
                </div>
              </div>
            ) : (
              <>
                <button className="grabbtn" onPointerDown={(e) => { e.preventDefault(); restockGrab(); }}>
                  <span>GRAB</span>
                  <i style={{ width: `${run.grabProgress * 100}%` }} />
                </button>
                <div className="small center">Mash it. {run.rivals.length ? 'Moms and kids will interrupt.' : 'Nobody ahead of you. Go.'}</div>
              </>
            )}
            <div className="runlog">{run.log.slice(-2).map((l, i) => <div key={i}>{l}</div>)}</div>
          </>
        )}

        {run.phase === 'done' && (
          <>
            <p>{run.log[run.log.length - 1]}</p>
            <p className="small">{run.grabbed} in the cart · heat {run.heat >= 0 ? '+' : ''}{run.heat} · kids spared {run.kidsSpared} · kids snatched {run.kidsSnatched} · moms argued {run.momsArgued} · bros raced {run.brosRaced}</p>
            <button className="btn mint block" onClick={restockFinish}>Check out</button>
          </>
        )}
      </div>
    </div>
  );
}

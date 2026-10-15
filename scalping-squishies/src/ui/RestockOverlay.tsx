import { useState } from 'react';
import { useGame } from '../engine/store';
import { STORE_BY_ID } from '../engine/data/stores';
import { PHONE_ACTIONS } from '../engine/data/restock';
import { ITEM_BY_ID, RARITY_LABEL, VARIANT_LABEL } from '../engine/data/items';
import { encounterDef, DOORS_SECONDS, CAMP_SECONDS, SKIP_CAMP_PENALTY } from '../engine/restock';
import { formatCash } from '../engine/math';
import { Sprite } from '../art/Sprite';
import { Portrait, StoreSprite } from '../art/Portrait';

/** Full-screen restock run: camp-or-skip, the camp (line) phase, doors (mash GRAB), results. */
export function RestockOverlay() {
  const run = useGame((g) => g.run);
  const result = useGame((g) => g.runResult);
  const s = useGame((g) => g.s);
  const restockGrab = useGame((g) => g.restockGrab);
  const restockChoose = useGame((g) => g.restockChoose);
  const restockFinish = useGame((g) => g.restockFinish);
  const restockDismiss = useGame((g) => g.restockDismiss);
  const restockCamp = useGame((g) => g.restockCamp);
  const restockSkip = useGame((g) => g.restockSkip);
  const restockCampChoose = useGame((g) => g.restockCampChoose);
  const restockPhone = useGame((g) => g.restockPhone);
  const dealAccept = useGame((g) => g.dealAccept);
  const dealDecline = useGame((g) => g.dealDecline);
  const [phoneOpen, setPhoneOpen] = useState(false);

  if (result) {
    return (
      <div className="overlay">
        <div className="modal center">
          <h2>{result.banned ? 'Escorted out' : result.grabbed >= 8 ? 'Cleared the shelf' : result.grabbed > 0 ? 'Haul secured' : 'Went home empty'}</h2>
          <p>{result.grabbed} grabbed · +{formatCash(result.cash)} · heat {result.heat >= 0 ? '+' : ''}{result.heat}{result.fakes ? ` · ${result.fakes} counterfeit` : ''}</p>
          {result.banned && <p style={{ color: 'var(--red)' }}>Banned from this store for 10 minutes. No runs, no restocks. Your photo is by the register.</p>}
          <div className="pulls">
            {result.items.map((p, i) => (
              <div className="pull" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="i"><Sprite id={p.item.id} size={56} variant={p.variant} /></div>
                <div className="n">{p.variant !== 'standard' ? `${VARIANT_LABEL[p.variant]} ` : ''}{p.item.name}</div>
                <span className={`tag ${p.item.rarity}`}>{RARITY_LABEL[p.item.rarity]}</span>
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
  const ahead = run.rivals.slice(0, run.position);
  const extra = Math.max(0, run.position - run.rivals.length);
  const firstOffer = s.offers[0];

  const choices = (onPick: (i: number) => void) => enc && (
    <div className="encounter mt">
      <div className="row"><Portrait kind={enc.kind === 'employee' && run.phase === 'doors' ? 'manager' : enc.kind} size={40} seed={5} /><div className="grow">{enc.text}</div></div>
      {run.eventExpiresIn !== null && enc.timed && (
        <div className="progress mt" style={{ height: 6 }}><i style={{ width: `${(run.eventExpiresIn / enc.timed) * 100}%`, background: 'var(--red)' }} /></div>
      )}
      <div className="row mt" style={{ flexWrap: 'wrap' }}>
        {enc.choices.map((c, i) => <button key={i} className={`btn grow ${enc.timed ? 'gold' : ''}`} onClick={() => onPick(i)}>{c.label}</button>)}
      </div>
    </div>
  );

  return (
    <div className="overlay run">
      <div className="modal">
        <div className="row between">
          <h2 className="row" style={{ gap: 8 }}><StoreSprite id={st.id} size={32} /> {st.name} restock</h2>
          <span className="pill">{run.phase === 'choice' ? '6:00am' : run.phase === 'camp' ? `${Math.ceil(run.campLeft)}s to open` : run.phase === 'doors' ? `${Math.ceil(run.timeLeft)}s` : 'done'}</span>
        </div>

        {run.phase === 'choice' && (
          <>
            <p>{run.log[0]}</p>
            <p className="small">Shelf has <b>{run.stock}</b>. {run.rivals.length} people are already here. Camp the line and things will happen to you; show up at opening and {SKIP_CAMP_PENALTY} more people beat you to it.</p>
            <button className="card city" onClick={restockCamp}>
              <div className="row"><div className="ico-lg">⛺</div><div className="grow" style={{ textAlign: 'left' }}><h3>Camp the line</h3><div className="sub">{CAMP_SECONDS} seconds. Coffee runs, bathroom breaks, ticket hand-outs, rain, moms. Your spot can move up or down. Your phone works.</div></div></div>
            </button>
            <button className="card city" onClick={restockSkip}>
              <div className="row"><div className="ico-lg">🚗</div><div className="grow" style={{ textAlign: 'left' }}><h3>Show up at opening</h3><div className="sub">Skip the wait. Start {SKIP_CAMP_PENALTY} spots further back.</div></div></div>
            </button>
          </>
        )}

        {run.phase === 'camp' && (
          <>
            <div className="progress"><i style={{ width: `${(run.campLeft / CAMP_SECONDS) * 100}%` }} /></div>
            <div className="row between small mt">
              <span>You are <b>#{run.position + 1}</b> in line</span>
              <span>~<b>{run.remaining}</b> left for you</span>
            </div>
            <div className="lineviz">
              {ahead.map((r, i) => <span key={i} title={`${r.name} takes ${r.takes}`}><Portrait kind={r.kind} size={26} seed={i} /></span>)}
              {Array.from({ length: extra }, (_, i) => <span key={`x${i}`} className="dim"><Portrait kind="buyer" size={26} seed={i + 40} /></span>)}
              <span className="you"><Portrait kind="you" size={30} /></span>
            </div>
            {enc ? choices(restockCampChoose) : phoneOpen ? (
              <div className="encounter mt">
                <div className="row between"><b>📱 Marketplace</b><button className="btn ghost sm" onClick={() => setPhoneOpen(false)}>Put it away</button></div>
                {firstOffer ? (
                  <>
                    <div className="small mt"><b>{firstOffer.buyer}</b> · {ITEM_BY_ID[firstOffer.itemId].name}</div>
                    <div className="msg">{firstOffer.message}</div>
                    {firstOffer.amount > 0 && <div className="small">{formatCash(firstOffer.amount)} · {firstOffer.qty.toLocaleString()} × {formatCash(firstOffer.unit)}</div>}
                    <div className="row mt">
                      <button className="btn grow" onClick={() => { dealDecline(firstOffer.id); setPhoneOpen(false); }}>Decline</button>
                      {firstOffer.kind !== 'karen' && <button className="btn mint grow" onClick={() => { dealAccept(firstOffer.id); setPhoneOpen(false); }}>Accept</button>}
                    </div>
                  </>
                ) : <div className="small mt">No messages. The group chat is just Brenda typing.</div>}
              </div>
            ) : (
              <div className="phone mt">
                <div className="small">Waiting. Phone out?</div>
                <div className="row mt" style={{ flexWrap: 'wrap' }}>
                  {PHONE_ACTIONS.map((a) => (
                    <button key={a.id} className="btn sm grow" disabled={run.phoneUsed.includes(a.id)} title={a.blurb} onClick={() => { if (a.id === 'message') { restockPhone('message'); setPhoneOpen(true); } else restockPhone(a.id); }}>
                      {a.icon} {a.label}{run.phoneUsed.includes(a.id) ? ' ✓' : ''}
                    </button>
                  ))}
                </div>
                <div className="small mt" style={{ color: 'var(--muted)' }}>{PHONE_ACTIONS.map((a) => `${a.icon} ${a.blurb}`).join(' · ')}</div>
              </div>
            )}
            <div className="runlog">{run.log.slice(-2).map((l, i) => <div key={i}>{l}</div>)}</div>
          </>
        )}

        {run.phase === 'doors' && (
          <>
            <div className="row between small">
              <span>Shelf: <b>{run.remaining}</b></span>
              <span>Cart: <b>{run.grabbed}</b>/{run.limit !== null ? Math.min(run.limit, run.carry) : run.carry}</span>
            </div>
            <div className="progress mt"><i style={{ width: `${(run.timeLeft / DOORS_SECONDS) * 100}%` }} /></div>
            {enc ? choices(restockChoose) : (
              <>
                <button className="grabbtn" onPointerDown={(e) => { e.preventDefault(); restockGrab(); }}>
                  <span>GRAB</span>
                  <i style={{ width: `${run.grabProgress * 100}%` }} />
                </button>
                <div className="small center">Mash it. {run.position > 0 ? 'Moms and kids will interrupt.' : 'Nobody ahead of you. Go.'}</div>
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

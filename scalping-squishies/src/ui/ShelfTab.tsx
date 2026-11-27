import { useState } from 'react';
import { useGame } from '../engine/store';
import { ITEMS, ITEM_BY_ID, RARITY_LABEL, RARITY_ORDER, RARITY_SHELF_BONUS, VARIANTS, VARIANT_LABEL, VARIANT_ICON, VARIANT_BONUS_MULT, shelfKey } from '../engine/data/items';
import { CLOUT_COSTS } from '../engine/data/shop';
import { dupeSaleValue, computeModifiers, highestUnlockedStore, rollRarity, setProgress } from '../engine/sim';
import { STORE_BY_ID, STORES } from '../engine/data/stores';
import { formatCash } from '../engine/math';
import type { ItemFamily, Variant } from '../engine/types';
import { Sprite } from '../art/Sprite';
import { Portrait } from '../art/Portrait';
import { SEASON_BY_ID } from '../engine/data/seasons';
import { visibleSeasonItems } from '../engine/season';
import { tradeableDupes } from '../engine/trades';
import { itemsForStore } from '../engine/data/items';
import { parseShelfKey } from '../engine/data/items';

export function ShelfTab() {
  const s = useGame((g) => g.s);
  const now = useGame((g) => g.now);
  const pull = useGame((g) => g.pull);
  const sellDupe = useGame((g) => g.sellDupe);
  const watchAd = useGame((g) => g.watchAd);
  const [fam, setFam] = useState<ItemFamily | 'all' | 'sets' | 'season' | 'trades'>('all');
  const acceptTradeOffer = useGame((g) => g.acceptTradeOffer);
  const postWantedAd = useGame((g) => g.postWantedAd);
  const [sel, setSel] = useState<string | null>(null);
  const m = computeModifiers(s, now);
  const slots = ITEMS.length * VARIANTS.length;
  const ownedSlots = ITEMS.reduce((a, i) => a + VARIANTS.filter((v) => (s.shelf[shelfKey(i.id, v)] ?? 0) > 0).length, 0);
  const seasonItems = visibleSeasonItems(s);
  const liveSeason = s.season.id ? SEASON_BY_ID[s.season.id] : null;
  const list = fam === 'season' ? seasonItems : fam === 'trades' ? [] : ITEMS.filter((i) => fam === 'all' || i.family === fam);
  const openTrades = s.trades.offers.filter((o) => !s.trades.done.includes(o.id));
  const hunting = STORE_BY_ID[highestUnlockedStore(s)];
  const selected = sel ? ITEM_BY_ID[sel] ?? null : null;
  const adReady = (s.adCooldowns.free_pull ?? 0) <= now;
  const sets = setProgress(s);
  const setsDone = sets.filter((x) => x.done).length;

  // Approximate odds for display (2k sample).
  const odds: Record<string, number> = {};
  let seed = 12345;
  const r = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (let i = 0; i < 2000; i++) {
    const k = rollRarity(hunting.id, m.pullLuck, r);
    odds[k] = (odds[k] ?? 0) + 1;
  }
  const chaseWeight = STORE_BY_ID[hunting.id].pullWeights.chase ?? 0;
  const totalWeight = Object.values(STORE_BY_ID[hunting.id].pullWeights).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div>
      <div className="card">
        <div className="row between">
          <div>
            <h3>Mystery pull · {hunting.name}</h3>
            <div className="sub">Shelf bonus: +{((m.shelfMult - 1) * 100).toFixed(1)}% profit · {ownedSlots}/{slots} slots · {setsDone}/{sets.length} sets</div>
          </div>
        </div>
        <div className="row mt">
          <button className="btn primary grow" onClick={() => pull(1)} disabled={s.clout < CLOUT_COSTS.pull}>
            <span className="btn-col"><span>Pull x1</span><span className="price">💠{CLOUT_COSTS.pull}</span></span>
          </button>
          <button className="btn primary grow" onClick={() => pull(10)} disabled={s.clout < CLOUT_COSTS.pull10}>
            <span className="btn-col"><span>Pull x10</span><span className="price">💠{CLOUT_COSTS.pull10}</span></span>
          </button>
          <button className="btn gold grow" data-tut="free-pull" onClick={() => void watchAd('free_pull')} disabled={!adReady}>
            <span className="btn-col"><span>📺 Free</span><span className="price">{adReady ? 'watch video' : 'cooldown'}</span></span>
          </button>
        </div>
        <div className="small mt">
          Odds: {RARITY_ORDER.filter((k) => odds[k] && k !== 'chase').map((k) => `${RARITY_LABEL[k]} ${((odds[k] / 2000) * 100).toFixed(1)}%`).join(' · ')}
          {chaseWeight > 0 && ` · Chase 1 in ${Math.round(totalWeight / chaseWeight / (1 + m.pullLuck * 6)).toLocaleString()}`}
        </div>
        <div className="small">Variants: Standard 70% · ✦ Glitter 15% · ☼ Glow 10% · • Mini 5%. Luck shifts the odds up.</div>
      </div>

      <div className="seg">
        {(['all', 'squish', 'doh', 'sets', 'trades', 'season'] as const).filter((f) => f !== 'season' || seasonItems.length > 0).map((f) => (
          <button key={f} className={fam === f ? 'active' : ''} onClick={() => setFam(f)}>
            {f === 'all' ? 'All' : f === 'squish' ? '🍌' : f === 'doh' ? '🧊' : f === 'sets' ? '📚 Sets' : f === 'trades' ? `🔄${openTrades.length ? ` ${openTrades.length}` : ''}` : `${liveSeason?.icon ?? '🎁'}`}
          </button>
        ))}
      </div>

      {fam === 'trades' ? (
        <div>
          <div className="card">
            <h3>Trade board</h3>
            <div className="sub">Collectors in the group swap pieces you are missing for your duplicates. Three offers a day, you always keep one copy, and nobody trades up more than one tier.</div>
          </div>
          {s.trades.wanted ? (
            <div className="card row" style={{ borderColor: 'var(--gold)' }}>
              <div className="ico-lg">📌</div>
              <div className="grow"><b>Wanted: {ITEM_BY_ID[s.trades.wanted.itemId]?.name}</b><div className="sub">Posted {s.trades.wanted.postedOn}. A collector shows up within three days if you hold a dupe near its tier, for one copy more than usual.</div></div>
              <button className="btn sm ghost" onClick={() => postWantedAd(null)}>Take down</button>
            </div>
          ) : (
            <div className="card sub">📌 No wanted post. Open any piece you do not own and post it; one at a time.</div>
          )}
          {openTrades.length === 0 && (
            <div className="card center sub">{tradeableDupes(s).length === 0 ? 'No duplicates on the shelf yet. Pull a few and the offers start.' : s.trades.offers.length ? 'All traded. New offers tomorrow.' : 'The board rolls at midnight.'}</div>
          )}
          {openTrades.map((o) => {
            const give = parseShelfKey(o.giveKey);
            const giveItem = ITEM_BY_ID[give.itemId];
            const getItem = ITEM_BY_ID[o.getItemId];
            const have = s.shelf[o.giveKey] ?? 0;
            const can = have >= o.giveQty + 1;
            return (
              <div className="card" key={o.id}>
                <div className="row">{o.portrait ? <Portrait kind={o.portrait} size={40} seed={o.seed ?? 0} /> : <span style={{ fontSize: 22 }}>{o.icon}</span>}<div className="grow"><b>{o.collector}</b>{o.wanted && <span className="tag select" style={{ marginLeft: 6 }}>📌 your post</span>}<div className="sub">{o.line}</div></div></div>
                <div className="row mt" style={{ alignItems: 'center', gap: 10 }}>
                  <div className="center" style={{ flex: 1 }}>
                    <Sprite id={giveItem.id} size={44} variant={give.variant} />
                    <div className="small">You give ×{o.giveQty}</div>
                    <div className="small"><b>{give.variant !== 'standard' ? `${VARIANT_LABEL[give.variant]} ` : ''}{giveItem.name}</b> (have {have})</div>
                  </div>
                  <span style={{ fontSize: 22 }}>➡️</span>
                  <div className="center" style={{ flex: 1 }}>
                    <Sprite id={getItem.id} size={44} variant={o.getVariant} />
                    <div className="small">You get</div>
                    <div className="small"><b>{o.getVariant !== 'standard' ? `${VARIANT_LABEL[o.getVariant]} ` : ''}{getItem.name}</b> <span className={`tag ${getItem.rarity}`}>{RARITY_LABEL[getItem.rarity]}</span></div>
                  </div>
                </div>
                <button className="btn mint block mt" disabled={!can} onClick={() => acceptTradeOffer(o.id)}>{can ? 'Trade' : `Need ${o.giveQty + 1} copies`}</button>
              </div>
            );
          })}
        </div>
      ) : fam === 'sets' ? (
        <div>
          {STORES.map((st) => {
            const rows = sets.filter((x) => x.id.startsWith(`${st.id}:`));
            if (rows.length === 0) return null;
            return (
              <div className="card" key={st.id}>
                <h3>{st.name} page</h3>
                {(() => {
                  // Cheapest route to finish the standard page: pull odds at this store vs the trade board today.
                  const missing = itemsForStore(st.id).filter((i) => (s.shelf[i.id] ?? 0) === 0);
                  if (missing.length === 0) return <div className="sub" style={{ color: 'var(--mint)' }}>Standard page complete.</div>;
                  const w = st.pullWeights;
                  const total = Object.values(w).reduce((a, b) => a + (b ?? 0), 0);
                  const byRarity = missing.reduce<Record<string, number>>((acc, i) => { acc[i.rarity] = (acc[i.rarity] ?? 0) + 1; return acc; }, {});
                  const onBoard = openTrades.filter((o) => missing.some((i) => i.id === o.getItemId)).length;
                  const unlocked = (s.stores[st.id]?.units ?? 0) > 0;
                  const odds = Object.entries(byRarity).map(([r, n]) => `${n} ${RARITY_LABEL[r as keyof typeof RARITY_LABEL].toLowerCase()} (${(((w[r as keyof typeof w] ?? 0) / total) * 100).toFixed(1)}% per pull here)`).join(', ');
                  return <div className="sub">Missing {missing.length}: {odds}.{onBoard ? ` ${onBoard} on the trade board today.` : ''}{!unlocked ? ` Start a run at ${st.name} to pull from this page.` : ''}</div>;
                })()}
                {rows.map((x) => (
                  <div className="row between small" key={x.id} style={{ marginTop: 4 }}>
                    <span>{VARIANT_ICON[x.variant as Variant]} {VARIANT_LABEL[x.variant as Variant]} · {x.have}/{x.total}</span>
                    <span style={{ color: x.done ? 'var(--mint)' : 'var(--muted)' }}>{x.done ? '✓ ' : ''}+{(x.bonus * 100).toFixed(0)}% profit</span>
                  </div>
                ))}
              </div>
            );
          })}
          {sets.filter((x) => x.variant === 'family' || x.variant === 'season').map((x) => (
            <div className="card row between" key={x.id}>
              <h3>{x.label} · {x.have}/{x.total}</h3>
              <span className="small" style={{ color: x.done ? 'var(--mint)' : 'var(--muted)' }}>{x.done ? '✓ ' : ''}+{(x.bonus * 100).toFixed(0)}% profit</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid">
          {list.map((it) => {
            const c = s.shelf[it.id] ?? 0;
            const owned = VARIANTS.filter((v) => (s.shelf[shelfKey(it.id, v)] ?? 0) > 0);
            const known = owned.length > 0;
            return (
              <button className={`item r-${it.rarity} ${known ? '' : 'unknown'}`} key={it.id} onClick={() => setSel(it.id)}>
                <div className="i"><Sprite id={it.id} size={44} /></div>
                <div className="n">{known ? it.name : '???'}</div>
                {c > 1 && <span className="c">×{c}</span>}
                {known && <div className="variants">{VARIANTS.filter((v) => v !== 'standard').map((v) => <span key={v} className={owned.includes(v) ? 'on' : ''}>{VARIANT_ICON[v]}</span>)}</div>}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="overlay" onClick={() => setSel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="center"><Sprite id={selected.id} size={110} /></div>
            <h2 className="center">{VARIANTS.some((v) => (s.shelf[shelfKey(selected.id, v)] ?? 0) > 0) ? selected.name : 'Unknown item'}</h2>
            <div className="center"><span className={`tag ${selected.rarity}`}>{RARITY_LABEL[selected.rarity]}</span></div>
            <p>{VARIANTS.some((v) => (s.shelf[shelfKey(selected.id, v)] ?? 0) > 0) ? selected.blurb : selected.season ? `${SEASON_BY_ID[selected.season]?.name} exclusive. Drops from pulls while the season is on, or buy it in the event shop.` : `Drops from ${STORE_BY_ID[selected.storeId].name}.`}</p>
            <p className="small">Retail ${selected.retail} · resale ~{selected.resaleMult}x</p>
            {VARIANTS.map((v) => {
              const key = shelfKey(selected.id, v);
              const c = s.shelf[key] ?? 0;
              return (
                <div className="row between vrow" key={v}>
                  <div className="row" style={{ gap: 8 }}>
                    <Sprite id={selected.id} size={30} variant={v} />
                    <div>
                      <b>{VARIANT_LABEL[v]}</b> <span className="small">{c > 0 ? `×${c}` : 'not owned'}</span>
                      <div className="small">+{(RARITY_SHELF_BONUS[selected.rarity] * VARIANT_BONUS_MULT[v] * 100).toFixed(1)}% when owned</div>
                    </div>
                  </div>
                  {c > 1 && <button className="btn mint sm" onClick={() => sellDupe(key)}>Flip dupe {formatCash(dupeSaleValue(s, key, now))}</button>}
                </div>
              );
            })}
            {!selected.season && (s.shelf[selected.id] ?? 0) === 0 && (
              s.trades.wanted?.itemId === selected.id
                ? <button className="btn gold block mt" onClick={() => postWantedAd(null)}>📌 Posted as wanted · take down</button>
                : <button className="btn block mt" onClick={() => { postWantedAd(selected.id); setFam('trades'); setSel(null); }}>📌 Post a wanted ad{s.trades.wanted ? ' (replaces the current one)' : ''}</button>
            )}
            <button className="btn block mt" onClick={() => setSel(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

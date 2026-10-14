import { useState } from 'react';
import { useGame } from '../engine/store';
import { ITEMS, RARITY_LABEL, RARITY_ORDER, RARITY_SHELF_BONUS, VARIANTS, VARIANT_LABEL, VARIANT_ICON, VARIANT_BONUS_MULT, shelfKey } from '../engine/data/items';
import { CLOUT_COSTS } from '../engine/data/shop';
import { dupeSaleValue, computeModifiers, highestUnlockedStore, rollRarity, setProgress } from '../engine/sim';
import { STORE_BY_ID, STORES } from '../engine/data/stores';
import { formatCash } from '../engine/math';
import type { ItemFamily, Variant } from '../engine/types';
import { Sprite } from '../art/Sprite';

export function ShelfTab() {
  const s = useGame((g) => g.s);
  const now = useGame((g) => g.now);
  const pull = useGame((g) => g.pull);
  const sellDupe = useGame((g) => g.sellDupe);
  const watchAd = useGame((g) => g.watchAd);
  const [fam, setFam] = useState<ItemFamily | 'all' | 'sets'>('all');
  const [sel, setSel] = useState<string | null>(null);
  const m = computeModifiers(s, now);
  const slots = ITEMS.length * VARIANTS.length;
  const ownedSlots = ITEMS.reduce((a, i) => a + VARIANTS.filter((v) => (s.shelf[shelfKey(i.id, v)] ?? 0) > 0).length, 0);
  const list = ITEMS.filter((i) => fam === 'all' || i.family === fam);
  const hunting = STORE_BY_ID[highestUnlockedStore(s)];
  const selected = sel ? ITEMS.find((i) => i.id === sel) : null;
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
        {(['all', 'squish', 'doh', 'sets'] as const).map((f) => (
          <button key={f} className={fam === f ? 'active' : ''} onClick={() => setFam(f)}>
            {f === 'all' ? 'All' : f === 'squish' ? '🍌 Squishies' : f === 'doh' ? '🧊 Dohs' : '📚 Sets'}
          </button>
        ))}
      </div>

      {fam === 'sets' ? (
        <div>
          {STORES.map((st) => {
            const rows = sets.filter((x) => x.id.startsWith(`${st.id}:`));
            if (rows.length === 0) return null;
            return (
              <div className="card" key={st.id}>
                <h3>{st.name} page</h3>
                {rows.map((x) => (
                  <div className="row between small" key={x.id} style={{ marginTop: 4 }}>
                    <span>{VARIANT_ICON[x.variant as Variant]} {VARIANT_LABEL[x.variant as Variant]} · {x.have}/{x.total}</span>
                    <span style={{ color: x.done ? 'var(--mint)' : 'var(--muted)' }}>{x.done ? '✓ ' : ''}+{(x.bonus * 100).toFixed(0)}% profit</span>
                  </div>
                ))}
              </div>
            );
          })}
          {sets.filter((x) => x.variant === 'family').map((x) => (
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
            <p>{VARIANTS.some((v) => (s.shelf[shelfKey(selected.id, v)] ?? 0) > 0) ? selected.blurb : `Drops from ${STORE_BY_ID[selected.storeId].name}.`}</p>
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
            <button className="btn block mt" onClick={() => setSel(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useGame } from '../engine/store';
import { ITEMS, RARITY_LABEL, RARITY_ORDER, RARITY_SHELF_BONUS } from '../engine/data/items';
import { CLOUT_COSTS } from '../engine/data/shop';
import { dupeSaleValue, computeModifiers, highestUnlockedStore, rollRarity } from '../engine/sim';
import { STORE_BY_ID } from '../engine/data/stores';
import { formatCash } from '../engine/math';
import type { ItemFamily } from '../engine/types';
import { Sprite } from '../art/Sprite';

export function ShelfTab() {
  const s = useGame((g) => g.s);
  const now = useGame((g) => g.now);
  const pull = useGame((g) => g.pull);
  const sellDupe = useGame((g) => g.sellDupe);
  const watchAd = useGame((g) => g.watchAd);
  const [fam, setFam] = useState<ItemFamily | 'all'>('all');
  const [sel, setSel] = useState<string | null>(null);
  const m = computeModifiers(s, now);
  const owned = ITEMS.filter((i) => (s.shelf[i.id] ?? 0) > 0);
  const bonus = owned.reduce((a, i) => a + RARITY_SHELF_BONUS[i.rarity], 0);
  const list = ITEMS.filter((i) => fam === 'all' || i.family === fam);
  const hunting = STORE_BY_ID[highestUnlockedStore(s)];
  const selected = sel ? ITEMS.find((i) => i.id === sel) : null;
  const adReady = (s.adCooldowns.free_pull ?? 0) <= now;

  // Approximate odds for display (10k sample).
  const odds: Record<string, number> = {};
  let seed = 12345;
  const r = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (let i = 0; i < 2000; i++) {
    const k = rollRarity(hunting.id, m.pullLuck, r);
    odds[k] = (odds[k] ?? 0) + 1;
  }

  return (
    <div>
      <div className="card">
        <div className="row between">
          <div>
            <h3>Mystery pull · {hunting.icon} {hunting.name}</h3>
            <div className="sub">Shelf bonus: +{(bonus * 100).toFixed(1)}% profit · {owned.length}/{ITEMS.length} collected</div>
          </div>
        </div>
        <div className="row mt">
          <button className="btn primary grow" onClick={() => pull(1)} disabled={s.clout < CLOUT_COSTS.pull}>
            <span className="btn-col"><span>Pull x1</span><span className="price">💠{CLOUT_COSTS.pull}</span></span>
          </button>
          <button className="btn primary grow" onClick={() => pull(10)} disabled={s.clout < CLOUT_COSTS.pull10}>
            <span className="btn-col"><span>Pull x10</span><span className="price">💠{CLOUT_COSTS.pull10}</span></span>
          </button>
          <button className="btn gold grow" onClick={() => void watchAd('free_pull')} disabled={!adReady}>
            <span className="btn-col"><span>📺 Free</span><span className="price">{adReady ? 'watch video' : 'cooldown'}</span></span>
          </button>
        </div>
        <div className="small mt">
          Odds: {RARITY_ORDER.filter((k) => odds[k]).map((k) => `${RARITY_LABEL[k]} ${((odds[k] / 2000) * 100).toFixed(1)}%`).join(' · ')}
        </div>
      </div>

      <div className="seg">
        {(['all', 'squish', 'doh'] as const).map((f) => (
          <button key={f} className={fam === f ? 'active' : ''} onClick={() => setFam(f)}>
            {f === 'all' ? 'All' : f === 'squish' ? '🍌 Squishies' : '🧊 Dohs'}
          </button>
        ))}
      </div>
      <div className="grid">
        {list.map((it) => {
          const c = s.shelf[it.id] ?? 0;
          return (
            <button className={`item r-${it.rarity} ${c > 0 ? '' : 'unknown'}`} key={it.id} onClick={() => setSel(it.id)}>
              <div className="i"><Sprite id={it.id} size={44} /></div>
              <div className="n">{c > 0 ? it.name : '???'}</div>
              {c > 0 && <span className="c">×{c}</span>}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="overlay" onClick={() => setSel(null)}>
          <div className="modal center" onClick={(e) => e.stopPropagation()}>
            <div className="center"><Sprite id={selected.id} size={110} /></div>
            <h2>{(s.shelf[selected.id] ?? 0) > 0 ? selected.name : 'Unknown item'}</h2>
            <span className={`tag ${selected.rarity}`}>{RARITY_LABEL[selected.rarity]}</span>
            <p>{(s.shelf[selected.id] ?? 0) > 0 ? selected.blurb : `Drops from ${STORE_BY_ID[selected.storeId].name}.`}</p>
            <p className="small">Retail ${selected.retail} · resale ~{selected.resaleMult}x · shelf bonus +{(RARITY_SHELF_BONUS[selected.rarity] * 100).toFixed(1)}%</p>
            {(s.shelf[selected.id] ?? 0) > 1 && (
              <button className="btn mint block" onClick={() => sellDupe(selected.id)}>
                Flip a duplicate for {formatCash(dupeSaleValue(s, selected.id, now))}
              </button>
            )}
            <button className="btn block mt" onClick={() => setSel(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

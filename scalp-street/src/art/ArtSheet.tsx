import { ITEMS } from '../engine/data/items';
import { STORES } from '../engine/data/stores';
import { Sprite } from './Sprite';
import { Portrait, StoreSprite, type PortraitKind } from './Portrait';

const KINDS: PortraitKind[] = ['mom', 'kid', 'reseller', 'grandpa', 'employee', 'sneakerbro', 'karen', 'buyer', 'scammer', 'ghost', 'trader', 'manager', 'you'];

/** Dev contact sheet: open the app with #art to review every sprite. */
export function ArtSheet() {
  return (
    <div style={{ padding: 16, background: '#1a1030', color: '#fff', fontFamily: 'sans-serif' }}>
      <h2>Items ({ITEMS.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
        {ITEMS.map((it) => (
          <div key={it.id} style={{ textAlign: 'center', fontSize: 9, background: '#2d1f54', borderRadius: 8, padding: 4 }}>
            <Sprite id={it.id} size={56} />
            <div>{it.name}</div>
          </div>
        ))}
      </div>
      <h2>Portraits</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {KINDS.map((k, i) => <div key={k} style={{ textAlign: 'center', fontSize: 10 }}><Portrait kind={k} size={56} seed={i} /><div>{k}</div></div>)}
      </div>
      <h2>Stores</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {STORES.map((s) => <div key={s.id} style={{ textAlign: 'center', fontSize: 10 }}><StoreSprite id={s.id} size={56} /><div>{s.name}</div></div>)}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../engine/store';
import { createMockProvider } from '../monetization';
import type { AdPlacement } from '../monetization';
import { Header } from './Header';
import { HuntTab } from './HuntTab';
import { StoresTab } from './StoresTab';
import { ShelfTab } from './ShelfTab';
import { BoostTab } from './BoostTab';
import { ShopTab } from './ShopTab';
import { Overlays, AdOverlay, PurchaseOverlay } from './Overlays';
import { dailyAvailable } from '../engine/sim';
import { MISSION_POOL } from '../engine/data/missions';

export type Tab = 'hunt' | 'stores' | 'shelf' | 'boost' | 'shop';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hunt', label: 'Hunt', icon: '🍌' },
  { id: 'stores', label: 'Routes', icon: '🛒' },
  { id: 'shelf', label: 'Shelf', icon: '📒' },
  { id: 'boost', label: 'Hustle', icon: '⚡' },
  { id: 'shop', label: 'Shop', icon: '💠' },
];

interface AdReq { placement: AdPlacement; kind: 'rewarded' | 'interstitial'; resolve: (ok: boolean) => void }
interface BuyReq { productId: string; price: string; resolve: (ok: boolean) => void }

export function App() {
  const [tab, setTab] = useState<Tab>('hunt');
  const [adReq, setAdReq] = useState<AdReq | null>(null);
  const [buyReq, setBuyReq] = useState<BuyReq | null>(null);
  const load = useGame((g) => g.load);
  const save = useGame((g) => g.save);
  const frame = useGame((g) => g.frame);
  const setProvider = useGame((g) => g.setProvider);
  const s = useGame((g) => g.s);
  const now = useGame((g) => g.now);
  const loaded = useRef(false);

  // Boot: provider, load save (offline earnings), start the loop, autosave.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    setProvider(
      createMockProvider({
        onSimulatedAd: (placement, kind) => new Promise<boolean>((resolve) => setAdReq({ placement, kind, resolve })),
        onSimulatedPurchase: (productId, price) => new Promise<boolean>((resolve) => setBuyReq({ productId, price, resolve })),
      }),
    );
    load();
    const loop = setInterval(() => frame(Date.now()), 100);
    const saver = setInterval(() => save(), 10_000);
    const onVis = () => {
      if (document.visibilityState === 'hidden') save();
      else frame(Date.now());
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', save);
    return () => {
      clearInterval(loop);
      clearInterval(saver);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', save);
    };
  }, [load, save, frame, setProvider]);

  const dots = useMemo(() => {
    const hunt = dailyAvailable(s, now) || s.missions.some((m) => {
      const d = MISSION_POOL.find((x) => x.id === m.id);
      return d && !m.claimed && m.progress >= d.target;
    });
    return { hunt, shop: !s.iap.starterPackBought } as Partial<Record<Tab, boolean>>;
  }, [s, now]);

  return (
    <div className="app">
      <Header />
      <main className="main">
        {tab === 'hunt' && <HuntTab />}
        {tab === 'stores' && <StoresTab />}
        {tab === 'shelf' && <ShelfTab />}
        {tab === 'boost' && <BoostTab />}
        {tab === 'shop' && <ShopTab />}
      </main>
      <nav className="nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="ico">{t.icon}</span>
            {t.label}
            {dots[t.id] && <span className="dot" />}
          </button>
        ))}
      </nav>
      <Overlays />
      {adReq && (
        <AdOverlay
          placement={adReq.placement}
          kind={adReq.kind}
          onDone={(ok) => {
            adReq.resolve(ok);
            setAdReq(null);
          }}
        />
      )}
      {buyReq && (
        <PurchaseOverlay
          productId={buyReq.productId}
          price={buyReq.price}
          onDone={(ok) => {
            buyReq.resolve(ok);
            setBuyReq(null);
          }}
        />
      )}
    </div>
  );
}

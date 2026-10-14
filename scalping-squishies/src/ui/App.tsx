import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../engine/store';
import { createMockProvider, createCapacitorProvider } from '../monetization';
import { createAnalytics } from '../net/analytics';
import { getDeviceId } from '../net/identity';
import { authAnon, getToken, cloudEnabled } from '../net/api';
import { isNative, platform, onAppStateChange, scheduleReturnNotifications } from '../platform/native';
import { computeModifiers } from '../engine/sim';
import { STORES } from '../engine/data/stores';
import type { AdPlacement } from '../monetization';
import { Header } from './Header';
import { HuntTab } from './HuntTab';
import { StoresTab } from './StoresTab';
import { DealsTab } from './DealsTab';
import { ShelfTab } from './ShelfTab';
import { BoostTab } from './BoostTab';
import { ShopTab } from './ShopTab';
import { Overlays, AdOverlay, PurchaseOverlay } from './Overlays';
import { RestockOverlay } from './RestockOverlay';
import { RelocateOverlay } from './RelocateOverlay';
import { Fx } from './Fx';
import { Splash } from './Splash';
import { Coach } from './Coach';
import { dailyAvailable } from '../engine/sim';
import { MISSION_POOL } from '../engine/data/missions';

export type Tab = 'hunt' | 'stores' | 'deals' | 'shelf' | 'boost' | 'shop';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hunt', label: 'Hunt', icon: '🍌' },
  { id: 'stores', label: 'Routes', icon: '🛒' },
  { id: 'deals', label: 'Messages', icon: '💬' },
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
  const tabRequest = useGame((g) => g.tabRequest);
  const requestTab = useGame((g) => g.requestTab);
  const loaded = useRef(false);

  useEffect(() => {
    if (tabRequest) { setTab(tabRequest); requestTab(null); }
  }, [tabRequest, requestTab]);

  // Boot: provider, load save (offline earnings), start the loop, autosave.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const analytics = createAnalytics(getToken, platform());
    const mock = createMockProvider({
      analytics,
      onSimulatedAd: (placement, kind) => new Promise<boolean>((resolve) => setAdReq({ placement, kind, resolve })),
      onSimulatedPurchase: (productId, price) => new Promise<boolean>((resolve) => setBuyReq({ productId, price, resolve })),
    });
    setProvider(mock);
    void (async () => {
      await load();
      if (cloudEnabled()) {
        const id = await getDeviceId();
        if (await authAnon(id)) {
          const st = useGame.getState();
          await st.cloudPull();
          await st.cloudClaimGrants();
        }
      }
      if (isNative()) {
        try {
          const id = await getDeviceId();
          setProvider(await createCapacitorProvider({ appUserId: id, analytics }));
        } catch {
          /* stay on the simulated provider */
        }
      }
    })();
    const goBackground = () => {
      save();
      void useGame.getState().cloudPush();
      const st = useGame.getState();
      const m = computeModifiers(st.s, Date.now());
      const next = STORES.filter((x) => (st.s.stores[x.id]?.units ?? 0) > 0).map((x) => ((st.s.restockReadyAt[x.id] ?? 0) - Date.now()) / 1000).filter((t) => t > 0);
      void scheduleReturnNotifications({ offlineCapHours: m.offlineCapHours, nextRestockSeconds: next.length ? Math.min(...next) : null });
    };
    const offState = onAppStateChange((active) => { if (!active) goBackground(); else frame(Date.now()); });
    const loop = setInterval(() => frame(Date.now()), 100);
    const saver = setInterval(() => save(), 10_000);
    const cloud = setInterval(() => void useGame.getState().cloudPush(), 60_000);
    const onVis = () => {
      if (document.visibilityState === 'hidden') goBackground();
      else frame(Date.now());
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', save);
    window.addEventListener('scalp-save', save);
    return () => {
      clearInterval(loop);
      clearInterval(saver);
      clearInterval(cloud);
      offState();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('scalp-save', save);
    };
  }, [load, save, frame, setProvider]);

  const dots = useMemo(() => {
    const hunt = dailyAvailable(s, now) || s.missions.some((m) => {
      const d = MISSION_POOL.find((x) => x.id === m.id);
      return d && !m.claimed && m.progress >= d.target;
    });
    return { hunt, deals: s.offers.length > 0 || s.fakes.length > 0, shop: !s.iap.starterPackBought } as Partial<Record<Tab, boolean>>;
  }, [s, now]);

  return (
    <div className="app">
      <Header />
      <main className="main">
        {tab === 'hunt' && <HuntTab />}
        {tab === 'stores' && <StoresTab />}
        {tab === 'deals' && <DealsTab />}
        {tab === 'shelf' && <ShelfTab />}
        {tab === 'boost' && <BoostTab />}
        {tab === 'shop' && <ShopTab />}
      </main>
      <nav className="nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="ico">{t.icon}</span>
            {t.label}
            {t.id === 'deals' && s.offers.length > 0 ? <span className="count">{s.offers.length}</span> : dots[t.id] && <span className="dot" />}
          </button>
        ))}
      </nav>
      <Overlays />
      <RestockOverlay />
      <RelocateOverlay />
      <Coach />
      <Fx />
      <Splash />
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

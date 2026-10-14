import { create } from 'zustand';
import type { GameState, MarketEventKind, Reward, RestockRun, Pricing, PullView } from './types';
import { startRun, openDoors, grab, tickRun, choose, finishRun } from './restock';
import { sfx, setSfxEnabled } from '../ui/sfx';
import { fx } from '../ui/fxbus';
import { TUTORIAL } from './data/tutorial';
import { RANKED_RIVALS } from './data/rivals';
import { CITY_BY_ID } from './data/cities';
import { storage, haptic } from '../platform/native';
import { pushSave, pullSave, fetchGrants, claimGrant, submitScore, cloudEnabled } from '../net/api';
import { ITEM_BY_ID } from './data/items';
import { initialState, deserialize, serialize, SAVE_KEY } from './state';
import {
  tick, computeModifiers, applyOfflineOnLoad, claimOffline, storeUnlocked, startCycle, earn, tapValue,
  pullItem, highestUnlockedStore, sellDuplicate, prestige, credForRun, rollMissions, claimMission,
  claimDaily, claimPassTier, addBoost, timeSkip, grantReward, bumpMission, isVip, isAdFree, rollCityOffer, unpull,
} from './sim';
import { STORE_BY_ID } from './data/stores';
import { MANAGER_BY_STORE } from './data/managers';
import { UPGRADE_BY_ID } from './data/upgrades';
import { CLOUT_COSTS, PRODUCTS, VIP } from './data/shop';
import { ACHIEVEMENTS } from './data/achievements';
import { acceptOffer, counterOffer, declineOffer, apologize, tossFake, flipFake, fakeRoll } from './deals';
import { unitCost, maxAffordable, todayKey } from './math';
import { AD_RULES, type AdPlacement, type MonetizationProvider } from '../monetization/provider';

export type TabId = 'hunt' | 'stores' | 'deals' | 'shelf' | 'boost' | 'shop';

export interface Toast {
  id: number;
  text: string;
  icon?: string;
  kind?: 'info' | 'good' | 'bad' | 'rare';
  /** Tapping the toast jumps to this tab. */
  tab?: TabId;
}

export type BuyAmount = 1 | 10 | 100 | 'max';

interface GameStore {
  s: GameState;
  now: number;
  toasts: Toast[];
  lastPulls: PullView[] | null;
  huntMeter: number; // 0..1, fills with taps, grants a free pull
  run: RestockRun | null;
  runResult: { items: PullView[]; fakes: number; cash: number; heat: number; banned: boolean; grabbed: number } | null;
  provider: MonetizationProvider | null;
  buyAmount: BuyAmount;

  setProvider: (p: MonetizationProvider) => void;
  load: () => Promise<void>;
  save: () => void;
  /** Replace the state with a save fetched from the cloud (after a conflict check). */
  adoptSave: (json: string) => void;
  /** Pull the cloud save on boot and adopt it if it has more play time. */
  cloudPull: () => Promise<void>;
  /** Push the local save; adopts the server copy on a conflict. */
  cloudPush: () => Promise<void>;
  /** Apply purchases recorded by the server webhook that this device has not seen. */
  cloudClaimGrants: () => Promise<void>;
  setHandle: (h: string) => void;
  reset: () => void;
  exportSave: () => string;
  importSave: (json: string) => boolean;
  frame: (now: number) => void;

  tap: () => void;
  buyUnits: (storeId: string) => void;
  setBuyAmount: (a: BuyAmount) => void;
  startStore: (storeId: string) => void;
  hireManager: (storeId: string) => void;
  buyUpgrade: (id: string) => void;
  pull: (count: 1 | 10, free?: boolean) => void;
  sellDupe: (shelfKey: string) => void;
  doPrestige: (cityId: string) => Promise<void>;
  openRelocate: () => void;
  closeRelocate: () => void;
  relocating: boolean;
  tabRequest: TabId | null;
  requestTab: (t: TabId | null) => void;
  claimOfflineNormal: () => void;
  claimOfflineDouble: () => Promise<void>;
  watchAd: (placement: AdPlacement) => Promise<void>;
  claimMissionReward: (id: string) => void;
  claimDailyReward: () => void;
  claimPass: (tier: number, premium: boolean) => void;
  buyProduct: (productId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  spendClout: (what: keyof typeof CLOUT_COSTS) => void;
  breakPiggy: () => void;
  dismissPulls: () => void;
  restockStart: (storeId: string) => void;
  restockOpen: () => void;
  restockGrab: () => void;
  restockChoose: (idx: number) => void;
  restockFinish: () => void;
  restockDismiss: () => void;
  setPricing: (p: Pricing) => void;
  dealAccept: (id: number) => void;
  dealCounter: (id: number) => void;
  dealDecline: (id: number) => void;
  apologize: () => void;
  fakeToss: (idx: number) => void;
  fakeFlip: (idx: number) => void;
  toast: (text: string, icon?: string, kind?: Toast['kind'], tab?: TabId) => void;
  dismissToast: (id: number) => void;
  setSetting: <K extends keyof GameState['settings']>(k: K, v: GameState['settings'][K]) => void;
}

let toastSeq = 1;
let rand = Math.random;

export const useGame = create<GameStore>((set, get) => {
  const mutate = (fn: (s: GameState) => void) => {
    const s = get().s;
    fn(s);
    set({ s: { ...s } });
  };
  const toast = (text: string, icon?: string, kind: Toast['kind'] = 'info', tab?: TabId) => {
    const id = toastSeq++;
    set((st) => ({ toasts: [...st.toasts.slice(-4), { id, text, icon, kind, tab }] }));
    setTimeout(() => get().dismissToast(id), tab ? 6000 : 3500);
  };
  const track = (event: string, props?: Record<string, string | number | boolean>) => get().provider?.analytics.track(event, props);

  const adAllowed = (s: GameState, placement: AdPlacement, now: number): string | null => {
    const today = todayKey(now);
    if (s.adsToday.date !== today) s.adsToday = { date: today, count: 0 };
    if (s.adsToday.count >= AD_RULES.dailyRewardedCap) return 'Daily boost limit reached. Come back tomorrow.';
    const until = s.adCooldowns[placement] ?? 0;
    if (until > now) return 'That boost is still cooling down.';
    return null;
  };

  const grantAdReward = (s: GameState, placement: AdPlacement, now: number) => {
    switch (placement) {
      case 'boost_2x':
        addBoost(s, 'ad_boost', 'x2 Video Boost', AD_RULES.rewards.boost_2x.mult, AD_RULES.rewards.boost_2x.seconds, now);
        toast('x2 profit for 4 hours!', '📺', 'good');
        break;
      case 'free_clout':
        s.clout += AD_RULES.rewards.free_clout;
        toast(`+${AD_RULES.rewards.free_clout} Clout`, '💠', 'good');
        break;
      case 'free_pull': {
        const m = computeModifiers(s, now);
        const it = pullItem(s, highestUnlockedStore(s), m.pullLuck, rand);
        set({ lastPulls: [it] });
        break;
      }
      case 'speed_up': {
        const amt = timeSkip(s, AD_RULES.rewards.speed_up.hours, now);
        toast(`Skipped 1 hour: +$${amt.toExponential(1)}`, '⏩', 'good');
        break;
      }
      case 'piggy_bonus': {
        const amount = s.piggy * AD_RULES.rewards.piggy_bonus.mult;
        s.piggy = 0;
        earn(s, amount);
        toast('Piggy bank smashed (+50%)!', '🐷', 'good');
        break;
      }
      default:
        break;
    }
  };

  return {
    s: initialState(),
    now: Date.now(),
    toasts: [],
    lastPulls: null,
    huntMeter: 0,
    run: null,
    runResult: null,
    relocating: false,
    tabRequest: null,
    requestTab: (t) => set({ tabRequest: t }),
    provider: null,
    buyAmount: 1,

    setProvider: (p) => set({ provider: p }),

    load: async () => {
      const now = Date.now();
      let s: GameState;
      try {
        const raw = await storage.get(SAVE_KEY);
        s = raw ? deserialize(raw, now) : initialState(now);
      } catch {
        s = initialState(now);
      }
      applyOfflineOnLoad(s, now);
      rollMissions(s, now, rand);
      // VIP daily clout stipend
      if (isVip(s, now)) {
        const key = `vip_${todayKey(now)}`;
        if (!s.iap.purchases[key]) {
          s.iap.purchases[key] = 1;
          s.clout += VIP.dailyClout;
        }
      }
      setSfxEnabled(s.settings.sfx);
      set({ s, now });
      track('session_start', { prestiges: s.stats.prestiges, cash: Math.round(s.cash) });
    },

    save: () => {
      void storage.set(SAVE_KEY, serialize(get().s));
    },

    cloudPull: async () => {
      if (!cloudEnabled()) return;
      const cs = await pullSave();
      const local = get().s;
      if (cs?.json && (cs.playSeconds ?? 0) > local.stats.playSeconds + 1) {
        get().adoptSave(cs.json);
        toast('Cloud save loaded', '☁️', 'good');
      }
    },
    cloudPush: async () => {
      if (!cloudEnabled()) return;
      const s = get().s;
      const r = await pushSave(serialize(s), s.stats.playSeconds, s.stats.lifetimeCashEarned);
      if (r && r !== 'ok' && r.json && (r.playSeconds ?? 0) > s.stats.playSeconds + 1) {
        get().adoptSave(r.json);
        toast('Newer cloud save found and loaded', '☁️', 'info');
      }
      if (s.conWeek.units > 0) void submitScore(s.conWeek.units, s.handle || 'Anonymous Scalper');
    },
    cloudClaimGrants: async () => {
      if (!cloudEnabled()) return;
      const g = await fetchGrants();
      if (!g) return;
      const s = get().s;
      const now = Date.now();
      let applied = 0;
      for (const grant of g.grants) {
        if (!(await claimGrant(grant.id))) continue;
        s.iap.purchases[`txn:${grant.id}`] = 1;
        applyProduct(s, grant.product_id, now);
        applied += 1;
      }
      // Subscriptions: trust the server's expiry (handles renewals made elsewhere).
      for (const e of g.entitlements) {
        if (e.kind === 'subscription' && e.expires_at && e.product_id === 'ss_vip') s.iap.vipUntil = Math.max(s.iap.vipUntil, e.expires_at);
        if (e.product_id === 'ss_noads') s.iap.noAds = true;
        if (e.product_id === 'ss_pass') s.pass.premium = true;
      }
      if (applied) toast(`${applied} purchase${applied > 1 ? 's' : ''} restored from your account`, '🔁', 'good');
      set({ s: { ...s } });
      get().save();
    },
    setHandle: (h) => mutate((s) => { s.handle = h.slice(0, 24); }),

    adoptSave: (json) => {
      const now = Date.now();
      const s = deserialize(json, now);
      applyOfflineOnLoad(s, now);
      rollMissions(s, now, rand);
      set({ s, now });
      get().save();
    },

    reset: () => {
      const s = initialState();
      rollMissions(s, Date.now(), rand);
      set({ s, lastPulls: null, huntMeter: 0 });
      get().save();
    },

    exportSave: () => btoa(unescape(encodeURIComponent(serialize(get().s)))),
    importSave: (b64) => {
      try {
        const json = decodeURIComponent(escape(atob(b64.trim())));
        const s = deserialize(json);
        applyOfflineOnLoad(s, Date.now());
        set({ s });
        get().save();
        return true;
      } catch {
        return false;
      }
    },

    frame: (now) => {
      const st = get();
      const dt = Math.min(5, (now - st.now) / 1000); // clamp huge gaps (tab sleep) to avoid spikes
      if (dt <= 0) return;
      const s = st.s;
      const res = tick(s, dt, now, rand);
      if (st.run && st.run.phase === 'doors') {
        const run = { ...st.run };
        tickRun(run, dt, rand);
        set({ run });
      }
      if (res.eventStarted) {
        const kinds: Record<MarketEventKind, string> = { drop: '🔥', viral: '📱', holiday: '🎄', restock: '🌊', crackdown: '🚫' };
        toast(`Market event: ${res.eventStarted.toUpperCase()}`, kinds[res.eventStarted], res.eventStarted === 'restock' || res.eventStarted === 'crackdown' ? 'bad' : 'good');
      }
      if (res.offerArrived) { toast(`${res.offerArrived.buyer} messaged you about your ${ITEM_BY_ID[res.offerArrived.itemId]?.name ?? 'listing'}. Tap to open Messages.`, '💬', 'info', 'deals'); sfx.message(); }
      if (res.calledOut) { toast('CALLED OUT. The group posted your listings. Profit x0.4 for 3 min.', '📸', 'bad'); sfx.calledOut(); fx({ kind: 'shake' }); fx({ kind: 'flash', color: '#ff6b6b' }); }
      for (const id of res.tutorialDone) { const t = TUTORIAL.find((x) => x.id === id); toast(`Tutorial: ${t?.text} (+${t?.clout} Clout)`, '✅', 'good'); sfx.achievement(); }
      for (const id of res.overtook) { const r = RANKED_RIVALS.find((x) => x.id === id); toast(`You passed ${r?.name} in the local rankings! +${r?.clout} Clout`, r?.icon ?? '🏆', 'rare'); sfx.rare(); fx({ kind: 'confetti', intensity: 1 }); }
      for (const id of res.achievementsUnlocked) {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        toast(`Achievement: ${a?.name ?? id} (+${a?.clout ?? 0} Clout)`, a?.icon ?? '🏅', 'rare');
        sfx.achievement();
      }
      set({ s: { ...s }, now });
    },

    tap: () => {
      const st = get();
      const now = st.now;
      const s = st.s;
      const m = computeModifiers(s, now);
      earn(s, tapValue(s, m));
      sfx.tap();
      s.stats.taps += 1;
      bumpMission(s, 'taps', 1);
      let meter = st.huntMeter + 1 / 60;
      let pulls: PullView[] | null = null;
      if (meter >= 1) {
        meter = 0;
        pulls = [pullItem(s, highestUnlockedStore(s), m.pullLuck, rand)];
        pullFx(pulls);
      }
      set({ s: { ...s }, huntMeter: meter, ...(pulls ? { lastPulls: pulls } : {}) });
    },

    setBuyAmount: (a) => set({ buyAmount: a }),

    buyUnits: (storeId) => {
      const st = get();
      const s = st.s;
      if (!storeUnlocked(s, storeId)) return;
      const def = STORE_BY_ID[storeId];
      const ss = s.stores[storeId];
      const want = st.buyAmount === 'max' ? maxAffordable(def, ss.units, s.cash) : st.buyAmount;
      if (want <= 0) return;
      const cost = unitCost(def, ss.units, want);
      if (s.cash < cost) return;
      s.cash -= cost;
      ss.units += want;
      s.stats.unitsBought += want;
      bumpMission(s, 'unitsBought', want);
      sfx.buy();
      track('buy_units', { storeId, count: want });
      set({ s: { ...s } });
    },

    startStore: (storeId) => mutate((s) => { startCycle(s, storeId); }),

    hireManager: (storeId) => {
      const s = get().s;
      const mgr = MANAGER_BY_STORE[storeId];
      const ss = s.stores[storeId];
      if (!mgr || ss.manager || ss.units <= 0 || s.cash < mgr.cost) return;
      s.cash -= mgr.cost;
      ss.manager = true;
      if (ss.progress <= 0) ss.progress = 1e-6;
      toast(`${mgr.name} hired!`, mgr.icon, 'good');
      sfx.manager();
      track('hire_manager', { storeId });
      set({ s: { ...s } });
    },

    buyUpgrade: (id) => {
      const s = get().s;
      const u = UPGRADE_BY_ID[id];
      if (!u || s.upgrades.includes(id)) return;
      if (u.requires && (s.stores[u.requires.storeId]?.units ?? 0) < u.requires.units) return;
      if (u.minPrestige && s.stats.prestiges < u.minPrestige) return;
      if (u.tier !== undefined) {
        const prev = UPGRADES_PREV(id);
        if (prev && !s.upgrades.includes(prev)) return;
      }
      const wallet = u.currency;
      if (s[wallet] < u.cost) return;
      s[wallet] -= u.cost;
      s.upgrades.push(id);
      if (u.heat) s.heat = Math.min(100, s.heat + u.heat);
      toast(u.heat ? `${u.name} (+${u.heat} heat)` : u.name, u.icon, u.heat ? 'bad' : 'good');
      if (u.heat) sfx.bad(); else sfx.buy();
      track('buy_upgrade', { id, currency: wallet });
      set({ s: { ...s } });
    },

    pull: (count, free = false) => {
      const st = get();
      const s = st.s;
      const cost = count === 10 ? CLOUT_COSTS.pull10 : CLOUT_COSTS.pull;
      if (!free) {
        if (s.clout < cost) { toast('Not enough Clout', '💠', 'bad'); return; }
        s.clout -= cost;
      }
      const m = computeModifiers(s, st.now);
      const results: PullView[] = [];
      const storeId = highestUnlockedStore(s);
      let fakes = 0;
      for (let i = 0; i < count; i++) {
        const p = pullItem(s, storeId, m.pullLuck, rand);
        if (fakeRoll(storeId, m, rand)) { unpull(s, p); s.fakes.push(p.item.id); fakes++; } // counterfeit: goes to the pile
        else results.push(p);
      }
      if (fakes) toast(`${fakes} of those were counterfeit. Check the Deals tab.`, '🔦', 'bad');
      pullFx(results);
      track('pull', { count, free, fakes });
      set({ s: { ...s }, lastPulls: results });
    },

    sellDupe: (key) => {
      const st = get();
      const v = sellDuplicate(st.s, key, st.now);
      if (v > 0) toast('Duplicate flipped!', '💸', 'good');
      set({ s: { ...st.s } });
    },

    openRelocate: () => { const s = get().s; if (credForRun(s.stats.totalCashEarned) <= 0) return; if (!s.cityOffer) rollCityOffer(s, rand); set({ s: { ...s }, relocating: true }); },
    closeRelocate: () => set({ relocating: false }),
    doPrestige: async (cityId) => {
      const st = get();
      const s = st.s;
      const gained = credForRun(s.stats.totalCashEarned);
      if (gained <= 0) return;
      set({ relocating: false });
      const now = Date.now();
      // Interstitial on prestige is the one forced ad placement, gated by
      // Remove Ads / VIP and a minimum gap.
      const p = st.provider;
      if (p && !isAdFree(s, now) && now - s.interstitialSeenAt > AD_RULES.interstitialMinGap * 1000) {
        s.interstitialSeenAt = now;
        await p.ads.showInterstitial('interstitial_prestige');
      }
      prestige(s, now, cityId);
      toast(`Moved to ${CITY_BY_ID[s.city]?.name ?? 'a new city'}! +${gained} Street Cred`, '🚚', 'rare');
      sfx.grail();
      fx({ kind: 'confetti', intensity: 3 });
      track('prestige', { gained, total: s.cred });
      set({ s: { ...s }, huntMeter: 0 });
      get().save();
    },

    claimOfflineNormal: () => mutate((s) => { claimOffline(s, 1); }),

    claimOfflineDouble: async () => {
      const st = get();
      const s = st.s;
      if (!s.pendingOffline) return;
      if (isAdFree(s, Date.now())) {
        claimOffline(s, 2);
        set({ s: { ...s } });
        return;
      }
      const p = st.provider;
      if (!p) { claimOffline(s, 1); set({ s: { ...s } }); return; }
      const r = await p.ads.showRewarded('offline_double');
      const cur = get().s;
      if (r.rewarded) {
        cur.stats.adsWatched += 1;
        bumpMission(cur, 'adsWatched', 1);
        claimOffline(cur, 2);
        track('ad_rewarded', { placement: 'offline_double' });
      } else {
        claimOffline(cur, 1);
      }
      set({ s: { ...cur } });
    },

    watchAd: async (placement) => {
      const st = get();
      const s = st.s;
      const now = Date.now();
      const blocked = adAllowed(s, placement, now);
      if (blocked) { toast(blocked, '⏳', 'bad'); return; }
      const p = st.provider;
      if (!p) return;
      // No-ads owners and VIPs claim rewarded placements instantly.
      let rewarded = isAdFree(s, now);
      if (!rewarded) {
        const r = await p.ads.showRewarded(placement);
        rewarded = r.rewarded;
        if (!rewarded) { toast('Video skipped. No reward.', '📺', 'bad'); return; }
      }
      const cur = get().s;
      cur.stats.adsWatched += 1;
      cur.adsToday.count += 1;
      bumpMission(cur, 'adsWatched', 1);
      cur.adCooldowns[placement] = now + AD_RULES.cooldownSeconds[placement] * 1000;
      grantAdReward(cur, placement, now);
      track('ad_rewarded', { placement });
      set({ s: { ...cur } });
    },

    claimMissionReward: (id) => mutate((s) => { if (claimMission(s, id)) toast('Mission complete!', '✅', 'good'); }),

    claimDailyReward: () => {
      const s = get().s;
      const r = claimDaily(s, Date.now());
      if (r) toast(`Day ${r.day} reward claimed!`, '📅', 'good');
      set({ s: { ...s } });
    },

    claimPass: (tier, premium) => {
      const s = get().s;
      const pulled = claimPassTier(s, tier, premium, Date.now());
      if (pulled && pulled.length) set({ lastPulls: pulled });
      if (pulled) toast(`Tier ${tier} claimed`, '🎫', 'good');
      set({ s: { ...s } });
    },

    buyProduct: async (productId) => {
      const st = get();
      const p = st.provider;
      const prod = PRODUCTS.find((x) => x.id === productId);
      if (!p || !prod) return;
      const r = await p.iap.purchase(productId);
      if (!r.ok) { track('iap_cancel', { productId }); return; }
      const s = get().s;
      const now = Date.now();
      s.iap.purchases[productId] = (s.iap.purchases[productId] ?? 0) + 1;
      applyProduct(s, prod.id, now);
      track('iap_purchase', { productId, usd: prod.priceUsd });
      toast(`Purchased ${prod.name}`, prod.icon, 'rare');
      set({ s: { ...s } });
      get().save();
    },

    restorePurchases: async () => {
      const p = get().provider;
      if (!p) return;
      const ids = await p.iap.restore();
      const s = get().s;
      for (const id of ids) applyProduct(s, id, Date.now());
      toast(ids.length ? 'Purchases restored' : 'Nothing to restore', '🔁');
      set({ s: { ...s } });
    },

    spendClout: (what) => {
      const st = get();
      const s = st.s;
      const now = st.now;
      const cost = CLOUT_COSTS[what];
      if (s.clout < cost) { toast('Not enough Clout', '💠', 'bad'); return; }
      switch (what) {
        case 'timeSkip1h': s.clout -= cost; timeSkip(s, 1, now); toast('Skipped 1 hour', '⏩', 'good'); break;
        case 'timeSkip8h': s.clout -= cost; timeSkip(s, 8, now); toast('Skipped 8 hours', '⏩', 'good'); break;
        case 'boost2x4h': s.clout -= cost; addBoost(s, 'clout_boost', 'x2 Clout Boost', 2, 4 * 3600, now); toast('x2 for 4 hours', '🚀', 'good'); break;
        default: return;
      }
      track('clout_spend', { what, cost });
      set({ s: { ...s } });
    },

    breakPiggy: () => {
      const s = get().s;
      if (s.piggy <= 0) return;
      if (s.clout < CLOUT_COSTS.piggyBreak) { toast('Not enough Clout', '💠', 'bad'); return; }
      s.clout -= CLOUT_COSTS.piggyBreak;
      const amt = s.piggy;
      s.piggy = 0;
      earn(s, amt);
      toast('Piggy bank smashed!', '🐷', 'good');
      set({ s: { ...s } });
    },

    dismissPulls: () => set({ lastPulls: null }),
    restockStart: (storeId) => {
      const st = get();
      const now = Date.now();
      const m = computeModifiers(st.s, now);
      const run = startRun(st.s, storeId, m, now, rand);
      if (!run) { toast('No restock yet. Check the cooldown.', '⏳', 'bad'); return; }
      track('restock_start', { storeId });
      set({ run, runResult: null });
    },
    restockOpen: () => { const r = get().run; if (!r) return; const run = { ...r }; openDoors(run); sfx.doors(); fx({ kind: 'shake' }); set({ run }); },
    restockGrab: () => {
      const st = get();
      if (!st.run) return;
      const m = computeModifiers(st.s, st.now);
      const run = { ...st.run };
      if (grab(run, m.tapPower)) sfx.secured(); else sfx.grab();
      if (st.s.settings.haptics) haptic.light();
      set({ run });
    },
    restockChoose: (idx) => {
      const r = get().run;
      if (!r) return;
      const run = { ...r };
      const msg = choose(run, idx, rand);
      if (msg) toast(msg, '💬', run.banned ? 'bad' : 'info');
      set({ run });
    },
    restockFinish: () => {
      const st = get();
      if (!st.run || st.run.phase !== 'done') return;
      const s = st.s;
      const res = finishRun(s, st.run, Date.now(), rand);
      if (res.banned) { sfx.bad(); fx({ kind: 'shake' }); } else pullFx(res.items);
      track('restock_done', { storeId: st.run.storeId, grabbed: st.run.grabbed, banned: res.banned });
      set({ s: { ...s }, run: null, runResult: { ...res, grabbed: st.run.grabbed } });
      get().save();
    },
    restockDismiss: () => set({ runResult: null }),
    setPricing: (p) => mutate((s) => { s.pricing = p; }),
    dealAccept: (id) => {
      const st = get();
      const r = acceptOffer(st.s, id, Date.now(), rand);
      if (r) { toast(r.text, r.icon, r.kind); if (r.kind === 'good') sfx.deal(); else if (r.kind === 'bad') sfx.bad(); }
      track('deal', { action: 'accept' });
      set({ s: { ...st.s }, ...(r?.item ? { lastPulls: [r.item] } : {}) });
    },
    dealCounter: (id) => {
      const st = get();
      const r = counterOffer(st.s, id, Date.now(), rand);
      if (r) { toast(r.text, r.icon, r.kind); if (r.kind === 'good') sfx.deal(); else if (r.kind === 'bad') sfx.bad(); }
      track('deal', { action: 'counter' });
      set({ s: { ...st.s }, ...(r?.item ? { lastPulls: [r.item] } : {}) });
    },
    dealDecline: (id) => mutate((s) => { const r = declineOffer(s, id); if (r) toast(r.text, r.icon, r.kind); }),
    apologize: () => mutate((s) => { if (apologize(s)) toast('Apology video posted. Heat reset.', '📝', 'good'); else toast('Not enough Clout', '💠', 'bad'); }),
    fakeToss: (idx) => mutate((s) => { tossFake(s, idx); toast('Tossed. Integrity intact.', '🗑️'); }),
    fakeFlip: (idx) => mutate((s) => { const v = flipFake(s, idx, Date.now()); if (v > 0) toast('Sold a fake as real. +8 heat.', '😬', 'bad'); }),
    toast,
    dismissToast: (id) => set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) })),
    setSetting: (k, v) => mutate((s) => { s.settings = { ...s.settings, [k]: v }; if (k === 'sfx') setSfxEnabled(Boolean(v)); }),
  };
});

/** Sound + confetti for a batch of pulled items, scaled to the best rarity. */
function pullFx(items: PullView[]): void {
  const order = ['common', 'uncommon', 'rare', 'ultra', 'select', 'grail', 'chase'];
  const best = items.reduce((m, p) => Math.max(m, order.indexOf(p.item.rarity) + (p.variant === 'standard' ? 0 : 1)), -1);
  if (best < 0) return;
  if (best >= 5) { sfx.grail(); fx({ kind: 'confetti', intensity: 4 }); fx({ kind: 'flash', color: '#ffe066' }); }
  else if (best >= 3) { sfx.rare(); fx({ kind: 'confetti', intensity: 2 }); }
  else if (best >= 2) { sfx.rare(); fx({ kind: 'confetti', intensity: 1 }); }
  else sfx.pull();
}

/** Previous tier upgrade id for tiered store upgrades. */
function UPGRADES_PREV(id: string): string | null {
  const m = id.match(/^(u_.+)_(\d)$/);
  if (!m) return null;
  const t = Number(m[2]);
  return t > 0 ? `${m[1]}_${t - 1}` : null;
}

export function applyProduct(s: GameState, productId: string, now: number): void {
  const prod = PRODUCTS.find((x) => x.id === productId);
  if (!prod) return;
  const rewards: Reward[] = [];
  if (prod.clout) rewards.push({ kind: 'clout', amount: prod.clout });
  if (prod.incomeHours) rewards.push({ kind: 'cash', minutesOfIncome: prod.incomeHours * 60 });
  if (prod.pulls) rewards.push({ kind: 'pulls', amount: prod.pulls });
  for (const r of rewards) grantReward(s, r, now, rand);
  switch (prod.kind) {
    case 'noAds': s.iap.noAds = true; break;
    case 'starter':
      s.iap.starterPackBought = true;
      s.iap.adFreeUntil = Math.max(s.iap.adFreeUntil, now + 7 * 86400_000);
      break;
    case 'vip': s.iap.vipUntil = Math.max(s.iap.vipUntil, now) + (prod.periodDays ?? 7) * 86400_000; break;
    case 'pass': s.pass.premium = true; break;
    default: break;
  }
}

export function setRng(fn: () => number): void {
  rand = fn;
}

// Thin wrappers over Capacitor plugins. Every function is a no-op or a
// browser fallback on the web so the rest of the app never branches.
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App as CapApp } from '@capacitor/app';

export const isNative = (): boolean => Capacitor.isNativePlatform();
export const platform = (): 'web' | 'ios' | 'android' => (Capacitor.getPlatform() as 'web' | 'ios' | 'android');

export const haptic = {
  light: () => { if (isNative()) void Haptics.impact({ style: ImpactStyle.Light }); else navigator.vibrate?.(8); },
  medium: () => { if (isNative()) void Haptics.impact({ style: ImpactStyle.Medium }); else navigator.vibrate?.(14); },
  success: () => { if (isNative()) void Haptics.notification({ type: NotificationType.Success }); else navigator.vibrate?.([10, 30, 10]); },
  error: () => { if (isNative()) void Haptics.notification({ type: NotificationType.Error }); else navigator.vibrate?.([30, 20, 30]); },
};

/** Key-value storage: Preferences (UserDefaults) on device, localStorage on web. */
export const storage = {
  async get(key: string): Promise<string | null> {
    if (isNative()) return (await Preferences.get({ key })).value;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  async set(key: string, value: string): Promise<void> {
    if (isNative()) { await Preferences.set({ key, value }); return; }
    try { localStorage.setItem(key, value); } catch { /* quota or blocked */ }
  },
  /** Synchronous web-only read used during the first paint. */
  getSync(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
};

const NOTIF_IDS = { offlineCap: 1, restock: 2, piggy: 3, seasonStart: 4, seasonEnding: 5 };

/** Schedule the "come back" notifications when the app goes to the background. */
export interface ReturnNotificationOpts {
  offlineCapHours: number;
  nextRestockSeconds: number | null;
  /** Next season start (epoch ms) and its name, when no season is on. */
  seasonStart?: { at: number; name: string; icon: string } | null;
  /** Live season end (epoch ms), name, and how many set pieces are still missing. */
  seasonEnd?: { at: number; name: string; icon: string; missing: number } | null;
}

export async function scheduleReturnNotifications(opts: ReturnNotificationOpts): Promise<void> {
  if (!isNative()) return;
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return;
    }
    await LocalNotifications.cancel({ notifications: Object.values(NOTIF_IDS).map((id) => ({ id })) });
    const now = Date.now();
    const list = [
      { id: NOTIF_IDS.offlineCap, title: 'Your crew stopped flipping', body: 'Offline earnings hit the cap. Come collect before the moms do.', schedule: { at: new Date(now + opts.offlineCapHours * 3600_000) } },
    ];
    if (opts.nextRestockSeconds !== null) {
      list.push({ id: NOTIF_IDS.restock, title: 'Restock truck spotted', body: 'The line is forming. Two per family. Allegedly.', schedule: { at: new Date(now + Math.max(60, opts.nextRestockSeconds) * 1000) } });
    }
    // Seasons: the start of the next one (within 45 days), and a 48-hour warning when the set is unfinished.
    if (opts.seasonStart && opts.seasonStart.at > now && opts.seasonStart.at - now < 45 * 86_400_000) {
      list.push({ id: NOTIF_IDS.seasonStart, title: `${opts.seasonStart.icon} ${opts.seasonStart.name} has started`, body: 'Six seasonal exclusives are dropping. Camp a line, earn tokens, finish the set.', schedule: { at: new Date(opts.seasonStart.at + 9 * 3600_000) } });
    }
    if (opts.seasonEnd && opts.seasonEnd.missing > 0) {
      const warnAt = opts.seasonEnd.at - 48 * 3600_000;
      if (warnAt > now) list.push({ id: NOTIF_IDS.seasonEnding, title: `${opts.seasonEnd.icon} ${opts.seasonEnd.name} ends in two days`, body: `${opts.seasonEnd.missing} piece${opts.seasonEnd.missing === 1 ? '' : 's'} of the set still missing. Spend your tokens before they turn into Clout.`, schedule: { at: new Date(warnAt) } });
    }
    await LocalNotifications.schedule({ notifications: list });
  } catch {
    /* notifications are best effort */
  }
}

export function onAppStateChange(cb: (active: boolean) => void): () => void {
  if (!isNative()) return () => {};
  const p = CapApp.addListener('appStateChange', ({ isActive }) => cb(isActive));
  return () => { void p.then((h) => h.remove()); };
}

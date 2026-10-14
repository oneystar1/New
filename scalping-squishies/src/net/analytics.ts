// Analytics: batches events and posts them to the backend when one is
// configured; otherwise logs in dev. Shared by the web and native providers.
import type { AnalyticsProvider } from '../monetization/provider';
import { CONFIG } from '../config';

export function createAnalytics(getToken: () => string | null, platform: string): AnalyticsProvider {
  let queue: { event: string; props?: Record<string, string | number | boolean>; at: number }[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = async () => {
    timer = null;
    if (!CONFIG.apiUrl || queue.length === 0) return;
    const batch = queue;
    queue = [];
    try {
      await fetch(`${CONFIG.apiUrl}/v1/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(getToken() ? { authorization: `Bearer ${getToken()}` } : {}) },
        body: JSON.stringify({ platform, events: batch }),
        keepalive: true,
      });
    } catch {
      queue = batch.concat(queue).slice(-200);
    }
  };
  if (typeof window !== 'undefined') window.addEventListener('pagehide', () => void flush());
  return {
    track(event, props) {
      queue.push({ event, props, at: Date.now() });
      if (import.meta.env?.DEV) console.debug('[analytics]', event, props ?? '');
      if (!timer) timer = setTimeout(() => void flush(), 5000);
      if (queue.length >= 50) void flush();
    },
  };
}

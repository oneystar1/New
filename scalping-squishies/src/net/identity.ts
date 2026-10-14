// Anonymous device identity. Persisted in Preferences/localStorage and
// used as the RevenueCat app user id and the backend account id.
import { storage } from '../platform/native';

const KEY = 'ss-device-id';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'd-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getDeviceId(): Promise<string> {
  const existing = await storage.get(KEY);
  if (existing) return existing;
  const id = uuid();
  await storage.set(KEY, id);
  return id;
}

// Backend client: anonymous auth, cloud save sync, grant claiming, weekly
// leaderboard. Every call is best-effort; the game never blocks on the
// network and runs fully offline when CONFIG.apiUrl is empty.
import { CONFIG } from '../config';

let token: string | null = null;
export const getToken = (): string | null => token;
export const cloudEnabled = (): boolean => Boolean(CONFIG.apiUrl);

async function call<T>(path: string, init: RequestInit = {}): Promise<{ status: number; body: T } | null> {
  if (!CONFIG.apiUrl) return null;
  try {
    const r = await fetch(`${CONFIG.apiUrl}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
    });
    return { status: r.status, body: (await r.json()) as T };
  } catch {
    return null;
  }
}

export async function authAnon(deviceId: string): Promise<boolean> {
  const r = await call<{ token: string }>('/v1/auth/anon', { method: 'POST', body: JSON.stringify({ deviceId }) });
  if (r?.status === 200) { token = r.body.token; return true; }
  return false;
}

export interface CloudSave { json: string | null; playSeconds?: number; lifetime?: number; updatedAt?: number }

export async function pullSave(): Promise<CloudSave | null> {
  const r = await call<CloudSave>('/v1/save');
  return r?.status === 200 ? r.body : null;
}

/** Push the local save. Returns the server's copy when it is newer (conflict). */
export async function pushSave(json: string, playSeconds: number, lifetime: number): Promise<CloudSave | 'ok' | null> {
  const r = await call<CloudSave & { error?: string }>('/v1/save', { method: 'PUT', body: JSON.stringify({ json, playSeconds, lifetime }) });
  if (!r) return null;
  if (r.status === 409) return r.body;
  return r.status === 200 ? 'ok' : null;
}

export interface Grant { id: string; product_id: string; kind: 'consumable' | 'nonconsumable' | 'subscription'; expires_at: number | null }

export async function fetchGrants(): Promise<{ grants: Grant[]; entitlements: { product_id: string; kind: string; expires_at: number | null }[] } | null> {
  const r = await call<{ grants: Grant[]; entitlements: { product_id: string; kind: string; expires_at: number | null }[] }>('/v1/grants');
  return r?.status === 200 ? r.body : null;
}

export async function claimGrant(id: string): Promise<boolean> {
  const r = await call<{ ok: boolean }>('/v1/grants/claim', { method: 'POST', body: JSON.stringify({ id }) });
  return r?.status === 200 && r.body.ok === true;
}

export interface LeaderboardRow { rank: number; name: string; score: number; you: boolean }

export async function fetchLeaderboard(): Promise<{ week: string; top: LeaderboardRow[]; yourRank: number | null } | null> {
  const r = await call<{ week: string; top: LeaderboardRow[]; yourRank: number | null }>('/v1/leaderboard');
  return r?.status === 200 ? r.body : null;
}

export async function submitScore(score: number, name: string): Promise<void> {
  await call('/v1/leaderboard', { method: 'POST', body: JSON.stringify({ score, name }) });
}

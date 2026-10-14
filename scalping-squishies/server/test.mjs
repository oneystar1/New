import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './index.mjs';

async function boot() {
  const app = createApp({ secret: 's', rcWebhookSecret: 'rc' });
  await new Promise((r) => app.server.listen(0, r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const call = (path, init = {}, token) => fetch(base + path, { ...init, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) } }).then(async (r) => ({ status: r.status, body: await r.json() }));
  return { app, base, call, close: () => new Promise((r) => app.server.close(r)) };
}

test('anonymous auth is stable per device and tokens are verified', async () => {
  const t = await boot();
  const a = await t.call('/v1/auth/anon', { method: 'POST', body: JSON.stringify({ deviceId: 'device-aaaa-1111' }) });
  const b = await t.call('/v1/auth/anon', { method: 'POST', body: JSON.stringify({ deviceId: 'device-aaaa-1111' }) });
  assert.equal(a.status, 200);
  assert.equal(a.body.userId, b.body.userId);
  assert.equal((await t.call('/v1/save')).status, 401);
  assert.equal((await t.call('/v1/save', {}, a.body.token + 'x')).status, 401);
  assert.equal((await t.call('/v1/save', {}, a.body.token)).status, 200);
  await t.close();
});

test('cloud save round-trips and the conflict rule prefers more play time', async () => {
  const t = await boot();
  const { body: { token } } = await t.call('/v1/auth/anon', { method: 'POST', body: JSON.stringify({ deviceId: 'device-bbbb-2222' }) });
  assert.deepEqual((await t.call('/v1/save', {}, token)).body, { json: null });
  assert.equal((await t.call('/v1/save', { method: 'PUT', body: JSON.stringify({ json: '{"cash":1}', playSeconds: 100, lifetime: 5 }) }, token)).status, 200);
  const got = await t.call('/v1/save', {}, token);
  assert.equal(got.body.json, '{"cash":1}');
  const stale = await t.call('/v1/save', { method: 'PUT', body: JSON.stringify({ json: '{"cash":0}', playSeconds: 10, lifetime: 1 }) }, token);
  assert.equal(stale.status, 409);
  assert.equal(stale.body.json, '{"cash":1}');
  assert.equal((await t.call('/v1/save', { method: 'PUT', body: JSON.stringify({ json: '{"cash":2}', playSeconds: 200, lifetime: 9 }) }, token)).status, 200);
  await t.close();
});

test('events are accepted and the weekly leaderboard keeps the best score', async () => {
  const t = await boot();
  const { body: { token } } = await t.call('/v1/auth/anon', { method: 'POST', body: JSON.stringify({ deviceId: 'device-cccc-3333' }) });
  const ev = await t.call('/v1/events', { method: 'POST', body: JSON.stringify({ platform: 'web', events: [{ event: 'session_start', at: 1 }, { event: 'bad' }, { nope: 1 }] }) }, token);
  assert.equal(ev.body.accepted, 3);
  assert.equal(t.app.db.prepare('SELECT COUNT(*) c FROM events').get().c, 2);
  await t.call('/v1/leaderboard', { method: 'POST', body: JSON.stringify({ score: 12, name: 'Dalton' }) }, token);
  await t.call('/v1/leaderboard', { method: 'POST', body: JSON.stringify({ score: 7, name: 'Dalton' }) }, token);
  const lb = await t.call('/v1/leaderboard', {}, token);
  assert.equal(lb.body.top[0].score, 12);
  assert.equal(lb.body.top[0].you, true);
  assert.equal(lb.body.yourRank, 1);
  assert.equal((await t.call('/v1/leaderboard', { method: 'POST', body: JSON.stringify({ score: -1 }) }, token)).status, 400);
  await t.close();
});

test('RevenueCat webhook needs the secret and grants are claimable exactly once', async () => {
  const t = await boot();
  const { body: { token } } = await t.call('/v1/auth/anon', { method: 'POST', body: JSON.stringify({ deviceId: 'device-dddd-4444' }) });
  const hook = (event, auth = 'Bearer rc') => t.call('/v1/webhooks/revenuecat', { method: 'POST', body: JSON.stringify({ event }), headers: { authorization: auth } });
  assert.equal((await hook({ app_user_id: 'device-dddd-4444', type: 'NON_RENEWING_PURCHASE', product_id: 'ss_clout_m', id: 'evt1' }, 'Bearer wrong')).status, 401);
  assert.equal((await hook({ app_user_id: 'device-dddd-4444', type: 'NON_RENEWING_PURCHASE', product_id: 'ss_clout_m', id: 'evt1' })).status, 200);
  assert.equal((await hook({ app_user_id: 'device-dddd-4444', type: 'NON_RENEWING_PURCHASE', product_id: 'ss_clout_m', id: 'evt1' })).status, 200); // duplicate delivery
  assert.equal((await hook({ app_user_id: 'device-dddd-4444', type: 'INITIAL_PURCHASE', product_id: 'ss_vip', id: 'evt2', expiration_at_ms: Date.now() + 86400000 })).status, 200);
  assert.equal((await hook({ app_user_id: 'device-dddd-4444', type: 'INITIAL_PURCHASE', product_id: 'ss_noads', id: 'evt3' })).status, 200);
  assert.equal((await hook({ app_user_id: 'nobody', type: 'INITIAL_PURCHASE', product_id: 'ss_noads', id: 'evt4' })).status, 202);
  const g = await t.call('/v1/grants', {}, token);
  assert.equal(g.body.grants.length, 3);
  const consumable = g.body.grants.find((x) => x.product_id === 'ss_clout_m');
  assert.equal(consumable.kind, 'consumable');
  assert.equal((await t.call('/v1/grants/claim', { method: 'POST', body: JSON.stringify({ id: consumable.id }) }, token)).body.ok, true);
  assert.equal((await t.call('/v1/grants/claim', { method: 'POST', body: JSON.stringify({ id: consumable.id }) }, token)).status, 409);
  const g2 = await t.call('/v1/grants', {}, token);
  assert.equal(g2.body.grants.length, 2);
  assert.ok(g2.body.entitlements.some((e) => e.product_id === 'ss_vip' && e.kind === 'subscription'));
  await t.close();
});

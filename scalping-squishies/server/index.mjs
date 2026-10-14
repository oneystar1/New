// Scalping Squishies backend: a single-file Node 22 server with the
// built-in sqlite module and no dependencies. Provides anonymous accounts,
// cloud saves with a conflict rule, analytics ingest, a weekly leaderboard,
// RevenueCat webhook ingestion and a grant-claim flow so purchases are
// granted once per transaction even across devices.
//
//   SS_PORT=8787 SS_SECRET=... SS_RC_WEBHOOK_SECRET=... SS_DB=./data.db node server/index.mjs
import { createServer } from 'node:http';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

export function createApp(opts = {}) {
  const secret = opts.secret ?? process.env.SS_SECRET ?? 'dev-secret-change-me';
  const rcSecret = opts.rcWebhookSecret ?? process.env.SS_RC_WEBHOOK_SECRET ?? '';
  const db = new DatabaseSync(opts.dbPath ?? process.env.SS_DB ?? ':memory:');
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, device_id TEXT UNIQUE, created_at INTEGER, last_seen INTEGER, name TEXT);
    CREATE TABLE IF NOT EXISTS saves (user_id TEXT PRIMARY KEY, json TEXT, play_seconds REAL, lifetime REAL, updated_at INTEGER);
    CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, platform TEXT, event TEXT, props TEXT, at INTEGER);
    CREATE TABLE IF NOT EXISTS scores (week TEXT, user_id TEXT, name TEXT, score REAL, updated_at INTEGER, PRIMARY KEY (week, user_id));
    CREATE TABLE IF NOT EXISTS grants (id TEXT PRIMARY KEY, user_id TEXT, product_id TEXT, kind TEXT, expires_at INTEGER, created_at INTEGER, claimed_at INTEGER);
    CREATE INDEX IF NOT EXISTS grants_user ON grants(user_id, claimed_at);
    CREATE INDEX IF NOT EXISTS events_at ON events(at);
  `);
  const q = {
    userByDevice: db.prepare('SELECT * FROM users WHERE device_id = ?'),
    insertUser: db.prepare('INSERT INTO users (id, device_id, created_at, last_seen, name) VALUES (?, ?, ?, ?, ?)'),
    touchUser: db.prepare('UPDATE users SET last_seen = ? WHERE id = ?'),
    getSave: db.prepare('SELECT * FROM saves WHERE user_id = ?'),
    putSave: db.prepare('INSERT INTO saves (user_id, json, play_seconds, lifetime, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET json = excluded.json, play_seconds = excluded.play_seconds, lifetime = excluded.lifetime, updated_at = excluded.updated_at'),
    insertEvent: db.prepare('INSERT INTO events (user_id, platform, event, props, at) VALUES (?, ?, ?, ?, ?)'),
    putScore: db.prepare('INSERT INTO scores (week, user_id, name, score, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(week, user_id) DO UPDATE SET score = MAX(scores.score, excluded.score), name = excluded.name, updated_at = excluded.updated_at'),
    topScores: db.prepare('SELECT user_id, name, score FROM scores WHERE week = ? ORDER BY score DESC LIMIT 50'),
    myRank: db.prepare('SELECT COUNT(*) + 1 AS rank FROM scores WHERE week = ? AND score > (SELECT COALESCE(MAX(score), -1) FROM scores WHERE week = ? AND user_id = ?)'),
    insertGrant: db.prepare('INSERT OR IGNORE INTO grants (id, user_id, product_id, kind, expires_at, created_at, claimed_at) VALUES (?, ?, ?, ?, ?, ?, NULL)'),
    unclaimed: db.prepare('SELECT id, product_id, kind, expires_at FROM grants WHERE user_id = ? AND claimed_at IS NULL'),
    claim: db.prepare('UPDATE grants SET claimed_at = ? WHERE id = ? AND user_id = ? AND claimed_at IS NULL'),
    entitlements: db.prepare('SELECT product_id, kind, MAX(expires_at) AS expires_at FROM grants WHERE user_id = ? AND kind != \'consumable\' GROUP BY product_id, kind'),
  };

  // --- auth: token = userId.hmac(userId) ---
  const sign = (id) => createHmac('sha256', secret).update(id).digest('base64url');
  const tokenFor = (id) => `${id}.${sign(id)}`;
  const verify = (token) => {
    if (!token) return null;
    const [id, sig] = token.split('.');
    if (!id || !sig) return null;
    const expected = sign(id);
    if (expected.length !== sig.length) return null;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig)) ? id : null;
  };

  const weekKey = (ms = Date.now()) => {
    const d = new Date(ms);
    const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.floor(((d - start) / 86400000 + start.getUTCDay() + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  };

  // --- rate limiting: 120 requests/min per ip ---
  const buckets = new Map();
  const limited = (ip) => {
    const now = Date.now();
    const b = buckets.get(ip) ?? { n: 0, reset: now + 60_000 };
    if (now > b.reset) { b.n = 0; b.reset = now + 60_000; }
    b.n += 1;
    buckets.set(ip, b);
    return b.n > 120;
  };

  const json = (res, status, body) => {
    res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, PUT, OPTIONS' });
    res.end(JSON.stringify(body));
  };
  const readBody = (req, limit = 2_000_000) => new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(new Error('bad json')); } });
    req.on('error', reject);
  });

  async function handle(req, res) {
    const url = new URL(req.url, 'http://x');
    const ip = req.headers['x-forwarded-for']?.split(',')[0] ?? req.socket.remoteAddress ?? '?';
    if (req.method === 'OPTIONS') return json(res, 204, {});
    if (limited(ip)) return json(res, 429, { error: 'rate_limited' });
    const auth = req.headers.authorization?.replace(/^Bearer /, '');
    const userId = verify(auth);
    const path = url.pathname;
    try {
      if (path === '/v1/health') return json(res, 200, { ok: true, week: weekKey() });

      if (path === '/v1/auth/anon' && req.method === 'POST') {
        const { deviceId } = await readBody(req, 10_000);
        if (typeof deviceId !== 'string' || deviceId.length < 8 || deviceId.length > 128) return json(res, 400, { error: 'bad_device' });
        let u = q.userByDevice.get(deviceId);
        if (!u) { const id = randomUUID(); q.insertUser.run(id, deviceId, Date.now(), Date.now(), null); u = { id }; }
        else q.touchUser.run(Date.now(), u.id);
        return json(res, 200, { userId: u.id, token: tokenFor(u.id) });
      }

      // RevenueCat webhook: shared-secret Authorization header, one grant per event id.
      if (path === '/v1/webhooks/revenuecat' && req.method === 'POST') {
        if (!rcSecret || req.headers.authorization !== `Bearer ${rcSecret}`) return json(res, 401, { error: 'unauthorized' });
        const { event } = await readBody(req, 200_000);
        if (!event || typeof event.app_user_id !== 'string') return json(res, 400, { error: 'bad_event' });
        const u = q.userByDevice.get(event.app_user_id);
        if (!u) return json(res, 202, { ignored: 'unknown_user' });
        if (!['NON_RENEWING_PURCHASE', 'INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION'].includes(event.type)) return json(res, 202, { ignored: event.type });
        // Subscriptions carry an expiry; Clout packs and bundles are consumable; the rest are lifetime.
        const kind = event.expiration_at_ms ? 'subscription' : isConsumable(event.product_id) ? 'consumable' : 'nonconsumable';
        q.insertGrant.run(event.id ?? randomUUID(), u.id, String(event.product_id), kind, event.expiration_at_ms ?? null, Date.now());
        return json(res, 200, { ok: true });
      }

      if (!userId) return json(res, 401, { error: 'unauthorized' });

      if (path === '/v1/save' && req.method === 'GET') {
        const row = q.getSave.get(userId);
        return json(res, 200, row ? { json: row.json, playSeconds: row.play_seconds, lifetime: row.lifetime, updatedAt: row.updated_at } : { json: null });
      }
      if (path === '/v1/save' && req.method === 'PUT') {
        const { json: body, playSeconds, lifetime } = await readBody(req);
        if (typeof body !== 'string' || body.length > 1_500_000) return json(res, 400, { error: 'bad_save' });
        const cur = q.getSave.get(userId);
        // Conflict rule: the save with more play time wins; ties go to the newer upload.
        if (cur && cur.play_seconds > Number(playSeconds ?? 0) + 1) return json(res, 409, { error: 'server_newer', json: cur.json, playSeconds: cur.play_seconds, lifetime: cur.lifetime, updatedAt: cur.updated_at });
        q.putSave.run(userId, body, Number(playSeconds ?? 0), Number(lifetime ?? 0), Date.now());
        return json(res, 200, { ok: true });
      }

      if (path === '/v1/events' && req.method === 'POST') {
        const { platform, events } = await readBody(req, 500_000);
        if (!Array.isArray(events)) return json(res, 400, { error: 'bad_events' });
        const ins = db.prepare('INSERT INTO events (user_id, platform, event, props, at) VALUES (?, ?, ?, ?, ?)');
        for (const e of events.slice(0, 200)) if (typeof e?.event === 'string') ins.run(userId, String(platform ?? 'web').slice(0, 16), e.event.slice(0, 64), JSON.stringify(e.props ?? {}).slice(0, 2000), Number(e.at) || Date.now());
        return json(res, 200, { ok: true, accepted: Math.min(events.length, 200) });
      }

      if (path === '/v1/leaderboard' && req.method === 'GET') {
        const week = url.searchParams.get('week') ?? weekKey();
        const top = q.topScores.all(week).map((r, i) => ({ rank: i + 1, name: r.name ?? 'Anonymous Scalper', score: r.score, you: r.user_id === userId }));
        const me = q.myRank.get(week, week, userId);
        return json(res, 200, { week, top, yourRank: me?.rank ?? null });
      }
      if (path === '/v1/leaderboard' && req.method === 'POST') {
        const { score, name } = await readBody(req, 10_000);
        if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1e6) return json(res, 400, { error: 'bad_score' });
        q.putScore.run(weekKey(), userId, String(name ?? 'Anonymous Scalper').slice(0, 24), score, Date.now());
        return json(res, 200, { ok: true, week: weekKey() });
      }

      if (path === '/v1/grants' && req.method === 'GET') {
        return json(res, 200, { grants: q.unclaimed.all(userId), entitlements: q.entitlements.all(userId) });
      }
      if (path === '/v1/grants/claim' && req.method === 'POST') {
        const { id } = await readBody(req, 10_000);
        const r = q.claim.run(Date.now(), String(id), userId);
        return json(res, r.changes ? 200 : 409, { ok: r.changes > 0 });
      }

      return json(res, 404, { error: 'not_found' });
    } catch (e) {
      return json(res, 400, { error: String(e.message ?? e) });
    }
  }

  const server = createServer((req, res) => { void handle(req, res); });
  return { server, db, tokenFor, weekKey };
}

/** Consumable product ids (Clout packs, bundles) vs lifetime/subscription. */
export function isConsumable(productId) {
  return /^ss_clout_|^ss_bundle_/.test(productId);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.SS_PORT ?? 8787);
  const { server } = createApp();
  server.listen(port, () => console.log(`scalping-squishies api on :${port}`));
}

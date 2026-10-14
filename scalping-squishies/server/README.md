# Scalping Squishies backend

A single-file Node 22 server with zero dependencies, using the built-in
`node:sqlite`. It does everything the client needs to be a real product:

| Route | What it does |
| --- | --- |
| `POST /v1/auth/anon` | Device id in, signed bearer token out. One account per device. |
| `GET` / `PUT /v1/save` | Cloud save. The copy with more play time wins; a stale push gets `409` with the server copy. |
| `POST /v1/events` | Analytics ingest (batched by the client). |
| `GET` / `POST /v1/leaderboard` | Con Weekend leaderboard, best score per user per ISO week. |
| `POST /v1/webhooks/revenuecat` | RevenueCat webhook (shared secret). Records one grant per event id. |
| `GET /v1/grants`, `POST /v1/grants/claim` | Unclaimed purchase grants and active entitlements; a grant can be claimed exactly once. |

Rate limit: 120 requests per minute per IP. CORS open. Bodies capped.

## Run

```sh
SS_SECRET=$(openssl rand -hex 32) SS_RC_WEBHOOK_SECRET=... SS_DB=./data.db SS_PORT=8787 node server/index.mjs
npm run test:server
```

Deploy anywhere that runs Node 22 (Fly.io, Railway, a $5 VPS). Put it
behind HTTPS and point the client at it with `VITE_API_URL`. In RevenueCat,
set the webhook URL to `https://<host>/v1/webhooks/revenuecat` with the
Authorization value `Bearer <SS_RC_WEBHOOK_SECRET>`, and set the app user id
to the device id (the client already does).

## Why grants

RevenueCat validates receipts with Apple. The client applies a purchase
immediately for responsiveness, and the webhook records it on the server.
On every boot the client claims unclaimed grants, so a Clout pack bought on
one phone lands on a restored save on another phone, and a tampered client
cannot invent a grant because only the webhook writes them.

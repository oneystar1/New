# CI, deploys and store automation

Three GitHub Actions workflows live in `.github/workflows/` at the repo root.
Everything is gated on secrets: a workflow whose secrets are missing stops
with a message naming them, it never half-deploys.

| Workflow | Trigger | Does |
| --- | --- | --- |
| `scalping-squishies-ci.yml` | push / PR touching `scalping-squishies/` | typecheck, 67 engine tests, 6 server tests, build, headless phone-viewport smoke test, deploy `dist/` to GitHub Pages |
| `scalping-squishies-server.yml` | push touching `server/` or `fly.toml` | server tests, then `server/deploy.sh` to Fly.io when `FLY_API_TOKEN` is set |
| `scalping-squishies-ios.yml` | manual run, or a tag `ss-ios-v*` | builds the Capacitor shell on a macOS runner, signs with fastlane match, uploads to TestFlight |

## 1. Public web build (GitHub Pages)

One click on your side: repo **Settings → Pages → Build and deployment →
Source: GitHub Actions**. The next push publishes to
`https://oneystar1.github.io/New/`. If the `github-pages` environment
rejects a deploy from this branch, open **Settings → Environments →
github-pages** and add `claude/scalp-street-idle-game` to the allowed
deployment branches (or merge to `main`).

Optional repository **variables** (Settings → Secrets and variables →
Actions → Variables):

| Variable | Used for |
| --- | --- |
| `SS_API_URL` | Backend base URL, e.g. `https://scalping-squishies-api.fly.dev`. Empty = offline game, local saves only. |
| `SS_SUPPORT_EMAIL` | Fills the contact line on `privacy.html` / `support.html` and the in-game Send feedback button. |
| `SS_SITE_URL` | Where Settings links to for privacy/support. Defaults to the Pages URL. |

## 2. Backend (Fly.io)

One-time on your side: create a Fly account, `fly auth token` (or
Dashboard → Tokens), and add these repository **secrets**:

| Secret | Value |
| --- | --- |
| `FLY_API_TOKEN` | the token |
| `SS_SECRET` | `openssl rand -hex 32`; signs login tokens. The deploy script generates one if you skip this. |
| `SS_RC_WEBHOOK_SECRET` | any long random string; paste the same into RevenueCat's webhook Authorization as `Bearer <value>` |
| `SS_ADMIN_TOKEN` | any long random string; unlocks `GET /v1/admin/stats` for the dashboard |

`server/deploy.sh` creates the app and a 1 GB volume on first run, sets
secrets, deploys. Health: `https://scalping-squishies-api.fly.dev/v1/health`.
Then set `SS_API_URL` (variable, above) so builds talk to it. Fly keeps
daily volume snapshots for 5 days; `tools/backup-db.sh` pulls an off-site copy.

Dashboard: `SS_API_URL=... SS_ADMIN_TOKEN=... npm run dashboard` prints
the soft-launch gates (D1, D7, rewarded/DAU, starter conversion) with
pass/fail and sample-size warnings.

## 3. iOS builds without a Mac

Requires an Apple Developer account. Then:

1. **App Store Connect API key**: Users and Access → Integrations → App
   Store Connect API → Generate. Role **App Manager** (match needs to
   create certificates). Download the `.p8` once.
2. **Certificates repo**: create a *private* GitHub repo, e.g.
   `oneystar1/ss-certs`, empty. fastlane match stores the encrypted
   signing certificate and profile there so CI can sign. Create a
   fine-grained personal access token with read/write Contents on that
   repo only.
3. Add repository **secrets**:

| Secret | Value |
| --- | --- |
| `ASC_KEY_ID` | key id from step 1 |
| `ASC_ISSUER_ID` | issuer id from the same page |
| `ASC_KEY_CONTENT` | `base64 -i AuthKey_XXXX.p8 \| tr -d '\n'` |
| `APPLE_TEAM_ID` | 10-character team id (Membership page) |
| `MATCH_GIT_URL` | `https://github.com/oneystar1/ss-certs.git` |
| `MATCH_PASSWORD` | a new passphrase; encrypts the certs repo |
| `MATCH_GIT_BASIC_AUTHORIZATION` | `echo -n "oneystar1:<token>" \| base64` |
| `ADMOB_APP_ID` | AdMob → Apps → App ID (`ca-app-pub-…~…`). Optional; defaults to Google's sample id with test ads. |
| `ADMOB_REWARDED_UNIT`, `ADMOB_INTERSTITIAL_UNIT` | ad unit ids. Optional until release. |
| `RC_IOS_KEY` | RevenueCat public iOS SDK key. Optional; empty disables purchases. |

4. Actions → **Scalping Squishies iOS** → Run workflow. The first run
   registers the bundle id, creates the App Store Connect app record,
   creates the distribution certificate and profile, builds, and uploads
   build 1 to TestFlight (about 25 minutes). Later runs reuse everything.
   Pushing a tag like `ss-ios-v0.1.0` does the same.

What the workflow does to the generated Xcode project each time: icons and
launch screen from `assets/` via `@capacitor/assets`, and
`tools/ios-plist.sh` adds `GADApplicationIdentifier`,
`NSUserTrackingUsageDescription`, `ITSAppUsesNonExemptEncryption=false`
and the SKAdNetwork list. The `ios/` folder is never committed.

Still manual in App Store Connect: in-app purchase products (ids in
`src/engine/data/shop.ts`), the age rating questionnaire, screenshots and
listing text, the privacy "nutrition label" (answers are in
`public/privacy.html`), and the paid-apps agreement + banking/tax forms.

## 4. Local equivalents

```sh
npm run icons                 # regenerate public/icons and assets/ from public/icon.svg
npm run build && npm run smoke
npm run test:server
SS_ADMIN_TOKEN=x npm run server   # then: SS_API_URL=http://localhost:8787 SS_ADMIN_TOKEN=x npm run dashboard
```

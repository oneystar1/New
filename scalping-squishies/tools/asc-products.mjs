// App Store Connect product check: compares the in-app purchases that exist
// in App Store Connect with the ids the game sells (src/engine/data/shop.ts).
//   ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_CONTENT=<base64 .p8> node tools/asc-products.mjs [--strict]
// Without the key it prints the expected product table and exits 0, so it
// is safe in CI before the account exists. With --strict it exits 1 when a
// product is missing or not yet approved.
import { createSign, createPrivateKey } from 'node:crypto';
import { readFileSync } from 'node:fs';

const strict = process.argv.includes('--strict');
const shop = readFileSync(new URL('../src/engine/data/shop.ts', import.meta.url), 'utf8');
const bundleId = /appId: '([^']+)'/.exec(readFileSync(new URL('../capacitor.config.ts', import.meta.url), 'utf8'))?.[1];
const expected = [...shop.matchAll(/id: '(ss_[a-z_]+)', kind: '([a-z]+)'/g)].map((m) => ({ id: m[1], kind: m[2] }));
for (const n of [2, 3, 4, 5, 6]) expected.push({ id: `ss_pass_s${n}`, kind: 'pass' });
const typeOf = (p) => (p.kind === 'vip' ? 'AUTO_RENEWABLE' : p.kind === 'clout' || p.kind === 'bundle' || /^ss_pass_s/.test(p.id) ? 'CONSUMABLE' : 'NON_CONSUMABLE');

const { ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_CONTENT } = process.env;
if (!ASC_KEY_ID || !ASC_ISSUER_ID || !ASC_KEY_CONTENT) {
  console.log(`No App Store Connect key in the environment. Expected products for ${bundleId}:`);
  for (const p of expected) console.log(`  ${p.id.padEnd(16)} ${typeOf(p)}`);
  console.log('\nSet ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_CONTENT (base64 .p8) to compare against the live account.');
  process.exit(0);
}

const b64url = (s) => Buffer.from(s).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const header = b64url(JSON.stringify({ alg: 'ES256', kid: ASC_KEY_ID, typ: 'JWT' }));
const payload = b64url(JSON.stringify({ iss: ASC_ISSUER_ID, iat: now, exp: now + 15 * 60, aud: 'appstoreconnect-v1' }));
const key = createPrivateKey(Buffer.from(ASC_KEY_CONTENT, 'base64').toString('utf8'));
const sig = createSign('SHA256').update(`${header}.${payload}`).sign({ key, dsaEncoding: 'ieee-p1363' });
const token = `${header}.${payload}.${sig.toString('base64url')}`;
const api = async (path) => {
  const r = await fetch(`https://api.appstoreconnect.apple.com/v1${path}`, { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
};

const apps = await api(`/apps?filter[bundleId]=${encodeURIComponent(bundleId)}`);
const app = apps.data?.[0];
if (!app) { console.error(`No app with bundle id ${bundleId} in this account.`); process.exit(strict ? 1 : 0); }
const iaps = await api(`/apps/${app.id}/inAppPurchasesV2?limit=200`);
const live = new Map(iaps.data.map((d) => [d.attributes.productId, { type: d.attributes.inAppPurchaseType, state: d.attributes.state }]));
const groups = await api(`/apps/${app.id}/subscriptionGroups?include=subscriptions&limit=50`);
for (const inc of groups.included ?? []) if (inc.type === 'subscriptions') live.set(inc.attributes.productId, { type: 'AUTO_RENEWABLE', state: inc.attributes.state });

let bad = 0;
console.log(`App ${app.attributes.name} (${app.id})\n`);
console.log('| Product | Expected | In App Store Connect | State |\n| --- | --- | --- | --- |');
for (const p of expected) {
  const l = live.get(p.id);
  const ok = l && l.type === typeOf(p);
  if (!ok || !/APPROVED|READY_TO_SUBMIT|WAITING_FOR_REVIEW|IN_REVIEW|PREPARE_FOR_SUBMISSION/.test(l?.state ?? '')) bad++;
  console.log(`| ${p.id} | ${typeOf(p)} | ${l ? l.type : 'missing'} | ${l?.state ?? '' } ${ok ? '✅' : '❌'} |`);
}
for (const [id] of live) if (!expected.some((p) => p.id === id)) console.log(`| ${id} | (not in shop.ts) | ${live.get(id).type} | ${live.get(id).state} ⚠️ |`);
console.log(bad ? `\n${bad} product(s) need attention.` : '\nAll products present.');
if (strict && bad) process.exit(1);

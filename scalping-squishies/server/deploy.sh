#!/usr/bin/env bash
# One-shot Fly.io deploy: creates the app and volume if missing, sets any
# secrets present in the environment, deploys. Safe to re-run.
# Needs: flyctl on PATH, FLY_API_TOKEN. Optional: SS_SECRET,
# SS_RC_WEBHOOK_SECRET, SS_ADMIN_TOKEN, FLY_REGION (default iad).
set -euo pipefail
cd "$(dirname "$0")/.."
APP=$(sed -n 's/^app = "\(.*\)"/\1/p' fly.toml)
REGION="${FLY_REGION:-iad}"

if ! flyctl apps list --json | grep -q "\"Name\": *\"$APP\""; then
  echo "Creating app $APP"
  flyctl apps create "$APP" --org personal
fi

if ! flyctl volumes list -a "$APP" --json | grep -q '"ss_data"'; then
  echo "Creating 1GB volume ss_data in $REGION"
  flyctl volumes create ss_data -a "$APP" --region "$REGION" --size 1 --yes
fi

pairs=()
[ -n "${SS_SECRET:-}" ] && pairs+=("SS_SECRET=$SS_SECRET")
[ -n "${SS_RC_WEBHOOK_SECRET:-}" ] && pairs+=("SS_RC_WEBHOOK_SECRET=$SS_RC_WEBHOOK_SECRET")
[ -n "${SS_ADMIN_TOKEN:-}" ] && pairs+=("SS_ADMIN_TOKEN=$SS_ADMIN_TOKEN")
if [ ${#pairs[@]} -gt 0 ]; then
  echo "Setting ${#pairs[@]} secret(s)"
  flyctl secrets set -a "$APP" --stage "${pairs[@]}"
fi
if ! flyctl secrets list -a "$APP" | grep -q SS_SECRET; then
  echo "No SS_SECRET yet; generating one (tokens issued before a later change become invalid)"
  flyctl secrets set -a "$APP" --stage "SS_SECRET=$(openssl rand -hex 32)"
fi

flyctl deploy -a "$APP" --remote-only --ha=false
echo "Deployed. Health: https://$APP.fly.dev/v1/health"

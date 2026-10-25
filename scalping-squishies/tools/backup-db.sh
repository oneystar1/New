#!/usr/bin/env bash
# Pull a copy of the production SQLite file from the Fly volume.
# Fly also keeps automatic daily volume snapshots (5 days); this is the
# off-site copy. Usage: tools/backup-db.sh [out-dir]
set -euo pipefail
cd "$(dirname "$0")/.."
APP=$(sed -n 's/^app = "\(.*\)"/\1/p' fly.toml)
OUT="${1:-backups}"
mkdir -p "$OUT"
STAMP=$(date -u +%Y%m%d-%H%M%S)
flyctl ssh sftp get -a "$APP" /data/data.db "$OUT/data-$STAMP.db"
echo "Saved $OUT/data-$STAMP.db"

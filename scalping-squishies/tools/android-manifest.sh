#!/usr/bin/env bash
# Adds the AdMob app id to the generated Android manifest (idempotent).
#   ADMOB_ANDROID_APP_ID=ca-app-pub-xxx~yyy bash tools/android-manifest.sh android/app/src/main/AndroidManifest.xml
# Without the id it uses Google's sample app id (test ads).
set -euo pipefail
MANIFEST="${1:?path to AndroidManifest.xml}"
APP_ID="${ADMOB_ANDROID_APP_ID:-ca-app-pub-3940256099942544~3347511713}"
python3 - "$MANIFEST" "$APP_ID" <<'PY'
import re, sys
path, app_id = sys.argv[1], sys.argv[2]
t = open(path).read()
meta = f'<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="{app_id}" />'
if 'com.google.android.gms.ads.APPLICATION_ID' in t:
    t = re.sub(r'<meta-data android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID" android:value="[^"]*" />', meta, t)
else:
    t = t.replace('</application>', f'        {meta}\n    </application>', 1)
open(path, 'w').write(t)
print(f'AdMob app id set: {app_id}')
PY

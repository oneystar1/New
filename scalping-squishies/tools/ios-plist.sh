#!/usr/bin/env bash
# Adds the Info.plist keys the AdMob plugin and App Review need to the
# Capacitor-generated iOS project. Idempotent. Run after `npx cap sync ios`.
#   ADMOB_APP_ID=ca-app-pub-xxx~yyy bash tools/ios-plist.sh ios/App/App/Info.plist
# Without ADMOB_APP_ID it uses Google's public sample app id, which is what
# you want for TestFlight builds that show test ads.
set -euo pipefail
PLIST="${1:?path to Info.plist}"
APP_ID="${ADMOB_APP_ID:-ca-app-pub-3940256099942544~1458002511}"
PB=/usr/libexec/PlistBuddy

set_str() { "$PB" -c "Set :$1 '$2'" "$PLIST" 2>/dev/null || "$PB" -c "Add :$1 string '$2'" "$PLIST"; }
set_bool() { "$PB" -c "Set :$1 $2" "$PLIST" 2>/dev/null || "$PB" -c "Add :$1 bool $2" "$PLIST"; }

set_str GADApplicationIdentifier "$APP_ID"
set_str NSUserTrackingUsageDescription "This lets us show ads that are more relevant to you. Say no and you get the same game with non-personalized ads."
# No custom encryption, so every upload skips the export compliance question.
set_bool ITSAppUsesNonExemptEncryption false

# SKAdNetwork ids. Google's own id is the one AdMob requires; the rest are
# Google's bidding partners. Override with SKAD_IDS="a b c" to refresh from
# https://developers.google.com/admob/ios/quick-start#update_your_infoplist
IDS="${SKAD_IDS:-cstr6suwn9 4fzdc2evr5 2fnua5tdw4 ydx93a7ass p78axxw29g v72qych5uu ludvb6z3bs cp8zw746q7 3sh42y64q3 c6k4g5qg8m s39g8k73mm 3qy4746246 hs6bdukanm mlmmfzh3r3 v4nxqhlyqp wzmmz9fp6w su67r6k2v3 yclnxrl5pm t38b2kh725 7ug5zh24hu gta9lk7p23 vutu7akeur y5ghdn5j9k v9wttpbfk9 n38lu8286q 47vhws6wlr kbd757ywx3 9t245vhmpl a2p9lx4jpn 22mmun2rn5 4468km3ulz 2u9pt9hc89 8s468mfl3y ppxm28t8ap uw77j35x4d 578prtvx9j 4dzt52r2t5 tl55sbb4fm e5fvkxwrpn 8c4e2ghe7u 3rd42ekr43 3qcr597p9d}"
"$PB" -c "Delete :SKAdNetworkItems" "$PLIST" 2>/dev/null || true
"$PB" -c "Add :SKAdNetworkItems array" "$PLIST"
i=0
for id in $IDS; do
  "$PB" -c "Add :SKAdNetworkItems:$i dict" "$PLIST"
  "$PB" -c "Add :SKAdNetworkItems:$i:SKAdNetworkIdentifier string $id.skadnetwork" "$PLIST"
  i=$((i + 1))
done
echo "Info.plist updated: AdMob app id, tracking description, $i SKAdNetwork ids"

#!/usr/bin/env bash
set -euo pipefail
test "${GITHUB_ACTIONS:-}" = true
test "$(uname -sm)" = 'Darwin arm64'
test -n "${RUNNER_TEMP:-}"
test -n "${GITHUB_WORKSPACE:-}"
cd "$GITHUB_WORKSPACE"
umask 077
case "${QUIET_NOTIFICATION_LANE:-}" in
  onboarding)
    env_file=.env.e2e.qss
    # Required Xcode resource; this lane intentionally never configures Firebase.
    python3 - <<'PY'
import plistlib
from pathlib import Path
destination = Path('packages/mobile/ios/GoogleService-Info.plist')
assert not destination.exists()
destination.write_bytes(plistlib.dumps({}))
PY
    ;;
  provider)
    env_file=.env.e2e.qss.push
    test -f "$RUNNER_TEMP/notification-credentials/firebase-accounts.json"
    test -f packages/mobile/ios/GoogleService-Info.plist
    ;;
  *) echo 'Select onboarding or provider explicitly.' >&2; exit 1 ;;
esac

mkdir "$RUNNER_TEMP/notification-tor"
tar -xzf "$RUNNER_TEMP/notification-tor.tgz" -C "$RUNNER_TEMP/notification-tor"
python3 - <<'PY'
import os, shlex, shutil
from pathlib import Path
node = shutil.which('node')
assert node
Path('packages/mobile/ios/.xcode.env.local').write_text(
    'export NODE_BINARY=' + shlex.quote(node) + '\nexport EXTRA_PACKAGER_ARGS="--max-workers 1"\n')
PY

(cd packages/backend && npm run webpack:prod)
python3 packages/mobile/scripts/tor-ios-simulator/build-storybook.py \
  --checkout "$GITHUB_WORKSPACE" \
  --framework "$RUNNER_TEMP/notification-tor/Tor.framework" \
  --output "$RUNNER_TEMP/notification-ios-build" \
  --scheme Quiet --configuration Debug --env-file "$env_file"
python3 packages/mobile/e2e/appium/sign-ios-simulator.py \
  --checkout "$GITHUB_WORKSPACE" \
  --app "$RUNNER_TEMP/notification-ios-build/DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app" \
  --output "$RUNNER_TEMP/notification-ios-signing"

(
  cd packages/desktop
  export ENVFILE=.env.e2e.qss SOURCE_PATH=darwin
  npm run copyBinariesDarwin
  npm run build:prod
  ./node_modules/.bin/electron-builder --mac --arm64 --dir -p never -c.mac.identity=null
)

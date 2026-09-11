#!/usr/bin/env bash
# Called by android-emulator-runner after building both clients on a fresh runner.
set -euo pipefail
test "${GITHUB_ACTIONS:-}" = true
test -n "${RUNNER_TEMP:-}"
test -n "${GITHUB_WORKSPACE:-}"
case "${QUIET_NOTIFICATION_LANE:-}" in
  onboarding) test_script=test:onboarding ;;
  provider) test_script=test:full-loop ;;
  *) echo 'Set QUIET_NOTIFICATION_LANE to onboarding or provider'; exit 1 ;;
esac
cd "$GITHUB_WORKSPACE"
umask 077

export QUIET_QSS_LOCAL_FIXTURE_OUTPUT="$RUNNER_TEMP/notification-fixture"
export QUIET_QSS_E2E_RUN_DIR="$RUNNER_TEMP/notification-run"
export QUIET_QSS_ONLY_BUILD_RECEIPT="$RUNNER_TEMP/notification-backend/qss-only-build.json"
export QUIET_NOTIFICATION_CONFIG="$RUNNER_TEMP/notification-appium.json"
export IS_E2E=true
export DISPLAY=:99

appium_pid=''
xvfb_pid=''
wm_pid=''
cleanup() {
  result=$?
  trap - EXIT
  for child in "$appium_pid" "$wm_pid" "$xvfb_pid"; do
    if [[ -n "$child" ]]; then kill "$child" 2>/dev/null || true; fi
  done
  if [[ -f "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT/manifest.json" ]]; then
    python3 packages/mobile/scripts/qss-e2e/fixture.py stop --output "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT" > "$RUNNER_TEMP/notification-fixture-stop.log" 2>&1 || true
  fi
  # Compose's runtime file contains provider credentials; do not archive it.
  rm -f "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT/compose.json"
  exit "$result"
}
trap cleanup EXIT

# Quiet's embedded Node/Tor libraries are ARM64. Google's API 36 x86_64 image
# must expose ARM64 translation, just as in the locally validated emulator.
adb -s emulator-5554 shell getprop ro.product.cpu.abilist | rg -q 'arm64-v8a'
Xvfb :99 -screen 0 1920x1080x24 > "$RUNNER_TEMP/notification-display.log" 2>&1 &
xvfb_pid=$!
for attempt in $(seq 1 30); do
  if xdpyinfo >/dev/null 2>&1; then break; fi
  sleep 1
done
xdpyinfo >/dev/null
fluxbox > "$RUNNER_TEMP/notification-window-manager.log" 2>&1 &
wm_pid=$!

fixture_args=(up --output "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT" --port 3003)
if [[ "$QUIET_NOTIFICATION_LANE" == provider ]]; then
  fixture_args+=(--push-credentials "$RUNNER_TEMP/notification-credentials/firebase-accounts.json")
fi
python3 packages/mobile/scripts/qss-e2e/fixture.py "${fixture_args[@]}" > "$RUNNER_TEMP/notification-fixture.log" 2>&1
python3 packages/mobile/scripts/qss-e2e/fixture.py prepare-run \
  --output "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT" --run-output "$QUIET_QSS_E2E_RUN_DIR"

python3 - <<'PY'
import json, os
from pathlib import Path
root = Path(os.environ['GITHUB_WORKSPACE'])
config = {
    'platform': 'android', 'udid': 'emulator-5554', 'disposable': True,
    'bundleId': 'com.quietmobile.debug', 'appiumPort': 4725, 'systemPort': 8225,
    'app': str(root / 'packages/mobile/android/app/build/outputs/apk/standard/debug/app-standard-debug.apk'),
    'desktopBinary': str(root / 'packages/desktop/dist/linux-unpacked/@quietdesktop'),
    'display': ':99',
}
Path(os.environ['QUIET_NOTIFICATION_CONFIG']).write_text(json.dumps(config))
PY

(
  cd packages/mobile/e2e/appium
  exec ./node_modules/.bin/appium --address 127.0.0.1 --port 4725 --log-level warn
) > "$RUNNER_TEMP/notification-appium.log" 2>&1 &
appium_pid=$!
for attempt in $(seq 1 60); do
  if curl --silent --fail http://127.0.0.1:4725/status >/dev/null; then break; fi
  sleep 1
done
curl --silent --fail http://127.0.0.1:4725/status >/dev/null

result=0
npm --prefix packages/mobile/e2e/appium run "$test_script" > "$QUIET_QSS_E2E_RUN_DIR/test.log" 2>&1 || result=$?
# Keep screenshots, invitations, device tokens and raw service logs private.
# CI publishes only these deliberately selected non-secret proof fields.
python3 - <<'PY'
import json, os
from pathlib import Path
source = Path(os.environ['QUIET_QSS_E2E_RUN_DIR']) / 'ui.json'
proof = json.loads(source.read_text()) if source.exists() else {}
build = proof.get('build', {})
report = {
    'platform': 'android',
    'lane': os.environ['QUIET_NOTIFICATION_LANE'],
    'onboardingPassed': proof.get('onboardingPassed', False) is True,
    'fullLoopPassed': proof.get('fullLoopPassed', False) is True,
    'completedNotificationJourneys': len(proof.get('notifications', [])),
    'backendMode': build.get('backendMode'),
    'appSHA256': build.get('appSHA256'),
    'backendSHA256': build.get('backendSHA256'),
}
Path(os.environ['RUNNER_TEMP'], 'notification-result.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
if report['lane'] == 'provider':
    if not report['fullLoopPassed'] or report['completedNotificationJourneys'] != 2:
        raise SystemExit('Real provider notification tests did not pass; no injected fallback was run.')
elif not report['onboardingPassed'] or report['fullLoopPassed']:
    raise SystemExit('The explicit onboarding smoke did not pass.')
PY
exit "$result"

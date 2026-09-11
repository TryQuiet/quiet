#!/usr/bin/env bash
# Called by android-emulator-runner after building both clients on a fresh runner.
set -euo pipefail
test "${GITHUB_ACTIONS:-}" = true
test -n "${RUNNER_TEMP:-}"
test -n "${GITHUB_WORKSPACE:-}"
case "${QUIET_NOTIFICATION_LANE:-}" in
  onboarding) test_file=onboarding.test.mjs ;;
  provider) test_file=full-loop.test.mjs ;;
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
stage=emulator-abi
owned_child_alive() {
  local child_pid="$1"
  [[ -n "$child_pid" ]] &&
    [[ "$(ps -o ppid= -p "$child_pid" 2>/dev/null | tr -d ' ')" = "$$" ]] &&
    kill -0 "$child_pid" 2>/dev/null
}

stop_owned_child() {
  local child_pid="$1"
  if [[ -z "$child_pid" ]]; then return; fi
  if owned_child_alive "$child_pid"; then
    kill "$child_pid" 2>/dev/null || true
    for attempt in $(seq 1 50); do
      if ! owned_child_alive "$child_pid"; then break; fi
      sleep 0.1
    done
    if owned_child_alive "$child_pid"; then kill -KILL "$child_pid" 2>/dev/null || true; fi
  fi
  wait "$child_pid" 2>/dev/null || true
}

record_display_liveness() {
  display_alive=false
  window_manager_alive=false
  if owned_child_alive "$xvfb_pid" && timeout 5s xdpyinfo >/dev/null 2>&1; then display_alive=true; fi
  if owned_child_alive "$wm_pid"; then window_manager_alive=true; fi
  # Only fixed phase labels and booleans are public; window titles and logs stay private.
  printf '{"event":"desktop-display-liveness","phase":"%s","displayAlive":%s,"windowManagerAlive":%s}\n' \
    "$1" "$display_alive" "$window_manager_alive"
}

cleanup() {
  result=$?
  trap - EXIT
  stop_owned_child "$appium_pid"
  # Fluxbox aborts if Xvfb disappears while its SIGTERM handler is still using X11.
  stop_owned_child "$wm_pid"
  stop_owned_child "$xvfb_pid"
  if [[ -f "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT/manifest.json" ]]; then
    python3 packages/mobile/scripts/qss-e2e/fixture.py stop --output "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT" > "$RUNNER_TEMP/notification-fixture-stop.log" 2>&1 || true
  fi
  # Compose's runtime file contains provider credentials; do not archive it.
  rm -f "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT/compose.json"
  if [[ "$result" != 0 ]]; then echo "Android notification lane failed during $stage (exit $result)."; fi
  exit "$result"
}
trap cleanup EXIT

# Quiet's embedded Node/Tor libraries are ARM64. Google's API 36 x86_64 image
# must expose ARM64 translation, just as in the locally validated emulator.
adb -s emulator-5554 shell getprop ro.product.cpu.abilist | grep -q 'arm64-v8a'
stage=display
Xvfb :99 -screen 0 1920x1080x24 > "$RUNNER_TEMP/notification-display.log" 2>&1 &
xvfb_pid=$!
for attempt in $(seq 1 30); do
  if xdpyinfo >/dev/null 2>&1; then break; fi
  sleep 1
done
xdpyinfo >/dev/null
fluxbox > "$RUNNER_TEMP/notification-window-manager.log" 2>&1 &
wm_pid=$!

stage=qss-fixture
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

stage=display-before-appium
record_display_liveness before-appium
if [[ "$display_alive" != true || "$window_manager_alive" != true ]]; then
  echo 'Desktop display or window manager stopped before Appium.' >&2
  exit 1
fi

stage=appium-server
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

stage=appium-journey
result=0
(
  cd packages/mobile/e2e/appium
  node --import tsx --test --test-concurrency=1 \
    --test-reporter=spec --test-reporter-destination=stdout \
    --test-reporter=./safe-reporter.mjs --test-reporter-destination="$RUNNER_TEMP/notification-failures.jsonl" \
    "$test_file"
) > "$QUIET_QSS_E2E_RUN_DIR/test.log" 2>&1 || result=$?
export QUIET_NOTIFICATION_TEST_EXIT="$result"
record_display_liveness after-journey
export QUIET_NOTIFICATION_DISPLAY_ALIVE="$display_alive"
export QUIET_NOTIFICATION_WINDOW_MANAGER_ALIVE="$window_manager_alive"
# Keep screenshots, invitations, device tokens and raw service logs private.
# CI publishes only these deliberately selected non-secret proof fields.
python3 - <<'PY'
import json, os
from pathlib import Path
source = Path(os.environ['QUIET_QSS_E2E_RUN_DIR']) / 'ui.json'
proof = json.loads(source.read_text()) if source.exists() else {}
progress_file = source.with_name('progress.json')
progress = json.loads(progress_file.read_text()).get('stage') if progress_file.exists() else None
stages = {'desktop-create', 'mobile-start', 'mobile-join', 'foreground-send', 'foreground-receive',
          'qss-storage-proof', 'onboarding-complete', 'fresh-join-background', 'fresh-join-send',
          'fresh-join-notification-tap', 'named-channel-create', 'named-channel-sync',
          'named-channel-background', 'named-channel-send', 'named-channel-notification-tap', 'provider-complete'}
build = proof.get('build', {})
report = {
    'platform': 'android',
    'lane': os.environ['QUIET_NOTIFICATION_LANE'],
    'testExitCode': int(os.environ['QUIET_NOTIFICATION_TEST_EXIT']),
    'displayAliveAfterJourney': os.environ['QUIET_NOTIFICATION_DISPLAY_ALIVE'] == 'true',
    'windowManagerAliveAfterJourney': os.environ['QUIET_NOTIFICATION_WINDOW_MANAGER_ALIVE'] == 'true',
    'onboardingPassed': proof.get('onboardingPassed', False) is True,
    'lastStage': progress if progress in stages else None,
    'fullLoopPassed': proof.get('fullLoopPassed', False) is True,
    'completedNotificationJourneys': len(proof.get('notifications', [])),
    'backendMode': build.get('backendMode'),
    'appSHA256': build.get('appSHA256'),
    'backendSHA256': build.get('backendSHA256'),
}
if report['lane'] == 'provider':
    journey_passed = report['fullLoopPassed'] and report['completedNotificationJourneys'] == 2
else:
    journey_passed = report['onboardingPassed'] and not report['fullLoopPassed']
passed = report['testExitCode'] == 0 and journey_passed and report['displayAliveAfterJourney'] and report['windowManagerAliveAfterJourney']
report['status'] = 'passed' if passed else 'failed'
Path(os.environ['RUNNER_TEMP'], 'notification-result.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
if not passed:
    raise SystemExit('The selected Android Appium journey did not pass. No alternate lane was substituted.')
PY
exit "$result"

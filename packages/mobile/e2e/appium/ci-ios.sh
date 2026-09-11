#!/usr/bin/env bash
set -euo pipefail
test "${GITHUB_ACTIONS:-}" = true
test "$(uname -sm)" = 'Darwin arm64'
test -n "${RUNNER_TEMP:-}"
test -n "${GITHUB_WORKSPACE:-}"
cd "$GITHUB_WORKSPACE"
umask 077
case "${QUIET_NOTIFICATION_LANE:-}" in
  onboarding) test_command=test:onboarding; push_args=() ;;
  provider)
    test_command=test:full-loop
    push_args=(--push-credentials "$RUNNER_TEMP/notification-credentials/firebase-accounts.json")
    ;;
  *) echo 'Select onboarding or provider explicitly.' >&2; exit 1 ;;
esac

export QUIET_QSS_LOCAL_FIXTURE_OUTPUT="$RUNNER_TEMP/notification-ios-fixture"
export QUIET_QSS_E2E_RUN_DIR="$RUNNER_TEMP/notification-ios-run"
export QUIET_NOTIFICATION_CONFIG="$RUNNER_TEMP/notification-ios-appium.json"
appium_pid=''
simulator_id=''
stage=qss-toolchain
cleanup() {
  result=$?
  trap - EXIT
  if [[ -z "$simulator_id" && -f "$RUNNER_TEMP/notification-ios-simulator" ]]; then
    simulator_id=$(cat "$RUNNER_TEMP/notification-ios-simulator")
  fi
  if [[ -n "$appium_pid" ]] && [[ "$(ps -o ppid= -p "$appium_pid" | tr -d ' ')" = "$$" ]]; then
    kill "$appium_pid" 2>/dev/null || true
    wait "$appium_pid" 2>/dev/null || true
  fi
  if [[ -n "$simulator_id" ]]; then
    xcrun simctl shutdown "$simulator_id" >/dev/null 2>&1 || true
    xcrun simctl delete "$simulator_id" >/dev/null 2>&1 || true
  fi
  if [[ -f "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT/manifest.json" ]]; then
    python3 packages/mobile/scripts/qss-e2e/fixture.py stop --output "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT" > "$RUNNER_TEMP/notification-ios-stop.log" 2>&1 || true
  fi
  rm -f "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT/compose.json"
  if [[ "$result" != 0 ]]; then echo "iOS notification lane failed during $stage (exit $result)."; fi
  exit "$result"
}
trap cleanup EXIT

# QSS has a separately pinned Node version. Verify the official archive before
# installing it into this job's directory; leave the application's Node unchanged.
mkdir "$RUNNER_TEMP/notification-qss-node"
python3 - <<'PY'
import hashlib, os, tarfile, urllib.request
from pathlib import Path
output = Path(os.environ['RUNNER_TEMP']) / 'notification-qss-node'
name = 'node-v22.14.0-darwin-arm64.tar.gz'
base = 'https://nodejs.org/dist/v22.14.0/'
sums = urllib.request.urlopen(base + 'SHASUMS256.txt', timeout=60).read().decode()
expected = next(line.split()[0] for line in sums.splitlines() if line.split()[-1] == name)
archive = output / name
with urllib.request.urlopen(base + name, timeout=120) as response:
    archive.write_bytes(response.read())
assert hashlib.sha256(archive.read_bytes()).hexdigest() == expected, 'QSS Node archive checksum mismatch'
with tarfile.open(archive) as bundle:
    bundle.extractall(output, filter='data')
archive.unlink()
PY
stage=qss-fixture
python3 packages/mobile/scripts/qss-e2e/fixture.py up --runtime native \
  --output "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT" --port 3003 \
  --node "$RUNNER_TEMP/notification-qss-node/node-v22.14.0-darwin-arm64/bin/node" \
  --corepack "$RUNNER_TEMP/notification-qss-node/node-v22.14.0-darwin-arm64/bin/corepack" \
  --postgres-bin "$(brew --prefix postgresql@18)/bin" \
  --redis-server "$(brew --prefix redis)/bin/redis-server" \
  "${push_args[@]}" > "$RUNNER_TEMP/notification-ios-fixture.log" 2>&1
python3 packages/mobile/scripts/qss-e2e/fixture.py prepare-run \
  --output "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT" --run-output "$QUIET_QSS_E2E_RUN_DIR"

stage=simulator
python3 - <<'PY'
import json, os, subprocess
from pathlib import Path
root = Path(os.environ['GITHUB_WORKSPACE'])
temporary = Path(os.environ['RUNNER_TEMP'])
runtimes = json.loads(subprocess.check_output(['xcrun', 'simctl', 'list', 'runtimes', '--json']))['runtimes']
candidates = [item for item in runtimes if item.get('isAvailable') and item['identifier'].startswith('com.apple.CoreSimulator.SimRuntime.iOS-')]
assert candidates, 'No iOS Simulator runtime is installed'
runtime = sorted(candidates, key=lambda item: (item['version'].startswith('26.3'), [int(v) for v in item['version'].split('.')]), reverse=True)[0]
udid = subprocess.check_output(['xcrun', 'simctl', 'create', 'Quiet Notification CI', 'com.apple.CoreSimulator.SimDeviceType.iPhone-16e', runtime['identifier']], text=True).strip()
(temporary / 'notification-ios-simulator').write_text(udid)
config = {
    'platform': 'ios', 'udid': udid, 'disposable': True, 'bundleId': 'com.quietmobile',
    'appiumPort': 4725, 'wdaLocalPort': 8125,
    'app': str(temporary / 'notification-ios-build/DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app'),
    'desktopBinary': str(root / 'packages/desktop/dist/mac-arm64/Quiet.app/Contents/MacOS/Quiet'),
}
Path(os.environ['QUIET_NOTIFICATION_CONFIG']).write_text(json.dumps(config))
PY
simulator_id=$(cat "$RUNNER_TEMP/notification-ios-simulator")
xcrun simctl boot "$simulator_id"
xcrun simctl bootstatus "$simulator_id" -b

stage=appium-server
(
  cd packages/mobile/e2e/appium
  exec ./node_modules/.bin/appium --address 127.0.0.1 --port 4725 --log-level warn
) > "$RUNNER_TEMP/notification-ios-appium.log" 2>&1 &
appium_pid=$!
for attempt in $(seq 1 60); do
  if curl --silent --fail http://127.0.0.1:4725/status >/dev/null; then break; fi
  sleep 1
done
curl --silent --fail http://127.0.0.1:4725/status >/dev/null

stage=appium-journey
test_exit=0
npm --prefix packages/mobile/e2e/appium run "$test_command" > "$QUIET_QSS_E2E_RUN_DIR/test.log" 2>&1 || test_exit=$?
export QUIET_NOTIFICATION_TEST_EXIT="$test_exit"
python3 - <<'PY'
import json, os
from pathlib import Path
directory = Path(os.environ['QUIET_QSS_E2E_RUN_DIR'])
proof = json.loads((directory / 'ui.json').read_text()) if (directory / 'ui.json').exists() else {}
progress = json.loads((directory / 'progress.json').read_text()) if (directory / 'progress.json').exists() else {}
stages = {'desktop-create', 'mobile-start', 'mobile-join', 'foreground-send',
          'foreground-receive', 'qss-storage-proof', 'onboarding-complete',
          'fresh-join-background', 'fresh-join-send', 'fresh-join-notification-tap',
          'named-channel-create', 'named-channel-sync', 'named-channel-background',
          'named-channel-send', 'named-channel-notification-tap', 'provider-complete'}
lane = os.environ['QUIET_NOTIFICATION_LANE']
report = {
    'platform': 'ios', 'lane': lane, 'testExitCode': int(os.environ['QUIET_NOTIFICATION_TEST_EXIT']),
    'onboardingPassed': proof.get('onboardingPassed') is True,
    'fullLoopPassed': proof.get('fullLoopPassed') is True,
    'completedNotificationJourneys': len(proof.get('notifications', [])),
    'lastStage': progress.get('stage') if progress.get('stage') in stages else 'preflight',
    'build': {key: value for key, value in proof.get('build', {}).items() if key in ['frontendSHA256', 'backendSHA256', 'nativeSHA256', 'extensionSHA256', 'backendMode']},
}
passed = report['testExitCode'] == 0 and (report['onboardingPassed'] if lane == 'onboarding' else report['fullLoopPassed'] and report['completedNotificationJourneys'] == 2)
report['status'] = 'passed' if passed else 'failed'
Path(os.environ['RUNNER_TEMP'], 'notification-ios-result.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
if not passed:
    raise SystemExit('The selected iOS Appium journey did not pass. No alternate lane was substituted.')
PY

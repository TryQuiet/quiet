#!/bin/bash
set -euo pipefail
quiet_checkout=$(cd "${1:?Usage: run.sh CHECKOUT NEW_OUTPUT}" && pwd -P)
quiet_output=${2:?Usage: run.sh CHECKOUT NEW_OUTPUT}
quiet_script="$quiet_checkout/packages/mobile/scripts/tor-regression"
[[ $(uname -s) == Darwin ]] || { echo 'Requires macOS and Xcode' >&2; exit 1; }
[[ ! -e "$quiet_output" ]] || { echo 'Use a new output directory for each run' >&2; exit 1; }
export BUNDLE_GEMFILE=${BUNDLE_GEMFILE:-$quiet_checkout/packages/mobile/Gemfile}
cd "$quiet_checkout/packages/mobile"
bundle exec ruby "$quiet_script/create-project.rb" "$quiet_checkout" "$quiet_output"
cd "$quiet_output"
quiet_output=$(pwd -P)
shasum -a 256 "$quiet_checkout/packages/mobile/ios/TorHandler.swift" \
  "$quiet_checkout/packages/mobile/ios/Extensions.swift" \
  "$quiet_checkout/packages/mobile/scripts/tor-pod-linkage.rb" \
  "$quiet_script/TorControlRegressionTests.swift" > source-sha256.txt
bundle exec pod install > pod-install.log 2>&1
quiet_simulator=$(xcrun simctl create Quiet-Tor-Regression \
  com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro \
  "${QUIET_TOR_SIMULATOR_RUNTIME:-com.apple.CoreSimulator.SimRuntime.iOS-18-5}")
[[ "$quiet_simulator" =~ ^[0-9A-Fa-f-]{36}$ ]]
cleanup() {
  xcrun simctl shutdown "$quiet_simulator" >/dev/null 2>&1 || true
  xcrun simctl delete "$quiet_simulator" >/dev/null 2>&1 || true
}
trap cleanup EXIT
printf '%s\n' "$quiet_simulator" > simulator-id
xcrun simctl boot "$quiet_simulator"
xcrun simctl bootstatus "$quiet_simulator" -b > simulator-boot.log 2>&1
# Change the linker version between builds to force a relink while the previous
# Tor.framework still exists. This reproduces the case-insensitive name collision.
xcodebuild build-for-testing -workspace Quiet.xcworkspace -scheme TorRegression \
  -destination "platform=iOS Simulator,id=$quiet_simulator" \
  -derivedDataPath "$quiet_output/DerivedData" -jobs 2 \
  CODE_SIGNING_ALLOWED=NO CURRENT_PROJECT_VERSION=1 > first-build.log 2>&1
xcodebuild test -workspace Quiet.xcworkspace -scheme TorRegression \
  -destination "platform=iOS Simulator,id=$quiet_simulator" \
  -derivedDataPath "$quiet_output/DerivedData" -resultBundlePath "$quiet_output/regression.xcresult" \
  -jobs 2 CODE_SIGNING_ALLOWED=NO CURRENT_PROJECT_VERSION=2 > regression.log 2>&1
echo "Native Tor regression passed; evidence: $quiet_output"

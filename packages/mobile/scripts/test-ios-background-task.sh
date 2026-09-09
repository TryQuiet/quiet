#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mobile_dir="$(cd "${script_dir}/.." && pwd)"
ios_dir="${mobile_dir}/ios"
developer_dir="$(xcode-select -p)"
xctest_frameworks="${developer_dir}/Platforms/MacOSX.platform/Developer/Library/Frameworks"
test_dir="$(mktemp -d /private/tmp/quiet-background-task-tests.XXXXXX)"
test_bundle="${test_dir}/QuietBackgroundTaskTests.xctest"

cleanup() {
  rm -rf "${test_dir}"
}
trap cleanup EXIT

mkdir -p "${test_bundle}/Contents/MacOS"

xcrun --sdk macosx clang \
  -fobjc-arc \
  -fmodules \
  -fmodules-cache-path="${test_dir}/ModuleCache" \
  -F"${xctest_frameworks}" \
  -framework Foundation \
  -framework XCTest \
  -bundle \
  -Wl,-bundle_loader,"${xctest_frameworks}/XCTest.framework/Versions/A/XCTest" \
  "${ios_dir}/QuietBackgroundTask.m" \
  "${ios_dir}/QuietTests/QuietBackgroundTaskTests.m" \
  -o "${test_bundle}/Contents/MacOS/QuietBackgroundTaskTests"

info_plist="${test_bundle}/Contents/Info.plist"
plutil -create xml1 "${info_plist}"
plutil -insert CFBundleExecutable -string QuietBackgroundTaskTests "${info_plist}"
plutil -insert CFBundleIdentifier -string com.quietmobile.QuietBackgroundTaskTests "${info_plist}"
plutil -insert CFBundleName -string QuietBackgroundTaskTests "${info_plist}"
plutil -insert CFBundlePackageType -string BNDL "${info_plist}"

xcrun xctest -XCTest QuietBackgroundTaskTests "${test_bundle}"

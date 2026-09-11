#!/bin/bash
set -euo pipefail
quiet_recipe_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
[[ $(uname -s) == Darwin ]] || { echo 'This recipe requires macOS with full Xcode.' >&2; exit 1; }
case "$quiet_recipe_dir" in *' '*) echo 'The pinned upstream make scripts require a source path without spaces.' >&2; exit 1 ;; esac
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode-26.3.0.app/Contents/Developer}"
export PATH="/opt/homebrew/bin:/opt/homebrew/opt/gettext/bin:/usr/local/bin:${PATH}"
export QUIET_TOR_BUILD_JOBS="${QUIET_TOR_BUILD_JOBS:-1}"
case "$QUIET_TOR_BUILD_JOBS" in 1|2) ;; *) echo 'QUIET_TOR_BUILD_JOBS must be 1 or 2.' >&2; exit 1 ;; esac
export MAKEFLAGS="-j${QUIET_TOR_BUILD_JOBS}"
export QUIET_TOR_SOURCE_COMMIT=8c50f3c74edd9a5cf57c02a7b13311e70ff64657
export SOURCE_DATE_EPOCH=1624017521
export LIBTOOLIZE=glibtoolize
unset CROSS_COMPILE CROSS_TOP CROSS_SDK CC CXX CPP CFLAGS CXXFLAGS CPPFLAGS LDFLAGS
for quiet_tool in xcodebuild xcrun autoconf automake autoreconf aclocal autoheader glibtoolize autopoint gettext perl make bc; do
    command -v "$quiet_tool" >/dev/null || { echo "Required tool is missing: $quiet_tool" >&2; exit 1; }
done
[[ -d "$DEVELOPER_DIR" ]] || { echo "Full Xcode is missing: $DEVELOPER_DIR" >&2; exit 1; }
quiet_sdk=$(xcrun --sdk iphonesimulator --show-sdk-path)
[[ -d "$quiet_sdk" ]] || { echo 'iOS Simulator SDK is unavailable.' >&2; exit 1; }
quiet_free_kib=$(df -k "$quiet_recipe_dir" | awk 'END {print $4}')
[[ "$quiet_free_kib" -ge 3145728 ]] || { echo 'At least 3 GiB free disk is required to start this bounded build.' >&2; exit 1; }
cd "$quiet_recipe_dir/Tor.framework"
# External build phases write only inside this isolated source tree and derived data.
# No command reads, replaces, or strips Quiet's shipped Tor.framework device binary.
xcodebuild -project Tor.xcodeproj -scheme Tor-iOS -configuration Release \
    -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath "$quiet_recipe_dir/build" -jobs "$QUIET_TOR_BUILD_JOBS" \
    ARCHS=arm64 ONLY_ACTIVE_ARCH=YES EXCLUDED_ARCHS= 'EXCLUDED_ARCHS[sdk=iphonesimulator*]=' \
    IPHONEOS_DEPLOYMENT_TARGET=17.1 \
    ENABLE_BITCODE=NO BITCODE_GENERATION_MODE= \
    CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY= \
    GCC_GENERATE_DEBUGGING_SYMBOLS=NO DEBUG_INFORMATION_FORMAT= \
    COMPILER_INDEX_STORE_ENABLE=NO CLANG_ENABLE_MODULE_DEBUGGING=NO \
    QUIET_TOR_BUILD_JOBS="$QUIET_TOR_BUILD_JOBS" \
    QUIET_TOR_SOURCE_COMMIT="$QUIET_TOR_SOURCE_COMMIT" SOURCE_DATE_EPOCH="$SOURCE_DATE_EPOCH" \
    build 2>&1 | tee "$quiet_recipe_dir/build-arm64-simulator.log"
quiet_framework="$quiet_recipe_dir/build/Build/Products/Release-iphonesimulator/Tor.framework"
[[ -f "$quiet_framework/Tor" ]] || { echo 'Expected framework was not produced.' >&2; exit 1; }
[[ $(xcrun lipo -archs "$quiet_framework/Tor") == arm64 ]] || { echo 'Unexpected framework architectures.' >&2; exit 1; }
xcrun vtool -show-build "$quiet_framework/Tor" | tee "$quiet_recipe_dir/build-platform.txt"
grep -q 'platform IOSSIMULATOR' "$quiet_recipe_dir/build-platform.txt" || { echo 'Framework is not marked iOS Simulator.' >&2; exit 1; }
[[ $(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$quiet_framework/Info.plist") == 405.9.1 ]] || { echo 'Framework version changed.' >&2; exit 1; }
xcrun otool -L "$quiet_framework/Tor"
shasum -a 256 "$quiet_framework/Tor"
echo "Built isolated pinned arm64 simulator framework: $quiet_framework"

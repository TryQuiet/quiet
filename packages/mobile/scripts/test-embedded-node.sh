#!/usr/bin/env bash
# Exercise the actual Android Node startup core with the pinned mobile runtime.
set -euo pipefail
quiet_device="${1:?Pass the serial of a dedicated Android test device}"
quiet_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
quiet_sdk="${ANDROID_SDK_ROOT:-${ANDROID_HOME:?Set ANDROID_HOME or ANDROID_SDK_ROOT}}"
quiet_ndk="${QUIET_ANDROID_NDK:-$quiet_sdk/ndk/28.2.13676358}"
quiet_adb="${ADB_PATH:-$quiet_sdk/platform-tools/adb}"
quiet_abi="$("$quiet_adb" -s "$quiet_device" shell getprop ro.product.cpu.abi | tr -d '\r')"
case "$quiet_abi" in
  x86_64) quiet_target=x86_64-linux-android ;;
  arm64-v8a) quiet_target=aarch64-linux-android ;;
  *) echo "Unsupported test ABI: $quiet_abi" >&2; exit 1 ;;
esac
quiet_app="$quiet_root/packages/mobile/android/app"
quiet_build="$quiet_root/packages/mobile/android/build/embedded-node-test/$quiet_abi"
quiet_toolchain="$quiet_ndk/toolchains/llvm/prebuilt/linux-x86_64"
mkdir -p "$quiet_build"
"$quiet_toolchain/bin/${quiet_target}24-clang++" -std=c++17 \
  -I "$quiet_app/libnode/include/node" -I "$quiet_app/src/main/cpp" \
  "$quiet_app/src/test/cpp/embedded-node.test.cpp" \
  -L "$quiet_app/libnode/bin/$quiet_abi" -lnode -o "$quiet_build/embedded-node-test"
quiet_remote=/data/local/tmp/quiet-embedded-node-test
"$quiet_adb" -s "$quiet_device" shell mkdir -p "$quiet_remote"
"$quiet_adb" -s "$quiet_device" push "$quiet_build/embedded-node-test" \
  "$quiet_app/libnode/bin/$quiet_abi/libnode.so" \
  "$quiet_toolchain/sysroot/usr/lib/$quiet_target/libc++_shared.so" "$quiet_remote/"
"$quiet_adb" -s "$quiet_device" shell "cd $quiet_remote && LD_LIBRARY_PATH=. ./embedded-node-test"

#!/usr/bin/env bash
# Build Linux-hosted x86_64 emulator dependencies at the production Node/Tor versions.
set -euo pipefail
quiet_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
quiet_build="$quiet_root/packages/mobile/android/build/emulator-native"
quiet_sdk="${ANDROID_SDK_ROOT:-${ANDROID_HOME:?Set ANDROID_HOME or ANDROID_SDK_ROOT}}"
quiet_ndk="${QUIET_ANDROID_NDK:-$quiet_sdk/ndk/28.2.13676358}"
quiet_toolchain="$quiet_ndk/toolchains/llvm/prebuilt/linux-x86_64/bin"
mkdir -p "$quiet_build"

download() {
  local url="$1" destination="$2" expected="$3"
  if ! test -f "$destination" || ! echo "$expected  $destination" | sha256sum --check --status; then
    curl --fail --location --retry 2 "$url" --output "$destination"
  fi
  echo "$expected  $destination" | sha256sum --check
}

download https://github.com/nodejs-mobile/nodejs-mobile/releases/download/v18.20.4/nodejs-mobile-v18.20.4-android.zip \
  "$quiet_build/node.zip" bd7321eaa1a7602fbe0bb87302df2d79d87835cf4363fbdd17c350dbb485c2af
download https://archive.torproject.org/tor-package-archive/torbrowser/15.0.21/tor-browser-android-x86_64-15.0.21.apk \
  "$quiet_build/tor.apk" 8fb0419c6b03931ac9c81cd4e006720a09150965598f8c32b8b53c0746b47fe2
curl --fail --location --retry 2 \
  https://archive.torproject.org/tor-package-archive/torbrowser/15.0.21/tor-browser-android-x86_64-15.0.21.apk.asc \
  --output "$quiet_build/tor.apk.asc"
mkdir -p "$quiet_build/gnupg"
chmod 700 "$quiet_build/gnupg"
gpg --homedir "$quiet_build/gnupg" --batch --import "$quiet_root/scripts/tor-signing-key.asc"
gpg --homedir "$quiet_build/gnupg" --batch --status-fd 1 --verify "$quiet_build/tor.apk.asc" "$quiet_build/tor.apk" \
  > "$quiet_build/signature-status.txt"
rg '^\[GNUPG:\] VALIDSIG .* EF6E286DDA85EA2A4BA7DE684E2C6E8793298290$' "$quiet_build/signature-status.txt"

mkdir -p "$quiet_root/packages/mobile/android/app/libnode/bin/x86_64" \
  "$quiet_root/packages/mobile/android/app/src/main/jniLibs/x86_64"
unzip -p "$quiet_build/node.zip" bin/x86_64/libnode.so \
  > "$quiet_root/packages/mobile/android/app/libnode/bin/x86_64/libnode.so"
unzip -p "$quiet_build/tor.apk" lib/x86_64/libTor.so \
  > "$quiet_root/packages/mobile/android/app/src/main/jniLibs/x86_64/libtor.so"

cd "$quiet_root/packages/backend"
quiet_classic="$(node -p "require('path').dirname(require.resolve('classic-level',{paths:[require.resolve('level')]}))")"
# Copy the pinned dependency before cross-compiling; keep desktop's installed binding intact.
mkdir -p "$quiet_build/classic-level"
cp -a "$quiet_classic/." "$quiet_build/classic-level/"
env NODE_PATH="$quiet_root/node_modules:$(dirname "$quiet_classic")" \
  CC="$quiet_toolchain/x86_64-linux-android28-clang" \
  CXX="$quiet_toolchain/x86_64-linux-android28-clang++" AR="$quiet_toolchain/llvm-ar" \
  LDFLAGS="-L$quiet_root/packages/mobile/android/app/libnode/bin/x86_64 -Wl,--no-as-needed -lnode" \
  "$quiet_root/node_modules/.bin/node-gyp" rebuild --directory="$quiet_build/classic-level" \
  --arch=x64 --OS=android --nodedir="$quiet_root/packages/mobile/android/app/libnode" \
  --android_ndk_path="$quiet_ndk"
mkdir -p "$quiet_root/packages/mobile/nodejs-assets/deps/android/x64/classic-level"
cp "$quiet_build/classic-level/build/Release/classic_level.node" \
  "$quiet_root/packages/mobile/nodejs-assets/deps/android/x64/classic-level/classic_level.node"

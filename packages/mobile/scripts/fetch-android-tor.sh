#!/bin/bash
# Fetch Quiet's Android Tor binary for one extra ABI from a GPG-verified Tor Browser APK.
#
# The vendored arm64-v8a libtor.so is refreshed together with the desktop binaries by
# scripts/update-tor-binaries-desktop.sh at the repository root. This script installs
# only android/app/src/main/jniLibs/<abi>/libtor.so for an emulator ABI (x86_64), which
# is not committed. See docs/android-x86_64-emulator.md.
#
# Usage: scripts/fetch-android-tor.sh [--abi x86_64] [--version 15.0.22] [--cache DIR]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$MOBILE_ROOT/../.." && pwd)"
TOR_GPG_KEY_FILE="$REPO_ROOT/scripts/tor-signing-key.asc"
TOR_GPG_FINGERPRINT="EF6E286DDA85EA2A4BA7DE684E2C6E8793298290"
# Releases leave dist.torproject.org as new builds ship. The official archive
# retains the pinned APK and its detached signature for repeatable checkouts.
TOR_PROJECT_BASE_URL="https://archive.torproject.org/tor-package-archive/torbrowser"

ABI="x86_64"
# Tor Browser 15.0.22 ships Tor 0.4.9.12. The vendored arm64-v8a binary came from
# 15.0.21 (Tor 0.4.9.11), which dist.torproject.org no longer serves.
VERSION="15.0.22"
CACHE="${TMPDIR:-/tmp}/quiet-tor-downloads"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --abi) ABI="$2"; shift 2 ;;
        --version) VERSION="$2"; shift 2 ;;
        --cache) CACHE="$2"; shift 2 ;;
        -h|--help) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
done

case "$ABI" in
    x86_64) APK_ARCH="x86_64" ;;
    *) echo "Unsupported ABI: $ABI (only x86_64; arm64-v8a is vendored by update-tor-binaries-desktop.sh)" >&2; exit 1 ;;
esac
for tool in curl gpg unzip readelf; do
    command -v "$tool" >/dev/null 2>&1 || { echo "$tool is required" >&2; exit 1; }
done

APK="tor-browser-android-${APK_ARCH}-${VERSION}.apk"
mkdir -p "$CACHE"
for file in "$APK" "$APK.asc"; do
    if [[ ! -s "$CACHE/$file" ]]; then
        echo "Downloading $file"
        curl -fL --retry 3 -o "$CACHE/$file.part" "$TOR_PROJECT_BASE_URL/$VERSION/$file"
        mv "$CACHE/$file.part" "$CACHE/$file"
    fi
done

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export GNUPGHOME="$WORK/gnupg"
mkdir -p "$GNUPGHOME"
chmod 700 "$GNUPGHOME"
gpg --batch --quiet --import "$TOR_GPG_KEY_FILE"
fingerprint="$(gpg --batch --list-keys --with-colons | awk -F: '$1 == "fpr" { print $10; exit }')"
if [[ "$fingerprint" != "$TOR_GPG_FINGERPRINT" ]]; then
    echo "Unexpected Tor signing key fingerprint: $fingerprint" >&2
    exit 1
fi
if ! gpg --batch --quiet --verify "$CACHE/$APK.asc" "$CACHE/$APK" 2>/dev/null; then
    echo "GPG signature verification failed for $APK (remove it from $CACHE and retry)" >&2
    exit 1
fi
echo "Signature verified for $APK"

unzip -q -o "$CACHE/$APK" "lib/$ABI/libTor.so" -d "$WORK/apk"
LIB="$WORK/apk/lib/$ABI/libTor.so"
# Same 16 KB page-alignment bar as the arm64 update script.
for align in $(readelf -lW "$LIB" | awk '$1 == "LOAD" { print $NF }'); do
    if (( align < 16384 )); then
        echo "libTor.so LOAD segment alignment $align is below 16 KB" >&2
        exit 1
    fi
done

TARGET_DIR="$MOBILE_ROOT/android/app/src/main/jniLibs/$ABI"
mkdir -p "$TARGET_DIR"
install -m 0755 "$LIB" "$TARGET_DIR/libtor.so"
# grep -m1 closes the pipe early; with pipefail that would fail the assignment.
tor_version="$(strings "$LIB" | grep -m1 -E '^tor [0-9.]+$' || true)"
[[ -n "$tor_version" ]] || tor_version='tor (version string not found)'
echo "Installed $TARGET_DIR/libtor.so: $tor_version, sha256 $(sha256sum "$LIB" | cut -d' ' -f1)"

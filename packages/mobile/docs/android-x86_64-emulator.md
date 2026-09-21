# Android x86_64 emulator build

The shipped APK is arm64-v8a only. An x86_64 emulator installs it (the Google
APIs images translate arm64), the React Native UI renders, but the embedded
Node backend stalls right after Nest's CommonModule init under translation and
the app never leaves "Starting backend". Building the app for x86_64 removes the
translation. Three inputs exist only for arm64 in git; fetch or build them once
per checkout (none of the x86_64 outputs is committed, see `.gitignore`):

| Input | arm64-v8a (vendored) | x86_64 (per checkout) |
| --- | --- | --- |
| Node runtime `android/app/libnode/bin/<abi>/libnode.so` | `scripts/nodejs-mobile-runtime/install.py`, pinned nodejs-mobile 24.18.0-0 | `python3 scripts/nodejs-mobile-runtime/install.py --install --abi x86_64` (same pinned archive; file hash under `optionalAndroidAbis` in `runtime.json`) |
| LevelDB addon `nodejs-assets/deps/android/<process.arch>/classic-level/classic_level.node` | nodejs-mobile-gyp build, `docs/building-classic-level-android.md` (`arm64/`) | `node scripts/build-classic-level-android.cjs` (NDK 28 clang, the pinned classic-level 1.4.1 and napi-macros 2.2.2 sources, `x64/`) |
| Tor `android/app/src/main/jniLibs/<abi>/libtor.so` | `scripts/update-tor-binaries-desktop.sh` at the repository root (Tor Browser aarch64 APK) | `scripts/fetch-android-tor.sh` (GPG-verified Tor Browser x86_64 APK) |

`npm run prepare-android-x86_64` runs the three steps. They need Python 3.9+,
the NDK from `android/build.gradle` (`ANDROID_NDK_HOME`, `NDK_PATH`,
`ANDROID_HOME/ndk/<version>` or `--ndk`), `curl`, `gpg`, `unzip` and `readelf`.
Then build with the ABI property that `android/gradle.properties` documents:

```sh
cd packages/mobile/android
ENVFILE=../.env.development ./gradlew assembleStandardDebug -PreactNativeArchitectures=x86_64
```

`app/build/outputs/apk/standard/debug/app-standard-debug.apk` then carries only
x86_64 libraries and the `x64` addon slice (`-PreactNativeArchitectures=arm64-v8a,x86_64`
gives a universal APK). `abiFilters`, the `libc++_shared.so` `pickFirsts` and
the addon asset copy all follow `reactNativeArchitectures`, so the default
arm64-v8a build is unchanged and never picks up the x86_64 files.

## Emulator

Any API 35/36 `google_apis` x86_64 image works; the package manager selects the
x86_64 libraries because `SUPPORTED_ABIS[0]` is `x86_64`. Headless:

```sh
emulator -avd <name> -no-window -no-audio -gpu swiftshader_indirect
adb install -r app/build/outputs/apk/standard/debug/app-standard-debug.apk
adb logcat -s NODEJS-MOBILE BackendWorker ReactNativeJS
```

The backend is up when logcat shows the Nest modules initialising, Tor (or the
`LOCAL_TRANSPORT` path) starting, and the app's websocket connecting.

## Notes

- The Tor Browser x86_64 APK is 15.0.22 (Tor 0.4.9.12); the vendored arm64
  binary is Tor 0.4.9.11 from 15.0.21, which dist.torproject.org no longer
  serves. Both are 16 KB page aligned.
- The x86_64 `libnode.so` is unstripped in the archive (85 MB); Gradle strips
  it at packaging, as it does for arm64.
- The addon is built with the vendored Android Node headers and links against
  the x86_64 `libnode.so`, so install the runtime slice first.

## Develop integration validation — 2026-09-21

The five architecture commits are extracted from #3515 without its unrelated UI
branch. The pinned Tor APK/signature now come from the official Tor archive;
the real signed download passes and a tampered-cache regression rejects it before
installation. The Node installer passes seven tests, and the actual NDK builds the
x64 LevelDB addon from pinned source.

The x86_64 standard debug/instrumentation APKs build. All 24 ELF payloads and APK
ZIP satisfy 16 KB alignment. The actual embedded Node signal-handler regression
passes on both API 35 and 36 (the standalone compiler now uses Node 24's required
C++20). Community creation, backend-acknowledged message storage and process-restart
recovery pass on both APIs; all 25 starter cases pass on API 36 after updating the
current UI selectors. These are emulator checks, not physical-device evidence.

The default ARM build was then rebuilt with optional x86_64 inputs still present.
It exposed a stale addon left by Gradle's Copy task. Asset staging now uses Sync
and records the requested architectures as a task input. An actual Gradle
regression switches x86_64 → universal → default ARM, verifies stale slices and
file-list entries disappear, and retains the backend bundle. The final default
APK has only its 24 ARM native payloads.

Reproduce the added checks from `packages/mobile`:

```sh
node --test scripts/android-abi-assets.test.cjs
QUIET_TOR_TEST_CACHE="${TMPDIR:-/tmp}/quiet-tor-downloads" node --test scripts/fetch-android-tor.test.cjs
ANDROID_HOME=/path/to/sdk bash scripts/test-embedded-node.sh <owned-device-serial>
```

After Electron/host Node 24 landed, rebuilt the shared backend and x86_64 APKs
on Node 24.21.0. All 15 Metro/CLI/Promise/Screens checks and the actual API 36
community/message/restart test pass again with those final inputs.

# React Native migration for Android 16

This work builds on the API 36 intermediate in [PR #3420](https://github.com/TryQuiet/quiet/pull/3420)
and continues [issue #3013](https://github.com/TryQuiet/quiet/issues/3013).

## Plan

1. Upgrade RN 0.77.3 to 0.78.3 and React 18 to 19. Fix typing, test, and native
   integration failures; establish a working Android checkpoint.
2. Continue through RN 0.79.7 and 0.80.2 to 0.81.5, keeping matching React,
   renderer, CLI, Babel/Metro, and native-module versions at each step.
3. Evaluate Hermes for the UI while retaining the existing native bridge and
   embedded Node runtime. Community JSC requires the new architecture; using it
   would add an architecture migration to this work.
4. Run mobile unit tests, TypeScript/lint, real Android builds, packaged native
   alignment checks, and focused device regressions on API 35 and 36. Attempt
   full backend startup separately and report any emulator limitations.
5. Update iOS integration and record the Xcode/device validation required on a
   Mac. Local Linux builds do not establish that iOS works.
6. Commit each validated milestone on the same worktree branch before handoff
   or review, and publish a separate migration PR when reviewable.

## Existing work and runtime boundaries

- [PR #3245](https://github.com/TryQuiet/quiet/pull/3245) is an open Android Gradle
  cleanup draft. It retains RN 0.77.3; use relevant changes as references rather
  than coupling this migration to its full build-file rewrite.
- [PR #3113](https://github.com/TryQuiet/quiet/pull/3113) already upgraded host Node
  to 20.20.1, satisfying RN 0.81's minimum of 20.19.4. See the
  [RN 0.81 requirements](https://reactnative.dev/blog/2025/08/12/react-native-0.81).
- Android [PR #2988](https://github.com/TryQuiet/quiet/pull/2988) and iOS
  [PR #3021](https://github.com/TryQuiet/quiet/pull/3021) already moved the embedded
  backend to nodejs-mobile 18.20.4. It is separate from the UI's JSC/Hermes engine
  and the Node process running Metro and build tools.
- The embedded bridge calls Node through JNI/Objective-C and communicates with
  React Native using native methods/events; it does not couple Node's V8 to JSI.
  No embedded Node upgrade is required by RN's package requirements. Retain it
  initially and verify startup and addon loading rather than assuming success.
- Upstream's [Node 24 work](https://github.com/nodejs-mobile/nodejs-mobile/pull/158)
  remains an open PR. An embedded runtime upgrade needs its own matching headers,
  bridge/addon checks, storage tests, and Android/iOS lifecycle validation.
- RN 0.81 removes bundled JSC. The community package documents a new-architecture
  requirement: [JSC installation](https://github.com/react-native-community/javascriptcore#installation).

## RN 0.78.3 checkpoint

- React/renderer 19.0.0, Navigation 7, Screens 4.13.1, TypeScript 5.8.3,
  and matching RN tooling. Android uses Hermes; the old architecture remains.
- Preserve the existing navigation helper's return-to-screen behavior with
  Navigation 7's explicit `pop` option. Independent Storybook containers use
  `NavigationIndependentTree`.
- Let each PKI.js installation create its own engine from WebCrypto instead of
  passing an engine between package versions. This also avoids stale PKI.js
  engine declarations conflicting with TypeScript's newer WebCrypto types.
- Remove the unused document-picker dependency and unreachable callbacks: the
  production paperclip opens the photo picker. The old native document module
  depended on `GuardedResultAsyncTask`, removed in RN 0.78.
- Add the missing iOS dependency provider and remove an obsolete patch targeting
  the no-longer-used unscoped Gradle plugin.

Validation on this checkpoint:

- Mobile TypeScript and ESLint pass (12 existing warnings).
- 53 mobile suites / 133 tests / 44 snapshots pass; 3 suites/tests remain skipped.
  New coverage checks actual navigation history, certificate/signature operations,
  and the production photo attachment flow through Redux.
- Seven focused identity certificate/signature tests pass.
- Storybook debug APK and AndroidTest APK build with Hermes.
- Three native API 36 regressions pass: keyboard/channel Back handling, modal
  dismissal, and channel/modal rotation with draft preservation.
- This checkpoint does not establish full backend startup or iOS compatibility.

## iOS validation

The app and notification extension compile successfully for an arm64 iOS device
on macOS 26.4.1 with Xcode 26.3 (iOS SDK 26.2), Node 20.20.1, Ruby 3.3.12,
Bundler 2.6.9, and CocoaPods 1.16.2. This is an unsigned Debug compatibility
build with an empty, temporary Firebase plist; signing, push delivery, and
device runtime behavior are not established by compilation.

The notification extension's Debug and Release deployment targets now match
the app's iOS 17.1 minimum instead of requiring 26.2. Its source APIs support
17.1. A separate arm64 device rebuild verifies both the generated plist and
Mach-O minimum; the app and extension also compile for an arm64 simulator at
17.1. This does not validate push delivery without real Firebase configuration.

The regenerated CocoaPods lockfile contains RN/Hermes 0.81.5 and the matching
native library versions. Firebase, Tor, Sodium, and unrelated pod versions
remain unchanged. RN's new post-install plist scan tried to read and rewrite
vendored binary framework metadata, failing with an invalid UTF-8 error.
`scripts/react-native-app-plists.rb` scopes that hook to application targets'
declared plists. Four Mac tests (32 assertions) verify architecture flags,
configuration paths, idempotence, missing-file errors, and byte-for-byte
preservation of the actual NodeMobile/classic-level binary plists.

From `packages/mobile`, with the toolchain above selected:

```sh
bundle install
bundle exec ruby scripts/react-native-app-plists.test.rb
cd ios
bundle exec pod install --deployment
ENVFILE=.env.staging RCT_NO_LAUNCH_PACKAGER=1 xcodebuild build \
  -workspace Quiet.xcworkspace -scheme Quiet -configuration Debug \
  -destination 'generic/platform=iOS' -derivedDataPath build/compatibility \
  -jobs 2 CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY= \
  ENABLE_BITCODE=NO ARCHS=arm64 ONLY_ACTIVE_ARCH=YES \
  COMPILER_INDEX_STORE_ENABLE=NO GCC_GENERATE_DEBUGGING_SYMBOLS=NO DEBUG_INFORMATION_FORMAT=
```

The project copies `ios/GoogleService-Info.plist`; supply development configuration
or an empty temporary plist for this unsigned compilation check. Disabling debug
symbols and indexing limits build storage on a development laptop.

The proposed [`Mobile iOS compatibility` workflow](mobile-ios-compatibility.yml.example)
checks plist handling, resolves changed pods, uploads the lockfile, and compiles
the app plus notification extension for a generic iOS device without signing
or deployment. GitHub rejected publication under `.github/workflows` because
the current token lacks `workflow` permission; enable it by moving the reviewed
example into `.github/workflows/mobile-ios-compatibility.yml` once access is available.
The native build above was run directly on a Mac.

The project now links `classic-level/classic-level.xcframework`, which retains
the original arm64 device framework and adds arm64/x86_64 simulator slices. The
[build script](../scripts/README_classic_level_ios.md) uses pinned classic-level
1.4.1 sources and Node 18.20.4 headers. Platform/export checks pass, and the
integrated device app rebuild succeeds with the original addon binary unchanged.
The real Node 18.20.4 host addon test covers compressed writes, reads, ordered
iteration, close/reopen persistence, and the existing Quiet loader override.

The Intel Storybook simulator app also compiles successfully, including a
bundled Hermes payload with `FORCE_BUNDLING=1`. Storybook selects its own native
environment, and the real Hermes/WebView crypto smoke test supports iOS.
The default Tor 405.9.1 pod has only an x86_64 simulator slice. The optional
source build below supplies an arm64 simulator framework without upgrading Tor
or changing the default pod used for subsequent device builds.

From `packages/mobile`, build without a running Metro server:

```sh
FORCE_BUNDLING=1 ENVFILE=.env.storybook RCT_NO_LAUNCH_PACKAGER=1 xcodebuild build \
  -workspace ios/Quiet.xcworkspace -scheme Storybook -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ios/build/storybook -jobs 2 ARCHS=x86_64 ONLY_ACTIVE_ARCH=YES \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY= \
  ENABLE_BITCODE=NO COMPILER_INDEX_STORE_ENABLE=NO \
  GCC_GENERATE_DEBUGGING_SYMBOLS=NO DEBUG_INFORMATION_FORMAT=
```

Earlier x86_64 iOS 18.5 and arm64 iOS 26 simulator attempts encountered Apple
service crashes or exhausted disk headroom on the 8 GB validation Mac. Those
attempts stopped before installing Quiet. A native arm64 iOS 18.5 simulator
subsequently booted and ran the app and database fixture successfully, as
recorded below.

For Apple Silicon, the optional [pinned Tor simulator recipe](../scripts/tor-ios-simulator/README.md)
builds Tor.framework 405.9.1 from its exact Tor 0.4.5.9, OpenSSL 1.1.1k,
libevent 2.1.12, and xz 5.2.5 sources. Build fixes address simulator targeting,
archive indexes, dependency detection, and obsolete bitcode flags. Its public
headers match the existing pod. The source preparer verifies all downloads and
the patch before creating an isolated source tree.

The guarded opt-in Storybook builder temporarily selects that simulator framework,
compiles an arm64 app with bundled Hermes without provisioning, applies a local
ad hoc app signature for simulator installation, and restores the complete
original Tor pod with hash verification. This app build passed, including matching
embedded Tor bytes and simulator platform checks for NodeMobile, classic-level,
Hermes, the app, and its extension. The recipe does not change the default pod,
shipped Tor device binaries, or embedded Node version. Filesystem and
child-process tests cover restoration on success, failure, interruption, and low
disk space.

On 2026-09-09 UTC, the
[embedded Node database fixture](../e2e/fixtures/README_embedded_node_database.md)
passed inside that arm64 app on the native iOS 18.5 simulator. Run
`rn081-20260909-045947-aad2cb4d` used the actual native RN bridge, Quiet's existing
preload/path mapping, and classic-level with Node 18.20.4 (`platform: ios`,
`architecture: arm64`, module ABI 108, Node-API 9). Two different app processes
passed: eight synchronous writes on the first launch, zero writes after restart,
and sixteen exact reads on each launch. Each launch also verified forward and
reverse iteration, missing-key behavior, compressed persistent tables, and two
open/close cycles. The runner restored the original app and verified its backend
bundle remained unchanged.

Storybook renders on the native arm64 iOS 18.5 simulator; the Hermes/WebView UI
crypto checks remain in progress. The database fixture substitutes only the
Node entry point in a separate app copy and does not run the production backend.
Its success establishes native bridge/addon loading and storage persistence on
this simulator, without establishing Tor network bootstrap, community creation,
messaging, or physical-device runtime behavior.

## RN 0.79.7 checkpoint

- Upgrade matching RN tooling and CLI 18, Screens 4.15.4, and Gesture Handler
  2.26.0. Remove the obsolete `native_modules.gradle` invocation; autolinking
  already uses the React settings plugin and app plugin.
- Keep Storybook's React DOM dependency aligned with React 19 using the same
  override approach as its React dependency; its declared peer range stops at
  React 18. Native runtime checks use the final RN 0.81 checkpoint below.
- Mobile TypeScript and the Storybook Android app/instrumentation builds pass.

## RN 0.81.5 Android checkpoint

The final dependency set uses React/renderer 19.1.0, RN tooling 0.81.5, CLI
20.1.2, Screens 4.18.0, Gesture Handler 2.28.0, and Kotlin 2.1.20. Hermes
runs the UI while nodejs-mobile 18.20.4 continues to run the backend. Both
platforms retain the existing native bridge architecture.

- Use RN's application entry point and Screens' fragment restoration factory;
  pass Android's saved instance state to the recreated Activity. Remove the
  temporary API 36 Back opt-out because RN 0.81 bridges Android's dispatcher.
- RN 0.79 introduced `HTMLElement` without a browser `document`. Upgrade
  styled-components to 6.1.19 and use its native ThemeProvider. Scope Metro's
  Emotion 10 resolution to bundles that correctly check for `document`.
- Scope Redux Saga resolution to its working CommonJS entries. Its Node ESM
  proxy otherwise unwraps the default export twice under Metro, leaving
  `createSagaMiddleware` undefined. Package exports remain enabled elsewhere.
- Pin Navigation's elements package to the version compatible with the chosen
  Navigation 7 packages. Align Storybook's React DOM override with React 19.
- Use CLI 20.1.2 for its supported XML parser 5.x adoption (locked to 5.11.1),
  and override styled-components' PostCSS to 8.5.23. These remove newly
  introduced advisories reported by dependency review. Actual Android launcher,
  iOS scheme, plist, and entitlement parsing are covered by CLI regression tests.
- Upgrade Detox to 20.51.4 and use the same version for its Android dependency;
  the previous native test runner crashed while registering its network monitor.
- Preserve the native event emitter's real JavaScript subscription behavior in
  tests. Reviewed snapshot changes flatten styled-components' style arrays and
  expand equal border radii without changing rendered values.
- Raise Gradle's metaspace limit from 512 MB to 1 GB after release lint
  exhausted class-metadata space with the upgraded Kotlin/native dependencies.
- Let Android's existing `adjustResize` control the composer's flex layout.
  KeyboardAvoidingView's cached height could exceed the resized channel after
  Activity recreation and hide the input. Retain keyboard padding on iOS.

Validation on this checkpoint:

| Check | Result |
| --- | --- |
| Mobile TypeScript and ESLint | Pass; 12 existing lint warnings |
| Mobile Jest | 55 suites, 136 tests, 44 snapshots pass; 3 existing skips |
| Real Metro/package execution and CLI XML configuration | 12 tests pass; also run by `npm test` |
| Standard and Storybook debug app + instrumentation APKs | Build successfully |
| Standard release AAB | Builds with release lint; temporary test Firebase configuration and local debug signing |
| APK target and native alignment | API 36; 19 ELF files pass 16 KB LOAD alignment; APK ZIP alignment passes |
| Hermes + real WebView hashing/key/signature/tamper checks | Pass on API 35 and 36 |
| Native keyboard/channel Back, modal Back, and rotation | Pass on API 35 and 36 |
| Real photo selection, cache copy, thumbnail/removal, and cancellation | Pass on API 35 and 36 |
| Actual edge gestures for keyboard/channel/modal Back | Pass on API 35 and 36 |
| Activity recreation with native fragments and saved state | Pass on API 35 and 36, including full composer visibility |
| Full embedded backend/community startup | Node/bridge/addon/socket startup works; Tor child spawn deadlocks on the emulator |
| iOS CocoaPods and plist regression checks | Pass; RN/Hermes 0.81.5, 4 tests / 32 assertions |
| iOS arm64 app and notification extension | Unsigned Debug build passes with Xcode 26.3 |
| iOS arm64 simulator embedded Node database | Pass on iOS 18.5; native bridge/addon, compressed storage and app-process restart |
| iOS UI crypto / full backend runtime | UI checks in progress; Tor bootstrap/community behavior and physical-device runtime remain unverified |

The release packaging check uses a temporary, nonproduction Firebase configuration
and the repository's local debug signing fallback; the fixture is removed afterward.
This checks compilation and packaging, not production push delivery or store
release credentials.

The device fixtures use production channel, navigation, photo, and image-preview
components, with a local Redux store and no backend sagas. The crypto fixture
mounts the actual WebView provider and checks a known SHA-256 vector, P-256 key
export/import, signature verification, and rejection of modified data. These
checks do not establish full community startup or messaging.

### Embedded backend validation limit

The standard RN 0.81 app loads `libnode.so` and `classic_level.node`, receives
native bridge events, starts Nest on port 11001, and connects the frontend.
Tor password generation and stale-process cleanup complete. The subsequent
Tor spawn blocks before executing the child: Node waits on libuv's close-on-exec
error pipe while the forked child retains the app's name/mappings and waits on
a futex with the pipe's write end still open. A JavaScript timeout or switching
to asynchronous spawn cannot unblock that native wait.

These tests run an ARM64 APK through translation on x86_64 Android emulators.
A fork/translation interaction is a hypothesis; the exact lock owner is not
established. Pre-migration SDK checks also stalled during Tor child creation.
Android database operations, full Tor bootstrap, and community messaging still
require validation on an ARM64 Android device. The separate iOS database pass
above does not resolve this Android child-process limitation. No embedded Node
upgrade is justified solely by this result.

Reproduce from `packages/mobile` with the repository's Node version, Android SDK,
and JDK 17 available:

```sh
npm run build
npm run lint-ci
npm test -- --runInBand --watch=false
cd android
ENVFILE=../.env.storybook ./gradlew :app:assembleStorybookDebug :app:assembleStorybookDebugAndroidTest -DtestBuildType=debug
cd ..
npx detox test runtime-compatibility android-compatibility android-photo-picker activity-recreation android-gesture-back -c android.att.storybook --device-name emulator-5580
```

Use a separate emulator serial and artifact directory for concurrent API 35/36
runs. The edge-gesture test requires gesture navigation and does not change the
device's settings. Build the standard `.env.e2e` flavor in a separate Gradle
invocation before running the full `starter` test; dotenv configuration is shared
within an invocation.

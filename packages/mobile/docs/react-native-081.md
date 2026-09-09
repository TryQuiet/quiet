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

The proposed [`Mobile iOS compatibility` workflow](mobile-ios-compatibility.yml.example)
resolves changed pods, uploads the resulting lockfile for review, and compiles
the app plus notification extension for a generic iOS device without signing
or deployment. GitHub rejected publication under `.github/workflows` because
the current token lacks `workflow` permission; enable it by moving the reviewed
example into `.github/workflows/mobile-ios-compatibility.yml` once access is available. Commit the generated
lockfile after reviewing it. Until that run succeeds, the checked-in RN 0.77
CocoaPods lockfile is an outstanding migration item.

The vendored `classic-level.framework` currently contains only an arm64 iPhone
(device) binary. Node's XCFramework has simulator slices, but the database addon
needs a simulator build before a complete simulator run is possible. An unsigned
device compilation checks integration; it does not prove runtime behavior.

## RN 0.79.7 checkpoint

- Upgrade matching RN tooling and CLI 18, Screens 4.15.4, and Gesture Handler
  2.26.0. Remove the obsolete `native_modules.gradle` invocation; autolinking
  already uses the React settings plugin and app plugin.
- Keep Storybook's React DOM dependency aligned with React 19 using the same
  override approach as its React dependency; its declared peer range stops at
  React 18, although the native Storybook UI passes the device regressions.
- Mobile TypeScript and the Storybook Android app/instrumentation builds pass.

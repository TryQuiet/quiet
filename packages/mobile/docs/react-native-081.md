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
  React 18. Native runtime checks use the final RN 0.81 checkpoint below.
- Mobile TypeScript and the Storybook Android app/instrumentation builds pass.

## RN 0.81.5 Android checkpoint

The final dependency set uses React/renderer 19.1.0, RN tooling 0.81.5, CLI
20.0.0, Screens 4.18.0, Gesture Handler 2.28.0, and Kotlin 2.1.20. Hermes
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
- Upgrade Detox to 20.51.4 and use the same version for its Android dependency;
  the previous native test runner crashed while registering its network monitor.
- Preserve the native event emitter's real JavaScript subscription behavior in
  tests. Reviewed snapshot changes flatten styled-components' style arrays and
  expand equal border radii without changing rendered values.

Validation on this checkpoint:

| Check | Result |
| --- | --- |
| Mobile TypeScript and ESLint | Pass; 12 existing lint warnings |
| Mobile Jest | 55 suites, 136 tests, 44 snapshots pass; 3 existing skips |
| Real Metro resolution/package execution | 9 tests pass; also run by `npm test` |
| Standard and Storybook debug app + instrumentation APKs | Build successfully |
| APK target and native alignment | API 36; 19 ELF files pass 16 KB LOAD alignment; APK ZIP alignment passes |
| Hermes + real WebView hashing/key/signature/tamper checks | Pass on API 35 and 36 |
| Native keyboard/channel Back, modal Back, and rotation | Pass on API 35 and 36 |
| Real photo selection, cache copy, thumbnail/removal, and cancellation | Pass on API 35 and 36 |
| Actual edge gestures for keyboard/channel/modal Back | Pass on API 36; API 35 rerun pending |
| Activity recreation with native fragments and saved state | Pass on API 36; API 35 composer layout investigation pending |
| Full embedded backend/community startup | Investigation in progress; local backend socket connects |
| iOS CocoaPods/Xcode/runtime | Pending; see iOS validation above |

The device fixtures use production channel, navigation, photo, and image-preview
components, with a local Redux store and no backend sagas. The crypto fixture
mounts the actual WebView provider and checks a known SHA-256 vector, P-256 key
export/import, signature verification, and rejection of modified data. These
checks do not establish full community startup or messaging.

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

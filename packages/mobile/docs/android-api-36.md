# Android 16 / API 36 migration (issue #3013)

This document records the SDK-only intermediate in PR #3420. On the React Native
migration branch, [the RN 0.81 notes](react-native-081.md) describe the newer
runtime, removal of the Back opt-out, and additional validation.

## Plan

Deliver the Android SDK intermediate update before the React Native migration:

1. Compile and target API 36 with build tools 36.0.0, keeping React Native 0.77.3,
   React 18.3.1, and the current Node/Gradle/NDK versions.
2. Preserve legacy Back dispatch while RN still uses `onBackPressed`. Keep the
   existing root safe-area handling and measure native modal insets inside the
   modal's own window.
3. Build standard debug and release artifacts, inspect their final manifests,
   and run focused regression tests. Exercise the device matrix below before
   publishing.
4. Track the RN/React upgrade and full Android 16 behavior review separately.
   An SDK bump alone does not close all of issue #3013.

Google Play requires API 36 for new apps and updates from August 31, 2026, with
an extension to November 1, 2026 available through Play Console. See the
[target API policy](https://developer.android.com/google/play/requirements/target-sdk).
The repository already uses AGP 8.13.2 and Node 20.20.1; the issue's original
toolchain prerequisites are partly complete. The validation results below do
not constitute a claim that RN 0.77 officially supports Android 16.

## Compatibility decisions

- Use Android's documented `enableOnBackInvokedCallback="false"` migration
  option while RN 0.77 and Quiet's channel navigation use legacy Back callbacks.
  Revisit this with the RN upgrade and test gesture/button Back before removing
  it. See [predictive Back](https://developer.android.com/about/versions/16/behavior-changes-16#predictive-back).
- Edge-to-edge cannot be disabled on Android 16 when targeting API 36. Quiet
  already uses `react-native-safe-area-context` at the app root; native modals
  need their own provider. See [edge-to-edge](https://developer.android.com/about/versions/16/behavior-changes-16#edge-to-edge)
  and [modal providers](https://appandflow.github.io/react-native-safe-area-context/api/safe-area-provider/).
- There are no manifest orientation or resizability restrictions to opt out of.
  Landscape device checks exposed a width-sized image preview extending below
  the window. The preview now uses the available space below its header and
  scales the image with `contain` to preserve its proportions.
- Android 16 local-network permission restrictions are opt-in, so this step
  does not add a permission. See [local-network protection](https://developer.android.com/privacy-and-security/local-network-permission).
- Android 16 also changes WorkManager quotas for all apps. Quiet's long-running
  backend worker needs background/recovery testing independently of the target
  SDK and RN upgrade. See [long-running workers](https://developer.android.com/develop/background-work/background-tasks/persistent/how-to/long-running).

## Release validation

Build with the repository's Node version, JDK 17, Android platform 36, build
tools 36.0.0, and NDK 28.2.13676358:

```sh
cd packages/mobile/android
./gradlew :app:assembleStandardDebug
ENVFILE=../.env.production ./gradlew :app:bundleStandardRelease
```

Keep these as separate Gradle invocations: dotenv selection is shared across
tasks in one invocation, so the release task can inherit the debug environment.

Use release signing/environment configuration from the normal release workflow
for a store upload. Local release builds can use the existing debug signing
fallback and are not store releases.

On API 36 and API 35, verify:

- Cold start, create/join community, open channel, send/receive messages.
- Button and gesture Back: channel to channel list, nested screen navigation,
  image-preview dismissal, keyboard dismissal, and root exit/reopen.
- Onboarding, chat composer, menus, CAPTCHA, and image preview stay clear of
  status/navigation bars and cutouts with the keyboard open and closed. Check
  both gesture and three-button navigation.
- Rotate and resize a tablet (at least 600dp); retain navigation and unsent
  text. Pay particular attention to bottom drawers, which currently size from
  the physical screen rather than the available app window.
- Select/cancel photos and documents; attach, send, and open them.
- Background messaging and notifications, followed by reopening the app;
  inspect WorkManager stop reasons and confirm backend recovery.
- Check 16KB alignment of packaged native libraries, including Node `.node`
  assets (the existing ELF script checks `.so` files only).

The root background and modal safe-area changes are shared with iOS. Also smoke
test image-preview open/close and safe areas on an iOS device with a notch.

The existing Detox starter flow now uses Android system Back when returning from
a channel to the channel list, rather than tapping the appbar. Run the full flow
(it creates a local community first) on an attached API 36 device, then API 35:

```sh
cd packages/mobile
npx detox build -c android.att.e2e
npx detox test starter -c android.att.e2e
```

The E2E environment disables QSS and does not require QSS credentials. The app
still needs its native backend and bundled assets. This button-Back regression
test supplements the gesture, keyboard, modal, and layout checks above.

For focused UI coverage independent of backend startup, use the existing
Storybook flavor on each attached emulator/device:

```sh
cd packages/mobile
npx detox build -c android.att.storybook
npx detox test android-compatibility -c android.att.storybook --device-name <adb-serial>
```

The `AndroidCompatibility/SystemBack` story mounts production channel screens,
reducers, and navigation saga in a fresh store; the Storybook flavor disables
the backend worker. It verifies keyboard dismissal before channel navigation,
Redux channel cleanup on system Back, native image-preview Back dismissal,
actual landscape dimensions, draft retention, and full composer/image-view
visibility. Each test relaunches the app to isolate native modal state. The
preview uses a local bundled image and fixture-owned visibility state; these
checks do not exercise attachment downloading or opening from a channel message.

## Validation results

First SDK checkpoint (`21c436948`, based on `9d3457d03`), validated on
September 8, 2026:

- Standard debug APK and AndroidTest builds passed. A separate production-env
  release AAB build passed, and bundletool 1.15.6 validated the AAB.
- Final debug APK and release AAB manifests report compile/target SDK 36,
  minimum SDK 26, and `enableOnBackInvokedCallback="false"`.
- All 19 packaged ELF binaries, including one Node `.node` asset, passed 16KB
  LOAD-segment alignment checks. The debug APK and the universal release APK
  generated by bundletool passed ZIP alignment checks.
- The three modal safe-area unit tests, TypeScript, and ESLint checks passed.
- The Storybook debug and AndroidTest builds passed. All three focused native
  UI tests passed on both API 36 and API 35: keyboard/channel Back dispatch,
  preview dismissal without leaving the channel, and rotation with draft
  retention plus full composer/image visibility. Portrait and landscape
  screenshots were inspected. A negative control with the original preview
  layout failed the landscape visibility assertion, confirming the regression
  check catches the clipping that prompted the layout fix.
- The universal release APK installed and opened Join community on API 36.
  Phone and 1280x800dp tablet screenshots were inspected. Keyboard show and
  dismissal with Back passed, including the keyboard window visibility check;
  a root Back gesture exited the release activity.
- On both API 36 and API 35, the target-36 Detox starter flow passed its first
  four onboarding tests, then stalled before the channel list. The new channel
  Back regression test was therefore not reached.
- A fresh-data control using verified compile/target SDK 35 on API 35, launched
  without Detox, stalled at the same synchronous Tor-process cleanup for over
  a minute. Logs end at `Attempting to kill hanging tor processes`, before Tor
  spawning. The stall also occurs with the original SDK settings; ARM64
  translation is suspected but not established as its cause. Final debug
  outputs were subsequently rebuilt and verified with target SDK 36.

After merging current `develop` (`e0a92300a`) in `152302980`:

- Updated the isolated UI fixture with the required community/team metadata
  and channel operation status. The original fixture reproduces the two
  TypeScript errors that blocked CI bootstrap; the corrected fixture passes.
- Clean CI-equivalent bootstrap passed for all 11 packages. Mobile TypeScript,
  full mobile lint, and the three safe-area unit tests passed locally.
- GitHub's mobile test job passed 50 suites / 121 tests and 44 snapshots; three
  suites / three tests were skipped. Ubuntu lint/type checks also passed.
- Fresh standard debug and Storybook debug / AndroidTest builds passed against
  the updated base. The standard APK still targets API 36, and all 19 packaged
  ELF files (including the Node addon) plus APK ZIP alignment passed 16KB checks.
- All three native SDK compatibility tests passed again on each of API 35 and
  API 36 with the updated Storybook APK.
- A fresh-data full starter attempt on API 35 again passed its first four
  onboarding tests and stalled before the channel list. Backend logs again end
  at `Attempting to kill hanging tor processes`; full messaging remains blocked
  on this translated emulator.
- The production AAB result above belongs to the first checkpoint. Current
  `develop` requires Firebase configuration for release builds; it is absent in
  this local checkout. Rebuild the current production AAB through the normal
  configured release workflow before uploading. Local debug/Storybook builds
  tolerate the missing configuration and do not validate push notifications.

These emulator runs used x86_64 images translating ARM64 binaries. Full backend
onboarding and messaging, attachment selection/download/opening, drawer layouts,
background recovery, and the iOS smoke checks remain unverified. Focused channel
and modal tests above cover native UI dispatch without the running backend.
Complete the remaining release checks above on native ARM64 Android hardware
or a suitable ARM64 emulator before publishing.

## Follow-up

Keep the staged RN upgrades in [issue #3013](https://github.com/TryQuiet/quiet/issues/3013):
React 19, compatible native modules/RNScreens, community JavaScriptCore
integration, iOS validation, and removal of temporary Back compatibility.
Broader Node LTS work remains a separate monorepo change.

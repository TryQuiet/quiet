# React Native New Architecture and embedded Node upgrade

This work is stacked on [#3422](https://github.com/TryQuiet/quiet/pull/3422),
which establishes React Native 0.81.5, Hermes, and Android API 36 on the legacy
architecture. The follow-up enables Fabric and bridgeless native modules, then
upgrades the separate Node runtime that executes Quiet's backend.

## Plan and acceptance checks

1. Enable the New Architecture on Android and iOS. Register Android's generated
   native components alongside the Node JNI library and route app lifecycle and
   notification callbacks through the managed React host.
2. Select and pin a reproducible newer nodejs-mobile runtime for both platforms.
   Desktop locks Electron 32.3.3, which embeds Node 20.18.1; the monorepo's
   Node 20.20.1 setting controls build tools. Official nodejs-mobile releases
   currently stop at 18.20.4, so evaluate maintained forks and their source/build
   provenance before replacing the vendored runtime.
3. Run real Hermes/Fabric/bridgeless UI checks, native module and lifecycle event
   round-trips, Android navigation/photo/rotation/activity restoration tests,
   native builds, and embedded Node database persistence across app processes.
   Verify the installed runtime version and Android 16 KB native alignment.
4. Record the exact validation results and any remaining platform limitations.
   Commit completed work on this worktree's branch before independent review,
   address review findings, and publish the PR with `upgrade/react-native-081`
   as its base.

## Sources

- [Electron 32.3.3 runtime versions](https://releases.electronjs.org/release/v32.3.3)
- [Official nodejs-mobile releases](https://github.com/nodejs-mobile/nodejs-mobile/releases)
- [Node 24 mobile candidate](https://github.com/gmaclennan/nodejs-mobile/releases/tag/v24.18.0-0)

## Implementation checkpoint

- Android and iOS enable Fabric and bridgeless React Native 0.81.5. Android's
  CMake builds generated native components alongside the separate Node JNI
  library, using C++20 only where the new Node headers require it.
- Android's exported `CommunicationModule` methods are instance methods, as
  required by the bridgeless module adapter. Native backend callers retain a
  separate static event entry point. Notification intents use ReactHost.
- Android's Tor process detector uses flags supported by both Android 15 and 16
  Toybox versions and excludes its own shell by PID. The previous unsupported
  flag could report a live Tor process as missing and trigger repeated restarts.
- iOS AppDelegate compiles as Objective-C++ and obtains the managed native
  event module from ReactHost's module registry for lifecycle and notifications.
- Config 1.7.2 and Share 12.3.1 supply supported New Architecture code generation.
  Screens 4.24.0 is compatible with RN 0.81; its newer releases require a newer
  RN version. A narrowly pinned [upstream listener lifetime fix](../patch/rnscreens/README.md)
  is backported because native startup reproduced that crash on 4.24.0.
  The installer checks exact package/source hashes and rejects unexpected drift.
- Embedded Node is pinned to the community fork's full **24.18.0-0** release
  (Node **24.18.0**, module ABI **137**, Node-API **10**). The official project
  has no Node 20 release. See [runtime provenance and installer](../scripts/nodejs-mobile-runtime/README.md)
  for archive digests, source commits, licenses, and compatibility tradeoffs.
  This is a community prerelease, and its binaries have not been independently
  rebuilt. Host build tools remain on Node 20.20.1.
- Android retains its shipping ARM64 ABI. iOS now supports ARM64 devices and
  ARM64 simulators; the new runtime has no Intel simulator slice. Existing
  classic-level addon binaries are retained through their stable Node-API 3
  interface. The separate Tor ARM simulator recipe remains necessary.

## Validation results

| Check | Result |
| --- | --- |
| Mobile TypeScript and ESLint | Pass; 12 existing lint warnings |
| Mobile Jest | 56 suites, 137 tests, 44 snapshots pass; 3 existing skips |
| Package execution, CLI XML, Promise, and Screens patch regressions | 15 tests pass |
| Runtime archive installer | 275 installed files verified; 6 archive/rollback tests pass |
| Host classic-level addon built with Node 24 headers | 6 tests pass on Node 24.13.0 |
| Android Storybook app and instrumentation APK | Build successfully |
| Standard release AAB, including release lint | Builds; bundletool validation passes |
| Storybook APK and universal release APK native alignment | All 24 ELF files, including the addon, pass every 16 KB LOAD check; APK ZIP alignment passes |
| Actual Hermes, Fabric, bridgeless mode, WebView crypto, and native events | Pass on API 35 and 36 with default Detox synchronization |
| Keyboard and modal Back, edge gestures, rotation, activity recreation, and real photo selection/cancellation | Pass on API 35 and 36; 9 tests in 5 suites on each |
| Keyboard fix from #3422 | Strengthened four-case keyboard/Back/modal/rotation suite passes on both API 35 and 36, including fully visible input and Send with the portrait keyboard open |
| iOS ARM Storybook app | Builds with Xcode 26.3; all 109 pods compile; strict simulator app signature and exact Tor restoration pass |
| iOS ARM simulator runtime | 2 tests pass on iOS 18.5: actual Fabric/bridgeless/Hermes/WebView crypto and managed native event/background/resume routing |
| Android embedded Node database | Node 24.18.0 / ABI 137 / Node-API 10; native JNI event correlation and existing addon pass write/read/iterate/reopen across 2 actual app processes |
| Android 16 KB userspace | The same native Node/database smoke passes across 2 app processes on the API 36 16 KB emulator, using ARM64 translation on an x86_64 host |
| Android Tor process discovery | Real production command passes on API 35 and 36 against two owned processes, including directory spaces, detector exclusion, and no matches after cleanup |
| iOS embedded Node database | Same runtime identity; native bridge, existing addon, 8 compressed tables, and persistence across 2 app processes pass |
| Standard iOS simulator build support | Debug/E2E/QSS/Release ARM routes use the guarded builder; 42 portable tests pass; two identical standard Debug build commands reuse DerivedData and the app path, retain separate run evidence, and pass strict signing and exact Tor restoration |
| Standard iOS community and messaging | Fresh community, username, visible keyboard-open input/Send, exact message's backend storage acknowledgment, process restart, and restored community/message pass with default Detox synchronization |
| Standard Android community and messaging | The same full focused flow passes on API 35 with the corrected Tor detector and supported Detox idle defaults |
| Native ARM Android 16 KB community and messaging | The complete focused flow passes on the Mac-hosted ARM64 API 36 emulator with 16 KB pages, no CPU translation, and default synchronization |
| Full Android starter suite | All 25 tests pass on both API 35 and native ARM64 API 36 with 16 KB pages, notifications enabled and synchronization enabled throughout |
| Full iOS starter suite | All 25 tests pass on ARM iOS 18.5 using the bundled staging app, fresh installation, notifications enabled and default synchronization; the exact final test file also passes all 25 tests on API 35 |
| iOS without Firebase configuration | 5 hosted native XCTest cases pass, with no skips, exercising the production Swift module and app delegate |
| Physical iPhone development build | Builds, signs, installs in place and launches on iPhone 16e / iOS 18.5; strict nested signing and app/extension entitlements verify, and the launched process remains running |
| iOS QSS one-player | Real native app and local native Mac QSS: 1/1 passes with default synchronization, real public-test-key CAPTCHA, v5 invitation, exact message acknowledgment, server count/sequence 3 → 4, and message restoration after restart |
| Desktop + iOS with QSS | 6/6 stages pass on the same Mac with same-checkout apps: offline-owner invitation/history, live exchange, offline catch-up in both directions with sender processes stopped, and all five messages restored after restart; no skipped tests or synchronization bypass |
| Manual iOS CI preparation | 7 executable workflow tests, actionlint and shell syntax checks pass; hosted execution remains pending publication |

Release packaging used a temporary nonproduction Firebase configuration and local
debug signing. The fixture was removed afterward; these checks do not validate
production push delivery or store credentials.

The UI fixtures use production components without starting the full community
backend. The separate native database and standard community tests exercise
embedded Node startup, bridge transport, database persistence across processes,
authentication, and Tor/community behavior.
A supplemental Node 24 host run exposed a MessagePack 1.10.2 authentication
serialization failure. A separate auth dependency update to 1.11.8 fixes it:
all 54 focused backend tests pass, and a new six-test crypto regression covers
long Unicode payloads, hashing, signatures, encryption and tamper rejection.
The auth update is published in [TryQuiet/auth#35](https://github.com/TryQuiet/auth/pull/35),
and this branch pins its fetchable commit. The rebuilt backend bundle contains
no old serializer or unsafe Buffer write calls.
Fresh-data behavior is the requested scope; cross-version data migration is not
an acceptance requirement.

The full auth suite ran 490 tests on Node 24: 402 passed and 88 failed. An
isolated original auth checkout with MessagePack 1.10.2 on Node 20 reproduced
the exact same 88 failing test names (396 passed). The six added regression
tests account for the passing-test difference; no new failing test appears.

The standard Android and iOS apps pass fresh community creation, username
registration, keyboard-open sending, backend storage acknowledgment, and message
restoration after a process restart. The test waits for the exact message's
acknowledgment before restarting, so optimistic frontend caching cannot satisfy
it alone. On iOS it targets the actual native multiline composer because Fabric
can drop a reused test identifier when replacing a single-line field. Explicit
native hierarchy anchors keep each message's text under its own pending/stored
marker on both platforms. Android uses Detox's supported bounded idle defaults;
the previous 60-second override could abort a loading-stage tap before the
test's 120-second community wait began.

The full Android starter suite also covers channel deletion and recreation,
leaving and creating another community, background restoration, and further
messaging. Before its four header-menu taps, it waits for the actual Android
notification banner to disappear naturally. The bounded helper observes the
SystemUI hierarchy and removes its temporary file; notifications remain enabled
and the original UI actions and assertions remain in place. The two previous
onboarding synchronization bypasses have been removed.

The same full suite passes on iOS, including both community registrations and
message sends. It explicitly handles the staging build's optional server offer.
Fabric's recycled native text inputs can lose their test identifiers when
switching between single-line and multiline fields. The test checks the unique
visible native single-line field's exact placeholder, and scopes the multiline
composer to the chat screen. It retains the screen, text and navigation
assertions; ambiguous field matches fail instead of selecting by position.

Full backend runs on x86 Android emulators can still hang when forking a child
process: a captured native stack identifies the ARM translation cache mutex in
`libndk_translation`. This is separate from the corrected Tor detector. The
complete flow passes on the Mac-hosted native ARM Android emulator with 16 KB
pages, without CPU translation or false managed-Tor restart events.

Development builds may omit Firebase configuration. In that state, the native
token and topic operations now reject explicitly with `firebase_unavailable`,
instead of relying on a missing Messaging instance to finish their promises.
The APNS callback returns without configuring Firebase. Configured Firebase
operations and notification permission requests retain their existing behavior.
Five hosted XCTest cases exercise the linked production module and actual app
delegate; all five pass on ARM iOS 18.5, with no skips or expected failures.

The current development app, version 8.0.0 (587), also builds and runs on a
physical iPhone 16e with iOS 18.5. It uses the stock device Tor framework and
bundled frontend/backend code. Existing development profiles and the selected
development certificate sign a copy of the built app, including its frameworks
and notification extension. Strict signature verification and exact entitlement
checks pass; source frameworks and the unsigned build remain unchanged. The app
installs in place without an uninstall or explicit data reset, launches with
foreground activation, and remains running in the subsequent process check.
The user subsequently confirmed that one-player testing works on the physical
iPhone; this manual result is recorded in
[issue #3013](https://github.com/TryQuiet/quiet/issues/3013#issuecomment-5607256236).
It is user-reported UI validation, separate from the automated simulator checks.
The earlier PR (#3422) still needs its separate physical-device smoke test.

The standard app also launches outside Detox on the ARM iOS simulator. It
restores the saved community and channel list, loads Hermes, NodeMobile, Tor and
classic-level, and opens its saved database files. The owned simulator was shut
down after testing; the current app is left open on the physical phone.

The requested independent Daybreak Blue review covered the implementation and
auth dependency update. Its medium finding identified that the standard iOS
build command failed on its second invocation. Commit `77ba01240` fixes this
with owned reusable workspaces, exclusive workspace/pod locks, retained run
evidence and atomic result publication. Two consecutive native builds and 42
portable tests verify the fix, including failure, interruption, retry and
concurrency. Daybreak's follow-up closed the finding and reviewed the later
workflow and starter changes, followed by the unconfigured-Firebase fix and its
native regressions (`0ef9700ff`), with no open material findings.
The review did not independently rerun native tests or establish binary
reproducibility, production signing or physical iPhone behavior.

The manual iOS workflow now prepares the pinned ARM simulator Tor framework,
selects Xcode 26.3 and one owned iPhone 16 Pro/iOS 18.5 simulator, and runs the
bundled staging app's starter and community-persistence suites. It retains the
checked-out submodule revisions; the previous bootstrap command could replace
them with remote branch tips. It cleans up its simulator and temporary empty
Firebase resource and retains build/test diagnostics. Its executable tests use
the actual Detox CLI and configuration, but do not claim a native build or a
hosted workflow pass. Publishing this workflow also requires write permission
for GitHub Actions workflow files.

The [QSS one-player suite](../e2e/README_QSS.md) and
[mixed desktop/iOS suite](../e2e/README_DESKTOP_QSS.md) now run on the same Mac
against a [native local QSS fixture](../scripts/qss-e2e/README.md). They use the
same checkout for both apps, the existing Selenium `App`/`Channel`/onboarding
helpers, and Detox's normal lifecycle and synchronization. The fixture pins
QSS and its nested auth source, starts owned loopback Postgres/Redis processes,
and verifies hCaptcha through its real public test-key API. No signing or
physical-phone changes are needed for these simulator tests.

The one-player test passes in 112.7 seconds; the six mixed stages pass in
249.5 seconds with zero skips. Both apps and the test sources remain unchanged
through the mixed run. Exact text and author assertions establish message
retrieval while the sending peer is stopped; aggregate server counts alone do
not identify encrypted messages. All five messages survive the final restart.
Captured desktop descendants exit before offline retrieval, the isolated desktop
profile is removed, and the owned simulator is shut down after testing.

This validation caught two setup errors: stale installed auth dependencies can
reintroduce the old Node 24 serializer failure despite a correct gitlink, and
QSS's auth hostname must match the endpoint advertised to production-built
clients. Follow the frozen submodule install/build steps and use `localhost`
consistently for this fixture. Production authentication behavior is unchanged.
Coverage is still narrower than the full desktop suite: QSS cancellation,
private channels, attachments, and long paginated histories remain follow-up
parity work. Production QSS availability and production CAPTCHA are unverified.

The Tor process regression is opt-in and requires an explicitly selected owned
emulator. It runs Android's actual command-line tools against temporary processes;
it does not modify a Quiet app or kill an existing Tor process. From
`packages/backend`, with the intended host Node version selected:

```sh
QUIET_ANDROID_TEST_SERIAL=emulator-5582 \
QUIET_ANDROID_TEST_AVD=quiet-api35-sdk \
QUIET_ANDROID_TEST_ADB=/absolute/path/to/adb \
node --experimental-vm-modules node_modules/jest/bin/jest.js \
  src/nest/tor/tor-processes.android.spec.ts --runInBand
```

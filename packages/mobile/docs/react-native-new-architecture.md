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

## Validation in progress

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
| Standard iOS simulator build support | Debug/E2E/QSS/Release ARM routes use the guarded builder; 31 portable tests pass; actual standard Debug app builds and passes strict signing and Tor restoration checks |
| Standard iOS community and messaging | Fresh community, username, visible keyboard-open input/Send, exact message's backend storage acknowledgment, process restart, and restored community/message pass with default Detox synchronization |
| Standard Android community and messaging | The same full focused flow passes on API 35 with the corrected Tor detector and supported Detox idle defaults |

Release packaging used a temporary nonproduction Firebase configuration and local
debug signing. The fixture was removed afterward; these checks do not validate
production push delivery or store credentials.

The UI fixtures use production components without starting the full community
backend. Separate tests must establish embedded Node startup, bridge transport,
database persistence across processes, authentication, and Tor/community behavior.
A supplemental Node 24 host run exposed a MessagePack 1.10.2 authentication
serialization failure. A separate auth dependency update to 1.11.8 fixes it:
all 54 focused backend tests pass, and a new six-test crypto regression covers
long Unicode payloads, hashing, signatures, encryption and tamper rejection.
The auth update is committed locally and awaits repository write access before
its companion PR and this branch's submodule pointer can be published. The
rebuilt backend bundle contains no old serializer or unsafe Buffer write calls.
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

Full backend runs on x86 Android emulators can still hang when forking a child
process: a captured native stack identifies the ARM translation cache mutex in
`libndk_translation`. This is separate from the corrected Tor detector. Native
ARM Android validation on the Mac is in progress to check the complete flow
without CPU translation.

The requested physical iPhone check of the previous PR (#3422) is also pending:
the paired device and provisioning profiles are available, but the Mac login
keychain is locked and cannot sign the fresh build. Simulator validation continues
independently. The final Daybreak Blue audit will follow working native integration.

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

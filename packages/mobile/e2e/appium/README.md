# Native notification journeys with Appium

This package runs two provider tests against Quiet's native application on Android
or iOS, with a real desktop peer and the pinned local QSS/QPS fixture:

1. Desktop creates a community. A fresh mobile installation joins through the
   visible invitation, completes registration and receives a foreground message.
   Without restarting mobile, background it, send a new desktop message, inspect
   the OS notification and tap it into the conversation.
2. Desktop creates a named channel. Wait for its metadata to appear on mobile,
   leave mobile viewing general, background it, and send to the named channel.
   Assert the notification's channel/sender/body and that tapping opens the
   correct channel with the exact stored message and author.

`test:full-loop` never injects a wakeup or posts a local notification. QSS/QPS
must register the real client token and use Firebase; iOS delivery then uses
APNs and the notification service extension. The unique message text is encrypted
on QSS; the provider payload contains only generic notification text. Seeing the
unique decrypted text in Notification Center distinguishes extension rendering
from the generic APNs banner. Android additionally requires Firebase service
receive and QSS handler posting logs after backgrounding.

`test:onboarding` runs only fresh join and foreground message delivery against a
push-disabled fixture. It exercises the Appium selectors and peer coordination
without provider credentials. Its receipt explicitly records
`fullLoopPassed: false`; it is not a substitute for either provider test.

## Build and fixture

Use a disposable device or emulator/simulator and the normal workspace setup.
Android needs a Google APIs/Google Play system image for FCM. iOS needs a Mac with
Xcode and an APNs-capable simulator or provisioned physical test device. Match
Firebase project configuration to the application ID, and enable APNs in the iOS
Firebase project. Keep downloaded service accounts out of this checkout.

Build the app with `.env.e2e.qss.push` and the test project's native Firebase
configuration (`google-services.json` on Android, `GoogleService-Info.plist` on
iOS). On Android, after bundling the backend:

```sh
cd packages/mobile/android
ENVFILE=../.env.e2e.qss.push ./gradlew assembleStandardDebug \
  -PreactNativeArchitectures=arm64-v8a
```

For iOS, build the **Quiet** scheme with `.env.e2e.qss.push`, its bundled JS/backend,
Firebase plist, and the app plus NSE entitlements/profiles appropriate to the
test device. Do not resign the extension away or use `simctl push` as provider
validation. The [guarded iOS build recipe](../../scripts/tor-ios-simulator/README.md)
accepts `--scheme Quiet --configuration Debug --env-file .env.e2e.qss.push`
for this provider lane; `.env.e2e.qss` selects push-disabled onboarding.

For push-disabled iOS onboarding, use `.env.e2e.qss`. An omitted `QPS_ALLOWED`
uses the app's disabled default. Xcode still requires `ios/GoogleService-Info.plist`
as a bundle resource: in a disposable smoke checkout without Firebase configuration,
an empty plist dictionary satisfies the build. The full-loop preflight rejects
that placeholder. Keep any existing Firebase configuration intact.

iOS preflight inspects the built native executable and `Env.plist` for the local
QSS endpoint, checks that push configuration matches the selected lane, and records
frontend/backend/native hashes. Provider runs additionally require matching Firebase
configuration and a bundled notification service extension with the correct
extension type; its executable hash is recorded too. These artifact checks do not
prove provider delivery or extension activation.

For the CI simulator build, `sign-ios-simulator.py --prepare` generates the app
and NSE's simulator entitlement inputs from their checked-in configuration.
A task-owned `LocalDev.xcconfig` links XML and DER capabilities into the native
executables, following Xcode's simulator layout. Debug dylib splitting is disabled
for this CI build. Existing local configuration is never overwritten.

After building, the helper seals both bundles with empty host entitlements and
verifies their linked APNs, application, app-group and keychain capabilities.
iOS device entitlements must not be placed in the simulator's macOS signature:
that signs successfully but prevents the app from launching. The preflight rejects
that mistake and mismatched XML/DER capabilities. Tor's embedded bytes stay intact.
Physical devices retain normal development signing and provisioning.

The [QSS-only backend](../../../backend/e2e/qss-only/README.md) is supported on
Android when Tor is unavailable. Build both consumers from the same receipt and
use a private env file containing `.env.e2e.qss.push` plus
`QUIET_E2E_QSS_ONLY=true`. Export `IS_E2E=true` and
`QUIET_QSS_ONLY_BUILD_RECEIPT`. This covers real QSS authentication, encrypted
messaging and notifications, with simulated Tor metadata and P2P disabled.
Build/package desktop using the [mixed-suite recipe](../README_DESKTOP_QSS.md).

Create a private JSON file (mode 0600) mapping `android` and/or `ios` to the
**complete downloaded test Firebase service-account object** for that platform.
Only explicitly supplied accounts are used. Start the provider-enabled fixture:

```sh
python3 packages/mobile/scripts/qss-e2e/fixture.py up \
  --output /absolute/private/push-fixture --port 3003 \
  --push-credentials /absolute/private/firebase-test-accounts.json
```

Provider fixture startup supports Docker and the
[native macOS runtime](../../scripts/qss-e2e/README.md#native-macos-runtime).
Use `--sudo-docker` where required, or `--runtime native` with the native tool paths.
Credentials remain in the private runtime configuration and enter only the QSS
server process, not build tools, public receipts or archived source.
Fixture health does not prove successful delivery;
the Appium assertions do that. For onboarding smoke, omit `--push-credentials`.

## Run

Install the independent pinned Appium toolchain (Node >=20.19):

```sh
cd packages/mobile/e2e/appium
npm ci
# Both drivers are project dependencies; no global driver install is needed.
npm run server
```

Set `ANDROID_HOME`/`ANDROID_SDK_ROOT` for Android. Start Appium from this directory
so it discovers the local drivers. When using a private ADB server, pass its port
to the server environment and the run configuration.

Write a private configuration file, for example:

```json
{
  "platform": "android",
  "udid": "emulator-5588",
  "disposable": true,
  "bundleId": "com.quietmobile.debug",
  "app": "/absolute/checkout/packages/mobile/android/app/build/outputs/apk/standard/debug/app-standard-debug.apk",
  "desktopBinary": "/absolute/checkout/packages/desktop/dist/linux-unpacked/@quietdesktop",
  "appiumPort": 4725,
  "adbPort": 5041,
  "systemPort": 8225,
  "display": ":193"
}
```

For iOS use `"platform": "ios"`, the exact simulator/device UDID, the built
`.app` directory and its actual bundle ID. Optional fields are `platformVersion`,
`wdaLocalPort`, `xcodeOrgId` and `updatedWDABundleId` for signing WebDriverAgent on
physical devices. Desktop runs on the same host as the selected device's Appium
server. Both clients must reach the fixture as `ws://localhost:3003`; Android
sets ADB reverse on only the selected device. A physical iPhone requires a
separately provisioned route to that endpoint; the current localhost fixture
recipe targets iOS simulators.

From the repository root, prepare a new private run directory for each invocation:

```sh
export QUIET_NOTIFICATION_CONFIG=/absolute/private/appium.json
export QUIET_QSS_LOCAL_FIXTURE_OUTPUT=/absolute/private/push-fixture
export QUIET_QSS_E2E_RUN_DIR=/absolute/private/push-run-01
python3 packages/mobile/scripts/qss-e2e/fixture.py prepare-run \
  --output "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT" \
  --run-output "$QUIET_QSS_E2E_RUN_DIR"
umask 077
npm --prefix packages/mobile/e2e/appium run test:full-loop \
  > "$QUIET_QSS_E2E_RUN_DIR/test.log" 2>&1
```

Use `test:onboarding` with a push-disabled fixture to debug enrollment first.
Both commands fail on missing prerequisites instead of skipping. The suite
reinstalls Quiet on the selected disposable device; do not run Detox or Android
instrumentation concurrently on it. Backgrounding uses Home, not force-stop.

`ui.json` records app/backend hashes, platform, transport and completed assertions.
Screenshots, UI trees, receiver logs, and raw runner output stay in the private
run directory because they may contain invitation material. The full-loop
success receipt requires both OS notification/tap journeys to finish.
CI also publishes a separate JSON-lines failure report with fixed error categories
and allowlisted source locations. It omits test titles, exception messages,
assertion values and raw stacks. Cleanup failures retain a failed process status.

## CI

`iOS notification Appium tests` runs separate `onboarding` and `provider` jobs on
macOS 26 with Xcode 26.3. It builds the pinned Tor ARM simulator slice from source
in a separate job, then builds both native clients with the normal Tor backend.
The compiled framework cache is keyed by source/patch/build-script hashes, runner
architecture and Xcode version; it never substitutes a device or installed-app binary.
Postgres, Redis and QSS run directly on the Mac; no Docker service is required.
Each journey creates and removes its own iPhone simulator. The onboarding lane
uses a push-disabled fixture and requires no provider credentials. The provider
lane requires real Firebase/APNs setup and fails if its credential preflight or
either notification journey fails. A passing onboarding result cannot satisfy it.

The iOS runner invokes `ci-ios-build.sh` and `ci-ios.sh`; both require a fresh
GitHub Actions runner and an explicit `QUIET_NOTIFICATION_LANE`. Only selected
build/result fields, fixed journey stage labels and sanitized failure locations
are published. CI execution
results belong in the [validation record](../README_QSS_NOTIFICATIONS.md);
adding a workflow does not establish an iOS UI pass.

`Mobile notification provider tests` runs on same-repository PRs touching this
harness, and supports manual dispatch. The Android job validates credentials,
builds both clients with the QSS-only backend, and runs both full-loop journeys
on a Google APIs Android 36 emulator. It never substitutes onboarding for a
failed provider test. Credential-availability booleans, a small result receipt
and sanitized failure locations are published; raw logs, screenshots and
credentials are not artifacts.

`ANDROID_FIREBASE_KEY` and `IOS_FIREBASE_KEY` decrypt the checked-in native
Firebase client configurations. They are not credentials for sending pushes.
By default the job uses `QSS_AWS_ACCESS_KEY_ID` / `QSS_AWS_SECRET_ACCESS_KEY` to
read exactly `DEV_FIREBASE_ANDROID_PRIVATE_KEY` and
`DEV_FIREBASE_IOS_PRIVATE_KEY` from AWS Secrets Manager. Project IDs, service
account emails and the AWS region come from the pinned QSS `app/.env.dev`,
matching its `PushService` / `AWSSecretsService` configuration. This performs no
AWS writes and has no production-secret fallback. A lookup denial is reported
as a preflight failure before any app build or provider test.

A dedicated `QSS_NOTIFICATION_FIREBASE_CREDENTIALS` JSON map, or the explicit
`FIREBASE_<PLATFORM>_{PROJECT_ID,CLIENT_EMAIL,PRIVATE_KEY}` fields, can override
the AWS lookup. The public receipt distinguishes missing credentials from
client/server project mismatches. A green credential check establishes build
prerequisites only; the real Appium journeys must also pass.

## Faster coverage and current limits

Keep cursor/duplicate/filtering/retry cases in the Android instrumented
`QssPushHandlerTest` and existing iOS NSE XCTest suites. Keep token lifecycle and
cleanup cases in mobile Jest; keep the six messaging/restart stages in Detox.
Cypress cannot exercise the native receiver or extension and adds no coverage
here. See [coverage and run results](../README_QSS_NOTIFICATIONS.md).

The Appium suite currently covers fresh join and a named public channel. Private
channel notification taps, provider token tombstones after leave/rejoin,
quick-reply UI, process-death wakeup and hardware background scheduling are not
covered by these two journeys. Native leave/re-enrollment tests establish local
cleanup, not server-side token revocation. Do not infer these cases from a green
notification test or from ordinary CI checks.

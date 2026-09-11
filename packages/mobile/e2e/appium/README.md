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
validation. The existing guarded QSS iOS build recipe uses the push-disabled
environment; it must not be reused unchanged for this lane.

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

Provider fixture startup currently supports Docker, including Docker on a Mac.
Use `--sudo-docker` where required. Native QSS fixtures continue to disable push.
Credentials enter only the private Compose runtime configuration, not its public
receipt or archived source. Fixture health does not prove successful delivery;
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

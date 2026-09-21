# Native notification journeys with Appium

This package runs two provider tests against Quiet's native application on Android
or iOS, with a real desktop peer and deployed staging QSS/QPS:

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

Build the provider app with `.env.e2e.qss.staging` and the test project's native Firebase
configuration (`google-services.json` on Android, `GoogleService-Info.plist` on
iOS). On Android, after bundling the backend:

```sh
cd packages/mobile/android
ENVFILE=../.env.e2e.qss.staging ./gradlew assembleStandardDebug \
  -PreactNativeArchitectures=arm64-v8a
```

The hosted Android lane builds native x86_64 for its Google APIs emulator. For
that architecture, run `npm --prefix packages/mobile run prepare-android-x86_64`
from the repository root first (NDK 28.2.13676358), then select
`-PreactNativeArchitectures=x86_64`. The lane does not require ARM translation.

For iOS, build the **Quiet** scheme with `.env.e2e.qss.staging`, its bundled JS/backend,
Firebase plist, and the app plus NSE entitlements/profiles appropriate to the
test device. Do not resign the extension away or use `simctl push` as provider
validation. The [guarded iOS build recipe](../../scripts/tor-ios-simulator/README.md)
accepts `--scheme Quiet --configuration Debug --env-file .env.e2e.qss.staging`
for this provider lane; `.env.e2e.qss` selects push-disabled onboarding.

For push-disabled iOS onboarding, use `.env.e2e.qss`. An omitted `QPS_ALLOWED`
uses the app's disabled default. Xcode still requires `ios/GoogleService-Info.plist`
as a bundle resource: in a disposable smoke checkout without Firebase configuration,
an empty plist dictionary satisfies the build. The full-loop preflight rejects
that placeholder. Keep any existing Firebase configuration intact.

iOS preflight inspects the built native executable and `Env.plist` for the selected
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
use a private env file containing `.env.e2e.qss.staging` plus
`QUIET_E2E_QSS_ONLY=true`. Export `IS_E2E=true` and
`QUIET_QSS_ONLY_BUILD_RECEIPT`. This covers real QSS authentication, encrypted
messaging and notifications, with simulated Tor metadata and P2P disabled.
Build/package desktop using the [mixed-suite recipe](../README_DESKTOP_QSS.md).

The provider lane uses `wss://qss-dev.quiet-services.app`. Both clients must be
built for that exact endpoint. Firebase/APNs provider credentials remain on QSS;
Quiet CI decrypts only its native client configuration. Each invocation creates
a fresh `ci-notif-…` community and retains the ordinary authentication and
notification flows. Staging runs observe foreground delivery and both OS
notification/tap journeys; they do not inspect staging's private database.

Public staging must retain live hCaptcha keys. Its authenticated CI enrollment
feature verifies a short-lived GitHub Actions identity for this repository and
the notification workflows on `develop`. It allows one community per job, with a
five-minute enrollment grant and durable replay protection. Normal clients still
use hCaptcha. The preflight fails if this server feature is unavailable; never
replace staging's live keys with hCaptcha's public test keys.

The desktop receives the identity through a private runtime file, restricted to
E2E mode and the exact staging endpoint. The file is removed at teardown and is
never packaged or uploaded. No shared enrollment secret or Firebase server key
is needed in the Quiet repository. A disconnected or failed enrollment may
consume the job's grant; rerun the job instead of requesting unlimited grants.

For a local operator-assisted staging provider run, add `"stagingEnrollment":
"manual"` to the private configuration (alongside `"qssTarget": "staging"`).
Use the normal native-Tor desktop build, with no local QSS fixture configured.
The desktop uses its unchanged live hCaptcha window; complete that challenge
within five minutes. No GitHub identity is requested or saved. This option is
rejected in GitHub Actions and when `CI=true`; unattended jobs retain the default
`github-oidc` enrollment. The receipt records the selected enrollment mode, and
both real provider notification/tap assertions remain required.

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
  "qssTarget": "staging",
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
server. Both provider clients connect directly to staging; they need no ADB
reverse or route to a localhost QSS service. The iOS hosted workflow currently
uses a fresh simulator. Physical devices still require normal app and
WebDriverAgent provisioning.

Run the provider workflow from `develop`, after the server change is deployed:

```sh
gh workflow run mobile-notification-e2e.yml --ref develop
gh workflow run mobile-notification-ios.yml --ref develop
# A maintainer can select a reviewed candidate while keeping the workflow trusted:
gh workflow run mobile-notification-e2e.yml --ref develop \
  -f candidate_ref=refs/pull/NUMBER/merge
```

The workflow needs `id-token: write`; QSS independently checks the signed
repository IDs, workflow path, `develop` ref, event and audience. PR-triggered
jobs run local onboarding, and cannot obtain staging enrollment grants. A
manual dispatch on another branch also runs only onboarding.

Inside the trusted provider job, the scripts prepare a private staging run,
check its health and enrollment configuration, and obtain the GitHub token
immediately before starting desktop. Local onboarding setup remains documented
in [the QSS fixture guide](../../scripts/qss-e2e/README.md).

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
macOS 26 with Xcode 26.3. Both native clients use the normal Tor backend and
the installed Tor 409.11.2 XCFramework from the committed CocoaPods lockfile.
The guarded builder checks the shipped Tor version and preserves build receipts.
The onboarding lane runs Postgres, Redis and a push-disabled QSS directly on
the Mac; no Docker service is required. The provider lane connects to staging
and starts no local QSS or database. Each journey creates and removes its own
iPhone simulator. A passing onboarding result cannot satisfy provider delivery.

The iOS runner invokes `ci-ios-build.sh` and `ci-ios.sh`; both require a fresh
GitHub Actions runner and an explicit `QUIET_NOTIFICATION_LANE`. Only selected
build/result fields, fixed journey stage labels and sanitized failure locations
are published. CI execution
results belong in the [validation record](../README_QSS_NOTIFICATIONS.md);
adding a workflow does not establish an iOS UI pass.

The Android workflow builds both clients with the QSS-only backend and runs on
a Google APIs Android 36 emulator. Relevant pushes to `develop` and trusted
manual dispatches include the provider lane. Same-repository PRs run onboarding
and the harness regression tests. The provider lane fails if either real OS
notification journey fails.

`ANDROID_FIREBASE_KEY` and `IOS_FIREBASE_KEY` decrypt the checked-in native
Firebase client configurations. `ci_credentials.py --staging` checks their app
and project IDs against the public configuration pinned in the QSS submodule.
It ignores server credentials and never reads AWS Secrets Manager. QSS's AWS and
Firebase server secrets remain scoped to the QSS deployment repository.

Only client-configuration availability, allowlisted result fields and sanitized
failure locations are uploaded. Raw logs, screenshots, invitations, run files
and the CI identity are private. A successful preflight establishes prerequisites;
the actual Appium journeys establish provider delivery.

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

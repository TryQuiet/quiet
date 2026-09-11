# QSS notification regressions

The notification work has two separate lanes: fast native regression tests and
Appium journeys through the actual provider and phone notification UI. The
existing six-stage desktop/mobile messaging suite remains on Detox. RN-for-web
and Cypress do not exercise the native receiver or notification extension.

| Coverage | Runner and fidelity |
| --- | --- |
| Fresh UI join, first background delivery without restart, notification tap | Appium: desktop → real QSS/QPS → FCM or FCM/APNs → native receiver/extension → OS notification → exact conversation |
| Named public channel title, sender/body, tap while another channel is selected | Appium, same provider flow |
| Android foreground/team/prerequisite gates, pinned identity, same-nickname peer, self/unknown suppression | Android instrumentation: real Firebase service receive method, native storage, authenticated MockWebServer responses, real decryption and OS NotificationManager; wakeup injected in the test process |
| Android background cursor race, duplicate wake/message, HTTP and missing-key retry | Same native lane; compares cursor and actual notification `postTime`, excluding group summaries |
| Android leave/re-enrollment | Same native lane; clears real native storage, rejects a delayed old-team wakeup, then verifies re-enrollment can notify |
| iOS auth/fetch/decrypt/presentation, self/unknown filtering, badge/cursor transaction and retries | Existing hostless NSE XCTest targets, controlled URLSession responses; no provider or OS extension activation claim |
| Token deletion, permission gating and leave cleanup despite failures | Mobile Jest saga tests |
| Firebase unavailable behavior on iOS | Separate app-hosted QuietAppTests target; intentionally requires a build without Firebase configuration |

The Android instrumentation suite contains 13 cases. It invokes the actual
`QssFirebaseMessagingService.onMessageReceived` with a test RemoteMessage after
preparing native storage. It therefore covers receiver gates and real OS posting,
but **does not prove FCM transport, OS activation of the service, or storage
established through a UI join**. Those are the purpose of the Appium lane.

The protocol fixtures include signed message ID, team ID, channel ID and creation
time in both envelopes and plaintext. Their deterministic generators use the
pinned auth codecs and public test keys. The Android verifier uses libsodium
instead of an API-36 KeyFactory provider that rejected the fixture's public-key
encoding. Production signature checks are unchanged.

## Run

For full provider setup, native Firebase configuration, disposable-device
selection, Appium installation, and private artifacts, use the
[Appium instructions](appium/README.md). Invoking `test:full-loop` without an
explicit provider-enabled fixture fails; it never silently substitutes an
injected wakeup. `test:onboarding` is a separate, push-disabled smoke test.

Run Android native regressions with the existing standard debug/test APKs built
with QSS enabled. Select exactly the owned emulator and grant notification
permission first:

```sh
export ANDROID_SERIAL='<owned emulator serial>'
adb -s "$ANDROID_SERIAL" install -r '<standard-debug.apk>'
adb -s "$ANDROID_SERIAL" install -r '<standard-debug-androidTest.apk>'
adb -s "$ANDROID_SERIAL" shell pm grant com.quietmobile.debug android.permission.POST_NOTIFICATIONS
adb -s "$ANDROID_SERIAL" shell am instrument -w -r \
  -e class com.quietmobile.Push.QssPushHandlerTest \
  com.quietmobile.debug.test/androidx.test.runner.AndroidJUnitRunner
```

Require `OK (13 tests)` in instrumentation output; the adb process exit code
alone does not indicate test success. This fixture clears the disposable app's
native storage. Run it separately from Appium/Detox device sessions. On a
private ADB server add its explicit `-P` port to each command.

On a Mac, run `pod install` after the project changes, then test the `Quiet`
scheme on the selected simulator. `QuietTests` remains the hostless NSE target;
`QuietAppTests` retains the migration's app-hosted Firebase-unavailable tests.
The latter deliberately skips when Firebase is already configured. Keep this
configuration distinct from the provider build.

Portable checks, from the repository root:

```sh
npm --prefix packages/mobile/e2e/appium ci
npm --prefix packages/mobile/e2e/appium test
python3 -m unittest discover -s packages/mobile/scripts/qss-e2e -p test_fixture.py
node packages/mobile/android/app/src/androidTest/java/com/quietmobile/Push/generateNotificationFixture.cjs --check
node packages/mobile/ios/QuietTests/generateNotificationFixture.cjs --check
cd packages/mobile
node_modules/.bin/jest --runInBand \
  src/store/pushNotifications/pushNotifications.master.saga.test.ts \
  src/store/nativeServices/leaveCommunity/leaveCommunity.saga.test.ts
```

## Recorded validation, 2026-09-11

- Android API 36: **13/13 native notification tests passed in 10.367 seconds**.
  An intentional test-controlled cursor advance made the cursor regression fail
  because no OS notification was posted; removing the fault passed in 0.232s.
- Android + desktop Detox multiplayer: **6/6 passed in 206.98 seconds** on
  the updated QSS-only build, including online exchange, both offline-retrieval
  directions, and restart persistence. This fixture disables push.
- Mobile notification/token and leave cleanup sagas: **8/8 passed**.
- Appium Android enrollment smoke: **passed in 53.4 seconds**. A fresh mobile
  install joined a desktop-created community and displayed the peer message
  through real QSS. Both packaged backends matched the QSS-only receipt; Tor
  metadata was simulated, P2P and push were disabled.
- Appium provider preflight regressions: **3/3 passed**. Both deterministic
  notification fixture generators pass their codec checks.
- QSS fixture checks: **14 passed, 1 platform-specific check skipped**. The real
  pinned Docker QSS service passed database health and CAPTCHA protocol probes.
- Actual FCM/APNs journeys and native iOS execution remain **unverified** pending
  test-provider credentials and a Mac/iOS runner. These are not represented by a
  green ordinary CI check or by the Android native results above.

## Remaining coverage

The five motivating regressions were [fresh-join native prerequisites](https://github.com/TryQuiet/quiet/commit/2abea2ffce87cd94c8653fa58a50eb6e602bbe51),
[background cursor advancement](https://github.com/TryQuiet/quiet/commit/2a3d3c2c824f32b1c96aaad4dca7b2928b321c1d),
[channel-name rendering](https://github.com/TryQuiet/quiet/commit/e113e54639b4cd71818afa4cbfbb7b6ece83d0e1),
[self/unknown-author suppression](https://github.com/TryQuiet/quiet/commit/e98e974712e6d939d13908553be60f453cf2af2a),
and [leave/rejoin cleanup](https://github.com/TryQuiet/quiet/commit/98de8af3017d702a50c79ca33590c8b54e5a4fff).
The table distinguishes native regression coverage from complete provider coverage.

Still missing are private-channel provider taps, server token tombstones after
leave/rejoin, process-death delivery, hardware power-management behavior and a
provider burst run with presentation-event accounting. Android replaces each
channel's active notification, so counting visible cards cannot prove every
message was presented. Quick reply is not covered. A fixture that force-stops
Android is appropriate for offline history tests, not push-receivable background
state. The Appium journeys use Home/background instead.

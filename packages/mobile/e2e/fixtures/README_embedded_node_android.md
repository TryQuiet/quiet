# Android embedded Node/database smoke

This instrumentation test runs the app's real `BackendWorker.startNodeProjectWithArguments` JNI launcher, embedded Node 24.18.0, statically registered `rn_bridge`, and the unchanged packaged Android classic-level addon. It starts a test fixture directly, without starting an Activity or importing the production backend/Tor bundle. The standard app startup and community tests remain separate requirements.

Build the Storybook debug app and its instrumentation APK using the normal Android build environment:

```sh
cd packages/mobile
ENVFILE=.env.storybook ./android/gradlew -p android \
  :app:assembleStorybookDebug :app:assembleStorybookDebugAndroidTest \
  -PreactNativeArchitectures=arm64-v8a -DtestBuildType=debug
```

Install those two APKs on an explicitly owned emulator, after other tests have stopped. The runner uses only `com.quietmobile.storybook.debug` and its instrumentation package. It requires a matching AVD name and a debuggable installed app; it does not install, uninstall, clear app data, or operate on another app/emulator.

```sh
adb -s "$QUIET_ANDROID_SERIAL" install -r \
  android/app/build/outputs/apk/storybook/debug/app-storybook-debug.apk
adb -s "$QUIET_ANDROID_SERIAL" install -r \
  android/app/build/outputs/apk/androidTest/storybook/debug/app-storybook-debug-androidTest.apk
python3 e2e/run-embedded-node-android.py \
  --serial "$QUIET_ANDROID_SERIAL" --avd-name "$QUIET_ANDROID_AVD" \
  --output /tmp/quiet-android-embedded-node-result.json
```

Use a new summary path for each run. The runner generates a fresh public run ID, performs two instrumentation launches with a force-stop between them, checks both verdicts, and stops the app when finished. Each launch has a 90-second native verdict deadline and a 120-second outer instrumentation limit. No logcat or environment dump is collected. The output contains only validated public runtime/database fields. A failed instrumentation run reports a fixed diagnostic rather than its raw console output.

Normal instrumentation discovery skips this class unless `quietEmbeddedNodeRunId` is supplied. An explicitly supplied invalid ID still fails before fixture or native startup.

The Java test uses the official WorkManager test builder only to supply `WorkerParameters`; the backend worker, native bridge and Node runtime are real. It uses `NodeProjectManager` to copy the real APK assets, adds fixtures in a dedicated test directory, and verifies the production `bundle.cjs` hash is unchanged. Fixtures are included only in the instrumentation APK's assets. The database and verdict live in `Context.filesDir/quiet-embedded-node-smoke/<run-id>`; this path comes through actual JNI arguments because Android's existing bridge data-directory registration is not implemented.

The fixture requires Android ARM64, Node 24.18.0, module ABI 137, and Node-API 3 or newer. It verifies a random nonce through the existing Kotlin `readyForSecret` response over the raw `rn_bridge` channel. This proves the native channel round trip; it does not test socket authentication or secret generation (`doWork()` is not started). No secret is persisted in the verdict.

The addon must match the original APK asset and the checkout's SHA-256. The first process writes eight records synchronously, reads all records, checks a missing key, iterates forward and backward, closes and reopens the database, and verifies that compressed `.ldb` tables exist. The second process repeats the reads and open/close checks without writing new rows. Acceptance requires two distinct Android/Node PIDs, matching runtime and fixture hashes, 16 reads and two open/close cycles per process, and zero writes on the second launch. Test data remains in its dedicated namespace for inspection; normal user databases and the production bundle are untouched.

Host checks validate the runner's rejection of stale processes, wrong runtime/artifacts, missing compression and unexpected summary fields. They do not establish native runtime compatibility:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s e2e -p test_run_embedded_node_android.py
node --test e2e/embedded-node-android-bridge.test.cjs
node --check e2e/fixtures/embedded-node-database-android.cjs
```

## Native acceptance recorded

On September 9, 2026, this fixture passed on API 36 emulator `quiet-api36-sdk` using the real ARM64 embedded runtime (translated on the x86_64 emulator). Node reported 24.18.0, module ABI 137, and N-API 10. Both processes completed the actual JNI nonce round trip and loaded the original addon SHA-256 `9581fd8ced266f1fe66df4e0061fcac9a18317aadc0c1b2ad7b9eff79e858567`.

The passing run used PIDs 8758 and 8870: eight writes then zero, 16 reads and two open/close cycles each, with seven/eight persistent compressed tables (74,809/85,496 bytes). The sanitized local evidence is `/tmp/quiet-newarch-android-node24-db-6.json`. This proves the exercised embedded runtime, native channel and database operations; full Tor/community startup and physical ARM Android validation remain separate.

The opt-in guard was additionally checked on the emulator: a normal bundled-app Detox Hermes/WebView crypto scenario passed with Metro stopped, an invocation without the dedicated argument was skipped, and an explicitly invalid ID failed. The complete two-process database smoke passed again; evidence is `/tmp/quiet-newarch-android-node24-db-opt-in.json` and `/tmp/quiet-newarch-node-instrumentation-guards.json`.

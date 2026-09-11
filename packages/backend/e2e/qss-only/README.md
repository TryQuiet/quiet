This is an explicit QSS-only E2E backend for Android emulator validation. It keeps the native app, embedded Node runtime, local databases, real libp2p/Helia/OrbitDB services, authentication, QSS registration, CAPTCHA and message processing. The dedicated webpack configuration replaces Tor's service and Nest module, and removes every libp2p transport, listening/announced address and discovery source. Connection gates also deny peer connections, including after restart. The production webpack configuration and runtime source files are unchanged.

Tor's replacement returns simulated, stable onion-shaped metadata for the existing network identity schema and reports readiness. Its strings are not real onion addresses or Tor private keys, and it starts no process or control connection. This mode does not validate Tor, P2P delivery or iOS's native Tor lifecycle. Record it as QSS-only coverage.

After the normal workspace dependency/submodule setup, build into a separate owned output directory and explicitly stage the generated backend for both consumers:

```sh
# From the repository root. Staging does not build either native app.
node packages/backend/scripts/build-qss-only.cjs \
  --output /absolute/task-directory/qss-only-backend --stage android,desktop
export QUIET_QSS_ONLY_BUILD_RECEIPT=/absolute/task-directory/qss-only-backend/qss-only-build.json
export IS_E2E=true
```

The builder verifies that all three replacements entered the compilation and that the production Tor module/service/control code did not. Its receipt contains the resulting bundle's SHA-256 and the simulated Tor/disabled P2P mode. It stages the exact same bytes in `packages/mobile/nodejs-assets/nodejs-project/bundle.cjs` and `packages/backend-bundle/bundle.cjs`. Stage only one consumer using `--stage android` or `--stage desktop`, or omit `--stage` to build without updating consumers. Regular `npm run webpack`/`webpack:prod` plus its existing consumer sync restores the normal backend.

Build Android with the dedicated environment and configuration:

```sh
cd packages/mobile
export ANDROID_HOME='<Android SDK>'
export DETOX_ANDROID_DEVICE_ID='<exact owned Android serial>'
./node_modules/.bin/detox build -c android.att.e2e.qss.only
```

This uses `.env.e2e.qss.only`, which passes `IS_E2E=true` to the embedded backend and marks the APK's native configuration as QSS-only. The compiled backend refuses to start without `IS_E2E=true`, `QSS_ALLOWED=true`, and the local endpoint `ws://localhost:3003`. Desktop already forwards these values to its child backend; no new production runtime flag is needed.

Prepare/package desktop using the [mixed-suite recipe](../../../mobile/e2e/README_DESKTOP_QSS.md) after staging. Do not invoke the normal backend bundle build between staging and packaging. For a Linux directory build, use an actual JavaScript `null` to disable the existing AppImage-only post-build hook; the CLI interprets `null` as a filename:

```sh
# From packages/desktop, after build:prod.
node -e 'const b = require("electron-builder"); b.build({targets: b.Platform.LINUX.createTarget("dir"), publish: "never", config: {afterAllArtifactBuild: null}}).catch(error => {console.error(error); process.exitCode = 1})'
```

Set `QUIET_DESKTOP_BINARY` to the produced executable (currently `dist/linux-unpacked/@quietdesktop`). On Linux hosts that prohibit unprivileged user namespaces, configure the packaged `chrome-sandbox` according to the existing Electron sandbox prerequisites.

Keep the fixture, Android device and run-directory variables from the [QSS setup](../../../mobile/e2e/README_QSS.md). Prepare a fresh fixture run and invoke the same six multiplayer stages:

```sh
# From packages/mobile, with IS_E2E=true and the build receipt exported above.
python3 scripts/qss-e2e/fixture.py prepare-run \
  --output "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT" --run-output "$QUIET_QSS_E2E_RUN_DIR"
./node_modules/.bin/detox test -c android.att.e2e.qss.only \
  --config e2e/jest.desktop.config.js \
  --artifacts-location "$QUIET_QSS_E2E_RUN_DIR/artifacts"
```

The preflight reads the backend from the actual APK and desktop `app.asar`. Both must match the mandatory receipt; the APK must also contain the QSS-only native flag. Normal Android QSS configurations reject a QSS-only APK/backend. The final `ui.json` records each packaged backend's hash, `backendMode: qss-only`, `tor: simulated-metadata`, and `p2p: false`, together with the native app process-exit checks and the ordinary message-specific assertions.

Targeted checks:

```sh
# Repository root
node --test packages/backend/e2e/qss-only/qss-only.test.mjs
node --test packages/mobile/scripts/qss-only-build.test.cjs
```

These exercise the actual Nest module without subprocess/control access, the real libp2p node with prohibited transports/discovery/dialing, and receipt validation against changed backend bytes and a real desktop ASAR archive. They supplement the native multiplayer run; they do not substitute for it.

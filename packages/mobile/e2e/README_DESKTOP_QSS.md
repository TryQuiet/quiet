The mixed suite runs the iOS simulator and the desktop app on one Mac. It uses the existing desktop `App`, `Channel`, and onboarding selectors under Detox's Jest lifecycle. Build both apps from the same checkout. No release download, SSH connection, second computer, or desktop installation in `/Applications` is required.

Complete the [single-player QSS setup](README_QSS.md) first. The [native QSS fixture](../scripts/qss-e2e/README.md) provides Postgres, Redis and QSS on a macOS developer machine or GitHub macOS runner. Keep its public hCaptcha test credentials; the app still completes the real verification flow.

Bootstrap `@quiet/desktop` and `e2e-tests` with their dependencies, following the existing desktop workflows, including `npm run build:submodules:ci`. On an existing checkout, rerun the submodule install/build after updating its gitlink: cached auth dependencies and generated bundles can otherwise retain the old serializer that fails on mobile Node 24. Build the backend and desktop using the same steps as `.github/actions/before-build`, selecting `.env.e2e.qss`:

```sh
# From the repository root, after the normal monorepo bootstrap.
export ENVFILE=.env.e2e.qss
export TEST_MODE=true IS_E2E=true IS_LOCAL=true
export CSC_IDENTITY_AUTO_DISCOVERY=false
(cd packages/backend && npm run webpack:prod)
(cd packages/desktop && npm run copyBinariesDarwin)
(cd packages/desktop && npm run build:prod)
(cd packages/desktop && ./node_modules/.bin/electron-builder --mac --arm64 --dir -p never -c.mac.identity=null)
export QUIET_DESKTOP_BINARY="$PWD/packages/desktop/dist/mac-arm64/Quiet.app/Contents/MacOS/Quiet"

cd packages/mobile
# Retain the simulator/build/fixture variables from the single-player recipe.
# Prepare a NEW run directory for each test invocation.
python3 scripts/qss-e2e/fixture.py prepare-run \
  --output "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT" \
  --run-output "$QUIET_QSS_E2E_RUN_DIR"
./node_modules/.bin/detox test -c ios.sim.e2e.qss \
  --config e2e/jest.desktop.config.js \
  --artifacts-location "$QUIET_QSS_E2E_RUN_DIR/artifacts"
```

Run builds sequentially on machines with limited memory. The suite uses one simulator, one desktop profile, and one Jest worker. Desktop settings are passed to its child process without changing Detox's environment. Cleanup uses the existing desktop helpers and the exact owned simulator; it does not remove a user's regular Quiet data.

The stages create a QSS community on iOS, send an initial message, and hand the exact visible invitation to desktop. Desktop joins and retrieves history while iOS is stopped. Both clients then exchange messages, catch up after being offline in each direction, and restore the conversation after restart. Before accepting desktop-offline evidence, the test checks that its captured ChromeDriver, app, backend and descendant processes have exited. Assertions require complete message text attributed to the expected sender. The suite does not disable P2P or Detox synchronization to make these checks pass.

The test uses a local QSS service and its documented public CAPTCHA test credentials. It does not establish production-service availability or production CAPTCHA behavior. Keep diagnostic logs and screenshots private because they may contain invitation secrets.

Run the portable process-ownership regression with:

```sh
node --test scripts/desktop-processes.test.cjs
```

Validated on an ARM Mac with iOS 18.5: all six stages passed in 249.5 seconds, with no skipped tests and default synchronization. Both app artifacts and test sources stayed unchanged throughout the run. This is a five-message conversation; private channels, attachments and long paginated history remain outside this initial mixed suite.

See the [QSS notification regression plan](README_QSS_NOTIFICATIONS.md) for proposed Android and iOS coverage of fresh joins, notification cursors, channel names, suppression and leave/rejoin. Notification E2Es are follow-up work.

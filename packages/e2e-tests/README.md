## Running e2e tests locally

### Prerequisites

1. Follow the setup instructions in the root `README.md` to install dependencies and bootstrap the project.

2. Install Chromium:
   - Linux: `sudo apt install chromium-browser`
   - Mac: `brew install chromium`

3. Install electron-chromedriver globally, ie for electron 23:

`npm install -g electron-chromedriver@23`

4. Set Electron version:

`export ELECTRON_CUSTOM_VERSION=23.0.0`

### Building and Running Tests

1. In the `desktop` package, build the application:
   - Mac: `npm run distMac:local` # you may have to copy the binary from /Applications to the `e2e-tests/Quiet` directory
   - Linux: `npm run distUbuntu`

2. In the `e2e-tests` package:

`npm run linux:copy` # copy the binary to the `e2e-tests/Quiet` directory
`npm run test` # run all tests

To run individual tests:

`npm run test oneClient.test.ts`

### Known Issues & Tips

- For Mac: We may need to manually mount the .dmg and copy to /Applications (need to verify exact steps)
- For Linux: The `linux:copy` script handles moving the binary to `e2e-tests/Quiet/`
- Tests can be flaky - use the retry flag if needed: `npm run test oneClient.test.ts -- --retry 3`
- Set `DEBUG=backend*,quiet*` for more verbose logging
- The tests expect a clean state - you may need to clear application data between runs

## Test Suite

Current E2E test suite includes:
- oneClient.test.ts - Basic single client functionality
- userProfile.test.ts - User profile management
- multipleClients.test.ts - Multi-client interactions
- invitationLink.test.ts - Invitation link functionality
- backwardsCompatibility.test.ts - Linux release profile compatibility (local or CI)

### Release profile compatibility

Run `npm run test backwardsCompatibility.test.ts` after building and copying the
current Linux AppImage. The test downloads the published 7.0.1 and 9.0.2 binaries
under separate `*-release.AppImage` filenames, so a local build with the same
version cannot accidentally become its own baseline. The 7.0.1 fixture uses the
Chrome 126 driver; the 9.0.2 fixture uses the current Electron 32 driver.

The fixture gives Electron an isolated `XDG_CONFIG_HOME` and leaves `DATA_DIR`
unset. This exercises the release's real directory choice: 7.0.1 uses `Quiet7`,
while 9.0.2 uses `Quiet9`. Releases 8 and 9 deliberately introduced separate data
directories alongside breaking authentication/storage changes (see the desktop
changelog). Forcing 7.0.1 data into the current directory does not represent that
supported upgrade behavior.

For releases that share the current directory, the test requires channel and
message preservation, working message inputs, a new message, and persistence
after restart. For separate directories, it requires normal fresh setup in the
current release, a persisted new message, byte-for-byte unchanged old profile
contents, and reopening the old binary with its original channels/messages still
usable. It checks the actual Electron paths and backend process/database paths.
Keep a published baseline for the current directory when adding a new boundary;
both preservation and separation need coverage.

On a headless Linux host, run under Xvfb and a window manager. Hosts that cannot
mount AppImages can use `APPIMAGE_EXTRACT_AND_RUN=1`. If an isolated test host
cannot use Chromium's sandbox, `E2E_NO_SANDBOX=true` opts the E2E launcher into
`--no-sandbox`; it does not change the packaged application's defaults.

## Notes

Legacy tests pending migration can be found in commit fa1256e4d19fc481e316a09523746ce9359d4073:
- fileSending
- joiningUser
- lazyLoading
- newUser.returns

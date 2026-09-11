# Electron 44 upgrade

This change is stacked on PR #3422 (`upgrade/react-native-081`), including its
10.0.0 merge at `631ae3511`.

| Component                                  | Version          |
| ------------------------------------------ | ---------------- |
| Desktop Electron and Electron ChromeDriver | 44.3.0           |
| Chromium shipped by Electron               | 152.0.7977.78    |
| Node shipped by Electron                   | 24.20.0          |
| Host build Node / npm                      | 24.21.0 / 10.8.2 |
| Minimum macOS                              | 13               |

Electron's runtime Node is independent of the host build Node and mobile's
embedded Node. The host version is pinned in `.nvmrc`, the root Volta/engine
settings, and the desktop engine setting. CI reads `.nvmrc` and installs the npm
version from the root engine setting before dependency installation. Node 24's
bundled npm 11 rejects the existing lockfile; the pinned npm 10.8.2 installs it.

Electron 44 requires host Node >=22.12; electron-context-menu 5 requires Node 24.
The context-menu update is necessary because Electron 44 replaces the old
clipboard object API with asynchronous `ClipboardItem` operations. The app uses
the library's ESM default export, supported by Electron's Node 24 runtime.
DevTools installation uses version 4 and Electron's `session.extensions` API.

ChromeDriver can initially select Quiet's splash window. The E2E harness now
waits for and selects `index.html` before querying the application, so destroying
the splash does not invalidate its selected window.
Checking or closing an unopened E2E client also avoids creating a WebDriver
session against an undefined port, which otherwise crashes Node 24 on teardown.
Channel readiness checks re-find elements that React replaces during initial
replication, while preserving their deadlines and propagating lost sessions.

Local QSS testing exposed a CAPTCHA ordering race: a desktop IPC token can
arrive before Socket.IO's earlier connection reset. The challenge handler now
buffers token and verification updates together and keeps listening for the
successful result through a reset or retry. Failed verification also discards
the rejected token so the next attempt requests a fresh challenge. Regression
tests exercise the actual Redux saga and a real Socket.IO server.

Local Tor multiplayer also exposed libp2p's default two-second heartbeat timeout
aborting a live connection just after saving an admission. Heartbeats now allow
60 seconds for the round trip; failed probes still abort the connection. A real
authenticated libp2p connection with delayed ping replies reproduces the old
disconnect and stays connected with this configuration. Admission validation is
unchanged, including its fail-closed behavior after persistence failures.
The startup watchdog also allows Tor to keep downloading relay descriptors
while bootstrap progresses, and restarts it after two minutes without progress.
Tests cover both eventual readiness and recovery from a stalled bootstrap.

A profile written before synchronization starts can reach the admitting peer
through OrbitDB's initial heads exchange without reaching its existing peers.
The profile store now announces its validated heads after that exchange, so
those peers can display messages from the new user. A three-client test uses
real authentication and encrypted stores, with no direct connection between
the new user and the existing guest.

Multiplayer presence checks now assert the returned online status. QSS can
finish joining before Tor bootstraps, so its direct-peer presence checks allow
the same six minutes as the peer-to-peer joining panel.

The updated parent already pins auth `6f534c89b`, with msgpackr 1.11.2, which
works with Node 24. Keep that pin: the original PR #3422 snapshot used msgpackr
1.10.2, whose out-of-bounds UTF-8 writes break community creation on Node 24.

## Reproduction

After the normal desktop/backend bootstrap with the pinned host toolchain:

```sh
npm run webpack:prod --prefix packages/backend
npm run build:prod --prefix packages/desktop
npm test --prefix packages/desktop -- --silent
xvfb-run -a npm run test:electron --prefix packages/desktop
```

On macOS or a desktop with a display, omit `xvfb-run`. The runtime test builds
fixtures with the production backend webpack configuration and loads the shipped
native database binaries. It verifies:

- compressed database writes, ordered iteration, close/reopen, deletion and
  persistence across two Electron Node processes;
- ciphertext, hashes, context-bound signatures and a saved auth community
  generated under Node 20, plus fresh community creation under Electron;
- the production native context menu, copying an invitation to the system
  clipboard, pasting into a renderer input, electron-store and @electron/remote.

The tests use temporary profiles and databases. On Linux hosts that prohibit
unprivileged Chromium sandboxing, `QUIET_ELECTRON_TEST_NO_SANDBOX=1` opts out for
this test process only. The app's sandbox configuration is unchanged.

The legacy fixture contains public test keys and passwords. To regenerate it,
use **Node 20** and the built auth checkout pinned by the parent:

```sh
node packages/desktop/scripts/fixtures/generate-legacy-auth.mjs 3rd-party/auth
```

For packaged E2E on Linux, build the renderer with `ENVFILE=.env.e2e`, package
the AppImage, and copy or link it into `packages/e2e-tests/Quiet/`. Run single
player first, then multiplayer:

```sh
export FILE_NAME=Quiet-10.0.0-alpha.0.AppImage
xvfb-run -a npm test --prefix packages/e2e-tests -- --runTestsByPath \
  src/tests/oneClient.test.ts src/tests/oneClient.appImage.test.ts
xvfb-run -a npm test --prefix packages/e2e-tests -- --runTestsByPath \
  src/tests/multipleClients.test.ts src/tests/multipleClients.privateChannels.test.ts
```

For QSS, start and migrate a local service from the pinned `3rd-party/qss`
checkout, following its README. The client and log tailer accept an isolated
service through `QSS_ENDPOINT` and Docker's `COMPOSE_FILE`/`COMPOSE_PROJECT_NAME`:

```sh
export QSS_ENDPOINT=ws://127.0.0.1:3004
export COMPOSE_FILE=/absolute/path/to/local-qss-compose.yml
xvfb-run -a npm test --prefix packages/e2e-tests -- --runTestsByPath \
  src/tests/oneClient.qss.test.ts
xvfb-run -a npm test --prefix packages/e2e-tests -- --runTestsByPath \
  src/tests/multipleClients.qss.test.ts src/tests/multipleClients.privateChannels.qss.test.ts
```

Without these overrides, the harness uses the standard QSS Compose file and
port 3003. The QSS suites enable QSS explicitly; the Tor suites use peer-to-peer
connections. On hosts that prohibit unprivileged Chromium sandboxing, set
`E2E_NO_SANDBOX=true` for these test commands.

Native runtime tests are included in the existing Linux and macOS desktop test
workflow. The existing desktop build workflow covers Linux, both Mac
architectures and Windows. Signed release delivery and OS-specific notification
behavior still require release validation.

## Local validation on Linux x64

- Production backend and renderer builds, followed by the complete AppImage
  packaging hook, pass with Electron 44.3.0.
- Desktop Jest: 99 suites, 287 tests and 127 snapshots pass; 6 tests are skipped
  and 1 remains a todo.
- All Electron runtime checks described above pass.
- Packaged single-player E2E: all 60 tests pass (29 standard, 29 QSS, 2 AppImage).
  Coverage includes community creation, messaging, leaving/recreating, uploads,
  persistence after reopening, hanging-backend recovery, shutdown, QSS
  onboarding/aborts and declining the server offer.
- E2E harness: 19 tests pass. CAPTCHA/community saga checks: 6 tests pass.
  Backend QSS/CAPTCHA checks: 68 tests pass, including real Socket.IO rejection
  and retry with a fresh token.
- Libp2p delayed heartbeat and admission persistence checks: 3 tests pass.
- Tor bootstrap/session checks: 28 tests pass. User profile store/access-control
  checks: 28 tests pass. Real peer profile relay/recovery checks: 2 tests pass.
- Focused backend database/lockbox coverage: 46 tests pass. Auth crypto: 52 tests
  pass. Mobile Metro/CLI/Promise compatibility on host Node 24: 14 tests pass.
- Desktop/E2E TypeScript and lint for the changed TypeScript files pass.

Headless Linux app checks use Xvfb and the local test-only `--no-sandbox` option
because this host disallows unprivileged Chromium sandboxing. macOS and Windows
runtime/signing validation is left to the platform workflows and release checks.

References: [Electron 44.3.0](https://releases.electronjs.org/release/v44.3.0),
[Electron breaking changes](https://www.electronjs.org/docs/latest/breaking-changes).

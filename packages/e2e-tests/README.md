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

On Linux, `npm run test oneClient.appImage.test.ts` checks startup URL-handler
registration and message-link clicks in the packaged AppImage. It uses one
client with a temporary home directory and fixture XDG helpers. The Linux
single-client CI step runs it alongside `oneClient.test.ts`.

### CI transport and retries

The desktop E2E workflows use `LOCAL_TRANSPORT=true` and run each scheduled
suite once, without retries. This applies to Linux, macOS, Windows, and QSS.
Local developer commands keep their existing transport defaults.

For release events and PRs whose source branch matches `release/*` or
`*-release`, the Linux workflow also runs `multipleClients.test.ts` with
`LOCAL_TRANSPORT=false`, reusing the same packaged app. It allows one initial
attempt plus two retries (`max_attempts: 3`).
macOS, Windows, and QSS do not repeat the Tor suite.

The legacy backwards-compatibility job remains on Tor (`LOCAL_TRANSPORT=false`)
and runs once without retries. Its 7.0.1 baseline persists Tor peer addresses
that cannot be launched by the new app in local-transport mode. The separate
mobile Detox workflows are unchanged.

### Known Issues & Tips

- For Mac: We may need to manually mount the .dmg and copy to /Applications (need to verify exact steps)
- For Linux: The `linux:copy` script handles moving the binary to `e2e-tests/Quiet/`
- To use local transport when running a desktop suite locally, set `IS_E2E=true` and `LOCAL_TRANSPORT=true` in the test process environment.
- Set `DEBUG=backend*,quiet*` for more verbose logging
- The tests expect a clean state - you may need to clear application data between runs

On a headless Linux host, run under Xvfb and a window manager. Hosts that cannot
mount AppImages can use `APPIMAGE_EXTRACT_AND_RUN=1`. If an isolated test host
cannot use Chromium's sandbox, `E2E_NO_SANDBOX=true` opts the E2E launcher into
`--no-sandbox`; it does not change the packaged application's defaults.

## Test Suite

Current E2E test suite includes:
- oneClient.test.ts - Basic single client functionality
- oneClient.appImage.test.ts - Linux AppImage host integration with one client
- userProfile.test.ts - User profile management
- multipleClients.test.ts - Multi-client interactions
- invitationLink.test.ts - Invitation link functionality
- backwardsCompatibility.test.ts - Version compatibility tests (CI only)

## Notes

Legacy tests pending migration can be found in commit fa1256e4d19fc481e316a09523746ce9359d4073:
- fileSending
- joiningUser
- lazyLoading
- newUser.returns

## Linux network-delay tests: QSS in CI, Tor local-only

The Linux QSS workflow runs `test:network:qss` **after the ordinary QSS suites**,
with a 15-minute step limit including setup and failure cleanup. It uses the
existing QSS server and AppImage build, and uploads failure screenshots. The slow
Tor mode is **local-only**; CI never invokes `test:network:tor`.

Ordinary unwrapped Jest runs skip both network suites. For local testing, run
either command in a separate terminal alongside the normal run, or afterward.
When running desktop tests concurrently, give the network suite a separate X
display and keep its QSS server running until it finishes. Network-suite
invocations serialize with each other because they temporarily configure host
forwarding; they do not acquire a lock used by ordinary tests.

**Tor is slow; QSS does not wait for Tor.** Allow about 20 minutes for the Tor
mode, excluding builds (an observed run took 18m25s). Each Tor scenario has a
20-minute limit plus cleanup. QSS instead has a three-minute limit per scenario
and 90-second phase deadlines. A local QSS run passed both scenarios and the
namespace checks in **2m05s**, or **2m55s including network setup and bandwidth
checks**, excluding builds. Both commands first measure bandwidth limits.

The QSS mode starts real Tor but blocks relay access in the test namespaces,
allowing only the local QSS endpoint on the data link. Joining, history, messages,
and recovery must succeed without Tor bootstrapping. The Tor mode tests Tor
startup, peer messaging, and exact attachment bytes separately. This makes QSS
failures independent of public Tor availability and prevents P2P fallback from
masking a broken QSS path.

These are important regression checks when changing joining/admission,
synchronization, reconnect logic, file transfer, or timeout handling. Fast local
connections can hide races and deadline failures that affect users with unequal
connection speeds. Test authors should preserve the slow-owner and slow-joiner
cases and explicit deadlines; automatic retries could hide those failures.

Build/copy the E2E AppImage using the setup above. Run as a normal Linux user with
passwordless sudo. From `packages/e2e-tests`, install the network tools and start
a dedicated display (choose an unused display number):

```sh
sudo apt-get install -y iproute2 iptables iperf3
Xvfb :156 -screen 0 1920x1080x24 &
DISPLAY=:156 fluxbox &
export DISPLAY=:156
export FILE_NAME=Quiet-VERSION.AppImage

# Tor, with QSS disabled:
npm run test:network:tor

# QSS only, with Tor running but unavailable (start QSS Docker; use the QSS E2E build):
npm run test:network:qss
```

Each command runs independently and reports its own failures. Keep its terminal
open until completion, or use Ctrl-C to cancel and clean up. Failure screenshots remain
in `network-artifacts/`; the QSS workflow uploads them in CI. Successful cases
skip screenshot capture so diagnostics do not delay the run.

To check real bandwidth limiting, process isolation cleanup on failure, and
SIGTERM cleanup without an app or display:

```sh
npm run test:network:harness
```

Each mode tests a slow owner and a slow joiner separately. Both check joining,
pre-existing history, bidirectional messages, and delivery after changing an
established connection from fast to slow and back. Tor additionally checks a
256 KiB random attachment by exact downloaded bytes. Scenarios are not retried.

QSS must publish port 3003 on all host interfaces. Both clients reach it via the
owner's **data gateway**, which is also embedded in the invitation. The isolation
test verifies both successful QSS WebSocket connections and rejection of other
traffic to a live service. The app test checks that Tor was started but never
finished bootstrapping while QSS delivered the messages.

Each player gets a network namespace containing ChromeDriver, Electron, the
backend, and its Tor process. A data veth connects it to the host's NAT. A second
veth carries WebDriver commands without throttling. App/Tor loopback connections
remain local to the namespace. The slow profile uses `tc netem` for 256 kbit/s
upload, 1 Mbit/s download, and 150 ms additional delay in each direction, without
random packet loss. Fast means no added shaping; actual public Tor performance
still varies. The TypeScript harness measures both directions with real TCP
transfers before running any E2E tests, checks that the other player and control link remain fast,
and verifies recovery after removing shaping. These are correctness checks, not
Tor throughput benchmarks.

The harness allocates non-overlapping test subnets, configures DNS and forwarding,
and removes its namespaces, processes, firewall rules, and resolver files on
normal exit, failure, SIGINT, or SIGTERM. It restores the prior forwarding setting.
Abrupt host shutdown/SIGKILL cannot run cleanup. Only setup/teardown use root;
the app processes run as the caller. Tor mode uses five-minute phase deadlines;
QSS uses 90 seconds. Neither mode uses local transport: its advertised loopback
addresses cannot connect separate network namespaces.

The npm commands compile the small TypeScript runner using the existing compiler
and hold a Linux `flock` while it owns the network. `src/networkHarness.ts`
contains setup, `tc netem` profiles, QSS isolation, bandwidth checks, and cleanup.
`src/runNetworkTests.ts` supervises Jest so cleanup survives Jest failure or
cancellation. Scenarios change speeds directly through the helper; there is no
Python subprocess. `src/networkHarness.test.ts` checks real bandwidth and
cleanup after nonzero exit, SIGTERM, and SIGINT. The small `launch.cjs` helper
preserves the app environment across `sudo` using stdin.

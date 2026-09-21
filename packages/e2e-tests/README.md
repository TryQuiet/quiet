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

## Local Linux network-delay tests (slow, opt-in)

These tests are **local-only**: CI does not run them, and ordinary Jest runs skip
both network suites. Run them in a separate terminal alongside the normal test
run, or after it finishes. They do not gate or delay the normal suite. When
running desktop tests concurrently, give the network suite a separate X display
and keep its QSS server running until it finishes. Network-suite invocations
serialize with each other because they temporarily configure host forwarding;
they do not acquire a lock used by ordinary tests.

**Budget roughly 20 minutes per mode, or 40 minutes for both**, excluding builds.
Observed runs took 18m25s for Tor and 17m13s for QSS with Tor. Public Tor startup
varies, and each scenario has a 20-minute limit plus cleanup. The QSS mode also
uses real Tor for peer traffic and attachments: cold Tor bootstrap across four
client launches accounts for much of its runtime, not QSS connection setup.
The combined QSS test explicitly waits for Tor before checking joining/messages;
it does not prove QSS usability while Tor bootstrap is still pending.

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

# QSS plus Tor (start the normal QSS Docker stack first; use the QSS E2E build):
npm run test:network:qss
```

Each command runs independently and reports its own failures. Keep its terminal
open until completion, or use Ctrl-C to cancel and clean up. Screenshots remain
in `network-artifacts/`; they are not uploaded automatically.

To check real bandwidth limiting, process isolation cleanup on failure, and
SIGTERM cleanup without an app or display:

```sh
npm run test:network:harness
```

Each mode tests a slow owner and a slow joiner separately, beginning before Tor
bootstrap. It checks joining, pre-existing history, bidirectional messages, a
256 KiB random attachment by exact downloaded bytes, and delivery after changing
an established connection from fast to slow and back. Scenarios are not retried.

QSS must publish port 3003 on all host interfaces. Both clients reach it via the
owner's **data gateway**, which is also embedded in the invitation. After checking
attachment integrity, the QSS mode disables P2P syncing in both clients and
verifies QSS message delivery through slowdown and recovery. This prevents P2P
fallback from hiding a QSS failure.

Each player gets a network namespace containing ChromeDriver, Electron, the
backend, and its Tor process. A data veth connects it to the host's NAT. A second
veth carries WebDriver commands without throttling. App/Tor loopback connections
remain local to the namespace. The slow profile uses `tc netem` for 256 kbit/s
upload, 1 Mbit/s download, and 150 ms additional delay in each direction, without
random packet loss. Fast means no added shaping; actual public Tor performance
still varies. The wrapper measures both directions with real TCP transfers before
running any E2E tests, checks that the other player and control link remain fast,
and verifies recovery after removing shaping. These are correctness checks, not
Tor throughput benchmarks.

The wrapper allocates non-overlapping test subnets, configures DNS and forwarding,
and removes its namespaces, processes, firewall rules, and resolver files on
normal exit, failure, SIGINT, or SIGTERM. It restores the prior forwarding setting.
Abrupt host shutdown/SIGKILL cannot run cleanup. Only setup/teardown use root;
the app processes run as the caller. Explicit Tor/join/delivery waits are five
minutes. Neither mode uses local transport: its advertised loopback addresses
cannot connect separate network namespaces.

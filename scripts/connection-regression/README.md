# Historical mobile connection comparison

This harness drives published Quiet APKs and published Electron apps through
visible UI. It does not replace their frontend, backend, authentication, QSS or
Tor code. Each release uses its own pinned real QSS fixture, dedicated community
and unique participants. Release identities and hashes are in `releases.json`.
The original comparison is in [REPORT.md](REPORT.md). The repair validation and
faster fresh-join comparison are in [FIXES.md](FIXES.md).
The requested five fresh trials per build, comparing 8 with our repaired 10
branch using one unchanged Android driver, are in [REPEAT5-RESULTS.md](REPEAT5-RESULTS.md).
That report retains every trial, including the failed 8 reply, and links the
full JSON/CSV data and paired statistics.

Run from this worktree. Keep requests, invitations, screenshots and native logs
under `.connection-runs/` with mode 0700: historical builds log private keys and
invitations. The existing Electron harness creates unique `e2e_*` profiles under
the OS app-data directory; this driver restricts each profile to mode 0700 and
records its path. Archive only those owned profiles under `.connection-runs/`
after shutdown. Do not commit raw logs or profiles.

## Desktop peer

Install the existing `packages/e2e-tests` dependencies, extract the appropriate
release AppImage. Install Xvfb on Linux; the peer starts its own X server and
records its display/PID in `display.json`. Create a private config:

```json
{
  "output": "/absolute/private/peer",
  "binary": "/absolute/extracted/@quietdesktop",
  "endpoint": "ws://localhost:3309",
  "username": "ownerUniqueToThisRun",
  "release": "9.0.2",
  "community": "uniqueCommunity"
}
```

```sh
IS_E2E=true TEST_MODE=true E2E_NO_SANDBOX=true LOG_TO_FILE=false \
  node scripts/connection-regression/desktop_peer.cjs /private/config.json \
  > /private/desktop.log 2>&1
```

`E2E_NO_SANDBOX` is an opt-in for unpacked historical Electron releases whose
sandbox helper cannot run in this environment. The peer creates a community
through the real server offer, username and terms UI. `ready.json` contains the
private invitation and profile identifier. To reopen that profile, add its
`profile` value to the config. Never use a reused community for a fresh baseline:
abandoned registrations and prior transport interruptions alter its state.

Submit JSON files atomically to `requests/`; corresponding `responses/` files
record success or failure. Commands: `send` with `message`; `wait` with `message`
and `username`; `stop`; `launch`; `shutdown`. `stop` snapshots the driver's owned
process tree, closes the app and verifies that every process has exited.
A controller remains available after `stop`; use `shutdown` when finished.
Never share an X display between simultaneous peers: overlapping windows can
change renderer scheduling. A `display` config override is available for an
already dedicated display. `shutdown` also stops the automatically owned Xvfb.

## QSS fixture and Android

Use `packages/mobile/scripts/qss-e2e/fixture.py` with a checkout at the release
and its exact QSS/auth submodule commits. The fixture builds real pinned QSS,
Postgres and Redis. Its public hCaptcha test keys are verified through the real
verification endpoint. Push delivery is disabled; encrypted message storage is
real. Do not point these scripts at production or another task's fixture.

```sh
python3 packages/mobile/scripts/qss-e2e/fixture.py up \
  --checkout /private/release-checkout --output /private/qss \
  --port 3309 --sudo-docker
```

Select an explicitly dedicated emulator. Untouched release APKs are ARM64;
prefer a native ARM64 emulator on Apple Silicon. Verify native bridge `0`.
Enable and connect emulator Wi-Fi (`cmd wifi connect-network AndroidWifi open`).
Forward the fixture port using `adb reverse`. For a remote Mac, first forward
its loopback port back to the fixture host with SSH `-R`. Recreate `adb reverse`
after restarting adbd, including after `adb root`.

`adb_ssh.py` can be passed as the ADB executable. Configure `REMOTE_HOST`,
`REMOTE_ADB_SOCKET` (e.g. `tcp:5043`) and `REMOTE_ADB` (absolute remote ADB path).
It quotes every SSH argument, including keyboard input. Plain local ADB also
works. Use the same emulator, resources, network settings and UI driver for all
release comparisons.

Before each clean baseline, run an Android request with action `preflight` and
`qss_port`. It requires an external default route and a successful QSS health
response **through Android's own loopback route**. A host-only health check
cannot detect lost ADB forwarding. Clear only this dedicated app's data or
uninstall it when downgrading. Install the official APK and retain its SHA-256.

Create a private request `{"action":"join","invitation":"...","username":"unique"}`:

```sh
python3 scripts/connection-regression/android.py \
  --adb /absolute/adb --serial emulator-5596 \
  --output /private/join-ui --request /private/join.json
```

The join measurement starts before pressing the username Continue button and
ends when the channel list appears. It includes terms/navigation/UI polling;
it is not a packet-level connection latency. Whole-command timing additionally
includes typing the invitation and username.

### Complete fresh-release run

`release_run.py --config /private/run.json` checks the peer's release identity,
QSS/auth pins, Android network routes and installed official APK digest, then
runs fresh join, normal bidirectional delivery and QSS-paused Tor delivery.
An explicitly configured diagnostic control is verified against its original
release and labeled separately in the results. The runner uninstalls only `com.quietmobile` on the explicitly selected test emulator.
Use a fresh output directory and a fresh desktop community for every run.
Verify the desktop AppImage against `releases.json` before extracting it.

```json
{
  "release": "9.0.2",
  "apk": "/absolute/9.0.2.apk",
  "adb": "/absolute/adb",
  "serial": "emulator-5596",
  "peer": "/private/peer",
  "fixture": "/private/qss",
  "username": "mobileUniqueToThisRun",
  "output": "/private/fresh-run",
  "desktopLog": "/private/desktop.log"
}
```

For fast invitation paste and native UI timing, build and install the standalone
instrumentation driver on the same dedicated emulator:

```sh
python3 scripts/connection-regression/build_android_driver.py \
  --sdk /absolute/android-sdk --output /private/new-driver-build
adb -s emulator-5596 install /private/new-driver-build/driver.apk
adb -s emulator-5596 shell am instrument -w -r \
  -e request '{"action":"selftest"}' org.quiet.connectiondriver/.Driver
```

Retain the build receipt and require `nativeTextAndClickVerified: true` with
`INSTRUMENTATION_CODE: -1`. The helper instruments its own package and uses
Android UiAutomation to touch and inspect Quiet's visible UI. It leaves the
Quiet APK unchanged. It focuses the native input before replacing text, checks
that replacement, and dismisses the keyboard before pressing buttons. The real
app must deliver an exact message to the desktop as well as passing the helper's
input self-test. Button taps wait for stable bounds after keyboard dismissal.

Add `"driver": "instrumentation"` to the run config. Install the same helper APK
for every comparison; its installed digest is recorded in `preflight.json`.
Do not combine this option with `remoteJoin`. The driver already runs on Android
and does not need a host round trip for each onboarding action. `joinSeconds`
and `wholeUiSeconds` use Android's monotonic clock; `controllerSeconds` includes
the host command overhead. `transportOrder` defaults to `["live", "tor"]` and
also accepts `["tor", "live"]`. Keep pacing and phase order consistent within a
comparison: a slow controller can hide an early connection delay.

The older CLI driver remains available for reproducing the original report.
When `adb_ssh.py` drives a Mac, `apk` is a path on that Mac. Copy `android.py`
there and add `remoteJoin` to run the onboarding macro on the emulator host:

```json
{
  "host": "user@mac-host",
  "root": "/absolute/private/mac-run",
  "adbSocket": "tcp:5043",
  "python": "/absolute/python3",
  "adb": "/absolute/platform-tools/adb"
}
```

The root contains the copied `android.py`. The runner sends the invitation over
SSH stdin into a private request file. One SSH session runs the entire macro;
one SSH handshake per key event roughly doubled onboarding in calibration and
changed its timing relative to Tor's fallback timer. Use consistent pacing.
Full native logs and parsed readiness/peer events are captured after each phase.

## Delivery and transport isolation

```sh
python3 scripts/connection-regression/scenarios.py \
  --adb /absolute/adb --serial emulator-5596 \
  --peer /private/peer --username mobileUniqueToThisRun \
  --scenario live --output /private/live.json
```

Run `live`, `resume`, and `offline` in that order, with `tor_only.py` before
`offline` if both transports are being compared. `resume` backgrounds the app
for 20 seconds, sends a new desktop message, foregrounds the app and waits for
that exact message. `offline` stops mobile, sends a unique desktop message,
verifies desktop process exit, then cold-starts mobile and requires the message
inside the actual general channel. The desktop remains stopped afterward.
A failed retrieval can also reflect a message that never reached server storage;
do not label that failure specifically as a download or startup regression.

```sh
python3 scripts/connection-regression/tor_only.py \
  --adb /absolute/adb --serial emulator-5596 \
  --peer /private/peer --username mobileUniqueToThisRun \
  --fixture /private/qss --output /private/tor.json
```

This pauses only the owned QSS service, generates a fresh unpredictable token,
and requires both UI directions while QSS remains paused. The fixture's path,
project name and compose hash are checked before mutation. QSS is unpaused in
`finally`, including on failure. A bootstrap log or a Tor process alone is not
proof that the tested message used Tor.

Desktop-to-mobile waits up to 600 seconds in the Tor test. The desktop exact
reply assertion has a 180-second deadline starting after tapping Send. It
retries only the selector's exact-message timeouts; driver/session errors fail
immediately. Earlier exploratory runs started a 60-second assertion before
keyboard entry and therefore allowed only about 35 seconds after Send. Those
timeouts are censored observations, not proof that delivery requires QSS.
UI polling and SSH add several seconds to receive measurements. Do not infer
small latency differences from single samples or compare unlike deadlines.

`cold_tor.py` measures three force-stop/restart trials by default. It requires an
actual backend connection event containing an onion multiaddress. It records
the separate Tor-ready event when present; a peer may connect before that flag.
Pass `--qss-port`, `--adb`, `--serial`, `--output` and optionally
`--wait-connected-first` to establish the initial peer before restart trials.

## Single-change ARM diagnostic control

`patch_tor_control.py --source release.apk --output control-unsigned.apk`
backports only the Android Tor PID query from `f314294f4` inside the bundled
backend. This **changes application code** and is labeled a diagnostic control.
All other payload entries, including native libraries and frontend, remain
identical. Zipalign/sign with a disposable test key, then call
`verify(source, signed_control)` and retain the returned receipt.
For a fresh run, set `apk` to the signed control's device-host path
and add the following local-host paths to the run configuration:

```json
{
  "controlApk": {
    "source": "/private/official-9.0.2.apk",
    "apk": "/private/signed-9.0.2-detector.apk"
  }
}
```

The runner checks the original release digest, verifies that only the process
query changed, and checks the installed control digest. The result records
`artifact: "androidProcessQueryFix"` and the full verification receipt. Compare
9 and 10 with this same repair applied to both to isolate any additional delay.

For a same-profile A/B, also re-sign the unmodified release with that key, verify
all non-signature entries against the official release, and install each with
`adb install -r`. Verify the extracted runtime `files/nodejs-project/bundle.cjs`
hash after each switch; an APK update alone is not proof the new bundle ran.

## Synthetic x86 diagnostic builds

`prepare_apk.py` adds x86 native libraries and a matching classic-level binding
to an official APK. It preserves every original application entry except META-INF
metadata and the two native-loader indexes, which receive checked appends.
It rejects changed JS, bytecode, resources, unknown additions, duplicate entries
and mismatched dependency hashes. Zipalign and sign the output with a disposable
test key, then re-run `verify` against its native-entry hash manifest.

This is an architecture experiment, not an untouched release. Match React
Native, Node, Tor and the JNI bridge source. A newer native embedding bridge can
change behavior even when all release JavaScript remains identical. The ARM
translation layer on x86 emulators can also stall Tor's forked child. Do not
present either limitation as a production version regression.

## Tests and cleanup

```sh
python3 -m unittest discover -s scripts/connection-regression -p 'test_*.py' -v
node --check scripts/connection-regression/desktop_peer.cjs
node --check scripts/connection-regression/desktop_command.cjs
```

Focused source validation on the alpha baseline:

```sh
NODE_OPTIONS=--experimental-vm-modules node packages/backend/node_modules/jest/bin/jest.js \
  --config packages/backend/package.json --runInBand --runTestsByPath \
  packages/backend/src/nest/tor/tor.service.spec.ts \
  packages/backend/src/nest/libp2p/libp2p.connection-protector.spec.ts --forceExit
QUIET_ANDROID_TEST_SERIAL=emulator-5596 QUIET_ANDROID_TEST_AVD=connection-arm \
  QUIET_ANDROID_TEST_ADB=/absolute/adb \
  NODE_OPTIONS=--experimental-vm-modules node packages/backend/node_modules/jest/bin/jest.js \
  --config packages/backend/package.json --runInBand --runTestsByPath \
  packages/backend/src/nest/tor/tor-processes.android.spec.ts --forceExit
python3 -m unittest discover -s packages/mobile/scripts/qss-e2e -p 'test_*.py' -v
node --test packages/mobile/scripts/desktop-processes.test.cjs
```

The Android process test requires the explicitly named owned AVD and uses the
production PID query against actual native processes. For remote ADB, export
the adapter's environment as described above. The cold-start controller waits
for a unique app PID so a transient startup child is not mistaken for Quiet's
main process.

Optional diagnosis on a rooted dedicated emulator can capture loopback traffic
with Android's `tcpdump` while the E2E runs. Keep that PCAP private: Tor control
authentication and local app data may be present. Extract only complete
`status/bootstrap-phase` response timestamps, progress and tags for a public
report. Readiness log timestamps and packet timestamps share the device clock;
UI delivery durations use the controller's monotonic clock. Do not subtract
host and device timestamps to claim subsecond cross-machine latency.

Unit tests exercise real APK ZIP roundtrips, release/dependency tampering,
missing loader indexes, exact UI matching, stale/failed peer responses, route
failures, release/auth pairing, native event parsing, single-change control
validation, offline exit requirements and restoring QSS after test failure.
The release comparison itself supplies real multi-process E2E coverage.

After preserving evidence, shut down each owned peer, stop the owned fixture
projects with the fixture CLI, and stop only the dedicated emulator/ADB server,
SSH tunnels and X display. Retain compact private evidence; remove only this
task's large SDK/AVD files if disk space is needed. Commit completed work on this
same worktree branch before handoff or review.

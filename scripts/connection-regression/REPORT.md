# Android connection comparison: 8.0.0, 9.0.2, 10.0.0-alpha.0

Tested September 12, 2026. **A conditional Android Tor readiness regression is
reproduced; a consistent regression in end-to-end message delivery is not yet
established.** The readiness defect remains in the named alpha. Normal QSS
delivery, short background/resume, and QSS-only offline retrieval did not show
a material difference in these samples.

Joining is the leading suspected user-visible scenario, but the exact slow step
remains uncertain. The completed comparison did **not** reproduce a slower
username-confirmation-to-channel-list transition: that took about 11 seconds in
all three versions. Its reproduced delay concerns Tor readiness and delivery
after joining. It therefore does not yet establish that this defect explains
the originally perceived joining slowdown.

For a focused follow-up, distinguish invitation submission, channel-list
appearance, and the first exact message received in each direction. Measure
normal QSS-enabled behavior as well as isolated Tor behavior. The existing whole
onboarding sequence took about 53 seconds, and Tor-only sends started about
101 seconds after Tor initialization; it does not cover rapidly pasting an
invitation and immediately attempting Tor-only delivery.

## What actually ran

Published, unmodified ARM64 Android APKs on a dedicated native ARM64 Android 11
(API 30) emulator on an Apple M1 Mac. Native bridge was `0`: no ARM translation.
The emulator used two cores, 2 GiB RAM, 720×1280 display and the real Tor network.
Each mobile version joined a matching published Linux Electron desktop release
through the real invitation, registration and terms UI, in a fresh community.
All APK and desktop AppImage SHA-256 values were verified; see
[releases.json](releases.json) for exact release, backend, native and server pins.

Each version used its own real QSS/Postgres/Redis fixture at that release's
QSS/auth commits. Authentication used the public hCaptcha test keys against
the real verification endpoint. Push notifications were disabled. Android's
external route and its own forwarded QSS health endpoint were checked.

QSS-enabled delivery can use either available transport. To prove delivery
without QSS, the harness paused the owned QSS container, generated a new random
message token, required exact message/author matches in both visible clients,
and checked that QSS remained paused until both assertions passed. It restored
QSS in `finally`. A bootstrap message alone was never counted as Tor delivery.

## Final comparison with isolated desktop displays

All three clean runs completed fresh join and exact bidirectional UI delivery,
both with QSS enabled and with QSS paused. Each desktop had its own X server.
Onboarding ran natively on the Mac with identical driver pacing; its whole UI
sequence took 53.34, 52.89 and 52.36 seconds respectively. Tor-only scenarios
started 102.07, 101.28 and 100.86 seconds after mobile Tor initialization.

| Measurement, seconds | 8.0.0 | 9.0.2 | 10.0.0-alpha.0 |
| --- | ---: | ---: | ---: |
| Username Continue → joined channel list | 10.90 | 11.19 | 11.28 |
| Tor initialization → internal ready event | **46.88** | **122.86** | **122.88** |
| QSS enabled, desktop → phone | 4.21 | 4.17 | 4.19 |
| QSS enabled, phone → desktop | 2.02 | 1.96 | 1.89 |
| QSS paused, desktop → phone | **4.28** | **35.27** | **192.65** |
| QSS paused, phone → desktop | 19.24 | 1.99 | 1.99 |

This reproduces a slow fresh-connection path on Android and a readiness delay
that persists in the alpha. It does not show every messaging direction becoming
slower: 8.0.0's reply was slower in this trio, and exploratory repeats had large
Tor delays even on 8.0.0. There is one completed run per version under these
final matched conditions; do not treat the table as a statistical ranking or
attribute the alpha's entire 193-second transfer to the readiness defect.

## Reproduced readiness failure

All three published Android backends run a GNU-style `pgrep -af` command to find
their Tor process. On the tested Android Toybox, that combination fails to match
the data-directory argument: `pgrep -af TorDataDirectory` returns no PIDs, while
`pgrep -f TorDataDirectory` finds the live Tor process and its shell. There is no
stderr error; this is a command-semantics mismatch, not a rejected option.
The health watcher consequently reports a live Tor process missing about 2.5–3 seconds
after startup and attempts to restart it. Cleanup checks for process name `tor`,
but the executable is `libtor.so`; the original process survives. The replacement
exits with status 1, and readiness detection falls back to the 120-second timer.

8.0.0 also actively queries `isBootstrappingFinished()` while launching a
community. With the tested fresh-onboarding timing, that discovers readiness
before the fallback. 9.0.2 and the alpha use the cached `tor.bootstrapped` flag
instead and register hidden services for publication when readiness is marked.
Those changes are in
[`0d0c4d911`](https://github.com/TryQuiet/quiet/commit/0d0c4d911bbfdd6632f6eadd03b3b89430755052).
The interaction explains why an older process-detection defect can become more
visible after 8.0.0; the bad process query itself is present in all three.

Observed original 9.0.2 startup sequences reached the ready event after
122.834 and 122.876 seconds from Tor initialization. An isolated-display 8.0.0
fresh join reached it after 50.744 seconds, before its fallback. A separate
alpha calibration reached it after 242.994 seconds, after another fallback.
These are backend readiness events, **not interchangeable with first successful
onion connection or first delivered message**.

The smallest tested control backports only the Android PID query from the
existing fix
[`f314294f4`](https://github.com/TryQuiet/quiet/commit/f314294f4ba2947717e8d577d51e5c11fea1c29a):

```text
pgrep -f "${this.torDataDirectory}" | awk -v detector="$$" '$1 != detector'
```

The diagnostic 9.0.2 ARM APK changed exactly one non-signature payload entry,
`assets/nodejs-project/bundle.cjs`, with exactly this replacement. Native
libraries, frontend, Java bytecode and remaining payload were byte-identical.
It reached readiness in **10.264 seconds on fresh launch** and **5.304 seconds
on a same-profile restart**, without the false missing-process event. The
actually extracted runtime bundle hash was checked after installation.

This isolates a readiness defect, not a general latency cure. In a same-profile
control using an otherwise unchanged, re-signed 9.0.2 APK, the original backend
established its first onion connection in 15.87 seconds from launch even while
its ready flag was false. The fixed backend took 21.33 seconds. Corresponding
QSS-paused replies took 1.99 and 22.78 seconds. A successful connection can
precede the internal ready flag; Tor circuit/descriptor state also matters.

## Delivery and reconnect observations

The following early samples used the same device and driver, but the desktop
peers shared an X display. They are exploratory and must not be used to rank
release performance. Times include UI polling/SSH overhead.

| Path, seconds | 8.0.0 | 9.0.2 | 10.0.0-alpha.0 |
| --- | ---: | ---: | ---: |
| QSS enabled, desktop → phone | 4.31 | 4.29 | 4.55 |
| QSS enabled, phone → desktop | 2.12 | 1.84 | 2.09 |
| Foreground → visible message after 20 s background | 5.66 | 5.62 | 5.55 |
| Cold launch → QSS-stored message inside channel, desktop stopped | 27.02 | 27.37 | 25.97 |
| Cold launch → first onion connection, three restarts | 31.61 / 15.38 / 36.83 | 28.84 / 20.80 / 34.72 | 15.37 / 15.38 / 116.60 |

An early Tor-only run delivered both ways quickly on 8.0.0, while 9.0.2 and the
alpha missed the initial reply deadline. That did **not** survive repetition as
a consistent version difference: a subsequent 8.0.0 inbound transfer took
92.35 seconds, and a subsequent original 9.0.2 reply took 2.43 seconds. Initial
reply assertions also began before typing and allowed only about 35 seconds
after Send. Later tests allow 180 seconds after Send. A late reply observed after
QSS was restored does not prove that restoring QSS was necessary.

## Limits and excluded runs

- This is a native ARM Android emulator result, not a physical-phone or iOS
  result. There is no iOS validation in this report. Background tests cover
  a 20-second transition, not long Doze, push wakeups or cellular handovers.
- Tor timing is variable, sample counts are small, and version-paired QSS servers
  intentionally differ. These are release-stack comparisons, not an isolated
  client-only benchmark against one fixed server version.
- Early desktop peers shared a virtual display. A renderer screenshot timed out;
  the final harness gives each peer a separate X server. The shared-display
  measurements remain exploratory even where both UI assertions passed.
- A calibration ran onboarding through a separate SSH session for every input
  operation. That took 117 seconds instead of roughly 53–59 seconds and changed
  timing relative to Tor startup. The final runner executes the complete
  onboarding macro on the Mac in one SSH session.
- Initial ARM-on-x86 emulator trials stalled inside Tor's fork. Synthetic native
  x86 trials also exposed a JavaScriptCore/native signal issue on 9/10 that a
  newer JNI embedding bridge avoided. Neither establishes an ARM production
  regression; those trials are excluded from the release latency comparison.
- Initial Mac runs without a working external route, lost ADB reverse forwards,
  reused/abandoned registrations, host-command timeouts and UI automation
  failures are excluded from successful transport measurements.
- Cold-launch timing spans host and Android clocks. A final clock probe bounded
  their offset between -0.05 and +1.25 seconds; this is another reason not to
  infer small differences. Tor initialization-to-ready intervals use only the
  Android clock. Log parsing counts explicit onion-address connection events;
  it can miss an earlier inbound connection reported with a loopback address.

## Reproduction and evidence

[README.md](README.md) documents the real desktop/mobile drivers, QSS isolation,
restart trials, official-release runner and narrowly patched diagnostic control.
[measurements.json](measurements.json) retains sanitized numerical observations
and the paths/hashes of their private evidence. Raw native logs, UI dumps,
invitations, profiles and fixture state stay under the ignored
`.connection-runs/` directory because historical builds log private keys.

Validation: 26 harness tests passed, Python/Node syntax checks passed, and all
three final official-release multiplayer runs passed their join and both
bidirectional transport phases. All final raw-evidence hashes were checked
against the sanitized measurements. The review excluded architecture artifacts,
short reply deadlines, shared-display timing and host failures from the final
comparison, and corrected the process-query diagnosis against the actual device
output (empty matches, not an option error).

Cleanup: all owned desktop peers/displays, QSS fixtures, Android emulators and
SSH forwards were stopped. The Mac's dedicated ADB server was stopped and its
temporary SDK/AVD/APK copies removed after archiving compact evidence. Desktop
profiles and fixture data were retained privately; unrelated services and the
existing iOS simulator were left alone.

The concrete follow-up supported by this investigation is to include and test
the Android process-query fix, with separate assertions for absence of a false
restart, timely readiness, actual onion connection, and exact bidirectional
message delivery. The measurements do not support claiming that this one fix
resolves QA's entire perceived-slowness report.

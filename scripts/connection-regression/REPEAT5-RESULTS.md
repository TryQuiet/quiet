# Five fresh Android trials: 8.0.0 versus our repaired 10 branch

Measured September 13, 2026 on `fix/mobile-connection-regressions-8-9-10`.
This is the requested new comparison: five fresh installations of each build,
alternating 8, 10 throughout. Earlier exploratory trials are not mixed into it.

## Outcome

Our repaired 10 branch had faster median Tor connections and message delivery
in this sample, but a slower visible join step. The first Tor connection took
**30.940 seconds median on 10 versus 49.426 on 8** (37.4% lower); the means were
58.308 versus 82.889 seconds. Version 10 connected faster in three pairs and
slower in two. It is not uniformly faster.

The first Tor-only desktop-to-Android message took **1.517 seconds median on 10
versus 39.734 on 8**. Complete bidirectional tests passed **5/5 on 10 and 4/5 on
8**. The failed 8 reply is retained below. QSS-enabled exchanges passed in all
ten trials and remained around 1.5–2 seconds.

The channel-list join step was slower on 10 in all five pairs: **5.702 seconds
median versus 4.545 on 8**, a difference of 1.157 seconds. These measurements
support the specific Android readiness repair, not a claim that every part of
joining is now faster than 8. One repaired 10 cold start still needed 152.731
seconds to connect, so long Tor startup has not been eliminated.

## Every trial

All times are seconds. QSS-enabled phases allow the application's normal
transports. QSS is paused throughout the Tor phases, so both fresh exact messages
must travel over Tor. Down/up means desktop → Android / Android → desktop.
A missing value is not a zero-second result.

| Build / trial | Join UI | Tor init → ready flag | Tor init → first peer | QSS enabled down / up | Tor only down / up | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 8 / 1 | 4.471 | — | 233.958 | 1.667 / 2.091 | 206.526 / — | Failed: app shutdown on onion collision |
| 10 / 1 | 5.702 | 10.412 | 19.385 | 1.518 / 1.973 | 1.417 / 2.406 | Passed |
| 8 / 2 | 4.348 | — | 36.568 | 1.667 / 1.967 | 9.232 / 3.051 | Passed |
| 10 / 2 | 5.621 | 52.775 | 65.605 | 1.617 / 1.929 | 36.832 / 2.461 | Passed |
| 8 / 3 | 4.630 | — | 49.426 | 1.718 / 2.013 | 69.442 / 2.038 | Passed |
| 10 / 3 | 5.804 | 128.415 | 152.731 | 1.417 / 1.913 | 124.735 / 2.490 | Passed |
| 8 / 4 | 5.346 | — | 67.011 | 1.667 / 1.908 | 39.734 / 2.419 | Passed |
| 10 / 4 | 5.764 | 17.739 | 30.940 | 1.517 / 2.011 | 1.469 / 2.289 | Passed |
| 8 / 5 | 4.545 | — | 27.482 | 1.417 / 2.073 | 1.467 / 22.235 | Passed |
| 10 / 5 | 4.900 | 12.745 | 22.881 | 1.568 / 2.004 | 1.517 / 2.415 | Passed |

The first 8 trial received the desktop's Tor-only message, then the application
shut down after an unhandled `550 Onion address collision`. Its reply missed the
180-second deadline (the controller returned after 181.878 seconds). Android
recorded `EXIT_SELF`, status 1, rather than a low-memory kill. The native log
places the collision at the fallback bootstrap check, after a Tor connection
already existed. This failure is retained; it is not replaced by another run.
QSS was verified paused before this exchange and remained paused at failure.
The data retain that failure receipt separately from the success-only
`qssPausedThroughout` flag, which is absent for this failed exchange.

“First peer” is the first authenticated libp2p connection in either direction,
using Android log timestamps. Incoming onion-service connections have loopback
addresses in the log; an outgoing-only `.onion/` filter would miss them.
A first connection does not prove the subsequent message exchange will finish.
The join measurement runs from username Continue until the channel list appears.
Delivery measurements include the UI driver and controller overhead.

## Aggregate measurements

Each cell gives **observed / planned; median; mean; minimum–maximum**.
A missing delivery is retained in the failure count. The corresponding latency
statistics describe observed deliveries, with the denominator shown explicitly.
The first-peer metric includes a connection even when the later reply failed.

| Measurement | 8.0.0 | Our 10 |
| --- | --- | --- |
| Join UI | 5/5; 4.545; 4.668; 4.348–5.346 | 5/5; 5.702; 5.558; 4.900–5.804 |
| Tor init → first peer | 5/5; 49.426; 82.889; 27.482–233.958 | 5/5; 30.940; 58.308; 19.385–152.731 |
| QSS enabled: desktop → Android | 5/5; 1.667; 1.627; 1.417–1.718 | 5/5; 1.518; 1.527; 1.417–1.617 |
| QSS enabled: Android → desktop | 5/5; 2.013; 2.010; 1.908–2.091 | 5/5; 1.973; 1.966; 1.913–2.011 |
| QSS paused: desktop → Android | 5/5; 39.734; 65.280; 1.467–206.526 | 5/5; 1.517; 33.194; 1.417–124.735 |
| QSS paused: Android → desktop | 4/5; 2.735; 7.436; 2.038–22.235 | 5/5; 2.415; 2.412; 2.289–2.490 |
| Tor init → Quiet ready flag | 0/5; —; —; —–— | 5/5; 17.739; 44.417; 10.412–128.415 |

## Paired differences

10 minus 8, in seconds. Negative values favor 10. A missing comparison retains
its failed or missing measurement; it is not imputed as zero.

| Pair | Join UI | First Tor peer | QSS down | QSS up | Tor down | Tor up |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1.231 | -214.573 | -0.149 | -0.118 | -205.109 | — |
| 2 | 1.272 | 29.037 | -0.050 | -0.038 | 27.601 | -0.590 |
| 3 | 1.175 | 103.305 | -0.300 | -0.100 | 55.293 | 0.451 |
| 4 | 0.418 | -36.071 | -0.150 | 0.103 | -38.265 | -0.130 |
| 5 | 0.355 | -4.601 | 0.151 | -0.070 | 0.050 | -19.820 |

## What was fixed

The application change is the backport in `3f8e4ac5e`: use Android's compatible
`pgrep -f` process lookup and exclude the detector shell by its PID. The previous
pipeline returned no matching Tor PID on this Android image even while Tor ran.
It falsely reported that Tor had disappeared, attempted a restart, and stopped
the normal readiness watcher. The roughly 120-second fallback could then become
the next opportunity to publish readiness.

The bad lookup already existed in 8. Version 9 changed readiness and hidden-service
publication, including replacing connection-manager bootstrap checks with cached
readiness. That made the broken watcher more consequential. The exact alpha.0
APK retained the defect. The repair keeps normal readiness polling alive.

The false process-disappearance event occurred in **5/5 official 8 trials and
0/5 repaired 10 trials**. None of the 8 trials published Quiet's ready flag during
the measured window, even though all established an incoming Tor connection.
All five repaired 10 trials published readiness, each within 0.1 seconds of a
complete captured Tor 100% response.

One repaired 10 trial exercised a remaining shared behavior: the 120-second
fallback restarted a real Tor process while bootstrap was incomplete. The
capture showed descriptor progress of 64% at 8.6 seconds, 69% at 73.0 seconds,
and 73% at 105.5 seconds; readiness followed at 128.415 seconds and the first
connection at 152.731 seconds. Both slow Tor bootstrap and Quiet's existing
retry policy are present in this sample. Their separate effects have not been
isolated, and this retry behavior was not changed during the comparison.

This is an Android process-query fix. The original Linux pipeline was checked
against this experiment's live official 8 desktop Tor process and found it
correctly. macOS uses a separate `ps` query. No equivalent desktop process-query
failure or separate 9 → 10 application regression has been established. This
experiment makes no iOS behavior claim. See [FIXES.md](FIXES.md) for the earlier
8/9/alpha comparison, byte-identical packaged 9/alpha Tor service evidence, and
independent Android process-discovery validation.

## Method, provenance, and limits

- Official ARM64 8.0.0 versus exact `10.0.0-alpha.0` with only our branch's Android
  process-query fix. The patched APK is a verified, re-signed diagnostic artifact;
  a full source release rebuild is not claimed. Installed APK and extracted
  backend hashes are verified on every trial. All other APK payload entries
  match the published alpha. The branch's other changes are test infrastructure.
- One native ARM64 Android 11/API 30 emulator on the Apple Silicon Mac, two cores,
  2 GiB RAM, 720×1280 display, native bridge `0`, and 16 MiB log buffers. The
  standalone v6 UI helper has the same verified digest throughout. Linux is
  x86-64; using the Mac avoids translating or replacing release native libraries.
- Same-version official Electron peers, each with its own fresh profile,
  community, and X display. Real isolated QSS/Postgres/Redis use the release's
  exact QSS/auth pins in [releases.json](releases.json). Public Tor is used.
- Every trial uninstalls Quiet before installation. The desktop must reach both
  community and Tor readiness. A fixed 10-second settle precedes mobile
  installation/preflight; the latter adds about 30 seconds before launch.
  One setup difference is recorded explicitly: the first 8 desktop had been Tor
  ready for 930.4 seconds while Mac storage was repaired. All nine later desktop
  ages at mobile launch were 39.9–42.1 seconds and are recorded individually in
  the JSON. All mobile installs are fresh, and the primary connection clock
  starts at mobile Tor initialization.
- The Mac SDK was compacted to recover storage before mobile measurements began.
  The emulator's unused ARM32/browser components were removed, and retained files
  were compressed transparently with before/after digest verification. The
  running system image also matches the independently verified official archive.
  Both builds use this same configuration. Only test-owned files were changed.
- Raw logs, UI records, packet captures, and profiles stay private under
  `.connection-runs/`. The JSON records their evidence hashes. Tor control
  progress lists include complete status replies visible in the packet capture;
  they do not reconstruct missing TCP fragments or infer an unobserved completion
  time. In 8, a working connection can precede the next observed 100% status poll.
- These are five fresh-install observations per build on one emulator and public
  network, not a guarantee about all devices, network conditions, or background
  recovery. Both the medians and slow tails matter. All ten planned trials,
  including the failed reply, are included.

## Validation and reproduction

40 harness tests pass, including incoming-connection timing, retention of failed
trials and their QSS isolation evidence, restart timing from the original
initialization, and complete bootstrap reply parsing. The unchanged v6 helper
passed its real Android input/click self-test. All ten mobile trials verify the installed artifacts and exercise
real Android/Electron/QSS/Tor behavior. The runtime repair's earlier validation
includes 19 Tor tests and its real Android production-query test; see FIXES.md.

The fixed procedure is in [REPEAT5-PROTOCOL.md](REPEAT5-PROTOCOL.md).
[README.md](README.md) describes each executable trial and the desktop controller.
The exact ten private configurations and coordinator remain with the raw evidence.
Recompute the sanitized data from this worktree with:

```sh
python3 scripts/connection-regression/repeat_measurements.py \
  --runs .connection-runs/repeat5-8-vs-10 \
  --output scripts/connection-regression/repeat5-measurements.json
python3 -m unittest discover -s scripts/connection-regression -p 'test_*.py'
```

Full precision data: [JSON](repeat5-measurements.json), [CSV](repeat5-measurements.csv).

All ten desktop peers and both owned QSS fixtures are stopped. Desktop profiles
are archived privately. The final Android app profile was archived and verified
against the device digest before stopping the dedicated emulator and ADB server
and removing that test's disposable AVD. Its configuration is retained with the
evidence; the compressed SDK remains available. Removing the AVD recovered
about 1.27 GiB. The owned SSH reverse tunnel is stopped.

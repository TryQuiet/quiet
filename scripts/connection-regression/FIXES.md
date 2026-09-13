# Mobile connection repair validation

Tested September 13, 2026 on branch `fix/mobile-connection-regressions-8-9-10`,
based on the exact `10.0.0-alpha.0` release (`edd51028f`). This follows the
[September 12 comparison](REPORT.md); its original measurements remain unchanged.

## Two investigations

1. **8.0.0 → 9.0.2:** the conditional Android Tor readiness regression is
   reproduced and its process-discovery cause repaired. The repair is commit `3f8e4ac5e`, a clean
   backport of existing commit `f314294f4`, with a real Android regression test.
2. **9.0.2 → 10.0.0-alpha.0:** no separate application regression is established
   by these tests. With the same repair applied to both, slow descriptor
   downloads occur in both and the apparent version ranking reverses. No second
   speculative runtime patch is included. The overall messaging slowdown is not
   claimed solved.

The process query change is the only application change in the diagnostic APKs.
All other payload entries, including frontend, native Node bridge, Tor and auth,
are checked byte for byte. These APKs are re-signed diagnostic controls, not
published release artifacts. Runtime bundle hashes are checked after extraction.
Desktop peers remain the same-version published applications in all comparisons.

## Method and timing

Native ARM64 Android 11/API 30 runs on a dedicated Apple Silicon emulator with
2 cores and 2 GiB RAM. Native bridge is `0`; no ARM translation is involved.
Every trial uninstalls Quiet, installs the verified APK, and joins a new desktop
community. Each desktop owns its own X display. Each release uses its exact
QSS and nested auth pins from [releases.json](releases.json), real Postgres and
Redis, and public Tor. Fixtures are isolated from production and other tests.

The new standalone Android instrumentation helper instruments its own package
and drives Quiet through native visible UI. It does not rewrite Quiet. The first complete release matrix and first controls
use helper v5, digest
`39cbd5d56fd58242ec6b1ccdd84bb6aac02e143eda2218672bf034ea517755be`.
The paired control repetitions use v6, digest
`c2e1cb095cc0e836f79d848304d0fb74841d7cf8739bc1b48788916ab7a9b51b`.
V6 waits for stable button bounds after keyboard dismissal; pacing differences
between helper versions must not be treated as application latency changes.
It passes an Android input/click self-test and actual cross-app message delivery.
It pastes the invitation and completes onboarding in roughly 9–13 seconds;
the earlier CLI driver took about 53 seconds. Compare within each method.

`joinSeconds` runs from username Continue to the channel list, including terms.
That is separate from Tor readiness and actual delivery. Each trial first proves
bidirectional QSS-enabled delivery, pauses only its own QSS service, then proves
both directions with fresh unpredictable exact message text. QSS stays paused
throughout the Tor phase and is restored even on failure. Receive measurements
include UI/controller overhead and do not measure packet-level latency.

## Results

The accompanying `repair-measurements.json` records timings, artifact receipts,
native events and evidence hashes. Times below are seconds. “QSS” has the
server enabled; “Tor” proves both directions with QSS paused. Each row is a
single fresh community and app installation, not an average or percentile.

| Build / trial | Helper | Join UI | Tor init → ready | QSS down / up | Tor down / up |
| --- | --- | ---: | ---: | ---: | ---: |
| Official 8.0.0 | v5 | 4.119 | not observed | 1.619 / 1.884 | 45.447 / 1.994 |
| Official 9.0.2 | v5 | 5.200 | 123.258 | 1.669 / 1.997 | 120.194 / 2.004 |
| Official alpha.0 | v5 | 5.379 | 122.954 | 1.517 / 1.897 | 116.793 / 1.882 |
| 9.0.2 + PID repair, A | v5 | 5.680 | 10.429 | 1.668 / 1.955 | 1.467 / 2.807 |
| alpha.0 + PID repair, A | v5 | 4.911 | 200.742 | 1.669 / 1.983 | 187.242 / 2.386 |
| 9.0.2 + PID repair, B | v6 | 6.183 | 318.226 | 1.718 / 2.012 | 302.012 / 17.466 |
| alpha.0 + PID repair, B | v6 | 5.029 | 148.234 | 1.667 / 1.860 | 160.953 / 45.801 |

All official runs falsely reported Tor missing at about three seconds. None of
the four repaired runs did. In repaired 9 trial A, removal of the unnecessary
fallback wait translated into a much earlier usable Tor connection. The slower
repaired trials show why this does not guarantee uniformly fast first startup.
The alpha B reply includes a transport closing about 20 seconds after opening,
then reconnecting roughly 31 seconds later. That drop's cause was not isolated
as a 9 → 10 change; keep the 45.8-second reply in the results.

Two subsequent force-stop/restart trials per repaired release reused its own
profile and Tor cache. Both established outgoing onion peer connections:

| Repaired release | Tor init → ready, trials 1 / 2 | Tor init → outgoing peer, trials 1 / 2 |
| --- | ---: | ---: |
| 9.0.2 | 5.466 / 2.864 | 27.524 / 34.037 |
| alpha.0 | 5.678 / 5.333 | 29.334 / 10.900 |

These durations use native log timestamps on one device clock. They measure
cached-profile restarts, not fresh joins or message delivery. Alpha also passed
a 20-second background/resume test (2.789 seconds to the exact queued message)
and a cold offline catch-up test with verified desktop and mobile process exit
(10.688 seconds to the server-stored message while the desktop stayed stopped).

## Causal evidence and scope

Android Toybox's original `pgrep -af` query returns no matching Tor PID on this
API 30 image. It does not reject the option with an error. The watcher falsely
reports a missing Tor process after roughly three seconds. The replacement
process exits while the original remains; the normal readiness watcher stops,
and the 120-second fallback discovers readiness. Version 8 has additional active
bootstrap checks that can allow connection establishment before this fallback;
9 and alpha rely on the cached readiness flag for that path.

The replacement `pgrep -f` query excludes the detector shell by its PID. This
preserves the existing watcher and avoids the false restart. The first repaired
9.0.2 trial became ready in 10.4 seconds, with no false disappearance, and already
had a Tor connection before the QSS-paused send. This is a transport-readiness
repair; reaching the channel list quickly is not proof of usable Tor.

The packaged Tor service class is byte-identical in 9.0.2 and alpha.0 (31,771
embedded bytes, SHA-256 `df2ce1d01065eb3be3c9052ddd6fb8108482662d16144a9a71abcf59485b3c73`).
Every ARM64 native library entry is also byte-identical, including Tor, Node and
the JNI bridge. Their source Tor service, control and password-provider files
are unchanged between these release tags. This explains why the named alpha
still has the process-query defect; the repair is absent from both APKs.

A private loopback packet capture in the repeated alpha control recorded Tor's
own bootstrap responses. It spent about 140 seconds downloading descriptors,
progressing from 50% to 59%, reached circuit creation at 146 seconds and 100% at
148 seconds. Quiet published readiness about 3 ms after that complete 100%
response. Tor was still downloading descriptors during the long readiness wait.
The repeated 9 control also waited on descriptors and reached readiness at
318 seconds.

The shared 120-second fallback also calls `init()` again while bootstrap is
incomplete. After the PID repair it can actually terminate and restart the old
process: alpha A and B each did this once, and 9 B did it twice. This means these
samples combine Tor network conditions with Quiet's existing retry behavior;
they are not a pure measurement of the network. Avoiding restarts while Tor is
making progress is a possible follow-up, but its effect has not been isolated
or fixed here. This fallback code is identical between 9.0.2 and alpha.0, so it
does not establish an additional regression introduced by alpha.

Alpha's longer pnet nonce timeout was also examined. Its existing tests exercise
real duplex streams: slow nonce arrival, prompt abort/close and a bounded silent
peer. All pass. Lowering that timeout without a reproducible failure would risk
reintroducing the slow-Tor nonce problem it was intended to fix.

## Validation and exclusions

- 19 backend Tor tests pass, plus the Android test using the production process
  query against two actual owned processes, verifying their absence after exit.
- 5 existing connection-protector tests pass, including the real 60-second
  silent-peer timeout.
- 33 harness tests pass; 13 QSS fixture tests complete, with one optional native
  Redis test skipped; the real desktop process-exit test passes.
- Historical release E2E runs and diagnostic control runs provide real Android,
  Electron, QSS and Tor coverage. No full source release rebuild is claimed.
  Ignored local dependencies were reused to run the focused source tests.

Early driver calibration runs are excluded: one did not focus React Native's
composer, and another did not dismiss the keyboard correctly. The final helper
passes both real input and delivered-message checks. A later v5 repeat missed a
username Continue
tap while the keyboard resize animation moved the button. That run is excluded;
v6 waits for stable target bounds and the repeat uses a fresh community. One
restart controller saw multiple process IDs during startup and aborted before
measuring; it now waits for a unique PID, with explicit ambiguity tests. One
desktop 9 startup failed before its renderer connected to the backend; a new profile started successfully.
One alpha control desktop was mistakenly started while that release's QSS was
paused by the preceding test; its registration failed and the community was
discarded. Neither failure is counted as a mobile connection latency sample.

Raw logs can contain keys and invitations. They remain private under
`.connection-runs/` (mode 0700). Only sanitized measurements and content hashes
belong in Git. See [README.md](README.md) for reproduction and owned-resource
cleanup instructions.

The runtime fix and harness are committed separately as `3f8e4ac5e` and
`284026246`. QSS/server fixture and exact desktop-message helpers are backported
from newer testing work; release applications remain verified artifacts. Testing
was performed on Android; no iOS behavior claim is made.

After evidence collection, all owned Electron peers and displays, the three
fixture projects, the dedicated Mac emulator/ADB server and the reverse tunnel
were stopped. Desktop profiles and a compact final Android profile archive were
retained privately; the owned Mac SDK and AVD were removed.

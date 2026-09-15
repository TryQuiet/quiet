# Android alpha cold-start crash investigation

This investigation concerns the one native Android crash observed during the
Quiet 10 alpha staging-QSS tests. It is separate from the iOS message-processing
latency investigation. The crash did not recur in 20 controlled starts, including
10 new-message QSS catch-up starts. Its root cause remains unresolved; no runtime patch was made.

## Original failure

The unchanged published `10.0.0-alpha.0` APK crashed about 7.3 seconds after a
cold launch while a separate Android UI instrumentor was waiting for the channel
list. This was the first restart to retrieve a queued QSS message. Subsequent
restarts in that test succeeded.

| UTC, September 15 | Event                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| 01:29:44.932      | Launch requested                                                       |
| 01:29:52.210      | Backend creates the QSS client socket                                  |
| 01:29:52.222      | Native signal handler reports an unhandled signal 11                   |
| 01:29:52.240      | `SIGABRT` on frontend JS thread `mqt_js`                               |
| 01:29:53.075      | Backend reports QSS socket connected, while crash handling is underway |
| 01:29:53.102      | Android records app process death                                      |

The original complete tombstone was recovered from the retained emulator. Its
stack contains `libc.abort`, Android's `art::SignalChain::Handler`, and two
`libjsc.so` frames at offsets `0xb0632c` and `0xcd9764`, followed by an anonymous
executable-memory frame. The abort message is
`exiting due to SIG_DFL handler for signal 11`.

This identifies a native crash on the **frontend JavaScriptCore thread**. It
does not establish which JavaScript operation or native component caused it.
The server had not connected when the fault began, so handling a response from
that connection cannot explain the initial fault. Local QSS initialization and
concurrent Tor startup have not been excluded as possible influences.

## Artifact and device checks

- Published APK: version code `661`, SHA-256
  `27ebe40c00270fbdeba1f7eba00b88d9575e2a7a6c1eb1330bb053becd00c968`.
  The installed APK was checked before the repetitions; it was not rebuilt,
  re-signed, or patched. Its source commit is
  `edd51028f3c66c30d0692e8833fa7d0a7266b242`; the later release-branch Toybox
  process-discovery fix is absent from this artifact.
- Dedicated native ARM64 Android 11 / API 30 emulator on the Mac, 2 CPU cores and
  2 GiB RAM; no x86 translation/native bridge. The physical Android phone was not
  modified.
- Staging endpoint: `wss://qss-dev.quiet-services.app`, QSS
  `3.0.0-alpha.0`. No server configuration or deployment was changed.
- `libjsc.so` BuildId: `2da5e5fc94d5e39750b9f6175a9f5cf5c61b965c`.
  Its SHA-256 is
  `8b5f1250238835286235f890c983cd1ae608a0ca889ef94cfe5c47403b233f86`,
  byte-for-byte identical to the ARM64 library in the published
  [JSC 2026004.0.1 Maven artifact](https://repo.maven.apache.org/maven2/io/github/react-native-community/jsc-android-intl/2026004.0.1/).
- Both distributed libraries are stripped. `addr2line` falls back to a distant
  exported `JSWeakGetObject` symbol; that is not credible function-level
  symbolication. Matching unstripped symbols or a debugger capture of a recurring
  fault would be needed to identify the failing operation.
- This is not the known truncated-heap-pointer signature from
  [Quiet #3450](https://github.com/TryQuiet/quiet/issues/3450).
  The published APK already sets `allowNativeHeapPointerTagging=false`, and the
  original launch log confirms `SetHeapTaggingLevel: tag level set to 0`.
  There is no truncated-pointer diagnostic in this failure.

## Repetition protocol

The stopped AVD was copied before testing, including its existing community and
message history. This is the state after the original successful recovery; an
exact snapshot from immediately before the original crash is unavailable. The
tests preserve each attempt's Android logs, UI driver results, launch time, and
process samples. Raw logs and tombstones contain
private community data and remain outside version control.

Two arms alternate, rather than testing one entire arm first:

1. **Immediate UI:** force-stop Quiet and the separate instrumentor, launch Quiet,
   immediately start `org.quiet.connectiondriver/.Driver` waiting for
   `channel_tile_general`, and monitor the app process for 35 seconds.
2. **No startup UI:** perform the same launch and process monitoring, with no UI
   instrumentor attached until the 35-second monitoring interval has elapsed.
   Then assert the same channel UI.

PID monitoring uses ADB process inspection; it does not attach a debugger or
instrument the Quiet process. The initial main PID must survive the observation
window. A visible cached channel list alone is insufficient to demonstrate QSS
readiness: the logs are also checked for the actual QSS connection and
`qssAuthConnected` events.

A second series repeats the original **queued-message** scenario. Before every
Android launch, a copied desktop test profile sends a unique new message through
staging QSS, then fully exits. Desktop Tor networking is disabled from startup
with `--DisableNetwork 1`, and every other community member is stopped. After
the Android process-monitoring interval, the UI opens `#general` and must display
that exact new message. Thus delivery in this series requires QSS and cannot be
explained by a fast or slow Tor connection to another member.

The original desktop profile and iPhone data are preserved. The desktop copy uses
both `XDG_CONFIG_HOME` and `APPDATA` pointing to the same private test directory:
Electron resolves its backend profile using the former, while the test harness
uses the latter. One setup attempt omitted `XDG_CONFIG_HOME`; it reached cached
frontend UI with no backend community and a disabled composer. That attempt
failed before Android launched, was retained as a harness setup failure, and is
not counted as an Android startup or QSS failure.

## Results

| Scenario               | Startup UI instrumentation | Starts | Native crashes | UI checks passed |
| ---------------------- | -------------------------- | -----: | -------------: | ---------------: |
| Cached community       | Immediate                  |      5 |              0 |                5 |
| Cached community       | None for first 35 seconds  |      5 |              0 |                5 |
| New queued QSS message | Immediate                  |      5 |              0 |                5 |
| New queued QSS message | None for first 35 seconds  |      5 |              0 |                5 |

All 20 original app PIDs survived their observation windows, and all 20 launches
connected and authenticated to staging QSS. All 10 unique queued messages appeared
on Android after their sender exited. There were no native fatal-signal records,
Java fatal exceptions, or Quiet ANRs in these repetitions. The log checks also
detect the original native crash as a positive control. See the
[per-trial data](android-alpha-cold-crash-2026-09-14.json) for timestamps,
process observations, QSS milestones, and private-log checksums.

These are startup/crash checks, not connection-latency benchmarks: the protocol
intentionally waits 35 seconds before checking queued delivery. The successful
QSS checks establish functionality under this workload; they do not establish a
server-side cause for the original crash.

## Remaining limits and handoff

The original failure is still a recorded native app crash. This test cannot
attribute it to QSS, Tor startup, UI instrumentation, the emulator, or a particular
JavaScriptCore operation. It also cannot classify it as Android-wide: all
repetitions used one native ARM64 emulator, and the exact pre-crash app state was
not preserved. Five successes per arm do not rule out a rarer timing-sensitive
failure.

The useful next evidence is a recurring fault captured with matching unstripped
JSC symbols or a debugger stopping on the first signal 11, plus a dedicated
physical Android reproduction. No dependency upgrade, authentication change,
retry masking, or speculative runtime fix was made. The existing heap-tagging
mitigation was verified rather than reapplied.

Private evidence is retained under `.connection-runs/android-cold-crash/` in the
investigation worktree; the original AVD copy and tombstone also remain on the
Mac under `quiet-connection-regression-android/cold-crash-20260914/`. The test
emulator, copied desktop peer, and their owned processes are stopped at handoff.

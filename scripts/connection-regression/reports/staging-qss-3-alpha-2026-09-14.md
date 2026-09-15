# Quiet 10 alpha against staging QSS 3

**Staging QSS works with all three clients, but iOS messaging is slow.**
The published `10.0.0-alpha.0` clients created/joined a fresh community and
exchanged messages using staging `3.0.0-alpha.0`. Android and desktop delivered
live messages quickly. iOS accumulated a backlog and took tens of seconds per
exchange. An Android cold-start crash also prevents a clean reliability pass.

This run used a physical iPhone 16e (iOS 18.5), a native ARM64 Android 11/API 30
emulator on Apple Silicon, and Linux desktop. The Android APK was unchanged
(versionCode 661). The iOS IPA was development re-signed for the phone; its
frontend, backend, configuration and Info.plist matched the published artifact.
The extracted desktop app payload matched the published AppImage. This tests
the September 11 alpha, not later commits on the 10.0.0 branch.

The staging [deployment workflow](https://github.com/TryQuiet/quiet-storage-service/actions/runs/34915017100)
succeeded for `v3.0.0-alpha.0`, QSS commit
`8cc61c8afcebc20e2a0fbb470ed77923014d4068`, with auth commit
`6f534c89bceb875e8c71997943e5e76e48ccbd88`. All tests used
`wss://qss-dev.quiet-services.app`. No server was deployed, restarted or reset
by these tests. Production was not tested or changed.

## Connection and live messages

| Measurement | Trials | Median | Range |
| --- | ---: | ---: | ---: |
| Android fresh join to visible channel list | 1 | 4.61 s | — |
| iOS fresh join to visible channel list | 1 | 45.39 s | — |
| Desktop → Android message | 5 | 1.47 s | 1.42–1.57 s |
| Android → desktop message | 5 | 2.00 s | 1.93–2.02 s |
| Desktop → iOS message | 5 | 28.58 s | 4.98–31.03 s |
| iOS → desktop message | 5 | 15.18 s | 13.15–19.31 s |

These are UI observation durations including automation overhead, not network
latencies. Joins start at the username Continue button and include terms.
Android uses an on-device UI instrumentor; iOS uses WebDriverAgent over Wi-Fi.
Android trials ran first. The community's history grew during the run, so this
is not a matched-workload platform benchmark. Each measured message used a new
unpredictable value and was checked as exact text in the receiving UI. Desktop
assertions also checked the displayed author. Messages between the two mobile
clients were independently visible in the same community.

For every measured desktop/mobile exchange, the desktop's original Tor binary
ran with `--DisableNetwork 1` in a private mount namespace. Its running arguments
were verified and it never completed Tor bootstrap. The desktop application
payload was unchanged. These deliveries therefore require QSS.

Socket connections were quick: 0.37 s desktop, 0.32 s Android and 0.13 s iOS in
the initial joins. Full member admission took 1.96 s on Android and 7.65 s on
iOS from socket creation. Desktop full QSS auth completed 2.23 s after real
CAPTCHA acceptance. The earlier log text “Auth connection established” occurs
before the full exchange finishes and should not be used as the admission metric.

In a second, initially empty community, iOS joined with its only other member's
Tor networking disabled. The join completed in **29.61 s**, followed by exact
message delivery in **8.11 s desktop → iOS** and **11.85 s iOS → desktop**.
This establishes that QSS alone can complete a fresh iOS join, and that the
slowness also occurs without the earlier three-client message backlog.

## Stored delivery

All four directions passed: desktop → Android, desktop → iOS, iOS → desktop,
and Android → desktop. Each message was created while its recipient was
stopped, then retrieved after its sender stopped. The third community member
also remained stopped. Thus another peer could not supply the stored message.

Android retrieval passed on retry after the crash below. The iOS retrieval
assertion required reconnecting the Wi-Fi control tunnel; both the exact UI
text and screenshot subsequently confirmed delivery. Those two retries are
functional evidence, with no precise cold-start latency claim. Desktop cold
retrieval observations were approximately 13.5 s, including the existing
driver's startup/readiness waits.

## Failures and remaining concerns

- Before the five iOS trials above, a message missed a 60-second UI deadline
  while iOS was processing the preceding Android traffic. It was observed by
  approximately 97 seconds after submission. This failure is retained in the
  data; it is not counted as a successful under-60-second delivery.
- Android's first cold restart crashed after about 7.3 seconds in `libjsc.so`
  on `mqt_js`, with SIGABRT after signal 11. Two later starts succeeded with
  the UI instrumentor attached after startup. The app/emulator/automation cause
  was not isolated; this is not evidence of a server outage or an established
  Android-wide regression.
- One Android send helper queried before its native text field was available;
  waiting for the actual input and retrying succeeded. A separate iOS control
  connection reset interrupted a cold-start observation. Both are retained as
  automation limitations rather than server failures.

The iOS logs point to local history processing as a substantial cost. For
example, reading 24 channel messages on restart took 16.25 seconds; another
25-message read took 13.12 seconds. Repeated message-consumption log entries
were roughly 0.5–0.7 seconds apart. The release's
[channel reader](https://github.com/TryQuiet/quiet/blob/edd51028f3c66c30d0692e8833fa7d0a7266b242/packages/backend/src/nest/storage/channels/channel.store.ts)
iterates and decrypts/verifies message history again on updates. This is a
concrete profiling target, not a proven attribution to a particular crypto
primitive. The current run does not establish when this slowness was introduced.

The previous iOS auth-protocol incompatibility is resolved by the deployed
server. Working server connectivity does not resolve the remaining client
performance and restart issues.

## Evidence

Follow the [test protocol](../STAGING-QSS-3-PROTOCOL.md).
[Machine-readable results](staging-qss-3-alpha-2026-09-14.json) contain every
trial and retained failure. Private logs, invitations, screenshots and command
receipts remain under `.connection-runs/staging-qss-3-alpha/`. Original phone
data was backed up, and the physical Pixel's installations were not modified.
The test clients, dedicated displays, Android emulator, WDA runner and SSH
tunnels were stopped. The pre-existing Mac Appium service was left running.

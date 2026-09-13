# Five-trial comparison: 8.0.0 and the repaired 10 branch

Requested September 13, 2026. This protocol is fixed before the measured runs.
The question is whether our repaired 10 branch is as fast as 8 on Android.

- Run five fresh trials per build, alternating 8, 10, 8, 10, 8, 10, 8, 10, 8, 10.
- Use official ARM64 8.0.0 and the verified alpha.0 APK with only our branch's
  Android Tor process-query repair (`3f8e4ac5e`). Verify installed APK and
  extracted backend digests. Record the branch and exact artifacts.
- Use one dedicated native ARM64 Android 11/API 30 emulator, two CPU cores and
  2 GiB RAM, on the same Mac and network. Keep the v6 instrumentation helper
  unchanged for every trial. No translated native libraries or app-code
  instrumentation. Keep a 16 MiB native log buffer throughout.
- Uninstall Quiet before each trial, including the first. Each desktop peer
  uses its same-version official binary, fresh profile and community, and a
  dedicated X display. Require its Tor-ready event and community-ready UI,
  then a fixed 10-second settling period before launching mobile.
- Use each release's exact QSS/auth pins and isolated real QSS/Postgres/Redis.
  Check health through Android's own route before each launch.
- Measure visible join completion, normal bidirectional delivery, and then
  bidirectional delivery with QSS paused throughout. Use fresh exact message
  text for each exchange. Retain the same 180-second normal receive/reply and
  600-second Tor receive deadlines across both builds.
- Record native Tor initialization, readiness, the first authenticated libp2p
  connection in either direction, false process-disappearance events, and Tor
  restarts. Keep outgoing-only connection timing separate. Capture private
  loopback traffic to identify Tor bootstrap progress without changing app code.
- Retain all ten planned mobile trials, including failures and timeouts.
  Infrastructure failures before mobile starts are separately reported and may
  be retried with a fresh desktop profile. Do not replace a slow or failed
  mobile trial with a favorable result. If a controller defect invalidates a
  measurement, retain it, document the reason, and rerun the affected comparison
  under a consistent corrected procedure.
- Publish every per-trial result, success/failure counts, median, mean, range,
  and per-pair differences. Distinguish the observed five-run comparison from
  a general claim about all Tor networks or physical devices. Missing or timed
  out values are not zero-second successes and are not silently discarded.
- Preserve private logs and profiles, stop only owned resources, and commit the
  completed work on this same worktree branch before handoff or review.

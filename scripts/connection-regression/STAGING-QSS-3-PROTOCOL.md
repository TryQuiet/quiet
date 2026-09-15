# Quiet 10 alpha against staging QSS 3

Requested September 14, 2026. Use this investigation worktree and branch
`test/staging-qss-3-alpha`. Test the published application payloads against
`wss://qss-dev.quiet-services.app`; do not deploy or reconfigure any server.

1. Record the successful staging deployment, release tag, source commit and
   recursive auth pin. Verify the official Android APK and desktop AppImage
   hashes. For the physical iPhone, record the published IPA and development
   re-signing receipt, keeping frontend, backend and endpoint unchanged.
2. Create a new community through the desktop UI and real CAPTCHA. Join with
   the dedicated ARM Android emulator and physical iPhone. Preserve the
   iPhone's prior test profile before leaving it; do not reset the physical
   Android phone's existing installations.
3. Record socket connection, auth admission, storage readiness and visible
   channel separately. An early “Auth connection established” log line occurs
   before the actual auth exchange finishes and is not sufficient by itself.
4. Restart the desktop with the original Tor binary's `--DisableNetwork 1`
   option through a wrapper mounted only in the test process's mount namespace.
   Verify the running process arguments and retain the unchanged app payload.
5. Send five fresh unpredictable messages in each direction between desktop
   and each mobile client. Assert the exact message in the recipient UI; the
   desktop assertion also checks the displayed sender. Record UI observation
   durations, including automation overhead, rather than claiming packet-level
   latency. Retain deadline failures and any later delivery observations.
6. Stop both mobile apps, send a new desktop message, then stop desktop and
   verify process exit. Restart each recipient separately and require the
   stored message while every other app remains stopped. Repeat with each
   mobile client as the sole sender and desktop as the later recipient.
7. Preserve raw logs, invitations, profiles and screenshots privately under
   `.connection-runs/staging-qss-3-alpha/` and the corresponding task-owned Mac
   directories. Publish only sanitized measurements and findings. Distinguish
   successful delivery from acceptable performance, and identify untested
   environments and any automation limitations.
8. Review results against raw timestamps and exact-message assertions, stop
   task-owned clients and test services, and commit completed work on this same
   worktree branch before handoff or review.

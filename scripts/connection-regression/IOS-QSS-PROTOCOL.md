# iOS alpha QSS comparison

Requested September 14, 2026. Work stays on
`fix/mobile-connection-regressions-8-9-10` in this worktree.

1. Use the connected physical iPhone and preserve its existing Quiet 8 data.
2. Download the published `10.0.0-alpha.0` iOS artifact from workflow run
   `34565096257` (artifact `10187521355`). Verify its application version,
   endpoint, and frontend/backend hashes. Any development re-signing must keep
   those payloads unchanged and be recorded separately from the published IPA.
3. Test community setup, joining, and actual message delivery against the
   artifact's configured `wss://qss-dev.quiet-services.app` endpoint. Record
   transport connection separately from authentication, admission, and delivery.
   Do not treat a successful health check or WebSocket handshake as a successful
   QSS application connection.
4. Repeat with an isolated local QSS fixture pinned to the alpha's exact QSS
   commit `4227d340397135b120fd96a80f7538592ef520c5` and nested auth commit
   `6f534c89bceb875e8c71997943e5e76e48ccbd88`. Record the endpoint override and
   retain the same alpha application code. Use fresh, task-owned communities.
5. Prove QSS delivery using stored message evidence and delivery with the other
   peer stopped, so Tor delivery cannot masquerade as a QSS success. Use fresh
   unpredictable exact message text. Retain failed attempts and their logs.
6. If the results require a client fix, reproduce it before editing, add a test
   covering the actual failure, and repeat the affected phone scenario. Compare
   9.0.2 and bisect when an established pass/fail boundary makes that useful.
7. Keep raw app logs, invitations, profiles, and screenshots private under
   `.connection-runs/ios-qss/` and the corresponding task-owned directory on
   the Mac. Publish only sanitized findings and reproducible instructions.
8. Do not change, restart, or deploy staging or production QSS. A last recorded
   deployment is evidence of deployment history, not proof of the currently
   running server revision. Do not publish a client release.
9. Review the code, tests, and evidence in this same worktree; resolve findings,
   stop task-owned services, and preserve the phone's original data.
10. Commit the completed work on this same worktree branch before handoff or
    review.

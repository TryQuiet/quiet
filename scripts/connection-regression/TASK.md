Compare mobile connection behavior in published Quiet 8.0.0 and 9.0.2, with
10.0.0-alpha.0 as a follow-up control. Use real mobile clients, QSS, and Tor.

1. Pin and hash all released artifacts. Retain their frontend, backend and
   Android bytecode unchanged when preparing architecture-only test APKs.
2. Run fresh joins, bidirectional delivery, offline catch-up and resume/restart
   scenarios on dedicated Android emulators. Distinguish QSS delivery from
   proven Tor peer connectivity; collect timeouts as failures, not fast samples.
3. Preserve private raw logs and publish sanitized measurements with source and
   native-dependency provenance. Label synthetic architecture results clearly.
4. Test the harness using realistic success/failure cases and review the evidence
   against the requested version comparison.
5. Commit the completed work on this same worktree branch before handoff or review.

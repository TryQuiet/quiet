Fix the 8.0.0 → 9.0.2 connection regression and independently investigate/fix
the additional delay observed in 10.0.0-alpha.0. Joining is the suspected user
scenario, not a confirmed description of the slow step. Use real mobile clients,
QSS, and Tor. Keep fixes independently reviewable on the exact alpha baseline.

1. Pin and hash all released artifacts. Retain their frontend, backend and
   Android bytecode unchanged when preparing architecture-only test APKs.
2. Run fresh joins, bidirectional delivery, offline catch-up and resume/restart
   scenarios on dedicated Android emulators. Distinguish QSS delivery from
   proven Tor peer connectivity; collect timeouts as failures, not fast samples.
3. Preserve private raw logs and publish sanitized measurements with source and
   native-dependency provenance. Label synthetic architecture results clearly.
4. Validate the Android Tor process-query repair independently, including real
   device process discovery and release APK controls with only that repair.
5. Hold that repair constant when comparing 9 and 10. Investigate actual dial and
   message timelines; do not infer a second bug from one slow Tor transfer.
6. Test the harness using realistic success/failure cases and review the evidence
   against both requested version comparisons. Distinguish a fast invitation
   paste, the channel list appearing, and the first bidirectional message.
7. Complete the fixed five-per-build comparison in REPEAT5-PROTOCOL.md and
   publish every result, including failures.
8. Commit the completed work on this same worktree branch before handoff or review.

# Website release against production QSS without Tor

Requested September 14, 2026. Use the current investigation worktree and branch
`test/prod-qss-no-tor`; keep this investigation out of publishing PR #3533.

1. Read the website's actual desktop download link, verify the published asset
   digest, and use that application with fresh task-owned profiles.
2. Keep the production QSS deployment and existing communities unchanged. Use
   only newly created private test communities for the requested functional test.
3. Disable Tor networking from process startup using the original Tor binary's
   `DisableNetwork=1` setting in a task-owned mount namespace. Verify that the
   setting is effective and that no Tor circuits carried the test messages.
   Keep the application payload unchanged and normal CAPTCHA verification active.
4. Exercise creation, joining, and fresh exact messages through production QSS
   with two real clients. Test delivery after a recipient restart with the other
   peer stopped. A health check is preliminary evidence, not a functional pass.
5. Retain failure evidence and distinguish client startup, transport, CAPTCHA,
   auth and message delivery. Do not claim untested platforms or versions pass.
6. Stop only task-owned processes and mount namespaces. Preserve private logs
   and invitations under `.connection-runs/prod-qss-check/`. Keep task-owned
   profiles private at the packaged app's normal data location; record their
   paths in the private evidence directory.
7. Commit completed test support and sanitized results on this same worktree
   branch before handoff or review.

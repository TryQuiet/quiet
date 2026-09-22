# Connection cases checked for the Electron upgrade

A transport connection, an authenticated session, a durable admission, and a
synchronized database are distinct states. In particular, receiving a database
entry over an open transport does not establish its author's membership.

The upgrade keeps these boundaries. Authentication remains attached to a
physical connection ID. A local persistence retry does not repeat the network
handshake. Storage retries its heads exchange after authentication supplies the
membership graph needed to validate entries.

| Case                                                                                 | Required behavior                                                                                          | Local regression                                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| A joining transport dies before acceptance                                           | Retire its session and allow a buffered replacement to join.                                               | `libp2p.auth.lifecycle.spec.ts`                                       |
| The admitter's database write is delayed or fails                                    | Do not release acceptance before the admission is durable; fail closed on rejection.                       | `persist-admission.spec.ts`, `admitter-write-failure.spec.ts`         |
| The invitee's database write fails after acceptance                                  | Retry the local write before spending another network handshake; do not publish joined state prematurely.  | `invitee-join-retry.spec.ts`                                          |
| A transport dies while an accepted join is being persisted                           | Keep that admission exclusive until the durable write finishes.                                            | `libp2p.auth.lifecycle.spec.ts`                                       |
| Old and replacement transports overlap, including an asymmetric close                | Maintain separate authentication sessions and retain the surviving session when the old transport closes.  | `libp2p.auth.lifecycle.spec.ts`, `overlapping-transport-sync.spec.ts` |
| Entries arrive before the returning member's graph includes their author             | Reject them initially, then exchange heads again after authentication and apply the normal validation.     | `authenticated-heads.spec.ts`                                         |
| Another transport authenticates while an earlier heads request is delayed            | The newer authentication replaces the earlier refresh attempt instead of being discarded as a duplicate.   | `authenticated-heads.spec.ts`                                         |
| The first bootstrap connection dies before profiles arrive                           | Retain the authenticated bootstrap address and recover profiles and history through the normal dial queue. | `bootstrap-profile-recovery.spec.ts`                                  |
| A profile is learned through heads exchange after another peer has already connected | Announce validated profile heads so the existing peer can render that author's messages.                   | `profile-relay.spec.ts`                                               |
| A heartbeat reply takes longer than two seconds                                      | Keep the real authenticated connection alive within the configured deadline.                               | `connection-monitor.spec.ts`                                          |
| QSS has disabled P2P database synchronization                                        | An authentication event must not restart stopped subscriptions or send database heads.                     | `authenticated-heads.spec.ts`                                         |

The regression files are in `packages/backend/src/nest/libp2p/`; all except
`libp2p.auth.lifecycle.spec.ts` are in its `integration-tests/` directory. They
exercise real authentication and libp2p transports in memory. Replication cases
also use the actual encrypted OrbitDB stores. Controlled delays are introduced
at packet, dial, or persistence boundaries, rather than replacing the outcome
being asserted.

The overlapping-refresh case was found by reasoning through the sequence,
then reproduced with three peers and two independently authenticated physical
connections. With the first heads request held, the previous deduplication rule
left message history empty even after the second authentication completed.
Replacing the pending attempt lets the history arrive without releasing the
held request. Older peers need only support the existing heads protocol.

This supports a small change at the authentication/storage boundary. Combining
transport, admission, and replication into one connected flag would remove
necessary distinctions, particularly the durable-write and overlapping-session
cases. A broader authentication rewrite is outside this upgrade.

Live Tor checks remain useful for packaging and network integration. They are
not the repeatable oracle for catch-up ordering: circuit establishment and
handshake timeouts can exhaust UI deadlines without identifying an ordering
bug. Local QSS E2E covers onboarding, fanout, offline joins, and catch-up; its
separate Tor-presence assertions can be excluded when validating those cases.

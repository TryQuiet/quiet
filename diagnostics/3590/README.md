# Admission recovery investigation: #3590

Investigated on 2026-09-19 against backend commit
`0ab5e2010b40b826fad90cb8250029cbeb30fe7e`, on branch
`investigate/3590-admission-recovery`.

The [issue](https://github.com/TryQuiet/quiet/issues/3590) correctly identifies the
failed dial / retry / deadline sequence. Local runs uncovered concrete app bugs
behind it. Increasing the E2E deadline is useful test budgeting, but insufficient
as the app fix.

The initial investigation commit, `1a0443a60`, contained opt-in reproductions and
an experimental dependency control. The subsequent fix implements eager receive
buffering and cleanup in the pinned `it-ws` package, cancellation of queued and
in-flight dial work across reset, and paced retries after an admission round is
exhausted. The original recovery E2E now waits for actual invalid-proof rejection,
uses a 30-second recovery budget, and rejects an unexpected second reset.

## Fix validation

- The original invalid-then-valid desktop E2E passed with the implemented fix,
  then passed again with the typechecked production backend bundle (87.5 s).
- The same full-app 20 ms scheduling-delay reproduction passed with the original
  ten-second budget. The valid admission committed in 161.9 ms; invalid-proof
  attempts were eight seconds apart and did not hit the inbound rate limit.
- The five directly affected backend suites passed: 66 tests covering the receive
  lifecycle, patch installation, queue cancellation, auth retries and dial reset.
- Six related backend suites passed: 48 tests including transport authentication
  lifecycle, multi-peer fallback, coordinated admission, connection protection and
  peer-store recovery. This count includes the service suite from the prior line.
- Backend production typecheck and production Webpack build passed. The build
  emitted four existing dynamic-require warnings.

These runs do not cover the entire desktop/mobile E2E suite or a Tor-network join.
The report below preserves the original evidence and distinguishes the unmodified
baseline from the controlled reproduction. Raw fix logs are retained locally as
`artifacts/e2e-fixed-original.log`, `artifacts/e2e-fixed-delayed.log`,
`artifacts/e2e-fixed-production.log`,
`artifacts/fix-typed-tests.log`, `artifacts/fix-integration-tests.log`,
`artifacts/fix-typecheck.log` and `artifacts/fix-production-build.log`.

## What the app runs established

1. **Early WebSocket messages can be lost.** Installed `it-ws@6.1.5` creates its
   message listener inside an async generator. The listener is attached on the
   first `source.next()`, rather than when the socket source is created. A real
   WebSocket test receives a 24-byte nonce before that first read: the installed
   source drops it and returns the following frame instead. Moving listener
   creation outside the generator preserves the nonce.
2. **That loss reproduces the reported full-app failure sequence.** Two real
   desktop clients reject an invalid proof, reset, then submit the original valid
   invitation to the same running owner. A 20 ms yield before subsequent outbound
   source reads exposes the listener gap; it does not inject EOF or drop packets.
   The socket observer records the incoming 24-byte frame before the listener
   exists. The owner completes pnet nonce exchange and waits in Noise; the joiner
   never completes pnet. After five seconds the owner's inbound upgrade aborts,
   causing the joiner's EOF. Its eight-second retry cannot beat the ten-second
   admission deadline. The same experiment with eager listener attachment passes
   with the unchanged ten-second deadline.
3. **Invalid-proof retry rounds can hit the owner's rate limit.** Unmodified app
   logs show repeated proof rejection and immediate redial, followed by
   `inboundConnectionThreshold exceeded by host 127.0.0.1`. The eager-listener
   control still hits this limit. In `Libp2pAuth.advanceToNextBufferedPeer`, the
   exhausted failure set is cleared and `redialPeers()` dials immediately. This
   bypasses the transport-failure backoff queue.
4. **Old queued work can survive reset and delay the new admission.** In the
   passing control, an aborted old dial enqueues a retry after the queue has been
   stopped. Further calls to `TimedQueue.stop(true)` clear bookkeeping but call
   `fastq.empty()`, which is a notification callback, not a queue-clearing method.
   On restart the stale task runs with the eight-second base delay. A focused test
   of the actual `TimedQueue` reproduces this: the canceled task executes and
   displaces the fresh immediate task for the same peer.

The full-app A/B experiment deliberately exposes a scheduling window. It does not
establish that every CI failure has this cause. An unmodified local run also
exhibited the asymmetric pnet/Noise stall and five-second EOF during the invalid
phase, but lacked the extra listener instrumentation needed to prove nonce loss
in that particular run. Valid retries in the unmodified focused runs passed.

## Captured timeline

All timestamps below are UTC, from the two clients' collected process output.
See [selected log evidence](evidence.txt) and the local raw logs in `artifacts/`.

| Failing experiment, `e2e-delayed-10s.log` | Event                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| 15:09:53.440                              | Invalid invitation submitted; owner subsequently rejects its proof.             |
| 15:10:03.657                              | Expected first `resetAdmission`.                                                |
| 15:10:04.295                              | Original valid invitation submitted in the same clients.                        |
| 15:10:04.368                              | Valid attempt dials the owner.                                                  |
| 15:10:04.370                              | Observer sees 24-byte frame before the source listener; owner exchanges nonces. |
| 15:10:09.371                              | Owner aborts inbound encryption/upgrade after five seconds.                     |
| 15:10:09.374                              | Joiner gets `ERR_UNEXPECTED_EOF`; retry scheduled with `8000ms` delay.          |
| 15:10:14.361                              | Admission acquisition deadline expires.                                         |
| 15:10:14.367                              | Valid attempt emits `resetAdmission`; diagnostic names this failure.            |

The eager-listener control, `e2e-eager-10s.log`, submits the valid invitation at
15:09:55.262 and records `COMMIT_SUCCEEDED` at 15:10:03.519, with coordinator
`elapsedMs: 8152.518854`. The general channel is confirmed at 15:10:05.376. Admission
completed within ten seconds; UI polling observed it later. The eight-second delay
comes from the stale queue entry described above, not a successful retry after
another five-second handshake stall.

## Results

| Run                                                                | Outcome                                                                                                                                 |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Original E2E case, existing packaged build                         | PASS, 111.7 s; invalid rounds hit owner rate limit.                                                                                     |
| Original E2E case, current backend in the packaged shell           | FAIL, 78.9 s, separate settings-drawer close timeout before valid submission; spontaneous five-second handshake stall in invalid phase. |
| Focused diagnostic, unmodified current backend, 10 s admission     | PASS twice, 65.5 / 65.4 s.                                                                                                              |
| Focused diagnostic, unmodified current backend, 30 s admission     | PASS, 85.0 s. This alone does not demonstrate recovery from a lost valid dial.                                                          |
| Real WebSocket early-frame test, installed source                  | Expected FAIL: source returns frame 2 instead of nonce frame 1.                                                                         |
| Same socket test, eager-listener control                           | PASS: source returns nonce frame 1.                                                                                                     |
| Full app, 20 ms read delay, original lazy listener, 10 s admission | Expected FAIL, 70.8 s: valid admission resets.                                                                                          |
| Full app, same delay, eager listener, same admission budget        | PASS, 61.7 s: committed admission and general channel.                                                                                  |
| Actual TimedQueue, queued retry canceled before restart            | Expected FAIL: stale task is invoked after cancellation.                                                                                |

The failures in this table were intentional reproductions before the fix. The
queue regression has since moved into the normal `timed-queue.spec.ts` suite.
The full-app diagnostic remains opt-in via `REPRO_3590=true`; production socket
lifecycle regressions run in `websocket-source.spec.ts`.

Validation also passed for the existing five `TimedQueue` tests, ESLint on both
new Jest files, shell syntax, and Node syntax for the diagnostic scripts. The
normal queue run confirmed that the new regression stays skipped without opt-in.

## Recommended fix

Address the runtime causes together with honest E2E assertions:

1. **Preserve frames from source construction.** Patch or replace the `it-ws`
   receive adapter so early messages are buffered before consumers begin reading.
   Both the stock local transport and Quiet's Tor transport use this dependency.
   Test early data, close/error before the first read, cancellation without ever
   reading, and listener cleanup. The experimental move here proves the data-loss
   mechanism; it is not a complete lifecycle-safe production patch. In particular,
   eager buffering must not introduce unbounded lifetime or leave consumers waiting
   for `open` after a socket has already closed.
2. **Make reset cancel the previous dial generation.** Actually discard pending
   fastq work and prevent an old in-flight dial from enqueueing into a replacement
   admission. Audit task completion as well as rejection so stale callbacks cannot
   erase tracking for a new task with the same key. Extend the included regression
   to cover a late rejection across reset and an immediate fresh dial. Merely
   replacing `empty()` fixes only the pending-queue portion.
3. **Pace failed admission rounds.** Try untried connected peers immediately, then
   use bounded, cancelable retries for exhausted rounds. Avoid hammering one owner
   with the same rejected proof. Preserve fallback to other peers; a remote
   rejection alone should not automatically end the entire invitation attempt.
   Apply the same admission generation checks to this scheduling.
4. **Separate deadline coverage from recovery coverage.** Keep short, deterministic
   coordinator deadline tests. Give the successful recovery E2E a budget covering
   a failed upgrade, backoff and successful admission, with margin; add a controlled
   transient-failure test to prove recovery, rather than merely increasing a number.
   Production currently allows 300 seconds; the ten-second override is E2E-only.
   The first new dial is already intended to be immediate, so bypassing the queue
   for it does not solve the observed lost-frame failure.
5. **Require successful admission, not just a disappearing panel.** Clear captured
   output after the expected invalid reset, then assert no new reset after the valid
   submission and require the general channel. Longer term, make the join helper
   distinguish success and reset directly. The existing helper's disappearance
   check explains why CI reports a missing channel much later.

Also reconcile transport timeout configuration intentionally: local `webSockets()`
uses its own default five-second inbound upgrade deadline, while the Tor transport
is explicitly configured for 60 seconds. Changing that deadline alone only changes
how long a dropped-nonce connection stalls. Neither disabling the rate limiter nor
globally shortening reconnect delays is justified by these results.

## Reproduce

Use Node 20 and the repository's installed/built dependencies. The socket test uses
the installed backend `ws` and `it-ws` packages, with real localhost sockets:

```sh
node --test diagnostics/3590/websocket-early-frame.test.mjs
REPRO_EAGER_WS_SOURCE=true node --test diagnostics/3590/websocket-early-frame.test.mjs
```

Before the production patch, the first command failed on pristine `it-ws@6.1.5`;
the second loaded the experimental eager-listener control. With the production
patch installed, the first command passes directly. The historical eager control
is only applicable to the pristine dependency from the investigation commit.

The queue reproduction runs against the actual production class and real fastq,
using Jest's clock to avoid an eight-second sleep:

```sh
cd packages/backend
node node_modules/jest/bin/jest.js --runInBand src/nest/common/timed-queue.spec.ts
```

For desktop runs, install Xvfb and Fluxbox, supply a matching Electron ChromeDriver,
and place or link the Linux executable under `packages/e2e-tests/Quiet/`. From the
repository root:

```sh
FILE_NAME=quiet-repro bash diagnostics/3590/run-e2e.sh diagnostics/3590/artifacts/original.log
REPRO_3590=true FILE_NAME=quiet-repro REPRO_ADMISSION_TIMEOUT_MS=10000 \
  bash diagnostics/3590/run-e2e.sh diagnostics/3590/artifacts/focused.log
```

The focused test leaves the owner's Linked Devices drawer open and reuses the
original valid invitation, avoiding the unrelated drawer-close failure while
keeping the owner, endpoint and credentials the same. It waits for an actual
`INVITATION_PROOF_INVALID` before accepting the first reset. Both clients run
normally through UI, libp2p, auth, persistence and channel rendering. The runner
retains disposable client profiles and logs through the existing `IS_CI` mode;
their paths are printed in the captured output.

Build the controlled backend variants without editing shared dependencies:

```sh
REPRO_READ_DELAY_MS=20 node diagnostics/3590/build-experiment.mjs delayed-reader
REPRO_READ_DELAY_MS=20 REPRO_EAGER_WS_SOURCE=true \
  node diagnostics/3590/build-experiment.mjs eager-reader
```

Each command writes a bundle, the substituted dependency source and provenance to
`artifacts/<label>/`. For each variant, copy a compatible `linux-unpacked` desktop
build into its own `artifacts/app-<variant>/` directory, extract `resources/app.asar`
to `resources/app/` with `asar.extractAll`, move the copied archive out of
`resources/`, and replace
`resources/app/node_modules/backend-bundle/bundle.cjs` with the generated bundle.
Preserve the copied `app.asar.unpacked` native files. Link each copied executable
into `packages/e2e-tests/Quiet/` and run the focused test with its `FILE_NAME`.
Never overwrite the source build or installed dependency.

After applying the production patch, the builder detects the fixed adapter and
delays only the first read of subsequent outbound sources; listener registration
remains eager. Use `REPRO_READ_DELAY_MS=20` to rerun the controlled regression and
`REPRO_READ_DELAY_MS=0` for a diagnostic bundle without an injected delay.

## Provenance and limits

The local worktree was `/home/holmes/quiet-3590-repro`. Runs used Node 20.20.1,
the Electron desktop shell and installed dependencies from the existing
`quiet-10-secure-dms` release checkout, and freshly built backend source from the
commit above. The existing packaged build was used unchanged for the first
baseline; its original source provenance was not independently established.
The original diagnostic builds reused compiled workspace dependencies and used
`ts-loader`'s `transpileOnly` mode because cross-worktree type identities conflict.
Those experiments were not a full typecheck or a fresh build of every desktop
component. Fix validation subsequently copied backend dependencies into the
worktree and passed the production typecheck/build. The typed unit run used the
production tsconfig to resolve built workspace dependencies; the broader runtime
run disabled ts-jest diagnostics. Neither run changed repository Jest settings.
The default source-workspace Jest configuration still encounters an unrelated
`SignatureAuthor.name` type mismatch in `base-messages.service.ts` with these
borrowed dependencies. The production-config typed tests and production build
both pass; a clean CI installation remains the final check of the default setup.

The auth submodule was at the worktree's pinned commit
`eb9b4e538458b1b7d0153a284dcdfdcf4e16e5e6`. Installed `it-ws` source SHA-256:
`e125ea82f0e156f92aadea4ddce2937fd20220cc606abbc8c4f93b61c984b265`.
The experimental bundle hashes and settings are retained in
`artifacts/delayed-reader/provenance.json` and
`artifacts/eager-reader/provenance.json`.

The runs exercise local WebSockets. Tor bootstraps in the desktop background, but
these admission connections use `127.0.0.1`; this is not a Tor-network validation.
Raw logs and private application copies remain ignored under `artifacts/` because
they contain disposable account/connection data. Only narrow diagnostic excerpts
are committed. No remote issue, PR or review was posted.

Final worktree handoff step: review the diagnostic changes and commit the completed
work on this same worktree branch.

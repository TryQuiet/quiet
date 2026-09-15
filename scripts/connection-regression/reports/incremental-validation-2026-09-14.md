# Incremental message and sigchain validation

The fixes remove the repeated message-history crypto work and reuse verified
cryptographic facts during sigchain replay. They preserve message signatures and
context-dependent authorization checks. They do **not** make all sigchain updates
constant-time: a received edition in a 100-user team still takes approximately
3.4 seconds in the Linux runtime control with JIT and WASM unavailable. A measured
manifest-validation followup reduced that from approximately 6.4 seconds.

Related issues: [message growth #3536](https://github.com/TryQuiet/quiet/issues/3536),
[sigchain growth #3537](https://github.com/TryQuiet/quiet/issues/3537).
The [original physical-iPhone profile](ios-processing-profile-2026-09-14.md)
establishes the baseline. Measurements below are Linux offline controls, not
new phone or live-QSS measurements. No server data or deployment was changed.

## Implementation and safety boundaries

Quiet runtime commits: `204e9e823`, `738d27bec`, `e5d125029`, `eb4001978`, `892d6540f`.
Auth runtime commits: `62c23af8`, `28bea7c6`, `de490850`, `06cc717da`.
Auth baseline: `6f534c89bceb875e8c71997943e5e76e48ccbd88`.

* The channel index stores validated IDs and OrbitDB entry hashes, never cached
  plaintext. An arriving entry is consumed once and announces only its validated
  ID. The normal single-ID frontend request reads the entry by hash and performs
  the normal consume checks. The index is an optimization, not an authorization
  decision: reads still decrypt and verify the retrieved encrypted value.
* Initial subscribe, reconnect and auth updates rebuild the ID snapshot. Auth
  updates invalidate the old index synchronously and retry previously unreadable
  entries with the new keys/context. Epoch checks discard stale async results.
  Closing clears the index; a rejected read from the old store cannot prevent a
  reopened store from indexing its history. Cached IDs never enable access to
  cached plaintext after a role change because plaintext is not cached.
* Reducer-owned lockboxes have immutable metadata and privately held ciphertext;
  exposed bytes are copies. Key selection reuses only these owned collections
  and binds the complete caller-owned device keyset, including both secret keys,
  public keys and metadata. Returned cached keys/maps are frozen. Mutable or
  accessor-based inputs do not gain the same cache eligibility.
* Successful keyset validation and lockbox opening are reused for complete
  unchanged inputs. Structural and cryptographic facts are separate from action
  authorization. Branches, role updates and key generations still select keys
  from the current state's collection; failed validation is never remembered.
* Established commitments use a persistent radix trie. Appending an accepted
  delivery updates paths for its identities rather than rebuilding the entire
  map. Nodes shared by branch states remain immutable, and first-write-wins
  generation binding is preserved.
* Successful structural validation of owned immutable manifests is remembered.
  Arbitrary caller-owned objects, including frozen objects with changing getters,
  still validate on each call. Scope filtering and authorization still run.
* Graph signature facts bind hash, signature and the freshly resolved signer
  public key. Graph invitation proof facts bind the complete serialized signed
  input and verification context. Resolving the registered author, invitation
  claims, expiry, revocation, use counts and action permissions still executes
  during replay. Ordinary message signature verification remains uncached.
* Decryption facts bind freshly hashed ciphertext, sender/recipient public keys
  and actual recipient secret key. Saved plaintext is privately serialized and
  every returned body is a fresh deep copy, including nested bytes. Peer-provided
  plaintext is not trusted. Facts are owned by weakly held inputs; bounded 4096
  entry weak-reference indexes permit reuse across reconstructed graph objects.
  Runtimes without `WeakRef` retain correct direct-owner caching and otherwise
  perform the original crypto checks.

The earlier unpublished auth branch `fix/lockbox-caching` (`4da95f30`) pursued
the same key-reuse idea. Its deep comparison of the entire lockbox array on each
lookup still grows with history. The immutable reducer snapshots here avoid that
comparison; this is not a revival of the unsafe pre-manifest memoization.

## Counted acceptance

The message fixtures use actual protocol-4 invitations, admissions, possession
proofs, device joins and role grants. An ordinary member can reach three
lockboxes. The portable scripts below regenerate fixtures from runtime APIs in a
separate process; no private fixture directory is required.

| Work | Before | After |
| --- | ---: | ---: |
| Consume calls for 1,000 serial channel arrivals | 501,500 | 1,000 |
| Arrivals plus 1,000 single-ID fetches | Full history scanned repeatedly | 2,000 consumes, 1,000 indexed gets, zero iterator reads |
| Lockbox opens for 1,000 ordinary-member decryptions | 3,000 | 3 |
| Ed25519 keypair reconstructions for those messages | 13,000 | 4 |
| Curve25519 public-key derivations for those messages | 13,000 | 4 |
| Actual message signatures verified | 1,000 | 1,000 |

Channel operation counts are tested against the actual store class and include
real encrypted/signed message controls. The runtime-auth benchmark validates all
plaintexts and rejects changed ciphertext and signed message contents. With
normal Node/WASM, freshly generated fixtures took **84.8 ms / 81.7 ms** for
1,000 messages at 2 / 100 users. Graph loads in that ascending-size run share
common-prefix facts and must not be treated as independent cold loads.

The earlier cache-only `--jitless` control took **38.04 s / 37.29 s** for the same
2 / 100-user message counts. Keeping signatures intact leaves the JavaScript
crypto fallback expensive; the independent native-iOS primitive work addresses
that remaining cost. These Linux times are not directly comparable to phone
wall-clock times.

For received editions, a separate sender process loads the owner and creates two
successive `Team.addMessage` links. The receiver starts with the ordinary member,
decodes each saved wire graph through CRDX and calls `Team.merge`. Sender-side
validation cannot warm the receiver's facts. Each received edition verifies
**one fresh link signature and opens seven boxes at both 10 and 100 users**.
Before graph/proof/decryption caching, the same replay path performed 100 / 1,000
signature checks and 38 / 308 box opens at 10 / 100 users. That earlier control
shared sender and receiver in a process; its count is diagnostic, whereas the
new separate-sender assertion models reception.

On the original fixtures, two received editions took **741 / 730 ms** at 10
users and **6,477 / 6,241 ms** at 100 users with `--jitless`. A separate 100-user
process confirmed a genuinely cold load at **30.76 s**, with 301 decryptions and
499 signature checks, followed by editions at **6.388 / 6.343 s**. The cold-load
cost has not been eliminated or hidden by the replay cache. After the manifest
followup, the same cold 100-user run took **29.074 s**, with the same 301 / 499
crypto counts, and its editions took **3.443 / 3.388 s**, still one new signature
and seven opens each. This is a 46.5% reduction in the first-edition duration.

## Remaining measured work

The pre-followup 6.388-second received-edition CPU profile attributes approximately:

| Sampled inclusive path | Time |
| --- | ---: |
| `isKeyManifest` / base58 decoding beneath `lockboxesInScope` | 3.05 s |
| Generic hashing, across all callers | 2.57 s |
| Of that hashing: repeated encrypted-link hashes across decode/replay/validation | 1.27 s |
| Of that hashing: visible-key commitment identities | 0.70 s |
| Garbage collection | 0.04 s |

Inclusive timings overlap; do not add the hashing subrows to their parent.
The leading quadratic scan rechecked existing immutable manifests in
`lockboxesInScope`. The manifest followup retains the scope scan but removes its
repeated base58 validation; a test makes 3,000 scope queries over two owned boxes
with exactly four base58 decodes, while checking the selected scope each time.
Self time in base58 decoding falls from 2.965 s to 0.171 s. Hashing now dominates
the 3.443-second profile at 2.606 s. Fresh ciphertext hashing is part of the
mutable-input safety boundary; removing it requires a separately justified
ownership design. Repeated complete keyset commitments account for another
approximately 0.75 s and remain a possible bounded improvement.

Other residual costs remain explicit: lockbox-array concatenation and scope/member
filtering, key-map reconstruction after collection changes, graph traversal and
context-dependent reducer replay. Batch/duplicate-ID message fetches still scan
history to preserve ordering and duplicate behavior. Auth reconciliation still
consumes history. The persistent commitment trie and crypto caches do not make
those operations constant-time. Existing protocol gates on removal/rotation
remain unchanged.

## Tests and reproduction

Auth tests: **442 passing and 54 pre-existing gated skips** across team,
invitation, lockbox and CRDX graph suites after the manifest followup and WeakRef
fallback. Builds/types and scoped auth lint pass.
The integrated Quiet worktree also passed its normal diagnostics-enabled channel,
public/private message, author-impersonation, access-controller and invitation
security suites; the integration owner records the full sweep separately.

New tests cover byte aliases, secret/public/symmetric key mutation, metadata and
accessor replacement, branch/generation divergence, role changes and retained
removal transforms, changed signature/hash/key/proof contexts, message tampering,
unknown entries becoming readable, duplicate IDs, concurrent arrivals and both
successful and rejected old reads during close/reopen. They also assert scalable
operation counts, not only equal outputs.

Build dependencies against the pinned auth revision, then run from Quiet root:

```bash
cd 3rd-party/auth
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @localfirst/auth... build
cd ../..
node scripts/connection-regression/incremental-validation-bench.mjs \
  3rd-party/auth .connection-runs/incremental-acceptance/messages
node scripts/connection-regression/incremental-edition-bench.mjs \
  3rd-party/auth .connection-runs/incremental-acceptance/teams \
  .connection-runs/incremental-acceptance/editions
```

Each script generates missing fixtures in a child process. Use separate fixture
directories as shown: edition-only fixtures intentionally contain no messages.
Add `--jitless` immediately after `node` for the runtime control. Set
`PROFILE_SIZES=100` for a cold 100-user edition process and `PROFILE_CPU=1` to save
received-edition CPU profiles in its private output directory. Preparation is
excluded from receiver timings; JIT-disabled sender preparation takes time too.

Fixtures contain private keys and must stay in ignored `.connection-runs/`.
Only sanitized timings, counts and evidence checksums are retained in the
[result artifact](incremental-validation-2026-09-14.json). Results are local
single-host measurements with single runs per case; they are not confidence
intervals or a claim that all user-count scaling is fixed.

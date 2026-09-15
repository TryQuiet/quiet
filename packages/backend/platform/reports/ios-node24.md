# Native libsodium on the unreleased iOS upgrade

Date: 2026-09-15. Base: Quiet
[`77a075181`](https://github.com/TryQuiet/quiet/commit/77a07518137928ffa5208f99bc190044550ce0ac),
[PR #3423](https://github.com/TryQuiet/quiet/pull/3423): React Native 0.81.5,
New Architecture, embedded Node 24.18.0.

## Outcome

Native libsodium works through the production backend webpack loader in the
pinned iOS Node runtime. All six operations call the C library. This removes the
need for #3539's OpenSSL key wrappers, Ed25519 exception checks, and split box
construction. The additional device framework is 250,760 bytes (about 245 KiB),
with only a system-library dependency. The simulator binary is 236,296 bytes.
These are framework executable sizes before app-level signing/compression.

The experiment uses a 142-line C binding, a 106-line JS adapter, and source-build/
embedding tooling. libsodium 1.0.19 matches the existing wrapper's core version.
This branch addresses the native crypto layer. It does not incorporate #3539's
message indexing or auth cache changes.

## Measured results

MacBook Air ARM64, iOS 18.5 ARM64 simulator, actual NodeMobile 24.18.0 framework.
Xcode 26.3 / SDK 26.2. The benchmark verifies the same three-byte test message
1,000 times with a fixed valid signature; every result is asserted. Signatures
and keys are prepared before timing. This measures a crypto primitive, not
message decryption, network delivery, UI rendering, or a complete Quiet workload.

| Run | Existing sodium wrapper | Native libsodium |
| --- | ---: | ---: |
| Initial | 40,338.6 ms | 45.38 ms |
| Final artifact | 29,541.8 ms | 44.35 ms |

Both runs use byte-identical native binaries. The standalone probe installs its
own app and data container on a dedicated simulator. It loads the upgrade's real
NodeMobile framework; it does not instantiate React Native or the full backend.
Its bundled module uses the production webpack rule and asserts three actual
native calls (key generation, signing, verification) immediately after `ready`.

## Validation

| Check | Result |
| --- | --- |
| Host native suite, Linux Node 24.13.0 | 16/16 tests pass |
| Host native suite, macOS ARM64 Node 20.20.1 | 16/16 tests pass after selecting the macOS SDK explicitly |
| libsodium source library, host `make check` | Pass |
| Ed25519 differential corpus | All 151 cases match original sodium |
| X25519 differential corpus | All 518 cases match original sodium |
| Shared suite in embedded iOS Node 24 | 12/12 in each run; includes all 669 vector cases |
| Real webpack + compiled host addon | Correct activation before `ready` on iOS, original implementation on four other platforms |
| Malformed native arguments | Type/size, shared/detached buffers rejected; independent output arrays |
| Failure/activation behavior | Tampering rejected, missing/broken native capability retains original implementation atomically |
| Artifact cache | Stale binding and corrupted binary rejected; existing output never overwritten by builder |
| ARM64 iPhoneOS + simulator XCFramework | Source builds pass; SDK/architecture/Node-API exports checked |
| Production embedding script on Mac | Initial build, reuse, ad hoc signing, strict signature verification, and packaged license comparison pass |
| Xcode project syntax | `plutil -lint` passes |
| Existing iOS workflow routing suite | 11/11 tests pass after adding the native compatibility command |
| Full standard iOS app E2E | 25/25 starter tests plus 1/1 backend acknowledgment and restart test pass |
| Full iOS QSS E2E | 1/1 registration, storage, invitation, and restart test passes |
| Desktop + iOS QSS multiplayer E2E | 6/6 stages pass, including offline catch-up in both directions and restart persistence |

The crypto suite also compares key/signature/ciphertext bytes, bidirectional box
decryption, malformed secret/public halves, low-order/noncanonical points,
invalid arguments/encodings, input offsets/reuse, and custom export/readiness
objects. Native outputs are independent of the caller's input buffers.

Local test setup reused existing dependency installations via ignored symlinks.
The crypto reference resolved to LFA's unmodified `libsodium-wrappers-sumo@0.7.13`.
No project dependency installation or source in another worktree was changed.

### Full application and multiplayer runs

Both the staging and QSS Quiet apps were built from this experiment on a
dedicated iPhone 16e / iOS 18.5 ARM64 simulator. The desktop peer was built from
the same checkout. The QSS fixture used the checkout's exact QSS/auth gitlinks,
isolated PostgreSQL/Redis instances, and real hCaptcha public test-key verification.
Existing app E2E tests and Detox synchronization were retained. All **33 tests
passed with zero skips**.

The QSS one-client test observed stored log count and sequence advancing from
3 to 4, then restored the acknowledged message after restarting the app. The
six-stage multiplayer suite verified joining and history retrieval while iOS
was stopped, online messages in both directions, offline catch-up with the
sender's processes stopped in each direction, and the complete five-message
conversation after another restart.

The running full apps mapped the bundled `QuietSodium` framework. Strict signing
verification and the embedded license comparison passed. Captured app logs from
all four suites contain zero native-crypto fallback warnings. The framework's
unsigned executable matches the standalone probe's tested binary exactly.

The additional macOS host test initially exposed missing SDK selection when
invoking the resolved `clang` path (`ld: library 'System' not found`). The build
recipe now selects the macOS SDK explicitly; the actual Node 20 native suite
then passed 16/16, including upstream `make check`. iOS compiler flags are
unchanged. Both iOS slices were rebuilt with the final recipe and are
byte-identical to the E2E-tested binaries. The final manifest records the updated
builder hash; the E2E evidence retains the original app-build recipe hash too.

The Mac used an isolated worktree and copies of existing native dependency
caches, with frozen auth installation and deployment-mode CocoaPods installation.
These are local Mac results; the hosted GitHub workflow has not been run.

## Evidence

- [Initial iOS runtime result](ios-node24-initial.json)
- [Final iOS runtime result](ios-node24-final.json)
- [Final source-build manifest](ios-build-manifest.json)
- [Full app E2E counts, test names, source hashes, and native loading evidence](ios-e2e.json)
- [Build, runtime, and reproduction instructions](../README.md)

Both runtime reports' Node framework SHA-256 matches this branch's pinned
`runtime.json`. Both addon hashes match the final build manifest. The manifest's
binding and builder hashes match the committed source. Only the Node-API
initializer and version entry point are exported from the addon, preventing
its libsodium symbols from interposing on the app's existing Sodium pod.

## Remaining work before production

- Run on a physical iPhone, including complete message processing, restart, and
  interoperability with released clients. Simulator timings do not establish
  phone latency.
- Combine with #3539's indexing/auth work when evaluating total message-processing
  improvements.
- Review the small native boundary and build recipe, select the production
  libsodium version, and exercise distribution signing. Hosted CI execution of
  the added command remains untested.

Assessment: a manageable native integration, with promising runtime results and
small binary overhead. The main continuing cost is maintaining the source build,
version pin, and device/distribution validation. This is a working prototype,
not a production-readiness claim.

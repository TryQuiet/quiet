# Native libsodium experiment for iOS Node 24

Branch base: `upgrade/react-native-new-architecture-node` at
`77a07518137928ffa5208f99bc190044550ce0ac` (Quiet #3423, React Native 0.81.5,
New Architecture, embedded Node 24.18.0). This experiments with replacing
[#3539's OpenSSL adapter](https://github.com/TryQuiet/quiet/pull/3539) with a
small Node-API binding to native libsodium. The message/history indexing and
auth cache changes from #3539 are separate from this branch.

## Runtime

The production backend webpack rule wraps the actual resolved
`libsodium-wrappers-sumo` export. On iOS, `ready` includes loading and checking
`Quiet.app/Frameworks/QuietSodium.framework/QuietSodium`. It then replaces six
operations: Ed25519 seed keypair/sign/verify, X25519 public-key derivation, and
`crypto_box_easy`/`crypto_box_open_easy`. Each binding calls libsodium directly.
There is no hand-written curve math, OpenSSL conversion, or separate signature
acceptance policy. Other operations continue to use the existing wrapper.

The current pin is libsodium **1.0.19**, matching the core in LFA's
`libsodium-wrappers-sumo` **0.7.13**. Both versions are checked before activation.
Keys, signatures, nonces and ciphertext remain compatible. This compatibility
pin is an experimental baseline, not a decision to freeze production crypto
upgrades indefinitely. A version update needs a fresh differential review.

A missing framework, unsupported version or failed startup check retains the
original implementation and emits a warning. Export replacement is atomic.
Runtime signature/decryption failures remain failures. The C boundary checks
byte types and lengths, rejects shared/detached buffers, and returns independent
arrays. Only two Node-API entry symbols are exported, isolating this library
from the app's existing Sodium pod. Node and Tor retain their own dependencies.

## Build and packaging

`native-libsodium/build.cjs` downloads the official 1.0.19 source tarball and
verifies its pinned SHA-256 before extraction. The upstream libsodium source is
unmodified. The script builds a static library, then links the small binding into
a dynamic framework. Separate ARM64 device and simulator builds form an
XCFramework. The Node headers come from this branch's
pinned runtime; the binding uses stable Node-API 8. No replacement Node framework
or React Native bridge is required.

The app's **Embed native libsodium** Xcode phase builds/checks an artifact in
DerivedData, selects the SDK's slice, embeds it, and signs it with the app's
identity (ad hoc for unsigned simulator builds). A second invocation reuses a
verified artifact. Source/builder hashes and binary hashes detect stale builds
and accidental cache corruption. The adjacent manifest is locally generated and
writable; it does not authenticate build provenance against a process that can
replace both the manifest and binary. Code signing protects the resulting app
after signing. Both slices build at minimum iOS 17.1. Downloads are cached
under `native-libsodium/.build/`; artifacts and caches are ignored by Git.
The source license ships alongside the artifact and is retained here.

To create an artifact explicitly on a Mac with Xcode selected:

```sh
node packages/backend/platform/native-libsodium/prepare.cjs --ios /absolute/new/sodium-artifact
```

Source builds require a C compiler, `make`, and `tar`. The first build requires
network access. `prepare.cjs` rejects an existing stale artifact; use a new output
directory to rebuild it. Xcode uses a directory keyed by binding/builder content.

## Tests

After the normal repository and frozen auth-submodule bootstrap:

```sh
npm --prefix packages/backend run test:native-crypto
```

The dedicated suite builds the real host addon on Linux/macOS, runs libsodium's
own `make check`, then runs the compatibility, native-buffer, cache-corruption,
and production-webpack tests. The iOS E2E workflow invokes it. Ordinary Windows
backend tests do not need a new Unix C toolchain.

For a separately installed dependency tree, `QUIET_NATIVE_TEST_SODIUM` can name
its resolved wrapper entry. The tests deliberately retain an unmodified sodium
reference. The 151 Ed25519 and 518 X25519 Wycheproof vectors, malformed
secret/public halves, low-order/noncanonical points, tampering, offsets, and
input/output aliasing cover actual calls into the compiled C library.

### Actual embedded iOS runtime

The standalone UIKit probe loads this branch's **real NodeMobile 24.18.0
framework** in a separate simulator app/container. It runs the shared differential
suite and requires a module built with the production webpack rule. It asserts
that calls after `ready` reach the native addon, then measures 1,000 signature
verifications. This isolates the native dependency from RN/Tor/network startup.

Prepare a payload on a host with backend dependencies installed. The second
argument is the resolved `dist/modules-sumo/libsodium-wrappers.js` entry of
LFA's pinned wrapper, not its package directory:

```sh
node packages/backend/platform/ios-probe/prepare-payload.cjs /absolute/new/payload /absolute/path/to/libsodium-wrappers.js
```

Transfer that payload and the probe sources to the Mac if needed. On the Mac,
select Xcode with `DEVELOPER_DIR` and use an already booted ARM64 simulator:

```sh
python3 packages/backend/platform/ios-probe/run.py \
  --node-framework packages/mobile/ios/NodeJsMobile/NodeMobile.xcframework/ios-arm64-simulator/NodeMobile.framework \
  --sodium-artifact /absolute/path/to/sodium-artifact \
  --payload /absolute/path/to/payload \
  --simulator SIMULATOR_UDID \
  --output /absolute/new/probe-run
```

The result includes runtime identity, native call counts, individual test results,
binary/payload hashes, and timings. The app has its own bundle ID
`com.quiet.NativeSodiumProbe`; it does not use Quiet's stored communities.

## Evidence and remaining validation

See [the experiment report](reports/ios-node24.md),
[the latest app E2E rerun](reports/ios-e2e-after-audit.json), and
[the original app E2E results](reports/ios-e2e.json).
The [Daybreak Blue audit](reports/daybreak-audit.md) accepted the implementation
after a correction to match the wrapper's falsy output-format defaults.
All 33 app E2E tests pass: 25 starter, one native message/restart, one QSS
registration/storage/restart, and six desktop–iOS multiplayer stages. Both full
iOS app builds embed and load the signed framework; captured app logs contain
zero native-crypto fallback warnings. The host suite passes on Linux Node 24 and
macOS Node 20, and the real embedded iOS Node 24 probe passes.
After the audit fix, the Mac native suite passes 17/17 and all 33 app flows pass
again. This rerun uses the QSS app for all four suites; the starter and native
community flows choose no server. The original staging results remain available.

Physical phone message processing, production signing/distribution, and messaging
with #3539's other optimizations still need validation. The measured crypto
speedup is a simulator microbenchmark, not end-to-end message latency.

### Develop refresh (2026-09-21)

The integration retains current develop security/QSS behavior and auth 17e0b5b.
The pinned libsodium source was rebuilt on Linux, including upstream `make check`;
all 17 production binding/webpack/cache tests pass on both Node 20.20.1 and
24.21.0, including 669 differential crypto vectors and fallback activation.
All 11 iOS workflow tests pass. The prior native iOS app evidence is retained;
Apple device/simulator builds were not repeated on this Linux host.

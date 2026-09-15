# iOS native crypto validation

The native-crypto fix reduces an unchanged LFA pass through 1,000 encrypted
messages from **541.8 seconds to a median 22.4 seconds** on the same iPhone 16e:
**24.2× faster**. All signatures are still checked. This result excludes the
separate LFA caching and channel-history improvements.

Tracking issue: [Quiet #3538](https://github.com/TryQuiet/quiet/issues/3538).
Runtime implementation: `ba723b648`; additional test/reference verification:
`18992092e`. The [adapter documentation](../../../packages/backend/platform/README.md)
describes formats, verification compatibility, fallback and build integration.

## Why iOS was especially slow

This iOS backend runs Node Mobile 18.20.4, V8 without JIT, with WebAssembly
unavailable. LFA's libsodium consequently interprets its elliptic-curve math in
JavaScript. The runtime already contains native OpenSSL 3.0.13+quic. The fix uses
it for Ed25519 and X25519, preserving sodium's existing symmetric construction,
encodings and strict acceptance policy. It adds no native binary or framework.

The original [processing profile](ios-processing-profile-2026-09-14.md) found
13 signing-key reconstructions, 13 encryption-public-key derivations and three
lockbox decryptions per ordinary-member message. Those counts remain unchanged
in these native-only runs; their primitive implementations are faster. The
separate high-level fixes remove that repeated work.

## Physical device results

The final adapter was activated automatically when sodium's `ready` promise
resolved, before the benchmark ran. A native-call counter proved activation;
the benchmark did not call `install()` or `enable()` on the measured instance.
Three complete 1,000-message repeats took **20.530, 22.396 and 23.043 seconds**.
Each decrypted the original fixture ciphertexts, checked exact plaintext and
verified all 1,000 signatures. This used the released alpha backend plus the
adapter and profiling hooks, with unchanged LFA, frontend and native frameworks.

Earlier scale measurements using the same six primitive overrides:

| Workload | Released alpha | Native primitives |
| --- | ---: | ---: |
| 10 messages | 4.255 s | 0.191 s |
| 100 messages | 47.420 s | 1.912 s |
| 1,000 messages, one scale pass | 541.801 s | 20.494 s |
| Real cold history-ID refresh, 100 messages | 57.058 s | 2.153 s |
| Load 100-user sigchain | 55.207 s | 13.567 s |
| Five message-signature verifications | roughly 0.18–0.24 s | 0.0011 s |

A diagnostic control that reuses one already-validated role key processes 1,000
messages in **1.523 seconds**, retaining signature verification. That control is
not an implemented cache: it demonstrates the additional opportunity from the
separate LFA work. The native-only fix still performs the old quadratic history
rereads and sigchain commitment scans.

These are offline CPU/processing measurements, excluding QSS, Tor, disk I/O in
the history harness, and UI rendering. One phone was used, with uncontrolled
thermal/power state. The 100-user case and smaller scale cases are single passes;
the three final 1,000-message cases reuse one process. The existing live
community stayed separate from all stress fixtures. No QSS server was changed
or stress-loaded.

## Cryptographic and build checks

All **nine shared test suites passed inside the physical iPhone's embedded Node**.
The first suite proves that the reference implementation makes zero native Node
key-import calls while the adapter makes two. Thus comparisons are between
original sodium and the adapter, rather than two adapted copies.

Checks include byte-identical keys/signatures/ciphertexts, bidirectional box
interop, altered messages/ciphertexts/nonces/keys, inconsistent public/secret key
halves, buffer offsets/mutation/reuse, invalid sizes/types/formats, low-order
points, and explicit signature scalars `S = L`, `S = L + 1`, and all-one bits.
The 151 Ed25519 and 518 X25519 Wycheproof cases have **zero differences from
sodium's acceptance, rejection or output**. Vector revision and SHA-256 checksums
are pinned in [the vector manifest](../../../packages/backend/platform/test-vectors/README.md).

The adapter deliberately delegates exceptional Ed25519 encodings to sodium:
OpenSSL alone accepts some inputs sodium rejects. Unknown sodium versions or
missing native capabilities leave the original sodium implementation intact.
Neither failure path turns a rejected signature or ciphertext into success.
The phone exposed an existing sodium base64 conversion error because this Node
build lacks ICU; the compatibility tests verify that both implementations retain
that error. LFA's binary/base58 message path does not use this conversion.

The documented backend test command passed **10/10 tests**, without private input
overrides, against the pinned auth workspace. This includes a real webpack build
using the production rule and checks that iOS activates the adapter before
consumers await `ready`, while Android, macOS, Linux and Windows retain sodium.
A reviewer caught and fixed an initial relative-path error in the test loader;
the final default command was independently rerun by the parent agent.

## Reproduction and evidence

[Sanitized results](ios-native-crypto-2026-09-14.json) include every scale timing,
repeat, security-suite result, activation proof and checksums of private evidence.
No fixture private keys, plaintext, invitations or raw application logs are
included. The preparation script checks the exact published alpha SHA-256 and
records the adapter and instrumented-bundle hashes.

Use `ios-profile/prepare_native_bundle.py` to prepare the automatic adapter
validation app. Copy `native_validate.cjs` as the private control directory's
`bench.cjs`, and the existing `bench.cjs` as `original-bench.cjs`. A command with
`repeats: 3`, `users: [2]`, `roles: ["member"]`, `messages: [1000]` runs the final
repeated comparison. For on-device differential checks, copy the backend
`platform` directory as `native-tests`, run `nativeMode: "checks"` on the original
instrumented backend, and preserve its completed result. The explicit reference
assertion fails if an already-adapted backend is accidentally used.

The original signed app and Documents backup are retained. The phone remains
under coordinated test ownership for the combined fixes and QSS-required smoke;
restoration/cleanup will occur after that validation. No release or deployment
was performed by this work.

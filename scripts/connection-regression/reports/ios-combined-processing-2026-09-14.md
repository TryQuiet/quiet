# iPhone processing with native crypto and incremental message handling

Measured on the same physical iPhone 16e / iOS 18.5 / Node Mobile 18.20.4 as the [published-alpha profile](ios-processing-profile-2026-09-14.md). The integrated backend reduces 1,000-message decrypt-and-verify time from **541.801 seconds to a median 1.431 seconds**. Five integrated runs took **1.371, 1.396, 1.431, 1.468, and 1.482 seconds**. Every run completed and checked all 1,000 message signatures.

This is offline backend processing evidence. It excludes network delivery and React Native rendering; it does not by itself prove end-to-end QSS latency. The original alpha has one complete 1,000-message baseline, so the approximately 379× ratio compares that baseline with the median of five fixed runs. The separate [native-only result](ios-native-crypto-2026-09-14.md) isolates the platform primitive change from the LFA and channel changes.

## Measured implementation

- Quiet `73a74599e2c94175e493179bdddcc8a0a051bbf3` with auth/CRDX `de490850b31e5ff564ab058421b133e8b040b18f`.
- Clean development webpack bundle SHA256 `3e3f5151553ba9a489a4900577144d8963cb381fe1bb2806a91a372d36b097d1`.
- Instrumented bundle SHA256 `10c4fa7370e58ed4a0ac97b134421b8c7f056210aff7429ad3f24c1b572829b9`.
- The native adapter was already present through the production webpack loader. Instrumentation adds timers and counters; it does not substitute a runtime fix.
- Same original encrypted fixture messages, team keys, and signatures as the released-alpha measurements. No fixture keys or plaintext are published.

Each message-repeat creates a fresh Team instance and primes its role-key lookup before timing, matching the original harness. Each fixed repeat performs 1,000 message signature verifications and no further asymmetric lockbox opens or keypair/base-point reconstruction. The first message on a fresh two-user Team instance took 12.61 ms and still performed three lockbox opens, four keypair checks, and one message signature verification.

## Actual channel processing

The harness calls the real bundled `ChannelStore`, `PublicChannelMessagesService`, and `CryptoService`, with encrypted messages and exact plaintext/signature assertions. Only OrbitDB persistence/transport and notifications use in-memory test I/O. Each serial arrival invokes the actual update listener, then the same targeted `getEntries([id])` request used by the frontend. No measured row uses a stand-in for the cryptographic consume path.

| History/messages | Cold history index | Serial arrivals plus frontend fetch |
| ---: | ---: | ---: |
| 1 | 16.22 ms | 3.38 ms |
| 10 | 17.54 ms | 32.02 ms |
| 100 | 164.88 ms | 338.41 ms |
| 1,000 | 1,676.80 ms | 3,391.84 ms |

A cold index verifies each existing message once: 1,000 consumes, signatures, and iterator rows at history size 1,000. Repeating the index refresh took 0.013 ms and performed no consumes or iteration. Fetching one message from that history took 1.63 ms, one store lookup, and zero history iteration.

For 1,000 serial arrivals with frontend fetches, the harness observed exactly 2,000 consumes/signatures and 1,000 targeted lookups, with **zero history iteration**. Each arrival emitted exactly its own new ID. This demonstrates linear message work for that path. The first row includes initial role-key loading; later rows share the role cache. These timings include test assertions and timer instrumentation.

## User-count and received-edition limits

Two passes through 10, 25, 50, and 100 users are in the numeric evidence. These are fresh Team instances in one process, with overlapping graph prefixes and some retained global facts. They are explicitly not process-cold measurements. The first pass loaded 100 users in 3.79 seconds and the second in 3.66 seconds. User-count growth still has substantial graph traversal, digest, manifest, and replay costs.

Three additional distinct-process 100-user loads took 3.758, 3.793, and 3.817 seconds, each with 499 signature checks and 294 box opens. Their idle command had constructed the two-user fixture first, so these are labeled **two-user prefix primed**, not fully process-cold. The first message then took 14.2–14.5 ms and verified one signature.

After correcting the idle command, three genuinely fixture-unprimed processes loaded 100 users in **3.856, 3.832, and 3.857 seconds** (median 3.856 seconds). Each opened 301 boxes and verified 499 signatures; their first messages took 14.15, 14.66, and 14.43 ms. The published baseline load was 55.207 seconds, and the native-only prototype was 13.567 seconds. These fixed cold loads still validate all previously unseen fixture material.

A separate-process sender control caught a cache-lifetime problem on the phone: the first incoming edition for 10 users verified one new signature and opened seven boxes (356.7 ms), but a later edition unexpectedly checked 51 signatures. The local integrated test checked only one. A diagnostic rerun retained both outcomes: 10-user editions took 358.2 ms / one check and 378.5 ms / 51 checks; 100-user editions took 7.336 and 7.645 seconds, each with one check and seven opens. The phone supports WeakRef; the incremental agent reproduced the lifetime problem with forced collection across event-loop turns. Consequently, **this report does not claim that every incoming edition reuses all old validation facts**. Earlier same-process sender rows are excluded from the exported evidence because sender validation warms the very facts being measured.

Later manifest/cache-lifetime changes must be reported with their own source and bundle identity. They are not included in the timings above.

## Reproduction and validation

`ios-profile/prepare_integrated_bundle.py` refuses an unexpected source SHA and requires full Quiet/auth commit IDs. `combined_bench.cjs` adds the real arrival/fetch and independent sender-wire controls to the original message benchmark. The separate sender generator is `incremental-edition-bench.mjs` in the incremental investigation branch; its `--prepare` output must be generated outside the receiver process.

Run the realistic local harness against a separately built, instrumented integrated bundle and private fixtures:

```sh
QUIET_PROFILE_COMBINED_BUNDLE=/private/integrated/bundle.cjs \
QUIET_PROFILE_COMBINED_FIXTURES=/private/original-fixtures \
QUIET_PROFILE_WIRE_FIXTURES=/private/separate-sender-editions \
node --test scripts/connection-regression/ios-profile/combined_bench.test.cjs
```

The same harness passed on the final reviewed bundle locally, including actual 1,000-message arrival/fetch processing and four separate-sender editions. The collector rejects incomplete runs or missing signature checks and exports only numeric results, operation names, build identities, and evidence checksums. The [sanitized JSON](ios-combined-processing-2026-09-14.json) contains every measured message repeat and scale row; private raw captures remain outside Git.

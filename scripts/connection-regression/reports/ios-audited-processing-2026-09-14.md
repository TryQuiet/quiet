# Final integrated iPhone verification

The final reviewed runtime completed five 1,000-message runs on the physical iPhone 16e / iOS 18.5 in **1.455, 1.488, 1.517, 1.555, and 1.552 seconds**: median **1.517 seconds**, versus 541.801 seconds for the published alpha. All 5,000 message signatures were checked, with no repeated asymmetric lockbox opens or keypair reconstruction after priming each Team instance's message role key.

This extends the [earlier integrated measurements](ios-combined-processing-2026-09-14.md) with the reviewed manifest-validation, weak-cache lifetime, and native atomic-fallback followups. It remains offline backend evidence: network transport and React Native rendering are excluded.

## Identity and method

- Quiet `978057d64595f7208405a91d76582ae6fd744a8d`; auth/CRDX `f8fb337a85ef277740ee24403743623ece59e33c`.
- Reviewed webpack source SHA256 `0081d1637816c0e0933f635d570b4058b029e6bc0acaae1ff4efe8919b591613`.
- Instrumented SHA256 `6b896e2217ecf0477bdef9b6fb1bfb783439bd7254d0f3fffb0f189420d3023f`.
- Same original encrypted fixtures, actual native Node runtime, signature assertions, and actual channel service methods as the preceding report.
- Installed the signed app clone without uninstalling or resetting the existing staging community. No server changes or server stress tests were performed.
- A fresh process ran an idle command that constructed no fixture Team, then waited for the startup profiler to finish. Its first measured operation loaded the 100-user fixture. WDA and other UI automation were stopped during measurements.

## Cold load and incoming editions

A genuinely fixture-unprimed **100-user load took 2.021 seconds**; its first message took 14.49 ms. The preceding implementation's three unprimed loads were 3.856, 3.832, and 3.857 seconds; the published alpha took 55.207 seconds. The final cold-load figure is one run, not a repeated median.

Each incoming wire edition was generated in a separate sender process and included actual message-pack decoding, graph decryption, and `Team.merge` in the timer. The receiver remained alive across event-loop yields. All four cases strictly asserted **one new signature verification and seven box opens**:

| Users | Edition 1 | Edition 2 |
| ---: | ---: | ---: |
| 10 | 381 ms | 390 ms |
| 100 | 3.774 s | 3.799 s |

The earlier phone run checked 51 signatures on the second 10-user edition because weak cache ownership could disappear during collection. The incremental implementation now retains facts through the live graph owner and includes explicit forced-GC tests. Those tests complement the actual phone result; the phone test does not expose a forced-GC API. Large graphs still incur substantial digest and traversal work: this result does not claim constant-time graph merging.

## Message history

| Messages | Cold history index | Serial arrivals plus frontend fetch |
| ---: | ---: | ---: |
| 1 | 13.00 ms | 3.27 ms |
| 10 | 15.80 ms | 34.33 ms |
| 100 | 169.08 ms | 328.07 ms |
| 1,000 | 1,646.53 ms | 3,343.91 ms |

The 1,000-message cold index verified exactly 1,000 messages. Refreshing that index took 0.014 ms and performed zero consumes or iteration. Fetching one message took 1.73 ms, one lookup, and no history iteration. The 1,000 serial arrival/fetch pairs performed exactly 2,000 consumes/signatures and 1,000 targeted lookups, with no history iteration. Each emitted precisely the expected new message ID.

The realistic local harness also passed on this exact instrumented build, including all four independently generated wire editions and 1,000 actual arrival/fetch pairs. `collect_audited_results.py` rejects partial message runs, missing signature checks, wrong edition counts, nonincremental edition checks, and unexpected sender-warmed phases. [Sanitized evidence](ios-audited-processing-2026-09-14.json) includes all timing and call-count rows with the exact build receipt and capture checksums.

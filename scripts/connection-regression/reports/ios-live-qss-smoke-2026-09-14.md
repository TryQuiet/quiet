# Live staging QSS smoke and final iPhone crypto checks

The existing staging test community exchanged **five verified messages each way** between the actual iPhone app and the desktop app. The desktop's Tor process had `DisableNetwork 1`, and the parent test controller confirmed all five iPhone messages and author `stage3ios2` in the desktop UI. The phone read all five desktop messages through its real initialized `ChannelStore`, with `verified: true` for each.

The iPhone sent its five messages at 05:37:04.672–05:37:04.777 UTC on September 15. Local encrypt/sign/store calls took **46, 37, 24, 22, and 22 ms**. These are local send costs, not delivery latency. Phone retrieval was polled later; no tight phone receive-latency or React Native rendering claim is made.

For the queued-message control, the phone process was killed and its absence verified. The desktop then sent `qss-smoke-queued-final-20260915`, allowed QSS to receive it, and stopped. The parent verified all desktop Quiet, Tor, and ChromeDriver processes were gone. After installing the final activation guard and starting a new phone process, the phone retrieved and verified that exact queued message while its sender remained stopped. This demonstrates storage and delivery through QSS independently of a live sender.

The community now contains its original five messages and eleven authorized test messages. No server deployment, server reset, or stress traffic was performed.

## Builds and observations

- Two-way exchange: Quiet `efa71050740a199280c2596fecf45eb8bbacd2f8`, auth/CRDX `f8fb337a85ef277740ee24403743623ece59e33c`, source bundle SHA256 `6eae1c249d635a8342dcf7eb63be506b731ad468f1749cea047ff2fa80ff463e`.
- Queued retrieval: Quiet `a34f3ad3ec2002c1e6dc67758ad06068ad457c74`, same auth/CRDX, source bundle SHA256 `8cfa1149f4987408cadbced0ca53d7300bc00c84a7006418e38afcf23cf450d4`.
- On the queued-retrieval build, the helper proved automatic native activation with exactly one Node native key import for a public derivation before accessing the app store.
- Diagnostic instrumentation retained the existing live app objects after isolated benchmarks were complete. Sends invoked the actual initialized `ChannelStore.sendMessage`; reads invoked its actual `getEntries`, preserving encryption, signatures, authorization, persistence, and QSS transport.
- WDA could not initialize UI testing reliably: a real XCTest/testmanager session reached runner readiness, then failed UI initialization; later DTX sessions timed out. Consequently phone observations are explicitly **backend-only**, while desktop observations include actual UI assertions.

The [live evidence](ios-live-qss-smoke-2026-09-14.json) includes exact IDs, harmless test markers, timestamps, verification results, and build receipts. Private community keys and unrelated plaintext are excluded.

## Final native parity

On the `efa710507` build the phone passed **all twelve current shared differential/security suites**, including 151 Ed25519 and 518 X25519 Wycheproof cases, original-reference independence, malformed encodings, input mutation/reuse, and the reviewed atomic fallback and ready-publication cases. The separately loaded original reference came from the exact pinned libsodium-wrappers-sumo/libsodium-sumo 0.7.13 JS files; it made zero native key imports while the adapted copy made two in the reference-control test. Production automatic activation was separately verified before running those checks.

The later `a34f3ad3e` change only restricted activation to ordinary Promise receivers. It received the final phone activation and queued-retrieval smoke, rather than another full benchmark campaign. The full repeated [processing measurements](ios-audited-processing-2026-09-14.md) retain their earlier exact build identity. [Native parity evidence](ios-final-native-parity-2026-09-14.json) records the checks, actual pinned reference hashes, tested adapter/check hashes, and build receipt.

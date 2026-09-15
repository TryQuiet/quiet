# iOS message and sigchain profiling

This harness measures the **released 10.0.0-alpha.0 iOS backend**, using real
LFA invitation/admission graphs and signed, encrypted channel messages. It adds
timers to the release webpack payload without rebuilding its dependencies or
changing its crypto algorithms. It is diagnostic tooling, not a product fix.

Use private, ignored directories: fixtures contain private keys and plaintext.
No stress fixture is uploaded to QSS. The existing live community may remain in
the app, but benchmark teams and history exist only in memory.

## Prepare and verify

Extract `Payload/Quiet.app/nodejs-project/bundle.cjs` from the published IPA.
The preparer checks its SHA-256 and rejects any other payload or module layout.
Run from the Quiet repository root, with the extracted bundle saved as below:

```bash
mkdir -p .connection-runs/ios-processing-profile
chmod 700 .connection-runs/ios-processing-profile
python3 scripts/connection-regression/ios-profile/prepare_bundle.py \
  .connection-runs/ios-processing-profile/alpha-bundle.cjs \
  .connection-runs/ios-processing-profile/instrumented/bundle.cjs

QUIET_PROFILE_EXPORT_ONLY=1 \
QUIET_PROFILE_DIRECTORY="$PWD/.connection-runs/ios-processing-profile/fixture-runtime" \
node scripts/connection-regression/ios-profile/fixtures.cjs \
  .connection-runs/ios-processing-profile/instrumented/bundle.cjs \
  .connection-runs/ios-processing-profile/fixtures

QUIET_PROFILE_ORIGINAL="$PWD/.connection-runs/ios-processing-profile/alpha-bundle.cjs" \
python3 -m unittest discover -s scripts/connection-regression/ios-profile -p 'test_*.py'

QUIET_PROFILE_BUNDLE=.connection-runs/ios-processing-profile/instrumented/bundle.cjs \
node --test scripts/connection-regression/ios-profile/*.test.cjs
```

After capturing a real startup CPU profile, also set `QUIET_PROFILE_CPU` to that
file when running the Python tests; this enables the real-profile attribution
test. Missing release/profile inputs are reported as skipped tests, not passes.

The integration test admits a real second member, decrypts/verifies authentic
messages, rejects tampered ciphertext/signatures/metadata, and executes the
released `ChannelStore` history/update methods. On Linux only, unused native
service imports are replaced because the IPA contains iOS LevelDB binaries.
The crypto, public message validation, channel store and base store stay intact.
The structural arrival test replaces crypto with a counted consumer; its result
is a work count, never a crypto timing.

## Physical iPhone

1. Back up the installed app's Documents before changing its executable. Preserve
   the original development-signed alpha app for restoration. Do not uninstall
   the app or clear its community data.
2. Copy the app. Replace only `nodejs-project/bundle.cjs`, and add
   `quiet-profile-runtime.cjs` from the preparer's output plus `bench.cjs` renamed
   to `quiet-profile-bench.cjs`. Keep its frontend, native frameworks, configuration,
   entitlements and Info.plist unchanged. Re-sign the outer app using its existing
   development identity/entitlements, verify the signature, then install the copy.
3. Use `xcrun devicectl device copy to` with domain type `appDataContainer`, domain
   identifier `com.quietmobile`, to copy fixtures to
   `Documents/quiet-profiling/fixtures`. Files must be readable by the app. Launch
   the app and keep it foregrounded. On our SSH-controlled Mac, signing needed a
   one-shot LaunchAgent in the logged-in user's GUI session; direct SSH signing
   returned `errSecInternalComponent` despite an unlocked keychain.
4. Copy a JSON command to `Documents/quiet-profiling/command.json`. Use a new ID for
   each run. Commands execute serially; overwriting the file while a run is busy
   queues the latest command only. Updated `bench.cjs` can be copied alongside
   `command.json` and is loaded afresh for the next run.
5. Copy `Documents/quiet-profile-results` back with `devicectl device copy from`.
   **Let the app create this output directory.** A directory created by devicectl
   was readable but not writable by the app and caused `EACCES` during early
   harness setup. `command-status.json` and each run's `complete.json` distinguish
   completed measurements from interrupted runs. Intermediate result files retain
   completed cases. Runtime identity and metric snapshots are recorded separately.
6. Restore the original development-signed app without uninstalling it; verify the
   original backend/frontend hashes and retained community. Remove the owned
   signing LaunchAgent and stop profiling processes. Commit completed tooling and
   sanitized evidence on the same worktree branch before handoff or review.

Example message stress command:

```json
{"id":"messages-1000","action":"benchmark","config":{"users":[2],"roles":["member"],"messages":[1,10,100,1000],"primitiveCount":5,"yieldEvery":10,"limitSeconds":1200}}
```

Useful additional config fields:

| Field | Meaning |
| --- | --- |
| `users: [10,25,50,100]` | Load progressively larger real membership graphs. |
| `cpu: true`, `profilePrefix: "users"` | Capture a V8 sampling profile around each graph load. |
| `history: [1,10,100]` | Time the real Quiet `refreshMessageIds` → consume → crypto path, with an in-memory store iterator. |
| `shape: [1,10,100,1000]` | Count actual update-handler processing calls with crypto excluded. |
| `reuseValidatedKeyCount: 1000` | Diagnostic static-team control: select/validate the role key once, then decrypt and verify every message. Does not test cache invalidation or constitute a production fix. |
| `overheadControlCount: 10` | Repeat actual decrypt/verify with timing wrappers disabled. |

Startup automatically captures 45 seconds of V8 CPU samples. Wait for this to
finish before requesting another CPU profile. An explicit profile command is
`{"id":"incoming-message","action":"profile","durationMs":30000}`. CPU profiles
can be opened in DevTools or summarized with `summarize_cpu.py`. Nested inclusive
times overlap; self times do not. Async `.wall` timers may overlap and should not
be added together. A CPU profile around graph loading ends before message timing.

## Local runtime controls

Pass the same config as a local JSON file, including absolute `fixtures` and
`output` paths, to `bench.cjs BUNDLE CONFIG`. Set `QUIET_PROFILE_EXPORT_ONLY=1`
and a private `QUIET_PROFILE_DIRECTORY`. Compare ordinary Node, Node with
`QUIET_PROFILE_DISABLE_WASM=1`, and `node --jitless`. These controls use the same
release crypto and fixture bytes, but different hardware/runtime from the phone.
They isolate WASM/JIT effects; they are not desktop UI or mobile latency results.

`limitSeconds` censors a message case after the current message completes. Never
report its requested count as completed. It does not interrupt synchronous graph
loading or the history-reader case. Each batch validates exact content and
signatures; no delivery rate or UI responsiveness is inferred from these isolated
processing timings.

The report's JSON and figure can be regenerated with `collect_results.py` and
`plot_results.py`. The collector requires completed phone runs named
`ios-smoke`, `ios-message-scale`, `ios-user-scale`, and `ios-history-control`, and
local run directories named `local-native`, `local-no-wasm`, and `local-jitless`.
It exports an allowlist of numeric measurements and checksums, excluding
plaintext, keys, command arguments and container paths.

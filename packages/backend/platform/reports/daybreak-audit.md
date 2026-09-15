# Daybreak Blue audit of native libsodium

Date: 2026-09-15. Reviewer: a separate `gpt-daybreak-blue-latest` subagent.
Original reviewed commit: `e5c5fb2832c3d2ace9581133c26c41f787d85566`.
Stack base: `77a07518137928ffa5208f99bc190044550ce0ac` (Quiet #3423).

## Result

**Accepted after correcting one low-severity API compatibility issue.** No
medium- or high-severity findings were reported. The reviewer independently
re-ran the focused native and webpack suite after the correction: **16/16
passed**, along with `git diff --check`. The reviewer made no source changes.

### Corrected finding: falsy output formats

The pinned `libsodium-wrappers-sumo@0.7.13` treats every falsy output-format value
as the default byte-array format. The native adapter originally accepted only
`undefined` and `"uint8array"` as defaults. Direct comparison showed that `null`,
`""`, `false`, and `0` succeeded in the reference but threw after native
activation. Current Quiet/LFA callers omit this argument, so the reviewer found
no affected current app path.

Both default-format branches now accept falsy values. This includes the
keypair-specific return path, which must preserve the returned private-key
buffer. A new differential regression checks all five output-producing
operations with `undefined`, `null`, `""`, `false`, `0`, `-0`, `NaN`, and `0n`.
It failed before the fix and passes afterward. Existing tests still reject
unsupported truthy formats. The reviewer accepted the fix and this coverage.

### Clarified build-cache trust boundary

The cache checks detect accidental corruption and stale source recipes. The
adjacent manifest is writable, so a process that can replace both a binary and
its recorded digest can pass that check. App signing does not establish the
provenance of inputs before signing. This is an informational trust boundary;
the README now states it explicitly.

## Scope and checks

The review covered the native C memory/buffer boundary; Ed25519, X25519 and box
acceptance and compatibility; readiness and atomic fallback; runtime error
propagation; loading from the signed app bundle; exported-symbol isolation;
source pinning, caching and signing; and the recorded test evidence.

No actionable defect was found in those areas beyond the corrected format
handling. Runtime primitive failures propagate after activation rather than
being converted into fallback.

The reviewer inspected the diff, source hashes, manifests and committed Mac/iOS
reports, and ran:

```sh
QUIET_NATIVE_TEST_SODIUM=/path/to/libsodium-wrappers-sumo@0.7.13 \
  node --test packages/backend/platform/sodium-native.test.cjs \
  packages/backend/platform/sodium-webpack.test.cjs
git diff --check
```

The initial focused suite passed 15/15. Separate probes reproduced the format
mismatch and checked runtime error propagation. The added regression brings the
focused suite to 16/16; the full host suite also includes the artifact-cache test.

## Limits

This was an independent source review and focused Linux test run. The reviewer
checked the committed 33-test app E2E and simulator evidence for consistency;
it did not independently rebuild the Mac artifacts or repeat those app runs.
The existing Linux host addon has unchanged C source; the reviewer did not run
`prepare` or upstream `make check` because that cache records an earlier build
recipe hash. Physical iPhone execution, distribution signing, hosted CI and
independent Mac artifact reproduction remain outside this audit's validation.

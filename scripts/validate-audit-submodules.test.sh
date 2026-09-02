#!/usr/bin/env bash
# Exercise the release-pin validator from a genuinely uninitialized worktree,
# then prove that it rejects a committed client/QSS Auth mismatch.
set -euo pipefail

readonly source_root="$(git rev-parse --show-toplevel)"
readonly fixture_parent="$(mktemp -d /tmp/quiet-submodule-policy.XXXXXX)"
readonly fixture_root="${fixture_parent}/checkout"

cleanup() {
  git -C "$source_root" worktree remove --force "$fixture_root" >/dev/null 2>&1 || true
  rmdir "$fixture_parent" >/dev/null 2>&1 || true
}
trap cleanup EXIT

git -C "$source_root" worktree add --detach "$fixture_root" HEAD >/dev/null

# Success from a fresh non-recursive checkout proves the validator initializes
# QSS before reading its nested .gitmodules and reaches all three exact pins.
(
  cd "$fixture_root"
  bash scripts/validate-audit-submodules.sh
)

client_auth="$(git -C "$fixture_root" rev-parse 'HEAD:3rd-party/auth')"
mismatched_auth="$(git -C "$fixture_root" rev-parse "${client_auth}^")"
test "$mismatched_auth" != "$client_auth"

git -C "$fixture_root" update-index \
  --cacheinfo "160000,${mismatched_auth},3rd-party/auth"
git -C "$fixture_root" \
  -c user.name='Submodule policy test' \
  -c user.email='submodule-policy@example.invalid' \
  commit -m 'test fixture: mismatched client auth pin' >/dev/null

set +e
mismatch_output="$(
  cd "$fixture_root"
  bash scripts/validate-audit-submodules.sh 2>&1
)"
mismatch_status=$?
set -e

test "$mismatch_status" -ne 0
case "$mismatch_output" in
  *'does not match client auth gitlink'*) ;;
  *)
    printf 'Validator failed for an unexpected reason:\n%s\n' "$mismatch_output" >&2
    exit 1
    ;;
esac

printf 'Validated fresh initialization and mismatched-pin rejection.\n'

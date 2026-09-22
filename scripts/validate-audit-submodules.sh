#!/usr/bin/env bash
# Validate that the release client's auth and QSS submodules can be
# initialized from this repository and land on the commits recorded by the
# superproject. Run from the repository root (or via npm run
# test:submodule-policy).
set -euo pipefail

readonly auth_path='3rd-party/auth'
readonly qss_path='3rd-party/qss'
readonly qss_auth_relative_path='3rd-party/auth'
readonly qss_auth_path="${qss_path}/${qss_auth_relative_path}"

assert_config() {
  local path="$1"
  local expected_url="$2"
  local expected_branch="$3"
  local name="submodule.${path}"

  test "$(git config -f .gitmodules --get "${name}.url")" = "$expected_url"
  test "$(git config -f .gitmodules --get "${name}.branch")" = "$expected_branch"
}

assert_checkout_matches_gitlink() {
  local path="$1"
  local expected actual
  expected="$(git rev-parse "HEAD:${path}")"
  actual="$(git -C "$path" rev-parse HEAD)"
  test "$actual" = "$expected"
}

assert_qss_auth_matches_client() {
  local client_auth qss_auth qss_auth_checkout
  client_auth="$(git rev-parse "HEAD:${auth_path}")"
  qss_auth="$(git -C "$qss_path" rev-parse "HEAD:${qss_auth_relative_path}")"
  qss_auth_checkout="$(git -C "$qss_auth_path" rev-parse HEAD)"

  test "$qss_auth_checkout" = "$qss_auth"
  if test "$qss_auth" != "$client_auth"; then
    printf 'QSS auth gitlink %s does not match client auth gitlink %s.\n' \
      "$qss_auth" "$client_auth" >&2
    return 1
  fi
}

assert_config "$auth_path" 'https://github.com/TryQuiet/auth.git' 'main'
assert_config "$qss_path" 'https://github.com/TryQuiet/quiet-storage-service.git' 'main'

# Sync makes Git use the URLs from .gitmodules. Initialize the two
# top-level gitlinks first because QSS's nested policy cannot be inspected from
# a fresh non-recursive checkout until QSS itself exists.
git submodule sync -- "$auth_path" "$qss_path"
git submodule update --init --checkout --depth 1 -- "$auth_path" "$qss_path"

# QSS's own metadata only exists after a fresh superproject checkout initializes
# the QSS gitlink above. Check it after initialization so this test works both in
# developer worktrees and in a non-recursive CI clone.
test "$(git -C "$qss_path" config -f .gitmodules \
  --get "submodule.${qss_auth_relative_path}.url")" = 'https://github.com/TryQuiet/auth.git'
test "$(git -C "$qss_path" config -f .gitmodules \
  --get "submodule.${qss_auth_relative_path}.branch")" = 'auth/main-baseline'

# Only after validating QSS's declaration do we initialize its nested Auth
# checkout. This keeps an unexpected nested URL or branch from being consumed
# before the policy rejects it.
git -C "$qss_path" submodule sync -- "$qss_auth_relative_path"
git -C "$qss_path" submodule update --init --checkout --depth 1 -- "$qss_auth_relative_path"

assert_checkout_matches_gitlink "$auth_path"
assert_checkout_matches_gitlink "$qss_path"
assert_qss_auth_matches_client

printf 'Validated auth, QSS, and nested QSS auth initialization and coherent pinned checkouts.\n'

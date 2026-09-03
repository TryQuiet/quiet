#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
workflow="$script_dir/../workflows/desktop-build.yml"

if grep -Eq 'secrets\.AWS_(ACCESS_KEY_ID|SECRET_ACCESS_KEY)' "$workflow"; then
  echo 'Desktop Build still references an unscoped AWS organization secret name' >&2
  exit 1
fi

[[ "$(grep -Fc 'secrets.QUIET_AWS_ACCESS_KEY_ID' "$workflow")" -eq 6 ]]
[[ "$(grep -Fc 'secrets.QUIET_AWS_SECRET_ACCESS_KEY' "$workflow")" -eq 6 ]]

echo 'Desktop Build organization-secret scope test passed'

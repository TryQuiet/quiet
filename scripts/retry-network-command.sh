#!/usr/bin/env bash
# Only wrap dependency installation/build commands, never test commands or publishing.
# Stream diagnostics unchanged, retry known transport failures, preserve the final exit code.
set -uo pipefail

if (( $# == 0 )); then
  echo 'Usage: retry-network-command.sh command [args...]' >&2
  exit 64
fi
delay=${QUIET_NETWORK_RETRY_DELAY_SECONDS:-15}
if [[ ! "$delay" =~ ^[0-9]+$ ]]; then
  echo 'QUIET_NETWORK_RETRY_DELAY_SECONDS must be a nonnegative integer' >&2
  exit 64
fi
retry_dir=$(mktemp -d) || exit 1
trap 'rm -rf "$retry_dir"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

for attempt in 1 2 3; do
  "$@" 2>&1 | tee "$retry_dir/output"
  statuses=("${PIPESTATUS[@]}")
  result=${statuses[0]}
  if (( statuses[1] != 0 )); then exit "${statuses[1]}"; fi
  if (( result == 0 )); then exit 0; fi
  if (( result >= 128 || attempt == 3 )); then exit "$result"; fi

  # Authorization, missing releases, integrity failures and compiler errors are
  # not fixed by retrying. Do not accept an earlier network warning in these cases.
  if grep -Eiq 'Response code (401|403|404)|HTTP[^[:cntrl:]]* (401|403|404)|checksum[^[:cntrl:]]*(mismatch|failed)|integrity checksum failed|error TS[0-9]+|Compilation failed' "$retry_dir/output"; then
    exit "$result"
  fi
  if ! grep -Eiq 'Response code (408|429|5[0-9][0-9])|HTTP[^[:cntrl:]]* (408|429|5[0-9][0-9])|(^|[^A-Z])(ETIMEDOUT|ECONNRESET|EAI_AGAIN|ECONNREFUSED)([^A-Z]|$)|Downloading from https?://[^[:space:]]+ failed: timeout|java.net.SocketTimeoutException' "$retry_dir/output"; then
    exit "$result"
  fi
  echo "Dependency download failed; retrying command ($((attempt + 1))/3) in $((delay * attempt)) seconds." >&2
  sleep "$((delay * attempt))"
done

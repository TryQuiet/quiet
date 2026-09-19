#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
log_file=${1:-"$repo_root/diagnostics/3590/artifacts/e2e.log"}
: "${FILE_NAME:?Set FILE_NAME to the executable in packages/e2e-tests/Quiet}"
mkdir -p "$(dirname "$log_file")"
log_file=$(realpath "$log_file")
cd "$repo_root/packages/e2e-tests"

export IS_E2E=true TEST_MODE=true IS_CI=true LOCAL_TRANSPORT=true
export NETWORK_LOGGING=true LOG_TO_FILE=true E2E_NO_SANDBOX=true
export DEBUG='backend*,quiet*,state-manager*,desktop*,utils*,identity*,common*,libp2p:*'
if [[ ${REPRO_3590:-false} == true ]]; then
  export REPRO_TEST_FILE=src/tests/admissionRecoveryDiagnostic.test.ts
  export REPRO_TEST_NAME='links with the original valid invitation'
else
  export REPRO_TEST_FILE=src/tests/admissionTimeout.test.ts
  export REPRO_TEST_NAME='allows a valid device link after an invalid device admission'
fi

# Each run gets a separate display. IS_CI retains the two disposable client data
# directories and their own logs, whose paths are printed in the Jest output.
xvfb-run -a -s '-screen 0 1600x1200x24' bash -c '
  fluxbox >/dev/null 2>&1 &
  window_manager=$!
  trap "kill $window_manager 2>/dev/null || true" EXIT
  node node_modules/jest/bin/jest.js --runInBand --forceExit \
    "$REPRO_TEST_FILE" --testNamePattern="$REPRO_TEST_NAME"
' >"$log_file" 2>&1

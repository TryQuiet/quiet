#!/bin/bash

# Test script for update-tor.sh
# This script runs basic functionality tests without making changes

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly UPDATE_SCRIPT="$SCRIPT_DIR/update-tor-binaries-desktop.sh"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

log_info() {
    echo -e "[INFO] $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1" >&2
}

test_help() {
    log_info "Testing --help flag..."
    if "$UPDATE_SCRIPT" --help >/dev/null 2>&1; then
        log_success "Help flag works"
        return 0
    else
        log_error "Help flag failed"
        return 1
    fi
}

test_check_only() {
    log_info "Testing --check-only..."
    if timeout 30s "$UPDATE_SCRIPT" --check-only >/dev/null 2>&1; then
        log_success "Check-only works"
        return 0
    else
        log_error "Check-only failed"
        return 1
    fi
}


test_invalid_option() {
    log_info "Testing invalid option handling..."
    if "$UPDATE_SCRIPT" --invalid-option >/dev/null 2>&1; then
        log_error "Should have failed with invalid option"
        return 1
    else
        log_success "Invalid option properly rejected"
        return 0
    fi
}

main() {
    log_info "Running update-tor-binaries-desktop.sh tests..."
    echo
    
    local tests_passed=0
    local tests_total=0
    
    # Run tests
    tests=("test_help" "test_check_only" "test_invalid_option")
    
    for test in "${tests[@]}"; do
        ((tests_total++))
        if $test; then
            ((tests_passed++))
        fi
        echo
    done
    
    # Summary
    echo "=========================================="
    if [[ $tests_passed -eq $tests_total ]]; then
        log_success "All tests passed ($tests_passed/$tests_total)"
        return 0
    else
        log_error "Some tests failed ($tests_passed/$tests_total)"
        return 1
    fi
}

main "$@"
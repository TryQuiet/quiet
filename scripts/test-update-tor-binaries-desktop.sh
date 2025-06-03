#!/bin/bash

# Test script for update-tor-binaries-desktop.sh
# This script runs basic functionality tests without making changes

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly UPDATE_SCRIPT="$SCRIPT_DIR/update-tor-binaries-desktop.sh"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly NC='\033[0m'

log_info() {
    echo "[INFO] $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1" >&2
}

main() {
    log_info "Running update-tor-binaries-desktop.sh tests..."
    echo
    
    local tests_passed=0
    local tests_total=5
    
    # Test help
    log_info "Testing --help flag..."
    if "$UPDATE_SCRIPT" --help >/dev/null 2>&1; then
        log_success "Help flag works"
        ((tests_passed++))
    else
        log_error "Help flag failed"
    fi
    echo
    
    # Test invalid option handling (should fail)
    log_info "Testing invalid option handling..."
    if "$UPDATE_SCRIPT" --invalid >/dev/null 2>&1; then
        log_error "Should have failed with invalid option"
    else
        log_success "Invalid option properly rejected"
        ((tests_passed++))
    fi
    echo
    
    # Test that default execution would start (but cancel quickly)
    log_info "Testing default execution starts correctly..."
    local output
    output=$(timeout 2s "$UPDATE_SCRIPT" 2>&1 || true)
    if echo "$output" | grep -q "Updating Tor binaries"; then
        log_success "Default execution starts correctly"
        ((tests_passed++))
    else
        log_error "Default execution test failed"
    fi
    echo
    
    # Test GPG signature verification using the script's built-in test
    log_info "Testing GPG signature verification..."
    
    if "$UPDATE_SCRIPT" --test-verify >/dev/null 2>&1; then
        log_success "GPG signature verification tests passed"
        ((tests_passed++))
    else
        log_error "GPG signature verification tests failed"
        echo "Run '$UPDATE_SCRIPT --test-verify' for details"
    fi
    echo
    
    # Test GPG key file exists
    log_info "Testing GPG key file exists..."
    
    local key_file="$SCRIPT_DIR/tor-signing-key.asc"
    if [[ -f "$key_file" ]]; then
        log_success "GPG key file exists at $key_file"
        ((tests_passed++))
    else
        log_error "GPG key file missing: $key_file"
    fi
    echo
    
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
#!/bin/bash

# Tor Binary Update Script for Quiet Desktop
# This script helps automate the process of updating Tor binaries for desktop platforms (Linux, macOS, Windows)

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly TOR_DIR="$PROJECT_ROOT/3rd-party/tor"
readonly TEMP_DIR="$(mktemp -d)"
readonly TOR_PROJECT_BASE_URL="https://dist.torproject.org/torbrowser"

# Tor Project GPG key file path
readonly TOR_GPG_KEY_FILE="$SCRIPT_DIR/tor-signing-key.asc"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Cleanup function
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Initialize GPG for signature verification
init_gpg() {
    log_info "Initializing GPG for signature verification..."

    # Create temporary GPG home directory
    export GNUPGHOME="$TEMP_DIR/.gnupg"
    mkdir -p "$GNUPGHOME"
    chmod 700 "$GNUPGHOME"

    # Check if key file exists
    if [[ ! -f "$TOR_GPG_KEY_FILE" ]]; then
        log_error "Tor GPG key file not found: $TOR_GPG_KEY_FILE"
        return 1
    fi

    # Import Tor Project public key
    local gpg_import_output
    if gpg_import_output=$(gpg --batch --import "$TOR_GPG_KEY_FILE" 2>&1); then
        log_success "Imported Tor Project GPG public key"

        # Display fingerprint for verification
        local fingerprint=$(gpg --list-keys --with-colons 2>/dev/null | grep -B1 "Tor Browser Developers" | grep "^fpr" | cut -d: -f10)
        log_info "GPG key fingerprint: $fingerprint"

        # Verify it matches expected fingerprint
        if [[ "$fingerprint" != "EF6E286DDA85EA2A4BA7DE684E2C6E8793298290" ]]; then
            log_error "GPG key fingerprint mismatch! Expected: EF6E286DDA85EA2A4BA7DE684E2C6E8793298290"
            return 1
        fi
    else
        log_error "Failed to import Tor Project GPG public key"
        echo "$gpg_import_output"
        return 1
    fi

    return 0
}

# Verify GPG signature of a file
verify_signature() {
    local file="$1"
    local sig_file="${file}.asc"

    if [[ ! -f "$sig_file" ]]; then
        log_error "Signature file not found: $sig_file"
        return 1
    fi

    log_info "Verifying signature for $(basename "$file")..."

    # Verify signature
    if gpg --batch --quiet --verify "$sig_file" "$file" 2>/dev/null; then
        log_success "Signature verified for $(basename "$file")"
        return 0
    else
        log_error "Signature verification failed for $(basename "$file")"
        # Show detailed error for debugging
        gpg --verify "$sig_file" "$file" 2>&1 | sed 's/^/  /'
        return 1
    fi
}

# Help function
show_help() {
    cat << EOF
Tor Binary Update Script for Quiet Desktop

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --test-verify       Run GPG verification tests
    --help, -h          Show this help message

DESCRIPTION:
    Downloads and installs the latest Tor binaries for all desktop platforms
    (Linux, macOS x64, macOS ARM64, Windows)

    All downloads are verified using GPG signatures from the Tor Project
    to ensure authenticity and integrity.

EXAMPLES:
    $0                  # Update Tor binaries to latest version
    $0 --test-verify    # Run GPG verification tests
EOF
}


# Get latest Tor Browser version from releases page
get_latest_tor_version() {
    log_info "Checking for latest Tor Browser version..." >&2
    local latest_version=""

    # Check the dist server directory listing
    if command -v curl >/dev/null 2>&1; then
        latest_version=$(curl -s "$TOR_PROJECT_BASE_URL/" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | sort -V | tail -n1 || echo "")
    elif command -v wget >/dev/null 2>&1; then
        latest_version=$(wget -qO- "$TOR_PROJECT_BASE_URL/" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | sort -V | tail -n1 || echo "")
    fi

    if [[ -n "$latest_version" ]]; then
        log_info "Latest Tor Browser version: $latest_version" >&2
        echo "$latest_version"
    else
        log_error "Could not determine latest Tor Browser version"
        exit 1
    fi
}



# Download platform-specific Tor Browser bundles
download_tor_bundles() {
    local browser_version="$1"
    log_info "Downloading Tor Browser $browser_version for all platforms..."

    local base_url="$TOR_PROJECT_BASE_URL/$browser_version"

    # Define download URLs for each platform
    local downloads=(
        "tor-browser-linux-x86_64-${browser_version}.tar.xz"
        "tor-expert-bundle-macos-x86_64-${browser_version}.tar.gz"
        "tor-expert-bundle-macos-aarch64-${browser_version}.tar.gz"
        "tor-expert-bundle-windows-x86_64-${browser_version}.tar.gz"
    )

    cd "$TEMP_DIR"

    # Initialize GPG before downloading
    if ! init_gpg; then
        log_error "Failed to initialize GPG"
        return 1
    fi

    for download in "${downloads[@]}"; do
        local url="$base_url/$download"
        local sig_url="${url}.asc"

        # Download the file
        log_info "Downloading $download..."

        if command -v curl >/dev/null 2>&1; then
            if ! curl -L -o "$download" "$url"; then
                log_error "Failed to download $download"
                return 1
            fi
        elif command -v wget >/dev/null 2>&1; then
            if ! wget -O "$download" "$url"; then
                log_error "Failed to download $download"
                return 1
            fi
        else
            log_error "Neither curl nor wget available for downloading"
            return 1
        fi

        # Download the signature file
        log_info "Downloading signature for $download..."

        if command -v curl >/dev/null 2>&1; then
            if ! curl -L -o "${download}.asc" "$sig_url"; then
                log_error "Failed to download signature for $download"
                return 1
            fi
        elif command -v wget >/dev/null 2>&1; then
            if ! wget -O "${download}.asc" "$sig_url"; then
                log_error "Failed to download signature for $download"
                return 1
            fi
        fi

        # Verify download exists and is not empty
        if [[ ! -f "$download" ]] || [[ ! -s "$download" ]]; then
            log_error "Download verification failed for $download"
            return 1
        fi

        # Verify GPG signature
        if ! verify_signature "$download"; then
            log_error "GPG signature verification failed for $download"
            log_error "This could indicate a compromised download. Aborting."
            return 1
        fi

        log_success "Downloaded and verified $download"
    done

    log_success "All downloads completed and verified"
    return 0
}

# Extract binaries from downloaded bundles
extract_binaries() {
    log_info "Extracting Tor binaries from downloaded bundles..."

    cd "$TEMP_DIR"

    # Extract Linux bundle and get tor binary + libraries
    log_info "Extracting Linux bundle..."
    tar -xf tor-browser-linux-x86_64-*.tar.xz

    local linux_tor_dir=$(find . -name "tor-browser*" -type d | head -n1)
    if [[ -z "$linux_tor_dir" ]]; then
        log_error "Could not find extracted Linux Tor Browser directory"
        return 1
    fi

    # Create extraction directories
    mkdir -p extracted/{linux,darwin-x64,darwin-arm64,win32}

    # Copy Linux binaries
    local tor_path="$linux_tor_dir/Browser/TorBrowser/Tor"
    if [[ -d "$tor_path" ]]; then
        cp "$tor_path/tor" extracted/linux/
        cp "$tor_path"/*.so* extracted/linux/ 2>/dev/null || true
        chmod +x extracted/linux/tor
        log_success "Extracted Linux binaries"
    else
        log_error "Could not find Linux Tor binaries in expected location"
        return 1
    fi

    # Extract macOS x64 bundle
    log_info "Extracting macOS x64 bundle..."
    tar -xf tor-expert-bundle-macos-x86_64-*.tar.gz
    if [[ -f "tor/tor" ]]; then
        cp tor/tor extracted/darwin-x64/
        cp tor/*.dylib extracted/darwin-x64/ 2>/dev/null || true
        chmod +x extracted/darwin-x64/tor
        log_success "Extracted macOS x64 binaries"
        rm -rf tor/ data/ docs/ 2>/dev/null || true
    else
        log_error "Could not find macOS x64 Tor binary"
        return 1
    fi

    # Extract macOS ARM64 bundle
    log_info "Extracting macOS ARM64 bundle..."
    tar -xf tor-expert-bundle-macos-aarch64-*.tar.gz
    if [[ -f "tor/tor" ]]; then
        cp tor/tor extracted/darwin-arm64/
        cp tor/*.dylib extracted/darwin-arm64/ 2>/dev/null || true
        chmod +x extracted/darwin-arm64/tor
        log_success "Extracted macOS ARM64 binaries"
        rm -rf tor/ data/ docs/ 2>/dev/null || true
    else
        log_error "Could not find macOS ARM64 Tor binary"
        return 1
    fi

    # Extract Windows bundle
    log_info "Extracting Windows bundle..."
    tar -xf tor-expert-bundle-windows-x86_64-*.tar.gz
    if [[ -f "tor/tor.exe" ]]; then
        cp tor/tor.exe extracted/win32/
        log_success "Extracted Windows binaries"
        rm -rf tor/ data/ docs/ 2>/dev/null || true
    else
        log_error "Could not find Windows Tor binary"
        return 1
    fi

    log_success "All binaries extracted successfully"
    return 0
}

# Install extracted binaries
install_binaries() {
    log_info "Installing extracted Tor binaries..."

    local extracted_dir="$TEMP_DIR/extracted"
    if [[ ! -d "$extracted_dir" ]]; then
        log_error "No extracted binaries found. Run --download first."
        return 1
    fi


    # Install Linux binaries
    if [[ -d "$extracted_dir/linux" ]]; then
        log_info "Installing Linux binaries..."
        cp "$extracted_dir/linux"/* "$TOR_DIR/linux/"
        log_success "Installed Linux binaries"
    fi

    # Install macOS x64 binaries
    if [[ -d "$extracted_dir/darwin-x64" ]]; then
        log_info "Installing macOS x64 binaries..."
        cp "$extracted_dir/darwin-x64"/* "$TOR_DIR/darwin/x64/"
        log_success "Installed macOS x64 binaries"
    fi

    # Install macOS ARM64 binaries
    if [[ -d "$extracted_dir/darwin-arm64" ]]; then
        log_info "Installing macOS ARM64 binaries..."
        cp "$extracted_dir/darwin-arm64"/* "$TOR_DIR/darwin/arm64/"
        log_success "Installed macOS ARM64 binaries"
    fi

    # Install Windows binaries
    if [[ -d "$extracted_dir/win32" ]]; then
        log_info "Installing Windows binaries..."
        cp "$extracted_dir/win32"/* "$TOR_DIR/win32/"
        log_success "Installed Windows binaries"
    fi

    log_success "All binaries installed."
    return 0
}


# Test GPG verification functionality
test_gpg_verification() {
    log_info "Running GPG verification tests..."

    local test_dir="$TEMP_DIR/gpg-test"
    mkdir -p "$test_dir"
    cd "$test_dir"

    # Initialize GPG
    if ! init_gpg; then
        log_error "Failed to initialize GPG for testing"
        return 1
    fi

    # Test 1: Valid signature (using a real small file from Tor Project)
    log_info "Test 1: Downloading and verifying a real Tor Project file..."
    local test_file="sha256sums-signed-build.txt"

    # Get the latest version for testing
    local latest_version=$(get_latest_tor_version)
    local test_url="https://dist.torproject.org/torbrowser/${latest_version}/${test_file}"

    if command -v curl >/dev/null 2>&1; then
        curl -sL -o "$test_file" "$test_url" || { log_error "Failed to download test file"; return 1; }
        curl -sL -o "${test_file}.asc" "${test_url}.asc" || { log_error "Failed to download test signature"; return 1; }
    else
        wget -q -O "$test_file" "$test_url" || { log_error "Failed to download test file"; return 1; }
        wget -q -O "${test_file}.asc" "${test_url}.asc" || { log_error "Failed to download test signature"; return 1; }
    fi

    if verify_signature "$test_file"; then
        log_success "Test 1 PASSED: Valid signature verified correctly"
    else
        log_error "Test 1 FAILED: Could not verify valid signature"
        return 1
    fi

    # Test 2: Tampered file
    log_info "Test 2: Testing tampered file detection..."
    echo "tampered" >> "$test_file"

    if verify_signature "$test_file"; then
        log_error "Test 2 FAILED: Tampered file passed verification!"
        return 1
    else
        log_success "Test 2 PASSED: Tampered file correctly rejected"
    fi

    # Test 3: Missing signature file
    log_info "Test 3: Testing missing signature file..."
    rm -f "${test_file}.asc"

    if verify_signature "$test_file"; then
        log_error "Test 3 FAILED: Verification passed without signature file!"
        return 1
    else
        log_success "Test 3 PASSED: Missing signature correctly detected"
    fi

    # Test 4: Invalid signature file
    log_info "Test 4: Testing invalid signature file..."
    echo "INVALID SIGNATURE" > "${test_file}.asc"

    if verify_signature "$test_file"; then
        log_error "Test 4 FAILED: Invalid signature passed verification!"
        return 1
    else
        log_success "Test 4 PASSED: Invalid signature correctly rejected"
    fi

    log_success "All GPG verification tests passed!"
    return 0
}

# Main execution function
main() {
    local test_verify=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --test-verify)
                test_verify=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Verify we're in the right directory
    if [[ ! -d "$TOR_DIR" ]]; then
        log_error "Tor directory not found: $TOR_DIR"
        log_error "Make sure you're running this from the Quiet project root"
        exit 1
    fi

    # Run tests if requested
    if [[ "$test_verify" == true ]]; then
        test_gpg_verification
        exit $?
    fi

    # Download and install Tor binaries
    log_info "Updating Tor binaries to latest version..."
    local latest_version=$(get_latest_tor_version)
    download_tor_bundles "$latest_version"
    extract_binaries
    install_binaries
    log_success "Tor binaries updated successfully to version $latest_version"
}

# Run main function with all arguments
main "$@"

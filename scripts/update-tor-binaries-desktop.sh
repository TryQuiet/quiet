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

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Help function
show_help() {
    cat << EOF
Tor Binary Update Script for Quiet Desktop

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --force             Force update even if recent download exists
    --help, -h          Show this help message

DESCRIPTION:
    Downloads and installs the latest Tor binaries for all desktop platforms
    (Linux, macOS x64, macOS ARM64, Windows)

EXAMPLES:
    $0                  # Update Tor binaries to latest version
    $0 --force          # Force update even if recently downloaded
EOF
}


# Get latest Tor Browser version from releases page
get_latest_tor_version() {
    log_info "Checking for latest Tor Browser version..."
    local latest_version=""
    
    # Check the dist server directory listing
    if command -v curl >/dev/null 2>&1; then
        latest_version=$(curl -s "$TOR_PROJECT_BASE_URL/" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | sort -V | tail -n1 || echo "")
    elif command -v wget >/dev/null 2>&1; then
        latest_version=$(wget -qO- "$TOR_PROJECT_BASE_URL/" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | sort -V | tail -n1 || echo "")
    fi
    
    if [[ -n "$latest_version" ]]; then
        log_info "Latest Tor Browser version: $latest_version"
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
    
    for download in "${downloads[@]}"; do
        local url="$base_url/$download"
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
        
        # Verify download
        if [[ ! -f "$download" ]] || [[ ! -s "$download" ]]; then
            log_error "Download verification failed for $download"
            return 1
        fi
        
        log_success "Downloaded $download"
    done
    
    log_success "All downloads completed"
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


# Main execution function
main() {
    local force_update=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                force_update=true
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
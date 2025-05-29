#!/bin/bash

# Tor Binary Update Script for Quiet
# This script helps automate the process of updating Tor binaries across all platforms

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
Tor Binary Update Script for Quiet

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --check-only        Check for new Tor versions without downloading
    --download          Download and extract new Tor binaries
    --install           Install downloaded binaries (use after --download)
    --validate          Validate installed binaries work correctly
    --full              Run complete update process (download + install + validate)
    --force             Force update even if versions appear same
    --help, -h          Show this help message

EXAMPLES:
    $0 --check-only     # Check what would be updated
    $0 --download       # Download latest Tor binaries  
    $0 --install        # Install downloaded binaries
    $0 --validate       # Test that binaries work
    $0 --full           # Complete automated update

WORKFLOW:
    1. Run --check-only to see what would change
    2. Run --download to fetch new binaries
    3. Review changes, run tests manually if desired
    4. Run --install to replace current binaries
    5. Run --validate to ensure everything works
    
    Or use --full for automated process (use with caution!)
EOF
}

# Get current Tor version
get_current_tor_version() {
    local tor_binary="$TOR_DIR/linux/tor"
    
    if [[ ! -f "$tor_binary" ]]; then
        echo "unknown"
        return
    fi
    
    # Try to get version with library path
    local version=""
    if command -v timeout >/dev/null 2>&1; then
        version=$(timeout 10s env LD_LIBRARY_PATH="$TOR_DIR/linux" "$tor_binary" --version 2>/dev/null | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || echo "")
    else
        version=$(env LD_LIBRARY_PATH="$TOR_DIR/linux" "$tor_binary" --version 2>/dev/null | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || echo "")
    fi
    
    if [[ -n "$version" ]]; then
        echo "$version"
    else
        echo "unknown"
    fi
}

# Get latest Tor Browser version from releases page
get_latest_tor_version() {
    log_info "Checking for latest Tor Browser version..."
    
    # Try to get latest version from Tor Project API/releases
    local latest_version=""
    
    # Method 1: Check the dist server directory listing
    if command -v curl >/dev/null 2>&1; then
        latest_version=$(curl -s "$TOR_PROJECT_BASE_URL/" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | sort -V | tail -n1 || echo "")
    elif command -v wget >/dev/null 2>&1; then
        latest_version=$(wget -qO- "$TOR_PROJECT_BASE_URL/" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | sort -V | tail -n1 || echo "")
    fi
    
    if [[ -n "$latest_version" ]]; then
        echo "$latest_version"
    else
        log_error "Could not determine latest Tor Browser version"
        exit 1
    fi
}

# Compare version strings (returns 0 if first > second, 1 if equal, 2 if first < second)
compare_versions() {
    local version1="$1"
    local version2="$2"
    
    if [[ "$version1" == "$version2" ]]; then
        return 1
    fi
    
    # Use sort -V for version comparison
    local sorted=$(printf '%s\n%s\n' "$version1" "$version2" | sort -V)
    local first_line=$(echo "$sorted" | head -n1)
    
    if [[ "$first_line" == "$version1" ]]; then
        return 2  # version1 < version2
    else
        return 0  # version1 > version2
    fi
}

# Check for updates
check_updates() {
    log_info "Checking current Tor version..."
    local current_version=$(get_current_tor_version)
    log_info "Current Tor version: $current_version"
    
    local latest_version=$(get_latest_tor_version)
    log_info "Latest Tor Browser version: $latest_version"
    
    if [[ "$current_version" == "unknown" ]]; then
        log_warning "Cannot determine current Tor version"
        log_info "Latest available: $latest_version"
        return 0
    fi
    
    # Note: We can't directly compare Tor binary version to Tor Browser version
    # This is a limitation - we should enhance this later
    log_info "Available Tor Browser version: $latest_version"
    log_info "Note: Tor binary version may differ from Tor Browser version"
    
    return 0
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
    
    # Backup current binaries
    local backup_dir="$TOR_DIR.backup.$(date +%Y%m%d_%H%M%S)"
    log_info "Creating backup at $backup_dir"
    cp -r "$TOR_DIR" "$backup_dir"
    
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
    
    log_success "All binaries installed. Backup created at: $backup_dir"
    return 0
}

# Validate installed binaries
validate_binaries() {
    log_info "Validating installed Tor binaries..."
    
    # Test Linux binary
    log_info "Testing Linux binary..."
    local linux_tor="$TOR_DIR/linux/tor"
    if [[ -f "$linux_tor" ]]; then
        local version=""
        if command -v timeout >/dev/null 2>&1; then
            version=$(timeout 10s env LD_LIBRARY_PATH="$TOR_DIR/linux" "$linux_tor" --version 2>/dev/null | head -n1 || echo "")
        else
            version=$(env LD_LIBRARY_PATH="$TOR_DIR/linux" "$linux_tor" --version 2>/dev/null | head -n1 || echo "")
        fi
        
        if [[ -n "$version" ]]; then
            log_success "Linux binary works: $version"
        else
            log_error "Linux binary validation failed"
            return 1
        fi
    else
        log_error "Linux binary not found"
        return 1
    fi
    
    # Test macOS binaries (basic file checks only - can't execute on Linux)
    local macos_x64_tor="$TOR_DIR/darwin/x64/tor"
    local macos_arm64_tor="$TOR_DIR/darwin/arm64/tor"
    
    if [[ -f "$macos_x64_tor" && -x "$macos_x64_tor" ]]; then
        log_success "macOS x64 binary exists and is executable"
    else
        log_error "macOS x64 binary validation failed"
        return 1
    fi
    
    if [[ -f "$macos_arm64_tor" && -x "$macos_arm64_tor" ]]; then
        log_success "macOS ARM64 binary exists and is executable"
    else
        log_error "macOS ARM64 binary validation failed"
        return 1
    fi
    
    # Test Windows binary (basic file check only)
    local windows_tor="$TOR_DIR/win32/tor.exe"
    if [[ -f "$windows_tor" ]]; then
        log_success "Windows binary exists"
    else
        log_error "Windows binary validation failed"
        return 1
    fi
    
    log_success "All binary validations passed"
    return 0
}

# Main execution function
main() {
    local action=""
    local force_update=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check-only)
                action="check"
                shift
                ;;
            --download)
                action="download"
                shift
                ;;
            --install)
                action="install"
                shift
                ;;
            --validate)
                action="validate"
                shift
                ;;
            --full)
                action="full"
                shift
                ;;
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
    
    if [[ -z "$action" ]]; then
        log_error "No action specified"
        show_help
        exit 1
    fi
    
    # Verify we're in the right directory
    if [[ ! -d "$TOR_DIR" ]]; then
        log_error "Tor directory not found: $TOR_DIR"
        log_error "Make sure you're running this from the Quiet project root"
        exit 1
    fi
    
    case "$action" in
        "check")
            check_updates
            ;;
        "download")
            local latest_version=$(get_latest_tor_version)
            download_tor_bundles "$latest_version"
            extract_binaries
            ;;
        "install")
            install_binaries
            ;;
        "validate")
            validate_binaries
            ;;
        "full")
            log_warning "Running full automated update. Use with caution!"
            local latest_version=$(get_latest_tor_version)
            download_tor_bundles "$latest_version"
            extract_binaries
            install_binaries
            validate_binaries
            log_success "Full update completed successfully"
            ;;
        *)
            log_error "Invalid action: $action"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
#!/bin/bash

# Tor Binary Update Script for Quiet
# This script helps automate the process of updating Tor binaries for desktop platforms and Android.

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly TOR_DIR="$PROJECT_ROOT/3rd-party/tor"
readonly ANDROID_TOR_DIR="$PROJECT_ROOT/packages/mobile/android/app/src/main/jniLibs/arm64-v8a"
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

    # GPG availability already checked in check_dependencies()

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
    Downloads and installs the latest Tor binaries for desktop and Android platforms
    - Desktop: Linux, macOS universal binary, Windows
    - Android: ARM64 libtor.so extracted from Tor Browser APK
    
    All downloads are verified using GPG signatures from the Tor Project
    to ensure authenticity and integrity.

EXAMPLES:
    $0                  # Update all Tor binaries (desktop + Android)
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



# Download desktop Tor Browser bundles
download_desktop_bundles() {
    local browser_version="$1"
    log_info "Downloading Tor Browser $browser_version for desktop platforms..."
    
    local base_url="$TOR_PROJECT_BASE_URL/$browser_version"
    
    # Define download URLs for each platform
    local downloads=(
        "tor-browser-linux-x86_64-${browser_version}.tar.xz"
        "tor-browser-macos-${browser_version}.dmg"
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
    
    log_success "All desktop downloads completed and verified"
    return 0
}

# Download Android Tor Browser APK
download_android_apk() {
    local browser_version="$1"
    log_info "Downloading Tor Browser $browser_version for Android..."
    
    local base_url="$TOR_PROJECT_BASE_URL/$browser_version"
    local apk_file="tor-browser-android-aarch64-${browser_version}.apk"
    
    cd "$TEMP_DIR"
    
    # Initialize GPG before downloading
    if ! init_gpg; then
        log_error "Failed to initialize GPG"
        return 1
    fi
    
    local url="$base_url/$apk_file"
    local sig_url="${url}.asc"
    
    # Download the APK file
    log_info "Downloading $apk_file..."
    
    if command -v curl >/dev/null 2>&1; then
        if ! curl -L -o "$apk_file" "$url"; then
            log_error "Failed to download $apk_file"
            return 1
        fi
    elif command -v wget >/dev/null 2>&1; then
        if ! wget -O "$apk_file" "$url"; then
            log_error "Failed to download $apk_file"
            return 1
        fi
    else
        log_error "Neither curl nor wget available for downloading"
        return 1
    fi
    
    # Download the signature file
    log_info "Downloading signature for $apk_file..."
    
    if command -v curl >/dev/null 2>&1; then
        if ! curl -L -o "${apk_file}.asc" "$sig_url"; then
            log_error "Failed to download signature for $apk_file"
            return 1
        fi
    elif command -v wget >/dev/null 2>&1; then
        if ! wget -O "${apk_file}.asc" "$sig_url"; then
            log_error "Failed to download signature for $apk_file"
            return 1
        fi
    fi
    
    # Verify download exists and is not empty
    if [[ ! -f "$apk_file" ]] || [[ ! -s "$apk_file" ]]; then
        log_error "Download verification failed for $apk_file"
        return 1
    fi
    
    # Verify GPG signature
    if ! verify_signature "$apk_file"; then
        log_error "GPG signature verification failed for $apk_file"
        log_error "This could indicate a compromised download. Aborting."
        return 1
    fi
    
    log_success "Downloaded and verified $apk_file"
    return 0
}

# Extract desktop binaries from downloaded bundles
extract_desktop_binaries() {
    log_info "Extracting Tor binaries from downloaded desktop bundles..."
    
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
    mkdir -p extracted/{linux,darwin,win32}
    
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

    # Extract macOS bundle from DMG
    log_info "Extracting macOS bundle..."
    local dmg_file=$(find . -name "tor-browser-macos-*.dmg" | head -n1)
    if [[ -z "$dmg_file" ]]; then
        log_error "Could not find macOS DMG file"
        return 1
    fi

    if [[ "$(uname)" == "Darwin" ]]; then
        # macOS: Use hdiutil
        local mount_point=$(mktemp -d)
        hdiutil attach -quiet -nobrowse -mountpoint "$mount_point" "$dmg_file" || {
            log_error "Failed to mount macOS DMG"
            return 1
        }
    else
        # Linux: Use dmg2img + 7z (dependencies already checked)
        # Convert DMG to IMG, then extract with 7z
        log_info "Converting DMG to IMG format..."
        dmg2img "$dmg_file" tor-browser.img || {
            log_error "Failed to convert DMG to IMG"
            return 1
        }
        
        log_info "Extracting from IMG file..."
        local mount_point="tor_browser_extracted"
        mkdir -p "$mount_point"
        7z x -o"$mount_point" tor-browser.img >/dev/null || {
            log_error "Failed to extract IMG file"
            return 1
        }
    fi

    # Extract binaries from Tor Browser.app
    if [[ "$(uname)" == "Darwin" ]]; then
        local tor_app="$mount_point/Tor Browser.app"
    else
        # On Linux, 7z extracts with the full path structure
        local tor_app="$mount_point/Tor Browser/Tor Browser.app"
    fi
    if [[ -d "$tor_app" ]]; then
        # macOS Tor Browser stores tor binaries in the MacOS directory
        local tor_resources="$tor_app/Contents/MacOS/Tor"
        
        # Check if tor binary exists
        if [[ -f "$tor_resources/tor" ]]; then
            # macOS: Copy universal binary to single darwin directory
            log_info "Copying macOS universal binaries..."
            cp "$tor_resources/tor" extracted/darwin/tor
            cp "$tor_resources"/*.dylib extracted/darwin/ 2>/dev/null || true
            chmod +x extracted/darwin/tor
            log_success "Extracted macOS universal binaries"
        else
            log_error "Could not find tor binary in macOS bundle"
            if [[ "$(uname)" == "Darwin" ]]; then
                hdiutil detach "$mount_point" -quiet
            fi
            return 1
        fi
    else
        log_error "Could not find Tor Browser.app in DMG"
        if [[ "$(uname)" == "Darwin" ]]; then
            hdiutil detach "$mount_point" -quiet
        fi
        return 1
    fi

    # Cleanup extraction
    if [[ "$(uname)" == "Darwin" ]]; then
        # Unmount the DMG on macOS
        hdiutil detach "$mount_point" -quiet
    else
        # Clean up temporary files on Linux
        rm -f tor-browser.img
        rm -rf "$mount_point"
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
    
    log_success "All desktop binaries extracted successfully"
    return 0
}

# Extract Android libtor.so from APK
extract_android_binaries() {
    log_info "Extracting libtor.so from Android APK..."
    
    cd "$TEMP_DIR"
    
    # unzip availability already checked in check_dependencies()
    
    # Find the Android APK file
    local apk_file=$(find . -name "tor-browser-android-aarch64-*.apk" | head -n1)
    if [[ -z "$apk_file" ]]; then
        log_error "Android APK file not found"
        return 1
    fi
    
    log_info "Extracting from $(basename "$apk_file")..."
    
    # Create extraction directory
    mkdir -p extracted/android
    
    # Extract the APK (which is just a ZIP file)
    if ! unzip -q "$apk_file" -d apk_extract/; then
        log_error "Failed to extract APK file"
        return 1
    fi
    
    # Find and copy libtor.so for arm64-v8a
    local libtor_path="apk_extract/lib/arm64-v8a/libTor.so"
    if [[ -f "$libtor_path" ]]; then
        cp "$libtor_path" extracted/android/libtor.so
        log_success "Extracted libtor.so from Android APK"
    else
        log_error "Could not find libTor.so in APK at $libtor_path"
        return 1
    fi
    
    # Clean up APK extraction
    rm -rf apk_extract/ 2>/dev/null || true
    
    log_success "Android binary extracted successfully"
    return 0
}

# Install extracted desktop binaries
install_desktop_binaries() {
    log_info "Installing extracted desktop Tor binaries..."
    
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
    
    # Install macOS universal binaries
    if [[ -d "$extracted_dir/darwin" ]]; then
        log_info "Installing macOS universal binaries..."
        cp "$extracted_dir/darwin"/* "$TOR_DIR/darwin/"
        log_success "Installed macOS universal binaries"
    fi
    
    # Install Windows binaries
    if [[ -d "$extracted_dir/win32" ]]; then
        log_info "Installing Windows binaries..."
        cp "$extracted_dir/win32"/* "$TOR_DIR/win32/"
        log_success "Installed Windows binaries"
    fi
    
    log_success "All desktop binaries installed."
    return 0
}

# Install extracted Android binaries
install_android_binaries() {
    log_info "Installing extracted Android Tor binaries..."
    
    local extracted_dir="$TEMP_DIR/extracted"
    if [[ ! -d "$extracted_dir" ]]; then
        log_error "No extracted binaries found. Run extraction first."
        return 1
    fi
    
    # Create Android directory if it doesn't exist
    mkdir -p "$ANDROID_TOR_DIR"
    
    # Install Android libtor.so
    if [[ -f "$extracted_dir/android/libtor.so" ]]; then
        log_info "Installing Android libtor.so..."
        cp "$extracted_dir/android/libtor.so" "$ANDROID_TOR_DIR/"
        log_success "Installed Android libtor.so"
    else
        log_error "No Android libtor.so found to install"
        return 1
    fi
    
    log_success "Android binaries installed."
    return 0
}


# Check all required dependencies before starting
check_dependencies() {
    log_info "Checking required dependencies..."
    
    # Check for GPG (required for signature verification)
    if ! command -v gpg >/dev/null 2>&1; then
        log_error "GPG is not installed. GPG is REQUIRED to verify download signatures."
        log_error "This is a security requirement to ensure download integrity."
        log_error "On macOS, install GPG with: brew install gnupg"
        log_error "On Ubuntu/Debian, install GPG with: sudo apt install gnupg"
        log_error "On Red Hat/Fedora, install GPG with: sudo dnf install gnupg2"
        return 1
    fi
    
    # Check for download tools
    if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
        log_error "Neither curl nor wget is available for downloading"
        log_error "Install with: sudo apt install curl (Debian/Ubuntu)"
        log_error "          or: sudo dnf install curl (Red Hat/Fedora)"
        return 1
    fi
    
    # Check for unzip (required for Android APK extraction)
    if ! command -v unzip >/dev/null 2>&1; then
        log_error "unzip command not found. Required for Android APK extraction."
        log_error "Install with: sudo apt install unzip (Debian/Ubuntu)"
        log_error "          or: sudo dnf install unzip (Red Hat/Fedora)"
        return 1
    fi
    
    # Platform-specific dependency checks
    if [[ "$(uname)" != "Darwin" ]]; then
        # Linux: Check for DMG extraction tools
        if ! command -v dmg2img >/dev/null 2>&1; then
            log_error "dmg2img is required to extract macOS DMG files on Linux"
            log_error "Install with: sudo apt install dmg2img (Debian/Ubuntu)"
            log_error "            or: sudo dnf install dmg2img (Red Hat/Fedora)"
            return 1
        fi
        
        if ! command -v 7z >/dev/null 2>&1; then
            log_error "7z is required to extract macOS DMG files on Linux"
            log_error "Install with: sudo apt install p7zip-full (Debian/Ubuntu)"
            log_error "            or: sudo dnf install p7zip-plugins (Red Hat/Fedora)"
            return 1
        fi
    fi
    
    log_success "All required dependencies are available"
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
    
    # Check all dependencies before starting
    if ! check_dependencies; then
        log_error "Missing required dependencies. Please install them before running this script."
        exit 1
    fi
    
    # Run tests if requested
    if [[ "$test_verify" == true ]]; then
        test_gpg_verification
        exit $?
    fi
    
    # Download and install Tor binaries
    local latest_version=$(get_latest_tor_version)
    log_info "Updating all Tor binaries to version $latest_version..."
    
    download_desktop_bundles "$latest_version"
    download_android_apk "$latest_version"
    extract_desktop_binaries
    extract_android_binaries
    install_desktop_binaries
    install_android_binaries
    
    log_success "All Tor binaries updated successfully to version $latest_version"
}

# Run main function with all arguments
main "$@"

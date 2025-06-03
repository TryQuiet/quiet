# Quiet Scripts

This directory contains utility scripts for maintaining the Quiet project.

## update-tor-binaries-desktop.sh

Downloads and installs the latest Tor binaries for all desktop platforms (Linux, macOS x64/ARM64, Windows).

### Usage

```bash
# Update Tor binaries to latest version
./scripts/update-tor-binaries-desktop.sh

# Force update even if recently downloaded  
./scripts/update-tor-binaries-desktop.sh --force
```

### Integration with Release Process

```bash
# Update Tor binaries after each release
./scripts/update-tor-binaries-desktop.sh

# Run tests to ensure compatibility
cd packages/backend && npm run test-ci-tor

# Commit changes
git add 3rd-party/tor/
git commit -m "Update Tor binaries to latest version"
```

### Security

- Downloads from official Tor Project servers
- Requires manual execution (no automatic updates)
# Quiet Scripts

This directory contains utility scripts for maintaining the Quiet project.

## update-tor.sh

Automates the process of updating Tor binaries across all platforms (Linux, macOS, Windows).

### Features

- **Safe workflow**: Step-by-step process with validation at each stage
- **Multi-platform**: Updates binaries for Linux, macOS (x64/ARM64), and Windows
- **Automatic backups**: Creates timestamped backups before installing
- **Validation**: Tests that updated binaries work correctly
- **Error handling**: Comprehensive error checking and rollback capability

### Quick Start

```bash
# 1. Check what would be updated
./scripts/update-tor.sh --check-only

# 2. Download latest Tor binaries
./scripts/update-tor.sh --download

# 3. Install the downloaded binaries
./scripts/update-tor.sh --install

# 4. Validate everything works
./scripts/update-tor.sh --validate
```

### Usage Options

| Option | Description |
|--------|-------------|
| `--check-only` | Check for new versions without downloading |
| `--download` | Download and extract new binaries to temp directory |
| `--install` | Install downloaded binaries (creates backup first) |
| `--validate` | Test that installed binaries work correctly |
| `--full` | Complete automated update (use with caution) |
| `--force` | Force update even if versions appear same |
| `--help` | Show help message |

### Recommended Workflow

1. **Check first**: Run `--check-only` to see current vs available versions
2. **Download safely**: Run `--download` to fetch new binaries
3. **Review changes**: Check what was downloaded, run manual tests if desired
4. **Install with backup**: Run `--install` to replace binaries (automatic backup created)
5. **Validate**: Run `--validate` to ensure everything works
6. **Test thoroughly**: Run backend tests: `cd packages/backend && npm run test-ci-tor`

### Safety Features

- **Automatic backups**: Creates timestamped backup before installing
- **Validation**: Tests binaries work before considering update complete
- **Step-by-step process**: Each stage can be run independently
- **Error handling**: Fails fast with clear error messages
- **Cleanup**: Removes temporary files automatically

### Example Output

```bash
$ ./scripts/update-tor.sh --check-only
[INFO] Checking current Tor version...
[INFO] Current Tor version: 0.4.8.16
[INFO] Latest Tor Browser version: 14.5.3
[INFO] Note: Tor binary version may differ from Tor Browser version

$ ./scripts/update-tor.sh --validate
[INFO] Validating installed Tor binaries...
[INFO] Testing Linux binary...
[SUCCESS] Linux binary works: Tor version 0.4.8.16
[SUCCESS] macOS x64 binary exists and is executable
[SUCCESS] macOS ARM64 binary exists and is executable  
[SUCCESS] Windows binary exists
[SUCCESS] All binary validations passed
```

### Limitations

- **Version comparison**: Cannot directly compare Tor binary version to Tor Browser version
- **Cross-platform testing**: Can only fully test Linux binaries on Linux systems
- **Network dependency**: Requires internet connection to check for updates
- **Manual review recommended**: Always review changes before committing

### Troubleshooting

**Download fails**: Check internet connection and Tor Project website availability

**Extraction fails**: Ensure sufficient disk space and write permissions

**Validation fails**: Check that required libraries are present and binary has execute permissions

**Binary doesn't work**: Restore from backup directory (created during install)

### Integration with Release Process

Add to your release checklist:

```bash
# After each release, update Tor binaries
./scripts/update-tor.sh --check-only
./scripts/update-tor.sh --download  
./scripts/update-tor.sh --install
./scripts/update-tor.sh --validate

# Run tests to ensure compatibility
cd packages/backend && npm run test-ci-tor

# Commit changes
git add 3rd-party/tor/
git commit -m "Update Tor binaries to latest version"
```

### Security Considerations

- Downloads are fetched from official Tor Project servers
- Binaries are validated before installation
- Backups allow quick rollback if issues occur
- Script requires manual execution (no automatic updates)

For questions or issues, see the main project documentation or create an issue.
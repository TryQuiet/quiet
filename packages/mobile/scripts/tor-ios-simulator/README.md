# Pinned Tor.framework 405.9.1: isolated arm64 iOS Simulator preparation

The source recipe builds the missing arm64 simulator slice only. It does not upgrade Tor, OpenSSL, libevent, or xz, and source compilation never reads or modifies Quiet's shipped device framework. The expected product is a dynamic `Tor.framework`, preserving the existing Objective-C `TORController` / `TORThread` API. The separate opt-in Storybook build below temporarily installs this simulator framework and restores the original pod before returning.

Source pins and archive SHA256s are recorded in `source-manifest.json`:

| Component | Version | Commit |
| --- | --- | --- |
| Tor.framework | 405.9.1 | `8c50f3c74edd9a5cf57c02a7b13311e70ff64657` |
| Tor | 0.4.5.9 | `d0ed04d50e80fe1c1ef1bf89edebc51581a6039f` |
| OpenSSL | 1.1.1k | `fd78df59b0f656aefe96e39533130454aa957c00` |
| libevent | 2.1.12 | `5df3037d10556bfcb675bc73e516978b75fc7bc7` |
| xz | 5.2.5 | `2327a461e1afce862c22269b80d3517801103c1b` |
| xcconfigs | pinned | `4ced0ad5a971220917994a4edfa6abf9702e3818` |

The framework tag's submodule gitlinks determine every dependency commit; archive URLs use HTTPS upstream repositories/mirrors. `reproduce-source.py NEW_DESTINATION` verifies every archive before creating the output directory, extracts with Python's safe data filter, and applies the checked patch. It needs Python 3.12+ and `patch`, and refuses an existing destination. Unsupported archive member types are rejected; contained symbolic links and executable source scripts are retained. Downloads and generated sources stay outside the repository.

The patch in `patches/quiet-arm64-simulator.patch` makes these build-only changes:

* Restrict dependency scripts to `arm64` + `iphonesimulator`; use the explicit `arm64-apple-ios17.1-simulator` compiler target and selected simulator sysroot. Set `--host=aarch64-apple-darwin` for autotools cross builds.
* Add an OpenSSL target inheriting `ios-common` plus `aarch64_asm`, with `SIXTY_FOUR_BIT_LONG RC4_CHAR` and the existing `ios64` Mach-O assembly flavor. Stock `iossimulator-xcrun` has no ARM assembly selection and defaults to 32-bit bignum limbs; `ios64-xcrun` hardcodes device flags. The custom target keeps 64-bit generated headers paired with its exact libraries. Configure-only verification selected ARMv8 AES/SHA/Montgomery and armcap sources. Assembly generation contains no device platform directives; clang's explicit target determines the object platform.
* Disable obsolete bitcode flags; cap all direct and recursive `make` calls to `QUIET_TOR_BUILD_JOBS=1` (only `1` or `2` accepted), and fail immediately on build errors. Tolerate only cleanup of absent prior outputs/Makefiles.
* Use Apple Silicon Homebrew tool paths, export GNU libtool selection, and skip optional xz man-page translations. Keep all upstream C/Objective-C implementations unchanged.
* Remove the two project exclusions blocking simulator arm64. No device builds are allowed by the adapted scripts.
* Test dependency architectures with `lipo -verify_arch` exit status: matching text in an error incorrectly treated a missing library as built whenever its path contained `arm64`. Retry Tor configuration after a failed first attempt.
* Fix upstream's attempted copying of OpenSSL 3-only headers from pinned OpenSSL 1.1.1k.
* Use Apple `libtool -static` to combine Tor archives on Darwin. The old extraction/rearchive script includes each archive's symbol index as an ordinary member, producing duplicate `__.SYMDEF` members rejected by Xcode26's linker.
* Supply verified source revision metadata for tar archives, using the pinned framework commit date for deterministic version-header generation. Keep `CFBundleShortVersionString=405.9.1` and Tor's exact pinned revision string.

On the Mac, use a new dedicated task directory, not the Quiet checkout. Required existing tools: full Xcode 26.3, autoconf, automake, GNU libtool, gettext/autopoint, Perl, make, and bc. The script reports missing prerequisites and does not install anything. Allow at least 3 GiB free disk before starting. Stop simulators, Metro, and other builds first on the 8 GiB host.

From the repository root, prepare a new source directory on either Linux or macOS:

```sh
python3 packages/mobile/scripts/tor-ios-simulator/reproduce-source.py /tmp/quiet-tor4059-source
```

If preparation ran on Linux, transfer that directory to the Mac using a new destination. Replace `mac-host` with the SSH host name:

```sh
tar -C /tmp -czf - quiet-tor4059-source | \
  ssh mac-host 'test ! -e /tmp/quiet-tor4059-source && test ! -L /tmp/quiet-tor4059-source && tar -xzf - -C /tmp'
```

The archive transfer preserves the source tree's symbolic links.

On the Mac, enter the prepared directory and build:

```sh
cd /tmp/quiet-tor4059-source
DEVELOPER_DIR=/Applications/Xcode-26.3.0.app/Contents/Developer \
QUIET_TOR_BUILD_JOBS=1 ./build-arm64-simulator.sh
```

The build script uses one Xcode job, disables signing/debug-symbol/index output, and saves `build-arm64-simulator.log`. It checks the resulting binary is arm64, its Mach-O platform is `IOSSIMULATOR`, and its framework version is 405.9.1. Output:

```
build/Build/Products/Release-iphonesimulator/Tor.framework
```

After this isolated build passes, separately review symbols and runtime behavior before shipping any integration. Permanent packaging into an XCFramework must extract/copy the current shipped device slice unchanged and combine the existing x86_64 simulator slice with this new arm64 simulator slice; never rebuild or strip the device slice. Preserve all existing public headers, module map, and license notices.

For an opt-in ARM simulator Storybook validation build, use an isolated Quiet checkout with its JavaScript dependencies and iOS pods already installed. Select the supported host Node on `PATH` and the intended Xcode using `DEVELOPER_DIR` or `xcode-select`. Run from that checkout's repository root, after all other builds and pod installs in the checkout have stopped:

```sh
python3 packages/mobile/scripts/tor-ios-simulator/build-storybook.py \
  --checkout "$PWD" \
  --framework /tmp/quiet-tor4059-source/build/Build/Products/Release-iphonesimulator/Tor.framework \
  --output /tmp/quiet-storybook-arm64-validation
```

The output directory must be new and outside both inputs. The wrapper requires Quiet's Podfile/workspace, Tor podspec405.9.1, and the original installed Tor binary SHA256 `6cc459716e6ff20c75b653f6534b98d5b5d1cb488a447d77d077f5a06ba57cc5`. It verifies that the supplied framework retains version405.9.1, contains only arm64 simulator code, uses `@rpath/Tor.framework/Tor`, and has no non-system external library dependencies. No framework download or pod update runs in this step.

The wrapper moves the entire original pod framework aside and copies the simulator framework into its place. This avoids modifying files that CocoaPods may hard-link to its cache. It compiles Storybook without provisioning, using two Xcode jobs and a bundled JavaScript payload, monitors a 2 GiB free-disk floor, and stops its child process before restoring the original tree on success, failure, or `INT`/`TERM`/`HUP`. Restoration verifies every original file hash, mode, and symbolic link. Do not run another app build or pod install in that checkout until the wrapper finishes. An uncatchable kill can leave `Pods/Tor/Build/iOS/Tor.framework.quiet-original` or a stale lock; recover and verify the original tree using the saved `original-tree.json` evidence before removing the lock or rerunning.

After compilation, the wrapper signs only the outer simulator app with `codesign --force --sign - --preserve-metadata=entitlements,identifier,flags`, then requires `codesign --verify --strict` to pass. This local ad hoc signature supplies the resource envelope needed for simulator installation; the linker's executable-only signature is insufficient. It uses no production signing identity, key or provisioning profile. The embedded Tor binary must retain the selected source hash after signing.

Outputs include `DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app`, `xcodebuild.log`, `Storybook.xcresult`, framework tree snapshots and `result.json`. A passing result requires the app to contain its bundled JavaScript and to embed the selected simulator Tor binary byte for byte, with `originalRestored: true` and `appSignature: {"identity": "ad-hoc", "strictVerification": true}`. This build command does not boot a simulator, launch the app, change the device framework used by later builds, or demonstrate runtime correctness by itself.

After that guarded build passes, run the Hermes/WebView crypto smoke test using the ARM Detox configuration. From the Quiet repository root:

```sh
cd packages/mobile
DETOX_IOS_ARM64_STORYBOOK_APP=/tmp/quiet-storybook-arm64-validation/DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app \
  npx detox test -c ios.sim.storybook runtime-compatibility \
  --artifacts-location /tmp/quiet-storybook-arm64-runtime-artifacts
```

`ios.sim.storybook` and its compatibility alias `ios.sim.storybook.arm64` consume the same prebuilt app; neither has a build command. Run the guarded build above before `detox test`. `DETOX_IOS_ARM64_STORYBOOK_APP` selects a different guarded build output, and defaults to the path shown above. The simulator defaults to `iPhone 15 Pro` on `iOS 18.5` with `--arch=arm64`; set `DETOX_IOS_SIMULATOR_ID` to select an existing simulator. Node Mobile 24 provides only an arm64 iOS simulator slice, so Intel Storybook builds are no longer supported on this branch. A bundled app does not need Metro for this test.

The other iOS Debug/E2E/Release Detox aliases still contain their earlier Intel build commands. They need follow-up ARM build integration before use with Node Mobile 24; this guarded builder currently supports Storybook only.

The portable rollback tests use disposable framework trees and actual child processes, including signal and low-disk cancellation. They also reject signing failures, failed signature verification, and changes to Tor during signing. Native Xcode, Mach-O inspection and codesign operations are substituted; these tests do not require a native build:

```sh
python3 -B packages/mobile/scripts/tor-ios-simulator/test_build_storybook.py
```

Validation completed on Xcode26.3 (17C529), iOS Simulator SDK26.2, Apple Silicon, with one job: the original Tor executable and Objective-C framework both linked successfully. No C/Objective-C source changes were required. The resulting framework is arm64 / IOSSIMULATOR / minimum iOS17.1, retains framework405.9.1, Tor0.4.5.9 + revision d0ed04d50e80fe1c1, and OpenSSL1.1.1k. Its OpenSSL headers use SIXTY_FOUR_BIT_LONG. The binary exports all five original TOR public classes. Binary size: 6,944,832 bytes; observed SHA256: `611f5193a83f981895a88000a1aef2e0c74704115619b547513dcb8ec6db116b` (toolchain/build paths can affect binary hashes).

Source recreation from all six pinned archives plus the final patch was independently checked against all 5,859 prepared source files/symlinks. Shell syntax checks passed. The corrected cache check was verified with actual Apple lipo; no broad warning/error suppressions were added.

Source compilation and the opt-in Storybook build remain separate from runtime validation. Any shipped integration must retain the existing device slices and include app/runtime checks before a replacement build input is shipped.

Primary sources:

* https://github.com/iCepa/Tor.framework/tree/v405.9.1
* https://github.com/iCepa/Tor.framework/blob/v405.9.1/Tor/openssl.sh
* https://github.com/openssl/openssl/blob/fd78df59b0f656aefe96e39533130454aa957c00/Configurations/15-ios.conf
* https://github.com/iCepa/Tor.framework/blob/v405.9.1/Tor.xcodeproj/project.pbxproj

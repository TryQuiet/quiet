# Pinned Tor.framework 405.9.1: isolated arm64 iOS Simulator preparation

The source recipe builds the missing arm64 simulator slice only. It does not upgrade Tor, OpenSSL, libevent, or xz, and source compilation never reads or modifies Quiet's shipped device framework. The expected product is a dynamic `Tor.framework`, preserving the existing Objective-C `TORController` / `TORThread` API. The separate opt-in simulator build below temporarily installs this simulator framework and restores the original pod before returning.

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

The output is a reusable builder-owned workspace outside both inputs; its parent must already exist. The first invocation creates a private directory and `.quiet-ios-simulator-workspace.json`. Later invocations require the same canonical checkout, build selection and Tor hashes recorded in that marker. Existing directories without the matching marker are rejected without adoption or cleanup. Symlinked workspace/control paths and DerivedData links escaping the workspace are rejected. The wrapper requires Quiet's Podfile/workspace, Tor podspec405.9.1, and the original installed Tor binary SHA256 `6cc459716e6ff20c75b653f6534b98d5b5d1cb488a447d77d077f5a06ba57cc5`. It verifies that the supplied framework retains version405.9.1, contains only arm64 simulator code, uses `@rpath/Tor.framework/Tor`, and has no non-system external library dependencies. No framework download or pod update runs in this step.

The historical script name and Storybook defaults are preserved. These are the only supported `--scheme`, `--configuration`, and `--env-file` combinations:

| Build | Scheme | Configuration | Environment file |
| --- | --- | --- | --- |
| Storybook (default) | `Storybook` | `Debug` | `.env.storybook` |
| Standard Debug | `Quiet` | `Debug` | `.env.staging` |
| Standard E2E | `Quiet` | `Debug` | `.env.e2e` |
| QSS E2E | `Quiet` | `Debug` | `.env.e2e.qss` |
| QSS provider E2E | `Quiet` | `Debug` | `.env.e2e.qss.push` |
| Release | `Quiet` | `Release` | `.env.production` |

The selected environment must exist as a regular file in `packages/mobile`. Invalid combinations and missing files fail before changing the pod or creating output. Both Xcode scheme preactions honor `ENVFILE`, with their existing defaults when it is unset; this prevents their `/tmp/envfile` selection from overriding E2E or production builds. Because that selector is shared, serialize builds across Quiet checkouts on the same host as well.

The pinned source patch declares `Tor/version.sh` as an input and `Tor/version.h`
as its generated output. Without that dependency, a clean Xcode build can reject
the version header before preprocessing the framework's Info.plist. The native
regression below uses the prepared source's actual script phase and version files
in a tiny framework: removing the output declaration must fail, and restoring it
must produce framework version `405.9.1`. It does not compile Tor itself.

```sh
QUIET_TOR_PREPARED_SOURCE=/absolute/path/to/prepared-tor-source \
  python3 -m unittest discover -s packages/mobile/scripts/tor-ios-simulator \
  -p test_generated_version.py -v
```

The wrapper moves the entire original pod framework aside and copies the simulator framework into its place. This avoids modifying files that CocoaPods may hard-link to its cache. It compiles the selected scheme without provisioning, using two Xcode jobs and a bundled JavaScript payload, monitors a 2 GiB free-disk floor, and stops its child process before restoring the original tree on success, failure, or `INT`/`TERM`/`HUP`. Restoration verifies every original file hash, mode, and symbolic link. Exclusive workspace and pod locks reject overlapping invocations; no lock is reclaimed automatically. Do not run another app build or pod install in that checkout until the wrapper finishes. An uncatchable kill can leave `Pods/Tor/Build/iOS/Tor.framework.quiet-original`, the pod lock or the output's `.build.lock`. Confirm the build and its children have stopped, then recover and verify the original tree using that run's saved `original-tree.json` evidence before removing stale locks or rerunning.

After compilation, the wrapper signs only the outer simulator app with `codesign --force --sign - --preserve-metadata=entitlements,identifier,flags`, then requires `codesign --verify --strict` to pass. This local ad hoc signature supplies the resource envelope needed for simulator installation; the linker's executable-only signature is insufficient. It uses no production signing identity, key or provisioning profile. The embedded Tor binary must retain the selected source hash after signing.

`DerivedData/Build/Products/<configuration>-iphonesimulator/Quiet.app` stays at the same path and DerivedData is reused on subsequent builds. Each build admitted after both locks are acquired creates `runs/<unique-id>/` containing `xcodebuild.log`, `<scheme>.xcresult`, framework tree snapshots and its own `result.json`; completed runs are retained. The root `result.json` is replaced atomically with that build's status and paths, including native build failures. Preparation or lock rejections leave existing results untouched, so the build command's exit status remains authoritative. A failed rebuild can leave prior products on disk; run Detox only after the build succeeds. The result records the scheme, configuration, environment filename and bundled-JavaScript hash. A passing result requires the app to contain its bundled JavaScript and to embed the selected simulator Tor binary byte for byte, with `originalRestored: true` and `appSignature: {"identity": "ad-hoc", "strictVerification": true}`. This build command does not boot a simulator, launch the app, change the device framework used by later builds, or demonstrate runtime correctness by itself.

After that guarded build passes, run the Hermes/WebView crypto smoke test using the ARM Detox configuration. From the Quiet repository root:

```sh
cd packages/mobile
DETOX_IOS_ARM64_STORYBOOK_APP=/tmp/quiet-storybook-arm64-validation/DerivedData/Build/Products/Debug-iphonesimulator/Quiet.app \
  npx detox test -c ios.sim.storybook runtime-compatibility \
  --artifacts-location /tmp/quiet-storybook-arm64-runtime-artifacts
```

`ios.sim.storybook` and its compatibility alias `ios.sim.storybook.arm64` consume the same prebuilt app; neither has a build command. Run the guarded build above before `detox test`. `DETOX_IOS_ARM64_STORYBOOK_APP` selects a different guarded build output, and defaults to the path shown above. The simulator defaults to `iPhone 15 Pro` on `iOS 18.5` with `--arch=arm64`; set `DETOX_IOS_SIMULATOR_ID` to select an existing simulator. Node Mobile 24 provides only an arm64 iOS simulator slice, so Intel Storybook builds are no longer supported on this branch. A bundled app does not need Metro for this test.

The standard simulator configurations invoke this same guarded builder through `detox build`:

| Detox configuration | Environment | Default output directory | Output override |
| --- | --- | --- | --- |
| `ios.sim.debug`, `ios.sim.debug.ci` | staging | `/tmp/quiet-debug-arm64-validation` | `DETOX_IOS_ARM64_DEBUG_OUTPUT` |
| `ios.sim.e2e` | E2E | `/tmp/quiet-e2e-arm64-validation` | `DETOX_IOS_ARM64_E2E_OUTPUT` |
| `ios.sim.e2e.qss` | QSS E2E | `/tmp/quiet-e2e.qss-arm64-validation` | `DETOX_IOS_ARM64_E2E_QSS_OUTPUT` |
| `ios.sim.release` | production | `/tmp/quiet-release-arm64-validation` | `DETOX_IOS_ARM64_RELEASE_OUTPUT` |

Set `DETOX_IOS_ARM64_TOR_FRAMEWORK` if the prepared framework is elsewhere; its default is the framework path in the example above. Each output override selects both the builder workspace and Detox app path. Keep it the same for `detox build`, later rebuilds and `detox test`: the identical build command is rerunnable. Select a different output for another checkout or build selection, or when an existing directory predates workspace ownership markers. All iOS simulator configurations use ARM and accept `DETOX_IOS_SIMULATOR_ID`; the standard local and CI device model defaults remain `iPhone 15 Pro` and `iPhone 15`. The invalid `ios.att.e2e` and `ios.att.e2e.qss` aliases, which paired iOS apps with Android attached devices, have been removed; use `ios.sim.e2e` and `ios.sim.e2e.qss` for simulator testing.

The manual workflow [`.github/workflows/e2e-ios.yml`](../../../../.github/workflows/e2e-ios.yml) uses the standard ARM `macos-15` runner, selects Xcode 26.3, and creates one iPhone 16 Pro on iOS 18.5. The toolchain/runtime pair is listed in GitHub's [macOS 15 ARM image manifest](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-arm64-Readme.md). GitHub's [standard runner specification](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) lists 7 GB RAM and 14 GB storage for this ARM label. Measured local checkout/dependencies, one native workspace and the QSS fixture already occupy about 13.4 GiB before Tor, Git and simulator overhead. The workflow therefore removes unused versioned Xcode bundles **only on an ephemeral GitHub-hosted runner**, preserving the selected Xcode and simulator runtime locations, and requires 25 GiB free before installing dependencies. This cleanup refuses developer/self-hosted machines.

Node comes from `.nvmrc`; Python 3.12 and the locked Ruby/Bundler/CocoaPods dependencies are selected explicitly. Checkout's submodule commits are preserved. The workflow builds the shared backend and desktop before either mobile app, prepares this pinned Tor framework, and runs the bundled staging starter and message acknowledgment/persistence suites without Metro. It saves their evidence and removes only the finished, ownership-checked staging DerivedData before building `.env.e2e.qss` in a separate guarded workspace. The build marker includes the environment selection, so the two selections cannot share a workspace. Builds run sequentially within a 180-minute job budget.

The [native QSS fixture](../qss-e2e/README.md) then starts owned Postgres, Redis and QSS processes on loopback using its separately pinned Node 22.14.0. The same simulator runs the QSS single-player test followed by the six-stage desktop/iOS suite, with fresh private handoffs and default Detox synchronization. No Docker or SSH connection is required. An empty temporary Firebase plist permits simulator builds without push service credentials and is removed afterward. Cleanup stops only the fixture processes and deletes the created simulator. Baseline Detox artifacts/screenshot and native build evidence are retained for seven days. QSS runtime logs and invitations stay private; uploaded QSS runtime evidence contains only outcomes, counts, persistence booleans and pinned source revisions.

Local ARM Mac execution passed both QSS suites; this is not a hosted CI pass. Hosted execution still needs publication of the authentication submodule commit and the workflow change, including a credential with workflow-write permission. Runner image availability and actual disk capacity are checked by the job when dispatched.

The workflow's portable regression tests execute its actual shell steps against a disposable simulator-command recorder, exercise the installed Detox CLI and real configuration with a recording builder, and verify temporary plist creation/cleanup with Python. They cover failed simulator creation/boot, exact cleanup, build failure propagation, both environment/output handoffs, fresh QSS run directories and private failure logs. Helper tests exercise the actual builder's environment-specific ownership marker, cache retirement, disk cleanup boundaries and secret-canary redaction. These checks do not simulate a passing native build or runtime test:

```sh
node --test packages/mobile/scripts/e2e-ios-workflow.test.cjs
python3 -B packages/mobile/scripts/qss-e2e/test_ci_helpers.py
```

For example, from `packages/mobile`, after preparing Tor and stopping other builds:

```sh
npx detox build -c ios.sim.e2e
# Rebuild after source changes using the same workspace and app path:
npx detox build -c ios.sim.e2e
npx detox test starter -c ios.sim.e2e
```

The portable rollback tests use disposable framework trees and actual child processes, including signal and low-disk cancellation. They cover repeated builds with one DerivedData path and separate retained evidence, failure and retry, ownership/path rejection, concurrent workspace locking, all six build selections, the Release signing path, and execution of the checked-in scheme shell commands with disposable output paths. They also reject signing failures, failed signature verification, and changes to Tor during signing. Native Xcode, Mach-O inspection and codesign operations are substituted; these tests do not require a native build:

```sh
python3 -B packages/mobile/scripts/tor-ios-simulator/test_build_storybook.py
```

When mobile dependencies are installed and Node is on `PATH`, the same suite also resolves the actual Detox configurations and executes their generated build commands with a disposable argument-recording child. These checks cover ARM app/device selection, output overrides and shell quoting without invoking Xcode or a device; only this Detox portion is skipped when its dependencies are unavailable.

Failed builds also include `compilerDiagnostics` in the existing `result.json` artifact: up to 40 distinct compiler errors with tool, severity, owned source location and a fixed error category. Raw diagnostic text, source excerpts, script output, environment values and external host paths remain in the private log. Unknown compiler errors retain their location with `unclassified-compiler-error`; this field is diagnostic evidence, not an additional pass criterion.

Repeatability was also verified on Xcode26.3: two consecutive identical `detox build -c ios.sim.debug` commands reused one verified, owned DerivedData cache and the same app path. Both completed with separate logs/result bundles, exact original Tor restoration and strict ad hoc app signature verification; the first run's saved result remained unchanged after the second.

Validation completed on Xcode26.3 (17C529), iOS Simulator SDK26.2, Apple Silicon, with one job: the original Tor executable and Objective-C framework both linked successfully. No C/Objective-C source changes were required. The resulting framework is arm64 / IOSSIMULATOR / minimum iOS17.1, retains framework405.9.1, Tor0.4.5.9 + revision d0ed04d50e80fe1c1, and OpenSSL1.1.1k. Its OpenSSL headers use SIXTY_FOUR_BIT_LONG. The binary exports all five original TOR public classes. Binary size: 6,944,832 bytes; observed SHA256: `611f5193a83f981895a88000a1aef2e0c74704115619b547513dcb8ec6db116b` (toolchain/build paths can affect binary hashes).

Source recreation from all six pinned archives plus the final patch was independently checked against all 5,859 prepared source files/symlinks. Shell syntax checks passed. The corrected cache check was verified with actual Apple lipo; no broad warning/error suppressions were added.

Source compilation and the opt-in simulator build remain separate from runtime validation. Any shipped integration must retain the existing device slices and include app/runtime checks before a replacement build input is shipped.

Primary sources:

* https://github.com/iCepa/Tor.framework/tree/v405.9.1
* https://github.com/iCepa/Tor.framework/blob/v405.9.1/Tor/openssl.sh
* https://github.com/openssl/openssl/blob/fd78df59b0f656aefe96e39533130454aa957c00/Configurations/15-ios.conf
* https://github.com/iCepa/Tor.framework/blob/v405.9.1/Tor.xcodeproj/project.pbxproj

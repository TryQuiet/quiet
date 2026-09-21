# Quiet's embedded Node runtime

Quiet vendors the **full Node 24.18.0** Android and iOS artifacts from the
community fork's [v24.18.0-0 prerelease](https://github.com/gmaclennan/nodejs-mobile/releases/tag/v24.18.0-0).
This changes the backend runtime inside the mobile app. The build host remains
Node 20.20.1, and React Native runs JavaScript in Hermes. Desktop's locked
[Electron 32.3.3 embeds Node 20.18.1](https://releases.electronjs.org/release/v32.3.3),
so this mobile update exceeds desktop's Node major version.

## Verify or restore the vendored files

Run from the repository root with Python 3.9 or newer:

```sh
python3 packages/mobile/scripts/nodejs-mobile-runtime/install.py --check
python3 packages/mobile/scripts/nodejs-mobile-runtime/test_install.py

# Explicitly restore the exact pinned runtime from its release archives:
python3 packages/mobile/scripts/nodejs-mobile-runtime/install.py --install
```

`--check` is the default and uses no network. A Git LFS checkout is required for
the iOS `NodeMobile` binaries. The installer can also restore those files from
the pinned archives when LFS objects have not been fetched.

`--install` downloads approximately 116 MB in total. `--cache /absolute/path`
selects the archive cache; by default it uses `quiet-nodejs-mobile-downloads`
under the system temporary directory. An existing cache file with a wrong
size or checksum causes an error; remove that cache file before retrying.
Both archive SHA-256 values and all extracted file hashes must match before
the installer replaces any runtime directory. It rejects archive traversal,
symlinks, and duplicate paths, and restores the previous directories if a
replacement fails. It writes only these four locations:

- `android/app/libnode/bin/arm64-v8a`
- `android/app/libnode/include/node`
- `ios/NodeJsMobile/NodeMobile.xcframework`
- `ios/NodeJsMobile/libnode/include/node`

The existing classic-level 1.4.1 addon binaries and Tor framework are separate
inputs and are preserved.

## Provenance and rebuilding

[runtime.json](runtime.json) records the archive URLs, SHA-256 values, exact
source commits, and installed file hashes. Both downloaded archive digests were
checked against GitHub's release asset metadata. The prerelease uses an
**unsigned tag**; these checks identify the publisher's exact artifacts, rather
than independently establishing their source correspondence.

The fork's
[recipe at a01faac8af0250a07f30a5e06e5730feb8de874e](https://github.com/gmaclennan/nodejs-mobile/tree/a01faac8af0250a07f30a5e06e5730feb8de874e)
applies a small patch series to upstream `v24.18.0`. Its `scripts/prepare.sh`
requires the reconstructed source tree to equal
`d83ac4fedea727d77a2856d2de813340c5fbf3a3`. The release tag resolves to the
[materialized source commit f15e3d1133f84efc7888bc7eaf4cf9462273e9d2](https://github.com/gmaclennan/nodejs-mobile/commit/f15e3d1133f84efc7888bc7eaf4cf9462273e9d2).
To reconstruct that source in an otherwise empty directory:

```sh
git init nodejs-mobile-recipe
git -C nodejs-mobile-recipe fetch --depth 1 https://github.com/gmaclennan/nodejs-mobile.git a01faac8af0250a07f30a5e06e5730feb8de874e
git -C nodejs-mobile-recipe checkout --detach FETCH_HEAD
cd nodejs-mobile-recipe
scripts/prepare.sh
```

Build commands run in the generated `out/` directory. The pinned
[build instructions](https://github.com/gmaclennan/nodejs-mobile/blob/a01faac8af0250a07f30a5e06e5730feb8de874e/docs/BUILDING.md)
use Linux, NDK r27d (`27.3.13750724`), and Android API 24 for
`tools/android_build.sh <ndk-path> 24 arm64`; iOS uses macOS/Xcode and
`tools/ios_framework_prepare.sh arm64` or `arm64-simulator`. Python 3.12/3.13
with setuptools is needed. Leave `NODEJS_MOBILE_FLAVOR` unset for the full build.
These helper scripts use all available CPU cores: limit their build jobs before
using a machine with limited memory. A cold release build took roughly two to
three hours per platform/architecture in the publisher's
[release run](https://github.com/gmaclennan/nodejs-mobile/actions/runs/31479624590).

No independent rebuild or binary reproducibility comparison was performed for
these vendored artifacts. The same release run completed Android/iOS build,
curated test, native addon, and real device smoke jobs; that upstream evidence
does not replace testing Quiet's bridge, storage, and backend.

[LICENSE.node](LICENSE.node) is the materialized source tree's license file;
[LICENSE.polywasm](LICENSE.polywasm) covers the added WebAssembly implementation.

## Compatibility and validation boundaries

- Android keeps Quiet's existing `arm64-v8a` ABI. The release also contains
  ARMv7 and x86_64 runtimes, which this installer does not add to the app.
  Every `PT_LOAD` segment in the downloaded ARM64 `libnode.so` has 16 KB
  alignment. APK ZIP alignment and the other native libraries need their
  usual checks after building. The runtime depends on `libc++_shared.so`,
  supplied by the app's native build.
- The iOS XCFramework contains **arm64 device and arm64 simulator** variants.
  Intel/x86_64 simulator support is removed by this runtime update. Both have
  minimum iOS 14 and were built with SDK 26.5. The outer framework path,
  `@rpath/NodeMobile.framework/NodeMobile` install name, and `node_start` C entry
  point match Quiet's existing integration.
- Node's C++ module ABI changes from 108 to **137**; Node-API supports versions
  1 through **10**. Quiet's bridge uses a linked Node-API module plus libuv and
  is recompiled with the new headers. Keep its explicit `NM_F_LINKED`
  registration. Classic-level's Node-API interface permits reuse across Node
  majors; an old V8/C++ ABI addon would need rebuilding. All 39 Node/Node-API
  imports of Quiet's existing Android classic-level binary are exported by the
  new library. Both iOS slices also export all 39 Node/Node-API imports of
  Quiet's existing device addon. Symbol checks alone do not prove successful
  loading or database compatibility.
- The full flavor retains small ICU, inspector, SQLite, and TypeScript
  stripping. The lite flavor removes them. Full is used to avoid additional
  feature removals while upgrading the runtime; it still has less locale data
  than desktop's full ICU build.
- iOS continues to run V8 without JIT. The fork removes unused compiler tiers
  and installs [polywasm](https://github.com/evanw/polywasm) when native
  WebAssembly is absent, allowing Node's undici-based `fetch` to work. This is
  a JavaScript implementation with slower execution and a limited WebAssembly
  feature set; see the pinned
  [FAQ](https://github.com/gmaclennan/nodejs-mobile/blob/a01faac8af0250a07f30a5e06e5730feb8de874e/docs/FAQ.md).
- Android now honors embedder-provided variables such as `NODE_OPTIONS` and
  `NODE_PATH` through the fork's `SafeGetenv` patch. Review native launch
  settings using the pinned
  [embedding notes](https://github.com/gmaclennan/nodejs-mobile/blob/a01faac8af0250a07f30a5e06e5730feb8de874e/docs/EMBEDDING.md).

Acceptance requires actual Android and iOS app startup with the native bridge,
classic-level open/write/read/iterate/close/reopen across processes, existing
encrypted storage, crypto operations, and the normal Tor/community flow. The
installer tests validate artifact handling only; they make no native execution
claim. Record device results in the migration verification document.

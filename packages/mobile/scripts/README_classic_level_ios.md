# Building classic-level for the iOS simulator

Run on macOS with full Xcode selected and Node 20.19.4 or newer:

```sh
node packages/mobile/scripts/build-classic-level-ios.cjs --output /tmp/quiet-classic-level-ios
```

The output directory must not exist. The script downloads SHA-512-pinned
`classic-level@1.4.1` and `napi-macros@2.2.2` source archives, without running npm
install scripts. It compiles the bundled LevelDB and Snappy sources with the
repository's Node Mobile 18.20.4 headers for iOS 17.1 arm64 and x86_64 simulators.
It requires no embedded Node upgrade, Node binary download, or obsolete Python 2
`nodejs-mobile-gyp` installation. Allow a few minutes for the two native builds.

The output contains `classic-level.xcframework`, source licenses, and a build
manifest recording pinned inputs, toolchain versions, exported platform data and
hashes. The existing `ios/classic-level.framework` supplies the device variant;
every device framework file is checked for byte-for-byte preservation after
packaging. Its install name, constructor registration and signatures are retained.
The script leaves project references, linkage settings, and vendored frameworks
unchanged. The two simulator architectures are combined only with each other,
as required by Apple's [XCFramework packaging guidance](https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle).

The new simulator addon exports `napi_register_module_v1` and requests Node-API 3.
[Node Mobile 18.20.4's loader](https://github.com/nodejs-mobile/nodejs-mobile/blob/v18.20.4/src/node_binding.cc#L465)
supports this symbol registration. Quiet's existing `process.dlopen` override
changes only the path, so no registration shim is needed. N-API calls resolve
from the already-loaded NodeMobile framework. The simulator's framework name and
embedded path match the existing override mapping.

The project selects the integrated artifact at
`packages/mobile/ios/classic-level/classic-level.xcframework`. Its sibling
`build-manifest.json` and `licenses` directory record the build inputs and source
licenses. The original `ios/classic-level.framework` remains the preserved device
input for rebuilding. Regenerating an artifact does not automatically replace
the integrated copy.

Before replacing the integrated artifact, run the real host addon test:

```sh
node --test packages/mobile/scripts/build-classic-level-ios.test.cjs
# Optionally verify against an installed Node 18.20.4 executable:
QUIET_TEST_NODE=/path/to/node-v18.20.4/bin/node node --test packages/mobile/scripts/build-classic-level-ios.test.cjs
```

This downloads the same pinned sources, compiles a native host addon with the
same headers and source recipe, and loads it through the actual Quiet preload
and framework mapping. It writes compressed LevelDB tables, closes and reopens
the database, verifies persisted values and missing-key errors, and checks that
the artifact-preservation guard catches binary and metadata changes. It requires
a host C++ compiler and runs on macOS or Linux; it is separate from the mobile
JavaScript unit suite. The host test does not establish iOS runtime compatibility.
The simulator build also validates each Mach-O platform, architecture and Node-API
initializer export. An app build and launch remain necessary after integration.

For acceptance on a simulator, follow the
[embedded Node database smoke instructions](../e2e/fixtures/README_embedded_node_database.md).
The standalone fixture runs inside a separate copy of the real app, asserts the
native bridge and Node 18.20.4 identity, and loads the addon through Quiet's normal
preload and framework mapping. It checks writes, reads, forward/reverse iteration,
compressed persistent tables and reopening, then repeats the reads after an actual
app-process restart. Select `DETOX_IOS_ARCH=arm64` or `x86_64` to match the installed
simulator runtime and all native frameworks; a relaunch must preserve that runtime
identity. These instructions do not establish an iOS runtime pass on their own.
Also create a community in
the standard app and confirm it survives an app relaunch; a successful frontend
render alone does not validate the embedded addon or its framework linkage.

The project selects the XCFramework's correct variant while retaining the app's
existing weak linkage and embedded `classic-level.framework/classic-level` path.
Do not rewrite the device binary's unusual install name as part of this
change. The pinned Tor 405.9.1 framework is a separate limitation: it has an
x86_64 simulator slice but no arm64 simulator slice. A full app launch needs a
compatible x86_64/Rosetta simulator, or a separate Tor arm64 simulator build.

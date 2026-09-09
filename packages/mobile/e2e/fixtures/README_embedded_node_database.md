# Embedded Node database smoke

This fixture runs inside Quiet's real iOS app, through `RNNodeJsMobile`, vendored
Node Mobile 18.20.4, the linked `rn_bridge` module, and the existing `dlopen` path
override. It supports arm64 and x86_64 simulator builds and uses a dedicated directory
under the native bridge's Documents directory. It exercises the addon separately
from the production backend, which remains unchanged in the original built app.

The normal build copies only `nodejs-assets/nodejs-project` and
`nodejs-modules/builtin_modules`; this `e2e/fixtures` file is never shipped. Native
AppDelegate starts `nodejs-project/bundle.cjs` after Tor's local control connection
is ready, including in Storybook. The normal native launcher preloads the path
override before that entry point. A missing verdict can therefore precede Node
startup; it does not by itself establish an addon failure.

Run from `packages/mobile` on the Mac. Set `DETOX_IOS_SIMULATOR_ID` to a fresh
simulator created for this test and `DETOX_IOS_ARCH` to its build architecture,
`arm64` or `x86_64`. The installed simulator runtime must support that architecture
and the app's deployment targets, including the notification service extension.
All embedded frameworks must include the selected simulator architecture. In
particular, the original Tor 405.9.1 framework needs a separately built arm64
simulator variant before this probe can run on arm64.

Build Storybook with the selected architecture and `FORCE_BUNDLING=1`. React
Native's existing bundle fallback then loads `main.jsbundle` when Metro is stopped;
no production AppDelegate change is needed. The explicit command below overrides
the architecture rather than relying on the x86_64 Detox build preset.

```sh
: "${DETOX_IOS_SIMULATOR_ID:?Set this to the owned, fresh simulator UUID}"
: "${DETOX_IOS_ARCH:?Set arm64 or x86_64 to match the simulator runtime}"
case "$DETOX_IOS_ARCH" in
  arm64) quiet_smoke_node_arch=arm64 ;;
  x86_64) quiet_smoke_node_arch=x64 ;;
  *) printf '%s\n' 'DETOX_IOS_ARCH must be arm64 or x86_64' >&2; exit 1 ;;
esac
FORCE_BUNDLING=1 ENVFILE=.env.storybook xcodebuild \
  -workspace ios/Quiet.xcworkspace -scheme Storybook -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ios/build/storybook -jobs 2 \
  ARCHS="$DETOX_IOS_ARCH" ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO
```

After the build completes, stop Metro before booting the owned simulator if host
memory is limited. Boot that simulator with the matching architecture and wait
for it to finish starting before installing the app copy below.
Choose a new public run ID for each independent attempt; reuse it only for the
intentional second launch below.

```sh
: "${DETOX_IOS_SIMULATOR_ID:?Set this to the owned, fresh simulator UUID}"
: "${quiet_smoke_node_arch:?Run the architecture selection above first}"
quiet_smoke_simulator="$DETOX_IOS_SIMULATOR_ID"
quiet_smoke_run="rn081-$(date -u +%Y%m%d-%H%M%S)-$$"
quiet_storybook_app="$PWD/ios/build/storybook/Build/Products/Debug-iphonesimulator/Quiet.app"
quiet_smoke_bundle=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$quiet_storybook_app/Info.plist")
quiet_smoke_directory=$(mktemp -d /tmp/quiet-embedded-node-smoke.XXXXXX)
cp -cRp "$quiet_storybook_app" "$quiet_smoke_directory/Quiet.app"
cp e2e/fixtures/embedded-node-database.cjs "$quiet_smoke_directory/Quiet.app/nodejs-project/bundle.cjs"
# Refresh the copied app's signature only when the source app was signed.
if codesign -d "$quiet_storybook_app" >/dev/null 2>&1; then
  codesign --force --sign - --preserve-metadata=entitlements,identifier "$quiet_smoke_directory/Quiet.app"
fi
xcrun simctl install "$quiet_smoke_simulator" "$quiet_smoke_directory/Quiet.app"
SIMCTL_CHILD_QUIET_EMBEDDED_NODE_DATABASE_RUN_ID="$quiet_smoke_run" \
  SIMCTL_CHILD_QUIET_EMBEDDED_NODE_DATABASE_ARCH="$quiet_smoke_node_arch" \
  xcrun simctl launch --terminate-running-process "$quiet_smoke_simulator" "$quiet_smoke_bundle"
quiet_smoke_data=$(xcrun simctl get_app_container "$quiet_smoke_simulator" "$quiet_smoke_bundle" data)
quiet_smoke_result="$quiet_smoke_data/Documents/quiet-embedded-node-smoke/$quiet_smoke_run/result.json"
cat "$quiet_smoke_result"
```

The copy uses APFS cloning where available, keeping disk use small until files
change. Wait for `status: "pass"` and `stage: "complete"`, using bounded polling. A running
verdict records the current operation; a failure records only an error name/code
and stage. Read this dedicated verdict file instead of capturing all console
output: the existing NodeRunner prints environment values during initialization.
If the native bridge itself cannot load, the fixture can only emit a sanitized
`QUIET_EMBEDDED_NODE_DATABASE` console marker because it has no native data directory.

The first verdict must report `fixtureVersion: 2`, `nativeBridge: true`, `node: "18.20.4"`,
`platform: "ios"`, `architecture` matching `quiet_smoke_node_arch`, ABI `108`, `preloadCached: true`,
`placeholderBytes: 0`, and `launch: 1`. Database assertions verify:

- Eight distinct values written synchronously, and sixteen successful reads.
- Forward and reverse iteration returning all eight exact key/value pairs,
  across bounded batches, with both iterators explicitly closed.
- Two database open/close cycles, including reopening without create-if-missing.
- Persistent `.ldb` files whose size proves the repetitive values were compressed.
- The expected `LEVEL_NOT_FOUND` error for a missing key.

Then verify persistence across an actual app-process restart:

```sh
xcrun simctl terminate "$quiet_smoke_simulator" "$quiet_smoke_bundle"
SIMCTL_CHILD_QUIET_EMBEDDED_NODE_DATABASE_RUN_ID="$quiet_smoke_run" \
  SIMCTL_CHILD_QUIET_EMBEDDED_NODE_DATABASE_ARCH="$quiet_smoke_node_arch" \
  xcrun simctl launch "$quiet_smoke_simulator" "$quiet_smoke_bundle"
cat "$quiet_smoke_result"
```

Wait for a new passing verdict with `launch: 2`, a different `pid`, and
`database.created: false`, `rowsWritten: 0`, `rowsRead: 16`, and both iterator
counts equal to eight. The Node version, platform, architecture, module ABI and
Node-API version must match the previous launch. The fixture rejects changed
runtime identities and incomplete/failed prior runs; use a fresh run ID when
changing the fixture or runtime, or retrying a failure. It never exits the embedded Node process
or imports the production backend. The real bridge handles pause/resume events.

Restore the original app for ordinary Storybook or backend testing:

```sh
xcrun simctl terminate "$quiet_smoke_simulator" "$quiet_smoke_bundle"
xcrun simctl install "$quiet_smoke_simulator" "$quiet_storybook_app"
```

`node --test scripts/build-classic-level-ios.test.cjs` tests the shared database
exercise against the real compiled host addon and verifies that a host process
without the actual native bridge fails. Host results do not replace this iOS run.

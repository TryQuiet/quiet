# Embedded Node database smoke

This fixture runs inside Quiet's real iOS app, through `RNNodeJsMobile`, vendored
Node Mobile 18.20.4, the linked `rn_bridge` module, and the existing `dlopen` path
override. It requires the x86_64 simulator framework and uses a dedicated directory
under the native bridge's Documents directory. It exercises the addon separately
from the production backend, which remains unchanged in the original built app.

The normal build copies only `nodejs-assets/nodejs-project` and
`nodejs-modules/builtin_modules`; this `e2e/fixtures` file is never shipped. Native
AppDelegate starts `nodejs-project/bundle.cjs` after Tor's local control connection
is ready, including in Storybook. The normal native launcher preloads the path
override before that entry point. A missing verdict can therefore precede Node
startup; it does not by itself establish an addon failure.

Build Storybook with `FORCE_BUNDLING=1`. React Native's existing bundle fallback
then loads `main.jsbundle` when Metro is stopped. After that build completes,
run from `packages/mobile` on the Mac. Set `DETOX_IOS_SIMULATOR_ID` to a fresh
x86_64 iOS 18.5 simulator created for this test.
Choose a new public run ID for each independent attempt; reuse it only for the
intentional second launch below.

```sh
: "${DETOX_IOS_SIMULATOR_ID:?Set this to the owned, fresh simulator UUID}"
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

The first verdict must report `nativeBridge: true`, `node: "18.20.4"`,
`platform: "ios"`, `architecture: "x64"`, ABI `108`, `preloadCached: true`,
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
  xcrun simctl launch "$quiet_smoke_simulator" "$quiet_smoke_bundle"
cat "$quiet_smoke_result"
```

Wait for a new passing verdict with `launch: 2`, a different `pid`, and
`database.created: false`, `rowsWritten: 0`, `rowsRead: 16`, and both iterator
counts equal to eight. The fixture rejects incomplete/failed prior runs; use a
fresh run ID when retrying a failure. It never exits the embedded Node process
or imports the production backend. The real bridge handles pause/resume events.

Restore the original app for ordinary Storybook or backend testing:

```sh
xcrun simctl terminate "$quiet_smoke_simulator" "$quiet_smoke_bundle"
xcrun simctl install "$quiet_smoke_simulator" "$quiet_storybook_app"
```

`node --test scripts/build-classic-level-ios.test.cjs` tests the shared database
exercise against the real compiled host addon and verifies that a host process
without the actual native bridge fails. Host results do not replace this iOS run.

# React Native New Architecture and embedded Node upgrade

This work is stacked on [#3422](https://github.com/TryQuiet/quiet/pull/3422),
which establishes React Native 0.81.5, Hermes, and Android API 36 on the legacy
architecture. The follow-up enables Fabric and bridgeless native modules, then
upgrades the separate Node runtime that executes Quiet's backend.

## Plan and acceptance checks

1. Enable the New Architecture on Android and iOS. Register Android's generated
   native components alongside the Node JNI library and route app lifecycle and
   notification callbacks through the managed React host.
2. Select and pin a reproducible newer nodejs-mobile runtime for both platforms.
   Desktop locks Electron 32.3.3, which embeds Node 20.18.1; the monorepo's
   Node 20.20.1 setting controls build tools. Official nodejs-mobile releases
   currently stop at 18.20.4, so evaluate maintained forks and their source/build
   provenance before replacing the vendored runtime.
3. Run real Hermes/Fabric/bridgeless UI checks, native module and lifecycle event
   round-trips, Android navigation/photo/rotation/activity restoration tests,
   native builds, and embedded Node database persistence across app processes.
   Verify the installed runtime version and Android 16 KB native alignment.
4. Record the exact validation results and any remaining platform limitations.
   Commit completed work on this worktree's branch before independent review,
   address review findings, and publish the PR with `upgrade/react-native-081`
   as its base.

## Sources

- [Electron 32.3.3 runtime versions](https://releases.electronjs.org/release/v32.3.3)
- [Official nodejs-mobile releases](https://github.com/nodejs-mobile/nodejs-mobile/releases)
- [Node 24 mobile candidate](https://github.com/gmaclennan/nodejs-mobile/releases/tag/v24.18.0-0)

Implementation and native validation are in progress. Enabling the build flags
alone does not establish runtime compatibility.

# Restore the iOS Tor update

Branch: `upgrade/ios-tor-latest`, based on the published Node 24 / React Native
0.81.5 New Architecture branch at `77a07518137928ffa5208f99bc190044550ce0ac`
([PR #3423](https://github.com/TryQuiet/quiet/pull/3423)).

## Dependency and integration

The pin is [Tor.framework v409.11.2](https://github.com/iCepa/Tor.framework/releases/tag/v409.11.2),
the latest upstream release checked on September 15, 2026. It contains Tor
0.4.9.11, libevent 2.1.13, OpenSSL 3.6.3 and liblzma 5.8.3. Its source tag resolves
to `727f628a15dd1bd83e0e171deb0aba7ab18be09e`. The upstream podspec verifies the
downloaded XCFramework archive's SHA-256:

```text
tor.xcframework.zip
a72b44b96e1205bedc29796cb77a84088cfdc41f1093db6ca0a27c802e16d7c4
```

The lockfile changes only Tor and the Podfile checksum. Tor's wrapper is dynamic;
the vendored C library is static. `tor-pod-linkage.rb` links that archive by path
because `Tor.framework` and `tor.framework` otherwise collide on the default
case-insensitive Mac filesystem. A static wrapper failed to link; merely making
the wrapper dynamic fixed a clean build but failed when relinking an existing
wrapper. The native regression runner builds twice with different linker versions
to exercise that failure.

Tor now supplies its own current directory authorities. The override maintained
for 0.4.5.9 is removed. Native lifecycle transitions still use the existing
serialized ACTIVE/DORMANT implementation from [#3356](https://github.com/TryQuiet/quiet/pull/3356).

Tor.framework's logging callback installers enable DEBUG logging in Tor and
libevent before calling Quiet's severity filter. A native thread sample during
a control timeout showed substantial time spent formatting discarded messages
and querying the simulator's timezone service. The callback registrations are
removed; the configured `notice stdout` log and the handler's OSLog diagnostics
remain. The same native network test is used to check this change.

## Reverted bug

[PR #3131](https://github.com/TryQuiet/quiet/pull/3131) updated Tor to 0.4.9.5.
Commit `ed29237d8e08d4e841b3cc6d3041440a6d6cdf6b` reverted it on 7.2.0 after
[#3237](https://github.com/TryQuiet/quiet/issues/3237): joining, leaving, then
rejoining could hang on iOS. The issue's analysis identified an unresponsive
`GETINFO status/bootstrap-phase`, queued `ADD_ONION`, and eventually
`ECONNREFUSED` after foregrounding. It also linked a shutdown/restart mutex
assertion reported on the original upgrade. QA closed #3237 after it stopped
occurring on 9.0.0-alpha.7; that did not restore the newer dependency.

The regression here compiles **the actual production `TorHandler.swift`**, its
real Data extension, and the same Tor pod/link settings into a small iOS host.
It checks the live `GETINFO version`, allows 30 seconds per control command during
cold bootstrap (up to 180 seconds overall), waits for 100% network bootstrap, then runs
20 `DEL_ONION` / controller-close / foreground / `GETINFO` / `ADD_ONION` cycles.
It covers no background transition, acknowledged DORMANT, and an immediate
foreground race. Every rejoin must retain the onion identity, native thread,
control port and authentication cookie. Rejoin control operations must finish within five seconds.
The backend-side client is a real loopback TCP socket: the framework's method
named `disconnect()` sends `SIGNAL SHUTDOWN` and does not model Node's socket close.

This exercises the native/control failure boundary. It does not automate Quiet's
community UI, libp2p join, UIKit process suspension or physical-device lifecycle.
Those checks remain distinct from a passing native control test.

## Run on macOS

Use the repository's supported Node, Ruby/Bundler and Xcode versions. Select full
Xcode with `DEVELOPER_DIR`; install the iOS 18.5 simulator runtime.

```sh
# From packages/mobile; existing checkouts with the old pod need the targeted update.
bundle install
cd ios
bundle exec pod update Tor --no-repo-update
# Fresh checkouts / subsequent builds:
bundle exec pod install --deployment
```

Use a new output directory for each native regression run:

```sh
# From the repository root:
bash packages/mobile/scripts/tor-regression/run.sh "$PWD" /tmp/quiet-tor-regression-1
```

The runner creates and deletes its own simulator. It preserves source hashes,
the resolved pod lockfile, build/test logs and an xcresult. It needs access to
the public Tor network. Failure to bootstrap is a failure, not a skipped pass.

Detox's simulator configurations now use `build-ios.py` and the installed
upstream XCFramework. No locally rebuilt 405.9.1 framework is needed. Use a new
output if an old one was created by the historical replacement wrapper:

```sh
# From packages/mobile after normal backend asset preparation and pod install:
python3 scripts/nodejs-mobile-runtime/install.py --check
export DETOX_IOS_ARM64_DEBUG_OUTPUT=/tmp/quiet-tor40911-app
./node_modules/.bin/detox build -c ios.sim.debug.ci
./node_modules/.bin/detox test starter -c ios.sim.debug.ci
```

The runtime check must pass before building: a source archive can contain Git LFS
pointers instead of the embedded Node binaries. Hydrate those files using the
repository's normal Git LFS setup. Rebuild the pinned submodules, shared packages
and backend too; copied generated assets can silently retain older lifecycle code.

The manual iOS workflow runs the native regression before the standard and QSS
app suites. The deployment workflow no longer attempts to strip bitcode from
the removed `Pods/Tor/Build/iOS/Tor.framework` path.

## Validation record

Validation on September 15, 2026:

| Check | Result |
| --- | --- |
| Native iOS 18.5 / ARM64, Xcode 26.3 | Two passes: 100% bootstrap and 20 rejoin cycles each; 49.055 and 41.023 seconds |
| Forced incremental wrapper relink | Passed through the final runner, changing linker version from 1 to 2 |
| Native iOS device build | ARM64 device slice and production handler compile/link passed; no signing or physical-device run |
| App pod resolution | `pod update Tor --no-repo-update` produced exactly the committed lockfile; subsequent `pod install --deployment` passed |
| Full Quiet simulator app | Debug/staging ARM64 build passed; embedded Tor 0.4.9.11, simulator platform, app signature and unchanged installed XCFramework verified |
| Full app community persistence | Existing `native-community.test.js` passed in 92.107 seconds: created community, stored message with backend acknowledgment, restarted process and recovered message; normal Detox synchronization |
| Current XCFramework builder | 8 portable tests passed |
| Real Detox CLI / workflow routing | 11 tests passed |
| QSS build receipt and fixture harness | Passed, including old-version, modified-framework and changed-pod rejection |
| Historical builder / shared guards | 42 tests passed |
| QSS workspace / fixture helpers | 16 passed, 1 existing platform skip |

Initial probes used a five-second limit even during cold bootstrap and failed
while the simulator parsed the consensus. Samples show expensive timezone-service
calls from both debug log formatting and consensus timestamp parsing. Moving the
probe off the UIKit main thread and allowing 30 seconds during bootstrap lets the
same live test reach the rejoin cases; their five-second limit is unchanged. Those
startup timeouts do **not** establish reproduction of #3237's post-foreground
shutdown/hang. Removing DEBUG callback registration reduces unnecessary work;
it is not claimed as a proven fix for that historical bug.

The final runner's source hashes and xcresult are retained on the validation Mac
under `quiet-ios-tor-validation/native-accepted/`. The earlier passing xcresult is
`quiet-ios-tor-validation/native-final/live-background-client.xcresult`; device
compilation evidence is `quiet-ios-tor-validation/native-final/device-build.xcresult`.
The full app's build receipt, log and xcresult are under
`quiet-ios-tor-app-build/` on the same Mac. Its embedded Tor SHA-256 is
`55ea8908f36a99d1c41d7408b1563dbe9e0b5830b397e9d1e34beba1bf759206`.
The final app contains a freshly rebuilt backend matching
`packages/backend/lib/bundle.cjs`, SHA-256
`fcca3907f8600b6020230661bf696e4c080f813fdc3f1102d9ba53ccebcff83f`.
The validation copy reused installed dependencies, rebuilt the pinned auth
submodule and shared packages, and verified all 275 Node 24.18.0 runtime files.
An initial app smoke attempt using an older copied backend exited on a null
`torPassword` provider, before rejoin. The current source already guards that
provider; rebuilding the backend resolves the asset mismatch. Its startup console
and rebuild logs are retained under `quiet-ios-tor-app-diagnostics/` on the Mac.
The successful retry's test log is `detox-current-native-community.log` in that
directory, with screenshots and native logs in `detox-current-artifacts/`.
An empty Firebase plist was used for the unsigned simulator build, as in the iOS
E2E workflow.
The branch does not claim physical-device, two-peer community rejoin or production signing
validation.

Portable commands:

```sh
node --test packages/mobile/scripts/e2e-ios-workflow.test.cjs
node --test packages/mobile/scripts/qss-community-harness.test.cjs
python3 -B packages/mobile/scripts/tor-ios-simulator/test_build_ios.py
python3 -B packages/mobile/scripts/tor-ios-simulator/test_build_storybook.py
python3 -B -m unittest discover -s packages/mobile/scripts/qss-e2e -p 'test_*.py'
```

Before handoff or review, commit completed work on this same worktree branch.

## Develop refresh — 2026-09-21

Merged current develop/New Architecture while preserving the production
`TorBackgroundTransitions` core. Added that core to the native regression host;
a generated-project test now verifies its real source references and test-host
dependency (15 assertions). The app plist tests also pass (4 tests/32 assertions).
Portable validation passes: 20 workflow/QSS helpers, 50 guarded builder tests,
and 16 QSS fixture/CI helper tests with one existing platform skip. Native Apple
builds and control cycles above were not repeated on this Linux host.

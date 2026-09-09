The QSS one-player suite uses the standard iOS app, real native backend, and an isolated local QSS service. It creates a community through the server offer, username and terms screens. The real hCaptcha WebView uses the provider's public test site key; neither synchronization nor captcha verification is bypassed.

The test requires a backend acknowledgment for the sent message, parses the visible v5 invitation without logging its secrets, records that exact community’s server sequence before sending, requires a higher QSS sequence afterward, and restarts the app to check the saved community and message. The database inspection returns aggregate counts only; these show QSS activity for the community, not which encrypted message was uploaded. The separate mixed desktop/iOS suite proves message-specific QSS delivery through offline peer retrieval. Existing `starter` and `native-community` suites cover the flow without a server.

Run from `packages/mobile` on an ARM Mac with the existing Detox prerequisites. Prepare the pinned Tor simulator framework as described in [the build recipe](../scripts/tor-ios-simulator/README.md), and prepare a local fixture using [the fixture instructions](../scripts/qss-e2e/README.md). Keep the advertised endpoint `ws://localhost:3003` and the fixture’s QSS server identity `localhost` consistent. The service remains bound to loopback; the test rejects a production fixture, a remote native QSS endpoint, or a build from another environment.

```sh
export DETOX_IOS_ARM64_E2E_QSS_OUTPUT=/tmp/quiet-qss-arm64-validation
export DETOX_IOS_ARM64_TOR_FRAMEWORK=/tmp/quiet-tor4059-source/build/Build/Products/Release-iphonesimulator/Tor.framework
export DETOX_IOS_SIMULATOR_ID='<owned simulator UUID>'
export QUIET_QSS_LOCAL_FIXTURE_OUTPUT='<prepared local fixture output>'
./node_modules/.bin/detox build -c ios.sim.e2e.qss

umask 077
export QUIET_QSS_E2E_RUN_DIR="/tmp/quiet-qss-one-player-$(uuidgen)"
python3 scripts/qss-e2e/fixture.py prepare-run \
  --output "$QUIET_QSS_LOCAL_FIXTURE_OUTPUT" --run-output "$QUIET_QSS_E2E_RUN_DIR"
./node_modules/.bin/detox test qss-community -c ios.sim.e2e.qss \
  --artifacts-location "$QUIET_QSS_E2E_RUN_DIR/artifacts"
```

Use an owned simulator: the suite deliberately reinstalls its app and clears its data. Grant notifications through the normal Detox launch permissions. Keep artifacts private because app diagnostics and UI captures can contain invitations. Never use `--reuse` for this fresh-community scenario.

On a single macOS runner, `QUIET_QSS_LOCAL_FIXTURE_OUTPUT` selects direct invocation of `fixture.py storage`. Its polling waits for registration before recording a baseline, then requires the server sequence to increase after the locally acknowledged send. For development with QSS on another owned host, a temporary loopback tunnel and an external coordinator may instead relay private `requests/<id>.json` / `responses/<id>.json` files in the run directory. This optional relay does not alter the app or QSS service. Each response must match the request ID, run ID, team ID and fixture project. Post-send requests include `afterSyncSeq`; responses must contain a larger `maxSyncSeq` and a positive log count. `ui.json` records only public community metadata, acknowledgment/restart outcomes and storage counts, never the invitation secret.

Portable harness checks:

```sh
node --test scripts/qss-community-harness.test.cjs
```

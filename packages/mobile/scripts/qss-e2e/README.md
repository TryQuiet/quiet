# Local QSS for mobile and desktop E2E tests

This fixture builds the checkout's **exact QSS gitlink and its nested auth
gitlink**. It copies committed files into a new private build directory, installs
the frozen QSS lockfile, and uses QSS's existing ESM migration CLI. It does not
run the upstream bootstrap's `git submodule --remote` step. The checkout and its
lockfiles stay unchanged.

Requires Python 3.12+ and Git. Both runtimes need internet access for dependencies
and the hCaptcha test API. QSS uses its pinned Node 22.14.0 and pnpm 10.6.0,
independently of the application's `.nvmrc` tooling.

Initialize the pinned sources using your normal Git credentials:

```sh
git submodule update --init -- 3rd-party/qss
git -C 3rd-party/qss submodule update --init -- 3rd-party/auth
```

For Linux, install Docker Engine and Docker Compose. The image supplies the
pinned Node and pnpm; Postgres and Redis images are pinned by digest. From the
Quiet repository root, choose a **new** task directory:

```sh
python3 packages/mobile/scripts/qss-e2e/fixture.py up \
  --output /tmp/quiet-qss-e2e-my-run
```

Add `--sudo-docker` only if Docker requires existing noninteractive sudo access.
The helper creates a unique Compose project. Only QSS port 3003 is published,
bound to `127.0.0.1`; Postgres and Redis have no host ports. `--port` can change
the host port. Existing stacks, app profiles, and host credential files are not
used. Push delivery is disabled in this local server fixture.
The advertised endpoint is `ws://localhost:3003`, matching QSS's `localhost`
auth identity in both development and production backend bundles. The actual
listener stays bound to `127.0.0.1`. An IP-address invitation can produce a
different auth server name in a production bundle and prevent server sync.

## Native macOS runtime

GitHub requires Linux runners for [Docker service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/use-docker-service-containers).
The native runtime starts Postgres, Redis and QSS directly on a Mac, including
GitHub macOS runners. Install the prerequisites without starting shared services:

```sh
brew update
brew install python@3.13 postgresql@18 redis
export PATH="$(brew --prefix python@3.13)/libexec/bin:$PATH"
```

Download Node 22.14.0 for the runner architecture from
[the official distribution](https://nodejs.org/dist/v22.14.0/) and verify its
archive against `SHASUMS256.txt` before extracting into an owned tool directory.
Pass its executable paths explicitly; Corepack installs the repository-pinned
pnpm into the fixture directory without changing the application's Node setup:

```sh
python3 packages/mobile/scripts/qss-e2e/fixture.py up --runtime native \
  --output "${RUNNER_TEMP:-/tmp}/quiet-qss-e2e-my-run" \
  --node /path/to/node-v22.14.0-darwin-arm64/bin/node \
  --corepack /path/to/node-v22.14.0-darwin-arm64/bin/corepack \
  --postgres-bin "$(brew --prefix postgresql@18)/bin" \
  --redis-server "$(brew --prefix redis)/bin/redis-server"
```

The native runtime uses the same archived sources, environment, frozen install,
migrations and protocol probe as Docker. Each invocation initializes a fresh
Postgres cluster and Redis data directory under its output directory, using
unused loopback ports. QSS listens on loopback port 3003 by default. No
`brew services` commands run. `stop` verifies the recorded PID, owner and process
start time before stopping only the fixture's processes; it retains their data.
The CLI and storage proof contract are the same for both runtimes.
Native database clients use explicit fixture credentials and empty owned
password/service files, with SSL and GSS negotiation disabled for loopback.

## Test handoff and evidence

`manifest.json` records the source revisions, project, endpoint and configuration
digest. `result.json` is written only after `/health` reports healthy Postgres
and the real Socket.IO captcha handlers pass their probe. `private.log` retains
build, migration and failure output. The directory is mode 0700; evidence files
are mode 0600. Failed startup stops only that fixture's services, retaining
their data and evidence.

The fixture uses [hCaptcha's public integration test keys](https://docs.hcaptcha.com/#integration-testing-test-keys).
These generate a token without an interactive challenge. QSS still verifies it
through hCaptcha's actual `siteverify` API. The probe first checks that a missing
token is rejected, then verifies the public test token. This exercises test-key
integration, **not production anti-bot protection**. Mobile should render its
normal hCaptcha WebView; no Redux injection or synchronization bypass is needed.

Prepare a new private test handoff from a successfully started, healthy fixture:

```sh
python3 packages/mobile/scripts/qss-e2e/fixture.py prepare-run \
  --output /tmp/quiet-qss-e2e-my-run --run-output /tmp/quiet-qss-ui-my-run
export QUIET_QSS_LOCAL_FIXTURE_OUTPUT=/tmp/quiet-qss-e2e-my-run
export QUIET_QSS_E2E_RUN_DIR=/tmp/quiet-qss-ui-my-run
```

This creates `fixture.json` with a unique run ID and the exact successful
manifest/result, plus empty private request/response directories. The standard
`ios.sim.e2e.qss` configuration uses `ws://localhost:3003` and queries the local
fixture inspector directly. No SSH connection is needed on a single Mac runner.
Detox also checks live `/health` and `get-captcha-site-key`; the health endpoint
does not itself attest the source revision.

After the app generates an invitation, the UI test can save a private JSON file
containing `teamId` (the decoded invitation's auth team ID) and `runId` (letters,
digits, underscores or hyphens). Inspect only that team's aggregate server data:

```sh
python3 packages/mobile/scripts/qss-e2e/fixture.py storage \
  --output /tmp/quiet-qss-e2e-my-run --ui-proof /tmp/private-ui-proof.json
```

The read-only query returns `runId`, `teamId`, `project`, `communityExists`,
`logEntryCount` and `maxSyncSeq`. It never selects the sigchain or encrypted
message bodies. Require the community to exist and the log count/sequence to
advance after sending; UI `message-stored` alone proves local persistence.
Aggregate count and sequence changes do not identify a particular encrypted
message. To prove that message's QSS durability, the mixed desktop/iOS test must
retrieve its exact text while the sending peer is offline.

```sh
python3 packages/mobile/scripts/qss-e2e/fixture.py status --output /tmp/quiet-qss-e2e-my-run
python3 packages/mobile/scripts/qss-e2e/fixture.py stop --output /tmp/quiet-qss-e2e-my-run
python3 -m unittest discover -s packages/mobile/scripts/qss-e2e -p 'test_*.py' -v
```

`stop` retains containers/native process data and evidence. This helper has no
data deletion command. Keep raw test output and invitation handoffs private.
GitHub-hosted execution still needs to be validated in the workflow.

For real provider delivery, `up --push-credentials /absolute/private/accounts.json`
enables QPS in either runtime for the explicitly supplied Android/iOS Firebase
service accounts. In the native runtime, only the QSS server process receives
those values; dependency installation, compilation and migration processes keep
the push-disabled environment. The mode-0600 runtime file must still match its
recorded digest before QSS starts, and credentials never enter the public manifest.
This is a separate lane: the existing Detox messaging preflight
continues to reject push-enabled fixtures. See the
[Appium provider recipe](../../e2e/appium/README.md). A healthy fixture receipt
alone does not establish FCM/APNs delivery.

# Local QSS for mobile and desktop E2E tests

This fixture builds the checkout's **exact QSS gitlink and its nested auth
gitlink**. It copies committed files into a new private build directory, installs
the frozen QSS lockfile, and uses QSS's existing ESM migration CLI. It does not
run the upstream bootstrap's `git submodule --remote` step. The checkout and its
lockfiles stay unchanged.

Requires Python 3.12+, Git, Docker Engine and Docker Compose. The image supplies
the QSS-pinned Node 22.14.0 and pnpm 10.6.0. Postgres and Redis images are pinned
by digest. Docker needs internet access for the build and hCaptcha test API.

Initialize the pinned sources using your normal Git credentials:

```sh
git submodule update --init -- 3rd-party/qss
git -C 3rd-party/qss submodule update --init -- 3rd-party/auth
```

From the Quiet repository root, choose a **new** task directory:

```sh
python3 packages/mobile/scripts/qss-e2e/fixture.py up \
  --output /tmp/quiet-qss-e2e-my-run
```

Add `--sudo-docker` only if Docker requires existing noninteractive sudo access.
The helper creates a unique Compose project. Only QSS port 3003 is published,
bound to `127.0.0.1`; Postgres and Redis have no host ports. `--port` can change
the host port. Existing stacks, app profiles, and host credential files are not
used. Push delivery is disabled in this local server fixture.

`manifest.json` records the source revisions, project, endpoint and configuration
digest. `result.json` is written only after `/health` reports healthy Postgres
and the real Socket.IO captcha handlers pass their probe. `private.log` retains
build, migration and failure output. The directory is mode 0700; evidence files
are mode 0600. Failed startup stops only that fixture's containers, retaining
their volumes and evidence.

The fixture uses [hCaptcha's public integration test keys](https://docs.hcaptcha.com/#integration-testing-test-keys).
These generate a token without an interactive challenge. QSS still verifies it
through hCaptcha's actual `siteverify` API. The probe first checks that a missing
token is rejected, then verifies the public test token. This exercises test-key
integration, **not production anti-bot protection**. Mobile should render its
normal hCaptcha WebView; no Redux injection or synchronization bypass is needed.

The standard `ios.sim.e2e.qss` configuration uses `ws://127.0.0.1:3003`. If QSS
runs on another machine, establish an owned loopback SSH forward before running
Detox. Copy the private manifest/result to the test coordinator and validate the
expected fixture/project alongside live `/health` and `get-captcha-site-key`.
The health endpoint does not itself attest the source revision.

After the app generates an invitation, the UI test can save a private JSON file
containing `teamId` (the decoded invitation's auth team ID) and `runId` (letters,
digits, underscores or hyphens). Inspect only that team's aggregate server data:

```sh
python3 packages/mobile/scripts/qss-e2e/fixture.py storage \
  --output /tmp/quiet-qss-e2e-my-run --ui-proof /tmp/private-ui-proof.json
```

The read-only query returns `runId`, `project`, `communityExists`,
`logEntryCount` and `maxSyncSeq`. It never selects the sigchain or encrypted
message bodies. Require the community to exist and the log count/sequence to
advance after sending; UI `message-stored` alone proves local persistence.

```sh
python3 packages/mobile/scripts/qss-e2e/fixture.py status --output /tmp/quiet-qss-e2e-my-run
python3 packages/mobile/scripts/qss-e2e/fixture.py stop --output /tmp/quiet-qss-e2e-my-run
python3 -m unittest discover -s packages/mobile/scripts/qss-e2e -p 'test_*.py' -v
```

`stop` retains containers and data volumes. This helper intentionally has no
volume deletion command. Keep raw test output and invitation handoffs private.

## GitHub macOS runners

This implementation requires Docker; it is currently a local Linux fixture.
The repository's existing QSS CI also runs on Linux. GitHub requires Linux
runners for [Docker service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/use-docker-service-containers),
and the existing desktop macOS workflow explicitly disables Docker setup.

For a future macOS CI implementation, retain the same pinned source preparation,
local environment, migrations, protocol probe and storage assertions. Start
native Postgres and Redis binaries with fresh directories under `RUNNER_TEMP`,
loopback listeners and owned process cleanup. Run QSS with its Node 22.14.0 /
pnpm 10.6.0, independently of the application's `.nvmrc` tooling. That native
startup adapter and hosted execution remain unimplemented and unverified.

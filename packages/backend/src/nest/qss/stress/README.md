# QSS stress harness

A scenario-driven test harness that runs the real backend QSS path against a
real QSS server with a [Toxiproxy](https://github.com/Shopify/toxiproxy)
sidecar in front, so each scenario can inject latency, jitter, packet loss,
and forced connection drops at the network layer.

Primary focus: **initial setup** — the fresh-create-community sequence
(`connect` → `GET_CAPTCHA_SITE_KEY` → `VERIFY_CAPTCHA` → `GEN_PUB_KEYS` →
`CREATE_COMMUNITY` → `AUTH_SYNC` handshake). Every step is a real round-trip
against real QSS; the only synthetic piece is the renderer-side captcha solve,
which is replaced by the official hCaptcha test token. QSS in dev is
configured with the matching test secret, so `VERIFY_CAPTCHA` really runs and
really succeeds.

The harness boots only the QSS path of the Nest app (`QSSModule` + the modules
it transitively needs). No tor, no peer-to-peer libp2p — single client talking
to a single QSS server.

## Layout

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Toxiproxy sidecar (host networking, admin :8474). |
| `toxiproxy.ts` | Tiny zero-dep client for the Toxiproxy admin API. |
| `harness.ts` | `bootQssHarness()` — Nest test module wired through the proxy. |
| `precise-faults.ts` | `installWireFaultHooks()` — monkey-patches `qssClient.sendMessage` for per-message faults (drop / delay / error / busy-wait pause) keyed by `WebsocketEvents`. |

Scenario specs live under `scenarios/*.stress.spec.ts` and are landed
separately on top of this tooling.

## Running

Two Node versions are needed:

- **Node 20.20.1** for the backend tests (the stress jest run). Newer Node
  breaks `msgpackr@1.10.2` used inside `3rd-party/auth` with
  `RangeError: length is outside of buffer bounds`.
- **Node 22+** for the QSS Postgres migrations (the QSS submodule's `app/`
  package has `engines.node >= 22.14.0`).

From the repo root:

```bash
# 1. Start a real QSS server on host:3003
npm run start:qss   # uses Node 22 internally for the migrate step

# 2. Start the toxiproxy sidecar on host:8474 (admin) / :3013 (proxy)
npm run start:qss:toxi

# 3. Run stress scenarios from packages/backend, under Node 20
cd packages/backend
PATH=/path/to/node-20/bin:$PATH npm run test-stress-qss
```

To stop:

```bash
npm run stop:qss:toxi
npm run stop:qss
```

`*.stress.spec.ts` is excluded from `test` and `test-ci` so this never runs on
CI by default.

## Configuration

Environment variables (with their defaults):

| Var | Default | Meaning |
| --- | --- | --- |
| `QSS_STRESS_ENDPOINT` | `ws://127.0.0.1:3013` | URL the QSSService sees (the proxy listener). |
| `QSS_STRESS_LISTEN` | `127.0.0.1:3013` | Toxiproxy proxy listener (host:port). |
| `QSS_STRESS_UPSTREAM` | `127.0.0.1:3003` | Real QSS server (host:port). |
| `TOXIPROXY_ADMIN` | `http://127.0.0.1:8474` | Toxiproxy admin API. |

## Why this exists

Every cluster of recent QSS bug-fix commits has the same shape: a state
machine misbehaves when an external event arrives during a particular timing
window. Mock-socket unit tests can't reach those windows; full e2e tests are
slow and hide internal state behind the renderer/socket bridge. This harness
sits between: real socket, real QSS, no app shell — so scenarios can drive
the timing windows directly and assert on backend internal state.

## macOS / Windows note

`docker-compose.yml` uses `network_mode: host`, which only works on Linux.
On other platforms, change the service to use port mappings and set
`QSS_STRESS_UPSTREAM=host.docker.internal:3003`.

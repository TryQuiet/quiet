# Quiet-Loki: Lokinet instead of Tor

Fork of [TryQuiet/quiet](https://github.com/TryQuiet/quiet) that routes the backend overlay through [oxen-io/lokinet](https://github.com/oxen-io/lokinet).

## What changed

- `packages/backend/src/nest/lokinet/` — spawn/attach `lokinet`, wait for API, resolve `localhost.loki`
- `packages/backend/src/nest/tor/tor.service.lokinet-shim.ts` — drop-in `Tor` class
- `packages/backend/src/nest/tor/tor.module.ts` — imports the shim
- `scripts/lokinet/quiet.ini.example`

Upstream `tor.service.ts` / `tor-control.service.ts` stay in the tree so you can revert the module import.

## Compatibility

Peer IDs become `.loki` SNApps, not `.onion`. Stock Quiet invitation URLs will not join a Quiet-Loki community.

## Run

1. Install Lokinet from https://github.com/oxen-io/lokinet/releases
2. `[api] enabled=true` and `bind=127.0.0.1:1190`
3. Do not set `exit-node=`
4. Build desktop per `packages/desktop/README.md`

Env: `LOKINET_BIN`, `LOKINET_API`, `LOKINET_SOCKS_HOST`, `LOKINET_SOCKS_PORT`.

Desktop only. Mobile still embeds Tor.

# Quiet-Loki (Lokinet-only)

This fork uses **Lokinet only** for libp2p — it does not wrap Tor for addresses or dials.

| Address | Overlay | How it dials |
|---|---|---|
| `*.loki` or a bare 52-char SNApp pubkey | Lokinet | Resolve via `127.3.2.1`, connect on `lokitun0` (no Tor SOCKS) |

Invite links and libp2p multiaddrs:

```
/dns4/<name>.loki/tcp/<port>/ws/p2p/<peerId>
quiet-loki://join#…  (p= must be a 52-char SNApp, never empty, never a 56-char onion)
```

Default listen port is **80** on `172.16.0.1` (`LOKINET_LISTEN_HOST` / `LOKINET_WS_PORT`). Binding port 80 needs `CAP_NET_BIND_SERVICE` or root; for unprivileged Day 2 testing set the same high port on both peers, e.g. `export LOKINET_WS_PORT=8080`.

On startup the backend looks up the SNApp with `host localhost.loki 127.3.2.1`.

Do **not** enable HTTP on `:1190`. Do **not** spawn a second lokinet — use system Lokinet only.

Two-node join/replicate: see `scripts/lokinet/DAY2-TWO-NODE.md`.

# Quiet-Loki (Lokinet-only)

This fork uses **Lokinet only** for libp2p — it does not wrap Tor for addresses or dials.

| Address | Overlay | How it dials |
|---|---|---|
| `*.loki` or a bare 52-char SNApp pubkey | Lokinet | Resolve via `127.3.2.1`, connect on `lokitun0` (no Tor SOCKS) |

Invite links and libp2p multiaddrs:

```
/dns4/<name>.loki/tcp/80/ws/p2p/<peerId>
quiet-loki://join#…  (p= must be a 52-char SNApp, never empty, never a 56-char onion)
```

On startup the backend looks up the SNApp with `host localhost.loki 127.3.2.1` and listens for libp2p WebSocket on `172.16.0.1:80`.

Do **not** enable HTTP on `:1190`. Do **not** spawn a second lokinet — use system Lokinet only.

See `packages/common/src/overlay.ts` and `SNAPP.md`.

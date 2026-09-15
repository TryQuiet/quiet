# Quiet-Loki dual overlay (Tor + Lokinet)

This fork runs **both** networks and picks the path from the address:

| Address | Overlay | How it dials |
|---|---|---|
| `*.onion` or a bare 56-char v3 id | Tor | existing HTTP tunnel / SOCKS |
| `*.loki` or a bare 52-char SNApp pubkey | Lokinet | no Tor proxy (TUN / Lokinet DNS) |

Invite links and libp2p multiaddrs work the same way. Examples:

```
/dns4/<56chars>.onion/tcp/80/ws/p2p/<peerId>
/dns4/<name>.loki/tcp/80/ws/p2p/<peerId>
quiet://?p=<peerId>,<56chars>.onion;... 
quiet://?p=<peerId>,something.loki;...
```

On startup the backend still publishes a Tor onion (stock Quiet peers keep working) and, if `lokinet` is running, also a `.loki` SNApp on the same libp2p port.

If Lokinet is missing, onion-only mode continues; `.loki` dials fail until the daemon is up.

See `packages/common/src/overlay.ts` for the inference helpers.

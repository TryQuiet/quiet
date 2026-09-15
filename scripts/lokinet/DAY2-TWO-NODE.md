# Day 2 — Two-node Lokinet join / `#general` replicate

Goal: create a community on node A, join from node B over Lokinet, confirm `#general` replicates.

## Prerequisites (each machine)

1. System `lokinet` active (do **not** start a second daemon from Quiet).
2. SNApp identity:

```bash
systemctl is-active lokinet
ip -4 addr show lokitun0    # expect 172.16.0.1/16 (or similar)
host localhost.loki 127.3.2.1
# expect: <52char>.loki and 172.16.0.1
```

3. Quiet Loki built from `develop` (Day 1+). Desktop invite/QR must be `quiet-loki://join#…`.

4. **Listen port** — both peers must use the **same** `LOKINET_WS_PORT`:

```bash
# privileged / packaged with cap_net_bind_service:
export LOKINET_WS_PORT=80

# unprivileged local run:
export LOKINET_WS_PORT=8080
```

Allow the port on `lokitun0` if a firewall is on:

```bash
sudo nft add rule inet filter input iifname lokitun0 tcp dport 8080 accept
```

Run `./scripts/lokinet/day2-preflight.sh` on each node before launching Quiet.

## Procedure

### Node A (owner)

1. Start Quiet with the env above (new community — do not reuse an old onion-stored community).
2. Create community; open Invite.
3. Confirm the link looks like `quiet-loki://join#p=<peerId>,<52charSNApp>&…`
4. `p=` must be non-empty, **52-char SNApp** (not 56-char onion).
5. Optional: `ss -ltnp | grep 172.16.0.1` — Quiet should listen on `LOKINET_WS_PORT`.
6. Copy the invite to B.

### Node B (joiner)

1. Same `LOKINET_WS_PORT` and Lokinet preflight.
2. Join with the `quiet-loki://` invite (not tryquiet.org).
3. Open `#general` — messages from A should appear (and vice versa).

### Debug

```bash
host <peerSnapp>.loki 127.3.2.1
sudo tcpdump -ni lokitun0 port 8080
```

## Success

- [ ] Invite `p=` is 52-char SNApp
- [ ] B sees `#general` from A over Lokinet
- [ ] No Tor SOCKS / no second lokinet / no HTTP `:1190`

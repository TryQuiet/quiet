#!/usr/bin/env bash
# Day 2 preflight for Quiet Loki two-node runs.
set -euo pipefail

DNS="${LOKINET_DNS:-127.3.2.1}"
HOST_BIND="${LOKINET_LISTEN_HOST:-172.16.0.1}"
PORT="${LOKINET_WS_PORT:-80}"

echo "== Day 2 preflight =="
echo "DNS=$DNS listen=$HOST_BIND:$PORT"

if ! systemctl is-active --quiet lokinet; then
  echo "FAIL: lokinet systemd unit is not active"
  exit 1
fi
echo "OK: lokinet active"

if ! ip -4 addr show lokitun0 2>/dev/null | grep -q "$HOST_BIND"; then
  echo "WARN: lokitun0 does not show $HOST_BIND — check Lokinet network config"
else
  echo "OK: lokitun0 has $HOST_BIND"
fi

OUT="$(host localhost.loki "$DNS" 2>&1 || true)"
echo "$OUT"
if ! echo "$OUT" | grep -qiE '[a-z0-9]{20,}\.loki'; then
  echo "FAIL: host localhost.loki $DNS did not return a .loki SNApp name"
  echo "See SNAPP.md (persistent keyfile)."
  exit 1
fi
SNAPP="$(echo "$OUT" | grep -oiE '[a-z0-9]{20,}\.loki' | grep -vi '^localhost\.loki$' | head -1 | tr '[:upper:]' '[:lower:]')"
if [[ -z "$SNAPP" ]]; then
  echo "FAIL: could not parse SNApp .loki name from host output"
  exit 1
fi
BARE="${SNAPP%.loki}"
if [[ ${#BARE} -eq 56 ]]; then
  echo "FAIL: got 56-char onion-like name; Quiet Loki needs 52-char SNApp"
  exit 1
fi
if [[ ${#BARE} -ne 52 ]]; then
  echo "WARN: SNApp bare length is ${#BARE} (expected 52 for pubkey-style names): $SNAPP"
else
  echo "OK: SNApp $SNAPP"
fi

export HOST_BIND PORT
python3 -c "import os,socket,sys; host=os.environ['HOST_BIND']; port=int(os.environ['PORT']); s=socket.socket();
try:
 s.bind((host,port)); print('OK: can bind %s:%s'%(host,port))
except OSError as e:
 print('FAIL: cannot bind %s:%s: %s'%(host,port,e)); print('Hint: export LOKINET_WS_PORT=8080 (same on both peers) or grant CAP_NET_BIND_SERVICE for port 80'); sys.exit(1)
finally:
 s.close()"
echo "Preflight passed. Launch Quiet with LOKINET_WS_PORT=$PORT on both nodes."

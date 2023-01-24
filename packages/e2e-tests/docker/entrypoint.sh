#!/bin/bash

export GEOMETRY="$SCREEN_WIDTH""x""$SCREEN_HEIGHT""x""$SCREEN_DEPTH"

function shutdown {
  kill -s SIGTERM $NODE_PID
  wait $NODE_PID
}

if [ ! -z "$CHROMEDRIVER_OPTS" ]; then
  echo "appending chromedriver options: ${CHROMEDRIVER_OPTS}"
fi

rm -f /tmp/.X*lock

DISPLAY=$DISPLAY \
  xvfb-run -a --server-args="-screen 0 $GEOMETRY -ac +extension RANDR" \
    chromedriver \
      --port=$CHROMEDRIVER_PORT \
      --whitelisted-ips=$CHROMEDRIVER_WHITELISTED_IPS \
      ${CHROMEDRIVER_OPTS} &
NODE_PID=$!

trap shutdown SIGTERM SIGINT
for i in $(seq 1 10)
do
  xdpyinfo -display $DISPLAY >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    break
  echo Waiting xvfb...
  fi
  sleep 0.5
done

fluxbox -display $DISPLAY &

x11vnc -forever -usepw -shared -rfbport 5900 -display $DISPLAY &

wait $NODE_PID
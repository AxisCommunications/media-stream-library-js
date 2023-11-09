#!/usr/bin/env bash
set -e

CYPRESS_DOCKER_IMAGE=cypress/included:13.5.0

echo -n "Starting RTSP/WebSocket proxy and example server..."
just _run-example-streams-web >& example-streams-web.log &
echo "done."

echo -n "Waiting for RTSP server at 8554..."
START_TIME=$(date +%s%3N)
duration=0
until curl -i rtsp://localhost:8554 -s | grep -viq 'gstreamer rtsp server'; do
  sleep 0.1s
  duration=$(($(date +%s%3N) - $START_TIME))
  if (( $duration > 10000 )); then
    echo "timeout after $duration ms"
    exit 1
  fi
  echo -n "."
done
echo "ready! ($duration ms)"

echo -n "Waiting for WebSocket RTSP proxy at 8854..."
START_TIME=$(date +%s%3N)
duration=0
until curl -i http://localhost:8854 -s | grep -viq 'upgrade required'; do
  sleep 0.1s
  duration=$(($(date +%s%3N) - $START_TIME))
  if (( $duration > 10000 )); then
    echo "timeout after $duration ms"
    exit 1
  fi
  echo -n "."
done
echo "ready! ($duration ms)"

echo "Starting cypress"
if [[ -z "$1" ]]; then
  CYPRESS_BASE_URL=http://localhost:8080 node_modules/.bin/cypress open
else
  docker run -i -v $PWD:/e2e -w /e2e --add-host=host.docker.internal:host-gateway $CYPRESS_DOCKER_IMAGE --browser $1
fi

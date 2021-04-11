#!/usr/bin/env bash
set -e

#trap "kill 0" EXIT

echo -n "Starting RTSP WebSocket proxy..."
yarn node sbin/tcp-ws-proxy.js --rtspHost gstreamer:8554 >& tcp-ws-proxy.log &
echo "done."

echo -n "Starting HTTP server with examples..."
yarn http-server examples/browser >& http-server.log &
echo "done."

echo -n "Waiting for RTSP server at 8554..."
START_TIME=$(date +%s%3N)
duration=0
until curl -i rtsp://gstreamer:8554 -s | grep -viq 'gstreamer rtsp server'; do
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
  yarn cypress run
else
  yarn cypress run --headless -b "$1"
fi

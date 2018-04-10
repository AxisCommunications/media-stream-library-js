#!/bin/bash

# spin up an RTSP server
container=$(docker run -d --rm -p 8554:8554 steabert/gst-rtsp-launch)

trap "docker kill ${container}" SIGINT SIGTERM

# start an RTSP-WebSocket proxy server
node ../../utils/tcp-ws-proxy.js >& tcp-ws-proxy.log &

# start our HTTP server
yarn http-server examples/rtsp-ws-browser

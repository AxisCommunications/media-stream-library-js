#!/bin/bash

# spin up an RTSP server
#container=$(docker run --privileged --device=/dev/video0:/dev/video0 -d --rm -p 8554:8554 steabert/gst-rtsp-launch 'v4l2src ! videoconvert ! video/x-raw,width=1280,height=720 ! x264enc ! rtph264pay name=pay0 pt=96')
container=$(docker run -d --rm -p 8554:8554 steabert/gst-rtsp-launch 'videotestsrc ! video/x-raw,width=1280,height=720 ! x264enc ! rtph264pay name=pay0 pt=96')

trap "docker kill ${container}" SIGINT SIGTERM

# start an RTSP-WebSocket proxy server
node ../../utils/tcp-ws-proxy.js >& tcp-ws-proxy.log &

# start our HTTP server
yarn http-server examples/rtsp-ws-browser-sync

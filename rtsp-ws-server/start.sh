#!/bin/bash

# This script launches an RTSP server (using docker) and
# a WebSocket proxy for it.
# The script will stay in the foreground and when it exits
# the docker container will be killed too. The easiest way
# is to press Ctrl-c to exit the script (and docker container).

#
# launch the RTSP server
#
# To use the webcam, add the following options to the docker run command:
#   --privileged --device=/dev/video0:/dev/video0
# and then use the following RTSP launch pipeline to access the webcam:
#   'v4l2src ! videoconvert ! video/x-raw,width=1280,height=720 ! x264enc ! rtph264pay name=pay0 pt=96'
# It might be necessary to keep the webcam open by using e.g.
# VLC to play from it (to prevent the webcam from turning off).
#
# To use a different resolution, use a caps filter in the launch pipeline, e.g.:
#   'videotestsrc ! video/x-raw,width=1280,height=720 ! x264enc ! rtph264pay name=pay0 pt=96'

h264_pipeline="videotestsrc ! video/x-raw,width=1920,height=1080 ! timeoverlay text='H.264' valignment=top halignment=left ! x264enc ! rtph264pay name=pay0 pt=96"
h264_port="8554"
mjpeg_pipeline="videotestsrc pattern=ball ! video/x-raw,width=1280,height=720 ! timeoverlay text='MJPEG' valignment=top halignment=left ! jpegenc ! rtpjpegpay name=pay0 pt=96"
mjpeg_port="8555"

if [ -z "$1" ]; then
  echo "serving H.264 video on rtsp://0.0.0.0:${h264_port}/test"
  h264_container=$(docker run -d --rm -p ${h264_port}:8554 steabert/gst-rtsp-launch "$h264_pipeline")
  echo "serving Motion JPEG video on rtsp://0.0.0.0:${mjpeg_port}/test"
  mjpeg_container=$(docker run -d --rm -p ${mjpeg_port}:8554 steabert/gst-rtsp-launch "$mjpeg_pipeline")
  container="${h264_container} ${mjpeg_container}"
elif [ "$1" = "docker" ]; then
  echo "using default pipeline configured inside the docker container (port 8554)"
  container=$(docker run -d --rm -p 8554:8554 steabert/gst-rtsp-launch)
else
  echo "using user-specified launch pipeline: $1 (port 8554)"
  container=$(docker run -d --rm -p 8554:8554 steabert/gst-rtsp-launch "$1")
fi

if [ -z "${container}" ]; then
  echo "couldn't start docker container, make sure docker is running!"
  exit 1
fi

trap "docker kill ${container} >& /dev/null" EXIT

#
# launch the WebSocket proxy server
#
node $(dirname $0)/tcp-ws-proxy.js >& tcp-ws-proxy.log &

#
# print some usage information
#
cat <<EOF

To test if everything works, you can visit the above RTSP URI(s) with
a program like VLC or mpv (e.g. vlc rtsp://0.0.0.0:8554/test)

To use the servers with WsRtsp... type pipelines, use the config:
{ws: {uri: 'ws://hostname:8854'}, rtsp: {uri: rtsp://localhost:8554/test}}
(note: modify the port number of the RTSP URI as needed.)

If you are running the examples on the same computer, use localhost
as hostname for the websocket configuration, otherwise use e.g.
window.location.host to connect to the websocket server.
Note that the RTSP URI should always be localhost, since that connection
is made on this computer, where the proxy pipeline is running.
EOF

# Don't exit for 1000 hours
sleep 3600000

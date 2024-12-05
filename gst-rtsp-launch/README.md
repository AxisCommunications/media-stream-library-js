# gst-rtsp-launch
Run an RTSP server using gst-launch syntax.

## Build

The code for the RTSP server is an example that
is part of [gst-rtsp-server](https://github.com/GStreamer/gst-rtsp-server)

### Native

Install necessary dependencies (meson and relevant gstreams libraries
and plugins). Example below for Ubuntu 24.04:

```
sudo apt install \
  meson \
  libgstrtspserver-1.0-dev \
  gstreamer1.0-plugins-rtp \
  gstreamer1.0-plugins-base \
  gstreamer1.0-plugins-ugly \
  gstreamer1.0-plugins-good \
  gstreamer1.0-plugins-bad \
  gstreamer1.0-libav
```

Then change to the `src` directory and run:

```
meson build
ninja -C build
```

### Docker

To create the docker container with the executable for
the RTSP server inside, just run
```
docker build .
```
which will build a docker image with a gst-rtsp-server build
environment, compile the code inside that docker image, and
then build a docker image that will run the RTSP server.

When finished, you'll be left with a docker image tagged `gst-rtsp-launch`
which you can use according to the instructions above.

## Run

### Native

Use `src/build/gst-rtsp-launch` as binary.

### Docker

To run an RTSP server, create your own image (see build step)
or use the public image `steabert/gst-rtsp-launch`.

```
docker run --rm -p 8554:8554 steabert/gst-rtsp-launch
```
which will run the RTSP server with the default pipeline.

### Example

Run a server with video and audio test source:

src/build/gst-rtsp-launch "videotestsrc ! video/x-raw,width=1920,height=1080 ! timeoverlay text='H.264/AAC' valignment=top halignment=left ! x264enc ! rtph264pay name=pay0 pt=96 audiotestsrc ! avenc_aac ! rtpmp4gpay name=pay1 pt=97"

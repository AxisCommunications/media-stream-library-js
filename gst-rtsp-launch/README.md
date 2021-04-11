# gst-rtsp-launch
Run an RTSP server using gst-launch syntax.

## Usage

To run an RTSP server, either create your own image (see below)
or use the public image `steabert/gst-rtsp-launch`.

```
docker run --rm -p 8554:8554 steabert/gst-rtsp-launch
```
which will run the RTSP server with the default pipeline.

## Building your own image

The code for the RTSP server is an example that
is part of [gst-rtsp-server](https://github.com/GStreamer/gst-rtsp-server)
and is compiled and run inside a docker container.

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

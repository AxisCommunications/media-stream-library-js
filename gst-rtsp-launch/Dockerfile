FROM alpine:edge AS build
RUN echo http://nl.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories
RUN apk add --no-cache gst-rtsp-server-dev
RUN apk add --no-cache libtool
RUN apk add --no-cache gcc
RUN apk add --no-cache musl-dev
COPY src/gst-rtsp-launch.c gst-rtsp-launch.c
RUN libtool --mode=link \
 gcc `pkg-config --cflags --libs gstreamer-1.0` \
 -L/usr/lib/x86_64-linux-gnu -lgstrtspserver-1.0 \
 -o gst-rtsp-launch gst-rtsp-launch.c

FROM alpine:edge
RUN echo http://nl.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories
RUN apk add --no-cache gst-rtsp-server
RUN apk add --no-cache gst-plugins-base
RUN apk add --no-cache gst-plugins-ugly
RUN apk add --no-cache gst-plugins-good
RUN apk add --no-cache gst-plugins-bad
RUN apk add --no-cache gst-libav

COPY --from=build gst-rtsp-launch /usr/bin/gst-rtsp-launch

EXPOSE 8554

ENTRYPOINT ["/usr/bin/gst-rtsp-launch"]
CMD ["videotestsrc ! x264enc ! rtph264pay name=pay0 pt=96"]

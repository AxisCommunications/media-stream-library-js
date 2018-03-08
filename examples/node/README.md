### Node CLI video example

This example converts an RTP stream to an MP4 file,
which can then be played by a suitable application.

```
node player.js [rtsp-uri] | vlc -
```

When stdout is connected to a terminal, the message
type and sizefor all the messages coming out of the
MP4 component are logged instead. The main use is for
development and testing.

```
node player.js [rtsp-uri]
```
# Browser examples

## Getting started

To start serving the browser examples, just type:

```
yarn examples
```

which will build the webpack bundle and then serve all
the examples in this folder on `localhost:8080`.
Just pick the correct route, which is the relative path starting from
this directory (`examples/browser`) to arrive at the correct example.

To select the example you would like to use, browse to
`http://localhost:8080`, and select a folder and then a `.html`
file you would like to use.
Or, to use the camera example directly, browse directly to
`http://localhost:8080/camera/simple.html`.

## Camera example

After serving the examples with `yarn examples` and browsing
to a file under `http://localhost:8080/camera`, you will need to enter
the camera (device) IP address and choose an encoding.
After that, just click the `play` button and you should
see the live video appear.
The examples should work with any Axis camera, although
it should be easily modified for any other server as
long as it supports proxying RTSP/RTP over WebSocket.

The example `simple.html` shows how you can include `media-stream-library.min.js`
directly in your html file to then use to create a player.
The corresponding `simple-player.js` file implements a minimal player,
which can be used as a starting point for creating a more advanced player.

The `-overlay` flavours of the simple example showcase
the use of a scheduler to draw the frame byte length as
an overlay graph synchronized with the video.

## Test example(s)

The examples under the `test` subdirectory all use a test server,
which has to be launched first by running `yarn rtsp`.
It's best to do this in a separate terminal window, so that
you can keep it running.

Either use no special arguments to launch the RTSP servers:

```
yarn rtsp
```

or add your own launch pipeline as an argument:

```
yarn rtsp 'videotestsrc ! ... ! ...'
```

For more details see the documentation under `rtsp-ws-server`
in the project root directory.

When the test server is up and running, you should probably first
test that the RTSP server works (especially if you've provided your
own launch command) with e.g.:

```
vlc rtsp://0.0.0.0:8554/test
```

Any player that can handle RTSP should be fine.

After you verified everything seems to be running fine,
you can browse to `http://localhost:8080/test` (default
H.264 example), or specify a specific file like e.g.
`http://localhost:8080/test/mjpeg.html` for the motion
JPEG example.
Note that if you specified your own launch command,
make sure it uses the correct encoding to match the
example.

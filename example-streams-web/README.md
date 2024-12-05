# Browser examples

## Summary

The examples in this folder or made to show-case how you could use the the
streaming library directly to play video. To make them as simple as possible,
the examples are only using HTML and JavaScript, and don't require any bundling
(using the `media-stream-library.min.js` script).

The examples can also be used to test the library, by rebuilding and reloading
the library bundle. To do this automatically, you can use the `just run
example-streams-web` command, which will run a testing server and host the
examples in one go, combining the different steps explained below.

## Getting started

Make sure you have Node.js installed and `yarn` is available
(by running `corepack enable` after Node.js installation).
Supported versions of Node.js are LTS or latest stable.

You also need to install `just` (see main README.md), you can
do this through the package manager:

```sh
yarn global add just-install
```

Then, install dependencies, build the project and start serving the examples:

```sh
just install
just build
just run example-streams-web
```

which will build the web bundles and then serve all the examples in this
folder on `localhost:8080`. Just pick the correct route, which is the relative
path starting from this directory (e.g. `camera`, or `test`) to arrive at the
correct example.

To select the example you would like to use, browse to `http://localhost:8080`,
and select a folder and then a `.html` file you would like to use. Or, to use
the camera example directly, browse directly to
`http://localhost:8080/camera/simple.html`.

### Camera example

**Note on CORS** when accessing the camera using HTTP (e.g. streaming HTTP MP4) it's
likely you will get a CORS error. To resolve this, you can add a custom header
to the camera to allow any origin.

The simplest way is to navigate to the IP of the camera, open developer tools
on that page and run the following in the console:

```
const rsp = await fetch("/axis-cgi/customhttpheader.cgi", {
  method: "POST",
  body: JSON.stringify({
    "apiVersion":"1.1",
    "method":"set",
    "params": {"Access-Control-Allow-Origin": "*"}
  })
})
```

After serving the examples with and browsing to a file under
`http://localhost:8080/camera`, you will need to enter the camera (device) IP
address and choose an encoding. After that, just click the `play` button and
you should see the live video appear. The examples should work with any Axis
camera, although it should be easily modified for any other server as long as
it supports proxying RTSP/RTP over WebSocket.

The example `simple.html` shows how you can include `media-stream-library.min.js`
directly in your html file to then use to create a player.
The corresponding `simple-player.js` file implements a minimal player,
which can be used as a starting point for creating a more advanced player.

The `-overlay` flavours of the simple example showcase the use of a scheduler
to draw the frame byte length as an overlay graph synchronized with the video.

### Test example(s)

The examples under the `test` subdirectory all use a test server, which has to
be launched first. For more details see the documentation under `rtsp-ws`
command in the `justfile` at the project root directory.

Either use no special arguments to launch the RTSP servers:

```sh
just rtsp-ws
```

or add your own launch pipeline as an argument:

```sh
just rtsp-ws 'videotestsrc ! ... ! ...'
```

When the test server is up and running, you should probably first test that the
RTSP server works (especially if you've provided your own launch command) with
e.g.:

```sh
vlc rtsp://0.0.0.0:8554/test
```

Any player that can handle RTSP should be fine.

After you verified everything seems to be running fine, you can browse to
`http://localhost:8080/test` (default H.264 example), or specify a specific
file like e.g. `http://localhost:8080/test/mjpeg.html` for the motion JPEG
example. Note that if you specified your own launch command, make sure it uses
the correct encoding to match the example.


# Media Stream Library JS

[![CI][ci-image]][ci-url]
[![NPM][npm-image]][npm-url]

[ci-image]: https://github.com/AxisCommunications/media-stream-library-js/actions/workflows/verify.yml/badge.svg?branch=main
[ci-url]: https://github.com/AxisCommunications/media-stream-library-js/actions/workflows/verify.yml
[npm-image]: https://img.shields.io/npm/v/media-stream-library.svg
[npm-url]: https://www.npmjs.com/package/media-stream-library

## Installation

Make sure you have Node installed on your machine.
Then, to install the library:

```sh
npm install media-stream-library
```

or

```sh
yarn add media-stream-library
```

## Streams

Provides a way to play RTP streams (H.264/AAC or JPEG) in a browser by converting
them to ISO-BMFF and feeding the stream to a SourceBuffer using the [Media Source
Extensions](https://www.w3.org/TR/media-source/) standard. The RTSP server should
provide two-way communication over WebSocket.
Additionally, streaming MP4 over HTTP to a SourceBuffer is also provided as
a way to lower latency compared to using a URL on a video tag directly.

This library is not a full media player: the framework provides no video
controls, progress bar, or other features typically associated with a media
player. For a simple React-based player we refer to the [player](##player).

However, getting video to play in the browser is quite easy (check the browser
example). There are currently no codecs included either, we rely on browser
support for that.

### Importing

**script tag** You can directly include the `msl-streams.min.js` file (available
as GitHub release asset) in your browser (check the browser example) as
an ES module. For this to work, your own script needs to be a module (use
`type="module" in the script tag`). Make sure the `src` in your script tag
matches the path of the file on the server, e.g. if it's at the top level:

```htmls
<script type="module" scr="/index.js"></script>
```

and in `index.js` you would use:

```js
import {...} from '/msl-streams.min.js';
```

**bundler** Alternatively, you use import statements in your JS/TS code using
the package name if you are going to bundle it yourself:

```js
import {...} from 'media-stream-library';
```

### Components and pipelines

The library contains a collection of components that can be connected together
to form media pipelines. The components are a low-level abstraction on top of
the Web Streams API to allow two-way communication, while media pipelines are
sets of components where the streams are connected. The provided pipelines are
a minimal set that provide WebSocket+RTSP => H.264/AAC or JPEG, and HTTP+MP4,
with some extra functionality such as authentication, retry, capture. For more
advanced usage, you can construct your own pipelines using the provided ones as
a template.

Check the `examples` section to see how these can be used in your own code. To
run the examples yourself, you'll need to clone this repository loccally and
follow the developer instructions.

## Player

A video player based on React intended primarily for Axis cameras. The main
idea is to define the video state entirely within specialized React components
for each of the different supported formats (currently MP4 over HTTP, RTP over
WebSocket, and still images). The main video player will only handle the
intended video state (attached to handlers) and format. The player is built on
top of [streams](##streams) which provides basic pipeline functionality
for the different formats.

You can either import the `Player` or `BasicPlayer` and use them directly (see
the example applications). If you want to build your own customized player, you
can look at the latter component and build your own player, using the
`Container`, `Layer`, and `PlaybackArea` components.

### Basic requirements

The player specifically targets [AXIS IP cameras](https://www.axis.com/products/network-cameras) because
we make underlying API-calls to AXIS specfic APIs to get the video streams.

**Firmware requirements**

- For WebSocket+RTSP to work you need at least firmware 6.50 (LTS)
- For HTTP+MP4 to work you need at least firmware 9.80 (LTS)

### Importing

If you don't use the player as part of a React app, the easiest
way to use it is to download the `msl-player.min.js` file from the
[releases](https://github.com/AxisCommunications/media-stream-library-js/release
s/latest) page and include it as an ES module. Make sure your own script has
`type="module"` and then import directly from the file, e.g.:

```js
import {...} from '/msl-player.min.js';
```

Then, you can use the `<media-stream-player/>` tag, similar to how you would use
`<video/>` to include a video element, and provide the camera IP as hostname:

```html
<media-stream-player hostname="192.168.0.90" />
```

You can find an example of this under `example-player-webcomponent`.

Supported properties right now are:

| Property              | Comment                                                                            |
| --------------------- | ---------------------------------------------------------------------------------- |
| `variant`             | Supported choices are `basic` or `advanced`. Refers to `BasicPlayer` and `Player`. |
| `hostname`            | The ip address to your device                                                      |
| `autoplay`            | If the property exists, we try and autoplay your video                             |
| `autoretry`           | If the property exists, we try to auto retry your video on errors and if ended     |
| `secure`              | If the property exists, we will connect with https instead of http                 |
| `format`              | Accepted values are `JPEG`, `RTP_JPEG`, `RTP_H264`, or `MP4_H264`                  |
| `compression`         | Accepted values are `0..100`, with 10 between each step                            |
| `resolution`          | Written as WidthXHeight, eg `1920x1080`                                            |
| `rotation`            | Accepted values are `0`, `90`, `180` and `270`                                     |
| `camera`              | Accepted values are `0...n` or `quad` depending on your device                     |
|                       | **RTP_H264 / RTP_JPEG / MP4_H264 specific properties**                             |
| `fps`                 | Accepted values are `0...n`                                                        |
| `audio`               | Accepted values are `0` (off) and `1` (on)                                         |
| `clock`               | Accepted values are `0` (hide) and `1` (show)                                      |
| `date`                | Accepted values are `0` (hide) and `1` (show)                                      |
| `text`                | Accepted values are `0` (hide text overlay) and `1` (show text overlay)            |
| `textstring`          | A percent-encoded string for the text overlay                                      |
| `textcolor`           | Accepted values are `black` and `white`                                            |
| `textbackgroundcolor` | Accepted values are `black`, `white`, `transparent` and `semitransparent`          |
| `textpos`             | Accepted values are `0` (top) and `1` (bottom)                                     |

Example:

```html
<media-stream-player hostname="192.168.0.90" format="RTP_H264" autoplay />
```

You may need to start a localhost server to get H.264 or Motion JPEG video to
run properly. It doesn't work with the `file:///` protocol. The easiest way to
do that is to run:

First run

```sh
just run example-player-webcomponent
```

Note that using anything other than the actual hostname you're hosting from
will result in CORS errors for some video formats. You'll need to proxy the
camera or load a page from the camera (in which case you can set
`window.location.host` as the hostname).

### As part of your React application

If you want to import the player as a React component into your own code, or use
parts of the player, you'll need to install the package as a dependency.
You will also need to install a number of peer dependencies
such as [luxon](https://github.com/moment/luxon), which we use for date and time purposes,
`react`/`react-dom`.
You can find an example of this under `example-player-react`, e.g.:

```js
import { BasicPlayer } from 'media-stream-library/player'
```

To run our example react app, you can start a vite dev server with:

```sh
export MSP_CAMERA=http://192.168.0.90
cd player
node vite.mjs
```

where you specify the IP of the camera you want to proxy as the `MSP_CAMERA`
environment variable (default is `192.168.0.90`). The vite dev server will
proxy requests to the camera, so that you'll have no CORS issues.

## Overlay

A small React library to make it easier to draw SVG elements with a custom
user-defined coordinate system, especially when there is also a transformation
mapping the user coordinates onto the visible area.

A typical example of this is drawing overlays on top of a transformed image,
when the overlay coordinates are relative to the non-transformed image.
In that case, the coordinates are often relative to the image size, and not
the actual SVG drawing size.

In addition, a set of helper components and hooks are provided to make it easier
to control drawing (e.g. by offering clamping functions), or make it simpler to
manipulate objects (e.g. dragging).

### Importing

Check the `example-overlay-react/` directory for an example on how to use this
library with your application.

### Coordinate conversion

The main component is called `Foundation`, and provides you with the functions
that transform between user and SVG coordinate systems. This is basically all
you ever need, and what this library is about.

To show how this works, let's say you want to draw a rectangle on top of an
image of your cat (1920x1080), around the cat's face, and you now the
coordinates of the face in the image. The size of the drawing area in the
browser is 800x450 pixels (the viewbox of the SVG element overlaying the
image).

The first example shows a situation where you have the image's resolution as
coordinates (pixel coordinates):

```
      User coordinate system =                  SVG coordinate system
        Image coordinates

                 x                                          x
           +---------->                               +---------->
   (0,0)                                      (0,0)
     +----------------------+                   +----------------------+
     |                      |                   |                      |
  +  |               /\_/\  |                +  |              XXXXXXX |
  |  |              ( o.o ) |                |  |              X o.o X |
  |  |               > ^ <  |                |  |              XXXXXXX |
y |  |                      |    +------>  y |  |                      |
  |  |                      |                |  |                      |
  |  |                      |                |  |                      |
  v  |                      |                v  |                      |
     |                      |                   |                      |
     +----------------------+                   +----------------------+
                       (1920,1080)                                 (800,450)
```

in this case it would be trivial to overlay an SVG and convert the sun's
coordinates to SVG coordinates, and use them for the `<circle>` `cx` and `cy`,
you just scale 1920 to 800 and 1080 to 450.

However, you might only have the coordinates of the face relative to the
picture boundaries:

```
      User coordinate system =                  SVG coordinate system
    Relative image coordinates

               x                                            x
        +-------------->                              +---------->
                          (1,1)               (0,0)
     +----------------------+                   +----------------------+
     |                      |                   |                      |
 ^   |               /\_/\  |                +  |              XXXXXXX |
 |   |              ( o.o ) |                |  |              X o.o X |
 |   |               > ^ <  |                |  |              XXXXXXX |
 | y |                      |      +---->  y |  |                      |
 |   |                      |                |  |                      |
 |   |                      |                |  |                      |
 +   |                      |                v  |                      |
     |                      |                   |                      |
     +----------------------+                   +----------------------+
   (0,0)                                                           (800,450)
```

where now you would have to take into account the reversal of the y coordinates
as well, so the face which is approximately at a y coordinate of 0.66 would turn
out to have SVG y coordinate of around 150.

As a third example, you still have the realtive coordinates of the face to the
whole picture, but only part of the picture is shown:

```
             User coordinate system
                                        (1,1)
     +------------------------------------+
     |                                    |
     |               Visible area         |    SVG coordinate system
     |                                    |
     |         (0.4,0.8)        (0.9,0.8) |  (0,0)
     |             +----------------+     |    +----------------+
     |             |        /\_/\   |     |    |       XXXXXXX  |
     |             |       ( o.o )  |     |    |       X o.o X  |
     |             |        > ^ <   | +------> |       XXXXXXX  |
     |             |                |     |    |                |
     |             +----------------+     |    +----------------+
     |         (0.4,0.5)                  |                 (800,450)
     |                                    |
     |                                    |
     |                                    |
     |                                    |
     |                                    |
     |                                    |
     |                                    |
     |                                    |
     +------------------------------------+
   (0,0)
```

in which case you'll need a transformation to take into account how the visible
area maps onto the complete area, before you can determine the final SVG coordinates.

This library aims to take care of all these conversions for you, as long
as you can defined your user coordinate system (with the location of the "real"
objects), and an optional transformation matrix (describing the visible area
the SVG overlay applies to). The fact that this mainly comes in handy when
matching what you draw to some underlying image and coordinate system is
the reason the name of this library is the way it is.

### Utilities

Other than coordinate conversion, there are also a couple of utilities aimed to
make it easier to interact with the SVG components.

Convenience functions for clamping are provided by the `Liner` component, which
lets you specify an area to which to limit your components. There is also a
`useDraggable` hook to simplify having to deal with moving around stuff.

### Components

With the React SVG elements and utilities as building blocks, you can then make
your own SVG components that will be used inside the `Foundation` component.
The best way to get started is to have a look at the example section, which
shows how you can build your components to make use of this library. The
example can be run with `just run overlay`. Instead of defining a whole array of new
SVG components that wrap the browser elements, the idea is that you can easily
do this already with React, and therefore we focused on providing the basics to
aid with building your components, instead of creating a component library.

## Contributing

For development, you'll need a local installation of [Node.js](https://nodejs.org/),
and [yarn](https://v3.yarnpkg.com/) to install dependencies.
To run commands, you need [just](https://just.systems/), which can be installed using
[prebuilt binaries](https://just.systems/man/en/chapter_5.html#pre-built-binaries) or
[yarn](https://just.systems/man/en/chapter_8.html#nodejs-installation), e.g.
`yarn global add just-install`.

Please read our [contributing guidelines](CONTRIBUTING.md) before making pull
requests.

## FAQ

**Will it work with this library if it works with VLC?**

Not necessarily. We only support a particular subset of the protocol useful for
basic streaming from IP cameras. With RTSP that is H.264+AAC or JPEG, and only
some simple profiles/levels are supported. For MP4, it depends entirely on your
browser if the media can be played.

**Do I need to use RTSP for live (or low-latency) video?**

Since this library only supports RTSP through some form of TCP connection, it's
going to have similar latency as streaming MP4 over HTTP. For true low-latency
real-time usage, you should either use a stand-alone player that can handle RTP over UDP,
or use WebRTC in the browser.

You should expect in-browser latency of several frames. When using Firefox, you
might need to set the duration of the MediaSource to `0` to force live behaviour
with lower latency (see one of the browser examples).
The exact latency is controlled by the browser itself, and the data inside the
media stream can affect this (e.g. if audio is present or not).

**Does this library support audio?**

Yes, yes it does. With a few caveats though.

- Make sure your AXIS camera actually supports audio
- Make sure the audio is enabled on the camera.
- It only works with H.264 and only after user interaction with the volume slider

**How do I autoplay video?**

Browsers will only allow to autoplay a video if it's muted. If the video is
not muted, then it will only play if the `play` method was called from inside
a handler of a user-initiated event. Note that different browsers can have
different behaviours. Read https://developer.chrome.com/blog/autoplay for more
details.

## Acknowledgements

The icons used are from https://github.com/google/material-design-icons/, which
are available under the Apache 2.0 license, more information can be found on:
http://google.github.io/material-design-icons

The spinner is from https://github.com/SamHerbert/SVG-Loaders, available under
the MIT license.

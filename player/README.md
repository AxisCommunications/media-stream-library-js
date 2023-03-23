# Media Stream Player JS

[![CI][ci-image]][ci-url]
[![NPM][npm-image]][npm-url]

[ci-image]: https://github.com/AxisCommunications/media-stream-player-js/workflows/CI/badge.svg
[ci-url]: https://github.com/AxisCommunications/media-stream-player-js/actions
[npm-image]: https://img.shields.io/npm/v/media-stream-player.svg
[npm-url]: https://www.npmjs.com/package/media-stream-player

Media Stream Player is a video player for Axis cameras based on React. The main
idea is to define the video state entirely within specialized React components
for each of the different supported formats (currently MP4 over HTTP, RTP over
WebSocket, and still images). The main video player will only handle the
intended video state (attached to handlers) and format. The player is built on
top of the
[Media Stream Library](https://github.com/AxisCommunications/media-stream-library-js)
which provides basic playing functionality for the different formats.

You can either import the `Player` or `BasicPlayer` and use them directly (see
the example applications). If you want to build your own customized player, you
can look at the latter component and build your own player, using the
`Container`, `Layer`, and `PlaybackArea` components.

## Basic requirements

This library specifically targets [AXIS IP cameras](https://www.axis.com/products/network-cameras) because
we make underlying API-calls to AXIS specfic APIs to get the video streams.

**Firmware requirements**

- For H.264 to work you need at least firmware 6.50 (LTS)
- For MP4 to work you need at least firmware 9.80 (LTS)

## Structure

## Installation

### As a stand-alone element

If you don't use the player as part of you React app, the easiest way to use it
is to download the `media-stream-player.min.js` file from the
[releases](https://github.com/AxisCommunications/media-stream-player-js/releases/latest)
page and include it in your html file as a script:

```html
<script src="media-stream-player.min.js"></script>
```

The bundle is built to support the browserslist "latest 2 versions, not dead",
which should work on most modern browsers. If you need support for older browsers, you can use
the (larger) legacy bundle `media-stream-player.legacy.min.js` instead, but note
that this isn't tested, so you might run into some issues.

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

```bash
just run example-player-webcomponent
```

Note that using anything other than the actual hostname you're hosting from
will result in CORS errors for some video formats. You'll need to proxy the
camera or load a page from the camera (in which case you can set
`window.location.host` as the hostname).

### As part of your React application

If you want to import the player as a React component into your own code, or use
parts of the player, you'll need to install the package as a dependency. Make
sure you have Node installed on your machine.

Then, to install the package:

```sh
npm install media-stream-player
```

You will also need to install a number of peer dependencies
such as [luxon](https://github.com/moment/luxon), which we use for date and time purposes,
`react`/`react-dom`, `styled-components`, and `media-stream-library`.
You can find an example of this under `example-player-react`, e.g.:

```js
import { BasicPlayer } from 'media-stream-player'
```

By default, we do not pre-bundle external dependencies. If this causes problems
with certain bundlers (e.g. CRA), you can use a pre-bundled version like so:

```js
import { BasicPlayer } from 'media-stream-player/heavy'
```

To run our example react app, you can start a vite dev server with:

```sh
export MSP_CAMERA=http://192.168.0.90
node vite.mjs
```

where you specify the IP of the camera you want to proxy as the `MSP_CAMERA`
environment variable (default is `192.168.0.90`). The vite dev server will
proxy requests to the camera, so that you'll have no CORS issues for any format.

## Debugging

In the browser, you can set `localStorage.debug = 'msp:*'` to log everything
related to just this library (make sure to reload the page after setting the
value). You can also debug a specific component by using one of the following from the table below.

| Detailed debugging |
| ----- |
| `msp:http-mp4-video` |
| `msp:ws-rtsp-video` |
| `msp:still-image` |
| `msp:api` |

## FAQ

**Does this library support audio?**
Yes, yes it does. With a few caveats though.

- Make sure your AXIS camera actually supports audio
- Make sure the audio is enabled on the camera.
- It only works with H.264 and only after user interaction with the volume slider

## Icons

The icons used are from https://github.com/google/material-design-icons/, which
are available under the Apache 2.0 license, more information can be found on:
http://google.github.io/material-design-icons

The spinner is from https://github.com/SamHerbert/SVG-Loaders, available under
the MIT license.

## Player

A video player based on React intended primarily for Axis cameras. The main
idea is to define the video state entirely within specialized React components
for each of the different supported formats (currently MP4 over HTTP, RTP over
WebSocket, and still images). The main video player will only handle the
intended video state (attached to handlers) and format. The player is built on
top of [streams](/streams/README.md) which provides basic pipeline functionality
for the different formats.

You can either import the `Player` or `BasicPlayer` and use them directly (see
the example applications). If you want to build your own customized player, you
can look at the latter component and build your own player, using the
`Container`, `Layer`, and `PlaybackArea` components.

## Basic requirements

This library specifically targets [AXIS IP cameras](https://www.axis.com/products/network-cameras) because
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
`react`/`react-dom`, `styled-components`.
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

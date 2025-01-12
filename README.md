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

## Usage

- [streams](streams/README.md)
- [player](player/README.md)
- [overlay](overlay/README.md)

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

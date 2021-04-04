# Media Stream Library JS

[![CI][ci-image]][ci-url]
[![NPM][npm-image]][npm-url]

[ci-image]: https://github.com/AxisCommunications/media-stream-library-js/actions/workflows/verify.yml/badge.svg?branch=main
[ci-url]: https://github.com/AxisCommunications/media-stream-library-js/actions
[npm-image]: https://img.shields.io/npm/v/media-stream-library.svg
[npm-url]: https://www.npmjs.com/package/media-stream-library

Media Stream Library JS is an open-source JavaScript library to handle media
stream transforms for Node & the Web. The primary purpose is to deal with RTP
streams in a browser without the need to use plugins or Flash, but relying on
the [Media Source Extensions](https://www.w3.org/TR/media-source/) standard,
which is supported in all modern browsers.

Although RTP streams is the main focus, the library is not limited to handling
RTP streams, or to the browser. It is suited to handle streams of messages of
any kind, and makes it easier to stitch together transformations from one message
type to another. Contributions of new components/pipelines are always welcome.

_Note for IE11 users_: if you want to build the library yourself for IE11 instead
of using the provided bundle, you need import from `dist/es5` with the following fix in webpack:

```
alias: {
  debug: 'debug/dist/debug.js',
},
```

You can look at the `webpack.config.js` to see how it's used for building the bundle.
Since IE11 is not supported or tested at all, you might run into different issues as well.

## Installation

Make sure you have Node installed on your machine.

Then, to install the library:

```
npm install media-stream-library
```

or if you are using `yarn`:

```
yarn add media-stream-library
```

## Usage

This library is not a full media player: the framework provides no video
controls, progress bar, or other features typically associated with a media
player. For a simple React-based player we refer to the [Media Stream
Player](https://github.com/AxisCommunications/media-stream-player-js) library,
which is built around this library.

However, getting video to play in the browser is quite easy (check the browser
example). There are currently no codecs included either, we rely on browser
support for that.

Although RTP streams is the main focus, the library is not limited to handling
RTP streams, or to the browser. Its main focus is to handle streams of messages,
and make it easier to stitch together transformations from one message type to
another. Contributions of new components/pipelines are always welcome.

### Importing

You can directly include the `media-stream-library.min.js` file in your browser
(check the browser example):

```
<script src="media-stream-library.min.js"></script>
```

in which case a global variable `mediaStreamLibrary` will exist that
contains all the necessary functions.

Alternatively, you can import it into your javascript code if you bundle it yourself:

```
import {components, pipelines} from 'media-stream-library';
```

Note that we expose our own bundle as the default entry point.  This is to avoid
issues where you would have to write fallback imports for browserify packages if
using webpack 5.

If you want the smallest possible bundle, you can import directly from
`media-stream-library/dist/esm/index.browser.js` and then make sure to properly
resolve everything in your own webpack config (you can check our own
`webpack.config.js` as en example how to write fallbacks for the browserify
packages).

### Components and pipelines

The library contains a collection of components that can be connected together
to form media pipelines.  The components are a low-level abstraction on top of
Node streams to allow two-way communication, while media pipelines are sets of
connected components with methods that allow you to control the pipeline, and
easily add/remove components.

Components can be categorized as:

- sources (socket, file, ...)
- transforms (parsers, depay, muxers, ...)
- sinks (HTML5 element, file, ...)

To build a pipeline, you can connect the required components.  A number of common
pipelines are exported directly for convenience.

Check the `examples` section to see how these can be used in your own code.  To
run the examples yourself, you'll need to clone this repository loccally and
follow the developer instructions.

## Debugging

In the browser, you can set `localStorage.debug = 'msl:*'` to log everything
related to just this library (make sure to reload the page after setting the
value).

## Contributing

Please read our [contributing guidelines](CONTRIBUTING.md) before making pull
requests.

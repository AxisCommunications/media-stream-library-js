# Media Stream Library JS
Media Stream Library JS is an open-source JavaScript library to handle media
stream transforms for Node & the Web.
The primary purpose is to deal with RTP streams in a browser without
the need to use plugins of Flash, but relying on the [Media Source Extensions](https://www.w3.org/TR/media-source/) standard, which is supported in all modern browsers.


## Structure

The library contains a collection of components that can be connected
together to form media pipelines.
The components are a low-level abstraction on top of Node streams to allow two-way
communication, while media pipelines are sets of connected components with methods
that allow you to control the pipeline, and easily add/remove components.

Components can be categorized as:
 - sources (socket, file, ...)
 - transforms (parsers, depay, muxers, ...)
 - sinks (HTML5 element, file, ...)

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

This library is not a full media player: the framework provides
no video controls, progress bar, or other features typically
associated with a media player. However, getting video to play
in the browser is quite easy (check the browser example).
There are currently no codecs included either, we rely on
browser support for that.

Although RTP streams is the main focus, the library is not limited
to handling RTP streams. Contributions of new components/pipelines are
always welcome.

You can directly include the `media-stream-library.min.js` file in your browser
(check the browser example), or import it into your javascript code:

```
<script src="media-stream-library.min.js"></script>
```

```
import {components, pipelines} from 'media-stream-library';
```

Check the `examples` section to see how these can be used in practice.
To use the browser example, run:
```
npm run example
```
or
```
yarn example
```

## Contributing

Please use the github issue tracker for any bugs or features requests,
email sent to the maintainer(s) will probably be ignored.

If you would like to contribute bug fixes or new components,
make sure there is an existing issue for it, and make a pull
request referencing the issue.

Most components have unit tests, and basic proper behaviour is always
tested, but we don't have full coverage (yet) of all the component code.
If you contribute a new component, please make sure it has appropriate
unit tests with sufficient coverage.

You can run all test with:
```
npm run test
```
or
```
yarn test
```

## Debugging

The easiest way to debug is to use a Node CLI pipeline (see examples) and
log what is happening to your component(s).

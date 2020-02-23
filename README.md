# Media Stream Library JS

[![CI][ci-image]][ci-url]
[![NPM][npm-image]][npm-url]

[ci-image]: https://github.com/AxisCommunications/media-stream-library-js/workflows/CI/badge.svg
[ci-url]: https://github.com/AxisCommunications/media-stream-library-js/actions

[npm-image]: https://img.shields.io/npm/v/media-stream-library.svg
[npm-url]: https://www.npmjs.com/package/media-stream-library

Media Stream Library JS is an open-source JavaScript library to handle media
stream transforms for Node & the Web.
The primary purpose is to deal with RTP streams in a browser without
the need to use plugins or Flash, but relying on the [Media Source Extensions](https://www.w3.org/TR/media-source/) standard, which is supported in all modern browsers.

_Note for IE11 users_: if you want to build the library yourself for IE11 instead
of using the provided bundle, you need import from `dist/es5` with the following fix in webpack:

```
alias: {
  debug: 'debug/dist/debug.js',
},
```

You can look at the `webpack.config.js` to see how it's used for building the bundle.

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
(check the browser example):

```
<script src="media-stream-library.min.js"></script>
```

or import it into your javascript code:

```
import {components, pipelines} from 'media-stream-library';
```

Check the `examples` section to see how these can be used in practice.
To use the browser example, run:

```
npm run examples
```

or

```
yarn examples
```

## Debugging

The easiest way to debug is to use a Node CLI pipeline (see examples) and
log what is happening to your component(s).

In the browser, you can set `localStorage.debug = 'msl:*'` to log everything
related to just this library (make sure to reload the page after setting the value).

## Contributing

Please read our [contributing guidelines](CONTRIBUTING.md) before making pull requests.

### Code formatting

We use [prettier](https://prettier.io/) to automatically format code, and this is verified
during testing (part of linting).
To make sure tests don't fail on format problems, it's recommended to use a prettier plugin
for you editor, or to run `yarn prettier:fix` before committing any changes.

### Testing

Make sure your changes pass linting and unit testing locally to save time with your PR,
by running `yarn test`.
If you add a new feature, please write a new unit test to catch any future regressions.

## Continuous integration

Automated tests are run on the master branch and pull requests with GitHub Actions,
for which the configuration can be found in the `.github/workflows/ci.yml` file.
When tags are pushed, an automated deploy will release to both Github and NPM.
Any tags that are prereleases will be tagged `next` for NPM, otherwise `latest` is used.

To release, make sure you are on the master branch and run:
```
yarn release
git push --follow-tags
```
after which the pushed tag will cause a build + deploy through GitHub Actions.

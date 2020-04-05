# Media Overlay Library JS

[![CI][ci-image]][ci-url]
[![NPM][npm-image]][npm-url]

[ci-image]: https://github.com/AxisCommunications/media-overlay-library-js/workflows/CI/badge.svg
[ci-url]: https://github.com/AxisCommunications/media-overlay-library-js/actions
[npm-image]: https://img.shields.io/npm/v/media-overlay-library.svg
[npm-url]: https://www.npmjs.com/package/media-overlay-library

Media Overlay Library JS is a small React library to make it easier to draw SVG
elements with a custom user-defined coordinate system, especially when there is
also a transformation mapping the user coordinates onto the visible area.

A typical example of this is drawing overlays on top of a transformed image,
when the overlay coordinates are relative to the non-transformed image.
In that case, the coordinates are often relative to the image size, and not
the actual SVG drawing size.

In addition, a set of helper components and hooks are provided to make it easier
to control drawing (e.g. by offering clamping functions), or make it simpler to
manipulate objects (e.g. dragging).

## Installation

Use `yarn` or `npm` to install `media-overlay-library`. There are peer
dependencies you should have installed in your main app, such as `react` and
`pepjs`.

## Usage

Check the `example/` directory for an example on how to use this library with
your application.

The main component is called `Foundation`, and provides you with the functions
that transform between user and SVG coordinate systems. This is basically all
you ever need, and what this library is about.

Convenience functions for clamping are provided by the `Liner` component, which
lets you specify an area to which to limit your components. There is also a
`useDraggable` hook to simplify having to deal with moving around stuff.

With these building blocks, you can then make your own SVG components that will
be used inside the `Foundation` component. The best way to get started is to
have a look at the example section, which shows how you can build your
components to make use of this library. The example can be run with `yarn dev`.
Instead of defining a whole array of new SVG components that wrap the browser
elements, the idea is that you can easily do this already with React, and
therefore we focused on providing the basics to aid with building your
components, instead of creating a component library. Maybe the latter can grow
out of the example components, but for now that is not what this is about.

## Releases (internal)

When tags are pushed, an automated deploy will release to both Github and NPM.
Any tags that are prereleases will be tagged `next` for NPM, otherwise `latest`
is used.

To release, make sure you are on the master branch and run:

```
yarn release
git push --follow-tags
```

after which the pushed tag will cause a build + deploy through GitHub Actions.

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

Use `npm` to install `media-overlay-library`. There are peer
dependencies you should have installed in your main app, such as `react` and
`pepjs`.

## Usage

Check the `example/` directory for an example on how to use this library with
your application.

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
Maybe the latter can grow out of the example components, but for now that is
not what this is about.

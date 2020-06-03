# [3.0.0](https://github.com/AxisCommunications/media-overlay-library-js/compare/v2.0.0...v3.0.0) (2020-06-03)


* fix!: resize observer does not track SVG layout ([865789b](https://github.com/AxisCommunications/media-overlay-library-js/commit/865789b1155b92367c97b139ee5732a916cbcdf5))


### BREAKING CHANGES

* the main wrapper element for
`Foundation` is changed from `svg` to `div`.
This affects the extra properties sent to the
`Foundation` component, as well as the forwarded
ref.



# [2.0.0](https://github.com/AxisCommunications/media-overlay-library-js/compare/v1.1.0...v2.0.0) (2020-05-08)


### Bug Fixes

* Add name to Text example ([149f1fa](https://github.com/AxisCommunications/media-overlay-library-js/commit/149f1fa98943258b24b2ba37b5134b2c434ad9e7))
* Example styling ([06c604d](https://github.com/AxisCommunications/media-overlay-library-js/commit/06c604d9a17309f946176a0f4e134ad44ada7d3d))
* Non draggable Circle throws error ([ca8e6e0](https://github.com/AxisCommunications/media-overlay-library-js/commit/ca8e6e0fa2fd5878211cd34e4490d8a36fee58f2))


### Features

* compute width/height internally ([431969f](https://github.com/AxisCommunications/media-overlay-library-js/commit/431969f29800ed8c8e9f83e2c5e9718f198c086f))


### BREAKING CHANGES

*  - `onReady` no longer passes `visibleArea`, but an object with
   data to be able to compute any transformation (more generic).
   Check the docs for `onReady` for an example how to compute the
   visible area.
 - `width` and `height` properties removed from `Foundation`,
   you can still set the size for the <svg> element via CSS
   (if auto size does not work for you).



# 1.1.0 (2020-04-05)


### Features

* first commit of media-overlay-library-js ([09f00a6](https://github.com/AxisCommunications/media-overlay-library-js/commit/09f00a6be745e2e4fdc95fe004d33e7c141de29c))




## [3.1.1](https://github.com/AxisCommunications/media-overlay-library-js/compare/v3.1.0...v3.1.1) (2020-09-03)


### Bug Fixes

* explicitly specify GitHub package registry ([e9e36c2](https://github.com/AxisCommunications/media-overlay-library-js/commit/e9e36c2d6ce5b35c64b02fac6b22d69de1a92e96))



# [3.1.0](https://github.com/AxisCommunications/media-overlay-library-js/compare/v3.0.1...v3.1.0) (2020-09-03)


### Bug Fixes

* **deps:** update all ([3e6da2f](https://github.com/AxisCommunications/media-overlay-library-js/commit/3e6da2f2d7ce131e5f511c476af95176d464b972))


### Features

* use GitHub package registry ([0deb928](https://github.com/AxisCommunications/media-overlay-library-js/commit/0deb928046a3cf5b2997aac7a1ec44bf17490d32))



## [3.0.1](https://github.com/AxisCommunications/media-overlay-library-js/compare/v3.0.0...v3.0.1) (2020-06-17)


### Bug Fixes

* do not render when width/height <= 0 ([8e6f459](https://github.com/AxisCommunications/media-overlay-library-js/commit/8e6f459555379bd0573688230bbf8afd74e1dd4e))



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




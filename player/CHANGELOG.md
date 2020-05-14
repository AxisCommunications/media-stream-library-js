# [2.1.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.0.0...v2.1.0) (2020-05-14)


### Bug Fixes

* allow any kind of RTSP URI parameters ([c46c856](https://github.com/AxisCommunications/media-stream-player-js/commit/c46c85611584346960865cc71e37441398b35f10))
* make sure vapixParams is not null ([c48d969](https://github.com/AxisCommunications/media-stream-player-js/commit/c48d969658606bee7f6f8fdaf6bde165fcc0787f)), closes [#8](https://github.com/AxisCommunications/media-stream-player-js/issues/8)


### Features

* General solution for WebComponent attributes ([62ba18e](https://github.com/AxisCommunications/media-stream-player-js/commit/62ba18e9ef8cc0322200833c58e4d15a1b40b962))
* statistics overlay improvements ([123ed2b](https://github.com/AxisCommunications/media-stream-player-js/commit/123ed2b6030a2d053520e69bb0cd3fabcc67dc74))
* Switch component ([5fb3afe](https://github.com/AxisCommunications/media-stream-player-js/commit/5fb3afecc6359ae17c77b80debc0c62147615234))
* WebComponent autoPlay ability ([c4732a6](https://github.com/AxisCommunications/media-stream-player-js/commit/c4732a6b9aebf66a909489a96d9f1803cbffb85e))



# [2.0.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.2.1...v2.0.0) (2020-04-23)


* feat!: metadata with custom NTP timestamp ([b8f6a10](https://github.com/AxisCommunications/media-stream-player-js/commit/b8f6a10da1bef44903938d988e5b21999b873aab))


### BREAKING CHANGES

* the optional `metadataHandler` property
has changed to an object {parser, cb} instead of a simple
function. If you use this property, consult the TypeScript
documentation for the new interface.



## [1.2.1](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.2.0...v1.2.1) (2020-04-08)


### Bug Fixes

* properly type forwarded refs ([7a301fb](https://github.com/AxisCommunications/media-stream-player-js/commit/7a301fba791eb23d672855844f7f80582a020aa8))
* wrap data fetching step in useEffect hook ([0c16ed6](https://github.com/AxisCommunications/media-stream-player-js/commit/0c16ed664b858d2af007af24675a3aac15911178))



# [1.2.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.1.3...v1.2.0) (2020-03-30)


### Bug Fixes

* apply prettier code formatting ([589dc60](https://github.com/AxisCommunications/media-stream-player-js/commit/589dc60c475ce06837bf63266381b9a66d74155c))


### Features

* Stream statistics ([9d6e938](https://github.com/AxisCommunications/media-stream-player-js/commit/9d6e93879587361b49b96bf72bf6e87ba7443115))



## [1.1.3](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.1.2...v1.1.3) (2020-03-13)


### Bug Fixes

* remove unnecessary container ([cacbe9e](https://github.com/AxisCommunications/media-stream-player-js/commit/cacbe9e067cfc047f350c21a0433fd3fb84b9f01))



## [1.1.2](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.1.1...v1.1.2) (2020-03-11)



## [1.1.1](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.1.0...v1.1.1) (2020-03-11)


### Bug Fixes

* Remove source map from build ([6f92e12](https://github.com/AxisCommunications/media-stream-player-js/commit/6f92e12e91de2fe8287645c9ad646dd4386fedde))
* target more sensible ECMAScript version ([4f954ce](https://github.com/AxisCommunications/media-stream-player-js/commit/4f954ce7066de228833951bb3e8717781e90998e))



# 1.1.0 (2020-03-10)


### Bug Fixes

* let jest pass with no tests ([3368163](https://github.com/AxisCommunications/media-stream-player-js/commit/336816334d3191efb45f9cd0aa85c0837ac8777a))


### Features

* first commit of media-stream-player-js ([1e03b7f](https://github.com/AxisCommunications/media-stream-player-js/commit/1e03b7fc02f0ce9c63998f7bcaf6c0f45cd1d7df))




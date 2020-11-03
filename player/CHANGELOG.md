## [2.6.1](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.6.0...v2.6.1) (2020-11-03)


### Bug Fixes

* replace unstable dependency arrays ([e929f1a](https://github.com/AxisCommunications/media-stream-player-js/commit/e929f1abe6d2d0a24dd1a3d836f2903d6a827246))



# [2.6.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.5.0...v2.6.0) (2020-10-30)


### Bug Fixes

* debounce textstring updates ([f061b0d](https://github.com/AxisCommunications/media-stream-player-js/commit/f061b0d4575ab81736a56ae4e84a2260c67c4b20))
* webcomponent has hardcoded http call ([7507f6f](https://github.com/AxisCommunications/media-stream-player-js/commit/7507f6fc356dddf930384699092c2b0064de9cec)), closes [#65](https://github.com/AxisCommunications/media-stream-player-js/issues/65)


### Features

* additional vapix parameters for web component ([a38dcac](https://github.com/AxisCommunications/media-stream-player-js/commit/a38dcac9c8a8b6d8ed9b68ea7c3d3f75564d41f3))
* multi stream example ([86e1576](https://github.com/AxisCommunications/media-stream-player-js/commit/86e15762614655cabfed12dba455a9e33b358b49))



# [2.5.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.4.1...v2.5.0) (2020-10-09)


### Bug Fixes

* Default value for secure property ([22d12af](https://github.com/AxisCommunications/media-stream-player-js/commit/22d12af7c77373baf3d60734d792ba9608a82a7e))
* disable explicit module boundary types ([4f4eefe](https://github.com/AxisCommunications/media-stream-player-js/commit/4f4eefee191ef2ae073cc7c52e1a201b318c8171))
* Don't assume that localStorage works ([289fe21](https://github.com/AxisCommunications/media-stream-player-js/commit/289fe213b6672c1beafc1431e80ed5e7d9bc3d8e)), closes [#20](https://github.com/AxisCommunications/media-stream-player-js/issues/20)
* reset the scheduler on teardown ([6361504](https://github.com/AxisCommunications/media-stream-player-js/commit/636150452b9ec49937a5c4ca793e44ef276b2659))
* Update readme with link to media-stream-player.min.js ([a8ca79d](https://github.com/AxisCommunications/media-stream-player-js/commit/a8ca79d725127ba7da67a8365e04d947c7e73d9c)), closes [#51](https://github.com/AxisCommunications/media-stream-player-js/issues/51)
* Update to latest link ([60f00a3](https://github.com/AxisCommunications/media-stream-player-js/commit/60f00a397f6a63355589f52d3f553c64b7f9b3b2))


### Features

* ability to set initial format for webcomponent ([fb674df](https://github.com/AxisCommunications/media-stream-player-js/commit/fb674df9875c7a50f11852f7b8ecdbd763cc2977))
* Ability to specify protocol ([3090d25](https://github.com/AxisCommunications/media-stream-player-js/commit/3090d25e1b8bcb7d43d840b3fd456e1925e2690b))
* vapix parameters for web component ([238455d](https://github.com/AxisCommunications/media-stream-player-js/commit/238455d0f43a09ef830cb64ab956114761fd9536))



## [2.4.1](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.4.0...v2.4.1) (2020-10-01)



# [2.4.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.3.0...v2.4.0) (2020-08-14)


### Bug Fixes

* **deps:** update all ([01ede42](https://github.com/AxisCommunications/media-stream-player-js/commit/01ede423c9b00d1a5780f3e78772e025b1ccd422))
* remove unused dependency ([2a448ac](https://github.com/AxisCommunications/media-stream-player-js/commit/2a448accd54342edaa3bb50b7274f22337b0adf1))


### Features

* move `undocumented VAPIX parameter` to debug environment ([2e0b0a3](https://github.com/AxisCommunications/media-stream-player-js/commit/2e0b0a3538b1a51c2a257eec63870473d1ae946c))



# [2.3.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.2.1...v2.3.0) (2020-07-15)


### Features

* GetImageURL and Screenshot ([6c0d3c3](https://github.com/AxisCommunications/media-stream-player-js/commit/6c0d3c35591b1c0cdf3b545a52051717dae15c3d))



## [2.2.1](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.2.0...v2.2.1) (2020-05-24)


### Bug Fixes

* all imports of MSL to use same module type ([1b4c9b3](https://github.com/AxisCommunications/media-stream-player-js/commit/1b4c9b39f2c435f73dda01cf47b5b5ae541a9d2a))



# [2.2.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.1.0...v2.2.0) (2020-05-20)


### Bug Fixes

* robust cleanup (abort) when changing state ([4d7a30f](https://github.com/AxisCommunications/media-stream-player-js/commit/4d7a30fbe4f105decfd3fce6c7cfc099e8f1052e))


### Features

* properly limit width of video ([1f9109b](https://github.com/AxisCommunications/media-stream-player-js/commit/1f9109be3306dc13b1979a292753c78df93a37ec))



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




# Changelog

All notable changes to this project will be documented in this file.

## [v3.0.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.6.1...v3.0.0) (2020-11-20 10:16:37 +0100)

### Maintenance

  - **deps**: pin dependency eslint-config-typescript-shareable to 0.17.0 ([3f2958b](https://github.com/AxisCommunications/media-stream-player-js/commit/3f2958b89c7da9136510a001a9646bcf90d97a99))
  - **deps**: upgrade media-stream-library to v8 ([53e446b](https://github.com/AxisCommunications/media-stream-player-js/commit/53e446b46a3e20a3fa89335d6269c0d70dc1bc1e))

### Features

  - **stats**: improvements and additions ([5c05e2f](https://github.com/AxisCommunications/media-stream-player-js/commit/5c05e2f6f7789c028af4d0c001e791db91370f35))

### Bug fixes

  - invalid websocket url when switching tabs ([60bbb7b](https://github.com/AxisCommunications/media-stream-player-js/commit/60bbb7b1daff13d7da3ca3a0325751d731900379))
  - **BREAKING** remember correct format ([e9f537b](https://github.com/AxisCommunications/media-stream-player-js/commit/e9f537bf11c6fcdaf2abe273a4b90f3ea0b1a2df))

## [v2.6.1](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.6.0...v2.6.1) (2020-11-03 19:07:52 +0100)

### Bug fixes

  - replace unstable dependency arrays ([e929f1a](https://github.com/AxisCommunications/media-stream-player-js/commit/e929f1abe6d2d0a24dd1a3d836f2903d6a827246))

## [v2.6.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.5.0...v2.6.0) (2020-10-30 14:41:53 +0100)

### Maintenance

  - **deps**: use shared eslint configuration ([2726e48](https://github.com/AxisCommunications/media-stream-player-js/commit/2726e4843e98a2335740616265d8ae04fabed51a))
  - fix linting errors in Settings component ([87e05eb](https://github.com/AxisCommunications/media-stream-player-js/commit/87e05eb56a46146ad680402a682448336c4f651a))
  - refactor vapixParams generation in webcomponent ([f215944](https://github.com/AxisCommunications/media-stream-player-js/commit/f2159441b5fc2fdbd5947191c941c8e5f8598d6f))
  - tweak code layout ([befff23](https://github.com/AxisCommunications/media-stream-player-js/commit/befff234e9462fecb13cacc9ade3c69d689a7967))

### Features

  - additional vapix parameters for web component ([a38dcac](https://github.com/AxisCommunications/media-stream-player-js/commit/a38dcac9c8a8b6d8ed9b68ea7c3d3f75564d41f3))
  - multi stream example ([86e1576](https://github.com/AxisCommunications/media-stream-player-js/commit/86e15762614655cabfed12dba455a9e33b358b49))

### Bug fixes

  - debounce textstring updates ([f061b0d](https://github.com/AxisCommunications/media-stream-player-js/commit/f061b0d4575ab81736a56ae4e84a2260c67c4b20))
  - webcomponent has hardcoded http call ([7507f6f](https://github.com/AxisCommunications/media-stream-player-js/commit/7507f6fc356dddf930384699092c2b0064de9cec))

## [v2.5.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.4.1...v2.5.0) (2020-10-09 16:40:42 +0200)

### Maintenance

  - **deps**: update all ([65277cc](https://github.com/AxisCommunications/media-stream-player-js/commit/65277ccbc2bdffbb4a92269a359241a13bbdf17a))
  - **deps**: update all ([8b887d4](https://github.com/AxisCommunications/media-stream-player-js/commit/8b887d48950cfd4d1e2f9d1c45298d710d55b830))
  - **deps**: update dependency eslint-plugin-react-hooks to v4.1.2 ([c09add0](https://github.com/AxisCommunications/media-stream-player-js/commit/c09add0d1fbc636baa79400bcdec398d9caf928c))
  - **deps**: update dependency typescript to v4 ([9f9aa25](https://github.com/AxisCommunications/media-stream-player-js/commit/9f9aa259fcda80700945aceb3f49fec8b7f97300))
  - **deps**: update typescript-eslint monorepo to v2.34.0 ([5591611](https://github.com/AxisCommunications/media-stream-player-js/commit/55916115077d9473e15ad488b1d9a492d78a40f8))
  - **deps**: update typescript-eslint monorepo to v4 ([e1859a6](https://github.com/AxisCommunications/media-stream-player-js/commit/e1859a6f75ffbfb2e8439ba20a0e7c85bbfbf176))

### Features

  - ability to set initial format for webcomponent ([fb674df](https://github.com/AxisCommunications/media-stream-player-js/commit/fb674df9875c7a50f11852f7b8ecdbd763cc2977))
  - Ability to specify protocol ([3090d25](https://github.com/AxisCommunications/media-stream-player-js/commit/3090d25e1b8bcb7d43d840b3fd456e1925e2690b))
  - vapix parameters for web component ([238455d](https://github.com/AxisCommunications/media-stream-player-js/commit/238455d0f43a09ef830cb64ab956114761fd9536))

### Bug fixes

  - Default value for secure property ([22d12af](https://github.com/AxisCommunications/media-stream-player-js/commit/22d12af7c77373baf3d60734d792ba9608a82a7e))
  - disable explicit module boundary types ([4f4eefe](https://github.com/AxisCommunications/media-stream-player-js/commit/4f4eefee191ef2ae073cc7c52e1a201b318c8171))
  - Don't assume that localStorage works ([289fe21](https://github.com/AxisCommunications/media-stream-player-js/commit/289fe213b6672c1beafc1431e80ed5e7d9bc3d8e))
  - reset the scheduler on teardown ([6361504](https://github.com/AxisCommunications/media-stream-player-js/commit/636150452b9ec49937a5c4ca793e44ef276b2659))
  - Update readme with link to media-stream-player.min.js ([a8ca79d](https://github.com/AxisCommunications/media-stream-player-js/commit/a8ca79d725127ba7da67a8365e04d947c7e73d9c))
  - Update to latest link ([60f00a3](https://github.com/AxisCommunications/media-stream-player-js/commit/60f00a397f6a63355589f52d3f553c64b7f9b3b2))

## [v2.4.1](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.4.0...v2.4.1) (2020-10-01 16:11:23 +0200)

### Maintenance

  - **deps**: update all ([00eab35](https://github.com/AxisCommunications/media-stream-player-js/commit/00eab35aab0793aae65e41cb20b03e1f228ef2dd))
  - **deps**: update babel monorepo ([331d093](https://github.com/AxisCommunications/media-stream-player-js/commit/331d0938f39a25c52faf04e325fe29364d2980af))
  - **deps**: update dependency eslint-plugin-react-hooks to v4 ([b1dff98](https://github.com/AxisCommunications/media-stream-player-js/commit/b1dff9874db099a6912e0ddd8a46bf918a13e74a))
  - **deps**: update dependency jest to v26.4.2 ([991d540](https://github.com/AxisCommunications/media-stream-player-js/commit/991d540638ffa6929b1e81d503fd5eb0522947b6))

## [v2.4.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.3.0...v2.4.0) (2020-08-14 09:20:11 +0200)

### Maintenance

  - **deps**: configure renovate grouping ([b9b95df](https://github.com/AxisCommunications/media-stream-player-js/commit/b9b95df1a93e9d151ac25cdc7fb63c59c1148509))
  - **deps**: pin dependencies ([379a132](https://github.com/AxisCommunications/media-stream-player-js/commit/379a1325e9f91d41588562ad15a7274aed11d8e8))
  - **deps**: update all ([8825e7b](https://github.com/AxisCommunications/media-stream-player-js/commit/8825e7be5e1480c7434341ea76ac1f5704c83b71))
  - **deps**: update all ([ec7ebd5](https://github.com/AxisCommunications/media-stream-player-js/commit/ec7ebd58a5cd88e692c778382af8f80fc2b0881a))
  - **deps**: update babel monorepo ([a8c19ec](https://github.com/AxisCommunications/media-stream-player-js/commit/a8c19ec2ab5fa431e0fa4330f7169b0cc49e2c1b))
  - **deps**: update dependency jest to v25.5.4 ([bfcc7ed](https://github.com/AxisCommunications/media-stream-player-js/commit/bfcc7edc5403a5ae7565ae7b8919e7c226e5ed7f))
  - **deps**: update dependency jest to v26 ([1d7e4f7](https://github.com/AxisCommunications/media-stream-player-js/commit/1d7e4f70dd2042ab1e610c8e745666f83c3d6cae))
  - **deps**: update react monorepo to v16.13.1 ([24f919b](https://github.com/AxisCommunications/media-stream-player-js/commit/24f919ba84d7c97c89ea541e3f1cf1cae592a052))

### Features

  - move `undocumented VAPIX parameter` to debug environment ([2e0b0a3](https://github.com/AxisCommunications/media-stream-player-js/commit/2e0b0a3538b1a51c2a257eec63870473d1ae946c))

### Bug fixes

  - **deps**: update all ([01ede42](https://github.com/AxisCommunications/media-stream-player-js/commit/01ede423c9b00d1a5780f3e78772e025b1ccd422))
  - remove unused dependency ([2a448ac](https://github.com/AxisCommunications/media-stream-player-js/commit/2a448accd54342edaa3bb50b7274f22337b0adf1))

## [v2.3.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.2.1...v2.3.0) (2020-07-15 14:59:19 +0200)

### Features

  - GetImageURL and Screenshot ([6c0d3c3](https://github.com/AxisCommunications/media-stream-player-js/commit/6c0d3c35591b1c0cdf3b545a52051717dae15c3d))

## [v2.2.1](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.2.0...v2.2.1) (2020-05-24 11:09:41 +0200)

### Maintenance

  - Update CONTRIBUTING.md ([32671c9](https://github.com/AxisCommunications/media-stream-player-js/commit/32671c9948ccf373cd7f049d30d4fa1f9f470019))

### Bug fixes

  - all imports of MSL to use same module type ([1b4c9b3](https://github.com/AxisCommunications/media-stream-player-js/commit/1b4c9b39f2c435f73dda01cf47b5b5ae541a9d2a))

## [v2.2.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.1.0...v2.2.0) (2020-05-20 11:33:09 +0200)

### Features

  - properly limit width of video ([1f9109b](https://github.com/AxisCommunications/media-stream-player-js/commit/1f9109be3306dc13b1979a292753c78df93a37ec))

### Bug fixes

  - robust cleanup (abort) when changing state ([4d7a30f](https://github.com/AxisCommunications/media-stream-player-js/commit/4d7a30fbe4f105decfd3fce6c7cfc099e8f1052e))

## [v2.1.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v2.0.0...v2.1.0) (2020-05-14 14:35:29 +0200)

### Features

  - General solution for WebComponent attributes ([62ba18e](https://github.com/AxisCommunications/media-stream-player-js/commit/62ba18e9ef8cc0322200833c58e4d15a1b40b962))
  - statistics overlay improvements ([123ed2b](https://github.com/AxisCommunications/media-stream-player-js/commit/123ed2b6030a2d053520e69bb0cd3fabcc67dc74))
  - Switch component ([5fb3afe](https://github.com/AxisCommunications/media-stream-player-js/commit/5fb3afecc6359ae17c77b80debc0c62147615234))
  - WebComponent autoPlay ability ([c4732a6](https://github.com/AxisCommunications/media-stream-player-js/commit/c4732a6b9aebf66a909489a96d9f1803cbffb85e))

### Bug fixes

  - allow any kind of RTSP URI parameters ([c46c856](https://github.com/AxisCommunications/media-stream-player-js/commit/c46c85611584346960865cc71e37441398b35f10))
  - make sure vapixParams is not null ([c48d969](https://github.com/AxisCommunications/media-stream-player-js/commit/c48d969658606bee7f6f8fdaf6bde165fcc0787f))

## [v2.0.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.2.1...v2.0.0) (2020-04-23 18:07:45 +0200)

### Features

  - **BREAKING** metadata with custom NTP timestamp ([b8f6a10](https://github.com/AxisCommunications/media-stream-player-js/commit/b8f6a10da1bef44903938d988e5b21999b873aab))

## [v1.2.1](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.2.0...v1.2.1) (2020-04-08 15:53:46 +0200)

### Maintenance

  - **deps**: upgrade dependencies ([36dd436](https://github.com/AxisCommunications/media-stream-player-js/commit/36dd43667799d4bf60aa7aacac3cebc2dd341d43))

### Bug fixes

  - properly type forwarded refs ([7a301fb](https://github.com/AxisCommunications/media-stream-player-js/commit/7a301fba791eb23d672855844f7f80582a020aa8))
  - wrap data fetching step in useEffect hook ([0c16ed6](https://github.com/AxisCommunications/media-stream-player-js/commit/0c16ed664b858d2af007af24675a3aac15911178))

## [v1.2.0](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.1.3...v1.2.0) (2020-03-30 10:59:56 +0200)

### Maintenance

  - better `yarn dev` behaviour ([f715e96](https://github.com/AxisCommunications/media-stream-player-js/commit/f715e96f4ddd25d066e071349a678050a6766236))
  - **deps**: upgrade dependencies ([bc1a12d](https://github.com/AxisCommunications/media-stream-player-js/commit/bc1a12d46df0cca89849ac0ec875f2a577b06571))

### Features

  - Stream statistics ([9d6e938](https://github.com/AxisCommunications/media-stream-player-js/commit/9d6e93879587361b49b96bf72bf6e87ba7443115))

### Bug fixes

  - apply prettier code formatting ([589dc60](https://github.com/AxisCommunications/media-stream-player-js/commit/589dc60c475ce06837bf63266381b9a66d74155c))

## [v1.1.3](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.1.2...v1.1.3) (2020-03-13 16:14:02 +0100)

### Bug fixes

  - remove unnecessary container ([cacbe9e](https://github.com/AxisCommunications/media-stream-player-js/commit/cacbe9e067cfc047f350c21a0433fd3fb84b9f01))

## [v1.1.2](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.1.1...v1.1.2) (2020-03-11 13:22:23 +0100)

## [v1.1.1](https://github.com/AxisCommunications/media-stream-player-js/compare/v1.1.0...v1.1.1) (2020-03-11 13:10:34 +0100)

### Maintenance

  - Update README.md ([9d1ede8](https://github.com/AxisCommunications/media-stream-player-js/commit/9d1ede8efcfcdd49e9fc1be92d029d05d186b944))

### Bug fixes

  - Remove source map from build ([6f92e12](https://github.com/AxisCommunications/media-stream-player-js/commit/6f92e12e91de2fe8287645c9ad646dd4386fedde))
  - target more sensible ECMAScript version ([4f954ce](https://github.com/AxisCommunications/media-stream-player-js/commit/4f954ce7066de228833951bb3e8717781e90998e))


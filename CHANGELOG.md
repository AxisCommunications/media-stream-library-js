## 14.0.0-beta.7

- Fix(streams): handle rtcp bye with keepalive

## 14.0.0-beta.6

- Add license field to package.json
- Added some missing info to the HTTP MP4 pipeline.
- Updated documentation regarding release flow, which now
  requires manual update of version and changelog.
- Fixed player non-relative imports from within the package.
- Fixed next/latest tag selection in publish workflow.

## 14.0.0-beta.0

- Switched to workflow-based releases with version as part of source.
  This means that each PR has to have an update of the package.json version
  number and update the CHANGELOG.md file.
- **BREAKING**: Move `player` and `overlay` packages into the `media-stream-library` package.
  These can be imported as `media-stream-library/player` and `media-stream-library/overlay`.
- **BREAKING**: Only export ES modules (including minified bundles with external dependencies).
- **BREAKING**: Replaced Node.js Buffer with Uint8Array.
- **BREAKING**: Replaced Node.js Stream module with Web Streams API.
  Components and pipelines are redesigned completely, check the source
  and examples for details on how to migrate.
- **BREAKING**: Replaced `debug` package with internal log module.
  Set `msl-streams-debug`, `msl-player-debug`, and `msl-overlay-debug`
  `localStorage` keys to `"true"` instead for logging.
- **BREAKING**: Removed CommonJS support and separation of Node.js
  and Browser exports.
- Added AAC test audio to the default RTSP H.264 test video.
 

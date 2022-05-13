#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const buildDir = 'dist'

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir)
}

for (const format of ['esm', 'cjs']) {
  esbuild.buildSync({
    platform: 'browser',
    entryPoints: ['lib/index.ts'],
    outfile: path.join(buildDir, `index-${format}.js`),
    format,
    external: [
      '@juggle/resize-observer',
      'debug',
      'react-hooks-shareable',
      'react',
      'react-dom',
      'luxon',
      'media-stream-library',
      'styled-components',
    ],
    bundle: true,
    minify: true,
    sourcemap: true,
    // avoid a list of browser targets by setting a common baseline ES level
    target: 'es2015',
  })
}

esbuild.buildSync({
  platform: 'browser',
  entryPoints: ['lib/index.ts'],
  outfile: path.join(buildDir, 'media-stream-player.min.js'),
  format: 'iife',
  globalName: 'mediaStreamPlayer',
  // Needed because readable-streams (needed by stream-browserify) still references global.
  // There are issues on this, but they get closed, so unsure if this will ever change.
  define: {
    global: 'window',
  },
  bundle: true,
  minify: true,
  sourcemap: true,
  // avoid a list of browser targets by setting a common baseline ES level
  target: 'es2015',
})

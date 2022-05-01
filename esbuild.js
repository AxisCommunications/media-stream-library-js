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
    entryPoints: ['lib/index.browser.ts'],
    outfile: path.join(buildDir, `browser-${format}.js`),
    format,
    // Needed because readable-streams (needed by stream-browserify) still references global.
    // There are issues on this, but they get closed, so unsure if this will ever change.
    define: {
      global: 'window',
    },
    inject: ['polyfill.js'],
    external: ['stream', 'buffer', 'process'],
    bundle: true,
    minify: true,
    sourcemap: true,
    // avoid a list of browser targets by setting a common baseline ES level
    target: 'es2015',
  })

  esbuild.buildSync({
    platform: 'node',
    entryPoints: ['lib/index.node.ts'],
    outfile: path.join(buildDir, `node-${format}.js`),
    format,
    external: ['stream', 'buffer', 'process', 'ws'],
    bundle: true,
    minify: true,
    sourcemap: true,
    target: 'node16',
  })
}

esbuild.buildSync({
  platform: 'browser',
  entryPoints: ['lib/index.browser.ts'],
  outfile: path.join(buildDir, 'media-stream-library.min.js'),
  format: 'iife',
  globalName: 'mediaStreamLibrary',
  // Needed because readable-streams (needed by stream-browserify) still references global.
  // There are issues on this, but they get closed, so unsure if this will ever change.
  define: {
    global: 'window',
  },
  inject: ['polyfill.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  // avoid a list of browser targets by setting a common baseline ES level
  target: 'es2015',
})

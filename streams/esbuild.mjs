#!/usr/bin/env node
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { buildSync } from 'esbuild'

const buildDir = 'dist'

if (!existsSync(buildDir)) {
  mkdirSync(buildDir)
}

for (
  const output of [
    { format: 'esm', ext: 'mjs' },
    { format: 'cjs', ext: 'cjs' },
  ]
) {
  buildSync({
    platform: 'browser',
    entryPoints: ['src/index.browser.ts'],
    outfile: join(buildDir, `browser.${output.ext}`),
    format: output.format,
    // Needed because readable-streams (needed by stream-browserify) still references global.
    // There are issues on this, but they get closed, so unsure if this will ever change.
    define: {
      global: 'window',
    },
    inject: ['polyfill.mjs'],
    external: ['stream', 'buffer', 'process'],
    bundle: true,
    minify: false,
    sourcemap: true,
    // avoid a list of browser targets by setting a common baseline ES level
    target: 'es2015',
  })

  buildSync({
    platform: 'node',
    entryPoints: ['src/index.node.ts'],
    outfile: join(buildDir, `node.${output.ext}`),
    format: output.format,
    external: ['stream', 'buffer', 'process', 'ws'],
    bundle: true,
    minify: false,
    sourcemap: true,
    target: 'node16',
  })
}

buildSync({
  platform: 'browser',
  entryPoints: ['src/index.browser.ts'],
  outfile: join(buildDir, 'media-stream-library.min.js'),
  format: 'iife',
  globalName: 'mediaStreamLibrary',
  // Needed because readable-streams (needed by stream-browserify) still references global.
  // There are issues on this, but they get closed, so unsure if this will ever change.
  define: {
    global: 'window',
  },
  inject: ['polyfill.mjs'],
  bundle: true,
  minify: true,
  sourcemap: true,
  // avoid a list of browser targets by setting a common baseline ES level
  target: 'es2015',
})

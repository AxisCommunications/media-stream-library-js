#!/usr/bin/env node
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

import { buildSync } from 'esbuild'

const buildDir = 'dist'

if (!existsSync(buildDir)) {
  mkdirSync(buildDir)
}

for (const output of [
  { format: 'esm', ext: 'mjs' },
  { format: 'cjs', ext: 'cjs' },
]) {
  buildSync({
    platform: 'browser',
    entryPoints: ['src/index.ts'],
    outfile: join(buildDir, `index.${output.ext}`),
    format: output.format,
    external: ['@juggle/resize-observer', 'react', 'react-dom', 'pepjs'],
    bundle: true,
    minify: true,
    sourcemap: true,
    // avoid a list of browser targets by setting a common baseline ES level
    target: 'es2015',
  })
}

buildSync({
  platform: 'browser',
  entryPoints: ['src/index.ts'],
  outfile: join(buildDir, 'media-overlay-library.min.js'),
  format: 'iife',
  globalName: 'mediaOverlayLibrary',
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

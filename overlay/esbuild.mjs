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
  bundle: true,
  minify: true,
  sourcemap: true,
  // avoid a list of browser targets by setting a common baseline ES level
  target: 'es2015',
})

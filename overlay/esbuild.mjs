#!/usr/bin/env node
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { buildSync } from 'esbuild'

const buildDir = 'dist'

if (!existsSync(buildDir)) {
  mkdirSync(buildDir)
}

for (const output of [
  { format: 'esm', name: 'index-esm.js' },
  { format: 'cjs', name: 'index-cjs.js' },
]) {
  buildSync({
    platform: 'browser',
    entryPoints: ['src/index.ts'],
    outfile: join(buildDir, output.name),
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

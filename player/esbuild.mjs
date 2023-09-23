#!/usr/bin/env node
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { buildSync } from 'esbuild'

const buildDir = 'dist'

if (!existsSync(buildDir)) {
  mkdirSync(buildDir)
}

const bundles = [
  { format: 'esm', name: 'index.mjs', external: ['media-stream-library'] },
  { format: 'cjs', name: 'index.cjs', external: ['media-stream-library'] },
  { format: 'esm', name: 'index-heavy.mjs', external: [] },
  { format: 'cjs', name: 'index-heavy.cjs', external: [] },
]

for (
  const { name, format, external } of bundles
) {
  buildSync({
    platform: 'browser',
    entryPoints: ['src/index.ts'],
    outfile: join(buildDir, name),
    format,
    external: [
      '@juggle/resize-observer',
      'debug',
      'react-hooks-shareable',
      'react',
      'react-dom',
      'luxon',
      'styled-components',
      ...external,
    ],
    bundle: true,
    minify: false,
    sourcemap: true,
    // avoid a list of browser targets by setting a common baseline ES level
    target: 'es2015',
  })
}

buildSync({
  platform: 'browser',
  entryPoints: ['src/index.ts'],
  outfile: join(buildDir, 'media-stream-player.min.js'),
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

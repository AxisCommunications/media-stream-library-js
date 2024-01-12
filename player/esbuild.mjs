#!/usr/bin/env node
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { buildSync } from 'esbuild'

const buildDir = 'dist'

if (!existsSync(buildDir)) {
  mkdirSync(buildDir)
}

const bundles = [
  { format: 'esm', name: 'index-esm.js' },
  { format: 'cjs', name: 'index-cjs.js' },
]

for (
  const { name, format } of bundles
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
      'media-stream-library',
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
  bundle: true,
  minify: true,
  sourcemap: true,
  // avoid a list of browser targets by setting a common baseline ES level
  target: 'es2015',
})

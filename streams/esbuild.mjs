#!/usr/bin/env node

import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { buildSync } from 'esbuild'

const buildDir = 'dist'

if (!existsSync(buildDir)) {
  mkdirSync(buildDir)
}

buildSync({
  platform: 'browser',
  entryPoints: ['src/index.ts'],
  outfile: join(buildDir, 'index.js'),
  format: 'esm',
  packages: 'external',
  bundle: true,
  minify: false,
  sourcemap: true,
  // avoid a list of browser targets by setting a common baseline ES level
  target: 'es2015',
})

buildSync({
  platform: 'browser',
  entryPoints: ['src/index.ts'],
  outfile: join(buildDir, 'media-stream-library.min.js'),
  format: 'iife',
  globalName: 'mediaStreamLibrary',
  bundle: true,
  minify: true,
  sourcemap: true,
  // avoid a list of browser targets by setting a common baseline ES level
  target: 'es2015',
})

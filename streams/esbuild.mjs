#!/usr/bin/env node
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { buildSync } from 'esbuild'

const buildDir = 'dist'

if (!existsSync(buildDir)) {
  mkdirSync(buildDir)
}

const browserBundles = [
  {
    format: 'esm',
    name: 'browser.mjs',
    external: ['stream', 'buffer', 'process'],
  },
  {
    format: 'cjs',
    name: 'browser.cjs',
    external: ['stream', 'buffer', 'process'],
  },
  { format: 'esm', name: 'browser-heavy.mjs' },
  { format: 'cjs', name: 'browser-heavy.cjs' },
]

for (const { format, name, external } of browserBundles) {
  buildSync({
    platform: 'browser',
    entryPoints: ['src/index.browser.ts'],
    outfile: join(buildDir, name),
    format,
    // Needed because readable-streams (needed by stream-browserify) still references global.
    // There are issues on this, but they get closed, so unsure if this will ever change.
    define: {
      global: 'window',
    },
    inject: ['polyfill.mjs'],
    external,
    bundle: true,
    minify: false,
    sourcemap: true,
    // avoid a list of browser targets by setting a common baseline ES level
    target: 'es2015',
  })
}

const nodeBundles = [
  { format: 'esm', name: 'node.mjs' },
  { format: 'cjs', name: 'node.cjs' },
]

for (const { format, name } of nodeBundles) {
  buildSync({
    platform: 'node',
    entryPoints: ['src/index.node.ts'],
    outfile: join(buildDir, name),
    format,
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

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
    name: 'browser-esm.js',
    external: ['debug', 'ts-md5', 'ws'],
    inject: ['polyfill.mjs'],
  },
  {
    format: 'cjs',
    name: 'browser-cjs.js',
    external: ['debug', 'ts-md5', 'ws'],
    inject: ['polyfill.mjs'],
  },
  {
    format: 'esm',
    name: 'browser-light-esm.js',
    external: ['debug', 'process', 'stream', 'ts-md5', 'ws'],
    inject: ['polyfill.mjs'],
  },
  {
    format: 'cjs',
    name: 'browser-light-cjs.js',
    external: ['debug', 'process', 'stream', 'ts-md5', 'ws'],
    inject: ['polyfill.mjs'],
  },
]

for (const { format, name, external, inject } of browserBundles) {
  buildSync({
    platform: 'browser',
    entryPoints: ['src/index.browser.ts'],
    outfile: join(buildDir, name),
    format,
    // Needed because readable-stream (needed by stream-browserify) still references global.
    // There are issues on this, but they get closed, so unsure if this will ever change.
    define: {
      global: 'window',
      process: 'process_browser',
    },
    inject,
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
    external: ['stream', 'process', 'ws'],
    bundle: true,
    minify: false,
    sourcemap: true,
    target: 'node20',
  })
}

buildSync({
  platform: 'browser',
  entryPoints: ['src/index.browser.ts'],
  outfile: join(buildDir, 'media-stream-library.min.js'),
  format: 'iife',
  globalName: 'mediaStreamLibrary',
  // Needed because readable-stream (needed by stream-browserify) still references global.
  // There are issues on this, but they get closed, so unsure if this will ever change.
  define: {
    global: 'window',
    process: 'process_browser',
  },
  inject: ['polyfill.mjs'],
  bundle: true,
  minify: true,
  sourcemap: true,
  // avoid a list of browser targets by setting a common baseline ES level
  target: 'es2015',
})

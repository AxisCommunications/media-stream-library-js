#!/usr/bin/env node

import { buildSync } from 'esbuild'

// The ES module with only sources bundled (all other packages external)
buildSync({
  platform: 'browser',
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  format: 'esm',
  packages: 'external',
  bundle: true,
  minify: false,
  sourcemap: true,
  target: 'es2020',
})

// A minified bundle that can be used as-is in browser with
// <script type="module" src="/msl-player.min.js"></script>
buildSync({
  platform: 'browser',
  entryPoints: ['src/index.ts'],
  outfile: 'msl-player.min.js',
  format: 'esm',
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
})

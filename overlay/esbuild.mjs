#!/usr/bin/env node

import { buildSync } from 'esbuild'

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

buildSync({
  platform: 'browser',
  entryPoints: ['src/index.ts'],
  outfile: 'msl-overlay.min.js',
  format: 'esm',
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
})

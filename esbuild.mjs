#!/usr/bin/env node

import { buildSync } from 'esbuild'

// The ES module with only sources bundled (all other packages external).
buildSync({
  platform: 'browser',
  entryPoints: [
    'src/streams/index.ts',
    'src/player/index.ts',
    'src/overlay/index.ts',
  ],
  outdir: 'dist',
  format: 'esm',
  packages: 'external',
  bundle: true,
  minify: true,
  sourcemap: true,
  splitting: true,
  target: 'es2020',
})

// A minified bundle that can be used as-is in browser with e.g.
// <script type="module" src="/msl-streams.min.js"></script>
for (const bundle of [
  { entry: 'src/streams/index.ts', name: 'msl-streams.min.js' },
  { entry: 'src/player/index.ts', name: 'msl-player.min.js' },
  { entry: 'src/overlay/index.ts', name: 'msl-overlay.min.js' },
]) {
  buildSync({
    platform: 'browser',
    entryPoints: [bundle.entry],
    outfile: bundle.name,
    format: 'esm',
    bundle: true,
    minify: true,
    sourcemap: true,
    splitting: false,
    target: 'es2020',
  })
}

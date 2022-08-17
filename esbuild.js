#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')
const { exec } = require('child_process')
const yargs = require('yargs')

const buildDir = 'dist'

// Parse the arguments to get the build target
const { target } = yargs
  .command('esbuild.js', 'Builds the library with the given target')
  .option('target', {
    description: 'The target to build for',
    choices: ["browser", "node", "minified"]
  })
  .help()
  .alias('help', 'h').demandOption(["target"]).argv;

// Clean the build directory
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true })
}
fs.mkdirSync(buildDir)

// Compile the bundle for both ESM and CommonJS, but only for the platform we are targeting
for (const format of ['esm', 'cjs']) {
  switch (target) {
    case 'browser':
      esbuild.buildSync({
        platform: 'browser',
        entryPoints: ['lib/index.browser.ts'],
        outfile: path.join(buildDir, `index.${format}.js`),
        format,
        inject: ['polyfill.js'],
        bundle: true,
        minify: true,
        sourcemap: true,
        // avoid a list of browser targets by setting a common baseline ES level
        target: 'es2015',
      })
      break;

    case "node":
      esbuild.buildSync({
        platform: 'node',
        entryPoints: ['lib/index.node.ts'],
        outfile: path.join(buildDir, `index.${format}.js`),
        format,
        external: ['stream', 'process', 'ws'],
        bundle: true,
        minify: true,
        sourcemap: true,
        target: 'node16',
      })
      break;

    case "minified":
      esbuild.buildSync({
        platform: 'browser',
        entryPoints: ['lib/index.browser.ts'],
        outfile: path.join(buildDir, 'media-stream-library.min.js'),
        format: 'iife',
        globalName: 'mediaStreamLibrary',
        // Needed because readable-streams (needed by stream-browserify) still references global.
        // There are issues on this, but they get closed, so unsure if this will ever change.
        define: {
          global: 'window',
        },
        inject: ['polyfill.js'],
        bundle: true,
        minify: true,
        sourcemap: true,
        // avoid a list of browser targets by setting a common baseline ES level
        target: 'es2015',
      })
      break;
  }
}

// Emit the type declarations for the platform we are targeting in a single index.d.ts file
const tsProject = target === "minified" ? "browser" : target;
exec(`yarn tsc --project tsconfig.${tsProject}.json`, (error, stdout, stderr) => {
  console.log("error", error)
  console.log("stdout", stdout)
  console.log("stderr", stderr)

  if (error) {
    process.exit(1);
  }
})

#!/usr/bin/env node
const { createServer } = require('vite')
const reactPlugin = require('@vitejs/plugin-react')
const chalk = require('chalk')

const defaultCamera = 'http://192.168.0.90'

let host = process.env.MSP_CAMERA
if (!host) {
  console.warn(
    chalk.red`
WARNING: no MSP_CAMERA environment variable detected, will use default.
If you want to use a specific camera, please pass its host to the
environment variable CAMERA, like so:

    MSP_CAMERA=http://camera-ip:port yarn dev
`,
  )
  host = defaultCamera
}

const unicornDivider = () =>
  console.log(
    '🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄',
  )

createServer({
  configFile: false,
  sourcemap: 'inline',
  resolve: {
    alias: {
      stream: 'stream-browserify',
    },
  },
  define: {
    global: 'window',
  },
  server: {
    proxy: {
      '^/(axis-cgi|vapix|local|rtsp-over-websocket).*': {
        target: host,
        ws: true,
        changeOrigin: true,
      },
    },
  },
  plugins: [reactPlugin()],
})
  .then((server) => {
    return server.listen()
  })
  .then((server) => {
    unicornDivider()
    server.printUrls()
    console.log(`VAPIX requests will be forwarded to: ${host}`)
    unicornDivider()
  })

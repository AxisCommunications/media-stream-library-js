#!/usr/bin/env node

import reactPlugin from '@vitejs/plugin-react'
import chalk from 'chalk'
import { createServer } from 'vite'

const defaultCamera = 'http://192.168.0.90'

let host = process.env.MSP_CAMERA
if (!host) {
  console.warn(
    chalk.red`
WARNING: no MSP_CAMERA environment variable detected, will use default.
If you want to use a specific camera, please pass its host to the
environment variable CAMERA, like so:

    export MSP_CAMERA=http://camera-ip:port
`
  )
  host = defaultCamera
}

const unicornDivider = () =>
  console.log(
    '🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄'
  )

await createServer({
  root: './src/player',
  dedupe: ['react', 'react-dom'],
  configFile: false,
  sourcemap: 'inline',
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

#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const { pipelines } = require('media-stream-library')
const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')

const argv = yargs(hideBin(process.argv))
  .option('port', {
    type: 'string',
    description: 'websocket port (8854)',
    default: '8854',
  })
  .option('rtspHost', { type: 'string', description: 'RTSP host' })
  .parse() // Setup a new pipeline
;(function wrap() {
  console.log(`WebSocket server at ws://localhost:${argv.port}`)
  console.log(pipelines, pipelines.TcpWsProxyPipeline)
  return new pipelines.TcpWsProxyPipeline({
    wsOptions: { host: '::', port: argv.port },
    rtspHost: argv.rtspHost,
  })
})()

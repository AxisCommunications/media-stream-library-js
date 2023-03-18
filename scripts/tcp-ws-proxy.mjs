#!/usr/bin/env node
import { pipelines } from 'media-stream-library'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

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

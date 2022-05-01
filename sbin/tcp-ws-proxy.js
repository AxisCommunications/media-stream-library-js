const yargs = require('yargs')

const { pipelines } = require('../dist/node-cjs')

const argv = yargs.options({
  port: { type: 'string', describe: 'websocket port (8854)', default: '8854' },
  rtspHost: { type: 'string', describe: 'RTSP host' },
}).argv

// Setup a new pipeline
;(function wrap() {
  console.log(`WebSocket server at ws://localhost:${argv.port}`)
  console.log(pipelines, pipelines.TcpWsProxyPipeline)
  return new pipelines.TcpWsProxyPipeline({
    wsOptions: { host: '::', port: argv.port },
    rtspHost: argv.rtspHost,
  })
})()

const yargs = require('yargs')

const { pipelines } = require('../dist/cjs/index.node.js')

const argv = yargs.options({
  port: { type: 'string', describe: 'websocket port (8854)', default: '8854' },
}).argv

// Setup a new pipeline
;(function wrap() {
  console.log(`WebSocket server at ws://localhost:${argv.port}`)
  console.log(pipelines, pipelines.TcpWsProxyPipeline)
  return new pipelines.TcpWsProxyPipeline({ host: '::', port: argv.port })
})()

const yargs = require('yargs')

const { pipelines } = require('../lib/index.node.js')

const argv = yargs.options({
  'port': { type: 'string', describe: 'websocket port (8854)', default: '8854' }
}).argv

// Setup a new pipeline
;(function wrap () {
  console.log(`WebSocket server at ws://localhost:${argv.port}`)
  return new pipelines.TcpWsServerPipeline({ host: '0.0.0.0', port: argv.port })
})()

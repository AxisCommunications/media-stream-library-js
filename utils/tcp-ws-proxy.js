const yargs = require('yargs')

const {pipelines} = require('../lib/index.node.js')

const argv = yargs.options({
  'port': {type: 'string', describe: 'websocket port (8854)', default: '8854'}
}).argv

// Setup a new pipeline
;(function wrap () {
  return new pipelines.TcpWsPipeline({host: 'localhost', port: argv.port})
})()

const yargs = require('yargs')

const {pipelines} = require('../../lib/index.node.js')

const argv = yargs.options({
  'port': {type: 'string', describe: 'websocket port (8080)'}
}).argv

// Setup a new pipeline
const pipeline = new pipelines.TcpWsPipeline({host: 'localhost', port: '8080'})

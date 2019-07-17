const yargs = require('yargs')

const { pipelines } = require('../../dist/cjs/index.node.js')

const argv = yargs.options({
  uri: { type: 'string', describe: 'rtsp://hostname/path' },
  host: { type: 'string', describe: 'hostname', conflicts: 'uri' },
  vapix: {
    type: 'string',
    describe: 'key=value [key=value ...]',
    conflicts: 'uri',
    array: true,
  },
  username: { type: 'string', describe: 'username' },
  password: { type: 'string', describe: 'password' },
}).argv

if (!(argv.uri || argv.host)) {
  console.log('You must specify either a host or full RTSP uri')
  yargs.showHelp()
  process.exit(1)
}

// Set up main configuration object.
const config = {
  rtsp: {
    uri: argv.uri,
    hostname: argv.host,
    parameters: argv.vapix,
  },
  auth: {
    username: argv.username,
    password: argv.password,
  },
  // This callback will give you access to the metadata
  metadataHandler: xmlMsg => {
    console.log(xmlMsg)
  },
}

// Setup a new pipeline
const pipeline = new pipelines.CliMetadataPipeline(config)
pipeline.rtsp.play()

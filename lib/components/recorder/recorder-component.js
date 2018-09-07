const fs = require('fs')
const path = require('path')

const Component = require('../component')
const StreamFactory = require('../helpers/stream-factory')

/**
 * Component that writes passing incoming/outgoing streams
 * interleaved to a filestream. The resulting stream (file) stores
 * messages as a JSON array, where each element has a type, timestamp,
 * and the original message (that went through the stream).
 */
class RecorderComponent extends Component {
  /**
   * Create a new recorder component that will record to a writable stream.
   * @param {Stream} fileStream The stream to save the messages to.
   * @return {undefined}
   */
  constructor (fileStream) {
    const incoming = StreamFactory.recorder('incoming', fileStream)
    const outgoing = StreamFactory.recorder('outgoing', fileStream)

    const interleaved = { incoming, outgoing }

    const streamsFinished = []
    for (const key in interleaved) {
      streamsFinished.push(
        new Promise((resolve) => interleaved[key].on('finish', () => {
          const timestamp = Date.now()
          const message = null
          const type = key
          fileStream.write(JSON.stringify({ type, timestamp, message }, null, 2))
          fileStream.write(',\n')
          resolve()
        }))
      )
    }

    // start of file: begin JSON array
    fileStream.write('[\n')

    // end of file: close JSON array
    Promise.all(streamsFinished).then(() => {
      fileStream.write(JSON.stringify(null))
      fileStream.write('\n]\n')
    })

    super(incoming, outgoing)
  }

  /**
   * Create a new recorder component that will record to a file.
   * @param {String} filename The name of the file (relative to cwd)
   * @return {RecorderComponent}
   */
  static toFile (filename = 'data.json') {
    const cwd = process.cwd()
    const fileStream = fs.createWriteStream(path.join(cwd, filename))

    return new RecorderComponent(fileStream)
  }
};

module.exports = RecorderComponent

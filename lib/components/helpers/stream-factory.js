const stream = require('stream')

// const sleep = require('./sleep');

class StreamFactory {
  /**
   * Creates a writable stream that sends all messages written to the stream
   * to a callback function and then considers it written.
   * @param {Function} fn  The callback to be invoked on the message
   */
  static consumer (fn = () => {}) {
    return new stream.Writable({
      objectMode: true,
      write: function (msg, encoding, callback) {
        fn(msg)
        callback()
      }
    })
  }

  /**
  * Creates a readable stream that sends a message for each element of an array.
  * @param {Array} arr  The array with elements to be turned into a stream.
  */
  static producer (messages) {
    let counter = 0
    return new stream.Readable({
      objectMode: true,
      read: function () {
        if (messages !== undefined && counter < messages.length) {
          this.push(messages[counter++])
        }
      }
    })
  }

  static recorder (type, fileStream) {
    return new stream.Transform({
      objectMode: true,
      transform: function (msg, encoding, callback) {
        const timestamp = Date.now()
        // Replace binary data with base64 string
        const message = Object.assign({}, msg, {data: msg.data.toString('base64')})
        fileStream.write(JSON.stringify({type, timestamp, message}, null, 2))
        fileStream.write(',\n')
        callback(null, msg)
      }
    })
  }

  /**
   * Yield binary messages from JSON packet array until depleted.
   * @return {Generator} Returns a JSON packet iterator.
   */
  static replayer (packets) {
    let packetCounter = 0
    let lastTimestamp = packets[0].timestamp
    return new stream.Readable({
      objectMode: true,
      read: function () {
        const packet = packets[packetCounter++]
        if (packet) {
          const {type, timestamp, message} = packet
          const delay = timestamp - lastTimestamp
          lastTimestamp = timestamp
          if (message) {
            const data = message.data ? Buffer.from(message.data, 'base64') : Buffer.alloc(0)
            const msg = Object.assign({}, message, {data})
            this.push({type, delay, msg})
          } else {
            // console.log('end');
            this.push({type, delay, msg: null})
          }
        } else {
          this.push(null)
        }
      }
    })
  };
}

module.exports = StreamFactory

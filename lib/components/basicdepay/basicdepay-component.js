const {Transform} = require('stream')
const {Rtp} = require('../../utils/protocols')
const {RTP, ELEMENTARY} = require('../messageTypes')
const Component = require('../component')

class BasicDepayComponent extends Component {
  constructor (payloadType) {
    if (payloadType === undefined) {
      throw new Error('you must supply a payload type to BasicDepayComponent')
    }

    let buffer = Buffer.alloc(0)

    const incoming = new Transform({
      objectMode: true,
      transform: function (msg, encoding, callback) {
        if (msg.type === RTP && Rtp.payloadType(msg.data) === payloadType) {
          const payload = Rtp.payload(msg.data)
          buffer = Buffer.concat([buffer, payload])

          if (Rtp.marker(msg.data)) {
            if (buffer.length > 0) {
              this.push({
                data: buffer,
                timestamp: Rtp.timestamp(msg.data),
                ntpTimestamp: msg.ntpTimestamp,
                payloadType: Rtp.payloadType(msg.data),
                type: ELEMENTARY
              })
            }
            buffer = Buffer.alloc(0)
          }
          callback()
        } else {
          // Not a message we should handle
          callback(null, msg)
        }
      }
    })

    // outgoing will be defaulted to a PassThrough stream
    super(incoming)
  }
}

module.exports = BasicDepayComponent

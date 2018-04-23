const {Transform} = require('stream')

const Component = require('../component')

const generateLogger = (prefix, type) => {
  let lastTimestamp = Date.now()

  const log = (msg) => {
    const timestamp = Date.now()
    console.log(`${prefix}: +${(timestamp - lastTimestamp)}ms`, msg)
    lastTimestamp = timestamp
  }

  if (typeof type === 'undefined') {
    return log
  } else {
    return (msg) => msg.type === type && log(msg)
  }
}

/**
 * Component that logs whatever is passing through.
 */
class InspectorComponent extends Component {
  /**
   * Create a new inspector component.
   * @argument {String} type  The type of message to log (default is to log all).
   * @return {undefined}
   */
  constructor (type) {
    const incomingLogger = generateLogger('incoming', type)

    const incoming = new Transform({
      objectMode: true,
      transform: function (msg, encoding, callback) {
        incomingLogger(msg)
        callback(null, msg)
      }
    })

    const outgoingLogger = generateLogger('outgoing', type)

    const outgoing = new Transform({
      objectMode: true,
      transform: function (msg, encoding, callback) {
        outgoingLogger(msg)
        callback(null, msg)
      }
    })

    super(incoming, outgoing)
  }
};

module.exports = InspectorComponent

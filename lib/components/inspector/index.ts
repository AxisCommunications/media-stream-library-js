import { Tube } from '../component'
import { Transform } from 'stream'
import { GenericMessage, MessageType } from '../message'

const generateLogger = (prefix: string, type?: MessageType) => {
  let lastTimestamp = Date.now()

  const log = (msg: GenericMessage) => {
    const timestamp = Date.now()
    console.log(`${prefix}: +${timestamp - lastTimestamp}ms`, msg)
    lastTimestamp = timestamp
  }

  if (type === undefined) {
    return log
  } else {
    return (msg: GenericMessage) => msg.type === type && log(msg)
  }
}

/**
 * Component that logs whatever is passing through.
 */
export class Inspector extends Tube {
  /**
   * Create a new inspector component.
   * @argument {String} type  The type of message to log (default is to log all).
   * @return {undefined}
   */
  constructor(type?: MessageType) {
    const incomingLogger = generateLogger('incoming', type)

    const incoming = new Transform({
      objectMode: true,
      transform: function (msg, encoding, callback) {
        incomingLogger(msg)
        callback(undefined, msg)
      },
    })

    const outgoingLogger = generateLogger('outgoing', type)

    const outgoing = new Transform({
      objectMode: true,
      transform: function (msg, encoding, callback) {
        outgoingLogger(msg)
        callback(undefined, msg)
      },
    })

    super(incoming, outgoing)
  }
}

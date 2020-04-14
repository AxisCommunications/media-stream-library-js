import { Tube } from '../component'
import { Transform } from 'stream'
import { Message, MessageType } from '../message'
import { builder } from './builder'
import { Parser } from './parser'

/**
 * A component that converts raw binary data into RTP/RTSP/RTCP packets on the
 * incoming stream, and converts RTSP commands to raw binary data on the outgoing
 * stream. The component is agnostic of any RTSP session details (you need an
 * RTSP session component in the pipeline).
 * @extends {Component}
 */
export class RtspParser extends Tube {
  /**
   * Create a new RTSP parser component.
   * @return {undefined}
   */
  constructor() {
    const parser = new Parser()

    // Incoming stream
    const incoming = new Transform({
      objectMode: true,
      transform: function (msg: Message, encoding, callback) {
        if (msg.type === MessageType.RAW) {
          parser.parse(msg.data).forEach((message) => incoming.push(message))
          callback()
        } else {
          // Not a message we should handle
          callback(undefined, msg)
        }
      },
    })

    // Outgoing stream
    const outgoing = new Transform({
      objectMode: true,
      transform: function (msg: Message, encoding, callback) {
        if (msg.type === MessageType.RTSP) {
          const data = builder(msg)
          callback(undefined, { type: MessageType.RAW, data })
        } else {
          // don't touch other types
          callback(undefined, msg)
        }
      },
    })

    super(incoming, outgoing)
  }
}

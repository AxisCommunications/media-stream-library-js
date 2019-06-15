import { Tube } from '../component'
import { Transform } from 'stream'
import { Message, MessageType } from '../message'
import { Parser } from './parser'

/**
 * A component that converts raw binary MP4 data into ISOM boxes.
 * @extends {Component}
 */
export class Mp4Parser extends Tube {
  /**
   * Create a new RTSP parser component.
   */
  constructor() {
    const parser = new Parser()

    // Incoming stream
    const incoming = new Transform({
      objectMode: true,
      transform: function (msg: Message, _, callback) {
        if (msg.type === MessageType.RAW) {
          parser.parse(msg.data).forEach((message) => incoming.push(message))
          callback()
        } else {
          // Not a message we should handle
          callback(undefined, msg)
        }
      },
    })

    super(incoming)
  }
}

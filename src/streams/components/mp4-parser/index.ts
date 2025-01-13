import { IsomMessage } from '../types/isom'

import { Parser } from './parser'

/**
 * A transform stream that converts raw binary MP4 data into ISOM boxes.
 */
export class Mp4Parser extends TransformStream<Uint8Array, IsomMessage> {
  constructor() {
    const parser = new Parser()

    super({
      transform: (chunk, controller) => {
        parser.parse(chunk).forEach((message) => {
          controller.enqueue(message)
        })
      },
    })
  }
}

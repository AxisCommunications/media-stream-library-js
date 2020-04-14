import { Readable, Writable } from 'stream'
import { Source } from '../component'
import { readFileSync } from 'fs'
import { join } from 'path'
import StreamFactory from '../helpers/stream-factory'
import { sleep } from '../helpers/sleep'

export class Replayer extends Source {
  /**
   * Create a new replay component that will play provided data.
   * The packets need to conform to the format:
   * {
   *   type: 'incoming'/'outgoing',
   *   delay: Number,
   *   msg: Object (original message)
   * }
   * @param {String} data The JSON data to replay.
   * @return {undefined}
   */
  constructor(packetStream: Readable) {
    let finished = false

    const incoming = new Readable({
      objectMode: true,
      read: function () {
        //
      },
    })

    /**
     * Emit incoming items in the queue until an outgoing item is found.
     * @param  {Function} callback Call to signal completion.
     * @return {Promise}           undefined
     */
    const start = async () => {
      let packet = packetStream.read()

      while (packet && packet.type === 'incoming') {
        await sleep(packet.delay)
        incoming.push(packet.msg)
        packet = packetStream.read()
      }
      if (finished) {
        incoming.push(null)
      }
    }

    const outgoing = new Writable({
      objectMode: true,
      write: function (msg, encoding, callback) {
        start().catch(() => {
          /** ignore */
        }) // resume streaming
        callback()
      },
    })

    outgoing.on('finish', () => {
      finished = true
    })

    outgoing.on('pipe', () => start())

    super(incoming, outgoing)
  }

  /**
   * Create a new replay component that will play from a file.
   * @param {String} filename The name of the file (relative to cwd)
   * @return {ReplayComponent}
   */
  static fromFile(filename = 'data.json') {
    const cwd = process.cwd()
    const data = readFileSync(join(cwd, filename))
    const packets = JSON.parse(data.toString())
    const packetStream = StreamFactory.replayer(packets)

    return new Replayer(packetStream)
  }
}

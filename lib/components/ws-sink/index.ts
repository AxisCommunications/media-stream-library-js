import { Sink } from '../component'
import { Readable, Writable } from 'stream'
import { MessageType } from '../message'

/**
 * The socket used here is a ws socket returned by
 * a ws Server's 'connection' event.
 */

export class WSSink extends Sink {
  constructor(socket: any) {
    const outgoing = new Readable({
      objectMode: true,
      read: () => {
        /** noop */
      },
    })

    const incoming = new Writable({
      objectMode: true,
      write: (msg, encoding, callback) => {
        try {
          socket.send(msg.data)
        } catch (e) {
          console.warn('message lost during send:', msg)
        }
        callback()
      },
    })

    socket.on('message', function(data: Buffer) {
      outgoing.push({ data, type: MessageType.RAW })
    })

    socket.on('close', function() {
      outgoing.push(null)
    })

    super(incoming, outgoing)
  }
}

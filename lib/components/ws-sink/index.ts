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

    socket.on('message', function (data: Buffer) {
      outgoing.push({ data, type: MessageType.RAW })
    })

    socket.on('close', function () {
      outgoing.push(null)
    })
    socket.on('error', (e: Error) => {
      console.error('WebSocket error:', e)
      socket.terminate()
      outgoing.push(null)
    })

    // When an error is sent on the incoming stream, close the socket.
    incoming.on('error', (e) => {
      console.log('closing WebSocket due to incoming error', e)
      socket && socket.close && socket.close()
    })

    // When there is no more data going to be sent, close!
    incoming.on('finish', () => {
      socket && socket.close && socket.close()
    })

    // When an error happens on the outgoing stream, just warn.
    outgoing.on('error', (e) => {
      console.warn('error during WebSocket send, ignoring:', e)
    })

    // When there is no more data going to be written, close!
    outgoing.on('finish', () => {
      socket && socket.close && socket.close()
    })

    /**
     * initialize the component.
     */
    super(incoming, outgoing)
  }
}

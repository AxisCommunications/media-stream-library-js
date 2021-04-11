import { Source } from '../component'
import { Readable, Writable } from 'stream'
import { connect, Socket } from 'net'
import { MessageType } from '../message'

export class TcpSource extends Source {
  /**
   * Create a TCP component.
   * A TCP socket will be created from parsing the URL of the first outgoing message.
   * @param host  Force RTSP host (overrides OPTIONS URL)
   */
  constructor(host?: string) {
    let socket: Socket
    /**
     * Set up an incoming stream and attach it to the socket.
     */
    const incoming = new Readable({
      objectMode: true,
      read: function () {
        //
      },
    })

    /**
     * Set up outgoing stream and attach it to the socket.
     */
    const outgoing = new Writable({
      objectMode: true,
      write: function (msg, encoding, callback) {
        const b = msg.data

        if (!socket) {
          // Create socket on first outgoing message
          /*
          `OPTIONS rtsp://192.168.0.3:554/axis-media/media.amp?resolution=176x144&fps=1 RTSP/1.0
          CSeq: 1
          Date: Wed, 03 Jun 2015 14:26:16 GMT
          `
          */
          let url: string
          if (host === undefined) {
            const firstSpace = b.indexOf(' ')
            const secondSpace = b.indexOf(' ', firstSpace + 1)
            url = b.slice(firstSpace, secondSpace).toString('ascii')
          } else {
            url = `rtsp://${host}`
          }
          const { hostname, port } = new URL(url)
          socket = connect(
            Number(port) || 554,
            hostname === null ? undefined : hostname,
          )
          socket.on('error', (e) => {
            console.error('TCP socket error:', e)
            socket.destroy()
            incoming.push(null)
          })

          socket.on('data', (buffer) => {
            if (!incoming.push({ data: buffer, type: MessageType.RAW })) {
              console.warn(
                'TCP Component internal error: not allowed to push more data',
              )
            }
          })
          // When closing a socket, indicate there is no more data to be sent,
          // but leave the outgoing stream open to check if more requests are coming.
          socket.on('end', () => {
            console.warn('socket ended')
            incoming.push(null)
          })
        }
        try {
          socket.write(msg.data, encoding, callback)
        } catch (e) {
          console.warn('message lost during send:', msg)
        }
      },
    })

    // When an error is sent on the incoming stream, close the socket.
    incoming.on('error', (e) => {
      console.log('closing TCP socket due to incoming error', e)
      socket && socket.end()
    })

    // When there is no more data going to be sent, close!
    incoming.on('finish', () => {
      socket && socket.end()
    })

    // When an error happens on the outgoing stream, just warn.
    outgoing.on('error', (e) => {
      console.warn('error during TCP send, ignoring:', e)
    })

    // When there is no more data going to be written, close!
    outgoing.on('finish', () => {
      socket && socket.end()
    })

    /**
     * initialize the component.
     */
    super(incoming, outgoing)
  }
}

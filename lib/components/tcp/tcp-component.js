const {Readable, Writable} = require('stream')
const {connect} = require('net')
const {parse} = require('url')
const {RAW} = require('../messageTypes')
const Component = require('../component')

class TcpComponent extends Component {
  /**
   * Create a TCP component.
   * A TCP socket will be created from parsing the URL of the first outgoing message.
   */
  constructor () {
    let socket
    /**
     * Set up an incoming stream and attach it to the socket.
     * @type {Readable}
     */
    const incoming = new Readable({
      objectMode: true,
      read () {
        //
      }
    })

    // When an error is sent on the incoming stream, close the socket.
    incoming.on('error', (e) => {
      console.log('closing TCP socket due to incoming error', e)
      socket.end()
    })

    /**
     * Set up outgoing stream and attach it to the socket.
     * @type {Writable}
     */
    const outgoing = new Writable({
      objectMode: true,
      write (msg, encoding, callback) {
        const b = msg.data

        if (!socket) {
          // Create socket on first outgoing message
          /*
          `OPTIONS rtsp://192.168.0.3:554/axis-media/media.amp?resolution=176x144&fps=1 RTSP/1.0
          CSeq: 1
          Date: Wed, 03 Jun 2015 14:26:16 GMT
          `
          */
          const firstSpace = b.indexOf(' ')
          const secondSpace = b.indexOf(' ', firstSpace + 1)
          const url = b.slice(firstSpace, secondSpace).toString('ascii')
          const {hostname, port} = parse(url)
          socket = connect(port || 554, hostname)
          socket.setTimeout(2000, () => {
            console.error(`Timeout when connecting to ${hostname}:${port}`)
            socket.destroy()
            incoming.push(null)
          })

          socket.on('data', (buffer) => {
            if (!incoming.push({data: buffer, type: RAW})) {
              console.warn('TCP Component internal error: not allowed to push more data')
            }
          })
          // When closing a socket, indicate there is no more data to be sent,
          // but leave the outgoing stream open to check if more requests are coming.
          socket.on('finish', (e) => {
            console.warn('socket finished', e)
            incoming.push(null)
          })
        }
        try {
          socket.write(msg.data, encoding, callback)
        } catch (e) {
          console.warn('message lost during send:', msg)
        }
      }
    })

    // When an error happens on the outgoing stream, just warn.
    outgoing.on('error', (e) => {
      console.warn('error during TCP send, ignoring:', e)
    })

    // When there is no more data going to be written, close!
    outgoing.on('finish', () => {
      socket.end()
    })

    /**
    * initialize the component.
    */
    super(incoming, outgoing)
  }
}

module.exports = TcpComponent

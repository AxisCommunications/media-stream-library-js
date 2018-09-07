const { Readable, Writable } = require('stream')
const { RAW } = require('../messageTypes')
const Component = require('../component')

class WSServerComponent extends Component {
  constructor (socket) {
    const outgoing = new Readable({
      objectMode: true,
      read: () => {
      }
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
      }
    })

    socket.on('message', function (data) {
      outgoing.push({ data, type: RAW })
    })
    socket.on('close', function () {
      outgoing.push(null)
    })

    super(incoming, outgoing)
  }
}

module.exports = WSServerComponent

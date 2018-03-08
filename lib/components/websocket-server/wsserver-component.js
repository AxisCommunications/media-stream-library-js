const {Readable, Writable} = require('stream')
const {RAW} = require('../messageTypes')
const Component = require('../component')
const WSServer = require('websocket').server
const http = require('http')
var browserify = require('browserify')

class WebSocketServerComponent extends Component {
  static devServer (port = 8080) {
    const b = browserify()
    b.add('./examples/replay-client.js')
    const httpServer = http.createServer(function (request, response) {
      if (request.url === '/') {
        response.end('<html><head><script async src="index.js"></script></head>' +
        '<body><video autoplay controls style="width:80%"></video></body></html>')
      } else if (request.url === '/index.js') {
        b.bundle().pipe(response)
      } else {
        console.log((new Date()) + ' Received request for ' + request.url)
        response.writeHead(404)
        response.end()
      }
    })
    httpServer.listen(port, function () {
      console.log((new Date()) + ' Server is listening on port 8080')
    })
    return new WebSocketServerComponent({server: httpServer})
  }

  constructor ({server} = {}) {
    let wsConnection
    if (!server) {
      throw new Error('you must supply an HTTP server ')
    }

    const outgoing = new Readable({
      objectMode: true,
      read: () => {
      }
    })

    const incoming = new Writable({
      objectMode: true,
      write: (msg, encoding, callback) => {
        if (msg.type !== RAW) {
          console.warn('WS Server sending data with type', msg.type)
        }
        if (!wsConnection) {
          return false
        }
        wsConnection.sendBytes(msg.data)
        callback()
      }
    })

    const wsServer = new WSServer({
      httpServer: server,
      autoAcceptConnections: true // This is for testing, otherwise this should be false
    })
    wsServer.on('connect', function (connection) {
      incoming.emit('drain')
      wsConnection = connection
      console.log((new Date()) + ' Connection accepted.')
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          throw new Error('Only binary mode is supported')
        } else if (message.type === 'binary') {
          outgoing.push({data: message.binaryData, type: RAW})
        }
      })
      connection.on('close', function (reasonCode, description) {
        console.log('WS connection closed', description, reasonCode)
        incoming.end()
      })
    })

    super(incoming, outgoing)
  }
}

module.exports = WebSocketServerComponent

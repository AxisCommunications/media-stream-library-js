const Pipeline = require('./pipeline')

const TcpClient = require('../components/tcp')
const WSSink = require('../components/ws-server')

const WSServer = require('ws').Server

class TcpWsServerPipeline extends Pipeline {
  /**
   * Create a pipeline which is a linked list of components.
   * Works naturally with only a single component.
   * @param {Array} components The ordered components of the pipeline
   */
  constructor (config = {}) {
    const wss = new WSServer(config)
    console.log(wss)
    wss.on('connection', (socket) => {
      const wsSink = new WSSink(socket)
      const tcpSource = new TcpClient()

      this.setup(tcpSource, wsSink)
    })

    super()
  }
}

module.exports = TcpWsServerPipeline

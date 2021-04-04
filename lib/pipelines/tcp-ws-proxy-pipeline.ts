import { Pipeline } from './pipeline'
import { Server } from 'ws'
import { WSSink } from '../components/ws-sink'
import { TcpSource } from '../components/tcp'

/**
 * TcpWsProxyPipeline
 *
 * A (two-component) pipeline that listens for WebSocket connections and
 * connects them to another server over TCP. This can be used as a WebSocket
 * proxy for an RTSP server.
 */
export class TcpWsProxyPipeline extends Pipeline {
  public wss: Server

  constructor(config = {}) {
    const wss = new Server(config)
    wss.on('connection', (socket) => {
      const wsSink = new WSSink(socket)
      const tcpSource = new TcpSource()

      this.init(tcpSource, wsSink)
    })

    super()

    // Expose WebSocket Server for external use
    this.wss = wss
  }
}

import { ServerOptions, WebSocketServer } from 'ws'

import { TcpSource } from '../components/tcp'
import { WSSink } from '../components/ws-sink'

import { Pipeline } from './pipeline'

interface TcpWsConfig {
  readonly wsOptions?: ServerOptions
  readonly rtspHost?: string
}

/**
 * TcpWsProxyPipeline
 *
 * A (two-component) pipeline that listens for WebSocket connections and
 * connects them to another server over TCP. This can be used as a WebSocket
 * proxy for an RTSP server.
 */
export class TcpWsProxyPipeline extends Pipeline {
  public wss: WebSocketServer

  public constructor(config: TcpWsConfig = {}) {
    const { wsOptions, rtspHost } = config
    const wss = new WebSocketServer(wsOptions)
    wss.on('connection', (socket) => {
      const wsSink = new WSSink(socket)
      const tcpSource = new TcpSource(rtspHost)

      this.init(tcpSource, wsSink)
    })

    super()

    // Expose WebSocket Server for external use
    this.wss = wss
  }
}

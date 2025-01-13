import { logDebug } from './log'

import {
  Message,
  MessageType,
  RtpDepay,
  RtspConfig,
  RtspSession,
  Sdp,
  WSSource,
  XmlMessage,
} from './components'

import { WebSocketConfig, openWebSocket } from './openwebsocket'

export interface WsRtspMetadataConfig {
  ws: WebSocketConfig
  rtsp: RtspConfig
  metadataHandler: (msg: XmlMessage) => void
}

/** Creates a writable stream that consumes XML messages by
 * passing them to the provided handler. */
class XmlSink extends WritableStream<
  XmlMessage | Message<Exclude<MessageType, 'xml'>>
> {
  constructor(metadataHandler: (msg: XmlMessage) => void) {
    super({
      write: (msg, controller) => {
        if (msg.type === 'xml') {
          try {
            metadataHandler(msg)
          } catch (err) {
            controller.error(err)
          }
        }
      },
    })
  }
}

/*
 * MetadataPipeline
 *
 * A pipeline that connects to an RTSP server over a WebSocket connection and
 * can process XML RTP data and calls a handler to process the XML messages.
 *
 * Handlers that can be set on the pipeline:
 * - all handlers inherited from the RtspPipeline
 * - `onServerClose`: called when the WebSocket server closes the connection
 *   (only then, not when the connection is closed in a different way)
 */
export class MetadataPipeline {
  public readonly rtp = new RtpDepay()
  public readonly rtsp: RtspSession
  public readonly xml: XmlSink

  private readonly socket: Promise<WebSocket>

  constructor(config: WsRtspMetadataConfig) {
    const { ws: wsConfig, rtsp: rtspConfig, metadataHandler } = config

    this.rtsp = new RtspSession(rtspConfig)
    this.socket = openWebSocket(wsConfig)
    this.xml = new XmlSink(metadataHandler)
  }

  /** Initiates the stream (starting at optional offset in seconds) and resolves
   * when the media stream has completed. */
  public async start(): Promise<{ sdp: Sdp; range?: [string, string] }> {
    const result = this.rtsp.start()

    const socket = await this.socket
    const wsSource = new WSSource(socket)
    Promise.allSettled([
      wsSource.readable
        .pipeThrough(this.rtsp.demuxer)
        .pipeThrough(this.rtp)
        .pipeTo(this.xml),
      this.rtsp.commands.pipeTo(wsSource.writable),
    ]).then((results) => {
      const [down, up] = results.map((r) =>
        r.status === 'rejected' ? r.reason : 'stream ended'
      )
      logDebug(`metadata pipeline ended: downstream: ${down} upstream: ${up}`)
    })

    return result
  }

  close() {
    this.socket.then((socket) => socket.close)
  }
}

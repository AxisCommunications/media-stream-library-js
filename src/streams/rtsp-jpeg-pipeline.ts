import { logDebug } from './log'

import {
  CanvasSink,
  RtpDepay,
  RtspConfig,
  RtspSession,
  Sdp,
  WSSource,
} from './components'

import { WebSocketConfig, openWebSocket } from './openwebsocket'

export interface RtspJpegConfig {
  ws: WebSocketConfig
  rtsp: RtspConfig
  mediaElement: HTMLCanvasElement
}

/**
 * Html5CanvasPipeline
 *
 * A pipeline that connects to an RTSP server over a WebSocket connection and
 * can process JPEG RTP data to produce an motion JPEG data stream that is sent
 * to a HTML canvas element.
 *
 * Handlers that can be set on the pipeline:
 * - all handlers inherited from the RtspMjpegPipeline
 * - `onSync`: called when the NTP time of the first frame is known, with the
 *   timestamp as argument (the timestamp is UNIX milliseconds)
 * - `onServerClose`: called when the WebSocket server closes the connection
 *   (only then, not when the connection is closed in a different way)
 */
export class RtspJpegPipeline {
  public readonly canvas: CanvasSink
  public readonly rtp = new RtpDepay()
  public readonly rtsp: RtspSession
  /** The real time corresponding to the start of the video media. */
  public readonly videoStartTime: Promise<number>

  private readonly socket: Promise<WebSocket>

  constructor({
    ws: wsConfig,
    rtsp: rtspConfig,
    mediaElement,
  }: RtspJpegConfig) {
    this.canvas = new CanvasSink(mediaElement)
    this.rtsp = new RtspSession(rtspConfig)
    this.socket = openWebSocket(wsConfig)
    this.videoStartTime = new Promise<number>((resolve) => {
      this.canvas.onSync = resolve
    })
  }

  /** Initiates the stream (starting at optional offset in seconds) and resolves
   * when the media stream has completed. */
  public async start(
    offset?: number
  ): Promise<{ sdp: Sdp; range?: [string, string] }> {
    const socket = await this.socket
    const result = this.rtsp.start(offset)

    const wsSource = new WSSource(socket)
    Promise.allSettled([
      wsSource.readable
        .pipeThrough(this.rtsp.demuxer)
        .pipeThrough(this.rtp)
        .pipeTo(this.canvas.writable),
      this.rtsp.commands.pipeTo(wsSource.writable),
    ]).then((results) => {
      const [down, up] = results.map((r) =>
        r.status === 'rejected' ? r.reason : 'stream ended'
      )
      logDebug(`rtsp-jpeg pipeline ended: downstream: ${down} upstream: ${up}`)
    })

    return result
  }

  close() {
    this.socket.then((socket) => socket.close())
  }

  get currentTime() {
    return this.canvas.currentTime
  }

  play() {
    return this.canvas.play()
  }

  pause() {
    return this.canvas.pause()
  }

  get bitrate() {
    return this.canvas.bitrate
  }

  get framerate() {
    return this.canvas.framerate
  }
}

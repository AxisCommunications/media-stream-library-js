import { logDebug } from './log'

import {
  Mp4Muxer,
  MseSink,
  RtpDepay,
  RtspConfig,
  RtspSession,
  Sdp,
  WSSource,
} from './components'
import { setupMp4Capture } from './mp4-capture'
import { WebSocketConfig, openWebSocket } from './openwebsocket'

export interface Html5VideoConfig {
  ws: WebSocketConfig
  rtsp: RtspConfig
  mediaElement: HTMLVideoElement
}

/*
 * Html5VideoPipeline
 *
 * A pipeline that connects to an RTSP server over a WebSocket connection and
 * can process H.264/AAC RTP data to produce an MP4 data stream that is sent to
 * a HTML video element.
 *
 * Handlers that can be set on the pipeline:
 * - all handlers inherited from the RtspMp4Pipeline
 * - `onServerClose`: called when the WebSocket server closes the connection
 *   (only then, not when the connection is closed in a different way)
 */
export class RtspMp4Pipeline {
  public readonly mp4 = new Mp4Muxer()
  public readonly mse: MseSink
  public readonly rtp = new RtpDepay()
  public readonly rtsp: RtspSession
  public readonly videoEl: HTMLVideoElement
  /** The real time corresponding to the start of the video media. */
  public readonly videoStartTime: Promise<number>

  private readonly socket: Promise<WebSocket>

  constructor({
    ws: wsConfig,
    rtsp: rtspConfig,
    mediaElement,
  }: Html5VideoConfig) {
    this.mse = new MseSink(mediaElement)
    this.rtsp = new RtspSession(rtspConfig)
    this.socket = openWebSocket(wsConfig)
    this.videoEl = mediaElement
    this.videoStartTime = new Promise<number>((resolve) => {
      this.mp4.onSync = resolve
    })
  }

  /** Initiates the stream (starting at optional offset in seconds) and resolves
   * when the media stream has completed. */
  public async start(
    offset?: number
  ): Promise<{ sdp: Sdp; range?: [string, string] }> {
    const socket = await this.socket
    socket.addEventListener('close', (e) => {
      console.warn('WebSocket closed with code:', e.code)
    })

    const result = this.rtsp.start(offset)

    const wsSource = new WSSource(socket)
    Promise.allSettled([
      wsSource.readable
        .pipeThrough(this.rtsp.demuxer)
        .pipeThrough(this.rtp)
        .pipeThrough(this.mp4)
        .pipeTo(this.mse.writable),
      this.rtsp.commands.pipeTo(wsSource.writable),
    ]).then((results) => {
      const [down, up] = results.map((r) =>
        r.status === 'rejected' ? r.reason : 'stream ended'
      )
      logDebug(`rtsp-mp4 pipeline ended: downstream: ${down} upstream: ${up}`)
    })

    return result
  }

  close() {
    this.socket.then((socket) => socket.close())
  }

  get currentTime() {
    return this.videoEl.currentTime
  }

  play() {
    return this.videoEl.play()
  }

  pause() {
    return this.videoEl.pause()
  }

  /** Refresh the stream and passes the captured MP4 data to the provided
   * callback. Capture can be ended by calling the returned trigger, or
   * if the buffer reaches max size. */
  async capture(callback: (bytes: Uint8Array) => void) {
    await this.rtsp.teardown()
    const { capture, triggerEnd } = setupMp4Capture(callback)
    this.mse.onMessage = capture
    await this.rtsp.start()
    return triggerEnd
  }
}

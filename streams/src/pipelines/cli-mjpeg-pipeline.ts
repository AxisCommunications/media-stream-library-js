import { Auth, AuthConfig } from '../components/auth'
import { Sink } from '../components/component'
import { MessageType } from '../components/message'
import { RtspConfig } from '../components/rtsp-session'
import { TcpSource } from '../components/tcp'

import { RtspMjpegPipeline } from './rtsp-mjpeg-pipeline'

interface RtspAuthConfig {
  rtsp?: RtspConfig
  auth?: AuthConfig
}

/**
 * CliMjpegPipeline
 *
 * A pipeline which connects to an RTSP server over TCP and can process JPEG
 * over RTP data producing a stream of JPEG images.
 */
export class CliMjpegPipeline extends RtspMjpegPipeline {
  constructor(config: RtspAuthConfig) {
    const { rtsp: rtspConfig, auth: authConfig } = config

    super(rtspConfig)

    const auth = new Auth(authConfig)
    this.insertBefore(this.rtsp, auth)

    const tcpSource = new TcpSource()

    const dataSaver = process.stdout.isTTY
      ? (msg: any) => console.log(msg.type, msg.data)
      : (msg: any) =>
          msg.type === MessageType.JPEG && process.stdout.write(msg.data)
    const videoSink = Sink.fromHandler(dataSaver)

    this.prepend(tcpSource)
    this.append(videoSink)
  }
}

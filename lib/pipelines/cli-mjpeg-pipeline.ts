import { Auth, AuthConfig } from '../components/auth'
import { RtspMjpegPipeline } from './rtsp-mjpeg-pipeline'
import { TcpSource } from '../components/tcp'
import { MessageType } from '../components/message'
import { Sink } from '../components/component'
import { RtspConfig } from '../components/rtsp-session'

interface RtspAuthConfig {
  rtsp?: RtspConfig
  auth?: AuthConfig
}

export class CliMjpegPipeline extends RtspMjpegPipeline {
  /**
   * Create a pipeline which is a linked list of components.
   * Works naturally with only a single component.
   * @param {Array} components The ordered components of the pipeline
   */
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

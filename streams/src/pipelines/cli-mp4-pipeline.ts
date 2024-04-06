import { Auth, AuthConfig } from '../components/auth'
import { Sink } from '../components/component'
import { MessageType } from '../components/message'
import { RtspConfig } from '../components/rtsp-session'
import { TcpSource } from '../components/tcp'

import { RtspMp4Pipeline } from './rtsp-mp4-pipeline'

interface RtspAuthConfig {
  rtsp?: RtspConfig
  auth?: AuthConfig
}

/**
 * CliMp4Pipeline
 *
 * A pipeline which connects to an RTSP server over TCP and process H.264/AAC
 * over RTP to produce a stream of MP4 data.
 */
export class CliMp4Pipeline extends RtspMp4Pipeline {
  constructor(config: RtspAuthConfig) {
    const { rtsp: rtspConfig, auth: authConfig } = config

    super(rtspConfig)

    const auth = new Auth(authConfig)
    this.insertBefore(this.rtsp, auth)

    const tcpSource = new TcpSource()

    const dataSaver = process.stdout.isTTY
      ? (msg: any) => console.log(msg.type, msg.data)
      : (msg: any) =>
          msg.type === MessageType.ISOM && process.stdout.write(msg.data)
    const videoSink = Sink.fromHandler(dataSaver)

    this.prepend(tcpSource)
    this.append(videoSink)
  }
}

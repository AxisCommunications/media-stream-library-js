const RtspMjpegPipeline = require('./rtsp-mjpeg-pipeline')

const {JPEG} = require('../components/messageTypes')

const TcpSource = require('../components/tcp')
const Authorization = require('../components/auth')
const Component = require('../components/component')

class TcpRtspMjpegPipeline extends RtspMjpegPipeline {
  /**
   * Create a pipeline which is a linked list of components.
   * Works naturally with only a single component.
   * @param {Array} components The ordered components of the pipeline
   */
  constructor (config = {}) {
    const {tcp: tcpConfig, rtsp: rtspConfig, auth: authConfig} = config

    super(rtspConfig)

    const auth = new Authorization(authConfig)
    this.insertBefore(this.session, auth)

    const tcpSource = new TcpSource(tcpConfig)

    const dataSaver = process.stdout.isTTY
      ? (msg) => console.log(msg.type, msg.data)
      : (msg) => msg.type === JPEG && process.stdout.write(msg.data)
    const videoSink = Component.sink(dataSaver)

    this.prepend(tcpSource)
    this.append(videoSink)
  }
}

module.exports = TcpRtspMjpegPipeline

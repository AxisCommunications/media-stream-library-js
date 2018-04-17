const RtspPipeline = require('./rtsp-pipeline')

const {JPEG} = require('../components/messageTypes')

const TcpSource = require('../components/tcp')
const Authorization = require('../components/auth')
const JPEGDepay = require('../components/jpegdepay')
const Component = require('../components/component')

class CliRtspPipeline extends RtspPipeline {
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
    const jpegDepay = new JPEGDepay()

    const dataSaver = process.stdout.isTTY
      ? (msg) => console.log(msg.type, msg.data)
      : (msg) => msg.type === JPEG && process.stdout.write(msg.data)
    const videoSink = Component.sink(dataSaver)

    this.prepend(tcpSource)
    this.append(jpegDepay)
    this.append(videoSink)
  }
}

module.exports = CliRtspPipeline

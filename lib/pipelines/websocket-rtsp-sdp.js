const {WebSocket, RtspParser, RtspSession} = require('../components/index.browser')
const Component = require('../components/component')
const {SDP} = require('../components/messageTypes')

class WebsocketRtspSdp {
  /**
   * Generate a websocket-rtsp-sdp pipeline
   * @param  {Object} [config={}] A configuration object for components.
   * @param  {Object} [config.ws] Websocket component configuration object.
   * @param  {Object} [config.rtsp] Rtsp component configuration object.
   * @return {undefined}
   */
  constructor (config = {}) {
    const {ws: wsConfig, rtsp: rtspConfig} = config

    let resolver
    const ended = new Promise((resolve) => {
      resolver = resolve
    })

    const filter = (msg) => {
      if (msg.type === SDP) {
        resolver(msg.sdp)
      }
    }

    const waitForWs = WebSocket.open(wsConfig)

    const rtspParser = new RtspParser()
    const rtspSession = new RtspSession(rtspConfig)
    const sink = Component.sink(filter)

    this.ready = waitForWs.then((webSocket) => {
      webSocket
        .connect(rtspParser)
        .connect(rtspSession)
        .connect(sink)

      rtspSession.send({ method: 'DESCRIBE' })
      rtspSession.send({ method: 'TEARDOWN' })

      return {
        webSocket,
        rtspParser,
        rtspSession,
        sink
      }
    })

    this.ended = ended
  }

  close () {
    this.ready.then(({webSocket}) => {
      // Force close the entire pipeline, this ends all.
      //
      // Used for now to easily replace the whole pipeline
      // and make a new pipeline, but ideally this should not
      // be needed and instead a pipeline should be reused for
      // different RTSP streams.
      webSocket.outgoing.end()
    })
  }
}

module.exports = WebsocketRtspSdp

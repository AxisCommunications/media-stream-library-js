const Component = require('../components/component')
const Config = require('../utils/config')

const {
  WebSocket,
  RtspParser,
  RtspSession,
  BasicDepay,
  XmlParser
} = require('../components/index.browser')

const {XML} = require('../components/messageTypes')

const XML_PAYLOAD_TYPE = 98

// Default configuration for XML event stream
const DEFAULT_RTSP_PARAMETERS = {
  parameters: ['audio=0', 'video=0', 'event=on', 'ptz=all']
}

// DEPRECATED
class WebsocketRtspXml {
  /**
   * Set up a new websocket-rtsp-xml pipeline.
   * @param  {Function} xmlHandler  Called for each xml document in the stream
   * @param  {Object} [config={}] General configuration
   * @param  {Object} [config.ws] Websocket configuration
   * @param  {Object} [config.rtsp] RTSP configuration
   * @return {undefined}
   */
  constructor (xmlHandler, config = {}) {
    console.warn('deprecated pipeline, may disappear next release')
    const wsConfig = config.ws
    const rtspConfig = Config.merge(DEFAULT_RTSP_PARAMETERS, config.rtsp)

    // Do not proceed unless we have a handler
    if (typeof xmlHandler !== 'function') {
      throw new Error('pipeline needs an XML handler!')
    }

    // Make a function that filters out XML type messages and calls our handler
    const xmlFilter = (msg) => {
      if (msg.type === XML) {
        // Guard agains exceptions coming from the handler,
        // so that they do not crash the stream.
        try {
          xmlHandler(msg.doc)
        } catch (e) {
          console.error(e)
        }
      }
    }

    const waitForWs = WebSocket.open(wsConfig)

    const rtspParser = new RtspParser()
    const rtspSession = new RtspSession(rtspConfig)
    const xmlDepay = new BasicDepay(XML_PAYLOAD_TYPE)
    const xmlParser = new XmlParser()
    const xmlSink = Component.sink(xmlFilter)

    this.ready = waitForWs.then((webSocket) => {
      webSocket
        .connect(rtspParser)
        .connect(rtspSession)
        .connect(xmlDepay)
        .connect(xmlParser)
        .connect(xmlSink)

      return {
        webSocket,
        rtspParser,
        rtspSession,
        xmlDepay,
        xmlParser
      }
    })

    // Expose RTSP session as a controller
    this.rtspSession = rtspSession
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

module.exports = WebsocketRtspXml

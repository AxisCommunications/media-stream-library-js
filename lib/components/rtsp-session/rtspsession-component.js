const { RTSP, SDP, RTCP, RTP } = require('../messageTypes')
const { Rtsp, Rtcp, Rtp, Ntp } = require('../../utils/protocols')
const { Transform } = require('stream')
const debug = require('debug')
const Config = require('../../utils/config')

const Component = require('../component')

function isAbsolute (url) {
  return /^[^:]+:\/\//.test(url)
}

const IDLE = 'idle'
const PLAYING = 'playing'
const PAUSED = 'paused'

const RTSP_OPTIONS = 'OPTIONS'
const RTSP_DESCRIBE = 'DESCRIBE'
const RTSP_SETUP = 'SETUP'
const RTSP_PLAY = 'PLAY'
const RTSP_PAUSE = 'PAUSE'
const RTSP_TEARDOWN = 'TEARDOWN'

// Default RTSP configuration
const defaultConfig = (
  hostname = typeof window === 'undefined' ? '' : window.location.hostname,
  parameters = []
) => {
  const uri = parameters.length > 0
    ? `rtsp://${hostname}/axis-media/media.amp?${parameters.join('&')}`
    : `rtsp://${hostname}/axis-media/media.amp`

  return { uri }
}

/**
 * A component that sets up a command queue in order to interact with the RTSP
 * server. Allows control over the RTSP session by listening to incoming messages
 * and sending request on the outgoing stream.
 *
 * The following handlers can be set on the component:
 *  - onSdp: will be called when an SDP object is sent with the object as argument
 *  - onPlay: will be called when an RTSP PLAY response is sent with the media range
 *            as argument. The latter is an array [start, stop], where start is "now"
 *            (for live) or a time in seconds, and stop is undefined (for live or
 *            ongoing streams) or a time in seconds.
 * @extends {Component}
 */
class RtspSessionComponent extends Component {
  /**
   * Create a new RTSP session controller component.
   * @param  {Object} [config={}] Details about the session.
   * @param  {String} [config.hostname] The RTSP server hostname
   * @param  {String[]} [config.parameters] The RTSP URI parameters
   * @param  {String} [config.uri] The full RTSP URI (overrides any hostname/parameters)
   * @param  {Object} [config.defaultHeaders] Default headers to use (for all methods).
   * @param  {Object} [config.headers] Headers to use (mapped to each method).
   * @return {undefined}
   */
  constructor (config = {}) {
    const {
      uri,
      headers,
      defaultHeaders
    } = Config.merge(defaultConfig(config.hostname, config.parameters), config)

    const incoming = new Transform({
      objectMode: true,
      transform: (msg, encoding, callback) => {
        if (msg.type === RTSP) {
          this._onRtsp(msg)
          callback() // Consumes the RTSP packages
        } else if (msg.type === RTCP) {
          this._onRtcp(msg)
          callback(null, msg)
        } else if (msg.type === RTP) {
          this._onRtp(msg)
          callback(null, msg)
        } else if (msg.type === SDP) {
          this._onSdp(msg)
          // Execute externally registered SDP handler
          this.onSdp && this.onSdp(msg.sdp)
          // Pass SDP forward
          callback(null, msg)
        } else {
          // Not a message we should handle
          callback(null, msg)
        }
      }
    })

    incoming.on('end', () => {
      // Incoming was ended, assume that outgoing is closed as well
      this._outgoingClosed = true
    })

    super(incoming)

    this._outgoingClosed = false

    this._reset()
    this.update(uri, headers, defaultHeaders)
  }

  /**
   * Update the cached RTSP uri and headers.
   * @param  {String} uri                 The RTSP URI.
   * @param  {Object} headers             Maps commands to headers.
   * @param  {Object} [defaultHeaders={}] Default headers.
   * @return {[type]}                     [description]
   */
  update (uri, headers, defaultHeaders = {}) {
    if (uri === undefined) {
      throw new Error('You must supply an uri when creating a RtspSessionComponent')
    }
    this.uri = uri
    this.defaultHeaders = defaultHeaders
    this.headers = Object.assign({
      [RTSP_OPTIONS]: {},
      [RTSP_PLAY]: {},
      [RTSP_SETUP]: { 'Blocksize': '64000' },
      [RTSP_DESCRIBE]: { 'Accept': 'application/sdp' },
      [RTSP_PAUSE]: {}
    }, headers)
  }

  /**
   * Restore the initial values to the state they were in before any RTSP
   * connection was made.
   */
  _reset () {
    this._sequence = 1
    this._retry = () => console.error('No request sent, can\'t retry')
    this._callStack = []
    this._callHistory = []
    this._state = IDLE
    this._waiting = false

    this._contentBase = null
    this._sessionId = null
  }

  /**
   * Handles incoming RTSP messages and send the next command in the queue.
   * @param  {Object} msg An incoming RTSP message.
   * @return {undefined}
   */
  _onRtsp (msg) {
    this._waiting = false

    const statusCode = Rtsp.statusCode(msg.data)
    const ended = Rtsp.connectionEnded(msg.data)
    const sequence = Rtsp.sequence(msg.data)
    const method = this._callHistory[sequence - 1]

    debug('msl:rtsp:incoming')(`${msg.data}`)
    if (!this._sessionId && !ended) {
      // Response on first SETUP
      this._sessionId = Rtsp.sessionId(msg.data)
    }
    if (!this._contentBase) {
      this._contentBase = Rtsp.contentBase(msg.data)
    }
    if (statusCode >= 400) {
      // TODO: Retry in certain cases?
      this.onError && this.onError(new Error(msg.data.toString('ascii')))
    }

    if (method === RTSP_PLAY) {
      // When starting to play, send the actual range to an external handler.
      this.onPlay && this.onPlay(Rtsp.range(msg.data))
    }

    if (ended) {
      debug('msl:rtsp:incoming')(
        `RTSP Session ${this._sessionId} ended with statusCode: ${statusCode}`
      )
      this._sessionId = null
    }

    this._dequeue()
  }

  _onRtcp (msg) {
    if (Rtcp.packetType(msg.data) === Rtcp.SR.packetType) {
      const rtpChannel = msg.channel - 1
      this.t0[rtpChannel] = Rtcp.SR.rtpTimestamp(msg.data)
      this.n0[rtpChannel] = Ntp.getTime(Rtcp.SR.ntpMost(msg.data), Rtcp.SR.ntpLeast(msg.data))
    }
  }

  _onRtp (msg) {
    const rtpChannel = msg.channel
    const t0 = this.t0[rtpChannel]
    const n0 = this.n0[rtpChannel]
    if (typeof t0 !== 'undefined' && typeof n0 !== 'undefined') {
      const clockrate = this.clockrates[rtpChannel]
      const t = Rtp.timestamp(msg.data)
      // The RTP timestamps are unsigned 32 bit and will overflow
      // at some point. We can guard against the overflow by ORing with 0,
      // which will bring any difference back into signed 32-bit domain.
      const dt = (t - t0) | 0
      msg.ntpTimestamp = (dt / clockrate) * 1000 + n0
    }
  }

  /**
   * Handles incoming SDP messages, reply with SETUP and optionally PLAY.
   * @param  {Object} msg An incoming SDP message.
   * @return {undefined}
   */
  _onSdp (msg) {
    this.n0 = {}
    this.t0 = {}
    this.clockrates = {}
    msg.sdp.media.forEach((media, index) => {
      if (!media.rtpmap)
        return

      let uri = media.control
      const { clockrate } = media.rtpmap

      const rtp = index * 2
      const rtcp = rtp + 1

      if (!isAbsolute(uri)) {
        uri = this._contentBase + uri
      }

      this._enqueue({
        method: RTSP_SETUP,
        uri,
        headers: {
          Transport: 'RTP/AVP/TCP;unicast;interleaved=' + rtp + '-' + rtcp
        }
      })

      this.clockrates[rtp] = clockrate
    })
    if (this._state === PLAYING) {
      this._enqueue({
        method: RTSP_PLAY,
        headers: {
          Range: `npt=${this.startTime || 0}-`
        }
      })
    }
    this._dequeue()
  }

  /**
   * Set up command queue in order to start playing, i.e. PLAY optionally
   * preceeded by OPTIONS/DESCRIBE commands. If not waiting, immediately
   * start sending.
   * @param  {Number} startTime Time (seconds) at which to start playing
   * @return {undefined}
   */
  play (startTime = 0) {
    if (this._state === IDLE) {
      this.startTime = Number(startTime) || 0
      this._enqueue({ method: RTSP_OPTIONS }, { method: RTSP_DESCRIBE })
    } else if (this._state === PAUSED) {
      this._enqueue({
        method: RTSP_PLAY,
        headers: {
          Session: this._sessionId
        }
      })
    }
    this._state = PLAYING
    this._dequeue()
  }

  /**
   * Queue a pause command, and send if not waiting.
   * @return {undefined}
   */
  pause () {
    this._enqueue({ method: RTSP_PAUSE })
    this._state = PAUSED
    this._dequeue()
  }

  /**
   * End the session if there is one, otherwise just cancel
   * any outstanding calls on the stack.
   * @return {undefined}
   */
  stop () {
    if (this._sessionId) {
      this._enqueue({ method: RTSP_TEARDOWN })
    } else {
      this._callStack = []
    }
    this._state = IDLE
    this._dequeue()
  }

  /**
   * Pushes an RTSP request onto the outgoing stream.
   * @param  {Object} options The details about the command to send.
   * @return {undefined}
   */
  send (options) {
    if (!options.method) {
      throw new Error('missing method when send request')
    }
    this._waiting = true
    this._retry = this.send.bind(this, options)
    const message = Object.assign({
      type: RTSP,
      uri: this.uri,
      data: Buffer.alloc(0) // data is a mandatory field. Not used by session -> parser messages.
    }, options,
    {
      headers: Object.assign(
        { CSeq: this._sequence++ },
        this.defaultHeaders, // default headers (for all methods)
        this.headers[options.method], // preset headers for this method
        options.headers // headers that came with the invokation
      )
    })
    this._sessionId && (message.headers.Session = this._sessionId)
    this._callHistory.push(options.method)
    if (!this._outgoingClosed) {
      this.outgoing.push(message)
    } else {
      // If the socket is closed, dont attempt to send any data
      debug('msl:rtsp:outgoing')(`Unable to send ${options.method}, connection closed`)
    }
  }

  /**
   * Push one or more commands onto the call stack.
   * @param  {...Object} commands One or more commands.
   * @return {undefined}
   */
  _enqueue (...commands) {
    this._callStack.push(...commands)
  }

  /**
   * If possible, send the next command on the call stack.
   * @return {undefined}
   */
  _dequeue () {
    if (!this._waiting && this._callStack.length > 0) {
      this.send(this._callStack.shift())
    }
  }
}

module.exports = RtspSessionComponent

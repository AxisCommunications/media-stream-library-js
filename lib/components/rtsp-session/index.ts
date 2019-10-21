import debug from 'debug'
import { Tube } from '../component'
import { merge } from '../../utils/config'
import {
  Message,
  MessageType,
  RtspMessage,
  RtcpMessage,
  RtpMessage,
  SdpMessage,
} from '../message'
import { Transform } from 'stream'
import { Sdp } from '../../utils/protocols/sdp'
import {
  statusCode,
  connectionEnded,
  sequence,
  sessionId,
  contentBase,
  range,
  sessionTimeout,
} from '../../utils/protocols/rtsp'
import { packetType, SR } from '../../utils/protocols/rtcp'
import { getTime } from '../../utils/protocols/ntp'
import { timestamp } from '../../utils/protocols/rtp'

function isAbsolute(url: string) {
  return /^[^:]+:\/\//.test(url)
}

enum STATE {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
}

export enum RTSP_METHOD {
  OPTIONS = 'OPTIONS',
  DESCRIBE = 'DESCRIBE',
  SETUP = 'SETUP',
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  TEARDOWN = 'TEARDOWN',
}

const MIN_SESSION_TIMEOUT = 5 // minimum timeout for a rtsp session in seconds

interface Headers {
  [key: string]: string
}

interface Command {
  method: RTSP_METHOD
  headers?: Headers
  uri?: string
}

interface MethodHeaders {
  [key: string]: Headers
}

export interface RtspConfig {
  hostname?: string
  parameters?: string[]
  uri?: string
  headers?: MethodHeaders
  defaultHeaders?: Headers
}

// Default RTSP configuration
const defaultConfig = (
  hostname: string = typeof window === 'undefined'
    ? ''
    : window.location.hostname,
  parameters: string[] = [],
): RtspConfig => {
  const uri =
    parameters.length > 0
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
export class RtspSession extends Tube {
  public uri?: string
  public headers?: MethodHeaders
  public defaultHeaders?: Headers
  public t0?: { [key: number]: number }
  public n0?: { [key: number]: number }
  public clockrates?: { [key: number]: number }
  public startTime?: number

  public onSdp?: (sdp: Sdp) => void
  public onError?: (err: Error) => void
  public onPlay?: (range?: string[]) => void

  private _outgoingClosed: boolean
  private _sequence?: number
  private _retry?: () => void
  private _callStack?: Command[]
  private _callHistory?: any[]
  private _state?: STATE
  private _waiting?: boolean
  private _contentBase?: string | null
  private _sessionId?: string | null
  private _renewSessionInterval?: number | null

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
  constructor(config: RtspConfig = {}) {
    const { uri, headers, defaultHeaders } = merge(
      defaultConfig(config.hostname, config.parameters),
      config,
    )

    const incoming = new Transform({
      objectMode: true,
      transform: (msg: Message, encoding, callback) => {
        if (msg.type === MessageType.RTSP) {
          this._onRtsp(msg)
          callback() // Consumes the RTSP packages
        } else if (msg.type === MessageType.RTCP) {
          this._onRtcp(msg)
          callback(undefined, msg)
        } else if (msg.type === MessageType.RTP) {
          this._onRtp(msg)
          callback(undefined, msg)
        } else if (msg.type === MessageType.SDP) {
          this._onSdp(msg)
          // Execute externally registered SDP handler
          this.onSdp && this.onSdp(msg.sdp)
          // Pass SDP forward
          callback(undefined, msg)
        } else {
          // Not a message we should handle
          callback(undefined, msg)
        }
      },
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
  update(
    uri: string | undefined,
    headers: MethodHeaders = {},
    defaultHeaders: Headers = {},
  ) {
    if (uri === undefined) {
      throw new Error(
        'You must supply an uri when creating a RtspSessionComponent',
      )
    }
    this.uri = uri
    this.defaultHeaders = defaultHeaders
    this.headers = Object.assign(
      {
        [RTSP_METHOD.OPTIONS]: {},
        [RTSP_METHOD.PLAY]: {},
        [RTSP_METHOD.SETUP]: { Blocksize: '64000' },
        [RTSP_METHOD.DESCRIBE]: { Accept: 'application/sdp' },
        [RTSP_METHOD.PAUSE]: {},
      },
      headers,
    )
  }

  /**
   * Restore the initial values to the state they were in before any RTSP
   * connection was made.
   */
  _reset() {
    this._sequence = 1
    this._retry = () => console.error("No request sent, can't retry")
    this._callStack = []
    this._callHistory = []
    this._state = STATE.IDLE
    this._waiting = false

    this._contentBase = null
    this._sessionId = null
    if (this._renewSessionInterval !== null) {
      clearInterval(this._renewSessionInterval)
    }
    this._renewSessionInterval = null

    this.t0 = undefined
    this.n0 = undefined
    this.clockrates = undefined
  }

  /**
   * Handles incoming RTSP messages and send the next command in the queue.
   * @param  {Object} msg An incoming RTSP message.
   * @return {undefined}
   */
  _onRtsp(msg: RtspMessage) {
    this._waiting = false

    const status = statusCode(msg.data)
    const ended = connectionEnded(msg.data)
    const seq = sequence(msg.data)
    if (seq === null) {
      throw new Error('rtsp: expected sequence number')
    }
    if (this._callHistory === undefined) {
      throw new Error('rtsp: internal error')
    }
    const method = this._callHistory[seq - 1]

    debug('msl:rtsp:incoming')(`${msg.data}`)
    if (!this._sessionId && !ended) {
      // Response on first SETUP
      this._sessionId = sessionId(msg.data)
      const _sessionTimeout = sessionTimeout(msg.data)
      if (_sessionTimeout !== null) {
        // The server specified that sessions will timeout if not renewed.
        // In order to keep it alive we need periodically send a RTSP_OPTIONS message
        if (this._renewSessionInterval !== null) {
          clearInterval(this._renewSessionInterval)
        }
        this._renewSessionInterval = (setInterval(() => {
          this._enqueue({ method: RTSP_METHOD.OPTIONS })
          this._dequeue()
        }, Math.max(MIN_SESSION_TIMEOUT, _sessionTimeout - 5) * 1000) as unknown) as number
      }
    }

    if (!this._contentBase) {
      this._contentBase = contentBase(msg.data)
    }
    if (status >= 400) {
      // TODO: Retry in certain cases?
      this.onError && this.onError(new Error(msg.data.toString('ascii')))
    }

    if (method === RTSP_METHOD.PLAY) {
      // When starting to play, send the actual range to an external handler.
      this.onPlay && this.onPlay(range(msg.data))
    }

    if (ended) {
      debug('msl:rtsp:incoming')(
        `RTSP Session ${this._sessionId} ended with statusCode: ${status}`,
      )
      this._sessionId = null
    }

    this._dequeue()
  }

  _onRtcp(msg: RtcpMessage) {
    if (this.t0 === undefined || this.n0 === undefined) {
      throw new Error('rtsp: internal error')
    }
    if (packetType(msg.data) === SR.packetType) {
      const rtpChannel = msg.channel - 1
      this.t0[rtpChannel] = SR.rtpTimestamp(msg.data)
      this.n0[rtpChannel] = getTime(SR.ntpMost(msg.data), SR.ntpLeast(msg.data))
    }
  }

  _onRtp(msg: RtpMessage) {
    if (
      this.t0 === undefined ||
      this.n0 === undefined ||
      this.clockrates === undefined
    ) {
      throw new Error('rtsp: internal error')
    }
    const rtpChannel = msg.channel
    const t0 = this.t0[rtpChannel]
    const n0 = this.n0[rtpChannel]
    if (typeof t0 !== 'undefined' && typeof n0 !== 'undefined') {
      const clockrate = this.clockrates[rtpChannel]
      const t = timestamp(msg.data)
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
  _onSdp(msg: SdpMessage) {
    this.n0 = {}
    this.t0 = {}
    this.clockrates = {}
    msg.sdp.media.forEach((media, index) => {
      let uri = media.control
      // We should actually be able to handle
      // non-dynamic payload types, but ignored for now.
      if (media.rtpmap === undefined) {
        return
      }
      const { clockrate } = media.rtpmap

      const rtp = index * 2
      const rtcp = rtp + 1

      // TODO: investigate if we can make sure this is defined
      if (uri === undefined) {
        return
      }
      if (!isAbsolute(uri)) {
        uri = this._contentBase + uri
      }

      this._enqueue({
        method: RTSP_METHOD.SETUP,
        headers: {
          Transport: 'RTP/AVP/TCP;unicast;interleaved=' + rtp + '-' + rtcp,
        },
        uri,
      })

      // TODO: see if we can get rid of this check somehow
      if (this.clockrates === undefined) {
        return
      }
      this.clockrates[rtp] = clockrate
    })
    if (this._state === STATE.PLAYING) {
      this._enqueue({
        method: RTSP_METHOD.PLAY,
        headers: {
          Range: `npt=${this.startTime || 0}-`,
        },
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
  play(startTime = 0) {
    if (this._state === STATE.IDLE) {
      this.startTime = Number(startTime) || 0
      this._enqueue({ method: RTSP_METHOD.OPTIONS })
      this._enqueue({ method: RTSP_METHOD.DESCRIBE })
    } else if (this._state === STATE.PAUSED) {
      if (this._sessionId === null || this._sessionId === undefined) {
        throw new Error('rtsp: internal error')
      }
      this._enqueue({
        method: RTSP_METHOD.PLAY,
        headers: {
          Session: this._sessionId,
        },
      })
    }
    this._state = STATE.PLAYING
    this._dequeue()
  }

  /**
   * Queue a pause command, and send if not waiting.
   * @return {undefined}
   */
  pause() {
    this._enqueue({ method: RTSP_METHOD.PAUSE })
    this._state = STATE.PAUSED
    this._dequeue()
  }

  /**
   * End the session if there is one, otherwise just cancel
   * any outstanding calls on the stack.
   * @return {undefined}
   */
  stop() {
    if (this._sessionId) {
      this._enqueue({ method: RTSP_METHOD.TEARDOWN })
    } else {
      this._callStack = []
    }
    this._state = STATE.IDLE
    if (this._renewSessionInterval !== null) {
      clearInterval(this._renewSessionInterval)
      this._renewSessionInterval = null
    }
    this._dequeue()
  }

  /**
   * Pushes an RTSP request onto the outgoing stream.
   * @param  {Object} options The details about the command to send.
   * @return {undefined}
   */
  send(cmd: Command) {
    const { method, headers, uri } = cmd
    if (method === undefined) {
      throw new Error('missing method when send request')
    }
    this._waiting = true
    this._retry = this.send.bind(this, cmd)

    if (
      this._sequence === undefined ||
      this.headers === undefined ||
      this._callHistory === undefined
    ) {
      throw new Error('rtsp: internal error')
    }
    const message = Object.assign(
      {
        type: MessageType.RTSP,
        uri: uri || this.uri,
        data: Buffer.alloc(0), // data is a mandatory field. Not used by session -> parser messages.
      },
      { method, headers },
      {
        headers: Object.assign(
          { CSeq: this._sequence++ },
          this.defaultHeaders, // default headers (for all methods)
          this.headers[method], // preset headers for this method
          headers, // headers that came with the invokation
        ),
      },
    )
    this._sessionId && (message.headers.Session = this._sessionId)
    this._callHistory.push(method)
    if (!this._outgoingClosed) {
      this.outgoing.push(message)
    } else {
      // If the socket is closed, dont attempt to send any data
      debug('msl:rtsp:outgoing')(`Unable to send ${method}, connection closed`)
    }
  }

  /**
   * Push one or more commands onto the call stack.
   * @param  {...Object} commands One or more commands.
   * @return {undefined}
   */
  _enqueue(cmd: Command) {
    if (this._callStack === undefined) {
      throw new Error('rtsp: internal error')
    }
    this._callStack.push(cmd)
  }

  /**
   * If possible, send the next command on the call stack.
   * @return {undefined}
   */
  _dequeue() {
    if (this._callStack === undefined) {
      throw new Error('rtsp: internal error')
    }
    if (!this._waiting && this._callStack.length > 0) {
      const cmd = this._callStack.shift()
      if (cmd !== undefined) {
        this.send(cmd)
      }
    }
  }
}

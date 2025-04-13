import { logDebug, logError, logWarn } from '../../log'

import { decode } from '../utils/bytes'

import {
  Rtcp,
  RtcpMessage,
  RtpMessage,
  RtspRequestHeaders,
  RtspRequestMessage,
  RtspRequestMethod,
  RtspResponseMessage,
  Sdp,
  SdpMessage,
  isRtcpBye,
  isRtcpSR,
} from '../types'

import { Auth } from './auth'
import { parseRange, parseSession } from './header'
import { getMillis } from './ntp'
import { RtspParser } from './parser'
import { parseSdp } from './sdp'
import { serialize } from './serializer'

function isAbsolute(url: string) {
  return /^[^:]+:\/\//.test(url)
}

const DEFAULT_SESSION_TIMEOUT = 60 // default timeout in seconds
const MIN_SESSION_TIMEOUT = 5 // minimum timeout in seconds

type MethodHeaders = Record<RtspRequestMethod, RtspRequestHeaders>
export interface RtspConfig {
  uri: string
  headers?: Partial<MethodHeaders>
  customHeaders?: RtspRequestHeaders
}

function defaultHeaders(commonHeaders: RtspRequestHeaders = {}): MethodHeaders {
  return {
    OPTIONS: commonHeaders,
    PLAY: commonHeaders,
    SETUP: { ...commonHeaders, Blocksize: '64000' },
    DESCRIBE: { ...commonHeaders, Accept: 'application/sdp' },
    PAUSE: commonHeaders,
    TEARDOWN: commonHeaders,
  } as const
}

type RtspState = 'idle' | 'playing' | 'paused'

/**
 * A component that sets up a command queue in order to interact with the RTSP
 * server. Allows control over the RTSP session by listening to incoming messages
 * and sending request on the outgoing stream.
 */
export class RtspSession {
  public auth?: Auth
  public readonly commands: ReadableStream<Uint8Array>
  public readonly demuxer: TransformStream<
    Uint8Array,
    RtpMessage | RtcpMessage | SdpMessage
  >
  public onRtcp?: (rtcp: Rtcp) => void
  public retry = { max: 20, codes: [503] }

  private clockrates?: { [key: number]: number }
  private cseq: number = 0
  private emitSdp?: (sdp: SdpMessage) => void
  private headers: MethodHeaders
  private keepaliveInterval?: ReturnType<typeof setInterval>
  private n0?: { [key: number]: number }
  private recvResponse?: (rsp: RtspResponseMessage) => void
  private sendRequest?: (req: RtspRequestMessage) => void
  private sessionControlUrl: string
  private sessionId?: string
  private state?: RtspState
  private t0?: { [key: number]: number }
  private defaultUri: string

  /** Create a new RTSP session controller component. */
  public constructor({
    uri,
    headers,
    customHeaders: commonHeaders = {},
  }: RtspConfig) {
    this.headers = {
      ...defaultHeaders(commonHeaders),
      ...headers,
    }
    this.sessionControlUrl = uri
    this.state = 'idle'
    this.defaultUri = uri

    const parser = new RtspParser()
    this.demuxer = new TransformStream({
      start: (controller) => {
        this.emitSdp = (sdp: SdpMessage) => {
          controller.enqueue(sdp)
        }
      },
      transform: (chunk, controller) => {
        const messages = parser.parse(chunk)
        for (const message of messages) {
          switch (message.type) {
            case 'rtsp_rsp': {
              if (!this.recvResponse) {
                logWarn('ignored server-command: ', message)
                break
              }
              this.recvResponse(message)
              break
            }
            case 'rtcp': {
              this.recordNtpInfo(message)
              // FIXME it should be the responsibility of the user to call a `.close()` method
              // on the instance to cleanup resources (this would also solve other problems
              // related to not clearing the interval).
              if (isRtcpBye(message.rtcp)) {
                this.clearKeepalive()
              }
              this.onRtcp && this.onRtcp(message.rtcp)
              controller.enqueue(message)
              break
            }
            case 'rtp': {
              this.addNtpTimestamp(message)
              controller.enqueue(message)
              break
            }
          }
        }
      },
    })

    this.commands = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.sendRequest = (msg: RtspRequestMessage) =>
          controller.enqueue(serialize(msg))
      },
    })
  }

  /** Send an OPTIONS request, used mainly for keepalive purposes. */
  public async options(): Promise<void> {
    const rsp = await this.fetch(
      new RtspRequestMessage({
        method: 'OPTIONS',
        uri: this.sessionControlUrl,
        headers: { ...this.headers.OPTIONS },
      })
    )

    if (rsp.statusCode !== 200) {
      throw new Error(`response not OK: ${rsp.statusCode}`)
    }
  }

  /** Send a DESCRIBE request to get a presentation description of available media . */
  public async describe(uri: string = this.defaultUri): Promise<Sdp> {
    const rsp = await this.fetch(
      new RtspRequestMessage({
        method: 'DESCRIBE',
        uri,
        headers: { ...this.headers.DESCRIBE },
      })
    )

    if (rsp.statusCode !== 200) {
      throw new Error(`response not OK: ${rsp.statusCode}`)
    }

    this.sessionControlUrl =
      rsp.headers.get('Content-Base') ??
      rsp.headers.get('Content-Location') ??
      uri

    if (
      rsp.headers.get('Content-Type') !== 'application/sdp' ||
      rsp.body === undefined
    ) {
      throw new Error('expected SDP in describe response body')
    }

    const sdp = parseSdp(decode(rsp.body))

    this.emitSdp?.(new SdpMessage(sdp))

    return sdp
  }

  /** Sends one SETUP request per media in the presentation description. The
   * server MUST return a session ID in the first reply to a succesful SETUP
   * request. The ID is stored and a keepalive is initiated to make sure the
   * session persists. */
  public async setup(sdp: Sdp) {
    this.n0 = {}
    this.t0 = {}
    this.clockrates = {}

    this.sessionControlUrl = this.controlUrl(sdp.session.control)

    for (const [i, media] of sdp.media.entries()) {
      if (media.rtpmap === undefined) {
        // We should actually be able to handle non-dynamic payload types, but ignored for now.
        logWarn('skipping media description without rtpmap', media)
        return
      }

      const rtp = 2 * i
      const rtcp = 2 * i + 1
      const { clockrate } = media.rtpmap
      this.clockrates[rtp] = clockrate

      const uri = this.controlUrl(media.control ?? sdp.session.control)

      const rsp = await this.fetch(
        new RtspRequestMessage({
          method: 'SETUP',
          uri,
          headers: {
            ...this.headers.SETUP,
            Transport: `RTP/AVP/TCP;unicast;interleaved=${rtp}-${rtcp}`,
          },
        })
      )

      if (rsp.statusCode !== 200) {
        throw new Error(`response not OK: ${rsp.statusCode}`)
      }

      if (this.sessionId) {
        continue
      }

      const session = rsp.headers.get('Session')
      if (!session) {
        throw new Error('expected session ID in first SETUP response')
      }

      const { id, timeout } = parseSession(session)
      this.sessionId = id

      const sessionTimeout = timeout ?? DEFAULT_SESSION_TIMEOUT

      this.setKeepalive(sessionTimeout)
    }
  }

  /** Sends a PLAY request which will cause all media streams to be played.
   * A range can be specified. If no range is specified, the stream is played
   * from the beginning and plays to the end, or, if the stream is paused,
   * it is resumed at the point it was paused. Returns the actual range being
   * played (this can be relevant e.g. when playing recordings that do not start
   * exactly at the requested start) */
  public async play(startTime?: number): Promise<[string, string] | undefined> {
    const rsp = await this.fetch(
      new RtspRequestMessage({
        method: 'PLAY',
        uri: this.sessionControlUrl,
        headers: {
          ...this.headers.PLAY,
          ...(startTime !== undefined
            ? { Range: `npt=${Number(startTime) || 0}-` }
            : undefined),
        },
      })
    )

    if (rsp.statusCode !== 200) {
      throw new Error(`response not OK: ${rsp.statusCode}`)
    }

    this.state = 'playing'

    const range = rsp.headers.get('Range')
    if (range) {
      return parseRange(range)
    } else {
      return undefined
    }
  }

  /** Sends a PAUSE request. */
  public async pause() {
    if (this.state === 'paused') {
      return
    }

    const rsp = await this.fetch(
      new RtspRequestMessage({
        method: 'PAUSE',
        uri: this.sessionControlUrl,
        headers: { ...this.headers.PAUSE },
      })
    )

    if (rsp.statusCode !== 200) {
      throw new Error(`response not OK: ${rsp.statusCode}`)
    }

    this.state = 'paused'
  }

  /** Sends a TEARDOWN request. */
  public async teardown() {
    this.clearKeepalive()

    if (!this.sessionId) {
      logWarn('trying to teardown a non-existing session')
      return
    }

    const rsp = await this.fetch(
      new RtspRequestMessage({
        method: 'TEARDOWN',
        uri: this.sessionControlUrl,
        headers: { ...this.headers.TEARDOWN },
      })
    )

    if (rsp.statusCode !== 200) {
      throw new Error(`response not OK: ${rsp.statusCode}`)
    }

    this.sessionControlUrl = this.defaultUri
    this.sessionId = undefined
    this.state = 'idle'
  }

  /** Starts an entire media playback. */
  public async start(
    startTime?: number
  ): Promise<{ sdp: Sdp; range?: [string, string] }> {
    if (this.state !== 'idle') {
      throw new Error(`pipeline can not be started in "${this.state}" state`)
    }
    const sdp = await this.describe()
    await this.setup(sdp)
    const range = await this.play(startTime)
    return { sdp, range }
  }

  /** Send a command and wait for response, setting CSeq and Session headers and
   * taking care of any authentication or retry logic if present.*/
  private async fetch(req: RtspRequestMessage): Promise<RtspResponseMessage> {
    req.headers.Session = this.sessionId
    req.headers.CSeq = this.cseq++
    let rsp = await this.do(req)

    if (rsp.statusCode === 401 && this.auth?.authHeader(req, rsp)) {
      req.headers.CSeq = this.cseq++
      rsp = await this.do(req)
    }

    let retries = 0
    while (
      rsp.statusCode !== 200 &&
      retries < this.retry.max &&
      this.retry.codes.includes(rsp.statusCode)
    ) {
      await new Promise((r) => setTimeout(r, 1000))
      retries++
      req.headers.CSeq = this.cseq++
      rsp = await this.do(req)
    }

    return rsp
  }

  /** Perform an RTSP request and wait for the response. The communication
   * flows over two streams, and this function wraps that in a promise by using
   * callbacks that tie into the stream setup. This forms the basis for all
   * request-response communication. */
  private async do(req: RtspRequestMessage): Promise<RtspResponseMessage> {
    logDebug(req)
    const rsp = await new Promise<RtspResponseMessage>((resolve) => {
      this.recvResponse = (rsp) => resolve(rsp)
      this.sendRequest?.(req)
    })
    this.recvResponse = undefined
    logDebug(rsp)
    return rsp
  }

  private controlUrl(attribute?: string) {
    if (attribute !== undefined && isAbsolute(attribute)) {
      return attribute
    }

    if (attribute === undefined || attribute === '*') {
      return this.sessionControlUrl
    }

    return new URL(attribute, this.sessionControlUrl).href
  }

  /** Sends a periodic OPTIONS request to keep a session alive. */
  private setKeepalive(timeout: number) {
    clearInterval(this.keepaliveInterval)
    this.keepaliveInterval = setInterval(
      () => {
        // Note: An OPTIONS request intended for keeping alive an RTSP
        // session MUST include the Session header with the associated
        // session identifier. Such a request SHOULD also use the media or the
        // aggregated control URI as the Request-URI.
        this.options().catch((err) => {
          logError('failed to keep alive RTSP session:', err)
        })
      },
      Math.max(MIN_SESSION_TIMEOUT, timeout - 5) * 1000
    )
  }

  /** Stop sending periodic OPTIONS requests. */
  private clearKeepalive() {
    clearInterval(this.keepaliveInterval)
    this.keepaliveInterval = undefined
  }

  /** Store the NTP timestamp information. */
  private recordNtpInfo(msg: RtcpMessage) {
    if (this.t0 === undefined || this.n0 === undefined) {
      throw new Error('no NTP information defined')
    }
    if (isRtcpSR(msg.rtcp)) {
      const rtpChannel = msg.channel - 1
      this.t0[rtpChannel] = msg.rtcp.rtpTimestamp
      this.n0[rtpChannel] = getMillis(msg.rtcp.ntpMost, msg.rtcp.ntpLeast)
    }
  }

  /** Use the stored NTP information to set a real time on the RTP messages.
   * Note that it takes a few seconds for the first RTCP to arrive, so the initial
   * RTP messages will not have this NTP timestamp. */
  private addNtpTimestamp(msg: RtpMessage) {
    if (
      this.t0 === undefined ||
      this.n0 === undefined ||
      this.clockrates === undefined
    ) {
      throw new Error('no NTP information defined')
    }
    const rtpChannel = msg.channel
    const t0 = this.t0[rtpChannel]
    const n0 = this.n0[rtpChannel]
    if (typeof t0 !== 'undefined' && typeof n0 !== 'undefined') {
      const clockrate = this.clockrates[rtpChannel]
      const t = msg.timestamp
      // The RTP timestamps are unsigned 32 bit and will overflow
      // at some point. We can guard against the overflow by ORing with 0,
      // which will bring any difference back into signed 32-bit domain.
      const dt = (t - t0) | 0
      msg.ntpTimestamp = (dt / clockrate) * 1000 + n0
    }
  }
}

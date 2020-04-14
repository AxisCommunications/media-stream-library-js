import { MessageType, SdpMessage } from '../../components/message'
import { NtpSeconds, seconds } from './ntp'

interface ConnectionField {
  // c=<nettype> <addrtype> <connection-address>
  networkType: 'IN'
  addressType: 'IP4' | 'IP6'
  connectionAddress: string
}

interface BandwidthField {
  readonly type: string
  readonly value: number
}

// RTSP extensions: https://tools.ietf.org/html/rfc7826 (22.15)
// exists on both session and media level
interface RtspExtensions {
  readonly range?: string
  readonly control?: string
  readonly mtag?: string
}

/**
 * The session description protocol (SDP).
 *
 * Contains parser to convert SDP data into an SDP structure.
 * https://tools.ietf.org/html/rfc4566
 *
 * NOTE: not all SDP attributes have been implemented,
 * and in some cases the handling of attributes has been
 * simplified to not cover multiple identical attributes.
 */

/**
 * Session description
 *
 * Optional items are marked with a '*'.
 *
 * v=  (protocol version)
 * o=  (owner/creator and session identifier).
 * s=  (session name)
 * i=* (session information)
 * u=* (URI of description)
 * e=* (email address)
 * p=* (phone number)
 * c=* (connection information - not required if included in all media)
 * b=* (bandwidth information)
 * One or more time descriptions (see below)
 * z=* (time zone adjustments)
 * k=* (encryption key)
 * a=* (zero or more session attribute lines)
 * Zero or more media descriptions (see below)
 *
 * Names of the fields below are annotated above with
 * the names used in Appendix A: SDP Grammar of RFC 2327.
 */
export interface SessionDescription extends RtspExtensions {
  // v=0
  readonly version: 0
  // o=<username> <sess-id> <sess-version> <nettype> <addrtype> <unicast-address>
  readonly originField: OriginField
  // s=<session name>
  readonly name: string
  // i=<session description>
  readonly description?: string
  // u=<uri>
  readonly uri?: string
  // e=<email-address>
  readonly email?: string | string[]
  // p=<phone-number>
  readonly phone?: string | string[]
  // c=<nettype> <addrtype> <connection-address>
  readonly connection?: ConnectionField
  // b=<bwtype>:<bandwidth>
  readonly bandwidth?: BandwidthField
  // One or more time descriptions
  readonly time: TimeDescription
  readonly repeatTimes?: RepeatTimeDescription
  // Zero or more media descriptions
  readonly media: MediaDescription[]
}

interface OriginField {
  // o=<username> <sess-id> <sess-version> <nettype> <addrtype> <unicast-address>
  username: string
  sessionId: number
  sessionVersion: number
  networkType: 'IN'
  addressType: 'IP4' | 'IP6'
  address: string
}

/**
 * Time description
 *
 * t=  (time the session is active)
 * r=* (zero or more repeat times)
 */
export interface TimeDescription {
  // t=<start-time> <stop-time>
  readonly startTime: NtpSeconds
  readonly stopTime: NtpSeconds
}

export interface RepeatTimeDescription {
  // r=<repeat interval> <active duration> <offsets from start-time>
  readonly repeatInterval: seconds
  readonly activeDuration: seconds
  readonly offsets: seconds[]
}

/**
 * Media description
 *
 * m=  (media name and transport address)
 * i=* (media title)
 * c=* (connection information -- optional if included at session level)
 * b=* (zero or more bandwidth information lines)
 * k=* (encryption key)
 * a=* (zero or more media attribute lines)
 *
 * The parser only handles a single fmt value
 * and only one rtpmap attribute (in theory there
 * can be multiple fmt values with corresponding rtpmap
 * attributes)
 */
export interface MediaDescription extends RtspExtensions {
  // m=<media> <port> <proto> <fmt> ...
  // m=<media> <port>/<number of ports> <proto> <fmt> ...
  readonly type: 'audio' | 'video' | 'application' | 'data' | 'control'
  readonly port: number
  readonly protocol: 'udp' | 'RTP/AVP' | 'RTP/SAVP'
  readonly fmt: number // Payload type(s)
  readonly connection?: ConnectionField
  readonly bandwidth?: BandwidthField
  /**
   * Any remaining attributes
   * a=...
   */
  // a=rtpmap:<payload type> <encoding name>/<clock rate> [/<encoding parameters>]
  readonly rtpmap?: {
    readonly clockrate: number
    readonly encodingName: string
    readonly payloadType: number
  }
  // a=fmtp:<format> <format specific parameters>
  readonly fmtp: {
    readonly format: string
    readonly parameters: { [key: string]: any }
  }
  // Extra non-SDP properties
  // TODO: refactor this away
  mime?: string
  codec?: any
}

export interface VideoMedia extends MediaDescription {
  readonly type: 'video'
  readonly framerate?: number
  // Transformation matrix
  readonly transform?: number[][]
  // JPEG
  readonly framesize?: [number, number]
}

export interface H264Media extends VideoMedia {
  readonly rtpmap: {
    readonly clockrate: number
    readonly encodingName: string
    readonly payloadType: number
  }
}

export interface AudioMedia extends MediaDescription {
  readonly type: 'audio'
}

export interface AACParameters {
  readonly bitrate: string
  readonly config: string
  readonly indexdeltalength: string
  readonly indexlength: string
  readonly mode: 'AAC-hbr'
  readonly 'profile-level-id': string
  readonly sizelength: string
  readonly streamtype: string
  readonly ctsdeltalength: string
  readonly dtsdeltalength: string
  readonly randomaccessindication: string
  readonly streamstateindication: string
  readonly auxiliarydatasizelength: string
}

export interface AACMedia extends AudioMedia {
  readonly fmtp: {
    readonly format: string
    readonly parameters: AACParameters
  }
  readonly rtpmap: {
    readonly clockrate: number
    readonly encodingName: string
    readonly payloadType: number
  }
}

export interface Sdp {
  readonly session: SessionDescription
  readonly media: MediaDescription[]
}

const extractLineVals = (buffer: Buffer, lineStart: string, start = 0) => {
  const anchor = `\n${lineStart}`
  start = buffer.indexOf(anchor, start)
  let end = 0
  const ret: string[] = []
  while (start >= 0) {
    end = buffer.indexOf('\n', start + anchor.length)
    ret.push(buffer.toString('ascii', start + anchor.length, end).trim())
    start = buffer.indexOf(anchor, end)
  }
  return ret
}

// SDP parsing

/**
 * Identify the start of a session-level or media-level section.
 * @param  {String} line The line to parse
 * @return {Object}      Object with a type + name
 */
const newMediaLevel = (line: string) => {
  return line.match(/^m=/)
}

const splitOnFirst = (c: string, text: string) => {
  const p = text.indexOf(c)
  if (p < 0) {
    return [text.slice(0)]
  } else {
    return [text.slice(0, p), text.slice(p + 1)]
  }
}

const attributeParsers: any = {
  fmtp: (value: string) => {
    const [format, stringParameters] = splitOnFirst(' ', value)
    switch (format) {
      default:
        const pairs = stringParameters.trim().split(';')
        const parameters: { [key: string]: any } = {}
        pairs.forEach((pair) => {
          const [key, val] = splitOnFirst('=', pair)
          const normalizedKey = key.trim().toLowerCase()
          if (normalizedKey !== '') {
            parameters[normalizedKey] = val.trim()
          }
        })
        return { format, parameters }
    }
  },
  framerate: Number,
  rtpmap: (value: string) => {
    const [payloadType, encoding] = splitOnFirst(' ', value)
    const [
      encodingName,
      clockrate,
      encodingParameters,
    ] = encoding.toUpperCase().split('/')
    if (encodingParameters === undefined) {
      return {
        payloadType: Number(payloadType),
        encodingName,
        clockrate: Number(clockrate),
      }
    } else {
      return {
        payloadType: Number(payloadType),
        encodingName,
        clockrate: Number(clockrate),
        encodingParameters,
      }
    }
  },
  transform: (value: string) => {
    return value.split(';').map((row) => row.split(',').map(Number))
  },
  framesize: (value: string) => {
    return value.split(' ')[1].split('-').map(Number)
  },
}

const parseAttribute = (body: string) => {
  const [attribute, value] = splitOnFirst(':', body)
  if (value === undefined) {
    return { [attribute]: true }
  } else {
    if (attributeParsers[attribute] !== undefined) {
      return { [attribute]: attributeParsers[attribute](value) }
    } else {
      return { [attribute]: value }
    }
  }
}

const extractField = (line: string) => {
  const prefix = line.slice(0, 1)
  const body = line.slice(2)
  switch (prefix) {
    case 'v':
      return { version: body }
    case 'o':
      const [
        username,
        sessionId,
        sessionVersion,
        netType,
        addrType,
        unicastAddress,
      ] = body.split(' ')
      return {
        origin: {
          addrType,
          netType,
          sessionId,
          sessionVersion,
          unicastAddress,
          username,
        },
      }
    case 's':
      return { sessionName: body }
    case 'i':
      return { sessionInformation: body }
    case 'u':
      return { uri: body }
    case 'e':
      return { email: body }
    case 'p':
      return { phone: body }
    // c=<nettype> <addrtype> <connection-address>
    case 'c':
      const [
        connectionNetType,
        connectionAddrType,
        connectionAddress,
      ] = body.split(' ')
      return {
        connectionData: {
          addrType: connectionAddrType,
          connectionAddress,
          netType: connectionNetType,
        },
      }
    // b=<bwtype>:<bandwidth>
    case 'b':
      const [bwtype, bandwidth] = body.split(':')
      return { bwtype, bandwidth }
    // t=<start-time> <stop-time>
    case 't':
      const [startTime, stopTime] = body.split(' ').map(Number)
      return { time: { startTime, stopTime } }
    // r=<repeat interval> <active duration> <offsets from start-time>
    case 'r':
      const [repeatInterval, activeDuration, ...offsets] = body
        .split(' ')
        .map(Number)
      return {
        repeatTimes: { repeatInterval, activeDuration, offsets },
      }
    // z=<adjustment time> <offset> <adjustment time> <offset> ....
    case 'z':
      return
    // k=<method>
    // k=<method>:<encryption key>
    case 'k':
      return
    // a=<attribute>
    // a=<attribute>:<value>
    case 'a':
      return parseAttribute(body)
    case 'm':
      // Only the first fmt field is parsed!
      const [type, port, protocol, fmt] = body.split(' ')
      return { type, port: Number(port), protocol, fmt: Number(fmt) }
    default:
    // console.log('unknown SDP prefix ', prefix);
  }
}

export const extractURIs = (buffer: Buffer) => {
  // There is a control URI above the m= line, which should not be used
  const seekFrom = buffer.indexOf('\nm=')
  return extractLineVals(buffer, 'a=control:', seekFrom)
}

/**
 * Create an array of sprop-parameter-sets elements
 * @param  {Buffer} buffer The buffer containing the sdp data
 * @return {Array}         The differen parameter strings
 */
export const parse = (buffer: Buffer): Sdp => {
  const sdp = buffer
    .toString('ascii')
    .split('\n')
    .map((s) => s.trim())
  const struct: { [key: string]: any } = { session: {}, media: [] }
  let mediaCounter = 0
  let current = struct.session
  for (const line of sdp) {
    if (newMediaLevel(line)) {
      struct.media[mediaCounter] = {}
      current = struct.media[mediaCounter]
      ++mediaCounter
    }
    current = Object.assign(current, extractField(line))
  }
  return struct as Sdp
}

export const messageFromBuffer = (buffer: Buffer): SdpMessage => {
  return {
    type: MessageType.SDP,
    data: buffer,
    sdp: parse(buffer),
  }
}

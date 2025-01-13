import { Message } from './message'

import { NtpSeconds, seconds } from './ntp'

/**
 * The session description protocol (SDP) message
 * carries all data related to an RTSP session.
 *
 * NOTE: not all SDP attributes have been implemented,
 * and in some cases the handling of attributes has been
 * simplified to not cover multiple identical attributes.
 */

export class SdpMessage extends Message<'sdp'> {
  readonly session: SessionDescription
  readonly media: MediaDescription[]

  constructor({ session, media }: Sdp) {
    super('sdp')

    this.session = session
    this.media = media
  }
}

export interface Sdp {
  readonly session: SessionDescription
  readonly media: MediaDescription[]
}

// RTSP extensions: https://tools.ietf.org/html/rfc7826 (22.15)
// exists on both session and media level
interface RtspExtensions {
  readonly range?: string
  readonly control?: string
  readonly mtag?: string
}

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

export type TransformationMatrix = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
]

export interface VideoMedia extends MediaDescription {
  readonly type: 'video'
  readonly framerate?: number
  // Transformation matrix
  readonly transform?: TransformationMatrix
  readonly 'x-sensor-transform'?: TransformationMatrix
}

export interface H264Media extends VideoMedia {
  readonly rtpmap: {
    readonly clockrate: number
    readonly encodingName: 'H264'
    readonly payloadType: number
  }
}

export interface JpegMedia extends MediaDescription {
  readonly framesize?: [number, number]
  readonly rtpmap: {
    readonly clockrate: number
    readonly encodingName: 'JPEG'
    readonly payloadType: number
  }
}

export interface AudioMedia extends MediaDescription {
  readonly type: 'audio'
}

export interface OnvifMedia extends MediaDescription {
  readonly type: 'application'
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
    readonly format: 'AAC-hbr'
    readonly parameters: AACParameters
  }
  readonly rtpmap: {
    readonly clockrate: number
    readonly encodingName: 'MPEG4-GENERIC'
    readonly payloadType: number
  }
}

// Type guards

export function isAACMedia(media: MediaDescription): media is AACMedia {
  return (
    media.type === 'audio' &&
    media.rtpmap?.encodingName === 'MPEG4-GENERIC' &&
    media.fmtp.parameters.mode === 'AAC-hbr'
  )
}

export function isH264Media(media: MediaDescription): media is H264Media {
  return media.type === 'video' && media.rtpmap?.encodingName === 'H264'
}

export function isJpegMedia(media: MediaDescription): media is JpegMedia {
  return media.type === 'video' && media.rtpmap?.encodingName === 'JPEG'
}

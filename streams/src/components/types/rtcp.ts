import { Message } from './message'

// Real Time Control Protocol (RTCP) - types
// https://tools.ietf.org/html/rfc3550#section-6

export class RtcpMessage extends Message<'rtcp'> {
  readonly channel: number
  readonly rtcp: Rtcp | RtcpSR | RtcpRR | RtcpSDES | RtcpBye | RtcpApp

  constructor({ channel, rtcp }: Pick<RtcpMessage, 'channel' | 'rtcp'>) {
    super('rtcp')

    this.channel = channel
    this.rtcp = rtcp
  }
}

export enum RTCPPacketType {
  SR = 200,
  RR = 201,
  SDES = 202,
  BYE = 203,
  APP = 204,
}

export interface Rtcp {
  readonly version: number
  readonly padding: boolean
  readonly count: number
  readonly packetType: RTCPPacketType | number
  readonly length: number
}

export interface RtcpReportBlock {
  readonly syncSource: number
  readonly fractionLost: number
  readonly cumulativeNumberOfPacketsLost: number
  readonly extendedHighestSequenceNumberReceived: number
  readonly interarrivalJitter: number
  readonly lastSRTimestamp: number
  readonly delaySinceLastSR: number
}

export interface RtcpSR extends Rtcp {
  readonly version: RTCPPacketType.SR

  readonly syncSource: number
  readonly ntpMost: number
  readonly ntpLeast: number
  readonly rtpTimestamp: number
  readonly sendersPacketCount: number
  readonly sendersOctetCount: number
  readonly reports: readonly RtcpReportBlock[]
}

export const isRtcpSR = (rtcp: Rtcp): rtcp is RtcpSR =>
  rtcp.packetType === RTCPPacketType.SR

export interface RtcpRR extends Rtcp {
  readonly version: RTCPPacketType.RR

  readonly syncSource: number
  readonly reports: readonly RtcpReportBlock[]
}

export const isRtcpRR = (rtcp: Rtcp): rtcp is RtcpRR =>
  rtcp.packetType === RTCPPacketType.RR

export enum SDESItem {
  CNAME = 1,
  NAME = 2,
  EMAIL = 3,
  PHONE = 4,
  LOC = 5,
  TOOL = 6,
  NOTE = 7,
  PRIV = 8,
}

export interface RtcpSDESBlock {
  readonly source: number
  readonly items: Array<[number, string] | [SDESItem.PRIV, string, string]>
}

export interface RtcpSDES extends Rtcp {
  readonly version: RTCPPacketType.SDES

  readonly syncSource: number
  readonly sourceDescriptions: readonly RtcpSDESBlock[]
}

export const isRtcpSDES = (rtcp: Rtcp): rtcp is RtcpSDES =>
  rtcp.packetType === RTCPPacketType.SDES

export interface RtcpBye extends Rtcp {
  readonly version: RTCPPacketType.BYE

  readonly sources: number[]
  readonly reason?: string
}

export const isRtcpBye = (rtcp: Rtcp): rtcp is RtcpBye =>
  rtcp.packetType === RTCPPacketType.BYE

export interface RtcpApp extends Rtcp {
  readonly version: RTCPPacketType.APP

  readonly subtype: number
  readonly source: number
  readonly name: string
  readonly data: Uint8Array
}

export const isRtcpApp = (rtcp: Rtcp): rtcp is RtcpApp =>
  rtcp.packetType === RTCPPacketType.APP

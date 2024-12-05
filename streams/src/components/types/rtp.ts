import { Message } from './message'

export class RtpMessage extends Message<'rtp'> {
  readonly channel: number
  readonly data: Uint8Array
  readonly marker: boolean
  readonly payloadType: number
  readonly timestamp: number
  ntpTimestamp?: number

  constructor({
    channel,
    data,
    marker,
    payloadType,
    timestamp,
  }: Pick<
    RtpMessage,
    'channel' | 'data' | 'marker' | 'payloadType' | 'timestamp'
  >) {
    super('rtp')

    this.channel = channel
    this.data = data
    this.marker = marker
    this.payloadType = payloadType
    this.timestamp = timestamp
  }
}

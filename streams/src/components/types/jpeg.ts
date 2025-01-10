import { Message } from './message'

export class JpegMessage extends Message<'jpeg'> {
  readonly data: Uint8Array
  readonly framesize: { readonly width: number; readonly height: number }
  readonly ntpTimestamp?: number
  readonly payloadType: number
  readonly timestamp: number

  constructor({
    data,
    framesize,
    ntpTimestamp,
    payloadType,
    timestamp,
  }: Pick<
    JpegMessage,
    'data' | 'framesize' | 'ntpTimestamp' | 'payloadType' | 'timestamp'
  >) {
    super('jpeg')

    this.data = data
    this.framesize = framesize
    this.ntpTimestamp = ntpTimestamp
    this.payloadType = payloadType
    this.timestamp = timestamp
  }
}

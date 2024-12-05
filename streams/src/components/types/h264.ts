import { Message } from './message'

export class H264Message extends Message<'h264'> {
  readonly data: Uint8Array
  readonly idrPicture: boolean
  readonly nalType: number
  readonly ntpTimestamp?: number
  readonly payloadType: number
  readonly timestamp: number

  constructor({
    data,
    idrPicture,
    nalType,
    ntpTimestamp,
    payloadType,
    timestamp,
  }: Pick<
    H264Message,
    | 'data'
    | 'idrPicture'
    | 'nalType'
    | 'ntpTimestamp'
    | 'payloadType'
    | 'timestamp'
  >) {
    super('h264')

    this.data = data
    this.idrPicture = idrPicture
    this.nalType = nalType
    this.ntpTimestamp = ntpTimestamp
    this.payloadType = payloadType
    this.timestamp = timestamp
  }
}

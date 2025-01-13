import { Message } from './message'

export class ElementaryMessage extends Message<'elementary'> {
  readonly data: Uint8Array
  readonly ntpTimestamp?: number
  readonly payloadType: number
  readonly timestamp: number

  constructor({
    data,
    ntpTimestamp,
    payloadType,
    timestamp,
  }: Pick<
    ElementaryMessage,
    'data' | 'ntpTimestamp' | 'payloadType' | 'timestamp'
  >) {
    super('elementary')

    this.data = data
    this.ntpTimestamp = ntpTimestamp
    this.payloadType = payloadType
    this.timestamp = timestamp
  }
}

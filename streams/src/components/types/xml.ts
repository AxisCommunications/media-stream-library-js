import { Message } from './message'

export class XmlMessage extends Message<'xml'> {
  readonly data: Uint8Array
  readonly ntpTimestamp?: number
  readonly payloadType: number
  readonly timestamp: number

  constructor({
    data,
    ntpTimestamp,
    payloadType,
    timestamp,
  }: Pick<XmlMessage, 'data' | 'ntpTimestamp' | 'payloadType' | 'timestamp'>) {
    super('xml')

    this.data = data
    this.ntpTimestamp = ntpTimestamp
    this.payloadType = payloadType
    this.timestamp = timestamp
  }
}

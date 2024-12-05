import { Message } from './message'

export class RtspResponseMessage extends Message<'rtsp_rsp'> {
  readonly body?: Uint8Array
  readonly headers: Headers
  readonly statusCode: number

  constructor({
    body,
    headers,
    statusCode,
  }: Pick<RtspResponseMessage, 'body' | 'headers' | 'statusCode'>) {
    super('rtsp_rsp')

    this.body = body
    this.headers = headers
    this.statusCode = statusCode
  }

  toString() {
    return `S->C: ${this.statusCode}\n${[...this.headers.entries()].map(([h, v]) => `${h}: ${v}`).join('\n')}`
  }
}

export type RtspRequestHeaders =
  | {
      CSeq?: number
      Session?: string
      Date?: string
      Authorization?: string
      Transport?: string
      Range?: string
    }
  | { [key: string]: string }

export type RtspRequestMethod =
  | 'OPTIONS'
  | 'DESCRIBE'
  | 'SETUP'
  | 'PLAY'
  | 'PAUSE'
  | 'TEARDOWN'

export class RtspRequestMessage extends Message<'rtsp_req'> {
  readonly method: RtspRequestMethod
  readonly uri: string
  readonly headers: RtspRequestHeaders
  readonly protocol?: string

  constructor({
    headers,
    method,
    protocol,
    uri,
  }: Pick<RtspRequestMessage, 'headers' | 'method' | 'protocol' | 'uri'>) {
    super('rtsp_req')

    this.headers = headers
    this.method = method
    this.protocol = protocol
    this.uri = uri
  }

  toString() {
    return `C->S: ${this.method} ${this.uri}\n${[...Object.entries(this.headers)].map(([h, v]) => `${h}: ${v}`).join('\n')}`
  }
}

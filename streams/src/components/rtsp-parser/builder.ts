import debug from 'debug'

import { RtspMessage } from '../message'

const DEFAULT_PROTOCOL = 'RTSP/1.0'

export const builder = (msg: RtspMessage): Buffer => {
  if (!msg.method || !msg.uri) {
    throw new Error('message needs to contain a method and a uri')
  }
  const protocol = msg.protocol || DEFAULT_PROTOCOL
  const headers = msg.headers || {}

  const messageString = [
    `${msg.method} ${msg.uri} ${protocol}`,
    Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n'),
    '\r\n',
  ].join('\r\n')
  debug('msl:rtsp:outgoing')(messageString)

  return Buffer.from(messageString)
}

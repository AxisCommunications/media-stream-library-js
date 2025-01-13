import type { RtspRequestMessage } from '../types/rtsp'

import { encode } from '../utils/bytes'

const DEFAULT_PROTOCOL = 'RTSP/1.0'

export const serialize = (msg: RtspRequestMessage): Uint8Array => {
  if (!msg.method || !msg.uri) {
    throw new Error('message needs to contain a method and a uri')
  }
  const protocol = msg.protocol || DEFAULT_PROTOCOL
  const headers = msg.headers || {}

  const messageString = [
    `${msg.method} ${msg.uri} ${protocol}`,
    Object.entries(headers)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n'),
    '\r\n',
  ].join('\r\n')

  return encode(messageString)
}

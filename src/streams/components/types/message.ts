const messageTypes = [
  'rtp',
  'rtsp_req',
  'rtsp_rsp',
  'rtcp',
  'sdp',
  'elementary',
  'h264',
  'isom',
  'xml',
  'jpeg',
] as const

export type MessageType = (typeof messageTypes)[number]

export class Message<T extends MessageType> {
  constructor(public readonly type: T) {}
}

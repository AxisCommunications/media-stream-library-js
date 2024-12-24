import { Message } from './message'

export class IsomMessage extends Message<'isom'> {
  /** presentation time of last I-frame (s) */
  readonly checkpointTime?: number
  /** ISO-BMFF boxes */
  readonly data: Uint8Array
  /** MIME type of the media stream (e.g. "video/mp4")
   * (needs to be on the first message if sent in-band)*/
  readonly mimeType?: string
  readonly ntpTimestamp?: number

  constructor({
    checkpointTime,
    data,
    mimeType,
    ntpTimestamp,
  }: Pick<
    IsomMessage,
    'checkpointTime' | 'data' | 'mimeType' | 'ntpTimestamp'
  >) {
    super('isom')

    this.checkpointTime = checkpointTime
    this.data = data
    this.mimeType = mimeType
    this.ntpTimestamp = ntpTimestamp
  }
}

export interface MediaTrack {
  type: 'audio' | 'video'
  codec?: string
}

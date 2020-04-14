import { MessageType, Message } from '../message'
import debug from 'debug'
import { Box } from './helpers/isom'
import { BoxBuilder } from './helpers/boxbuilder'
import { Transform } from 'stream'
import { Tube } from '../component'
import { NAL_TYPES } from '../h264depay/parser'

/**
 * Component that converts elementary stream data into MP4 boxes honouring
 * the ISO BMFF Byte Stream (Some extra restrictions are involved).
 */
export class Mp4Muxer extends Tube {
  public boxBuilder: BoxBuilder
  public onSync?: (ntpPresentationTime: number) => void
  /**
   * Create a new mp4muxer component.
   * @return {undefined}
   */
  constructor() {
    const boxBuilder = new BoxBuilder()
    const onSync = (ntpPresentationTime: number) => {
      this.onSync && this.onSync(ntpPresentationTime)
    }
    const incoming = new Transform({
      objectMode: true,
      transform: function (msg: Message, encoding, callback) {
        if (msg.type === MessageType.SDP) {
          /**
           * Arrival of SDP signals the beginning of a new movie.
           * Set up the ftyp and moov boxes.
           */

          // Why is this here? These should be default inside the mvhd box?
          const now = Math.floor(new Date().getTime() / 1000 + 2082852000)
          const ftyp = new Box('ftyp')
          const moov = boxBuilder.moov(msg.sdp, now)

          const data = Buffer.allocUnsafe(ftyp.byteLength + moov.byteLength)
          ftyp.copy(data, 0)
          moov.copy(data, ftyp.byteLength)

          debug('msl:mp4:isom')(`ftyp: ${ftyp.format()}`)
          debug('msl:mp4:isom')(`moov: ${moov.format()}`)

          this.push(msg) // Pass on the original SDP message
          this.push({ type: MessageType.ISOM, data, ftyp, moov })
        } else if (
          msg.type === MessageType.ELEMENTARY ||
          msg.type === MessageType.H264
        ) {
          /**
           * Otherwise we are getting some elementary stream data.
           * Set up the moof and mdat boxes.
           */

          const { payloadType, timestamp, ntpTimestamp } = msg
          const trackId = boxBuilder.trackIdMap[payloadType]

          if (trackId) {
            if (!boxBuilder.ntpPresentationTime) {
              boxBuilder.setPresentationTime(trackId, ntpTimestamp)
              if (boxBuilder.ntpPresentationTime) {
                onSync(boxBuilder.ntpPresentationTime)
              }
            }

            let checkpointTime: number | undefined = undefined
            const idrPicture =
              msg.type === MessageType.H264
                ? msg.nalType === NAL_TYPES.IDR_PICTURE
                : undefined
            if (
              boxBuilder.ntpPresentationTime &&
              idrPicture &&
              msg.ntpTimestamp !== undefined
            ) {
              checkpointTime =
                (msg.ntpTimestamp - boxBuilder.ntpPresentationTime) / 1000
            }

            const byteLength = msg.data.byteLength
            const moof = boxBuilder.moof({ trackId, timestamp, byteLength })
            const mdat = boxBuilder.mdat(msg.data)

            const data = Buffer.allocUnsafe(moof.byteLength + mdat.byteLength)
            moof.copy(data, 0)
            mdat.copy(data, moof.byteLength)

            this.push({
              type: MessageType.ISOM,
              data,
              moof,
              mdat,
              ntpTimestamp,
              checkpointTime,
            })
          }
        } else {
          // No message type we recognize, pass it on.
          this.push(msg)
        }
        callback()
      },
    })

    super(incoming)
    this.boxBuilder = boxBuilder
  }

  get bitrate() {
    return (
      this.boxBuilder.trackData &&
      this.boxBuilder.trackData.map((data) => data.bitrate)
    )
  }

  get framerate() {
    return (
      this.boxBuilder.trackData &&
      this.boxBuilder.trackData.map((data) => data.framerate)
    )
  }

  get ntpPresentationTime() {
    return this.boxBuilder.ntpPresentationTime
  }
}

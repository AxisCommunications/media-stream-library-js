import { logInfo } from '../../log'

import {
  ElementaryMessage,
  H264Message,
  IsomMessage,
  SdpMessage,
} from '../types'

import { BoxBuilder, TrackData, mediaSettings } from './boxbuilder'
import { Box } from './isom'
import { mimeType } from './mime'

/**
 * Mp4Muxer converts H264/AAC stream data into MP4 boxes conforming to
 * the ISO BMFF Byte Stream format.
 */
export class Mp4Muxer extends TransformStream<
  SdpMessage | ElementaryMessage | H264Message,
  IsomMessage
> {
  public onSync?: (videoStartTime: number) => void

  private readonly boxBuilder: BoxBuilder

  constructor() {
    const boxBuilder = new BoxBuilder()
    const onSync = (videoStartTime: number) => {
      this.onSync && this.onSync(videoStartTime)
    }

    super({
      transform: (msg, controller) => {
        switch (msg.type) {
          case 'sdp': {
            // Arrival of SDP signals the beginning of a new movie.
            // Set up the ftyp and moov boxes.

            // Why is this here? These should be default inside the mvhd box?
            // Timestamps are given in seconds since 1904-01-01.
            const now = Math.floor(new Date().getTime() / 1000 + 2082852000)
            const tracks = mediaSettings(msg.media, now)
            tracks.forEach(({ id, name }) =>
              logInfo(`track ${id}/${tracks.length}: ${name}`)
            )

            const ftyp = new Box('ftyp')
            const moov = boxBuilder.moov(tracks, now)

            const data = new Uint8Array(ftyp.byteLength + moov.byteLength)
            ftyp.copy(data, 0)
            moov.copy(data, ftyp.byteLength)

            return controller.enqueue(
              new IsomMessage({ data, mimeType: mimeType(tracks) })
            )
          }
          case 'h264': {
            const { payloadType, timestamp, ntpTimestamp } = msg
            const trackData = boxBuilder.trackData[payloadType]

            if (trackData === undefined) {
              return controller.error(
                `missing track data for H264 (PT ${payloadType})`
              )
            }

            if (!boxBuilder.videoStartTime) {
              boxBuilder.setVideoStartTime(trackData, ntpTimestamp)
              if (boxBuilder.videoStartTime) {
                onSync(boxBuilder.videoStartTime)
              }
            }

            let checkpointTime: number | undefined
            if (
              boxBuilder.videoStartTime &&
              msg.idrPicture &&
              msg.ntpTimestamp !== undefined
            ) {
              checkpointTime =
                (msg.ntpTimestamp - boxBuilder.videoStartTime) / 1000
            }

            const byteLength = msg.data.byteLength
            const moof = boxBuilder.moof({ trackData, timestamp, byteLength })
            const mdat = boxBuilder.mdat(msg.data)

            const data = new Uint8Array(moof.byteLength + mdat.byteLength)
            moof.copy(data, 0)
            mdat.copy(data, moof.byteLength)

            return controller.enqueue(
              new IsomMessage({ data, ntpTimestamp, checkpointTime })
            )
          }
          case 'elementary': {
            const { payloadType, timestamp, ntpTimestamp } = msg
            const trackData = boxBuilder.trackData[payloadType]

            if (!trackData) {
              return controller.error(
                `missing track data for AAC (PT ${payloadType})`
              )
            }

            const byteLength = msg.data.byteLength
            const moof = boxBuilder.moof({ trackData, timestamp, byteLength })
            const mdat = boxBuilder.mdat(msg.data)

            const data = new Uint8Array(moof.byteLength + mdat.byteLength)
            moof.copy(data, 0)
            mdat.copy(data, moof.byteLength)

            return controller.enqueue(new IsomMessage({ data, ntpTimestamp }))
          }
        }
      },
    })

    this.boxBuilder = boxBuilder
  }

  public get tracks(): TrackData[] {
    return Object.values(this.boxBuilder.trackData).filter(
      (data) => data !== undefined
    )
  }

  public get ntpPresentationTime() {
    return this.boxBuilder.videoStartTime
  }
}

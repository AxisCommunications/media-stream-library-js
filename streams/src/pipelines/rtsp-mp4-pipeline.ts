import { AACDepay } from '../components/aacdepay'
import { H264Depay } from '../components/h264depay'
import { Mp4Muxer } from '../components/mp4muxer'
import { RtspConfig } from '../components/rtsp-session'

import { RtspPipeline } from './rtsp-pipeline'

/**
 * RtspMp4Pipeline
 *
 * A pipeline that can process H264/AAC RTP data, and converts it to streaming
 * MP4 format (ISO BMFF bytestream).
 *
 * The following handlers can be defined:
 * - all handlers from the RtspPipeline
 * - `onSync`: called when the NTP time of the first frame is known, with the
 *   timestamp as argument (the timestamp is UNIX milliseconds)
 */
export class RtspMp4Pipeline extends RtspPipeline {
  public onSync?: (ntpPresentationTime: number) => void

  private readonly _mp4Muxer: Mp4Muxer

  constructor(rtspConfig?: RtspConfig) {
    super(rtspConfig)

    const h264Depay = new H264Depay()
    const aacDepay = new AACDepay()
    const mp4Muxer = new Mp4Muxer()

    mp4Muxer.onSync = (ntpPresentationTime) => {
      this.onSync && this.onSync(ntpPresentationTime)
    }

    this.append(h264Depay, aacDepay, mp4Muxer)

    this._mp4Muxer = mp4Muxer
  }

  get bitrate() {
    return this._mp4Muxer.bitrate
  }

  get framerate() {
    return this._mp4Muxer.framerate
  }
}

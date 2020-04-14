import { RtspPipeline } from './rtsp-pipeline'
import { RtspConfig } from '../components/rtsp-session'
import { H264Depay } from '../components/h264depay'
import { AACDepay } from '../components/aacdepay'
import { Mp4Muxer } from '../components/mp4muxer'

/**
 * A pipeline that deals with H264/AAC encoded video
 * sent over RTP, and converts it to streaming MP4
 * format.
 *
 * The following handlers can be defined:
 * - onSync: called when the NTP time of the first frame
 *           is known, with the timestamp as argument
 *           (the timestamp is UNIX milliseconds)
 */
export class RtspMp4Pipeline extends RtspPipeline {
  public onSync?: (ntpPresentationTime: number) => void

  private _mp4Muxer: Mp4Muxer

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

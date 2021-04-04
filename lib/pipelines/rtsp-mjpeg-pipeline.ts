import { RtspPipeline } from './rtsp-pipeline'
import { RtspConfig } from '../components/rtsp-session'
import { JPEGDepay } from '../components/jpegdepay'

/**
 * RtspMjpegPipeline
 *
 * A pipeline that can process JPEG RTP data, and converts it to streaming
 * motion JPEG format (sequence of JPEG images).
 *
 * The following handlers can be defined:
 * - all handlers from the RtspPipeline
 */
export class RtspMjpegPipeline extends RtspPipeline {
  constructor(rtspConfig?: RtspConfig) {
    super(rtspConfig)

    const jpegDepay = new JPEGDepay()

    this.append(jpegDepay)
  }
}

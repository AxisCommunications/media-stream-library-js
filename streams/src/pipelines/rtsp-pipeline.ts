import { RtspParser } from '../components/rtsp-parser'
import { RtspConfig, RtspSession } from '../components/rtsp-session'
import { Sdp } from '../utils/protocols/sdp'

import { Pipeline } from './pipeline'

/**
 * RtspPipeline
 *
 * A pipeline that converts interleaved RTSP/RTP into a series of RTP, RTCP, and
 * RTSP packets.  The pipeline exposes the RTSP session component as
 * `this.session`, and wraps its play, pause and stop methods.
 *
 * The following handlers can be defined:
 * - onSdp: called when the session descript protocol is available, with the SDP
 *   object as argument
 * - onPlay: called when a response from the PLAY command arrives, with the play
 *   range as argument
 */
export class RtspPipeline extends Pipeline {
  public onSdp?: (sdp: Sdp) => void
  public onPlay?: (range: string[] | undefined) => void
  public rtsp: RtspSession

  constructor(rtspConfig?: RtspConfig) {
    const rtspParser = new RtspParser()
    const rtspSession = new RtspSession(rtspConfig)

    rtspSession.onSdp = (sdp) => {
      this.onSdp && this.onSdp(sdp)
    }

    rtspSession.onPlay = (range) => {
      this.onPlay && this.onPlay(range)
    }

    super(rtspParser, rtspSession)

    // Expose session for external use
    this.rtsp = rtspSession
  }
}

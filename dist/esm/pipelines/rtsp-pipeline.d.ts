import { Pipeline } from './pipeline';
import { RtspSession, RtspConfig } from '../components/rtsp-session';
import { Sdp } from '../utils/protocols/sdp';
/**
 * A pipeline that converts interleaved RTSP/RTP
 * into a series of RTP, RTCP, and RTSP packets.
 * The pipeline exposes the RTSP session component
 * as `this.session`, and wraps its play, pause
 * and stop methods.
 *
 * The following handlers can be defined:
 * - onSdp: called when the session descript protocol
 *          is available, with the SDP object as argument
 * - onPlay: called when a response from the PLAY command
 *           arrives, with the play range as argument
 */
export declare class RtspPipeline extends Pipeline {
    onSdp?: (sdp: Sdp) => void;
    onPlay?: (range: string[] | undefined) => void;
    rtsp: RtspSession;
    constructor(rtspConfig?: RtspConfig);
}

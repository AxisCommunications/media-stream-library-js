import { RtspPipeline } from './rtsp-pipeline';
import { RtspConfig } from '../components/rtsp-session';
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
export declare class RtspMp4Pipeline extends RtspPipeline {
    onSync?: (ntpPresentationTime: number) => void;
    private _mp4Muxer;
    constructor(rtspConfig?: RtspConfig);
    get bitrate(): number[];
    get framerate(): number[];
}

import { RtspPipeline } from './rtsp-pipeline';
import { RtspConfig } from '../components/rtsp-session';
/**
 * A pipeline that deals with JPEG encoded video
 * sent over RTP, and converts it to motion JPEG
 * format.
 */
export declare class RtspMjpegPipeline extends RtspPipeline {
    constructor(rtspConfig?: RtspConfig);
}

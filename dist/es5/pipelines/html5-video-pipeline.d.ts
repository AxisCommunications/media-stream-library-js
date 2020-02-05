import { RtspMp4Pipeline } from './rtsp-mp4-pipeline';
import { RtspConfig } from '../components/rtsp-session';
import { WSConfig } from '../components/ws-source/openwebsocket';
import { MediaTrack } from '../components/mse';
import { AuthConfig } from '../components/auth';
export interface Html5VideoConfig {
    ws?: WSConfig;
    rtsp?: RtspConfig;
    mediaElement: HTMLVideoElement;
    auth?: AuthConfig;
}
/**
 * Pipeline that can receive H264/AAC video over RTP
 * over WebSocket and pass it to a video element.
 *
 * @class Html5VideoPipeline
 * @extends {RtspMp4Pipeline}
 */
export declare class Html5VideoPipeline extends RtspMp4Pipeline {
    onSourceOpen?: (mse: MediaSource, tracks: MediaTrack[]) => void;
    onServerClose?: () => void;
    ready: Promise<void>;
    private _src?;
    private _sink;
    /**
     * Creates an instance of Html5VideoPipeline.
     * @param {any} [config={}] Component options
     * @memberof Html5VideoPipeline
     */
    constructor(config: Html5VideoConfig);
    close(): void;
    get currentTime(): number;
    play(): Promise<void>;
    pause(): void;
}

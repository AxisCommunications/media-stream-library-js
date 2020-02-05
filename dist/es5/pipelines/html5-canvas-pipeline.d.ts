import { RtspMjpegPipeline } from './rtsp-mjpeg-pipeline';
import { WSConfig } from '../components/ws-source/openwebsocket';
import { RtspConfig } from '../components/rtsp-session';
import { AuthConfig } from '../components/auth';
export interface Html5CanvasConfig {
    ws?: WSConfig;
    rtsp?: RtspConfig;
    mediaElement: HTMLCanvasElement;
    auth?: AuthConfig;
}
/**
 * Pipeline that can receive Motion JPEG over RTP over WebSocket
 * and display it on a canvas.
 *
 * Handlers that can be set on the pipeline:
 * - onCanplay: called when the first frame is ready, at this point
 *   you can call the play method to start playback.
 *   Note: the default is to autoplay, so call .pause() inside
 *   your onCanplay function if you want to prevent this.
 * - onSync: called when UNIX time (milliseconds) is available
 *   for the start of the presentation.
 *
 * @class Html5CanvasPipeline
 * @extends {RtspMjpegPipeline}
 */
export declare class Html5CanvasPipeline extends RtspMjpegPipeline {
    onCanplay?: () => void;
    onSync?: (ntpPresentationTime: number) => void;
    onServerClose?: () => void;
    ready: Promise<void>;
    private _src?;
    private _sink;
    /**
     * Creates an instance of Html5CanvasPipeline.
     * @param {any} [config={}] Component options
     * @memberof Html5CanvasPipeline
     */
    constructor(config: Html5CanvasConfig);
    close(): void;
    get currentTime(): number;
    play(): void;
    pause(): void;
    get bitrate(): number;
    get framerate(): number;
}

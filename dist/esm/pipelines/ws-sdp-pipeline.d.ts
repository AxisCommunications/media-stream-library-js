import { RtspConfig } from '../components/rtsp-session';
import { WSConfig } from '../components/ws-source/openwebsocket';
import { AuthConfig } from '../components/auth';
import { RtspPipeline } from './rtsp-pipeline';
export interface TransformConfig {
    ws?: WSConfig;
    rtsp?: RtspConfig;
    auth?: AuthConfig;
}
/**
 * Pipeline that can receive the SDP object for an RTS stream.
 *
 * @class WsSdpPipeline
 * @extends {RtspPipeline}
 */
export declare class WsSdpPipeline extends RtspPipeline {
    onServerClose?: () => void;
    ready: Promise<void>;
    private _src?;
    /**
     * Creates an instance of Html5VideoPipeline.
     * @param {any} [config={}] Component options
     * @memberof Html5VideoPipeline
     */
    constructor(config: TransformConfig);
    close(): void;
    get sdp(): Promise<unknown>;
}

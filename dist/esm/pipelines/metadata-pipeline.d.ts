import { RtspPipeline } from './rtsp-pipeline';
import { WSConfig } from '../components/ws-source/openwebsocket';
import { RtspConfig } from '../components/rtsp-session';
import { XmlMessage } from '../components/message';
export interface WsRtspMetadataConfig {
    ws?: WSConfig;
    rtsp?: RtspConfig;
    metadataHandler: (msg: XmlMessage) => void;
}
/**
 * Pipeline that can receive XML metadata over RTP
 * over WebSocket and pass it to a handler.
 */
export declare class MetadataPipeline extends RtspPipeline {
    onServerClose?: () => void;
    ready: Promise<void>;
    private _src?;
    constructor(config: WsRtspMetadataConfig);
    close(): void;
}

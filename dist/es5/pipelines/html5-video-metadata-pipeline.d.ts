import { Html5VideoPipeline, Html5VideoConfig } from './html5-video-pipeline';
import { XmlMessage } from '../components/message';
export interface Html5VideoMetadataConfig extends Html5VideoConfig {
    metadataHandler: (msg: XmlMessage) => void;
}
/**
 * Pipeline that can receive H264/AAC video over RTP
 * over WebSocket and pass it to a video element.
 * Additionally, this pipeline passes XML metadata sent
 * in the same stream to a handler.
 */
export declare class Html5VideoMetadataPipeline extends Html5VideoPipeline {
    constructor(config: Html5VideoMetadataConfig);
}

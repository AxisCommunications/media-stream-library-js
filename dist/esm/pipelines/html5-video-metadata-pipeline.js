import { Html5VideoPipeline } from './html5-video-pipeline';
import { ONVIFDepay } from '../components/onvifdepay';
/**
 * Pipeline that can receive H264/AAC video over RTP
 * over WebSocket and pass it to a video element.
 * Additionally, this pipeline passes XML metadata sent
 * in the same stream to a handler.
 */
export class Html5VideoMetadataPipeline extends Html5VideoPipeline {
    constructor(config) {
        const { metadataHandler } = config;
        super(config);
        const onvifDepay = new ONVIFDepay(metadataHandler);
        this.insertAfter(this.rtsp, onvifDepay);
    }
}
//# sourceMappingURL=html5-video-metadata-pipeline.js.map
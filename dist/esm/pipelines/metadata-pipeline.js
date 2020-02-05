import { RtspPipeline } from './rtsp-pipeline';
import { ONVIFDepay } from '../components/onvifdepay';
import { WSSource } from '../components/ws-source';
// Default configuration for XML event stream
const DEFAULT_RTSP_PARAMETERS = {
    parameters: ['audio=0', 'video=0', 'event=on', 'ptz=all'],
};
/**
 * Pipeline that can receive XML metadata over RTP
 * over WebSocket and pass it to a handler.
 */
export class MetadataPipeline extends RtspPipeline {
    constructor(config) {
        const { ws: wsConfig, rtsp: rtspConfig, metadataHandler } = config;
        super(Object.assign({}, DEFAULT_RTSP_PARAMETERS, rtspConfig));
        const onvifDepay = new ONVIFDepay(metadataHandler);
        this.append(onvifDepay);
        const waitForWs = WSSource.open(wsConfig);
        this.ready = waitForWs.then(wsSource => {
            wsSource.onServerClose = () => {
                this.onServerClose && this.onServerClose();
            };
            this.prepend(wsSource);
            this._src = wsSource;
        });
    }
    close() {
        this._src && this._src.outgoing.end();
    }
}
//# sourceMappingURL=metadata-pipeline.js.map
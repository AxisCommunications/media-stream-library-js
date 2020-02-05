"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rtsp_pipeline_1 = require("./rtsp-pipeline");
const onvifdepay_1 = require("../components/onvifdepay");
const ws_source_1 = require("../components/ws-source");
// Default configuration for XML event stream
const DEFAULT_RTSP_PARAMETERS = {
    parameters: ['audio=0', 'video=0', 'event=on', 'ptz=all'],
};
/**
 * Pipeline that can receive XML metadata over RTP
 * over WebSocket and pass it to a handler.
 */
class MetadataPipeline extends rtsp_pipeline_1.RtspPipeline {
    constructor(config) {
        const { ws: wsConfig, rtsp: rtspConfig, metadataHandler } = config;
        super(Object.assign({}, DEFAULT_RTSP_PARAMETERS, rtspConfig));
        const onvifDepay = new onvifdepay_1.ONVIFDepay(metadataHandler);
        this.append(onvifDepay);
        const waitForWs = ws_source_1.WSSource.open(wsConfig);
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
exports.MetadataPipeline = MetadataPipeline;
//# sourceMappingURL=metadata-pipeline.js.map
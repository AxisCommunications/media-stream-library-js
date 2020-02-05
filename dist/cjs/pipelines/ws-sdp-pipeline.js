"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rtsp_session_1 = require("../components/rtsp-session");
const ws_source_1 = require("../components/ws-source");
const auth_1 = require("../components/auth");
const rtsp_pipeline_1 = require("./rtsp-pipeline");
/**
 * Pipeline that can receive the SDP object for an RTS stream.
 *
 * @class WsSdpPipeline
 * @extends {RtspPipeline}
 */
class WsSdpPipeline extends rtsp_pipeline_1.RtspPipeline {
    /**
     * Creates an instance of Html5VideoPipeline.
     * @param {any} [config={}] Component options
     * @memberof Html5VideoPipeline
     */
    constructor(config) {
        const { ws: wsConfig, rtsp: rtspConfig, auth: authConfig } = config;
        super(rtspConfig);
        if (authConfig) {
            const auth = new auth_1.Auth(authConfig);
            this.insertBefore(this.rtsp, auth);
        }
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
    get sdp() {
        return this.ready.then(() => {
            const sdpPromise = new Promise(resolve => {
                this.rtsp.onSdp = resolve;
            });
            this.rtsp.send({ method: rtsp_session_1.RTSP_METHOD.DESCRIBE });
            this.rtsp.send({ method: rtsp_session_1.RTSP_METHOD.TEARDOWN });
            return sdpPromise;
        });
    }
}
exports.WsSdpPipeline = WsSdpPipeline;
//# sourceMappingURL=ws-sdp-pipeline.js.map
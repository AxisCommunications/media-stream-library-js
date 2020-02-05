import { RTSP_METHOD } from '../components/rtsp-session';
import { WSSource } from '../components/ws-source';
import { Auth } from '../components/auth';
import { RtspPipeline } from './rtsp-pipeline';
/**
 * Pipeline that can receive the SDP object for an RTS stream.
 *
 * @class WsSdpPipeline
 * @extends {RtspPipeline}
 */
export class WsSdpPipeline extends RtspPipeline {
    /**
     * Creates an instance of Html5VideoPipeline.
     * @param {any} [config={}] Component options
     * @memberof Html5VideoPipeline
     */
    constructor(config) {
        const { ws: wsConfig, rtsp: rtspConfig, auth: authConfig } = config;
        super(rtspConfig);
        if (authConfig) {
            const auth = new Auth(authConfig);
            this.insertBefore(this.rtsp, auth);
        }
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
    get sdp() {
        return this.ready.then(() => {
            const sdpPromise = new Promise(resolve => {
                this.rtsp.onSdp = resolve;
            });
            this.rtsp.send({ method: RTSP_METHOD.DESCRIBE });
            this.rtsp.send({ method: RTSP_METHOD.TEARDOWN });
            return sdpPromise;
        });
    }
}
//# sourceMappingURL=ws-sdp-pipeline.js.map
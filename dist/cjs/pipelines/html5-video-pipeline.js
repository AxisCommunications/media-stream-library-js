"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rtsp_mp4_pipeline_1 = require("./rtsp-mp4-pipeline");
const mse_1 = require("../components/mse");
const ws_source_1 = require("../components/ws-source");
const auth_1 = require("../components/auth");
/**
 * Pipeline that can receive H264/AAC video over RTP
 * over WebSocket and pass it to a video element.
 *
 * @class Html5VideoPipeline
 * @extends {RtspMp4Pipeline}
 */
class Html5VideoPipeline extends rtsp_mp4_pipeline_1.RtspMp4Pipeline {
    /**
     * Creates an instance of Html5VideoPipeline.
     * @param {any} [config={}] Component options
     * @memberof Html5VideoPipeline
     */
    constructor(config) {
        const { ws: wsConfig, rtsp: rtspConfig, mediaElement, auth: authConfig, } = config;
        super(rtspConfig);
        if (authConfig) {
            const auth = new auth_1.Auth(authConfig);
            this.insertBefore(this.rtsp, auth);
        }
        const mseSink = new mse_1.MseSink(mediaElement);
        mseSink.onSourceOpen = (mse, tracks) => {
            this.onSourceOpen && this.onSourceOpen(mse, tracks);
        };
        this.append(mseSink);
        this._sink = mseSink;
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
    get currentTime() {
        return this._sink.currentTime;
    }
    play() {
        return this._sink.play();
    }
    pause() {
        return this._sink.pause();
    }
}
exports.Html5VideoPipeline = Html5VideoPipeline;
//# sourceMappingURL=html5-video-pipeline.js.map
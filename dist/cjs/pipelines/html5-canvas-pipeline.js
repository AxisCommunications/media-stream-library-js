"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rtsp_mjpeg_pipeline_1 = require("./rtsp-mjpeg-pipeline");
const canvas_1 = require("../components/canvas");
const ws_source_1 = require("../components/ws-source");
const auth_1 = require("../components/auth");
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
class Html5CanvasPipeline extends rtsp_mjpeg_pipeline_1.RtspMjpegPipeline {
    /**
     * Creates an instance of Html5CanvasPipeline.
     * @param {any} [config={}] Component options
     * @memberof Html5CanvasPipeline
     */
    constructor(config) {
        const { ws: wsConfig, rtsp: rtspConfig, mediaElement, auth: authConfig, } = config;
        super(rtspConfig);
        if (authConfig) {
            const auth = new auth_1.Auth(authConfig);
            this.insertBefore(this.rtsp, auth);
        }
        const canvasSink = new canvas_1.CanvasSink(mediaElement);
        canvasSink.onCanplay = () => {
            canvasSink.play();
            this.onCanplay && this.onCanplay();
        };
        canvasSink.onSync = ntpPresentationTime => {
            this.onSync && this.onSync(ntpPresentationTime);
        };
        this.append(canvasSink);
        this._sink = canvasSink;
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
    get bitrate() {
        return this._sink.bitrate;
    }
    get framerate() {
        return this._sink.framerate;
    }
}
exports.Html5CanvasPipeline = Html5CanvasPipeline;
//# sourceMappingURL=html5-canvas-pipeline.js.map
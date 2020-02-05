var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { RtspMjpegPipeline } from './rtsp-mjpeg-pipeline';
import { CanvasSink } from '../components/canvas';
import { WSSource } from '../components/ws-source';
import { Auth } from '../components/auth';
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
var Html5CanvasPipeline = /** @class */ (function (_super) {
    __extends(Html5CanvasPipeline, _super);
    /**
     * Creates an instance of Html5CanvasPipeline.
     * @param {any} [config={}] Component options
     * @memberof Html5CanvasPipeline
     */
    function Html5CanvasPipeline(config) {
        var _this = this;
        var wsConfig = config.ws, rtspConfig = config.rtsp, mediaElement = config.mediaElement, authConfig = config.auth;
        _this = _super.call(this, rtspConfig) || this;
        if (authConfig) {
            var auth = new Auth(authConfig);
            _this.insertBefore(_this.rtsp, auth);
        }
        var canvasSink = new CanvasSink(mediaElement);
        canvasSink.onCanplay = function () {
            canvasSink.play();
            _this.onCanplay && _this.onCanplay();
        };
        canvasSink.onSync = function (ntpPresentationTime) {
            _this.onSync && _this.onSync(ntpPresentationTime);
        };
        _this.append(canvasSink);
        _this._sink = canvasSink;
        var waitForWs = WSSource.open(wsConfig);
        _this.ready = waitForWs.then(function (wsSource) {
            wsSource.onServerClose = function () {
                _this.onServerClose && _this.onServerClose();
            };
            _this.prepend(wsSource);
            _this._src = wsSource;
        });
        return _this;
    }
    Html5CanvasPipeline.prototype.close = function () {
        this._src && this._src.outgoing.end();
    };
    Object.defineProperty(Html5CanvasPipeline.prototype, "currentTime", {
        get: function () {
            return this._sink.currentTime;
        },
        enumerable: true,
        configurable: true
    });
    Html5CanvasPipeline.prototype.play = function () {
        return this._sink.play();
    };
    Html5CanvasPipeline.prototype.pause = function () {
        return this._sink.pause();
    };
    Object.defineProperty(Html5CanvasPipeline.prototype, "bitrate", {
        get: function () {
            return this._sink.bitrate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Html5CanvasPipeline.prototype, "framerate", {
        get: function () {
            return this._sink.framerate;
        },
        enumerable: true,
        configurable: true
    });
    return Html5CanvasPipeline;
}(RtspMjpegPipeline));
export { Html5CanvasPipeline };
//# sourceMappingURL=html5-canvas-pipeline.js.map
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
import { RtspMp4Pipeline } from './rtsp-mp4-pipeline';
import { MseSink } from '../components/mse';
import { WSSource } from '../components/ws-source';
import { Auth } from '../components/auth';
/**
 * Pipeline that can receive H264/AAC video over RTP
 * over WebSocket and pass it to a video element.
 *
 * @class Html5VideoPipeline
 * @extends {RtspMp4Pipeline}
 */
var Html5VideoPipeline = /** @class */ (function (_super) {
    __extends(Html5VideoPipeline, _super);
    /**
     * Creates an instance of Html5VideoPipeline.
     * @param {any} [config={}] Component options
     * @memberof Html5VideoPipeline
     */
    function Html5VideoPipeline(config) {
        var _this = this;
        var wsConfig = config.ws, rtspConfig = config.rtsp, mediaElement = config.mediaElement, authConfig = config.auth;
        _this = _super.call(this, rtspConfig) || this;
        if (authConfig) {
            var auth = new Auth(authConfig);
            _this.insertBefore(_this.rtsp, auth);
        }
        var mseSink = new MseSink(mediaElement);
        mseSink.onSourceOpen = function (mse, tracks) {
            _this.onSourceOpen && _this.onSourceOpen(mse, tracks);
        };
        _this.append(mseSink);
        _this._sink = mseSink;
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
    Html5VideoPipeline.prototype.close = function () {
        this._src && this._src.outgoing.end();
    };
    Object.defineProperty(Html5VideoPipeline.prototype, "currentTime", {
        get: function () {
            return this._sink.currentTime;
        },
        enumerable: true,
        configurable: true
    });
    Html5VideoPipeline.prototype.play = function () {
        return this._sink.play();
    };
    Html5VideoPipeline.prototype.pause = function () {
        return this._sink.pause();
    };
    return Html5VideoPipeline;
}(RtspMp4Pipeline));
export { Html5VideoPipeline };
//# sourceMappingURL=html5-video-pipeline.js.map
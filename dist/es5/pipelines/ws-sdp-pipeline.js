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
var WsSdpPipeline = /** @class */ (function (_super) {
    __extends(WsSdpPipeline, _super);
    /**
     * Creates an instance of Html5VideoPipeline.
     * @param {any} [config={}] Component options
     * @memberof Html5VideoPipeline
     */
    function WsSdpPipeline(config) {
        var _this = this;
        var wsConfig = config.ws, rtspConfig = config.rtsp, authConfig = config.auth;
        _this = _super.call(this, rtspConfig) || this;
        if (authConfig) {
            var auth = new Auth(authConfig);
            _this.insertBefore(_this.rtsp, auth);
        }
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
    WsSdpPipeline.prototype.close = function () {
        this._src && this._src.outgoing.end();
    };
    Object.defineProperty(WsSdpPipeline.prototype, "sdp", {
        get: function () {
            var _this = this;
            return this.ready.then(function () {
                var sdpPromise = new Promise(function (resolve) {
                    _this.rtsp.onSdp = resolve;
                });
                _this.rtsp.send({ method: RTSP_METHOD.DESCRIBE });
                _this.rtsp.send({ method: RTSP_METHOD.TEARDOWN });
                return sdpPromise;
            });
        },
        enumerable: true,
        configurable: true
    });
    return WsSdpPipeline;
}(RtspPipeline));
export { WsSdpPipeline };
//# sourceMappingURL=ws-sdp-pipeline.js.map
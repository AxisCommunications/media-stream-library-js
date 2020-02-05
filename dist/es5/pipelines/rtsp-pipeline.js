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
import { Pipeline } from './pipeline';
import { RtspParser } from '../components/rtsp-parser';
import { RtspSession } from '../components/rtsp-session';
/**
 * A pipeline that converts interleaved RTSP/RTP
 * into a series of RTP, RTCP, and RTSP packets.
 * The pipeline exposes the RTSP session component
 * as `this.session`, and wraps its play, pause
 * and stop methods.
 *
 * The following handlers can be defined:
 * - onSdp: called when the session descript protocol
 *          is available, with the SDP object as argument
 * - onPlay: called when a response from the PLAY command
 *           arrives, with the play range as argument
 */
var RtspPipeline = /** @class */ (function (_super) {
    __extends(RtspPipeline, _super);
    function RtspPipeline(rtspConfig) {
        var _this = this;
        var rtspParser = new RtspParser();
        var rtspSession = new RtspSession(rtspConfig);
        rtspSession.onSdp = function (sdp) {
            _this.onSdp && _this.onSdp(sdp);
        };
        rtspSession.onPlay = function (range) {
            _this.onPlay && _this.onPlay(range);
        };
        _this = _super.call(this, rtspParser, rtspSession) || this;
        // Expose session for external use
        _this.rtsp = rtspSession;
        return _this;
    }
    return RtspPipeline;
}(Pipeline));
export { RtspPipeline };
//# sourceMappingURL=rtsp-pipeline.js.map
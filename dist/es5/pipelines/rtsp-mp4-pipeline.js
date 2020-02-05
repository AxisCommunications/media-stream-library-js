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
import { RtspPipeline } from './rtsp-pipeline';
import { H264Depay } from '../components/h264depay';
import { AACDepay } from '../components/aacdepay';
import { Mp4Muxer } from '../components/mp4muxer';
/**
 * A pipeline that deals with H264/AAC encoded video
 * sent over RTP, and converts it to streaming MP4
 * format.
 *
 * The following handlers can be defined:
 * - onSync: called when the NTP time of the first frame
 *           is known, with the timestamp as argument
 *           (the timestamp is UNIX milliseconds)
 */
var RtspMp4Pipeline = /** @class */ (function (_super) {
    __extends(RtspMp4Pipeline, _super);
    function RtspMp4Pipeline(rtspConfig) {
        var _this = _super.call(this, rtspConfig) || this;
        var h264Depay = new H264Depay();
        var aacDepay = new AACDepay();
        var mp4Muxer = new Mp4Muxer();
        mp4Muxer.onSync = function (ntpPresentationTime) {
            _this.onSync && _this.onSync(ntpPresentationTime);
        };
        _this.append(h264Depay, aacDepay, mp4Muxer);
        _this._mp4Muxer = mp4Muxer;
        return _this;
    }
    Object.defineProperty(RtspMp4Pipeline.prototype, "bitrate", {
        get: function () {
            return this._mp4Muxer.bitrate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RtspMp4Pipeline.prototype, "framerate", {
        get: function () {
            return this._mp4Muxer.framerate;
        },
        enumerable: true,
        configurable: true
    });
    return RtspMp4Pipeline;
}(RtspPipeline));
export { RtspMp4Pipeline };
//# sourceMappingURL=rtsp-mp4-pipeline.js.map
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
import { JPEGDepay } from '../components/jpegdepay';
/**
 * A pipeline that deals with JPEG encoded video
 * sent over RTP, and converts it to motion JPEG
 * format.
 */
var RtspMjpegPipeline = /** @class */ (function (_super) {
    __extends(RtspMjpegPipeline, _super);
    function RtspMjpegPipeline(rtspConfig) {
        var _this = _super.call(this, rtspConfig) || this;
        var jpegDepay = new JPEGDepay();
        _this.append(jpegDepay);
        return _this;
    }
    return RtspMjpegPipeline;
}(RtspPipeline));
export { RtspMjpegPipeline };
//# sourceMappingURL=rtsp-mjpeg-pipeline.js.map
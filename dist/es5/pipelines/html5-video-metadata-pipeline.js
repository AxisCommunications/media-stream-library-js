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
import { Html5VideoPipeline } from './html5-video-pipeline';
import { ONVIFDepay } from '../components/onvifdepay';
/**
 * Pipeline that can receive H264/AAC video over RTP
 * over WebSocket and pass it to a video element.
 * Additionally, this pipeline passes XML metadata sent
 * in the same stream to a handler.
 */
var Html5VideoMetadataPipeline = /** @class */ (function (_super) {
    __extends(Html5VideoMetadataPipeline, _super);
    function Html5VideoMetadataPipeline(config) {
        var _this = this;
        var metadataHandler = config.metadataHandler;
        _this = _super.call(this, config) || this;
        var onvifDepay = new ONVIFDepay(metadataHandler);
        _this.insertAfter(_this.rtsp, onvifDepay);
        return _this;
    }
    return Html5VideoMetadataPipeline;
}(Html5VideoPipeline));
export { Html5VideoMetadataPipeline };
//# sourceMappingURL=html5-video-metadata-pipeline.js.map
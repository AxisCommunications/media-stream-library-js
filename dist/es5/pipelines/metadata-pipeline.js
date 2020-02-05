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
import { ONVIFDepay } from '../components/onvifdepay';
import { WSSource } from '../components/ws-source';
// Default configuration for XML event stream
var DEFAULT_RTSP_PARAMETERS = {
    parameters: ['audio=0', 'video=0', 'event=on', 'ptz=all'],
};
/**
 * Pipeline that can receive XML metadata over RTP
 * over WebSocket and pass it to a handler.
 */
var MetadataPipeline = /** @class */ (function (_super) {
    __extends(MetadataPipeline, _super);
    function MetadataPipeline(config) {
        var _this = this;
        var wsConfig = config.ws, rtspConfig = config.rtsp, metadataHandler = config.metadataHandler;
        _this = _super.call(this, Object.assign({}, DEFAULT_RTSP_PARAMETERS, rtspConfig)) || this;
        var onvifDepay = new ONVIFDepay(metadataHandler);
        _this.append(onvifDepay);
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
    MetadataPipeline.prototype.close = function () {
        this._src && this._src.outgoing.end();
    };
    return MetadataPipeline;
}(RtspPipeline));
export { MetadataPipeline };
//# sourceMappingURL=metadata-pipeline.js.map
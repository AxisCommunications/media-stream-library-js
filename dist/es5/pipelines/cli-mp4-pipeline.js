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
import { TcpSource } from '../components/tcp';
import { RtspMp4Pipeline } from './rtsp-mp4-pipeline';
import { MessageType } from '../components/message';
import { Auth } from '../components/auth';
import { Sink } from '../components/component';
var CliMp4Pipeline = /** @class */ (function (_super) {
    __extends(CliMp4Pipeline, _super);
    /**
     * Create a pipeline which is a linked list of components.
     * Works naturally with only a single component.
     * @param {Array} components The ordered components of the pipeline
     */
    function CliMp4Pipeline(config) {
        var _this = this;
        var rtspConfig = config.rtsp, authConfig = config.auth;
        _this = _super.call(this, rtspConfig) || this;
        var auth = new Auth(authConfig);
        _this.insertBefore(_this.rtsp, auth);
        var tcpSource = new TcpSource();
        var dataSaver = process.stdout.isTTY
            ? function (msg) { return console.log(msg.type, msg.data); }
            : function (msg) {
                return msg.type === MessageType.ISOM && process.stdout.write(msg.data);
            };
        var videoSink = Sink.fromHandler(dataSaver);
        _this.prepend(tcpSource);
        _this.append(videoSink);
        return _this;
    }
    return CliMp4Pipeline;
}(RtspMp4Pipeline));
export { CliMp4Pipeline };
//# sourceMappingURL=cli-mp4-pipeline.js.map
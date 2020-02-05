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
import { Server } from 'ws';
import { WSSink } from '../components/ws-sink';
import { TcpSource } from '../components/tcp';
var TcpWsProxyPipeline = /** @class */ (function (_super) {
    __extends(TcpWsProxyPipeline, _super);
    function TcpWsProxyPipeline(config) {
        if (config === void 0) { config = {}; }
        var _this = this;
        var wss = new Server(config);
        wss.on('connection', function (socket) {
            var wsSink = new WSSink(socket);
            var tcpSource = new TcpSource();
            _this.init(tcpSource, wsSink);
        });
        _this = _super.call(this) || this;
        // Expose WebSocket Server for external use
        _this.wss = wss;
        return _this;
    }
    return TcpWsProxyPipeline;
}(Pipeline));
export { TcpWsProxyPipeline };
//# sourceMappingURL=tcp-ws-proxy-pipeline.js.map
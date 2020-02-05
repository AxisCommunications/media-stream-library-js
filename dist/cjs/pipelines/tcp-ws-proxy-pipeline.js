"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pipeline_1 = require("./pipeline");
const ws_1 = require("ws");
const ws_sink_1 = require("../components/ws-sink");
const tcp_1 = require("../components/tcp");
class TcpWsProxyPipeline extends pipeline_1.Pipeline {
    constructor(config = {}) {
        const wss = new ws_1.Server(config);
        wss.on('connection', socket => {
            const wsSink = new ws_sink_1.WSSink(socket);
            const tcpSource = new tcp_1.TcpSource();
            this.init(tcpSource, wsSink);
        });
        super();
        // Expose WebSocket Server for external use
        this.wss = wss;
    }
}
exports.TcpWsProxyPipeline = TcpWsProxyPipeline;
//# sourceMappingURL=tcp-ws-proxy-pipeline.js.map
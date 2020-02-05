"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tcp_1 = require("../components/tcp");
const rtsp_mp4_pipeline_1 = require("./rtsp-mp4-pipeline");
const message_1 = require("../components/message");
const auth_1 = require("../components/auth");
const component_1 = require("../components/component");
class CliMp4Pipeline extends rtsp_mp4_pipeline_1.RtspMp4Pipeline {
    /**
     * Create a pipeline which is a linked list of components.
     * Works naturally with only a single component.
     * @param {Array} components The ordered components of the pipeline
     */
    constructor(config) {
        const { rtsp: rtspConfig, auth: authConfig } = config;
        super(rtspConfig);
        const auth = new auth_1.Auth(authConfig);
        this.insertBefore(this.rtsp, auth);
        const tcpSource = new tcp_1.TcpSource();
        const dataSaver = process.stdout.isTTY
            ? (msg) => console.log(msg.type, msg.data)
            : (msg) => msg.type === message_1.MessageType.ISOM && process.stdout.write(msg.data);
        const videoSink = component_1.Sink.fromHandler(dataSaver);
        this.prepend(tcpSource);
        this.append(videoSink);
    }
}
exports.CliMp4Pipeline = CliMp4Pipeline;
//# sourceMappingURL=cli-mp4-pipeline.js.map
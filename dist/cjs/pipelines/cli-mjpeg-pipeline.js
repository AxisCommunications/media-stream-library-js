"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../components/auth");
const rtsp_mjpeg_pipeline_1 = require("./rtsp-mjpeg-pipeline");
const tcp_1 = require("../components/tcp");
const message_1 = require("../components/message");
const component_1 = require("../components/component");
class CliMjpegPipeline extends rtsp_mjpeg_pipeline_1.RtspMjpegPipeline {
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
            : (msg) => msg.type === message_1.MessageType.JPEG && process.stdout.write(msg.data);
        const videoSink = component_1.Sink.fromHandler(dataSaver);
        this.prepend(tcpSource);
        this.append(videoSink);
    }
}
exports.CliMjpegPipeline = CliMjpegPipeline;
//# sourceMappingURL=cli-mjpeg-pipeline.js.map
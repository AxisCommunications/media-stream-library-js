"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rtsp_pipeline_1 = require("./rtsp-pipeline");
const jpegdepay_1 = require("../components/jpegdepay");
/**
 * A pipeline that deals with JPEG encoded video
 * sent over RTP, and converts it to motion JPEG
 * format.
 */
class RtspMjpegPipeline extends rtsp_pipeline_1.RtspPipeline {
    constructor(rtspConfig) {
        super(rtspConfig);
        const jpegDepay = new jpegdepay_1.JPEGDepay();
        this.append(jpegDepay);
    }
}
exports.RtspMjpegPipeline = RtspMjpegPipeline;
//# sourceMappingURL=rtsp-mjpeg-pipeline.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rtsp_pipeline_1 = require("./rtsp-pipeline");
const h264depay_1 = require("../components/h264depay");
const aacdepay_1 = require("../components/aacdepay");
const mp4muxer_1 = require("../components/mp4muxer");
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
class RtspMp4Pipeline extends rtsp_pipeline_1.RtspPipeline {
    constructor(rtspConfig) {
        super(rtspConfig);
        const h264Depay = new h264depay_1.H264Depay();
        const aacDepay = new aacdepay_1.AACDepay();
        const mp4Muxer = new mp4muxer_1.Mp4Muxer();
        mp4Muxer.onSync = ntpPresentationTime => {
            this.onSync && this.onSync(ntpPresentationTime);
        };
        this.append(h264Depay, aacDepay, mp4Muxer);
        this._mp4Muxer = mp4Muxer;
    }
    get bitrate() {
        return this._mp4Muxer.bitrate;
    }
    get framerate() {
        return this._mp4Muxer.framerate;
    }
}
exports.RtspMp4Pipeline = RtspMp4Pipeline;
//# sourceMappingURL=rtsp-mp4-pipeline.js.map
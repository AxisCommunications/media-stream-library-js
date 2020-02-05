"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pipeline_1 = require("./pipeline");
const rtsp_parser_1 = require("../components/rtsp-parser");
const rtsp_session_1 = require("../components/rtsp-session");
/**
 * A pipeline that converts interleaved RTSP/RTP
 * into a series of RTP, RTCP, and RTSP packets.
 * The pipeline exposes the RTSP session component
 * as `this.session`, and wraps its play, pause
 * and stop methods.
 *
 * The following handlers can be defined:
 * - onSdp: called when the session descript protocol
 *          is available, with the SDP object as argument
 * - onPlay: called when a response from the PLAY command
 *           arrives, with the play range as argument
 */
class RtspPipeline extends pipeline_1.Pipeline {
    constructor(rtspConfig) {
        const rtspParser = new rtsp_parser_1.RtspParser();
        const rtspSession = new rtsp_session_1.RtspSession(rtspConfig);
        rtspSession.onSdp = sdp => {
            this.onSdp && this.onSdp(sdp);
        };
        rtspSession.onPlay = range => {
            this.onPlay && this.onPlay(range);
        };
        super(rtspParser, rtspSession);
        // Expose session for external use
        this.rtsp = rtspSession;
    }
}
exports.RtspPipeline = RtspPipeline;
//# sourceMappingURL=rtsp-pipeline.js.map
import { RtspPipeline } from './rtsp-pipeline';
import { JPEGDepay } from '../components/jpegdepay';
/**
 * A pipeline that deals with JPEG encoded video
 * sent over RTP, and converts it to motion JPEG
 * format.
 */
export class RtspMjpegPipeline extends RtspPipeline {
    constructor(rtspConfig) {
        super(rtspConfig);
        const jpegDepay = new JPEGDepay();
        this.append(jpegDepay);
    }
}
//# sourceMappingURL=rtsp-mjpeg-pipeline.js.map
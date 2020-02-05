import { RtspMp4Pipeline } from './rtsp-mp4-pipeline';
import { MseSink } from '../components/mse';
import { WSSource } from '../components/ws-source';
import { Auth } from '../components/auth';
/**
 * Pipeline that can receive H264/AAC video over RTP
 * over WebSocket and pass it to a video element.
 *
 * @class Html5VideoPipeline
 * @extends {RtspMp4Pipeline}
 */
export class Html5VideoPipeline extends RtspMp4Pipeline {
    /**
     * Creates an instance of Html5VideoPipeline.
     * @param {any} [config={}] Component options
     * @memberof Html5VideoPipeline
     */
    constructor(config) {
        const { ws: wsConfig, rtsp: rtspConfig, mediaElement, auth: authConfig, } = config;
        super(rtspConfig);
        if (authConfig) {
            const auth = new Auth(authConfig);
            this.insertBefore(this.rtsp, auth);
        }
        const mseSink = new MseSink(mediaElement);
        mseSink.onSourceOpen = (mse, tracks) => {
            this.onSourceOpen && this.onSourceOpen(mse, tracks);
        };
        this.append(mseSink);
        this._sink = mseSink;
        const waitForWs = WSSource.open(wsConfig);
        this.ready = waitForWs.then(wsSource => {
            wsSource.onServerClose = () => {
                this.onServerClose && this.onServerClose();
            };
            this.prepend(wsSource);
            this._src = wsSource;
        });
    }
    close() {
        this._src && this._src.outgoing.end();
    }
    get currentTime() {
        return this._sink.currentTime;
    }
    play() {
        return this._sink.play();
    }
    pause() {
        return this._sink.pause();
    }
}
//# sourceMappingURL=html5-video-pipeline.js.map
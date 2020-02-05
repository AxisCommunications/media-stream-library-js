import { AuthConfig } from '../components/auth';
import { RtspMjpegPipeline } from './rtsp-mjpeg-pipeline';
import { RtspConfig } from '../components/rtsp-session';
interface RtspAuthConfig {
    rtsp?: RtspConfig;
    auth?: AuthConfig;
}
export declare class CliMjpegPipeline extends RtspMjpegPipeline {
    /**
     * Create a pipeline which is a linked list of components.
     * Works naturally with only a single component.
     * @param {Array} components The ordered components of the pipeline
     */
    constructor(config: RtspAuthConfig);
}
export {};

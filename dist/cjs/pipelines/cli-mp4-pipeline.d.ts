import { RtspConfig } from '../components/rtsp-session';
import { RtspMp4Pipeline } from './rtsp-mp4-pipeline';
import { AuthConfig } from '../components/auth';
interface RtspAuthConfig {
    rtsp?: RtspConfig;
    auth?: AuthConfig;
}
export declare class CliMp4Pipeline extends RtspMp4Pipeline {
    /**
     * Create a pipeline which is a linked list of components.
     * Works naturally with only a single component.
     * @param {Array} components The ordered components of the pipeline
     */
    constructor(config: RtspAuthConfig);
}
export {};
